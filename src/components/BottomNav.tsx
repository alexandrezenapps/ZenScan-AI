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
    { id: AppView.HOME, icon: Home, label: 'Accueil' },
    { id: AppView.LIBRARY, icon: Library, label: 'Bibliothèque' },
  ];
  
  const navItemsRight = [
    { id: AppView.AI, icon: Sparkles, label: 'IA' },
    { id: AppView.SETTINGS, icon: Settings, label: 'Paramètres' },
  ];

  const handleScanClick = () => {
    if (currentView === AppView.SCANNER && onScan) {
      onScan();
    } else {
      onNavigate(AppView.SCANNER);
    }
  };

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-[420px] h-14 md:h-15 bg-primary-800/80 backdrop-blur-2xl rounded-full flex items-center justify-between px-5 md:px-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-50 border border-white/10">
      <div className="flex items-center gap-5 md:gap-8">
        {navItemsLeft.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id.toLowerCase()}`}
            onClick={() => onNavigate(item.id as AppView)}
            className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 group relative ${
              currentView === item.id ? 'text-ai-blue' : 'text-text-main/40 hover:text-text-main/70'
            }`}
          >
            <item.icon className={`w-4 h-4 md:w-5 h-5 transition-transform ${currentView === item.id ? 'scale-110' : 'group-hover:scale-105'}`} />
            <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.12em] transition-opacity leading-none ${currentView === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
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

      {/* FAB SCAN Centered Inline */}
      <div className="flex flex-col items-center justify-center gap-0.5 group shrink-0 relative top-0.5">
        <ScanButtonFloating onClick={handleScanClick} />
        <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.12em] transition-all leading-none ${currentView === AppView.SCANNER ? 'text-ai-blue opacity-100' : 'text-text-main/40 opacity-0 group-hover:opacity-100'}`}>
          Scanner
        </span>
      </div>

      <div className="flex items-center gap-5 md:gap-8">
        {navItemsRight.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id.toLowerCase()}`}
            onClick={() => onNavigate(item.id as AppView)}
            className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 group relative ${
              currentView === item.id ? 'text-ai-blue' : 'text-text-main/40 hover:text-text-main/70'
            }`}
          >
            <item.icon className={`w-4 h-4 md:w-5 h-5 transition-transform ${currentView === item.id ? 'scale-110' : 'group-hover:scale-105'}`} />
            <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.12em] transition-opacity leading-none ${currentView === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
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
