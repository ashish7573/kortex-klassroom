"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronLeft, CheckCircle2, ArrowRight, Play, Sparkles } from 'lucide-react';

const TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10];

const EMOJI_MAP: Record<number, string> = {
    2: '🍎', 3: '🍋', 4: '🍊', 5: '🍓', 6: '🍇', 
    7: '🍉', 8: '🥭', 9: '🍍', 10: '🥝'
};

const NUM_WORDS: Record<number, string> = {
    1: 'ones', 2: 'twos', 3: 'threes', 4: 'fours', 5: 'fives', 
    6: 'sixes', 7: 'sevens', 8: 'eights', 9: 'nines', 10: 'tens'
};

export default function TimesTable({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<'select' | 'build' | 'finish'>('select');
    const [currentTable, setCurrentTable] = useState<number>(2);
    const [mounted, setMounted] = useState(false);
    
    // Track inputs for rows 1 to 10. (1-indexed for easier math mapping)
    const [inputs, setInputs] = useState<Record<number, { wordAns: string, mathAns: string, isCorrect: boolean }>>({});

    useEffect(() => { setMounted(true); }, []);

    // --- Audio Engine ---
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
            
            if (type === 'pop') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.05, ctx.currentTime); } 
            else if (type === 'kaching') { osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3); gain.gain.setValueAtTime(0.2, ctx.currentTime); } 
            else if (type === 'error') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.2, ctx.currentTime); } 
            else if (type === 'whoosh') { osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.1, ctx.currentTime); } 
            else if (type === 'click') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime); gain.gain.setValueAtTime(0.05, ctx.currentTime); }
            else if (type === 'magic') { osc.type = 'sine'; osc.frequency.setValueAtTime(700, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.4); gain.gain.setValueAtTime(0.15, ctx.currentTime); }
            
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + (type === 'kaching' ? 0.4 : 0.2));
        } catch(e) {}
    };

    const handleSelectTable = (num: number) => {
        playSound('whoosh');
        setCurrentTable(num);
        
        // Initialize state: Pre-fill first 3 rows like the textbook, leave rest blank
        const initialInputs: any = {};
        for (let i = 1; i <= 10; i++) {
            if (i <= 3) {
                initialInputs[i] = { wordAns: (num * i).toString(), mathAns: (num * i).toString(), isCorrect: true };
            } else {
                initialInputs[i] = { wordAns: '', mathAns: '', isCorrect: false };
            }
        }
        setInputs(initialInputs);
        setPhase('build');
    };

    const handleInputChange = (row: number, field: 'wordAns' | 'mathAns', val: string) => {
        playSound('pop');
        const numVal = val.replace(/[^0-9]/g, '').substring(0, 3);
        
        setInputs(prev => {
            const rowData = { ...prev[row], [field]: numVal };
            const correctAns = currentTable * row;
            
            // Auto-check if both inputs are completely correct
            if (Number(rowData.wordAns) === correctAns && Number(rowData.mathAns) === correctAns) {
                if (!rowData.isCorrect) playSound('kaching');
                rowData.isCorrect = true;
            } else {
                rowData.isCorrect = false;
            }
            
            return { ...prev, [row]: rowData };
        });
    };

    const allCorrect = Object.values(inputs).every(r => r.isCorrect);

    if (!mounted) return null;

    // ============================================================================
    // RENDER: SELECTION PHASE
    // ============================================================================
    if (phase === 'select') {
        return (
            <div className="w-full h-full min-h-[600px] flex flex-col bg-slate-900 font-sans md:rounded-3xl p-6 relative overflow-y-auto selection:bg-sky-500/30">
                <div className="text-center mb-10 shrink-0 relative z-10 animate-fade-in-up">
                    <div className="bg-sky-500 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <Sparkles size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">Tables Builder</h1>
                    <p className="text-slate-400 font-bold text-lg">Select a table to start building!</p>
                </div>

                <div className="flex-1 flex items-center justify-center max-w-4xl mx-auto w-full z-10">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full">
                        {TABLES.map(num => (
                            <button 
                                key={num} onClick={() => handleSelectTable(num)}
                                className="bg-slate-800 border-4 border-slate-700 hover:border-sky-500 hover:bg-slate-700 text-white p-4 md:p-6 rounded-3xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-3 shadow-lg"
                            >
                                <span className="text-4xl md:text-5xl animate-bounce" style={{ animationDelay: `${num * 0.1}s` }}>
                                    {EMOJI_MAP[num]}
                                </span>
                                <span className="font-black text-xl md:text-2xl tracking-widest uppercase text-slate-300">Table of {num}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: FINISH PHASE
    // ============================================================================
    if (phase === 'finish') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 font-sans md:rounded-3xl p-6 text-center animate-fade-in-up">
                <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.5)] bg-emerald-500 border-4 border-white text-white">
                    <CheckCircle2 size={64} />
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-2">Table Master!</h2>
                <p className="text-slate-400 font-bold text-xl mb-8">You successfully built the entire Table of {currentTable}!</p>
                
                <div className="flex gap-4">
                    <button onClick={() => setPhase('select')} className="bg-slate-800 text-white px-8 py-4 rounded-xl font-black text-lg shadow-lg hover:bg-slate-700 active:scale-95 transition-all">
                        Build Another
                    </button>
                    <button onClick={onComplete} className="bg-sky-500 text-white px-8 py-4 rounded-xl font-black text-lg shadow-[0_4px_0_rgb(14,165,233)] hover:bg-sky-400 active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2">
                        Complete Lesson <ArrowRight size={20}/>
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: BUILD TABLE PHASE
    // ============================================================================
    const emoji = EMOJI_MAP[currentTable];

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 font-sans md:rounded-3xl overflow-hidden relative selection:bg-sky-500/30">
            
            {/* HEADER */}
            <div className="shrink-0 p-4 bg-slate-800 border-b-4 border-slate-700 shadow-sm flex items-center justify-between z-20">
                <button onClick={() => { playSound('click'); setPhase('select'); }} className="bg-slate-700 p-2 md:px-4 md:py-2 rounded-xl hover:bg-slate-600 transition-colors text-slate-300 font-bold flex items-center gap-1">
                    <ChevronLeft size={20}/> <span className="hidden md:inline">Back</span>
                </button>
                <h1 className="font-black text-xl md:text-3xl text-white tracking-tight flex items-center gap-3">
                    <span className="text-3xl">{emoji}</span> Complete the Table of {currentTable}
                </h1>
                <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* MAIN SCROLLABLE WORKSPACE */}
            <div className="flex-1 overflow-y-auto p-2 md:p-6 bg-slate-900 hide-scrollbar pb-32">
                <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 md:gap-4">
                    
                    {Array.from({length: 10}).map((_, idx) => {
                        const row = idx + 1;
                        const data = inputs[row];
                        const isSolved = data?.isCorrect;

                        return (
                            <div key={row} className={`flex flex-col lg:flex-row gap-2 md:gap-4 w-full p-3 md:p-4 rounded-2xl transition-all duration-500
                                ${isSolved ? 'bg-slate-800/80 border-2 border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : 'bg-slate-800 border-2 border-slate-700 shadow-lg'}`}
                            >
                                {/* Column 1: Visuals (Takes most space) */}
                                <div className="flex-[2] flex flex-wrap gap-2 md:gap-3 items-center min-h-[40px] md:min-h-[60px]">
                                    {/* Number of groups = currentTable, Number of items = row */}
                                    {Array.from({length: currentTable}).map((_, gIdx) => (
                                        <div key={gIdx} className="flex gap-[2px] bg-slate-900/50 p-1 md:p-1.5 rounded-lg border border-slate-700/50 shadow-sm animate-fade-in-up" style={{ animationDelay: `${gIdx * 0.05}s` }}>
                                            {Array.from({length: row}).map((_, iIdx) => (
                                                <span key={iIdx} className="text-base md:text-xl drop-shadow-md">{emoji}</span>
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                {/* Mobile Container for Text & Math (Side-by-Side on small screens) */}
                                <div className="flex flex-row gap-2 md:gap-4 w-full lg:w-auto lg:flex-[1.5]">
                                    
                                    {/* Column 2: Words */}
                                    <div className={`flex-1 flex items-center justify-between lg:justify-center gap-2 bg-slate-900 rounded-xl p-2 md:p-4 border-2 transition-colors ${isSolved ? 'border-emerald-500/30' : 'border-slate-700'}`}>
                                        <span className="text-slate-300 font-black text-sm md:text-lg whitespace-nowrap">
                                            {currentTable} {NUM_WORDS[row]} are
                                        </span>
                                        <input 
                                            type="text" inputMode="numeric" maxLength={3}
                                            value={data?.wordAns || ''}
                                            onChange={(e) => handleInputChange(row, 'wordAns', e.target.value)}
                                            disabled={isSolved && row > 3}
                                            className={`w-12 md:w-16 h-8 md:h-12 text-center font-black text-base md:text-xl rounded-lg outline-none transition-all
                                                ${isSolved ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50' : 'bg-slate-800 text-sky-400 border-2 border-slate-500 focus:border-sky-400 focus:shadow-[0_0_10px_rgba(56,189,248,0.3)]'}`}
                                        />
                                    </div>

                                    {/* Column 3: Math */}
                                    <div className={`flex-1 flex items-center justify-between lg:justify-center gap-2 bg-slate-900 rounded-xl p-2 md:p-4 border-2 transition-colors ${isSolved ? 'border-emerald-500/30' : 'border-slate-700'}`}>
                                        <span className="text-slate-300 font-black text-sm md:text-lg whitespace-nowrap">
                                            {currentTable} <span className="text-sky-400 mx-0.5">×</span> {row} =
                                        </span>
                                        <input 
                                            type="text" inputMode="numeric" maxLength={3}
                                            value={data?.mathAns || ''}
                                            onChange={(e) => handleInputChange(row, 'mathAns', e.target.value)}
                                            disabled={isSolved && row > 3}
                                            className={`w-12 md:w-16 h-8 md:h-12 text-center font-black text-base md:text-xl rounded-lg outline-none transition-all
                                                ${isSolved ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50' : 'bg-slate-800 text-sky-400 border-2 border-slate-500 focus:border-sky-400 focus:shadow-[0_0_10px_rgba(56,189,248,0.3)]'}`}
                                        />
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FLOATING ACTION BUTTON (Appears when all correct) */}
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 transition-all duration-500 ${allCorrect ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                <button 
                    onClick={() => { playSound('magic'); setPhase('finish'); }}
                    className="w-full bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black text-xl tracking-wide shadow-[0_6px_0_rgb(16,185,129)] active:translate-y-[6px] active:shadow-none transition-all flex items-center justify-center gap-3 animate-bounce"
                >
                    <Sparkles /> Table Completed! <ArrowRight />
                </button>
            </div>
            
            {/* Bottom Gradient Fade to show scrolling */}
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-10"></div>
        </div>
    );
}