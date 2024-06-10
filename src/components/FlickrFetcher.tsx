import React, { useState, useEffect } from 'react';
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Loader from './Loader';
import "yet-another-react-lightbox/styles.css";


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

const FlickrFetcher: React.FC<FlickrFetcherProps> = ({ apiKey, userId, lang }) => {
  let numPages = -1;
  const [index, setIndex] = useState(-1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPhotos = async (page: number) => {
      const perPage = 20; // 20 is the magic number for most screen sizes
      const url = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${apiKey}&user_id=${userId}&format=json&nojsoncallback=1&page=${page}&per_page=${perPage}`;
      const response = await fetch(url);
      const data = await response.json();
      if (numPages === -1) {
        numPages = data.photos.pages;
      }

      // Batch fetch photos by ID
      const photoBatch = data.photos.photo.map(async (photo: any) => {
        const newPhoto = await fetchPhotoByID(photo.id);
        return newPhoto;
      });

      const fetchedPhotos = await Promise.all(photoBatch);

      setPhotos((prevData) => [
        ...prevData,
        ...fetchedPhotos,
      ]);

      setCurrentPage(page + 1);
      setIsLoading(false);
    };
    fetchPhotos(currentPage);
  }, [isLoading]);

  const fetchPhotoByID = async (photoID: string) => {
    const url = `https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=${apiKey}&photo_id=${photoID}&format=json&nojsoncallback=1`;
    const response = await fetch(url);
    const data = await response.json();
    const photoData = data.sizes.size;
    console.log(photoData);

    const photo = {
      src: photoData[12].source,
      width: photoData[12].width,
      height: photoData[12].height,
      srcSet: [
        { src: photoData[3].source, width: photoData[3].width, height: photoData[3].height }, // Small
        { src: photoData[6].source, width: photoData[6].width, height: photoData[6].height }, // Medium
        { src: photoData[9].source, width: photoData[9].width, height: photoData[9].height }, // Large
        { src: photoData[12].source, width: photoData[12].width, height: photoData[12].height }, // Original
      ]
    };

    return photo;
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight && !isLoading && currentPage <= numPages) {
        setIsLoading(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  return (
    <div className='m-8'>
      <PhotoAlbum
        photos={photos}
        layout="masonry"
        columns={(containerWidth) => {
          if (containerWidth < 400) return 2;
          if (containerWidth < 800) return 3;
          return 4;
        }}
        onClick={({ index: current }) => setIndex(current)}
        defaultContainerWidth={360} // SSR caters to mobile first and expands on desktop
      />
      <Lightbox
        plugins={[Zoom]}
        index={index}
        slides={photos}
        open={index >= 0}
        close={() => setIndex(-1)}
      />
      {isLoading && <Loader lang={lang}/>}
    </div>
  );
};

export default FlickrFetcher;
