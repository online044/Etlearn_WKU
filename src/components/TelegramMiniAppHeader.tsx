import React from 'react';
import { Send, Share2, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { 
  isTelegramWebApp, 
  getTelegramUser, 
  openTelegramChannel, 
  shareProgressToTelegram, 
  triggerHaptic,
  getTelegramPlatform
} from '../utils/telegram';

interface TelegramMiniAppHeaderProps {
  language?: 'en' | 'am';
}

export const TelegramMiniAppHeader: React.FC<TelegramMiniAppHeaderProps> = ({ 
  language = 'en' 
}) => {
  if (!isTelegramWebApp()) {
    return null;
  }

  const tgUser = getTelegramUser();
  const platform = getTelegramPlatform();
  const isAm = language === 'am';

  const handleChannelClick = () => {
    triggerHaptic('light');
    openTelegramChannel('https://t.me/Et_Learnn');
  };

  const handleShareClick = () => {
    triggerHaptic('medium');
    const shareText = isAm 
      ? 'በኢትዮለርን (EthioLearn Pro) የዩኒቨርሲቲ ፈተናዎችን፣ ማስታወሻዎችን እና የጥናት ፍላሽ ካርዶችን በቴሌግራም አፕ እየተጠቀምኩ ነው! ይቀላቀሉን:' 
      : 'Studying for university exams, lecture notes, and AI flashcards on EthioLearn Pro Telegram Mini App! Join us:';
    shareProgressToTelegram(shareText, 'https://t.me/Et_Learnn');
  };

  return (
    <div 
      id="telegram-mini-app-pro-banner"
      className="w-full bg-[#0088cc]/15 border-b border-[#0088cc]/30 backdrop-blur-md px-3 py-1.5 flex items-center justify-between gap-2 text-xs select-none transition-all"
    >
      {/* Left: TMA Verified Tag & User Identity */}
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="w-5 h-5 rounded-full bg-[#0088cc] flex items-center justify-center text-white shrink-0 shadow-sm">
          <Send className="w-3 h-3" />
        </div>

        <div className="flex items-center gap-1.5 truncate">
          <span className="font-mono font-bold text-[#38bdf8] text-[11px] truncate">
            {tgUser ? (tgUser.username ? `@${tgUser.username}` : tgUser.first_name) : 'Telegram Scholar'}
          </span>
          <span className="hidden xs:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[#0088cc]/30 text-[#7dd3fc] text-[9px] font-mono border border-[#0088cc]/40">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
            <span>Mini App</span>
          </span>
        </div>
      </div>

      {/* Right: Actions (Channel Join & Share) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleChannelClick}
          className="px-2 py-1 rounded-lg bg-[#0088cc]/30 hover:bg-[#0088cc]/50 text-[#e0f2fe] hover:text-white text-[10px] font-bold flex items-center gap-1 border border-[#0088cc]/40 transition-colors cursor-pointer"
          title={isAm ? 'የቴሌግራም ቻናል ክፈት' : 'Open Official Telegram Channel'}
        >
          <Send className="w-2.5 h-2.5 text-[#38bdf8]" />
          <span>@Et_Learnn</span>
          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={handleShareClick}
          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
          title={isAm ? 'ለጓደኞችህ በቴሌግራም አጋራ' : 'Share EthioLearn on Telegram'}
        >
          <Share2 className="w-3 h-3 text-[#38bdf8]" />
        </button>
      </div>
    </div>
  );
};
