"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, CheckCircle2, RotateCcw, ArrowRight, Minus, Check, EyeOff, ArrowDownToLine } from 'lucide-react';

// --- Data ---
const FRUITS = [
    { name: 'Apples', emoji: '🍎', bg: 'bg-red-100', border: 'border-red-400' },
    { name: 'Oranges', emoji: '🍊', bg: 'bg-orange-100', border: 'border-orange-400' },
    { name: 'Bananas', emoji: '🍌', bg: 'bg-yellow-100', border: 'border-yellow-400' },
    { name: 'Grapes', emoji: '🍇', bg: 'bg-purple-100', border: 'border-purple-400' },
    { name: 'Strawberries', emoji: '🍓', bg: 'bg-rose-100', border: 'border-rose-400' }
];

export default function CPAAdditionQuiz({ lesson, onComplete }: any) {
    // --- Quiz Generation & State ---
    const [score, setScore] = useState(0);
    const [questionIndex, setQuestionIndex] = useState(1);
    const [questionData, setQuestionData] = useState<any>(null);
    
    // Visibility Toggles
    const [showInteractive, setShowInteractive] = useState(true);
    const [showDraw, setShowDraw] = useState(true);

    // User Inputs: [Row 1, Row 2]
    const initialRowState = { concrete: { t: 0, o: 0 }, pictorial: { t: 0, o: 0 }, abstract: { t: '', o: '' } };
    const [rows, setRows] = useState([ JSON.parse(JSON.stringify(initialRowState)), JSON.parse(JSON.stringify(initialRowState)) ]);
    
    // Bottom Row State
    const [totalMerged, setTotalMerged] = useState(false);
    const [finalAnswer, setFinalAnswer] = useState<string>('');
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

    // --- Audio Engine ---
    const audioCtx = useRef<AudioContext | null>(null);
    const playSound = (type: 'pop' | 'kaching' | 'error' | 'click' | 'whoosh') => {
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
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
            } else if (type === 'kaching') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
            } else if (type === 'error') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
            } else if (type === 'whoosh') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
            }
            
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + (type === 'kaching' ? 0.4 : 0.2));
        } catch(e) {}
    };

    const generateQuestion = () => {
        const a1T = Math.floor(Math.random() * 5) + 1; 
        const a1O = Math.floor(Math.random() * 5) + 1; 
        const a2T = Math.floor(Math.random() * (9 - a1T)) + 1; 
        const a2O = Math.floor(Math.random() * (9 - a1O)) + 1; 
        const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        
        setQuestionData({ a1T, a1O, a2T, a2O, fruit });
        setRows([ JSON.parse(JSON.stringify(initialRowState)), JSON.parse(JSON.stringify(initialRowState)) ]);
        setTotalMerged(false);
        setFinalAnswer('');
        setFeedback('idle');
    };

    const handleGenerateNew = () => {
        setQuestionIndex(prev => prev + 1);
        generateQuestion();
    }

    useEffect(() => {
        if (!questionData) generateQuestion();
    }, [questionData]);

    // --- Interaction Handlers ---
    const handleTap = (rIdx: number, section: 'concrete' | 'pictorial', field: 't' | 'o', increment: number = 1) => {
        if (totalMerged) return; 
        playSound('pop');
        const newRows = [...rows];
        const currentVal = newRows[rIdx][section][field];
        newRows[rIdx][section][field] = Math.max(0, Math.min(9, currentVal + increment));
        setRows(newRows);
    };

    const handleAbstractInput = (rIdx: number, field: 't' | 'o', val: string) => {
        if (totalMerged) return;
        const newRows = [...rows];
        newRows[rIdx].abstract[field] = val.replace(/[^0-9]/g, '').slice(-1);
        setRows(newRows);
    };

    const handleMergeTotals = () => {
        if (!questionData) return;
        const r1 = rows[0]; const r2 = rows[1]; const q = questionData;
        
        // Only validate the sections that are currently VISIBLE
        let isValid = true;

        if (showInteractive) {
            if (r1.concrete.t !== q.a1T || r1.concrete.o !== q.a1O || r2.concrete.t !== q.a2T || r2.concrete.o !== q.a2O) isValid = false;
        }
        if (showDraw) {
            if (r1.pictorial.t !== q.a1T || r1.pictorial.o !== q.a1O || r2.pictorial.t !== q.a2T || r2.pictorial.o !== q.a2O) isValid = false;
        }
        
        // Always validate Abstract since it can't be hidden
        if (Number(r1.abstract.t) !== q.a1T || Number(r1.abstract.o) !== q.a1O || Number(r2.abstract.t) !== q.a2T || Number(r2.abstract.o) !== q.a2O) isValid = false;

        if (!isValid) {
            playSound('error');
            alert("Please build the numbers perfectly in all visible sections before dropping to the total!");
            return;
        }

        playSound('whoosh');
        setTotalMerged(true);
    };

    const handleSubmit = () => {
        if (!questionData || feedback !== 'idle') return;
        const totalTens = questionData.a1T + questionData.a2T;
        const totalOnes = questionData.a1O + questionData.a2O;
        const expectedAnswer = (totalTens * 10) + totalOnes;

        if (Number(finalAnswer) === expectedAnswer) {
            playSound('kaching');
            setFeedback('correct');
            setScore(s => s + 1);
            setTimeout(() => setFeedback('idle'), 2000);
        } else {
            playSound('error');
            setFeedback('wrong');
            setTimeout(() => setFeedback('idle'), 1500);
        }
    };

    if (!questionData) return null;

    // --- Sub-components for UI ---
    const BoxOf10 = ({ fruit }: any) => (
        <div className={`relative ${fruit.bg} rounded border-2 ${fruit.border} p-1 shadow-sm w-8 md:w-12 shrink-0 flex flex-col items-center pointer-events-none`}>
            <div className="absolute -top-2 md:-top-2.5 bg-black/60 text-white text-[5px] md:text-[7px] font-black uppercase px-1 rounded z-10">10</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-0.5 w-full mt-1.5 md:mt-2">
                {Array.from({length:10}).map((_, i) => <div key={i} className="text-[6px] md:text-[8px] flex items-center justify-center">{fruit.emoji}</div>)}
            </div>
        </div>
    );
  
    const LooseItem = ({ fruit }: any) => (
        <div className="w-5 h-5 md:w-6 md:h-6 bg-white/80 rounded border border-slate-300 flex items-center justify-center shadow-sm pointer-events-none">
            <span className="text-[10px] md:text-sm drop-shadow-sm">{fruit.emoji}</span>
        </div>
    );

    const PictorialTen = () => <div className="w-1.5 h-6 md:w-2 md:h-10 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>;
    const PictorialOne = () => <div className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>;

    const MinusBtn = ({ onClick }: any) => (
        <button onClick={onClick} className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-500 hover:bg-red-400 text-white p-1 rounded-full shadow-md z-10">
            <Minus size={12} className="md:w-4 md:h-4" />
        </button>
    );

    // Dynamic Grid Layout calculations
    const intCols = showInteractive ? 'minmax(90px, 1fr) minmax(90px, 1fr)' : '40px';
    const drawCols = showDraw ? 'minmax(90px, 1fr) minmax(90px, 1fr)' : '40px';
    const numCols = 'minmax(90px, 1fr) minmax(90px, 1fr)';

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 font-sans md:rounded-3xl overflow-hidden relative">
            
            {/* Header */}
            <div className="shrink-0 p-3 md:p-4 flex items-center justify-between text-white bg-slate-800 border-b-2 border-slate-700 shadow-sm z-20">
                <button className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"><ChevronLeft size={20}/></button>
                <div className="font-black tracking-widest text-lg md:text-xl">
                    Add: <span className="text-teal-400">{questionData.a1T}{questionData.a1O}</span> + <span className="text-lime-400">{questionData.a2T}{questionData.a2O}</span>
                </div>
                <div className="w-10 h-10"></div> {/* Spacer for centering */}
            </div>

            {/* Feedback Overlay */}
            {feedback !== 'idle' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in pointer-events-none">
                    <div className={`w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-2xl animate-bounce ${feedback === 'correct' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {feedback === 'correct' ? <Check size={64}/> : <RotateCcw size={64}/>}
                    </div>
                </div>
            )}

            {/* Main CPA Table - Horizontal Scroll for Mobile */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto p-4 md:p-6 bg-slate-900 hide-scrollbar">
                
                <div className="min-w-[600px] max-w-6xl mx-auto border-4 border-slate-700 rounded-[2rem] overflow-hidden grid shadow-2xl bg-slate-800"
                     style={{ gridTemplateColumns: `${intCols} ${drawCols} ${numCols}` }}>
                    
                    {/* --- ROW 1: HEADERS --- */}
                    {showInteractive ? (
                        <div className="col-span-2 py-4 border-b-4 border-r-4 border-slate-700 bg-slate-900 flex flex-col items-center relative group">
                            <h3 className="text-sm md:text-xl font-black text-white uppercase tracking-widest">Interactive</h3>
                            <p className="text-[10px] md:text-xs text-slate-400 font-bold">Concrete Objects</p>
                            <button onClick={() => setShowInteractive(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors" title="Hide Interactive"><EyeOff size={16}/></button>
                        </div>
                    ) : (
                        <div className="row-span-5 border-r-4 border-slate-700 bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-700 group transition-colors" onClick={() => setShowInteractive(true)}>
                            <span className="[writing-mode:vertical-lr] text-slate-400 group-hover:text-white font-black tracking-widest uppercase rotate-180 text-xs md:text-sm">Show Interactive</span>
                        </div>
                    )}

                    {showDraw ? (
                        <div className="col-span-2 py-4 border-b-4 border-r-4 border-slate-700 bg-slate-900 flex flex-col items-center relative group">
                            <h3 className="text-sm md:text-xl font-black text-white uppercase tracking-widest">Draw</h3>
                            <p className="text-[10px] md:text-xs text-slate-400 font-bold">Pictorial Tallies</p>
                            <button onClick={() => setShowDraw(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors" title="Hide Draw"><EyeOff size={16}/></button>
                        </div>
                    ) : (
                        <div className="row-span-5 border-r-4 border-slate-700 bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-700 group transition-colors" onClick={() => setShowDraw(true)}>
                            <span className="[writing-mode:vertical-lr] text-slate-400 group-hover:text-white font-black tracking-widest uppercase rotate-180 text-xs md:text-sm">Show Draw</span>
                        </div>
                    )}

                    <div className="col-span-2 py-4 border-b-4 border-slate-700 bg-slate-900 flex flex-col items-center">
                        <h3 className="text-sm md:text-xl font-black text-white uppercase tracking-widest">Numbers</h3>
                        <p className="text-[10px] md:text-xs text-slate-400 font-bold">Abstract Digits</p>
                    </div>

                    {/* --- ROW 2: SUB-HEADERS (Tens/Ones) --- */}
                    {showInteractive && (
                        <>
                            <div className="py-2 border-b-4 border-r border-slate-700 bg-slate-800/80 text-center text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Tens</div>
                            <div className="py-2 border-b-4 border-r-4 border-slate-700 bg-slate-800/80 text-center text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Ones</div>
                        </>
                    )}
                    {showDraw && (
                        <>
                            <div className="py-2 border-b-4 border-r border-slate-700 bg-slate-800/80 text-center text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Tens</div>
                            <div className="py-2 border-b-4 border-r-4 border-slate-700 bg-slate-800/80 text-center text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Ones</div>
                        </>
                    )}
                    <div className="py-2 border-b-4 border-r border-slate-700 bg-slate-800/80 text-center text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Tens</div>
                    <div className="py-2 border-b-4 border-slate-700 bg-slate-800/80 text-center text-xs md:text-sm font-black uppercase tracking-widest text-slate-300">Ones</div>

                    {/* --- ROW 3: ADDEND 1 (TEAL) --- */}
                    {showInteractive && (
                        <>
                            <div className="relative p-2 md:p-4 border-b-2 border-r border-teal-600 bg-teal-500/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-teal-500/30 transition-colors min-h-[100px]" onClick={() => handleTap(0, 'concrete', 't')}>
                                {rows[0].concrete.t === 0 ? <span className="text-[10px] md:text-xs opacity-50 uppercase font-black text-teal-100 text-center">+ Add Box</span> : 
                                <><div className="flex flex-wrap gap-1 justify-center pointer-events-none">{Array.from({length: rows[0].concrete.t}).map((_, i) => <BoxOf10 key={i} fruit={questionData.fruit}/>)}</div><MinusBtn onClick={(e: any) => { e.stopPropagation(); handleTap(0, 'concrete', 't', -1); }}/></>}
                            </div>
                            <div className="relative p-2 md:p-4 border-b-2 border-r-4 border-teal-600 bg-teal-500/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-teal-500/30 transition-colors min-h-[100px]" onClick={() => handleTap(0, 'concrete', 'o')}>
                                {rows[0].concrete.o === 0 ? <span className="text-[10px] md:text-xs opacity-50 uppercase font-black text-teal-100 text-center">+ Add Item</span> : 
                                <><div className="flex flex-wrap gap-1 justify-center pointer-events-none">{Array.from({length: rows[0].concrete.o}).map((_, i) => <LooseItem key={i} fruit={questionData.fruit}/>)}</div><MinusBtn onClick={(e: any) => { e.stopPropagation(); handleTap(0, 'concrete', 'o', -1); }}/></>}
                            </div>
                        </>
                    )}
                    {showDraw && (
                        <>
                            <div className="relative p-2 md:p-4 border-b-2 border-r border-teal-600 bg-teal-500/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-teal-500/30 transition-colors min-h-[100px]" onClick={() => handleTap(0, 'pictorial', 't')}>
                                {rows[0].pictorial.t === 0 ? <span className="text-[10px] md:text-xs opacity-50 uppercase font-black text-teal-100 text-center">+ Draw Stick</span> : 
                                <><div className="flex flex-wrap gap-2 justify-center pointer-events-none">{Array.from({length: rows[0].pictorial.t}).map((_, i) => <PictorialTen key={i}/>)}</div><MinusBtn onClick={(e: any) => { e.stopPropagation(); handleTap(0, 'pictorial', 't', -1); }}/></>}
                            </div>
                            <div className="relative p-2 md:p-4 border-b-2 border-r-4 border-teal-600 bg-teal-500/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-teal-500/30 transition-colors min-h-[100px]" onClick={() => handleTap(0, 'pictorial', 'o')}>
                                {rows[0].pictorial.o === 0 ? <span className="text-[10px] md:text-xs opacity-50 uppercase font-black text-teal-100 text-center">+ Draw Dot</span> : 
                                <><div className="flex flex-wrap gap-2 justify-center pointer-events-none max-w-[60px]">{Array.from({length: rows[0].pictorial.o}).map((_, i) => <PictorialOne key={i}/>)}</div><MinusBtn onClick={(e: any) => { e.stopPropagation(); handleTap(0, 'pictorial', 'o', -1); }}/></>}
                            </div>
                        </>
                    )}
                    <div className="p-2 border-b-2 border-r border-teal-600 bg-teal-500/20 flex items-center justify-center min-h-[100px]">
                        <input type="text" inputMode="numeric" disabled={totalMerged} value={rows[0].abstract.t} onChange={e => handleAbstractInput(0, 't', e.target.value)} placeholder="-" className="w-12 h-16 md:w-16 md:h-20 bg-black/20 text-white text-center text-3xl md:text-5xl font-black rounded-xl outline-none focus:ring-2 ring-white transition-all disabled:opacity-50"/>
                    </div>
                    <div className="p-2 border-b-2 border-teal-600 bg-teal-500/20 flex items-center justify-center min-h-[100px]">
                        <input type="text" inputMode="numeric" disabled={totalMerged} value={rows[0].abstract.o} onChange={e => handleAbstractInput(0, 'o', e.target.value)} placeholder="-" className="w-12 h-16 md:w-16 md:h-20 bg-black/20 text-white text-center text-3xl md:text-5xl font-black rounded-xl outline-none focus:ring-2 ring-white transition-all disabled:opacity-50"/>
                    </div>

                    {/* --- ROW 4: ADDEND 2 (LIME) --- */}
                    {showInteractive && (
                        <>
                            <div className="relative p-2 md:p-4 border-b-4 border-r border-slate-700 bg-lime-500/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-lime-500/30 transition-colors min-h-[100px]" onClick={() => handleTap(1, 'concrete', 't')}>
                                {rows[1].concrete.t === 0 ? <span className="text-[10px] md:text-xs opacity-50 uppercase font-black text-lime-100 text-center">+ Add Box</span> : 
                                <><div className="flex flex-wrap gap-1 justify-center pointer-events-none">{Array.from({length: rows[1].concrete.t}).map((_, i) => <BoxOf10 key={i} fruit={questionData.fruit}/>)}</div><MinusBtn onClick={(e: any) => { e.stopPropagation(); handleTap(1, 'concrete', 't', -1); }}/></>}
                            </div>
                            <div className="relative p-2 md:p-4 border-b-4 border-r-4 border-slate-700 bg-lime-500/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-lime-500/30 transition-colors min-h-[100px]" onClick={() => handleTap(1, 'concrete', 'o')}>
                                {rows[1].concrete.o === 0 ? <span className="text-[10px] md:text-xs opacity-50 uppercase font-black text-lime-100 text-center">+ Add Item</span> : 
                                <><div className="flex flex-wrap gap-1 justify-center pointer-events-none">{Array.from({length: rows[1].concrete.o}).map((_, i) => <LooseItem key={i} fruit={questionData.fruit}/>)}</div><MinusBtn onClick={(e: any) => { e.stopPropagation(); handleTap(1, 'concrete', 'o', -1); }}/></>}
                            </div>
                        </>
                    )}
                    {showDraw && (
                        <>
                            <div className="relative p-2 md:p-4 border-b-4 border-r border-slate-700 bg-lime-500/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-lime-500/30 transition-colors min-h-[100px]" onClick={() => handleTap(1, 'pictorial', 't')}>
                                {rows[1].pictorial.t === 0 ? <span className="text-[10px] md:text-xs opacity-50 uppercase font-black text-lime-100 text-center">+ Draw Stick</span> : 
                                <><div className="flex flex-wrap gap-2 justify-center pointer-events-none">{Array.from({length: rows[1].pictorial.t}).map((_, i) => <PictorialTen key={i}/>)}</div><MinusBtn onClick={(e: any) => { e.stopPropagation(); handleTap(1, 'pictorial', 't', -1); }}/></>}
                            </div>
                            <div className="relative p-2 md:p-4 border-b-4 border-r-4 border-slate-700 bg-lime-500/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-lime-500/30 transition-colors min-h-[100px]" onClick={() => handleTap(1, 'pictorial', 'o')}>
                                {rows[1].pictorial.o === 0 ? <span className="text-[10px] md:text-xs opacity-50 uppercase font-black text-lime-100 text-center">+ Draw Dot</span> : 
                                <><div className="flex flex-wrap gap-2 justify-center pointer-events-none max-w-[60px]">{Array.from({length: rows[1].pictorial.o}).map((_, i) => <PictorialOne key={i}/>)}</div><MinusBtn onClick={(e: any) => { e.stopPropagation(); handleTap(1, 'pictorial', 'o', -1); }}/></>}
                            </div>
                        </>
                    )}
                    <div className="p-2 border-b-4 border-r border-slate-700 bg-lime-500/20 flex items-center justify-center min-h-[100px]">
                        <input type="text" inputMode="numeric" disabled={totalMerged} value={rows[1].abstract.t} onChange={e => handleAbstractInput(1, 't', e.target.value)} placeholder="-" className="w-12 h-16 md:w-16 md:h-20 bg-black/20 text-lime-400 text-center text-3xl md:text-5xl font-black rounded-xl outline-none focus:ring-2 ring-lime-400 transition-all disabled:opacity-50"/>
                    </div>
                    <div className="p-2 border-b-4 border-slate-700 bg-lime-500/20 flex items-center justify-center min-h-[100px]">
                        <input type="text" inputMode="numeric" disabled={totalMerged} value={rows[1].abstract.o} onChange={e => handleAbstractInput(1, 'o', e.target.value)} placeholder="-" className="w-12 h-16 md:w-16 md:h-20 bg-black/20 text-lime-400 text-center text-3xl md:text-5xl font-black rounded-xl outline-none focus:ring-2 ring-lime-400 transition-all disabled:opacity-50"/>
                    </div>

                    {/* --- ROW 5: TOTAL (PURPLE) --- */}
                    {showInteractive && (
                        <div className="col-span-2 p-2 md:p-4 border-r-4 border-purple-600 bg-purple-600/20 flex items-center justify-center relative min-h-[120px]">
                            {!totalMerged ? (
                                <button onClick={handleMergeTotals} className="border-2 border-purple-500/50 text-purple-200 px-4 md:px-6 py-2 md:py-3 rounded-xl font-black uppercase text-xs md:text-sm hover:bg-purple-500/30 transition-all flex items-center gap-2 shadow-sm">
                                    <ArrowDownToLine size={18}/> Drop & Merge
                                </button>
                            ) : (
                                <div className="flex gap-2 md:gap-4 w-full animate-fade-in-up items-start justify-center">
                                    <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
                                        {Array.from({length: questionData.a1T + questionData.a2T}).map((_, i) => <BoxOf10 key={`tot-c-t-${i}`} fruit={questionData.fruit}/>)}
                                    </div>
                                    <div className="w-0.5 bg-purple-500/30 rounded-full h-12 md:h-16"></div>
                                    <div className="flex flex-wrap gap-1 justify-center max-w-[100px]">
                                        {Array.from({length: questionData.a1O + questionData.a2O}).map((_, i) => <LooseItem key={`tot-c-o-${i}`} fruit={questionData.fruit}/>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {showDraw && (
                        <div className="col-span-2 p-2 md:p-4 border-r-4 border-purple-600 bg-purple-600/20 flex items-center justify-center relative min-h-[120px]">
                            {!totalMerged ? (
                                <button onClick={handleMergeTotals} className="border-2 border-purple-500/50 text-purple-200 px-4 md:px-6 py-2 md:py-3 rounded-xl font-black uppercase text-xs md:text-sm hover:bg-purple-500/30 transition-all flex items-center gap-2 shadow-sm">
                                    <ArrowDownToLine size={18}/> Drop & Merge
                                </button>
                            ) : (
                                <div className="flex gap-2 md:gap-4 w-full animate-fade-in-up items-start justify-center">
                                    <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center max-w-[100px]">
                                        {Array.from({length: questionData.a1T + questionData.a2T}).map((_, i) => <PictorialTen key={`tot-p-t-${i}`}/>)}
                                    </div>
                                    <div className="w-0.5 bg-purple-500/30 rounded-full h-12 md:h-16"></div>
                                    <div className="flex flex-wrap gap-1.5 justify-center max-w-[80px]">
                                        {Array.from({length: questionData.a1O + questionData.a2O}).map((_, i) => <PictorialOne key={`tot-p-o-${i}`}/>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="col-span-2 p-4 md:p-6 flex flex-col items-center justify-center bg-purple-900/40 min-h-[120px]">
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-purple-300 mb-2">Final Answer</span>
                        <input 
                            type="number" 
                            disabled={!totalMerged}
                            value={finalAnswer}
                            onChange={e => setFinalAnswer(e.target.value)}
                            placeholder="?"
                            className="w-24 md:w-32 bg-purple-950 border-4 border-purple-400 rounded-2xl px-2 py-2 md:py-4 font-black text-center text-3xl md:text-4xl text-white outline-none focus:border-purple-300 shadow-inner disabled:opacity-30 disabled:border-purple-800 transition-all" 
                        />
                    </div>

                </div>
            </div>

            {/* Footer Control Panel */}
            <div className="shrink-0 p-4 md:p-5 border-t-2 border-slate-700 bg-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-4 text-white font-black text-sm md:text-base w-full sm:w-auto justify-center">
                    <span className="bg-slate-700/80 border border-slate-600 px-4 py-2 rounded-xl">Question {questionIndex}</span>
                    <span className="text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 rounded-xl">Score: {score}</span>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                    <button 
                        onClick={handleGenerateNew} 
                        className="bg-slate-600 text-white px-4 md:px-6 py-3 rounded-xl font-black text-xs md:text-sm tracking-wide hover:bg-slate-500 transition-all shadow-md active:translate-y-1 active:shadow-none"
                    >
                        New Question
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!totalMerged || finalAnswer === ''}
                        className="bg-purple-500 text-white px-6 md:px-8 py-3 rounded-xl font-black text-xs md:text-sm tracking-wide flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 hover:bg-purple-400 shadow-[0_4px_0_rgb(126,34,206)] active:translate-y-[4px] active:shadow-none"
                    >
                        Submit <span className="hidden md:inline">Answer</span> <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}