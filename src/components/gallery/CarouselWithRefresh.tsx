import React, { useEffect, useState } from "react";
import CloudinaryCarousel from "./CloudinaryCarousel";

const CarouselWithRefresh: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentImageIds, setCurrentImageIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleImagesLoaded = (imageIds: string[]) => {
    setCurrentImageIds(imageIds);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
    window.dispatchEvent(
      new CustomEvent("carousel-loading", { detail: { isLoading: loading } }),
    );
  };

  // Listen for dice button click as long as we're not currently loading
  useEffect(() => {
    const handleDiceClick = () => {
      if (!isLoading) {
        handleRefresh();
      }
    };

    window.addEventListener("dice-click", handleDiceClick);
    return () => window.removeEventListener("dice-click", handleDiceClick);
  }, [isLoading]);

  return (
    <CloudinaryCarousel
      refreshTrigger={refreshTrigger}
      onImagesLoaded={handleImagesLoaded}
      onLoadingChange={handleLoadingChange}
    />
  );
};

export default CarouselWithRefresh;
