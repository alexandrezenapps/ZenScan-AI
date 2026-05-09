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

  const renderView = () => {
    switch (currentView) {
      case 'SPLASH':
        return <Splash key="splash" onFlush={() => setCurrentView('ONBOARDING')} />;
      case 'ONBOARDING':
        return <Onboarding key="onboarding" onComplete={() => setCurrentView('HOME')} />;
      case 'HOME':
        return <Home key="home" onNavigate={setCurrentView} />;
      case 'LIBRARY':
        return <Library key="library" onNavigate={setCurrentView} />;
      case 'SCANNER':
        return <Scanner key="scanner" onNavigate={setCurrentView} onScanComplete={() => setCurrentView('OCR')} />;
      case 'OCR':
        return <OCRAnalysis key="ocr" onNavigate={setCurrentView} onComplete={() => setCurrentView('EDITOR')} />;
      case 'EDITOR':
        return <Editor key="editor" onNavigate={setCurrentView} />;
      case 'AI':
        return <Assistant key="assistant" onNavigate={setCurrentView} />;
      case 'SETTINGS':
        return <Settings key="settings" onNavigate={setCurrentView} />;
      default:
        return <Home key="home" onNavigate={setCurrentView} />;
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
