import { useState, useEffect, useCallback } from "react";
import Loader from "../gallery/Loader";

interface LocalFetcherProps {
  lang?: string;
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

const LocalFetcher = ({
  category = "layouts",
  lang = "en",
}: LocalFetcherProps) => {
  const [localData, setLocalData] = useState<LocalData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLocalData = useCallback(async () => {
    setIsLoading(true);

    try {
      const localLayouts = {
        en: [
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
        ],
        de: [
          {
            title: "Das perfekte Porträt fotografieren",
            type: "Artikel",
            date: "März 2025",
            link: "/layouts/portrait-tutorial.pdf",
            imageUrl: "/images/portrait-tutorial.png",
          },
          {
            title: "Der vergessene Charme von Spielehandbüchern",
            type: "Handbuch",
            date: "Apr 2025",
            link: "/layouts/wii-manual.pdf",
            imageUrl: "/images/wii-manual.png",
          },
        ],
      };

      const localPresentations = {
        en: [
          {
            title: "Club Meeting 8-25",
            type: "Presentation",
            date: "Aug 2025",
            link: "/presentation/clubmeeting1.pdf",
            imageUrl: "/images/clubmeeting1.png",
          },
          {
            title: "Club Meeting 9-8",
            type: "Presentation",
            date: "Sept 2025",
            link: "/presentation/clubmeeting2.pdf",
            imageUrl: "/images/clubmeeting2.png",
          },
          {
            title: "Club Meeting 9-15",
            type: "Presentation",
            date: "Sept 2025",
            link: "/presentation/clubmeeting3.pdf",
            imageUrl: "/images/clubmeeting3.png",
          },
          {
            title: "Club Meeting 9-22",
            type: "Presentation",
            date: "Sept 2025",
            link: "/presentation/clubmeeting4.pdf",
            imageUrl: "/images/clubmeeting4.png",
          },
          {
            title: "Club Meeting 10-6",
            type: "Presentation",
            date: "Oct 2025",
            link: "/presentation/clubmeeting5.pdf",
            imageUrl: "/images/clubmeeting5.png",
          },
          {
            title: "Club Meeting 10-27",
            type: "Presentation",
            date: "Oct 2025",
            link: "/presentation/clubmeeting6.pdf",
            imageUrl: "/images/clubmeeting6.png",
          },
        ],
      };

      const localCooking = {
        en: [
          {
            title: "Pickled Onions",
            type: "Blog",
            date: "Oct 2025",
            link: "https://liambsullivan.substack.com/p/pickled-onions",
            imageUrl: "/images/pickled-onions.jpg",
          },
          {
            title: "Hearts of Palm",
            type: "Blog",
            date: "Oct 2025",
            link: "https://liambsullivan.substack.com/p/hearts-of-palm",
            imageUrl: "/images/hearts-of-palm.jpg",
          },
          {
            title: "Tofu",
            type: "Blog",
            date: "Oct 2025",
            link: "https://liambsullivan.substack.com/p/tofu",
            imageUrl: "/images/tofu.jpg",
          },
        ],
      };

      const localImages = {
        en: [
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
        ],
        de: [
          {
            title: "Von Pop zu Persönlich",
            type: "Logo",
            date: "Okt 2024",
            link: "https://pittnews.com/article/190870/blogs/from-pop-to-personal-youre-gonna-go-far/",
            externalLink: true,
            imageUrl: "/images/From-Pop-to-Personal.png",
          },
          {
            title: "Verstehst du das Konzept nicht?",
            type: "Logo",
            date: "Dez 2024",
            link: "https://pittnews.com/article/192778/blogs/do-you-not-get-the-concept-with-great-power-theres-a-great-responsibility/",
            externalLink: true,
            imageUrl: "/images/music-blog.png",
          },
          {
            title: "Pitt-Branded Instagram-Beitrag (Mockup)",
            type: "Instagram-Beitrag",
            date: "März 2025",
            link: "/layouts/mock-pitt-post.pdf",
            imageUrl: "/images/mock-pitt-post.png",
          },
        ],
      };

      switch (category) {
        case "layouts":
          setLocalData(
            localLayouts[lang as keyof typeof localLayouts] || localLayouts.en,
          );
          break;
        case "graphic-design":
          setLocalData(
            localImages[lang as keyof typeof localImages] || localImages.en,
          );
          break;
        case "presentations":
          setLocalData(
            localPresentations[lang as keyof typeof localPresentations] ||
              localPresentations.en,
          );
          break;
        case "cooking":
          setLocalData(
            localPresentations[lang as keyof typeof localCooking] ||
              localCooking.en,
          );
          break;
      }
    } catch (error) {
      console.error("Error fetching local PDF data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [category, lang]);

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
      {isLoading && <Loader lang={lang} />}
    </div>
  );
};

export default LocalFetcher;
