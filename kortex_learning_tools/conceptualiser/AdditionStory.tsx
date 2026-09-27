'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, RotateCcw, Plus, BookOpen, Pencil, Eraser, Apple, ChevronRight, ChevronLeft, Play, Ruler, PenTool } from 'lucide-react';

// --- Data ---
const CATEGORIES = {
  notebooks: { id: 'notebooks', icon: '📘', name: 'Notebooks', rohan: 4, varun: 3, BtnIcon: BookOpen },
  pencils: { id: 'pencils', icon: '✏️', name: 'Pencils', rohan: 5, varun: 4, BtnIcon: Pencil },
  erasers: { id: 'erasers', icon: '🖱️', name: 'Erasers', rohan: 2, varun: 3, BtnIcon: Eraser },
  apples: { id: 'apples', icon: '🍎', name: 'Apples', rohan: 6, varun: 4, BtnIcon: Apple },
  crayons: { id: 'crayons', icon: '🖍️', name: 'Crayons', rohan: 3, varun: 5, BtnIcon: PenTool },
  rulers: { id: 'rulers', icon: '📏', name: 'Rulers', rohan: 1, varun: 2, BtnIcon: Ruler },
};

type CategoryId = keyof typeof CATEGORIES;
type AdditionState = 'idle' | 'animating' | 'combined';
type AppPhase = 'story' | 'interactive';

const STORY_SLIDES = [
  {
    image: '/assets/maths/FLN/AdditionStory1.webp',
    text: "It was Rohan's first day of Grade 1! He was very excited. As soon as he reached school, he made a new friend named Varun."
  },
  {
    image: '/assets/maths/FLN/AdditionStory2.webp',
    text: "Rohan wanted to show Varun all the new things he bought from the market yesterday. They both opened their bags to show their items."
  },
  {
    image: '/assets/maths/FLN/AdditionStory3.webp',
    text: "Rohan grouped all the similar items together. Notebooks with notebooks, pencils with pencils! Rohan said, 'Let's put our things together and count how many we have in total!'"
  }
];

export default function RohanVarunAddition({ lesson, onComplete }: any) {
  const [phase, setPhase] = useState<AppPhase>('story');
  const [currentSlide, setCurrentSlide] = useState(0);
  
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

  const playSound = (type: 'pop' | 'kaching' | 'slide' | 'whoosh') => {
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
    } else if (type === 'whoosh') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
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

  // --- Story Actions ---
  const handleNextSlide = () => {
    initAudio();
    playSound('pop');
    window.speechSynthesis.cancel();
    if (currentSlide < STORY_SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      startInteractive();
    }
  };

  const handlePrevSlide = () => {
    initAudio();
    playSound('pop');
    window.speechSynthesis.cancel();
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  const startInteractive = () => {
    initAudio();
    playSound('whoosh');
    window.speechSynthesis.cancel();
    setPhase('interactive');
  };

  // --- Interactive Actions ---
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
    
    setTimeout(() => {
      setAdditionState('combined');
      playSound('kaching');
      speakText(`${currentData.rohan} and ${currentData.varun} altogether makes ${totalItems}!`);
    }, 700);
  };

  const handleReset = () => {
    initAudio();
    playSound('pop');
    setAdditionState('idle');
  };

  if (!mounted) return null;

  // --- Layout Engine (Bound to the 4XL Container) ---
  const getItemStyle = (owner: 'rohan' | 'varun', index: number, totalIndex: number) => {
    const isCombined = additionState === 'animating' || additionState === 'combined';
    
    if (isCombined) {
      // Position directly above the Number Line ticks
      // Ticks span from 5% to 95% across the 4XL container.
      // (10 slots = 9 gaps of 10% each + 5% padding on ends)
      return {
        left: `${(totalIndex * 10) + 5}%`,
        top: '80%', 
        transform: 'translate(-50%, -100%) scale(1.1)', // Anchored to bottom so it rests on line
      };
    }

    // Grid layout tightly packed inside the Bags
    // Rohan's bag is at 0-45% width, Varun's at 55-100% width
    const col = index % 3;
    const row = Math.floor(index / 3);
    
    // Calculate base starting positions inside the bags
    const baseX = owner === 'rohan' ? 12 : 68; // Start left inside Rohan's bag, or left inside Varun's bag
    const xSpacing = 10; // Spacing between columns
    
    const yOffset = row === 0 ? 15 : 30; // Row 1 vs Row 2 heights

    return { 
        left: `calc(${baseX}% + ${col * xSpacing}%)`, 
        top: `${yOffset}%`, 
        transform: 'translate(-50%, -50%) scale(1)' 
    };
  };

  // ============================================================================
  // RENDER: PHASE 1 - THE STORY
  // ============================================================================
  if (phase === 'story') {
    const slide = STORY_SLIDES[currentSlide];
    const isLastSlide = currentSlide === STORY_SLIDES.length - 1;

    return (
      <div className="w-full h-full flex flex-col bg-slate-50 font-sans min-h-0">
        <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6 overflow-y-auto">
           <div className="max-w-4xl w-full mx-auto flex flex-col h-full gap-4">
              
              <div className="flex-1 min-h-0 w-full bg-slate-200 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl relative">
                 <img src={slide.image} alt="Story scene" className="absolute inset-0 w-full h-full object-contain bg-sky-50 z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                 <button 
                   onClick={() => { initAudio(); speakText(slide.text); }}
                   className={`absolute top-4 right-4 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-b-4 transition-all active:translate-y-1 shadow-lg ${isSpeaking ? 'bg-amber-100 text-amber-500 border-amber-200 animate-pulse' : 'bg-sky-500 text-white border-sky-700 hover:bg-sky-400'}`}
                 >
                   <Volume2 size={24} />
                 </button>
              </div>

              <div className="shrink-0 bg-white rounded-[2rem] p-6 border-4 border-slate-100 shadow-sm flex items-center justify-center text-center">
                 <p className="text-lg md:text-xl font-bold text-slate-700 leading-relaxed max-w-2xl">
                   {slide.text}
                 </p>
              </div>
           </div>
        </div>

        <div className="shrink-0 p-4 flex justify-between items-center max-w-4xl mx-auto w-full">
           <button 
             onClick={handlePrevSlide} 
             className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
           >
             <ChevronLeft size={16} /> Back
           </button>
           <div className="flex gap-2">
             {STORY_SLIDES.map((_, i) => (
               <div key={i} className={`w-2.5 h-2.5 rounded-full ${i === currentSlide ? 'bg-sky-500 scale-125' : 'bg-slate-300'} transition-all`} />
             ))}
           </div>
           <button 
             onClick={handleNextSlide}
             className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-md"
           >
             {isLastSlide ? 'Start' : 'Next'} <ChevronRight size={16} />
           </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: PHASE 2 - THE INTERACTIVE TOOL
  // ============================================================================
  return (
    <div className="w-full h-full flex flex-col bg-amber-50 font-sans min-h-0 relative overflow-hidden">
      
      {/* 1. COMPACT CATEGORY NAV */}
      <div className="shrink-0 flex justify-center items-center gap-2 py-3 px-2 overflow-x-auto bg-white/50 backdrop-blur-sm border-b-2 border-amber-100 shadow-sm z-20">
        <button onClick={() => { initAudio(); speakText("Select an item to add!"); }} className="w-8 h-8 rounded-full bg-sky-100 text-sky-500 flex items-center justify-center hover:bg-sky-200 mr-2 shrink-0"><Volume2 size={16} /></button>
        {(Object.keys(CATEGORIES) as CategoryId[]).map((key) => {
          const cat = CATEGORIES[key];
          const isActive = activeCategory === key;
          const Icon = cat.BtnIcon;
          return (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 font-bold text-xs md:text-sm transition-all border
                ${isActive ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* 2. PLAY AREA */}
      <div className="flex-1 min-h-0 w-full flex justify-center p-4">
        
        {/* MASTER BOUNDING BOX: Everything anchors to this relative container */}
        <div className="w-full max-w-4xl h-full relative flex flex-col">
            
            {/* The Bags Container */}
            <div className="w-full h-[55%] flex items-center justify-between relative mt-2 z-10">
                
                {/* Rohan's Bag */}
                <div className="w-[42%] h-full bg-blue-100/80 rounded-[2rem] border-4 border-blue-200 relative pt-4 pb-12 shadow-sm">
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest">Rohan's Bag</div>
                   <div className="absolute bottom-3 w-full text-center text-3xl font-black text-blue-300">{currentData.rohan}</div>
                </div>

                {/* Giant Plus Button */}
                <button 
                  onClick={handleAdd}
                  disabled={additionState !== 'idle'}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white font-black text-4xl shadow-xl transition-all z-20 border-b-[6px]
                    ${additionState === 'idle' ? 'bg-sky-500 hover:bg-sky-400 hover:scale-110 border-sky-700 cursor-pointer active:translate-y-1 active:border-b-0 animate-pulse' : 'bg-slate-300 border-slate-400 scale-90 cursor-not-allowed'}`}
                >
                  <Plus size={40} strokeWidth={4} />
                </button>

                {/* Varun's Bag */}
                <div className="w-[42%] h-full bg-purple-100/80 rounded-[2rem] border-4 border-purple-200 relative pt-4 pb-12 shadow-sm">
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest">Varun's Bag</div>
                   <div className="absolute bottom-3 w-full text-center text-3xl font-black text-purple-300">{currentData.varun}</div>
                </div>
            </div>

            {/* --- The Moving Items --- */}
            {/* These are absolute to the Master Bounding Box, so percentages work perfectly */}
            <div className="absolute inset-0 pointer-events-none z-30">
                {/* Rohan's Items */}
                {Array.from({ length: currentData.rohan }).map((_, i) => (
                  <div key={`r-${i}`} className="absolute text-4xl md:text-5xl transition-all duration-700 ease-in-out drop-shadow-md" style={getItemStyle('rohan', i, i)}>
                    {currentData.icon}
                  </div>
                ))}

                {/* Varun's Items */}
                {Array.from({ length: currentData.varun }).map((_, i) => (
                  <div key={`v-${i}`} className="absolute text-4xl md:text-5xl transition-all duration-700 ease-in-out drop-shadow-md" style={getItemStyle('varun', i, currentData.rohan + i)}>
                    {currentData.icon}
                  </div>
                ))}
            </div>

            {/* Final Equation Pop-up */}
            {additionState === 'combined' && (
              <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-3 rounded-3xl border-4 border-emerald-200 shadow-2xl flex items-center gap-3 text-3xl md:text-5xl font-black animate-fade-in-up z-40">
                <span className="text-blue-500">{currentData.rohan}</span>
                <span className="text-slate-300">+</span>
                <span className="text-purple-500">{currentData.varun}</span>
                <span className="text-slate-300">=</span>
                <span className="text-emerald-500 animate-[bounce_1s_infinite]">{totalItems}</span>
              </div>
            )}

            {/* The Number Line */}
            <div className="absolute bottom-[10%] left-0 w-full h-16 flex flex-col justify-end pointer-events-none z-10">
               <div className="w-full h-3 bg-amber-200 rounded-full relative">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={`tick-${i}`} className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: `${(i * 10) + 5}%` }}>
                      <div className="w-1.5 h-6 bg-amber-400 rounded-full -mt-1.5"></div>
                      <span className={`mt-2 font-black text-xs md:text-lg transition-colors duration-500 ${(additionState === 'combined' && i < totalItems) ? 'text-emerald-500 scale-125' : 'text-amber-500'}`}>
                        {i + 1}
                      </span>
                      {/* Invisible Drop Target for Emojis */}
                      <div className="absolute -top-16 w-12 h-12 bg-black/5 rounded-full blur-[2px] opacity-0"></div>
                    </div>
                  ))}
               </div>
            </div>

        </div>
      </div>

      {/* Floating Reset Button */}
      {additionState !== 'idle' && (
        <button 
          onClick={handleReset}
          className="absolute bottom-80 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 bg-white text-slate-600 px-6 py-2 rounded-full font-bold text-sm transition-all border-2 border-slate-200 shadow-lg hover:bg-slate-50 z-40 animate-fade-in"
        >
          <RotateCcw size={16} /> Reset
        </button>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translate(-50%, 20px) scale(0.9); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}} />
    </div>
  );
}