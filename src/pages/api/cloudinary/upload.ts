import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  console.log("=== API Route: /api/cloudinary/upload ===");

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

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const tagsJson = formData.get("tags") as string;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let tags: string[] = [];
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
      } catch (e) {
        console.warn("Failed to parse tags:", e);
      }
    }

    console.log("Uploading file:", file.name, "with tags:", tags);

    // Convert file to base64 for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    // Prepare upload data
    const uploadData = new FormData();
    uploadData.append("file", dataURI);
    uploadData.append("upload_preset", "ml_default"); // You may need to create an unsigned preset
    uploadData.append("api_key", apiKey);

    // Add tags if provided
    if (tags.length > 0) {
      uploadData.append("tags", tags.join(","));
    }

    // Generate signature for signed upload
    const timestamp = Math.round(Date.now() / 1000);
    uploadData.append("timestamp", timestamp.toString());

    // Create signature string
    const paramsToSign: Record<string, string> = {
      timestamp: timestamp.toString(),
    };

    if (tags.length > 0) {
      paramsToSign.tags = tags.join(",");
    }

    // Sort parameters alphabetically and create signature string
    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    const signatureString = `${sortedParams}${apiSecret}`;

    // Create SHA-1 signature
    const crypto = await import("crypto");
    const signature = crypto
      .createHash("sha1")
      .update(signatureString)
      .digest("hex");

    uploadData.append("signature", signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    console.log("Uploading to:", uploadUrl);

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: uploadData,
    });

    const responseText = await response.text();
    console.log("Cloudinary response status:", response.status);
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

    if (!response.ok) {
      console.error("Cloudinary upload failed:", data);
      return new Response(JSON.stringify({ error: data.error || "Upload failed" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Upload successful:", data);

    return new Response(
      JSON.stringify({
        url: data.secure_url,
        publicId: data.public_id,
        tags: data.tags || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("API Route Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return new Response(
      JSON.stringify({
        error: "Failed to upload to Cloudinary",
        details: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

