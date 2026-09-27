"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Trophy, ArrowRight, RotateCcw, Star, CheckCircle2, XCircle, PlayCircle, HelpCircle } from 'lucide-react';
import { STORIES_DATA } from '@/lib/FLNStories';

// --- AUDIO ENGINES ---
const playTTS = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const phoneticText = text + '।';
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(phoneticText);
            utterance.lang = 'hi-IN';
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
        }, 50); 
    }
};

const playSuccessSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); 
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    } catch(e) { console.log("Audio skipped"); }
};

const playErrorSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3); 
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } catch(e) { console.log("Audio skipped"); }
};


export default function FLNStoryQuiz({ lesson, onComplete = () => {} }: any) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'results'>('intro');
  const [currentStory, setCurrentStory] = useState<any>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // 1. INITIALIZE QUIZ BASED ON ROUTE
  useEffect(() => {
    const subtopicId = lesson?.subtopicId || '';
    // Extracts 'story-1' from an ID like 'story-1-quiz'
    const baseId = subtopicId.replace('-read', '').replace('-quiz', '');
    
    const foundStory = STORIES_DATA.find(s => s.id === baseId);
    if (foundStory && foundStory.quiz) {
      setCurrentStory(foundStory);
    }
  }, [lesson]);

  const handleStart = () => {
      setGameState('playing');
      setScore(0);
      setCurrentQIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
  };

  const handleOptionSelect = (option: string, correctAnswer: string) => {
      if (isAnswered) return;
      setSelectedOption(option);
      setIsAnswered(true);

      if (option === correctAnswer) {
          setScore(prev => prev + 1);
          playSuccessSound();
      } else {
          playErrorSound();
      }
  };

  const handleNextQuestion = () => {
      if (currentQIndex < currentStory.quiz.length - 1) {
          setCurrentQIndex(prev => prev + 1);
          setSelectedOption(null);
          setIsAnswered(false);
      } else {
          setTimeout(() => setGameState('results'), 500);
      }
  };

  if (!currentStory) return <div className="p-10 text-center text-slate-500 font-bold">Loading Quiz Data...</div>;

  const currentQuiz = currentStory.quiz;
  const currentQ = currentQuiz[currentQIndex];

  // ==========================================
  // RENDER: INTRO SCREEN
  // ==========================================
  if (gameState === 'intro') {
      return (
          <div className="w-full h-[90vh] min-h-[600px] max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-sky-100 flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-sky-50 p-8 rounded-full mb-6 border-4 border-sky-100">
                  <HelpCircle className="w-20 h-20 text-sky-500" />
              </div>
              <h2 className="text-sm font-bold text-sky-500 uppercase tracking-widest mb-2">कहानी क्विज़</h2>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">{currentStory.title}</h1>
              <p className="text-lg md:text-xl font-bold text-slate-500 mb-10 max-w-lg">
                  Let's see how much you remember from the story! Answer {currentQuiz.length} simple questions.
              </p>
              
              <button 
                  onClick={handleStart} 
                  className="w-full md:w-auto bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-black text-xl md:text-2xl py-4 px-16 rounded-2xl shadow-lg shadow-sky-200 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                  <PlayCircle className="w-8 h-8" /> शुरू करें
              </button>
          </div>
      );
  }

  // ==========================================
  // RENDER: RESULTS SCREEN
  // ==========================================
  if (gameState === 'results') {
      const starsEarned = score === currentQuiz.length ? 3 : score > 0 ? 2 : 1;
      
      return (
          <div className="w-full h-[90vh] min-h-[600px] max-w-4xl mx-auto bg-slate-900 rounded-3xl shadow-xl overflow-hidden border-4 border-slate-800 flex flex-col items-center justify-center p-6 text-center relative">
              
              {/* Confetti Background for Perfect Score */}
              {score === currentQuiz.length && (
                  <>
                      <style>{`
                          @keyframes confettiDrop { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
                          .animate-confetti { animation: confettiDrop linear infinite; }
                      `}</style>
                      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-3xl">
                          {[...Array(40)].map((_, i) => (
                              <div key={i} className="absolute animate-confetti" style={{
                                  left: `${Math.random() * 100}%`, top: `-10%`,
                                  backgroundColor: ['#f59e0b', '#10b981', '#0ea5e9', '#ec4899', '#a855f7'][Math.floor(Math.random() * 5)],
                                  width: `${Math.random() * 10 + 5}px`, height: `${Math.random() * 20 + 10}px`,
                                  animationDelay: `${Math.random() * 2}s`, animationDuration: `${Math.random() * 2 + 2}s`
                              }} />
                          ))}
                      </div>
                  </>
              )}

              <div className="bg-amber-400 p-8 rounded-full mb-6 border-8 border-amber-200 shadow-[0_0_50px_rgba(251,191,36,0.5)] z-10">
                  <Trophy className="w-24 h-24 text-amber-900" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 z-10">बहुत बढ़िया!</h1>
              <p className="text-xl md:text-2xl font-bold text-slate-300 mb-8 z-10">
                  आपने {currentQuiz.length} में से {score} सही उत्तर दिए!
              </p>

              <div className="flex space-x-4 mb-12 z-10">
                  {[1, 2, 3].map((starIndex) => (
                      <Star key={starIndex} className={`w-16 h-16 transition-all duration-500 ${starIndex <= starsEarned ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] scale-110' : 'text-slate-700 fill-slate-800'}`} />
                  ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md z-10">
                  <button onClick={handleStart} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl py-4 rounded-2xl transition-colors flex items-center justify-center gap-2">
                      <RotateCcw size={24} /> फिर से खेलें
                  </button>
                  <button onClick={() => onComplete({ score, stars: starsEarned })} className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-black text-xl py-4 rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2 border-b-4 border-sky-700 active:translate-y-1 active:border-b-0">
                      आगे बढ़ें <ArrowRight size={24} />
                  </button>
              </div>
          </div>
      );
  }

  // ==========================================
  // RENDER: PLAYING SCREEN
  // ==========================================
  return (
      <div className="w-full h-[90vh] min-h-[600px] max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-sky-100 flex flex-col font-sans">
          
          {/* HEADER PROGRESS */}
          <div className="bg-sky-50 px-6 py-4 flex items-center justify-between shrink-0 border-b-2 border-sky-100">
              <span className="text-sky-800 font-bold text-sm md:text-lg uppercase tracking-wider">
                  प्रश्न {currentQIndex + 1} / {currentQuiz.length}
              </span>
              <div className="flex space-x-1.5 items-center">
                  {currentQuiz.map((_: any, idx: number) => (
                      <div key={idx} className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentQIndex ? 'w-8 bg-sky-500' : idx < currentQIndex ? 'w-4 bg-sky-400' : 'w-2.5 bg-sky-200'}`} />
                  ))}
              </div>
          </div>

          {/* QUESTION AREA */}
          <div className="flex-[0.8] bg-slate-50 flex flex-col items-center justify-center p-6 md:p-10 border-b-2 border-slate-200 text-center shrink-0">
              <button 
                  onClick={() => playTTS(currentQ.question)}
                  className="mb-6 bg-white p-4 rounded-full shadow-sm border border-slate-200 hover:bg-sky-50 hover:text-sky-500 hover:border-sky-300 transition-all active:scale-95 text-slate-400"
              >
                  <Volume2 size={32} />
              </button>
              <h2 className="text-3xl md:text-5xl font-black text-slate-800 leading-tight">
                  {currentQ.question}
              </h2>
          </div>

          {/* OPTIONS AREA */}
          <div className="flex-1 p-6 md:p-10 bg-white flex flex-col gap-4 overflow-y-auto">
              {currentQ.options.map((option: string, idx: number) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === currentQ.correctAnswer;
                  
                  let buttonStyle = "bg-white border-2 border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50";
                  let icon = null;

                  if (isAnswered) {
                      if (isCorrect) {
                          buttonStyle = "bg-emerald-50 border-2 border-emerald-500 text-emerald-800 scale-[1.02] shadow-md";
                          icon = <CheckCircle2 className="text-emerald-500 w-8 h-8 md:w-10 md:h-10" />;
                      } else if (isSelected && !isCorrect) {
                          buttonStyle = "bg-rose-50 border-2 border-rose-500 text-rose-800 scale-95 opacity-70";
                          icon = <XCircle className="text-rose-500 w-8 h-8 md:w-10 md:h-10" />;
                      } else {
                          buttonStyle = "bg-white border-2 border-slate-200 text-slate-400 opacity-50";
                      }
                  }

                  return (
                      <div key={idx} className="flex gap-3 w-full max-w-2xl mx-auto">
                          <button 
                              onClick={() => playTTS(option)}
                              className="shrink-0 aspect-square flex items-center justify-center p-3 md:p-4 rounded-2xl bg-slate-100 text-slate-400 hover:bg-sky-100 hover:text-sky-600 transition-colors"
                          >
                              <Volume2 size={28} />
                          </button>
                          
                          <button 
                              onClick={() => handleOptionSelect(option, currentQ.correctAnswer)}
                              disabled={isAnswered}
                              className={`flex-1 flex items-center justify-between p-4 md:p-6 rounded-2xl text-left transition-all duration-300 ${buttonStyle}`}
                          >
                              <span className="text-2xl md:text-4xl font-bold">{option}</span>
                              {icon}
                          </button>
                      </div>
                  );
              })}
          </div>

          {/* NEXT BUTTON FOOTER */}
          {isAnswered && (
              <div className="p-6 bg-slate-50 border-t-2 border-slate-200 flex justify-end shrink-0 animate-in slide-in-from-bottom-4">
                  <button 
                      onClick={handleNextQuestion}
                      className="w-full sm:w-auto flex items-center justify-center px-10 py-4 rounded-2xl font-black text-white bg-sky-500 shadow-md shadow-sky-200 hover:bg-sky-600 transition-all border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 text-xl md:text-2xl gap-2"
                  >
                      {currentQIndex === currentQuiz.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={28} />
                  </button>
              </div>
          )}

      </div>
  );
}