import { useEffect, useState, useCallback } from 'react';
import { isTelegramWebApp } from './telegram';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const APK_PURE_URL = 'https://apkpure.com/p/com.etlearn.app';
const APP_DOWNLOADED_KEY = 'ethiolearn_app_downloaded';

export function getHasDownloadedApp(): boolean {
  try {
    return typeof window !== 'undefined' && localStorage.getItem(APP_DOWNLOADED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function recordAppDownload(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(APP_DOWNLOADED_KEY, 'true');
      window.dispatchEvent(new CustomEvent('ethiolearn:app-downloaded'));
    }
  } catch (e) {
    console.warn('[App Download Tracking Error]:', e);
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isTMA, setIsTMA] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState<boolean>(() => getHasDownloadedApp());

  useEffect(() => {
    // Check if running inside Telegram Mini App
    const tma = isTelegramWebApp();
    setIsTMA(tma);

    // Detect standalone mode (already installed as PWA or native app wrapper)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone || tma);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      recordAppDownload();
      setHasDownloaded(true);
    };

    const handleAppDownloadedEvent = () => {
      setHasDownloaded(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('ethiolearn:app-downloaded', handleAppDownloadedEvent);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('ethiolearn:app-downloaded', handleAppDownloadedEvent);
    };
  }, []);

  const downloadAndInstall = useCallback(async () => {
    // 1. Mark as downloaded so install button disappears immediately
    recordAppDownload();
    setHasDownloaded(true);

    // 2. Open APKPure download link
    window.open(APK_PURE_URL, '_blank', 'noopener,noreferrer');

    // 3. Trigger native PWA install prompt if available on browser
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (e) {
        console.warn('[PWA Install Prompt error]:', e);
      }
    }
  }, [deferredPrompt]);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        recordAppDownload();
        setHasDownloaded(true);
        return true;
      }
    } catch (e) {
      console.warn('[PWA Install Prompt error]:', e);
    }
    return false;
  };

  // Accessible strictly on web version and hidden once downloaded or installed
  const isWebVersion = !isInstalled && !isTMA;
  const isInstallVisible = isWebVersion && !hasDownloaded;

  return {
    isInstallable: !!deferredPrompt,
    isInstalled: isInstalled || isTMA,
    isIOS,
    isTMA,
    hasDownloaded,
    isWebVersion,
    isInstallVisible,
    downloadAndInstall,
    install,
    apkPureUrl: APK_PURE_URL,
  };
}
