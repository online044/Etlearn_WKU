/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Reusable University Logo Component
 * Renders authentic university logos sourced from Supabase "universities" table,
 * backed by IndexedDB offline storage and vector SVG fallback.
 */

import React, { useState, useEffect } from 'react';
import { getUniversityLogo, UniversityRecord } from '../repositories/universitiesRepository';

export interface UniversityLogoProps {
  university?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
  alt?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 min-w-[24px] min-h-[24px] text-[9px]',
  sm: 'w-8 h-8 min-w-[32px] min-h-[32px] text-[10px]',
  md: 'w-10 h-10 min-w-[40px] min-h-[40px] text-xs',
  lg: 'w-13 h-13 min-w-[52px] min-h-[52px] text-sm',
  xl: 'w-16 h-16 min-w-[64px] min-h-[64px] text-base'
};

const IMG_SIZE_MAP = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-8.5 h-8.5',
  lg: 'w-11 h-11',
  xl: 'w-14 h-14'
};

export default function UniversityLogo({
  university,
  size = 'md',
  className = '',
  showBadge = false,
  alt
}: UniversityLogoProps) {
  const [record, setRecord] = useState<UniversityRecord>(() => getUniversityLogo(university));
  // Fallback stages: 'primary' -> 'fallback' -> 'inline'
  const [stage, setStage] = useState<'primary' | 'fallback' | 'inline'>('primary');

  useEffect(() => {
    setRecord(getUniversityLogo(university));
    setStage('primary');
  }, [university]);

  // Listen for Supabase live sync events
  useEffect(() => {
    const handleSync = () => {
      setRecord(getUniversityLogo(university));
    };
    window.addEventListener('ethiolearn:universities-synced', handleSync);
    return () => window.removeEventListener('ethiolearn:universities-synced', handleSync);
  }, [university]);

  const handleImageError = () => {
    if (stage === 'primary' && record.fallbackSvg && record.logoUrl !== record.fallbackSvg) {
      setStage('fallback');
    } else {
      setStage('inline');
    }
  };

  const currentSrc = stage === 'primary' ? (record.logoUrl || record.fallbackSvg) : record.fallbackSvg;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700/80 shadow-xs transition-transform ${SIZE_MAP[size]} ${className}`}
      title={record.name}
    >
      {stage === 'inline' || !currentSrc ? (
        <svg viewBox="0 0 100 100" className={`object-contain rounded-lg ${IMG_SIZE_MAP[size]}`}>
          <circle cx="50" cy="50" r="46" fill={record.accentColor || '#1E293B'} stroke="#F59E0B" strokeWidth="4" />
          <path d="M50 34 L50 64 M50 38 C42 34 28 36 24 40 L24 66 C28 62 42 60 50 64 C58 60 72 62 76 66 L76 40 C72 36 58 34 50 38 Z" fill="#FFFFFF" opacity="0.95" />
          <text x="50" y="84" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="900" fill="#F59E0B" letterSpacing="1">
            {record.shortName || 'UNI'}
          </text>
        </svg>
      ) : (
        <img
          key={`${record.name}-${stage}-${currentSrc}`}
          src={currentSrc}
          alt={alt || `${record.name} logo`}
          onError={handleImageError}
          referrerPolicy="no-referrer"
          className={`object-contain rounded-lg select-none pointer-events-none transition-opacity duration-200 ${IMG_SIZE_MAP[size]}`}
          loading="lazy"
          decoding="async"
        />
      )}

      {showBadge && record.shortName && (
        <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-md bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-tighter border border-white dark:border-slate-900 shadow">
          {record.shortName}
        </span>
      )}
    </div>
  );
}
