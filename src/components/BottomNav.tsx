/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, Library, Settings, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { AppView } from '../types';
import { ScanButtonFloating } from './PremiumComponents';

interface BottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onScan?: () => void;
}

export default function BottomNav({ currentView, onNavigate, onScan }: BottomNavProps) {
  const navItemsLeft = [
    { id: 'HOME', icon: Home, label: 'Accueil' },
    { id: 'LIBRARY', icon: Library, label: 'Bibliothèque' },
  ];
  
  const navItemsRight = [
    { id: 'AI', icon: Sparkles, label: 'IA' },
    { id: 'SETTINGS', icon: Settings, label: 'Paramètres' },
  ];

  const handleScanClick = () => {
    if (currentView === 'SCANNER' && onScan) {
      onScan();
    } else {
      onNavigate('SCANNER');
    }
  };

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[500px] h-20 md:h-22 bg-primary-800/60 backdrop-blur-3xl rounded-[32px] flex items-center justify-between px-6 md:px-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 border border-white/10">
      <div className="flex items-center gap-6 md:gap-10">
        {navItemsLeft.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id.toLowerCase()}`}
            onClick={() => onNavigate(item.id as AppView)}
            className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 group relative ${
              currentView === item.id ? 'text-ai-blue' : 'text-text-main/40 hover:text-text-main/70'
            }`}
          >
            <item.icon className={`w-5 h-5 md:w-6 md:h-6 transition-transform ${currentView === item.id ? 'scale-110' : 'group-hover:scale-105'}`} />
            <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${currentView === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {item.label}
            </span>
            {currentView === item.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-ai-blue shadow-[0_0_8px_rgba(79,124,255,0.8)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* FAB SCAN */}
      <div className="relative -top-8 px-2 md:px-4 flex flex-col items-center gap-1.5 group">
        <ScanButtonFloating onClick={handleScanClick} />
        <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] transition-all ${currentView === 'SCANNER' ? 'text-ai-blue opacity-100' : 'text-text-main/40 opacity-0 group-hover:opacity-100'}`}>
          Scanner
        </span>
      </div>

      <div className="flex items-center gap-6 md:gap-10">
        {navItemsRight.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id.toLowerCase()}`}
            onClick={() => onNavigate(item.id as AppView)}
            className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 group relative ${
              currentView === item.id ? 'text-ai-blue' : 'text-text-main/40 hover:text-text-main/70'
            }`}
          >
            <item.icon className={`w-5 h-5 md:w-6 md:h-6 transition-transform ${currentView === item.id ? 'scale-110' : 'group-hover:scale-105'}`} />
            <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${currentView === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {item.label}
            </span>
            {currentView === item.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-ai-blue shadow-[0_0_8px_rgba(79,124,255,0.8)]"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
