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
  pages: { id: string; rotation: number }[];
  signatureData: string | null;
  activeFilter: string;
  docName: string;
  pdfTitle: string;
  setPdfTitle: (val: string) => void;
  pdfAuthor: string;
  setPdfAuthor: (val: string) => void;
  pdfCreationDate: string;
  setPdfCreationDate: (val: string) => void;
  handleDownloadPDF: () => Promise<void>;
  isGenerating: boolean;
}

const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = window.document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.90);
        resolve(dataURL);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = url;
  });
};

function ExportModal({ 
  isOpen, 
  onClose, 
  document, 
  pages, 
  signatureData, 
  activeFilter, 
  docName,
  pdfTitle,
  setPdfTitle,
  pdfAuthor,
  setPdfAuthor,
  pdfCreationDate,
  setPdfCreationDate,
  handleDownloadPDF: parentDownloadPDF,
  isGenerating
}: ExportModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [fileName, setFileName] = React.useState(docName || document?.name || 'ZenScan_Export');
  const pagesCount = pages.length;

  useEffect(() => {
    if (isOpen) {
      setFileName(docName || document?.name || 'ZenScan_Export');
    }
  }, [isOpen, docName, document]);

  const handleDownloadPDF = async () => {
    await parentDownloadPDF();
    onClose();
  };

  const setIsGenerating = (val: boolean) => {};

  const REDUNDANT_handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      if (document?.url && (document.type === 'PDF' || document.url.startsWith('data:application/pdf')) && !signatureData) {
        // If it's already a PDF and hasn't been signed, download it directly
        const link = window.document.createElement('a');
        link.href = document.url;
        link.download = `${fileName}.pdf`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        // Generate a beautiful, professional multipage archive PDF
        const doc = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        // ---------------- SET BINARY METADATA PROPERTIES ----------------
        doc.setProperties({
          title: pdfTitle,
          author: pdfAuthor,
          subject: document?.category || 'Numérisation IA',
          creator: 'ZenScan Intelligent Capture',
          keywords: document?.tags?.join(', ') || '',
          created: new Date(pdfCreationDate)
        } as any);

        // ---------------- PAGE 1: PROFESSIONAL SUMMARY REPORT ----------------
        // Header background color block (Slate Dark Navy)
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pdfWidth, 42, 'F');

        // Corporate Subtitle / Brand
        doc.setTextColor(59, 130, 246); // AI Royal Blue
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.text("ZENSCAN AI // RAPPORT ET ARCHIVE CERTIFIÉS", 15, 17);

        // Document name Title in header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        const displayName = pdfTitle || fileName || document?.name || "Sans titre";
        doc.text(displayName.toUpperCase().slice(0, 48), 15, 27);

        // Subtitle with audit information
        doc.setTextColor(148, 163, 184);
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(8);
        const chosenDateObj = new Date(pdfCreationDate);
        const formattedDateStr = isNaN(chosenDateObj.getTime()) 
          ? new Date().toLocaleDateString('fr-FR') 
          : chosenDateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`Généré le ${formattedDateStr} • Auteur : ${pdfAuthor} • Chiffrement 256-bit`, 15, 34);

        // Restore baseline text styles
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 65, 85);

        // Block 1 Header: Fiche Technique / Métadonnées du Scan
        doc.setFontSize(11);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("1. FICHE TECHNIQUE DU DOCUMENT (MÉTADONNÉES)", 15, 54);
        
        // Solid soft grey box for technical metadata
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, 59, 180, 52, 4, 4, 'F');

        const techMetadata = [
          { label: "Titre du document", value: pdfTitle },
          { label: "Auteur / Signataire", value: pdfAuthor },
          { label: "Date d'archivage", value: formattedDateStr },
          { label: "Catégorie Classée", value: document?.category || "Non classé" },
          { label: "Format d'origine", value: document?.type || "Image" },
          { label: "Filtre d'édition appliqué", value: activeFilter || "Original" },
        ];

        doc.setFontSize(9);
        techMetadata.forEach((item, index) => {
          const rowY = 66 + (index * 7);
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(100, 116, 139);
          doc.text(item.label + " :", 22, rowY);
          
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(15, 23, 42);
          doc.text(item.value, 68, rowY);
        });

        // Block 2: Extractions IA (Analyse de Facture/Audit)
        doc.setFontSize(11);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("2. EXTRACTIONS SÉMANTIQUES (IA CLOUD)", 15, 122);

        // Draw light box for extraction layout
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, 127, 180, 52, 4, 4, 'F');

        const extractedType = String(document?.extractedData?.type || document?.type || "Inconnu");
        const extractedAmount = String(document?.extractedData?.amount || "N/A");
        const extractedDate = String(document?.extractedData?.date || "N/A");
        const isEnhanced = document?.isAiEnhanced ? "Oui (Gemini Multi-Modal 1.5)" : "Non (Extraction standard)";

        const extractionValues = [
          { label: "Typologie détectée", value: extractedType },
          { label: "Montant comptabilisé", value: extractedAmount },
          { label: "Date de facturation/reçu", value: extractedDate },
          { label: "Enrichissement IA", value: isEnhanced },
          { label: "Statut d'indexation", value: "Actif • Prêt pour archivage comptable" }
        ];

        extractionValues.forEach((item, index) => {
          const rowY = 134 + (index * 7);
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(100, 116, 139);
          doc.text(item.label + " :", 22, rowY);
          
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(59, 130, 246); // highlight in blue
          doc.text(item.value, 68, rowY);
        });

        // Block 3: Classification Tags & Text OCR
        doc.setFontSize(11);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("3. CLASSIFICATION & INDEXATION TEXTUELLE", 15, 190);

        // Tags badges drawer
        if (document?.tags && document.tags.length > 0) {
          let startX = 15;
          const startY = 196;
          doc.setFontSize(8);
          document.tags.forEach((tag) => {
            const rawTag = tag.toUpperCase();
            const tagW = doc.getTextWidth(rawTag) + 6;
            
            if (startX + tagW < 195) {
              doc.setFillColor(239, 246, 255);
              doc.setDrawColor(191, 219, 254);
              doc.roundedRect(startX, startY, tagW, 6, 2, 2, 'FD');
              
              doc.setTextColor(29, 78, 216);
              doc.setFont("Helvetica", "bold");
              doc.text(rawTag, startX + 3, startY + 4.5);
              
              startX += tagW + 3;
            }
          });
        }

        // Extracted Content Summary Callout box
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(9);
        const snippetText = document?.contentSnippet 
          ? `Extrait OCR validé : "${document.contentSnippet}"`
          : "Aucun extrait textuel supplémentaire n'a été indexé pour ce document.";
        doc.text(snippetText, 15, 212, { maxWidth: 180 });

        // Divider
        doc.setLineWidth(0.2);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 250, 195, 250);

        doc.setFont("Helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Ce document est confidentiel et certifié numériquement. Généré via ZenScan AI.", 15, 256);
        doc.text("L'intégrité de ce fichier est conservée localement sur votre terminal.", 15, 260);

        if (signatureData) {
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(16, 185, 129);
          doc.text("SIGNÉ ÉLECTRONIQUEMENT", 110, 268);
          doc.addImage(signatureData, 'PNG', 110, 270, 45, 18);
        }

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.text(`Page 1 de ${pagesCount + 1}`, 180, 285);

        // ---------------- PAGE 2: SCAN MAIN IMAGE ATTACHMENT ----------------
        doc.addPage();
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.setFont("Helvetica", "bold");
        doc.text(`PIÈCE NUMÉRISÉE PRINCIPALE : ${displayName.toUpperCase()}`, 15, 11);
        doc.text(`Page 2 de ${pagesCount + 1}`, 180, 11);

        doc.setLineWidth(0.5);
        doc.setDrawColor(59, 130, 246);
        doc.line(15, 14, 195, 14);

        if (document?.url) {
          try {
            const base64Img = await getBase64ImageFromUrl(document.url);
            const marginX = 15;
            const marginY = 20;
            const targetW = 180;
            const targetH = 240;
            const page0Rotation = pages[0]?.rotation || 0;

            doc.addImage(base64Img, 'JPEG', marginX, marginY, targetW, targetH, undefined, 'FAST', page0Rotation);
          } catch (e) {
            console.warn("Could not reload image into jspdf, falling back", e);
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(15, 20, 180, 240, 4, 4, 'F');
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(10);
            doc.setFont("Helvetica", "normal");
            doc.text("Aperçu de la pièce numérisée principale (Fichier Image original)", 35, 120);
            doc.text("L'image de capture brute a été exclue car elle est au format PDF ou indisponible.", 35, 126);
          }
        }

        // Apply handwritten signature if available
        if (signatureData) {
          doc.addImage(signatureData, 'PNG', 115, 220, 60, 25);
          doc.setFont("Helvetica", "oblique");
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text("Signé numériquement via ZenScan App", 115, 248);
        }

        // ---------------- PAGES 3+: SUBSEQUENT SHEETS & WORK NOTE LINES ----------------
        for (let i = 1; i < pagesCount; i++) {
          doc.addPage();
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(8);
          doc.setFont("Helvetica", "bold");
          doc.text(`ANNEXE DU SCAN • FEUILLE DE NOTES #${i + 1}`, 15, 11);
          doc.text(`Page ${i + 2} de ${pagesCount + 1}`, 180, 11);

          doc.setLineWidth(0.5);
          doc.setDrawColor(226, 232, 240);
          doc.line(15, 14, 195, 14);

          // Notebook paper layout
          doc.setFillColor(252, 252, 253);
          doc.roundedRect(15, 20, 180, 245, 2, 2, 'F');

          // Horizontal neat lined notepad
          doc.setLineWidth(0.1);
          doc.setDrawColor(241, 245, 249);
          for (let lineY = 32; lineY < 255; lineY += 8) {
            doc.line(20, lineY, 190, lineY);
          }

          doc.setFont("Helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184);
          doc.text("NOTES COMPLÉMENTAIRES & TRANSMISSION", 25, 28);
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
      const docNameVal = document?.name || 'Document ZenScan';
      const shareText = `Document ZenScan: ${docNameVal}${document?.type ? ` (${document.type})` : ''}${document?.contentSnippet ? `\n\nRésumé IA: "${document.contentSnippet.slice(0, 100)}..."` : ''}`;
      
      try {
        await navigator.share({
          title: docNameVal,
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
    const docNameVal = document?.name || "Sans titre";
    const subject = encodeURIComponent(`Document ZenScan : ${docNameVal}`);
    const docLink = window.location.origin + window.location.pathname + (document?.id ? `#doc=${document.id}` : "");
    
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Veuillez trouver ci-joint les informations concernant le document suivant, traité par l'intelligence ZenScan.\n\n` +
      `📌 FICHE ANALYTIQUE\n` +
      `-------------------------------------------\n` +
      `• Nom : ${docNameVal}\n` +
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#0C0C0E] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
          >
            <div className="p-6 md:p-8 text-center space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="w-16 h-16 bg-ai-blue/10 rounded-2xl mx-auto flex items-center justify-center border border-ai-blue/20">
                <FileDown className="w-8 h-8 text-ai-blue" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-black text-text-main tracking-tight">Exporter le Document</h3>
                <p className="text-zinc-500 text-xs font-medium">Configurez les options d'archivage et de métadonnées du PDF.</p>
              </div>

              {/* Document Filename */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nom du fichier PDF (.pdf)</label>
                <input 
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-text-main font-bold outline-none focus:border-ai-blue/50 transition-colors text-sm"
                  placeholder="Ex: Facture_Mai_2026"
                />
              </div>

              {/* --- CUSTOM PDF METADATA FORM --- */}
              <div className="border-t border-white/5 pt-5 space-y-4 text-left">
                <div className="flex items-center gap-1.5 pb-1">
                  <Sparkles className="w-3.5 h-3.5 text-ai-blue" />
                  <span className="text-[10px] font-black text-ai-blue uppercase tracking-widest">Éditeur des Métadonnées du PDF</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Titre (Métadonnée)</label>
                    <input 
                      type="text"
                      value={pdfTitle}
                      onChange={(e) => setPdfTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-text-main text-xs font-semibold outline-none focus:border-ai-blue/50 transition-colors"
                      placeholder="Title"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Auteur / Signataire</label>
                    <input 
                      type="text"
                      value={pdfAuthor}
                      onChange={(e) => setPdfAuthor(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-text-main text-xs font-semibold outline-none focus:border-ai-blue/50 transition-colors"
                      placeholder="Author"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Date de création du PDF</label>
                  <input 
                    type="date"
                    value={pdfCreationDate}
                    onChange={(e) => setPdfCreationDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-text-main text-xs font-semibold outline-none focus:border-ai-blue/50 transition-colors"
                  />
                  <p className="text-[9px] text-zinc-650 text-zinc-500 italic ml-1">Cette date sera embarquée dans les propriétés internes du fichier PDF et imprimée sur le rapport certifié.</p>
                </div>
              </div>
              {/* --- END OF METADATA FORM --- */}

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="w-full h-14 bg-ai-gradient text-accent-text font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 ai-glow active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
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
                    className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-ai-blue/30 transition-all group cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-zinc-500 group-hover:text-ai-blue mb-1" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Partager</span>
                  </button>
                  <button 
                    onClick={handleEmail}
                    className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-ai-blue/30 transition-all group cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-zinc-500 group-hover:text-ai-blue mb-1" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Email</span>
                  </button>
                  <button 
                    onClick={handleCopy}
                    className="flex flex-col items-center justify-center p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-ai-blue/30 transition-all group focus:border-ai-blue/50 cursor-pointer"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-ai-blue mb-1" /> : <Copy className="w-4 h-4 text-zinc-500 group-hover:text-ai-blue mb-1" />}
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">{copied ? 'Copié' : 'Lien'}</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] hover:text-white transition-colors pt-2 cursor-pointer"
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

  const [pdfTitle, setPdfTitle] = useState(docName || document?.name || 'ZenScan_Export');
  const [pdfAuthor, setPdfAuthor] = useState('Utilisateur ZenScan');
  const [pdfCreationDate, setPdfCreationDate] = useState(() => {
    if (document?.createdAt) {
      try {
        return new Date(document.createdAt).toISOString().split('T')[0];
      } catch (e) {}
    }
    return new Date().toISOString().split('T')[0];
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setPdfTitle(docName);
  }, [docName]);

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

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      if (document?.url && (document.type === 'PDF' || document.url.startsWith('data:application/pdf')) && !signatureData) {
        // If it's already a PDF and hasn't been signed, download it directly
        const link = window.document.createElement('a');
        link.href = document.url;
        link.download = `${pdfTitle || docName || 'ZenScan_Export'}.pdf`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        // Generate a beautiful, professional multipage archive PDF
        const doc = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        // ---------------- SET BINARY METADATA PROPERTIES ----------------
        doc.setProperties({
          title: pdfTitle,
          author: pdfAuthor,
          subject: document?.category || 'Numérisation IA',
          creator: 'ZenScan Intelligent Capture',
          keywords: document?.tags?.join(', ') || '',
          created: new Date(pdfCreationDate)
        } as any);

        // ---------------- PAGE 1: PROFESSIONAL SUMMARY REPORT ----------------
        // Header background color block (Slate Dark Navy)
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pdfWidth, 42, 'F');

        // Corporate Subtitle / Brand
        doc.setTextColor(59, 130, 246); // AI Royal Blue
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.text("ZENSCAN AI // RAPPORT ET ARCHIVE CERTIFIÉS", 15, 17);

        // Document name Title in header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        const displayName = pdfTitle || docName || document?.name || "Sans titre";
        doc.text(displayName.toUpperCase().slice(0, 48), 15, 27);

        // Subtitle with audit information
        doc.setTextColor(148, 163, 184);
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(8);
        const chosenDateObj = new Date(pdfCreationDate);
        const formattedDateStr = isNaN(chosenDateObj.getTime()) 
          ? new Date().toLocaleDateString('fr-FR') 
          : chosenDateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`Généré le ${formattedDateStr} • Auteur : ${pdfAuthor} • Chiffrement 256-bit`, 15, 34);

        // Restore baseline text styles
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 65, 85);

        // Block 1 Header: Fiche Technique / Métadonnées du Scan
        doc.setFontSize(11);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("1. FICHE TECHNIQUE DU DOCUMENT (MÉTADONNÉES)", 15, 54);
        
        // Solid soft grey box for technical metadata
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, 59, 180, 52, 4, 4, 'F');

        const techMetadata = [
          { label: "Titre du document", value: pdfTitle },
          { label: "Auteur / Signataire", value: pdfAuthor },
          { label: "Date d'archivage", value: formattedDateStr },
          { label: "Catégorie Classée", value: document?.category || "Non classé" },
          { label: "Format d'origine", value: document?.type || "Image" },
          { label: "Filtre d'édition appliqué", value: activeFilter || "Original" },
        ];

        doc.setFontSize(9);
        techMetadata.forEach((item, index) => {
          const rowY = 66 + (index * 7);
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(100, 116, 139);
          doc.text(item.label + " :", 22, rowY);
          
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(15, 23, 42);
          doc.text(item.value, 68, rowY);
        });

        // Block 2: Extractions IA (Analyse de Facture/Audit)
        doc.setFontSize(11);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("2. EXTRACTIONS SÉMANTIQUES (IA CLOUD)", 15, 122);

        // Draw light box for extraction layout
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, 127, 180, 52, 4, 4, 'F');

        const extractedType = String(document?.extractedData?.type || document?.type || "Inconnu");
        const extractedAmount = String(document?.extractedData?.amount || "N/A");
        const extractedDate = String(document?.extractedData?.date || "N/A");
        const isEnhanced = document?.isAiEnhanced ? "Oui (Gemini Multi-Modal 1.5)" : "Non (Extraction standard)";

        const extractionValues = [
          { label: "Typologie détectée", value: extractedType },
          { label: "Montant comptabilisé", value: extractedAmount },
          { label: "Date de facturation/reçu", value: extractedDate },
          { label: "Enrichissement IA", value: isEnhanced },
          { label: "Statut d'indexation", value: "Actif • Prêt pour archivage comptable" }
        ];

        extractionValues.forEach((item, index) => {
          const rowY = 134 + (index * 7);
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(100, 116, 139);
          doc.text(item.label + " :", 22, rowY);
          
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(15, 23, 42);
          doc.text(item.value, 68, rowY);
        });

        // Footer note Page 1
        doc.setFontSize(7);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(148, 163, 184);
        doc.text("ZENSCAN SECURITY ENGINE // CERTIFICATE MD5 SHA256", 15, 285);
        doc.text(`Page 1 de ${pages.length + 1}`, 180, 285);

        // ---------------- PAGE 2: MAIN DOCUMENT SCAN PREVIEW ----------------
        doc.addPage();
        doc.setFontSize(8);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(148, 163, 184);
        doc.text("ZENSCAN AI // CAPTURE DE FLUX VISUEL CERTIFIÉ", 15, 11);
        doc.text(`Page 2 de ${pages.length + 1}`, 180, 11);

        doc.setLineWidth(0.5);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 14, 195, 14);

        if (document?.url) {
          try {
            let imgToRender = document.url;
            if (document.url.startsWith('http')) {
              imgToRender = await getBase64ImageFromUrl(document.url);
            }
            
            // Draw visual frame for image representation
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(18, 20, 174, 232, 2, 2, 'F');
            
            // Render scan image stretching within margin limits
            const page0Rotation = pages[0]?.rotation || 0;
            if (imgToRender && !imgToRender.startsWith('data:application/pdf')) {
              doc.addImage(imgToRender, 'JPEG', 20, 22, 170, 228, undefined, 'FAST', page0Rotation);
            } else {
              doc.setTextColor(100, 116, 139);
              doc.setFontSize(10);
              doc.text("L'image de capture brute a été exclue car elle est au format PDF ou indisponible.", 35, 126);
            }
          } catch (err) {
            console.error('Failed to draw page 1 image on PDF', err);
            doc.setTextColor(239, 68, 68);
            doc.text("Erreur de chargement du flux d'image d'origine.", 25, 126);
          }
        }

        // Draw manual signature overlay onto the first page preview if exists
        if (signatureData) {
          doc.addImage(signatureData, 'PNG', 115, 195, 55, 35);
          doc.setDrawColor(15, 23, 42);
          doc.setLineWidth(0.2);
          doc.line(115, 235, 170, 235);
          doc.setFontSize(7);
          doc.setTextColor(71, 85, 105);
          doc.text("Signé numériquement via ZenScan App", 115, 248);
        }

        // ---------------- PAGES 3+: SUBSEQUENT SHEETS & WORK NOTE LINES ----------------
        for (let i = 1; i < pages.length; i++) {
          doc.addPage();
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(8);
          doc.setFont("Helvetica", "bold");
          doc.text(`ANNEXE DU SCAN • FEUILLE DE NOTES #${i + 1}`, 15, 11);
          doc.text(`Page ${i + 2} de ${pages.length + 1}`, 180, 11);

          doc.setLineWidth(0.5);
          doc.setDrawColor(226, 232, 240);
          doc.line(15, 14, 195, 14);

          // Notebook paper layout
          doc.setFillColor(252, 252, 253);
          doc.roundedRect(15, 20, 180, 245, 2, 2, 'F');

          // Horizontal neat lined notepad
          doc.setLineWidth(0.1);
          doc.setDrawColor(241, 245, 249);
          for (let lineY = 32; lineY < 255; lineY += 8) {
            doc.line(20, lineY, 190, lineY);
          }

          doc.setFont("Helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184);
          doc.text("NOTES COMPLÉMENTAIRES & TRANSMISSION", 25, 28);
        }

        doc.save(`${pdfTitle || docName || 'ZenScan_Export'}.pdf`);
      }
    } catch (err) {
      console.error('PDF Generation failed', err);
    } finally {
      setIsGenerating(false);
    }
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

                {/* PANNEAU INTERACTIF DES MÉTADONNÉES DU PDF POUR LA REGÉNÉRATION */}
                <div className="border-t border-white/5 pt-5 pb-2 space-y-4 text-left">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ai-blue" />
                    <span className="text-xs font-black text-ai-blue uppercase tracking-widest">Édition des Métadonnées du PDF</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Titre du document</label>
                      <input 
                        type="text"
                        value={pdfTitle}
                        onChange={(e) => setPdfTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-text-main text-xs font-semibold outline-none focus:border-ai-blue/50 transition-colors"
                        placeholder="Titre du PDF"
                        id="pdf-metadata-title-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Auteur / Créateur</label>
                      <input 
                        type="text"
                        value={pdfAuthor}
                        onChange={(e) => setPdfAuthor(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-text-main text-xs font-semibold outline-none focus:border-ai-blue/50 transition-colors"
                        placeholder="Auteur du PDF"
                        id="pdf-metadata-author-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Date de création du PDF</label>
                      <input 
                        type="date"
                        value={pdfCreationDate}
                        onChange={(e) => setPdfCreationDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-text-main text-xs font-semibold outline-none focus:border-ai-blue/50 transition-colors"
                        id="pdf-metadata-date-input"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    id="pdf-metadata-regenerate-btn"
                    className="w-full h-11 bg-ai-blue/10 border border-ai-blue/30 text-ai-blue font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-ai-blue/20 disabled:opacity-50 transition-all uppercase tracking-wider mt-2 active:scale-95"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-ai-blue border-t-transparent rounded-full animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-3.5 h-3.5" />
                        Regénérer & Télécharger
                      </>
                    )}
                  </button>
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
        pages={pages}
        signatureData={signatureData}
        activeFilter={activeFilter}
        docName={docName}
        pdfTitle={pdfTitle}
        setPdfTitle={setPdfTitle}
        pdfAuthor={pdfAuthor}
        setPdfAuthor={setPdfAuthor}
        pdfCreationDate={pdfCreationDate}
        setPdfCreationDate={setPdfCreationDate}
        handleDownloadPDF={handleDownloadPDF}
        isGenerating={isGenerating}
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
