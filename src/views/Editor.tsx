/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crop, RotateCw, Filter, FileText, Check, Save, 
  Download, MoreHorizontal, PenTool, Sparkles, 
  FileSearch, Languages, X, Plus, Trash2, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { AppView, DocumentMetadata } from '../types';

interface EditorProps {
  onNavigate: (view: AppView) => void;
  document: DocumentMetadata | null;
}

export default function Editor({ onNavigate, document }: EditorProps) {
  const [activeFilter, setActiveFilter] = useState('Original');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const [pages, setPages] = useState<number[]>([1, 2, 3]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  const filters = [
    { name: 'Original', icon: FileText },
    { name: 'HD Scan', icon: Save },
    { name: 'N&B', icon: Filter },
    { name: 'Contrast+', icon: RotateCw },
  ];

  const addPage = () => {
    setPages(prev => [...prev, prev.length + 1]);
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

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      onNavigate('LIBRARY');
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32 px-5 md:px-6 max-w-7xl mx-auto"
    >
      {/* Editor Toolbar */}
      <div className="sticky top-20 z-40 bg-primary-900/60 backdrop-blur-xl border-b border-white/5 -mx-5 md:-mx-6 px-5 md:px-6 py-3 md:py-4 mb-6 md:mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <ToolbarButton icon={Crop} label="Crop" />
          <ToolbarButton icon={RotateCw} label="Rotate" />
          <ToolbarButton icon={Filter} label="Filters" active />
          <ToolbarButton 
            icon={PenTool} 
            label="Sign" 
            active={activeTool === 'SIGN'} 
            onClick={() => setActiveTool(activeTool === 'SIGN' ? null : 'SIGN')} 
          />
          <div className="ml-auto flex gap-2">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className={`px-4 md:px-8 py-2 md:py-2.5 bg-ai-blue text-white rounded-full font-bold text-[10px] md:text-sm ai-glow active:scale-95 transition-all flex items-center gap-2 ${isExporting ? 'opacity-50' : ''}`}
            >
              {isExporting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <RotateCw className="w-4 h-4" />
                </motion.div>
              ) : <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              <span className="hidden xs:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              <span className="xs:hidden">{isExporting ? '...' : 'PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
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
              key={currentPageIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-[320px] md:max-w-[420px] aspect-[1/1.41] shadow-[0_40px_70px_rgba(0,0,0,0.4)] rounded-sm overflow-hidden relative"
            >
              <div className="p-6 md:p-10 space-y-4 md:space-y-6 opacity-80 select-none">
                <div className="flex justify-between items-start">
                   <div className="h-6 md:h-8 w-1/3 bg-gray-200 rounded"></div>
                   <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-ai-blue/5 border border-ai-blue/10 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-ai-blue">
                     #{pages[currentPageIndex]}
                   </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="h-1.5 md:h-2 w-full bg-gray-100 rounded-full"></div>
                  <div className="h-1.5 md:h-2 w-full bg-gray-100 rounded-full"></div>
                  <div className="h-1.5 md:h-2 w-4/5 bg-gray-100 rounded-full"></div>
                  <div className="h-1.5 md:h-2 w-full bg-gray-100 rounded-full"></div>
                </div>
                
                {currentPageIndex === 0 && (
                  <div className="pt-10 md:pt-16 space-y-3 md:space-y-4">
                     <div className="h-24 md:h-32 w-full bg-zinc-50 rounded-xl border-2 border-zinc-100 border-dashed flex items-center justify-center relative">
                       {signed ? (
                         <motion.div initial={{ scale: 0, rotate: -5 }} animate={{ scale: 1, rotate: -2 }} className="absolute">
                           <svg width="140" height="50" viewBox="0 0 120 40" className="text-ai-blue drop-shadow-sm md:w-[180px] md:h-[60px]">
                             <path d="M10 30 Q30 10 50 25 T90 15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                           </svg>
                         </motion.div>
                       ) : (
                         <div className="text-center">
                           <PenTool className="w-5 h-5 md:w-6 md:h-6 text-zinc-300 mx-auto mb-1.5 md:mb-2" />
                           <span className="text-[9px] md:text-[10px] text-zinc-300 font-black uppercase tracking-widest leading-none">Sign required</span>
                         </div>
                       )}
                     </div>
                  </div>
                )}

                {currentPageIndex > 0 && (
                  <div className="pt-2 md:pt-4 grid grid-cols-2 gap-3 md:gap-4">
                     <div className="h-16 md:h-20 bg-zinc-50 rounded-lg"></div>
                     <div className="h-16 md:h-20 bg-zinc-50 rounded-lg"></div>
                     <div className="h-16 md:h-20 bg-zinc-50 rounded-lg"></div>
                     <div className="h-16 md:h-20 bg-zinc-50 rounded-lg"></div>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 border-[1px] border-black/5 pointer-events-none"></div>
            </motion.div>

            {/* Signature Pad Floating */}
            <AnimatePresence>
              {activeTool === 'SIGN' && (
                <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="absolute bottom-10 inset-x-10 glass-card p-6 rounded-[32px] border border-ai-blue/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 text-center"
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Signature Digitale</span>
                    <button onClick={() => setActiveTool(null)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="h-32 bg-primary-900/50 rounded-2xl border border-white/5 flex items-center justify-center cursor-crosshair group">
                     <span className="text-xs text-gray-600 font-bold uppercase tracking-widest group-hover:opacity-0 transition-opacity">Tracez votre signature</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button className="h-12 bg-white/5 text-gray-500 font-bold rounded-xl text-xs uppercase hover:bg-white/10" onClick={() => setSigned(false)}>Reset</button>
                    <button className="h-12 bg-ai-gradient text-white font-bold rounded-xl text-xs uppercase ai-glow" onClick={() => { setSigned(true); setActiveTool(null); }}>Apply</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Multi-Page Thumbnails */}
          <div className="bg-primary-800/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 overflow-hidden">
             <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Pages du Document</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-ai-blue/10 text-ai-blue px-2 py-0.5 rounded-full font-bold">{pages.length} Pages</span>
                </div>
             </div>
             
             <div className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-2">
                <AnimatePresence mode="popLayout">
                  {pages.map((page, idx) => (
                    <motion.div
                      key={`page-${page}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      layout
                      className="flex flex-col items-center gap-3 group/thumb"
                    >
                      <button 
                        onClick={() => setCurrentPageIndex(idx)}
                        className={`relative w-24 aspect-[1/1.41] rounded-lg overflow-hidden transition-all border-2 ${currentPageIndex === idx ? 'border-ai-blue ai-glow scale-105 shadow-xl' : 'border-white/5 hover:border-white/20'}`}
                      >
                         <div className="absolute inset-0 bg-white p-2 flex flex-col gap-1.5 opacity-40">
                           <div className="h-1.5 w-1/2 bg-gray-200 rounded-full" />
                           <div className="h-1 w-full bg-gray-100 rounded-full" />
                           <div className="h-1 w-full bg-gray-100 rounded-full" />
                           <div className="h-1 w-4/5 bg-gray-100 rounded-full" />
                         </div>
                         <div className="absolute top-1 right-1 w-4 h-4 bg-ai-blue rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                           {idx + 1}
                         </div>
                      </button>
                      <button 
                        onClick={() => removePage(idx)}
                        className="opacity-0 group-hover/thumb:opacity-100 p-1.5 rounded-full hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                  
                  <motion.button 
                    layout
                    onClick={addPage}
                    className="w-24 aspect-[1/1.41] rounded-xl border-2 border-white/5 border-dashed flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-ai-blue/30 transition-all group shrink-0"
                  >
                    <Plus className="w-6 h-6 text-gray-600 group-hover:text-ai-blue" />
                    <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Add Page</span>
                  </motion.button>
                </AnimatePresence>
             </div>
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
                <QuickAction icon={Sparkles} label="Résumé" />
                <QuickAction icon={Languages} label="Traduit" />
                <QuickAction icon={FileSearch} label="Analyse" />
                <QuickAction icon={PenTool} label="Signe" />
             </div>
          </div>

          <div className="glass-card rounded-[32px] p-8 border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent">
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Save className="w-5 h-5 text-ai-blue" /> Document Metadata
             </h3>
             <div className="space-y-4">
                <MetaItem label="Nom du fichier" value={document?.name || "Sans titre"} />
                <MetaItem label="Créé le" value={document?.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'N/A'} />
                <MetaItem label="Pages" value={document ? `${pages.length} Pages` : 'N/A'} />
                <MetaItem label="Taille" value={document?.size || 'N/A'} />
                <MetaItem label="Type" value={document?.type || 'N/A'} />
             </div>
             
             <div className="pt-10 flex flex-col gap-3">
                <button 
                   onClick={() => onNavigate('LIBRARY')}
                   className="w-full h-14 bg-ai-gradient text-white font-bold rounded-2xl flex items-center justify-center gap-2 ai-glow active:scale-95 transition-transform"
                >
                  Save to Archive
                </button>
                <button className="w-full h-14 bg-primary-800 text-gray-300 font-bold rounded-2xl border border-white/5 hover:bg-primary-700 transition-colors">
                  Share Document
                </button>
             </div>
          </div>
        </div>
      </div>
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

function QuickAction({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-ai-blue/30 transition-all group active:scale-95">
      <Icon className="w-5 h-5 text-gray-500 group-hover:text-ai-blue transition-colors mb-2" />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white">{label}</span>
    </button>
  );
}

function MetaItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs font-bold text-white truncate max-w-[150px]">{value}</span>
    </div>
  );
}
