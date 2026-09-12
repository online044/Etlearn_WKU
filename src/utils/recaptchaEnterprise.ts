/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google reCAPTCHA Enterprise Integration for EthioLearn Pro (Key: Etlearn2)
 */

import { RECAPTCHA_ENTERPRISE_CONFIG } from './googleServicesConfig';

export const RECAPTCHA_SITE_KEY = RECAPTCHA_ENTERPRISE_CONFIG.siteKey; // "6LdZM7ctAAAAAGYxsk7t7gN54l2VOwDfvuLwux23"

declare global {
  interface Window {
    grecaptcha?: {
      enterprise?: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
        render?: (container: string | HTMLElement, parameters: any) => number;
        reset?: (opt_widget_id?: number) => void;
      };
      ready?: (callback: () => void) => void;
      execute?: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/**
 * Check if the reCAPTCHA Enterprise script has initialized on window
 */
export function isRecaptchaEnterpriseAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.grecaptcha && window.grecaptcha.enterprise);
}

/**
 * Execute reCAPTCHA Enterprise action for risk scoring and bot mitigation.
 * @param action Name of the action, e.g. 'LOGIN', 'SIGNUP', 'PHONE_SMS', 'FORGOT_PASSWORD'
 * @returns Promise<string | null> The generated reCAPTCHA token, or null if bypassed/unavailable
 */
export async function executeRecaptchaEnterprise(action: string = 'AUTH_ACTION'): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const grecaptcha = window.grecaptcha?.enterprise || window.grecaptcha;
    if (!grecaptcha) {
      console.warn('[reCAPTCHA Enterprise] SDK not yet loaded, proceeding with graceful fallback.');
      return null;
    }

    return await new Promise<string | null>((resolve) => {
      // Timeout fallback after 3.5 seconds to never freeze the user's interface
      const timer = setTimeout(() => {
        console.warn('[reCAPTCHA Enterprise] Execution timed out, proceeding gracefully.');
        resolve(null);
      }, 3500);

      grecaptcha.ready(async () => {
        try {
          const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
          clearTimeout(timer);
          console.log(`[reCAPTCHA Enterprise] Token acquired for action: ${action}`);
          resolve(token);
        } catch (err) {
          clearTimeout(timer);
          console.warn(`[reCAPTCHA Enterprise] Execution error for action ${action}:`, err);
          resolve(null);
        }
      });
    });
  } catch (err) {
    console.warn('[reCAPTCHA Enterprise] Execution exception:', err);
    return null;
  }
}
