/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, FileText, MoreVertical, Sparkles } from 'lucide-react';
import { AppView } from '../types';
import { RECENT_SCANS } from '../constants';

interface LibraryProps {
  onNavigate: (view: AppView) => void;
}

export default function Library({ onNavigate }: LibraryProps) {
  const categories = ['All', 'Recent', 'Invoices', 'Personal', 'Work'];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pt-32 pb-32 px-8 max-w-7xl mx-auto"
    >
      <header className="mb-12 space-y-6">
        <div>
          <h1 className="text-[52px] font-bold leading-[1.1] tracking-tight mb-2 text-white">
            Document <span className="opacity-40 font-light">Library</span>
          </h1>
          <p className="text-zinc-500 max-w-lg">Manage and analyze your digital archive with ultra-precise AI extraction.</p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full h-14 bg-primary-800/50 border border-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-ai-blue/30 transition-all outline-none glass-card"
            />
          </div>
          <button className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center text-gray-400 hover:text-ai-blue transition-colors">
            <SlidersHorizontal className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`px-8 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                i === 0 ? 'bg-ai-blue text-white ai-glow' : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {RECENT_SCANS.map((scan) => (
          <div
            key={scan.id}
            className="group relative bg-primary-800/40 border border-white/5 rounded-[28px] overflow-hidden hover:border-ai-blue/30 transition-all duration-300 hover:shadow-2xl glass-card p-6 flex flex-col gap-4"
          >
            <div className="h-48 rounded-[18px] bg-primary-700/30 flex items-center justify-center overflow-hidden border border-white/5 relative group">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <FileText className="w-20 h-20" />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-primary-800/80 via-transparent to-transparent opacity-60"></div>
            </div>

            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-white leading-tight">{scan.name}</h3>
                <div className="flex items-center gap-2 text-xs text-zinc-500 tracking-widest font-medium">
                  <span>{scan.type}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                  <span>{scan.size}</span>
                </div>
              </div>
              {scan.isAiEnhanced && (
                <div className="badge-ai">✨ AI Enhanced</div>
              )}
            </div>
          </div>
        ))}

        <button className="group border-2 border-dashed border-white/10 rounded-[28px] flex flex-col items-center justify-center p-8 hover:border-ai-blue/50 hover:bg-ai-blue/5 transition-all aspect-video md:aspect-auto">
          <div className="w-16 h-16 rounded-full bg-primary-800 flex items-center justify-center mb-4 group-hover:bg-ai-blue transition-all duration-300">
            <Search className="w-8 h-8 text-gray-500 group-hover:text-white" />
          </div>
          <p className="font-bold text-gray-500 group-hover:text-ai-blue">Scan or Upload</p>
        </button>
      </div>
    </motion.div>
  );
}
