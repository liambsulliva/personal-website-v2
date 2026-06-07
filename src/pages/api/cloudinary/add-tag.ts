import type { APIRoute } from "astro";

export const prerender = false;

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const getCloudinaryCredentials = () => {
  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { apiKey, apiSecret, cloudName };
};

export const POST: APIRoute = async ({ request }) => {
  const credentials = getCloudinaryCredentials();

  if (!credentials) {
    return jsonResponse({ error: "Missing Cloudinary credentials" }, 500);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body" }, 400);
  }

  const publicId =
    body && typeof body === "object"
      ? (body as { publicId?: unknown }).publicId
      : null;
  const tag =
    body && typeof body === "object" ? (body as { tag?: unknown }).tag : null;

  if (typeof publicId !== "string" || publicId.trim().length === 0) {
    return jsonResponse({ error: "A publicId is required" }, 400);
  }

  if (typeof tag !== "string" || tag.trim().length === 0) {
    return jsonResponse({ error: "A tag is required" }, 400);
  }

  try {
    const auth = btoa(`${credentials.apiKey}:${credentials.apiSecret}`);
    const addTagUrl = `https://api.cloudinary.com/v1_1/${credentials.cloudName}/resources/image/tags`;
    const params = new URLSearchParams();
    params.append("public_ids[]", publicId);
    params.append("tag", tag.trim());
    params.append("command", "add");

    const response = await fetch(addTagUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const responseText = await response.text();
    let data: unknown = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      return jsonResponse(
        {
          error: "Invalid response from Cloudinary",
          details: responseText,
        },
        500,
      );
    }

    if (!response.ok) {
      return jsonResponse(data, response.status);
    }

    return jsonResponse({
      addedTag: tag.trim(),
      publicId,
      result: data,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "Failed to add tag to Cloudinary image",
        details: String(error),
      },
      500,
    );
  }
};
