"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Play, Trophy, ArrowRight, Volume2, RotateCcw, FileEdit, CheckCircle, Star } from 'lucide-react';
import { getWordsForSubtopic, getWordData } from '@/lib/HindiWordDictionary';

// --- HELPER: Smart Image Fallback ---
const SmartImage = ({ wordData, className, emojiSize }: { wordData: any, className: string, emojiSize: string }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError || !wordData.imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-xl shadow-sm ${className}`}>
        <span className={emojiSize}>{wordData.emoji || '🖼️'}</span>
      </div>
    );
  }
  return (
    <img 
      src={wordData.imageUrl} 
      alt={wordData.english} 
      onError={() => setHasError(true)}
      className={`object-contain bg-white rounded-xl shadow-sm ${className}`}
    />
  );
};

export default function HindiWordDictation({ lesson, onComplete = () => {} }: any) {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'completed'>('start'); 
  const [questions, setQuestions] = useState<any[]>([]);
  const [playedCards, setPlayedCards] = useState<number[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Generate 10 Random Words for Dictation
  useEffect(() => {
    // Extract length from subtopicId (e.g., 'word-builder-3' -> 3)
    const subtopicId = lesson.subtopicId || 'word-builder-2';
    const pool = getWordsForSubtopic(subtopicId);
    
    if (pool.length === 0) return;

    // Shuffle and pick 10 words
    let selected = pool.sort(() => 0.5 - Math.random()).slice(0, 10);
    
    // Pad the array if the dictionary has fewer than 10 words for this category
    while (selected.length > 0 && selected.length < 10) {
        selected = [...selected, ...selected].slice(0, 10);
    }
    
    setQuestions(selected);
  }, [lesson.subtopicId]);

  // 2. Audio Handler
  const playDictationAudio = (idx: number, wordText: string) => {
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
    
    if (!playedCards.includes(idx)) {
      setPlayedCards(prev => [...prev, idx]);
    }
  };

  const handleRetake = () => {
    setGameState('start');
    setPlayedCards([]);
    setIsRevealed(false);
    // Reshuffle for replay value
    setQuestions(prev => [...prev].sort(() => 0.5 - Math.random()));
  };

  if (questions.length === 0) return <div className="p-10 text-center font-bold text-rose-500">Error: Dictionary Words Not Found</div>;

  // ==========================================
  // RENDER: START SCREEN
  // ==========================================
  if (gameState === 'start') {
    return (
      <div className="w-full h-full min-h-[500px] max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="bg-sky-100 w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-inner overflow-hidden border-4 border-sky-50">
          <FileEdit className="w-16 h-16 text-sky-500" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4">{lesson.title || 'श्रुतलेख (Dictation)'}</h2>
        <p className="text-base md:text-xl font-bold text-slate-500 mb-8 max-w-lg">
          Listen to the sound and write the words in your notebook!
        </p>
        <button onClick={() => setGameState('playing')} className="w-full md:w-auto bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-xl md:text-2xl py-4 px-12 rounded-2xl shadow-lg shadow-sky-200 active:scale-95 transition-all flex items-center justify-center gap-3">
          <Play className="fill-white w-6 h-6" /> Start Dictation
        </button>
      </div>
    );
  }

  // ==========================================
  // RENDER: COMPLETED SCREEN
  // ==========================================
  if (gameState === 'completed') {
    return (
      <div className="w-full h-full min-h-[500px] max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-6 md:p-12 flex flex-col items-center justify-center text-center overflow-y-auto">
        <div className="bg-emerald-50 p-6 rounded-full mb-6 border-4 border-emerald-100">
          <Trophy className="w-16 h-16 md:w-20 md:h-20 text-emerald-500" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">Great Job!</h2>
        <p className="text-lg md:text-xl font-bold text-slate-500 mb-8">You completed the dictation exercise.</p>
        
        <div className="flex space-x-2 md:space-x-4 mb-10">
          {[1, 2, 3].map((starIndex) => (
            <Star key={starIndex} className={`w-12 h-12 md:w-16 md:h-16 transition-all duration-500 transform text-yellow-400 fill-yellow-400 scale-110 drop-shadow-md`} />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button onClick={handleRetake} className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold text-lg md:text-xl py-4 px-8 rounded-xl md:rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2 border-2 border-slate-200">
            <RotateCcw className="w-6 h-6 text-slate-400" /><span>Play Again</span>
          </button>
          <button onClick={() => onComplete({ score: 10, stars: 3 })} className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg md:text-xl py-4 px-12 rounded-xl md:rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2 border-b-4 border-sky-700 active:border-b-0 active:translate-y-1">
            <span>Finish Chapter</span><ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: PLAYING SCREEN
  // ==========================================
  return (
    <div className="w-full h-full max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="px-6 md:px-10 pt-6 pb-4 border-b-2 border-slate-50 flex justify-between items-center shrink-0">
         <div>
           <h2 className="text-2xl md:text-3xl font-black text-slate-800">{lesson.title || 'श्रुतलेख'}</h2>
           <p className="text-slate-500 font-bold text-sm md:text-base mt-1">Tap the cards to listen. Write the words in your notebook!</p>
         </div>
      </div>

      {/* 10 Card Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-50/50">
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-6">
            {questions.map((q, idx) => (
               <button
                 key={idx}
                 onClick={() => playDictationAudio(idx, q.word)}
                 className={`relative w-full aspect-square rounded-[1.5rem] md:rounded-[2rem] border-4 transition-all duration-300 flex flex-col items-center justify-center shadow-sm group p-2
                    ${isRevealed 
                       ? `bg-lime-50 border-lime-200 text-lime-800` 
                       : playedCards.includes(idx)
                          ? `bg-sky-50 border-sky-300 text-sky-600`
                          : `bg-white border-slate-200 text-slate-400 hover:border-sky-300 hover:shadow-md hover:-translate-y-1`
                    }
                 `}
               >
                 {isRevealed ? (
                    <div className="flex flex-col items-center justify-center h-full w-full animate-in zoom-in">
                        <SmartImage wordData={q} className="w-12 h-12 md:w-16 md:h-16 mb-1 md:mb-2 border-none shadow-none bg-transparent" emojiSize="text-3xl" />
                        <span className="text-xl md:text-3xl font-black tracking-tight">{q.word}</span>
                    </div>
                 ) : (
                    <>
                       <Volume2 size={40} className={`mb-2 md:w-12 md:h-12 ${playedCards.includes(idx) ? 'opacity-100' : 'opacity-40 group-hover:opacity-100 group-hover:text-sky-500 transition-opacity'}`} />
                       <span className="font-black text-sm md:text-lg">Word {idx + 1}</span>
                       {playedCards.includes(idx) && <CheckCircle className="absolute top-2 right-2 md:top-3 md:right-3 text-sky-500 bg-white rounded-full w-5 h-5 md:w-6 md:h-6" />}
                    </>
                 )}
               </button>
            ))}
         </div>
      </div>

      {/* Footer Area */}
      <div className="p-4 md:p-6 border-t-2 border-slate-50 flex justify-center bg-white shrink-0">
         {!isRevealed ? (
            <button 
              onClick={() => setIsRevealed(true)}
              disabled={playedCards.length === 0}
              className="w-full md:w-auto bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-lg md:text-xl py-4 px-12 rounded-2xl shadow-sm border-b-4 border-purple-700 active:border-b-0 active:translate-y-1 transition-all"
            >
               Reveal Answers
            </button>
         ) : (
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
               <button onClick={handleRetake} className="w-full md:w-auto bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-lg md:text-xl py-4 px-8 rounded-xl md:rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all">
                  <RotateCcw size={20} className="md:w-6 md:h-6" /> Play Again
               </button>
               <button onClick={() => setGameState('completed')} className="w-full md:w-auto bg-sky-500 hover:bg-sky-600 text-white font-black text-lg md:text-xl py-4 px-12 rounded-xl md:rounded-2xl shadow-sm border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                  Next Step <ArrowRight size={20} className="md:w-6 md:h-6" />
               </button>
            </div>
         )}
      </div>
    </div>
  )
}