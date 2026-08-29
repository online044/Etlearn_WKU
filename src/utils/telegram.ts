import { TelegramWebApp, TelegramUser } from '../types/telegram';

export function getTelegramWebApp(): TelegramWebApp | undefined {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return undefined;
}

export function isTelegramWebApp(): boolean {
  const tg = getTelegramWebApp();
  return Boolean(tg && (tg.initData || tg.initDataUnsafe?.user));
}

export function getTelegramUser(): TelegramUser | undefined {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user;
}

export function initTelegramWebApp() {
  const tg = getTelegramWebApp();
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();
    
    // Set theme colors matching EthioLearn Pro dark aesthetic
    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor('#0a1128');
    }
    if (typeof tg.setBackgroundColor === 'function') {
      tg.setBackgroundColor('#0a1128');
    }
  } catch (e) {
    console.warn('[Telegram WebApp] Initialization warning:', e);
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  const tg = getTelegramWebApp();
  if (!tg || !tg.HapticFeedback) return;

  try {
    if (type === 'success' || type === 'warning' || type === 'error') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch (e) {
    // Ignore haptic errors
  }
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
