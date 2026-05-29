"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Shuffle, RotateCcw, ArrowRight, Settings, Calculator } from 'lucide-react';

type Operation = '+' | '-';
type LimitSelect = 10 | 20;

export default function AdditionFrog({ lesson, onComplete }: any) {
    // Config State
    const [phase, setPhase] = useState<'config' | 'playing'>('config');
    const [config, setConfig] = useState<{ op: Operation, limit: LimitSelect }>({ op: '+', limit: 10 });

    // Core Math States
    const [baseNumber, setBaseNumber] = useState(0); 
    const [hopNumber, setHopNumber] = useState(0);   
    
    // Animation & Scene States
    const [frogPos, setFrogPos] = useState(0);
    const [frogDir, setFrogDir] = useState<1 | -1>(1); // 1 = right, -1 = left
    const [isJumping, setIsJumping] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [hopType, setHopType] = useState<'big' | 'small' | null>(null); 
    const [activePad, setActivePad] = useState<number | null>(null);

    const calcResult = config.op === '+' ? baseNumber + hopNumber : baseNumber - hopNumber;

    // --- AUDIO ENGINE ---
    const playSound = (type: 'boing' | 'click' | 'pop') => {
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
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'click' || type === 'pop') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.05);
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

    // --- BUTTON CONTROLS ---
    const handleAddBase = () => {
        if (isJumping) return;
        if (config.op === '+' && baseNumber + hopNumber >= config.limit) return;
        if (config.op === '-' && baseNumber >= config.limit) return;
        
        playSound('click');
        setBaseNumber(prev => prev + 1);
        if (!showResult) { setFrogPos(0); setActivePad(0); }
    };
    
    const handleSubBase = () => {
        if (isJumping || baseNumber <= 0) return;
        playSound('click');
        
        // Failsafe for subtraction: hopNumber cannot exceed baseNumber
        if (config.op === '-' && (baseNumber - 1) < hopNumber) {
            setHopNumber(baseNumber - 1);
        }
        
        setBaseNumber(prev => prev - 1);
        if (!showResult) { setFrogPos(0); setActivePad(0); }
    };

    const handleAddHop = () => {
        if (isJumping) return;
        if (config.op === '+' && baseNumber + hopNumber >= config.limit) return;
        if (config.op === '-' && hopNumber >= baseNumber) return; // Can't hop back further than 0
        
        playSound('click');
        setHopNumber(prev => prev + 1);
        if (!showResult) { setFrogPos(0); setActivePad(0); }
    };
    
    const handleSubHop = () => {
        if (isJumping || hopNumber <= 0) return;
        playSound('click');
        setHopNumber(prev => prev - 1);
        if (!showResult) { setFrogPos(0); setActivePad(0); }
    };

    // --- ASYNC HOPPING LOGIC ---
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const triggerJump = async () => {
        if ((baseNumber === 0 && hopNumber === 0) || isJumping) return;
        
        setIsJumping(true);
        setShowResult(false);
        setActivePad(null);
        setFrogPos(0);
        setFrogDir(1); // Face right initially

        await sleep(300); 
        
        // 1. The Big Base Jump
        if (baseNumber > 0) {
            setHopType('big');
            setFrogPos(baseNumber);
            await sleep(800); 
            
            setHopType(null);
            setActivePad(baseNumber); 
            playSound('boing');
            speak(baseNumber.toString());
            await sleep(1200); 
        }
        
        // 1.5 The Conversational Transition
        if (hopNumber > 0) {
            const dirWord = config.op === '+' ? 'more jumps forward' : 'jumps backward';
            speak(`now let us take ${hopNumber} ${dirWord}`);
            await sleep(2500); 
        }

        // Prepare frog direction for small hops
        if (config.op === '-') setFrogDir(-1); // Face left if subtracting

        // 2. The Small Addition/Subtraction Hops
        for (let i = 1; i <= hopNumber; i++) {
            setHopType('small');
            const targetPos = config.op === '+' ? baseNumber + i : baseNumber - i;
            setFrogPos(targetPos);
            await sleep(500); 
            
            setHopType(null);
            setActivePad(targetPos); 
            playSound('boing');
            speak(i.toString()); 
            await sleep(800); 
        }
        
        // 3. Final Conclusion
        await sleep(400);
        setShowResult(true);
        setActivePad(calcResult); 
        setFrogDir(1); // Reset face forward
        const opWord = config.op === '+' ? 'plus' : 'minus';
        speak(`${baseNumber} ${opWord} ${hopNumber} equals ${calcResult}`);
        setIsJumping(false);
    };

    // --- DASHBOARD ACTIONS ---
    const resetMachine = () => {
        playSound('pop');
        setBaseNumber(0);
        setHopNumber(0);
        setFrogPos(0);
        setFrogDir(1);
        setIsJumping(false);
        setShowResult(false);
        setHopType(null);
        setActivePad(0);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };

    const handleRandomize = () => {
        playSound('pop');
        const randomTotal = Math.floor(Math.random() * config.limit) + 1; 
        let randomA, randomB;
        
        if (config.op === '+') {
            randomA = Math.floor(Math.random() * (randomTotal + 1));
            randomB = randomTotal - randomA;
        } else {
            randomA = randomTotal;
            randomB = Math.floor(Math.random() * (randomA + 1));
        }
        
        setBaseNumber(randomA);
        setHopNumber(randomB);
        setFrogPos(0);
        setFrogDir(1);
        setIsJumping(false);
        setShowResult(false);
        setHopType(null);
        setActivePad(0);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };

    const startPractice = () => {
        playSound('pop');
        resetMachine();
        setPhase('playing');
    };

    useEffect(() => {
        if (!isJumping && !showResult) setActivePad(0);
    }, [isJumping, showResult]);

    // --- HELPER FOR SVG & POSITIONS ---
    const getPadX = (num: number) => (num / config.limit) * 90 + 5;

    // ============================================================================
    // RENDER: CONFIGURATION SCREEN
    // ============================================================================
    if (phase === 'config') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-cyan-50 font-sans overflow-y-auto">
                <div className="max-w-xl w-full bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border-4 border-cyan-200 text-center space-y-6 my-auto">
                    <div className="flex justify-center"><div className="bg-cyan-100 p-3 rounded-full text-cyan-600 shadow-inner"><Settings size={36} /></div></div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Number Line Setup</h1>
                        <p className="text-xs md:text-sm text-slate-500 font-medium mt-2">Configure frog jump parameters.</p>
                    </div>
                    
                    <div className="space-y-6 text-left">
                        <div>
                            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">1. Select Operation</label>
                            <div className="flex gap-2">
                                {(['+', '-'] as Operation[]).map(op => (
                                    <button 
                                        key={op} 
                                        onClick={() => { playSound('click'); setConfig({...config, op: op}); }} 
                                        className={`flex-1 py-3 text-xl font-black rounded-xl border-4 transition-all shadow-sm ${config.op === op ? 'bg-cyan-100 border-cyan-500 text-cyan-700 scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-cyan-300'}`}
                                    >
                                        {op === '+' ? 'Addition (+)' : 'Subtraction (-)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                <span>2. Number Line Range</span>
                            </label>
                            <div className="flex gap-2">
                                {([10, 20] as LimitSelect[]).map(l => (
                                    <button 
                                        key={l} 
                                        onClick={() => { playSound('click'); setConfig({...config, limit: l}); }} 
                                        className={`flex-1 py-3 text-sm md:text-base font-black rounded-xl border-4 transition-all shadow-sm ${config.limit === l ? 'bg-amber-100 border-amber-500 text-amber-700 scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-amber-300'}`}
                                    >
                                        Up to {l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={startPractice} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black text-lg py-4 rounded-xl shadow-[0_4px_0_rgb(15,23,42)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 mt-4"><Calculator size={20} /> Start Jumping</button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PLAYING SANDBOX
    // ============================================================================
    // Dynamic sizing based on limit selection
    const padClasses = config.limit === 10 
        ? "w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-sm sm:text-xl md:text-3xl border-[3px] md:border-[4px]" 
        : "w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 text-[9px] sm:text-xs md:text-sm border-[2px] md:border-[3px]";
    
    const padIndicatorClass = config.limit === 10
        ? "w-2.5 h-2.5 md:w-4 md:h-4 -top-1 -right-1"
        : "w-1.5 h-1.5 md:w-2 md:h-2 top-0 right-0";

    const frogClasses = config.limit === 10
        ? "text-5xl md:text-7xl lg:text-8xl mb-[10px] md:mb-[15px]"
        : "text-3xl md:text-4xl lg:text-5xl mb-[5px] md:mb-[10px]";

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

            {/* 1. TOP: COMPACT BANNER & EQUATION */}
            <div className="w-full max-w-5xl shrink-0 z-20 relative mb-2 flex gap-2">
                <button 
                    onClick={() => setPhase('config')} 
                    className="shrink-0 px-3 py-2 bg-white text-slate-500 rounded-2xl border-2 border-slate-200 font-bold uppercase hover:bg-slate-50 flex items-center justify-center shadow-sm"
                >
                    <Settings size={18} />
                </button>

                <div className={`flex-1 py-2 md:py-4 rounded-[1.5rem] flex items-center justify-center gap-3 md:gap-6 font-black text-3xl md:text-5xl transition-all duration-500 border-b-4 md:border-b-8 ${showResult ? 'bg-lime-400 border-lime-500 text-slate-900 shadow-[0_0_30px_rgba(163,230,53,0.5)]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className="text-rose-500">{baseNumber}</span>
                    <span className={showResult ? 'text-slate-800' : 'text-slate-300'}>{config.op}</span>
                    <span className="text-sky-500">{hopNumber}</span>
                    <span className={showResult ? 'text-slate-800' : 'text-slate-300'}>=</span>
                    <span className={showResult ? 'scale-125 transition-transform text-slate-900' : 'text-slate-300'}>
                        {showResult ? calcResult : '?'}
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
                    {/* Big Base Arc */}
                    {!showResult && baseNumber > 0 && (
                        <path 
                            d={`M 5 75 Q ${getPadX(baseNumber/2)} ${75 - Math.min(baseNumber * (config.limit===10 ? 8 : 4), 45)} ${getPadX(baseNumber)} 75`} 
                            fill="none" stroke="#f43f5e" strokeWidth="0.6" strokeDasharray="2 1.5" 
                            className="opacity-70 animate-pulse"
                        />
                    )}
                    {/* Small Hop Arcs */}
                    {!showResult && Array.from({length: hopNumber}).map((_, i) => {
                        const startNum = config.op === '+' ? baseNumber + i : baseNumber - i;
                        const endNum = config.op === '+' ? baseNumber + i + 1 : baseNumber - i - 1;
                        const startX = getPadX(startNum);
                        const endX = getPadX(endNum);
                        const midX = (startX + endX) / 2;
                        return (
                            <path 
                                key={i} 
                                d={`M ${startX} 75 Q ${midX} 55 ${endX} 75`} 
                                fill="none" stroke="#0ea5e9" strokeWidth="0.6" strokeDasharray="2 1.5"
                                className="opacity-80 animate-pulse"
                            />
                        )
                    })}
                </svg>

                {/* --- THE NUMBER LINE (Lily Pads) --- */}
                <div className="absolute bottom-[25%] left-0 w-full z-20 translate-y-1/2">
                    <div className="relative w-full h-2 bg-cyan-700/50 rounded-full">
                        {Array.from({ length: config.limit + 1 }).map((_, i) => {
                            const isActive = activePad === i;
                            return (
                                <div 
                                    key={i} 
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                                    style={{ left: `${getPadX(i)}%` }} 
                                >
                                    <div className={`rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${padClasses} ${isActive ? 'bg-amber-400 border-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-[1.3] z-30 animate-pulse' : 'bg-emerald-500 border-emerald-700 shadow-md scale-100 z-20'}`}>
                                        <div className={`rounded-full absolute opacity-50 ${padIndicatorClass} ${isActive ? 'bg-white' : 'bg-emerald-400'}`}></div>
                                        <span className={`font-black ${isActive ? 'text-amber-950' : 'text-emerald-950'}`}>{i}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- THE FROG --- */}
                <div 
                    className={`absolute bottom-[25%] z-40 ${frogClasses}`}
                    style={{ 
                        left: `${getPadX(frogPos)}%`, 
                        transform: 'translateX(-50%)',
                        transitionProperty: 'left',
                        transitionDuration: hopType === 'big' ? '800ms' : hopType === 'small' ? '500ms' : '0ms',
                        transitionTimingFunction: 'linear' 
                    }}
                >
                    <div style={{ transform: `scaleX(${frogDir})`, transition: 'transform 300ms ease-in-out' }}>
                        <div className={`drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] ${hopType === 'big' ? 'hop-big' : hopType === 'small' ? 'hop-small' : ''}`}>
                            🐸
                        </div>
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
                <div className="flex items-center gap-1 md:gap-4 w-full md:w-auto justify-center order-1 md:order-2 bg-white/60 p-2 md:p-3 rounded-2xl md:rounded-full border-2 border-slate-200 shadow-sm backdrop-blur-md">
                    
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
                        disabled={(baseNumber === 0 && hopNumber === 0) || isJumping}
                        className={`px-4 py-2 md:px-8 md:py-4 rounded-full border-4 shadow-[0_6px_0_rgb(180,83,9),0_10px_15px_rgba(0,0,0,0.2)] flex items-center justify-center font-black text-sm md:text-xl tracking-wider active:translate-y-2 active:shadow-none transition-all ml-1 md:ml-2 ${(baseNumber === 0 && hopNumber === 0) || isJumping ? 'bg-amber-600 border-amber-500 text-amber-900 pointer-events-none opacity-80' : 'bg-amber-400 border-amber-200 text-amber-950 animate-pulse'}`}
                    >
                        JUMP
                    </button>
                </div>
            </div>
            
        </div>
    );
}