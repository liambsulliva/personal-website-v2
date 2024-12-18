interface FlickrTagProps {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

export default function FlickrTag({
  label,
  isSelected,
  onSelect,
}: FlickrTagProps) {
  return (
    <button
      onClick={onSelect}
      aria-label={`Tag ${label}`}
      className={`relative flex w-fit flex-row gap-2 rounded-[15px] border border-[#353535] ${
        isSelected ? "bg-[#f0f0f0]" : "bg-[#181818]"
      } px-4 py-2 transition-all duration-100 ${isSelected ? "hover:bg-[#e0e0e0]" : "hover:bg-[#252525]"} active:scale-95`}
    >
      <p
        className={`${
          isSelected ? "text-black" : "text-white"
        } text-nowrap transition-all duration-100 group-hover:translate-x-[-15px]`}
      >
        {label
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}
      </p>
    </button>
  );
}
