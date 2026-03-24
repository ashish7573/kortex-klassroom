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
      <div className="w-full max-w-4xl mx-auto min-h-[500px] bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center text-center">
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
    <div className="w-full max-w-4xl mx-auto min-h-[500px] bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
      {/* Progress Header */}
      <div className="bg-white p-6 border-b-2 border-slate-100 flex-shrink-0">
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

      <div className="p-8 flex-grow flex flex-col justify-center">
        {currentStep === 0 ? (
          <div className="space-y-6">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-black text-slate-700">Listen carefully & write</h3>
              <p className="text-slate-500 font-bold mt-2">Click play. Each letter repeats 3 times.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {questions.map((q, idx) => (
                <div 
                  key={idx}
                  className={`relative h-48 rounded-2xl border-4 transition-all flex flex-col items-center justify-center gap-4
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
                      className={`p-5 rounded-full transition-all transform hover:scale-110 shadow-lg
                        ${completedAudio.includes(idx) ? 'bg-lime-500 text-white' : 'bg-sky-500 text-white hover:bg-sky-400'}
                        ${playingIndex !== null && playingIndex !== idx ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {completedAudio.includes(idx) ? <CheckCircle size={40} strokeWidth={3} /> : <Play size={40} fill="currentColor" />}
                    </button>
                  )}
                  
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    {playingIndex === idx ? 'Listening...' : completedAudio.includes(idx) ? 'Done' : 'Play'}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <button
                disabled={completedAudio.length < 5}
                onClick={() => setCurrentStep(1)}
                className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-xl
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
          <div className="space-y-10 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <h3 className="text-3xl font-black text-slate-800">Match your answers!</h3>
              <p className="text-slate-500 font-bold text-lg mt-2">Did you write these correctly?</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {questions.map((q, idx) => (
                <div 
                  key={idx}
                  className="h-48 rounded-3xl border-4 border-lime-300 bg-lime-50 flex flex-col items-center justify-center p-4 text-center transform hover:rotate-3 transition-transform shadow-sm cursor-default"
                >
                  <span className="text-slate-400 font-black text-sm mb-2">CARD {idx + 1}</span>
                  <span className="text-7xl font-black text-lime-700 mb-2">{q.char}</span>
                  <span className="text-sm font-bold text-lime-600/70">{q.name}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="w-full mt-8 bg-sky-500 hover:bg-sky-400 text-white py-6 rounded-2xl font-black text-2xl shadow-xl transition-all transform hover:scale-[1.02]"
            >
              FINISH QUIZ
            </button>
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