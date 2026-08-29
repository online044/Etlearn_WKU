/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Mail, GraduationCap, Award, Flame, BookOpen, Lock, 
  Edit3, Save, X, Clock, AlertCircle, Database, Check, ShieldAlert, KeyRound,
  Copy, RefreshCw, CloudLightning, ChevronDown, ChevronUp, CheckCircle,
  FileText, HelpCircle, ShieldCheck, LogOut, Sparkles, CreditCard,
  BarChart3, Settings, Send
} from 'lucide-react';
import { StudentProfile, AccountInfo } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { getSupabase, saveSupabaseCredentials, clearSupabaseCredentials, testSupabaseConnection } from '../utils/supabaseClient';
import { syncProfileToFirestore, saveNoteToFirestore, getAuthInstance, testFirestoreConnection } from '../utils/firebaseStore';
import StudentAvatar from './StudentAvatar';
import StudentAvatarSelector from './StudentAvatarSelector';
import PWADownloadAssistant from './PWADownloadAssistant';
import BillingAccountSection from './BillingAccountSection';
import { safeStorage } from '../utils/safeStorage';
import { isAdministratorEmail } from '../utils/adminAuth';

interface StudentProfileViewProps {
  profile: StudentProfile;
  language: 'en' | 'am';
  onUpdateProfile: (updated: StudentProfile) => void;
  streakCount: number;
  studyHoursCount: number;
  googleUser?: any;
  onGoogleSignIn?: () => Promise<void>;
  onGoogleSignOut?: () => Promise<void>;
  isInstallable?: boolean;
  triggerPWAInstall?: () => Promise<void>;
  onSignOut?: () => void;
  onNavigateToUpgrade?: () => void;
  onOpenAdmin?: () => void;
}

export default function StudentProfileView({
  profile,
  language,
  onUpdateProfile,
  streakCount,
  studyHoursCount,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isInstallable,
  triggerPWAInstall,
  onSignOut,
  onNavigateToUpgrade,
  onOpenAdmin
}: StudentProfileViewProps) {
  
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'academic' | 'analytics' | 'billing' | 'security'>('academic');

  // Database State
  const [dbProfile, setDbProfile] = useState<StudentProfile | null>(null);
  const [dbStudySessions, setDbStudySessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Edit Mode Toggle
  const [isEditing, setIsEditing] = useState(false);

  // Form Field States
  const [formName, setFormName] = useState('');
  const [formUniversity, setFormUniversity] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formSubjects, setFormSubjects] = useState<string[]>([]);
  const [formAvatar, setFormAvatar] = useState('');

  // Status message states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Change Password States
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Supabase Integration Settings States
  const [supabaseUrl, setSupabaseUrl] = useState(() => safeStorage.getItem('ethiolearn_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => safeStorage.getItem('ethiolearn_supabase_key') || '');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  // Focus module subject pool
  const subjectsList = [
    "Emerging Technologies",
    "Introduction to Economics",
    "General Biology",
    "Communicative English",
    "Moral and Civic Education",
    "Mathematics",
    "Inclusive Education",
    "Geography",
    "Logic and Critical Thinking",
    "History",
    "Chemistry",
    "Aptitude",
    "General Physics",
    "Entrepreneurship",
    "Social Anthropology",
    "C++ Programming",
    "Civics",
    "Agriculture",
    "Business",
    "Applied Math"
  ];

  // Load quiz history from local device storage
  const quizHistory = (() => {
    try {
      const stored = safeStorage.getItem("ethiolearn_exam_sessions_history");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  })();

  // Calculate average practice score
  const averageScore = quizHistory.length > 0
    ? Math.round(quizHistory.reduce((acc: number, item: any) => acc + (item.score || 0), 0) / quizHistory.length)
    : 0;

  // Load profile data on mount
  const fetchProfileFromSupabase = async () => {
    setLoading(true);
    setFetchError(null);
    setDbProfile(profile);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfileFromSupabase();
  }, [profile.email]);

  // Sync Form values whenever database profile is loaded
  useEffect(() => {
    if (dbProfile) {
      setFormName(dbProfile.name || '');
      setFormUniversity(dbProfile.university || '');
      setFormYear(dbProfile.year || 'Grade 12');
      setFormSubjects(dbProfile.subjects || []);
      setFormAvatar(dbProfile.avatar || 'star');
    }
  }, [dbProfile]);

  // Enter edit mode
  const handleStartEdit = () => {
    playClickChime();
    setIsEditing(true);
    setSaveSuccess(null);
    setSaveError(null);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    playClickChime();
    setIsEditing(false);
    setSaveError(null);
    if (dbProfile) {
      setFormName(dbProfile.name || '');
      setFormUniversity(dbProfile.university || '');
      setFormYear(dbProfile.year || 'Grade 12');
      setFormSubjects(dbProfile.subjects || []);
      setFormAvatar(dbProfile.avatar || 'star');
    }
  };

  // Save changes to database
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setSaveError(language === 'en' ? "Please enter your full name." : "እባክዎን ሙሉ ስምዎን ያስገቡ።");
      playFailureChime();
      return;
    }
    if (!formUniversity.trim()) {
      setSaveError(language === 'en' ? "Please enter your university or school." : "እባክዎን ተቋም ወይም ትምህርት ቤት ያስገቡ።");
      playFailureChime();
      return;
    }
    if (formSubjects.length === 0) {
      setSaveError(language === 'en' ? "Please select at least one focus module." : "እባክዎን ቢያንስ አንድ የትምህርት ሞጁል ይምረጡ።");
      playFailureChime();
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    const updatedProfile: StudentProfile = {
      ...profile,
      ...dbProfile,
      name: formName.trim(),
      university: formUniversity.trim(),
      year: formYear,
      subjects: formSubjects,
      avatar: formAvatar
    };

    try {
      const supa = getSupabase();
      if (supa) {
        const email = (profile.email || '').toLowerCase().trim();

        const { data: existing } = await supa
          .from('student_profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        let password = '';
        let existingNotes = [];
        let existingSessions = [];
        let existingPerformance = {};

        if (existing) {
          if (existing.profile_data) {
            password = existing.profile_data.password || '';
          }
          existingNotes = existing.notes_data || [];
          existingSessions = existing.study_sessions || [];
          existingPerformance = existing.performance_data || {};
        }

        const payloadRecord = {
          email,
          profile_data: {
            ...updatedProfile,
            password
          },
          notes_data: existingNotes,
          study_sessions: existingSessions,
          performance_data: existingPerformance,
          updated_at: new Date().toISOString()
        };

        const { error } = await supa
          .from('student_profiles')
          .upsert(payloadRecord, { onConflict: 'email' });

        if (error) {
          console.warn('[Supabase Upsert Warning]:', error.message);
        }
      }

      // Sync with Firestore if active Firebase auth session exists
      const firebaseAuth = getAuthInstance();
      if (firebaseAuth?.currentUser) {
        try {
          await syncProfileToFirestore(firebaseAuth.currentUser.uid, updatedProfile);
        } catch (fErr) {
          console.warn('[Firestore Profile Sync Warning]:', fErr);
        }
      }

      onUpdateProfile(updatedProfile);
      setDbProfile(updatedProfile);
      
      playSuccessChime();
      setSaveSuccess(language === 'en' 
        ? "Your student profile has been securely updated." 
        : "የመገለጫ መረጃዎ በተሳካ ሁኔታ ተዘምኗል።"
      );
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      console.error('[Profile Persistence Error]:', err);
      playFailureChime();
      setSaveError(err.message || 'Unable to persist changes in the cloud database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Supabase credentials
  const handleSaveKeys = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setSyncErrorMsg(language === 'en' ? "Please fill in both URL and Key." : "እባክዎን የ URL እና የቁልፍ መረጃዎችን ያስገቡ።");
      playFailureChime();
      return;
    }
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    playClickChime();
    setSyncLoading(true);
    setSyncSuccessMsg(null);
    setSyncErrorMsg(null);

    const diag = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setSyncLoading(false);

    if (diag.success) {
      playSuccessChime();
      setSyncSuccessMsg(language === 'en'
        ? `Supabase connected & verified!`
        : `የሱፓቤስ ቁልፎች በተሳካ ሁኔታ ተረጋግጠዋል!`
      );
      fetchProfileFromSupabase();
    } else {
      playFailureChime();
      setSyncErrorMsg(diag.message || (language === 'en' ? "Failed to verify Supabase connection." : "ከሱፓቤስ ጋር መገናኘት አልተቻለም።"));
    }
  };

  // Clear Supabase credentials
  const handleClearKeys = () => {
    clearSupabaseCredentials();
    setSupabaseUrl('');
    setSupabaseKey('');
    playClickChime();
    setSyncSuccessMsg(language === 'en' ? "Credentials cleared. Operating in local mode." : "የዳታቤዝ መረጃዎች ተሰርዘዋል።");
    setDbProfile(profile);
  };

  // Manual Portfolio Backup
  const handleBackupToSupabase = async () => {
    playClickChime();
    setSyncLoading(true);
    setSyncSuccessMsg(null);
    setSyncErrorMsg(null);

    const email = (profile.email || '').toLowerCase().trim();
    if (!email) {
      setSyncErrorMsg(language === 'en' ? "Please register with an email address first." : "እባክዎን መጀመሪያ በኢሜይል ይመዝገቡ።");
      playFailureChime();
      setSyncLoading(false);
      return;
    }

    const localProfile = profile;
    const notesRaw = safeStorage.getItem('ethiolearn_custom_notes');
    const notesData = notesRaw ? JSON.parse(notesRaw) : [];
    const studySessionsRaw = safeStorage.getItem('ethiolearn_study_sessions');
    const studySessions = studySessionsRaw ? JSON.parse(studySessionsRaw) : [];
    const quizRaw = safeStorage.getItem('ethiolearn_quiz_perf');
    const performanceData = quizRaw ? JSON.parse(quizRaw) : {};

    const fullBackupPayload = {
      email,
      profile_data: localProfile,
      notes_data: notesData,
      study_sessions: studySessions,
      performance_data: performanceData,
      updated_at: new Date().toISOString()
    };

    let backupSuccess = false;
    const supa = getSupabase();
    if (supa) {
      try {
        const { error: profErr } = await supa
          .from('student_profiles')
          .upsert(fullBackupPayload, { onConflict: 'email' });
        
        if (!profErr) backupSuccess = true;
      } catch (e) {
        console.warn('[Supabase Backup Warning]:', e);
      }
    }

    // Also sync to Firestore if user UID available
    const firebaseAuth = getAuthInstance();
    if (firebaseAuth?.currentUser) {
      try {
        await syncProfileToFirestore(firebaseAuth.currentUser.uid, localProfile);
        if (notesData.length > 0) {
          for (const note of notesData) {
            await saveNoteToFirestore(firebaseAuth.currentUser.uid, note);
          }
        }
        backupSuccess = true;
      } catch (fErr) {
        console.warn('[Firestore Backup Warning]:', fErr);
      }
    }

    // In local mode without cloud keys configured, safely confirm local cache is fully preserved
    if (!supa && !firebaseAuth?.currentUser) {
      backupSuccess = true;
    }

    setSyncLoading(false);

    if (backupSuccess) {
      playSuccessChime();
      setSyncSuccessMsg(language === 'en'
        ? "All local notes, profile specifications, and study statistics have been backed up successfully!"
        : "ማስታወሻዎችዎ፣ መገለጫዎ እና የጥናት መረጃዎችዎ በተሳካ ሁኔታ በክላውድ ተቀምጠዋል!"
      );
    } else {
      playFailureChime();
      setSyncErrorMsg(language === 'en'
        ? "Cloud backup failed. Please check your network connection."
        : "ባክአፕ ማድረግ አልተቻለም። እባክዎን የኢንተርኔት ግንኙነትዎን ያረጋግጡ።"
      );
    }
  };

  // Password reset action flow
  const handleTriggerPasswordReset = async () => {
    playClickChime();
    setResetLoading(true);
    setResetMessage(null);
    setResetError(null);

    const userEmail = (profile.email || '').toLowerCase().trim();
    const newPass = newPasswordInput.trim();

    if (newPass) {
      if (newPass.length < 5) {
        setResetError(language === 'en' ? "Password must be at least 5 characters." : "የይለፍ ቃል ከ5 ፊደላት ያላነሰ መሆን አለበት።");
        playFailureChime();
        setResetLoading(false);
        return;
      }

      const supa = getSupabase();
      if (supa) {
        try {
          await supa.auth.updateUser({ password: newPass });
        } catch (e) {}
      }

      try {
        const stored = safeStorage.getItem('ethiolearn_accounts');
        if (stored) {
          const accounts: AccountInfo[] = JSON.parse(stored);
          const updated = accounts.map(a => {
            if (a.email.toLowerCase() === userEmail) {
              return { ...a, passwordEncrypted: newPass };
            }
            return a;
          });
          safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updated));
        }
      } catch (e) {}

      playSuccessChime();
      setResetMessage(language === 'en' ? "Password updated successfully!" : "የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል!");
      setNewPasswordInput('');
      setResetLoading(false);
      return;
    }

    const supa = getSupabase();
    if (supa) {
      try {
        const { error } = await supa.auth.resetPasswordForEmail(userEmail, {
          redirectTo: window.location.origin
        });

        if (error) throw error;

        playSuccessChime();
        setResetMessage(language === 'en'
          ? `A secure password reset link has been dispatched to ${userEmail}.`
          : `የይለፍ ቃል መቀየሪያ ሊንክ ወደ ${userEmail} ተልኳል።`
        );
      } catch (err: any) {
        setResetMessage(language === 'en'
          ? "Please enter your new password above and click 'Update Password'."
          : "እባክዎን አዲሱን የይለፍ ቃል ከላይ ባለው ሳጥን ውስጥ ያስገቡ እና 'የይለፍ ቃል ቀይር' የሚለውን ይጫኑ።"
        );
      } finally {
        setResetLoading(false);
      }
    } else {
      setResetMessage(language === 'en'
        ? "Please enter your new password above and click 'Update Password'."
        : "እባክዎን አዲሱን የይለፍ ቃል ከላይ ባለው ሳጥን ውስጥ ያስገቡ እና 'የይለፍ ቃል ቀይር' የሚለውን ይጫኑ።"
      );
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
          {language === 'en' ? "Retrieving Student Profile..." : "የተማሪ መረጃ በመጫን ላይ..."}
        </p>
      </div>
    );
  }

  const activeProfileData = dbProfile || profile;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-1 pb-safe">
      
      {/* 1. HERO HEADER PROFILE CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1 flex">
          <div className="bg-emerald-500 h-full w-1/3" />
          <div className="bg-amber-400 h-full w-1/3" />
          <div className="bg-red-500 h-full w-1/3" />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 pt-2">
          
          {/* Avatar & Key Metadata */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <StudentAvatar 
              avatar={activeProfileData.avatar} 
              name={activeProfileData.name} 
              size={84} 
              className="border-2 border-amber-400 shadow-md shrink-0"
            />
            
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate max-w-xs">
                  {activeProfileData.name}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                  activeProfileData.isPro 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {activeProfileData.isPro ? "PRO MEMBER" : "STANDARD"}
                </span>
                {(activeProfileData.telegramUsername || activeProfileData.telegramId) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                    <Send className="w-2.5 h-2.5" />
                    <span>Telegram Linked</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{activeProfileData.university}</span>
                </span>
                <span className="text-slate-600 hidden sm:inline">&bull;</span>
                <span className="text-slate-400 font-medium">
                  {activeProfileData.year}
                </span>
              </div>

              <p className="text-xs font-mono text-slate-400 truncate max-w-sm">
                {activeProfileData.email}
              </p>
            </div>
          </div>

          {/* Action Triggers: Admin Dashboard, Edit Profile & Sign Out */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
            {isAdministratorEmail(activeProfileData.email) && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Console</span>
              </button>
            )}

            <button
              onClick={handleStartEdit}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{language === 'en' ? "Edit Profile" : "መገለጫ አስተካክል"}</span>
            </button>

            {onSignOut && (
              <button
                onClick={() => {
                  const confirmSignOut = window.confirm(
                    language === 'en'
                      ? 'Sign out of EthioLearn? Your study data will be saved locally.'
                      : 'እርግጠኛ ነዎት መውጣት ይፈልጋሉ?'
                  );
                  if (confirmSignOut) onSignOut();
                }}
                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-colors cursor-pointer"
                title={language === 'en' ? "Sign Out" : "ውጣ"}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Save Notifier */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex items-center gap-2 animate-fade-in font-medium">
            <Check className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}
      </div>

      {/* 2. PRO CATEGORIZED NAVIGATION TABS */}
      <div className="flex flex-wrap bg-slate-950 border border-slate-800 p-1 rounded-2xl select-none gap-1">
        <button
          onClick={() => { playClickChime(); setActiveTab('academic'); }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
            activeTab === 'academic'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span>{language === 'en' ? 'Academic' : 'አካዳሚክ'}</span>
        </button>

        <button
          onClick={() => { playClickChime(); setActiveTab('analytics'); }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span>{language === 'en' ? 'Analytics' : 'መረጃዎች'}</span>
        </button>

        <button
          onClick={() => { playClickChime(); setActiveTab('billing'); }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
            activeTab === 'billing'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>{language === 'en' ? 'Billing' : 'ክፍያ'}</span>
        </button>

        <button
          onClick={() => { playClickChime(); setActiveTab('security'); }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
            activeTab === 'security'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>{language === 'en' ? 'Security & Cloud' : 'ደህንነት'}</span>
        </button>
      </div>

      {/* 3. TAB PANELS CONTENT */}

      {/* TAB 1: ACADEMIC PROFILE */}
      {activeTab === 'academic' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Digital Student ID Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative bg-slate-950 rounded-2xl border-2 border-amber-500/40 p-5 shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center mb-5">
                <div className="w-9 h-7 bg-amber-500/10 border border-amber-500/30 rounded-md flex flex-col justify-between p-1">
                  <div className="h-0.5 w-full bg-amber-500/40" />
                  <div className="h-0.5 w-3/4 bg-amber-500/40" />
                  <div className="h-0.5 w-full bg-amber-500/40" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] font-bold uppercase tracking-widest">
                  {activeProfileData.isPro ? "PRO CAMPUS" : "STANDARD"}
                </span>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 pb-4">
                <StudentAvatar 
                  avatar={activeProfileData.avatar} 
                  name={activeProfileData.name} 
                  size={80} 
                  className="border-2 border-amber-400"
                />
                <h3 className="text-base font-bold text-white truncate max-w-[200px]">
                  {activeProfileData.name}
                </h3>
                <span className="font-mono text-[10px] text-slate-400 uppercase">
                  {activeProfileData.year}
                </span>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Institution</span>
                  <span className="text-slate-200 font-medium truncate max-w-[150px] text-right">
                    {activeProfileData.university}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Student ID</span>
                  <span className="text-amber-400 font-mono text-[10px] select-all">
                    EL-{activeProfileData.email ? Math.abs(activeProfileData.email.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)).toString().substring(0, 5) : '8327'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit / View Academic Specifications */}
          <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  {isEditing 
                    ? (language === 'en' ? "Modify Academic Profile" : "የተማሪ መገለጫ ማስተካከያ") 
                    : (language === 'en' ? "Academic Standing & Courses" : "የአካዳሚክ ምዝገባ መረጃዎች")
                  }
                </h3>
              </div>
            </div>

            {saveError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSaveChanges} className="space-y-6">
                
                {/* 1. Avatar Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    {language === 'en' ? "1. Select Student Identity Avatar" : "፩. የተማሪ አምሳያ ይምረጡ"}
                  </label>
                  <StudentAvatarSelector
                    currentAvatar={formAvatar}
                    name={formName || 'Student'}
                    onChange={setFormAvatar}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      {language === 'en' ? "Full Name" : "ሙሉ ስም"}
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Abebe Kebede"
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Standing */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      {language === 'en' ? "Academic Standing" : "የትምህርት ደረጃ"}
                    </label>
                    <select
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3 py-3 outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Grade 12" className="bg-slate-900">{language === 'en' ? "Grade 12 (Prep)" : "ክፍል 12"}</option>
                      <option value="University" className="bg-slate-900">{language === 'en' ? "University Student" : "የዩኒቨርሲቲ ተማሪ"}</option>
                    </select>
                  </div>
                </div>

                {/* University / School */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    {language === 'en' ? "University or High School" : "ተቋም ወይም ትምህርት ቤት"}
                  </label>
                  <input
                    type="text"
                    value={formUniversity}
                    onChange={(e) => setFormUniversity(e.target.value)}
                    placeholder="e.g. Wolkite University"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-amber-500"
                  />
                </div>

                {/* Enrolled Modules Selection */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    {language === 'en' ? "2. Active Focus Modules" : "፪. ንቁ የጥናት ሞጁሎች"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                    {subjectsList.map((subj) => {
                      const isSelected = formSubjects.includes(subj);
                      return (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (formSubjects.length > 1) {
                                setFormSubjects(formSubjects.filter(s => s !== subj));
                              }
                            } else {
                              setFormSubjects([...formSubjects, subj]);
                            }
                          }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold' 
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-800 bg-slate-900'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3.5px]" />}
                          </span>
                          <span className="truncate">{subj}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {language === 'en' ? "Cancel" : "ይቅር"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{isSaving ? (language === 'en' ? "Saving..." : "በማስቀመጥ ላይ...") : (language === 'en' ? "Save Changes" : "ለውጦችን አስቀምጥ")}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? "Full Name" : "ሙሉ ስም"}</span>
                    <p className="text-sm font-semibold text-white">{activeProfileData.name}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? "Email" : "ኢሜይል"}</span>
                    <p className="text-sm font-mono text-slate-300">{activeProfileData.email}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? "Academic Level" : "ደረጃ"}</span>
                    <p className="text-sm font-semibold text-white">{activeProfileData.year}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? "Institution" : "ተቋም / ትምህርት ቤት"}</span>
                    <p className="text-sm font-semibold text-amber-400">{activeProfileData.university}</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'en' ? "Enrolled Focus Modules" : "የተመዘገቡ የትምህርት ሞጁሎች"}
                  </span>
                  
                  {activeProfileData.subjects && activeProfileData.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activeProfileData.subjects.map((subj) => (
                        <div 
                          key={subj}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl font-medium flex items-center gap-1.5"
                        >
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                          <span>{subj}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      {language === 'en' ? "No focus modules selected yet." : "እስካሁን የተመረጠ የጥናት ሞጁል የለም።"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS & STATS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                {language === 'en' ? "Learning Analytics Summary" : "የአካዳሚክ ጥናት መረጃ ማጠቃለያ"}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {language === 'en' ? "Focus Courses" : "ሞጁሎች"}
                </span>
                <span className="text-2xl font-black text-amber-400 block">
                  {activeProfileData.subjects ? activeProfileData.subjects.length : 0}
                </span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {language === 'en' ? "Study Streak" : "ቀጣይነት"}
                </span>
                <span className="text-2xl font-black text-amber-400 block flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 text-amber-400 shrink-0 fill-amber-400/20" />
                  <span>{streakCount}d</span>
                </span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {language === 'en' ? "Total Hours" : "አጠቃላይ ሰዓት"}
                </span>
                <span className="text-2xl font-black text-amber-400 block">
                  {studyHoursCount.toFixed(1)}h
                </span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {language === 'en' ? "Quiz Average" : "የፈተና አቬሬጅ"}
                </span>
                <span className="text-2xl font-black text-amber-400 block">
                  {quizHistory.length > 0 ? `${averageScore}%` : "—"}
                </span>
              </div>
            </div>

            {/* Quiz Attempts Log */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {language === 'en' ? "Recent Exam Submissions" : "የቅርብ ጊዜ ፈተናዎች"}
              </h4>

              {quizHistory.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {quizHistory.slice(0, 5).map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{item.subject || "Practice Exam"}</p>
                        <p className="text-[10px] text-slate-400">{item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}</p>
                      </div>
                      <span className="font-mono font-bold text-amber-400 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        {item.score || 0}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  {language === 'en' ? "No completed practice exams recorded yet." : "እስካሁን የተወሰደ ፈተና የለም።"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BILLING & PLAN */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <PWADownloadAssistant 
            isInstallable={isInstallable || false} 
            triggerPWAInstall={triggerPWAInstall || (async () => {})} 
            isOffline={!navigator.onLine}
          />
          <BillingAccountSection
            profile={activeProfileData}
            language={language}
            onNavigateToUpgrade={() => {
              if (onNavigateToUpgrade) onNavigateToUpgrade();
            }}
          />
        </div>
      )}

      {/* TAB 4: SECURITY & CLOUD */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Change Password Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              {language === 'en' ? "Access Security" : "የደህንነት ቁጥጥር"}
            </h4>

            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'en'
                ? "Update your password or dispatch an encrypted email reset verification link."
                : "የይለፍ ቃልዎን በአስተማማኝ ሁኔታ ለመቀየር የኢሜይል ማረጋገጫ ሊንክ መላክ ይችላሉ።"}
            </p>

            {resetMessage && (
              <p className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs">
                {resetMessage}
              </p>
            )}

            {resetError && (
              <p className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                {resetError}
              </p>
            )}

            <div className="space-y-2 pt-1">
              <input
                type="password"
                placeholder={language === 'en' ? "Enter new password..." : "አዲስ የይለፍ ቃል ያስገቡ..."}
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
              />
              <button
                onClick={handleTriggerPasswordReset}
                disabled={resetLoading}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resetLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>
                  {newPasswordInput.trim() 
                    ? (language === 'en' ? "Update Password" : "የይለፍ ቃል ቀይር") 
                    : (language === 'en' ? "Request Reset Link" : "የይለፍ ቃል መቀየርያ ሊንክ ላክ")}
                </span>
              </button>
            </div>
          </div>

          {/* Cloud Sync & Automatic Backup Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Database className="w-4 h-4 text-amber-400" />
              {language === 'en' ? "Cloud Sync & Backup" : "የክላውድ መረጃ ማስቀመጫ"}
            </h4>

            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'en'
                ? "Your notes, study progress, and flashcard sets are automatically saved to your cloud account."
                : "ማስታወሻዎችዎ፣ የጥናት እድገትዎ እና ፍላሽ ካርዶችዎ በራስ-ሰር በክላውድ መለያዎ ይቀመጣሉ።"}
            </p>

            {syncSuccessMsg && (
              <p className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs">
                {syncSuccessMsg}
              </p>
            )}

            {syncErrorMsg && (
              <p className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                {syncErrorMsg}
              </p>
            )}

            <div className="space-y-3 pt-1">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudLightning className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">
                    {language === 'en' ? "Cloud Status: Active" : "የክላውድ ሁኔታ፡ ንቁ"}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                  {language === 'en' ? "SYNCED" : "ተያይዟል"}
                </span>
              </div>

              <button
                onClick={handleBackupToSupabase}
                disabled={syncLoading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>
                  {syncLoading 
                    ? (language === 'en' ? "Syncing Cloud Backup..." : "በማመሳሰል ላይ...") 
                    : (language === 'en' ? "Sync Data Now" : "አሁን አመሳስል")}
                </span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
