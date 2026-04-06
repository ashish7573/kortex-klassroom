import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Volume2, CheckCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

// ==========================================
// 1. DATA REGISTRY (K-Varg: क to ङ)
// ==========================================
const HINDI_ASSETS = {
  vyanjan: {
    'क': {
      letterAudio: '/assets/hindi/audio/ka.mp3',
      themeColor: 'text-rose-500', bgLight: 'bg-rose-50', border: 'border-rose-200', btnTheme: 'bg-rose-500 hover:bg-rose-600',
      examples: [
        { word: 'कमल', english: 'Lotus', image: '/assets/hindi/images/kamal.png', emoji: '🪷' },
        { word: 'कलश', english: 'Urn', image: '/assets/hindi/images/kalash.png', emoji: '🏺' },
        { word: 'कछुआ', english: 'Turtle', image: '/assets/hindi/images/kachua.png', emoji: '🐢' },
        { word: 'कटोरी', english: 'Bowl', image: '/assets/hindi/images/katori.png', emoji: '🥣' }
      ]
    },
    'ख': {
      letterAudio: '/assets/hindi/audio/kha.mp3',
      themeColor: 'text-orange-500', bgLight: 'bg-orange-50', border: 'border-orange-200', btnTheme: 'bg-orange-500 hover:bg-orange-600',
      examples: [
        { word: 'खरगोश', english: 'Rabbit', image: '/assets/hindi/images/khargosh.png', emoji: '🐇' },
        { word: 'खाना', english: 'Food', image: '/assets/hindi/images/khana.png', emoji: '🍱' },
        { word: 'खत', english: 'Letter', image: '/assets/hindi/images/khat.png', emoji: '✉️' },
        { word: 'खज़ाना', english: 'Treasure', image: '/assets/hindi/images/khazaana.png', emoji: '🪙' }
      ]
    },
    'ग': {
      letterAudio: '/assets/hindi/audio/ga.mp3',
      themeColor: 'text-amber-500', bgLight: 'bg-amber-50', border: 'border-amber-200', btnTheme: 'bg-amber-500 hover:bg-amber-600',
      examples: [
        { word: 'गाड़ी', english: 'Car', image: '/assets/hindi/images/gaadi.png', emoji: '🚗' },
        { word: 'गधा', english: 'Donkey', image: '/assets/hindi/images/gadha.png', emoji: '🐴' },
        { word: 'गमला', english: 'Flowerpot', image: '/assets/hindi/images/gamla.png', emoji: '🪴' },
        { word: 'गाजर', english: 'Carrot', image: '/assets/hindi/images/gajar.png', emoji: '🥕' }
      ]
    },
    'घ': {
      letterAudio: '/assets/hindi/audio/gha.mp3',
      themeColor: 'text-emerald-500', bgLight: 'bg-emerald-50', border: 'border-emerald-200', btnTheme: 'bg-emerald-500 hover:bg-emerald-600',
      examples: [
        { word: 'घड़ी', english: 'Watch/Clock', image: '/assets/hindi/images/ghadi.png', emoji: '⌚' },
        { word: 'घर', english: 'House', image: '/assets/hindi/images/ghar.png', emoji: '🏠' },
        { word: 'घोड़ा', english: 'Horse', image: '/assets/hindi/images/ghoda.png', emoji: '🐎' },
        { word: 'घास', english: 'Grass', image: '/assets/hindi/images/ghas.png', emoji: '🌿' }
      ]
    },
    'ङ': {
      letterAudio: '/assets/hindi/audio/nga.mp3',
      themeColor: 'text-slate-500', bgLight: 'bg-slate-100', border: 'border-slate-300', btnTheme: 'bg-slate-600 hover:bg-slate-700',
      examples: [] // NO EXAMPLES FOR NGA
    }
  }
};

const VYANJAN_LIST = ['क', 'ख', 'ग', 'घ', 'ङ'];

const getFirstLetter = (word: string) => {
  const match = word.match(/^.[ंँ]?/);
  return match ? match[0] : word.charAt(0);
};

const getRestOfWord = (word: string) => {
  const match = word.match(/^.[ंँ]?/);
  return match ? word.slice(match[0].length) : word.slice(1);
};

// ==========================================
// 2. HELPER COMPONENTS
// ==========================================
const ImageFallback = ({ src, alt, emoji, bgClass }: any) => {
  const [hasError, setHasError] = useState(false);

  const classes = `w-auto h-[30vh] max-h-[220px] aspect-square rounded-[2rem] border-4 border-white shadow-sm flex items-center justify-center ${bgClass}`;

  if (hasError || !src) {
    return (
      <div className={classes}>
        <span className="text-6xl md:text-8xl">{emoji || <ImageIcon className="w-16 h-16 text-slate-300" />}</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      onError={() => setHasError(true)}
      className={`${classes} object-cover bg-white`}
    />
  );
};

// ==========================================
// 3. MAIN COMPONENT 
// ==========================================
export default function Vyanjan1Conceptualiser({ onComplete }: any) {
  const [vyanjanIndex, setVyanjanIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0); 
  const [isCompleted, setIsCompleted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentLetter = VYANJAN_LIST[vyanjanIndex];
  const letterData = HINDI_ASSETS.vyanjan[currentLetter as keyof typeof HINDI_ASSETS.vyanjan];
  
  // DYNAMIC LOGIC: Automatically adapts to how many words are in the array
  const maxSteps = letterData.examples.length;
  const isRevealStep = stepIndex === maxSteps;

  // Dynamic Progress Calculation
  const calculateProgress = () => {
    let currentProgress = 0;
    let totalProgress = 0;
    
    // Calculate total possible steps in the whole component
    VYANJAN_LIST.forEach((letter) => {
        totalProgress += HINDI_ASSETS.vyanjan[letter as keyof typeof HINDI_ASSETS.vyanjan].examples.length + 1;
    });

    // Calculate steps completed so far
    for (let i = 0; i < vyanjanIndex; i++) {
        currentProgress += HINDI_ASSETS.vyanjan[VYANJAN_LIST[i] as keyof typeof HINDI_ASSETS.vyanjan].examples.length + 1;
    }
    currentProgress += (stepIndex + 1);

    return (currentProgress / totalProgress) * 100;
  };

  const playAudio = async () => {
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (error) {
        console.warn("Audio playback blocked or unsupported file format:", error);
      }
    }
  };

  useEffect(() => {
    if (isRevealStep && audioRef.current) {
      const timer = setTimeout(() => {
        playAudio();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isRevealStep, vyanjanIndex]);

  // CRASH-PROOF NAVIGATION
  const handleNext = () => {
    if (stepIndex < maxSteps) {
      // Math.min prevents the index from ever exceeding the array length
      setStepIndex(prev => Math.min(prev + 1, maxSteps));
    } else {
      if (vyanjanIndex < VYANJAN_LIST.length - 1) {
        setVyanjanIndex(prev => prev + 1);
        setStepIndex(0);
      } else {
        setIsCompleted(true);
      }
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      // Math.max prevents the index from ever going below 0
      setStepIndex(prev => Math.max(prev - 1, 0));
    } else {
      if (vyanjanIndex > 0) {
        setVyanjanIndex(prev => prev - 1);
        const prevLetter = VYANJAN_LIST[vyanjanIndex - 1];
        const prevLetterData = HINDI_ASSETS.vyanjan[prevLetter as keyof typeof HINDI_ASSETS.vyanjan];
        setStepIndex(prevLetterData.examples.length);
      }
    }
  };

  // Render Completed State
  if (isCompleted) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center p-4 font-sans rounded-3xl">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 text-center flex flex-col items-center max-w-lg w-full animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">बहुत बढ़िया!</h1>
          <p className="text-lg text-slate-500 font-bold mb-8">आपने 'क' से 'ङ' तक के व्यंजन सीख लिए हैं!</p>
          <button 
            onClick={onComplete || (() => { setVyanjanIndex(0); setStepIndex(0); setIsCompleted(false); })}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black text-lg md:text-xl rounded-2xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all"
          >
            {onComplete ? 'अगला पाठ (Next Lesson)' : 'फिर से सीखें'}
          </button>
        </div>
      </div>
    );
  }

  // Render Main Learning Flow
  return (
    <div className="h-full w-full bg-white flex flex-col font-sans overflow-hidden rounded-3xl">
      
      <audio ref={audioRef} src={letterData.letterAudio} preload="auto" />

      {/* Header / Progress Bar */}
      <div className="shrink-0 pt-6 pb-4 px-6 md:px-8 border-b border-slate-100 z-10 bg-white">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">
            व्यंजन सीखें (क-वर्ग)
          </span>
          <span className="text-xs md:text-sm font-bold text-slate-700">
            {vyanjanIndex + 1} / {VYANJAN_LIST.length}
          </span>
        </div>
        <div className="w-full h-2 md:h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${letterData.btnTheme.split(' ')[0]} transition-all duration-700 ease-out`}
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className={`flex-1 min-h-0 flex flex-col items-center justify-center p-4 md:p-6 ${letterData.bgLight} transition-colors duration-500`}>
        
        <div 
          key={`${vyanjanIndex}-${stepIndex}`} 
          className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 w-full h-full justify-center"
        >
          
          {/* DYNAMIC STEPS: Safely checks if the example exists before rendering */}
          {!isRevealStep && letterData.examples[stepIndex] && (
            <>
              <ImageFallback 
                src={letterData.examples[stepIndex].image} 
                alt={letterData.examples[stepIndex].english}
                emoji={letterData.examples[stepIndex].emoji}
                bgClass={letterData.bgLight}
              />
              
              <div className="mt-4 md:mt-8 mb-2 flex items-baseline justify-center">
                <span className={`${letterData.themeColor} text-5xl md:text-7xl font-black drop-shadow-sm`}>
                  {getFirstLetter(letterData.examples[stepIndex].word)}
                </span>
                <span className="text-4xl md:text-6xl text-slate-700 font-black">
                  {getRestOfWord(letterData.examples[stepIndex].word)}
                </span>
              </div>
              
              <p className="text-lg md:text-xl text-slate-500 font-bold uppercase tracking-widest">
                {letterData.examples[stepIndex].english}
              </p>
            </>
          )}

          {/* FINAL STEP: The Reveal */}
          {isRevealStep && (
            <div className="flex flex-col items-center w-full h-full justify-center">
              {maxSteps > 0 && (
                <div className="mb-4 md:mb-6 px-6 py-2 bg-white/60 rounded-full shadow-sm">
                  <p className="text-sm md:text-lg text-slate-600 font-bold">
                    ये सभी शब्द इस ध्वनि से शुरू होते हैं...
                  </p>
                </div>
              )}
              
              <div className={`w-auto h-[35vh] max-h-[250px] aspect-square flex items-center justify-center bg-white rounded-full border-8 ${letterData.border} shadow-lg mb-6 scale-105`}>
                <span className={`text-[6rem] md:text-[8rem] font-black ${letterData.themeColor} leading-none mb-4 md:mb-6`}>
                  {currentLetter}
                </span>
              </div>

              <button 
                onClick={playAudio}
                className="flex items-center gap-3 px-5 md:px-6 py-2 md:py-3 bg-white border-2 border-slate-200 border-b-4 rounded-2xl active:border-b-2 active:translate-y-[2px] transition-all hover:bg-slate-50 group"
              >
                <div className={`p-2 rounded-full ${letterData.bgLight} group-hover:scale-110 transition-transform`}>
                  <Volume2 className={`w-5 h-5 md:w-6 md:h-6 ${letterData.themeColor}`} />
                </div>
                <span className="text-base md:text-lg font-bold text-slate-700">आवाज़ फिर से सुनें</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="shrink-0 py-4 px-4 md:px-8 bg-white border-t border-slate-100 flex items-center justify-between z-10">
        
        <button 
          onClick={handlePrev}
          disabled={vyanjanIndex === 0 && stepIndex === 0}
          className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white border-2 border-slate-200 border-b-4 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed active:border-b-2 active:translate-y-[2px] transition-all hover:bg-slate-50 text-slate-600"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" strokeWidth={3} />
        </button>

        {/* Stepper Dots (Dynamically maps based on how many words there are) */}
        {maxSteps > 0 && (
          <div className="hidden sm:flex gap-2">
            {Array.from({ length: maxSteps }).map((_, dotIndex) => (
              <div 
                key={dotIndex}
                className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                  stepIndex === dotIndex 
                    ? `${letterData.btnTheme.split(' ')[0]} scale-125` 
                    : stepIndex > dotIndex 
                      ? `${letterData.btnTheme.split(' ')[0]} opacity-40` 
                      : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        )}

        <button 
          onClick={handleNext}
          className={`w-auto min-w-[4rem] md:min-w-[5rem] px-5 md:px-8 h-14 md:h-16 flex items-center justify-center gap-2 border-b-4 rounded-2xl active:border-b-0 active:translate-y-[4px] transition-all text-white shadow-sm ${letterData.btnTheme} border-black/20`}
          aria-label="Next"
        >
          <span className="text-lg md:text-xl font-black tracking-wide">
            {isRevealStep && vyanjanIndex === VYANJAN_LIST.length - 1 ? 'पूरा करें' : 'आगे'}
          </span>
          {isRevealStep && vyanjanIndex === VYANJAN_LIST.length - 1 ? (
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 ml-1" strokeWidth={3} />
          ) : (
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-1" strokeWidth={3} />
          )}
        </button>

      </div>
    </div>
  );
}