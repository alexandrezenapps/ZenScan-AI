/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crop, RotateCw, Filter, FileText, Check, Save, 
  Download, MoreHorizontal, PenTool, Sparkles, 
  FileSearch, Languages, X, Plus, Trash2, ChevronLeft, ChevronRight,
  Share2, Mail, Copy, CheckCircle2, FileDown, CloudOff, Cloud, MapPin,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Reorder } from 'motion/react';
import { AppView, DocumentMetadata } from '../types';
import { storageService } from '../services/storageService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentMetadata | null;
  pagesCount: number;
}

function ExportModal({ isOpen, onClose, document, pagesCount }: ExportModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [fileName, setFileName] = React.useState(document?.name || 'ZenScan_Export');
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      if (document?.url && (document.type === 'PDF' || document.url.startsWith('data:application/pdf'))) {
        // If it's already a PDF, download it directly
        const link = window.document.createElement('a');
        link.href = document.url;
        link.download = `${fileName}.pdf`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        // Fallback or generate a summary PDF if requested for other types
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("ZENSCAN DOCUMENT", 20, 20);
        
        if (document?.url) {
          try {
            // If it's an image, we can add it to the PDF
            doc.addImage(document.url, 'JPEG', 20, 40, 170, 220);
          } catch (e) {
            console.warn("Could not add image to PDF", e);
            doc.text("Aperçu de l'image indisponible dans l'export.", 20, 40);
          }
        }

        doc.save(`${fileName}.pdf`);
      }
    } catch (err) {
      console.error('PDF Generation failed', err);
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      const docName = document?.name || 'Document ZenScan';
      const shareText = `Document ZenScan: ${docName}${document?.type ? ` (${document.type})` : ''}${document?.contentSnippet ? `\n\nRésumé IA: "${document.contentSnippet.slice(0, 100)}..."` : ''}`;
      
      try {
        await navigator.share({
          title: docName,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmail = () => {
    const docName = document?.name || "Sans titre";
    const subject = encodeURIComponent(`Document ZenScan : ${docName}`);
    const docLink = window.location.origin + window.location.pathname + (document?.id ? `#doc=${document.id}` : "");
    
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Veuillez trouver ci-joint les informations concernant le document suivant, traité par l'intelligence ZenScan.\n\n` +
      `📌 FICHE ANALYTIQUE\n` +
      `-------------------------------------------\n` +
      `• Nom : ${docName}\n` +
      `• Date : ${document?.createdAt ? new Date(document.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}\n` +
      `• Type : ${document?.type || 'Image'}\n` +
      `• Catégorie : ${document?.category || 'Non classé'}\n` +
      `• Pages : ${pagesCount}\n` +
      `${document?.tags && document.tags.length > 0 ? `• Tags : ${document.tags.join(', ')}\n` : ''}` +
      `${document?.contentSnippet ? `\n🔍 EXTRAIT DE L'EXTRACTION IA :\n"${document.contentSnippet.slice(0, 300)}..."\n` : ''}` +
      `\n🔗 ACCÈS AU DOCUMENT EN LIGNE :\n${docLink}\n\n` +
      `-------------------------------------------\n` +
      `ZenScan AI - Votre Assistant Documentaire Intelligent.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-[#0C0C0E] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
          >
            <div className="p-8 md:p-10 text-center space-y-8">
              <div className="w-20 h-20 bg-ai-blue/10 rounded-3xl mx-auto flex items-center justify-center border border-ai-blue/20">
                <FileDown className="w-10 h-10 text-ai-blue" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-text-main tracking-tight">Exporter le Document</h3>
                <p className="text-zinc-500 text-sm font-medium">Nommez votre fichier et choisissez le format.</p>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nom du fichier</label>
                <input 
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-text-main font-bold outline-none focus:border-ai-blue/50 transition-colors"
                  placeholder="Ex: Facture_Mai_2026"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="w-full h-16 bg-ai-gradient text-accent-text font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 ai-glow active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isGenerating ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <RotateCw className="w-5 h-5" />
                    </motion.div>
                  ) : <FileDown className="w-5 h-5" />}
                  {isGenerating ? 'Génération...' : 'Télécharger PDF'}
                </button>

                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-ai-blue/30 transition-all group"
                  >
                    <Share2 className="w-5 h-5 text-zinc-500 group-hover:text-ai-blue mb-1" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Partager</span>
                  </button>
                  <button 
                    onClick={handleEmail}
                    className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-ai-blue/30 transition-all group"
                  >
                    <Mail className="w-5 h-5 text-zinc-500 group-hover:text-ai-blue mb-1" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Email</span>
                  </button>
                  <button 
                    onClick={handleCopy}
                    className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-ai-blue/30 transition-all group focus:border-ai-blue/50"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5 text-ai-blue mb-1" /> : <Copy className="w-5 h-5 text-zinc-500 group-hover:text-ai-blue mb-1" />}
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">{copied ? 'Copié' : 'Lien'}</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] hover:text-white transition-colors pt-4"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface EditorProps {
  onNavigate: (view: AppView) => void;
  document: DocumentMetadata | null;
}

export default function Editor({ onNavigate, document }: EditorProps) {
  const [docName, setDocName] = useState(document?.name || "Sans titre");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempDocName, setTempDocName] = useState(docName);
  const [activeFilter, setActiveFilter] = useState('Original');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (!document) return;

    // Trigger save status
    if (docName !== document.name || saveStatus === 'SAVING') {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      
      setSaveStatus('SAVING');
      
      autoSaveTimerRef.current = setTimeout(async () => {
        try {
          await storageService.updateDocument(document.id, { 
            name: docName
          });
          document.name = docName;
          setSaveStatus('SAVED');
          // Reset to IDLE after a delay
          setTimeout(() => setSaveStatus('IDLE'), 2000);
        } catch (err) {
          console.error("Auto-save failed:", err);
          setSaveStatus('ERROR');
        }
      }, 1500); // 1.5s debounce
    }

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [docName, document]);

  // Sync temp name if docName changes externally
  useEffect(() => {
    setTempDocName(docName);
  }, [docName]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4F7CFF';

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
    setSigned(false);
  };

  const applySignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setSignatureData(dataUrl);
    setSigned(true);
    setActiveTool(null);
  };

  const [pages, setPages] = useState<{id: string, rotation: number}[]>([
    { id: 'page-1', rotation: 0 },
    { id: 'page-2', rotation: 0 },
    { id: 'page-3', rotation: 0 }
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const handleRenameScan = (newValue: string) => {
    const updatedName = docName.replace(/scan/gi, newValue);
    setDocName(updatedName);
    setTempDocName(updatedName);
  };
  const handleRename = () => {
    const updatedName = tempDocName.trim() || docName;
    setDocName(updatedName);
    setTempDocName(updatedName);
    setIsEditingName(false);
  };

  const filters = [
    { name: 'Original', icon: FileText },
    { name: 'HD Scan', icon: Save },
    { name: 'N&B', icon: Filter },
    { name: 'Contrast+', icon: RotateCw },
  ];

  const addPage = () => {
    const newId = `page-${Date.now()}`;
    setPages(prev => [...prev, { id: newId, rotation: 0 }]);
    setCurrentPageIndex(pages.length);
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1);
    }
  };

  const rotateCurrentPage = () => {
    setPages(prev => prev.map((p, i) => 
      i === currentPageIndex ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  };

  const rotatePageAt = (index: number) => {
    setPages(prev => prev.map((p, i) => 
      i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32 px-5 md:px-6 max-w-7xl mx-auto"
    >
      {/* Editor Toolbar */}
      <div className="sticky top-20 z-40 bg-primary-900/60 backdrop-blur-xl border-b border-white/5 -mx-5 md:-mx-6 px-5 md:px-6 py-3 md:py-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <ToolbarButton icon={ChevronLeft} label="Retour" onClick={() => onNavigate(AppView.LIBRARY)} />
          <div className="h-6 w-px bg-white/10 mx-2" />
          
          {/* Editable Document Name in Toolbar */}
          <div className="flex items-center min-w-0 flex-1 max-w-[200px] md:max-w-md">
            {isEditingName ? (
              <div className="flex items-center gap-1 w-full scale-95 origin-left">
                <input 
                  autoFocus
                  type="text"
                  value={tempDocName}
                  onChange={(e) => setTempDocName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  className="bg-white/10 border border-ai-blue font-bold text-xs md:text-sm text-text-main px-3 py-1.5 rounded-lg outline-none w-full"
                />
                <button 
                  onClick={handleRename}
                  className="p-1.5 bg-ai-blue text-white rounded-lg shadow-lg"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setTempDocName(docName);
                  setIsEditingName(true);
                }}
                className="flex items-center gap-2 py-1.5 px-3 hover:bg-white/5 rounded-lg transition-all group max-w-full"
              >
                <span className="text-xs md:text-sm font-black text-text-main tracking-tight group-hover:text-ai-blue transition-colors truncate">
                  {docName}
                </span>
                <PenTool className="w-3 h-3 text-zinc-600 group-hover:text-ai-blue shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-white/10 mx-2" />
          
          {/* Saving Indicator */}
          <div className="flex items-center gap-2 px-2 shrink-0">
            {saveStatus === 'SAVING' && (
              <div className="flex items-center gap-1.5">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                >
                  <RotateCw className="w-3 h-3 text-zinc-500" />
                </motion.div>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest hidden md:inline">Sauvegarde...</span>
              </div>
            )}
            {saveStatus === 'SAVED' && (
              <div className="flex items-center gap-1.5">
                <Cloud className="w-3 h-3 text-emerald-500" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest hidden md:inline">Enregistré</span>
              </div>
            )}
            {saveStatus === 'ERROR' && (
              <div className="flex items-center gap-1.5">
                <CloudOff className="w-3 h-3 text-red-500" />
                <span className="text-[8px] font-black text-red-400 uppercase tracking-widest hidden md:inline">Erreur</span>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-white/10 mx-2" />
          
          <ToolbarButton icon={Crop} label="Crop" onClick={() => alert('Outil de recadrage activé')} />
          <ToolbarButton icon={RotateCw} label="Rotate" onClick={rotateCurrentPage} />
          <ToolbarButton 
            icon={Filter} 
            label="Filters" 
            active={activeTool === 'FILTERS'} 
            onClick={() => setActiveTool(activeTool === 'FILTERS' ? null : 'FILTERS')} 
          />
          <ToolbarButton 
            icon={PenTool} 
            label="Sign" 
            active={activeTool === 'SIGN'} 
            onClick={() => setActiveTool(activeTool === 'SIGN' ? null : 'SIGN')} 
          />
          <div className="ml-auto flex gap-2">
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 md:px-4 py-2 md:py-2.5 bg-white/5 text-zinc-400 hover:text-white rounded-full border border-white/5 hover:border-ai-blue/30 transition-all flex items-center gap-2"
              title="Partager"
            >
              <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button 
              onClick={() => {
                const docName = document?.name || "Sans titre";
                const subject = encodeURIComponent(`Document ZenScan : ${docName}`);
                const docLink = window.location.origin + window.location.pathname + (document?.id ? `#doc=${document.id}` : "");
                const body = encodeURIComponent(
                  `Bonjour,\n\n` +
                  `Veuillez trouver ci-joint les informations concernant le document suivant, traité par l'intelligence ZenScan.\n\n` +
                  `📌 FICHE ANALYTIQUE\n` +
                  `-------------------------------------------\n` +
                  `• Nom : ${docName}\n` +
                  `• Date : ${document?.createdAt ? new Date(document.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}\n` +
                  `• Type : ${document?.type || 'Image'}\n` +
                  `• Catégorie : ${document?.category || 'Non classé'}\n` +
                  `• Pages : ${pages.length}\n` +
                  `${document?.tags && document.tags.length > 0 ? `• Tags : ${document.tags.join(', ')}\n` : ''}` +
                  `${document?.contentSnippet ? `\n🔍 EXTRAIT DE L'EXTRACTION IA :\n"${document.contentSnippet.slice(0, 300)}..."\n` : ''}` +
                  `\n🔗 ACCÈS AU DOCUMENT EN LIGNE :\n${docLink}\n\n` +
                  `-------------------------------------------\n` +
                  `ZenScan AI - Votre Assistant Documentaire Intelligent.`
                );
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
              }}
              className="px-3 md:px-4 py-2 md:py-2.5 bg-white/5 text-zinc-400 hover:text-white rounded-full border border-white/5 hover:border-ai-blue/30 transition-all flex items-center gap-2"
              title="Email"
            >
              <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className={`px-4 md:px-8 py-2 md:py-2.5 bg-ai-blue text-accent-text rounded-full font-bold text-[10px] md:text-sm ai-glow active:scale-95 transition-all flex items-center gap-2`}
            >
              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden xs:inline">Export PDF</span>
              <span className="xs:hidden">PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start pt-6">
        {/* PDF Preview Area */}
        <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">
          <div className="bg-[#1C1C1E] border border-white/5 rounded-3xl md:rounded-[40px] p-6 md:p-14 flex items-center justify-center min-h-[400px] md:min-h-[600px] relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-ai-blue/5 to-transparent pointer-events-none"></div>
            
            {/* Page Navigation Indicators */}
            <div className="absolute top-6 md:top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 md:gap-4 bg-black/40 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/10">
               <button 
                 onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                 disabled={currentPageIndex === 0}
                 className="text-white disabled:opacity-20 hover:text-ai-blue transition-colors"
               >
                 <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
               </button>
               <span className="text-[9px] md:text-xs font-black text-white uppercase tracking-widest min-w-[70px] md:min-w-[80px] text-center">
                 Page {currentPageIndex + 1} / {pages.length}
               </span>
               <button 
                 onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                 disabled={currentPageIndex === pages.length - 1}
                 className="text-white disabled:opacity-20 hover:text-ai-blue transition-colors"
               >
                 <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
               </button>
            </div>

            <motion.div 
              key={`${currentPageIndex}-${pages[currentPageIndex]?.rotation}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, rotate: pages[currentPageIndex]?.rotation || 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-[320px] md:max-w-[420px] aspect-[1/1.41] shadow-[0_40px_70px_rgba(0,0,0,0.4)] rounded-sm overflow-hidden relative"
            >
              {document?.url ? (
                document.type === 'PDF' || document.url.startsWith('data:application/pdf') ? (
                  <div className="w-full h-full bg-white flex flex-col">
                    <iframe 
                      src={document.url} 
                      className="w-full h-full border-none"
                      title="PDF Preview"
                      style={{ transform: `rotate(${pages[currentPageIndex]?.rotation || 0}deg)` }}
                    />
                  </div>
                ) : (
                  <img 
                    src={document.url} 
                    alt="Scanned Document" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error("Editor Image loading error");
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?q=80&w=800&auto=format&fit=crop";
                    }}
                  />
                )
              ) : (
                <div className="p-6 md:p-10 space-y-4 md:space-y-6 opacity-80 select-none bg-zinc-50 h-full">
                  <div className="flex justify-between items-start">
                     <div className="h-6 md:h-8 w-1/3 bg-gray-200 rounded"></div>
                     <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-ai-blue/5 border border-ai-blue/10 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-ai-blue">
                       #{pages[currentPageIndex]?.id.split('-')[1] || currentPageIndex + 1}
                     </div>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <div className="h-1.5 md:h-2 w-full bg-gray-100 rounded-full"></div>
                    <div className="h-1.5 md:h-2 w-full bg-gray-100 rounded-full"></div>
                    <div className="h-1.5 md:h-2 w-4/5 bg-gray-100 rounded-full"></div>
                    <div className="h-1.5 md:h-2 w-full bg-gray-100 rounded-full"></div>
                  </div>
                </div>
              )}
              
              {currentPageIndex === 0 && signatureData && (
                <motion.div 
                  initial={{ scale: 0, rotate: -5 }} 
                  animate={{ scale: 1, rotate: -2 }} 
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 cursor-move"
                  drag
                  dragConstraints={{ left: -150, right: 150, top: -200, bottom: 50 }}
                >
                  <img src={signatureData} alt="Signature" className="w-32 md:w-48 h-auto drop-shadow-sm pointer-events-none" />
                </motion.div>
              )}

              <div className="absolute inset-0 border-[1px] border-black/5 pointer-events-none"></div>
            </motion.div>

            <AnimatePresence>
              {activeTool === 'SIGN' && (
                <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="absolute bottom-10 inset-x-4 md:inset-x-10 glass-card p-6 rounded-[32px] border border-ai-blue/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 text-center"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <PenTool className="w-4 h-4 text-ai-blue" /> Signature Digitale
                    </span>
                    <button onClick={() => setActiveTool(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="relative h-40 bg-[#0C0C0E] rounded-2xl border border-white/10 overflow-hidden shadow-inner cursor-crosshair">
                    <canvas 
                      ref={canvasRef}
                      width={400}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-full touch-none"
                    />
                    {!isDrawing && !signatureData && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                        <PenTool className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dessinez ici</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button 
                      className="h-14 bg-white/5 text-gray-400 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors" 
                      onClick={clearSignature}
                    >
                      Effacer
                    </button>
                    <button 
                      className="h-14 bg-ai-gradient text-accent-text font-black rounded-2xl text-[10px] uppercase tracking-widest ai-glow transition-transform active:scale-95" 
                      onClick={applySignature}
                    >
                      Appliquer
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Multi-Page Thumbnails */}
          <div className="bg-primary-800/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 overflow-visible">
             <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Pages du Document</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-ai-blue/10 text-ai-blue px-2 py-0.5 rounded-full font-bold">{pages.length} Pages</span>
                </div>
             </div>
             
             <Reorder.Group 
                axis="x" 
                values={pages} 
                onReorder={setPages}
                className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-6 px-1"
             >
                <AnimatePresence mode="popLayout">
                  {pages.map((page, idx) => (
                    <Reorder.Item
                      key={page.id}
                      value={page}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center gap-2 group/thumb relative"
                    >
                      <button 
                        onClick={() => setCurrentPageIndex(idx)}
                        className={`relative w-24 aspect-[1/1.41] rounded-lg overflow-hidden transition-all border-2 ${currentPageIndex === idx ? 'border-ai-blue ai-glow scale-105 shadow-xl' : 'border-white/5 hover:border-white/20'}`}
                      >
                         {idx === 0 && document?.url ? (
                           <img 
                              src={document.url} 
                              className="w-full h-full object-cover opacity-60" 
                              alt="" 
                              referrerPolicy="no-referrer" 
                              style={{ transform: `rotate(${page.rotation}deg)` }}
                           />
                         ) : (
                           <div className="absolute inset-0 bg-white p-2 flex flex-col gap-1.5 opacity-40" style={{ transform: `rotate(${page.rotation}deg)` }}>
                             <div className="h-1.5 w-1/2 bg-gray-200 rounded-full" />
                             <div className="h-1 w-full bg-gray-100 rounded-full" />
                             <div className="h-1 w-full bg-gray-100 rounded-full" />
                             <div className="h-1 w-4/5 bg-gray-100 rounded-full" />
                           </div>
                         )}
                         <div className="absolute top-1 right-1 w-4 h-4 bg-ai-blue rounded-full flex items-center justify-center text-[8px] font-bold text-white z-10">
                           {idx + 1}
                         </div>
                      </button>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        <button 
                          onClick={() => rotatePageAt(idx)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-ai-blue/20 text-gray-500 hover:text-ai-blue transition-all"
                          title="Faire pivoter"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => removePage(idx)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                  
                  <motion.button 
                    layout
                    onClick={addPage}
                    className="w-24 aspect-[1/1.41] rounded-xl border-2 border-white/5 border-dashed flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-ai-blue/30 transition-all group shrink-0 mt-0"
                  >
                    <Plus className="w-6 h-6 text-gray-600 group-hover:text-ai-blue" />
                    <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Add Page</span>
                  </motion.button>
                </AnimatePresence>
             </Reorder.Group>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="md:col-span-4 space-y-6">
          {/* Enhancement Presets (Moved from main area) */}
          <div className="glass-card rounded-[32px] p-6 border border-white/10 bg-primary-800/40">
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">Filtres de Rendu</p>
             <div className="grid grid-cols-4 gap-2">
                {filters.map((f) => (
                  <button 
                    key={f.name}
                    onClick={() => setActiveFilter(f.name)}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all group-hover:scale-105 border ${activeFilter === f.name ? 'bg-ai-blue/20 border-ai-blue shadow-[0_0_15px_rgba(79,124,255,0.3)]' : 'bg-white/5 border-transparent hover:border-white/20'}`}>
                      <f.icon className={`w-5 h-5 ${activeFilter === f.name ? 'text-ai-blue' : 'text-gray-500'}`} />
                    </div>
                    <span className={`text-[8px] font-bold tracking-tighter uppercase truncate w-full text-center ${activeFilter === f.name ? 'text-ai-blue' : 'text-gray-500'}`}>{f.name}</span>
                  </button>
                ))}
             </div>
          </div>

          {/* AI Quick Actions Panel */}
          <div className="glass-card rounded-[32px] p-6 border border-white/10 ai-glow bg-gradient-to-br from-ai-blue/10 to-transparent">
             <h3 className="text-sm font-bold text-ai-blue uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Intelligence
             </h3>
             <div className="grid grid-cols-2 gap-3">
                <QuickAction icon={Sparkles} label="Résumé" onClick={() => alert('Génération d\'un résumé par Zen AI...')} />
                <QuickAction icon={Languages} label="Traduit" onClick={() => alert('Traduction intelligente en cours...')} />
                <QuickAction icon={FileSearch} label="Analyse" onClick={() => alert('Analyse sémantique approfondie...')} />
                <QuickAction icon={PenTool} label="Signe" onClick={() => setActiveTool('SIGN')} />
             </div>
          </div>

          <div className="glass-card rounded-[32px] p-8 border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent">
             <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
                <Save className="w-5 h-5 text-ai-blue" /> Document Metadata
             </h3>
             <div className="space-y-4">
                <div className="space-y-3 pb-3 border-b border-white/5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nom du fichier</span>
                    <span className="text-xs font-bold text-text-main truncate max-w-[150px]">
                      {docName}
                    </span>
                  </div>
                  
                  {docName.toLowerCase().includes('scan') && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-col gap-3 pt-3 mt-3 border-t border-white/5"
                    >
                      <p className="text-[10px] font-black text-ai-blue uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Assistant de Renommage
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {['Document', 'Capture', 'Fichier', 'Archive', 'Audit'].map(word => (
                          <button 
                            key={word}
                            onClick={() => handleRenameScan(word)}
                            className="px-2.5 py-1.5 bg-ai-blue/10 border border-ai-blue/30 rounded-xl text-[9px] font-bold text-ai-blue hover:bg-ai-blue/20 transition-all"
                          >
                            {word}
                          </button>
                        ))}
                      </div>

                      <div className="relative group">
                        <input 
                          type="text"
                          placeholder="Remplacer 'Scan' par..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-text-main outline-none focus:border-ai-blue/50 transition-all pr-10"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameScan((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                        />
                        <button 
                          onClick={(e) => {
                            const input = (e.currentTarget.previousSibling as HTMLInputElement);
                            if (input.value) {
                              handleRenameScan(input.value);
                              input.value = "";
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-ai-blue transition-colors"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <p className="text-[8px] text-zinc-600 italic">Cela remplacera toute occurrence de "Scan" dans le titre et les tags.</p>
                    </motion.div>
                  )}
                </div>
                
                <MetaItem label="Créé le" value={document?.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'N/A'} />
                {document?.location && (
                  <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 group/loc">
                    <span className="text-xs text-gray-500 font-medium">Localisation</span>
                    <a 
                      href={`https://www.google.com/maps?q=${document.location.latitude},${document.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-ai-blue uppercase tracking-widest flex items-center gap-1 hover:bg-ai-blue/10 px-2 py-1 rounded-lg transition-all"
                    >
                      <MapPin className="w-3 h-3" />
                      VOIR CARTE
                    </a>
                  </div>
                )}
                <MetaItem label="Pages" value={document ? `${pages.length} Pages` : 'N/A'} />
                <MetaItem label="Taille" value={document?.size || 'N/A'} />
                <MetaItem label="Type" value={document?.type || 'N/A'} />
             </div>
             
             <div className="pt-10 flex flex-col gap-3">
                <button 
                   onClick={async () => {
                     if (document) {
                       try {
                         setSaveStatus('SAVING');
                         await storageService.saveDocument(document);
                         setSaveStatus('SAVED');
                         setTimeout(() => {
                           onNavigate(AppView.LIBRARY);
                         }, 500);
                       } catch (err) {
                         console.error(err);
                         setSaveStatus('ERROR');
                       }
                     } else {
                       onNavigate(AppView.LIBRARY);
                     }
                   }}
                   className="w-full h-14 bg-ai-gradient text-accent-text font-bold rounded-2xl flex items-center justify-center gap-2 ai-glow active:scale-95 transition-transform"
                >
                  Save to Archive
                </button>
                <button 
                  onClick={() => setIsExportModalOpen(true)}
                  className="w-full h-14 bg-primary-800 text-gray-300 font-bold rounded-2xl border border-white/5 hover:bg-primary-700 transition-colors"
                >
                   Share & Export
                </button>
             </div>
          </div>
        </div>
      </div>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        document={document}
        pagesCount={pages.length}
      />
    </motion.div>
  );
}

function ToolbarButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all whitespace-nowrap active:scale-95 ${active ? 'bg-ai-blue/10 text-ai-blue border border-ai-blue/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-ai-blue/30 transition-all group active:scale-95"
    >
      <Icon className="w-5 h-5 text-gray-500 group-hover:text-ai-blue transition-colors mb-2" />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white">{label}</span>
    </button>
  );
}

function MetaItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs font-bold text-text-main truncate max-w-[150px]">{value}</span>
    </div>
  );
}
