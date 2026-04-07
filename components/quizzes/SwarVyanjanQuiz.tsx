import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Star, CheckCircle, XCircle, Trophy, ArrowRight, Play, Volume2, RotateCcw, FileEdit } from 'lucide-react';
import { HINDI_ASSETS, SUBTOPIC_MAP } from '@/lib/SwarVyanjanDictionary';

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
  const rawLetters = SUBTOPIC_MAP[lesson.subtopicId] || [];
  
  const [gameState, setGameState] = useState('start'); 
  const [questions, setQuestions] = useState<any[]>([]);
  
  // MCQ States
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [stars, setStars] = useState(0);
  
  // Dictation States
  const [playedCards, setPlayedCards] = useState<number[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Determine Quiz Mode (NEW DICTATION MODE ADDED)
  const mode = useMemo(() => {
    const t = lesson.title?.toLowerCase() || '';
    if (t.includes('श्रुतलेख')) return 'DICTATION';
    if (t.includes('आवाज़ से')) return 'AUDIO_TO_LETTER';
    if (t.includes('व्यंजन से चित्र') || (t.includes('चित्र पहचानो') && !t.includes('अक्षर'))) return 'LETTER_TO_IMAGE';
    return 'IMAGE_TO_LETTER'; // Default
  }, [lesson.title]);

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
  }, [lesson.subtopicId, mode, rawLetters]);

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

  // 4. Audio Handlers
  const playTargetAudio = () => {
    if (q?.data?.audio && audioRef.current) {
      audioRef.current.src = q.data.audio;
      audioRef.current.play().catch(e => console.warn("Audio blocked"));
    }
  };

  const playDictationAudio = (index: number, audioUrl: string) => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(e => console.warn("Audio blocked"));
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
    if (!isAnswerSubmitted) return "border-slate-100 text-slate-700 bg-white hover:border-sky-500 hover:bg-sky-50 hover:shadow-sm hover:-translate-y-1";
    if (option === q.targetLetter) return "border-lime-500 bg-lime-100 text-lime-800 z-10 shadow-sm";
    if (option === selectedAnswer && option !== q.targetLetter) return "border-rose-500 bg-rose-100 text-rose-800 z-10 shadow-sm";
    return "border-slate-100 text-slate-400 bg-slate-50 opacity-50 cursor-not-allowed";
  };

  if (!rawLetters.length) return <div className="p-10 text-center font-bold text-rose-500">Error: Subtopic Data Not Found</div>;
  if (questions.length === 0 && gameState !== 'start') return <div className="p-10 text-center font-bold text-slate-500">No valid questions available for this quiz format.</div>;


  // ==========================================
  // RENDER: START SCREEN
  // ==========================================
  if (gameState === 'start') {
    return (
      <div className="w-full h-full min-h-[500px] max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="bg-sky-100 w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-inner overflow-hidden border-4 border-sky-50">
          {mode === 'DICTATION' ? <FileEdit className="w-16 h-16 text-sky-500" /> : mode === 'AUDIO_TO_LETTER' ? <Volume2 className="w-16 h-16 text-sky-500" /> : <img src={questions[0]?.data?.examples?.[0]?.image || '/logo.svg'} alt="Welcome" className="w-20 h-20 object-contain drop-shadow-md" />}
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4">{lesson.title}</h2>
        <p className="text-base md:text-xl font-bold text-slate-500 mb-8 max-w-lg">
          {mode === 'DICTATION' ? 'Listen to the sound and write the letter in your notebook!' : mode === 'AUDIO_TO_LETTER' ? 'Listen to the sound and choose the correct letter!' : 'Look at the picture and choose the correct starting letter!'}
        </p>
        <button onClick={handleStart} disabled={questions.length === 0} className="w-full md:w-auto bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-xl md:text-2xl py-4 px-12 rounded-2xl shadow-lg shadow-sky-200 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
          <Play className="fill-white w-6 h-6" /> {questions.length === 0 ? 'No Questions' : 'Start Lesson'}
        </button>
      </div>
    );
  }

  // ==========================================
  // RENDER: DICTATION MODE (श्रुतलेख)
  // ==========================================
  if (mode === 'DICTATION' && gameState === 'playing') {
    return (
      <div className="w-full h-full max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden">
        <audio ref={audioRef} />
        
        {/* Header */}
        <div className="px-6 md:px-10 pt-6 pb-4 border-b-2 border-slate-50 flex justify-between items-center shrink-0">
           <div>
             <h2 className="text-2xl md:text-3xl font-black text-slate-800">{lesson.title}</h2>
             <p className="text-slate-500 font-bold text-sm md:text-base mt-1">Tap the cards to listen. Write answers in your notebook!</p>
           </div>
           <button onClick={() => onComplete({score: 10, stars: 3})} className="hidden md:flex px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors items-center gap-2">
             Close Lesson <ArrowRight size={18}/>
           </button>
        </div>

        {/* 10 Card Grid */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/50">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
              {questions.map((q, idx) => (
                 <button
                   key={idx}
                   onClick={() => playDictationAudio(idx, q.data?.audio)}
                   className={`relative w-full aspect-square rounded-[2rem] border-4 transition-all duration-300 flex flex-col items-center justify-center shadow-sm group
                      ${isRevealed 
                         ? `bg-lime-50 border-lime-200 text-lime-700` 
                         : playedCards.includes(idx)
                            ? `bg-sky-50 border-sky-300 text-sky-600`
                            : `bg-white border-slate-200 text-slate-400 hover:border-sky-300 hover:shadow-md hover:-translate-y-1`
                      }
                   `}
                 >
                   {isRevealed ? (
                      <span className="text-6xl md:text-7xl font-black animate-in zoom-in">{q.targetLetter}</span>
                   ) : (
                      <>
                         <Volume2 size={48} className={`mb-2 ${playedCards.includes(idx) ? 'opacity-100' : 'opacity-40 group-hover:opacity-100 group-hover:text-sky-500 transition-opacity'}`} />
                         <span className="font-black text-xl">Card {idx + 1}</span>
                         {playedCards.includes(idx) && <CheckCircle className="absolute top-3 right-3 text-sky-500 bg-white rounded-full" size={24} />}
                      </>
                   )}
                 </button>
              ))}
           </div>
        </div>

        {/* Footer Area */}
        <div className="p-6 border-t-2 border-slate-50 flex justify-center bg-white shrink-0">
           {!isRevealed ? (
              <button 
                onClick={() => setIsRevealed(true)}
                disabled={playedCards.length === 0}
                className="w-full md:w-auto bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-xl py-4 px-12 rounded-2xl shadow-sm border-b-4 border-purple-700 active:border-b-0 active:translate-y-1 transition-all"
              >
                 Reveal Answers
              </button>
           ) : (
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                 <button onClick={handleRetake} className="w-full md:w-auto bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xl py-4 px-8 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all">
                    <RotateCcw size={24} /> Play Again
                 </button>
                 <button onClick={() => onComplete({score: 10, stars: 3})} className="w-full md:w-auto bg-sky-500 hover:bg-sky-600 text-white font-black text-xl py-4 px-12 rounded-2xl shadow-sm border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                    Next Step <ArrowRight size={24} />
                 </button>
              </div>
           )}
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER: COMPLETED SCREEN (MCQ)
  // ==========================================
  if (gameState === 'completed') {
    return (
      <div className="w-full h-full min-h-[500px] max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-6 md:p-12 flex flex-col items-center justify-center text-center overflow-y-auto">
        <div className="bg-sky-50 p-6 rounded-full mb-6 border-4 border-sky-100">
          <Trophy className="w-16 h-16 md:w-20 md:h-20 text-sky-500" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">Quiz Complete!</h2>
        <p className="text-lg md:text-xl font-bold text-slate-500 mb-8">You scored {score} out of {questions.length}</p>
        <div className="flex space-x-2 md:space-x-4 mb-10">
          {[1, 2, 3].map((starIndex) => (
            <Star key={starIndex} className={`w-12 h-12 md:w-16 md:h-16 transition-all duration-500 transform ${starIndex <= stars ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-md' : 'text-slate-200 fill-slate-100 scale-100'}`} />
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button onClick={handleRetake} className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold text-lg md:text-xl py-4 px-8 rounded-xl md:rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2 border-2 border-slate-200">
            <RotateCcw className="w-6 h-6 text-slate-400" /><span>Retake Quiz</span>
          </button>
          <button onClick={() => onComplete({ score, stars })} className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg md:text-xl py-4 px-12 rounded-xl md:rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2 border-b-4 border-sky-700 active:border-b-0 active:translate-y-1">
            <span>Continue to Next Step</span><ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: PLAYING SCREEN (MCQ)
  // ==========================================
  return (
    <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden">
      <audio ref={audioRef} />
      
      {/* Progress Header */}
      <div className="px-4 md:px-8 pt-3 md:pt-6 pb-2 md:pb-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-2 md:mb-3">
          <span className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-wider">{lesson.title}</span>
          <span className="text-xs md:text-sm font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100 shrink-0">
            {currentQuestion + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 md:h-3 rounded-full overflow-hidden">
          <div className="bg-sky-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 md:px-8 py-2 md:py-6 flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-center">
        
        <div className={`w-full md:w-1/2 md:h-full flex flex-col items-center justify-center bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-100 py-8 px-4 flex-shrink-0 md:flex-shrink min-h-[250px]`}>
          {mode === 'IMAGE_TO_LETTER' && (
            <img src={q.data?.examples?.[0]?.image} alt="Question" className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-xl" />
          )}
          {mode === 'AUDIO_TO_LETTER' && (
            <button onClick={playTargetAudio} className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-full shadow-xl border-8 border-sky-100 flex items-center justify-center group hover:scale-105 transition-all active:scale-95">
              <Volume2 className="w-16 h-16 md:w-24 md:h-24 text-sky-500 group-hover:animate-pulse" />
            </button>
          )}
          {mode === 'LETTER_TO_IMAGE' && (
            <span className={`text-8xl md:text-[9rem] font-black ${q.data?.theme || 'text-slate-800'}`}>{q.targetLetter}</span>
          )}
        </div>

        <div className="w-full md:w-1/2 flex flex-col space-y-4 md:space-y-2 lg:space-y-3">
          <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
            {q.options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={isAnswerSubmitted}
                className={`
                  relative py-3 lg:py-4 rounded-xl md:rounded-2xl border-2 md:border-4 transition-all duration-200 
                  flex items-center justify-center min-h-[90px] md:min-h-[120px]
                  ${getOptionStyles(option)}
                `}
              >
                {mode === 'LETTER_TO_IMAGE' ? (
                  <img src={HINDI_ASSETS[option]?.examples?.[0]?.image} className="w-16 h-16 md:w-20 md:h-20 object-contain" alt="option" />
                ) : (
                  <span className="text-4xl md:text-5xl font-black">{option}</span>
                )}
                {isAnswerSubmitted && option === q.targetLetter && <CheckCircle className="absolute top-2 right-2 w-6 h-6 text-lime-600 bg-white rounded-full z-20 shadow-sm" /> }
                {isAnswerSubmitted && selectedAnswer === option && option !== q.targetLetter && <XCircle className="absolute top-2 right-2 w-6 h-6 text-rose-600 bg-white rounded-full z-20 shadow-sm" /> }
              </button>
            ))}
          </div>

          <div className={`mt-2 min-h-[60px] lg:min-h-[85px] flex flex-col justify-end transition-opacity duration-300 ${isAnswerSubmitted ? 'opacity-100' : 'opacity-0'}`}>
            {isAnswerSubmitted && (
              <div className={`p-3 rounded-xl md:rounded-2xl border-2 mb-2 font-bold flex items-center md:items-start space-x-3 ${selectedAnswer === q.targetLetter ? 'bg-lime-50 border-lime-200 text-lime-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                <div className="shrink-0">{selectedAnswer === q.targetLetter ? <CheckCircle className="w-5 h-6 text-lime-600" /> : <XCircle className="w-5 h-6 text-rose-600" />}</div>
                <div>
                  <span className="block text-sm lg:text-base mb-0">{selectedAnswer === q.targetLetter ? 'बिल्कुल सही! (Correct!)' : 'गलत उत्तर (Wrong!)'}</span>
                  <span className="hidden md:block text-slate-600 text-xs lg:text-sm">{q.explanation}</span>
                </div>
              </div>
            )}

            {isAnswerSubmitted && (
              <button onClick={handleNextQuestion} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-base lg:text-lg py-3 px-6 rounded-xl md:rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2">
                <span>{currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}</span><ArrowRight className="w-5 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}