export interface ToggleTrackOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleTrackProps<T extends string> {
  "aria-label": string;
  options: readonly ToggleTrackOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const ToggleTrack = <T extends string>({
  "aria-label": ariaLabel,
  options,
  value,
  onChange,
}: ToggleTrackProps<T>) => {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="relative inline-grid rounded-full border border-zinc-700 bg-zinc-950/70 px-2 py-1.5 shadow-inner shadow-black/30"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1.5 left-2 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out"
        style={{
          width: `calc((100% - 1rem) / ${options.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
      />

      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex w-full min-w-28 items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selected
                ? "text-zinc-950"
                : "text-zinc-300 hover:text-white focus:text-white"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default ToggleTrack;
