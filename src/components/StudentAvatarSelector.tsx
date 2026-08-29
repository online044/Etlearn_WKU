/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Check } from 'lucide-react';
import StudentAvatar, { AVATAR_PRESETS } from './StudentAvatar';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';

interface StudentAvatarSelectorProps {
  currentAvatar?: string;
  name: string;
  onChange: (avatar: string) => void;
}

export default function StudentAvatarSelector({ currentAvatar, name, onChange }: StudentAvatarSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handlePresetSelect = (presetId: string) => {
    playClickChime();
    onChange(presetId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorText("Only image files are supported.");
      playFailureChime();
      return;
    }

    setIsProcessing(true);
    setErrorText(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Offscreen Canvas to scale to exact square 120x120px with high compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const targetWidth = 120;
        const targetHeight = 120;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        if (ctx) {
          // Draw image cropped in center square
          const minD = Math.min(img.width, img.height);
          const sx = (img.width - minD) / 2;
          const sy = (img.height - minD) / 2;
          
          ctx.drawImage(img, sx, sy, minD, minD, 0, 0, targetWidth, targetHeight);
          
          // Export compact base64 jpeg
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          onChange(compressedBase64);
          playSuccessChime();
        } else {
          setErrorText("Canvas rendering failure.");
          playFailureChime();
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        setErrorText("Failed to read student image.");
        playFailureChime();
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    playClickChime();
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4 p-4.5 bg-[#0D0D0D] rounded-xl border border-[#2A2A2A]">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Main interactive preview */}
        <div className="relative group cursor-pointer" onClick={triggerUpload} title="Click to upload custom photo">
          <StudentAvatar 
            avatar={currentAvatar} 
            name={name} 
            size={74} 
            className="border-2 border-[#C8962E] hover:scale-105 duration-300" 
          />
          <div className="absolute inset-0 bg-[#000]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Dynamic uploads & options panel */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
            Student Photo Identity
          </label>
          <p className="text-[11px] text-zinc-500 leading-normal">
            Personalize your EthioLearn Pro profile card with native cultural illustration vectors or your school photo.
          </p>
          
          <div className="flex justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={triggerUpload}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-[#151515] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#3A3A3A] hover:text-zinc-200 text-zinc-400 text-[10px] uppercase font-mono font-bold tracking-widest rounded transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#C8962E]" />
              {isProcessing ? "Processing..." : "Upload school photo"}
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          {errorText && <p className="text-[10px] text-rose-500">{errorText}</p>}
        </div>
      </div>

      {/* Preset selection circles */}
      <div className="space-y-1.5 pt-2 border-t border-[#1C1C1C]">
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block">
          Preset Campus Characters:
        </span>
        <div className="flex flex-wrap gap-2.5">
          {AVATAR_PRESETS.map((preset) => {
            const isSelected = currentAvatar === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.id)}
                className={`relative p-0.5 rounded-full border cursor-pointer hover:scale-110 duration-200 ${
                  isSelected ? 'border-[#C8962E] bg-[#C8962E]/10' : 'border-zinc-800 hover:border-zinc-700 bg-transparent'
                }`}
                title={preset.name}
              >
                <StudentAvatar avatar={preset.id} name={name} size={36} className="border-0" />
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border border-[#0D0D0D]">
                    <Check className="w-2.5 h-2.5 stroke-[4px]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
