import { useState, useEffect, useCallback } from "react";
import Loader from "../gallery/Loader";

interface LocalFetcherProps {
  category?: string;
}

interface LocalData {
  title: string;
  type: string;
  date: string;
  link: string;
  externalLink?: boolean;
  imageUrl: string | null;
}

const LocalFetcher = ({ category = "layouts" }: LocalFetcherProps) => {
  const [localData, setLocalData] = useState<LocalData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLocalData = useCallback(async () => {
    setIsLoading(true);

    try {
      const localPDFs = [
        {
          title: "Shooting The Perfect Portrait",
          type: "Article",
          date: "Mar 2025",
          link: "/layouts/portrait-tutorial.pdf",
          imageUrl: "/images/portrait-tutorial.png",
        },
        {
          title: "The Forgotten Charm of Gaming Manuals",
          type: "Manual",
          date: "Apr 2025",
          link: "/layouts/wii-manual.pdf",
          imageUrl: "/images/wii-manual.png",
        },
      ];

      const localImages = [
        {
          title: "From Pop to Personal",
          type: "Logo",
          date: "Oct 2024",
          link: "https://pittnews.com/article/190870/blogs/from-pop-to-personal-youre-gonna-go-far/",
          externalLink: true,
          imageUrl: "/images/From-Pop-to-Personal.png",
        },
        {
          title: "Do You Not Get the Concept?",
          type: "Logo",
          date: "Dec 2024",
          link: "https://pittnews.com/article/192778/blogs/do-you-not-get-the-concept-with-great-power-theres-a-great-responsibility/",
          externalLink: true,
          imageUrl: "/images/music-blog.png",
        },
        {
          title: "Pitt-Branded Instagram Post (Mockup)",
          type: "Instagram Post",
          date: "Mar 2025",
          link: "/layouts/mock-pitt-post.pdf",
          imageUrl: "/images/mock-pitt-post.png",
        },
      ];

      switch (category) {
        case "layouts":
          setLocalData(localPDFs);
          break;
        case "graphic-design":
          setLocalData(localImages);
          break;
      }
    } catch (error) {
      console.error("Error fetching local PDF data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchLocalData();
  }, [fetchLocalData]);

  return (
    <div className="mx-auto w-[calc(100vw-4rem)] max-w-[1200px]">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {localData.map((card: LocalData, index: number) => (
          <a
            href={card.link}
            rel="noreferrer"
            target="_blank"
            key={index}
            className="h-full"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#333] bg-[#181818] hover:bg-[#202020]">
              {card.imageUrl && (
                <div className="relative h-48 w-full">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#303030] via-[#383838] to-[#303030]" />
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
                    loading="lazy"
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "1";
                    }}
                  />
                </div>
              )}
              <div className="flex flex-grow flex-col p-5">
                <h2 className="m-0 text-left text-base font-bold text-white">
                  <div className="flex w-full items-center">
                    <span className="truncate">{card.title}</span>
                    {card.externalLink && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="0.75rem"
                        height="0.75rem"
                        viewBox="0 0 24 24"
                        className="ml-2 shrink-0"
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
                    )}
                  </div>
                </h2>
                <p className="m-0 text-[#d0d0d0]">
                  {card.type} • {card.date}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
      {isLoading && <Loader lang="en" />}
    </div>
  );
};

export default LocalFetcher;
