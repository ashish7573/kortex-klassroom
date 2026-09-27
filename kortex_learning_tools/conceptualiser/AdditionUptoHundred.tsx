"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronRight, ChevronLeft, PackagePlus, ArrowRight, ArrowDownToLine, Calculator, CheckCircle2 } from 'lucide-react';

// --- Types & Data ---
type AppPhase = 'story' | 'interactive' | 'finish';
type AuditStep = 'start' | 'rohan-moved' | 'papa-moved' | 'grouped' | 'counted';

const STORY_SLIDES = [
  {
    image: '/assets/maths/FLN/AdditionUptoHundred1.webp',
    text: "It is the end of the day at Krishna Fruits! Rohan and Papa packed so many orders, they are very tired but very happy."
  },
  {
    image: '/assets/maths/FLN/AdditionUptoHundred2.webp',
    text: "They both have some leftover fruits in their carts. Papa says, 'Let us see how many we have together. We must add your cart and my cart!'"
  },
  {
    image: '/assets/maths/FLN/AdditionUptoHundred3.webp',
    text: "Rohan asks, 'How do we add such big numbers?' Papa smiles. 'The same way we pack! We put the Boxes of 10 together, and the loose fruits together!'"
  }
];

const FRUIT_ROUNDS = [
    { id: 'apples', name: 'Apples', emoji: '🍎', rohanTens: 3, rohanOnes: 4, papaTens: 2, papaOnes: 3, color: 'text-red-500', bg: 'bg-red-100', border: 'border-red-400' },
    { id: 'oranges', name: 'Oranges', emoji: '🍊', rohanTens: 4, rohanOnes: 1, papaTens: 2, papaOnes: 2, color: 'text-orange-500', bg: 'bg-orange-100', border: 'border-orange-400' },
    { id: 'bananas', name: 'Bananas', emoji: '🍌', rohanTens: 2, rohanOnes: 4, papaTens: 4, papaOnes: 5, color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-400' },
    { id: 'pineapples', name: 'Pineapples', emoji: '🍍', rohanTens: 1, rohanOnes: 4, papaTens: 3, papaOnes: 3, color: 'text-red-500', bg: 'bg-red-100', border: 'border-red-400' },
    { id: 'grapes', name: 'Grapes', emoji: '🍇', rohanTens: 3, rohanOnes: 5, papaTens: 2, papaOnes: 3, color: 'text-orange-500', bg: 'bg-orange-100', border: 'border-orange-400' },
    { id: 'mangoes', name: 'Mangoes', emoji: '🥭', rohanTens: 1, rohanOnes: 4, papaTens: 1, papaOnes: 5, color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-400' }
];

export default function AdditionUptoHundred({ lesson, onComplete }: any) {
  const [phase, setPhase] = useState<AppPhase>('story');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Interactive State
  const [roundIndex, setRoundIndex] = useState(0);
  const [auditStep, setAuditStep] = useState<AuditStep>('start');

  const currentRound = FRUIT_ROUNDS[roundIndex];

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
    } else if (type === 'whoosh') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    }
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

  // --- Story Actions ---
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

  // --- Interactive Actions ---
  const handleAuditAction = async () => {
      initAudio();
      
      if (auditStep === 'start') {
          playSound('whoosh');
          setAuditStep('rohan-moved');
      } 
      else if (auditStep === 'rohan-moved') {
          playSound('whoosh');
          setAuditStep('papa-moved');
      }
      else if (auditStep === 'papa-moved') {
          playSound('kaching');
          setAuditStep('grouped');
      }
      else if (auditStep === 'grouped') {
          setAuditStep('counted');
          playSound('pop');
          
          const totalTens = currentRound.rohanTens + currentRound.papaTens;
          const totalOnes = currentRound.rohanOnes + currentRound.papaOnes;
          const total = (totalTens * 10) + totalOnes;
          
          await speakText(`${totalTens} boxes of ten makes ${totalTens * 10}.`);
          await speakText(`And ${totalOnes} loose ${currentRound.name}.`);
          await speakText(`The total is ${total}!`);
      }
      else if (auditStep === 'counted') {
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
      <div className={`relative ${colorStyle} rounded-lg border-2 border-black/20 p-1 shadow-sm w-[40px] md:w-[60px] lg:w-[80px] shrink-0 animate-fade-in-up flex flex-col items-center`}>
          <div className="absolute -top-2 bg-black/60 text-white text-[6px] md:text-[8px] font-black uppercase tracking-widest px-1 rounded z-10">10</div>
          <div className="grid grid-cols-5 gap-0.5 bg-white/50 p-0.5 md:p-1 rounded border border-black/10 w-full mt-1">
              {Array.from({length: 10}).map((_, i) => (
                  <div key={i} className="aspect-square bg-white/80 rounded-[2px] flex items-center justify-center shadow-inner">
                      <span className="text-[6px] md:text-[10px] drop-shadow-sm">{emoji}</span>
                  </div>
              ))}
          </div>
      </div>
  );

  const LooseItem = ({ emoji }: { emoji: string }) => (
      <div className="w-4 h-4 md:w-6 md:h-6 bg-white rounded-md border border-slate-200 flex items-center justify-center shadow-sm animate-fade-in-up shrink-0">
          <span className="text-[10px] md:text-sm drop-shadow-sm">{emoji}</span>
      </div>
  );


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
                     className={`absolute top-3 right-3 md:top-4 md:right-4 z-20 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border-b-4 transition-all active:translate-y-1 shadow-lg ${isSpeaking ? 'bg-amber-100 text-amber-500 border-amber-200 animate-pulse' : 'bg-sky-500 text-white border-sky-700 hover:bg-sky-400'}`}
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
             <div className="flex gap-2">
               {STORY_SLIDES.map((_, i) => <div key={i} className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${i === currentSlide ? 'bg-sky-500 scale-125' : 'bg-slate-300'} transition-all`} />)}
             </div>
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
              <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl bg-lime-100 border-4 border-lime-300">
                  <CheckCircle2 size={64} className="text-lime-500"/>
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-2">Audit Complete!</h2>
              <p className="text-slate-500 font-bold text-lg mb-8">You successfully combined all the stock using place value!</p>
              <button 
                  onClick={onComplete}
                  className="bg-lime-500 text-lime-950 px-8 py-4 rounded-2xl font-black tracking-wide shadow-[0_6px_0_rgb(101,163,13)] active:translate-y-[6px] active:shadow-none transition-all flex items-center gap-2"
              >
                  Complete Lesson <ChevronRight />
              </button>
          </div>
      );
  }

  // ============================================================================
  // RENDER: INTERACTIVE PHASE
  // ============================================================================
  const isRohanMoved = auditStep !== 'start';
  const isPapaMoved = auditStep === 'papa-moved' || auditStep === 'grouped' || auditStep === 'counted';
  const isGrouped = auditStep === 'grouped' || auditStep === 'counted';
  
  const totalTens = currentRound.rohanTens + currentRound.papaTens;
  const totalOnes = currentRound.rohanOnes + currentRound.papaOnes;

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 font-sans md:rounded-3xl overflow-hidden relative">
      
      {/* HEADER */}
      <div className="w-full shrink-0 p-2 md:p-3 z-20 bg-white border-b-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
              <div className={`w-8 h-8 md:w-10 md:h-10 ${currentRound.bg} rounded-full flex items-center justify-center text-base md:text-xl`}>{currentRound.emoji}</div>
              <h2 className="text-base md:text-xl font-black text-slate-700 leading-none">Auditing: {currentRound.name}</h2>
          </div>
          <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{roundIndex + 1} / {FRUIT_ROUNDS.length}</span>
      </div>

      {/* MAIN WORKSPACE - Strict Flex constraints to prevent scrolling */}
      <div className="flex-1 min-h-0 flex flex-col p-2 md:p-4 gap-2 md:gap-4 overflow-hidden">
          
          {/* TOP SECTION: Individual Carts */}
          <div className="shrink-0 flex gap-2 md:gap-4 min-h-[100px] md:min-h-[140px]">
              {/* Rohan's Cart - Empties visually when moved */}
              <div className={`flex-1 bg-white rounded-2xl border-4 ${currentRound.border} shadow-sm flex flex-col relative overflow-hidden transition-all duration-500`}>
                  <div className={`text-center py-1 font-black text-[10px] md:text-sm text-white uppercase tracking-wider ${currentRound.color.replace('text-', 'bg-')}`}>Rohan's Cart</div>
                  <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-2 gap-2 md:gap-4">
                      {!isRohanMoved ? (
                          <>
                              <div className="flex gap-1 flex-wrap justify-center">
                                  {Array.from({length: currentRound.rohanTens}).map((_, i) => <BoxOf10 key={`r-t-${i}`} emoji={currentRound.emoji} colorStyle={currentRound.bg} />)}
                              </div>
                              <div className="w-full md:w-0.5 h-0.5 md:h-16 bg-slate-100 rounded-full shrink-0"></div>
                              <div className="flex flex-wrap gap-1 max-w-[80px] justify-center">
                                  {Array.from({length: currentRound.rohanOnes}).map((_, i) => <LooseItem key={`r-o-${i}`} emoji={currentRound.emoji} />)}
                              </div>
                          </>
                      ) : (
                          <span className="text-slate-300 font-bold italic text-sm">Empty</span>
                      )}
                  </div>
              </div>

              {/* Papa's Cart - Empties visually when moved */}
              <div className={`flex-1 bg-white rounded-2xl border-4 ${currentRound.border} shadow-sm flex flex-col relative overflow-hidden transition-all duration-500`}>
                  <div className={`text-center py-1 font-black text-[10px] md:text-sm text-white uppercase tracking-wider ${currentRound.color.replace('text-', 'bg-')}`}>Papa's Cart</div>
                  <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-2 gap-2 md:gap-4">
                      {!isPapaMoved ? (
                          <>
                              <div className="flex gap-1 flex-wrap justify-center">
                                  {Array.from({length: currentRound.papaTens}).map((_, i) => <BoxOf10 key={`p-t-${i}`} emoji={currentRound.emoji} colorStyle={currentRound.bg} />)}
                              </div>
                              <div className="w-full md:w-0.5 h-0.5 md:h-16 bg-slate-100 rounded-full shrink-0"></div>
                              <div className="flex flex-wrap gap-1 max-w-[80px] justify-center">
                                  {Array.from({length: currentRound.papaOnes}).map((_, i) => <LooseItem key={`p-o-${i}`} emoji={currentRound.emoji} />)}
                              </div>
                          </>
                      ) : (
                          <span className="text-slate-300 font-bold italic text-sm">Empty</span>
                      )}
                  </div>
              </div>
          </div>

          {/* BOTTOM SECTION: Central Audit Table */}
          <div className="flex-1 min-h-0 bg-slate-800 rounded-2xl md:rounded-[2rem] border-4 border-slate-700 shadow-xl flex flex-col relative overflow-hidden">
              <div className="text-center py-1.5 md:py-2 bg-slate-900/50 border-b-2 border-slate-700 font-black text-slate-400 uppercase tracking-widest text-[10px] md:text-xs">The Audit Table</div>
              
              <div className="flex-1 min-h-0 flex flex-col md:flex-row items-stretch justify-center p-2 md:p-4 gap-2 md:gap-4">
                  
                  {/* Master Tens Area */}
                  <div className="flex-1 flex flex-col items-center bg-slate-700/30 rounded-xl p-2 md:p-4 border-2 border-dashed border-slate-600 relative overflow-y-auto">
                      <span className="text-slate-400 font-black text-[10px] md:text-sm uppercase tracking-widest mb-2 shrink-0">Total Tens</span>
                      
                      {/* Flex layout that visibly groups them when requested */}
                      <div className={`flex flex-wrap gap-1 md:gap-2 justify-center content-start w-full transition-all duration-700 ${isGrouped ? 'gap-0 md:gap-0' : ''}`}>
                          {isRohanMoved && (
                              <div className="flex flex-wrap gap-1 md:gap-2 justify-center animate-fade-in-up">
                                  {Array.from({length: currentRound.rohanTens}).map((_, i) => <BoxOf10 key={`m-r-t-${i}`} emoji={currentRound.emoji} colorStyle={currentRound.bg} />)}
                              </div>
                          )}
                          {!isGrouped && isRohanMoved && isPapaMoved && <div className="w-full h-2"></div> /* Spacer before grouping */}
                          {isPapaMoved && (
                              <div className="flex flex-wrap gap-1 md:gap-2 justify-center animate-fade-in-up">
                                  {Array.from({length: currentRound.papaTens}).map((_, i) => <BoxOf10 key={`m-p-t-${i}`} emoji={currentRound.emoji} colorStyle={currentRound.bg} />)}
                              </div>
                          )}
                      </div>
                      
                      {/* Clear Label showing total value */}
                      {auditStep === 'counted' && (
                          <div className="mt-auto pt-2 shrink-0 z-10">
                              <span className="bg-sky-500 text-white font-black text-xl md:text-2xl px-3 py-1 rounded-lg animate-bounce inline-block shadow-lg border-2 border-sky-400">
                                  {totalTens * 10}
                              </span>
                          </div>
                      )}
                  </div>

                  {/* Math Symbol (Visible on desktop between, or below on mobile) */}
                  {isGrouped && <div className="text-2xl md:text-4xl text-slate-500 font-black shrink-0 flex items-center justify-center">+</div>}

                  {/* Master Ones Area */}
                  <div className="flex-1 flex flex-col items-center bg-slate-700/30 rounded-xl p-2 md:p-4 border-2 border-dashed border-slate-600 relative overflow-y-auto">
                      <span className="text-slate-400 font-black text-[10px] md:text-sm uppercase tracking-widest mb-2 shrink-0">Total Ones</span>
                      
                      {/* Flex layout that visibly groups them */}
                      <div className={`flex flex-wrap gap-1 md:gap-2 justify-center content-start max-w-[150px] transition-all duration-700 ${isGrouped ? 'gap-0 md:gap-0' : ''}`}>
                          {isRohanMoved && (
                              <div className="flex flex-wrap gap-1 md:gap-2 justify-center animate-fade-in-up">
                                  {Array.from({length: currentRound.rohanOnes}).map((_, i) => <LooseItem key={`m-r-o-${i}`} emoji={currentRound.emoji} />)}
                              </div>
                          )}
                          {!isGrouped && isRohanMoved && isPapaMoved && <div className="w-full h-2"></div>}
                          {isPapaMoved && (
                              <div className="flex flex-wrap gap-1 md:gap-2 justify-center animate-fade-in-up">
                                  {Array.from({length: currentRound.papaOnes}).map((_, i) => <LooseItem key={`m-p-o-${i}`} emoji={currentRound.emoji} />)}
                              </div>
                          )}
                      </div>

                      {/* Clear Label showing total value */}
                      {auditStep === 'counted' && (
                          <div className="mt-auto pt-2 shrink-0 z-10">
                              <span className="bg-sky-500 text-white font-black text-xl md:text-2xl px-3 py-1 rounded-lg animate-bounce inline-block shadow-lg border-2 border-sky-400 delay-100">
                                  {totalOnes}
                              </span>
                          </div>
                      )}
                  </div>

              </div>
              
              {/* Grand Total Overlay - Moved inside the header so it doesn't blur the table! */}
              {auditStep === 'counted' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 border-4 border-sky-500 text-white px-6 py-4 rounded-[2rem] shadow-2xl z-30 flex flex-col items-center justify-center animate-bounce">
                      <span className="text-sky-400 font-black uppercase tracking-widest text-xs mb-1">Final Count</span>
                      <div className="text-6xl md:text-7xl font-black drop-shadow-md leading-none">
                          {totalTens}{totalOnes}
                      </div>
                  </div>
              )}
          </div>

      </div>

      {/* CONTROLS FOOTER */}
      <div className="shrink-0 p-2 md:p-4 bg-white border-t-2 border-slate-200 shadow-sm z-30 relative">
          <button 
              onClick={handleAuditAction}
              className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-xl tracking-wide flex items-center justify-center gap-2 md:gap-3 transition-all border-b-[4px] md:border-b-[6px] active:translate-y-[4px] md:active:translate-y-[6px] active:border-b-[0px] shadow-sm
                  ${auditStep === 'start' ? 'bg-sky-100 border-sky-300 text-sky-700 hover:bg-sky-200' :
                    auditStep === 'rohan-moved' ? 'bg-sky-100 border-sky-300 text-sky-700 hover:bg-sky-200' :
                    auditStep === 'papa-moved' ? 'bg-amber-400 border-amber-600 text-amber-950 hover:bg-amber-300' :
                    auditStep === 'grouped' ? 'bg-indigo-500 border-indigo-700 text-white hover:bg-indigo-400' :
                    'bg-lime-400 border-lime-600 text-lime-950 hover:bg-lime-300'
                  }`}
          >
              {auditStep === 'start' ? <><ArrowDownToLine className="w-5 h-5 md:w-6 md:h-6" /> 1. Bring Rohan's Stock</> :
               auditStep === 'rohan-moved' ? <><ArrowDownToLine className="w-5 h-5 md:w-6 md:h-6" /> 2. Bring Papa's Stock</> :
               auditStep === 'papa-moved' ? <><PackagePlus className="w-5 h-5 md:w-6 md:h-6" /> 3. Group Tens & Ones</> :
               auditStep === 'grouped' ? <><Calculator className="w-5 h-5 md:w-6 md:h-6" /> 4. Count Total</> :
               <><ArrowRight className="w-5 h-5 md:w-6 md:h-6" /> Next Fruit</>
              }
          </button>
      </div>

    </div>
  );
}