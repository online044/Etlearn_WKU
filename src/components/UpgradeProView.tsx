import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, Shield, Clock, Phone, CreditCard, Send, Sparkles, CheckCircle, ExternalLink, Star,
  Zap, Lock, BookOpen, FileText, Smartphone, AlertCircle, ArrowRight, ShieldCheck, Upload, Image as ImageIcon, Trash2, Scale
} from 'lucide-react';
import { StudentProfile, SubscriptionTier, PaymentProvider, PaymentRecord } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import { addPaymentRecordLocal, getPaymentHistoryLocal } from '../utils/monetization';
import TermsModal from './TermsModal';

interface UpgradeProViewProps {
  profile: StudentProfile;
  language: 'en' | 'am';
  onUpdateProfile: (updated: StudentProfile) => void;
  onClose?: () => void;
}

export default function UpgradeProView({
  profile,
  language,
  onUpdateProfile,
  onClose
}: UpgradeProViewProps) {
  const [activeTab, setActiveTab] = useState<'tiers' | 'pay' | 'status'>('tiers');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro_monthly');
  const [selectedSubjectBundle, setSelectedSubjectBundle] = useState<string>('Emerging Technologies');
  
  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>('telebirr');
  const [phoneInput, setPhoneInput] = useState(profile.proPaymentPhone || profile.phone || '');
  const [senderName, setSenderName] = useState(profile.senderName || profile.name || '');
  const [txnRef, setTxnRef] = useState(profile.proPaymentTxn || '');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(profile.proReceiptImage);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(profile.agreedToTerms || false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      case 'pro_monthly': return { etb: 200, label: language === 'en' ? 'Per Semester / Month' : 'በአንድ ሴሚስተር / ወር' };
      case 'exam_season_pass': return { etb: 100, label: language === 'en' ? '3 Weeks Exam Pass' : 'የ 3 ሳምንታት ፈተና ፓስ' };
      case 'subject_bundle': return { etb: 80, label: language === 'en' ? 'One-time Pack' : 'አንድ ጊዜ ክፍያ' };
      default: return { etb: 0, label: language === 'en' ? 'Free Forever' : 'ለዘላለም ነፃ' };
    }
  };

  const currentPrice = getTierPrice(selectedTier);
  const finalPayableETB = currentPrice.etb;

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !txnRef.trim()) {
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
    let endDate: string | undefined = undefined;
    
    if (selectedTier === 'pro_monthly') {
      const end = new Date();
      end.setDate(end.getDate() + 30); // 30 days
      endDate = end.toISOString();
    } else if (selectedTier === 'exam_season_pass') {
      const end = new Date();
      end.setDate(end.getDate() + 21); // 21 days (3 weeks)
      endDate = end.toISOString();
    }

    // Save payment record with pending status for administrator review
    const paymentRecord: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      userId: profile.email || profile.name || 'student',
      amount: finalPayableETB,
      originalAmount: currentPrice.etb,
      currency: 'ETB',
      provider: paymentMethod,
      providerTxnId: txnRef.trim(),
      senderName: senderName.trim(),
      senderPhone: phoneInput.trim(),
      receiptImage: receiptImage,
      agreedToTerms: agreedToTerms,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    addPaymentRecordLocal(paymentRecord);
    
    // Save payment submission details inside student profile (pending admin review)
    const updatedProfile: StudentProfile = {
      ...profile,
      tier: selectedTier,
      isPro: false, // Pending verification by admin
      proStatus: 'pending',
      proPaymentTxn: txnRef.trim(),
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
    <div className="max-w-5xl mx-auto space-y-6 text-white">
      
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a1128] border border-amber-500/30 shadow-2xl p-6 md:p-8">
        <div className="absolute top-0 right-0 p-8 opacity-5 leading-none font-serif text-9xl select-none">PRO</div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-serif text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              {language === 'en' ? 'EthioLearn Pro Monetization System' : 'የኢትዮ-ለርን ፕሮ የአባልነት አገልግሎት'}
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight leading-tight">
              {language === 'en' ? 'Invest in Your Academic Excellence' : 'በትምህርትዎ ውጤታማነት ላይ ይዋዕሉ'}
            </h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              {language === 'en' 
                ? 'Select a plan tailored for Ethiopian university students. Unlock unlimited Ask Teacher guidance, past exam solvers, complete subject notes, and offline access via Telebirr or CBE Birr.'
                : 'ለኢትዮጵያ ዩኒቨርሲቲ ተማሪዎች የተዘጋጁ አማራጮች። ያልተገደበ መምህሩን ጠይቅ (Ask Teacher)፣ የPast Exam መፍትሔዎች፣ የተሟሉ ሞጁሎች እና ኦፍላይን ፋይሎችን በቴሌብር ወይም በሲቢኢ ብር ያግኙ።'}
            </p>
          </div>

          <div className="flex flex-col items-center bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-amber-500/20 min-w-[220px] shrink-0 text-center">
            <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
              {language === 'en' ? 'Selected Tier Price' : 'የተመረጠው ክፍያ'}
            </span>
            <div className="mt-1">
              <span className="text-3xl font-black font-serif text-amber-400">{currentPrice.etb}</span>
              <span className="text-sm font-black text-amber-300 ml-1">ETB</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">
              {currentPrice.label}
            </span>
            
            <div className="mt-3 pt-3 border-t border-slate-800 w-full text-xs text-emerald-400 font-bold">
              {profile.isPro ? (
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>{language === 'en' ? 'Pro Access Active' : 'ፕሮ አባልነት ነቅቷል'}</span>
                </div>
              ) : (
                <span className="text-slate-300 text-[11px]">
                  {language === 'en' ? 'Pay with Telebirr / CBE Birr' : 'በቴሌብር ወይም በሲቢኢ ብር ይክፈሉ'}
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
          {language === 'en' ? '1. Subscription Tiers' : '1. የአባልነት አማራጮች'}
        </button>

        <button
          onClick={() => { playClickChime(); setActiveTab('pay'); }}
          className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'pay' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          {language === 'en' ? '2. Telebirr / CBE Channels' : '2. የክፍያ መንገዶች'}
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

      {/* TAB 1: SUBSCRIPTION TIERS CARDS */}
      {activeTab === 'tiers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* TIER 1: FREE TIER */}
            <div 
              onClick={() => setSelectedTier('free')}
              className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedTier === 'free' 
                  ? 'border-amber-400 bg-slate-900 shadow-lg' 
                  : 'border-slate-800 bg-[#0a1128]/80 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Standard</span>
                <h3 className="text-lg font-serif font-black">{language === 'en' ? 'Free Tier' : 'ነፃ አባልነት'}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-black font-serif text-white">0</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">ETB</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 5 Ask Teacher Qs / day</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Basic Flashcards</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Limited Quiz Access</li>
                  <li className="flex items-center gap-2 text-slate-500"><Lock className="w-4 h-4" /> No PDF Downloads</li>
                </ul>
              </div>
              <button 
                onClick={() => setSelectedTier('free')}
                className="mt-6 w-full py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider"
              >
                {selectedTier === 'free' ? (language === 'en' ? 'Selected' : 'ተመርጧል') : (language === 'en' ? 'Select Free' : 'ይምረጡ')}
              </button>
            </div>

            {/* TIER 2: PRO MONTHLY (RECOMMENDED) */}
            <div 
              onClick={() => setSelectedTier('pro_monthly')}
              className={`rounded-2xl p-5 border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedTier === 'pro_monthly' 
                  ? 'border-amber-400 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 shadow-xl' 
                  : 'border-amber-500/40 bg-[#0a1128]/80 hover:border-amber-400'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md">
                {language === 'en' ? 'Most Popular' : 'በብዛት የተመረጠ'}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1 mt-1">Full Access</span>
                <h3 className="text-lg font-serif font-black text-amber-300">{language === 'en' ? 'PRO Monthly' : 'ፕሮ ወርሃዊ'}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-black font-serif text-amber-400">200</span>
                  <span className="text-xs font-bold text-amber-300 ml-1">ETB / Month</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> <b>UNLIMITED</b> Ask Teacher Qs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Offline PDF Downloads</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Full Past Exam Solvers</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Advanced Analytics</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Zero Advertisements</li>
                </ul>
              </div>
              <button 
                onClick={() => { playClickChime(); setSelectedTier('pro_monthly'); setActiveTab('pay'); }}
                className="mt-6 w-full py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md"
              >
                {language === 'en' ? 'Proceed with Pro' : 'በፕሮ ይቀጥሉ'}
              </button>
            </div>

            {/* TIER 3: EXAM SEASON PASS */}
            <div 
              onClick={() => setSelectedTier('exam_season_pass')}
              className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedTier === 'exam_season_pass' 
                  ? 'border-amber-400 bg-slate-900 shadow-lg' 
                  : 'border-slate-800 bg-[#0a1128]/80 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">Time-Limited</span>
                <h3 className="text-lg font-serif font-black text-emerald-300">{language === 'en' ? 'Exam Season Pass' : 'የፈተና ወቀት ፓስ'}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-black font-serif text-emerald-400">100</span>
                  <span className="text-xs font-bold text-emerald-300 ml-1">ETB / 3 Wks</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Same perks as PRO</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 3 Weeks Exam Boost</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Auto-expires (no auto-renew)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Lower entry price</li>
                </ul>
              </div>
              <button 
                onClick={() => { playClickChime(); setSelectedTier('exam_season_pass'); setActiveTab('pay'); }}
                className="mt-6 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                {language === 'en' ? 'Get Season Pass' : 'ፓሱን ይውሰዱ'}
              </button>
            </div>

            {/* TIER 4: ONE-TIME SUBJECT BUNDLE */}
            <div 
              onClick={() => setSelectedTier('subject_bundle')}
              className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedTier === 'subject_bundle' 
                  ? 'border-amber-400 bg-slate-900 shadow-lg' 
                  : 'border-slate-800 bg-[#0a1128]/80 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block mb-1">Single Subject</span>
                <h3 className="text-lg font-serif font-black text-indigo-300">{language === 'en' ? 'Subject Pack' : 'የትምህርት ፓክ'}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-black font-serif text-indigo-400">80</span>
                  <span className="text-xs font-bold text-indigo-300 ml-1">ETB / Pack</span>
                </div>
                <div className="mb-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Subject:</label>
                  <select
                    value={selectedSubjectBundle}
                    onChange={(e) => setSelectedSubjectBundle(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-white"
                  >
                    {profile.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Notes + Quizzes</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Dedicated AI Sessions</li>
                </ul>
              </div>
              <button 
                onClick={() => { playClickChime(); setSelectedTier('subject_bundle'); setActiveTab('pay'); }}
                className="mt-6 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                {language === 'en' ? 'Buy Subject Pack' : 'ፓክ ይግዙ'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: TELEBIRR / CBE CHANNELS & SUBMISSION FORM */}
      {activeTab === 'pay' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Transfer details */}
          <div className="lg:col-span-7 bg-[#0a1128] border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-serif font-black text-amber-400 uppercase tracking-tight flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              {language === 'en' ? 'Step 1: Send Mobile Money Transfer' : 'ደረጃ 1፡ በሞባይል ገንዘብ ያስተላልፉ'}
            </h3>

            {/* Price Badge & Official Verification Notice */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">{language === 'en' ? 'Selected Package:' : 'የተመረጠው ፓኬጅ:'}</p>
                  <p className="text-sm font-black font-serif text-white uppercase">{selectedTier.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-serif text-amber-400">{currentPrice.etb} ETB</span>
                  <p className="text-[10px] text-slate-400">{currentPrice.label}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {language === 'en'
                    ? 'Official fixed rate. Pro membership is activated strictly after administrator bank verification.'
                    : 'ትክክለኛ ዋጋ። ክፍያው በአስተዳዳሪው የባንክ መዝገብ ከተረጋገጠ በኋላ ብቻ አካውንቱ ይበራል።'}
                </span>
              </div>
            </div>

            {/* Provider Selector Grid */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { playClickChime(); setPaymentMethod('telebirr'); }}
                className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between ${
                  paymentMethod === 'telebirr'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 text-[9px] font-black text-white bg-blue-600 rounded">telebirr</span>
                  {paymentMethod === 'telebirr' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-slate-400">Telebirr Mobile Number</p>
                  <p className="text-sm font-mono font-black text-white">+251906046518</p>
                </div>
              </button>

              <button
                onClick={() => { playClickChime(); setPaymentMethod('cbe_birr'); }}
                className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between ${
                  paymentMethod === 'cbe_birr'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 text-[9px] font-black text-white bg-slate-800 rounded">CBE Bank</span>
                  {paymentMethod === 'cbe_birr' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-slate-400">Commercial Bank Account</p>
                  <p className="text-xs font-mono font-black text-white break-all">1000410224643</p>
                </div>
              </button>
            </div>

            {/* Account Details Box */}
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
              <p className="font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {paymentMethod === 'telebirr' ? 'Telebirr Receiver Account' : 'CBE Receiver Account'}
              </p>
              <p className="text-slate-300">Account Holder: <span className="font-extrabold text-white">Abreham Alemayehu</span></p>
              <p className="text-slate-400 text-[11px]">
                {language === 'en' 
                  ? 'Verify receiver name shows "Abreham Alemayehu" before sending!' 
                  : 'ከመላክዎ በፊት የላኪው ስም "አብርሃም አለማየሁ" መሆኑን ያረጋግጡ!'}
              </p>
            </div>
          </div>

          {/* Right: Submission form */}
          <div className="lg:col-span-5 bg-[#0a1128] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-serif font-black text-amber-400 uppercase tracking-tight flex items-center gap-2">
              <Send className="w-4 h-4" />
              {language === 'en' ? 'Step 2: Submit Txn Reference' : 'ደረጃ 2፡ የትራንዛክሽን ቁጥር ያስገቡ'}
            </h3>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  {language === 'en' ? 'Sender Name (on Bank/Telebirr)' : 'የላኪ ስም (ውጤቱ ላይ ያሉት)'} *
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Abreham Yohannes"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-1 focus:ring-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  {language === 'en' ? 'Sender Phone Number (Optional)' : 'የመደበኛ ስልክ ቁጥር'}
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. 0912345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-1 focus:ring-amber-400 outline-none"
                />
              </div>

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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:ring-1 focus:ring-amber-400 outline-none"
                />
              </div>

              {/* Receipt Image / Screenshot Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>{language === 'en' ? 'Attach Payment Receipt / Screenshot' : 'የክፍያ ማረጋገጫ ደረሰኝ ፎቶ'}</span>
                  <span className="text-[10px] text-amber-400 font-normal">{language === 'en' ? '(Recommended)' : '(ይመረጣል)'}</span>
                </label>

                {receiptImage ? (
                  <div className="relative p-2 bg-slate-900 border border-amber-500/40 rounded-xl flex items-center gap-3">
                    <img 
                      src={receiptImage} 
                      alt="Payment Receipt" 
                      className="w-14 h-14 object-cover rounded-lg border border-slate-700 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {language === 'en' ? 'Receipt Screenshot Attached' : 'የደረሰኝ ፎቶ ተያይዟል'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">Image ready for admin verification</p>
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
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-xl bg-slate-900/60 hover:bg-slate-900 transition-all cursor-pointer text-center group">
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-amber-400 mb-1 transition-colors" />
                    <span className="text-xs font-bold text-slate-300 group-hover:text-amber-300">
                      {language === 'en' ? 'Click or tap to upload receipt image' : 'የደስረኝ ፎቶ ለመጫን እዚህ ይጫኑ'}
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

              {/* Terms and Academic Integrity Agreement Checkbox */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400 cursor-pointer w-4 h-4"
                  />
                  <span className="text-xs text-slate-300 leading-tight">
                    {language === 'en' 
                      ? 'I agree to the ' 
                      : 'በኢትዮ-ለርን '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="text-amber-400 underline font-bold hover:text-amber-300 inline-flex items-center gap-0.5"
                    >
                      <Scale className="w-3 h-3" />
                      {language === 'en' ? 'EthioLearn Pro Terms & Academic Rules' : 'የአገልግሎት ውል እና የጥናት ደንቦች'}
                    </button>
                    {language === 'en' ? '.' : ' እስማማለሁ።'}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {language === 'en' ? 'Submit Receipt & Reference' : 'ደረሰኝ እና ማረጋገጫ ያስገቡ'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 3: VERIFICATION STATUS & ADMIN CONTROLS */}
      {activeTab === 'status' && (
        <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h4 className="text-xl font-serif font-black text-white">
              {profile.proStatus === 'pending' 
                ? (language === 'en' ? 'Payment Under Verification' : 'ክፍያው በመረጋገጥ ላይ ነው')
                : (profile.isPro 
                    ? (language === 'en' ? 'Pro Access Active!' : 'የፕሮ አባልነትዎ ነቅቷል!') 
                    : (language === 'en' ? 'No Pending Payment Verification' : 'ያልቀረበ ክፍያ ማረጋገጫ'))
              }
            </h4>
            
            {profile.proStatus === 'pending' ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-3">
                <p className="font-mono">Txn Ref: <b>{profile.proPaymentTxn}</b></p>
                <p>
                  {language === 'en'
                    ? "Our admin team is checking the Telebirr/CBE bank ledger. Approvals take ~15-30 mins."
                    : "የአስተዳዳሪ ቡድናችን የሒሳብ መዝገብ በመፈተሽ ላይ ነው። ብዙውን ጊዜ 15-30 ደቂቃ ይወስዳል።"}
                </p>

                {(profile.proReceiptImage || receiptImage) && (
                  <div className="pt-2 border-t border-amber-500/20 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {language === 'en' ? 'Submitted Payment Receipt:' : 'የተላከ የክፍያ ደረሰኝ፡'}
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
              <p className="text-xs text-slate-400">
                {profile.isPro 
                  ? (language === 'en' ? "Thank you for subscribing! You have full access to EthioLearn Pro." : "ስለ ኢትዮ-ለርን ፕሮ አባልነት ድጋፍዎ እናመሰግናለን!")
                  : (language === 'en' ? "Please select a subscription tier and submit your payment reference." : "እባክዎ ፓኬጅ መርጠው ክፍያውን ያስገቡ!")
                }
              </p>
            )}
          </div>

          {/* Security & Admin Confirmation Notice */}
          <div className="pt-6 border-t border-slate-800 max-w-md mx-auto text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Protected Administrator Verification' : 'በአስተዳዳሪ ብቻ የሚረጋገጥ'}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'en'
                ? 'All subscriptions are reviewed and authorized directly by the EthioLearn platform administrator. No automated or third-party bypass is allowed.'
                : 'ሁሉም የፕሮ አባልነት ጥያቄዎች በቀጥታ በዋናው አስተዳዳሪ ተመርምረው ይጸድቃሉ። ያለ አስተዳዳሪ ፈቃድ ማንም ማብራት አይችልም።'}
            </p>
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
