/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google AdSense (Web) & AdMob (Android WebView / Capacitor Bridge) Banner Component
 * Publisher: pub-7081291575190781
 * Web AdSense Client: ca-pub-7081291575190781 | Slot: 6112187514
 * Android AdMob App ID: ca-app-pub-7081291575190781~6693490063 | Unit: ca-app-pub-7081291575190781/6293889020
 */

import React, { useEffect, useRef, useState } from 'react';
import { StudentProfile } from '../types';
import { ADMOB_CONFIG } from '../utils/googleServicesConfig';

export interface GoogleAdBannerProps {
  slotId?: string;
  client?: string;
  admobAppId?: string;
  admobAdUnitId?: string;
  format?: string;
  responsive?: boolean;
  className?: string;
  profile?: StudentProfile | null;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: {
        AdMob?: {
          initialize?: (opts: Record<string, unknown>) => Promise<void>;
          showBanner?: (opts: Record<string, unknown>) => Promise<void>;
          hideBanner?: () => Promise<void>;
          removeBanner?: () => Promise<void>;
        };
      };
    };
    admob?: {
      banner?: {
        config?: (opts: Record<string, unknown>) => void;
        prepare?: () => Promise<void>;
        show?: () => Promise<void>;
        hide?: () => Promise<void>;
      };
    };
    AndroidAdMob?: {
      initialize?: (appId: string) => void;
      showBanner?: (adUnitId: string) => void;
      hideBanner?: () => void;
    };
  }
}

export default function GoogleAdBanner({
  slotId = ADMOB_CONFIG.adsenseBannerSlot,
  client = ADMOB_CONFIG.adsenseClient,
  admobAppId = ADMOB_CONFIG.appId,
  admobAdUnitId = ADMOB_CONFIG.bannerAdUnitId,
  format = 'auto',
  responsive = true,
  className = '',
  profile,
  style = { display: 'block' }
}: GoogleAdBannerProps) {
  const adContainerRef = useRef<HTMLDivElement | null>(null);
  const [adError, setAdError] = useState(false);
  const [isNativeAdActive, setIsNativeAdActive] = useState(false);
  const pushedRef = useRef(false);
  const isPro = Boolean(profile?.isPro);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const capacitorAdMob = window.Capacitor?.Plugins?.AdMob;
    const isNativeCapacitor = Boolean(window.Capacitor?.isNativePlatform?.() && capacitorAdMob);
    const androidBridge = window.AndroidAdMob;
    const cordovaAdMob = window.admob?.banner;

    // 1. Handle Pro users: keep ads hidden across Web & Android bridges
    if (isPro) {
      try {
        capacitorAdMob?.hideBanner?.().catch(() => {});
        cordovaAdMob?.hide?.().catch(() => {});
        androidBridge?.hideBanner?.();
      } catch {}
      return;
    }

    // 2. If running inside an Android Native / Capacitor / Cordova / WebView wrapper
    if (isNativeCapacitor && capacitorAdMob) {
      setIsNativeAdActive(true);
      (async () => {
        try {
          await capacitorAdMob.initialize?.({ initializeForTesting: false });
          await capacitorAdMob.showBanner?.({
            adId: admobAdUnitId,
            adSize: 'ADAPTIVE_BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: false
          });
        } catch {
          setIsNativeAdActive(false);
        }
      })();
      return () => {
        capacitorAdMob.hideBanner?.().catch(() => {});
      };
    }

    if (androidBridge?.showBanner) {
      setIsNativeAdActive(true);
      try {
        androidBridge.initialize?.(admobAppId);
        androidBridge.showBanner(admobAdUnitId);
      } catch {
        setIsNativeAdActive(false);
      }
      return () => {
        try {
          androidBridge.hideBanner?.();
        } catch {}
      };
    }

    if (cordovaAdMob?.show) {
      setIsNativeAdActive(true);
      try {
        cordovaAdMob.config?.({ id: admobAdUnitId, autoShow: true });
        cordovaAdMob.prepare?.().then(() => cordovaAdMob.show?.()).catch(() => {});
      } catch {
        setIsNativeAdActive(false);
      }
      return () => {
        cordovaAdMob.hide?.().catch(() => {});
      };
    }

    // 3. Standard Web / PWA mode: Google AdSense unit
    if (!pushedRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch {
        setAdError(true);
      }
    }
  }, [isPro, admobAppId, admobAdUnitId]);

  if (isPro || adError || isNativeAdActive) {
    return null;
  }

  return (
    <div
      ref={adContainerRef}
      className={`w-full overflow-hidden my-2 flex flex-col items-center justify-center text-center ${className}`}
      aria-label="Advertisement"
      data-admob-app-id={admobAppId}
      data-admob-unit-id={admobAdUnitId}
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
