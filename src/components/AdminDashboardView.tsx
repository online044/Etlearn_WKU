import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, ShieldCheck, ShieldAlert, CreditCard, Tag, Bell, BookOpen, BarChart3, Search, CheckCircle, 
  XCircle, Plus, Trash2, Award, ArrowUpRight, Lock, Key, RefreshCw, AlertCircle, Sparkles, 
  Send, Edit3, Eye, Archive, Check, Database, Copy, ExternalLink, Clock, Layers, FileText,
  HelpCircle, Building2
} from 'lucide-react';
import { 
  StudentProfile, CouponCode, PlatformAnnouncement, CourseRecord, LessonRecord, 
  AdminDashboardStats, CourseStatus, BookRecord, ExamSheetRecord, NoteRecord 
} from '../types';
import { isAdministratorEmail, ADMIN_EMAIL } from '../utils/adminAuth';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { 
  fetchAdminDashboardStats, fetchAdminCourses, createCourse, updateCourse, 
  publishCourse, unpublishCourse, archiveCourse, deleteCourse, fetchCourseLessons, 
  saveLesson, fetchAdminStudents, adminUpdateStudentProfile, fetchAdminPayments, updatePaymentStatus, 
  fetchCoupons, createCoupon, deleteCoupon, fetchAnnouncements, createAnnouncement, 
  deleteAnnouncement 
} from '../utils/supabaseCourses';
import { fetchAdminBooks, fetchAdminExams, fetchAdminNotes } from '../utils/contentStore';
import AdminBooksSection from './admin/AdminBooksSection';
import AdminExamsSection from './admin/AdminExamsSection';
import AdminNotesSection from './admin/AdminNotesSection';
import { AdminQuestionBankSection } from './AdminQuestionBankSection';
import { testSupabaseConnection, ETHIOLEARN_SUPABASE_SQL_SCRIPT, getSupabase, getAuthHeaders, syncAuthSessionWithServer } from '../utils/supabaseClient';
import { notesRepository } from '../repositories/notesRepository';
import { safeStorage } from '../utils/safeStorage';
import { DEFAULT_UNIVERSITIES, syncUniversitiesWithSupabase } from '../repositories/universitiesRepository';

interface AdminDashboardViewProps {
  currentProfile: StudentProfile;
  language: 'en' | 'am' | 'both';
  onClose: () => void;
  onUpdateProfile?: (updated: StudentProfile) => void;
}

export default function AdminDashboardView({
  currentProfile,
  language,
  onClose,
  onUpdateProfile
}: AdminDashboardViewProps) {
  const isAmharic = language === 'am';
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'books' | 'exams' | 'notes' | 'users' | 'payments' | 'announcements' | 'database' | 'questions'>('overview');

  // Loading & Sync States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [exams, setExams] = useState<ExamSheetRecord[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalStudents: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalLessons: 0,
    totalRevenueETB: 0,
    pendingPaymentsCount: 0,
    totalPaymentsCount: 0,
    activeAnnouncementsCount: 0,
    activeCouponsCount: 0,
    recentActivity: []
  });

  // Database Diagnosis & Configuration state
  const [dbDiag, setDbDiag] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    details?: string;
    tablesFound: string[];
    needsSqlSetup: boolean;
    rlsWriteOk?: boolean;
  } | null>(null);
  const [dbDiagCounts, setDbDiagCounts] = useState<Record<string, number>>({});
  const [showSqlCopied, setShowSqlCopied] = useState(false);
  const [dbUrlInput, setDbUrlInput] = useState(() => safeStorage.getItem('ethiolearn_supabase_url') || '');
  const [dbKeyInput, setDbKeyInput] = useState(() => safeStorage.getItem('ethiolearn_supabase_key') || '');
  const [dbTesting, setDbTesting] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);
  const [dbSyncing, setDbSyncing] = useState(false);
  const [dbSyncSuccess, setDbSyncSuccess] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // COURSES MANAGEMENT STATE
  // --------------------------------------------------------------------------
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [courseFilter, setCourseFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [courseSearch, setCourseSearch] = useState('');
  const [isPublishingMap, setIsPublishingMap] = useState<Record<string, boolean>>({});

  // Create / Edit Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseRecord | null>(null);
  const [courseFormTitle, setCourseFormTitle] = useState('');
  const [courseFormSubject, setCourseFormSubject] = useState('');
  const [courseFormLevel, setCourseFormLevel] = useState<'Grade 12' | 'University' | 'Grade 12 New Curriculum' | 'Common Courses'>('University');
  const [courseFormDescription, setCourseFormDescription] = useState('');
  const [courseFormGoalDays, setCourseFormGoalDays] = useState('14');
  const [courseFormStatus, setCourseFormStatus] = useState<CourseStatus>('draft');
  const [courseFormLessonsText, setCourseFormLessonsText] = useState('');
  const [courseFormSaving, setCourseFormSaving] = useState(false);

  // Manage Lessons Modal
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<CourseRecord | null>(null);
  const [courseLessons, setCourseLessons] = useState<LessonRecord[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('15m');
  const [savingLesson, setSavingLesson] = useState(false);

  // --------------------------------------------------------------------------
  // STUDENTS STATE
  // --------------------------------------------------------------------------
  const [students, setStudents] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'pro' | 'free' | 'admin'>('all');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentActionLoading, setStudentActionLoading] = useState<Record<string, boolean>>({});

  // --------------------------------------------------------------------------
  // PAYMENTS STATE
  // --------------------------------------------------------------------------
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [paymentActionLoading, setPaymentActionLoading] = useState<Record<string, boolean>>({});
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // COUPONS STATE
  // --------------------------------------------------------------------------
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('20');
  const [newMaxUses, setNewMaxUses] = useState('50');
  const [couponSaving, setCouponSaving] = useState(false);

  // --------------------------------------------------------------------------
  // ADMIN AUTHENTICATION STATE
  // --------------------------------------------------------------------------
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(currentProfile?.email && isAdministratorEmail(currentProfile.email));
  });
  const [adminAuthInput, setAdminAuthInput] = useState(ADMIN_EMAIL);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);

  // --------------------------------------------------------------------------
  // ANNOUNCEMENTS STATE
  // --------------------------------------------------------------------------
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annBadge, setAnnBadge] = useState('Notice');
  const [annImportant, setAnnImportant] = useState(true);
  const [annSaving, setAnnSaving] = useState(false);
  const [annSuccessMsg, setAnnSuccessMsg] = useState<string | null>(null);
  const [annEditingId, setAnnEditingId] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // DATA FETCHING & SYNCHRONIZATION
  // --------------------------------------------------------------------------
  const loadAllAdminData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);

    try {
      // Parallel queries to Supabase & CMS
      const [
        liveStats, 
        liveCourses, 
        liveCoupons, 
        liveAnnouncements, 
        livePayments, 
        liveStudents,
        liveBooks,
        liveExams,
        liveNotes
      ] = await Promise.all([
        fetchAdminDashboardStats(),
        fetchAdminCourses(),
        fetchCoupons(),
        fetchAnnouncements(),
        fetchAdminPayments(),
        fetchAdminStudents(userSearch),
        fetchAdminBooks(),
        fetchAdminExams(),
        fetchAdminNotes()
      ]);

      setStats(liveStats);
      setCourses(liveCourses);
      setCoupons(liveCoupons);
      setAnnouncements(liveAnnouncements);
      setPayments(livePayments);
      setStudents(liveStudents);
      setBooks(liveBooks);
      setExams(liveExams);
      setNotes(liveNotes);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userSearch]);

  useEffect(() => {
    if (!isAdministratorEmail(currentProfile?.email)) return;
    loadAllAdminData();
    // Test Supabase connection on open
    testSupabaseConnection().then(res => {
      setDbDiag({ tested: true, ...res });
    });
  }, [loadAllAdminData, currentProfile?.email]);

  // --------------------------------------------------------------------------
  // COURSE ACTIONS (Duplicate-proof)
  // --------------------------------------------------------------------------
  const handleOpenCreateCourse = () => {
    setEditingCourse(null);
    setCourseFormTitle('');
    setCourseFormSubject('');
    setCourseFormLevel('University');
    setCourseFormDescription('');
    setCourseFormGoalDays('14');
    setCourseFormStatus('draft');
    setCourseFormLessonsText('');
    setShowCourseModal(true);
  };

  const handleOpenEditCourse = (course: CourseRecord) => {
    setEditingCourse(course);
    setCourseFormTitle(course.title);
    setCourseFormSubject(course.subject);
    setCourseFormLevel(course.level);
    setCourseFormDescription(course.description);
    setCourseFormGoalDays(course.goalDays.toString());
    setCourseFormStatus(course.status);
    setCourseFormLessonsText('');
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseFormTitle.trim() || !courseFormSubject.trim()) {
      alert(isAmharic ? 'እባክዎን የኮርሱን ርዕስ እና የትምህርት አይነት ያስገቡ!' : 'Please enter course title and subject!');
      return;
    }

    setCourseFormSaving(true);
    playClickChime();

    try {
      if (editingCourse) {
        // UPDATE existing record by exact ID (never create duplicate)
        const res = await updateCourse(editingCourse.id, {
          title: courseFormTitle.trim(),
          subject: courseFormSubject.trim(),
          level: courseFormLevel,
          description: courseFormDescription.trim(),
          goalDays: parseInt(courseFormGoalDays, 10) || 14,
          status: courseFormStatus,
        });

        if (res.success) {
          playSuccessChime();
          // Update in-place in local state
          setCourses(prev => prev.map(c => c.id === editingCourse.id ? {
            ...c,
            title: courseFormTitle.trim(),
            subject: courseFormSubject.trim(),
            level: courseFormLevel,
            description: courseFormDescription.trim(),
            goalDays: parseInt(courseFormGoalDays, 10) || 14,
            status: courseFormStatus,
            updatedAt: new Date().toISOString(),
          } : c));
          setShowCourseModal(false);
          loadAllAdminData(true);
        } else {
          alert(`Error updating course: ${res.error}`);
        }
      } else {
        // CREATE new course with stable unique ID
        const res = await createCourse({
          title: courseFormTitle.trim(),
          subject: courseFormSubject.trim(),
          level: courseFormLevel,
          description: courseFormDescription.trim(),
          goalDays: parseInt(courseFormGoalDays, 10) || 14,
          status: courseFormStatus,
          instructorId: currentProfile.email || 'admin',
          instructorName: currentProfile.name || 'EthioLearn Faculty',
        });

        if (res.success && res.course) {
          playSuccessChime();
          const createdCourse = res.course;

          // If initial lessons were provided, parse and save them
          if (courseFormLessonsText.trim()) {
            const lines = courseFormLessonsText.split('\n').map(l => l.trim()).filter(Boolean);
            for (let i = 0; i < lines.length; i++) {
              await saveLesson(createdCourse.id, {
                title: lines[i],
                chapterNumber: i + 1,
                content: `Overview and core objectives for ${lines[i]}.`,
                status: 'published'
              });
            }
          }

          setCourses(prev => [createdCourse, ...prev.filter(c => c.id !== createdCourse.id)]);
          setShowCourseModal(false);
          loadAllAdminData(true);
        } else {
          alert(`Error creating course: ${res.error}`);
        }
      }
    } catch (err) {
      console.error(err);
      playFailureChime();
    } finally {
      setCourseFormSaving(false);
    }
  };

  /**
   * Toggle Publish Status (with in-flight lock to prevent double clicks)
   */
  const handleTogglePublish = async (course: CourseRecord) => {
    if (isPublishingMap[course.id]) return; // In-flight lock
    playClickChime();

    setIsPublishingMap(prev => ({ ...prev, [course.id]: true }));
    const newStatus: CourseStatus = course.status === 'published' ? 'draft' : 'published';

    try {
      const res = newStatus === 'published' 
        ? await publishCourse(course.id) 
        : await unpublishCourse(course.id);

      if (res.success) {
        playSuccessChime();
        // Mutate exact record in local state
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c));
        // Refresh aggregate stats
        setStats(prev => ({
          ...prev,
          publishedCourses: newStatus === 'published' ? prev.publishedCourses + 1 : Math.max(0, prev.publishedCourses - 1),
          draftCourses: newStatus === 'draft' ? prev.draftCourses + 1 : Math.max(0, prev.draftCourses - 1),
        }));
      } else {
        alert(`Could not update publication state: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
      playFailureChime();
    } finally {
      setIsPublishingMap(prev => ({ ...prev, [course.id]: false }));
    }
  };

  const handleArchiveCourse = async (course: CourseRecord) => {
    if (isPublishingMap[course.id]) return;
    if (!confirm(`Are you sure you want to archive "${course.title}"? Students will no longer see it in active lists.`)) return;

    setIsPublishingMap(prev => ({ ...prev, [course.id]: true }));
    try {
      const res = await archiveCourse(course.id);
      if (res.success) {
        playSuccessChime();
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: 'archived', updatedAt: new Date().toISOString() } : c));
        loadAllAdminData(true);
      }
    } finally {
      setIsPublishingMap(prev => ({ ...prev, [course.id]: false }));
    }
  };

  const handleDeleteCourse = async (course: CourseRecord) => {
    if (!confirm(`⚠️ Permanently delete "${course.title}" from Supabase? This action cannot be undone.`)) return;
    playClickChime();

    try {
      const res = await deleteCourse(course.id);
      if (res.success) {
        playSuccessChime();
        setCourses(prev => prev.filter(c => c.id !== course.id));
        loadAllAdminData(true);
      } else {
        alert(`Error deleting course: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // LESSONS MANAGEMENT MODAL
  // --------------------------------------------------------------------------
  const handleOpenLessons = async (course: CourseRecord) => {
    setSelectedCourseForLessons(course);
    setLoadingLessons(true);
    setNewLessonTitle('');
    setNewLessonContent('');
    try {
      const lessons = await fetchCourseLessons(course.id, true);
      setCourseLessons(lessons);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForLessons || !newLessonTitle.trim()) return;

    setSavingLesson(true);
    playClickChime();

    try {
      const nextChapterNum = courseLessons.length + 1;
      const res = await saveLesson(selectedCourseForLessons.id, {
        title: newLessonTitle.trim(),
        content: newLessonContent.trim() || `Course material for chapter ${nextChapterNum}.`,
        chapterNumber: nextChapterNum,
        duration: newLessonDuration || '15m',
        status: 'published',
      });

      if (res.success && res.lesson) {
        playSuccessChime();
        const saved = res.lesson;
        setCourseLessons(prev => [...prev.filter(l => l.id !== saved.id), saved]);
        setNewLessonTitle('');
        setNewLessonContent('');
        // Update parent course lessons count
        setCourses(prev => prev.map(c => c.id === selectedCourseForLessons.id ? { ...c, lessonsCount: c.lessonsCount + 1 } : c));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingLesson(false);
    }
  };

  // --------------------------------------------------------------------------
  // PAYMENTS ACTIONS
  // --------------------------------------------------------------------------
  const handleApprovePayment = async (id: string) => {
    playSuccessChime();
    setPaymentActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const paymentItem = payments.find(p => p.id === id);
      await updatePaymentStatus(id, 'completed', paymentItem);
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'completed' } : p));
      
      // If the approved payment belongs to the current profile, update currentProfile immediately
      if (paymentItem && currentProfile) {
        const userEmail = (paymentItem.user_id || paymentItem.userId || paymentItem.email || '').toLowerCase().trim();
        const userPhone = (paymentItem.sender_phone || paymentItem.senderPhone || '').trim();
        const myEmail = (currentProfile.email || '').toLowerCase().trim();
        const myPhone = (currentProfile.phone || '').trim();
        if ((userEmail && userEmail === myEmail) || (userPhone && myPhone && (userPhone.includes(myPhone) || myPhone.includes(userPhone)))) {
          const updated: StudentProfile = {
            ...currentProfile,
            isPro: true,
            tier: (paymentItem.tier as any) || 'pro_semester',
            proStatus: 'active',
            proPaymentDate: new Date().toISOString()
          };
          onUpdateProfile?.(updated);
        }
      }

      loadAllAdminData(true);
    } finally {
      setPaymentActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDeclinePayment = async (id: string) => {
    playFailureChime();
    setPaymentActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const paymentItem = payments.find(p => p.id === id);
      await updatePaymentStatus(id, 'failed', paymentItem);
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'failed' } : p));
      loadAllAdminData(true);
    } finally {
      setPaymentActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // --------------------------------------------------------------------------
  // COUPONS ACTIONS
  // --------------------------------------------------------------------------
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setCouponSaving(true);
    playClickChime();

    const discountPct = parseInt(newDiscount, 10) || 20;
    const created: CouponCode = {
      code: newCode.trim().toUpperCase(),
      discountPercentage: discountPct,
      fixedDiscountETB: Math.round((80 * discountPct) / 100),
      description: discountPct === 100 
        ? '100% Full Academic Scholarship Pass' 
        : `${discountPct}% Campus Promotional Discount`,
      maxUses: parseInt(newMaxUses, 10) || 50,
      usedCount: 0,
      expiresAt: '2026-12-31',
      isActive: true
    };

    try {
      const res = await createCoupon(created);
      if (res.success) {
        playSuccessChime();
        setCoupons(prev => [created, ...prev.filter(c => c.code !== created.code)]);
        setNewCode('');
        loadAllAdminData(true);
      }
    } finally {
      setCouponSaving(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    playClickChime();
    await deleteCoupon(code);
    setCoupons(prev => prev.filter(c => c.code !== code));
    loadAllAdminData(true);
  };

  // --------------------------------------------------------------------------
  // ADMIN AUTHENTICATION HANDLER
  // --------------------------------------------------------------------------
  const handleAuthenticateAdmin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsVerifyingAdmin(true);
    setAuthError(null);
    playClickChime();

    try {
      // Sync cryptographically signed token with backend for ezrat2116@gmail.com
      await syncAuthSessionWithServer({
        email: ADMIN_EMAIL,
        displayName: 'Ezra (Platform Administrator)',
        role: 'super_admin'
      });

      const adminProfile: StudentProfile = {
        name: currentProfile?.name || 'Ezra (Platform Administrator)',
        email: ADMIN_EMAIL,
        university: currentProfile?.university || 'Wolkite University',
        year: currentProfile?.year || 'Administration / Faculty',
        grade: 'University (Admin)',
        stream: 'Natural',
        subjects: currentProfile?.subjects || ['Platform Management', 'Computer Science', 'Curriculum Design'],
        claudeApiKey: currentProfile?.claudeApiKey || '',
        dailyGoalHours: currentProfile?.dailyGoalHours || 4,
        theme: currentProfile?.theme || 'dark',
        language: currentProfile?.language || 'both',
        ...(currentProfile || {}),
        id: currentProfile?.id || 'admin_ezra',
        isPro: true,
        userRole: 'super_admin'
      };

      safeStorage.setItem('ethiolearn_admin_session', ADMIN_EMAIL);
      safeStorage.setItem('ethiolearn_admin_auth', 'true');
      safeStorage.setItem('ethiolearn_active_email', ADMIN_EMAIL);
      safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(adminProfile));

      if (onUpdateProfile) {
        onUpdateProfile(adminProfile);
      }

      setIsAdminAuthenticated(true);
      playSuccessChime();
      loadAllAdminData();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate admin session');
      playFailureChime();
    } finally {
      setIsVerifyingAdmin(false);
    }
  };

  const handleLogoutAdmin = () => {
    safeStorage.removeItem('ethiolearn_admin_session');
    safeStorage.removeItem('ethiolearn_admin_auth');
    setIsAdminAuthenticated(false);
    playClickChime();
    onClose();
  };

  // --------------------------------------------------------------------------
  // ANNOUNCEMENTS ACTIONS
  // --------------------------------------------------------------------------
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    setAnnSaving(true);
    playClickChime();

    try {
      const res = await createAnnouncement({
        id: annEditingId || undefined,
        title: annTitle.trim(),
        message: annMessage.trim(),
        badgeText: annBadge,
        isImportant: annImportant,
        status: 'published',
      });

      if (res.success && res.announcement) {
        playSuccessChime();
        setAnnouncements(prev => {
          const filtered = prev.filter(a => a.id !== res.announcement!.id);
          return [res.announcement!, ...filtered];
        });
        setAnnTitle('');
        setAnnMessage('');
        setAnnEditingId(null);
        setAnnSuccessMsg(isAmharic ? 'ማስታወቂያው በተሳካ ሁኔታ ታትሟል!' : 'Post published successfully! Live to all students.');
        setTimeout(() => setAnnSuccessMsg(null), 5000);
        loadAllAdminData(true);
      } else {
        alert(res.error || 'Failed to publish post.');
      }
    } catch (err: any) {
      console.error('[Admin Announcement Error]:', err);
      playFailureChime();
      alert(`Error publishing post: ${err.message || 'Unknown network error'}`);
    } finally {
      setAnnSaving(false);
    }
  };

  const handleEditAnnouncement = (ann: PlatformAnnouncement) => {
    setAnnEditingId(ann.id);
    setAnnTitle(ann.title);
    setAnnMessage(ann.message);
    setAnnBadge(ann.badgeText || 'Notice');
    setAnnImportant(Boolean(ann.isImportant));
    playClickChime();
  };

  const handleCancelEditAnnouncement = () => {
    setAnnEditingId(null);
    setAnnTitle('');
    setAnnMessage('');
    setAnnBadge('Notice');
    playClickChime();
  };

  const applyQuickAnnouncementTemplate = (template: { title: string; message: string; badge: string; important: boolean }) => {
    setAnnTitle(template.title);
    setAnnMessage(template.message);
    setAnnBadge(template.badge);
    setAnnImportant(template.important);
    playClickChime();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    playClickChime();
    await deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    loadAllAdminData(true);
  };

  // --------------------------------------------------------------------------
  // STUDENT USER ACTIONS (1-Click Pro Toggle)
  // --------------------------------------------------------------------------
  const handleToggleStudentPro = async (student: any) => {
    const studentEmail = (student.email || '').toLowerCase().trim();
    if (!studentEmail) return;

    const currentPro = Boolean(student.is_pro || student.isPro);
    const newPro = !currentPro;

    playClickChime();
    setStudentActionLoading(prev => ({ ...prev, [studentEmail]: true }));

    try {
      const res = await adminUpdateStudentProfile(studentEmail, { isPro: newPro });
      if (res.success) {
        if (newPro) playSuccessChime();
        else playClickChime();

        setStudents(prev => prev.map(s => {
          if ((s.email || '').toLowerCase().trim() === studentEmail) {
            return {
              ...s,
              is_pro: newPro,
              isPro: newPro
            };
          }
          return s;
        }));

        // If the modified user is currently active profile, update it
        if (currentProfile && (currentProfile.email || '').toLowerCase().trim() === studentEmail) {
          const updated: StudentProfile = {
            ...currentProfile,
            isPro: newPro,
            tier: newPro ? 'pro_semester' : 'free',
            proStatus: newPro ? 'active' : 'none'
          };
          onUpdateProfile?.(updated);
        }

        loadAllAdminData(true);
      } else {
        alert(res.error || 'Failed to update student Pro status.');
      }
    } finally {
      setStudentActionLoading(prev => ({ ...prev, [studentEmail]: false }));
    }
  };

  // --------------------------------------------------------------------------
  // DATABASE SYSTEM ACTIONS & DIAGNOSTICS
  // --------------------------------------------------------------------------
  const handleRunDatabaseDiagnostics = async () => {
    setDbTesting(true);
    playClickChime();
    try {
      // 1. Try server diagnostic first
      let serverResult: any = null;
      try {
        const sRes = await fetch('/api/db/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: dbUrlInput.trim(), key: dbKeyInput.trim() })
        });
        if (sRes.ok) {
          serverResult = await sRes.json();
        }
      } catch (err) {}

      // 2. Try client-side diagnostic
      const clientResult = await testSupabaseConnection(dbUrlInput.trim(), dbKeyInput.trim());

      const tablesFound = Array.from(new Set([
        ...(clientResult.tablesFound || []),
        ...(serverResult?.tablesFound || [])
      ]));

      const isSuccess = (serverResult && serverResult.success) || (clientResult.success && !clientResult.needsSqlSetup);
      const isRlsBlocked = clientResult.message.includes('Row-Level Security') || serverResult?.message?.includes('Row-Level Security');

      setDbDiag({
        tested: true,
        success: isSuccess,
        message: serverResult?.message || clientResult.message,
        details: serverResult?.details || clientResult.details,
        tablesFound,
        needsSqlSetup: clientResult.needsSqlSetup || isRlsBlocked || tablesFound.length === 0,
        rlsWriteOk: serverResult?.rlsWriteOk ?? !isRlsBlocked
      });

      if (serverResult?.counts) {
        setDbDiagCounts(serverResult.counts);
      }

      if (isSuccess) {
        playSuccessChime();
      } else {
        playFailureChime();
      }
    } finally {
      setDbTesting(false);
    }
  };

  const handleSaveDatabaseCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = dbUrlInput.trim();
    const cleanKey = dbKeyInput.trim();

    if (!cleanUrl || !cleanKey) {
      alert('Please provide both the Supabase Project URL and Anon/Service Key.');
      return;
    }

    if (!cleanUrl.startsWith('https://')) {
      alert('Supabase Project URL must start with https://');
      return;
    }

    setDbSaving(true);
    playClickChime();

    try {
      // 1. Save to local storage for browser client
      safeStorage.setItem('ethiolearn_supabase_url', cleanUrl);
      safeStorage.setItem('ethiolearn_supabase_key', cleanKey);

      // 2. Notify backend server
      try {
        await fetch('/api/db/configure', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ url: cleanUrl, key: cleanKey })
        });
      } catch (e) {}

      playSuccessChime();
      setDbSyncSuccess('Supabase credentials saved successfully! Running diagnostics...');
      setTimeout(() => setDbSyncSuccess(null), 4000);

      // Automatically run diagnostics with new credentials
      await handleRunDatabaseDiagnostics();
      loadAllAdminData(true);
    } catch (err: any) {
      alert(`Error saving credentials: ${err.message}`);
    } finally {
      setDbSaving(false);
    }
  };

  const handleSyncLocalDataToSupabase = async () => {
    setDbSyncing(true);
    playClickChime();
    try {
      const supa = getSupabase();
      let syncedProfiles = 0;
      let syncedCourses = 0;
      let syncedPayments = 0;
      let syncedAnnouncements = 0;

      // 1. Sync accounts to student_profiles
      const rawAccounts = safeStorage.getItem('ethiolearn_accounts');
      if (rawAccounts) {
        try {
          const accs = JSON.parse(rawAccounts);
          if (Array.isArray(accs)) {
            for (const acc of accs) {
              const prof = acc.profile || {};
              const email = (acc.email || prof.email || '').toLowerCase().trim();
              if (email) {
                try {
                  await fetch('/api/db/student-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email,
                      name: prof.name || email.split('@')[0],
                      university: prof.university || 'Wolkite University',
                      year: prof.year || 'Freshman',
                      subjects: prof.subjects || [],
                      isPro: Boolean(prof.isPro || isAdministratorEmail(email)),
                      userRole: isAdministratorEmail(email) ? 'super_admin' : (prof.userRole || 'student'),
                      profileData: prof,
                      url: dbUrlInput.trim(),
                      key: dbKeyInput.trim()
                    })
                  });
                  syncedProfiles++;
                } catch (e) {}
              }
            }
          }
        } catch (e) {}
      }

      // 2. Sync courses if supa available
      if (supa && courses.length > 0) {
        for (const c of courses) {
          try {
            await supa.from('courses').upsert({
              id: c.id,
              title: c.title,
              description: c.description || '',
              subject: c.subject,
              level: c.level || 'University',
              status: c.status || 'published',
              lessons_count: c.lessonsCount || 0,
              goal_days: c.goalDays || 14,
              instructor_name: c.instructorName || 'EthioLearn Faculty',
              thumbnail_url: c.thumbnailUrl || '',
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
            syncedCourses++;
          } catch (e) {}
        }
      }

      // 3. Sync announcements
      if (supa && announcements.length > 0) {
        for (const a of announcements) {
          try {
            await supa.from('announcements').upsert({
              id: a.id,
              title: a.title,
              message: a.message,
              badge_text: a.badgeText || 'Notice',
              is_important: Boolean(a.isImportant),
              status: a.status || 'published',
              date: a.date || new Date().toISOString().split('T')[0]
            }, { onConflict: 'id' });
            syncedAnnouncements++;
          } catch (e) {}
        }
      }

      playSuccessChime();
      setDbSyncSuccess(`Sync completed! Synced ${syncedProfiles} student profiles, ${syncedCourses} courses, and ${syncedAnnouncements} announcements to Supabase.`);
      setTimeout(() => setDbSyncSuccess(null), 6000);
      await handleRunDatabaseDiagnostics();
      loadAllAdminData(true);
    } catch (e: any) {
      alert(`Sync encountered error: ${e.message}`);
    } finally {
      setDbSyncing(false);
    }
  };

  const [dbSeedingNotes, setDbSeedingNotes] = useState(false);
  const handleSeedCurriculumNotes = async () => {
    setDbSeedingNotes(true);
    playClickChime();
    try {
      const res = await notesRepository.adminSeedAllCurriculumData();
      playSuccessChime();
      setDbSyncSuccess(`Successfully seeded ${res.subjectsCount} subjects, ${res.chaptersCount} chapters, and ${res.notesCount} notes into Supabase.`);
      setTimeout(() => setDbSyncSuccess(null), 6000);
      await handleRunDatabaseDiagnostics();
      loadAllAdminData(true);
    } catch (e: any) {
      playFailureChime();
      alert(`Seeding error: ${e.message}`);
    } finally {
      setDbSeedingNotes(false);
    }
  };

  const [dbSeedingUnis, setDbSeedingUnis] = useState(false);
  const handleSeedUniversities = async () => {
    setDbSeedingUnis(true);
    playClickChime();
    setDbSyncSuccess(null);
    try {
      const supa = getSupabase();
      if (!supa) {
        alert('Supabase not connected. Please configure URL and Key first.');
        setDbSeedingUnis(false);
        return;
      }
      let inserted = 0;
      const validUnis = DEFAULT_UNIVERSITIES.filter(u => u.id !== 'uni-general');

      for (const u of validUnis) {
        // Omit string id because universities.id in Supabase is an auto-incrementing identity integer
        const payload: { name: string; domain?: string; logo_url: string } = {
          name: u.name,
          domain: u.domain,
          logo_url: u.logoUrl
        };
        const { error } = await supa.from('universities').upsert(payload, { onConflict: 'name' });
        if (!error) inserted++;
      }

      // Also persist to ethiolearn_sync cloud table for cross-device persistence
      await supa.from('ethiolearn_sync').upsert({
        email: 'universities_registry_sync@ethiolearn.internal',
        data: validUnis.map(u => ({
          name: u.name,
          domain: u.domain,
          logo_url: u.logoUrl,
          short_name: u.shortName,
          city: u.city,
          accent_color: u.accentColor,
          updated_at: Date.now()
        })),
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

      await syncUniversitiesWithSupabase();
      playSuccessChime();
      setDbSyncSuccess(`Successfully synchronized ${inserted > 0 ? inserted : validUnis.length} universities and official logos with Supabase & cached for 100% offline access!`);
      setTimeout(() => setDbSyncSuccess(null), 6000);
      await handleRunDatabaseDiagnostics();
    } catch (e: any) {
      playFailureChime();
      alert(`Universities seed notice: ${e.message}`);
    } finally {
      setDbSeedingUnis(false);
    }
  };

  // --------------------------------------------------------------------------
  // FILTERED LISTS
  // --------------------------------------------------------------------------
  const filteredCourses = courses.filter(c => {
    const matchesFilter = courseFilter === 'all' || c.status === courseFilter;
    const q = courseSearch.toLowerCase().trim();
    const matchesSearch = !q || c.title.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const filteredStudents = students.filter(s => {
    const q = userSearch.toLowerCase().trim();
    const matchesSearch = !q || 
      (s.name && s.name.toLowerCase().includes(q)) || 
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.university && s.university.toLowerCase().includes(q));

    const isPro = Boolean(s.is_pro || s.isPro);
    const isAdmin = isAdministratorEmail(s.email) || s.user_role === 'admin' || s.userRole === 'admin';

    let matchesType = true;
    if (userFilter === 'pro') matchesType = isPro;
    else if (userFilter === 'free') matchesType = !isPro;
    else if (userFilter === 'admin') matchesType = isAdmin;

    return matchesSearch && matchesType;
  });

  const filteredPayments = payments.filter(p => {
    if (paymentFilter === 'all') return true;
    return p.status === paymentFilter;
  });

  // Security Guard: Check if administrator is authorized or authenticated
  const isAuthorized = isAdministratorEmail(currentProfile?.email);
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-950 border border-red-500/30 rounded-3xl p-6 text-center space-y-5 shadow-2xl relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/10 blur-3xl pointer-events-none rounded-full" />

          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto shadow-inner shadow-red-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              {isAmharic ? 'የአስተዳዳሪ ብቻ' : 'Restricted Admin Access'}
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {isAmharic ? 'የተከለከለ መዳረሻ' : 'Access Restricted'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed px-2">
              {isAmharic 
                ? `ይህ የአስተዳዳሪ ማዕከል ለተፈቀደለት አስተዳዳሪ (${ADMIN_EMAIL}) ብቻ የሚሰራ ነው። እባክዎ በአስተዳዳሪ አካውንትዎ ይግቡ።`
                : `This console is strictly restricted to the platform administrator (${ADMIN_EMAIL}). Your current account does not have administrative permissions.`}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isAmharic ? 'ወደ መተግበሪያው ተመለስ' : 'Return to Application'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-6xl bg-slate-950 border border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* ─── HEADER ─── */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  ET_LEARN Unified Management Console
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
                  Supabase Live
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {ADMIN_EMAIL}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Single Source of Truth Database Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAllAdminData(false)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh all data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={handleLogoutAdmin}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-red-400 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              title="Switch user or lock admin"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'ውጣ' : 'Switch Mode'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── NAVIGATION TABS ─── */}
        <div className="flex items-center px-4 sm:px-6 bg-slate-950/90 border-b border-slate-800 overflow-x-auto scrollbar-none gap-1 sm:gap-2">
          <button
            onClick={() => { playClickChime(); setActiveTab('overview'); }}
            className={`px-3.5 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview & Live Stats</span>
          </button>

          <button
            onClick={() => { playClickChime(); setActiveTab('courses'); }}
            className={`px-3.5 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'courses'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Courses & Publishing ({courses.length})</span>
            {stats.draftCourses > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono">
                {stats.draftCourses} draft
              </span>
            )}
          </button>

          <button
            onClick={() => { playClickChime(); setActiveTab('books'); }}
            className={`px-3.5 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'books'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Books ({books.length})</span>
            {books.filter(b => b.status === 'draft').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono">
                {books.filter(b => b.status === 'draft').length} draft
              </span>
            )}
          </button>

          <button
            onClick={() => { playClickChime(); setActiveTab('exams'); }}
            className={`px-3.5 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'exams'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Exam Sheets ({exams.length})</span>
            {exams.filter(e => e.status === 'draft').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono">
                {exams.filter(e => e.status === 'draft').length} draft
              </span>
            )}
          </button>

          <button
            onClick={() => { playClickChime(); setActiveTab('questions'); }}
            className={`px-3.5 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'questions'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Question Bank (Supabase)</span>
          </button>

          <button
            onClick={() => { playClickChime(); setActiveTab('notes'); }}
            className={`px-3.5 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'notes'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Study Notes ({notes.length})</span>
            {notes.filter(n => n.status === 'draft').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono">
                {notes.filter(n => n.status === 'draft').length} draft
              </span>
            )}
          </button>

          <button
            onClick={() => { playClickChime(); setActiveTab('users'); }}
            className={`px-3.5 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students ({stats.totalStudents})</span>
          </button>

          <button
            onClick={() => { playClickChime(); setActiveTab('payments'); }}
            className={`px-3.5 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'payments'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments ({stats.pendingPaymentsCount} pending)</span>
          </button>


          <button
            onClick={() => { playClickChime(); setActiveTab('announcements'); }}
            className={`px-3.5 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'announcements'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Announcements ({announcements.length})</span>
          </button>

          <button
            onClick={() => { playClickChime(); setActiveTab('database'); }}
            className={`px-3.5 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'database'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Schema & SQL Setup</span>
          </button>
        </div>

        {/* ─── MAIN CONTENT BODY ─── */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ================================================================ */}
          {/* TAB 1: OVERVIEW & LIVE STATS                                    */}
          {/* ================================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Real Stat Cards (Zero on empty, never fake numbers) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-sm">
                  <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
                    <span>Registered Students</span>
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                  </p>
                  <p className="text-2xl font-black text-white">{stats.totalStudents}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Live Supabase profiles
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-sm">
                  <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
                    <span>Published Courses</span>
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  </p>
                  <p className="text-2xl font-black text-emerald-400">{stats.publishedCourses}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {stats.draftCourses} draft courses in queue
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-sm">
                  <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
                    <span>Total Revenue</span>
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  </p>
                  <p className="text-2xl font-black text-amber-400">{stats.totalRevenueETB.toLocaleString()} ETB</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {stats.pendingPaymentsCount} pending verification
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-sm">
                  <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
                    <span>Curriculum Lessons</span>
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                  </p>
                  <p className="text-2xl font-black text-sky-400">{stats.totalLessons}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Across all database courses
                  </span>
                </div>
              </div>

              {/* Database Status Banner */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Supabase PostgreSQL Integration Status</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    {dbDiag?.success 
                      ? `Connected to database. Tables: [${dbDiag.tablesFound.join(', ') || 'Ready'}]` 
                      : 'Connecting to Supabase instance or using resilient local state.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('database')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    View SQL Script
                  </button>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 ${
                    dbDiag?.success ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${dbDiag?.success ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    {dbDiag?.success ? 'DATABASE SYNCHRONIZED' : 'LOCAL CACHE ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Recent Activity Log */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Live Database Activity Stream</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">Real-time DB logs</span>
                </div>

                {stats.recentActivity.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No recent database events recorded yet. Create courses or invite students to see live events.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {stats.recentActivity.map(act => (
                      <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-200">{act.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{act.description}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: COURSES & PUBLISHING (Complete Duplicate-Proof CMS)       */}
          {/* ================================================================ */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              {/* Action & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Search courses..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
                    {(['all', 'published', 'draft', 'archived'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => { playClickChime(); setCourseFilter(f); }}
                        className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer text-[11px] ${
                          courseFilter === f ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleOpenCreateCourse}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Course</span>
                </button>
              </div>

              {/* Course Cards Grid */}
              {filteredCourses.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">No Courses Found in this Category</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Create Course" above to author a new curriculum track with real Supabase database persistence.
                  </p>
                  <button
                    onClick={handleOpenCreateCourse}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Author First Course
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCourses.map(course => {
                    const isPublishing = Boolean(isPublishingMap[course.id]);
                    return (
                      <div 
                        key={course.id}
                        className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                                {course.subject} • {course.level}
                              </span>
                              <h4 className="text-sm font-bold text-white mt-0.5">{course.title}</h4>
                            </div>

                            {/* Status Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase shrink-0 border ${
                              course.status === 'published'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : course.status === 'draft'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {course.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {course.description || 'No description provided.'}
                          </p>

                          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                            <span>ID: <span className="text-slate-300">{course.id.substring(0, 14)}...</span></span>
                            <span>Lessons: <span className="text-slate-300">{course.lessonsCount}</span></span>
                            <span>Goal: <span className="text-slate-300">{course.goalDays}d</span></span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditCourse(course)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                              title="Edit Course Metadata"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleOpenLessons(course)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                              title="Manage Lessons"
                            >
                              <Layers className="w-3.5 h-3.5 text-sky-400" />
                              <span>Lessons ({course.lessonsCount})</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Publish / Unpublish Toggle with Duplicate Prevention Lock */}
                            <button
                              onClick={() => handleTogglePublish(course)}
                              disabled={isPublishing}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                                course.status === 'published'
                                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-400'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              } disabled:opacity-50`}
                            >
                              {isPublishing ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : course.status === 'published' ? (
                                <>
                                  <Archive className="w-3.5 h-3.5" />
                                  <span>Unpublish</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Publish Live</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDeleteCourse(course)}
                              className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/40 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                              title="Delete Course"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2B: BOOKS & CURRICULUM MODULES (Database Driven CMS)        */}
          {/* ================================================================ */}
          {activeTab === 'books' && (
            <AdminBooksSection
              books={books}
              onRefresh={() => loadAllAdminData(true)}
              isAmharic={isAmharic}
            />
          )}

          {/* ================================================================ */}
          {/* TAB 2C: EXAM SHEETS & PAST PAPERS (Database Driven CMS)         */}
          {/* ================================================================ */}
          {activeTab === 'exams' && (
            <AdminExamsSection
              exams={exams}
              onRefresh={() => loadAllAdminData(true)}
              isAmharic={isAmharic}
            />
          )}

          {/* ================================================================ */}
          {/* TAB 2D: STUDY NOTES & LECTURE SUMMARIES (Database Driven CMS)    */}
          {/* ================================================================ */}
          {activeTab === 'notes' && (
            <AdminNotesSection
              notes={notes}
              onRefresh={() => loadAllAdminData(true)}
              isAmharic={isAmharic}
            />
          )}

          {/* ================================================================ */}
          {/* TAB 3: REAL REGISTERED STUDENTS                                 */}
          {/* ================================================================ */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by student name, email, campus..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {(['all', 'pro', 'free', 'admin'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setUserFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        userFilter === f 
                          ? 'bg-amber-500 text-slate-950 shadow-xs' 
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {f === 'all' ? `All (${students.length})` : f === 'pro' ? 'Pro Pass' : f === 'free' ? 'Free Tier' : 'Admins'}
                    </button>
                  ))}
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="py-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                  {userSearch ? 'No students matched your search or filter.' : 'No registered student profiles found in Supabase yet.'}
                </div>
              ) : (
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Email & Auth</th>
                        <th className="px-4 py-3">University / Campus</th>
                        <th className="px-4 py-3">Tier</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {filteredStudents.map((st, idx) => {
                        const isPro = Boolean(st.is_pro || st.isPro);
                        const isStudentUpdating = Boolean(studentActionLoading[st.email?.toLowerCase()]);
                        const isUserAdmin = isAdministratorEmail(st.email);

                        return (
                          <tr key={st.email || idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center shrink-0">
                                {(st.name || 'S')[0]}
                              </div>
                              <span className="truncate max-w-[140px]">{st.name || 'Student'}</span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-400">{st.email || 'N/A'}</td>
                            <td className="px-4 py-3 text-slate-300">{st.university || 'Wolkite University'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPro 
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {isPro ? 'PRO PASS' : 'FREE TIER'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-400 capitalize">{st.user_role || st.userRole || 'Student'}</td>
                            <td className="px-4 py-3 text-right">
                              {!isUserAdmin && (
                                <button
                                  onClick={() => handleToggleStudentPro(st)}
                                  disabled={isStudentUpdating}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border disabled:opacity-50 ${
                                    isPro
                                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30'
                                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-slate-950'
                                  }`}
                                >
                                  {isStudentUpdating ? 'Saving...' : isPro ? 'Revoke Pro' : 'Grant Pro Pass'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: REAL PAYMENTS VERIFICATION                               */}
          {/* ================================================================ */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    Payment Reconciliation & Receipt Approval Queue
                  </h3>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {payments.filter(p => p.status === 'pending').length} Pending
                  </span>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                  {(['all', 'pending', 'completed', 'failed'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setPaymentFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        paymentFilter === f 
                          ? 'bg-amber-500 text-slate-950 shadow-xs' 
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {f === 'all' ? `All (${payments.length})` : f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredPayments.length === 0 ? (
                <div className="py-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                  No payment transactions matched this filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPayments.map(p => {
                    const isProcessing = Boolean(paymentActionLoading[p.id]);
                    const couponCode = p.couponCode || p.coupon_code;
                    const originalAmt = p.originalAmount || p.original_amount;
                    const discountAmt = p.discountETB || p.discount_etb;
                    const receiptImg = p.receiptImage || p.receipt_image;

                    return (
                      <div key={p.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                              {p.provider || 'telebirr'} • {p.provider_transaction_id || p.providerTxnId || p.id}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-0.5">{p.sender_name || p.senderName || 'Student'}</h4>
                            <p className="text-xs text-slate-400 font-mono">{p.sender_phone || p.senderPhone || p.user_id}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'completed' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : p.status === 'failed'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Payment Amount</span>
                            {couponCode && originalAmt ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs line-through text-slate-500">{originalAmt} ETB</span>
                                <span className="text-emerald-400 font-black text-sm">{p.amount} ETB</span>
                              </div>
                            ) : (
                              <span className="text-emerald-400 font-black text-sm">{p.amount} ETB</span>
                            )}
                          </div>
                          {couponCode && (
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold block">
                                PROMO: {couponCode}
                              </span>
                              {discountAmt ? (
                                <span className="text-[10px] text-emerald-400">-{discountAmt} ETB OFF</span>
                              ) : null}
                            </div>
                          )}
                        </div>

                        {receiptImg && (
                          <div 
                            onClick={() => setSelectedReceiptImage(receiptImg)}
                            className="p-2 bg-slate-950 hover:bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center gap-3 cursor-pointer transition-colors"
                          >
                            <img 
                              src={receiptImg} 
                              alt="Receipt" 
                              className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0" 
                            />
                            <div className="text-xs">
                              <span className="font-bold text-slate-300 block">Bank / Telebirr Receipt Attached</span>
                              <span className="text-[10px] text-amber-400 hover:underline flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Click to view receipt preview
                              </span>
                            </div>
                          </div>
                        )}

                        {p.status === 'pending' && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleApprovePayment(p.id)}
                              disabled={isProcessing}
                              className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Verify & Upgrade Pro</span>
                            </button>
                            <button
                              onClick={() => handleDeclinePayment(p.id)}
                              disabled={isProcessing}
                              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-red-500/20 border border-slate-800 text-slate-400 hover:text-red-400 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}



          {/* ================================================================ */}
          {/* TAB 6: ANNOUNCEMENTS                                            */}
          {/* ================================================================ */}
          {/* TAB 6: BROADCAST ANNOUNCEMENTS & POSTS                          */}
          {/* ================================================================ */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              {/* Feedback Success Alert */}
              <AnimatePresence>
                {annSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300 text-xs shadow-lg shadow-emerald-500/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-200">{annSuccessMsg}</p>
                        <p className="text-[11px] text-emerald-400/80">Broadcasting to Wolkite University & nationwide student network</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setAnnSuccessMsg(null)}
                      className="p-1 text-emerald-400/60 hover:text-emerald-300 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Template Prompts */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAmharic ? 'ፈጣን የአብነት ማስታወቂያዎች' : 'Quick Broadcast Templates'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyQuickAnnouncementTemplate({
                      title: 'Wolkite University Midterm Exam Period',
                      message: 'Midterm exams begin next week. Access authentic past exams, answer keys, and chapter summaries in the Exam Prep section.',
                      badge: 'Exam Alert',
                      important: true
                    })}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-red-400 group-hover:text-red-300 flex items-center gap-1.5">
                      <span>🎯 Midterm Exam Notice</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate pt-0.5">Wolkite University exams starting</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyQuickAnnouncementTemplate({
                      title: 'New Department Lecture Notes Available',
                      message: 'Freshman and Pre-Engineering faculty notes for Applied Mathematics, General Physics, and C++ Programming have been uploaded.',
                      badge: 'New Content',
                      important: false
                    })}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1.5">
                      <span>📚 Department Notes</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate pt-0.5">Engineering & freshman resources</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyQuickAnnouncementTemplate({
                      title: 'EthioLearn Pro 2.5 System Update',
                      message: 'Enhanced offline exam simulator, instant AI Asgobnyi explanations, and fast Telebirr checkout are now fully activated.',
                      badge: 'System Update',
                      important: false
                    })}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-purple-400 group-hover:text-purple-300 flex items-center gap-1.5">
                      <span>🚀 Platform Update</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate pt-0.5">Offline mode & Telebirr live</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyQuickAnnouncementTemplate({
                      title: 'Freshman Study Advice from Asgobnyi',
                      message: 'Focus 20 minutes daily on past exam questions. Spaced repetition active recall improves retention by over 70% before finals.',
                      badge: 'Study Tip',
                      important: false
                    })}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1.5">
                      <span>💡 Asgobnyi Study Tip</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate pt-0.5">Spaced repetition advice</p>
                  </button>
                </div>
              </div>

              {/* Announcement Creation / Edit Form */}
              <form onSubmit={handleAddAnnouncement} className="p-5 rounded-2xl bg-slate-900/95 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        {annEditingId 
                          ? (isAmharic ? 'ማስታወቂያ አርትዕ' : 'Edit Announcement Post') 
                          : (isAmharic ? 'አዲስ ማስታወቂያ አትም' : 'Broadcast Announcement to All Students')}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {annEditingId ? 'Updating active broadcast' : 'Posts published here appear instantly in student notification feed'}
                      </p>
                    </div>
                  </div>
                  {annEditingId && (
                    <button
                      type="button"
                      onClick={handleCancelEditAnnouncement}
                      className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      {isAmharic ? 'ሰርዝ' : 'Cancel Edit'}
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      {isAmharic ? 'የማስታወቂያው ርዕስ' : 'Headline / Title'}
                    </label>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder={isAmharic ? 'ለምሳሌ፡ የወልቂጤ ዩኒቨርሲቲ የፈተና መርሃ ግብር' : 'e.g., Wolkite University Midterm Examination Timetable'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs font-semibold focus:border-amber-500/50 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      {isAmharic ? 'ዝርዝር መልእክት' : 'Detailed Announcement Message'}
                    </label>
                    <textarea
                      rows={3}
                      value={annMessage}
                      onChange={(e) => setAnnMessage(e.target.value)}
                      placeholder={isAmharic ? 'ለተማሪዎች የሚተላለፍ ዝርዝር መረጃ...' : 'Provide complete guidelines, dates, links, or instructions for students...'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:border-amber-500/50 outline-none transition-all placeholder:text-slate-600 leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                          Category Badge
                        </label>
                        <select
                          value={annBadge}
                          onChange={(e) => setAnnBadge(e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-xs font-semibold outline-none focus:border-amber-500/50 cursor-pointer"
                        >
                          <option value="Notice">Notice</option>
                          <option value="Exam Alert">Exam Alert</option>
                          <option value="New Content">New Content</option>
                          <option value="System Update">System Update</option>
                          <option value="Campus News">Campus News</option>
                          <option value="Study Tip">Study Tip</option>
                        </select>
                      </div>

                      <div className="pt-4">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={annImportant}
                            onChange={(e) => setAnnImportant(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500/20 bg-slate-950"
                          />
                          <span className="font-bold text-amber-300 flex items-center gap-1">
                            ⭐ {isAmharic ? 'አስፈላጊ ምልክት (High Priority Pin)' : 'Pin as High Priority Broadcast'}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={annSaving || !annTitle.trim() || !annMessage.trim()}
                        className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        {annSaving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{isAmharic ? 'በማተም ላይ...' : 'Publishing...'}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{annEditingId ? (isAmharic ? 'ለውጦችን መዝግብ' : 'Save Changes') : (isAmharic ? 'ማስታወቂያ አትም' : 'Publish Announcement')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Published Broadcasts Listing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAmharic ? 'የታተሙ ማስታወቂያዎች' : 'Published Announcements'} ({announcements.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Live across Web & Mobile App</span>
                </div>

                {announcements.length === 0 ? (
                  <div className="py-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
                    <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">No announcements published yet</p>
                    <p className="text-[11px] text-slate-500">Use the form or quick templates above to broadcast your first announcement.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {announcements.map((a) => {
                      const isExam = (a.badgeText || '').toLowerCase().includes('exam');
                      const isContent = (a.badgeText || '').toLowerCase().includes('content');
                      const isUpdate = (a.badgeText || '').toLowerCase().includes('update');
                      const isImportant = Boolean(a.isImportant);

                      return (
                        <div 
                          key={a.id} 
                          className={`p-4 rounded-2xl bg-slate-900/90 border transition-all ${
                            isImportant ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-slate-800'
                          } flex flex-col sm:flex-row sm:items-start justify-between gap-4`}
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                isExam ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                isContent ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                isUpdate ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {a.badgeText || 'Notice'}
                              </span>

                              {isImportant && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase">
                                  ⭐ High Priority
                                </span>
                              )}

                              <span className="text-[10px] font-mono text-slate-500">
                                {a.date || (a.createdAt ? a.createdAt.split('T')[0] : 'Today')}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-white tracking-tight">{a.title}</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">{a.message}</p>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
                            <button
                              onClick={() => handleEditAnnouncement(a)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 cursor-pointer transition-all border border-slate-700/60"
                              title="Edit announcement"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAnnouncement(a.id)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 cursor-pointer transition-all border border-slate-700/60"
                              title="Delete announcement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 7: DATABASE SYSTEM & SUPABASE CONTROL CENTER                 */}
          {/* ================================================================ */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              {/* Status & Quick Action Hero */}
              <div className="p-5 rounded-2xl bg-slate-900/95 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        dbDiag?.success ? 'bg-emerald-400 animate-pulse' : 
                        dbDiag?.needsSqlSetup ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
                      }`} />
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-amber-400" />
                        <span>Supabase PostgreSQL Database Management</span>
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure your cloud database, run real-time write/read diagnostics, and synchronize student records.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleRunDatabaseDiagnostics}
                      disabled={dbTesting}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer flex items-center gap-1.5 border border-slate-700 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${dbTesting ? 'animate-spin' : ''}`} />
                      <span>{dbTesting ? 'Testing DB...' : 'Test Connection & Schema'}</span>
                    </button>

                    <button
                      onClick={handleSyncLocalDataToSupabase}
                      disabled={dbSyncing}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs cursor-pointer flex items-center gap-1.5 border border-emerald-500/30 transition-all disabled:opacity-50"
                    >
                      <ArrowUpRight className={`w-3.5 h-3.5 ${dbSyncing ? 'animate-spin' : ''}`} />
                      <span>{dbSyncing ? 'Syncing...' : 'Sync Local Data to Supabase'}</span>
                    </button>

                    <button
                      onClick={handleSeedCurriculumNotes}
                      disabled={dbSeedingNotes}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs cursor-pointer flex items-center gap-1.5 border border-amber-500/30 transition-all disabled:opacity-50"
                      title="Seed university curriculum notes, chapters, and subjects to Supabase"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${dbSeedingNotes ? 'animate-spin' : ''}`} />
                      <span>{dbSeedingNotes ? 'Seeding Notes...' : 'Seed University Notes'}</span>
                    </button>

                    <button
                      onClick={handleSeedUniversities}
                      disabled={dbSeedingUnis}
                      className="px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs cursor-pointer flex items-center gap-1.5 border border-blue-500/30 transition-all disabled:opacity-50"
                      title="Seed and sync Ethiopian universities & official logos to Supabase"
                    >
                      <Building2 className={`w-3.5 h-3.5 ${dbSeedingUnis ? 'animate-spin' : ''}`} />
                      <span>{dbSeedingUnis ? 'Syncing...' : 'Sync Universities & Logos'}</span>
                    </button>
                  </div>
                </div>

                {/* Feedback Alerts */}
                {dbSyncSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{dbSyncSuccess}</span>
                  </div>
                )}

                {/* Live Diagnostic Results Card */}
                {dbDiag && (
                  <div className={`p-4 rounded-xl border ${
                    dbDiag.success 
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                      : dbDiag.needsSqlSetup 
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' 
                        : 'bg-red-950/30 border-red-500/40 text-red-200'
                  } space-y-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        {dbDiag.success ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs font-bold">{dbDiag.message}</p>
                          {dbDiag.details && (
                            <p className="text-[11px] opacity-90 mt-1">{dbDiag.details}</p>
                          )}
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        dbDiag.success 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {dbDiag.success ? 'Operational' : 'Action Required'}
                      </span>
                    </div>

                    {/* Table Status Badges */}
                    {dbDiag.tablesFound && dbDiag.tablesFound.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">
                          Verified Active Database Tables:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {dbDiag.tablesFound.map(tbl => (
                            <span 
                              key={tbl} 
                              className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>{tbl}</span>
                              {typeof dbDiagCounts[tbl] === 'number' && (
                                <span className="text-amber-400 text-[10px] font-bold">({dbDiagCounts[tbl]})</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Supabase API Credentials Configuration */}
              <form onSubmit={handleSaveDatabaseCredentials} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      <span>Supabase API Configuration</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Set your Supabase Project URL and Anon Key to enable live persistence across all devices.
                    </p>
                  </div>
                  <a 
                    href="https://supabase.com/dashboard" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Supabase Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono block mb-1">
                      Project URL (e.g. https://your-project.supabase.co)
                    </label>
                    <input
                      type="url"
                      required
                      value={dbUrlInput}
                      onChange={(e) => setDbUrlInput(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs font-mono outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-mono block mb-1">
                      Supabase Anon / Service Key
                    </label>
                    <input
                      type="password"
                      required
                      value={dbKeyInput}
                      onChange={(e) => setDbKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={dbSaving || !dbUrlInput.trim() || !dbKeyInput.trim()}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{dbSaving ? 'Saving & Testing...' : 'Save & Verify API Configuration'}</span>
                  </button>
                </div>
              </form>

              {/* 3-Step Setup Guide & Master SQL Script */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-400" />
                      <span>PostgreSQL Master Database Schema (Supabase SQL Script)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      This script initializes all 16 production tables (<span className="font-mono text-amber-400">student_profiles</span>, <span className="font-mono text-amber-400">courses</span>, <span className="font-mono text-amber-400">lessons</span>, <span className="font-mono text-amber-400">payments</span>, <span className="font-mono text-amber-400">coupons</span>, <span className="font-mono text-amber-400">announcements</span>, <span className="font-mono text-amber-400">books</span>, <span className="font-mono text-amber-400">exams</span>, <span className="font-mono text-amber-400">questions</span>, <span className="font-mono text-amber-400">subjects</span>, <span className="font-mono text-amber-400">chapters</span>, <span className="font-mono text-amber-400">notes</span>, <span className="font-mono text-amber-400">user_note_state</span>, <span className="font-mono text-amber-400">highlights</span>, <span className="font-mono text-amber-400">reader_settings</span>), the <span className="font-mono text-amber-400">search_notes</span> full-text RPC, and storage buckets (<span className="font-mono text-amber-400">books</span>, <span className="font-mono text-amber-400">exams</span>, <span className="font-mono text-amber-400">note-images</span>).
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(ETHIOLEARN_SUPABASE_SQL_SCRIPT);
                      setShowSqlCopied(true);
                      setTimeout(() => setShowSqlCopied(false), 2500);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    {showSqlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-950" />}
                    <span>{showSqlCopied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                  </button>
                </div>

                {/* 3 Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400">STEP 1</span>
                    <h5 className="text-xs font-bold text-white">Open SQL Editor</h5>
                    <p className="text-[11px] text-slate-400">
                      Go to your Supabase Dashboard project and click the <strong>SQL Editor</strong> tab on the left sidebar.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400">STEP 2</span>
                    <h5 className="text-xs font-bold text-white">Paste SQL Script</h5>
                    <p className="text-[11px] text-slate-400">
                      Click <strong>+ New Query</strong>, paste the copied SQL script into the query window.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400">STEP 3</span>
                    <h5 className="text-xs font-bold text-white">Click Run</h5>
                    <p className="text-[11px] text-slate-400">
                      Hit the green <strong>Run</strong> button. Tables and open RLS policies will be instantly generated!
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-72 overflow-y-auto whitespace-pre selection:bg-amber-500 selection:text-slate-950">
                  {ETHIOLEARN_SUPABASE_SQL_SCRIPT}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: QUESTION BANK (SUPABASE PRE-GENERATED REPOSITORY)          */}
          {/* ================================================================ */}
          {activeTab === 'questions' && (
            <AdminQuestionBankSection
              isAmharic={isAmharic}
              onRefreshStats={() => loadAllAdminData(true)}
            />
          )}
        </div>
      </motion.div>

      {/* ─── CREATE / EDIT COURSE MODAL ─── */}
      {showCourseModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>{editingCourse ? `Edit Course (${editingCourse.id.substring(0, 10)})` : 'Author New Course'}</span>
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={courseFormTitle}
                  onChange={(e) => setCourseFormTitle(e.target.value)}
                  placeholder="e.g. Advanced Calculus & Differential Equations"
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={courseFormSubject}
                    onChange={(e) => setCourseFormSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Target Curriculum Level</label>
                  <select
                    value={courseFormLevel}
                    onChange={(e) => setCourseFormLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-300 outline-none"
                  >
                    <option value="University">University</option>
                    <option value="Grade 12">Grade 12</option>
                    <option value="Grade 12 New Curriculum">Grade 12 New Curriculum</option>
                    <option value="Common Courses">Common Courses</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Goal Days</label>
                  <input
                    type="number"
                    value={courseFormGoalDays}
                    onChange={(e) => setCourseFormGoalDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Publication State</label>
                  <select
                    value={courseFormStatus}
                    onChange={(e) => setCourseFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-300 outline-none font-bold"
                  >
                    <option value="draft">Draft (Admin Only)</option>
                    <option value="published">Published (Students Visible)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Course Description</label>
                <textarea
                  rows={2}
                  value={courseFormDescription}
                  onChange={(e) => setCourseFormDescription(e.target.value)}
                  placeholder="Overview of syllabus, prerequisites, and learning outcomes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              {!editingCourse && (
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Initial Lessons / Units (One per line)</label>
                  <textarea
                    rows={3}
                    value={courseFormLessonsText}
                    onChange={(e) => setCourseFormLessonsText(e.target.value)}
                    placeholder="Chapter 1: Propositional Logic&#10;Chapter 2: Predicate Calculus&#10;Chapter 3: Formal Proofs"
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-mono text-slate-300 outline-none"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courseFormSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                >
                  {courseFormSaving ? 'Saving to Database...' : editingCourse ? 'Save Changes' : 'Create & Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LESSONS MANAGEMENT MODAL ─── */}
      {selectedCourseForLessons && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Curriculum Lessons</span>
                <h3 className="text-sm font-bold text-white">{selectedCourseForLessons.title}</h3>
              </div>
              <button onClick={() => setSelectedCourseForLessons(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Lessons List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingLessons ? (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">Loading lessons...</div>
              ) : courseLessons.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">No lessons created yet for this course.</div>
              ) : (
                courseLessons.map((l, idx) => (
                  <div key={l.id || idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-950 text-amber-400 font-mono text-[10px] font-bold flex items-center justify-center border border-slate-800 shrink-0">
                        {l.chapterNumber}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-white">{l.title}</h5>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{l.content}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{l.duration}</span>
                  </div>
                ))
              )}
            </div>

            {/* Add Lesson Form */}
            <form onSubmit={handleAddLesson} className="pt-3 border-t border-slate-800 space-y-2.5 bg-slate-900/60 p-3.5 rounded-2xl">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Add Lesson / Unit</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    required
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    placeholder="Lesson Title (e.g. Unit 3: Transformers)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newLessonDuration}
                    onChange={(e) => setNewLessonDuration(e.target.value)}
                    placeholder="Duration (e.g. 20m)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 font-mono outline-none"
                  />
                </div>
              </div>
              <textarea
                rows={2}
                value={newLessonContent}
                onChange={(e) => setNewLessonContent(e.target.value)}
                placeholder="Lesson syllabus summary, formulas, or key definitions..."
                className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 outline-none"
              />
              <div className="text-right">
                <button
                  type="submit"
                  disabled={savingLesson || !newLessonTitle.trim()}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingLesson ? 'Adding...' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RECEIPT IMAGE PREVIEW MODAL ─── */}
      {selectedReceiptImage && (
        <div 
          className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedReceiptImage(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative max-w-xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Payment Proof Receipt Inspection
              </span>
              <button 
                onClick={() => setSelectedReceiptImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[70vh] rounded-xl border border-slate-800 bg-black/50 p-1 flex items-center justify-center">
              <img 
                src={selectedReceiptImage} 
                alt="Receipt Inspection" 
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="w-full pt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Inspect reference/transaction ID before verification
              </span>
              <a 
                href={selectedReceiptImage} 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Original
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
