/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bolt, Zap, Camera, Image as ImageIcon, RotateCcw, Settings, Layers, RefreshCw, Languages } from 'lucide-react';
import { AppView, ScanStatus } from '../types';
import { GlassCard } from '../components/PremiumComponents';

interface ScannerProps {
  onNavigate: (view: AppView) => void;
  onScanComplete: (imageData?: string, language?: string) => void;
}

export default function Scanner({ onNavigate, onScanComplete }: ScannerProps) {
  const [status, setStatus] = useState<ScanStatus>(ScanStatus.IDLE);
  const [activeMode, setActiveMode] = useState('DOCUMENT');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Français');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isDocumentDetected, setIsDocumentDetected] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shutterSoundRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated Document Detection
  useEffect(() => {
    if (status !== ScanStatus.IDLE || !hasCameraAccess) {
      setIsDocumentDetected(false);
      setDetectionProgress(0);
      return;
    }

    const interval = setInterval(() => {
      // Logic: If user is steady (simulated by random), detect "edges"
      const detected = Math.random() > 0.3;
      setIsDocumentDetected(detected);
      
      if (detected) {
        setDetectionProgress(prev => {
          const next = prev + 15;
          if (next >= 100 && isAutoMode && countdown === null) {
            setCountdown(2); // Start 2s countdown for auto-capture
          }
          return Math.min(next, 100);
        });
      } else {
        setDetectionProgress(prev => Math.max(0, prev - 20));
        if (countdown !== null) setCountdown(null);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [status, hasCameraAccess, isAutoMode, countdown]);

  useEffect(() => {
    // Preload shutter sound
    shutterSoundRef.current = new Audio('https://assets.mixkit.io/active_storage/sfx/2571/2571-preview.mp3');
    shutterSoundRef.current.volume = 0.3; // Subtle volume
    shutterSoundRef.current.load();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsDocumentDetected(false);
    setDetectionProgress(0);
  };

  const startCamera = async () => {
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: { 
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraAccess(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Fallback for some browsers/devices
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setHasCameraAccess(true);
      } catch (finalErr) {
        setHasCameraAccess(false);
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

    const languages = [
      { name: 'Français', code: 'FR', flag: '🇫🇷' },
      { name: 'English', code: 'EN', flag: '🇬🇧' },
      { name: 'Español', code: 'ES', flag: '🇪🇸' },
      { name: 'Deutsch', code: 'DE', flag: '🇩🇪' },
      { name: 'Italiano', code: 'IT', flag: '🇮🇹' },
    ];
  
  useEffect(() => {
    const handleRemoteScan = () => startScan();
    window.addEventListener('zen-trigger-scan', handleRemoteScan);
    return () => window.removeEventListener('zen-trigger-scan', handleRemoteScan);
  }, [status, selectedLanguage]); // Dependencies for startScan context

  const modes = ['OCR', 'DOCUMENT', 'ID CARD', 'RECEIPT'];

  const startScan = () => {
    if (status !== ScanStatus.IDLE) return;
    
    // Play shutter sound immediately
    if (shutterSoundRef.current) {
      shutterSoundRef.current.currentTime = 0;
      shutterSoundRef.current.play().catch(e => console.log("Audio play blocked", e));
    }

    // Vibrate device if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    setCountdown(null);
    setStatus(ScanStatus.SCANNING);
    setShowFlash(true);
    
    // Capture image with a small delay to ensure video buffer is ready
    const captureFrame = () => {
      let capturedImage = '';
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const width = video.videoWidth;
        const height = video.videoHeight;
        
        if (width > 0 && height > 0) {
          const canvas = document.createElement('canvas');
          // Optimized dimensions for processing and storage
          const maxDim = 1000; 
          let targetWidth = width;
          let targetHeight = height;
          
          if (targetWidth > maxDim || targetHeight > maxDim) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
              targetWidth = maxDim;
            } else {
              targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
              targetHeight = maxDim;
            }
          }
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d', { alpha: false }); // Performance optimization
          if (ctx) {
            // Fill white background just in case
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            
            // Apply mirroring if using user camera
            if (facingMode === 'user') {
              ctx.translate(targetWidth, 0);
              ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            
            // Use 0.8 quality to keep size under 1MB even with base64 overhead
            capturedImage = canvas.toDataURL('image/jpeg', 0.8);
          }
        }
      }
      return capturedImage;
    };

    // Flash effect duration and then proceed
    setTimeout(() => {
      const img = captureFrame();
      setShowFlash(false);
      
      if (img && img.startsWith('data:image/jpeg;base64,') && img.length > 1000) { 
        onScanComplete(img, selectedLanguage);
      } else {
        console.error("Capture failed: Image too small or invalid", img ? img.length : 0);
        setStatus(ScanStatus.IDLE);
        // Fallback or retry? Let's just reset for now
        alert("Échec de la capture. Veuillez stabiliser votre appareil et réessayer.");
      }
    }, 200); // Slightly longer delay for stability
  };

  useEffect(() => {
    if (status === ScanStatus.IDLE && isAutoMode) {
      const detectTimer = setTimeout(() => {
        setCountdown(3);
      }, 1500);
      return () => clearTimeout(detectTimer);
    } else if (!isAutoMode) {
      setCountdown(null);
    }
  }, [status, isAutoMode]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      startScan();
    }
  }, [countdown]);

  const getModeConfig = (mode: string) => {
    switch (mode) {
      case 'ID CARD':
        return { aspect: 'aspect-[1.58/1]', label: 'Aligner la Carte ID', instruction: 'ID Détectée' };
      case 'RECEIPT':
        return { aspect: 'aspect-[1/2.2]', label: 'Aligner le Reçu', instruction: 'Reçu Détecté' };
      case 'OCR':
        return { aspect: 'aspect-[3/4]', label: 'Ne pas bouger', instruction: 'Texte Détecté' };
      default:
        return { aspect: 'aspect-[3/4]', label: 'Aligner le Document', instruction: 'Doc Détecté' };
    }
  };

  const currentConfig = getModeConfig(activeMode);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black overflow-hidden"
    >
      {/* Flash Effect Overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-[100]"
          />
        )}
      </AnimatePresence>

      {/* Top Header: Premium Glassmorphism */}
      <header className="absolute top-0 w-full z-20 flex justify-between items-center px-8 h-24 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={startCamera}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-3xl active:scale-90 transition-transform"
        >
          <RotateCcw className="w-6 h-6 text-white" />
        </button>
        
        <div className="flex flex-col items-center">
            {/* Language Selector in Header */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAutoMode(!isAutoMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all mb-1 ${
                  isAutoMode ? 'bg-ai-blue/20 border-ai-blue text-ai-blue' : 'bg-white/10 border-white/10 text-white/40'
                }`}
              >
                <Zap className={`w-3 h-3 ${isAutoMode ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-wider">{isAutoMode ? 'AUTO' : 'MANUEL'}</span>
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 hover:bg-white/20 transition-all mb-1"
                >
                  <Languages className="w-3 h-3 text-ai-blue" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{selectedLanguage.slice(0, 3)}</span>
                </button>
                
                <AnimatePresence>
                  {showLanguageSelector && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-primary-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[110]"
                    >
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLanguage(lang.name);
                            setShowLanguageSelector(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            selectedLanguage === lang.name ? 'bg-ai-blue text-white' : 'text-zinc-400 hover:bg-white/5'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                          {selectedLanguage === lang.name && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex gap-1.5">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1 h-1 rounded-full bg-ai-blue shadow-[0_0_8px_#4F7CFF]" />
              <div className="w-1 h-1 rounded-full bg-white/20" />
            </div>
            <span className="text-[7px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">PDF MODE</span>
        </div>

        <button 
          onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-3xl active:scale-90 transition-transform"
        >
          <RefreshCw className="w-6 h-6 text-white" />
        </button>
      </header>

      {/* Main Viewport */}
      <main className="relative h-screen w-full flex items-center justify-center pt-24 pb-48">
        {/* Real Camera Feed */}
        <div className="absolute inset-0 bg-black">
          {hasCameraAccess === false ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center bg-zinc-950">
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
                <Camera className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Accès Refusé</h3>
              <p className="text-zinc-500 text-sm max-w-xs leading-relaxed mb-10">
                ZenScan a besoin de votre caméra pour fonctionner. Veuillez autoriser l'accès dans les réglages.
              </p>
              <div className="flex flex-col w-full max-w-[240px] gap-4">
                <button 
                  onClick={startCamera}
                  className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-3xl active:scale-95 transition-transform"
                >
                  RÉESSAYER
                </button>
                <button 
                  onClick={() => onNavigate('HOME')}
                  className="w-full py-5 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-3xl active:scale-95 transition-transform"
                >
                  RETOUR
                </button>
              </div>
            </div>
          ) : (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
          )}
        </div>

        {/* Background Grid Pattern */}
        <div className="absolute inset-0 z-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />

        {/* Framing Overlay */}
        <div className={`relative w-[85%] max-w-sm transition-all duration-700 ease-[0.22,1,0.36,1] ${currentConfig.aspect}`}>
          {/* Advanced Corners */}
          <div className={`absolute -top-1 -left-1 w-16 h-16 border-t-[5px] border-l-[5px] rounded-tl-[40px] transition-colors duration-500 ${isDocumentDetected && detectionProgress > 50 ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-ai-blue ai-glow'}`} />
          <div className={`absolute -top-1 -right-1 w-16 h-16 border-t-[5px] border-r-[5px] rounded-tr-[40px] transition-colors duration-500 ${isDocumentDetected && detectionProgress > 50 ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-ai-blue ai-glow'}`} />
          <div className={`absolute -bottom-1 -left-1 w-16 h-16 border-b-[5px] border-l-[5px] rounded-bl-[40px] transition-colors duration-500 ${isDocumentDetected && detectionProgress > 50 ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-ai-blue ai-glow'}`} />
          <div className={`absolute -bottom-1 -right-1 w-16 h-16 border-b-[5px] border-r-[5px] rounded-br-[40px] transition-colors duration-500 ${isDocumentDetected && detectionProgress > 50 ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-ai-blue ai-glow'}`} />

          {/* Detection Pulse Overlay */}
          <AnimatePresence>
            {isDocumentDetected && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-emerald-500 rounded-[40px] z-0"
              />
            )}
          </AnimatePresence>

          {/* Center Guide Label */}
          <div className="absolute -top-28 left-0 right-0 text-center">
            <AnimatePresence mode="wait">
              {countdown !== null && status === ScanStatus.IDLE ? (
                <motion.span
                  key="countdown"
                  initial={{ opacity: 0, scale: 0, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1.5, rotate: 0 }}
                  exit={{ opacity: 0, scale: 3, rotate: 20 }}
                  className="inline-block text-7xl font-black text-white ai-glow"
                >
                  {countdown}
                </motion.span>
              ) : (
                <motion.div
                  key="label"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <p className={`font-bold text-lg tracking-tight transition-colors ${isDocumentDetected && detectionProgress > 80 ? 'text-emerald-400' : 'text-white'}`}>
                    {isDocumentDetected ? currentConfig.instruction : currentConfig.label}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <motion.div 
                      animate={{ scaleX: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-12 h-0.5 transition-colors ${isDocumentDetected ? 'bg-emerald-500/50' : 'bg-ai-blue/30'}`}
                    />
                    <div className="relative h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: `${detectionProgress}%` }}
                        className={`absolute inset-0 transition-colors ${detectionProgress >= 100 ? 'bg-emerald-500' : 'bg-ai-blue'}`}
                      />
                    </div>
                    <motion.div 
                      animate={{ scaleX: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-12 h-0.5 transition-colors ${isDocumentDetected ? 'bg-emerald-500/50' : 'bg-ai-blue/30'}`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic Laser Scan */}
          <AnimatePresence>
            {(status === ScanStatus.SCANNING || status === ScanStatus.PROCESSING) && (
              <motion.div
                initial={{ top: '0%' }}
                animate={{ top: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-1 bg-ai-blue shadow-[0_0_30px_#4F7CFF] z-10"
              />
            )}
          </AnimatePresence>

          {/* AI Tracking Box */}
          {status === ScanStatus.IDLE && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-8 border border-white/5 bg-white/[0.02] backdrop-blur-[2px] rounded-3xl flex items-center justify-center overflow-hidden"
            >
               <motion.div 
                 animate={{ opacity: [0.1, 0.3, 0.1] }}
                 transition={{ duration: 3, repeat: Infinity }}
                 className="absolute inset-0 bg-ai-blue/5"
               />
               <GlassCard className="p-4" hoverScale={false}>
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-ai-blue animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{currentConfig.instruction}</span>
                  </div>
               </GlassCard>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer: Controller & Modes */}
      <footer className="absolute bottom-0 w-full pb-12 pt-20 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
        <div className="max-w-md mx-auto px-8 space-y-12">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between">
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      onScanComplete(reader.result as string, selectedLanguage);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center group active:scale-90 transition-transform"
              >
                 <ImageIcon className="w-6 h-6 text-white group-hover:text-ai-blue transition-colors" />
              </button>
            </div>

            <div className="relative">
              <motion.div 
                animate={{ scale: status === ScanStatus.SCANNING ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="absolute -inset-6 bg-ai-blue/20 rounded-full blur-3xl" 
              />
              <button 
                onClick={startScan}
                disabled={status !== ScanStatus.IDLE}
                className="relative w-24 h-24 bg-white/5 rounded-full border-[6px] border-white/10 p-1.5 flex items-center justify-center active:scale-95 transition-transform"
              >
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.2)]">
                   <Camera className="w-9 h-9 text-black" />
                </div>
              </button>
            </div>

            <button 
              onClick={() => onNavigate('HOME')}
              className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Premium Mode Selector */}
          <div className="flex justify-center gap-8 px-4 overflow-x-auto no-scrollbar">
            {modes.map(mode => (
              <button 
                key={mode}
                onClick={() => setActiveMode(mode)}
                className="relative py-3 flex flex-col items-center group"
              >
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                  activeMode === mode ? 'text-ai-blue' : 'text-white/30 group-hover:text-white/60'
                }`}>
                  {mode}
                </span>
                {activeMode === mode && (
                  <motion.div 
                    layoutId="activeScannerMode"
                    className="absolute bottom-0 w-8 h-1 bg-ai-blue rounded-full shadow-[0_0_10px_#4F7CFF]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
