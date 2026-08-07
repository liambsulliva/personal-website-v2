/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly RAWG_API_KEY?: string;
  readonly AUTH_USER_HASH?: string;
  readonly AUTH_PASSWORD_HASH?: string;
  readonly CLOUDINARY_CLOUD_NAME?: string;
  readonly CLOUDINARY_API_KEY?: string;
  readonly CLOUDINARY_API_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
