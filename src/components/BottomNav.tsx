/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, Library, Settings, Sparkles } from 'lucide-react';
import { AppView } from '../types';
import { ScanButtonFloating } from './PremiumComponents';

interface BottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export default function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  const navItemsLeft = [
    { id: 'HOME', icon: Home, label: 'Home' },
    { id: 'LIBRARY', icon: Library, label: 'Library' },
  ];
  
  const navItemsRight = [
    { id: 'AI', icon: Sparkles, label: 'AI' },
    { id: 'SETTINGS', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[500px] h-20 bg-primary-800/80 backdrop-blur-3xl rounded-full flex items-center justify-between px-10 shadow-2xl z-50 border border-white/10">
      <div className="flex items-center gap-12">
        {navItemsLeft.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id.toLowerCase()}`}
            onClick={() => onNavigate(item.id as AppView)}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${
              currentView === item.id ? 'opacity-100 text-ai-blue' : 'opacity-40 text-text-main'
            }`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </div>

      {/* FAB SCAN */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2">
        <ScanButtonFloating onClick={() => onNavigate('SCANNER')} />
      </div>

      <div className="flex items-center gap-12">
        {navItemsRight.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id.toLowerCase()}`}
            onClick={() => onNavigate(item.id as AppView)}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${
              currentView === item.id ? 'opacity-100 text-ai-blue' : 'opacity-40 text-text-main'
            }`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </div>
    </nav>
  );
}
