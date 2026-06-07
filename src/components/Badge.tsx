import React from "react";
import "../styles/badge.css";

const RemoveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export interface BadgeProps {
  text: string;
  href?: string;
  onRemove?: () => void;
  disabled?: boolean;
  compact?: boolean;
  inline?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  text,
  href,
  onRemove,
  disabled = false,
  compact = false,
  inline = false,
  className = "",
  icon,
}) => {
  const classes = [
    "badge",
    onRemove ? "badge--removable" : "",
    compact ? "badge--compact" : "",
    inline ? "badge--inline" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = onRemove ? (
    <>
      <span className="badge-remove-overlay" aria-hidden="true">
        <RemoveIcon />
      </span>
      <div className="badge-text">{text}</div>
    </>
  ) : (
    <>
      {icon && <div className="badge-icon">{icon}</div>}
      <div className="badge-text">{text}</div>
    </>
  );

  if (onRemove) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${text} tag`}
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <a
        className={classes}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Learn more about ${text}`}
      >
        {content}
      </a>
    );
  }

  return <div className={classes}>{content}</div>;
};

export default Badge;
