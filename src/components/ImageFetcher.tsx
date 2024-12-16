import React, { useState, useEffect, useCallback, useRef } from "react";
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Loader from "./Loader";
import "yet-another-react-lightbox/styles.css";

interface ImageFetcherProps {
  lang: string;
}

interface Photo {
  src: string;
  width: number;
  height: number;
  srcSet?: Array<{ src: string; width: number; height: number }>;
}

const ImageFetcher: React.FC<ImageFetcherProps> = ({ lang }) => {
  const [index, setIndex] = useState(-1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Add refs to track loading state and prevent duplicate requests
  const loadingRef = useRef(false);
  const cursorRef = useRef<string | null>(null);

  const fetchPhotos = useCallback(
    async (cursor?: string) => {
      // Prevent duplicate requests
      if (!hasMore || loadingRef.current || cursor === cursorRef.current)
        return;

      loadingRef.current = true;
      setIsLoading(true);

      try {
        const url = cursor
          ? `/api/cloudinary-photos?next_cursor=${encodeURIComponent(cursor)}`
          : "/api/cloudinary-photos";

        const response = await fetch(url);
        const data = await response.json();

        const formattedPhotos = data.resources.map((resource: any) => ({
          src: resource.secure_url,
          width: resource.width,
          height: resource.height,
          srcSet: [
            {
              src: resource.secure_url,
              width: resource.width,
              height: resource.height,
            },
          ],
        }));

        setPhotos((prev) =>
          cursor ? [...prev, ...formattedPhotos] : formattedPhotos,
        );
        setNextCursor(data.next_cursor);
        setHasMore(!!data.next_cursor);
        cursorRef.current = cursor || null;
      } catch (error) {
        console.error("Error fetching photos:", error);
      }

      loadingRef.current = false;
      setIsLoading(false);
    },
    [hasMore],
  );

  // Initial load
  useEffect(() => {
    if (photos.length === 0) {
      fetchPhotos();
    }
  }, [fetchPhotos, photos.length]);

  // Infinite scroll handler with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrolledToBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 1000;

        if (scrolledToBottom && nextCursor && !loadingRef.current && hasMore) {
          fetchPhotos(nextCursor);
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [nextCursor, hasMore, fetchPhotos]);

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
      {isLoading && <Loader lang={lang} />}
    </div>
  );
};

export default ImageFetcher;
