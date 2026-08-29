import { StudentProfile, SubscriptionTier, SubscriptionStatus, PaymentProvider, PaymentRecord, FeatureUsageRecord } from '../types';
import { safeStorage } from './safeStorage';
import { getSupabase, getAuthHeaders } from './supabaseClient';

export const FREE_DAILY_AI_LIMIT = 5;

/**
 * Get current date string formatted as YYYY-MM-DD in EAT (UTC+3)
 */
export function getTodayDateString(): string {
  const now = new Date();
  // Adjust to East Africa Time (UTC+3)
  const eatOffsetMs = 3 * 60 * 60 * 1000;
  const eatDate = new Date(now.getTime() + eatOffsetMs);
  return eatDate.toISOString().split('T')[0];
}

/**
 * Check daily AI Tutor usage count for a user.
 * Resets daily at 00:00.
 */
export function getDailyAIUsageCount(userId?: string): number {
  const today = getTodayDateString();
  const key = `ethiolearn_ai_usage_${today}_${userId || 'guest'}`;
  const stored = safeStorage.getItem(key);
  return stored ? parseInt(stored, 10) : 0;
}

/**
 * Record and increment AI Tutor question usage.
 * Returns updated count.
 */
export function incrementDailyAIUsage(userId?: string): number {
  const today = getTodayDateString();
  const key = `ethiolearn_ai_usage_${today}_${userId || 'guest'}`;
  const current = getDailyAIUsageCount(userId);
  const updated = current + 1;
  safeStorage.setItem(key, String(updated));

  // Sync with Supabase asynchronously if connected
  const client = getSupabase();
  if (client && userId && userId !== 'guest') {
    const resetAt = new Date();
    resetAt.setHours(23, 59, 59, 999);
    
    client.from('feature_usage').upsert({
      user_id: userId,
      feature_type: 'ai_tutor_queries',
      count: updated,
      reset_at: resetAt.toISOString()
    }).then(({ error }) => {
      if (error) console.warn('Supabase feature usage sync failed:', error.message);
    });
  }

  return updated;
}

/**
 * Check if the student has active PRO access or unexpired Exam Season Pass.
 * Gracefully handles expiration (downgrades active pass if end_date < now).
 */
export function checkSubscriptionStatus(profile: StudentProfile): {
  isPro: boolean;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  daysRemaining?: number;
  endDate?: string;
  isExpired: boolean;
} {
  if (!profile) {
    return { isPro: false, tier: 'free', status: 'none', isExpired: false };
  }

  // Check if explicit expiration date exists
  if (profile.proEndDate) {
    const endMs = new Date(profile.proEndDate).getTime();
    const nowMs = Date.now();
    
    if (endMs <= nowMs) {
      // Pass or subscription has expired!
      return {
        isPro: false,
        tier: profile.tier || 'free',
        status: 'expired',
        daysRemaining: 0,
        endDate: profile.proEndDate,
        isExpired: true
      };
    } else {
      const msLeft = endMs - nowMs;
      const daysRemaining = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      return {
        isPro: true,
        tier: profile.tier || 'pro_monthly',
        status: 'active',
        daysRemaining,
        endDate: profile.proEndDate,
        isExpired: false
      };
    }
  }

  // Fallback to legacy profile flags
  if (profile.isPro || profile.proStatus === 'active') {
    return {
      isPro: true,
      tier: profile.tier || 'pro_monthly',
      status: 'active',
      isExpired: false
    };
  }

  if (profile.proStatus === 'pending') {
    return {
      isPro: false,
      tier: profile.tier || 'free',
      status: 'pending',
      isExpired: false
    };
  }

  return {
    isPro: false,
    tier: 'free',
    status: profile.proStatus === 'expired' ? 'expired' : 'none',
    isExpired: profile.proStatus === 'expired'
  };
}

/**
 * Fetch local & Supabase payment history for student
 */
export function getPaymentHistoryLocal(userId?: string): PaymentRecord[] {
  const key = `ethiolearn_payments_${userId || 'guest'}`;
  const stored = safeStorage.getItem(key);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (err) {
    return [];
  }
}

/**
 * Save payment transaction record
 */
export function addPaymentRecordLocal(record: PaymentRecord): void {
  const existing = getPaymentHistoryLocal(record.userId);
  const updated = [record, ...existing.filter(r => r.providerTxnId !== record.providerTxnId)];
  const key = `ethiolearn_payments_${record.userId || 'guest'}`;
  safeStorage.setItem(key, JSON.stringify(updated));

  // Dispatch securely to hardened server payments API
  fetch('/api/payments/submit', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      provider: record.provider,
      providerTxnId: record.providerTxnId,
      senderName: record.senderName,
      senderPhone: record.senderPhone,
      amount: record.amount,
      plan: record.amount >= 200 ? 'pro_monthly' : record.amount >= 100 ? 'exam_season_pass' : 'subject_bundle',
      receiptImage: record.receiptImage
    })
  }).catch((err) => {
    console.warn('[Server Payments Notice]:', err);
  });

  // Sync to Supabase if client available
  const client = getSupabase();
  if (client && record.userId && record.userId !== 'guest') {
    client.from('payments').insert({
      user_id: record.userId,
      amount: record.amount,
      currency: record.currency,
      provider: record.provider,
      provider_transaction_id: record.providerTxnId,
      sender_name: record.senderName,
      sender_phone: record.senderPhone,
      status: record.status
    }).then(({ error }) => {
      if (error) console.warn('Supabase payment insert sync notice:', error.message);
    });
  }
}
