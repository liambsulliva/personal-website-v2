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

export const DELETE: APIRoute = async ({ request }) => {
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

  if (typeof publicId !== "string" || publicId.trim().length === 0) {
    return jsonResponse({ error: "A publicId is required" }, 400);
  }

  try {
    const auth = btoa(`${credentials.apiKey}:${credentials.apiSecret}`);
    const deleteUrl = `https://api.cloudinary.com/v1_1/${credentials.cloudName}/resources/image/upload`;
    const params = new URLSearchParams();
    params.append("public_ids[]", publicId);
    params.append("invalidate", "true");

    const response = await fetch(deleteUrl, {
      method: "DELETE",
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

    const deletedStatus =
      data && typeof data === "object"
        ? (data as { deleted?: Record<string, string> }).deleted?.[publicId]
        : undefined;

    if (deletedStatus && deletedStatus !== "deleted") {
      return jsonResponse(
        {
          error: `Cloudinary reported "${deletedStatus}" for ${publicId}`,
          details: data,
        },
        deletedStatus === "not_found" ? 404 : 502,
      );
    }

    return jsonResponse({
      deleted: true,
      publicId,
      result: data,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "Failed to delete from Cloudinary",
        details: String(error),
      },
      500,
    );
  }
};
