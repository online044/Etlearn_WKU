/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Definitions for the 5 custom cultural and academic preset SVGs
export const AVATAR_PRESETS = [
  { id: 'lion', name: 'Abyssinian Lion', color: '#C8962E' },
  { id: 'obelisk', name: 'Axum Obelisk', color: '#1B6F42' },
  { id: 'scholar', name: 'Grade Scholar', color: '#A81C2E' },
  { id: 'jebena', name: 'Late study Brewer (Jebena)', color: '#AA7C11' },
  { id: 'star', name: 'Gold Star', color: '#D4AF37' }
];

interface StudentAvatarProps {
  avatar?: string;
  name: string;
  size?: number;
  className?: string;
}

export default function StudentAvatar({ avatar, name, size = 48, className = '' }: StudentAvatarProps) {
  const sizeClass = `w-[${size}px] h-[${size}px]`;
  
  // Clean default fallback letter initial
  const initial = name ? name.substring(0, 1).toUpperCase() : 'ኤ';

  // Render SVG Presets dynamically
  const renderPreset = (presetId: string) => {
    switch (presetId) {
      case 'lion':
        return (
          <svg className="w-full h-full p-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="42" ry="42" fill="#1C1A14" stroke="#C8962E" strokeWidth="2" />
            {/* Styled Gold Lion head details */}
            <path d="M 50 25 C 44 25 38 29 36 34 C 33 33 30 35 30 39 C 30 45 40 45 40 48" stroke="#C8962E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 50 25 C 56 25 62 29 64 34 C 67 33 70 35 70 39 C 70 45 60 45 60 48" stroke="#C8962E" strokeWidth="2.5" strokeLinecap="round" />
            {/* Mane */}
            <path d="M 33 46 C 26 53 28 65 36 71 C 42 75 50 78 50 78" stroke="#C8962E" strokeWidth="2" fill="none" />
            <path d="M 67 46 C 74 53 72 65 64 71 C 58 75 50 78 50 78" stroke="#C8962E" strokeWidth="2" fill="none" />
            {/* Crown/Crown of Hair */}
            <path d="M 43 25 Q 50 15 57 25" stroke="#FFECA7" strokeWidth="2" fill="none" />
            {/* Snout and eyes */}
            <path d="M 45 49 L 50 54 L 55 49 Z" fill="#D4AF37" />
            <path d="M 50 54 L 50 64" stroke="#D4AF37" strokeWidth="2" />
            <circle cx="43" cy="45" r="2.5" fill="#FFECA7" />
            <circle cx="57" cy="45" r="2.5" fill="#FFECA7" />
            {/* Golden details */}
            <path d="M 41 64 Q 50 60 59 64" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'obelisk':
        return (
          <svg className="w-full h-full p-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="42" ry="42" fill="#0A1810" stroke="#1B6F42" strokeWidth="2" />
            {/* Column base & summit star */}
            <path d="M 46 38 L 54 38 L 57 78 L 43 78 Z" fill="#1B6F42" stroke="#4ADE80" strokeWidth="1.5" />
            <polygon points="50,18 53,25 60,25 55,29 57,36 50,32 43,36 45,29 40,25 47,25" fill="#FFECA7" />
            {/* Carvings */}
            <line x1="46" y1="46" x2="54" y2="46" stroke="#052E16" strokeWidth="1.5" />
            <line x1="45" y1="56" x2="55" y2="56" stroke="#052E16" strokeWidth="1.5" />
            <line x1="44" y1="66" x2="56" y2="66" stroke="#052E16" strokeWidth="1.5" />
            {/* Dome windows */}
            <rect x="48" y="49" width="4" height="4" rx="0.5" fill="#0D0D0D" />
            <rect x="48" y="59" width="4" height="4" rx="0.5" fill="#0D0D0D" />
          </svg>
        );
      case 'scholar':
        return (
          <svg className="w-full h-full p-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="42" ry="42" fill="#1A0D10" stroke="#A81C2E" strokeWidth="2" />
            {/* Graduation Cap cap cap */}
            <path d="M 50 25 L 78 37 L 50 49 L 22 37 Z" fill="#A81C2E" stroke="#FFECA7" strokeWidth="1.5" />
            {/* Cap bottom base */}
            <path d="M 34 46 L 34 56 C 34 62 50 68 50 68 C 50 68 66 62 66 56 L 66 46" fill="url(#crimsonGrad)" stroke="#FFECA7" strokeWidth="1.5" />
            {/* Tassel */}
            <path d="M 50 37 Q 70 37 72 48" stroke="#D4AF37" strokeWidth="2" fill="none" />
            <circle cx="72" cy="50" r="3" fill="#D4AF37" />
          </svg>
        );
      case 'jebena':
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="42" ry="42" fill="#1C140D" stroke="#AA7C11" strokeWidth="2" />
            {/* Jebena pot */}
            <path d="M 50 48 C 34 48 34 76 50 76 C 66 76 66 48 50 48 Z" fill="#583204" stroke="#D4AF37" strokeWidth="1.5" />
            {/* Neck of the jebena pot */}
            <path d="M 46 28 L 54 28 L 54 48 L 46 48 Z" fill="#583204" stroke="#D4AF37" strokeWidth="1.5" strokeLinejoin="round" />
            {/* Pot handle */}
            <path d="M 46 34 C 36 34 32 46 36 56 C 37 57 41 57 41 56" stroke="#D4AF37" strokeWidth="2" fill="none" />
            {/* Pot spout */}
            <path d="M 54 52 C 64 52 68 44 68 38 L 65 38" stroke="#D4AF37" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Traditional steam/aroma vector lines */}
            <path d="M 45 22 Q 47 16 46 12" stroke="#AA7C11" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 51 21 Q 49 14 52 11" stroke="#AA7C11" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'star':
        return (
          <svg className="w-full h-full p-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="42" ry="42" fill="#1C1808" stroke="#FFECA7" strokeWidth="2" />
            <polygon
              points="50,22 55,36 71,36 58,45 62,60 50,51 38,60 42,45 29,36 45,36"
              fill="#D4AF37"
              stroke="#FFECA7"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Facets / Sparkles */}
            <polygon points="50,22 50,51 55,36" fill="#FFECA7" opacity="0.6" />
            <circle cx="28" cy="24" r="2.5" fill="#FFECA7" />
            <circle cx="74" cy="74" r="2" fill="#FFECA7" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Render container
  return (
    <div 
      className={`relative rounded-full select-none flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200 border bg-[#111111] shadow ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {avatar ? (
        avatar.startsWith('data:image/') ? (
          <img 
            src={avatar} 
            alt={name} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          renderPreset(avatar) || (
            <div className="font-serif font-black text-sm text-[#C8962E]">
              {initial}
            </div>
          )
        )
      ) : (
        <div className="font-serif font-black text-[#C8962E] flex items-center justify-center" style={{ fontSize: size * 0.45 }}>
          {initial}
        </div>
      )}
    </div>
  );
}
