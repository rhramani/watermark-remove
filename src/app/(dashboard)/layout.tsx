"use client";

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <Sidebar />
      
      <div className="lg:pl-64 pt-20 flex flex-col h-[calc(100vh-80px)] overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {children}
        </div>
      </div>

      {/* Floating Status / Background Decorations */}
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-[120px] -z-10 animate-pulse" />
    </div>
  );
}
