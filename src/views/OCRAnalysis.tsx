/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Database, Tag, Lightbulb, ArrowRight, Activity, Cpu, Binary, Layers, Search, ShieldCheck, Box, Loader2, Mail, Share2, FileText } from 'lucide-react';
import { AppView, DocumentMetadata } from '../types';
import { GlassCard, AIOrb } from '../components/PremiumComponents';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';

interface OCRAnalysisProps {
  onNavigate: (view: AppView) => void;
  onComplete: () => void;
  onSelectDocument?: (doc: DocumentMetadata) => void;
  scannedImage?: string | null;
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

  return (
    <AnimatePresence>
      {isDiscovered && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-0.5 p-2.5 md:p-3.5 bg-white/[0.02] border border-white/5 rounded-xl md:rounded-2xl group hover:border-ai-blue/40 transition-all cursor-pointer"
          onClick={() => !isEditing && setIsEditing(true)}
        >
          <div className="flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
            <span className="text-[7px] md:text-[8px] font-black tracking-[0.2em]">{item.label}</span>
            <span className="text-[6px] md:text-[7px] font-mono text-ai-blue">Σ_{item.conf}</span>
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

export default function OCRAnalysis({ onNavigate, onComplete, onSelectDocument, scannedImage }: OCRAnalysisProps) {
  // Keep a local copy of the image to prevent it from disappearing during exit animations
  const [localImage, setLocalImage] = useState<string | null>(scannedImage || null);
  
  useEffect(() => {
    if (scannedImage) setLocalImage(scannedImage);
  }, [scannedImage]);

  const [progress, setProgress] = useState(0);
  const [discoveredItems, setDiscoveredItems] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState('Analyse Initialisation');
  const [detectedType, setDetectedType] = useState<string>('ANALYSANTE...');
  const [selectedCategory, setSelectedCategory] = useState<string>('Factures');
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
  
  // Simulated neural feature points
  const featurePoints = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
  }, []);

  const [logs, setLogs] = useState<string[]>(['[CORE] Chargement des poids neuronaux...']);

  useEffect(() => {
    const phases = [
      { p: 15, msg: 'Normalisation de l\'image...' },
      { p: 30, msg: 'Détection du type de document...' },
      { p: 50, msg: 'Extraction des tokens OCR...' },
      { p: 75, msg: 'Analyse sémantique (Transformers)...' },
      { p: 90, msg: 'Validation de l\'intégrité...' },
      { p: 100, msg: 'Données prêtes.' }
    ];

    const typeCycle = ['FACTURE', 'REÇU', 'CONTRAT', 'ID_CARD', 'MATÉRIALISÉ'];
    let typeIdx = 0;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 1.2, 100);
        
        // Update phase message
        const phase = phases.find(ph => next <= ph.p);
        if (phase && phase.msg !== currentPhase) setCurrentPhase(phase.msg);

        // Type Detection flicker at start
        if (next > 10 && next < 30) {
          if (Math.random() > 0.7) {
            setDetectedType(typeCycle[typeIdx % typeCycle.length]);
            typeIdx++;
          }
        } else if (next >= 30) {
          setDetectedType('FACTURE');
        }

        // Technical logs
        if (Math.random() > 0.9 && next < 100) {
          const techLogs = [
            'MATRIX_DOT_PROD_99.2',
            'ISO_DENOISE_FILTER',
            'OCR_ENGINE_CORTEX_A1',
            'VALID_SYNC_STREAM',
            'RELATIONAL_MAPPING_OK'
          ];
          setLogs(prevLogs => [techLogs[Math.floor(Math.random() * techLogs.length)], ...prevLogs].slice(0, 3));
        }

        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 40);

    const timeouts = [
      setTimeout(() => setDiscoveredItems(prev => [...prev, 'type']), 1500),
      setTimeout(() => setDiscoveredItems(prev => [...prev, 'amount']), 3000),
      setTimeout(() => setDiscoveredItems(prev => [...prev, 'date']), 4500),
    ];

    return () => {
      clearInterval(interval);
      timeouts.forEach(t => clearTimeout(t));
    };
  }, []);

  const handleFinalize = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const docId = `doc_${Date.now()}`;
      
      // Use the actual scanned image URL if available
      const imageUrl = scannedImage || undefined;
      const isPdf = !scannedImage && Math.random() > 0.3; // Only mock PDF if no camera image
      const docType = scannedImage ? 'JPG' : (isPdf ? 'PDF' : 'JPG');
      const samplePdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

      const newDoc: DocumentMetadata = {
        id: docId,
        userId: user.uid,
        name: docName || `Scan ${new Date().toLocaleDateString()} (${docType})`,
        type: docType as any,
        category: selectedCategory,
        url: scannedImage ? scannedImage : (isPdf ? samplePdfUrl : undefined),
        size: scannedImage ? `${Math.round(scannedImage.length / 1024)} KB` : '1.2 MB',
        modifiedAt: new Date(),
        tags: ['Scan', detectedType, selectedCategory],
        isAiEnhanced: true,
        contentSnippet: `${semanticData.find(d => d.id === 'type')?.value} - NET_VALUE: ${semanticData.find(d => d.id === 'amount')?.value}`,
        extractedData: {
          type: semanticData.find(d => d.id === 'type')?.value || detectedType,
          amount: semanticData.find(d => d.id === 'amount')?.value || '124,50 €',
          date: semanticData.find(d => d.id === 'date')?.value || '2026-05-09'
        }
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
        
        {/* Category Selector */}
        <div className="flex justify-center mt-6">
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
            { label: 'GRAYSCALE', icon: Layers, p: 20 },
            { label: 'THRESHOLD', icon: Box, p: 40 },
            { label: 'DENOISE', icon: Binary, p: 60 },
            { label: 'VECTORIZE', icon: Activity, p: 80 }
          ].map((layer) => (
            <div key={layer.label} className={`p-4 rounded-2xl glass-card flex flex-col items-center justify-center gap-2 border transition-all duration-500 ${progress >= layer.p ? 'border-ai-blue/30 bg-ai-blue/5' : 'border-white/5 opacity-40'}`}>
              <layer.icon className={`w-5 h-5 ${progress >= layer.p ? 'text-ai-blue' : 'text-zinc-500'}`} />
              <span className="text-[7px] font-black tracking-widest text-zinc-500">{layer.label}</span>
              {progress >= layer.p && <div className="w-1 h-1 rounded-full bg-ai-blue animate-pulse" />}
            </div>
          ))}
        </div>

        {/* Core Scanner Viewport */}
        <div className="md:col-span-9 relative flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 w-full max-w-[260px] h-[260px] sm:h-[320px] md:max-w-[280px] md:h-[460px] bg-black/40 border border-white/10 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-md"
          >
            <div className="absolute inset-0 z-0 overflow-hidden">
              <AnimatePresence mode="wait">
                {localImage ? (
                  <motion.img 
                    key="scanned-image"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={localImage} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Image loading error");
                      // Use a neutral document placeholder instead of random unsplash if truly fails
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

            {/* Document Recognition Box */}
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
                        const subject = encodeURIComponent(`Document ZenScan: ${docName}`);
                        const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint le document "${docName}" scanné avec ZenScan.\n\nLien: ${window.location.href}`);
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
                          {detectedType}
                        </motion.h4>
                    </div>
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

      {/* Control & Progress Hub */}
      <div className="space-y-3">
        {saveError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black text-center uppercase tracking-widest"
          >
            {saveError}
          </motion.div>
        )}
        <div className="flex justify-between items-end px-1">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-1.5 md:gap-2">
               <Cpu className="w-3.5 h-3.5 md:w-4 h-4 text-ai-blue" />
               <p className="text-[9px] md:text-[11px] font-black uppercase text-white tracking-[0.1em]">{currentPhase}</p>
            </div>
            <div className="flex gap-2">
              {logs.map((log, i) => (
                <span key={i} className={`text-[7px] md:text-[8px] font-black uppercase opacity-${30 - i * 10} transition-opacity text-zinc-500`}>&gt; {log}</span>
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
                  <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-2 py-1 md:px-3 md:py-1.5 bg-ai-blue/10 border border-ai-blue/20 text-ai-blue text-[7px] md:text-[9px] font-black uppercase rounded-lg md:rounded-xl tracking-tighter">#Digital_Archive</motion.span>
                )}
                {discoveredItems.length > 1 && (
                  <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-2 py-1 md:px-3 md:py-1.5 bg-white/5 border border-white/10 text-zinc-500 text-[7px] md:text-[9px] font-black uppercase rounded-lg md:rounded-xl tracking-tighter">#Automobile</motion.span>
                )}
                {discoveredItems.length >= 3 && (
                  <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-2 py-1 md:px-3 md:py-1.5 bg-white/5 border border-white/10 text-zinc-500 text-[7px] md:text-[9px] font-black uppercase rounded-lg md:rounded-xl tracking-tighter">#Pro_Services</motion.span>
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


