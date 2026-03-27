import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, CheckCircle, Star, Trophy, ArrowRight } from 'lucide-react';

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

export default function App({ onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0); // 0: Listen, 1: Reveal
  const [playingIndex, setPlayingIndex] = useState(null);
  const [completedAudio, setCompletedAudio] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize and randomize letters
  useEffect(() => {
    const shuffled = [...VOWELS]
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    setQuestions(shuffled);
  }, []);

  // Speech Synthesis Function
  const speakLetter = (letter, index) => {
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

  const handleFinish = () => {
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
    setIsFinished(true);
  };

  const resetQuiz = () => {
    const shuffled = [...VOWELS]
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    setQuestions(shuffled);
    setCurrentStep(0);
    setCompletedAudio([]);
    setIsFinished(false);
    setPlayingIndex(null);
  };

  if (isFinished) {
    return (
      <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-4 md:p-8 flex flex-col items-center justify-center text-center overflow-y-auto">
        <div className="space-y-6 flex flex-col items-center">
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <Star 
                key={s} 
                size={64} 
                className="fill-yellow-400 text-yellow-400 animate-bounce" 
                style={{ animationDelay: `${s * 0.15}s` }} 
              />
            ))}
          </div>
          <h2 className="text-4xl font-black text-slate-800 mt-4">बहुत अच्छे! (Excellent!)</h2>
          <p className="text-xl text-slate-500 font-bold mb-6">You completed your Shrultlek session.</p>
          <div className="bg-purple-100 p-8 rounded-full mb-6">
            <Trophy size={80} className="text-purple-600" />
          </div>
          <button 
            onClick={resetQuiz}
            className="flex items-center gap-2 mx-auto bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-2xl font-black transition-all transform hover:scale-105 shadow-lg"
          >
            <RotateCcw size={20} strokeWidth={3} /> PLAY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full max-w-4xl mx-auto bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
      {/* Progress Header */}
      <div className="bg-white p-3 md:p-6 border-b-2 border-slate-100 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black text-slate-800">हिन्दी श्रुतलेख (अ - ऊ)</h1>
          <span className="text-slate-500 font-bold bg-slate-100 px-4 py-1 rounded-full text-sm">
            Step {currentStep + 1} of 2
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-sky-500 transition-all duration-500" 
            style={{ width: currentStep === 0 ? '50%' : '100%' }}
          />
        </div>
      </div>

      <div className="p-3 md:p-8 flex-grow flex flex-col justify-center min-h-0">
        {currentStep === 0 ? (
          <div className="space-y-3 md:space-y-6 flex flex-col h-full">
            <div className="text-center mb-2 md:mb-10 flex-shrink-0">
              <h3 className="text-lg md:text-2xl font-black text-slate-700">Listen carefully & write</h3>
              <p className="text-xs md:text-sm text-slate-500 font-bold mt-1">Click play. Each letter repeats 3 times.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-6 overflow-y-auto hide-scrollbar">
              {questions.map((q, idx) => (
                <div 
                  key={idx}
                  className={`relative h-28 md:h-48 rounded-xl md:rounded-2xl border-2 md:border-4 transition-all flex flex-col items-center justify-center gap-2 md:gap-4
                    ${playingIndex === idx ? 'border-sky-400 bg-sky-50 shadow-md scale-105' : 'border-slate-200 bg-white hover:border-sky-200'}
                    ${completedAudio.includes(idx) ? 'border-lime-400 bg-lime-50' : ''}
                  `}
                >
                  <span className="absolute top-3 left-4 font-black text-slate-300 text-xl">{idx + 1}</span>
                  
                  {playingIndex === idx ? (
                    <div className="flex gap-2 h-16 items-center justify-center">
                      <div className="w-2 h-8 bg-sky-500 animate-pulse rounded-full" />
                      <div className="w-2 h-12 bg-sky-500 animate-pulse delay-75 rounded-full" />
                      <div className="w-2 h-8 bg-sky-500 animate-pulse delay-150 rounded-full" />
                    </div>
                  ) : (
                    <button
                      onClick={() => speakLetter(q.char, idx)}
                      disabled={playingIndex !== null}
                      className={`p-3 md:p-5 rounded-full transition-all transform hover:scale-110 shadow-md md:shadow-lg
                        ${completedAudio.includes(idx) ? 'bg-lime-500 text-white' : 'bg-sky-500 text-white hover:bg-sky-400'}
                        ${playingIndex !== null && playingIndex !== idx ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {completedAudio.includes(idx) ? <CheckCircle className="w-6 h-6 md:w-10 md:h-10" strokeWidth={3} /> : <Play className="w-6 h-6 md:w-10 md:h-10" fill="currentColor" />}
                    </button>
                  )}
                  
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    {playingIndex === idx ? 'Listening...' : completedAudio.includes(idx) ? 'Done' : 'Play'}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-auto md:mt-12 pt-2 flex justify-center flex-shrink-0">
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
          <div className="space-y-4 md:space-y-10 animate-in fade-in zoom-in duration-500 flex flex-col h-full">
            <div className="text-center flex-shrink-0">
              <h3 className="text-xl md:text-3xl font-black text-slate-800">Match your answers!</h3>
              <p className="text-slate-500 font-bold text-sm md:text-lg mt-1">Did you write these correctly?</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-6 overflow-y-auto hide-scrollbar">
              {questions.map((q, idx) => (
                <div 
                  key={idx}
                  className="h-28 md:h-48 rounded-xl md:rounded-3xl border-2 md:border-4 border-lime-300 bg-lime-50 flex flex-col items-center justify-center p-2 md:p-4 text-center transform md:hover:rotate-3 transition-transform shadow-sm cursor-default"
                >
                  <span className="text-slate-400 font-black text-[10px] md:text-sm mb-1 md:mb-2">CARD {idx + 1}</span>
                  <span className="text-4xl md:text-7xl font-black text-lime-700 mb-1 md:mb-2">{q.char}</span>
                  <span className="text-xs md:text-sm font-bold text-lime-600/70">{q.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-2 flex-shrink-0">
              <button
                onClick={handleFinish}
                className="w-full bg-sky-500 hover:bg-sky-400 text-white py-3 md:py-6 rounded-xl md:rounded-2xl font-black text-lg md:text-2xl shadow-md md:shadow-xl transition-all transform hover:scale-[1.02]"
              >
                FINISH QUIZ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-4 text-center bg-white border-t-2 border-slate-100 flex-shrink-0">
        <p className="text-slate-400 font-black text-sm tracking-widest uppercase">Kortex Klassroom</p>
      </div>
    </div>
  );
}