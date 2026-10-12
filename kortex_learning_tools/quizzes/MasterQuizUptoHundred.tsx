"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, ChevronLeft, ArrowRight, RotateCcw, LayoutGrid, Activity, Hash, Plus, Check, X as XIcon, Trophy, Sparkles } from 'lucide-react';

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

const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function MasterQuizUptoHundred({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<'menu' | 'playing' | 'result'>('menu');
    const [activeCategory, setActiveCategory] = useState<QuizCategory | null>(null);
    
    // Quiz State
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [questionData, setQuestionData] = useState<any>(null);
    const [inputValue, setInputValue] = useState<any>('');
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

    // Master Quiz Mode State
    const [isMasterQuiz, setIsMasterQuiz] = useState(false);
    const [masterSequence, setMasterSequence] = useState<QuizCategory[]>([]);

    const catInfo = CATEGORIES.find(c => c.id === activeCategory);

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
            utterance.rate = 1.1; 
            
            // Safety timeout to prevent freeze if browser speech hangs
            const safetyTimer = setTimeout(() => resolve(), 700);

            utterance.onend = () => {
                clearTimeout(safetyTimer);
                resolve();
            };
            utterance.onerror = () => {
                clearTimeout(safetyTimer);
                resolve();
            };
            window.speechSynthesis.speak(utterance);
        });
    };

    // --- Progression Helper ---
    const proceedToNext = (wasCorrect = true) => {
        const totalQ = isMasterQuiz ? 15 : 5;
        if (questionIndex < totalQ - 1) {
            const nextIdx = questionIndex + 1;
            setQuestionIndex(nextIdx);
            if (isMasterQuiz) {
                const nextCat = masterSequence[nextIdx];
                setActiveCategory(nextCat);
                generateQuestion(nextCat);
            } else {
                generateQuestion(activeCategory as QuizCategory);
            }
        } else {
            setPhase('result');
        }
    };

    // --- Question Generators ---
    const generateQuestion = (cat: QuizCategory) => {
        setFeedback('idle');
        
        if (cat === 'grid') {
            // Generate a SINGLE grid at a time
            const isValidCenter = (c: number) => c >= 12 && c <= 89 && c % 10 !== 0 && c % 10 !== 1;
            let center = 0;
            while (!isValidCenter(center)) center = Math.floor(Math.random() * 100) + 1;
            
            const isFull = Math.random() > 0.5;
            setQuestionData({
                center,
                type: isFull ? 'full' : 'cross',
                top: center - 10, bottom: center + 10, left: center - 1, right: center + 1,
                tl: center - 11, tr: center - 9, bl: center + 9, br: center + 11
            });
            setInputValue({});
        } 
        else if (cat === 'ginladi') {
            const target = Math.floor(Math.random() * 98) + 2;
            setQuestionData({ target });
            setInputValue(null);
            isGinladiAnimating.current = false;
        }
        else if (cat === 'match') {
            const tens = Math.floor(Math.random() * 8) + 1;
            const ones = Math.floor(Math.random() * 9) + 1;
            setQuestionData({ tens, ones, answer: (tens * 10) + ones });
            setInputValue('');
        }
        else if (cat === 'skip') {
            // Pattern Varieties:
            // 0: Constant Addition (+2, +3, +4, +5, +10)
            // 1: Constant Subtraction (-2, -3, -4, -5, -10)
            // 2: Multiples Addition (+k, +2k, +3k, +4k e.g. +2,+4,+6,+8 or +3,+6,+9,+12)
            // 3: Alternating Add and Subtract (+A, -B, +A, -B e.g. +4, -3 or +5, -2)
            const patternType = Math.floor(Math.random() * 4);
            let seq: number[] = [];
            let blankIdx = 0;

            if (patternType === 0) {
                // Constant Addition (jumping 2, 3, 4, 5, 10)
                const steps = [2, 3, 4, 5, 10];
                const step = steps[Math.floor(Math.random() * steps.length)];
                const maxStart = 100 - (step * 4);
                const start = Math.floor(Math.random() * maxStart) + 1;
                seq = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
                blankIdx = Math.floor(Math.random() * 5);
            } else if (patternType === 1) {
                // Constant Subtraction (counting backwards by 2, 3, 4, 5, 10)
                const steps = [2, 3, 4, 5, 10];
                const step = steps[Math.floor(Math.random() * steps.length)];
                const minStart = (step * 4) + 1;
                const start = Math.floor(Math.random() * (100 - minStart + 1)) + minStart;
                seq = [start, start - step, start - step * 2, start - step * 3, start - step * 4];
                blankIdx = Math.floor(Math.random() * 5);
            } else if (patternType === 2) {
                // Multiples Addition: jump grows by k each step (+k, +2k, +3k, +4k)
                const kOptions = [1, 2, 3, 4, 5];
                const k = kOptions[Math.floor(Math.random() * kOptions.length)];
                const maxStart = 100 - (10 * k);
                const start = Math.floor(Math.random() * maxStart) + 1;
                seq = [start, start + k, start + 3 * k, start + 6 * k, start + 10 * k];
                blankIdx = Math.floor(Math.random() * 3) + 2; // index 2, 3, or 4
            } else {
                // Alternating Add and Subtract (+A, -B, +A, -B)
                const pairs = [
                    { add: 4, sub: 3 },
                    { add: 5, sub: 2 },
                    { add: 6, sub: 3 },
                    { add: 7, sub: 4 },
                    { add: 8, sub: 5 },
                    { add: 10, sub: 5 }
                ];
                const pair = pairs[Math.floor(Math.random() * pairs.length)];
                const maxStart = 100 - (2 * pair.add - pair.sub);
                const start = Math.floor(Math.random() * Math.max(1, maxStart)) + 1;
                seq = [
                    start,
                    start + pair.add,
                    start + pair.add - pair.sub,
                    start + 2 * pair.add - pair.sub,
                    start + 2 * pair.add - 2 * pair.sub
                ];
                blankIdx = Math.floor(Math.random() * 3) + 2; // index 2, 3, or 4
            }

            setQuestionData({ seq, blankIdx, answer: seq[blankIdx] });
            setInputValue('');
        }
        else if (cat === 'make100') {
            // Multiples of 5 from 5 to 95 (includes both 10s and 5s multiples)
            const part1 = (Math.floor(Math.random() * 19) + 1) * 5;
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
        setIsMasterQuiz(false);
        setMasterSequence([]);
        setActiveCategory(cat);
        setQuestionIndex(0);
        setScore(0);
        generateQuestion(cat);
        setPhase('playing');
        playSound('pop');
    };

    const handleStartMasterQuiz = () => {
        const allCats: QuizCategory[] = ['grid', 'ginladi', 'match', 'skip', 'make100', 'logic'];
        // 15 questions: 2 from each of 6 categories (12) + 3 bonus categories (15 total), shuffled
        const bonusCats = [...allCats].sort(() => 0.5 - Math.random()).slice(0, 3);
        const seq: QuizCategory[] = [...allCats, ...allCats, ...bonusCats].sort(() => 0.5 - Math.random());

        setIsMasterQuiz(true);
        setMasterSequence(seq);
        setQuestionIndex(0);
        setScore(0);
        setActiveCategory(seq[0]);
        generateQuestion(seq[0]);
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
    const handleGridInputChange = (field: string, val: string) => {
        const newInputs = { ...inputValue, [field]: val };
        setInputValue(newInputs);

        const q = questionData;
        const fields = q.type === 'full' 
            ? ['top', 'bottom', 'left', 'right', 'tl', 'tr', 'bl', 'br'] 
            : ['top', 'bottom', 'left', 'right'];
        const complete = fields.every(f => {
            const v = newInputs[f];
            return v !== undefined && v !== '' && Number(v) === q[f];
        });

        if (complete) {
            playSound('kaching');
            setFeedback('correct');
            setScore(s => s + 1);
            setTimeout(() => proceedToNext(true), 1200);
        }
    };

    const renderGridCell = (field: string, isFull: boolean) => {
        if (!isFull && ['tl', 'tr', 'bl', 'br'].includes(field)) return <div />;
        
        const q = questionData;
        const expected = q[field];
        const valStr = inputValue?.[field] || '';
        const isCorrect = valStr !== '' && Number(valStr) === expected;
        const isWrong = valStr !== '' && Number(valStr) !== expected;

        let boxClass = "w-full aspect-square rounded-xl text-center font-black text-lg sm:text-xl md:text-2xl outline-none shadow-sm transition-colors border-2 sm:border-4 ";
        if (isCorrect) boxClass += "bg-emerald-100 border-emerald-400 text-emerald-700";
        else if (isWrong) boxClass += "bg-rose-100 border-rose-400 text-rose-700";
        else boxClass += "bg-sky-50 border-sky-200 text-sky-700 focus:border-sky-500";

        return (
            <input
                type="number"
                value={valStr}
                onChange={e => handleGridInputChange(field, e.target.value)}
                placeholder="?"
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
                setInputValue(null); // Resets string
                setFeedback('idle');
                isGinladiAnimating.current = false;
            }, 800);
        }
    };

    // ============================================================================
    // RENDER: MENU
    // ============================================================================
    if (phase === 'menu') {
        return (
            <div className="w-full h-full flex flex-col bg-slate-50 font-sans md:rounded-3xl overflow-hidden p-3 sm:p-5">
                <div className="text-center mb-2.5 sm:mb-4 shrink-0">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Number Dojo (1 - 100)</h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm md:text-base">
                        Practice anytime with the 6 tools below, or take the Master Quiz Challenge to test your skills!
                    </p>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    {/* Master Quiz Challenge Banner */}
                    <div className="max-w-4xl mx-auto mb-2.5 sm:mb-3 w-full">
                        <button
                            onClick={handleStartMasterQuiz}
                            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white p-3 sm:p-4 rounded-2xl shadow-md border-b-[4px] sm:border-b-[5px] border-indigo-900 active:translate-y-[4px] active:border-b-0 transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-2.5 sm:gap-3.5">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-inner group-hover:scale-105 transition-transform">
                                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 drop-shadow" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="font-black text-sm sm:text-base md:text-lg">Master Quiz Challenge</span>
                                        <span className="bg-amber-400 text-amber-950 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                            <Sparkles size={11} /> 15 Questions
                                        </span>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-indigo-100 font-bold">
                                        15 randomized challenges mixed from all 6 areas! Test your score!
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white/20 group-hover:bg-white/30 px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1 shrink-0 transition-colors">
                                <span>Start Quiz</span> <ArrowRight size={14} />
                            </div>
                        </button>
                    </div>

                    {/* Practice Dojos Grid */}
                    <div className="max-w-4xl mx-auto mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-wider">Practice Dojos</span>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400">5 Questions Each</span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 max-w-4xl mx-auto pb-2">
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => handleStartCategory(cat.id)}
                                className={`relative p-3 sm:p-4 md:p-5 rounded-2xl border-b-[4px] sm:border-b-[5px] shadow-sm flex flex-col items-center justify-center gap-1 sm:gap-2 transition-all active:translate-y-[4px] active:border-b-[0px] ${cat.color} ${cat.border} hover:brightness-110`}
                            >
                                <cat.icon size={28} className="text-white drop-shadow-md sm:scale-110" />
                                <span className="font-black text-white text-xs sm:text-sm md:text-base text-center leading-tight drop-shadow-sm">{cat.title}</span>
                                <span className="text-[9px] sm:text-[10px] text-white/90 font-bold bg-black/15 px-2 py-0.5 rounded-full">Practice</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PLAYING
    // ============================================================================
    if (phase === 'playing' && questionData) {
        const catInfo = CATEGORIES.find(c => c.id === activeCategory);
        const hideStandardSubmit = activeCategory === 'grid' || activeCategory === 'ginladi';
        
        return (
            <div className="w-full h-full flex flex-col bg-white font-sans md:rounded-3xl overflow-hidden">
                {/* Header */}
                <div className={`shrink-0 px-3 py-2 flex items-center justify-between text-white shadow-sm ${isMasterQuiz ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600' : catInfo?.color}`}>
                    <button onClick={() => setPhase('menu')} className="bg-white/20 p-1.5 rounded-lg hover:bg-white/30 transition-colors"><ChevronLeft size={18}/></button>
                    <div className="font-black tracking-widest uppercase text-xs sm:text-sm">
                        {isMasterQuiz ? `Master Quiz • ${catInfo?.title}` : catInfo?.title} • {questionIndex + 1}/{isMasterQuiz ? 15 : 5}
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full font-black text-xs sm:text-sm">{score}</div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2.5 sm:p-4 relative overflow-hidden">
                    
                    {/* FEEDBACK OVERLAY (For Standard Categories only) */}
                    {!hideStandardSubmit && feedback !== 'idle' && (
                        <div className={`absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in`}>
                            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-2xl animate-bounce ${feedback === 'correct' ? 'bg-lime-400 text-lime-900' : 'bg-rose-400 text-rose-900'}`}>
                                {feedback === 'correct' ? <Check size={48}/> : <XIcon size={48}/>}
                            </div>
                        </div>
                    )}

                    {/* --- CATEGORY: GRID CROSS --- */}
                    {activeCategory === 'grid' && (
                        <div className="flex flex-col items-center w-full h-full justify-center">
                            <p className="text-slate-500 font-bold text-xs sm:text-sm mb-3 sm:mb-4 text-center shrink-0">
                                Fill in the boxes around the center number on the 100-chart!
                            </p>

                            <div className="bg-slate-50 p-4 sm:p-6 rounded-3xl border-2 sm:border-4 border-slate-200 shadow-md shrink-0">
                                <div className="grid grid-cols-3 grid-rows-3 gap-2 sm:gap-3 w-52 sm:w-64 md:w-72 mx-auto">
                                    {renderGridCell('tl', questionData.type === 'full')}
                                    {renderGridCell('top', true)}
                                    {renderGridCell('tr', questionData.type === 'full')}

                                    {renderGridCell('left', true)}
                                    <div className="w-full aspect-square bg-amber-400 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl md:text-4xl text-amber-950 shadow-inner">
                                        {questionData.center}
                                    </div>
                                    {renderGridCell('right', true)}

                                    {renderGridCell('bl', questionData.type === 'full')}
                                    {renderGridCell('bottom', true)}
                                    {renderGridCell('br', questionData.type === 'full')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- CATEGORY: GINLADI (Single-Screen Continuous Serpentine Bead String) --- */}
                    {activeCategory === 'ginladi' && (
                        <div className="flex flex-col items-center w-full max-w-2xl h-full justify-between overflow-hidden">
                            {/* Target Prompt Banner (In English: Quickly find the 24th bead / Quickly find the 58th bead) */}
                            <div className="shrink-0 bg-slate-800 text-white px-5 sm:px-8 py-1.5 sm:py-2.5 rounded-full font-black text-xs sm:text-sm md:text-base shadow-md border-2 border-slate-700 flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 animate-pulse text-center">
                                <span className="text-slate-300">Quickly find the</span>
                                <span className="text-amber-400 font-black text-sm sm:text-lg md:text-xl underline decoration-amber-400">
                                    {getOrdinal(questionData.target)} bead
                                </span>
                            </div>
                            
                            {/* Serpentine Bead Board - Constrained to 100% height */}
                            <div className="flex-1 w-full bg-slate-100 p-2 sm:p-3 md:p-4 rounded-2xl border-2 sm:border-3 border-slate-200 flex flex-col justify-center overflow-hidden relative shadow-inner min-h-0">
                                <div className="relative w-full h-full">
                                    {/* Continuous Unbreakable SVG Rope - Dead-center matched to 10x10 grid */}
                                    <svg 
                                        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" 
                                        viewBox="0 0 1000 1000" 
                                        preserveAspectRatio="none"
                                    >
                                        <path
                                            d="M 50 50 L 950 50 A 50 50 0 0 1 950 150 L 50 150 A 50 50 0 0 0 50 250 L 950 250 A 50 50 0 0 1 950 350 L 50 350 A 50 50 0 0 0 50 450 L 950 450 A 50 50 0 0 1 950 550 L 50 550 A 50 50 0 0 0 50 650 L 950 650 A 50 50 0 0 1 950 750 L 50 750 A 50 50 0 0 0 50 850 L 950 850 A 50 50 0 0 1 950 950 L 50 950"
                                            fill="none"
                                            stroke="#94a3b8"
                                            strokeWidth="7"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>

                                    {/* 10 Rows x 10 Columns Grid (Centers beads exactly at 5%, 15%, 25% ... matching SVG) */}
                                    <div className="grid grid-rows-10 h-full w-full relative z-10">
                                        {Array.from({ length: 10 }).map((_, r) => {
                                            const isReverse = r % 2 !== 0;
                                            return (
                                                <div key={r} className="grid grid-cols-10 h-full w-full">
                                                    {Array.from({ length: 10 }).map((_, c) => {
                                                        const num = isReverse 
                                                            ? (r * 10) + (10 - c) 
                                                            : (r * 10) + (c + 1);
                                                        const isBlueGroup = Math.floor((num - 1) / 10) % 2 === 0;
                                                        const isRevealed = inputValue !== null && num <= inputValue;
                                                        const showNumber = isRevealed || num === 1 || num === 100;

                                                        let beadClass = "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full border-[2px] sm:border-[2.5px] z-10 transition-all duration-200 flex items-center justify-center shadow-sm relative active:scale-125 ";
                                                        
                                                        if (isRevealed && feedback === 'correct') {
                                                            beadClass += "bg-emerald-500 border-emerald-300 scale-110 shadow-emerald-500/50";
                                                        } else if (isRevealed && feedback === 'wrong') {
                                                            beadClass += "bg-rose-600 border-rose-400";
                                                        } else if (isRevealed && feedback === 'idle') {
                                                            beadClass += "bg-amber-400 border-amber-200 scale-110 shadow-amber-500/50";
                                                        } else {
                                                            beadClass += isBlueGroup ? "bg-sky-500 hover:bg-sky-400 border-sky-600" : "bg-white hover:bg-slate-50 border-slate-300";
                                                        }

                                                        let textColor = "text-white";
                                                        if (isRevealed && feedback === 'idle') {
                                                            textColor = "text-amber-950";
                                                        } else if (!isRevealed && num === 100) {
                                                            textColor = "text-slate-700";
                                                        } else if (!isRevealed && num === 1) {
                                                            textColor = "text-white";
                                                        }

                                                        return (
                                                            <div key={num} className="flex items-center justify-center w-full h-full">
                                                                <button 
                                                                    onClick={() => handleGinladiClick(num)}
                                                                    className={beadClass}
                                                                    disabled={isGinladiAnimating.current}
                                                                    title={`Bead ${num}`}
                                                                >
                                                                    {showNumber && (
                                                                        <span className={`font-black leading-none ${num === 100 ? 'text-[6px] sm:text-[7px] md:text-[8px]' : 'text-[8px] sm:text-[9px] md:text-[10px]'} ${textColor}`}>
                                                                            {num}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- CATEGORY: COUNT MATCH --- */}
                    {activeCategory === 'match' && (
                        <div className="flex flex-col items-center w-full max-w-xl justify-center h-full">
                            <p className="text-slate-500 font-bold text-xs sm:text-sm mb-2 sm:mb-4 text-center">Count the boxes of 10 and loose apples!</p>
                            <div className="bg-sky-50 p-3 sm:p-5 rounded-2xl border-2 sm:border-4 border-sky-100 flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 w-full max-h-[170px] overflow-y-auto">
                                {Array.from({length: questionData.tens}).map((_, i) => (
                                    <div key={`box-${i}`} className="bg-amber-100 rounded-lg border-2 border-amber-500 p-1 shadow-sm flex flex-col items-center shrink-0">
                                        <div className="bg-amber-500 text-white text-[8px] font-black px-1 rounded mb-0.5">10</div>
                                        <div className="grid grid-cols-5 gap-0.5">
                                            {Array.from({length: 10}).map((_, j) => <div key={j} className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-[2px] border border-amber-200 flex items-center justify-center"><span className="text-[7px]">🍎</span></div>)}
                                        </div>
                                    </div>
                                ))}
                                {questionData.ones > 0 && (
                                    <div className="flex flex-wrap gap-1 items-center bg-white/60 p-1.5 rounded-lg border border-dashed border-slate-300 shrink-0">
                                        {Array.from({length: questionData.ones}).map((_, i) => <div key={`one-${i}`} className="w-5 h-5 sm:w-6 sm:h-6 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm text-xs">🍎</div>)}
                                    </div>
                                )}
                            </div>
                            <input 
                                type="number" 
                                autoFocus 
                                value={inputValue} 
                                onChange={e => setInputValue(e.target.value)} 
                                placeholder="Total?" 
                                className="w-36 sm:w-44 bg-white border-2 sm:border-4 border-slate-200 rounded-xl px-4 py-2.5 font-black text-center text-2xl sm:text-3xl text-slate-700 outline-none focus:border-sky-500 shadow-inner" 
                            />
                        </div>
                    )}

                    {/* --- CATEGORY: SKIP COUNTING --- */}
                    {activeCategory === 'skip' && (
                        <div className="flex flex-col items-center w-full max-w-xl justify-center h-full">
                            <p className="text-slate-500 font-bold text-xs sm:text-sm mb-4 sm:mb-6 text-center">Find the missing number to complete the pattern!</p>
                            <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-3 w-full">
                                {questionData.seq.map((num: number, i: number) => {
                                    if (i === questionData.blankIdx) {
                                        return <input key={i} type="number" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="?" className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-emerald-50 border-2 sm:border-4 border-emerald-400 rounded-xl sm:rounded-2xl text-center font-black text-xl sm:text-2xl md:text-3xl text-emerald-700 outline-none shadow-inner" />;
                                    }
                                    return (
                                        <div key={i} className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-slate-100 border-2 sm:border-4 border-slate-200 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl md:text-3xl text-slate-500 shadow-sm">{num}</div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- CATEGORY: MAKE 100 --- */}
                    {activeCategory === 'make100' && (
                        <div className="flex flex-col items-center w-full max-w-sm justify-center h-full">
                            <p className="text-slate-500 font-bold text-xs sm:text-sm mb-3 sm:mb-5 text-center">Balance the scale to make 100!</p>
                            <div className="flex items-center gap-3 sm:gap-4 w-full justify-center bg-pink-50 p-4 sm:p-5 rounded-2xl border-2 sm:border-4 border-pink-100 mb-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white border-2 sm:border-4 border-slate-200 rounded-full flex items-center justify-center font-black text-2xl sm:text-3xl md:text-4xl text-slate-700 shadow-md">{questionData.part1}</div>
                                <Plus className="text-pink-400" size={26} />
                                <input type="number" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="?" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white border-2 sm:border-4 border-pink-400 rounded-full text-center font-black text-2xl sm:text-3xl md:text-4xl text-pink-600 outline-none shadow-inner" />
                            </div>
                            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-300">= 100</div>
                        </div>
                    )}

                    {/* --- CATEGORY: LOGIC --- */}
                    {activeCategory === 'logic' && (
                        <div className="flex flex-col items-center w-full max-w-md text-center justify-center h-full">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transform rotate-3"><Hash size={28} className="text-indigo-500"/></div>
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-700 mb-4 sm:mb-6 leading-tight max-w-sm">{questionData.text}</h3>
                            <input type="number" autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Answer" className="w-36 sm:w-44 bg-white border-2 sm:border-4 border-indigo-200 rounded-xl px-4 py-2.5 font-black text-center text-2xl sm:text-3xl text-indigo-700 outline-none focus:border-indigo-500 shadow-inner" />
                        </div>
                    )}
                </div>

                {/* Footer Controls (Standard) */}
                {!hideStandardSubmit && (
                    <div className="shrink-0 p-2.5 sm:p-3 border-t border-slate-100 flex justify-end">
                        <button 
                            onClick={handleSubmit}
                            disabled={inputValue === '' || inputValue === null}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-6 sm:px-8 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wide flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100"
                        >
                            Submit Answer <ArrowRight size={16} />
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
        const totalQ = isMasterQuiz ? 15 : 5;
        const passThreshold = isMasterQuiz ? 10 : 3;
        const passed = score >= passThreshold;
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 font-sans md:rounded-3xl p-4 sm:p-6 text-center">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg ${passed ? 'bg-lime-100 border-4 border-lime-300' : 'bg-orange-100 border-4 border-orange-300'}`}>
                    {passed ? <CheckCircle2 size={44} className="text-lime-500"/> : <RotateCcw size={44} className="text-orange-500"/>}
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-1">
                    {isMasterQuiz 
                        ? (passed ? 'Master Quiz Cleared!' : 'Keep Practicing!') 
                        : (passed ? `${catInfo?.title || 'Practice'} Completed!` : 'Good Effort!')}
                </h2>
                <p className="text-slate-500 font-bold text-sm sm:text-base mb-4 sm:mb-6">
                    {isMasterQuiz 
                        ? `You scored ${score} out of 15.` 
                        : `You scored ${score} out of 5 in this practice session.`}
                </p>
                <div className="flex gap-2.5 sm:gap-3 flex-wrap justify-center">
                    <button 
                        onClick={() => setPhase('menu')}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-md active:translate-y-1 transition-all"
                    >
                        Return to Menu
                    </button>

                    {/* In practice mode: allow practicing again or jumping to Master Quiz */}
                    {!isMasterQuiz && (
                        <>
                            <button 
                                onClick={() => activeCategory && handleStartCategory(activeCategory)}
                                className="bg-sky-500 hover:bg-sky-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-md active:translate-y-1 transition-all flex items-center gap-1.5"
                            >
                                <RotateCcw size={15} /> Practice Again
                            </button>
                            <button 
                                onClick={handleStartMasterQuiz}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-md active:translate-y-1 transition-all flex items-center gap-1.5"
                            >
                                <Trophy size={15} className="text-amber-300" /> Take Master Quiz
                            </button>
                        </>
                    )}

                    {/* In Master Quiz: allow re-taking or completing lesson */}
                    {isMasterQuiz && !passed && (
                        <button 
                            onClick={handleStartMasterQuiz}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-md active:translate-y-1 transition-all flex items-center gap-1.5"
                        >
                            <RotateCcw size={15} /> Try Quiz Again
                        </button>
                    )}

                    {isMasterQuiz && passed && onComplete && (
                        <button 
                            onClick={() => onComplete({ score })}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-md active:translate-y-1 transition-all flex items-center gap-2"
                        >
                            <CheckCircle2 size={16} /> Complete Lesson <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return null;
}