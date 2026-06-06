import RedDotDemo from "./RedDotDemo";

const DEFAULT_IMAGE = "/red-dot-demo-ig.webp";
const DEFAULT_ALT = "App icon";

export interface RedDotDemoStripProps {
  image?: string;
  alt?: string;
}

export default function RedDotDemoStrip({
  image = DEFAULT_IMAGE,
  alt = DEFAULT_ALT,
}: RedDotDemoStripProps) {
  return (
    <div
      className="relative mx-auto flex w-fit flex-col items-center rounded-3xl p-6 sm:px-8 sm:py-7"
      style={{
        background: "rgba(255,255,255,0.15)",
        boxShadow:
          "0 4px 24px 0 rgba(0,0,0,0.10), 0 1.5px 10px 0 rgba(255,255,255,0.10) inset",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255,255,255,0.26)",
      }}
      role="group"
      aria-label="Notification badge demos"
    >
      <span
        className="mb-4 text-base font-semibold tracking-wider text-white/80 drop-shadow-[0_1.5px_6px_rgba(0,0,0,0.13)]"
        aria-hidden="true"
      >
        Here's the Red Dot Effect. Click em!
      </span>
      <div className="flex min-w-0 flex-wrap items-end justify-center gap-6 sm:gap-8">
        <RedDotDemo image={image} alt={alt} />
        <RedDotDemo image={image} alt={alt} />
        <RedDotDemo image={image} alt={alt} />
      </div>
    </div>
  );
}
