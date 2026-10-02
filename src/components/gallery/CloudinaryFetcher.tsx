import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { Photo as AlbumPhoto } from "react-photo-album";
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import type {
  ImageSource,
  RenderSlideProps,
  SlideImage,
} from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Loader from "./Loader";
import "yet-another-react-lightbox/styles.css";
import CloudinaryMenu from "./CloudinaryMenu";
import ProgressiveImage from "./ProgressiveImage";
import {
  PLACEHOLDER_WIDTH,
  cappedWidths,
  cloudinaryTransform,
  toSrcSet,
  widthSteps,
} from "../../lib/cloudinaryImage";
import { publicCloudinarySearchUrl } from "../../lib/cloudinarySearchPolicy";

type GalleryPhoto = AlbumPhoto & {
  previewSrcSet: string;
  lightboxSrcSet: ImageSource[];
};

interface CloudinaryResource {
  secure_url: string;
  width: number;
  height: number;
}

const PAGE_SIZE = 20;

const PREVIEW_TRANSFORM = "c_limit,f_auto,q_auto";
const LIGHTBOX_TRANSFORM = "c_limit,f_auto,q_auto:best";
const PREVIEW_WIDTHS = widthSteps(PLACEHOLDER_WIDTH, 1280);
const PREVIEW_MAX_WIDTH = PREVIEW_WIDTHS[PREVIEW_WIDTHS.length - 1];
const LIGHTBOX_WIDTHS = [...PREVIEW_WIDTHS, ...widthSteps(1440, 3840)];

const LIGHTBOX_MIN_ZOOM_HEADROOM = 2;

const ALBUM_SIZES = {
  size: "calc(100vw - 64px)",
  sizes: [{ viewport: "(max-width: 767px)", size: "calc(100vw - 24px)" }],
};

function scaledSource(
  src: string,
  width: number,
  naturalWidth: number,
  naturalHeight: number,
): ImageSource {
  return {
    src,
    width,
    height: Math.round((width / naturalWidth) * naturalHeight),
  };
}

function toGalleryPhoto(resource: CloudinaryResource): GalleryPhoto {
  const { secure_url: baseUrl, width: rw, height: rh } = resource;

  const imageUrl = (width: number, transform: string) =>
    width >= rw
      ? cloudinaryTransform(baseUrl, transform)
      : cloudinaryTransform(baseUrl, `${transform},w_${width}`);

  const previewWidths = cappedWidths(
    PREVIEW_WIDTHS,
    Math.min(rw, PREVIEW_MAX_WIDTH),
  );
  const lightboxSrcSet = cappedWidths(LIGHTBOX_WIDTHS, rw).map((width) =>
    scaledSource(
      imageUrl(
        width,
        width > PREVIEW_MAX_WIDTH ? LIGHTBOX_TRANSFORM : PREVIEW_TRANSFORM,
      ),
      width,
      rw,
      rh,
    ),
  );

  return {
    src: imageUrl(previewWidths[0], PREVIEW_TRANSFORM),
    width: rw,
    height: rh,
    previewSrcSet: toSrcSet(
      previewWidths.map((width) => ({
        src: imageUrl(width, PREVIEW_TRANSFORM),
        width,
      })),
    ),
    lightboxSrcSet,
  };
}

function LightboxSlide({
  slide,
  offset,
  rect,
  zoom = 1,
}: RenderSlideProps & { slide: SlideImage }) {
  const naturalWidth = slide.width ?? rect.width;
  const naturalHeight = slide.height ?? rect.height;
  const fit = Math.min(
    rect.width / naturalWidth,
    rect.height / naturalHeight,
    1,
  );
  const displayWidth = Math.round(naturalWidth * fit);
  const displayHeight = Math.round(naturalHeight * fit);

  const requestedZoom =
    offset === 0
      ? 2 ** Math.ceil(Math.log2(Math.max(zoom, LIGHTBOX_MIN_ZOOM_HEADROOM)))
      : 1;
  // Only ever grow, so zooming back out doesn't make the browser pick (and
  // fetch) a smaller candidate than the one already on screen.
  const [sizesZoom, setSizesZoom] = useState(requestedZoom);
  if (requestedZoom > sizesZoom) {
    setSizesZoom(requestedZoom);
  }

  return (
    <div
      className="relative"
      style={{ width: displayWidth, height: displayHeight }}
    >
      <ProgressiveImage
        placeholderSrc={slide.src}
        srcSet={toSrcSet(slide.srcSet ?? [])}
        sizes={`${displayWidth * sizesZoom}px`}
        alt={slide.alt ?? ""}
        upgrade={Math.abs(offset) <= 1}
        loading="eager"
        draggable={false}
      />
    </div>
  );
}

const CloudinaryFetcher: React.FC = () => {
  const [index, setIndex] = useState(-1);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (tag: string, cursor: string | null) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoading(true);
    setError(false);

    try {
      const response = await fetch(
        publicCloudinarySearchUrl({
          expression: tag
            ? `resource_type:image AND tags=${tag}`
            : "resource_type:image",
          max_results: PAGE_SIZE,
          next_cursor: cursor,
        }),
        { signal: controller.signal },
      );

      if (!response.ok) {
        throw new Error(`Search responded with ${response.status}`);
      }

      const data: { resources?: CloudinaryResource[]; next_cursor?: string } =
        await response.json();
      const page = (data.resources ?? []).map(toGalleryPhoto);

      setPhotos((prev) => (cursor ? [...prev, ...page] : page));
      setNextCursor(data.next_cursor ?? null);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("CloudinaryFetcher: failed to load photos", err);
      setError(true);
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadPage(selectedTag, null);
    return () => requestRef.current?.abort();
  }, [selectedTag, loadPage]);

  // Re-created after every page, so the observer's initial callback loads the
  // next page when the grid still doesn't fill the viewport.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isLoading || error || nextCursor === null) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadPage(selectedTag, nextCursor);
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoading, error, nextCursor, selectedTag, loadPage]);

  const handleTagChange = (tag: string) => {
    if (tag === selectedTag) return;
    setSelectedTag(tag);
    setPhotos([]);
    setNextCursor(null);
  };

  const lightboxSlides = useMemo(
    () =>
      photos.map(({ src, width, height, lightboxSrcSet }) => ({
        src,
        width,
        height,
        srcSet: lightboxSrcSet,
      })),
    [photos],
  );

  return (
    <div className="m-8 pb-16 max-md:m-3">
      <CloudinaryMenu onTagChange={handleTagChange} />
      {photos.length > 0 ? (
        <PhotoAlbum
          photos={photos}
          layout="masonry"
          renderPhoto={({
            photo,
            layout,
            imageProps: { alt, style, sizes },
          }) => (
            <button
              type="button"
              aria-label={`Open photo ${layout.index + 1}`}
              style={{ position: "relative", ...style }}
              onClick={() => setIndex(layout.index)}
            >
              <ProgressiveImage
                placeholderSrc={photo.src}
                srcSet={photo.previewSrcSet}
                sizes={sizes}
                alt={alt ?? ""}
              />
            </button>
          )}
          columns={(containerWidth) => {
            if (containerWidth < 400) return 2;
            if (containerWidth < 800) return 3;
            return 4;
          }}
          sizes={ALBUM_SIZES}
          defaultContainerWidth={360}
        />
      ) : !isLoading && !error ? (
        <div className="flex h-32 w-full items-center justify-center text-white">
          <p>No photos found</p>
        </div>
      ) : null}
      <div ref={sentinelRef} aria-hidden />
      {error && (
        <div className="flex flex-col items-center gap-4 py-8 text-white">
          <p>Couldn't load photos.</p>
          <button
            type="button"
            onClick={() => loadPage(selectedTag, nextCursor)}
            className="rounded-[15px] border border-[#353535] bg-[#181818] px-4 py-2 transition-all duration-100 hover:bg-[#252525] active:scale-95"
          >
            Try again
          </button>
        </div>
      )}
      <Lightbox
        plugins={[Zoom]}
        index={index}
        slides={lightboxSlides}
        open={index >= 0}
        close={() => setIndex(-1)}
        render={{
          slide: (props) => (
            <LightboxSlide {...props} slide={props.slide as SlideImage} />
          ),
        }}
      />
      {isLoading && <Loader />}
    </div>
  );
};

export default CloudinaryFetcher;
