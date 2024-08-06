import React from 'react';

interface ButtonProps {
    href: string;
    label: string;
}

const ReactBtn: React.FC<ButtonProps> = ({ href, label }) => {
    return (
        <a href={href} className="button flex flex-row items-center justify-center w-32 mt-4 py-3 px-4 bg-[#282935] rounded-full transition-all duration-200 shadow-md hover:scale-105 active:scale-100" target="_blank">
            <p className="text-fill whitespace-nowrap">{label}</p>
        </a>
    );
};

export default ReactBtn;
