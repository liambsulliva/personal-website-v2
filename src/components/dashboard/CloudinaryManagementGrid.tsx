import React, { useCallback, useEffect, useMemo, useState } from "react";

interface CloudinaryResource {
  bytes?: number;
  created_at?: string;
  format?: string;
  public_id: string;
  secure_url: string;
  tags?: string[];
}

interface CloudinarySearchResponse {
  error?: unknown;
  details?: unknown;
  next_cursor?: string;
  resources?: unknown[];
}

const PAGE_SIZE = 30;

const getApiErrorMessage = (payload: unknown, fallback: string) => {
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

  return typeof details === "string" ? details : fallback;
};

const parseJsonResponse = async (response: Response) => {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return {};
  }

  try {
    return JSON.parse(responseText) as CloudinarySearchResponse;
  } catch {
    return { details: responseText };
  }
};

const isCloudinaryResource = (
  resource: unknown,
): resource is CloudinaryResource => {
  if (!resource || typeof resource !== "object") {
    return false;
  }

  const candidate = resource as {
    public_id?: unknown;
    secure_url?: unknown;
  };

  return (
    typeof candidate.public_id === "string" &&
    typeof candidate.secure_url === "string"
  );
};

const createThumbnailUrl = (secureUrl: string) =>
  secureUrl.includes("/upload/")
    ? secureUrl.replace("/upload/", "/upload/c_fill,w_640,h_480,q_auto,f_auto/")
    : secureUrl;

const formatBytes = (bytes?: number) => {
  if (!bytes || !Number.isFinite(bytes)) {
    return "Unknown size";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
};

const formatDate = (date?: string) => {
  if (!date) {
    return "Unknown date";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatResourceType = (format: string) => {
  const normalized =
    format.toLowerCase() === "jpg" ? "jpeg" : format.toLowerCase();

  return normalized.toUpperCase();
};

const CloudinaryManagementGrid: React.FC = () => {
  const [resources, setResources] = useState<CloudinaryResource[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const hasImages = resources.length > 0;
  const deletingCount = deletingIds.size;

  const fetchImages = useCallback(
    async (cursor: string | null = null, replace = false) => {
      setError(null);

      if (replace) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await fetch("/api/cloudinary/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expression: "resource_type:image",
            max_results: PAGE_SIZE,
            with_field: ["tags", "context"],
            ...(cursor ? { next_cursor: cursor } : {}),
          }),
        });
        const payload = await parseJsonResponse(response);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload, "Failed to fetch Cloudinary images"),
          );
        }

        const nextResources = Array.isArray(payload.resources)
          ? payload.resources.filter(isCloudinaryResource)
          : [];

        setResources((currentResources) => {
          if (replace) {
            return nextResources;
          }

          const existingIds = new Set(
            currentResources.map((resource) => resource.public_id),
          );
          const uniqueResources = nextResources.filter(
            (resource) => !existingIds.has(resource.public_id),
          );

          return [...currentResources, ...uniqueResources];
        });
        setNextCursor(
          typeof payload.next_cursor === "string" ? payload.next_cursor : null,
        );
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch Cloudinary images",
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchImages(null, true);
  }, [fetchImages]);

  const handleRefresh = () => {
    setNextCursor(null);
    fetchImages(null, true);
  };

  const handleDelete = async (resource: CloudinaryResource) => {
    const shouldDelete = window.confirm(
      `Delete "${resource.public_id}" from Cloudinary? This cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setError(null);
    setDeletingIds((currentIds) => new Set(currentIds).add(resource.public_id));

    try {
      const response = await fetch("/api/cloudinary/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId: resource.public_id }),
      });
      const payload = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload, "Failed to delete Cloudinary image"),
        );
      }

      setResources((currentResources) =>
        currentResources.filter(
          (currentResource) => currentResource.public_id !== resource.public_id,
        ),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete Cloudinary image",
      );
    } finally {
      setDeletingIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(resource.public_id);
        return nextIds;
      });
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
        {deletingCount > 0 && (
          <span>
            Deleting {deletingCount} image{deletingCount === 1 ? "" : "s"}...
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {isLoading && !hasImages ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/70"
            />
          ))}
        </div>
      ) : hasImages ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => {
            const isDeleting = deletingIds.has(resource.public_id);

            return (
              <article
                key={resource.public_id}
                className={`group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/70 transition-opacity ${
                  isDeleting ? "opacity-50" : "opacity-100"
                }`}
              >
                <a
                  href={resource.secure_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={createThumbnailUrl(resource.secure_url)}
                    alt={resource.public_id}
                    loading="lazy"
                    className="aspect-[4/3] w-full bg-zinc-900 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                </a>

                <div className="space-y-3 border-t border-zinc-800 p-4">
                  <div>
                    <h4 className="truncate text-sm font-medium text-white">
                      {resource.public_id}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDate(resource.created_at)} -{" "}
                      {formatBytes(resource.bytes)}
                      {resource.format
                        ? ` - ${formatResourceType(resource.format)}`
                        : ""}
                    </p>
                  </div>

                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {resource.tags.map((tag) => (
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
                    onClick={() => handleDelete(resource)}
                    disabled={isDeleting}
                    className="w-full rounded-lg border border-red-500/60 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? "Deleting..." : "Delete Image"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-8 text-center text-zinc-400">
          No Cloudinary images found.
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fetchImages(nextCursor)}
            disabled={isLoadingMore}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </section>
  );
};

export default CloudinaryManagementGrid;
