// src/components/WorkspaceHeader.jsx
'use client';

import { signOut, signIn } from "next-auth/react";

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
  const handleSwitchAccount = async () => {
    await signOut({ redirect: false });
    signIn('github', { prompt: 'select_account' });
  };

  return (
    <header data-tour="header" className="h-14 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between z-20 font-sans select-none shrink-0">
      {/* KIRI: NAVIGASI DASBOARD & JUDUL REPO */}
      <div className="flex items-center gap-3 min-w-0">
        <button 
          onClick={onBackToCurriculum}
          className="text-xs font-semibold text-[#c9d1d9] hover:text-white bg-[#21262d] hover:bg-[#30363d] px-3.5 py-1.5 rounded border border-[#30363d] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
        >
          <span>← Dashboard</span>
        </button>

        <div className="h-4 w-[1px] bg-[#30363d] hidden sm:block" />

        <div className="flex items-center gap-2 truncate">
          <span className="text-sm font-semibold text-white truncate">
            {selectedWeekInfo?.name || selectedRepo}
          </span>
          {isReadOnly && (
            <span className="text-[10px] bg-[#21262d] text-[#e3b341] px-2 py-0.5 rounded border border-[#30363d] font-mono shrink-0">
              Read-Only
            </span>
          )}
        </div>
      </div>

      {/* KANAN: TOGGLE VIEW, PORT SERVER, PR BUTTON & AKUN USER */}
      <div className="flex items-center gap-3 shrink-0">
        {/* INDIKATOR PORT SERVER */}
        {activePortUrl && (
          <a
            href={activePortUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 text-xs text-[#3fb950] bg-[#238636]/10 border border-[#238636]/40 px-2.5 py-1 rounded-full font-mono hover:bg-[#238636]/20 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
            <span>Port Ready</span>
          </a>
        )}

        {/* TOGGLE PANEL (MATERI / EDITOR / TERMINAL) */}
        <div className="flex items-center bg-[#0d1117] rounded border border-[#30363d] p-1 text-xs font-mono">
          <button 
            onClick={() => setShowMaterial(!showMaterial)} 
            className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
              showMaterial ? 'bg-[#21262d] text-white shadow-sm' : 'text-[#8b949e] hover:text-white'
            }`}
          >
            Materi
          </button>
          <button 
            onClick={() => setShowEditor(!showEditor)} 
            className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
              showEditor ? 'bg-[#21262d] text-white shadow-sm' : 'text-[#8b949e] hover:text-white'
            }`}
          >
            Editor
          </button>
          <button 
            onClick={() => setShowTerminal(!showTerminal)} 
            className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
              showTerminal ? 'bg-[#21262d] text-white shadow-sm' : 'text-[#8b949e] hover:text-white'
            }`}
          >
            Terminal
          </button>
        </div>

        {/* TOMBOL PULL REQUEST (PR) */}
        {!isReadOnly && (
          <button
            onClick={onOpenPRModal}
            disabled={isPullRequesting}
            className="bg-[#238636] hover:bg-[#2ea043] text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            title="Kirim Pull Request ke Mentor"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>{isPullRequesting ? 'Submitting...' : 'Pull Request'}</span>
          </button>
        )}

        {/* AREA AKUN USER */}
        <div className="flex items-center gap-2 border-l border-[#30363d] pl-3">
          <div className="flex items-center gap-2">
            <img 
              src={session?.user?.image} 
              alt="Avatar" 
              className="w-7 h-7 rounded-full border border-[#30363d]" 
            />
            <span className="text-xs text-[#c9d1d9] font-medium hidden lg:inline">{session?.user?.name}</span>
          </div>
          
          <button 
            onClick={handleSwitchAccount}
            className="text-xs bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] px-2.5 py-1 rounded transition-colors cursor-pointer font-medium"
            title="Login dengan akun GitHub lain"
          >
            Ganti Akun
          </button>

          <button 
            onClick={() => signOut({ callbackUrl: '/' })} 
            className="text-xs text-[#f85149] hover:underline cursor-pointer font-medium px-1"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}