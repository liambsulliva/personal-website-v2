import type { APIRoute } from "astro";
import { v2 as cloudinary } from "cloudinary";

export const GET: APIRoute = async ({ url }) => {
  const params = new URLSearchParams(url.search);
  const nextCursor = params.get("next_cursor");

  cloudinary.config({
    cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
    api_key: import.meta.env.CLOUDINARY_API_KEY,
    api_secret: import.meta.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "cloudydesktop/portfolio/",
      max_results: 12,
      next_cursor: nextCursor || undefined,
      sort_by: "created_at",
      direction: "desc",
    });

    return new Response(
      JSON.stringify({
        resources: result.resources,
        next_cursor: result.next_cursor,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching images from Cloudinary" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
