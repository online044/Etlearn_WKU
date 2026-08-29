import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, Clock, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, AlertCircle, ArrowUpRight } from 'lucide-react';
import { StudentProfile, PaymentRecord, SubscriptionTier } from '../types';
import { checkSubscriptionStatus, getPaymentHistoryLocal } from '../utils/monetization';
import { playClickChime } from '../utils/audio';

interface BillingAccountSectionProps {
  profile: StudentProfile;
  language: 'en' | 'am';
  onNavigateToUpgrade: () => void;
}

export default function BillingAccountSection({
  profile,
  language,
  onNavigateToUpgrade
}: BillingAccountSectionProps) {
  const subInfo = checkSubscriptionStatus(profile);
  const paymentHistory: PaymentRecord[] = getPaymentHistoryLocal(profile.email || 'guest');

  const getTierBadge = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'pro_monthly':
        return { label: language === 'en' ? 'PRO MONTHLY' : 'ፕሮ ወርሃዊ', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'exam_season_pass':
        return { label: language === 'en' ? 'EXAM SEASON PASS' : 'የፈተና ወቀት ፓስ', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'subject_bundle':
        return { label: language === 'en' ? 'SUBJECT BUNDLE' : 'የትምህርት ፓክ', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      default:
        return { label: language === 'en' ? 'FREE TIER' : 'ነፃ አባልነት', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getTierBadge(subInfo.tier);

  return (
    <div className="space-y-6">
      {/* Active Subscription Overview Card */}
      <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badge.color}`}>
                {badge.label}
              </span>
              {subInfo.status === 'pending' && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 animate-pulse">
                  ⏳ {language === 'en' ? 'Payment Verification Pending' : 'ክፍያው በመረጋገጥ ላይ'}
                </span>
              )}
            </div>
            <h3 className="text-xl font-serif font-black tracking-tight">
              {language === 'en' ? 'Current Membership & Billing' : 'የአሁኑ የአባልነት ሁኔታ'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'en'
                ? 'Manage your subscription tier, expiration dates, and past payment logs.'
                : 'የአባልነት ዓይነትዎን፣ የአገልግሎት ማብቂያ ቀናትን እና ያለፉ ክፍያዎችን እዚህ ይመልከቱ።'}
            </p>
          </div>

          <button
            onClick={() => { playClickChime(); onNavigateToUpgrade(); }}
            className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            {subInfo.isPro 
              ? (language === 'en' ? 'Extend / Upgrade Plan' : 'አካውንት ያራዝሙ / ያሻሽሉ')
              : (language === 'en' ? 'Upgrade to Pro' : 'ወደ ፕሮ ያሻሽሉ')}
          </button>
        </div>

        {/* Membership Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {language === 'en' ? 'Daily Ask Teacher Limit' : 'የዕለታዊ መምህሩን ጠይቅ አጠቃቀም'}
            </span>
            <p className="text-sm font-black text-white">
              {subInfo.isPro ? (language === 'en' ? 'UNLIMITED ♾️' : 'ያልተገደበ ♾️') : (language === 'en' ? '5 Questions / Day' : 'በቀን 5 ጥያቄዎች')}
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {language === 'en' ? 'Expiration Status' : 'የአገልግሎት ማብቂያ'}
            </span>
            <p className="text-sm font-black text-white flex items-center gap-1.5">
              {subInfo.endDate ? (
                <>
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{new Date(subInfo.endDate).toLocaleDateString()} ({subInfo.daysRemaining} {language === 'en' ? 'days left' : 'ቀናት ይቀራሉ'})</span>
                </>
              ) : (
                subInfo.isPro 
                  ? (language === 'en' ? 'Active Semester Pass' : 'የነቃ ሴሚስተር አባልነት')
                  : (language === 'en' ? 'Free Tier (No expiry)' : 'ነፃ አባልነት')
              )}
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {language === 'en' ? 'Auto-Renewal' : 'በራሱ የሚታደስ'}
            </span>
            <p className="text-sm font-black text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'en' ? 'DISABLED (No Silent Billing)' : 'የለም (ተጨማሪ ክፍያ አይቆረጥም)'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Payment Transaction History Table */}
      <div className="bg-[#0a1128] border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
        <h4 className="text-base font-serif font-black tracking-tight mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          {language === 'en' ? 'Payment Transaction History' : 'የክፍያ ታሪክ መዝገብ'}
        </h4>

        {paymentHistory.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800/80 text-slate-400 text-xs">
            <p>{language === 'en' ? 'No payment transactions submitted yet.' : 'ምንም ዓይነት የክፍያ ታሪክ አልተመዘገበም።'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg">{language === 'en' ? 'Date' : 'ቀን'}</th>
                  <th className="p-3">{language === 'en' ? 'Channel' : 'የክፍያ መንገድ'}</th>
                  <th className="p-3">{language === 'en' ? 'Txn Reference' : 'የትራንዛክሽን ቁጥር'}</th>
                  <th className="p-3">{language === 'en' ? 'Amount' : 'መጠን'}</th>
                  <th className="p-3 rounded-r-lg text-right">{language === 'en' ? 'Status' : 'ሁኔታ'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paymentHistory.map((item) => (
                  <tr key={item.id || item.providerTxnId} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 text-slate-300">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 uppercase text-amber-400 font-bold">{item.provider}</td>
                    <td className="p-3 text-slate-200">{item.providerTxnId}</td>
                    <td className="p-3 font-extrabold text-white">{item.amount} {item.currency}</td>
                    <td className="p-3 text-right">
                      {item.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          {language === 'en' ? 'COMPLETED' : 'ተረጋገጠ'}
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                          <Clock className="w-3 h-3 animate-spin" />
                          {language === 'en' ? 'PENDING' : 'በመጠባበቅ ላይ'}
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          {language === 'en' ? 'FAILED' : 'አልተሳካም'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
