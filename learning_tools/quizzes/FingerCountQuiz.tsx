"use client";

import React, { useState, useEffect } from 'react';
import { Shuffle, Hand, RotateCcw, Play } from 'lucide-react';

// --- CUSTOM SVG HAND COMPONENTS ---
const LeftHand = ({ count, onClick, interactive }: { count: number, onClick: () => void, interactive: boolean }) => {
  const open = [count >= 1, count >= 2, count >= 3, count >= 4, count >= 5]; // Index, Middle, Ring, Pinky, Thumb
  return (
    <svg viewBox="0 0 100 120" className={`w-full h-full max-h-64 md:max-h-80 drop-shadow-2xl transition-transform ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`} onClick={onClick}>
      {/* Thumb (Left side) */}
      <rect x="13" y="65" width="38" height="14" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transformOrigin: '18px 52px', transform: open[4] ? 'rotate(40deg)' : 'rotate(0deg) translateX(15px) scaleX(0.5)' }} />
      {/* Fingers behind palm */}
      <rect x="24" y="20" width="12" height="45" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[0] ? 'translateY(0)' : 'translateY(35px)' }} />
      <rect x="38" y="10" width="12" height="55" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[1] ? 'translateY(0)' : 'translateY(40px)' }} />
      <rect x="52" y="15" width="12" height="50" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[2] ? 'translateY(0)' : 'translateY(35px)' }} />
      <rect x="66" y="25" width="12" height="40" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[3] ? 'translateY(0)' : 'translateY(30px)' }} />
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
   <svg viewBox="0 0 100 120" className={`w-full h-full max-h-64 md:max-h-80 drop-shadow-2xl transition-transform ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`} onClick={onClick}>
      {/* Fingers behind palm */}
      <rect x="22" y="25" width="12" height="40" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[3] ? 'translateY(0)' : 'translateY(30px)' }} />
      <rect x="36" y="15" width="12" height="50" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[2] ? 'translateY(0)' : 'translateY(35px)' }} />
      <rect x="50" y="10" width="12" height="55" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[1] ? 'translateY(0)' : 'translateY(40px)' }} />
      <rect x="64" y="20" width="12" height="45" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[0] ? 'translateY(0)' : 'translateY(35px)' }} />
      {/* Thumb (Right side) */}
      <rect x="65" y="65" width="38" height="14" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transformOrigin: '85px 72px', transform: open[4] ? 'rotate(-40deg)' : 'rotate(0deg) translateX(-15px) scaleX(0.5)' }} />
      {/* Palm */}
      <rect x="20" y="55" width="58" height="55" rx="15" fill="#fcd34d" stroke="#d97706" strokeWidth="2" />
      {/* Palm crease line */}
      <path d="M 30,85 Q 50,75 70,80" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
};


export default function FingerCountQuiz({ lesson, onComplete }: any) {
    // Equation States (Addition up to 10)
    const [baseNumber, setBaseNumber] = useState<number | null>(null); 
    const [hopNumber, setHopNumber] = useState<number | null>(null);   
    const [options, setOptions] = useState<number[]>([]);
    
    // Quiz States
    const [phase, setPhase] = useState<'start' | 'buildA' | 'buildB' | 'answer' | 'done'>('start');
    
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
            window.speechSynthesis.cancel(); 
            const msg = new SpeechSynthesisUtterance(text);
            msg.rate = 0.85; 
            msg.pitch = 1.2; 
            window.speechSynthesis.speak(msg);
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

        let opts = new Set([randomTotal]);
        while(opts.size < 4) {
            let offset = Math.floor(Math.random() * 5) - 2; 
            let fakeAns = randomTotal + offset;
            if (fakeAns > 0 && fakeAns <= 10 && fakeAns !== randomTotal) {
                opts.add(fakeAns);
            } else {
                opts.add(Math.floor(Math.random() * 10) + 1); 
            }
        }
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        
        playSound('pop');
        setTimeout(() => speak(`First, tap your fingers to make the number ${randomA}.`), 500);
    };

    const resetEquation = () => {
        if (phase === 'start' || baseNumber === null || hopNumber === null) return;
        
        setPhase('buildA');
        setLeftCount(0);
        setRightCount(0);
        
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        playSound('pop');
        setTimeout(() => speak(`Let's try again. Tap your fingers to make the number ${baseNumber}.`), 500);
    };

    // --- INTERACTION LOGIC ---
    const handleHandTap = (hand: 'left' | 'right') => {
        if (phase === 'done' || phase === 'answer' || phase === 'start' || baseNumber === null || hopNumber === null) return;

        let targetTotal = phase === 'buildA' ? baseNumber : totalInFunnels;

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
                }, 800);
            } else if (phase === 'buildB') {
                setTimeout(() => {
                    playSound('success');
                    speak(`Perfect! Now count all your fingers and choose the answer.`);
                    setPhase('answer');
                }, 800);
            }
        }
    };

    const handleOptionSelect = (selectedOpt: number) => {
        if (phase !== 'answer' || baseNumber === null || hopNumber === null) return;

        if (selectedOpt === totalInFunnels) {
            playSound('success');
            speak(`${baseNumber} plus ${hopNumber} equals ${totalInFunnels}`);
            setPhase('done');
        } else {
            playSound('error');
            speak("Oops! Recount carefully and try again.");
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center p-2 md:p-6 bg-indigo-50 font-sans select-none overflow-hidden relative">
            
            {/* 1. TOP: EQUATION BANNER */}
            <div className="w-full max-w-4xl shrink-0 z-20 relative">
                <div className={`w-full py-4 md:py-6 rounded-[1.5rem] flex items-center justify-center gap-4 md:gap-8 font-black text-4xl md:text-6xl transition-all duration-500 border-b-4 md:border-b-8 ${phase === 'done' ? 'bg-lime-400 border-lime-500 text-slate-900 shadow-[0_0_30px_rgba(163,230,53,0.5)]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className={phase === 'buildA' ? 'text-rose-500 animate-pulse scale-110 transition-transform' : 'text-rose-500'}>
                        {phase === 'start' ? '?' : baseNumber}
                    </span>
                    <span className={phase === 'done' ? 'text-slate-800' : 'text-slate-300'}>+</span>
                    <span className={phase === 'buildB' ? 'text-sky-500 animate-pulse scale-110 transition-transform' : 'text-sky-500'}>
                        {phase === 'start' ? '?' : hopNumber}
                    </span>
                    <span className={phase === 'done' ? 'text-slate-800' : 'text-slate-300'}>=</span>
                    <span className={phase === 'done' ? 'scale-125 transition-transform text-slate-900' : phase === 'answer' ? 'text-amber-400 animate-pulse' : 'text-slate-300'}>
                        {phase === 'done' ? totalInFunnels : '?'}
                    </span>
                </div>
            </div>

            {/* 1.5 DYNAMIC INSTRUCTIONS */}
            <div className="w-full max-w-4xl flex justify-center mt-3 mb-1 shrink-0 h-8 md:h-12">
                {phase === 'start' && <span className="bg-white/90 text-slate-700 text-sm md:text-lg font-black px-6 py-2 rounded-full shadow-sm border-2 border-indigo-100 flex items-center gap-2"><Play size={18} className="text-purple-500"/> Press New Equation to Start!</span>}
                {phase === 'buildA' && <span className="bg-white/90 text-slate-700 text-sm md:text-lg font-black px-6 py-2 rounded-full shadow-sm border-2 border-indigo-100 flex items-center gap-2 animate-fade-in"><Hand className="text-rose-500" size={18}/> TAP to make <span className="text-rose-500">{baseNumber}</span></span>}
                {phase === 'buildB' && <span className="bg-white/90 text-slate-700 text-sm md:text-lg font-black px-6 py-2 rounded-full shadow-sm border-2 border-indigo-100 flex items-center gap-2 animate-fade-in"><Hand className="text-sky-500" size={18}/> TAP to add <span className="text-sky-500">{hopNumber}</span></span>}
                {phase === 'answer' && <span className="bg-white/90 text-amber-600 text-sm md:text-lg font-black px-6 py-2 rounded-full shadow-sm border-2 border-amber-200 animate-fade-in">Count all fingers to find the answer!</span>}
                {phase === 'done' && <span className="bg-lime-100 text-lime-700 text-sm md:text-lg font-black px-6 py-2 rounded-full shadow-sm border-2 border-lime-300 animate-fade-in">Great Job!</span>}
            </div>

            {/* 2. MIDDLE: THE SVG HANDS SCENE */}
            <div className="relative w-full max-w-5xl flex-1 bg-gradient-to-b from-indigo-100 to-indigo-300 rounded-[2rem] md:rounded-[3rem] shadow-xl border-4 md:border-8 border-indigo-400 flex flex-col items-center justify-center mb-4 box-border overflow-hidden">
                <div className="flex justify-center items-end gap-8 md:gap-24 w-full h-[65%] md:h-[75%] z-20 px-4 pt-4 pb-8">
                    
                    {/* Left Hand SVG Wrapper */}
                    <div className="w-40 md:w-64 h-full flex items-end">
                        <LeftHand 
                            count={leftCount} 
                            onClick={() => handleHandTap('left')} 
                            interactive={phase === 'buildA' || phase === 'buildB'} 
                        />
                    </div>

                    {/* Right Hand SVG Wrapper */}
                    <div className="w-40 md:w-64 h-full flex items-end">
                        <RightHand 
                            count={rightCount} 
                            onClick={() => handleHandTap('right')} 
                            interactive={phase === 'buildA' || phase === 'buildB'} 
                        />
                    </div>

                </div>
            </div>

            {/* 3. BOTTOM: PERMANENT CONTROLS & MULTIPLE CHOICE GRID */}
            <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center shrink-0 z-30 pb-2 md:pb-4 px-2 md:px-4 gap-4">
                
                {/* --- PERMANENT MANAGEMENT BUTTONS --- */}
                <div className="flex gap-2 md:gap-4 w-full md:w-auto justify-center">
                    <button 
                        onClick={resetEquation}
                        disabled={phase === 'start'}
                        className={`font-black text-sm md:text-lg px-4 md:px-6 py-4 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 transition-all ${phase === 'start' ? 'bg-slate-200 text-slate-400 border-2 border-slate-300 cursor-not-allowed' : 'bg-white hover:bg-slate-50 text-slate-600 border-2 border-slate-200 shadow-sm active:translate-y-1 active:shadow-none'}`}
                    >
                        <RotateCcw size={20} /> <span className="hidden sm:inline">Reset</span>
                    </button>

                    <button 
                        onClick={generateEquation}
                        className="bg-purple-500 hover:bg-purple-400 text-white font-black text-sm md:text-xl px-4 md:px-8 py-4 md:py-4 rounded-2xl md:rounded-3xl flex items-center justify-center gap-2 shadow-[0_6px_0_rgb(147,51,234)] md:shadow-[0_8px_0_rgb(147,51,234)] active:translate-y-2 active:shadow-none transition-all"
                    >
                        <Shuffle size={24} /> <span className="hidden sm:inline">New Equation</span>
                    </button>
                </div>

                {/* --- OPTIONS GRID --- */}
                <div className="flex-1 w-full grid grid-cols-4 gap-2 md:gap-4 md:pl-8">
                    {options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleOptionSelect(opt)}
                            disabled={phase !== 'answer'}
                            className={`py-4 md:py-6 rounded-2xl md:rounded-3xl border-4 font-black text-3xl md:text-5xl transition-all ${phase === 'answer' ? 'bg-white border-indigo-200 text-indigo-900 shadow-[0_6px_0_rgb(199,210,254)] hover:-translate-y-1 active:translate-y-2 active:shadow-none cursor-pointer animate-fade-in' : phase === 'done' && opt === totalInFunnels ? 'bg-lime-400 border-lime-500 text-lime-950 shadow-[0_6px_0_rgb(101,163,13)]' : phase === 'start' ? 'bg-slate-100/50 border-slate-200/50 text-transparent shadow-none' : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed shadow-none'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

            </div>
            
        </div>
    );
}