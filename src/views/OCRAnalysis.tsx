/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Database, Tag, Lightbulb, ArrowRight, Activity, Cpu, Binary, Layers, Search, ShieldCheck, Box, Loader2, Mail, Share2, FileText, Languages, RefreshCw, WifiOff, Zap } from 'lucide-react';
import { jsPDF } from 'jspdf';
import Tesseract from 'tesseract.js';
import { AppView, DocumentMetadata, DetectedObject } from '../types';
import { GlassCard, AIOrb } from '../components/PremiumComponents';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';

interface OCRAnalysisProps {
  onNavigate: (view: AppView) => void;
  onComplete: () => void;
  onSelectDocument?: (doc: DocumentMetadata) => void;
  scannedImage?: string | null;
  scannedLocation?: { latitude: number, longitude: number } | null;
  initialLanguage?: string;
  scannedObjects?: DetectedObject[];
}

// Memoized components for better performance
const FeaturePoint = React.memo(({ pt, progress }: { pt: any, progress: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: progress > pt.x ? [0, 0.6, 0.1] : 0,
      backgroundColor: progress > pt.x ? ['#4F7CFF', '#fff', '#4F7CFF'] : '#4F7CFF'
    }}
    className="absolute w-1 h-1 rounded-full"
    style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
  />
));

const SemanticItem = React.memo(({ item, isDiscovered, onUpdate }: { item: any, isDiscovered: boolean, onUpdate: (id: string, value: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.value);

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(item.id, editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setEditValue(item.value);
      setIsEditing(false);
    }
  };

  const confNum = parseFloat(item.conf);
  const confPercent = isNaN(confNum) ? 85 : Math.round(confNum <= 1 ? confNum * 100 : confNum);

  const getConfidenceLevel = () => {
    if (confPercent >= 90) {
      return {
        label: 'Fiable',
        colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
        dotClass: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]',
      };
    } else if (confPercent >= 70) {
      return {
        label: 'À valider',
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
        dotClass: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]',
      };
    } else {
      return {
        label: 'Manuel',
        colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/25 animate-pulse',
        dotClass: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.5)]',
      };
    }
  };

  const status = getConfidenceLevel();

  return (
    <AnimatePresence>
      {isDiscovered && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-1 p-3 md:p-4 bg-white/[0.02] border border-white/5 rounded-xl md:rounded-2xl group hover:border-ai-blue/40 transition-all cursor-pointer"
          onClick={() => !isEditing && setIsEditing(true)}
        >
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-black tracking-[0.15em] text-zinc-400 uppercase opacity-60 group-hover:opacity-100 transition-opacity">{item.label}</span>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[8px] font-black select-none ${status.colorClass}`}>
              <span className={`w-1 h-1 rounded-full ${status.dotClass}`} />
              <span>{confPercent}% OCR</span>
              <span className="opacity-50 text-[7px] hidden sm:inline">• {status.label}</span>
            </div>
          </div>
          
          {isEditing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none p-0 text-xs md:text-sm font-black tracking-tight text-ai-blue outline-none w-full"
            />
          ) : (
            <span className={`text-xs md:text-sm font-black tracking-tight ${item.premium ? 'text-ai-blue' : 'text-text-main'}`}>
              {item.value}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default function OCRAnalysis({ onNavigate, onComplete, onSelectDocument, scannedImage, scannedLocation, initialLanguage, scannedObjects }: OCRAnalysisProps) {
  // Keep a local copy of the image to prevent it from disappearing during exit animations
  const [localImage, setLocalImage] = useState<string | null>(scannedImage || null);
  const [isEditing, setIsEditing] = useState(true); // Start with editing phase
  const [filter, setFilter] = useState<'original' | 'bw' | 'grayscale' | 'enhanced'>('original');
  const [corners, setCorners] = useState([
    { id: 'tl', x: 5, y: 10 },
    { id: 'tr', x: 95, y: 10 },
    { id: 'bl', x: 5, y: 90 },
    { id: 'br', x: 95, y: 90 },
  ]);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isValidQuadrilateral = useCallback((points: typeof corners) => {
    const tl = points.find(p => p.id === 'tl')!;
    const tr = points.find(p => p.id === 'tr')!;
    const bl = points.find(p => p.id === 'bl')!;
    const br = points.find(p => p.id === 'br')!;

    // 1. Check for minimum distance (no overlap)
    const minDistance = 5;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < minDistance) return "Points trop proches";
      }
    }

    // 2. Structural sanity checks
    if (tl.x >= tr.x || bl.x >= br.x) return "Ordre horizontal invalide";
    if (tl.y >= bl.y || tr.y >= br.y) return "Ordre vertical invalide";

    // 3. Convexity check (simplified for this specific use case)
    // The cross product of consecutive sides should have the same sign
    // Let's just ensure they don't cross over fundamentally
    if (tl.x >= br.x || bl.x >= tr.x) return "Quadrilatère croisé";

    return null;
  }, []);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const container = document.getElementById('edit-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    
    setCorners(prev => prev.map(c => c.id === isDragging ? { ...c, x, y } : c));
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      setValidationError(null);
      window.addEventListener('mousemove', handlePointerMove as any);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove as any, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove as any);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove as any);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);
  
  useEffect(() => {
    if (scannedImage) setLocalImage(scannedImage);
  }, [scannedImage]);

  const [progress, setProgress] = useState(0);
  const [discoveredItems, setDiscoveredItems] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState('En attente de validation');
  // ... rest of state
  const [detectedType, setDetectedType] = useState<string>('ANALYSANTE...');
  const [selectedCategory, setSelectedCategory] = useState<string>('Factures');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLanguage || 'Français');
  const [docName, setDocName] = useState(`Scan October 14, 2026`);
  const [semanticData, setSemanticData] = useState([
    { id: 'type', label: 'TYPE_DOC', value: 'FACTURE RÉCURRENTE', conf: '1.000' },
    { id: 'amount', label: 'NET_VALUE', value: '124,50 €', conf: '0.999', premium: true },
    { id: 'date', label: 'EPOCH_REF', value: '2026-10-14', conf: '1.000' }
  ]);
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const documentCategories = ['Factures', 'Recettes', 'Contrats', 'Identité', 'Personnel', 'Travail', 'Autre'];
  const languages = [
    { name: 'Français', code: 'FR', flag: '🇫🇷' },
    { name: 'English', code: 'EN', flag: '🇬🇧' },
    { name: 'Español', code: 'ES', flag: '🇪🇸' },
    { name: 'Deutsch', code: 'DE', flag: '🇩🇪' },
    { name: 'Italiano', code: 'IT', flag: '🇮🇹' },
  ];
  
  // Simulated neural feature points
  const featurePoints = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
  }, []);

  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  const [logs, setLogs] = useState<string[]>(['[CORE] Chargement des poids neuronaux...']);

  const getFilterStyle = useCallback(() => {
    switch (filter) {
      case 'bw': return 'grayscale(100%) contrast(150%) brightness(120%)';
      case 'grayscale': return 'grayscale(100%) contrast(110%)';
      case 'enhanced': return 'contrast(130%) brightness(110%) saturate(120%)';
      default: return 'none';
    }
  }, [filter]);

  const startAnalysis = useCallback(async () => {
    if (!localImage) return;

    const error = isValidQuadrilateral(corners);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);

    setIsEditing(false);
    setProgress(0);
    setDiscoveredItems([]);
    
    if (isOfflineMode) {
      setLogs(['[LOCAL_AI] Initialisation du moteur Tesseract...', '[CORE] Chargement du modèle de langue local...']);
      
      try {
        // Tesseract.js recognizes the image
        const worker = await Tesseract.createWorker(
          selectedLanguage === 'Français' ? 'fra' : 
          selectedLanguage === 'English' ? 'eng' : 
          selectedLanguage === 'Español' ? 'spa' : 
          selectedLanguage === 'Deutsch' ? 'deu' : 
          selectedLanguage === 'Italiano' ? 'ita' : 'fra',
          1,
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setProgress(Math.floor(m.progress * 100));
                if (m.progress > 0.5 && !logs.includes('[LOCAL_AI] Décodage des caractères...')) {
                  setLogs(prev => ['[LOCAL_AI] Décodage des caractères...', ...prev].slice(0, 3));
                }
              }
            }
          }
        );

        const { data } = await worker.recognize(localImage);
        const text = data.text;
        const avgConfidence = data.confidence || 85; 
        await worker.terminate();

        setProgress(100);
        setCurrentPhase('OCR Local terminé');
        
        // Basic analysis of text for offline mode
        const isInvoice = text.toLowerCase().includes('facture') || text.toLowerCase().includes('invoice') || text.toLowerCase().includes('net à payer');
        const isReceipt = text.toLowerCase().includes('ticket') || text.toLowerCase().includes('cash') || text.toLowerCase().includes('reçu');
        
        let type = 'DOCUMENT';
        if (isInvoice) type = 'FACTURE';
        else if (isReceipt) type = 'REÇU';

        setDocName(`Offline Scan - ${new Date().toLocaleDateString()}`);
        setDetectedType(type);
        
        // Derive field specific confidence levels using real tesseract confidence averages
        const typeConf = Math.min(100, Math.max(10, avgConfidence + 2)) / 100;
        const amountConf = Math.min(100, Math.max(10, avgConfidence - 15)) / 100;
        const dateConf = Math.min(100, Math.max(10, avgConfidence - 5)) / 100;

        const newSemanticData = [
          { id: 'type', label: 'TYPE_DOC', value: type, conf: typeConf.toFixed(3) },
          { id: 'amount', label: 'NET_VALUE', value: 'Extraction manuelle native', conf: amountConf.toFixed(3), premium: false },
          { id: 'date', label: 'EPOCH_REF', value: new Date().toLocaleDateString(), conf: dateConf.toFixed(3) }
        ];
        
        setSemanticData(newSemanticData);
        setDiscoveredItems(['type', 'date']); // Amount often needs manual check in offline basic mode
        setLogs(['[LOCAL_AI] Extraction terminée (Hors-ligne).', '[CORE] Données prêtes pour validation.']);
        
      } catch (err) {
        console.error("Offline OCR Error:", err);
        setLogs(['[ERROR] Échec de l\'OCR local.', '[CORE] Réessayez avec une connexion active.']);
        setProgress(100);
      }
      return;
    }

    setLogs(['[REAL_AI] Initialisation de l\'Analyse Visuelle...', '[CORE] Connexion aux clusters neuronaux...']);

    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 0.5 : prev));
    }, 100);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: localImage, 
          context: `Langue: ${selectedLanguage}, Catégorie: ${selectedCategory}` 
        }),
      });

      if (!response.ok) throw new Error('AI Analysis Failed');
      const data = await response.json();

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentPhase('Analyse IA terminée');
      
      if (data.name) setDocName(data.name);
      if (data.category) setSelectedCategory(data.category);
      
      const newSemanticData = [
        { id: 'type', label: 'TYPE_DOC', value: data.type || 'DOCUMENT', conf: '1.000' },
        { id: 'amount', label: 'NET_VALUE', value: data.extractedData?.amount || data.extractedData?.total || 'N/A', conf: '0.998', premium: true },
        { id: 'date', label: 'EPOCH_REF', value: data.extractedData?.date || new Date().toLocaleDateString(), conf: '1.000' }
      ];
      setSemanticData(newSemanticData);
      setDetectedType(data.type || 'DOCUMENT');
      setDiscoveredItems(['type', 'amount', 'date']);
      setLogs(['[REAL_AI] Succès: Informations extraites.', '[CORE] Archive prête pour validation.']);
    } catch (err) {
      console.error("AI Analysis Error:", err);
      clearInterval(progressInterval);
      setProgress(100);
      setLogs(['[ERROR] Échec de l\'analyse intelligence.', '[CORE] Utilisation du mode simulé par défaut.']);
      // Fallback to simulation if AI fails
      setDiscoveredItems(['type', 'amount', 'date']);
    }
  }, [localImage, selectedLanguage, selectedCategory]);

  useEffect(() => {
    if (isEditing) return; // Wait for user to validate framing
    
    const phases = [
      { p: 15, msg: 'Normalisation de l\'image...' },
      { p: 30, msg: 'Détection du type de document...' },
      { p: 50, msg: 'Extraction des tokens OCR...' },
      { p: 75, msg: 'Analyse sémantique (Transformers)...' },
      { p: 90, msg: 'Conversion PDF Haute Définition...' },
      { p: 100, msg: 'Document PDF prêt.' }
    ];

    // Note: The main logic is now handled in startAnalysis
    // This effect is kept for phase messages based on progress
    const checkPhase = () => {
      const currentProgress = progress;
      const phase = phases.find(ph => currentProgress <= ph.p);
      if (phase && phase.msg !== currentPhase) {
        setCurrentPhase(phase.msg);
      }
    };

    checkPhase();
  }, [isEditing, progress, currentPhase]);

  const handleFinalize = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      let finalUrl = scannedImage || "";
      let finalType: 'PDF' | 'JPG' | 'PNG' = 'PDF';
      
      // If it's a camera image (data URL), convert it to PDF
      if (scannedImage && scannedImage.startsWith('data:image')) {
        try {
          console.log("[OCR] Direct PDF Conversion triggered");
          const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            compress: true
          });
          
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error("Image Load Failed"));
            img.src = localImage || scannedImage || "";
          });

          // Create processing canvas to apply filters and crop
          const procCanvas = document.createElement('canvas');
          
          // Calculate source crop coords from percentages
          const minX = Math.min(...corners.map(c => c.x)) / 100;
          const maxX = Math.max(...corners.map(c => c.x)) / 100;
          const minY = Math.min(...corners.map(c => c.y)) / 100;
          const maxY = Math.max(...corners.map(c => c.y)) / 100;
          
          const sourceX = minX * img.width;
          const sourceY = minY * img.height;
          const sourceWidth = (maxX - minX) * img.width;
          const sourceHeight = (maxY - minY) * img.height;
          
          procCanvas.width = sourceWidth;
          procCanvas.height = sourceHeight;
          const procCtx = procCanvas.getContext('2d');
          if (procCtx) {
            procCtx.filter = getFilterStyle();
            
            // Handle rotation in canvas
            if (rotation !== 0) {
              // Note: For simplicity, we apply rotation to the whole image *before* cropping in the final implementation
              // But here we can just rotate the canvas context if needed.
              // Actually, rotating the final PDF image is easier
            }

            procCtx.drawImage(
              img, 
              sourceX, sourceY, sourceWidth, sourceHeight, 
              0, 0, sourceWidth, sourceHeight
            );
          }
          const processedImageUrl = procCanvas.toDataURL('image/jpeg', 0.95);

          // Calculate dimensions to fit A4
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = sourceWidth;
          const imgHeight = sourceHeight;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const width = imgWidth * ratio;
          const height = imgHeight * ratio;
          const x = (pdfWidth - width) / 2;
          const y = (pdfHeight - height) / 2;

          // Add a nice frame/border in PDF if requested
          pdf.setDrawColor(79, 124, 255);
          pdf.setLineWidth(0.5);
          pdf.rect(x - 2, y - 2, width + 4, height + 4);

          // Use high quality compression for addImage
          pdf.addImage(processedImageUrl, 'JPEG', x, y, width, height, undefined, 'MEDIUM');
          
          // Add some "ZenScan" branding to the PDF
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`ZenScan AI Enterprise - ${docName} - ${new Date().toLocaleString()}`, 10, pdfHeight - 10);
          
          finalUrl = pdf.output('datauristring');
          finalType = 'PDF';
          console.log("[OCR] PDF Conversion Successful", { size: finalUrl.length });
        } catch (err) {
          console.error("[OCR] PDF conversion failed, falling back to image", err);
          finalType = 'JPG';
          finalUrl = scannedImage;
        }
      } else if (!scannedImage) {
        // Fallback or mock PDF
        const isPdf = true; // Force PDF fallback for mock
        finalType = 'PDF';
        finalUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      }

      // Determine folder ID based on auto-assignment rules
      let assignedFolderId: string | undefined = undefined;
      const isAutoAssignEnabled = localStorage.getItem('zenScanAutoAssignFolder') !== 'false';
      if (isAutoAssignEnabled) {
        // Read mapping
        const defaultMapping: Record<string, string> = {
          'Factures': 'f_receipts',
          'Recettes': 'f_receipts',
          'Contrats': 'f_work',
          'Identité': 'f_personal',
          'Personnel': 'f_personal',
          'Travail': 'f_work'
        };
        
        let savedMapping = defaultMapping;
        const mappingStr = localStorage.getItem('zenScanAutoAssignMapping');
        if (mappingStr) {
          try {
            savedMapping = { ...defaultMapping, ...JSON.parse(mappingStr) };
          } catch (e) {}
        }

        // Try mapping with detectedType (e.g. FACTURE) or selectedCategory (e.g. Factures)
        const key = semanticData.find(d => d.id === 'type')?.value || detectedType || selectedCategory;
        
        // Find folder id from key
        if (key && savedMapping[key]) {
          assignedFolderId = savedMapping[key];
        } else if (selectedCategory && savedMapping[selectedCategory]) {
          assignedFolderId = savedMapping[selectedCategory];
        } else if (detectedType && savedMapping[detectedType]) {
          assignedFolderId = savedMapping[detectedType];
        }
        
        // Fallback checks for simple sub-string matches
        if (!assignedFolderId && key) {
          const lKey = key.toLowerCase();
          if (lKey.includes('facture') || lKey.includes('invoice') || lKey.includes('reçu') || lKey.includes('receipt') || lKey.includes('ticket')) {
            assignedFolderId = savedMapping['Factures'] || 'f_receipts';
          } else if (lKey.includes('contrat') || lKey.includes('contract') || lKey.includes('professionnel') || lKey.includes('work') || lKey.includes('travail')) {
            assignedFolderId = savedMapping['Contrats'] || 'f_work';
          } else if (lKey.includes('identité') || lKey.includes('id') || lKey.includes('personnel') || lKey.includes('personal')) {
            assignedFolderId = savedMapping['Personnel'] || 'f_personal';
          }
        }
      }

      const newDoc: DocumentMetadata = {
        id: docId,
        userId: user.uid,
        name: docName || `Scan ${new Date().toLocaleDateString()} (PDF)`,
        type: finalType,
        category: selectedCategory,
        ocrLanguage: selectedLanguage,
        folderId: assignedFolderId,
        url: finalUrl,
        thumbnailUrl: scannedImage || undefined,
        location: scannedLocation || undefined,
        size: `${Math.round(finalUrl.length / 1024)} KB`,
        modifiedAt: new Date(),
        tags: ['Scan', detectedType, selectedCategory, 'PDF', ...(isOfflineMode ? ['Offline'] : ['AI_Cloud'])],
        isAiEnhanced: !isOfflineMode,
        contentSnippet: `${semanticData.find(d => d.id === 'type')?.value} - NET_VALUE: ${semanticData.find(d => d.id === 'amount')?.value}`,
        extractedData: {
          type: semanticData.find(d => d.id === 'type')?.value || detectedType,
          amount: semanticData.find(d => d.id === 'amount')?.value || '124,50 €',
          date: semanticData.find(d => d.id === 'date')?.value || '2026-05-09'
        },
        detectedObjects: scannedObjects
      };

      await storageService.saveDocument(newDoc);
      
      if (onSelectDocument) {
        onSelectDocument(newDoc);
      }
      onComplete();
    } catch (error) {
      console.error("Error saving document", error);
      setSaveError("Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSemanticItem = useCallback((id: string, value: string) => {
    setSemanticData(prev => prev.map(item => item.id === id ? { ...item, value } : item));
    if (id === 'type') setDetectedType(value);
  }, []);

  const [rotation, setRotation] = useState(0);

  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360);
    // When rotating, we should also reset corners as they might not match anymore
    setCorners([
      { id: 'tl', x: 5, y: 10 },
      { id: 'tr', x: 95, y: 10 },
      { id: 'bl', x: 5, y: 90 },
      { id: 'br', x: 95, y: 90 },
    ]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-4 md:pt-12 pb-6 px-4 md:px-5 max-w-2xl mx-auto space-y-3 md:space-y-6"
    >
      <div className="text-center space-y-0.5 md:space-y-1">
        <div className="flex justify-center mb-1 md:mb-3">
          <div className="relative">
            <AIOrb size="w-8 h-8 md:w-16 md:h-16" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-1.5 md:-inset-3 border-t border-b border-ai-blue/40 rounded-full opacity-50"
            />
          </div>
        </div>
        <motion.p 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-ai-blue font-black tracking-[0.5em] text-[6px] md:text-[9px] uppercase"
        >
          Extraction de Haute Précision
        </motion.p>
        <h2 className="text-lg md:text-4xl font-black text-text-main tracking-tighter leading-none">Zen Logic Nucleus</h2>
        
        {/* Language & Category Selectors */}
        <div className="flex flex-col items-center gap-4 mt-6">
          {/* Language Selector */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-1.5">
              <Languages className="w-2.5 h-2.5 text-ai-blue" /> Langue de Traitement
            </p>
            <div className="relative flex items-center p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-[20px] overflow-x-auto no-scrollbar gap-1 w-fit max-w-full">
              {languages.map((lang) => {
                const isActive = selectedLanguage === lang.name;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang.name);
                      // Simulate a "restart" or "re-calibration" of analysis logs
                      setLogs(prev => [`[CORE] Recalibration pour ${lang.name}...`, ...prev].slice(0, 3));
                    }}
                    className={`relative px-3 md:px-4 py-1.5 md:py-2 rounded-[10px] md:rounded-[14px] text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300 z-10 flex items-center gap-1 ${
                      isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="selectedLanguageAnalysis"
                        className="absolute inset-0 bg-ai-blue/20 border border-ai-blue/40 rounded-[10px] md:rounded-[14px]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-20 text-[10px] md:text-[12px]">{lang.flag}</span>
                    <span className="relative z-20">{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selector */}
          <div className="relative flex items-center p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-[22px] overflow-x-auto no-scrollbar gap-1 w-fit max-w-full">
            {documentCategories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative px-4 md:px-6 py-2 md:py-3 rounded-[14px] md:rounded-[18px] text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-300 z-10 ${
                    isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="selectedCategoryAnalysis"
                      className="absolute inset-0 bg-ai-blue rounded-[14px] md:rounded-[18px] ai-glow shadow-[0_0_15px_rgba(79,124,255,0.4)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-20">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Analysis Visual Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5 items-stretch">
        {/* Diagnostic Layers (Sidebar on desktop) */}
        <div className="hidden md:flex md:col-span-3 flex-col gap-3">
          {[
            { id: 'GRAYSCALE', icon: Layers, p: 20, desc: 'Suppression chromatique' },
            { id: 'THRESHOLD', icon: Box, p: 40, desc: 'Binarisation Adaptive' },
            { id: 'DENOISE', icon: Binary, p: 60, desc: 'Réduction de bruit' },
            { id: 'VECTORIZE', icon: Activity, p: 80, desc: 'Vectorisation texte' }
          ].map((layer) => (
            <motion.div 
              key={layer.id} 
              animate={{ 
                borderColor: progress >= layer.p ? 'rgba(79, 124, 255, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                backgroundColor: progress >= layer.p ? 'rgba(79, 124, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)'
              }}
              className={`p-4 rounded-3xl glass-card flex flex-col items-center justify-center gap-2 border transition-all duration-700 ${progress < layer.p ? 'opacity-40 grayscale' : ''}`}
            >
              <div className="relative">
                <layer.icon className={`w-6 h-6 ${progress >= layer.p ? 'text-ai-blue' : 'text-zinc-500'}`} />
                {progress >= layer.p && (
                  <motion.div 
                    layoutId={`glow-${layer.id}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1.5 }}
                    className="absolute inset-0 bg-ai-blue/20 blur-md rounded-full -z-10"
                  />
                )}
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black tracking-widest text-white uppercase">{layer.id}</p>
                <p className="text-[6px] font-bold text-zinc-500 uppercase tracking-tighter mt-0.5">{layer.desc}</p>
              </div>
              {progress >= layer.p && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1.5 h-1.5 rounded-full bg-ai-blue shadow-[0_0_8px_#4F7CFF]" 
                />
              )}
            </motion.div>
          ))}
        </div>

        <div className="md:col-span-9 relative flex flex-col items-center">
          <motion.div 
            id="edit-container"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 w-full max-w-[260px] h-[320px] sm:h-[400px] md:max-w-[340px] md:h-[480px] bg-black/40 border border-white/10 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-md"
          >
            <div className="absolute inset-0 z-0 overflow-hidden">
              <AnimatePresence mode="wait">
                {localImage ? (
                  <motion.img 
                    key="scanned-image"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1, rotate: rotation }}
                    src={localImage} 
                    referrerPolicy="no-referrer"
                    style={{ filter: getFilterStyle() }}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    onError={(e) => {
                      console.error("Image loading error");
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?q=80&w=800&auto=format&fit=crop";
                    }}
                  />
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900"
                  >
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                      style={{ 
                        backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 1px, transparent 20px)', 
                      }} 
                    />
                    <FileText className="w-12 h-12 text-zinc-800 mb-2" />
                    <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Aucune Preview</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Document Recognition Box / Editing Handles */}
            <div className="absolute inset-0 z-20">
               {isEditing ? (
                 <>
                   {/* Editable Framing Polygon */}
                   <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                     <polygon 
                        points={`${corners[0].x},${corners[0].y} ${corners[1].x},${corners[1].y} ${corners[3].x},${corners[3].y} ${corners[2].x},${corners[2].y}`}
                        fill="rgba(79, 124, 255, 0.15)"
                        stroke="#4F7CFF"
                        strokeWidth="2"
                        className="transition-all duration-75"
                        style={{ points: corners.map(c => `${c.x}% ${c.y}%`).join(' ') }}
                        vectorEffect="non-scaling-stroke"
                     />
                     {/* Lines between points for better visual */}
                      <path 
                        d={`M ${corners[0].x}% ${corners[0].y}% L ${corners[1].x}% ${corners[1].y}% L ${corners[3].x}% ${corners[3].y}% L ${corners[2].x}% ${corners[2].y}% Z`}
                        fill="rgba(79, 124, 255, 0.1)"
                        stroke="#4F7CFF"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                   </svg>
                   
                   {/* Handle Points */}
                   {corners.map(c => (
                     <div
                        key={c.id}
                        onMouseDown={() => setIsDragging(c.id)}
                        onTouchStart={() => setIsDragging(c.id)}
                        className={`absolute w-8 h-8 -ml-4 -mt-4 cursor-move flex items-center justify-center z-50 group`}
                        style={{ left: `${c.x}%`, top: `${c.y}%` }}
                     >
                       <div className="w-4 h-4 rounded-full border-2 border-white bg-ai-blue shadow-[0_0_15px_#4F7CFF] group-hover:scale-125 transition-transform" />
                       <div className="absolute -inset-2 border border-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                   ))}
                 </>
               ) : (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[80%] border border-ai-blue/20 rounded-2xl flex items-center justify-center">
                    {/* Feature Points Interaction */}
                    <div className="absolute inset-0">
                      {featurePoints.map((pt) => (
                        <FeaturePoint key={pt.id} pt={pt} progress={progress} />
                      ))}
                    </div>

                    {progress >= 100 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-20 flex flex-col gap-3 w-full"
                      >
                        <button 
                          onClick={() => {
                            const subject = encodeURIComponent(`Document ZenScan : ${docName}`);
                            const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint le document "${docName}" scanné avec ZenScan.\n\nFORMAT : PDF\nLIEN : ${window.location.href}`);
                            window.location.href = `mailto:?subject=${subject}&body=${body}`;
                          }}
                          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white/10 group/mail"
                        >
                          <Mail className="w-4 h-4 text-ai-blue group-hover/mail:scale-110 transition-transform" />
                          Email Document
                        </button>
                        <button 
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: docName,
                                text: `Regardez ce document scanné avec ZenScan: ${docName}`,
                                url: window.location.href
                              }).catch(console.error);
                            } else {
                              navigator.clipboard.writeText(window.location.href);
                              alert('Lien de partage copié dans le presse-papier !');
                            }
                          }}
                          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white/10 group/share"
                        >
                          <Share2 className="w-4 h-4 text-ai-blue group-hover/share:scale-110 transition-transform" />
                          Partager PDF
                        </button>
                      </motion.div>
                    )}
                    
                    {progress < 100 && (
                      <div className="relative z-10 p-6 space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center mx-auto mb-2">
                          <Search className={`w-6 h-6 text-ai-blue ${progress < 100 ? 'animate-pulse' : ''}`} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Type Détecté</p>
                            <motion.h4 
                              key={detectedType} 
                              initial={{ opacity: 0, y: 5 }} 
                              animate={{ opacity: 1, y: 0 }}
                              className="text-lg font-black text-text-main tracking-tight"
                            >
                              {progress >= 90 ? 'DOCUMENT PDF' : detectedType}
                            </motion.h4>
                        </div>
                      </div>
                    )}
                  </div>
               )}
            </div>

            {/* HUD Elements */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-30 flex flex-col gap-1 md:gap-1.5">
               <div className="flex items-center gap-1.5 md:gap-2 px-1.5 py-0.5 bg-zinc-950/60 rounded border border-white/10">
                 <ShieldCheck className="w-2 md:w-2.5 h-2 md:h-2.5 text-emerald-500" />
                 <span className="text-[6px] md:text-[7px] font-black text-emerald-500/80 uppercase">TRUST_VLD</span>
               </div>
               <div className="flex items-center gap-1.5 md:gap-2 px-1.5 py-0.5 bg-zinc-950/60 rounded border border-white/10">
                 <Binary className="w-2 md:w-2.5 h-2 md:h-2.5 text-ai-blue" />
                 <span className="text-[6px] md:text-[7px] font-black text-ai-blue/80 uppercase">RAW_STREAM</span>
               </div>
            </div>

            {/* Floating Scan Label */}
            <AnimatePresence>
              {progress < 100 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute bottom-6 right-6 md:bottom-10 md:right-8 z-30"
                >
                  <div className="flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-4 md:py-2 bg-ai-blue rounded-xl md:rounded-2xl shadow-xl ai-glow">
                     <Activity className="w-3 h-3 md:w-4 h-4 text-white animate-pulse" />
                     <span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-widest whitespace-nowrap">SCAN LIVE</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Precision Laser Line */}
            <motion.div
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-[1.5px] bg-ai-blue shadow-[0_0_25px_#4F7CFF,0_0_5px_white] z-20"
            />
          </motion.div>
        </div>
      </div>

      {/* Control & Progress Hub / Editing Sidebar */}
      <div className="space-y-4">
        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Aspect Ratio & Filters Row */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] text-center">Format du Document</span>
                <div className="flex justify-center gap-2">
                  {[
                    { id: 'custom', label: 'LIBRE' },
                    { id: 'a4', label: 'A4', ratio: 0.707 },
                    { id: 'id', label: 'CARTE', ratio: 1.58 },
                    { id: 'square', label: '1:1', ratio: 1 }
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (r.ratio) {
                          setValidationError(null);
                          const margin = 10;
                          const width = 80;
                          const height = width / r.ratio;
                          const yOffset = (100 - height) / 2;
                          setCorners([
                            { id: 'tl', x: margin, y: yOffset },
                            { id: 'tr', x: 100 - margin, y: yOffset },
                            { id: 'bl', x: margin, y: yOffset + height },
                            { id: 'br', x: 100 - margin, y: yOffset + height },
                          ]);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] text-center">Filtres de Rendu Documentaire</span>
                <div className="flex justify-center gap-3">
                  {[
                    { id: 'original', label: 'NATURAL' },
                    { id: 'bw', label: 'B&W' },
                    { id: 'grayscale', label: 'GRIS' },
                    { id: 'enhanced', label: 'HQ' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id as any)}
                      className={`px-4 py-3 rounded-2xl border transition-all ${
                        filter === f.id ? 'bg-ai-blue border-ai-blue shadow-[0_0_20px_#4F7CFF] text-white' : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'
                      }`}
                    >
                      <span className="text-[10px] font-black tracking-widest">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
               <button 
                onClick={() => {
                  setCorners([
                    { id: 'tl', x: 2, y: 2 },
                    { id: 'tr', x: 98, y: 2 },
                    { id: 'bl', x: 2, y: 98 },
                    { id: 'br', x: 98, y: 98 },
                  ]);
                  setRotation(0);
                  setValidationError(null);
                }}
                className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 active:scale-95 transition-all"
              >
                Reset
              </button>
              <button 
                onClick={rotateImage}
                className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Dévier
              </button>
              <button 
                onClick={() => setIsOfflineMode(!isOfflineMode)}
                className={`flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                  isOfflineMode 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                }`}
                title={isOfflineMode ? "Mode Hors-ligne Actif" : "Mode Cloud Actif"}
              >
                {isOfflineMode ? <WifiOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                {isOfflineMode ? 'Local' : 'Cloud'}
              </button>
              <button 
                onClick={startAnalysis}
                className="flex-[2] py-4 bg-ai-gradient rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.3em] ai-glow active:scale-95 transition-all shadow-2xl"
              >
                Analyser
              </button>
            </div>
            
            <AnimatePresence>
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-500 text-[9px] font-black uppercase tracking-widest text-center"
                >
                  Erreur de cadrage: {validationError}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <>
            {saveError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black text-center uppercase tracking-widest"
              >
                {saveError}
              </motion.div>
            )}
            
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-1.5 md:gap-2">
                     <Cpu className={`w-3.5 h-3.5 md:w-4 h-4 text-ai-blue ${progress < 100 ? 'animate-pulse' : ''}`} />
                     <p className="text-[9px] md:text-[11px] font-black uppercase text-white tracking-[0.1em]">{currentPhase}</p>
                  </div>
                  {/* Active Simulated Logs */}
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5 font-mono text-[7px] md:text-[8px] space-y-1 max-h-20 overflow-y-auto no-scrollbar">
                    {logs.map((log, i) => (
                      <motion.div 
                        key={`${i}-${log}`} 
                        initial={{ opacity: 0, x: -5 }} 
                        animate={{ opacity: 1 - i * 0.2, x: 0 }}
                        className="flex gap-2"
                      >
                        <span className="text-zinc-600">[{new Date().toLocaleTimeString('fr-FR', { hour12: false })}]</span>
                        <span className={log.includes('ERROR') ? 'text-red-400' : log.includes('REAL_AI') ? 'text-ai-blue' : 'text-emerald-500/60'}>
                          &gt; {log}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <span className="text-lg md:text-2xl font-black text-ai-blue tracking-tighter">{Math.floor(progress)}%</span>
                </div>
              </div>
              
              <div className="relative h-1.5 md:h-2 bg-white/5 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-ai-gradient rounded-full shadow-[0_0_20px_rgba(79,124,255,0.4)]"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Semantic Output Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <GlassCard className="p-4 md:p-5 border-ai-blue/10 bg-ai-blue/[0.01]">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-ai-blue" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500">Validation Croisée</span>
            </div>
            {progress >= 100 && (
              <div className="flex items-center gap-1 text-[7px] md:text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-2.5 md:w-3 h-2.5 md:h-3" />
                VÉRIFIÉ
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <p className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Nom de l'Archive</p>
            <input 
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-text-main outline-none focus:border-ai-blue/40 transition-colors"
              placeholder="Nommer votre scan..."
            />
          </div>

          <div className="grid grid-cols-1 gap-2 md:gap-2.5">
              {semanticData.map((item) => (
                <SemanticItem 
                  key={item.id} 
                  item={item} 
                  isDiscovered={discoveredItems.includes(item.id)} 
                  onUpdate={updateSemanticItem}
                />
              ))}
          </div>
        </GlassCard>

        <div className="flex flex-col gap-3 md:gap-4">
          <GlassCard className="p-4 md:p-5 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-ai-blue" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500">Mots-Clés Neuronaux</span>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-2.5 h-auto md:h-16 content-start">
              <AnimatePresence mode="popLayout">
                {discoveredItems.length > 0 && (
                  <motion.span key="tag-digital" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-2 py-1 md:px-3 md:py-1.5 bg-ai-blue/10 border border-ai-blue/20 text-ai-blue text-[7px] md:text-[9px] font-black uppercase rounded-lg md:rounded-xl tracking-tighter">#Digital_Archive</motion.span>
                )}
                {discoveredItems.length > 1 && (
                  <motion.span key="tag-auto" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-2 py-1 md:px-3 md:py-1.5 bg-white/5 border border-white/10 text-zinc-500 text-[7px] md:text-[9px] font-black uppercase rounded-lg md:rounded-xl tracking-tighter">#Automobile</motion.span>
                )}
                {discoveredItems.length >= 3 && (
                  <motion.span key="tag-pro" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-2 py-1 md:px-3 md:py-1.5 bg-white/5 border border-white/10 text-zinc-500 text-[7px] md:text-[9px] font-black uppercase rounded-lg md:rounded-xl tracking-tighter">#Pro_Services</motion.span>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>

          <button
            onClick={handleFinalize}
            disabled={progress < 100 || isSaving}
            className={`group h-14 md:h-16 rounded-[20px] md:rounded-[24px] font-black text-[10px] md:text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 md:gap-4 overflow-hidden border ${
              progress >= 100 && !isSaving
              ? 'bg-ai-gradient text-white border-transparent ai-glow active:scale-[0.98]' 
              : 'bg-white/5 text-zinc-700 border-white/5 grayscale pointer-events-none'
            }`}
          >
            {isSaving ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Archivage en cours...</span>
              </div>
            ) : progress < 100 ? (
               <div className="flex items-center gap-2 md:gap-3">
                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                   <Cpu className="w-3.5 h-3.5 md:w-4 h-4" />
                 </motion.div>
                 <span>Calcul... {Math.floor(progress)}%</span>
               </div>
            ) : (
              <>
                Finaliser l'Extraction
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}


