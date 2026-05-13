/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Cloud, Lock, Cpu, Moon, AppWindow, LogOut, Crown, Zap, Sparkles, Loader2 } from 'lucide-react';
import { AppView } from '../types';
import { ICON_COLORS, updateAppMeta, SHAPES_LIST } from '../lib/icons';
import { useAuth } from '../context/AuthContext';

interface SettingsProps {
  onNavigate: (view: AppView) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const [selectedColor, setSelectedColor] = useState(localStorage.getItem('zenScanIconColor') || 'blue');
  const [selectedShape, setSelectedShape] = useState(localStorage.getItem('zenScanIconShape') || 'circle');
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleIconChange = (color: string, shape: string) => {
    setSelectedColor(color);
    setSelectedShape(shape);
    updateAppMeta(color, shape);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      onNavigate('ONBOARDING');
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="pt-24 pb-10 px-5 md:px-8 max-w-6xl mx-auto space-y-8"
    >
      <header className="space-y-1">
        <p className="text-[10px] font-black text-ai-blue uppercase tracking-[0.4em] leading-none">Configuration</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Paramètres Système</h2>
      </header>

      {/* User Info Section */}
      <section className="glass-card rounded-[28px] md:rounded-[32px] p-6 border border-white/5 flex items-center gap-6 bg-primary-800/20">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center shrink-0">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-ai-blue">{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</span>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-xl font-bold text-white">{user?.displayName || 'Utilisateur Zen'}</h3>
          <p className="text-sm text-zinc-500 font-medium">{user?.email}</p>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-2 py-0.5 rounded-full bg-ai-blue/10 border border-ai-blue/20 text-[9px] font-black text-ai-blue uppercase tracking-widest">
              ID Compte: {user?.uid.slice(0, 8)}...
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
              Vérifié
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left Column: Premium & Main Settings */}
        <div className="lg:col-span-7 space-y-6 md:space-y-8">
          {/* Premium CTA */}
          <section className="relative overflow-hidden glass-card rounded-[28px] md:rounded-[32px] p-6 md:p-8 border-ai-blue/30 bg-gradient-to-br from-ai-blue/15 via-ai-blue/5 to-transparent ai-glow group">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-ai-blue/20 blur-[100px] pointer-events-none group-hover:bg-ai-blue/30 transition-colors" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="bg-ai-blue w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,124,255,0.4)]">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                  <span className="text-[10px] font-black text-ai-blue-light tracking-[0.2em] uppercase">Offre Limitée</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">ZenScan Pro <span className="text-ai-blue">Enterprise</span></h3>
                <p className="text-base text-zinc-400 font-medium leading-relaxed max-w-md">
                  Libérez la pleine puissance de l'IA neuronale avec l'analyse prédictive et un stockage cloud illimité.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                   { icon: Zap, label: 'OCR Ultra' },
                   { icon: Cloud, label: 'Sync Auto' },
                   { icon: Lock, label: 'Audit Sec.' }
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                    <feature.icon className="w-3.5 h-3.5 text-ai-blue" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight">{feature.label}</span>
                  </div>
                ))}
              </div>

              <button className="w-full h-16 bg-ai-gradient text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 ai-glow">
                Passer au Premium
                <Zap className="w-5 h-5" />
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingsGroup title="Cloud & Synchronisation">
              <SettingsItem icon={Cloud} label="Sauvegarde Cloud" badge="Sync: OK" hasToggle active />
              <SettingsItem icon={Cloud} label="Historique de version" detail="30 jours" />
            </SettingsGroup>

            <SettingsGroup title="Sécurité & Accès">
              <SettingsItem icon={Lock} label="Biométrie (FaceID)" hasToggle />
              <SettingsItem icon={Lock} label="Double Facteur" detail="Activé" />
            </SettingsGroup>
          </div>
        </div>

        {/* Right Column: AI & Appearance */}
        <div className="lg:col-span-5 space-y-8">
          <SettingsGroup title="Intelligence Artificielle">
            <SettingsItem icon={Cpu} label="Moteur d'Analyse" detail="Neural Core v2.4 (Ultra)" />
            <SettingsItem icon={Zap} label="Prédictions Temps-réel" hasToggle active />
            <SettingsItem icon={Sparkles} label="Optimisation OCR" detail="Mode Précision" hasToggle active />
          </SettingsGroup>

          <SettingsGroup title="Apparence & Personnalisation">
            <SettingsItem icon={Moon} label="Mode Sombre" detail="Toujours activé" />
            <div className="p-6 space-y-6 bg-white/[0.02] border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ai-blue/10 flex items-center justify-center text-ai-blue shrink-0">
                  <AppWindow className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-tight">Icône d'Application</p>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-none mt-1">Personnalisation Native</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Nuances Chromatiques</p>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
                     {Object.keys(ICON_COLORS).map(c => (
                       <button 
                         key={c}
                         onClick={() => handleIconChange(c, selectedShape)}
                         className={`w-9 h-9 rounded-full shrink-0 border-2 transition-all hover:scale-110 ${selectedColor === c ? 'border-ai-blue shadow-[0_0_15px_rgba(79,124,255,0.4)] scale-110' : 'border-transparent shadow-xl'}`}
                         style={{ backgroundColor: ICON_COLORS[c] }}
                       />
                     ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Géométrie de l'icône</p>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                     {SHAPES_LIST.map(s => (
                       <button 
                         key={s}
                         onClick={() => handleIconChange(selectedColor, s)}
                         className={`w-12 h-12 rounded-xl shrink-0 border transition-all flex items-center justify-center bg-white/5 hover:bg-white/10 ${selectedShape === s ? 'border-ai-blue bg-ai-blue/20' : 'border-white/5 shadow-xl'}`}
                       >
                         <img 
                           src={`/api/icon?color=${selectedColor}&shape=${s}&size=64`} 
                           className="w-8 h-8"
                           alt={s}
                         />
                       </button>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </SettingsGroup>

          <div className="pt-4 flex flex-col items-center space-y-6">
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full h-14 bg-white/[0.03] border border-red-500/10 rounded-2xl flex items-center justify-center gap-3 text-red-500 hover:bg-red-500/10 transition-colors group disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span className="font-bold text-sm uppercase tracking-widest">Se déconnecter</span>
                </>
              )}
            </button>
            <div className="text-center space-y-1">
              <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">
                ZenScan AI Premium v1.2.0
              </p>
              <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">
                Infrastructure Neuronale : Active • Build 9942
              </p>
            </div>
          </div>
        </div>
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

