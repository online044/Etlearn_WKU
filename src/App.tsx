/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, Bot, Trophy, Award, Sparkles, Calendar, Sun, Moon, User as UserIcon, BookOpen, CheckCircle,
  Share, X, ShieldCheck
} from 'lucide-react';

import { StudentProfile, CustomNote, Flashcard, AITeacherContext } from './types';
import SplashOnboarding from './components/SplashOnboarding';
import PWADownloadAssistant from './components/PWADownloadAssistant';
import AITutor from './components/AITutor';
import ExamPrep from './components/ExamPrep';
import StudyNotesView from './components/StudyNotesView';
import HomeDashboard from './components/HomeDashboard';
import StudentProfileView from './components/StudentProfileView';
import BookStoreView from './components/BookStoreView';
import UniversityExamsView from './components/UniversityExamsView';
import UpgradeProView from './components/UpgradeProView';
import EthioLearnLogo from './components/EthioLearnLogo';
import SupportChatBubble from './components/SupportChatBubble';
import ExamNotesHubView from './components/ExamNotesHubView';
import InAppViewerModal from './components/InAppViewerModal';
import AdminDashboardView from './components/AdminDashboardView';
import CourseExperienceView from './components/CourseExperienceView';
import ExamEngineView from './components/ExamEngineView';
import GoogleAdBanner from './components/GoogleAdBanner';

import { 
  testFirestoreConnection, 
  syncProfileToFirestore, 
  fetchProfileFromFirestore, 
  saveNoteToFirestore, 
  deleteNoteFromFirestore, 
  fetchNotesFromFirestore,
  auth
} from './utils/firebaseStore';
import { signOut as firebaseSignOut } from 'firebase/auth';

import { getEthiopianDate } from './utils/ethiopianCalendar';
import { playClickChime, playSuccessChime, playFailureChime } from './utils/audio';
import { initAuth, googleSignIn, googleSignInRedirect, logoutGoogle, exportAnalyticsToGoogleSheets } from './utils/workspace';
import { User as FirebaseUser } from 'firebase/auth';
import { initSupabaseConfig, getSupabase, clearSessionToken, syncAuthSessionWithServer } from './utils/supabaseClient';
import { safeStorage } from './utils/safeStorage';
import { isAdministratorEmail, ADMIN_EMAIL } from './utils/adminAuth';
import { 
  getTelegramWebApp, 
  isTelegramWebApp, 
  initTelegramWebApp, 
  getTelegramUser, 
  verifyAndSyncTelegramAuth, 
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

export default function App() {
  // Load profile with multi-layer fallback to reliably remember the student
  const [profile, setProfile] = useState<StudentProfile | null>(() => {
    // 1. Check primary current profile
    const saved = safeStorage.getItem('ethiolearn_current_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
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
          if (activeEmail) {
            const match = accounts.find(a => a.email && a.email.toLowerCase() === activeEmail.toLowerCase());
            if (match?.profile) {
              safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(match.profile));
              return match.profile;
            }
          }
          // If any account has rememberMe active
          const remembered = accounts.find(a => a.rememberMe);
          if (remembered?.profile) {
            safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(remembered.profile));
            safeStorage.setItem('ethiolearn_active_email', remembered.email);
            return remembered.profile;
          }
          // If only 1 account exists on device, restore it automatically
          if (accounts.length === 1 && accounts[0].profile) {
            safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(accounts[0].profile));
            safeStorage.setItem('ethiolearn_active_email', accounts[0].email);
            return accounts[0].profile;
          }
        }
      } catch (e) {}
    }
    return null;
  });

  // Persistent language preference
  const [language, setLanguage] = useState<'en' | 'am'>(() => {
    const saved = safeStorage.getItem('ethiolearn_language_preference');
    return (saved === 'am' || saved === 'en') ? saved : 'en';
  });

  const [currentPage, setCurrentPage] = useState<'home' | 'tutor' | 'quiz' | 'profile' | 'notes' | 'bookstore' | 'university' | 'upgrade' | 'examprep' | 'courses' | 'examengine'>('home');
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

  // Supabase books sync state
  const [supabaseBooks, setSupabaseBooks] = useState<any[]>([]);

  // Ethiopian Calendar support
  const [ethDate, setEthDate] = useState({ day: 1, monthName: "መስከረም", year: 2016, formatted: "መስከረም 1, 2016" });

  // Administrator authorization check (Strictly restricted to ezrat2116@gmail.com)
  const isUserAdmin = Boolean(
    isAdministratorEmail(profile?.email) || 
    isAdministratorEmail(supaUser?.email) || 
    isAdministratorEmail(googleUser?.email)
  );

  // PWA elements
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  // In-App Viewer States
  const [inAppViewerUrl, setInAppViewerUrl] = useState<string | null>(null);
  const [inAppViewerTitle, setInAppViewerTitle] = useState<string>('');

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
        tg.MainButton.setText(language === 'en' ? 'UPGRADE TO PRO (200 BIRR)' : 'ወደ ፕሮ አባልነት አሳድግ (200 ብር)');
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

  // Firebase auth sync
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Firestore connection liveness test
  useEffect(() => {
    testFirestoreConnection();
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
      const supaClient = getSupabase();
      if (!supaClient) {
        console.log('New Supabase client is not initialized (missing environment keys).');
        return;
      }
      try {
        const { data, error } = await supaClient
          .from('books')
          .select('*')
          .order('title', { ascending: true });

        if (error) {
          console.warn('Error fetching books list from "books" table in App.tsx:', error);
        } else if (data) {
          setSupabaseBooks(data);
          console.log('Successfully fetched curriculum books list from Supabase in App.tsx:', data);
        }
      } catch (err) {
        console.error('Failed to coordinate Supabase request in App.tsx:', err);
      }
    }
    fetchBooks();
  }, []);

  const triggerPWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleOnboardingComplete = (completedProfile: StudentProfile) => {
    // Override theme to default to current selected style
    const updated = { ...completedProfile, theme: themeMode };
    setProfile(updated);
    safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(updated));
    if (completedProfile.email) {
      safeStorage.setItem('ethiolearn_active_email', completedProfile.email.toLowerCase().trim());
    }
    syncWithSupabase(updated);
    playSuccessChime();
    showToast(`Welcome ${completedProfile.name}!`);
  };

  const handleProfileReset = () => {
    playClickChime();
    if (window.confirm("Would you like to reset your profile and re-register?")) {
      safeStorage.removeItem('ethiolearn_current_profile');
      setProfile(null);
    }
  };

  const handleSignOut = async () => {
    playClickChime();
    // Clear local profile and authentication variables
    safeStorage.removeItem('ethiolearn_current_profile');
    safeStorage.removeItem('ethiolearn_active_email');
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
    showToast(language === 'en' ? "Signed out successfully." : "በተሳካ ሁኔታ ወጥተዋል።");
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
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        playSuccessChime();
        showToast(`Signed in securely with ${res.user.email}!`);
      }
    } catch (err: any) {
      console.error(err);
      playFailureChime();
      if (err?.isPopupBlocked || err?.code === 'auth/popup-blocked' || err?.message?.includes('popup')) {
        setIsPopupBlockedApp(true);
      } else {
        showToast("Google connection canceled or failed.");
      }
    }
  };

  const handleGoogleSignInRedirect = async () => {
    try {
      setIsPopupBlockedApp(false);
      playClickChime();
      await googleSignInRedirect();
    } catch (err: any) {
      console.error(err);
      playFailureChime();
      showToast("Google Redirect Sign-In failed.");
    }
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

  if (!profile) {
    return (
      <SplashOnboarding 
        onComplete={handleOnboardingComplete} 
        initialProfile={null} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050508] text-slate-800 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* HEADER BAR FOR TITLE AND ETHIOPIAN CALENDAR */}
      <header 
        className="sticky top-0 z-50 bg-white/95 dark:bg-[#0c0d12]/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/85 shadow-sm select-none"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <EthioLearnLogo size={42} showCardBackground={true} iconOnly={true} className="hover:rotate-6 duration-300 transition-all shrink-0" />
              <div className="leading-none text-left">
                <div className="flex items-center">
                  <span className="font-serif font-black text-slate-900 dark:text-white text-lg tracking-tight">ET_LEARN</span>
                  {profile.isPro && (
                    <span className="text-[#F59E0B] text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 ml-1.5 font-sans">PRO</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-semibold">{profile.university || 'Learn Smarter. Prepare Better.'}</span>
              </div>
            </div>

            {isOffline && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.1 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-405 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {language === 'en' ? 'Offline' : 'ከዓለም አቀፍ መረብ ውጭ'}
              </span>
            )}
          </div>

          {/* Ethiopian Date Widget */}
          <div className="hidden md:flex items-center gap-2 border border-slate-200 dark:border-zinc-850 px-3 py-1.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl">
            <span className="text-sm">📅</span>
            <div className="text-left select-none">
              <span className="block font-bold text-slate-700 dark:text-zinc-200 text-[11px] leading-tight font-serif">{ethDate.formatted}</span>
              <span className="block text-[8.5px] text-[#078930] dark:text-emerald-500 font-black uppercase tracking-wider font-sans">Ge'ez Calendar Active</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bilingual Quick Selector */}
            <div className="flex bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-805 rounded-xl p-0.5">
              <button
                onClick={() => { setLanguage('en'); playClickChime(); }}
                className={`text-[10.5px] font-extrabold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  language === 'en' ? 'bg-[#078930] text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => { setLanguage('am'); playClickChime(); }}
                className={`text-[10.5px] font-extrabold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  language === 'am' ? 'bg-[#078930] text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                አማ
              </button>
            </div>

            {/* Interactive Theme Mode Toggle with Pro Lighting */}
            <button
              onClick={() => {
                const newTheme = themeMode === 'dark' ? 'light' : 'dark';
                setThemeMode(newTheme);
                playClickChime();
              }}
              className="p-2.5 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-500 dark:text-zinc-400 cursor-pointer transition-colors"
              title={themeMode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {themeMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-slate-500" />
              )}
            </button>



            {/* Admin Dashboard Shield Button - Strictly visible ONLY to ezrat2116@gmail.com */}
            {isUserAdmin && (
              <button
                onClick={() => { playClickChime(); setIsAdminOpen(true); }}
                className="p-2.5 border border-amber-500/30 bg-amber-500/10 rounded-xl hover:bg-amber-500/20 text-amber-500 cursor-pointer transition-all flex items-center gap-1"
                title="Admin Control Dashboard (ezrat2116@gmail.com)"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden lg:inline text-[10px] font-black uppercase tracking-wider">Admin</span>
              </button>
            )}

            {profile.isPro && (
              <div 
                onClick={() => { playClickChime(); setCurrentPage('upgrade'); }}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-600 dark:text-blue-400 text-xs font-bold leading-none cursor-pointer"
                title="Verified Pro Scholar"
              >
                <CheckCircle className="w-3.5 h-3.5 fill-blue-500 text-white dark:text-[#050508]" />
                <span className="text-[10px] uppercase font-black tracking-wider">Pro User</span>
              </div>
            )}

            <button
              onClick={handleProfileReset}
              className="p-2.5 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 rounded-xl hover:bg-red-50 dark:hover:bg-zinc-800 hover:text-red-650 transition-all text-slate-500 dark:text-zinc-400 cursor-pointer"
              title="Reset Profile"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* CORE PAGES RENDER STAGE */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-6 md:py-8 pb-28">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
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
                onSelectCourse={(courseId) => {
                  setCurrentPage('courses');
                }}
              />
            )}

            {currentPage === 'courses' && (
              <CourseExperienceView 
                profile={profile}
                apiKey={profile.claudeApiKey || ""}
                language={language}
                onNavigate={(page) => setCurrentPage(page as any)}
                onOpenAITutorWithContext={(ctx) => {
                  setAiContext(ctx);
                  setCurrentPage('tutor');
                }}
                onStudyAction={handleRecordStudyAction}
                onOpenInAppViewer={(url, title) => { setInAppViewerUrl(url); setInAppViewerTitle(title); }}
              />
            )}

            {currentPage === 'examengine' && (
              <ExamEngineView 
                profile={profile}
                apiKey={profile.claudeApiKey || ""}
                language={language}
                onNavigate={(page) => setCurrentPage(page as any)}
                onOpenAITutorWithContext={(ctx) => {
                  setAiContext(ctx);
                  setCurrentPage('tutor');
                }}
                onStudyAction={handleRecordStudyAction}
              />
            )}

            {currentPage === 'tutor' && (
              <AITutor 
                apiKey={profile.claudeApiKey || ""}
                enrolledSubjects={profile.subjects}
                decksState={decksState}
                onSaveDecksState={handleSaveDecksState}
                onStudyAction={handleRecordStudyAction}
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onOpenUpgrade={() => setCurrentPage('upgrade')}
                context={aiContext}
                onClearContext={() => setAiContext(null)}
              />
            )}

            {currentPage === 'quiz' && (
              <ExamPrep 
                apiKey={profile.claudeApiKey || ""}
                enrolledSubjects={profile.subjects}
                onStudyAction={handleRecordStudyAction}
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
                onOpenAdmin={() => setIsAdminOpen(true)}
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

        {/* Free Tier Google AdSense Banner (Only displayed for students who have not upgraded to Pro) */}
        {currentPage !== 'upgrade' && !profile.isPro && (
          <GoogleAdBanner 
            profile={profile}
            language={language}
            onUpgradeClick={() => setCurrentPage('upgrade')}
            positionContext={`app-${currentPage}-footer`}
          />
        )}
      </main>

      {/* PERSISTENT BOTTOM NAVIGATION TAB BAR (Requirement) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0c0d12]/95 border-t border-slate-200 dark:border-zinc-800/80 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Shifting active color bar indicator */}
        <div className="grid grid-cols-6 max-w-2xl mx-auto h-[3px]">
          <div className={currentPage === 'home' ? "bg-[#078930]" : "bg-transparent"} />
          <div className={currentPage === 'tutor' ? "bg-[#078930]" : "bg-transparent"} />
          <div className={currentPage === 'quiz' ? "bg-[#078930]" : "bg-transparent"} />
          <div className={currentPage === 'bookstore' ? "bg-[#078930]" : "bg-transparent"} />
          <div className={currentPage === 'university' ? "bg-[#078930]" : "bg-transparent"} />
          <div className={currentPage === 'profile' ? "bg-[#078930]" : "bg-transparent"} />
        </div>

        <div className="grid grid-cols-6 max-w-2xl mx-auto px-1 py-1 select-none h-16">
          
          {/* Home Tab */}
          <button
            onClick={() => { playClickChime(); setCurrentPage('home'); }}
            className={`flex flex-col items-center justify-center w-full transition-all cursor-pointer rounded-xl ${
              currentPage === 'home' ? 'text-[#078930] dark:text-emerald-400 font-extrabold scale-105' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            <HomeIcon className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-semibold mt-1">
              {language === 'en' ? 'Home' : 'ቤት'}
            </span>
          </button>

          {/* Ask Teacher Tab */}
          <button
            onClick={() => { playClickChime(); setCurrentPage('tutor'); }}
            className={`flex flex-col items-center justify-center w-full transition-all cursor-pointer rounded-xl ${
              currentPage === 'tutor' ? 'text-[#078930] dark:text-emerald-400 font-extrabold scale-105' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            <Bot className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-semibold mt-1">
              {language === 'en' ? 'Ask Teacher' : 'መምህሩን ጠይቅ'}
            </span>
          </button>

          {/* Quizzes Tab */}
          <button
            onClick={() => { playClickChime(); setCurrentPage('quiz'); }}
            className={`flex flex-col items-center justify-center w-full transition-all cursor-pointer rounded-xl ${
              currentPage === 'quiz' ? 'text-[#078930] dark:text-emerald-400 font-extrabold scale-105' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            <Trophy className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-semibold mt-1">
              {language === 'en' ? 'Quizzes' : 'ፈተናዎች'}
            </span>
          </button>

          {/* Book Store Tab */}
          <button
            onClick={() => { playClickChime(); setCurrentPage('bookstore'); }}
            className={`flex flex-col items-center justify-center w-full transition-all cursor-pointer rounded-xl ${
              currentPage === 'bookstore' ? 'text-[#078930] dark:text-emerald-400 font-extrabold scale-105' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
            title="Book Store MoDules"
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-semibold mt-1">
              {language === 'en' ? 'Books' : 'መጻሕፍት'}
            </span>
          </button>

          {/* University past exams Tab */}
          <button
            onClick={() => { playClickChime(); setCurrentPage('university'); }}
            className={`flex flex-col items-center justify-center w-full transition-all cursor-pointer rounded-xl ${
              currentPage === 'university' ? 'text-[#078930] dark:text-emerald-400 font-extrabold scale-105' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
            title="University Exams"
          >
            <Award className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-semibold mt-1">
              {language === 'en' ? 'Uni Exam' : 'ዩኒቨርሲቲ'}
            </span>
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => { playClickChime(); setCurrentPage('profile'); }}
            className={`flex flex-col items-center justify-center w-full transition-all cursor-pointer rounded-xl ${
              currentPage === 'profile' ? 'text-[#078930] dark:text-emerald-400 font-extrabold scale-105' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
          >
            <UserIcon className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-semibold mt-1">
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

            <div className="p-3 bg-[#078930]/5 dark:bg-[#078930]/10 border border-[#078930]/15 dark:border-[#078930]/35 rounded-xl space-y-1.5 text-xs text-slate-700 dark:text-zinc-300">
              <p>• <strong className="text-slate-800 dark:text-zinc-100">Recommended:</strong> Click the <strong className="text-[#078930] dark:text-emerald-400">"Open in new tab"</strong> button at the top right of this preview to connect securely.</p>
              <p>• <strong className="text-slate-800 dark:text-zinc-100">Alternative:</strong> Try signing in using the standard redirect flow below.</p>
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
                onClick={handleGoogleSignInRedirect}
                className="px-4 py-2 bg-[#078930] hover:bg-[#1A7A3C] text-white rounded-xl text-xs font-black uppercase cursor-pointer transition-all"
              >
                ⚡ Use Redirect Sign-In
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

      {/* Admin Control Dashboard Modal Overlay - Strictly restricted to ezrat2116@gmail.com */}
      {isAdminOpen && isUserAdmin && (
        <AdminDashboardView
          currentProfile={profile}
          language={language}
          onClose={() => setIsAdminOpen(false)}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* Floating conversational support assistant chat bubble */}
      <SupportChatBubble language={language} studentName={profile?.name} />
    </div>
  );
}
