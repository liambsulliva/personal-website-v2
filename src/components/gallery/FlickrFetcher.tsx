import React, { useState, useEffect, useCallback } from "react";
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Loader from "./Loader";
import "yet-another-react-lightbox/styles.css";
import FlickrMenu from "./FlickrMenu";

interface FlickrFetcherProps {
  apiKey: string;
  userId: string;
  lang: string;
}

interface Photo {
  src: string;
  width: number;
  height: number;
}

const FlickrFetcher: React.FC<FlickrFetcherProps> = ({
  apiKey,
  userId,
  lang,
}) => {
  const [index, setIndex] = useState(-1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [numPages, setNumPages] = useState(-1);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);

  const fetchPhotos = useCallback(async () => {
    setIsLoading(true);
    //console.log(`Fetching photos. Page: ${currentPage}, Tag: ${selectedTag || "none"}`);

    try {
      const perPage = 20;
      const tagsParam = selectedTag ? `&tags=${selectedTag}` : "";
      const url = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&user_id=${userId}${tagsParam}&format=json&nojsoncallback=1&page=${currentPage}&per_page=${perPage}`;

      //console.log(`Fetching from URL: ${url}`);
      const response = await fetch(url);
      const data = await response.json();

      //console.log(`Got response. Total pages: ${data.photos.pages}, Total photos: ${data.photos.total}`);
      setNumPages(data.photos.pages);

      if (!data.photos.photo || data.photos.photo.length === 0) {
        //console.warn("No photos found in response");
        setIsLoading(false);
        return;
      }

      const photoBatch = data.photos.photo.map(async (photo: any) => {
        //console.log(`Processing photo ID: ${photo.id}`);
        const newPhoto = await fetchPhotoByID(photo.id);
        return newPhoto;
      });

      const fetchedPhotos = await Promise.all(photoBatch);
      // Filter out nonexistent photos, avoids crashing entire component
      const validPhotos = fetchedPhotos.filter((photo) => photo !== null);
      //console.log(`Successfully fetched ${validPhotos.length} valid photos out of ${fetchedPhotos.length} total`);

      setPhotos((prevData) => [...prevData, ...validPhotos]);
    } catch (error) {
      //console.error("Error fetching photos:", error);
      setErrors((prev) => [...prev, `Error fetching photos: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, userId, currentPage, selectedTag]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const fetchPhotoByID = async (photoID: string) => {
    //console.log(`Fetching sizes for photo ID: ${photoID}`);
    try {
      const url = `https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=${apiKey}&photo_id=${photoID}&format=json&nojsoncallback=1`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.stat !== "ok") {
        //console.error(`Error response from Flickr API for photo ${photoID}:`, data);
        return null;
      }

      const photoData = data.sizes.size;
      //console.log(`Got ${photoData.length} sizes for photo ${photoID}`);
      //console.log(`Available sizes for ${photoID}:`, photoData.map((s: any) => s.label));

      // Try to find the Large size first (biggest available in API)
      let desiredSize = photoData.find((size: any) => size.label === "Large");

      // If Large not found, use fallback sizes.
      if (!desiredSize) {
        //console.warn(`Original size not found for photoID: ${photoID}, trying fallbacks`);
        const fallbackSizes = [
          "Large 2048",
          "Large 1600",
          "Medium 800",
          "Medium",
          "Small",
        ];

        for (const sizeLabel of fallbackSizes) {
          desiredSize = photoData.find((size: any) => size.label === sizeLabel);
          if (desiredSize) {
            //console.log(`Using fallback size "${sizeLabel}" for photoID: ${photoID}`);
            break;
          }
        }
      }

      // If still no size found, use the largest available size
      if (!desiredSize && photoData.length > 0) {
        //console.warn(`No preferred sizes found for photoID: ${photoID}, using largest available`);
        desiredSize = [...photoData].sort((a, b) => b.width - a.width)[0];
      }

      if (!desiredSize) {
        //console.error(`No usable size found for photoID: ${photoID}`);
        return null;
      }

      //console.log(`Selected size for ${photoID}: ${desiredSize.label} (${desiredSize.width}x${desiredSize.height})`);

      // Create srcSet from available sizes
      const srcSet = photoData
        .filter((size: any) => size.width > 0 && size.height > 0)
        .sort((a: any, b: any) => a.width - b.width)
        .filter((_: any, index: number, arr: any[]) => {
          // Get a reasonable distribution of sizes
          const total = arr.length;
          return (
            index === 0 ||
            index === Math.floor(total / 3) ||
            index === Math.floor((2 * total) / 3) ||
            index === total - 1
          );
        })
        .map((size: any) => ({
          src: size.source,
          width: parseInt(size.width),
          height: parseInt(size.height),
        }));

      const photo = {
        src: desiredSize.source,
        width: parseInt(desiredSize.width),
        height: parseInt(desiredSize.height),
        srcSet: srcSet.length > 0 ? srcSet : undefined,
      };

      return photo;
    } catch (error) {
      console.error(`Error fetching photo ${photoID}:`, error);
      setErrors((prev) => [
        ...prev,
        `Error fetching photo ${photoID}: ${error}`,
      ]);
      return null;
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!isLoading) {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;

        if (
          scrollTop + clientHeight >= scrollHeight - 200 &&
          currentPage < numPages
        ) {
          //console.log("Scroll triggered, loading next page");
          setCurrentPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoading, currentPage, numPages]);

  const handleTagChange = (tag: string) => {
    //console.log(`Tag changed to: ${tag}`);
    setSelectedTag(tag);
    setPhotos([]);
    setCurrentPage(1);
    setNumPages(-1);
  };

  if (errors.length > 0) {
    console.warn("Encountered errors:", errors);
  }

  return (
    <div className="m-8 pb-16 max-md:m-3">
      <FlickrMenu lang={lang} onTagChange={handleTagChange} />
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

export default FlickrFetcher;
