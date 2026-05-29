/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Cloud, Lock, Cpu, Moon, Sun, AppWindow, LogOut, Crown, Zap, Sparkles, Loader2, Palette, LayoutGrid, List } from 'lucide-react';
import { AppView } from '../types';
import { ICON_COLORS, updateAppMeta, SHAPES_LIST } from '../lib/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEME_COLORS, ThemeColor } from '../context/ThemeContext';
import OfflineStorageSpace from '../components/OfflineStorageSpace';
import ZenScanAutomations from '../components/ZenScanAutomations';

interface SettingsProps {
  onNavigate: (view: AppView) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const [selectedColor, setSelectedColor] = useState(localStorage.getItem('zenScanIconColor') || 'blue');
  const [selectedShape, setSelectedShape] = useState(localStorage.getItem('zenScanIconShape') || 'circle');
  const [cloudSync, setCloudSync] = useState(localStorage.getItem('zenScanCloudSync') !== 'false');
  const [faceId, setFaceId] = useState(localStorage.getItem('zenScanFaceId') === 'true');
  const [realtimePred, setRealtimePred] = useState(localStorage.getItem('zenScanRealtimePred') !== 'false');
  const [ocrOptim, setOcrOptim] = useState(localStorage.getItem('zenScanOcrOptim') !== 'false');
  const [displayMode, setDisplayMode] = useState(localStorage.getItem('zenScanLibraryDisplay') || 'grid');
  const [autoAssignFolder, setAutoAssignFolder] = useState(localStorage.getItem('zenScanAutoAssignFolder') !== 'false');
  const { mode, accentColor, toggleMode, setAccentColor } = useTheme();
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleIconChange = (color: string, shape: string) => {
    setSelectedColor(color);
    setSelectedShape(shape);
    updateAppMeta(color, shape);
  };

  const toggleCloudSync = () => {
    const newState = !cloudSync;
    setCloudSync(newState);
    localStorage.setItem('zenScanCloudSync', String(newState));
  };

  const toggleFaceId = () => {
    const newState = !faceId;
    setFaceId(newState);
    localStorage.setItem('zenScanFaceId', String(newState));
  };

  const toggleRealtimePred = () => {
    const newState = !realtimePred;
    setRealtimePred(newState);
    localStorage.setItem('zenScanRealtimePred', String(newState));
  };

  const toggleOcrOptim = () => {
    const newState = !ocrOptim;
    setOcrOptim(newState);
    localStorage.setItem('zenScanOcrOptim', String(newState));
  };

  const toggleAutoAssignFolder = () => {
    const newState = !autoAssignFolder;
    setAutoAssignFolder(newState);
    localStorage.setItem('zenScanAutoAssignFolder', String(newState));
  };

  const toggleDisplayMode = () => {
    const newMode = displayMode === 'grid' ? 'list' : 'grid';
    setDisplayMode(newMode);
    localStorage.setItem('zenScanLibraryDisplay', newMode);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      onNavigate(AppView.ONBOARDING);
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
        <h2 className="text-3xl md:text-4xl font-bold text-text-main tracking-tight">Paramètres Système</h2>
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
          <h3 className="text-xl font-bold text-text-main">{useTheme().mode === 'dark' ? user?.displayName || 'Utilisateur Zen' : user?.displayName || 'Utilisateur Zen'}</h3>
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
          {/* Premium CTA - Redesigned for Maximum Impact */}
          <section className="relative overflow-hidden glass-card rounded-[32px] md:rounded-[48px] p-8 md:p-12 border border-white/10 bg-[#0A0A0B] shadow-[0_0_80px_rgba(79,124,255,0.1)] group">
            {/* Sophisticated Background Effects */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(79,124,255,0.12),transparent_60%)] pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-ai-blue/10 blur-[130px] rounded-full pointer-events-none group-hover:bg-ai-blue/15 transition-all duration-700" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
            
            <div className="relative z-10 flex flex-col xl:flex-row gap-12 items-center xl:items-start text-center xl:text-left">
              <div className="flex-1 space-y-10 w-full">
                <div className="flex flex-col xl:flex-row items-center xl:items-start gap-4 xl:gap-6">
                  <div className="bg-ai-gradient w-20 h-20 rounded-[28px] flex items-center justify-center shadow-[0_0_40px_rgba(79,124,255,0.5)] rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <Crown className="w-10 h-10 text-accent-text" />
                  </div>
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-ai-blue/10 border border-ai-blue/20 rounded-full mb-1">
                      <Sparkles className="w-3 h-3 text-ai-blue" />
                      <span className="text-[10px] font-black text-ai-blue uppercase tracking-[0.3em]">Neural Core v4.0</span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] flex flex-wrap justify-center xl:justify-start gap-x-4">
                      ZenScan Pro <span className="bg-ai-gradient bg-clip-text text-transparent">Enterprise</span>
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xl md:text-2xl text-white font-medium tracking-tight leading-snug">
                    Unleash the full power of neural AI with predictive analysis and unlimited cloud storage.
                  </p>
                  <div className="h-0.5 w-24 bg-ai-gradient rounded-full mx-auto xl:mx-0 mt-4 opacity-30" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  {[
                    { icon: Zap, label: 'OCR Neural', sub: '99.9% Accuracy' },
                    { icon: Cloud, label: 'Sync Elite', sub: 'Unlimited' },
                    { icon: Cpu, label: 'Predictive', sub: 'Smart Flow' },
                    { icon: Lock, label: 'Encryption', sub: 'Military Grade' }
                  ].map((f, i) => (
                    <div key={i} className="flex flex-col gap-2 p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-colors group/feat">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/feat:bg-ai-blue/10 transition-colors">
                        <f.icon className="w-5 h-5 text-ai-blue" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-[10px] font-black text-white uppercase tracking-tight">{f.label}</span>
                        <span className="block text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{f.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full xl:w-80 space-y-4">
                <button 
                  onClick={() => alert('Félicitations ! Vous avez activé l\'offre ZenScan Pro Enterprise.')}
                  className="w-full group/btn relative overflow-hidden p-[2px] rounded-3xl transition-all hover:scale-[1.02] shadow-[0_20px_50px_rgba(79,124,255,0.3)] active:scale-95"
                >
                  <div className="absolute inset-0 bg-ai-gradient animate-pulse" />
                  <div className="relative bg-[#0A0A0B] rounded-3xl p-6 md:p-8 flex flex-col items-center gap-3 group-hover/btn:bg-transparent transition-colors duration-500">
                    <span className="text-white font-black uppercase tracking-[0.4em] text-sm">UPGRADE NOW</span>
                    <div className="flex items-center gap-2 text-[10px] text-ai-blue font-bold tracking-widest group-hover/btn:text-white transition-colors uppercase">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Start Free Trial</span>
                    </div>
                  </div>
                </button>
                
                <p className="text-[9px] text-center text-zinc-600 font-bold uppercase tracking-widest leading-loose px-4">
                  Trusted by 50,000+ professionals worldwide. <br/>
                  <span className="text-ai-blue">No credit card required for 14 days.</span>
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingsGroup title="Cloud & Synchronisation">
              <SettingsItem 
                icon={Cloud} 
                label="Sauvegarde Cloud" 
                badge={cloudSync ? "Sync: ACTIVE" : "Sync: PAUSE"} 
                hasToggle 
                active={cloudSync}
                onClick={toggleCloudSync}
              />
              <SettingsItem icon={Cloud} label="Historique de version" detail="30 jours" />
            </SettingsGroup>

            <SettingsGroup title="Sécurité & Accès">
              <SettingsItem 
                icon={Lock} 
                label="Biométrie (FaceID)" 
                hasToggle 
                active={faceId}
                onClick={toggleFaceId}
              />
              <SettingsItem 
                icon={Lock} 
                label="Double Facteur" 
                detail="Activé" 
                onClick={() => alert('Paramètres de sécurité approfondis...')}
              />
            </SettingsGroup>
          </div>

          <OfflineStorageSpace />
          <ZenScanAutomations />
        </div>

        {/* Right Column: AI & Appearance */}
        <div className="lg:col-span-5 space-y-8">
          <SettingsGroup title="Intelligence Artificielle">
            <SettingsItem 
              icon={Cpu} 
              label="Moteur d'Analyse" 
              detail="Neural Core v2.4 (Ultra)" 
              onClick={() => alert('Mise à jour du moteur neuronal effectuée')}
            />
            <SettingsItem 
              icon={Zap} 
              label="Prédictions Temps-réel" 
              hasToggle 
              active={realtimePred} 
              onClick={toggleRealtimePred}
            />
            <SettingsItem 
              icon={Sparkles} 
              label="Optimisation OCR" 
              detail="Mode Précision" 
              hasToggle 
              active={ocrOptim} 
              onClick={toggleOcrOptim}
            />
            <SettingsItem 
              icon={Sparkles} 
              label="Classement Dossier IA" 
              detail="Classement intelligent automatique" 
              hasToggle 
              active={autoAssignFolder} 
              onClick={toggleAutoAssignFolder}
            />
          </SettingsGroup>

          <SettingsGroup title="Apparence & Personnalisation">
            <SettingsItem 
              icon={displayMode === 'grid' ? LayoutGrid : List} 
              label="Affichage par défaut" 
              detail={displayMode === 'grid' ? "Mode Grille" : "Mode Liste"} 
              onClick={toggleDisplayMode}
            />
            <SettingsItem 
              icon={mode === 'dark' ? Moon : Sun} 
              label="Mode d'Apparence" 
              detail={mode === 'dark' ? "Mode Sombre Activé" : "Mode Clair Activé"} 
              hasToggle
              active={mode === 'dark'}
              onClick={toggleMode}
            />
            
            <div className="p-6 space-y-6 bg-white/[0.02] border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ai-blue/10 flex items-center justify-center text-ai-blue shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-main tracking-tight">Thème de Couleur</p>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-none mt-1">32 Nuances Neurales</p>
                </div>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 max-h-48 overflow-y-auto no-scrollbar pr-1">
                {THEME_COLORS.map((tc) => (
                  <button
                    key={tc.id}
                    onClick={() => setAccentColor(tc)}
                    title={tc.name}
                    className={`aspect-square rounded-xl border-2 transition-all hover:scale-110 flex items-center justify-center ${accentColor.id === tc.id ? 'border-ai-blue ai-glow scale-110 z-10' : 'border-transparent'}`}
                    style={{ backgroundColor: tc.hex }}
                  >
                    {accentColor.id === tc.id && <Zap className="w-3 h-3" style={{ color: 'var(--accent-contrast)' }} />}
                  </button>
                ))}
              </div>

              <div className="pt-4 space-y-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ai-blue/10 flex items-center justify-center text-ai-blue shrink-0">
                    <AppWindow className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main tracking-tight">Icône d'Application</p>
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-none mt-1">Personnalisation Native</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Couleurs d'Icône</p>
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
  active,
  onClick
}: { 
  icon: any; 
  label: string; 
  detail?: string; 
  badge?: string; 
  hasToggle?: boolean; 
  active?: boolean; 
  onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-ai-blue/10 text-ai-blue' : 'bg-primary-700 text-gray-400'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-main">{label}</p>
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

