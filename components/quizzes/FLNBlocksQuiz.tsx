"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Settings2, CheckCircle2, ArrowRight, Play, RotateCcw } from 'lucide-react';

type OpType = 'add' | 'add_carry' | 'sub' | 'sub_borrow' | 'mult' | 'div';
type RangeType = '10' | '20' | '100';

const BLOCK_COLORS = [
    'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-indigo-500',
    'bg-fuchsia-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-violet-500'
];

// ============================================================================
// REUSABLE VISUAL COMPONENTS (Extracted to prevent re-render focus loss)
// ============================================================================
const getParts = (num: number) => ({
    h: Math.floor(num / 100),
    t: Math.floor((num % 100) / 10),
    o: num % 10
});

const HundredFlat = () => (
    <div className="w-[40px] h-[40px] md:w-[60px] md:h-[60px] shrink-0 bg-sky-400 rounded-sm border-2 border-sky-600 shadow-sm relative overflow-hidden animate-fade-in-up"
         style={{ backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '10% 10%' }}>
    </div>
);

const TenStick = ({ onClick, highlightType }: { onClick?: () => void, highlightType?: 'cut' | 'break' | 'none' }) => {
    let styles = "bg-emerald-400 border-emerald-600";
    if (highlightType === 'cut') styles = "bg-emerald-400 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)] cursor-pointer hover:scale-105 animate-pulse";
    if (highlightType === 'break') styles = "bg-amber-400 border-amber-600 shadow-[0_0_15px_rgba(251,191,36,0.6)] cursor-pointer hover:scale-105 animate-pulse";

    return (
        <div onClick={onClick} className={`w-[12px] h-[50px] md:w-[16px] md:h-[70px] shrink-0 rounded-sm border-2 shadow-sm relative overflow-hidden animate-fade-in-up transition-all ${styles}`}
             style={{ backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 1px, transparent 1px)', backgroundSize: '100% 10%' }}>
        </div>
    );
};

const SingleBlock = ({ index, onClick, isCuttable }: { index: number, onClick?: () => void, isCuttable?: boolean }) => {
    let styles = `${BLOCK_COLORS[index % 10]} border-black/20`;
    if (isCuttable) styles = `${BLOCK_COLORS[index % 10]} border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] cursor-pointer hover:scale-110 animate-pulse`;

    return (
        <div onClick={onClick} className={`w-[12px] h-[12px] md:w-[16px] md:h-[16px] rounded-sm border-2 shadow-sm shrink-0 animate-fade-in-up transition-all ${styles}`}></div>
    );
};

const BlockDisplay = ({ num }: { num: number }) => {
    const p = getParts(num);
    return (
        <div className="flex gap-2 md:gap-4 items-center justify-center flex-wrap max-w-full">
            {p.h > 0 && <div className="flex gap-1 flex-wrap justify-center">{Array.from({length: p.h}).map((_, i) => <HundredFlat key={`h-${i}`} />)}</div>}
            {p.t > 0 && <div className="flex gap-1 flex-wrap justify-center">{Array.from({length: p.t}).map((_, i) => <TenStick key={`t-${i}`} highlightType="none" />)}</div>}
            {p.o > 0 && (
                <div className="flex flex-wrap gap-[2px] max-w-[70px] md:max-w-[90px] content-center">
                    {Array.from({length: p.o}).map((_, i) => <SingleBlock key={`o-${i}`} index={i} />)}
                </div>
            )}
        </div>
    );
};

// "Cut" visual for Subtraction
const CutBlockDisplay = ({ num }: { num: number }) => (
    <div className="relative opacity-40 grayscale scale-95 transition-all">
        <BlockDisplay num={num} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[120%] h-1 md:h-2 bg-red-500 -rotate-12 rounded-full shadow-md"></div>
        </div>
    </div>
);

// 10x10 Grid Engine for Multiplication and Division
const Grid10x10 = ({ total, groupSize, groups, isDiv }: { total: number, groupSize: number, groups: number, isDiv: boolean }) => {
    return (
        <div className="w-[180px] h-[180px] md:w-[240px] md:h-[240px] grid grid-cols-10 grid-rows-10 gap-[2px] bg-slate-900 p-2 rounded-xl border-2 border-slate-700 mx-auto shadow-inner">
            {Array.from({length: 100}).map((_, i) => {
                let colorClass = 'bg-slate-800'; 
                if (isDiv) {
                    if (i < total) {
                        if (i < groups * groupSize) colorClass = BLOCK_COLORS[Math.floor(i / groupSize) % 10]; // Grouped
                        else colorClass = 'bg-slate-500'; // Brought but ungrouped
                    }
                } else {
                    if (i < groups * groupSize) colorClass = BLOCK_COLORS[Math.floor(i / groupSize) % 10];
                }
                return <div key={i} className={`w-full h-full rounded-[2px] ${colorClass} transition-colors duration-300 shadow-sm`}></div>
            })}
        </div>
    )
}

const VerticalTenOnes = ({ onClick }: { onClick: () => void }) => (
    <div onClick={onClick} className="flex flex-col gap-[2px] p-1 rounded-md border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-pulse cursor-pointer hover:scale-105 shrink-0 transition-transform">
        {Array.from({length: 10}).map((_, i) => <SingleBlock key={i} index={i} />)}
    </div>
);

const InputBox = ({ value, onChange, width = "w-12 md:w-20", ph = "", isGlowing = false }: any) => (
    <input 
        type="text" inputMode="numeric" placeholder={ph} value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${width} h-10 md:h-14 text-center font-black text-lg md:text-3xl rounded-xl border-2 bg-slate-800 text-white transition-all outline-none placeholder:text-slate-600
            ${isGlowing ? 'border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]' : 'border-slate-500 focus:border-sky-400 focus:shadow-[0_0_15px_rgba(56,189,248,0.3)]'}`}
    />
);

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function BlocksQuiz({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<'config' | 'playing'>('config');
    const [selectedOps, setSelectedOps] = useState<OpType[]>(['add', 'sub']);
    const [selectedRange, setSelectedRange] = useState<RangeType>('20');
    
    const [score, setScore] = useState(0);
    const [qData, setQData] = useState<{ a: number, op: string, b: number, c: number, type: OpType } | null>(null);
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [mounted, setMounted] = useState(false);
    
    // Action State Machine
    const [actionState, setActionState] = useState({
        carryDone: false,
        cutT: 0, cutO: 0, unpackedT: 0,
        multGroups: 0,
        divBrought: false, divGroups: 0
    });

    const [inputs, setInputs] = useState({ step1A: '', step1B: '', h: '', t: '', o: '', eqA: '', eqB: '', eqC: '' });

    useEffect(() => { setMounted(true); }, []);

    // --- Audio Engine ---
    const audioCtx = useRef<AudioContext | null>(null);
    const playSound = (type: 'pop' | 'kaching' | 'error' | 'click' | 'whoosh' | 'break' | 'magic') => {
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
            else if (type === 'break') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3); gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); } 
            else if (type === 'magic') { osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.3); gain.gain.setValueAtTime(0.15, ctx.currentTime); }
            
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + (type === 'kaching' ? 0.4 : 0.3));
        } catch(e) {}
    };

    const generateQuestion = () => {
        const max = parseInt(selectedRange);
        let valid = false;
        let a = 0, b = 0, c = 0;
        let opType = selectedOps[Math.floor(Math.random() * selectedOps.length)];
        let opSign = '+';
        let attempts = 0;

        while (!valid && attempts < 200) {
            attempts++;
            if (opType === 'add' || opType === 'add_carry') {
                a = Math.floor(Math.random() * (max - 1)) + 1;
                b = Math.floor(Math.random() * (max - a)) + 1;
                c = a + b;
                opSign = '+';
                const isCarry = (a % 10 + b % 10 >= 10);
                if (opType === 'add' && !isCarry) valid = true;
                if (opType === 'add_carry' && isCarry) valid = true;
                
            } else if (opType === 'sub' || opType === 'sub_borrow') {
                a = Math.floor(Math.random() * max) + 1;
                b = Math.floor(Math.random() * a) + 1;
                c = a - b;
                opSign = '−';
                const isBorrow = (a % 10 < b % 10);
                if (opType === 'sub' && !isBorrow) valid = true;
                if (opType === 'sub_borrow' && isBorrow) valid = true;

            } else if (opType === 'mult') {
                a = Math.floor(Math.random() * 9) + 2; // 2 to 10 max
                b = Math.floor(Math.random() * 9) + 2; // 2 to 10 max
                c = a * b;
                opSign = '×';
                if (c <= max) valid = true;

            } else if (opType === 'div') {
                b = Math.floor(Math.random() * 9) + 2; // Divisor 2 to 10
                c = Math.floor(Math.random() * 9) + 2; // Quotient 2 to 10
                a = b * c;
                opSign = '÷';
                if (a <= max) valid = true;
            }
        }

        if (!valid) { 
            const fop = selectedOps[0] || 'add';
            if (fop.includes('sub')) { a = 15; b = 8; c = 7; opSign = '−'; opType = 'sub_borrow'; }
            else if (fop.includes('mult')) { a = 7; b = 6; c = 42; opSign = '×'; opType = 'mult'; }
            else if (fop.includes('div')) { a = 64; b = 8; c = 8; opSign = '÷'; opType = 'div'; }
            else { a = 8; b = 5; c = 13; opSign = '+'; opType = 'add_carry'; }
        }

        setQData({ a, op: opSign, b, c, type: opType });
        setInputs({ step1A: '', step1B: '', h: '', t: '', o: '', eqA: '', eqB: '', eqC: '' });
        setActionState({ carryDone: false, cutT: 0, cutO: 0, unpackedT: 0, multGroups: 0, divBrought: false, divGroups: 0 });
        setFeedback('idle');
    };

    const handleStart = () => {
        if (selectedOps.length === 0) return alert("Select at least one operation!");
        playSound('whoosh');
        generateQuestion();
        setPhase('playing');
    };

    const handleInputChange = (field: keyof typeof inputs, val: string) => {
        playSound('pop');
        const numVal = val.replace(/[^0-9]/g, '').substring(0, 4);
        setInputs(prev => ({ ...prev, [field]: numVal }));
    };

    const handleCheckAnswer = () => {
        if (!qData) return;
        const resParts = getParts(qData.c);
        const requireH = qData.c >= 100;
        const requireT = qData.c >= 10;
        const isAdd = qData.type.includes('add');

        const isCorrect = 
            (isAdd ? Number(inputs.step1A) === qData.a : true) &&
            (isAdd ? Number(inputs.step1B) === qData.b : true) &&
            (requireH ? Number(inputs.h || 0) === resParts.h : true) &&
            (requireT ? Number(inputs.t || 0) === resParts.t : true) &&
            Number(inputs.o || 0) === resParts.o &&
            Number(inputs.eqA) === qData.a &&
            Number(inputs.eqB) === qData.b &&
            Number(inputs.eqC) === qData.c;

        if (isCorrect) {
            playSound('kaching');
            setFeedback('correct');
            setScore(s => s + 1);
            setTimeout(() => { generateQuestion(); }, 2000);
        } else {
            playSound('error');
            setFeedback('wrong');
            setTimeout(() => setFeedback('idle'), 1500);
        }
    };

    const toggleOp = (op: OpType) => {
        playSound('click');
        setSelectedOps(prev => prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op]);
    };

    const isActionComplete = () => {
        if (!qData) return false;
        if (qData.type === 'add_carry') return actionState.carryDone;
        if (qData.type.includes('sub')) return actionState.cutT === Math.floor(qData.b/10) && actionState.cutO === qData.b%10;
        if (qData.type === 'mult') return actionState.multGroups === qData.b;
        if (qData.type === 'div') return actionState.divBrought && actionState.divGroups === qData.c;
        return true; 
    };

    // Subtraction Logic Hooks
    const handleSubClick = (type: 'ten' | 'one') => {
        if (!qData) return;
        const targetT = Math.floor(qData.b / 10);
        const targetO = qData.b % 10;
        const remT = targetT - actionState.cutT;
        const remO = targetO - actionState.cutO;
        const invO = (qData.a % 10) + (actionState.unpackedT * 10) - actionState.cutO;

        if (type === 'ten') {
            if (remO > 0 && invO === 0) {
                playSound('break');
                setActionState(p => ({ ...p, unpackedT: p.unpackedT + 1 }));
            } else if (remT > 0) {
                playSound('whoosh');
                setActionState(p => ({ ...p, cutT: p.cutT + 1 }));
            }
        } else if (type === 'one') {
            if (remO > 0) {
                playSound('whoosh');
                setActionState(p => ({ ...p, cutO: p.cutO + 1 }));
            }
        }
    };

    if (!mounted) return null;

    // ============================================================================
    // RENDER: CONFIGURATION
    // ============================================================================
    if (phase === 'config') {
        const opConfig = [
            { id: 'add', label: 'Addition', icon: '+', color: 'bg-emerald-500' },
            { id: 'add_carry', label: 'Add (Carry)', icon: '++', color: 'bg-teal-500' },
            { id: 'sub', label: 'Subtraction', icon: '−', color: 'bg-rose-500' },
            { id: 'sub_borrow', label: 'Sub (Borrow)', icon: '−−', color: 'bg-pink-500' },
            { id: 'mult', label: 'Multiply', icon: '×', color: 'bg-amber-500' },
            { id: 'div', label: 'Divide', icon: '÷', color: 'bg-sky-500' }
        ];

        return (
            <div className="w-full h-full min-h-[500px] flex flex-col bg-slate-900 font-sans md:rounded-3xl p-4 md:p-6 relative overflow-y-auto">
                <div className="text-center mb-6 shrink-0 relative z-10">
                    <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-1">Universal Blocks Quiz</h1>
                </div>

                <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full gap-6 z-10">
                    <div className="w-full">
                        <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-3 text-center">1. Select Operations</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {opConfig.map(op => {
                                const isActive = selectedOps.includes(op.id as OpType);
                                return (
                                    <button key={op.id} onClick={() => toggleOp(op.id as OpType)}
                                        className={`p-2 md:p-3 rounded-xl border-2 transition-all flex items-center gap-2
                                            ${isActive ? `${op.color} border-white shadow-lg` : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-sm ${isActive ? 'bg-white/20 text-white' : 'bg-slate-700'}`}>{op.icon}</div>
                                        <span className={`font-bold text-xs md:text-sm text-left leading-tight ${isActive ? 'text-white' : ''}`}>{op.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-full">
                        <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-3 text-center">2. Select Range</h3>
                        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                            {['10', '20', '100'].map(r => (
                                <button key={r} onClick={() => { playSound('click'); setSelectedRange(r as RangeType); }}
                                    className={`py-3 rounded-xl border-2 transition-all font-black text-sm md:text-lg
                                        ${selectedRange === r ? 'bg-sky-500 border-white text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-center z-10 shrink-0">
                    <button onClick={handleStart} className="bg-lime-500 text-slate-950 px-8 py-4 rounded-xl font-black text-lg md:text-xl shadow-[0_4px_0_rgb(101,163,13)] hover:bg-lime-400 active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2">
                        <Play fill="currentColor" size={20}/> Start Quiz
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PLAYING
    // ============================================================================
    if (phase === 'playing' && qData) {
        const isAdd = qData.type.includes('add');
        const isSub = qData.type.includes('sub');
        const isMult = qData.type === 'mult';
        const isDiv = qData.type === 'div';
        
        const showH = qData.c >= 100;
        const showT = qData.c >= 10;
        const actionDone = isActionComplete();

        // Subtraction Pre-Calcs
        const targetT = Math.floor(qData.b / 10);
        const targetO = qData.b % 10;
        const remT = targetT - actionState.cutT;
        const remO = targetO - actionState.cutO;
        const invT = Math.floor(qData.a / 10) - actionState.cutT - actionState.unpackedT;
        const invO = (qData.a % 10) + (actionState.unpackedT * 10) - actionState.cutO;

        return (
            <div className="w-full h-full flex flex-col bg-slate-900 font-sans md:rounded-3xl overflow-hidden relative selection:bg-sky-500/30">
                
                {/* Floating Tools */}
                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-40 flex items-center gap-2">
                    <button onClick={() => setPhase('config')} className="bg-slate-800 text-slate-300 p-2 md:p-3 rounded-xl hover:bg-slate-700 hover:text-white border-2 border-slate-700 shadow-md">
                        <Settings2 size={18} className="md:w-6 md:h-6"/>
                    </button>
                    <div className="px-3 py-1 bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 font-black rounded-xl text-xs md:text-sm">Score: {score}</div>
                </div>

                {feedback !== 'idle' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in pointer-events-none">
                        <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center shadow-2xl animate-bounce ${feedback === 'correct' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {feedback === 'correct' ? <CheckCircle2 size={64}/> : <RotateCcw size={64}/>}
                        </div>
                    </div>
                )}

                {/* MAIN WORKSPACE */}
                <div className="flex-1 overflow-y-auto p-2 pt-16 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-2 lg:gap-4 items-stretch justify-center">
                    
                    {/* CONDITION 1: SUBTRACTION (Unified Take Away Panel) */}
                    {isSub && (
                        <div className="flex-[2] bg-slate-800 rounded-2xl border-2 border-slate-700 p-3 md:p-5 flex flex-col shadow-lg relative min-h-[220px]">
                            <span className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Step 1 & 2: Take Away</span>
                            
                            <div className="flex-1 flex flex-col items-center justify-center mt-6 w-full gap-4">
                                <div className="text-xl md:text-3xl font-black text-slate-300 bg-slate-900 px-6 py-2 rounded-xl border-2 border-slate-700 shadow-inner flex items-center gap-4">
                                    <span>{qData.a}</span> <span className="text-rose-400">−</span> <span>{qData.b}</span>
                                </div>
                                
                                {!actionDone ? (
                                    <div className="flex flex-col items-center gap-4 w-full">
                                        <div className="text-rose-400 font-bold bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20 text-center text-xs md:text-sm">
                                            Tap blocks to cut them! Need to cut: <br/> 
                                            <span className="text-white">{remT} Tens</span> and <span className="text-white">{remO} Ones</span>
                                        </div>
                                        
                                        {/* Interactive Inventory */}
                                        <div className="flex gap-2 md:gap-4 items-center justify-center flex-wrap max-w-full min-h-[80px]">
                                            {invT > 0 && <div className="flex gap-1 flex-wrap justify-center">
                                                {Array.from({length: invT}).map((_, i) => (
                                                    <TenStick key={`t-${i}`} 
                                                        highlightType={(remO > 0 && invO === 0) ? 'break' : (remT > 0 ? 'cut' : 'none')}
                                                        onClick={() => handleSubClick('ten')} 
                                                    />
                                                ))}
                                            </div>}
                                            {invO > 0 && <div className="flex flex-wrap gap-[2px] max-w-[70px] md:max-w-[90px] content-center">
                                                {Array.from({length: invO}).map((_, i) => (
                                                    <SingleBlock key={`o-${i}`} index={i} 
                                                        isCuttable={remO > 0}
                                                        onClick={() => handleSubClick('one')} 
                                                    />
                                                ))}
                                            </div>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-6 animate-fade-in w-full mt-auto">
                                        <div className="flex flex-row flex-wrap items-center justify-center gap-6 md:gap-12 w-full min-h-[80px]">
                                            <div className="flex flex-col items-center">
                                                <span className="text-emerald-400 font-bold text-xs md:text-sm mb-2 uppercase tracking-widest">Remaining</span>
                                                <BlockDisplay num={qData.c} />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-rose-400 font-bold text-xs md:text-sm mb-2 uppercase tracking-widest">Cut Away</span>
                                                <CutBlockDisplay num={qData.b} />
                                            </div>
                                        </div>
                                        {/* Dynamic Counts */}
                                        <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900/80 p-3 md:p-4 rounded-xl border border-slate-700 w-full">
                                            <span className="text-slate-400 font-bold text-xs md:text-sm mr-2 uppercase tracking-widest text-center">Count Remaining:</span>
                                            {showH && <div className="flex items-center gap-1 text-slate-400 font-bold"><InputBox value={inputs.h} onChange={(v: string) => handleInputChange('h', v)} ph="0"/> H</div>}
                                            {showT && <div className="flex items-center gap-1 text-slate-400 font-bold"><InputBox value={inputs.t} onChange={(v: string) => handleInputChange('t', v)} ph="0"/> T</div>}
                                            <div className="flex items-center gap-1 text-slate-400 font-bold"><InputBox value={inputs.o} onChange={(v: string) => handleInputChange('o', v)} ph="0"/> O</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CONDITION 2: MULTIPLICATION (10x10 Matrix) */}
                    {isMult && (
                        <div className="flex-[2] bg-slate-800 rounded-2xl border-2 border-slate-700 p-3 md:p-5 flex flex-col shadow-lg relative min-h-[220px]">
                            <span className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Step 1 & 2: Build Groups</span>
                            <div className="flex-1 flex flex-col items-center justify-center mt-6 w-full gap-4">
                                <div className="text-xl md:text-3xl font-black text-slate-300 bg-slate-900 px-6 py-2 rounded-xl border-2 border-slate-700 shadow-inner flex gap-4">
                                    <span>{qData.a}</span> <span className="text-amber-400">×</span> <span>{qData.b}</span>
                                </div>

                                <Grid10x10 total={0} groupSize={qData.a} groups={actionState.multGroups} isDiv={false} />

                                {!actionDone ? (
                                    <button 
                                        onClick={() => { playSound('magic'); setActionState(p => ({...p, multGroups: p.multGroups + 1})); }} 
                                        className="bg-amber-500 text-white px-6 md:px-10 py-3 rounded-xl font-black hover:bg-amber-400 shadow-[0_4px_0_rgb(245,158,11)] active:translate-y-[4px] active:shadow-none animate-pulse"
                                    >
                                        Add {qData.a} (Tap {qData.b - actionState.multGroups} more times)
                                    </button>
                                ) : (
                                    <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-700 mt-auto animate-fade-in w-full">
                                        <span className="text-slate-400 font-bold text-xs md:text-sm mr-2 uppercase tracking-widest text-center">Count Total:</span>
                                        {showH && <div className="flex items-center gap-1 text-slate-400 font-bold"><InputBox value={inputs.h} onChange={(v: string) => handleInputChange('h', v)} ph="0"/> H</div>}
                                        {showT && <div className="flex items-center gap-1 text-slate-400 font-bold"><InputBox value={inputs.t} onChange={(v: string) => handleInputChange('t', v)} ph="0"/> T</div>}
                                        <div className="flex items-center gap-1 text-slate-400 font-bold"><InputBox value={inputs.o} onChange={(v: string) => handleInputChange('o', v)} ph="0"/> O</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CONDITION 3: DIVISION (10x10 Matrix) */}
                    {isDiv && (
                        <div className="flex-[2] bg-slate-800 rounded-2xl border-2 border-slate-700 p-3 md:p-5 flex flex-col shadow-lg relative min-h-[220px]">
                            <span className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Step 1 & 2: Divide Matrix</span>
                            <div className="flex-1 flex flex-col items-center justify-center mt-6 w-full gap-4">
                                <div className="text-xl md:text-3xl font-black text-slate-300 bg-slate-900 px-6 py-2 rounded-xl border-2 border-slate-700 shadow-inner flex gap-4">
                                    <span>{qData.a}</span> <span className="text-sky-400">÷</span> <span>{qData.b}</span>
                                </div>

                                <Grid10x10 total={qData.a} groupSize={qData.b} groups={actionState.divGroups} isDiv={actionState.divBrought} />

                                {!actionState.divBrought ? (
                                    <button 
                                        onClick={() => { playSound('pop'); setActionState(p => ({...p, divBrought: true})); }} 
                                        className="bg-slate-500 text-white px-6 md:px-10 py-3 rounded-xl font-black hover:bg-slate-400 shadow-[0_4px_0_rgb(100,116,139)] active:translate-y-[4px] active:shadow-none transition-all"
                                    >
                                        Bring {qData.a} Blocks
                                    </button>
                                ) : !actionDone ? (
                                    <button 
                                        onClick={() => { playSound('magic'); setActionState(p => ({...p, divGroups: p.divGroups + 1})); }} 
                                        className="bg-sky-500 text-white px-6 md:px-10 py-3 rounded-xl font-black hover:bg-sky-400 shadow-[0_4px_0_rgb(14,165,233)] active:translate-y-[4px] active:shadow-none animate-pulse"
                                    >
                                        Group by {qData.b}
                                    </button>
                                ) : (
                                    <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-700 mt-auto animate-fade-in w-full">
                                        <span className="text-slate-400 font-bold text-xs md:text-sm mr-2 uppercase tracking-widest text-center">Count Groups:</span>
                                        {showH && <div className="flex items-center gap-1 text-slate-400 font-bold"><InputBox value={inputs.h} onChange={(v: string) => handleInputChange('h', v)} ph="0"/> H</div>}
                                        {showT && <div className="flex items-center gap-1 text-slate-400 font-bold"><InputBox value={inputs.t} onChange={(v: string) => handleInputChange('t', v)} ph="0"/> T</div>}
                                        <div className="flex items-center gap-1 text-slate-400 font-bold"><InputBox value={inputs.o} onChange={(v: string) => handleInputChange('o', v)} ph="0"/> O</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CONDITION 4: ADDITION (Standard 2 Columns) */}
                    {isAdd && (
                        <>
                            {/* COLUMN 1: The Problem */}
                            <div className="flex-1 bg-slate-800 rounded-2xl border-2 border-slate-700 p-3 md:p-5 flex flex-col shadow-lg relative min-h-[160px]">
                                <span className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Step 1: The Problem</span>
                                
                                <div className="flex-1 flex flex-row items-center justify-between w-full mt-6 md:mt-8 gap-2">
                                    <div className="flex-1 flex flex-col items-center h-full justify-between gap-3">
                                        <div className="flex-1 flex items-center justify-center w-full"><BlockDisplay num={qData.a} /></div>
                                        <div className="mt-auto"><InputBox value={inputs.step1A} onChange={(v: string) => handleInputChange('step1A', v)} isGlowing={inputs.step1A === ''} /></div>
                                    </div>
                                    <div className="text-2xl md:text-4xl font-black text-sky-400 shrink-0 px-2">{qData.op}</div>
                                    <div className="flex-1 flex flex-col items-center h-full justify-between gap-3">
                                        <div className="flex-1 flex items-center justify-center w-full"><BlockDisplay num={qData.b} /></div>
                                        <div className="mt-auto"><InputBox value={inputs.step1B} onChange={(v: string) => handleInputChange('step1B', v)} isGlowing={inputs.step1B === ''} /></div>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMN 2: Resulting Blocks with Manual Carry Logic */}
                            <div className="flex-[1.2] bg-slate-800 rounded-2xl border-2 border-slate-700 p-3 md:p-5 flex flex-col shadow-lg relative min-h-[160px]">
                                <span className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Step 2: Resulting Blocks</span>
                                
                                <div className="flex-1 flex items-center justify-center w-full mt-6 md:mt-8 mb-4 overflow-hidden">
                                    {qData.type === 'add_carry' && !actionDone ? (
                                        <div className="flex gap-2 md:gap-4 items-center justify-center flex-wrap max-w-full">
                                            {getParts(qData.a + qData.b).h > 0 && <div className="flex gap-1 flex-wrap justify-center">{Array.from({length: getParts(qData.c).h}).map((_, i) => <HundredFlat key={`h-${i}`} />)}</div>}
                                            {Math.floor((qData.a%100)/10) + Math.floor((qData.b%100)/10) > 0 && <div className="flex gap-1 flex-wrap justify-center">{Array.from({length: Math.floor((qData.a%100)/10) + Math.floor((qData.b%100)/10)}).map((_, i) => <TenStick key={`t-${i}`} highlightType="none" />)}</div>}
                                            {/* The Manual Carry Object */}
                                            <VerticalTenOnes onClick={() => { playSound('magic'); setActionState(p => ({...p, carryDone: true})); }} />
                                            {/* The leftovers */}
                                            {((qData.a%10) + (qData.b%10)) - 10 > 0 && (
                                                <div className="flex flex-wrap gap-[2px] max-w-[70px] md:max-w-[90px] content-center">
                                                    {Array.from({length: ((qData.a%10) + (qData.b%10)) - 10}).map((_, i) => <SingleBlock key={`o-${i}`} index={i} />)}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <BlockDisplay num={qData.c} />
                                    )}
                                </div>

                                <div className="mt-auto w-full flex flex-wrap items-center justify-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-700 text-xs md:text-base font-bold text-slate-400">
                                    {showH && <div className="flex items-center gap-1"><InputBox value={inputs.h} onChange={(v: string) => handleInputChange('h', v)} ph="0"/> <span className="hidden sm:inline">Hunds</span><span className="sm:hidden">H</span></div>}
                                    {showT && <div className="flex items-center gap-1"><InputBox value={inputs.t} onChange={(v: string) => handleInputChange('t', v)} ph="0"/> <span className="hidden sm:inline">Tens</span><span className="sm:hidden">T</span></div>}
                                    <div className="flex items-center gap-1"><InputBox value={inputs.o} onChange={(v: string) => handleInputChange('o', v)} ph="0"/> <span className="hidden sm:inline">Ones</span><span className="sm:hidden">O</span></div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* COLUMN 3: The Vertical Equation (Always strictly bottom-aligned) */}
                    <div className="flex-[0.8] bg-slate-800 rounded-2xl border-2 border-slate-700 p-3 md:p-5 flex flex-col shadow-lg relative min-h-[160px]">
                        <span className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Step 3: Equation</span>
                        
                        <div className="mt-auto bg-slate-900/80 p-4 md:p-6 rounded-xl border border-slate-700 flex justify-center">
                            <div className="flex flex-col items-end gap-2 md:gap-3 text-2xl md:text-4xl font-black">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <span className="text-transparent w-6 md:w-8">{qData.op}</span>
                                    <InputBox value={inputs.eqA} onChange={(v: string) => handleInputChange('eqA', v)} width="w-16 md:w-24" />
                                </div>
                                <div className="flex items-center gap-3 md:gap-4 border-b-4 border-slate-500 pb-4">
                                    <span className={`w-6 md:w-8 text-right ${isAdd ? 'text-sky-400' : isSub ? 'text-rose-400' : isMult ? 'text-amber-400' : 'text-indigo-400'}`}>{qData.op}</span>
                                    <InputBox value={inputs.eqB} onChange={(v: string) => handleInputChange('eqB', v)} width="w-16 md:w-24" />
                                </div>
                                <div className="flex items-center gap-3 md:gap-4 pt-2">
                                    <span className="text-transparent w-6 md:w-8">{qData.op}</span>
                                    <InputBox value={inputs.eqC} onChange={(v: string) => handleInputChange('eqC', v)} width="w-16 md:w-24" isGlowing={actionDone} />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Submit */}
                <div className="shrink-0 p-3 md:p-4 bg-slate-900 flex justify-center z-20">
                    <button 
                        onClick={handleCheckAnswer}
                        disabled={!actionDone}
                        className={`w-full max-w-sm px-6 py-4 rounded-xl font-black text-lg tracking-wide transition-all flex items-center justify-center gap-2 
                            ${!actionDone ? 'bg-slate-700 text-slate-500 border-2 border-slate-600 cursor-not-allowed shadow-none' : 'bg-sky-500 text-white hover:bg-sky-400 shadow-[0_4px_0_rgb(14,165,233)] active:translate-y-[4px] active:shadow-none'}`}
                    >
                        Check Math <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return null;
}