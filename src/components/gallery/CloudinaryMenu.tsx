import CloudinaryTag from "./CloudinaryTag";
import { useState, useEffect, useRef } from "react";

interface CloudinaryMenuProps {
  lang: string;
  onTagChange: (tag: string) => void;
}

interface TagOption {
  en: string;
  de: string;
}

export default function CloudinaryMenu({
  onTagChange,
  lang,
}: CloudinaryMenuProps) {
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [tags, setTags] = useState<TagOption[]>([{ en: "all", de: "alle" }]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTags = async () => {
      console.log("=== CloudinaryMenu: Starting tag fetch ===");

      try {
        const url = "/api/cloudinary/tags";

        console.log("Request URL:", url);

        const response = await fetch(url, {
          method: "GET",
        });

        console.log("Response Status:", response.status);
        console.log("Response OK:", response.ok);

        const data = await response.json();
        console.log("Tags Response Data:", data);

        if (data.tags && Array.isArray(data.tags)) {
          console.log(`Found ${data.tags.length} total tags:`, data.tags);

          // Filter out system tags and the "featured" tag (used only for carousel)
          const filteredTags = data.tags
            .filter((tag: string) => !tag.startsWith("_") && tag !== "featured")
            .sort();

          console.log(
            `After filtering: ${filteredTags.length} tags:`,
            filteredTags,
          );

          const tagOptions: TagOption[] = [
            { en: "all", de: "alle" },
            ...filteredTags.map((tag: string) => ({
              en: tag,
              de: tag.charAt(0).toUpperCase() + tag.slice(1),
            })),
          ];

          console.log("Final tag options:", tagOptions);
          setTags(tagOptions);
          console.log("=== CloudinaryMenu: Tag fetch complete ===");
        } else {
          console.warn("No tags array in response");
          console.log("Data structure:", Object.keys(data));
        }
      } catch (error) {
        console.error("!!! CloudinaryMenu ERROR !!!", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        setTags([{ en: "all", de: "alle" }]);
      }
    };

    fetchTags();
  }, []);

  const handleTagSelect = (tag: TagOption) => {
    setSelectedTag(tag.en);
    onTagChange(tag.en === "all" ? "" : tag.en);
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
        {tags.map((tag) => (
          <CloudinaryTag
            key={tag.en}
            label={lang === "de" ? tag.de : tag.en}
            isSelected={selectedTag === tag.en}
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
