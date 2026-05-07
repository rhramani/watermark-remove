"use client";

import React from 'react';
import { UploadArea } from '@/components/UploadArea';
import { AIRemoval } from '@/components/AIRemoval';
import { motion } from 'framer-motion';
import { Eraser } from 'lucide-react';

export default function RemovalPage() {
  return (
    <div className="p-8 overflow-y-auto custom-scrollbar relative h-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <header>
          <div className="flex items-center gap-2 text-accent font-semibold text-sm uppercase tracking-widest">
            <Eraser className="w-4 h-4" />
            <span>Pro AI Eraser</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Remove <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Anything</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mt-2">
            Use our advanced AI engine to remove watermarks, logos, and unwanted objects from your images.
          </p>
        </header>

        <section className="space-y-12">
          <UploadArea type="removal" />
          <AIRemoval />
        </section>
      </motion.div>
    </div>
  );
}
