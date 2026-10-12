"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Trophy, Star, ArrowRight, CheckCircle, RotateCcw, Image as ImageIcon, Type } from 'lucide-react';
import { getWordsForSubtopic, getWordData } from '@/kortex_library/HindiWordDictionary';
import { HINDI_ASSETS, getBarahkhadiAudio } from '@/kortex_library/SwarVyanjanDictionary';

// --- HELPER: Smart Image Fallback ---
const SmartImage = ({ wordData, className, emojiSize }: { wordData: any, className: string, emojiSize: string }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [wordData?.imageUrl]);

  if (hasError || !wordData.imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-white shadow-sm ${className}`}>
        <span className={emojiSize}>{wordData.emoji || '🖼️'}</span>
      </div>
    );
  }

  return (
    <img 
      src={wordData.imageUrl} 
      alt={wordData.english} 
      onError={() => setHasError(true)}
      className={`object-contain bg-white rounded-xl sm:rounded-2xl border-2 sm:border-4 border-white shadow-sm ${className}`}
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
        
        osc.type = 'sawtooth';
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
  const subtopicId = lesson?.subtopicId || lesson?.routePath?.split('/').pop() || 'word-builder-2';
  
  // --- MODE DETECTION ---
  const isMatraQuiz = subtopicId.includes('matra');
  // Alias the ID so it pulls from the exact same dictionary arrays we built for the Word Builder!
  const fetchId = subtopicId.replace('quiz-', 'wb-');

  // --- STATE ---
  const [gameState, setGameState] = useState<'start' | 'playing' | 'completed'>('start');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  // Interaction State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [shakeClass, setShakeClass] = useState('');

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- QUESTION GENERATOR ---
  const generateQuestions = useCallback((targetFetchId: string) => {
    const wordPool = getWordsForSubtopic(targetFetchId);
    
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

  const startGame = (targetFetchId: string) => {
    const generated = generateQuestions(targetFetchId);
    if (generated.length === 0) {
      alert("Error: No words found in dictionary for this level.");
      return;
    }
    setQuestions(generated);
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

  // --- UNIVERSAL AUDIO ENGINE ---
  const playWordAudio = (wordText: string) => {
    if (!wordText) return;
    try {
        let audioPath = '';

        // 1. Base Swar/Vyanjan
        if (HINDI_ASSETS[wordText]) {
            audioPath = HINDI_ASSETS[wordText].audio;
        } 
        // 2. Barahkhadi Syllable
        else {
            const bPath = getBarahkhadiAudio(wordText);
            if (bPath) {
                audioPath = bPath;
            } else {
                // 3. Full Word
                const wordData = getWordData(wordText);
                if (wordData && wordData.audioUrl) {
                    audioPath = wordData.audioUrl;
                }
            }
        }

        if (audioPath) {
            if (activeAudioRef.current) {
                activeAudioRef.current.pause();
                activeAudioRef.current.currentTime = 0;
            }
            const audio = new Audio(audioPath);
            activeAudioRef.current = audio;
            
            // Bulletproof Fallback
            audio.onerror = () => {
                const fallbackPath = audioPath.endsWith('.m4a') 
                    ? audioPath.replace('.m4a', '.mp3') 
                    : audioPath.replace('.mp3', '.m4a');
                    
                const fallbackAudio = new Audio(fallbackPath);
                activeAudioRef.current = fallbackAudio;
                fallbackAudio.play().catch(e => console.warn("Audio missing in both formats for:", wordText));
            };

            audio.play().catch(e => console.warn("Browser blocked audio for:", wordText));
        }
    } catch (error) {
        console.error("Audio playback error:", error);
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
      playWordAudio(currentQ.target.word);
      setTimeout(handleNextQuestion, 1500);
    } else {
      setShakeClass('animate-[shake_0.5s_ease-in-out]');
      playErrorBuzzer();
      
      setTimeout(() => {
          setShakeClass('');
          playWordAudio(currentQ.target.word);
      }, 500);
      
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
      <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 bg-slate-50 font-sans rounded-2xl md:rounded-3xl overflow-hidden">
        <div className="text-center mb-3 sm:mb-5 shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-sky-100 rounded-full mb-2 sm:mb-3 border-2 sm:border-4 border-sky-50 shadow-inner">
            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-sky-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1">{lesson?.title || 'शब्द और चित्र'}</h1>
          <p className="text-xs sm:text-sm md:text-base font-bold text-slate-500">अपना लेवल चुनें और खेलना शुरू करें!</p>
        </div>

        {isMatraQuiz ? (
          // Dedicated Single Start Button for Specific Matras
          <div className="flex justify-center w-full max-w-xs sm:max-w-sm px-4">
            <button 
              onClick={() => startGame(fetchId)} 
              className="w-full group flex flex-col items-center bg-white p-4 sm:p-6 rounded-2xl md:rounded-[2rem] border-2 sm:border-4 border-sky-100 hover:border-sky-400 active:scale-95 sm:hover:-translate-y-1 transition-all shadow-sm hover:shadow-lg"
            >
              <div className="text-4xl sm:text-5xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">🎯</div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-800 mb-1">शुरू करें</h2>
              <span className="text-sky-600 font-bold bg-sky-50 px-4 sm:px-6 py-1 rounded-full uppercase tracking-wider text-xs sm:text-sm">Start Quiz</span>
            </button>
          </div>
        ) : (
          // 3-Button Level Selection - Fits Side-by-Side on Mobile with Zero Scroll!
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 w-full max-w-3xl px-2 sm:px-4">
            <button 
              onClick={() => startGame('word-builder-2')} 
              className="group flex flex-col items-center justify-center bg-white p-3 sm:p-5 md:p-6 rounded-2xl md:rounded-[2rem] border-2 sm:border-4 border-emerald-100 hover:border-emerald-400 active:scale-95 sm:hover:-translate-y-1 transition-all shadow-sm hover:shadow-lg"
            >
              <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">🍎</div>
              <h2 className="text-sm sm:text-lg md:text-xl font-black text-slate-800 mb-0.5 sm:mb-1">लेवल 1</h2>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm text-center">दो अक्षर</span>
            </button>
            <button 
              onClick={() => startGame('word-builder-3')} 
              className="group flex flex-col items-center justify-center bg-white p-3 sm:p-5 md:p-6 rounded-2xl md:rounded-[2rem] border-2 sm:border-4 border-amber-100 hover:border-amber-400 active:scale-95 sm:hover:-translate-y-1 transition-all shadow-sm hover:shadow-lg"
            >
              <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">🦆</div>
              <h2 className="text-sm sm:text-lg md:text-xl font-black text-slate-800 mb-0.5 sm:mb-1">लेवल 2</h2>
              <span className="text-amber-700 font-bold bg-amber-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm text-center">तीन अक्षर</span>
            </button>
            <button 
              onClick={() => startGame('word-builder-4')} 
              className="group flex flex-col items-center justify-center bg-white p-3 sm:p-5 md:p-6 rounded-2xl md:rounded-[2rem] border-2 sm:border-4 border-purple-100 hover:border-purple-400 active:scale-95 sm:hover:-translate-y-1 transition-all shadow-sm hover:shadow-lg"
            >
              <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">🌳</div>
              <h2 className="text-sm sm:text-lg md:text-xl font-black text-slate-800 mb-0.5 sm:mb-1">लेवल 3</h2>
              <span className="text-purple-700 font-bold bg-purple-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm text-center">चार अक्षर</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER: COMPLETED SCREEN ---
  if (gameState === 'completed') {
    const stars = score >= questions.length * 0.8 ? 3 : score >= questions.length * 0.5 ? 2 : 1;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 text-center bg-slate-50 rounded-2xl md:rounded-3xl overflow-hidden">
        <div className="bg-amber-100 p-3 sm:p-5 rounded-full mb-2 sm:mb-3 border-4 sm:border-8 border-amber-50 shadow-inner">
          <Trophy className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 text-amber-500" />
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1 sm:mb-1.5">शानदार प्रदर्शन!</h2>
        <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-3">
          {[1, 2, 3].map((starIndex) => (
            <Star key={starIndex} className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 transition-all duration-500 ${starIndex <= stars ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-md' : 'text-slate-300 fill-slate-200'}`} />
          ))}
        </div>
        <p className="text-base sm:text-lg md:text-xl font-bold text-slate-500 mb-4 sm:mb-6">स्कोर: {score} / {questions.length}</p>
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 w-full max-w-sm sm:max-w-md">
          <button onClick={() => setGameState('start')} className="flex-1 py-2.5 sm:py-3.5 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-xl sm:rounded-2xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base">
            <RotateCcw size={18} /> फिर से खेलें
          </button>
          <button onClick={() => onComplete({ score, maxScore: questions.length })} className="flex-1 py-2.5 sm:py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl sm:rounded-2xl shadow-md border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base">
            आगे बढ़ें <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: PLAYING SCREEN ---
  const currentQ = questions[currentIndex];
  const progressPercent = (currentIndex / questions.length) * 100;

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 font-sans overflow-hidden rounded-2xl md:rounded-3xl border-2 border-slate-100">
      {/* HEADER */}
      <div className="shrink-0 px-3 sm:px-5 py-2 sm:py-2.5 bg-white border-b-2 border-slate-100 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
           <div className="bg-sky-100 text-sky-700 font-black px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm tracking-wider uppercase">
             {isMatraQuiz ? 'मात्रा ज्ञान' : 'Word Match'}
           </div>
        </div>
        <div className="w-1/3 max-w-[200px] hidden sm:block">
           <div className="h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
             <div className="h-full bg-sky-500 transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
           </div>
        </div>
        <div className="font-black text-slate-400 text-xs sm:text-sm md:text-base">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {/* CORE GAMEPLAY ZONE */}
      <div className="flex-1 min-h-0 flex flex-col p-2.5 sm:p-4 md:p-6 gap-2 sm:gap-3.5 relative overflow-hidden">
        {/* Target Image or Word Display */}
        <div className={`flex-[0.45] min-h-0 w-full flex items-center justify-center transition-transform duration-300 ${shakeClass}`}>
          {currentQ.mode === 'IMAGE_TO_WORD' ? (
            <SmartImage 
              wordData={currentQ.target} 
              className="h-full w-auto max-h-full aspect-square object-contain bg-white shadow-sm sm:shadow-md p-2 sm:p-3 md:p-4 rounded-2xl md:rounded-3xl" 
              emojiSize="text-5xl sm:text-6xl md:text-7xl" 
            />
          ) : (
            <div className="h-full w-full max-h-full max-w-2xl mx-auto flex items-center justify-center bg-white rounded-2xl md:rounded-3xl border-2 sm:border-4 border-slate-100 shadow-sm px-4 sm:px-6">
              <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-800 tracking-tight drop-shadow-sm whitespace-nowrap">
                {currentQ.target.word}
              </span>
            </div>
          )}
        </div>

        {/* 4 Options Grid (2x2) */}
        <div className="flex-[0.55] min-h-0 w-full max-w-4xl mx-auto grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 md:gap-4 pb-0.5">
          {currentQ.options.map((opt: any, idx: number) => {
            const isSelected = selectedOption === opt.word;
            const isCorrect = opt.word === currentQ.target.word;
            
            let buttonStyle = "bg-white border-2 sm:border-4 border-slate-100 hover:border-sky-300 active:scale-95 sm:hover:-translate-y-0.5 shadow-sm text-slate-700";
            
            if (isAnswerSubmitted) {
              if (isCorrect) {
                buttonStyle = "bg-green-100 border-2 sm:border-4 border-green-500 text-green-700 scale-[1.02] shadow-md z-10";
              } else if (isSelected && !isCorrect) {
                buttonStyle = "bg-rose-100 border-2 sm:border-4 border-rose-500 text-rose-700 opacity-80 scale-95";
              } else {
                buttonStyle = "bg-slate-50 border-2 sm:border-4 border-slate-100 text-slate-400 opacity-40";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswerSubmitted}
                onClick={() => handleOptionClick(opt.word)}
                className={`min-h-0 min-w-0 w-full h-full rounded-xl sm:rounded-2xl md:rounded-3xl transition-all duration-300 relative overflow-hidden ${buttonStyle}`}
              >
                {currentQ.mode === 'IMAGE_TO_WORD' ? (
                  <div className="absolute inset-0 flex items-center justify-center p-1 sm:p-2">
                    <span className="text-lg sm:text-2xl md:text-4xl font-black drop-shadow-sm truncate max-w-full px-1.5">{opt.word}</span>
                  </div>
                ) : (
                  <div className="absolute inset-1.5 sm:inset-3 md:inset-4 flex items-center justify-center pointer-events-none">
                    <SmartImage 
                      wordData={opt} 
                      className="w-full h-full object-contain border-none shadow-none bg-transparent" 
                      emojiSize="text-3xl sm:text-5xl md:text-6xl" 
                    />
                  </div>
                )}
                
                {isAnswerSubmitted && isCorrect && (
                   <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 bg-white rounded-full text-green-500 shadow-sm z-20">
                     <CheckCircle size={22} className="fill-white"/>
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