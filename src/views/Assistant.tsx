/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, User, Search, Paperclip, ArrowUp, Sparkles, Receipt, FileText, Mail } from 'lucide-react';
import { AppView, ChatMessage } from '../types';
import { MOCK_MESSAGES } from '../constants';
import { chatWithAI } from '../services/geminiService';

interface AssistantProps {
  onNavigate: (view: AppView) => void;
}

export default function Assistant({ onNavigate }: AssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnswering]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsAnswering(true);

    try {
      // Prepare history for Gemini
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const aiResponse = await chatWithAI(currentInput, history);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse || "Désolé, je n'ai pas pu générer de réponse.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Assistant Error", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Une erreur est survenue lors de la communication avec Zen AI. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-[calc(100vh-60px)] md:h-[calc(100vh-80px)] mt-0 md:mt-4"
    >
      {/* Sticky AI Header */}
      <div className="px-5 py-4 md:px-6 md:py-6 z-10 bg-primary-900/80 backdrop-blur-3xl shadow-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-ai-blue/10 flex items-center justify-center border border-ai-blue/20 ai-glow">
               <Bot className="w-6 h-6 md:w-7 md:h-7 text-ai-blue" />
             </div>
             <div>
               <h2 className="text-lg md:text-2xl font-bold text-white leading-tight">Zen AI <span className="text-ai-blue">Assistant</span></h2>
               <p className="text-[8px] md:text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Cerveau Documentaire</p>
             </div>
          </div>
          <div className="badge-ai animate-pulse text-[9px] md:text-xs">✨ ONLINE</div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 md:px-6 md:py-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-10 pb-10">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-start gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} w-full max-w-[95%] md:max-w-full`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg shrink-0 transition-transform hover:scale-110 ${msg.role === 'user' ? 'bg-ai-blue text-white' : 'bg-primary-800 border border-white/10 text-ai-blue glass-card'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 md:w-5 md:h-5" /> : <Bot className="w-4 h-4 md:w-5 md:h-5 text-ai-blue" />}
                  </div>
                  <div className={`p-4 md:p-5 rounded-2xl md:rounded-[24px] shadow-2xl relative overflow-hidden transition-all hover:translate-y-[-2px] ${
                    msg.role === 'user' 
                      ? 'bg-ai-gradient text-white rounded-tr-none ai-glow' 
                      : 'bg-primary-800 text-gray-100 rounded-tl-none border border-white/5 glass-card'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-ai-blue/40" />
                    )}
                    <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {isAnswering && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 md:gap-4"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-primary-800 border border-white/10 flex items-center justify-center glass-card shrink-0">
                  <Bot className="w-4 h-4 md:w-5 md:h-5 text-ai-blue animate-pulse" />
                </div>
                <div className="bg-primary-800 border border-white/5 p-4 md:p-5 rounded-2xl md:rounded-[24px] rounded-tl-none glass-card flex items-center gap-3 md:gap-4 shadow-xl relative overflow-hidden">
                  <motion.div 
                    initial={{ top: '-100%' }}
                    animate={{ top: '200%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-px bg-ai-blue shadow-[0_0_10px_#4F7CFF] opacity-40"
                  />
                  <div className="flex gap-1 relative z-10">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.3, 1, 0.3]
                        }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-ai-blue shadow-[0_0_8px_#4F7CFF]"
                      />
                    ))}
                  </div>
                  <span className="text-[8px] md:text-[10px] font-black text-ai-blue uppercase tracking-[0.2em] animate-pulse relative z-10">Analyse Documentaire...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Suggested Actions & Input */}
      <div className="px-5 pb-8 md:px-6 md:pb-12 pt-4 bg-gradient-to-t from-primary-900 via-primary-900/90 to-transparent z-20">
        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
          {/* Suggested Actions */}
          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar py-1">
            <SuggestionChip 
              icon={Sparkles} 
              label="Résumer" 
              onClick={() => {
                setInputValue("Peux-tu me faire un résumé de mes derniers documents ?");
                handleSendMessage();
              }}
            />
            <SuggestionChip 
              icon={Receipt} 
              label="Extraire Montant" 
              onClick={() => {
                setInputValue("Quel est le montant total de mes factures ce mois-ci ?");
                handleSendMessage();
              }}
            />
            <SuggestionChip 
              icon={Mail} 
              label="Email Réponse" 
              onClick={() => {
                setInputValue("Aide-moi à rédiger un email de réponse pour le document sélectionné.");
                handleSendMessage();
              }}
            />
          </div>

          {/* Input Bar */}
          <div className="relative group">
            <div className="absolute inset-x-0 -top-px h-0.5 md:h-1 bg-ai-blue/10 group-focus-within:bg-ai-blue transition-all duration-700 opacity-20"></div>
            <div className="glass-card rounded-2xl md:rounded-[32px] p-2 pr-2.5 pl-4 md:pr-3 md:pl-6 flex items-center gap-3 md:gap-4 bg-primary-800/40 border border-white/5 group-focus-within:border-ai-blue/30 transition-all shadow-2xl">
               <Bot className="w-5 h-5 md:w-6 md:h-6 text-ai-blue group-focus-within:animate-pulse" />
               <input 
                 type="text" 
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                 placeholder="Posez une question..."
                 className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-600 focus:ring-0 text-sm outline-none font-medium"
               />
               <button 
                onClick={() => alert('Sélection de fichier pour analyse...')}
                className="hidden xs:flex w-9 h-9 md:w-10 md:h-10 items-center justify-center text-zinc-600 hover:text-white transition-colors"
               >
                 <Paperclip className="w-5 h-5" />
               </button>
               <button 
                  onClick={handleSendMessage}
                  className="w-10 h-10 md:w-12 md:h-12 bg-ai-gradient rounded-xl md:rounded-full flex items-center justify-center text-white ai-glow active:scale-90 transition-transform shadow-lg"
               >
                 <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
               </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SuggestionChip({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-6 py-3 bg-primary-800 border border-white/5 rounded-full text-xs font-bold text-ai-blue-light hover:bg-ai-blue/10 hover:border-ai-blue/30 transition-all flex items-center gap-3 whitespace-nowrap glass-card"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
