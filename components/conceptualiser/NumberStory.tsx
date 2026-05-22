'use client';

import React, { useState, useEffect } from 'react';
import { Play, ChevronRight, ChevronLeft, Volume2, BookOpen, Star } from 'lucide-react';

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

  // --- Audio Engine ---
  const unlockAudioAndStart = () => {
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
      const utterance = new SpeechSynthesisUtterance(STORY_DATA[currentSlide].audio);
      utterance.lang = 'en-IN'; 
      utterance.rate = 0.9;     
      utterance.pitch = 1.1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (hasStarted) {
      speakCurrentSlide();
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentSlide, hasStarted]);

  // --- Handlers ---
  const handleNext = () => {
    if (currentSlide < STORY_DATA.length - 1) setCurrentSlide(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
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
             className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xl md:text-2xl rounded-2xl shadow-xl border-b-8 border-amber-700 transition-transform active:translate-y-2 flex items-center justify-center gap-3"
           >
             <Play fill="currentColor" /> READ STORY
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-amber-50 font-sans relative overflow-hidden min-h-0">
      
      {/* HEADER PROGRESS */}
      <div className="h-2 bg-amber-200 w-full shrink-0">
         <div 
           className="h-full bg-amber-500 transition-all duration-500 ease-out"
           style={{ width: `${((currentSlide + 1) / STORY_DATA.length) * 100}%` }}
         />
      </div>

      {/* MAIN VISUAL AREA (Constrained with min-h-0 to prevent overflow) */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center p-4 relative">
        <div className="absolute top-6 right-6 z-20">
           <button 
             onClick={speakCurrentSlide}
             className={`p-3 rounded-full shadow-md border-b-4 transition-all active:translate-y-1 ${isSpeaking ? 'bg-amber-100 border-amber-300 text-amber-500' : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'}`}
             title="Read Aloud"
           >
             <Volume2 className={isSpeaking ? 'animate-pulse' : ''} />
           </button>
        </div>

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
      <div className="shrink-0 bg-white border-t-4 border-slate-200 p-4 md:p-6 rounded-t-[2rem] md:rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
         <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-6">
            
            {/* Nav Back */}
            <button 
              onClick={handlePrev} 
              disabled={currentSlide === 0}
              className={`w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center rounded-2xl border-b-4 transition-all active:translate-y-1 
                ${currentSlide === 0 ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-slate-800 border-slate-900 text-white hover:bg-slate-700'}`}
            >
              <ChevronLeft size={28} />
            </button>

            {/* Story Text */}
            <div className="flex-1 text-center min-h-[60px] md:min-h-[80px] flex items-center justify-center px-2">
              <p className="text-lg md:text-2xl font-bold text-slate-700 leading-snug">
                {STORY_DATA[currentSlide].text}
              </p>
            </div>

            {/* Nav Forward / Finish */}
            {currentSlide < STORY_DATA.length - 1 ? (
              <button 
                onClick={handleNext}
                className="w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center rounded-2xl bg-amber-500 border-b-4 border-amber-700 text-white transition-all active:translate-y-1 hover:bg-amber-400"
              >
                <ChevronRight size={28} />
              </button>
            ) : (
              <button 
                onClick={() => onComplete?.()}
                className="px-6 h-12 md:h-14 shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 text-white font-black transition-all active:translate-y-1 hover:bg-emerald-400"
              >
                <Star className="fill-white" size={20} /> 
                <span className="hidden md:inline">START LEARNING</span>
              </button>
            )}

         </div>
      </div>

    </div>
  );
}