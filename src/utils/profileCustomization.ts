/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProfileCustomizationPreferences, ProfileAccentTheme } from '../types';

export const DEFAULT_PROFILE_PREFERENCES: ProfileCustomizationPreferences = {
  cardLayout: 'detailed',
  coverBannerUrl: 'gradient-wolkite',
  accentColor: 'gold',
  renderMode: 'system',
  selectedBadgeTitle: '',
  visibleFields: {
    email: true,
    institution: true,
    department: true,
    targetGpa: true,
    bio: true
  },
  sectionOrder: ['academic', 'modules', 'analytics', 'billing', 'security'],
  sectionVisibility: {
    academic: true,
    modules: true,
    analytics: true,
    billing: true,
    security: true
  },
  collapsedSections: {},
  modulesDisplayMode: 'cloud',
  pinnedModules: [],
  quickActionsOrder: ['academic', 'analytics', 'billing', 'security'],
  quickActionsVisibility: {
    academic: true,
    analytics: true,
    billing: true,
    security: true
  }
};

export interface AccentThemeConfig {
  id: ProfileAccentTheme;
  name: string;
  nameAm: string;
  hex: string;
  borderHex: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  buttonClass: string;
  gradient: string;
}

export const ACCENT_THEMES: Record<ProfileAccentTheme, AccentThemeConfig> = {
  gold: {
    id: 'gold',
    name: 'Royal Gold',
    nameAm: 'ሮያል ወርቅ',
    hex: '#F59E0B',
    borderHex: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#F59E0B',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 text-slate-950',
    gradient: 'from-amber-500 to-amber-600'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Scholar',
    nameAm: 'ኤመራልድ አረንጓዴ',
    hex: '#10B981',
    borderHex: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeText: '#10B981',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    buttonClass: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  blue: {
    id: 'blue',
    name: 'University Blue',
    nameAm: 'ዩኒቨርሲቲ ሰማያዊ',
    hex: '#3B82F6',
    borderHex: '#3B82F6',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeText: '#60A5FA',
    badgeBorder: 'rgba(59, 130, 246, 0.35)',
    buttonClass: 'bg-blue-500 hover:bg-blue-600 text-white',
    gradient: 'from-blue-500 to-blue-600'
  },
  purple: {
    id: 'purple',
    name: 'Academic Purple',
    nameAm: 'አካዳሚክ ሐምራዊ',
    hex: '#A855F7',
    borderHex: '#A855F7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeText: '#C084FC',
    badgeBorder: 'rgba(168, 85, 247, 0.35)',
    buttonClass: 'bg-purple-500 hover:bg-purple-600 text-white',
    gradient: 'from-purple-500 to-purple-600'
  },
  rose: {
    id: 'rose',
    name: 'Crimson Honor',
    nameAm: 'ክሪምሰን ቀይ',
    hex: '#F43F5E',
    borderHex: '#F43F5E',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeText: '#FB7185',
    badgeBorder: 'rgba(244, 63, 94, 0.35)',
    buttonClass: 'bg-rose-500 hover:bg-rose-600 text-white',
    gradient: 'from-rose-500 to-rose-600'
  },
  amber: {
    id: 'amber',
    name: 'Warm Amber',
    nameAm: 'አምበር ብርቱካን',
    hex: '#D97706',
    borderHex: '#D97706',
    badgeBg: 'rgba(217, 119, 6, 0.15)',
    badgeText: '#FBBF24',
    badgeBorder: 'rgba(217, 119, 6, 0.35)',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    gradient: 'from-amber-600 to-amber-700'
  }
};

export const BANNER_PRESETS = [
  {
    id: 'gradient-wolkite',
    name: 'Wolkite Twilight',
    nameAm: 'የወልቂጤ ድምቀት',
    css: 'linear-gradient(135deg, #0A1128 0%, #1E293B 40%, #D97706 100%)'
  },
  {
    id: 'gradient-ethiopia',
    name: 'Abyssinian Tri-Color',
    nameAm: 'ኢትዮጵያዊ ቅልመት',
    css: 'linear-gradient(90deg, #047857 0%, #D97706 50%, #B91C1C 100%)'
  },
  {
    id: 'gradient-scholar',
    name: 'Midnight Scholar',
    nameAm: 'ጥልቅ ምሽት',
    css: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)'
  },
  {
    id: 'gradient-cyber',
    name: 'STEM Aurora',
    nameAm: 'ቴክኖሎጂ ኦሮራ',
    css: 'linear-gradient(135deg, #064E3B 0%, #0F172A 50%, #0E7490 100%)'
  },
  {
    id: 'gradient-gold',
    name: 'Golden Crest',
    nameAm: 'ወርቃማ አክሊል',
    css: 'linear-gradient(135deg, #1C1917 0%, #78350F 50%, #B45309 100%)'
  },
  {
    id: 'gradient-minimal',
    name: 'Deep Minimalist',
    nameAm: 'ቀለል ያለ ጥቁር',
    css: 'linear-gradient(180deg, #111827 0%, #0B0F19 100%)'
  }
];

export function getProfilePreferences(stored?: ProfileCustomizationPreferences | null): ProfileCustomizationPreferences {
  if (!stored) return DEFAULT_PROFILE_PREFERENCES;
  return {
    ...DEFAULT_PROFILE_PREFERENCES,
    ...stored,
    visibleFields: {
      ...DEFAULT_PROFILE_PREFERENCES.visibleFields,
      ...(stored.visibleFields || {})
    },
    sectionVisibility: {
      ...DEFAULT_PROFILE_PREFERENCES.sectionVisibility,
      ...(stored.sectionVisibility || {})
    },
    collapsedSections: {
      ...DEFAULT_PROFILE_PREFERENCES.collapsedSections,
      ...(stored.collapsedSections || {})
    },
    quickActionsVisibility: {
      ...DEFAULT_PROFILE_PREFERENCES.quickActionsVisibility,
      ...(stored.quickActionsVisibility || {})
    },
    sectionOrder: Array.isArray(stored.sectionOrder) && stored.sectionOrder.length > 0 
      ? stored.sectionOrder 
      : DEFAULT_PROFILE_PREFERENCES.sectionOrder,
    quickActionsOrder: Array.isArray(stored.quickActionsOrder) && stored.quickActionsOrder.length > 0
      ? stored.quickActionsOrder
      : DEFAULT_PROFILE_PREFERENCES.quickActionsOrder,
    pinnedModules: Array.isArray(stored.pinnedModules) ? stored.pinnedModules : []
  };
}
