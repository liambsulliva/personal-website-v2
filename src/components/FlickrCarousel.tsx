import React, { useEffect, useState } from "react";

interface FlickrCarouselProps {
  apiKey: string;
  userId: string;
}

const FlickrCarousel: React.FC<FlickrCarouselProps> = ({ apiKey, userId }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loadedImages, setLoadedImages] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  useEffect(() => {
    const fetchPhotos = async () => {
      const response = await fetch(
        `https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=${apiKey}&photoset_id=72177720322629076&user_id=${userId}&format=json&nojsoncallback=1`,
      );
      const data = await response.json();

      const photosArray = data.photoset.photo;
      const albumPhotos: string[] = [];

      // GET: 5 photos from Carousel album
      for (let i = 0; i < 5; i++) {
        const photo = photosArray[i];
        const photoUrl = `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_b.jpg`;
        albumPhotos.push(photoUrl);
      }

      setPhotos(albumPhotos);
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

  return (
    <div
      id="default-carousel"
      className="relative w-full"
      data-carousel="static"
    >
      <div className="relative h-56 overflow-hidden rounded-lg md:h-96 lg:mx-28">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="hidden duration-700 ease-in-out"
            data-carousel-item
          >
            <div className="relative h-full w-full">
              {!loadedImages[index] && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#303030] via-[#383838] to-[#303030]" />
              )}
              {photos[index] && (
                <img
                  src={photos[index]}
                  alt=""
                  loading={index === 0 ? "eager" : "lazy"}
                  className={`absolute left-1/2 top-1/2 block w-full -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
                    loadedImages[index] ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => handleImageLoad(index)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="group absolute start-0 top-0 z-30 flex h-full cursor-pointer items-center justify-center px-4 focus:outline-none"
        data-carousel-prev
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/30 group-hover:bg-white/50 group-focus:outline-none group-focus:ring-4 group-focus:ring-white dark:bg-gray-800/30 dark:group-hover:bg-gray-800/60 dark:group-focus:ring-gray-800/70">
          <svg
            className="h-4 w-4 text-white dark:text-gray-800 rtl:rotate-180"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 1 1 5l4 4"
            />
          </svg>
          <span className="sr-only">Previous</span>
        </span>
      </button>
      <button
        type="button"
        className="group absolute end-0 top-0 z-30 flex h-full cursor-pointer items-center justify-center px-4 focus:outline-none"
        data-carousel-next
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/30 group-hover:bg-white/50 group-focus:outline-none group-focus:ring-4 group-focus:ring-white dark:bg-gray-800/30 dark:group-hover:bg-gray-800/60 dark:group-focus:ring-gray-800/70">
          <svg
            className="h-4 w-4 text-white dark:text-gray-800 rtl:rotate-180"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 9 4-4-4-4"
            />
          </svg>
          <span className="sr-only">Next</span>
        </span>
      </button>
    </div>
  );
};

export default FlickrCarousel;
