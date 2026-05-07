"use client";

import React, { useState } from 'react';
import { Eraser, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import axios from 'axios';

export const AIRemoval = () => {
  const { removalImages, removeImage } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleRemove = async () => {
    if (removalImages.length === 0) {
      alert('Please upload an image first!');
      return;
    }

    setIsProcessing(true);
    setIsDone(false);
    
    try {
      const formData = new FormData();
      formData.append('image', removalImages[0].file);

      const response = await axios.post('http://localhost:5000/api/remove-watermark', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.url) {
        setResultUrl(response.data.url);
        setIsDone(true);
      }
    } catch (error: any) {
      console.error('Watermark Removal failed:', error);
      
      let message = 'Failed to remove watermark.';
      
      if (!error.response) {
        message = 'Cannot connect to the backend server. Please ensure you have run "npm run dev" or "node server/index.js" and that it is running on port 5000.';
      } else {
        message = error.response.data?.error || 'Server error. Please check the backend logs for details.';
      }
      
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const filename = resultUrl.split('/').pop();
    window.location.href = `http://localhost:5000/api/download/${filename}`;
  };

  const handleReset = () => {
    setIsDone(false);
    setResultUrl(null);
  };

  if (removalImages.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eraser className="w-10 h-10 text-slate-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Image Selected</h3>
        <p className="text-slate-400">Upload an image in the gallery to start AI watermark removal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Original Image Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Original Image</h4>
            {!isProcessing && !isDone && (
              <button 
                onClick={() => removeImage(removalImages[0].id, 'removal')}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Change Image
              </button>
            )}
          </div>
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group">
            <img 
              src={removalImages[0].preview} 
              alt="Original" 
              className="w-full h-full object-contain"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-accent animate-spin" />
                <div className="text-center">
                  <p className="font-bold text-lg text-white">AI is Processing...</p>
                  <p className="text-slate-400 text-sm">Identifying and removing watermarks</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cleaned Image Preview */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Cleaned Result</h4>
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
            {isDone && resultUrl ? (
              <>
                <img 
                  src={resultUrl} 
                  alt="Cleaned" 
                  className="w-full h-full object-contain animate-in zoom-in-95 duration-500"
                />
                <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> AI Enhanced
                </div>
              </>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                  <Eraser className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm italic">Cleaned version will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 glass rounded-3xl border-accent/20 bg-accent/5 overflow-hidden relative">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between relative z-10">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Auto Watermark Remover</h3>
            <p className="text-slate-400 text-sm max-w-md">
              Using state-of-the-art neural networks to reconstruct image data behind watermarks and logos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {isDone ? (
              <>
                <button 
                  onClick={handleReset}
                  className="px-8 py-4 rounded-2xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Try Another
                </button>
                <button 
                  onClick={handleDownload}
                  className="px-8 py-4 rounded-2xl font-black text-lg bg-green-500 hover:bg-green-600 text-white shadow-2xl shadow-green-500/20 transition-all scale-105 hover:scale-110 active:scale-95 flex items-center justify-center gap-2"
                >
                  Download Result
                </button>
              </>
            ) : (
              <button 
                onClick={handleRemove}
                disabled={isProcessing}
                className={cn(
                  "min-w-[240px] py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all",
                  !isProcessing
                    ? "bg-accent hover:bg-accent-hover text-white shadow-2xl shadow-accent/40 scale-105 hover:scale-110 active:scale-95" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Eraser className="w-6 h-6" /> Start AI Removal
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Animated Background Decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />
      </div>
    </div>
  );
};
