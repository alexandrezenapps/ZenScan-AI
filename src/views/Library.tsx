/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, FileText, X, Sparkles, Download, Share2, Trash2, Calendar, FileType, HardDrive, Tag, Plus } from 'lucide-react';
import { AppView, DocumentMetadata } from '../types';
import { RECENT_SCANS } from '../constants';
import { GlassCard, AIOrb, PrimaryButton, AIChip } from '../components/PremiumComponents';
import { DURATIONS, EASINGS } from '../lib/animations';
import { FadeScale } from '../components/animations/FadeScale';

interface LibraryProps {
  onNavigate: (view: AppView) => void;
}

export default function Library({ onNavigate }: LibraryProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>(RECENT_SCANS);
  const [selectedDoc, setSelectedDoc] = useState<DocumentMetadata | null>(null);
  const [newTag, setNewTag] = useState('');
  const categories = ['All', 'Recent', 'Invoices', 'Personal', 'Work'];

  const handleAddTag = () => {
    if (!selectedDoc || !newTag.trim()) return;
    
    const updatedDoc = {
      ...selectedDoc,
      tags: [...(selectedDoc.tags || []), newTag.trim()]
    };
    
    setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? updatedDoc : d));
    setSelectedDoc(updatedDoc);
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedDoc) return;
    
    const updatedDoc = {
      ...selectedDoc,
      tags: (selectedDoc.tags || []).filter(t => t !== tagToRemove)
    };
    
    setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? updatedDoc : d));
    setSelectedDoc(updatedDoc);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pt-32 pb-32 px-8 max-w-7xl mx-auto"
    >
      <header className="mb-12 space-y-6">
        <div>
          <h1 className="text-[52px] font-bold leading-[1.1] tracking-tight mb-2 text-white">
            Document <span className="opacity-40 font-light">Library</span>
          </h1>
          <p className="text-zinc-500 max-w-lg">Manage and analyze your digital archive with ultra-precise AI extraction.</p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full h-14 bg-primary-800/50 border border-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-ai-blue/30 transition-all outline-none glass-card"
            />
          </div>
          <button className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center text-gray-400 hover:text-ai-blue transition-colors">
            <SlidersHorizontal className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`px-8 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                i === 0 ? 'bg-ai-blue text-white ai-glow' : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {documents.map((scan, idx) => (
          <FadeScale key={scan.id} delay={idx * 50}>
            <div
              onClick={() => setSelectedDoc(scan)}
              className="group relative bg-primary-800/40 border border-white/5 rounded-[28px] overflow-hidden hover:border-ai-blue/30 transition-all duration-300 hover:shadow-2xl glass-card p-6 flex flex-col gap-4 cursor-pointer"
            >
              <div className="h-48 rounded-[18px] bg-primary-700/30 flex items-center justify-center overflow-hidden border border-white/5 relative group">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <FileText className="w-20 h-20" />
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-primary-800/80 via-transparent to-transparent opacity-60"></div>
                
                {/* AI Badge Overlay */}
                {scan.isAiEnhanced && (
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-ai-blue/20 backdrop-blur-md border border-ai-blue/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-ai-blue" />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-white leading-tight group-hover:text-ai-blue transition-colors truncate">{scan.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 tracking-widest font-medium uppercase">
                    <span>{scan.type}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                    <span>{scan.size}</span>
                  </div>
                </div>
              </div>
              
              {scan.tags && scan.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {scan.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] font-black text-ai-blue/70 bg-ai-blue/5 border border-ai-blue/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </FadeScale>
        ))}

        <FadeScale delay={documents.length * 50}>
          <button className="group border-2 border-dashed border-white/10 rounded-[28px] flex flex-col items-center justify-center p-8 hover:border-ai-blue/50 hover:bg-ai-blue/5 transition-all aspect-video md:aspect-auto w-full h-full min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-primary-800 flex items-center justify-center mb-4 group-hover:bg-ai-blue transition-all duration-300">
              <Search className="w-8 h-8 text-gray-500 group-hover:text-white" />
            </div>
            <p className="font-bold text-gray-500 group-hover:text-ai-blue">Scan or Upload</p>
          </button>
        </FadeScale>
      </div>

      {/* Document Detail Sidebar */}
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
              <div className="p-8 space-y-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <AIChip label="Preview Mode" />
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 active:scale-90"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Doc Preview Thumbnail Area */}
                <div className="relative aspect-[3/4] bg-white rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.4)] group">
                  <div className="absolute inset-0 p-10 space-y-6">
                    <div className="h-6 w-1/2 bg-gray-100 rounded-lg" />
                    <div className="space-y-3">
                      <div className="h-1.5 w-full bg-gray-50 rounded-full" />
                      <div className="h-1.5 w-full bg-gray-50 rounded-full" />
                      <div className="h-1.5 w-2/3 bg-gray-50 rounded-full" />
                    </div>
                    <div className="pt-20 flex justify-center text-primary-200">
                      <FileText className="w-40 h-40 opacity-20" />
                    </div>
                  </div>
                  
                  {/* Subtle Scan Effect */}
                  <motion.div
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-ai-blue shadow-[0_0_20px_#4F7CFF] z-10 opacity-30"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent p-6 flex items-end">
                    <div className="flex gap-4">
                      <button className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:scale-110 transition-transform">
                        <Download className="w-5 h-5" />
                      </button>
                      <button className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-black shadow-lg hover:scale-110 transition-transform">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tighter leading-tight">{selectedDoc.name}</h2>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <FileType className="w-4 h-4 text-ai-blue" />
                        <span>{selectedDoc.type} Format</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-ai-blue" />
                        <span>{selectedDoc.size}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-ai-blue" />
                        <span>{selectedDoc.modifiedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Snippet Section */}
                  <GlassCard glow className="p-8 border-ai-blue/10 bg-ai-blue/[0.02]">
                    <div className="flex items-center gap-3 mb-4">
                      <AIOrb size="w-8 h-8" />
                      <h4 className="text-white font-bold tracking-tight">Analyse Intelligence Zen</h4>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed italic font-medium">
                      "{selectedDoc.contentSnippet || "Analyse en attente d'indexation complète..."}"
                    </p>
                  </GlassCard>

                  {/* Tags Management */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Mots-clés / Tags</h4>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-ai-blue">
                        <Tag className="w-3 h-3" />
                        <span>ORGANISATION</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence mode="popLayout">
                        {selectedDoc.tags?.map(tag => (
                          <motion.div
                            key={tag}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex items-center gap-2 px-4 py-2 bg-ai-blue/10 border border-ai-blue/20 rounded-xl group"
                          >
                            <span className="text-xs font-bold text-ai-blue">{tag}</span>
                            <button 
                              onClick={() => handleRemoveTag(tag)}
                              className="w-4 h-4 rounded-full bg-ai-blue/20 flex items-center justify-center hover:bg-ai-blue hover:text-white transition-colors"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      <div className="flex items-center gap-2 h-9 px-3 bg-white/5 border border-white/10 rounded-xl focus-within:border-ai-blue/50 transition-all">
                        <input 
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                          placeholder="Ajouter un tag..."
                          className="bg-transparent border-none outline-none text-xs text-white placeholder:text-zinc-600 w-24"
                        />
                        <button 
                          onClick={handleAddTag}
                          className="w-6 h-6 rounded-lg bg-ai-blue/20 flex items-center justify-center text-ai-blue hover:bg-ai-blue hover:text-white transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Data Grid */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Données Extraites</h4>
                      <AIChip label="Validé" />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedDoc.extractedData ? Object.entries(selectedDoc.extractedData).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1 px-5 py-4 bg-white/[0.03] border border-white/5 rounded-2xl group hover:border-ai-blue/30 transition-all">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-ai-blue/50 group-hover:bg-ai-blue transition-colors" />
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{key}</span>
                          </div>
                          <span className="text-sm font-bold text-white pl-3.5 transition-colors group-hover:text-ai-blue/90">{value as string}</span>
                        </div>
                      )) : (
                        <div className="p-8 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
                          <p className="text-xs text-zinc-600 font-medium tracking-tight">Aucune donnée structurelle extraite</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <PrimaryButton 
                      text="Ouvrir l'Editeur" 
                      onClick={() => onNavigate('EDITOR')}
                      className="flex-1"
                    />
                    <button className="h-14 rounded-[18px] bg-red-500/10 border border-red-500/20 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-95">
                      <Trash2 className="w-5 h-5" />
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
