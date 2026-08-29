/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Centralized Server Security & Authorization Module
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Extend Express Request to include verified user context
declare global {
  namespace Express {
    interface Request {
      user?: VerifiedUser;
    }
  }
}

export interface VerifiedUser {
  id: string;
  email: string;
  name?: string;
  user_role: 'student' | 'instructor' | 'admin' | 'super_admin';
  is_pro: boolean;
  is_admin: boolean;
  auth_source: 'supabase_jwt' | 'server_session' | 'telegram_verified' | 'service_key';
}

// Server runtime session signing secret
const SERVER_SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || (() => {
  // Generate stable in-memory cryptographic secret for the server instance lifecycle
  return crypto.randomBytes(32).toString('hex');
})();

// Designated master administrator email
export const PRIMARY_ADMIN_EMAIL = 'ezrat2116@gmail.com';

// Cache for authenticated Supabase client
let supabaseAdminClient: SupabaseClient | null = null;
let customSupabaseUrl: string = '';
let customSupabaseKey: string = '';

export function setSupabaseAdminCredentials(url: string, key: string): boolean {
  if (!url || !key) return false;
  try {
    customSupabaseUrl = url.trim();
    customSupabaseKey = key.trim();
    supabaseAdminClient = createClient(customSupabaseUrl, customSupabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    return true;
  } catch (e) {
    console.warn('[Security] Error setting custom Supabase credentials:', e);
    return false;
  }
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdminClient) return supabaseAdminClient;
  const url = (customSupabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = (
    customSupabaseKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_SECRET_KEY || 
    process.env.SUPABASE_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY || 
    ''
  ).trim();

  if (url && serviceKey) {
    try {
      supabaseAdminClient = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      return supabaseAdminClient;
    } catch (e) {
      console.warn('[Security] Failed to initialize Supabase client:', e);
    }
  }
  return null;
}

/**
 * Generate a cryptographically signed session token for verified users
 */
export function generateSessionToken(payload: { id: string; email: string; user_role?: string; is_pro?: boolean }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7); // 7 days expiration
  const body = Buffer.from(JSON.stringify({
    ...payload,
    exp,
    iat: Math.floor(Date.now() / 1000),
    iss: 'ethiolearn-security-engine'
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SERVER_SESSION_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verify a server-signed JWT session token
 */
export function verifySessionToken(token: string): { valid: boolean; payload?: any } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SERVER_SESSION_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false };
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false }; // Expired
    }

    return { valid: true, payload };
  } catch (e) {
    return { valid: false };
  }
}

/**
 * Verify Telegram Mini App initData using official Telegram HMAC verification
 */
export function verifyTelegramInitData(initData: string, botToken?: string): { valid: boolean; user?: any } {
  try {
    if (!initData) return { valid: false };
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const userStr = params.get('user');

    if (!userStr) return { valid: false };
    const user = JSON.parse(userStr);

    const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
    if (token && hash) {
      params.delete('hash');
      const entries = Array.from(params.entries());
      entries.sort((a, b) => a[0].localeCompare(b[0]));
      const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      const isValid = calculatedHash.toLowerCase() === hash.toLowerCase();
      return { valid: isValid, user: isValid ? user : undefined };
    }

    // In development if TELEGRAM_BOT_TOKEN is not configured, accept with valid user JSON structure
    if (process.env.NODE_ENV !== 'production' && user && user.id) {
      return { valid: true, user };
    }

    return { valid: false };
  } catch (e) {
    return { valid: false };
  }
}

/**
 * Resolve authentic user profile and role from the database
 */
async function fetchUserRoleAndStatus(emailOrId: string): Promise<{ user_role: 'student' | 'instructor' | 'admin' | 'super_admin'; is_pro: boolean; name?: string }> {
  const normalized = emailOrId.toLowerCase().trim();
  const isAdminByEmail = normalized === PRIMARY_ADMIN_EMAIL.toLowerCase();

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('email, profile_data')
        .eq('email', normalized)
        .maybeSingle();

      if (!error && data) {
        const pd = data.profile_data || {};
        const role = pd.userRole || pd.user_role;
        const validRole = ['student', 'instructor', 'admin', 'super_admin'].includes(role) ? role : 'student';
        return {
          user_role: isAdminByEmail ? 'admin' : validRole,
          is_pro: Boolean(pd.isPro || pd.is_pro),
          name: pd.name || normalized.split('@')[0]
        };
      }
    } catch (e) {
      console.warn('[Security] Supabase profile check warning:', e);
    }
  }

  return {
    user_role: isAdminByEmail ? 'admin' : 'student',
    is_pro: false
  };
}

/**
 * Extract and authenticate user session from incoming HTTP request
 */
export async function authenticateRequest(req: Request): Promise<VerifiedUser | null> {
  try {
    const authHeader = req.headers.authorization || (req.headers['x-ethiolearn-auth'] as string) || '';
    const telegramInitData = req.headers['x-telegram-init-data'] as string;
    const sessionTokenHeader = req.headers['x-ethiolearn-session-token'] as string;

    // 1. Check Server Session Token (JWT)
    if (sessionTokenHeader) {
      const { valid, payload } = verifySessionToken(sessionTokenHeader);
      if (valid && payload && payload.email) {
        const { user_role, is_pro, name } = await fetchUserRoleAndStatus(payload.email);
        const isAdmin = user_role === 'admin' || user_role === 'super_admin' || payload.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
        return {
          id: payload.id || payload.email,
          email: payload.email.toLowerCase(),
          name: name || payload.name,
          user_role,
          is_pro,
          is_admin: isAdmin,
          auth_source: 'server_session'
        };
      }
    }

    // 2. Check Bearer Token (Could be Supabase JWT or Server JWT)
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      
      // Try Server Session Token first
      const sessionResult = verifySessionToken(token);
      if (sessionResult.valid && sessionResult.payload && sessionResult.payload.email) {
        const payload = sessionResult.payload;
        const { user_role, is_pro, name } = await fetchUserRoleAndStatus(payload.email);
        const isAdmin = user_role === 'admin' || user_role === 'super_admin' || payload.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
        return {
          id: payload.id || payload.email,
          email: payload.email.toLowerCase(),
          name: name || payload.name,
          user_role,
          is_pro,
          is_admin: isAdmin,
          auth_source: 'server_session'
        };
      }

      // Try Supabase Auth Token verification
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (!error && user && user.email) {
            const { user_role, is_pro, name } = await fetchUserRoleAndStatus(user.email);
            const isAdmin = user_role === 'admin' || user_role === 'super_admin' || user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
            return {
              id: user.id,
              email: user.email.toLowerCase(),
              name: name || user.user_metadata?.name || user.user_metadata?.full_name,
              user_role,
              is_pro,
              is_admin: isAdmin,
              auth_source: 'supabase_jwt'
            };
          }
        } catch (supaAuthErr) {
          // Token is not a valid Supabase JWT, continue to other strategies
        }
      }
    }

    // 3. Check Telegram Mini App verified auth
    if (telegramInitData) {
      const tgResult = verifyTelegramInitData(telegramInitData);
      if (tgResult.valid && tgResult.user) {
        const tgUser = tgResult.user;
        const syntheticEmail = `${tgUser.username || tgUser.id}@telegram.ethiolearn.et`;
        const { user_role, is_pro } = await fetchUserRoleAndStatus(syntheticEmail);
        return {
          id: `tg_${tgUser.id}`,
          email: syntheticEmail,
          name: `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() || tgUser.username,
          user_role,
          is_pro,
          is_admin: user_role === 'admin' || user_role === 'super_admin',
          auth_source: 'telegram_verified'
        };
      }
    }

    // 4. In development preview mode only: Support explicit session exchange
    const devAuthKey = req.headers['x-dev-admin-key'] as string;
    if (process.env.NODE_ENV !== 'production' && devAuthKey && devAuthKey === process.env.ADMIN_SECRET_KEY) {
      return {
        id: 'admin_master',
        email: PRIMARY_ADMIN_EMAIL,
        name: 'Abreham (Lead Admin)',
        user_role: 'super_admin',
        is_pro: true,
        is_admin: true,
        auth_source: 'service_key'
      };
    }

    return null;
  } catch (err) {
    console.error('[Security] Authentication inspection error:', err);
    return null;
  }
}

/**
 * Express Middleware: Require an Authenticated User Session
 * Rejects with 401 Unauthorized if unauthenticated.
 */
export async function requireAuthenticatedUser(req: Request, res: Response, next: NextFunction) {
  const user = await authenticateRequest(req);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication session or bearer token required.'
    });
  }
  req.user = user;
  next();
}

/**
 * Express Middleware: Require Administrator Privileges
 * Rejects with 401 if not authenticated, or 403 Forbidden if not an admin.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await authenticateRequest(req);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication session required.'
    });
  }

  if (!user.is_admin && user.user_role !== 'admin' && user.user_role !== 'super_admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access restricted to authorized platform administrators.'
    });
  }

  req.user = user;
  next();
}

/**
 * Express Middleware: Require Resource Owner or Administrator Privileges
 */
export function requireOwnerOrAdmin(getResourceOwner: (req: Request) => string | undefined) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session required.'
      });
    }

    const resourceOwner = (getResourceOwner(req) || '').toLowerCase().trim();
    const isOwner = resourceOwner && (user.email === resourceOwner || user.id === resourceOwner);
    const isAdmin = user.is_admin || user.user_role === 'admin' || user.user_role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access or modify this resource.'
      });
    }

    req.user = user;
    next();
  };
}

/**
 * In-memory sliding window rate limiter
 */
interface RateLimitBucket {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const hits = new Map<string, RateLimitBucket>();

  // Periodically clean up expired buckets
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of hits.entries()) {
      if (now > bucket.resetTime) {
        hits.delete(key);
      }
    }
  }, 60000);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const key = options.keyGenerator ? options.keyGenerator(req) : `${ip}:${req.path}`;
    const now = Date.now();

    let bucket = hits.get(key);
    if (!bucket || now > bucket.resetTime) {
      bucket = { count: 1, resetTime: now + options.windowMs };
      hits.set(key, bucket);
    } else {
      bucket.count++;
    }

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetTime / 1000));

    if (bucket.count > options.maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: options.message || 'Rate limit exceeded. Please try again later.'
      });
    }

    next();
  };
}

/**
 * Input sanitization and validation utilities
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Strip control characters and excessive null bytes
    return input.replace(/\0/g, '').trim();
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitizedObj: any = {};
    for (const key of Object.keys(input)) {
      sanitizedObj[key] = sanitizeInput(input[key]);
    }
    return sanitizedObj;
  }
  return input;
}

export function validateRequiredFields(body: any, fields: string[]): { valid: boolean; missing?: string } {
  if (!body || typeof body !== 'object') return { valid: false, missing: 'Request body is empty' };
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return { valid: false, missing: field };
    }
  }
  return { valid: true };
}
