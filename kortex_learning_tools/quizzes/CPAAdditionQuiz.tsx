"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
    CheckCircle2, 
    RotateCcw, 
    ArrowRight, 
    ArrowDownToLine, 
    Trophy, 
    Sparkles, 
    Check, 
    Layers,
    Boxes,
    Binary,
    Calculator,
    Delete
} from 'lucide-react';

interface QuestionData {
    a1T: number;
    a1O: number;
    a2T: number;
    a2O: number;
    addend1: number;
    addend2: number;
    totalTens: number;
    totalOnes: number;
    total: number;
    theme: {
        name: string;
        emoji: string;
        item: string;
        unit: string;
    };
}

const TOTAL_QUESTIONS = 5;

const THEMES = [
    { name: 'Apples', emoji: '🍎', item: 'Apple Box', unit: 'Apples' },
    { name: 'Oranges', emoji: '🍊', item: 'Orange Crate', unit: 'Oranges' },
    { name: 'Cookies', emoji: '🍪', item: 'Cookie Pack', unit: 'Cookies' },
    { name: 'Cupcakes', emoji: '🧁', item: 'Cupcake Tray', unit: 'Cupcakes' },
    { name: 'Stars', emoji: '⭐', item: 'Star Box', unit: 'Stars' },
];

export default function CPAAdditionQuiz({ lesson, onComplete }: any) {
    const [questionIndex, setQuestionIndex] = useState(1);
    const [score, setScore] = useState(0);
    const [phase, setPhase] = useState<'playing' | 'results'>('playing');
    const [questionData, setQuestionData] = useState<QuestionData | null>(null);
    const [mounted, setMounted] = useState(false);

    // Step state for mobile (1: Concrete, 2: Pictorial, 3: Abstract)
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    // Merge states for Concrete and Pictorial representations
    const [concreteMerged, setConcreteMerged] = useState(false);
    const [pictorialMerged, setPictorialMerged] = useState(false);

    // Abstract inputs
    const [tensInput, setTensInput] = useState('');
    const [onesInput, setOnesInput] = useState('');
    const [activeField, setActiveField] = useState<'tens' | 'ones'>('ones');
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [showHint, setShowHint] = useState(false);

    // Audio Engine
    const audioCtx = useRef<AudioContext | null>(null);
    const playSound = (type: 'pop' | 'kaching' | 'error' | 'click' | 'whoosh' | 'magic') => {
        if (typeof window === 'undefined') return;
        try {
            if (!audioCtx.current) {
                const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioCtx.current = new WinAudioContext();
            }
            const ctx = audioCtx.current;
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            if (type === 'pop') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
            } else if (type === 'kaching') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
            } else if (type === 'error') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(160, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
            } else if (type === 'whoosh') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(320, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
            } else if (type === 'magic') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(700, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.4);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
            } else if (type === 'click') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(450, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
            }

            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + (type === 'kaching' || type === 'magic' ? 0.4 : 0.2));
        } catch (e) {}
    };

    const generateQuestion = (idx: number) => {
        // Non-regrouping 2-digit addition: tens sum <= 9, ones sum <= 9
        const a1T = Math.floor(Math.random() * 4) + 1; // 1 to 4
        const a1O = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const a2T = Math.floor(Math.random() * (8 - a1T)) + 1; // ensures sum <= 9
        const a2O = Math.floor(Math.random() * (9 - a1O)) + 1; // ensures sum <= 9

        const addend1 = a1T * 10 + a1O;
        const addend2 = a2T * 10 + a2O;
        const totalTens = a1T + a2T;
        const totalOnes = a1O + a2O;
        const total = totalTens * 10 + totalOnes;

        const theme = THEMES[(idx - 1) % THEMES.length];

        setQuestionData({ a1T, a1O, a2T, a2O, addend1, addend2, totalTens, totalOnes, total, theme });
        setCurrentStep(1);
        setConcreteMerged(false);
        setPictorialMerged(false);
        setTensInput('');
        setOnesInput('');
        setActiveField('ones');
        setFeedback('idle');
        setShowHint(false);
    };

    useEffect(() => {
        setMounted(true);
        generateQuestion(1);
    }, []);

    const handleMergeConcrete = () => {
        playSound('whoosh');
        setConcreteMerged(true);
    };

    const handleMergePictorial = () => {
        playSound('whoosh');
        setPictorialMerged(true);
    };

    const handleKeypadPress = (digit: string) => {
        playSound('click');
        setShowHint(false);
        if (activeField === 'tens') {
            setTensInput(digit);
        } else {
            setOnesInput(digit);
            // Auto advance active field to tens after setting ones if empty
            if (tensInput === '') {
                setActiveField('tens');
            }
        }
    };

    const handleKeypadDelete = () => {
        playSound('click');
        if (activeField === 'tens') {
            setTensInput('');
        } else {
            setOnesInput('');
        }
    };

    const handleSubmit = () => {
        if (!questionData || feedback !== 'idle') return;

        const enteredTens = Number(tensInput);
        const enteredOnes = Number(onesInput);

        const isCorrect = enteredTens === questionData.totalTens && enteredOnes === questionData.totalOnes;

        if (isCorrect) {
            playSound('kaching');
            setFeedback('correct');
            setScore(s => s + 1);

            setTimeout(() => {
                if (questionIndex < TOTAL_QUESTIONS) {
                    const nextQ = questionIndex + 1;
                    setQuestionIndex(nextQ);
                    generateQuestion(nextQ);
                } else {
                    setPhase('results');
                }
            }, 1400);
        } else {
            playSound('error');
            setFeedback('wrong');
            setShowHint(true);
            setTimeout(() => setFeedback('idle'), 1300);
        }
    };

    const handleRestart = () => {
        setScore(0);
        setQuestionIndex(1);
        setPhase('playing');
        generateQuestion(1);
    };

    if (!mounted || !questionData) return null;

    // ============================================================================
    // RENDER: RESULTS SCREEN (Celebration after 5 questions)
    // ============================================================================
    if (phase === 'results') {
        const isPerfect = score === TOTAL_QUESTIONS;
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 font-sans md:rounded-3xl p-4 sm:p-6 text-center animate-fade-in text-white selection:bg-sky-500/30">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-xl bg-amber-500 border-4 border-white text-white animate-bounce">
                    <Trophy className="w-10 h-10 sm:w-14 sm:h-14" />
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mb-1 sm:mb-2 text-amber-400">
                    {isPerfect ? "CPA Addition Master!" : "Quiz Complete!"}
                </h1>
                <p className="text-slate-300 font-bold text-sm sm:text-lg mb-4 sm:mb-6 max-w-md">
                    {isPerfect 
                        ? "Outstanding! You mastered all 5 addition problems across Concrete, Pictorial, and Abstract stages!" 
                        : `Great effort! You solved ${score} out of ${TOTAL_QUESTIONS} questions accurately.`}
                </p>

                <div className="bg-slate-800 border-2 border-slate-700 px-6 sm:px-10 py-4 sm:py-6 rounded-2xl flex flex-col items-center shadow-lg mb-6 sm:mb-8">
                    <span className="text-slate-400 font-black uppercase tracking-widest text-xs mb-1">Final Score</span>
                    <span className="text-4xl sm:text-6xl font-black text-emerald-400">{score} / {TOTAL_QUESTIONS}</span>
                </div>

                <div className="flex gap-3 sm:gap-4 flex-wrap justify-center">
                    <button 
                        onClick={handleRestart}
                        className="bg-slate-800 text-white px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-black text-sm sm:text-base border border-slate-600 hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <RotateCcw size={18} /> Play Again
                    </button>
                    {onComplete && (
                        <button 
                            onClick={() => onComplete({ score })}
                            className="bg-emerald-500 text-white px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl font-black text-sm sm:text-base shadow-[0_4px_0_rgb(16,185,129)] hover:bg-emerald-400 active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2"
                        >
                            Complete Lesson <ArrowRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Calculated entered total for live preview
    const enteredTotal = (tensInput !== '' && onesInput !== '') 
        ? Number(tensInput) * 10 + Number(onesInput) 
        : null;

    // ============================================================================
    // REUSABLE SUB-COMPONENTS
    // ============================================================================

    // 1. Concrete Box of 10
    const BoxOf10 = ({ label = "10", emoji }: { label?: string; emoji: string }) => (
        <div className="flex flex-col items-center justify-center bg-gradient-to-b from-amber-900/60 to-amber-950/80 border border-amber-600/70 rounded-lg sm:rounded-xl px-1.5 sm:px-2 py-1 shadow-md shrink-0">
            <div className="grid grid-cols-5 gap-0.5 sm:gap-1 p-0.5 bg-black/30 rounded">
                {Array.from({ length: 10 }).map((_, i) => (
                    <span key={i} className="text-[11px] sm:text-xs leading-none drop-shadow select-none">
                        {emoji}
                    </span>
                ))}
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300 mt-0.5">
                {label}
            </span>
        </div>
    );

    // 2. Concrete Loose Item
    const LooseItem = ({ emoji }: { emoji: string }) => (
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-700/60 border border-slate-600 flex items-center justify-center text-xs sm:text-sm shadow-sm shrink-0">
            {emoji}
        </div>
    );

    // 3. Pictorial Ten Bar (prominent height, clear framing)
    const TenRod = ({ heightClass = "h-14 sm:h-18 md:h-20" }: { heightClass?: string }) => (
        <div className="flex flex-col items-center bg-cyan-950/40 border border-cyan-500/40 rounded-lg px-1 py-1 shadow-sm shrink-0">
            <img 
                src="/assets/maths/FLN/Ten.svg" 
                alt="10 Rod" 
                className={`${heightClass} w-auto object-contain drop-shadow`} 
            />
            <span className="text-[9px] font-black text-cyan-300 mt-0.5">10</span>
        </div>
    );

    // 4. Pictorial One Cube (matching aspect & style)
    const OneCube = ({ sizeClass = "w-4 h-4 sm:w-5 sm:h-5" }: { sizeClass?: string }) => (
        <div className="flex flex-col items-center bg-amber-950/40 border border-amber-500/40 rounded-lg p-0.5 sm:p-1 shadow-sm shrink-0">
            <img 
                src="/assets/maths/FLN/One.svg" 
                alt="1 Cube" 
                className={`${sizeClass} object-contain drop-shadow`} 
            />
            <span className="text-[8px] font-black text-amber-300">1</span>
        </div>
    );

    // ============================================================================
    // PANEL 1: CONCRETE EXPERIENCE (Crates & Loose Items)
    // ============================================================================
    const renderConcretePanel = (isMobileView: boolean) => (
        <div className="flex flex-col h-full bg-slate-800/90 rounded-2xl border-2 border-amber-500/40 p-2 sm:p-3 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">1</span>
                    <Boxes className="w-4 h-4 text-amber-400" />
                    <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-amber-300">Concrete</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Real Objects ({questionData.theme.unit})</span>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col justify-between gap-2 overflow-y-auto min-h-0 pr-0.5">
                {/* Addend 1 Row */}
                <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-1.5 sm:p-2">
                    <div className="flex items-center justify-between text-[11px] font-black text-cyan-400 mb-1">
                        <span>First Group:</span>
                        <span className="bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300">{questionData.addend1}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1 flex-wrap">
                            {Array.from({ length: questionData.a1T }).map((_, i) => (
                                <BoxOf10 key={i} emoji={questionData.theme.emoji} label="10" />
                            ))}
                            <span className="text-[10px] font-bold text-cyan-300">({questionData.a1T * 10})</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                            {Array.from({ length: questionData.a1O }).map((_, i) => (
                                <LooseItem key={i} emoji={questionData.theme.emoji} />
                            ))}
                            <span className="text-[10px] font-bold text-slate-400">({questionData.a1O})</span>
                        </div>
                    </div>
                </div>

                {/* Addend 2 Row */}
                <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-1.5 sm:p-2">
                    <div className="flex items-center justify-between text-[11px] font-black text-lime-400 mb-1">
                        <span>+ Second Group:</span>
                        <span className="bg-lime-500/20 px-1.5 py-0.5 rounded text-lime-300">{questionData.addend2}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1 flex-wrap">
                            {Array.from({ length: questionData.a2T }).map((_, i) => (
                                <BoxOf10 key={i} emoji={questionData.theme.emoji} label="10" />
                            ))}
                            <span className="text-[10px] font-bold text-lime-300">({questionData.a2T * 10})</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                            {Array.from({ length: questionData.a2O }).map((_, i) => (
                                <LooseItem key={i} emoji={questionData.theme.emoji} />
                            ))}
                            <span className="text-[10px] font-bold text-slate-400">({questionData.a2O})</span>
                        </div>
                    </div>
                </div>

                {/* Combine Action & Merged Result */}
                {!concreteMerged ? (
                    <div className="flex flex-col items-center justify-center p-2 shrink-0">
                        <button
                            onClick={handleMergeConcrete}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2 sm:py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_3px_0_rgb(180,83,9)] active:translate-y-[2px] active:shadow-none transition-all"
                        >
                            <ArrowDownToLine size={15} /> Combine & Count {questionData.theme.unit}
                        </button>
                    </div>
                ) : (
                    <div className="bg-amber-950/40 border-2 border-amber-500/50 rounded-xl p-2 shrink-0 animate-fade-in shadow-inner">
                        <div className="flex items-center justify-between text-[10px] font-black text-amber-300 uppercase mb-1.5">
                            <span className="flex items-center gap-1">
                                <CheckCircle2 size={13} className="text-amber-400" /> Total Combined:
                            </span>
                            <span className="text-emerald-400 font-black">{questionData.total} {questionData.theme.unit}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1 flex-wrap">
                                {Array.from({ length: questionData.totalTens }).map((_, i) => (
                                    <BoxOf10 key={i} emoji={questionData.theme.emoji} label="10" />
                                ))}
                            </div>
                            <div className="flex items-center gap-1 flex-wrap justify-end">
                                {Array.from({ length: questionData.totalOnes }).map((_, i) => (
                                    <LooseItem key={i} emoji={questionData.theme.emoji} />
                                ))}
                            </div>
                        </div>
                        <div className="text-center mt-1.5 text-[11px] font-bold text-amber-200">
                            {questionData.totalTens} boxes of 10 ({questionData.totalTens * 10}) + {questionData.totalOnes} loose = <span className="font-black text-white">{questionData.total}</span>
                        </div>

                        {isMobileView && (
                            <button
                                onClick={() => { playSound('pop'); setCurrentStep(2); }}
                                className="w-full mt-2 bg-sky-600 hover:bg-sky-500 text-white py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-[0_3px_0_rgb(2,132,199)] active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                Next: Pictorial Blocks <ArrowRight size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // ============================================================================
    // PANEL 2: PICTORIAL EXPERIENCE (Base-10 Rods & Cubes)
    // ============================================================================
    const renderPictorialPanel = (isMobileView: boolean) => (
        <div className="flex flex-col h-full bg-slate-800/90 rounded-2xl border-2 border-cyan-500/40 p-2 sm:p-3 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs">2</span>
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-cyan-300">Pictorial</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Base-10 Blocks</span>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col justify-between gap-2 overflow-y-auto min-h-0 pr-0.5">
                {/* Addend 1 Row */}
                <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-1.5 sm:p-2">
                    <div className="flex items-center justify-between text-[11px] font-black text-cyan-400 mb-1">
                        <span>Number 1: {questionData.addend1}</span>
                        <span className="text-[10px] text-slate-400">{questionData.a1T} Tens, {questionData.a1O} Ones</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                            {Array.from({ length: questionData.a1T }).map((_, i) => (
                                <TenRod key={i} />
                            ))}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                            {Array.from({ length: questionData.a1O }).map((_, i) => (
                                <OneCube key={i} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Addend 2 Row */}
                <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-1.5 sm:p-2">
                    <div className="flex items-center justify-between text-[11px] font-black text-lime-400 mb-1">
                        <span>+ Number 2: {questionData.addend2}</span>
                        <span className="text-[10px] text-slate-400">{questionData.a2T} Tens, {questionData.a2O} Ones</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                            {Array.from({ length: questionData.a2T }).map((_, i) => (
                                <TenRod key={i} />
                            ))}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                            {Array.from({ length: questionData.a2O }).map((_, i) => (
                                <OneCube key={i} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Combine Action & Merged Result */}
                {!pictorialMerged ? (
                    <div className="flex flex-col items-center justify-center p-2 shrink-0">
                        <button
                            onClick={handleMergePictorial}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 sm:py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_3px_0_rgb(8,145,178)] active:translate-y-[2px] active:shadow-none transition-all"
                        >
                            <ArrowDownToLine size={15} /> Combine & Count Blocks
                        </button>
                    </div>
                ) : (
                    <div className="bg-cyan-950/40 border-2 border-cyan-500/50 rounded-xl p-2 shrink-0 animate-fade-in shadow-inner">
                        <div className="flex items-center justify-between text-[10px] font-black text-cyan-300 uppercase mb-1.5">
                            <span className="flex items-center gap-1">
                                <CheckCircle2 size={13} className="text-cyan-400" /> Total Blocks:
                            </span>
                            <span className="text-emerald-400 font-black">{questionData.total}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                                {Array.from({ length: questionData.totalTens }).map((_, i) => (
                                    <TenRod key={i} />
                                ))}
                            </div>
                            <div className="flex items-center gap-1 flex-wrap justify-end">
                                {Array.from({ length: questionData.totalOnes }).map((_, i) => (
                                    <OneCube key={i} />
                                ))}
                            </div>
                        </div>
                        <div className="text-center mt-1.5 text-[11px] font-bold text-cyan-200">
                            {questionData.totalTens} Tens ({questionData.totalTens * 10}) + {questionData.totalOnes} Ones ({questionData.totalOnes}) = <span className="font-black text-white">{questionData.total}</span>
                        </div>

                        {isMobileView && (
                            <button
                                onClick={() => { playSound('pop'); setCurrentStep(3); }}
                                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-[0_3px_0_rgb(5,150,105)] active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                Next: Abstract Math <ArrowRight size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // ============================================================================
    // PANEL 3: ABSTRACT EXPERIENCE (Place Value Column Math & Input)
    // ============================================================================
    const renderAbstractPanel = () => (
        <div className="flex flex-col h-full bg-slate-800/90 rounded-2xl border-2 border-emerald-500/40 p-2 sm:p-3 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">3</span>
                    <Binary className="w-4 h-4 text-emerald-400" />
                    <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-emerald-300">Abstract</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Place Value Numerals</span>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col justify-between gap-2 overflow-y-auto min-h-0 pr-0.5">
                
                {/* Column Place Value Mat */}
                <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-2 sm:p-3 flex flex-col items-center">
                    
                    {/* Place Value Headers */}
                    <div className="grid grid-cols-2 w-48 sm:w-56 text-center font-black text-xs sm:text-sm uppercase pb-1 mb-1 border-b border-slate-700/80">
                        <span className="text-cyan-400 tracking-wider">Tens (T)</span>
                        <span className="text-amber-400 tracking-wider">Ones (O)</span>
                    </div>

                    {/* Addend 1 Row */}
                    <div className="grid grid-cols-2 w-48 sm:w-56 text-center font-black text-xl sm:text-2xl py-0.5 text-slate-200">
                        <span className="text-cyan-300">{questionData.a1T}</span>
                        <span className="text-amber-300">{questionData.a1O}</span>
                    </div>

                    {/* Addend 2 Row */}
                    <div className="grid grid-cols-2 w-48 sm:w-56 text-center font-black text-xl sm:text-2xl py-0.5 text-slate-200 relative">
                        <span className="absolute left-1 top-0.5 text-lime-400 text-lg sm:text-xl font-black">+</span>
                        <span className="text-cyan-300">{questionData.a2T}</span>
                        <span className="text-amber-300">{questionData.a2O}</span>
                    </div>

                    {/* Horizontal Divider Line */}
                    <div className="w-48 sm:w-56 border-b-2 border-emerald-500/80 my-1"></div>

                    {/* Input Result Row */}
                    <div className="grid grid-cols-2 w-48 sm:w-56 gap-2 pt-1">
                        {/* Tens Input */}
                        <div 
                            onClick={() => { playSound('click'); setActiveField('tens'); }}
                            className={`cursor-pointer rounded-xl border-2 py-1.5 flex flex-col items-center transition-all ${
                                activeField === 'tens' 
                                    ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/50' 
                                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                            }`}
                        >
                            <span className="text-[9px] uppercase font-bold text-cyan-400">Tens</span>
                            <span className="text-2xl sm:text-3xl font-black text-cyan-300 min-h-[1.75rem] flex items-center">
                                {tensInput || <span className="text-slate-600">?</span>}
                            </span>
                        </div>

                        {/* Ones Input */}
                        <div 
                            onClick={() => { playSound('click'); setActiveField('ones'); }}
                            className={`cursor-pointer rounded-xl border-2 py-1.5 flex flex-col items-center transition-all ${
                                activeField === 'ones' 
                                    ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/50' 
                                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                            }`}
                        >
                            <span className="text-[9px] uppercase font-bold text-amber-400">Ones</span>
                            <span className="text-2xl sm:text-3xl font-black text-amber-300 min-h-[1.75rem] flex items-center">
                                {onesInput || <span className="text-slate-600">?</span>}
                            </span>
                        </div>
                    </div>

                    {/* Result Preview */}
                    <div className="mt-1.5 text-center text-xs font-bold text-slate-400">
                        Total Sum = <span className="font-black text-emerald-400 text-sm sm:text-base">{enteredTotal !== null ? enteredTotal : '?'}</span>
                    </div>
                </div>

                {/* Keypad for Touch / Quick Entry */}
                <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-1.5 sm:p-2">
                    <div className="grid grid-cols-5 gap-1 max-w-[260px] mx-auto">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => (
                            <button
                                key={digit}
                                onClick={() => handleKeypadPress(String(digit))}
                                className="bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-white font-black text-sm sm:text-base py-1.5 sm:py-2 rounded-lg border border-slate-600 transition-all active:scale-95 shadow-sm"
                            >
                                {digit}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 max-w-[260px] mx-auto mt-1">
                        <button
                            onClick={handleKeypadDelete}
                            className="flex-1 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-bold py-1 sm:py-1.5 rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-1"
                        >
                            <Delete size={14} /> Clear Active
                        </button>
                    </div>
                </div>

                {/* Hint if wrong */}
                {showHint && (
                    <div className="bg-rose-500/20 border border-rose-500/50 rounded-lg px-2 py-1 text-center text-xs text-rose-300 font-bold animate-fade-in shrink-0">
                        Count your rods: {questionData.totalTens} Tens and {questionData.totalOnes} Ones!
                    </div>
                )}

                {/* Submit Action */}
                <div className="pt-1 shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={tensInput === '' || onesInput === '' || feedback !== 'idle'}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-2.5 sm:py-3 px-4 rounded-xl font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_0_rgb(16,185,129)] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Check size={18} /> Check Answer
                    </button>
                </div>
            </div>
        </div>
    );

    // ============================================================================
    // MAIN QUIZ CONTAINER
    // ============================================================================
    return (
        <div className="w-full h-full flex flex-col bg-slate-900 font-sans md:rounded-3xl p-2 sm:p-3 md:p-5 text-white relative overflow-hidden select-none">
            
            {/* Global Success / Try Again Feedback Overlay */}
            {feedback !== 'idle' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm pointer-events-none animate-fade-in">
                    <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center shadow-2xl animate-bounce ${feedback === 'correct' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        {feedback === 'correct' ? <Check className="w-12 h-12 sm:w-16 sm:h-16 text-white" /> : <RotateCcw className="w-12 h-12 sm:w-16 sm:h-16 text-white" />}
                    </div>
                </div>
            )}

            {/* TOP HEADER: Progress & Score */}
            <div className="shrink-0 flex items-center justify-between gap-2 mb-1.5 sm:mb-2 px-1">
                <div className="flex items-center gap-2">
                    <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 sm:py-1 rounded-lg font-black text-xs sm:text-sm">
                        Question {questionIndex} of {TOTAL_QUESTIONS}
                    </span>
                    <div className="hidden sm:flex gap-1">
                        {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`w-4 h-2 rounded-full transition-all ${
                                    idx + 1 < questionIndex 
                                        ? 'bg-emerald-400' 
                                        : idx + 1 === questionIndex 
                                            ? 'bg-sky-400 ring-2 ring-sky-300' 
                                            : 'bg-slate-700'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-emerald-400 font-black text-xs sm:text-sm bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 sm:py-1 rounded-lg">
                        Score: {score}
                    </span>
                </div>
            </div>

            {/* PROBLEM PROMPT BANNER */}
            <div className="shrink-0 bg-slate-800/90 border border-slate-700 rounded-xl sm:rounded-2xl px-3 py-1 sm:py-1.5 mb-2 flex items-center justify-between text-center shadow-inner">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-slate-400 text-xs sm:text-sm font-bold hidden sm:inline">CPA Place Value Addition:</span>
                    <span className="text-slate-400 text-xs sm:text-sm font-bold sm:hidden">Add:</span>
                </div>
                <div className="text-base sm:text-xl md:text-2xl font-black tracking-wide">
                    <span className="text-cyan-400">{questionData.addend1}</span>
                    <span className="text-slate-400 mx-1.5 sm:mx-2">+</span>
                    <span className="text-lime-400">{questionData.addend2}</span>
                    <span className="text-slate-400 mx-1.5 sm:mx-2">=</span>
                    <span className="text-amber-400 font-black underline decoration-amber-400 decoration-2 underline-offset-4">
                        {enteredTotal !== null ? enteredTotal : '?'}
                    </span>
                </div>
                <div className="text-xs text-amber-400 font-bold hidden sm:flex items-center gap-1">
                    <span>{questionData.theme.emoji}</span>
                    <span>{questionData.theme.unit}</span>
                </div>
            </div>

            {/* MOBILE STEP NAVIGATION TABS (Visible only on < lg screens) */}
            <div className="lg:hidden shrink-0 grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl mb-2 border border-slate-700">
                <button
                    onClick={() => { playSound('click'); setCurrentStep(1); }}
                    className={`py-1.5 px-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all ${
                        currentStep === 1 
                            ? 'bg-amber-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Boxes size={13} />
                    <span>1. Concrete</span>
                    {concreteMerged && <CheckCircle2 size={11} className="text-emerald-300" />}
                </button>

                <button
                    onClick={() => { playSound('click'); setCurrentStep(2); }}
                    className={`py-1.5 px-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all ${
                        currentStep === 2 
                            ? 'bg-cyan-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Layers size={13} />
                    <span>2. Pictorial</span>
                    {pictorialMerged && <CheckCircle2 size={11} className="text-emerald-300" />}
                </button>

                <button
                    onClick={() => { playSound('click'); setCurrentStep(3); }}
                    className={`py-1.5 px-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all ${
                        currentStep === 3 
                            ? 'bg-emerald-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Calculator size={13} />
                    <span>3. Abstract</span>
                    {tensInput !== '' && onesInput !== '' && <CheckCircle2 size={11} className="text-emerald-300" />}
                </button>
            </div>

            {/* ==================================================================== */}
            {/* VIEWPORTS: SIDE-BY-SIDE ON LARGE SCREENS, SINGLE-STEP ON MOBILE     */}
            {/* ==================================================================== */}

            {/* 1. LARGE SCREENS (lg: >=1024px): ALL 3 STEPS SIMULTANEOUSLY */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-3 flex-1 min-h-0">
                {renderConcretePanel(false)}
                {renderPictorialPanel(false)}
                {renderAbstractPanel()}
            </div>

            {/* 2. MOBILE / TABLET (< lg): SINGLE STEP BASED ON currentStep */}
            <div className="lg:hidden flex-1 flex flex-col min-h-0">
                {currentStep === 1 && renderConcretePanel(true)}
                {currentStep === 2 && renderPictorialPanel(true)}
                {currentStep === 3 && renderAbstractPanel()}
            </div>

        </div>
    );
}