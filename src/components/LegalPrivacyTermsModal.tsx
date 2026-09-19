import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, FileText, Scale, Lock, X, Check, BookOpen, Clock, 
  Eye, UserCheck, Database, HardDrive, BellRing, Mail, CheckCircle2,
  Info, Phone, Send, Copy, ExternalLink, GraduationCap, Award
} from 'lucide-react';
import { playClickChime } from '../utils/audio';

export interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'am';
  initialTab?: 'about' | 'terms' | 'privacy';
  onAcceptAndClose?: () => void;
}

export default function LegalPrivacyTermsModal({
  isOpen,
  onClose,
  language,
  initialTab = 'terms',
  onAcceptAndClose
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'terms' | 'privacy'>(initialTab);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isAm = language === 'am';

  const copyText = (text: string, label: string) => {
    playClickChime();
    navigator.clipboard?.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-3xl bg-[#0a1128] border border-amber-500/30 rounded-2xl p-6 md:p-8 shadow-2xl text-white overflow-hidden my-8"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-32 -right-32 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => { playClickChime(); onClose(); }}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                {activeTab === 'about' ? <Info className="w-6 h-6" /> : <Scale className="w-6 h-6" />}
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  {isAm ? 'የኢትዮ-ለርን ፕሮ መረጃ እና ደንቦች' : 'EthioLearn Pro Information & Legal Center'}
                </span>
                <h2 className="text-xl md:text-2xl font-serif font-black tracking-tight text-white mt-1">
                  {activeTab === 'about'
                    ? (isAm ? 'ስለ ኢትዮ ለርን ፕሮ እና የአድራሻ መረጃ' : 'About EthioLearn Pro & Official Support')
                    : activeTab === 'terms' 
                    ? (isAm ? 'የአገልግሎት ውል እና የጥናት ደንቦች' : 'Terms & Conditions of Service')
                    : (isAm ? 'የተማሪ የግላዊነት እና የመረጃ ጥበቃ ፖሊሲ' : 'Student Privacy Policy')}
                </h2>
              </div>
            </div>

            {/* Tab Switcher Pills */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => { playClickChime(); setActiveTab('about'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'about'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>{isAm ? 'ስለ እኛ' : 'About App'}</span>
              </button>
              <button
                type="button"
                onClick={() => { playClickChime(); setActiveTab('terms'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'terms'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isAm ? 'የአገልግሎት ውል' : 'Terms'}</span>
              </button>
              <button
                type="button"
                onClick={() => { playClickChime(); setActiveTab('privacy'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'privacy'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isAm ? 'ግላዊነት' : 'Privacy'}</span>
              </button>
            </div>
          </div>

          {/* Tab Content Container */}
          <div className="space-y-4 text-xs text-slate-300 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">

            {/* ========================================================================= */}
            {/* TAB 0: ABOUT ETHIOLEARN PRO & OFFICIAL CONTACT */}
            {/* ========================================================================= */}
            {activeTab === 'about' && (
              <>
                <div className="p-4 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <GraduationCap className="w-5 h-5 shrink-0" />
                    <span>{isAm ? 'የኢትዮ ለርን ፕሮ ራዕይ እና ተልዕኮ' : 'EthioLearn Pro Vision & Academic Mission'}</span>
                  </div>
                  <p className="leading-relaxed text-slate-200">
                    {isAm
                      ? 'ኢትዮ ለርን ፕሮ (EthioLearn Pro) የኢትዮጵያ ዩኒቨርሲቲ ተማሪዎችን የአካዳሚክ ልህቀት ለማሳደግ የተፈጠረ የላቀ የጥናትና የፈተና መተግበሪያ ነው። በወልቂጤ ዩኒቨርሲቲ ተጀምሮ በመላው ሀገሪቱ ላሉ ዩኒቨርሲቲዎች የተዘጋጀ ሲሆን፣ ትክክለኛ የዩኒቨርሲቲ ፈተናዎችን በክፍል (Unit) እና በምዕራፍ (Chapter) ከፋፍሎ ከዝርዝር ማብራሪያዎች ጋር ያቀርባል።'
                      : 'EthioLearn Pro is an elite academic platform designed specifically for Ethiopian higher education scholars. Originating at Wolkite University and expanding nationwide, it organizes authentic university midterms, final examinations, and ministry exit exam prep systematically by Unit and Chapter with verified answer keys.'}
                  </p>
                </div>

                {/* Key Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <Award className="w-4 h-4" />
                      <span>{isAm ? '10,000+ የዩኒቨርሲቲ ፈተናዎች' : '10,000+ Exam Papers'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      {isAm 
                        ? 'ከወልቂጤ፣ አዲስ አበባ እና ከመላው ኢትዮጵያ ዩኒቨርሲቲዎች የተሰበሰቡ የቀድሞ ሚድተርሞች እና ፋይናሎች።'
                        : 'Curated past midterms, finals, and standardized university syllabus papers across all STEM & Social faculties.'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold">
                      <BookOpen className="w-4 h-4" />
                      <span>{isAm ? 'በክፍል እና በምዕራፍ አደረጃጀት' : 'Unit & Chapter Syllabus'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      {isAm
                        ? 'ጥያቄዎችን በዩኒቨርሲቲው ሲላበስ ክፍል 1፣ 2፣ 3... ተከትለው በቀላሉ እንዲያጠኑ ያግዛል።'
                        : 'Questions structured sequentially by Unit and Chapter so you master topics systematically before exam week.'}
                    </p>
                  </div>
                </div>

                {/* Contact & Admin Information Section */}
                <div className="p-4 bg-[#0d1733] rounded-xl border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{isAm ? 'የቀጥታ ድጋፍ እና የአድሚን አድራሻዎች' : 'Official Administration & Direct Support'}</span>
                    </div>
                    {copiedLabel && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                        {copiedLabel} {isAm ? 'ተቀድቷል' : 'Copied!'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {/* Phone 1 */}
                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block">{isAm ? 'ስልክ 1' : 'Phone Line 1'}</span>
                        <a href="tel:+251906046518" className="font-mono font-bold text-white hover:text-amber-400">
                          +251906046518
                        </a>
                      </div>
                      <div className="flex items-center gap-1">
                        <a href="tel:+251906046518" className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold">
                          {isAm ? 'ደውል' : 'Call'}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyText('+251906046518', 'Phone 1')}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
                          title="Copy Phone 1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Phone 2 */}
                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block">{isAm ? 'ስልክ 2' : 'Phone Line 2'}</span>
                        <a href="tel:+251966701315" className="font-mono font-bold text-white hover:text-amber-400">
                          +251966701315
                        </a>
                      </div>
                      <div className="flex items-center gap-1">
                        <a href="tel:+251966701315" className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold">
                          {isAm ? 'ደውል' : 'Call'}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyText('+251966701315', 'Phone 2')}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
                          title="Copy Phone 2"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-white/5 flex items-center justify-between col-span-1 sm:col-span-2">
                      <div className="overflow-hidden">
                        <span className="text-slate-400 text-[10px] block">{isAm ? 'ይፋዊ ኢሜይል' : 'Official Email Address'}</span>
                        <a href="mailto:Abrehamalemayehu05@gmail.com" className="font-mono font-bold text-amber-300 hover:underline truncate block">
                          Abrehamalemayehu05@gmail.com
                        </a>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href="mailto:Abrehamalemayehu05@gmail.com" className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold">
                          {isAm ? 'ኢሜይል ላክ' : 'Send'}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyText('Abrehamalemayehu05@gmail.com', 'Email')}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
                          title="Copy Email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Telegram Official Channel */}
                    <div className="p-2.5 bg-[#0088cc]/10 rounded-lg border border-[#0088cc]/30 flex items-center justify-between col-span-1 sm:col-span-2">
                      <div>
                        <span className="text-slate-300 text-[10px] font-semibold block">{isAm ? 'ኦፊሴላዊ የቴሌግራም ቻናል' : 'Official Telegram Channel'}</span>
                        <a 
                          href="https://t.me/Et_Learnn" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="font-mono font-bold text-[#38bdf8] hover:underline"
                        >
                          @Et_Learnn
                        </a>
                      </div>
                      <div className="flex items-center gap-1">
                        <a 
                          href="https://t.me/Et_Learnn" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-2.5 py-1 bg-[#0088cc] hover:bg-[#0088cc]/80 text-white rounded text-[10px] font-bold flex items-center gap-1"
                        >
                          <span>{isAm ? 'ተቀላቀል' : 'Join'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyText('https://t.me/Et_Learnn', 'Telegram Channel')}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
                          title="Copy Telegram Channel Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Telegram Admin */}
                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-[#0088cc]/30 flex items-center justify-between col-span-1 sm:col-span-2">
                      <div>
                        <span className="text-slate-400 text-[10px] block">{isAm ? 'የአድሚን ቴሌግራም' : 'Admin Telegram Username'}</span>
                        <a 
                          href="https://t.me/ultra207" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="font-mono font-bold text-[#38bdf8] hover:underline"
                        >
                          @ultra207
                        </a>
                      </div>
                      <div className="flex items-center gap-1">
                        <a 
                          href="https://t.me/ultra207" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-2.5 py-1 bg-[#0088cc] hover:bg-[#0088cc]/80 text-white rounded text-[10px] font-bold flex items-center gap-1"
                        >
                          <span>Telegram</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyText('@ultra207', 'Telegram')}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
                          title="Copy Telegram"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* ========================================================================= */}
            {activeTab === 'terms' && (
              <>
                {/* Rule 1: Registration and Authentication */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '1. የተማሪ ምዝገባ፣ የይለፍ ቃል እና ባለ 2-ደረጃ ማረጋገጫ' : '1. Student Registration, Passwords & 2-Step Verification'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'እያንዳንዱ ተማሪ በኢትዮ ለርን ፕሮ ሲመዘገብ ባለ 6-አሃዝ የማረጋገጫ ኮድ ይሰጠዋል። ይህንን ኮድ ሳያረጋግጡ ወደ መተግበሪያው መግባት በጥብቅ የተከለከለ ነው። ተማሪዎች የይለፍ ቃላቸውን በምስጢር የመጠበቅ ሃላፊነት አለባቸው። ያልተፈቀደ የይለፍ ቃል ማዛባት ወይም የሌላ ተማሪን አካውንት ያለፈቃድ ለመጠቀም መሞከር አካውንትን ያስዘጋል።'
                      : 'Every student registering for EthioLearn Pro is issued a 6-digit confirmation security code. Portal access is strictly restricted until this code is successfully verified. Students are solely responsible for maintaining password confidentiality. Unauthorized attempts to bypass authentication or access accounts without valid credentials will result in immediate suspension.'}
                  </p>
                </div>

                {/* Rule 2: Payment and Pro Subscriptions */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '2. የቴሌብር እና ሲቢኢ ብር ክፍያ ደረሰኝ ማረጋገጫ' : '2. Payment Verification (Telebirr & CBE Birr)'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'የኢትዮ-ለርን ፕሮ አባልነትን ለማስበር ተማሪዎች የተጠቀሰውን ክፍያ በቴሌብር (Telebirr) ወይም በሲቢኢ ብር (CBE Birr) በመክፈል ትክክለኛ የትራንዛክሽን ቁጥር እና የደረሰኝ ፎቶ ማያያዝ አለባቸው። ሀሰተኛ ወይም የተዛባ የክፍያ ማረጋገጫ ማቅረብ የመለያ አጠቃቀምን በዘላቂነት ያስዘጋል።'
                      : 'To unlock EthioLearn Pro, students must submit payments via verified Ethiopian financial channels (Telebirr, CBE Birr) with a verifiable Transaction Reference ID and receipt screenshot. Submitting fraudulent, duplicated, or altered transaction slips will trigger immediate permanent blacklisting.'}
                  </p>
                </div>

                {/* Rule 3: Free Quota vs Pro Access */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '3. የነፃ አጠቃቀም ገደብ እና የ AI ጥያቄዎች' : '3. Free Tier Limits & Unlimited Pro AI Access'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'የነፃ አባልነት ተማሪዎች በቀን እስከ 5 የ AI መምህር ጥያቄዎች ይጠቀማሉ። ዕለታዊ ገደቡ ሲያልቅ ተማሪዎች ወደ ፕሮ አባልነት በማሳደግ ወይም የክፍያ ደረሰኝ በማስገባት ያልተገደበ አገልግሎት፣ ሙሉ የፈተና መፍትሔዎች እና PDF ማውረድ ይችላሉ።'
                      : 'Free tier scholars receive 5 daily AI Tutor queries. When exhausted, users may continue studying static course notes or upgrade to Pro for unlimited AI tutoring, step-by-step exam solutions, and offline PDF downloads.'}
                  </p>
                </div>

                {/* Rule 4: Academic Integrity */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '4. የአካዳሚክ ታማኝነት እና የመረጃ አጠቃቀም' : '4. Academic Integrity & Non-Commercial Use'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'በኢትዮ-ለርን የሚዘጋጁ የትምህርት ማስታወሻዎች፣ የፈተና መፍትሔዎች እና የ AI ገለጻዎች ለተማሪዎች የግል ጥናት የተዘጋጁ ናቸው። መረጃዎችን ለንግድ አላማ መልሶ መሸጥ፣ በሶስተኛ ወገን ማሰራጨት ወይም በቦቶች ማውረድ በጥብቅ የተከለከለ ነው።'
                      : 'EthioLearn study notes, university past exam solutions, and AI mentor explanations are intended exclusively for personal educational revision. Commercial redistribution, automated scraping, or reselling of EthioLearn modules is strictly forbidden.'}
                  </p>
                </div>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: PRIVACY POLICY */}
            {/* ========================================================================= */}
            {activeTab === 'privacy' && (
              <>
                {/* Privacy 1: What Data We Collect */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Database className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '1. የምንሰበስባቸው የተማሪ መረጃዎች' : '1. Student Data Collection & Purpose'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'የምንሰበስበው መረጃ የሚያካትተው፡ የተማሪ ስም፣ የኢሜይል አድራሻ፣ የዩኒቨርሲቲ ስም (ምሳሌ፡ ወልቂጤ ዩኒቨርሲቲ)፣ የትምህርት ዓመት፣ እና የጥናት ውጤቶችን ብቻ ነው። እነዚህ መረጃዎች የትምህርት ደረጃዎን ለማስተካከል እና የ AI አስጎብኚውን ለማበጀት ብቻ ጥቅም ላይ ይውላሉ።'
                      : 'We only collect essential academic details: your full name, university email, institution (e.g., Wolkite University), study year/department, and learning metrics (streaks, quiz scores). This data is strictly utilized to personalize your AI tutoring and track your semester progress.'}
                  </p>
                </div>

                {/* Privacy 2: Absolute Guarantee - No Selling of Data */}
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '2. ጽኑ ቃል ኪዳን፡ የተማሪ መረጃ ለማስታወቂያ ወይም ለሶስተኛ ወገን አይሸጥም' : '2. Ironclad Guarantee: Zero Data Selling to Advertisers'}
                    </span>
                  </div>
                  <p className="leading-relaxed text-emerald-200">
                    {isAm
                      ? 'የተማሪ የግል መረጃዎችን ለሶስተኛ ወገን ማስታወቂያ ሰሪዎች ወይም የንግድ ተቋማት ፈጽሞ አንሸጥም ወይም አናጋራም። የእርስዎ መረጃዎች በከፍተኛ የደህንነት ደረጃ (256-bit encryption) የተጠበቁ ናቸው።'
                      : 'We strictly pledge that EthioLearn Pro NEVER sells, rents, or commercializes student records to third-party advertisers. All records are guarded by strict 256-bit encrypted security protocols.'}
                  </p>
                </div>

                {/* Privacy 3: Data Storage & Encryption */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <HardDrive className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '3. የመረጃ ማስቀመጫ እና የይለፍ ቃል ምስጢራዊነት' : '3. Secure Storage & Credential Protection'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'የይለፍ ቃሎች እና የደህንነት ቁልፎች በከፍተኛ ምስጢራዊነት ይቀመጣሉ። የክላውድ መረጃ ቋቶች (Supabase / Firebase) በደህንነት ደንቦች የተጠበቁ ሲሆኑ፣ ተማሪው በፈቀደው መሳሪያ ላይ ብቻ ይቀመጣሉ።'
                      : 'Passwords and authentication credentials are encrypted using industry-standard hashing before storage. Database connections (Supabase & Firebase) enforce strict row-level security (RLS) ensuring each student accesses only their verified data.'}
                  </p>
                </div>

                {/* Privacy 4: Student Rights (Export / Delete) */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Eye className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '4. የተማሪ መብቶች፡ መረጃን ማውረድ እና ሙሉ በሙሉ መሰረዝ' : '4. Your Student Rights (Data Export & Deletion)'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'ማንኛውም ተማሪ የራሱን የጥናት ማስታወሻዎች እና ውጤቶች በማንኛውም ጊዜ ማውረድ ወይም አካውንቱን ሙሉ በሙሉ እንዲሰረዝ የመጠየቅ ሙሉ መብት አለው። መረጃዎን ለመሰረዝ በፕሮፋይል ገጽ ወይም በአድሚን በኩል ጥያቄ ማቅረብ ይችላሉ (ኢሜይል፡ Abrehamalemayehu05@gmail.com, ስልክ፡ +251906046518 / +251966701315, ቴሌግራም፡ @ultra207)።'
                      : 'You retain full ownership of your study records. You may export your notes and flashcards, or request permanent account and data deletion at any time via your Profile Settings or by contacting Abrehamalemayehu05@gmail.com (+251906046518 / +251966701315, Telegram: @ultra207).'}
                  </p>
                </div>

                {/* Privacy 5: Data Controller Contact */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-[11px]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-400" />
                      <span>Data Protection Officer: <strong className="text-slate-200">Abreham Alemayehu</strong></span>
                    </div>
                    <a href="mailto:Abrehamalemayehu05@gmail.com" className="text-amber-400 font-mono hover:underline">
                      Abrehamalemayehu05@gmail.com
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-mono text-slate-200">+251906046518 / +251966701315</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Telegram Admin:</span>
                      <a href="https://t.me/ultra207" target="_blank" rel="noopener noreferrer" className="text-[#38bdf8] font-mono hover:underline">
                        @ultra207
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
            {onAcceptAndClose ? (
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  onAcceptAndClose();
                }}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <Check className="w-4 h-4 text-slate-950" />
                <span>{isAm ? 'ደንቦቹን እና የግላዊነት ፖሊሲውን ተቀብዬ እቀጥላለሁ' : 'I Accept Terms & Privacy Policy'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  onClose();
                }}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                {isAm ? 'መስኮቱን ዝጋ' : 'Close Legal Window'}
              </button>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
