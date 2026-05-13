/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppView } from './types';
import { updateAppMeta } from './lib/icons';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Splash from './views/Splash';
import Onboarding from './views/Onboarding';
import Home from './views/Home';
import Library from './views/Library';
import Scanner from './views/Scanner';
import OCRAnalysis from './views/OCRAnalysis';
import Editor from './views/Editor';
import Assistant from './views/Assistant';
import Settings from './views/Settings';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView | 'SPLASH' | 'ONBOARDING'>('SPLASH');

  useEffect(() => {
    const color = localStorage.getItem('zenScanIconColor') || 'blue';
    const shape = localStorage.getItem('zenScanIconShape') || 'circle';
    updateAppMeta(color, shape);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'SPLASH':
        return <Splash onFlush={() => setCurrentView('ONBOARDING')} />;
      case 'ONBOARDING':
        return <Onboarding onComplete={() => setCurrentView('HOME')} />;
      case 'HOME':
        return <Home onNavigate={setCurrentView} />;
      case 'LIBRARY':
        return <Library onNavigate={setCurrentView} />;
      case 'SCANNER':
        return <Scanner onNavigate={setCurrentView} onScanComplete={() => setCurrentView('OCR')} />;
      case 'OCR':
        return <OCRAnalysis onNavigate={setCurrentView} onComplete={() => setCurrentView('EDITOR')} />;
      case 'EDITOR':
        return <Editor onNavigate={setCurrentView} />;
      case 'AI':
        return <Assistant onNavigate={setCurrentView} />;
      case 'SETTINGS':
        return <Settings onNavigate={setCurrentView} />;
      default:
        return <Home onNavigate={setCurrentView} />;
    }
  };

  const showNav = currentView !== 'SPLASH' && currentView !== 'ONBOARDING' && currentView !== 'SCANNER';

  return (
    <div className="min-h-screen bg-primary-900 overflow-x-hidden">
      {showNav && <Navbar />}

      <main className={showNav ? "pb-32" : ""}>
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </main>

      {showNav && <BottomNav currentView={currentView as AppView} onNavigate={setCurrentView} />}
    </div>
  );
}
