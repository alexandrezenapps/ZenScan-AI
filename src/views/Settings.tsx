/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Cloud, Lock, Cpu, Moon, AppWindow, LogOut, Crown, Zap } from 'lucide-react';
import { AppView } from '../types';

interface SettingsProps {
  onNavigate: (view: AppView) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="pt-24 pb-32 px-6 max-w-lg mx-auto space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">Personalize your experience.</p>
      </header>

      {/* Premium CTA */}
      <section className="relative overflow-hidden glass-card rounded-[32px] p-6 border-ai-blue/30 bg-gradient-to-br from-ai-blue/10 to-transparent ai-glow">
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div className="bg-ai-blue w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <span className="text-[10px] font-bold text-ai-blue-light tracking-[0.2em] uppercase">Free Trial</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">ZenScan Pro</h3>
            <p className="text-sm text-gray-400">Unlock predictive analysis and unlimited cloud storage.</p>
          </div>
          <button className="w-full h-14 bg-ai-blue hover:bg-ai-blue-dark text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95">
            Upgrade Now
            <Zap className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Settings Groups */}
      <div className="space-y-6">
        <SettingsGroup title="Cloud & Sync">
          <SettingsItem icon={Cloud} label="Cloud Backup" badge="Last sync: 2m ago" hasToggle active />
        </SettingsGroup>

        <SettingsGroup title="Security">
          <SettingsItem icon={Lock} label="FaceID & Biometrics" hasToggle />
          <SettingsItem icon={Lock} label="Password Protection" />
        </SettingsGroup>

        <SettingsGroup title="Artificial Intelligence">
          <SettingsItem icon={Cpu} label="Analysis Engine" detail="Neural Core v2.4 (Ultra)" />
          <SettingsItem icon={Zap} label="Real-time Predictions" hasToggle active />
        </SettingsGroup>

        <SettingsGroup title="Appearance">
          <SettingsItem icon={Moon} label="Dark Mode" detail="Always active" />
          <SettingsItem icon={AppWindow} label="App Icon" detail="Premium" />
        </SettingsGroup>
      </div>

      <div className="pt-4 flex flex-col items-center space-y-4">
        <button className="w-full h-14 glass-card rounded-2xl flex items-center justify-center gap-3 text-error border-error/20 hover:bg-error/10 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-bold">Log Out</span>
        </button>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
          ZenScan AI v1.0.0 • Build 8823
        </p>
      </div>
    </motion.div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">{title}</h4>
      <div className="glass-card rounded-[28px] overflow-hidden divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

function SettingsItem({ 
  icon: Icon, 
  label, 
  detail, 
  badge, 
  hasToggle, 
  active 
}: { 
  icon: any; 
  label: string; 
  detail?: string; 
  badge?: string; 
  hasToggle?: boolean; 
  active?: boolean; 
}) {
  return (
    <div className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-ai-blue/10 text-ai-blue' : 'bg-primary-700 text-gray-400'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          {detail && <p className="text-[10px] text-ai-blue-light font-bold uppercase tracking-tighter mt-0.5">{detail}</p>}
          {badge && <p className="text-[10px] text-success font-medium mt-0.5">{badge}</p>}
        </div>
      </div>
      
      {hasToggle ? (
        <div className={`w-11 h-6 rounded-full relative transition-colors ${active ? 'bg-ai-blue' : 'bg-primary-700'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'right-1' : 'left-1'}`} />
        </div>
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-ai-blue transition-colors" />
      )}
    </div>
  );
}

