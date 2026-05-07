"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export const UploadArea = ({ type = 'watermark' }: { type?: 'watermark' | 'removal' }) => {
  const { watermarkImages, removalImages, addImages, removeImage } = useAppStore();
  const images = type === 'watermark' ? watermarkImages : removalImages;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    addImages(acceptedFiles, type);
  }, [addImages, type]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: type === 'watermark' // Only allow multiple for watermark batch processing
  });

  return (
    <div className="w-full space-y-6">
      <div 
        {...getRootProps()} 
        className={cn(
          "relative group cursor-pointer transition-all duration-500",
          "border-2 border-dashed rounded-3xl p-12 text-center",
          isDragActive 
            ? "border-primary bg-primary/5 scale-[0.99]" 
            : "border-white/10 hover:border-primary/50 hover:bg-white/5"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "p-6 rounded-2xl bg-white/5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
            isDragActive ? "bg-primary/20 scale-110" : ""
          )}>
            <CloudUpload className={cn(
              "w-12 h-12 transition-colors",
              isDragActive ? "text-primary" : "text-slate-400 group-hover:text-primary"
            )} />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">
              Drop your images here
            </h3>
            <p className="text-slate-400">
              Supports all image formats (JPG, PNG, WEBP, etc). Max 20MB per file.
            </p>
          </div>
          
          <button type="button" className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all">
            Browse Files
          </button>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-3xl" />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AnimatePresence>
            {images.map((img) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-2xl overflow-hidden group border border-white/10"
              >
                <img 
                  src={img.preview} 
                  alt="preview" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => removeImage(img.id, type)}
                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
