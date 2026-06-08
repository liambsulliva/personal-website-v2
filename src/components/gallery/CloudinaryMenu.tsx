import CloudinaryTag from "./CloudinaryTag";
import { useState, useEffect, useRef } from "react";

interface CloudinaryMenuProps {
  onTagChange: (tag: string) => void;
}

export default function CloudinaryMenu({ onTagChange }: CloudinaryMenuProps) {
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [tags, setTags] = useState<string[]>(["all"]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const url = "/api/cloudinary/tags";

        const response = await fetch(url, {
          method: "GET",
        });

        const data = await response.json();

        if (data.tags && Array.isArray(data.tags)) {
          const filteredTags = data.tags
            .filter((tag: string) => !tag.startsWith("_") && tag !== "featured")
            .sort();

          setTags(["all", ...filteredTags]);
        } else {
          console.warn("No tags array in response");
        }
      } catch (error) {
        console.error("!!! CloudinaryMenu ERROR !!!", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        setTags(["all"]);
      }
    };

    fetchTags();
  }, []);

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    onTagChange(tag === "all" ? "" : tag);
  };

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
  }, [tags]);

  return (
    <div className="relative mb-8">
      {showLeftButton && (
        <div className="absolute left-0 top-0 z-10 flex h-full items-center">
          <div className="absolute left-0 h-full w-24 bg-gradient-to-r from-[#0F0F0F] to-transparent" />
          <button
            onClick={() => {
              if (containerRef.current) {
                containerRef.current.scrollLeft -= 200;
              }
            }}
            className="relative z-10 pl-1"
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
        {tags.map((tag) => (
          <CloudinaryTag
            key={tag}
            label={tag === "all" ? "all" : tag.charAt(0).toUpperCase() + tag.slice(1)}
            isSelected={selectedTag === tag}
            onSelect={() => handleTagSelect(tag)}
          />
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
          <div className="absolute right-0 h-full w-24 bg-gradient-to-l from-[#0F0F0F] to-transparent" />
        </div>
      )}
    </div>
  );
}
