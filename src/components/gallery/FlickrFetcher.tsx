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

  const fetchPhotos = useCallback(async () => {
    setIsLoading(true);
    const perPage = 20;
    const tagsParam = selectedTag ? `&tags=${selectedTag}` : "";
    const url = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&user_id=${userId}${tagsParam}&format=json&nojsoncallback=1&page=${currentPage}&per_page=${perPage}`;

    const response = await fetch(url);
    const data = await response.json();

    setNumPages(data.photos.pages);

    const photoBatch = data.photos.photo.map(async (photo: any) => {
      const newPhoto = await fetchPhotoByID(photo.id);
      return newPhoto;
    });

    const fetchedPhotos = await Promise.all(photoBatch);

    setPhotos((prevData) => [...prevData, ...fetchedPhotos]);
    setIsLoading(false);
  }, [apiKey, userId, currentPage, selectedTag]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const fetchPhotoByID = async (photoID: string) => {
    const url = `https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=${apiKey}&photo_id=${photoID}&format=json&nojsoncallback=1`;
    const response = await fetch(url);
    const data = await response.json();
    const photoData = data.sizes.size;

    const desiredSize = photoData.find(
      (size: any) => size.label === "Original",
    );
    if (!desiredSize) {
      console.error(`Desired size not found for photoID: ${photoID}`);
      return null;
    }

    const photo = {
      src: desiredSize.source,
      width: desiredSize.width,
      height: desiredSize.height,
      srcSet: photoData
        .filter((_: any, index: number) => [3, 6, 9, 12].includes(index))
        .map((size: any) => ({
          src: size.source,
          width: size.width,
          height: size.height,
        })),
    };

    return photo;
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
          setCurrentPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoading, currentPage, numPages]);

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    setPhotos([]);
    setCurrentPage(1);
    setNumPages(-1);
  };

  return (
    <div className="m-8 pb-16 max-md:m-3">
      <FlickrMenu lang={lang} onTagChange={handleTagChange} />
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

export default FlickrFetcher;
