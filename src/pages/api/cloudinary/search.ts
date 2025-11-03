// YOU'RE TELLING ME IT WAS THIS THE WHOLE TIME?
export const prerender = false;

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  console.log("=== API Route: /api/cloudinary/search ===");

  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  console.log("Cloud Name:", cloudName);
  console.log("API Key:", apiKey ? `${apiKey.substring(0, 4)}...` : "MISSING");
  console.log(
    "API Secret:",
    apiSecret ? `${apiSecret.substring(0, 4)}...` : "MISSING",
  );

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Missing Cloudinary credentials");
    return new Response(
      JSON.stringify({ error: "Missing Cloudinary credentials" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body;
  try {
    const text = await request.text();
    console.log("Raw request body:", text);
    body = text ? JSON.parse(text) : {};
    console.log("Parsed request body:", body);

    // Extract custom parameters for server-side processing
    const { randomize, excludeIds, ...cloudinaryBody } = body;

    const auth = btoa(`${apiKey}:${apiSecret}`);
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;

    console.log("Fetching from:", url);

    // If randomization is requested, fetch a larger set in the API route so there's enough images to shuffle and select from
    if (randomize) {
      cloudinaryBody.max_results = 500;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(cloudinaryBody),
    });

    console.log("Cloudinary response status:", response.status);
    console.log("Cloudinary response ok:", response.ok);

    const responseText = await response.text();
    console.log("Cloudinary raw response:", responseText);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
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

    console.log("Cloudinary response data:", data);

    // Check for randomization before doing any server-side processing
    if (randomize && data.resources) {
      let resources = data.resources;

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
      for (let i = resources.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [resources[i], resources[j]] = [resources[j], resources[i]];
      }
      data.resources = resources.slice(0, 5);
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
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
        error: "Failed to fetch from Cloudinary",
        details: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
