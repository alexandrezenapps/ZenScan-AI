/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle,
  Folder, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Sliders, 
  AlertCircle,
  Zap,
  ArrowRight,
  ShieldAlert,
  Archive,
  Star,
  Check
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { DocumentMetadata } from '../types';

export interface AutomationRule {
  id: string;
  name: string;
  keyword: string; // keyword searched in name or contentSnippet
  field: 'all' | 'name' | 'content';
  folderId?: string; // target folder
  tags: string[]; // tags to add
  isFavorite?: boolean; // mark as favorite
  prefix?: string; // add prefix to name
  isActive: boolean;
}

export default function ZenScanAutomations() {
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: '',
    keyword: '',
    field: 'all',
    tags: [],
    folderId: '',
    isFavorite: false,
    prefix: '',
    isActive: true
  });
  
  const [tagInput, setTagInput] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  
  // Folders loaded from localStorage
  const [folders, setFolders] = useState<{ id: string; name: string; color: string }[]>([]);
  
  // Bulk run states
  const [isRunningBulk, setIsRunningBulk] = useState<boolean>(false);
  const [bulkResult, setBulkResult] = useState<{ docsProcessed: number; docsModified: number } | null>(null);

  // Load custom folders
  const loadFolders = useCallback(() => {
    const saved = localStorage.getItem('zenScanFolders');
    if (saved) {
      try {
        setFolders(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse folders", e);
      }
    } else {
      // Default fallback folders just in case
      setFolders([
        { id: 'f_invoices', name: 'Factures & Reçus', color: '#10B981' },
        { id: 'f_personal', name: 'Personnel & ID', color: '#3B82F6' },
        { id: 'f_archive', name: 'Archives Pro', color: '#8B5CF6' }
      ]);
    }
  }, []);

  // Initialize and load rules from LocalStorage
  const loadRules = useCallback(() => {
    const savedRules = localStorage.getItem('zenScanAutomationRules');
    if (savedRules) {
      try {
        setRules(JSON.parse(savedRules));
      } catch (e) {
        console.error("Failed to load rules", e);
      }
    } else {
      // Initialize with default template rules
      const defaultRules: AutomationRule[] = [
        {
          id: 'rule_1',
          name: 'Tri Factures & Reçus',
          keyword: 'facture',
          field: 'all',
          folderId: 'f_invoices',
          tags: ['Comptabilité', 'Finance'],
          isFavorite: false,
          isActive: true
        },
        {
          id: 'rule_2',
          name: 'Edf & Énergie',
          keyword: 'electricity',
          field: 'content',
          folderId: 'f_invoices',
          tags: ['Maison', 'EDF'],
          isFavorite: true,
          prefix: 'EDF_',
          isActive: true
        },
        {
          id: 'rule_3',
          name: 'Administration & Contrats',
          keyword: 'contrat',
          field: 'name',
          folderId: 'f_archive',
          tags: ['Contrats', 'Offre'],
          isActive: false
        }
      ];
      setRules(defaultRules);
      localStorage.setItem('zenScanAutomationRules', JSON.stringify(defaultRules));
    }
  }, []);

  useEffect(() => {
    loadRules();
    loadFolders();

    // Listen to custom folder additions or deletions during active configuration
    const handleFoldersUpdated = () => {
      loadFolders();
    };
    window.addEventListener('zen-scan-folders-changed', handleFoldersUpdated);
    return () => {
      window.removeEventListener('zen-scan-folders-changed', handleFoldersUpdated);
    };
  }, [loadRules, loadFolders]);

  const saveRules = (updatedRules: AutomationRule[]) => {
    setRules(updatedRules);
    localStorage.setItem('zenScanAutomationRules', JSON.stringify(updatedRules));
  };

  const handleToggleRule = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    saveRules(updated);
  };

  const handleDeleteRule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = rules.filter(r => r.id !== id);
    saveRules(updated);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const cleanTag = tagInput.trim();
    const currentTags = newRule.tags || [];
    if (!currentTags.includes(cleanTag)) {
      setNewRule({
        ...newRule,
        tags: [...currentTags, cleanTag]
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = newRule.tags || [];
    setNewRule({
      ...newRule,
      tags: currentTags.filter(t => t !== tag)
    });
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.keyword) {
      alert("Veuillez renseigner un nom et un mot-clé de déclenchement.");
      return;
    }

    const rule: AutomationRule = {
      id: 'rule_' + Math.random().toString(36).substring(2, 11),
      name: newRule.name.trim(),
      keyword: newRule.keyword.trim().toLowerCase(),
      field: newRule.field || 'all',
      folderId: newRule.folderId || undefined,
      tags: newRule.tags || [],
      isFavorite: !!newRule.isFavorite,
      prefix: newRule.prefix?.trim() || undefined,
      isActive: true
    };

    const updated = [...rules, rule];
    saveRules(updated);
    
    // Reset form
    setNewRule({
      name: '',
      keyword: '',
      field: 'all',
      tags: [],
      folderId: '',
      isFavorite: false,
      prefix: '',
      isActive: true
    });
    setTagInput('');
    setShowAddForm(false);
  };

  // Run automations on all existing documents in storage
  const handleRunAllRules = async () => {
    setIsRunningBulk(true);
    setBulkResult(null);

    try {
      const documents = await storageService.getDocuments();
      let modifiedCount = 0;

      const activeRules = rules.filter(r => r.isActive);
      if (activeRules.length === 0) {
        setIsRunningBulk(false);
        alert("Aucune règle d'automatisation n'est actuellement activée.");
        return;
      }

      // Simulate indexing & rule assessment logic beautifully
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedDocs = await Promise.all(documents.map(async (doc) => {
        let isModified = false;
        let finalDoc = { ...doc };

        activeRules.forEach(rule => {
          const nameMatch = finalDoc.name.toLowerCase().includes(rule.keyword);
          const snippetMatch = (finalDoc.contentSnippet || '').toLowerCase().includes(rule.keyword);
          
          let isMatch = false;
          if (rule.field === 'name') isMatch = nameMatch;
          else if (rule.field === 'content') isMatch = snippetMatch;
          else isMatch = nameMatch || snippetMatch;

          if (isMatch) {
            // Apply folder move if defined
            if (rule.folderId && finalDoc.folderId !== rule.folderId) {
              const targetFolderExists = folders.some(f => f.id === rule.folderId);
              if (targetFolderExists) {
                finalDoc.folderId = rule.folderId;
                isModified = true;
              }
            }

            // Apply tags
            if (rule.tags && rule.tags.length > 0) {
              const currentTags = finalDoc.tags || [];
              const combinedTags = Array.from(new Set([...currentTags, ...rule.tags]));
              if (combinedTags.length !== currentTags.length) {
                finalDoc.tags = combinedTags;
                isModified = true;
              }
            }

            // Apply Favorite
            if (rule.isFavorite && !finalDoc.isFavorite) {
              finalDoc.isFavorite = true;
              isModified = true;
            }

            // Apply Prefix Naming
            if (rule.prefix && !finalDoc.name.startsWith(rule.prefix)) {
              finalDoc.name = `${rule.prefix}${finalDoc.name}`;
              isModified = true;
            }
          }
        });

        if (isModified) {
          modifiedCount++;
          // Save document back through service
          return await storageService.saveDocument(finalDoc);
        }
        return doc;
      }));

      setBulkResult({
        docsProcessed: documents.length,
        docsModified: modifiedCount
      });

      // Dispatch changes event to keep navigation and lists up to date
      window.dispatchEvent(new Event('zen-scan-documents-changed'));
      window.dispatchEvent(new Event('zen-scan-storage-updated'));

      setTimeout(() => {
        setBulkResult(null);
      }, 4500);

    } catch (err) {
      console.error("Bulk categorization automations failed:", err);
    } finally {
      setIsRunningBulk(false);
    }
  };

  return (
    <div id="smart-automations-settings-card" className="space-y-3 pt-2">
      <button
        id="btn-toggle-rules"
        onClick={() => setShowPanel(!showPanel)}
        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Sliders className="w-4 h-4 text-violet-400 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              Règles d'Automatisation (Triage IA)
              <span className="px-1.5 py-0.5 text-[8px] bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold rounded-md uppercase">Rules Engine</span>
            </h4>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Automatisez le rangement, l'attribution des étiquettes et les noms de fichiers selon le texte OCR.
            </p>
          </div>
        </div>
        <div className="text-zinc-500 group-hover:text-white transition-colors">
          {showPanel ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            id="smart-automations-expanded-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-white/[0.01] border border-white/5 rounded-2xl p-4.5 space-y-4"
          >
            {/* Run Automations Panel */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Lancer les automatisations manuelles</p>
                <p className="text-[9px] text-zinc-500 leading-normal max-w-sm">
                  Appliquez immédiatement toutes les règles actives sur l'ensemble de votre bibliothèque en local.
                </p>
              </div>
              <button
                id="btn-run-all-rules"
                onClick={handleRunAllRules}
                disabled={isRunningBulk || rules.filter(r => r.isActive).length === 0}
                className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-violet-500/15 flex items-center gap-2 active:scale-95 shrink-0"
              >
                {isRunningBulk ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>Ranger la Bibliothèque</span>
              </button>
            </div>

            {/* Quick Bulk Execution Message */}
            <AnimatePresence>
              {bulkResult && (
                <motion.div
                  id="rules-bulk-success-banner"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider leading-normal">
                    Fini ! {bulkResult.docsProcessed} documents scannés, <span className="font-black text-white">{bulkResult.docsModified} modifiés</span> selon vos critères.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rules Submitting & Listing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  Vos directives de classement ({rules.length})
                </h5>
                <button
                  id="btn-show-add-rule-form"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white font-black text-[9px] uppercase tracking-wider rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nouvelle Règle</span>
                </button>
              </div>

              {/* Add Rule Inline Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.form
                    id="form-add-automation-rule"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleCreateRule}
                    className="overflow-hidden p-4 rounded-xl bg-zinc-950/40 border border-white/5 space-y-4.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-0.5">Nom de la règle</label>
                        <input
                          type="text"
                          required
                          placeholder="ex: Facture de transport"
                          value={newRule.name}
                          onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-violet-500/50 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-0.5">Mot-clé détecté</label>
                        <input
                          type="text"
                          required
                          placeholder="ex: uber, sncf, ticket"
                          value={newRule.keyword}
                          onChange={e => setNewRule({ ...newRule, keyword: e.target.value })}
                          className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-violet-500/50 outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-0.5">Cibler le champ</label>
                        <select
                          value={newRule.field}
                          onChange={e => setNewRule({ ...newRule, field: e.target.value as any })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:border-violet-500/50 outline-none transition-all"
                        >
                          <option value="all">Fichier entier (Nom + Texte OCR)</option>
                          <option value="name">Nom du document uniquement</option>
                          <option value="content">Texte extrait par l'OCR uniquement</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-0.5">Dossier de destination</label>
                        <select
                          value={newRule.folderId || ''}
                          onChange={e => setNewRule({ ...newRule, folderId: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white focus:border-violet-500/50 outline-none transition-all"
                        >
                          <option value="">-- Conserver dossier d'origine --</option>
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>📁 {f.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Action additions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5">
                      {/* Name modification prefix */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-0.5">Préfixe de fichier (Optionnel)</label>
                        <input
                          type="text"
                          placeholder="ex: FACT_"
                          value={newRule.prefix || ''}
                          onChange={e => setNewRule({ ...newRule, prefix: e.target.value })}
                          className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:border-violet-500/50 outline-none transition-all font-mono"
                        />
                      </div>

                      {/* Favorites switch */}
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <button
                          type="button"
                          onClick={() => setNewRule({ ...newRule, isFavorite: !newRule.isFavorite })}
                          className={`w-full h-[38px] p-2 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between text-xs transition-colors hover:bg-white/[0.04] ${newRule.isFavorite ? 'border-amber-500/20 text-amber-400' : 'text-zinc-400'}`}
                        >
                          <span className="font-bold flex items-center gap-1.5">
                            <Star className={`w-3.5 h-3.5 ${newRule.isFavorite ? 'fill-amber-400 text-amber-500' : 'text-zinc-500'}`} />
                            Marquer comme favori
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${newRule.isFavorite ? 'bg-amber-400/10 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
                            {newRule.isFavorite ? 'OUI' : 'NON'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Tags subform */}
                    <div className="space-y-2 pt-1 border-t border-white/5">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-0.5 block">Ajouter des étiquettes (Tags)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ajouter une étiquette..."
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-violet-500/50 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-3.5 py-1.5 bg-violet-600/20 hover:bg-violet-600 text-white hover:text-white border border-violet-500/20 font-black text-xs uppercase rounded-xl transition-all"
                        >
                          Ajouter
                        </button>
                      </div>
                      
                      {newRule.tags && newRule.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {newRule.tags.map(t => (
                            <span key={t} className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-md text-[9px] font-black tracking-wide flex items-center gap-1">
                              {t}
                              <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-400 shrink-0 font-bold ml-0.5">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setTagInput('');
                        }}
                        className="px-3.5 py-2 hover:bg-white/5 text-zinc-400 transition-colors uppercase tracking-widest text-[9px] font-black rounded-lg"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-black text-[9px] uppercase tracking-widest rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Créer la Directive</span>
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Rules List Grid */}
              <div className="space-y-2">
                {rules.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-white/5 rounded-xl">
                    <p className="text-xs text-zinc-500 font-medium">Aucune règle configurée. Créez-en une pour automatiser vos rangements !</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {rules.map((rule) => {
                      const targetFolder = folders.find(f => f.id === rule.folderId);
                      return (
                        <div
                          key={rule.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            rule.isActive 
                              ? 'bg-white/[0.02] border-white/10 hover:border-violet-500/30' 
                              : 'bg-white/[0.005] border-white/5 opacity-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Toggle Check */}
                              <button
                                type="button"
                                title={rule.isActive ? "Désactiver" : "Activer"}
                                onClick={() => handleToggleRule(rule.id)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                  rule.isActive 
                                    ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/20' 
                                    : 'border-zinc-700 hover:border-zinc-500'
                                }`}
                              >
                                {rule.isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                              
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-white truncate leading-none">{rule.name}</p>
                                  {!rule.isActive && (
                                    <span className="text-[8px] font-bold text-zinc-500 border border-zinc-700/50 bg-zinc-900/30 px-1 rounded uppercase">Inactif</span>
                                  )}
                                </div>
                                <p className="text-[9px] text-zinc-400 mt-1 flex items-center gap-1 flex-wrap">
                                  <span>Si</span>
                                  <span className="italic font-bold text-violet-400 font-mono">"{rule.keyword}"</span>
                                  <span>détecté dans</span>
                                  <span className="font-bold text-zinc-300">
                                    {rule.field === 'name' ? 'Nom' : rule.field === 'content' ? 'OCR' : 'Nom+OCR'}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteRule(rule.id, e)}
                              className="p-1 rounded bg-red-500/5 hover:bg-red-500 text-zinc-500 hover:text-white transition-all shrink-0"
                              title="Supprimer la règle"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Rule Actions Summary */}
                          {(rule.folderId || (rule.tags && rule.tags.length > 0) || rule.prefix || rule.isFavorite) && (
                            <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[9px]">
                              <span className="text-zinc-500 uppercase tracking-widest font-black shrink-0">Actions :</span>
                              
                              {rule.folderId && (
                                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded-md font-bold">
                                  <Folder className="w-2.5 h-2.5" />
                                  Déplacer vers : {targetFolder?.name || 'Inconnu'}
                                </span>
                              )}

                              {rule.tags && rule.tags.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.5 rounded-md font-bold">
                                  <Tag className="w-2.5 h-2.5" />
                                  Tags : {rule.tags.join(', ')}
                                </span>
                              )}

                              {rule.prefix && (
                                <span className="inline-flex items-center gap-1 text-purple-400 bg-purple-500/5 border border-purple-500/10 px-1.5 py-0.5 rounded-md font-mono font-bold">
                                  Préfixe : {rule.prefix}
                                </span>
                              )}

                              {rule.isFavorite && (
                                <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 rounded-md font-bold">
                                  <Star className="w-2.5 h-2.5 fill-amber-500/10" />
                                  Favori
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase text-violet-400 tracking-wider">Classification en Temps-Réel Active</p>
                <p className="text-[9px] text-zinc-500 leading-normal">
                  Chaque fois qu'un document est importé ou analysé par l'OCR, ces règles s'exécutent de façon totalement transparente en tâche de fond pour trier votre travail !
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
