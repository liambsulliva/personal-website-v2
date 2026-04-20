import React, { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface PdfSlideCarouselProps {
  // Document URL (e.g. /pitch-deck.pdf)
  src: string;
  // Slide frame width / height as a fraction (e.g. 16/10, 16/9).
  aspectRatio?: number;
  className?: string;
}

const NavigationButton: React.FC<{
  direction: "prev" | "next";
  onSelect: () => void;
  disabled?: boolean;
}> = ({ direction, onSelect, disabled }) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={disabled}
    className="relative flex w-fit flex-row items-center justify-center gap-2 rounded-full bg-[#f0f0f0]/50 px-2 py-0.5 backdrop-blur-sm transition-all duration-100 hover:bg-[#e0e0e0]/70 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
    aria-label={direction === "next" ? "Next slide" : "Previous slide"}
  >
    <span className="text-nowrap text-black">
      {direction === "next" ? "→" : "←"}
    </span>
  </button>
);

const PdfSlideCarousel: React.FC<PdfSlideCarouselProps> = ({
  src,
  aspectRatio = 16 / 10,
  className = "",
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canvasesRef = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderedRef = useRef<Set<number>>(new Set());
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const lastSlideWidthRef = useRef(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSlideWidth(el.clientWidth);
    });
    ro.observe(el);
    setSlideWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (slideWidth <= 0) return;
    const prev = lastSlideWidthRef.current;
    if (prev > 0 && prev !== slideWidth) {
      renderedRef.current = new Set();
    }
    lastSlideWidthRef.current = slideWidth;
  }, [slideWidth]);

  useEffect(() => {
    let cancelled = false;
    renderedRef.current = new Set();
    canvasesRef.current = [];
    setStatus("loading");
    setErrorMessage(null);
    setNumPages(0);
    setCurrent(0);

    const load = async () => {
      try {
        const task = pdfjsLib.getDocument({ url: src });
        const pdf = await task.promise;
        if (cancelled) {
          await pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          e instanceof Error ? e.message : "Failed to load document",
        );
      }
    };

    void load();

    return () => {
      cancelled = true;
      const p = pdfRef.current;
      pdfRef.current = null;
      if (p) void p.destroy();
    };
  }, [src]);

  const renderPage = useCallback(
    async (pageIndex: number) => {
      const pdf = pdfRef.current;
      if (!pdf || slideWidth <= 0) return;
      if (renderedRef.current.has(pageIndex)) return;

      const canvas = canvasesRef.current[pageIndex];
      if (!canvas) return;

      const pageNumber = pageIndex + 1;
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = slideWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });

      // High DPI rendering
      const devicePixelRatio = window.devicePixelRatio * 2 || 1;
      canvas.width = Math.floor(viewport.width * devicePixelRatio);
      canvas.height = Math.floor(viewport.height * devicePixelRatio);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      await page.render({
        canvasContext: ctx,
        viewport,
        transform: [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0],
      }).promise;
      renderedRef.current.add(pageIndex);
    },
    [slideWidth],
  );

  useEffect(() => {
    if (status !== "ready" || numPages === 0 || slideWidth <= 0) return;
    void renderPage(current);
    void renderPage(current + 1);
    void renderPage(current - 1);
  }, [status, numPages, current, slideWidth, renderPage]);

  const go = useCallback(
    (delta: number) => {
      setCurrent((prev) => {
        const next = prev + delta;
        if (next < 0 || next >= numPages) return prev;
        return next;
      });
    },
    [numPages],
  );

  const nextSlide = useCallback(() => go(1), [go]);
  const prevSlide = useCallback(() => go(-1), [go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextSlide, prevSlide]);

  if (status === "error") {
    return (
      <div
        className={`flex aspect-[16/10] w-full min-w-0 max-w-full items-center justify-center rounded-xl border border-[#333] bg-[#1a1a1a] px-4 text-center text-sm text-[#e0e0e0]/80 ${className}`}
      >
        {errorMessage ?? "Could not load PDF."}
      </div>
    );
  }

  return (
    <div className={`min-w-0 max-w-full overflow-x-hidden ${className}`.trim()}>
      <div
        ref={viewportRef}
        className="relative isolate w-full max-w-full overflow-hidden rounded-xl border border-[#333] bg-[#0d0d0d] shadow-lg"
        style={{ aspectRatio }}
      >
        {status === "loading" && (
          <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-[#303030] via-[#383838] to-[#303030]" />
        )}

        {status === "ready" && numPages > 0 && slideWidth > 0 && (
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{
              width: numPages * slideWidth,
              transform: `translateX(-${current * slideWidth}px)`,
            }}
          >
            {Array.from({ length: numPages }, (_, i) => (
              <div
                key={i}
                className="flex h-full flex-shrink-0 items-center justify-center bg-[#111]"
                style={{ width: slideWidth }}
              >
                <canvas
                  ref={(el) => {
                    canvasesRef.current[i] = el;
                  }}
                  className="max-h-full max-w-full object-contain"
                  aria-hidden={i !== current}
                />
              </div>
            ))}
          </div>
        )}

        {status === "ready" && numPages > 0 && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex w-14 items-center bg-gradient-to-r from-black/50 to-transparent pl-2">
              <div className="pointer-events-auto">
                <NavigationButton
                  direction="prev"
                  onSelect={prevSlide}
                  disabled={current === 0}
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex w-14 items-center justify-end bg-gradient-to-l from-black/50 to-transparent pr-2">
              <div className="pointer-events-auto">
                <NavigationButton
                  direction="next"
                  onSelect={nextSlide}
                  disabled={current >= numPages - 1}
                />
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[90%] -translate-x-1/2 flex-wrap justify-center gap-2">
              {Array.from({ length: numPages }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === current}
                  className={`h-3 w-3 shrink-0 rounded-full transition-colors ${
                    index === current
                      ? "bg-white"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
            <p className="sr-only" aria-live="polite">
              Slide {current + 1} of {numPages}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PdfSlideCarousel;
