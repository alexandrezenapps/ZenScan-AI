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
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AppView, DocumentMetadata } from './types';
import { updateAppMeta } from './lib/icons';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import AIChatBot from './components/AIChatBot';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [scannedLocation, setScannedLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<string>('Français');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { user, loading } = useAuth();

  const currentPath = location.pathname;
  const isSplashOrOnboarding = currentPath === '/splash' || currentPath === '/onboarding';
  const showNav = currentPath !== '/splash' && currentPath !== '/onboarding';

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
        
        if (isSplashOrOnboarding) {
          navigate('/home');
        }
      } else if (!isSplashOrOnboarding) {
        navigate('/onboarding');
      }
    }
  }, [user, loading, isSplashOrOnboarding, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-ai-blue animate-spin" />
      </div>
    );
  }

  const handleNavigate = (view: AppView | string) => {
    const path = view.toLowerCase();
    navigate(`/${path}`);
  };

  return (
    <div className="min-h-screen bg-primary-900 overflow-x-hidden">
      {showNav && currentPath !== '/scanner' && currentPath !== '/ocr' && <Navbar />}

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
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Suspense fallback={<LoadingFallback />}>
              <Routes location={location}>
            <Route path="/splash" element={<Splash onFlush={() => navigate('/onboarding')} />} />
            <Route path="/onboarding" element={<Onboarding onComplete={() => navigate('/home')} />} />
            <Route path="/home" element={<Home onNavigate={handleNavigate} />} />
            <Route path="/library" element={<Library onNavigate={handleNavigate} onSelectDocument={setSelectedDocument} />} />
            <Route path="/scanner" element={
              <Scanner 
                onNavigate={handleNavigate} 
                onScanComplete={(img, lang, loc) => {
                  setScannedImage(img || null);
                  if (lang) setOcrLanguage(lang);
                  if (loc) setScannedLocation(loc);
                  navigate('/ocr');
                }} 
              />
            } />
            <Route path="/ocr" element={
              <OCRAnalysis 
                onNavigate={handleNavigate} 
                onComplete={() => {
                  setScannedImage(null);
                  setScannedLocation(null);
                  navigate('/editor');
                }} 
                onSelectDocument={setSelectedDocument}
                scannedImage={scannedImage}
                scannedLocation={scannedLocation}
                initialLanguage={ocrLanguage}
              />
            } />
            <Route path="/editor" element={<Editor onNavigate={handleNavigate} document={selectedDocument} />} />
            <Route path="/ai" element={<Assistant onNavigate={handleNavigate} />} />
            <Route path="/settings" element={<Settings onNavigate={handleNavigate} />} />
            <Route path="/" element={<Navigate to={user ? "/home" : "/splash"} replace />} />
          </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {showNav && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
          <AIChatBot />
          <div className="pointer-events-auto">
            <BottomNav 
              currentView={currentPath.substring(1).toUpperCase() as AppView} 
              onNavigate={handleNavigate} 
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
