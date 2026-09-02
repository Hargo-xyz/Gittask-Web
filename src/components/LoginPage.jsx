// src/components/LoginPage.jsx
'use client';

import { useState } from 'react';
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState('register'); // register | fork | workflow

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0d1117] text-[#c9d1d9] font-sans p-4 select-none overflow-hidden">
      
      {/* POLA GRID DOTS MATTE (SLIGHT TRANSPARENCY) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#8b949e 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* CARD MAIN CONTAINER DENGAN ANIMASI FADE-IN & SLIDE-UP */}
      <div className="relative z-10 w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-6 sm:p-8 space-y-6 animate-[fadeIn_0.5s_ease-out]">
        
        {/* BRANDING & DESKRIPSI MANUSIAWI */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#21262d] border border-[#30363d] text-[#58a6ff] mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">ETHJKT Course IDE</h1>
            <p className="text-xs text-[#8b949e] max-w-xs mx-auto leading-relaxed">
              Tempat belajar web programming gratis dari ETHJKT.
            </p>
          </div>
        </div>

        {/* TOMBOL LOGIN */}
        <div className="space-y-3">
          <button 
            onClick={() => signIn('github')} 
            className="w-full bg-[#238636] hover:bg-[#2ea043] text-white py-2.5 px-4 rounded-md text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2.5 active:scale-[0.99]"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>Masuk dengan GitHub</span>
          </button>

          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="w-full bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] py-2 px-4 rounded-md text-xs font-medium cursor-pointer transition-colors text-center"
          >
            {showGuide ? "Sembunyikan Panduan" : "Belum punya akun GitHub? Buka Panduan"}
          </button>
        </div>

        {/* PANDUAN PEMULA */}
        {showGuide && (
          <div className="border-t border-[#30363d] pt-4 space-y-4 text-xs animate-[fadeIn_0.3s_ease-out]">
            {/* TABS PANDUAN */}
            <div className="flex border-b border-[#30363d] gap-1.5 pb-2 font-mono">
              <button 
                onClick={() => setGuideTab('register')}
                className={`flex-1 py-1 px-2 rounded text-center transition-colors cursor-pointer ${guideTab === 'register' ? 'bg-[#21262d] text-white font-semibold border border-[#30363d]' : 'text-[#8b949e] hover:text-white'}`}
              >
                1. Buat Akun
              </button>
              <button 
                onClick={() => setGuideTab('fork')}
                className={`flex-1 py-1 px-2 rounded text-center transition-colors cursor-pointer ${guideTab === 'fork' ? 'bg-[#21262d] text-white font-semibold border border-[#30363d]' : 'text-[#8b949e] hover:text-white'}`}
              >
                2. Cara Fork
              </button>
              <button 
                onClick={() => setGuideTab('workflow')}
                className={`flex-1 py-1 px-2 rounded text-center transition-colors cursor-pointer ${guideTab === 'workflow' ? 'bg-[#21262d] text-white font-semibold border border-[#30363d]' : 'text-[#8b949e] hover:text-white'}`}
              >
                3. Alur Tugas
              </button>
            </div>

            {/* KONTEN TAB */}
            {guideTab === 'register' && (
              <div className="space-y-2 text-[#c9d1d9] leading-relaxed bg-[#0d1117] p-3 rounded-md border border-[#30363d]/60">
                <p className="font-semibold text-white">Langkah Buat Akun GitHub:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-[#8b949e]">
                  <li>Buka <a href="https://github.com/signup" target="_blank" rel="noreferrer" className="text-[#58a6ff] underline">github.com/signup</a>.</li>
                  <li>Masukkan email aktif, buat password, dan username pilihanmu.</li>
                  <li>Selesaikan verifikasi captcha dan masukkan kode OTP dari email.</li>
                  <li>Setelah selesai, kembali ke halaman ini lalu klik <strong className="text-white">"Masuk dengan GitHub"</strong>.</li>
                </ol>
              </div>
            )}

            {guideTab === 'fork' && (
              <div className="space-y-2 text-[#c9d1d9] leading-relaxed bg-[#0d1117] p-3 rounded-md border border-[#30363d]/60">
                <p className="font-semibold text-white">Apa itu Fork & Cara Melakukannya?</p>
                <p className="text-[#8b949e]">
                  <strong>Fork</strong> adalah menyalin repositori materi milik mentor ke dalam akun GitHub pribadimu agar kamu bebas mengubah dan mengisi jawaban tugas.
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[#8b949e]">
                  <li>Di dashboard kurikulum, pilih modul yang ingin dikerjakan.</li>
                  <li>Jika statusnya <span className="text-[#d29922]">Not Forked</span>, klik tombol <strong className="text-white">Fork ↗</strong>.</li>
                  <li>Di halaman GitHub mentor, klik tombol <strong className="text-white">"Create Fork"</strong>.</li>
                  <li>Kembali ke IDE ini dan klik <strong className="text-white">"Refresh Status"</strong>. Status akan berubah jadi <span className="text-[#3fb950]">Forked</span>.</li>
                </ol>
              </div>
            )}

            {guideTab === 'workflow' && (
              <div className="space-y-2 text-[#c9d1d9] leading-relaxed bg-[#0d1117] p-3 rounded-md border border-[#30363d]/60">
                <p className="font-semibold text-[#c9d1d9]">Alur Pengerjaan di GitTask IDE:</p>
                <ul className="list-disc list-inside space-y-1.5 text-[#8b949e]">
                  <li><strong className="text-white">Buka IDE:</strong> Pilih repo yang sudah ter-fork.</li>
                  <li><strong className="text-white">Koding & Test:</strong> Tulis jawaban di editor dan jalankan perintah di terminal bawaan.</li>
                  <li><strong className="text-white">Push Commit:</strong> Klik tombol <span className="text-[#2ea043]">Push</span> untuk menyimpan jawaban langsung ke GitHub kamu.</li>
                  <li><strong className="text-white">PR Task:</strong> Kirim Pull Request ke mentor untuk pengumpulan tugas akhir.</li>
                </ul>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}