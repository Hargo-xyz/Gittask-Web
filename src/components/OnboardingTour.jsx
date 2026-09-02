// src/components/OnboardingTour.jsx
'use client';

import { useState, useEffect } from 'react';

const STEPS = [
  {
    target: '[data-tour="header"]',
    title: 'Navigasi & Akun Header',
    description: 'Bilah utama untuk navigasi kembali ke Dashboard kurikulum, mengganti akun GitHub, serta memantau koneksi Port server.',
    position: 'bottom'
  },
  {
    target: '[data-tour="activity-bar"]',
    title: 'Activity Bar',
    description: 'Navigasi cepat ala VS Code. Beralih instan antara File Explorer proyek dan Repositori Materi Pembelajaran.',
    position: 'right'
  },
  {
    target: '[data-tour="sidebar-content"]',
    title: 'Explorer & Modul Pembelajaran',
    description: 'Di panel ini kamu bisa melihat struktur berkas proyek bertingkat, membuat file/folder baru, serta membaca materi berformat Markdown.',
    position: 'right'
  },
  {
    target: '[data-tour="editor"]',
    title: 'Monaco Code Editor',
    description: 'Ruang kerja utama tempat kamu menulis kode. Mendukung multi-tab file, sintaks JavaScript/HTML/CSS, dan auto-save ke WebContainer.',
    position: 'left'
  },
  {
    target: '[data-tour="terminal"]',
    title: 'Terminal Interaktif WebContainer',
    description: 'Terminal sungguhan yang bisa menjalankan command "cd", "node app.js", "npm install", dan tombol Push untuk commit ke GitHub.',
    position: 'top'
  }
];

export default function OnboardingTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const updateTargetRect = () => {
      const step = STEPS[currentStep];
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height
        });
      } else {
        setRect(null);
      }
    };

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const getCardStyle = () => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const space = 16;
    let style = {};

    if (step.position === 'bottom') {
      style = {
        top: `${rect.top + rect.height + space}px`,
        left: `${Math.max(16, rect.left)}px`
      };
    } else if (step.position === 'top') {
      style = {
        bottom: `${window.innerHeight - rect.top + space}px`,
        left: `${Math.max(16, rect.left)}px`
      };
    } else if (step.position === 'right') {
      style = {
        top: `${Math.max(16, rect.top)}px`,
        left: `${rect.left + rect.width + space}px`
      };
    } else if (step.position === 'left') {
      style = {
        top: `${Math.max(16, rect.top)}px`,
        right: `${window.innerWidth - rect.left + space}px`
      };
    }

    return style;
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none font-sans">
      {/* SPOTLIGHT FOCUS RING */}
      {rect && (
        <div
          className="fixed pointer-events-none z-[10000] transition-all duration-300 ease-out border-2 border-[#58a6ff] rounded-md shadow-[0_0_0_9999px_rgba(13,17,23,0.85)]"
          style={{
            top: `${rect.top - 4}px`,
            left: `${rect.left - 4}px`,
            width: `${rect.width + 8}px`,
            height: `${rect.height + 8}px`
          }}
        />
      )}

      {/* FLOATING TOOLTIP CARD */}
      <div
        style={getCardStyle()}
        className="fixed z-[10001] w-80 bg-[#161b22] border border-[#30363d] p-4 rounded-lg shadow-2xl transition-all duration-300 ease-out flex flex-col gap-3"
      >
        <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
          <span className="text-xs font-semibold text-[#58a6ff] uppercase tracking-wider font-mono">
            Langkah {currentStep + 1} dari {STEPS.length}
          </span>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-white text-xs px-1 cursor-pointer"
            title="Tutup Petunjuk"
          >
            ✕
          </button>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
          <p className="text-xs text-[#c9d1d9] leading-relaxed">{step.description}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#30363d]/60">
          <button
            onClick={onClose}
            className="text-xs text-[#8b949e] hover:text-white cursor-pointer"
          >
            Lewati Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-2.5 py-1 rounded text-xs text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] cursor-pointer"
              >
                Kembali
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-3 py-1 rounded text-xs text-white bg-[#238636] hover:bg-[#2ea043] font-semibold cursor-pointer"
            >
              {currentStep === STEPS.length - 1 ? 'Selesai' : 'Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}