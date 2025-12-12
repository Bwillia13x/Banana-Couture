
import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", ...props }) => {
  // Static ID for gradient to ensure consistency across renders/SSG
  const gradientId = "banana-couture-gradient";

  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="20" y1="80" x2="80" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5B44C" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>

      {/* Main Body - Sleek Silhouette */}
      <path 
        fillRule="evenodd"
        clipRule="evenodd"
        d="M72 22C78.5 22 83 26.5 81 35C74.5 60 45 80 22 80C17.5 80 15 75.5 17 71C26 54 52 31 67 23.5C68.5 22.8 70.2 22 72 22Z" 
        fill={`url(#${gradientId})`}
      />
      
      {/* The Stem - Distinctive Minimalist Accent */}
      <path 
        d="M72 22C74 22 76 20 74 18C70 14 62 16 58 20" 
        stroke="#201213" 
        strokeWidth="3.5" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom Tip Accent - Subtle Detail */}
      <path 
        d="M22 80C20 81 16 82 14 78" 
        stroke="#201213" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Specular Highlight for Polished Look */}
      <path 
        d="M68 28C56 35 36 54 28 68" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.3"
      />
    </svg>
  );
};
