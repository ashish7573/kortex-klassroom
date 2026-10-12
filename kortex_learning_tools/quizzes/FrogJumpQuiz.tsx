"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Hand, Settings, Calculator, RotateCcw, Star, Trophy, ArrowRight } from 'lucide-react';

type Operation = '+' | '-';
type LimitSelect = 10 | 20;

export default function FrogJumpQuiz({ lesson, onComplete }: any) {
    // Session State
    const [phase, setPhase] = useState<'config' | 'jumpA' | 'jumpB' | 'done' | 'completed'>('config');
    const [config, setConfig] = useState<{ op: Operation, limit: LimitSelect }>({ op: '+', limit: 10 });
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);

    // Equation States
    const [baseNumber, setBaseNumber] = useState(0); 
    const [hopNumber, setHopNumber] = useState(0);   
    
    // Quiz & Drag States
    const [frogPos, setFrogPos] = useState(0);
    const [activePad, setActivePad] = useState<number | null>(0);
    const [jumpsCompleted, setJumpsCompleted] = useState(0); 
    const [markedPads, setMarkedPads] = useState<number[]>([]); 

    // Physics Drag & Responsive Size States
    const pondRef = useRef<HTMLDivElement>(null);
    const [pondSize, setPondSize] = useState({ width: 600, height: 350 });
    const [layoutMode, setLayoutMode] = useState<'auto' | 'straight' | 'snake'>('auto');
    const isStraight = layoutMode === 'straight' || (layoutMode === 'auto' && pondSize.width >= 680);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const dragStart = useRef<{ x: number, y: number } | null>(null);

    // Track pond container dimensions for consistent row and column spacing
    useEffect(() => {
        if (!pondRef.current) return;
        const updateSize = () => {
            if (pondRef.current) {
                const { clientWidth, clientHeight } = pondRef.current;
                if (clientWidth > 0 && clientHeight > 0) {
                    setPondSize({ width: clientWidth, height: clientHeight });
                }
            }
        };
        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(pondRef.current);
        return () => observer.disconnect();
    }, []);

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
        setTimeout(() => {
            speak(`First, jump to ${a}.`);
        }, 200);
    };

    const startPractice = () => {
        playSound('click');
        setQuestionIndex(0);
        setScore(0);
        generateEquation();
    };

    // --- DUAL-MODE COORDINATES: STRAIGHT (Laptops/Smartboards) vs SNAKE (Smartphones) ---
    // Returns exact { x, y, row } in percentage coordinates (0 - 100)
    const getPadCoords = (n: number): { x: number, y: number, row: number } => {
        const { width, height } = pondSize;
        const aspect = width / (height || 1);

        // MODE 1: STRAIGHT NUMBER LINE (Laptops, Smartboards, Tablets)
        if (isStraight) {
            const margin = config.limit === 10 ? 8 : 5;
            const availableW = 100 - 2 * margin;
            const step = availableW / config.limit;
            const x = margin + n * step;
            const y = 50; // Central horizontal line
            return { x, y, row: 0 };
        }

        // MODE 2: SNAKE NUMBER LINE (Smartphones)
        // 0 has its own separate half-row at top, followed by 5 numbers per row
        const dxPercent = 20; // 5 columns across: 10%, 30%, 50%, 70%, 90%

        if (config.limit === 10) {
            // Limit 10 (3 rows total):
            // Row 0: Pad 0 (half-row)
            // Row 1: Pads 1..5
            // Row 2: Pads 10..6
            const dyRow = Math.min(24, Math.max(16, dxPercent * aspect * 0.7));
            const yRow0 = 50 - dyRow; // Top half-row for 0
            const yRow1 = 50;         // Row 1 (1 to 5)
            const yRow2 = 50 + dyRow; // Row 2 (6 to 10)

            if (n === 0) {
                return { x: 10, y: yRow0, row: 0 };
            }
            if (n <= 5) {
                const col = n - 1; // 1..5 -> col 0..4
                const x = 10 + col * dxPercent;
                return { x, y: yRow1, row: 1 };
            } else {
                const col = 10 - n; // 6..10 -> col 4..0 (6 directly below 5)
                const x = 10 + col * dxPercent;
                return { x, y: yRow2, row: 2 };
            }
        } else {
            // Limit 20 (5 rows total):
            // Row 0: Pad 0 (half-row)
            // Row 1: Pads 1..5
            // Row 2: Pads 10..6
            // Row 3: Pads 11..15
            // Row 4: Pads 20..16
            const dyRow = Math.min(16, Math.max(12, (dxPercent * aspect * 0.55) / 1.5));
            const yRow0 = 50 - 2 * dyRow; // Row 0 (Pad 0)
            const yRow1 = 50 - 1 * dyRow; // Row 1 (1 to 5)
            const yRow2 = 50;             // Row 2 (6 to 10)
            const yRow3 = 50 + 1 * dyRow; // Row 3 (11 to 15)
            const yRow4 = 50 + 2 * dyRow; // Row 4 (16 to 20)

            if (n === 0) {
                return { x: 10, y: yRow0, row: 0 };
            }
            if (n <= 5) {
                const col = n - 1; // 1..5 -> col 0..4
                const x = 10 + col * dxPercent;
                return { x, y: yRow1, row: 1 };
            } else if (n <= 10) {
                const col = 10 - n; // 6..10 -> col 4..0 (6 directly below 5)
                const x = 10 + col * dxPercent;
                return { x, y: yRow2, row: 2 };
            } else if (n <= 15) {
                const col = n - 11; // 11..15 -> col 0..4 (11 directly below 10)
                const x = 10 + col * dxPercent;
                return { x, y: yRow3, row: 3 };
            } else {
                const col = 20 - n; // 16..20 -> col 4..0 (16 directly below 15)
                const x = 10 + col * dxPercent;
                return { x, y: yRow4, row: 4 };
            }
        }
    };

    // --- WATER STREAM PATH (Straight for Laptops/Smartboards, Snake for Smartphones) ---
    const getSerpentinePath = () => {
        if (isStraight) {
            const p0 = getPadCoords(0);
            const pEnd = getPadCoords(config.limit);
            return `M ${p0.x} ${p0.y} L ${pEnd.x} ${pEnd.y}`;
        }

        if (config.limit === 10) {
            const p0 = getPadCoords(0);
            const p1 = getPadCoords(1);
            const p5 = getPadCoords(5);
            const p6 = getPadCoords(6);
            const p10 = getPadCoords(10);
            const r = Math.abs(p6.y - p5.y) / 2;
            return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p5.x} ${p5.y} A ${r} ${r} 0 0 1 ${p6.x} ${p6.y} L ${p10.x} ${p10.y}`;
        } else {
            const p0 = getPadCoords(0);
            const p1 = getPadCoords(1);
            const p5 = getPadCoords(5);
            const p6 = getPadCoords(6);
            const p10 = getPadCoords(10);
            const p11 = getPadCoords(11);
            const p15 = getPadCoords(15);
            const p16 = getPadCoords(16);
            const p20 = getPadCoords(20);
            const r = Math.abs(p6.y - p5.y) / 2;
            return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p5.x} ${p5.y} A ${r} ${r} 0 0 1 ${p6.x} ${p6.y} L ${p10.x} ${p10.y} A ${r} ${r} 0 0 0 ${p11.x} ${p11.y} L ${p15.x} ${p15.y} A ${r} ${r} 0 0 1 ${p16.x} ${p16.y} L ${p20.x} ${p20.y}`;
        }
    };

    // --- STEP-BY-STEP HOP 2D ARC ---
    const getHopArc = (stepIdx: number) => {
        const startNum = config.op === '+' ? baseNumber + stepIdx : baseNumber - stepIdx;
        const endNum = config.op === '+' ? baseNumber + stepIdx + 1 : baseNumber - stepIdx - 1;
        const start = getPadCoords(startNum);
        const end = getPadCoords(endNum);
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        if (isStraight) {
            // Generous, proud parabolic arc even for single-step jumps
            const arch = config.limit === 10 ? 26 : 20;
            return `M ${start.x} ${start.y} Q ${midX} ${50 - arch} ${end.x} ${end.y}`;
        }

        if (start.row === end.row) {
            // High leap above pads on the same horizontal row
            const arch = config.limit === 10 ? 18 : 14;
            return `M ${start.x} ${start.y} Q ${midX} ${midY - arch} ${end.x} ${end.y}`;
        } else {
            // Leaping around river turns between rows (e.g. 0->1, 5->6, 10->11, 15->16)
            const turnArch = config.limit === 10 ? 9 : 8;
            const cpX = start.x > 50 ? Math.min(99, start.x + turnArch) : Math.max(1, start.x - turnArch);
            return `M ${start.x} ${start.y} Q ${cpX} ${midY} ${end.x} ${end.y}`;
        }
    };

    // --- DRAG AND DROP IN 2D ---
    const startDrag = (e: any) => {
        if (phase === 'done' || phase === 'config' || phase === 'completed') return;
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
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        if (pondRef.current) {
            const rect = pondRef.current.getBoundingClientRect();
            const xPercent = ((clientX - rect.left) / rect.width) * 100;
            const yPercent = ((clientY - rect.top) / rect.height) * 100;
            
            // Find closest pad in 2D space (from 0 to config.limit)
            let closestPad = 0;
            let minDistSq = Infinity;
            for (let i = 0; i <= config.limit; i++) {
                const c = getPadCoords(i);
                const distSq = Math.pow(c.x - xPercent, 2) + Math.pow(c.y - yPercent, 2);
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    closestPad = i;
                }
            }

            evaluateDrop(closestPad);
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
                // Correct: child jumped to base number
                setFrogPos(baseNumber);
                setActivePad(baseNumber);
                setMarkedPads([baseNumber]); 
                playSound('boing');
                const dirWord = config.op === '+' ? 'forward' : 'back';
                speak(`${baseNumber}! Now take ${hopNumber} hops ${dirWord}.`);
                setPhase('jumpB');
            } else {
                playSound('error');
                speak(`Find number ${baseNumber}.`);
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

                // Automatic celebration if final hop is reached
                if (currentJumpCount === hopNumber) {
                    setTimeout(() => {
                        playSound('success');
                        speak(`${baseNumber} ${config.op === '+' ? 'plus' : 'minus'} ${hopNumber} equals ${calcResult}`);
                        setScore(s => s + 1);
                        setPhase('done');
                    }, 400);
                }
            } else {
                playSound('error');
                speak(`Hop ${config.op === '+' ? 'forward' : 'back'} to ${expectedNextPad}.`);
            }
        }
    };

    // Tap-to-Hop: Touch friendly alternative for children on tablets & mobile
    const handlePadClick = (padIndex: number) => {
        if (phase === 'done' || phase === 'config' || phase === 'completed') return;
        evaluateDrop(padIndex);
    };

    // --- CHECK / ADVANCE ACTIONS ---
    const handleCheck = () => {
        if (phase === 'done') {
            handleNextQuestion();
            return;
        }

        if (phase === 'jumpB' && jumpsCompleted === hopNumber) {
            playSound('success');
            speak(`${baseNumber} ${config.op === '+' ? 'plus' : 'minus'} ${hopNumber} equals ${calcResult}`);
            setScore(s => s + 1);
            setPhase('done');
        } else {
            playSound('error');
            speak(`Start by jumping to ${baseNumber}.`);
            setFrogPos(0);
            setPhase('jumpA');
            setJumpsCompleted(0);
            setActivePad(0);
            setMarkedPads([]);
        }
    };

    const handleNextQuestion = () => {
        if (questionIndex < 4) {
            setQuestionIndex(q => q + 1);
            generateEquation();
        } else {
            setPhase('completed');
            playSound('success');
        }
    };

    // ============================================================================
    // RENDER: CONFIGURATION SCREEN
    // ============================================================================
    if (phase === 'config') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 bg-cyan-50 font-sans overflow-hidden rounded-2xl md:rounded-3xl">
                <div className="max-w-md w-full bg-white p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-lg border-2 sm:border-4 border-cyan-200 text-center space-y-3 sm:space-y-4 md:space-y-5">
                    <div className="flex justify-center">
                        <div className="bg-cyan-100 p-2.5 sm:p-3 rounded-full text-cyan-600 shadow-inner">
                            <Settings className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Number Line Frog Jump</h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Serpentine Pond Path (5 Questions)</p>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4 text-left">
                        <div>
                            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5 block">1. Select Operation</label>
                            <div className="flex gap-2">
                                {(['+', '-'] as Operation[]).map(op => (
                                    <button 
                                        key={op} 
                                        onClick={() => { playSound('click'); setConfig({...config, op: op}); }} 
                                        className={`flex-1 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base md:text-lg font-black rounded-xl border-2 sm:border-3 transition-all shadow-sm ${config.op === op ? 'bg-cyan-100 border-cyan-500 text-cyan-700 scale-[1.02]' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-cyan-300'}`}
                                    >
                                        {op === '+' ? 'Addition (+)' : 'Subtraction (-)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5 block">2. Number Line Range</label>
                            <div className="flex gap-2">
                                {([10, 20] as LimitSelect[]).map(l => (
                                    <button 
                                        key={l} 
                                        onClick={() => { playSound('click'); setConfig({...config, limit: l}); }} 
                                        className={`flex-1 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base md:text-lg font-black rounded-xl border-2 sm:border-3 transition-all shadow-sm ${config.limit === l ? 'bg-amber-100 border-amber-500 text-amber-700 scale-[1.02]' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-amber-300'}`}
                                    >
                                        Up to {l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={startPractice} 
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black text-sm sm:text-base md:text-lg py-2.5 sm:py-3.5 rounded-xl shadow-[0_4px_0_rgb(15,23,42)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 mt-2"
                    >
                        <Calculator size={18} /> Start Quiz (5 Questions)
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: COMPLETED SCREEN
    // ============================================================================
    if (phase === 'completed') {
        const stars = score >= 4 ? 3 : score >= 3 ? 2 : 1;
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 text-center bg-cyan-50 font-sans md:rounded-3xl overflow-hidden">
                <div className="bg-amber-100 p-3 sm:p-5 rounded-full mb-2 sm:mb-3 border-4 sm:border-8 border-amber-50 shadow-inner">
                    <Trophy className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-amber-500" />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1">Pond Explorer Champion!</h2>
                <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-3">
                    {[1, 2, 3].map((starIndex) => (
                        <Star key={starIndex} className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 transition-all duration-500 ${starIndex <= stars ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-md' : 'text-slate-300 fill-slate-200'}`} />
                    ))}
                </div>
                <p className="text-base sm:text-lg md:text-xl font-bold text-slate-500 mb-4 sm:mb-6">
                    You scored {score} out of 5!
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 w-full max-w-sm sm:max-w-md">
                    <button 
                        onClick={() => {
                            setQuestionIndex(0);
                            setScore(0);
                            setPhase('config');
                        }} 
                        className="flex-1 py-2.5 sm:py-3.5 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-xl sm:rounded-2xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base"
                    >
                        <RotateCcw size={18} /> Play Again
                    </button>
                    {onComplete && (
                        <button 
                            onClick={() => onComplete({ score, maxScore: 5 })} 
                            className="flex-1 py-2.5 sm:py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl sm:rounded-2xl shadow-md border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base"
                        >
                            Complete Lesson <ArrowRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PLAYING SANDBOX
    // ============================================================================
    const padClasses = isStraight
        ? (config.limit === 10 
            ? "w-10 h-10 sm:w-12 sm:h-12 md:w-15 md:h-15 text-sm sm:text-lg md:text-2xl border-2 sm:border-3 md:border-4" 
            : "w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[10px] sm:text-xs md:text-sm border-2 sm:border-3")
        : (config.limit === 10 
            ? "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-sm sm:text-base md:text-xl border-2 sm:border-3" 
            : "w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-xs sm:text-sm md:text-base border-2 sm:border-3");
    
    const padIndicatorClass = config.limit === 10
        ? "w-2.5 h-2.5 md:w-3.5 md:h-3.5 top-0.5 right-0.5"
        : "w-1.5 h-1.5 md:w-2 md:h-2 top-0.5 right-0.5";

    const frogClasses = config.limit === 10
        ? "text-4xl sm:text-5xl md:text-6xl"
        : "text-3xl sm:text-4xl md:text-5xl";

    const currentCoords = getPadCoords(frogPos);
    const nextTargetPad = phase === 'jumpA' ? baseNumber : (config.op === '+' ? frogPos + 1 : frogPos - 1);
    const nextCoords = getPadCoords(Math.max(0, Math.min(config.limit, nextTargetPad)));
    const isFacingLeft = nextCoords.x < currentCoords.x - 1;

    return (
        <div className="w-full h-full flex flex-col items-center p-2 sm:p-3 md:p-4 bg-cyan-50 font-sans select-none overflow-hidden relative rounded-2xl md:rounded-3xl">
            
            {/* 1. TOP: COMPACT BANNER & EQUATION */}
            <div className="w-full max-w-5xl shrink-0 z-20 relative mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <button 
                    onClick={() => setPhase('config')} 
                    className="shrink-0 p-2 sm:p-2.5 bg-white text-slate-500 rounded-xl sm:rounded-2xl border-2 border-slate-200 font-bold uppercase hover:bg-slate-50 flex items-center justify-center shadow-sm"
                    title="Settings"
                >
                    <Settings size={16} />
                </button>

                {/* Straight / Snake Mode Toggle */}
                <button
                    onClick={() => setLayoutMode(prev => prev === 'straight' ? 'snake' : prev === 'snake' ? 'auto' : 'straight')}
                    className="shrink-0 px-2 sm:px-2.5 py-1.5 bg-white text-slate-600 rounded-xl sm:rounded-2xl border-2 border-slate-200 font-black text-[10px] sm:text-xs hover:bg-slate-50 flex items-center gap-1 shadow-sm"
                    title="Toggle Straight vs Snake number line"
                >
                    <span>{isStraight ? '📏 Straight' : '🐍 Snake'}</span>
                </button>

                <div className="shrink-0 bg-white border-2 border-slate-200 px-2 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl font-black text-slate-500 text-xs sm:text-sm shadow-sm whitespace-nowrap">
                    {questionIndex + 1} / 5
                </div>

                <div className={`flex-1 py-1.5 sm:py-2 md:py-2.5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-4 md:gap-6 font-black text-xl sm:text-3xl md:text-4xl transition-all duration-500 border-b-2 sm:border-b-4 ${phase === 'done' ? 'bg-lime-400 border-lime-500 text-slate-900 shadow-md' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <span className="text-rose-500">{baseNumber}</span>
                    <span className={phase === 'done' ? 'text-slate-800' : 'text-slate-300'}>{config.op}</span>
                    <span className="text-sky-500">{hopNumber}</span>
                    <span className={phase === 'done' ? 'text-slate-800' : 'text-slate-300'}>=</span>
                    <span className={phase === 'done' ? 'scale-110 transition-transform text-slate-900 underline decoration-slate-900' : 'text-slate-300'}>
                        {phase === 'done' ? calcResult : '?'}
                    </span>
                </div>
            </div>

            {/* Helper Guidance Chip */}
            <div className="shrink-0 mb-1.5 text-center">
                <span className={`inline-block text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full shadow-sm ${
                    phase === 'jumpA' 
                        ? 'bg-amber-100 text-amber-800 border-2 border-amber-300 animate-pulse' 
                        : phase === 'jumpB' 
                            ? 'bg-sky-100 text-sky-800 border-2 border-sky-300' 
                            : 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
                }`}>
                    {phase === 'jumpA' && `Step 1: Jump to ${baseNumber} (Tap pad ${baseNumber})`}
                    {phase === 'jumpB' && (
                        config.op === '+'
                            ? `Step 2: Hop forward 1 by 1 (${jumpsCompleted} / ${hopNumber} hops)`
                            : `Step 2: Hop backwards 1 by 1 (${jumpsCompleted} / ${hopNumber} hops)`
                    )}
                    {phase === 'done' && `Great job! ${baseNumber} ${config.op} ${hopNumber} = ${calcResult}`}
                </span>
            </div>

            {/* 2. MIDDLE: POND SCENE */}
            <div 
                ref={pondRef}
                className="relative w-full max-w-5xl flex-1 bg-gradient-to-b from-cyan-100 via-sky-100 to-cyan-200 rounded-2xl md:rounded-[2.5rem] shadow-lg border-2 sm:border-4 border-cyan-500 mb-2 box-border overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute top-[8%] left-[10%] w-24 sm:w-32 h-8 sm:h-10 bg-white/40 rounded-full blur-md pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[15%] w-32 sm:w-40 h-10 sm:h-12 bg-white/40 rounded-full blur-md pointer-events-none"></div>

                {/* --- SVG WATER STREAM & HOP ARCS --- */}
                <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Water Trail connecting all pads */}
                    <path 
                        d={getSerpentinePath()} 
                        fill="none" 
                        stroke="rgba(14, 116, 144, 0.25)" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                    />
                    <path 
                        d={getSerpentinePath()} 
                        fill="none" 
                        stroke="rgba(6, 182, 212, 0.45)" 
                        strokeWidth="1.5" 
                        strokeDasharray="3 2" 
                        strokeLinecap="round" 
                    />

                    {/* Small Hop 2D Arcs - Step by step as hops are completed */}
                    {Array.from({ length: jumpsCompleted }).map((_, i) => (
                        <path 
                            key={i} 
                            d={getHopArc(i)} 
                            fill="none" 
                            stroke="#0284c7" 
                            strokeWidth="1.2" 
                            strokeDasharray="2.5 1.5"
                            strokeLinecap="round"
                            className="opacity-100 animate-fade-in"
                        />
                    ))}
                </svg>

                {/* --- LILY PADS (From 0 to config.limit: 0 has its own half-row at top in Snake Mode) --- */}
                {Array.from({ length: config.limit + 1 }).map((_, i) => {
                    const coords = getPadCoords(i);
                    const isActive = activePad === i;
                    const isBase = phase !== 'jumpA' && i === baseNumber;
                    const isTarget = (phase === 'jumpA' && i === baseNumber) || 
                                     (phase === 'jumpB' && i === (config.op === '+' ? frogPos + 1 : frogPos - 1));
                    const isMarked = markedPads.includes(i);
                    const isZero = i === 0;
                    
                    let ringClass = "";
                    if (phase === 'jumpA' && i === baseNumber) {
                        ringClass = "ring-4 ring-amber-400 ring-offset-2 animate-pulse";
                    } else if (phase === 'jumpB' && isTarget) {
                        ringClass = "ring-4 ring-sky-400 ring-offset-1 animate-pulse";
                    }

                    return (
                        <div 
                            key={i} 
                            onClick={() => handlePadClick(i)}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-20"
                            style={{ left: `${coords.x}%`, top: `${coords.y}%` }} 
                        >
                            <div className={`rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${padClasses} ${ringClass} ${
                                isBase
                                    ? 'bg-amber-400 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.8)] scale-[1.15] z-30'
                                    : isActive 
                                        ? 'bg-amber-300 border-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.9)] scale-[1.25] z-30' 
                                        : isZero
                                            ? 'bg-teal-500 border-teal-700 shadow-md scale-100 hover:scale-110 active:scale-95'
                                            : 'bg-emerald-500 border-emerald-700 shadow-md scale-100 hover:scale-110 active:scale-95'
                            }`}>
                                <div className={`rounded-full absolute opacity-50 ${padIndicatorClass} ${isActive || isBase ? 'bg-white' : (isZero ? 'bg-teal-300' : 'bg-emerald-400')}`}></div>
                                <span className={`font-black select-none pointer-events-none drop-shadow-sm ${isActive || isBase ? 'text-amber-950 font-black' : (isZero ? 'text-teal-950' : 'text-emerald-950')}`}>{i}</span>
                            </div>

                            {/* Base Start Marker (Cleanly below pad, never occluded) */}
                            {isBase && !isMarked && (
                                <div className="absolute -bottom-3 sm:-bottom-3.5 bg-amber-500 text-white text-[7px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-sm z-30 pointer-events-none">
                                    START
                                </div>
                            )}
                            
                            {/* The Success Checkmark (Tick) below the pad */}
                            {isMarked && (
                                <div className="absolute -bottom-3 sm:-bottom-4 animate-fade-in pointer-events-none z-30">
                                    <CheckCircle size={config.limit === 10 ? 18 : 14} className="text-lime-400 fill-white drop-shadow-md" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* --- THE DRAGGABLE FROG (Sits directly above the lily pad so pad & number are 100% visible) --- */}
                <div 
                    className={`absolute z-40 ${frogClasses} ${phase !== 'done' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                    style={{ 
                        left: `${currentCoords.x}%`, 
                        top: `${currentCoords.y}%`,
                        transform: `translate(calc(-50% + ${dragOffset.x}px), calc(-100% - 14px + ${dragOffset.y}px))`,
                        transitionProperty: isDragging ? 'none' : 'transform, left, top',
                        transitionDuration: '220ms',
                        transitionTimingFunction: 'ease-out' 
                    }}
                    onMouseDown={startDrag}
                    onTouchStart={startDrag}
                >
                    {/* Drag / Tap Hint - Clear text without confusing directional arrows */}
                    {!isDragging && phase !== 'done' && (
                        <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 animate-bounce bg-amber-400 text-amber-950 text-[9px] sm:text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap z-50 pointer-events-none">
                            {phase === 'jumpA' ? (
                                <>JUMP TO {baseNumber} 🎯</>
                            ) : (
                                config.op === '+' ? <>HOP +1 FORWARD</> : <>HOP -1 BACK</>
                            )}
                        </div>
                    )}
                    
                    <div style={{ transform: `scaleX(${isFacingLeft ? -1 : 1})`, transition: 'transform 250ms ease-in-out' }}>
                        <div className={`drop-shadow-[0_8px_8px_rgba(0,0,0,0.35)] ${isDragging ? 'scale-110' : ''}`}>
                            🐸
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. BOTTOM: QUIZ CONTROLS */}
            <div className="w-full max-w-5xl flex justify-center items-center shrink-0 z-30 pt-1 pb-1 md:pb-2 px-1 sm:px-2 md:px-4">
                {/* Dynamic Action Button: CHECK or NEXT QUESTION */}
                {phase === 'done' ? (
                    <button 
                        onClick={handleNextQuestion}
                        className="px-6 sm:px-10 py-2 sm:py-2.5 rounded-2xl border-b-4 border-emerald-700 flex items-center justify-center font-black text-xs sm:text-base tracking-wide transition-all shadow-md bg-emerald-500 hover:bg-emerald-400 text-white active:translate-y-1 active:border-b-0 animate-bounce gap-1.5"
                    >
                        <span>{questionIndex < 4 ? 'Next Question' : 'Finish Quiz'}</span> <ArrowRight size={16} />
                    </button>
                ) : (
                    <button 
                        onClick={handleCheck}
                        className={`px-6 sm:px-10 py-2 sm:py-2.5 rounded-2xl border-b-4 flex items-center justify-center font-black text-xs sm:text-base tracking-wide transition-all shadow-sm active:translate-y-1 active:border-b-0 ${
                            phase === 'jumpB' && jumpsCompleted === hopNumber
                                ? 'bg-lime-400 hover:bg-lime-300 border-lime-600 text-lime-950 animate-pulse'
                                : 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                        }`}
                    >
                        CHECK ANSWER
                    </button>
                )}
            </div>
            
        </div>
    );
}