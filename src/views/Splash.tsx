/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashProps {
  onFlush: () => void;
}

export default function Splash({ onFlush }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(onFlush, 3500); // Slightly longer for cinematic feel
    return () => clearTimeout(timer);
  }, [onFlush]);

  return (
    <div className="fixed inset-0 z-[100] bg-primary-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1.5 }}
        transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute w-[800px] h-[800px] bg-ai-blue/5 rounded-full blur-[160px]"
      />

      <div className="relative flex flex-col items-center gap-12">
        {/* Logo Container */}
        <div className="relative w-40 h-40">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full rounded-[40px] bg-primary-900 border border-white/10 flex items-center justify-center relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
          >
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <line x1="7" y1="12" x2="17" y2="12" />
            </svg>

            {/* Scan Line Animation */}
            <motion.div 
              initial={{ top: '-10%' }}
              animate={{ top: '110%' }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 right-0 h-1 bg-ai-blue shadow-[0_0_25px_#4F7CFF] z-10"
            />
          </motion.div>
          
          {/* External Glow Pulse */}
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-8 bg-ai-blue/20 rounded-[48px] blur-3xl -z-10"
          />
        </div>

        <div className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-extrabold tracking-tight text-white mb-2"
          >
            ZenScan <span className="text-ai-blue">AI</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mt-2 mb-10"
          >
            Intelligence Documentaire Premium
          </motion.p>
        </div>
      </div>

      {/* Cinematic Reveal Bottom */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-20 flex flex-col items-center gap-6"
      >
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1], 
                opacity: [0.2, 0.8, 0.2],
                backgroundColor: ['#4F7CFF', '#88AAFF', '#4F7CFF']
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="w-1.5 h-1.5 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
