/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  X, Palette, Eye, EyeOff, Layout, Layers, Star, MoveUp, MoveDown,
  Sparkles, Check, RefreshCw, Sliders, Image as ImageIcon,
  Upload, Sun, Moon, Monitor, Tag, Grid, List, Shield, HelpCircle
} from 'lucide-react';
import {
  ProfileCustomizationPreferences,
  ProfileCardLayoutStyle,
  ProfileAccentTheme,
  ProfileRenderMode,
  ModulesDisplayMode,
  ProfileSectionKey,
  ProfileQuickActionKey,
  StudentProfile
} from '../types';
import {
  ACCENT_THEMES,
  BANNER_PRESETS
} from '../utils/profileCustomization';
import { playClickChime, playSuccessChime } from '../utils/audio';

interface ProfileCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: ProfileCustomizationPreferences;
  onUpdatePreferences: (updated: ProfileCustomizationPreferences) => void;
  profile: StudentProfile;
  language: 'en' | 'am';
  subjectsList: string[];
}

export default function ProfileCustomizerModal({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  profile,
  language,
  subjectsList
}: ProfileCustomizerModalProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'sections' | 'badges' | 'modules' | 'actions'>('visual');
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingBanner, setIsProcessingBanner] = useState(false);

  if (!isOpen) return null;

  const currentTheme = ACCENT_THEMES[preferences.accentColor] || ACCENT_THEMES.gold;

  // Real-time update helper
  const update = (partial: Partial<ProfileCustomizationPreferences>) => {
    playClickChime();
    const next = { ...preferences, ...partial };
    onUpdatePreferences(next);
  };

  // Move section in order
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...preferences.sectionOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIdx, 0, moved);
    update({ sectionOrder: newOrder });
  };

  // Move quick action in order
  const moveQuickAction = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...preferences.quickActionsOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIdx, 0, moved);
    update({ quickActionsOrder: newOrder });
  };

  // Handle custom banner upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(language === 'am' ? 'እባክዎ ትክክለኛ የምስል ፋይል ይምረጡ' : 'Please upload a valid image file');
      return;
    }
    setIsProcessingBanner(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const targetWidth = 800;
        const targetHeight = 260;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        if (ctx) {
          // Cover resize
          const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
          const x = (targetWidth - img.width * scale) / 2;
          const y = (targetHeight - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          update({ coverBannerUrl: compressed });
          playSuccessChime();
        }
        setIsProcessingBanner(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Available badges candidate list based on user qualifications
  const availableBadges = [
    {
      id: '',
      title: profile.isPro ? 'PRO MEMBER' : 'STANDARD',
      desc: language === 'en' ? 'Default Account Tier Badge' : 'መደበኛ የሂሳብ ደረጃ ባጅ'
    },
    {
      id: 'ACADEMIC SCHOLAR',
      title: 'ACADEMIC SCHOLAR',
      desc: language === 'en' ? 'Verified student of higher learning' : 'የከፍተኛ ትምህርት ምሁር'
    },
    {
      id: 'EXCELLENCE HONORS',
      title: 'EXCELLENCE HONORS',
      desc: language === 'en' ? 'For students aiming for high GPA' : 'ከፍተኛ ውጤት የታለመለት'
    },
    {
      id: 'STEM PIONEER',
      title: 'STEM PIONEER',
      desc: language === 'en' ? 'Engineering, Health & Science Focus' : 'የሳይንስና ቴክኖሎጂ ፈር ቀዳጅ'
    },
    {
      id: 'RESEARCH FELLOW',
      title: 'RESEARCH FELLOW',
      desc: language === 'en' ? 'Dedicated library & notes researcher' : 'የምርምርና ማስታወሻ ተመራማሪ'
    }
  ];

  const sectionLabels: Record<ProfileSectionKey, { en: string; am: string }> = {
    academic: { en: 'Academic Standing & Details', am: 'የአካዳሚክ ምዝገባ መረጃዎች' },
    modules: { en: 'Enrolled Focus Modules', am: 'የተመዘገቡ የትምህርት ሞጁሎች' },
    analytics: { en: 'Learning Analytics & Stats', am: 'የጥናት መረጃዎችና ስታቲስቲክስ' },
    billing: { en: 'Subscription & Local Billing', am: 'የክፍያና ደንበኝነት መረጃ' },
    security: { en: 'Security & Session Logs', am: 'የደህንነትና የመግቢያ መረጃዎች' }
  };

  const quickActionLabels: Record<ProfileQuickActionKey, { en: string; am: string }> = {
    academic: { en: 'Academic View', am: 'አካዳሚክ' },
    analytics: { en: 'Analytics', am: 'መረጃዎች' },
    billing: { en: 'Billing & Plan', am: 'ክፍያ' },
    security: { en: 'Security', am: 'ደህንነት' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        style={{ borderColor: `${currentTheme.hex}40` }}
      >
        {/* Hidden banner file input */}
        <input 
          type="file" 
          ref={bannerFileInputRef} 
          onChange={handleBannerUpload} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
              style={{ backgroundColor: `${currentTheme.hex}25`, color: currentTheme.hex }}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  {language === 'en' ? 'Customize Profile Page' : 'የመገለጫ ገጽ ማበጃ'}
                </h3>
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: currentTheme.badgeBg,
                    color: currentTheme.badgeText,
                    borderColor: currentTheme.badgeBorder
                  }}
                >
                  {language === 'en' ? 'Live Preview' : 'ቀጥታ እይታ'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'en' 
                  ? 'Adjust layout, colors, banners, and section visibility in real-time.' 
                  : 'የገጽ አቀማመጥ፣ ቀለማት፣ ባነር እና የክፍል ቅደም ተከተል ያብጁ።'}
              </p>
            </div>
          </div>

          <button
            onClick={() => { playClickChime(); onClose(); }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/90 overflow-x-auto no-scrollbar px-2 pt-2 gap-1">
          {[
            { id: 'visual', label: language === 'en' ? 'Visual & Theme' : 'ቀለምና ቅርጽ', icon: Palette },
            { id: 'sections', label: language === 'en' ? 'Sections & Order' : 'ክፍሎች', icon: Layers },
            { id: 'badges', label: language === 'en' ? 'Badge & Info' : 'ባጅና መረጃ', icon: Star },
            { id: 'modules', label: language === 'en' ? 'Modules View' : 'ሞጁሎች', icon: Tag },
            { id: 'actions', label: language === 'en' ? 'Quick Actions' : 'ፈጣን ቁልፎች', icon: Layout }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { playClickChime(); setActiveTab(tab.id as any); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                  isActive 
                    ? 'text-white border-amber-400 bg-slate-900' 
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
                }`}
                style={isActive ? { borderBottomColor: currentTheme.hex, color: currentTheme.hex } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-grow">
          
          {/* TAB 1: VISUAL & THEME */}
          {activeTab === 'visual' && (
            <div className="space-y-6">
              
              {/* 1. Profile Card Layout Style */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  {language === 'en' ? '1. Profile Card Layout Style' : '፩. የመገለጫ ካርድ የአቀራረብ ዘይቤ'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => update({ cardLayout: 'compact' })}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      preferences.cardLayout === 'compact'
                        ? 'border-amber-400 bg-amber-500/10 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                    style={preferences.cardLayout === 'compact' ? { borderColor: currentTheme.hex } : {}}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <Layout className="w-4 h-4 text-amber-400" style={{ color: currentTheme.hex }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span>{language === 'en' ? 'Compact Card View' : 'የተጠቃለለ (Compact)'}</span>
                        {preferences.cardLayout === 'compact' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {language === 'en' ? 'Streamlined, slim header with high space efficiency.' : 'አነስተኛ ቦታ የሚይዝ ቀልጣፋ ቅርጽ።'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => update({ cardLayout: 'detailed' })}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      preferences.cardLayout === 'detailed'
                        ? 'border-amber-400 bg-amber-500/10 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                    style={preferences.cardLayout === 'detailed' ? { borderColor: currentTheme.hex } : {}}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4 text-amber-400" style={{ color: currentTheme.hex }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span>{language === 'en' ? 'Detailed & Expanded View' : 'ሰፋፊና ዝርዝር (Detailed)'}</span>
                        {preferences.cardLayout === 'detailed' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {language === 'en' ? 'Banner cover behind avatar, full bio, and badge showcases.' : 'የጀርባ ባነር፣ ሙሉ ባዮ እና የክብር ባጆች ያሉት።'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Theme / Accent Color Picker */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  {language === 'en' ? '2. Theme Accent Color (Profile UI)' : '፪. የመገለጫ ገጽ ዋነኛ ቀለም'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.values(ACCENT_THEMES).map((theme) => {
                    const isSelected = preferences.accentColor === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => update({ accentColor: theme.id })}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-white bg-slate-800 shadow-md ring-1 ring-white/40' 
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                        }`}
                      >
                        <span 
                          className="w-6 h-6 rounded-full shrink-0 border border-white/20 shadow-inner flex items-center justify-center"
                          style={{ backgroundColor: theme.hex }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {language === 'en' ? theme.name : theme.nameAm}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 uppercase">
                            {theme.hex}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Cover / Banner Image */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    {language === 'en' ? '3. Cover / Banner Image' : '፫. የካርድ ጀርባ ባነር'}
                  </label>
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    style={{ color: currentTheme.hex }}
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isProcessingBanner ? '...' : (language === 'en' ? 'Upload Custom Photo' : 'የራስዎን ባነር ይጫኑ')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BANNER_PRESETS.map((preset) => {
                    const isSelected = preferences.coverBannerUrl === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => update({ coverBannerUrl: preset.id })}
                        className={`h-16 rounded-xl border relative overflow-hidden transition-all cursor-pointer p-2 flex flex-col justify-end text-left ${
                          isSelected ? 'ring-2 ring-amber-400 border-amber-400' : 'border-slate-800 hover:border-slate-700'
                        }`}
                        style={{
                          background: preset.css,
                          borderColor: isSelected ? currentTheme.hex : undefined
                        }}
                      >
                        <span className="text-[10.5px] font-bold text-white drop-shadow-md z-10 truncate">
                          {language === 'en' ? preset.name : preset.nameAm}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Profile Render Mode (System / Dark / Light) */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  {language === 'en' ? '4. Profile Page Lighting Mode' : '፬. የመገለጫ ገጽ ብርሃን ሁኔታ'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'system', label: language === 'en' ? 'System / Match App' : 'መደበኛ', icon: Monitor },
                    { id: 'dark', label: language === 'en' ? 'Pure Dark' : 'ጨለማ', icon: Moon },
                    { id: 'light', label: language === 'en' ? 'Crisp Light' : 'ብርሃን', icon: Sun }
                  ].map(mode => {
                    const Icon = mode.icon;
                    const isSelected = preferences.renderMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => update({ renderMode: mode.id as ProfileRenderMode })}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                          isSelected 
                            ? 'border-amber-400 bg-amber-500/10 text-white font-bold' 
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                        style={isSelected ? { borderColor: currentTheme.hex, color: currentTheme.hex } : {}}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] truncate">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SECTIONS VISIBILITY & ORDER */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>{language === 'en' ? 'Toggle section visibility and adjust display order.' : 'የክፍሎችን መታየት እና ቅደም ተከተል ይቆጣጠሩ።'}</span>
                <span className="font-mono text-[10px]">{preferences.sectionOrder.length} sections</span>
              </div>

              <div className="space-y-2">
                {preferences.sectionOrder.map((secKey, index) => {
                  const isVisible = preferences.sectionVisibility[secKey] ?? true;
                  const label = sectionLabels[secKey] || { en: secKey, am: secKey };
                  const isFirst = index === 0;
                  const isLast = index === preferences.sectionOrder.length - 1;

                  return (
                    <div 
                      key={secKey}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isVisible ? 'bg-slate-950 border-slate-800' : 'bg-slate-950/40 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-200 truncate">
                            {language === 'en' ? label.en : label.am}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            Key: {secKey}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Visibility toggle button */}
                        <button
                          type="button"
                          onClick={() => {
                            update({
                              sectionVisibility: {
                                ...preferences.sectionVisibility,
                                [secKey]: !isVisible
                              }
                            });
                          }}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isVisible 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                          title={isVisible ? 'Visible' : 'Hidden'}
                        >
                          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        {/* Reorder Up */}
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => moveSection(index, 'up')}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Move up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Reorder Down */}
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => moveSection(index, 'down')}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Move down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" style={{ color: currentTheme.hex }} />
                <span>
                  {language === 'en' 
                    ? 'Long sections can also be individually collapsed or expanded on the page anytime.' 
                    : 'ረጅም ክፍሎችን በገጹ ላይ በቀላሉ ማስፋፋትና ማጠቃለል ይችላሉ።'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: BADGES & PUBLIC INFO */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              
              {/* Customizable Badge Title */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  {language === 'en' ? 'Choose Display Badge / Title' : 'የሚታየውን የማዕረግ ባጅ ይምረጡ'}
                </label>
                <div className="space-y-2">
                  {availableBadges.map((badge) => {
                    const isSelected = (preferences.selectedBadgeTitle || '') === badge.id;
                    return (
                      <button
                        key={badge.id || 'default'}
                        type="button"
                        onClick={() => update({ selectedBadgeTitle: badge.id })}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-amber-400 bg-amber-500/10 text-white' 
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                        style={isSelected ? { borderColor: currentTheme.hex } : {}}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border"
                              style={{
                                backgroundColor: currentTheme.badgeBg,
                                color: currentTheme.badgeText,
                                borderColor: currentTheme.badgeBorder
                              }}
                            >
                              {badge.title}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {badge.desc}
                          </p>
                        </div>
                        <Star className="w-4 h-4 text-slate-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Show / Hide Public Fields on Header Card */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  {language === 'en' ? 'Card Field Visibility (Show / Hide)' : 'በካርዱ ላይ የሚታዩ መረጃዎች'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'email', label: language === 'en' ? 'Email Address' : 'የኢሜይል አድራሻ' },
                    { key: 'institution', label: language === 'en' ? 'University / School' : 'ተቋም / ዩኒቨርሲቲ' },
                    { key: 'department', label: language === 'en' ? 'Department / Faculty' : 'የትምህርት ክፍል' },
                    { key: 'targetGpa', label: language === 'en' ? 'Target GPA' : 'የታለመ GPA' },
                    { key: 'bio', label: language === 'en' ? 'Academic Bio / Motto' : 'መሪ ቃል' }
                  ].map(field => {
                    const isVisible = preferences.visibleFields[field.key as keyof typeof preferences.visibleFields] ?? true;
                    return (
                      <button
                        key={field.key}
                        type="button"
                        onClick={() => {
                          update({
                            visibleFields: {
                              ...preferences.visibleFields,
                              [field.key]: !isVisible
                            }
                          });
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                          isVisible 
                            ? 'bg-slate-950 border-slate-700 text-slate-200' 
                            : 'bg-slate-950/50 border-slate-900 text-slate-500'
                        }`}
                      >
                        <span className="font-semibold">{field.label}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          isVisible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isVisible ? (language === 'en' ? 'Shown' : 'ይታያል') : (language === 'en' ? 'Hidden' : 'ተሰውሯል')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: ENROLLED MODULES VIEW */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              
              {/* Display Mode: Cloud vs List vs Grid */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  {language === 'en' ? 'Modules Layout Format' : 'የሞጁሎች ማሳያ ቅርጽ'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cloud', label: language === 'en' ? 'Tag Cloud' : 'ታግ ክላውድ', icon: Tag },
                    { id: 'list', label: language === 'en' ? 'List View' : 'ዝርዝር', icon: List },
                    { id: 'grid', label: language === 'en' ? 'Grid Cards' : 'ፍርግርግ (Grid)', icon: Grid }
                  ].map(mode => {
                    const Icon = mode.icon;
                    const isSelected = preferences.modulesDisplayMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => update({ modulesDisplayMode: mode.id as ModulesDisplayMode })}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-amber-400 bg-amber-500/10 text-white font-bold' 
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                        style={isSelected ? { borderColor: currentTheme.hex, color: currentTheme.hex } : {}}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pin Favorite or Priority Modules */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    {language === 'en' ? 'Pin Priority Focus Modules' : 'ቅድሚያ የሚሰጣቸውን ሞጁሎች ይሰኩ (Pin)'}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {preferences.pinnedModules.length} pinned
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {language === 'en' 
                    ? 'Pinned modules stay anchored at the top of your enrolled list with a star indicator.' 
                    : 'የተሰኩ ሞጁሎች ከላይ በኮከብ ምልክት ጎልተው ይታያሉ።'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {(profile.subjects || subjectsList).map((subject) => {
                    const isPinned = preferences.pinnedModules.includes(subject);
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => {
                          const nextPinned = isPinned
                            ? preferences.pinnedModules.filter(m => m !== subject)
                            : [...preferences.pinnedModules, subject];
                          update({ pinnedModules: nextPinned });
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                          isPinned 
                            ? 'border-amber-400/80 bg-amber-500/10 text-amber-300 font-bold' 
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                        style={isPinned ? { borderColor: currentTheme.hex, color: currentTheme.hex } : {}}
                      >
                        <span className="truncate pr-2">{subject}</span>
                        <Star 
                          className={`w-3.5 h-3.5 shrink-0 ${isPinned ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                          style={isPinned ? { fill: currentTheme.hex, color: currentTheme.hex } : {}}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: QUICK ACTIONS ROW */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>{language === 'en' ? 'Customize the 4 category navigation tabs.' : 'የአራት ክፍሎችን ፈጣን ቁልፎች ቅደም ተከተል ያስተካክሉ።'}</span>
              </div>

              <div className="space-y-2">
                {preferences.quickActionsOrder.map((actionKey, index) => {
                  const isVisible = preferences.quickActionsVisibility[actionKey] ?? true;
                  const label = quickActionLabels[actionKey] || { en: actionKey, am: actionKey };
                  const isFirst = index === 0;
                  const isLast = index === preferences.quickActionsOrder.length - 1;

                  return (
                    <div 
                      key={actionKey}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isVisible ? 'bg-slate-950 border-slate-800' : 'bg-slate-950/40 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-bold text-xs text-slate-200">
                          {language === 'en' ? label.en : label.am}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            update({
                              quickActionsVisibility: {
                                ...preferences.quickActionsVisibility,
                                [actionKey]: !isVisible
                              }
                            });
                          }}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isVisible 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => moveQuickAction(index, 'up')}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => moveQuickAction(index, 'down')}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              playClickChime();
              onUpdatePreferences({
                cardLayout: 'detailed',
                coverBannerUrl: 'gradient-wolkite',
                accentColor: 'gold',
                renderMode: 'system',
                selectedBadgeTitle: '',
                visibleFields: { email: true, institution: true, department: true, targetGpa: true, bio: true },
                sectionOrder: ['academic', 'modules', 'analytics', 'billing', 'security'],
                sectionVisibility: { academic: true, modules: true, analytics: true, billing: true, security: true },
                collapsedSections: {},
                modulesDisplayMode: 'cloud',
                pinnedModules: [],
                quickActionsOrder: ['academic', 'analytics', 'billing', 'security'],
                quickActionsVisibility: { academic: true, analytics: true, billing: true, security: true }
              });
            }}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Reset to Defaults' : 'ወደ ነባሪ መልስ'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSuccessChime();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95"
            style={{ backgroundColor: currentTheme.hex, color: '#0A1128' }}
          >
            {language === 'en' ? 'Done Customizing' : 'ተጠናቋል'}
          </button>
        </div>

      </div>
    </div>
  );
}
