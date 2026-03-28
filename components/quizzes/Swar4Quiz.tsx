import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, CheckCircle, Star, Trophy, ArrowRight, Check, Volume2 } from 'lucide-react';

/**
 * KORTEX KLASSROOM: श्रुतलेख (अ से ऊ)
 * A highly interactive dictation quiz for KG students.
 */

const VOWELS = [
  { char: 'अ', name: 'Anar' },
  { char: 'आ', name: 'Aam' },
  { char: 'इ', name: 'Imli' },
  { char: 'ई', name: 'Eekh' },
  { char: 'उ', name: 'Ullu' },
  { char: 'ऊ', name: 'Oon' }
];

export default function DictationQuiz({ onComplete }: { onComplete?: (data: any) => void }) {
  // NEW: 3-State Architecture
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'completed'
  
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0); // 0: Listen, 1: Reveal
  const [playingIndex, setPlayingIndex] = useState(null);
  const [completedAudio, setCompletedAudio] = useState([]);

  // Initialize and randomize letters
  useEffect(() => {
    const shuffled = [...VOWELS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setQuestions(shuffled);
  }, []);

  // Speech Synthesis Function
  const speakLetter = (letter: string, index: number) => {
    if (playingIndex !== null) return;

    setPlayingIndex(index);
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.lang = 'hi-IN'; // Hindi
    utterance.rate = 0.7; // Slower for KG students

    let count = 0;
    const playLoop = () => {
      window.speechSynthesis.speak(utterance);
      count++;
      
      utterance.onend = () => {
        if (count < 3) {
          setTimeout(playLoop, 2000); // 2 second gap between repeats
        } else {
          setPlayingIndex(null);
          if (!completedAudio.includes(index)) {
            setCompletedAudio((prev) => [...prev, index]);
          }
        }
      };
    };

    playLoop();
  };

  const handleFinishQuiz = () => {
    setGameState('completed'); // Move to the final results screen
  };

  const handleSaveAndComplete = () => {
    const finalData = {
      score: 100, // Participation based for KG
      stars: 3,
      letters: questions.map(q => q.char)
    };
    if (onComplete) {
      onComplete(finalData);
    } else {
      console.log("Quiz Complete! Data:", finalData);
    }
  };

  const resetQuiz = () => {
    const shuffled = [...VOWELS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setQuestions(shuffled);
    setCurrentStep(0);
    setCompletedAudio([]);
    setPlayingIndex(null);
    setGameState('playing');
  };

  // --- STATE 1: START SCREEN ---
  if (gameState === 'start') {
    return (
      <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="bg-sky-100 w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-inner">
          <Volume2 className="text-sky-500 w-12 h-12 md:w-16 md:h-16" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4">हिन्दी श्रुतलेख (Dictation)</h2>
        <p className="text-base md:text-xl font-bold text-slate-500 mb-8 max-w-lg">
          Listen carefully to the audio and write down the letter you hear. Are you ready?
        </p>
        <button
          onClick={() => setGameState('playing')}
          className="w-full md:w-auto bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-xl md:text-2xl py-4 px-12 rounded-2xl shadow-lg shadow-sky-200 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Play className="fill-white w-6 h-6" /> Start Dictation
        </button>
      </div>
    );
  }

  // --- STATE 3: RESULTS SCREEN ---
  if (gameState === 'completed') {
    return (
      <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-6 md:p-12 flex flex-col items-center justify-center text-center overflow-y-auto">
        <div className="bg-sky-50 p-6 rounded-full mb-6 border-4 border-sky-100">
          <Trophy className="w-16 h-16 md:w-20 md:h-20 text-sky-500" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">बहुत अच्छे! (Excellent!)</h2>
        <p className="text-lg md:text-xl font-bold text-slate-500 mb-8">
          You completed your Shrutlek session.
        </p>

        <div className="flex justify-center gap-2 md:gap-4 mb-10">
          {[1, 2, 3].map((s) => (
            <Star 
              key={s} 
              className="w-12 h-12 md:w-16 md:h-16 fill-yellow-400 text-yellow-400 animate-bounce drop-shadow-md" 
              style={{ animationDelay: `${s * 0.15}s` }} 
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button
            onClick={resetQuiz}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg md:text-xl py-4 px-8 rounded-xl md:rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-6 h-6" /><span>Play Again</span>
          </button>
          <button
            onClick={handleSaveAndComplete}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg md:text-xl py-4 px-8 rounded-xl md:rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2"
          >
            <span>Finish & Save</span><Check className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  // --- STATE 2: ACTIVE QUIZ SCREEN ---
  return (
    <div className="w-full h-full max-w-4xl mx-auto bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
      
      {/* MINIMALIST HEADER & PROGRESS */}
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 md:pb-4 flex-shrink-0 bg-white border-b-2 border-slate-100">
        <div className="flex justify-between items-center mb-2 md:mb-3">
          <span className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-wider">हिन्दी श्रुतलेख (अ - ऊ)</span>
          <span className="text-xs md:text-sm font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100 shrink-0">
            Step {currentStep + 1} / 2
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 md:h-3 rounded-full overflow-hidden">
          <div 
            className="bg-sky-500 h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: currentStep === 0 ? '50%' : '100%' }}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 md:px-8 py-2 md:py-6 flex flex-col justify-center overflow-y-auto">
        {currentStep === 0 ? (
          <div className="space-y-3 md:space-y-6 flex flex-col h-full justify-center">
            <div className="text-center mb-2 md:mb-6 flex-shrink-0">
              <h3 className="text-lg md:text-2xl font-black text-slate-700">Listen carefully & write</h3>
              <p className="text-xs md:text-sm text-slate-500 font-bold mt-1">Click play. Each letter repeats 3 times.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-6">
              {questions.map((q, idx) => (
                <div 
                  key={idx}
                  className={`relative h-24 md:h-40 lg:h-48 rounded-xl md:rounded-2xl border-2 md:border-4 transition-all flex flex-col items-center justify-center gap-1 md:gap-4
                    ${playingIndex === idx ? 'border-sky-400 bg-sky-50 shadow-md scale-105' : 'border-slate-200 bg-white hover:border-sky-200'}
                    ${completedAudio.includes(idx) ? 'border-lime-400 bg-lime-50' : ''}
                  `}
                >
                  <span className="absolute top-2 left-3 font-black text-slate-300 text-sm md:text-xl">{idx + 1}</span>
                  
                  {playingIndex === idx ? (
                    <div className="flex gap-1 md:gap-2 h-8 md:h-16 items-center justify-center">
                      <div className="w-1.5 md:w-2 h-4 md:h-8 bg-sky-500 animate-pulse rounded-full" />
                      <div className="w-1.5 md:w-2 h-8 md:h-12 bg-sky-500 animate-pulse delay-75 rounded-full" />
                      <div className="w-1.5 md:w-2 h-4 md:h-8 bg-sky-500 animate-pulse delay-150 rounded-full" />
                    </div>
                  ) : (
                    <button
                      onClick={() => speakLetter(q.char, idx)}
                      disabled={playingIndex !== null}
                      className={`p-2 md:p-5 rounded-full transition-all transform hover:scale-110 shadow-sm md:shadow-lg
                        ${completedAudio.includes(idx) ? 'bg-lime-500 text-white' : 'bg-sky-500 text-white hover:bg-sky-400'}
                        ${playingIndex !== null && playingIndex !== idx ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {completedAudio.includes(idx) ? <CheckCircle className="w-6 h-6 md:w-10 md:h-10" strokeWidth={3} /> : <Play className="w-6 h-6 md:w-10 md:h-10" fill="currentColor" />}
                    </button>
                  )}
                  
                  <p className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest mt-1 md:mt-0">
                    {playingIndex === idx ? 'Listening...' : completedAudio.includes(idx) ? 'Done' : 'Play'}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 md:mt-8 pt-2 flex justify-center flex-shrink-0">
              <button
                disabled={completedAudio.length < 5}
                onClick={() => setCurrentStep(1)}
                className={`flex items-center justify-center gap-2 md:gap-3 w-full md:w-auto px-6 py-3 md:px-10 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-xl transition-all shadow-md md:shadow-xl
                  ${completedAudio.length < 5
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-purple-600 text-white hover:bg-purple-500 hover:-translate-y-1 hover:shadow-2xl'}
                `}
              >
                REVEAL ANSWERS <ArrowRight strokeWidth={3} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-10 animate-in fade-in zoom-in duration-500 flex flex-col h-full justify-center">
            <div className="text-center flex-shrink-0">
              <h3 className="text-xl md:text-3xl font-black text-slate-800">Match your answers!</h3>
              <p className="text-slate-500 font-bold text-sm md:text-lg mt-1">Did you write these correctly?</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-6">
              {questions.map((q, idx) => (
                <div 
                  key={idx}
                  className="h-28 md:h-40 lg:h-48 rounded-xl md:rounded-3xl border-2 md:border-4 border-lime-300 bg-lime-50 flex flex-col items-center justify-center p-2 md:p-4 text-center transform md:hover:rotate-3 transition-transform shadow-sm cursor-default"
                >
                  <span className="text-slate-400 font-black text-[10px] md:text-sm mb-1 md:mb-2">CARD {idx + 1}</span>
                  <span className="text-4xl md:text-7xl font-black text-lime-700 mb-1 md:mb-2">{q.char}</span>
                  <span className="text-xs md:text-sm font-bold text-lime-600/70">{q.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 md:mt-8 pt-2 flex-shrink-0">
              <button
                onClick={handleFinishQuiz}
                className="w-full bg-sky-500 hover:bg-sky-400 text-white py-3 md:py-6 rounded-xl md:rounded-2xl font-black text-lg md:text-2xl shadow-md md:shadow-xl transition-all transform hover:scale-[1.02]"
              >
                FINISH QUIZ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Optional: Kept the footer branding as requested to preserve features */}
      <div className="p-2 md:p-4 text-center bg-white border-t-2 border-slate-100 flex-shrink-0">
        <p className="text-slate-400 font-black text-[10px] md:text-sm tracking-widest uppercase">Kortex Klassroom</p>
      </div>
    </div>
  );
}