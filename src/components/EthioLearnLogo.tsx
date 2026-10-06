import React, { useId } from 'react';

interface EthioLearnLogoProps {
  className?: string;
  size?: number | string;
  showCardBackground?: boolean;
  iconOnly?: boolean;
  onClick?: () => void;
  useImage?: boolean;
}

export default function EthioLearnLogo({ 
  className = '', 
  size = 40, 
  showCardBackground = false,
  iconOnly = true,
  onClick,
  useImage = false
}: EthioLearnLogoProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = rawId || 'ethio';
  
  const hasDimensionClass = className.includes('w-') || className.includes('h-');
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  const bgGradId = `logoBg_${uid}`;
  const goldGradId = `logoGold_${uid}`;
  const emeraldGradId = `logoEmerald_${uid}`;
  const glowFilterId = `logoGlow_${uid}`;

  return (
    <div 
      onClick={onClick}
      className={`relative select-none shrink-0 inline-flex items-center justify-center transition-all duration-300 ${
        showCardBackground 
          ? 'bg-gradient-to-b from-[#1E293B] to-[#0A1128] rounded-xl border border-amber-500/50 shadow-md shadow-amber-500/10 p-0.5' 
          : 'bg-transparent'
      } ${className}`}
      style={hasDimensionClass ? undefined : { 
        width: iconOnly ? pixelSize : 'auto', 
        height: pixelSize,
        minWidth: iconOnly ? pixelSize : undefined,
        minHeight: pixelSize
      }}
    >
      <div className="flex items-center gap-2 h-full w-full justify-center">
        {/* Render Vector SVG Emblem by default (Crisp, Retina-ready, 0ms latency, zero JPEG artifacts) */}
        {useImage ? (
          <img 
            src="/favicon.svg" 
            alt="EthioLearn Pro" 
            className="w-full h-full object-contain rounded-lg shadow-sm border border-amber-500/30 shrink-0 block" 
          />
        ) : (
          <svg 
            width="100%"
            height="100%"
            viewBox="0 0 128 128" 
            className="w-full h-full object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)]"
            style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0A1128" />
              </linearGradient>
              <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="45%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id={emeraldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Crest Shield Rounded Canvas - Solid color fallback with gold border */}
            <rect 
              x="2" 
              y="2" 
              width="124" 
              height="124" 
              rx="26" 
              fill="#0A1128" 
              stroke="#F59E0B" 
              strokeWidth="3" 
            />
            <rect 
              x="2" 
              y="2" 
              width="124" 
              height="124" 
              rx="26" 
              fill={`url(#${bgGradId})`} 
              stroke="none" 
            />

            {/* Inner Golden Filament */}
            <rect 
              x="8" 
              y="8" 
              width="112" 
              height="112" 
              rx="22" 
              fill="none" 
              stroke="#FDE047" 
              strokeWidth="1.2" 
              strokeOpacity="0.5" 
            />

            {/* Academic Graduation Cap (Top) */}
            <g transform="translate(0, -2)">
              {/* Cap Diamond */}
              <polygon 
                points="64,22 102,38 64,54 26,38" 
                fill="#F59E0B" 
              />
              <polygon 
                points="64,22 102,38 64,54 26,38" 
                fill={`url(#${goldGradId})`} 
                filter={`url(#${glowFilterId})`} 
              />
              <polygon 
                points="64,26 96,38 64,50 32,38" 
                fill="#0A1128" 
                opacity="0.35" 
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
                fill="#059669" 
              />
              <path 
                d="M 64,96 C 50,88 32,86 18,92 C 18,72 34,68 64,74 Z" 
                fill={`url(#${emeraldGradId})`} 
                opacity="0.95" 
              />
              <path 
                d="M 64,96 C 78,88 96,86 110,92 C 110,72 94,68 64,74 Z" 
                fill="#059669" 
              />
              <path 
                d="M 64,96 C 78,88 96,86 110,92 C 110,72 94,68 64,74 Z" 
                fill={`url(#${emeraldGradId})`} 
                opacity="0.95" 
              />

              {/* Main Gold Open Book Pages */}
              <path 
                d="M 64,92 C 50,84 34,82 22,87 C 22,69 36,65 64,71 Z" 
                fill="#D97706" 
              />
              <path 
                d="M 64,92 C 50,84 34,82 22,87 C 22,69 36,65 64,71 Z" 
                fill={`url(#${goldGradId})`} 
              />
              <path 
                d="M 64,92 C 78,84 94,82 106,87 C 106,69 92,65 64,71 Z" 
                fill="#D97706" 
              />
              <path 
                d="M 64,92 C 78,84 94,82 106,87 C 106,69 92,65 64,71 Z" 
                fill={`url(#${goldGradId})`} 
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
        )}

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
