/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Server-Side Admin Management & Data Operations
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from './security';

// Resilient in-memory fallback stores
const memoryAnnouncements = new Map<string, any>();
const memoryCourses = new Map<string, any>();
const memoryCoupons = new Map<string, any>();

const DB_DIR = path.join(process.cwd(), 'storage', 'db');
const ANNOUNCEMENTS_DB_FILE = path.join(DB_DIR, 'announcements.json');

function ensureDbDirectory() {
  if (!fs.existsSync(DB_DIR)) {
    try {
      fs.mkdirSync(DB_DIR, { recursive: true });
    } catch (e) { /* ignore */ }
  }
}

// Pre-load disk announcements on startup
try {
  ensureDbDirectory();
  if (fs.existsSync(ANNOUNCEMENTS_DB_FILE)) {
    const raw = fs.readFileSync(ANNOUNCEMENTS_DB_FILE, 'utf8');
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      list.forEach((ann: any) => {
        if (ann && ann.id) memoryAnnouncements.set(ann.id, ann);
      });
    }
  }
} catch (e) {
  console.warn('[Admin Server] Pre-load announcements warning:', e);
}

function saveAnnouncementToDisk(ann: any) {
  try {
    ensureDbDirectory();
    let list: any[] = [];
    if (fs.existsSync(ANNOUNCEMENTS_DB_FILE)) {
      try {
        list = JSON.parse(fs.readFileSync(ANNOUNCEMENTS_DB_FILE, 'utf8'));
      } catch {}
    }
    const idx = list.findIndex((a: any) => a.id === ann.id);
    if (idx >= 0) {
      list[idx] = ann;
    } else {
      list.unshift(ann);
    }
    fs.writeFileSync(ANNOUNCEMENTS_DB_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Admin Server] Failed to save announcement to disk:', e);
  }
}

function removeAnnouncementFromDisk(id: string) {
  try {
    if (fs.existsSync(ANNOUNCEMENTS_DB_FILE)) {
      const list = JSON.parse(fs.readFileSync(ANNOUNCEMENTS_DB_FILE, 'utf8'));
      const filtered = list.filter((a: any) => a.id !== id);
      fs.writeFileSync(ANNOUNCEMENTS_DB_FILE, JSON.stringify(filtered, null, 2), 'utf8');
    }
  } catch (e) {
    console.warn('[Admin Server] Failed to delete announcement from disk:', e);
  }
}

function getLocalContentStats() {
  let publishedBooks = 0;
  let draftBooks = 0;
  let publishedExams = 0;
  let draftExams = 0;

  try {
    const booksFile = path.join(process.cwd(), 'storage', 'db', 'books.json');
    if (fs.existsSync(booksFile)) {
      const books: any[] = JSON.parse(fs.readFileSync(booksFile, 'utf8'));
      publishedBooks = books.filter(b => b.status === 'published').length;
      draftBooks = books.filter(b => b.status !== 'published').length;
    }
  } catch (e) { /* ignore */ }

  try {
    const examsFile = path.join(process.cwd(), 'storage', 'db', 'exams.json');
    if (fs.existsSync(examsFile)) {
      const exams: any[] = JSON.parse(fs.readFileSync(examsFile, 'utf8'));
      publishedExams = exams.filter(e => e.status === 'published').length;
      draftExams = exams.filter(e => e.status !== 'published').length;
    }
  } catch (e) { /* ignore */ }

  return { publishedBooks, draftBooks, publishedExams, draftExams };
}

/**
 * Fetch real aggregate statistics from Supabase
 */
export async function getAdminStats(req: Request, res: Response) {
  try {
    const contentStats = getLocalContentStats();
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.json({
        success: true,
        stats: {
          totalStudents: 0,
          publishedCourses: 0,
          draftCourses: 0,
          totalLessons: 0,
          publishedBooks: contentStats.publishedBooks,
          draftBooks: contentStats.draftBooks,
          publishedExams: contentStats.publishedExams,
          draftExams: contentStats.draftExams,
          totalRevenueETB: 0,
          pendingPaymentsCount: 0,
          totalPaymentsCount: 0,
          activeAnnouncementsCount: 0,
          activeCouponsCount: 0,
          recentActivity: []
        }
      });
    }

    // 1. Total Students Count
    const { count: studentCount } = await supabase
      .from('student_profiles')
      .select('*', { count: 'exact', head: true });

    // 2. Published & Draft Courses Count
    const { data: courseStats } = await supabase
      .from('courses')
      .select('status');

    let publishedCourses = 0;
    let draftCourses = 0;
    if (courseStats) {
      publishedCourses = courseStats.filter(c => c.status === 'published').length;
      draftCourses = courseStats.filter(c => c.status === 'draft').length;
    }

    // 3. Lessons Count
    const { count: lessonsCount } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true });

    // 4. Payments stats & Total Revenue (Sum of completed payments)
    const { data: payments } = await supabase
      .from('payments')
      .select('id, amount, status, created_at, user_id, provider');

    let totalRevenueETB = 0;
    let pendingPaymentsCount = 0;
    let totalPaymentsCount = 0;

    if (payments) {
      totalPaymentsCount = payments.length;
      payments.forEach(p => {
        if (p.status === 'completed') {
          totalRevenueETB += Number(p.amount || 0);
        } else if (p.status === 'pending') {
          pendingPaymentsCount++;
        }
      });
    }

    // 5. Active Announcements Count
    const { count: announcementsCount } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // 6. Active Coupons Count
    const { count: couponsCount } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // 7. Real Recent Activities
    const recentActivity: any[] = [];
    if (payments && payments.length > 0) {
      const sorted = [...payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);
      sorted.forEach(p => {
        recentActivity.push({
          id: `act_${p.id}`,
          type: p.status === 'completed' ? 'payment_approved' : 'payment_pending',
          title: p.status === 'completed' ? 'Payment Verified' : 'Payment Submitted',
          description: `${p.user_id} - ${p.amount} ETB via ${p.provider}`,
          timestamp: p.created_at
        });
      });
    }

    return res.json({
      success: true,
      stats: {
        totalStudents: studentCount || 0,
        publishedCourses,
        draftCourses,
        totalLessons: lessonsCount || 0,
        publishedBooks: contentStats.publishedBooks,
        draftBooks: contentStats.draftBooks,
        publishedExams: contentStats.publishedExams,
        draftExams: contentStats.draftExams,
        totalRevenueETB: Math.round(totalRevenueETB),
        pendingPaymentsCount,
        totalPaymentsCount,
        activeAnnouncementsCount: announcementsCount || 0,
        activeCouponsCount: couponsCount || 0,
        recentActivity
      }
    });
  } catch (error: any) {
    console.error('[Admin API] Stats query error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Fetch all payments for Administrator Review
 */
export async function getAdminPayments(req: Request, res: Response) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.json({ success: true, payments: [] });
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, payments: data || [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Admin action to approve or reject a student payment
 */
export async function handleAdminPaymentAction(req: Request, res: Response) {
  try {
    const { paymentId, action, studentEmail: inputStudentEmail, studentPhone: inputStudentPhone, tier: inputTier } = req.body;
    if (!paymentId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Valid paymentId and action (approve/reject) required.' });
    }

    const supabase = getSupabaseAdmin();
    const newStatus = action === 'approve' ? 'completed' : 'failed';
    let payment: any = null;

    if (supabase) {
      // 1. Update payment status in Supabase if table exists
      try {
        const { data, error: payErr } = await supabase
          .from('payments')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', paymentId)
          .select()
          .maybeSingle();

        if (!payErr && data) {
          payment = data;
        } else {
          // Try matching by provider_transaction_id
          const { data: byTxn } = await supabase
            .from('payments')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('provider_transaction_id', paymentId)
            .select()
            .maybeSingle();
          if (byTxn) payment = byTxn;
        }
      } catch (e) {
        console.warn('[Admin API] Supabase payments table update notice:', e);
      }

      // 2. If approved, upgrade student profile and grant subscription
      if (action === 'approve') {
        const rawPayload = payment?.raw_webhook_payload || {};
        const candidateEmail = (
          inputStudentEmail ||
          payment?.user_id ||
          payment?.sender_name ||
          rawPayload.submitted_by ||
          rawPayload.email ||
          ''
        ).toLowerCase().trim();

        const candidatePhone = (
          inputStudentPhone ||
          payment?.sender_phone ||
          (candidateEmail && !candidateEmail.includes('@') ? candidateEmail : '')
        ).trim();

        const resolvedEmail = candidateEmail.includes('@') ? candidateEmail : '';

        // Find student in student_profiles
        let existingProf: any = null;
        if (resolvedEmail) {
          const { data } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('email', resolvedEmail)
            .maybeSingle();
          if (data) existingProf = data;
        }

        if (!existingProf && candidatePhone) {
          const { data } = await supabase
            .from('student_profiles')
            .select('*')
            .or(`phone.eq.${candidatePhone},email.eq.${candidatePhone},email.eq.${candidatePhone}@student.ethiolearn.edu.et`)
            .maybeSingle();
          if (data) existingProf = data;
        }

        const targetEmailToUpdate = existingProf?.email || resolvedEmail;
        const targetTier = inputTier || rawPayload.tier || 'pro_semester';
        const durationDays = targetTier === 'pro_annual' ? 365 : (targetTier === 'exam_season_pass' ? 60 : 120);

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        if (targetEmailToUpdate) {
          const updatedProfileData = {
            ...(existingProf?.profile_data || {}),
            isPro: true,
            proStatus: 'active',
            tier: targetTier,
            proPaymentDate: new Date().toISOString(),
            proStartDate: new Date().toISOString(),
            proEndDate: endDate.toISOString()
          };

          // Update student_profiles table (BOTH is_pro, pro_status and profile_data)
          await supabase
            .from('student_profiles')
            .upsert({
              email: targetEmailToUpdate,
              name: existingProf?.name || updatedProfileData.name || targetEmailToUpdate.split('@')[0],
              phone: candidatePhone || existingProf?.phone || updatedProfileData.phone || null,
              is_pro: true,
              pro_status: 'active',
              profile_data: updatedProfileData,
              updated_at: new Date().toISOString()
            }, { onConflict: 'email' });

          // Update profiles table (subscription_status = 'pro')
          try {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'pro',
                updated_at: new Date().toISOString()
              })
              .eq('email', targetEmailToUpdate);
          } catch (pErr) {}

          // Insert or update active subscription
          try {
            await supabase
              .from('subscriptions')
              .upsert({
                email: targetEmailToUpdate,
                tier: targetTier as any,
                status: 'active',
                subject_bundle_id: rawPayload.subject_bundle_id || null,
                start_date: new Date().toISOString(),
                end_date: endDate.toISOString(),
                payment_method: payment?.provider || 'telebirr',
                auto_renew: false
              }, { onConflict: 'email' });
          } catch (subErr) {}
        }
      }
    }

    return res.json({
      success: true,
      message: `Payment ${paymentId} ${action === 'approve' ? 'approved and Pro access activated' : 'rejected'}.`,
      payment: payment || { id: paymentId, status: newStatus }
    });
  } catch (error: any) {
    console.error('[Admin API] Payment action exception:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Fetch students for Admin user management
 */
export async function getAdminStudents(req: Request, res: Response) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.json({ success: true, students: [] });
    }

    const { q, role } = req.query;
    const { data, error } = await supabase
      .from('student_profiles')
      .select('email, profile_data, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('[Admin API] Failed to fetch student profiles:', error.message);
      return res.status(500).json({ error: error.message });
    }

    let results = (data || []).map(row => {
      const pd = row.profile_data || {};
      return {
        email: row.email,
        name: pd.name || row.email.split('@')[0],
        university: pd.university || 'Wolkite University',
        year: pd.year || 'Freshman',
        is_pro: Boolean(pd.isPro || pd.is_pro),
        user_role: pd.userRole || pd.user_role || (row.email === 'ezrat2116@gmail.com' ? 'super_admin' : 'student'),
        created_at: pd.createdAt || row.updated_at,
        updated_at: row.updated_at
      };
    });

    if (role && typeof role === 'string' && role !== 'all') {
      results = results.filter(s => s.user_role === role);
    }

    if (q && typeof q === 'string' && q.trim()) {
      const search = q.toLowerCase().trim();
      results = results.filter(s => 
        (s.name && s.name.toLowerCase().includes(search)) ||
        (s.email && s.email.toLowerCase().includes(search)) ||
        (s.university && s.university.toLowerCase().includes(search))
      );
    }

    return res.json({ success: true, students: results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Admin Course Creation & Update
 */
export async function handleAdminSaveCourse(req: Request, res: Response) {
  try {
    const course = req.body;
    if (!course || !course.title) {
      return res.status(400).json({ error: 'Course title is required.' });
    }

    const id = course.id || `course_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const dbPayload = {
      id,
      title: course.title.trim(),
      description: course.description || '',
      subject: course.subject || 'General',
      level: course.level || 'University',
      status: ['draft', 'published', 'archived'].includes(course.status) ? course.status : 'draft',
      lessons_count: Number(course.lessonsCount || course.lessons_count || 0),
      goal_days: Number(course.goalDays || course.goal_days || 14),
      instructor_id: course.instructorId || course.instructor_id || 'ezrat2116@gmail.com',
      instructor_name: course.instructorName || course.instructor_name || 'EthioLearn Faculty',
      thumbnail_url: course.thumbnailUrl || course.thumbnail_url || '',
      updated_at: now
    };

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      memoryCourses.set(id, dbPayload);
      return res.json({ success: true, course: dbPayload });
    }

    const { error } = await supabase
      .from('courses')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, course: dbPayload });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Admin Course Deletion
 */
export async function handleAdminDeleteCourse(req: Request, res: Response) {
  try {
    const courseId = req.params.id;
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID parameter required.' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      memoryCourses.delete(courseId);
      return res.json({ success: true, message: `Course ${courseId} deleted.` });
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, message: `Course ${courseId} deleted.` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Admin Coupons Management
 */
export async function handleAdminSaveCoupon(req: Request, res: Response) {
  try {
    const { code, discountPercentage, maxUses, expiresAt, isActive } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required.' });
    }

    const cleanCode = code.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
    const payload = {
      code: cleanCode,
      discount_percentage: Math.min(100, Math.max(1, Number(discountPercentage) || 20)),
      max_uses: Number(maxUses) || 100,
      expires_at: expiresAt || null,
      is_active: isActive !== false,
      updated_at: new Date().toISOString()
    };

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      memoryCoupons.set(cleanCode, payload);
      return res.json({ success: true, coupon: payload });
    }

    const { error } = await supabase
      .from('coupons')
      .upsert(payload, { onConflict: 'code' });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, coupon: payload });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleAdminDeleteCoupon(req: Request, res: Response) {
  try {
    const code = req.params.code;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code required.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      memoryCoupons.delete(cleanCode);
      return res.json({ success: true, message: `Coupon ${cleanCode} deleted.` });
    }

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('code', cleanCode);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, message: `Coupon ${cleanCode} deleted.` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Announcements Query (Public / Students & Admin)
 */
export async function handleGetAnnouncements(req: Request, res: Response) {
  try {
    let announcements: any[] = [];

    // 1. Try fetching from Supabase if connected
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          announcements = data.map((r: any) => ({
            id: String(r.id),
            title: r.title || 'Notice',
            message: r.message || '',
            badgeText: r.badge_text || r.badgeText || 'Notice',
            isImportant: Boolean(r.is_important ?? r.isImportant),
            status: r.status || 'published',
            date: r.date || (r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
            createdAt: r.created_at || new Date().toISOString()
          }));
        }
      } catch (e) {
        console.warn('[Admin Server] Supabase announcements fetch non-blocking warning:', e);
      }
    }

    // 2. Fallback to Disk & Memory if Supabase was empty or offline
    if (announcements.length === 0) {
      if (fs.existsSync(ANNOUNCEMENTS_DB_FILE)) {
        try {
          const raw = fs.readFileSync(ANNOUNCEMENTS_DB_FILE, 'utf8');
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) {
            announcements = list;
          }
        } catch (e) {}
      }
      if (announcements.length === 0 && memoryAnnouncements.size > 0) {
        announcements = Array.from(memoryAnnouncements.values());
      }
    }

    return res.json({ success: true, announcements });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Admin Announcements Management (Save / Publish Post)
 */
export async function handleAdminSaveAnnouncement(req: Request, res: Response) {
  try {
    const { id, title, message, badgeText, isImportant, status } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const payload = {
      id: id || `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      message: message.trim(),
      badge_text: badgeText || 'Notice',
      badgeText: badgeText || 'Notice',
      is_important: Boolean(isImportant),
      isImportant: Boolean(isImportant),
      status: ['published', 'draft', 'archived'].includes(status) ? status : 'published',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Always update in-memory and disk stores for 100% resilience
    memoryAnnouncements.set(payload.id, payload);
    saveAnnouncementToDisk(payload);

    // Sync to Supabase if connected
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('announcements')
          .upsert({
            id: payload.id,
            title: payload.title,
            message: payload.message,
            badge_text: payload.badge_text,
            is_important: payload.is_important,
            status: payload.status,
            date: payload.date,
            created_at: payload.created_at,
          }, { onConflict: 'id' });

        if (error) {
          console.warn('[Admin Server] Supabase announcement upsert notice (fallback preserved):', error.message);
        }
      } catch (sbErr: any) {
        console.warn('[Admin Server] Supabase write notice:', sbErr.message);
      }
    }

    return res.json({ success: true, announcement: payload });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleAdminDeleteAnnouncement(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Announcement ID required.' });
    }

    memoryAnnouncements.delete(id);
    removeAnnouncementFromDisk(id);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('announcements')
          .delete()
          .eq('id', id);
      } catch (e) {
        console.warn('[Admin Server] Supabase delete announcement notice:', e);
      }
    }

    return res.json({ success: true, message: `Announcement ${id} deleted.` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Admin Student Management: Update Pro status, role, or subscription
 */
export async function handleAdminUpdateStudent(req: Request, res: Response) {
  try {
    const { email, isPro, userRole, durationDays } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Student email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Fetch existing profile to update profile_data
    const { data: existingProf } = await supabase
      .from('student_profiles')
      .select('profile_data')
      .eq('email', cleanEmail)
      .maybeSingle();

    const existingPd = existingProf?.profile_data || {};
    const updatedPd = {
      ...existingPd,
      ...(typeof isPro === 'boolean' ? { isPro, proStatus: isPro ? 'active' : 'inactive' } : {}),
      ...(userRole && ['student', 'admin', 'faculty', 'super_admin'].includes(userRole) ? { userRole } : {})
    };

    const { data: updatedProfile, error: profErr } = await supabase
      .from('student_profiles')
      .update({
        is_pro: Boolean(isPro),
        pro_status: isPro ? 'active' : 'inactive',
        profile_data: updatedPd,
        updated_at: new Date().toISOString()
      })
      .eq('email', cleanEmail)
      .select()
      .maybeSingle();

    if (profErr) {
      console.warn('[Admin API] student_profiles update error:', profErr.message);
    }

    // Also mirror to `profiles` table to ensure 100% auth sync compatibility
    try {
      await supabase
        .from('profiles')
        .update({
          subscription_status: isPro ? 'pro' : 'free',
          updated_at: new Date().toISOString()
        })
        .eq('email', cleanEmail);
    } catch (pErr) {}

    // If upgrading to Pro, create active subscription record
    if (isPro) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (Number(durationDays) || 30));

      await supabase
        .from('subscriptions')
        .upsert({
          email: cleanEmail,
          tier: 'pro_semester',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          payment_method: 'admin_manual_grant',
          auto_renew: false
        }, { onConflict: 'email' });
    }

    return res.json({
      success: true,
      message: `Student ${cleanEmail} updated successfully.`,
      student: updatedProfile || { email: cleanEmail, profile_data: updatedPd }
    });
  } catch (error: any) {
    console.error('[Admin API] Update student error:', error);
    return res.status(500).json({ error: error.message });
  }
}

