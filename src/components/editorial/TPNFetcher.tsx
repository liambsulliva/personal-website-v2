import { useState, useEffect, useCallback, useRef } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allMediaData, setAllMediaData] = useState<any[]>([]);
  const [mediaIds, setMediaIds] = useState<number[]>([]);
  const initialLoadDone = useRef(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch media IDs once on mount
  const fetchMediaIds = useCallback(async () => {
    try {
      // 24397: Assistant Visuals Editor
      // 23238: Senior Staff Photographer
      // 22613: Staff Photographer
      const staffNameIds = [24397, 23238, 22613];
      
      const allMedia: any[] = [];
      for (const staffId of staffNameIds) {
        const mediaUrl = `https://pittnews.com/wp-json/wp/v2/media?staff_name=${staffId}&per_page=100`;
        const mediaResponse = await fetch(mediaUrl);
        const mediaData = await mediaResponse.json();
        if (mediaData && mediaData.length > 0) {
          allMedia.push(...mediaData);
        }
      }

      if (allMedia.length === 0) {
        //console.log("No media found for staff_name");
        return { ids: [], media: [] };
      }

      const ids = allMedia.map((media: any) => media.id);
      //console.log(`Found ${ids.length} media items across all positions`);
      return { ids, media: allMedia };
    } catch (error) {
      //console.error("Error fetching media IDs:", error);
      return { ids: [], media: [] };
    }
  }, []);

  // Fetch one page (scroll) of posts
  const fetchPostsPage = useCallback(async (page: number) => {
    if (mediaIds.length === 0) return { posts: [], hasMore: false };

    try {
      const perPage = 100;
      const postsUrl = `https://pittnews.com/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&_embed`;
      const postsResponse = await fetch(postsUrl);
      
      if (!postsResponse.ok) {
        return { posts: [], hasMore: false };
      }
      
      const posts = await postsResponse.json();
      
      if (!posts || posts.length === 0) {
        return { posts: [], hasMore: false };
      }

      const mediaIdsSet = new Set(mediaIds);

      // Filter posts that use the right pics
      const matchingPosts = posts.filter(
        (post: any) =>
          post.featured_media && mediaIdsSet.has(post.featured_media)
      );

      const strippedData = matchingPosts.map((post: any) => {
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
          const media = allMediaData.find(
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

      //console.log(`Page ${page}: Found ${matchingPosts.length} matching posts`);

      // If we found 0 matching posts on this page, assume we've gone past all photos
      const shouldContinue = matchingPosts.length > 0 && posts.length === perPage;

      return {
        posts: strippedData,
        hasMore: shouldContinue,
      };
    } catch (error) {
      //console.error(`Error fetching page ${page}:`, error);
      return { posts: [], hasMore: false };
    }
  }, [mediaIds, allMediaData]);

  function decodeEntities(text: string) {
    text = text.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });
    return text;
  }

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      if (initialLoadDone.current) return;
      initialLoadDone.current = true;

      setIsLoading(true);
      const { ids, media } = await fetchMediaIds();
      
      if (ids.length === 0) {
        setIsLoading(false);
        setHasMore(false);
        return;
      }

      setMediaIds(ids);
      setAllMediaData(media);
      setIsLoading(false);
    };

    loadInitialData();
  }, [fetchMediaIds]);

  useEffect(() => {
    const loadFirstPage = async () => {
      if (mediaIds.length === 0 || tpnData.length > 0) return;

      setIsLoading(true);
      const { posts, hasMore: moreAvailable } = await fetchPostsPage(1);
      setTpnData(posts);
      setHasMore(moreAvailable);
      setCurrentPage(1);
      setIsLoading(false);
    };

    loadFirstPage();
  }, [mediaIds, fetchPostsPage, tpnData.length]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = currentPage + 1;

    const { posts, hasMore: moreAvailable } = await fetchPostsPage(nextPage);
    
    setTpnData(prev => [...prev, ...posts]);
    setHasMore(moreAvailable);
    setCurrentPage(nextPage);
    setIsLoading(false);
  }, [isLoading, hasMore, currentPage, fetchPostsPage]);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMore]);

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
      <div ref={observerTarget} className="h-10" />
      {isLoading && <Loader lang="en" />}
    </div>
  );
};

export default TPNFetcher;
