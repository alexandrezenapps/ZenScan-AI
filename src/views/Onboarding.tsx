/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const { signInWithGoogle, user } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slides = [
    {
      title: "Scannez le futur.",
      description: "Capture ultra-rapide avec cadrage intelligent assisté par IA.",
      icon: Sparkles,
      color: "text-ai-blue",
      bg: "bg-ai-blue/10"
    },
    {
      title: "OCR de pointe.",
      description: "Extraction de données avec une précision mathématique inégalée.",
      icon: Bot,
      color: "text-ai-blue-light",
      bg: "bg-ai-blue-light/10"
    },
    {
      title: "Espace sécurisé.",
      description: "Chiffrement AES-256 et synchronisation temps réel sur tous vos appareils.",
      icon: ShieldCheck,
      color: "text-success",
      bg: "bg-success/10"
    }
  ];

  const handleNext = async () => {
    setError(null);
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      if (!user) {
        try {
          setIsLoggingIn(true);
          await signInWithGoogle();
        } catch (err: any) {
          console.error("Login failed", err);
          let message = "La connexion a échoué. ";
          if (err.message?.includes('popup-closed-by-user')) {
            message += "La fenêtre de connexion a été fermée.";
          } else if (err.message?.includes('popup-blocked')) {
            message += "Le bloqueur de fenêtres surgissantes empêche la connexion.";
          } else {
            message += "Veuillez réessayer ou vérifier vos paramètres.";
          }
          setError(message);
        } finally {
          setIsLoggingIn(false);
        }
      } else {
        onComplete();
      }
    }
  };

  const Icon = slides[step].icon;

  return (
    <div className="fixed inset-0 z-[90] bg-primary-950 flex flex-col items-center justify-between px-8 py-20 overflow-hidden">
      {/* Decorative Background */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.1, 0.05],
          backgroundColor: step === 0 ? '#4F7CFF' : step === 1 ? '#88AAFF' : '#10B981'
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[160px] pointer-events-none" 
      />

      <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.1, x: -100 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8 md:space-y-12"
          >
            <div className="w-32 h-32 md:w-48 md:h-48 mx-auto rounded-[32px] md:rounded-[48px] bg-primary-900 border border-white/5 flex items-center justify-center ai-glow relative overflow-hidden shadow-2xl">
              <motion.div 
                initial={{ rotate: -10, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className={`absolute inset-4 md:inset-6 rounded-[24px] md:rounded-[32px] ${slides[step].bg} blur-2xl`} 
              />
              <Icon className={`w-14 h-14 md:w-20 md:h-20 ${slides[step].color} relative z-10`} />
            </div>

            <div className="space-y-3 md:space-y-5">
              <h2 className="text-4xl md:text-[44px] font-extrabold text-white tracking-tighter leading-none">
                {slides[step].title}
              </h2>
              <p className="text-zinc-500 text-base md:text-xl font-medium leading-relaxed px-4">
                {slides[step].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-sm space-y-8 md:space-y-12">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center"
          >
            {error}
          </motion.div>
        )}
        {/* Indicators */}
        <div className="flex justify-center gap-3">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                width: step === i ? 32 : 8,
                backgroundColor: step === i ? '#4F7CFF' : 'rgba(255,255,255,0.05)'
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-1.5 md:h-2 rounded-full cursor-pointer hover:bg-white/20 transition-colors"
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          disabled={isLoggingIn}
          className="group relative w-full h-16 md:h-18 bg-ai-gradient rounded-2xl md:rounded-3xl text-white font-black text-lg md:text-xl ai-glow flex items-center justify-center gap-4 active:scale-[0.96] transition-all shadow-xl disabled:opacity-50"
        >
          {isLoggingIn ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <>
              <span className="relative z-10">
                {step === slides.length - 1 ? (user ? 'Accéder' : 'S\'authentifier avec Google') : 'Suivant'}
              </span>
              <motion.div 
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative z-10"
              >
                <ArrowRight className="w-6 h-6 md:w-7 md:h-7" />
              </motion.div>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
