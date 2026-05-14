import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon, Scan, FileText } from 'lucide-react';
import { DURATIONS, EASINGS } from '../lib/animations';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hoverScale?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', glow = false, hoverScale = true, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverScale && onClick ? { y: -4, scale: 1.01 } : hoverScale ? { y: -2, scale: 1.005 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className={`relative overflow-hidden glass-card rounded-[24px] border border-white/5 bg-white/[0.03] backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] ${className}`}
    >
      {glow && (
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.1, 1] 
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -right-20 -top-20 w-48 h-48 bg-ai-blue/20 blur-[80px] rounded-full pointer-events-none"
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export const PrimaryButton: React.FC<{ text: string; onClick: () => void; className?: string; icon?: LucideIcon }> = ({ text, onClick, className = '', icon: Icon }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`relative h-14 px-8 bg-ai-gradient rounded-[18px] text-accent-text font-bold ai-glow-blue flex items-center justify-center gap-3 overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      {Icon && <Icon className="w-5 h-5" />}
      <span className="tracking-tight">{text}</span>
      <div className="absolute inset-0 shadow-[0_0_20px_rgba(79,124,255,0.4)] blur-lg rounded-[18px] -z-10" />
    </motion.button>
  );
};

export const ScanButtonFloating: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <div className="relative">
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -inset-4 bg-ai-blue/30 rounded-full blur-2xl"
      />
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        className="relative w-18 h-18 rounded-full bg-ai-gradient shadow-[0_15px_30px_rgba(79,124,255,0.5)] flex items-center justify-center text-accent-text"
      >
        <Scan className="w-8 h-8" />
        <div className="absolute inset-0 rounded-full border-2 border-white/20" />
      </motion.button>
    </div>
  );
};

export const AIChip: React.FC<{ label: string; className?: string }> = ({ label, className = '' }) => {
  return (
    <div className={`px-3 py-1.5 bg-ai-blue/15 border border-ai-blue/30 rounded-full text-ai-blue text-[10px] font-black uppercase tracking-widest ${className}`}>
      {label}
    </div>
  );
};

export const DocumentCardPremium: React.FC<{ title: string; subtitle: string; icon?: LucideIcon; className?: string }> = ({ title, subtitle, icon: Icon = FileText, className = '' }) => {
  return (
    <GlassCard className={`h-40 p-4 flex flex-col justify-between ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h4 className="text-white font-bold tracking-tight">{title}</h4>
        <p className="text-white/60 text-xs mt-1">{subtitle}</p>
      </div>
    </GlassCard>
  );
};

export const AIOrb: React.FC<{ size?: string }> = ({ size = 'w-12 h-12' }) => {
  return (
    <div className={`relative ${size}`}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 bg-ai-blue/40 rounded-full blur-xl"
      />
      <motion.div
        animate={{
          rotate: 360
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border-2 border-dashed border-ai-blue/30"
      />
      <div className="absolute inset-2 bg-ai-gradient rounded-full shadow-[0_0_20px_rgba(79,124,255,0.6)] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-1/2 h-1/2 bg-white/20 rounded-full blur-sm"
        />
      </div>
    </div>
  );
};

export const ActionChip: React.FC<{ icon: LucideIcon; label: string; active?: boolean; onClick?: () => void }> = ({ icon: Icon, label, active, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`px-4 py-2 rounded-full flex items-center gap-2 border transition-all ${
        active 
        ? 'bg-ai-blue/10 border-ai-blue/40 text-ai-blue shadow-[0_0_15px_rgba(79,124,255,0.2)]' 
        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-black uppercase tracking-[0.1em]">{label}</span>
    </motion.button>
  );
};
