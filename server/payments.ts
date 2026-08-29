/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Server-Side Payment & Subscription Processing
 */

import { Request, Response } from 'express';
import { getSupabaseAdmin } from './security';

// Server-side authoritative pricing catalog in ETB
export const SUBSCRIPTION_PRICING: Record<string, { priceETB: number; durationDays?: number }> = {
  free: { priceETB: 0 },
  pro_monthly: { priceETB: 200, durationDays: 30 },
  exam_season_pass: { priceETB: 100, durationDays: 21 },
  subject_bundle: { priceETB: 80 }
};

export interface PaymentSubmissionPayload {
  tier: 'pro_monthly' | 'exam_season_pass' | 'subject_bundle' | 'free';
  provider: 'telebirr' | 'cbe_birr' | 'chapa' | 'santim_pay' | 'manual';
  provider_transaction_id: string;
  sender_name: string;
  sender_phone?: string;
  receipt_url?: string;
  coupon_code?: string;
  subject_bundle_id?: string;
}

/**
 * Validates and processes a student payment submission
 */
export async function handlePaymentSubmission(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      tier,
      provider,
      provider_transaction_id,
      sender_name,
      sender_phone,
      receipt_url,
      coupon_code,
      subject_bundle_id
    } = req.body as PaymentSubmissionPayload;

    // 1. Validate required fields
    if (!tier || !provider || !provider_transaction_id || !sender_name) {
      return res.status(400).json({
        error: 'Missing required payment fields (tier, provider, provider_transaction_id, sender_name)'
      });
    }

    const validTiers = ['pro_monthly', 'exam_season_pass', 'subject_bundle'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const validProviders = ['telebirr', 'cbe_birr', 'chapa', 'santim_pay', 'manual'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Invalid payment provider' });
    }

    const cleanTxnId = provider_transaction_id.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (cleanTxnId.length < 4) {
      return res.status(400).json({ error: 'Invalid transaction reference ID format' });
    }

    // 2. Server-side authoritative price lookup
    const tierConfig = SUBSCRIPTION_PRICING[tier];
    let finalAmountETB = tierConfig.priceETB;

    const supabase = getSupabaseAdmin();

    // 3. Server-side coupon verification
    let appliedCoupon: any = null;
    if (coupon_code && supabase) {
      try {
        const { data: couponData, error: couponErr } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', coupon_code.toUpperCase().trim())
          .eq('is_active', true)
          .maybeSingle();

        if (!couponErr && couponData) {
          const isExpired = couponData.expires_at && new Date(couponData.expires_at).getTime() < Date.now();
          const isExhausted = couponData.max_uses && couponData.used_count >= couponData.max_uses;

          if (!isExpired && !isExhausted) {
            appliedCoupon = couponData;
            if (couponData.discount_percentage > 0) {
              const discount = (finalAmountETB * couponData.discount_percentage) / 100;
              finalAmountETB = Math.max(0, finalAmountETB - discount);
            } else if (couponData.fixed_discount_etb > 0) {
              finalAmountETB = Math.max(0, finalAmountETB - couponData.fixed_discount_etb);
            }
          }
        }
      } catch (couponException) {
        console.warn('[Payments] Coupon check exception:', couponException);
      }
    }

    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const paymentRecord = {
      id: paymentId,
      user_id: user.email,
      amount: finalAmountETB,
      currency: 'ETB',
      provider,
      provider_transaction_id: cleanTxnId,
      sender_name: sender_name.trim(),
      sender_phone: sender_phone ? sender_phone.trim() : null,
      status: 'pending',
      receipt_url: receipt_url || null,
      raw_webhook_payload: {
        submitted_by: user.email,
        tier,
        subject_bundle_id: subject_bundle_id || null,
        coupon_applied: appliedCoupon ? appliedCoupon.code : null,
        original_price: tierConfig.priceETB,
        final_amount: finalAmountETB,
        timestamp: now
      },
      created_at: now,
      updated_at: now
    };

    if (supabase) {
      const { error: insertErr } = await supabase
        .from('payments')
        .insert(paymentRecord);

      if (insertErr) {
        if (insertErr.code === '23505') { // Unique constraint violation on provider_transaction_id
          return res.status(409).json({
            error: 'This transaction reference number has already been submitted.'
          });
        }
        console.error('[Payments] Supabase payment insert error:', insertErr);
      }

      // Update coupon usage count atomically
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: (appliedCoupon.used_count || 0) + 1 })
          .eq('code', appliedCoupon.code);
      }
    }

    return res.json({
      success: true,
      message: 'Payment receipt submitted successfully and is pending administrator verification.',
      payment: {
        id: paymentId,
        amount: finalAmountETB,
        currency: 'ETB',
        provider,
        status: 'pending',
        tier
      }
    });
  } catch (error: any) {
    console.error('[Payments] Submission exception:', error);
    return res.status(500).json({ error: error.message || 'Internal payment error' });
  }
}

/**
 * Fetch payments belonging strictly to the authenticated student
 */
export async function getStudentPayments(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.email)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return res.json({ success: true, payments: data });
      }
    }

    return res.json({ success: true, payments: [] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

/**
 * Fetch verified subscription and Pro status for the authenticated user
 */
export async function getUserSubscriptionStatus(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const supabase = getSupabaseAdmin();
    let isPro = user.is_pro;
    let tier = isPro ? 'pro_monthly' : 'free';
    let proStatus = isPro ? 'active' : 'none';
    let expiresAt: string | null = null;

    if (supabase) {
      // Check active subscription record
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        if (subData.end_date) {
          const isExpired = new Date(subData.end_date).getTime() < Date.now();
          if (!isExpired && subData.status === 'active') {
            isPro = true;
            tier = subData.tier;
            proStatus = 'active';
            expiresAt = subData.end_date;
          }
        } else if (subData.status === 'active') {
          isPro = true;
          tier = subData.tier;
          proStatus = 'active';
        }
      }
    }

    return res.json({
      success: true,
      isPro,
      tier,
      proStatus,
      expiresAt,
      user_role: user.user_role
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
