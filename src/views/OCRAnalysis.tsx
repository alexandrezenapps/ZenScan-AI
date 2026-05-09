/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Database, Tag, Lightbulb, ArrowRight, Activity } from 'lucide-react';
import { AppView } from '../types';
import { GlassCard, AIOrb } from '../components/PremiumComponents';

interface OCRAnalysisProps {
  onNavigate: (view: AppView) => void;
  onComplete: () => void;
}

export default function OCRAnalysis({ onNavigate, onComplete }: OCRAnalysisProps) {
  const [progress, setProgress] = useState(0);
  const [discoveredItems, setDiscoveredItems] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 45);

    const timeouts = [
      setTimeout(() => setDiscoveredItems(prev => [...prev, 'type']), 800),
      setTimeout(() => setDiscoveredItems(prev => [...prev, 'amount']), 1600),
      setTimeout(() => setDiscoveredItems(prev => [...prev, 'tax']), 2400),
      setTimeout(() => setDiscoveredItems(prev => [...prev, 'date']), 3200),
    ];

    return () => {
      clearInterval(interval);
      timeouts.forEach(t => clearTimeout(t));
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-10"
    >
      <div className="text-center space-y-3">
        <div className="flex justify-center mb-4">
          <AIOrb size="w-16 h-16" />
        </div>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-ai-blue font-black tracking-[0.3em] text-[10px] uppercase"
        >
          Analyse Syntaxique Pro
        </motion.p>
        <h2 className="text-4xl font-extrabold text-white tracking-tight">Magie de l'IA</h2>
      </div>

      {/* Central Scanner Visual */}
      <div className="relative flex justify-center py-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-72 h-96 bg-primary-900 border border-white/5 rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
        >
          {/* Document Content Mockup with Reveal Effect */}
          <div className="p-8 space-y-6 opacity-30">
            <div className={`h-5 w-3/4 bg-white/40 rounded-lg transition-all duration-700 ${discoveredItems.includes('type') ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-4'}`} />
            <div className="space-y-3">
              <div className="h-2 w-full bg-white/10 rounded-full" />
              <div className={`h-3 w-full bg-white/40 rounded-full transition-all duration-700 delay-100 ${discoveredItems.includes('amount') ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-4'}`} />
              <div className="h-2 w-2/3 bg-white/10 rounded-full" />
            </div>
            <div className="pt-20 space-y-12">
               <div className="flex gap-4">
                  <div className={`h-12 w-12 bg-white/20 rounded-2xl transition-all ${discoveredItems.includes('tax') ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                  <div className="space-y-2 flex-1">
                     <div className="h-3 w-full bg-white/10 rounded-full" />
                     <div className="h-3 w-1/2 bg-white/10 rounded-full" />
                  </div>
               </div>
            </div>
            <div className="absolute bottom-12 left-8 right-8">
               <div className={`h-10 w-1/2 bg-ai-blue/30 rounded-xl transition-all duration-1000 ${discoveredItems.includes('date') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} />
            </div>
          </div>

          {/* Premium Laser Scanner Line */}
          <motion.div
            animate={{ top: ['-5%', '105%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-1 bg-ai-blue shadow-[0_0_40px_#4F7CFF] z-20"
          />
          <motion.div
            animate={{ top: ['-5%', '105%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: 0.1 }}
            className="absolute left-0 right-0 h-8 bg-ai-blue/5 blur-xl z-10"
          />

          {/* Completion State */}
          <AnimatePresence>
            {progress === 100 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-primary-950/80 flex items-center justify-center backdrop-blur-md z-30"
              >
                <motion.div
                  initial={{ scale: 0.5, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="bg-emerald-500/20 p-6 rounded-full border border-emerald-500/50 shadow-[0_0_60px_rgba(16,185,129,0.3)]"
                >
                  <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modern Progress Hub */}
      <div className="space-y-6">
        <div className="flex justify-between items-end px-2">
          <div className="flex items-center gap-3">
             <Activity className="w-4 h-4 text-ai-blue animate-pulse" />
             <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Extraction Neuronale</p>
          </div>
          <span className="text-lg font-black text-white">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-ai-gradient rounded-full shadow-[0_0_20px_#4F7CFF]"
          />
        </div>
      </div>

      {/* Multi-Column Data Insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Données Reconnues</span>
          </div>
          <div className="space-y-4">
             <AnimatePresence>
               {[
                 { id: 'type', label: 'Classification', value: 'Facture' },
                 { id: 'amount', label: 'Montant Total', value: '124,50 €', premium: true },
                 { id: 'date', label: 'Date Document', value: '09 Mai 2026' }
               ].map((item, idx) => (
                 discoveredItems.includes(item.id) && (
                   <motion.div 
                     key={item.id}
                     initial={{ opacity: 0, x: -20 }} 
                     animate={{ opacity: 1, x: 0 }}
                     className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5"
                   >
                     <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                     <span className={`text-sm font-black ${item.premium ? 'text-ai-blue' : 'text-white'}`}>{item.value}</span>
                   </motion.div>
                 )
               ))}
             </AnimatePresence>
          </div>
        </GlassCard>

        <div className="flex flex-col gap-6">
          <GlassCard className="p-8 flex-1">
            <div className="flex items-center gap-3 mb-6">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tags Suggérés</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {discoveredItems.length > 1 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-5 py-2.5 bg-ai-blue/10 border border-ai-blue/20 text-ai-blue text-[10px] font-black uppercase rounded-full">Automobile</motion.span>
                )}
                {discoveredItems.length > 3 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-5 py-2.5 bg-white/5 border border-white/10 text-gray-500 text-[10px] font-black uppercase rounded-full">Mensuel</motion.span>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>

          <button
            onClick={onComplete}
            disabled={progress < 100}
            className={`group relative h-16 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 overflow-hidden shadow-2xl ${
              progress === 100 
              ? 'bg-ai-gradient text-white ai-glow active:scale-95' 
              : 'bg-white/5 text-gray-600 grayscale cursor-not-allowed'
            }`}
          >
            Continuer
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* AI Suggestion Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <GlassCard glow className="bg-ai-blue/[0.03] border-ai-blue/20 p-8">
           <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center shrink-0">
                <Lightbulb className="w-6 h-6 text-ai-blue" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-lg">Insight IA</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  Ce document semble correspondre à votre facture de gaz récurrente. Doubler le tag pour "Comptabilité" ?
                </p>
              </div>
           </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
