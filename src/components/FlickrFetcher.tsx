import React, { useState, useEffect } from 'react';

interface FlickrFetcherProps {
  apiKey: string;
  userId: string;
}

// TODO: Lazy load pages at a time so we can animate photos in as they load
const FlickrFetcher: React.FC<FlickrFetcherProps> = ({ apiKey, userId }) => {
    const [flickrData, setFlickrData] = useState<{ src: string, title: string }[]>([]);
    const [loadedImages, setLoadedImages] = useState(0);
    const [isRandomized, setIsRandomized] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<{ src: string, title: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Randomize the order of flickrData array
    const shuffleArray = (array: { src: string, title: string }[]) => {
      const shuffledArray = [...array];
      for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
      }
      return shuffledArray;
    };

    const openModal = (photo: { src: string, title: string }) => {
      setSelectedPhoto(photo);
      setIsModalOpen(true);
    };

    const closeModal = () => {
      setSelectedPhoto(null);
      setIsModalOpen(false);
    };
  
    useEffect(() => {
      const fetchFlickrData = async () => {
        const url = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${apiKey}&user_id=${userId}&format=json&nojsoncallback=1`;
  
        const response = await fetch(url);
        const data = await response.json();
  
        let photos = [];
        if (data.stat === 'ok') {
        for (let i = 1; i <= data.photos.pages; i++) {
            const pageUrl = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${apiKey}&user_id=${userId}&format=json&nojsoncallback=1&page=${i}`;
            const pageResponse = await fetch(pageUrl);
            const pageData = await pageResponse.json();
            if (pageData.stat === 'ok') {
                const screenWidth = window.innerWidth;
                let photoQuality;
                if (screenWidth < 400) {
                  photoQuality = 'n';
                } else if (screenWidth < 640) {
                  photoQuality = 'z';
                } else {
                  photoQuality = 'b';
                }
                for (let j = 0; j < pageData.photos.photo.length; j++) {
                    const photo = pageData.photos.photo[j];
                    const src = `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_${photoQuality}.jpg`;
                    const title = photo.title;
                    console.log(src);
                    photos.push({ src, title });
                }
            } else {
                console.error(`Error fetching Flickr data for page ${i}, ${pageData.message}`);
            }
        }
        photos = shuffleArray(photos);
        setFlickrData(photos);
        } else {
          console.error(`Error fetching Flickr data ${data.message}`);
        }
      };
      fetchFlickrData();
    }, []);

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 m-4">
          <div className="grid gap-4 h-auto">
          {flickrData.slice(0, flickrData.length/4).map((photo, index) => (
            <div key={index}>
            <button onClick={() => openModal(photo)}>
              <img className="h-auto w-full rounded-lg" src={photo.src} alt={photo.title} />
            </button>
            </div>
          ))}
          </div>
          <div className="grid gap-4 h-auto">
          {flickrData.slice(flickrData.length/4, 2*flickrData.length/4).map((photo, index) => (
            <div key={index}>
            <button onClick={() => openModal(photo)}>
              <img className="h-auto w-full rounded-lg" src={photo.src} alt={photo.title} />
            </button>
            </div>
          ))}
          </div>
          <div className="grid gap-4 h-auto">
          {flickrData.slice(2*flickrData.length/4, 3*flickrData.length/4).map((photo, index) => (
            <div key={index}>
            <button onClick={() => openModal(photo)}>
              <img className="h-auto w-full rounded-lg" src={photo.src} alt={photo.title} />
            </button>
            </div>
          ))}
          </div>
          <div className="grid gap-4 h-auto">
          {flickrData.slice(3*flickrData.length/4, flickrData.length).map((photo, index) => (
            <div key={index}>
            <button onClick={() => openModal(photo)}>
              <img className="h-auto w-full rounded-lg" src={photo.src} alt={photo.title} />
            </button>
            </div>
          ))}
        </div>
      </div>
      {isModalOpen && selectedPhoto && (
        <div onClick={closeModal} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-75"></div>
          <div className="relative z-10 p-4">
            <img
              className="h-full rounded-lg"
              src={selectedPhoto.src}
              alt={selectedPhoto.title}
            />
          </div>
        </div>
      )}
      </>
    );
  };

  export default FlickrFetcher;
  