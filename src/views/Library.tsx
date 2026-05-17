/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, FileText, X, Sparkles, Download, Share2, Trash2, Calendar, FileType, HardDrive, Tag, Plus, CheckCircle2, Loader2, ZoomIn, ZoomOut, Maximize, LayoutGrid, List, Mail, Languages, Printer, Copy, ExternalLink, ArrowUpDown, ChevronRight, Home, Eye, ChevronLeft, RotateCw } from 'lucide-react';
import { AppView, DocumentMetadata } from '../types';
import { GlassCard, AIOrb, PrimaryButton, AIChip } from '../components/PremiumComponents';
import { DURATIONS, EASINGS } from '../lib/animations';
import { FadeScale } from '../components/animations/FadeScale';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';

// Memoized Document Card for performance
const DocumentCard = React.memo(({ scan, idx, onClick, isSelected, isSelectionMode, onToggleSelection, onQuickPreview }: { 
  scan: DocumentMetadata, 
  idx: number, 
  onClick: (doc: DocumentMetadata) => void,
  isSelected: boolean,
  isSelectionMode: boolean,
  onToggleSelection: (id: string) => void,
  onQuickPreview: (doc: DocumentMetadata) => void
}) => {
  const displayUrl = scan.thumbnailUrl || scan.url;
  
  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.stopPropagation();
      onToggleSelection(scan.id);
    } else {
      onClick(scan);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection(scan.id);
  };

  return (
    <FadeScale delay={idx * 30}>
      <div
        onClick={handleClick}
        className={`group relative bg-white/[0.02] border ${isSelected ? 'border-ai-blue ring-1 ring-ai-blue/10 bg-ai-blue/[0.02]' : 'border-white/5'} rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-500 glass-card p-6 flex flex-col gap-5 cursor-pointer shadow-sm hover:shadow-2xl`}
      >
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onQuickPreview(scan);
          }}
          className="h-44 md:h-52 rounded-2xl bg-primary-900/40 flex items-center justify-center overflow-hidden border border-white/5 relative group cursor-zoom-in"
        >
          {displayUrl && (scan.type !== 'PDF' || scan.thumbnailUrl) ? (
            <img 
              src={displayUrl} 
              alt={scan.name} 
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "";
                (e.target as HTMLImageElement).parentElement?.classList.add('flex-col');
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-5 group-hover:scale-110 transition-transform duration-500">
              <FileText className="w-16 h-16 md:w-20 md:h-20 text-ai-blue" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/40 via-transparent to-transparent opacity-60" />
          
          {/* Metadata Overlay Top Left */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-[60]" onClick={(e) => e.stopPropagation()}>
             {/* Selection Indicator */}
            <div 
              onClick={handleCheckboxClick}
              className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                isSelected ? 'bg-ai-blue border-ai-blue text-white shadow-lg' : 'bg-black/30 backdrop-blur-md border border-white/20 text-transparent hover:border-white/40'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
            </div>
          </div>

          {scan.isAiEnhanced && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-ai-blue/5 backdrop-blur-2xl border border-ai-blue/30 px-2.5 py-1.5 rounded-xl shadow-[0_0_20px_rgba(79,124,255,0.15)] z-[60]">
              <Sparkles className="w-3 h-3 text-ai-blue" />
              <span className="text-[7px] font-black text-ai-blue uppercase tracking-widest">Vision IA</span>
            </div>
          )}

          {/* Quick Preview Badge */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
            <div className="bg-ai-blue/90 backdrop-blur-xl text-white px-4 py-2 rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-2xl ring-1 ring-white/20">
              <Eye className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Aperçu rapide</span>
            </div>
          </div>

          {/* Hover Content Peek Overlay */}
          {scan.contentSnippet && (
            <div className="absolute inset-0 bg-primary-950/80 backdrop-blur-sm p-5 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-500 z-40 translate-y-4 group-hover:translate-y-0 pointer-events-none">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-ai-blue" />
                  <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em]">Aperçu IA</span>
                </div>
                <p className="text-[10px] text-white/80 leading-relaxed line-clamp-4 italic bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent italic">
                  "{scan.contentSnippet}"
                </p>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
             <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-md text-[8px] font-black text-white/50 uppercase tracking-widest">{scan.type}</span>
             <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-md text-[8px] font-black text-white/50 uppercase tracking-widest">{scan.size}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="font-bold text-sm md:text-base text-text-main leading-tight group-hover:text-ai-blue transition-colors truncate tracking-tight">{scan.name}</h3>
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none">{scan.modifiedAt.toLocaleDateString()} • {scan.category || 'Non classé'}</p>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            {scan.tags && scan.tags.slice(0, 3).map((tag, i) => (
              <span key={`${tag}-${i}`} className="text-[7px] font-black text-zinc-500 bg-white/[0.03] border border-white/5 px-2 py-1 rounded-md uppercase tracking-widest group-hover:border-ai-blue/20 group-hover:text-ai-blue transition-colors">
                {tag}
              </span>
            ))}
            {!scan.tags || scan.tags.length === 0 && (
              <span className="text-[7px] font-black text-zinc-700 uppercase tracking-widest italic leading-none py-1">Aucune étiquette</span>
            )}
          </div>
        </div>
      </div>
    </FadeScale>
  );
});

const DocumentListItem = React.memo(({ scan, idx, onClick, isSelected, isSelectionMode, onToggleSelection, onQuickPreview }: { 
  scan: DocumentMetadata, 
  idx: number, 
  onClick: (doc: DocumentMetadata) => void,
  isSelected: boolean,
  isSelectionMode: boolean,
  onToggleSelection: (id: string) => void,
  onQuickPreview: (doc: DocumentMetadata) => void
}) => {
  const displayUrl = scan.thumbnailUrl || scan.url;
  
  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.stopPropagation();
      onToggleSelection(scan.id);
    } else {
      onClick(scan);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection(scan.id);
  };

  return (
    <FadeScale delay={idx * 20}>
      <div 
        onClick={handleClick}
        className={`group flex items-center gap-4 p-3 md:p-4 bg-primary-800/40 border ${isSelected ? 'border-ai-blue ring-2 ring-ai-blue/10 bg-ai-blue/5' : 'border-white/5'} rounded-2xl md:rounded-[24px] hover:border-ai-blue/30 transition-all duration-300 glass-card cursor-pointer`}
      >
        <div 
          onClick={handleCheckboxClick}
          className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
            isSelected ? 'bg-ai-blue border-ai-blue text-white shadow-lg' : 'bg-white/5 border border-white/10 text-transparent hover:border-white/30'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 md:w-5 md:h-5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        <div 
          onClick={(e) => {
            e.stopPropagation();
            onQuickPreview(scan);
          }}
          className="w-10 h-10 md:w-14 md:h-14 rounded-lg bg-primary-700/30 flex items-center justify-center flex-shrink-0 group-hover:bg-ai-blue/20 transition-all overflow-hidden border border-white/5 hover:border-ai-blue/30 cursor-zoom-in relative group/vignette"
        >
          {displayUrl && (scan.type !== 'PDF' || scan.thumbnailUrl) ? (
            <img 
              src={displayUrl} 
              alt={scan.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover/vignette:scale-110" 
            />
          ) : (
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-zinc-500 group-hover:text-ai-blue transition-colors" />
          )}
          <div className="absolute inset-0 bg-ai-blue/0 group-hover/vignette:bg-ai-blue/10 transition-colors flex items-center justify-center">
            <Eye className="w-4 h-4 text-white opacity-0 group-hover/vignette:opacity-100 transition-opacity" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 space-y-1 relative group/info">
          <h3 className="font-bold text-sm md:text-base text-text-main truncate group-hover:text-ai-blue transition-colors">{scan.name}</h3>
          
          {/* List Hover Snippet */}
          {scan.contentSnippet && (
            <div className="absolute top-full left-0 mt-1 z-50 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none hidden md:block">
              <div className="bg-primary-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl max-w-sm">
                <p className="text-[9px] text-white/70 italic leading-relaxed line-clamp-2">
                  "{scan.contentSnippet}"
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-zinc-500 tracking-widest font-black uppercase">
            <span>{scan.type}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700 font-normal"></span>
            <span>{scan.size}</span>
            <span className="hidden md:inline w-1 h-1 rounded-full bg-zinc-700 font-normal"></span>
            <span className="hidden md:inline">{scan.modifiedAt.toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {scan.tags && scan.tags.length > 0 && (
            <div className="hidden lg:flex gap-2">
              {scan.tags.slice(0, 1).map((tag, i) => (
                <span key={`${tag}-${i}`} className="text-[8px] font-black text-ai-blue/70 bg-ai-blue/5 border border-ai-blue/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {scan.isAiEnhanced && (
            <Sparkles className="w-3.5 h-3.5 text-ai-blue opacity-50" />
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onQuickPreview(scan);
            }}
            className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-white/5 flex items-center justify-center bg-white/5 hover:border-ai-blue/20 hover:text-ai-blue transition-colors"
            title="Aperçu rapide"
          >
            <Eye className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:border-ai-blue/20 transition-colors">
            <Plus className="w-4 h-4 text-zinc-600 group-hover:text-ai-blue" />
          </div>
        </div>
      </div>
    </FadeScale>
  );
});

interface LibraryProps {
  onNavigate: (view: AppView) => void;
  onSelectDocument?: (doc: DocumentMetadata) => void;
}

export default function Library({ onNavigate, onSelectDocument }: LibraryProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>(localStorage.getItem('zenScanLibraryDisplay') as 'grid' || 'grid');
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentMetadata | null>(null);
  const [newTag, setNewTag] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [aiOnly, setAiOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortMode, setSortMode] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc'>('date-desc');
  const [zoomScale, setZoomScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfPage, setPdfPage] = useState(1);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const categoriesList = ['Factures', 'Recettes', 'Contrats', 'Identité', 'Personnel', 'Travail', 'Autre'];

  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    // Reset zoom and page when selecting a new document
    setZoomScale(1);
    setIsFullScreen(false);
    setPdfPage(1);
    setRotation(0);
  }, [selectedDoc?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDoc) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleResetZoom();
        }
      } else {
        if (selectedDoc.type === 'PDF') {
          if (e.key === 'ArrowRight') setPdfPage(prev => prev + 1);
          else if (e.key === 'ArrowLeft') setPdfPage(prev => Math.max(1, prev - 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDoc, zoomScale]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTypes([]);
    setAiOnly(false);
  };

  const handleResetZoom = () => setZoomScale(1);
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.deltaY < 0) handleZoomIn();
      else handleZoomOut();
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedDocIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedDocIds([]);

  const handleBatchDelete = async () => {
    if (selectedDocIds.length === 0 || !user || !confirm(`Supprimer ces ${selectedDocIds.length} documents définitivement ?`)) return;
    
    try {
      await Promise.all(selectedDocIds.map(id => storageService.deleteDocument(id)));
      setDocuments(prev => prev.filter(d => !selectedDocIds.includes(d.id)));
      setSelectedDocIds([]);
    } catch (error) {
      console.error("Error bulk deleting", error);
    }
  };

  const handleBatchTag = async () => {
    const tag = prompt("Entrez un tag à ajouter à la sélection :");
    if (!tag || selectedDocIds.length === 0 || !user) return;
    
    const trimmedTag = tag.trim();
    
    try {
      const updatedDocs = documents
        .filter(d => selectedDocIds.includes(d.id))
        .map(d => ({
          ...d,
          tags: Array.from(new Set([...(d.tags || []), trimmedTag]))
        }));
      
      await Promise.all(updatedDocs.map(d => storageService.saveDocument(d)));
      
      setDocuments(prev => prev.map(d => {
        const updated = updatedDocs.find(up => up.id === d.id);
        return updated || d;
      }));
      
      alert(`Tag "${trimmedTag}" ajouté à ${selectedDocIds.length} documents.`);
    } catch (error) {
      console.error("Error bulk tagging", error);
    }
  };

  const handleBatchShare = async () => {
    if (selectedDocIds.length === 0) return;
    const selectedFiles = documents.filter(d => selectedDocIds.includes(d.id));
    const urls = selectedFiles.map(f => f.url).filter(Boolean);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Documents ZenScan',
          text: `Partage de ${selectedFiles.length} documents depuis ZenScan AI.`,
          url: window.location.origin
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      alert(`Lien de l'application copié pour partager ${selectedFiles.length} documents.`);
      navigator.clipboard.writeText(window.location.origin);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchDocs = async () => {
      setLoading(true);
      try {
        const docs = await storageService.getDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching library", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [user]);

  const handleAddTag = async () => {
    const trimmedTag = newTag.trim();
    if (!selectedDoc || !trimmedTag || (selectedDoc.tags || []).includes(trimmedTag) || !user) return;
    
    const updatedTags = [...(selectedDoc.tags || []), trimmedTag];
    const updatedDoc = { ...selectedDoc, tags: updatedTags };
    
    try {
      await storageService.saveDocument(updatedDoc);
      setSelectedDoc(updatedDoc);
      setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? updatedDoc : d));
      setNewTag('');
    } catch (error) {
      console.error("Error adding tag", error);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedDoc || !user) return;
    
    const updatedTags = (selectedDoc.tags || []).filter(t => t !== tagToRemove);
    const updatedDoc = { ...selectedDoc, tags: updatedTags };
    
    try {
      await storageService.saveDocument(updatedDoc);
      setSelectedDoc(updatedDoc);
      setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? updatedDoc : d));
    } catch (error) {
      console.error("Error removing tag", error);
    }
  };

  const handleSetCategory = async (cat: string) => {
    if (!selectedDoc || !user) return;
    
    const updatedDoc = { ...selectedDoc, category: cat };
    
    try {
      await storageService.saveDocument(updatedDoc);
      setSelectedDoc(updatedDoc);
      setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? updatedDoc : d));
    } catch (error) {
      console.error("Error setting category", error);
    }
  };

  const handleDeleteDoc = async () => {
    if (!selectedDoc || !user) return;
    
    try {
      await storageService.deleteDocument(selectedDoc.id);
      setDocuments(prev => prev.filter(d => d.id !== selectedDoc.id));
      setSelectedDoc(null);
    } catch (error) {
      console.error("Error deleting document", error);
    }
  };

  const toggleDisplayMode = (mode: 'grid' | 'list') => {
    setDisplayMode(mode);
    localStorage.setItem('zenScanLibraryDisplay', mode);
  };

  const handleCopyContent = () => {
    if (!selectedDoc) return;
    
    let textToCopy = `DOCUMENT : ${selectedDoc.name}\n\n`;
    if (selectedDoc.contentSnippet) {
      textToCopy += `ANALYSE IA :\n${selectedDoc.contentSnippet}\n\n`;
    }
    
    if (selectedDoc.extractedData) {
      textToCopy += `DONNÉES EXTRAITES :\n`;
      Object.entries(selectedDoc.extractedData).forEach(([key, value]) => {
        textToCopy += `${key} : ${value}\n`;
      });
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      alert('Contenu copié dans le presse-papiers !');
    });
  };

  const handlePrint = () => {
    if (selectedDoc?.url) {
      const printWindow = window.open(`${selectedDoc.url}${selectedDoc.type === 'PDF' ? `#page=${pdfPage}` : ''}`, '_blank');
      if (printWindow) {
        printWindow.print();
      }
    }
  };

  const filteredDocuments = useMemo(() => {
    return [...documents]
      .filter(doc => {
        const matchesCategory = selectedCategories.length === 0 || 
                               (doc.category && selectedCategories.includes(doc.category)) || 
                               (doc.tags && selectedCategories.some(cat => doc.tags.includes(cat)));
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(doc.type);
        const matchesAi = !aiOnly || doc.isAiEnhanced;
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            doc.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch && matchesType && matchesAi;
      })
      .sort((a, b) => {
        if (sortMode === 'date-desc') return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
        if (sortMode === 'date-asc') return new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
        if (sortMode === 'name-asc') return a.name.localeCompare(b.name);
        if (sortMode === 'name-desc') return b.name.localeCompare(a.name);
        if (sortMode === 'size-desc') {
          const sizeA = parseFloat(a.size.replace(/[^0-9.]/g, '')) || 0;
          const sizeB = parseFloat(b.size.replace(/[^0-9.]/g, '')) || 0;
          const isAMB = a.size.includes('MB');
          const isBMB = b.size.includes('MB');
          const valA = isAMB ? sizeA * 1024 : sizeA;
          const valB = isBMB ? sizeB * 1024 : sizeB;
          return valB - valA;
        }
        return 0;
      });
  }, [documents, selectedCategories, searchQuery, sortMode]);

  const stats = useMemo(() => {
    const totalSizeKb = documents.reduce((acc, doc) => {
      const sizeStr = doc.size || '0 KB';
      const num = parseFloat(sizeStr.replace(/[^0-9.]/g, '')) || 0;
      const isMB = sizeStr.includes('MB');
      return acc + (isMB ? num * 1024 : num);
    }, 0);

    const categoriesCount = documents.reduce((acc: Record<string, number>, doc) => {
      const cat = doc.category || 'Non classé';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const topCategory = Object.entries(categoriesCount).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'Aucune';

    return {
      total: documents.length,
      size: totalSizeKb > 1024 ? `${(totalSizeKb / 1024).toFixed(1)} MB` : `${Math.round(totalSizeKb)} KB`,
      topCategory,
      aiEnhanced: documents.filter(d => d.isAiEnhanced).length
    };
  }, [documents]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pt-24 md:pt-32 pb-32 px-5 md:px-8 max-w-7xl mx-auto"
    >
      {/* Zen AI Pulse Statistics */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
      >
        <GlassCard className="p-4 md:p-5 border-white/5 hover:border-ai-blue/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-8 h-8 text-ai-blue" />
          </div>
          <p className="text-[9px] font-black text-ai-blue uppercase tracking-widest mb-1 italic">Total Library</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-bold text-white">{stats.total}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Docs</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-5 border-white/5 hover:border-purple-500/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1 italic">Intelligence IA</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-bold text-white">{stats.aiEnhanced}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Analysés</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-5 border-white/5 hover:border-emerald-500/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <HardDrive className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 italic">Stockage Utilisé</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-bold text-white">{stats.size}</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-5 border-white/5 hover:border-amber-500/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Tag className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1 italic">Top Catégorie</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg md:text-xl font-bold text-white truncate max-w-full">{stats.topCategory}</span>
          </div>
        </GlassCard>
      </motion.div>

      {/* Breadcrumb Navigation System */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 mb-6 md:mb-8 overflow-x-auto no-scrollbar py-1"
      >
        <button 
          onClick={clearFilters}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-ai-blue transition-colors flex-shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Bibliothèque</span>
        </button>
        
        <ChevronRight className="w-3 h-3 text-zinc-700 flex-shrink-0" />
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-black uppercase tracking-widest ${selectedCategories.length === 0 ? 'text-ai-blue' : 'text-zinc-500'}`}>
            Documents
          </span>
        </div>

        {selectedCategories.length > 0 && (
          <>
            <ChevronRight className="w-3 h-3 text-zinc-700 flex-shrink-0" />
            <div className="flex items-center gap-2 overflow-hidden flex-shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-ai-blue/10 border border-ai-blue/20 rounded-full">
                <span className="text-[9px] font-black text-ai-blue uppercase tracking-widest truncate max-w-[120px] md:max-w-[200px]">
                  {selectedCategories.length === 1 ? selectedCategories[0] : `${selectedCategories.length} Filtres`}
                </span>
                <button 
                  onClick={clearFilters}
                  className="hover:scale-110 active:scale-90 transition-transform"
                >
                  <X className="w-2.5 h-2.5 text-ai-blue" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      <header className="mb-8 md:mb-12 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-1">
            <p className="text-[9px] md:text-[10px] font-black text-ai-blue uppercase tracking-[0.4em] leading-none">Archive Numérique</p>
            <h1 className="text-4xl md:text-[52px] font-bold leading-[1.1] tracking-tight text-text-main">
              Library <span className="opacity-40 font-light">Docs</span>
            </h1>
            <p className="text-sm md:text-base text-zinc-500 max-w-lg leading-snug">Gérez et analysez vos archives avec une extraction IA de précision.</p>
          </div>
          
          <PrimaryButton 
            onClick={() => onNavigate(AppView.SCANNER)}
            className="h-12 md:h-14 px-8 md:px-10 rounded-2xl shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 transition-all text-sm md:text-base"
          >
            Nouveau Scan
          </PrimaryButton>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 md:h-14 bg-primary-800/50 border border-white/5 rounded-xl md:rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-ai-blue/20 transition-all outline-none glass-card"
            />
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            {/* View Switcher */}
            <div className="flex bg-primary-800/50 border border-white/5 rounded-xl md:rounded-2xl p-1 glass-card overflow-hidden h-12 md:h-14">
              <button
                onClick={() => toggleDisplayMode('grid')}
                className={`flex-1 sm:w-10 flex items-center justify-center rounded-lg md:rounded-xl transition-all ${
                  displayMode === 'grid' ? 'bg-ai-blue text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => toggleDisplayMode('list')}
                className={`flex-1 sm:w-10 flex items-center justify-center rounded-lg md:rounded-xl transition-all ${
                  displayMode === 'list' ? 'bg-ai-blue text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <List className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <button 
              onClick={() => setIsFilterOpen(true)}
              className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl glass-card flex items-center justify-center transition-colors flex-shrink-0 ${
                (selectedCategories.length > 0 || selectedTypes.length > 0 || aiOnly) ? 'text-ai-blue border-ai-blue/30' : 'text-zinc-500 hover:text-ai-blue'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5 md:w-6 md:h-6" />
              {(selectedCategories.length > 0 || selectedTypes.length > 0 || aiOnly) && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-ai-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-in fade-in zoom-in">
                  {selectedCategories.length + selectedTypes.length + (aiOnly ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Quick Filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5 md:mx-0 md:px-0">
          <button 
            onClick={clearFilters}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategories.length === 0 ? 'bg-ai-blue/10 text-ai-blue border border-ai-blue/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-white/5 text-zinc-500 border border-white/5 hover:border-white/10'}`}
          >
            Tous les documents
          </button>
          {categoriesList.map(cat => (
            <button 
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategories.includes(cat) ? 'bg-ai-blue/10 text-ai-blue border border-ai-blue/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-white/5 text-zinc-500 border border-white/5 hover:border-white/10'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className={displayMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" 
        : "flex flex-col gap-3 md:gap-4"
      }>
        {loading ? (
          <div className="col-span-full h-64 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-ai-blue animate-spin" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="col-span-full h-64 flex flex-col items-center justify-center text-zinc-500 gap-4">
            <FileText className="w-16 h-16 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm">Aucun document trouvé</p>
          </div>
        ) : filteredDocuments.map((scan, idx) => (
          displayMode === 'grid' ? (
            <DocumentCard 
              key={scan.id} 
              scan={scan} 
              idx={idx} 
              onClick={setSelectedDoc}
              isSelected={selectedDocIds.includes(scan.id)}
              isSelectionMode={selectedDocIds.length > 0}
              onToggleSelection={toggleSelection}
              onQuickPreview={(doc) => {
                setSelectedDoc(doc);
                setIsFullScreen(true);
              }}
            />
          ) : (
            <DocumentListItem
              key={scan.id}
              scan={scan}
              idx={idx}
              onClick={setSelectedDoc}
              isSelected={selectedDocIds.includes(scan.id)}
              isSelectionMode={selectedDocIds.length > 0}
              onToggleSelection={toggleSelection}
              onQuickPreview={(doc) => {
                setSelectedDoc(doc);
                setIsFullScreen(true);
              }}
            />
          )
        ))}

        {displayMode === 'grid' && (
          <FadeScale delay={loading ? 0 : filteredDocuments.length * 30}>
            <button 
              onClick={() => onNavigate(AppView.SCANNER)}
              className="group border-2 border-dashed border-white/10 rounded-2xl md:rounded-[28px] flex flex-col items-center justify-center p-6 md:p-8 hover:border-ai-blue/50 hover:bg-ai-blue/5 transition-all aspect-video md:aspect-auto w-full h-full min-h-[250px] md:min-h-[300px]"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary-800 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-ai-blue transition-all duration-300">
                <Plus className="w-6 h-6 md:w-8 md:h-8 text-zinc-600 group-hover:text-white" />
              </div>
              <p className="font-bold text-sm md:text-base text-zinc-600 group-hover:text-ai-blue uppercase tracking-widest">Scanner Docs</p>
            </button>
          </FadeScale>
        )}
      </div>

      {/* Batch Action Bar */}
      <AnimatePresence>
        {selectedDocIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] w-[calc(100%-40px)] max-w-2xl"
          >
            <GlassCard glow className="p-4 md:p-5 flex items-center justify-between border-ai-blue/30 bg-primary-950/90 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={clearSelection}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <p className="text-[10px] font-black text-ai-blue uppercase tracking-widest leading-none mb-1">Sélection active</p>
                  <p className="text-sm font-bold text-white leading-none">{selectedDocIds.length} documents sélectionnés</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleBatchTag}
                  className="h-10 md:h-11 px-4 md:px-5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs md:text-sm font-bold text-white hover:bg-white/10 transition-all"
                >
                  <Tag className="w-4 h-4 text-ai-blue" />
                  <span className="hidden sm:inline">Taguer</span>
                </button>
                <button 
                  onClick={handleBatchShare}
                  className="h-10 md:h-11 px-4 md:px-5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs md:text-sm font-bold text-white hover:bg-white/10 transition-all"
                >
                  <Share2 className="w-4 h-4 text-ai-blue" />
                  <span className="hidden sm:inline">Exporter</span>
                </button>
                <button 
                  onClick={handleBatchDelete}
                  className="h-10 md:h-11 px-4 md:px-5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs md:text-sm font-bold text-red-500 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Supprimer</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Footer Notice */}
      <div className="mt-16 flex flex-col items-center gap-2 opacity-30 pb-20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-ai-blue" />
          <span className="text-[9px] font-black uppercase tracking-widest">Système de Capture Certifié par Zen AI</span>
        </div>
        <p className="text-[8px] text-zinc-500 max-w-xs text-center uppercase tracking-tighter leading-none">Conforme aux normes de protection des données (RGPD). Stockage décentralisé et chiffré.</p>
      </div>

      {/* Document Detail Sidebar */}
      {/* Filter Sidebar */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: DURATIONS.PREMIUM, ease: EASINGS.PREMIUM }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-primary-950 border-l border-white/10 z-[121] shadow-2xl flex flex-col"
            >
              <div className="p-8 pb-4 flex justify-between items-center bg-white/[0.02] border-b border-white/5">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-ai-blue uppercase tracking-[0.4em]">Configuration</p>
                  <h2 className="text-2xl font-bold text-text-main tracking-tighter">Filtres <span className="opacity-40">Avancés</span></h2>
                </div>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
                {/* AI Toggle */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Options Zen AI</h4>
                  <button 
                    onClick={() => setAiOnly(!aiOnly)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                      aiOnly 
                        ? 'bg-ai-blue/10 border-ai-blue/40 text-white shadow-[0_0_20px_rgba(79,124,255,0.1)]' 
                        : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${aiOnly ? 'bg-ai-blue/20 text-ai-blue' : 'bg-white/5 text-zinc-500'}`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold tracking-tight">Vision IA uniquement</p>
                        <p className="text-[10px] opacity-40 font-medium">Docs analysés par l'intelligence</p>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${aiOnly ? 'bg-ai-blue' : 'bg-zinc-800'}`}>
                      <motion.div 
                        animate={{ x: aiOnly ? 22 : 4 }}
                        className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm"
                      />
                    </div>
                  </button>
                </div>

                {/* File Types */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Formats</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['PDF', 'JPG', 'PNG'].map((type) => {
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedTypes(prev => isSelected ? prev.filter(t => t !== type) : [...prev, type])}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                            isSelected 
                              ? 'bg-ai-blue/10 border-ai-blue/40 text-white' 
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-ai-blue shadow-[0_0_8px_#4F7CFF]' : 'bg-zinc-800'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Catégories</h4>
                    {selectedCategories.length > 0 && (
                      <button 
                        onClick={() => setSelectedCategories([])}
                        className="text-[10px] font-bold text-ai-blue/60 hover:text-ai-blue transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {categoriesList.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                            isSelected 
                              ? 'bg-ai-blue/10 border-ai-blue/40 text-white' 
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10 hover:bg-white/[0.07]'
                          }`}
                        >
                          <span className="text-xs font-bold tracking-tight">{cat}</span>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-ai-blue border-ai-blue shadow-lg' : 'border-white/20'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center px-1">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Trier par</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'date-desc', label: 'Plus récent first' },
                      { id: 'date-asc', label: 'Plus ancien first' },
                      { id: 'name-asc', label: 'Nom (A-Z)' },
                      { id: 'name-desc', label: 'Nom (Z-A)' },
                      { id: 'size-desc', label: 'Taille' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSortMode(mode.id as any)}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                          sortMode === mode.id 
                            ? 'bg-ai-blue/10 border-ai-blue/40 text-white' 
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10 hover:bg-white/[0.07]'
                        }`}
                      >
                        <span className="text-xs font-bold tracking-tight">{mode.label}</span>
                        {sortMode === mode.id && <CheckCircle2 className="w-4 h-4 text-ai-blue" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 pt-6 border-t border-white/5 bg-white/[0.01]">
                <div className="flex gap-3">
                  <button 
                    onClick={clearFilters}
                    className="flex-1 h-14 rounded-[18px] bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Effacer Tout
                  </button>
                  <PrimaryButton 
                    text="Appliquer" 
                    onClick={() => setIsFilterOpen(false)} 
                    className="flex-[2] h-14"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDoc && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />

            {/* Sidebar Pane */}
            <motion.div
              initial={isFullScreen ? { scale: 0.9, opacity: 0 } : { x: '100%' }}
              animate={isFullScreen ? { scale: 1, opacity: 1, x: 0, width: '100vw', height: '100vh' } : { x: 0, width: 'auto', height: 'auto' }}
              exit={isFullScreen ? { scale: 0.9, opacity: 0 } : { x: '100%' }}
              transition={{ duration: DURATIONS.PREMIUM, ease: EASINGS.PREMIUM }}
              className={`fixed right-0 top-0 bottom-0 z-[101] bg-primary-950 shadow-2xl overflow-y-auto no-scrollbar ${isFullScreen ? 'inset-0 w-full md:w-full' : 'w-full md:w-[480px] border-l border-white/10'}`}
            >
              <div className={`${isFullScreen ? 'h-full flex flex-col' : 'p-6 md:p-8 space-y-8 md:space-y-10'}`}>
                {/* Header */}
                <div className={`flex justify-between items-center bg-white/[0.02] border-b border-white/5 ${isFullScreen ? 'px-8 py-4' : '-mx-8 -mt-8 px-8 py-6 mb-10'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ai-blue/10 flex items-center justify-center border border-ai-blue/20">
                      <FileText className="w-4 h-4 text-ai-blue" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-ai-blue uppercase tracking-widest leading-none">Inspecteur de Document</h4>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">ID: {selectedDoc.id.slice(0, 8)}...-CERT</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 active:scale-95 group"
                  >
                    <X className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                  </button>
                </div>

                {/* Doc Preview Thumbnail Area */}
                <div 
                  ref={containerRef}
                  className={`relative bg-white overflow-hidden shadow-2xl group border border-white/5 transition-all duration-500 ${isFullScreen ? 'flex-1 rounded-none' : 'aspect-[3/4] rounded-2xl md:rounded-3xl'}`}
                  onWheel={handleWheel}
                >
                  <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                    <motion.div 
                      className={`relative flex items-center justify-center ${zoomScale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      animate={{ 
                        scale: zoomScale,
                        rotate: rotation
                      }}
                      drag={zoomScale > 1}
                      dragConstraints={containerRef}
                      dragElastic={0.1}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{ 
                        transformOrigin: 'center center',
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      {selectedDoc.url && selectedDoc.type === 'PDF' ? (
                        <div className="w-full h-full relative">
                          <iframe
                            src={`${selectedDoc.url}#toolbar=0&navpanes=0&scrollbar=0&page=${pdfPage}`}
                            className="w-full h-full border-none pointer-events-none"
                            title="PDF Preview"
                          />
                          {/* Invisible overlay for dragging and zooming */}
                          <div className="absolute inset-0 z-10 cursor-inherit" />
                        </div>
                      ) : selectedDoc.url && (selectedDoc.url.startsWith('data:image') || ['JPG', 'PNG', 'JPEG'].includes(selectedDoc.type)) ? (
                        <img 
                          src={selectedDoc.url} 
                          alt={selectedDoc.name}
                          referrerPolicy="no-referrer"
                          className="max-w-full max-h-full object-contain shadow-sm rounded-lg"
                        />
                      ) : (
                        <div className="absolute inset-0 p-8 md:p-10 space-y-4 md:space-y-6">
                          <div className="h-5 md:h-6 w-1/2 bg-gray-100 rounded-lg" />
                          <div className="space-y-2 md:space-y-3">
                            <div className="h-1.5 w-full bg-gray-50 rounded-full" />
                            <div className="h-1.5 w-full bg-gray-50 rounded-full" />
                            <div className="h-1.5 w-2/3 bg-gray-50 rounded-full" />
                          </div>
                          <div className="pt-12 md:pt-20 flex justify-center text-primary-200">
                            {selectedDoc.type === 'PDF' ? (
                              <FileText className="w-32 h-32 md:w-40 md:h-40 opacity-20" />
                            ) : (
                              <div className="relative">
                                <FileText className="w-32 h-32 md:w-40 md:h-40 opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-black opacity-40 tracking-widest">{selectedDoc.type}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                  
                  {/* Zoom Controls Bar - Floating Bottom Center */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 z-40 bg-black/70 backdrop-blur-3xl border border-white/10 p-2 rounded-[24px] shadow-2xl ring-1 ring-white/5">
                    <button 
                      onClick={handleZoomOut}
                      disabled={zoomScale <= 0.25}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed group"
                      title="Zoom arrière (Ctrl -)"
                    >
                      <ZoomOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    
                    <button 
                      onClick={handleResetZoom}
                      className="px-4 h-10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/10 transition-all group overflow-hidden relative"
                      title="Réinitialiser (Ctrl 0)"
                    >
                      <span className="text-[10px] font-black text-ai-blue uppercase tracking-[0.2em]">{Math.round(zoomScale * 100)}%</span>
                      <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-tighter absolute -bottom-4 group-hover:bottom-0.5 transition-all">RESET</span>
                    </button>

                    <button 
                      onClick={handleZoomIn}
                      disabled={zoomScale >= 5}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90 disabled:opacity-20 group"
                      title="Zoom avant (Ctrl +)"
                    >
                      <ZoomIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>

                    <div className="w-[1px] h-6 bg-white/10 mx-1" />

                    <button 
                      onClick={handleRotate}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90 group"
                      title="Rotation"
                    >
                      <RotateCw className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    <div className="w-[1px] h-6 bg-white/10 mx-1" />

                    <button 
                      onClick={() => setIsFullScreen(!isFullScreen)}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 group ${isFullScreen ? 'bg-ai-blue text-white shadow-[0_0_15px_rgba(79,124,255,0.4)]' : 'text-white/50 hover:text-white hover:bg-white/10 border border-white/5'}`}
                      title={isFullScreen ? "Réduire" : "Plein écran"}
                    >
                      <Maximize className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>

                    {selectedDoc.type === 'PDF' && (
                      <>
                        <div className="w-[1px] h-6 bg-white/10 mx-1" />
                        <div className="flex items-center gap-1.5 px-2">
                          <button 
                             onClick={() => setPdfPage(prev => Math.max(1, prev - 1))}
                             className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                             title="Page précédente (Gauche)"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-white/80 w-6 text-center">{pdfPage}</span>
                            <span className="text-[6px] font-bold text-zinc-500 uppercase">PAGE</span>
                          </div>
                          <button 
                             onClick={() => setPdfPage(prev => prev + 1)}
                             className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                             title="Page suivante (Droite)"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Subtle Scan Effect (only if not a real PDF loading or always for aesthetic) */}
                  <motion.div
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-ai-blue shadow-[0_0_20px_#4F7CFF] z-20 opacity-30 pointer-events-none"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent p-5 md:p-6 flex items-end z-30 pointer-events-none">
                    <div className="flex gap-4 pointer-events-auto">
                      <button 
                        onClick={() => window.open(selectedDoc.url, '_blank')}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title="Ouvrir dans un nouvel onglet"
                      >
                        <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button 
                        onClick={handlePrint}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title="Imprimer"
                      >
                        <Printer className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedDoc.url || '#';
                          link.download = selectedDoc.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          const docName = selectedDoc.name;
                          const shareText = `Document ZenScan: ${docName}${selectedDoc.type ? ` (${selectedDoc.type})` : ''}${selectedDoc.contentSnippet ? `\n\nRésumé IA: "${selectedDoc.contentSnippet.slice(0, 100)}..."` : ''}`;
                          
                          if (navigator.share) {
                            navigator.share({
                              title: docName,
                              text: shareText,
                              url: selectedDoc.url || window.location.href,
                            }).catch(console.error);
                          } else {
                            navigator.clipboard.writeText(selectedDoc.url || window.location.href);
                            alert('Lien de partage copié dans le presse-papiers !');
                          }
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title="Partager"
                      >
                        <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          const docName = selectedDoc.name;
                          const subject = encodeURIComponent(`Document ZenScan : ${docName}`);
                          const docLink = window.location.origin + window.location.pathname + (selectedDoc.id ? `#doc=${selectedDoc.id}` : "");
                          
                          const body = encodeURIComponent(
                            `Bonjour,\n\n` +
                            `Je partage avec vous ce document géré via ZenScan AI.\n\n` +
                            `📌 FICHE DOCUMENTAIRE\n` +
                            `-------------------------------------------\n` +
                            `• Objet : ${docName}\n` +
                            `• Format : ${selectedDoc.type}\n` +
                            `• Modifié le : ${selectedDoc.modifiedAt.toLocaleDateString()}\n` +
                            `• Catégorie : ${selectedDoc.category || 'Non classé'}\n` +
                            `${selectedDoc.tags && selectedDoc.tags.length > 0 ? `• Tags : ${selectedDoc.tags.join(', ')}\n` : ''}` +
                            `${selectedDoc.contentSnippet ? `\n🔍 EXTRAIT D'ANALYSE IA :\n"${selectedDoc.contentSnippet.slice(0, 300)}..."\n` : ''}` +
                            `\n🔗 LIEN D'ACCÈS :\n${docLink}\n\n` +
                            `-------------------------------------------\n` +
                            `Généré automatiquement par l'intelligence documentaire ZenScan.`
                          );
                          window.location.href = `mailto:?subject=${subject}&body=${body}`;
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title="Envoyer par email"
                      >
                        <Mail className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-6 md:space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black text-text-main tracking-tighter leading-tight">{selectedDoc.name}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <FileType className="w-3.5 h-3.5 text-ai-blue" />
                        <span>{selectedDoc.type} Format</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-ai-blue" />
                        <span>{selectedDoc.size}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-ai-blue" />
                        <span>{selectedDoc.category || 'Non classé'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-ai-blue" />
                        <span>{selectedDoc.modifiedAt.toLocaleDateString()}</span>
                      </div>
                      {selectedDoc.ocrLanguage && (
                        <div className="flex items-center gap-2">
                          <Languages className="w-3.5 h-3.5 text-ai-blue" />
                          <span>{selectedDoc.ocrLanguage}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Snippet Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none">Analyse Vision IA</h4>
                      <div className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">IA Active</span>
                      </div>
                    </div>
                    <div className="p-4 md:p-5 rounded-2xl border border-white/5 bg-white/[0.01] relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-8 h-[1px] bg-ai-blue shadow-[0_0_8px_#4F7CFF]" />
                      <div className="absolute top-0 left-0 w-[1px] h-8 bg-ai-blue shadow-[0_0_8px_#4F7CFF]" />
                      
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-0.5">
                          <AIOrb size="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[11px] md:text-xs text-zinc-400 leading-relaxed italic">
                            "{selectedDoc.contentSnippet || "Flux de données ZenScan..."}"
                          </p>
                          {selectedDoc.contentSnippet && (
                            <button 
                              onClick={handleCopyContent}
                              className="text-[8px] font-black text-ai-blue hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5"
                            >
                              <Copy className="w-2.5 h-2.5" /> COPIER L'INSIGHT
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Selection Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] leading-none">Classement</h4>
                      <div className="text-[8px] font-black text-ai-blue uppercase tracking-widest bg-ai-blue/5 px-2 py-0.5 rounded-full border border-ai-blue/10">Catégorie</div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categoriesList.map(cat => (
                        <button
                          key={cat}
                          onClick={() => handleSetCategory(cat)}
                          className={`px-3 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${
                            selectedDoc.category === cat 
                              ? 'bg-ai-blue/20 border-ai-blue/40 text-white shadow-[0_0_15px_rgba(79,124,255,0.15)]' 
                              : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                      <button
                        onClick={() => handleSetCategory('')}
                        className={`px-3 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${
                          !selectedDoc.category 
                            ? 'bg-white/10 border-white/20 text-white' 
                            : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'
                        }`}
                      >
                        Aucune
                      </button>
                    </div>
                  </div>

                  {/* Tags Management */}
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] leading-none">Étiquetage Intelligent</h4>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-ai-blue leading-none">
                        <Tag className="w-2.5 h-2.5" />
                        <span>AUTO_TAG</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence mode="popLayout">
                        {selectedDoc.tags?.map((tag, i) => (
                          <motion.div
                            key={`${tag}-${i}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-ai-blue/10 border border-ai-blue/20 rounded-xl group"
                          >
                            <span className="text-[10px] md:text-xs font-bold text-ai-blue">{tag}</span>
                            <button 
                              onClick={() => handleRemoveTag(tag)}
                              className="w-3.5 h-3.5 rounded-full bg-ai-blue/20 flex items-center justify-center hover:bg-ai-blue hover:text-white transition-colors"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      <div className="flex items-center gap-2 h-8 md:h-9 px-3 bg-white/5 border border-white/10 rounded-xl focus-within:border-ai-blue/50 transition-all">
                        <input 
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                          placeholder="Nouveau tag..."
                          className="bg-transparent border-none outline-none text-[10px] md:text-xs text-white placeholder:text-zinc-600 w-20 md:w-24"
                        />
                        <button 
                          onClick={handleAddTag}
                          className="w-5 h-5 md:w-6 md:h-6 rounded-md md:rounded-lg bg-ai-blue/20 flex items-center justify-center text-ai-blue hover:bg-ai-blue hover:text-white transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Data Grid */}
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] leading-none">Matrice de Données</h4>
                      <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 leading-none">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>VÉRIFIÉ</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedDoc.extractedData ? Object.entries(selectedDoc.extractedData).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-0.5 px-4 py-3 md:px-5 md:py-4 bg-white/[0.02] border border-white/5 rounded-xl md:rounded-2xl group hover:border-ai-blue/30 transition-all">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-ai-blue/30 group-hover:bg-ai-blue transition-colors" />
                            <span className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{key}</span>
                          </div>
                          <span className="text-xs md:text-sm font-bold text-text-main pl-3.5 transition-colors group-hover:text-ai-blue/90">{value as string}</span>
                        </div>
                      )) : (
                        <div className="p-6 md:p-8 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl md:rounded-3xl">
                          <p className="text-[10px] md:text-xs text-zinc-600 font-medium tracking-tight">Aucune donnée structurelle extraite</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2 md:pt-4">
                    <PrimaryButton 
                      text="Editer" 
                      onClick={() => {
                        if (onSelectDocument) onSelectDocument(selectedDoc);
                        onNavigate(AppView.EDITOR);
                      }}
                      className="flex-1 h-12 md:h-14"
                    />
                    <button 
                      onClick={handleDeleteDoc}
                      className="h-12 md:h-14 rounded-xl md:rounded-[18px] bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-95"
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      Supprimer
                    </button>
                    <button 
                      onClick={handleCopyContent}
                      className="col-span-2 h-12 md:h-14 rounded-xl md:rounded-[18px] bg-white/5 border border-white/10 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                    >
                      <Copy className="w-4 h-4 md:w-5 md:h-5 text-ai-blue" />
                      Copier le contenu extrait
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
