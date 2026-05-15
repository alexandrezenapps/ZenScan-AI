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

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppView, DocumentMetadata } from './types';
import { updateAppMeta } from './lib/icons';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { useAuth } from './context/AuthContext';
import { Loader2, WifiOff } from 'lucide-react';

// Lazy load views for better performance
const Splash = lazy(() => import('./views/Splash'));
const Onboarding = lazy(() => import('./views/Onboarding'));
const Home = lazy(() => import('./views/Home'));
const Library = lazy(() => import('./views/Library'));
const Scanner = lazy(() => import('./views/Scanner'));
const OCRAnalysis = lazy(() => import('./views/OCRAnalysis'));
const Editor = lazy(() => import('./views/Editor'));
const Assistant = lazy(() => import('./views/Assistant'));
const Settings = lazy(() => import('./views/Settings'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-primary-950 flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-10 h-10 text-ai-blue animate-spin" />
    <p className="text-[10px] font-black text-ai-blue/40 uppercase tracking-[0.3em]">Chargement...</p>
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.SPLASH);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [scannedLocation, setScannedLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<string>('Français');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const color = localStorage.getItem('zenScanIconColor') || 'blue';
    const shape = localStorage.getItem('zenScanIconShape') || 'circle';
    updateAppMeta(color, shape);
  }, []);

  // Handle Auth state changes for navigation and profile sync
  useEffect(() => {
    if (!loading) {
      if (user) {
        import('./services/storageService').then(({ storageService }) => {
          storageService.syncUserProfile();
        });
        
        if (currentView === AppView.SPLASH || currentView === AppView.ONBOARDING) {
          setCurrentView(AppView.HOME);
        }
      } else if (currentView !== AppView.SPLASH && currentView !== AppView.ONBOARDING) {
        setCurrentView(AppView.ONBOARDING);
      }
    }
  }, [user, loading, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-ai-blue animate-spin" />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'SPLASH':
        return <Splash onFlush={() => setCurrentView('ONBOARDING')} />;
      case 'ONBOARDING':
        return <Onboarding onComplete={() => setCurrentView('HOME')} />;
      case 'HOME':
        return <Home onNavigate={setCurrentView} />;
      case 'LIBRARY':
        return <Library onNavigate={setCurrentView} onSelectDocument={setSelectedDocument} />;
      case 'SCANNER':
        return (
          <Scanner 
            onNavigate={setCurrentView} 
            onScanComplete={(img, lang, loc) => {
              setScannedImage(img || null);
              if (lang) setOcrLanguage(lang);
              if (loc) setScannedLocation(loc);
              setCurrentView('OCR');
            }} 
          />
        );
      case 'OCR':
        return (
          <OCRAnalysis 
            onNavigate={setCurrentView} 
            onComplete={() => {
              setScannedImage(null);
              setScannedLocation(null);
              setCurrentView('EDITOR');
            }} 
            onSelectDocument={setSelectedDocument}
            scannedImage={scannedImage}
            scannedLocation={scannedLocation}
            initialLanguage={ocrLanguage}
          />
        );
      case 'EDITOR':
        return <Editor onNavigate={setCurrentView} document={selectedDocument} />;
      case 'AI':
        return <Assistant onNavigate={setCurrentView} />;
      case 'SETTINGS':
        return <Settings onNavigate={setCurrentView} />;
      default:
        return <Home onNavigate={setCurrentView} />;
    }
  };

  const showNav = currentView !== 'SPLASH' && currentView !== 'ONBOARDING';

  return (
    <div className="min-h-screen bg-primary-900 overflow-x-hidden">
      {showNav && currentView !== 'SCANNER' && currentView !== 'OCR' && <Navbar />}

      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] bg-red-500/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-red-400/20"
          >
            <WifiOff className="w-4 h-4 text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Mode Hors Ligne</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={showNav ? "pb-24 md:pb-32" : ""}>
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingFallback />}>
            {renderView()}
          </Suspense>
        </AnimatePresence>
      </main>

      {showNav && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
          <div className="pointer-events-auto">
            <BottomNav 
              currentView={currentView as AppView} 
              onNavigate={setCurrentView} 
              onScan={() => {
                window.dispatchEvent(new CustomEvent('zen-trigger-scan'));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
