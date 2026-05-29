"use client";

import React, { useState, useEffect } from 'react';
import { Shuffle, CheckCircle, Volume2, X, RefreshCcw, Settings, Calculator, Scissors } from 'lucide-react';

// --- TYPES & INTERFACES ---
type Operation = '+' | '-';
type LimitSelect = 10 | 20;

type Problem = {
    id: string;
    a: number;
    b: number;
    tallyA: number;
    tallyB: number;
    answer: string;
    status: 'idle' | 'correct' | 'error';
    errors: { a: boolean, b: boolean, ans: boolean }; 
    isCounting: boolean;
    highlighted: { section: 'A' | 'B' | null, index: number };
};

export default function TallyPractice({ lesson }: any) {
    const [phase, setPhase] = useState<'config' | 'playing'>('config');
    const [config, setConfig] = useState<{ op: Operation, limit: LimitSelect }>({ op: '+', limit: 10 });
    
    const [problems, setProblems] = useState<Problem[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    // --- RESPONSIVE LISTENER ---
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile(); 
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // --- AUDIO ENGINE ---
    const playSound = (type: 'boing' | 'error' | 'success' | 'pop' | 'click' | 'snip') => {
        if (typeof window === 'undefined') return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (type === 'boing') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'pop' || type === 'click') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'snip') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'error') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'success') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
                osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) {
            console.log("Audio fallback", e);
        }
    };

    const speak = (text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const msg = new SpeechSynthesisUtterance(text);
            msg.rate = 0.9; 
            msg.pitch = 1.1; 
            window.speechSynthesis.speak(msg);
        }
    };

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    // --- DATA GENERATION ---
    const generateQuestions = () => {
        const newProblems: Problem[] = [];
        for (let i = 0; i < 6; i++) {
            let a = 0, b = 0;
            
            if (config.op === '+') {
                const total = Math.floor(Math.random() * (config.limit - 1)) + 2; 
                a = Math.floor(Math.random() * (total - 1)) + 1;
                b = total - a;
            } else {
                a = Math.floor(Math.random() * (config.limit - 1)) + 2; 
                b = Math.floor(Math.random() * (a - 1)) + 1;
            }
            
            newProblems.push({
                id: `prob-${Date.now()}-${i}`,
                a, b,
                tallyA: 0, tallyB: 0, answer: '',
                status: 'idle',
                errors: { a: false, b: false, ans: false },
                isCounting: false,
                highlighted: { section: null, index: -1 }
            });
        }
        setProblems(newProblems);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        setPhase('playing');
        playSound('pop');
    };

    // --- STATE UPDATERS ---
    const updateProblem = (id: string, updates: Partial<Problem>) => {
        setProblems(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const handleTally = (id: string, section: 'A' | 'B') => {
        const p = problems.find(x => x.id === id);
        if (!p || p.status === 'correct' || p.isCounting) return;

        if (section === 'A' && p.tallyA < config.limit) {
            updateProblem(id, { tallyA: p.tallyA + 1, status: 'idle', errors: { ...p.errors, a: false } });
            playSound('click');
        } 
        else if (section === 'B') {
            if (config.op === '+' && p.tallyB < config.limit) {
                updateProblem(id, { tallyB: p.tallyB + 1, status: 'idle', errors: { ...p.errors, b: false } });
                playSound('click');
            } 
            else if (config.op === '-' && p.tallyB < p.tallyA) {
                // In subtraction, B is used to "cut" the tallies in A
                updateProblem(id, { tallyB: p.tallyB + 1, status: 'idle', errors: { ...p.errors, b: false } });
                playSound('snip');
            }
        }
    };

    const clearTally = (e: React.MouseEvent, id: string, section: 'A' | 'B') => {
        e.stopPropagation();
        const p = problems.find(x => x.id === id);
        if (!p || p.status === 'correct' || p.isCounting) return;

        if (section === 'A') updateProblem(id, { tallyA: 0, tallyB: config.op === '-' ? 0 : p.tallyB, status: 'idle', errors: { ...p.errors, a: false } });
        if (section === 'B') updateProblem(id, { tallyB: 0, status: 'idle', errors: { ...p.errors, b: false } });
        playSound('pop');
    };

    const handleInput = (id: string, val: string) => {
        const p = problems.find(x => x.id === id);
        if (!p || p.status === 'correct' || p.isCounting) return;
        updateProblem(id, { answer: val.slice(0, 3), status: 'idle', errors: { ...p.errors, ans: false } });
    };

    // --- COUNTING ANIMATION ---
    const triggerCount = async (id: string) => {
        const p = problems.find(x => x.id === id);
        if (!p || p.isCounting || p.tallyA === 0) return;

        updateProblem(id, { isCounting: true, status: 'idle', errors: { a: false, b: false, ans: false } });
        
        let currentTotal = 0;

        if (config.op === '+') {
            // Count A
            for (let i = 0; i < p.tallyA; i++) {
                currentTotal++;
                updateProblem(id, { highlighted: { section: 'A', index: i } });
                playSound('pop'); speak(currentTotal.toString());
                await sleep(800);
            }
            // Count B
            for (let i = 0; i < p.tallyB; i++) {
                currentTotal++;
                updateProblem(id, { highlighted: { section: 'B', index: i } });
                playSound('pop'); speak(currentTotal.toString());
                await sleep(800);
            }
        } else {
            // For subtraction, just count the remaining UN-CROSSED tallies
            const remaining = p.tallyA - p.tallyB;
            for (let i = 0; i < remaining; i++) {
                currentTotal++;
                updateProblem(id, { highlighted: { section: 'A', index: i } });
                playSound('pop'); speak(currentTotal.toString());
                await sleep(800);
            }
        }

        updateProblem(id, { isCounting: false, highlighted: { section: null, index: -1 } });
    };

    // --- VALIDATION ---
    const checkAnswers = () => {
        const visibleProblems = isMobile ? problems.slice(0, 3) : problems;
        let allCorrect = true;

        const evaluated = problems.map((p, index) => {
            if (isMobile && index >= 3) return p;

            const isACorrect = p.tallyA === p.a;
            const isBCorrect = p.tallyB === p.b;
            const isAnsCorrect = config.op === '+' ? parseInt(p.answer) === (p.a + p.b) : parseInt(p.answer) === (p.a - p.b);
            
            if (isACorrect && isBCorrect && isAnsCorrect) {
                return { ...p, status: 'correct' as const, errors: { a: false, b: false, ans: false } };
            } else {
                allCorrect = false;
                return { 
                    ...p, 
                    status: 'error' as const, 
                    errors: { a: !isACorrect, b: !isBCorrect, ans: !isAnsCorrect } 
                };
            }
        });

        setProblems(evaluated);

        if (allCorrect) {
            playSound('success');
            speak("Excellent work! You got them all correct.");
        } else {
            playSound('error');
            speak("Some answers are incorrect. Check the red boxes and try again!");
        }
    };

    // --- RENDER HELPERS ---
    const renderTallyBars = (count: number, section: 'A' | 'B', p: Problem) => {
        return Array.from({ length: count }).map((_, i) => {
            const isHighlighted = p.highlighted.section === section && p.highlighted.index === i;
            
            // Subtraction slice logic (crosses out from the end)
            const isCrossed = config.op === '-' && section === 'A' && i >= (p.tallyA - p.tallyB);
            
            return (
                <div 
                    key={i} 
                    className={`relative w-2 md:w-2.5 rounded-full transition-all duration-300 mx-0.5
                        ${isHighlighted ? 'h-8 md:h-10 bg-amber-400 scale-125 shadow-[0_0_10px_rgba(251,191,36,0.8)] z-10' : 'h-6 md:h-8 bg-sky-500'} 
                        ${isCrossed ? 'opacity-40 bg-slate-400' : ''}`} 
                >
                    {isCrossed && <div className="absolute top-1/2 left-1/2 w-[250%] h-[3px] bg-rose-500 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full drop-shadow-sm" />}
                </div>
            );
        });
    };

    // ============================================================================
    // RENDER: CONFIGURATION SCREEN
    // ============================================================================
    if (phase === 'config') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-50 font-sans overflow-y-auto">
                <div className="max-w-xl w-full bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border-4 border-slate-200 text-center space-y-6 my-auto">
                    <div className="flex justify-center"><div className="bg-indigo-100 p-3 rounded-full text-indigo-600 shadow-inner"><Settings size={36} /></div></div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Tally Practice Setup</h1>
                        <p className="text-xs md:text-sm text-slate-500 font-medium mt-2">Configure the problem types.</p>
                    </div>
                    
                    <div className="space-y-6 text-left">
                        <div>
                            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">1. Select Operation</label>
                            <div className="flex gap-2">
                                {(['+', '-'] as Operation[]).map(op => (
                                    <button 
                                        key={op} 
                                        onClick={() => { playSound('click'); setConfig({...config, op: op}); }} 
                                        className={`flex-1 py-3 text-xl font-black rounded-xl border-4 transition-all shadow-sm ${config.op === op ? 'bg-indigo-100 border-indigo-500 text-indigo-700 scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-300'}`}
                                    >
                                        {op === '+' ? 'Addition (+)' : 'Subtraction (-)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                <span>2. Number Range</span>
                            </label>
                            <div className="flex gap-2">
                                {([10, 20] as LimitSelect[]).map(l => (
                                    <button 
                                        key={l} 
                                        onClick={() => { playSound('click'); setConfig({...config, limit: l}); }} 
                                        className={`flex-1 py-3 text-sm md:text-base font-black rounded-xl border-4 transition-all shadow-sm ${config.limit === l ? 'bg-rose-100 border-rose-500 text-rose-700 scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-rose-300'}`}
                                    >
                                        Up to {l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={generateQuestions} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black text-lg py-4 rounded-xl shadow-[0_4px_0_rgb(15,23,42)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 mt-4"><Calculator size={20} /> Start Practice</button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PLAYING SANDBOX
    // ============================================================================
    const visibleProblems = isMobile ? problems.slice(0, 3) : problems;

    return (
        <div className="w-full h-full flex flex-col items-center p-2 bg-slate-50 font-sans select-none overflow-x-hidden overflow-y-auto relative">
            
            {/* 1. HEADER (Compact) */}
            <div className="w-full max-w-6xl shrink-0 z-20 mb-2 md:mb-3 flex gap-2">
                <button 
                    onClick={() => setPhase('config')} 
                    className="shrink-0 px-3 py-2 bg-white text-slate-500 rounded-2xl border-2 border-slate-200 font-bold uppercase hover:bg-slate-50 flex items-center justify-center shadow-sm"
                >
                    <Settings size={18} />
                </button>
                <div className="flex-1 p-2 md:p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-sm text-center">
                    <h2 className="text-sm md:text-xl font-black text-slate-700">Tally Practice ({config.op === '+' ? 'Addition' : 'Subtraction'})</h2>
                </div>
            </div>

            {/* 2. THE GRID */}
            <div className="w-full max-w-6xl flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 pb-2 md:pb-4">
                {visibleProblems.map((p) => (
                    <div 
                        key={p.id} 
                        className={`relative w-full rounded-[1.5rem] p-2 md:p-3 flex flex-row transition-all duration-500 border-[3px] shadow-sm ${p.status === 'correct' ? 'bg-lime-50 border-lime-500' : p.status === 'error' ? 'bg-white border-rose-200' : 'bg-white border-slate-200'}`}
                    >
                        {/* LEFT: Math Equation */}
                        <div className="w-2/5 flex flex-col items-end pr-2 md:pr-4 border-r-2 border-dashed border-slate-200 justify-center shrink-0">
                            <span className="text-3xl md:text-4xl font-black text-slate-700">{p.a}</span>
                            <div className="flex items-center gap-1 md:gap-2 mt-1">
                                <span className="text-2xl md:text-3xl font-black text-sky-500">{config.op}</span>
                                <span className="text-3xl md:text-4xl font-black text-slate-700">{p.b}</span>
                            </div>
                            <hr className="w-full border-[2px] border-slate-800 my-1 md:my-2 rounded-full" />
                            <input 
                                type="number" 
                                value={p.answer}
                                onChange={(e) => handleInput(p.id, e.target.value)}
                                disabled={p.status === 'correct' || p.isCounting}
                                className={`w-16 md:w-20 h-10 md:h-12 text-2xl md:text-3xl font-black text-center rounded-lg border-[3px] outline-none transition-all ${p.status === 'correct' ? 'bg-transparent border-transparent text-lime-700' : p.errors.ans ? 'bg-rose-50 border-rose-400 text-rose-700' : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-sky-400'}`}
                            />
                        </div>

                        {/* RIGHT: Concrete Tally Area */}
                        <div className="w-3/5 flex flex-col gap-2 pl-2 md:pl-4 justify-center">
                            
                            {/* Tally A Area (Draws base number) */}
                            <div 
                                onClick={() => handleTally(p.id, 'A')}
                                className={`relative w-full min-h-[45px] md:min-h-[55px] rounded-xl border-[3px] flex items-center px-2 py-1 gap-y-1 flex-wrap transition-all ${p.status === 'correct' ? 'bg-transparent border-transparent' : p.errors.a ? 'bg-rose-50 border-rose-400' : 'bg-slate-50 border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300'}`}
                            >
                                {p.tallyA === 0 && p.status !== 'correct' && (
                                    <span className="text-slate-300 text-[10px] md:text-xs font-bold italic uppercase tracking-wider">Tap to draw...</span>
                                )}
                                {renderTallyBars(p.tallyA, 'A', p)}
                                
                                {p.tallyA > 0 && p.status !== 'correct' && !p.isCounting && (
                                    <button onClick={(e) => clearTally(e, p.id, 'A')} className="absolute -top-2 -right-2 w-6 h-6 bg-slate-300 text-white rounded-full flex items-center justify-center hover:bg-rose-400 z-10 shadow-sm active:scale-95">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Tally B Area (Draws second number OR acts as a Scissor tool for subtraction) */}
                            <div 
                                onClick={() => handleTally(p.id, 'B')}
                                className={`relative w-full min-h-[45px] md:min-h-[55px] rounded-xl border-[3px] flex items-center px-2 py-1 gap-y-1 flex-wrap transition-all ${p.status === 'correct' ? 'bg-transparent border-transparent' : p.errors.b ? 'bg-rose-50 border-rose-400' : 'bg-slate-50 border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300'}`}
                            >
                                {config.op === '+' ? (
                                    <>
                                        {p.tallyB === 0 && p.status !== 'correct' && (
                                            <span className="text-slate-300 text-[10px] md:text-xs font-bold italic uppercase tracking-wider">Tap to draw...</span>
                                        )}
                                        {renderTallyBars(p.tallyB, 'B', p)}
                                    </>
                                ) : (
                                    // Subtraction: Scissor Zone
                                    <div className="w-full flex items-center justify-center gap-2 text-rose-500 opacity-80">
                                        <Scissors size={18} />
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">Tap to cut ({p.tallyB})</span>
                                    </div>
                                )}

                                {p.tallyB > 0 && p.status !== 'correct' && !p.isCounting && (
                                    <button onClick={(e) => clearTally(e, p.id, 'B')} className="absolute -top-2 -right-2 w-6 h-6 bg-slate-300 text-white rounded-full flex items-center justify-center hover:bg-rose-400 z-10 shadow-sm active:scale-95">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Automated Count Button */}
                            {p.status !== 'correct' && (
                                <button 
                                    onClick={() => triggerCount(p.id)}
                                    disabled={p.isCounting || p.tallyA === 0}
                                    className={`w-full py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-black text-xs md:text-sm transition-all ${p.isCounting ? 'bg-amber-400 text-amber-950' : p.tallyA === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 active:scale-95'}`}
                                >
                                    <Volume2 size={14} /> {p.isCounting ? 'Counting...' : config.op === '+' ? 'Count Tallies' : 'Count Remaining'}
                                </button>
                            )}

                        </div>

                        {/* Success Overlay Checkmark */}
                        {p.status === 'correct' && (
                            <div className="absolute -top-2 -right-2">
                                <CheckCircle size={28} className="text-lime-500 fill-white drop-shadow-md bg-white rounded-full" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 3. STICKY BOTTOM CONTROLS */}
            <div className="sticky bottom-0 left-0 w-full bg-slate-50/95 backdrop-blur-sm border-t-2 border-slate-200 p-2 md:p-3 z-50 flex justify-center mt-auto shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
                <div className="w-full max-w-6xl flex justify-between items-center gap-2 md:gap-4">
                    
                    <button 
                        onClick={generateQuestions}
                        className="flex-1 md:flex-none bg-purple-500 hover:bg-purple-400 text-white font-black text-xs md:text-base px-3 md:px-6 py-3 md:py-3.5 rounded-xl md:rounded-2xl flex items-center justify-center gap-1.5 border-b-[4px] border-purple-700 active:border-b-0 active:translate-y-[4px] transition-all whitespace-nowrap"
                    >
                        <RefreshCcw size={16} /> New <span className="hidden sm:inline">Questions</span>
                    </button>

                    <button 
                        onClick={checkAnswers}
                        className="flex-1 md:flex-none bg-lime-400 hover:bg-lime-300 text-lime-950 font-black text-sm md:text-xl px-4 md:px-12 py-3 md:py-3.5 rounded-xl md:rounded-2xl border-[4px] border-lime-500 flex items-center justify-center tracking-wider active:translate-y-[4px] active:border-b-0 transition-all"
                    >
                        CHECK ANSWERS
                    </button>

                </div>
            </div>

        </div>
    );
}