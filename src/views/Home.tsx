/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { FileText, Sparkles, Clock, LayoutGrid, Zap, Bot, BarChart3 } from 'lucide-react';
import { AppView } from '../types';
import { RECENT_SCANS, SMART_SUGGESTIONS } from '../constants';
import { GlassCard, AIOrb, ActionChip, PrimaryButton, AIChip } from '../components/PremiumComponents';
import { DURATIONS, EASINGS } from '../lib/animations';
import { FadeScale } from '../components/animations/FadeScale';

interface HomeProps {
  onNavigate: (view: AppView) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATIONS.NORMAL, ease: EASINGS.MAIN }}
      className="pt-32 px-8 pb-32 flex flex-col lg:flex-row gap-10 max-w-7xl mx-auto"
    >
      <div className="flex-1 space-y-12">
        <FadeScale delay={0}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AIChip label="Enterprise Pro" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                <motion.div 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1 h-1 rounded-full bg-ai-blue shadow-[0_0_8px_#4F7CFF]"
                />
                <span className="text-[9px] font-black text-ai-blue uppercase tracking-widest">Live Sync</span>
              </div>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tighter text-white">
              Bonjour Alexandre
            </h1>
            <p className="text-lg text-gray-500 font-medium tracking-tight">C'est une excellente journée pour numériser.</p>
          </div>
        </FadeScale>

        {/* AI Intelligence Hub */}
        <FadeScale delay={100}>
          <div className="grid grid-cols-1 gap-6">
            <GlassCard glow className="p-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-8">
                  <div className="flex items-center gap-5">
                    <AIOrb size="w-16 h-16" />
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Zen Intelligence</h2>
                      <p className="text-sm text-gray-500 font-medium">Auto-organisation en cours...</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <ActionChip icon={Zap} label="Analyse Rapide" active />
                    <ActionChip icon={BarChart3} label="Statistiques" />
                    <ActionChip icon={Sparkles} label="Optimiser OCR" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Factures', count: 12, color: 'text-ai-blue' },
                    { label: 'Contrats', count: 4, color: 'text-emerald-400' }
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/5 rounded-2xl p-5 border border-white/5 min-w-[120px] backdrop-blur-sm">
                      <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </FadeScale>

        {/* Improved Document Gallery */}
        <div className="space-y-8">
          <FadeScale delay={200}>
            <div className="flex justify-between items-end px-2">
              <div>
                <p className="text-[10px] font-black text-ai-blue uppercase tracking-[0.4em] mb-2">Portfolio</p>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Dernières Captures</h3>
              </div>
              <button className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-2 group">
                Explorer tout <LayoutGrid className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </FadeScale>

          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 -mx-2 px-2">
            {RECENT_SCANS.map((scan, i) => (
              <FadeScale key={`gallery-${scan.id}`} delay={300 + (i * 80)}>
                <div className="flex-shrink-0">
                  <GlassCard className="w-56 overflow-hidden" hoverScale={false}>
                    <div className="relative aspect-[1/1.4] bg-white p-6 space-y-4 overflow-hidden group">
                      <div className="h-6 w-2/3 bg-gray-100 rounded-lg animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-1.5 w-full bg-gray-50 rounded-full" />
                        <div className="h-1.5 w-4/5 bg-gray-50 rounded-full" />
                        <div className="h-1.5 w-full bg-gray-50 rounded-full" />
                      </div>
                      <div className="pt-10 flex justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                         <FileText className="w-16 h-16 text-primary-900" />
                      </div>
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-ai-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
                      
                      <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-ai-blue/10 border border-ai-blue/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-ai-blue" />
                      </div>
                    </div>
                    <div className="p-5 space-y-1 bg-white/[0.03]">
                      <h4 className="text-sm font-bold text-white truncate">{scan.name}</h4>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{scan.modifiedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </FadeScale>
            ))}
          </div>
        </div>
      </div>

      {/* Workspace Sidebar */}
      <div className="lg:w-80 space-y-8">
        <div className="space-y-6">
          <FadeScale delay={500}>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2">AI Workflow</p>
          </FadeScale>
          <FadeScale delay={600}>
            <GlassCard glow className="p-8 border-ai-blue/20">
               <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ai-blue flex items-center justify-center shadow-[0_0_15px_rgba(79,124,255,0.4)]">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Assistant Core</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-sm leading-relaxed text-zinc-300">
                      J'ai analysé vos documents récents. 2 rapports sont prêts à être exportés.
                    </div>
                  </div>
                  <PrimaryButton 
                    text="Ouvrir l'Assistant" 
                    onClick={() => onNavigate('ASSISTANT')}
                    className="w-full"
                  />
               </div>
            </GlassCard>
          </FadeScale>
          
          <div className="gap-4 flex flex-col">
          {SMART_SUGGESTIONS.slice(0, 2).map((s, i) => (
            <FadeScale key={s.id} delay={700 + (i * 100)}>
              <div className="w-full">
                <GlassCard className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-ai-blue" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{s.title}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1 leading-tight">{s.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </FadeScale>
          ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
