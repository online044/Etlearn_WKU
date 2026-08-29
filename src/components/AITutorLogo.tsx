/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AITutorLogoProps {
  className?: string;
  size?: number | string;
  showCardBackground?: boolean;
}

export default function AITutorLogo({ 
  className = '', 
  size = 40, 
  showCardBackground = false 
}: AITutorLogoProps) {
  return (
    <svg
      className={`select-none shrink-0 ${className}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Rich Metallic Steampunk Gold/Bronze Gradients */}
        <linearGradient id="bronzeHead" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBA73" />
          <stop offset="30%" stopColor="#AF8B44" />
          <stop offset="70%" stopColor="#805F21" />
          <stop offset="100%" stopColor="#D2AE68" />
        </linearGradient>

        <linearGradient id="metallicGray" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A3936" />
          <stop offset="50%" stopColor="#22211F" />
          <stop offset="100%" stopColor="#151413" />
        </linearGradient>

        <linearGradient id="tibebGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFECA7" />
          <stop offset="100%" stopColor="#C8962E" />
        </linearGradient>

        {/* Soft Shadow Filter for 3D depth */}
        <filter id="avatarShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
        </filter>

        {/* Subtle radial sheen */}
        <radialGradient id="greenEyeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="70%" stopColor="#15803D" />
          <stop offset="100%" stopColor="#022C22" />
        </radialGradient>
      </defs>

      {/* Styled card background matching main EthioLearn aesthetics */}
      {showCardBackground && (
        <rect
          x="4"
          y="4"
          width="192"
          height="192"
          rx="48"
          fill="#161616"
          stroke="url(#tibebGold)"
          strokeWidth="4"
        />
      )}

      {/* Main Avatar Drawing */}
      <g filter="url(#avatarShadow)" transform="translate(0, 4)">
        {/* ==========================================
            1. INNER SUIT & COLLAR (The classy academic jacket)
            ========================================== */}
        {/* Dark Blazer Silhouette */}
        <path
          d="M 40 145 C 40 125 55 110 80 110 L 120 110 C 145 110 160 125 160 145 L 165 185 L 35 185 Z"
          fill="url(#metallicGray)"
          stroke="#4D4B46"
          strokeWidth="1.5"
        />

        {/* Inner white shirt collar */}
        <path d="M 82 110 L 100 135 L 118 110" fill="#F4F4F5" />
        <path d="M 82 110 L 91 130 L 100 110 Z" fill="#E4E4E7" />
        <path d="M 118 110 L 109 130 L 100 110 Z" fill="#E4E4E7" />

        {/* ==========================================
            2. NESTLED NETELA SASH (Traditional woven white shawl draped diagonally)
            ========================================== */}
        {/* Base Drapery Layer (pure warm cotton texture white) */}
        <path
          d="M 38 152 C 55 130 95 118 135 118 C 152 118 160 128 160 145 L 158 185 L 75 185 C 50 185 36 170 38 152 Z"
          fill="#FAFAFA"
          stroke="#E4E4E7"
          strokeWidth="1"
        />

        {/* Dynamic diagonal drapes representing traditional fabric folds */}
        <path d="M 50 148 Q 90 128 138 128" stroke="#E4E4E7" strokeWidth="1.5" fill="none" opacity="0.8" />
        <path d="M 60 158 Q 100 138 145 138" stroke="#D4D4D8" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M 72 168 Q 110 148 152 148" stroke="#D4D4D8" strokeWidth="1.5" fill="none" opacity="0.6" />

        {/* ==========================================
            3. TIBEB PATTERN (Beautiful colorful border detail)
            ========================================== */}
        {/* Dynamic curved bands at the Netela edge */}
        <g opacity="0.95">
          {/* Green Band */}
          <path d="M 45 174 Q 95 154 154 154" stroke="#166534" strokeWidth="3" fill="none" />
          {/* Yellow/Gold Band */}
          <path d="M 44 177 Q 95 157 155 157" stroke="url(#tibebGold)" strokeWidth="3" fill="none" />
          {/* Crimson Red Band */}
          <path d="M 43 180 Q 95 160 156 160" stroke="#991B1B" strokeWidth="3" fill="none" />
          
          {/* Ge'ez style micro cross details stitched along the sash */}
          <path d="M 75 156 L 81 156 M 78 153 L 78 159" stroke="#991B1B" strokeWidth="1" />
          <path d="M 115 156 L 121 156 M 118 153 L 118 159" stroke="#166534" strokeWidth="1" />
        </g>

        {/* ==========================================
            4. BRASS / GOLD ROBOTIC HEAD & FACEPLATE
            ========================================== */}
        {/* Cyberneck support structure */}
        <rect x="90" y="86" width="20" height="25" rx="3" fill="#22211F" stroke="#805F21" strokeWidth="1.5" />
        <line x1="94" y1="92" x2="106" y2="92" stroke="url(#tibebGold)" strokeWidth="2" />
        <line x1="94" y1="99" x2="106" y2="99" stroke="url(#tibebGold)" strokeWidth="2" />

        {/* Main outer helmet structure */}
        <path
          d="M 64 54 C 64 34 80 18 100 18 C 120 18 136 34 136 54 C 136 78 126 94 100 94 C 74 94 64 78 64 54 Z"
          fill="url(#bronzeHead)"
          stroke="#4B3907"
          strokeWidth="2"
        />

        {/* Inner high-tech brow and division lines */}
        <path d="M 65 44 C 80 44 120 44 135 44" stroke="#4B3907" strokeWidth="1.5" fill="none" />
        <path d="M 80 19 L 88 44" stroke="#4B3907" strokeWidth="1.5" />
        <path d="M 120 19 L 112 44" stroke="#4B3907" strokeWidth="1.5" />
        
        {/* Forehead Glowing LED lens (Active processor status indicator) */}
        <rect x="91" y="26" width="18" height="4" rx="2" fill="#22C55E" />
        <rect x="95" y="27" width="10" height="2" rx="1" fill="#BBF7D0" />

        {/* Sleek Golden Faceplate Shield */}
        <path
          d="M 74 48 L 126 48 L 122 84 C 122 84 100 92 100 92 C 100 92 78 84 78 84 Z"
          fill="#1C1A14"
          stroke="url(#tibebGold)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* ==========================================
            5. DOUBLE LENS CYBERNETIC EYES (Glowing Green & Beautiful)
            ========================================== */}
        {/* Left Sensor/Lens Eye */}
        <circle cx="88" cy="62" r="10" fill="#2E2A1E" stroke="url(#tibebGold)" strokeWidth="2" />
        <circle cx="88" cy="62" r="7" fill="url(#greenEyeGlow)" />
        <circle cx="86" cy="60" r="2.5" fill="#FFFFFF" opacity="0.8" />
        <circle cx="91" cy="64" r="1.5" fill="#FFFFFF" opacity="0.5" />

        {/* Right Sensor/Lens Eye */}
        <circle cx="112" cy="62" r="10" fill="#2E2A1E" stroke="url(#tibebGold)" strokeWidth="2" />
        <circle cx="112" cy="62" r="7" fill="url(#greenEyeGlow)" />
        <circle cx="110" cy="60" r="2.5" fill="#FFFFFF" opacity="0.8" />
        <circle cx="115" cy="64" r="1.5" fill="#FFFFFF" opacity="0.5" />

        {/* Cheek ventilation and plate details */}
        <path d="M 78 76 L 85 82" stroke="url(#tibebGold)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 122 76 L 115 82" stroke="url(#tibebGold)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Small gold microphone/talk pattern grill on mouth plate */}
        <line x1="95" y1="80" x2="105" y2="80" stroke="url(#tibebGold)" strokeWidth="1.5" />
        <line x1="97" y1="83" x2="103" y2="83" stroke="url(#tibebGold)" strokeWidth="1" />

        {/* ==========================================
            6. EMBELLISHMENTS & BADGES
            ========================================== */}
        {/* Traditional golden cross badge styled on the lapel coat */}
        <path
          d="M 52 131 L 58 131 M 55 128 L 55 134"
          stroke="url(#tibebGold)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="55" cy="131" r="1.5" fill="#FFECA7" />
      </g>
    </svg>
  );
}
