/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Master Subscription Monetization System
 * Local payment integration for Telebirr, CBE Birr & HelloCash.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, Shield, Clock, Phone, CreditCard, Send, Sparkles, CheckCircle, ExternalLink, Star,
  Zap, Lock, BookOpen, FileText, Smartphone, AlertCircle, ArrowRight, ShieldCheck, Upload, 
  Trash2, Scale, Ticket, Tag, Copy, CheckCheck, Crown, Gift, Calendar
} from 'lucide-react';
import { StudentProfile, SubscriptionTier, PaymentProvider, PaymentRecord } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import { addPaymentRecordLocal } from '../utils/monetization';
import TermsModal from './TermsModal';

interface UpgradeProViewProps {
  profile: StudentProfile;
  language: 'en' | 'am';
  onUpdateProfile: (updated: StudentProfile) => void;
  onClose?: () => void;
  onRequireAuth?: () => void;
  onGoogleSignIn?: () => Promise<void> | void;
}

export default function UpgradeProView({
  profile,
  language,
  onUpdateProfile,
  onClose,
  onRequireAuth,
  onGoogleSignIn
}: UpgradeProViewProps) {
  const isGuest = !profile.isRegistered || profile.id?.startsWith('guest') || profile.email?.includes('guest') || profile.email === 'scholar.guest@ethiolearn.com';
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'tiers' | 'pay' | 'status'>('tiers');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro_semester');
  const [selectedSubjectBundle, setSelectedSubjectBundle] = useState<string>('Critical Thinking');
  
  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>('telebirr');
  const [phoneInput, setPhoneInput] = useState(profile.proPaymentPhone || profile.phone || '');
  const [senderName, setSenderName] = useState(profile.senderName || profile.name || '');
  const [txnRef, setTxnRef] = useState(profile.proPaymentTxn || '');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(profile.proReceiptImage);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(profile.agreedToTerms || false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);


  // Copy to clipboard helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    playClickChime();
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Handle receipt image file select
  const handleReceiptImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert(language === 'en' ? 'Receipt image file must be smaller than 8MB.' : 'የደረሰኝ ፎቶ መጠን ከ 8MB ያነሰ መሆን አለበት።');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptImage(reader.result);
        playSuccessChime();
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Calculate price based on selected tier
  const getTierPrice = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'pro_monthly': 
        return { 
          etb: 99, 
          label: language === 'en' ? '1 Month Pro Pass' : 'የ 1 ወር ፕሮ ፓስ',
          durationDays: 30,
          originalEtb: 149
        };
      case 'pro_semester': 
        return { 
          etb: 199, 
          label: language === 'en' ? 'Semester Pass (All Past Exams & AI Tutor)' : 'የሴሚስተር ፓስ (ፈተናዎች እና AI አስጎብኚ)',
          durationDays: 120,
          originalEtb: 250
        };
      case 'pro_annual': 
        return { 
          etb: 250, 
          label: language === 'en' ? 'Full Academic Year Pro Pass' : 'ሙሉ የትምህርት ዘመን ፕሮ ፓስ',
          durationDays: 365,
          originalEtb: 399
        };
      case 'exam_season_pass': 
        return { 
          etb: 199, 
          label: language === 'en' ? 'Semester Exam Pass' : 'የፈተና ወቅት ፓስ',
          durationDays: 60,
          originalEtb: 250
        };
      case 'subject_bundle': 
        return { 
          etb: 99, 
          label: language === 'en' ? 'Single Subject Pro Pack' : 'የአንድ ትምህርት ጥቅል',
          durationDays: 365,
          originalEtb: 149
        };
      default: 
        return { 
          etb: 0, 
          label: language === 'en' ? 'Free Forever' : 'ለዘላለም ነፃ',
          durationDays: 0,
          originalEtb: 0
        };
    }
  };

  const currentPrice = getTierPrice(selectedTier);
  const finalPayableETB = currentPrice.etb;

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      playFailureChime();
      setShowGuestAuthModal(true);
      return;
    }
    const effectiveTxn = txnRef.trim();

    if (!senderName.trim() || !effectiveTxn) {
      alert(language === 'en' ? 'Please fill in Sender Name and Transaction Reference.' : 'እባክዎ መለያ ስምና የትራንዛክሽን ቁጥሩን በትክክል ያስገቡ።');
      return;
    }

    if (!agreedToTerms) {
      playFailureChime();
      alert(language === 'en' 
        ? 'You must accept the EthioLearn Pro Terms & Academic Rules before submitting your receipt.' 
        : 'ደረሰኝዎን ከማስገባትዎ በፊት እባክዎ የኢትዮ-ለርን ፕሮ የአገልግሎት ውል እና ደንቦችን ይቀበሉ።');
      return;
    }
    
    setIsSubmitting(true);
    playClickChime();

    // Calculate start & end dates based on tier
    const startDate = new Date().toISOString();
    const durationDays = currentPrice.durationDays || 30;
    const end = new Date();
    end.setDate(end.getDate() + durationDays);
    const endDate = end.toISOString();

    // Save payment record
    const paymentRecord: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      userId: profile.email || profile.phone || profile.name || 'student',
      amount: finalPayableETB,
      originalAmount: currentPrice.etb,
      currency: 'ETB',
      provider: paymentMethod,
      providerTxnId: effectiveTxn,
      senderName: senderName.trim(),
      senderPhone: phoneInput.trim(),
      receiptImage: receiptImage,
      agreedToTerms: agreedToTerms,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    addPaymentRecordLocal(paymentRecord);
    
    // Save payment submission details inside student profile
    const updatedProfile: StudentProfile = {
      ...profile,
      tier: selectedTier,
      isPro: profile.isPro,
      proStatus: 'pending',
      subscription_status: profile.subscription_status || 'free',
      proPaymentTxn: effectiveTxn,
      proPaymentDate: startDate,
      proStartDate: startDate,
      proEndDate: endDate,
      senderName: senderName.trim(),
      proPaymentPhone: phoneInput.trim(),
      paymentMethod: paymentMethod,
      proReceiptImage: receiptImage,
      agreedToTerms: true,
      agreedToTermsDate: startDate,
      purchasedBundles: selectedTier === 'subject_bundle' 
        ? Array.from(new Set([...(profile.purchasedBundles || []), selectedSubjectBundle]))
        : profile.purchasedBundles
    };
    
    onUpdateProfile(updatedProfile);
    setIsSubmitting(false);
    setActiveTab('status');
    playSuccessChime();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-white pb-10">
      
      {/* Guest Account Preview Alert Banner */}
      {isGuest && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-950/50 via-[#101a2e] to-emerald-950/40 border-2 border-amber-500/50 p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-serif font-black text-amber-300">
                    {language === 'am' ? 'የእንግዳ መለያ (Guest Account) ማየት ብቻ ነው' : 'Guest Accounts Are Preview-Only'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                    {language === 'am' ? 'Gmail ያስፈልጋል' : 'GMAIL REQUIRED'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {language === 'am'
                    ? 'የእንግዳ መለያ የትምህርት ይዘቶችንና ዋጋዎችን ለማየት ብቻ ነው። የፕሮ አባልነት ለማንሳት እባክዎ በእውነተኛ የGoogle (Gmail) አካውንትዎ ይግቡ ወይም ይመዝገቡ።'
                    : 'Guest mode lets you browse and explore plans. To upgrade to EthioLearn Pro, keep your past exams and AI tutor forever, and confirm your payment, you must sign in or register with your real Gmail account.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              {onGoogleSignIn && (
                <button
                  type="button"
                  onClick={async () => {
                    playClickChime();
                    await onGoogleSignIn();
                  }}
                  className="flex-1 sm:flex-none py-2 px-3.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>{language === 'am' ? 'በGoogle ግባ' : 'Sign in with Google'}</span>
                </button>
              )}

              {onRequireAuth && (
                <button
                  type="button"
                  onClick={() => {
                    playClickChime();
                    onRequireAuth();
                  }}
                  className="flex-1 sm:flex-none py-2 px-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition"
                >
                  <span>{language === 'am' ? 'መለያ ፍጠር / ግባ' : 'Sign In / Register'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0A1128] border border-amber-500/30 shadow-2xl p-6 md:p-8">
        <div className="absolute top-0 right-0 p-8 opacity-5 leading-none font-serif text-9xl select-none">PRO</div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 font-serif text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              {language === 'en' ? 'Official University Pro Subscriptions' : 'የዩኒቨርሲቲ ፕሮ አባልነት እና የቅናሽ ኩፖን'}
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight leading-tight">
              {language === 'en' ? 'Unlock Complete Academic Access' : 'ሙሉ የዩኒቨርሲቲ ፈተናዎችን እና ሞጁሎችን ይክፈቱ'}
            </h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-sans">
              {language === 'en' 
                ? 'Affordable student plans tailored for Ethiopian universities. Instant activation via Telebirr & CBE Birr (Commercial Bank of Ethiopia).'
                : 'ለኢትዮጵያ ዩኒቨርሲቲ ተማሪዎች የተዘጋጁ ቅናሾች። በቴሌብር እና በኢትዮጵያ ንግድ ባንክ (CBE) ፈጣን ማግበር።'}
            </p>
          </div>

          <div className="flex flex-col items-center bg-[#111C35] backdrop-blur-md rounded-2xl p-5 border border-amber-500/30 min-w-[220px] shrink-0 text-center shadow-lg">
            <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
              {language === 'en' ? 'Payable Amount' : 'የሚከፈል ክፍያ'}
            </span>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black font-serif text-amber-400">{finalPayableETB}</span>
              <span className="text-sm font-black text-amber-300">ETB</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">
              {currentPrice.label}
            </span>
            
            <div className="mt-3 pt-3 border-t border-slate-800 w-full text-xs font-bold">
              {profile.isPro ? (
                <div className="flex items-center justify-center gap-1 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>{language === 'en' ? 'Pro Member Active' : 'የፕሮ አባልነት ነቅቷል'}</span>
                </div>
              ) : (
                <span className="text-amber-400/90 text-[11px] flex items-center justify-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Telebirr • CBE Birr • HelloCash' : 'በቴሌብር • በንግድ ባንክ • በሄሎካሽ'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 pb-3 gap-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => { playClickChime(); setActiveTab('tiers'); }}
          className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'tiers' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {language === 'en' ? '1. Plans & Pricing' : '1. የአባልነት አማራጮች'}
        </button>

        <button
          onClick={() => { playClickChime(); setActiveTab('pay'); }}
          className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'pay' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          {language === 'en' ? '2. Direct Payment' : '2. የክፍያ ሂደት'}
        </button>

        <button
          onClick={() => { playClickChime(); setActiveTab('status'); }}
          className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'status' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          {language === 'en' ? '3. Verification Status' : '3. የክፍያ ማረጋገጫ'}
          {profile.proStatus === 'pending' && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SUBSCRIPTION TIERS CARDS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'tiers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* TIER 1: FREE TIER */}
            <div 
              onClick={() => setSelectedTier('free')}
              className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedTier === 'free' 
                  ? 'border-amber-400 bg-slate-900 shadow-lg' 
                  : 'border-slate-800 bg-[#0A1128]/80 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Standard</span>
                <h3 className="text-lg font-serif font-black">{language === 'en' ? 'Free Plan' : 'ነፃ እቅድ'}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-black font-serif text-white">0</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">ETB</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Free Freshman Module Reading</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Community Question Bank Access</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Manual Question Creator</li>
                  <li className="flex items-center gap-2 text-slate-500"><Lock className="w-4 h-4 shrink-0" /> Offline PDF Download Pack</li>
                </ul>
              </div>
              <button 
                onClick={() => setSelectedTier('free')}
                className="mt-6 w-full py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                {selectedTier === 'free' ? (language === 'en' ? 'Selected' : 'ተመርጧል') : (language === 'en' ? 'Select Free' : 'ነፃ ይምረጡ')}
              </button>
            </div>

            {/* TIER 2: PRO MONTHLY */}
            <div 
              onClick={() => setSelectedTier('pro_monthly')}
              className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedTier === 'pro_monthly' 
                  ? 'border-amber-400 bg-[#111C35] shadow-xl' 
                  : 'border-slate-800 bg-[#0A1128]/80 hover:border-amber-500/50'
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">Monthly Pass</span>
                <h3 className="text-lg font-serif font-black text-amber-300">{language === 'en' ? 'Pro Monthly' : 'ፕሮ ወርሃዊ'}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-black font-serif text-amber-400">99</span>
                  <span className="text-xs font-bold text-amber-300 ml-1">ETB / Month</span>
                  <span className="text-[10px] text-slate-500 line-through ml-2">149 ETB</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> All 19 Freshman Modules</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Past University Exams & Solvers</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> 1-Click Offline Caching</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> 30 Days Flexible Access</li>
                </ul>
              </div>
              <button 
                onClick={() => {
                  playClickChime();
                  if (isGuest) {
                    setShowGuestAuthModal(true);
                    return;
                  }
                  setSelectedTier('pro_monthly');
                  setActiveTab('pay');
                }}
                className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition border border-slate-700"
              >
                {language === 'en' ? 'Select Monthly (99 ETB)' : 'ወርሃዊ ይምረጡ (99 ብር)'}
              </button>
            </div>

            {/* TIER 3: PRO SEMESTER (RECOMMENDED) */}
            <div 
              onClick={() => setSelectedTier('pro_semester')}
              className={`rounded-2xl p-5 border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedTier === 'pro_semester' 
                  ? 'border-amber-400 bg-gradient-to-b from-amber-500/15 via-[#111C35] to-[#111C35] shadow-2xl ring-2 ring-amber-400/30' 
                  : 'border-amber-500/50 bg-[#0A1128]/80 hover:border-amber-400'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md">
                {language === 'en' ? 'Best Value • Save 50%' : 'ምርጥ ዋጋ • 50% ቅናሽ'}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1 mt-1">4 Months Full Term</span>
                <h3 className="text-lg font-serif font-black text-amber-300">{language === 'en' ? 'Semester Pass' : 'የሴሚስተር ፓስ'}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-black font-serif text-amber-400">199</span>
                  <span className="text-xs font-bold text-amber-300 ml-1">ETB / Semester</span>
                  <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Only ~50 ETB / month</p>
                </div>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Full University Semester Access</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Midterm & Final Exam Archives</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Complete Digital Bookstore & PDFs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400 shrink-0" /> Priority Campus Support</li>
                </ul>
              </div>
              <button 
                onClick={() => {
                  playClickChime();
                  if (isGuest) {
                    setShowGuestAuthModal(true);
                    return;
                  }
                  setSelectedTier('pro_semester');
                  setActiveTab('pay');
                }}
                className="mt-6 w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg transition active:scale-98"
              >
                {language === 'en' ? 'Get Semester Pass (199 ETB)' : 'የሴሚስተር ፓስ ይውሰዱ (199 ብር)'}
              </button>
            </div>

            {/* TIER 4: ANNUAL ACADEMIC YEAR PASS */}
            <div 
              onClick={() => setSelectedTier('pro_annual')}
              className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedTier === 'pro_annual' 
                  ? 'border-emerald-400 bg-[#111C35] shadow-lg' 
                  : 'border-slate-800 bg-[#0A1128]/80 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">Full 12 Months</span>
                <h3 className="text-lg font-serif font-black text-emerald-300">{language === 'en' ? 'Academic Year Pass' : 'የዓመታዊ እቅድ'}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-black font-serif text-emerald-400">250</span>
                  <span className="text-xs font-bold text-emerald-300 ml-1">ETB / Year</span>
                  <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Only ~21 ETB / month</p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Freshman + Sophomore Courses</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> National Exit Exam Series</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited Offline Sync</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Maximum Savings (69% Off)</li>
                </ul>
              </div>
              <button 
                onClick={() => {
                  playClickChime();
                  if (isGuest) {
                    setShowGuestAuthModal(true);
                    return;
                  }
                  setSelectedTier('pro_annual');
                  setActiveTab('pay');
                }}
                className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition shadow-md"
              >
                {language === 'en' ? 'Select Annual (250 ETB)' : 'ዓመታዊ ይምረጡ (250 ብር)'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TELEBIRR / CBE CHANNELS & ACTIVATION                               */}
      {/* ========================================================================= */}
      {activeTab === 'pay' && isGuest ? (
        <div className="bg-[#0A1128] border-2 border-amber-500/50 rounded-2xl p-6 sm:p-10 text-center max-w-xl mx-auto space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-serif font-black text-white">
              {language === 'am' ? 'የእውነተኛ Gmail መለያ ያስፈልጋል' : 'Gmail Account Required to Upgrade'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              {language === 'am'
                ? 'የእንግዳ መለያዎች የክፍያ ደረሰኝ ማስገባት አይችሉም። ክፍያዎ ከቋሚ የተማሪ መዝገብዎ ጋር እንዲገናኝ እና የፕሮ አገልግሎትዎ እንዳይቋረጥ እባክዎን በእውነተኛ የGoogle (Gmail) አካውንትዎ ይግቡ ወይም ይመዝገቡ።'
                : 'Guest accounts cannot submit payment receipts. Subscriptions must be tied to a verified student Google / Gmail account so your payment verification and lifetime academic records are preserved.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            {onGoogleSignIn && (
              <button
                type="button"
                onClick={async () => {
                  playClickChime();
                  await onGoogleSignIn();
                }}
                className="w-full sm:w-auto py-3 px-5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg transition"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{language === 'am' ? 'በGoogle አካውንት ግባ' : 'Sign in with Google'}</span>
              </button>
            )}
            {onRequireAuth && (
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  onRequireAuth();
                }}
                className="w-full sm:w-auto py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition"
              >
                <span>{language === 'am' ? 'መለያ ፍጠር ወይም ግባ' : 'Create Account / Sign In'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => { playClickChime(); setActiveTab('tiers'); }}
              className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition"
            >
              <span>{language === 'am' ? 'ወደ እቅዶች ተመለስ' : 'Back to Plans'}</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'pay' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Transfer details */}
          <div className="lg:col-span-7 bg-[#0A1128] border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-serif font-black text-amber-400 uppercase tracking-tight flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                {language === 'en' ? 'Step 1: Choose Payment Channel' : 'ደረጃ 1፡ የክፍያ መንገድ ይምረጡ'}
              </h3>
            </div>

            {/* Price Breakdown Badge */}
            <div className="p-4 bg-[#111C35] rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">{language === 'en' ? 'Selected Package:' : 'የተመረጠው ፓኬጅ፦'}</p>
                  <p className="text-sm font-black font-serif text-white uppercase">{selectedTier.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-serif text-amber-400">{currentPrice.etb} ETB</span>
                  <p className="text-[10px] text-slate-400">{currentPrice.label}</p>
                </div>
              </div>
            </div>

            {/* Provider Selector Grid (Telebirr & CBE) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {language === 'en' ? 'Select Payment Channel' : 'የክፍያ መንገድ ይምረጡ'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { playClickChime(); setPaymentMethod('telebirr'); }}
                    className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === 'telebirr'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-[#111C35] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 text-[10px] font-black text-white bg-blue-600 rounded">telebirr</span>
                      {paymentMethod === 'telebirr' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-bold text-slate-400">Telebirr Mobile</p>
                      <p className="text-sm font-mono font-black text-white">+251906046518</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { playClickChime(); setPaymentMethod('cbe_birr'); }}
                    className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === 'cbe_birr'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-[#111C35] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 text-[10px] font-black text-white bg-purple-700 rounded">CBE Bank</span>
                      {paymentMethod === 'cbe_birr' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-bold text-slate-400">Commercial Bank Account</p>
                      <p className="text-xs font-mono font-black text-white">1000410224643</p>
                    </div>
                  </button>
                </div>

                {/* Account Details & 1-Click Copy Box */}
                <div className="p-4 bg-[#111C35] rounded-xl border border-slate-800 text-xs space-y-2.5 font-mono">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      {paymentMethod === 'telebirr' ? 'Telebirr Receiver Number' : 'CBE Receiver Account'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentMethod === 'telebirr' ? '0906046518' : '1000410224643', 'account')}
                      className="px-2.5 py-1 rounded bg-[#0B1228] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 cursor-pointer transition text-[11px]"
                    >
                      {copiedField === 'account' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'account' ? (language === 'en' ? 'Copied!' : 'ተቀድቷል!') : (language === 'en' ? 'Copy Number' : 'ቁጥሩን ቅዳ')}</span>
                    </button>
                  </div>
                  <p className="text-slate-300">
                    Account Holder: <span className="font-extrabold text-white">Abreham Alemayehu</span>
                  </p>
                  <p className="text-amber-400 font-bold">
                    Amount to Send: <span className="text-white font-mono text-sm">{finalPayableETB} ETB</span>
                  </p>
                  <p className="text-slate-400 text-[11px] font-sans">
                    {language === 'en' 
                      ? 'Official partner verification. Verify receiver name shows "Abreham Alemayehu" before sending.' 
                      : 'ከመላክዎ በፊት የላኪው ስም "አብርሃም አለማየሁ" መሆኑን ያረጋግጡ።'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Submission form */}
          <div className="lg:col-span-5 bg-[#0A1128] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-serif font-black text-amber-400 uppercase tracking-tight flex items-center gap-2">
              <Send className="w-5 h-5" />
              {language === 'en' ? 'Step 2: Submit Txn Reference' : 'ደረጃ 2፡ የትራንዛክሽን ቁጥር ያስገቡ'}
            </h3>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  {language === 'en' ? 'Student Full Name' : 'የተማሪው ሙሉ ስም'} *
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Abreham Yohannes"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-slate-700 text-xs text-white focus:ring-1 focus:ring-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  {language === 'en' ? 'Phone Number (Telebirr/CBE)' : 'የስልክ ቁጥር'}
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. 0912345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-slate-700 text-xs text-white focus:ring-1 focus:ring-amber-400 outline-none"
                />
              </div>

              {finalPayableETB > 0 ? (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'en' ? 'Transaction ID / Reference Number' : 'የትራንዛክሽን መለያ ቁጥር'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    placeholder="e.g. FT16A1926B or Telebirr Txn No"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-slate-700 text-xs text-white font-mono focus:ring-1 focus:ring-amber-400 outline-none"
                  />
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold">{language === 'en' ? 'Full Scholarship Pass Active' : 'ሙሉ የስኮላርሺፕ ፓስ ነቅቷል'}</p>
                    <p className="text-[11px] text-slate-300">{language === 'en' ? 'No payment transaction reference required. Click below to activate.' : 'የትራንዛክሽን መለያ አያስፈልግም። ከታች ያለውን ይጫኑ።'}</p>
                  </div>
                </div>
              )}

              {/* Receipt Image / Screenshot Upload (only if payment is needed) */}
              {finalPayableETB > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{language === 'en' ? 'Attach Payment Receipt / Screenshot' : 'የክፍያ ማረጋገጫ ደረሰኝ ፎቶ'}</span>
                    <span className="text-[10px] text-amber-400 font-normal">{language === 'en' ? '(Recommended)' : '(ይመረጣል)'}</span>
                  </label>

                  {receiptImage ? (
                    <div className="relative p-2 bg-[#111C35] border border-amber-500/40 rounded-xl flex items-center gap-3">
                      <img 
                        src={receiptImage} 
                        alt="Payment Receipt" 
                        className="w-14 h-14 object-cover rounded-lg border border-slate-700 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {language === 'en' ? 'Receipt Attached' : 'የደረሰኝ ፎቶ ተያይዟል'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">Ready for admin verification</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReceiptImage(undefined)}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                        title="Remove receipt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-xl bg-[#111C35]/60 hover:bg-[#111C35] transition-all cursor-pointer text-center group">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-amber-400 mb-1 transition-colors" />
                      <span className="text-xs font-bold text-slate-300 group-hover:text-amber-300">
                        {language === 'en' ? 'Click to upload receipt image' : 'የደረሰኝ ፎቶ ለመጫን እዚህ ይጫኑ'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WEBP (Max 8MB)</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleReceiptImageChange} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Terms and Academic Integrity Agreement */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400 cursor-pointer w-4 h-4"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed font-sans">
                    {language === 'en' ? 'I agree to the ' : 'በኢትዮ-ለርን '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="text-amber-400 underline font-bold hover:text-amber-300 inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Scale className="w-3 h-3" />
                      {language === 'en' ? 'EthioLearn Pro Academic Rules & Terms' : 'የአገልግሎት ውል እና የጥናት ደንቦች'}
                    </button>
                    {language === 'en' ? '.' : ' እስማማለሁ።'}
                  </span>
                </label>
              </div>

              {/* Submit / Activate Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 ${
                  finalPayableETB === 0
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black'
                }`}
              >
                {finalPayableETB === 0 ? (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                    {language === 'en' ? 'Activate Pro Instantly (0 ETB Free)' : 'ወዲያውኑ በነፃ አግብር (0 ብር)'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {language === 'en' 
                      ? `Submit Receipt (${finalPayableETB} ETB)` 
                      : `ደረሰኝ እና ማረጋገጫ ያስገቡ (${finalPayableETB} ብር)`}
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VERIFICATION STATUS & ACTIVE BENEFITS                              */}
      {/* ========================================================================= */}
      {activeTab === 'status' && (
        <div className="bg-[#0A1128] border border-slate-800 rounded-2xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            {profile.isPro ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Crown className="w-8 h-8" />
              </div>
            ) : profile.proStatus === 'pending' ? (
              <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <Ticket className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h4 className="text-xl font-serif font-black text-white">
              {profile.isPro 
                ? (language === 'en' ? 'EthioLearn Pro Active!' : 'የኢትዮ-ለርን ፕሮ አባልነትዎ ነቅቷል!') 
                : profile.proStatus === 'pending'
                  ? (language === 'en' ? 'Payment Under Verification' : 'ክፍያው በመረጋገጥ ላይ ነው')
                  : (language === 'en' ? 'No Active Subscription' : 'ንቁ የአባልነት ክፍያ የለም')}
            </h4>
            
            {profile.isPro ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 space-y-2">
                <p className="font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'en' ? 'Unlimited Access Unlocked' : 'ያልተገደበ አገልግሎት ተከፍቷል'}</span>
                </p>
                <p className="text-slate-300">
                  {language === 'en' 
                    ? `Your Pro plan is valid through: ${profile.proEndDate ? new Date(profile.proEndDate).toLocaleDateString() : 'Active'}.` 
                    : `የፕሮ አገልግሎትዎ የሚያበቃበት ቀን፦ ${profile.proEndDate ? new Date(profile.proEndDate).toLocaleDateString() : 'በርቷል'}።`}
                </p>
              </div>
            ) : profile.proStatus === 'pending' ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-3">
                <p className="font-mono">Txn Ref: <b>{profile.proPaymentTxn}</b></p>
                <p className="font-sans">
                  {language === 'en'
                    ? "Our admin team is checking the Telebirr/CBE bank ledger. Approvals take ~15-30 mins."
                    : "የአስተዳዳሪ ቡድናችን የሒሳብ መዝገብ በመፈተሽ ላይ ነው። ብዙውን ጊዜ 15-30 ደቂቃ ይወስዳል።"}
                </p>

                {(profile.proReceiptImage || receiptImage) && (
                  <div className="pt-2 border-t border-amber-500/20 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {language === 'en' ? 'Submitted Payment Receipt:' : 'የተላከ የክፍያ ደረሰኝ፦'}
                    </p>
                    <img 
                      src={profile.proReceiptImage || receiptImage} 
                      alt="Submitted Receipt" 
                      className="max-h-48 object-contain rounded-xl border border-amber-500/30 shadow-md bg-slate-950 p-1" 
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 font-sans">
                  {language === 'en' 
                    ? 'Upgrade now with Telebirr or CBE Birr to unlock unlimited AI Tutoring and all university past exams.' 
                    : 'ለሁሉም የዩኒቨርሲቲ ኮርሶች ያለገደብ የ AI አስጎብኚ እና የፈተናዎችን ማህደር ለመክፈት በቴሌብር ወይም በንግድ ባንክ አሁኑኑ ያሻሽሉ።'}
                </p>
                <button
                  onClick={() => setActiveTab('pay')}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  {language === 'en' ? 'Proceed to Payment' : 'ክፍያ ይፈጽሙ'}
                </button>
              </div>
            )}
          </div>

          {/* Security & Admin Confirmation Notice */}
          <div className="pt-6 border-t border-slate-800 max-w-md mx-auto text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Protected Administrator Verification' : 'በአስተዳዳሪ ብቻ የሚረጋገጥ'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              {language === 'en'
                ? 'All subscriptions and payments are verified securely by our academic administration team.'
                : 'ሁሉም የፕሮ አባልነቶች እና ክፍያዎች በአስተዳዳሪዎች በጥንቃቄ የተረጋገጡ ናቸው።'}
            </p>
          </div>
        </div>
      )}

      {/* Guest Upgrade Authentication Required Modal */}
      {showGuestAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#0e1628] border-2 border-amber-500/50 rounded-2xl max-w-md w-full p-6 space-y-5 text-center shadow-2xl relative">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-serif font-black text-white">
                {language === 'am' ? 'ለማሻሻል እውነተኛ የGmail መለያ ያስፈልጋል' : 'Real Gmail Account Required'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'am'
                  ? 'የእንግዳ መለያ (Guest account) ለማየት ብቻ የተፈቀደ ነው። የፕሮ አባልነትዎን ለማንቃትና ከቋሚ የተማሪ መዝገብዎ ጋር ለማገናኘት እባክዎን በእውነተኛ የGoogle (Gmail) አካውንትዎ ይግቡ ወይም ይመዝገቡ።'
                  : 'Guest accounts can only explore and view materials. To upgrade to EthioLearn Pro, please sign in or register with your real Gmail account.'}
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {onGoogleSignIn && (
                <button
                  type="button"
                  onClick={async () => {
                    playClickChime();
                    setShowGuestAuthModal(false);
                    await onGoogleSignIn();
                  }}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2.5 cursor-pointer shadow-md transition"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>{language === 'am' ? 'በGoogle (Gmail) ቀጥል' : 'Continue with Google (Gmail)'}</span>
                </button>
              )}

              {onRequireAuth && (
                <button
                  type="button"
                  onClick={() => {
                    playClickChime();
                    setShowGuestAuthModal(false);
                    onRequireAuth();
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
                >
                  <span>{language === 'am' ? 'አካውንት ፍጠር ወይም ግባ' : 'Register or Sign In with Email'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setShowGuestAuthModal(false);
                }}
                className="w-full py-2 px-4 bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition"
              >
                <span>{language === 'am' ? 'እንደ እንግዳ ማየት ቀጥል' : 'Keep Browsing as Guest'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Academic Rules Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        language={language}
        onAcceptAndClose={() => {
          setAgreedToTerms(true);
          setShowTermsModal(false);
        }}
      />

    </div>
  );
}
