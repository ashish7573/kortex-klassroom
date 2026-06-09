"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, ChevronLeft, ArrowRight, RotateCcw, LayoutGrid, Activity, Hash, Plus, Check, X as XIcon } from 'lucide-react';

type QuizCategory = 'grid' | 'ginladi' | 'match' | 'skip' | 'make100' | 'logic';

const CATEGORIES: { id: QuizCategory, title: string, icon: any, color: string, border: string }[] = [
    { id: 'grid', title: 'The Grid Cross', icon: LayoutGrid, color: 'bg-purple-500', border: 'border-purple-600' },
    { id: 'ginladi', title: 'The Ginladi', icon: Activity, color: 'bg-sky-500', border: 'border-sky-600' },
    { id: 'match', title: 'Count & Match', icon: Play, color: 'bg-amber-500', border: 'border-amber-600' },
    { id: 'skip', title: 'Skip Patterns', icon: ArrowRight, color: 'bg-emerald-500', border: 'border-emerald-600' },
    { id: 'make100', title: 'Making 100', icon: Plus, color: 'bg-pink-500', border: 'border-pink-600' },
    { id: 'logic', title: 'Number Logic', icon: Hash, color: 'bg-indigo-500', border: 'border-indigo-600' }
];

// --- Vocabulary Helpers for Ginladi Audio ---
const TENS_W = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety", "One Hundred"];
const ONES_W = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

const getNumWord = (n: number) => {
    if (n === 100) return "One Hundred";
    if (n < 20) return ONES_W[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${TENS_W[t]}${o > 0 ? ' ' + ONES_W[o] : ''}`;
};

export default function MasterQuizUptoHundred({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<'menu' | 'playing' | 'result'>('menu');
    const [activeCategory, setActiveCategory] = useState<QuizCategory | null>(null);
    const [completedCategories, setCompletedCategories] = useState<QuizCategory[]>([]);
    
    // Quiz State
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [questionData, setQuestionData] = useState<any>(null);
    const [inputValue, setInputValue] = useState<any>('');
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

    // --- Audio Engine ---
    const audioCtx = useRef<AudioContext | null>(null);
    
    const playSound = (type: 'pop' | 'kaching' | 'error' | 'click') => {
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
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'kaching') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.4);
            } else if (type === 'error') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.2);
            }
        } catch(e) {}
    };

    const speakGinladi = (text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
                resolve(); return;
            }
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-IN';
            utterance.rate = 1.0; 
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    };

    // --- Progression Helper ---
    const proceedToNext = (wasCorrect = true) => {
        if (questionIndex < 4) { // 5 questions total
            setQuestionIndex(prev => prev + 1);
            generateQuestion(activeCategory as QuizCategory);
        } else {
            if (wasCorrect || score >= 2) {
                if (activeCategory && !completedCategories.includes(activeCategory)) {
                    setCompletedCategories([...completedCategories, activeCategory]);
                }
            }
            setPhase('result');
        }
    };

    // --- Question Generators ---
    const generateQuestion = (cat: QuizCategory) => {
        setFeedback('idle');
        
        if (cat === 'grid') {
            // Generate an array of 3 Grids for simultaneous display
            const grids = [];
            for (let i = 0; i < 3; i++) {
                const isValidCenter = (c: number) => c >= 12 && c <= 89 && c % 10 !== 0 && c % 10 !== 1;
                let center = 0;
                while (!isValidCenter(center)) center = Math.floor(Math.random() * 100) + 1;
                
                grids.push({
                    id: i, center,
                    type: i === 2 ? 'full' : 'cross', // 3rd grid is the harder 'full' version
                    top: center - 10, bottom: center + 10, left: center - 1, right: center + 1,
                    tl: center - 11, tr: center - 9, bl: center + 9, br: center + 11
                });
            }
            setQuestionData(grids);
            setInputValue([{}, {}, {}]); // Store input objects for all 3 grids
        } 
        else if (cat === 'ginladi') {
            const target = Math.floor(Math.random() * 98) + 2;
            setQuestionData({ target });
            setInputValue(null);
        }
        else if (cat === 'match') {
            const tens = Math.floor(Math.random() * 9) + 1;
            const ones = Math.floor(Math.random() * 9) + 1;
            setQuestionData({ tens, ones, answer: (tens * 10) + ones });
            setInputValue('');
        }
        else if (cat === 'skip') {
            const steps = [2, 3, 5, 10];
            const step = steps[Math.floor(Math.random() * steps.length)];
            const maxStart = 100 - (step * 4);
            const start = Math.floor(Math.random() * maxStart) + 1;
            const seq = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
            const blankIdx = Math.floor(Math.random() * 5);
            setQuestionData({ seq, blankIdx, answer: seq[blankIdx], step });
            setInputValue('');
        }
        else if (cat === 'make100') {
            const part1 = (Math.floor(Math.random() * 9) + 1) * 10;
            setQuestionData({ part1, answer: 100 - part1 });
            setInputValue('');
        }
        else if (cat === 'logic') {
            const types = ['less', 'more', 'between'];
            const type = types[Math.floor(Math.random() * types.length)];
            const base = Math.floor(Math.random() * 70) + 15;
            if (type === 'less') setQuestionData({ type, base, text: `What is 10 less than ${base}?`, answer: base - 10 });
            else if (type === 'more') setQuestionData({ type, base, text: `What is 10 more than ${base}?`, answer: base + 10 });
            else setQuestionData({ type, base, text: `What comes exactly between ${base} and ${base + 2}?`, answer: base + 1 });
            setInputValue('');
        }
    };

    const handleStartCategory = (cat: QuizCategory) => {
        setActiveCategory(cat);
        setQuestionIndex(0);
        setScore(0);
        generateQuestion(cat);
        setPhase('playing');
        playSound('pop');
    };

    // Standard Submission (For skip, match, logic, make100)
    const handleSubmit = () => {
        if (feedback !== 'idle') return; 
        
        const q = questionData;
        const isCorrect = Number(inputValue) === q.answer;

        if (isCorrect) {
            playSound('kaching');
            setFeedback('correct');
            setScore(s => s + 1);
        } else {
            playSound('error');
            setFeedback('wrong');
        }

        setTimeout(() => proceedToNext(isCorrect), 1500);
    };

    // --- GRID CROSS HELPERS ---
    const isGridFullyCorrect = () => {
        if (!questionData || !inputValue || activeCategory !== 'grid') return false;
        return questionData.every((q: any, idx: number) => {
            const fields = q.type === 'full' ? ['top', 'bottom', 'left', 'right', 'tl', 'tr', 'bl', 'br'] : ['top', 'bottom', 'left', 'right'];
            return fields.every(f => {
                const valStr = inputValue[idx]?.[f];
                return valStr !== undefined && valStr !== '' && Number(valStr) === q[f];
            });
        });
    };

    const renderGridCell = (gridIdx: number, field: string, isFull: boolean) => {
        if (!isFull && ['tl', 'tr', 'bl', 'br'].includes(field)) return <div />;
        
        const q = questionData[gridIdx];
        const expected = q[field];
        const valStr = inputValue[gridIdx]?.[field] || '';
        const isCorrect = valStr !== '' && Number(valStr) === expected;
        const isWrong = valStr !== '' && Number(valStr) !== expected;

        let boxClass = "w-full aspect-square rounded-lg md:rounded-xl text-center font-black text-sm md:text-xl outline-none shadow-sm transition-colors border-2 ";
        if (isCorrect) boxClass += "bg-emerald-100 border-emerald-400 text-emerald-700";
        else if (isWrong) boxClass += "bg-rose-100 border-rose-400 text-rose-700";
        else boxClass += "bg-sky-50 border-sky-200 text-sky-700 focus:border-sky-500";

        return (
            <input
                type="number"
                value={valStr}
                onChange={e => {
                    const newInputs = [...inputValue];
                    newInputs[gridIdx] = { ...newInputs[gridIdx], [field]: e.target.value };
                    setInputValue(newInputs);
                }}
                className={boxClass}
            />
        );
    };

    // --- GINLADI HELPERS ---
    const isGinladiAnimating = useRef(false);

    const handleGinladiClick = async (num: number) => {
        if (feedback !== 'idle' || isGinladiAnimating.current) return;
        isGinladiAnimating.current = true;
        
        const tens = Math.floor(num / 10);
        const remainder = num % 10;
        
        // 1. Highlight & Speak the tens groups (Jumps by 10)
        for (let i = 1; i <= tens; i++) {
            setInputValue(i * 10); 
            await speakGinladi(getNumWord(i * 10)); // e.g., "Ten", "Twenty"
        }
        
        // 2. Highlight & Speak the ones (Pops individually)
        if (remainder > 0) {
            for (let i = 1; i <= remainder; i++) {
                const currentNum = (tens * 10) + i;
                setInputValue(currentNum); 
                await speakGinladi(getNumWord(currentNum)); // e.g., "Twenty-one"
            }
        }
        
        // 3. Final Check
        if (num === questionData.target) {
            playSound('kaching');
            setFeedback('correct');
            setScore(s => s + 1);
            isGinladiAnimating.current = false;
            setTimeout(() => proceedToNext(true), 1500);
        } else {
            playSound('error');
            setFeedback('wrong');
            await speakGinladi("Try again");
            setTimeout(() => {
                setInputValue(null); // Resets string (flips it back)
                setFeedback('idle');
                isGinladiAnimating.current = false;
            }, 1000);
        }
    };


    // ============================================================================
    // RENDER: MENU
    // ============================================================================
    if (phase === 'menu') {
        const isAllComplete = completedCategories.length === CATEGORIES.length;

        return (
            <div className="w-full h-full flex flex-col bg-slate-50 font-sans md:rounded-3xl overflow-hidden p-4 md:p-6 min-h-[500px]">
                <div className="text-center mb-6 shrink-0">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Mastery Dojos</h1>
                    <p className="text-slate-500 font-medium md:text-lg">Earn a star in all 6 challenges to prove your mastery of 1-100!</p>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto pb-6">
                        {CATEGORIES.map(cat => {
                            const isComplete = completedCategories.includes(cat.id);
                            return (
                                <button 
                                    key={cat.id}
                                    onClick={() => handleStartCategory(cat.id)}
                                    className={`relative p-4 md:p-6 rounded-[1.5rem] border-b-[6px] shadow-sm flex flex-col items-center justify-center gap-3 transition-all active:translate-y-[6px] active:border-b-[0px]
                                        ${isComplete ? 'bg-slate-200 border-slate-300 opacity-60' : `${cat.color} ${cat.border} hover:brightness-110`}`}
                                >
                                    {isComplete && <div className="absolute top-2 right-2"><CheckCircle2 className="text-emerald-500 fill-white" size={24}/></div>}
                                    <cat.icon size={40} className="text-white drop-shadow-md" />
                                    <span className="font-black text-white text-sm md:text-lg text-center leading-tight drop-shadow-sm">{cat.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {isAllComplete && (
                    <div className="shrink-0 pt-4 animate-fade-in-up">
                        <button onClick={onComplete} className="w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-lime-500 hover:bg-lime-400 text-lime-950 font-black text-xl py-4 rounded-2xl shadow-[0_6px_0_rgb(101,163,13)] active:translate-y-[6px] active:shadow-none transition-all">
                            Complete Lesson <CheckCircle2 />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ============================================================================
    // RENDER: PLAYING
    // ============================================================================
    if (phase === 'playing' && questionData) {
        const catInfo = CATEGORIES.find(c => c.id === activeCategory);
        // We hide the standard submit button for the upgraded auto-validating games
        const hideStandardSubmit = activeCategory === 'grid' || activeCategory === 'ginladi';
        
        return (
            <div className="w-full h-full flex flex-col bg-white font-sans md:rounded-3xl overflow-hidden">
                {/* Header */}
                <div className={`shrink-0 p-3 flex items-center justify-between text-white shadow-sm ${catInfo?.color}`}>
                    <button onClick={() => setPhase('menu')} className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"><ChevronLeft size={20}/></button>
                    <div className="font-black tracking-widest uppercase text-sm">{catInfo?.title} • {questionIndex + 1}/5</div>
                    <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full font-black">{score}</div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
                    
                    {/* FEEDBACK OVERLAY (For Standard Categories only) */}
                    {!hideStandardSubmit && feedback !== 'idle' && (
                        <div className={`absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in`}>
                            <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl animate-bounce ${feedback === 'correct' ? 'bg-lime-400 text-lime-900' : 'bg-rose-400 text-rose-900'}`}>
                                {feedback === 'correct' ? <Check size={64}/> : <XIcon size={64}/>}
                            </div>
                        </div>
                    )}

                    {/* --- CATEGORY: GRID CROSS (Upgraded to 3 Grids) --- */}
                    {activeCategory === 'grid' && (
                        <div className="flex flex-col items-center w-full h-full">
                            <p className="text-slate-500 font-bold mb-4 text-center">Fill all the green boxes to unlock the next challenge!</p>
                            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full max-w-5xl mx-auto overflow-y-auto pb-6">
                                {questionData.map((q: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 p-3 md:p-5 rounded-3xl border-4 border-slate-100 shadow-sm shrink-0 w-full lg:w-auto">
                                        <div className="grid grid-cols-3 grid-rows-3 gap-1 md:gap-2 w-48 md:w-64 mx-auto">
                                            {renderGridCell(idx, 'tl', q.type === 'full')}
                                            {renderGridCell(idx, 'top', true)}
                                            {renderGridCell(idx, 'tr', q.type === 'full')}

                                            {renderGridCell(idx, 'left', true)}
                                            <div className="w-full aspect-square bg-amber-400 rounded-lg md:rounded-xl flex items-center justify-center font-black text-2xl md:text-4xl text-amber-950 shadow-inner">{q.center}</div>
                                            {renderGridCell(idx, 'right', true)}

                                            {renderGridCell(idx, 'bl', q.type === 'full')}
                                            {renderGridCell(idx, 'bottom', true)}
                                            {renderGridCell(idx, 'br', q.type === 'full')}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Auto-Trigger Next Button */}
                            {isGridFullyCorrect() && (
                                <div className="shrink-0 mt-2 mb-4 animate-fade-in-up">
                                    <button onClick={() => {
                                        playSound('kaching');
                                        setScore(s => s + 1);
                                        proceedToNext(true);
                                    }} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-lg flex items-center gap-2 shadow-lg hover:bg-emerald-400 active:scale-95 transition-all">
                                        Great! Next Challenge <ArrowRight />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- CATEGORY: GINLADI (Upgraded Serpentine Snake) --- */}
                    {activeCategory === 'ginladi' && (
                        <div className="flex flex-col items-center w-full max-w-4xl h-full pb-6">
                            <div className="shrink-0 bg-slate-800 text-white px-6 py-3 rounded-full font-black text-lg md:text-xl mb-4 shadow-md border-4 border-slate-700 animate-pulse">
                                Find Bead: <span className="text-amber-400 text-2xl md:text-3xl">{questionData.target}</span>
                            </div>
                            
                            {/* Serpentine Bead Layout */}
                            <div className="flex-1 w-full bg-slate-100 p-4 md:p-6 lg:p-8 rounded-[2rem] border-4 border-slate-200 overflow-y-auto hide-scrollbar">
                                <div className="flex flex-col gap-y-6 w-full relative">
                                    {Array.from({length: 10}).map((_, r) => {
                                        const isReverse = r % 2 !== 0; // Snake layout: Left-to-Right, then Right-to-Left
                                        return (
                                            <div key={r} className={`flex ${isReverse ? 'flex-row-reverse' : 'flex-row'} justify-between items-center relative w-full h-8 md:h-12`}>
                                                
                                                {/* Background String - Horizontal */}
                                                <div className="absolute top-1/2 left-2 md:left-4 right-2 md:right-4 h-1 md:h-1.5 bg-slate-300 -translate-y-1/2 z-0 rounded-full"></div>
                                                
                                                {/* Background String - Curved U-Turn connecting to next row */}
                                                {r < 9 && (
                                                    <div className={`absolute top-1/2 w-6 sm:w-8 md:w-10 h-[calc(100%+1.5rem)] md:h-[calc(100%+1.5rem)] border-slate-300 border-[4px] md:border-[6px] z-0
                                                        ${!isReverse ? '-right-1 sm:right-0 md:right-1 border-l-0 rounded-r-full' : '-left-1 sm:left-0 md:left-1 border-r-0 rounded-l-full'}`} 
                                                    />
                                                )}
                                                
                                                {/* Beads */}
                                                {Array.from({length: 10}).map((_, c) => {
                                                    const num = r * 10 + c + 1;
                                                    const isRedGroup = Math.floor((num - 1) / 10) % 2 === 0;
                                                    
                                                    // Reveal logic: Show highlighting up to the currently animated bead
                                                    const isRevealed = inputValue !== null && num <= inputValue;
                                                    
                                                    let beadClass = "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border-[3px] md:border-4 z-10 transition-all duration-300 flex items-center justify-center shadow-md relative ";
                                                    
                                                    if (isRevealed && feedback === 'correct') {
                                                        beadClass += "bg-emerald-500 border-emerald-300 scale-125 shadow-emerald-500/50";
                                                    } else if (isRevealed && feedback === 'wrong') {
                                                        beadClass += "bg-rose-600 border-rose-400";
                                                    } else if (isRevealed && feedback === 'idle') {
                                                        beadClass += "bg-amber-400 border-amber-200 scale-125 shadow-amber-500/50"; // Highlight color during counting animation
                                                    } else {
                                                        beadClass += isRedGroup ? "bg-rose-500 hover:bg-rose-400 border-rose-700" : "bg-white hover:bg-slate-50 border-slate-300";
                                                    }

                                                    return (
                                                        <button 
                                                            key={num}
                                                            onClick={() => handleGinladiClick(num)}
                                                            className={beadClass}
                                                            disabled={isGinladiAnimating.current}
                                                        >
                                                            {isRevealed && <span className="text-[10px] md:text-sm font-black text-amber-900">{num}</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- CATEGORY: COUNT MATCH --- */}
                    {activeCategory === 'match' && (
                        <div className="flex flex-col items-center w-full max-w-2xl">
                            <p className="text-slate-500 font-bold mb-4 text-center">Count the boxes and loose apples!</p>
                            <div className="bg-sky-50 p-4 md:p-6 rounded-[2rem] border-4 border-sky-100 flex flex-wrap justify-center gap-4 mb-6 w-full">
                                {Array.from({length: questionData.tens}).map((_, i) => (
                                    <div key={`box-${i}`} className="bg-amber-100 rounded-lg border-[3px] border-amber-500 p-1 shadow-sm flex flex-col items-center shrink-0">
                                        <div className="bg-amber-500 text-white text-[8px] font-black px-1 rounded mb-1">10</div>
                                        <div className="grid grid-cols-5 gap-0.5">
                                            {Array.from({length: 10}).map((_, j) => <div key={j} className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-[2px] border border-amber-200 flex items-center justify-center"><span className="text-[8px]">🍎</span></div>)}
                                        </div>
                                    </div>
                                ))}
                                {questionData.ones > 0 && (
                                    <div className="flex flex-wrap gap-1 items-center bg-white/50 p-2 rounded-lg border-2 border-dashed border-slate-300 shrink-0">
                                        {Array.from({length: questionData.ones}).map((_, i) => <div key={`one-${i}`} className="w-6 h-6 md:w-8 md:h-8 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm">🍎</div>)}
                                    </div>
                                )}
                            </div>
                            <input type="number" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Type Number..." className="w-48 bg-white border-4 border-slate-200 rounded-2xl px-6 py-4 font-black text-center text-3xl text-slate-700 outline-none focus:border-sky-500 shadow-inner" />
                        </div>
                    )}

                    {/* --- CATEGORY: SKIP COUNTING --- */}
                    {activeCategory === 'skip' && (
                        <div className="flex flex-col items-center w-full max-w-2xl">
                            <p className="text-slate-500 font-bold mb-6 text-center">Complete the pattern! (Counting in {questionData.step}s)</p>
                            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 w-full">
                                {questionData.seq.map((num: number, i: number) => {
                                    if (i === questionData.blankIdx) {
                                        return <input key={i} type="number" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 border-4 border-emerald-400 rounded-2xl text-center font-black text-2xl md:text-3xl text-emerald-700 outline-none shadow-inner" />;
                                    }
                                    return (
                                        <div key={i} className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 border-4 border-slate-200 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl text-slate-500 shadow-sm">{num}</div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- CATEGORY: MAKE 100 --- */}
                    {activeCategory === 'make100' && (
                        <div className="flex flex-col items-center w-full max-w-sm">
                            <p className="text-slate-500 font-bold mb-6 text-center">Balance the scale to make 100!</p>
                            <div className="flex items-center gap-4 w-full justify-center bg-pink-50 p-6 rounded-[2rem] border-4 border-pink-100 mb-6">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-white border-4 border-slate-200 rounded-full flex items-center justify-center font-black text-3xl md:text-4xl text-slate-700 shadow-md">{questionData.part1}</div>
                                <Plus className="text-pink-300" size={32} />
                                <input type="number" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} className="w-20 h-20 md:w-24 md:h-24 bg-white border-4 border-pink-400 rounded-full text-center font-black text-3xl md:text-4xl text-pink-600 outline-none shadow-inner" />
                            </div>
                            <div className="text-4xl font-black text-slate-300">= 100</div>
                        </div>
                    )}

                    {/* --- CATEGORY: LOGIC --- */}
                    {activeCategory === 'logic' && (
                        <div className="flex flex-col items-center w-full max-w-md text-center">
                            <div className="w-20 h-20 bg-indigo-100 rounded-[2rem] flex items-center justify-center mb-6 transform rotate-3"><Hash size={40} className="text-indigo-500"/></div>
                            <h3 className="text-2xl md:text-4xl font-black text-slate-700 mb-8 leading-tight">{questionData.text}</h3>
                            <input type="number" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Answer" className="w-48 bg-white border-4 border-indigo-200 rounded-2xl px-6 py-4 font-black text-center text-3xl text-indigo-700 outline-none focus:border-indigo-500 shadow-inner" />
                        </div>
                    )}
                </div>

                {/* Footer Controls (Standard) */}
                {!hideStandardSubmit && (
                    <div className="shrink-0 p-4 border-t-2 border-slate-100 flex justify-end">
                        <button 
                            onClick={handleSubmit}
                            disabled={inputValue === '' || inputValue === null}
                            className="bg-slate-800 text-white px-8 py-3 rounded-xl font-black tracking-wide flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        >
                            Submit Answer <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ============================================================================
    // RENDER: RESULT
    // ============================================================================
    if (phase === 'result') {
        const passed = score >= 3;
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 font-sans md:rounded-3xl p-6 text-center">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl ${passed ? 'bg-lime-100 border-4 border-lime-300' : 'bg-orange-100 border-4 border-orange-300'}`}>
                    {passed ? <CheckCircle2 size={64} className="text-lime-500"/> : <RotateCcw size={64} className="text-orange-500"/>}
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-2">{passed ? 'Dojo Mastered!' : 'Keep Practicing!'}</h2>
                <p className="text-slate-500 font-bold text-lg mb-8">You scored {score} out of 5.</p>
                <button 
                    onClick={() => setPhase('menu')}
                    className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black tracking-wide shadow-md active:translate-y-1 transition-all"
                >
                    Return to Menu
                </button>
            </div>
        );
    }

    return null;
}