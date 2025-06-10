import { useState, useEffect, useRef } from "react";

interface WordpressFetcherProps {
  cardsToShow?: number;
}

interface WordpressPost {
  title: string;
  excerpt: string;
  link: string;
  imageUrl: string | null;
}

const WordpressFetcher = ({ cardsToShow = 3 }: WordpressFetcherProps) => {
  const [wordpressData, setWordpressData] = useState<WordpressPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(cardsToShow);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState(0);

  // Responsive handler to adjust cards shown based on screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 900) {
        // Small screens (sm)
        setVisibleCards(1);
      } else if (width < 1200) {
        // Medium screens (md)
        setVisibleCards(2);
      } else {
        setVisibleCards(cardsToShow); // Default (large screens)
      }
      // Reset current index if needed
      if (currentIndex > wordpressData.length - visibleCards) {
        setCurrentIndex(Math.max(0, wordpressData.length - visibleCards));
      }

      // Calculate card width for animation
      if (carouselRef.current) {
        const containerWidth = carouselRef.current.clientWidth;
        setSlideWidth(containerWidth / visibleCards);
      }
    };

    // Event listener
    handleResize();
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on exit to avoid memory leak
    return () => window.removeEventListener("resize", handleResize);
  }, [cardsToShow, currentIndex, wordpressData.length, visibleCards]);

  // Recalculate card width when data or card size changes
  useEffect(() => {
    if (carouselRef.current) {
      const containerWidth = carouselRef.current.clientWidth;
      setSlideWidth(containerWidth / visibleCards);
    }
  }, [wordpressData, visibleCards]);

  useEffect(() => {
    const fetchWordpressData = async () => {
      const site = `pittbusinesstotheworld.com`;
      const author = `651`; // My Author ID
      const url = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/posts/?author=${author}`;

      const response = await fetch(url);
      const data = await response.json();

      const strippedData = data.posts.map((post: any) => {
        const regex = /(<([^>]+)>)/gi;
        const strippedTitle = post.title.replace(regex, "");
        const strippedExcerpt = post.excerpt.replace(regex, "");
        const decodedTitle = decodeEntities(strippedTitle);
        const decodedExcerpt = decodeEntities(strippedExcerpt);
        // Remove the last 10 characters for "Read More"
        let truncatedExcerpt = decodedExcerpt.slice(0, -10);
        // If visibleCards is 3, limit to 200 characters for brevity
        if (visibleCards === 3 && truncatedExcerpt.length > 200) {
          truncatedExcerpt = truncatedExcerpt.slice(0, 200) + "...";
        }
        return {
          title: decodedTitle,
          excerpt: truncatedExcerpt,
          link: post.URL,
          imageUrl: post.featured_image || null,
        };
      });

      function decodeEntities(text: string) {
        const entities = [
          ["amp", "&"],
          ["apos", "'"],
          ["lt", "<"],
          ["gt", ">"],
          ["quot", '"'],
          ["#39", "'"],
          ["#039", "'"],
          ["#8217", "'"],
          ["#8230", "..."],
        ];
        for (const [code, char] of entities) {
          const entity = `&${code};`;
          const regex = new RegExp(entity, "g");
          text = text.replace(regex, char);
        }
        return text;
      }

      setWordpressData(strippedData);
    };
    fetchWordpressData();
  }, []);

  const nextSlide = () => {
    if (wordpressData.length <= visibleCards) return;
    setCurrentIndex((prevIndex) =>
      prevIndex + 1 < wordpressData.length ? prevIndex + 1 : prevIndex,
    );
  };

  const prevSlide = () => {
    if (wordpressData.length <= visibleCards) return;
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
  };

  // Only show arrow navigation when pagination is necessary
  const showNavigation = wordpressData.length > visibleCards;

  // Calculate card width based on slideWidth
  const cardWidth =
    slideWidth > 0
      ? slideWidth
      : carouselRef.current
        ? carouselRef.current.clientWidth / visibleCards
        : 0;

  return (
    <div className="relative mx-auto max-w-[1200px]">
      {/* Navigation buttons */}
      {showNavigation && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={prevSlide}
              className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              aria-label="Previous"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}
          {currentIndex < wordpressData.length - visibleCards && (
            <button
              onClick={nextSlide}
              className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              aria-label="Next"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          )}
        </>
      )}

      {/* Carousel container */}
      <div
        ref={carouselRef}
        className="mx-8 flex overflow-hidden"
        aria-live="polite"
      >
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * cardWidth}px)`,
            width: `auto`,
            display: "flex",
          }}
        >
          {wordpressData.map((post: WordpressPost, index: number) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{
                width: `${cardWidth}px`,
                maxWidth: `${cardWidth}px`,
              }}
            >
              <a
                href={post.link}
                rel="noreferrer"
                target="_blank"
                className="block h-full"
              >
                <div className="mx-4 h-full rounded-xl border border-[#333] bg-[#181818] p-6 hover:bg-[#202020]">
                  {post.imageUrl && (
                    <div className="relative aspect-video w-full">
                      <div className="absolute inset-0 animate-pulse rounded-t-lg bg-gradient-to-r from-[#303030] via-[#383838] to-[#303030]" />
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="absolute inset-0 h-full w-full rounded-t-lg object-cover opacity-0 transition-opacity duration-300"
                        loading="lazy"
                        onLoad={(e) => {
                          (e.target as HTMLImageElement).style.opacity = "1";
                        }}
                      />
                    </div>
                  )}
                  <div className="flex flex-row items-center gap-2">
                    <div>
                      <h2 className="m-0 mb-2 mt-3 text-left font-bold text-white">
                        <span className="inline">
                          {post.title}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="0.75rem"
                            height="0.75rem"
                            viewBox="0 0 24 24"
                            className="ml-2 inline-block align-baseline"
                          >
                            <path
                              fill="none"
                              stroke="#d0d0d0"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M13.5 10.5L21 3m-5 0h5v5m0 6v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"
                            />
                          </svg>
                        </span>
                      </h2>
                    </div>
                  </div>

                  <p className="m-0 text-[#d0d0d0]">{post.excerpt}</p>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      {showNavigation && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: wordpressData.length }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full ${
                (currentIndex <= index &&
                  index < currentIndex + visibleCards) ||
                (currentIndex + visibleCards > wordpressData.length &&
                  index < (currentIndex + visibleCards) % wordpressData.length)
                  ? "bg-white"
                  : "bg-gray-500"
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WordpressFetcher;
