import React, { useState } from "react";

interface ProgressiveImageProps {
  placeholderSrc: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  upgrade?: boolean;
  loading?: "eager" | "lazy";
  draggable?: boolean;
  onUpgradeLoad?: () => void;
}

const layerClassName =
  "absolute inset-0 h-full w-full object-cover transition-opacity duration-300";

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  placeholderSrc,
  srcSet,
  sizes,
  alt,
  upgrade = true,
  loading = "lazy",
  draggable,
  onUpgradeLoad,
}) => {
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);
  const [upgradeRequested, setUpgradeRequested] = useState(upgrade);
  const [upgradeLoaded, setUpgradeLoaded] = useState(false);

  if (upgrade && !upgradeRequested) {
    setUpgradeRequested(true);
  }

  return (
    <>
      {!placeholderLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#303030] via-[#383838] to-[#303030]" />
      )}
      <img
        src={placeholderSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        draggable={draggable}
        className={`${layerClassName} ${placeholderLoaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setPlaceholderLoaded(true)}
      />
      {srcSet && upgradeRequested && placeholderLoaded && (
        <img
          // `sizes` must be set before `srcSet` and `src` so the first
          // candidate selection sees it.
          sizes={sizes}
          srcSet={srcSet}
          src={placeholderSrc}
          alt=""
          aria-hidden
          loading={loading}
          decoding="async"
          draggable={draggable}
          className={`${layerClassName} ${upgradeLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => {
            setUpgradeLoaded(true);
            onUpgradeLoad?.();
          }}
        />
      )}
    </>
  );
};

export default ProgressiveImage;
