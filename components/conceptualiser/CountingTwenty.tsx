"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronRight, ChevronLeft, Plus, Minus, RotateCcw, List } from 'lucide-react';

// --- Types & Data ---
type AppPhase = 'story' | 'interactive';

const STORY_SLIDES = [
  {
    image: '/assets/maths/FLN/CountingTwenty1.webp',
    text: "It was Sunday, and Rohan's school was closed. He went with his father to their fruit shop, 'Krishna Fruits.' Rohan was very excited to help his father at the store!"
  },
  {
    image: '/assets/maths/FLN/CountingTwenty2.webp',
    text: "His father had many orders to pack. Rohan looked at the order slip and happily packed 6 apples for the first order, and 8 apples for the second order."
  },
  {
    image: '/assets/maths/FLN/CountingTwenty3.webp',
    text: "Then, Rohan saw the next order. It said '14'. Rohan thought for a moment, packed 5 apples, and asked, 'Papa, I put 1 apple and then 4 apples, making 5. Did I do it right?'"
  },
  {
    image: '/assets/maths/FLN/CountingTwenty4.webp',
    text: "His father laughed gently. 'No, my boy! That is not 1 and 4. That is a 10 and a 4, making fourteen!' Rohan was confused. 'But Papa, I only know how to count up to 10!'"
  },
  {
    image: '/assets/maths/FLN/CountingTwenty5.webp',
    text: "His father gave Rohan an empty box. 'Fill this box.' Rohan filled it and saw it held exactly 10 apples. 'What if a customer wants more?' asked his father. 'We add more apples in another box!' said Rohan. 'Exactly! Let's make numbers bigger than 10.'"
  }
];

const NUMBER_WORDS = [
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", 
    "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"
];

export default function CountingTwenty({ lesson, onComplete }: any) {
  const [phase, setPhase] = useState<AppPhase>('story');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Interactive State
  const [addedApples, setAddedApples] = useState(0);
  const [discoveredNumbers, setDiscoveredNumbers] = useState<number[]>([]);
  const [showAllView, setShowAllView] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  const playSound = (type: 'pop' | 'kaching' | 'slide' | 'error' | 'horn' | 'click') => {
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
    } else if (type === 'horn') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(350, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'click') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'error') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
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
    playSound('horn');
    window.speechSynthesis.cancel();
    setPhase('interactive');
  };

  // --- Interactive Actions ---
  const handleAddApple = () => {
    if (addedApples < 10) {
      const newVal = addedApples + 1;
      setAddedApples(newVal);
      playSound('pop');
      
      if (!discoveredNumbers.includes(newVal)) {
          setDiscoveredNumbers(prev => [...prev, newVal]);
      }
      
      const word = NUMBER_WORDS[newVal];
      speakText(`Ten and ${newVal} makes ${word}`);
      
      if (newVal === 10) {
          setTimeout(() => playSound('kaching'), 500);
      }
    } else {
        playSound('error');
    }
  };

  const handleRemoveApple = () => {
    if (addedApples > 0) {
      const newVal = addedApples - 1;
      setAddedApples(newVal);
      playSound('click');
      if (newVal === 0) {
          speakText("Just ten.");
      } else {
          const word = NUMBER_WORDS[newVal];
          speakText(`Ten and ${newVal} makes ${word}`);
      }
    }
  };

  const handleReset = () => {
      setAddedApples(0);
      setShowAllView(false);
      playSound('click');
  };

  const jumpToNumber = (num: number) => {
      setAddedApples(num);
      setShowAllView(false);
      playSound('pop');
      const word = NUMBER_WORDS[num];
      speakText(num === 0 ? "Just ten." : `Ten and ${num} makes ${word}`);
  };

  if (!mounted) return null;

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
  const currentTotal = 10 + addedApples;
  const currentWord = NUMBER_WORDS[addedApples];
  const hasDiscoveredAll = discoveredNumbers.length === 10;

  return (
    <div className="w-full h-full flex flex-col bg-sky-50 font-sans min-h-[600px] relative overflow-hidden">
      
      {/* MAIN AREA */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col items-stretch justify-start gap-4 p-4 overflow-y-auto hide-scrollbar pb-32">
          
          {showAllView ? (
              /* --- SHOW ALL VIEW --- */
              <div className="w-full flex flex-col gap-3 animate-fade-in-up">
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-200 sticky top-0 z-10">
                      <h2 className="text-xl font-black text-slate-700">All Numbers 11 to 20</h2>
                      <button onClick={() => setShowAllView(false)} className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95">
                          Back to Practice
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <div key={num} onClick={() => jumpToNumber(num)} className="bg-white p-4 rounded-[1.5rem] border-4 border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-sky-300 transition-all group">
                              <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 bg-lime-100 rounded-xl flex items-center justify-center text-3xl font-black text-lime-700 border-2 border-lime-200 group-hover:scale-105 transition-all">
                                      {10 + num}
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="text-sm font-bold text-slate-400">10 + {num}</span>
                                      <span className="text-xl font-black text-indigo-700">{NUMBER_WORDS[num]}</span>
                                  </div>
                              </div>
                              <Volume2 className="text-slate-300 group-hover:text-sky-500 transition-colors" size={24} />
                          </div>
                      ))}
                  </div>
              </div>
          ) : (
              /* --- STANDARD 2-COLUMN LAYOUT (Stacked horizontally on large screens) --- */
              <div className="flex flex-col lg:flex-row gap-4 w-full h-full">
                  
                  {/* LEFT: VISUALS (The Boxes) */}
                  <div className="flex-1 flex flex-col gap-4 bg-white/60 p-4 md:p-6 rounded-[2rem] border-4 border-white shadow-lg shrink-0 lg:h-full lg:justify-center">
                      <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Apples</h3>
                          <button onClick={handleReset} className="text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors active:scale-95">
                              <RotateCcw size={14} /> Clear
                          </button>
                      </div>

                      {/* Top Box (Permanently 10 with visible slots) */}
                      <div className="relative w-full bg-amber-100 rounded-2xl border-4 border-amber-600 p-3 shadow-inner flex flex-col items-center justify-center min-h-[140px] lg:min-h-[180px]">
                          <div className="absolute -top-3 left-4 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">Box of 10</div>
                          
                          <div className="grid grid-cols-5 gap-1 sm:gap-2 w-fit mx-auto bg-amber-200/50 p-1.5 sm:p-2 rounded-xl border-2 border-amber-300">
                              {Array.from({length: 10}).map((_, i) => (
                                  <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-amber-50/80 rounded-lg border-2 border-amber-200/50 flex items-center justify-center shadow-inner">
                                      <span className="text-3xl sm:text-4xl lg:text-5xl drop-shadow-md">🍎</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="flex justify-center -my-2 z-10 shrink-0"><Plus size={32} className="text-slate-300 bg-sky-50 rounded-full" strokeWidth={4} /></div>

                      {/* Bottom Box (Interactive with empty slots) */}
                      <div 
                          onClick={handleAddApple}
                          className={`relative w-full rounded-2xl border-4 border-dashed p-3 min-h-[140px] lg:min-h-[180px] flex flex-col items-center justify-center transition-all cursor-pointer group
                              ${addedApples > 0 ? 'bg-amber-50/80 border-amber-400' : 'bg-slate-50 border-slate-300 hover:border-sky-400 hover:bg-sky-50'}`}
                      >
                          <div className="absolute -top-3 left-4 bg-slate-400 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">Loose Apples</div>
                          
                          <div className={`grid grid-cols-5 gap-1 sm:gap-2 w-fit mx-auto p-1.5 sm:p-2 rounded-xl border-2 transition-all ${addedApples > 0 ? 'bg-amber-200/30 border-amber-300/50' : 'bg-slate-200/50 border-slate-300'}`}>
                              {Array.from({length: 10}).map((_, i) => (
                                  <div key={i} className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-lg flex items-center justify-center shadow-inner border-2 transition-all ${i < addedApples ? 'bg-amber-50/80 border-amber-200/50' : 'bg-white/40 border-dashed border-slate-300/50'}`}>
                                      {i < addedApples && (
                                          <span className="text-3xl sm:text-4xl lg:text-5xl drop-shadow-md animate-fade-in-up">🍎</span>
                                      )}
                                  </div>
                              ))}
                          </div>

                          {/* "Tap to add" overlay when 0 */}
                          {addedApples === 0 && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 font-bold italic gap-1 group-hover:text-sky-600 transition-colors pointer-events-none bg-white/40 rounded-2xl backdrop-blur-[1px]">
                                  <Plus size={32} strokeWidth={3} className="bg-white rounded-full shadow-sm" />
                                  <span className="bg-white/90 px-3 py-1 rounded-full shadow-sm text-xs border border-slate-200">Tap to add apples</span>
                              </div>
                          )}

                          {/* Manual Controls overlaid inside box */}
                          {addedApples > 0 && (
                              <div className="absolute -bottom-4 right-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={handleRemoveApple} className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-400 shadow-md active:scale-95"><Minus size={20} strokeWidth={4}/></button>
                                  <button onClick={handleAddApple} disabled={addedApples === 10} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md active:scale-95 ${addedApples === 10 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-sky-500 text-white hover:bg-sky-400'}`}><Plus size={20} strokeWidth={4}/></button>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* RIGHT: Stacked Math and Words (Takes up half width on large screens) */}
                  <div className="flex-1 flex flex-col gap-4 lg:h-full">
                      {/* TOP: THE MATH */}
                      <div className="flex-1 flex flex-col justify-center items-center bg-white/80 p-4 md:p-6 rounded-[2rem] border-4 border-slate-100 shadow-md min-h-[135px] md:min-h-[150px]">
                          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-4 w-full text-center">Equation</h3>
                          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 w-full text-4xl sm:text-5xl md:text-6xl font-black">
                              <span className="text-amber-600">10</span>
                              <span className="text-slate-300">+</span>
                              <span className="text-sky-500 w-12 md:w-16 text-center">{addedApples}</span>
                              <span className="text-slate-300">=</span>
                              <span className="text-lime-600 w-16 md:w-24 text-center bg-lime-100 rounded-2xl py-2 px-1 shadow-inner border-2 border-lime-200">{currentTotal}</span>
                          </div>
                      </div>

                      {/* BOTTOM: THE WORDS */}
                      <div className="flex-1 flex flex-col justify-center items-center bg-indigo-50 p-6 rounded-[2rem] border-4 border-indigo-100 shadow-md min-h-[150px]">
                          <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-4 w-full text-center">Number Name</h3>
                          <div className="flex flex-col items-center gap-4 w-full">
                              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-indigo-700 tracking-tight text-center w-full truncate px-4">{currentWord}</span>
                              <button 
                                  onClick={() => speakText(`Ten and ${addedApples} makes ${currentWord}`)}
                                  className="w-14 h-14 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-400 hover:scale-105 active:scale-95 shadow-md transition-all"
                              >
                                  <Volume2 size={28} />
                              </button>
                          </div>
                      </div>
                  </div>

              </div>
          )}
      </div>

      {/* FOOTER: PROGRESS TRACKER (Anchored to bottom) */}
      <div className="absolute bottom-0 left-0 w-full bg-white p-3 md:p-4 border-t-[4px] border-slate-200 z-30 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-6xl mx-auto flex flex-col items-center gap-2">
              <div className="flex items-center justify-between w-full max-w-3xl">
                  <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Numbers Discovered</span>
                  {hasDiscoveredAll && !showAllView && (
                      <button onClick={() => setShowAllView(true)} className="flex items-center gap-1 text-[10px] md:text-xs font-black text-sky-600 bg-sky-100 hover:bg-sky-200 px-2 py-1 rounded-md transition-colors">
                          <List size={14} /> SHOW ALL
                      </button>
                  )}
              </div>
              <div className="flex justify-center gap-1.5 md:gap-3 flex-wrap w-full max-w-3xl">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const isDiscovered = discoveredNumbers.includes(num);
                      const isCurrent = addedApples === num && !showAllView;
                      
                      return (
                          <div 
                              key={num} 
                              onClick={() => {
                                  if (isDiscovered || isCurrent) jumpToNumber(num);
                              }}
                              className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center font-black text-sm md:text-xl transition-all duration-500 border-b-[3px]
                                  ${isCurrent ? 'bg-amber-400 border-amber-600 text-amber-950 scale-110 shadow-md cursor-default' : 
                                    isDiscovered ? 'bg-lime-400 border-lime-600 text-lime-950 hover:bg-lime-300 hover:-translate-y-1 cursor-pointer' : 
                                    'bg-slate-100 border-slate-300 text-slate-300 cursor-not-allowed'}`}
                          >
                              {10 + num}
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px) scale(0.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}} />
    </div>
  );
}