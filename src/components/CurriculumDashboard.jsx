// src/components/CurriculumDashboard.jsx
'use client';

import { signOut } from "next-auth/react";
import { CURRICULUM_DATA, MENTOR_ORG } from '../data/curriculumData';

export default function CurriculumDashboard({ session, statusMap, isLoadingRepos, onSelectWeekRepo, onRefreshRepos }) {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans flex flex-col select-none">
      {/* HEADER BAR */}
      <header className="h-14 bg-[#161b22] border-b border-[#30363d] px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.ico" alt="Favicon ETHJKT" className="w-5 h-5 object-contain" />
          <span className="font-semibold text-white text-sm tracking-tight">ETHJKT</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onRefreshRepos}
            disabled={isLoadingRepos}
            className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs px-3 py-1.5 rounded-md text-[#c9d1d9] hover:text-white transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 text-[#8b949e] ${isLoadingRepos ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isLoadingRepos ? 'Syncing...' : 'Refresh Status'}</span>
          </button>

          {/* USER INFO & LOGOUT */}
          <div className="flex items-center gap-2.5 border-l border-[#30363d] pl-3">
            <div className="flex items-center gap-2">
              <img src={session?.user?.image} alt="Avatar" className="w-7 h-7 rounded-full border border-[#30363d]" />
              <span className="text-xs text-white font-semibold">{session?.user?.name}</span>
            </div>
            <button 
              onClick={() => signOut()} 
              className="text-xs text-[#f85149] hover:underline cursor-pointer ml-1"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow max-w-6xl w-full mx-auto p-6 space-y-6">
        <div className="border-b border-[#30363d] pb-4">
          <h1 className="text-lg font-bold text-white">ETHJKT Modul Pembelajaran</h1>
          {/* <p className="text-xs text-[#8b949e] mt-0.5">Pilih modul tugas untuk mulai mengerjakan di IDE atau meninjau repository mentor.</p> */}
        </div>

        {/* MODUL KURIKULUM */}
        <div className="space-y-8">
          {CURRICULUM_DATA.map((phaseGroup, idx) => (
            <section key={idx} className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className="bg-[#21262d] border border-[#30363d] text-[#58a6ff] text-[11px] font-mono font-medium px-2 py-0.5 rounded">
                    {phaseGroup.phase}
                  </span>
                  <h2 className="text-sm font-semibold text-white">{phaseGroup.title}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {phaseGroup.weeks.map((week) => {
                  const info = statusMap[week.repoName] || { isForked: false, repoName: week.repoName };
                  const isForked = info.isForked;
                  const activeRepoName = info.repoName;
                  const forkUrl = `https://github.com/${MENTOR_ORG}/${week.repoName}/fork`;

                  return (
                    <div 
                      key={week.id}
                      className="bg-[#161b22] border border-[#30363d] rounded-md p-3.5 flex flex-col justify-between space-y-3 hover:border-[#8b949e]/40 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-xs font-semibold text-white">{week.name}</h3>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-medium border ${
                            isForked 
                              ? 'bg-[#2ea043]/10 border-[#2ea043]/30 text-[#3fb950]' 
                              : 'bg-[#21262d] border-[#30363d] text-[#8b949e]'
                          }`}>
                            {isForked ? 'Forked' : 'Not Forked'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8b949e] font-mono truncate">{activeRepoName}</p>
                      </div>

                      <div className="pt-2 border-t border-[#30363d]/60 flex items-center justify-between gap-2">
                        {isForked ? (
                          <button 
                            onClick={() => onSelectWeekRepo(week, false, activeRepoName)}
                            className="w-full bg-[#238636] hover:bg-[#2ea043] text-white text-xs py-1.5 px-3 rounded font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Buka IDE</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 w-full">
                            <button 
                              onClick={() => onSelectWeekRepo(week, true, week.repoName)}
                              className="flex-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white text-[11px] py-1.5 px-2 rounded font-medium border border-[#30363d] transition-colors cursor-pointer text-center truncate"
                            >
                              Lihat Mentor
                            </button>
                            <a 
                              href={forkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-[#30363d] hover:bg-[#8b949e]/20 text-[#58a6ff] text-[11px] py-1.5 px-2.5 rounded font-medium border border-[#30363d] transition-colors cursor-pointer text-center whitespace-nowrap"
                            >
                              Fork ↗
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}