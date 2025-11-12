// YOU'RE TELLING ME IT WAS THIS THE WHOLE TIME?
export const prerender = false;

import type { APIRoute } from "astro";

// Cache for randomization requests
interface CacheEntry {
  resources: any[];
  timestamp: number;
}

const photoCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Fetches all photos from Cloudinary when randomizing after 24hrs or cold start
async function fetchAllPhotos(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  expression: string,
): Promise<any[]> {
  const auth = btoa(`${apiKey}:${apiSecret}`);
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;

  let allResources: any[] = [];
  let nextCursor: string | null = null;

  do {
    const requestBody: any = {
      expression,
      max_results: 500,
      with_field: ["tags", "context"],
    };

    if (nextCursor) {
      requestBody.next_cursor = nextCursor;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.resources) {
      allResources = allResources.concat(data.resources);
    }

    nextCursor = data.next_cursor || null;
  } while (nextCursor);

  //console.log(`Fetched ${allResources.length} total photos for cache`);
  return allResources;
}

// Grab cached photos or fetch new ones if cache is invalid
async function getCachedPhotos(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  expression: string,
): Promise<any[]> {
  const cacheKey = expression;
  const cached = photoCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    // Cache hit! Return pics
    return cached.resources;
  }

  // Cache miss! Fetch all photos
  const resources = await fetchAllPhotos(
    cloudName,
    apiKey,
    apiSecret,
    expression,
  );

  photoCache.set(cacheKey, {
    resources,
    timestamp: now,
  });

  return resources;
}

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

    const { randomize, excludeIds, ...cloudinaryBody } = body;

    // Handle randomization via cached data if available
    if (randomize) {
      //console.log("Randomization requested, using cache strategy");

      const expression = cloudinaryBody.expression || "resource_type:image";
      let resources = await getCachedPhotos(
        cloudName,
        apiKey,
        apiSecret,
        expression,
      );

      // Filter for landscape shots (width > height)
      resources = resources.filter(
        (resource: any) => resource.width > resource.height,
      );

      // Exclude the initial 5 "featured" images
      if (excludeIds && excludeIds.length > 0) {
        resources = resources.filter(
          (resource: any) => !excludeIds.includes(resource.public_id),
        );
      }

      // Randomize (via Fisher-Yates algorithm) and select first 5
      // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
      const shuffled = [...resources]; // Create a copy to avoid mutating cache
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const data = {
        resources: shuffled.slice(0, 5),
        total_count: shuffled.length,
      };

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Regular (non-randomized) requests - always fetch fresh data for fetcher/featured carousel
    const auth = btoa(`${apiKey}:${apiSecret}`);
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;

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
