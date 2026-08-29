import { createClient } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';

/**
 * Initialize Supabase Client using exact environment variables as requested.
 * If the environment variables are not supplied or are placeholders, we return null
 * to prevent the application from crashing on startup.
 */
export const supabase = new Proxy({} as any, {
  get(target, prop, receiver) {
    const instance = getSupabase();
    if (!instance) {
      return undefined;
    }
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
}) as any;
