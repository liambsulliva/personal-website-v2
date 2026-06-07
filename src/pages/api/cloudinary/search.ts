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

export const POST: APIRoute = async ({ request }) => {
  //console.log("=== API Route: /api/cloudinary/search ===");

  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  //console.log("Cloud Name:", cloudName);
  //console.log("API Key:", apiKey ? `${apiKey.substring(0, 4)}...` : "MISSING");
  //console.log(
  //  "API Secret:",
  //  apiSecret ? `${apiSecret.substring(0, 4)}...` : "MISSING",
  //);

  if (!cloudName || !apiKey || !apiSecret) {
    //console.error("Missing Cloudinary credentials");
    return new Response(
      JSON.stringify({ error: "Missing Cloudinary credentials" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body;
  try {
    const text = await request.text();
    //console.log("Raw request body:", text);
    body = text ? JSON.parse(text) : {};
    //console.log("Parsed request body:", body);

    const isDashboardSearch =
      body && typeof body === "object"
        ? (body as { dashboard?: unknown }).dashboard === true
        : false;
    const publicSearchBody = sanitizePublicCloudinarySearch(body);

    if (!publicSearchBody && !isDashboardSearch) {
      return new Response(
        JSON.stringify({ error: "Unsupported Cloudinary search request" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
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

    const auth = btoa(`${apiKey}:${apiSecret}`);
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;

    // Handle randomization with a bounded Cloudinary search instead of fetching every asset.
    if (randomize) {
      const expression =
        typeof cloudinaryBody.expression === "string"
          ? cloudinaryBody.expression
          : "resource_type:image";

      const randomSortField = getRandomItem(RANDOM_SORT_FIELDS);
      const randomSortDirection = Math.random() > 0.5 ? "desc" : "asc";
      const randomizedSearchBody = {
        ...cloudinaryBody,
        expression: combineCloudinaryExpressions(
          expression,
          LANDSCAPE_EXPRESSION,
          buildExcludedPublicIdsExpression(excludeIds),
        ),
        sort_by: [{ [randomSortField]: randomSortDirection }],
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(randomizedSearchBody),
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        return new Response(
          JSON.stringify({
            error: "Invalid response from Cloudinary",
            details: responseText,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Regular (non-randomized) requests - always fetch fresh data for fetcher/featured carousel

    //console.log("Fetching fresh data from:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(cloudinaryBody),
    });

    //console.log("Cloudinary response status:", response.status);
    //console.log("Cloudinary response ok:", response.ok);

    const responseText = await response.text();
    //console.log("Cloudinary raw response:", responseText);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      //console.error("Failed to parse Cloudinary response:", parseError);
      //console.error("Response text was:", responseText);
      return new Response(
        JSON.stringify({
          error: "Invalid response from Cloudinary",
          details: responseText,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    //console.log("Cloudinary response data:", data);

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    //console.error("API Route Error:", error);
    if (error instanceof Error) {
      //console.error("Error message:", error.message);
      //console.error("Error stack:", error.stack);
    }
    return new Response(
      JSON.stringify({
        error: "Failed to fetch from Cloudinary",
        details: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
