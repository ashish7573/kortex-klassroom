import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Volume2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { HINDI_ASSETS, SUBTOPIC_MAP } from '@/lib/SwarVyanjanDictionary';

// ==========================================
// HELPER: Image Fallback
// ==========================================
const ImageFallback = ({ src, alt, emoji, bgClass }: any) => {
  const [hasError, setHasError] = useState(false);
  const classes = `w-auto h-[25vh] md:h-[30vh] max-h-[220px] aspect-square rounded-[2rem] border-4 border-white shadow-sm flex items-center justify-center ${bgClass}`;

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
// MAIN COMPONENT: SwarVyanjan Conceptualiser
// ==========================================
export default function SwarVyanjanConceptualiser({ subtopicId, onComplete }: { subtopicId: string, onComplete: () => void }) {
  // 1. DATA INITIALIZATION
  const letterList = SUBTOPIC_MAP[subtopicId] || [];
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0); 
  const [isCompleted, setIsCompleted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentChar = letterList[currentLetterIndex];
  const letterData = HINDI_ASSETS[currentChar];

  if (!letterList.length || !letterData) {
    return <div className="p-10 text-center font-bold text-rose-500">Error: Subtopic Data Not Found ({subtopicId})</div>;
  }

  const maxExamples = letterData.examples?.length || 0;
  const isRevealStep = stepIndex === maxExamples;

  // 2. PROGRESS CALCULATION
  const calculateProgress = () => {
    let totalSteps = 0;
    let completedSteps = 0;

    letterList.forEach((char: string, idx: number) => {
      const stepsForThisLetter = (HINDI_ASSETS[char]?.examples?.length || 0) + 1;
      totalSteps += stepsForThisLetter;
      if (idx < currentLetterIndex) {
        completedSteps += stepsForThisLetter;
      }
    });
    completedSteps += (stepIndex + 1);
    return (completedSteps / totalSteps) * 100;
  };

  // 3. AUDIO LOGIC
  const playAudio = async () => {
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (e) { console.warn("Audio blocked"); }
    }
  };

  useEffect(() => {
    if (isRevealStep) {
      const timer = setTimeout(() => playAudio(), 300);
      return () => clearTimeout(timer);
    }
  }, [isRevealStep, currentLetterIndex]);

  // 4. NAVIGATION LOGIC
  const handleNext = () => {
    if (stepIndex < maxExamples) {
      setStepIndex(prev => prev + 1);
    } else {
      if (currentLetterIndex < letterList.length - 1) {
        setCurrentLetterIndex(prev => prev + 1);
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
      if (currentLetterIndex > 0) {
        const prevIdx = currentLetterIndex - 1;
        const prevLetter = letterList[prevIdx];
        setCurrentLetterIndex(prevIdx);
        setStepIndex(HINDI_ASSETS[prevLetter].examples.length);
      }
    }
  };

  // 5. WORD SPLITTING HELPERS (FIXED FOR MATRAS & HALF-LETTERS)
  // This Devanagari Regex groups Base Consonants + Halants + Vowel Matras perfectly.
  const getFirstPart = (word: string) => {
    if (!word) return "";
    const match = word.match(/^.(?:्.)*[ा-ौृॄंँः]*/);
    return match ? match[0] : word.charAt(0);
  };
  
  const getRestPart = (word: string) => {
    if (!word) return "";
    const match = word.match(/^.(?:्.)*[ा-ौृॄंँः]*/);
    return match ? word.slice(match[0].length) : word.slice(1);
  };

  // --- RENDER: COMPLETED STATE ---
  if (isCompleted) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center p-4 rounded-3xl border-2 border-slate-100">
        <div className="text-center animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Sparkles className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-2">शानदार!</h1>
          <p className="text-slate-500 font-bold mb-8">आपने यह भाग पूरा कर लिया है।</p>
          <button 
            onClick={onComplete}
            className="px-12 py-4 bg-green-500 text-white font-black text-xl rounded-2xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all"
          >
            अगला पाठ (Next)
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: LESSON STATE ---
  return (
    <div className="h-full w-full bg-white flex flex-col font-sans overflow-hidden rounded-3xl border-2 border-slate-100">
      <audio ref={audioRef} src={letterData.audio} preload="auto" />

      {/* Progress Header */}
      <div className="shrink-0 pt-4 md:pt-6 pb-3 md:pb-4 px-6 md:px-8 bg-white border-b border-slate-100">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">नया ज्ञान (Conceptualiser)</span>
          <span className="text-sm font-black text-slate-700">{currentLetterIndex + 1} / {letterList.length}</span>
        </div>
        <div className="w-full h-2 md:h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${letterData.btn.split(' ')[0]} transition-all duration-700 ease-out`}
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 min-h-0 flex flex-col items-center justify-center p-4 md:p-6 ${letterData.bg} transition-colors duration-500`}>
        <div key={`${currentLetterIndex}-${stepIndex}`} className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 w-full h-full justify-center">
          
          {!isRevealStep ? (
            // IMAGE / WORD SLIDE
            <>
              <ImageFallback 
                src={letterData.examples[stepIndex]?.image} 
                alt={letterData.examples[stepIndex]?.english}
                emoji={letterData.examples[stepIndex]?.emoji}
                bgClass={letterData.bg}
              />
              <div className="mt-6 md:mt-8 flex items-baseline justify-center">
                {/* Notice the fixed Matra Splitting in action here */}
                <span className={`${letterData.theme} text-6xl md:text-7xl font-black drop-shadow-sm`}>
                  {getFirstPart(letterData.examples[stepIndex]?.word)}
                </span>
                <span className="text-5xl md:text-6xl text-slate-700 font-black">
                  {getRestPart(letterData.examples[stepIndex]?.word)}
                </span>
              </div>
              <p className="text-lg md:text-xl text-slate-500 font-bold uppercase tracking-widest mt-2">
                {letterData.examples[stepIndex]?.english}
              </p>
            </>
          ) : (
            // REVEAL SOUND SLIDE (Fixed Sizing to prevent layout shifts)
            <div className="flex flex-col items-center justify-center h-full max-h-full">
              <div className="mb-4 md:mb-6 px-6 py-2 bg-white/60 rounded-full shadow-sm text-slate-600 font-bold text-sm md:text-base">
                ध्वनि पहचानें...
              </div>
              <div className={`w-48 h-48 md:w-56 md:h-56 flex items-center justify-center bg-white rounded-full border-8 ${letterData.border} shadow-xl mb-6 md:mb-8`}>
                <span className={`text-[7rem] md:text-[9rem] font-black ${letterData.theme} leading-none`}>
                  {currentChar}
                </span>
              </div>
              <button 
                onClick={playAudio}
                className="flex items-center gap-3 md:gap-4 px-6 md:px-8 py-3 md:py-4 bg-white border-2 border-slate-200 border-b-4 rounded-2xl active:border-b-2 active:translate-y-[2px] transition-all hover:bg-slate-50"
              >
                <Volume2 className={`w-6 h-6 md:w-8 md:h-8 ${letterData.theme}`} />
                <span className="text-lg md:text-xl font-black text-slate-700">आवाज़ सुनें</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="shrink-0 py-4 md:py-6 px-6 md:px-8 bg-white border-t border-slate-100 flex items-center justify-between">
        <button 
          onClick={handlePrev}
          disabled={currentLetterIndex === 0 && stepIndex === 0}
          className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white border-2 border-slate-200 border-b-4 rounded-2xl disabled:opacity-40 active:border-b-2 active:translate-y-[2px] transition-all hover:bg-slate-50"
        >
          <ArrowLeft size={28} className="text-slate-600" />
        </button>

        <div className="hidden md:flex gap-2">
          {Array.from({ length: maxExamples + 1 }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${stepIndex === i ? `${letterData.btn.split(' ')[0]} scale-125` : 'bg-slate-200'}`} />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className={`px-8 md:px-10 h-14 md:h-16 flex items-center gap-2 text-white font-black text-lg md:text-xl rounded-2xl border-b-4 border-black/20 active:border-b-0 active:translate-y-[4px] transition-all ${letterData.btn}`}
        >
          {isRevealStep && currentLetterIndex === letterList.length - 1 ? 'पूरा करें' : 'आगे'}
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}