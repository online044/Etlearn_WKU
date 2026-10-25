/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, Bot, Trophy, Award, Sparkles, Calendar, Sun, Moon, User as UserIcon, BookOpen, CheckCircle,
  Share, X, ShieldCheck, Download, WifiOff, GraduationCap, FileText, Menu, MoreVertical, Type, Megaphone, Bell
} from 'lucide-react';

import { StudentProfile, CustomNote, Flashcard, AITeacherContext, ExamAttemptRecord } from './types';
import SplashOnboarding from './components/SplashOnboarding';
import PWADownloadAssistant from './components/PWADownloadAssistant';
import ExamPrep from './components/ExamPrep';
import StudyNotesView from './components/StudyNotesView';
import HomeDashboard from './components/HomeDashboard';
import StudentProfileView from './components/StudentProfileView';
import StudentAvatar from './components/StudentAvatar';
import BookStoreView from './components/BookStoreView';
import UniversityExamsView from './components/UniversityExamsView';
import UpgradeProView from './components/UpgradeProView';
import EthioLearnLogo from './components/EthioLearnLogo';
import ExamNotesHubView from './components/ExamNotesHubView';
import InAppViewerModal from './components/InAppViewerModal';
import AdminDashboardView from './components/AdminDashboardView';
import ExamEngineView from './components/ExamEngineView';
import EthioLearnAppPromoBanner from './components/EthioLearnAppPromoBanner';
import AppSidebar from './components/AppSidebar';
import LegalPrivacyTermsModal from './components/LegalPrivacyTermsModal';
import AnnouncementsModal from './components/AnnouncementsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TelegramMiniAppHeader } from './components/TelegramMiniAppHeader';
import AppDrawer from './components/native/AppDrawer';
import { PWAInstallButton } from './components/PWAInstallButton';

import { 
  testFirestoreConnection, 
  syncProfileToFirestore, 
  fetchProfileFromFirestore, 
  saveNoteToFirestore, 
  deleteNoteFromFirestore, 
  fetchNotesFromFirestore,
  auth,
  wakeAuth,
  formatFirebaseAuthError
} from './utils/firebaseStore';
import { signOut as firebaseSignOut } from 'firebase/auth';

import { getEthiopianDate } from './utils/ethiopianCalendar';
import { recordSignIn, recordSignOut } from './utils/sessionTracker';
import { playClickChime, playSuccessChime, playFailureChime } from './utils/audio';
import { initAuth, googleSignIn, googleSignInRedirect, logoutGoogle, exportAnalyticsToGoogleSheets } from './utils/workspace';
import { User as FirebaseUser } from 'firebase/auth';
import { initSupabaseConfig, getSupabase, wakeSupabaseAuth, clearSessionToken, syncAuthSessionWithServer, fetchProfileFromSupabase, saveProfileToSupabase } from './utils/supabaseClient';
import { fetchAllSupabaseQuestions } from './utils/supabaseQuestions';
import { safeStorage } from './utils/safeStorage';
import { isAdministratorEmail, ADMIN_EMAIL } from './utils/adminAuth';
import { 
  getTelegramWebApp, 
  isTelegramWebApp, 
  initTelegramWebApp, 
  getTelegramUser, 
  verifyAndSyncTelegramAuth, 
  setTelegramBackButton,
  triggerHaptic 
} from './utils/telegram';

// Helper functions for real study streak calculation based on actual calendar days
function recordStudyActivity() {
  const datesStr = safeStorage.getItem('ethiolearn_study_dates');
  let dates: string[] = [];
  if (datesStr) {
    try {
      dates = JSON.parse(datesStr);
    } catch (e) {
      dates = [];
    }
  }
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayKey = `${year}-${month}-${day}`;
  
  if (!dates.includes(todayKey)) {
    dates.push(todayKey);
    safeStorage.setItem('ethiolearn_study_dates', JSON.stringify(dates));
  }
}

function getCurrentStreak(): number {
  const datesStr = safeStorage.getItem('ethiolearn_study_dates');
  if (!datesStr) return 0;
  let dates: string[] = [];
  try {
    dates = JSON.parse(datesStr);
  } catch (e) {
    return 0;
  }
  
  if (!Array.isArray(dates) || dates.length === 0) return 0;
  
  const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  
  const getOffsetDateString = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };
  
  const todayKey = getOffsetDateString(0);
  const yesterdayKey = getOffsetDateString(1);
  
  if (!uniqueDates.includes(todayKey) && !uniqueDates.includes(yesterdayKey)) {
    return 0;
  }
  
  let currentStreak = 0;
  let checkOffset = 0;
  
  if (!uniqueDates.includes(todayKey) && uniqueDates.includes(yesterdayKey)) {
    checkOffset = 1;
  }
  
  while (true) {
    const key = getOffsetDateString(checkOffset);
    if (uniqueDates.includes(key)) {
      currentStreak++;
      checkOffset++;
    } else {
      break;
    }
  }
  
  return currentStreak;
}

const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  id: 'guest-scholar',
  name: 'Scholar',
  university: 'Wolkite University',
  year: 'Freshman (Year 1)',
  department: 'Freshman Common Courses',
  subjects: [
    "Emerging Technologies",
    "Introduction to Economics",
    "General Biology",
    "Communicative English",
    "Moral and Civic Education",
    "Mathematics",
    "Geography"
  ],
  claudeApiKey: '',
  dailyGoalHours: 2,
  theme: 'dark',
  language: 'both',
  avatar: 'star',
  isPro: false,
  proStatus: 'none',
  unregisteredAICredits: 20
};

export default function App() {
  // Load profile with multi-layer fallback to reliably remember registered students and guest scholars
  const [profile, setProfile] = useState<StudentProfile | null>(() => {
    // 1. Check primary current profile
    const saved = safeStorage.getItem('ethiolearn_current_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Security Protection: If this device has the old mock admin 'usr_admin_ezrat2116', purge it immediately!
        if (
          parsed &&
          (parsed.id === 'usr_admin_ezrat2116' ||
            (parsed.email?.toLowerCase() === 'ezrat2116@gmail.com' &&
              (parsed.firebaseUid === 'usr_admin_ezrat2116' || parsed.passwordEncrypted === 'admin_session_active')))
        ) {
          safeStorage.removeItem('ethiolearn_current_profile');
          safeStorage.removeItem('ethiolearn_active_email');
          return null;
        }

        if (
          parsed && 
          typeof parsed === 'object' && 
          (parsed.email || parsed.phone || parsed.id)
        ) {
          return parsed;
        }
      } catch (e) {}
    }

    // 2. Fallback to active email matching in registered accounts
    const activeEmail = safeStorage.getItem('ethiolearn_active_email');
    const accountsRaw = safeStorage.getItem('ethiolearn_accounts');
    if (accountsRaw) {
      try {
        const accounts = JSON.parse(accountsRaw);
        if (Array.isArray(accounts) && accounts.length > 0) {
          // Filter out mock admin accounts
          const safeAccounts = accounts.filter(
            a => !(a.email?.toLowerCase() === 'ezrat2116@gmail.com' && (a.passwordEncrypted === 'admin_session_active' || a.profile?.id === 'usr_admin_ezrat2116'))
          );

          if (activeEmail && activeEmail.toLowerCase() !== 'ezrat2116@gmail.com') {
            const match = safeAccounts.find(a => a.email && a.email.toLowerCase() === activeEmail.toLowerCase());
            if (match?.profile) {
              safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(match.profile));
              return match.profile;
            }
          }
          // If any account has rememberMe active
          const remembered = safeAccounts.find(a => a.rememberMe);
          if (remembered?.profile) {
            safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(remembered.profile));
            safeStorage.setItem('ethiolearn_active_email', remembered.email);
            return remembered.profile;
          }
        }
      } catch (e) {}
    }

    // Student must register, sign in, or continue as guest before using the app
    return null;
  });

  // Persistent language preference
  const [language, setLanguage] = useState<'en' | 'am'>(() => {
    const saved = safeStorage.getItem('ethiolearn_language_preference');
    return (saved === 'am' || saved === 'en') ? saved : 'en';
  });

  const [currentPage, setCurrentPage] = useState<'home' | 'tutor' | 'quiz' | 'profile' | 'notes' | 'bookstore' | 'university' | 'upgrade' | 'examprep' | 'examengine'>('home');

  const [examAttempts, setExamAttempts] = useState<ExamAttemptRecord[]>(() => {
    try {
      const raw = safeStorage.getItem(`ethiolearn_student_exam_attempts_${profile.id || 'guest'}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [aiContext, setAiContext] = useState<AITeacherContext | null>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const saved = safeStorage.getItem('ethiolearn_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  });

  // Load custom notes and flashcards
  const [customNotes, setCustomNotes] = useState<CustomNote[]>(() => {
    const saved = safeStorage.getItem('ethiolearn_custom_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [decksState, setDecksState] = useState<{ [deckId: string]: Flashcard[] }>(() => {
    const saved = safeStorage.getItem('ethiolearn_flashcards_decks');
    return saved ? JSON.parse(saved) : {};
  });

  // Streaks and study hours tracker
  const [streak, setStreak] = useState(() => {
    const saved = safeStorage.getItem('ethiolearn_pro_streak');
    return saved ? parseInt(saved, 10) : 5;
  });

  const [studyHours, setStudyHours] = useState(() => {
    const saved = safeStorage.getItem('ethiolearn_pro_study_hours');
    return saved ? parseFloat(saved) : 14.5;
  });

  // Google Authentication variables
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [supaUser, setSupaUser] = useState<any | null>(null);
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [isPopupBlockedApp, setIsPopupBlockedApp] = useState(false);

  // Toast systems
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Student Text Size preference: moderate by default for clear readability
  const [textSize, setTextSize] = useState<'normal' | 'moderate' | 'large' | 'xlarge'>(() => {
    const saved = safeStorage.getItem('ethiolearn_text_size');
    if (saved === 'normal' || saved === 'moderate' || saved === 'large' || saved === 'xlarge') {
      return saved;
    }
    return 'moderate';
  });

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
    safeStorage.setItem('ethiolearn_text_size', textSize);
  }, [textSize]);

  // Supabase books sync state
  const [supabaseBooks, setSupabaseBooks] = useState<any[]>([]);

  // Ethiopian Calendar support
  const [ethDate, setEthDate] = useState({ day: 1, monthName: "መስከረም", year: 2016, formatted: "መስከረም 1, 2016" });

  // Administrator authorization check (Strictly restricted to ezrat2116@gmail.com)
  const isUserAdmin = Boolean(profile?.email && isAdministratorEmail(profile.email));

  // PWA elements
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  // In-App Viewer States
  const [inAppViewerUrl, setInAppViewerUrl] = useState<string | null>(null);
  const [inAppViewerTitle, setInAppViewerTitle] = useState<string>('');

  // App Sidebar & Legal/Privacy/Terms States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHeaderOverflowOpen, setIsHeaderOverflowOpen] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'about' | 'terms' | 'privacy'>('about');
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState<boolean>(false);

  // Trigger toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Centralized Supabase Cloud sync function
  const syncWithSupabase = async (customProfile?: StudentProfile) => {
    const activeProfile = customProfile || profile;
    if (!activeProfile || !activeProfile.email) return;

    try {
      const supa = getSupabase();
      if (!supa) return;

      const email = activeProfile.email.toLowerCase();

      // Retrieve from local storage to get up-to-date values
      const studySessionsRaw = safeStorage.getItem('ethiolearn_study_sessions');
      const studySessions = studySessionsRaw ? JSON.parse(studySessionsRaw) : [];

      const notesRaw = safeStorage.getItem('ethiolearn_custom_notes');
      const notesData = notesRaw ? JSON.parse(notesRaw) : [];

      const quizRaw = safeStorage.getItem('ethiolearn_quiz_perf');
      const performanceData = quizRaw ? JSON.parse(quizRaw) : {};

      // Try to select existing profile to get saved password if there is one
      const { data: existing } = await supa
        .from('student_profiles')
        .select('profile_data')
        .eq('email', email)
        .maybeSingle();

      let password = '';
      if (existing && existing.profile_data) {
        password = existing.profile_data.password || '';
      }

      const payloadRecord = {
        email,
        profile_data: {
          ...activeProfile,
          name: activeProfile.name || email.split('@')[0],
          university: activeProfile.university || 'Wolkite University',
          year: activeProfile.year || 'Freshman',
          subjects: Array.isArray(activeProfile.subjects) ? activeProfile.subjects : [],
          isPro: Boolean(activeProfile.isPro || activeProfile.tier?.includes('pro')),
          userRole: isAdministratorEmail(email) ? 'admin' : 'student',
          password
        },
        study_sessions: studySessions,
        notes_data: notesData,
        performance_data: performanceData,
        updated_at: new Date().toISOString()
      };

      const { error: upsertError } = await supa
        .from('student_profiles')
        .upsert(payloadRecord, { onConflict: 'email' });

      if (upsertError) {
        console.warn('[Supabase Sync] Upsert error:', upsertError.message);
      } else {
        console.log('[Supabase Sync] Campus progress synced to Supabase successfully.');
      }
    } catch (err) {
      console.warn('[Supabase Sync] Failure during background sync:', err);
    }
  };

  // Sync automatically on page changes to ensure all local updates are persisted in Supabase
  useEffect(() => {
    syncWithSupabase();
  }, [currentPage]);

  // Sync theme setup (allows toggling both light and dark modes with premium lighting)
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    safeStorage.setItem('ethiolearn_theme', themeMode);
  }, [themeMode]);

  // Sync language with localStorage preference
  useEffect(() => {
    safeStorage.setItem('ethiolearn_language_preference', language);
  }, [language]);

  // Calendar calculator
  useEffect(() => {
    try {
      const computed = getEthiopianDate(new Date());
      setEthDate(computed as any);
    } catch (e) {
      console.warn("Failed standard Ethiopian calendar compute:", e);
    }
  }, []);

  // Active session tracking - Never forget sign-in and sign-out timestamps
  useEffect(() => {
    if (profile && profile.email && profile.email !== DEFAULT_STUDENT_PROFILE.email) {
      const activeStart = safeStorage.getItem('ethiolearn_active_session_start');
      if (!activeStart) {
        recordSignIn(profile, profile.email);
      }
    }
  }, [profile?.email]);

  // Sync and initialize real active study streak
  useEffect(() => {
    const savedDates = safeStorage.getItem('ethiolearn_study_dates');
    if (!savedDates) {
      // Seed 5 consecutive days back so student doesn't drop to 0 on their very first run
      const preseeded: string[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        preseeded.push(`${y}-${m}-${dayStr}`);
      }
      safeStorage.setItem('ethiolearn_study_dates', JSON.stringify(preseeded));
    }
    
    // Log today's study activity on app launch
    recordStudyActivity();
    
    const realStreak = getCurrentStreak();
    setStreak(realStreak);
    safeStorage.setItem('ethiolearn_pro_streak', String(realStreak));
  }, []);

  // Telegram Mini App initialization & auto-auth profile link
  useEffect(() => {
    initTelegramWebApp();
    
    if (isTelegramWebApp()) {
      const tg = getTelegramWebApp();
      const tgUser = getTelegramUser();
      
      if (tg?.initData) {
        verifyAndSyncTelegramAuth(tg.initData).then((res) => {
          if (res?.success && res.profile) {
            setProfile((prev) => {
              const updated: StudentProfile = {
                name: prev?.name || res.profile.name || (tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : 'Ethiopian Student'),
                email: prev?.email || res.profile.email || `${tgUser?.username || tgUser?.id}@telegram.ethiolearn.et`,
                university: prev?.university || res.profile.university || 'Wolkite University',
                year: prev?.year || res.profile.year || '2nd Year',
                subjects: prev?.subjects || [
                  "Emerging Technologies", "Introduction to Economics", "General Biology", "Communicative English",
                  "Moral and Civic Education", "Mathematics", "Inclusive Education", "Geography",
                  "Logic and Critical Thinking", "History", "Chemistry", "Aptitude", "General Physics",
                  "Entrepreneurship", "Social Anthropology", "C++ Programming", "Civics", "Agriculture",
                  "Business", "Moral and Civics", "Emerging Tech", "Applied Math"
                ],
                claudeApiKey: prev?.claudeApiKey || '',
                dailyGoalHours: prev?.dailyGoalHours || 3,
                theme: prev?.theme || 'light',
                language: prev?.language || language || 'en',
                isRegistered: true,
                isPro: prev?.isPro || res.profile.is_pro || false,
                telegramId: tgUser?.id.toString() || res.profile.telegram_id,
                telegramUsername: tgUser?.username || res.profile.username
              };
              safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(updated));
              return updated;
            });
            console.log('[Telegram Mini App] Auto-authenticated & linked student profile via Telegram initData');
          }
        }).catch((err) => {
          console.warn('[Telegram Mini App] Auto-auth verification notice:', err);
        });
      }
    }
  }, []);

  // Browser History & Android/iOS hardware back button synchronization
  useEffect(() => {
    if (currentPage !== 'home') {
      window.history.pushState({ page: currentPage }, '');
      const handleBrowserBack = () => {
        setCurrentPage('home');
      };
      window.addEventListener('popstate', handleBrowserBack);
      return () => {
        window.removeEventListener('popstate', handleBrowserBack);
      };
    }
  }, [currentPage]);

  // Telegram Mini App BackButton & MainButton state synchronization
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;

    // Handle Telegram BackButton
    if (tg.BackButton) {
      if (currentPage !== 'home') {
        tg.BackButton.show();
        const handleTelegramBack = () => {
          triggerHaptic('light');
          playClickChime();
          setCurrentPage('home');
        };
        tg.BackButton.onClick(handleTelegramBack);
        return () => {
          tg.BackButton.offClick(handleTelegramBack);
        };
      } else {
        tg.BackButton.hide();
      }
    }

    // Handle Telegram MainButton on specific pages
    if (tg.MainButton) {
      if (currentPage === 'upgrade') {
        tg.MainButton.setText(language === 'en' ? 'UPGRADE TO PRO (99 ETB)' : 'ወደ ፕሮ አባልነት አሳድግ (99 ብር)');
        tg.MainButton.show();
        const handleTelegramMainBtn = () => {
          triggerHaptic('medium');
          playClickChime();
          const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitBtn) {
            submitBtn.click();
          }
        };
        tg.MainButton.onClick(handleTelegramMainBtn);
        return () => {
          tg.MainButton.offClick(handleTelegramMainBtn);
        };
      } else {
        tg.MainButton.hide();
      }
    }
  }, [currentPage, language]);

  // Synchronize master API Key to the cloud container if available in active profile
  useEffect(() => {
    if (profile?.claudeApiKey) {
      fetch('/api/sync-master-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: profile.claudeApiKey })
      }).then(res => {
        if (res.ok) {
          console.log('[EthioLearn Client] Synced master API key to the active server successfully.');
        }
      }).catch(err => {
        console.warn('[EthioLearn Client] Failed to register master key with backend:', err);
      });
    }
  }, [profile?.claudeApiKey]);

  // Auth initialization state to prevent login flash before Firebase finishes checking
  const [isAuthInitializing, setIsAuthInitializing] = useState<boolean>(!profile);

  // Firebase auth sync & session restore
  useEffect(() => {
    let mounted = true;

    // Failsafe timeout to prevent hanging on slow networks or sandbox proxies
    const timer = setTimeout(() => {
      if (mounted) {
        setIsAuthInitializing(false);
      }
    }, 1800);

    const unsubscribe = initAuth(
      async (user, token) => {
        if (!mounted) return;
        setGoogleUser(user);
        setGoogleToken(token);

        if (user) {
          try {
            // Priority 1: Check Supabase profiles or student_profiles table
            let supaProfile = null;
            try {
              supaProfile = await fetchProfileFromSupabase(user.uid, user.email || undefined);
            } catch (supaErr) {
              console.warn('[Supabase session restore check notice]:', supaErr);
            }

            if (supaProfile) {
              const fullProfile: StudentProfile = {
                id: user.uid,
                firebaseUid: user.uid,
                name: supaProfile.full_name || supaProfile.name || user.displayName || (user.email ? user.email.split('@')[0] : 'Student'),
                email: user.email || supaProfile.email || '',
                phone: supaProfile.phone || '',
                university: supaProfile.university || 'Wolkite University',
                department: supaProfile.department || 'Freshman Common Courses',
                year: supaProfile.year_level || supaProfile.year || 'Freshman (1st Year)',
                grade: 'University',
                stream: 'Natural',
                subjects: ["Emerging Technologies", "Communicative English", "Mathematics", "Logic and Critical Thinking"],
                claudeApiKey: '',
                dailyGoalHours: 2,
                theme: 'dark',
                language: language,
                avatar: (supaProfile.profile_photo as any) || (supaProfile.avatar as any) || 'champion',
                isPro: supaProfile.subscription_status === 'pro' || supaProfile.subscription_status === 'active' || (user.email ? isAdministratorEmail(user.email) : false),
                userRole: (user.email && isAdministratorEmail(user.email)) ? 'super_admin' : 'student',
                isRegistered: true,
                unregisteredAICredits: 10,
                emailVerified: user.emailVerified
              };
              setProfile(fullProfile);
              safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(fullProfile));
              if (user.email) {
                safeStorage.setItem('ethiolearn_active_email', user.email.toLowerCase().trim());
              }
            } else {
              // Priority 2: Check local cache for previously saved profile data
              let localCachedProfile: StudentProfile | null = null;
              try {
                const saved = safeStorage.getItem('ethiolearn_current_profile');
                if (saved) {
                  const parsed = JSON.parse(saved);
                  if (parsed && (parsed.email === user.email || parsed.id === user.uid)) {
                    localCachedProfile = parsed;
                  }
                }
              } catch (e) {}

              // Priority 3: Fallback composite profile derived from Firebase Auth user
              const fallbackProfile: StudentProfile = {
                id: user.uid,
                firebaseUid: user.uid,
                name: localCachedProfile?.name || user.displayName || (user.email ? user.email.split('@')[0] : 'Student'),
                email: user.email || localCachedProfile?.email || '',
                phone: localCachedProfile?.phone || '',
                university: localCachedProfile?.university || 'Wolkite University',
                department: localCachedProfile?.department || 'Freshman Common Courses',
                year: localCachedProfile?.year || 'Freshman (1st Year)',
                grade: 'University',
                stream: 'Natural',
                subjects: ["Emerging Technologies", "Communicative English", "Mathematics", "Logic and Critical Thinking"],
                claudeApiKey: '',
                dailyGoalHours: 2,
                theme: 'dark',
                language: language,
                avatar: localCachedProfile?.avatar || 'champion',
                isPro: (user.email && isAdministratorEmail(user.email)) || Boolean(localCachedProfile?.isPro),
                userRole: (user.email && isAdministratorEmail(user.email)) ? 'super_admin' : 'student',
                isRegistered: true,
                unregisteredAICredits: 10,
                emailVerified: user.emailVerified
              };

              setProfile(fallbackProfile);
              safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(fallbackProfile));
              if (user.email) {
                safeStorage.setItem('ethiolearn_active_email', user.email.toLowerCase().trim());
              }

              // Asynchronously save profile to Supabase in background
              saveProfileToSupabase({
                firebase_uid: user.uid,
                full_name: fallbackProfile.name,
                email: fallbackProfile.email,
                phone: fallbackProfile.phone,
                university: fallbackProfile.university,
                department: fallbackProfile.department,
                year_level: fallbackProfile.year,
                profile_photo: fallbackProfile.avatar,
                subscription_status: fallbackProfile.isPro ? 'pro' : 'free'
              }).catch(() => {});
            }
          } catch (restoreErr) {
            console.warn('[Firebase Auth session restore]:', restoreErr);
            // Even on unexpected error, guarantee user access
            if (user.email) {
              const safeFallback: StudentProfile = {
                id: user.uid,
                firebaseUid: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                university: 'Wolkite University',
                year: 'Freshman (1st Year)',
                grade: 'University',
                stream: 'Natural',
                subjects: ["Emerging Technologies", "Communicative English", "Mathematics", "Logic and Critical Thinking"],
                claudeApiKey: '',
                dailyGoalHours: 2,
                theme: 'dark',
                language: language,
                avatar: 'champion',
                isPro: isAdministratorEmail(user.email),
                userRole: isAdministratorEmail(user.email) ? 'super_admin' : 'student',
                isRegistered: true,
                unregisteredAICredits: 10,
                emailVerified: user.emailVerified
              };
              setProfile(safeFallback);
              safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(safeFallback));
              safeStorage.setItem('ethiolearn_active_email', user.email.toLowerCase().trim());
            }
          }
        }
        if (mounted) {
          setIsAuthInitializing(false);
        }
      },
      () => {
        if (!mounted) return;
        setGoogleUser(null);
        setGoogleToken(null);
        setIsAuthInitializing(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);


  // Proactive Session Awakening ("Wake the auth") on mount & window focus
  useEffect(() => {
    const awakenAllAuthSessions = async () => {
      try {
        await Promise.allSettled([
          wakeAuth(),
          wakeSupabaseAuth()
        ]);
      } catch (err) {
        console.warn('[Wake Auth] Session awakening notice:', err);
      }
    };

    awakenAllAuthSessions();

    const handleFocus = () => {
      awakenAllAuthSessions();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Supabase auth state listener & bidirectional data sync
  useEffect(() => {
    const supa = getSupabase();
    if (!supa) return;

    // Fetch current session/user on load
    supa.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupaUser(session.user);
      }
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supa.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSupaUser(session.user);
      } else {
        setSupaUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Bidirectional Supabase Sync
  useEffect(() => {
    if (supaUser) {
      const syncSupabaseState = async () => {
        try {
          const supa = getSupabase();
          if (!supa) return;

          console.log('[Supabase Sync] Initiating bidirectional sync for:', supaUser.email);
          const email = supaUser.email?.toLowerCase();
          if (!email) return;

          const { data: supaRecord, error } = await supa
            .from('student_profiles')
            .select('*')
            .eq('email', email)
            .maybeSingle();

          if (error) {
            console.warn('[Supabase Sync Error]:', error);
            return;
          }

          if (supaRecord) {
            if (supaRecord.profile_data) {
              console.log('[Supabase Sync] Pulled student profile from Supabase.');
              setProfile(supaRecord.profile_data);
              safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(supaRecord.profile_data));
            }
            if (supaRecord.notes_data && supaRecord.notes_data.length > 0) {
              console.log('[Supabase Sync] Pulled custom notes from Supabase.');
              setCustomNotes(supaRecord.notes_data);
              safeStorage.setItem('ethiolearn_custom_notes', JSON.stringify(supaRecord.notes_data));
            }
            if (supaRecord.study_sessions && supaRecord.study_sessions.length > 0) {
              console.log('[Supabase Sync] Pulled study sessions from Supabase.');
              safeStorage.setItem('ethiolearn_study_sessions', JSON.stringify(supaRecord.study_sessions));
            }
            if (supaRecord.performance_data) {
              console.log('[Supabase Sync] Pulled performance data from Supabase.');
              safeStorage.setItem('ethiolearn_quiz_perf', JSON.stringify(supaRecord.performance_data));
            }
          } else if (profile) {
            console.log('[Supabase Sync] Row not found. Seeding initial profile data to student_profiles table.');
            const studySessionsRaw = safeStorage.getItem('ethiolearn_study_sessions');
            const studySessions = studySessionsRaw ? JSON.parse(studySessionsRaw) : [];

            const notesRaw = safeStorage.getItem('ethiolearn_custom_notes');
            const notesData = notesRaw ? JSON.parse(notesRaw) : [];

            const quizRaw = safeStorage.getItem('ethiolearn_quiz_perf');
            const performanceData = quizRaw ? JSON.parse(quizRaw) : {};

            const payloadRecord = {
              email: email,
              profile_data: {
                ...profile,
                name: profile.name || email.split('@')[0],
                university: profile.university || 'Wolkite University',
                year: profile.year || 'Freshman',
                subjects: Array.isArray(profile.subjects) ? profile.subjects : [],
                isPro: Boolean(profile.isPro),
                userRole: isAdministratorEmail(email) ? 'admin' : 'student'
              },
              study_sessions: studySessions,
              notes_data: notesData,
              performance_data: performanceData,
              updated_at: new Date().toISOString()
            };

            await supa.from('student_profiles').upsert(payloadRecord, { onConflict: 'email' });
          }
        } catch (err) {
          console.error('[Supabase Sync Failure]:', err);
        }
      };

      syncSupabaseState();
    }
  }, [supaUser, profile]);

  // Bidirectional Firestore cloud sync
  useEffect(() => {
    if (googleUser) {
      const syncCloudState = async () => {
        try {
          console.log('[Firestore Sync] Initiating bidirection cloud desk sync for UID:', googleUser.uid);
          
          // 1. Sync student profile
          const cloudProfile = await fetchProfileFromFirestore(googleUser.uid);
          if (cloudProfile) {
            console.log('[Firestore Sync] Cloud profile pulled. Applying to local study desk.');
            setProfile(cloudProfile);
            safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(cloudProfile));
          } else if (profile) {
            console.log('[Firestore Sync] Creating cloud profile backup.');
            await syncProfileToFirestore(googleUser.uid, profile);
          }

          // 2. Sync custom notes
          const cloudNotes = await fetchNotesFromFirestore(googleUser.uid);
          if (cloudNotes && cloudNotes.length > 0) {
            console.log('[Firestore Sync] Cloud notes pulled. Updating local portfolio.');
            setCustomNotes(cloudNotes);
            safeStorage.setItem('ethiolearn_custom_notes', JSON.stringify(cloudNotes));
          } else if (customNotes.length > 0) {
            console.log('[Firestore Sync] Archiving existing local notes onto cloud database.');
            for (const note of customNotes) {
              await saveNoteToFirestore(googleUser.uid, note);
            }
          }
        } catch (err) {
          console.error('[Firestore Sync Failure]:', err);
        }
      };

      syncCloudState();
    }
  }, [googleUser]);

  // Load server-side configured Supabase secrets automatically at startup and sync active session token
  useEffect(() => {
    initSupabaseConfig().then(() => {
      if (profile?.email) {
        syncAuthSessionWithServer({
          email: profile.email,
          role: isAdministratorEmail(profile.email) ? 'admin' : 'student',
          displayName: profile.name
        }).catch(() => {});
      }
    });
  }, [profile?.email]);

  // PWA standard installer hook
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // iOS Safari PWA installation prompt trigger
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIOSDevice = /ipad|iphone|ipod/.test(ua);
    const isStandalonePWA = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const isDismissed = safeStorage.getItem('ethiolearn_ios_pwa_dismissed') === 'true';

    if (isIOSDevice && !isStandalonePWA && !isDismissed) {
      const timer = setTimeout(() => {
        setShowIOSPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissIOSPrompt = () => {
    setShowIOSPrompt(false);
    safeStorage.setItem('ethiolearn_ios_pwa_dismissed', 'true');
    playClickChime();
  };

  // Fetch curriculum books list from 'books' table in Supabase
  useEffect(() => {
    async function fetchBooks() {
      // 1. Fetch from server endpoint /api/books (which queries Supabase)
      try {
        const res = await fetch('/api/books');
        if (res.ok) {
          const json = await res.json();
          if (json.books && Array.isArray(json.books) && json.books.length > 0) {
            setSupabaseBooks(json.books.map((b: any) => ({
              id: b.id,
              title: b.title,
              subject: b.subject,
              grade: b.academicYear || b.grade || 'Freshman',
              description: b.description,
              cover_url: b.coverUrl || b.cover_url,
              pdf_url: b.pdfUrl || b.pdf_url,
              created_at: b.createdAt || b.created_at
            })));
          }
        }
      } catch (err) {
        console.warn('Could not fetch books from /api/books:', err);
      }

      // 2. Also ensure direct client Supabase sync
      try {
        await initSupabaseConfig();
        const supaClient = getSupabase();
        if (supaClient) {
          const { data, error } = await supaClient
            .from('books')
            .select('*')
            .order('title', { ascending: true });

          if (error) {
            console.warn('Error fetching books list from "books" table in App.tsx:', error);
          } else if (data && data.length > 0) {
            setSupabaseBooks(data);
          }
        }
      } catch (err) {
        console.error('Failed to coordinate Supabase request in App.tsx:', err);
      }
    }
    fetchBooks();
  }, []);

  // Fetch central questions repository from 'questions' table in Supabase
  useEffect(() => {
    async function loadQuestionsFromSupabase() {
      try {
        await initSupabaseConfig();
        const questions = await fetchAllSupabaseQuestions(true);
        if (questions && questions.length > 0) {
          console.log(`[App.tsx] Loaded ${questions.length} questions from Supabase questions table`);
        }
      } catch (err) {
        console.warn('Could not load questions from Supabase in App.tsx:', err);
      }
    }
    loadQuestionsFromSupabase();
  }, []);

  const triggerPWAInstall = async () => {
    window.open('https://apkpure.com/p/com.etlearn.app', '_blank', 'noopener,noreferrer');
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstallable(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
    }
  };

  const handleOnboardingComplete = async (completedProfile: StudentProfile) => {
    // Override theme to default to current selected style
    const updated = { ...completedProfile, theme: themeMode };

    // Accurately record sign-in timestamp, increment session counters, and sync to cloud
    const { updatedProfile } = await recordSignIn(updated, updated.email);

    setProfile(updatedProfile);
    safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(updatedProfile));
    if (updatedProfile.email) {
      safeStorage.setItem('ethiolearn_active_email', updatedProfile.email.toLowerCase().trim());
    }
    syncWithSupabase(updatedProfile);
    playSuccessChime();
    showToast(`Welcome ${updatedProfile.name}!`);
  };

  const handleProfileReset = async () => {
    playClickChime();
    if (window.confirm("Would you like to reset your profile and re-register?")) {
      if (profile && profile.email) {
        await recordSignOut(profile, profile.email);
      }
      safeStorage.removeItem('ethiolearn_current_profile');
      safeStorage.removeItem('ethiolearn_active_email');
      setProfile(null);
    }
  };

  const handleSignOut = async () => {
    playClickChime();

    // 1. Accurately record student sign-out event with timestamp, duration, and cloud sync BEFORE clearing session
    const currentActiveEmail = profile?.email || safeStorage.getItem('ethiolearn_active_email');
    if (profile && currentActiveEmail) {
      try {
        await recordSignOut(profile, currentActiveEmail);
      } catch (err) {
        console.warn('[SignOut Session Tracking Warning]:', err);
      }
    }

    // 2. Clear local profile and authentication variables
    safeStorage.removeItem('ethiolearn_current_profile');
    safeStorage.removeItem('ethiolearn_active_email');
    safeStorage.removeItem('ethiolearn_remember_login');
    safeStorage.removeItem('ethiolearn_admin_session');
    safeStorage.removeItem('ethiolearn_admin_auth');
    setIsAdminOpen(false);
    clearSessionToken();
    setProfile(null);
    
    // Clear Google Workspace auth session if active
    if (googleUser) {
      try {
        await logoutGoogle();
        setGoogleUser(null);
        setGoogleToken(null);
      } catch (e) {
        console.warn('Error signing out of Google:', e);
      }
    }
    
    // Clear Firebase Auth session if active
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.warn('Error signing out of Firebase Auth:', e);
      }
    }

    // Clear Supabase auth session if active
    try {
      const supa = getSupabase();
      if (supa) {
        await supa.auth.signOut();
        setSupaUser(null);
      }
    } catch (e) {
      console.warn('Error signing out of Supabase:', e);
    }
    
    playSuccessChime();
    showToast(language === 'en' ? "Signed out successfully. Session recorded." : "በተሳካ ሁኔታ ወጥተዋል። የመውጫ ሰዓትዎ ተመዝግቧል።");
  };

  const handleSyncStatsToSheets = async () => {
    if (!googleToken || !googleUser || !profile) {
      showToast("Please sign in with Google first in the profile section!");
      playFailureChime();
      return;
    }

    try {
      setIsExportingSheets(true);
      playClickChime();
      const res = await exportAnalyticsToGoogleSheets(
        profile.name,
        profile.university,
        profile.year,
        streak,
        studyHours,
        profile.dailyGoalHours || 2,
        googleToken
      );
      playSuccessChime();
      showToast("Synced to Google Sheets!");
      window.open(res.url, '_blank');
    } catch (err: any) {
      console.error(err);
      playFailureChime();
      showToast(`Sync failed: ${err.message || err}`);
    } finally {
      setIsExportingSheets(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsPopupBlockedApp(false);
      playClickChime();
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        playSuccessChime();
        showToast(`Signed in securely with ${res.user.email}!`);
      }
    } catch (err: any) {
      console.error('[Google Sign-In Exception]:', err);
      playFailureChime();
      if (err?.isPopupBlocked || err?.code === 'auth/popup-blocked' || err?.message?.includes('popup')) {
        setIsPopupBlockedApp(true);
      } else {
        showToast(formatFirebaseAuthError(err, language));
      }
    }
  };

  const handleGoogleSignInRedirect = async () => {
    // Avoid redirect loop / missing initial state by triggering user-initiated popup
    await handleGoogleSignIn();
  };

  const handleGoogleSignOut = async () => {
    try {
      playClickChime();
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
      playSuccessChime();
      showToast("Signed out from Google Workspace.");
    } catch (err) {
      console.error(err);
      playFailureChime();
    }
  };

  const handleSaveCustomNotes = (newNotes: CustomNote[]) => {
    setCustomNotes(newNotes);
    safeStorage.setItem('ethiolearn_custom_notes', JSON.stringify(newNotes));
    syncWithSupabase();

    // Sync individual notes to Firestore if Google User is authenticated
    if (googleUser) {
      newNotes.forEach(async (note) => {
        try {
          await saveNoteToFirestore(googleUser.uid, note);
        } catch (e) {
          console.error('[Firestore Note Sync Failure]:', e);
        }
      });

      // Prune/delete any deleted note from the cloud
      fetchNotesFromFirestore(googleUser.uid).then((cloudNotes) => {
        const localIds = new Set(newNotes.map(n => n.id));
        cloudNotes.forEach(async (cn) => {
          if (!localIds.has(cn.id)) {
            try {
              await deleteNoteFromFirestore(googleUser.uid, cn.id);
            } catch (e) {
              console.error('[Firestore Note Delete Failure]:', e);
            }
          }
        });
      }).catch(err => console.error('[Firestore Prune Query Failure]:', err));
    }
  };

  const handleSaveDecksState = (deckId: string, cards: Flashcard[]) => {
    const updated = { ...decksState, [deckId]: cards };
    setDecksState(updated);
    safeStorage.setItem('ethiolearn_flashcards_decks', JSON.stringify(updated));
    syncWithSupabase();
  };

  // Update profile from inside subviews
  const handleUpdateProfile = (updated: StudentProfile) => {
    setProfile(updated);
    safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(updated));
    syncWithSupabase(updated);

    if (googleUser) {
      syncProfileToFirestore(googleUser.uid, updated).catch(err => 
        console.error('[Firestore Profile Sync Failure]:', err)
      );
    }
  };

  // Quick grade modifier from HomeDashboard
  const handleUpdateGrade = (grade: string) => {
    if (profile) {
      const updated = { ...profile, year: grade };
      setProfile(updated);
      safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(updated));
      showToast(language === 'en' ? `Curriculum set to ${grade}!` : `ደረጃው ወደ ${grade} ተቀይሯል!`);
      syncWithSupabase(updated);

      if (googleUser) {
        syncProfileToFirestore(googleUser.uid, updated).catch(err => 
          console.error('[Firestore Grade Sync Failure]:', err)
        );
      }
    }
  };

  const handleRecordStudyAction = () => {
    recordStudyActivity();
    const sc = getCurrentStreak();
    setStreak(sc);
    safeStorage.setItem('ethiolearn_pro_streak', String(sc));
    
    const updatedHours = Number((studyHours + 0.1).toFixed(2));
    setStudyHours(updatedHours);
    safeStorage.setItem('ethiolearn_pro_study_hours', String(updatedHours));
    
    syncWithSupabase();
  };

  // Telegram WebApp lifecycle & Native Back Button
  useEffect(() => {
    initTelegramWebApp();
    if (isTelegramWebApp()) {
      const showBack = currentPage !== 'home';
      setTelegramBackButton(showBack, () => {
        triggerHaptic('medium');
        setCurrentPage('home');
      });
    }
    return () => {
      setTelegramBackButton(false);
    };
  }, [currentPage]);

  if (isAuthInitializing && !profile) {
    return (
      <div className="min-h-screen w-full bg-[#0A1128] text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#1E293B] border border-amber-500/30 p-2.5 shadow-2xl flex items-center justify-center animate-pulse">
            <EthioLearnLogo className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">EthioLearn Pro</h1>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'am' ? 'የተማሪ መለያ በመረጋገጥ ላይ...' : 'Securing student session...'}
            </p>
          </div>
          <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 w-full animate-[pulse_1.5s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <SplashOnboarding 
        onComplete={handleOnboardingComplete} 
        initialProfile={null} 
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#050508] text-slate-800 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 tma-container">
      {/* 🚀 Telegram Mini App Pro Verified Bar (Visible in Telegram Mini App) */}
      <TelegramMiniAppHeader language={language} />
      
      {/* HEADER BAR FOR TITLE AND ETHIOPIAN CALENDAR */}
      <header 
        className="sticky top-0 z-50 bg-white/95 dark:bg-[#0c0d12]/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/85 shadow-sm select-none"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="w-full max-w-7xl mx-auto px-2 min-[360px]:px-3 sm:px-4 h-14 sm:h-16 flex justify-between items-center gap-1.5 sm:gap-4 relative">
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* 📱 App Sidebar & Info Menu Toggle Button */}
            <button
              type="button"
              onClick={() => {
                playClickChime();
                setIsSidebarOpen(true);
              }}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-all cursor-pointer flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px]"
              title={language === 'en' ? 'Open App Menu & Info' : 'የአፕሊኬሽን ሜኑ እና መረጃ'}
              aria-label="Toggle App Sidebar"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* 🎓 App Logo & Brand Title */}
            <div 
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 cursor-pointer group"
              onClick={() => { playClickChime(); setIsSidebarOpen(true); }}
              title="EthioLearn Pro"
            >
              <div className="shrink-0 flex items-center justify-center">
                <span className="hidden sm:inline-flex items-center justify-center w-8 h-8">
                  <EthioLearnLogo size={32} showCardBackground={false} iconOnly={true} className="w-full h-full group-hover:scale-105 duration-200 transition-transform" />
                </span>
                <span className="sm:hidden inline-flex items-center justify-center w-7 h-7">
                  <EthioLearnLogo size={28} showCardBackground={false} iconOnly={true} className="w-full h-full group-hover:scale-105 duration-200 transition-transform" />
                </span>
              </div>
              <div className="leading-tight text-left min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-serif font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">EthioLearn</span>
                  {profile.isPro ? (
                    <span className="text-[#F59E0B] text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-500 font-sans tracking-wide">PRO</span>
                  ) : (
                    <span className="text-slate-400 dark:text-zinc-400 text-[9px] sm:text-[10px] font-bold px-1 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 font-sans">CAMPUS</span>
                  )}
                </div>
                <span className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-zinc-400 font-semibold truncate max-w-[95px] min-[360px]:max-w-[130px] sm:max-w-none block">
                  {profile.university || 'Wolkite University'}
                </span>
              </div>
            </div>

            {isOffline && (
              <span className="inline-flex items-center gap-1 px-1.5 min-[360px]:px-2.5 py-0.5 sm:py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider animate-pulse shrink-0">
                <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden xs:inline">{language === 'en' ? 'Offline' : 'ከመስመር ውጭ'}</span>
              </span>
            )}
          </div>

          {/* Direct Desktop Navigation Bar for Easy Access to Books & Exams */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => { playClickChime(); setCurrentPage('home'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentPage === 'home'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {language === 'en' ? 'Home' : 'ዋና ገጽ'}
            </button>
            <button
              onClick={() => { playClickChime(); setCurrentPage('bookstore'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 relative group ${
                currentPage === 'bookstore'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="relative flex items-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span>{language === 'en' ? 'Books' : 'መጻሕፍት'}</span>
            </button>
            <button
              onClick={() => { playClickChime(); setCurrentPage('university'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentPage === 'university'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'University Exams' : 'የዩኒቨርሲቲ ፈተናዎች'}</span>
            </button>
            <button
              onClick={() => { playClickChime(); setCurrentPage('notes'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentPage === 'notes'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Study Notes' : 'የጥናት ማስታወሻ'}</span>
            </button>
          </nav>

          {/* Ethiopian Date Widget */}
          <div className="hidden md:flex items-center gap-2 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl">
            <span className="text-sm">📅</span>
            <span className="font-bold text-slate-700 dark:text-zinc-200 text-xs font-serif leading-tight">{ethDate.formatted}</span>
          </div>

          <div className="flex items-center gap-1 min-[360px]:gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Text Size Toggle (Moderate / Large / X-Large / Normal) */}
            <button
              onClick={() => {
                triggerHaptic('light');
                playClickChime();
                const nextSize = textSize === 'moderate' ? 'large' : textSize === 'large' ? 'xlarge' : textSize === 'xlarge' ? 'normal' : 'moderate';
                setTextSize(nextSize);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg sm:rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/90 text-slate-700 dark:text-zinc-200 hover:text-amber-500 transition-colors cursor-pointer"
              title={`Reading Text Size: ${textSize.toUpperCase()} (Click to toggle)`}
            >
              <Type className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono text-xs font-black">
                {textSize === 'normal' ? 'A' : textSize === 'moderate' ? 'A+' : textSize === 'large' ? 'A++' : 'A+++'}
              </span>
            </button>

            {/* Desktop / Tablet Controls (Visible on sm screens and up) */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Mobile App Install Button (APKPure - Visible only on web version, disappears after download) */}
              <PWAInstallButton language={language} variant="header" />

              {/* Interactive Theme Mode Toggle */}
              <button
                onClick={() => {
                  const newTheme = themeMode === 'dark' ? 'light' : 'dark';
                  setThemeMode(newTheme);
                  playClickChime();
                }}
                className="p-2 sm:p-2.5 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer transition-colors"
                title={themeMode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {themeMode === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {/* Official Campus Announcements Place Button */}
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setShowAnnouncementsModal(true);
                }}
                className="relative p-2 sm:px-2.5 sm:py-1.5 border rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 group shrink-0"
                title={language === 'am' ? "የካምፓስ ማስታወቂያ ሰሌዳ" : "Campus Announcements & Bulletin"}
              >
                <Megaphone className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">
                  {language === 'am' ? 'ማስታወቂያ' : 'Notices'}
                </span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse border-2 border-[#0A1128]" />
              </button>

              {/* Admin Dashboard Shield Button */}
              {isUserAdmin && (
                <button
                  onClick={() => { playClickChime(); setIsAdminOpen(true); }}
                  className="p-2 sm:px-2.5 sm:py-1.5 border rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400"
                  title="Admin Console"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">
                    Admin
                  </span>
                </button>
              )}

              {profile.isPro && (
                <div 
                  onClick={() => { playClickChime(); setCurrentPage('upgrade'); }}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-600 dark:text-blue-400 text-xs font-bold leading-none cursor-pointer"
                  title="Verified Pro Scholar"
                >
                  <CheckCircle className="w-3.5 h-3.5 fill-blue-500 text-white dark:text-[#050508]" />
                  <span className="text-[10px] uppercase font-black tracking-wider">Pro</span>
                </div>
              )}
            </div>

            {/* Mobile Overflow Menu Toggle (< sm screens) */}
            <div className="relative sm:hidden">
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setIsHeaderOverflowOpen(!isHeaderOverflowOpen);
                }}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:text-amber-500 cursor-pointer transition-colors"
                title="More options"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Overflow dropdown */}
              {isHeaderOverflowOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsHeaderOverflowOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 text-slate-800 dark:text-zinc-200 text-xs">
                    {/* Theme Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const newTheme = themeMode === 'dark' ? 'light' : 'dark';
                        setThemeMode(newTheme);
                        playClickChime();
                        setIsHeaderOverflowOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 cursor-pointer font-medium"
                    >
                      {themeMode === 'dark' ? (
                        <>
                          <Sun className="w-4 h-4 text-amber-500" />
                          <span>{language === 'am' ? 'ወደ ብሩህ ገጽታ ቀይር' : 'Light Mode'}</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4 text-slate-500" />
                          <span>{language === 'am' ? 'ወደ ጨለማ ገጽታ ቀይር' : 'Dark Mode'}</span>
                        </>
                      )}
                    </button>

                    {/* APKPure App Install */}
                    <div onClick={() => setIsHeaderOverflowOpen(false)} className="w-full">
                      <PWAInstallButton language={language} variant="header" />
                    </div>

                    {/* Official Campus Announcements in overflow */}
                    <button
                      type="button"
                      onClick={() => {
                        playClickChime();
                        setShowAnnouncementsModal(true);
                        setIsHeaderOverflowOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-500/10 text-amber-400 cursor-pointer font-bold"
                    >
                      <Megaphone className="w-4 h-4 text-amber-400" />
                      <span>{language === 'am' ? 'የካምፓስ ማስታወቂያዎች' : 'Campus Notices'}</span>
                    </button>

                    {/* Admin Dashboard if authorized */}
                    {isUserAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickChime();
                          setIsAdminOpen(true);
                          setIsHeaderOverflowOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-500/10 text-amber-500 cursor-pointer font-bold"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Admin Console</span>
                      </button>
                    )}

                    {/* Pro status */}
                    {profile.isPro && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickChime();
                          setCurrentPage('upgrade');
                          setIsHeaderOverflowOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-blue-500 hover:bg-blue-500/10 cursor-pointer font-bold"
                      >
                        <CheckCircle className="w-4 h-4 fill-blue-500 text-white" />
                        <span>Verified Pro</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Student Profile Icon with manual photo - opens profile on touch/click */}
            <button
              onClick={() => {
                triggerHaptic('light');
                playClickChime();
                setCurrentPage('profile');
              }}
              className="p-0.5 sm:p-1 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg sm:rounded-xl hover:border-amber-400/60 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 group shrink-0"
              title={language === 'am' ? "የተማሪ መገለጫ ይክፈቱ" : "Open Student Profile"}
            >
              <div className="sm:hidden">
                <StudentAvatar 
                  avatar={profile.avatar} 
                  name={profile.name} 
                  size={28} 
                  className="border border-amber-400/60 shadow-sm group-hover:border-amber-400"
                />
              </div>
              <div className="hidden sm:block">
                <StudentAvatar 
                  avatar={profile.avatar} 
                  name={profile.name} 
                  size={34} 
                  className="border border-amber-400/60 shadow-sm group-hover:border-amber-400"
                />
              </div>
              <span className="hidden md:inline text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-amber-400 max-w-[110px] truncate pr-1">
                {profile.name || 'Scholar'}
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* CORE PAGES RENDER STAGE */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-2 min-[360px]:px-3 sm:px-4 py-2 sm:py-4 pb-24 sm:pb-28">
        
        {/* EthioLearn Native Mini Highlight / Announcement Bar */}
        {currentPage !== 'upgrade' && (
          <EthioLearnAppPromoBanner 
            profile={profile}
            language={language}
            onUpgradeClick={() => setCurrentPage('upgrade')}
            onNavigate={(page) => setCurrentPage(page as any)}
            onInstallClick={triggerPWAInstall}
            positionContext={`app-${currentPage}-top`}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {currentPage === 'home' && (
              <HomeDashboard 
                profile={profile}
                language={language}
                onNavigate={(page, context) => {
                  if (context) setAiContext(context);
                  setCurrentPage(page as any);
                }}
                onUpdateGrade={handleUpdateGrade}
                streakCount={streak}
                studyHoursCount={studyHours}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                onOpenAnnouncements={() => setShowAnnouncementsModal(true)}
              />
            )}

            {currentPage === 'examengine' && (
              <ExamEngineView 
                profile={profile}
                apiKey={profile.claudeApiKey || ""}
                language={language}
                onNavigate={(page) => setCurrentPage(page as any)}
                onOpenAITutorWithContext={(_ctx) => {
                  playClickChime();
                  setCurrentPage('quiz');
                }}
                onStudyAction={handleRecordStudyAction}
              />
            )}

            {(currentPage === 'quiz' || currentPage === 'tutor') && (
              <ExamPrep 
                apiKey={profile.claudeApiKey || ""}
                enrolledSubjects={profile.subjects}
                onStudyAction={handleRecordStudyAction}
                onNavigateBack={() => setCurrentPage('home')}
                isPro={Boolean(profile.isPro)}
                onNavigateToUpgrade={() => setCurrentPage('upgrade')}
              />
            )}

            {currentPage === 'profile' && (
              <StudentProfileView 
                profile={profile}
                language={language}
                onUpdateProfile={handleUpdateProfile}
                streakCount={streak}
                studyHoursCount={studyHours}
                googleUser={googleUser}
                onGoogleSignIn={handleGoogleSignIn}
                onGoogleSignOut={handleGoogleSignOut}
                isInstallable={isInstallable}
                triggerPWAInstall={triggerPWAInstall}
                onSignOut={handleSignOut}
                onNavigateToUpgrade={() => setCurrentPage('upgrade')}
                onOpenAdmin={isUserAdmin ? () => setIsAdminOpen(true) : undefined}
                textSize={textSize}
                onUpdateTextSize={setTextSize}
              />
            )}

            {currentPage === 'notes' && (
              <StudyNotesView 
                apiKey={profile.claudeApiKey || ""}
                customNotes={customNotes}
                onSaveCustomNotes={handleSaveCustomNotes}
                enrolledSubjects={profile.subjects}
                googleUser={googleUser}
                googleToken={googleToken}
                onGoogleSignIn={handleGoogleSignIn}
                onGoogleSignOut={handleGoogleSignOut}
                decksState={decksState}
                onSaveDecksState={handleSaveDecksState}
                onOpenInAppViewer={(url, title) => { setInAppViewerUrl(url); setInAppViewerTitle(title); }}
                language={language}
                userId={profile.firebaseUid || profile.email || 'student_wku'}
              />
            )}

            {currentPage === 'bookstore' && (
              <BookStoreView 
                profile={profile}
                apiKey={profile.claudeApiKey || ""}
                language={language}
                onNavigate={(p) => setCurrentPage(p as any)}
                onStudyAction={handleRecordStudyAction}
                supabaseBooks={supabaseBooks}
                onOpenInAppViewer={(url, title) => { setInAppViewerUrl(url); setInAppViewerTitle(title); }}
              />
            )}

            {currentPage === 'university' && (
              <UniversityExamsView 
                profile={profile}
                apiKey={profile.claudeApiKey || ""}
                language={language}
                onNavigate={(p) => setCurrentPage(p as any)}
                onStudyAction={handleRecordStudyAction}
                onOpenInAppViewer={(url, title) => { setInAppViewerUrl(url); setInAppViewerTitle(title); }}
              />
            )}

            {currentPage === 'upgrade' && (
              <UpgradeProView 
                profile={profile}
                language={language}
                onUpdateProfile={handleUpdateProfile}
                onClose={() => setCurrentPage('home')}
              />
            )}

            {currentPage === 'examprep' && (
              <ExamNotesHubView 
                language={language}
                onClose={() => setCurrentPage('home')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* PERSISTENT BOTTOM NAVIGATION TAB BAR (Native Android Style) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1228]/95 backdrop-blur-md border-t border-slate-800/90 shadow-lg"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      >
        <div className="grid grid-cols-5 max-w-xl mx-auto px-1 py-1.5 items-center justify-items-center relative">
          
          {/* Home Tab */}
          <button
            onClick={() => { triggerHaptic('light'); playClickChime(); setCurrentPage('home'); }}
            className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1 transition-colors cursor-pointer rounded-xl px-0.5 min-[360px]:px-1 ${
              currentPage === 'home' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`px-2 min-[360px]:px-3 py-0.5 min-[360px]:py-1 rounded-full transition-colors ${currentPage === 'home' ? 'bg-amber-400/15 text-amber-400' : 'text-slate-400'}`}>
              <HomeIcon className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 shrink-0" />
            </div>
            <span className={`text-[10px] min-[360px]:text-[11px] sm:text-xs mt-0.5 truncate max-w-[58px] min-[360px]:max-w-[76px] sm:max-w-[88px] text-center leading-tight ${currentPage === 'home' ? 'font-bold text-amber-400' : 'font-medium text-slate-300'}`}>
              {language === 'en' ? 'Home' : 'ዋና'}
            </span>
          </button>

          {/* Notes Tab */}
          <button
            onClick={() => { triggerHaptic('light'); playClickChime(); setCurrentPage('notes'); }}
            className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1 transition-colors cursor-pointer rounded-xl px-0.5 min-[360px]:px-1 ${
              currentPage === 'notes' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`px-2 min-[360px]:px-3 py-0.5 min-[360px]:py-1 rounded-full transition-colors ${currentPage === 'notes' ? 'bg-amber-400/15 text-amber-400' : 'text-slate-400'}`}>
              <FileText className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 shrink-0" />
            </div>
            <span className={`text-[10px] min-[360px]:text-[11px] sm:text-xs mt-0.5 truncate max-w-[58px] min-[360px]:max-w-[76px] sm:max-w-[88px] text-center leading-tight ${currentPage === 'notes' ? 'font-bold text-amber-400' : 'font-medium text-slate-300'}`}>
              {language === 'en' ? 'Notes' : 'ማስታወሻ'}
            </span>
          </button>

          {/* Book Store Tab */}
          <button
            onClick={() => { triggerHaptic('light'); playClickChime(); setCurrentPage('bookstore'); }}
            className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1 transition-colors cursor-pointer rounded-xl px-0.5 min-[360px]:px-1 ${
              currentPage === 'bookstore' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`px-2 min-[360px]:px-3 py-0.5 min-[360px]:py-1 rounded-full transition-colors ${currentPage === 'bookstore' ? 'bg-amber-400/15 text-amber-400' : 'text-slate-400'}`}>
              <BookOpen className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 shrink-0" />
            </div>
            <span className={`text-[10px] min-[360px]:text-[11px] sm:text-xs mt-0.5 truncate max-w-[58px] min-[360px]:max-w-[76px] sm:max-w-[88px] text-center leading-tight ${currentPage === 'bookstore' ? 'font-bold text-amber-400' : 'font-medium text-slate-300'}`}>
              {language === 'en' ? 'Books' : 'መጽሐፍት'}
            </span>
          </button>

          {/* University past exams Tab */}
          <button
            onClick={() => { triggerHaptic('light'); playClickChime(); setCurrentPage('university'); }}
            className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1 transition-colors cursor-pointer rounded-xl px-0.5 min-[360px]:px-1 ${
              currentPage === 'university' || currentPage === 'examengine' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="University Exams"
          >
            <div className={`px-2 min-[360px]:px-3 py-0.5 min-[360px]:py-1 rounded-full transition-colors ${currentPage === 'university' || currentPage === 'examengine' ? 'bg-amber-400/15 text-amber-400' : 'text-slate-400'}`}>
              <Award className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 shrink-0" />
            </div>
            <span className={`text-[10px] min-[360px]:text-[11px] sm:text-xs mt-0.5 truncate max-w-[58px] min-[360px]:max-w-[76px] sm:max-w-[88px] text-center leading-tight ${currentPage === 'university' || currentPage === 'examengine' ? 'font-bold text-amber-400' : 'font-medium text-slate-300'}`}>
              {language === 'en' ? 'Uni Exam' : 'ዩኒቨርሲቲ'}
            </span>
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => { triggerHaptic('light'); playClickChime(); setCurrentPage('profile'); }}
            className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1 transition-colors cursor-pointer rounded-xl px-0.5 min-[360px]:px-1 ${
              currentPage === 'profile' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`px-1.5 min-[360px]:px-2 py-0.5 rounded-full transition-colors ${currentPage === 'profile' ? 'bg-amber-400/15' : ''}`}>
              <StudentAvatar 
                avatar={profile.avatar} 
                name={profile.name} 
                size={20} 
                className={`transition-all ${currentPage === 'profile' ? 'border-2 border-amber-400 scale-105' : 'border border-slate-700 opacity-80'}`}
              />
            </div>
            <span className={`text-[10px] min-[360px]:text-[11px] sm:text-xs mt-0.5 truncate max-w-[58px] min-[360px]:max-w-[76px] sm:max-w-[88px] text-center leading-tight ${currentPage === 'profile' ? 'font-bold text-amber-400' : 'font-medium text-slate-300'}`}>
              {language === 'en' ? 'Profile' : 'መገለጫ'}
            </span>
          </button>
        </div>
      </nav>

      {/* Floating Popup Blocked Dialog for Main App */}
      {isPopupBlockedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0c0d12] rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-serif text-base font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                  Google Sign-In Popup Blocked
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Your browser's popup blocker has blocked the Google Authentication window. This is common when running inside preview frames.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-slate-700 dark:text-zinc-300">
              <p>• <strong className="text-slate-800 dark:text-zinc-100">Tip:</strong> Allow popups for this site in your browser address bar.</p>
              <p>• <strong className="text-slate-800 dark:text-zinc-100">Direct Connect:</strong> Click the button below to open the Google Sign-In window.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { playClickChime(); setIsPopupBlockedApp(false); }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black rounded-xl text-xs font-black uppercase cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>⚡ Open Google Sign-In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Standalone App Setup Banner */}
      <AnimatePresence>
        {showIOSPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed bottom-[76px] left-4 right-4 md:left-auto md:right-4 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-slate-200/90 dark:border-zinc-800/90 shadow-[0_10px_35px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] p-4 rounded-2xl max-w-sm flex items-start gap-3.5 select-none"
          >
            {/* Left Column: Full Branded light Icon */}
            <img 
              src="/ethiolearn_icon.jpg" 
              alt="EthioLearn Pro App Icon" 
              className="w-11 h-11 rounded-xl shadow-md border border-slate-200/50 dark:border-zinc-800/50 shrink-0 object-cover"
            />
            
            {/* Mid Column: Instructions */}
            <div className="flex-grow space-y-1 text-left">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1 font-serif tracking-tight">
                📱 Install on your iPhone
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-normal font-sans">
                {language === 'en' ? (
                  <>
                    Tap Safari's <span className="inline-flex items-center align-middle px-1 py-0.5 bg-slate-100 dark:bg-zinc-900 rounded text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 font-mono text-[9px]"><Share className="w-2.5 h-2.5 inline mr-0.5" />share</span> then select <strong className="text-slate-800 dark:text-white">Add to Home Screen</strong>.
                  </>
                ) : (
                  <>
                    በእጅ ስልክዎ ለመጫን የሳፋሪን <span className="inline-flex items-center align-middle px-1 py-0.5 bg-slate-100 dark:bg-zinc-900 rounded text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 font-mono text-[9px]"><Share className="w-2.5 h-2.5 inline mr-0.5" />ማጋሪያ (Share)</span> ቁልፍ በመንካት <strong className="text-slate-800 dark:text-white">ወده መነሻ ገጽ አክል</strong> ይምረጡ።
                  </>
                )}
              </p>
            </div>

            {/* Close Column */}
            <button
              onClick={handleDismissIOSPrompt}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Status Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#078930] text-white px-4 py-3 rounded-xl text-xs font-serif font-black shadow-lg flex items-center gap-1.5 animate-bounce">
          <span>🎯</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global In-App Document & Web Viewer Modal Overlay */}
      {inAppViewerUrl && (
        <InAppViewerModal
          url={inAppViewerUrl}
          title={inAppViewerTitle}
          onClose={() => {
            setInAppViewerUrl(null);
            setInAppViewerTitle('');
          }}
        />
      )}

      {/* Admin Control Dashboard Modal Overlay - Strictly restricted to verified admin */}
      {isUserAdmin && isAdminOpen && (
        <AdminDashboardView
          currentProfile={profile}
          language={language}
          onClose={() => setIsAdminOpen(false)}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* 📱 Slide-over App Sidebar with Phone, Email, Telegram & App Details */}
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        language={language}
        setLanguage={setLanguage}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        onNavigate={(page) => {
          setCurrentPage(page as any);
          setIsSidebarOpen(false);
        }}
        profile={profile}
        ethDateFormatted={ethDate.formatted}
        onOpenLegal={(tab) => {
          setLegalModalTab(tab);
          setShowLegalModal(true);
        }}
        isUserAdmin={isUserAdmin}
        onOpenAnnouncements={() => setShowAnnouncementsModal(true)}
        onOpenAdmin={isUserAdmin ? () => {
          setIsSidebarOpen(false);
          setIsAdminOpen(true);
        } : undefined}
        onSignOut={handleSignOut}
      />

      {/* 📜 Legal, Privacy & About EthioLearn Modal */}
      <LegalPrivacyTermsModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        language={language}
        initialTab={legalModalTab}
        onAcceptAndClose={() => setShowLegalModal(false)}
      />

      {/* 📢 Official Campus Announcements & Bulletin Board Modal */}
      <AnnouncementsModal
        isOpen={showAnnouncementsModal}
        onClose={() => setShowAnnouncementsModal(false)}
        language={language}
        onNavigate={(page) => setCurrentPage(page as any)}
        isAdmin={isUserAdmin}
        onOpenAdminAnnouncements={isUserAdmin ? () => {
          setIsAdminOpen(true);
        } : undefined}
      />

      {/* 📶 PWA Offline Indicator Pill */}
      <OfflineIndicator language={language} />
    </div>
  );
}
