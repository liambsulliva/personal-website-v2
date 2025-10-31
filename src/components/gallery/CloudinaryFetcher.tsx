import React, { useState, useEffect, useCallback } from "react";
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Loader from "./Loader";
import "yet-another-react-lightbox/styles.css";
import CloudinaryMenu from "./CloudinaryMenu";

interface CloudinaryFetcherProps {
  lang: string;
}

interface Photo {
  src: string;
  width: number;
  height: number;
  srcSet?: { src: string; width: number; height: number }[];
}

const CloudinaryFetcher: React.FC<CloudinaryFetcherProps> = ({ lang }) => {
  const [index, setIndex] = useState(-1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);

  const fetchPhotos = useCallback(
    async (cursor: string | null = null) => {
      setIsLoading(true);
      console.log("=== CloudinaryFetcher: Starting fetch ===");
      console.log("Selected Tag:", selectedTag || "(none)");
      console.log("Cursor:", cursor || "(none)");

      try {
        const maxResults = 20;

        // Build search expression
        let expression = "resource_type:image";
        if (selectedTag && selectedTag !== "") {
          expression += ` AND tags=${selectedTag}`;
        }

        console.log("Search Expression:", expression);

        const requestBody: any = {
          expression,
          max_results: maxResults,
          with_field: ["tags", "context"],
        };

        if (cursor) {
          requestBody.next_cursor = cursor;
        }

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

        if (!data.resources || data.resources.length === 0) {
          console.warn("No resources found in response");
          console.log("Data structure:", Object.keys(data));
          setHasMore(false);
          setIsLoading(false);
          return;
        }

        console.log(`Found ${data.resources.length} resources`);

        // Map Cloudinary resources to photo objects
        const fetchedPhotos: Photo[] = data.resources.map((resource: any) => {
          console.log("Processing resource:", resource.public_id);
          const baseUrl = resource.secure_url;

          // Generate srcSet with different transformations
          const srcSet = [
            {
              src: baseUrl.replace("/upload/", "/upload/c_limit,w_400/"),
              width: Math.min(resource.width, 400),
              height: Math.round(
                (Math.min(resource.width, 400) / resource.width) *
                  resource.height,
              ),
            },
            {
              src: baseUrl.replace("/upload/", "/upload/c_limit,w_800/"),
              width: Math.min(resource.width, 800),
              height: Math.round(
                (Math.min(resource.width, 800) / resource.width) *
                  resource.height,
              ),
            },
            {
              src: baseUrl.replace("/upload/", "/upload/c_limit,w_1600/"),
              width: Math.min(resource.width, 1600),
              height: Math.round(
                (Math.min(resource.width, 1600) / resource.width) *
                  resource.height,
              ),
            },
          ];

          return {
            src: baseUrl.replace("/upload/", "/upload/c_limit,w_1600/"),
            width: resource.width,
            height: resource.height,
            srcSet,
          };
        });

        console.log(`Processed ${fetchedPhotos.length} photos`);
        console.log("Next Cursor:", data.next_cursor || "(none)");

        setPhotos((prevData) => [...prevData, ...fetchedPhotos]);
        setNextCursor(data.next_cursor || null);
        setHasMore(!!data.next_cursor);
        console.log("=== CloudinaryFetcher: Fetch complete ===");
      } catch (error) {
        console.error("!!! CloudinaryFetcher ERROR !!!", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        setErrors((prev) => [...prev, `Error fetching photos: ${error}`]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTag],
  );

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  useEffect(() => {
    const handleScroll = () => {
      if (!isLoading && hasMore) {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollTop + clientHeight >= scrollHeight - 200) {
          fetchPhotos(nextCursor);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoading, hasMore, nextCursor, fetchPhotos]);

  const handleTagChange = (tag: string) => {
    console.log("=== Tag Changed ===");
    console.log("New Tag:", tag);
    setSelectedTag(tag);
    setPhotos([]);
    setNextCursor(null);
    setHasMore(true);
  };

  if (errors.length > 0) {
    console.warn("Encountered errors:", errors);
  }

  return (
    <div className="m-8 pb-16 max-md:m-3">
      <CloudinaryMenu lang={lang} onTagChange={handleTagChange} />
      {photos.length > 0 ? (
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
      ) : !isLoading ? (
        <div className="flex h-32 w-full items-center justify-center text-white">
          <p>{lang === "de" ? "Keine Fotos gefunden" : "No photos found"}</p>
        </div>
      ) : null}
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

export default CloudinaryFetcher;
