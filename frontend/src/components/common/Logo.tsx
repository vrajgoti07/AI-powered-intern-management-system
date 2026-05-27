import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizeMap = {
    sm: { icon: 32, text: 'text-lg', tagline: 'text-[8px]' },
    md: { icon: 40, text: 'text-xl', tagline: 'text-[9px]' },
    lg: { icon: 48, text: 'text-2xl', tagline: 'text-[10px]' },
  };

  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon with dark background block for guaranteed contrast */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Deep Dark Navy Background */}
        <rect width="64" height="64" rx="14" fill="#0f172a" />
        
        {/* Human figure silhouette (left) */}
        <circle cx="21" cy="24" r="7" fill="#ffffff" />
        <path d="M10,48 Q21,32 32,48" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

        {/* AI orbit ring system (right, centered at 45,32) */}
        <circle cx="45" cy="32" r="11" fill="none" stroke="#3b82f6" strokeWidth="2" />
        <circle cx="45" cy="32" r="6" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
        <circle cx="45" cy="32" r="2.5" fill="#ffffff" />

        {/* Orbit node dots */}
        <circle cx="45" cy="21" r="2.5" fill="#ffffff" />
        <circle cx="56" cy="32" r="2.5" fill="#ffffff" />
        <circle cx="45" cy="43" r="2.5" fill="#ffffff" />
        <circle cx="34" cy="32" r="2.5" fill="#ffffff" />
      </svg>

      {/* Wordmark + Tagline */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${s.text} font-extrabold tracking-tight`}>
            <span className="text-current">Intern</span>
            <span className="text-blue-500">Flow</span>
          </span>
          <span
            className={`${s.tagline} font-medium tracking-[0.12em] uppercase text-slate-500`}
          >
            AI Intern Management
          </span>
        </div>
      )}
    </div>
  );
};
