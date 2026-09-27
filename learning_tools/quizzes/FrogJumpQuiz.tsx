"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Shuffle, CheckCircle, Hand, Settings, Calculator } from 'lucide-react';

type Operation = '+' | '-';
type LimitSelect = 10 | 20;

export default function FrogJumpQuiz({ lesson, onComplete }: any) {
    // Config State
    const [phase, setPhase] = useState<'config' | 'jumpA' | 'jumpB' | 'done'>('config');
    const [config, setConfig] = useState<{ op: Operation, limit: LimitSelect }>({ op: '+', limit: 10 });

    // Equation States
    const [baseNumber, setBaseNumber] = useState(0); 
    const [hopNumber, setHopNumber] = useState(0);   
    
    // Quiz & Drag States
    const [frogPos, setFrogPos] = useState(0);
    const [activePad, setActivePad] = useState<number | null>(0);
    const [jumpsCompleted, setJumpsCompleted] = useState(0); 
    const [markedPads, setMarkedPads] = useState<number[]>([]); 

    // Physics Drag States
    const pondRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const dragStart = useRef<{ x: number, y: number } | null>(null);

    const calcResult = config.op === '+' ? baseNumber + hopNumber : baseNumber - hopNumber;

    // --- AUDIO ENGINE ---
    const playSound = (type: 'boing' | 'error' | 'success' | 'click' | 'pop') => {
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

    // --- INITIALIZE RANDOM EQUATION ---
    const generateEquation = () => {
        let a = 0, b = 0;
        
        if (config.op === '+') {
            const randomTotal = Math.floor(Math.random() * (config.limit - 1)) + 2; 
            a = Math.floor(Math.random() * (randomTotal - 1)) + 1; 
            b = randomTotal - a;
        } else {
            a = Math.floor(Math.random() * (config.limit - 2)) + 2; 
            b = Math.floor(Math.random() * (a - 1)) + 1; 
        }
        
        setBaseNumber(a);
        setHopNumber(b);
        setFrogPos(0);
        setPhase('jumpA');
        setActivePad(0);
        setJumpsCompleted(0);
        setMarkedPads([]);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        
        playSound('pop');
    };

    const startPractice = () => {
        playSound('click');
        generateEquation();
    };

    // --- HELPER FOR SVG & POSITIONS ---
    const getPadX = (num: number) => (num / config.limit) * 90 + 5;

    // --- DRAG AND DROP LOGIC ---
    const startDrag = (e: any) => {
        if (phase === 'done' || phase === 'config') return;
        setIsDragging(true);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragStart.current = { x: clientX, y: clientY };
        setDragOffset({ x: 0, y: 0 });
    };

    const onDrag = (e: any) => {
        if (!isDragging || !dragStart.current) return;
        e.preventDefault(); 
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setDragOffset({
            x: clientX - dragStart.current.x,
            y: clientY - dragStart.current.y
        });
    };

    const stopDrag = (e: any) => {
        if (!isDragging) return;
        setIsDragging(false);
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;

        if (pondRef.current) {
            const rect = pondRef.current.getBoundingClientRect();
            const xPos = clientX - rect.left;
            const percent = (xPos / rect.width) * 100;
            
            // Calculate which pad based on the current limit
            const padSpacing = 90 / config.limit;
            let droppedPad = Math.round((percent - 5) / padSpacing);
            
            if (droppedPad < 0) droppedPad = 0;
            if (droppedPad > config.limit) droppedPad = config.limit;

            evaluateDrop(droppedPad);
        }
        
        setDragOffset({ x: 0, y: 0 }); 
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onDrag);
            window.addEventListener('mouseup', stopDrag);
            window.addEventListener('touchmove', onDrag, { passive: false });
            window.addEventListener('touchend', stopDrag);
        }
        return () => {
            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('mouseup', stopDrag);
            window.removeEventListener('touchmove', onDrag);
            window.removeEventListener('touchend', stopDrag);
        };
    }, [isDragging]);

    const evaluateDrop = (padIndex: number) => {
        if (phase === 'jumpA') {
            if (padIndex === baseNumber) {
                // Correct Big Jump
                setFrogPos(baseNumber);
                setActivePad(baseNumber);
                setMarkedPads([baseNumber]); 
                playSound('boing');
                const dirWord = config.op === '+' ? 'forward' : 'backward';
                speak(`${baseNumber}. Now let us take ${hopNumber} jumps ${dirWord}.`);
                setPhase('jumpB');
            } else {
                playSound('error');
            }
        } 
        else if (phase === 'jumpB') {
            const expectedNextPad = config.op === '+' ? frogPos + 1 : frogPos - 1;
            
            if (padIndex === expectedNextPad && expectedNextPad >= 0 && expectedNextPad <= config.limit) {
                // Correct Small Hop
                setFrogPos(expectedNextPad);
                setActivePad(expectedNextPad);
                setMarkedPads(prev => [...prev, expectedNextPad]); 
                
                const currentJumpCount = jumpsCompleted + 1;
                setJumpsCompleted(currentJumpCount);
                playSound('boing');
                speak(currentJumpCount.toString()); 
            } else {
                playSound('error');
            }
        }
    };

    // --- FINAL CHECK ACTION ---
    const handleCheck = () => {
        if (phase === 'done') {
            playSound('success');
            speak(`${baseNumber} ${config.op === '+' ? 'plus' : 'minus'} ${hopNumber} equals ${calcResult}`);
            return;
        }

        if (phase === 'jumpB' && jumpsCompleted === hopNumber) {
            playSound('success');
            speak(`${baseNumber} ${config.op === '+' ? 'plus' : 'minus'} ${hopNumber} equals ${calcResult}`);
            setPhase('done');
        } else {
            // INCORRECT
            playSound('error');
            speak("Oops! Let's try that again from the beginning.");
            
            setFrogPos(0);
            setPhase('jumpA');
            setJumpsCompleted(0);
            setActivePad(0);
            setMarkedPads([]);
        }
    };

    // ============================================================================
    // RENDER: CONFIGURATION SCREEN
    // ============================================================================
    if (phase === 'config') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-cyan-50 font-sans overflow-y-auto">
                <div className="max-w-xl w-full bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border-4 border-cyan-200 text-center space-y-6 my-auto">
                    <div className="flex justify-center"><div className="bg-cyan-100 p-3 rounded-full text-cyan-600 shadow-inner"><Settings size={36} /></div></div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Number Line Quiz Setup</h1>
                        <p className="text-xs md:text-sm text-slate-500 font-medium mt-2">Configure quiz parameters before starting.</p>
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
                    <button onClick={startPractice} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black text-lg py-4 rounded-xl shadow-[0_4px_0_rgb(15,23,42)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 mt-4"><Calculator size={20} /> Start Quiz</button>
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
            
            {/* 1. TOP: COMPACT BANNER & EQUATION */}
            <div className="w-full max-w-5xl shrink-0 z-20 relative mb-2 flex gap-2">
                <button 
                    onClick={() => setPhase('config')} 
                    className="shrink-0 px-3 py-2 bg-white text-slate-500 rounded-2xl border-2 border-slate-200 font-bold uppercase hover:bg-slate-50 flex items-center justify-center shadow-sm"
                >
                    <Settings size={18} />
                </button>

                <div className={`flex-1 py-2 md:py-4 rounded-[1.5rem] flex items-center justify-center gap-3 md:gap-6 font-black text-3xl md:text-5xl transition-all duration-500 border-b-4 md:border-b-8 ${phase === 'done' ? 'bg-lime-400 border-lime-500 text-slate-900 shadow-[0_0_30px_rgba(163,230,53,0.5)]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className="text-rose-500">{baseNumber}</span>
                    <span className={phase === 'done' ? 'text-slate-800' : 'text-slate-300'}>{config.op}</span>
                    <span className="text-sky-500">{hopNumber}</span>
                    <span className={phase === 'done' ? 'text-slate-800' : 'text-slate-300'}>=</span>
                    <span className={phase === 'done' ? 'scale-125 transition-transform text-slate-900' : 'text-slate-300'}>
                        {phase === 'done' ? calcResult : '?'}
                    </span>
                </div>
            </div>

            {/* 2. MIDDLE: MAXIMIZED POND SCENE */}
            <div 
                ref={pondRef}
                className="relative w-full max-w-5xl flex-1 bg-gradient-to-b from-cyan-100 to-cyan-400 rounded-[2rem] md:rounded-[3rem] shadow-xl border-4 md:border-8 border-cyan-500 flex flex-col justify-end mb-4 box-border overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute top-[10%] left-[10%] w-32 h-10 bg-white/40 rounded-full blur-md"></div>
                <div className="absolute top-[20%] right-[15%] w-40 h-12 bg-white/40 rounded-full blur-md"></div>
                
                {/* Water Level */}
                <div className="absolute bottom-0 left-0 w-full h-[25%] bg-cyan-600/30 z-0"></div>

                {/* --- SVG VISUAL TRAIL (Shows completed paths only) --- */}
                <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Big Jump Arc - Appears ONLY after Jump A is completed */}
                    {phase !== 'jumpA' && (
                        <path 
                            d={`M ${getPadX(0)} 75 Q ${(getPadX(0) + getPadX(baseNumber))/2} ${75 - Math.min(baseNumber * (config.limit === 10 ? 12 : 6), 85)} ${getPadX(baseNumber)} 75`} 
                            fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 1.5" 
                            className="opacity-90 animate-fade-in"
                        />
                    )}
                    {/* Small Hop Arcs - Appears ONLY after that specific hop is completed */}
                    {Array.from({length: hopNumber}).map((_, i) => {
                        if (jumpsCompleted <= i) return null; 
                        
                        const startNum = config.op === '+' ? baseNumber + i : baseNumber - i;
                        const endNum = config.op === '+' ? baseNumber + i + 1 : baseNumber - i - 1;
                        const startX = getPadX(startNum);
                        const endX = getPadX(endNum);
                        const midX = (startX + endX) / 2;

                        return (
                            <path 
                                key={i} 
                                d={`M ${startX} 75 Q ${midX} 35 ${endX} 75`} 
                                fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="2 1.5"
                                className="opacity-100 animate-fade-in"
                            />
                        )
                    })}
                </svg>

                {/* --- THE NUMBER LINE (Lily Pads) --- */}
                <div className="absolute bottom-[25%] left-0 w-full z-20 translate-y-1/2">
                    <div className="relative w-full h-2 bg-cyan-700/50 rounded-full">
                        {Array.from({ length: config.limit + 1 }).map((_, i) => {
                            const isActive = activePad === i;
                            const isMarked = markedPads.includes(i);
                            
                            return (
                                <div 
                                    key={i} 
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                                    style={{ left: `${getPadX(i)}%` }} 
                                >
                                    <div className={`rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${padClasses} ${isActive ? 'bg-amber-400 border-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-[1.3] z-30' : 'bg-emerald-500 border-emerald-700 shadow-md scale-100 z-20'}`}>
                                        <div className={`rounded-full absolute opacity-50 ${padIndicatorClass} ${isActive ? 'bg-white' : 'bg-emerald-400'}`}></div>
                                        <span className={`font-black ${isActive ? 'text-amber-950' : 'text-emerald-950'}`}>{i}</span>
                                    </div>
                                    
                                    {/* The Success Checkmark (Tick) below the pad */}
                                    {isMarked && (
                                        <div className="absolute -bottom-6 md:-bottom-10 animate-fade-in">
                                            <CheckCircle size={config.limit === 10 ? 28 : 16} className="text-lime-400 fill-white drop-shadow-md" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- THE DRAGGABLE FROG --- */}
                <div 
                    className={`absolute bottom-[25%] z-40 ${frogClasses} ${phase !== 'done' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                    style={{ 
                        left: `${getPadX(frogPos)}%`, 
                        transform: `translate(calc(-50% + ${dragOffset.x}px), ${dragOffset.y}px)`,
                        transitionProperty: isDragging ? 'none' : 'transform, left',
                        transitionDuration: '200ms',
                        transitionTimingFunction: 'ease-out' 
                    }}
                    onMouseDown={startDrag}
                    onTouchStart={startDrag}
                >
                    {/* Drag Hint */}
                    {!isDragging && phase !== 'done' && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce bg-amber-400 text-amber-950 text-xs md:text-sm font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap z-50">
                            DRAG ME <Hand size={14} />
                        </div>
                    )}
                    
                    <div style={{ transform: `scaleX(${config.op === '-' && phase === 'jumpB' && !isDragging ? -1 : 1})`, transition: 'transform 300ms ease-in-out' }}>
                        <div className={`drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)] ${isDragging ? 'scale-110' : ''}`}>
                            🐸
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. BOTTOM: QUIZ CONTROLS */}
            <div className="w-full max-w-5xl flex justify-between items-center shrink-0 z-30 pb-2 md:pb-4 px-2 md:px-4">
                
               {/* --- NEW EQUATION BUTTON --- */}
                <button 
                    onClick={generateEquation}
                    className="bg-purple-500 hover:bg-purple-400 text-white font-black text-xs md:text-lg px-4 md:px-8 py-3 md:py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_0_rgb(147,51,234)] active:translate-y-2 active:shadow-none transition-all"
                >
                    <Shuffle size={20} /> <span className="hidden sm:inline">New Equation</span>
                </button>

                {/* --- PERMANENTLY ACTIVE CHECK BUTTON --- */}
                <button 
                    onClick={handleCheck}
                    className={`px-8 md:px-12 py-3 md:py-4 rounded-3xl border-4 flex items-center justify-center font-black text-lg md:text-3xl tracking-wider transition-all shadow-[0_8px_0_rgb(101,163,13)] bg-lime-400 border-lime-300 text-lime-950 active:translate-y-2 active:shadow-none hover:scale-105 cursor-pointer ${phase === 'done' ? 'opacity-80' : ''}`}
                >
                    CHECK
                </button>

            </div>
            
        </div>
    );
}