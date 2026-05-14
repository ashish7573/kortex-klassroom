'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Minus, Volume2, Star, Target } from 'lucide-react';

interface Coin {
  id: number;
  value: number;
  exiting: boolean;
}

export default function MoreLess({ lesson, onComplete }: any) {
  const [uiState, setUiState] = useState<'menu' | 'playing'>('menu');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioCtx = useRef<AudioContext | null>(null);

  // --- Audio Synthesis (iOS Safe) ---
  const initAudio = () => {
    if (typeof window === 'undefined') return;
    if (!audioCtx.current) {
      const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (WinAudioContext) audioCtx.current = new WinAudioContext();
    }
    if (audioCtx.current && audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
    if ('speechSynthesis' in window) {
      const unlockSpeech = new SpeechSynthesisUtterance('');
      unlockSpeech.volume = 0; 
      window.speechSynthesis.speak(unlockSpeech);
    }
  };

  const playSound = (type: 'slide-in' | 'slide-out' | 'error') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'slide-in') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'slide-out') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    }
  };

  const speakNumber = (num: number, prefix: string = '') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${prefix} ${num}`);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Game Math & Interactions ---
  const startGame = () => {
    initAudio();
    const initialCoins = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      value: i + 1,
      exiting: false
    }));
    setCoins(initialCoins);
    setUiState('playing');
    speakNumber(5);
  };

  const activeCoins = coins.filter(c => !c.exiting);
  const currentCount = activeCoins.length;

  const handleOneMore = () => {
    if (currentCount >= 10) return playSound('error');
    
    initAudio();
    const newVal = currentCount + 1;
    playSound('slide-in');
    speakNumber(newVal, 'One more makes');
    
    setCoins([...coins, { id: Date.now(), value: newVal, exiting: false }]);
  };

  const handleOneLess = () => {
    if (currentCount <= 0) return playSound('error');
    
    initAudio();
    const newVal = currentCount - 1;
    playSound('slide-out');
    speakNumber(newVal, 'One less makes');
    
    const topCoin = activeCoins[activeCoins.length - 1];
    
    // Trigger animation state
    setCoins(coins.map(c => c.id === topCoin.id ? { ...c, exiting: true } : c));
    
    // Remove from DOM strictly after animation finishes
    setTimeout(() => {
      setCoins(prev => prev.filter(c => c.id !== topCoin.id));
    }, 250);
  };

  // --- SVG Coin Renderer ---
  const IsometricCoin = () => (
    <svg viewBox="0 0 100 40" className="w-full h-full drop-shadow-md overflow-visible">
       <path d="M 0,20 C 0,31 22.4,40 50,40 C 77.6,40 100,31 100,20 L 100,25 C 100,36 77.6,45 50,45 C 22.4,45 0,36 0,25 Z" fill="#b45309" />
       <ellipse cx="50" cy="20" rx="50" ry="20" fill="#fbbf24" />
       <ellipse cx="50" cy="20" rx="40" ry="15" fill="#f59e0b" />
       <ellipse cx="40" cy="15" rx="20" ry="6" fill="#fef08a" opacity="0.6" transform="rotate(-15 40 15)" />
    </svg>
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-50 font-sans select-none flex flex-col">
      
      {/* ISOLATED KEYFRAME ANIMATIONS (Slides horizontally to avoid layout jumping) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-in-coin { 0% { transform: translateX(40px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes slide-out-coin { 0% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(40px); opacity: 0; } }
      `}} />

      {/* HEADER */}
      <div className="h-16 md:h-20 bg-white border-b-4 border-slate-200 flex items-center justify-between px-4 md:px-8 z-40 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500 p-2 rounded-2xl shadow-inner">
            <Target className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-slate-800 font-black text-sm md:text-xl uppercase leading-none">One More, One Less</h1>
            <p className="text-sky-600 text-[10px] md:text-xs font-bold uppercase tracking-widest">Numbers 0 to 10</p>
          </div>
        </div>

        {uiState === 'playing' && (
          <div className="flex gap-2">
            <button onClick={() => speakNumber(currentCount)} className={`p-2 rounded-xl border-b-4 transition-transform active:translate-y-1 ${isSpeaking ? 'bg-sky-100 border-sky-200 text-sky-500' : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-sky-500'}`}>
              <Volume2 className={`w-5 h-5 md:w-6 md:h-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
            </button>
            <button onClick={() => onComplete?.()} className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-black border-b-4 border-emerald-700 transition-transform active:translate-y-1 flex items-center gap-2 shadow-sm hover:bg-emerald-400">
               <Star className="w-4 h-4 fill-white" /> <span className="hidden md:inline">FINISH</span>
            </button>
          </div>
        )}
      </div>

      {/* PLAY AREA */}
      {uiState === 'playing' && (
        <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200 min-h-0">
          
          {/* TOTAL BOX (Safely pinned to TOP RIGHT, completely out of the way) */}
          <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-white px-6 py-4 rounded-3xl shadow-xl border-4 border-slate-100 flex flex-col items-center z-50">
             <span className="text-slate-400 font-bold uppercase text-[10px] md:text-xs tracking-widest mb-1">Total</span>
             <span className="text-4xl md:text-5xl font-black text-slate-800 leading-none">{currentCount}</span>
          </div>

          {/* PERFECT ALIGNMENT TRACK (1-to-1 Mapping) */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center p-4 md:p-12 relative overflow-hidden">
             
             {/* The Unified Grid (Vertical on Mobile, Horizontal on Desktop) */}
             <div className="flex flex-col-reverse md:flex-row justify-between items-center w-full h-full max-h-[70vh] md:max-h-none md:max-w-6xl relative z-10">
                
                {/* Background Connecting Line */}
                <div className="absolute left-[2.25rem] top-4 bottom-4 w-2 md:left-4 md:right-4 md:top-auto md:bottom-[1.75rem] md:h-2 bg-slate-300/50 rounded-full z-0"></div>

                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                   const isActive = currentCount === num;
                   const coin = coins.find(c => c.value === num);
                   
                   return (
                      <div key={num} className="flex flex-row md:flex-col-reverse items-center justify-start md:justify-center w-full md:w-auto h-auto md:h-full gap-4 md:gap-0 relative z-10">
                         
                         {/* 1. NUMBER LINE NODE */}
                         <div className="w-20 md:h-16 flex items-center justify-center shrink-0 z-20">
                            <div className={`flex items-center justify-center rounded-full font-black transition-all duration-300
                              ${isActive 
                                ? 'w-10 h-10 md:w-12 md:h-12 bg-sky-500 text-white text-lg md:text-xl shadow-[0_0_15px_rgba(14,165,233,0.5)] border-4 border-white scale-125' 
                                : 'w-6 h-6 md:w-8 md:h-8 bg-white text-slate-400 text-xs md:text-sm border-4 border-slate-200'}`}
                            >
                              {num}
                            </div>
                         </div>

                         {/* 2. COIN SLOT (Perfectly mapped next to its number) */}
                         <div className="flex-1 md:flex-none md:w-20 lg:w-24 md:h-32 flex items-center md:items-end justify-start md:justify-center relative pb-0 md:pb-6">
                            {num === 0 ? (
                               // Base marker for '0'
                               <div className="w-16 md:w-full aspect-[5/2] border-4 border-dashed border-slate-300 rounded-[100%] opacity-50"></div>
                            ) : coin ? (
                               // Isolated coin wrapper (Animation ONLY affects this div, completely preventing layout jitter)
                               <div className={`absolute w-16 md:w-full aspect-[5/2] z-30 ${coin.exiting ? 'animate-[slide-out-coin_0.25s_ease-in_forwards]' : 'animate-[slide-in-coin_0.3s_ease-out_forwards]'}`}>
                                  <IsometricCoin />
                               </div>
                            ) : null}
                         </div>

                      </div>
                   );
                })}
             </div>
          </div>

          {/* ACTION CONTROLS (Safely anchored to bottom using flex shrink) */}
          <div className="h-28 md:h-36 w-full bg-white border-t-4 border-slate-200 shrink-0 p-4 md:p-6 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
             <div className="max-w-3xl mx-auto flex items-center justify-center gap-4 md:gap-8 h-full">
                
                {/* ONE LESS */}
                <button 
                  onClick={handleOneLess}
                  disabled={currentCount === 0}
                  className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 h-full rounded-2xl md:rounded-3xl border-b-[6px] transition-all active:translate-y-1 
                    ${currentCount === 0 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-rose-500 border-rose-700 text-white hover:bg-rose-400 hover:shadow-lg hover:shadow-rose-200'}`}
                >
                  <div className={`p-2 rounded-full ${currentCount === 0 ? 'bg-slate-200' : 'bg-rose-400 shadow-inner'}`}>
                    <Minus className="w-6 h-6 md:w-8 md:h-8" strokeWidth={4} />
                  </div>
                  <span className="font-black text-sm md:text-2xl uppercase tracking-wider">One Less</span>
                </button>

                {/* ONE MORE */}
                <button 
                  onClick={handleOneMore}
                  disabled={currentCount === 10}
                  className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 h-full rounded-2xl md:rounded-3xl border-b-[6px] transition-all active:translate-y-1 
                    ${currentCount === 10 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-200'}`}
                >
                  <div className={`p-2 rounded-full ${currentCount === 10 ? 'bg-slate-200' : 'bg-emerald-400 shadow-inner'}`}>
                    <Plus className="w-6 h-6 md:w-8 md:h-8" strokeWidth={4} />
                  </div>
                  <span className="font-black text-sm md:text-2xl uppercase tracking-wider">One More</span>
                </button>

             </div>
          </div>

        </div>
      )}

      {/* MENU OVERLAY */}
      {uiState === 'menu' && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-xl w-full shadow-2xl text-center border-4 border-slate-100">
            <div className="w-24 h-24 bg-sky-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Target className="w-12 h-12 text-sky-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">One More,<br/>One Less!</h2>
            <p className="text-slate-500 font-bold mb-10 text-lg">Add coins or take them away to see how numbers change.</p>
            <button onClick={startGame} className="w-full py-5 bg-sky-500 hover:bg-sky-400 text-white font-black text-2xl rounded-2xl shadow-xl border-b-8 border-sky-700 transition-transform active:translate-y-2 flex items-center justify-center gap-3">
               <Play fill="currentColor" /> START EXPLORING
            </button>
          </div>
        </div>
      )}
    </div>
  );
}