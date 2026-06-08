export const getCloudinaryCredentials = () => {
  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { apiKey, apiSecret, cloudName };
};

export const mutateCloudinaryTags = async ({
  apiKey,
  apiSecret,
  cloudName,
  command,
  publicId,
  tag,
}: {
  apiKey: string;
  apiSecret: string;
  cloudName: string;
  command: "add" | "remove";
  publicId: string;
  tag: string;
}) => {
  const auth = btoa(`${apiKey}:${apiSecret}`);
  const params = new URLSearchParams();
  params.append("public_ids[]", publicId);
  params.append("tag", tag);
  params.append("command", command);

  const tagsUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/tags`;

  return fetch(tagsUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
};
