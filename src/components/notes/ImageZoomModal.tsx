import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  caption?: string;
  altText?: string;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  caption,
  altText
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.3, 3.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.3, 0.7));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-md p-4 select-none"
      onClick={onClose}
    >
      {/* Top action toolbar */}
      <div
        className="w-full flex items-center justify-between max-w-4xl pt-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-slate-400 truncate max-w-md">
          {altText || 'Document Visual'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono text-amber-400 font-bold px-1">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Reset zoom"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 ml-2 transition-colors"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div
        className="flex-1 w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={altText || 'Note visual'}
          className="max-h-[80vh] max-w-full object-contain transition-transform duration-100 rounded-lg shadow-2xl"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
          }}
          draggable={false}
        />
      </div>

      {/* Bottom Caption */}
      {caption && (
        <div
          className="w-full max-w-xl text-center py-2 px-4 bg-white/10 rounded-xl backdrop-blur-md text-xs sm:text-sm text-slate-200 mt-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {caption}
        </div>
      )}
    </div>
  );
};
