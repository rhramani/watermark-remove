"use client";

import React from 'react';
import { 
  Image as ImageIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  RotateCw, 
  Move
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export const WatermarkControls = () => {
  const { settings, updateSettings } = useAppStore();

  return (
    <div className="w-80 h-full p-6 space-y-8 glass border-l border-white/10 custom-scrollbar overflow-y-auto">
      <div className="space-y-6">
        <div className="space-y-4">
          <label className="text-sm font-medium text-slate-300">Upload Logo</label>
          <div 
            onClick={() => document.getElementById('logo-upload')?.click()}
            className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-white/5 relative overflow-hidden group"
          >
              <input 
                id="logo-upload"
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const preview = URL.createObjectURL(file);
                    updateSettings({ logoFile: file, logoPreview: preview });
                  }
                }}
              />
              {settings.logoPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-slate-800 flex items-center justify-center p-4">
                  <img 
                    src={settings.logoPreview} 
                    alt="Logo preview" 
                    className="max-w-full max-h-full object-contain mix-blend-screen brightness-110 contrast-125" 
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-xs font-bold text-white uppercase tracking-tighter">Replace Logo</p>
                  </div>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-primary transition-colors" />
                  <p className="text-xs text-slate-500">All image formats supported</p>
                </>
              )}
          </div>
          
          {settings.logoPreview && (
            <div className="space-y-4 pt-4">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-300">Logo Size</label>
                <span className="text-sm font-bold text-primary">{settings.fontSize}%</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="100"
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Positioning</label>
        <div className="grid grid-cols-3 gap-2">
          {['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map((pos) => (
            <button
              key={pos}
              onClick={() => updateSettings({ position: pos as any })}
              className={cn(
                "aspect-square rounded-lg border border-white/10 transition-all flex items-center justify-center",
                settings.position === pos ? "bg-primary border-primary" : "bg-white/5 hover:bg-white/10"
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
