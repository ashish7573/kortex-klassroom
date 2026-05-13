'use client';

import React, { useState, useEffect, useRef } from 'react';
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
      window.speechSynthesis.cancel(); // Clear queue
      // iOS Unlock: Speak a silent utterance on first tap
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
      utterance.lang = 'en-IN'; // Indian English for relatable accent
      utterance.rate = 0.9;     // Slow down slightly for kids
      utterance.pitch = 1.1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Trigger audio whenever the slide changes (after starting)
  useEffect(() => {
    if (hasStarted) {
      speakCurrentSlide();
    }
    // Cleanup on unmount
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

  // --- Dynamic SVG Scenes ---
  const renderScene = (id: number) => {
    switch (id) {
      case 0: // Empty Bag
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-sm drop-shadow-xl animate-fade-in">
             {/* Rohan */}
             <circle cx="70" cy="80" r="25" fill="#fcd34d" />
             <rect x="55" y="105" width="30" height="40" fill="#3b82f6" rx="5" />
             <path d="M 60,95 Q 70,110 80,95" fill="transparent" stroke="#b45309" strokeWidth="3" />
             {/* Bag */}
             <rect x="110" y="100" width="50" height="60" fill="#ef4444" rx="10" />
             <path d="M 120,100 C 120,80 150,80 150,100" fill="transparent" stroke="#ef4444" strokeWidth="6" />
             {/* Question mark */}
             <text x="125" y="80" fontSize="30" fill="#slate-400" className="animate-bounce font-black text-slate-400">?</text>
          </svg>
        );
      case 1: // Market
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-sm drop-shadow-xl animate-fade-in">
             {/* Stall Awning */}
             <path d="M 10,60 L 190,60 L 170,30 L 30,30 Z" fill="#f59e0b" />
             <rect x="20" y="60" width="160" height="10" fill="#d97706" />
             {/* Mother */}
             <circle cx="130" cy="100" r="20" fill="#fcd34d" />
             <path d="M 115,120 L 145,120 L 155,180 L 105,180 Z" fill="#10b981" />
             {/* Rohan */}
             <circle cx="80" cy="130" r="15" fill="#fcd34d" />
             <rect x="70" y="145" width="20" height="35" fill="#3b82f6" rx="4" />
          </svg>
        );
      case 2: // Pencils (Coins moving)
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-sm drop-shadow-xl animate-fade-in">
             <rect x="90" y="80" width="20" height="80" fill="#8b5cf6" />
             {/* Mother's Hand */}
             <path d="M 180,120 C 150,120 130,110 130,130 C 130,140 180,140 180,140 Z" fill="#fcd34d" />
             {/* Shopkeeper's Hand */}
             <path d="M 20,120 C 50,120 70,110 70,130 C 70,140 20,140 20,140 Z" fill="#fcd34d" />
             {/* Coins sliding right to left */}
             <g className="animate-[slide-left_2s_ease-in-out_infinite]">
               <circle cx="120" cy="115" r="8" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
               <circle cx="100" cy="115" r="8" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
             </g>
             {/* Pencils sliding left to right */}
             <g className="animate-[slide-right_2s_ease-in-out_infinite]">
               <rect x="40" y="80" width="6" height="40" fill="#ef4444" />
               <path d="M 40,80 L 43,70 L 46,80 Z" fill="#fca5a5" />
               <rect x="50" y="80" width="6" height="40" fill="#ef4444" />
               <path d="M 50,80 L 53,70 L 56,80 Z" fill="#fca5a5" />
             </g>
          </svg>
        );
      case 3: // Notebooks (Note moving, change returning)
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-sm drop-shadow-xl animate-fade-in">
             <rect x="90" y="80" width="20" height="80" fill="#8b5cf6" />
             <path d="M 180,120 C 150,120 130,110 130,130 C 130,140 180,140 180,140 Z" fill="#fcd34d" />
             <path d="M 20,120 C 50,120 70,110 70,130 C 70,140 20,140 20,140 Z" fill="#fcd34d" />
             
             {/* Note moving right to left */}
             <rect x="90" y="105" width="40" height="20" fill="#34d399" className="animate-[slide-left_3s_ease-in-out_infinite]" />
             
             {/* Coins returning left to right */}
             <g className="animate-[slide-right_3s_ease-in-out_infinite]">
               <circle cx="60" cy="115" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
               <circle cx="75" cy="115" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
             </g>
             
             {/* Notebook */}
             <rect x="30" y="80" width="30" height="40" fill="#3b82f6" rx="2" />
          </svg>
        );
      case 4: // Eraser (Exact match)
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-sm drop-shadow-xl animate-fade-in">
             <rect x="90" y="80" width="20" height="80" fill="#8b5cf6" />
             <path d="M 180,120 C 150,120 130,110 130,130 C 130,140 180,140 180,140 Z" fill="#fcd34d" />
             <path d="M 20,120 C 50,120 70,110 70,130 C 70,140 20,140 20,140 Z" fill="#fcd34d" />
             
             {/* One single coin */}
             <circle cx="110" cy="115" r="8" fill="#fbbf24" stroke="#d97706" strokeWidth="2" className="animate-[slide-left_2s_ease-in-out_infinite]" />
             {/* Eraser */}
             <rect x="40" y="100" width="20" height="15" fill="#f472b6" rx="2" className="animate-[slide-right_2s_ease-in-out_infinite]" />
          </svg>
        );
      case 5: // Confusion
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-sm drop-shadow-xl animate-fade-in">
             {/* Rohan Head */}
             <circle cx="100" cy="100" r="40" fill="#fcd34d" />
             <path d="M 85,90 Q 90,80 95,90" fill="transparent" stroke="#b45309" strokeWidth="3" />
             <path d="M 105,90 Q 110,80 115,90" fill="transparent" stroke="#b45309" strokeWidth="3" />
             <path d="M 90,115 Q 100,105 110,115" fill="transparent" stroke="#b45309" strokeWidth="3" />
             
             {/* Floating elements */}
             <g className="animate-pulse">
               <text x="30" y="60" fontSize="30" fill="#ef4444" fontWeight="bold">?</text>
               <text x="150" y="70" fontSize="40" fill="#ef4444" fontWeight="bold">?</text>
               <circle cx="40" cy="120" r="10" fill="#fbbf24" />
               <rect x="140" y="120" width="30" height="15" fill="#34d399" />
               <circle cx="160" cy="150" r="10" fill="#fbbf24" />
             </g>
          </svg>
        );
      case 6: // Mother Explains
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-sm drop-shadow-xl animate-fade-in">
             {/* Mother */}
             <circle cx="60" cy="80" r="25" fill="#fcd34d" />
             <path d="M 45,105 L 75,105 L 85,180 L 35,180 Z" fill="#10b981" />
             {/* Rohan */}
             <circle cx="150" cy="120" r="20" fill="#fcd34d" />
             {/* Pointing Arm */}
             <path d="M 75,105 L 120,80" stroke="#fcd34d" strokeWidth="8" strokeLinecap="round" />
             {/* Signboard */}
             <rect x="100" y="30" width="80" height="50" fill="#1e293b" rx="5" />
             <text x="110" y="65" fontSize="24" fill="#fbbf24" fontWeight="bold">1 2 3</text>
          </svg>
        );
      case 7: // Let's Learn!
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-sm drop-shadow-xl animate-fade-in">
             <circle cx="100" cy="100" r="30" fill="#fcd34d" />
             <path d="M 90,95 Q 100,115 110,95" fill="transparent" stroke="#b45309" strokeWidth="3" />
             <rect x="85" y="130" width="30" height="50" fill="#3b82f6" rx="5" />
             
             {/* Floating Numbers */}
             <g className="font-black text-2xl animate-bounce">
               <text x="40" y="60" fill="#ef4444">1</text>
               <text x="150" y="70" fill="#3b82f6">2</text>
               <text x="70" y="40" fill="#10b981">3</text>
               <text x="130" y="140" fill="#f59e0b">4</text>
               <text x="30" y="130" fill="#8b5cf6">5</text>
             </g>
          </svg>
        );
      default:
        return null;
    }
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
    <div className="w-full h-full flex flex-col bg-amber-50 font-sans relative overflow-hidden">
      
      {/* CUSTOM ANIMATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-left { 0% { transform: translateX(20px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateX(-20px); opacity: 0; } }
        @keyframes slide-right { 0% { transform: translateX(-20px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateX(20px); opacity: 0; } }
      `}} />

      {/* HEADER PROGRESS */}
      <div className="h-2 bg-amber-200 w-full shrink-0">
         <div 
           className="h-full bg-amber-500 transition-all duration-500 ease-out"
           style={{ width: `${((currentSlide + 1) / STORY_DATA.length) * 100}%` }}
         />
      </div>

      {/* MAIN VISUAL AREA */}
      <div className="flex-1 w-full flex items-center justify-center p-4 md:p-8 relative">
        <div className="absolute top-4 right-4 z-20">
           <button 
             onClick={speakCurrentSlide}
             className={`p-3 rounded-full shadow-md border-b-4 transition-all active:translate-y-1 ${isSpeaking ? 'bg-amber-100 border-amber-300 text-amber-500' : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'}`}
             title="Read Aloud"
           >
             <Volume2 className={isSpeaking ? 'animate-pulse' : ''} />
           </button>
        </div>

        {/* The SVG Illustration Container */}
        <div className="w-full max-w-2xl h-full flex items-center justify-center bg-white rounded-[3rem] shadow-xl border-4 border-amber-100 p-4">
           {renderScene(currentSlide)}
        </div>
      </div>

      {/* TEXT & NAVIGATION AREA */}
      <div className="shrink-0 bg-white border-t-4 border-slate-200 p-6 md:p-8 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
         <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-8">
            
            {/* Nav Back */}
            <button 
              onClick={handlePrev} 
              disabled={currentSlide === 0}
              className={`w-14 h-14 md:w-16 md:h-16 shrink-0 flex items-center justify-center rounded-2xl border-b-4 transition-all active:translate-y-1 
                ${currentSlide === 0 ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-slate-800 border-slate-900 text-white hover:bg-slate-700'}`}
            >
              <ChevronLeft size={32} />
            </button>

            {/* Story Text */}
            <div className="flex-1 text-center min-h-[80px] flex items-center justify-center">
              <p className="text-xl md:text-3xl font-bold text-slate-700 leading-snug">
                {STORY_DATA[currentSlide].text}
              </p>
            </div>

            {/* Nav Forward / Finish */}
            {currentSlide < STORY_DATA.length - 1 ? (
              <button 
                onClick={handleNext}
                className="w-14 h-14 md:w-16 md:h-16 shrink-0 flex items-center justify-center rounded-2xl bg-amber-500 border-b-4 border-amber-700 text-white transition-all active:translate-y-1 hover:bg-amber-400"
              >
                <ChevronRight size={32} />
              </button>
            ) : (
              <button 
                onClick={() => onComplete?.()}
                className="px-6 h-14 md:h-16 shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 border-b-4 border-emerald-700 text-white font-black transition-all active:translate-y-1 hover:bg-emerald-400"
              >
                <Star className="fill-white" size={24} /> 
                <span className="hidden md:inline">START LEARNING</span>
              </button>
            )}

         </div>
      </div>

    </div>
  );
}