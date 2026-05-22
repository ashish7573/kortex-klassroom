'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, RotateCcw, Plus, BookOpen, Pencil, Eraser, Apple, Backpack } from 'lucide-react';

// --- Data ---
const CATEGORIES = {
  notebooks: { id: 'notebooks', icon: '📘', name: 'Notebooks', rohan: 4, varun: 3, BtnIcon: BookOpen },
  pencils: { id: 'pencils', icon: '✏️', name: 'Pencils', rohan: 5, varun: 4, BtnIcon: Pencil },
  erasers: { id: 'erasers', icon: '🧽', name: 'Erasers', rohan: 2, varun: 3, BtnIcon: Eraser },
  apples: { id: 'apples', icon: '🍎', name: 'Apples', rohan: 6, varun: 4, BtnIcon: Apple },
};

type CategoryId = keyof typeof CATEGORIES;
type AdditionState = 'idle' | 'animating' | 'combined';

export default function RohanVarunAddition({ lesson, onComplete }: any) {
  // --- State ---
  const [activeCategory, setActiveCategory] = useState<CategoryId>('notebooks');
  const [additionState, setAdditionState] = useState<AdditionState>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const currentData = CATEGORIES[activeCategory];
  const totalItems = currentData.rohan + currentData.varun;

  // --- Audio Engine ---
  const audioCtx = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (typeof window === 'undefined') return;
    if (!audioCtx.current) {
      const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (WinAudioContext) audioCtx.current = new WinAudioContext();
    }
    if (audioCtx.current && audioCtx.current.state === 'suspended') audioCtx.current.resume();
  };

  const playSound = (type: 'pop' | 'kaching' | 'slide') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'pop') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'kaching') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'slide') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN'; 
      utterance.rate = 0.9; 
      utterance.pitch = 1.1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReadStory = () => {
    initAudio();
    speakText(`Rohan and his friend Varun are taking things out of their school bags. Rohan has ${currentData.rohan} ${currentData.name}, and Varun has ${currentData.varun}. Let's put them together to see how many they have in total!`);
  };

  // --- Actions ---
  const handleCategoryChange = (id: CategoryId) => {
    if (additionState === 'animating') return;
    initAudio();
    playSound('pop');
    setActiveCategory(id);
    setAdditionState('idle');
  };

  const handleAdd = () => {
    if (additionState !== 'idle') return;
    initAudio();
    playSound('slide');
    setAdditionState('animating');
    
    // Allow animation to complete, then show combined state & play success
    setTimeout(() => {
      setAdditionState('combined');
      playSound('kaching');
      speakText(`${currentData.rohan} plus ${currentData.varun} makes ${totalItems}!`);
    }, 700);
  };

  const handleReset = () => {
    initAudio();
    playSound('pop');
    setAdditionState('idle');
  };

  if (!mounted) return null;

  // --- Animation Positioning Logic ---
  // Returns { left, top } percentages for absolute positioning
  const getItemStyle = (owner: 'rohan' | 'varun', index: number, totalIndex: number) => {
    const isCombined = additionState === 'animating' || additionState === 'combined';
    
    // Target combined position (on the number line)
    // 10 slots spanning 5% to 95%, so each slot centers at (totalIndex * 10) + 5%
    if (isCombined) {
      return {
        left: `${(totalIndex * 10) + 5}%`,
        top: '72%', // Just above the number line
        transform: 'translate(-50%, -50%) scale(1.1)',
      };
    }

    // Idle position (in their respective boxes)
    // We create a mini 3x2 grid inside the 30% width boxes
    const col = index % 3;
    const row = Math.floor(index / 3);
    
    if (owner === 'rohan') {
      return {
        left: `${15 + col * 8}%`,
        top: `${22 + row * 12}%`,
        transform: 'translate(-50%, -50%) scale(1)',
      };
    } else {
      return {
        left: `${65 + col * 8}%`,
        top: `${22 + row * 12}%`,
        transform: 'translate(-50%, -50%) scale(1)',
      };
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden bg-amber-50 font-sans">
      
      {/* 1. HEADER (STORY) - shrink-0 */}
      <div className="shrink-0 p-4 md:p-6 bg-white border-b-4 border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 relative z-20">
        <button 
          onClick={handleReadStory}
          className={`shrink-0 w-16 h-16 rounded-full flex items-center justify-center border-b-4 transition-all active:translate-y-1 ${isSpeaking ? 'bg-amber-100 text-amber-500 border-amber-200 animate-pulse' : 'bg-sky-500 text-white border-sky-700 hover:bg-sky-400'}`}
        >
          <Volume2 size={32} />
        </button>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">Rohan & Varun's School Bags</h2>
          <p className="text-sm md:text-base font-bold text-slate-500">Rohan and his new friend Varun are showing what they brought. Let's put their items together and count the total!</p>
        </div>
      </div>

      {/* 2. CATEGORY SELECTOR - shrink-0 */}
      <div className="shrink-0 flex justify-center gap-2 md:gap-4 py-4 px-2 overflow-x-auto bg-slate-50 border-b-4 border-slate-200 z-10">
        {(Object.keys(CATEGORIES) as CategoryId[]).map((key) => {
          const cat = CATEGORIES[key];
          const isActive = activeCategory === key;
          const Icon = cat.BtnIcon;
          return (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`shrink-0 px-4 py-2 md:px-6 md:py-3 rounded-2xl flex items-center gap-2 font-black text-sm md:text-base transition-all border-b-4 active:translate-y-1 active:border-b-0
                ${isActive ? 'bg-amber-500 text-white border-amber-700 shadow-md scale-105' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* 3. PLAY AREA - flex-1 min-h-0 relative */}
      <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center p-4 overflow-hidden">
        
        {/* Background Drop Zones (Rohan's & Varun's Bags) */}
        <div className="absolute top-[8%] left-[5%] w-[40%] md:w-[35%] h-[40%] bg-blue-100 rounded-3xl border-4 border-blue-200 shadow-inner flex flex-col items-center pt-3 opacity-80">
           <Backpack className="text-blue-300 mb-1" size={24} />
           <span className="font-black text-blue-500 uppercase tracking-widest text-[10px] md:text-xs">Rohan's Bag</span>
           <span className="font-black text-3xl text-blue-400 mt-auto mb-4">{currentData.rohan}</span>
        </div>
        
        <div className="absolute top-[8%] right-[5%] w-[40%] md:w-[35%] h-[40%] bg-purple-100 rounded-3xl border-4 border-purple-200 shadow-inner flex flex-col items-center pt-3 opacity-80">
           <Backpack className="text-purple-300 mb-1" size={24} />
           <span className="font-black text-purple-500 uppercase tracking-widest text-[10px] md:text-xs">Varun's Bag</span>
           <span className="font-black text-3xl text-purple-400 mt-auto mb-4">{currentData.varun}</span>
        </div>

        {/* Giant Plus Button */}
        <button 
          onClick={handleAdd}
          disabled={additionState !== 'idle'}
          className={`absolute top-[20%] left-1/2 -translate-x-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white font-black text-4xl shadow-xl transition-all z-20 border-b-[6px]
            ${additionState === 'idle' ? 'bg-sky-500 hover:bg-sky-400 hover:scale-110 border-sky-700 cursor-pointer active:translate-y-1 active:border-b-0' : 'bg-slate-300 border-slate-400 scale-90 cursor-not-allowed'}`}
        >
          <Plus size={40} strokeWidth={4} />
        </button>

        {/* Number Line Area (Bottom) */}
        <div className="absolute bottom-[8%] left-[5%] right-[5%] h-24 flex flex-col justify-end">
           {/* The Line */}
           <div className="w-full h-3 bg-amber-200 rounded-full relative">
              {/* Ticks & Numbers */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={`tick-${i}`} className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: `${(i * 10) + 5}%` }}>
                  <div className="w-1.5 h-6 bg-amber-300 rounded-full -mt-1.5"></div>
                  <span className={`mt-2 font-black text-sm md:text-xl transition-colors duration-500 ${(additionState === 'combined' && i < totalItems) ? 'text-emerald-500 scale-125' : 'text-amber-400'}`}>
                    {i + 1}
                  </span>
                  {/* Drop Shadow Slots */}
                  <div className="absolute -top-16 w-12 h-12 bg-black/5 rounded-full blur-[2px]"></div>
                </div>
              ))}
           </div>
        </div>

        {/* Moving Items: Rohan's */}
        {Array.from({ length: currentData.rohan }).map((_, i) => (
          <div 
            key={`r-${i}`} 
            className="absolute text-4xl md:text-5xl transition-all duration-700 ease-in-out z-30 drop-shadow-md select-none"
            style={getItemStyle('rohan', i, i)}
          >
            {currentData.icon}
          </div>
        ))}

        {/* Moving Items: Varun's */}
        {Array.from({ length: currentData.varun }).map((_, i) => (
          <div 
            key={`v-${i}`} 
            className="absolute text-4xl md:text-5xl transition-all duration-700 ease-in-out z-30 drop-shadow-md select-none"
            style={getItemStyle('varun', i, currentData.rohan + i)}
          >
            {currentData.icon}
          </div>
        ))}

        {/* Final Equation Pop-up */}
        {additionState === 'combined' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[20%] bg-white px-8 py-4 rounded-[2rem] border-4 border-emerald-200 shadow-2xl flex items-center gap-4 text-4xl md:text-6xl font-black animate-fade-in-up z-40">
            <span className="text-blue-500">{currentData.rohan}</span>
            <span className="text-slate-300">+</span>
            <span className="text-purple-500">{currentData.varun}</span>
            <span className="text-slate-300">=</span>
            <span className="text-emerald-500 animate-[bounce_1s_infinite]">{totalItems}</span>
          </div>
        )}

      </div>

      {/* 4. CONTROL PANEL - shrink-0 */}
      <div className="shrink-0 p-4 bg-white border-t-4 border-slate-200 flex justify-center z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleReset}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-bold text-lg md:text-xl transition-all active:scale-95 border-b-4 border-slate-300 active:border-b-0 w-full max-w-sm"
        >
          <RotateCcw size={24} /> Reset Bags
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translate(-50%, 20px) scale(0.9); } to { opacity: 1; transform: translate(-50%, -20%) scale(1); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}} />
    </div>
  );
}