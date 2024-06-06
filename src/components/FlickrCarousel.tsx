import React, { useEffect, useState } from 'react';
import Loader from './Loader';

interface FlickrCarouselProps {
    apiKey: string;
    userId: string;
    lang: string;
}

// TODO: Switch to different CDN to randomize indexes on server-side, optimizing carousel performance
const FlickrCarousel: React.FC<FlickrCarouselProps> = ({ apiKey, userId, lang }) => {
    const [photos, setPhotos] = useState<string[]>([]);
    const [loadedImages, setLoadedImages] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [photoIndex, setPhotoIndex] = useState<number[]>([]);
    const [photoQuality, setPhotoQuality] = useState('n');

    useEffect(() => {
        const fetchPhotos = async () => {
            const response = await fetch(`https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${apiKey}&user_id=${userId}&per_page=100&format=json&nojsoncallback=1`);
            const data = await response.json();
    
            const photosArray = data.photos.photo;
            //console.log(data);
            const randomPhotos: string[] = [];
    
            let indexes;
            if (photoIndex.length < 5) {
                indexes = await generateRandomIndexes(photosArray);
                setPhotoIndex(indexes);
            } else {
                indexes = photoIndex;
            }
    
            let count = 0;
            while (randomPhotos.length < 5) {
                //console.log(indexes[count])
                const randomPhoto = photosArray[indexes[count]];
                const photoUrl = `https://farm${randomPhoto.farm}.staticflickr.com/${randomPhoto.server}/${randomPhoto.id}_${randomPhoto.secret}_${photoQuality}.jpg`;
                if (!randomPhotos.includes(photoUrl)) {
                    randomPhotos.push(photoUrl);
                }
                count++;
            }
            setIsLoading(false);
            setPhotos(randomPhotos);
        };
    
        const generateRandomIndexes = async (photosArray: any) => {
            let randomIndexes: number[] = [];
            while (randomIndexes.length < 5) {
                const randomIndex = Math.floor(Math.random() * photosArray.length);
                if (!randomIndexes.includes(randomIndex)) {
                    const randomPhoto = photosArray[randomIndex];
                    const sizesResponse = await fetch(`https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=${apiKey}&photo_id=${randomPhoto.id}&format=json&nojsoncallback=1`);
                    const sizesData = await sizesResponse.json();
                    const photoSize = sizesData.sizes.size.find((size: any) => size.label === 'Large');
                    if (photoSize.width > photoSize.height) {
                        randomIndexes.push(randomIndex);
                    }
                }
            }
            return randomIndexes;
        }
    
        fetchPhotos();
    }, [photoQuality]);

    let handleImageLoad = () => {
        setLoadedImages(prevCount => {
            const newCount = prevCount + 1;
            if (newCount % 5 === 0) {
                updateQuality();
            }
            return newCount;
        });
    };

    const updateQuality = () => {
        if (photoQuality === 'n') {
            //console.log('Setting to Medium!');
            setPhotoQuality('z');
        } else if (photoQuality === 'z') {
            //console.log('Setting to Large!')
            setPhotoQuality('c');
        }
    }

    return (
        <div id="default-carousel" className="relative w-full" data-carousel="static">
            {/* Carousel wrapper */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                {isLoading && <Loader lang={lang}/>}
            </div>
            <div className="relative h-56 overflow-hidden rounded-lg md:h-96">
                {/* Item 1 */}
                <div className="hidden duration-700 ease-in-out" data-carousel-item>
                    <img src={photos[0]} alt={""} onLoad={handleImageLoad} className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
                </div>
                {/* Item 2 */}
                <div className="hidden duration-700 ease-in-out" data-carousel-item>
                    <img src={photos[1]} alt={""} onLoad={handleImageLoad} className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
                </div>
                {/* Item 3 */}
                <div className="hidden duration-700 ease-in-out" data-carousel-item>
                    <img src={photos[2]} alt={""} onLoad={handleImageLoad} className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
                </div>
                {/* Item 4 */}
                <div className="hidden duration-700 ease-in-out" data-carousel-item>
                    <img src={photos[3]} alt={""} onLoad={handleImageLoad} className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"  />
                </div>
                {/* Item 5 */}
                <div className="hidden duration-700 ease-in-out" data-carousel-item>
                    <img src={photos[4]} alt={""} onLoad={handleImageLoad} className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
                </div>
            </div>
            {/* Slider controls */}
            <button type="button" className="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-prev>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
                    <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4" />
                    </svg>
                    <span className="sr-only">Previous</span>
                </span>
            </button>
            <button type="button" className="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-next>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
                    <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                    </svg>
                    <span className="sr-only">Next</span>
                </span>
            </button>
        </div>
    );
}

export default FlickrCarousel;
