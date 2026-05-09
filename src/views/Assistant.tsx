/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, User, Search, Paperclip, ArrowUp, Sparkles, Receipt, FileText, Mail } from 'lucide-react';
import { AppView, ChatMessage } from '../types';
import { MOCK_MESSAGES } from '../constants';

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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsAnswering(true);

    // Mock AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "D'accord, j'analyse votre document. J'ai trouvé 3 points clés : le loyer est de 1,450€, la durée est de 3 ans, et le dépôt de garantie est de 2,900€.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsAnswering(false);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-[calc(100vh-80px)] mt-4"
    >
      {/* Sticky AI Header */}
      <div className="px-6 py-6 pb-4 z-10 bg-primary-900/80 backdrop-blur-3xl shadow-[0_20px_50px_rgba(9,9,11,0.5)] border-b border-white/5">
        <div className="max-w-3xl mx-auto space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-ai-blue/10 flex items-center justify-center border border-ai-blue/20 ai-glow">
                 <Bot className="w-7 h-7 text-ai-blue" />
               </div>
               Zen AI Assistant
            </h2>
            <div className="badge-ai animate-pulse">✨ Online</div>
          </div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest ml-16 mt-[-4px] opacity-60">Cerveau documentaire intelligent</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar pt-2">
        <div className="max-w-3xl mx-auto space-y-10 pb-10">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${msg.role === 'user' ? 'bg-ai-blue text-white' : 'bg-primary-800 border border-white/10 text-ai-blue glass-card'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-ai-blue" />}
                  </div>
                  <div className={`max-w-[100%] sm:max-w-md p-5 rounded-[24px] shadow-2xl relative overflow-hidden transition-all hover:translate-y-[-2px] ${
                    msg.role === 'user' 
                      ? 'bg-ai-gradient text-white rounded-tr-none ai-glow' 
                      : 'bg-primary-800 text-gray-100 rounded-tl-none border border-white/5 glass-card'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-ai-blue/40" />
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {isAnswering && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-primary-800 border border-white/10 flex items-center justify-center glass-card">
                  <Bot className="w-5 h-5 text-ai-blue animate-pulse" />
                </div>
                <div className="bg-primary-800 border border-white/5 p-5 rounded-[24px] rounded-tl-none glass-card flex items-center gap-4 shadow-xl relative overflow-hidden">
                  <motion.div 
                    initial={{ top: '-100%' }}
                    animate={{ top: '200%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-px bg-ai-blue shadow-[0_0_10px_#4F7CFF] opacity-40"
                  />
                  <div className="flex gap-1.5 relative z-10">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.3, 1, 0.3]
                        }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-ai-blue shadow-[0_0_8px_#4F7CFF]"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-ai-blue uppercase tracking-widest animate-pulse relative z-10">Zen AI analyse...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Suggested Actions & Input */}
      <div className="px-6 pb-12 pt-4 bg-gradient-to-t from-primary-900 via-primary-900/90 to-transparent z-20">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Suggested Actions */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            <SuggestionChip icon={Sparkles} label="Résume ce contrat" />
            <SuggestionChip icon={Receipt} label="Trouve le montant total" />
            <SuggestionChip icon={Mail} label="Génère un email" />
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-x-0 -top-px h-1 bg-ai-blue/10 group-focus-within:bg-ai-blue transition-all duration-700 opacity-20"></div>
            <div className="glass-card rounded-[32px] p-2 pr-3 pl-6 flex items-center gap-4 bg-primary-800/40 border border-white/5 group-focus-within:border-ai-blue/30 transition-all shadow-2xl">
               <Bot className="w-6 h-6 text-ai-blue group-focus-within:animate-pulse" />
               <input 
                 type="text" 
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                 placeholder="Demandez n'importe quoi..."
                 className="flex-1 bg-transparent border-none text-white placeholder:text-gray-600 focus:ring-0 text-sm outline-none"
               />
               <button className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                 <Paperclip className="w-5 h-5" />
               </button>
               <button 
                  onClick={handleSendMessage}
                  className="w-12 h-12 bg-ai-gradient rounded-full flex items-center justify-center text-white ai-glow active:scale-90 transition-transform shadow-lg"
               >
                 <ArrowUp className="w-6 h-6" />
               </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SuggestionChip({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <button className="px-6 py-3 bg-primary-800 border border-white/5 rounded-full text-xs font-bold text-ai-blue-light hover:bg-ai-blue/10 hover:border-ai-blue/30 transition-all flex items-center gap-3 whitespace-nowrap glass-card">
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
