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
    >
      <p
        className={`text-nowrap text-black transition-all duration-100 group-hover:translate-x-[-15px]`}
      >
        {direction === "next" ? "→" : "←"}
      </p>
    </button>
  );
};

interface FlickrCarouselProps {
  apiKey: string;
  userId: string;
}

const FlickrCarousel: React.FC<FlickrCarouselProps> = ({ apiKey, userId }) => {
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
      try {
        const response = await fetch(
          `https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=${apiKey}&photoset_id=72177720322629076&user_id=${userId}&format=json&nojsoncallback=1`,
        );
        const data = await response.json();

        const photosArray = data.photoset.photo;
        const albumPhotos: string[] = [];

        // GET: 5 photos from Carousel album
        for (let i = 0; i < 5; i++) {
          const photo = photosArray[i];
          const photoUrl = `https://farm${photo.farm}.staticFlickr.com/${photo.server}/${photo.id}_${photo.secret}_b.jpg`;
          albumPhotos.push(photoUrl);
        }

        setPhotos(albumPhotos);
      } catch (error) {
        console.error("Failed to fetch Flickr photos:", error);
      }
    };

    fetchPhotos();
  }, [apiKey, userId]);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % 5);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + 5) % 5);
  }, []);

  // Keyboard Nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

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
              alt={`Carousel slide ${index + 1}`}
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
        {[0, 1, 2, 3, 4].map((index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
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

export default FlickrCarousel;
