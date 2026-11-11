/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google AdSense Ad Unit Component
 * Client: ca-pub-7081291575190781
 * Slot: 6112187514
 */

import React, { useEffect, useRef, useState } from 'react';
import { StudentProfile } from '../types';

export interface GoogleAdBannerProps {
  slotId?: string;
  client?: string;
  format?: string;
  responsive?: boolean;
  className?: string;
  profile?: StudentProfile | null;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export default function GoogleAdBanner({
  slotId = '6112187514',
  client = 'ca-pub-7081291575190781',
  format = 'auto',
  responsive = true,
  className = '',
  profile,
  style = { display: 'block' }
}: GoogleAdBannerProps) {
  const adContainerRef = useRef<HTMLDivElement | null>(null);
  const [adError, setAdError] = useState(false);
  const pushedRef = useRef(false);

  // If user has active Pro subscription, grant ad-free experience
  if (profile?.isPro) {
    return null;
  }

  useEffect(() => {
    // Only push once per mounted ad unit
    if (!pushedRef.current) {
      try {
        if (typeof window !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushedRef.current = true;
        }
      } catch (err) {
        // Silently catch ad-blocker or duplicate push errors
        setAdError(true);
      }
    }
  }, []);

  if (adError) {
    return null;
  }

  return (
    <div
      ref={adContainerRef}
      className={`w-full overflow-hidden my-2 flex flex-col items-center justify-center text-center ${className}`}
      aria-label="Advertisement"
    >
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
