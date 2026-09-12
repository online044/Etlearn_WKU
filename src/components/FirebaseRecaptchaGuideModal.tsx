/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, Smartphone, CheckCircle, Copy, Check, 
  ExternalLink, X, Sparkles, Key, AlertTriangle, HelpCircle,
  Lock, ArrowRight, Server
} from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface FirebaseRecaptchaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'am';
  onUseTestCredentials?: () => void;
}

export default function FirebaseRecaptchaGuideModal({
  isOpen,
  onClose,
  language = 'en',
  onUseTestCredentials
}: FirebaseRecaptchaGuideModalProps) {
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fast_test' | 'enterprise_setup' | 'email_alt'>('fast_test');

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const authorizedDomains = [
    currentOrigin,
    'localhost',
    'ais-dev-tl2qjbl3mf3wzgihvfexfg-14765837278.europe-west2.run.app',
    'ais-pre-tl2qjbl3mf3wzgihvfexfg-14765837278.europe-west2.run.app',
    'ai-studio-ethiolearnpro-7054e383-a276-45e6-981f-1a52674d650a.firebaseapp.com'
  ];

  const handleCopy = (text: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopiedDomain(text);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-[#0e1628] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#131c33] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white font-serif tracking-wide">
                  {language === 'am' ? 'የFirebase reCAPTCHA & SMS መመሪያ' : 'Firebase reCAPTCHA & SMS Guide'}
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
                  SECURITY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'am' ? 'የSMS Toll Fraud መከላከያ እና የreCAPTCHA አሰራር' : 'SMS Toll Fraud defense & reCAPTCHA configuration'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 p-1.5 bg-[#090f1d] border-b border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => { triggerHaptic('light'); setActiveTab('fast_test'); }}
            className={`py-2 px-1 rounded-lg text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'fast_test'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'am' ? '1. የሙከራ ቁጥር (ፈጣን)' : '1. Fast Test Numbers'}</span>
          </button>

          <button
            type="button"
            onClick={() => { triggerHaptic('light'); setActiveTab('enterprise_setup'); }}
            className={`py-2 px-1 rounded-lg text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'enterprise_setup'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language === 'am' ? '2. reCAPTCHA Setup' : '2. reCAPTCHA Setup'}</span>
          </button>

          <button
            type="button"
            onClick={() => { triggerHaptic('light'); setActiveTab('email_alt'); }}
            className={`py-2 px-1 rounded-lg text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'email_alt'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{language === 'am' ? '3. ኢሜይል (ነጻ)' : '3. Email Alternative'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          
          {/* TAB 1: FAST TEST NUMBERS (RECOMMENDED) */}
          {activeTab === 'fast_test' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {language === 'am' 
                      ? 'ፈጣኑ መፍትሄ፡ የFirebase የሙከራ ስልክ ቁጥሮች (ምንም ክፍያ የለውም)' 
                      : 'Recommended: Firebase Test Phone Numbers (Zero Cost & Bypasses reCAPTCHA)'}
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-300">
                  {language === 'am'
                    ? 'በFirebase Console ላይ የሙከራ ስልክ ቁጥር ካከሉ የSMS ክፍያ አይኖርም፣ የኢትዮ ቴሌኮም SMS መዘግየት የለም፣ እንዲሁም reCAPTCHA አያስፈልገውም!'
                    : 'Adding a fictional test phone number in Firebase Console bypasses SMS billing quotas, bypasses carrier delays in Ethiopia, and bypasses reCAPTCHA completely.'}
                </p>
              </div>

              {/* Instructions steps */}
              <div className="space-y-3 bg-[#090f1d] border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>{language === 'am' ? 'በFirebase Console ውስጥ 2 ደቂቃ የሚወስዱ ደረጃዎች' : 'Steps in Firebase Console (2 Minutes):'}</span>
                </h4>

                <ol className="space-y-2.5 list-decimal list-inside text-slate-300 text-[11.5px]">
                  <li>
                    {language === 'am' 
                      ? 'ወደ Firebase Console (console.firebase.google.com) ይግቡ።' 
                      : 'Go to Firebase Console (console.firebase.google.com).'}
                  </li>
                  <li>
                    {language === 'am'
                      ? 'Authentication -> Sign-in method -> Phone የሚለውን ይክፈቱ።'
                      : 'Click Authentication -> Sign-in method -> Phone.'}
                  </li>
                  <li>
                    {language === 'am'
                      ? 'ወደ ታች ዝቅ ብለው "Phone numbers for testing (optional)" የሚለውን ይክፈቱ።'
                      : 'Scroll down to expand "Phone numbers for testing (optional)".'}
                  </li>
                  <li>
                    {language === 'am' ? 'ይህንን ቁጥር እና ኮድ ያስገቡ፡' : 'Add this number & test verification code:'}
                    <div className="mt-2 p-2.5 bg-[#0e172a] border border-slate-700 rounded-lg flex items-center justify-between font-mono text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Test Phone Number:</span>
                        <strong className="text-amber-300">+251 91 100 0000</strong>
                      </div>
                      <div className="border-l border-slate-700 pl-3">
                        <span className="text-slate-400 block text-[10px]">Verification Code:</span>
                        <strong className="text-emerald-400">123456</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('+251911000000')}
                        className="p-1.5 text-slate-400 hover:text-white rounded transition cursor-pointer"
                        title="Copy Number"
                      >
                        {copiedDomain === '+251911000000' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </li>
                  <li>
                    {language === 'am' ? 'Save የሚለውን ይጫኑ። ተጠናቀቀ!' : 'Click Save. You are ready!'}
                  </li>
                </ol>
              </div>

              {/* 1-Tap Use Button */}
              {onUseTestCredentials && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('success');
                    onUseTestCredentials();
                    onClose();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>{language === 'am' ? 'ይህንን የሙከራ ቁጥር ፎርሙ ላይ ሙላ' : 'Use Test Number (+251 91 100 0000) Now'}</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 2: RECAPTCHA ENTERPRISE SETUP */}
          {activeTab === 'enterprise_setup' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Active Key Status Card */}
              <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'am' ? 'የreCAPTCHA ቁልፍ በተሳካ ሁኔታ ተገናኝቷል!' : 'reCAPTCHA Key Integrated in App!'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>

                <div className="p-2.5 bg-[#0a1020] border border-emerald-500/20 rounded-lg space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10.5px]">Key Name:</span>
                    <strong className="text-white">Etlearn2</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400 text-[10.5px]">Site Key ID:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-amber-300 text-[11px] truncate max-w-[200px]">6LdZM7ctAAAAAGYxsk7t7gN54l2VOwDfvuLwux23</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy('6LdZM7ctAAAAAGYxsk7t7gN54l2VOwDfvuLwux23')}
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedDomain === '6LdZM7ctAAAAAGYxsk7t7gN54l2VOwDfvuLwux23' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300">
                  {language === 'am'
                    ? 'የreCAPTCHA Enterprise SDK በድረ-ገጹ ላይ ተጭኗል። አሁን የቀረው በFirebase Console ውስጥ ቁልፉን ማገናኘት ብቻ ነው።'
                    : 'The reCAPTCHA Enterprise SDK is loaded in index.html. The final step is linking it in Firebase Console.'}
                </p>
              </div>

              <div className="space-y-3 bg-[#090f1d] border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>{language === 'am' ? 'የመጨረሻው ደረጃ በFirebase Console:' : 'Final Step in Firebase Console:'}</span>
                </h4>

                <ol className="space-y-2 list-decimal list-inside text-slate-300 text-[11.5px]">
                  <li>
                    {language === 'am' 
                      ? 'ወደ Firebase Console (የመጀመሪያው ስክሪንሾት) ይመለሱ።' 
                      : 'Return to the Firebase Console tab (Authentication → Settings → reCAPTCHA).'}
                  </li>
                  <li>
                    {language === 'am'
                      ? 'በ "Settings for reCAPTCHA" ስር ቁልፍ ይምረጡ ወይም ይህንን Site Key ያስገቡ።'
                      : 'Under "Settings for reCAPTCHA", select your "Etlearn2" key or enter this Site Key.'}
                  </li>
                  <li>
                    {language === 'am' 
                      ? 'Save / Activate የሚለውን ይጫኑ።' 
                      : 'Click Save / Enable SMS Protection.'}
                  </li>
                </ol>
              </div>

              <div className="space-y-3 bg-[#090f1d] border border-slate-800 rounded-xl p-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>{language === 'am' ? 'በGoogle Cloud ውስጥ የተፈቀዱ ዶሜይኖች (Domains):' : 'Authorized Domains in Google Cloud:'}</span>
                </h4>

                <p className="text-[11px] text-slate-400">
                  Make sure these domains are listed in Google Cloud under Key Details &gt; Domains:
                </p>

                <div className="space-y-1.5">
                  {authorizedDomains.map((dom) => (
                    <div key={dom} className="p-2 bg-[#0e172a] border border-slate-800 rounded flex items-center justify-between font-mono text-[10.5px]">
                      <span className="text-slate-300 truncate max-w-[320px]">{dom}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(dom)}
                        className="text-amber-400 hover:text-amber-300 text-xs px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedDomain === dom ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL ALTERNATIVE */}
          {activeTab === 'email_alt' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{language === 'am' ? 'የኢሜይል ምዝገባና መግቢያ (ያለ ምንም reCAPTCHA)' : 'Email Authentication (No reCAPTCHA Needed)'}</span>
                </div>
                <p className="text-[11.5px] text-slate-300">
                  {language === 'am'
                    ? 'በኢሜይል አድራሻ መመዝገብ እና መግባት ምንም ዓይነት የreCAPTCHA ገደብ፣ የSMS ክፍያ ወይም የቴሌኮም መዘግየት የለበትም።'
                    : 'Signing up and signing in with your email address has zero SMS fees, no toll fraud restrictions, and does not require reCAPTCHA keys.'}
                </p>
              </div>

              <div className="p-3.5 bg-[#090f1d] border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  {language === 'am' ? 'የኢሜይል ምዝገባ ጥቅሞች፡' : 'Why University Students Prefer Email:'}
                </h4>
                <ul className="space-y-2 text-slate-300 text-[11.5px]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{language === 'am' ? 'ቀጥታ የማግበሪያ ሊንክ (Auto-Activation Link) ወደ ኢሜይል ሳጥን ይላካል።' : 'Direct activation link sent to your inbox.'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{language === 'am' ? 'ኮድ መጻፍ ወይም ማስታወስ አይጠበቅብዎትም።' : 'No 6-digit code entry required.'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{language === 'am' ? 'በሁሉም ኮምፒውተርና ስልክ ላይ ያለምንም እንከን ይሰራል' : 'Works universally across laptops, tablets, and phones.'}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#090f1d] border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[10px]">
            EthioLearn Pro • Wolkite University
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition cursor-pointer"
          >
            {language === 'am' ? 'ዝጋ' : 'Close Guide'}
          </button>
        </div>

      </div>
    </div>
  );
}
