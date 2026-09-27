'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, CheckCircle2, ChevronRight, Star, Sparkles, AlertCircle, Hand } from 'lucide-react';

const EMOJI_POOL = ['🍎', '🐶', '🚀', '🌟', '🍕', '🎈', '🚗', '🧸', '🌻', '💎', '🐸', '🍓', '🏀', '🐢', '🦖'];

interface Question {
  target: number;
  emoji: string;
}

// --- Custom Interactive Hand Components ---
const LeftHand = ({ count, onClick }: { count: number, onClick: () => void }) => {
  const open = [count >= 1, count >= 2, count >= 3, count >= 4, count >= 5]; // Index, Middle, Ring, Pinky, Thumb
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full max-h-48 drop-shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-transform" onClick={onClick}>
      
      {/* Thumb (Left side) */}
      <rect x="13" y="65" width="38" height="14" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300 origin-[18px_52px]" style={{ transform: open[4] ? 'rotate(40deg)' : 'rotate(0deg) translateX(15px) scaleX(0.5)' }} />
      
      {/* Fingers behind palm */}
      <rect x="24" y="20" width="12" height="45" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[0] ? 'translateY(0)' : 'translateY(35px)' }} />
      <rect x="38" y="10" width="12" height="55" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[1] ? 'translateY(0)' : 'translateY(40px)' }} />
      <rect x="52" y="15" width="12" height="50" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[2] ? 'translateY(0)' : 'translateY(35px)' }} />
      <rect x="66" y="25" width="12" height="40" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[3] ? 'translateY(0)' : 'translateY(30px)' }} />
      
      {/* Palm */}
      <rect x="22" y="55" width="58" height="55" rx="15" fill="#fcd34d" stroke="#d97706" strokeWidth="2" />
      {/* Palm crease line */}
      <path d="M 30,80 Q 50,75 70,85" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      
    </svg>
    
  );
};

const RightHand = ({ count, onClick }: { count: number, onClick: () => void }) => {
  const open = [count >= 1, count >= 2, count >= 3, count >= 4, count >= 5]; // Index, Middle, Ring, Pinky, Thumb
  return (
   <svg viewBox="0 0 100 120" className="w-full h-full max-h-48 drop-shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-transform" onClick={onClick}>
      {/* Fingers behind palm */}
      <rect x="22" y="25" width="12" height="40" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[3] ? 'translateY(0)' : 'translateY(30px)' }} />
      <rect x="36" y="15" width="12" height="50" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[2] ? 'translateY(0)' : 'translateY(35px)' }} />
      <rect x="50" y="10" width="12" height="55" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[1] ? 'translateY(0)' : 'translateY(40px)' }} />
      <rect x="64" y="20" width="12" height="45" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[0] ? 'translateY(0)' : 'translateY(35px)' }} />
      
      {/* Thumb (Right side) */}
      <rect x="65" y="65" width="38" height="14" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300 origin-[85px_72px]" style={{ transform: open[4] ? 'rotate(-40deg)' : 'rotate(0deg) translateX(-15px) scaleX(0.5)' }} />
      
      {/* Palm */}
      <rect x="20" y="55" width="58" height="55" rx="15" fill="#fcd34d" stroke="#d97706" strokeWidth="2" />
      {/* Palm crease line */}
      <path d="M 30,85 Q 50,75 70,80" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
   
  );
};


export default function CountingCombinations({ lesson, onComplete }: any) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  
  const [leftCount, setLeftCount] = useState(0);
  const [rightCount, setRightCount] = useState(0);
  
  const [isSuccessAnim, setIsSuccessAnim] = useState(false);
  const [isMatchFound, setIsMatchFound] = useState(false);
  const [warning, setWarning] = useState('');
  const [mounted, setMounted] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    const newQuestions: Question[] = [];
    for (let i = 0; i < 10; i++) {
      newQuestions.push({
        target: Math.floor(Math.random() * 10) + 1, // Target between 1 and 10
        emoji: EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]
      });
    }
    setQuestions(newQuestions);
    setMounted(true);
  }, []);

  const currentQuestion = questions[currentQIdx];
  const targetNumber = currentQuestion?.target || 1;
  const currentEmoji = currentQuestion?.emoji || '🌟';
  
  const currentTotal = leftCount + rightCount;
  const isMatch = currentTotal === targetNumber;

  // --- Audio Engine ---
  const audioCtx = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (typeof window === 'undefined') return;
    if (!audioCtx.current) {
      const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (WinAudioContext) audioCtx.current = new WinAudioContext();
    }
    if (audioCtx.current && audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  const playSound = (type: 'pop' | 'kaching' | 'error' | 'slide') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'kaching') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'slide') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    }
  };

  const speakSuccess = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Great! You matched ${targetNumber} objects!`);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Handlers ---
  const handleHandClick = (hand: 'left' | 'right') => {
    if (isMatchFound) return; 
    initAudio();
    
    if (hand === 'left') {
      if (leftCount < 5) {
        playSound('pop');
        setLeftCount(prev => prev + 1);
      }
    } else {
      if (rightCount < 5) {
        playSound('pop');
        setRightCount(prev => prev + 1);
      }
    }
  };

  const resetSelection = () => {
    if (isMatchFound) return;
    initAudio();
    playSound('slide');
    setLeftCount(0);
    setRightCount(0);
  };

  const showWarning = (msg: string) => {
    setWarning(msg);
    setTimeout(() => setWarning(''), 2000);
  };

  const handleCheck = () => {
    initAudio();
    if (!isMatch) {
      playSound('error');
      showWarning(currentTotal > targetNumber ? "Too many fingers!" : "Need more fingers!");
      return;
    }

    // Success!
    playSound('kaching');
    speakSuccess();
    setIsSuccessAnim(true);
    setIsMatchFound(true);
    
    setTimeout(() => {
      setIsSuccessAnim(false);
    }, 1500);
  };

  const handleNextQuestion = () => {
    initAudio();
    playSound('slide');
    if (currentQIdx >= questions.length - 1) {
      onComplete?.();
    } else {
      setCurrentQIdx(prev => prev + 1);
      setLeftCount(0);
      setRightCount(0);
      setIsMatchFound(false);
    }
  };

  if (!mounted || questions.length === 0) return null;

  return (
    // OUTERMOST WRAPPER
    <div className="w-full h-full flex flex-col bg-slate-50 font-sans min-h-0 overflow-hidden">
      
      {/* 1. HEADER (shrink-0) */}
      <div className="shrink-0 p-3 md:p-5 bg-white border-b-4 border-slate-200 flex justify-between items-center z-10 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="bg-sky-500 p-2 rounded-xl text-white hidden sm:block">
               <Hand size={20} />
            </div>
            <div>
               <h2 className="text-lg md:text-xl font-black text-slate-800 leading-none">Match the Objects</h2>
               <p className="text-[10px] md:text-xs font-bold text-sky-500 uppercase tracking-widest mt-1">Tap the hands!</p>
            </div>
         </div>
         
         <div className="bg-slate-100 text-slate-500 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border-2 border-slate-200 font-black flex items-center gap-2 text-sm">
            <Star size={14} className="fill-slate-400" />
            <span>{currentQIdx + 1} / 10</span>
         </div>
      </div>

      {/* 2. PLAY AREA (flex-1 min-h-0) - Split Screen Layout */}
      <div className="flex-1 min-h-0 relative flex flex-col md:flex-row p-4 md:p-6 gap-4 md:gap-6 overflow-y-auto md:overflow-hidden">
         
         {/* LEFT SIDE: The Objects */}
         <div className="flex-1 bg-white rounded-3xl border-4 border-sky-100 shadow-sm flex flex-col p-6 min-h-0 relative overflow-hidden">
            {/* NEW: Giant faded background number for subtle reinforcement */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] md:text-[16rem] font-black text-slate-50 opacity-50 pointer-events-none select-none z-0">
               {targetNumber}
            </div>

            <div className="text-center mb-6 shrink-0 flex items-center justify-center gap-3 relative z-10">
               <span className="text-slate-400 font-bold uppercase tracking-widest text-xs md:text-sm">How many?</span>
               {/* NEW: Clear Number Display */}
               <span className="bg-sky-100 text-sky-600 px-3 py-1 rounded-lg font-black text-xl md:text-2xl shadow-sm border-2 border-sky-200">
                  {targetNumber}
               </span>
            </div>
            
            {/* The Emojis Grid */}
            <div className="flex-1 flex items-center justify-center min-h-0 relative z-10">
               <div className="flex flex-wrap items-center justify-center gap-4 max-w-sm">
                  {Array.from({ length: targetNumber }).map((_, i) => (
                    <div key={i} className="text-5xl md:text-6xl animate-fade-in drop-shadow-sm transition-transform hover:scale-110" style={{ animationDelay: `${i * 0.05}s` }}>
                      {currentEmoji}
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* RIGHT SIDE: The Interactive Hands */}
         <div className="flex-1 bg-amber-50 rounded-3xl border-4 border-amber-100 shadow-sm flex flex-col p-6 min-h-0">
            <div className="text-center mb-6 shrink-0">
               <span className="text-amber-500 font-bold uppercase tracking-widest text-xs md:text-sm">Tap to open fingers</span>
            </div>
            
            {/* Hands Container */}
            <div className="flex-1 flex items-center justify-center min-h-0 gap-4 md:gap-8">
               <div className="w-32 h-40 md:w-48 md:h-56">
                  <LeftHand count={leftCount} onClick={() => handleHandClick('left')} />
               </div>
               <div className="w-32 h-40 md:w-48 md:h-56">
                  <RightHand count={rightCount} onClick={() => handleHandClick('right')} />
               </div>
            </div>
            
            {/* Total Counter (Optional visual feedback) */}
            <div className="text-center shrink-0 mt-4">
               <span className="bg-amber-200 text-amber-800 font-black px-6 py-2 rounded-full border-2 border-amber-300 text-xl">
                 Total Fingers: {currentTotal}
               </span>
            </div>
         </div>

         {/* Floating Success Overlay */}
         {isSuccessAnim && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-white/60 backdrop-blur-sm">
               <div className="bg-emerald-500 text-white px-8 md:px-12 py-4 md:py-6 rounded-full font-black text-2xl md:text-4xl shadow-2xl flex items-center gap-4 animate-[bounce_0.5s_infinite]">
                 <Sparkles className="fill-white" size={40} /> Perfect Match!
               </div>
            </div>
         )}
      </div>

      {/* 3. CONTROL PANEL (shrink-0) */}
      <div className="shrink-0 p-4 bg-white border-t-4 border-slate-200 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
         <div className="max-w-3xl mx-auto flex items-center justify-center gap-3 md:gap-4 relative">
            
            {/* Warning Tooltip */}
            {warning && (
              <div className="absolute -top-14 bg-rose-500 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 animate-fade-in shadow-lg z-20">
                 <AlertCircle size={16} /> {warning}
              </div>
            )}

            {!isMatchFound ? (
               <>
                 <button 
                   onClick={resetSelection}
                   className="flex-[1] md:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-all active:scale-95 border-b-4 border-slate-300 active:border-b-0"
                 >
                   <RotateCcw size={18} /> <span className="hidden sm:inline">Reset</span>
                 </button>

                 <button 
                   onClick={handleCheck}
                   disabled={currentTotal === 0}
                   className={`flex-[2] flex items-center justify-center gap-2 px-4 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg transition-all border-b-4 shadow-lg
                     ${currentTotal === 0 ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed' : 
                       isMatch ? 'bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-700 animate-pulse' : 
                       'bg-sky-500 hover:bg-sky-400 text-white border-sky-700 active:scale-95 active:border-b-0'}`}
                 >
                   <CheckCircle2 size={20} /> CHECK
                 </button>
               </>
            ) : (
               <button 
                 onClick={handleNextQuestion}
                 className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-lg md:text-xl transition-all active:scale-95 border-b-4 border-emerald-700 active:border-b-0 shadow-xl animate-fade-in"
               >
                 {currentQIdx >= questions.length - 1 ? 'FINISH' : 'NEXT'} <ChevronRight size={24} />
               </button>
            )}

         </div>
      </div>
    </div>
  );
}