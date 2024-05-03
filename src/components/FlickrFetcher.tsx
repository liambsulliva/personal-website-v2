import React, { useState, useEffect } from 'react';

interface FlickrFetcherProps {
  apiKey: string;
  userId: string;
}

// TODO: Lazy load pages at a time so we can animate photos in as they load
const FlickrFetcher: React.FC<FlickrFetcherProps> = ({ apiKey, userId }) => {
    const [flickrData, setFlickrData] = useState<{ src: string, title: string }[]>([]);
  
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
                for (let j = 0; j < pageData.photos.photo.length; j++) {
                    const photo = pageData.photos.photo[j];
                    const src = `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`;
                    const title = photo.title;
                    photos.push({ src, title });
                }
            } else {
                console.error(`Error fetching Flickr data for page ${i}, ${pageData.message}`);
            }
        }
        setFlickrData(photos);
        } else {
          console.error(`Error fetching Flickr data ${data.message}`);
        }
      };
      fetchFlickrData();
    }, []);

    return (
      <div className="portfolio-container sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 p-12 pt-0">
        {flickrData.map((photo, index) => (
          <div key={index} className={`portfolio-wrapper`}>
            <img src={photo.src} alt={photo.title} className="portfolio-element h-auto w-full p-2.5" />
          </div>
        ))}
      </div>
    );
  };

  export default FlickrFetcher;
  