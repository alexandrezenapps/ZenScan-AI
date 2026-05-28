/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bolt, Zap, Camera, Image as ImageIcon, RotateCcw, Settings, Layers, RefreshCw, Languages, FileText, Calendar, Tag, Sparkles, CheckCircle2 } from 'lucide-react';
import { AppView, ScanStatus } from '../types';
import { GlassCard } from '../components/PremiumComponents';
import { detectObjectsInImage, DetectedObject } from '../services/geminiService';

interface ScannerProps {
  onNavigate: (view: AppView) => void;
  onScanComplete: (imageData?: string, language?: string, location?: { latitude: number, longitude: number }, detectedObjects?: DetectedObject[]) => void;
}

export default function Scanner({ onNavigate, onScanComplete }: ScannerProps) {
  const [status, setStatus] = useState<ScanStatus>(ScanStatus.IDLE);
  const [activeMode, setActiveMode] = useState('DOCUMENT');
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isDetectingObjects, setIsDetectingObjects] = useState(false);
  const [isCardCollapsed, setIsCardCollapsed] = useState(false);
  const [cardTimerTrigger, setCardTimerTrigger] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Français');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [isVirtualCamera, setIsVirtualCamera] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isDocumentDetected, setIsDocumentDetected] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; key: number }[]>([]);
  
  const triggerCaptureShockwave = () => {
    const id = Date.now() + Math.random();
    setRipples(prev => [...prev, { id, key: id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 1200);
  };
  
  const [showCaptureSettings, setShowCaptureSettings] = useState(false);
  const [autoAssign, setAutoAssign] = useState(() => {
    return localStorage.getItem('zenScanAutoAssignFolder') !== 'false';
  });
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const defaultMapping: Record<string, string> = {
      'Factures': 'f_receipts',
      'Recettes': 'f_receipts',
      'Contrats': 'f_work',
      'Identité': 'f_personal',
      'Personnel': 'f_personal',
      'Travail': 'f_work'
    };
    const saved = localStorage.getItem('zenScanAutoAssignMapping');
    if (saved) {
      try {
        return { ...defaultMapping, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return defaultMapping;
  });
  const [availableFolders] = useState<{ id: string; name: string; color: string }[]>(() => {
    const saved = localStorage.getItem('zenScanFolders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'f_personal', name: 'Personnel', color: '#3B82F6' },
      { id: 'f_work', name: 'Professionnel', color: '#10B981' },
      { id: 'f_important', name: 'Action Requis', color: '#EF4444' },
      { id: 'f_receipts', name: 'Notes & Reçus', color: '#F59E0B' }
    ];
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shutterSoundRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  // Toggle Torch/Flash
  const toggleTorch = async () => {
    if (!trackRef.current) return;
    try {
      const newTorch = !torch;
      // @ts-ignore - advanced constraints might not be in standard types
      await trackRef.current.applyConstraints({
        advanced: [{ torch: newTorch }]
      });
      setTorch(newTorch);
    } catch (err) {
      console.warn("Torch not supported", err);
    }
  };

  // Handle Zoom
  const handleZoom = async (newZoom: number) => {
    if (!trackRef.current) return;
    try {
      // @ts-ignore
      await trackRef.current.applyConstraints({
        advanced: [{ zoom: newZoom }]
      });
      setZoom(newZoom);
    } catch (err) {
      console.warn("Zoom not supported", err);
    }
  };

  // Simulated Document Detection
  useEffect(() => {
    if (status !== ScanStatus.IDLE || !hasCameraAccess || activeMode === 'OBJECT') {
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
  }, [status, hasCameraAccess, isAutoMode, countdown, activeMode]);

  // Real-time Object Translation & Localization loop
  useEffect(() => {
    if (activeMode !== 'OBJECT' || !hasCameraAccess || status !== ScanStatus.IDLE) {
      setDetectedObjects([]);
      return;
    }

    let isMounted = true;
    let timerId: NodeJS.Timeout | null = null;

    const runDetection = async () => {
      if (!isMounted || activeMode !== 'OBJECT') return;
      if (isVirtualCamera) {
        const mockObjects = [
          {
            name_en: "Smart Display",
            name_news: "Smart Display",
            name_fr: "Écran Intelligent",
            name_zh: "智能显示屏",
            boundingBox: [15, 10, 55, 60] as [number, number, number, number]
          },
          {
            name_en: "Coffee Mug",
            name_news: "Coffee Mug",
            name_fr: "Tasse à Café",
            name_zh: "咖啡杯",
            boundingBox: [60, 65, 90, 88] as [number, number, number, number]
          },
          {
            name_en: "Wireless Keyboard",
            name_news: "Wireless Keyboard",
            name_fr: "Clavier Sans Fil",
            name_zh: "无线键盘",
            boundingBox: [65, 15, 88, 55] as [number, number, number, number]
          }
        ];
        setDetectedObjects(mockObjects);
        timerId = setTimeout(runDetection, 3000);
        return;
      }
      if (!videoRef.current || videoRef.current.readyState < 2 || isProcessing || isDetectingObjects) {
        // Retry shortly if the video element is not ready
        timerId = setTimeout(runDetection, 1000);
        return;
      }

      setIsDetectingObjects(true);
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        const maxDim = 480; // Optimized resolution for low-latency network transfer and sharp Gemini recognition
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (width > 0 && height > 0) {
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
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            const base64 = canvas.toDataURL('image/jpeg', 0.6); // 60% quality compression is lightweight and perfectly readable

            const objects = await detectObjectsInImage(base64);
            if (isMounted && activeMode === 'OBJECT') {
              setDetectedObjects(objects);
            }
          }
        }
      } catch (err) {
        console.error("Failed to run object detection frame:", err);
      } finally {
        if (isMounted) {
          setIsDetectingObjects(false);
          // Query again in 3.5 seconds
          timerId = setTimeout(runDetection, 3500);
        }
      }
    };

    // Begin loop with a 1-second delay to let camera initialize nicely
    timerId = setTimeout(runDetection, 1000);

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [activeMode, hasCameraAccess, status, isProcessing]);

  // Direct Object Translation card 5-second auto-collapse timer
  useEffect(() => {
    if (activeMode !== 'OBJECT') {
      setIsCardCollapsed(false);
      return;
    }

    setIsCardCollapsed(false);

    const timer = setTimeout(() => {
      setIsCardCollapsed(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeMode, detectedObjects, cardTimerTrigger]);

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
      trackRef.current = stream.getVideoTracks()[0];
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraAccess(true);
      
      // Check for capabilities
      if (trackRef.current) {
        const capabilities = trackRef.current.getCapabilities();
        // @ts-ignore
        if (capabilities.torch) {
          console.log("Torch supported");
        }
      }
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
    
    // Trigger the visual shockwave ripples animation
    triggerCaptureShockwave();
    
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
      if (isVirtualCamera) {
        // Render a high-fidelity mock scene depending on the current activeMode
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1333; // aspect ratio matching 3/4
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill soft slate background style
          const gradient = ctx.createLinearGradient(0, 0, 1000, 1333);
          gradient.addColorStop(0, '#111116');
          gradient.addColorStop(1, '#1E1E26');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1000, 1333);

          // Draw shadows for high-contrast white document in the center
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 50;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 24;

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(100, 120, 800, 1093);
          ctx.shadowColor = 'transparent'; // reset shadow

          // Fill clean corporate text colors
          ctx.fillStyle = '#18181B';
          
          if (activeMode === 'RECEIPT') {
            // Receipt simulation
            ctx.font = 'bold 36px sans-serif';
            ctx.fillText('ZENSCAN BOUTIQUE PARIS', 150, 220);
            ctx.font = '24px monospace';
            ctx.fillText('75001 Paris, avenue des Champs-Élisées', 150, 270);
            ctx.fillText('----------------------------------------', 150, 310);
            
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText('REÇU DE TRANSACTION - FACTURE', 150, 360);
            
            ctx.font = '24px monospace';
            ctx.fillText('Date: 2026-05-09 14:32', 150, 410);
            ctx.fillText('ID Client: #41893-Z', 150, 450);
            ctx.fillText('----------------------------------------', 150, 490);
            
            ctx.fillText('1x Intelligence Scanner Pro     89,50 €', 150, 550);
            ctx.fillText('1x Traduction OSD Multilingue   35,00 €', 150, 600);
            
            ctx.fillText('----------------------------------------', 150, 660);
            ctx.font = 'bold 32px monospace';
            ctx.fillText('TOTAL NET:                     124,50 €', 150, 720);
            ctx.font = '20px monospace';
            ctx.fillText('TVA (20%):                      20,75 €', 150, 770);
            ctx.fillText('----------------------------------------', 150, 820);
            
            ctx.font = 'italic 22px sans-serif';
            ctx.fillText('Merci pour votre confiance premium.', 150, 880);
          } else if (activeMode === 'ID CARD') {
            // ID Card simulation with nice colors
            ctx.fillStyle = '#3E63A8';
            ctx.fillRect(120, 140, 760, 460);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(140, 160, 720, 420);
            
            ctx.fillStyle = '#09090B';
            ctx.font = 'bold 32px sans-serif';
            ctx.fillText('RÉPUBLIQUE FRANÇAISE', 300, 220);
            ctx.font = '16px sans-serif';
            ctx.fillText('CARTE NATIONALE D\'IDENTITÉ / NATIONAL ID CARD', 300, 250);
            
            // Photo placeholder
            ctx.fillStyle = '#CBD5E1';
            ctx.fillRect(170, 280, 150, 200);
            ctx.fillStyle = '#94A3B8';
            ctx.beginPath();
            ctx.arc(245, 350, 45, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(245, 450, 70, Math.PI, 0);
            ctx.fill();
            
            ctx.fillStyle = '#09090B';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText('Nom: DE LAPLACE', 360, 310);
            ctx.fillText('Prénoms: Éléonore Jeanne', 360, 350);
            ctx.fillText('Nationalité: Française', 360, 390);
            ctx.fillText('Date de Naiss: 1994-08-12', 360, 430);
            ctx.fillText('Lieu: Paris (75)', 360, 470);
            
            ctx.font = '20px monospace';
            ctx.fillText('IDFRA123456789DE<<LAPLACE<<JEANNE<<94', 170, 540);
          } else {
            // DOCUMENT / OCR / default simulation with actual real OCRable lines
            ctx.font = 'bold 34px sans-serif';
            ctx.fillText('ZENSCAN INTELLIGENCE INC.', 150, 220);
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText('CONTRAT DE SERVICE ET ACCORD DE CONFIDENTIALITÉ', 150, 275);
            ctx.font = '22px sans-serif';
            
            ctx.fillText('Le présent accord est conclu en date du 2026-05-09 entre :', 150, 340);
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText('1. La société ZenScan (fournisseur de services cloud local)', 150, 395);
            ctx.fillText('2. L\'Utilisateur Final du Système de Reconnaissance OCR', 150, 435);
            
            ctx.font = '20px sans-serif';
            const textLines = [
              'Article 1 : Objet de la numérisation',
              'Le client utilise l\'appareil photo virtuel à des fins d\'évaluation.',
              'Toutes les images capturées sont stockées chiffrées localement.',
              '',
              'Article 2 : Valeur Financière Connexe',
              'Les frais de modélisation linguistique s\'élèvent à un forfait global',
              'de 124,50 € TTC à payer mensuellement à la date d\'échéance.',
              '',
              'Article 3 : Limitation de responsabilité',
              'L\'environnement Cloud Run sécurisé de Google AI Studio assure la',
              'haute disponibilité et la protection complète des métadonnées.',
              'Aucune donnée n\'est relayée à l\'extérieur sans consentement.'
            ];
            
            let currentY = 495;
            textLines.forEach(line => {
              ctx.fillText(line, 150, currentY);
              currentY += 42;
            });
            
            ctx.fillText('Fait à Paris, le 2026-05-09 en deux exemplaires originaux.', 150, 1055);
          }
          
          capturedImage = canvas.toDataURL('image/jpeg', 0.85);
        }
      } else if (videoRef.current && videoRef.current.readyState >= 2) {
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
          const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
          if (ctx) {
            // Fill white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            
            // Apply mirroring if using user camera
            if (facingMode === 'user') {
              ctx.translate(targetWidth, 0);
              ctx.scale(-1, 1);
            }

            // Draw original frame
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            
            // Image Enhancement Filters
            // 1. Boost contrast slightly
            // 2. Grayscale (if mode is DOCUMENT or Receipt)
            if (activeMode === 'DOCUMENT' || activeMode === 'RECEIPT' || activeMode === 'OCR') {
               ctx.filter = 'contrast(1.2) brightness(1.05) grayscale(0.8)';
               // Redraw with filters
               ctx.drawImage(canvas, 0, 0);
            }
            
            // Reset filter
            ctx.filter = 'none';
            
            // Use 0.75 quality for high compression while preserving text readability
            capturedImage = canvas.toDataURL('image/jpeg', 0.75);
          }
        }
      }
      return capturedImage;
    };

    // Flash effect duration and then proceed
    setTimeout(async () => {
      const img = captureFrame();
      setShowFlash(false);
      
      if (img && img.startsWith('data:image/jpeg;base64,') && img.length > 1000) { 
        setCapturedImages(prev => [...prev, img]);
        setStatus(ScanStatus.IDLE);
      } else {
        console.error("Capture failed: Image too small or invalid", img ? img.length : 0);
        setStatus(ScanStatus.IDLE);
        alert("Échec de la capture. Veuillez stabiliser votre appareil et réessayer.");
      }
    }, 200); 
  };

  const finalizeScan = async () => {
    if (capturedImages.length === 0) return;
    setIsProcessing(true);
    setStatus(ScanStatus.PROCESSING);
    
    let location: { latitude: number, longitude: number } | undefined;
    
    try {
      if ("geolocation" in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      }
    } catch (err) {
      console.warn("Geolocation denied:", err);
    }

    // Process first image as primary or combine? 
    // In this app, onScanComplete takes a single image.
    onScanComplete(capturedImages[0], selectedLanguage, location, activeMode === 'OBJECT' ? detectedObjects : undefined);
    setIsProcessing(false);
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
      case 'OBJECT':
        return { aspect: 'aspect-[3/4]', label: 'Visez un objet pour traduire', instruction: 'Traduction d\'objets IA active' };
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

      {/* Real Camera Feed - Fixed Background */}
      <div className="absolute inset-0 bg-black z-0">
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
                onClick={() => {
                  setIsVirtualCamera(true);
                  setHasCameraAccess(true);
                }}
                className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black text-xs uppercase tracking-widest rounded-3xl active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/30 flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-teal-400"
              >
                <Sparkles className="w-4 h-4 text-black animate-pulse" />
                DÉMO CAMÉRA VIRTUELLE
              </button>
              <button 
                onClick={() => onNavigate(AppView.HOME)}
                className="w-full py-5 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-3xl active:scale-95 transition-transform"
              >
                RETOUR
              </button>
            </div>
          </div>
        ) : (
          <>
            {isVirtualCamera ? (
              <div className="absolute inset-0 bg-neutral-950 flex items-center justify-center overflow-hidden transition-all duration-500" style={{ transform: `scale(${zoom})` }}>
                {/* Simulated Desk Background Grid */}
                <div className="absolute inset-0 opacity-15 [background-size:24px_24px] [background-image:radial-gradient(circle,rgba(255,255,255,0.15)_1px,transparent_1px)]" />
                
                {/* Visual Elements according to Active Mode */}
                {activeMode === 'OBJECT' ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Simulated live desk objects */}
                    {/* 1. Smart Display */}
                    <div className="absolute top-[18%] left-[10%] w-[45%] h-[37%] rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950 p-4 flex flex-col justify-between shadow-2xl">
                      <div className="flex justify-between items-center text-zinc-500">
                        <span className="text-[7px] font-mono tracking-widest">SMART DISPLAY 4K</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <div className="space-y-1 my-auto">
                        <div className="text-white text-xs font-black">ZenScan AI Server</div>
                        <div className="text-[8px] text-emerald-400 font-mono">STATUS: ONLINE RTT=0.8s</div>
                      </div>
                      <div className="h-6 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between px-2 text-[8px] text-zinc-400">
                        <span>SYS LOAD: 12%</span>
                        <span className="text-emerald-500 text-[7px] font-black">OPTIMAL</span>
                      </div>
                    </div>

                    {/* 2. Coffee Mug */}
                    <div className="absolute bottom-[10%] right-[10%] w-[25%] h-[30%] border border-zinc-800 rounded-full bg-gradient-to-b from-neutral-800 via-neutral-900 to-zinc-950 flex flex-col items-center justify-center shadow-xl">
                      {/* Steam particles */}
                      <div className="absolute -top-6 flex gap-1 justify-center">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [-5, -25], opacity: [0, 0.4, 0], scale: [1, 1.3, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
                            className="w-1 h-3 bg-zinc-400/30 rounded-full blur-[1px]"
                          />
                        ))}
                      </div>
                      <div className="w-14 h-14 rounded-full border border-neutral-700/50 bg-amber-950/20 flex items-center justify-center shadow-inner">
                        <div className="w-10 h-10 rounded-full bg-amber-950 flex items-center justify-center">
                          <div className="text-[7px] font-bold text-amber-500 uppercase tracking-widest leading-none">COFFEE</div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Wireless Keyboard */}
                    <div className="absolute bottom-[10%] left-[10%] w-[45%] h-[23%] rounded-2xl border border-white/5 bg-zinc-900/40 p-2 shadow-2xl backdrop-blur-sm">
                      <div className="grid grid-cols-6 gap-1 h-full">
                        {Array.from({ length: 18 }).map((_, i) => (
                          <div key={i} className="bg-zinc-800/80 rounded-lg flex items-center justify-center border border-white/5 shadow-sm">
                            <span className="text-[5px] text-zinc-600 font-mono">K{i}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Document simulation (DOCUMENT, RECEIPT, ID CARD, OCR)
                  <div className="relative w-full h-full flex items-center justify-center">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className={`bg-zinc-50 border border-zinc-200 text-black shadow-[0_30px_70px_rgba(0,0,0,0.8)] p-6 md:p-8 rounded-2xl flex flex-col justify-between overflow-hidden ${
                        activeMode === 'RECEIPT' ? 'w-[65%] h-[75%] max-w-xs' : 
                        activeMode === 'ID CARD' ? 'w-[85%] h-[50%] max-w-sm' : 
                        'w-[80%] h-[75%] max-w-md'
                      }`}
                    >
                      {activeMode === 'RECEIPT' ? (
                        <div className="flex-1 flex flex-col justify-between font-mono text-[10px] space-y-2 text-zinc-800">
                          <div className="text-center space-y-1">
                            <h4 className="font-extrabold text-xs tracking-tight text-zinc-950 text-center">ZENSCAN BOUTIQUE PARIS</h4>
                            <p className="text-[8px] text-zinc-500">75001 Paris, avenue des Champs-Élisées</p>
                            <p className="text-[8px] text-zinc-500">----------------------------------------</p>
                          </div>
                          
                          <div className="space-y-1">
                            <h5 className="font-black text-[9px] uppercase text-zinc-950">REÇU DE TRANSACTION</h5>
                            <p className="text-[8px]">Date: 2026-05-09 14:32</p>
                            <p className="text-[8px]">Réf: #7394-ZOCR</p>
                          </div>
                          
                          <div className="border-t border-dashed border-zinc-300 py-2 space-y-1">
                            <div className="flex justify-between">
                              <span>1x Scanner Document IA</span>
                              <span>89,50 €</span>
                            </div>
                            <div className="flex justify-between">
                              <span>1x Traduction Multilingue OSD</span>
                              <span>35,00 €</span>
                            </div>
                          </div>
                          
                          <div className="border-t border-dashed border-zinc-300 pt-2 flex justify-between font-extrabold text-xs text-zinc-950">
                            <span>TOTAL NET:</span>
                            <span>124,50 €</span>
                          </div>
                        </div>
                      ) : activeMode === 'ID CARD' ? (
                        <div className="flex-1 flex flex-col justify-between text-zinc-900 border border-zinc-300 rounded-xl p-3 bg-gradient-to-r from-blue-50/20 to-zinc-100">
                          <div className="flex justify-between items-start border-b border-zinc-200 pb-2">
                            <div>
                              <h4 className="font-extrabold text-[11px] tracking-wide text-zinc-950">RÉPUBLIQUE FRANÇAISE</h4>
                              <p className="text-[6px] uppercase tracking-wider text-zinc-500 leading-none">CARTE NATIONALE D'IDENTITÉ / NATIONAL ID CARD</p>
                            </div>
                            <span className="text-[8px] font-black text-blue-800">UE</span>
                          </div>
                          
                          <div className="flex gap-4 items-center my-auto">
                            <div className="w-16 h-20 bg-zinc-200 rounded border border-zinc-300 flex items-center justify-center overflow-hidden shrink-0">
                              <div className="w-8 h-8 rounded-full bg-zinc-400 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-zinc-500">ID</span>
                              </div>
                            </div>
                            <div className="space-y-1 text-[8px] text-zinc-700 flex-1">
                              <div><span className="font-extrabold text-zinc-950 block">Nom: DETECTÉ DE LAPLACE</span></div>
                              <div><span className="font-extrabold text-zinc-950 block">Prénoms: Éléonore Jeanne</span></div>
                              <div className="flex gap-2">
                                <div><span className="text-zinc-500 font-bold">Sexe:</span> F</div>
                                <div><span className="text-zinc-500 font-bold">Né le:</span> 1994-08-12</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-zinc-200 pt-2 font-mono text-[7px] text-zinc-500 tracking-wider font-bold">
                            IDFRA123456789DE{"<<"}LAPLACE{"<<"}JEANNE{"<<"}94
                          </div>
                        </div>
                      ) : (
                        // Standard Document
                        <div className="flex-1 flex flex-col justify-between text-neutral-800 text-[10px] space-y-4">
                          <div className="border-b border-zinc-200 pb-3">
                            <h4 className="font-black text-xs tracking-tight text-zinc-950 leading-tight">ZENSCAN INTELLIGENCE INC.</h4>
                            <p className="text-[7px] text-zinc-500 font-mono">AUTOMATED SYSTEM INTEGRATION REPORT</p>
                          </div>
                          
                          <div className="space-y-2 leading-relaxed flex-1">
                            <p className="font-extrabold text-zinc-950 text-[11px]">CONTRAT DE SERVICE ET ACCORD DE PROTECTION</p>
                            <p className="text-[8px] text-zinc-500">Le présent document atteste de la conformité du transit des données OCR en date du <span className="text-zinc-950 font-bold">2026-05-09</span>.</p>
                            <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200 space-y-1">
                              <p className="text-[8px] font-semibold text-zinc-800">Frais d'activation et forfait d'hébergement :</p>
                              <p className="text-[9px] font-black text-zinc-950 flex justify-between">
                                <span>Abonnement Premium Actuel :</span>
                                <span className="text-emerald-600 font-bold">124,50 € TTC</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="border-t border-zinc-200 pt-3 flex justify-between items-center text-[7px] text-zinc-400 uppercase font-mono tracking-widest leading-none">
                            <span>SÉCURITÉ COGNITIVE MAXIMALE</span>
                            <span>PAGE 1 DE 1</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}
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
            {/* Real-time Object Translation Overlays */}
            {activeMode === 'OBJECT' && detectedObjects && detectedObjects.length > 0 && (
              <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                {detectedObjects.map((obj, index) => {
                  const [ymin, xmin, ymax, xmax] = obj.boundingBox;
                  const isMirrored = facingMode === 'user';
                  const left = isMirrored ? (100 - xmax) : xmin;
                  const top = ymin;
                  const width = xmax - xmin;
                  const height = ymax - ymin;
                  
                  return (
                    <motion.div
                      key={`obj-box-${index}-${obj.name_en}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="absolute border-2 border-dashed border-emerald-400 rounded-2xl flex flex-col justify-end pointer-events-auto"
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                        minWidth: '110px',
                        minHeight: '110px'
                      }}
                    >
                      {/* Target sci-fi corner brackets */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />
                      
                      {/* Premium Multilingual Information Drawer HUD */}
                      <div className="absolute bottom-2 left-2 right-2 bg-zinc-950/90 backdrop-blur-md border border-white/10 rounded-xl p-2 text-white shadow-2xl flex flex-col gap-1 pointer-events-auto select-none">
                        <div className="flex items-center gap-1.5 leading-none">
                          <span className="text-[8px] font-bold text-zinc-500 uppercase bg-white/10 px-1 py-0.5 rounded tracking-widest shrink-0">en</span>
                          <span className="text-xs font-black text-white leading-none truncate">{obj.name_en}</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-t border-white/5 pt-1 leading-none">
                          <span className="text-[8px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-1 py-0.5 rounded tracking-widest shrink-0">fr</span>
                          <span className="text-xs font-black text-emerald-400 leading-none truncate">{obj.name_fr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-t border-white/5 pt-1 leading-none">
                          <span className="text-[8px] font-bold text-amber-500 uppercase bg-amber-500/10 px-1 py-0.5 rounded tracking-widest shrink-0">zh</span>
                          <span className="text-xs font-black text-amber-300 leading-none truncate">{obj.name_zh}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
        
        {/* Background Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />
      </div>

      {isVirtualCamera && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-500/95 to-teal-500/95 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2.5 shadow-2xl border border-emerald-400/30">
          <Sparkles className="w-3.5 h-3.5 text-zinc-950 animate-pulse" />
          <span className="text-[10px] font-black text-zinc-950 uppercase tracking-wider font-mono">DÉMO CAMÉRA ACTIVÉE</span>
          <button 
            onClick={() => {
              setIsVirtualCamera(false);
              setHasCameraAccess(null);
              startCamera();
            }}
            className="bg-black/20 hover:bg-black/40 text-black px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition-colors"
          >
            Réel
          </button>
        </div>
      )}

      {/* Top Header: Premium Glassmorphism */}
      <header className="absolute top-0 w-full z-40 flex justify-between items-center px-8 h-24 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate(AppView.HOME)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-3xl active:scale-90 transition-transform"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={toggleTorch}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl border backdrop-blur-3xl active:scale-90 transition-transform ${
              torch ? 'bg-ai-blue/30 border-ai-blue text-ai-blue shadow-[0_0_15px_rgba(79,124,255,0.4)]' : 'bg-white/5 border-white/10 text-white'
            }`}
            title="Activer le flash"
          >
            <Bolt className={`w-6 h-6 ${torch ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        <div className="flex flex-col items-center">
            {/* Language Selector in Header */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAutoMode(!isAutoMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all mb-1 ${
                  isAutoMode ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-white/10 border-white/10 text-white/40'
                }`}
              >
                <Zap className={`w-3 h-3 ${isAutoMode ? 'fill-current' : ''}`} />
                <span className="text-[9px] font-black uppercase tracking-wider">{isAutoMode ? 'AUTO' : 'MANUEL'}</span>
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 hover:bg-white/20 transition-all mb-1"
                >
                  <Languages className="w-3 h-3 text-ai-blue" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">{selectedLanguage.slice(0, 3)}</span>
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
            <span className="text-[7px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">ENGINE v4.0</span>
        </div>

        <button 
          onClick={() => setShowCaptureSettings(true)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-3xl active:scale-90 transition-transform group"
        >
          <Settings className="w-6 h-6 text-white group-hover:text-ai-blue transition-colors" />
        </button>
      </header>

      {/* Floating Translated List Card for OBJECT mode */}
      {activeMode === 'OBJECT' && (
        <div className="absolute top-28 left-6 right-6 z-40 max-w-sm mx-auto pointer-events-auto">
          <AnimatePresence mode="wait">
            {isCardCollapsed ? (
              <motion.button
                key="collapsed-bar"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.7)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsCardCollapsed(false);
                  setCardTimerTrigger(prev => prev + 1);
                }}
                className="w-full flex items-center justify-between bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2.5 shadow-2xl transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-mono truncate">
                    {detectedObjects.length > 0 ? `${detectedObjects.length} Objets Traduits` : 'Traducteur IA en Direct'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[8px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
                  <span>Afficher</span>
                </div>
              </motion.button>
            ) : (
              <motion.div
                key="expanded-card"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3 relative group"
              >
                {/* Manual collapse button */}
                <button
                  type="button"
                  onClick={() => setIsCardCollapsed(true)}
                  className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="flex items-center justify-between pr-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">Traducteur IA en Direct</span>
                  </div>
                  {isDetectingObjects && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Calcul...</span>
                    </div>
                  )}
                </div>
                
                {detectedObjects.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 italic text-center py-2.5 leading-normal">
                    {isDetectingObjects ? "Évaluation de la scène par l'IA..." : "Pointez l'objectif sur un objet pour obtenir l'identification et la traduction instantanée (FR / EN / CN)."}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                    {detectedObjects.map((obj, i) => (
                      <div key={`list-obj-${i}`} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 transition-all hover:bg-white/[0.06]">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider font-mono">Objet #{i+1}</span>
                          <span className="text-xs font-black text-white truncate">{obj.name_fr}</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 leading-tight shrink-0">
                          <span className="text-[10px] text-zinc-300 font-bold">🇬🇧 {obj.name_en}</span>
                          <span className="text-[10px] text-amber-300 font-black">🇨🇳 {obj.name_zh}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}


      {/* Main Viewport */}
      {activeMode !== 'OBJECT' && (
        <main className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {/* Framing Overlay */}
        <div className={`relative w-[85%] max-w-sm transition-all duration-700 ease-[0.22,1,0.36,1] ${currentConfig.aspect} pointer-events-auto`}>
          {/* Advanced Corners */}
          <motion.div
            animate={{
              x: isDocumentDetected ? 14 : 0,
              y: isDocumentDetected ? 14 : 0,
              scale: isDocumentDetected ? 0.94 : 1,
              borderTopLeftRadius: isDocumentDetected ? "16px" : "40px",
              borderColor: isDocumentDetected ? "#10b981" : "#3b82f6",
              boxShadow: isDocumentDetected 
                ? "0 0 20px rgba(16, 185, 129, 0.45)" 
                : "0 0 15px rgba(59, 130, 246, 0.2)"
            }}
            transition={{ type: "spring", stiffness: 100, damping: 14 }}
            className="absolute -top-1 -left-1 w-16 h-16 border-t-[5px] border-l-[5px] pointer-events-none"
          />
          <motion.div
            animate={{
              x: isDocumentDetected ? -14 : 0,
              y: isDocumentDetected ? 14 : 0,
              scale: isDocumentDetected ? 0.94 : 1,
              borderTopRightRadius: isDocumentDetected ? "16px" : "40px",
              borderColor: isDocumentDetected ? "#10b981" : "#3b82f6",
              boxShadow: isDocumentDetected 
                ? "0 0 20px rgba(16, 185, 129, 0.45)" 
                : "0 0 15px rgba(59, 130, 246, 0.2)"
            }}
            transition={{ type: "spring", stiffness: 100, damping: 14 }}
            className="absolute -top-1 -right-1 w-16 h-16 border-t-[5px] border-r-[5px] pointer-events-none"
          />
          <motion.div
            animate={{
              x: isDocumentDetected ? 14 : 0,
              y: isDocumentDetected ? -14 : 0,
              scale: isDocumentDetected ? 0.94 : 1,
              borderBottomLeftRadius: isDocumentDetected ? "16px" : "40px",
              borderColor: isDocumentDetected ? "#10b981" : "#3b82f6",
              boxShadow: isDocumentDetected 
                ? "0 0 20px rgba(16, 185, 129, 0.45)" 
                : "0 0 15px rgba(59, 130, 246, 0.2)"
            }}
            transition={{ type: "spring", stiffness: 100, damping: 14 }}
            className="absolute -bottom-1 -left-1 w-16 h-16 border-b-[5px] border-l-[5px] pointer-events-none"
          />
          <motion.div
            animate={{
              x: isDocumentDetected ? -14 : 0,
              y: isDocumentDetected ? -14 : 0,
              scale: isDocumentDetected ? 0.94 : 1,
              borderBottomRightRadius: isDocumentDetected ? "16px" : "40px",
              borderColor: isDocumentDetected ? "#10b981" : "#3b82f6",
              boxShadow: isDocumentDetected 
                ? "0 0 20px rgba(16, 185, 129, 0.45)" 
                : "0 0 15px rgba(59, 130, 246, 0.2)"
            }}
            transition={{ type: "spring", stiffness: 100, damping: 14 }}
            className="absolute -bottom-1 -right-1 w-16 h-16 border-b-[5px] border-r-[5px] pointer-events-none"
          />

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
      )}

      {/* Captured Multi-Scan Preview Staging Area */}
      <AnimatePresence>
        {capturedImages.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-64 left-0 right-0 z-50 px-8 flex justify-center pointer-events-none"
          >
            <div className="flex gap-2 overflow-x-auto pb-4 max-w-full no-scrollbar pointer-events-auto items-end">
              {capturedImages.map((img, i) => (
                <motion.div 
                  key={`captured-${i}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative group"
                >
                  <img 
                    src={img} 
                    className="w-16 h-20 object-cover rounded-xl border border-white/20 shadow-2xl transition-transform group-hover:scale-110" 
                    alt={`Capture ${i + 1}`}
                  />
                  <button 
                    onClick={() => setCapturedImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-black"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1.5 py-0.5 text-[8px] font-bold text-white">
                    #{i + 1}
                  </div>
                </motion.div>
              ))}
              
              {capturedImages.length > 0 && (
                <motion.button 
                  onClick={() => setCapturedImages([])}
                  className="w-16 h-20 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2 group hover:bg-white/10 active:scale-95 transition-all mb-0.5"
                >
                   <RotateCcw className="w-5 h-5 text-white/40 group-hover:text-white" />
                   <span className="text-[7px] font-black text-white/40 group-hover:text-white uppercase">Reset</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer: Intelligent Control Surface */}
      <footer className="absolute bottom-0 w-full pb-14 pt-32 bg-gradient-to-t from-black via-black/80 to-transparent z-40">
        <div className="max-w-md mx-auto px-6 flex flex-col items-center gap-6">
          
          {/* Zoom Slider */}
          <div className="w-full flex items-center gap-4 px-8 mb-4">
            <span className="text-[10px] font-bold text-white/40">1x</span>
            <input 
              type="range" 
              min="1" 
              max="5" 
              step="0.1" 
              value={zoom}
              onChange={(e) => handleZoom(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-ai-blue"
            />
            <span className="text-[10px] font-bold text-white/40">5x</span>
          </div>

          {/* Mode Navigation Surface - Floating Hub */}
          <div className="flex justify-center w-full">
            <div className="px-1.5 py-1.5 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-full flex items-center gap-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              {[
                { id: 'DOCUMENT', label: 'Document', icon: FileText },
                { id: 'ID CARD', label: 'ID', icon: Calendar },
                { id: 'RECEIPT', label: 'Reçu', icon: Tag },
                { id: 'OBJECT', label: 'Traducteur', icon: Sparkles }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeMode === mode.id 
                      ? 'bg-ai-blue text-white shadow-[0_0_20px_rgba(79,124,255,0.4)]' 
                      : 'text-zinc-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                  <span className="inline">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Master Control Hub: Perfectly Centered Grid Layout */}
          <div className="grid grid-cols-3 w-full px-4 items-center">
            {/* Gallery Access (Col 1) */}
            <div className="flex justify-start">
              <div className="w-16 h-16 flex items-center justify-center">
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
                        onScanComplete(reader.result as string, selectedLanguage, undefined);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group active:scale-95 transition-all hover:bg-white/10 hover:border-white/20"
                >
                   <ImageIcon className="w-6 h-6 text-white/30 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Primary Shutter Trigger (Col 2 - CENTER) */}
            <div className="flex justify-center relative">
              <div className="relative group">
                <motion.div 
                  animate={{ 
                    scale: status === ScanStatus.SCANNING ? [1, 1.4, 1] : (isDocumentDetected ? [1, 1.15, 1] : [1, 1.05, 1]),
                    opacity: status === ScanStatus.SCANNING ? 1 : 0.3 
                  }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className={`absolute -inset-10 rounded-full blur-3xl transition-colors ${isDocumentDetected ? 'bg-emerald-500/20' : 'bg-ai-blue/15'}`} 
                />
                
                {/* Captured Count Badge */}
                <AnimatePresence>
                  {capturedImages.length > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-ai-blue text-white text-[12px] font-black flex items-center justify-center border-2 border-black z-40"
                    >
                      {capturedImages.length}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Shutter Capture Shockwave (Visual Ripples) */}
                <AnimatePresence>
                  {ripples.map((ripple) => (
                    <div key={ripple.key} className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                      {/* Shockwave circle 1 - Fast bright white */}
                      <motion.div
                        initial={{ scale: 1, opacity: 0.9 }}
                        animate={{ scale: 2.8, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full border-[3px] border-white"
                      />
                      {/* Shockwave circle 2 - Premium Dynamic AI-Blue */}
                      <motion.div
                        initial={{ scale: 1, opacity: 0.7 }}
                        animate={{ scale: 3.6, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
                        className="absolute inset-0 rounded-full border-[5px] border-ai-blue"
                      />
                      {/* Shockwave circle 3 - Glow emerald green if doc is detected, otherwise blue */}
                      <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 4.4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.0, ease: "easeOut", delay: 0.12 }}
                        className={`absolute inset-0 rounded-full border-2 ${isDocumentDetected ? 'border-emerald-400 font-bold' : 'border-ai-blue font-bold'}`}
                      />
                    </div>
                  ))}
                </AnimatePresence>

                <button 
                  onClick={startScan}
                  disabled={status !== ScanStatus.IDLE}
                  className="relative w-24 h-24 bg-zinc-900 rounded-full border-[6px] border-white/20 p-1 flex items-center justify-center active:scale-95 transition-all shadow-2xl z-30"
                >
                  <div className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${isDocumentDetected ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.4)]'}`}>
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${isDocumentDetected ? 'border-white text-white' : 'border-black text-black'}`}>
                        {status === ScanStatus.SCANNING ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Lens Switch / Finalize (Col 3) */}
            <div className="flex justify-end">
              {capturedImages.length > 0 ? (
                <button 
                  onClick={finalizeScan}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-16 h-16 rounded-3xl bg-ai-blue text-white flex items-center justify-center active:scale-90 transition-all shadow-[0_0_20px_rgba(79,124,255,0.4)] border border-white/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <span className="text-[9px] font-black text-ai-blue uppercase tracking-widest">TERMINER</span>
                </button>
              ) : (
                <button 
                  onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 active:bg-ai-blue/20 transition-all hover:bg-white/10 hover:border-white/20">
                    <RefreshCw className={`w-6 h-6 transition-all duration-700 ${facingMode === 'user' ? 'rotate-180 text-ai-blue' : 'group-hover:rotate-180'}`} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${facingMode === 'user' ? 'text-ai-blue' : 'text-white/40'}`}>
                      {facingMode === 'user' ? 'Frontal' : 'Arrière'}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>


      {/* ID Card Helper Overlay */}
      <AnimatePresence>
        {activeMode === 'ID CARD' && status === ScanStatus.IDLE && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-8"
          >
            <div className="w-full max-w-sm aspect-[1.6/1] border-2 border-dashed border-ai-blue/50 rounded-3xl relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-ai-blue/20 backdrop-blur-md px-4 py-2 rounded-full border border-ai-blue/30 text-ai-blue text-[10px] font-black uppercase tracking-widest">
                Prêt pour Scan Officiel
              </div>
              
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-ai-blue rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-ai-blue rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-ai-blue rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-ai-blue rounded-br-lg" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Badge */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-4 py-1.5 rounded-full">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Capture Chiffrée 256-bit</span>
      </div>

      {/* Capture Settings Modal */}
      <AnimatePresence>
        {showCaptureSettings && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCaptureSettings(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-[#0A0A0B]/95 backdrop-blur-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(79,124,255,0.15)] space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-ai-blue uppercase tracking-[0.3em] leading-none text-left">Moteur Algorithmique</p>
                  <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-ai-blue" />
                    <span>Paramètres de Capture</span>
                  </h3>
                </div>
                <button 
                  onClick={() => setShowCaptureSettings(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main settings options */}
              <div className="space-y-5 text-left">
                {/* Auto Assign Toggle */}
                <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold text-white leading-snug">Classement Automatique par l'IA</p>
                    <p className="text-xs text-zinc-500 font-medium">
                      Assigne automatiquement un dossier cible à chaque document détecté par l'IA selon son type.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      const value = !autoAssign;
                      setAutoAssign(value);
                      localStorage.setItem('zenScanAutoAssignFolder', String(value));
                    }}
                    className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${autoAssign ? 'bg-ai-blue' : 'bg-zinc-805 bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoAssign ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {autoAssign && (
                  <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Règles d'Assignation IA</p>
                      <p className="text-[10px] text-zinc-600 font-medium ml-1">Mappe les types de documents détectés vers vos dossiers spécifiques :</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: 'Factures & Reçus (Finance)', typeKey: 'Factures' },
                        { label: 'Contrats & Job (Professionnel)', typeKey: 'Contrats' },
                        { label: 'Documents d\'Identité', typeKey: 'Identité' },
                        { label: 'Personnel & Autre', typeKey: 'Personnel' },
                      ].map((rule) => (
                        <div key={rule.typeKey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                          <span className="text-xs font-bold text-zinc-300">{rule.label}</span>
                          
                          <select
                            value={mapping[rule.typeKey] || ''}
                            onChange={(e) => {
                              const newMapping = { ...mapping, [rule.typeKey]: e.target.value };
                              setMapping(newMapping);
                              localStorage.setItem('zenScanAutoAssignMapping', JSON.stringify(newMapping));
                            }}
                            className="bg-primary-950/80 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold focus:border-ai-blue focus:ring-1 focus:ring-ai-blue/20 outline-none max-w-full sm:w-48 cursor-pointer"
                          >
                            <option value="">📁 Aucun dossier (À classer)</option>
                            {availableFolders.map((folder) => (
                              <option key={folder.id} value={folder.id}>
                                📁 {folder.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-loose mt-4 text-center">
                      🤖 Les algorithmes de ZenScan analysent le contenu textuel et structurel par IA avant d'appliquer ces règles.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-4 border-t border-white/5">
                <button 
                  onClick={() => setShowCaptureSettings(false)}
                  className="px-6 h-12 rounded-xl bg-ai-blue text-white font-black uppercase tracking-widest text-[10px] hover:bg-ai-blue/90 transition-all cursor-pointer shadow-lg active:scale-98"
                >
                  Enregistrer les choix
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
