import React, { useState, useRef } from "react";

interface UploadedFile {
  url: string;
  publicId: string;
  name: string;
  tags: string[];
}

const PhotographyUploader: React.FC = () => {
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const uploadFile = async (file: File, index: number) => {
    const formData = new FormData();
    formData.append("file", file);

    // Combine tags with "featured" if checkbox is checked
    const uploadTags = [...tags];
    if (isFeatured && !uploadTags.includes("featured")) {
      uploadTags.push("featured");
    }

    formData.append("tags", JSON.stringify(uploadTags));

    try {
      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      return {
        url: data.url,
        publicId: data.publicId,
        name: file.name,
        tags: uploadTags,
      };
    } catch (error) {
      throw error;
    }
  };

  const handleFiles = async (files: FileList) => {
    setErrors(null);
    setUploading(true);
    setUploadProgress(Array(files.length).fill(0));

    const uploadPromises = Array.from(files).map(async (file, index) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error(`${file.name} is not an image file`);
      }

      // Validate file size (16MB)
      if (file.size > 16 * 1024 * 1024) {
        throw new Error(`${file.name} exceeds 16MB limit`);
      }

      try {
        const result = await uploadFile(file, index);
        setUploadProgress((prev) => {
          const newProgress = [...prev];
          newProgress[index] = 100;
          return newProgress;
        });
        return result;
      } catch (error) {
        throw error;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      setUploaded((prev) => [...prev, ...results]);
      setUploadProgress([]);
    } catch (error) {
      setErrors(
        error instanceof Error ? error.message : "Failed to upload files",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
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
      handleFiles(e.target.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
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
          Tags (comma-separated)
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

        {/* Display Tags */}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleRemoveTag(tag)}
                className="group flex items-center gap-2 rounded-full border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 transition-all hover:border-zinc-500 hover:bg-zinc-700"
              >
                <span>{tag}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200"
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
        )}
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`ut-container relative mx-auto w-full cursor-pointer rounded-lg border-2 border-dashed py-12 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-zinc-600 bg-zinc-800/50 hover:border-zinc-500"
        } ${uploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          {/* Upload Icon */}
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

          <div className="text-zinc-200">
            {uploading ? "Uploading..." : "Choose files or drag & drop"}
          </div>
          <div className="mt-2 text-sm text-zinc-300">
            Images up to 16MB (max 20)
            {isFeatured ? " - Featured" : ""}
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && uploadProgress.length > 0 && (
          <div className="mt-4 space-y-2 px-8">
            {uploadProgress.map((progress, index) => (
              <div
                key={index}
                className="relative h-2 overflow-hidden rounded-full bg-zinc-700"
              >
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {uploaded.map((file, index) => (
              <div
                key={`${file.publicId}-${index}`}
                className="group relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800"
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
                    className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="p-3">
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
