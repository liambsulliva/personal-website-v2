import React, { useEffect, useState } from "react";
import SharedCarousel from "../GenericCarousel";

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
}

const CloudinaryCarousel: React.FC = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedImages, setLoadedImages] = useState<boolean[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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

        const requestBody = isInitialLoad
          ? {
              expression: "resource_type:image AND tags=featured",
              max_results: 5,
              with_field: ["tags"],
            }
          : {
              expression: "resource_type:image",
              max_results: 5,
              with_field: ["tags"],
              randomize: true,
              excludeIds: photoIds,
            };

        const response = await fetch("/api/cloudinary/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.resources && data.resources.length > 0) {
          const selectedResources = data.resources;

          const albumPhotos: string[] = selectedResources.map(
            (resource: CloudinaryResource) => {
              return resource.secure_url.replace(
                "/upload/",
                "/upload/c_fill,w_1920,h_1080,q_auto,f_auto/",
              );
            },
          );

          const albumPhotoIds: string[] = selectedResources.map(
            (resource: CloudinaryResource) => resource.public_id,
          );

          setPhotos(albumPhotos);
          setPhotoIds(albumPhotoIds);
          setLoadedImages(Array(albumPhotos.length).fill(false));
        } else {
          console.warn("No images found in response");
        }
      } catch (error) {
        console.error("!!! CloudinaryCarousel ERROR !!!", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
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

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  return (
    <SharedCarousel
      items={photos}
      getKey={(photo, index) => photoIds[index] ?? photo}
      currentIndex={currentSlide}
      onCurrentIndexChange={setCurrentSlide}
      previousLabel="Previous image"
      nextLabel="Next image"
      dotLabel={(index) => `Select image ${index + 1}`}
      renderSlide={({ item: photo, index }) => (
        <>
          {!loadedImages[index] && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#303030] via-[#383838] to-[#303030]" />
          )}

          <img
            src={photo}
            aria-label={`Image ${index + 1}`}
            loading={index === 0 ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover"
            onLoad={() => handleImageLoad(index)}
          />
        </>
      )}
    />
  );
};

export default CloudinaryCarousel;
