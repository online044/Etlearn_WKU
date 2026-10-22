/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EthioLearn Pro - Student Session & Authentication Audit Tracker
 * Accurately logs, preserves, and syncs student sign-in and sign-out timestamps.
 * Never forgets when students sign in and sign out across local storage and cloud database.
 */

import { safeStorage } from './safeStorage';
import { StudentProfile, AuthSessionRecord, AccountInfo } from '../types';
import { getEthiopianDate } from './ethiopianCalendar';
import { getDb } from './firebaseStore';
import { doc, setDoc } from 'firebase/firestore';

const SESSION_HISTORY_KEY = 'ethiolearn_session_history';
const ACTIVE_SESSION_START_KEY = 'ethiolearn_active_session_start';
const LAST_SIGN_IN_KEY = 'ethiolearn_last_signin';
const LAST_SIGN_OUT_KEY = 'ethiolearn_last_signout';
const LAST_SIGNED_OUT_USER_KEY = 'ethiolearn_last_signed_out_user';

function detectDevice(): string {
  if (typeof window === 'undefined') return 'Server/Unknown';
  const ua = window.navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTelegram = Boolean((window as any).Telegram?.WebApp?.initData);
  if (isTelegram) return 'Telegram WebApp (Mini App)';
  if (isMobile) {
    if (/iPhone|iPad|iPod/i.test(ua)) return 'Mobile (iOS Safari/App)';
    return 'Mobile (Android Web/PWA)';
  }
  if (/Macintosh/i.test(ua)) return 'Desktop (macOS)';
  if (/Windows/i.test(ua)) return 'Desktop (Windows PC)';
  return 'Desktop (Web Browser)';
}

function formatReadableTime(date: Date): string {
  try {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return date.toISOString();
  }
}

/**
 * Retrieve the saved session history logs (sorted descending by timestamp)
 */
export function getSessionHistory(email?: string): AuthSessionRecord[] {
  try {
    const raw = safeStorage.getItem(SESSION_HISTORY_KEY);
    if (!raw) return [];
    const list: AuthSessionRecord[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      return list.filter(r => r.email && r.email.toLowerCase().trim() === cleanEmail);
    }
    return list;
  } catch (err) {
    console.warn('[SessionTracker] Failed to read session history:', err);
    return [];
  }
}

/**
 * Save an auth session event to local storage (maintaining last 100 entries)
 */
function appendSessionRecord(record: AuthSessionRecord): void {
  try {
    const history = getSessionHistory();
    // Avoid duplicate records within 2 seconds
    const isDuplicate = history.length > 0 && 
      history[0].type === record.type && 
      history[0].email.toLowerCase() === record.email.toLowerCase() &&
      Math.abs(new Date(history[0].timestamp).getTime() - new Date(record.timestamp).getTime()) < 2000;

    if (!isDuplicate) {
      const updated = [record, ...history].slice(0, 100);
      safeStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('[SessionTracker] Failed to persist session record:', err);
  }
}

/**
 * Sync session event to Cloud Database (Firebase Firestore)
 */
async function syncSessionToFirestore(record: AuthSessionRecord, profile?: StudentProfile | null): Promise<void> {
  try {
    const db = getDb();
    if (!db) return;

    // 1. Write the discrete session event document
    const sessionDocRef = doc(db, 'auth_sessions', record.id);
    await setDoc(sessionDocRef, {
      ...record,
      createdAt: record.timestamp
    }, { merge: true });

    // 2. Update user profile document with the latest session timestamps
    const userId = record.userId || record.email || (profile && profile.id);
    if (userId) {
      const userDocRef = doc(db, 'users', userId);
      const updates: any = {
        updatedAt: record.timestamp,
        lastActiveAt: record.timestamp
      };

      if (record.type === 'signin') {
        updates.lastSignInAt = record.timestamp;
        updates.lastSignInEthDate = record.ethDate;
        if (profile?.signInCount) {
          updates.signInCount = profile.signInCount;
        }
      } else if (record.type === 'signout') {
        updates.lastSignOutAt = record.timestamp;
        updates.lastSignOutEthDate = record.ethDate;
        if (record.durationMinutes) {
          updates.lastSessionDurationMinutes = record.durationMinutes;
        }
      }

      await setDoc(userDocRef, updates, { merge: true });
    }
  } catch (err) {
    // Non-blocking catch to ensure offline performance
    console.log('[SessionTracker] Cloud sync note (cached/offline):', err);
  }
}

/**
 * Record a student SIGN-IN event
 * Accurately saves login time, increments login count, marks session start, and syncs to cloud.
 */
export async function recordSignIn(
  profile: StudentProfile,
  emailOverride?: string
): Promise<{ record: AuthSessionRecord; updatedProfile: StudentProfile }> {
  const now = new Date();
  const timestamp = now.toISOString();
  const formattedTime = formatReadableTime(now);
  const ethDateObj = getEthiopianDate(now);
  const ethDate = ethDateObj.formatted || `${ethDateObj.monthName} ${ethDateObj.day}, ${ethDateObj.year}`;
  const email = (emailOverride || profile.email || 'scholar@ethiolearn.edu').toLowerCase().trim();
  const name = profile.name || 'Scholar';
  const device = detectDevice();

  const record: AuthSessionRecord = {
    id: `signin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'signin',
    email,
    name,
    userId: profile.id || email,
    timestamp,
    formattedTime,
    ethDate,
    device
  };

  // 1. Mark active session start time in ms
  safeStorage.setItem(ACTIVE_SESSION_START_KEY, String(now.getTime()));
  safeStorage.setItem(LAST_SIGN_IN_KEY, timestamp);

  // 2. Compute updated profile counters
  const currentCount = typeof profile.signInCount === 'number' ? profile.signInCount : 0;
  const updatedProfile: StudentProfile = {
    ...profile,
    lastSignInAt: timestamp,
    firstSignInAt: profile.firstSignInAt || timestamp,
    signInCount: currentCount + 1
  };

  // 3. Persist updated profile in current storage
  safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(updatedProfile));
  safeStorage.setItem('ethiolearn_active_email', email);

  // 4. Update in registered accounts list
  try {
    const rawAccs = safeStorage.getItem('ethiolearn_accounts');
    if (rawAccs) {
      const accs: AccountInfo[] = JSON.parse(rawAccs);
      if (Array.isArray(accs)) {
        const updatedAccs = accs.map(acc => {
          if (acc.email && acc.email.toLowerCase() === email) {
            return {
              ...acc,
              lastSignInAt: timestamp,
              profile: {
                ...acc.profile,
                lastSignInAt: timestamp,
                signInCount: updatedProfile.signInCount
              }
            };
          }
          return acc;
        });
        safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccs));
      }
    }
  } catch (e) {}

  // 5. Append record to history
  appendSessionRecord(record);

  // 6. Asynchronously sync to Firestore
  syncSessionToFirestore(record, updatedProfile);

  return { record, updatedProfile };
}

/**
 * Record a student SIGN-OUT event
 * Accurately saves logout time, computes active session duration, records signout history, and syncs to cloud.
 */
export async function recordSignOut(
  profile?: StudentProfile | null,
  emailOverride?: string
): Promise<AuthSessionRecord> {
  const now = new Date();
  const timestamp = now.toISOString();
  const formattedTime = formatReadableTime(now);
  const ethDateObj = getEthiopianDate(now);
  const ethDate = ethDateObj.formatted || `${ethDateObj.monthName} ${ethDateObj.day}, ${ethDateObj.year}`;
  
  const email = (emailOverride || (profile && profile.email) || safeStorage.getItem('ethiolearn_active_email') || 'scholar@ethiolearn.edu').toLowerCase().trim();
  const name = (profile && profile.name) || 'Scholar';
  const device = detectDevice();

  // Calculate session duration from start
  let durationMinutes = 1;
  const startTimeRaw = safeStorage.getItem(ACTIVE_SESSION_START_KEY);
  if (startTimeRaw) {
    const startMs = Number(startTimeRaw);
    if (!isNaN(startMs) && startMs > 0 && now.getTime() >= startMs) {
      const diffMs = now.getTime() - startMs;
      durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    }
  }

  const record: AuthSessionRecord = {
    id: `signout_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'signout',
    email,
    name,
    userId: (profile && profile.id) || email,
    timestamp,
    formattedTime,
    ethDate,
    device,
    durationMinutes
  };

  // 1. Record last sign out markers
  safeStorage.setItem(LAST_SIGN_OUT_KEY, timestamp);
  safeStorage.removeItem(ACTIVE_SESSION_START_KEY);

  // 2. Remember last signed out user info so signin screen can display welcome back memory
  const lastUserInfo = {
    email,
    name,
    lastSignOutAt: timestamp,
    formattedTime,
    ethDate,
    durationMinutes
  };
  safeStorage.setItem(LAST_SIGNED_OUT_USER_KEY, JSON.stringify(lastUserInfo));

  // 3. Update registered accounts list with lastSignOutAt
  try {
    const rawAccs = safeStorage.getItem('ethiolearn_accounts');
    if (rawAccs) {
      const accs: AccountInfo[] = JSON.parse(rawAccs);
      if (Array.isArray(accs)) {
        const updatedAccs = accs.map(acc => {
          if (acc.email && acc.email.toLowerCase() === email) {
            return {
              ...acc,
              lastSignOutAt: timestamp,
              profile: {
                ...acc.profile,
                lastSignOutAt: timestamp,
                lastSessionDurationMinutes: durationMinutes
              }
            };
          }
          return acc;
        });
        safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccs));
      }
    }
  } catch (e) {}

  // 4. Append record to history
  appendSessionRecord(record);

  // 5. Asynchronously sync to Firestore
  syncSessionToFirestore(record, profile);

  return record;
}

/**
 * Retrieve remembered last signed out user information
 */
export function getLastSignedOutUser(): {
  email: string;
  name: string;
  lastSignOutAt: string;
  formattedTime: string;
  ethDate: string;
  durationMinutes: number;
} | null {
  try {
    const raw = safeStorage.getItem(LAST_SIGNED_OUT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Retrieve last recorded sign-in timestamp
 */
export function getLastSignInTimestamp(): string | null {
  return safeStorage.getItem(LAST_SIGN_IN_KEY);
}

/**
 * Retrieve last recorded sign-out timestamp
 */
export function getLastSignOutTimestamp(): string | null {
  return safeStorage.getItem(LAST_SIGN_OUT_KEY);
}

/**
 * Get active session duration in minutes so far
 */
export function getActiveSessionDurationMinutes(): number {
  try {
    const startRaw = safeStorage.getItem(ACTIVE_SESSION_START_KEY);
    if (!startRaw) return 0;
    const startMs = Number(startRaw);
    if (isNaN(startMs) || startMs <= 0) return 0;
    const diff = Date.now() - startMs;
    return Math.max(0, Math.floor(diff / (1000 * 60)));
  } catch {
    return 0;
  }
}

/**
 * Format duration into user-friendly string (English / Amharic)
 */
export function formatSessionDuration(minutes?: number, lang: 'en' | 'am' = 'en'): string {
  if (!minutes || minutes <= 0) {
    return lang === 'am' ? '1 ደቂቃ' : '1 min';
  }
  if (minutes < 60) {
    return lang === 'am' ? `${minutes} ደቂቃ` : `${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return lang === 'am' ? `${hours} ሰዓት` : `${hours}h`;
  }
  return lang === 'am' 
    ? `${hours} ሰዓት ከ ${remainingMinutes} ደቂቃ` 
    : `${hours}h ${remainingMinutes}m`;
}
