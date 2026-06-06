import type { APIRoute } from "astro";
import crypto from "node:crypto";

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

const parseTags = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  } catch {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

const signParams = (
  params: Record<string, string>,
  apiSecret: string,
) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${sortedParams}${apiSecret}`)
    .digest("hex");
};

const parseCloudinaryResponse = async (response: Response) => {
  const responseText = await response.text();

  try {
    return responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(`Invalid response from Cloudinary: ${responseText}`);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const credentials = getCloudinaryCredentials();

  if (!credentials) {
    return jsonResponse({ error: "Missing Cloudinary credentials" }, 500);
  }

  try {
    const contentType = request.headers.get("content-type");

    if (
      !contentType ||
      (!contentType.includes("multipart/form-data") &&
        !contentType.includes("application/x-www-form-urlencoded"))
    ) {
      return jsonResponse(
        {
          error:
            "Invalid Content-Type. Expected multipart/form-data or application/x-www-form-urlencoded",
          received: contentType,
        },
        400,
      );
    }

    const formData = await request.formData();
    const mode = formData.get("mode");
    const file = formData.get("file");
    const tags = parseTags(formData.get("tags"));
    const uploadUrl = `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`;
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign: Record<string, string> = {
      timestamp: timestamp.toString(),
    };

    if (tags.length > 0) {
      paramsToSign.tags = tags.join(",");
    }

    const signature = signParams(paramsToSign, credentials.apiSecret);

    if (mode === "signature") {
      return jsonResponse({
        apiKey: credentials.apiKey,
        signature,
        tags: tags.length > 0 ? tags.join(",") : undefined,
        timestamp: timestamp.toString(),
        uploadUrl,
      });
    }

    if (!(file instanceof File)) {
      return jsonResponse({ error: "No file provided" }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    const uploadData = new FormData();
    uploadData.append("file", dataURI);
    uploadData.append("api_key", credentials.apiKey);
    uploadData.append("timestamp", timestamp.toString());
    uploadData.append("signature", signature);

    if (tags.length > 0) {
      uploadData.append("tags", tags.join(","));
    }

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: uploadData,
    });
    const data = await parseCloudinaryResponse(response);

    if (!response.ok) {
      return jsonResponse(data, response.status);
    }

    const uploadDataResponse = data as {
      public_id?: unknown;
      secure_url?: unknown;
      tags?: unknown;
    };

    if (
      typeof uploadDataResponse.public_id !== "string" ||
      typeof uploadDataResponse.secure_url !== "string"
    ) {
      return jsonResponse(
        {
          error: "Cloudinary returned an incomplete upload response",
          details: data,
        },
        502,
      );
    }

    return jsonResponse({
      url: uploadDataResponse.secure_url,
      publicId: uploadDataResponse.public_id,
      tags: Array.isArray(uploadDataResponse.tags)
        ? uploadDataResponse.tags
        : [],
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "Failed to upload to Cloudinary",
        details: String(error),
      },
      500,
    );
  }
};
