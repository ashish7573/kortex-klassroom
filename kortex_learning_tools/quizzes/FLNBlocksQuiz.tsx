"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Settings2, CheckCircle2, ArrowRight, ArrowDown, Play, RotateCcw, Volume2, Award, Sparkles, RefreshCw, Lock, ArrowLeft } from 'lucide-react';

type OpType = 'add' | 'add_carry' | 'sub' | 'sub_borrow' | 'mult' | 'div';
type RangeType = '10' | '20' | '100' | '1000';

const BLOCK_COLORS = [
    'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-indigo-500',
    'bg-fuchsia-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-violet-500'
];

// ============================================================================
// BASE-10 PLACE VALUE HELPERS
// ============================================================================
const getParts = (num: number) => ({
    th: Math.floor(num / 1000),
    h: Math.floor((num % 1000) / 100),
    t: Math.floor((num % 100) / 10),
    o: num % 10
});

// ============================================================================
// REAL SVG BASE-10 BLOCKS (One, Ten, Hundred, Thousand)
// ============================================================================
const ThousandBlock = ({ onClick, size = "md", className = "" }: { onClick?: () => void, size?: "sm" | "md" | "lg", className?: string }) => {
    const sizeClasses = size === "sm" ? "h-20 sm:h-[100px]" : size === "lg" ? "h-[180px] sm:h-[220px] md:h-[260px]" : "h-[130px] sm:h-40 md:h-[190px]";
    return (
        <div onClick={onClick} className={`flex flex-col items-center shrink-0 ${className}`}>
            <img 
                src="/assets/maths/FLN/Thousand.svg" 
                alt="1000 Block" 
                className={`${sizeClasses} w-auto object-contain drop-shadow select-none pointer-events-none`} 
            />
            <span className="text-[10px] font-black text-amber-400 mt-0.5">1000</span>
        </div>
    );
};

const HundredFlat = ({ onClick, size = "md", className = "" }: { onClick?: () => void, size?: "sm" | "md" | "lg", className?: string }) => {
    const sizeClasses = size === "sm" ? "h-20 sm:h-[100px]" : size === "lg" ? "h-[180px] sm:h-[220px] md:h-[260px]" : "h-[130px] sm:h-40 md:h-[190px]";
    return (
        <div onClick={onClick} className={`flex flex-col items-center shrink-0 ${className}`}>
            <img 
                src="/assets/maths/FLN/Hundred.svg" 
                alt="100 Flat" 
                className={`${sizeClasses} w-auto object-contain drop-shadow select-none pointer-events-none`} 
            />
            <span className="text-[10px] font-black text-sky-400 mt-0.5">100</span>
        </div>
    );
};

const TenRod = ({ onClick, highlightType = 'none', size = "md", className = "" }: { onClick?: () => void, highlightType?: 'cut' | 'break' | 'none', size?: "sm" | "md" | "lg", className?: string }) => {
    let extraStyles = "";
    if (highlightType === 'cut') extraStyles = "ring-2 ring-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)] cursor-pointer hover:scale-105 animate-pulse";
    if (highlightType === 'break') extraStyles = "ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)] cursor-pointer hover:scale-105 animate-pulse";
    const sizeClasses = size === "sm" ? "h-16 sm:h-20" : size === "lg" ? "h-36 sm:h-44 md:h-52" : "h-26 sm:h-32 md:h-38";

    return (
        <div onClick={onClick} className={`flex flex-col items-center shrink-0 rounded-lg p-0.5 transition-transform ${extraStyles} ${className}`}>
            <img 
                src="/assets/maths/FLN/Ten.svg" 
                alt="10 Rod" 
                className={`${sizeClasses} w-auto object-contain drop-shadow select-none pointer-events-none`} 
            />
            <span className="text-[10px] font-black text-emerald-400 mt-0.5">10</span>
        </div>
    );
};

const OneCube = ({ onClick, isCuttable = false, size = "md", className = "" }: { onClick?: () => void, isCuttable?: boolean, size?: "sm" | "md" | "lg", className?: string }) => {
    let extraStyles = "";
    if (isCuttable) extraStyles = "ring-2 ring-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)] cursor-pointer hover:scale-110 animate-pulse";
    const sizeClasses = size === "sm" ? "h-3 w-3 sm:h-3.5 sm:w-3.5" : size === "lg" ? "h-5 w-5 sm:h-6 sm:w-6" : "h-4 w-4 sm:h-4.5 sm:w-4.5";

    return (
        <div onClick={onClick} className={`flex flex-col items-center shrink-0 rounded-md p-0.5 transition-transform ${extraStyles} ${className}`}>
            <img 
                src="/assets/maths/FLN/One.svg" 
                alt="1 Cube" 
                className={`${sizeClasses} object-contain drop-shadow select-none pointer-events-none`} 
            />
            <span className="text-[9px] font-black text-amber-300">1</span>
        </div>
    );
};

// Bundle 10 Ones into 1 Ten interactive element
const RegroupTenOnes = ({ onClick }: { onClick: () => void }) => (
    <button 
        type="button"
        onClick={onClick}
        className="flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
        title="Tap to bundle 10 ones into 1 Ten rod"
    >
        <span className="text-[10px] sm:text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} className="text-amber-400" /> Tap 10 Ones to Bundle!
        </span>
        <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-900/50 rounded-lg">
            {Array.from({ length: 10 }).map((_, i) => (
                <img key={i} src="/assets/maths/FLN/One.svg" alt="1" className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain" />
            ))}
        </div>
        <span className="text-[9px] font-bold text-amber-200">10 Ones → 1 Ten</span>
    </button>
);

// Comprehensive Block Display for Any Number
const BlockDisplay = ({ num, size = "md" }: { num: number, size?: "sm" | "md" | "lg" }) => {
    const p = getParts(num);
    return (
        <div className="flex gap-2 sm:gap-3 items-center justify-center flex-wrap max-w-full">
            {p.th > 0 && (
                <div className="flex gap-1 flex-wrap justify-center items-end">
                    {Array.from({ length: p.th }).map((_, i) => (
                        <ThousandBlock key={`th-${i}`} size={size} />
                    ))}
                </div>
            )}
            {p.h > 0 && (
                <div className="flex gap-1 flex-wrap justify-center items-end">
                    {Array.from({ length: p.h }).map((_, i) => (
                        <HundredFlat key={`h-${i}`} size={size} />
                    ))}
                </div>
            )}
            {p.t > 0 && (
                <div className="flex gap-1 flex-wrap justify-center items-end">
                    {Array.from({ length: p.t }).map((_, i) => (
                        <TenRod key={`t-${i}`} highlightType="none" size={size} />
                    ))}
                </div>
            )}
            {p.o > 0 && (
                <div className="flex flex-wrap gap-1 max-w-[80px] sm:max-w-[100px] justify-center items-end content-center">
                    {Array.from({ length: p.o }).map((_, i) => (
                        <OneCube key={`o-${i}`} size={size} />
                    ))}
                </div>
            )}
            {num === 0 && (
                <span className="text-xs font-bold text-slate-500 italic py-2">0 (Zero)</span>
            )}
        </div>
    );
};

// "Cut" visual for Subtraction
const CutBlockDisplay = ({ num }: { num: number }) => (
    <div className="relative opacity-50 grayscale scale-95 transition-all">
        <BlockDisplay num={num} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[110%] h-1 bg-rose-500 -rotate-12 rounded-full shadow-md"></div>
        </div>
    </div>
);

// 10x10 Grid Engine for Multiplication and Division
const Grid10x10 = ({ total, groupSize, groups, isDiv }: { total: number, groupSize: number, groups: number, isDiv: boolean }) => {
    return (
        <div className="w-[170px] h-[170px] sm:w-[210px] sm:h-[210px] md:w-[240px] md:h-[240px] grid grid-cols-10 grid-rows-10 gap-[2px] bg-slate-950 p-2 rounded-xl border-2 border-slate-700 mx-auto shadow-inner">
            {Array.from({ length: 100 }).map((_, i) => {
                let colorClass = 'bg-slate-800'; 
                if (isDiv) {
                    if (i < total) {
                        if (i < groups * groupSize) colorClass = BLOCK_COLORS[Math.floor(i / groupSize) % 10]; // Grouped
                        else colorClass = 'bg-slate-500'; // Brought but ungrouped
                    }
                } else {
                    if (i < groups * groupSize) colorClass = BLOCK_COLORS[Math.floor(i / groupSize) % 10];
                }
                return <div key={i} className={`w-full h-full rounded-[2px] ${colorClass} transition-colors duration-300 shadow-xs`}></div>;
            })}
        </div>
    );
};

const InputBox = ({ value, onChange, width = "w-11 sm:w-14 md:w-18", ph = "", isGlowing = false }: any) => (
    <input 
        type="text" 
        inputMode="numeric" 
        placeholder={ph} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${width} h-8 sm:h-9 md:h-11 text-center font-black text-base sm:text-lg md:text-xl rounded-lg sm:rounded-xl border-2 bg-slate-900 text-white transition-all outline-none placeholder:text-slate-600
            ${isGlowing ? 'border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]' : 'border-slate-600 focus:border-sky-400'}`}
    />
);

// ============================================================================
// MAIN FLN BLOCKS QUIZ COMPONENT
// ============================================================================
export default function FLNBlocksQuiz({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<'config' | 'playing' | 'completed'>('config');
    const [selectedOps, setSelectedOps] = useState<OpType[]>(['add', 'sub']);
    const [selectedRange, setSelectedRange] = useState<RangeType>('20');
    
    // Session State
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const TOTAL_QUESTIONS = 5;

    const [qData, setQData] = useState<{ a: number, op: string, b: number, c: number, type: OpType } | null>(null);
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [mounted, setMounted] = useState(false);
    
    // Action State Machine
    const [actionState, setActionState] = useState({
        carryDone: false,
        cutT: 0, 
        cutO: 0, 
        unpackedT: 0,
        multGroups: 0,
        divBrought: false, 
        divGroups: 0
    });

    const [inputs, setInputs] = useState({ 
        th: '', 
        h: '', 
        t: '', 
        o: '', 
        eqC: '' 
    });

    // --- Addition 3-Step Interactive Pipeline State ---
    const [addStep, setAddStep] = useState<'build' | 'combine' | 'abstract'>('build');
    const [activeBuildTarget, setActiveBuildTarget] = useState<'A' | 'B'>('A');
    const [aBlocks, setABlocks] = useState<{ h: number, t: number, o: number }>({ h: 0, t: 0, o: 0 });
    const [bBlocks, setBBlocks] = useState<{ h: number, t: number, o: number }>({ h: 0, t: 0, o: 0 });
    
    // Step 2 Combine & Regroup
    const [tensCollected, setTensCollected] = useState(false);
    const [onesCollected, setOnesCollected] = useState(false);
    const [hundredsCollected, setHundredsCollected] = useState(false);
    const [isBundled, setIsBundled] = useState(false);
    const [isCarried, setIsCarried] = useState(false);

    // Step 3 Abstract Column Addition
    const [absStage, setAbsStage] = useState<'ones' | 'carry' | 'tens' | 'hundreds' | 'solved'>('ones');
    const [absOnes, setAbsOnes] = useState('');
    const [absCarry, setAbsCarry] = useState('');
    const [absTens, setAbsTens] = useState('');
    const [absHundreds, setAbsHundreds] = useState('');

    // --- Subtraction 3-Step Interactive Pipeline State ---
    const [subStep, setSubStep] = useState<'build' | 'take_away' | 'abstract'>('build');
    const [subBlocks, setSubBlocks] = useState<{ h: number, t: number, o: number }>({ h: 0, t: 0, o: 0 });
    
    // Step 2: Ungroup & Take Away
    const [unpackedTen, setUnpackedTen] = useState(false);
    const [unpackedHundred, setUnpackedHundred] = useState(false);
    const [takenO, setTakenO] = useState(0);
    const [takenT, setTakenT] = useState(0);
    const [takenH, setTakenH] = useState(0);

    // Step 3: Column Subtraction
    const [subAbsStage, setSubAbsStage] = useState<'ones' | 'tens' | 'hundreds' | 'solved'>('ones');
    const [subAbsOnes, setSubAbsOnes] = useState('');
    const [subAbsTens, setSubAbsTens] = useState('');
    const [subAbsHundreds, setSubAbsHundreds] = useState('');

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
            
            if (type === 'pop') { 
                osc.type = 'sine'; 
                osc.frequency.setValueAtTime(600, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); 
                gain.gain.setValueAtTime(0.05, ctx.currentTime); 
            } else if (type === 'kaching') { 
                osc.type = 'triangle'; 
                osc.frequency.setValueAtTime(1000, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3); 
                gain.gain.setValueAtTime(0.2, ctx.currentTime); 
            } else if (type === 'error') { 
                osc.type = 'sawtooth'; 
                osc.frequency.setValueAtTime(150, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2); 
                gain.gain.setValueAtTime(0.2, ctx.currentTime); 
            } else if (type === 'whoosh') { 
                osc.type = 'sine'; 
                osc.frequency.setValueAtTime(300, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2); 
                gain.gain.setValueAtTime(0.1, ctx.currentTime); 
            } else if (type === 'break') { 
                osc.type = 'sawtooth'; 
                osc.frequency.setValueAtTime(200, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3); 
                gain.gain.setValueAtTime(0.2, ctx.currentTime); 
            } else if (type === 'magic') { 
                osc.type = 'sine'; 
                osc.frequency.setValueAtTime(800, ctx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.3); 
                gain.gain.setValueAtTime(0.15, ctx.currentTime); 
            } else if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
            }
            
            osc.connect(gain); 
            gain.connect(ctx.destination);
            osc.start(); 
            osc.stop(ctx.currentTime + (type === 'kaching' ? 0.4 : 0.3));
        } catch(e) {}
    };

    const lastSpokenRef = useRef<{ text: string, time: number }>({ text: '', time: 0 });

    const speak = (text: string) => {
        const now = Date.now();
        // Prevent duplicate speech calls within 1 second
        if (lastSpokenRef.current.text === text && now - lastSpokenRef.current.time < 1000) {
            return;
        }
        lastSpokenRef.current = { text, time: now };

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
                const msg = new SpeechSynthesisUtterance(text);
                msg.rate = 0.85;
                msg.pitch = 1.1;
                window.speechSynthesis.speak(msg);
            } catch (e) {}
        }
    };

    // --- Generate Math Problem ---
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
                a = Math.floor(Math.random() * (max - 2)) + 2;
                b = Math.floor(Math.random() * (max - a)) + 1;
                c = a + b;
                opSign = '+';
                const isCarry = (a % 10 + b % 10 >= 10);
                if (opType === 'add' && !isCarry) valid = true;
                if (opType === 'add_carry' && isCarry) valid = true;
                
            } else if (opType === 'sub' || opType === 'sub_borrow') {
                a = Math.floor(Math.random() * (max - 2)) + 2;
                b = Math.floor(Math.random() * (a - 1)) + 1;
                c = a - b;
                opSign = '−';
                const isBorrow = (a % 10 < b % 10);
                if (opType === 'sub' && !isBorrow) valid = true;
                if (opType === 'sub_borrow' && isBorrow) valid = true;

            } else if (opType === 'mult') {
                a = Math.floor(Math.random() * 8) + 2; // 2 to 9
                b = Math.floor(Math.random() * 8) + 2; // 2 to 9
                c = a * b;
                opSign = '×';
                if (c <= Math.min(max, 100)) valid = true;

            } else if (opType === 'div') {
                b = Math.floor(Math.random() * 7) + 2; // Divisor 2 to 8
                c = Math.floor(Math.random() * 7) + 2; // Quotient 2 to 8
                a = b * c;
                opSign = '÷';
                if (a <= Math.min(max, 100)) valid = true;
            }
        }

        if (!valid) { 
            const fop = selectedOps[0] || 'add';
            if (fop.includes('sub')) { a = 15; b = 8; c = 7; opSign = '−'; opType = 'sub_borrow'; }
            else if (fop.includes('mult')) { a = 6; b = 4; c = 24; opSign = '×'; opType = 'mult'; }
            else if (fop.includes('div')) { a = 36; b = 6; c = 6; opSign = '÷'; opType = 'div'; }
            else { a = 8; b = 5; c = 13; opSign = '+'; opType = 'add_carry'; }
        }

        setQData({ a, op: opSign, b, c, type: opType });
        setInputs({ th: '', h: '', t: '', o: '', eqC: '' });
        setActionState({ carryDone: false, cutT: 0, cutO: 0, unpackedT: 0, multGroups: 0, divBrought: false, divGroups: 0 });
        
        // Reset Addition Pipeline
        setAddStep('build');
        setActiveBuildTarget('A');
        setABlocks({ h: 0, t: 0, o: 0 });
        setBBlocks({ h: 0, t: 0, o: 0 });
        setTensCollected(false);
        setOnesCollected(false);
        setHundredsCollected(false);
        setIsBundled(false);
        setIsCarried(false);
        setAbsStage('ones');
        setAbsOnes('');
        setAbsCarry('');
        setAbsTens('');
        setAbsHundreds('');
        
        // Reset Subtraction Pipeline
        setSubStep('build');
        setSubBlocks({ h: 0, t: 0, o: 0 });
        setUnpackedTen(false);
        setUnpackedHundred(false);
        setTakenO(0);
        setTakenT(0);
        setTakenH(0);
        setSubAbsStage('ones');
        setSubAbsOnes('');
        setSubAbsTens('');
        setSubAbsHundreds('');
        
        setFeedback('idle');

        setTimeout(() => {
            if (opType.includes('add')) speak(`${a} plus ${b}`);
            else if (opType.includes('sub')) speak(`${a} minus ${b}`);
            else if (opType === 'mult') speak(`${a} times ${b}`);
            else if (opType === 'div') speak(`${a} divided by ${b}`);
        }, 300);
    };

    const handleStart = () => {
        if (selectedOps.length === 0) return;
        playSound('whoosh');
        setQuestionIndex(0);
        setScore(0);
        generateQuestion();
        setPhase('playing');
    };

    const handleInputChange = (field: keyof typeof inputs, val: string) => {
        playSound('pop');
        const numVal = val.replace(/[^0-9]/g, '').substring(0, 4);
        setInputs(prev => ({ ...prev, [field]: numVal }));
    };

    const isActionComplete = () => {
        if (!qData) return false;
        if (qData.type === 'add_carry') return actionState.carryDone;
        if (qData.type.includes('sub')) return takenO === getParts(qData.b).o && takenT === getParts(qData.b).t && takenH === getParts(qData.b).h;
        if (qData.type === 'mult') return actionState.multGroups === qData.b;
        if (qData.type === 'div') return actionState.divBrought && actionState.divGroups === qData.c;
        return true; 
    };

    const handleCheckAnswer = () => {
        if (!qData) return;
        const resParts = getParts(qData.c);
        const requireTh = qData.c >= 1000;
        const requireH = qData.c >= 100;
        const requireT = qData.c >= 10;

        // Either full place-value count OR direct equation entry is valid & flexible
        const placeValueCorrect = 
            (requireTh ? Number(inputs.th || 0) === resParts.th : true) &&
            (requireH ? Number(inputs.h || 0) === resParts.h : true) &&
            (requireT ? Number(inputs.t || 0) === resParts.t : true) &&
            (inputs.o !== '' ? Number(inputs.o) === resParts.o : true);

        const equationCorrect = Number(inputs.eqC) === qData.c;

        const isCorrect = (equationCorrect || placeValueCorrect) && isActionComplete();

        if (isCorrect) {
            playSound('kaching');
            setFeedback('correct');
            setScore(s => s + 1);
            speak(`Correct! The answer is ${qData.c}`);
            
            setTimeout(() => { 
                if (questionIndex + 1 < TOTAL_QUESTIONS) {
                    setQuestionIndex(prev => prev + 1);
                    generateQuestion();
                } else {
                    setPhase('completed');
                    playSound('kaching');
                    speak(`Great job! You completed all 5 questions!`);
                }
            }, 1500);
        } else {
            playSound('error');
            setFeedback('wrong');
            speak("Try again! Count the blocks carefully.");
            setTimeout(() => setFeedback('idle'), 1400);
        }
    };

    const toggleOp = (op: OpType) => {
        playSound('click');
        setSelectedOps(prev => {
            if (prev.includes(op) && prev.length === 1) return prev;
            return prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op];
        });
    };

    // --- Addition Interactive Handlers ---
    const handleAddBlock = (target: 'A' | 'B', type: 'h' | 't' | 'o') => {
        playSound('pop');
        if (target === 'A') {
            setABlocks(prev => {
                const next = { ...prev, [type]: prev[type] + 1 };
                const nVal = next.h * 100 + next.t * 10 + next.o;
                if (qData && nVal === qData.a) {
                    playSound('magic');
                    setActiveBuildTarget('B');
                }
                return next;
            });
        } else {
            setBBlocks(prev => {
                const next = { ...prev, [type]: prev[type] + 1 };
                const nVal = next.h * 100 + next.t * 10 + next.o;
                if (qData && nVal === qData.b) {
                    playSound('magic');
                }
                return next;
            });
        }
    };

    const handleRemoveBlock = (target: 'A' | 'B', type: 'h' | 't' | 'o') => {
        playSound('pop');
        if (target === 'A') {
            setABlocks(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
        } else {
            setBBlocks(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
        }
    };

    const handleAutoFillBuild = () => {
        if (!qData) return;
        playSound('magic');
        const pA = getParts(qData.a);
        const pB = getParts(qData.b);
        setABlocks({ h: pA.h, t: pA.t, o: pA.o });
        setBBlocks({ h: pB.h, t: pB.t, o: pB.o });
    };

    const handleCollectTens = () => {
        if (tensCollected) return;
        playSound('whoosh');
        setTensCollected(true);
        speak("Tens collected into the Tens area!");
    };

    const handleCollectOnes = () => {
        if (onesCollected) return;
        playSound('whoosh');
        setOnesCollected(true);
        speak("Ones collected into the Ones area!");
    };

    const handleCollectHundreds = () => {
        if (hundredsCollected) return;
        playSound('whoosh');
        setHundredsCollected(true);
        speak("Hundreds collected into the Hundreds area!");
    };

    const handleBundleTenOnes = () => {
        if (isBundled) return;
        playSound('magic');
        setIsBundled(true);
        speak("10 ones regrouped into 1 ten rod! Tap it to move to the tens area.");
    };

    const handleCarryTenRod = () => {
        if (isCarried) return;
        playSound('whoosh');
        setIsCarried(true);
        speak("Carried 1 ten rod to the tens area!");
    };

    const handleAdditionSuccess = () => {
        playSound('kaching');
        setAbsStage('solved');
        setScore(s => s + 1);
        speak(`Correct! ${qData?.a} plus ${qData?.b} is ${qData?.c}! Tap Next Question to continue.`);
    };

    const handleNextQuestion = () => {
        playSound('whoosh');
        if (questionIndex + 1 < TOTAL_QUESTIONS) {
            setQuestionIndex(prev => prev + 1);
            generateQuestion();
        } else {
            setPhase('completed');
            playSound('kaching');
            speak(`Great job! You completed all questions!`);
        }
    };

    // --- Subtraction Interactive Pipeline Handlers ---
    const handleSubAddBlock = (type: 'h' | 't' | 'o') => {
        playSound('pop');
        setSubBlocks(prev => {
            const next = { ...prev, [type]: prev[type] + 1 };
            const nVal = next.h * 100 + next.t * 10 + next.o;
            if (qData && nVal === qData.a) {
                playSound('magic');
                speak(`Number ${qData.a} built! Now take away in Step 2.`);
            }
            return next;
        });
    };

    const handleSubRemoveBlock = (type: 'h' | 't' | 'o') => {
        playSound('pop');
        setSubBlocks(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
    };

    const handleSubAutoFill = () => {
        if (!qData) return;
        playSound('magic');
        const p = getParts(qData.a);
        setSubBlocks({ h: p.h, t: p.t, o: p.o });
        speak(`Auto-filled ${qData.a}! Now proceed to Step 2.`);
    };

    const handleUngroupTen = () => {
        if (unpackedTen) return;
        playSound('break');
        setUnpackedTen(true);
        speak("Ungrouped 1 Ten into 10 Ones! Now take away the ones.");
    };

    const handleUngroupHundred = () => {
        if (unpackedHundred) return;
        playSound('break');
        setUnpackedHundred(true);
        speak("Ungrouped 1 Hundred into 10 Tens! Now you can subtract tens.");
    };

    const handleTakeAwayOne = () => {
        if (!qData) return;
        const targetO = getParts(qData.b).o;
        if (takenO >= targetO) return;
        const needsOUngroup = getParts(qData.a).o < targetO;
        if (needsOUngroup && !unpackedTen) {
            playSound('error');
            speak("Ungroup 1 Ten into 10 Ones first!");
            return;
        }
        playSound('whoosh');
        setTakenO(prev => {
            const next = prev + 1;
            if (next === targetO) {
                playSound('magic');
                speak("All ones subtracted! Now move to tens.");
            }
            return next;
        });
    };

    const handleTakeAwayTen = () => {
        if (!qData) return;
        const targetO = getParts(qData.b).o;
        const targetT = getParts(qData.b).t;
        if (takenO < targetO) {
            playSound('error');
            speak("Take away all ones first!");
            return;
        }
        if (takenT >= targetT) return;
        const pA = getParts(qData.a);
        const availT = pA.t + (unpackedHundred ? 10 : 0) - (unpackedTen ? 1 : 0);
        if (availT < targetT && !unpackedHundred) {
            playSound('error');
            speak("Ungroup 1 Hundred into 10 Tens first!");
            return;
        }
        playSound('whoosh');
        setTakenT(prev => {
            const next = prev + 1;
            if (next === targetT) {
                playSound('magic');
                speak(getParts(qData.b).h > 0 ? "Tens subtracted! Now take away hundreds." : "All blocks subtracted! Step 2 complete.");
            }
            return next;
        });
    };

    const handleTakeAwayHundred = () => {
        if (!qData) return;
        const targetT = getParts(qData.b).t;
        const targetH = getParts(qData.b).h;
        if (takenT < targetT) {
            playSound('error');
            speak("Take away all tens first!");
            return;
        }
        if (takenH >= targetH) return;
        playSound('whoosh');
        setTakenH(prev => {
            const next = prev + 1;
            if (next === targetH) {
                playSound('magic');
                speak("All blocks subtracted! Step 2 complete.");
            }
            return next;
        });
    };

    const handleSubAutoTakeAway = () => {
        if (!qData) return;
        playSound('magic');
        const pA = getParts(qData.a);
        const pB = getParts(qData.b);
        if (pA.o < pB.o) setUnpackedTen(true);
        const availT = pA.t - (pA.o < pB.o ? 1 : 0);
        if (availT < pB.t) setUnpackedHundred(true);
        setTakenO(pB.o);
        setTakenT(pB.t);
        setTakenH(pB.h);
        speak("All blocks taken away! Now solve column subtraction in Step 3.");
    };

    const handleSubtractionSuccess = () => {
        playSound('kaching');
        setSubAbsStage('solved');
        setScore(s => s + 1);
        speak(`Correct! ${qData?.a} minus ${qData?.b} is ${qData?.c}! Tap Next Question to continue.`);
    };

    if (!mounted) return null;

    // ============================================================================
    // RENDER: CONFIGURATION / START SCREEN (Zero-Scroll)
    // ============================================================================
    if (phase === 'config') {
        const opConfig = [
            { id: 'add', label: 'Addition', icon: '+', color: 'bg-emerald-600' },
            { id: 'add_carry', label: 'Add (Regroup)', icon: '++', color: 'bg-teal-600' },
            { id: 'sub', label: 'Subtraction', icon: '−', color: 'bg-rose-600' },
            { id: 'sub_borrow', label: 'Sub (Unpack)', icon: '−−', color: 'bg-pink-600' },
            { id: 'mult', label: 'Multiply', icon: '×', color: 'bg-amber-600' },
            { id: 'div', label: 'Divide', icon: '÷', color: 'bg-sky-600' }
        ];

        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 font-sans text-white p-3 sm:p-5 select-none overflow-hidden">
                <div className="max-w-md w-full bg-slate-800/95 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-slate-700 shadow-xl space-y-3 sm:space-y-4">
                    
                    {/* SVG Blocks Banner */}
                    <div className="flex justify-center items-end gap-2.5 sm:gap-3 py-1">
                        <ThousandBlock />
                        <HundredFlat />
                        <TenRod />
                        <OneCube />
                    </div>

                    <div className="text-center">
                        <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">FLN Base-10 Blocks Quiz</h1>
                        <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Learn math with authentic CPA manipulatives (5 Questions)</p>
                    </div>

                    {/* 1. Operation Selection */}
                    <div>
                        <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 text-center">1. Select Operations</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {opConfig.map(op => {
                                const isActive = selectedOps.includes(op.id as OpType);
                                return (
                                    <button 
                                        key={op.id} 
                                        onClick={() => toggleOp(op.id as OpType)}
                                        className={`p-2 rounded-xl border-2 transition-all flex items-center gap-1.5 cursor-pointer
                                            ${isActive ? `${op.color} border-white shadow-sm` : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800'}`}>{op.icon}</div>
                                        <span className="font-bold text-xs truncate leading-none">{op.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Number Range */}
                    <div>
                        <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 text-center">2. Number Range</h3>
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                            {(['10', '20', '100', '1000'] as RangeType[]).map(r => (
                                <button 
                                    key={r} 
                                    onClick={() => { playSound('click'); setSelectedRange(r); }}
                                    className={`py-2 rounded-xl border-2 transition-all font-black text-[11px] sm:text-xs cursor-pointer
                                        ${selectedRange === r ? 'bg-sky-500 border-white text-white shadow-sm' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                >
                                    Up to {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start Button */}
                    <button 
                        onClick={handleStart} 
                        className="w-full bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-sm sm:text-base py-3 rounded-xl sm:rounded-2xl shadow-md border-b-4 border-lime-700 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Play fill="currentColor" size={18}/> START PRACTICE
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: VICTORY / COMPLETED SCREEN (Zero-Scroll)
    // ============================================================================
    if (phase === 'completed') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 font-sans text-white p-3 sm:p-5 select-none overflow-hidden">
                <div className="max-w-md w-full bg-slate-800/95 p-5 sm:p-7 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-slate-700 shadow-xl text-center space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-400/20 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-inner border-2 border-amber-400">
                        <Award className="w-9 h-9 sm:w-11 sm:h-11" />
                    </div>

                    <div>
                        <h2 className="text-xl sm:text-3xl font-black text-white">FLN Blocks Master!</h2>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">You solved math problems using Base-10 blocks!</p>
                    </div>

                    <div className="bg-slate-900/80 py-3 px-4 rounded-xl border border-slate-700 flex items-center justify-around">
                        <div className="text-center">
                            <span className="text-xs text-slate-400 font-bold uppercase block">Score</span>
                            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{score} / {TOTAL_QUESTIONS}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-700"></div>
                        <div className="text-center">
                            <span className="text-xs text-slate-400 font-bold uppercase block">Accuracy</span>
                            <span className="text-2xl sm:text-3xl font-black text-sky-400">{Math.round((score / TOTAL_QUESTIONS) * 100)}% ⭐</span>
                        </div>
                    </div>

                    <div className="flex gap-2.5 pt-1">
                        <button 
                            onClick={handleStart}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl border-2 border-slate-600 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <RotateCcw size={15} /> Play Again
                        </button>
                        {onComplete && (
                            <button 
                                onClick={() => onComplete({ score, maxScore: TOTAL_QUESTIONS })}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl border-b-3 border-emerald-700 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                                <CheckCircle2 size={16} /> Finish Lesson
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!qData) return null;

    const isAdd = qData.type.includes('add');
    const isSub = qData.type.includes('sub');
    const isMult = qData.type === 'mult';
    const isDiv = qData.type === 'div';
    
    const showTh = qData.c >= 1000;
    const showH = qData.c >= 100;
    const showT = qData.c >= 10;
    const actionDone = isActionComplete();

    // Subtraction Pre-Calcs
    const pA = getParts(qData.a);
    const pB = getParts(qData.b);
    const pC = getParts(qData.c);

    // Step 1 Minuend Build
    const subBuiltVal = subBlocks.h * 100 + subBlocks.t * 10 + subBlocks.o;
    const isSubBuildReady = subBuiltVal === qData.a;

    // Ungrouping analysis:
    const needsOnesUngroup = pA.o < pB.o;
    const tensAfterOnesBorrow = pA.t - (needsOnesUngroup ? 1 : 0);
    const needsTensUngroup = tensAfterOnesBorrow < pB.t;

    // Step 2 Live Inventory
    const currentSubH = Math.max(0, pA.h - (unpackedHundred ? 1 : 0) - takenH);
    const currentSubT = Math.max(0, pA.t + (unpackedHundred ? 10 : 0) - (unpackedTen ? 1 : 0) - takenT);
    const currentSubO = Math.max(0, pA.o + (unpackedTen ? 10 : 0) - takenO);
    const isSubStep2Complete = isSubBuildReady && takenO === pB.o && takenT === pB.t && takenH === pB.h;
    const isSubStep2Started = isSubBuildReady && (unpackedTen || unpackedHundred || takenO > 0 || takenT > 0 || takenH > 0);

    // Effective minuend for Step 3 Column Subtraction:
    const effectiveMinuendTens = needsTensUngroup ? (tensAfterOnesBorrow + 10) : tensAfterOnesBorrow;
    const effectiveMinuendHundreds = needsTensUngroup ? (pA.h - 1) : pA.h;

    // Addition Pre-Calcs
    const aVal = aBlocks.h * 100 + aBlocks.t * 10 + aBlocks.o;
    const bVal = bBlocks.h * 100 + bBlocks.t * 10 + bBlocks.o;
    const isAReady = aVal === qData.a;
    const isBReady = bVal === qData.b;
    const canAdvanceToCombine = isAReady && isBReady;

    const totalOnes = (qData.a % 10) + (qData.b % 10);
    const needsRegroup = totalOnes >= 10;
    const expectedRemOnes = needsRegroup ? totalOnes - 10 : totalOnes;
    const expectedTotalTens = Math.floor((qData.a % 100) / 10) + Math.floor((qData.b % 100) / 10) + (needsRegroup ? 1 : 0);
    const expectedTotalHundreds = getParts(qData.c).h;
    
    const isTensReady = tensCollected;
    const isHundredsReady = expectedTotalHundreds > 0 ? hundredsCollected : true;
    const isOnesReady = onesCollected && (!needsRegroup || (isBundled && isCarried));
    const isSection2Complete = isTensReady && isHundredsReady && isOnesReady;

    // ============================================================================
    // RENDER: PLAYING WORKSPACE (Zero-Scroll Responsive Flow)
    // ============================================================================
    return (
        <div className="w-full h-full flex flex-col bg-slate-900 font-sans text-white select-none overflow-hidden relative">
            
            {/* 1. TOP HEADER (Shrink-0, Zero Overlap, No pt-16 needed) */}
            <div className="h-11 sm:h-12 w-full bg-slate-800/90 border-b border-slate-700 px-2 sm:px-4 flex items-center justify-between shrink-0 z-30">
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={() => setPhase('config')} 
                        className="bg-slate-700/80 hover:bg-slate-600 text-slate-300 p-1.5 rounded-lg border border-slate-600 active:scale-95 transition-all"
                        title="Settings"
                    >
                        <Settings2 size={15} />
                    </button>
                    <span className="text-[10px] sm:text-xs font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                        Q {questionIndex + 1}/{TOTAL_QUESTIONS}
                    </span>
                    <div className="hidden sm:flex gap-1">
                        {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-2 h-2 rounded-full transition-colors ${i < questionIndex ? 'bg-emerald-500' : i === questionIndex ? 'bg-sky-400 ring-2 ring-sky-200' : 'bg-slate-700'}`} 
                            />
                        ))}
                    </div>
                </div>

                {/* Equation Badge */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 sm:px-3 py-1 rounded-full border border-slate-700 font-black text-xs sm:text-sm shadow-xs">
                        <span>{qData.a}</span>
                        <span className={isAdd ? 'text-emerald-400' : isSub ? 'text-rose-400' : isMult ? 'text-amber-400' : 'text-sky-400'}>{qData.op}</span>
                        <span>{qData.b}</span>
                        <span className="text-slate-400">=</span>
                        <span className="text-amber-300">?</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={() => {
                            if (isAdd) speak(`${qData.a} plus ${qData.b}`);
                            else if (isSub) speak(`${qData.a} minus ${qData.b}`);
                            else if (isMult) speak(`${qData.a} times ${qData.b}`);
                            else if (isDiv) speak(`${qData.a} divided by ${qData.b}`);
                        }}
                        className="bg-slate-700/80 hover:bg-slate-600 text-slate-300 p-1.5 rounded-lg border border-slate-600 active:scale-95 transition-all"
                        title="Repeat audio"
                    >
                        <Volume2 size={15} />
                    </button>
                    <div className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-black rounded-lg text-[10px] sm:text-xs">
                        Score: {score}
                    </div>
                </div>
            </div>

            {/* Feedback Pop-over */}
            {feedback !== 'idle' && !isAdd && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 pointer-events-none">
                    <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center shadow-2xl animate-in zoom-in-75 duration-200 ${feedback === 'correct' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {feedback === 'correct' ? <CheckCircle2 size={48}/> : <RotateCcw size={48}/>}
                    </div>
                </div>
            )}

            {/* 2. MAIN WORKSPACE (Scrollable flex-1 min-h-0) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 md:p-4 flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch justify-center">
                

                {/* ------------------------------------------------------------ */}
                {/* MULTIPLICATION MODE */}
                {/* ------------------------------------------------------------ */}
                {isMult && (
                    <div className="flex-1 bg-slate-800/90 rounded-2xl border border-slate-700 p-2.5 sm:p-4 flex flex-col shadow-sm relative min-h-[220px]">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2 shrink-0">
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400">
                                Step 1 & 2: Build Groups ({actionState.multGroups} / {qData.b})
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center w-full gap-3">
                            <Grid10x10 total={0} groupSize={qData.a} groups={actionState.multGroups} isDiv={false} />

                            {!actionDone ? (
                                <button 
                                    onClick={() => { playSound('magic'); setActionState(p => ({...p, multGroups: p.multGroups + 1})); }} 
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 sm:px-8 py-2 rounded-xl font-black text-xs sm:text-sm shadow-sm active:scale-95 transition-all animate-pulse cursor-pointer"
                                >
                                    Add Group of {qData.a} ({qData.b - actionState.multGroups} more)
                                </button>
                            ) : (
                                <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-700 w-full animate-in fade-in duration-200">
                                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Count Total:</span>
                                    {showH && <div className="flex items-center gap-1 text-slate-300 font-bold text-xs"><InputBox value={inputs.h} onChange={(v: string) => handleInputChange('h', v)} ph="0"/> H</div>}
                                    {showT && <div className="flex items-center gap-1 text-slate-300 font-bold text-xs"><InputBox value={inputs.t} onChange={(v: string) => handleInputChange('t', v)} ph="0"/> T</div>}
                                    <div className="flex items-center gap-1 text-slate-300 font-bold text-xs"><InputBox value={inputs.o} onChange={(v: string) => handleInputChange('o', v)} ph="0"/> O</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* DIVISION MODE */}
                {/* ------------------------------------------------------------ */}
                {isDiv && (
                    <div className="flex-1 bg-slate-800/90 rounded-2xl border border-slate-700 p-2.5 sm:p-4 flex flex-col shadow-sm relative min-h-[220px]">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2 shrink-0">
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-sky-400">
                                Step 1 & 2: Divide Matrix ({actionState.divGroups} groups)
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center w-full gap-3">
                            <Grid10x10 total={qData.a} groupSize={qData.b} groups={actionState.divGroups} isDiv={actionState.divBrought} />

                            {!actionState.divBrought ? (
                                <button 
                                    onClick={() => { playSound('pop'); setActionState(p => ({...p, divBrought: true})); }} 
                                    className="bg-slate-600 hover:bg-slate-500 text-white px-5 sm:px-8 py-2 rounded-xl font-black text-xs sm:text-sm active:scale-95 transition-all cursor-pointer shadow-sm"
                                >
                                    Bring {qData.a} Blocks
                                </button>
                            ) : !actionDone ? (
                                <button 
                                    onClick={() => { playSound('magic'); setActionState(p => ({...p, divGroups: p.divGroups + 1})); }} 
                                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-5 sm:px-8 py-2 rounded-xl font-black text-xs sm:text-sm shadow-sm active:scale-95 transition-all animate-pulse cursor-pointer"
                                >
                                    Group by {qData.b} ({qData.c - actionState.divGroups} left)
                                </button>
                            ) : (
                                <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-700 w-full animate-in fade-in duration-200">
                                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Count Groups:</span>
                                    {showH && <div className="flex items-center gap-1 text-slate-300 font-bold text-xs"><InputBox value={inputs.h} onChange={(v: string) => handleInputChange('h', v)} ph="0"/> H</div>}
                                    {showT && <div className="flex items-center gap-1 text-slate-300 font-bold text-xs"><InputBox value={inputs.t} onChange={(v: string) => handleInputChange('t', v)} ph="0"/> T</div>}
                                    <div className="flex items-center gap-1 text-slate-300 font-bold text-xs"><InputBox value={inputs.o} onChange={(v: string) => handleInputChange('o', v)} ph="0"/> O</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* ADDITION MODE: 3-STEP CONCRETE -> REGROUP -> ABSTRACT PIPELINE */}
                {/* ------------------------------------------------------------ */}
                {isAdd && (
                    <div className="flex-1 flex flex-col w-full h-full min-h-0 gap-2 sm:gap-2.5">
                        {/* MAIN ADDITION WORKSPACE: Side-by-side flex layout on lg: (smartboard/laptop), 1-by-1 on mobile */}
                        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch">
                            
                            {/* ==================================================================== */}
                            {/* LEFT CONTAINER (flex-1): SECTION 1 ON TOP, SECTION 2 DIRECTLY UNDER IT */}
                            {/* Takes all available extra space for large CPA manipulatives */}
                            {/* ==================================================================== */}
                            <div className={`${addStep !== 'abstract' ? 'flex' : 'hidden lg:flex'} flex-1 flex-col gap-2.5 sm:gap-3 min-h-0 overflow-y-auto min-w-0`}>
                                
                                {/* ------------------------------------------------------------ */}
                                {/* SECTION 1: STEP 1 - FORM NUMBERS (Emerald Theme)             */}
                                {/* ------------------------------------------------------------ */}
                                <div className="flex flex-col p-2.5 sm:p-3 bg-slate-900/90 rounded-2xl border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.12)] shrink-0 gap-2">
                                    {/* Section 1 Header */}
                                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/80 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm px-3 py-0.5 rounded-full shadow-sm">
                                                Step 1: Form Numbers
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                                                Build {qData.a} and {qData.b} with +10 and +1
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleAutoFillBuild}
                                                className="text-[11px] text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer font-bold"
                                                title="Auto-fill blocks for both numbers"
                                            >
                                                <Sparkles size={11} className="text-amber-400" />
                                                <span>Auto-Fill</span>
                                            </button>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${canAdvanceToCombine ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                                {canAdvanceToCombine ? '✓ Both Ready' : 'Building'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Box A and Box B */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {/* Box A */}
                                        <div className="flex flex-col p-2 rounded-xl border-2 border-emerald-500/30 bg-emerald-950/15 relative">
                                            <div className="flex items-center justify-between gap-1 mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-black text-xs sm:text-sm text-emerald-300">
                                                        Box A: <span className="text-white text-base">{qData.a}</span>
                                                    </span>
                                                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${isAReady ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                                        {isAReady ? '✓' : `${aVal}/${qData.a}`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {qData.a >= 100 && (
                                                        <button onClick={() => handleAddBlock('A', 'h')} className="px-2 py-0.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-[11px] rounded-lg shadow-xs cursor-pointer">+100</button>
                                                    )}
                                                    <button onClick={() => handleAddBlock('A', 't')} className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-[11px] rounded-lg shadow-xs cursor-pointer">+10</button>
                                                    <button onClick={() => handleAddBlock('A', 'o')} className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-[11px] rounded-lg shadow-xs cursor-pointer">+1</button>
                                                </div>
                                            </div>

                                            {/* Block Display for Box A */}
                                            <div className="flex-1 flex flex-wrap gap-1.5 items-end justify-center p-2 bg-slate-950/60 rounded-lg min-h-[85px] sm:min-h-[95px] max-h-[135px] overflow-y-auto border border-slate-800">
                                                {aBlocks.h > 0 && Array.from({ length: aBlocks.h }).map((_, i) => (
                                                    <div key={`ah-${i}`} onClick={() => handleRemoveBlock('A', 'h')} className={`cursor-pointer hover:scale-95 transition-transform ${hundredsCollected ? 'opacity-40 scale-95' : ''}`} title={hundredsCollected ? "Hundreds moved down" : "Tap to remove"}>
                                                        <HundredFlat size="sm" />
                                                    </div>
                                                ))}
                                                {aBlocks.t > 0 && (
                                                    <div className={`flex gap-1 flex-wrap justify-center items-end transition-all ${tensCollected ? 'opacity-40 scale-95' : ''}`}>
                                                        {Array.from({ length: aBlocks.t }).map((_, i) => (
                                                            <div key={`at-${i}`} onClick={() => !tensCollected && handleRemoveBlock('A', 't')} className={tensCollected ? 'cursor-default' : 'cursor-pointer hover:scale-95 transition-transform'} title={tensCollected ? "Tens moved down" : "Tap to remove"}>
                                                                <TenRod size="sm" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {aBlocks.o > 0 && (
                                                    <div className={`flex flex-wrap gap-1 max-w-[80px] justify-center items-end transition-all ${onesCollected ? 'opacity-40 scale-95' : ''}`}>
                                                        {Array.from({ length: aBlocks.o }).map((_, i) => (
                                                            <div key={`ao-${i}`} onClick={() => !onesCollected && handleRemoveBlock('A', 'o')} className={onesCollected ? 'cursor-default' : 'cursor-pointer hover:scale-95 transition-transform'} title={onesCollected ? "Ones moved down" : "Tap to remove"}>
                                                                <OneCube size="sm" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {aVal === 0 && (
                                                    <span className="text-[11px] text-slate-500 italic select-none my-auto">Tap +10 or +1 to add blocks</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Box B */}
                                        <div className="flex flex-col p-2 rounded-xl border-2 border-sky-500/30 bg-sky-950/15 relative">
                                            <div className="flex items-center justify-between gap-1 mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-black text-xs sm:text-sm text-sky-300">
                                                        Box B: <span className="text-white text-base">{qData.b}</span>
                                                    </span>
                                                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${isBReady ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                                        {isBReady ? '✓' : `${bVal}/${qData.b}`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {qData.b >= 100 && (
                                                        <button onClick={() => handleAddBlock('B', 'h')} className="px-2 py-0.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-[11px] rounded-lg shadow-xs cursor-pointer">+100</button>
                                                    )}
                                                    <button onClick={() => handleAddBlock('B', 't')} className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-[11px] rounded-lg shadow-xs cursor-pointer">+10</button>
                                                    <button onClick={() => handleAddBlock('B', 'o')} className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-[11px] rounded-lg shadow-xs cursor-pointer">+1</button>
                                                </div>
                                            </div>

                                            {/* Block Display for Box B */}
                                            <div className="flex-1 flex flex-wrap gap-1.5 items-end justify-center p-2 bg-slate-950/60 rounded-lg min-h-[85px] sm:min-h-[95px] max-h-[135px] overflow-y-auto border border-slate-800">
                                                {bBlocks.h > 0 && Array.from({ length: bBlocks.h }).map((_, i) => (
                                                    <div key={`bh-${i}`} onClick={() => handleRemoveBlock('B', 'h')} className={`cursor-pointer hover:scale-95 transition-transform ${hundredsCollected ? 'opacity-40 scale-95' : ''}`} title={hundredsCollected ? "Hundreds moved down" : "Tap to remove"}>
                                                        <HundredFlat size="sm" />
                                                    </div>
                                                ))}
                                                {bBlocks.t > 0 && (
                                                    <div className={`flex gap-1 flex-wrap justify-center items-end transition-all ${tensCollected ? 'opacity-40 scale-95' : ''}`}>
                                                        {Array.from({ length: bBlocks.t }).map((_, i) => (
                                                            <div key={`bt-${i}`} onClick={() => !tensCollected && handleRemoveBlock('B', 't')} className={tensCollected ? 'cursor-default' : 'cursor-pointer hover:scale-95 transition-transform'} title={tensCollected ? "Tens moved down" : "Tap to remove"}>
                                                                <TenRod size="sm" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {bBlocks.o > 0 && (
                                                    <div className={`flex flex-wrap gap-1 max-w-[80px] justify-center items-end transition-all ${onesCollected ? 'opacity-40 scale-95' : ''}`}>
                                                        {Array.from({ length: bBlocks.o }).map((_, i) => (
                                                            <div key={`bo-${i}`} onClick={() => !onesCollected && handleRemoveBlock('B', 'o')} className={onesCollected ? 'cursor-default' : 'cursor-pointer hover:scale-95 transition-transform'} title={onesCollected ? "Ones moved down" : "Tap to remove"}>
                                                                <OneCube size="sm" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {bVal === 0 && (
                                                    <span className="text-[11px] text-slate-500 italic select-none my-auto">Tap +10 or +1 to add blocks</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ------------------------------------------------------------ */}
                                {/* SECTION 2: STEP 2 - COMBINE & REGROUP (Sky Theme)            */}
                                {/* Visible from the beginning, under Section 1!                 */}
                                {/* ------------------------------------------------------------ */}
                                <div className="flex-1 flex flex-col p-2.5 sm:p-3 bg-slate-900/90 rounded-2xl border-2 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.12)] gap-2">
                                    {/* Section 2 Header */}
                                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/80 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-sky-500 text-slate-950 font-black text-xs sm:text-sm px-3 py-0.5 rounded-full shadow-sm">
                                                Step 2: Combine & Regroup
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                                                Collect tens and ones from above
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSection2Complete ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                            {isSection2Complete ? '✓ Ready for Step 3' : 'In Progress'}
                                        </span>
                                    </div>

                                    {/* Columns Mat: Hundreds, Tens Area, Ones Area */}
                                    <div className={`flex-1 grid ${expectedTotalHundreds > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-2.5 p-2 sm:p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 min-h-[220px] sm:min-h-[260px] items-stretch`}>
                                        
                                        {/* Hundreds Area (if >= 100) */}
                                        {expectedTotalHundreds > 0 && (
                                            <div className="flex flex-col items-center justify-between p-2 sm:p-2.5 bg-slate-900/70 rounded-xl border border-sky-500/30 min-h-[200px] sm:min-h-[240px]">
                                                <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider shrink-0">Hundreds Area</span>
                                                {!hundredsCollected ? (
                                                    <div className="flex flex-col items-center justify-center p-2 my-auto gap-1 text-center">
                                                        <button
                                                            onClick={handleCollectHundreds}
                                                            disabled={!canAdvanceToCombine}
                                                            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1 shadow-md
                                                                ${canAdvanceToCombine
                                                                    ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 animate-pulse cursor-pointer active:scale-95'
                                                                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`}
                                                        >
                                                            <ArrowDown size={13} />
                                                            <span>Collect Hundreds</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 w-full flex flex-wrap gap-1.5 justify-center items-center my-auto py-2 animate-in slide-in-from-top-6 duration-500">
                                                        {Array.from({ length: expectedTotalHundreds }).map((_, i) => (
                                                            <HundredFlat key={`ch-${i}`} size="sm" />
                                                        ))}
                                                    </div>
                                                )}
                                                <span className="text-[11px] font-bold text-sky-300 shrink-0">
                                                    {hundredsCollected ? `${expectedTotalHundreds} ${expectedTotalHundreds === 1 ? 'Hundred' : 'Hundreds'}` : 'Empty'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Tens Area */}
                                        <div className="flex flex-col items-center justify-between p-2 sm:p-2.5 bg-slate-900/70 rounded-xl border border-emerald-500/30 min-h-[200px] sm:min-h-[240px]">
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider shrink-0">Tens Area</span>
                                            
                                            {!tensCollected ? (
                                                <div className="flex flex-col items-center justify-center p-2 my-auto gap-1.5 text-center">
                                                    <button
                                                        onClick={handleCollectTens}
                                                        disabled={!canAdvanceToCombine}
                                                        className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-md
                                                            ${canAdvanceToCombine
                                                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 animate-pulse cursor-pointer active:scale-95 ring-2 ring-emerald-300'
                                                                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`}
                                                    >
                                                        <ArrowDown size={14} className={canAdvanceToCombine ? 'animate-bounce' : ''} />
                                                        <span>Collect the Tens</span>
                                                    </button>
                                                    {!canAdvanceToCombine && (
                                                        <span className="text-[10px] text-slate-500 italic">Build both numbers above first</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex-1 w-full flex flex-wrap gap-1.5 justify-center items-end my-auto py-2 animate-in slide-in-from-top-8 duration-500">
                                                    {Array.from({ length: getParts(qData.a).t + getParts(qData.b).t }).map((_, i) => (
                                                        <TenRod key={`ct-${i}`} size="sm" />
                                                    ))}
                                                    {/* Carried Ten Rod shown with prominent highlight */}
                                                    {needsRegroup && isCarried && (
                                                        <div className="flex flex-col items-center p-1 rounded-xl bg-amber-400/25 border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] ring-2 ring-amber-300 animate-in zoom-in-75 duration-300 shrink-0" title="Carried Ten Rod">
                                                            <span className="px-1.5 py-0.5 mb-1 bg-amber-400 text-slate-950 text-[9px] font-black rounded-full shadow-xs whitespace-nowrap">
                                                                Carried +1 Ten
                                                            </span>
                                                            <TenRod size="sm" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <span className="text-[11px] font-bold text-emerald-300 shrink-0">
                                                {tensCollected ? (needsRegroup && isCarried ? `${expectedTotalTens} Tens` : `${getParts(qData.a).t + getParts(qData.b).t} Tens`) : 'Empty'}
                                            </span>
                                        </div>

                                        {/* Ones Area */}
                                        <div className={`flex flex-col items-center justify-between p-2 sm:p-2.5 bg-slate-900/70 rounded-xl border min-h-[200px] sm:min-h-[240px]
                                            ${needsRegroup && onesCollected && !isCarried ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)]' : 'border-amber-500/30'}`}
                                        >
                                            <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider shrink-0">Ones Area</span>
                                            
                                            {!onesCollected ? (
                                                <div className="flex flex-col items-center justify-center p-2 my-auto gap-1.5 text-center">
                                                    <button
                                                        onClick={handleCollectOnes}
                                                        disabled={!canAdvanceToCombine}
                                                        className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-md
                                                            ${canAdvanceToCombine
                                                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 animate-pulse cursor-pointer active:scale-95 ring-2 ring-amber-200'
                                                                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`}
                                                    >
                                                        <ArrowDown size={14} className={canAdvanceToCombine ? 'animate-bounce' : ''} />
                                                        <span>Collect the Ones</span>
                                                    </button>
                                                    {!canAdvanceToCombine && (
                                                        <span className="text-[10px] text-slate-500 italic">Build both numbers above first</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex-1 w-full flex flex-col items-center justify-center my-auto py-2 animate-in slide-in-from-top-8 duration-500">
                                                    {/* Carry Case - Stage 1: Group 10 Ones */}
                                                    {needsRegroup && !isBundled && (
                                                        <div className="flex flex-col items-center gap-1.5 p-1 w-full">
                                                            <RegroupTenOnes onClick={handleBundleTenOnes} />
                                                            {expectedRemOnes > 0 && (
                                                                <div className="flex flex-wrap gap-1 max-w-[120px] justify-center mt-1">
                                                                    <span className="text-[9px] text-slate-400 block w-full text-center">Leftover:</span>
                                                                    {Array.from({ length: expectedRemOnes }).map((_, i) => (
                                                                        <OneCube key={`rem-${i}`} size="sm" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Carry Case - Stage 2: Bundled into 1 Ten Rod, prompt to move */}
                                                    {needsRegroup && isBundled && !isCarried && (
                                                        <div className="flex flex-col items-center gap-2 p-2 rounded-xl bg-amber-500/20 border-2 border-amber-400 animate-in zoom-in-95 duration-200">
                                                            <span className="text-[10px] sm:text-xs font-black text-amber-300 uppercase">✨ 10 Ones = 1 Ten!</span>
                                                            <div 
                                                                onClick={handleCarryTenRod} 
                                                                className="p-1.5 rounded-lg bg-amber-950/70 border-2 border-amber-400 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform animate-bounce"
                                                                title="Click to move to Tens Area"
                                                            >
                                                                <TenRod size="sm" />
                                                            </div>
                                                            <button
                                                                onClick={handleCarryTenRod}
                                                                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                                                            >
                                                                <span>Move to Tens Area</span>
                                                                <ArrowLeft size={13} />
                                                            </button>
                                                            {expectedRemOnes > 0 && (
                                                                <div className="flex flex-wrap gap-1 max-w-[120px] justify-center mt-1">
                                                                    <span className="text-[9px] text-slate-400 block w-full text-center">Leftover:</span>
                                                                    {Array.from({ length: expectedRemOnes }).map((_, i) => (
                                                                        <OneCube key={`rem2-${i}`} size="sm" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Carried or No Regroup Needed */}
                                                    {(!needsRegroup || isCarried) && (
                                                        <div className="flex flex-wrap gap-1.5 max-w-[120px] justify-center items-center py-2">
                                                            {Array.from({ length: expectedRemOnes }).map((_, i) => (
                                                                <OneCube key={`done-o-${i}`} size="sm" />
                                                            ))}
                                                            {expectedRemOnes === 0 && (
                                                                <span className="text-[11px] font-bold text-slate-500 italic">0 Ones</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <span className="text-[11px] font-bold text-amber-300 shrink-0">
                                                {onesCollected ? `${expectedRemOnes} Ones` : 'Empty'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Action: Proceed to Step 3 (Solve) when Section 2 is complete */}
                                    {isSection2Complete && (
                                        <div className="pt-1.5 shrink-0 animate-in fade-in duration-200">
                                            <button
                                                onClick={() => { playSound('magic'); setAddStep('abstract'); }}
                                                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md animate-pulse cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <span>Proceed to Step 3: Solve (Column Addition)</span>
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ==================================================================== */}
                            {/* RIGHT CONTAINER: SECTION 3 - STEP 3 SOLVE (Amber Theme) */}
                            {/* Compact size matched to the 4-column math problem (w-full lg:w-72 xl:w-80 shrink-0) */}
                            {/* ==================================================================== */}
                            <div className={`${addStep === 'abstract' ? 'flex' : 'hidden lg:flex'} w-full lg:w-72 xl:w-80 shrink-0 flex-col justify-between p-2.5 sm:p-3 bg-slate-900/90 rounded-2xl border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.12)] min-h-0`}>
                                {/* Section 3 Header */}
                                <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/80 shrink-0">
                                    <span className="bg-amber-400 text-slate-950 font-black text-xs sm:text-sm px-3 py-0.5 rounded-full shadow-sm">
                                        Step 3: Solve
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {addStep === 'abstract' && (
                                            <button
                                                onClick={() => setAddStep('build')}
                                                className="lg:hidden text-[10px] text-slate-300 hover:text-white bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-600 transition-all cursor-pointer"
                                            >
                                                ← Back to Blocks
                                            </button>
                                        )}
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${absStage === 'solved' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                            {absStage === 'solved' ? '✓ Solved' : 'Column Addition'}
                                        </span>
                                    </div>
                                </div>

                                {/* Section 3 Body */}
                                {!isSection2Complete && addStep !== 'abstract' ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto">
                                        <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-slate-500 mb-2">
                                            <Lock size={20} />
                                        </div>
                                        <p className="font-bold text-xs text-slate-300 mb-0.5">Step 3: Column Addition</p>
                                        <p className="text-[11px] text-slate-500 max-w-[200px]">Collect and regroup blocks in Step 2 to unlock column addition!</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center my-auto py-2 gap-2 min-h-0">
                                        {/* Status Prompt */}
                                        <div className="text-center bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-700 w-full shrink-0">
                                            {absStage === 'ones' && (
                                                <p className="text-xs font-bold text-sky-300">
                                                    👉 1️⃣ Add Ones: <span className="text-amber-300 font-black">{qData.a % 10} + {qData.b % 10} = {totalOnes}</span>
                                                    <br/><span className="text-white text-[10px] font-normal">Type {expectedRemOnes} in glowing Ones box</span>
                                                </p>
                                            )}
                                            {absStage === 'carry' && (
                                                <p className="text-xs font-bold text-amber-300 animate-pulse">
                                                    ✨ Over 10! Type <span className="text-white font-black">1 (Carry)</span> in the box above Tens!
                                                </p>
                                            )}
                                            {absStage === 'tens' && (
                                                <p className="text-xs font-bold text-emerald-300">
                                                    👉 2️⃣ Add Tens: {needsRegroup ? '1 + ' : ''}{Math.floor((qData.a % 100) / 10)} + {Math.floor((qData.b % 100) / 10)} = <span className="text-white font-black">{expectedTotalTens % 10}</span>!
                                                </p>
                                            )}
                                            {absStage === 'hundreds' && (
                                                <p className="text-xs font-bold text-sky-300">
                                                    👉 3️⃣ Write Hundreds: <span className="text-white font-black">{expectedTotalHundreds}</span>!
                                                </p>
                                            )}
                                            {absStage === 'solved' && (
                                                <p className="text-xs font-black text-emerald-400 animate-bounce">
                                                    🎉 Correct! {qData.a} + {qData.b} = {qData.c}!
                                                </p>
                                            )}
                                        </div>

                                        {/* The Vertical Column Matrix */}
                                        <div className="bg-slate-950/80 p-3 rounded-2xl border-2 border-slate-700 shadow-inner flex flex-col items-center shrink-0">
                                            {/* Carry Row */}
                                            <div className="grid grid-cols-4 gap-2 items-center text-center font-mono font-bold text-xs mb-1">
                                                <span className="w-9 sm:w-11"></span>
                                                <span className="w-9 sm:w-11"></span>
                                                {/* Tens Carry Box */}
                                                <div className="w-9 sm:w-11 flex justify-center">
                                                    {needsRegroup && (
                                                        <div className={`transition-all ${absStage === 'carry' ? 'ring-2 ring-amber-400 rounded-lg animate-bounce' : ''}`}>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={absCarry}
                                                                disabled={absStage !== 'carry'}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                                    if (val === '1') {
                                                                        playSound('magic');
                                                                        setAbsCarry('1');
                                                                        setAbsStage('tens');
                                                                        speak(`Carry 1! Now add the tens.`);
                                                                    } else {
                                                                        setAbsCarry(val);
                                                                    }
                                                                }}
                                                                placeholder={absStage === 'carry' ? "1?" : ""}
                                                                className={`w-7 h-7 sm:w-8 sm:h-8 text-center font-black text-xs rounded-lg border-2 transition-all outline-none
                                                                    ${absStage === 'carry'
                                                                        ? 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                                                                        : absCarry === '1'
                                                                            ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                                                                            : 'border-slate-800 bg-slate-900/40 text-slate-700 opacity-40'}`}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="w-9 sm:w-11"></span>
                                            </div>

                                            {/* Place Value Labels */}
                                            <div className="grid grid-cols-4 gap-2 items-center text-center font-mono font-bold text-xs text-slate-500 border-b border-slate-800 pb-1 mb-1.5">
                                                <span className="w-9 sm:w-11"></span>
                                                <span className="w-9 sm:w-11 text-sky-400 font-black">H</span>
                                                <span className="w-9 sm:w-11 text-emerald-400 font-black">T</span>
                                                <span className="w-9 sm:w-11 text-amber-400 font-black">O</span>
                                            </div>

                                            {/* Number A */}
                                            <div className="grid grid-cols-4 gap-2 items-center text-center font-mono font-black text-lg sm:text-xl text-slate-300 mb-0.5">
                                                <span className="w-9 sm:w-11"></span>
                                                <span className="w-9 sm:w-11">{getParts(qData.a).h || ''}</span>
                                                <span className="w-9 sm:w-11">{getParts(qData.a).t}</span>
                                                <span className="w-9 sm:w-11">{getParts(qData.a).o}</span>
                                            </div>

                                            {/* Number B with + */}
                                            <div className="grid grid-cols-4 gap-2 items-center text-center font-mono font-black text-lg sm:text-xl text-slate-300 border-b-2 border-slate-600 pb-1.5 mb-1.5">
                                                <span className="w-9 sm:w-11 text-emerald-400 font-black text-xl">+</span>
                                                <span className="w-9 sm:w-11">{getParts(qData.b).h || ''}</span>
                                                <span className="w-9 sm:w-11">{getParts(qData.b).t}</span>
                                                <span className="w-9 sm:w-11">{getParts(qData.b).o}</span>
                                            </div>

                                            {/* Column Answer Inputs */}
                                            <div className="grid grid-cols-4 gap-2 items-center text-center">
                                                <span className="w-9 sm:w-11"></span>

                                                {/* Hundreds Box */}
                                                <div className="w-9 sm:w-11 flex justify-center">
                                                    {expectedTotalHundreds > 0 && (
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={absHundreds}
                                                            disabled={absStage !== 'hundreds'}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                                if (val !== '' && Number(val) === expectedTotalHundreds) {
                                                                    setAbsHundreds(val);
                                                                    handleAdditionSuccess();
                                                                } else {
                                                                    setAbsHundreds(val);
                                                                }
                                                            }}
                                                            className={`w-9 h-9 sm:w-10 sm:h-10 text-center font-black text-sm sm:text-base rounded-xl border-2 outline-none transition-all
                                                                ${absStage === 'hundreds'
                                                                    ? 'border-sky-400 bg-sky-950/40 text-white shadow-[0_0_12px_rgba(56,189,248,0.6)] animate-pulse'
                                                                    : absHundreds !== ''
                                                                        ? 'border-sky-500 bg-slate-900 text-white'
                                                                        : 'border-slate-700 bg-slate-900/60 text-slate-500 cursor-not-allowed'}`}
                                                        />
                                                    )}
                                                </div>

                                                {/* Tens Box */}
                                                <div className="w-9 sm:w-11 flex justify-center">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={absTens}
                                                        disabled={absStage !== 'tens'}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                                            if (val !== '' && Number(val) === (expectedTotalTens % 10)) {
                                                                setAbsTens(val);
                                                                if (expectedTotalHundreds > 0) {
                                                                    playSound('kaching');
                                                                    setAbsStage('hundreds');
                                                                    speak("Now write the hundreds digit!");
                                                                } else {
                                                                    handleAdditionSuccess();
                                                                }
                                                            } else {
                                                                setAbsTens(val);
                                                            }
                                                        }}
                                                        className={`w-9 h-9 sm:w-10 sm:h-10 text-center font-black text-sm sm:text-base rounded-xl border-2 outline-none transition-all
                                                            ${absStage === 'tens'
                                                                ? 'border-emerald-400 bg-emerald-950/40 text-white shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-pulse'
                                                                : absTens !== ''
                                                                    ? 'border-emerald-500 bg-slate-900 text-white'
                                                                    : 'border-slate-700 bg-slate-900/60 text-slate-500 cursor-not-allowed'}`}
                                                    />
                                                </div>

                                                {/* Ones Box (Must be answered FIRST!) */}
                                                <div className="w-9 sm:w-11 flex justify-center">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={absOnes}
                                                        disabled={absStage !== 'ones'}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                                            if (val !== '' && Number(val) === expectedRemOnes) {
                                                                setAbsOnes(val);
                                                                playSound('pop');
                                                                if (needsRegroup) {
                                                                    setAbsStage('carry');
                                                                    speak("Great! Now write 1 in the carry box above the tens column.");
                                                                } else {
                                                                    setAbsStage('tens');
                                                                    speak("Now add the tens column!");
                                                                }
                                                            } else {
                                                                setAbsOnes(val);
                                                            }
                                                        }}
                                                        className={`w-9 h-9 sm:w-10 sm:h-10 text-center font-black text-sm sm:text-base rounded-xl border-2 outline-none transition-all
                                                            ${absStage === 'ones'
                                                                ? 'border-amber-400 bg-amber-950/40 text-white shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
                                                                : absOnes !== ''
                                                                    ? 'border-amber-500 bg-slate-900 text-white'
                                                                    : 'border-slate-700 bg-slate-900/60 text-slate-500 cursor-not-allowed'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Next Question Button in Section 3 Area while keeping solution in full view */}
                                        {absStage === 'solved' && (
                                            <div className="w-full mt-2 animate-in zoom-in-95 duration-300">
                                                <button
                                                    onClick={handleNextQuestion}
                                                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                                                >
                                                    <span>{questionIndex + 1 < TOTAL_QUESTIONS ? 'Next Question ➔' : 'Finish Quiz & View Results 🏆'}</span>
                                                    <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* SUBTRACTION MODE: 3-STEP CONCRETE -> UNGROUP -> ABSTRACT PIPELINE */}
                {/* ------------------------------------------------------------ */}
                {isSub && (
                    <div className="flex-1 flex flex-col w-full h-full min-h-0 gap-2 sm:gap-2.5">
                        {/* MAIN SUBTRACTION WORKSPACE: Side-by-side flex layout on lg: (smartboard/laptop), 1-by-1 on mobile */}
                        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch">
                            
                            {/* ==================================================================== */}
                            {/* LEFT CONTAINER (flex-1): SECTION 1 ON TOP, SECTION 2 DIRECTLY UNDER IT */}
                            {/* Takes all available extra space for large CPA manipulatives */}
                            {/* ==================================================================== */}
                            <div className={`${subStep !== 'abstract' ? 'flex' : 'hidden lg:flex'} flex-1 flex-col gap-2.5 sm:gap-3 min-h-0 overflow-y-auto min-w-0`}>
                                
                                {/* ------------------------------------------------------------ */}
                                {/* SECTION 1: STEP 1 - FORM NUMBER (Rose Theme)                 */}
                                {/* ------------------------------------------------------------ */}
                                <div className="flex flex-col p-2.5 sm:p-3 bg-slate-900/90 rounded-2xl border-2 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.12)] shrink-0 gap-2">
                                    {/* Section 1 Header */}
                                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/80 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-rose-500 text-white font-black text-xs sm:text-sm px-3 py-0.5 rounded-full shadow-sm">
                                                Step 1: Form Number
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                                                Build {qData.a} with {qData.a >= 100 ? '+100, ' : ''}+10, and +1
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!isSubBuildReady && (
                                                <button
                                                    onClick={handleSubAutoFill}
                                                    className="text-[11px] text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer font-bold"
                                                    title="Auto-fill blocks for minuend"
                                                >
                                                    <Sparkles size={11} className="text-amber-400" />
                                                    <span>Auto-Fill</span>
                                                </button>
                                            )}
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSubBuildReady ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                                {isSubBuildReady ? '✓ Ready' : `Building ${subBuiltVal}/${qData.a}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Minuend Builder Card */}
                                    <div className="flex flex-col p-2 rounded-xl border-2 border-rose-500/30 bg-rose-950/15 relative">
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-black text-xs sm:text-sm text-rose-300">
                                                    Minuend: <span className="text-white text-base">{qData.a}</span>
                                                </span>
                                                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${isSubBuildReady ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                                    {isSubBuildReady ? '✓' : `${subBuiltVal}/${qData.a}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {!isSubStep2Started ? (
                                                    <>
                                                        {qData.a >= 100 && (
                                                            <button onClick={() => handleSubAddBlock('h')} className="px-2 py-0.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-[11px] rounded-lg shadow-xs cursor-pointer">+100</button>
                                                        )}
                                                        <button onClick={() => handleSubAddBlock('t')} className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-[11px] rounded-lg shadow-xs cursor-pointer">+10</button>
                                                        <button onClick={() => handleSubAddBlock('o')} className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-[11px] rounded-lg shadow-xs cursor-pointer">+1</button>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">✓ Number Locked</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Block Display for Minuend */}
                                        <div className="flex-1 flex flex-wrap gap-1.5 items-end justify-center p-2 bg-slate-950/60 rounded-lg min-h-[85px] sm:min-h-[95px] max-h-[135px] overflow-y-auto border border-slate-800">
                                            {subBlocks.h > 0 && Array.from({ length: subBlocks.h }).map((_, i) => (
                                                <div key={`subh-${i}`} onClick={() => !isSubStep2Started && handleSubRemoveBlock('h')} className={isSubStep2Started ? "cursor-default opacity-80" : "cursor-pointer hover:scale-95 transition-transform"} title={isSubStep2Started ? undefined : "Tap to remove"}>
                                                    <HundredFlat size="sm" />
                                                </div>
                                            ))}
                                            {subBlocks.t > 0 && (
                                                <div className="flex gap-1 flex-wrap justify-center items-end">
                                                    {Array.from({ length: subBlocks.t }).map((_, i) => (
                                                        <div key={`subt-${i}`} onClick={() => !isSubStep2Started && handleSubRemoveBlock('t')} className={isSubStep2Started ? "cursor-default opacity-80" : "cursor-pointer hover:scale-95 transition-transform"} title={isSubStep2Started ? undefined : "Tap to remove"}>
                                                            <TenRod size="sm" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {subBlocks.o > 0 && (
                                                <div className="flex flex-wrap gap-1 max-w-[80px] justify-center items-end">
                                                    {Array.from({ length: subBlocks.o }).map((_, i) => (
                                                        <div key={`subo-${i}`} onClick={() => !isSubStep2Started && handleSubRemoveBlock('o')} className={isSubStep2Started ? "cursor-default opacity-80" : "cursor-pointer hover:scale-95 transition-transform"} title={isSubStep2Started ? undefined : "Tap to remove"}>
                                                            <OneCube size="sm" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {subBuiltVal === 0 && (
                                                <span className="text-[11px] text-slate-500 italic select-none my-auto">Tap +100, +10, or +1 to build {qData.a}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ------------------------------------------------------------ */}
                                {/* SECTION 2: STEP 2 - UNGROUP & TAKE AWAY (Amber Theme)         */}
                                {/* ------------------------------------------------------------ */}
                                <div className="flex-1 flex flex-col p-2.5 sm:p-3 bg-slate-900/90 rounded-2xl border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.12)] gap-2">
                                    {/* Section 2 Header */}
                                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/80 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-amber-500 text-slate-950 font-black text-xs sm:text-sm px-3 py-0.5 rounded-full shadow-sm">
                                                Step 2: Ungroup & Take Away ({qData.b})
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                                                Ungroup if needed, then take away ones, tens, hundreds
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isSubBuildReady && !isSubStep2Complete && (
                                                <button
                                                    onClick={handleSubAutoTakeAway}
                                                    className="text-[11px] text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer font-bold"
                                                    title="Auto-take away all blocks of subtrahend"
                                                >
                                                    <Sparkles size={11} className="text-amber-400" />
                                                    <span>Auto-Take Away</span>
                                                </button>
                                            )}
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSubStep2Complete ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                                {isSubStep2Complete ? '✓ Ready for Step 3' : `${takenH * 100 + takenT * 10 + takenO}/${qData.b} Taken Away`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Instructions Banner for Step 2 */}
                                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2 shrink-0">
                                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                            {!isSubBuildReady ? (
                                                <>👉 <span className="text-white font-black">Step 1 First:</span> Form the bigger number {qData.a} in Step 1 above to begin taking away blocks.</>
                                            ) : needsOnesUngroup && !unpackedTen ? (
                                                <>💥 <span className="text-rose-400 font-black">Not enough Ones!</span> ({pA.o} &lt; {pB.o}) Tap glowing Ten rod to ungroup into 10 Ones.</>
                                            ) : takenO < pB.o ? (
                                                <>👉 <span className="text-white font-black">1. Take away Ones:</span> Tap {pB.o - takenO} more Ones cube{pB.o - takenO === 1 ? '' : 's'} to remove.</>
                                            ) : needsTensUngroup && !unpackedHundred ? (
                                                <>💥 <span className="text-rose-400 font-black">Not enough Tens!</span> ({tensAfterOnesBorrow} &lt; {pB.t}) Tap glowing Hundred flat to ungroup into 10 Tens.</>
                                            ) : takenT < pB.t ? (
                                                <>👉 <span className="text-white font-black">2. Take away Tens:</span> Tap {pB.t - takenT} more Ten rod{pB.t - takenT === 1 ? '' : 's'} to remove.</>
                                            ) : pB.h > 0 && takenH < pB.h ? (
                                                <>👉 <span className="text-white font-black">3. Take away Hundreds:</span> Tap {pB.h - takenH} more Hundred flat{pB.h - takenH === 1 ? '' : 's'} to remove.</>
                                            ) : (
                                                <>✓ <span className="text-emerald-400 font-black">All {qData.b} blocks subtracted!</span> Remaining: {qData.c}. Ready for Step 3!</>
                                            )}
                                        </span>
                                    </div>

                                    {/* Working Blocks Mat: Hundreds, Tens, Ones - Always Visible */}
                                    <div className={`flex-1 grid ${pA.h > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-2.5 p-2 sm:p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 min-h-[220px] sm:min-h-[260px] items-stretch`}>
                                        
                                        {/* Hundreds Area */}
                                        {pA.h > 0 && (
                                            <div className="flex flex-col items-center justify-between p-2 sm:p-2.5 bg-slate-900/70 rounded-xl border border-sky-500/30 min-h-[200px] sm:min-h-[240px]">
                                                <div className="flex items-center justify-between w-full shrink-0">
                                                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">Hundreds Area</span>
                                                    {unpackedHundred && (
                                                        <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded">-1 Unpacked</span>
                                                    )}
                                                </div>

                                                {/* Hundred Flats Container */}
                                                <div className="flex-1 w-full flex flex-wrap gap-1.5 justify-center items-center my-auto py-1">
                                                    {!isSubBuildReady ? (
                                                        <span className="text-[11px] text-slate-500 italic my-auto">Form {qData.a} in Step 1 first</span>
                                                    ) : (
                                                        <>
                                                            {Array.from({ length: currentSubH }).map((_, i) => {
                                                                const isUngroupable = needsTensUngroup && !unpackedHundred && takenO === pB.o;
                                                                const isCuttable = takenO === pB.o && takenT === pB.t && pB.h > 0 && takenH < pB.h;
                                                                return (
                                                                    <div 
                                                                        key={`subcurh-${i}`} 
                                                                        onClick={() => {
                                                                            if (isUngroupable) handleUngroupHundred();
                                                                            else if (isCuttable) handleTakeAwayHundred();
                                                                        }}
                                                                        className={`transition-transform ${isUngroupable ? 'ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)] cursor-pointer hover:scale-105 animate-pulse' : isCuttable ? 'ring-2 ring-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)] cursor-pointer hover:scale-95 animate-pulse' : ''}`}
                                                                        title={isUngroupable ? "Tap to ungroup 1 Hundred into 10 Tens" : isCuttable ? "Tap to take away 1 Hundred" : undefined}
                                                                    >
                                                                        <HundredFlat size="sm" />
                                                                    </div>
                                                                );
                                                            })}
                                                            {currentSubH === 0 && (
                                                                <span className="text-[11px] text-slate-500 italic my-auto">0 Hundreds left</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Action button inside column */}
                                                {isSubBuildReady && needsTensUngroup && !unpackedHundred && takenO === pB.o && (
                                                    <button 
                                                        onClick={handleUngroupHundred}
                                                        className="w-full py-1 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] shadow-sm animate-pulse cursor-pointer shrink-0 mb-1"
                                                    >
                                                        ⚡ Ungroup 1 Hundred → 10 Tens
                                                    </button>
                                                )}
                                                {isSubBuildReady && takenO === pB.o && takenT === pB.t && pB.h > 0 && takenH < pB.h && (
                                                    <button 
                                                        onClick={handleTakeAwayHundred}
                                                        className="w-full py-1 px-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-black text-[10px] shadow-sm animate-pulse cursor-pointer shrink-0 mb-1"
                                                    >
                                                        ✂ Take Away 1 Hundred (-100)
                                                    </button>
                                                )}

                                                <span className="text-[11px] font-bold text-sky-300 shrink-0">
                                                    {isSubBuildReady ? `${currentSubH} ${currentSubH === 1 ? 'Hundred' : 'Hundreds'} left` : 'Waiting for Step 1'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Tens Area */}
                                        <div className="flex flex-col items-center justify-between p-2 sm:p-2.5 bg-slate-900/70 rounded-xl border border-emerald-500/30 min-h-[200px] sm:min-h-[240px]">
                                            <div className="flex items-center justify-between w-full shrink-0">
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Tens Area</span>
                                                {unpackedTen && (
                                                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded">-1 Unpacked</span>
                                                )}
                                            </div>

                                            {/* Ten Rods Container */}
                                            <div className="flex-1 w-full flex flex-wrap gap-1 justify-center items-end my-auto py-1">
                                                {!isSubBuildReady ? (
                                                    <span className="text-[11px] text-slate-500 italic my-auto">Form {qData.a} in Step 1 first</span>
                                                ) : (
                                                    <>
                                                        {Array.from({ length: currentSubT }).map((_, i) => {
                                                            const isUngroupable = needsOnesUngroup && !unpackedTen;
                                                            const isCuttable = takenO === pB.o && (!needsTensUngroup || unpackedHundred) && takenT < pB.t;
                                                            return (
                                                                <div 
                                                                    key={`subcurt-${i}`} 
                                                                    onClick={() => {
                                                                        if (isUngroupable) handleUngroupTen();
                                                                        else if (isCuttable) handleTakeAwayTen();
                                                                    }}
                                                                    className={`transition-transform ${isUngroupable ? 'ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)] cursor-pointer hover:scale-105 animate-pulse' : isCuttable ? 'ring-2 ring-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)] cursor-pointer hover:scale-95 animate-pulse' : ''}`}
                                                                    title={isUngroupable ? "Tap to ungroup 1 Ten into 10 Ones" : isCuttable ? "Tap to take away 1 Ten" : undefined}
                                                                >
                                                                    <TenRod size="sm" />
                                                                </div>
                                                            );
                                                        })}
                                                        {currentSubT === 0 && (
                                                            <span className="text-[11px] text-slate-500 italic my-auto">0 Tens left</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* Action button inside column */}
                                            {isSubBuildReady && needsOnesUngroup && !unpackedTen && (
                                                <button 
                                                    onClick={handleUngroupTen}
                                                    className="w-full py-1 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] shadow-sm animate-pulse cursor-pointer shrink-0 mb-1"
                                                >
                                                    ⚡ Ungroup 1 Ten → 10 Ones
                                                </button>
                                            )}
                                            {isSubBuildReady && takenO === pB.o && (!needsTensUngroup || unpackedHundred) && takenT < pB.t && (
                                                <button 
                                                    onClick={handleTakeAwayTen}
                                                    className="w-full py-1 px-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-black text-[10px] shadow-sm animate-pulse cursor-pointer shrink-0 mb-1"
                                                >
                                                    ✂ Take Away 1 Ten (-10)
                                                </button>
                                            )}

                                            <span className="text-[11px] font-bold text-emerald-300 shrink-0">
                                                {isSubBuildReady ? `${currentSubT} ${currentSubT === 1 ? 'Ten' : 'Tens'} left` : 'Waiting for Step 1'}
                                            </span>
                                        </div>

                                        {/* Ones Area */}
                                        <div className="flex flex-col items-center justify-between p-2 sm:p-2.5 bg-slate-900/70 rounded-xl border border-amber-500/30 min-h-[200px] sm:min-h-[240px]">
                                            <div className="flex items-center justify-between w-full shrink-0">
                                                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">Ones Area</span>
                                                {unpackedTen && (
                                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">+10 Unpacked</span>
                                                )}
                                            </div>

                                            {/* One Cubes Container */}
                                            <div className="flex-1 w-full flex flex-wrap gap-1 max-w-[150px] justify-center items-center my-auto py-1">
                                                {!isSubBuildReady ? (
                                                    <span className="text-[11px] text-slate-500 italic my-auto">Form {qData.a} in Step 1 first</span>
                                                ) : (
                                                    <>
                                                        {Array.from({ length: currentSubO }).map((_, i) => {
                                                            const isCuttable = (!needsOnesUngroup || unpackedTen) && takenO < pB.o;
                                                            return (
                                                                <div 
                                                                    key={`subcuro-${i}`} 
                                                                    onClick={() => {
                                                                        if (isCuttable) handleTakeAwayOne();
                                                                    }}
                                                                    className={`transition-transform ${isCuttable ? 'ring-2 ring-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)] cursor-pointer hover:scale-110 animate-pulse' : ''}`}
                                                                    title={isCuttable ? "Tap to take away 1 One" : undefined}
                                                                >
                                                                    <OneCube size="sm" />
                                                                </div>
                                                            );
                                                        })}
                                                        {currentSubO === 0 && (
                                                            <span className="text-[11px] text-slate-500 italic my-auto">0 Ones left</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* Action button inside column */}
                                            {isSubBuildReady && (!needsOnesUngroup || unpackedTen) && takenO < pB.o && (
                                                <button 
                                                    onClick={handleTakeAwayOne}
                                                    className="w-full py-1 px-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-black text-[10px] shadow-sm animate-pulse cursor-pointer shrink-0 mb-1"
                                                >
                                                    ✂ Take Away 1 One (-1)
                                                </button>
                                            )}

                                            <span className="text-[11px] font-bold text-amber-300 shrink-0">
                                                {isSubBuildReady ? `${currentSubO} ${currentSubO === 1 ? 'One' : 'Ones'} left` : 'Waiting for Step 1'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Taken Away Bin / Summary Tray */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-950/80 rounded-xl border border-rose-500/30 shrink-0">
                                        <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
                                            ✂ Taken Away ({qData.b}):
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {takenH > 0 && <span className="text-xs font-black text-sky-400 bg-sky-500/20 px-2 py-0.5 rounded-lg">{takenH} H</span>}
                                            {takenT > 0 && <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg">{takenT} T</span>}
                                            {takenO > 0 && <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg">{takenO} O</span>}
                                            {takenH === 0 && takenT === 0 && takenO === 0 && (
                                                <span className="text-[11px] text-slate-500 italic">None taken away yet</span>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-400">
                                            Total: {takenH * 100 + takenT * 10 + takenO} / {qData.b}
                                        </span>
                                    </div>

                                    {/* Bottom Action: Proceed to Step 3 (Solve) when Section 2 is complete */}
                                    {isSubStep2Complete && (
                                        <div className="pt-1 shrink-0 animate-in fade-in duration-200">
                                            <button
                                                onClick={() => { playSound('magic'); setSubStep('abstract'); }}
                                                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 hover:from-rose-400 text-slate-950 font-black text-xs sm:text-sm shadow-md animate-pulse cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <span>Proceed to Step 3: Solve (Column Subtraction)</span>
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ==================================================================== */}
                            {/* RIGHT CONTAINER: SECTION 3 - STEP 3 SOLVE (Column Subtraction)       */}
                            {/* Sized to fit column subtraction compactly (w-full lg:w-72 xl:w-80 shrink-0) */}
                            {/* ==================================================================== */}
                            <div className={`${subStep === 'abstract' ? 'flex' : 'hidden lg:flex'} w-full lg:w-72 xl:w-80 shrink-0 flex-col justify-between p-2.5 sm:p-3 bg-slate-900/90 rounded-2xl border-2 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.12)] min-h-0`}>
                                {/* Section 3 Header */}
                                <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/80 shrink-0">
                                    <span className="bg-rose-500 text-white font-black text-xs sm:text-sm px-3 py-0.5 rounded-full shadow-sm">
                                        Step 3: Solve
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {subStep === 'abstract' && (
                                            <button
                                                onClick={() => setSubStep('build')}
                                                className="lg:hidden text-[10px] text-slate-300 hover:text-white bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-600 transition-all cursor-pointer"
                                            >
                                                ← Back to Blocks
                                            </button>
                                        )}
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${subAbsStage === 'solved' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                            {subAbsStage === 'solved' ? '✓ Solved' : 'Column Subtraction'}
                                        </span>
                                    </div>
                                </div>

                                {/* Section 3 Body */}
                                {!isSubStep2Complete && subStep !== 'abstract' ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto">
                                        <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-slate-500 mb-2">
                                            <Lock size={20} />
                                        </div>
                                        <p className="font-bold text-xs text-slate-300 mb-0.5">Step 3: Column Subtraction</p>
                                        <p className="text-[11px] text-slate-500 max-w-[200px]">Ungroup and take away blocks in Step 2 to unlock column subtraction!</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center my-auto py-2 gap-2 min-h-0">
                                        {/* Status Prompt */}
                                        <div className="text-center bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-700 w-full shrink-0">
                                            {subAbsStage === 'ones' && (
                                                <p className="text-xs font-bold text-amber-300">
                                                    👉 1️⃣ Subtract Ones: <span className="text-white font-black">{needsOnesUngroup ? `${pA.o + 10} − ${pB.o} = ${pC.o}` : `${pA.o} − ${pB.o} = ${pC.o}`}</span>
                                                    <br/><span className="text-slate-300 text-[10px] font-normal">Type {pC.o} in glowing Ones box</span>
                                                </p>
                                            )}
                                            {subAbsStage === 'tens' && (
                                                <p className="text-xs font-bold text-emerald-300">
                                                    👉 2️⃣ Subtract Tens: <span className="text-white font-black">{effectiveMinuendTens} − {pB.t} = {pC.t}</span>
                                                    <br/><span className="text-slate-300 text-[10px] font-normal">Type {pC.t} in glowing Tens box</span>
                                                </p>
                                            )}
                                            {subAbsStage === 'hundreds' && (
                                                <p className="text-xs font-bold text-sky-300">
                                                    👉 3️⃣ Subtract Hundreds: <span className="text-white font-black">{effectiveMinuendHundreds} − {pB.h} = {pC.h}</span>
                                                    <br/><span className="text-slate-300 text-[10px] font-normal">Type {pC.h} in glowing Hundreds box</span>
                                                </p>
                                            )}
                                            {subAbsStage === 'solved' && (
                                                <p className="text-xs font-black text-emerald-400 animate-bounce">
                                                    🎉 Correct! {qData.a} − {qData.b} = {qData.c}!
                                                </p>
                                            )}
                                        </div>

                                        {/* The Vertical Column Matrix for Subtraction */}
                                        <div className="bg-slate-950/80 p-3 rounded-2xl border-2 border-slate-700 shadow-inner flex flex-col items-center shrink-0">
                                            {/* Ungroup / Borrow Row */}
                                            <div className="grid grid-cols-4 gap-2 items-center text-center font-mono font-bold text-xs mb-1">
                                                <span className="w-9 sm:w-11"></span>
                                                {/* Hundreds Borrow Indicator */}
                                                <div className="w-9 sm:w-11 flex justify-center">
                                                    {needsTensUngroup && (
                                                        <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 text-[10px] font-black rounded border border-sky-500/40">
                                                            {pA.h - 1}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Tens Borrow Indicator */}
                                                <div className="w-9 sm:w-11 flex justify-center">
                                                    {needsTensUngroup ? (
                                                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded border border-emerald-500/40">
                                                            {tensAfterOnesBorrow + 10}
                                                        </span>
                                                    ) : needsOnesUngroup ? (
                                                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded border border-emerald-500/40">
                                                            {tensAfterOnesBorrow}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {/* Ones Borrow Indicator */}
                                                <div className="w-9 sm:w-11 flex justify-center">
                                                    {needsOnesUngroup && (
                                                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-black rounded border border-amber-500/40">
                                                            {pA.o + 10}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Place Value Labels */}
                                            <div className="grid grid-cols-4 gap-2 items-center text-center font-mono font-bold text-xs text-slate-500 border-b border-slate-800 pb-1 mb-1.5">
                                                <span className="w-9 sm:w-11"></span>
                                                <span className="w-9 sm:w-11 text-sky-400 font-black">{pA.h > 0 ? 'H' : ''}</span>
                                                <span className="w-9 sm:w-11 text-emerald-400 font-black">T</span>
                                                <span className="w-9 sm:w-11 text-amber-400 font-black">O</span>
                                            </div>

                                            {/* Number A (Minuend) with strikethrough if borrowed */}
                                            <div className="grid grid-cols-4 gap-2 items-center text-center font-mono font-black text-lg sm:text-xl text-slate-300 mb-0.5">
                                                <span className="w-9 sm:w-11"></span>
                                                <span className={`w-9 sm:w-11 ${needsTensUngroup ? 'line-through text-slate-500' : ''}`}>
                                                    {pA.h || ''}
                                                </span>
                                                <span className={`w-9 sm:w-11 ${(needsOnesUngroup || needsTensUngroup) ? 'line-through text-slate-500' : ''}`}>
                                                    {pA.t}
                                                </span>
                                                <span className={`w-9 sm:w-11 ${needsOnesUngroup ? 'line-through text-slate-500' : ''}`}>
                                                    {pA.o}
                                                </span>
                                            </div>

                                            {/* Number B (Subtrahend) with − */}
                                            <div className="grid grid-cols-4 gap-2 items-center text-center font-mono font-black text-lg sm:text-xl text-slate-300 border-b-2 border-slate-600 pb-1.5 mb-1.5">
                                                <span className="w-9 sm:w-11 text-rose-400 font-black text-xl">−</span>
                                                <span className="w-9 sm:w-11">{pB.h || ''}</span>
                                                <span className="w-9 sm:w-11">{pB.t}</span>
                                                <span className="w-9 sm:w-11">{pB.o}</span>
                                            </div>

                                            {/* Column Answer Inputs */}
                                            <div className="grid grid-cols-4 gap-2 items-center text-center">
                                                <span className="w-9 sm:w-11"></span>

                                                {/* Hundreds Box */}
                                                <div className="w-9 sm:w-11 flex justify-center">
                                                    {pC.h > 0 ? (
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={subAbsHundreds}
                                                            disabled={subAbsStage !== 'hundreds'}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                                if (val !== '' && Number(val) === pC.h) {
                                                                    setSubAbsHundreds(val);
                                                                    handleSubtractionSuccess();
                                                                } else {
                                                                    setSubAbsHundreds(val);
                                                                }
                                                            }}
                                                            placeholder={subAbsStage === 'hundreds' ? "?" : ""}
                                                            className={`w-9 h-9 sm:w-10 sm:h-10 text-center font-black text-sm sm:text-base rounded-xl border-2 outline-none transition-all
                                                                ${subAbsStage === 'hundreds'
                                                                    ? 'border-sky-400 bg-sky-950/40 text-white shadow-[0_0_12px_rgba(56,189,248,0.6)] animate-pulse'
                                                                    : subAbsHundreds !== ''
                                                                        ? 'border-sky-500 bg-slate-900 text-white'
                                                                        : 'border-slate-700 bg-slate-900/60 text-slate-500 cursor-not-allowed'}`}
                                                        />
                                                    ) : (
                                                        <span className="w-9 sm:w-11"></span>
                                                    )}
                                                </div>

                                                {/* Tens Box */}
                                                <div className="w-9 sm:w-11 flex justify-center">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={subAbsTens}
                                                        disabled={subAbsStage !== 'tens'}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                                            if (val !== '' && Number(val) === pC.t) {
                                                                setSubAbsTens(val);
                                                                if (pC.h > 0) {
                                                                    playSound('pop');
                                                                    setSubAbsStage('hundreds');
                                                                    speak("Now subtract the hundreds column!");
                                                                } else {
                                                                    handleSubtractionSuccess();
                                                                }
                                                            } else {
                                                                setSubAbsTens(val);
                                                            }
                                                        }}
                                                        placeholder={subAbsStage === 'tens' ? "?" : ""}
                                                        className={`w-9 h-9 sm:w-10 sm:h-10 text-center font-black text-sm sm:text-base rounded-xl border-2 outline-none transition-all
                                                            ${subAbsStage === 'tens'
                                                                ? 'border-emerald-400 bg-emerald-950/40 text-white shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-pulse'
                                                                : subAbsTens !== ''
                                                                    ? 'border-emerald-500 bg-slate-900 text-white'
                                                                    : 'border-slate-700 bg-slate-900/60 text-slate-500 cursor-not-allowed'}`}
                                                    />
                                                </div>

                                                {/* Ones Box (Must be answered FIRST!) */}
                                                <div className="w-9 sm:w-11 flex justify-center">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={subAbsOnes}
                                                        disabled={subAbsStage !== 'ones'}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                                            if (val !== '' && Number(val) === pC.o) {
                                                                setSubAbsOnes(val);
                                                                playSound('pop');
                                                                setSubAbsStage('tens');
                                                                speak("Great! Now subtract the tens column.");
                                                            } else {
                                                                setSubAbsOnes(val);
                                                            }
                                                        }}
                                                        placeholder={subAbsStage === 'ones' ? "?" : ""}
                                                        className={`w-9 h-9 sm:w-10 sm:h-10 text-center font-black text-sm sm:text-base rounded-xl border-2 outline-none transition-all
                                                            ${subAbsStage === 'ones'
                                                                ? 'border-amber-400 bg-amber-950/40 text-white shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
                                                                : subAbsOnes !== ''
                                                                    ? 'border-amber-500 bg-slate-900 text-white'
                                                                    : 'border-slate-700 bg-slate-900/60 text-slate-500 cursor-not-allowed'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Next Question Button in Section 3 Area while keeping solution in full view */}
                                        {subAbsStage === 'solved' && (
                                            <div className="w-full mt-2 animate-in zoom-in-95 duration-300">
                                                <button
                                                    onClick={handleNextQuestion}
                                                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                                                >
                                                    <span>{questionIndex + 1 < TOTAL_QUESTIONS ? 'Next Question ➔' : 'Finish Quiz & View Results 🏆'}</span>
                                                    <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {/* STEP 3: VERTICAL EQUATION & ANSWER INPUT (Exclusively for Mult, Div) */}
                {(isMult || isDiv) && (
                    <div className="w-full md:w-44 lg:w-48 bg-slate-800/90 rounded-2xl border border-slate-700 p-2.5 sm:p-3 flex flex-col justify-between shadow-sm shrink-0">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-700 pb-1 mb-2 text-center">
                            Step 3: Solve
                        </span>
                        
                        <div className="flex-1 flex flex-col items-center justify-center p-2 bg-slate-900/80 rounded-xl border border-slate-700 my-auto">
                            <div className="flex flex-col items-end gap-1 font-mono font-black text-xl sm:text-2xl">
                                <span className="text-slate-300 px-2">{qData.a}</span>
                                <div className="flex items-center gap-2 border-b-2 border-slate-500 pb-1 px-1">
                                    <span className={isMult ? 'text-amber-400' : 'text-sky-400'}>{qData.op}</span>
                                    <span className="text-slate-300">{qData.b}</span>
                                </div>
                                <div className="pt-1.5 flex items-center justify-end">
                                    <InputBox 
                                        value={inputs.eqC} 
                                        onChange={(v: string) => handleInputChange('eqC', v)} 
                                        width="w-16 sm:w-20" 
                                        ph="?"
                                        isGlowing={actionDone} 
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                            {actionDone ? "Enter answer and check!" : "Finish visual action first"}
                        </p>
                    </div>
                )}

            </div>

            {/* 3. FOOTER ACTION BAR (Shrink-0) */}
            <div className="h-12 sm:h-13 bg-slate-800/95 border-t border-slate-700 px-3 flex items-center justify-center shrink-0 z-30">
                {isAdd && (
                    <div className="text-xs text-slate-400 font-medium flex items-center justify-between w-full max-w-2xl px-2">
                        {!canAdvanceToCombine && <span>Build Number A and Number B in Step 1</span>}
                        {canAdvanceToCombine && (!tensCollected || !onesCollected) && <span className="text-sky-300 font-bold">Both numbers ready! Click Collect the Tens and Collect the Ones in Step 2.</span>}
                        {tensCollected && onesCollected && needsRegroup && !isBundled && <span className="text-amber-300 font-bold">Tap the 10 grouped ones to regroup into 1 ten rod!</span>}
                        {tensCollected && onesCollected && needsRegroup && isBundled && !isCarried && <span className="text-amber-300 font-bold">Move the new ten rod to the tens area!</span>}
                        {isSection2Complete && absStage !== 'solved' && <span className="text-emerald-300 font-bold">Step 2 complete! Solve in Step 3 (Ones → Carry → Tens).</span>}
                        {absStage === 'solved' && (
                            <div className="flex items-center justify-between w-full">
                                <span className="text-emerald-400 font-bold">🎉 Solution complete! Check your work above.</span>
                                <button
                                    onClick={handleNextQuestion}
                                    className="px-3.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer ml-auto"
                                >
                                    <span>{questionIndex + 1 < TOTAL_QUESTIONS ? 'Next Question' : 'View Results'}</span>
                                    <ArrowRight size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {isSub && (
                    <div className="text-xs text-slate-400 font-medium flex items-center justify-between w-full max-w-2xl px-2">
                        {!isSubBuildReady && <span>Build the bigger number {qData.a} in Step 1</span>}
                        {isSubBuildReady && !isSubStep2Complete && (
                            <span className="text-amber-300 font-bold">
                                {needsOnesUngroup && !unpackedTen ? "Ungroup 1 Ten into 10 Ones in Step 2!" :
                                 takenO < pB.o ? `Take away ${pB.o - takenO} more Ones in Step 2!` :
                                 needsTensUngroup && !unpackedHundred ? "Ungroup 1 Hundred into 10 Tens in Step 2!" :
                                 takenT < pB.t ? `Take away ${pB.t - takenT} more Tens in Step 2!` :
                                 `Take away ${pB.h - takenH} more Hundreds in Step 2!`}
                            </span>
                        )}
                        {isSubStep2Complete && subAbsStage !== 'solved' && <span className="text-emerald-300 font-bold">Step 2 complete! Solve in Step 3 (Ones → Tens → Hundreds).</span>}
                        {subAbsStage === 'solved' && (
                            <div className="flex items-center justify-between w-full">
                                <span className="text-emerald-400 font-bold">🎉 Solution complete! Check your work above.</span>
                                <button
                                    onClick={handleNextQuestion}
                                    className="px-3.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer ml-auto"
                                >
                                    <span>{questionIndex + 1 < TOTAL_QUESTIONS ? 'Next Question' : 'View Results'}</span>
                                    <ArrowRight size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {(isMult || isDiv) && (
                    <button 
                        onClick={handleCheckAnswer}
                        disabled={!actionDone}
                        className={`w-full max-w-sm h-9 sm:h-10 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer
                            ${!actionDone 
                                ? 'bg-slate-700 text-slate-500 border border-slate-600 cursor-not-allowed' 
                                : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sm active:translate-y-0.5'}`}
                    >
                        <span>Check Math</span>
                        <ArrowRight size={16} />
                    </button>
                )}
            </div>

        </div>
    );
}