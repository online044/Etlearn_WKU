import React from 'react';
import { Home, BookOpen, Target, Bookmark, User } from 'lucide-react';
import { playClickChime } from '../../utils/audio';

export type NavTabId = 'home' | 'learn' | 'practice' | 'saved' | 'profile';

interface BottomNavigationProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  language: 'en' | 'am' | 'both';
}

export default function BottomNavigation({
  activeTab,
  onSelectTab,
  language,
}: BottomNavigationProps) {
  const isAmharic = language === 'am';

  const tabs: Array<{
    id: NavTabId;
    icon: React.ComponentType<{ className?: string }>;
    labelEn: string;
    labelAm: string;
  }> = [
    { id: 'home', icon: Home, labelEn: 'Home', labelAm: 'ዋና' },
    { id: 'learn', icon: BookOpen, labelEn: 'Learn', labelAm: 'ትምህርት' },
    { id: 'practice', icon: Target, labelEn: 'Practice', labelAm: 'ልምምድ' },
    { id: 'saved', icon: Bookmark, labelEn: 'Saved', labelAm: 'የተቀመጡ' },
    { id: 'profile', icon: User, labelEn: 'Profile', labelAm: 'መገለጫ' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A1128]/95 backdrop-blur-md border-t border-slate-800/80 shadow-2xl transition-all select-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      aria-label="Bottom Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-1 pt-1.5 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playClickChime();
                onSelectTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 rounded-xl transition-all duration-150 cursor-pointer relative group ${
                isActive
                  ? 'text-amber-400 font-bold scale-[1.03]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={isAmharic ? tab.labelAm : tab.labelEn}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active subtle pill indicator glow */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80 -mt-1.5" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              </div>

              <span className="text-[10px] sm:text-[11px] font-medium tracking-tight mt-1 leading-none">
                {isAmharic ? tab.labelAm : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
