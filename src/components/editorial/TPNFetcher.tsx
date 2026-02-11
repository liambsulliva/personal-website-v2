import { useState, useEffect, useCallback } from "react";
import Loader from "../gallery/Loader";

interface TPNPost {
  title: string;
  date: string;
  link: string;
  imageUrl: string | null;
}

const TPNFetcher = () => {
  const [tpnData, setTpnData] = useState<TPNPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTpnData = useCallback(async () => {
    setIsLoading(true);

    try {
      const mediaUrl = `https://pittnews.com/wp-json/wp/v2/media?staff_name=24397&per_page=100`;
      const mediaResponse = await fetch(mediaUrl);
      const mediaData = await mediaResponse.json();

      if (!mediaData || mediaData.length === 0) {
        console.log("No media found for staff_name");
        setTpnData([]);
        return;
      }

      const mediaIds = mediaData.map((media: any) => media.id);
      //console.log("Media IDs:", mediaIds);

      const postsUrl = `https://pittnews.com/wp-json/wp/v2/posts?per_page=100&_embed`;
      const postsResponse = await fetch(postsUrl);
      const allPosts = await postsResponse.json();

      const relevantPosts = allPosts.filter(
        (post: any) =>
          post.featured_media && mediaIds.includes(post.featured_media),
      );

      //console.log("Relevant posts:", relevantPosts);

      const strippedData = relevantPosts.map((post: any) => {
        const regex = /(<([^>]+)>)/gi;
        const strippedTitle = post.title.rendered.replace(regex, "");
        const decodedTitle = decodeEntities(strippedTitle);
        const dateObj = new Date(post.date || post.modified || "");
        const formattedDate = dateObj.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });

        let imageUrl = null;
        if (
          post._embedded &&
          post._embedded["wp:featuredmedia"] &&
          post._embedded["wp:featuredmedia"][0]
        ) {
          const media = post._embedded["wp:featuredmedia"][0];
          imageUrl =
            media.media_details?.sizes?.large?.source_url ||
            media.source_url ||
            null;
        } else {
          const media = mediaData.find(
            (m: any) => m.id === post.featured_media,
          );
          if (media) {
            imageUrl =
              media.media_details?.sizes?.large?.source_url ||
              media.source_url ||
              null;
          }
        }

        return {
          title: decodedTitle,
          date: formattedDate,
          link: post.link,
          imageUrl: imageUrl,
        };
      });

      setTpnData(strippedData);
    } catch (error) {
      console.error("Error fetching TPN data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function decodeEntities(text: string) {
    text = text.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });
    return text;
  }

  useEffect(() => {
    fetchTpnData();
    //console.log(tpnData);
  }, [fetchTpnData]);

  return (
    <div className="mx-auto w-[calc(100vw-4rem)] max-w-[1200px]">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tpnData.map((post: TPNPost, index: number) => (
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
              <div className="flex flex-grow flex-col p-5">
                <h2 className="m-0 text-left text-base font-bold text-white">
                  <div className="flex w-full items-center">
                    <span className="truncate">{post.title}</span>
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
                  </div>
                </h2>
                <p className="m-0 text-[#d0d0d0]">Photo • {post.date}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
      {isLoading && <Loader lang="en" />}
    </div>
  );
};

export default TPNFetcher;
