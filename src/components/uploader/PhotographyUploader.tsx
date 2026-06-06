import React, { useEffect, useRef, useState } from "react";
import SharedCarousel from "../GenericCarousel";

interface UploadedFile {
  url: string;
  publicId: string;
  name: string;
  tags: string[];
}

interface QueuedFile {
  file: File;
  id: string;
  previewUrl: string;
}

type UploadPhase = "preparing" | "uploading" | "processing";

interface UploadSignature {
  apiKey: string;
  signature: string;
  tags?: string;
  timestamp: string;
  uploadUrl: string;
}

interface UploadStatus {
  currentFileName: string;
  currentIndex: number;
  phase: UploadPhase;
  progress: number;
  speedBytesPerSecond: number;
  totalFiles: number;
}

interface UploadTelemetry {
  batchLoadedBytes: number;
  batchTotalBytes: number;
  currentFileLoadedBytes: number;
  currentFileName: string;
  currentFileSize: number;
  currentIndex: number;
  lastProgressAt: number;
  lastProgressBytes: number;
  phase: UploadPhase;
  speedBytesPerSecond: number;
  totalFiles: number;
}

const MAX_FILES = 20;
const MAX_FILE_SIZE = 16 * 1024 * 1024;
const PROCESSING_PROGRESS_CAP = 0.98;

const formatUploadSpeed = (bytesPerSecond: number) => {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
    return "Calculating...";
  }

  if (bytesPerSecond >= 1024 * 1024) {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }

  if (bytesPerSecond >= 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  }

  return `${Math.round(bytesPerSecond)} B/s`;
};

const formatPhase = (phase: UploadPhase) => {
  switch (phase) {
    case "preparing":
      return "Preparing upload";
    case "processing":
      return "Processing upload";
    case "uploading":
    default:
      return "Uploading";
  }
};

const truncateResponse = (text: string) =>
  text.length > 220 ? `${text.slice(0, 220)}...` : text;

const getErrorMessageFromPayload = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const error = (payload as { error?: unknown }).error;
  const details = (payload as { details?: unknown }).details;

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }
  }

  if (typeof details === "string") {
    return details;
  }

  return fallback;
};

const getUploadErrorMessage = (responseText: string, fallback: string) => {
  const trimmed = responseText.trim();

  if (!trimmed) {
    return fallback;
  }

  try {
    return getErrorMessageFromPayload(JSON.parse(trimmed), fallback);
  } catch {
    return truncateResponse(trimmed);
  }
};

const parseUploadSignature = (responseText: string): UploadSignature => {
  const trimmed = responseText.trim();

  if (!trimmed) {
    throw new Error("Upload endpoint returned an empty signature response");
  }

  let payload: unknown;

  try {
    payload = JSON.parse(trimmed);
  } catch {
    throw new Error(
      `Upload endpoint returned a non-JSON response: ${truncateResponse(
        trimmed,
      )}`,
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Upload endpoint returned an invalid signature response");
  }

  const { apiKey, signature, tags, timestamp, uploadUrl } = payload as {
    apiKey?: unknown;
    signature?: unknown;
    tags?: unknown;
    timestamp?: unknown;
    uploadUrl?: unknown;
  };

  if (
    typeof apiKey !== "string" ||
    typeof signature !== "string" ||
    typeof timestamp !== "string" ||
    typeof uploadUrl !== "string"
  ) {
    throw new Error(
      "Upload endpoint returned an incomplete signature response",
    );
  }

  return {
    apiKey,
    signature,
    tags: typeof tags === "string" ? tags : undefined,
    timestamp,
    uploadUrl,
  };
};

const parseCloudinaryUpload = (responseText: string) => {
  const trimmed = responseText.trim();

  if (!trimmed) {
    throw new Error("Cloudinary returned an empty upload response");
  }

  let payload: unknown;

  try {
    payload = JSON.parse(trimmed);
  } catch {
    throw new Error(
      `Cloudinary returned a non-JSON response: ${truncateResponse(trimmed)}`,
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Cloudinary returned an invalid upload response");
  }

  const { public_id: publicId, secure_url: secureUrl } = payload as {
    public_id?: unknown;
    secure_url?: unknown;
  };

  if (typeof publicId !== "string" || typeof secureUrl !== "string") {
    throw new Error("Cloudinary returned an incomplete upload response");
  }

  return {
    publicId,
    url: secureUrl,
  };
};

const createQueueId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const PhotographyUploader: React.FC = () => {
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [errors, setErrors] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const uploadTelemetryRef = useRef<UploadTelemetry | null>(null);
  const queueRef = useRef<QueuedFile[]>([]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    return () => {
      queueRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (carouselIndex >= queue.length) {
      setCarouselIndex(Math.max(0, queue.length - 1));
    }
  }, [carouselIndex, queue.length]);

  const stopProgressAnimation = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startProgressAnimation = () => {
    stopProgressAnimation();

    const tick = () => {
      const telemetry = uploadTelemetryRef.current;

      if (!telemetry) {
        animationFrameRef.current = null;
        return;
      }

      const now = performance.now();
      const elapsedSeconds = Math.max(
        0,
        (now - telemetry.lastProgressAt) / 1000,
      );
      const projectedCurrentBytes =
        telemetry.currentFileLoadedBytes +
        telemetry.speedBytesPerSecond * elapsedSeconds;
      const currentFileCap =
        telemetry.phase === "processing"
          ? telemetry.currentFileSize * PROCESSING_PROGRESS_CAP
          : telemetry.currentFileSize;
      const visibleCurrentBytes = Math.min(
        currentFileCap,
        projectedCurrentBytes,
        telemetry.currentFileSize,
      );
      const progress =
        telemetry.batchTotalBytes > 0
          ? ((telemetry.batchLoadedBytes + visibleCurrentBytes) /
              telemetry.batchTotalBytes) *
            100
          : 0;

      setUploadStatus({
        currentFileName: telemetry.currentFileName,
        currentIndex: telemetry.currentIndex,
        phase: telemetry.phase,
        progress: Math.min(100, Math.max(0, progress)),
        speedBytesPerSecond: telemetry.speedBytesPerSecond,
        totalFiles: telemetry.totalFiles,
      });

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
  };

  useEffect(() => stopProgressAnimation, []);

  const handleAddTag = () => {
    const newTags = tagInput
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag && !tags.includes(tag));

    if (newTags.length > 0) {
      setTags([...tags, ...newTags]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (tagToRemove === "featured") {
      setIsFeatured(false);
      return;
    }

    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const requestUploadSignature = async (uploadTags: string[]) => {
    const formData = new FormData();
    formData.append("mode", "signature");
    formData.append("tags", JSON.stringify(uploadTags));

    const response = await fetch("/api/cloudinary/upload", {
      method: "POST",
      body: formData,
    });
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        getUploadErrorMessage(responseText, "Failed to prepare upload"),
      );
    }

    return parseUploadSignature(responseText);
  };

  const uploadFile = async (file: File, uploadTags: string[]) => {
    const telemetry = uploadTelemetryRef.current;

    if (telemetry) {
      telemetry.phase = "preparing";
      telemetry.currentFileLoadedBytes = 0;
      telemetry.lastProgressAt = performance.now();
      telemetry.lastProgressBytes = 0;
      telemetry.speedBytesPerSecond = 0;
    }

    const signature = await requestUploadSignature(uploadTags);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", signature.timestamp);
    formData.append("signature", signature.signature);

    if (signature.tags) {
      formData.append("tags", signature.tags);
    }

    return new Promise<UploadedFile>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (telemetry) {
        telemetry.phase = "uploading";
        telemetry.lastProgressAt = performance.now();
      }

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || !telemetry) {
          return;
        }

        const now = performance.now();
        const loadedBytes = Math.min(event.loaded, file.size);
        const deltaBytes = loadedBytes - telemetry.lastProgressBytes;
        const deltaSeconds = (now - telemetry.lastProgressAt) / 1000;

        if (deltaBytes >= 0 && deltaSeconds > 0) {
          const instantSpeed = deltaBytes / deltaSeconds;
          telemetry.speedBytesPerSecond =
            telemetry.speedBytesPerSecond > 0
              ? telemetry.speedBytesPerSecond * 0.7 + instantSpeed * 0.3
              : instantSpeed;
        }

        telemetry.currentFileLoadedBytes = loadedBytes;
        telemetry.lastProgressAt = now;
        telemetry.lastProgressBytes = loadedBytes;
      };

      xhr.upload.onload = () => {
        if (!telemetry) {
          return;
        }

        telemetry.currentFileLoadedBytes = file.size;
        telemetry.lastProgressAt = performance.now();
        telemetry.lastProgressBytes = file.size;
        telemetry.phase = "processing";
      };

      xhr.onerror = () => {
        reject(new Error("Network error while uploading to Cloudinary"));
      };

      xhr.onabort = () => {
        reject(new Error("Upload was cancelled"));
      };

      xhr.onload = () => {
        const responseText = xhr.responseText ?? "";

        if (xhr.status < 200 || xhr.status >= 300) {
          reject(
            new Error(
              getUploadErrorMessage(
                responseText,
                "Upload failed in Cloudinary",
              ),
            ),
          );
          return;
        }

        try {
          const data = parseCloudinaryUpload(responseText);

          resolve({
            url: data.url,
            publicId: data.publicId,
            name: file.name,
            tags: uploadTags,
          });
        } catch (error) {
          reject(error);
        }
      };

      xhr.open("POST", signature.uploadUrl);
      xhr.send(formData);
    });
  };

  const validateFiles = (fileList: File[], currentQueueSize: number) => {
    if (currentQueueSize + fileList.length > MAX_FILES) {
      throw new Error(`Upload queue cannot exceed ${MAX_FILES} images`);
    }

    for (const file of fileList) {
      if (!file.type.startsWith("image/")) {
        throw new Error(`${file.name} is not an image file`);
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`${file.name} exceeds 16MB limit`);
      }
    }
  };

  const addFilesToQueue = (files: FileList) => {
    setErrors(null);
    const fileList = Array.from(files);

    try {
      validateFiles(fileList, queue.length);
    } catch (error) {
      setErrors(
        error instanceof Error ? error.message : "Failed to add files to queue",
      );
      return;
    }

    const queuedFiles = fileList.map((file) => ({
      file,
      id: createQueueId(),
      previewUrl: URL.createObjectURL(file),
    }));

    setQueue((prev) => {
      const nextQueue = [...prev, ...queuedFiles];
      setCarouselIndex(nextQueue.length - 1);
      return nextQueue;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => {
      const removeIndex = prev.findIndex((queuedFile) => queuedFile.id === id);
      const item = prev[removeIndex];

      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }

      const nextQueue = prev.filter((queuedFile) => queuedFile.id !== id);

      if (removeIndex !== -1) {
        setCarouselIndex((currentIndex) =>
          Math.min(currentIndex, Math.max(0, nextQueue.length - 1)),
        );
      }

      return nextQueue;
    });
  };

  const getUploadTags = () => {
    const uploadTags = [...tags];

    if (isFeatured && !uploadTags.includes("featured")) {
      uploadTags.push("featured");
    }

    return uploadTags;
  };

  const submitQueue = async () => {
    if (queue.length === 0 || uploading) {
      return;
    }

    setErrors(null);
    setUploading(true);

    const uploadTags = getUploadTags();
    const itemsToUpload = [...queue];
    const batchTotalBytes = itemsToUpload.reduce(
      (total, item) => total + item.file.size,
      0,
    );

    uploadTelemetryRef.current = {
      batchLoadedBytes: 0,
      batchTotalBytes,
      currentFileLoadedBytes: 0,
      currentFileName: itemsToUpload[0]?.file.name ?? "",
      currentFileSize: itemsToUpload[0]?.file.size ?? 0,
      currentIndex: 0,
      lastProgressAt: performance.now(),
      lastProgressBytes: 0,
      phase: "preparing",
      speedBytesPerSecond: 0,
      totalFiles: itemsToUpload.length,
    };
    startProgressAnimation();

    try {
      for (const [index, item] of itemsToUpload.entries()) {
        const telemetry = uploadTelemetryRef.current;

        if (telemetry) {
          telemetry.currentFileName = item.file.name;
          telemetry.currentFileSize = item.file.size;
          telemetry.currentIndex = index;
          telemetry.currentFileLoadedBytes = 0;
          telemetry.lastProgressAt = performance.now();
          telemetry.lastProgressBytes = 0;
          telemetry.phase = "preparing";
          telemetry.speedBytesPerSecond = 0;
        }

        const result = await uploadFile(item.file, uploadTags);

        if (telemetry) {
          telemetry.batchLoadedBytes += item.file.size;
          telemetry.currentFileLoadedBytes = 0;
          telemetry.lastProgressAt = performance.now();
          telemetry.lastProgressBytes = 0;
        }

        URL.revokeObjectURL(item.previewUrl);
        setQueue((prev) =>
          prev.filter((queuedFile) => queuedFile.id !== item.id),
        );
        setUploaded((prev) => [...prev, result]);
      }
    } catch (error) {
      setErrors(
        error instanceof Error ? error.message : "Failed to upload files",
      );
    } finally {
      uploadTelemetryRef.current = null;
      stopProgressAnimation();
      setUploadStatus(null);
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFilesToQueue(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const showQueue = queue.length > 0;
  const currentQueueItem = queue[carouselIndex];
  const displayTags = getUploadTags();

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {/* Featured Toggle */}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="featured"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="mr-2 h-4 w-4 cursor-pointer rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="featured" className="cursor-pointer text-zinc-200">
          Featured Photography
        </label>
      </div>

      {/* Tag Input */}
      <div className="mb-4">
        <label
          htmlFor="tags"
          className="mb-2 block text-sm font-medium text-zinc-200"
        >
          Tags (comma-separated, applied on upload)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAddTag}
            placeholder="e.g., portrait, nature, landscape"
            className="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddTag}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
      </div>

      {!showQueue ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`ut-container relative mx-auto flex min-h-[28rem] w-full cursor-pointer flex-col justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-zinc-600 bg-zinc-800/50 hover:border-zinc-500"
          }`}
        >
          <div className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mb-4 h-16 w-16 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            <div className="text-zinc-200">Add images to queue</div>
            <div className="mt-2 text-sm text-zinc-300">
              Images up to 16MB (max {MAX_FILES} in queue)
              {isFeatured ? " - Featured" : ""}
            </div>
          </div>
        </div>
      ) : (
        currentQueueItem && (
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`rounded-lg border p-4 transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-500/10"
                : "border-zinc-700 bg-zinc-800/50"
            } ${uploading ? "pointer-events-none opacity-50" : ""}`}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">
                Upload Queue ({queue.length})
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                Tags and featured status apply when you upload. Click, drag, or
                drop to add more images before submitting.
              </p>
            </div>

            {uploading && uploadStatus && (
              <div className="mb-4 space-y-3 rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
                <div className="flex items-center justify-between gap-4 text-sm text-zinc-200">
                  <div className="min-w-0 truncate">
                    Uploading {uploadStatus.currentIndex + 1} of{" "}
                    {uploadStatus.totalFiles}:{" "}
                    <span className="font-medium text-white">
                      {uploadStatus.currentFileName}
                    </span>
                  </div>
                  <div className="shrink-0 font-medium text-white">
                    {Math.round(uploadStatus.progress)}%
                  </div>
                </div>

                <div className="relative h-2 overflow-hidden rounded-full bg-zinc-700">
                  <div
                    className="h-full bg-blue-500 transition-[width] duration-150 ease-out"
                    style={{ width: `${uploadStatus.progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                  <div>
                    Speed:{" "}
                    <span className="font-medium text-zinc-200">
                      {formatUploadSpeed(uploadStatus.speedBytesPerSecond)}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    {formatPhase(uploadStatus.phase)}
                  </div>
                </div>
              </div>
            )}

            <SharedCarousel
              items={queue}
              getKey={(item) => item.id}
              currentIndex={carouselIndex}
              onCurrentIndexChange={setCarouselIndex}
              disabled={uploading}
              showDots={false}
              previousLabel="Previous image"
              nextLabel="Next image"
              aspectRatio={16 / 9}
              viewportClassName="min-h-[12rem] max-h-[350px] rounded-lg bg-zinc-900"
              renderSlide={({ item }) => (
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              )}
            />

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">
                  {currentQueueItem.file.name}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="shrink-0 text-zinc-400">
                    {(currentQueueItem.file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  {displayTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveTag(tag);
                      }}
                      disabled={uploading}
                      className="group flex items-center gap-1 rounded-full border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>{tag}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-zinc-400 group-hover:text-zinc-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {queue.length > 1 && (
                  <div className="text-sm text-zinc-400">
                    {carouselIndex + 1} / {queue.length}
                  </div>
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFromQueue(currentQueueItem.id);
                  }}
                  disabled={uploading}
                  aria-label={`Remove ${currentQueueItem.file.name} from queue`}
                  className="flex items-center gap-1 rounded-full border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-zinc-200 transition-colors hover:border-red-500 hover:bg-red-950/60 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {showQueue && (
        <button
          type="button"
          onClick={submitQueue}
          disabled={uploading}
          className="absolute bottom-8 right-8 z-10 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-900/30 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading
            ? "Uploading..."
            : `Upload ${queue.length} image${queue.length === 1 ? "" : "s"}`}
        </button>
      )}

      {/* Errors */}
      {errors && (
        <div className="rounded-lg border border-red-500 bg-red-500/10 p-3 text-red-500">
          {errors}
        </div>
      )}

      {/* Uploaded Files */}
      {uploaded.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">
            Uploaded Images ({uploaded.length})
          </h3>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {uploaded.map((file, index) => (
              <div
                key={`${file.publicId}-${index}`}
                className="group relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900"
              >
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    className="block h-auto w-full object-contain transition-opacity group-hover:opacity-95"
                  />
                  <div className="border-t border-zinc-700 p-3">
                    <div className="mb-2 text-sm font-medium text-white">
                      {file.name}
                    </div>
                    {file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {file.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotographyUploader;
