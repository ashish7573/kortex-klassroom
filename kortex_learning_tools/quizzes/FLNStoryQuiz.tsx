"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Trophy, ArrowRight, RotateCcw, Star, CheckCircle2, XCircle, PlayCircle, HelpCircle } from 'lucide-react';
import { STORIES_DATA } from '@/kortex_library/FLNStories';

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
          const starsEarned = score === currentStory.quiz.length ? 3 : score > 0 ? 2 : 1;
          onComplete({ score, stars: starsEarned });
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

  // Internal results screen removed, handled by LessonPlayer wrapper.

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