import React, { useEffect, useRef, useState } from "react";
import Badge from "./Badge";
import "../styles/badge.css";

const normalizeTag = (value: string) => value.trim().toLowerCase();

const parseTags = (value: string) =>
  value
    .split(",")
    .map(normalizeTag)
    .filter(Boolean);

interface TagRowProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  disabled?: boolean;
  inputPlaceholder?: string;
}

const TagRow: React.FC<TagRowProps> = ({
  tags,
  onAdd,
  onRemove,
  disabled = false,
  inputPlaceholder = "Add tag",
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const commitTags = () => {
    const nextTags = parseTags(input).filter((tag) => !tags.includes(tag));

    nextTags.forEach((tag) => onAdd(tag));
    setInput("");
    setIsAdding(false);
  };

  const cancelAdding = () => {
    setInput("");
    setIsAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Badge
          key={tag}
          text={tag}
          compact
          inline
          onRemove={() => onRemove(tag)}
          disabled={disabled}
        />
      ))}

      {isAdding ? (
        <input
          ref={inputRef}
          type="text"
          value={input}
          disabled={disabled}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitTags();
            }

            if (event.key === "Escape") {
              event.preventDefault();
              cancelAdding();
            }
          }}
          onBlur={commitTags}
          placeholder={inputPlaceholder}
          className="badge-add-input"
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          disabled={disabled}
          aria-label="Add tag"
          className="badge-add-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TagRow;
