"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Settings2, Play, Trophy, RotateCcw, Zap, Clock, Users, Hash, ArrowRight } from 'lucide-react';

type Operation = 'add_no_carry' | 'add_carry' | 'sub_no_carry' | 'sub_borrow' | 'mul' | 'div';
type Digits = 1 | 2;
type Players = 1 | 2 | 3;
type TimeLimit = 30 | 60 | 120;
type Phase = 'config' | 'playing' | 'results';

interface GameConfig {
    ops: Operation[];
    digits: Digits;
    players: Players;
    time: TimeLimit;
}

interface Question { id: string; qText: string; ans: number; }
interface Answer { id: string; aText: string; }

const DEFAULT_CONFIG: GameConfig = { ops: ['add_no_carry', 'sub_no_carry'], digits: 1, players: 1, time: 60 };

// --- Audio Engine ---
const playSound = (type: 'pop' | 'kaching' | 'error' | 'click' | 'whoosh' | 'buzzer', audioCtxRef: React.MutableRefObject<AudioContext | null>) => {
    if (typeof window === 'undefined') return;
    try {
        if (!audioCtxRef.current) {
            const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new WinAudioContext();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        if (type === 'pop') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.05, ctx.currentTime); } 
        else if (type === 'kaching') { osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3); gain.gain.setValueAtTime(0.1, ctx.currentTime); } 
        else if (type === 'error') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.1, ctx.currentTime); } 
        else if (type === 'click') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime); gain.gain.setValueAtTime(0.05, ctx.currentTime); }
        else if (type === 'whoosh') { osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.1, ctx.currentTime); }
        else if (type === 'buzzer') { osc.type = 'square'; osc.frequency.setValueAtTime(100, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5); gain.gain.setValueAtTime(0.2, ctx.currentTime); }
        
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + (type === 'buzzer' ? 0.5 : 0.2));
    } catch(e) {}
};

// --- Math Generation Engine ---
const generateQuestion = (ops: Operation[], digits: Digits, excludeAnswers: number[]): Question => {
    let valid = false;
    let qText = '', ans = 0;
    let attempts = 0;
    
    const getNum = (d: number) => {
        const min = Math.pow(10, d - 1);
        const max = Math.pow(10, d) - 1;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    while (!valid && attempts < 100) {
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a = 0, b = 0;

        if (op === 'add_no_carry') {
            let aStr = '', bStr = '';
            for (let i = 0; i < digits; i++) {
                const isMSB = i === digits - 1;
                let minA = isMSB ? 1 : 0;
                let maxA = isMSB ? 4 : 9;
                let aDig = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
                let minB = isMSB ? 1 : 0;
                let maxB = 9 - aDig; 
                let bDig = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
                aStr = aDig + aStr;
                bStr = bDig + bStr;
            }
            a = parseInt(aStr); b = parseInt(bStr); ans = a + b; qText = `${a} + ${b}`;
        } 
        else if (op === 'add_carry') {
            if (digits === 1) {
                a = Math.floor(Math.random() * 5) + 5; b = Math.floor(Math.random() * 5) + 5;
            } else {
                a = getNum(digits); b = getNum(digits);
            }
            ans = a + b; qText = `${a} + ${b}`;
        } 
        else if (op === 'sub_no_carry') {
            let aStr = '', bStr = '';
            for (let i = 0; i < digits; i++) {
                const isMSB = i === digits - 1;
                let minA = isMSB ? 2 : 0;
                let maxA = 9;
                let aDig = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
                let minB = isMSB ? 1 : 0;
                let maxB = aDig; 
                let bDig = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
                aStr = aDig + aStr; bStr = bDig + bStr;
            }
            a = parseInt(aStr); b = parseInt(bStr); ans = a - b; qText = `${a} − ${b}`;
        } 
        else if (op === 'sub_borrow') {
            if (digits === 1) {
                b = Math.floor(Math.random() * 8) + 2;
                const answer = Math.floor(Math.random() * 8) + 1;
                a = b + answer;
            } else {
                a = getNum(digits); b = getNum(digits);
                if (a < b) { let temp = a; a = b; b = temp; }
                if (a % 10 >= b % 10) a -= (a % 10) + 1; 
            }
            ans = a - b; qText = `${a} − ${b}`;
        } 
        else if (op === 'mul') {
            a = getNum(digits); 
            b = Math.floor(Math.random() * 8) + 2; 
            ans = a * b; qText = `${a} × ${b}`;
        } 
        else if (op === 'div') {
            ans = getNum(digits);
            b = Math.floor(Math.random() * 8) + 2;
            a = ans * b; qText = `${a} ÷ ${b}`;
        }
        
        if (!excludeAnswers.includes(ans)) valid = true;
        attempts++;
    }
    return { id: Math.random().toString(36).substring(2,9), qText, ans };
};

const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

// ============================================================================
// INDEPENDENT PLAYER BOARD COMPONENT
// ============================================================================
const PlayerBoard = ({ config, isActive, onScoreChange, audioCtxRef, isFlipped, playerId }: any) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [selectedQ, setSelectedQ] = useState<string | null>(null);
    const [selectedA, setSelectedA] = useState<string | null>(null);
    const [matchedIds, setMatchedIds] = useState<string[]>([]);
    const [wrongIds, setWrongIds] = useState<string[]>([]);
    const [score, setScore] = useState(0);

    // Initialize Board
    useEffect(() => {
        if (isActive && questions.length === 0) {
            let initialQs: Question[] = [];
            for (let i = 0; i < 4; i++) {
                initialQs.push(generateQuestion(config.ops, config.digits, initialQs.map(q => q.ans)));
            }
            setQuestions(initialQs);
            setAnswers(shuffleArray(initialQs.map(q => ({ id: q.id, aText: q.ans.toString() }))));
            setScore(0);
        }
    }, [isActive]);

    // Evaluation Logic
    useEffect(() => {
        if (selectedQ && selectedA) {
            const qObj = questions.find(q => q.id === selectedQ);
            const aObj = answers.find(a => a.id === selectedA);
            
            if (qObj && aObj && qObj.ans.toString() === aObj.aText) {
                // MATCH!
                playSound('kaching', audioCtxRef);
                setMatchedIds([selectedQ, selectedA]);
                const newScore = score + 1;
                setScore(newScore);
                onScoreChange(playerId, newScore);

                setTimeout(() => {
                    // Generate 1 new question
                    const remainingAns = questions.filter(q => q.id !== selectedQ).map(q => q.ans);
                    const newQ = generateQuestion(config.ops, config.digits, remainingAns);
                    
                    setQuestions(prev => prev.map(q => q.id === selectedQ ? newQ : q));
                    setAnswers(prev => shuffleArray(prev.map(a => a.id === selectedA ? { id: newQ.id, aText: newQ.ans.toString() } : a)));
                    
                    setSelectedQ(null);
                    setSelectedA(null);
                    setMatchedIds([]);
                }, 400);
            } else {
                // WRONG!
                playSound('error', audioCtxRef);
                setWrongIds([selectedQ, selectedA]);
                setTimeout(() => {
                    setSelectedQ(null);
                    setSelectedA(null);
                    setWrongIds([]);
                }, 400);
            }
        }
    }, [selectedQ, selectedA]);

    const handleQClick = (id: string) => {
        if (!isActive || matchedIds.includes(id) || wrongIds.length > 0) return;
        playSound('click', audioCtxRef);
        setSelectedQ(id === selectedQ ? null : id);
    };

    const handleAClick = (id: string) => {
        if (!isActive || matchedIds.includes(id) || wrongIds.length > 0) return;
        playSound('click', audioCtxRef);
        setSelectedA(id === selectedA ? null : id);
    };

    if (questions.length === 0) return <div className="flex-1 bg-slate-900"></div>;

    return (
        <div className={`flex-1 flex flex-col p-4 w-full h-full relative ${isFlipped ? 'rotate-180 bg-slate-800' : 'bg-slate-900'}`}>
            <div className="flex justify-between items-center mb-4 shrink-0 px-2">
                <span className="text-slate-500 font-black uppercase tracking-widest text-xs md:text-sm">Player {playerId}</span>
                <div className="bg-sky-500/20 border-2 border-sky-500 text-sky-400 font-black px-4 py-1 rounded-full text-sm md:text-lg">Score: {score}</div>
            </div>

            <div className="flex-1 flex gap-2 md:gap-4 w-full max-w-4xl mx-auto h-full min-h-0">
                {/* Questions Column */}
                <div className="flex-1 flex flex-col gap-2 md:gap-4 h-full">
                    {questions.map((q) => {
                        const isSelected = selectedQ === q.id;
                        const isMatched = matchedIds.includes(q.id);
                        const isWrong = wrongIds.includes(q.id);
                        let styles = "bg-slate-800 border-slate-700 text-white hover:bg-slate-700";
                        if (isSelected) styles = "bg-sky-600 border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)] scale-105";
                        if (isMatched) styles = "bg-emerald-500 border-emerald-400 text-white scale-95 opacity-0 pointer-events-none"; 
                        if (isWrong && isSelected) styles = "bg-rose-600 border-rose-400 text-white animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.5)]";

                        return (
                            <button 
                                key={`q-${q.id}`} onClick={() => handleQClick(q.id)}
                                className={`flex-1 rounded-2xl border-4 font-black text-lg md:text-3xl lg:text-4xl transition-all duration-300 flex items-center justify-center shadow-md ${styles}`}
                            >
                                {q.qText}
                            </button>
                        );
                    })}
                </div>

                {/* Answers Column */}
                <div className="flex-1 flex flex-col gap-2 md:gap-4 h-full">
                    {answers.map((a) => {
                        const isSelected = selectedA === a.id;
                        const isMatched = matchedIds.includes(a.id);
                        const isWrong = wrongIds.includes(a.id);
                        let styles = "bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700";
                        if (isSelected) styles = "bg-sky-600 border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)] scale-105";
                        if (isMatched) styles = "bg-emerald-500 border-emerald-400 text-white scale-95 opacity-0 pointer-events-none"; 
                        if (isWrong && isSelected) styles = "bg-rose-600 border-rose-400 text-white animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.5)]";

                        return (
                            <button 
                                key={`a-${a.id}`} onClick={() => handleAClick(a.id)}
                                className={`flex-1 rounded-2xl border-4 font-black text-xl md:text-4xl lg:text-5xl transition-all duration-300 flex items-center justify-center shadow-md ${styles}`}
                            >
                                {a.aText}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function RapidFireArena({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<Phase>('config');
    const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
    const [timeLeft, setTimeLeft] = useState(0);
    const [scores, setScores] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });
    
    // Hardware Detection State
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => { 
        setMounted(true); 
        setIsMobile(window.innerWidth < 768);
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Timer Logic
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        playSound('buzzer', audioCtxRef);
                        setPhase('results');
                        return 0;
                    }
                    if (prev <= 6) playSound('click', audioCtxRef); // Tick down warning
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase, timeLeft]);

    const handleStart = () => {
        if (config.ops.length === 0) return alert("Select at least one operation!");
        playSound('whoosh', audioCtxRef);
        setScores({ 1: 0, 2: 0, 3: 0 });
        setTimeLeft(config.time);
        setPhase('playing');
    };

    const handleScoreChange = (player: number, newScore: number) => {
        setScores(prev => ({ ...prev, [player]: newScore }));
    };

    const toggleOp = (op: Operation) => {
        playSound('click', audioCtxRef);
        setConfig(prev => ({
            ...prev,
            ops: prev.ops.includes(op) ? prev.ops.filter(o => o !== op) : [...prev.ops, op]
        }));
    };

    if (!mounted) return null;

    // ============================================================================
    // RENDER: CONFIGURATION
    // ============================================================================
    if (phase === 'config') {
        const OP_BUTTONS: { op: Operation, label: string, color: string }[] = [
            { op: 'add_no_carry', label: 'Add (No Carry)', color: 'bg-emerald-500' },
            { op: 'add_carry', label: 'Add (Carry)', color: 'bg-emerald-600' },
            { op: 'sub_no_carry', label: 'Sub (No Borrow)', color: 'bg-rose-500' },
            { op: 'sub_borrow', label: 'Sub (Borrow)', color: 'bg-rose-600' },
            { op: 'mul', label: 'Multiply', color: 'bg-amber-500' },
            { op: 'div', label: 'Divide', color: 'bg-indigo-500' },
        ];

        const availablePlayers = isMobile ? [1, 2] : [1, 2, 3];

        return (
            <div className="w-full h-full min-h-[600px] flex flex-col bg-slate-900 font-sans md:rounded-3xl p-6 relative overflow-y-auto selection:bg-sky-500/30 text-white">
                <div className="text-center mb-8 shrink-0 animate-fade-in-up">
                    <div className="bg-sky-500 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(14,165,233,0.5)] transform rotate-12">
                        <Zap size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Rapid-Fire Arena</h1>
                    <p className="text-slate-400 font-bold text-lg">Configure your match settings!</p>
                </div>

                <div className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full gap-6">
                    {/* Operations */}
                    <div className="w-full bg-slate-800 p-4 md:p-6 rounded-3xl border-2 border-slate-700">
                        <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Zap size={14}/> 1. Select Operations</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {OP_BUTTONS.map(btn => (
                                <button key={btn.op} onClick={() => toggleOp(btn.op)} className={`p-2 md:p-3 rounded-xl border-4 font-black transition-all flex items-center justify-center text-sm md:text-base gap-2 ${config.ops.includes(btn.op) ? `${btn.color} border-white shadow-lg` : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Digits & Players */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-800 p-4 rounded-3xl border-2 border-slate-700">
                            <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Hash size={14}/> 2. Digits</h3>
                            <div className="flex gap-2">
                                {[1, 2].map(d => (
                                    <button key={d} onClick={() => { playSound('click', audioCtxRef); setConfig(p => ({ ...p, digits: d as Digits })); }} className={`flex-1 py-3 rounded-xl border-4 font-black transition-all ${config.digits === d ? 'bg-sky-500 border-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                        {d}-Digit
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-3xl border-2 border-slate-700">
                            <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Users size={14}/> 3. Players</h3>
                            <div className="flex gap-2">
                                {availablePlayers.map(p => (
                                    <button key={p} onClick={() => { playSound('click', audioCtxRef); setConfig(prev => ({ ...prev, players: p as Players })); }} className={`flex-1 py-3 rounded-xl border-4 font-black transition-all ${config.players === p ? 'bg-fuchsia-500 border-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                        {p} Player
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Time Limit */}
                    <div className="w-full bg-slate-800 p-4 rounded-3xl border-2 border-slate-700">
                        <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Clock size={14}/> 4. Time Limit</h3>
                        <div className="flex gap-2">
                            {[30, 60, 120].map(t => (
                                <button key={t} onClick={() => { playSound('click', audioCtxRef); setConfig(p => ({ ...p, time: t as TimeLimit })); }} className={`flex-1 py-3 rounded-xl border-4 font-black transition-all ${config.time === t ? 'bg-emerald-500 border-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                    {t} sec
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center shrink-0">
                    <button onClick={handleStart} className="w-full max-w-sm bg-sky-500 text-white px-8 py-5 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(14,165,233)] hover:bg-sky-400 active:translate-y-[6px] active:shadow-none transition-all flex items-center justify-center gap-3">
                        <Play fill="currentColor" /> Enter Arena
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PLAYING
    // ============================================================================
    if (phase === 'playing') {
        // Condition: Flipped Layout is ONLY for mobile/portrait mode with 2 players.
        const isHeadToHeadMobile = isMobile && config.players === 2;

        if (isHeadToHeadMobile) {
            return (
                <div className="w-full h-full flex flex-col font-sans md:rounded-3xl overflow-hidden relative bg-black selection:bg-sky-500/30">
                    <PlayerBoard config={config} isActive={true} onScoreChange={handleScoreChange} audioCtxRef={audioCtxRef} isFlipped={true} playerId={2} />
                    
                    {/* Central Divider & Timer */}
                    <div className="h-6 bg-slate-950 flex items-center justify-center relative z-20 shrink-0 shadow-[0_0_20px_rgba(0,0,0,1)]">
                        <div className={`absolute w-24 h-12 rounded-full border-4 border-slate-900 flex items-center justify-center font-black text-2xl shadow-xl transition-colors duration-300 ${timeLeft <= 10 ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-400 text-slate-900'}`}>
                            {timeLeft}s
                        </div>
                    </div>

                    <PlayerBoard config={config} isActive={true} onScoreChange={handleScoreChange} audioCtxRef={audioCtxRef} isFlipped={false} playerId={1} />
                </div>
            );
        } else {
            // Desktop/Tablet Landscape/Smartboard Mode: Side-by-Side Upright columns
            return (
                <div className="w-full h-full flex flex-col font-sans md:rounded-3xl overflow-hidden relative bg-black selection:bg-sky-500/30">
                    {/* Global Header Timer */}
                    <div className="shrink-0 h-16 bg-slate-800 border-b-4 border-slate-700 flex items-center justify-center z-20 relative">
                        <div className={`px-6 py-2 rounded-full border-4 border-slate-900 flex items-center justify-center font-black text-xl transition-colors duration-300 shadow-md ${timeLeft <= 10 ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-400 text-slate-900'}`}>
                            <Clock size={20} className="mr-2"/> {timeLeft} Seconds Left
                        </div>
                    </div>
                    
                    {/* Vertical Player Columns */}
                    <div className="flex-1 flex flex-row divide-x-8 divide-slate-950 min-h-0">
                        {Array.from({ length: config.players }).map((_, i) => (
                            <PlayerBoard key={i+1} config={config} isActive={true} onScoreChange={handleScoreChange} audioCtxRef={audioCtxRef} isFlipped={false} playerId={i+1} />
                        ))}
                    </div>
                </div>
            );
        }
    }

    // ============================================================================
    // RENDER: RESULTS
    // ============================================================================
    if (phase === 'results') {
        let maxScore = -1;
        let winners: number[] = [];
        
        for (let i = 1; i <= config.players; i++) {
            if (scores[i] > maxScore) { maxScore = scores[i]; winners = [i]; }
            else if (scores[i] === maxScore) { winners.push(i); }
        }

        let winnerText = "Time's Up!";
        let winnerColor = "text-amber-400";
        
        if (config.players > 1) {
            if (winners.length === 1) { 
                winnerText = `Player ${winners[0]} Wins!`; 
                winnerColor = "text-emerald-400"; 
            }
            else { 
                winnerText = "It's a Tie!"; 
                winnerColor = "text-fuchsia-400"; 
            }
        }

        return (
            <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-slate-900 font-sans md:rounded-3xl p-6 text-center animate-fade-in-up">
                <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl bg-amber-500 border-4 border-white text-white animate-bounce">
                    <Trophy size={64} />
                </div>
                <h2 className={`text-4xl md:text-6xl font-black mb-2 ${winnerColor}`}>{winnerText}</h2>
                <p className="text-slate-400 font-bold text-xl mb-12">Great matching skills!</p>
                
                <div className="flex flex-col md:flex-row gap-6 mb-12 flex-wrap justify-center">
                    {Array.from({ length: config.players }).map((_, i) => (
                        <div key={i+1} className="bg-slate-800 border-4 border-slate-700 px-8 py-6 rounded-3xl flex flex-col items-center shadow-lg">
                            <span className="text-slate-500 font-black uppercase tracking-widest text-sm mb-2">Player {i+1} Score</span>
                            <span className="text-5xl font-black text-white">{scores[i+1]}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setPhase('config')} className="bg-slate-800 text-white px-8 py-4 rounded-xl font-black text-lg shadow-lg hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-2">
                        <RotateCcw size={20}/> Play Again
                    </button>
                    {onComplete && (
                        <button onClick={onComplete} className="bg-sky-500 text-white px-8 py-4 rounded-xl font-black text-lg shadow-[0_4px_0_rgb(14,165,233)] hover:bg-sky-400 active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2">
                            Finish Lesson <ArrowRight size={20}/>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return null;
}