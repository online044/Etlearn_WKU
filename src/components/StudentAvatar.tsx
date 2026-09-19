import React from 'react';

// Definitions for the custom cultural, academic, and scientific preset SVGs
export const AVATAR_PRESETS = [
  { id: 'crest', name: 'EthioLearn Crest (የጥበብ አርማ)', color: '#F59E0B' },
  { id: 'star', name: 'Gold Star (ብሩህ ኮከብ)', color: '#F59E0B' },
  { id: 'scholar', name: 'University Scholar (ምሁር)', color: '#10B981' },
  { id: 'lion', name: 'Abyssinian Lion (አንበሳ)', color: '#D97706' },
  { id: 'book', name: 'Book of Wisdom (መጽሐፍ)', color: '#38BDF8' },
  { id: 'obelisk', name: 'Axum Obelisk (የአክሱም ሐውልት)', color: '#059669' },
  { id: 'mortarboard', name: 'Graduation Cap (የምረቃ ቆብ)', color: '#A855F7' },
  { id: 'jebena', name: 'Study Jebena (ጀበና)', color: '#B45309' },
  { id: 'stem', name: 'STEM / Tech (ቴክኖሎጂ)', color: '#06B6D4' },
  { id: 'justice', name: 'Justice & Law (ፍትሕ)', color: '#EC4899' }
];

interface StudentAvatarProps {
  avatar?: string;
  name: string;
  size?: number;
  className?: string;
}

export default function StudentAvatar({ avatar, name, size = 48, className = '' }: StudentAvatarProps) {
  // Clean default fallback letter initial
  const initial = name ? name.substring(0, 1).toUpperCase() : 'ኤ';

  // Render SVG Presets dynamically
  const renderPreset = (presetId: string) => {
    switch (presetId) {
      case 'crest':
        return (
          <svg className="w-full h-full p-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="44" ry="44" fill="#0A1128" stroke="#F59E0B" strokeWidth="2.5" />
            <polygon points="50,18 80,31 50,44 20,31" fill="#F59E0B" />
            <path d="M 34,38 L 34,46 C 34,54 66,54 66,46 L 66,38" fill="#D97706" />
            <path d="M 50,78 C 38,72 26,70 18,74 C 18,58 30,55 50,60 Z" fill="#10B981" />
            <path d="M 50,78 C 62,72 74,70 82,74 C 82,58 70,55 50,60 Z" fill="#10B981" />
            <path d="M 50,74 C 38,68 28,66 22,70 C 22,56 34,53 50,58 Z" fill="#FBBF24" />
            <path d="M 50,74 C 62,68 72,66 78,70 C 78,56 66,53 50,58 Z" fill="#FBBF24" />
            <circle cx="50" cy="50" r="3.5" fill="#FFFBEB" stroke="#D97706" strokeWidth="1" />
          </svg>
        );
      case 'star':
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="44" ry="44" fill="#181308" stroke="#F59E0B" strokeWidth="2" />
            <polygon
              points="50,16 58,34 78,34 62,46 68,66 50,54 32,66 38,46 22,34 42,34"
              fill="#F59E0B"
              stroke="#FDE68A"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <polygon points="50,16 50,54 58,34" fill="#FDE68A" opacity="0.6" />
            <circle cx="28" cy="22" r="2.5" fill="#FDE68A" />
            <circle cx="74" cy="74" r="2" fill="#FDE68A" />
          </svg>
        );
      case 'scholar':
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="44" ry="44" fill="#061D16" stroke="#10B981" strokeWidth="2" />
            <path d="M 50 20 L 82 34 L 50 48 L 18 34 Z" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.5" />
            <path d="M 32 44 L 32 56 C 32 63 50 69 50 69 C 50 69 68 63 68 56 L 68 44" fill="#047857" stroke="#A7F3D0" strokeWidth="1.5" />
            <path d="M 50 34 Q 72 34 74 46" stroke="#F59E0B" strokeWidth="2" fill="none" />
            <circle cx="74" cy="48" r="3" fill="#F59E0B" />
          </svg>
        );
      case 'lion':
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="44" ry="44" fill="#1C150A" stroke="#D97706" strokeWidth="2" />
            <path d="M 50 25 C 44 25 38 29 36 34 C 33 33 30 35 30 39 C 30 45 40 45 40 48" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 50 25 C 56 25 62 29 64 34 C 67 33 70 35 70 39 C 70 45 60 45 60 48" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 33 46 C 26 53 28 65 36 71 C 42 75 50 78 50 78" stroke="#D97706" strokeWidth="2" fill="none" />
            <path d="M 67 46 C 74 53 72 65 64 71 C 58 75 50 78 50 78" stroke="#D97706" strokeWidth="2" fill="none" />
            <path d="M 43 25 Q 50 15 57 25" stroke="#FDE68A" strokeWidth="2" fill="none" />
            <path d="M 45 49 L 50 54 L 55 49 Z" fill="#F59E0B" />
            <path d="M 50 54 L 50 64" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="43" cy="45" r="2.5" fill="#FDE68A" />
            <circle cx="57" cy="45" r="2.5" fill="#FDE68A" />
            <path d="M 41 64 Q 50 60 59 64" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'book':
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="44" ry="44" fill="#0A192F" stroke="#38BDF8" strokeWidth="2" />
            <path d="M 50 68 C 36 62 24 60 16 64 C 16 46 28 43 50 48 Z" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1.5" />
            <path d="M 50 68 C 64 62 76 60 84 64 C 84 46 72 43 50 48 Z" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1.5" />
            <line x1="50" y1="48" x2="50" y2="70" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 26 53 L 42 50" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 26 58 L 40 55" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 58 50 L 74 53" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 60 55 L 74 58" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'obelisk':
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="44" ry="44" fill="#061D12" stroke="#059669" strokeWidth="2" />
            <path d="M 46 36 L 54 36 L 58 78 L 42 78 Z" fill="#059669" stroke="#34D399" strokeWidth="1.5" />
            <polygon points="50,16 53,24 60,24 55,28 57,35 50,31 43,35 45,28 40,24 47,24" fill="#FDE68A" />
            <line x1="46" y1="44" x2="54" y2="44" stroke="#064E3B" strokeWidth="1.5" />
            <line x1="45" y1="54" x2="55" y2="54" stroke="#064E3B" strokeWidth="1.5" />
            <line x1="44" y1="64" x2="56" y2="64" stroke="#064E3B" strokeWidth="1.5" />
          </svg>
        );
      case 'mortarboard':
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="44" ry="44" fill="#1C102A" stroke="#A855F7" strokeWidth="2" />
            <polygon points="50,24 82,38 50,52 18,38" fill="#7E22CE" stroke="#E9D5FF" strokeWidth="1.5" />
            <path d="M 32,46 L 32,58 C 32,65 50,71 50,71 C 50,71 68,65 68,58 L 68,46" fill="#581C87" stroke="#E9D5FF" strokeWidth="1.5" />
            <path d="M 50,38 L 74,44 L 72,56" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="72" cy="58" r="2.8" fill="#F59E0B" />
          </svg>
        );
      case 'jebena':
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="44" ry="44" fill="#1A1208" stroke="#B45309" strokeWidth="2" />
            <path d="M 50 48 C 34 48 34 76 50 76 C 66 76 66 48 50 48 Z" fill="#78350F" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M 46 28 L 54 28 L 54 48 L 46 48 Z" fill="#78350F" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 46 34 C 36 34 32 46 36 56 C 37 57 41 57 41 56" stroke="#F59E0B" strokeWidth="2" fill="none" />
            <path d="M 54 52 C 64 52 68 44 68 38 L 65 38" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 46 22 Q 48 16 46 12" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 52 21 Q 50 14 53 11" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'stem':
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="44" ry="44" fill="#081A24" stroke="#06B6D4" strokeWidth="2" />
            <ellipse cx="50" cy="50" rx="30" ry="12" stroke="#22D3EE" strokeWidth="1.5" transform="rotate(30 50 50)" fill="none" />
            <ellipse cx="50" cy="50" rx="30" ry="12" stroke="#22D3EE" strokeWidth="1.5" transform="rotate(-30 50 50)" fill="none" />
            <ellipse cx="50" cy="50" rx="30" ry="12" stroke="#22D3EE" strokeWidth="1.5" transform="rotate(90 50 50)" fill="none" />
            <circle cx="50" cy="50" r="5" fill="#F59E0B" />
          </svg>
        );
      case 'justice':
        return (
          <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="50" rx="44" ry="44" fill="#1C0E1A" stroke="#EC4899" strokeWidth="2" />
            <line x1="50" y1="20" x2="50" y2="76" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="38" y1="76" x2="62" y2="76" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <line x1="24" y1="32" x2="76" y2="32" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" />
            <path d="M 24 32 L 16 52 C 16 58 32 58 32 52 Z" fill="#BE185D" stroke="#F472B6" strokeWidth="1.2" />
            <path d="M 76 32 L 68 52 C 68 58 84 58 84 52 Z" fill="#BE185D" stroke="#F472B6" strokeWidth="1.2" />
          </svg>
        );
      default:
        return null;
    }
  };

  const isPhoto = Boolean(
    avatar && (
      avatar.startsWith('data:image/') ||
      avatar.startsWith('http://') ||
      avatar.startsWith('https://') ||
      avatar.startsWith('blob:') ||
      avatar.length > 50
    )
  );

  const [imageError, setImageError] = React.useState(false);

  // Reset image error if avatar changes
  React.useEffect(() => {
    setImageError(false);
  }, [avatar]);

  return (
    <div 
      className={`relative rounded-full select-none flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200 border bg-[#0F172A] shadow-md ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {avatar && isPhoto && !imageError ? (
        <img 
          src={avatar} 
          alt={name} 
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : avatar && !isPhoto ? (
        renderPreset(avatar) || (
          <div className="font-serif font-black text-amber-400 flex items-center justify-center" style={{ fontSize: size * 0.45 }}>
            {initial}
          </div>
        )
      ) : (
        <div className="font-serif font-black text-amber-400 flex items-center justify-center" style={{ fontSize: size * 0.45 }}>
          {initial}
        </div>
      )}
    </div>
  );
}
