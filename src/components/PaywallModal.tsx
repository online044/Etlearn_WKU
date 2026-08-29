import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, Lock, Zap, Clock, X, ShieldCheck, CreditCard, AlertCircle } from 'lucide-react';
import { playClickChime, playSuccessChime } from '../utils/audio';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
  language: 'en' | 'am';
  questionsUsed?: number;
  maxQuestions?: number;
  featureName?: string;
}

export default function PaywallModal({
  isOpen,
  onClose,
  onUpgradeClick,
  language,
  questionsUsed = 5,
  maxQuestions = 5,
  featureName
}: PaywallModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#0a1128] border border-amber-500/30 rounded-2xl p-6 md:p-8 shadow-2xl text-white overflow-hidden"
        >
          {/* Subtle gold glow background effect */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => { playClickChime(); onClose(); }}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                {language === 'en' ? 'Daily Limit Reached' : 'የዕለታዊ አጠቃቀም ገደብ'}
              </span>
              <h3 className="text-xl font-serif font-black tracking-tight text-white mt-1">
                {featureName 
                  ? (language === 'en' ? `Unlock ${featureName}` : `${featureName} መዳረሻን ይክፈቱ`)
                  : (language === 'en' ? 'Upgrade to Continue Studying' : 'ጥናትዎን ለማስቀጠል አካውንትዎን ያሻሽሉ')}
              </h3>
            </div>
          </div>

          {/* Progress bar / Used queries stats */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-400">
                <AlertCircle className="w-4 h-4" />
                {language === 'en' ? 'Free Daily AI Queries' : 'የነፃ ዕለታዊ ጥያቄዎች'}
              </span>
              <span>{questionsUsed} / {maxQuestions} {language === 'en' ? 'Used Today' : 'ተጠቅመዋል'}</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (questionsUsed / maxQuestions) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {language === 'en' 
                ? 'Free limit resets daily at midnight (00:00 EAT), or upgrade now for UNLIMITED questions!'
                : 'የነፃ አጠቃቀም በየቀኑ እኩለ ሌሊት ይታደሳል፤ ወይም አሁኑኑ ያሻሽሉ!'}
            </p>
          </div>

          {/* Key Pro Benefits */}
          <div className="space-y-2.5 mb-6 text-xs text-slate-200">
            <p className="font-bold text-amber-300 uppercase tracking-wider text-[11px] mb-1">
              {language === 'en' ? 'Why Ethiopian Students Choose Pro:' : 'የኢትዮ-ለርን ፕሮ ጥቅሞች:'}
            </p>
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>{language === 'en' ? 'Unlimited Ask Teacher questions (English & Amharic)' : 'ያልተገደበ የመምህሩን ጠይቅ (Ask Teacher) ጥያቄዎች'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>{language === 'en' ? 'Offline PDF downloads & custom university past exam solvers' : 'የPast Exam መፍትሔዎች እና PDF የትምህርት ማስታወሻዎች'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>{language === 'en' ? '100% Ad-Free Experience (No Google Ad interruptions)' : '100% ማስታወቂያ-አልባ የጥናት ድባብ'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>{language === 'en' ? 'Pay easily via Telebirr or CBE Birr (80 - 200 ETB)' : 'በቴሌብር ወይም በሲቢኢ ብር በቀላሉ ይክፈሉ (80 - 200 ETB)'}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                playSuccessChime();
                onClose();
                onUpgradeClick();
              }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              {language === 'en' ? 'Upgrade to Pro (from 80 ETB)' : 'ወደ ፕሮ ያሻሽሉ (ከ 80 ብር ጀምሮ)'}
            </button>
            <button
              onClick={() => { playClickChime(); onClose(); }}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {language === 'en' ? 'Maybe Later' : 'ለጊዜው ይቆይ'}
            </button>
          </div>

          {/* Guarantee info */}
          <p className="text-center text-[10px] text-slate-400 mt-4 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {language === 'en' ? 'Instant activation upon payment reference confirmation' : 'ክፍያው እንደተረጋገጠ ወዲያውኑ ይበራል'}
          </p>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
