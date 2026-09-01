// src/components/WorkspaceHeader.jsx
'use client';

import { signOut } from "next-auth/react";

export default function WorkspaceHeader({
  selectedWeekInfo,
  selectedRepo,
  isReadOnly,
  activePortUrl,
  isPullRequesting,
  onBackToCurriculum,
  onOpenPRModal,
  session,
  showMaterial,
  setShowMaterial,
  showEditor,
  setShowEditor,
  showTerminal,
  setShowTerminal
}) {
  return (
    <header className="h-14 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between z-20 font-sans select-none shrink-0">
      
      {/* SEKSI KIRI: Navigation & Repo Status */}
      <div className="flex items-center gap-3 min-w-0">
        <button 
          onClick={onBackToCurriculum}
          className="text-xs font-medium text-[#c9d1d9] hover:text-white bg-[#21262d] hover:bg-[#30363d] px-3 py-1.5 rounded border border-[#30363d] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <svg className="w-3.5 h-3.5 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kurikulum</span>
        </button>

        <div className="h-4 w-[1px] bg-[#30363d] shrink-0" />

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-none">
            {selectedWeekInfo?.name || selectedRepo}
          </span>
          
          <span className="text-[11px] text-[#8b949e] font-mono bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded shrink-0">
            {selectedRepo}
          </span>

          {isReadOnly && (
            <span className="text-[10px] font-medium bg-[#f0883e]/10 text-[#f0883e] border border-[#f0883e]/30 px-2 py-0.5 rounded font-mono shrink-0">
              Read-Only
            </span>
          )}
        </div>
      </div>

      {/* SEKSI KANAN: Preview, Panel Segment Control & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live Preview Indicator */}
        {activePortUrl && (
          <a 
            href={activePortUrl} 
            target="_blank" 
            rel="noreferrer"
            className="text-xs font-mono font-medium text-[#3fb950] bg-[#2ea043]/10 border border-[#2ea043]/30 px-2.5 py-1 rounded hover:bg-[#2ea043]/20 transition-colors flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
            <span>Preview ↗</span>
          </a>
        )}

        {/* Flat Segmented Control Toggles */}
        <div className="flex items-center bg-[#0d1117] rounded border border-[#30363d] p-0.5 text-xs font-mono">
          <button 
            onClick={() => setShowMaterial(!showMaterial)} 
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              showMaterial 
                ? 'bg-[#21262d] text-white font-medium border border-[#30363d]' 
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            Material
          </button>
          <button 
            onClick={() => setShowEditor(!showEditor)} 
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              showEditor 
                ? 'bg-[#21262d] text-white font-medium border border-[#30363d]' 
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            Editor
          </button>
          <button 
            onClick={() => setShowTerminal(!showTerminal)} 
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              showTerminal 
                ? 'bg-[#21262d] text-white font-medium border border-[#30363d]' 
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            Terminal
          </button>
        </div>

        {/* Action Button: Kirim PR */}
        {!isReadOnly && (
          <button 
            onClick={onOpenPRModal}
            disabled={isPullRequesting}
            className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>{isPullRequesting ? 'Mengirim...' : 'Kirim Pull Request'}</span>
          </button>
        )}

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 border-l border-[#30363d] pl-3">
          <img 
            src={session?.user?.image} 
            alt="Avatar" 
            className="w-6 h-6 rounded-full border border-[#30363d]" 
          />
          <button 
            onClick={() => signOut()} 
            className="text-xs text-[#f85149] hover:underline cursor-pointer font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}