import type { APIRoute } from "astro";
import {
  getCloudinaryCredentials,
  mutateCloudinaryTags,
} from "../../../lib/cloudinaryServer";

export const prerender = false;

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

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
    const response = await mutateCloudinaryTags({
      ...credentials,
      command: "add",
      publicId,
      tag: tag.trim(),
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
