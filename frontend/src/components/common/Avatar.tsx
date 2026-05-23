import React, { useState } from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  url?: string | null;
  className?: string;
}

const avatarColors = [
  "bg-gradient-to-br from-blue-600 to-blue-800",
  "bg-gradient-to-br from-blue-500 to-blue-700",
  "bg-gradient-to-br from-teal-500 to-teal-700",
  "bg-gradient-to-br from-slate-500 to-slate-700",
  "bg-gradient-to-br from-emerald-500 to-emerald-700",
  "bg-gradient-to-br from-cyan-500 to-cyan-700"
];

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'sm', url, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  // Sizing definitions
  const sz = size === 'sm' 
    ? 'w-8 h-8' 
    : size === 'md' 
      ? 'w-10 h-10' 
      : size === 'lg' 
        ? 'w-16 h-16'
        : size === 'xl'
          ? 'w-24 h-24 sm:w-28 sm:h-28'
          : 'w-full h-full';

  // Symmetrical Squircle Rounding definitions (No plain circles!)
  const roundedClass = size === 'sm'
    ? 'rounded-lg'
    : size === 'md'
      ? 'rounded-xl'
      : size === 'lg'
        ? 'rounded-2xl'
        : size === 'xl'
          ? 'rounded-3xl'
          : 'rounded-none'; // 'full' size inherits parent's rounding/overflow completely!

  const borderClass = size === 'full' ? '' : 'border border-slate-100/50';

  const fontSz = size === 'sm' 
    ? 'text-xs' 
    : size === 'md' 
      ? 'text-sm' 
      : size === 'lg' 
        ? 'text-lg'
        : 'text-2xl';

  if (url && !hasError) {
    return (
      <img 
        src={url} 
        alt={name} 
        onError={() => setHasError(true)}
        className={`${sz} ${roundedClass} ${borderClass} object-cover flex-shrink-0 transition-transform duration-300 hover:scale-105 shadow-sm ${className}`}
      />
    );
  }

  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  
  const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const color = avatarColors[charCodeSum % avatarColors.length];

  return (
    <div className={`${sz} ${fontSz} ${color} ${roundedClass} flex items-center justify-center text-white font-bold flex-shrink-0 transition-transform duration-300 hover:scale-105 shadow-sm ${className}`}>
      {initials}
    </div>
  );
};

