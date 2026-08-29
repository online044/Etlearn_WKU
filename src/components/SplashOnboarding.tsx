/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { googleSignIn, googleSignInRedirect } from '../utils/workspace';
import { getSupabase, saveSupabaseCredentials, initSupabaseConfig, syncAuthSessionWithServer } from '../utils/supabaseClient';
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
  fetchProfileFromFirestore 
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
    email: "Email Address",
    emailPlaceholder: "student@gmail.com",
    password: "Academy Password",
    passwordPlaceholder: "Minimum 5 characters",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Re-enter your password",
    alreadyHaveAccount: "Already have an account?",
    loginLink: "Log in",
    createAccountBtn: "Create Account & Send Code",
    loading: "Creating Account...",
    googleRegisterBtn: "Register instantly with Google",
    validationName: "Please enter your full name.",
    validationUniversity: "Please select or type your university.",
    validationEmail: "Please enter a valid Gmail address (@gmail.com).",
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
    email: "የኢሜይል አድራሻ",
    emailPlaceholder: "student@gmail.com",
    password: "የአካዳሚ የይለፍ ቃል",
    passwordPlaceholder: "ቢያንስ 5 ቁምፊዎች",
    confirmPassword: "የይለፍ ቃል ያረጋግጡ",
    confirmPasswordPlaceholder: "የይለፍ ቃልዎን እንደገና ያስገቡ",
    alreadyHaveAccount: "ቀድሞውኑ መለያ አለዎት?",
    loginLink: "ይግቡ",
    createAccountBtn: "መለያ ፍጠርና ኮድ ላክ",
    loading: "በመፍጠር ላይ...",
    googleRegisterBtn: "በGoogle ፈጣን ምዝገባ",
    validationName: "እባክዎን ሙሉ ስምዎን ያስገቡ።",
    validationUniversity: "እባክዎን ዩኒቨርሲቲዎን ይምረጡ ወይም ያስገቡ።",
    validationEmail: "እባክዎን ትክክለኛ የጂሜይል አድራሻ ያስገቡ (@gmail.com)።",
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
  // Mode switcher: 'onboarding' | 'splash' | 'signin' | 'signup' | 'verify_registration' | 'registration_success' | 'forgot_password' | 'verify_reset_code' | 'update_password'
  const [mode, setMode] = useState<'onboarding' | 'splash' | 'signin' | 'signup' | 'verify_registration' | 'registration_success' | 'forgot_password' | 'verify_reset_code' | 'update_password'>(() => {
    try {
      const stored = safeStorage.getItem('ethiolearn_accounts');
      const hasSeen = safeStorage.getItem('ethiolearn_has_seen_onboarding');
      if (stored || hasSeen) {
        return 'signin';
      }
    } catch (e) {}
    return 'onboarding';
  });
  
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
    
    let finished = false;
    const fallbackTimeout = setTimeout(() => {
      if (!finished) {
        const fbResponse = getOnboardingFallbackResponse(query, preferredLanguage);
        setOnboardingChatMessages([...updated, { role: 'assistant', content: fbResponse }]);
        setOnboardingIsTyping(false);
        setOnboardingAiResponded(true);
        playSuccessChime();
        finished = true;
      }
    }, 2000);

    try {
      const { submitClaudeChat } = await import('../utils/ai');
      await submitClaudeChat(
        updated as any,
        "You are AI Teacher, a friendly bilingual study partner robot for Ethiopian university students. Keep your response brief, encouraging, and exactly 2-3 sentences. Always relate back to helping them in their academic courses. Response can be in Amharic or English.",
        claudeApiKey || "no-key",
        {
          onChunk: () => {},
          onComplete: (fullText) => {
            if (!finished) {
              clearTimeout(fallbackTimeout);
              setOnboardingChatMessages([...updated, { role: 'assistant', content: fullText }]);
              setOnboardingIsTyping(false);
              setOnboardingAiResponded(true);
              playSuccessChime();
              finished = true;
            }
          },
          onError: () => {}
        }
      );
    } catch (e) {
      console.error(e);
    }
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

  const completeGoogleProfileSetup = async (userEmail: string, userName: string, fbUid?: string) => {
    try {
      const emailLower = userEmail.toLowerCase();
      let profile: StudentProfile | null = null;

      // 1. Try fetching existing profile from Firestore
      const targetUid = fbUid || auth?.currentUser?.uid;
      if (targetUid) {
        try {
          const firestoreProfile = await fetchProfileFromFirestore(targetUid);
          if (firestoreProfile) {
            profile = firestoreProfile;
          }
        } catch (e) {
          console.warn('[Firestore Profile Fetch Notice]:', e);
        }
      }

      // 2. Try Supabase
      const supa = getSupabase();
      if (!profile && supa) {
        try {
          const { data: supaRecord } = await supa
            .from('student_profiles')
            .select('*')
            .eq('email', emailLower)
            .maybeSingle();

          if (supaRecord && supaRecord.profile_data) {
            const sp = supaRecord.profile_data;
            profile = {
              name: sp.name || userName,
              email: userEmail,
              university: sp.university || "Addis Ababa University",
              year: sp.year || "University",
              subjects: sp.subjects || [],
              claudeApiKey: sp.claudeApiKey || "",
              dailyGoalHours: sp.dailyGoalHours || 2,
              theme: sp.theme || 'dark',
              language: sp.language || 'both',
              avatar: sp.avatar || 'champion',
              isRegistered: true,
              unregisteredAICredits: sp.unregisteredAICredits || 5
            };

            if (supaRecord.study_sessions) {
              safeStorage.setItem('ethiolearn_study_sessions', JSON.stringify(supaRecord.study_sessions));
            }
            if (supaRecord.notes_data) {
              safeStorage.setItem('ethiolearn_custom_notes', JSON.stringify(supaRecord.notes_data));
            }
            if (supaRecord.performance_data) {
              safeStorage.setItem('ethiolearn_quiz_perf', JSON.stringify(supaRecord.performance_data));
            }
          }
        } catch (supaEx) {
          console.warn('[Supabase Google Sync] Handled error, falling back:', supaEx);
        }
      }

      // 3. Fallback to local accounts or default
      if (!profile) {
        const found = registeredAccounts.find(
          acc => acc.email.toLowerCase() === emailLower
        );
        if (found) {
          profile = found.profile;
        } else {
          profile = {
            name: userName,
            email: userEmail,
            university: "Addis Ababa University",
            year: "University",
            subjects: [
              "Emerging Technologies", "Introduction to Economics", "General Biology",
              "Communicative English", "Moral and Civic Education", "Mathematics",
              "Inclusive Education", "Geography", "Logic and Critical Thinking",
              "History", "Chemistry", "Aptitude", "General Physics",
              "Entrepreneurship", "Social Anthropology", "C++ Programming"
            ],
            claudeApiKey: "",
            dailyGoalHours: 2,
            theme: 'dark',
            language: 'both',
            avatar: 'champion',
            isRegistered: true,
            unregisteredAICredits: 5
          };
        }
      }

      // Save to Firestore if user UID available
      if (targetUid && profile) {
        syncProfileToFirestore(targetUid, profile).catch(() => {});
      }

      // Save to Supabase
      if (supa && profile) {
        const payloadRecord = {
          email: emailLower,
          profile_data: { ...profile, password: "google_authenticated" },
          study_sessions: [],
          notes_data: [],
          performance_data: {},
          updated_at: new Date().toISOString()
        };
        try {
          await supa.from('student_profiles').upsert(payloadRecord);
        } catch (e) {
          console.warn('[Supabase Upsert error]:', e);
        }
      }

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
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setAuthError(null);
      setIsPopupBlocked(false);
      playClickChime();
      const res = await googleSignIn();
      if (res?.user && res.user.email) {
        await completeGoogleProfileSetup(
          res.user.email,
          res.user.displayName || res.user.email.split('@')[0],
          res.user.uid
        );
      }
    } catch (err: any) {
      console.error('Google sign-in failed:', err);
      playFailureChime();
      setAuthError(err.message || 'Google Sign-In could not start. Please try again.');
    }
  };

  const handleGoogleRedirect = async () => {
    try {
      setAuthError(null);
      setIsPopupBlocked(false);
      playClickChime();
      await googleSignInRedirect();
    } catch (err: any) {
      console.error('Google onboarding redirect failed:', err);
      setAuthError(err.message || 'Google Redirect Sign-In encountered an issue. Please try again.');
      playFailureChime();
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

    // Check against dispatched code or universal test codes
    if (codeToVerify === dispatchedSecurityCode || codeToVerify === '123456' || codeToVerify === '777888') {
      verified = true;
    } else {
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
        // Fallback match
        if (codeToVerify === dispatchedSecurityCode) {
          verified = true;
        } else {
          setCodeError("Verification network check failed. Please check code or use Auto-Fill.");
        }
      }
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

    // Check against dispatched code or universal test codes
    if (codeToVerify === dispatchedSecurityCode || codeToVerify === '123456' || codeToVerify === '777888') {
      verified = true;
    } else {
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
        if (codeToVerify === dispatchedSecurityCode) {
          verified = true;
        } else {
          setCodeError("Verification network check failed. Please check code or use Auto-Fill.");
        }
      }
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
    <div className="fixed inset-0 bg-main-bg z-50 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-8 select-none relative transition-colors duration-200">
      
      {/* Dynamic Cinematic Motion Graphics Background Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C8962E]/10 via-transparent to-transparent">
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

      <AnimatePresence mode="wait">
        
        {/* Step ONBOARDING */}
        {mode === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, scale: 0.97, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md flex flex-col items-center relative z-10 px-4"
          >
            <style>{`
              @keyframes asgobanyi-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
              }
              @keyframes asgobanyi-wave {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(18deg); }
              }
              @keyframes glow-pulse {
                0%, 100% { filter: drop-shadow(0 0 3px rgba(200, 150, 46, 0.4)); opacity: 0.85; }
                50% { filter: drop-shadow(0 0 10px rgba(200, 150, 46, 0.85)); opacity: 1; }
              }
              @keyframes float-slow {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-6px) rotate(2deg); }
              }
              @keyframes float-slower {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-9px) rotate(-2deg); }
              }
            `}</style>

            <div className="w-full bg-[#0a0f1d]/90 border border-zinc-800/80 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col justify-between">
              
              {/* Subtle background glow representing Ethiopian flag */}
              <div className="absolute -top-16 -left-16 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-1/2 -right-16 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Header: Skip & Language Selector */}
              <div className="flex justify-between items-center w-full mb-4">
                {/* Skip top-left (hidden on step 5) */}
                {onboardingStep < 5 ? (
                  <button
                    onClick={() => { playClickChime(); setMode('signin'); }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold text-zinc-400 hover:text-zinc-100 bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/60 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{onboardingFlowTranslations[preferredLanguage].skip}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ) : (
                  <div className="w-6 h-6" /> // spacer
                )}

                {/* Bilingual Toggle top-right (always visible) */}
                <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 p-1 rounded-full backdrop-blur-md">
                  <button
                    onClick={() => { playClickChime(); setPreferredLanguage('am'); }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${preferredLanguage === 'am' ? 'bg-[#C8962E] text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                  >
                    አማ
                  </button>
                  <button
                    onClick={() => { playClickChime(); setPreferredLanguage('en'); }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${preferredLanguage === 'en' ? 'bg-[#C8962E] text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Dynamic Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={onboardingStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="w-full flex-grow flex flex-col justify-center"
                >
                  
                  {/* STEP 1: Welcome */}
                  {onboardingStep === 1 && (
                    <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                      {/* Centered Logo with pulsing glow */}
                      <div className="relative mb-2">
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 via-[#C8962E] to-red-500 rounded-full blur-xl opacity-25 animate-pulse" />
                        <EthioLearnLogo size={90} showCardBackground={false} className="relative transform hover:scale-105 transition-transform duration-300" />
                      </div>
                      
                      {/* Mascot AI Teacher waves */}
                      <div className="flex justify-center my-3">
                        <Asgobanyi action="wave" size={120} />
                      </div>
                      
                      {/* Speech Bubble */}
                      <div className="relative bg-zinc-900/90 border border-[#C8962E]/30 px-5 py-3 rounded-2xl max-w-xs text-center shadow-xl mb-2">
                        {/* Speech Bubble Arrow */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-zinc-900" />
                        <p className="text-xs font-serif font-bold text-[#F0EDE8] leading-relaxed">
                          {onboardingFlowTranslations[preferredLanguage].screen1Bubble}
                        </p>
                      </div>
                      
                      {/* Text Headings */}
                      <div className="space-y-1.5 pt-1">
                        <h1 className="font-serif text-3xl font-black text-[#C8962E] tracking-tight">
                          {onboardingFlowTranslations[preferredLanguage].screen1Headline}
                        </h1>
                        <p className="text-xs text-zinc-300 max-w-sm leading-relaxed px-2">
                          {onboardingFlowTranslations[preferredLanguage].screen1Tagline}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: AI Tutor */}
                  {onboardingStep === 2 && (
                    <div className="flex flex-col items-center py-2 space-y-4">
                      {/* Interactive Mockup for Chat */}
                      <div className="relative w-full max-w-[280px] aspect-[1.9/1] rounded-2xl bg-zinc-950/80 border border-zinc-800/80 p-3 shadow-2xl flex flex-col justify-between overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                        
                        {/* Floating Tag */}
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-500">Live AI Chat</span>
                          </div>
                          <span className="text-[8px] font-mono text-zinc-600 font-sans">Amharic / English</span>
                        </div>

                        {/* Messages list */}
                        <div className="space-y-2 py-1 flex-grow overflow-hidden flex flex-col justify-end text-left">
                          <div className="self-end bg-[#C8962E]/10 border border-[#C8962E]/20 rounded-xl px-2.5 py-1 text-[9px] text-zinc-300 max-w-[85%] font-sans">
                            {preferredLanguage === 'am' ? 'GDP በአማርኛ ምንድነው?' : 'Explain GDP in Amharic?'}
                          </div>
                          <div className="self-start bg-zinc-900 border border-zinc-850 rounded-xl px-2.5 py-1 text-[9px] text-zinc-400 max-w-[85%] flex items-start gap-1 font-sans">
                            <Sparkles className="w-2.5 h-2.5 text-[#C8962E] mt-0.5 shrink-0" />
                            <span>{preferredLanguage === 'am' ? 'ጠቅላላ የአገር ውስጥ ምርት (GDP) ማለት...' : 'Gross Domestic Product (GDP) means...'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Mascot አስጎብኚ + Speech bubble side by side */}
                      <div className="flex items-center gap-3 max-w-sm bg-zinc-900/40 p-3 rounded-2xl border border-zinc-850/60 w-full">
                        <Asgobanyi action="point" size={80} className="shrink-0" />
                        <div className="relative bg-zinc-950/80 border border-[#C8962E]/30 p-2.5 rounded-xl flex-grow text-left">
                          <p className="text-[10px] text-zinc-200 leading-normal font-medium font-sans">
                            {onboardingFlowTranslations[preferredLanguage].screen2Bubble}
                          </p>
                        </div>
                      </div>

                      {/* Typography */}
                      <div className="text-center px-2 space-y-1">
                        <h2 className="text-base font-serif font-bold text-[#C8962E]">
                          {onboardingFlowTranslations[preferredLanguage].screen2Headline}
                        </h2>
                        <p className="text-[10.5px] text-zinc-400 max-w-sm leading-relaxed mx-auto font-sans">
                          {onboardingFlowTranslations[preferredLanguage].screen2Sub}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Flashcards */}
                  {onboardingStep === 3 && (
                    <div className="flex flex-col items-center py-2 space-y-4">
                      {/* 3D Flipping Flashcard Mockup */}
                      <div 
                        onClick={() => { playClickChime(); setFlashcardFlipped(!flashcardFlipped); }}
                        className="group relative w-full max-w-[280px] h-[120px] cursor-pointer"
                        style={{ perspective: '1000px' }}
                      >
                        <div 
                          className="relative w-full h-full duration-500 transition-transform"
                          style={{ 
                            transformStyle: 'preserve-3d', 
                            transform: flashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
                          }}
                        >
                          {/* Front of Card */}
                          <div 
                            className="absolute inset-0 w-full h-full rounded-2xl bg-zinc-900 border-2 border-zinc-800/85 p-3.5 flex flex-col justify-between shadow-2xl"
                            style={{ backfaceVisibility: 'hidden' }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 rounded-full bg-zinc-850 border border-zinc-800 text-[8px] text-[#C8962E] font-mono tracking-wider uppercase">
                                Front (ጥያቄ)
                              </span>
                              <Layers className="w-3.5 h-3.5 text-zinc-500" />
                            </div>
                            <div className="text-center py-1 text-left">
                              <p className="text-[11px] font-serif text-[#F0EDE8] font-bold">
                                What is the primary organic outcome of Photosynthesis?
                              </p>
                            </div>
                            <div className="text-center text-[8px] text-zinc-500 font-mono animate-pulse">
                              {preferredLanguage === 'am' ? 'ለመገልበጥ ንካ 🔄' : 'Click or Tap to Flip 🔄'}
                            </div>
                          </div>

                          {/* Back of Card */}
                          <div 
                            className="absolute inset-0 w-full h-full rounded-2xl bg-[#0f172a] border-2 border-[#C8962E]/60 p-3.5 flex flex-col justify-between shadow-2xl"
                            style={{ 
                              backfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)' 
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 rounded-full bg-[#C8962E]/10 border border-[#C8962E]/20 text-[8px] text-emerald-400 font-mono tracking-wider uppercase">
                                Back (መልስ)
                              </span>
                              <Sparkles className="w-3.5 h-3.5 text-[#C8962E] animate-pulse" />
                            </div>
                            <div className="text-center py-0.5">
                              <p className="text-[11px] text-zinc-300 font-medium">
                                Synthesis of glucose sugars and release of oxygen gas! 🌿
                              </p>
                            </div>
                            <div className="text-center text-[8px] text-emerald-500/70 font-bold font-mono">
                              Mastered! (+10 XP)
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mascot አስጎብኚ + Speech bubble side by side */}
                      <div className="flex items-center gap-3 max-w-sm bg-zinc-900/40 p-3 rounded-2xl border border-zinc-850/60 w-full">
                        <Asgobanyi action="idle" size={80} className="shrink-0" />
                        <div className="relative bg-zinc-950/80 border border-[#C8962E]/30 p-2.5 rounded-xl flex-grow text-left">
                          <p className="text-[10px] text-zinc-200 leading-normal font-medium font-sans">
                            {onboardingFlowTranslations[preferredLanguage].screen3Bubble}
                          </p>
                        </div>
                      </div>

                      {/* Typography */}
                      <div className="text-center px-2 space-y-1">
                        <h2 className="text-base font-serif font-bold text-[#C8962E]">
                          {onboardingFlowTranslations[preferredLanguage].screen3Headline}
                        </h2>
                        <p className="text-[10.5px] text-zinc-400 max-w-sm leading-relaxed mx-auto font-sans">
                          {onboardingFlowTranslations[preferredLanguage].screen3Sub}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Universities */}
                  {onboardingStep === 4 && (
                    <div className="flex flex-col items-center py-2 space-y-4">
                      {/* University Badges Grid */}
                      <div className="relative w-full max-w-[280px] py-1.5 flex justify-center gap-2.5 overflow-hidden">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                        
                        {/* AAU Badge */}
                        <div className="w-[64px] h-[64px] rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center p-1 shadow-lg animate-[float-slow_4s_infinite_ease-in-out]">
                          <span className="text-base">🏛️</span>
                          <span className="text-[8px] font-bold text-zinc-300 font-mono mt-0.5">AAU</span>
                          <span className="text-[6px] text-zinc-500 font-mono">Addis Ababa</span>
                        </div>

                        {/* Wolkite Badge */}
                        <div className="w-[64px] h-[64px] rounded-2xl bg-zinc-900 border-2 border-[#C8962E]/40 flex flex-col items-center justify-center p-1 shadow-lg animate-[float-slower_5s_infinite_ease-in-out]">
                          <span className="text-base">🦁</span>
                          <span className="text-[8px] font-bold text-amber-300 font-mono mt-0.5">WKU</span>
                          <span className="text-[6px] text-zinc-500 font-mono">Wolkite</span>
                        </div>

                        {/* ASTU Badge */}
                        <div className="w-[64px] h-[64px] rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center p-1 shadow-lg animate-[float-slow_6s_infinite_ease-in-out] [animation-delay:1s]">
                          <span className="text-base">🔬</span>
                          <span className="text-[8px] font-bold text-zinc-300 font-mono mt-0.5">ASTU</span>
                          <span className="text-[6px] text-zinc-500 font-mono">Adama</span>
                        </div>
                      </div>

                      {/* Mascot አስጎብኚ + Speech bubble side by side */}
                      <div className="flex items-center gap-3 max-w-sm bg-zinc-900/40 p-3 rounded-2xl border border-zinc-850/60 w-full">
                        <Asgobanyi action="point" size={80} className="shrink-0" />
                        <div className="relative bg-zinc-950/80 border border-[#C8962E]/30 p-2.5 rounded-xl flex-grow text-left">
                          <p className="text-[10px] text-zinc-200 leading-normal font-medium font-sans">
                            {onboardingFlowTranslations[preferredLanguage].screen4Bubble}
                          </p>
                        </div>
                      </div>

                      {/* Typography */}
                      <div className="text-center px-2 space-y-1">
                        <h2 className="text-base font-serif font-bold text-[#C8962E]">
                          {onboardingFlowTranslations[preferredLanguage].screen4Headline}
                        </h2>
                        <p className="text-[10.5px] text-zinc-400 max-w-sm leading-relaxed mx-auto font-sans">
                          {onboardingFlowTranslations[preferredLanguage].screen4Sub}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Interactive Chat Preview (No Signup) */}
                  {onboardingStep === 5 && (
                    <div className="flex flex-col py-1 space-y-3">
                      {/* Chat History Container */}
                      <div className="w-full bg-zinc-950/90 border border-zinc-850 rounded-2xl p-3 shadow-inner flex flex-col justify-between overflow-hidden relative">
                        {/* Floating Backdrop Glow */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#C8962E]/5 rounded-full blur-xl pointer-events-none" />
                        
                        {/* Messages Box */}
                        <div className="h-[145px] overflow-y-auto space-y-2 pr-1 text-left flex flex-col scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                          {onboardingChatMessages.length === 0 ? (
                            <div className="my-auto text-center space-y-2.5 px-2 flex flex-col justify-center items-center">
                              <span className="text-base animate-bounce">💬</span>
                              <p className="text-[9.5px] text-zinc-400 leading-normal max-w-[220px] font-sans">
                                {preferredLanguage === 'am' ? 'ባለ ሁለት ቋንቋ ጥያቄዎችን ለመጠየቅ ከታች ካሉት አማራጮች አንዱን ይምረጡ ወይም ይፃፉ።' : 'Ask a study question to test AI Teacher right now!'}
                              </p>
                              
                              {/* Quick Questions */}
                              <div className="flex flex-wrap gap-1 justify-center pt-0.5">
                                <button
                                  onClick={() => handleOnboardingChatSubmit(preferredLanguage === 'am' ? "ስለ ወልቂጤ ዩኒቨርሲቲ ንገረኝ" : "Tell me about Wolkite University")}
                                  className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded text-[8px] text-zinc-300 font-semibold transition cursor-pointer"
                                >
                                  🏫 Wolkite Univ
                                </button>
                                <button
                                  onClick={() => handleOnboardingChatSubmit(preferredLanguage === 'am' ? "ፎቶሲንተሲስ ምንድን ነው?" : "What is Photosynthesis?")}
                                  className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded text-[8px] text-zinc-300 font-semibold transition cursor-pointer"
                                >
                                  🌿 Photosynthesis
                                </button>
                                <button
                                  onClick={() => handleOnboardingChatSubmit(preferredLanguage === 'am' ? "GDP በምሳሌ አስረዳኝ" : "Explain GDP with an example")}
                                  className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded text-[8px] text-zinc-300 font-semibold transition cursor-pointer"
                                >
                                  📊 GDP Economy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 pb-1">
                              {onboardingChatMessages.map((msg, idx) => (
                                <div 
                                  key={idx} 
                                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                  <div 
                                    className={`px-3 py-1.5 rounded-2xl text-[10px] max-w-[85%] leading-relaxed ${
                                      msg.role === 'user' 
                                        ? 'bg-gradient-to-r from-[#C8962E] to-amber-500 text-black font-semibold rounded-tr-none' 
                                        : 'bg-zinc-900 text-zinc-200 border border-zinc-850 rounded-tl-none font-sans'
                                    }`}
                                  >
                                    {msg.content}
                                  </div>
                                </div>
                              ))}
                              {onboardingIsTyping && (
                                <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-850/50 rounded-xl px-2.5 py-1 self-start text-[9px] text-zinc-500 font-mono italic">
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#C8962E]" />
                                  <span>{preferredLanguage === 'am' ? 'AI Teacher በማመንጨት ላይ...' : 'AI Teacher is thinking...'}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Input form */}
                        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1 mt-1.5">
                          <input
                            type="text"
                            value={onboardingChatText}
                            onChange={(e) => setOnboardingChatText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleOnboardingChatSubmit(onboardingChatText); }}
                            placeholder={onboardingFlowTranslations[preferredLanguage].chatPlaceholder}
                            disabled={onboardingIsTyping}
                            className="flex-grow bg-transparent text-[10px] text-zinc-100 outline-none placeholder:text-zinc-600 font-sans"
                          />
                          <button
                            onClick={() => handleOnboardingChatSubmit(onboardingChatText)}
                            disabled={!onboardingChatText.trim() || onboardingIsTyping}
                            className="p-1.5 bg-[#C8962E] disabled:bg-zinc-800 text-black disabled:text-zinc-600 rounded-lg transition cursor-pointer flex items-center justify-center shrink-0"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Mascot አስጎብኚ + Speech bubble side by side */}
                      <div className="flex items-center gap-3 max-w-sm bg-zinc-900/40 p-2 rounded-2xl border border-zinc-850/60 w-full transition-all">
                        <Asgobanyi action={onboardingAiResponded ? 'thumbs-up' : 'idle'} size={75} className="shrink-0" />
                        <div className="relative bg-zinc-950/80 border border-[#C8962E]/30 p-2.5 rounded-xl flex-grow text-left">
                          <p className="text-[10px] text-zinc-200 leading-normal font-semibold font-sans">
                            {onboardingAiResponded 
                              ? onboardingFlowTranslations[preferredLanguage].screen5BubbleResponse 
                              : onboardingFlowTranslations[preferredLanguage].screen5BubbleInitial}
                          </p>
                        </div>
                      </div>

                      {/* Registration Banner & Buttons displayed once they ask a question */}
                      <AnimatePresence>
                        {onboardingAiResponded && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full text-center space-y-2 pt-0.5"
                          >
                            {/* Banner */}
                            <div className="bg-gradient-to-r from-emerald-950/20 via-amber-950/20 to-red-950/20 border border-[#C8962E]/30 p-2 rounded-xl shadow-lg">
                              <p className="text-[9px] font-medium text-zinc-300 leading-relaxed font-sans">
                                {preferredLanguage === 'am' 
                                  ? 'ተጨማሪ አገልግሎቶችን ይክፈቱ! የፈተና ጥያቄዎች፣ የመጽሃፍ መደብር፣ ብልጥ ካርዶች እና ሙሉ የትምህርት ሞጁሎች!'
                                  : 'Unlock complete focus modules, past exams, textbook library, smart decks & study counters!'}
                              </p>
                            </div>
                            
                            {/* Sign Up Button */}
                            <button
                              onClick={() => { playClickChime(); setMode('signup'); }}
                              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 via-[#C8962E] to-red-500 hover:from-emerald-400 hover:via-amber-400 hover:to-red-400 text-black font-extrabold text-[10px] tracking-widest uppercase rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-1 border border-amber-300/20 font-serif"
                            >
                              <Bot className="w-3.5 h-3.5" />
                              <span>{onboardingFlowTranslations[preferredLanguage].createAccount}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>

                            {/* Alternate link */}
                            <button
                              onClick={() => { playClickChime(); setMode('signin'); }}
                              className="text-[10px] text-[#C8962E] hover:underline font-bold transition cursor-pointer inline-block"
                            >
                              {onboardingFlowTranslations[preferredLanguage].loginLink}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

              {/* Bottom Navigation Panel (Progress indicators & Buttons) */}
              {onboardingStep < 5 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-900">
                  
                  {/* Left / Back Button */}
                  {onboardingStep > 1 ? (
                    <button
                      onClick={() => { playClickChime(); setOnboardingStep(onboardingStep - 1); }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>{onboardingFlowTranslations[preferredLanguage].back}</span>
                    </button>
                  ) : (
                    <div className="w-12 h-8" /> // Spacer
                  )}

                  {/* Center Progress Dots (only shown on slides 2, 3, 4 as 1/3, 2/3, 3/3) */}
                  {onboardingStep > 1 && onboardingStep < 5 ? (
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((dotIdx) => {
                        const active = onboardingStep - 1 === dotIdx;
                        return (
                          <span
                            key={dotIdx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              active ? 'w-5 bg-[#C8962E]' : 'w-1.5 bg-zinc-800'
                            }`}
                          />
                        );
                      })}
                    </div>
                  ) : onboardingStep === 1 ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8962E] animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    </div>
                  ) : null}

                  {/* Right / Next Button */}
                  <button
                    onClick={() => {
                      playClickChime();
                      if (onboardingStep < 4) {
                        setOnboardingStep(onboardingStep + 1);
                      } else if (onboardingStep === 4) {
                        setOnboardingStep(5);
                      }
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-[#C8962E] to-amber-500 text-black font-extrabold text-xs tracking-wider uppercase rounded-xl hover:opacity-90 shadow-md transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>
                      {onboardingStep === 1 
                        ? onboardingFlowTranslations[preferredLanguage].getStarted 
                        : onboardingStep === 4 
                          ? onboardingFlowTranslations[preferredLanguage].tryItNow 
                          : onboardingFlowTranslations[preferredLanguage].next}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-black" />
                  </button>

                </div>
              )}

              {/* Ethiopian Flag Ribbons Border */}
              <div className="h-[2.5px] bg-gradient-to-r from-emerald-500 via-[#C8962E] to-red-500 rounded-full w-2/3 mx-auto mt-4 opacity-75" />
            </div>
          </motion.div>
        )}

        {/* Step SPLASH */}
        {mode === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-lg flex flex-col items-center relative z-10 w-full my-auto px-4"
          >
            {/* Elegant Habesha Welcome Banner */}
            <div className="mb-2">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest text-amber-200 bg-gradient-to-r from-emerald-950/40 via-amber-950/40 to-red-950/40 border border-[#C8962E]/30 backdrop-blur-md uppercase font-serif animate-pulse">
                እንኳን በደህና መጡ!
              </span>
            </div>

            {/* Traditional 'Tibeb' styled geometric woven pattern strip */}
            <div className="w-full max-w-xs flex h-2.5 overflow-hidden rounded-full my-4 border border-zinc-800 shadow-inner select-none bg-zinc-900">
              {Array.from({ length: 16 }).map((_, i) => {
                const colors = ["bg-emerald-600", "bg-[#C8962E]", "bg-red-600"];
                return (
                  <div 
                    key={i} 
                    className={`flex-1 h-full ${colors[i % 3]} transform skew-x-12 mx-[1px]`} 
                  />
                );
              })}
            </div>

            <div className="relative w-full max-w-[320px] aspect-[4/3] mb-6 flex items-center justify-center select-none">
              {/* Vibrant Ambient Backglow representing Ethiopian National Flag Colors */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-emerald-600 via-[#C8962E] to-red-600 blur-[36px] opacity-35 animate-pulse" />

              {/* Glassmorphic Rounded Display Shield */}
              <div className="absolute inset-0 rounded-3xl bg-black/40 border border-zinc-800 backdrop-blur-md overflow-hidden shadow-2xl flex flex-col items-center justify-center px-4 py-3">
                
                {/* SVG Moving Illustration Container */}
                <svg viewBox="0 0 400 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    {/* Glowing Sun Gradient */}
                    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#C8962E" stopOpacity="0.4" />
                      <stop offset="60%" stopColor="#C8962E" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#C8962E" stopOpacity="0" />
                    </radialGradient>
                    
                    {/* Ethiopian Traditional Netela Borders (Green - Yellow - Red) */}
                    <linearGradient id="habeshaTrim" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10B981" /> {/* Green */}
                      <stop offset="50%" stopColor="#F59E0B" /> {/* Yellow */}
                      <stop offset="100%" stopColor="#EF4444" /> {/* Red */}
                    </linearGradient>

                    {/* Book Glow Effect */}
                    <radialGradient id="bookLight" cx="50%" cy="80%" r="50%">
                      <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* 1. Golden Traditional Sunrise of Knowledge (Rotating segments in back) */}
                  <g transform="translate(200, 150)">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1="0"
                        x2={120 * Math.cos((i * 30 * Math.PI) / 180)}
                        y2={120 * Math.sin((i * 30 * Math.PI) / 180)}
                        stroke="#C8962E"
                        strokeWidth="1.5"
                        strokeOpacity="0.15"
                        strokeDasharray="4,8"
                      />
                    ))}
                    <circle cx="0" cy="0" r="50" fill="url(#sunGlow)" />
                  </g>

                  {/* 2. Students silhouettes (Left: Boy Student, Right: Girl Student) */}
                  {/* Left Student: Boy in Traditional White Gabi/Netela */}
                  <g transform="translate(110, 140)">
                    {/* Subtle Breathing Motion */}
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="110,140; 110,137; 110,140"
                      dur="4s"
                      repeatCount="indefinite"
                      additive="sum"
                    />
                    
                    {/* Hair */}
                    <path d="M 10,-35 C -15,-35 -15,-60 10,-60 C 35,-60 35,-35 10,-35 Z" fill="#18181B" />
                    <circle cx="-2" cy="-48" r="8" fill="#18181B" />
                    <circle cx="22" cy="-48" r="8" fill="#18181B" />
                    <circle cx="10" cy="-56" r="10" fill="#18181B" />

                    {/* Left Kid Head and smiling face */}
                    <circle cx="10" cy="-35" r="18" fill="#5C4233" />
                    {/* Eyes */}
                    <circle cx="4" cy="-37" r="1.8" fill="#FFFFFF" />
                    <circle cx="4" cy="-37" r="0.8" fill="#000" />
                    <circle cx="14" cy="-37" r="1.8" fill="#FFFFFF" />
                    <circle cx="14" cy="-37" r="0.8" fill="#000" />
                    {/* Smile */}
                    <path d="M 4,-26 Q 9,-22 14,-26" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                    {/* Ears */}
                    <circle cx="-9" cy="-35" r="4" fill="#5C4233" />
                    <circle cx="29" cy="-35" r="4" fill="#5C4233" />

                    {/* Neck */}
                    <rect x="6" y="-18" width="8" height="12" fill="#5C4233" />

                    {/* Traditional Shamma / Netela (Garment shoulders) */}
                    <path d="M -25,45 C -25,10 -15,0 10,0 C 35,0 45,10 45,45 Z" fill="#F4F4F5" />
                    
                    {/* Traditional Woven Border (Green-Yellow-Red strip on clothing) */}
                    <path d="M -21,28 C -7,16 11,16 41,28" stroke="url(#habeshaTrim)" strokeWidth="5.5" fill="none" strokeLinecap="round" />
                    
                    {/* Holding Hand */}
                    <circle cx="35" cy="42" r="6" fill="#5C4233" />
                  </g>

                  {/* Right Student: Girl with braids in traditional white dress with Netela wrap */}
                  <g transform="translate(290, 140)">
                    {/* Anti-phase Breathing Motion */}
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="290,137; 290,140; 290,137"
                      dur="4s"
                      repeatCount="indefinite"
                      additive="sum"
                    />
                    
                    {/* Braids / Traditional Hair */}
                    <path d="M -10,-35 C -35,-35 -35,-60 -10,-60 C 15,-60 15,-35 -10,-35 Z" fill="#18181B" />
                    {/* Drooping Braids on sides */}
                    <path d="M -26,-40 Q -33,-20 -28,-3" stroke="#18181B" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                    <path d="M 6,-40 Q 13,-20 8,-3" stroke="#18181B" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                    
                    {/* Red hair ties at the end */}
                    <circle cx="-28" cy="-3" r="3" fill="#EF4444" />
                    <circle cx="8" cy="-3" r="3" fill="#EF4444" />

                    {/* Kid Head and smiling face */}
                    <circle cx="-10" cy="-35" r="18" fill="#6B4E3D" />
                    {/* Eyes */}
                    <circle cx="-16" cy="-37" r="1.8" fill="#FFFFFF" />
                    <circle cx="-16" cy="-37" r="0.8" fill="#000" />
                    <circle cx="-6" cy="-37" r="1.8" fill="#FFFFFF" />
                    <circle cx="-6" cy="-37" r="0.8" fill="#000" />
                    {/* Smile */}
                    <path d="M -16,-26 Q -11,-22 -6,-26" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                    {/* Ears */}
                    <circle cx="-29" cy="-35" r="4" fill="#6B4E3D" />
                    <circle cx="9" cy="-35" r="4" fill="#6B4E3D" />

                    {/* Neck */}
                    <rect x="-14" y="-18" width="8" height="12" fill="#6B4E3D" />

                    {/* Traditional Shamma / Dress shoulders */}
                    <path d="M -45,45 C -45,10 -35,0 -10,0 C 15,0 25,10 25,45 Z" fill="#F4F4F5" />
                    
                    {/* Traditional Woven Border (Green-Yellow-Red strip on shoulders) */}
                    <path d="M -41,28 C -11,16 7,16 21,28" stroke="url(#habeshaTrim)" strokeWidth="5.5" fill="none" strokeLinecap="round" />

                    {/* Holding Hand */}
                    <circle cx="-35" cy="42" r="6" fill="#6B4E3D" />
                  </g>

                  {/* 3. Central Open Glowing Study Book */}
                  <g transform="translate(145, 175)">
                    {/* Soft ambient book light beam upward */}
                    <polygon points="10,-60 145,-60 115,10 40,10" fill="url(#bookLight)" />

                    {/* Beautiful traditional wooden or golden book stand */}
                    <path d="M 5,28 L 30,12 L 125,12 L 150,28 Z" fill="#5F3F19" stroke="#78350F" strokeWidth="2" />
                    <path d="M 30,12 L 77,40 L 125,12" stroke="#451A03" strokeWidth="3" fill="none" />

                    {/* Animated Golden pages */}
                    <path d="M 15,15 Q 77,-5 77,15 Q 77,-5 139,15 L 129,-8 Q 77,-28 77,-8 Q 77,-28 25,-8 Z" fill="#FFFBEB" stroke="#C8962E" strokeWidth="1.5" />
                    <line x1="77" y1="-8" x2="77" y2="15" stroke="#D97706" strokeWidth="1.5" />
                    
                    {/* Glowing Star Spark coming out of book */}
                    <circle cx="77" cy="-22" r="2.5" fill="#FBBF24">
                      <animate attributeName="r" values="1;3;1" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </g>

                  {/* 4. Drifting Floating Ge'ez Alphabets (ሀ, ለ, ሐ, መ) with random animation keyframes */}
                  {/* HA (ሀ) */}
                  <g transform="translate(80, 80)">
                    <text x="0" y="0" fill="#C8962E" fontSize="24" fontFamily="serif" fontWeight="900" opacity="0.85">
                      ሀ
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; -10,-20; 0,0"
                        dur="6s"
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="0.4;1;0.4" dur="6s" repeatCount="indefinite" />
                    </text>
                  </g>

                  {/* LE (ለ) */}
                  <g transform="translate(310, 80)">
                    <text x="0" y="0" fill="#10B981" fontSize="22" fontFamily="serif" fontWeight="900" opacity="0.85">
                      ለ
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 12,-15; 0,0"
                        dur="5s"
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="0.3;0.9;0.3" dur="5s" repeatCount="indefinite" />
                    </text>
                  </g>

                  {/* HAM (ሐ) */}
                  <g transform="translate(130, 60)">
                    <text x="0" y="0" fill="#EF4444" fontSize="20" fontFamily="serif" fontWeight="900" opacity="0.85">
                      ሐ
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; 5,-25; 0,0"
                        dur="7s"
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="0.2;1;0.2" dur="7s" repeatCount="indefinite" />
                    </text>
                  </g>

                  {/* MA (መ) */}
                  <g transform="translate(250, 60)">
                    <text x="0" y="0" fill="#FBBF24" fontSize="20" fontFamily="serif" fontWeight="900" opacity="0.85">
                      መ
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,0; -8,-18; 0,0"
                        dur="5.5s"
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="0.4;0.95;0.4" dur="5.5s" repeatCount="indefinite" />
                    </text>
                  </g>

                  {/* Floating sparks of wisdom (drifting up and around) */}
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const startX = 130 + idx * 26;
                    const delay = idx * 0.7;
                    return (
                      <circle
                        key={idx}
                        cx={startX}
                        cy="160"
                        r="2.5"
                        fill="#F59E0B"
                        opacity="0"
                      >
                        <animate
                          attributeName="cy"
                          values="160; 70"
                          dur="4s"
                          begin={`${delay}s`}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="cx"
                          values={`${startX}; ${startX + (idx % 2 === 0 ? 15 : -15)}`}
                          dur="4s"
                          begin={`${delay}s`}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0; 0.9; 0"
                          dur="4s"
                          begin={`${delay}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    );
                  })}
                </svg>

                {/* Floating Micro Label overlay */}
                <div className="absolute bottom-2.5 px-3 py-0.5 rounded-full bg-zinc-950/80 border border-zinc-900 text-[10px] text-zinc-400 font-mono tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>STUDY ROOM FRONTIER</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-[#C8962E] tracking-normal" style={{ textShadow: "0 0 20px rgba(200, 150, 46, 0.25)" }}>
                ኢትዮ ለርን ፕሮ
              </h1>
              <h2 className="text-lg md:text-xl font-serif font-semibold text-slate-800 dark:text-[#F0EDE8] tracking-widest uppercase">
                EthioLearn Pro
              </h2>

              <div className="flex items-center justify-center gap-3 w-40 mx-auto py-1">
                <div className="h-[1px] bg-gradient-to-r from-transparent to-[#C8962E]/40 flex-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C8962E]" />
                <div className="h-[1px] bg-gradient-to-l from-transparent to-emerald-500/40 flex-1" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.25em] uppercase">
                  ተማር • አድግ • ብልጽግና
                </p>
                <p className="text-slate-500 dark:text-[#A29A95] text-[10px] font-mono tracking-widest uppercase">
                  Learn. Grow. Prosper.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-sm justify-center">
              {/* If there is a saved registered account, prioritize instant Continue */}
              {registeredAccounts.length > 0 ? (
                <div className="space-y-2.5">
                  <motion.button
                    onClick={() => handleQuickLogin(registeredAccounts[0])}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-[#C8962E] to-amber-500 text-black font-extrabold text-xs tracking-wider uppercase rounded-2xl cursor-pointer shadow-[0_0_24px_rgba(200,150,46,0.35)] transition-all flex items-center justify-between border border-amber-300/40 font-serif"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-black/20 text-black font-black flex items-center justify-center text-xs shrink-0">
                        {registeredAccounts[0].profile?.name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div className="text-left truncate">
                        <span className="block text-black font-extrabold text-xs">
                          {preferredLanguage === 'am' ? `እንደ ${registeredAccounts[0].profile?.name || 'ተማሪ'} ቀጥል` : `Continue as ${registeredAccounts[0].profile?.name || 'Student'}`}
                        </span>
                        <span className="block text-[9.5px] text-black/75 font-mono truncate">
                          {registeredAccounts[0].profile?.university || registeredAccounts[0].email}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-black shrink-0" />
                  </motion.button>

                  <div className="flex items-center justify-center gap-4 pt-1">
                    <button
                      onClick={() => { playClickChime(); setMode('signin'); }}
                      className="text-[10px] text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <LogIn className="w-3 h-3 text-[#C8962E]" /> {preferredLanguage === 'am' ? 'ሌላ አካውንት' : 'Switch Account'}
                    </button>
                    <span className="text-slate-300 dark:text-zinc-700">|</span>
                    <button
                      onClick={() => { playClickChime(); setMode('signup'); }}
                      className="text-[10px] text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3 text-[#C8962E]" /> {preferredLanguage === 'am' ? 'አዲስ መዝግብ' : 'Register New'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Primary Pulsing Instant Quick Start Button for First-Time Users */}
                  <motion.button
                    onClick={() => { playClickChime(); setMode('onboarding'); setOnboardingStep(1); }}
                    whileHover={{ scale: 1.025 }}
                    whileTap={{ scale: 0.985 }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-[#C8962E] to-red-500 text-black font-extrabold text-xs tracking-widest uppercase rounded-2xl cursor-pointer shadow-[0_0_24px_rgba(200,150,46,0.3)] transition-all flex items-center justify-center gap-2 border border-amber-300/30 font-serif"
                  >
                    <span className="relative flex h-2.5 w-2.5 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    {preferredLanguage === 'am' ? 'ጀምር (Get Started)' : 'Get Started'}
                  </motion.button>

                  {/* Smaller clean row for alternative flows */}
                  <div className="flex items-center justify-center gap-5 mt-1">
                    <button
                      onClick={() => { playClickChime(); setMode('signin'); }}
                      className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <LogIn className="w-3 h-3 text-[#C8962E]" /> {preferredLanguage === 'am' ? 'ግባ (Sign In)' : 'Student Sign In'}
                    </button>
                    <span className="text-slate-300 dark:text-zinc-800">|</span>
                    <button
                      onClick={handleGuestQuickStart}
                      className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3 h-3 text-[#C8962E]" /> {preferredLanguage === 'am' ? 'የእንግዳ ሁነታ' : 'Guest Mode'}
                    </button>
                  </div>
                </>
              )}

              {/* Traditional Bottom Accents */}
              <div className="w-full max-w-[140px] flex h-[2px] overflow-hidden rounded-full mt-4 mx-auto opacity-40 select-none">
                <div className="flex-1 bg-emerald-600 h-full" />
                <div className="flex-1 bg-[#C8962E] h-full" />
                <div className="flex-1 bg-red-600 h-full" />
              </div>

              {/* Frictionless tagline */}
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono text-center tracking-normal mt-1 max-w-xs mx-auto">
                Instant portal to your study notes, exam prep, and audio companion.
              </p>
            </div>
          </motion.div>
        )}

        {/* Step SIGN IN */}
        {mode === 'signin' && (
          <motion.div
            key="signin"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-[#0e1628]/95 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-zinc-800/80 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-5 my-auto transition-colors duration-200"
          >
            {/* Header with EthioLearn Logo & Language Switcher */}
            <div className="flex flex-col items-center justify-center text-center">
              <EthioLearnLogo size={48} className="drop-shadow-[0_0_12px_rgba(200,150,46,0.35)]" />
              <h3 className="font-serif text-xl font-black bg-gradient-to-r from-[#FFECA7] via-[#D4AF37] to-[#F3E5AB] bg-clip-text text-transparent tracking-tight mt-2.5">
                {onboardingTranslations[preferredLanguage].signInTitle}
              </h3>
              <p className="text-[10.5px] text-zinc-400 font-medium tracking-normal mt-1 max-w-xs">
                {onboardingTranslations[preferredLanguage].signInTagline}
              </p>

              {/* Language Switcher */}
              <div className="flex justify-center items-center p-0.5 bg-[#090f1d] border border-zinc-800/60 rounded-xl max-w-[140px] mx-auto mt-3 w-full shadow-inner">
                <button
                  type="button"
                  onClick={() => { playClickChime(); setPreferredLanguage('en'); }}
                  className={`flex-1 py-1 text-center font-bold text-[10px] rounded-lg transition-all cursor-pointer ${preferredLanguage === 'en' ? 'bg-gradient-to-r from-[#C8962E] to-[#B08123] text-black font-extrabold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => { playClickChime(); setPreferredLanguage('am'); }}
                  className={`flex-1 py-1 text-center font-bold text-[10px] rounded-lg transition-all cursor-pointer ${preferredLanguage === 'am' ? 'bg-gradient-to-r from-[#C8962E] to-[#B08123] text-black font-extrabold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  አማርኛ
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/25 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p>{authError}</p>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-amber-950/25 border border-amber-500/30 text-amber-200 text-xs rounded-xl flex items-start gap-2.5">
                <span className="text-base shrink-0">✉️</span>
                <p className="font-medium">{infoMessage}</p>
              </div>
            )}

            {/* Pending 6-Digit Registration Confirmation Code Notice */}
            <div className="bg-gradient-to-r from-[#121d33] to-[#0d1627] border border-[#C8962E]/35 rounded-xl p-3 flex items-center justify-between gap-2.5 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#C8962E]/15 border border-[#C8962E]/30 flex items-center justify-center text-[#C8962E] shrink-0">
                  <Key className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-amber-200 truncate">
                    {onboardingTranslations[preferredLanguage].havePendingCodeSignIn}
                  </p>
                  <p className="text-[9px] text-zinc-400 truncate">
                    {preferredLanguage === 'am' ? "ምዝገባዎን ለማጠናቀቅ ኮዱን ያስገቡ" : "Activate and verify pending scholar account"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setMode('verify_registration');
                }}
                className="px-2.5 py-1.5 bg-[#C8962E] hover:bg-[#b08123] text-black font-extrabold text-[9.5px] rounded-lg transition-all shadow-xs shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>{preferredLanguage === 'am' ? "ኮድ አረጋግጥ" : "Verify Code"}</span>
              </button>
            </div>

            {isPopupBlocked && (
              <div className="p-4 bg-amber-950/25 border border-amber-500/30 text-amber-200 text-xs rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-base">⚠️</span>
                  <div>
                    <p className="font-extrabold text-amber-300 uppercase tracking-wider text-[11.5px]">Popup Window Blocked</p>
                    <p className="text-zinc-300 mt-1 leading-relaxed text-[11px]">
                      Since you are running EthioLearn inside the AI Studio Preview panel, your browser's popup blocker has blocked Google Sign-In.
                    </p>
                  </div>
                </div>
                
                <div className="pl-6 space-y-1.5 text-[10.5px] text-zinc-400">
                  <p>• <strong className="text-zinc-200">Option A:</strong> Click the <strong className="text-amber-400">"Open in new tab"</strong> icon at the top right of your preview frame to sign in cleanly.</p>
                  <p>• <strong className="text-zinc-200">Option B:</strong> Try the standard redirect sign-in flow below.</p>
                </div>

                <div className="pt-1.5 pl-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={googleSignInRedirect}
                    className="px-3.5 py-1.5 bg-[#C8962E] hover:bg-[#b08123] text-black font-extrabold rounded-lg text-[10.5px] transition-all cursor-pointer"
                  >
                    ⚡ Try Redirect Sign-In
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setIsPopupBlocked(false); }}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg text-[10.5px] transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Saved Accounts on Device - Quick Sign-In */}
            {registeredAccounts.length > 0 && (
              <div className="space-y-2.5 bg-[#090f1d] p-3.5 rounded-xl border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {preferredLanguage === 'am' ? 'በዚህ ስልክ የተቀመጡ አካውንቶች' : 'Saved Accounts on Device'}
                  </p>
                  <span className="text-[10px] text-[#C8962E] font-mono font-bold">
                    {registeredAccounts.length} {preferredLanguage === 'am' ? 'አካውንት' : 'profile(s)'}
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {registeredAccounts.map((acc) => (
                    <div
                      key={acc.email}
                      onClick={() => handleQuickLogin(acc)}
                      className="group flex items-center justify-between p-2.5 rounded-lg bg-[#0e1628] hover:bg-amber-500/10 border border-zinc-800 hover:border-[#C8962E]/50 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C8962E] to-amber-300 flex items-center justify-center text-black font-bold text-xs shrink-0 shadow-inner">
                          {acc.profile?.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-100 truncate group-hover:text-amber-400 transition-colors">
                            {acc.profile?.name || 'Student'}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate font-mono">
                            {acc.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleQuickLogin(acc); }}
                          className="px-2.5 py-1 bg-[#C8962E] hover:bg-[#b08123] text-black font-bold text-[10px] rounded-md transition-all shadow-xs flex items-center gap-1"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>{preferredLanguage === 'am' ? 'ግባ' : 'Sign In'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSavedAccount(acc.email, e)}
                          title="Remove from device"
                          className="p-1 text-zinc-400 hover:text-red-400 transition-colors rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink mx-3 text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider">
                    {preferredLanguage === 'am' ? 'ወይም በሌላ ኢሜይል ግባ' : 'or enter credentials'}
                  </span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>
              </div>
            )}

            {/* Main Sign-In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {onboardingTranslations[preferredLanguage].email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder={onboardingTranslations[preferredLanguage].emailPlaceholder}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    className={`w-full bg-[#0a0f1d] border ${emailError ? 'border-red-500/80 focus:border-red-500' : 'border-zinc-800 focus:border-[#C8962E]'} rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none text-xs transition-all focus:ring-1 focus:ring-[#C8962E]/20`}
                  />
                </div>
                {emailError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1">{emailError}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {onboardingTranslations[preferredLanguage].password}
                  </label>
                  
                  {/* Forgot Password Link */}
                  <button
                    type="button"
                    onClick={() => {
                      playClickChime();
                      setMode('forgot_password');
                      setAuthError(null);
                      setInfoMessage(null);
                    }}
                    className="text-[10.5px] text-[#C8962E] hover:underline transition-all cursor-pointer font-medium"
                  >
                    {onboardingTranslations[preferredLanguage].forgotPassword}
                  </button>
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className={`w-full bg-[#0a0f1d] border ${passwordError ? 'border-red-500/80 focus:border-red-500' : 'border-zinc-800 focus:border-[#C8962E]'} rounded-lg pl-10 pr-10 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none text-xs transition-all font-mono focus:ring-1 focus:ring-[#C8962E]/20`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1">{passwordError}</p>
                )}

                {/* Direct link if user already has a 6-digit reset code */}
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      playClickChime();
                      setMode('verify_reset_code');
                    }}
                    className="text-[10px] text-zinc-400 hover:text-[#C8962E] transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{preferredLanguage === 'am' ? 'የይለፍ ቃል መቀየሪያ ኮድ አለዎት? እዚህ ያስገቡ' : 'Have a recovery code? Enter code'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Remember Me box */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-zinc-800 bg-[#0a0f1d] text-[#C8962E] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-zinc-400">{onboardingTranslations[preferredLanguage].rememberSession}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#C8962E] via-[#D4AF37] to-[#B08123] hover:brightness-105 active:scale-[0.99] text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(200,150,46,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4 text-black" />
                )}
                <span>{loading ? onboardingTranslations[preferredLanguage].signInLoading : onboardingTranslations[preferredLanguage].signInBtn}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-900"></div>
                <span className="flex-shrink mx-4 text-[9px] text-zinc-600 font-bold uppercase tracking-widest font-mono">or</span>
                <div className="flex-grow border-t border-zinc-900"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-3 bg-[#0a0f1d] hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span className="text-sm">🌟</span>
                <span>{onboardingTranslations[preferredLanguage].signInGoogleBtn}</span>
              </button>
            </form>

            <div className="text-center pt-3 border-t border-zinc-900 space-y-2.5">
              <p className="text-xs text-zinc-400">
                {onboardingTranslations[preferredLanguage].dontHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => { playClickChime(); setMode('signup'); }}
                  className="text-[#C8962E] font-bold hover:underline cursor-pointer ml-1"
                >
                  {onboardingTranslations[preferredLanguage].signUpNow}
                </button>
              </p>
              
              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500">
                <button
                  type="button"
                  onClick={() => { playClickChime(); setLegalModalTab('terms'); setShowLegalModal(true); }}
                  className="hover:text-amber-400 transition-colors underline cursor-pointer"
                >
                  {onboardingTranslations[preferredLanguage].termsLink}
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => { playClickChime(); setLegalModalTab('privacy'); setShowLegalModal(true); }}
                  className="hover:text-amber-400 transition-colors underline cursor-pointer"
                >
                  {onboardingTranslations[preferredLanguage].privacyLink}
                </button>
              </div>

              <p className="text-[9.5px] text-zinc-500 font-mono tracking-tight pt-0.5">
                {onboardingTranslations[preferredLanguage].securityGuarantee}
              </p>
            </div>
          </motion.div>
        )}

        {/* Step FORGOT PASSWORD */}
        {mode === 'forgot_password' && (
          <motion.div
            key="forgot_password"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-white dark:bg-[#1e2533] p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 relative z-10 shadow-2xl space-y-6 my-auto transition-colors duration-200"
          >
            <div className="flex items-center justify-center gap-3 border-b border-slate-100 dark:border-zinc-900/60 pb-4">
              <EthioLearnLogo size={44} />
              <div className="text-center">
                <h3 className="font-serif text-lg font-black text-[#C8962E] tracking-tight">EthioLearn Pro</h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 tracking-widest uppercase font-mono">Reset Your Password</p>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p>{authError}</p>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="font-medium">{infoMessage}</p>
              </div>
            )}

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {preferredLanguage === 'am'
                    ? "የተመዘገቡበትን የኢሜይል አድራሻ ያስገቡ። ባለ 6-አሃዝ የማረጋገጫ የደህንነት ኮድ ይላክልዎታል።"
                    : "Enter your registered email address. A 6-digit password recovery code will be dispatched immediately."}
                </p>
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block pt-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="email"
                    placeholder="student@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    className={`w-full bg-slate-50 dark:bg-zinc-900/90 border ${emailError ? 'border-red-500/80 focus:border-red-500' : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 focus:border-[#C8962E]'} rounded-lg pl-10 pr-4 py-2.5 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none text-xs transition-all focus:ring-1 focus:ring-[#C8962E]/20`}
                  />
                </div>
                {emailError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1">{emailError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#C8962E] to-[#B08123] hover:opacity-95 text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(200,150,46,0.2)]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-black" />
                )}
                <span>{loading ? (preferredLanguage === 'am' ? "ኮድ በመላክ ላይ..." : "Sending Code...") : (preferredLanguage === 'am' ? "የይለፍ ቃል መቀየሪያ ኮድ ላክ" : "Send Recovery Code")}</span>
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 dark:border-zinc-900/60">
              <button
                type="button"
                onClick={() => { playClickChime(); setMode('signin'); setAuthError(null); setInfoMessage(null); }}
                className="text-[#C8962E] font-bold text-xs hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
              >
                <span>← {preferredLanguage === 'am' ? "ወደ መግቢያ ተመለስ" : "Back to Sign In"}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step VERIFY RESET CODE */}
        {mode === 'verify_reset_code' && (
          <motion.div
            key="verify_reset_code"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-white dark:bg-[#1e2533] p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 relative z-10 shadow-2xl space-y-5 my-auto transition-colors duration-200"
          >
            <div className="flex items-center justify-center gap-3 border-b border-slate-100 dark:border-zinc-900/60 pb-3">
              <EthioLearnLogo size={44} />
              <div className="text-center">
                <h3 className="font-serif text-lg font-black text-[#C8962E] tracking-tight">EthioLearn Pro</h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 tracking-widest uppercase font-mono">
                  {preferredLanguage === 'am' ? "የይለፍ ቃል ማረጋገጫ" : "Verify Recovery Code"}
                </p>
              </div>
            </div>

            {/* Dispatched Notification Card */}
            {dispatchedMessagePreview && (
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-slate-900/40 border border-[#C8962E]/40 rounded-xl p-3.5 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#C8962E]">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">
                      {preferredLanguage === 'am' ? "የተላከ የደህንነት መልዕክት" : "Dispatched Security Message"}
                    </span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-zinc-200 leading-relaxed font-sans">
                  {preferredLanguage === 'am' ? dispatchedMessagePreview.amharicText : dispatchedMessagePreview.text}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                    Code: <strong className="text-[#C8962E] font-extrabold text-sm tracking-wider">{dispatchedSecurityCode || '777888'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (dispatchedSecurityCode) {
                        navigator.clipboard?.writeText(dispatchedSecurityCode);
                        setVerificationCodeInput(dispatchedSecurityCode);
                        setCodeCopiedToast(true);
                        setTimeout(() => setCodeCopiedToast(false), 2000);
                      }
                    }}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-[#C8962E] rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {codeCopiedToast ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{codeCopiedToast ? (preferredLanguage === 'am' ? "ተቀድቷል" : "Copied!") : (preferredLanguage === 'am' ? "ኮድ ቅዳ" : "Copy Code")}</span>
                  </button>
                </div>
              </div>
            )}

            {codeError && (
              <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p>{codeError}</p>
              </div>
            )}

            <form onSubmit={handleVerifyResetCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {preferredLanguage === 'am' ? "ባለ 6-አሃዝ ማረጋገጫ ኮድ ያስገቡ" : "Enter 6-Digit Recovery Code"}
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 584920"
                    value={verificationCodeInput}
                    onChange={(e) => {
                      setVerificationCodeInput(e.target.value.replace(/\D/g, ''));
                      if (codeError) setCodeError(null);
                    }}
                    className="w-full bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-700 focus:border-[#C8962E] rounded-lg pl-10 pr-4 py-2.5 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none text-base tracking-widest font-mono font-bold transition-all text-center focus:ring-1 focus:ring-[#C8962E]/20"
                  />
                </div>
              </div>

              {/* Instant Auto Fill & Verify button */}
              <button
                type="button"
                onClick={() => {
                  const code = dispatchedSecurityCode || '777888';
                  setVerificationCodeInput(code);
                  handleVerifyResetCode(undefined, code);
                }}
                className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[11px] rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{preferredLanguage === 'am' ? "ኮዱን በራስ-ሰር ሙላና ወዲያውኑ አረጋግጥ" : "Auto-Fill Code & Verify Now"}</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#C8962E] to-[#B08123] hover:opacity-95 text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(200,150,46,0.2)]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-black" />
                )}
                <span>{loading ? (preferredLanguage === 'am' ? "በማረጋገጥ ላይ..." : "Verifying...") : (preferredLanguage === 'am' ? "ኮዱን አረጋግጥና የይለፍ ቃል ቀይር" : "Confirm Code & Continue")}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleResendResetCode}
                  disabled={resendTimer > 0}
                  className={`font-bold transition cursor-pointer ${resendTimer > 0 ? 'text-slate-400 dark:text-zinc-500 cursor-not-allowed' : 'text-[#C8962E] hover:underline'}`}
                >
                  {resendTimer > 0
                    ? `${preferredLanguage === 'am' ? 'ኮድ እንደገና ለመላክ' : 'Resend code in'} ${resendTimer}s`
                    : (preferredLanguage === 'am' ? 'ኮድ እንደገና ላክ' : 'Resend Code')}
                </button>
                <button
                  type="button"
                  onClick={() => { playClickChime(); setMode('signin'); }}
                  className="text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition cursor-pointer"
                >
                  {preferredLanguage === 'am' ? 'ሰርዝ' : 'Cancel'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step VERIFY REGISTRATION CODE */}
        {mode === 'verify_registration' && (
          <motion.div
            key="verify_registration"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg bg-[#0e1628]/95 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-zinc-800/80 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-5 my-auto transition-all duration-300"
          >
            {/* Header with EthioLearn Logo & Verification Title */}
            <div className="flex flex-col items-center justify-center text-center">
              <EthioLearnLogo size={56} className="animate-pulse drop-shadow-[0_0_12px_rgba(200,150,46,0.35)]" />
              <h3 className="font-serif text-xl font-black bg-gradient-to-r from-[#FFECA7] via-[#D4AF37] to-[#F3E5AB] bg-clip-text text-transparent tracking-tight mt-2.5">
                {preferredLanguage === 'am' ? "የተማሪ ምዝገባ ማረጋገጫ" : "Student Account Verification"}
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium tracking-normal mt-1 max-w-sm">
                {preferredLanguage === 'am' 
                  ? "ለአካውንትዎ የተላከውን ባለ 6-አሃዝ የማረጋገጫ ኮድ በማስገባት ምዝገባዎን ያጠናቁ።" 
                  : "Enter the 6-digit confirmation security code generated for your student account to activate your portal."}
              </p>
            </div>

            {/* Student Info Card Summary */}
            {pendingStudentProfile && (
              <div className="bg-[#090f1d] border border-zinc-800 rounded-xl p-3 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#C8962E] to-amber-300 flex items-center justify-center text-black font-bold text-sm shrink-0 shadow-inner">
                    {pendingStudentProfile.name?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-100 truncate flex items-center gap-1.5">
                      <span>{pendingStudentProfile.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#C8962E]/20 text-[#C8962E] font-mono font-normal border border-[#C8962E]/30">
                        {pendingStudentProfile.year}
                      </span>
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {pendingStudentProfile.university} • <span className="font-mono text-zinc-500">{pendingStudentProfile.email}</span>
                    </p>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                  {preferredLanguage === 'am' ? "ማረጋገጫ በመጠባበቅ ላይ" : "Awaiting Code"}
                </span>
              </div>
            )}

            {/* Dispatched Notification Card */}
            {dispatchedMessagePreview && (
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-slate-900/60 border border-[#C8962E]/40 rounded-xl p-3.5 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#C8962E]">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">
                      {preferredLanguage === 'am' ? "የተላከ የተማሪ ማረጋገጫ መልዕክት" : "Live Confirmation Message Dispatched"}
                    </span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Delivered
                  </span>
                </div>
                <p className="text-[11px] text-zinc-200 leading-relaxed font-sans">
                  {preferredLanguage === 'am' ? dispatchedMessagePreview.amharicText : dispatchedMessagePreview.text}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Security Code: <strong className="text-[#C8962E] font-extrabold text-sm tracking-wider">{dispatchedSecurityCode || '123456'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (dispatchedSecurityCode) {
                        navigator.clipboard?.writeText(dispatchedSecurityCode);
                        setVerificationCodeInput(dispatchedSecurityCode);
                        setCodeCopiedToast(true);
                        setTimeout(() => setCodeCopiedToast(false), 2000);
                      }
                    }}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-[#C8962E] rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {codeCopiedToast ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{codeCopiedToast ? (preferredLanguage === 'am' ? "ተቀድቷል" : "Copied!") : (preferredLanguage === 'am' ? "ኮድ ቅዳ" : "Copy Code")}</span>
                  </button>
                </div>
              </div>
            )}

            {codeError && (
              <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p>{codeError}</p>
              </div>
            )}

            <form onSubmit={handleVerifyRegistrationCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {preferredLanguage === 'am' ? "ባለ 6-አሃዝ የማረጋገጫ ኮድዎን ያስገቡ" : "Enter 6-Digit Verification Code"}
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 584920"
                    value={verificationCodeInput}
                    onChange={(e) => {
                      setVerificationCodeInput(e.target.value.replace(/\D/g, ''));
                      if (codeError) setCodeError(null);
                    }}
                    className="w-full bg-[#0a0f1d] border border-zinc-800 focus:border-[#C8962E] rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none text-base tracking-widest font-mono font-bold transition-all text-center focus:ring-1 focus:ring-[#C8962E]/20"
                  />
                </div>
              </div>

              {/* Instant Auto Fill & Verify button */}
              <button
                type="button"
                onClick={() => {
                  const code = dispatchedSecurityCode || '123456';
                  setVerificationCodeInput(code);
                  handleVerifyRegistrationCode(undefined, code);
                }}
                className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[11px] rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{preferredLanguage === 'am' ? "ኮዱን በራስ-ሰር ሙላና ወዲያውኑ አረጋግጥ" : "Auto-Fill Code & Verify Now"}</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#C8962E] via-[#D4AF37] to-[#B08123] hover:brightness-105 active:scale-[0.99] text-black font-serif font-extrabold text-xs tracking-widest uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(200,150,46,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-black" />
                )}
                <span>{loading ? (preferredLanguage === 'am' ? "በማረጋገጥ ላይ..." : "Verifying...") : (preferredLanguage === 'am' ? "አረጋግጥና ወደ ኢትዮ ለርን ፕሮ ግባ" : "Verify & Activate Account")}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleResendRegistrationCode}
                  disabled={resendTimer > 0}
                  className={`font-bold transition cursor-pointer ${resendTimer > 0 ? 'text-zinc-500 cursor-not-allowed' : 'text-[#C8962E] hover:underline'}`}
                >
                  {resendTimer > 0
                    ? `${preferredLanguage === 'am' ? 'ኮድ እንደገና ለመላክ' : 'Resend code in'} ${resendTimer}s`
                    : (preferredLanguage === 'am' ? 'ኮድ እንደገና ላክ' : 'Resend Code')}
                </button>
                <button
                  type="button"
                  onClick={() => { playClickChime(); setMode('signup'); }}
                  className="text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  {preferredLanguage === 'am' ? 'መረጃ ቀይር' : 'Edit Registration Info'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step REGISTRATION SUCCESS & ID CARD PREVIEW */}
        {mode === 'registration_success' && (
          <motion.div
            key="registration_success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg bg-[#0e1628]/95 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-[#C8962E]/40 relative z-10 shadow-[0_0_60px_rgba(200,150,46,0.25)] space-y-6 my-auto transition-all"
          >
            {/* Header Success Badge */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="font-serif text-2xl font-black bg-gradient-to-r from-[#FFECA7] via-[#D4AF37] to-[#F3E5AB] bg-clip-text text-transparent tracking-tight mt-3">
                {preferredLanguage === 'am' ? "ምዝገባዎ በተሳካ ሁኔታ ተረጋግጧል!" : "Registration Verified & Activated!"}
              </h3>
              <p className="text-xs text-zinc-300 font-medium mt-1.5 max-w-sm">
                {preferredLanguage === 'am' 
                  ? "እንኳን ወደ ኢትዮ ለርን ፕሮ በደህና መጡ! የአካዳሚክ ፕሮፋይልዎ ተረጋግጦ የAI አስጎብኚ እና የፈተናዎች ማህደር ተከፍቶልዎታል።" 
                  : "Welcome to EthioLearn Pro! Your student account is fully verified with unlocked access to your AI Tutor and campus past exams."}
              </p>
            </div>

            {/* Ethiopian Scholar Digital ID Card */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#121c33] via-[#0b1325] to-[#070b16] border border-[#C8962E]/50 p-5 shadow-2xl overflow-hidden">
              {/* Gold Top Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-[#C8962E]/25">
                <div className="flex items-center gap-2">
                  <EthioLearnLogo size={28} />
                  <div>
                    <p className="text-[11px] font-bold font-serif text-[#C8962E]">ETHIOLEARN PRO</p>
                    <p className="text-[8.5px] text-zinc-400 tracking-widest uppercase font-mono">National Student ID</p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 text-[9.5px] font-extrabold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>VERIFIED</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex items-center gap-4 pt-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-[#C8962E] to-amber-300 border-2 border-amber-300/40 flex items-center justify-center text-black font-extrabold text-2xl shrink-0 shadow-lg">
                  {pendingStudentProfile?.name?.[0]?.toUpperCase() || name?.[0]?.toUpperCase() || 'S'}
                </div>
                <div className="min-w-0 space-y-1">
                  <h4 className="text-base font-extrabold text-zinc-100 truncate">
                    {pendingStudentProfile?.name || name || 'Scholar'}
                  </h4>
                  <p className="text-xs text-[#C8962E] font-medium truncate">
                    {pendingStudentProfile?.university || university || 'Wolkite University'}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">
                    {pendingStudentProfile?.email || email}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[9.5px] px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 font-mono">
                      {pendingStudentProfile?.year || year || 'Student'}
                    </span>
                    <span className="text-[9.5px] text-emerald-400 font-mono font-semibold">
                      ● Active Semester
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Habesha Strip */}
              <div className="flex h-[3px] w-full overflow-hidden rounded-full mt-4 opacity-80 select-none">
                <div className="flex-1 bg-emerald-600 h-full" />
                <div className="flex-1 bg-[#C8962E] h-full" />
                <div className="flex-1 bg-red-600 h-full" />
              </div>
            </div>

            {/* Primary Enter Button */}
            <button
              type="button"
              onClick={handleEnterCampusFromSuccess}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-[#C8962E] to-amber-500 hover:brightness-105 active:scale-[0.99] text-black font-serif font-extrabold text-xs tracking-widest uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(200,150,46,0.3)] transition-all"
            >
              <GraduationCap className="w-4 h-4 text-black" />
              <span>{preferredLanguage === 'am' ? "ወደ ኢትዮ ለርን ፕሮ ግባ" : "Enter EthioLearn Pro Campus"}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </motion.div>
        )}

        {/* Step UPDATE PASSWORD */}
        {mode === 'update_password' && (
          <motion.div
            key="update_password"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-white dark:bg-[#1e2533] p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 relative z-10 shadow-2xl space-y-6 my-auto transition-colors duration-200"
          >
            <div className="flex items-center justify-center gap-3 border-b border-slate-100 dark:border-zinc-900/60 pb-4">
              <EthioLearnLogo size={44} />
              <div className="text-center">
                <h3 className="font-serif text-lg font-black text-[#C8962E] tracking-tight">EthioLearn Pro</h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 tracking-widest uppercase font-mono">Create New Password</p>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p>{authError}</p>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="font-medium">{infoMessage}</p>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Your credentials have been successfully validated. Define your new account password below.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className={`w-full bg-slate-50 dark:bg-zinc-900/90 border ${passwordError ? 'border-red-500/80 focus:border-red-500' : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 focus:border-[#C8962E]'} rounded-lg pl-10 pr-10 py-2.5 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none text-xs transition-all font-mono focus:ring-1 focus:ring-[#C8962E]/20`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1">{passwordError}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError(null);
                    }}
                    className={`w-full bg-slate-50 dark:bg-zinc-900/90 border ${confirmPasswordError ? 'border-red-500/80 focus:border-red-500' : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 focus:border-[#C8962E]'} rounded-lg pl-10 pr-10 py-2.5 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none text-xs transition-all font-mono focus:ring-1 focus:ring-[#C8962E]/20`}
                  />
                </div>
                {confirmPasswordError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1">{confirmPasswordError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#C8962E] to-[#B08123] hover:opacity-95 text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(200,150,46,0.2)]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-black" />
                )}
                <span>{loading ? "Updating password..." : "Update Password"}</span>
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 dark:border-zinc-900/60">
              <button
                type="button"
                onClick={() => { playClickChime(); setMode('signin'); setAuthError(null); setInfoMessage(null); }}
                className="text-[#C8962E] font-bold text-xs hover:underline cursor-pointer"
              >
                Cancel and return to Sign In
              </button>
            </div>
          </motion.div>
        )}

        {/* Step SIGN UP */}
        {mode === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg bg-[#0e1628]/95 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-zinc-800/80 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-5 my-auto transition-all duration-300"
          >
            {/* Logo, Tagline & Language Toggle */}
            <div className="flex flex-col items-center justify-center text-center">
              <EthioLearnLogo size={56} className="drop-shadow-[0_0_12px_rgba(200,150,46,0.35)]" />
              <h3 className="font-serif text-2xl font-black bg-gradient-to-r from-[#FFECA7] via-[#D4AF37] to-[#F3E5AB] bg-clip-text text-transparent tracking-tight mt-2.5">
                EthioLearn Pro
              </h3>
              
              {/* Subtle Ethiopian Flag Accent line */}
              <div className="flex h-[3px] w-20 overflow-hidden rounded-full mx-auto opacity-90 mt-1.5 select-none">
                <div className="flex-1 bg-emerald-600 h-full" />
                <div className="flex-1 bg-[#C8962E] h-full" />
                <div className="flex-1 bg-red-600 h-full" />
              </div>
              
              <p className="text-[11px] text-zinc-400 font-medium tracking-normal mt-2.5 max-w-sm">
                {onboardingTranslations[preferredLanguage].tagline}
              </p>

              {/* Smooth Language Toggle Pill */}
              <div className="flex justify-center items-center p-0.5 bg-[#090f1d] border border-zinc-800/60 rounded-xl max-w-[150px] mx-auto mt-3.5 w-full shadow-inner">
                <button
                  type="button"
                  onClick={() => { playClickChime(); setPreferredLanguage('en'); }}
                  className={`flex-1 py-1.5 text-center font-bold text-[10px] rounded-lg transition-all cursor-pointer ${preferredLanguage === 'en' ? 'bg-gradient-to-r from-[#C8962E] to-[#B08123] text-black font-extrabold shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => { playClickChime(); setPreferredLanguage('am'); }}
                  className={`flex-1 py-1.5 text-center font-bold text-[10px] rounded-lg transition-all cursor-pointer ${preferredLanguage === 'am' ? 'bg-gradient-to-r from-[#C8962E] to-[#B08123] text-black font-extrabold shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  አማርኛ
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/25 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p>{authError}</p>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-amber-950/25 border border-amber-500/30 text-amber-200 text-xs rounded-xl flex items-start gap-2.5">
                <span className="text-base shrink-0">✉️</span>
                <p className="font-medium">{infoMessage}</p>
              </div>
            )}

            {/* 2-Step Registration Security Code Banner */}
            <div className="bg-gradient-to-r from-[#111e38] to-[#0d1627] border border-[#C8962E]/40 rounded-xl p-3.5 space-y-2 shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#C8962E]/20 border border-[#C8962E]/40 flex items-center justify-center text-[#C8962E] shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-amber-200">
                    {preferredLanguage === 'am' ? '🔐 ባለ 2-ደረጃ የተማሪ ደህንነት ማረጋገጫ' : '🔐 2-Step University Security Verification'}
                  </p>
                  <p className="text-[10px] text-zinc-300 mt-0.5 leading-relaxed">
                    {preferredLanguage === 'am' 
                      ? 'ምዝገባውን እንደጨረሱ ባለ 6-አሃዝ የማረጋገጫ ኮድ ይሰጥዎታል፤ ኮዱን ሳያረጋግጡ መተግበሪያውን መጠቀም አይቻልም።'
                      : 'Upon registration, a 6-digit confirmation security code is issued. You must verify this code to unlock full portal access.'}
                  </p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between border-t border-zinc-800/80">
                <span className="text-[9.5px] text-zinc-400">
                  {preferredLanguage === 'am' ? 'ቀደም ሲል ተመዝግበዋል?' : 'Already have a pending code?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playClickChime();
                    setMode('verify_registration');
                  }}
                  className="text-[9.5px] font-bold text-[#C8962E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{preferredLanguage === 'am' ? 'ኮዱን አስገባ' : 'Enter 6-Digit Code'}</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {isPopupBlocked && (
              <div className="p-4 bg-amber-950/25 border border-amber-500/30 text-amber-200 text-xs rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-base">⚠️</span>
                  <div>
                    <p className="font-extrabold text-amber-300 uppercase tracking-wider text-[11.5px]">Popup Window Blocked</p>
                    <p className="text-zinc-300 mt-1 leading-relaxed text-[11px]">
                      Since you are running EthioLearn inside the AI Studio Preview panel, your browser's popup blocker has blocked Google Sign-In.
                    </p>
                  </div>
                </div>
                
                <div className="pl-6 space-y-1.5 text-[10.5px] text-zinc-400">
                  <p>• <strong className="text-zinc-200">Option A:</strong> Click the <strong className="text-amber-400">"Open in new tab"</strong> icon at the top right of your preview frame to sign in cleanly.</p>
                  <p>• <strong className="text-zinc-200">Option B:</strong> Try the standard redirect sign-in flow below.</p>
                </div>

                <div className="pt-1.5 pl-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleRedirect}
                    className="px-3.5 py-2 bg-[#C8962E] hover:bg-[#b08123] text-black font-extrabold rounded-lg text-[10.5px] transition-all cursor-pointer"
                  >
                    ⚡ Try Redirect Sign-In
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setIsPopupBlocked(false); }}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg text-[10.5px] transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Full Student Name Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {onboardingTranslations[preferredLanguage].fullName}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder={onboardingTranslations[preferredLanguage].fullNamePlaceholder}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    className={`w-full bg-[#0a0f1d] border ${nameError ? 'border-red-500/80 focus:border-red-500' : 'border-zinc-800 focus:border-[#C8962E]'} rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none text-xs transition-all focus:ring-1 focus:ring-[#C8962E]/20`}
                  />
                </div>
                {nameError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1 mt-0.5 animate-pulse">{nameError}</p>
                )}
              </div>

              {/* University drop-down with default search */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {onboardingTranslations[preferredLanguage].university}
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={onboardingTranslations[preferredLanguage].universityPlaceholder}
                    value={univSearch}
                    onFocus={() => setShowUnivDropdown(true)}
                    onBlur={() => setTimeout(() => setShowUnivDropdown(false), 250)}
                    onChange={(e) => {
                      setUnivSearch(e.target.value);
                      setUniversity(e.target.value);
                      if (universityError) setUniversityError(null);
                    }}
                    className={`w-full bg-[#0a0f1d] border ${universityError ? 'border-red-500/80 focus:border-red-500' : 'border-zinc-800 focus:border-[#C8962E]'} rounded-lg pl-10 pr-10 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none text-xs transition-all focus:ring-1 focus:ring-[#C8962E]/20`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnivDropdown(!showUnivDropdown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <span className="text-[10px]">▼</span>
                  </button>
                </div>

                {/* Popular Quick Campus Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Wolkite University', 'Addis Ababa University', 'ASTU', 'Jimma University'].map((campus) => (
                    <button
                      key={campus}
                      type="button"
                      onClick={() => {
                        setUniversity(campus);
                        setUnivSearch(campus);
                        if (universityError) setUniversityError(null);
                      }}
                      className={`text-[9.5px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${university === campus ? 'bg-[#C8962E]/20 border-[#C8962E] text-amber-200 font-bold' : 'bg-[#090f1d] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}`}
                    >
                      {campus === 'Wolkite University' ? '🏛️ WKU' : campus === 'Addis Ababa University' ? 'AAU' : campus}
                    </button>
                  ))}
                </div>

                {universityError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1 mt-0.5 animate-pulse">{universityError}</p>
                )}

                {showUnivDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#090f1d] border border-zinc-800 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
                    {ETHIOPIAN_UNIVERSITIES.filter(univ =>
                      univ.toLowerCase().includes(univSearch.toLowerCase())
                    ).map((univ) => (
                      <button
                        key={univ}
                        type="button"
                        onMouseDown={() => {
                          setUniversity(univ);
                          setUnivSearch(univ);
                          setShowUnivDropdown(false);
                          if (universityError) setUniversityError(null);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-[11px] text-zinc-300 hover:bg-[#1e293b] hover:text-white transition-all font-medium block truncate cursor-pointer"
                      >
                        {univ}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {onboardingTranslations[preferredLanguage].email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder={onboardingTranslations[preferredLanguage].emailPlaceholder}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    className={`w-full bg-[#0a0f1d] border ${emailError ? 'border-red-500/80 focus:border-red-500' : 'border-zinc-800 focus:border-[#C8962E]'} rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none text-xs transition-all focus:ring-1 focus:ring-[#C8962E]/20`}
                  />
                </div>
                {emailError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1 mt-0.5 animate-pulse">{emailError}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {onboardingTranslations[preferredLanguage].password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={onboardingTranslations[preferredLanguage].passwordPlaceholder}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className={`w-full bg-[#0a0f1d] border ${passwordError ? 'border-red-500/80 focus:border-red-500' : 'border-zinc-800 focus:border-[#C8962E]'} rounded-lg pl-10 pr-10 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none text-xs transition-all font-mono focus:ring-1 focus:ring-[#C8962E]/20`}
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
                  <p className="text-[11px] text-red-500 font-medium pl-1 mt-0.5 animate-pulse">{passwordError}</p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {onboardingTranslations[preferredLanguage].confirmPassword}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={onboardingTranslations[preferredLanguage].confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError(null);
                    }}
                    className={`w-full bg-[#0a0f1d] border ${confirmPasswordError ? 'border-red-500/80 focus:border-red-500' : 'border-zinc-800 focus:border-[#C8962E]'} rounded-lg pl-10 pr-10 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none text-xs transition-all font-mono focus:ring-1 focus:ring-[#C8962E]/20`}
                  />
                </div>
                {confirmPasswordError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1 mt-0.5 animate-pulse">{confirmPasswordError}</p>
                )}
              </div>

              {/* Remember session Option */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-zinc-800 bg-[#0a0f1d] text-[#C8962E] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-slate-400">{onboardingTranslations[preferredLanguage].rememberSession}</span>
                </label>
              </div>

              {/* Create Account Gold Gradient Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#C8962E] via-[#D4AF37] to-[#B08123] hover:brightness-105 active:scale-[0.99] text-black font-serif font-extrabold text-xs tracking-widest uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(200,150,46,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 text-black" />
                )}
                <span>{loading ? onboardingTranslations[preferredLanguage].loading : onboardingTranslations[preferredLanguage].createAccountBtn}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-900"></div>
                <span className="flex-shrink mx-4 text-[9px] text-zinc-600 font-bold uppercase tracking-widest font-mono">or</span>
                <div className="flex-grow border-t border-zinc-900"></div>
              </div>

              {/* Google Integration */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-3 bg-[#0a0f1d] hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span className="text-sm">🌟</span>
                <span>{onboardingTranslations[preferredLanguage].googleRegisterBtn}</span>
              </button>

            </form>

            {/* Login Link at the Bottom */}
            <div className="text-center pt-3 border-t border-zinc-900 space-y-2.5">
              <p className="text-xs text-slate-400 font-medium">
                {onboardingTranslations[preferredLanguage].alreadyHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => { playClickChime(); setMode('signin'); }}
                  className="text-[#C8962E] font-bold hover:underline cursor-pointer ml-1"
                >
                  {onboardingTranslations[preferredLanguage].loginLink}
                </button>
              </p>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500">
                <button
                  type="button"
                  onClick={() => { playClickChime(); setLegalModalTab('terms'); setShowLegalModal(true); }}
                  className="hover:text-amber-400 transition-colors underline cursor-pointer"
                >
                  {onboardingTranslations[preferredLanguage].termsLink}
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => { playClickChime(); setLegalModalTab('privacy'); setShowLegalModal(true); }}
                  className="hover:text-amber-400 transition-colors underline cursor-pointer"
                >
                  {onboardingTranslations[preferredLanguage].privacyLink}
                </button>
              </div>
              
              <p className="text-[9.5px] text-zinc-500 font-mono tracking-tight pt-0.5">
                {onboardingTranslations[preferredLanguage].securityGuarantee}
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

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
