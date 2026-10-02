// YOU'RE TELLING ME IT WAS THIS THE WHOLE TIME?
export const prerender = false;

import type { APIRoute } from "astro";
import { requireDashboardApiRequest } from "../../../lib/dashboardAuth";
import { sanitizePublicCloudinarySearch } from "../../../lib/cloudinarySearchPolicy";

const RANDOM_SORT_FIELDS = [
  "created_at",
  "uploaded_at",
  "public_id",
  "bytes",
  "width",
  "height",
  "aspect_ratio",
  "pixels",
] as const;

const LANDSCAPE_EXPRESSION = "aspect_ratio > 1";

const JSON_HEADERS = { "Content-Type": "application/json" };
const PUBLIC_CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=86400";

const getRandomItem = <T>(items: readonly T[]) =>
  items[Math.floor(Math.random() * items.length)];

const escapeCloudinarySearchValue = (value: string) =>
  value.replace(/(["*\\])/g, "\\$1");

const buildExcludedPublicIdsExpression = (excludeIds: unknown) => {
  if (!Array.isArray(excludeIds) || excludeIds.length === 0) {
    return undefined;
  }

  const publicIdExpressions = excludeIds
    .filter((id): id is string => typeof id === "string")
    .map((id) => `public_id="${escapeCloudinarySearchValue(id)}"`);

  if (publicIdExpressions.length === 0) {
    return undefined;
  }

  return `NOT (${publicIdExpressions.join(" OR ")})`;
};

const combineCloudinaryExpressions = (
  expression: string,
  ...filters: Array<string | undefined>
) => [expression, ...filters].filter(Boolean).join(" AND ");

type CloudinarySearchResponse = {
  resources?: Array<Record<string, unknown>>;
  next_cursor?: string;
};

const toPublicSearchResponse = (data: CloudinarySearchResponse) => ({
  resources: (data.resources ?? []).map(
    ({ public_id, secure_url, width, height }) => ({
      public_id,
      secure_url,
      width,
      height,
    }),
  ),
  next_cursor: data.next_cursor,
});

const jsonError = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), { status, headers: JSON_HEADERS });

const searchFromBody = async (
  body: unknown,
  {
    allowDashboard,
    request,
    cacheable,
  }: {
    allowDashboard: boolean;
    request: Request;
    cacheable: boolean;
  },
) => {
  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return jsonError("Missing Cloudinary credentials", 500);
  }

  const isDashboardSearch =
    allowDashboard &&
    body &&
    typeof body === "object" &&
    (body as { dashboard?: unknown }).dashboard === true;
  const publicSearchBody = sanitizePublicCloudinarySearch(body);

  if (!publicSearchBody && !isDashboardSearch) {
    return jsonError("Unsupported Cloudinary search request", 403);
  }

  if (isDashboardSearch) {
    const authFailure = await requireDashboardApiRequest(request);

    if (authFailure) {
      return authFailure;
    }
  }

  const {
    dashboard: _dashboard,
    randomize,
    excludeIds,
    ...cloudinaryBody
  } = isDashboardSearch
    ? (body as Record<string, unknown>)
    : (publicSearchBody as Record<string, unknown>);

  const searchBody = randomize
    ? {
        ...cloudinaryBody,
        expression: combineCloudinaryExpressions(
          typeof cloudinaryBody.expression === "string"
            ? cloudinaryBody.expression
            : "resource_type:image",
          LANDSCAPE_EXPRESSION,
          buildExcludedPublicIdsExpression(excludeIds),
        ),
        sort_by: [
          {
            [getRandomItem(RANDOM_SORT_FIELDS)]:
              Math.random() > 0.5 ? "desc" : "asc",
          },
        ],
      }
    : cloudinaryBody;

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
    {
      method: "POST",
      headers: {
        ...JSON_HEADERS,
        Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
      },
      body: JSON.stringify(searchBody),
    },
  );

  const responseText = await response.text();
  let data: CloudinarySearchResponse;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch (parseError) {
    console.error("Cloudinary search returned invalid JSON", parseError);
    return jsonError("Invalid response from Cloudinary", 500);
  }

  const payload =
    response.ok && !isDashboardSearch ? toPublicSearchResponse(data) : data;

  return new Response(JSON.stringify(payload), {
    status: response.status,
    headers: {
      ...JSON_HEADERS,
      ...(response.ok && cacheable && !randomize
        ? { "Cache-Control": PUBLIC_CACHE_CONTROL }
        : { "Cache-Control": "no-store" }),
    },
  });
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const nextCursor = url.searchParams.get("next_cursor");
    const rawMaxResults = url.searchParams.get("max_results");
    const maxResults = rawMaxResults === null ? 20 : Number(rawMaxResults);

    return await searchFromBody(
      {
        expression: url.searchParams.get("expression"),
        max_results: Number.isFinite(maxResults) ? maxResults : 20,
        ...(nextCursor ? { next_cursor: nextCursor } : {}),
      },
      { allowDashboard: false, request, cacheable: true },
    );
  } catch (error) {
    console.error("Cloudinary search failed", error);
    return jsonError("Failed to fetch from Cloudinary", 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const text = await request.text();
    const body: unknown = text ? JSON.parse(text) : {};

    return await searchFromBody(body, {
      allowDashboard: true,
      request,
      cacheable: false,
    });
  } catch (error) {
    console.error("Cloudinary search failed", error);
    return jsonError("Failed to fetch from Cloudinary", 500);
  }
};
