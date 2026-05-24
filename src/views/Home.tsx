/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Image, Sparkles, Clock, LayoutGrid, Zap, Bot, BarChart3, Loader2, HardDrive, Activity, FileSearch, Camera, Brain, Lock, Receipt, Shield, Archive } from 'lucide-react';
import { AppView, DocumentMetadata } from '../types';
import { SMART_SUGGESTIONS } from '../constants';
import { GlassCard, AIOrb, ActionChip, PrimaryButton, AIChip } from '../components/PremiumComponents';
import { useAuth } from '../context/AuthContext';
import { DURATIONS, EASINGS } from '../lib/animations';
import { FadeScale } from '../components/animations/FadeScale';
import { storageService } from '../services/storageService';

interface HomeProps {
  onNavigate: (view: AppView) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const userName = user?.displayName?.split(' ')[0] || 'Voyageur';

  useEffect(() => {
    if (!user) return;
    
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const docs = await storageService.getDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error("Home fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocs();
  }, [user]);

  const recentScans = documents.slice(0, 5);
  const invoiceCount = documents.filter(d => d.category === 'Factures').length;
  const contractCount = documents.filter(d => d.category === 'Contrats').length;
  
  // Calculate storage stats
  const totalSizeMB = documents.reduce((acc, doc) => {
    const size = parseFloat(doc.size) || 0;
    return acc + size;
  }, 0).toFixed(1);

  const stats = {
    size: `${totalSizeMB} MB`,
    count: documents.length
  };

  // Detailed document types storage stats
  const pdfDocs = documents.filter(d => d.type === 'PDF');
  const imageDocs = documents.filter(d => d.type === 'JPG' || d.type === 'PNG');

  const pdfCount = pdfDocs.length;
  const imageCount = imageDocs.length;

  const pdfSizeMBVal = pdfDocs.reduce((acc, doc) => {
    const size = parseFloat(doc.size) || 0;
    return acc + size;
  }, 0);

  const imageSizeMBVal = imageDocs.reduce((acc, doc) => {
    const size = parseFloat(doc.size) || 0;
    return acc + size;
  }, 0);

  const totalCalculatedUsed = pdfSizeMBVal + imageSizeMBVal || 1; // avoid divide by zero

  const pdfPct = Math.round((pdfSizeMBVal / totalCalculatedUsed) * 100) || 0;
  const imagePct = Math.round((imageSizeMBVal / totalCalculatedUsed) * 100) || 0;

  const pdfBarWidth = documents.length > 0 ? `${Math.max(8, Math.round(pdfPct * 0.65))}%` : '45%';
  const imageBarWidth = documents.length > 0 ? `${Math.max(5, Math.round(imagePct * 0.65))}%` : '20%';
  const systemBarWidth = '10%';
  const freeBarWidth = documents.length > 0 ? `${100 - parseFloat(pdfBarWidth) - parseFloat(imageBarWidth) - 10}%` : '25%';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATIONS.NORMAL, ease: EASINGS.MAIN }}
      className="pt-24 md:pt-32 px-5 md:px-8 pb-32 flex flex-col lg:flex-row gap-6 md:gap-10 max-w-7xl mx-auto"
    >
      <div className="flex-1 space-y-8 md:space-y-12 relative">
        {/* Abstract Background Decoration */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-ai-blue/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse" />
        
        <FadeScale delay={0}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 md:space-y-4">
              <div className="flex items-center gap-3">
                <AIChip label="Grade Organisation" />
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]"
                  />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Connecté & Sécurisé</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-text-main leading-tight">
                Station <span className="text-ai-gradient bg-clip-text text-transparent">Zen Scan</span>
              </h1>
              <p className="text-base md:text-xl text-zinc-500 font-medium tracking-tight">Bonjour, {userName}. Systèmes opérationnels et synchronisés.</p>
            </div>

            <div className="flex gap-3 self-start md:self-auto">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1 min-w-[130px] hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Latence IA</span>
                  <Activity className="w-3 h-3 text-emerald-500" />
                </div>
                <span className="text-sm font-bold text-emerald-400">0.8s RTT</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1 min-w-[130px] hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Stockage Cloud</span>
                  <HardDrive className="w-3 h-3 text-ai-blue" />
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '45%' }}
                    className="h-full bg-ai-blue shadow-[0_0_8px_#4F7CFF]" 
                  />
                </div>
              </div>
            </div>
          </div>
        </FadeScale>

        {/* Pro Quick Actions Hub - Refined Bento Style */}
        <FadeScale delay={150}>
           <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] px-2 leading-none">Modules d'accès rapide</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Analytique', icon: FileSearch, color: 'hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30', desc: 'ZenInsights', path: AppView.LIBRARY },
                { label: 'Capture IA', icon: Camera, color: 'hover:bg-ai-blue/10 hover:text-ai-blue hover:border-ai-blue/30', desc: 'Scan Direct', path: AppView.SCANNER },
                { label: 'Assistant', icon: Brain, color: 'hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30', desc: 'Oracle Zen', path: AppView.AI },
                { label: 'Vault', icon: Lock, color: 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30', desc: 'Archives L2', path: AppView.LIBRARY }
              ].map((action, idx) => (
                <motion.button 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8, y: 15 }}
                  animate={{ 
                    opacity: 1, 
                    scale: [0.8, 1.08, 0.96, 1], 
                    y: 0 
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: idx * 0.12,
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate(action.path)}
                  className={`group p-6 rounded-[32px] bg-white/[0.03] border border-white/5 transition-all flex flex-col items-center gap-4 text-zinc-500 shadow-sm ${action.color}`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center transition-all group-hover:bg-white/10 group-hover:shadow-lg">
                    <action.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">{action.label}</p>
                    <p className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{action.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </FadeScale>

        {/* AI Intelligence Hub - Interactive Bento */}
        <FadeScale delay={200}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <GlassCard glow className="lg:col-span-8 p-8 md:p-12 relative group overflow-hidden">
              {/* Decorative AI Ring */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square border border-white/5 rounded-full pointer-events-none group-hover:border-ai-blue/10 transition-colors duration-1000" />
              
              <div className="space-y-10 relative">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                   <div className="relative">
                     <AIOrb size="w-16 h-16 md:w-24 md:h-24" />
                     <motion.div 
                       animate={{ rotate: 360 }}
                       transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                       className="absolute -inset-4 border border-dashed border-ai-blue/20 rounded-full"
                     />
                   </div>
                   <div className="space-y-1">
                     <h2 className="text-2xl md:text-3xl font-extrabold text-text-main tracking-tighter">Noyau d'Intelligence</h2>
                     <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed max-w-md">Analyse sémantique active. Vos documents sont classés, indexés et convertis en connaissances actionnables.</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Archives', count: documents.length, icon: Archive, color: 'text-white' },
                    { label: 'Financier', count: invoiceCount, icon: Receipt, color: 'text-ai-blue' },
                    { label: 'Juridique', count: contractCount, icon: Shield, color: 'text-emerald-400' },
                    { label: 'Confiance', count: '99.8%', icon: Sparkles, color: 'text-purple-400' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-3 hover:bg-white/[0.05] transition-colors group/stat">
                       <stat.icon className={`w-5 h-5 ${stat.color} opacity-30 group-hover/stat:opacity-100 transition-opacity`} />
                       <div>
                         <p className="text-2xl font-black text-white group-hover/stat:scale-110 origin-left transition-transform">{stat.count}</p>
                         <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">{stat.label}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <GlassCard className="p-8 h-full border-emerald-500/10 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600">Zen Engine Status</span>
                    <span className="flex items-center gap- relative text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-1 h-1 rounded-full bg-emerald-500 mr-2" />
                      OPTIMAL
                    </span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Neural Throughput', value: 'High', color: 'bg-emerald-500/40' },
                      { label: 'OCR Calibration', value: 'Fine', color: 'bg-ai-blue/40' },
                      { label: 'Encryption Key L2', value: 'Active', color: 'bg-purple-500/40' }
                    ].map((row, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500">
                          <span>{row.label}</span>
                          <span className="text-white/60">{row.value}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '90%' }}
                            transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                            className={`h-full ${row.color}`} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5 italic">
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed italic opacity-60">"Le système est prêt pour le traitement de masse."</p>
                </div>
              </GlassCard>
            </div>
          </div>
        </FadeScale>

        {/* Improved Document Gallery */}
        <div className="space-y-6 md:space-y-8">
          <FadeScale delay={200}>
            <div className="flex justify-between items-end px-2">
              <div className="space-y-1">
                <p className="text-[9px] md:text-[10px] font-black text-ai-blue uppercase tracking-[0.4em] leading-none italic">Archives Récentes</p>
                <h3 className="text-xl md:text-2xl font-extrabold text-text-main tracking-tighter leading-none">Dernières Captures</h3>
              </div>
              <button 
                onClick={() => onNavigate(AppView.LIBRARY)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-zinc-500 hover:text-white transition-all flex items-center gap-2 group"
              >
                Explorer la base <LayoutGrid className="w-3 h-3 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </FadeScale>

          <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-6 -mx-2 px-2">
            {loading ? (
              <div className="flex items-center justify-center p-12 w-full">
                <Loader2 className="w-8 h-8 text-ai-blue animate-spin" />
              </div>
            ) : recentScans.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-white/5 rounded-[40px] w-full flex flex-col items-center justify-center text-zinc-600 gap-4 bg-white/[0.01]">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <FileText className="w-8 h-8 opacity-20" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-black tracking-widest leading-none mb-1">Base de données vide</p>
                  <p className="text-[8px] font-bold opacity-40 uppercase tracking-tight">En attente de synchronisation</p>
                </div>
                <button 
                  onClick={() => onNavigate(AppView.SCANNER)}
                  className="px-8 py-3 bg-ai-blue/10 text-ai-blue rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-ai-blue/20 transition-all border border-ai-blue/20"
                >
                  Scanner maintenance
                </button>
              </div>
            ) : recentScans.map((scan, i) => (
              <FadeScale key={`gallery-${scan.id}-${i}`} delay={300 + (i * 80)}>
                <div 
                  className="flex-shrink-0 cursor-pointer group"
                  onClick={() => onNavigate(AppView.LIBRARY)}
                >
                  <div className="w-48 md:w-56 overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] p-4 space-y-4 hover:border-ai-blue/30 transition-all duration-500 shadow-sm hover:shadow-2xl">
                    <div className="relative aspect-[1/1.2] bg-primary-900/40 rounded-2xl overflow-hidden border border-white/5">
                      {scan.url ? (
                        <img 
                          src={scan.url} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-10">
                           <FileText className="w-12 h-12 text-primary-200" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                      
                      <div className="absolute bottom-3 left-3 flex gap-1.5 font-sans">
                         <span className="px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded border border-white/10 text-[7px] font-black text-white/50 uppercase tracking-widest">{scan.type}</span>
                         {scan.isAiEnhanced && (
                           <span className="px-1.5 py-0.5 bg-ai-blue/40 backdrop-blur-md rounded border border-ai-blue/40 text-[7px] font-black text-white uppercase tracking-widest">IA</span>
                         )}
                      </div>
                    </div>
                    <div className="space-y-1.5 px-1 pb-1">
                      <h4 className="text-xs font-bold text-text-main truncate tracking-tight">{scan.name}</h4>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-1.5 opacity-40">
                           <Clock className="w-2.5 h-2.5 text-zinc-500" />
                           <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">{scan.modifiedAt.toLocaleDateString()}</span>
                         </div>
                         <span className="text-[8px] font-black text-ai-blue uppercase tracking-widest opacity-40">{scan.size}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeScale>
            ))}
          </div>
        </div>

         {/* Technical Storage Analytics */}
        <FadeScale delay={400}>
           <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                       <HardDrive className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Analyse de Stockage</h4>
                       <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter mt-1">Allocation de partition ZenFS v2.0</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-sm font-black text-white tracking-tighter">{stats.size} / 5.0 GB</p>
                    <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest opacity-60">Status: Optimal</p>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div className="flex h-3 gap-1 rounded-full overflow-hidden">
                    <div className="h-full bg-ai-blue shadow-[0_0_10px_#4F7CFF] transition-all duration-500" style={{ width: pdfBarWidth }} />
                    <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10B981] transition-all duration-500" style={{ width: imageBarWidth }} />
                    <div className="h-full bg-purple-500 shadow-[0_0_10px_#A855F7] transition-all duration-500" style={{ width: systemBarWidth }} />
                    <div className="h-full bg-white/5 transition-all duration-500" style={{ width: freeBarWidth }} />
                 </div>
                 <div className="flex flex-wrap gap-4 pt-1">
                    {[
                       { label: 'Documents (PDF)', color: 'bg-ai-blue' },
                       { label: 'Médias (Images)', color: 'bg-emerald-500' },
                       { label: 'Système', color: 'bg-purple-500' },
                       { label: 'Libre', color: 'bg-white/10' }
                    ].map((item, idx) => (
                       <div key={idx} className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{item.label}</span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Detailed Storage Breakdown by Document Type */}
              <div className="border-t border-white/5 pt-5 space-y-4">
                 <div className="flex items-center justify-between">
                    <h5 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none">Détails de Stockage par Format</h5>
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Analyse Temps Réel</span>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* PDF Format Card */}
                    <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-red-400/10 rounded-xl flex items-center justify-center border border-red-500/20">
                                <FileText className="w-4 h-4 text-red-400" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-wider leading-none">Format PDF</p>
                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{pdfCount} {pdfCount > 1 ? 'fichiers' : 'fichier'}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-xs font-black text-white">{pdfSizeMBVal.toFixed(1)} MB</span>
                             <span className="text-[8px] font-mono font-bold text-red-400 block mt-0.5">{pdfPct}%</span>
                          </div>
                       </div>
                       
                       <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${pdfPct}%` }}
                             transition={{ duration: 1, ease: 'easeOut' }}
                             className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                          />
                       </div>
                    </div>

                    {/* Image Format Card */}
                    <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                <Image className="w-4 h-4 text-blue-400" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-wider leading-none">Format Images</p>
                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{imageCount} {imageCount > 1 ? 'fichiers' : 'fichier'}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-xs font-black text-white">{imageSizeMBVal.toFixed(1)} MB</span>
                             <span className="text-[8px] font-mono font-bold text-blue-400 block mt-0.5">{imagePct}%</span>
                          </div>
                       </div>
                       
                       <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${imagePct}%` }}
                             transition={{ duration: 1, ease: 'easeOut' }}
                             className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </FadeScale>
      </div>

      {/* Workspace Sidebar */}
      <div className="lg:w-80 space-y-6 md:space-y-8">
        <div className="space-y-4 md:space-y-6">
          <FadeScale delay={500}>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-2 leading-none">AI Workflow</p>
          </FadeScale>
          <FadeScale delay={600}>
            <GlassCard glow className="p-6 md:p-8 border-ai-blue/20">
               <div className="flex flex-col gap-5 md:gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-ai-blue flex items-center justify-center shadow-[0_0_15px_rgba(79,124,255,0.4)]">
                      <Bot className="w-5 h-5 md:w-6 md:h-6 text-accent-text" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-text-main">Assistant Core</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs md:text-sm leading-relaxed text-zinc-300">
                      J'ai analysé vos documents récents. 2 rapports sont prêts à être exportés.
                    </div>
                  </div>
                  <PrimaryButton 
                    text="Ouvrir l'Assistant" 
                    onClick={() => onNavigate(AppView.AI)}
                    className="w-full h-12 md:h-14"
                  />
               </div>
            </GlassCard>
          </FadeScale>
          
          <div className="gap-3 md:gap-4 flex flex-col">
          {SMART_SUGGESTIONS.slice(0, 2).map((s, i) => (
            <FadeScale key={s.id} delay={700 + (i * 100)}>
              <div className="w-full">
                <GlassCard className="p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-ai-blue" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-text-main text-xs md:text-sm">{s.title}</h4>
                      <p className="text-[10px] md:text-xs text-zinc-500 font-medium leading-tight">{s.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </FadeScale>
          ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
