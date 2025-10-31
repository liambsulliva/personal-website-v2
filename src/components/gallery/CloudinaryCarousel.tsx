import React, { useEffect, useState, useCallback, useRef } from "react";

interface NavigationButtonProps {
  label: string;
  isSelected?: boolean;
  onSelect: () => void;
  direction: "prev" | "next";
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  onSelect,
  direction,
}) => {
  return (
    <button
      onClick={onSelect}
      className={`relative flex w-fit flex-row items-center justify-center gap-2 rounded-full bg-[#f0f0f0]/50 px-2 py-0.5 backdrop-blur-sm transition-all duration-100 hover:bg-[#e0e0e0]/70 active:scale-95`}
      aria-label={direction === "next" ? "Next image" : "Previous image"}
    >
      <p
        className={`text-nowrap text-black transition-all duration-100 group-hover:translate-x-[-15px]`}
      >
        {direction === "next" ? "→" : "←"}
      </p>
    </button>
  );
};

interface CloudinaryCarouselProps {}

const CloudinaryCarousel: React.FC<CloudinaryCarouselProps> = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedImages, setLoadedImages] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      console.log("=== CloudinaryCarousel: Starting fetch ===");

      try {
        const requestBody = {
          expression: "resource_type:image AND tags=featured",
          max_results: 5,
          with_field: ["tags"],
        };

        const url = "/api/cloudinary/search";

        console.log("Request URL:", url);
        console.log("Request Body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("Response Status:", response.status);
        console.log("Response OK:", response.ok);

        const data = await response.json();
        console.log("Response Data:", data);

        if (data.resources && data.resources.length > 0) {
          console.log(`Found ${data.resources.length} featured images`);

          // Get up to 5 featured images with optimized transformations
          const albumPhotos: string[] = data.resources
            .slice(0, 5)
            .map((resource: any) => {
              console.log("Processing featured resource:", resource.public_id);
              // Use Cloudinary transformations for optimized carousel display
              return resource.secure_url.replace(
                "/upload/",
                "/upload/c_fill,w_1920,h_1080,q_auto,f_auto/",
              );
            });

          console.log("Carousel photos:", albumPhotos);
          setPhotos(albumPhotos);
          console.log("=== CloudinaryCarousel: Fetch complete ===");
        } else {
          console.warn("No featured images found in response");
          console.log("Data structure:", Object.keys(data));
        }
      } catch (error) {
        console.error("!!! CloudinaryCarousel ERROR !!!", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
      }
    };

    fetchPhotos();
  }, []);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard Nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  if (photos.length === 0) {
    return (
      <div className="relative aspect-video w-full">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#303030] via-[#383838] to-[#303030]" />
      </div>
    );
  }

  return (
    <div ref={carouselRef} className="relative aspect-video w-full">
      {/* Image Container */}
      {photos.map((photo, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${index === currentSlide ? "z-10 opacity-100" : "z-0 opacity-0"} `}
        >
          {/* Placeholder Gradient */}
          {!loadedImages[index] && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#303030] via-[#383838] to-[#303030]" />
          )}

          {photo && (
            <img
              src={photo}
              aria-label={`Image ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover"
              onLoad={() => handleImageLoad(index)}
            />
          )}
        </div>
      ))}

      {/* Nav Buttons */}
      <div className="absolute left-6 top-1/2 z-20 -translate-y-1/2">
        <NavigationButton
          label="Previous"
          onSelect={prevSlide}
          direction="prev"
        />
      </div>
      <div className="absolute right-6 top-1/2 z-20 -translate-y-1/2">
        <NavigationButton label="Next" onSelect={nextSlide} direction="next" />
      </div>
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 space-x-2">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Select image ${index + 1}`}
            className={`h-3 w-3 rounded-full ${
              index === currentSlide
                ? "bg-white"
                : "bg-white/50 hover:bg-white/75"
            } `}
          />
        ))}
      </div>
    </div>
  );
};

export default CloudinaryCarousel;
