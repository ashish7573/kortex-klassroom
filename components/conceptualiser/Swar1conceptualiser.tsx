import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Volume2, CheckCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

// ==========================================
// 1. DATA REGISTRY 
// ==========================================
const HINDI_ASSETS = {
  swar: {
    'अ': {
      letterAudio: '/assets/hindi/audio/a.mp3', // Standardized to .mp3 to prevent browser crash
      themeColor: 'text-rose-500', bgLight: 'bg-rose-50', border: 'border-rose-200', btnTheme: 'bg-rose-500 hover:bg-rose-600',
      examples: [
        { word: 'अनार', english: 'Pomegranate', image: '/assets/hindi/images/anar.png', emoji: '🍎' },
        { word: 'अदरक', english: 'Ginger', image: '/assets/hindi/images/adrak.png', emoji: '🫚' },
        { word: 'अनाज', english: 'Grain', image: '/assets/hindi/images/anaaj.png', emoji: '🌾' },
        { word: 'अचार', english: 'Pickle', image: '/assets/hindi/images/achaar.png', emoji: '🥒' }
      ]
    },
    'आ': {
      letterAudio: '/assets/hindi/audio/aa.mp3',
      themeColor: 'text-orange-500', bgLight: 'bg-orange-50', border: 'border-orange-200', btnTheme: 'bg-orange-500 hover:bg-orange-600',
      examples: [
        { word: 'आम', english: 'Mango', image: '/assets/hindi/images/aam.png', emoji: '🥭' },
        { word: 'आठ', english: 'Eight', image: '/assets/hindi/images/aath.png', emoji: '8️⃣' },
        { word: 'आग', english: 'Fire', image: '/assets/hindi/images/aag.png', emoji: '🔥' },
        { word: 'आलू', english: 'Potato', image: '/assets/hindi/images/aaloo.png', emoji: '🥔' }
      ]
    },
    'इ': {
      letterAudio: '/assets/hindi/audio/i.mp3',
      themeColor: 'text-amber-500', bgLight: 'bg-amber-50', border: 'border-amber-200', btnTheme: 'bg-amber-500 hover:bg-amber-600',
      examples: [
        { word: 'इंद्रधनुष', english: 'Rainbow', image: '/assets/hindi/images/indradhanush.png', emoji: '🌈' },
        { word: 'इंसान', english: 'Human', image: '/assets/hindi/images/insaan.png', emoji: '🧑' },
        { word: 'इंजन', english: 'Engine', image: '/assets/hindi/images/engine.png', emoji: '🚂' },
        { word: 'इमली', english: 'Tamarind', image: '/assets/hindi/images/imli.png', emoji: '🫘' }
      ]
    },
    'ई': {
      letterAudio: '/assets/hindi/audio/ee.mp3',
      themeColor: 'text-emerald-500', bgLight: 'bg-emerald-50', border: 'border-emerald-200', btnTheme: 'bg-emerald-500 hover:bg-emerald-600',
      examples: [
        { word: 'ईख', english: 'Sugarcane', image: '/assets/hindi/images/eenkh.png', emoji: '🎋' },
        { word: 'ईंट', english: 'Brick', image: '/assets/hindi/images/eent.png', emoji: '🧱' },
        { word: 'ईंधन', english: 'Fuel', image: '/assets/hindi/images/eendhan.png', emoji: '⛽' },
        { word: 'ईमानदार', english: 'Honest', image: '/assets/hindi/images/eemaandaar.png', emoji: '😇' }
      ]
    },
    'उ': {
      letterAudio: '/assets/hindi/audio/u.mp3',
      themeColor: 'text-sky-500', bgLight: 'bg-sky-50', border: 'border-sky-200', btnTheme: 'bg-sky-500 hover:bg-sky-600',
      examples: [
        { word: 'उपहार', english: 'Gift', image: '/assets/hindi/images/uphaar.png', emoji: '🎁' },
        { word: 'उल्लू', english: 'Owl', image: '/assets/hindi/images/ullu.png', emoji: '🦉' },
        { word: 'उल्टा', english: 'Upside Down', image: '/assets/hindi/images/ulta.png', emoji: '🙃' },
        { word: 'उत्सव', english: 'Festival', image: '/assets/hindi/images/utsav.png', emoji: '🎉' }
      ]
    },
    'ऊ': {
      letterAudio: '/assets/hindi/audio/oo.mp3',
      themeColor: 'text-indigo-500', bgLight: 'bg-indigo-50', border: 'border-indigo-200', btnTheme: 'bg-indigo-500 hover:bg-indigo-600',
      examples: [
        { word: 'ऊंचा', english: 'High', image: '/assets/hindi/images/ooncha.png', emoji: '🏔️' },
        { word: 'ऊंट', english: 'Camel', image: '/assets/hindi/images/oont.png', emoji: '🐫' },
        { word: 'ऊन', english: 'Wool', image: '/assets/hindi/images/oon.png', emoji: '🧶' },
        { word: 'ऊपर', english: 'Up', image: '/assets/hindi/images/oopar.png', emoji: '⬆️' }
      ]
    }
  }
};

const SWAR_LIST = ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ'];

const getFirstLetter = (word) => {
  const match = word.match(/^.[ंँ]?/);
  return match ? match[0] : word.charAt(0);
};

const getRestOfWord = (word) => {
  const match = word.match(/^.[ंँ]?/);
  return match ? word.slice(match[0].length) : word.slice(1);
};

// ==========================================
// 2. HELPER COMPONENTS
// ==========================================
const ImageFallback = ({ src, alt, emoji, bgClass }) => {
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
export default function SwarConceptualiser({ onComplete }: any) {
  const [swarIndex, setSwarIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0); 
  const [isCompleted, setIsCompleted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentLetter = SWAR_LIST[swarIndex];
  const letterData = HINDI_ASSETS.swar[currentLetter as keyof typeof HINDI_ASSETS.swar];
  const isRevealStep = stepIndex === 4;

  const totalSwars = SWAR_LIST.length;
  const progressPercentage = ((swarIndex * 5 + stepIndex) / (totalSwars * 5)) * 100;

  // SAFE AUDIO PLAYBACK: Handles missing files and strict browsers gracefully
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
    if (stepIndex < 4) {
      setStepIndex(prev => prev + 1);
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
      setStepIndex(prev => prev - 1);
    } else {
      if (swarIndex > 0) {
        setSwarIndex(prev => prev - 1);
        setStepIndex(4);
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
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">बहुत बढ़िया!</h1>
          <p className="text-lg text-slate-500 font-bold mb-8">आपने 'अ' से 'ऊ' तक के स्वर सीख लिए हैं!</p>
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
            स्वर सीखें
          </span>
          <span className="text-xs md:text-sm font-bold text-slate-700">
            {swarIndex + 1} / {totalSwars}
          </span>
        </div>
        <div className="w-full h-2 md:h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${letterData.btnTheme.split(' ')[0]} transition-all duration-700 ease-out`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className={`flex-1 min-h-0 flex flex-col items-center justify-center p-4 md:p-6 ${letterData.bgLight} transition-colors duration-500`}>
        
        <div 
          key={`${swarIndex}-${stepIndex}`} 
          className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 w-full h-full justify-center"
        >
          
          {/* STEPS 1-4: Examples */}
          {!isRevealStep && (
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
              <div className="mb-4 md:mb-6 px-6 py-2 bg-white/60 rounded-full shadow-sm">
                <p className="text-sm md:text-lg text-slate-600 font-bold">
                  ये सभी शब्द इस ध्वनि से शुरू होते हैं...
                </p>
              </div>
              
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

        {/* Stepper Dots */}
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