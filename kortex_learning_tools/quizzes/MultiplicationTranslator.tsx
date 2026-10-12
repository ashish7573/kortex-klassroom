"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle2, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

type AppPhase = 'intro' | 'q1_vis_to_add' | 'q2_add_to_word' | 'q3_word_to_mult' | 'q4_boss' | 'finish';

interface GameData {
    q: { count: number, size: number, total: number, emoji: string };
    opts1: { text: string, isCorrect: boolean }[];
    opts2: { text: React.ReactNode, isCorrect: boolean }[];
    opts3: { text: string, isCorrect: boolean }[];
    boss: { count: number, size: number, emoji: string };
}

const EMOJIS = ['🍪', '🍎', '🎈', '⭐', '🍕', '🍩', '🚗', '🍓', '🏀'];

// ============================================================================
// REUSABLE COMPONENTS (Extracted to prevent re-render focus loss)
// ============================================================================

const BossInput = ({ value, onChange, disabled, width = "w-10 sm:w-12 md:w-16" }: any) => (
    <input 
        type="text" inputMode="numeric" maxLength={2}
        value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        disabled={disabled}
        className={`${width} h-9 sm:h-11 md:h-14 text-center font-black text-lg sm:text-2xl md:text-3xl rounded-lg sm:rounded-xl border-2 border-slate-500 bg-slate-900 text-sky-400 focus:border-sky-400 focus:shadow-[0_0_10px_rgba(56,189,248,0.5)] outline-none transition-all disabled:opacity-50`}
    />
);

const OptionButton = ({ text, isCorrect, index, clickedOption, optionStatus, onClick }: any) => {
    let btnClass = "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500";
    
    if (clickedOption === index) {
        if (optionStatus === 'correct') btnClass = "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-102";
        if (optionStatus === 'wrong') btnClass = "bg-rose-500 border-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-pulse";
    }
    
    return (
        <button 
            onClick={() => onClick(index, isCorrect)}
            disabled={optionStatus === 'correct' || (clickedOption === index && optionStatus === 'wrong')}
            className={`w-full py-2.5 sm:py-3.5 md:py-5 px-3 rounded-xl sm:rounded-2xl border-2 sm:border-4 font-black text-base sm:text-xl md:text-2xl transition-all ${btnClass}`}
        >
            {text}
        </button>
    );
};

const EmojiGroupCard = ({ size, emoji }: { size: number, emoji: string }) => {
    const textSize = size <= 3 
        ? "text-lg sm:text-2xl md:text-3xl" 
        : "text-sm sm:text-lg md:text-2xl";

    return (
        <div className="bg-slate-900 border-2 border-slate-600 rounded-xl sm:rounded-2xl w-14 sm:w-18 md:w-22 min-h-[4.25rem] sm:min-h-[5.25rem] md:min-h-[6.25rem] p-1.5 sm:p-2 flex items-center justify-center shadow-md shrink-0 overflow-hidden">
            <div className="grid grid-cols-2 gap-0.5 sm:gap-1 items-center justify-items-center w-full">
                {Array.from({ length: size }).map((_, j) => (
                    <span 
                        key={j} 
                        className={`select-none leading-none ${textSize} ${
                            (j === 2 && size === 3) || (j === 4 && size === 5) ? 'col-span-2' : ''
                        }`}
                    >
                        {emoji}
                    </span>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// MAIN RENDER LOGIC
// ============================================================================
export default function MultiplicationTranslator({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<AppPhase>('intro');
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [mounted, setMounted] = useState(false);
    
    // Quiz Progress State (5 Rounds x 4 Questions = 20 Total Questions)
    const [roundNum, setRoundNum] = useState(1);
    const TOTAL_ROUNDS = 5;

    // Immediate Feedback State for Options
    const [clickedOption, setClickedOption] = useState<number | null>(null);
    const [optionStatus, setOptionStatus] = useState<'correct' | 'wrong' | null>(null);

    // Boss Level State
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [bossInputs, setBossInputs] = useState({ addParts: [] as string[], addTotal: '', groups: '', size: '', multA: '', multB: '', multTotal: '' });

    useEffect(() => { 
        setMounted(true); 
        initRandomGame();
    }, []);

    // --- Audio Engine ---
    const audioCtx = useRef<AudioContext | null>(null);
    const playSound = (type: 'pop' | 'kaching' | 'error' | 'whoosh' | 'click' | 'magic') => {
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
            else if (type === 'whoosh') { osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.1, ctx.currentTime); } 
            else if (type === 'error') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.2, ctx.currentTime); } 
            else if (type === 'click') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime); gain.gain.setValueAtTime(0.05, ctx.currentTime); }
            else if (type === 'magic') { osc.type = 'sine'; osc.frequency.setValueAtTime(700, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.4); gain.gain.setValueAtTime(0.15, ctx.currentTime); }
            
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + (type === 'kaching' ? 0.4 : 0.2));
        } catch(e) {}
    };

    // --- Data Generator ---
    const initRandomGame = () => {
        // Ensure count and size are different so correct/wrong options are distinct
        let count1 = Math.floor(Math.random() * 4) + 2; // 2 to 5
        let size1 = Math.floor(Math.random() * 4) + 2;  // 2 to 5
        while (size1 === count1) { size1 = Math.floor(Math.random() * 4) + 2; }
        
        const total1 = count1 * size1;
        const emoji1 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        
        // Q1 Options
        const correctAdd = Array(count1).fill(size1).join(' + ') + ` = ${total1}`;
        const wrongAdd1 = Array(size1).fill(count1).join(' + ') + ` = ${total1}`;
        const wrongAdd2 = `${count1} + ${size1} = ${count1 + size1}`;
        const opts1 = [
            { text: correctAdd, isCorrect: true },
            { text: wrongAdd1, isCorrect: false },
            { text: wrongAdd2, isCorrect: false }
        ].sort(() => Math.random() - 0.5);

        // Q2 Options
        const opts2 = [
            { text: <span key="c"><span className="text-sky-400">{count1}</span> times <span className="text-emerald-400">{size1}</span></span>, isCorrect: true },
            { text: <span key="w1"><span className="text-sky-400">{size1}</span> times <span className="text-emerald-400">{count1}</span></span>, isCorrect: false },
            { text: <span key="w2"><span className="text-sky-400">{count1}</span> plus <span className="text-emerald-400">{size1}</span></span>, isCorrect: false }
        ].sort(() => Math.random() - 0.5);

        // Q3 Options
        const correctMult = `${count1} × ${size1} = ${total1}`;
        const wrongMult1 = `${size1} × ${count1} = ${total1}`;
        const wrongMult2 = `${count1} + ${size1} = ${count1 + size1}`;
        const wrongMult3 = `${total1} × 1 = ${total1}`;
        const opts3 = [
            { text: correctMult, isCorrect: true },
            { text: wrongMult1, isCorrect: false },
            { text: wrongMult2, isCorrect: false },
            { text: wrongMult3, isCorrect: false }
        ].sort(() => Math.random() - 0.5);

        // Boss Data: Extension & synthesis of the exact same problem from Q1, Q2, and Q3!
        const newData = {
            q: { count: count1, size: size1, total: total1, emoji: emoji1 },
            opts1, opts2, opts3,
            boss: { count: count1, size: size1, emoji: emoji1 }
        };

        setGameData(newData);
        setBossInputs({ addParts: Array(count1).fill(''), addTotal: '', groups: '', size: '', multA: '', multB: '', multTotal: '' });
    };

    const handleStartQuiz = () => {
        setRoundNum(1);
        initRandomGame();
        playSound('whoosh');
        setPhase('q1_vis_to_add');
    };

    const handleNextPhase = (nextPhase: AppPhase) => {
        playSound('whoosh');
        setPhase(nextPhase);
        setClickedOption(null);
        setOptionStatus(null);
    };

    // --- Immediate Feedback Handler ---
    const handleOptionClick = (index: number, isCorrect: boolean, nextPhase: AppPhase) => {
        if (optionStatus === 'correct') return; // Prevent clicking while transitioning
        
        setClickedOption(index);
        
        if (isCorrect) {
            setOptionStatus('correct');
            playSound('kaching');
            setTimeout(() => {
                handleNextPhase(nextPhase);
            }, 1200);
        } else {
            setOptionStatus('wrong');
            playSound('error');
            setTimeout(() => {
                setClickedOption(null);
                setOptionStatus(null);
            }, 1000); // Wait 1 second, then reset so they can try again
        }
    };

    const handleBossSubmit = () => {
        if (!gameData) return;
        const total = gameData.boss.count * gameData.boss.size;
        let isCorrect = true;

        if (bossInputs.addParts.some(val => Number(val) !== gameData.boss.size)) isCorrect = false;
        if (Number(bossInputs.addTotal) !== total) isCorrect = false;
        if (Number(bossInputs.groups) !== gameData.boss.count) isCorrect = false;
        if (Number(bossInputs.size) !== gameData.boss.size) isCorrect = false;
        
        const mValid = (Number(bossInputs.multA) === gameData.boss.count && Number(bossInputs.multB) === gameData.boss.size);
        if (!mValid) isCorrect = false;
        if (Number(bossInputs.multTotal) !== total) isCorrect = false;

        if (isCorrect) {
            playSound('magic');
            setFeedback('correct');
            setTimeout(() => {
                setFeedback('idle');
                if (roundNum < TOTAL_ROUNDS) {
                    setRoundNum(prev => prev + 1);
                    initRandomGame();
                    setPhase('q1_vis_to_add');
                } else {
                    handleNextPhase('finish');
                }
            }, 2000);
        } else {
            playSound('error');
            setFeedback('wrong');
            setTimeout(() => setFeedback('idle'), 1500);
        }
    };

    if (!mounted || !gameData) return null;

    // ============================================================================
    // MAIN RENDER LOGIC
    // ============================================================================
    return (
        <div className="w-full h-full flex flex-col bg-slate-900 font-sans md:rounded-3xl relative overflow-hidden text-white selection:bg-sky-500/30">
            
            {/* Boss Level Global Feedback Overlay */}
            {feedback !== 'idle' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm pointer-events-none animate-fade-in">
                    <div className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center shadow-2xl animate-bounce ${feedback === 'correct' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        {feedback === 'correct' ? <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16"/> : <RotateCcw className="w-12 h-12 sm:w-16 sm:h-16"/>}
                    </div>
                </div>
            )}

            {/* PHASE: INTRO */}
            {phase === 'intro' && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-2xl mx-auto gap-4 sm:gap-6 animate-fade-in-up">
                    <div className="bg-sky-500 p-3 sm:p-4 rounded-full shadow-lg"><Sparkles className="w-8 h-8 sm:w-12 sm:h-12" /></div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight">The Translator Quiz</h1>
                    <p className="text-slate-400 text-sm sm:text-lg md:text-xl max-w-md">Let's practice changing Pictures into Addition, Words, and Multiplication!</p>
                    <button onClick={handleStartQuiz} className="mt-2 sm:mt-4 bg-sky-500 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-black text-lg sm:text-xl shadow-[0_4px_0_rgb(14,165,233)] hover:bg-sky-400 active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2">
                        Start Quiz <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
            )}

            {/* PHASE 1: Visual to Addition */}
            {phase === 'q1_vis_to_add' && (
                <div className="flex-1 flex flex-col p-3 sm:p-6 md:p-8 max-w-5xl mx-auto w-full animate-fade-in min-h-0 overflow-y-auto">
                    <div className="text-center mb-3 sm:mb-6 shrink-0">
                        <span className="text-slate-500 font-black uppercase tracking-widest text-[10px] sm:text-xs">Question {(roundNum - 1) * 4 + 1} of 20</span>
                        <h2 className="text-lg sm:text-2xl md:text-4xl font-black mt-1">Which addition matches this picture?</h2>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-center justify-center w-full min-h-0">
                        <div className="bg-slate-800 p-3 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 sm:border-4 border-slate-700 w-full md:w-1/2 flex flex-wrap gap-2.5 sm:gap-4 items-center justify-center min-h-[120px] sm:min-h-[160px] md:min-h-[200px] shadow-inner">
                            {Array.from({length: gameData.q.count}).map((_, i) => (
                                <EmojiGroupCard key={i} size={gameData.q.size} emoji={gameData.q.emoji} />
                            ))}
                        </div>

                        <div className="w-full md:w-1/2 flex flex-col gap-2.5 sm:gap-4">
                            {gameData.opts1.map((opt, idx) => (
                                <OptionButton 
                                    key={idx} text={opt.text} index={idx} isCorrect={opt.isCorrect} 
                                    clickedOption={clickedOption} optionStatus={optionStatus}
                                    onClick={(i: number, c: boolean) => handleOptionClick(i, c, 'q2_add_to_word')}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PHASE 2: Addition to Words */}
            {phase === 'q2_add_to_word' && (
                <div className="flex-1 flex flex-col p-3 sm:p-6 md:p-8 max-w-4xl mx-auto w-full animate-fade-in min-h-0 overflow-y-auto">
                    <div className="text-center mb-3 sm:mb-6 shrink-0">
                        <span className="text-slate-500 font-black uppercase tracking-widest text-[10px] sm:text-xs">Question {(roundNum - 1) * 4 + 2} of 20</span>
                        <h2 className="text-lg sm:text-2xl md:text-4xl font-black mt-1">How do we say this in words?</h2>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-8 md:gap-12 w-full min-h-0">
                        <div className="text-2xl sm:text-4xl md:text-6xl font-black text-amber-400 bg-slate-800 px-4 sm:px-8 py-3 sm:py-6 rounded-2xl md:rounded-3xl border-2 sm:border-4 border-slate-700 shadow-inner tracking-wider sm:tracking-widest text-center">
                            {Array(gameData.q.count).fill(gameData.q.size).join(' + ')} = {gameData.q.total}
                        </div>

                        <div className="w-full max-w-2xl grid grid-cols-1 gap-2.5 sm:gap-4">
                            {gameData.opts2.map((opt, idx) => (
                                <OptionButton 
                                    key={idx} text={opt.text} index={idx} isCorrect={opt.isCorrect} 
                                    clickedOption={clickedOption} optionStatus={optionStatus}
                                    onClick={(i: number, c: boolean) => handleOptionClick(i, c, 'q3_word_to_mult')}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PHASE 3: Words to Multiplication */}
            {phase === 'q3_word_to_mult' && (
                <div className="flex-1 flex flex-col p-3 sm:p-6 md:p-8 max-w-4xl mx-auto w-full animate-fade-in min-h-0 overflow-y-auto">
                    <div className="text-center mb-3 sm:mb-6 shrink-0">
                        <span className="text-slate-500 font-black uppercase tracking-widest text-[10px] sm:text-xs">Question {(roundNum - 1) * 4 + 3} of 20</span>
                        <h2 className="text-lg sm:text-2xl md:text-4xl font-black mt-1">Which is the correct trick?</h2>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-8 md:gap-12 w-full min-h-0">
                        <div className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-300 bg-slate-800 px-4 sm:px-8 py-3 sm:py-6 rounded-2xl md:rounded-3xl border-2 sm:border-4 border-slate-700 shadow-inner text-center">
                            <span className="text-sky-400">{gameData.q.count}</span> groups of <span className="text-emerald-400">{gameData.q.size}</span>
                        </div>

                        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                            {gameData.opts3.map((opt, idx) => (
                                <OptionButton 
                                    key={idx} text={opt.text} index={idx} isCorrect={opt.isCorrect} 
                                    clickedOption={clickedOption} optionStatus={optionStatus}
                                    onClick={(i: number, c: boolean) => handleOptionClick(i, c, 'q4_boss')}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PHASE 4: THE BOSS LEVEL */}
            {phase === 'q4_boss' && (
                <div className="flex-1 flex flex-col p-3 sm:p-5 md:p-6 w-full max-w-5xl mx-auto animate-fade-in overflow-y-auto">
                    <div className="text-center mb-3 sm:mb-5 shrink-0">
                        <span className="text-amber-500 font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-1"><Sparkles size={14}/> Boss Level - Question {(roundNum - 1) * 4 + 4} of 20</span>
                        <h2 className="text-lg sm:text-2xl md:text-3xl font-black mt-0.5 sm:mt-1">Put it all together: Translate this picture completely!</h2>
                    </div>

                    {/* The Anchor Image */}
                    <div className="bg-slate-800 p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-slate-700 flex flex-wrap gap-2 sm:gap-4 items-center justify-center mb-3 sm:mb-5 shadow-inner shrink-0">
                        {Array.from({length: gameData.boss.count}).map((_, i) => (
                            <EmojiGroupCard key={i} size={gameData.boss.size} emoji={gameData.boss.emoji} />
                        ))}
                    </div>

                    {/* The Translation Worksheet */}
                    <div className="bg-slate-800 rounded-2xl md:rounded-3xl border border-slate-700 p-2.5 sm:p-5 md:p-8 flex flex-col gap-2.5 sm:gap-5 w-full shadow-lg">
                        
                        {/* 1. Addition */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-slate-900/50 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-700">
                            <span className="font-black text-slate-500 uppercase tracking-widest text-[10px] sm:text-xs sm:w-20 shrink-0">Addition</span>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1">
                                {bossInputs.addParts.map((val, i) => (
                                    <React.Fragment key={i}>
                                        <BossInput value={val} onChange={(v: string) => {
                                            playSound('click');
                                            const newParts = [...bossInputs.addParts];
                                            newParts[i] = v;
                                            setBossInputs({...bossInputs, addParts: newParts});
                                        }} />
                                        {i < gameData.boss.count - 1 && <span className="text-lg sm:text-2xl font-black text-slate-500">+</span>}
                                    </React.Fragment>
                                ))}
                                <span className="text-lg sm:text-2xl font-black text-slate-500 ml-1 sm:ml-2">=</span>
                                <BossInput value={bossInputs.addTotal} onChange={(v: string) => { playSound('click'); setBossInputs({...bossInputs, addTotal: v}); }} />
                            </div>
                        </div>

                        {/* 2. Words */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-slate-900/50 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-700">
                            <span className="font-black text-slate-500 uppercase tracking-widest text-[10px] sm:text-xs sm:w-20 shrink-0">Words</span>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-base sm:text-xl md:text-2xl font-black text-slate-300">
                                <BossInput value={bossInputs.groups} onChange={(v: string) => { playSound('click'); setBossInputs({...bossInputs, groups: v}); }} />
                                <span>Groups of</span>
                                <BossInput value={bossInputs.size} onChange={(v: string) => { playSound('click'); setBossInputs({...bossInputs, size: v}); }} />
                            </div>
                        </div>

                        {/* 3. Multiplication */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-slate-900/50 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-700 border-l-4 border-l-sky-500 shadow-[inset_4px_0_0_rgba(14,165,233,1)]">
                            <span className="font-black text-slate-500 uppercase tracking-widest text-[10px] sm:text-xs sm:w-20 shrink-0">Shortcut</span>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-base sm:text-xl md:text-2xl font-black text-slate-300">
                                <BossInput value={bossInputs.multA} onChange={(v: string) => { playSound('click'); setBossInputs({...bossInputs, multA: v}); }} />
                                <span className="text-sky-400 text-xl sm:text-3xl">×</span>
                                <BossInput value={bossInputs.multB} onChange={(v: string) => { playSound('click'); setBossInputs({...bossInputs, multB: v}); }} />
                                <span>=</span>
                                <BossInput value={bossInputs.multTotal} onChange={(v: string) => { playSound('click'); setBossInputs({...bossInputs, multTotal: v}); }} width="w-12 sm:w-16 md:w-24" />
                            </div>
                        </div>

                    </div>

                    <div className="mt-4 sm:mt-6 flex justify-center pb-2 sm:pb-4 shrink-0">
                        <button onClick={handleBossSubmit} className="w-full max-w-sm bg-emerald-500 px-5 sm:px-6 py-2.5 sm:py-4 rounded-xl font-black text-base sm:text-xl shadow-[0_4px_0_rgb(16,185,129)] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2">
                            Check Master Translation
                        </button>
                    </div>
                </div>
            )}

            {/* PHASE: FINISH */}
            {phase === 'finish' && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-2xl mx-auto gap-4 sm:gap-6 animate-fade-in-up">
                    <div className="bg-emerald-500 p-3 sm:p-4 rounded-full shadow-lg border-4 border-white text-white"><CheckCircle2 className="w-10 h-10 sm:w-16 sm:h-16" /></div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-emerald-400">Translation Master!</h1>
                    <p className="text-slate-400 text-sm sm:text-lg md:text-xl max-w-md">You completed all 20 questions! You can perfectly translate pictures into addition, words, and multiplication!</p>
                    <button onClick={onComplete} className="mt-2 sm:mt-4 bg-sky-500 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-black text-lg sm:text-xl shadow-[0_4px_0_rgb(14,165,233)] hover:bg-sky-400 active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2">
                        Complete Lesson <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
            )}
        </div>
    );
}