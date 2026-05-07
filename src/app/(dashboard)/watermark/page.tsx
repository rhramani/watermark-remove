"use client";

import React from 'react';
import { UploadArea } from '@/components/UploadArea';
import { WatermarkControls } from '@/components/WatermarkControls';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Download, RefreshCw, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function WatermarkPage() {
  const { watermarkImages, settings, clearImages } = useAppStore();
  const [loading, setLoading] = React.useState(false);
  const [processedFiles, setProcessedFiles] = React.useState<string[]>([]);
  const images = watermarkImages;

  const handleProcess = async () => {
    if (images.length === 0) return;
    setLoading(true);

    try {
      const formData = new FormData();
      images.forEach((img) => formData.append('images', img.file));
      formData.append('settings', JSON.stringify({ ...settings, type: 'logo' }));

      if (settings.logoFile) {
        formData.append('logo', settings.logoFile);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.filenames) {
        setProcessedFiles(response.data.filenames);
        alert(`Successfully processed ${images.length} images!`);
      }
    } catch (error: any) {
      console.error('Processing failed:', error);
      const message = error.response?.data?.error || 'Failed to process images. Make sure the backend is running.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (processedFiles.length === 0) return;
    
    if (processedFiles.length === 1) {
      // Direct download for single image using the force-download endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const filename = processedFiles[0];
      window.location.href = `${apiUrl}/api/download/${filename}`;
    } else {
      // ZIP download for multiple images
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const filenames = JSON.stringify(processedFiles);
      window.location.href = `${apiUrl}/api/download-bulk?filenames=${filenames}`;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <header className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                <span>AI Powered Engine</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Watermarking</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl">
                Batch process your images with professional grade logo watermarks seamlessly.
              </p>
            </motion.div>
          </header>

          <section className="space-y-12">
            <UploadArea type="watermark" />

            {images.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between p-6 glass rounded-3xl border-primary/20 bg-primary/5"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-primary/20 rounded-2xl">
                    <Zap className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{images.length} Images Ready</h4>
                    <p className="text-slate-400 text-sm">Configure your watermark settings and start processing.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => {
                      clearImages('watermark');
                      setProcessedFiles([]);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all text-slate-300"
                  >
                    <RefreshCw className="w-4 h-4" /> Reset
                  </button>
                  
                  {processedFiles.length > 0 ? (
                    <button 
                      type="button"
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold transition-all shadow-xl shadow-accent/30 animate-in zoom-in duration-300"
                    >
                      <Download className="w-4 h-4" /> 
                      {processedFiles.length === 1 ? 'Download Image' : 'Download All (ZIP)'}
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleProcess}
                      disabled={loading}
                      className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-xl font-bold transition-all shadow-xl shadow-primary/30"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      {loading ? 'Processing...' : 'Process Bulk'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </section>
        </motion.div>
      </div>
      
      {/* Right Controls Panel */}
      <WatermarkControls />
    </div>
  );
}
