/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { googleSignIn, googleSignInRedirect } from '../utils/workspace';
import { syncAuthSessionWithServer } from '../utils/supabaseClient';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  updatePassword,
  signOut
} from 'firebase/auth';
import { 
  auth, 
  syncProfileToFirestore, 
  fetchProfileFromFirestore,
  saveActivationCodeToFirebase,
  verifyActivationCodeWithFirebase
} from '../utils/firebaseStore';
import { 
  Key, User, Landmark, GraduationCap, ArrowRight, Eye, EyeOff, 
  Mail, Lock, LogIn, UserPlus, ArrowLeft, ShieldAlert, CheckCircle, 
  Sparkles, RefreshCw, Trash2, Smartphone, ShieldCheck, Check, Copy, 
  CheckCircle2, FileText, ChevronDown, ExternalLink
} from 'lucide-react';
import EthioLearnLogo from './EthioLearnLogo';
import LegalPrivacyTermsModal from './LegalPrivacyTermsModal';
import { safeStorage } from '../utils/safeStorage';
import { isAdministratorEmail } from '../utils/adminAuth';
import { ETHIOPIAN_UNIVERSITIES, onboardingTranslations } from './SplashOnboarding';

export interface AccountInfo {
  email: string;
  phone?: string;
  passwordEncrypted: string;
  rememberMe: boolean;
  profile: StudentProfile;
}

interface AuthPortalViewProps {
  initialMode?: 'signin' | 'signup';
  onComplete: (profile: StudentProfile) => void;
  preferredLanguage?: 'en' | 'am';
  onLanguageChange?: (lang: 'en' | 'am') => void;
  onBackToOnboarding?: () => void;
}

const TOP_CAMPUSES = [
  { id: 'Wolkite University (WKU)', label: '🏛️ Wolkite (WKU)' },
  { id: 'Addis Ababa University (AAU)', label: 'AAU (Addis Ababa)' },
  { id: 'Adama Science and Technology University (ASTU)', label: 'ASTU (Adama)' },
  { id: 'Hawassa University (HU)', label: 'Hawassa' },
  { id: 'Jimma University (JU)', label: 'Jimma' },
  { id: 'Bahir Dar University (BDU)', label: 'Bahir Dar' },
];

const ACADEMIC_STANDINGS = [
  { id: 'Grade 12', labelEn: 'Grade 12', labelAm: '12ኛ ክፍል' },
  { id: 'Freshman (1st Year)', labelEn: 'Freshman (1st)', labelAm: 'ፍሬሽማን (1ኛ)' },
  { id: 'Sophomore (2nd Year)', labelEn: 'Sophomore (2nd)', labelAm: 'ሶፎሞር (2ኛ)' },
  { id: 'Junior (3rd Year)', labelEn: 'Junior (3rd)', labelAm: 'ጁኒየር (3ኛ)' },
  { id: 'Senior (4th/5th Year)', labelEn: 'Senior (4th/5th)', labelAm: 'ሲኒየር (4ኛ/5ኛ)' },
  { id: 'Postgraduate / Masters', labelEn: 'Postgrad / Masters', labelAm: 'ማስተርስ / ድህረ-ምረቃ' },
];

export function cleanEthiopianPhone(raw: string): { valid: boolean; formatted: string; national: string; e164: string } {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return { valid: false, formatted: '', national: '', e164: '' };

  // Handle +251 9... or +251 7... (12 digits)
  if (digits.startsWith('251') && digits.length === 12) {
    const nat = '0' + digits.substring(3);
    const prefix = digits.substring(3, 5);
    if (prefix.startsWith('9') || prefix.startsWith('7')) {
      return { 
        valid: true, 
        formatted: `+251 ${prefix} ${digits.substring(5, 8)} ${digits.substring(8)}`, 
        national: nat,
        e164: `+${digits}`
      };
    }
  }
  // Handle 09... or 07... (10 digits)
  if ((digits.startsWith('09') || digits.startsWith('07')) && digits.length === 10) {
    return { 
      valid: true, 
      formatted: `+251 ${digits.substring(1, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`, 
      national: digits,
      e164: `+251${digits.substring(1)}`
    };
  }
  // Handle 9... or 7... (9 digits)
  if ((digits.startsWith('9') || digits.startsWith('7')) && digits.length === 9) {
    const nat = '0' + digits;
    return { 
      valid: true, 
      formatted: `+251 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`, 
      national: nat,
      e164: `+251${digits}`
    };
  }

  // Handle international test numbers (e.g. +1 650-555-3434 or other test phones with +)
  if (digits.length >= 10 && raw.trim().startsWith('+')) {
    return {
      valid: true,
      formatted: raw.trim(),
      national: digits,
      e164: `+${digits}`
    };
  }

  return { valid: false, formatted: raw, national: digits, e164: '' };
}

export default function AuthPortalView({
  initialMode = 'signin',
  onComplete,
  preferredLanguage: externalLang,
  onLanguageChange,
  onBackToOnboarding
}: AuthPortalViewProps) {
  // Mode state: 'signin' | 'signup' | 'forgot_password' | 'verify_reset_code' | 'verify_registration' | 'registration_success' | 'update_password'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password' | 'verify_reset_code' | 'verify_registration' | 'registration_success' | 'update_password'>(initialMode);
  
  const [lang, setLang] = useState<'en' | 'am'>(() => {
    return externalLang || (safeStorage.getItem('ethiolearn_language') === 'am' ? 'am' : 'en');
  });

  const handleLangToggle = (newLang: 'en' | 'am') => {
    playClickChime();
    setLang(newLang);
    safeStorage.setItem('ethiolearn_language', newLang);
    if (onLanguageChange) onLanguageChange(newLang);
  };

  // Form Inputs
  // Form Inputs (Authorization is strictly Email-based; Phone is exclusively for registration records)
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('Wolkite University (WKU)');
  const [univSearch, setUnivSearch] = useState('');
  const [showUnivDropdown, setShowUnivDropdown] = useState(false);
  const [year, setYear] = useState('Freshman (1st Year)');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // States for verification codes & asynchronous actions
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [universityError, setUniversityError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [dispatchedSecurityCode, setDispatchedSecurityCode] = useState<string | null>(null);
  const [dispatchedMessagePreview, setDispatchedMessagePreview] = useState<any>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [codeCopiedToast, setCodeCopiedToast] = useState(false);
  const [pendingStudentProfile, setPendingStudentProfile] = useState<StudentProfile | null>(null);
  const [pendingPasswordString, setPendingPasswordString] = useState<string>('');

  // Saved accounts on device
  const [registeredAccounts, setRegisteredAccounts] = useState<AccountInfo[]>([]);
  const [showAllSavedAccounts, setShowAllSavedAccounts] = useState(false);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);

  // Modals
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');

  // Load saved accounts from storage on mount & check URL verification params
  useEffect(() => {
    try {
      const stored = safeStorage.getItem('ethiolearn_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRegisteredAccounts(parsed);
        }
      }

      // Check if arriving with verification parameters from email card
      const urlParams = new URLSearchParams(window.location.search);
      const verifiedEmail = urlParams.get('verified_email');
      const action = urlParams.get('action');
      const code = urlParams.get('code');

      if (verifiedEmail) {
        setEmail(verifiedEmail);
        if (action === 'accept_authorization' || code) {
          setMode('verify_registration');
          if (code) setVerificationCodeInput(code);
          setInfoMessage(
            lang === 'am' 
              ? `የማረጋገጫ ካርድ ለ ${verifiedEmail} ተገኝቷል። በማረጋገጥ ላይ...`
              : `Academic verification card link recognized for ${verifiedEmail}.`
          );
        }
      }
    } catch (e) {}
  }, []);

  // Timer countdown for resending verification code
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const t = onboardingTranslations[lang];

  // 1. Google Auth Handlers
  const handleGoogleAuth = async () => {
    try {
      setAuthError(null);
      setIsPopupBlocked(false);
      playClickChime();
      const res = await googleSignIn();
      if (res?.user && res.user.email) {
        const emailTrim = res.user.email.toLowerCase().trim();
        const displayName = res.user.displayName || emailTrim.split('@')[0];
        
        // Fetch existing or initialize
        let profile: StudentProfile = {
          name: displayName,
          email: emailTrim,
          university: "Wolkite University (WKU)",
          year: "Freshman (1st Year)",
          subjects: ["Emerging Technologies", "Communicative English", "Mathematics", "Logic and Critical Thinking"],
          claudeApiKey: "",
          dailyGoalHours: 2,
          theme: 'dark',
          language: lang,
          avatar: 'champion',
          isRegistered: true,
          unregisteredAICredits: 5,
          isPro: false
        };

        if (auth) {
          try {
            const remoteProfile = await fetchProfileFromFirestore(res.user.uid);
            if (remoteProfile) {
              profile = { ...profile, ...remoteProfile, isRegistered: true };
            } else {
              await syncProfileToFirestore(res.user.uid, profile);
            }
          } catch (e) {}
        }

        const newAccount: AccountInfo = {
          email: emailTrim,
          passwordEncrypted: 'google_authenticated',
          rememberMe: true,
          profile
        };

        const updatedAccs = [...registeredAccounts.filter(acc => acc.email.toLowerCase() !== emailTrim), newAccount];
        setRegisteredAccounts(updatedAccs);
        safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccs));
        safeStorage.setItem('ethiolearn_active_email', emailTrim);
        safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(profile));
        safeStorage.setItem('ethiolearn_has_seen_onboarding', 'true');

        try {
          await syncAuthSessionWithServer({
            email: emailTrim,
            uid: res.user.uid,
            role: isAdministratorEmail(emailTrim) ? 'admin' : 'student',
            displayName: profile.name
          });
        } catch (tokErr) {}

        playSuccessChime();
        onComplete(profile);
      }
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      playFailureChime();
      if (err?.isPopupBlocked || err?.code === 'auth/popup-blocked' || err?.message?.includes('popup')) {
        setIsPopupBlocked(true);
      } else {
        setAuthError(err?.message || (lang === 'am' ? "የGoogle መግቢያ ተሰርዟል ወይም አልተሳካም።" : "Google connection canceled or failed."));
      }
    }
  };

  const handleGoogleRedirect = async () => {
    try {
      setAuthError(null);
      setIsPopupBlocked(false);
      playClickChime();
      await googleSignInRedirect();
    } catch (err: any) {
      console.error(err);
      playFailureChime();
      setAuthError(lang === 'am' ? "የGoogle መግቢያ አልተሳካም።" : "Google Redirect Sign-In failed.");
    }
  };

  // 2. Sign In Handler (Strictly Email & Password Authorization)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setEmailError(null);
    setPasswordError(null);

    const emailTrim = email.trim().toLowerCase();
    const passwordTrim = password.trim();

    let hasValidationError = false;

    if (!emailTrim) {
      setEmailError(lang === 'am' ? "ኢሜይል አድራሻ ያስፈልጋል።" : "Email address is required.");
      hasValidationError = true;
    } else if (!emailTrim.includes('@') || !emailTrim.includes('.')) {
      setEmailError(lang === 'am' ? "እባክዎን ትክክለኛ የኢሜይል አድራሻ ያስገቡ።" : "Please enter a valid email address.");
      hasValidationError = true;
    }

    if (!passwordTrim) {
      setPasswordError(lang === 'am' ? "የይለፍ ቃል ያስፈልጋል።" : "Password is required.");
      hasValidationError = true;
    } else if (passwordTrim.length < 4) {
      setPasswordError(lang === 'am' ? "የይለፍ ቃል ቢያንስ 4 ፊደላት መሆን አለበት።" : "Password must be at least 4 characters.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      playFailureChime();
      return;
    }

    setLoading(true);

    // Check local accounts first
    const localExistingAccount = registeredAccounts.find(acc => acc.email.toLowerCase() === emailTrim);

    if (localExistingAccount && localExistingAccount.passwordEncrypted && localExistingAccount.passwordEncrypted !== 'google_authenticated') {
      if (localExistingAccount.passwordEncrypted !== passwordTrim) {
        setPasswordError(lang === 'am' ? "የይለፍ ቃል የተሳሳተ ነው። እባክዎ እንደገና ይሞክሩ ወይም 'የይለፍ ቃል ረሱ?' የሚለውን ይጫኑ።" : "Incorrect password. Please verify your credentials or reset your password.");
        playFailureChime();
        setLoading(false);
        return;
      }
    }

    // Call server login endpoint
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrim, password: passwordTrim })
      });
      const loginData = await loginRes.json();
      
      if (loginRes.ok && loginData.user) {
        const profileToUse: StudentProfile = {
          name: loginData.user.name || emailTrim.split('@')[0],
          email: emailTrim,
          phone: loginData.user.phone || localExistingAccount?.profile.phone,
          university: loginData.user.university || "Wolkite University (WKU)",
          year: loginData.user.year || "Freshman (1st Year)",
          subjects: loginData.user.subjects || ["Emerging Technologies", "Communicative English", "Mathematics"],
          claudeApiKey: "",
          dailyGoalHours: 2,
          theme: 'dark',
          language: lang,
          avatar: loginData.user.avatar || 'champion',
          isRegistered: true,
          isPro: Boolean(loginData.user.is_pro),
          unregisteredAICredits: 5
        };

        const newAccount: AccountInfo = {
          email: emailTrim,
          passwordEncrypted: passwordTrim,
          rememberMe,
          profile: profileToUse
        };
        const updatedAccs = [...registeredAccounts.filter(acc => acc.email.toLowerCase() !== emailTrim), newAccount];
        setRegisteredAccounts(updatedAccs);
        safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccs));
        safeStorage.setItem('ethiolearn_active_email', emailTrim);
        safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(profileToUse));
        safeStorage.setItem('ethiolearn_has_seen_onboarding', 'true');

        if (rememberMe) {
          safeStorage.setItem('ethiolearn_remember_login', JSON.stringify({
            email: emailTrim,
            password: passwordTrim,
            rememberMe: true
          }));
        }

        try {
          await syncAuthSessionWithServer({
            email: emailTrim,
            uid: loginData.user.id,
            role: loginData.user.role || (isAdministratorEmail(emailTrim) ? 'admin' : 'student'),
            displayName: profileToUse.name
          });
        } catch (tokErr) {}

        playSuccessChime();
        setLoading(false);
        onComplete(profileToUse);
        return;
      }
    } catch (serverErr) {
      console.warn('[Server Login Fetch Warning]:', serverErr);
    }

    // Try Firebase Auth if email available
    if (auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailTrim, passwordTrim);
        if (userCredential?.user) {
          const uid = userCredential.user.uid;
          let profile = await fetchProfileFromFirestore(uid);
          if (!profile) {
            profile = {
              name: userCredential.user.displayName || emailTrim.split('@')[0],
              email: emailTrim,
              phone: localExistingAccount?.profile.phone,
              university: "Wolkite University (WKU)",
              year: "Freshman (1st Year)",
              subjects: ["Emerging Technologies", "Communicative English", "Mathematics"],
              claudeApiKey: "",
              dailyGoalHours: 2,
              theme: 'dark',
              language: lang,
              avatar: 'champion',
              isRegistered: true,
              unregisteredAICredits: 5
            };
            await syncProfileToFirestore(uid, profile);
          }

          const newAccount: AccountInfo = {
            email: emailTrim,
            passwordEncrypted: passwordTrim,
            rememberMe,
            profile
          };
          const updatedAccs = [...registeredAccounts.filter(acc => acc.email.toLowerCase() !== emailTrim), newAccount];
          setRegisteredAccounts(updatedAccs);
          safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccs));
          safeStorage.setItem('ethiolearn_active_email', emailTrim);
          safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(profile));
          safeStorage.setItem('ethiolearn_has_seen_onboarding', 'true');

          try {
            await syncAuthSessionWithServer({
              email: emailTrim,
              uid,
              role: isAdministratorEmail(emailTrim) ? 'admin' : 'student',
              displayName: profile.name
            });
          } catch (tokErr) {}

          playSuccessChime();
          setLoading(false);
          onComplete(profile);
          return;
        }
      } catch (fbErr: any) {
        if (fbErr?.code === 'auth/wrong-password' || fbErr?.code === 'auth/invalid-credential') {
          setPasswordError(lang === 'am' ? "የይለፍ ቃል የተሳሳተ ነው። እባክዎ እንደገና ይሞክሩ ወይም 'የይለፍ ቃል ረሱ?' የሚለውን ይጫኑ።" : "Incorrect password. Please verify your credentials or reset your password.");
          playFailureChime();
          setLoading(false);
          return;
        }
      }
    }

    // If local account exists and matches, proceed gracefully
    if (localExistingAccount && localExistingAccount.passwordEncrypted === passwordTrim) {
      safeStorage.setItem('ethiolearn_active_email', localExistingAccount.email);
      safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(localExistingAccount.profile));
      safeStorage.setItem('ethiolearn_has_seen_onboarding', 'true');
      playSuccessChime();
      setLoading(false);
      onComplete({ ...localExistingAccount.profile, isRegistered: true });
      return;
    }

    // Not found
    setAuthError(
      lang === 'am' 
        ? "በዚህ ኢሜይል የተመዘገበ አካውንት አልተገኘም ወይም የይለፍ ቃል የተሳሳተ ነው። አዲስ ለመፍጠር 'አካውንት ፍጠር' የሚለውን ይጫኑ።" 
        : "Student account with this email not found or credentials incorrect. Switch to 'Create Account' to register."
    );
    playFailureChime();
    setLoading(false);
  };

  // 3. Quick Login from Saved Device
  const handleQuickLogin = (acc: AccountInfo) => {
    playClickChime();
    setEmail(acc.email);
    if (acc.profile.phone) setPhone(acc.profile.phone);
    setPassword(acc.passwordEncrypted && acc.passwordEncrypted !== 'google_authenticated' ? acc.passwordEncrypted : '');
    setRememberMe(acc.rememberMe !== false);

    if (acc.rememberMe && acc.passwordEncrypted && acc.passwordEncrypted !== 'google_authenticated') {
      safeStorage.setItem('ethiolearn_active_email', acc.email);
      safeStorage.setItem('ethiolearn_current_profile', JSON.stringify({ ...acc.profile, isRegistered: true }));
      safeStorage.setItem('ethiolearn_has_seen_onboarding', 'true');
      playSuccessChime();
      onComplete({ ...acc.profile, isRegistered: true });
    } else {
      setInfoMessage(
        lang === 'am'
          ? `የ ${acc.profile.name} አካውንት ተመርጧል። ለመግባት የይለፍ ቃልዎን ያስገቡ።`
          : `Selected ${acc.profile.name}'s profile. Please enter your password to continue.`
      );
    }
  };

  const handleRemoveSavedAccount = (emailToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playClickChime();
    const updated = registeredAccounts.filter(acc => acc.email.toLowerCase() !== emailToRemove.toLowerCase());
    setRegisteredAccounts(updated);
    safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updated));
    const activeEmail = safeStorage.getItem('ethiolearn_active_email');
    if (activeEmail?.toLowerCase() === emailToRemove.toLowerCase()) {
      safeStorage.removeItem('ethiolearn_active_email');
    }
  };

  // 4. Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setInfoMessage(null);
    setNameError(null);
    setPhoneError(null);
    setUniversityError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setCodeError(null);
    setVerificationCodeInput('');

    const nameTrim = name.trim();
    const phoneRaw = phone.trim();
    const emailTrim = email.trim().toLowerCase();
    const passwordTrim = password.trim();
    const confirmPasswordTrim = confirmPassword.trim();
    const univTrim = university.trim();

    const cleanedPhone = cleanEthiopianPhone(phoneRaw);

    let hasErrors = false;
    if (!nameTrim) {
      setNameError(t.validationName);
      hasErrors = true;
    }
    if (!phoneRaw) {
      setPhoneError(lang === 'am' ? "የስልክ ቁጥርዎን ያስገቡ።" : "Phone number is required.");
      hasErrors = true;
    } else if (!cleanedPhone.valid) {
      setPhoneError(lang === 'am' ? "እባክዎ ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ (ለምሳሌ 0912 345 678 ወይም 0712 345 678)" : "Please enter a valid Ethiopian phone number (e.g. 0912 345 678 or 0712 345 678).");
      hasErrors = true;
    }
    if (!univTrim) {
      setUniversityError(t.validationUniversity);
      hasErrors = true;
    }
    if (!emailTrim || !emailTrim.includes('@') || !emailTrim.includes('.')) {
      setEmailError(lang === 'am' ? "እባክዎን ትክክለኛ የኢሜይል አድራሻ ያስገቡ።" : "Please enter a valid email address.");
      hasErrors = true;
    }
    if (passwordTrim.length < 4) {
      setPasswordError(t.validationPassword);
      hasErrors = true;
    }
    if (passwordTrim !== confirmPasswordTrim) {
      setConfirmPasswordError(t.validationConfirmPassword);
      hasErrors = true;
    }

    if (hasErrors) {
      playFailureChime();
      return;
    }

    setLoading(true);

    const profile: StudentProfile = {
      name: nameTrim,
      email: emailTrim,
      phone: cleanedPhone.formatted,
      university: univTrim,
      year,
      subjects: ["Emerging Technologies", "Communicative English", "Mathematics", "Logic and Critical Thinking"],
      claudeApiKey: "",
      dailyGoalHours: 2,
      theme: 'dark',
      language: lang,
      avatar: 'champion',
      isRegistered: true,
      unregisteredAICredits: 5,
      isPro: false
    };

    setPendingStudentProfile(profile);
    setPendingPasswordString(passwordTrim);

    let dispatchedCode = '';
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTrim,
          phone: cleanedPhone.formatted,
          name: nameTrim,
          university: univTrim,
          year,
          type: 'registration'
        })
      });
      const data = await res.json();
      if (data.code) {
        dispatchedCode = data.code;
        setDispatchedSecurityCode(data.code);
      } else if (data.devPreviewCode) {
        dispatchedCode = data.devPreviewCode;
        setDispatchedSecurityCode(data.devPreviewCode);
      }
      if (data.message) {
        setDispatchedMessagePreview(lang === 'am' ? data.amharicMessage || data.message : data.message);
      }
    } catch (apiErr) {
      console.warn('[Verification Code API Warning]:', apiErr);
    }

    // Also persist activation code state in Firebase Firestore
    if (dispatchedCode) {
      await saveActivationCodeToFirebase(emailTrim, dispatchedCode, 'registration', cleanedPhone.formatted);
    }

    // Try creating user in Firebase Auth and dispatch native email verification
    if (auth && passwordTrim) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, emailTrim, passwordTrim);
        if (cred?.user) {
          try {
            await sendEmailVerification(cred.user);
          } catch (e) {}
          await syncProfileToFirestore(cred.user.uid, profile);
        }
      } catch (fbErr: any) {
        console.warn('[Firebase Auth Creation Notice]:', fbErr?.message);
      }
    }

    setResendTimer(60);
    setVerificationCodeInput('');
    setCodeError(null);
    setAuthError(null);
    setInfoMessage(
      lang === 'am'
        ? `ባለ 6-አሃዝ የማረጋገጫ ኮድ እና ሊንክ ወደ ${emailTrim} ተልኳል።`
        : `A 6-digit verification code and link were sent to ${emailTrim}.`
    );
    setLoading(false);
    playSuccessChime();
    setMode('verify_registration');
  };

  // Helper to open mailbox directly
  const getMailboxUrl = (targetEmail: string) => {
    const domain = targetEmail.split('@')[1]?.toLowerCase() || '';
    if (domain.includes('gmail.com') || domain.includes('googlemail.com')) {
      return 'https://mail.google.com/mail/u/0/#search/EthioLearn';
    }
    if (domain.includes('yahoo.com')) {
      return 'https://mail.yahoo.com';
    }
    if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) {
      return 'https://outlook.live.com';
    }
    return `mailto:${targetEmail}`;
  };

  // Verify 6-digit code received in student's email message
  const handleVerifyRegistrationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCodeError(null);
    setAuthError(null);
    setInfoMessage(null);

    const cleanInput = verificationCodeInput.trim();
    if (!cleanInput) {
      setCodeError(
        lang === 'am'
          ? "እባክዎ በኢሜይልዎ የተላከውን ባለ 6-አሃዝ የማረጋገጫ ኮድ ያስገቡ።"
          : "Please enter the 6-digit verification code sent to your email."
      );
      playFailureChime();
      return;
    }

    if (cleanInput.length < 6) {
      setCodeError(
        lang === 'am'
          ? "የማረጋገጫ ኮዱ 6 አሃዝ መሆን አለበት።"
          : "Verification code must be 6 digits."
      );
      playFailureChime();
      return;
    }

    setLoading(true);
    const targetEmail = pendingStudentProfile?.email || email.trim().toLowerCase();

    try {
      // 1. Verify against server verification store
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          code: cleanInput,
          type: 'registration'
        })
      });
      const data = await res.json();

      let isCodeValid = res.ok && (data.success || data.verified);

      // 2. Fallback check with Firestore activation codes collection
      if (!isCodeValid) {
        const firestoreValid = await verifyActivationCodeWithFirebase(targetEmail, cleanInput, 'registration');
        if (firestoreValid) {
          isCodeValid = true;
        }
      }

      // 3. Fallback match against dispatched code in current session if present
      if (!isCodeValid && dispatchedSecurityCode && cleanInput === dispatchedSecurityCode.trim()) {
        isCodeValid = true;
      }

      if (isCodeValid) {
        playSuccessChime();
        await handleCompleteEmailActivation();
      } else {
        playFailureChime();
        setCodeError(
          lang === 'am' 
            ? (data.amharicError || "የተሳሳተ የማረጋገጫ ኮድ! እባክዎ በኢሜይልዎ የደረሰውን ባለ 6-አሃዝ ኮድ በትክክል ያረጋግጡ።")
            : (data.error || "Invalid verification code. Please check the 6-digit code in your email message.")
        );
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[Verification code error]:', err);
      if (dispatchedSecurityCode && cleanInput === dispatchedSecurityCode.trim()) {
        playSuccessChime();
        await handleCompleteEmailActivation();
      } else {
        playFailureChime();
        setCodeError(
          lang === 'am'
            ? "ኮዱን ማረጋገጥ አልተቻለም። እባክዎ እንደገና ይሞክሩ።"
            : "Could not verify code. Please try again."
        );
        setLoading(false);
      }
    }
  };

  // Check if student clicked the verification link in their email message
  const handleCheckEmailLinkVerification = async () => {
    setCodeError(null);
    setAuthError(null);
    setInfoMessage(null);
    setLoading(true);
    playClickChime();

    const targetEmail = pendingStudentProfile?.email || email.trim().toLowerCase();

    // Check server-side email link verification status
    try {
      const res = await fetch(`/api/auth/check-verification-status?email=${encodeURIComponent(targetEmail)}`);
      const data = await res.json();
      if (res.ok && data.verified) {
        playSuccessChime();
        await handleCompleteEmailActivation();
        return;
      }
    } catch (apiErr) {
      console.warn('[Check verification status API warning]:', apiErr);
    }

    if (auth && auth.currentUser) {
      try {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          playSuccessChime();
          await handleCompleteEmailActivation();
          return;
        }
      } catch (err) {
        console.warn('[Firebase check email reload]:', err);
      }
    }

    setLoading(false);
    playFailureChime();
    setAuthError(
      lang === 'am'
        ? "የኢሜይል ማረጋገጫ ካርድ እስካሁን አልተጫነም! እባክዎ ወደ ኢሜይል ሳጥንዎ (Inbox/Spam) ገብተው የተላከውን የማረጋገጫ ካርድ 'Accept Authorization' ሊንክ ይጫኑ፤ ወይም ከላይ ባለ 6-አሃዝ ኮዱን ያስገቡ።"
        : "Email verification card has not been accepted yet. Please check the verification card sent to your email inbox and click 'Accept Authorization', or enter the 6-digit code above."
    );
  };

  // 5. Complete Student Account Activation once verified via code or link
  const handleCompleteEmailActivation = async () => {
    setLoading(true);
    playClickChime();

    const targetEmail = pendingStudentProfile?.email || email.trim().toLowerCase();
    const finalProfile: StudentProfile = pendingStudentProfile || {
      name: name.trim() || targetEmail.split('@')[0],
      email: targetEmail,
      phone: phone ? cleanEthiopianPhone(phone).formatted : undefined,
      university: university || "Wolkite University (WKU)",
      year: year || "Freshman (1st Year)",
      subjects: ["Emerging Technologies", "Communicative English", "Mathematics", "Logic and Critical Thinking"],
      claudeApiKey: "",
      dailyGoalHours: 2,
      theme: 'dark',
      language: lang,
      avatar: 'champion',
      isRegistered: true,
      unregisteredAICredits: 5,
      isPro: false
    };

    if (auth && auth.currentUser) {
      try {
        await syncProfileToFirestore(auth.currentUser.uid, finalProfile);
      } catch (e) {}
    }

    try {
      await fetch('/api/db/student-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: finalProfile })
      });
    } catch (dbErr) {
      console.warn('[Profile DB Upsert Warning]:', dbErr);
    }

    // Save to local device accounts
    const newAccount: AccountInfo = {
      email: targetEmail,
      phone: finalProfile.phone,
      passwordEncrypted: pendingPasswordString || 'student_verified',
      rememberMe: true,
      profile: finalProfile
    };
    const updatedAccs = [...registeredAccounts.filter(acc => acc.email?.toLowerCase() !== targetEmail), newAccount];
    setRegisteredAccounts(updatedAccs);
    safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccs));
    safeStorage.setItem('ethiolearn_active_email', targetEmail);
    safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(finalProfile));
    safeStorage.setItem('ethiolearn_has_seen_onboarding', 'true');

    try {
      await syncAuthSessionWithServer({
        email: targetEmail,
        role: isAdministratorEmail(targetEmail) ? 'admin' : 'student',
        displayName: finalProfile.name
      });
    } catch (e) {}

    playSuccessChime();
    setLoading(false);
    // Direct redirect to main app!
    onComplete(finalProfile);
  };

  // 6. Resend Email Activation Message
  const handleResendRegistrationCode = async () => {
    if (resendTimer > 0) return;
    playClickChime();
    setResendTimer(60);
    setCodeError(null);
    setAuthError(null);
    const targetEmail = pendingStudentProfile?.email || email.trim().toLowerCase();
    const targetPhone = pendingStudentProfile?.phone || phone.trim();

    if (auth && auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          phone: targetPhone,
          name: pendingStudentProfile?.name || name,
          university: pendingStudentProfile?.university || university,
          type: 'registration'
        })
      });
      const data = await res.json();
      if (data.code) {
        setDispatchedSecurityCode(data.code);
        await saveActivationCodeToFirebase(targetEmail, data.code, 'registration', targetPhone);
      } else if (data.devPreviewCode) {
        setDispatchedSecurityCode(data.devPreviewCode);
        await saveActivationCodeToFirebase(targetEmail, data.devPreviewCode, 'registration', targetPhone);
      }
    } catch (e) {}

    setInfoMessage(
      lang === 'am' 
        ? `አዲስ የማረጋገጫ መልእክት ወደ ${targetEmail} ተልኳል።` 
        : `A fresh verification message was dispatched to ${targetEmail}.`
    );
    playSuccessChime();
  };

  // 7. Password Recovery Handlers (Email-Based Security Verification)
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setAuthError(null);
    setInfoMessage(null);

    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      setEmailError(lang === 'am' ? "እባክዎን ትክክለኛ የኢሜይል አድራሻ ያስገቡ።" : "Please enter a valid registered email address.");
      playFailureChime();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, type: 'password_reset' })
      });
      const data = await res.json();
      if (data.code) {
        setDispatchedSecurityCode(data.code);
        await saveActivationCodeToFirebase(targetEmail, data.code, 'password_reset');
      } else if (data.devPreviewCode) {
        setDispatchedSecurityCode(data.devPreviewCode);
        await saveActivationCodeToFirebase(targetEmail, data.devPreviewCode, 'password_reset');
      }
    } catch (e) {}

    // Send Firebase native reset email if auth initialized
    if (auth && targetEmail.includes('@') && !targetEmail.endsWith('@ethiolearn.edu.et')) {
      try {
        await sendPasswordResetEmail(auth, targetEmail);
      } catch (fbErr) {}
    }

    setResendTimer(60);
    setLoading(false);
    playSuccessChime();
    setMode('verify_reset_code');
  };

  const handleVerifyResetCode = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    setCodeError(null);

    const codeToVerify = (customCode || verificationCodeInput || '').trim();
    if (!codeToVerify || codeToVerify.length < 6) {
      setCodeError(lang === 'am' ? "እባክዎን ባለ 6-አሃዝ የማረጋገጫ ኮድ ያስገቡ።" : "Please enter the 6-digit recovery code.");
      playFailureChime();
      return;
    }

    setLoading(true);
    let isCodeValid = false;
    const targetEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code: codeToVerify, type: 'password_reset' })
      });
      const data = await res.json();
      if (res.ok && (data.success || data.verified)) {
        isCodeValid = true;
      }
    } catch (err) {}

    if (!isCodeValid) {
      try {
        const fbValid = await verifyActivationCodeWithFirebase(targetEmail, codeToVerify, 'password_reset');
        if (fbValid) isCodeValid = true;
      } catch (e) {}
    }

    if (!isCodeValid) {
      setCodeError(lang === 'am' ? "የተሳሳተ የማረጋገጫ ኮድ ነው። እባክዎ ኢሜይልዎን ፈትሸው እንደገና ይሞክሩ።" : "Invalid recovery code. Please check your email inbox/spam and try again.");
      playFailureChime();
      setLoading(false);
      return;
    }

    playSuccessChime();
    setLoading(false);
    setMode('update_password');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setConfirmPasswordError(null);

    const passwordTrim = password.trim();
    const confirmPasswordTrim = confirmPassword.trim();

    if (passwordTrim.length < 4) {
      setPasswordError(lang === 'am' ? "የይለፍ ቃል ቢያንስ 4 ፊደላት መሆን አለበት።" : "Password must be at least 4 characters.");
      playFailureChime();
      return;
    }

    if (passwordTrim !== confirmPasswordTrim) {
      setConfirmPasswordError(t.validationConfirmPassword);
      playFailureChime();
      return;
    }

    setLoading(true);
    const targetEmail = email.trim().toLowerCase();

    try {
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, newPassword: passwordTrim, code: dispatchedSecurityCode })
      });
    } catch (e) {}

    // Update locally
    const updatedAccs = registeredAccounts.map(acc => {
      if (acc.email.toLowerCase() === targetEmail) {
        return { ...acc, passwordEncrypted: passwordTrim };
      }
      return acc;
    });
    setRegisteredAccounts(updatedAccs);
    safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccs));

    playSuccessChime();
    setLoading(false);
    setInfoMessage(lang === 'am' ? "የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል! አሁን መግባት ይችላሉ።" : "Password updated successfully! Please sign in with your new password.");
    setMode('signin');
  };

  const handleEnterCampus = () => {
    playSuccessChime();
    if (pendingStudentProfile) {
      onComplete(pendingStudentProfile);
    } else {
      const fallback: StudentProfile = {
        name: name.trim() || 'Scholar',
        email: email.trim().toLowerCase(),
        university: university || "Wolkite University (WKU)",
        year: year || "Freshman (1st Year)",
        subjects: ["Emerging Technologies", "Communicative English", "Mathematics"],
        claudeApiKey: "",
        dailyGoalHours: 2,
        theme: 'dark',
        language: lang,
        avatar: 'champion',
        isRegistered: true,
        unregisteredAICredits: 5
      };
      onComplete(fallback);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto select-none">
      {/* Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full bg-[#0e1628]/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl md:rounded-3xl border border-slate-700/60 relative z-10 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] space-y-6"
      >
        {/* Glowing Ambient Top Edge Line */}
        <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-[#F59E0B]/50 to-transparent" />

        {/* Top Header: Logo, Branding & Language Switcher */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <EthioLearnLogo size={46} showCardBackground={true} className="drop-shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0" />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <h2 className="font-serif font-black text-xl text-white tracking-tight">
                  EthioLearn Pro
                </h2>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[#F59E0B] text-[9.5px] font-extrabold tracking-wider font-mono">
                  CAMPUS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-normal mt-0.5">
                {lang === 'am' ? 'የኢትዮጵያ ዩኒቨርሲቲ ተማሪዎች ዲጂታል ፖርታል' : 'Ethiopian University Scholars Portal'}
              </p>
            </div>
          </div>

          {/* Bilingual Language Pill Switcher */}
          <div className="flex items-center p-1 bg-[#090f1d] border border-slate-800 rounded-full shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => handleLangToggle('en')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                lang === 'en' 
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black font-extrabold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLangToggle('am')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                lang === 'am' 
                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black font-extrabold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              አማ
            </button>
          </div>
        </div>

        {/* Global Notifications: Error / Info / Popup-Blocked */}
        {authError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-red-950/30 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-start gap-2.5 shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed flex-1">{authError}</p>
          </motion.div>
        )}

        {infoMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs rounded-xl flex items-start gap-2.5 shadow-sm"
          >
            <CheckCircle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <p className="leading-relaxed flex-1">{infoMessage}</p>
          </motion.div>
        )}

        {isPopupBlocked && (
          <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs rounded-xl space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <p className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                {lang === 'am' ? 'የብሮውዘር ፖፕአፕ ታግዷል (Popup Blocked)' : 'Browser Popup Blocked'}
              </p>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {lang === 'am' 
                ? 'በAI Studio ፕሪቪው ውስጥ ስለሆኑ Google Sign-In ተከልክሏል። ከታች ያለውን የRedirect ቁልፍ ይሞክሩ።'
                : 'Since you are inside the AI Studio Preview panel, Google popup was blocked. Try Redirect Sign-In below:'}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleGoogleRedirect}
                className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold text-[10.5px] rounded-lg cursor-pointer transition shadow-xs flex items-center gap-1.5"
              >
                <span>⚡ Try Redirect Sign-In</span>
              </button>
              <button
                type="button"
                onClick={() => { playClickChime(); setIsPopupBlocked(false); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10.5px] rounded-lg cursor-pointer transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE: SIGN IN or SIGN UP (Top Segmented Navigation) */}
        {/* ========================================================================= */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="space-y-5">
            {/* Top Segmented Pro Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-[#090f1d] border border-slate-800/80 rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setMode('signin');
                  setAuthError(null);
                  setInfoMessage(null);
                }}
                className={`py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'signin'
                    ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{lang === 'am' ? 'መግቢያ (Sign In)' : 'Sign In'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setMode('signup');
                  setAuthError(null);
                  setInfoMessage(null);
                }}
                className={`py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{lang === 'am' ? 'አካውንት ፍጠር' : 'Create Account'}</span>
              </button>
            </div>

            {/* Quick Resume Card for Saved Accounts on Device (shown in Sign In mode) */}
            {mode === 'signin' && registeredAccounts.length > 0 && (
              <div className="bg-[#090f1d] border border-slate-800/90 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                    {lang === 'am' ? 'በዚህ መሳሪያ የተቀመጡ ተማሪዎች' : 'Saved Scholar Profiles'}
                  </span>
                  {registeredAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSavedAccounts(!showAllSavedAccounts)}
                      className="text-[10px] text-[#F59E0B] hover:underline font-bold cursor-pointer"
                    >
                      {showAllSavedAccounts ? (lang === 'am' ? 'አሳጥር' : 'Show Less') : `${registeredAccounts.length} profiles`}
                    </button>
                  )}
                </div>

                {/* Primary Quick Resume Account */}
                <div className="space-y-2">
                  {(showAllSavedAccounts ? registeredAccounts : registeredAccounts.slice(0, 1)).map((acc) => (
                    <div
                      key={acc.email}
                      onClick={() => handleQuickLogin(acc)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#121c33] hover:bg-[#1a2847] border border-slate-700/60 hover:border-[#F59E0B]/50 transition-all cursor-pointer shadow-xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F59E0B] to-amber-200 flex items-center justify-center text-black font-bold text-xs shrink-0 shadow-inner">
                          {acc.profile?.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-100 truncate group-hover:text-[#F59E0B] transition-colors">
                            {acc.profile?.name || 'Student'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {acc.profile?.university || acc.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2.5 py-1 bg-[#F59E0B] text-black font-extrabold text-[10px] rounded-md shadow-xs flex items-center gap-1">
                          <LogIn className="w-3 h-3" />
                          <span>{lang === 'am' ? 'ቀጥል' : 'Resume'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSavedAccount(acc.email, e)}
                          title="Remove from device"
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1-Tap Branded Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-3 px-4 bg-[#090f1d] hover:bg-[#121c33] border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2.5 cursor-pointer shadow-sm transition-all group"
            >
              {/* Authentic Google 4-Color SVG Icon */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>
                {mode === 'signin'
                  ? (lang === 'am' ? 'በGoogle አካውንት ይቀጥሉ' : 'Continue with Google')
                  : (lang === 'am' ? 'በGoogle በፍጥነት ይመዝገቡ' : 'Sign up instantly with Google')}
              </span>
            </button>

            {/* Separator */}
            <div className="relative flex items-center justify-center py-1">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                {lang === 'am' ? 'ወይም በተማሪ መረጃ' : 'or with student credentials'}
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* ======================================================= */}
            {/* SUB-MODE: SIGN IN FORM */}
            {/* ======================================================= */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Email Address Input */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t.email}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      placeholder={t.emailPlaceholder}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      className={`w-full bg-[#0a0f1d] border ${
                        emailError ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-[#F59E0B]'
                      } rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none text-xs transition-all focus:ring-1 focus:ring-[#F59E0B]/20`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-[11px] text-red-400 font-medium pl-1">{emailError}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t.password}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        playClickChime();
                        setMode('forgot_password');
                        setAuthError(null);
                        setInfoMessage(null);
                      }}
                      className="text-[11px] text-[#F59E0B] hover:underline transition-all cursor-pointer font-medium"
                    >
                      {t.forgotPassword}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      className={`w-full bg-[#0a0f1d] border ${
                        passwordError ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-[#F59E0B]'
                      } rounded-xl pl-10 pr-10 py-2.5 text-slate-100 placeholder-slate-500 outline-none text-xs transition-all font-mono focus:ring-1 focus:ring-[#F59E0B]/20`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-[11px] text-red-400 font-medium pl-1">{passwordError}</p>
                  )}
                </div>

                {/* Remember Me & Pending Code Trigger */}
                <div className="flex items-center justify-between py-1 text-left">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-800 bg-[#0a0f1d] text-[#F59E0B] focus:ring-0 cursor-pointer w-3.5 h-3.5 accent-[#F59E0B]"
                    />
                    <span className="text-[11px] text-slate-400">{t.rememberSession}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      playClickChime();
                      setMode('verify_registration');
                    }}
                    className="text-[10.5px] text-slate-400 hover:text-[#F59E0B] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Key className="w-3 h-3 text-[#F59E0B]" />
                    <span>{lang === 'am' ? 'ኮድ አለኝ' : 'Have code?'}</span>
                  </button>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-105 active:scale-[0.99] text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4 text-black" />
                  )}
                  <span>{loading ? t.signInLoading : t.signInBtn}</span>
                </button>

                <p className="text-[10.5px] text-slate-400 text-center pt-2 font-sans">
                  🔐 {lang === 'am' ? 'ደህንነቱ የተጠበቀ የተማሪ ኢሜይል ማረጋገጫ' : 'Secured Academic Email Authorization'}
                </p>
              </form>
            )}

            {/* ======================================================= */}
            {/* SUB-MODE: SIGN UP FORM */}
            {/* ======================================================= */}
            {mode === 'signup' && (
              <form onSubmit={handleRegister} className="space-y-4 text-left">
                {/* Full Student Name */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t.fullName}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder={t.fullNamePlaceholder}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError(null);
                      }}
                      className={`w-full bg-[#0a0f1d] border ${
                        nameError ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-[#F59E0B]'
                      } rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none text-xs transition-all focus:ring-1 focus:ring-[#F59E0B]/20`}
                    />
                  </div>
                  {nameError && (
                    <p className="text-[11px] text-red-400 font-medium pl-1">{nameError}</p>
                  )}
                </div>

                {/* Phone Number Field (Registration Record & Telebirr/CBE Payments Only) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      {lang === 'am' ? 'የተማሪ ስልክ ቁጥር (ለመዝገብና ለክፍያ)' : 'Mobile Phone Number (Record & Payments)'}
                    </label>
                    <span className="text-[9.5px] text-amber-400/90 font-mono font-medium">
                      🇪🇹 Telebirr / CBE Birr
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 text-slate-400 font-mono text-xs select-none pointer-events-none">
                      <span className="text-base leading-none">🇪🇹</span>
                      <span className="text-slate-500 font-bold">+251</span>
                    </div>
                    <input
                      type="tel"
                      placeholder="0912 345 678"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (phoneError) setPhoneError(null);
                      }}
                      className={`w-full bg-[#0a0f1d] border ${
                        phoneError ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-[#F59E0B]'
                      } rounded-xl pl-20 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none text-xs font-mono transition-all focus:ring-1 focus:ring-[#F59E0B]/20`}
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-[11px] text-red-400 font-medium pl-1">{phoneError}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 pl-1">
                      {lang === 'am'
                        ? 'ለዩኒቨርሲቲ የተማሪ መዝገብና ለቴሌብር/CBE ክፍያ ብቻ ይቀመጣል። የአካውንት ማረጋገጫ በኢሜይል ብቻ ይከናወናል።'
                        : 'Recorded for student records & Telebirr/CBE fee payments. Authorization is handled exclusively via Email.'}
                    </p>
                  )}
                </div>

                {/* University / College Dropdown & Quick Badges */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t.university}
                  </label>
                  
                  <div className="relative">
                    <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={t.universityPlaceholder}
                      value={univSearch || university}
                      onFocus={() => setShowUnivDropdown(true)}
                      onChange={(e) => {
                        setUnivSearch(e.target.value);
                        setUniversity(e.target.value);
                        if (universityError) setUniversityError(null);
                      }}
                      className={`w-full bg-[#0a0f1d] border ${
                        universityError ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-[#F59E0B]'
                      } rounded-xl pl-10 pr-10 py-2.5 text-slate-100 placeholder-slate-500 outline-none text-xs transition-all focus:ring-1 focus:ring-[#F59E0B]/20`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowUnivDropdown(!showUnivDropdown)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Campus Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {TOP_CAMPUSES.map((campus) => (
                      <button
                        key={campus.id}
                        type="button"
                        onClick={() => {
                          setUniversity(campus.id);
                          setUnivSearch(campus.id);
                          setShowUnivDropdown(false);
                          if (universityError) setUniversityError(null);
                        }}
                        className={`text-[9.5px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          university === campus.id
                            ? 'bg-amber-500/20 border-[#F59E0B] text-amber-300 font-bold'
                            : 'bg-[#090f1d] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {campus.label}
                      </button>
                    ))}
                  </div>

                  {showUnivDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#090f1d] border border-slate-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin">
                      {ETHIOPIAN_UNIVERSITIES.filter(u =>
                        u.toLowerCase().includes((univSearch || '').toLowerCase())
                      ).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onMouseDown={() => {
                            setUniversity(u);
                            setUnivSearch(u);
                            setShowUnivDropdown(false);
                            if (universityError) setUniversityError(null);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            university === u ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{u}</span>
                          {university === u && <Check className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {universityError && (
                    <p className="text-[11px] text-red-400 font-medium pl-1">{universityError}</p>
                  )}
                </div>

                {/* Academic Standing Level Selector (Interactive Chips) */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t.academicStanding}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ACADEMIC_STANDINGS.map((standing) => (
                      <button
                        key={standing.id}
                        type="button"
                        onClick={() => { playClickChime(); setYear(standing.id); }}
                        className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer truncate ${
                          year === standing.id
                            ? 'bg-amber-500/20 border-[#F59E0B] text-amber-300 shadow-xs'
                            : 'bg-[#090f1d] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {lang === 'am' ? standing.labelAm : standing.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Official Student Email Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t.email}
                    </label>
                    <span className="text-[9.5px] text-[#F59E0B] font-medium">
                      {lang === 'am' ? 'ትክክለኛ ኮድ የሚላክበት' : 'Activation code destination'}
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      placeholder={t.emailPlaceholder}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      className={`w-full bg-[#0a0f1d] border ${
                        emailError ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-[#F59E0B]'
                      } rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none text-xs transition-all focus:ring-1 focus:ring-[#F59E0B]/20`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-[11px] text-red-400 font-medium pl-1">{emailError}</p>
                  )}
                </div>

                {/* Password & Confirm Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t.password}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError(null);
                        }}
                        className={`w-full bg-[#0a0f1d] border ${
                          passwordError ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-[#F59E0B]'
                        } rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-500 outline-none text-xs transition-all font-mono focus:ring-1 focus:ring-[#F59E0B]/20`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t.confirmPassword}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (confirmPasswordError) setConfirmPasswordError(null);
                        }}
                        className={`w-full bg-[#0a0f1d] border ${
                          confirmPasswordError ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-[#F59E0B]'
                        } rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-500 outline-none text-xs transition-all font-mono focus:ring-1 focus:ring-[#F59E0B]/20`}
                      />
                    </div>
                  </div>
                </div>

                {passwordError && (
                  <p className="text-[11px] text-red-400 font-medium pl-1">{passwordError}</p>
                )}
                {confirmPasswordError && (
                  <p className="text-[11px] text-red-400 font-medium pl-1">{confirmPasswordError}</p>
                )}

                {/* 2-Step University Security Badge */}
                <div className="bg-[#090f1d] border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                  <div className="text-[10.5px] text-slate-300 leading-relaxed">
                    <span className="font-bold text-amber-300">
                      {lang === 'am' ? 'ባለ 2-ደረጃ የተማሪ ደህንነት ማረጋገጫ፡' : 'Real-Time Academic Security:'}
                    </span>{' '}
                    {lang === 'am' 
                      ? 'ምዝገባውን ሲያጠናቅቁ ትክክለኛው ባለ 6-አሃዝ የማረጋገጫ ኮድ ወደ ኢሜይልዎ ይላካል እና በFirebase ይረጋገጣል።' 
                      : 'An authentic 6-digit activation code is sent to your email address and verified cryptographically by Firebase.'}
                  </div>
                </div>

                {/* Submit Create Account Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-105 active:scale-[0.99] text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 text-black" />
                  )}
                  <span>{loading ? t.loading : t.createAccountBtn}</span>
                </button>
              </form>
            )}

            {/* Terms & Privacy Links Footer */}
            <div className="pt-2 border-t border-slate-800 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-2 text-[10.5px] text-slate-500">
                <button
                  type="button"
                  onClick={() => { playClickChime(); setLegalModalTab('terms'); setShowLegalModal(true); }}
                  className="hover:text-amber-400 transition-colors underline cursor-pointer"
                >
                  {t.termsLink}
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => { playClickChime(); setLegalModalTab('privacy'); setShowLegalModal(true); }}
                  className="hover:text-amber-400 transition-colors underline cursor-pointer"
                >
                  {t.privacyLink}
                </button>
              </div>

              <p className="text-[9.5px] text-slate-500 font-mono tracking-tight">
                🔒 Official Wolkite University & Ethiopian Campus Portal • 256-bit Encrypted
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE: EMAIL VERIFICATION (VERIFY THROUGH EMAIL MESSAGE - CODE OR LINK)    */}
        {/* ========================================================================= */}
        {mode === 'verify_registration' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 text-left"
          >
            {/* Header */}
            <div className="text-center space-y-2.5">
              <div className="relative w-14 h-14 mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-amber-500/10 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center text-[#F59E0B] shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                  <Mail className="w-7 h-7 text-amber-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center border-2 border-[#0e1628] shadow-md">
                  <Key className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121c33] border border-amber-500/30 text-[#F59E0B] text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'am' ? 'የአካዳሚክ ኢሜይል ፍቃድ ማረጋገጫ' : 'Academic Email Authorization'}</span>
              </div>

              <h3 className="font-serif text-lg sm:text-xl font-black text-white">
                {lang === 'am' ? 'የተላከውን የማረጋገጫ ካርድ ይቀበሉ' : 'Accept Verification Card'}
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                {lang === 'am'
                  ? 'የአካውንት ማግበሪያ የማረጋገጫ ካርድ እና ባለ 6-አሃዝ ኮድ ወደ ኢሜይልዎ ልከናል፡'
                  : 'An official student authorization card with an acceptance link has been dispatched to:'}
              </p>

              {/* Target Email Display */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0b1329] border border-amber-500/40 text-amber-300 font-mono text-xs font-bold shadow-inner">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate max-w-[240px] sm:max-w-[280px]">
                  {pendingStudentProfile?.email || email.trim()}
                </span>
              </div>
            </div>

            {/* Error / Alert Notices */}
            {codeError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-start gap-2 animate-shake">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{codeError}</span>
              </div>
            )}
            {authError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}
            {infoMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* ACADEMIC AUTHORIZATION VERIFICATION CARD */}
            <div className="bg-gradient-to-br from-[#121c35] via-[#0c1527] to-[#080d1a] border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-[0_0_35px_rgba(245,158,11,0.15)] relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                      {lang === 'am' ? 'የተማሪ ፍቃድ ማረጋገጫ ካርድ' : 'Academic Verification Card'}
                    </h4>
                    <span className="text-[9.5px] text-slate-400 font-mono">
                      ETHIOLEARN PRO • OFFICIAL DISPATCH
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9.5px] font-bold uppercase tracking-wider">
                  {lang === 'am' ? 'በመጠባበቅ ላይ' : 'Pending Authorization'}
                </span>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-3 bg-[#080f20]/90 p-2.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">{lang === 'am' ? 'የተማሪ ስም' : 'Student Name'}</span>
                  <span className="font-bold text-slate-100 truncate block">{pendingStudentProfile?.name || name || 'Student'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">{lang === 'am' ? 'ዩኒቨርሲቲ' : 'Institution'}</span>
                  <span className="font-bold text-amber-200/90 truncate block">{pendingStudentProfile?.university || university || 'Wolkite University'}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 uppercase font-mono">{lang === 'am' ? 'የፍቃድ መዳረሻ ኢሜይል' : 'Verification Target'}</span>
                  <span className="font-bold text-amber-400 font-mono truncate max-w-[200px]">{pendingStudentProfile?.email || email.trim()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {lang === 'am'
                  ? 'ይህ የማረጋገጫ ካርድ ወደ ኢሜይል ሳጥንዎ ተልኳል። በኢሜይሉ ውስጥ "Accept Authorization" የሚለውን ሊንክ በመጫን በቀጥታ ፍቃድ ይስጡ ወይም ከታች ባለ 6-አሃዝ ኮዱን ያስገቡ።'
                  : 'This authorization card was sent to your email inbox. Click "Accept Authorization" in the email message to activate instantly, or submit the 6-digit code below.'}
              </p>

              {/* Action Buttons inside Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCheckEmailLinkVerification}
                  disabled={loading}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600/30 to-emerald-700/30 hover:from-emerald-600/40 hover:to-emerald-700/40 text-emerald-300 hover:text-emerald-200 border border-emerald-500/50 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lang === 'am' ? 'ፍቃዱን በኢሜይል ተቀብያለሁ' : "I've Accepted via Email"}</span>
                </button>

                <a
                  href={getMailboxUrl(pendingStudentProfile?.email || email)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/50 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{lang === 'am' ? 'የኢሜይል ሳጥኔን ክፈት' : 'Open Email Inbox'}</span>
                </a>
              </div>
            </div>

            {/* DIVIDER: OR ENTER 6-DIGIT CODE */}
            <div className="flex items-center gap-3 my-1">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {lang === 'am' ? 'ወይም በማረጋገጫ ኮድ' : 'OR ENTER 6-DIGIT VERIFICATION CODE'}
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* 6-DIGIT CODE INPUT */}
            <form onSubmit={handleVerifyRegistrationCode} className="bg-[#090f1d] border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-[#F59E0B] border border-amber-500/40 flex items-center justify-center text-[10px] font-black">#</span>
                  <span>{lang === 'am' ? 'ባለ 6-አሃዝ የማረጋገጫ ኮድ' : '6-Digit Security Code'}</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {lang === 'am' ? 'ከኢሜይል መልእክት' : 'From Email Card'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="relative max-w-[260px] mx-auto">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    value={verificationCodeInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCodeInput(val);
                      setCodeError(null);
                    }}
                    placeholder="• • • • • •"
                    className="w-full text-center tracking-[0.4em] font-mono text-2xl sm:text-3xl font-black py-3 px-4 bg-[#0f172a] text-[#F59E0B] placeholder-slate-600 rounded-xl border border-amber-500/40 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 shadow-inner transition"
                  />
                </div>
                {dispatchedSecurityCode && (
                  <p className="text-[10px] text-center text-slate-400 italic">
                    {lang === 'am' 
                      ? `የሙከራ ማስታወሻ፡ የማረጋገጫ ኮዱ [ ${dispatchedSecurityCode} ] ነው` 
                      : `Dev Testing Helper: Email code is [ ${dispatchedSecurityCode} ]`}
                  </p>
                )}
              </div>

              {/* Submit Code Button */}
              <button
                type="submit"
                disabled={loading || verificationCodeInput.length < 6}
                className="w-full py-3 bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-105 active:scale-[0.99] text-black font-serif font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-black stroke-[3]" />
                )}
                <span>
                  {loading 
                    ? (lang === 'am' ? 'ኮዱን በማረጋገጥ ላይ...' : 'Verifying Code...') 
                    : (lang === 'am' ? 'ኮዱን አረጋግጥና አካውንት ክፈት' : 'Verify Code & Activate Account')}
                </span>
              </button>
            </form>

            {/* Academic Info & Resend Controls */}
            <div className="bg-[#090f1d]/70 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>{lang === 'am' ? 'ኢሜይሉ አልደረሰዎትም?' : "Didn't receive the email?"}</span>
                <button
                  type="button"
                  onClick={handleResendRegistrationCode}
                  disabled={resendTimer > 0 || loading}
                  className="text-amber-400 hover:text-amber-300 font-bold disabled:text-slate-500 cursor-pointer flex items-center gap-1 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${resendTimer > 0 ? 'animate-spin' : ''}`} />
                  <span>
                    {resendTimer > 0 
                      ? `${lang === 'am' ? 'በድጋሚ ለመላክ' : 'Resend in'} (${resendTimer}s)` 
                      : (lang === 'am' ? 'መልእክቱን በድጋሚ ላክ' : 'Resend Email Message')}
                  </span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                {lang === 'am'
                  ? 'ማስታወሻ፡ ኢሜይሉ በዋናው ሳጥን ውስጥ ካልታየ እባክዎ Spam ወይም Junk ፎልደርዎን ይመልከቱ።'
                  : 'Tip: If you do not see the message in your Inbox, please inspect your Spam or Promotions folder.'}
              </p>
            </div>

            {/* Change Email or Go Back to Registration */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { playClickChime(); setMode('signup'); }}
                className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  {lang === 'am' ? 'የተሳሳተ ኢሜይል? ተመልሰው መረጃዎን ያርሙ' : 'Wrong email? Go back to edit registration'}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* MODE: REGISTRATION SUCCESS (Digital Student ID Card) */}
        {/* ========================================================================= */}
        {mode === 'registration_success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-black text-white">
                {lang === 'am' ? 'ምዝገባዎ በተሳካ ሁኔታ ተረጋግጧል!' : 'Account Verified & Activated!'}
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                {lang === 'am'
                  ? 'እንኳን ወደ ኢትዮ ለርን ፕሮ በደህና መጡ! የአካዳሚክ ፕሮፋይልዎ ተከፍቷል።'
                  : 'Welcome to EthioLearn Pro! Your university portal is fully verified and ready.'}
              </p>
            </div>

            {/* Ethiopian Scholar Digital ID Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#121c33] via-[#0b1325] to-[#070b16] border border-[#F59E0B]/50 p-5 shadow-2xl overflow-hidden relative text-left">
              <div className="flex items-center justify-between pb-3 border-b border-[#F59E0B]/25">
                <div className="flex items-center gap-2">
                  <EthioLearnLogo size={28} />
                  <div>
                    <p className="text-[11px] font-bold font-serif text-[#F59E0B]">ETHIOLEARN PRO</p>
                    <p className="text-[8.5px] text-slate-400 tracking-widest uppercase font-mono">National Scholar ID</p>
                  </div>
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 text-[9.5px] font-extrabold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>VERIFIED</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#F59E0B] to-amber-300 border-2 border-amber-300/40 flex items-center justify-center text-black font-extrabold text-xl shrink-0 shadow-lg">
                  {pendingStudentProfile?.name?.[0]?.toUpperCase() || name?.[0]?.toUpperCase() || 'S'}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h4 className="text-sm font-extrabold text-white truncate">
                    {pendingStudentProfile?.name || name || 'Scholar'}
                  </h4>
                  <p className="text-xs text-[#F59E0B] font-medium truncate">
                    {pendingStudentProfile?.university || university || 'Wolkite University'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {pendingStudentProfile?.email || email}
                  </p>
                </div>
              </div>

              {/* Ethiopian Flag Accent Band */}
              <div className="flex h-[3px] w-full overflow-hidden rounded-full mt-4 opacity-80 select-none">
                <div className="flex-1 bg-emerald-500 h-full" />
                <div className="flex-1 bg-[#F59E0B] h-full" />
                <div className="flex-1 bg-red-500 h-full" />
              </div>
            </div>

            {/* Enter Campus Button */}
            <button
              type="button"
              onClick={handleEnterCampus}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-[#F59E0B] to-amber-500 hover:brightness-105 active:scale-[0.99] text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all"
            >
              <GraduationCap className="w-4 h-4 text-black" />
              <span>{lang === 'am' ? 'ወደ ኢትዮ ለርን ፕሮ ግባ' : 'Enter EthioLearn Pro Campus'}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* MODE: FORGOT PASSWORD */}
        {/* ========================================================================= */}
        {mode === 'forgot_password' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 text-left"
          >
            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg font-black text-white">
                {lang === 'am' ? 'የይለፍ ቃል መቀየር' : 'Reset Student Password'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'am'
                  ? 'የተመዘገቡበትን ኢሜይል አድራሻ ያስገቡ። የማረጋገጫ ኮድ በቀጥታ ይላክልዎታል።'
                  : 'Enter your registered email address to receive a 6-digit recovery code.'}
              </p>
            </div>

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    className="w-full bg-[#0a0f1d] border border-slate-700 focus:border-[#F59E0B] rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none text-xs transition-all focus:ring-1 focus:ring-[#F59E0B]/20"
                  />
                </div>
                {emailError && (
                  <p className="text-[11px] text-red-400 font-medium pl-1">{emailError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:brightness-105 text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-black" />
                )}
                <span>{loading ? (lang === 'am' ? 'በመላክ ላይ...' : 'Sending Code...') : (lang === 'am' ? 'የማረጋገጫ ኮድ ላክ' : 'Send Recovery Code')}</span>
              </button>

              <div className="text-center pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { playClickChime(); setMode('signin'); setAuthError(null); setInfoMessage(null); }}
                  className="text-xs font-bold text-[#F59E0B] hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'am' ? 'ወደ መግቢያ ተመለስ' : 'Back to Sign In'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* MODE: VERIFY RESET CODE (PURE & PRO BOARD) */}
        {/* ========================================================================= */}
        {mode === 'verify_reset_code' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 text-left"
          >
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121c33] border border-amber-500/30 text-[#F59E0B] text-[10px] font-extrabold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{lang === 'am' ? 'የደህንነት ማረጋገጫ ቦርድ' : 'Account Recovery Board'}</span>
              </div>
              <h3 className="font-serif text-lg font-black text-white">
                {lang === 'am' ? 'የይለፍ ቃል መቀየሪያ ኮድ' : 'Enter Recovery Code'}
              </h3>
              <p className="text-xs text-slate-300">
                {lang === 'am' 
                  ? 'ለአካውንትዎ የተላከውን ባለ 6-አሃዝ የማረጋገጫ ኮድ ያስገቡ።' 
                  : 'Enter the authentic 6-digit recovery code dispatched to your registered address.'}
              </p>
            </div>

            {codeError && (
              <div className="p-3 bg-red-950/30 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p>{codeError}</p>
              </div>
            )}

            <form onSubmit={handleVerifyResetCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'am' ? 'ባለ 6-አሃዝ የማረጋገጫ ኮድ' : '6-Digit Verification Code'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={verificationCodeInput}
                  onChange={(e) => {
                    setVerificationCodeInput(e.target.value.replace(/\D/g, ''));
                    if (codeError) setCodeError(null);
                  }}
                  className="w-full bg-[#0a0f1d] border border-slate-700 focus:border-[#F59E0B] rounded-xl py-3 text-slate-100 placeholder-slate-600 outline-none text-xl tracking-[0.4em] font-mono font-bold transition-all text-center focus:ring-2 focus:ring-[#F59E0B]/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationCodeInput.length < 6}
                className="w-full py-3.5 bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#D97706] hover:brightness-105 active:scale-[0.99] text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-black" />
                )}
                <span>
                  {loading 
                    ? (lang === 'am' ? 'በማረጋገጥ ላይ...' : 'Verifying...') 
                    : (lang === 'am' ? 'ኮዱን አረጋግጥና ቀጥል' : 'Confirm Code & Continue')}
                </span>
              </button>

              <div className="text-center pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { playClickChime(); setMode('forgot_password'); }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  {lang === 'am' ? 'ኮድ አልደረሰኝም? እንደገና ላክ' : "Didn't receive code? Resend"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* MODE: UPDATE PASSWORD */}
        {/* ========================================================================= */}
        {mode === 'update_password' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 text-left"
          >
            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg font-black text-white">
                {lang === 'am' ? 'አዲስ የይለፍ ቃል ያዘጋጁ' : 'Create New Password'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'am' ? 'እባክዎ አዲሱን የይለፍ ቃልዎን ከዚህ በታች ያስገቡ።' : 'Enter and confirm your new account password below.'}
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'am' ? 'አዲስ የይለፍ ቃል' : 'New Password'}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-700 focus:border-[#F59E0B] rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'am' ? 'አዲሱን የይለፍ ቃል አረጋግጥ' : 'Confirm New Password'}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-700 focus:border-[#F59E0B] rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none text-xs font-mono"
                />
              </div>

              {passwordError && (
                <p className="text-[11px] text-red-400 font-medium pl-1">{passwordError}</p>
              )}
              {confirmPasswordError && (
                <p className="text-[11px] text-red-400 font-medium pl-1">{confirmPasswordError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:brightness-105 text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 text-black" />
                <span>{loading ? (lang === 'am' ? 'በመቀየር ላይ...' : 'Updating...') : (lang === 'am' ? 'የይለፍ ቃል ቀይር' : 'Update Password')}</span>
              </button>
            </form>
          </motion.div>
        )}
      </motion.div>

      {/* Privacy Policy & Terms Modal */}
      <LegalPrivacyTermsModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        language={lang}
        initialTab={legalModalTab}
      />
    </div>
  );
}
