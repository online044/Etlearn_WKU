import { TelegramWebApp, TelegramUser } from '../types/telegram';

export function getTelegramWebApp(): TelegramWebApp | undefined {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return undefined;
}

export function isTelegramWebApp(): boolean {
  const tg = getTelegramWebApp();
  // Check if WebApp is running inside Telegram context (initData present, platform defined or Telegram Webview)
  return Boolean(tg && (tg.initData || tg.initDataUnsafe?.user || (tg.platform && tg.platform !== 'unknown')));
}

export function getTelegramUser(): TelegramUser | undefined {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user;
}

export function getTelegramPlatform(): string {
  const tg = getTelegramWebApp();
  return tg?.platform || 'web';
}

export function initTelegramWebApp() {
  const tg = getTelegramWebApp();
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();
    
    // Enable swipe-down confirmation so students don't accidentally close an exam or session
    if (typeof tg.enableClosingConfirmation === 'function') {
      tg.enableClosingConfirmation();
    }

    // Set theme colors matching EthioLearn Pro dark aesthetic
    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor('#0a1128');
    }
    if (typeof tg.setBackgroundColor === 'function') {
      tg.setBackgroundColor('#0a1128');
    }

    // Synchronize CSS custom properties with Telegram WebApp Viewport
    const updateViewportCSS = () => {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;
      const vh = tg.viewportHeight || window.innerHeight;
      const svh = tg.viewportStableHeight || vh;
      root.style.setProperty('--tg-viewport-height', `${vh}px`);
      root.style.setProperty('--tg-viewport-stable-height', `${svh}px`);
    };

    updateViewportCSS();
    if (typeof tg.onEvent === 'function') {
      tg.onEvent('viewportChanged', updateViewportCSS);
    }
  } catch (e) {
    console.warn('[Telegram WebApp] Initialization warning:', e);
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light') {
  const tg = getTelegramWebApp();
  if (!tg || !tg.HapticFeedback) return;

  try {
    if (type === 'success' || type === 'warning' || type === 'error') {
      tg.HapticFeedback.notificationOccurred(type);
    } else if (type === 'selection') {
      if (typeof tg.HapticFeedback.selectionChanged === 'function') {
        tg.HapticFeedback.selectionChanged();
      } else {
        tg.HapticFeedback.impactOccurred('light');
      }
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch (e) {
    // Ignore haptic errors gracefully
  }
}

export function setTelegramBackButton(visible: boolean, onClick?: () => void) {
  const tg = getTelegramWebApp();
  if (!tg || !tg.BackButton) return;

  try {
    if (visible) {
      tg.BackButton.show();
      if (onClick) {
        tg.BackButton.onClick(onClick);
      }
    } else {
      tg.BackButton.hide();
    }
  } catch (e) {
    console.warn('[Telegram WebApp] BackButton error:', e);
  }
}

export function openTelegramChannel(url: string = 'https://t.me/Et_Learnn') {
  const tg = getTelegramWebApp();
  if (tg && typeof tg.openTelegramLink === 'function') {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function shareProgressToTelegram(text: string, shareUrl: string = 'https://t.me/Et_Learnn') {
  const tg = getTelegramWebApp();
  const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
  if (tg && typeof tg.openTelegramLink === 'function') {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function closeTelegramWebApp() {
  const tg = getTelegramWebApp();
  if (!tg) return;
  try {
    tg.close();
  } catch (e) {}
}

export async function verifyAndSyncTelegramAuth(initData: string) {
  try {
    const response = await fetch('/api/telegram/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ initData })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to authenticate Telegram Mini App');
    }

    return await response.json();
  } catch (err) {
    console.warn('[Telegram Auth API] Warning during verification:', err);
    return null;
  }
}
