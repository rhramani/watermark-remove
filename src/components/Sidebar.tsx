"use client";

import React from 'react';
import { 
  Eraser, 
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { icon: Layers, label: 'Watermark', id: 'watermark', path: '/watermark' },
  { icon: Eraser, label: 'AI Removal', id: 'removal', path: '/removal' },
];

interface SidebarProps {}

export const Sidebar = ({}: SidebarProps) => {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 pt-24 px-4 glass border-r border-white/10 hidden lg:block">
      <div className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.path}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
              pathname === item.path 
                ? "bg-primary/10 text-primary" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            {pathname === item.path && (
              <motion.div 
                layoutId="active-pill"
                className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
              />
            )}
            <item.icon className={cn(
              "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
              pathname === item.path ? "text-primary" : "text-slate-400"
            )} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

    </aside>
  );
};
