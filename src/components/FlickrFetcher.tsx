import React, { useState, useEffect, useCallback } from "react";
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Loader from "./Loader";
import "yet-another-react-lightbox/styles.css";

interface Photo {
  src: string;
  width: number;
  height: number;
}

const ImageKitFetcher: React.FC = () => {
  const [index, setIndex] = useState(-1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const baseUrl = "https://ik.imagekit.io/liambsulliva/";
  const perPage = 20;

  // Fetch filenames and build photo objects
  const fetchPhotos = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const url = `${baseUrl}?page=${currentPage}&limit=${perPage}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch images");

      const data = await response.json(); // Assumes ImageKit returns an array of filenames
      if (data.length === 0) {
        setHasMore(false);
        setIsLoading(false);
        return;
      }

      const newPhotos = data.map((filename: string) => ({
        src: `${baseUrl}${filename}`,
        width: 1200, // Default width, adjust as needed
        height: 800, // Default height, adjust as needed
      }));

      setPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
      setCurrentPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, isLoading, hasMore]);

  // Initial and paginated fetch
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Infinite scroll logic
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } =
        document.documentElement;
      if (
        scrollTop + clientHeight >= scrollHeight - 200 &&
        hasMore &&
        !isLoading
      ) {
        fetchPhotos();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchPhotos, hasMore, isLoading]);

  return (
    <div className="m-8 pb-16 max-md:m-3">
      <PhotoAlbum
        photos={photos}
        layout="masonry"
        renderPhoto={({ imageProps: { alt, style, ...restImageProps } }) => (
          <div style={{ position: "relative", ...style }}>
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#303030] via-[#383838] to-[#303030]" />
            <img
              alt={alt}
              {...restImageProps}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
              loading="lazy"
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.opacity = "1";
              }}
            />
          </div>
        )}
        columns={(containerWidth) => {
          if (containerWidth < 400) return 2;
          if (containerWidth < 800) return 3;
          return 4;
        }}
        onClick={({ index: current }) => setIndex(current)}
        defaultContainerWidth={360}
      />
      <Lightbox
        plugins={[Zoom]}
        index={index}
        slides={photos}
        open={index >= 0}
        close={() => setIndex(-1)}
      />
      {isLoading && <Loader lang="en" />}
    </div>
  );
};

export default ImageKitFetcher;
