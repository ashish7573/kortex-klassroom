"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronRight, ChevronLeft, Bus, ArrowRight } from 'lucide-react';

// --- Types & Data ---
type AppPhase = 'story' | 'interactive';
type StageStatus = 'idle' | 'success';

const STORY_SLIDES = [
  {
    image: '/assets/maths/FLN/SubtractionStory1.webp',
    text: "School is over! Rohan and Varun board the big yellow school bus to go home. They count all their friends and see there are exactly 10 students on the bus."
  },
  {
    image: '/assets/maths/FLN/SubtractionStory2.webp',
    text: "The bus reaches the first stop. 'Bye!' say 3 students as they grab their bags and get off. Rohan wonders, 'If 3 left, how many are still on the bus?'"
  },
  {
    image: '/assets/maths/FLN/SubtractionStory3.webp',
    text: "At the next stop, 2 more students wave goodbye and step out. 'Seven minus two,' says Varun. They count again: 5 students are left!"
  },
  {
    image: '/assets/maths/FLN/SubtractionStory4.webp',
    text: "The bus stops near the library. 3 more friends get off. Now the bus feels very empty! Rohan and Varun count and see only 2 students are left—just the two of them!"
  },
  {
    image: '/assets/maths/FLN/SubtractionStory5.webp',
    text: "Finally, the bus reaches their neighborhood. Rohan and Varun grab their bags and step off. Rohan looks back at the empty bus and smiles, 'Now there are zero students left!'"
  }
];

const INTERACTIVE_STAGES = [
  { start: 10, drop: 3, left: 7 },
  { start: 7, drop: 2, left: 5 },
  { start: 5, drop: 3, left: 2 },
  { start: 2, drop: 2, left: 0 }
];

const NUM_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

export default function SubtractionStory({ lesson, onComplete }: any) {
  const [phase, setPhase] = useState<AppPhase>('story');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Interactive State
  const [currentStage, setCurrentStage] = useState(0);
  const [boxes, setBoxes] = useState<(number | null)[]>([null, null, null]);
  const [stageStatus, setStageStatus] = useState<StageStatus>('idle');
  const [errorBox, setErrorBox] = useState<number | null>(null);
  
  // Mobile Touch Support
  const [selectedNum, setSelectedNum] = useState<number | null>(null);

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

  const playSound = (type: 'pop' | 'kaching' | 'slide' | 'error' | 'whoosh' | 'horn' | 'click') => {
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
    } else if (type === 'error') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'whoosh') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
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
  const targetObj = INTERACTIVE_STAGES[currentStage];
  const targets = [targetObj.start, targetObj.drop, targetObj.left];

  const handlePlaceNumber = (boxIndex: number, value: number) => {
    if (stageStatus === 'success' || boxes[boxIndex] !== null) return;
    
    // Validate
    if (value === targets[boxIndex]) {
      playSound('pop');
      const newBoxes = [...boxes];
      newBoxes[boxIndex] = value;
      setBoxes(newBoxes);
      setSelectedNum(null); // Clear mobile selection

      // Check for stage win
      if (newBoxes[0] !== null && newBoxes[1] !== null && newBoxes[2] !== null) {
        setStageStatus('success');
        setTimeout(() => {
          playSound('kaching');
          speakText(`${NUM_WORDS[targetObj.start]} minus ${NUM_WORDS[targetObj.drop]} equals ${NUM_WORDS[targetObj.left]}`);
        }, 500);
      }
    } else {
      playSound('error');
      setErrorBox(boxIndex);
      setSelectedNum(null);
      setTimeout(() => setErrorBox(null), 400);
    }
  };

  // Drag and Drop Wrappers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, value: number) => {
    initAudio();
    playSound('click');
    e.dataTransfer.setData('text/plain', value.toString());
    setSelectedNum(value);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, boxIndex: number) => {
    e.preventDefault();
    const value = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(value)) handlePlaceNumber(boxIndex, value);
  };

  // Mobile Tap Wrapper
  const handleBoxTap = (boxIndex: number) => {
    if (selectedNum !== null) {
      handlePlaceNumber(boxIndex, selectedNum);
    }
  };

  const handleNextStage = () => {
    initAudio();
    playSound('whoosh');
    if (currentStage < INTERACTIVE_STAGES.length - 1) {
      setCurrentStage(prev => prev + 1);
      setBoxes([null, null, null]);
      setStageStatus('idle');
      setSelectedNum(null);
    } else {
      if (onComplete) onComplete();
    }
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
  
  // Array to render kids in the bus.
  const activeKids = Array.from({ length: targetObj.start });

  return (
    <div className="w-full h-full flex flex-col bg-sky-100 font-sans min-h-[600px] relative overflow-hidden">
      
      {/* Background Scenery Elements */}
      <div className="absolute bottom-0 w-full h-[35%] bg-emerald-400 rounded-t-[50%] opacity-20 pointer-events-none"></div>
      <div className="absolute top-10 left-10 w-32 h-10 bg-white rounded-full blur-md opacity-60 pointer-events-none"></div>
      <div className="absolute top-16 right-20 w-48 h-12 bg-white rounded-full blur-md opacity-60 pointer-events-none"></div>

      {/* 1. VISUAL TRACKER (THE BUS) */}
      <div className="w-full pt-8 pb-4 px-4 shrink-0 flex justify-center z-10">
        <div className="w-full max-w-2xl bg-amber-400 rounded-[2rem] rounded-tr-[3rem] border-b-8 border-amber-600 relative h-32 md:h-40 flex items-center justify-center px-4 shadow-xl">
            
            {/* Bus Details */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-16 bg-sky-200/50 rounded-xl border-4 border-slate-800"></div>
            <div className="absolute -bottom-6 md:-bottom-8 left-12 w-12 h-12 md:w-16 md:h-16 bg-slate-900 rounded-full border-4 border-slate-300 shadow-lg flex items-center justify-center"><div className="w-4 h-4 bg-slate-400 rounded-full"></div></div>
            <div className="absolute -bottom-6 md:-bottom-8 right-16 w-12 h-12 md:w-16 md:h-16 bg-slate-900 rounded-full border-4 border-slate-300 shadow-lg flex items-center justify-center"><div className="w-4 h-4 bg-slate-400 rounded-full"></div></div>
            <div className="absolute left-6 top-4 bg-slate-800 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border-2 border-slate-700">SCHOOL BUS</div>

            {/* Kids Container (Windows) */}
            <div className="w-[70%] mr-auto ml-4 h-16 md:h-20 bg-sky-200/40 rounded-xl border-4 border-slate-800 flex justify-around items-end px-2 pb-1 relative overflow-visible">
                {activeKids.map((_, i) => {
                    // Logic to determine if this kid is one of the ones getting dropped off
                    const isDropped = i >= targetObj.left;
                    const animateOutClass = (stageStatus === 'success' && isDropped) 
                        ? "translate-y-[150px] opacity-0 rotate-12 transition-all duration-[1500ms] ease-in" 
                        : "translate-y-0 opacity-100 transition-all duration-300";

                    return (
                        <div key={i} className={`w-8 h-8 md:w-10 md:h-10 bg-rose-400 rounded-full border-2 border-slate-800 flex items-center justify-center text-lg md:text-xl shadow-sm z-20 ${animateOutClass}`}>
                            👦🏽
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* 2. THE EQUATION BUILDER */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 z-10 pb-4">
        
        <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border-4 border-white shadow-xl flex items-center gap-2 md:gap-6">
            
            {/* Box 1: Total */}
            <div className="flex flex-col items-center gap-3">
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 0)}
                  onClick={() => handleBoxTap(0)}
                  className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-[2rem] border-4 flex items-center justify-center text-4xl md:text-6xl font-black transition-all cursor-pointer bg-white shadow-inner
                    ${errorBox === 0 ? 'border-rose-500 bg-rose-50 text-rose-500 animate-shake' : 
                      boxes[0] !== null ? 'border-sky-500 text-sky-500' : 'border-dashed border-slate-300 text-slate-400 hover:border-sky-400 hover:bg-sky-50'}`}
                >
                    {boxes[0] !== null ? boxes[0] : '?'}
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Total in<br/>bus</span>
            </div>

            <span className="text-4xl md:text-6xl font-black text-slate-300 pb-8">-</span>

            {/* Box 2: Drop */}
            <div className="flex flex-col items-center gap-3">
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 1)}
                  onClick={() => handleBoxTap(1)}
                  className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-[2rem] border-4 flex items-center justify-center text-4xl md:text-6xl font-black transition-all cursor-pointer bg-white shadow-inner
                    ${errorBox === 1 ? 'border-rose-500 bg-rose-50 text-rose-500 animate-shake' : 
                      boxes[1] !== null ? 'border-purple-500 text-purple-500' : 'border-dashed border-slate-300 text-slate-400 hover:border-purple-400 hover:bg-purple-50'}`}
                >
                    {boxes[1] !== null ? boxes[1] : '?'}
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Got off<br/>bus</span>
            </div>

            <span className="text-4xl md:text-6xl font-black text-slate-300 pb-8">=</span>

            {/* Box 3: Left */}
            <div className="flex flex-col items-center gap-3">
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 2)}
                  onClick={() => handleBoxTap(2)}
                  className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-[2rem] border-4 flex items-center justify-center text-4xl md:text-6xl font-black transition-all cursor-pointer bg-white shadow-inner
                    ${errorBox === 2 ? 'border-rose-500 bg-rose-50 text-rose-500 animate-shake' : 
                      boxes[2] !== null ? 'border-emerald-500 text-emerald-500' : 'border-dashed border-slate-300 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50'}`}
                >
                    {boxes[2] !== null ? boxes[2] : '?'}
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Left<br/>inside</span>
            </div>

        </div>

        {/* Success / Next Button overlaying the gap */}
        <div className={`mt-6 h-12 flex justify-center items-center transition-all duration-500 ${stageStatus === 'success' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <button 
                onClick={handleNextStage}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-full font-black text-lg shadow-lg flex items-center gap-2 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1"
            >
                {currentStage === INTERACTIVE_STAGES.length - 1 ? 'Finish Journey' : 'Next Stop'} <ArrowRight size={20} />
            </button>
        </div>

      </div>

      {/* 3. THE NUMBER BANK (BOTTOM) */}
      {/* Added extra pb (padding-bottom) to safely clear the Lesson Player bottom bar on all devices */}
      <div className="shrink-0 w-full bg-white p-4 md:p-6 pb-20 md:pb-24 border-t-[6px] border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-20 flex justify-center">
         {/* Increased max-w to 5xl so it fits all 11 boxes on laptops without wrapping */}
         <div className="w-full max-w-5xl">
             {/* Removed flex-wrap, added overflow-x-auto to make it a scrollable row if it gets squeezed */}
             <div className="flex justify-start md:justify-center items-center gap-2 md:gap-3 overflow-x-auto hide-scrollbar pb-4 pt-2 px-2 -mx-2">
                 {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                     const isSelected = selectedNum === num;
                     return (
                         <div 
                           key={num}
                           draggable={stageStatus !== 'success'}
                           onDragStart={(e) => handleDragStart(e, num)}
                           onClick={() => {
                               if (stageStatus !== 'success') {
                                   initAudio();
                                   playSound('click');
                                   setSelectedNum(num);
                               }
                           }}
                           /* Added shrink-0 so the boxes hold their exact shape */
                           className={`shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl border-b-[4px] md:border-b-[6px] flex items-center justify-center text-xl md:text-3xl font-black cursor-grab active:cursor-grabbing transition-all select-none
                             ${stageStatus === 'success' ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50' : 
                               isSelected ? 'bg-amber-400 text-amber-950 border-amber-600 -translate-y-2 shadow-lg' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 hover:-translate-y-1 hover:shadow-md'}`}
                         >
                             {num}
                         </div>
                     );
                 })}
             </div>
             <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 md:mt-4">Swipe to see all • Drag or Tap a number to place it</p>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px) rotate(-2deg); }
            75% { transform: translateX(5px) rotate(2deg); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}} />
    </div>
  );
}