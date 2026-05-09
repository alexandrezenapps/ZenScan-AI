/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserCircle } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="p-8 flex justify-between items-center fixed top-0 w-full z-50 bg-primary-900/40 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F7CFF] to-[#7AA2FF] flex items-center justify-center shadow-lg ai-glow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">ZenScan <span className="text-[#4F7CFF]">AI</span></span>
      </div>
      
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Synced</span>
        </div>
        <button className="h-10 w-10 rounded-full overflow-hidden border border-white/10 active:scale-95 transition-transform flex items-center justify-center bg-primary-700">
          <UserCircle className="w-6 h-6 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
