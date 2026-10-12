"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Play, Trophy, ArrowRight, Volume2, RotateCcw, FileEdit, CheckCircle, Star, Sparkles, BookOpen } from 'lucide-react';
import { getWordsForSubtopic, getWordData, HINDI_WORDS } from '@/kortex_library/HindiWordDictionary';
import { HINDI_ASSETS, getBarahkhadiAudio } from '@/kortex_library/SwarVyanjanDictionary';

// --- HELPER: Smart Image Fallback with Error Reset ---
const SmartImage = ({ wordData, className, emojiSize }: { wordData: any, className: string, emojiSize: string }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [wordData?.imageUrl, wordData?.word]);

  if (hasError || !wordData?.imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-xl shadow-xs ${className}`}>
        <span className={emojiSize}>{wordData?.emoji || '🖼️'}</span>
      </div>
    );
  }
  return (
    <img 
      src={wordData.imageUrl} 
      alt={wordData.english || wordData.word || 'Word'} 
      onError={() => setHasError(true)}
      className={`object-contain bg-white rounded-xl shadow-xs ${className}`}
    />
  );
};

export default function HindiWordDictation({ lesson, onComplete = () => {} }: any) {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'completed'>('start'); 
  const [questions, setQuestions] = useState<any[]>([]);
  const [playedCards, setPlayedCards] = useState<number[]>([]);
  const [currentlyPlayingIdx, setCurrentlyPlayingIdx] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Generate 10 Random Words for Dictation
  useEffect(() => {
    const subtopicId = lesson?.subtopicId || lesson?.routePath?.split('/').pop() || '';
    let pool: any[] = [];

    // ==========================================
    // SMART ROUTER ENGINE
    // ==========================================
    
    // Chapter 5 (Barahkhadi) - Pulls from dictionary
    if (subtopicId.includes('barahkhadi')) {
        pool = Object.keys(HINDI_WORDS).map(w => getWordData(w)).filter(Boolean);
    } 
    // Chapter 4 (Matra) - Pulls specific matra words
    else if (subtopicId.includes('matra')) {
        const dictionaryKey = subtopicId.replace('dictation-', 'wb-');
        pool = getWordsForSubtopic(dictionaryKey);
    } 
    // Chapter 3 (Amatrik) - Pulls based on word length
    else {
        let wordLength = 2; 
        if (lesson?.subtopic && lesson.subtopic.includes('3')) wordLength = 3;
        if (lesson?.subtopic && lesson.subtopic.includes('4')) wordLength = 4;
        const dictionaryKey = `word-builder-${wordLength}`;
        pool = getWordsForSubtopic(dictionaryKey);
    }

    if (pool.length === 0) return;

    // Shuffle and pick 10 words
    let selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);
    
    // Pad the array if the dictionary has fewer than 10 words
    while (selected.length > 0 && selected.length < 10) {
        selected = [...selected, ...selected].slice(0, 10);
    }
    
    setQuestions(selected);
  }, [lesson]);

  // Hindi TTS Fallback if audio files are missing
  const speakHindi = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.8;
      utterance.onend = () => setCurrentlyPlayingIdx(null);
      utterance.onerror = () => setCurrentlyPlayingIdx(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setCurrentlyPlayingIdx(null);
    }
  };

  // 2. Audio Handler (Universal Bulletproof Engine)
  const playDictationAudio = (idx: number, wordText: string) => {
    if (!wordText) return;
    setCurrentlyPlayingIdx(idx);
    
    try {
        let audioPath = '';

        // 1. Is it a base Swar or Vyanjan?
        if (HINDI_ASSETS[wordText]) {
            audioPath = HINDI_ASSETS[wordText].audio;
        } 
        // 2. Is it a Barahkhadi syllable?
        else {
            const bPath = getBarahkhadiAudio(wordText);
            if (bPath) {
                audioPath = bPath;
            } else {
                // 3. Fallback for full words
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

            audio.onended = () => setCurrentlyPlayingIdx(null);
            
            // Bulletproof Fallback just in case of extension mismatch
            audio.onerror = () => {
                const fallbackPath = audioPath.endsWith('.m4a') 
                    ? audioPath.replace('.m4a', '.mp3') 
                    : audioPath.replace('.mp3', '.m4a');
                    
                const fallbackAudio = new Audio(fallbackPath);
                activeAudioRef.current = fallbackAudio;
                fallbackAudio.onended = () => setCurrentlyPlayingIdx(null);
                fallbackAudio.play().catch(() => {
                  speakHindi(wordText);
                });
            };

            audio.play().catch(() => {
              speakHindi(wordText);
            });
        } else {
            speakHindi(wordText);
        }
    } catch (error) {
        console.error("Audio playback error:", error);
        speakHindi(wordText);
    }
    
    // Mark card as played
    if (!playedCards.includes(idx)) {
      setPlayedCards(prev => [...prev, idx]);
    }
  };

  const handleRetake = () => {
    setGameState('start');
    setPlayedCards([]);
    setCurrentlyPlayingIdx(null);
    setIsRevealed(false);
    setQuestions(prev => [...prev].sort(() => 0.5 - Math.random()));
  };

  if (questions.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center font-bold text-rose-500">
        शब्द डिक्शनरी लोड नहीं हो सकी (Dictionary Words Not Found)
      </div>
    );
  }

  // ==========================================
  // RENDER: START SCREEN (Zero-Scroll Responsive Fit)
  // ==========================================
  if (gameState === 'start') {
    return (
      <div className="w-full h-full max-w-3xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-100 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center overflow-hidden">
        
        {/* Animated Icon */}
        <div className="bg-sky-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-inner border-4 border-sky-50 shrink-0">
          <FileEdit className="w-8 h-8 sm:w-10 sm:h-10 text-sky-500 animate-pulse" />
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1.5 shrink-0">
          {lesson?.title || 'श्रुतलेख (Dictation)'}
        </h2>
        
        <p className="text-xs sm:text-sm md:text-base font-bold text-slate-500 mb-4 max-w-md shrink-0">
          Listen to each word carefully and write it down in your notebook!
        </p>

        {/* Instructions Badge */}
        <div className="w-full max-w-md bg-sky-50/80 border-2 border-sky-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 text-left space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-bold text-sky-900 shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0">1</span>
            <span>कॉपी और पेंसिल तैयार रखें (Keep notebook & pencil ready)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0">2</span>
            <span>कार्ड पर टैप करके शब्द सुनें (Tap each card to listen)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0">3</span>
            <span>अंत में उत्तर देखकर जांचें (Reveal answers to check spelling)</span>
          </div>
        </div>

        <button 
          onClick={() => setGameState('playing')} 
          className="w-full sm:w-auto bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-black text-sm sm:text-base md:text-lg py-3 sm:py-3.5 px-8 sm:px-12 rounded-xl sm:rounded-2xl shadow-md border-b-4 border-sky-700 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Play className="fill-white w-4 h-4 sm:w-5 sm:h-5" /> श्रुतलेख शुरू करें (Start Dictation)
        </button>
      </div>
    );
  }

  // ==========================================
  // RENDER: COMPLETED SCREEN (Zero-Scroll Responsive Fit)
  // ==========================================
  if (gameState === 'completed') {
    return (
      <div className="w-full h-full max-w-3xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-100 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="bg-emerald-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 border-4 border-emerald-100 shadow-inner shrink-0">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500 animate-bounce" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1 shrink-0">
          शानदार काम! (Great Job!)
        </h2>
        <p className="text-xs sm:text-sm md:text-base font-bold text-slate-500 mb-4 shrink-0">
          You successfully completed all 10 dictation words.
        </p>
        
        <div className="flex space-x-2 sm:space-x-3 mb-5 shrink-0">
          {[1, 2, 3].map((starIndex) => (
            <Star key={starIndex} className="w-9 h-9 sm:w-12 sm:h-12 text-amber-400 fill-amber-400 drop-shadow-md animate-pulse" />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 w-full sm:w-auto shrink-0">
          <button 
            onClick={handleRetake} 
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm md:text-base py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 border-2 border-slate-200 active:scale-95"
          >
            <RotateCcw size={18} className="text-slate-400" />
            <span>फिर से करें (Play Again)</span>
          </button>
          
          <button 
            onClick={() => onComplete({ score: 10, stars: 3, maxScore: 10 })} 
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm md:text-base py-2.5 sm:py-3 px-8 sm:px-10 rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 border-b-4 border-emerald-700 active:translate-y-1 active:border-b-0"
          >
            <span>अध्याय पूरा करें (Finish Lesson)</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: PLAYING SCREEN (Responsive 10-Card Board)
  // ==========================================
  return (
    <div className="w-full h-full max-w-5xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden">
      
      {/* 1. Header Bar */}
      <div className="px-3 sm:px-6 py-2 sm:py-2.5 border-b-2 border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
         <div className="flex items-center gap-2 min-w-0">
           <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0">
              <FileEdit size={16} />
           </div>
           <div className="min-w-0">
             <h2 className="text-sm sm:text-lg md:text-xl font-black text-slate-800 leading-tight truncate">
               {lesson?.title || 'श्रुतलेख (Dictation)'}
             </h2>
             <p className="text-[10px] sm:text-xs text-slate-500 font-bold leading-none hidden sm:block">
               Listen to the sound and write the words in your notebook!
             </p>
           </div>
         </div>

         {/* Listened Counter Pill */}
         <div className="flex items-center gap-1.5 bg-white border-2 border-slate-200 px-2.5 sm:px-3 py-1 rounded-full shadow-xs shrink-0">
            <span className={`w-2 h-2 rounded-full ${playedCards.length === 10 ? 'bg-emerald-500' : 'bg-sky-500 animate-pulse'}`}></span>
            <span className="text-[11px] sm:text-xs font-black text-slate-700">
              {playedCards.length} / 10
            </span>
            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
              सुने गए
            </span>
         </div>
      </div>

      {/* 2. The 10 Card Grid (Fits seamlessly on Mobile in 2 cols x 5 rows without scrolling!) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 md:p-6 bg-slate-50/40 flex flex-col justify-center">
         <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 md:gap-4 max-w-4xl mx-auto w-full">
            {questions.map((q, idx) => {
               const isPlaying = currentlyPlayingIdx === idx;
               const isPlayed = playedCards.includes(idx);

               return (
                 <button
                   key={idx}
                   onClick={() => playDictationAudio(idx, q.word)}
                   className={`relative w-full h-12 sm:h-auto sm:aspect-square rounded-xl sm:rounded-2xl border-2 sm:border-3 transition-all duration-200 flex items-center sm:flex-col sm:justify-center shadow-xs group px-2 sm:p-2 cursor-pointer select-none active:scale-95
                      ${isRevealed 
                         ? 'bg-lime-50 border-lime-300 text-lime-900 shadow-xs' 
                         : isPlaying
                            ? 'bg-sky-100 border-sky-500 text-sky-800 ring-2 ring-sky-300 shadow-md scale-[1.02]'
                            : isPlayed
                               ? 'bg-sky-50/80 border-sky-200 text-sky-700'
                               : 'bg-white border-slate-200 text-slate-500 hover:border-sky-300 hover:bg-slate-50'
                      }
                   `}
                   title={isRevealed ? q.word : `Play Word ${idx + 1}`}
                 >
                   {isRevealed ? (
                      // REVEALED STATE: Shows Picture & Hindi Word
                      <div className="flex items-center sm:flex-col sm:justify-center w-full h-full gap-2 sm:gap-1 animate-in zoom-in-95 duration-200">
                          <SmartImage 
                            wordData={q} 
                            className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 border-none shadow-none bg-transparent shrink-0" 
                            emojiSize="text-xl sm:text-2xl md:text-3xl" 
                          />
                          <div className="flex-1 sm:flex-initial text-left sm:text-center min-w-0">
                            <span className="text-sm sm:text-base md:text-xl font-black tracking-tight text-lime-950 block truncate">
                              {q.word}
                            </span>
                            {q.english && (
                              <span className="text-[9px] sm:text-[10px] font-bold text-lime-700/80 block truncate">
                                {q.english}
                              </span>
                            )}
                          </div>
                      </div>
                   ) : (
                      // UNREVEALED STATE: Audio Speaker & Word Number
                      <div className="flex items-center sm:flex-col sm:justify-center w-full h-full gap-2 sm:gap-1">
                          <div className={`w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isPlaying 
                                ? 'bg-sky-500 text-white animate-pulse' 
                                : isPlayed 
                                    ? 'bg-sky-100 text-sky-600' 
                                    : 'bg-slate-100 text-slate-400 group-hover:text-sky-500 group-hover:bg-sky-50'
                          }`}>
                            <Volume2 size={16} className="sm:hidden" />
                            <Volume2 size={24} className="hidden sm:block md:hidden" />
                            <Volume2 size={28} className="hidden md:block" />
                          </div>

                          <div className="flex-1 sm:flex-initial text-left sm:text-center min-w-0">
                            <span className="font-black text-xs sm:text-sm md:text-base text-slate-700 block truncate">
                              Word {idx + 1}
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 block truncate">
                              शब्द {idx + 1}
                            </span>
                          </div>

                          {/* Listened Checkmark Badge */}
                          {isPlayed && (
                            <div className="sm:absolute sm:top-1.5 sm:right-1.5 shrink-0">
                              <CheckCircle className="text-emerald-500 bg-white rounded-full w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 shadow-xs" />
                            </div>
                          )}
                      </div>
                   )}
                 </button>
               );
            })}
         </div>
      </div>

      {/* 3. Action Footer Bar */}
      <div className="p-2 sm:p-3 md:p-4 border-t-2 border-slate-100 flex justify-center bg-white shrink-0">
         {!isRevealed ? (
            <button 
              onClick={() => setIsRevealed(true)}
              disabled={playedCards.length === 0}
              className={`w-full sm:w-auto font-black text-xs sm:text-sm md:text-base py-2.5 sm:py-3 px-6 sm:px-12 rounded-xl sm:rounded-2xl shadow-sm border-b-4 transition-all flex items-center justify-center gap-2 ${
                playedCards.length > 0
                  ? 'bg-purple-600 hover:bg-purple-500 border-purple-800 text-white active:translate-y-1 active:border-b-0'
                  : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-70'
              }`}
            >
               <Sparkles size={16} />
               <span>उत्तर देखें (Reveal Answers)</span>
               {playedCards.length < 10 && (
                  <span className="text-[10px] sm:text-xs opacity-80 font-normal">
                    ({playedCards.length}/10 सुने गए)
                  </span>
               )}
            </button>
         ) : (
            <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto justify-center">
               <button 
                 onClick={handleRetake} 
                 className="flex-1 sm:flex-initial bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm md:text-base py-2 sm:py-2.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
               >
                  <RotateCcw size={16} className="text-slate-400" /> 
                  <span>Play Again</span>
               </button>
               
               <button 
                 onClick={() => setGameState('completed')} 
                 className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm md:text-base py-2 sm:py-2.5 px-6 sm:px-10 rounded-xl sm:rounded-2xl shadow-sm border-b-4 border-emerald-700 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-1.5"
               >
                  <span>Next Step</span> 
                  <ArrowRight size={16} />
               </button>
            </div>
         )}
      </div>

    </div>
  );
}