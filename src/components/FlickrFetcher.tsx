import React, { useState, useEffect, useRef } from 'react';

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
      const url = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${apiKey}&user_id=${userId}&format=json&nojsoncallback=1&page=${page}&per_page=10`;
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
    console.log('Scroll event fired');
    console.log('isLoading:', isLoading);
    console.log('Scroll position:', window.innerHeight + window.scrollY);
    console.log('Document height:', document.documentElement.scrollHeight);
  
    if (
      containerRef.current &&
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight &&
      !isLoading
    ) {
      console.log('Loading more data');
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
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 m-4" ref={containerRef}>
        {flickrData.map((photo, index) => (
          <div key={index}>
            <button onClick={() => openModal(photo)}>
              <img className="h-auto w-full rounded-lg" src={photo.src} alt={photo.title} />
            </button>
          </div>
        ))}
        {isLoading && <div>Loading...</div>}
      </div>
      {isModalOpen && selectedPhoto && (
        <div onClick={closeModal} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-75"></div>
          <div className="relative z-10 p-4">
            <img className="h-full rounded-lg" src={selectedPhoto.src} alt={selectedPhoto.title} />
          </div>
        </div>
      )}
    </>
  );
};

export default FlickrFetcher;
