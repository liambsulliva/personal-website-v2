import React, { useState, useEffect, useRef } from 'react';
import PhotoAlbum from "react-photo-album";
import Loader from './Loader';

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
  const [flickrData, setFlickrData] = useState<Photo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFlickrData = async (page: number) => {
      const perPage = window.innerWidth < 768 ? 15 : 20;
      const url = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${apiKey}&user_id=${userId}&format=json&nojsoncallback=1&page=${page}&per_page=${perPage}`;
      const response = await fetch(url);
      const data = await response.json();

      await Promise.all(data.photos.photo.map(async (photo: any) => {
        const newPhoto = await fetchPhotoByID(photo.id);
        setFlickrData((prevData) => [
          ...prevData,
          newPhoto,
        ]);
      }));

      console.log('Photo:', flickrData);
      setCurrentPage(page + 1);
      setIsLoading(false);
    };
    fetchFlickrData(currentPage);
  }, [isLoading]);

  const fetchPhotoByID = async (photoID: string) => {
    const url = `https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=${apiKey}&photo_id=${photoID}&format=json&nojsoncallback=1`;
    const response = await fetch(url);
    const data = await response.json();
    const photoData = data.sizes.size.filter((size: any) => size.label === 'Medium')[0]

    const photo = {
      src: photoData.source,
      width: photoData.width,
      height: photoData.height,
    };

    return photo;
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight && !isLoading) {
        setIsLoading(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  return (
    <div className='m-8'>
      <PhotoAlbum photos={flickrData} layout="masonry" />
      {isLoading && <Loader lang={lang}/>}
    </div>
  );
};

export default FlickrFetcher;
