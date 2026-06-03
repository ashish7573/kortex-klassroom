"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronRight, ChevronLeft, PackagePlus, Play, CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';

// --- Types & Data ---
type AppPhase = 'story1' | 'interactive' | 'story2';

const STORY1_SLIDES = [
  {
    image: '/assets/maths/FLN/CountingHundred1.webp',
    text: "Rohan is a master at Krishna Fruits! He can quickly pack any order up to 20 apples with his eyes closed."
  },
  {
    image: '/assets/maths/FLN/CountingHundred2.webp',
    text: "But Papa is handling the HUGE orders today! A customer asked for 45 apples. Rohan is confused. 'Papa, how do you count so many? I only know up to 20!'"
  },
  {
    image: '/assets/maths/FLN/CountingHundred3.webp',
    text: "Papa smiles. 'I will teach you my secret! But first, you must pack these empty boxes. Put exactly 10 apples in every box and bring them to my table.'"
  }
];

const STORY2_SLIDES = [
  {
    image: '/assets/maths/FLN/CountingHundred4.webp',
    text: "Rohan proudly looks at his 10 boxes. 'But Papa, what if a customer wants a number that doesn't fill a whole box? What if we have loose apples left over?'"
  },
  {
    image: '/assets/maths/FLN/CountingHundred5.webp',
    text: "Papa places 4 boxes on the table, and 3 loose apples next to them. 'It is a magic trick! First, count the boxes. Four boxes is Forty.'"
  },
  {
    image: '/assets/maths/FLN/CountingHundred6.webp',
    text: "'Then, count the loose apples. Three loose apples is Three. Put the words together... Forty-Three!' Rohan's eyes light up. Grouping into tens makes counting so fast!"
  }
];

const TENS_WORDS = [
    "Ten", "Twenty", "Thirty", "Forty", "Fifty", 
    "Sixty", "Seventy", "Eighty", "Ninety", "One Hundred"
];

export default function CountingHundred({ lesson, onComplete }: any) {
  const [phase, setPhase] = useState<AppPhase>('story1');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Interactive State
  const [packedBoxes, setPackedBoxes] = useState(0);

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

  const playSound = (type: 'pop' | 'kaching' | 'slide' | 'horn' | 'click') => {
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

  // --- Actions ---
  const handleNextSlide = (slidesArray: any[], nextPhase: AppPhase | 'finish') => {
    initAudio();
    playSound('pop');
    window.speechSynthesis.cancel();
    if (currentSlide < slidesArray.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      if (nextPhase === 'finish') {
          // Fallback, though the button is now hidden on the last slide.
          if (onComplete) onComplete();
      } else {
          setCurrentSlide(0);
          setPhase(nextPhase);
          playSound('horn');
      }
    }
  };

  const handlePrevSlide = () => {
    initAudio();
    playSound('pop');
    window.speechSynthesis.cancel();
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  const handlePackBox = () => {
      if (packedBoxes < 10) {
          const newVal = packedBoxes + 1;
          setPackedBoxes(newVal);
          playSound('pop');
          
          const word = TENS_WORDS[newVal - 1];
          const text = newVal === 1 
            ? `One box makes ten.` 
            : newVal === 10 
                ? `Ten boxes makes one hundred!`
                : `${newVal} boxes makes ${word}.`;
          
          speakText(text);

          if (newVal === 10) {
              setTimeout(() => playSound('kaching'), 500);
          }
      }
  };

  if (!mounted) return null;

  // ============================================================================
  // REUSABLE COMPONENTS
  // ============================================================================
  const BoxOf10 = () => (
      <div className="relative bg-amber-100 rounded-lg md:rounded-2xl border-[3px] md:border-4 border-amber-600 p-1 md:p-2 shadow-sm w-full max-w-[75px] sm:max-w-[90px] md:max-w-[140px] lg:max-w-[180px] mx-auto animate-fade-in-up flex flex-col items-center">
          <div className="absolute -top-2 md:-top-3 bg-amber-600 text-white text-[7px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest px-1 md:px-2 py-0.5 rounded shadow-sm z-10 whitespace-nowrap">Box of 10</div>
          <div className="grid grid-cols-5 gap-0.5 md:gap-1 lg:gap-1.5 bg-amber-200/50 p-1 md:p-1.5 lg:p-2 rounded md:rounded-lg border md:border-2 border-amber-300 w-full mt-1.5 md:mt-2">
              {Array.from({length: 10}).map((_, i) => (
                  <div key={i} className="aspect-square bg-amber-50/80 rounded-[2px] md:rounded border border-amber-200/50 flex items-center justify-center shadow-inner">
                      <span className="text-[6px] md:text-sm lg:text-xl drop-shadow-sm">🍎</span>
                  </div>
              ))}
          </div>
      </div>
  );

  const StoryRenderer = ({ slides, nextPhase, isFinish = false }: { slides: any[], nextPhase: AppPhase | 'finish', isFinish?: boolean }) => {
      const slide = slides[currentSlide];
      const isLastSlide = currentSlide === slides.length - 1;

      return (
        <div className="w-full h-full flex flex-col bg-slate-50 font-sans md:rounded-3xl overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col p-3 md:p-6">
             <div className="max-w-4xl w-full mx-auto flex flex-col h-full gap-3 md:gap-4">
                
                {/* Dynamically sizing image container */}
                <div className="flex-1 min-h-0 w-full bg-slate-200 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-4 border-white shadow-md relative">
                   <img src={slide.image} alt="Story scene" className="absolute inset-0 w-full h-full object-contain bg-sky-50 z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                   <button 
                     onClick={() => { initAudio(); speakText(slide.text); }}
                     className={`absolute top-3 right-3 md:top-4 md:right-4 z-20 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border-b-4 transition-all active:translate-y-1 shadow-lg ${isSpeaking ? 'bg-amber-100 text-amber-500 border-amber-200 animate-pulse' : 'bg-sky-500 text-white border-sky-700 hover:bg-sky-400'}`}
                   >
                     <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                   </button>
                </div>

                {/* Fixed height text container to prevent layout shifting */}
                <div className="shrink-0 bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border-4 border-slate-100 shadow-sm flex items-center justify-center text-center">
                   <p className="text-sm md:text-lg lg:text-xl font-bold text-slate-700 leading-snug md:leading-relaxed max-w-2xl">
                     {slide.text}
                   </p>
                </div>
             </div>
          </div>

          <div className="shrink-0 p-2 md:p-4 flex justify-between items-center max-w-4xl mx-auto w-full">
             <button 
               onClick={handlePrevSlide} 
               className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${currentSlide === 0 ? 'invisible' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
             >
               <ChevronLeft size={16} /> Back
             </button>
             
             <div className="flex gap-2">
               {slides.map((_, i) => (
                 <div key={i} className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${i === currentSlide ? 'bg-sky-500 scale-125' : 'bg-slate-300'} transition-all`} />
               ))}
             </div>
             
             {/* If it's the final slide of the whole tool, we hide our internal Next button to let the LessonPlayer's Complete button take over */}
             {!(isFinish && isLastSlide) ? (
                 <button 
                   onClick={() => handleNextSlide(slides, nextPhase)}
                   className="px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 bg-sky-500 hover:bg-sky-400 text-white border-b-4 border-sky-700 active:border-b-0"
                 >
                   {isLastSlide ? 'Start Packing' : 'Next'} <ChevronRight size={16} />
                 </button>
             ) : (
                 <div className="w-20" /> /* Spacer to keep dots centered */
             )}
          </div>
        </div>
      );
  };

  // ============================================================================
  // RENDER ROUTER
  // ============================================================================
  if (phase === 'story1') return <StoryRenderer slides={STORY1_SLIDES} nextPhase="interactive" />;
  if (phase === 'story2') return <StoryRenderer slides={STORY2_SLIDES} nextPhase="finish" isFinish={true} />;

  // ============================================================================
  // RENDER: PHASE 2 - THE INTERACTIVE TENS BUILDER
  // ============================================================================
  const currentWord = packedBoxes > 0 ? TENS_WORDS[packedBoxes - 1] : "Zero";
  const currentTotal = packedBoxes * 10;
  const isDone = packedBoxes === 10;

  return (
    <div className="w-full h-full flex flex-col bg-sky-50 font-sans md:rounded-3xl overflow-hidden">
      
      {/* HEADER - Compacted for mobile */}
      <div className="w-full shrink-0 p-2 md:p-3 pb-0 z-20">
          <div className="max-w-6xl mx-auto p-2 md:p-3 rounded-xl md:rounded-2xl flex items-center justify-between bg-white border-2 border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-500"><PackagePlus className="w-4 h-4 md:w-5 md:h-5" /></div>
                  <h2 className="text-base md:text-xl font-black text-slate-700 leading-none">Discovering Tens</h2>
              </div>
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-full">Pack 10 Boxes</span>
          </div>
      </div>

      {/* MAIN LAYOUT: Adapts perfectly. Uses Flex Order to swap layout on Mobile! */}
      <div className="w-full max-w-6xl mx-auto flex-1 min-h-0 flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-4 pb-3 md:pb-4">
          
          {/* THE PACKING TABLE (Visuals) - Placed Top on Mobile (order-1), Right on Desktop (md:order-2) */}
          <div className="flex-[1.5] md:flex-[2] lg:flex-[2.5] min-h-[160px] md:min-h-0 bg-white/70 p-3 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-4 border-white shadow-sm flex flex-col relative overflow-hidden order-1 md:order-2">
              <div className="flex items-center justify-between mb-2 md:mb-4 border-b-2 border-slate-200 pb-2 shrink-0">
                  <h3 className="text-xs md:text-base font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 md:w-3 md:h-3 bg-amber-400 rounded-full"></span> Packing Table
                  </h3>
                  <span className="text-[10px] md:text-sm font-bold text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">{packedBoxes}/10 Boxes</span>
              </div>

              {packedBoxes === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                      <span className="text-slate-300 font-bold italic text-sm md:text-xl text-center px-4">The table is empty.</span>
                  </div>
              ) : (
                  <div className="flex-1 min-h-0 w-full flex items-end justify-center overflow-hidden pb-1">
                      {/* Grid stays constrained, fills from bottom to top dynamically */}
                      <div className="grid grid-cols-5 md:grid-cols-2 lg:grid-cols-5 gap-1.5 md:gap-3 lg:gap-4 w-full content-end max-w-full">
                          {Array.from({length: packedBoxes}).map((_, i) => (
                              <BoxOf10 key={`box-${i}`} />
                          ))}
                      </div>
                  </div>
              )}
          </div>

          {/* CONTROLS & MATH BOARD - Placed Bottom on Mobile (order-2), Left on Desktop (md:order-1) */}
          <div className="w-full flex-1 md:flex-none md:w-[45%] lg:w-[35%] flex flex-col gap-2 md:gap-4 min-h-0 order-2 md:order-1">
              
              {/* TRANSLATOR BOARD */}
              <div className="flex-1 min-h-[100px] md:min-h-[200px] bg-white rounded-[1.5rem] md:rounded-[2rem] border-4 border-slate-100 shadow-sm p-3 md:p-6 flex flex-col items-center justify-center text-center relative">
                  {packedBoxes === 0 ? (
                      <span className="text-slate-400 font-bold italic text-sm md:text-lg">Tap the button below to pack!</span>
                  ) : (
                      <div className="animate-fade-in-up flex flex-col justify-center items-center w-full h-full">
                          <button onClick={() => speakText(`${packedBoxes} ${packedBoxes === 1 ? 'box' : 'boxes'} makes ${currentTotal}. ${currentWord}!`)} className="absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-sky-100 hover:text-sky-500 transition-colors">
                              <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          
                          <div className="flex flex-row md:flex-col items-center justify-center gap-3 md:gap-4 w-full">
                              <div className="bg-sky-50 border-2 border-sky-100 rounded-xl md:rounded-2xl py-2 px-3 md:py-4 md:px-2 flex items-center justify-center gap-2 w-full md:w-auto">
                                  <span className="text-3xl md:text-5xl lg:text-6xl font-black text-sky-500 leading-none">{packedBoxes}</span>
                                  <div className="flex flex-col text-left leading-none">
                                      <span className="text-sm md:text-xl lg:text-2xl font-black text-slate-600 uppercase">Boxes</span>
                                  </div>
                              </div>

                              <span className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-300 leading-none">=</span>

                              <div className="bg-indigo-50 border-2 border-indigo-100 rounded-xl md:rounded-2xl py-2 px-3 md:py-4 md:px-2 flex flex-col items-center justify-center w-full md:w-auto">
                                  <span className="text-3xl md:text-6xl lg:text-7xl font-black text-indigo-600 tracking-tight leading-none">{currentTotal}</span>
                                  <span className="text-xs md:text-xl lg:text-2xl font-black text-indigo-400 uppercase tracking-widest mt-1">{currentWord}</span>
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* ACTION CONTROLS */}
              <div className="shrink-0 h-[60px] md:h-[120px]">
                  {!isDone ? (
                      <button 
                          onClick={handlePackBox}
                          className="w-full h-full rounded-[1.5rem] md:rounded-[2rem] border-b-[6px] md:border-b-[8px] flex flex-row md:flex-col items-center justify-center gap-2 transition-all bg-amber-400 border-amber-600 text-amber-950 hover:bg-amber-300 active:translate-y-[6px] md:active:translate-y-[8px] active:border-b-[0px] shadow-sm"
                      >
                         <PackagePlus className="w-5 h-5 md:w-10 md:h-10 text-amber-700" />
                         <span className="font-black text-base md:text-3xl tracking-wide">PACK 1 BOX</span>
                      </button>
                  ) : (
                      <div className="flex items-center gap-2 h-full animate-fade-in-up">
                          <button 
                              onClick={() => { setPackedBoxes(0); playSound('slide'); }}
                              className="flex-[1] h-full rounded-[1.5rem] md:rounded-[2rem] border-b-[6px] md:border-b-[8px] bg-slate-200 border-slate-300 text-slate-600 active:translate-y-[6px] md:active:translate-y-[8px] active:border-b-[0px] hover:bg-slate-300 flex flex-col items-center justify-center gap-1 font-black text-sm md:text-lg transition-all shadow-sm"
                          >
                              <RotateCcw className="w-4 h-4 md:w-6 md:h-6" />
                              RETRY
                          </button>

                          <button 
                              onClick={() => { setCurrentSlide(0); setPhase('story2'); playSound('slide'); }}
                              className="flex-[2] h-full rounded-[1.5rem] md:rounded-[2rem] border-b-[6px] md:border-b-[8px] bg-lime-400 border-lime-600 text-lime-950 active:translate-y-[6px] md:active:translate-y-[8px] active:border-b-[0px] hover:bg-lime-300 flex flex-col items-center justify-center gap-1 font-black text-base md:text-2xl transition-all shadow-sm animate-bounce"
                          >
                              <div className="flex items-center gap-2">CONTINUE <ArrowRight className="w-5 h-5 md:w-6 md:h-6" /></div>
                          </button>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}