/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bolt, Zap, Camera, Image as ImageIcon, RotateCcw, Settings, Layers } from 'lucide-react';
import { AppView, ScanStatus } from '../types';
import { GlassCard } from '../components/PremiumComponents';

interface ScannerProps {
  onNavigate: (view: AppView) => void;
  onScanComplete: () => void;
}

export default function Scanner({ onNavigate, onScanComplete }: ScannerProps) {
  const [status, setStatus] = useState<ScanStatus>(ScanStatus.IDLE);
  const [activeMode, setActiveMode] = useState('DOCUMENT');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  const modes = ['OCR', 'DOCUMENT', 'ID CARD', 'RECEIPT'];

  const startScan = () => {
    setCountdown(null);
    setStatus(ScanStatus.SCANNING);
    
    // Simulate camera capture flash
    setTimeout(() => {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 200);
      onScanComplete();
    }, 1500);
  };

  useEffect(() => {
    if (status === ScanStatus.IDLE) {
      const detectTimer = setTimeout(() => {
        setCountdown(3);
      }, 1500);
      return () => clearTimeout(detectTimer);
    }
  }, [status]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      startScan();
    }
  }, [countdown]);

  const getModeConfig = (mode: string) => {
    switch (mode) {
      case 'ID CARD':
        return { aspect: 'aspect-[1.58/1]', label: 'Aligner la Carte ID', instruction: 'ID Détectée' };
      case 'RECEIPT':
        return { aspect: 'aspect-[1/2.2]', label: 'Aligner le Reçu', instruction: 'Reçu Détecté' };
      case 'OCR':
        return { aspect: 'aspect-[3/4]', label: 'Ne pas bouger', instruction: 'Texte Détecté' };
      default:
        return { aspect: 'aspect-[3/4]', label: 'Aligner le Document', instruction: 'Doc Détecté' };
    }
  };

  const currentConfig = getModeConfig(activeMode);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black overflow-hidden"
    >
      {/* Flash Effect Overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-[100]"
          />
        )}
      </AnimatePresence>

      {/* Top Header: Premium Glassmorphism */}
      <header className="absolute top-0 w-full z-20 flex justify-between items-center px-8 h-24 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={() => onNavigate('HOME')}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-3xl active:scale-90 transition-transform"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-3 h-3 text-ai-blue" />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">{activeMode}</span>
            </div>
            <div className="flex gap-1.5">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1 h-1 rounded-full bg-ai-blue shadow-[0_0_8px_#4F7CFF]" />
              <div className="w-1 h-1 rounded-full bg-white/20" />
            </div>
        </div>

        <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-3xl active:scale-90 transition-transform">
          <Settings className="w-6 h-6 text-white" />
        </button>
      </header>

      {/* Main Viewport */}
      <main className="relative h-screen w-full flex items-center justify-center pt-24 pb-48">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 z-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />

        {/* Framing Overlay */}
        <div className={`relative w-[85%] max-w-sm transition-all duration-700 ease-[0.22,1,0.36,1] ${currentConfig.aspect}`}>
          {/* Advanced Corners */}
          <div className="absolute -top-1 -left-1 w-16 h-16 border-t-[5px] border-l-[5px] border-ai-blue rounded-tl-[40px] ai-glow" />
          <div className="absolute -top-1 -right-1 w-16 h-16 border-t-[5px] border-r-[5px] border-ai-blue rounded-tr-[40px] ai-glow" />
          <div className="absolute -bottom-1 -left-1 w-16 h-16 border-b-[5px] border-l-[5px] border-ai-blue rounded-bl-[40px] ai-glow" />
          <div className="absolute -bottom-1 -right-1 w-16 h-16 border-b-[5px] border-r-[5px] border-ai-blue rounded-br-[40px] ai-glow" />

          {/* Center Guide Label */}
          <div className="absolute -top-28 left-0 right-0 text-center">
            <AnimatePresence mode="wait">
              {countdown !== null && status === ScanStatus.IDLE ? (
                <motion.span
                  key="countdown"
                  initial={{ opacity: 0, scale: 0, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1.5, rotate: 0 }}
                  exit={{ opacity: 0, scale: 3, rotate: 20 }}
                  className="inline-block text-7xl font-black text-white ai-glow"
                >
                  {countdown}
                </motion.span>
              ) : (
                <motion.div
                  key="label"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <p className="text-white font-bold text-lg tracking-tight">{currentConfig.label}</p>
                  <div className="flex items-center justify-center gap-2">
                    <motion.div 
                      animate={{ scaleX: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-0.5 bg-ai-blue/30"
                    />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Stabilisation</span>
                    <motion.div 
                      animate={{ scaleX: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-0.5 bg-ai-blue/30"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic Laser Scan */}
          <AnimatePresence>
            {(status === ScanStatus.SCANNING || status === ScanStatus.PROCESSING) && (
              <motion.div
                initial={{ top: '0%' }}
                animate={{ top: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-1 bg-ai-blue shadow-[0_0_30px_#4F7CFF] z-10"
              />
            )}
          </AnimatePresence>

          {/* AI Tracking Box */}
          {status === ScanStatus.IDLE && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-8 border border-white/5 bg-white/[0.02] backdrop-blur-[2px] rounded-3xl flex items-center justify-center overflow-hidden"
            >
               <motion.div 
                 animate={{ opacity: [0.1, 0.3, 0.1] }}
                 transition={{ duration: 3, repeat: Infinity }}
                 className="absolute inset-0 bg-ai-blue/5"
               />
               <GlassCard className="p-4" hoverScale={false}>
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-ai-blue animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{currentConfig.instruction}</span>
                  </div>
               </GlassCard>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer: Controller & Modes */}
      <footer className="absolute bottom-0 w-full pb-12 pt-20 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
        <div className="max-w-md mx-auto px-8 space-y-12">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between">
            <button className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center group active:scale-90 transition-transform">
               <ImageIcon className="w-6 h-6 text-white group-hover:text-ai-blue transition-colors" />
            </button>

            <div className="relative">
              <motion.div 
                animate={{ scale: status === ScanStatus.SCANNING ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="absolute -inset-6 bg-ai-blue/20 rounded-full blur-3xl" 
              />
              <button 
                onClick={startScan}
                disabled={status !== ScanStatus.IDLE}
                className="relative w-24 h-24 bg-white/5 rounded-full border-[6px] border-white/10 p-1.5 flex items-center justify-center active:scale-95 transition-transform"
              >
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.2)]">
                   <Camera className="w-9 h-9 text-black" />
                </div>
              </button>
            </div>

            <button 
              onClick={() => { setStatus(ScanStatus.IDLE); setCountdown(null); }}
              className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>

          {/* Premium Mode Selector */}
          <div className="flex justify-center gap-8 px-4 overflow-x-auto no-scrollbar">
            {modes.map(mode => (
              <button 
                key={mode}
                onClick={() => setActiveMode(mode)}
                className="relative py-3 flex flex-col items-center group"
              >
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                  activeMode === mode ? 'text-ai-blue' : 'text-white/30 group-hover:text-white/60'
                }`}>
                  {mode}
                </span>
                {activeMode === mode && (
                  <motion.div 
                    layoutId="activeScannerMode"
                    className="absolute bottom-0 w-8 h-1 bg-ai-blue rounded-full shadow-[0_0_10px_#4F7CFF]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
