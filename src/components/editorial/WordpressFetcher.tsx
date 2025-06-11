import { useState, useEffect, useCallback } from "react";
import Loader from "../gallery/Loader";

interface WordpressPost {
  title: string;
  excerpt: string;
  link: string;
  imageUrl: string | null;
}

const WordpressFetcher = () => {
  const [wordpressData, setWordpressData] = useState<WordpressPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  const fetchWordpressData = useCallback(async () => {
    setIsLoading(true);
    const site = `pittbusinesstotheworld.com`;
    const author = `651`; // My Author ID
    const perPage = 10;
    const url = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/posts/?author=${author}&page=${currentPage}&number=${perPage}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      const strippedData = data.posts.map((post: any) => {
        const regex = /(<([^>]+)>)/gi;
        const strippedTitle = post.title.replace(regex, "");
        const strippedExcerpt = post.excerpt.replace(regex, "");
        const decodedTitle = decodeEntities(strippedTitle);
        const decodedExcerpt = decodeEntities(strippedExcerpt);
        const truncatedExcerpt = decodedExcerpt.slice(0, -10); // Remove the last 10 characters for "Read More"
        return {
          title: decodedTitle,
          excerpt: truncatedExcerpt,
          link: post.URL,
          imageUrl: post.featured_image || null,
        };
      });

      if (strippedData.length < perPage) {
        setHasMorePosts(false);
      }

      setWordpressData((prev) => [...prev, ...strippedData]);
    } catch (error) {
      console.error("Error fetching WordPress data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

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

  useEffect(() => {
    fetchWordpressData();
  }, [fetchWordpressData]);

  useEffect(() => {
    const handleScroll = () => {
      if (!isLoading && hasMorePosts) {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollTop + clientHeight >= scrollHeight - 200) {
          setCurrentPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoading, hasMorePosts]);

  return (
    <div className="mx-auto max-w-[1450px]">
      <div className="m-8 grid grid-cols-1 gap-6 max-md:m-3 md:grid-cols-2 lg:grid-cols-3">
        {wordpressData.map((post: WordpressPost, index: number) => (
          <a
            href={post.link}
            rel="noreferrer"
            target="_blank"
            key={index}
            className="h-full"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#333] bg-[#181818] hover:bg-[#202020]">
              {post.imageUrl && (
                <div className="relative h-48 w-full">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#303030] via-[#383838] to-[#303030]" />
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
                    loading="lazy"
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "1";
                    }}
                  />
                </div>
              )}
              <div className="flex flex-grow flex-col p-6">
                <h2 className="m-0 mb-3 text-left font-bold text-white">
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
                <p className="m-0 text-[#d0d0d0]">{post.excerpt}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
      {isLoading && <Loader lang="en" />}
    </div>
  );
};

export default WordpressFetcher;
