import type { ImageMetadata } from "astro";
import type { CollectionEntry } from "astro:content";

const srcImages = import.meta.glob<{ default: ImageMetadata }>(
  "../images/editorial/**/*.{png,jpg,jpeg,webp,gif}",
  { eager: true },
);

export function formatDirectoryLabel(directory: string) {
  return directory
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function sectionIdFromEntry(entry: CollectionEntry<"otherWork">) {
  return entry.id.split("/")[0] ?? "personal";
}

export function imageFromPublicPath(publicPath: string | undefined) {
  if (!publicPath) return undefined;
  const suffix = publicPath.replace(/^\/images\//, "");
  const match = Object.entries(srcImages).find(
    ([key]) => key.endsWith(`/${suffix}`) || key.endsWith(suffix),
  );
  return match?.[1].default;
}
