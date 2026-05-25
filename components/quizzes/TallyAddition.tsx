"use client";

import React, { useState, useEffect } from 'react';
import { Shuffle, CheckCircle, Volume2, X, RefreshCcw } from 'lucide-react';

// --- TYPES & INTERFACES ---
type Problem = {
    id: string;
    a: number;
    b: number;
    tallyA: number;
    tallyB: number;
    answer: string;
    status: 'idle' | 'correct' | 'error';
    errors: { a: boolean, b: boolean, ans: boolean }; // Tracks specific mistakes
    isCounting: boolean;
    highlighted: { section: 'A' | 'B' | null, index: number };
};

export default function TallyAddition({ lesson }: any) {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    // --- RESPONSIVE LISTENER ---
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile(); // Initial check
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // --- AUDIO ENGINE ---
    const playSound = (type: 'boing' | 'error' | 'success' | 'pop' | 'click') => {
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
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
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
            const total = Math.floor(Math.random() * 9) + 2; // 2 to 10
            const a = Math.floor(Math.random() * (total - 1)) + 1;
            const b = total - a;
            
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
        playSound('pop');
    };

    useEffect(() => {
        generateQuestions();
    }, []);

    // --- STATE UPDATERS ---
    const updateProblem = (id: string, updates: Partial<Problem>) => {
        setProblems(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const handleTally = (id: string, section: 'A' | 'B') => {
        const p = problems.find(x => x.id === id);
        if (!p || p.status === 'correct' || p.isCounting) return;

        if (section === 'A' && p.tallyA < 10) {
            updateProblem(id, { tallyA: p.tallyA + 1, status: 'idle', errors: { ...p.errors, a: false } });
            playSound('click');
        } else if (section === 'B' && p.tallyB < 10) {
            updateProblem(id, { tallyB: p.tallyB + 1, status: 'idle', errors: { ...p.errors, b: false } });
            playSound('click');
        }
    };

    const clearTally = (e: React.MouseEvent, id: string, section: 'A' | 'B') => {
        e.stopPropagation();
        const p = problems.find(x => x.id === id);
        if (!p || p.status === 'correct' || p.isCounting) return;

        if (section === 'A') updateProblem(id, { tallyA: 0, status: 'idle', errors: { ...p.errors, a: false } });
        if (section === 'B') updateProblem(id, { tallyB: 0, status: 'idle', errors: { ...p.errors, b: false } });
        playSound('pop');
    };

    const handleInput = (id: string, val: string) => {
        const p = problems.find(x => x.id === id);
        if (!p || p.status === 'correct' || p.isCounting) return;
        updateProblem(id, { answer: val, status: 'idle', errors: { ...p.errors, ans: false } });
    };

    // --- COUNTING ANIMATION ---
    const triggerCount = async (id: string) => {
        const p = problems.find(x => x.id === id);
        if (!p || p.isCounting || (p.tallyA === 0 && p.tallyB === 0)) return;

        updateProblem(id, { isCounting: true, status: 'idle', errors: { a: false, b: false, ans: false } });
        
        let currentTotal = 0;

        // Count A
        for (let i = 0; i < p.tallyA; i++) {
            currentTotal++;
            updateProblem(id, { highlighted: { section: 'A', index: i } });
            playSound('pop');
            speak(currentTotal.toString());
            await sleep(800);
        }

        // Count B
        for (let i = 0; i < p.tallyB; i++) {
            currentTotal++;
            updateProblem(id, { highlighted: { section: 'B', index: i } });
            playSound('pop');
            speak(currentTotal.toString());
            await sleep(800);
        }

        // Cleanup
        updateProblem(id, { isCounting: false, highlighted: { section: null, index: -1 } });
    };

    // --- VALIDATION ---
    const checkAnswers = () => {
        // Only validate the ones currently visible on screen
        const visibleProblems = isMobile ? problems.slice(0, 3) : problems;
        let allCorrect = true;

        const evaluated = problems.map((p, index) => {
            // If it's not visible, just return it as is
            if (isMobile && index >= 3) return p;

            const isACorrect = p.tallyA === p.a;
            const isBCorrect = p.tallyB === p.b;
            const isAnsCorrect = parseInt(p.answer) === (p.a + p.b);
            
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
            return (
                <div 
                    key={i} 
                    className={`w-2 md:w-2.5 rounded-full transition-all duration-300 ${isHighlighted ? 'h-8 md:h-10 bg-amber-400 scale-125 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'h-6 md:h-8 bg-sky-500'}`} 
                />
            );
        });
    };

    const visibleProblems = isMobile ? problems.slice(0, 3) : problems;

    return (
        <div className="w-full h-full flex flex-col items-center p-2 bg-slate-100 font-sans select-none overflow-x-hidden overflow-y-auto relative">
            
            {/* 1. HEADER (Compact) */}
            <div className="w-full max-w-6xl shrink-0 z-20 mb-2 md:mb-3">
                <div className="w-full p-2 md:p-3 rounded-[1rem] bg-white border-2 border-slate-200 shadow-sm text-center">
                    <h2 className="text-lg md:text-2xl font-black text-slate-700">Notebook Tally Practice</h2>
                    <p className="text-xs md:text-sm text-slate-500 font-bold">Draw the tallies, count them up, and type your answer!</p>
                </div>
            </div>

            {/* 2. THE GRID (Compact Spacing) */}
            <div className="w-full max-w-6xl flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 pb-2 md:pb-4">
                {visibleProblems.map((p) => (
                    <div 
                        key={p.id} 
                        className={`relative w-full rounded-[1.5rem] p-2 md:p-3 flex flex-row transition-all duration-500 border-2 shadow-sm ${p.status === 'correct' ? 'bg-lime-50 border-lime-400' : p.status === 'error' ? 'bg-white border-rose-200' : 'bg-white border-slate-200'}`}
                    >
                        {/* LEFT: Math Equation (Scaled Down) */}
                        <div className="w-2/5 flex flex-col items-end pr-2 md:pr-4 border-r-2 border-dashed border-slate-200 justify-center">
                            <span className="text-3xl md:text-4xl font-black text-slate-700">{p.a}</span>
                            <div className="flex items-center gap-1 md:gap-2 mt-1">
                                <span className="text-2xl md:text-3xl font-black text-sky-500">+</span>
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
                            
                            {/* Tally A Area */}
                            <div 
                                onClick={() => handleTally(p.id, 'A')}
                                className={`relative w-full min-h-[45px] md:min-h-[55px] rounded-lg border-2 flex items-center px-2 gap-1 flex-wrap transition-all ${p.status === 'correct' ? 'bg-transparent border-transparent' : p.errors.a ? 'bg-rose-50 border-rose-400' : 'bg-slate-50 border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300'}`}
                            >
                                {p.tallyA === 0 && p.status !== 'correct' && (
                                    <span className="text-slate-300 text-xs md:text-sm font-bold italic">Tap to draw...</span>
                                )}
                                {renderTallyBars(p.tallyA, 'A', p)}
                                
                                {/* Clear Button */}
                                {p.tallyA > 0 && p.status !== 'correct' && !p.isCounting && (
                                    <button onClick={(e) => clearTally(e, p.id, 'A')} className="absolute -top-1 -right-1 w-5 h-5 bg-slate-300 text-white rounded-full flex items-center justify-center hover:bg-rose-400 z-10 shadow-sm">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Tally B Area */}
                            <div 
                                onClick={() => handleTally(p.id, 'B')}
                                className={`relative w-full min-h-[45px] md:min-h-[55px] rounded-lg border-2 flex items-center px-2 gap-1 flex-wrap transition-all ${p.status === 'correct' ? 'bg-transparent border-transparent' : p.errors.b ? 'bg-rose-50 border-rose-400' : 'bg-slate-50 border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300'}`}
                            >
                                {p.tallyB === 0 && p.status !== 'correct' && (
                                    <span className="text-slate-300 text-xs md:text-sm font-bold italic">Tap to draw...</span>
                                )}
                                {renderTallyBars(p.tallyB, 'B', p)}

                                {/* Clear Button */}
                                {p.tallyB > 0 && p.status !== 'correct' && !p.isCounting && (
                                    <button onClick={(e) => clearTally(e, p.id, 'B')} className="absolute -top-1 -right-1 w-5 h-5 bg-slate-300 text-white rounded-full flex items-center justify-center hover:bg-rose-400 z-10 shadow-sm">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Automated Count Button */}
                            {p.status !== 'correct' && (
                                <button 
                                    onClick={() => triggerCount(p.id)}
                                    disabled={p.isCounting || (p.tallyA === 0 && p.tallyB === 0)}
                                    className={`w-full py-1 md:py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-black text-xs md:text-sm transition-all ${p.isCounting ? 'bg-amber-400 text-amber-950 animate-pulse' : p.tallyA === 0 && p.tallyB === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 active:scale-95'}`}
                                >
                                    <Volume2 size={14} /> {p.isCounting ? 'Counting...' : 'Count Tallies'}
                                </button>
                            )}

                        </div>

                        {/* Success Overlay Checkmark */}
                        {p.status === 'correct' && (
                            <div className="absolute -top-2 -right-2">
                                <CheckCircle size={28} className="text-lime-500 fill-white drop-shadow-md" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 3. STICKY BOTTOM CONTROLS (Safely anchored inside the component) */}
            <div className="sticky bottom-0 left-0 w-full bg-slate-100/95 backdrop-blur-sm border-t-2 border-slate-200 p-2 md:p-3 z-50 flex justify-center mt-auto shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="w-full max-w-6xl flex justify-between items-center gap-2 md:gap-4">
                    
                    <button 
                        onClick={generateQuestions}
                        className="flex-1 md:flex-none bg-purple-500 hover:bg-purple-400 text-white font-black text-xs md:text-lg px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl flex items-center justify-center gap-1.5 shadow-[0_3px_0_rgb(147,51,234)] active:translate-y-1 active:shadow-none transition-all whitespace-nowrap"
                    >
                        <RefreshCcw size={16} /> New <span className="hidden sm:inline">Questions</span>
                    </button>

                    <button 
                        onClick={checkAnswers}
                        className="flex-1 md:flex-none bg-lime-400 hover:bg-lime-300 text-lime-950 font-black text-sm md:text-xl px-4 md:px-12 py-2 md:py-3 rounded-xl md:rounded-2xl border-[3px] md:border-4 border-lime-500 flex items-center justify-center tracking-wider shadow-[0_3px_0_rgb(101,163,13)] active:translate-y-1 active:shadow-none transition-all"
                    >
                        CHECK ANSWERS
                    </button>

                </div>
            </div>

        </div>
    );
}