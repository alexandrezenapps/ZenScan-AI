import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Zap } from 'lucide-react';
import { storageService } from '../services/storageService';
import { DocumentMetadata } from '../types';
import { AIOrb } from './PremiumComponents';

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: 'Bonjour ! Je suis ZenScan AI. Comment puis-je vous aider avec vos documents aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load documents for context
    const loadDocs = async () => {
      const docs = await storageService.getDocuments();
      setDocuments(docs);
    };
    if (isOpen) {
      loadDocs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          contextDocs: documents.map(d => ({
            name: d.name,
            category: d.category,
            date: d.createdAt,
            tags: d.tags,
            info: d.contentSnippet,
            data: d.extractedData
          }))
        }),
      });

      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();

      setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Désolé, j\'ai rencontré une erreur technique. Veuillez réessayer.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <div className="fixed bottom-28 right-6 z-[100] flex flex-col items-center">
        <AnimatePresence>
          {!isOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute -top-12 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-lg pointer-events-none"
            >
              <span className="text-[9px] font-black text-ai-blue uppercase tracking-widest leading-none">Besoin d'aide ?</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-16 h-16 bg-ai-gradient rounded-full shadow-[0_15px_35px_rgba(79,124,255,0.4)] flex items-center justify-center border border-white/20 ai-glow overflow-hidden"
        >
          {isOpen ? (
            <X className="w-8 h-8 text-white z-10" />
          ) : (
            <>
              <div className="absolute inset-0 z-0">
                 <AIOrb size="w-full h-full" />
              </div>
              <Sparkles className="w-7 h-7 text-white z-10 relative" />
            </>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(20px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(20px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[130px] right-6 w-[calc(100%-3rem)] md:w-[420px] h-[550px] z-[99] glass-card border border-ai-blue/10 flex flex-col overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.6)] backdrop-blur-3xl rounded-[32px]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-ai-blue/20 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-ai-gradient flex items-center justify-center border border-white/20 shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-1 rounded-full border border-ai-blue/40"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white tracking-widest uppercase">Zen Intelligence</h3>
                  <p className="text-[10px] text-zinc-400 font-medium tracking-tight">Traitement sémantique en temps réel</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar mask-gradient-bottom"
            >
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={`chat-msg-${i}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[90%] p-4 rounded-3xl text-xs md:text-[13px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-ai-gradient text-white rounded-tr-none shadow-ai-blue' 
                    : 'bg-white/[0.03] text-zinc-300 rounded-tl-none border border-white/5 backdrop-blur-md'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5">
                    <div className="flex gap-1">
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 rounded-full bg-ai-blue" />
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 rounded-full bg-ai-blue" />
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 rounded-full bg-ai-blue" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-md">
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Posez une question sur vos docs..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs md:text-sm text-white outline-none focus:border-ai-blue/40 transition-all pr-14 placeholder:text-zinc-600"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-ai-blue rounded-xl text-white disabled:opacity-30 disabled:grayscale transition-all shadow-lg active:scale-90"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
