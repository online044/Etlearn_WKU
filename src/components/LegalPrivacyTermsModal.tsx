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
            {/* TAB 1: COMPREHENSIVE TERMS AND CONDITIONS OF SERVICE                      */}
            {/* ========================================================================= */}
            {activeTab === 'terms' && (
              <>
                {/* Official Terms Preamble & Verification Banner */}
                <div className="p-4 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 rounded-xl border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Scale className="w-5 h-5 shrink-0" />
                      <span>
                        {isAm ? 'የኢትዮ-ለርን ፕሮ ይፋዊ የአጠቃቀም ደንቦች እና ሁኔታዎች' : 'EthioLearn Pro Official Terms & Conditions of Service'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {isAm ? 'የጸደቀበት ዓመት፡ 2026/2027 (2018/2019 ዓ.ም.)' : 'Academic Year 2026/2027'}
                    </span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-slate-300">
                    {isAm
                      ? 'ወደ ኢትዮ ለርን ፕሮ (EthioLearn Pro) ሲገቡ ወይም መለያ ሲፈጥሩ፣ ከዚህ በታች የተዘረዘሩትን የአጠቃቀም ደንቦች፣ የአካዳሚክ ታማኝነት ህጎች እና የዩኒቨርሲቲ የጥናት መመሪያዎች ሙሉ በሙሉ ተቀብለው ለመተግበር ተስማምተዋል። ይህ ሰነድ በወልቂጤ ዩኒቨርሲቲ እና በሀገር አቀፍ የኢትዮጵያ ካምፓሶች ተማሪዎች መካከል የሚሰራ ህጋዊ የአገልግሎት ስምምነት ነው።'
                      : 'By signing in, registering, or accessing EthioLearn Pro, you enter into a binding academic agreement and agree to be bound by these Terms of Use and Conditions. These terms govern your use of the student learning portal, digital textbook library, AI Tutor ("አስጎብኚ"), and examination archives across Wolkite University and partner Ethiopian institutions.'}
                  </p>
                </div>

                {/* Section 1: Student Registration, 2-Step Security & Single Account Policy */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '1. የተማሪ ምዝገባ፣ የይለፍ ቃል እና ባለ 2-ደረጃ ማረጋገጫ' : '1. Student Registration, Credentials & 2-Step Verification'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'እያንዳንዱ ተማሪ በኢትዮ ለርን ፕሮ ሲመዘገብ ባለ 6-አሃዝ የማረጋገጫ ኮድ ይሰጠዋል። ይህንን ኮድ ሳያረጋግጡ ወደ መተግበሪያው መግባት በጥብቅ የተከለከለ ነው። ተማሪዎች የይለፍ ቃላቸውን በምስጢር የመጠበቅ ሙሉ ሃላፊነት አለባቸው። አንድ ተማሪ አንድ አካውንት ብቻ እንዲጠቀም የተፈቀደ ሲሆን፣ የመግቢያ መረጃን ለሶስተኛ ወገን አሳልፎ መስጠት ወይም የሌላ ተማሪን አካውንት ያለፈቃድ ለመጠቀም መሞከር አካውንትን በቋሚነት ያስዘጋል።'
                      : 'Every student registering on EthioLearn Pro is verified via a 6-digit cryptographic security confirmation code. Access to university resources is granted only after successful verification. Students are solely responsible for safeguarding their login credentials. Account sharing, credential reselling, or unauthorized session cloning is strictly prohibited and results in immediate account suspension.'}
                  </p>
                </div>

                {/* Section 2: Academic Integrity & Anti-Cheating Honor Code */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Award className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '2. የአካዳሚክ ታማኝነት እና የስነ-ምግባር ደንቦች (Honor Code)' : '2. Academic Integrity & Anti-Cheating Honor Code'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'የኢትዮ-ለርን ፕሮ የፈተና ጥያቄዎች እና የ AI አስጎብኚ ማብራሪያዎች የተዘጋጁት ለግል ጥናት እና ለፅንሰ-ሀሳብ ማዳበር ብቻ ነው። ተማሪዎች ይህንን መድረክ በቀጥታ የፈተና ወቅት (Live University Exams) ለማጭበርበር ወይም ያልተፈቀደ እርዳታ ለማግኘት መጠቀም በጥብቅ የተከለከለ ነው። ማንኛውም የአካዳሚክ ማጭበርበር ሙከራ ለሚመለከተው የዩኒቨርሲቲ ዲፓርትመንት ሪፖርት ይደረጋል።'
                      : 'All learning materials, past exams, and AI tutor explanations are provided strictly for independent study, revision, and conceptual mastery. Utilizing EthioLearn Pro during live, proctored university examinations or supervised quizzes constitutes serious academic misconduct. Any violation of academic integrity will be reported to university department administrators.'}
                  </p>
                </div>

                {/* Section 3: Verified Financial Channels & Activation (Telebirr & CBE Birr) */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '3. ግልጽ የክፍያ ደንቦች፣ ቴሌብር እና ሲቢኢ ብር (ምንም ድብቅ ክፍያ የለም)' : '3. Transparent Payments: Telebirr & CBE Birr (Zero Hidden Fees)'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'የኢትዮ-ለርን ፕሮ አባልነት ክፍያ ሙሉ በሙሉ ግልጽና ቋሚ ነው (ወርሃዊ 99 ብር፣ የሴሚስተር 199 ብር፣ የዓመት 250 ብር)። ምንም አይነት ድብቅ ክፍያ ወይም ያለተማሪው ፈቃድ የሚቆረጥ አውቶማቲክ ክፍያ የለም። ክፍያዎች የሚፈጸሙት በይፋዊ የኢትዮጵያ የክፍያ መንገዶች (ቴሌብር / Telebirr ወይም ሲቢኢ ብር / CBE Birr) ብቻ ሲሆን፣ ትክክለኛ የትራንዛክሽን ቁጥር እና የደረሰኝ ፎቶ ከተላከ በኋላ በአድሚን ቡድን በ 1-2 ሰዓት ውስጥ ይረጋገጣል። የውሸት ደረሰኝ ማቅረብ መለያን በዘላቂነት ያስዘጋል።'
                      : 'EthioLearn Pro operates with 100% pricing transparency (99 ETB / month, 199 ETB / semester, 250 ETB / full academic year). There are strictly no hidden charges, no fake foreign fees, and no automated recurring credit card deductions. Payments are executed directly through verified Ethiopian channels (Telebirr, CBE Birr) and manually verified by our university coordination team within 1 to 2 hours of transaction slip submission. Submitting fraudulent receipts results in immediate, permanent account termination.'}
                  </p>
                </div>

                {/* Section 4: Fair Use of Digital Textbooks, Lecture Notes & Offline PDFs */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '4. ነፃ የዲጂታል ሞጁሎች እና የጥናት ማስታወሻዎች አጠቃቀም' : '4. 100% Free Public Textbooks & Academic Fair Use'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'በኢትዮ-ለርን ፕሮ ላይ የሚገኙ ሁሉም የኢትዮጵያ ዩኒቨርሲቲ የጋራ ኮርስ (Freshman Common Courses) መማሪያ መጽሐፍት እና ፒዲኤፍ ሞጁሎች 100% ነፃ ናቸው። ማንኛውም ተማሪ ያለምንም ክፍያ በመተግበሪያው ውስጥ ማንበብ ወይም ከመስመር ውጭ (Offline) አውርዶ ማጥናት ይችላል። እነዚህን የትምህርት ግብዓቶች ለንግድ አላማ መልሶ መሸጥ ወይም በሶስተኛ ወገን ድረ-ገጾች ማሰራጨት በጥብቅ የተከለከለ ነው።'
                      : 'All Ethiopian university freshman common course textbooks, syllabus modules, and lecture notes hosted on EthioLearn Pro are 100% free open educational resources. Every student can read them in-app or download them for offline revision without paying any subscription fee. Re-selling, commercially distributing, or bulk-scraping these academic materials is strictly prohibited.'}
                  </p>
                </div>

                {/* Section 5: AI Tutor ("አስጎብኚ") Usage Code of Conduct */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '5. የ AI አስጎብኚ ("Asgobnyi") የአጠቃቀም ስነ-ምግባር' : '5. AI Tutor ("Asgobnyi") Usage Code of Conduct'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'የ AI አስጎብኚው ተማሪዎችን በሳይንስ፣ በምህንድስና፣ በህክምና፣ በኢኮኖሚክስ እና በጋራ ኮርሶች ለመደገፍ የተዘጋጀ ነው። ተገቢ ያልሆኑ ቃላትን፣ የጥላቻ ንግግርን ወይም ከአካዳሚክ ጥናት ውጭ የሆኑ ጥያቄዎችን ማቅረብ የአይኤይ አጠቃቀም ገደብ እንዲጣል ሊያደርግ ይችላል። የ AI አስጎብኚው የሚሰጣቸው ማብራሪያዎች ተጨማሪ የጥናት ድጋፍ እንጂ የዩኒቨርሲቲ መምህራንን የመጨረሻ ውሳኔ አይተኩም።'
                      : 'The Asgobnyi AI Tutor is designed specifically for academic tutoring across science, technology, medicine, humanities, and common university curricula. Submitting abusive prompts or attempting prompt injections will trigger AI safety throttling. AI-generated explanations serve as study aids and do not supersede official university syllabus guidelines.'}
                  </p>
                </div>

                {/* Section 6: Account Governance, Suspension & Appeals */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      {isAm ? '6. የአካውንት ህልውና፣ ክልከላዎች እና የቅሬታ ማቅረቢያ' : '6. Account Standing, Sanctions & Dispute Resolution'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isAm
                      ? 'የኢትዮ-ለርን ፕሮ አስተዳደር እነዚህን ደንቦች የሚጥሱ መለያዎችን የማገድ ወይም የመሰረዝ ሙሉ መብት አለው። ተማሪዎች ማንኛውንም የክፍያ ወይም የአካውንት ጥያቄ ካላቸው በይፋዊ የአድሚን አድራሻዎች (ኢሜይል፡ Abrehamalemayehu05@gmail.com, ስልክ፡ +251906046518 / +251966701315, ቴሌግራም፡ @ultra207) ማነጋገር ይችላሉ።'
                      : 'EthioLearn Pro reserves the right to suspend or terminate accounts that breach these Terms of Service. In case of verification issues or payment inquiries, students may directly reach the official administration office (Email: Abrehamalemayehu05@gmail.com, Phone: +251906046518 / +251966701315, Telegram: @ultra207).'}
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
                      ? 'የተማሪ የግል መረጃዎችን ለሶስተኛ ወገን ማስታወቂያ ሰሪዎች ወይም የንግድ ተቋማት ፈጽሞ አንሸጥም ወይም አናጋራም። በመተግበሪያው ውስጥ ምንም አይነት የሶስተኛ ወገን ማስታወቂያ ወይም የተማሪ መከታተያ (Trackers) የለም። የእርስዎ መረጃዎች በከፍተኛ የደህንነት ደረጃ (256-bit encryption) የተጠበቁ ሲሆኑ ከመስመር ውጭ የተቀመጡ ማስታወሻዎች በራስዎ ስልክ/መሳሪያ ላይ ብቻ ይቀመጣሉ።'
                      : 'We strictly pledge that EthioLearn Pro NEVER sells, rents, or commercializes student records to third-party advertisers or data brokers. The platform contains zero advertising trackers. All student records are guarded by strict 256-bit encrypted security protocols, and offline downloaded books/notes remain strictly cached on your local device.'}
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
