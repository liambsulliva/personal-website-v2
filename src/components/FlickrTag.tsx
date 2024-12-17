import { useEffect, useState } from "react";

interface LoaderProps {
  label: string;
}

export default function FlickrTag({ label }: LoaderProps) {
  const [isClicked, setIsClicked] = useState<boolean>(false);

  function handleClick() {
    setIsClicked((clicked) => !clicked);
  }

  return (
    <button
      onClick={handleClick}
      className={`relative flex w-fit flex-row gap-2 rounded-[25px] border border-[#353535] ${
        isClicked ? "bg-[#fff]" : "bg-[#181818]"
      } px-8 py-3 transition-all duration-300 ${isClicked ? "hover:bg-[#e0e0e0]" : "hover:bg-[#252525]"} active:scale-95`}
    >
      <p
        className={`${
          isClicked ? "text-black" : "text-white"
        } transition-all duration-300 group-hover:translate-x-[-15px]`}
      >
        {label}
      </p>
    </button>
  );
}
