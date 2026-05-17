'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, RotateCcw, CheckCircle2, ChevronRight, Star, Sparkles, 
  AlertCircle, Target, Volume2, LayoutGrid, ArrowLeftRight, 
  MousePointerClick, Palette, ListOrdered, BrainCircuit
} from 'lucide-react';

const EMOJI_POOL = ['🍎', '🐶', '🚀', '🌟', '🍕', '🎈', '🚗', '🧸', '🌻', '💎', '🐸', '🍓', '🏀', '🐢', '🦖'];

// --- Types ---
type QuizMode = 'random' | 'before_after' | 'one_more_less' | 'count' | 'series' | 'compare' | 'color' | 'pick' | 'audio';
type QuizState = 'menu' | 'playing' | 'results';

interface Question {
  type: QuizMode;
  target?: number;
  questionText: string;
  options?: any[];
  answer: any;
  data?: any;
}

export default function MasterQuizUptoTen({ lesson, onComplete }: any) {
  const [quizState, setQuizState] = useState<QuizState>('menu');
  const [selectedMode, setSelectedMode] = useState<QuizMode>('random');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [score, setScore] = useState(0);
  
  // Generic answer state. Can be a number, string ('A'/'B'), or array of booleans depending on the question.
  const [userAnswer, setUserAnswer] = useState<any>(null); 
  
  const [isSuccessAnim, setIsSuccessAnim] = useState(false);
  const [isMatchFound, setIsMatchFound] = useState(false);
  const [warning, setWarning] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // --- Audio Engine ---
  const audioCtx = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (typeof window === 'undefined') return;
    if (!audioCtx.current) {
      const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (WinAudioContext) audioCtx.current = new WinAudioContext();
    }
    if (audioCtx.current && audioCtx.current.state === 'suspended') audioCtx.current.resume();
  };

  const playSound = (type: 'pop' | 'kaching' | 'error' | 'slide') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'pop') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'error') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'kaching') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'slide') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN'; utterance.rate = 0.9; utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Helpers ---
  const shuffleArray = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);
  const getRandomEmoji = () => EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
  const getOptions = (correct: number, min: number = 0, max: number = 10) => {
    let opts = new Set([correct]);
    while (opts.size < 4) {
      opts.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return shuffleArray(Array.from(opts));
  };

  // --- Question Generator ---
  const generateQuestion = (mode: QuizMode): Question => {
    const types: QuizMode[] = ['before_after', 'one_more_less', 'count', 'series', 'compare', 'color', 'pick', 'audio'];
    const selectedType = mode === 'random' ? types[Math.floor(Math.random() * types.length)] : mode;
    
    const emoji = getRandomEmoji();
    let n = Math.floor(Math.random() * 9) + 1; // 1 to 9 mostly

    switch (selectedType) {
      case 'before_after':
        const isBefore = Math.random() > 0.5;
        n = isBefore ? (Math.floor(Math.random() * 9) + 2) : (Math.floor(Math.random() * 9) + 1); // Ensure valid bounds
        const answer = isBefore ? n - 1 : n + 1;
        return {
          type: 'before_after',
          answer: answer,
          questionText: `What comes ${isBefore ? 'before' : 'after'} ${n}?`,
          options: getOptions(answer),
          data: { n, isBefore }
        };
      
      case 'one_more_less':
        const isMore = Math.random() > 0.5;
        n = isMore ? (Math.floor(Math.random() * 9) + 1) : (Math.floor(Math.random() * 9) + 2);
        const ansMoreLess = isMore ? n + 1 : n - 1;
        return {
          type: 'one_more_less',
          answer: ansMoreLess,
          questionText: `What is one ${isMore ? 'more' : 'less'} than ${n}?`,
          options: getOptions(ansMoreLess),
          data: { n, isMore, emoji }
        };

      case 'count':
        n = Math.floor(Math.random() * 10) + 1; // 1 to 10
        return {
          type: 'count',
          answer: n,
          questionText: "How many are there?",
          options: getOptions(n, 1, 10),
          data: { n, emoji }
        };

      case 'series':
        const start = Math.floor(Math.random() * 7); // 0 to 6
        const seq = [start, start + 1, start + 2, start + 3];
        const missingIdx = Math.floor(Math.random() * 4);
        const missingNum = seq[missingIdx];
        seq[missingIdx] = -1; // -1 represents missing
        return {
          type: 'series',
          answer: missingNum,
          questionText: "Complete the series by finding the missing number.",
          options: getOptions(missingNum),
          data: { seq, missingIdx }
        };

      case 'compare':
        const a = Math.floor(Math.random() * 10) + 1;
        let b = Math.floor(Math.random() * 10) + 1;
        while (b === a) b = Math.floor(Math.random() * 10) + 1; // Ensure different for More/Less
        const askMore = Math.random() > 0.5;
        return {
          type: 'compare',
          answer: askMore ? (a > b ? 'A' : 'B') : (a < b ? 'A' : 'B'),
          questionText: `Which box has ${askMore ? 'MORE' : 'LESS'}?`,
          data: { a, b, emoji }
        };

      case 'color':
        n = Math.floor(Math.random() * 10) + 1;
        return {
          type: 'color',
          answer: n,
          questionText: `Color exactly ${n} stars!`,
          data: { n }
        };

      case 'pick':
        n = Math.floor(Math.random() * 5) + 2; // 2 to 6 targets
        const distractorCount = Math.floor(Math.random() * 4) + 3; // 3 to 6 distractors
        let items = Array(n).fill(true).concat(Array(distractorCount).fill(false));
        items = shuffleArray(items);
        const dEmoji = getRandomEmoji();
        return {
          type: 'pick',
          answer: n,
          questionText: `Pick out exactly ${n} ${emoji}s.`,
          data: { n, items, targetEmoji: emoji, distractorEmoji: dEmoji === emoji ? '🧊' : dEmoji }
        };

      case 'audio':
        n = Math.floor(Math.random() * 11); // 0 to 10
        return {
          type: 'audio',
          answer: n,
          questionText: "Listen to the audio and select the correct number.",
          options: getOptions(n, 0, 10),
          data: { n }
        };

      default:
        return { type: 'count', answer: 1, questionText: 'Error', data: {} };
    }
  };

  const startGame = (mode: QuizMode) => {
    initAudio();
    playSound('slide');
    setSelectedMode(mode);
    const qs = Array.from({ length: 10 }).map(() => generateQuestion(mode));
    setQuestions(qs);
    setCurrentQIdx(0);
    setScore(0);
    resetAnswerState(qs[0]);
    setQuizState('playing');
  };

  const resetAnswerState = (q: Question) => {
    setIsMatchFound(false);
    setIsSuccessAnim(false);
    setWarning('');
    if (q.type === 'color') setUserAnswer(Array(10).fill(false));
    else if (q.type === 'pick') setUserAnswer([]); // array of selected indices
    else setUserAnswer(null);
  };

  const showWarningMsg = (msg: string) => {
    setWarning(msg);
    setTimeout(() => setWarning(''), 2000);
  };

  const handleCheck = () => {
    initAudio();
    const q = questions[currentQIdx];
    let isCorrect = false;

    if (userAnswer === null) {
      playSound('error');
      showWarningMsg("Please provide an answer first!");
      return;
    }

    if (q.type === 'color') {
      const coloredCount = userAnswer.filter(Boolean).length;
      isCorrect = coloredCount === q.answer;
      if (!isCorrect) showWarningMsg(coloredCount > q.answer ? "Too many colored!" : "Not enough colored!");
    } else if (q.type === 'pick') {
      const selectedIndices: number[] = userAnswer;
      const allCorrectObjects = selectedIndices.every(idx => q.data.items[idx] === true);
      if (selectedIndices.length === q.answer && allCorrectObjects) {
        isCorrect = true;
      } else {
        if (!allCorrectObjects) showWarningMsg("You picked the wrong item!");
        else showWarningMsg(`You need exactly ${q.answer}!`);
      }
    } else {
      isCorrect = userAnswer === q.answer;
      if (!isCorrect) showWarningMsg("Oops! Try again.");
    }

    if (isCorrect) {
      playSound('kaching');
      setIsSuccessAnim(true);
      setIsMatchFound(true);
      setScore(s => s + 1);
      if (q.type !== 'audio') speakText("Correct!");
      setTimeout(() => setIsSuccessAnim(false), 1500);
    } else {
      playSound('error');
    }
  };

  const handleNext = () => {
    initAudio();
    playSound('slide');
    if (currentQIdx >= questions.length - 1) {
      setQuizState('results');
    } else {
      const nextQ = questions[currentQIdx + 1];
      setCurrentQIdx(prev => prev + 1);
      resetAnswerState(nextQ);
    }
  };

  if (!mounted) return null;

  // --- RENDERERS ---

  if (quizState === 'menu') {
    return (
      <div className="w-full h-full flex flex-col bg-slate-50 font-sans min-h-0 overflow-y-auto">
        <div className="p-6 md:p-10 text-center shrink-0">
          <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-sky-200"><BrainCircuit size={40} className="text-sky-500" /></div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight mb-2">Master Quiz</h1>
          <p className="text-slate-500 font-bold">Select a skill to practice, or play a random mix!</p>
        </div>
        
        <div className="flex-1 min-h-0 max-w-4xl mx-auto w-full px-4 pb-10 flex flex-col gap-6">
           <button onClick={() => startGame('random')} className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white p-6 md:p-8 rounded-[2rem] shadow-xl border-b-[8px] border-indigo-700 hover:border-b-[4px] hover:translate-y-1 transition-all flex flex-col md:flex-row items-center justify-center gap-4 group">
              <Sparkles size={48} className="group-hover:animate-pulse" />
              <div className="text-center md:text-left">
                 <h2 className="text-2xl md:text-4xl font-black">Play Random Mix</h2>
                 <p className="text-sky-100 font-bold text-sm md:text-base opacity-90">10 surprise questions across all skills!</p>
              </div>
           </button>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { id: 'before_after', label: 'Before & After', icon: ArrowLeftRight, color: 'text-rose-500', bg: 'bg-rose-100', border: 'border-rose-200' },
                { id: 'one_more_less', label: '1 More / 1 Less', icon: PlusSquareIcon, color: 'text-amber-500', bg: 'bg-amber-100', border: 'border-amber-200' },
                { id: 'count', label: 'How Many?', icon: LayoutGrid, color: 'text-emerald-500', bg: 'bg-emerald-100', border: 'border-emerald-200' },
                { id: 'series', label: 'Missing Series', icon: ListOrdered, color: 'text-purple-500', bg: 'bg-purple-100', border: 'border-purple-200' },
                { id: 'compare', label: 'Compare', icon: Target, color: 'text-orange-500', bg: 'bg-orange-100', border: 'border-orange-200' },
                { id: 'color', label: 'Color Shapes', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-100', border: 'border-pink-200' },
                { id: 'pick', label: 'Pick Objects', icon: MousePointerClick, color: 'text-cyan-500', bg: 'bg-cyan-100', border: 'border-cyan-200' },
                { id: 'audio', label: 'Audio Match', icon: Volume2, color: 'text-indigo-500', bg: 'bg-indigo-100', border: 'border-indigo-200' },
              ].map((btn) => (
                <button key={btn.id} onClick={() => startGame(btn.id as QuizMode)} className={`p-4 rounded-2xl border-b-4 transition-all active:translate-y-1 bg-white hover:bg-slate-50 border-slate-200 flex flex-col items-center gap-3 shadow-sm`}>
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${btn.bg} ${btn.color} ${btn.border}`}>
                     <btn.icon size={24} />
                   </div>
                   <span className="font-black text-slate-700 text-xs md:text-sm text-center leading-tight">{btn.label}</span>
                </button>
              ))}
           </div>
        </div>
      </div>
    );
  }

  if (quizState === 'results') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-6">
         <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-sky-100 text-center max-w-md w-full">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <Star size={48} className="fill-emerald-500" />
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-2">Quiz Complete!</h2>
            <p className="text-lg font-bold text-slate-500 mb-8">You scored {score} out of 10.</p>
            <button onClick={() => setQuizState('menu')} className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-black text-xl rounded-2xl border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all">Play Again</button>
         </div>
      </div>
    );
  }

  const q = questions[currentQIdx];

  const renderPlayArea = () => {
    switch (q.type) {
      case 'before_after':
        return (
          <div className="flex flex-col items-center gap-8 w-full">
             <div className="flex items-center gap-4">
               {q.data.isBefore ? (
                 <>
                   <div className="w-20 h-24 md:w-24 md:h-32 border-4 border-dashed border-sky-300 rounded-2xl flex items-center justify-center bg-sky-50/50">
                     {userAnswer !== null && <span className="text-4xl md:text-5xl font-black text-sky-600 animate-fade-in">{userAnswer}</span>}
                   </div>
                   <span className="text-4xl font-black text-slate-300">-</span>
                   <div className="w-20 h-24 md:w-24 md:h-32 border-4 border-slate-200 rounded-2xl flex items-center justify-center bg-white shadow-sm">
                     <span className="text-4xl md:text-5xl font-black text-slate-700">{q.data.n}</span>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="w-20 h-24 md:w-24 md:h-32 border-4 border-slate-200 rounded-2xl flex items-center justify-center bg-white shadow-sm">
                     <span className="text-4xl md:text-5xl font-black text-slate-700">{q.data.n}</span>
                   </div>
                   <span className="text-4xl font-black text-slate-300">-</span>
                   <div className="w-20 h-24 md:w-24 md:h-32 border-4 border-dashed border-sky-300 rounded-2xl flex items-center justify-center bg-sky-50/50">
                     {userAnswer !== null && <span className="text-4xl md:text-5xl font-black text-sky-600 animate-fade-in">{userAnswer}</span>}
                   </div>
                 </>
               )}
             </div>
             
             {/* Options */}
             <div className="flex flex-wrap justify-center gap-4 w-full max-w-lg mt-8">
               {q.options?.map(opt => (
                 <button key={opt} onClick={() => { if(!isMatchFound){ playSound('pop'); setUserAnswer(opt); } }} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl text-2xl md:text-3xl font-black border-b-4 transition-all active:translate-y-1 ${userAnswer === opt ? 'bg-sky-500 text-white border-sky-700 scale-110' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{opt}</button>
               ))}
             </div>
          </div>
        );

      case 'one_more_less':
      case 'count':
        return (
          <div className="flex flex-col items-center gap-8 w-full">
             <div className="bg-white p-6 rounded-3xl border-4 border-slate-100 shadow-sm flex flex-wrap justify-center gap-4 max-w-lg min-h-[150px]">
                {Array.from({length: q.data.n}).map((_, i) => (
                  <span key={i} className="text-5xl md:text-6xl animate-fade-in drop-shadow-sm" style={{animationDelay: `${i*0.05}s`}}>{q.data.emoji}</span>
                ))}
                {q.type === 'one_more_less' && q.data.isMore && (
                  <span className="text-5xl md:text-6xl opacity-30 drop-shadow-sm border-2 border-dashed border-slate-300 rounded-xl">{q.data.emoji}</span>
                )}
             </div>
             <div className="flex flex-wrap justify-center gap-4 w-full max-w-lg">
               {q.options?.map(opt => (
                 <button key={opt} onClick={() => { if(!isMatchFound){ playSound('pop'); setUserAnswer(opt); } }} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl text-2xl md:text-3xl font-black border-b-4 transition-all active:translate-y-1 ${userAnswer === opt ? 'bg-sky-500 text-white border-sky-700 scale-110' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{opt}</button>
               ))}
             </div>
          </div>
        );

      case 'series':
        return (
          <div className="flex flex-col items-center gap-8 w-full">
             <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 bg-white p-4 md:p-8 rounded-[2rem] border-4 border-slate-100 shadow-sm w-full max-w-2xl">
               {q.data.seq.map((num: number, i: number) => (
                 <React.Fragment key={i}>
                   {num === -1 ? (
                     <div className="w-16 h-20 md:w-24 md:h-28 border-4 border-dashed border-purple-300 rounded-2xl flex items-center justify-center bg-purple-50/50">
                       {userAnswer !== null && <span className="text-3xl md:text-5xl font-black text-purple-600 animate-fade-in">{userAnswer}</span>}
                     </div>
                   ) : (
                     <div className="w-16 h-20 md:w-24 md:h-28 border-4 border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50">
                       <span className="text-3xl md:text-5xl font-black text-slate-700">{num}</span>
                     </div>
                   )}
                   {i < 3 && <ChevronRight size={24} className="text-slate-300 hidden md:block" />}
                 </React.Fragment>
               ))}
             </div>
             <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-4">Tap to fill the gap</p>
             <div className="flex flex-wrap justify-center gap-4 w-full max-w-lg mt-4">
               {q.options?.map(opt => (
                 <button key={opt} onClick={() => { if(!isMatchFound){ playSound('pop'); setUserAnswer(opt); } }} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl text-2xl md:text-3xl font-black border-b-4 transition-all active:translate-y-1 ${userAnswer === opt ? 'bg-purple-500 text-white border-purple-700 scale-110' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{opt}</button>
               ))}
             </div>
          </div>
        );

      case 'compare':
        return (
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 w-full max-w-4xl">
             {['A', 'B'].map((box) => {
               const count = box === 'A' ? q.data.a : q.data.b;
               const isSelected = userAnswer === box;
               return (
                 <button 
                   key={box}
                   onClick={() => { if(!isMatchFound){ playSound('pop'); setUserAnswer(box); } }}
                   className={`flex-1 min-h-[200px] flex flex-col items-center p-6 rounded-[2rem] border-4 transition-all ${isSelected ? 'bg-orange-50 border-orange-400 shadow-md scale-105' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                 >
                    <span className="text-slate-300 font-black text-xl mb-4">Box {box}</span>
                    <div className="flex flex-wrap justify-center gap-3">
                      {Array.from({length: count}).map((_, i) => <span key={i} className="text-4xl md:text-5xl drop-shadow-sm">{q.data.emoji}</span>)}
                    </div>
                 </button>
               )
             })}
          </div>
        );

      case 'color':
        return (
          <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
             <div className="flex flex-wrap justify-center gap-4 md:gap-6 bg-white p-6 md:p-10 rounded-[2rem] border-4 border-slate-100 shadow-sm">
                {Array.from({length: 10}).map((_, i) => {
                  const isColored = userAnswer ? userAnswer[i] : false;
                  return (
                    <button 
                      key={i} 
                      onClick={() => {
                        if (isMatchFound) return;
                        playSound('pop');
                        const newArr = [...(userAnswer || Array(10).fill(false))];
                        newArr[i] = !newArr[i];
                        setUserAnswer(newArr);
                      }}
                      className="transition-transform active:scale-90"
                    >
                      <Star size={48} md-size={64} className={`transition-all duration-300 ${isColored ? 'fill-yellow-400 text-yellow-500 drop-shadow-md scale-110' : 'fill-slate-200 text-slate-300'}`} />
                    </button>
                  )
                })}
             </div>
             <p className="text-slate-400 font-bold text-sm">Colored: {userAnswer ? userAnswer.filter(Boolean).length : 0}</p>
          </div>
        );

      case 'pick':
        return (
          <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
             <div className="flex flex-wrap justify-center gap-4 bg-white p-6 md:p-10 rounded-[2rem] border-4 border-slate-100 shadow-sm">
                {q.data.items.map((isTarget: boolean, i: number) => {
                  const isSelected = userAnswer ? userAnswer.includes(i) : false;
                  return (
                    <button 
                      key={i} 
                      onClick={() => {
                        if (isMatchFound) return;
                        playSound('pop');
                        let newArr = [...(userAnswer || [])];
                        if (isSelected) newArr = newArr.filter(idx => idx !== i);
                        else newArr.push(i);
                        setUserAnswer(newArr);
                      }}
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl text-4xl md:text-5xl flex items-center justify-center transition-all border-b-4 
                        ${isSelected ? 'bg-cyan-100 border-cyan-400 shadow-inner scale-95' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                    >
                      {isTarget ? q.data.targetEmoji : q.data.distractorEmoji}
                    </button>
                  )
                })}
             </div>
             <p className="text-slate-400 font-bold text-sm">Picked: {userAnswer ? userAnswer.length : 0}</p>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center gap-10 w-full">
             <button 
               onClick={() => speakText(q.data.n.toString())}
               className="w-32 h-32 md:w-40 md:h-40 bg-indigo-500 rounded-full flex items-center justify-center text-white border-b-[8px] border-indigo-700 active:border-b-0 active:translate-y-2 transition-all shadow-xl animate-pulse"
             >
               <Volume2 size={64} />
             </button>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Tap to Listen</p>
             <div className="flex flex-wrap justify-center gap-4 w-full max-w-lg">
               {q.options?.map(opt => (
                 <button key={opt} onClick={() => { if(!isMatchFound){ playSound('pop'); setUserAnswer(opt); } }} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl text-2xl md:text-3xl font-black border-b-4 transition-all active:translate-y-1 ${userAnswer === opt ? 'bg-indigo-500 text-white border-indigo-700 scale-110' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{opt}</button>
               ))}
             </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 font-sans min-h-0 overflow-hidden">
      
      {/* HEADER (shrink-0) */}
      <div className="shrink-0 p-3 md:p-5 bg-white border-b-4 border-slate-200 flex justify-between items-center z-10 shadow-sm">
         <div className="flex items-center gap-3">
            <button onClick={() => setQuizState('menu')} className="p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><RotateCcw size={20}/></button>
            <div className="bg-sky-500 p-1.5 md:p-2 rounded-lg md:rounded-xl text-white">
               <BrainCircuit size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="hidden sm:block">
               <h2 className="text-lg font-black text-slate-800 leading-none capitalize">{selectedMode.replace(/_/g, ' ')}</h2>
            </div>
         </div>
         <div className="bg-slate-100 text-slate-500 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border-2 border-slate-200 font-black flex items-center gap-2 text-sm">
            <Star size={14} className="fill-slate-400" />
            <span>{currentQIdx + 1} / 10</span>
         </div>
      </div>

      {/* PLAY AREA (flex-1 min-h-0) */}
      <div className="flex-1 min-h-0 relative flex flex-col p-4 md:p-8 overflow-y-auto">
         {/* Question Text */}
         <div className="shrink-0 text-center mb-6 md:mb-10">
            <h3 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight max-w-2xl mx-auto leading-tight">
              {q.questionText}
            </h3>
         </div>

         {/* Dynamic Content */}
         <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
            {renderPlayArea()}
         </div>

         {/* Success Overlay */}
         {isSuccessAnim && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-white/60 backdrop-blur-sm">
               <div className="bg-emerald-500 text-white px-8 md:px-12 py-4 md:py-6 rounded-full font-black text-2xl md:text-4xl shadow-2xl flex items-center gap-4 animate-[bounce_0.5s_infinite]">
                 <Sparkles className="fill-white" size={40} /> Excellent!
               </div>
            </div>
         )}
      </div>

      {/* CONTROL PANEL (shrink-0) */}
      <div className="shrink-0 p-4 bg-white border-t-4 border-slate-200 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
         <div className="max-w-3xl mx-auto flex items-center justify-center gap-3 md:gap-4 relative">
            
            {warning && (
              <div className="absolute -top-14 bg-rose-500 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 animate-fade-in shadow-lg z-20">
                 <AlertCircle size={16} /> {warning}
              </div>
            )}

            {!isMatchFound ? (
               <button 
                 onClick={handleCheck}
                 className={`w-full max-w-md flex items-center justify-center gap-2 px-8 py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl transition-all border-b-4 shadow-lg bg-sky-500 hover:bg-sky-400 text-white border-sky-700 active:scale-95 active:border-b-0`}
               >
                 <CheckCircle2 size={24} /> CHECK ANSWER
               </button>
            ) : (
               <button 
                 onClick={handleNext}
                 className="w-full max-w-md flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 md:py-5 rounded-2xl font-black text-xl transition-all active:scale-95 border-b-4 border-emerald-700 active:border-b-0 shadow-xl animate-fade-in"
               >
                 {currentQIdx >= questions.length - 1 ? 'SEE RESULTS' : 'NEXT QUESTION'} <ChevronRight size={28} />
               </button>
            )}

         </div>
      </div>

    </div>
  );
}

// Dummy Icon for the UI list since PlusSquare isn't imported
function PlusSquareIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}