/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudentProfile } from '../types';
import LegalPrivacyTermsModal from './LegalPrivacyTermsModal';
import { safeStorage } from '../utils/safeStorage';
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

export default function SplashOnboarding({ onComplete }: SplashOnboardingProps) {
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'am'>(() => {
    return (safeStorage.getItem('ethiolearn_preferred_language') as 'en' | 'am') || 'en';
  });
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <div className="fixed inset-0 bg-[#070D1E] z-50 overflow-y-auto overflow-x-hidden px-3 min-[360px]:px-4 py-6 sm:py-10 relative">
      {/* High-performance pure CSS ambient gradients - ZERO rAF loops, ZERO compositor lag */}
      <div 
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        style={{
          background: 'radial-gradient(circle at 50% 15%, rgba(200, 150, 46, 0.12) 0%, rgba(7, 13, 30, 0.95) 70%, #070D1E 100%)'
        }}
      >
        {/* Subtle Ethiopian geometric accent borders */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-[#C8962E] to-red-500 opacity-60" />
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-[#C8962E] to-red-500 opacity-60" />
      </div>

      <div className="min-h-full w-full flex flex-col items-center justify-center my-auto relative z-10">
        {/* Direct Authentication Portal */}
        <AuthPortalView
          initialMode="signin"
          onComplete={onComplete}
          preferredLanguage={preferredLanguage === "am" ? "am" : "en"}
          onLanguageChange={(newLang) => {
            setPreferredLanguage(newLang);
            safeStorage.setItem('ethiolearn_preferred_language', newLang);
          }}
        />
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
