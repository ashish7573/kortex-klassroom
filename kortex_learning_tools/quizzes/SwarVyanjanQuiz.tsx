"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Star, CheckCircle, XCircle, Trophy, ArrowRight, Play, Volume2, RotateCcw, FileEdit, Sparkles } from 'lucide-react';
import { HINDI_ASSETS, SUBTOPIC_MAP } from '@/kortex_library/SwarVyanjanDictionary';

// Helper to play procedural feedback sounds without needing external MP3s
const playFeedbackSound = (isCorrect: boolean) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (isCorrect) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); 
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.warn('Audio Context blocked or not supported');
  }
};

export default function SwarVyanjanQuiz({ lesson, onComplete = () => {} }: any) {
  const rawLetters = SUBTOPIC_MAP[lesson?.subtopicId] || [];
  
  const [gameState, setGameState] = useState<'start' | 'playing' | 'completed'>('start'); 
  const [questions, setQuestions] = useState<any[]>([]);
  
  // MCQ States
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [stars, setStars] = useState(0);
  
  // Dictation States
  const [playedCards, setPlayedCards] = useState<number[]>([]);
  const [currentlyPlayingIdx, setCurrentlyPlayingIdx] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Determine Quiz Mode
  const mode = useMemo(() => {
    const t = lesson?.title?.toLowerCase() || '';
    if (t.includes('श्रुतलेख')) return 'DICTATION';
    if (t.includes('आवाज़ से')) return 'AUDIO_TO_LETTER';
    if (t.includes('व्यंजन से चित्र') || (t.includes('चित्र पहचानो') && !t.includes('अक्षर'))) return 'LETTER_TO_IMAGE';
    return 'IMAGE_TO_LETTER'; // Default
  }, [lesson?.title]);

  // 2. Generate and Shuffle Questions on Mount
  useEffect(() => {
    if (!rawLetters.length) return;

    const validTargetLetters = rawLetters.filter((char: string) => {
      const hasImage = HINDI_ASSETS[char]?.examples?.length > 0 && !!HINDI_ASSETS[char].examples[0].image;
      if (mode === 'IMAGE_TO_LETTER' && !hasImage) return false;
      return true;
    });

    // ----------------------------------------------------
    // LOGIC A: GENERATE 10 CARDS FOR DICTATION MODE
    // ----------------------------------------------------
    if (mode === 'DICTATION') {
       let dictationList = validTargetLetters.map((char: string) => ({
           targetLetter: char,
           data: HINDI_ASSETS[char]
       }));

       // Pad/Duplicate the list until we have exactly 10 cards
       if (dictationList.length > 0) {
           while (dictationList.length < 10) {
               dictationList = [...dictationList, ...dictationList].slice(0, 10);
           }
       }
       
       setQuestions(dictationList.sort(() => 0.5 - Math.random()));
       return;
    }

    // ----------------------------------------------------
    // LOGIC B: GENERATE MCQ QUESTIONS FOR STANDARD QUIZ
    // ----------------------------------------------------
    const generated = validTargetLetters.map((targetLetter: string) => {
      const allChars = Object.keys(HINDI_ASSETS).filter(char => char.length <= 2 && HINDI_ASSETS[char]?.audio);
      
      const validDistractors = allChars.filter(char => {
        if (char === targetLetter) return false;
        if (mode === 'LETTER_TO_IMAGE') return HINDI_ASSETS[char]?.examples?.length > 0 && !!HINDI_ASSETS[char].examples[0].image;
        return true;
      });

      const distractors = validDistractors.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [targetLetter, ...distractors].sort(() => 0.5 - Math.random());
      
      const data = HINDI_ASSETS[targetLetter];
      const word = data?.examples?.[0]?.word || '';
      const english = data?.examples?.[0]?.english || '';
      const explanation = word ? `'${targetLetter}' से ${word} (${english})।` : `यह '${targetLetter}' है।`;

      return { targetLetter, options, explanation, data };
    });

    setQuestions(generated.sort(() => 0.5 - Math.random()));
  }, [lesson?.subtopicId, mode, rawLetters]);

  // 3. Star Calculation (For MCQ)
  useEffect(() => {
    if (gameState === 'completed' && questions.length > 0 && mode !== 'DICTATION') {
      let earnedStars = 1;
      if (score === questions.length) earnedStars = 3;
      else if (score >= questions.length * 0.7) earnedStars = 2;
      setStars(earnedStars);
    }
  }, [gameState, score, questions.length, mode]);

  const q = questions[currentQuestion];
  const progressPercentage = questions.length > 0 ? (currentQuestion / questions.length) * 100 : 0;

  // 4. TTS Hindi Voice Fallback
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

  // 5. Audio Handlers
  const playTargetAudio = () => {
    const audioUrl = q?.data?.audio;
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(() => {
          speakHindi(q.targetLetter);
        });
      }
    } else if (q?.targetLetter) {
      speakHindi(q.targetLetter);
    }
  };

  const playDictationAudio = (index: number, audioUrl: string) => {
    setCurrentlyPlayingIdx(index);
    const targetChar = questions[index]?.targetLetter || '';

    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => setCurrentlyPlayingIdx(null);
      audioRef.current.onerror = () => {
        speakHindi(targetChar);
      };
      audioRef.current.play().catch(() => {
        speakHindi(targetChar);
      });
    } else {
      speakHindi(targetChar);
    }

    if (!playedCards.includes(index)) {
      setPlayedCards(prev => [...prev, index]);
    }
  };

  // Auto-play for MCQ audio mode
  useEffect(() => {
    if (gameState === 'playing' && mode === 'AUDIO_TO_LETTER' && q?.data?.audio) {
      const timer = setTimeout(() => playTargetAudio(), 300);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, gameState, mode, q]);

  // General Handlers
  const handleStart = () => {
    if (questions.length === 0) return;
    setGameState('playing');
  };

  const handleRetake = () => {
    setGameState('start');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setStars(0);
    setPlayedCards([]);
    setCurrentlyPlayingIdx(null);
    setIsRevealed(false);
    setQuestions(prev => [...prev].sort(() => 0.5 - Math.random()));
  };

  const handleOptionClick = (option: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(option);
    setIsAnswerSubmitted(true);
    const isCorrect = option === q.targetLetter;
    playFeedbackSound(isCorrect);
    if (isCorrect) setScore(prev => prev + 1);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      setGameState('completed');
    }
  };

  const getOptionStyles = (option: string) => {
    if (!isAnswerSubmitted) return "border-slate-100 text-slate-700 bg-white hover:border-sky-500 hover:bg-sky-50 hover:shadow-xs active:scale-95";
    if (option === q.targetLetter) return "border-lime-500 bg-lime-100 text-lime-800 z-10 shadow-xs";
    if (option === selectedAnswer && option !== q.targetLetter) return "border-rose-500 bg-rose-100 text-rose-800 z-10 shadow-xs";
    return "border-slate-100 text-slate-400 bg-slate-50 opacity-40 cursor-not-allowed";
  };

  if (!rawLetters.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center font-bold text-rose-500">
        Error: Subtopic Data Not Found
      </div>
    );
  }

  // ==========================================
  // RENDER: START SCREEN (Zero-Scroll Responsive Fit)
  // ==========================================
  if (gameState === 'start') {
    return (
      <div className="w-full h-full max-w-3xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-100 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center overflow-hidden">
        
        {/* Animated Icon Circle */}
        <div className="bg-sky-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-inner overflow-hidden border-4 border-sky-50 shrink-0">
          {mode === 'DICTATION' ? (
            <FileEdit className="w-8 h-8 sm:w-10 sm:h-10 text-sky-500 animate-pulse" />
          ) : mode === 'AUDIO_TO_LETTER' ? (
            <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 text-sky-500 animate-pulse" />
          ) : (
            <img 
              src={questions[0]?.data?.examples?.[0]?.image || '/logo.svg'} 
              alt="Welcome" 
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-sm" 
            />
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1.5 shrink-0">
          {lesson?.title || 'स्वर व व्यंजन अभ्यास'}
        </h2>

        <p className="text-xs sm:text-sm md:text-base font-bold text-slate-500 mb-4 sm:mb-6 max-w-md shrink-0">
          {mode === 'DICTATION'
            ? 'Listen to the sound and write the letter in your notebook!'
            : mode === 'AUDIO_TO_LETTER'
              ? 'Listen to the sound and choose the correct letter!'
              : mode === 'LETTER_TO_IMAGE'
                ? 'Look at the letter and find its matching picture!'
                : 'Look at the picture and choose the correct starting letter!'}
        </p>

        {/* Feature Highlights Box */}
        <div className="w-full max-w-md bg-sky-50/80 border-2 border-sky-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 text-left space-y-1.5 text-xs sm:text-sm font-bold text-sky-900 shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0">1</span>
            <span>{mode === 'DICTATION' ? 'कॉपी और पेंसिल तैयार रखें' : 'ध्वनि और चित्र को ध्यान से समझें'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0">2</span>
            <span>{mode === 'DICTATION' ? 'कार्ड पर टैप करके आवाज़ सुनें' : 'सही विकल्प चुनें और अंक पाएं'}</span>
          </div>
        </div>

        <button 
          onClick={handleStart} 
          disabled={questions.length === 0} 
          className="w-full sm:w-auto bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-black text-sm sm:text-base md:text-lg py-3 sm:py-3.5 px-8 sm:px-12 rounded-xl sm:rounded-2xl shadow-md border-b-4 border-sky-700 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
        >
          <Play className="fill-white w-4 h-4 sm:w-5 sm:h-5" /> 
          <span>{questions.length === 0 ? 'No Questions' : 'Start Lesson'}</span>
        </button>
      </div>
    );
  }

  // ==========================================
  // RENDER: DICTATION MODE (श्रुतलेख — Zero-Scroll Mobile Fit)
  // ==========================================
  if (mode === 'DICTATION' && gameState === 'playing') {
    return (
      <div className="w-full h-full max-w-5xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden">
        <audio ref={audioRef} />
        
        {/* 1. Header Bar */}
        <div className="px-3 sm:px-6 py-2 sm:py-2.5 border-b-2 border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
           <div className="flex items-center gap-2 min-w-0">
             <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0">
                <FileEdit size={16} />
             </div>
             <div className="min-w-0">
               <h2 className="text-sm sm:text-lg md:text-xl font-black text-slate-800 leading-tight truncate">
                 {lesson?.title || 'श्रुतलेख'}
               </h2>
               <p className="text-[10px] sm:text-xs text-slate-500 font-bold leading-none hidden sm:block">
                 Tap the cards to listen. Write answers in your notebook!
               </p>
             </div>
           </div>

           {/* Counter Pill */}
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

        {/* 2. 10 Card Grid (Fits seamlessly on Mobile in 2 cols x 5 rows without scrolling!) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 md:p-6 bg-slate-50/40 flex flex-col justify-center">
           <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 md:gap-4 max-w-4xl mx-auto w-full">
              {questions.map((qItem, idx) => {
                 const isPlaying = currentlyPlayingIdx === idx;
                 const isPlayed = playedCards.includes(idx);

                 return (
                   <button
                     key={idx}
                     onClick={() => playDictationAudio(idx, qItem.data?.audio)}
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
                     title={isRevealed ? qItem.targetLetter : `Play Card ${idx + 1}`}
                   >
                     {isRevealed ? (
                        // REVEALED: Big Bold Hindi Letter
                        <div className="flex items-center sm:flex-col sm:justify-center w-full h-full gap-2 sm:gap-1 animate-in zoom-in-95 duration-200">
                          <span className="text-2xl sm:text-4xl md:text-5xl font-black text-lime-950 block">
                            {qItem.targetLetter}
                          </span>
                          {qItem.data?.examples?.[0]?.word && (
                            <span className="text-[10px] sm:text-xs font-bold text-lime-800/80 hidden sm:block truncate">
                              ({qItem.data.examples[0].word})
                            </span>
                          )}
                        </div>
                     ) : (
                        // UNREVEALED: Audio Speaker & Card Number
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
                              Card {idx + 1}
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 block truncate">
                              अक्षर {idx + 1}
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
                   onClick={() => onComplete({ score: 10, maxScore: 10, stars: 3 })} 
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

  // ==========================================
  // RENDER: COMPLETED SCREEN (Zero-Scroll Responsive Fit)
  // ==========================================
  if (gameState === 'completed') {
    return (
      <div className="w-full h-full max-w-3xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-100 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="bg-sky-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 border-4 border-sky-100 shadow-inner shrink-0">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-sky-500 animate-bounce" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1 shrink-0">
          Quiz Complete!
        </h2>
        <p className="text-xs sm:text-sm md:text-base font-bold text-slate-500 mb-4 shrink-0">
          You scored {score} out of {questions.length}
        </p>
        
        <div className="flex space-x-2 sm:space-x-3 mb-5 shrink-0">
          {[1, 2, 3].map((starIndex) => (
            <Star 
              key={starIndex} 
              className={`w-9 h-9 sm:w-12 sm:h-12 transition-all duration-500 transform ${
                starIndex <= stars 
                  ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-md' 
                  : 'text-slate-200 fill-slate-100 scale-100'
              }`} 
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 w-full sm:w-auto shrink-0">
          <button 
            onClick={handleRetake} 
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm md:text-base py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 border-2 border-slate-200 active:scale-95"
          >
            <RotateCcw size={18} className="text-slate-400" />
            <span>Retake Quiz</span>
          </button>
          
          <button 
            onClick={() => onComplete({ score, maxScore: questions.length, stars })} 
            className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white font-black text-xs sm:text-sm md:text-base py-2.5 sm:py-3 px-8 sm:px-10 rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 border-b-4 border-sky-700 active:translate-y-1 active:border-b-0"
          >
            <span>Continue to Next Step</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: PLAYING SCREEN (MCQ — Responsive Dual-Pane Layout)
  // ==========================================
  return (
    <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden">
      <audio ref={audioRef} />
      
      {/* 1. Progress Header */}
      <div className="px-3 sm:px-6 pt-2 sm:pt-4 pb-1.5 sm:pb-2.5 shrink-0 border-b-2 border-slate-50 bg-slate-50/40">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-slate-500 font-black text-[11px] sm:text-xs uppercase tracking-wider truncate">
            {lesson?.title || 'अभ्यास'}
          </span>
          <span className="text-[11px] sm:text-xs font-black text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 shrink-0">
            {currentQuestion + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-slate-200/70 h-1.5 sm:h-2 rounded-full overflow-hidden">
          <div 
            className="bg-sky-500 h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }} 
          />
        </div>
      </div>

      {/* 2. Main MCQ Interaction Area (Side-by-side on desktop, stacked & compact on mobile) */}
      <div className="flex-1 min-h-0 px-2 sm:px-4 md:px-8 py-2 md:py-4 flex flex-col md:flex-row gap-2 sm:gap-4 md:gap-6 items-center justify-center overflow-hidden">
        
        {/* Left / Top: Question Prompt Box */}
        <div className="w-full md:w-1/2 h-28 sm:h-36 md:h-full max-h-56 md:max-h-none flex flex-col items-center justify-center bg-slate-50 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-slate-100 p-2 sm:p-4 shrink-0 shadow-xs">
          {mode === 'IMAGE_TO_LETTER' && (
            <img 
              src={q?.data?.examples?.[0]?.image} 
              alt="Question" 
              className="h-full max-h-24 sm:max-h-32 md:max-h-56 object-contain drop-shadow-md" 
            />
          )}
          {mode === 'AUDIO_TO_LETTER' && (
            <button 
              onClick={playTargetAudio} 
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-36 md:h-36 bg-white rounded-full shadow-md border-4 sm:border-6 border-sky-100 flex items-center justify-center group hover:scale-105 active:scale-95 transition-all"
              title="Replay Sound"
            >
              <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-18 md:h-18 text-sky-500 group-hover:animate-pulse" />
            </button>
          )}
          {mode === 'LETTER_TO_IMAGE' && (
            <span className={`text-6xl sm:text-7xl md:text-8xl font-black ${q?.data?.theme || 'text-slate-800'}`}>
              {q?.targetLetter}
            </span>
          )}
        </div>

        {/* Right / Bottom: 4 Options Grid & Feedback */}
        <div className="w-full md:w-1/2 flex flex-col justify-center min-h-0">
          
          {/* 2x2 Options Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3">
            {q?.options?.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={isAnswerSubmitted}
                className={`
                  relative py-2 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl border-2 md:border-3 transition-all duration-150 
                  flex items-center justify-center h-14 sm:h-18 md:h-24 select-none cursor-pointer
                  ${getOptionStyles(option)}
                `}
              >
                {mode === 'LETTER_TO_IMAGE' ? (
                  <img 
                    src={HINDI_ASSETS[option]?.examples?.[0]?.image} 
                    className="h-full max-h-10 sm:max-h-12 md:max-h-16 object-contain" 
                    alt="option" 
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black">
                    {option}
                  </span>
                )}
                {isAnswerSubmitted && option === q.targetLetter && (
                  <CheckCircle className="absolute top-1.5 right-1.5 w-4 h-4 sm:w-5 sm:h-5 text-lime-600 bg-white rounded-full z-20 shadow-xs" />
                )}
                {isAnswerSubmitted && selectedAnswer === option && option !== q.targetLetter && (
                  <XCircle className="absolute top-1.5 right-1.5 w-4 h-4 sm:w-5 sm:h-5 text-rose-600 bg-white rounded-full z-20 shadow-xs" />
                )}
              </button>
            ))}
          </div>

          {/* Feedback Banner & Next Question Button */}
          <div className="mt-2 min-h-[50px] sm:min-h-[58px] flex flex-col justify-center">
            {isAnswerSubmitted ? (
              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                <div className={`flex-1 py-1.5 px-2.5 rounded-xl border-2 font-bold flex items-center gap-1.5 text-xs sm:text-sm ${
                  selectedAnswer === q.targetLetter 
                    ? 'bg-lime-50 border-lime-200 text-lime-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="shrink-0">
                    {selectedAnswer === q.targetLetter ? (
                      <CheckCircle className="w-4 h-4 text-lime-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-black">
                      {selectedAnswer === q.targetLetter ? 'बिल्कुल सही!' : 'गलत उत्तर!'}
                    </span>
                    <span className="text-[10px] sm:text-xs opacity-80 ml-1.5 hidden sm:inline">
                      {q.explanation}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleNextQuestion} 
                  className="bg-sky-500 hover:bg-sky-600 text-white font-black text-xs sm:text-sm py-2 px-4 sm:px-6 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 shrink-0 active:scale-95 border-b-2 border-sky-700"
                >
                  <span>{currentQuestion < questions.length - 1 ? 'Next' : 'Results'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="text-center text-[11px] sm:text-xs text-slate-400 font-bold py-1">
                चारों में से सही विकल्प पर टैप करें (Tap the correct option)
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}