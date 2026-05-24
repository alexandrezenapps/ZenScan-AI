import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  WifiOff, 
  AlertCircle, 
  CloudOff, 
  Database,
  ArrowUpRight 
} from 'lucide-react';
import { storageService, SyncStatus } from '../services/storageService';

interface CloudSyncIndicatorProps {
  className?: string;
}

export default function CloudSyncIndicator({ className = '' }: CloudSyncIndicatorProps) {
  const [status, setStatus] = useState<SyncStatus>(storageService.getSyncStatus());
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const unsubscribe = storageService.subscribeSyncStatus((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleSyncNow = async () => {
    if (status.state === 'syncing') return;
    try {
      await storageService.sync();
    } catch (e) {
      console.error("Manual sync click error:", e);
    }
  };

  const toggleCloudSync = () => {
    const currentlyEnabled = localStorage.getItem('zenScanCloudSync') !== 'false';
    storageService.setCloudSync(!currentlyEnabled);
  };

  const getStatusConfig = () => {
    switch (status.state) {
      case 'syncing':
        return {
          color: 'text-ai-blue',
          bgColor: 'bg-ai-blue/10 border-ai-blue/20',
          glow: 'shadow-[0_0_15px_rgba(79,124,255,0.2)]',
          icon: <RefreshCw className="w-5 h-5 text-ai-blue animate-spin" />,
          title: 'Synchronisation...',
          desc: status.totalFiles > 0 
            ? `${status.syncedFiles} sur ${status.totalFiles} fichiers`
            : 'Examen des archives...'
        };
      case 'synced':
        return {
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10 border-emerald-500/20',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
          icon: <Cloud className="w-5 h-5 text-emerald-400" />,
          title: 'Sauvegardé',
          desc: 'Toutes les archives sont à jour'
        };
      case 'pending':
        return {
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10 border-amber-500/20',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
          icon: <Database className="w-5 h-5 text-amber-500" />,
          title: 'Modifications locales',
          desc: 'En attente de sauvegarde'
        };
      case 'offline':
        return {
          color: 'text-zinc-500',
          bgColor: 'bg-zinc-500/10 border-white/5',
          glow: 'shadow-none',
          icon: <WifiOff className="w-5 h-5 text-zinc-500" />,
          title: 'Hors ligne',
          desc: 'Sauvegardes en attente de connexion'
        };
      case 'disabled':
        return {
          color: 'text-zinc-600',
          bgColor: 'bg-white/5 border-white/5',
          glow: 'shadow-none',
          icon: <CloudOff className="w-5 h-5 text-zinc-600" />,
          title: 'Sauvegarde inactive',
          desc: 'Stockage local actif uniquement'
        };
      case 'error':
      default:
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/10 border-red-500/20',
          glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
          title: 'Erreur de synchro',
          desc: status.errorMessage || 'Veuillez vérifier vos permissions'
        };
    }
  };

  const config = getStatusConfig();
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (status.progress / 100) * circumference;

  const formatLastSynced = () => {
    if (!status.lastSyncedAt) return 'Jamais';
    try {
      const date = new Date(status.lastSyncedAt);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return 'À l\'instant';
    }
  };

  return (
    <div 
      className={`relative p-5 md:p-6 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl hover:border-white/10 transition-all overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id="cloud-sync-indicator-card"
    >
      {/* Background radial soft light feedback */}
      <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full opacity-5 blur-3xl transition-colors duration-500 ${
        status.state === 'synced' ? 'bg-emerald-500' :
        status.state === 'syncing' ? 'bg-ai-blue' :
        status.state === 'pending' ? 'bg-amber-500' : 'bg-transparent'
      }`} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          {/* Progress Circular SVG */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0" id="sync-circular-frame">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              {/* Background trace circle */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="stroke-white/5 fill-none"
                strokeWidth="3.5"
              />
              {/* Active progress dash circle */}
              <motion.circle
                cx="28"
                cy="28"
                r={radius}
                className={`fill-none transition-all duration-300 ${
                  status.state === 'synced' ? 'stroke-emerald-500' :
                  status.state === 'syncing' ? 'stroke-ai-blue' :
                  status.state === 'pending' ? 'stroke-amber-500' : 'stroke-zinc-800'
                }`}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                strokeLinecap="round"
              />
            </svg>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-zinc-950/80 backdrop-blur-md transition-all ${config.bgColor} ${config.glow}`}>
              {config.icon}
            </div>
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic leading-none">Status Cloud</span>
              {status.state === 'synced' && (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              )}
            </div>
            <h4 className="text-sm font-black tracking-tight text-white leading-tight truncate">
              {config.title}
            </h4>
            <p className="text-[10px] md:text-xs text-zinc-500 font-bold leading-normal truncate">
              {config.desc}
            </p>
          </div>
        </div>

        {/* Dynamic Mini-Bar Chart representing Sync ratio */}
        <div className="space-y-2 mt-1 pt-3 border-t border-white/5" id="sync-ratio-mini-chart">
          <div className="flex justify-between items-center text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">
            <span>Ratio Sauvegarde Cloud</span>
            <span className="text-zinc-400 font-mono font-bold leading-none">
              {(status.localCount ?? 0) > 0 ? Math.round(((status.syncedCount ?? 0) / (status.localCount ?? 0)) * 100) : 100}%
            </span>
          </div>
          
          <div 
            className={`grid grid-cols-2 gap-3 items-end h-16 pt-2 pb-1 bg-white/[0.01] rounded-xl px-4 border transition-all duration-300 ${
              status.state === 'synced' ? 'border-emerald-500/10 bg-emerald-500/[0.02]' :
              status.state === 'pending' ? 'border-amber-500/10 bg-amber-500/[0.02]' :
              status.state === 'syncing' ? 'border-ai-blue/10 bg-ai-blue/[0.02]' :
              'border-white/[0.02]'
            }`}
          >
            {/* Synced Bar */}
            <div className="flex flex-col items-center justify-end h-full gap-1.5 min-w-0 relative">
              <div className="w-full bg-white/[0.02] rounded-md h-[40px] flex items-end overflow-hidden relative">
                <AnimatePresence>
                  {status.state === 'synced' && (
                    <motion.div 
                      key="synced-pulse"
                      className="absolute inset-0 bg-emerald-400/10 blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.1, 0.3, 0.1] }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </AnimatePresence>
                <motion.div 
                  className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm relative z-10"
                  style={{ 
                    height: (status.localCount ?? 0) > 0 
                      ? `${Math.max(4, Math.round(((status.syncedCount ?? 0) / (status.localCount ?? 0)) * 40))}px` 
                      : '0px'
                  }}
                  initial={{ height: 0 }}
                  animate={{ 
                    height: (status.localCount ?? 0) > 0 
                      ? `${Math.max(4, Math.round(((status.syncedCount ?? 0) / (status.localCount ?? 0)) * 40))}px` 
                      : '0px'
                  }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                />
              </div>
              <div className="flex justify-between w-full text-[8px] font-black leading-none uppercase text-zinc-500">
                <span className="truncate pr-1">Cloud</span>
                <span className="font-mono text-emerald-400 font-black shrink-0">{status.syncedCount ?? 0}</span>
              </div>
            </div>

            {/* Local Bar */}
            <div className="flex flex-col items-center justify-end h-full gap-1.5 min-w-0 relative">
              <div className="w-full bg-white/[0.02] rounded-md h-[40px] flex items-end overflow-hidden relative">
                <AnimatePresence>
                  {status.state === 'pending' && (
                    <motion.div 
                      key="pending-pulse"
                      className="absolute inset-0 bg-amber-500/10 blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.1, 0.3, 0.1] }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </AnimatePresence>
                <motion.div 
                  className={`w-full bg-gradient-to-t ${
                    (status.localCount ?? 0) - (status.syncedCount ?? 0) > 0 
                      ? 'from-amber-600 to-amber-500' 
                      : 'from-zinc-800 to-zinc-700'
                  } rounded-t-sm relative z-10`}
                  style={{ 
                    height: (status.localCount ?? 0) > 0 
                      ? `${Math.max(4, Math.round((((status.localCount ?? 0) - (status.syncedCount ?? 0)) / (status.localCount ?? 0)) * 40))}px` 
                      : '0px'
                  }}
                  initial={{ height: 0 }}
                  animate={{ 
                    height: (status.localCount ?? 0) > 0 
                      ? `${Math.max(4, Math.round((((status.localCount ?? 0) - (status.syncedCount ?? 0)) / (status.localCount ?? 0)) * 40))}px` 
                      : '0px'
                  }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                />
              </div>
              <div className="flex justify-between w-full text-[8px] font-black leading-none uppercase text-zinc-500">
                <span className="truncate pr-1">Local</span>
                <span className={`font-mono font-black shrink-0 ${(status.localCount ?? 0) - (status.syncedCount ?? 0) > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {Math.max(0, (status.localCount ?? 0) - (status.syncedCount ?? 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Controls Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
          <div className="flex flex-col gap-0.5" id="sync-history-stamp">
            <span className="text-[8px] text-zinc-600 font-bold">Dernier passage</span>
            <span className="text-zinc-400 text-[10px] font-black">{formatLastSynced()}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Interactive Settings Privacy Control Toggle */}
            <button
              onClick={toggleCloudSync}
              className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black transition-all ${
                localStorage.getItem('zenScanCloudSync') !== 'false'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10 hover:text-white'
              }`}
              title={localStorage.getItem('zenScanCloudSync') !== 'false' ? "Désactiver la sauvegarde cloud" : "Activer la sauvegarde cloud"}
            >
              {localStorage.getItem('zenScanCloudSync') !== 'false' ? 'ACTIF' : 'INACTIF'}
            </button>

            {/* Manual Sync Now Actions Action */}
            <button
              onClick={handleSyncNow}
              disabled={status.state === 'syncing' || status.state === 'disabled' || status.state === 'offline'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                status.state === 'syncing'
                  ? 'bg-ai-blue/10 border border-ai-blue/20 text-ai-blue cursor-not-allowed'
                  : status.state === 'disabled' || status.state === 'offline'
                  ? 'bg-white/5 border border-white/5 text-zinc-700 cursor-not-allowed'
                  : 'bg-ai-blue text-accent-text hover:scale-105 active:scale-95 shadow-md flex-row-reverse'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${status.state === 'syncing' ? 'animate-spin' : ''}`} />
              <span>S'inc</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
