// src/components/OnboardingTour.jsx
'use client';

import { useState, useEffect } from 'react';

const TOUR_STEPS = [
  {
    target: 'material-panel',
    title: '1. Material Explorer',
    description: 'Di panel ini kamu bisa membaca dokumentasi, modul teori, serta menavigasi struktur folder tugas.',
    position: 'bottom-left'
  },
  {
    target: 'code-editor',
    title: '2. Code Editor (Monaco)',
    description: 'Tempat kamu menuliskan logika program JavaScript/JSON. Mendukung auto-complete dan error syntax checking.',
    position: 'top-center'
  },
  {
    target: 'terminal-panel',
    title: '3. WebContainer Terminal',
    description: 'Jalankan kodinganmu secara real-time menggunakan perintah node atau npm langsung di dalam browser.',
    position: 'top-right'
  },
  {
    target: 'git-controls',
    title: '4. Push & PR Controller',
    description: 'Jika tugas sudah selesai, push commit kamu langsung ke GitHub dan kirim Pull Request ke mentor.',
    position: 'bottom-right'
  }
];

export default function OnboardingTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimate(true);
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    setAnimate(false);
    setTimeout(() => {
      if (isLastStep) {
        onClose();
        setCurrentStep(0);
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }, 150);
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setAnimate(false);
      setTimeout(() => setCurrentStep(prev => prev - 1), 150);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs select-none">
      {/* ANIMATED TOOLTIP CARD */}
      <div 
        className={`w-full max-w-sm bg-[#161b22] border border-[#58a6ff]/40 rounded-lg p-5 shadow-2xl transition-all duration-300 transform ${
          animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-2'
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-[#30363d] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#58a6ff] animate-ping" />
            <span className="text-xs font-mono font-semibold text-[#58a6ff]">
              PANDUAN INTERAKTIF ({currentStep + 1}/{TOUR_STEPS.length})
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#8b949e] hover:text-white text-xs font-mono cursor-pointer"
          >
            Skip Tour ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="space-y-2 mb-5">
          <h3 className="text-sm font-bold text-white">{step.title}</h3>
          <p className="text-xs text-[#c9d1d9] leading-relaxed">{step.description}</p>
        </div>

        {/* STEP PROGRESS INDICATOR DOTS */}
        <div className="flex items-center justify-between pt-2 border-t border-[#30363d]/60">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <span 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-5 bg-[#58a6ff]' : 'w-1.5 bg-[#30363d]'
                }`}
              />
            ))}
          </div>

          {/* CONTROLS */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                className="bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs px-3 py-1.5 rounded border border-[#30363d] font-mono cursor-pointer transition-colors"
              >
                Kembali
              </button>
            )}
            <button 
              onClick={handleNext}
              className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs px-3 py-1.5 rounded font-mono font-medium cursor-pointer transition-colors shadow-sm"
            >
              {isLastStep ? 'Mulai Koding 🚀' : 'Lanjut →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}