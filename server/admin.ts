/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Server-Side Admin Management & Data Operations
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from './security';

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
    const { paymentId, action } = req.body;
    if (!paymentId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Valid paymentId and action (approve/reject) required.' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const newStatus = action === 'approve' ? 'completed' : 'failed';

    // 1. Update payment status
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', paymentId)
      .select()
      .single();

    if (payErr || !payment) {
      return res.status(404).json({ error: 'Payment record not found or update failed.' });
    }

    // 2. If approved, upgrade student profile and grant subscription
    if (action === 'approve') {
      const studentEmail = (payment.user_id || '').toLowerCase().trim();
      if (studentEmail) {
        // Fetch existing profile to update profile_data.isPro safely
        const { data: existingProf } = await supabase
          .from('student_profiles')
          .select('profile_data')
          .eq('email', studentEmail)
          .maybeSingle();

        const updatedProfileData = {
          ...(existingProf?.profile_data || {}),
          isPro: true,
          proStatus: 'active'
        };

        await supabase
          .from('student_profiles')
          .update({ profile_data: updatedProfileData, updated_at: new Date().toISOString() })
          .eq('email', studentEmail);

        // Calculate subscription end date (30 days standard, 21 days for exam pass)
        const rawPayload = payment.raw_webhook_payload || {};
        const tier = rawPayload.tier || 'pro_monthly';
        const durationDays = tier === 'exam_season_pass' ? 21 : 30;

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        // Insert or update active subscription
        await supabase
          .from('subscriptions')
          .insert({
            email: studentEmail,
            tier: tier as any,
            status: 'active',
            subject_bundle_id: rawPayload.subject_bundle_id || null,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            payment_method: payment.provider,
            auto_renew: false
          });
      }
    }

    return res.json({
      success: true,
      message: `Payment ${paymentId} ${action === 'approve' ? 'approved and Pro access activated' : 'rejected'}.`,
      payment
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

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Database unavailable' });
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
      return res.status(500).json({ error: 'Database unavailable' });
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
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Database unavailable' });
    }

    const payload = {
      code: cleanCode,
      discount_percentage: Math.min(100, Math.max(1, Number(discountPercentage) || 20)),
      max_uses: Number(maxUses) || 100,
      expires_at: expiresAt || null,
      is_active: isActive !== false,
      updated_at: new Date().toISOString()
    };

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

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Database unavailable' });
    }

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('code', code.toUpperCase().trim());

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, message: `Coupon ${code} deleted.` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Admin Announcements Management
 */
export async function handleAdminSaveAnnouncement(req: Request, res: Response) {
  try {
    const { id, title, message, badgeText, isImportant, status } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Database unavailable' });
    }

    const payload = {
      id: id || `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      message: message.trim(),
      badge_text: badgeText || 'Notice',
      is_important: Boolean(isImportant),
      status: ['published', 'draft', 'archived'].includes(status) ? status : 'published',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('announcements')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return res.status(500).json({ error: error.message });
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

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Database unavailable' });
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
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
        profile_data: updatedPd,
        updated_at: new Date().toISOString()
      })
      .eq('email', cleanEmail)
      .select()
      .maybeSingle();

    if (profErr) {
      return res.status(500).json({ error: profErr.message });
    }

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

