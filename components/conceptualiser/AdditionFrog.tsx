"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Shuffle, RotateCcw, ArrowRight } from 'lucide-react';

export default function AdditionFrog({ lesson, onComplete }: any) {
    // Core Math States
    const [baseNumber, setBaseNumber] = useState(0); 
    const [hopNumber, setHopNumber] = useState(0);   
    
    // Animation & Scene States
    const [frogPos, setFrogPos] = useState(0);
    const [isJumping, setIsJumping] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [hopType, setHopType] = useState<'big' | 'small' | null>(null); 
    const [activePad, setActivePad] = useState<number | null>(null);

    const totalInFunnels = baseNumber + hopNumber;
    const maxLimit = 10;

    // --- AUDIO ENGINE (Vercel Safe) ---
    const playBoing = () => {
        if (typeof window === 'undefined') return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
            console.log("Audio failed to play", e);
        }
    };

    const speak = (text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Clear any queued speech
            const msg = new SpeechSynthesisUtterance(text);
            msg.rate = 0.85; // Slightly slower for kids
            msg.pitch = 1.2; // Friendly tone
            window.speechSynthesis.speak(msg);
        }
    };

    // --- BUTTON CONTROLS ---
    const handleAddBase = () => {
        if (totalInFunnels >= maxLimit || isJumping) return;
        setBaseNumber(prev => prev + 1);
        if (!showResult) { setFrogPos(0); setActivePad(0); }
    };
    const handleSubBase = () => {
        if (isJumping) return;
        if (baseNumber > 0) setBaseNumber(prev => prev - 1);
        if (!showResult) { setFrogPos(0); setActivePad(0); }
    };

    const handleAddHop = () => {
        if (totalInFunnels >= maxLimit || isJumping) return;
        setHopNumber(prev => prev + 1);
        if (!showResult) { setFrogPos(0); setActivePad(0); }
    };
    const handleSubHop = () => {
        if (isJumping) return;
        if (hopNumber > 0) setHopNumber(prev => prev - 1);
        if (!showResult) { setFrogPos(0); setActivePad(0); }
    };

    // --- ASYNC HOPPING LOGIC ---
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const triggerJump = async () => {
        if (totalInFunnels === 0 || isJumping) return;
        
        setIsJumping(true);
        setShowResult(false);
        setActivePad(null);
        setFrogPos(0);

        // Prep pause
        await sleep(300); 
        
        // 1. The Big Base Jump
        if (baseNumber > 0) {
            setHopType('big');
            setFrogPos(baseNumber);
            await sleep(800); // Perfectly matches CSS hop-big duration
            
            setHopType(null);
            setActivePad(baseNumber); // Blink the pad
            playBoing();
            speak(baseNumber.toString());
            await sleep(1200); // Rest so child can hear the number, and prevents TTS overlapping
        }
        
        // 1.5 NEW: The Conversational Transition
        if (hopNumber > 0) {
            speak(`now let us add ${hopNumber} more jumps`);
            await sleep(2500); // Frog pauses here as the audio is spoken
        }

        // 2. The Small Addition Hops
        for (let i = 1; i <= hopNumber; i++) {
            setHopType('small');
            setFrogPos(baseNumber + i);
            await sleep(500); // Perfectly matches CSS hop-small duration
            
            setHopType(null);
            setActivePad(baseNumber + i); // Blink the pad
            playBoing();
            speak(i.toString()); // Counts: 1, 2, 3...
            await sleep(800); // Rest between hops
        }
        
        // 3. Final Conclusion
        await sleep(400);
        setShowResult(true);
        setActivePad(totalInFunnels); // Final answer pulses
        speak(`${baseNumber} plus ${hopNumber} equals ${totalInFunnels}`);
        setIsJumping(false);
    };

    // --- DASHBOARD ACTIONS ---
    const resetMachine = () => {
        setBaseNumber(0);
        setHopNumber(0);
        setFrogPos(0);
        setIsJumping(false);
        setShowResult(false);
        setHopType(null);
        setActivePad(0);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };

    const handleRandomize = () => {
        const randomTotal = Math.floor(Math.random() * 10) + 1; 
        const randomA = Math.floor(Math.random() * (randomTotal + 1));
        const randomB = randomTotal - randomA;
        
        setBaseNumber(randomA);
        setHopNumber(randomB);
        setFrogPos(0);
        setIsJumping(false);
        setShowResult(false);
        setHopType(null);
        setActivePad(0);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };

    // Ensure initial active pad is 0
    useEffect(() => {
        if (!isJumping && !showResult) setActivePad(0);
    }, [isJumping, showResult]);

    return (
        <div className="w-full h-full flex flex-col items-center p-2 md:p-4 bg-cyan-50 font-sans select-none overflow-hidden relative">
            
            {/* Custom High-Arc Smooth Animations */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes hop-big {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-240px) scale(1.2); }
                }
                @keyframes hop-small {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-120px) scale(1.1); }
                }
                .hop-big { animation: hop-big 800ms cubic-bezier(0.2, 0.8, 0.8, 0.2) forwards; }
                .hop-small { animation: hop-small 500ms cubic-bezier(0.2, 0.8, 0.8, 0.2) forwards; }
            `}} />

            {/* 1. TOP: COMPACT EQUATION BANNER */}
            <div className="w-full max-w-4xl shrink-0 z-20 relative mb-2">
                <div className={`w-full py-2 md:py-4 rounded-[1.5rem] flex items-center justify-center gap-3 md:gap-6 font-black text-3xl md:text-5xl transition-all duration-500 border-b-4 md:border-b-8 ${showResult ? 'bg-lime-400 border-lime-500 text-slate-900 shadow-[0_0_30px_rgba(163,230,53,0.5)]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className="text-rose-500">{baseNumber}</span>
                    <span className={showResult ? 'text-slate-800' : 'text-slate-300'}>+</span>
                    <span className="text-sky-500">{hopNumber}</span>
                    <span className={showResult ? 'text-slate-800' : 'text-slate-300'}>=</span>
                    <span className={showResult ? 'scale-125 transition-transform text-slate-900' : 'text-slate-300'}>
                        {showResult ? totalInFunnels : '?'}
                    </span>
                </div>
            </div>

            {/* 2. MIDDLE: MAXIMIZED POND SCENE */}
            <div className="relative w-full max-w-5xl flex-1 bg-gradient-to-b from-cyan-100 to-cyan-400 rounded-[2rem] md:rounded-[3rem] shadow-xl border-4 md:border-8 border-cyan-500 flex flex-col justify-end mb-4 box-border overflow-hidden">
                
                {/* Background Decor */}
                <div className="absolute top-[10%] left-[10%] w-32 h-10 bg-white/40 rounded-full blur-md"></div>
                <div className="absolute top-[20%] right-[15%] w-40 h-12 bg-white/40 rounded-full blur-md"></div>
                
                {/* Water Level */}
                <div className="absolute bottom-0 left-0 w-full h-[25%] bg-cyan-600/30 z-0"></div>

                {/* --- SVG GHOST ARCS --- */}
                <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {!showResult && baseNumber > 0 && (
                        <path 
                            d={`M 5 75 Q ${(baseNumber * 9) / 2 + 5} ${75 - Math.min(baseNumber * 8, 45)} ${baseNumber * 9 + 5} 75`} 
                            fill="none" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="2 1.5" 
                            className="opacity-70 animate-pulse"
                        />
                    )}
                    {!showResult && Array.from({length: hopNumber}).map((_, i) => {
                        const startX = (baseNumber + i) * 9 + 5;
                        const endX = startX + 9;
                        return (
                            <path 
                                key={i} 
                                d={`M ${startX} 75 Q ${startX + 4.5} 55 ${endX} 75`} 
                                fill="none" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="2 1.5"
                                className="opacity-80 animate-pulse"
                            />
                        )
                    })}
                </svg>

                {/* --- THE NUMBER LINE (Lily Pads) --- */}
                <div className="absolute bottom-[25%] left-0 w-full z-20 translate-y-1/2">
                    <div className="relative w-full h-2 bg-cyan-700/50 rounded-full">
                        {Array.from({ length: 11 }).map((_, i) => {
                            const isActive = activePad === i;
                            return (
                                <div 
                                    key={i} 
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                                    style={{ left: `calc(${i * 9}% + 5%)` }} 
                                >
                                    <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${isActive ? 'bg-amber-400 border-4 border-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-[1.3] z-30 animate-pulse' : 'bg-emerald-500 border-b-4 border-emerald-700 shadow-md scale-100 z-20'}`}>
                                        <div className={`w-3 h-3 md:w-5 md:h-5 rounded-full absolute -top-1 -right-1 opacity-50 ${isActive ? 'bg-white' : 'bg-emerald-400'}`}></div>
                                        <span className={`font-black text-xl md:text-3xl ${isActive ? 'text-amber-950' : 'text-emerald-950'}`}>{i}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- THE FROG --- */}
                <div 
                    className="absolute bottom-[25%] z-40 mb-[10px] md:mb-[15px]"
                    style={{ 
                        left: `calc(${frogPos * 9}% + 5%)`, 
                        transform: 'translateX(-50%)',
                        transitionProperty: 'left',
                        transitionDuration: hopType === 'big' ? '800ms' : hopType === 'small' ? '500ms' : '0ms',
                        transitionTimingFunction: 'linear' 
                    }}
                >
                    <div className={`text-6xl md:text-8xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] ${hopType === 'big' ? 'hop-big' : hopType === 'small' ? 'hop-small' : ''}`}>
                        🐸
                    </div>
                </div>
            </div>

            {/* 3. BOTTOM: LOGICAL FLOW DASHBOARD */}
            <div className="w-full max-w-5xl flex flex-wrap md:flex-nowrap justify-center md:justify-between items-center gap-4 shrink-0 z-30 pb-2 md:pb-4">
                
                {/* --- LEFT: MANAGEMENT TOOLS --- */}
                <div className="flex gap-2 w-full md:w-auto justify-center md:justify-start order-2 md:order-1">
                    <button 
                        onClick={resetMachine}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-black text-sm md:text-base px-4 md:px-5 py-2 md:py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                        <RotateCcw size={18} /> Reset
                    </button>
                    <button 
                        onClick={handleRandomize}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-700 border-2 border-purple-200 font-black text-sm md:text-base px-4 md:px-5 py-2 md:py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                        <Shuffle size={18} /> Mix
                    </button>
                </div>

                {/* --- RIGHT: THE LOGICAL MATH FLOW --- */}
                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-center order-1 md:order-2 bg-white/60 p-2 md:p-3 rounded-2xl md:rounded-full border-2 border-slate-200 shadow-sm backdrop-blur-md">
                    
                    {/* RED: Base Number */}
                    <div className="flex items-center gap-1 md:gap-2 bg-rose-600 p-1 md:p-2 rounded-full shadow-[0_4px_0_rgb(159,18,57)] border-2 border-rose-400">
                        <button onClick={handleSubBase} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-400 active:scale-90 transition-transform text-white shadow-inner"><Minus strokeWidth={4} size={20}/></button>
                        <span className="font-black text-xl md:text-2xl text-white w-6 md:w-8 text-center">{baseNumber}</span>
                        <button onClick={handleAddBase} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-rose-400 flex items-center justify-center hover:bg-rose-300 active:scale-90 transition-transform text-white shadow-md border border-rose-300"><Plus strokeWidth={4} size={20}/></button>
                    </div>

                    <ArrowRight className="text-slate-400 hidden sm:block" size={24} />

                    {/* BLUE: Hop Number */}
                    <div className="flex items-center gap-1 md:gap-2 bg-sky-600 p-1 md:p-2 rounded-full shadow-[0_4px_0_rgb(3,105,161)] border-2 border-sky-400">
                        <button onClick={handleSubHop} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-sky-500 flex items-center justify-center hover:bg-sky-400 active:scale-90 transition-transform text-white shadow-inner"><Minus strokeWidth={4} size={20}/></button>
                        <span className="font-black text-xl md:text-2xl text-white w-6 md:w-8 text-center">{hopNumber}</span>
                        <button onClick={handleAddHop} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-sky-400 flex items-center justify-center hover:bg-sky-300 active:scale-90 transition-transform text-white shadow-md border border-sky-300"><Plus strokeWidth={4} size={20}/></button>
                    </div>

                    <ArrowRight className="text-slate-400 hidden sm:block" size={24} />

                    {/* AMBER: JUMP Action */}
                    <button 
                        onClick={triggerJump}
                        disabled={totalInFunnels === 0 || isJumping}
                        className={`px-6 py-3 md:px-8 md:py-4 rounded-full border-4 shadow-[0_6px_0_rgb(180,83,9),0_10px_15px_rgba(0,0,0,0.2)] flex items-center justify-center font-black text-lg md:text-xl tracking-wider active:translate-y-2 active:shadow-none transition-all ml-2 ${totalInFunnels === 0 || isJumping ? 'bg-amber-600 border-amber-500 text-amber-900 pointer-events-none opacity-80' : 'bg-amber-400 border-amber-200 text-amber-950 animate-pulse'}`}
                    >
                        JUMP
                    </button>
                </div>
            </div>
            
        </div>
    );
}