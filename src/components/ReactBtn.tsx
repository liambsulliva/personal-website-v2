import React from "react";

interface ButtonProps {
  href: string;
  label: string;
}

const ReactBtn: React.FC<ButtonProps> = ({ href, label }) => {
  return (
    <a
      href={href}
      className="button mt-4 flex w-32 flex-row items-center justify-center rounded-full bg-[#282935] px-4 py-3 shadow-md transition-all duration-200 hover:scale-105 active:scale-100"
      target="_blank"
    >
      <p className="text-fill whitespace-nowrap">{label}</p>
    </a>
  );
};

export default ReactBtn;
