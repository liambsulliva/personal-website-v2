import React, { useState, useEffect, useRef } from 'react';
import Loader from './Loader';

interface FlickrFetcherProps {
  apiKey: string;
  userId: string;
}

const FlickrFetcher: React.FC<FlickrFetcherProps> = ({ apiKey, userId }) => {
  const [flickrData, setFlickrData] = useState<{ src: string; title: string }[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{ src: string; title: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const openModal = (photo: { src: string; title: string }) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    const fetchFlickrData = async (page: number) => {
      const perPage = window.innerWidth < 768 ? 6 : 12; // 6 photos per page on mobile to save data on 2-column layout
      const url = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${apiKey}&user_id=${userId}&format=json&nojsoncallback=1&page=${page}&per_page=${perPage}`;
      const response = await fetch(url);
      const data = await response.json();
      setFlickrData((prevData) => [
        ...prevData,
        ...data.photos.photo.map((photo: any) => ({
          src: `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`,
          title: photo.title,
        })),
      ]);
      setCurrentPage(page + 1);
      setIsLoading(false);
    };
    fetchFlickrData(currentPage);
  }, [isLoading]);

  // Load more data
  const handleScroll = () => {
    //console.log('Scroll event fired');
    //console.log('isLoading:', isLoading);
    //console.log('Scroll position:', window.innerHeight + window.scrollY);
    //console.log('Document height:', document.documentElement.scrollHeight);
  
    if (
      containerRef.current &&
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight &&
      !isLoading
    ) {
      //console.log('Loading more data');
      setIsLoading(true);
    }
  };

  // Avoid memory leakage
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="columns-2 md:columns-3 lg:columns-4 m-4" ref={containerRef}>
        {flickrData.map((photo, index) => (
          <div key={index} onClick={() => openModal(photo)} className="relative cursor-pointer mb-4 content-[''] rounded-md absolute inset-0">
            <img className="w-full rounded-md" src={photo.src} alt={photo.title} />
          </div>
        ))}
      </div>
      {isLoading && <Loader/>}
      {isModalOpen && selectedPhoto && (
        <div onClick={closeModal} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-75"></div>
          <div className="relative z-10 p-4">
            <img
              className="h-auto rounded-lg w-auto"
              src={selectedPhoto.src}
              alt={selectedPhoto.title}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FlickrFetcher;
