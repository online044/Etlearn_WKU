/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Server-Side Admin Management & Data Operations
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin, isAdministratorEmail, ADMIN_EMAILS } from './security';

// Resilient in-memory fallback stores
const memoryAnnouncements = new Map<string, any>();
const memoryCourses = new Map<string, any>();
const memoryCoupons = new Map<string, any>();

const DB_DIR = path.join(process.cwd(), 'storage', 'db');
export const ANNOUNCEMENTS_DB_FILE = path.join(DB_DIR, 'announcements.json');
export const PAYMENTS_DB_FILE = path.join(DB_DIR, 'payments.json');
export const STUDENTS_DB_FILE = path.join(DB_DIR, 'students.json');

function ensureDbDirectory() {
  if (!fs.existsSync(DB_DIR)) {
    try {
      fs.mkdirSync(DB_DIR, { recursive: true });
    } catch (e) { /* ignore */ }
  }
}

export function loadPaymentsFromDisk(): any[] {
  try {
    ensureDbDirectory();
    if (fs.existsSync(PAYMENTS_DB_FILE)) {
      const raw = fs.readFileSync(PAYMENTS_DB_FILE, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn('[Admin Server] Failed to read payments from disk:', e);
  }
  return [];
}

export function savePaymentToDisk(payment: any): any {
  try {
    ensureDbDirectory();
    const list = loadPaymentsFromDisk();
    const payId = payment.id || payment.provider_transaction_id;
    const idx = list.findIndex((p: any) => 
      (payment.id && p.id === payment.id) || 
      (payment.provider_transaction_id && (p.provider_transaction_id === payment.provider_transaction_id || p.providerTxnId === payment.provider_transaction_id))
    );
    const updated = {
      ...(idx >= 0 ? list[idx] : {}),
      ...payment,
      updated_at: new Date().toISOString()
    };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    fs.writeFileSync(PAYMENTS_DB_FILE, JSON.stringify(list, null, 2), 'utf8');
    return updated;
  } catch (e) {
    console.warn('[Admin Server] Failed to save payment to disk:', e);
    return payment;
  }
}

export function loadStudentsFromDisk(): any[] {
  try {
    ensureDbDirectory();
    if (fs.existsSync(STUDENTS_DB_FILE)) {
      const raw = fs.readFileSync(STUDENTS_DB_FILE, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn('[Admin Server] Failed to read students from disk:', e);
  }
  return [];
}

export function saveStudentToDisk(student: any): any {
  try {
    ensureDbDirectory();
    const list = loadStudentsFromDisk();
    const cleanEmail = (student.email || '').toLowerCase().trim();
    if (!cleanEmail) return student;

    const idx = list.findIndex((s: any) => (s.email || '').toLowerCase().trim() === cleanEmail);
    const existing = idx >= 0 ? list[idx] : {};
    const updated = {
      ...existing,
      ...student,
      email: cleanEmail,
      profile_data: {
        ...(existing.profile_data || {}),
        ...(student.profile_data || {}),
        email: cleanEmail
      },
      updated_at: new Date().toISOString()
    };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    fs.writeFileSync(STUDENTS_DB_FILE, JSON.stringify(list, null, 2), 'utf8');
    return updated;
  } catch (e) {
    console.warn('[Admin Server] Failed to save student to disk:', e);
    return student;
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
/**
 * Fetch real aggregate statistics from Supabase & Disk
 */
export async function getAdminStats(req: Request, res: Response) {
  try {
    const contentStats = getLocalContentStats();
    const diskPayments = loadPaymentsFromDisk();
    const diskStudents = loadStudentsFromDisk();

    let publishedCourses = 0;
    let draftCourses = 0;
    let studentCount = diskStudents.length;
    let lessonsCount = 0;
    let totalRevenueETB = 0;
    let pendingPaymentsCount = 0;
    let totalPaymentsCount = diskPayments.length;
    const recentActivity: any[] = [];

    // Calculate revenue & counts from disk first
    diskPayments.forEach(p => {
      if (p.status === 'completed') {
        totalRevenueETB += Number(p.amount || 0);
      } else if (p.status === 'pending') {
        pendingPaymentsCount++;
      }
    });

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { count: sCount } = await supabase
          .from('student_profiles')
          .select('*', { count: 'exact', head: true });
        if (typeof sCount === 'number' && sCount > studentCount) studentCount = sCount;

        const { data: courseStats } = await supabase
          .from('courses')
          .select('status');

        if (courseStats) {
          publishedCourses = courseStats.filter(c => c.status === 'published').length;
          draftCourses = courseStats.filter(c => c.status === 'draft').length;
        }

        const { count: lCount } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true });
        if (typeof lCount === 'number') lessonsCount = lCount;

        const { data: supaPayments } = await supabase
          .from('payments')
          .select('id, amount, status, created_at, user_id, provider');

        if (supaPayments && supaPayments.length > 0) {
          const combinedPayMap = new Map<string, any>();
          diskPayments.forEach(p => combinedPayMap.set(p.id, p));
          supaPayments.forEach(p => combinedPayMap.set(p.id, p));

          totalRevenueETB = 0;
          pendingPaymentsCount = 0;
          totalPaymentsCount = combinedPayMap.size;

          combinedPayMap.forEach(p => {
            if (p.status === 'completed') {
              totalRevenueETB += Number(p.amount || 0);
            } else if (p.status === 'pending') {
              pendingPaymentsCount++;
            }
          });
        }
      } catch (sErr) {
        console.warn('[Admin API] Stats Supabase query notice:', sErr);
      }
    }

    if (diskPayments.length > 0) {
      const sorted = [...diskPayments].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 8);
      sorted.forEach(p => {
        recentActivity.push({
          id: `act_${p.id}`,
          type: p.status === 'completed' ? 'payment_approved' : 'payment_pending',
          title: p.status === 'completed' ? 'Payment Verified' : 'Payment Submitted',
          description: `${p.user_id || p.sender_name} - ${p.amount} ETB via ${p.provider}`,
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
        activeAnnouncementsCount: memoryAnnouncements.size,
        activeCouponsCount: memoryCoupons.size,
        recentActivity
      }
    });
  } catch (error: any) {
    console.error('[Admin API] Stats query error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Fetch all payments for Administrator Review (Reads from Disk + Supabase)
 */
export async function getAdminPayments(req: Request, res: Response) {
  try {
    const diskPayments = loadPaymentsFromDisk();
    const payMap = new Map<string, any>();

    diskPayments.forEach(p => {
      const key = p.id || p.provider_transaction_id;
      if (key) payMap.set(key, p);
    });

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          data.forEach(p => {
            const key = p.id || p.provider_transaction_id;
            const existing = payMap.get(key) || {};
            payMap.set(key, { ...existing, ...p });
          });
        }
      } catch (sErr) {
        console.warn('[Admin API] Supabase payments query notice:', sErr);
      }
    }

    const allPayments = Array.from(payMap.values()).sort((a, b) => {
      return new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime();
    });

    return res.json({ success: true, payments: allPayments });
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

    const newStatus = action === 'approve' ? 'completed' : 'failed';

    // 1. Update/Save payment on Disk Store first
    const diskPayments = loadPaymentsFromDisk();
    let payment = diskPayments.find((p: any) => 
      p.id === paymentId || 
      p.provider_transaction_id === paymentId || 
      p.providerTxnId === paymentId
    ) || null;

    if (!payment) {
      payment = {
        id: paymentId,
        user_id: inputStudentEmail || 'Student',
        sender_name: inputStudentEmail ? inputStudentEmail.split('@')[0] : 'Student',
        sender_phone: inputStudentPhone || null,
        status: newStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else {
      payment.status = newStatus;
      payment.updated_at = new Date().toISOString();
    }
    savePaymentToDisk(payment);

    // 2. Sync to Supabase payments table if available
    const supabase = getSupabaseAdmin();
    if (supabase) {
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
    }

    // 3. If approved, upgrade student profile and grant subscription across disk & Supabase
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
      const targetTier = inputTier || rawPayload.tier || 'pro_semester';
      const durationDays = targetTier === 'pro_annual' ? 365 : (targetTier === 'exam_season_pass' ? 60 : 120);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      if (resolvedEmail) {
        // Update/Save to disk student store
        const diskStudents = loadStudentsFromDisk();
        const existingDiskStudent = diskStudents.find((s: any) => (s.email || '').toLowerCase().trim() === resolvedEmail);
        const updatedPd = {
          ...(existingDiskStudent?.profile_data || {}),
          email: resolvedEmail,
          isPro: true,
          proStatus: 'active',
          tier: targetTier,
          proPaymentDate: new Date().toISOString(),
          proStartDate: new Date().toISOString(),
          proEndDate: endDate.toISOString()
        };

        saveStudentToDisk({
          email: resolvedEmail,
          name: existingDiskStudent?.name || updatedPd.name || resolvedEmail.split('@')[0],
          phone: candidatePhone || existingDiskStudent?.phone || updatedPd.phone || null,
          is_pro: true,
          pro_status: 'active',
          tier: targetTier,
          profile_data: updatedPd,
          subscription: {
            tier: targetTier,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString()
          }
        });

        // Sync to Supabase if available
        if (supabase) {
          try {
            await supabase
              .from('student_profiles')
              .upsert({
                email: resolvedEmail,
                name: existingDiskStudent?.name || updatedPd.name || resolvedEmail.split('@')[0],
                phone: candidatePhone || existingDiskStudent?.phone || updatedPd.phone || null,
                is_pro: true,
                pro_status: 'active',
                profile_data: updatedPd,
                updated_at: new Date().toISOString()
              }, { onConflict: 'email' });

            await supabase
              .from('profiles')
              .update({
                subscription_status: 'pro',
                updated_at: new Date().toISOString()
              })
              .eq('email', resolvedEmail);

            await supabase
              .from('subscriptions')
              .upsert({
                email: resolvedEmail,
                tier: targetTier as any,
                status: 'active',
                subject_bundle_id: rawPayload.subject_bundle_id || null,
                start_date: new Date().toISOString(),
                end_date: endDate.toISOString(),
                payment_method: payment?.provider || 'telebirr',
                auto_renew: false
              }, { onConflict: 'email' });
          } catch (supSyncErr) {
            console.warn('[Admin API] Supabase student pro sync notice:', supSyncErr);
          }
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
 * Fetch students for Admin user management (Reads from Disk + Supabase)
 */
export async function getAdminStudents(req: Request, res: Response) {
  try {
    const diskStudents = loadStudentsFromDisk();
    const studentMap = new Map<string, any>();

    // Seed designated admins so they are always visible in students list
    ADMIN_EMAILS.forEach(adm => {
      const email = adm.toLowerCase();
      studentMap.set(email, {
        email,
        name: email.startsWith('ezrat') ? 'Ezra (Lead Admin)' : 'Abreham (Admin)',
        university: 'Wolkite University',
        year: 'Faculty / Admin',
        is_pro: true,
        user_role: 'super_admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    diskStudents.forEach(st => {
      const email = (st.email || '').toLowerCase().trim();
      if (!email) return;
      const pd = st.profile_data || {};
      const isAdm = isAdministratorEmail(email);
      studentMap.set(email, {
        email,
        name: st.name || pd.name || email.split('@')[0],
        university: st.university || pd.university || 'Wolkite University',
        year: st.year || pd.year || 'Freshman',
        is_pro: isAdm ? true : Boolean(st.is_pro || pd.isPro || pd.is_pro),
        user_role: isAdm ? 'super_admin' : (st.user_role || pd.userRole || pd.user_role || 'student'),
        created_at: st.created_at || pd.createdAt || new Date().toISOString(),
        updated_at: st.updated_at || new Date().toISOString()
      });
    });

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('student_profiles')
          .select('email, name, university, year, is_pro, user_role, profile_data, updated_at, created_at')
          .order('updated_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          data.forEach(row => {
            const email = (row.email || '').toLowerCase().trim();
            if (!email) return;
            const pd = row.profile_data || {};
            const isAdm = isAdministratorEmail(email);
            const prev = studentMap.get(email) || {};
            studentMap.set(email, {
              ...prev,
              email,
              name: row.name || pd.name || prev.name || email.split('@')[0],
              university: row.university || pd.university || prev.university || 'Wolkite University',
              year: row.year || pd.year || prev.year || 'Freshman',
              is_pro: isAdm ? true : Boolean(row.is_pro || pd.isPro || pd.is_pro || prev.is_pro),
              user_role: isAdm ? 'super_admin' : (row.user_role || pd.userRole || pd.user_role || prev.user_role || 'student'),
              created_at: row.created_at || pd.createdAt || prev.created_at || row.updated_at,
              updated_at: row.updated_at || prev.updated_at
            });
          });
        }
      } catch (sErr) {
        console.warn('[Admin API] Supabase student profiles query notice:', sErr);
      }
    }

    let results = Array.from(studentMap.values()).sort((a, b) => {
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    });

    const { q, role } = req.query;
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
    const isAdm = isAdministratorEmail(cleanEmail);
    const finalIsPro = isAdm ? true : Boolean(isPro);
    const finalRole = isAdm ? 'super_admin' : (userRole && ['student', 'admin', 'faculty', 'super_admin'].includes(userRole) ? userRole : 'student');

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (Number(durationDays) || 30));

    // 1. Always update Disk Student Store first (Guaranteed resilience!)
    const diskStudents = loadStudentsFromDisk();
    const existing = diskStudents.find((s: any) => (s.email || '').toLowerCase().trim() === cleanEmail);
    const existingPd = existing?.profile_data || {};

    const updatedPd = {
      ...existingPd,
      email: cleanEmail,
      isPro: finalIsPro,
      proStatus: finalIsPro ? 'active' : 'inactive',
      tier: finalIsPro ? 'pro_semester' : 'free',
      userRole: finalRole,
      proEndDate: finalIsPro ? endDate.toISOString() : undefined,
      proPaymentDate: finalIsPro ? new Date().toISOString() : existingPd.proPaymentDate
    };

    const updatedDiskStudent = saveStudentToDisk({
      email: cleanEmail,
      name: existing?.name || updatedPd.name || cleanEmail.split('@')[0],
      phone: existing?.phone || updatedPd.phone || null,
      is_pro: finalIsPro,
      pro_status: finalIsPro ? 'active' : 'inactive',
      user_role: finalRole,
      tier: finalIsPro ? 'pro_semester' : 'free',
      profile_data: updatedPd,
      subscription: finalIsPro ? {
        tier: 'pro_semester',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        payment_method: 'admin_manual_grant'
      } : null
    });

    // 2. If Supabase is available, sync to Supabase (student_profiles, profiles, subscriptions)
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('student_profiles')
          .upsert({
            email: cleanEmail,
            name: updatedDiskStudent.name,
            phone: updatedDiskStudent.phone,
            is_pro: finalIsPro,
            pro_status: finalIsPro ? 'active' : 'inactive',
            user_role: finalRole,
            profile_data: updatedPd,
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });

        await supabase
          .from('profiles')
          .update({
            subscription_status: finalIsPro ? 'pro' : 'free',
            updated_at: new Date().toISOString()
          })
          .eq('email', cleanEmail);

        if (finalIsPro) {
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
      } catch (supErr) {
        console.warn('[Admin API] Supabase student update sync notice:', supErr);
      }
    }

    return res.json({
      success: true,
      message: `Student ${cleanEmail} Pro status successfully updated to ${finalIsPro ? 'Active' : 'Inactive'}.`,
      student: {
        email: cleanEmail,
        name: updatedDiskStudent.name,
        is_pro: finalIsPro,
        isPro: finalIsPro,
        user_role: finalRole,
        profile_data: updatedPd
      }
    });
  } catch (error: any) {
    console.error('[Admin API] Update student error:', error);
    return res.status(500).json({ error: error.message });
  }
}


