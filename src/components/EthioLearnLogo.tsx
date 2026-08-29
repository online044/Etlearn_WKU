import React from 'react';

interface EthioLearnLogoProps {
  className?: string;
  size?: number | string;
  showCardBackground?: boolean;
  iconOnly?: boolean;
}

export default function EthioLearnLogo({ 
  className = '', 
  size = 40, 
  showCardBackground = false,
  iconOnly = true 
}: EthioLearnLogoProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  
  return (
    <div 
      className={`relative select-none shrink-0 flex flex-col items-center justify-center transition-all duration-300 ${
        showCardBackground 
          ? 'bg-white rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-md p-1.5' 
          : 'bg-transparent'
      } ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <svg 
        viewBox={iconOnly ? "75 20 350 350" : "0 0 500 500"} 
        className="w-full h-full"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main blue gradient for the F shape and pages */}
          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a4c9e" />
            <stop offset="100%" stopColor="#00a2e8" />
          </linearGradient>
          
          {/* Darker blue gradient for the cap and shadows */}
          <linearGradient id="darkBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#082c59" />
            <stop offset="100%" stopColor="#0d4187" />
          </linearGradient>

          {/* Teal gradient for the play button */}
          <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00a896" />
            <stop offset="100%" stopColor="#02c39a" />
          </linearGradient>

          {/* Emerald/greenish gradient for the bottom-most book wing */}
          <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#007f5f" />
            <stop offset="100%" stopColor="#028090" />
          </linearGradient>
        </defs>

        {/* 1. GRADUATION CAP (Navy & Deep Blue) */}
        {/* Cap Diamond */}
        <path 
          d="M 250 50 L 375 105 L 250 160 L 125 105 Z" 
          fill="url(#darkBlueGrad)" 
          stroke="#062247" 
          strokeWidth="2"
        />
        {/* Cap Underneath Shadow/Skull */}
        <path 
          d="M 185 125 L 185 145 C 185 180, 315 180, 315 145 L 315 125 C 280 142, 220 142, 185 125 Z" 
          fill="#062247"
        />
        {/* Tassel (Left Side) */}
        {/* Tassel String */}
        <path 
          d="M 148 115 L 148 140" 
          stroke="#041630" 
          strokeWidth="3.5" 
          strokeLinecap="round"
        />
        {/* Tassel Bead */}
        <circle cx="148" cy="142" r="5" fill="#C8962E" />
        {/* Tassel Hanging Fringe */}
        <path 
          d="M 142 147 L 154 147 L 151 185 L 145 185 Z" 
          fill="#041630"
        />

        {/* 2. THE STYLIZED "E" BODY */}
        <path 
          d="M 200 160 C 230 152, 280 148, 315 152 C 325 153, 330 160, 325 168 C 315 180, 290 195, 245 195 C 242 195, 240 198, 240 201 L 240 215 C 255 215, 275 215, 290 215 C 298 215, 302 220, 298 227 C 292 237, 275 245, 240 245 C 237 245, 235 248, 235 251 L 235 265 C 250 265, 275 265, 295 265 C 303 265, 308 270, 304 277 C 298 287, 275 295, 235 295 C 232 295, 230 298, 230 301 L 230 310 C 210 290, 212 250, 212 210 C 212 180, 190 165, 200 160 Z" 
          fill="url(#blueGrad)"
        />

        {/* 3. TEAL PLAY BUTTON TRIANGLE */}
        <path 
          d="M 252 240 L 252 278 L 285 259 Z" 
          fill="url(#tealGrad)"
        />

        {/* 4. OPEN BOOK PAGES (Symmetrical left & right wings) */}
        {/* Left Page Wing (Layer 3 - Bottom Cover - Green/Teal) */}
        <path 
          d="M 250 310 C 200 295, 140 290, 100 325 C 150 345, 210 330, 250 310 Z" 
          fill="url(#greenGrad)"
        />
        {/* Right Page Wing (Layer 3 - Bottom Cover - Green/Teal) */}
        <path 
          d="M 250 310 C 300 295, 360 290, 400 325 C 350 345, 290 330, 250 310 Z" 
          fill="url(#greenGrad)"
        />

        {/* Left Page Wing (Layer 2 - Middle - Bright Blue) */}
        <path 
          d="M 250 310 C 205 285, 150 280, 115 312 C 160 328, 215 318, 250 310 Z" 
          fill="#00a2e8"
        />
        {/* Right Page Wing (Layer 2 - Middle - Bright Blue) */}
        <path 
          d="M 250 310 C 295 285, 350 280, 385 312 C 340 328, 285 318, 250 310 Z" 
          fill="#00a2e8"
        />

        {/* Left Page Wing (Layer 1 - Top - Deep Blue) */}
        <path 
          d="M 250 310 C 210 275, 160 270, 130 298 C 170 312, 220 305, 250 310 Z" 
          fill="#0a4c9e"
        />
        {/* Right Page Wing (Layer 1 - Top - Deep Blue) */}
        <path 
          d="M 250 310 C 290 275, 340 270, 370 298 C 330 312, 280 305, 250 310 Z" 
          fill="#0a4c9e"
        />

        {/* Center Spine Line of the book */}
        <path 
          d="M 250 310 L 250 340" 
          stroke="#007f5f" 
          strokeWidth="3.5" 
          strokeLinecap="round"
        />

        {/* 5. TEXT LABELS (Optionally shown below the emblem logo) */}
        {!iconOnly && (
          <g>
            {/* ET LEARN Text */}
            <text 
              x="250" 
              y="405" 
              textAnchor="middle" 
              fill="#0a4c9e" 
              fontSize="48" 
              fontWeight="900" 
              letterSpacing="3" 
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              ET LEARN
            </text>

            {/* Separator lines and Dot */}
            {/* Left Line */}
            <line x1="100" y1="432" x2="200" y2="432" stroke="#007f5f" strokeWidth="2.5" />
            {/* Dot */}
            <circle cx="250" cy="432" r="4" fill="#00a896" />
            {/* Right Line */}
            <line x1="300" y1="432" x2="400" y2="432" stroke="#007f5f" strokeWidth="2.5" />

            {/* Tagline LEARN • GROW • ACHIEVE */}
            <text 
              x="250" 
              y="460" 
              textAnchor="middle" 
              fill="#2c3e50" 
              fontSize="16" 
              fontWeight="800" 
              letterSpacing="4" 
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              LEARN • GROW • ACHIEVE
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
