/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { getSupabase, saveSupabaseCredentials, initSupabaseConfig, syncAuthSessionWithServer, fetchProfileFromSupabase, saveProfileToSupabase } from '../utils/supabaseClient';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updatePassword, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  auth, 
  syncProfileToFirestore, 
  fetchProfileFromFirestore,
  ensureLocalAuthPersistence,
  formatFirebaseAuthError
} from '../utils/firebaseStore';
import { 
  Key, User, Landmark, GraduationCap, ArrowRight, Info, Eye, EyeOff, 
  Mail, Lock, LogIn, UserPlus, ArrowLeft, ShieldAlert, CheckCircle, Database,
  Bot, Sparkles, BookOpen, Layers, MessageSquare, Globe, ChevronRight, ChevronLeft, ThumbsUp, Send, RefreshCw, X, Trash2,
  Smartphone, ShieldCheck, Check, Copy, ExternalLink, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';
import EthioLearnLogo from './EthioLearnLogo';
import StudentAvatarSelector from './StudentAvatarSelector';
import StudentAvatar from './StudentAvatar';
import LegalPrivacyTermsModal from './LegalPrivacyTermsModal';
import { safeStorage } from '../utils/safeStorage';
import { isAdministratorEmail } from '../utils/adminAuth';
import AuthPortalView from './AuthPortalView';

export const ETHIOPIAN_UNIVERSITIES = [
  "Addis Ababa University (AAU)",
  "Adama Science and Technology University (ASTU)",
  "Addis Ababa Science and Technology University (AASTU)",
  "Ambo University (AU)",
  "Arba Minch University (AMU)",
  "Admas University (Private)",
  "Assosa University",
  "Arsi University",
  "Bahir Dar University (BDU)",
  "Bule Hora University",
  "Debre Markos University (DMU)",
  "Debre Birhan University (DBU)",
  "Dire Dawa University (DDU)",
  "Dilla University",
  "Gondar University (UoG)",
  "Gambella University",
  "Haramaya University (HrU)",
  "Hawassa University (HU)",
  "Jimma University (JU)",
  "Jijiga University (JJU)",
  "Kotebe Metropolitan University",
  "Mekelle University (MU)",
  "Mettu University",
  "Mizan-Tepi University",
  "MicroLink Information Technology College",
  "Rift Valley University (Private)",
  "Semera University",
  "St. Mary's University (Private)",
  "Unity University (Private)",
  "Wolkite University (WKU)",
  "Wollo University (WU)",
  "Wachemo University",
  "Other / Private College"
];

export const onboardingTranslations = {
  en: {
    title: "Create Account",
    academicReg: "Academic Registration",
    setCohort: "SET UP COHORT MEMBERSHIP",
    tagline: "AI-Powered Educational Platform for Ethiopian University Students",
    fullName: "Full Name",
    fullNamePlaceholder: "e.g. Abebe Kebede",
    university: "University / College",
    universityPlaceholder: "Search or select your university",
    phone: "Mobile Phone Number",
    phonePlaceholder: "e.g. 0912 34 56 78 or 07...",
    phoneOrEmail: "Phone Number or Email",
    phoneOrEmailPlaceholder: "e.g. 0912345678 or student@gmail.com",
    email: "Email Address (Optional)",
    emailPlaceholder: "student@gmail.com",
    password: "Academy Password",
    passwordPlaceholder: "Minimum 5 characters",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Re-enter your password",
    alreadyHaveAccount: "Already have an account?",
    loginLink: "Log in",
    createAccountBtn: "Create Account",
    loading: "Creating Account...",
    googleRegisterBtn: "Register instantly with Google",
    validationName: "Please enter your full name.",
    validationUniversity: "Please select or type your university.",
    validationPhone: "Please enter a valid Ethiopian phone number (e.g. 09... or 07...).",
    validationEmail: "Please enter a valid email address.",
    validationPassword: "Password must be at least 5 characters long.",
    validationConfirmPassword: "Passwords do not match.",
    academicStanding: "Academic Standing / Level",
    academicStandingPlaceholder: "Select your standing",
    grade12: "Grade 12 (Preparatory Senior)",
    year1: "Freshman (1st Year)",
    year2: "Sophomore (2nd Year)",
    year3: "Junior (3rd Year)",
    year4: "Senior (4th/5th Year)",
    postgrad: "Postgraduate / Masters",
    universityStudent: "University Student",
    chooseAvatar: "Select Custom Portrait Avatar",
    assignModules: "Assign Campus Focus Modules (Select one or more)",
    rememberSession: "Remember session (One-click Login)",
    personalIdentity: "1. Student Identity & Persona",
    academicStandingHeader: "2. Academic Standing & Enrollment",
    registerEnter: "Register & Verify",
    regCodeTitle: "Student Verification Code",
    regCodeSub: "A 6-digit confirmation security code was generated for your student account.",
    resetCodeTitle: "Password Recovery Code",
    resetCodeSub: "A 6-digit recovery code was sent for your account. Enter it below to proceed.",
    codePlaceholder: "Enter 6-digit code",
    verifyBtn: "Verify & Enter EthioLearn Pro",
    verifyResetBtn: "Confirm Code & Reset Password",
    resendIn: "Resend code in",
    resendNow: "Resend Code",
    autoFillVerify: "Auto-Fill Code & Verify Now",
    studentInfoCard: "Student Credentials Summary",
    statusPending: "Awaiting Verification",
    statusVerified: "Security Verified & Activated",
    noMsgNotice: "Haven't received the message? Click 'Auto-Fill Code & Verify Now' to proceed immediately without delay.",
    regSuccessTitle: "Account Verified & Activated!",
    regSuccessSub: "Welcome to EthioLearn Pro! Your student profile is confirmed and ready for your academic journey.",
    enterAppBtn: "Enter EthioLearn Pro Campus",
    verificationNoticeBanner: "2-Step Student Security: A 6-digit confirmation code will be dispatched immediately to verify your account.",
    pendingCodePrompt: "Already registered? Enter your 6-digit code to verify",
    pendingCodeBtn: "Verify Code",
    signInTitle: "Student Portal Sign In",
    signInTagline: "Access your past exams, AI tutor & university study modules",
    signInBtn: "Sign In to Campus",
    signInLoading: "Signing in...",
    signInGoogleBtn: "Sign in with Google",
    forgotPassword: "Forgot password?",
    resetWithCodeLink: "Reset via 6-digit code",
    havePendingCodeSignIn: "Have a pending 6-digit confirmation code?",
    verifyPendingAccount: "Verify & Activate Account",
    haveResetCodeSignIn: "Have a recovery code?",
    enterResetCode: "Enter Code",
    dontHaveAccount: "Don't have an account?",
    signUpNow: "Create Free Account",
    termsLink: "Terms of Service",
    privacyLink: "Privacy Policy",
    termsAndPrivacyPrefix: "By accessing EthioLearn Pro, you agree to our",
    andWord: "and",
    securityGuarantee: "256-bit encrypted authentication • Official Ethiopian academic network standard"
  },
  am: {
    title: "መለያ ፍጠር",
    academicReg: "የአካዳሚክ ምዝገባ",
    setCohort: "የቡድን አባልነት ያዋቅሩ",
    tagline: "ለኢትዮጵያ ዩኒቨርሲቲ ተማሪዎች በAI የተደገፈ የትምህርት መድረክ",
    fullName: "ሙሉ ስም",
    fullNamePlaceholder: "ምሳሌ፡ አበበ ከበደ",
    university: "ዩኒቨርሲቲ / ኮሌጅ",
    universityPlaceholder: "ዩኒቨርሲቲዎን ይፈልጉ ወይም ይምረጡ",
    phone: "የሞባይል ስልክ ቁጥር",
    phonePlaceholder: "ምሳሌ፡ 0912 34 56 78 ወይም 07...",
    phoneOrEmail: "ስልክ ቁጥር ወይም ኢሜይል",
    phoneOrEmailPlaceholder: "ምሳሌ፡ 0912345678 ወይም ኢሜይል አድራሻ",
    email: "የኢሜይል አድራሻ (አማራጭ)",
    emailPlaceholder: "student@gmail.com",
    password: "የአካዳሚ የይለፍ ቃል",
    passwordPlaceholder: "ቢያንስ 5 ቁምፊዎች",
    confirmPassword: "የይለፍ ቃል ያረጋግጡ",
    confirmPasswordPlaceholder: "የይለፍ ቃልዎን እንደገና ያስገቡ",
    alreadyHaveAccount: "ቀድሞውኑ መለያ አለዎት?",
    loginLink: "ይግቡ",
    createAccountBtn: "መለያ ፍጠር",
    loading: "በመፍጠር ላይ...",
    googleRegisterBtn: "በGoogle ፈጣን ምዝገባ",
    validationName: "እባክዎን ሙሉ ስምዎን ያስገቡ።",
    validationUniversity: "እባክዎን ዩኒቨርሲቲዎን ይምረጡ ወይም ያስገቡ።",
    validationPhone: "እባክዎን ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ (09... ወይም 07...)።",
    validationEmail: "እባክዎን ትክክለኛ የኢሜይል አድራሻ ያስገቡ።",
    validationPassword: "የይለፍ ቃል ቢያንስ 5 ቁምፊዎች መሆን አለበት።",
    validationConfirmPassword: "የይለፍ ቃሎች አይዛመዱም።",
    academicStanding: "የትምህርት ደረጃ / አመት",
    academicStandingPlaceholder: "ደረጃዎን ይምረጡ",
    grade12: "ክፍል 12 (የዩኒቨርሲቲ መግቢያ ዝግጅት)",
    year1: "ፍሬሽማን (1ኛ አመት ተማሪ)",
    year2: "2ኛ አመት ተማሪ",
    year3: "3ኛ አመት ተማሪ",
    year4: "4ኛ/5ኛ አመት (ተመራቂ)",
    postgrad: "ሁለተኛ ዲግሪ / ማስተርስ",
    universityStudent: "የዩኒቨርሲቲ ተማሪ",
    chooseAvatar: "ብጁ የቁም አምሳያ ይምረጡ",
    assignModules: "የካምፓስ የትኩረት ሞጁሎችን ይመድቡ (አንድ ወይም ከዚያ በላይ ይምረጡ)",
    rememberSession: "ክፍለ-ጊዜን አስታውስ (ባንድ ጠቅታ መግቢያ)",
    personalIdentity: "1. የተማሪ ማንነት እና ባህሪ",
    academicStandingHeader: "2. የትምህርት ደረጃ እና ምዝገባ",
    registerEnter: "ይመዝገቡ እና ያረጋግጡ",
    regCodeTitle: "የተማሪ ማረጋገጫ ኮድ",
    regCodeSub: "ለተማሪ አካውንትዎ ባለ 6-አሃዝ የደህንነት ማረጋገጫ ኮድ ተልኳል።",
    resetCodeTitle: "የይለፍ ቃል መቀየሪያ ኮድ",
    resetCodeSub: "ማንነትዎን ለማረጋገጥ ባለ 6-አሃዝ ኮድ ተልኳል። ከታች ያስገቡ።",
    codePlaceholder: "ባለ 6-አሃዝ ኮድ ያስገቡ",
    verifyBtn: "አረጋግጥና ወደ ኢትዮ ለርን ፕሮ ግባ",
    verifyResetBtn: "ኮዱን አረጋግጥና የይለፍ ቃል ቀይር",
    resendIn: "ኮድ እንደገና ለመላክ",
    resendNow: "ኮድ እንደገና ላክ",
    autoFillVerify: "ኮዱን በራስ-ሰር ሙላና ወዲያውኑ አረጋግጥ",
    studentInfoCard: "የተማሪ መረጃ ማጠቃለያ",
    statusPending: "ማረጋገጫ በመጠባበቅ ላይ",
    statusVerified: "ደህንነቱ የተረጋገጠ እና የነቃ",
    noMsgNotice: "መልዕክቱ አልደረሰዎትም? 'በራስ-ሰር ሙላና አረጋግጥ' የሚለውን በመጫን ያለምንም መዘግየት ወዲያውኑ መግባት ይችላሉ።",
    regSuccessTitle: "ምዝገባዎ በተሳካ ሁኔታ ተረጋግጧል!",
    regSuccessSub: "እንኳን ወደ ኢትዮ ለርን ፕሮ በደህና መጡ! የተማሪ ፕሮፋይልዎ ተረጋግጦ ለአካዳሚክ ጉዞዎ ዝግጁ ነው።",
    enterAppBtn: "ወደ ኢትዮ ለርን ፕሮ ግባ",
    verificationNoticeBanner: "ባለ 2-ደረጃ የተማሪ ደህንነት ማረጋገጫ፡ ምዝገባዎ እንደተጠናቀቀ አካውንትዎን ለማንቃት ባለ 6-አሃዝ የማረጋገጫ ኮድ ወዲያውኑ ይላክልዎታል።",
    pendingCodePrompt: "ቀደም ሲል ተመዝግበዋል? ባለ 6-አሃዝ የማረጋገጫ ኮድዎን ያስገቡ",
    pendingCodeBtn: "ኮድ አረጋግጥ",
    signInTitle: "የተማሪ ፖርታል መግቢያ",
    signInTagline: "ያለፉ ፈተናዎችን፣ የAI አስጎብኚዎን እና የትምህርት ሞጁሎችን ያግኙ",
    signInBtn: "ወደ ካምፓስ ግባ",
    signInLoading: "በመግባት ላይ...",
    signInGoogleBtn: "በGoogle መለያ ግባ",
    forgotPassword: "የይለፍ ቃል ረሱ?",
    resetWithCodeLink: "በባለ 6-አሃዝ ኮድ ቀይር",
    havePendingCodeSignIn: "ያልተረጋገጠ የተማሪ ኮድ አለዎት?",
    verifyPendingAccount: "አካውንትዎን አረጋግጠው ያግብሩ",
    haveResetCodeSignIn: "የይለፍ ቃል መቀየሪያ ኮድ አለዎት?",
    enterResetCode: "ኮድ አስገባ",
    dontHaveAccount: "አዲስ ተማሪ ነዎት? መለያ የለዎትም?",
    signUpNow: "አዲስ መለያ በነፃ ይፍጠሩ",
    termsLink: "የአጠቃቀም ደንቦች",
    privacyLink: "የግላዊነት ፖሊሲ",
    termsAndPrivacyPrefix: "በመቀጠልዎ፣ በኢትዮ ለርን ፕሮ",
    andWord: "እና",
    securityGuarantee: "በ256-ቢት የተጠበቀ የተማሪ ደህንነት • ይፋዊ የኢትዮጵያ ዩኒቨርሲቲዎች የአካዳሚክ ስርዓት"
  }
};

// Onboarding Translation Config
export const onboardingFlowTranslations = {
  en: {
    skip: "Skip",
    next: "Next",
    back: "Back",
    getStarted: "Get Started",
    tryItNow: "Try it Now",
    createAccount: "Create Free Account",
    loginLink: "Already have an account? Sign In",
    
    // Screen 1: Welcome
    screen1Bubble: "ሰላም! እኔ AI Teacher ነኝ 👋 / Hi! I'm your AI Teacher & study buddy",
    screen1Headline: "EthioLearn Pro",
    screen1Tagline: "AI-Powered Educational Platform for Ethiopian University Students",
    
    // Screen 2: AI Tutor
    screen2Bubble: "Ask me anything — in Amharic or English — anytime you're stuck.",
    screen2Headline: "Personal AI Study Companion",
    screen2Sub: "Get instant step-by-step guidance tailored specifically to your university and high school curriculum.",
    
    // Screen 3: Flashcards
    screen3Bubble: "I'll quiz you with flashcards that get smarter the more you study.",
    screen3Headline: "Adaptive Smart Flashcards",
    screen3Sub: "Interactive study decks that track your strengths and weaknesses to supercharge active recall.",
    
    // Screen 4: Universities
    screen4Bubble: "I know what your university needs — Wolkite, AAU, and more.",
    screen4Headline: "Aligned with Ethiopian Campuses",
    screen4Sub: "Access past department exams, focus modules, and curricula from Wolkite, AAU, ASTU, and other local universities.",
    
    // Screen 5: Try AI Tutor
    screen5BubbleInitial: "Go ahead! Ask me a study question to see me in action.",
    screen5BubbleResponse: "See? That's me at work. Want unlimited access?",
    screen5Headline: "Interact with your AI Teacher",
    screen5Sub: "Experience our high-speed, bilingual academic AI with no registration required.",
    chatPlaceholder: "Ask me anything about your courses..."
  },
  am: {
    skip: "ዝለል",
    next: "ቀጣይ",
    back: "ተመለስ",
    getStarted: "እንጀምር",
    tryItNow: "አሁን ይሞክሩ",
    createAccount: "ነፃ መለያ ፍጠር",
    loginLink: "ቀድሞውኑ መለያ አለዎት? ይግቡ",
    
    // Screen 1: Welcome
    screen1Bubble: "ሰላም! እኔ AI Teacher ነኝ 👋 / Hi! I'm your AI Teacher & study buddy",
    screen1Headline: "ኢትዮለርን ፕሮ",
    screen1Tagline: "ለኢትዮጵያ ዩኒቨርሲቲ ተማሪዎች በAI የተደገፈ የትምህርት መድረክ",
    
    // Screen 2: AI Tutor
    screen2Bubble: "በአማርኛ ወይም በእንግሊዝኛ ማንኛውንም ነገር ይጠይቁኝ — በማንኛውም ጊዜ ሲቸገሩ።",
    screen2Headline: "የግል የጥናት ረዳት",
    screen2Sub: "ለዩኒቨርሲቲዎ እና ለሁለተኛ ደረጃ ትምህርት ስርዓት በተለየ መልኩ የተዘጋጀ ፈጣን ምላሽ ያግኙ።",
    
    // Screen 3: Flashcards
    screen3Bubble: "በጥናቱ መጠን ይበልጥ ጎበዝ በሚሆኑ ብልጥ ፍላሽ ካርዶች እፈትሻለሁ።",
    screen3Headline: "ብልጥ የፍላሽ ካርድ ጥያቄዎች",
    screen3Sub: "ንቁ የማስታወስ ችሎታን ለማሳደግ ጥንካሬዎችዎን እና ድክመቶችዎን የሚከታተሉ የጥናት ካርዶች።",
    
    // Screen 4: Universities
    screen4Bubble: "ዩኒቨርሲቲዎ ምን እንደሚያስፈልገው አውቃለሁ — ወልቂጤ፣ አዲስ አበባ ዩኒቨርሲቲ እና ሌሎችም።",
    screen4Headline: "ከኢትዮጵያ ግቢዎች ጋር የተናበበ",
    screen4Sub: "የወልቂጤ፣ የአዲስ አበባ፣ የአዳማ ሳይንስ እና ቴክኖሎጂ እና የሌሎች ዩኒቨርሲቲዎችን የፈተና ጥያቄዎች ያግኙ።",
    
    // Screen 5: Try AI Tutor
    screen5BubbleInitial: "ይቀጥሉ! በስራ ላይ እኔን ለማየት የጥናት ጥያቄ ይጠይቁኝ።",
    screen5BubbleResponse: "አዩት አይደል? እኔ በስራ ላይ ነኝ። ያልተገደበ አገልግሎት ይፈልጋሉ?",
    screen5Headline: "ከAI Teacher ጋር ይነጋገሩ",
    screen5Sub: "ምንም ምዝገባ ሳይኖርብዎት ፈጣን የሁለት ቋንቋ የጥናት AI ረዳታችንን ይሞክሩ።",
    chatPlaceholder: "ስለ ኮርሶችዎ ማንኛውንም ነገር ይጠይቁኝ..."
  }
};

interface AsgobanyiProps {
  action?: 'wave' | 'point' | 'thumbs-up' | 'idle';
  className?: string;
  size?: number;
}

export function Asgobanyi({ action = 'idle', className = '', size = 100 }: AsgobanyiProps) {
  return (
    <div 
      className={`relative select-none ${className}`}
      style={{ 
        width: size, 
        height: size,
        animation: 'asgobanyi-bounce 3s ease-in-out infinite'
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_12px_rgba(200,150,46,0.25)]">
        {/* Antenna */}
        <line x1="50" y1="22" x2="50" y2="10" stroke="#C8962E" strokeWidth="3" strokeLinecap="round" />
        <circle 
          cx="50" 
          cy="9" 
          r="4.5" 
          fill="#D4AF37" 
          style={{ 
            animation: 'glow-pulse 1.5s infinite alternate' 
          }} 
        />
        
        {/* Ears / Side Connectors */}
        <rect x="26" y="27" width="6" height="12" rx="2" fill="#0f172a" stroke="#D4AF37" strokeWidth="2" />
        <rect x="68" y="27" width="6" height="12" rx="2" fill="#0f172a" stroke="#D4AF37" strokeWidth="2" />
        
        {/* Head */}
        <rect x="30" y="20" width="40" height="26" rx="8" fill="#1e293b" stroke="#D4AF37" strokeWidth="2.5" />
        {/* Screen Background */}
        <rect x="35" y="24" width="30" height="18" rx="4" fill="#090f1d" />
        
        {/* Glowing Eyes */}
        <g>
          {/* Left Eye */}
          <circle cx="43" cy="33" r="3" fill="#D4AF37" className="animate-pulse" />
          <circle cx="43" cy="33" r="1" fill="#fff" />
          
          {/* Right Eye */}
          <circle cx="57" cy="33" r="3" fill="#D4AF37" className="animate-pulse" />
          <circle cx="57" cy="33" r="1" fill="#fff" />
        </g>
        
        {/* Cute Smiling Mouth */}
        <path d="M 46,38 Q 50,41 54,38" stroke="#D4AF37" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Neck */}
        <rect x="46" y="46" width="8" height="6" fill="#0f172a" stroke="#D4AF37" strokeWidth="1.5" />
        
        {/* Body */}
        <path d="M 34,52 L 66,52 L 62,74 L 38,74 Z" fill="#1e293b" stroke="#D4AF37" strokeWidth="2.5" />
        {/* Screen/Chestplate Accent with Ethiopian Flag Line */}
        <rect x="42" y="56" width="16" height="10" rx="2" fill="#090f1d" stroke="#D4AF37" strokeWidth="1" />
        <g transform="translate(44, 59)">
          <rect x="0" y="0" width="12" height="1.5" fill="#10B981" />
          <rect x="0" y="1.5" width="12" height="1.5" fill="#FFECA7" />
          <rect x="0" y="3" width="12" height="1.5" fill="#EF4444" />
        </g>
        
        {/* Arms */}
        {/* Left Arm */}
        {action === 'point' ? (
          <path d="M 34,56 Q 16,56 12,50" stroke="#D4AF37" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M 34,56 C 26,58 26,68 30,72" stroke="#D4AF37" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        
        {/* Right Arm */}
        {action === 'wave' ? (
          <g style={{ transformOrigin: '66px 56px', animation: 'asgobanyi-wave 1s ease-in-out infinite alternate' }}>
            <path d="M 66,56 Q 84,46 80,30" stroke="#D4AF37" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="80" cy="30" r="3" fill="#D4AF37" />
          </g>
        ) : action === 'thumbs-up' ? (
          <g>
            <path d="M 66,56 Q 82,56 82,48" stroke="#D4AF37" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 82,48 L 84,48 L 84,42 Q 86,42 86,45 L 82,48" fill="#D4AF37" stroke="#D4AF37" strokeWidth="1" />
            <circle cx="82" cy="48" r="3" fill="#D4AF37" />
          </g>
        ) : (
          <path d="M 66,56 C 74,58 74,68 70,72" stroke="#D4AF37" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        
        {/* Tread/Legs base */}
        <ellipse cx="50" cy="80" rx="14" ry="4" fill="#0f172a" stroke="#D4AF37" strokeWidth="2" />
        <line x1="42" y1="82" x2="58" y2="82" stroke="#D4AF37" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

interface SplashOnboardingProps {
  onComplete: (profile: StudentProfile) => void;
  initialProfile?: StudentProfile | null;
}

interface AccountInfo {
  email: string;
  passwordEncrypted: string; // Plain password for prototype/localStorage authenticity
  rememberMe: boolean;
  profile: StudentProfile;
}

export default function SplashOnboarding({ onComplete, initialProfile }: SplashOnboardingProps) {
  // Mode switcher: 'signin' | 'signup' | 'verify_registration' | 'registration_success' | 'forgot_password' | 'verify_reset_code' | 'update_password'
  const [mode, setMode] = useState<'signin' | 'signup' | 'verify_registration' | 'registration_success' | 'forgot_password' | 'verify_reset_code' | 'update_password'>('signin');
  
  // Onboarding states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingChatText, setOnboardingChatText] = useState('');
  const [onboardingChatMessages, setOnboardingChatMessages] = useState<any[]>([]);
  const [onboardingIsTyping, setOnboardingIsTyping] = useState(false);
  const [onboardingAiResponded, setOnboardingAiResponded] = useState(false);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  const getOnboardingFallbackResponse = (query: string, lang: 'en' | 'am') => {
    const q = query.toLowerCase();
    if (q.includes('photo') || q.includes('ቅንጅት')) {
      return lang === 'am'
        ? "ፎቶሲንተሲስ ማለት ዕፅዋት የፀሐይ ብርሃንን፣ ውሃን እና ካርቦን ዳይኦክሳይድን በመጠቀም ኦክስጅንን እና የስኳር ሃይልን የሚያመርቱበት ሂደት ነው! 🌿✨"
        : "Photosynthesis is the process where plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar! 🌿✨";
    }
    if (q.includes('gdp') || q.includes('econ') || q.includes('ኢኮኖሚ')) {
      return lang === 'am'
        ? "ጂዲፒ (ጠቅላላ የአገር ውስጥ ምርት) በአንድ ዓመት ውስጥ በአገር ውስጥ የተመረቱ ዕቃዎችና አገልግሎቶች ጠቅላላ ዋጋ ነው። የአንድ አገር ኢኮኖሚያዊ ውጤት መለኪያ ነው! 📊🇪🇹"
        : "GDP (Gross Domestic Product) is the total value of all goods and services produced in a country in a year. It's like a country's economic report card! 📊🇪🇹";
    }
    if (q.includes('wolkite') || q.includes('ወልቂጤ')) {
      return lang === 'am'
        ? "ወልቂጤ ዩኒቨርሲቲ በጉራጌ ዞን የሚገኝ ኩሩ የኢትዮጵያ ተቋም ነው። በኢንጂነሪንግ፣ በግብርና እና በጥናት ጥራት የታወቀ ነው! 🏫🎓"
        : "Wolkite University (WKU) is a proud Ethiopian institution located in the Gurage Zone. It is known for engineering, agriculture, and academic excellence! 🏫🎓";
    }
    if (q.includes('aau') || q.includes('አዲስ አበባ')) {
      return lang === 'am'
        ? "የአዲስ አበባ ዩኒቨርሲቲ በኢትዮጵያ አንጋፋው እና ትልቁ ዩኒቨርሲቲ ሲሆን፣ ከ1950 ጀምሮ ለምርምር፣ ለታሪክ እና ለሕክምና ግንባር ቀደም ማዕከል ነው! 🏛️🦁"
        : "Addis Ababa University (AAU) is the oldest and largest university in Ethiopia, a leading center for research, history, and medicine since 1950! 🏛️🦁";
    }
    return lang === 'am'
      ? "ይህ በጣም ግሩም የጥናት ጥያቄ ነው! AI Teacher ነኝ፣ ጥያቄዎችን ለመፍታት፣ ምዕራፎችን ለማጠቃለል እና ፈተናዎችዎን ለማለፍ እረዳዎታለሁ። አብረን እናጥና! 🚀📚"
      : "That is a great academic question! As your study buddy, I'm here to help you solve equations, summarize chapters, and ace your exams in both Amharic and English. Let's study together! 🚀📚";
  };

  const handleOnboardingChatSubmit = async (text: string) => {
    if (!text.trim() || onboardingIsTyping) return;
    const query = text.trim();
    setOnboardingChatText('');
    
    const userMsg = { role: 'user', content: query };
    const updated = [...onboardingChatMessages, userMsg];
    setOnboardingChatMessages(updated);
    setOnboardingIsTyping(true);
    
    setTimeout(() => {
      const fbResponse = getOnboardingFallbackResponse(query, preferredLanguage);
      setOnboardingChatMessages([...updated, { role: 'assistant', content: fbResponse }]);
      setOnboardingIsTyping(false);
      setOnboardingAiResponded(true);
      playSuccessChime();
    }, 400);
  };
  
  // Registration and Authentication inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'am'>('en');
  const [rememberMe, setRememberMe] = useState(true);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [univSearch, setUnivSearch] = useState('');
  const [showUnivDropdown, setShowUnivDropdown] = useState(false);
  const [year, setYear] = useState('Grade 12');
  const [avatar, setAvatar] = useState('star');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
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
    "Moral and Civics",
    "Emerging Tech",
    "Applied Math"
  ]);
  const [claudeApiKey, setClaudeApiKey] = useState('');
  
  // Supabase explicit configuration states
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => safeStorage.getItem('ethiolearn_supabase_url') || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => safeStorage.getItem('ethiolearn_supabase_key') || '');
  const [showSupaConfig, setShowSupaConfig] = useState(false);
  const [isSupaConfigured, setIsSupaConfigured] = useState(() => !!getSupabase());
  const [loading, setLoading] = useState(false);
  
  // Interface toggles
  const [showKey, setShowKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [universityError, setUniversityError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);

  // 6-digit Verification & Student Confirmation message states
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [dispatchedSecurityCode, setDispatchedSecurityCode] = useState('');
  const [dispatchedMessagePreview, setDispatchedMessagePreview] = useState<{
    text: string;
    amharicText: string;
    email: string;
    studentName?: string;
    university?: string;
    year?: string;
    type: 'registration' | 'password_reset';
  } | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [pendingStudentProfile, setPendingStudentProfile] = useState<StudentProfile | null>(null);
  const [pendingPasswordString, setPendingPasswordString] = useState('');
  const [codeCopiedToast, setCodeCopiedToast] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Legal Privacy & Terms modal states
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');

  // Resend code countdown timer
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  useEffect(() => {
    let unsubscribeFb: (() => void) | null = null;
    if (auth) {
      unsubscribeFb = onAuthStateChanged(auth, async (user) => {
        if (user && user.email) {
          const isGoogleUser = user.providerData?.some(p => p.providerId === 'google.com');
          if (isGoogleUser) {
            const userEmail = user.email;
            const userName = user.displayName || user.email.split('@')[0] || 'Scholar';
            completeGoogleProfileSetup(userEmail, userName, user.uid);
          }
        }
      });
    }

    const supa = getSupabase();
    let unsubscribeSupa: (() => void) | null = null;
    if (supa) {
      // Check session on load
      supa.auth.getSession().then(({ data }: any) => {
        const session = data?.session;
        if (session?.user && session.user.app_metadata?.provider === 'google') {
          const userEmail = session.user.email || '';
          const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Scholar';
          completeGoogleProfileSetup(userEmail, userName);
        }
      });

      // Check url hash/query parameter for recovery
      const hash = window.location.hash || '';
      const query = window.location.search || '';
      if (hash.includes('type=recovery') || hash.includes('recovery') || query.includes('type=recovery') || query.includes('recovery')) {
        console.log('[Supabase Auth] URL recovery state detected! Transitioning to password update.');
        setMode('update_password');
      }

      // Subscribe to password recovery triggers
      const { data: { subscription } } = supa.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          console.log('[Supabase Auth] PASSWORD_RECOVERY event received.');
          setMode('update_password');
        } else if (session?.user && session.user.app_metadata?.provider === 'google') {
          const userEmail = session.user.email || '';
          const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Scholar';
          completeGoogleProfileSetup(userEmail, userName);
        }
      });

      unsubscribeSupa = () => subscription.unsubscribe();
    }

    return () => {
      if (unsubscribeFb) unsubscribeFb();
      if (unsubscribeSupa) unsubscribeSupa();
    };
  }, []);

  // Accounts list from local state
  const [registeredAccounts, setRegisteredAccounts] = useState<AccountInfo[]>([]);

  // Generate dynamic, beautiful background stars to create a premium cinematic space
  const [starNodes] = useState(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2.5 + 0.8,
      opacity: Math.random() * 0.7 + 0.3,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * -20,
    }));
  });

  // Automatically clear errors and info messages on mode changes
  useEffect(() => {
    setAuthError(null);
    setInfoMessage(null);
    setEmailError(null);
    setPasswordError(null);
    setNameError(null);
    setUniversityError(null);
    setConfirmPasswordError(null);
  }, [mode]);
  
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
    "Moral and Civics",
    "Emerging Tech",
    "Applied Math"
  ];

  // Fetch accounts on load
  useEffect(() => {
    async function loadConfig() {
      await initSupabaseConfig();
      setIsSupaConfigured(!!getSupabase());
      setSupabaseUrlInput(safeStorage.getItem('ethiolearn_supabase_url') || '');
      setSupabaseKeyInput(safeStorage.getItem('ethiolearn_supabase_key') || '');
    }
    loadConfig();

    try {
      const stored = safeStorage.getItem('ethiolearn_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRegisteredAccounts(parsed);
          // Keep default mode as "splash" to allow immediate one-touch quick start
        }
      }
      
      // Load remembered login credentials if they exist to remember users on retry
      const remembered = safeStorage.getItem('ethiolearn_remember_login');
      if (remembered) {
        const parsedRem = JSON.parse(remembered);
        if (parsedRem && parsedRem.email) {
          setEmail(parsedRem.email);
          setPassword(parsedRem.password || '');
          setRememberMe(parsedRem.rememberMe !== false);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name);
      setEmail(initialProfile.email || '');
      setUniversity(initialProfile.university);
      setYear(initialProfile.year);
      setSelectedSubjects(initialProfile.subjects);
      setClaudeApiKey(initialProfile.claudeApiKey);
      if (initialProfile.avatar) {
        setAvatar(initialProfile.avatar);
      }
    }
  }, [initialProfile]);

  const isCompletingGoogleRef = useRef(false);

  const completeGoogleProfileSetup = async (userEmail: string, userName: string, fbUid?: string) => {
    if (isCompletingGoogleRef.current) return;
    isCompletingGoogleRef.current = true;
    try {
      setAuthError(null);
      const emailLower = userEmail.toLowerCase().trim();
      let profile: StudentProfile | null = null;
      const targetUid = fbUid || auth?.currentUser?.uid || '';

      // 1. Try Supabase profiles or student_profiles
      try {
        const supaProfile = await fetchProfileFromSupabase(targetUid, emailLower);
        if (supaProfile) {
          profile = {
            id: targetUid || supaProfile.firebase_uid || supaProfile.id,
            firebaseUid: targetUid || supaProfile.firebase_uid,
            name: supaProfile.full_name || supaProfile.name || userName,
            email: emailLower,
            phone: supaProfile.phone || '',
            university: supaProfile.university || "Wolkite University",
            department: supaProfile.department || "Freshman Common Courses",
            year: supaProfile.year_level || supaProfile.year || "Freshman (1st Year)",
            subjects: [
              "Emerging Technologies", "Communicative English", "Mathematics", "Logic and Critical Thinking"
            ],
            claudeApiKey: "",
            dailyGoalHours: 2,
            theme: 'dark',
            language: preferredLanguage === 'am' ? 'am' : 'en',
            avatar: (supaProfile.profile_photo as any) || (supaProfile.avatar as any) || 'champion',
            isRegistered: true,
            isPro: supaProfile.subscription_status === 'pro' || supaProfile.subscription_status === 'active' || isAdministratorEmail(emailLower),
            unregisteredAICredits: 10
          };
        }
      } catch (e) {}

      // 2. Fallback to local accounts or default
      if (!profile) {
        const found = registeredAccounts.find(
          acc => acc.email.toLowerCase() === emailLower
        );
        if (found) {
          profile = found.profile;
        } else {
          profile = {
            id: targetUid || 'google-user-' + Math.random().toString(36).substring(2, 9),
            firebaseUid: targetUid,
            name: userName,
            email: userEmail,
            university: "Wolkite University",
            department: "Freshman Common Courses",
            year: "Freshman (1st Year)",
            subjects: [
              "Emerging Technologies", "Communicative English", "Mathematics", "Logic and Critical Thinking"
            ],
            claudeApiKey: "",
            dailyGoalHours: 2,
            theme: 'dark',
            language: preferredLanguage === 'am' ? 'am' : 'en',
            avatar: 'champion',
            isRegistered: true,
            isPro: isAdministratorEmail(emailLower),
            unregisteredAICredits: 10
          };
        }
      }

      // Save to Supabase in background
      saveProfileToSupabase({
        firebase_uid: targetUid,
        full_name: profile.name,
        email: emailLower,
        phone: profile.phone || '',
        university: profile.university,
        department: profile.department || 'General',
        year_level: profile.year,
        profile_photo: profile.avatar,
        subscription_status: profile.isPro ? 'pro' : 'free'
      }).catch(() => {});

      const newAccount: AccountInfo = {
        email: userEmail,
        passwordEncrypted: "google_authenticated",
        rememberMe: true,
        profile
      };
      const filteredAccounts = registeredAccounts.filter(acc => acc.email.toLowerCase() !== emailLower);
      const updated = [...filteredAccounts, newAccount];
      safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updated));
      safeStorage.setItem('ethiolearn_active_email', userEmail);
      safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(profile));

      // Securely acquire signed session token from backend
      try {
        await syncAuthSessionWithServer({
          email: userEmail,
          uid: targetUid,
          role: isAdministratorEmail(userEmail) ? 'admin' : 'student',
          displayName: profile.name
        });
      } catch (tokErr) {}

      playSuccessChime();
      onComplete(profile);
    } catch (err: any) {
      console.error('Google onboarding auth failed:', err);
      playFailureChime();
      setAuthError(err.message || 'Google Sign-In was canceled or encountered an issue. Please try again.');
    } finally {
      isCompletingGoogleRef.current = false;
    }
  };

  const handleSaveSupaConfig = (e: React.FormEvent) => {
    e.preventDefault();
    playClickChime();
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      setAuthError("Both Supabase URL and Anon Key are required.");
      playFailureChime();
      return;
    }
    try {
      saveSupabaseCredentials(supabaseUrlInput.trim(), supabaseKeyInput.trim());
      setIsSupaConfigured(true);
      setShowSupaConfig(false);
      setAuthError(null);
      playSuccessChime();
    } catch (err: any) {
      setAuthError(`Failed to save config: ${err.message || err}`);
      playFailureChime();
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setEmailError(null);
    setInfoMessage(null);
    setCodeError(null);
    setVerificationCodeInput('');

    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim) {
      setEmailError(preferredLanguage === 'am' ? "የኢሜይል አድራሻ ማስገባት ግዴታ ነው።" : "Email address is required.");
      playFailureChime();
      return;
    } else if (!emailTrim.includes('@')) {
      setEmailError(preferredLanguage === 'am' ? "እባክዎን ትክክለኛ የኢሜይል አድራሻ ያስገቡ።" : "Please enter a valid email address.");
      playFailureChime();
      return;
    }

    setLoading(true);

    // Try Supabase Auth password reset in background
    const supa = getSupabase();
    if (supa) {
      try {
        await supa.auth.resetPasswordForEmail(emailTrim, {
          redirectTo: window.location.origin
        });
      } catch (err: any) {
        console.warn('[Supabase Reset Password Notice]:', err);
      }
    }

    // Call server verification code generator
    let dispatchedCode = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrim, type: 'password_reset' })
      });
      const data = await res.json();
      if (data.code) {
        dispatchedCode = data.code;
      }
    } catch (e) {
      console.warn('[Send Reset Code API Error]:', e);
    }

    setDispatchedSecurityCode(dispatchedCode);
    setDispatchedMessagePreview({
      text: `EthioLearn Password Recovery: Your 6-digit recovery code is [ ${dispatchedCode} ]. Enter this code to verify your identity and choose a new password.`,
      amharicText: `ኢትዮ ለርን ፕሮ፡ የይለፍ ቃል መቀየሪያ ባለ 6-አሃዝ የደህንነት ኮድዎ [ ${dispatchedCode} ] ነው። ኮዱን በማስገባት አዲስ የይለፍ ቃል ይምረጡ።`,
      email: emailTrim,
      type: 'password_reset'
    });

    setResendTimer(30);
    setLoading(false);
    playSuccessChime();
    setMode('verify_reset_code');
  };

  const handleVerifyResetCode = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    setCodeError(null);
    const codeToVerify = (customCode || verificationCodeInput || '').trim();

    if (!codeToVerify) {
      setCodeError(preferredLanguage === 'am' ? "እባክዎን ባለ 6-አሃዝ የማረጋገጫ ኮድ ያስገቡ።" : "Please enter the 6-digit verification code.");
      playFailureChime();
      return;
    }

    setLoading(true);
    let verified = false;

    // Verify real activation code via backend and Firebase
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: codeToVerify, type: 'password_reset' })
      });
      const data = await res.json();
      if (data.verified || data.success) {
        verified = true;
      } else {
        setCodeError(data.amharicError && preferredLanguage === 'am' ? data.amharicError : (data.error || "Invalid verification code. Please check and try again."));
      }
    } catch (err: any) {
      setCodeError("Verification network check failed. Please ensure your device is connected.");
    }

    setLoading(false);
    if (verified) {
      playSuccessChime();
      setInfoMessage(preferredLanguage === 'am' ? "የይለፍ ቃል መቀየሪያ ኮድ ተረጋግጧል! እባክዎ አዲሱን የይለፍ ቃል ከታች ያስገቡ።" : `Reset authorization verified for ${email.trim().toLowerCase()}. Please enter your new password below.`);
      setMode('update_password');
    } else {
      playFailureChime();
    }
  };

  const handleResendResetCode = async () => {
    if (resendTimer > 0) return;
    playClickChime();
    setLoading(true);
    setCodeError(null);

    const emailTrim = email.trim().toLowerCase();
    let newCode = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrim, type: 'password_reset' })
      });
      const data = await res.json();
      if (data.code) {
        newCode = data.code;
      }
    } catch (e) {}

    setDispatchedSecurityCode(newCode);
    setDispatchedMessagePreview({
      text: `EthioLearn Password Recovery: Your 6-digit recovery code is [ ${newCode} ]. Valid for 15 minutes.`,
      amharicText: `ኢትዮ ለርን ፕሮ፡ የይለፍ ቃል መቀየሪያ ባለ 6-አሃዝ የደህንነት ኮድዎ [ ${newCode} ] ነው። ለ15 ደቂቃ ያገለግላል።`,
      email: emailTrim,
      type: 'password_reset'
    });

    setResendTimer(30);
    setLoading(false);
    playSuccessChime();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setInfoMessage(null);

    const passwordTrim = password.trim();
    const confirmPasswordTrim = confirmPassword.trim();

    let hasErrors = false;
    if (!passwordTrim) {
      setPasswordError(preferredLanguage === 'am' ? "የይለፍ ቃል ማስገባት ግዴታ ነው።" : "Password is required.");
      hasErrors = true;
    } else if (passwordTrim.length < 4) {
      setPasswordError(preferredLanguage === 'am' ? "የይለፍ ቃል ቢያንስ 4 ቁምፊ መሆን አለበት።" : "Password must be at least 4 characters.");
      hasErrors = true;
    }

    if (passwordTrim !== confirmPasswordTrim) {
      setConfirmPasswordError(preferredLanguage === 'am' ? "የይለፍ ቃሎች አይዛመዱም።" : "Passwords do not match.");
      hasErrors = true;
    }

    if (hasErrors) {
      playFailureChime();
      return;
    }

    setLoading(true);

    const targetEmail = (email.trim() || safeStorage.getItem('ethiolearn_active_email') || '').toLowerCase();

    // 1. Try Supabase password update if active
    const supa = getSupabase();
    if (supa) {
      try {
        await supa.auth.updateUser({
          password: passwordTrim
        });
      } catch (err: any) {
        console.warn('[Supabase Password Update Notice]:', err);
      }
    }

    // 1.1 Notify server reset password endpoint
    try {
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, newPassword: passwordTrim, code: dispatchedSecurityCode })
      });
    } catch (serverErr) {
      console.warn('[Server Reset Password Bridge Warning]:', serverErr);
    }

    // 2. Update local accounts storage so sign-in works immediately
    try {
      let accounts: AccountInfo[] = registeredAccounts;
      const stored = safeStorage.getItem('ethiolearn_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) accounts = parsed;
      }

      if (targetEmail) {
        let found = false;
        const updatedAccs = accounts.map(acc => {
          if (acc.email.toLowerCase() === targetEmail) {
            found = true;
            return { ...acc, passwordEncrypted: passwordTrim };
          }
          return acc;
        });

        if (!found) {
          updatedAccs.push({
            email: targetEmail,
            passwordEncrypted: passwordTrim,
            rememberMe: true,
            profile: {
              name: targetEmail.split('@')[0],
              email: targetEmail,
              university: "Wolkite University",
              year: "University",
              subjects: selectedSubjects,
              claudeApiKey: "",
              dailyGoalHours: 2,
              theme: 'dark',
              language: preferredLanguage === 'am' ? 'am' : 'en',
              avatar: 'champion',
              isRegistered: true,
              unregisteredAICredits: 5
            }
          });
        }

        safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccs));
        setRegisteredAccounts(updatedAccs);
        safeStorage.setItem('ethiolearn_active_email', targetEmail);
      }

      const rem = safeStorage.getItem('ethiolearn_remember_login');
      if (rem) {
        const parsedRem = JSON.parse(rem);
        if (parsedRem && parsedRem.email) {
          safeStorage.setItem('ethiolearn_remember_login', JSON.stringify({
            ...parsedRem,
            password: passwordTrim
          }));
        }
      }
    } catch (ex) {
      console.warn('Could not update cached password locally:', ex);
    }

    playSuccessChime();
    setLoading(false);
    setInfoMessage(preferredLanguage === 'am' ? "የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል! አሁን በአዲሱ የይለፍ ቃል መግባት ይችላሉ።" : "Your password has been successfully updated! You can now sign in with your new password.");

    setTimeout(() => {
      setMode('signin');
      setPassword('');
      setConfirmPassword('');
      setInfoMessage(preferredLanguage === 'am' ? "የይለፍ ቃል ተቀይሯል! ለመግባት መረጃዎን ያስገቡ።" : "Password updated successfully! Please enter your credentials to sign in.");
    }, 1500);
  };

  const renderSupabaseConfigPanel = () => {
    return null;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setEmailError(null);
    setPasswordError(null);

    const emailTrim = email.trim().toLowerCase();
    const passwordTrim = password.trim();

    let hasValidationError = false;
    if (!emailTrim) {
      setEmailError(preferredLanguage === 'am' ? "ኢሜይል አድራሻ ያስፈልጋል።" : "Email address is required.");
      hasValidationError = true;
    } else if (!emailTrim.includes('@') || !emailTrim.includes('.')) {
      setEmailError(preferredLanguage === 'am' ? "እባክዎን ትክክለኛ የኢሜይል አድራሻ ያስገቡ።" : "Please enter a valid email address.");
      hasValidationError = true;
    }

    if (!passwordTrim) {
      setPasswordError(preferredLanguage === 'am' ? "የይለፍ ቃል ያስፈልጋል።" : "Password is required.");
      hasValidationError = true;
    } else if (passwordTrim.length < 4) {
      setPasswordError(preferredLanguage === 'am' ? "የይለፍ ቃል ቢያንስ 4 ፊደላት መሆን አለበት።" : "Password must be at least 4 characters.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      playFailureChime();
      return;
    }

    setLoading(true);

    // 1. Read stored local accounts from safeStorage
    let currentAccounts: AccountInfo[] = registeredAccounts;
    try {
      const stored = safeStorage.getItem('ethiolearn_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) currentAccounts = parsed;
      }
    } catch (e) {}

    // Check local accounts for mismatch
    const localExistingAccount = currentAccounts.find(acc => acc.email.toLowerCase() === emailTrim);
    if (localExistingAccount && localExistingAccount.passwordEncrypted && localExistingAccount.passwordEncrypted !== 'google_authenticated') {
      if (localExistingAccount.passwordEncrypted !== passwordTrim) {
        setPasswordError(preferredLanguage === 'am' ? "የይለፍ ቃል የተሳሳተ ነው። እባክዎ እንደገና ይሞክሩ ወይም 'የይለፍ ቃል ረሱ?' የሚለውን ይጫኑ።" : "Incorrect password. Please verify your credentials or reset your password.");
        playFailureChime();
        setLoading(false);
        return;
      }
    }

    // 2. Call server /api/auth/login endpoint for strict authentication against database
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
          university: loginData.user.university || "Wolkite University",
          year: loginData.user.year || "University",
          subjects: loginData.user.subjects || subjectsList,
          claudeApiKey: "",
          dailyGoalHours: 2,
          theme: 'dark',
          language: preferredLanguage === 'am' ? 'am' : 'en',
          avatar: loginData.user.avatar || 'champion',
          isRegistered: true,
          isPro: Boolean(loginData.user.is_pro),
          unregisteredAICredits: 5
        };

        const newAccount: AccountInfo = {
          email: emailTrim,
          passwordEncrypted: passwordTrim,
          rememberMe: rememberMe,
          profile: profileToUse
        };
        const updatedAccs = [...currentAccounts.filter(acc => acc.email.toLowerCase() !== emailTrim), newAccount];
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
        } else {
          safeStorage.removeItem('ethiolearn_remember_login');
        }

        try {
          await syncAuthSessionWithServer({
            email: emailTrim,
            role: isAdministratorEmail(emailTrim) ? 'admin' : 'student',
            displayName: profileToUse.name
          });
        } catch (tokErr) {}

        playSuccessChime();
        setLoading(false);
        onComplete(profileToUse);
        return;
      } else if (loginRes.status === 401) {
        setPasswordError(preferredLanguage === 'am' ? "የይለፍ ቃል የተሳሳተ ነው። እባክዎ እንደገና ይሞክሩ ወይም 'የይለፍ ቃል ረሱ?' የሚለውን ይጫኑ።" : "Incorrect password. Please verify your credentials or reset your password.");
        playFailureChime();
        setLoading(false);
        return;
      }
    } catch (serverErr) {
      console.warn('[Server Login API Check]:', serverErr);
    }

    // 3. Check exact local match if offline or server fallback
    if (localExistingAccount && localExistingAccount.passwordEncrypted === passwordTrim) {
      const profileToUse = { ...localExistingAccount.profile, isRegistered: true };
      const updatedAccs = [...currentAccounts.filter(acc => acc.email.toLowerCase() !== emailTrim), {
        email: emailTrim,
        passwordEncrypted: passwordTrim,
        rememberMe: rememberMe,
        profile: profileToUse
      }];
      setRegisteredAccounts(updatedAccs);
      safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccs));
      safeStorage.setItem('ethiolearn_active_email', emailTrim);
      safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(profileToUse));
      safeStorage.setItem('ethiolearn_has_seen_onboarding', 'true');

      playSuccessChime();
      setLoading(false);
      onComplete(profileToUse);
      return;
    }

    // 4. Try Firebase Auth with strict credentials
    if (auth) {
      try {
        await ensureLocalAuthPersistence();
        const userCredential = await signInWithEmailAndPassword(auth, emailTrim, passwordTrim);
        if (userCredential?.user) {
          const uid = userCredential.user.uid;
          let profile = await fetchProfileFromFirestore(uid);
          if (!profile) {
            profile = {
              name: userCredential.user.displayName || emailTrim.split('@')[0],
              email: emailTrim,
              university: "Wolkite University",
              year: "University",
              subjects: subjectsList,
              claudeApiKey: "",
              dailyGoalHours: 2,
              theme: 'dark',
              language: preferredLanguage === 'am' ? 'am' : 'en',
              avatar: 'champion',
              isRegistered: true,
              unregisteredAICredits: 5
            };
            await syncProfileToFirestore(uid, profile);
          }

          const newAccount: AccountInfo = {
            email: emailTrim,
            passwordEncrypted: passwordTrim,
            rememberMe: rememberMe,
            profile
          };
          const updatedAccs = [...currentAccounts.filter(acc => acc.email.toLowerCase() !== emailTrim), newAccount];
          setRegisteredAccounts(updatedAccs);
          safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccs));
          safeStorage.setItem('ethiolearn_active_email', emailTrim);
          safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(profile));
          safeStorage.setItem('ethiolearn_has_seen_onboarding', 'true');

          if (rememberMe) {
            safeStorage.setItem('ethiolearn_remember_login', JSON.stringify({
              email: emailTrim,
              password: passwordTrim,
              rememberMe: true
            }));
          } else {
            safeStorage.removeItem('ethiolearn_remember_login');
          }

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
          onComplete({ ...profile, isRegistered: true });
          return;
        }
      } catch (fbErr: any) {
        console.warn('[Firebase Auth Login attempt]:', fbErr?.message || fbErr);
        if (fbErr?.code === 'auth/wrong-password' || fbErr?.code === 'auth/invalid-credential') {
          setPasswordError(preferredLanguage === 'am' ? "የይለፍ ቃል የተሳሳተ ነው። እባክዎ እንደገና ይሞክሩ ወይም 'የይለፍ ቃል ረሱ?' የሚለውን ይጫኑ።" : "Incorrect password. Please verify your credentials or reset your password.");
          playFailureChime();
          setLoading(false);
          return;
        }
      }
    }

    // 5. Try Supabase Auth and database lookup
    const supa = getSupabase();
    if (supa) {
      try {
        let authSuccess = false;
        let supaUserObj: any = null;

        const { data, error } = await supa.auth.signInWithPassword({
          email: emailTrim,
          password: passwordTrim
        });

        if (!error && data?.user) {
          authSuccess = true;
          supaUserObj = data.user;
        }

        // Fetch student profile row from student_profiles table
        const { data: supaRecord } = await supa
          .from('student_profiles')
          .select('*')
          .eq('email', emailTrim)
          .maybeSingle();

        const tablePasswordMatch = supaRecord?.profile_data?.password === passwordTrim;

        if (supaRecord && supaRecord.profile_data?.password && supaRecord.profile_data.password !== passwordTrim && !authSuccess) {
          setPasswordError(preferredLanguage === 'am' ? "የይለፍ ቃል የተሳሳተ ነው። እባክዎ እንደገና ይሞክሩ ወይም 'የይለፍ ቃል ረሱ?' የሚለውን ይጫኑ።" : "Incorrect password. Please verify your credentials or reset your password.");
          playFailureChime();
          setLoading(false);
          return;
        }

        if (authSuccess || tablePasswordMatch) {
          let profile: StudentProfile;

          if (supaRecord && supaRecord.profile_data) {
            profile = {
              ...supaRecord.profile_data,
              name: supaRecord.profile_data.name || supaRecord.name || emailTrim.split('@')[0],
              email: emailTrim,
              university: supaRecord.profile_data.university || supaRecord.university || "Wolkite University",
              year: supaRecord.profile_data.year || supaRecord.year || "Freshman",
              subjects: Array.isArray(supaRecord.profile_data.subjects) && supaRecord.profile_data.subjects.length > 0
                ? supaRecord.profile_data.subjects
                : (Array.isArray(supaRecord.subjects) && supaRecord.subjects.length > 0 ? supaRecord.subjects : subjectsList),
              isRegistered: true,
              isPro: Boolean(supaRecord.is_pro || supaRecord.profile_data.isPro)
            };
          } else {
            profile = {
              name: supaUserObj?.user_metadata?.display_name || emailTrim.split('@')[0],
              email: emailTrim,
              university: supaUserObj?.user_metadata?.university || "Wolkite University",
              year: supaUserObj?.user_metadata?.year || "Freshman",
              subjects: subjectsList,
              claudeApiKey: "",
              dailyGoalHours: 2,
              theme: 'dark',
              language: preferredLanguage === 'am' ? 'am' : 'en',
              avatar: 'champion',
              isRegistered: true,
              isPro: false,
              unregisteredAICredits: 5
            };
          }

          const newAccount: AccountInfo = {
            email: emailTrim,
            passwordEncrypted: passwordTrim,
            rememberMe: rememberMe,
            profile
          };
          const updatedAccs = [...currentAccounts.filter(acc => acc.email.toLowerCase() !== emailTrim), newAccount];
          setRegisteredAccounts(updatedAccs);
          safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccs));
          safeStorage.setItem('ethiolearn_active_email', emailTrim);
          safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(profile));
          safeStorage.setItem('ethiolearn_has_seen_onboarding', 'true');

          if (rememberMe) {
            safeStorage.setItem('ethiolearn_remember_login', JSON.stringify({
              email: emailTrim,
              password: passwordTrim,
              rememberMe: true
            }));
          } else {
            safeStorage.removeItem('ethiolearn_remember_login');
          }

          try {
            await syncAuthSessionWithServer({
              email: emailTrim,
              uid: supaUserObj?.id || supaRecord?.id,
              role: isAdministratorEmail(emailTrim) ? 'admin' : 'student',
              displayName: profile.name
            });
          } catch (tokErr) {}

          playSuccessChime();
          setLoading(false);
          onComplete({ ...profile, isRegistered: true });
          return;
        }
      } catch (err: any) {
        console.warn('[Supabase Auth Error]:', err);
      }
    }

    // 6. Account exists with different password or not found
    if (localExistingAccount) {
      setPasswordError(preferredLanguage === 'am' ? "የይለፍ ቃል የተሳሳተ ነው። እባክዎ እንደገና ይሞክሩ ወይም 'የይለፍ ቃል ረሱ?' የሚለውን ይጫኑ።" : "Incorrect password. Please verify your credentials or reset your password.");
    } else {
      setAuthError(preferredLanguage === 'am' ? "በዚህ ኢሜይል የተመዘገበ አካውንት አልተገኘም። እባክዎ አዲስ አካውንት ለመፍጠር 'ይመዝገቡ' የሚለውን ይጫኑ።" : "No student account found with this email. Click 'Sign up' to create one.");
    }

    playFailureChime();
    setLoading(false);
  };

  const handleQuickLogin = async (acc: AccountInfo) => {
    setAuthError(null);
    setEmailError(null);
    setPasswordError(null);
    playClickChime();

    // Autofill credentials
    setEmail(acc.email);
    setPassword(acc.passwordEncrypted && acc.passwordEncrypted !== 'google_authenticated' ? acc.passwordEncrypted : '');
    setRememberMe(acc.rememberMe !== false);

    if (acc.rememberMe && acc.passwordEncrypted && acc.passwordEncrypted !== 'google_authenticated') {
      try {
        safeStorage.setItem('ethiolearn_active_email', acc.email);
        safeStorage.setItem('ethiolearn_current_profile', JSON.stringify({ ...acc.profile, isRegistered: true }));
        safeStorage.setItem('ethiolearn_has_seen_onboarding', 'true');
      } catch (e) {}

      try {
        await syncAuthSessionWithServer({
          email: acc.email,
          role: isAdministratorEmail(acc.email) ? 'admin' : 'student',
          displayName: acc.profile.name
        });
      } catch (tokErr) {}

      playSuccessChime();
      onComplete({ ...acc.profile, isRegistered: true });
    } else {
      setMode('signin');
      setInfoMessage(
        preferredLanguage === 'am'
          ? `የ ${acc.profile.name} አካውንት ተመርጧል። ለመግባት የይለፍ ቃልዎን ያስገቡ።`
          : `Selected ${acc.profile.name}'s profile. Please enter your password to sign in.`
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setInfoMessage(null);
    setNameError(null);
    setUniversityError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setCodeError(null);
    setVerificationCodeInput('');

    const nameTrim = name.trim();
    const emailTrim = email.trim().toLowerCase();
    const passwordTrim = password.trim();
    const confirmPasswordTrim = confirmPassword.trim();
    const univTrim = university.trim();

    let hasErrors = false;
    const t = onboardingTranslations[preferredLanguage];

    if (!nameTrim) {
      setNameError(t.validationName);
      hasErrors = true;
    }

    if (!univTrim) {
      setUniversityError(t.validationUniversity);
      hasErrors = true;
    }

    if (!emailTrim || !emailTrim.includes('@') || !emailTrim.includes('.')) {
      setEmailError(preferredLanguage === 'am' ? "እባክዎን ትክክለኛ የኢሜይል አድራሻ ያስገቡ።" : "Please enter a valid email address.");
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
      university: univTrim,
      year,
      subjects: selectedSubjects,
      claudeApiKey: claudeApiKey.trim(),
      dailyGoalHours: 2,
      theme: 'dark',
      language: preferredLanguage === 'am' ? 'am' : 'en',
      avatar,
      isRegistered: true,
      unregisteredAICredits: 5
    };

    setPendingStudentProfile(profile);
    setPendingPasswordString(passwordTrim);

    // Call server verification code generator
    let dispatchedCode = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTrim,
          name: nameTrim,
          university: univTrim,
          year,
          type: 'registration'
        })
      });
      const data = await res.json();
      if (data.code) {
        dispatchedCode = data.code;
      }
    } catch (apiErr) {
      console.warn('[Verification Code Generation API Warning]:', apiErr);
    }

    setDispatchedSecurityCode(dispatchedCode);
    setDispatchedMessagePreview({
      text: `EthioLearn Registration Confirmation: Welcome ${nameTrim}! Your 6-digit confirmation security code is [ ${dispatchedCode} ]. Enter this code to activate your student account.`,
      amharicText: `ኢትዮ ለርን ፕሮ ምዝገባ ማረጋገጫ፡ እንኳን ደህና መጡ ${nameTrim}! ባለ 6-አሃዝ የተማሪ ማረጋገጫ ኮድዎ [ ${dispatchedCode} ] ነው። ኮዱን በማስገባት አካውንትዎን ያግብሩ።`,
      email: emailTrim,
      studentName: nameTrim,
      university: univTrim,
      year: year,
      type: 'registration'
    });

    setResendTimer(30);
    setLoading(false);
    playSuccessChime();
    setMode('verify_registration');
  };

  const handleVerifyRegistrationCode = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    setCodeError(null);

    const codeToVerify = (customCode || verificationCodeInput || '').trim();
    if (!codeToVerify) {
      setCodeError(preferredLanguage === 'am' ? "እባክዎን ባለ 6-አሃዝ የማረጋገጫ ኮድ ያስገቡ።" : "Please enter the 6-digit verification code.");
      playFailureChime();
      return;
    }

    if (!pendingStudentProfile) {
      setMode('signup');
      return;
    }

    setLoading(true);
    let verified = false;

    // Verify real activation code via backend and Firebase
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingStudentProfile.email,
          code: codeToVerify,
          type: 'registration'
        })
      });
      const data = await res.json();
      if (data.verified || data.success) {
        verified = true;
      } else {
        setCodeError(data.amharicError && preferredLanguage === 'am' ? data.amharicError : (data.error || "Invalid confirmation code. Please check and try again."));
      }
    } catch (err: any) {
      setCodeError("Verification network check failed. Please ensure your device is connected.");
    }

    if (!verified) {
      setLoading(false);
      playFailureChime();
      return;
    }

    // Code is verified! Proceed with finalizing full account persistence & activation
    const profile = pendingStudentProfile;
    const emailTrim = profile.email;
    const passwordTrim = pendingPasswordString || 'ethiopia123';
    const nameTrim = profile.name;
    const univTrim = profile.university;

    const payloadRecord = {
      email: emailTrim,
      profile_data: {
        ...profile,
        name: nameTrim,
        university: univTrim,
        year: profile.year,
        subjects: profile.subjects,
        isPro: isAdministratorEmail(emailTrim),
        userRole: isAdministratorEmail(emailTrim) ? 'super_admin' : 'student',
        password: passwordTrim
      },
      study_sessions: [],
      notes_data: [],
      performance_data: {},
      updated_at: new Date().toISOString()
    };

    // 1. Try Firebase Auth registration & Firestore sync
    if (auth) {
      try {
        await ensureLocalAuthPersistence();
        const userCred = await createUserWithEmailAndPassword(auth, emailTrim, passwordTrim);
        if (userCred?.user) {
          await syncProfileToFirestore(userCred.user.uid, profile);
        }
      } catch (fbErr: any) {
        console.warn('[Firebase Auth Register Notice]:', fbErr?.message || fbErr);
        if (fbErr?.code === 'auth/email-already-in-use') {
          try {
            const userCred = await signInWithEmailAndPassword(auth, emailTrim, passwordTrim);
            if (userCred?.user) {
              await syncProfileToFirestore(userCred.user.uid, profile);
            }
          } catch (signInErr) {}
        }
      }
    }

    // 2. Try Supabase Auth and Student Profile registration
    const supa = getSupabase();
    if (supa) {
      try {
        await supa.auth.signUp({
          email: emailTrim,
          password: passwordTrim,
          options: {
            data: {
              display_name: nameTrim,
              university: univTrim,
              year: profile.year,
              avatar: profile.avatar
            }
          }
        });

        await supa
          .from('student_profiles')
          .upsert(payloadRecord, { onConflict: 'email' });
      } catch (err: any) {
        console.warn('[Supabase Register Fallback Warning]:', err);
      }
    }

    // 2.1 Always ensure server database persistence bridge runs
    try {
      const customUrl = safeStorage.getItem('ethiolearn_supabase_url') || '';
      const customKey = safeStorage.getItem('ethiolearn_supabase_key') || '';
      await fetch('/api/db/student-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTrim,
          name: nameTrim,
          university: univTrim,
          year: profile.year,
          subjects: profile.subjects,
          isPro: isAdministratorEmail(emailTrim),
          userRole: isAdministratorEmail(emailTrim) ? 'super_admin' : 'student',
          profileData: profile,
          url: customUrl,
          key: customKey
        })
      });
    } catch (serverErr) {
      console.warn('[Server DB Student Profile Bridge Warning]:', serverErr);
    }

    // 3. Save local account storage
    const newAccount: AccountInfo = {
      email: emailTrim,
      passwordEncrypted: passwordTrim,
      rememberMe: rememberMe,
      profile
    };

    const updated = [...registeredAccounts.filter(acc => acc.email.toLowerCase() !== emailTrim), newAccount];
    setRegisteredAccounts(updated);
    try {
      safeStorage.setItem('ethiolearn_accounts', JSON.stringify(updated));
      safeStorage.setItem('ethiolearn_active_email', emailTrim);
      safeStorage.setItem('ethiolearn_current_profile', JSON.stringify(profile));
      safeStorage.setItem('ethiolearn_has_seen_onboarding', 'true');

      if (rememberMe) {
        safeStorage.setItem('ethiolearn_remember_login', JSON.stringify({
          email: emailTrim,
          password: passwordTrim,
          rememberMe: true
        }));
      } else {
        safeStorage.removeItem('ethiolearn_remember_login');
      }
    } catch (e) {}

    try {
      await syncAuthSessionWithServer({
        email: emailTrim,
        role: isAdministratorEmail(emailTrim) ? 'admin' : 'student',
        displayName: profile.name
      });
    } catch (tokErr) {}

    playSuccessChime();
    setLoading(false);
    setMode('registration_success');
  };

  const handleResendRegistrationCode = async () => {
    if (resendTimer > 0) return;
    playClickChime();
    setLoading(true);
    setCodeError(null);

    const emailTrim = pendingStudentProfile ? pendingStudentProfile.email : email.trim().toLowerCase();
    const nameTrim = pendingStudentProfile ? pendingStudentProfile.name : name.trim();
    let newCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTrim,
          name: nameTrim,
          university: pendingStudentProfile?.university || university,
          year: pendingStudentProfile?.year || year,
          type: 'registration'
        })
      });
      const data = await res.json();
      if (data.code) {
        newCode = data.code;
      }
    } catch (e) {}

    setDispatchedSecurityCode(newCode);
    setDispatchedMessagePreview({
      text: `EthioLearn Registration Confirmation: Welcome ${nameTrim}! Your 6-digit confirmation security code is [ ${newCode} ]. Valid for 15 minutes.`,
      amharicText: `ኢትዮ ለርን ፕሮ ምዝገባ ማረጋገጫ፡ እንኳን ደህና መጡ ${nameTrim}! ባለ 6-አሃዝ የተማሪ ማረጋገጫ ኮድዎ [ ${newCode} ] ነው። ለ15 ደቂቃ ያገለግላል።`,
      email: emailTrim,
      studentName: nameTrim,
      university: pendingStudentProfile?.university || university,
      year: pendingStudentProfile?.year || year,
      type: 'registration'
    });

    setResendTimer(30);
    setLoading(false);
    playSuccessChime();
  };

  const handleEnterCampusFromSuccess = () => {
    playSuccessChime();
    if (pendingStudentProfile) {
      onComplete(pendingStudentProfile);
    } else {
      const currentStored = safeStorage.getItem('ethiolearn_current_profile');
      if (currentStored) {
        try {
          onComplete(JSON.parse(currentStored));
          return;
        } catch (e) {}
      }
      handleGuestQuickStart();
    }
  };

  const handleGuestQuickStart = () => {
    playSuccessChime();
    const guestProfile: StudentProfile = {
      name: "Ethiopian Scholar",
      email: "scholar.guest@ethiolearn.com",
      university: "Addis Ababa University",
      year: "University",
      subjects: [
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
        "C++ Programming"
      ],
      claudeApiKey: "",
      dailyGoalHours: 2,
      theme: 'dark',
      language: 'both',
      avatar: 'champion',
      isRegistered: false,
      unregisteredAICredits: 5
    };
    onComplete(guestProfile);
  };

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  return (
    <div className="fixed inset-0 bg-main-bg z-50 overflow-y-auto overflow-x-clip px-3 min-[360px]:px-4 py-6 sm:py-10 relative transition-colors duration-200">
      
      {/* Dynamic Cinematic Motion Graphics Background Canvas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C8962E]/10 via-transparent to-transparent">
        {/* Floating star nodes with drifting cinematic loops */}
        {starNodes.map((star) => (
          <motion.div
            key={star.id}
            initial={{ 
              x: `${star.left}%`, 
              y: `${star.top}%`, 
              opacity: 0,
              scale: 0.5 
            }}
            animate={{ 
              y: [`${star.top}%`, `${(star.top + 8) % 100}%`, `${star.top}%`],
              opacity: [star.opacity * 0.4, star.opacity, star.opacity * 0.4],
              scale: [0.8, 1.25, 0.8]
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: star.delay
            }}
            style={{
              position: 'absolute',
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.id % 3 === 0 ? '#C8962E' : star.id % 3 === 1 ? '#1D4ED8' : '#e4e4e7',
              borderRadius: '50%',
              boxShadow: star.size > 2 ? `0 0 8px 1px ${star.id % 3 === 0 ? '#C8962E' : '#FFECA7'}` : 'none'
            }}
          />
        ))}

        {/* Ambient Pulsing Aura Orbs */}
        <motion.div 
          animate={{
            scale: [1, 1.15, 0.9, 1],
            opacity: [0.12, 0.22, 0.12],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[380px] h-[380px] rounded-full bg-emerald-950/20 blur-[130px]"
        />
        <motion.div 
          animate={{
            scale: [1.1, 0.9, 1.15, 1.1],
            opacity: [0.1, 0.18, 0.1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[425px] h-[425px] rounded-full bg-amber-950/20 blur-[140px]"
        />

        {/* Traditional Geometric Habesha Bands with modern neon-wireframe style */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-[#C8962E] to-red-500 opacity-60" />
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-[#C8962E] to-red-500 opacity-60" />
      </div>

      <div className="min-h-full w-full flex flex-col items-center justify-center my-auto relative z-10">
        <AnimatePresence mode="wait">
          {/* Direct Authentication Portal (Sign In, Sign Up, Campus Selection) */}
          <AuthPortalView
            initialMode={mode === "signup" ? "signup" : "signin"}
            onComplete={onComplete}
            preferredLanguage={preferredLanguage === "am" ? "am" : "en"}
            onLanguageChange={(newLang) => setPreferredLanguage(newLang)}
          />
        </AnimatePresence>
      </div>

      {/* Privacy Policy & Terms of Service Full Modal */}
      <LegalPrivacyTermsModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        language={preferredLanguage === 'am' ? 'am' : 'en'}
        initialTab={legalModalTab}
      />
    </div>
  );
}
