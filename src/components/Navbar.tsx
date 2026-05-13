/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="px-8 py-6 flex justify-between items-center fixed top-0 w-full z-50 bg-primary-950/20 backdrop-blur-3xl border-b border-white/5">
      <div className="flex items-center gap-3 group cursor-pointer">
        <div className="relative">
          <div className="absolute inset-0 bg-ai-blue blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative w-10 h-10 rounded-[14px] bg-ai-gradient flex items-center justify-center shadow-[0_8px_20px_rgba(79,124,255,0.3)] border border-white/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col -space-y-1">
          <span className="text-xl font-black tracking-tighter text-white">ZenScan</span>
          <span className="text-[10px] font-black text-ai-blue tracking-[0.3em] uppercase opacity-80">Intelligence</span>
        </div>
      </div>
      
      <div className="flex gap-6 items-center">
        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="relative flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-ai-blue shadow-[0_0_8px_#4F7CFF]"></div>
            <div className="absolute w-3 h-3 rounded-full border border-ai-blue/30 animate-ping"></div>
          </div>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Network Live</span>
        </div>
        <button className="h-11 w-11 rounded-2xl overflow-hidden border border-white/5 active:scale-90 transition-all flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] shadow-lg">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
          ) : (
            <UserCircle className="w-6 h-6 text-zinc-400" />
          )}
        </button>
      </div>
    </header>
  );
}
