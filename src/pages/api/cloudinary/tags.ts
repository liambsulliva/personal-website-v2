import type { APIRoute } from "astro";

export const prerender = false;

const CLOUDINARY_TAGS_PAGE_SIZE = 500;

type CloudinaryTagsResponse = {
  tags?: string[];
  next_cursor?: string | null;
};

export const GET: APIRoute = async () => {
  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return new Response(
      JSON.stringify({ error: "Missing Cloudinary credentials" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const auth = btoa(`${apiKey}:${apiSecret}`);
    const baseUrl = `https://api.cloudinary.com/v1_1/${cloudName}/tags/image`;
    const allTags: string[] = [];
    let nextCursor: string | undefined;

    do {
      const params = new URLSearchParams({
        max_results: String(CLOUDINARY_TAGS_PAGE_SIZE),
      });

      if (nextCursor) {
        params.set("next_cursor", nextCursor);
      }

      const response = await fetch(`${baseUrl}?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      const responseText = await response.text();

      let data: CloudinaryTagsResponse;
      try {
        data = responseText ? JSON.parse(responseText) : { tags: [] };
      } catch (parseError) {
        console.error("Failed to parse Cloudinary response:", parseError);
        console.error("Response text was:", responseText);
        return new Response(
          JSON.stringify({
            error: "Invalid response from Cloudinary",
            details: responseText,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!response.ok) {
        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (Array.isArray(data.tags)) {
        allTags.push(...data.tags);
      }

      nextCursor =
        typeof data.next_cursor === "string" && data.next_cursor.length > 0
          ? data.next_cursor
          : undefined;
    } while (nextCursor);

    return new Response(JSON.stringify({ tags: allTags }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Route Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return new Response(
      JSON.stringify({
        error: "Failed to fetch tags from Cloudinary",
        details: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
