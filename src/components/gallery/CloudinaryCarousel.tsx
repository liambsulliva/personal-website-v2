import React, { useEffect, useState } from "react";
import SharedCarousel from "../GenericCarousel";
import ProgressiveImage from "./ProgressiveImage";
import {
  PLACEHOLDER_WIDTH,
  cappedWidths,
  cloudinaryTransform,
  toSrcSet,
  widthSteps,
} from "../../lib/cloudinaryImage";
import { publicCloudinarySearchUrl } from "../../lib/cloudinarySearchPolicy";

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
}

interface CarouselPhoto {
  id: string;
  placeholderSrc: string;
  srcSet: string;
}

const SLIDE_WIDTHS = widthSteps(PLACEHOLDER_WIDTH, 2240);
const SLIDE_SIZES = [
  "(min-width: 1182px) 1036px",
  "(min-width: 1001px) calc(100vw - 146px)",
  "(min-width: 769px) calc(100vw - 114px)",
  "calc(100vw - 82px)",
].join(", ");

function slideUrl(secureUrl: string, width: number): string {
  return cloudinaryTransform(
    secureUrl,
    `c_fill,w_${width},h_${Math.round((width * 9) / 16)},q_auto,f_auto`,
  );
}

function toCarouselPhoto(resource: CloudinaryResource): CarouselPhoto {
  const maxCropWidth = Math.min(
    resource.width,
    (resource.height * 16) / 9,
    SLIDE_WIDTHS[SLIDE_WIDTHS.length - 1],
  );
  const widths = cappedWidths(SLIDE_WIDTHS, maxCropWidth);

  return {
    id: resource.public_id,
    placeholderSrc: slideUrl(resource.secure_url, widths[0]),
    srcSet: toSrcSet(
      widths.map((width) => ({
        src: slideUrl(resource.secure_url, width),
        width,
      })),
    ),
  };
}

const CloudinaryCarousel: React.FC = () => {
  const [photos, setPhotos] = useState<CarouselPhoto[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sharpIds, setSharpIds] = useState<Set<string>>(new Set());

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
    window.dispatchEvent(
      new CustomEvent("carousel-loading", { detail: { isLoading: loading } }),
    );
  };

  useEffect(() => {
    const handleDiceClick = () => {
      if (!isLoading) {
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    window.addEventListener("dice-click", handleDiceClick);
    return () => window.removeEventListener("dice-click", handleDiceClick);
  }, [isLoading]);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (refreshTrigger > 0) {
        handleLoadingChange(true);
      }

      try {
        const isInitialLoad = refreshTrigger === 0;

        const response = isInitialLoad
          ? await fetch(
              publicCloudinarySearchUrl({
                expression: "resource_type:image AND tags=featured",
                max_results: 5,
              }),
            )
          : await fetch("/api/cloudinary/search", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                expression: "resource_type:image",
                max_results: 5,
                randomize: true,
                excludeIds: photos.map((photo) => photo.id),
              }),
            });

        if (!response.ok) {
          throw new Error(`Search responded with ${response.status}`);
        }

        const data: { resources?: CloudinaryResource[] } =
          await response.json();

        if (data.resources && data.resources.length > 0) {
          setPhotos(data.resources.map(toCarouselPhoto));
          setSharpIds(new Set());
        }
      } catch (error) {
        console.error("CloudinaryCarousel: failed to load photos", error);
      } finally {
        if (refreshTrigger > 0) {
          handleLoadingChange(false);
        }
      }
    };

    fetchPhotos();
  }, [refreshTrigger]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      setCurrentSlide(0);
    }
  }, [refreshTrigger]);

  const currentIsSharp = photos[currentSlide]
    ? sharpIds.has(photos[currentSlide].id)
    : false;
  const neighborIndexes =
    photos.length > 1
      ? new Set([
          (currentSlide + 1) % photos.length,
          (currentSlide - 1 + photos.length) % photos.length,
        ])
      : new Set<number>();

  const markSharp = (id: string) => {
    setSharpIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <SharedCarousel
      items={photos}
      getKey={(photo) => photo.id}
      currentIndex={currentSlide}
      onCurrentIndexChange={setCurrentSlide}
      previousLabel="Previous image"
      nextLabel="Next image"
      dotLabel={(index) => `Select image ${index + 1}`}
      renderSlide={({ item: photo, index, isActive }) => (
        <ProgressiveImage
          placeholderSrc={photo.placeholderSrc}
          srcSet={photo.srcSet}
          sizes={SLIDE_SIZES}
          alt={`Photo ${index + 1}`}
          upgrade={isActive || (currentIsSharp && neighborIndexes.has(index))}
          loading={index === 0 ? "eager" : "lazy"}
          onUpgradeLoad={() => markSharp(photo.id)}
        />
      )}
    />
  );
};

export default CloudinaryCarousel;
