import React from 'react';

interface LogoProps {
  className?: string;
  iconClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-9 h-9", iconClassName = "w-5 h-5" }) => {
  return (
    <div className={`bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform hover:scale-105 transition-all duration-300 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`text-white ${iconClassName}`}
      >
        {/* Lightning bolt — matches the favicon */}
        <path
          d="M7 2h6l-2 8h6L7 22l2-8H5L7 2z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
