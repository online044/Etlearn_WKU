import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Check, Sparkles } from 'lucide-react';
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
        // Offscreen Canvas to scale to exact square 140x140px with high quality
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const targetWidth = 140;
        const targetHeight = 140;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        if (ctx) {
          // Draw image cropped in center square
          const minD = Math.min(img.width, img.height);
          const sx = (img.width - minD) / 2;
          const sy = (img.height - minD) / 2;
          
          ctx.drawImage(img, sx, sy, minD, minD, 0, 0, targetWidth, targetHeight);
          
          // Export compact base64 jpeg
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
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
    <div className="space-y-4 p-5 bg-[#0F172A] rounded-2xl border border-slate-800 shadow-md">
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Main interactive preview */}
        <div 
          className="relative group cursor-pointer shrink-0" 
          onClick={triggerUpload} 
          title="Click to upload custom photo"
        >
          <StudentAvatar 
            avatar={currentAvatar} 
            name={name} 
            size={80} 
            className="border-2 border-amber-400 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200" 
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-1 border-2 border-slate-900 shadow">
            <Sparkles className="w-3 h-3" />
          </div>
        </div>

        {/* Dynamic uploads & options panel */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Profile Icon & Identity
            </label>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
              Customizable
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select an Ethiopian scholarly crest icon below, or upload your own student portrait photo.
          </p>
          
          <div className="flex justify-center sm:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={triggerUpload}
              disabled={isProcessing}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 active:scale-98"
            >
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>{isProcessing ? "Processing..." : "Upload Custom Photo"}</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          {errorText && <p className="text-xs text-red-400 font-medium">{errorText}</p>}
        </div>
      </div>

      {/* Preset selection circles */}
      <div className="space-y-2.5 pt-3 border-t border-slate-800">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          Choose Academic & Cultural Crest:
        </span>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {AVATAR_PRESETS.map((preset) => {
            const isSelected = currentAvatar === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.id)}
                className={`relative p-1 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-amber-400 bg-amber-500/20 scale-105 shadow-md shadow-amber-500/20' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900'
                }`}
                title={preset.name}
              >
                <StudentAvatar avatar={preset.id} name={name} size={38} className="border-0 shadow-none" />
                {isSelected && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 border border-slate-900">
                    <Check className="w-2.5 h-2.5 stroke-[3px]" />
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
