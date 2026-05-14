/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, FileText, X, Sparkles, Download, Share2, Trash2, Calendar, FileType, HardDrive, Tag, Plus, CheckCircle2, Loader2, ZoomIn, ZoomOut, Maximize, LayoutGrid, List, Mail } from 'lucide-react';
import { AppView, DocumentMetadata } from '../types';
import { GlassCard, AIOrb, PrimaryButton, AIChip } from '../components/PremiumComponents';
import { DURATIONS, EASINGS } from '../lib/animations';
import { FadeScale } from '../components/animations/FadeScale';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';

// Memoized Document Card for performance
const DocumentCard = React.memo(({ scan, idx, onClick }: { scan: DocumentMetadata, idx: number, onClick: (doc: DocumentMetadata) => void }) => {
  return (
    <FadeScale delay={idx * 30}>
      <div
        onClick={() => onClick(scan)}
        className="group relative bg-primary-800/40 border border-white/5 rounded-2xl md:rounded-[28px] overflow-hidden hover:border-ai-blue/30 transition-all duration-300 hover:shadow-2xl glass-card p-5 md:p-6 flex flex-col gap-4 cursor-pointer"
      >
        <div className="h-40 md:h-48 rounded-xl md:rounded-[18px] bg-primary-700/30 flex items-center justify-center overflow-hidden border border-white/5 relative group">
          {scan.url ? (
            <img 
              src={scan.url} 
              alt={scan.name} 
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "";
                (e.target as HTMLImageElement).parentElement?.classList.add('flex-col');
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-500">
              <FileText className="w-16 h-16 md:w-20 md:h-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-800/80 via-transparent to-transparent opacity-60"></div>
          {scan.isAiEnhanced && (
            <div className="absolute top-3 right-3 md:top-4 md:right-4 h-7 w-7 md:h-8 md:w-8 rounded-full bg-ai-blue/20 backdrop-blur-md border border-ai-blue/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-ai-blue" />
            </div>
          )}
        </div>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-bold text-base md:text-lg text-text-main leading-tight group-hover:text-ai-blue transition-colors truncate">{scan.name}</h3>
            <div className="flex items-center gap-2 text-[9px] md:text-xs text-zinc-500 tracking-widest font-black uppercase">
              <span>{scan.type}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
              <span>{scan.size}</span>
            </div>
          </div>
        </div>
        {scan.tags && scan.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 md:gap-2 mt-1">
            {scan.tags.slice(0, 2).map((tag, i) => (
              <span key={`${tag}-${i}`} className="text-[8px] md:text-[10px] font-black text-ai-blue/70 bg-ai-blue/5 border border-ai-blue/10 px-2 py-0.5 rounded md:rounded-md uppercase tracking-tighter">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </FadeScale>
  );
});

const DocumentListItem = React.memo(({ scan, idx, onClick }: { scan: DocumentMetadata, idx: number, onClick: (doc: DocumentMetadata) => void }) => {
  return (
    <FadeScale delay={idx * 20}>
      <div 
        onClick={() => onClick(scan)}
        className="group flex items-center gap-4 p-4 md:p-5 bg-primary-800/40 border border-white/5 rounded-2xl md:rounded-[24px] hover:border-ai-blue/30 transition-all duration-300 glass-card cursor-pointer"
      >
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-primary-700/30 flex items-center justify-center flex-shrink-0 group-hover:bg-ai-blue/10 transition-colors">
          <FileText className="w-6 h-6 md:w-8 md:h-8 text-zinc-500 group-hover:text-ai-blue transition-colors" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-bold text-sm md:text-base text-text-main truncate group-hover:text-ai-blue transition-colors">{scan.name}</h3>
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
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>(localStorage.getItem('zenScanLibraryDisplay') as 'grid' || 'grid');
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentMetadata | null>(null);
  const [newTag, setNewTag] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const categoriesList = ['Factures', 'Recettes', 'Contrats', 'Identité', 'Personnel', 'Travail', 'Autre'];

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => setSelectedCategories([]);

  const handleResetZoom = () => setZoomScale(1);
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.5));

  useEffect(() => {
    // Reset zoom when selecting a new document
    setZoomScale(1);
  }, [selectedDoc?.id]);

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

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesCategory = selectedCategories.length === 0 || 
                             (doc.category && selectedCategories.includes(doc.category)) || 
                             (doc.tags && selectedCategories.some(cat => doc.tags.includes(cat)));
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [documents, selectedCategories, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pt-24 md:pt-32 pb-32 px-5 md:px-8 max-w-7xl mx-auto"
    >
      <header className="mb-8 md:mb-12 space-y-4 md:space-y-6">
        <div className="space-y-1">
          <p className="text-[9px] md:text-[10px] font-black text-ai-blue uppercase tracking-[0.4em] leading-none">Archive Numérique</p>
          <h1 className="text-4xl md:text-[52px] font-bold leading-[1.1] tracking-tight text-text-main">
            Library <span className="opacity-40 font-light">Docs</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-500 max-w-lg leading-snug">Gérez et analysez vos archives avec une extraction IA de précision.</p>
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
                selectedCategories.length > 0 ? 'text-ai-blue border-ai-blue/30' : 'text-zinc-500 hover:text-ai-blue'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5 md:w-6 md:h-6" />
              {selectedCategories.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-ai-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-in fade-in zoom-in">
                  {selectedCategories.length}
                </span>
              )}
            </button>
          </div>
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
            />
          ) : (
            <DocumentListItem
              key={scan.id}
              scan={scan}
              idx={idx}
              onClick={setSelectedDoc}
            />
          )
        ))}

        {displayMode === 'grid' && (
          <FadeScale delay={loading ? 0 : filteredDocuments.length * 30}>
            <button 
              onClick={() => onNavigate('SCANNER')}
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
              className="fixed right-0 top-0 bottom-0 w-80 md:w-96 bg-primary-950 border-l border-white/10 z-[121] shadow-2xl overflow-y-auto no-scrollbar p-8"
            >
                <div className="flex justify-between items-center mb-10">
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

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Catégories</h4>
                    {selectedCategories.length > 0 && (
                      <button 
                        onClick={clearFilters}
                        className="text-[10px] font-bold text-ai-blue/60 hover:text-ai-blue transition-colors"
                      >
                        Réinitialiser
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

                <div className="pt-6 border-t border-white/5">
                  <PrimaryButton 
                    text="Appliquer" 
                    onClick={() => setIsFilterOpen(false)} 
                    className="w-full h-14"
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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: DURATIONS.PREMIUM, ease: EASINGS.PREMIUM }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-primary-950 border-l border-white/10 z-[101] shadow-2xl overflow-y-auto no-scrollbar"
            >
              <div className="p-6 md:p-8 space-y-8 md:space-y-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <AIChip label="Visualisation AI" />
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 active:scale-90"
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </button>
                </div>

                {/* Doc Preview Thumbnail Area */}
                <div className="relative aspect-[3/4] bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl group border border-white/5">
                  <div className="absolute inset-0 overflow-auto no-scrollbar">
                    <motion.div 
                      className="w-full h-full flex items-center justify-center p-2"
                      animate={{ scale: zoomScale }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{ transformOrigin: 'top center' }}
                    >
                      {selectedDoc.url && selectedDoc.type === 'PDF' ? (
                        <div className="absolute inset-0 z-0">
                          <iframe
                            src={`${selectedDoc.url}#toolbar=0&navpanes=0&scrollbar=0`}
                            className="w-full h-full border-none"
                            title="PDF Preview"
                          />
                          {/* Overlay to prevent interaction and allow clicking the sidebar background */}
                          <div className="absolute inset-0 bg-transparent z-10" />
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
                  
                  {/* Zoom Controls Overlay */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={handleZoomIn}
                      className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-ai-blue transition-colors"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleResetZoom}
                      className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-ai-blue transition-colors"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleZoomOut}
                      className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-ai-blue transition-colors"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
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
                          if (navigator.share) {
                            navigator.share({
                              title: selectedDoc.name,
                              text: `Check out this document: ${selectedDoc.name}`,
                              url: selectedDoc.url || window.location.href,
                            }).catch(console.error);
                          } else {
                            navigator.clipboard.writeText(selectedDoc.url || window.location.href);
                            alert('Lien de partage copié !');
                          }
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title="Partager"
                      >
                        <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          const subject = encodeURIComponent(`Document: ${selectedDoc.name}`);
                          const body = encodeURIComponent(`Bonjour,\n\nVoici le document "${selectedDoc.name}" que je souhaite partager.\n\nLien: ${window.location.href}`);
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
                    </div>
                  </div>

                  {/* AI Snippet Section */}
                  <GlassCard glow className="p-6 md:p-8 border-ai-blue/10 bg-ai-blue/[0.02]">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                      <AIOrb size="w-7 h-7 md:w-8 md:h-8" />
                      <h4 className="text-sm md:text-base text-text-main font-bold tracking-tight">Analyse Zen Vision</h4>
                    </div>
                    <p className="text-xs md:text-sm text-zinc-400 leading-relaxed italic font-medium">
                      "{selectedDoc.contentSnippet || "Analyse en attente d'indexation complète..."}"
                    </p>
                  </GlassCard>

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
                        onNavigate('EDITOR');
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
