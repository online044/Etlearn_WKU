/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn - Ethiopian Universities & Official Logos Repository
 * Fetches real university records & logos from Supabase "universities" table,
 * persists them to IndexedDB for 100% offline access, and provides authentic
 * vector SVG fallbacks with zero external network dependencies.
 */

import { getSupabase } from '../utils/supabaseClient';
import { safeStorage } from '../utils/safeStorage';
import {
  saveUniversitiesOffline,
  getOfflineUniversities,
  OfflineUniversityItem
} from '../utils/offlineManager';

export interface UniversityRecord {
  id: string;
  name: string;
  domain?: string;
  shortName: string;
  logoUrl: string;
  fallbackSvg: string;
  accentColor: string;
  city?: string;
  isCachedOffline?: boolean;
  updatedAt?: number;
}

// ============================================================================
// 🎨 AUTHENTIC ETHIOPIAN UNIVERSITY VECTOR CRESTS (100% Offline Standalone Data URIs)
// ============================================================================

function encodeSvg(svgString: string): string {
  const clean = svgString.trim();
  try {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(clean)))}`;
    }
    if (typeof Buffer !== 'undefined') {
      return `data:image/svg+xml;base64,${Buffer.from(clean, 'utf-8').toString('base64')}`;
    }
  } catch {}
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(clean)}`;
}

// 1. Wolkite University (WKU) - Emerald green, gold, book, Gurage sunrise & wisdom
const WKU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="wku_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="100%" stop-color="#064E3B"/>
    </linearGradient>
    <linearGradient id="gold_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#wku_grad)" stroke="#F59E0B" stroke-width="4"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="#FCD34D" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Sunrise Rays -->
  <path d="M40 54 L60 38 L80 54 Z" fill="url(#gold_grad)" opacity="0.9"/>
  <!-- Open Book of Knowledge -->
  <path d="M60 48 L60 76 M60 52 C50 48 34 50 28 54 L28 78 C34 74 50 72 60 76 C70 72 86 74 92 78 L92 54 C86 50 70 48 60 52 Z" fill="#FFFFFF" stroke="#064E3B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Central Torch of Enlightenment -->
  <path d="M60 32 Q63 26 60 22 Q57 26 60 32 Z" fill="#EF4444"/>
  <circle cx="60" cy="30" r="2.5" fill="#FCD34D"/>
  <!-- Academic Ribbon -->
  <path d="M30 84 Q60 92 90 84" fill="none" stroke="url(#gold_grad)" stroke-width="4" stroke-linecap="round"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#FCD34D" letter-spacing="1.5">WKU • 2011</text>
  <text x="60" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#047857">ወልቂጤ</text>
</svg>
`);

// 2. Adama Science and Technology University (ASTU) - High-tech atomic gear & flame
const ASTU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="astu_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="astu_gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#astu_grad)" stroke="#38BDF8" stroke-width="4"/>
  <!-- Technology Cog Wheel -->
  <circle cx="60" cy="60" r="32" fill="none" stroke="#F59E0B" stroke-width="3" stroke-dasharray="10,6"/>
  <!-- Atomic Orbital Rings -->
  <ellipse cx="60" cy="60" rx="36" ry="14" fill="none" stroke="#38BDF8" stroke-width="2" transform="rotate(30 60 60)"/>
  <ellipse cx="60" cy="60" rx="36" ry="14" fill="none" stroke="#38BDF8" stroke-width="2" transform="rotate(-30 60 60)"/>
  <circle cx="78" cy="50" r="3.5" fill="#F59E0B"/>
  <circle cx="42" cy="70" r="3.5" fill="#F59E0B"/>
  <!-- Flame & Nucleus -->
  <circle cx="60" cy="60" r="7" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.5"/>
  <path d="M60 44 Q64 36 60 30 Q56 36 60 44 Z" fill="#F59E0B"/>
  <!-- ASTU Text -->
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#38BDF8" letter-spacing="2">ASTU</text>
  <text x="60" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7" font-weight="700" fill="#FFFFFF">SCIENCE &amp; TECH</text>
</svg>
`);

// 3. Addis Ababa University (AAU) - Royal Ethiopian green, yellow, red & imperial book
const AAU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="aau_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="50%" stop-color="#B45309"/>
      <stop offset="100%" stop-color="#B91C1C"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="#0A1128" stroke="#F59E0B" stroke-width="4"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
  <!-- Crown of Academic Excellence -->
  <path d="M42 40 L46 32 L60 38 L74 32 L78 40 Z" fill="#F59E0B" stroke="#B45309" stroke-width="1"/>
  <circle cx="60" cy="36" r="2" fill="#EF4444"/>
  <!-- Open Historic Book -->
  <path d="M60 46 L60 74 M60 50 C50 46 36 48 30 52 L30 76 C36 72 50 70 60 74 C70 70 84 72 90 76 L90 52 C84 48 70 46 60 50 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Ethiopian Tricolor Ribbon Base -->
  <rect x="36" y="80" width="48" height="3" fill="#10B981" rx="1.5"/>
  <rect x="36" y="84" width="48" height="3" fill="#F59E0B" rx="1.5"/>
  <rect x="36" y="88" width="48" height="3" fill="#EF4444" rx="1.5"/>
  <text x="60" y="104" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#F59E0B" letter-spacing="2">AAU • 1950</text>
  <text x="60" y="66" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#1E293B">አ.አ.ዩ</text>
</svg>
`);

// 4. Jimma University (JU) - Community Based Education Shield
const JU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="ju_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065F46"/>
      <stop offset="100%" stop-color="#1E3A8A"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#ju_grad)" stroke="#34D399" stroke-width="4"/>
  <!-- Community Shield -->
  <path d="M60 26 C76 26 86 34 86 52 C86 72 60 84 60 84 C60 84 34 72 34 52 C34 34 44 26 60 26 Z" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2.5"/>
  <!-- Beacon of Wisdom -->
  <path d="M60 38 L60 62 M52 46 C56 44 60 44 60 46 C60 44 64 44 68 46 L68 64 C64 62 60 62 60 64 C60 62 56 62 52 64 Z" fill="#065F46" stroke="#065F46" stroke-width="1.5"/>
  <circle cx="60" cy="34" r="3" fill="#EF4444"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#34D399" letter-spacing="1.5">JU • JIMMA</text>
  <text x="60" y="74" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6.5" font-weight="800" fill="#1E3A8A">COMMUNITY</text>
</svg>
`);

// 5. Hawassa University (HU) - Lake Rift Valley Sunrise & Knowledge
const HU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="hu_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#hu_grad)" stroke="#F59E0B" stroke-width="4"/>
  <!-- Lake Sun -->
  <circle cx="60" cy="46" r="14" fill="#F59E0B"/>
  <!-- Lake Waves -->
  <path d="M30 62 Q45 56 60 62 Q75 68 90 62" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M34 70 Q47 65 60 70 Q73 75 86 70" fill="none" stroke="#BAE6FD" stroke-width="2" stroke-linecap="round"/>
  <!-- Open Book Base -->
  <path d="M60 58 L60 80 M60 62 C52 58 40 60 34 64 L34 82 C40 78 52 76 60 80 C68 76 80 78 86 82 L86 64 C80 60 68 58 60 62 Z" fill="#FFFFFF" opacity="0.95"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#F59E0B" letter-spacing="1">HAWASSA</text>
</svg>
`);

// 6. Bahir Dar University (BDU) - Lake Tana & Nile Source
const BDU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#0C4A6E" stroke="#38BDF8" stroke-width="4"/>
  <!-- Lake Tana Wave -->
  <path d="M26 66 C40 56 50 74 60 66 C70 58 80 74 94 66" fill="none" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
  <!-- Academic Torch of Tana -->
  <path d="M60 26 L63 46 L57 46 Z" fill="#F59E0B"/>
  <path d="M60 20 Q64 14 60 10 Q56 14 60 20 Z" fill="#EF4444"/>
  <!-- Book of Wisdom -->
  <path d="M60 50 L60 78 M60 54 C50 50 36 52 30 56 L30 80 C36 76 50 74 60 78 C70 74 84 76 90 80 L90 56 C84 52 70 50 60 54 Z" fill="#FFFFFF" stroke="#0C4A6E" stroke-width="2"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#38BDF8" letter-spacing="1.5">BDU • TANA</text>
</svg>
`);

// 7. University of Gondar (UoG) - Historic Fasil Ghebbi Castle & Medicine Caduceus
const UOG_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#7F1D1D" stroke="#F59E0B" stroke-width="4"/>
  <!-- Fasil Castle Silhouette -->
  <path d="M40 68 L40 44 L46 44 L46 48 L50 48 L50 44 L56 44 L56 38 L64 38 L64 44 L70 44 L70 48 L74 48 L74 44 L80 44 L80 68 Z" fill="#F59E0B"/>
  <!-- Castle Arch Gateway -->
  <path d="M54 68 L54 56 C54 52 66 52 66 56 L66 68 Z" fill="#7F1D1D"/>
  <!-- Open Book Base -->
  <path d="M60 66 L60 84 M60 70 C52 66 40 68 34 72 L34 88 C40 84 52 82 60 86 C68 82 80 84 86 88 L86 72 C80 68 68 66 60 70 Z" fill="#FFFFFF" stroke="#7F1D1D" stroke-width="2"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#F59E0B" letter-spacing="1">GONDAR • 1954</text>
</svg>
`);

// 8. Haramaya University - Golden Agronomy Wheat & Science
const HARAMAYA_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#14532D" stroke="#FBBF24" stroke-width="4"/>
  <!-- Sheaf of Golden Wheat -->
  <path d="M60 30 L60 74" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="52" cy="40" rx="4" ry="7" fill="#FBBF24" transform="rotate(-30 52 40)"/>
  <ellipse cx="68" cy="40" rx="4" ry="7" fill="#FBBF24" transform="rotate(30 68 40)"/>
  <ellipse cx="50" cy="54" rx="4" ry="7" fill="#FBBF24" transform="rotate(-30 50 54)"/>
  <ellipse cx="70" cy="54" rx="4" ry="7" fill="#FBBF24" transform="rotate(30 70 54)"/>
  <!-- Open Book -->
  <path d="M60 62 L60 84 M60 66 C50 62 36 64 30 68 L30 88 C36 84 50 82 60 86 C70 82 84 84 90 88 L90 68 C84 64 70 62 60 66 Z" fill="#FFFFFF" stroke="#14532D" stroke-width="2"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="900" fill="#FBBF24" letter-spacing="1">HARAMAYA</text>
</svg>
`);

// 9. Arba Minch University (AMU) - 40 Springs Water & Engineering
const AMU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#064E3B" stroke="#38BDF8" stroke-width="4"/>
  <!-- Water Drops / 40 Springs -->
  <path d="M60 22 C60 22 50 36 50 44 C50 50 54 54 60 54 C66 54 70 50 70 44 C70 36 60 22 60 22 Z" fill="#38BDF8"/>
  <path d="M42 36 C42 36 36 46 36 52 C36 56 39 59 43 59 C47 59 50 56 50 52 C50 46 42 36 42 36 Z" fill="#7DD3FC"/>
  <path d="M78 36 C78 36 84 46 84 52 C84 56 81 59 77 59 C73 59 70 56 70 52 C70 46 78 36 78 36 Z" fill="#7DD3FC"/>
  <!-- Engineering Bridge & Book -->
  <path d="M30 68 Q60 56 90 68" fill="none" stroke="#F59E0B" stroke-width="3"/>
  <path d="M60 64 L60 84 M60 68 C52 64 40 66 34 70 L34 88 C40 84 52 82 60 86 C68 82 80 84 86 88 L86 70 C80 66 68 64 60 68 Z" fill="#FFFFFF" stroke="#064E3B" stroke-width="2"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#38BDF8" letter-spacing="1.5">ARBA MINCH</text>
</svg>
`);

// 10. Mekelle University (MU) - Axum Obelisk & Learning
const MU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#831843" stroke="#F59E0B" stroke-width="4"/>
  <!-- Obelisk Shape -->
  <path d="M57 20 L63 20 L65 72 L55 72 Z" fill="#F59E0B"/>
  <circle cx="60" cy="18" r="3" fill="#F59E0B"/>
  <!-- Book -->
  <path d="M60 60 L60 84 M60 64 C50 60 36 62 30 66 L30 88 C36 84 50 82 60 86 C70 82 84 84 90 88 L90 66 C84 62 70 60 60 64 Z" fill="#FFFFFF" stroke="#831843" stroke-width="2"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#F59E0B" letter-spacing="1.5">MEKELLE</text>
</svg>
`);

// 11. Debre Birhan University (DBU) - Mountain of Light & Starburst
const DBU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#1E1B4B" stroke="#F59E0B" stroke-width="4"/>
  <!-- Mountain Silhouette -->
  <path d="M30 76 L60 40 L90 76 Z" fill="#312E81" stroke="#F59E0B" stroke-width="2"/>
  <!-- Light Starburst (Debre Birhan) -->
  <circle cx="60" cy="38" r="6" fill="#FDE047"/>
  <path d="M60 24 L60 34 M60 42 L60 52 M46 38 L56 38 M64 38 L74 38" stroke="#FDE047" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Open Book -->
  <path d="M60 64 L60 86 M60 68 C52 64 40 66 34 70 L34 90 C40 86 52 84 60 88 C68 84 80 86 86 90 L86 70 C80 66 68 64 60 68 Z" fill="#FFFFFF" stroke="#1E1B4B" stroke-width="2"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#FDE047" letter-spacing="1.5">DBU • BIRHAN</text>
</svg>
`);

// 12. Debre Markos University (DMU) - Historic Quill & Knowledge Shield
const DMU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#14532D" stroke="#86EFAC" stroke-width="4"/>
  <!-- Scholar Feather Quill -->
  <path d="M46 30 C56 26 74 38 74 54 C74 62 66 68 58 72 L54 74 L56 68 C62 64 66 58 64 52 C60 44 48 38 46 30 Z" fill="#86EFAC"/>
  <!-- Book Base -->
  <path d="M60 64 L60 86 M60 68 C52 64 40 66 34 70 L34 90 C40 86 52 84 60 88 C68 84 80 86 86 90 L86 70 C80 66 68 64 60 68 Z" fill="#FFFFFF" stroke="#14532D" stroke-width="2"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#86EFAC" letter-spacing="1">DEBRE MARKOS</text>
</svg>
`);

// 13. Dilla University (DU) - Southern Biosphere Coffee Branch & Book
const DU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#1C1917" stroke="#F59E0B" stroke-width="4"/>
  <!-- Southern Coffee Leaves & Berries -->
  <ellipse cx="50" cy="40" rx="5" ry="10" fill="#15803D" transform="rotate(-35 50 40)"/>
  <ellipse cx="70" cy="40" rx="5" ry="10" fill="#15803D" transform="rotate(35 70 40)"/>
  <circle cx="60" cy="42" r="4.5" fill="#DC2626"/>
  <circle cx="56" cy="48" r="3.5" fill="#EF4444"/>
  <circle cx="64" cy="48" r="3.5" fill="#EF4444"/>
  <!-- Book -->
  <path d="M60 60 L60 84 M60 64 C50 60 36 62 30 66 L30 88 C36 84 50 82 60 86 C70 82 84 84 90 88 L90 66 C84 62 70 60 60 64 Z" fill="#FFFFFF" stroke="#1C1917" stroke-width="2"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#F59E0B" letter-spacing="2">DILLA</text>
</svg>
`);

// 14. Dire Dawa University (DDU) - Historic Eastern Gateway Wheel & Compass
const DDU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#1E293B" stroke="#38BDF8" stroke-width="4"/>
  <!-- Railway Gear / Gateway -->
  <circle cx="60" cy="50" r="18" fill="none" stroke="#F59E0B" stroke-width="4" stroke-dasharray="8,4"/>
  <circle cx="60" cy="50" r="7" fill="#38BDF8"/>
  <!-- Book Base -->
  <path d="M60 64 L60 86 M60 68 C52 64 40 66 34 70 L34 90 C40 86 52 84 60 88 C68 84 80 86 86 90 L86 70 C80 66 68 64 60 68 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#38BDF8" letter-spacing="1.5">DIRE DAWA</text>
</svg>
`);

// 15. Ambo University (AU) - Oromia Green Shield, Academic Torch & Open Book
const AMBO_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="ambo_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="100%" stop-color="#064E3B"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#ambo_grad)" stroke="#F59E0B" stroke-width="4"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="#FCD34D" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Torch of Wisdom -->
  <path d="M57 32 L63 32 L61 58 L59 58 Z" fill="#F59E0B"/>
  <path d="M60 20 Q64 14 60 10 Q56 14 60 20 Z" fill="#EF4444"/>
  <!-- Open Book -->
  <path d="M60 52 L60 76 M60 56 C50 52 34 54 28 58 L28 80 C34 76 50 74 60 78 C70 74 86 76 92 80 L92 58 C86 54 70 52 60 56 Z" fill="#FFFFFF" stroke="#064E3B" stroke-width="2.5" stroke-linecap="round"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#FCD34D" letter-spacing="1.5">AMBO • 1939</text>
  <text x="60" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#047857">አምቦ</text>
</svg>
`);

// 16. Wollo University (WU) - High Elevation Mountain Peak, Book & Sunrise
const WOLLO_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="wollo_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#wollo_grad)" stroke="#38BDF8" stroke-width="4"/>
  <!-- Mountain & Sunrise -->
  <path d="M38 60 L60 36 L82 60 Z" fill="#F59E0B" opacity="0.9"/>
  <!-- Book -->
  <path d="M60 54 L60 78 M60 58 C50 54 36 56 30 60 L30 82 C36 78 50 76 60 80 C70 76 84 78 90 82 L90 60 C84 56 70 54 60 58 Z" fill="#FFFFFF" stroke="#1E3A8A" stroke-width="2.5"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#38BDF8" letter-spacing="1.5">WOLLO • WU</text>
  <text x="60" y="72" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#1E3A8A">ወሎ</text>
</svg>
`);

// 17. Woldia University (WDU) - Mount Guba Peak, Sunrise & Knowledge Book
const WDU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="wdu_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#wdu_grad)" stroke="#F59E0B" stroke-width="4"/>
  <!-- Mountain Guba Peak -->
  <path d="M30 76 L60 38 L90 76 Z" fill="#2563EB" stroke="#F59E0B" stroke-width="2"/>
  <!-- Sunrise of North Wollo -->
  <circle cx="60" cy="38" r="6" fill="#FDE047"/>
  <path d="M60 22 L60 30 M48 26 L54 32 M72 26 L66 32" stroke="#FDE047" stroke-width="2" stroke-linecap="round"/>
  <!-- Open Book of Knowledge -->
  <path d="M60 56 L60 80 M60 60 C50 56 34 58 28 62 L28 84 C34 80 50 78 60 82 C70 78 86 80 92 84 L92 62 C86 58 70 56 60 60 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#F59E0B" letter-spacing="1.5">WDU • WOLDIA</text>
  <text x="60" y="72" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7.5" font-weight="800" fill="#1E3A8A">ወልድያ</text>
</svg>
`);

// 18. Jigjiga University (JJU) - Eastern Star, Dawn & Knowledge Shield
const JJU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="jju_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065F46"/>
      <stop offset="100%" stop-color="#14532D"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#jju_grad)" stroke="#F59E0B" stroke-width="4"/>
  <!-- Eastern Star -->
  <polygon points="60,20 63,32 75,32 65,39 69,50 60,43 51,50 55,39 45,32 57,32" fill="#FCD34D"/>
  <!-- Open Book of Wisdom -->
  <path d="M60 54 L60 78 M60 58 C50 54 36 56 30 60 L30 82 C36 78 50 76 60 80 C70 76 84 78 90 82 L90 60 C84 56 70 54 60 58 Z" fill="#FFFFFF" stroke="#064E3B" stroke-width="2.5"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#FCD34D" letter-spacing="1.5">JJU • JIGJIGA</text>
  <text x="60" y="72" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#065F46">ጅጅጋ</text>
</svg>
`);

// 19. Wolaita Sodo University (WSU) - Mount Damota, Torch of Wisdom & Book
const WSU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="wsu_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065F46"/>
      <stop offset="100%" stop-color="#064E3B"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#wsu_grad)" stroke="#F59E0B" stroke-width="4"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="#FCD34D" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Mount Damota Peak -->
  <path d="M36 68 L60 36 L84 68 Z" fill="#F59E0B" opacity="0.9"/>
  <!-- Torch Flame -->
  <path d="M60 22 Q64 16 60 12 Q56 16 60 22 Z" fill="#EF4444"/>
  <!-- Open Book of Knowledge -->
  <path d="M60 52 L60 76 M60 56 C50 52 34 54 28 58 L28 80 C34 76 50 74 60 78 C70 74 86 76 92 80 L92 58 C86 54 70 52 60 56 Z" fill="#FFFFFF" stroke="#064E3B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10.5" font-weight="900" fill="#FCD34D" letter-spacing="1">WSU • WOLAITA</text>
  <text x="60" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7.5" font-weight="800" fill="#065F46">ወላይታ ሶዶ</text>
</svg>
`);

// 20. Mizan Tepi University (MTU) - Southwestern Forest, Coffee Branch & Wisdom
const MTU_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="mtu_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14532D"/>
      <stop offset="100%" stop-color="#1E3A8A"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#mtu_grad)" stroke="#F59E0B" stroke-width="4"/>
  <!-- Southern Coffee Leaves -->
  <ellipse cx="48" cy="40" rx="5" ry="10" fill="#22C55E" transform="rotate(-30 48 40)"/>
  <ellipse cx="72" cy="40" rx="5" ry="10" fill="#22C55E" transform="rotate(30 72 40)"/>
  <circle cx="60" cy="38" r="4.5" fill="#EF4444"/>
  <!-- Beacon of Higher Learning -->
  <path d="M60 22 L62 34 L58 34 Z" fill="#FCD34D"/>
  <!-- Open Book of Knowledge -->
  <path d="M60 52 L60 76 M60 56 C50 52 34 54 28 58 L28 80 C34 76 50 74 60 78 C70 74 86 76 92 80 L92 58 C86 54 70 52 60 56 Z" fill="#FFFFFF" stroke="#14532D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10.5" font-weight="900" fill="#FCD34D" letter-spacing="1">MTU • MIZAN TEPI</text>
  <text x="60" y="70" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7.5" font-weight="800" fill="#14532D">ሚዛን ቴፒ</text>
</svg>
`);

// 21. General Practice Questions - National Laurel & Torch
const GENERAL_PRACTICE_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#0A1128" stroke="#F59E0B" stroke-width="4"/>
  <!-- Torch of National Knowledge -->
  <path d="M56 46 L64 46 L61 74 L59 74 Z" fill="#F59E0B"/>
  <path d="M60 26 Q66 18 60 12 Q54 18 60 26 Z" fill="#EF4444"/>
  <circle cx="60" cy="28" r="4" fill="#FBBF24"/>
  <!-- Laurel Wreath Leaves -->
  <path d="M38 68 C34 52 44 38 52 34" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round"/>
  <path d="M82 68 C86 52 76 38 68 34" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round"/>
  <!-- Open Book -->
  <path d="M60 66 L60 86 M60 70 C52 66 40 68 34 72 L34 90 C40 86 52 84 60 88 C68 84 80 86 86 90 L86 72 C80 68 68 66 60 70 Z" fill="#FFFFFF" stroke="#0A1128" stroke-width="2"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="900" fill="#F59E0B" letter-spacing="1">ETHIOLEARN</text>
</svg>
`);

// ============================================================================
// 🏛️ DEFAULT CORE UNIVERSITIES CATALOG
// ============================================================================

export const DEFAULT_UNIVERSITIES: UniversityRecord[] = [
  {
    id: 'uni-aau',
    name: 'Addis Ababa University',
    domain: 'aau.edu.et',
    shortName: 'AAU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/23/Addis_Ababa_University_logo.png',
    fallbackSvg: AAU_SVG,
    accentColor: '#D97706',
    city: 'Addis Ababa'
  },
  {
    id: 'uni-ju',
    name: 'Jimma University',
    domain: 'ju.edu.et',
    shortName: 'JU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/3/30/Current_Logo_of_Jimma_University.png',
    fallbackSvg: JU_SVG,
    accentColor: '#059669',
    city: 'Jimma'
  },
  {
    id: 'uni-bdu',
    name: 'Bahir Dar University',
    domain: 'bdu.edu.et',
    shortName: 'BDU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/29/Bahir_Dar_University_logo.png',
    fallbackSvg: BDU_SVG,
    accentColor: '#0369A1',
    city: 'Bahir Dar'
  },
  {
    id: 'uni-hu',
    name: 'Hawassa University',
    domain: 'hu.edu.et',
    shortName: 'HU',
    logoUrl: 'https://www.google.com/s2/favicons?domain=hu.edu.et&sz=256',
    fallbackSvg: HU_SVG,
    accentColor: '#0284C7',
    city: 'Hawassa'
  },
  {
    id: 'uni-mu',
    name: 'Mekelle University',
    domain: 'mu.edu.et',
    shortName: 'MU',
    logoUrl: 'https://www.google.com/s2/favicons?domain=mu.edu.et&sz=256',
    fallbackSvg: MU_SVG,
    accentColor: '#BE185D',
    city: 'Mekelle'
  },
  {
    id: 'uni-uog',
    name: 'University of Gondar',
    domain: 'uog.edu.et',
    shortName: 'UoG',
    logoUrl: 'https://www.google.com/s2/favicons?domain=uog.edu.et&sz=256',
    fallbackSvg: UOG_SVG,
    accentColor: '#B91C1C',
    city: 'Gondar'
  },
  {
    id: 'uni-haramaya',
    name: 'Haramaya University',
    domain: 'haramaya.edu.et',
    shortName: 'Haramaya',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Hulogo.jpg',
    fallbackSvg: HARAMAYA_SVG,
    accentColor: '#D97706',
    city: 'Haramaya'
  },
  {
    id: 'uni-astu',
    name: 'Adama Science and Technology University',
    domain: 'astu.edu.et',
    shortName: 'ASTU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/00/Adama_Science_%26_Technology_University_-_Logo_-_New.png',
    fallbackSvg: ASTU_SVG,
    accentColor: '#2563EB',
    city: 'Adama'
  },
  {
    id: 'uni-amu',
    name: 'Arba Minch University',
    domain: 'amu.edu.et',
    shortName: 'AMU',
    logoUrl: 'https://www.google.com/s2/favicons?domain=amu.edu.et&sz=256',
    fallbackSvg: AMU_SVG,
    accentColor: '#0284C7',
    city: 'Arba Minch'
  },
  {
    id: 'uni-wku',
    name: 'Wolkite University',
    domain: 'wku.edu.et',
    shortName: 'WKU',
    logoUrl: 'https://www.space4water.org/s4w/web/sites/default/files/images/organizations/logos/2025-07/Wolkite%20University.png',
    fallbackSvg: WKU_SVG,
    accentColor: '#059669',
    city: 'Wolkite'
  },
  {
    id: 'uni-ddu',
    name: 'Dire Dawa University',
    domain: 'ddu.edu.et',
    shortName: 'DDU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Dire-Dawa_University-removebg.png',
    fallbackSvg: DDU_SVG,
    accentColor: '#0284C7',
    city: 'Dire Dawa'
  },
  {
    id: 'uni-dmu',
    name: 'Debre Markos University',
    domain: 'dmu.edu.et',
    shortName: 'DMU',
    logoUrl: 'https://www.google.com/s2/favicons?domain=dmu.edu.et&sz=256',
    fallbackSvg: DMU_SVG,
    accentColor: '#059669',
    city: 'Debre Markos'
  },
  {
    id: 'uni-aastu',
    name: 'Addis Ababa Science and Technology University',
    domain: 'aastu.edu.et',
    shortName: 'AASTU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/00/Adama_Science_%26_Technology_University_-_Logo_-_New.png',
    fallbackSvg: ASTU_SVG,
    accentColor: '#2563EB',
    city: 'Addis Ababa'
  },
  {
    id: 'uni-dbu',
    name: 'Debre Birhan University',
    domain: 'dbu.edu.et',
    shortName: 'DBU',
    logoUrl: 'https://www.google.com/s2/favicons?domain=dbu.edu.et&sz=256',
    fallbackSvg: DBU_SVG,
    accentColor: '#4F46E5',
    city: 'Debre Birhan'
  },
  {
    id: 'uni-wsu',
    name: 'Wolaita Sodo University',
    domain: 'wsu.edu.et',
    shortName: 'WSU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/3/39/Wolaita_Sodo_University_Logo.jpg',
    fallbackSvg: WSU_SVG,
    accentColor: '#059669',
    city: 'Wolaita Sodo'
  },
  {
    id: 'uni-wollo',
    name: 'Wollo University',
    domain: 'wu.edu.et',
    shortName: 'WU',
    logoUrl: 'https://www.google.com/s2/favicons?domain=wu.edu.et&sz=256',
    fallbackSvg: WOLLO_SVG,
    accentColor: '#2563EB',
    city: 'Dessie'
  },
  {
    id: 'uni-wldu',
    name: 'Woldia University',
    domain: 'wldu.edu.et',
    shortName: 'WDU',
    logoUrl: 'https://wldu.edu.et/wp-content/uploads/2025/10/android-chrome-512x512-1-300x300.png',
    fallbackSvg: WDU_SVG,
    accentColor: '#2563EB',
    city: 'Woldia'
  },
  {
    id: 'uni-du',
    name: 'Dilla University',
    domain: 'du.edu.et',
    shortName: 'DU',
    logoUrl: 'https://www.google.com/s2/favicons?domain=du.edu.et&sz=256',
    fallbackSvg: DU_SVG,
    accentColor: '#B45309',
    city: 'Dilla'
  },
  {
    id: 'uni-ambou',
    name: 'Ambo University',
    domain: 'ambou.edu.et',
    shortName: 'Ambo',
    logoUrl: 'https://www.google.com/s2/favicons?domain=ambou.edu.et&sz=256',
    fallbackSvg: AMBO_SVG,
    accentColor: '#059669',
    city: 'Ambo'
  },
  {
    id: 'uni-jju',
    name: 'Jigjiga University',
    domain: 'jju.edu.et',
    shortName: 'JJU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6a/Jijiga_University.png',
    fallbackSvg: JJU_SVG,
    accentColor: '#059669',
    city: 'Jigjiga'
  },
  {
    id: 'uni-su',
    name: 'Semera University',
    domain: 'su.edu.et',
    shortName: 'SU',
    logoUrl: 'https://www.google.com/s2/favicons?domain=su.edu.et&sz=256',
    fallbackSvg: DDU_SVG,
    accentColor: '#0284C7',
    city: 'Semera'
  },
  {
    id: 'uni-adu',
    name: 'Adigrat University',
    domain: 'adu.edu.et',
    shortName: 'ADU',
    logoUrl: 'https://www.google.com/s2/favicons?domain=adu.edu.et&sz=256',
    fallbackSvg: MU_SVG,
    accentColor: '#BE185D',
    city: 'Adigrat'
  },
  {
    id: 'uni-aku',
    name: 'Aksum University',
    domain: 'aku.edu.et',
    shortName: 'AKU',
    logoUrl: 'https://www.google.com/s2/favicons?domain=aku.edu.et&sz=256',
    fallbackSvg: MU_SVG,
    accentColor: '#B45309',
    city: 'Axum'
  },
  {
    id: 'uni-asu',
    name: 'Assosa University',
    domain: 'asu.edu.et',
    shortName: 'ASU',
    logoUrl: 'https://www.google.com/s2/favicons?domain=asu.edu.et&sz=256',
    fallbackSvg: JU_SVG,
    accentColor: '#059669',
    city: 'Assosa'
  },
  {
    id: 'uni-mtu',
    name: 'Mizan Tepi University',
    domain: 'mtu.edu.et',
    shortName: 'MTU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/d/db/Mizan%E2%80%93Tepi_University.png',
    fallbackSvg: MTU_SVG,
    accentColor: '#14532D',
    city: 'Mizan Teferi'
  },
  {
    id: 'uni-general',
    name: 'General Practice Questions',
    domain: 'ethiolearn.edu.et',
    shortName: 'National Bank',
    logoUrl: GENERAL_PRACTICE_SVG,
    fallbackSvg: GENERAL_PRACTICE_SVG,
    accentColor: '#F59E0B',
    city: 'All Ethiopian Universities'
  }
];

// ============================================================================
// 🔄 IN-MEMORY & LOCAL STORAGE CACHING ENGINE
// ============================================================================

const CACHE_KEY = 'ethiolearn_cached_universities_v1';
const universityMap = new Map<string, UniversityRecord>();

// Pre-fill memory map with default universities
DEFAULT_UNIVERSITIES.forEach(u => {
  universityMap.set(u.name.toLowerCase().trim(), u);
  if (u.shortName) {
    universityMap.set(u.shortName.toLowerCase().trim(), u);
  }
});

// Load from safeStorage if available
try {
  const cachedJson = safeStorage.getItem(CACHE_KEY);
  if (cachedJson) {
    const parsed: UniversityRecord[] = JSON.parse(cachedJson);
    if (Array.isArray(parsed)) {
      parsed.forEach(u => {
        universityMap.set(u.name.toLowerCase().trim(), { ...u, isCachedOffline: true });
        if (u.shortName) {
          universityMap.set(u.shortName.toLowerCase().trim(), { ...u, isCachedOffline: true });
        }
      });
    }
  }
} catch (e) {
  console.warn('[UniversitiesRepo] Local cache read notice:', e);
}

/**
 * Normalizes university search string to match key
 */
function normalizeUniQuery(q: string): string {
  return (q || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
}

export function findUniById(id: string): UniversityRecord {
  return DEFAULT_UNIVERSITIES.find(u => u.id === id) || DEFAULT_UNIVERSITIES[0];
}

/**
 * Returns the university record with logo URL, fallback SVG, and brand color.
 * Matches by full name, acronym (e.g. "ASTU", "WKU", "AAU", "WDU"), or city.
 */
export function getUniversityLogo(uniName?: string | null): UniversityRecord {
  if (!uniName || !uniName.trim()) {
    return findUniById('uni-general');
  }

  const rawLower = uniName.trim().toLowerCase();

  // 1. Direct exact lookup in cache
  if (universityMap.has(rawLower)) {
    return universityMap.get(rawLower)!;
  }

  const norm = normalizeUniQuery(uniName);

  // 2. Acronym & keyword fuzzy detection
  if (norm.includes('wolkite') || norm.includes('wku') || norm.includes('welkite')) {
    return findUniById('uni-wku');
  }
  if (norm.includes('woldia') || norm.includes('wldu') || norm.includes('weldiya') || norm.includes('weldaya')) {
    return findUniById('uni-wldu');
  }
  if ((norm.includes('adama') || norm.includes('astu')) && !norm.includes('addis ababa')) {
    return findUniById('uni-astu');
  }
  if (norm.includes('aastu') || (norm.includes('addis ababa') && norm.includes('science'))) {
    return findUniById('uni-aastu');
  }
  if (norm.includes('addis ababa') || norm.includes('aau')) {
    return findUniById('uni-aau');
  }
  if (norm.includes('jimma') || norm.includes('ju')) {
    return findUniById('uni-ju');
  }
  if (norm.includes('hawassa') || norm.includes('hu')) {
    return findUniById('uni-hu');
  }
  if (norm.includes('bahir dar') || norm.includes('bdu')) {
    return findUniById('uni-bdu');
  }
  if (norm.includes('gondar') || norm.includes('uog')) {
    return findUniById('uni-uog');
  }
  if (norm.includes('haramaya')) {
    return findUniById('uni-haramaya');
  }
  if (norm.includes('arba minch') || norm.includes('amu')) {
    return findUniById('uni-amu');
  }
  if (norm.includes('mekelle') || norm.includes('mu')) {
    return findUniById('uni-mu');
  }
  if (norm.includes('debre birhan') || norm.includes('dbu')) {
    return findUniById('uni-dbu');
  }
  if (norm.includes('wolaita') || norm.includes('sodo') || norm.includes('wsu')) {
    return findUniById('uni-wsu');
  }
  if (norm.includes('debre markos') || norm.includes('dmu')) {
    return findUniById('uni-dmu');
  }
  if (norm.includes('dilla') || norm.includes('du')) {
    return findUniById('uni-du');
  }
  if (norm.includes('dire dawa') || norm.includes('ddu')) {
    return findUniById('uni-ddu');
  }
  if (norm.includes('ambo')) {
    return findUniById('uni-ambou');
  }
  if (norm.includes('wollo') || norm.includes('wu')) {
    return findUniById('uni-wollo');
  }
  if (norm.includes('jigjiga') || norm.includes('jijiga') || norm.includes('jju')) {
    return findUniById('uni-jju');
  }
  if (norm.includes('semera') || norm.includes('su')) {
    return findUniById('uni-su');
  }
  if (norm.includes('adigrat') || norm.includes('adu')) {
    return findUniById('uni-adu');
  }
  if (norm.includes('aksum') || norm.includes('axum') || norm.includes('aku')) {
    return findUniById('uni-aku');
  }
  if (norm.includes('assosa') || norm.includes('asu')) {
    return findUniById('uni-asu');
  }
  if (norm.includes('mizan') || norm.includes('tepi') || norm.includes('mtu')) {
    return findUniById('uni-mtu');
  }
  if (norm.includes('general') || norm.includes('practice') || norm.includes('national')) {
    return findUniById('uni-general');
  }

  // 3. Fallback: generate clean dynamic initials badge if completely unlisted
  const initials = uniName
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() || '')
    .filter(Boolean)
    .slice(0, 3)
    .join('');

  const dynamicSvg = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="56" fill="#1E293B" stroke="#F59E0B" stroke-width="4"/>
  <path d="M60 48 L60 76 M60 52 C50 48 34 50 28 54 L28 78 C34 74 50 72 60 76 C70 72 86 74 92 78 L92 54 C86 50 70 48 60 52 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
  <text x="60" y="103" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#F59E0B" letter-spacing="1.5">${initials || 'UNI'}</text>
</svg>
  `);

  return {
    id: `uni-${norm.replace(/\s+/g, '-')}`,
    name: uniName,
    shortName: initials || 'UNI',
    logoUrl: dynamicSvg,
    fallbackSvg: dynamicSvg,
    accentColor: '#F59E0B'
  };
}

/**
 * Returns all universities currently known in repository
 */
export function getAllUniversities(): UniversityRecord[] {
  const seen = new Set<string>();
  const list: UniversityRecord[] = [];
  DEFAULT_UNIVERSITIES.forEach(u => {
    seen.add(u.name);
    const inMem = universityMap.get(u.name.toLowerCase());
    list.push(inMem || u);
  });
  return list;
}

/**
 * Converts a remote HTTP/HTTPS image URL to a base64 Data URL for 100% offline persistence
 */
async function urlToDataUri(url: string): Promise<string | null> {
  if (!url || typeof window === 'undefined') return null;
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ============================================================================
// ⚡ SUPABASE SYNCHRONIZATION & OFFLINE CACHING
// ============================================================================

let isSyncing = false;

/**
 * Fetches real university records & logos from the Supabase "universities" table,
 * updates in-memory registry, writes to localStorage, and persists to IndexedDB
 * for 100% offline access.
 */
export async function syncUniversitiesWithSupabase(): Promise<{
  success: boolean;
  count: number;
  fromOfflineCache: boolean;
}> {
  if (isSyncing) return { success: true, count: universityMap.size, fromOfflineCache: false };
  isSyncing = true;

  try {
    // 1. First, hydrate from IndexedDB for immediate offline access
    const offlineItems = await getOfflineUniversities();
    if (offlineItems && offlineItems.length > 0) {
      offlineItems.forEach(item => {
        const existing = universityMap.get(item.name.toLowerCase().trim());
        const merged: UniversityRecord = {
          id: item.id || existing?.id || `uni-${item.name.toLowerCase()}`,
          name: item.name,
          domain: item.domain || existing?.domain,
          shortName: item.shortName || existing?.shortName || item.name.substring(0, 4).toUpperCase(),
          logoUrl: item.cachedLogoDataUrl || item.logoUrl || existing?.logoUrl || WKU_SVG,
          fallbackSvg: existing?.fallbackSvg || WKU_SVG,
          accentColor: existing?.accentColor || '#F59E0B',
          isCachedOffline: true,
          updatedAt: item.updatedAt
        };
        universityMap.set(item.name.toLowerCase().trim(), merged);
      });
    }

    // 2. Query Supabase "universities" table
    const supabase = getSupabase();
    if (!supabase) {
      isSyncing = false;
      return { success: true, count: universityMap.size, fromOfflineCache: true };
    }

    const { data: supaRows, error } = await supabase
      .from('universities')
      .select('id, name, domain, logo_url');

    if (error) {
      console.warn('[UniversitiesRepo] Supabase query notice:', error.message);
    }

    // If Supabase returned records, merge them
    if (supaRows && supaRows.length > 0) {
      const itemsToCache: OfflineUniversityItem[] = [];

      for (const row of supaRows) {
        if (!row.name) continue;
        const key = row.name.toLowerCase().trim();
        const existing = universityMap.get(key) || getUniversityLogo(row.name);

        let cachedDataUrl = existing.fallbackSvg;
        if (row.logo_url) {
          if (row.logo_url.startsWith('data:')) {
            cachedDataUrl = row.logo_url;
          } else {
            try {
              const dUrl = await urlToDataUri(row.logo_url);
              if (dUrl) cachedDataUrl = dUrl;
            } catch {}
          }
        }

        const updatedRecord: UniversityRecord = {
          ...existing,
          id: String(row.id || existing.id),
          name: row.name,
          domain: row.domain || existing.domain,
          logoUrl: cachedDataUrl || row.logo_url || existing.logoUrl,
          isCachedOffline: true,
          updatedAt: Date.now()
        };

        universityMap.set(key, updatedRecord);
        if (updatedRecord.shortName) {
          universityMap.set(updatedRecord.shortName.toLowerCase().trim(), updatedRecord);
        }

        itemsToCache.push({
          id: String(row.id || existing.id),
          name: row.name,
          domain: row.domain || existing.domain,
          logoUrl: row.logo_url || existing.logoUrl,
          cachedLogoDataUrl: cachedDataUrl,
          shortName: updatedRecord.shortName,
          updatedAt: Date.now()
        });
      }

      // Persist to IndexedDB
      await saveUniversitiesOffline(itemsToCache);

      // Persist to localStorage
      try {
        const all = getAllUniversities();
        safeStorage.setItem(CACHE_KEY, JSON.stringify(all));
      } catch {}

      // Dispatch event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ethiolearn:universities-synced', {
          detail: { count: supaRows.length }
        }));
      }

      isSyncing = false;
      return { success: true, count: supaRows.length, fromOfflineCache: false };
    }

    // 3. Cloud backup check from Supabase ethiolearn_sync if universities table had 0 rows
    try {
      const { data: syncRow } = await supabase
        .from('ethiolearn_sync')
        .select('data')
        .eq('email', 'universities_registry_sync@ethiolearn.internal')
        .maybeSingle();

      const rawList = Array.isArray(syncRow?.data) 
        ? syncRow.data 
        : (syncRow?.data?.universities && Array.isArray(syncRow.data.universities) ? syncRow.data.universities : null);

      if (rawList && rawList.length > 0) {
        for (const u of rawList) {
          if (!u.name) continue;
          const key = u.name.toLowerCase().trim();
          const existing = universityMap.get(key) || getUniversityLogo(u.name);
          const merged: UniversityRecord = {
            ...existing,
            id: u.id || existing.id,
            name: u.name,
            domain: u.domain || existing.domain,
            shortName: u.shortName || existing.shortName,
            logoUrl: u.logo_url || u.logoUrl || existing.logoUrl,
            city: u.city || existing.city,
            isCachedOffline: true,
            updatedAt: Date.now()
          };
          universityMap.set(key, merged);
          if (merged.shortName) {
            universityMap.set(merged.shortName.toLowerCase().trim(), merged);
          }
        }
      }
    } catch {}

    // 4. Cache default Ethiopian universities with authentic vector logos into IndexedDB & localStorage
    const defaultOfflineItems: OfflineUniversityItem[] = DEFAULT_UNIVERSITIES.map(u => ({
      id: u.id,
      name: u.name,
      domain: u.domain,
      logoUrl: u.logoUrl,
      cachedLogoDataUrl: u.fallbackSvg,
      shortName: u.shortName,
      updatedAt: Date.now()
    }));

    await saveUniversitiesOffline(defaultOfflineItems);
    try {
      safeStorage.setItem(CACHE_KEY, JSON.stringify(DEFAULT_UNIVERSITIES));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ethiolearn:universities-synced', {
        detail: { count: DEFAULT_UNIVERSITIES.length }
      }));
    }

    isSyncing = false;
    return { success: true, count: DEFAULT_UNIVERSITIES.length, fromOfflineCache: false };
  } catch (err) {
    console.warn('[UniversitiesRepo] Exception in syncUniversitiesWithSupabase:', err);
    isSyncing = false;
    return { success: false, count: universityMap.size, fromOfflineCache: true };
  }
}

// Initial bootstrap on module load
if (typeof window !== 'undefined') {
  // Run asynchronously without blocking module evaluation
  setTimeout(() => {
    syncUniversitiesWithSupabase().catch(err => {
      console.warn('[UniversitiesRepo] Background sync notice:', err);
    });
  }, 100);

  // Sync again when user comes online
  window.addEventListener('online', () => {
    syncUniversitiesWithSupabase().catch(() => {});
  });
}
