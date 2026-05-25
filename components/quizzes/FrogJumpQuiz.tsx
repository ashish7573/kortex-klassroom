"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Shuffle, CheckCircle, Hand, ArrowRight } from 'lucide-react';

export default function FrogJumpQuiz({ lesson, onComplete }: any) {
    // Equation States
    const [baseNumber, setBaseNumber] = useState(0); 
    const [hopNumber, setHopNumber] = useState(0);   
    
    // Quiz & Drag States
    const [frogPos, setFrogPos] = useState(0);
    const [phase, setPhase] = useState<'jumpA' | 'jumpB' | 'done'>('jumpA');
    const [activePad, setActivePad] = useState<number | null>(0);
    const [jumpsCompleted, setJumpsCompleted] = useState(0); 
    const [markedPads, setMarkedPads] = useState<number[]>([]); 

    // Physics Drag States
    const pondRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const dragStart = useRef<{ x: number, y: number } | null>(null);

    const totalInFunnels = baseNumber + hopNumber;

    // --- AUDIO ENGINE ---
    const playSound = (type: 'boing' | 'error' | 'success') => {
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
        const randomTotal = Math.floor(Math.random() * 8) + 2; 
        const randomA = Math.floor(Math.random() * (randomTotal - 1)) + 1; 
        const randomB = randomTotal - randomA; 
        
        setBaseNumber(randomA);
        setHopNumber(randomB);
        setFrogPos(0);
        setPhase('jumpA');
        setActivePad(0);
        setJumpsCompleted(0);
        setMarkedPads([]);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };

    useEffect(() => {
        generateEquation(); 
    }, []);

    // --- DRAG AND DROP LOGIC ---
    const startDrag = (e: any) => {
        if (phase === 'done') return;
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
            
            let droppedPad = Math.round((percent - 5) / 9);
            if (droppedPad < 0) droppedPad = 0;
            if (droppedPad > 10) droppedPad = 10;

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
                speak(`${baseNumber}. Now let us add ${hopNumber} more jumps.`);
                setPhase('jumpB');
            } else {
                playSound('error');
            }
        } 
        else if (phase === 'jumpB') {
            const expectedNextPad = frogPos + 1;
            if (padIndex === expectedNextPad && expectedNextPad <= 10) {
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
            // Already done, just replay the success audio if clicked again
            playSound('success');
            speak(`${baseNumber} plus ${hopNumber} equals ${totalInFunnels}`);
            return;
        }

        // Evaluate the child's independent work
        if (phase === 'jumpB' && jumpsCompleted === hopNumber) {
            playSound('success');
            speak(`${baseNumber} plus ${hopNumber} equals ${totalInFunnels}`);
            setPhase('done');
        } else {
            // INCORRECT (Too few jumps, or hasn't started)
            playSound('error');
            speak("Oops! Let's try that again from the beginning.");
            
            // Hard reset the frog to original position
            setFrogPos(0);
            setPhase('jumpA');
            setJumpsCompleted(0);
            setActivePad(0);
            setMarkedPads([]);
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center p-2 md:p-4 bg-cyan-50 font-sans select-none overflow-hidden relative">
            
            {/* 1. TOP: EQUATION BANNER */}
            <div className="w-full max-w-4xl shrink-0 z-20 relative mb-2">
                <div className={`w-full py-2 md:py-4 rounded-[1.5rem] flex items-center justify-center gap-3 md:gap-6 font-black text-4xl md:text-6xl transition-all duration-500 border-b-4 md:border-b-8 ${phase === 'done' ? 'bg-lime-400 border-lime-500 text-slate-900 shadow-[0_0_30px_rgba(163,230,53,0.5)]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className="text-rose-500">{baseNumber}</span>
                    <span className={phase === 'done' ? 'text-slate-800' : 'text-slate-300'}>+</span>
                    <span className="text-sky-500">{hopNumber}</span>
                    <span className={phase === 'done' ? 'text-slate-800' : 'text-slate-300'}>=</span>
                    <span className={phase === 'done' ? 'scale-125 transition-transform text-slate-900' : 'text-slate-300'}>
                        {phase === 'done' ? totalInFunnels : '?'}
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
                            // Changed multiplier from 8 to 12, and max height from 45 to 65 to make the arc much taller
                            d={`M 5 75 Q ${(baseNumber * 9) / 2 + 5} ${75 - Math.min(baseNumber * 12, 85)} ${baseNumber * 9 + 5} 75`} 
                            fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 1.5" 
                            className="opacity-90 animate-fade-in"
                        />
                    )}
                    {/* Small Hop Arcs - Appears ONLY after that specific hop is completed */}
                    {Array.from({length: hopNumber}).map((_, i) => {
                        if (jumpsCompleted <= i) return null; // Hide if not jumped yet
                        
                        const startX = (baseNumber + i) * 9 + 5;
                        const endX = startX + 9;
                        return (
                            <path 
                                key={i} 
                                // Changed control point Y from 55 to 35 to make the small hops much higher
                                d={`M ${startX} 75 Q ${startX + 4.5} 35 ${endX} 75`} 
                                fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="2 1.5"
                                className="opacity-100 animate-fade-in"
                            />
                        )
                    })}
                </svg>

                {/* --- THE NUMBER LINE (Lily Pads) --- */}
                <div className="absolute bottom-[25%] left-0 w-full z-20 translate-y-1/2">
                    <div className="relative w-full h-2 bg-cyan-700/50 rounded-full">
                        {Array.from({ length: 11 }).map((_, i) => {
                            const isActive = activePad === i;
                            const isMarked = markedPads.includes(i);
                            
                            return (
                                <div 
                                    key={i} 
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                                    style={{ left: `calc(${i * 9}% + 5%)` }} 
                                >
                                    <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${isActive ? 'bg-amber-400 border-4 border-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-[1.3] z-30' : 'bg-emerald-500 border-b-4 border-emerald-700 shadow-md scale-100 z-20'}`}>
                                        <div className={`w-3 h-3 md:w-5 md:h-5 rounded-full absolute -top-1 -right-1 opacity-50 ${isActive ? 'bg-white' : 'bg-emerald-400'}`}></div>
                                        <span className={`font-black text-xl md:text-3xl ${isActive ? 'text-amber-950' : 'text-emerald-950'}`}>{i}</span>
                                    </div>
                                    
                                    {/* The Success Checkmark (Tick) below the pad */}
                                    {isMarked && (
                                        <div className="absolute -bottom-8 md:-bottom-10 animate-fade-in">
                                            <CheckCircle size={28} className="text-lime-400 fill-white drop-shadow-md" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- THE DRAGGABLE FROG --- */}
                <div 
                    className={`absolute bottom-[25%] z-40 mb-[10px] md:mb-[15px] ${phase !== 'done' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                    style={{ 
                        left: `calc(${frogPos * 9}% + 5%)`, 
                        // If dragging, apply the mouse offset. If not dragging, animate the snap back.
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
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce bg-amber-400 text-amber-950 text-xs md:text-sm font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap">
                            DRAG ME <Hand size={14} />
                        </div>
                    )}
                    
                    <div className={`text-6xl md:text-8xl ${isDragging ? 'scale-110 drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]' : 'drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)]'}`}>
                        🐸
                    </div>
                </div>
            </div>

            {/* 3. BOTTOM: QUIZ CONTROLS */}
            <div className="w-full max-w-5xl flex justify-between items-center shrink-0 z-30 pb-2 md:pb-4 px-4">
                
               {/* --- NEW EQUATION BUTTON --- */}
                <button 
                    onClick={generateEquation}
                    className="bg-purple-500 hover:bg-purple-400 text-white font-black text-sm md:text-lg px-4 md:px-8 py-3 md:py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_0_rgb(147,51,234)] active:translate-y-2 active:shadow-none transition-all"
                >
                    <Shuffle size={24} /> <span className="hidden sm:inline">New Equation</span>
                </button>

                {/* --- PERMANENTLY ACTIVE CHECK BUTTON --- */}
                <button 
                    onClick={handleCheck}
                    className={`px-8 md:px-12 py-3 md:py-4 rounded-3xl border-4 flex items-center justify-center font-black text-xl md:text-3xl tracking-wider transition-all shadow-[0_8px_0_rgb(101,163,13)] bg-lime-400 border-lime-300 text-lime-950 active:translate-y-2 active:shadow-none hover:scale-105 cursor-pointer ${phase === 'done' ? 'opacity-80' : ''}`}
                >
                    CHECK
                </button>

            </div>
            
        </div>
    );
}