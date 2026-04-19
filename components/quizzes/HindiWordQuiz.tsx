"use client";
import React, { useState, useCallback, useRef } from 'react';
import { Play, Trophy, Star, ArrowRight, CheckCircle, RotateCcw, Image as ImageIcon, Type } from 'lucide-react';
// IMPORT FIX: Added getWordData to fetch the audio!
import { getWordsForSubtopic, getWordData } from '@/lib/HindiWordDictionary';

// --- HELPER: Smart Image Fallback ---
const SmartImage = ({ wordData, className, emojiSize }: { wordData: any, className: string, emojiSize: string }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !wordData.imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-2xl border-4 border-white shadow-sm ${className}`}>
        <span className={emojiSize}>{wordData.emoji || '🖼️'}</span>
      </div>
    );
  }

  return (
    <img 
      src={wordData.imageUrl} 
      alt={wordData.english} 
      onError={() => setHasError(true)}
      className={`object-contain bg-white rounded-2xl border-4 border-white shadow-sm ${className}`}
    />
  );
};

// --- AUDIO HELPERS ---
const playErrorBuzzer = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sawtooth'; // Harsh sound for error
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.warn('Audio Context blocked');
    }
};

export default function HindiWordQuiz({ lesson, onComplete = () => {} }: any) {
  // --- STATE ---
  const [gameState, setGameState] = useState<'start' | 'playing' | 'completed'>('start');
  const [currentLevel, setCurrentLevel] = useState<number>(2);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  // Interaction State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [shakeClass, setShakeClass] = useState('');

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- QUESTION GENERATOR ---
  const generateQuestions = useCallback((level: number) => {
    const subtopicId = `word-builder-${level}`;
    const wordPool = getWordsForSubtopic(subtopicId);
    
    if (wordPool.length === 0) return [];

    const shuffledPool = [...wordPool].sort(() => 0.5 - Math.random());
    const targets = shuffledPool.slice(0, Math.min(10, shuffledPool.length));

    return targets.map(target => {
      const mode = Math.random() > 0.5 ? 'IMAGE_TO_WORD' : 'WORD_TO_IMAGE';
      const distractors = wordPool
        .filter((w: any) => w.word !== target.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const options = [target, ...distractors].sort(() => 0.5 - Math.random());
      return { target, options, mode };
    });
  }, []);

  const startGame = (level: number) => {
    const generated = generateQuestions(level);
    if (generated.length === 0) {
      alert("Error: No words found in dictionary for this level.");
      return;
    }
    setQuestions(generated);
    setCurrentLevel(level);
    setCurrentIndex(0);
    setScore(0);
    setGameState('playing');
    resetTurn();
  };

  const resetTurn = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setShakeClass('');
  };

  const playWordAudio = (wordText: string) => {
      const wordData = getWordData(wordText);
      if (wordData && wordData.audioUrl) {
          if (activeAudioRef.current) {
              activeAudioRef.current.pause();
              activeAudioRef.current.currentTime = 0;
          }
          const audio = new Audio(wordData.audioUrl);
          activeAudioRef.current = audio;
          audio.play().catch(e => console.warn("Audio play failed:", e));
      }
  };

  const handleOptionClick = (optionWord: string) => {
    if (isAnswerSubmitted) return;
    
    setSelectedOption(optionWord);
    setIsAnswerSubmitted(true);
    
    const currentQ = questions[currentIndex];
    const isCorrect = optionWord === currentQ.target.word;

    if (isCorrect) {
      setScore(prev => prev + 1);
      playWordAudio(currentQ.target.word); // Play correct sound immediately
      setTimeout(handleNextQuestion, 1500); // Short delay, then next
    } else {
      setShakeClass('animate-[shake_0.5s_ease-in-out]');
      playErrorBuzzer(); // Buzz immediately
      
      // Wait for buzz to finish, then speak the correct word while it's highlighted green
      setTimeout(() => {
          setShakeClass('');
          playWordAudio(currentQ.target.word);
      }, 500);
      
      // Give them more time to hear the audio and see the correct answer
      setTimeout(handleNextQuestion, 2500);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetTurn();
    } else {
      setGameState('completed');
    }
  };

  // --- RENDER: START SCREEN ---
  if (gameState === 'start') {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-4 bg-slate-50 font-sans rounded-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-100 rounded-full mb-6 border-4 border-sky-50 shadow-inner">
            <ImageIcon className="w-10 h-10 text-sky-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">शब्द और चित्र</h1>
          <p className="text-lg md:text-xl font-bold text-slate-500">अपना लेवल चुनें और खेलना शुरू करें!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
          <button onClick={() => startGame(2)} className="group flex flex-col items-center bg-white p-8 rounded-[2rem] border-4 border-emerald-100 hover:border-emerald-400 hover:-translate-y-2 transition-all shadow-sm hover:shadow-xl">
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🍎</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">लेवल 1</h2>
            <p className="text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full">दो अक्षर (2-Letter)</p>
          </button>
          <button onClick={() => startGame(3)} className="group flex flex-col items-center bg-white p-8 rounded-[2rem] border-4 border-amber-100 hover:border-amber-400 hover:-translate-y-2 transition-all shadow-sm hover:shadow-xl">
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🦆</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">लेवल 2</h2>
            <p className="text-amber-600 font-bold bg-amber-50 px-4 py-2 rounded-full">तीन अक्षर (3-Letter)</p>
          </button>
          <button onClick={() => startGame(4)} className="group flex flex-col items-center bg-white p-8 rounded-[2rem] border-4 border-purple-100 hover:border-purple-400 hover:-translate-y-2 transition-all shadow-sm hover:shadow-xl">
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🌳</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">लेवल 3</h2>
            <p className="text-purple-600 font-bold bg-purple-50 px-4 py-2 rounded-full">चार अक्षर (4-Letter)</p>
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: COMPLETED SCREEN ---
  if (gameState === 'completed') {
    const stars = score >= questions.length * 0.8 ? 3 : score >= questions.length * 0.5 ? 2 : 1;
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-3xl">
        <div className="bg-amber-100 p-8 rounded-full mb-6 border-8 border-amber-50 shadow-inner">
          <Trophy className="w-20 h-20 text-amber-500" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">शानदार प्रदर्शन!</h2>
        <div className="flex gap-4 mb-8">
          {[1, 2, 3].map((starIndex) => (
            <Star key={starIndex} className={`w-16 h-16 transition-all duration-500 ${starIndex <= stars ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-md' : 'text-slate-300 fill-slate-200'}`} />
          ))}
        </div>
        <p className="text-2xl font-bold text-slate-500 mb-10">स्कोर: {score} / {questions.length}</p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button onClick={() => setGameState('start')} className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <RotateCcw size={20} /> फिर से खेलें
          </button>
          <button onClick={() => onComplete()} className="flex-1 py-4 bg-sky-500 text-white font-black rounded-2xl shadow-md border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
            आगे बढ़ें <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: PLAYING SCREEN ---
  const currentQ = questions[currentIndex];
  const progressPercent = (currentIndex / questions.length) * 100;

  return (
    <div className="w-full h-full min-h-[500px] max-h-screen flex flex-col bg-slate-50 font-sans overflow-hidden rounded-3xl border-2 border-slate-100">
      {/* HEADER */}
      <div className="shrink-0 p-4 md:p-6 bg-white border-b-2 border-slate-100 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="bg-sky-100 text-sky-700 font-black px-4 py-1.5 rounded-full text-xs md:text-sm tracking-wider uppercase">
             {currentLevel}-Letter Match
           </div>
        </div>
        <div className="w-1/3 max-w-[200px] hidden sm:block">
           <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
             <div className="h-full bg-sky-500 transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
           </div>
        </div>
        <div className="font-black text-slate-400 text-sm md:text-base">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {/* CORE GAMEPLAY ZONE */}
      <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6 gap-6 relative">
        
        {/* TARGET AREA (Top Half) */}
        <div className={`flex-[0.45] min-h-0 w-full flex items-center justify-center transition-transform duration-300 ${shakeClass}`}>
          {currentQ.mode === 'IMAGE_TO_WORD' ? (
            <SmartImage 
              wordData={currentQ.target} 
              className="h-full w-auto max-h-[35vh] aspect-square object-contain bg-white shadow-md p-4 rounded-[2rem]" 
              emojiSize="text-[6rem] md:text-[8rem]" 
            />
          ) : (
            <div className="h-full w-full max-h-[35vh] max-w-3xl mx-auto flex items-center justify-center bg-white rounded-[2rem] border-4 border-slate-100 shadow-sm px-6">
              <span className="text-[4rem] md:text-[6rem] lg:text-[7rem] font-black text-slate-800 tracking-tight drop-shadow-sm whitespace-nowrap">
                {currentQ.target.word}
              </span>
            </div>
          )}
        </div>

        {/* OPTIONS AREA (Bottom Half - 2x2 Grid) */}
        <div className="flex-[0.55] min-h-0 w-full max-w-4xl mx-auto grid grid-cols-2 grid-rows-2 gap-3 md:gap-6 pb-2">
          {currentQ.options.map((opt: any, idx: number) => {
            const isSelected = selectedOption === opt.word;
            const isCorrect = opt.word === currentQ.target.word;
            
            let buttonStyle = "bg-white border-4 border-slate-100 hover:border-sky-300 hover:-translate-y-1 shadow-sm text-slate-700";
            
            if (isAnswerSubmitted) {
              if (isCorrect) {
                // Correct answer always turns green
                buttonStyle = "bg-green-100 border-4 border-green-500 text-green-700 scale-105 shadow-lg z-10";
              } else if (isSelected && !isCorrect) {
                // Clicked wrong answer turns red
                buttonStyle = "bg-rose-100 border-4 border-rose-500 text-rose-700 opacity-80 scale-95";
              } else {
                // Others fade out
                buttonStyle = "bg-slate-50 border-4 border-slate-100 text-slate-400 opacity-40";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswerSubmitted}
                onClick={() => handleOptionClick(opt.word)}
                // SIZING FIX: Added min-h-0 min-w-0 to prevent flex blowout
                className={`min-h-0 min-w-0 w-full h-full rounded-[1.5rem] md:rounded-[2rem] transition-all duration-300 relative overflow-hidden ${buttonStyle}`}
              >
                {currentQ.mode === 'IMAGE_TO_WORD' ? (
                  // TEXT WRAPPER FIX: Absolute positioning traps the text perfectly in the center
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <span className="text-3xl md:text-5xl font-black drop-shadow-sm whitespace-nowrap">{opt.word}</span>
                  </div>
                ) : (
                  // IMAGE WRAPPER FIX: Absolute positioning ensures images can NEVER stretch the grid
                  <div className="absolute inset-3 md:inset-6 flex items-center justify-center pointer-events-none">
                    <SmartImage 
                      wordData={opt} 
                      className="w-full h-full object-contain border-none shadow-none bg-transparent" 
                      emojiSize="text-5xl md:text-7xl" 
                    />
                  </div>
                )}
                
                {isAnswerSubmitted && isCorrect && (
                   <div className="absolute top-3 right-3 bg-white rounded-full text-green-500 shadow-sm z-20">
                     <CheckCircle size={28} className="fill-white"/>
                   </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px) rotate(-2deg); }
          75% { transform: translateX(10px) rotate(2deg); }
        }
      `}} />
    </div>
  );
}