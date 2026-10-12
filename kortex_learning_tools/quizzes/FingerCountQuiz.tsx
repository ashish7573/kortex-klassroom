"use client";

import React, { useState, useEffect } from 'react';
import { RotateCcw, Play, Volume2, ArrowRight, Award, Sparkles, CheckCircle2 } from 'lucide-react';

// --- CUSTOM SVG HAND COMPONENTS ---
const LeftHand = ({ count, onClick, interactive }: { count: number, onClick: () => void, interactive: boolean }) => {
  const open = [count >= 1, count >= 2, count >= 3, count >= 4, count >= 5]; // Index, Middle, Ring, Pinky, Thumb
  return (
    <svg 
      viewBox="0 0 100 120" 
      className={`w-full h-full max-h-full drop-shadow-md select-none transition-transform duration-200 ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`} 
      onClick={onClick}
    >
      {/* Thumb (Left side) */}
      <rect 
        x="13" y="65" width="38" height="14" rx="6" 
        fill="#fcd34d" stroke="#d97706" strokeWidth="2" 
        className="transition-all duration-300" 
        style={{ transformOrigin: '18px 52px', transform: open[4] ? 'rotate(40deg)' : 'rotate(0deg) translateX(15px) scaleX(0.5)' }} 
      />
      {/* Fingers behind palm */}
      <rect 
        x="24" y="20" width="12" height="45" rx="6" 
        fill="#fcd34d" stroke="#d97706" strokeWidth="2" 
        className="transition-all duration-300" 
        style={{ transform: open[0] ? 'translateY(0)' : 'translateY(35px)' }} 
      />
      <rect 
        x="38" y="10" width="12" height="55" rx="6" 
        fill="#fcd34d" stroke="#d97706" strokeWidth="2" 
        className="transition-all duration-300" 
        style={{ transform: open[1] ? 'translateY(0)' : 'translateY(40px)' }} 
      />
      <rect 
        x="52" y="15" width="12" height="50" rx="6" 
        fill="#fcd34d" stroke="#d97706" strokeWidth="2" 
        className="transition-all duration-300" 
        style={{ transform: open[2] ? 'translateY(0)' : 'translateY(35px)' }} 
      />
      <rect 
        x="66" y="25" width="12" height="40" rx="6" 
        fill="#fcd34d" stroke="#d97706" strokeWidth="2" 
        className="transition-all duration-300" 
        style={{ transform: open[3] ? 'translateY(0)' : 'translateY(30px)' }} 
      />
      {/* Palm */}
      <rect x="22" y="55" width="58" height="55" rx="15" fill="#fcd34d" stroke="#d97706" strokeWidth="2" />
      {/* Palm crease line */}
      <path d="M 30,80 Q 50,75 70,85" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
};

const RightHand = ({ count, onClick, interactive }: { count: number, onClick: () => void, interactive: boolean }) => {
  const open = [count >= 1, count >= 2, count >= 3, count >= 4, count >= 5]; // Index, Middle, Ring, Pinky, Thumb
  return (
    <svg 
      viewBox="0 0 100 120" 
      className={`w-full h-full max-h-full drop-shadow-md select-none transition-transform duration-200 ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`} 
      onClick={onClick}
    >
      {/* Fingers behind palm */}
      <rect 
        x="22" y="25" width="12" height="40" rx="6" 
        fill="#fcd34d" stroke="#d97706" strokeWidth="2" 
        className="transition-all duration-300" 
        style={{ transform: open[3] ? 'translateY(0)' : 'translateY(30px)' }} 
      />
      <rect 
        x="36" y="15" width="12" height="50" rx="6" 
        fill="#fcd34d" stroke="#d97706" strokeWidth="2" 
        className="transition-all duration-300" 
        style={{ transform: open[2] ? 'translateY(0)' : 'translateY(35px)' }} 
      />
      <rect 
        x="50" y="10" width="12" height="55" rx="6" 
        fill="#fcd34d" stroke="#d97706" strokeWidth="2" 
        className="transition-all duration-300" 
        style={{ transform: open[1] ? 'translateY(0)' : 'translateY(40px)' }} 
      />
      <rect 
        x="64" y="20" width="12" height="45" rx="6" 
        fill="#fcd34d" stroke="#d97706" strokeWidth="2" 
        className="transition-all duration-300" 
        style={{ transform: open[0] ? 'translateY(0)' : 'translateY(35px)' }} 
      />
      {/* Thumb (Right side) */}
      <rect 
        x="65" y="65" width="38" height="14" rx="6" 
        fill="#fcd34d" stroke="#d97706" strokeWidth="2" 
        className="transition-all duration-300" 
        style={{ transformOrigin: '85px 72px', transform: open[4] ? 'rotate(-40deg)' : 'rotate(0deg) translateX(-15px) scaleX(0.5)' }} 
      />
      {/* Palm */}
      <rect x="20" y="55" width="58" height="55" rx="15" fill="#fcd34d" stroke="#d97706" strokeWidth="2" />
      {/* Palm crease line */}
      <path d="M 30,85 Q 50,75 70,80" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
};


export default function FingerCountQuiz({ lesson, onComplete }: any) {
    // Session States (5 Questions)
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const TOTAL_QUESTIONS = 5;

    // Equation States (Addition up to 10)
    const [baseNumber, setBaseNumber] = useState<number | null>(null); 
    const [hopNumber, setHopNumber] = useState<number | null>(null);   
    const [options, setOptions] = useState<number[]>([]);
    
    // Quiz States
    const [phase, setPhase] = useState<'start' | 'buildA' | 'buildB' | 'answer' | 'done' | 'completed'>('start');
    
    // Hand Counters
    const [leftCount, setLeftCount] = useState(0); 
    const [rightCount, setRightCount] = useState(0); 

    const totalInFunnels = (baseNumber || 0) + (hopNumber || 0);
    const totalRaised = leftCount + rightCount;

    // --- AUDIO ENGINE ---
    const playSound = (type: 'boing' | 'error' | 'success' | 'pop') => {
        if (typeof window === 'undefined') return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (type === 'boing') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'pop') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
                osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) {
            console.log("Audio failed to play", e);
        }
    };

    const speak = (text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel(); 
                const msg = new SpeechSynthesisUtterance(text);
                msg.rate = 0.85; 
                msg.pitch = 1.15; 
                window.speechSynthesis.speak(msg);
            } catch (e) {
                console.log("TTS failed", e);
            }
        }
    };

    // --- INITIALIZE & RESET EQUATIONS ---
    const generateEquation = () => {
        const randomTotal = Math.floor(Math.random() * 9) + 2; 
        const randomA = Math.floor(Math.random() * (randomTotal - 1)) + 1; 
        const randomB = randomTotal - randomA; 
        
        setBaseNumber(randomA);
        setHopNumber(randomB);
        setPhase('buildA');
        
        setLeftCount(0);
        setRightCount(0);

        const opts = new Set<number>([randomTotal]);
        while(opts.size < 4) {
            const offset = Math.floor(Math.random() * 5) - 2; 
            const fakeAns = randomTotal + offset;
            if (fakeAns > 0 && fakeAns <= 10 && fakeAns !== randomTotal) {
                opts.add(fakeAns);
            } else {
                opts.add(Math.floor(Math.random() * 10) + 1); 
            }
        }
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));

        playSound('pop');
        setTimeout(() => speak(`Tap your fingers to make the number ${randomA}.`), 400);
    };

    const startQuiz = () => {
        setQuestionIndex(0);
        setScore(0);
        generateEquation();
    };

    const resetEquation = () => {
        if (phase === 'start' || phase === 'completed' || baseNumber === null || hopNumber === null) return;
        
        setPhase('buildA');
        setLeftCount(0);
        setRightCount(0);
        
        playSound('pop');
        setTimeout(() => speak(`Let's try again. Tap your fingers to make ${baseNumber}.`), 400);
    };

    // --- INTERACTION LOGIC ---
    const handleHandTap = (hand: 'left' | 'right') => {
        if (phase === 'done' || phase === 'answer' || phase === 'start' || phase === 'completed' || baseNumber === null || hopNumber === null) return;

        const targetTotal = phase === 'buildA' ? baseNumber : totalInFunnels;

        if (totalRaised >= targetTotal) {
            playSound('error'); 
            return;
        }

        if (hand === 'left') {
            if (leftCount >= 5) {
                playSound('error'); 
                return;
            }
            setLeftCount(prev => prev + 1);
        } else {
            if (rightCount >= 5) {
                playSound('error'); 
                return;
            }
            setRightCount(prev => prev + 1);
        }

        playSound('boing');
        const newTotal = totalRaised + 1;
        
        if (phase === 'buildB') {
            speak((newTotal - baseNumber).toString());
        } else {
            speak(newTotal.toString());
        }

        if (newTotal === targetTotal) {
            if (phase === 'buildA') {
                setTimeout(() => {
                    playSound('success');
                    speak(`Great! Now tap ${hopNumber} more fingers to add.`);
                    setPhase('buildB');
                }, 700);
            } else if (phase === 'buildB') {
                setTimeout(() => {
                    playSound('success');
                    speak(`Perfect! Now count all your fingers and choose the answer.`);
                    setPhase('answer');
                }, 700);
            }
        }
    };

    const handleOptionSelect = (selectedOpt: number) => {
        if (phase !== 'answer' || baseNumber === null || hopNumber === null) return;

        if (selectedOpt === totalInFunnels) {
            playSound('success');
            setScore(s => s + 1);
            speak(`${baseNumber} plus ${hopNumber} equals ${totalInFunnels}!`);
            setPhase('done');
        } else {
            playSound('error');
            speak("Oops! Recount carefully and try again.");
        }
    };

    const handleNextQuestion = () => {
        if (questionIndex + 1 < TOTAL_QUESTIONS) {
            setQuestionIndex(prev => prev + 1);
            generateEquation();
        } else {
            setPhase('completed');
            playSound('success');
            speak(`Awesome job! You finished all 5 questions!`);
        }
    };

    // ============================================================================
    // RENDER: START SCREEN (Zero-Scroll)
    // ============================================================================
    if (phase === 'start') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 bg-indigo-50 font-sans select-none overflow-hidden">
                <div className="max-w-md w-full bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-lg border-2 sm:border-4 border-indigo-200 text-center space-y-4">
                    <div className="flex justify-center items-center gap-3">
                        <div className="w-16 h-20 sm:w-20 sm:h-24">
                            <LeftHand count={3} onClick={() => {}} interactive={false} />
                        </div>
                        <span className="text-2xl sm:text-3xl font-black text-indigo-400">+</span>
                        <div className="w-16 h-20 sm:w-20 sm:h-24">
                            <RightHand count={2} onClick={() => {}} interactive={false} />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Finger Count Addition</h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Tap fingers to add numbers up to 10 (5 Questions)</p>
                    </div>

                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-left text-xs sm:text-sm text-indigo-900 space-y-1.5 font-medium">
                        <p className="flex items-center gap-1.5 font-bold text-indigo-700">
                            <Sparkles size={14} className="shrink-0 text-amber-500" /> How to play:
                        </p>
                        <p className="text-slate-600">1. Tap fingers to make the first number.</p>
                        <p className="text-slate-600">2. Tap more fingers to add the second number.</p>
                        <p className="text-slate-600">3. Count all raised fingers and select the answer!</p>
                    </div>

                    <button 
                        onClick={startQuiz}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base sm:text-lg py-3 px-6 rounded-xl sm:rounded-2xl shadow-md border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Play size={20} /> START PRACTICE
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: VICTORY / COMPLETED SCREEN (Zero-Scroll)
    // ============================================================================
    if (phase === 'completed') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 bg-indigo-50 font-sans select-none overflow-hidden">
                <div className="max-w-md w-full bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-lg border-2 sm:border-4 border-indigo-200 text-center space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner border-2 border-amber-300">
                        <Award className="w-9 h-9 sm:w-11 sm:h-11" />
                    </div>

                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Finger Count Master!</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">You solved all addition problems using fingers!</p>
                    </div>

                    <div className="bg-indigo-50 py-3 px-4 rounded-xl border border-indigo-200 flex items-center justify-around">
                        <div className="text-center">
                            <span className="text-xs text-slate-500 font-bold uppercase block">Score</span>
                            <span className="text-2xl sm:text-3xl font-black text-indigo-600">{score} / {TOTAL_QUESTIONS}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-indigo-200"></div>
                        <div className="text-center">
                            <span className="text-xs text-slate-500 font-bold uppercase block">Result</span>
                            <span className="text-2xl sm:text-3xl font-black text-emerald-600">100% ⭐</span>
                        </div>
                    </div>

                    <div className="flex gap-2.5 pt-1">
                        <button 
                            onClick={startQuiz}
                            className="flex-1 bg-white hover:bg-slate-50 text-indigo-700 font-black text-sm sm:text-base py-2.5 sm:py-3 px-4 rounded-xl border-2 border-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <RotateCcw size={16} /> Play Again
                        </button>
                        {onComplete && (
                            <button 
                                onClick={() => onComplete({ score, maxScore: TOTAL_QUESTIONS })}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm sm:text-base py-2.5 sm:py-3 px-4 rounded-xl border-b-3 border-indigo-800 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                                <CheckCircle2 size={16} /> Finish Lesson
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Target total for active phase
    const targetTotal = phase === 'buildA' ? (baseNumber || 0) : totalInFunnels;

    // ============================================================================
    // RENDER: ACTIVE QUIZ VIEW (Zero-Scroll Layout)
    // ============================================================================
    return (
        <div className="w-full h-full flex flex-col items-center justify-between p-2 sm:p-3 md:p-4 bg-indigo-50/70 font-sans select-none overflow-hidden relative">
            
            {/* 1. TOP HEADER & EQUATION BANNER (Shrink-0) */}
            <div className="w-full max-w-2xl shrink-0 space-y-1 sm:space-y-1.5 z-20">
                {/* Status Bar */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] sm:text-xs font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                            Q {questionIndex + 1}/{TOTAL_QUESTIONS}
                        </span>
                        <div className="flex gap-1">
                            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-2 h-2 rounded-full transition-colors ${i < questionIndex ? 'bg-emerald-500' : i === questionIndex ? 'bg-indigo-500 ring-2 ring-indigo-200' : 'bg-slate-200'}`} 
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => {
                                if (phase === 'buildA') speak(`Tap fingers to make ${baseNumber}`);
                                else if (phase === 'buildB') speak(`Tap ${hopNumber} more fingers to add`);
                                else if (phase === 'answer') speak(`Count all fingers and choose the answer`);
                                else if (phase === 'done') speak(`${baseNumber} plus ${hopNumber} equals ${totalInFunnels}`);
                            }}
                            className="p-1 sm:p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 active:scale-95 transition-all shadow-xs"
                            title="Repeat speech"
                        >
                            <Volume2 size={15} />
                        </button>
                        <button 
                            onClick={resetEquation}
                            className="flex items-center gap-1 text-[11px] sm:text-xs font-bold py-1 px-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 active:scale-95 transition-all shadow-xs"
                            title="Reset fingers"
                        >
                            <RotateCcw size={13} />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>

                {/* Equation Display */}
                <div className={`w-full py-1.5 sm:py-2.5 px-3 sm:px-6 rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 sm:gap-6 font-black text-2xl sm:text-4xl md:text-5xl transition-all duration-300 border-2 sm:border-3 ${phase === 'done' ? 'bg-lime-400 border-lime-500 text-slate-900 shadow-sm' : 'bg-white border-indigo-100 shadow-xs'}`}>
                    <span className={phase === 'buildA' ? 'text-rose-500 animate-pulse scale-105 transition-transform' : 'text-rose-500'}>
                        {baseNumber}
                    </span>
                    <span className={phase === 'done' ? 'text-slate-800' : 'text-slate-300'}>+</span>
                    <span className={phase === 'buildB' ? 'text-sky-500 animate-pulse scale-105 transition-transform' : 'text-sky-500'}>
                        {hopNumber}
                    </span>
                    <span className={phase === 'done' ? 'text-slate-800' : 'text-slate-300'}>=</span>
                    <span className={phase === 'done' ? 'scale-110 transition-transform text-slate-900' : phase === 'answer' ? 'text-amber-500 animate-pulse' : 'text-slate-300'}>
                        {phase === 'done' ? totalInFunnels : '?'}
                    </span>
                </div>
            </div>

            {/* 1.5 DYNAMIC INSTRUCTION PILL (Shrink-0) */}
            <div className="w-full max-w-2xl flex justify-center my-1 shrink-0 h-6 sm:h-7">
                {phase === 'buildA' && (
                    <span className="bg-white text-slate-700 text-[11px] sm:text-xs md:text-sm font-black px-3 sm:px-4 py-0.5 rounded-full shadow-xs border border-rose-200 flex items-center gap-1.5 animate-in fade-in duration-200">
                        👆 Tap fingers to make <span className="text-rose-500 font-black">{baseNumber}</span>
                    </span>
                )}
                {phase === 'buildB' && (
                    <span className="bg-white text-slate-700 text-[11px] sm:text-xs md:text-sm font-black px-3 sm:px-4 py-0.5 rounded-full shadow-xs border border-sky-200 flex items-center gap-1.5 animate-in fade-in duration-200">
                        👆 Tap <span className="text-sky-500 font-black">{hopNumber}</span> more fingers to add
                    </span>
                )}
                {phase === 'answer' && (
                    <span className="bg-amber-100 text-amber-800 text-[11px] sm:text-xs md:text-sm font-black px-3 sm:px-4 py-0.5 rounded-full shadow-xs border border-amber-300 animate-in fade-in duration-200">
                        ⭐ Count all fingers and choose the answer below!
                    </span>
                )}
                {phase === 'done' && (
                    <span className="bg-lime-100 text-lime-800 text-[11px] sm:text-xs md:text-sm font-black px-3 sm:px-4 py-0.5 rounded-full shadow-xs border border-lime-300 animate-in fade-in duration-200">
                        🎉 Great Job! {baseNumber} + {hopNumber} = {totalInFunnels}
                    </span>
                )}
            </div>

            {/* 2. MIDDLE: PLAYING FIELD (HANDS SCENE) — Takes Full Height (flex-1 min-h-0) */}
            <div className="relative w-full max-w-2xl flex-1 min-h-0 bg-gradient-to-b from-indigo-100 via-indigo-200/90 to-indigo-300/80 rounded-2xl sm:rounded-3xl shadow-sm border-2 sm:border-3 border-indigo-300 flex flex-col items-center justify-between p-2 sm:p-3 overflow-hidden">
                
                {/* Floating Progress Counter Badge */}
                <div className="shrink-0 z-10">
                    <span className="text-[10px] sm:text-xs font-black bg-white/90 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-xs flex items-center gap-1">
                        Raised: <span className="text-indigo-950 font-black">{totalRaised}</span> / {targetTotal} fingers
                    </span>
                </div>

                {/* Hand SVGs in Full Elastic Height Container */}
                <div className="flex justify-center items-end gap-4 sm:gap-10 md:gap-16 w-full flex-1 min-h-0 px-2 pt-1 pb-1">
                    
                    {/* Left Hand Container */}
                    <div className="flex-1 max-w-[150px] sm:max-w-[190px] md:max-w-[230px] h-full flex flex-col items-center justify-end">
                        <div className="w-full flex-1 min-h-0 flex items-end justify-center">
                            <LeftHand 
                                count={leftCount} 
                                onClick={() => handleHandTap('left')} 
                                interactive={phase === 'buildA' || phase === 'buildB'} 
                            />
                        </div>
                        <span className="text-[10px] sm:text-xs font-black bg-white/95 text-indigo-800 px-2 py-0.5 rounded-md shadow-2xs border border-indigo-200 mt-0.5 shrink-0">
                            Left: {leftCount}
                        </span>
                    </div>

                    {/* Right Hand Container */}
                    <div className="flex-1 max-w-[150px] sm:max-w-[190px] md:max-w-[230px] h-full flex flex-col items-center justify-end">
                        <div className="w-full flex-1 min-h-0 flex items-end justify-center">
                            <RightHand 
                                count={rightCount} 
                                onClick={() => handleHandTap('right')} 
                                interactive={phase === 'buildA' || phase === 'buildB'} 
                            />
                        </div>
                        <span className="text-[10px] sm:text-xs font-black bg-white/95 text-indigo-800 px-2 py-0.5 rounded-md shadow-2xs border border-indigo-200 mt-0.5 shrink-0">
                            Right: {rightCount}
                        </span>
                    </div>

                </div>
            </div>

            {/* 3. BOTTOM: UNIFIED SINGLE-ROW ACTION & OPTIONS BAR (Shrink-0) */}
            <div className="w-full max-w-2xl shrink-0 z-30 pt-1.5 sm:pt-2">
                {phase === 'answer' ? (
                    // OPTION BUTTONS GRID (Single row across all devices)
                    <div className="w-full grid grid-cols-4 gap-2 h-11 sm:h-13 animate-in zoom-in-95 duration-200">
                        {options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleOptionSelect(opt)}
                                className="h-full rounded-xl sm:rounded-2xl border-2 sm:border-3 border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-950 font-black text-xl sm:text-2xl md:text-3xl flex items-center justify-center shadow-xs hover:border-indigo-400 active:scale-95 transition-all cursor-pointer"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                ) : phase === 'done' ? (
                    // NEXT QUESTION BUTTON
                    <div className="w-full h-11 sm:h-13 animate-in fade-in duration-200">
                        <button
                            onClick={handleNextQuestion}
                            className="w-full h-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm sm:text-base md:text-lg rounded-xl sm:rounded-2xl shadow-sm border-b-3 sm:border-b-4 border-emerald-700 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>{questionIndex + 1 < TOTAL_QUESTIONS ? 'Next Question' : 'See Results'}</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                ) : (
                    // INTERACTIVE HELPER STATUS BAR (During finger tapping phases)
                    <div className="w-full h-11 sm:h-13 bg-white/80 backdrop-blur-xs rounded-xl sm:rounded-2xl border border-indigo-200 px-3 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 shadow-2xs">
                        <span className="text-slate-500 truncate">
                            {phase === 'buildA' 
                                ? `Raise ${baseNumber} fingers to continue` 
                                : `Raise ${(hopNumber || 0) - (totalRaised - (baseNumber || 0))} more fingers`}
                        </span>
                        <span className="text-[11px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">
                            {totalRaised} / {targetTotal}
                        </span>
                    </div>
                )}
            </div>

        </div>
    );
}