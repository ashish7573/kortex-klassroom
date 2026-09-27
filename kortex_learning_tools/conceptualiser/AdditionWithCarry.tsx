"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronRight, ChevronLeft, PackagePlus, ArrowRight, ArrowDownToLine, Calculator, CheckCircle2, MoveUpLeft } from 'lucide-react';

// --- Types & Data ---
type AppPhase = 'story' | 'interactive' | 'finish';
type AuditStep = 'start' | 'combined' | 'grouped' | 'carried' | 'totaled';

const STORY_SLIDES = [
  {
    image: '/assets/maths/FLN/AdditionWithCarry1.webp',
    text: "Rohan and Papa are packing a massive festival order! Rohan has 36 apples, and Papa has 47 apples."
  },
  {
    image: '/assets/maths/FLN/AdditionWithCarry2.webp',
    text: "When they combine their loose apples, Rohan panics. 'Papa, we have 13 loose apples! But a packing basket only holds 10. What do we do?'"
  },
  {
    image: '/assets/maths/FLN/AdditionWithCarry3.webp',
    text: "Papa laughs. 'We do what we always do! When we have 10 or more loose apples, we pack 1 BRAND NEW BOX for every 10 items and carry it over to the Tens side!'"
  }
];

const FRUIT_ROUNDS = [
    { id: 'apples', name: 'Apples', emoji: '🍎', rohanTens: 3, rohanOnes: 6, papaTens: 4, papaOnes: 7, color: 'text-red-500', bg: 'bg-red-100', border: 'border-red-400' },
    { id: 'oranges', name: 'Oranges', emoji: '🍊', rohanTens: 5, rohanOnes: 8, papaTens: 2, papaOnes: 5, color: 'text-orange-500', bg: 'bg-orange-100', border: 'border-orange-400' },
    { id: 'bananas', name: 'Bananas', emoji: '🍌', rohanTens: 4, rohanOnes: 9, papaTens: 3, papaOnes: 4, color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-400' }
];

export default function AdditionWithCarry({ lesson, onComplete }: any) {
  const [phase, setPhase] = useState<AppPhase>('story');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Interactive State
  const [roundIndex, setRoundIndex] = useState(0);
  const [auditStep, setAuditStep] = useState<AuditStep>('start');
  
  // State for Abstract Inputs
  const [inputs, setInputs] = useState({ rt: '', ro: '', pt: '', po: '' });

  const currentRound = FRUIT_ROUNDS[roundIndex];

  useEffect(() => { setMounted(true); }, []);

  // Reset inputs when moving to a new round
  useEffect(() => {
      setInputs({ rt: '', ro: '', pt: '', po: '' });
  }, [roundIndex]);

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

  const playSound = (type: 'pop' | 'kaching' | 'slide' | 'whoosh' | 'magic' | 'error') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'pop') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    } else if (type === 'kaching') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
    } else if (type === 'whoosh') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    } else if (type === 'magic') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
    } else if (type === 'error') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
    }
    
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + (type === 'kaching' || type === 'magic' ? 0.4 : 0.2));
  };

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            resolve(); return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN'; 
        utterance.rate = 0.9; 
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => { setIsSpeaking(false); resolve(); };
        utterance.onerror = () => { setIsSpeaking(false); resolve(); };
        window.speechSynthesis.speak(utterance);
    });
  };

  // --- Actions ---
  const handleNextSlide = () => {
    initAudio(); playSound('pop'); window.speechSynthesis.cancel();
    if (currentSlide < STORY_SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      setPhase('interactive');
      playSound('kaching');
    }
  };

  const handlePrevSlide = () => {
    initAudio(); playSound('pop'); window.speechSynthesis.cancel();
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  const handleAuditAction = async () => {
      initAudio();
      
      const totalOnesRaw = currentRound.rohanOnes + currentRound.papaOnes;
      const leftOverOnes = totalOnesRaw % 10;
      const carriedTen = Math.floor(totalOnesRaw / 10); 
      const totalTensFinal = currentRound.rohanTens + currentRound.papaTens + carriedTen;
      const finalSum = (totalTensFinal * 10) + leftOverOnes;

      if (auditStep === 'start') {
          // Validate Inputs before combining!
          const isCorrect = 
              Number(inputs.rt) === currentRound.rohanTens &&
              Number(inputs.ro) === currentRound.rohanOnes &&
              Number(inputs.pt) === currentRound.papaTens &&
              Number(inputs.po) === currentRound.papaOnes;

          if (!isCorrect) {
              playSound('error');
              await speakText("Count the boxes and fruits carefully, and enter the exact numbers first!");
              return;
          }

          setAuditStep('combined');
          playSound('whoosh');
          await speakText(`We combine everything. We have ${totalOnesRaw} loose items!`);
      } 
      else if (auditStep === 'combined') {
          setAuditStep('grouped');
          playSound('magic');
          await speakText(`10 loose items make a new box!`);
      }
      else if (auditStep === 'grouped') {
          setAuditStep('carried');
          playSound('whoosh');
          await speakText(`Carry the new box over to the tens side!`);
      }
      else if (auditStep === 'carried') {
          setAuditStep('totaled');
          playSound('kaching');
          await speakText(`Add the tens! ${carriedTen} plus ${currentRound.rohanTens} plus ${currentRound.papaTens} makes ${totalTensFinal}. The total is ${finalSum}!`);
      }
      else if (auditStep === 'totaled') {
          if (roundIndex < FRUIT_ROUNDS.length - 1) {
              setRoundIndex(prev => prev + 1);
              setAuditStep('start');
              playSound('pop');
          } else {
              setPhase('finish');
              playSound('kaching');
          }
      }
  };

  if (!mounted) return null;

  // ============================================================================
  // REUSABLE COMPONENTS
  // ============================================================================
  const BoxOf10 = ({ emoji, colorStyle }: { emoji: string, colorStyle: string }) => (
      <div className={`relative ${colorStyle} rounded border-2 border-black/20 p-1 shadow-sm w-[40px] md:w-[50px] lg:w-[60px] shrink-0 flex flex-col items-center animate-fade-in-up`}>
          <div className="absolute -top-2 bg-black/60 text-white text-[6px] md:text-[8px] font-black uppercase px-1 rounded z-10">10</div>
          <div className="grid grid-cols-5 gap-0.5 bg-white/50 p-0.5 rounded border border-black/10 w-full mt-1">
              {Array.from({length: 10}).map((_, i) => (
                  <div key={i} className="aspect-square bg-white/80 rounded-[2px] flex items-center justify-center shadow-inner">
                      <span className="text-[6px] md:text-[8px]">{emoji}</span>
                  </div>
              ))}
          </div>
      </div>
  );

  const LooseItem = ({ emoji }: { emoji: string }) => (
      <div className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-white rounded border border-slate-200 flex items-center justify-center shadow-sm shrink-0 animate-fade-in-up">
          <span className="text-[8px] md:text-[10px] lg:text-sm">{emoji}</span>
      </div>
  );

  // Grouped 2x5 Grid for the "Grouped" Step
  const GroupedTenApples = ({ emoji }: { emoji: string }) => (
      <div className="bg-emerald-100/80 border-2 border-dashed border-emerald-500 rounded-lg p-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse shrink-0">
          <div className="grid grid-cols-5 gap-1">
              {Array.from({length: 10}).map((_, i) => <LooseItem key={i} emoji={emoji} />)}
          </div>
      </div>
  );

  // Input Box Renderer
  const renderInput = (field: 'rt'|'ro'|'pt'|'po', expected: number) => {
      if (auditStep !== 'start') {
          return <span className="font-black text-3xl md:text-5xl">{expected}</span>;
      }
      const val = inputs[field];
      const isGlowing = val === '';
      return (
          <input 
              type="text" 
              inputMode="numeric"
              value={val}
              onChange={e => {
                  playSound('pop');
                  const v = e.target.value.replace(/[^0-9]/g, '').slice(-1);
                  setInputs(prev => ({ ...prev, [field]: v }));
              }}
              className={`w-12 h-14 md:w-16 md:h-20 lg:w-20 lg:h-24 text-center text-3xl md:text-5xl rounded-2xl outline-none transition-all ${
                  isGlowing 
                  ? 'bg-slate-700 border-2 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)] animate-pulse text-transparent placeholder:text-transparent' 
                  : 'bg-slate-800 border-2 border-slate-500 text-white focus:border-sky-400 focus:shadow-[0_0_15px_rgba(56,189,248,0.3)]'
              }`}
          />
      );
  };

  // ============================================================================
  // RENDER: STORY PHASE
  // ============================================================================
  if (phase === 'story') {
      const slide = STORY_SLIDES[currentSlide];
      return (
        <div className="w-full h-full flex flex-col bg-slate-50 font-sans md:rounded-3xl overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col p-3 md:p-6">
             <div className="max-w-4xl w-full mx-auto flex flex-col h-full gap-3 md:gap-4">
                <div className="flex-1 min-h-0 w-full bg-slate-200 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-4 border-white shadow-md relative">
                   <img src={slide.image} alt="Story scene" className="absolute inset-0 w-full h-full object-contain bg-sky-50 z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                   <button 
                     onClick={() => { initAudio(); speakText(slide.text); }}
                     className={`absolute top-3 right-3 md:top-4 md:right-4 z-20 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border-b-4 transition-all shadow-lg ${isSpeaking ? 'bg-amber-100 text-amber-500 border-amber-200 animate-pulse' : 'bg-sky-500 text-white border-sky-700 hover:bg-sky-400'}`}
                   >
                     <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                   </button>
                </div>
                <div className="shrink-0 bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border-4 border-slate-100 shadow-sm flex items-center justify-center text-center">
                   <p className="text-sm md:text-lg lg:text-xl font-bold text-slate-700 leading-snug md:leading-relaxed max-w-2xl">{slide.text}</p>
                </div>
             </div>
          </div>
          <div className="shrink-0 p-2 md:p-4 flex justify-between items-center max-w-4xl mx-auto w-full">
             <button onClick={handlePrevSlide} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${currentSlide === 0 ? 'invisible' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
               <ChevronLeft size={16} /> Back
             </button>
             <button onClick={handleNextSlide} className="px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 bg-sky-500 hover:bg-sky-400 text-white border-b-4 border-sky-700 active:border-b-0">
               {currentSlide === STORY_SLIDES.length - 1 ? 'Start Auditing' : 'Next'} <ChevronRight size={16} />
             </button>
          </div>
        </div>
      );
  }

  // ============================================================================
  // RENDER: FINISH PHASE
  // ============================================================================
  if (phase === 'finish') {
      return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 font-sans md:rounded-3xl p-6 text-center animate-fade-in-up">
              <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl bg-emerald-100 border-4 border-emerald-300">
                  <CheckCircle2 size={64} className="text-emerald-500"/>
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-2">Addition Master!</h2>
              <p className="text-slate-500 font-bold text-lg mb-8">You successfully learned how to regroup and carry over!</p>
              <button 
                  onClick={onComplete}
                  className="bg-emerald-500 text-slate-950 px-8 py-4 rounded-2xl font-black tracking-wide shadow-[0_6px_0_rgb(16,185,129)] active:translate-y-[6px] active:shadow-none transition-all flex items-center gap-2"
              >
                  Complete Lesson <ChevronRight />
              </button>
          </div>
      );
  }

  // ============================================================================
  // RENDER: INTERACTIVE PHASE (Unified 3-Column Board)
  // ============================================================================
  const isCombined = auditStep !== 'start';
  const isGrouped = auditStep === 'grouped' || auditStep === 'carried' || auditStep === 'totaled';
  const isCarried = auditStep === 'carried' || auditStep === 'totaled';
  const isTotaled = auditStep === 'totaled';
  
  const totalOnesRaw = currentRound.rohanOnes + currentRound.papaOnes;
  const leftOverOnes = totalOnesRaw % 10;
  const carriedTen = Math.floor(totalOnesRaw / 10); 
  const totalTensFinal = currentRound.rohanTens + currentRound.papaTens + carriedTen;

  const visualOnesHighlight = auditStep === 'combined' 
      ? 'bg-amber-50 ring-2 ring-inset ring-amber-400 shadow-[inset_0_0_20px_rgba(251,191,36,0.2)] animate-pulse' 
      : 'bg-slate-50';

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 font-sans md:rounded-3xl overflow-hidden relative">
      
      {/* HEADER */}
      <div className="w-full shrink-0 p-2 md:p-4 z-20 bg-slate-800 border-b-2 border-slate-700 shadow-sm flex items-center justify-between text-white">
          <div className="flex items-center gap-2 md:gap-3">
              <div className={`w-8 h-8 md:w-10 md:h-10 ${currentRound.bg} rounded-full flex items-center justify-center text-lg md:text-xl`}>{currentRound.emoji}</div>
              <h2 className="text-sm md:text-xl font-black tracking-widest uppercase">Addition with Carry</h2>
          </div>
          <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-slate-700 px-2 md:px-3 py-1 rounded-full">{roundIndex + 1} / {FRUIT_ROUNDS.length}</span>
      </div>

      {/* UNIFIED 3-COLUMN WORKSPACE */}
      <div className="flex-1 min-h-0 flex flex-row p-1 md:p-4 gap-1 md:gap-4 overflow-hidden w-full max-w-7xl mx-auto">
          
          {/* COLUMN 1: VISUAL TENS (BOXES) */}
          <div className="flex-[1.2] flex flex-col bg-white rounded-xl md:rounded-[2rem] border-2 md:border-4 border-slate-200 overflow-hidden shadow-sm relative">
              <div className="text-center py-1 md:py-2 bg-slate-100 border-b-2 border-slate-200 font-black text-slate-400 uppercase tracking-widest text-[8px] md:text-[10px]">Boxes (Tens)</div>
              <div className="flex-1 flex flex-col p-1 md:p-4 relative">
                  {!isCombined ? (
                      // SPLIT VIEW
                      <>
                          <div className="flex-1 flex flex-col items-center justify-center relative w-full">
                              <span className="absolute top-0 md:top-2 text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">Rohan's</span>
                              <div className="flex flex-wrap gap-1 md:gap-2 justify-center content-center w-full h-full pt-4">
                                  {Array.from({length: currentRound.rohanTens}).map((_, i) => <BoxOf10 key={`r-t-${i}`} emoji={currentRound.emoji} colorStyle={currentRound.bg} />)}
                              </div>
                          </div>
                          <div className="w-[80%] mx-auto h-0.5 bg-slate-200 border-dashed shrink-0 my-1"></div>
                          <div className="flex-1 flex flex-col items-center justify-center relative w-full">
                              <span className="absolute top-0 md:top-2 text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">Papa's</span>
                              <div className="flex flex-wrap gap-1 md:gap-2 justify-center content-center w-full h-full pt-4">
                                  {Array.from({length: currentRound.papaTens}).map((_, i) => <BoxOf10 key={`p-t-${i}`} emoji={currentRound.emoji} colorStyle={currentRound.bg} />)}
                              </div>
                          </div>
                      </>
                  ) : (
                      // COMBINED VIEW
                      <div className="flex-1 flex flex-col items-center justify-center w-full h-full">
                          <div className="flex flex-wrap gap-1 md:gap-2 justify-center content-center w-full h-full max-h-[80%]">
                              {/* All original tens pooled together */}
                              {Array.from({length: currentRound.rohanTens + currentRound.papaTens}).map((_, i) => <BoxOf10 key={`tot-t-${i}`} emoji={currentRound.emoji} colorStyle={currentRound.bg} />)}
                              {/* Carried Ten arriving */}
                              {isCarried && (
                                  <div className="animate-fade-in-up">
                                      <BoxOf10 emoji={currentRound.emoji} colorStyle="bg-emerald-200 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
                  {/* Visual Total Label */}
                  {isTotaled && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-sky-500 text-white font-black text-sm md:text-xl px-3 py-1 rounded-lg animate-bounce z-10 shadow-md">{totalTensFinal * 10}</div>}
              </div>
          </div>

          {/* COLUMN 2: ABSTRACT MATH (NUMBERS) */}
          <div className="w-[110px] md:w-[220px] lg:w-[280px] flex flex-col bg-slate-800 rounded-xl md:rounded-[2rem] border-2 md:border-4 border-slate-700 overflow-hidden shadow-xl shrink-0">
              <div className="text-center py-1 md:py-2 bg-slate-900 border-b-2 border-slate-700 font-black text-slate-500 uppercase tracking-widest text-[8px] md:text-[10px]">Numbers</div>
              <div className="flex-1 flex flex-col p-1 md:p-4 text-white">
                  
                  {/* Header Row */}
                  <div className="h-6 md:h-8 flex w-full justify-around items-center text-[10px] md:text-sm text-slate-500 font-black uppercase tracking-widest">
                      <div className="flex-1 text-center">Tens</div>
                      <div className="flex-1 text-center">Ones</div>
                  </div>

                  {/* Carry Row */}
                  <div className="h-6 md:h-10 flex w-full border-b-2 border-dashed border-slate-600 mb-1 md:mb-2">
                      <div className="flex-1 flex items-center justify-center text-lg md:text-3xl text-emerald-400 font-black">
                          {isCarried ? <span className="animate-fade-in-up">1</span> : ''}
                      </div>
                      <div className="flex-1"></div>
                  </div>

                  {/* Addends Section (Matches vertical flex structure of left/right visuals perfectly) */}
                  <div className="flex-1 flex flex-col justify-around py-1">
                      
                      {/* Rohan Row */}
                      <div className="flex-1 flex w-full items-center justify-around">
                          <div className="flex-1 flex items-center justify-center text-3xl md:text-5xl font-black text-slate-300">
                              {renderInput('rt', currentRound.rohanTens)}
                          </div>
                          <div className="flex-1 flex items-center justify-center text-3xl md:text-5xl font-black text-slate-300">
                              {renderInput('ro', currentRound.rohanOnes)}
                          </div>
                      </div>
                      
                      {/* Papa Row */}
                      <div className="flex-1 flex w-full items-center justify-around relative">
                          <span className="absolute -left-1 md:-left-2 top-1/2 -translate-y-1/2 text-slate-500 text-lg md:text-4xl font-black">+</span>
                          <div className="flex-1 flex items-center justify-center text-3xl md:text-5xl font-black text-slate-300">
                              {renderInput('pt', currentRound.papaTens)}
                          </div>
                          <div className="flex-1 flex items-center justify-center text-3xl md:text-5xl font-black text-slate-300">
                              {renderInput('po', currentRound.papaOnes)}
                          </div>
                      </div>

                  </div>

                  {/* Line */}
                  <div className="w-full border-t-2 md:border-t-4 border-slate-600 my-1 md:my-2"></div>

                  {/* Total Row */}
                  <div className="h-12 md:h-20 flex w-full items-center justify-around">
                      <div className="flex-1 flex items-center justify-center text-3xl md:text-5xl font-black text-sky-400">
                          {isTotaled ? <span className="animate-fade-in-up">{totalTensFinal}</span> : ''}
                      </div>
                      <div className="flex-1 flex items-center justify-center text-xl md:text-4xl font-black text-slate-300">
                          {!isCombined ? null : 
                           !isGrouped ? (
                               <div className="whitespace-nowrap animate-fade-in-up text-lg md:text-3xl"><span className="text-white">10</span> + <span className="text-sky-400">{leftOverOnes}</span></div>
                           ) : !isCarried ? (
                               <div className="whitespace-nowrap text-lg md:text-3xl"><span className="text-emerald-400 bg-emerald-400/20 px-1 rounded animate-pulse">1</span> + <span className="text-sky-400">{leftOverOnes}</span></div>
                           ) : (
                               <span className="text-sky-400 text-3xl md:text-5xl">{leftOverOnes}</span>
                           )}
                      </div>
                  </div>

              </div>
          </div>

          {/* COLUMN 3: VISUAL ONES (LOOSE FRUITS) */}
          <div className={`flex-[1.2] flex flex-col rounded-xl md:rounded-[2rem] border-2 md:border-4 border-slate-200 overflow-hidden shadow-sm relative transition-colors duration-500 ${visualOnesHighlight}`}>
              <div className="text-center py-1 md:py-2 bg-slate-100 border-b-2 border-slate-200 font-black text-slate-400 uppercase tracking-widest text-[8px] md:text-[10px] z-10">Loose (Ones)</div>
              <div className="flex-1 flex flex-col p-1 md:p-4 relative">
                  {!isCombined ? (
                      // SPLIT VIEW
                      <>
                          <div className="flex-1 flex flex-col items-center justify-center relative w-full">
                              <span className="absolute top-0 md:top-2 text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">Rohan's</span>
                              <div className="flex flex-wrap gap-1 md:gap-2 justify-center content-center w-full max-w-[120px] md:max-w-[180px] h-full pt-4">
                                  {Array.from({length: currentRound.rohanOnes}).map((_, i) => <LooseItem key={`r-o-${i}`} emoji={currentRound.emoji} />)}
                              </div>
                          </div>
                          <div className="w-[80%] mx-auto h-0.5 bg-slate-200 border-dashed shrink-0 my-1"></div>
                          <div className="flex-1 flex flex-col items-center justify-center relative w-full">
                              <span className="absolute top-0 md:top-2 text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">Papa's</span>
                              <div className="flex flex-wrap gap-1 md:gap-2 justify-center content-center w-full max-w-[120px] md:max-w-[180px] h-full pt-4">
                                  {Array.from({length: currentRound.papaOnes}).map((_, i) => <div key={`p-o-${i}`}><LooseItem emoji={currentRound.emoji} /></div>)}
                              </div>
                          </div>
                      </>
                  ) : (
                      // COMBINED/GROUPED VIEW
                      <div className="flex-1 flex flex-col items-center justify-center w-full h-full relative">
                          
                          {/* Step 1: Just combined as a single pool */}
                          {!isGrouped && (
                              <div className="flex flex-wrap gap-1 md:gap-2 justify-center content-center w-full max-w-[140px] md:max-w-[200px] h-full">
                                  {Array.from({length: totalOnesRaw}).map((_, i) => <LooseItem key={`tot-o-${i}`} emoji={currentRound.emoji} />)}
                              </div>
                          )}

                          {/* Step 2: Grouped into the Magic 2x5 Grid */}
                          {isGrouped && !isCarried && (
                              <div className="flex flex-col items-center gap-2 md:gap-4 animate-fade-in">
                                  <GroupedTenApples emoji={currentRound.emoji} />
                                  <div className="flex flex-wrap gap-1 md:gap-2 justify-center">
                                      {Array.from({length: leftOverOnes}).map((_, i) => <LooseItem key={`lo-o-${i}`} emoji={currentRound.emoji} />)}
                                  </div>
                              </div>
                          )}

                          {/* Step 3/4: The 10 grouped box is carried away, leaving only leftovers */}
                          {isCarried && (
                              <div className="flex flex-col items-center justify-center h-full">
                                  <div className="flex flex-wrap gap-1 md:gap-2 justify-center max-w-[120px] md:max-w-[180px]">
                                      {Array.from({length: leftOverOnes}).map((_, i) => <LooseItem key={`lo-o-${i}`} emoji={currentRound.emoji} />)}
                                  </div>
                              </div>
                          )}
                          
                      </div>
                  )}
                  {/* Visual Total Label */}
                  {isTotaled && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-sky-500 text-white font-black text-sm md:text-xl px-3 py-1 rounded-lg animate-bounce z-10 shadow-md">{leftOverOnes}</div>}
              </div>
          </div>

      </div>

      {/* CONTROLS FOOTER */}
      <div className="shrink-0 p-2 md:p-4 bg-slate-800 border-t-2 border-slate-700 shadow-sm z-30 relative">
          <button 
              onClick={handleAuditAction}
              className={`w-full py-2 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-xl tracking-wide flex items-center justify-center gap-2 md:gap-3 transition-all border-b-[4px] md:border-b-[6px] active:translate-y-[4px] md:active:translate-y-[6px] active:border-b-[0px] shadow-sm
                  ${auditStep === 'start' ? 'bg-sky-500 border-sky-700 text-white hover:bg-sky-400' :
                    auditStep === 'combined' ? 'bg-amber-400 border-amber-600 text-amber-950 hover:bg-amber-300' :
                    auditStep === 'grouped' ? 'bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-400' :
                    auditStep === 'carried' ? 'bg-indigo-500 border-indigo-700 text-white hover:bg-indigo-400' :
                    'bg-lime-400 border-lime-600 text-lime-950 hover:bg-lime-300'
                  }`}
          >
              {auditStep === 'start' ? <><ArrowDownToLine className="w-4 h-4 md:w-5 md:h-5" /> 1. Combine Everything</> :
               auditStep === 'combined' ? <><PackagePlus className="w-4 h-4 md:w-5 md:h-5" /> 2. Group 10 {currentRound.name}</> :
               auditStep === 'grouped' ? <><MoveUpLeft className="w-4 h-4 md:w-5 md:h-5" /> 3. Carry Box to Tens</> :
               auditStep === 'carried' ? <><Calculator className="w-4 h-4 md:w-5 md:h-5" /> 4. Find Final Total</> :
               <><ArrowRight className="w-4 h-4 md:w-5 md:h-5" /> Next Round</>
              }
          </button>
      </div>

    </div>
  );
}