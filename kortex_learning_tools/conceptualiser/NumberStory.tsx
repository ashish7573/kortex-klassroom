'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronRight, ChevronLeft, Volume2, BookOpen, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

const STORY_DATA = [
  {
    id: 0,
    text: "Meet Rohan! Tomorrow is his very first day of school. But oh no... his school bag is completely empty!",
    audio: "Meet Rohan! Tomorrow is his very first day of school. But oh no, his school bag is completely empty!",
  },
  {
    id: 1,
    text: "Rohan and his mother go to the market to buy school supplies. Rohan is ready to help!",
    audio: "Rohan and his mother go to the market to buy school supplies. Rohan is ready to help!",
  },
  {
    id: 2,
    text: "First, they buy some pencils. His mother gives the shopkeeper some coins.",
    audio: "First, they buy some pencils. His mother gives the shopkeeper some coins.",
  },
  {
    id: 3,
    text: "Next, they buy notebooks. Mother gives a paper note, but wait... the shopkeeper gives her coins back! Why did he give money back?",
    audio: "Next, they buy notebooks. Mother gives a paper note, but wait... the shopkeeper gives her coins back! Why did he give money back?",
  },
  {
    id: 4,
    text: "Finally, they buy a pink eraser. Mother gives just one coin. No money comes back this time.",
    audio: "Finally, they buy a pink eraser. Mother gives just one coin. No money comes back this time.",
  },
  {
    id: 5,
    text: "Rohan is very confused. Sometimes Mother gives lots of coins. Sometimes she gets money back. How does she know exactly what to give?",
    audio: "Rohan is very confused. Sometimes Mother gives lots of coins. Sometimes she gets money back. How does she know exactly what to give?",
  },
  {
    id: 6,
    text: "Mother smiles and says, 'It is not magic, Rohan! It is called Counting. Everything has a Number!'",
    audio: "Mother smiles and says, It is not magic, Rohan! It is called Counting. Everything has a Number!",
  },
  {
    id: 7,
    text: "If you know your numbers, you can buy pencils, share toys, and count your friends! Let’s learn our numbers from 1 to 10!",
    audio: "If you know your numbers, you can buy pencils, share toys, and count your friends! Let’s learn our numbers from 1 to 10!",
  }
];

export default function NumberStory({ lesson, onComplete }: any) {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Sound FX Engine ---
  const initAudio = () => {
    if (typeof window !== 'undefined' && !audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  };

  const playSound = (type: 'pop' | 'chime' | 'success') => {
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'pop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.1); // A5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'success') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + i * 0.1);
          g.gain.setValueAtTime(0.2, now + i * 0.1);
          g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.25);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.25);
        });
      }
    } catch {
      // Audio context fallback
    }
  };

  // --- TTS Audio Engine ---
  const unlockAudioAndStart = () => {
    initAudio();
    playSound('pop');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const unlockSpeech = new SpeechSynthesisUtterance('');
      unlockSpeech.volume = 0;
      window.speechSynthesis.speak(unlockSpeech);
    }
    setHasStarted(true);
  };

  const speakCurrentSlide = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

      const text = STORY_DATA[currentSlide].audio;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN'; 
      utterance.rate = 0.9;     
      utterance.pitch = 1.1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        setIsSpeaking(false);
      };
      
      // Safety timeout in case TTS engine drops onend
      const safeTimeMs = Math.max(3000, (text.length / 10) * 1000 + 2000);
      fallbackTimerRef.current = setTimeout(() => {
        setIsSpeaking(false);
      }, safeTimeMs);

      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (hasStarted && !isFinished) {
      speakCurrentSlide();
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [currentSlide, hasStarted, isFinished]);

  // --- Handlers ---
  const handleNext = () => {
    playSound('pop');
    if (currentSlide < STORY_DATA.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      playSound('success');
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    playSound('pop');
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  const handleFinish = () => {
    playSound('success');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onComplete?.({
      score: STORY_DATA.length,
      maxScore: STORY_DATA.length,
      status: 'completed'
    });
  };

  const handleRestart = () => {
    playSound('chime');
    setIsFinished(false);
    setCurrentSlide(0);
  };

  // --- Startup Screen ---
  if (!hasStarted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50 p-6 animate-fade-in relative overflow-hidden font-sans">
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
          <BookOpen className="w-[120%] h-[120%] text-amber-900" />
        </div>
        <div className="relative z-10 text-center max-w-md bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border-4 border-amber-200">
           <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <BookOpen className="w-10 h-10 text-amber-500" />
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">Rohan Goes Shopping!</h1>
           <p className="text-lg text-slate-500 font-bold mb-10">A story about why we need to count.</p>
           
           <button 
             onClick={unlockAudioAndStart} 
             className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xl md:text-2xl rounded-2xl shadow-xl border-b-8 border-amber-700 transition-transform active:translate-y-2 flex items-center justify-center gap-3 cursor-pointer"
           >
             <Play fill="currentColor" /> READ STORY
           </button>
        </div>
      </div>
    );
  }

  // --- Story Completion Celebration Screen ---
  if (isFinished) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50/90 p-4 md:p-6 font-sans min-h-0 animate-fade-in">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 md:p-8 shadow-2xl border-4 border-amber-300 text-center relative flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
            <Sparkles size={40} className="animate-spin text-amber-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">Story Complete! 🎉</h2>
          <p className="text-sm md:text-base text-slate-600 font-bold mb-6">
            Now Rohan knows why we count! Ready to start learning your numbers?
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleFinish}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-base md:text-lg rounded-2xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 animate-pulse cursor-pointer"
            >
              <CheckCircle2 size={22} /> Finish Lesson & Continue ➔
            </button>

            <button
              onClick={handleRestart}
              className="w-full py-3 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 font-bold text-sm md:text-base rounded-2xl border-2 border-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={18} /> Read Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-amber-50 font-sans relative overflow-hidden min-h-0">
      
      {/* HEADER BAR */}
      <div className="shrink-0 bg-amber-100/70 border-b border-amber-200 px-4 py-2 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-amber-500 text-amber-950 flex items-center justify-center font-black text-xs shadow-sm">
            📖
          </span>
          <div>
            <h2 className="text-xs md:text-sm font-black text-amber-950">Rohan Goes Shopping</h2>
            <p className="text-[10px] md:text-xs text-amber-700 font-bold">
              Page {currentSlide + 1} of {STORY_DATA.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Header Finish Shortcut */}
          {currentSlide >= 3 && onComplete && (
            <button
              onClick={handleFinish}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl border-b-2 border-emerald-700 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Finish Lesson"
            >
              <CheckCircle2 size={14} /> Finish
            </button>
          )}

          {/* Voice Read Aloud Toggle */}
          <button 
            onClick={speakCurrentSlide}
            className={`p-2 rounded-xl shadow-sm border transition-all active:translate-y-0.5 cursor-pointer ${
              isSpeaking 
                ? 'bg-amber-200 border-amber-400 text-amber-900' 
                : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50'
            }`}
            title="Read Aloud"
          >
            <Volume2 size={18} className={isSpeaking ? 'animate-pulse' : ''} />
          </button>
        </div>
      </div>

      {/* HEADER PROGRESS BAR */}
      <div className="h-1.5 bg-amber-200 w-full shrink-0">
         <div 
           className="h-full bg-amber-500 transition-all duration-500 ease-out"
           style={{ width: `${((currentSlide + 1) / STORY_DATA.length) * 100}%` }}
         />
      </div>

      {/* MAIN VISUAL AREA (Constrained with min-h-0 to prevent overflow) */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center p-3 md:p-5 relative">
        {/* The Image Container (Locks to maximum safe height) */}
        <div className="w-full h-full max-w-4xl flex items-center justify-center bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border-4 border-amber-100 overflow-hidden relative">
           <img 
             key={currentSlide} 
             src={`/assets/maths/FLN/NumberStory${currentSlide + 1}.webp`} 
             alt={`Story illustration part ${currentSlide + 1}`}
             className="absolute inset-0 w-full h-full object-contain animate-fade-in p-4"
             onError={(e) => {
               (e.target as HTMLImageElement).src = `/assets/maths/FLN/NumberStory${currentSlide + 1}.webp`;
             }}
           />
        </div>
      </div>

      {/* TEXT & NAVIGATION AREA (Shrink-0 prevents it from being crushed) */}
      <div className="shrink-0 bg-white border-t-4 border-slate-200 p-4 md:p-5 rounded-t-[2rem] md:rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
         <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-3 md:gap-6">
            
            {/* Top/Left Row: Back Button */}
            <div className="flex items-center justify-between w-full md:w-auto shrink-0">
              <button 
                onClick={handlePrev} 
                disabled={currentSlide === 0}
                className={`w-11 h-11 md:w-14 md:h-14 shrink-0 flex items-center justify-center rounded-2xl border-b-4 transition-all active:translate-y-1 
                  ${currentSlide === 0 ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-slate-800 border-slate-900 text-white hover:bg-slate-700 cursor-pointer'}`}
                title="Previous Slide"
              >
                <ChevronLeft size={26} />
              </button>

              {/* Mobile Only: Progress Dots */}
              <div className="flex md:hidden gap-1.5">
                {STORY_DATA.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 rounded-full transition-all ${
                      i === currentSlide ? 'w-5 bg-amber-500' : 'w-2 bg-slate-200'
                    }`} 
                  />
                ))}
              </div>

              {/* Mobile Forward/Finish Button */}
              <div className="md:hidden">
                {currentSlide < STORY_DATA.length - 1 ? (
                  <button 
                    onClick={handleNext}
                    className="w-11 h-11 shrink-0 flex items-center justify-center rounded-2xl bg-amber-500 border-b-4 border-amber-700 text-white transition-all active:translate-y-1 hover:bg-amber-400 cursor-pointer"
                    title="Next Slide"
                  >
                    <ChevronRight size={26} />
                  </button>
                ) : (
                  <button 
                    onClick={handleFinish}
                    className="px-3.5 py-2.5 shrink-0 flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 text-slate-950 font-black text-xs shadow-md transition-all active:translate-y-1 hover:bg-emerald-400 cursor-pointer"
                  >
                    <CheckCircle2 size={16} /> Finish
                  </button>
                )}
              </div>
            </div>

            {/* Story Text */}
            <div className="flex-1 text-center min-h-[50px] md:min-h-[70px] flex items-center justify-center px-2">
              <p className="text-base md:text-xl lg:text-2xl font-bold text-slate-700 leading-snug">
                {STORY_DATA[currentSlide].text}
              </p>
            </div>

            {/* Desktop Desktop Forward / Finish CTA */}
            <div className="hidden md:flex shrink-0">
              {currentSlide < STORY_DATA.length - 1 ? (
                <button 
                  onClick={handleNext}
                  className="w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl bg-amber-500 border-b-4 border-amber-700 text-white transition-all active:translate-y-1 hover:bg-amber-400 cursor-pointer shadow-md"
                  title="Next Slide"
                >
                  <ChevronRight size={28} />
                </button>
              ) : (
                <button 
                  onClick={handleFinish}
                  className="px-6 py-3.5 shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 text-slate-950 font-black text-sm md:text-base shadow-lg shadow-emerald-500/25 transition-all active:translate-y-1 hover:bg-emerald-400 cursor-pointer animate-pulse"
                >
                  <CheckCircle2 size={20} /> Finish & Continue ➔
                </button>
              )}
            </div>

         </div>
      </div>

    </div>
  );
}