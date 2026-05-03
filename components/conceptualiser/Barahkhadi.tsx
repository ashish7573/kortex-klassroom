"use client";
import React, { useState, useMemo, useRef } from 'react';
import { Volume2, X } from 'lucide-react';

// Import central audio engine
import { HINDI_ASSETS, getBarahkhadiAudio } from '@/lib/SwarVyanjanDictionary';

// --- DATA MAPPING & COLOR COORDINATION ---
const SWARS = [
  { id: 'a', char: 'अ', matra: '', bg: 'bg-slate-400', border: 'border-slate-500', text: 'text-white' },
  { id: 'aa', char: 'आ', matra: 'ा', bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-slate-800' },
  { id: 'i', char: 'इ', matra: 'ि', bg: 'bg-lime-400', border: 'border-lime-500', text: 'text-slate-800' },
  { id: 'ee', char: 'ई', matra: 'ी', bg: 'bg-emerald-400', border: 'border-emerald-500', text: 'text-white' },
  { id: 'u', char: 'उ', matra: 'ु', bg: 'bg-rose-400', border: 'border-rose-500', text: 'text-white' },
  { id: 'oo', char: 'ऊ', matra: 'ू', bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white' },
  { id: 'e', char: 'ए', matra: 'े', bg: 'bg-fuchsia-400', border: 'border-fuchsia-500', text: 'text-white' },
  { id: 'ai', char: 'ऐ', matra: 'ै', bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  { id: 'o', char: 'ओ', matra: 'ो', bg: 'bg-indigo-400', border: 'border-indigo-500', text: 'text-white' },
  { id: 'au', char: 'औ', matra: 'ौ', bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-white' },
  { id: 'ang', char: 'अं', matra: 'ं', bg: 'bg-cyan-400', border: 'border-cyan-500', text: 'text-slate-800' },
  { id: 'ah', char: 'अः', matra: 'ः', bg: 'bg-teal-400', border: 'border-teal-500', text: 'text-white' },
];

const VYANJAN_GROUPS = [
  { group: 'क-वर्ग', letters: ['क', 'ख', 'ग', 'घ', 'ङ'] },
  { group: 'च-वर्ग', letters: ['च', 'छ', 'ज', 'झ', 'ञ'] },
  { group: 'ट-वर्ग', letters: ['ट', 'ठ', 'ड', 'ढ', 'ण'] },
  { group: 'त-वर्ग', letters: ['त', 'थ', 'द', 'ध', 'न'] },
  { group: 'प-वर्ग', letters: ['प', 'फ', 'ब', 'भ', 'म'] },
  { group: 'अंतस्थ', letters: ['य', 'र', 'ल', 'व'] },
  { group: 'ऊष्म', letters: ['श', 'ष', 'स', 'ह'] },
  { group: 'संयुक्त', letters: ['क्ष', 'त्र', 'ज्ञ'] }
];

const DISABLED_VYANJANS = ['ङ', 'ञ']; 

// ============================================================================
// CUSTOM LOCAL AUDIO ENGINE
// ============================================================================
let activeLocalAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

// We keep a lightweight unlocker to satisfy iOS Safari requirements
const unlockMobileAudio = () => {
    if (isAudioUnlocked || typeof window === 'undefined') return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        ctx.resume();
    } catch (e) {}
    isAudioUnlocked = true;
};

const playAudio = (text: string) => {
    if (!text || typeof window === 'undefined') return;
    try {
        let audioPath = '';

        // 1. Is it a base Swar or Vyanjan? (e.g., "क" or "आ")
        if (HINDI_ASSETS[text]) {
            audioPath = HINDI_ASSETS[text].audio;
        } 
        // 2. Is it a combined Barahkhadi syllable? (e.g., "का" or "कि")
        else {
            const bPath = getBarahkhadiAudio(text);
            if (bPath) audioPath = bPath;
        }

        if (audioPath) {
            if (activeLocalAudio) {
                activeLocalAudio.pause();
                activeLocalAudio.currentTime = 0;
            }
            const audio = new Audio(audioPath);
            activeLocalAudio = audio;
            
            // Bulletproof Fallback just in case of extension mismatch
            audio.onerror = () => {
                const fallbackPath = audioPath.endsWith('.m4a') 
                    ? audioPath.replace('.m4a', '.mp3') 
                    : audioPath.replace('.mp3', '.m4a');
                    
                const fallbackAudio = new Audio(fallbackPath);
                activeLocalAudio = fallbackAudio;
                fallbackAudio.play().catch(e => console.warn("Audio missing in both formats for:", text));
            };

            audio.play().catch(e => console.warn("Browser blocked audio for:", text));
        }
    } catch (error) {
        console.error("Audio playback error:", error);
    }
};

export default function BarahkhadiVisualiser() {
  
  const ACTIVE_VYANJANS = useMemo(() => VYANJAN_GROUPS.flatMap(g => g.letters).filter(v => !DISABLED_VYANJANS.includes(v)), []);
  
  // State for the interactive Popup
  const [popup, setPopup] = useState<{vyanjan: string, swar: any, combined: string} | null>(null);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleBeadClick = (vyanjan: string, swarObj: any) => {
      const combined = vyanjan + swarObj.matra;
      playAudio(combined);
      setPopup({ vyanjan, swar: swarObj, combined });

      // Auto-dismiss popup after 3 seconds
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = setTimeout(() => setPopup(null), 3000);
  };

  return (
    <div 
        className="w-full h-full min-h-[600px] flex flex-col bg-slate-50 font-sans select-none overflow-hidden rounded-3xl border-2 border-slate-200 relative"
        onPointerDownCapture={unlockMobileAudio} 
    >
        {/* POPUP OVERLAY */}
        {popup && (
            <div 
                className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200" 
                onPointerDown={() => setPopup(null)}
            >
                <div 
                    className={`bg-white rounded-3xl p-8 md:p-12 shadow-2xl transform transition-all border-4 ${popup.swar.border} flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200`}
                    onPointerDown={(e) => e.stopPropagation()} // Prevents click-through closing
                >
                    <button onClick={() => setPopup(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2">
                        <X size={20} />
                    </button>

                    <div className="flex items-center justify-center gap-3 md:gap-6 text-5xl md:text-7xl font-black text-slate-800 flex-wrap">
                        {/* Vyanjan */}
                        <span className="text-slate-600">{popup.vyanjan}</span>
                        
                        <span className="text-slate-300 text-3xl md:text-5xl">+</span>
                        
                        {/* Matra Symbol */}
                        <span className="text-slate-600">{popup.swar.id === 'a' ? 'अ' : popup.swar.matra}</span>
                        
                        <span className="text-slate-300 text-3xl md:text-5xl">=</span>
                        
                        {/* Result */}
                        <span className={`${popup.swar.bg} ${popup.swar.text} px-6 py-2 md:py-3 rounded-2xl shadow-inner border-2 ${popup.swar.border}`}>
                            {popup.combined}
                        </span>
                    </div>

                    <button 
                        onClick={() => playAudio(popup.combined)}
                        className="flex items-center gap-2 bg-sky-100 hover:bg-sky-200 text-sky-600 px-6 py-3 rounded-full font-bold text-lg md:text-xl transition-colors mt-2 active:scale-95"
                    >
                        <Volume2 size={24} /> सुनें
                    </button>
                </div>
            </div>
        )}

        {/* FULL BARAHKHADI MATRIX (Header Removed) */}
        <div className="flex-1 bg-slate-50 p-2 md:p-4 overflow-auto relative hide-scrollbar rounded-3xl">
            <div className="min-w-max bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-200">
                
                {/* Top Header Row (Vyanjans) */}
                <div className="flex gap-1.5 md:gap-2 mb-2 md:mb-4 sticky top-0 bg-white z-20 py-2 border-b-2 border-slate-100">
                    <div className="w-12 h-10 md:w-16 md:h-12 shrink-0 sticky left-0 bg-white z-30"></div> 
                    {ACTIVE_VYANJANS.map(v => (
                        <button 
                            key={`header-${v}`} 
                            onClick={() => playAudio(v)}
                            className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-black text-lg md:text-xl shadow-inner shrink-0 leading-none hover:bg-slate-200 active:scale-95 transition-all cursor-pointer border border-slate-200"
                        >
                            {v}
                        </button>
                    ))}
                </div>

                {/* Swar Rows (Y-Axis) */}
                <div className="flex flex-col gap-2 md:gap-3">
                    {SWARS.map(s => (
                        <div key={s.id} className="flex gap-1.5 md:gap-2 relative group">
                            {/* Row Header (Swar/Matra) */}
                            <button 
                                onClick={() => playAudio(s.char)}
                                className={`w-12 h-12 md:w-16 md:h-14 ${s.bg} ${s.text} rounded-lg flex flex-col items-center justify-center font-black shadow-md shrink-0 sticky left-0 z-10 hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-black/10`}
                            >
                                <span className="text-base md:text-xl leading-none">{s.char}</span>
                                <span className="text-[10px] md:text-xs opacity-80 leading-none mt-0.5">{s.matra || '-'}</span>
                            </button>
                            
                            {/* Bead Columns (Combined Vyanjan + Matra) */}
                            {ACTIVE_VYANJANS.map(v => (
                                <div key={`${v}-${s.id}`} className="relative w-10 h-12 md:w-12 md:h-14 flex items-center justify-center shrink-0">
                                    <div className="absolute top-[-100vh] bottom-0 left-1/2 w-0.5 bg-slate-100 -z-10 -translate-x-1/2 opacity-50"></div>
                                    
                                    <button 
                                        onClick={() => handleBeadClick(v, s)}
                                        className={`w-9 h-9 md:w-11 md:h-11 ${s.bg} rounded-full flex items-center justify-center font-black text-sm md:text-lg ${s.text} shadow-sm border-2 ${s.border} hover:scale-110 hover:shadow-md hover:brightness-110 active:scale-90 transition-all cursor-pointer`}
                                    >
                                        {v + s.matra}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}