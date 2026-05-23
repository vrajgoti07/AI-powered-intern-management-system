import React from 'react';

interface LogoProps {
  className?: string;
  iconClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-9 h-9", iconClassName = "w-5 h-5" }) => {
  const logoSrc = "/src/assets/logo.png";
  const [hasCustomLogo, setHasCustomLogo] = React.useState(false);

  React.useEffect(() => {
    const img = new Image();
    img.src = logoSrc;
    img.onload = () => setHasCustomLogo(true);
    img.onerror = () => setHasCustomLogo(false);
  }, []);

  if (hasCustomLogo) {
    return (
      <div className={`flex items-center justify-center overflow-hidden rounded-xl ${className}`}>
        <img src={logoSrc} alt="InternFlow Logo" className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50 transform hover:scale-105 transition-all duration-300 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`text-white animate-pulse ${iconClassName}`}
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          fill="currentColor"
          fillOpacity="0.9"
        />
        <path
          d="M2 17L12 22L22 17M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
