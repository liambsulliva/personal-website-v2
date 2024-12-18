import FlickrTag from "./FlickrTag";
import { useState, useEffect, useRef } from "react";

const flickrTags = [
  "basketball",
  "cosplay",
  "esports",
  "football",
  "music",
  "portraits",
  "soccer",
  "sports",
  "volleyball",
];

export default function FlickrMenu() {
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      setShowLeftButton(hasOverflow && container.scrollLeft > 0);
      setShowRightButton(
        hasOverflow &&
          container.scrollLeft < container.scrollWidth - container.clientWidth,
      );
    };

    checkScroll();
    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  return (
    <div className="relative mb-4">
      {showLeftButton && (
        <div className="absolute left-0 top-0 z-10 flex h-full items-center">
          <div className="absolute h-full w-24 bg-gradient-to-r from-[#0F0F0F] to-transparent" />
          <button
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollLeft -= 200;
              }
            }}
            className="relative pl-1"
            aria-label="Scroll tags left"
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
              className="text-white"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto max-md:px-5"
        style={{
          scrollBehavior: "smooth",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
        id="tagContainer"
      >
        {flickrTags.map((tag: string) => (
          <FlickrTag key={tag} label={tag} />
        ))}
      </div>
      {showRightButton && (
        <div className="absolute right-0 top-0 z-10 flex h-full items-center">
          <button
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollLeft += 200;
              }
            }}
            className="relative z-10 pr-1"
            aria-label="Scroll tags right"
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
              className="text-white"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="absolute right-0 h-full w-24 bg-gradient-to-l from-black to-transparent" />
        </div>
      )}
    </div>
  );
}