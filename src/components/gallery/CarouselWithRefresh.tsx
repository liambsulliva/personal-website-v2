import React, { useEffect, useState } from "react";
import CloudinaryCarousel from "./CloudinaryCarousel";

const CarouselWithRefresh: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentImageIds, setCurrentImageIds] = useState<string[]>([]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleImagesLoaded = (imageIds: string[]) => {
    setCurrentImageIds(imageIds);
  };

  // Listen for dice button click
  useEffect(() => {
    const handleDiceClick = () => {
      handleRefresh();
    };

    window.addEventListener("dice-click", handleDiceClick);
    return () => window.removeEventListener("dice-click", handleDiceClick);
  }, []);

  return (
    <CloudinaryCarousel
      refreshTrigger={refreshTrigger}
      onImagesLoaded={handleImagesLoaded}
    />
  );
};

export default CarouselWithRefresh;
