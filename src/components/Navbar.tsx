"use client";

import React from 'react';
import { Shield, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const Navbar = () => {
  const [isDark, setIsDark] = React.useState(true);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 glass border-b border-white/10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <div className="p-2 bg-primary rounded-xl">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          Watermark<span className="text-primary">Pro</span>
        </span>
      </motion.div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
};
