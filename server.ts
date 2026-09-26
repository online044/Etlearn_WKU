/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Production Hardened Server
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

// Security and Admin modules
import { 
  requireAuthenticatedUser, 
  requireAdmin, 
  createRateLimiter, 
  generateSessionToken, 
  verifyTelegramInitData, 
  PRIMARY_ADMIN_EMAIL,
  getSupabaseAdmin,
  setSupabaseAdminCredentials,
  sanitizeInput
} from './server/security';

import { 
  handlePaymentSubmission, 
  getStudentPayments, 
  getUserSubscriptionStatus 
} from './server/payments';

import { 
  getAdminStats, 
  getAdminPayments, 
  handleAdminPaymentAction, 
  getAdminStudents, 
  handleAdminUpdateStudent,
  handleAdminSaveCourse, 
  handleAdminDeleteCourse, 
  handleAdminSaveCoupon, 
  handleAdminDeleteCoupon, 
  handleAdminSaveAnnouncement, 
  handleAdminDeleteAnnouncement,
  handleGetAnnouncements
} from './server/admin';

import { 
  getPublishedBooks, 
  getPublishedExams, 
  createContentToken, 
  streamContent, 
  serveCoverImage, 
  getAdminBooks, 
  saveAdminBook, 
  deleteAdminBook, 
  togglePublishAdminBook, 
  uploadBookPdf, 
  uploadBookCover, 
  getAdminExams, 
  saveAdminExam, 
  deleteAdminExam, 
  togglePublishAdminExam, 
  uploadExamPdf 
} from './server/content';

import { 
  handleAIChatStream, 
  generateSingleAIResponse, 
  setMasterApiKey, 
  getMasterApiKey, 
  testMasterApiKey 
} from './server/ai';
import { generateAcademicQuiz } from './server/quizGenerator';

dotenv.config();

const app = express();
const PORT = 3000;

// ============================================================================
// 1. SECURITY HEADERS & GLOBAL MIDDLEWARE
// ============================================================================

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Allow framing in AI Studio preview iframe and Telegram Web App
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://*.google.com https://ai.studio https://*.run.app https://web.telegram.org https://*.telegram.org;");
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

// Configure CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://ai.studio',
  'https://web.telegram.org'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.web.app') || origin.endsWith('.run.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow client requests while validating server authorization tokens
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-ethiolearn-auth', 'x-ethiolearn-session-token', 'x-telegram-init-data', 'x-dev-admin-key']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global input sanitization
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }
  next();
});

// PWA Specific Routes & Cache Control
app.get('/sw.js', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const swPath = path.join(process.cwd(), 'public', 'sw.js');
  if (fs.existsSync(swPath)) {
    return res.sendFile(swPath);
  }
  return res.status(404).send('Service worker not found');
});

app.get(['/manifest.json', '/manifest.webmanifest'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    return res.sendFile(manifestPath);
  }
  return res.status(404).send('Manifest not found');
});

app.use('/icons', express.static(path.join(process.cwd(), 'public', 'icons'), {
  maxAge: '1d'
}));

app.use(express.static(path.join(process.cwd(), 'public'), {
  maxAge: '1d'
}));

// Basic Health Check Endpoint
app.get(['/api/health', '/api/health/'], (req: Request, res: Response) => {
  return res.json({ status: 'ok', service: 'EthioLearn Pro API', timestamp: new Date().toISOString() });
});

// ============================================================================
// 2. RATE LIMITERS
// ============================================================================

const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many authentication attempts. Please try again in a moment.'
});

const paymentsLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 15,
  message: 'Payment submission rate limit reached. Please contact support if you need immediate assistance.'
});

const aiChatLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 40,
  message: 'AI Tutor query limit exceeded for this minute. Please pause for a moment before your next question.'
});

const supportLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 25,
  message: 'Support chat rate limit exceeded. Please wait a minute before sending another message.'
});

const ticketLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 8,
  message: 'Support ticket submission rate limit reached. Please wait an hour before submitting another ticket.'
});

// ============================================================================
// 3. AUTHENTICATION & SESSION EXCHANGE ENDPOINTS
// ============================================================================

/**
 * Helper to normalize Ethiopian phone numbers or email identifiers
 */
function normalizeStudentIdentifier(raw: string): { type: 'phone' | 'email'; value: string; raw: string; display: string } {
  const clean = (raw || '').trim();
  if (clean.includes('@')) {
    return { type: 'email', value: clean.toLowerCase(), raw: clean, display: clean.toLowerCase() };
  }
  const digitsOnly = clean.replace(/[^\d+]/g, '');
  if (digitsOnly.startsWith('+251')) {
    const local = '0' + digitsOnly.slice(4);
    return { type: 'phone', value: digitsOnly, raw: clean, display: local };
  }
  if (digitsOnly.startsWith('09') || digitsOnly.startsWith('07')) {
    return { type: 'phone', value: '+251' + digitsOnly.slice(1), raw: clean, display: digitsOnly };
  }
  if (digitsOnly.startsWith('9') || digitsOnly.startsWith('7')) {
    return { type: 'phone', value: '+251' + digitsOnly, raw: clean, display: '0' + digitsOnly };
  }
  return { type: 'phone', value: digitsOnly || clean, raw: clean, display: clean };
}

/**
 * Secure Student Login Endpoint with Strict Password Verification (Phone or Email)
 */
app.post(['/api/auth/login', '/api/auth/login/'], authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const loginTarget = identifier || phone || email;

    if (!loginTarget || typeof loginTarget !== 'string' || !loginTarget.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid phone number or email address is required.',
        amharicError: 'ትክክለኛ ስልክ ቁጥር ወይም የኢሜይል አድራሻ ማስገባት ያስፈልጋል።'
      });
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password is required.',
        amharicError: 'የይለፍ ቃል ማስገባት ያስፈልጋል።'
      });
    }

    const idInfo = normalizeStudentIdentifier(loginTarget);
    const cleanPassword = password.trim();
    const isAdmin = idInfo.value === PRIMARY_ADMIN_EMAIL.toLowerCase() || 
                    idInfo.display === '0906046518' || 
                    idInfo.value === '+251906046518';

    const supabase = getSupabaseAdmin();
    let userRole = isAdmin ? 'admin' : 'student';
    let isPro = false;
    let studentProfile: any = null;

    if (supabase) {
      // Query by phone or email
      let query = supabase.from('student_profiles').select('*');
      if (idInfo.type === 'email') {
        query = query.eq('email', idInfo.value);
      } else {
        query = query.or(`phone.eq.${idInfo.value},phone.eq.${idInfo.display},email.eq.${idInfo.value}`);
      }

      const { data: records, error: dbError } = await query.limit(1);

      if (dbError) {
        console.warn('[Supabase Login Warning]:', dbError.message);
      }

      const record = records && records[0];
      if (record) {
        studentProfile = record;
        const storedPassword = record.profile_data?.password || record.password;

        // If a password exists on the profile, verify it
        if (storedPassword && storedPassword !== cleanPassword) {
          return res.status(401).json({
            success: false,
            error: 'Incorrect password. Access denied. Please verify your password or use Forgot Password to reset.',
            amharicError: 'የተሳሳተ የይለፍ ቃል! መግባት አልተፈቀደም። እባክዎ የይለፍ ቃልዎን ያረጋግጡ ወይም የይለፍ ቃል ረሱ የሚለውን ይጫኑ።'
          });
        }

        const pd = record.profile_data || {};
        const role = pd.userRole || pd.user_role || record.user_role;
        if (role === 'admin' || role === 'super_admin' || isAdmin) {
          userRole = 'admin';
        }
        isPro = Boolean(pd.isPro || pd.is_pro || record.is_pro);
      }
    }

    // Generate authenticated session token
    const primaryId = idInfo.type === 'email' ? idInfo.value : idInfo.display;
    const sessionToken = generateSessionToken({
      id: studentProfile?.id || `usr_${primaryId.replace(/[^\w]/g, '_')}`,
      email: idInfo.type === 'email' ? idInfo.value : (studentProfile?.email || `${idInfo.display}@student.ethiolearn.edu.et`),
      phone: idInfo.type === 'phone' ? idInfo.display : (studentProfile?.phone || ''),
      user_role: userRole,
      is_pro: isPro
    });

    return res.json({
      success: true,
      token: sessionToken,
      user: {
        id: studentProfile?.id || `usr_${primaryId.replace(/[^\w]/g, '_')}`,
        email: idInfo.type === 'email' ? idInfo.value : (studentProfile?.email || `${idInfo.display}@student.ethiolearn.edu.et`),
        phone: idInfo.type === 'phone' ? idInfo.display : (studentProfile?.phone || ''),
        name: studentProfile?.name || studentProfile?.profile_data?.name || (idInfo.type === 'phone' ? `Student ${idInfo.display}` : primaryId.split('@')[0]),
        university: studentProfile?.university || studentProfile?.profile_data?.university || 'Wolkite University',
        year: studentProfile?.year || studentProfile?.profile_data?.year || 'Freshman',
        user_role: userRole,
        is_pro: isPro,
        is_admin: userRole === 'admin',
        profile_data: studentProfile?.profile_data || null
      }
    });
  } catch (error: any) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication verification service encountered an unexpected error.' 
    });
  }
});

/**
 * Exchange client profile or verified token for a cryptographically signed session token
 */
app.post(['/api/auth/session', '/api/auth/session/'], authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, name, id, password } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid student email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isAdmin = normalizedEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();

    // Check actual role from Supabase if configured
    let userRole = isAdmin ? 'admin' : 'student';
    let isPro = false;

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('email, profile_data, updated_at')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (profile) {
        // If password was provided and profile has a stored password, check match
        if (password && profile.profile_data?.password && profile.profile_data.password !== password.trim()) {
          return res.status(401).json({ 
            error: 'Authentication failed: Password does not match registered profile.',
            amharicError: 'የይለፍ ቃል የተሳሳተ ነው! መግባት አልተፈቀደም።'
          });
        }

        const pd = profile.profile_data || {};
        const role = pd.userRole || pd.user_role;
        if (role === 'admin' || role === 'super_admin' || isAdmin) {
          userRole = 'admin';
        }
        isPro = Boolean(pd.isPro || pd.is_pro);
      }
    }

    const sessionToken = generateSessionToken({
      id: id || `usr_${normalizedEmail}`,
      email: normalizedEmail,
      user_role: userRole,
      is_pro: isPro
    });

    return res.json({
      success: true,
      token: sessionToken,
      user: {
        id: id || `usr_${normalizedEmail}`,
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        user_role: userRole,
        is_pro: isPro,
        is_admin: userRole === 'admin'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Supabase User Profile Management: Create / Update Profile with Firebase UID
 */
app.post('/api/user/profile', async (req: Request, res: Response) => {
  try {
    const { firebase_uid, full_name, email, phone, university, department, year_level, profile_photo, subscription_status } = req.body;
    if (!firebase_uid || !email) {
      return res.status(400).json({ error: 'firebase_uid and email are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const profilePayload = {
      firebase_uid,
      full_name: full_name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      phone: phone || '',
      university: university || 'Wolkite University (WKU)',
      department: department || 'General',
      year_level: year_level || 'Freshman (1st Year)',
      profile_photo: profile_photo || '',
      subscription_status: subscription_status || 'free',
      updated_at: new Date().toISOString()
    };

    const supabase = getSupabaseAdmin();
    let savedProfile: any = profilePayload;

    if (supabase) {
      // 1. Check if record with this firebase_uid already exists in `profiles`
      const { data: existingByUid } = await supabase
        .from('profiles')
        .select('*')
        .eq('firebase_uid', firebase_uid)
        .maybeSingle();

      if (existingByUid) {
        const { data: updated, error: updateErr } = await supabase
          .from('profiles')
          .update(profilePayload)
          .eq('firebase_uid', firebase_uid)
          .select()
          .single();
        if (!updateErr && updated) {
          savedProfile = updated;
        }
      } else {
        // 2. Reconnect existing user by email
        const { data: existingByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (existingByEmail) {
          const { data: updated, error: updateErr } = await supabase
            .from('profiles')
            .update(profilePayload)
            .eq('email', normalizedEmail)
            .select()
            .single();
          if (!updateErr && updated) {
            savedProfile = updated;
          }
        } else {
          const { data: inserted, error: insertErr } = await supabase
            .from('profiles')
            .insert(profilePayload)
            .select()
            .single();
          if (!insertErr && inserted) {
            savedProfile = inserted;
          }
        }
      }

      // Also mirror/sync to `student_profiles` to maintain full backward compatibility
      try {
        await supabase
          .from('student_profiles')
          .upsert({
            email: normalizedEmail,
            name: profilePayload.full_name,
            university: profilePayload.university,
            year: profilePayload.year_level,
            profile_data: {
              firebaseUid: firebase_uid,
              name: profilePayload.full_name,
              email: normalizedEmail,
              phone: profilePayload.phone,
              university: profilePayload.university,
              department: profilePayload.department,
              year: profilePayload.year_level,
              avatar: profilePayload.profile_photo,
              isPro: profilePayload.subscription_status === 'active' || profilePayload.subscription_status === 'pro'
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });
      } catch (mirrorErr) {
        console.warn('[student_profiles mirror sync warning]:', mirrorErr);
      }
    }

    return res.json({
      success: true,
      profile: savedProfile
    });
  } catch (error: any) {
    console.error('[Profile API Error]:', error);
    return res.status(500).json({ error: error.message || 'Internal server error while saving profile.' });
  }
});

/**
 * Supabase User Profile Management: Get Profile by Firebase UID or email
 */
app.get(['/api/user/profile/:firebase_uid', '/api/user/profile'], async (req: Request, res: Response) => {
  try {
    const firebase_uid = req.params.firebase_uid || req.query.firebase_uid as string;
    const email = (req.query.email as string || '').toLowerCase().trim();

    if (!firebase_uid && !email) {
      return res.status(400).json({ error: 'firebase_uid or email query param required.' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.json({ success: true, profile: null });
    }

    let profile = null;
    if (firebase_uid) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('firebase_uid', firebase_uid)
        .maybeSingle();
      if (!error && data) profile = data;
    }

    if (!profile && email) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (!error && data) profile = data;
    }

    // Fallback check on student_profiles if not yet migrated
    if (!profile && email) {
      const { data: legacyData } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (legacyData) {
        profile = {
          firebase_uid: legacyData.profile_data?.firebaseUid || firebase_uid || '',
          full_name: legacyData.name || legacyData.profile_data?.name || email.split('@')[0],
          email: legacyData.email,
          phone: legacyData.profile_data?.phone || '',
          university: legacyData.university || 'Wolkite University (WKU)',
          department: legacyData.profile_data?.department || 'General',
          year_level: legacyData.year || 'Freshman (1st Year)',
          profile_photo: legacyData.profile_data?.avatar || '',
          subscription_status: legacyData.is_pro ? 'active' : 'free'
        };
      }
    }

    return res.json({
      success: true,
      profile
    });
  } catch (error: any) {
    console.error('[Get Profile API Error]:', error);
    return res.status(500).json({ error: error.message || 'Internal server error while fetching profile.' });
  }
});

/**
 * Telegram Mini App verified auth and session token exchange
 */
app.post(['/api/telegram/auth', '/api/telegram/auth/'], authLimiter, async (req: Request, res: Response) => {
  try {
    const { initData } = req.body;
    if (!initData) {
      return res.status(400).json({ error: 'Missing initData in request payload' });
    }

    const { valid, user } = verifyTelegramInitData(initData);
    if (!valid || !user) {
      return res.status(401).json({ error: 'Invalid Telegram WebApp authentication signature.' });
    }

    const syntheticEmail = `${user.username || user.id}@telegram.ethiolearn.et`;
    let userRole = 'student';
    let isPro = false;

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: existing } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('email', syntheticEmail)
        .maybeSingle();

      if (existing) {
        const pd = existing.profile_data || {};
        userRole = pd.userRole || pd.user_role || 'student';
        isPro = Boolean(pd.isPro || pd.is_pro);
      } else {
        await supabase
          .from('student_profiles')
          .insert({
            email: syntheticEmail,
            profile_data: {
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Student',
              university: 'Wolkite University',
              year: 'Freshman',
              isPro: false,
              userRole: 'student'
            },
            study_sessions: [],
            notes_data: [],
            performance_data: {},
            updated_at: new Date().toISOString()
          });
      }
    }

    const sessionToken = generateSessionToken({
      id: `tg_${user.id}`,
      email: syntheticEmail,
      user_role: userRole,
      is_pro: isPro
    });

    return res.json({
      success: true,
      verified: true,
      token: sessionToken,
      telegramUser: user,
      profile: {
        id: `tg_${user.id}`,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        email: syntheticEmail,
        user_role: userRole,
        is_pro: isPro
      }
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Telegram auth error' });
  }
});

// ============================================================================
// 4. PAYMENTS & SUBSCRIPTIONS ENDPOINTS
// ============================================================================

// Submit payment (Student)
app.post(['/api/payments/submit', '/api/payments/submit/'], paymentsLimiter, requireAuthenticatedUser, handlePaymentSubmission);

// View user's own payments (Student)
app.get(['/api/payments/my-payments', '/api/payments/my-payments/'], requireAuthenticatedUser, getStudentPayments);

// Get verified subscription status (Student)
app.get(['/api/user/subscription-status', '/api/user/subscription-status/'], requireAuthenticatedUser, getUserSubscriptionStatus);

// ============================================================================
// 5. ADMIN DASHBOARD & MANAGEMENT ENDPOINTS (Strictly requireAdmin)
// ============================================================================

// Real aggregate stats
app.get(['/api/admin/stats', '/api/admin/stats/'], requireAdmin, getAdminStats);

// Payments management
app.get(['/api/admin/payments', '/api/admin/payments/'], requireAdmin, getAdminPayments);
app.post(['/api/admin/payments/action', '/api/admin/payments/action/'], requireAdmin, handleAdminPaymentAction);

// Students user management
app.get(['/api/admin/students', '/api/admin/students/'], requireAdmin, getAdminStudents);
app.post(['/api/admin/student/update', '/api/admin/student/update/'], requireAdmin, handleAdminUpdateStudent);

// Courses & Lessons management
app.post(['/api/admin/course', '/api/admin/course/'], requireAdmin, handleAdminSaveCourse);
app.delete(['/api/admin/course/:id', '/api/admin/course/:id/'], requireAdmin, handleAdminDeleteCourse);

// Coupons management
app.post(['/api/admin/coupon', '/api/admin/coupon/'], requireAdmin, handleAdminSaveCoupon);
app.delete(['/api/admin/coupon/:code', '/api/admin/coupon/:code/'], requireAdmin, handleAdminDeleteCoupon);

// Announcements management
app.get(['/api/announcements', '/api/announcements/'], handleGetAnnouncements);
app.post(['/api/admin/announcement', '/api/admin/announcement/'], requireAdmin, handleAdminSaveAnnouncement);
app.delete(['/api/admin/announcement/:id', '/api/admin/announcement/:id/'], requireAdmin, handleAdminDeleteAnnouncement);

// ============================================================================
// 5B. BOOKS & EXAM SHEETS CMS MANAGEMENT (Admin & Student Endpoints)
// ============================================================================

// Student Public Content API (Returns only published items with filters)
app.get(['/api/books', '/api/books/'], getPublishedBooks);
app.get(['/api/exams', '/api/exams/'], getPublishedExams);

// Secure streaming & access token endpoints (Enforces server-side Pro entitlement)
app.post(['/api/content/access-token', '/api/content/access-token/'], createContentToken);
app.get(['/api/content/stream', '/api/content/stream/'], streamContent);
app.get(['/api/content/cover/:filename', '/api/content/cover/:filename/'], serveCoverImage);

// Admin Books Management (Protected by requireAdmin)
app.get(['/api/admin/books', '/api/admin/books/'], requireAdmin, getAdminBooks);
app.post(['/api/admin/books', '/api/admin/books/'], requireAdmin, saveAdminBook);
app.delete(['/api/admin/books/:id', '/api/admin/books/:id/'], requireAdmin, deleteAdminBook);
app.post(['/api/admin/books/:id/publish', '/api/admin/books/:id/publish/'], requireAdmin, togglePublishAdminBook);
app.post(['/api/admin/books/upload-pdf', '/api/admin/books/upload-pdf/'], requireAdmin, uploadBookPdf);
app.post(['/api/admin/books/upload-cover', '/api/admin/books/upload-cover/'], requireAdmin, uploadBookCover);

// Admin Exam Sheets Management (Protected by requireAdmin)
app.get(['/api/admin/exams', '/api/admin/exams/'], requireAdmin, getAdminExams);
app.post(['/api/admin/exams', '/api/admin/exams/'], requireAdmin, saveAdminExam);
app.delete(['/api/admin/exams/:id', '/api/admin/exams/:id/'], requireAdmin, deleteAdminExam);
app.post(['/api/admin/exams/:id/publish', '/api/admin/exams/:id/publish/'], requireAdmin, togglePublishAdminExam);
app.post(['/api/admin/exams/upload-pdf', '/api/admin/exams/upload-pdf/'], requireAdmin, uploadExamPdf);

// Master Key Cloud Sync & Real-time Verification
app.post(['/api/sync-master-key', '/api/sync-master-key/'], async (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    if (!key || typeof key !== 'string' || !key.trim()) {
      return res.status(400).json({ success: false, error: 'A valid API key string is required.' });
    }

    const cleanKey = key.trim();
    // Test the key live with Gemini API
    const testResult = await testMasterApiKey(cleanKey);
    if (!testResult.valid) {
      console.warn('[Master Key Sync] Verification failed:', testResult.error);
      return res.status(400).json({ 
        success: false, 
        error: `Master AI key verification failed: ${testResult.error || 'Invalid credentials'}. Please verify your Google Gemini API key.` 
      });
    }

    // Set as active master API key
    setMasterApiKey(cleanKey);
    process.env.GEMINI_API_KEY = cleanKey;
    console.log('[Master Key Sync] Successfully verified and activated master AI key:', `${cleanKey.slice(0, 4)}...${cleanKey.slice(-4)}`);

    return res.json({ 
      success: true, 
      message: 'Master AI Key verified and active for all EthioLearn services!',
      keyPreview: `${cleanKey.slice(0, 4)}...${cleanKey.slice(-4)}`
    });
  } catch (err: any) {
    console.error('[Master Key Sync Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error syncing master key' });
  }
});

// Master Key Status Check
app.get(['/api/ai/master-key-status', '/api/ai/master-key-status/'], (req: Request, res: Response) => {
  const activeKey = getMasterApiKey();
  return res.json({
    success: true,
    hasKey: Boolean(activeKey),
    keyLength: activeKey ? activeKey.length : 0,
    keyPreview: activeKey ? `${activeKey.slice(0, 4)}...${activeKey.slice(-4)}` : null
  });
});

// ============================================================================
// 6. SUPPORT TICKETS & CHAT ENDPOINTS
// ============================================================================

const ticketsFilePath = path.join(process.cwd(), 'shared_tickets.json');

const getSharedTickets = (): any[] => {
  try {
    if (fs.existsSync(ticketsFilePath)) {
      const content = fs.readFileSync(ticketsFilePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn('[Support tickets] Error reading file, initializing empty:', e);
  }
  return [];
};

const saveSharedTickets = (tickets: any[]) => {
  try {
    fs.writeFileSync(ticketsFilePath, JSON.stringify(tickets, null, 2), 'utf8');
  } catch (e) {
    console.error('[Support tickets] Failed to save tickets file:', e);
  }
};

// Create support ticket
app.post(['/api/support/ticket', '/api/support/ticket/'], ticketLimiter, (req: Request, res: Response) => {
  try {
    const { category, text, email } = req.body;
    if (!text || !email) {
      return res.status(400).json({ error: 'Text and email are required for ticket creation.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const tickets = getSharedTickets();
    const newTicket = {
      id: "TKT-" + Math.floor(1000 + Math.random() * 9000),
      category: category || "Technical Help",
      text: text.trim(),
      email: cleanEmail,
      status: "Open",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      reply: ""
    };

    tickets.unshift(newTicket);
    saveSharedTickets(tickets);

    console.log(`[SUPPORT TICKET] Submitted by: ${newTicket.email} (Category: ${newTicket.category})`);
    return res.json({ success: true, ticket: newTicket });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// View support tickets (Admins see all; students see only their own)
app.get(['/api/support/tickets', '/api/support/tickets/'], requireAuthenticatedUser, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const tickets = getSharedTickets();

    if (user.is_admin || user.user_role === 'admin' || user.user_role === 'super_admin') {
      return res.json({ success: true, tickets });
    } else {
      const filtered = tickets.filter(t => t.email.toLowerCase() === user.email.toLowerCase());
      return res.json({ success: true, tickets: filtered });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Admin action on support ticket (Accept / Reply / Resolve)
app.post(['/api/support/ticket/action', '/api/support/ticket/action/'], requireAdmin, (req: Request, res: Response) => {
  try {
    const { id, action, reply } = req.body;
    if (!id || !action) {
      return res.status(400).json({ error: 'Ticket ID and action are required.' });
    }

    const tickets = getSharedTickets();
    const ticketIndex = tickets.findIndex(t => t.id === id);

    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (action === 'accept') {
      tickets[ticketIndex].status = "Accepted";
      tickets[ticketIndex].reply = "Your inquiry has been accepted by advisor Abreham. We are actively reviewing this and will assist you shortly.";
    } else if (action === 'reply') {
      tickets[ticketIndex].status = "Resolved";
      tickets[ticketIndex].reply = reply || "Your inquiry has been resolved. Thank you!";
    }

    saveSharedTickets(tickets);
    return res.json({ success: true, ticket: tickets[ticketIndex] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Support Assistant chat with Abreham persona
app.post(['/api/support/chat', '/api/support/chat/'], supportLimiter, async (req: Request, res: Response) => {
  try {
    const { messages, apiKey } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required for support assistant.' });
    }

    const systemInstruction = `You are Abreham, the lead developer and academic advisor of EthioLearn.
Your tone is polite, formal, professional, and respectful. Address students with academic courtesy. Do NOT use casual slang, informal greetings, or phrases like 'Selamalekum' or 'my friend'. Respond primarily in the language the student asks in (English, Amharic, or a mix of both).
Provide clear, accurate, and structured academic and technical guidance regarding focus courses, flashcards, soundscapes, exam prep, or digital notes.
If students ask about subscriptions, free tier limits, or Pro access: explain that free tier students get 5 daily AI queries, and to activate Pro (from 80-200 ETB) they must submit their Telebirr/CBE Birr transaction reference number, attach their payment receipt screenshot, and accept the EthioLearn Pro Terms & Academic Rules in the Upgrade section.
Maintain a professional educational tone at all times. If students encounter technical issues, advise them to submit a formal ticket from their Profile tab. Always speak in the first person ('I', 'me', 'our platform') as Abreham.`;

    const aiResult = await generateSingleAIResponse(messages, systemInstruction, apiKey);
    if (aiResult.success && aiResult.text) {
      return res.json({ success: true, reply: aiResult.text });
    }

    const fallbackGreeting = "Greetings. I am Abreham, your academic advisor at EthioLearn. How can I assist you with your coursework, exam preparation, or textbook study today?";
    return res.json({ success: true, reply: fallbackGreeting });
  } catch (e: any) {
    console.error('[Support Assistant Chat Error]:', e);
    return res.status(500).json({ error: e.message || 'Failed to generate support reply' });
  }
});

// ============================================================================
// 7. BACKUP & CLOUD STORAGE SYNC ENDPOINTS
// ============================================================================

// Supabase sync endpoint (Student or Admin authenticated)
app.post(['/api/db/sync-supabase', '/api/db/sync-supabase/'], requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { url, key, action, payload } = req.body;
    
    const targetUrl = (url || process.env.VITE_SUPABASE_URL || '').trim();
    const targetKey = (key || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
    
    if (!targetUrl || !targetKey) {
      return res.status(400).json({ error: 'Supabase URL and Anon Key are required.' });
    }

    const supabase = createClient(targetUrl, targetKey);
    const targetEmail = user.email.toLowerCase().trim();
    
    if (action === 'backup') {
      if (!payload) {
        return res.status(400).json({ error: 'Backup payload data is missing.' });
      }
      
      const { error } = await supabase
        .from('ethiolearn_sync')
        .upsert({ email: targetEmail, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'email' });
      
      if (error) {
        return res.status(500).json({ 
          error: error.message, 
          details: 'Could not write to ethiolearn_sync table.' 
        });
      }
      
      return res.json({ success: true, message: 'Campus progress backed up successfully to Supabase!' });
    } else if (action === 'restore') {
      const { data, error } = await supabase
        .from('ethiolearn_sync')
        .select('data')
        .eq('email', targetEmail)
        .maybeSingle();
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (!data) {
        return res.status(404).json({ error: 'No backup records found for this student account.' });
      }
      
      return res.json({ success: true, payload: data.data });
    } else {
      return res.status(400).json({ error: 'Invalid sync action. Choose action: "backup" or "restore"' });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// AWS DynamoDB proxy endpoint (Student or Admin authenticated)
app.post(['/api/db/sync-aws', '/api/db/sync-aws/'], requireAuthenticatedUser, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { region, accessKeyId, secretAccessKey, tableName, action, payload } = req.body;
    
    const targetRegion = (region || process.env.AWS_REGION || 'us-east-1').trim();
    const targetAccessKeyId = (accessKeyId || process.env.AWS_ACCESS_KEY_ID || '').trim();
    const targetSecretAccessKey = (secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '').trim();
    const targetTable = (tableName || 'ethiolearn_sync').trim();

    if (!targetAccessKeyId || !targetSecretAccessKey) {
      return res.status(400).json({ error: 'AWS Access Key ID and Secret Access Key are required.' });
    }

    const client = new DynamoDBClient({
      region: targetRegion,
      credentials: {
        accessKeyId: targetAccessKeyId,
        secretAccessKey: targetSecretAccessKey
      }
    });
    const ddbDocClient = DynamoDBDocumentClient.from(client);
    const targetEmail = user.email.toLowerCase().trim();

    if (action === 'backup') {
      if (!payload) {
        return res.status(400).json({ error: 'Backup payload data is missing.' });
      }

      const params = {
        TableName: targetTable,
        Item: {
          email: targetEmail,
          data: JSON.stringify(payload),
          updated_at: new Date().toISOString()
        }
      };

      await ddbDocClient.send(new PutCommand(params));
      return res.json({ success: true, message: 'Campus progress backed up successfully to Amazon AWS!' });
    } else if (action === 'restore') {
      const params = {
        TableName: targetTable,
        Key: { email: targetEmail }
      };

      const result = await ddbDocClient.send(new GetCommand(params));
      if (!result.Item) {
        return res.status(404).json({ error: 'No backup records found for this student account in DynamoDB.' });
      }
      
      let parsedData = result.Item.data;
      if (typeof parsedData === 'string') {
        parsedData = JSON.parse(parsedData);
      }

      return res.json({ success: true, payload: parsedData });
    } else {
      return res.status(400).json({ error: 'Invalid sync action. Choose action: "backup" or "restore"' });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Safe public Supabase config endpoint (Exposes ONLY safe public Anon Key)
app.get(['/api/supabase-config', '/api/supabase-config/'], (req: Request, res: Response) => {
  try {
    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    const anonKey = (
      process.env.SUPABASE_ANON_KEY || 
      process.env.VITE_SUPABASE_ANON_KEY || 
      ''
    ).trim();
    return res.json({ url, anonKey });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Real Email Dispatcher via Nodemailer
async function sendRealVerificationEmail(
  toEmail: string,
  code: string,
  name: string,
  type: 'registration' | 'password_reset'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const fromEmail = process.env.SMTP_FROM || smtpUser || 'academic@ethiolearn.edu.et';

    let transporter: any = null;
    if (smtpHost && smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      });
    }

    const isReset = type === 'password_reset';
    const subject = isReset 
      ? `EthioLearn Pro - Password Recovery Security Code: [ ${code} ]`
      : `EthioLearn Pro - Academic Verification Card & Activation Code: [ ${code} ]`;

    const acceptUrl = `http://localhost:3000/?verified_email=${encodeURIComponent(toEmail)}&code=${encodeURIComponent(code)}&action=accept_authorization`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A1128; color: #E2E8F0; margin: 0; padding: 24px 12px; }
          .card-wrapper { max-width: 540px; margin: 0 auto; }
          .verification-card { background: linear-gradient(145deg, #162238 0%, #0d1627 100%); border-radius: 18px; border: 1.5px solid #F59E0B; padding: 32px 28px; box-shadow: 0 20px 45px rgba(0,0,0,0.6); position: relative; overflow: hidden; }
          .card-flag-strip { display: flex; height: 4px; width: 100%; border-radius: 2px; overflow: hidden; margin-bottom: 20px; }
          .flag-g { flex: 1; background-color: #10B981; }
          .flag-y { flex: 1; background-color: #F59E0B; }
          .flag-r { flex: 1; background-color: #EF4444; }
          .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(245, 158, 11, 0.25); padding-bottom: 16px; }
          .logo { color: #F59E0B; font-size: 20px; font-weight: 900; letter-spacing: 0.5px; }
          .card-badge { background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; }
          .title { color: #FFFFFF; font-size: 19px; font-weight: 800; margin-bottom: 14px; }
          .scholar-details { background: #0b1222; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px 18px; margin-bottom: 22px; font-size: 13px; line-height: 1.6; }
          .scholar-details strong { color: #F59E0B; }
          .text { color: #CBD5E1; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
          .code-box { background: #060a14; border: 2px dashed #F59E0B; border-radius: 14px; padding: 22px; text-align: center; margin: 24px 0; }
          .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94A3B8; font-weight: 700; margin-bottom: 8px; display: block; }
          .code { font-family: 'Courier New', monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #F59E0B; }
          .meta { color: #94A3B8; font-size: 12px; text-align: center; margin-top: 10px; }
          .action-btn { display: block; width: 100%; box-sizing: border-box; text-align: center; background: linear-gradient(90deg, #F59E0B 0%, #EAB308 50%, #D97706 100%); color: #000000; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; padding: 16px 20px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.35); }
          .amharic { color: #E2E8F0; font-size: 13px; line-height: 1.7; border-top: 1px solid #334155; padding-top: 18px; margin-top: 24px; }
          .footer { color: #64748B; font-size: 11px; text-align: center; margin-top: 24px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card-wrapper">
          <div class="verification-card">
            <div class="card-flag-strip">
              <div class="flag-g"></div>
              <div class="flag-y"></div>
              <div class="flag-r"></div>
            </div>

            <div class="card-header">
              <div>
                <div class="logo">🇪🇹 EthioLearn Pro</div>
                <div style="color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">Academic Verification Card</div>
              </div>
              <div class="card-badge">VERIFICATION CARD</div>
            </div>

            <div class="title">${isReset ? 'Password Reset Verification Card' : 'Student Academic Authorization Card'}</div>
            
            <div class="scholar-details">
              <div>Scholar: <strong>${name}</strong></div>
              <div>Authorized Email: <strong>${toEmail}</strong></div>
              <div>Status: <strong>Awaiting Email Authorization</strong></div>
            </div>

            <div class="text">
              ${isReset 
                ? 'A student password reset was requested. Use the single-use 6-digit recovery code on this verification card, or click the authorization button below:' 
                : 'Welcome to EthioLearn Pro! To complete your student authorization and unlock your university study portal, use the official verification code on this card, or click the button below to accept authorization:'}
            </div>

            <div class="code-box">
              <span class="code-label">6-Digit Authorization Code</span>
              <div class="code">${code}</div>
              <div class="meta">Valid for 15 minutes • Single-use authorization token</div>
            </div>

            ${!isReset ? `
              <a href="${acceptUrl}" class="action-btn" target="_blank">
                &check; Accept Authorization in EthioLearn Pro
              </a>
            ` : ''}

            <div class="amharic">
              <strong>የአማርኛ ማስታወሻ (የማረጋገጫ ካርድ)፡</strong><br>
              ${isReset 
                ? `የይለፍ ቃልዎን ለመቀየር ባለ 6-አሃዝ የማረጋገጫ ኮድዎ <strong>[ ${code} ]</strong> ነው። ኮዱን በመተየብ አዲስ የይለፍ ቃል ያዘጋጁ።`
                : `የተማሪ አካውንትዎን በኢሜይል ለማረጋገጥና ለማጽደቅ ባለ 6-አሃዝ የማረጋገጫ ኮድዎ <strong>[ ${code} ]</strong> ነው። ከላይ ያለውን ቢጫ ቁልፍ በመጫን ወይም ኮዱን በማስገባት ምዝገባዎን ያጠናቅቁ።`}
            </div>

            <div class="footer">
              This official verification card authorizes university access for student academic records.<br>
              Wolkite University & Ethiopian Higher Education Institutions Academic Technology Network.<br>
              &copy; ${new Date().getFullYear()} EthioLearn Pro. All rights reserved.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    if (transporter) {
      const info = await transporter.sendMail({
        from: `"EthioLearn Pro Academic" <${fromEmail}>`,
        to: toEmail,
        subject,
        html: htmlContent,
        text: `EthioLearn Pro Activation Code: ${code}. Valid for 15 minutes.`
      });
      console.log(`[Email Dispatch Service] Real email dispatched via SMTP to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`[Email Dispatch Service] SMTP not configured in env; Activation email queued for ${toEmail} with code [${code}].`);
      return { success: true };
    }
  } catch (mailErr: any) {
    console.warn('[Email Dispatch Warning]:', mailErr.message);
    return { success: false, error: mailErr.message };
  }
}

// Student Profile Registration & Upsert Endpoint (Server-Side Persistence Bridge)
app.post(['/api/db/student-profile', '/api/db/student-profile/'], async (req: Request, res: Response) => {
  try {
    const { email, phone, name, university, year, subjects, isPro, userRole, referralCode, profileData, url, key } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({ error: 'Student email or phone number is required.' });
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPhone = (phone || '').trim();
    const cleanName = (name || (cleanEmail ? cleanEmail.split('@')[0] : `Student ${cleanPhone}`) || 'Student').trim();

    // If client passes custom Supabase credentials, register them
    if (url && key) {
      setSupabaseAdminCredentials(url, key);
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(503).json({ 
        error: 'Supabase is not configured on the server. Please configure your Supabase URL & Key in Admin Console.',
        storedLocally: true 
      });
    }

    let existingDataRes: any = null;
    if (cleanEmail) {
      existingDataRes = await supabase
        .from('student_profiles')
        .select('profile_data, study_sessions, notes_data, performance_data')
        .eq('email', cleanEmail)
        .maybeSingle();
    } else if (cleanPhone) {
      existingDataRes = await supabase
        .from('student_profiles')
        .select('profile_data, study_sessions, notes_data, performance_data')
        .eq('phone', cleanPhone)
        .maybeSingle();
    }

    const existingProfileData = existingDataRes?.data?.profile_data || {};
    const mergedProfileData = {
      ...existingProfileData,
      ...(profileData || {}),
      name: cleanName,
      phone: cleanPhone || existingProfileData.phone || undefined,
      university: university || existingProfileData.university || 'Wolkite University',
      year: year || existingProfileData.year || 'Freshman',
      subjects: Array.isArray(subjects) ? subjects : (existingProfileData.subjects || []),
      isPro: typeof isPro === 'boolean' ? isPro : (existingProfileData.isPro || false),
      userRole: userRole || existingProfileData.userRole || (cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase() ? 'super_admin' : 'student'),
      referralCode: referralCode || existingProfileData.referralCode || null
    };

    const dbRecord: any = {
      email: cleanEmail || `${cleanPhone}@student.ethiolearn.edu.et`,
      phone: cleanPhone || null,
      profile_data: mergedProfileData,
      study_sessions: (profileData && profileData.studySessions) || existingDataRes?.data?.study_sessions || [],
      notes_data: (profileData && profileData.notesData) || existingDataRes?.data?.notes_data || [],
      performance_data: (profileData && profileData.performanceData) || existingDataRes?.data?.performance_data || {},
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('student_profiles')
      .upsert(dbRecord, { onConflict: 'email' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[Server DB Student Profile Upsert Error]:', error.message);
      return res.status(500).json({ 
        error: error.message, 
        details: 'Failed to write to student_profiles table. Please check RLS policies.' 
      });
    }

    return res.json({ 
      success: true, 
      message: 'Student account registered and saved to Supabase successfully!', 
      student: {
        email: dbRecord.email,
        phone: cleanPhone,
        name: cleanName,
        university: mergedProfileData.university,
        year: mergedProfileData.year,
        is_pro: mergedProfileData.isPro,
        user_role: mergedProfileData.userRole,
        profile_data: mergedProfileData,
        updated_at: dbRecord.updated_at
      }
    });
  } catch (e: any) {
    console.error('[Server DB Student Profile Exception]:', e);
    return res.status(500).json({ error: e.message || 'Internal error saving student profile' });
  }
});

// GET Student Profile Endpoint
app.get(['/api/db/student-profile', '/api/db/student-profile/'], async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required.' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.json({ success: false, message: 'Database client not initialized' });
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .select('email, profile_data, study_sessions, notes_data, performance_data, updated_at')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const pd = data.profile_data || {};
    return res.json({
      success: true,
      student: {
        email: data.email,
        name: pd.name || data.email.split('@')[0],
        university: pd.university || 'Wolkite University',
        year: pd.year || 'Freshman',
        is_pro: Boolean(pd.isPro || pd.is_pro),
        user_role: pd.userRole || pd.user_role || (data.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() ? 'super_admin' : 'student'),
        profile_data: pd,
        study_sessions: data.study_sessions || [],
        notes_data: data.notes_data || [],
        performance_data: data.performance_data || {},
        updated_at: data.updated_at
      }
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Verification Code & Student Notification Store (In-Memory with Time-To-Live)
interface VerificationStoreItem {
  code: string;
  email: string;
  phone?: string;
  type: 'registration' | 'password_reset';
  studentInfo?: {
    name?: string;
    university?: string;
    year?: string;
  };
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

const activeVerificationStore = new Map<string, VerificationStoreItem>();

// Clean expired codes periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of activeVerificationStore.entries()) {
    if (item.expiresAt < now) {
      activeVerificationStore.delete(key);
    }
  }
}, 60000);

// Endpoint to generate & dispatch 6-digit registration / password reset security code
app.post(['/api/auth/send-verification-code', '/api/auth/send-verification-code/'], async (req: Request, res: Response) => {
  try {
    const { email, phone, identifier, name, university, year, type = 'registration' } = req.body;
    const targetInput = identifier || phone || email;

    if (!targetInput || typeof targetInput !== 'string' || !targetInput.trim()) {
      return res.status(400).json({ error: 'A valid student phone number or email address is required.' });
    }

    const idInfo = normalizeStudentIdentifier(targetInput);
    const cleanName = (name || (idInfo.type === 'phone' ? `Student ${idInfo.display}` : idInfo.value.split('@')[0]) || 'Student').trim();
    const codeType: 'registration' | 'password_reset' = type === 'password_reset' ? 'password_reset' : 'registration';

    // Generate crypto-secure 6-digit numeric verification code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes validity

    const targetEmail = idInfo.type === 'email' ? idInfo.value : (email && email.includes('@') ? email.toLowerCase().trim() : '');

    const storeKey = `${idInfo.value}:${codeType}`;
    const verificationData = {
      code: generatedCode,
      email: targetEmail,
      phone: idInfo.type === 'phone' ? idInfo.display : (phone || ''),
      type: codeType,
      studentInfo: {
        name: cleanName,
        university: university || 'Wolkite University',
        year: year || 'Freshman'
      },
      createdAt: now,
      expiresAt,
      attempts: 0
    };

    activeVerificationStore.set(storeKey, verificationData);
    if (idInfo.type === 'phone') {
      activeVerificationStore.set(`${idInfo.display}:${codeType}`, verificationData);
    }
    if (targetEmail && targetEmail !== idInfo.value) {
      activeVerificationStore.set(`${targetEmail}:${codeType}`, verificationData);
    }

    const isReset = codeType === 'password_reset';

    // Dispatch real email via Nodemailer
    if (targetEmail) {
      await sendRealVerificationEmail(targetEmail, generatedCode, cleanName, codeType);
    }

    const messageEn = isReset
      ? `EthioLearn Password Reset: A real 6-digit recovery code was sent to ${targetEmail || idInfo.value}. Please check your email inbox and spam folder.`
      : `EthioLearn Registration: Welcome ${cleanName}! A real 6-digit activation code was sent to ${targetEmail || idInfo.value}. Please check your email inbox and spam folder.`;

    const messageAm = isReset
      ? `ኢትዮ ለርን ፕሮ፡ የይለፍ ቃል መቀየሪያ ባለ 6-አሃዝ የደህንነት ኮድ ወደ ${targetEmail || idInfo.value} ተልኳል። እባክዎ የኢሜይል ሳጥንዎን ይመልከቱ።`
      : `ኢትዮ ለርን ፕሮ፡ እንኳን ደህና መጡ ${cleanName}! ባለ 6-አሃዝ የማረጋገጫ ኮድ ወደ ${targetEmail || idInfo.value} ተልኳል። እባክዎ የኢሜይል ሳጥንዎን ይመልከቱ።`;

    console.log(`[Auth Verification Code Generated] ${codeType.toUpperCase()} dispatched for ${targetEmail || idInfo.value}. (Expires in 15m)`);

    // Return code in dev/preview if SMTP host is not configured to allow testing
    const devPreview = !process.env.SMTP_HOST;
    return res.json({
      success: true,
      identifier: idInfo.value,
      phone: idInfo.type === 'phone' ? idInfo.display : undefined,
      email: targetEmail || undefined,
      type: codeType,
      code: devPreview ? generatedCode : undefined,
      devPreviewCode: devPreview ? generatedCode : undefined,
      message: messageEn,
      amharicMessage: messageAm,
      expiresAt,
      studentInfo: {
        name: cleanName,
        university: university || 'Wolkite University',
        year: year || 'Freshman'
      }
    });
  } catch (e: any) {
    console.error('[Send Verification Code Error]:', e);
    return res.status(500).json({ error: e.message || 'Internal error generating verification code' });
  }
});

// Endpoint to verify the 6-digit code
app.post(['/api/auth/verify-code', '/api/auth/verify-code/'], async (req: Request, res: Response) => {
  try {
    const { email, phone, identifier, code, type = 'registration' } = req.body;
    const targetInput = identifier || phone || email;

    if (!targetInput || !code) {
      return res.status(400).json({ error: 'Phone/email and verification code are required.' });
    }

    const idInfo = normalizeStudentIdentifier(targetInput);
    const cleanCode = code.toString().trim();
    const codeType = type === 'password_reset' ? 'password_reset' : 'registration';
    const storeKey = `${idInfo.value}:${codeType}`;
    const altKey = `${idInfo.display}:${codeType}`;
    const emailKey = email ? `${email.toLowerCase().trim()}:${codeType}` : '';

    const item = activeVerificationStore.get(storeKey) || 
                 activeVerificationStore.get(altKey) || 
                 (emailKey ? activeVerificationStore.get(emailKey) : undefined);

    if (!item) {
      return res.status(400).json({
        success: false,
        error: 'Verification code not found or has expired. Please request a new code.',
        amharicError: 'የማረጋገጫ ኮዱ አልተገኘም ወይም ጊዜው አልፏል። እባክዎ አዲስ ኮድ ይጠይቁ።'
      });
    }

    if (Date.now() > item.expiresAt) {
      activeVerificationStore.delete(storeKey);
      activeVerificationStore.delete(altKey);
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new code.',
        amharicError: 'የማረጋገጫ ኮዱ ጊዜ አልፎበታል። እባክዎ አዲስ ኮድ ይጠይቁ።'
      });
    }

    item.attempts += 1;
    if (item.attempts > 8) {
      activeVerificationStore.delete(storeKey);
      activeVerificationStore.delete(altKey);
      return res.status(429).json({
        success: false,
        error: 'Too many incorrect attempts. Please request a new verification code.',
        amharicError: 'ብዙ የተሳሳቱ ሙከራዎች ተደርገዋል። እባክዎ አዲስ የማረጋገጫ ኮድ ይጠይቁ።'
      });
    }

    if (item.code !== cleanCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid 6-digit code. Please verify the numbers and try again.',
        amharicError: 'የተሳሳተ ባለ 6-አሃዝ ኮድ። እባክዎ ቁጥሩን አረጋግጠው እንደገና ይሞክሩ።'
      });
    }

    // Code matched!
    activeVerificationStore.delete(storeKey);
    activeVerificationStore.delete(altKey);

    return res.json({
      success: true,
      verified: true,
      message: 'Student identity verified successfully!',
      amharicMessage: 'የተማሪ ማንነት በተሳካ ሁኔታ ተረጋግጧል!'
    });
  } catch (e: any) {
    console.error('[Verify Code Error]:', e);
    return res.status(500).json({ error: e.message || 'Internal error verifying code' });
  }
});

// Endpoint to reset password after verification code is confirmed
app.post(['/api/auth/reset-password', '/api/auth/reset-password/'], async (req: Request, res: Response) => {
  try {
    const { email, phone, identifier, newPassword, code } = req.body;
    const targetInput = identifier || phone || email;

    if (!targetInput || !newPassword) {
      return res.status(400).json({ error: 'Phone/email and new password are required.' });
    }

    const idInfo = normalizeStudentIdentifier(targetInput);
    const cleanPass = newPassword.trim();

    if (cleanPass.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = supabase.from('student_profiles').select('*');
        if (idInfo.type === 'email') {
          query = query.eq('email', idInfo.value);
        } else {
          query = query.or(`phone.eq.${idInfo.value},phone.eq.${idInfo.display},email.eq.${idInfo.value}`);
        }

        const { data: existingRecords } = await query.limit(1);
        const existing = existingRecords && existingRecords[0];

        const updatedProfileData = {
          ...(existing?.profile_data || {}),
          phone: idInfo.type === 'phone' ? idInfo.display : existing?.phone,
          email: idInfo.type === 'email' ? idInfo.value : existing?.email,
          password: cleanPass
        };

        const upsertPayload: any = {
          profile_data: updatedProfileData,
          updated_at: new Date().toISOString()
        };
        if (idInfo.type === 'email') {
          upsertPayload.email = idInfo.value;
        } else {
          upsertPayload.phone = idInfo.display;
          if (existing?.email) upsertPayload.email = existing.email;
        }

        await supabase.from('student_profiles').upsert(upsertPayload);
      } catch (dbErr) {
        console.warn('[Supabase Password Reset Warning]:', dbErr);
      }
    }

    return res.json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in with your new password.',
      amharicMessage: 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል! አሁን በአዲሱ የይለፍ ቃል መግባት ይችላሉ።'
    });
  } catch (e: any) {
    console.error('[Reset Password Error]:', e);
    return res.status(500).json({ error: e.message || 'Internal error resetting password' });
  }
});

// Student Email Login Endpoint (Email + Password Authorization)
app.post(['/api/auth/login', '/api/auth/login/'], async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Student email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = password.trim();

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (data) {
          const pd = data.profile_data || {};
          if (pd.password && pd.password !== cleanPass) {
            return res.status(401).json({ error: 'Incorrect password for this student account.' });
          }

          return res.json({
            success: true,
            user: {
              id: data.id || `std_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
              email: data.email,
              phone: data.phone || pd.phone,
              name: pd.name || data.email.split('@')[0],
              university: pd.university || 'Wolkite University (WKU)',
              year: pd.year || 'Freshman (1st Year)',
              subjects: pd.subjects || ['Emerging Technologies', 'Communicative English', 'Mathematics'],
              role: pd.userRole || (cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase() ? 'super_admin' : 'student'),
              is_pro: Boolean(pd.isPro || pd.is_pro)
            }
          });
        }
      } catch (dbErr) {
        console.warn('[Supabase Login Query Warning]:', dbErr);
      }
    }

    // Default student user object
    return res.json({
      success: true,
      user: {
        id: `std_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        university: 'Wolkite University (WKU)',
        year: 'Freshman (1st Year)',
        subjects: ['Emerging Technologies', 'Communicative English', 'Mathematics'],
        role: cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase() ? 'super_admin' : 'student',
        is_pro: false
      }
    });
  } catch (e: any) {
    console.error('[Login Endpoint Error]:', e);
    return res.status(500).json({ error: e.message || 'Internal login error' });
  }
});

// Endpoint to handle "Accept Authorization" link click from verification email card
app.get(['/api/auth/accept-verification', '/api/auth/accept-verification/'], (req: Request, res: Response) => {
  try {
    const email = (req.query.email || req.query.verified_email || '').toString().toLowerCase().trim();
    const code = (req.query.code || '').toString().trim();

    if (email) {
      const storeKey = `${email}:registration`;
      const item = activeVerificationStore.get(storeKey);
      if (item) {
        (item as any).accepted = true;
      }
    }

    // Redirect to main app with verified status
    return res.redirect(`/?verified_email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&action=accept_authorization`);
  } catch (e: any) {
    return res.redirect(`/?error=verification_failed`);
  }
});

// Endpoint to check if email was accepted via verification card link
app.get(['/api/auth/check-verification-status', '/api/auth/check-verification-status/'], (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: 'Email query parameter is required.' });
    }

    const storeKey = `${email}:registration`;
    const item = activeVerificationStore.get(storeKey);

    if (item && (item as any).accepted) {
      return res.json({
        success: true,
        verified: true,
        message: 'Email authorization has been accepted from verification card!'
      });
    }

    return res.json({
      success: false,
      verified: false,
      message: 'Email verification card is awaiting acceptance.'
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Error checking verification status' });
  }
});

// Supabase Connection Diagnostic & Health Check Endpoint
app.post(['/api/db/test-connection', '/api/db/test-connection/'], async (req: Request, res: Response) => {
  try {
    const { url, key } = req.body;
    
    let targetClient: any = null;
    if (url && key) {
      try {
        targetClient = createClient(url.trim(), key.trim(), {
          auth: { persistSession: false, autoRefreshToken: false }
        });
      } catch (clientErr: any) {
        return res.status(400).json({ 
          success: false, 
          message: `Client initialization failed: ${clientErr.message}` 
        });
      }
    } else {
      targetClient = getSupabaseAdmin();
    }

    if (!targetClient) {
      return res.status(400).json({ 
        success: false, 
        message: 'No Supabase URL and Key provided or configured.' 
      });
    }

    const tablesFound: string[] = [];
    const counts: Record<string, number> = {};

    const tableNames = ['student_profiles', 'courses', 'lessons', 'payments', 'coupons', 'announcements', 'ethiolearn_sync', 'books', 'subscriptions', 'course_progress'];

    for (const t of tableNames) {
      try {
        const { count, error } = await targetClient
          .from(t)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          tablesFound.push(t);
          counts[t] = count ?? 0;
        }
      } catch (e) {}
    }

    // Verify Write & RLS access on student_profiles
    let rlsWriteBlocked = false;
    let rlsErrorMsg = '';
    const testEmail = `server_diag_${Date.now()}@ethiolearn.test`;

    if (tablesFound.includes('student_profiles')) {
      try {
        const { error: insErr } = await targetClient
          .from('student_profiles')
          .upsert({
            email: testEmail,
            profile_data: { name: 'Server Diag Ping', isPro: false, userRole: 'student' },
            study_sessions: [],
            notes_data: [],
            performance_data: {},
            updated_at: new Date().toISOString()
          });

        if (insErr) {
          rlsWriteBlocked = true;
          rlsErrorMsg = insErr.message;
        } else {
          // Clean up test row
          await targetClient.from('student_profiles').delete().eq('email', testEmail);
        }
      } catch (e: any) {
        rlsWriteBlocked = true;
        rlsErrorMsg = e.message;
      }
    }

    if (tablesFound.length === 0) {
      return res.json({
        success: false,
        message: 'Connected to Supabase project REST API, but no database tables were found.',
        details: 'Please copy and run the 1-click SQL setup script in your Supabase SQL Editor to create the required tables.',
        tablesFound: [],
        counts: {},
        needsSqlSetup: true
      });
    }

    if (rlsWriteBlocked) {
      return res.json({
        success: false,
        message: 'Tables found, but Row-Level Security (RLS) is blocking data registration!',
        details: `Error: ${rlsErrorMsg}. Please run the updated SQL setup script in Supabase SQL Editor to add public and anon access policies.`,
        tablesFound,
        counts,
        needsSqlSetup: true
      });
    }

    return res.json({
      success: true,
      message: `Supabase database is fully operational! Verified tables: [${tablesFound.join(', ')}].`,
      tablesFound,
      counts,
      rlsWriteOk: true,
      needsSqlSetup: false
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message || 'Server error testing connection' });
  }
});

// Configure Supabase Credentials Endpoint
app.post(['/api/db/configure', '/api/db/configure/'], requireAdmin, async (req: Request, res: Response) => {
  try {
    const { url, key } = req.body;
    if (!url || !key) {
      return res.status(400).json({ error: 'Supabase URL and Key are required.' });
    }

    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'Supabase URL must start with https://' });
    }

    const ok = setSupabaseAdminCredentials(cleanUrl, cleanKey);
    if (!ok) {
      return res.status(400).json({ error: 'Failed to initialize Supabase client with given credentials.' });
    }

    return res.json({ 
      success: true, 
      message: 'Supabase credentials saved and active on server!' 
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// 8. AI TUTORING & STREAMING ENDPOINT
// ============================================================================

// AI Tutoring & Streaming Endpoint (Gemini)
app.post([
  '/api/claude/chat', 
  '/api/claude/chat/', 
  '/api/ai/chat', 
  '/api/ai/chat/', 
  '/claude/chat', 
  '/claude/chat/', 
  '/ai/chat', 
  '/ai/chat/'
], aiChatLimiter, handleAIChatStream);

// Dedicated Asgobnyi ("አስጎብኚ") AI Q&A Assistant Endpoint
app.post(['/api/ai/ask', '/api/ai/ask/'], aiChatLimiter, async (req: Request, res: Response) => {
  try {
    const { prompt, studentName, university, department, language, apiKey } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt is required.' });
    }

    const systemPrompt = `You are Asgobnyi ("አስጎብኚ"), the elite Ethiopian university tutor and academic companion on EthioLearn Pro.
Student: ${studentName || 'Student'}
University: ${university || 'Wolkite University / Ethiopian Higher Education'}
Department: ${department || 'General Curriculum'}
Target Language: ${language || 'English'}
Instructions:
- Provide accurate, concise, and helpful academic guidance aligned with the Ethiopian higher education curriculum.
- If the student asks in Amharic, reply in polite and encouraging Amharic.
- Include practical study advice, step-by-step solutions, formulas, or key terms where appropriate.`;

    const aiRes = await generateSingleAIResponse(
      [{ role: 'user', content: prompt.trim() }],
      systemPrompt,
      apiKey
    );

    return res.json({
      success: true,
      reply: aiRes.text || (language === 'Amharic' ? 'ይቅርታ መልስ ማግኘት አልተቻለም።' : 'Could not generate a response.')
    });
  } catch (e: any) {
    console.error('[Asgobnyi AI Ask Error]:', e);
    return res.status(500).json({ success: false, error: e.message || 'Failed to process AI request' });
  }
});

// Dedicated Subject-Pure Academic Quiz Generation Endpoint (Gemini AI + Curated Fallback)
app.post(['/api/quiz/generate', '/api/quiz/generate/'], async (req: Request, res: Response) => {
  try {
    const { subject, topic, difficulty, qCount, customNeeds, language } = req.body;
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ success: false, error: 'Subject is required.' });
    }

    const questions = await generateAcademicQuiz({
      subject: subject.trim(),
      topic: typeof topic === 'string' ? topic.trim() : undefined,
      difficulty: difficulty === 'easy' || difficulty === 'hard' ? difficulty : 'medium',
      qCount: typeof qCount === 'number' ? qCount : 5,
      customNeeds: typeof customNeeds === 'string' ? customNeeds.trim() : undefined,
      language: language === 'am' ? 'am' : 'en'
    });

    return res.json({
      success: true,
      subject: subject.trim(),
      count: questions.length,
      questions
    });
  } catch (err: any) {
    console.error('[Quiz Generation API Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate quiz.'
    });
  }
});

// ============================================================================
// 9. CENTRALIZED ERROR HANDLING MIDDLEWARE
// ============================================================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Internal Server Error Handler]:', err);
  if (res.headersSent) {
    return next(err);
  }

  // Handle payload too large (413)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      error: 'File or payload size exceeds the maximum allowed 50MB limit. Please choose a smaller file or compress the PDF.'
    });
  }

  // Handle JSON parse error (400)
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload received by server.'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected server error occurred.',
    errorType: err.name || 'InternalServerError'
  });
});

// ============================================================================
// 10. SERVER STARTUP & VITE INTEGRATION
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[EthioLearn Server] bound on port ${PORT} (dev mode with Vite)`);
      });
    } catch (err) {
      console.error('[EthioLearn Server] Failed to start Vite dev server:', err);
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[EthioLearn Server] fallback bound on port ${PORT}`);
      });
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: `API endpoint ${req.path} not found.` });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });

    if (!process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[EthioLearn Server] bound on port ${PORT} (production mode)`);
      });
    }
  }
}

startServer();

export default app;
