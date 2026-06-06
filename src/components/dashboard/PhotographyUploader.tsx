import React, { useEffect, useRef, useState } from "react";

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

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Unknown size";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
};

const formatFileType = (file: File) => {
  const fromMime = file.type.split("/")[1];

  if (fromMime) {
    return fromMime.toUpperCase();
  }

  const extension = file.name.split(".").pop();

  return extension ? extension.toUpperCase() : "Unknown";
};

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
      headers: {
        "X-Dashboard-Request": "true",
      },
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

    setQueue((prev) => [...prev, ...queuedFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((queuedFile) => queuedFile.id === id);

      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }

      return prev.filter((queuedFile) => queuedFile.id !== id);
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
  const displayTags = getUploadTags();
  const addMoreDropzoneSpanClass = [
    queue.length % 2 === 0 ? "sm:col-span-2" : "sm:col-span-1",
    queue.length % 3 === 0 ? "lg:col-span-3" : "lg:col-span-1",
  ].join(" ");

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
        {displayTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {displayTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleRemoveTag(tag)}
                disabled={uploading}
                className="rounded-full bg-blue-600/20 px-2 py-0.5 text-xs text-blue-200 transition-colors hover:bg-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tag} ×
              </button>
            ))}
          </div>
        )}
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
        <section
          className={`space-y-6 ${uploading ? "pointer-events-none opacity-50" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading && uploadStatus && (
            <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
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

          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
              isDragging ? "rounded-lg ring-2 ring-blue-500/50" : ""
            }`}
          >
            {queue.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/70"
              >
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="aspect-[4/3] w-full bg-zinc-900 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />

                <div className="space-y-3 border-t border-zinc-800 p-4">
                  <div>
                    <h4 className="truncate text-sm font-medium text-white">
                      {item.file.name}
                    </h4>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {formatBytes(item.file.size)} - {formatFileType(item.file)}
                    </span>
                  </div>

                  {displayTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {displayTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-600/20 px-2 py-0.5 text-xs text-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFromQueue(item.id)}
                    disabled={uploading}
                    className="w-full rounded-lg border border-red-500/60 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove from Queue
                  </button>
                </div>
              </article>
            ))}

            <button
              type="button"
              onClick={handleClick}
              className={`flex min-h-[16rem] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${addMoreDropzoneSpanClass} ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-700 bg-zinc-950/60 hover:border-zinc-500 hover:bg-zinc-900/60"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-3 h-10 w-10 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-sm font-medium text-zinc-300">
                Add more images
              </span>
              <span className="mt-1 text-xs text-zinc-500">
                Click or drop here
              </span>
            </button>
          </div>
        </section>
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
    </div>
  );
};

export default PhotographyUploader;
