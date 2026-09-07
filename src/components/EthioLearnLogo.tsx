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
      className={`relative select-none shrink-0 flex items-center justify-center transition-all duration-300 ${
        showCardBackground 
          ? 'bg-slate-900/90 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/10 p-2' 
          : 'bg-transparent'
      } ${className}`}
      style={{ width: iconOnly ? pixelSize : 'auto', height: pixelSize }}
    >
      <div className="flex items-center gap-2.5 h-full">
        {/* Customized Scholarly Emblem */}
        <svg 
          viewBox="0 0 128 128" 
          className="h-full aspect-square"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0A1128" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="logoEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Crest Shield Rounded Canvas */}
          <rect 
            x="4" 
            y="4" 
            width="120" 
            height="120" 
            rx="28" 
            fill="url(#logoBgGrad)" 
            stroke="#F59E0B" 
            strokeWidth="2.5" 
            strokeOpacity="0.5" 
          />

          {/* Inner Golden Filament */}
          <rect 
            x="10" 
            y="10" 
            width="108" 
            height="108" 
            rx="22" 
            fill="none" 
            stroke="#FDE047" 
            strokeWidth="1" 
            strokeOpacity="0.2" 
          />

          {/* Academic Graduation Cap (Top) */}
          <g transform="translate(0, -2)">
            {/* Cap Diamond */}
            <polygon 
              points="64,22 102,38 64,54 26,38" 
              fill="url(#logoGoldGrad)" 
              filter="url(#logoGlow)" 
            />
            <polygon 
              points="64,26 96,38 64,50 32,38" 
              fill="#0A1128" 
              opacity="0.3" 
            />

            {/* Cap Skull Base */}
            <path 
              d="M 44,46 L 44,55 C 44,64 84,64 84,55 L 84,46 Z" 
              fill="#D97706" 
            />

            {/* Tassel */}
            <path 
              d="M 64,38 L 36,44 L 34,58" 
              stroke="#FDE047" 
              strokeWidth="2.4" 
              strokeLinecap="round" 
              fill="none" 
            />
            <circle cx="34" cy="59" r="2.8" fill="#FDE047" />
          </g>

          {/* Open Book of Knowledge (Center-Bottom) */}
          <g transform="translate(0, 4)">
            {/* Emerald Base Leaf (Ethiopian flag green) */}
            <path 
              d="M 64,96 C 50,88 32,86 18,92 C 18,72 34,68 64,74 Z" 
              fill="url(#logoEmeraldGrad)" 
              opacity="0.85" 
            />
            <path 
              d="M 64,96 C 78,88 96,86 110,92 C 110,72 94,68 64,74 Z" 
              fill="url(#logoEmeraldGrad)" 
              opacity="0.85" 
            />

            {/* Main Gold Open Book Pages */}
            <path 
              d="M 64,92 C 50,84 34,82 22,87 C 22,69 36,65 64,71 Z" 
              fill="url(#logoGoldGrad)" 
            />
            <path 
              d="M 64,92 C 78,84 94,82 106,87 C 106,69 92,65 64,71 Z" 
              fill="url(#logoGoldGrad)" 
            />

            {/* Book Spine */}
            <line 
              x1="64" 
              y1="71" 
              x2="64" 
              y2="98" 
              stroke="#78350F" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
            />

            {/* Radiant Ethiopian Ge'ez Star of Wisdom in Center */}
            <polygon 
              points="64,61 66,66 71,67 67,71 68,76 64,73 60,76 61,71 57,67 62,66" 
              fill="#FFFBEB" 
              stroke="#D97706" 
              strokeWidth="0.8" 
            />
          </g>
        </svg>

        {/* Wordmark when not iconOnly */}
        {!iconOnly && (
          <div className="flex flex-col justify-center leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-base tracking-tight font-serif">
                ETHIOLEARN
              </span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PRO
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
              Learn &bull; Prepare &bull; Succeed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
