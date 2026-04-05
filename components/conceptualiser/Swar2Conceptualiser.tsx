import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Volume2, CheckCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

// ==========================================
// 1. DATA REGISTRY (Part 2: ऋ to अः)
// ==========================================
const HINDI_ASSETS = {
  swar: {
    'ऋ': {
      letterAudio: '/assets/hindi/audio/ri.mp3',
      themeColor: 'text-teal-500', bgLight: 'bg-teal-50', border: 'border-teal-200', btnTheme: 'bg-teal-500 hover:bg-teal-600',
      examples: [
        { word: 'ऋषि', english: 'Sage', image: '/assets/hindi/images/rishi.png', emoji: '🧘‍♂️' },
        { word: 'ऋतु', english: 'Season', image: '/assets/hindi/images/ritu.png', emoji: '🌦️' },
        
      ]
    },
    'ए': {
      letterAudio: '/assets/hindi/audio/e.mp3',
      themeColor: 'text-blue-500', bgLight: 'bg-blue-50', border: 'border-blue-200', btnTheme: 'bg-blue-500 hover:bg-blue-600',
      examples: [
        { word: 'एड़ी', english: 'Heel', image: '/assets/hindi/images/edi.png', emoji: '🦶' },
        { word: 'एक', english: 'One', image: '/assets/hindi/images/ek.png', emoji: '1️⃣' },
        { word: 'एकतारा', english: 'Ektara', image: '/assets/hindi/images/ektara.png', emoji: '🪕' },
        { word: 'एकता', english: 'Unity', image: '/assets/hindi/images/ekta.png', emoji: '🤝' }
      ]
    },
    'ऐ': {
      letterAudio: '/assets/hindi/audio/ai.mp3',
      themeColor: 'text-violet-500', bgLight: 'bg-violet-50', border: 'border-violet-200', btnTheme: 'bg-violet-500 hover:bg-violet-600',
      examples: [
        { word: 'ऐनक', english: 'Spectacles', image: '/assets/hindi/images/ainak.png', emoji: '👓' },
        { word: 'ऐसिड', english: 'Acid', image: '/assets/hindi/images/acid.png', emoji: '🧪' },
        { word: 'ऐतिहासिक', english: 'Historical', image: '/assets/hindi/images/aitihasik.png', emoji: '🏛️' },
        { word: 'ऐटम', english: 'Atom', image: '/assets/hindi/images/atom.png', emoji: '⚛️' }
      ]
    },
    'ओ': {
      letterAudio: '/assets/hindi/audio/o.mp3',
      themeColor: 'text-fuchsia-500', bgLight: 'bg-fuchsia-50', border: 'border-fuchsia-200', btnTheme: 'bg-fuchsia-500 hover:bg-fuchsia-600',
      examples: [
        { word: 'ओखली', english: 'Mortar', image: '/assets/hindi/images/okhali.png', emoji: '🥣' },
        { word: 'ओस', english: 'Dew', image: '/assets/hindi/images/os.png', emoji: '💧' },
        { word: 'ओम', english: 'Om', image: '/assets/hindi/images/om.png', emoji: '🕉️' },
        { word: 'ओढ़नी', english: 'Scarf/Dupatta', image: '/assets/hindi/images/odhani.png', emoji: '🧣' }
      ]
    },
    'औ': {
      letterAudio: '/assets/hindi/audio/au.mp3',
      themeColor: 'text-pink-500', bgLight: 'bg-pink-50', border: 'border-pink-200', btnTheme: 'bg-pink-500 hover:bg-pink-600',
      examples: [
        { word: 'औजार', english: 'Tools', image: '/assets/hindi/images/aujar.png', emoji: '🛠️' },
        { word: 'औरत', english: 'Woman', image: '/assets/hindi/images/aurat.png', emoji: '👩' },
        { word: 'औद्योगिक', english: 'Industrial', image: '/assets/hindi/images/audyogik.png', emoji: '🏭' },
        { word: 'औषधि', english: 'Medicine', image: '/assets/hindi/images/aushadhi.png', emoji: '💊' }
      ]
    },
    'अं': {
      letterAudio: '/assets/hindi/audio/ang.mp3',
      themeColor: 'text-purple-500', bgLight: 'bg-purple-50', border: 'border-purple-200', btnTheme: 'bg-purple-500 hover:bg-purple-600',
      examples: [
        { word: 'अंग', english: 'Body Part', image: '/assets/hindi/images/ang.png', emoji: '🦾' },
        { word: 'अंगूर', english: 'Grapes', image: '/assets/hindi/images/angoor.png', emoji: '🍇' },
        { word: 'अंकुर', english: 'Sprout', image: '/assets/hindi/images/ankur.png', emoji: '🌱' },
        { word: 'अंक', english: 'Number', image: '/assets/hindi/images/ank.png', emoji: '🔢' }
      ]
    },
    'अः': {
      letterAudio: '/assets/hindi/audio/aha.mp3',
      themeColor: 'text-slate-500', bgLight: 'bg-slate-100', border: 'border-slate-300', btnTheme: 'bg-slate-600 hover:bg-slate-700',
      examples: [] // NO EXAMPLES FOR AHA
    }
  }
};

const SWAR_LIST = ['ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'];

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
export default function Swar2Conceptualiser({ onComplete }: any) {
  const [swarIndex, setSwarIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0); 
  const [isCompleted, setIsCompleted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentLetter = SWAR_LIST[swarIndex];
  const letterData = HINDI_ASSETS.swar[currentLetter as keyof typeof HINDI_ASSETS.swar];
  
  // LOGIC TWEAK: 'अः' automatically forces the reveal step since it has no words
  const isAha = currentLetter === 'अः';
  const isRevealStep = isAha ? true : stepIndex === 4;

  // Dynamic Progress Calculation (Accounts for Aha's missing steps)
  const calculateProgress = () => {
    let currentProgress = 0;
    for (let i = 0; i < swarIndex; i++) {
        currentProgress += SWAR_LIST[i] === 'अः' ? 1 : 5;
    }
    currentProgress += (stepIndex + 1);
    const totalProgress = ((SWAR_LIST.length - 1) * 5) + 1; // 6 swars have 5 steps, 1 has 1 step
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
  }, [isRevealStep, swarIndex]);

  const handleNext = () => {
    const maxSteps = isAha ? 0 : 4;
    if (stepIndex < maxSteps) {
      // FIX: Math.min forces it to NEVER go above 4, even on rapid double-clicks
      setStepIndex(prev => Math.min(prev + 1, maxSteps));
    } else {
      if (swarIndex < SWAR_LIST.length - 1) {
        setSwarIndex(prev => prev + 1);
        setStepIndex(0);
      } else {
        setIsCompleted(true);
      }
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      // FIX: Math.max prevents it from ever going below 0
      setStepIndex(prev => Math.max(prev - 1, 0));
    } else {
      if (swarIndex > 0) {
        setSwarIndex(prev => prev - 1);
        const prevLetter = SWAR_LIST[swarIndex - 1];
        setStepIndex(prevLetter === 'अः' ? 0 : 4);
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
          <p className="text-lg text-slate-500 font-bold mb-8">आपने 'ऋ' से 'अः' तक के स्वर सीख लिए हैं!</p>
          <button 
            onClick={onComplete || (() => { setSwarIndex(0); setStepIndex(0); setIsCompleted(false); })}
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
            स्वर सीखें (भाग 2)
          </span>
          <span className="text-xs md:text-sm font-bold text-slate-700">
            {swarIndex + 1} / {SWAR_LIST.length}
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
          key={`${swarIndex}-${stepIndex}`} 
          className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 w-full h-full justify-center"
        >
          
          {/* STEPS 1-4: Examples (Hidden for AHA) */}
          {/* FIX: Added safe-check so it never tries to render an undefined index */}
          {!isRevealStep && !isAha && letterData.examples[stepIndex] && (
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

          {/* STEP 5: The Reveal */}
          {isRevealStep && (
            <div className="flex flex-col items-center w-full h-full justify-center">
              {!isAha && (
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
          disabled={swarIndex === 0 && stepIndex === 0}
          className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white border-2 border-slate-200 border-b-4 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed active:border-b-2 active:translate-y-[2px] transition-all hover:bg-slate-50 text-slate-600"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" strokeWidth={3} />
        </button>

        {/* Stepper Dots (Hidden for 'अः') */}
        {!isAha && (
          <div className="hidden sm:flex gap-2">
            {[0, 1, 2, 3, 4].map((dotIndex) => (
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
            {isRevealStep && swarIndex === SWAR_LIST.length - 1 ? 'पूरा करें' : 'आगे'}
          </span>
          {isRevealStep && swarIndex === SWAR_LIST.length - 1 ? (
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 ml-1" strokeWidth={3} />
          ) : (
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-1" strokeWidth={3} />
          )}
        </button>

      </div>
    </div>
  );
}