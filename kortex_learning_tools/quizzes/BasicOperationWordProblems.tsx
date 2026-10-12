"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Settings2, Volume2, RotateCcw, CheckCircle2, ArrowRight, 
    Award, Sparkles, Scissors, Calculator, Layers, Check,
    Package, Undo2
} from 'lucide-react';

// ============================================================================
// DATA & THEMES
// ============================================================================
interface ThemeObject {
    id: string;
    singular: string;
    plural: string;
    emoji: string;
    category: 'fruit' | 'toy' | 'stationery' | 'sweet' | 'nature' | 'money';
}

const THEME_OBJECTS: ThemeObject[] = [
    { id: 'apple', singular: 'apple', plural: 'apples', emoji: '🍎', category: 'fruit' },
    { id: 'mango', singular: 'mango', plural: 'mangoes', emoji: '🥭', category: 'fruit' },
    { id: 'banana', singular: 'banana', plural: 'bananas', emoji: '🍌', category: 'fruit' },
    { id: 'orange', singular: 'orange', plural: 'oranges', emoji: '🍊', category: 'fruit' },
    { id: 'car', singular: 'toy car', plural: 'toy cars', emoji: '🚗', category: 'toy' },
    { id: 'bear', singular: 'teddy bear', plural: 'teddy bears', emoji: '🧸', category: 'toy' },
    { id: 'balloon', singular: 'balloon', plural: 'balloons', emoji: '🎈', category: 'toy' },
    { id: 'kite', singular: 'kite', plural: 'kites', emoji: '🪁', category: 'toy' },
    { id: 'pencil', singular: 'pencil', plural: 'pencils', emoji: '✏️', category: 'stationery' },
    { id: 'notebook', singular: 'notebook', plural: 'notebooks', emoji: '📓', category: 'stationery' },
    { id: 'candy', singular: 'candy', plural: 'candies', emoji: '🍬', category: 'sweet' },
    { id: 'cookie', singular: 'cookie', plural: 'cookies', emoji: '🍪', category: 'sweet' },
    { id: 'butterfly', singular: 'butterfly', plural: 'butterflies', emoji: '🦋', category: 'nature' },
    { id: 'bird', singular: 'bird', plural: 'birds', emoji: '🐦', category: 'nature' },
    { id: 'rupee', singular: 'rupee', plural: 'rupees', emoji: '🪙', category: 'money' }
];

const NAMES = ["Rahul", "Priya", "Amit", "Sara", "Kabir", "Aisha", "Rohan", "Meera", "Ananya", "Arjun"];
const FRIENDS = ["Pooja", "Vikram", "Neha", "Kunal", "Tara", "Rishi", "Sneha", "Karan"];

type Operation = '+' | '-' | '×' | '÷';
type RangeSelect = 10 | 20 | 100;
type ActiveSlot = 'numA' | 'op' | 'numB' | 'ans' | null;

interface ProblemData {
    op: Operation;
    a: number;
    b: number;
    ans: number;
    theme: ThemeObject;
    name: string;
    friend: string;
    storyText: string;
    questionText: string;
    fullText: string;
    units: string;
}

interface SubtractionItem {
    id: string;
    isCrossed: boolean;
}

const TOTAL_QUESTIONS = 5;

interface Props {
    subtopicId?: string;
    lesson?: unknown;
    onComplete?: (result: { score: number; maxScore: number }) => void;
}

// ============================================================================
// VISUAL COMPONENTS: BUNDLE OF 10 & ONES
// ============================================================================

interface TenBundleProps {
    emoji: string;
    isMoney: boolean;
    isCrossed?: boolean;
    onClick?: () => void;
    onUnbundle?: () => void;
    className?: string;
}

const TenBundle = ({ 
    emoji, 
    isMoney, 
    isCrossed = false, 
    onClick, 
    onUnbundle,
    className = "" 
}: TenBundleProps) => {
    const handleTap = onUnbundle || onClick;

    if (isMoney) {
        return (
            <div 
                onClick={handleTap}
                className={`relative flex items-center justify-center p-1 sm:p-1.5 rounded-lg border-2 transition-all select-none
                    ${isCrossed ? 'bg-rose-950/40 border-rose-500/50 opacity-50 grayscale' : 'bg-emerald-950/40 border-emerald-400 hover:border-emerald-300 shadow-sm'}
                    ${handleTap ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`}
                title={onUnbundle ? "Tap to change note" : undefined}
            >
                <div className="flex items-center gap-1">
                    <span className="text-base sm:text-lg">💵</span>
                    <span className="text-[10px] sm:text-xs font-black text-emerald-300">₹10</span>
                </div>
                {isCrossed && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-0.5 bg-rose-500 -rotate-25 rounded-full shadow-md"></div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div 
            onClick={handleTap}
            className={`relative flex items-center justify-center p-1 rounded-lg border-2 transition-all select-none
                ${isCrossed ? 'bg-rose-950/40 border-rose-500/50 opacity-50 grayscale' : 'bg-amber-950/40 border-amber-400/80 hover:border-amber-300 shadow-sm'}
                ${handleTap ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`}
            title={onUnbundle ? "Tap to unbundle" : undefined}
        >
            {/* Visual 2x5 array of 10 items packed tightly inside the bundle (no number 10, no unbundle text) */}
            <div className="grid grid-cols-5 gap-0.5 p-0.5 bg-slate-900/90 rounded-md border border-amber-400/40">
                {Array.from({ length: 10 }).map((_, i) => (
                    <span key={i} className="text-[10px] sm:text-xs leading-none flex items-center justify-center">
                        {emoji}
                    </span>
                ))}
            </div>

            {isCrossed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-0.5 bg-rose-500 -rotate-25 rounded-full shadow-md"></div>
                </div>
            )}
        </div>
    );
};

interface OneItemProps {
    emoji: string;
    isMoney: boolean;
    isCrossed?: boolean;
    onClick?: () => void;
    className?: string;
}

const OneItem = ({ emoji, isMoney, isCrossed = false, onClick, className = "" }: OneItemProps) => {
    return (
        <div 
            onClick={onClick}
            className={`relative flex items-center justify-center p-0.5 sm:p-1 rounded-md border transition-all select-none min-w-[22px] sm:min-w-[28px] min-h-[22px] sm:min-h-[28px]
                ${isCrossed ? 'bg-rose-950/40 border-rose-500/50 opacity-50 grayscale' : 'bg-slate-800/90 border-slate-700 hover:border-amber-400 shadow-xs'}
                ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : ''} ${className}`}
            title={isCrossed ? "Crossed out 1" : "1"}
        >
            <span className={`text-base sm:text-lg transition-transform ${isCrossed ? 'grayscale' : ''}`}>
                {isMoney ? '🪙' : emoji}
            </span>
            {isCrossed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-0.5 bg-rose-500 -rotate-45 shadow-sm"></div>
                </div>
            )}
        </div>
    );
};

interface TensAndOnesGroupProps {
    count: number;
    emoji: string;
    isMoney: boolean;
    badgeColor?: 'emerald' | 'sky' | 'amber' | 'purple' | 'rose';
    className?: string;
    header?: React.ReactNode;
}

const TensAndOnesGroup = ({
    count,
    emoji,
    isMoney,
    badgeColor = 'amber',
    className = "",
    header
}: TensAndOnesGroupProps) => {
    const tens = Math.floor(count / 10);
    const ones = count % 10;

    const borderColor = {
        emerald: 'border-emerald-500/40',
        sky: 'border-sky-500/40',
        amber: 'border-amber-500/40',
        purple: 'border-purple-500/40',
        rose: 'border-rose-500/80 bg-rose-950/40 shadow-rose-950/50'
    }[badgeColor];

    return (
        <div className={`flex-1 h-full w-full min-h-0 bg-slate-900/90 rounded-2xl border-2 ${borderColor} p-2 sm:p-2.5 flex flex-col items-center justify-between shadow-md transition-all ${className}`}>
            {header && (
                <div className="shrink-0 mb-1 w-full flex items-center justify-center">
                    {header}
                </div>
            )}
            {/* Visual Content: Horizontally divided (Bundles on Top, Loose items on Bottom) */}
            <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-1.5 p-1 overflow-y-auto">
                {/* Top: Bundles of 10 */}
                {tens > 0 && (
                    <div className="w-full flex flex-wrap items-center justify-center gap-2 shrink-0">
                        {Array.from({ length: tens }).map((_, i) => (
                            <TenBundle key={i} emoji={emoji} isMoney={isMoney} />
                        ))}
                    </div>
                )}

                {/* Horizontal divider line if both bundles and loose items exist */}
                {tens > 0 && ones > 0 && (
                    <div className="w-3/4 max-w-[220px] h-[1.5px] bg-slate-700/80 shrink-0 my-0.5 rounded-full"></div>
                )}

                {/* Bottom: Loose items */}
                {ones > 0 && (
                    <div className="w-full flex flex-wrap items-center justify-center gap-1.5 shrink-0">
                        {Array.from({ length: ones }).map((_, i) => (
                            <OneItem key={i} emoji={emoji} isMoney={isMoney} />
                        ))}
                    </div>
                )}

                {/* Zero case */}
                {count === 0 && (
                    <div className="flex-1 flex items-center justify-center py-1">
                        <span className="text-sm font-black text-slate-500 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60">0</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BasicOperationWordProblems({ onComplete }: Props) {
    // Config State
    const [phase, setPhase] = useState<'config' | 'playing' | 'completed'>('config');
    const [configOp, setConfigOp] = useState<Operation | 'mixed'>('+');
    const [configRange, setConfigRange] = useState<RangeSelect>(10);

    // Quiz Session State
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [problem, setProblem] = useState<ProblemData | null>(null);

    // Pictorial Area Operation Selection State
    const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
    const [wrongOp, setWrongOp] = useState<Operation | null>(null);

    // Interactive Action States for Operations
    const [additionGrouped, setAdditionGrouped] = useState(false);
    const [multRepeatedCount, setMultRepeatedCount] = useState(1);
    const [multGrouped, setMultGrouped] = useState(false);
    const [divEachCount, setDivEachCount] = useState(0);

    // Subtraction Interactive State (Tens bundles & Loose Ones)
    const [subTens, setSubTens] = useState<SubtractionItem[]>([]);
    const [subOnes, setSubOnes] = useState<SubtractionItem[]>([]);

    // Equation Slots Input State
    const [inputA, setInputA] = useState<string>("");
    const [inputOp, setInputOp] = useState<string>("");
    const [inputB, setInputB] = useState<string>("");
    const [inputAns, setInputAns] = useState<string>("");
    const [activeSlot, setActiveSlot] = useState<ActiveSlot>('numA');

    // Feedback State
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Audio Context Ref
    const audioCtxRef = useRef<AudioContext | null>(null);

    // --- SOUND ENGINE ---
    const playSound = useCallback((type: 'pop' | 'click' | 'snip' | 'kaching' | 'success' | 'error' | 'whoosh') => {
        if (typeof window === 'undefined') return;
        try {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
            }
            const ctx = audioCtxRef.current;
            if (!ctx) return;
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'pop' || type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(type === 'pop' ? 520 : 700, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'snip') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(900, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.09);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.09);
            } else if (type === 'kaching') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(987.77, ctx.currentTime);
                osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            } else if (type === 'whoosh') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'success') {
                const now = ctx.currentTime;
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const noteOsc = ctx.createOscillator();
                    const noteGain = ctx.createGain();
                    noteOsc.connect(noteGain);
                    noteGain.connect(ctx.destination);
                    noteOsc.type = 'sine';
                    noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    noteGain.gain.setValueAtTime(0.12, now + idx * 0.08);
                    noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
                    noteOsc.start(now + idx * 0.08);
                    noteOsc.stop(now + idx * 0.08 + 0.2);
                });
            }
        } catch {
            // Audio context safely ignored if blocked by autoplay policy
        }
    }, []);

    // Text to Speech
    const speak = useCallback((text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.88;
            utterance.pitch = 1.05;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    // --- PROBLEM GENERATION LOGIC ---
    const generateNewProblem = useCallback((): ProblemData => {
        let op: Operation = '+';
        if (configOp === 'mixed') {
            const ops: Operation[] = ['+', '-', '×', '÷'];
            op = ops[Math.floor(Math.random() * ops.length)];
        } else {
            op = configOp;
        }

        const max = configRange;
        let a = 0;
        let b = 0;
        let ans = 0;

        if (op === '+') {
            if (max === 10) {
                ans = Math.floor(Math.random() * 8) + 3; // 3..10
                a = Math.floor(Math.random() * (ans - 1)) + 1;
                b = ans - a;
            } else if (max === 20) {
                ans = Math.floor(Math.random() * 11) + 10; // 10..20
                a = Math.floor(Math.random() * (ans - 3)) + 2;
                b = ans - a;
            } else {
                ans = Math.floor(Math.random() * 60) + 30; // 30..89
                a = Math.floor(Math.random() * (ans - 10)) + 10;
                b = ans - a;
            }
        } else if (op === '-') {
            if (max === 10) {
                a = Math.floor(Math.random() * 7) + 4; // 4..10
                b = Math.floor(Math.random() * (a - 1)) + 1;
                ans = a - b;
            } else if (max === 20) {
                a = Math.floor(Math.random() * 10) + 11; // 11..20
                b = Math.floor(Math.random() * (a - 4)) + 2;
                ans = a - b;
            } else {
                a = Math.floor(Math.random() * 50) + 45; // 45..94
                b = Math.floor(Math.random() * (a - 15)) + 10;
                ans = a - b;
            }
        } else if (op === '×') {
            if (max === 10) {
                const pairs = [[2, 2], [2, 3], [3, 2], [2, 4], [4, 2], [2, 5], [5, 2], [3, 3]];
                const pair = pairs[Math.floor(Math.random() * pairs.length)];
                a = pair[0];
                b = pair[1];
                ans = a * b;
            } else if (max === 20) {
                const pairs = [
                    [2, 6], [6, 2], [3, 4], [4, 3], [3, 5], [5, 3],
                    [2, 7], [7, 2], [2, 8], [8, 2], [4, 4], [3, 6], [4, 5], [5, 4]
                ];
                const pair = pairs[Math.floor(Math.random() * pairs.length)];
                a = pair[0];
                b = pair[1];
                ans = a * b;
            } else {
                a = Math.floor(Math.random() * 7) + 3; // 3..9
                b = Math.floor(Math.random() * 8) + 2; // 2..9
                ans = a * b;
            }
        } else {
            // op === '÷'
            if (max === 10) {
                const divisors = [2, 3];
                b = divisors[Math.floor(Math.random() * divisors.length)];
                ans = Math.floor(Math.random() * Math.floor(10 / b - 1)) + 2;
                a = b * ans;
            } else if (max === 20) {
                const divisors = [2, 3, 4, 5];
                b = divisors[Math.floor(Math.random() * divisors.length)];
                ans = Math.floor(Math.random() * Math.floor(20 / b - 1)) + 2;
                a = b * ans;
            } else {
                b = Math.floor(Math.random() * 7) + 3; // 3..9
                ans = Math.floor(Math.random() * 8) + 2; // 2..9
                a = b * ans;
            }
        }

        // Pick Theme & Names
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];
        const friend = FRIENDS[Math.floor(Math.random() * FRIENDS.length)];
        const theme = THEME_OBJECTS[Math.floor(Math.random() * THEME_OBJECTS.length)];
        const isMoney = theme.category === 'money';

        let storyText = "";
        let questionText = "";

        if (op === '+') {
            if (isMoney) {
                storyText = `${name} had ₹${a} in their piggy bank. ${friend} gave them ₹${b} more.`;
                questionText = `How much money does ${name} have now?`;
            } else {
                const stories = [
                    `${name} collected ${a} ${a === 1 ? theme.singular : theme.plural}. ${friend} brought ${b} more ${b === 1 ? theme.singular : theme.plural}.`,
                    `There were ${a} ${a === 1 ? theme.singular : theme.plural} in the basket. ${name} placed ${b} more inside.`
                ];
                storyText = stories[Math.floor(Math.random() * stories.length)];
                questionText = `What is the total number of ${theme.plural}?`;
            }
        } else if (op === '-') {
            if (isMoney) {
                storyText = `${name} had ₹${a}. They bought a treat for ₹${b}.`;
                questionText = `How much money is left with ${name}?`;
            } else {
                const stories = [
                    `${name} had ${a} ${a === 1 ? theme.singular : theme.plural}. They gave ${b} of them to ${friend}.`,
                    `There were ${a} ${a === 1 ? theme.singular : theme.plural}. ${name} shared ${b} with their class.`
                ];
                storyText = stories[Math.floor(Math.random() * stories.length)];
                questionText = `How many ${theme.plural} are left?`;
            }
        } else if (op === '×') {
            if (isMoney) {
                storyText = `One chocolate costs ₹${b}. ${name} bought ${a} chocolates.`;
                questionText = `How much money did ${name} pay in total?`;
            } else {
                storyText = `${name} has ${a} baskets. Each basket contains ${b} ${b === 1 ? theme.singular : theme.plural}.`;
                questionText = `How many ${theme.plural} are there altogether?`;
            }
        } else {
            // op === '÷'
            if (isMoney) {
                storyText = `Grandmother gave ₹${a} to be shared equally between ${b} children.`;
                questionText = `How much money does each child receive?`;
            } else {
                storyText = `${name} has ${a} ${theme.plural} and wants to share them equally among ${b} friends.`;
                questionText = `How many ${theme.plural} does each friend get?`;
            }
        }

        const fullText = `${storyText} ${questionText}`;

        return {
            op,
            a,
            b,
            ans,
            theme,
            name,
            friend,
            storyText,
            questionText,
            fullText,
            units: isMoney ? '₹' : theme.plural
        };
    }, [configOp, configRange]);

    // Reset State for Next Question
    const resetQuestionState = (prob?: ProblemData) => {
        const targetProb = prob || problem;
        if (targetProb) {
            const tensCount = Math.floor(targetProb.a / 10);
            const onesCount = targetProb.a % 10;
            setSubTens(Array.from({ length: tensCount }, (_, i) => ({ id: `ten-${i}`, isCrossed: false })));
            setSubOnes(Array.from({ length: onesCount }, (_, i) => ({ id: `one-${i}`, isCrossed: false })));
        }

        // Reset Pictorial Operation & Interactive Actions
        setSelectedOp(null);
        setWrongOp(null);
        setAdditionGrouped(false);
        setMultRepeatedCount(1);
        setMultGrouped(false);
        setDivEachCount(0);

        // Clear equation input slots
        setInputA("");
        setInputOp("");
        setInputB("");
        setInputAns("");
        setActiveSlot('numA');
        setFeedback('idle');
    };

    // Select Operation in Pictorial Area
    const handleSelectPictorialOp = (op: Operation) => {
        if (!problem) return;
        if (op !== problem.op) {
            playSound('error');
            setWrongOp(op);
            setTimeout(() => setWrongOp(null), 700);
            return;
        }
        playSound('kaching');
        setSelectedOp(op);
        setInputOp(op);
        if (inputA === "") setActiveSlot('numA');
        else if (inputB === "") setActiveSlot('numB');
        else if (inputAns === "") setActiveSlot('ans');
    };

    // Start New Session
    const handleStartPractice = () => {
        playSound('whoosh');
        setQuestionIndex(0);
        setScore(0);
        const firstProb = generateNewProblem();
        setProblem(firstProb);
        resetQuestionState(firstProb);
        setPhase('playing');
        speak(firstProb.fullText);
    };

    // Load Next Question
    const handleNextQuestion = () => {
        playSound('whoosh');
        if (questionIndex + 1 < TOTAL_QUESTIONS) {
            const nextIdx = questionIndex + 1;
            setQuestionIndex(nextIdx);
            const nextProb = generateNewProblem();
            setProblem(nextProb);
            resetQuestionState(nextProb);
            speak(nextProb.fullText);
        } else {
            playSound('success');
            setPhase('completed');
            onComplete?.({ score: score, maxScore: TOTAL_QUESTIONS });
        }
    };

    // --- SUBTRACTION VISUAL ACTIONS ---

    // Toggle cut on a 1-item
    const handleToggleOneCross = (idx: number) => {
        playSound('snip');
        setSubOnes(prev => prev.map((o, i) => i === idx ? { ...o, isCrossed: !o.isCrossed } : o));
    };

    // Unbundle a specific Ten bundle upon tap into 10 loose items
    const handleUnbundleSpecificTen = (idx: number) => {
        playSound('snip');
        setSubTens(prev => prev.filter((_, i) => i !== idx));
        const newOnes: SubtractionItem[] = Array.from({ length: 10 }, (_, i) => ({
            id: `unbundled-${Date.now()}-${i}`,
            isCrossed: false
        }));
        setSubOnes(prev => [...prev, ...newOnes]);
    };

    // Rebundle 10 loose Ones back into 1 Ten
    const handleRebundleOnes = () => {
        const uncrossedCount = subOnes.filter(o => !o.isCrossed).length;
        if (uncrossedCount < 10) return;
        playSound('pop');
        let removed = 0;
        const remainingOnes = subOnes.filter(o => {
            if (!o.isCrossed && removed < 10) {
                removed++;
                return false;
            }
            return true;
        });
        setSubOnes(remainingOnes);
        setSubTens(prev => [...prev, { id: `rebundled-${Date.now()}`, isCrossed: false }]);
    };

    // Auto Cut target B items
    const handleAutoCut = () => {
        if (!problem) return;
        playSound('snip');
        const targetCut = problem.b;
        let currentTens = subTens.map(t => ({ ...t, isCrossed: false }));
        let currentOnes = subOnes.map(o => ({ ...o, isCrossed: false }));

        const targetTens = Math.floor(targetCut / 10);
        const targetOnes = targetCut % 10;

        // Unbundle tens if we don't have enough loose ones to cover targetOnes
        while (currentOnes.length < targetOnes && currentTens.length > targetTens) {
            currentTens.pop();
            for (let i = 0; i < 10; i++) {
                currentOnes.push({ id: `autocut-unbundled-${Date.now()}-${i}`, isCrossed: false });
            }
        }

        // Cross out tens
        let tensCut = 0;
        currentTens = currentTens.map(t => {
            if (tensCut < targetTens) {
                tensCut++;
                return { ...t, isCrossed: true };
            }
            return t;
        });

        // Cross out ones
        let onesCut = 0;
        currentOnes = currentOnes.map(o => {
            if (onesCut < targetOnes) {
                onesCut++;
                return { ...o, isCrossed: true };
            }
            return o;
        });

        setSubTens(currentTens);
        setSubOnes(currentOnes);
    };

    // Reset Cuts
    const handleResetCuts = () => {
        playSound('click');
        setSubTens(prev => prev.map(t => ({ ...t, isCrossed: false })));
        setSubOnes(prev => prev.map(o => ({ ...o, isCrossed: false })));
    };

    // --- DIVISION VISUAL ACTIONS ---

    // Distribute 1 to each part/tray
    const handleDistributeStep = () => {
        if (!problem) return;
        const remaining = problem.a - (divEachCount * problem.b);
        if (remaining < problem.b) return;
        const nextCount = divEachCount + 1;
        const nextRemaining = problem.a - (nextCount * problem.b);
        setDivEachCount(nextCount);
        if (nextRemaining < problem.b) {
            playSound('kaching');
        } else {
            playSound('pop');
        }
    };

    // Reset division distribution
    const handleResetDiv = () => {
        playSound('pop');
        setDivEachCount(0);
    };

    // Auto-advance equation slots when typed
    const handleKeypadInput = (char: string) => {
        if (feedback === 'correct' || !problem) return;
        playSound('click');

        if (char === 'clear') {
            if (activeSlot === 'numA') setInputA("");
            else if (activeSlot === 'op') setInputOp("");
            else if (activeSlot === 'numB') setInputB("");
            else if (activeSlot === 'ans') setInputAns("");
            return;
        }

        if (char === 'backspace') {
            if (activeSlot === 'numA') setInputA(prev => prev.slice(0, -1));
            else if (activeSlot === 'op') setInputOp("");
            else if (activeSlot === 'numB') setInputB(prev => prev.slice(0, -1));
            else if (activeSlot === 'ans') setInputAns(prev => prev.slice(0, -1));
            return;
        }

        // Operation button pressed
        if (['+', '-', '×', '÷'].includes(char)) {
            setInputOp(char);
            setActiveSlot('numB');
            return;
        }

        // Digit entered
        if (/^[0-9]$/.test(char)) {
            if (activeSlot === 'numA') {
                const nextVal = (inputA + char).slice(0, 3);
                setInputA(nextVal);
                if (nextVal.length >= problem.a.toString().length) {
                    setActiveSlot('op');
                }
            } else if (activeSlot === 'op') {
                setActiveSlot('numB');
                setInputB(char);
            } else if (activeSlot === 'numB') {
                const nextVal = (inputB + char).slice(0, 3);
                setInputB(nextVal);
                if (nextVal.length >= problem.b.toString().length) {
                    setActiveSlot('ans');
                }
            } else if (activeSlot === 'ans') {
                setInputAns(prev => (prev + char).slice(0, 4));
            }
        }
    };

    // Check Answer
    const handleCheckAnswer = () => {
        if (!problem || feedback === 'correct') return;

        const valA = parseInt(inputA);
        const valB = parseInt(inputB);
        const valAns = parseInt(inputAns);

        const isOpCorrect = inputOp === problem.op;
        const isAnsCorrect = valAns === problem.ans;
        
        let isNumbersCorrect = false;
        if (problem.op === '+' || problem.op === '×') {
            isNumbersCorrect = (valA === problem.a && valB === problem.b) || (valA === problem.b && valB === problem.a);
        } else {
            isNumbersCorrect = valA === problem.a && valB === problem.b;
        }

        if (isOpCorrect && isAnsCorrect && isNumbersCorrect) {
            playSound('success');
            setFeedback('correct');
            setScore(prev => prev + 1);
            speak(`Awesome job! ${problem.a} ${problem.op} ${problem.b} equals ${problem.ans} ${problem.units}!`);
        } else {
            playSound('error');
            setFeedback('wrong');
            speak("Check the equation again! Make sure all numbers and operations match the story.");
        }
    };

    // Ref to hold current action functions for keyboard listener
    const actionsRef = useRef({ handleKeypadInput, handleCheckAnswer, handleNextQuestion });
    useEffect(() => {
        actionsRef.current = { handleKeypadInput, handleCheckAnswer, handleNextQuestion };
    });

    // Keyboard support for desktop / smartboards
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (phase !== 'playing') return;
            if (/^[0-9]$/.test(e.key)) {
                actionsRef.current.handleKeypadInput(e.key);
            } else if (['+', '-', '*', '/'].includes(e.key)) {
                const map: Record<string, string> = { '+': '+', '-': '-', '*': '×', '/': '÷' };
                actionsRef.current.handleKeypadInput(map[e.key]);
            } else if (e.key === 'Backspace') {
                actionsRef.current.handleKeypadInput('backspace');
            } else if (e.key === 'Enter') {
                if (feedback === 'correct') actionsRef.current.handleNextQuestion();
                else actionsRef.current.handleCheckAnswer();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, feedback]);

    // Subtraction live calculations
    const totalCut = (subTens.filter(t => t.isCrossed).length * 10) + subOnes.filter(o => o.isCrossed).length;
    const remainingCount = problem ? Math.max(0, problem.a - totalCut) : 0;
    const uncrossedOnesCount = subOnes.filter(o => !o.isCrossed).length;

    // Addition regrouping check
    const isAdditionRegrouping = problem && problem.op === '+' && ((problem.a % 10) + (problem.b % 10) >= 10);

    // ============================================================================
    // RENDER: PHASE 1 - CONFIGURATION
    // ============================================================================
    if (phase === 'config') {
        const operationsList: { id: Operation | 'mixed'; label: string; icon: string; color: string }[] = [
            { id: '+', label: 'Addition', icon: '+', color: 'bg-emerald-500' },
            { id: '-', label: 'Subtraction', icon: '−', color: 'bg-rose-500' },
            { id: '×', label: 'Multiplication', icon: '×', color: 'bg-amber-500' },
            { id: '÷', label: 'Division', icon: '÷', color: 'bg-sky-500' },
            { id: 'mixed', label: 'All Operations (Mixed)', icon: '✨', color: 'bg-purple-600' }
        ];

        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 bg-slate-900 font-sans text-white select-none overflow-hidden relative">
                <div className="max-w-lg w-full bg-slate-800/95 p-5 sm:p-7 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-slate-700 shadow-2xl text-center space-y-4">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/40 shadow-inner">
                            <Calculator size={26} />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            Basic Operations Word Problems
                        </h1>
                        <p className="text-xs text-slate-400 font-medium">
                            Read stories, explore visual models, and build math equations
                        </p>
                    </div>

                    {/* 1. Operation Selection */}
                    <div className="text-left space-y-1.5">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                            1. Choose Operation
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            {operationsList.map(opItem => {
                                const isActive = configOp === opItem.id;
                                return (
                                    <button
                                        key={opItem.id}
                                        onClick={() => {
                                            playSound('click');
                                            setConfigOp(opItem.id);
                                        }}
                                        className={`p-2.5 rounded-xl border-2 transition-all flex items-center gap-2 cursor-pointer active:scale-95 text-left
                                            ${isActive ? `${opItem.color} border-white shadow-md text-white` : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500'}
                                            ${opItem.id === 'mixed' ? 'col-span-2' : ''}`}
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black text-base shrink-0">
                                            {opItem.icon}
                                        </div>
                                        <span className="font-bold text-xs leading-tight truncate">
                                            {opItem.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Number Range */}
                    <div className="text-left space-y-1.5">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                            2. Number Range
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                            {([10, 20, 100] as RangeSelect[]).map(rangeVal => {
                                const isActive = configRange === rangeVal;
                                return (
                                    <button
                                        key={rangeVal}
                                        onClick={() => {
                                            playSound('click');
                                            setConfigRange(rangeVal);
                                        }}
                                        className={`py-2.5 px-3 rounded-xl border-2 transition-all font-black text-xs sm:text-sm cursor-pointer active:scale-95 text-center
                                            ${isActive ? 'bg-sky-500 border-white text-white shadow-md' : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        Up to {rangeVal}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={handleStartPractice}
                        className="w-full bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-950 font-black text-sm sm:text-base py-3 rounded-xl shadow-lg border-b-4 border-emerald-700 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                        <Sparkles size={18} /> START WORD PROBLEMS (5 Stories)
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PHASE 3 - VICTORY SCREEN
    // ============================================================================
    if (phase === 'completed') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 font-sans text-white p-3 sm:p-5 select-none overflow-hidden">
                <div className="max-w-md w-full bg-slate-800/95 p-5 sm:p-7 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-slate-700 shadow-2xl text-center space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-400/20 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-inner border-2 border-amber-400">
                        <Award className="w-9 h-9 sm:w-11 sm:h-11" />
                    </div>

                    <div>
                        <h2 className="text-xl sm:text-3xl font-black text-white">Story Problem Champion!</h2>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">You solved all math stories with visual models and equations!</p>
                    </div>

                    <div className="bg-slate-900/80 py-3 px-4 rounded-xl border border-slate-700 flex items-center justify-around">
                        <div className="text-center">
                            <span className="text-xs text-slate-400 font-bold uppercase block">Stories Solved</span>
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
                            onClick={handleStartPractice}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl border-2 border-slate-600 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <RotateCcw size={15} /> Play Again
                        </button>
                        {onComplete && (
                            <button 
                                onClick={() => onComplete({ score, maxScore: TOTAL_QUESTIONS })}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl border-b-3 border-emerald-700 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                                <CheckCircle2 size={16} /> Finish Lesson
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PHASE 2 - ACTIVE PLAYING (100% Zero-Scroll Viewport Responsive)
    // ============================================================================
    if (!problem) return null;

    const isMoney = problem.theme.category === 'money';

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 font-sans text-white select-none overflow-hidden relative">
            
            {/* 1. TOP HEADER (h-11 sm:h-12 shrink-0) */}
            <div className="h-11 sm:h-12 w-full bg-slate-800/90 border-b border-slate-700 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setPhase('config')} 
                        className="bg-slate-700/80 hover:bg-slate-600 text-slate-300 p-1.5 rounded-lg border border-slate-600 active:scale-95 transition-all cursor-pointer"
                        title="Back to Setup"
                    >
                        <Settings2 size={15} />
                    </button>
                    <span className="text-[10px] sm:text-xs font-black bg-indigo-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                        Story {questionIndex + 1}/{TOTAL_QUESTIONS}
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

                {/* Score & Audio */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => speak(problem.fullText)}
                        className={`p-1.5 rounded-lg border active:scale-95 transition-all cursor-pointer flex items-center gap-1
                            ${isSpeaking ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse' : 'bg-slate-700/80 hover:bg-slate-600 text-slate-300 border-slate-600'}`}
                        title="Read Story Aloud"
                    >
                        <Volume2 size={15} />
                    </button>
                    <div className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-black rounded-lg text-[10px] sm:text-xs">
                        Score: {score}
                    </div>
                </div>
            </div>

            {/* 2. STORY BANNER CARD (Compact Story Reader) */}
            <div className="shrink-0 bg-slate-950/80 border-b border-slate-800 px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 z-20">
                <div className="flex-1 flex items-center gap-2 overflow-hidden">
                    <div className="text-xl sm:text-2xl shrink-0 p-1 bg-slate-900 rounded-xl border border-slate-800 shadow-inner">
                        {problem.theme.emoji}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-snug line-clamp-2">
                            {problem.storyText}{' '}
                            <span className="text-amber-300 font-black underline decoration-amber-400/40">
                                {problem.questionText}
                            </span>
                        </p>
                    </div>
                </div>

            </div>

            {/* 3. MAIN WORKSPACE: INTERACTIVE PICTORIAL MODEL (Flex-1, Zero-Scroll) */}
            <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center p-2 sm:p-3 overflow-hidden">
                <div className="w-full max-w-4xl h-full flex flex-col justify-center items-center gap-2">
                    
                    {/* Visual Model Container */}
                    <div className="w-full flex-1 min-h-0 bg-slate-950/60 rounded-2xl border-2 border-slate-800 p-2 sm:p-2.5 flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                        
                        {/* PHASE A: OPERATION SELECTION (Child chooses from 4 symbols) */}
                        {selectedOp === null ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-3 select-none">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-xl w-full">
                                    {[
                                        { op: '+' as Operation, symbol: '+', bg: 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/40 hover:border-emerald-400 text-emerald-400' },
                                        { op: '-' as Operation, symbol: '−', bg: 'bg-rose-500/10 hover:bg-rose-500/25 border-rose-500/40 hover:border-rose-400 text-rose-400' },
                                        { op: '×' as Operation, symbol: '×', bg: 'bg-amber-500/10 hover:bg-amber-500/25 border-amber-500/40 hover:border-amber-400 text-amber-400' },
                                        { op: '÷' as Operation, symbol: '÷', bg: 'bg-sky-500/10 hover:bg-sky-500/25 border-sky-500/40 hover:border-sky-400 text-sky-400' },
                                    ].map((item) => (
                                        <button
                                            key={item.op}
                                            type="button"
                                            onClick={() => handleSelectPictorialOp(item.op)}
                                            className={`h-24 sm:h-32 rounded-2xl border-2 flex items-center justify-center font-black text-4xl sm:text-5xl shadow-lg transition-all cursor-pointer active:scale-95 hover:scale-105 select-none
                                                ${item.bg}
                                                ${wrongOp === item.op ? 'ring-4 ring-rose-500 bg-rose-500/30 scale-95 animate-shake' : ''}`}
                                        >
                                            {item.symbol}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-1 sm:p-2 overflow-hidden">
                                {/* 1. ADDITION */}
                                {selectedOp === '+' && (
                                    <div className="w-full h-full flex items-center justify-center gap-2 sm:gap-4 overflow-hidden">
                                        {!additionGrouped ? (
                                            <>
                                                <TensAndOnesGroup count={problem.a} emoji={problem.theme.emoji} isMoney={isMoney} badgeColor="emerald" />
                                                <div className="text-xl sm:text-2xl font-black text-emerald-400 shrink-0">+</div>
                                                <TensAndOnesGroup count={problem.b} emoji={problem.theme.emoji} isMoney={isMoney} badgeColor="sky" />
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center max-w-md">
                                                <TensAndOnesGroup count={problem.ans} emoji={problem.theme.emoji} isMoney={isMoney} badgeColor="amber" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 2. SUBTRACTION */}
                                {selectedOp === '-' && (
                                    <div className="w-full h-full bg-slate-900/90 rounded-2xl border-2 border-slate-700 p-2 sm:p-3 flex flex-col items-center justify-center gap-2 shadow-inner overflow-y-auto">
                                        {/* Top: Bundles of 10 (Simple tap unbundles) */}
                                        {subTens.length > 0 && (
                                            <div className="w-full flex flex-wrap items-center justify-center gap-2 sm:gap-3 shrink-0">
                                                {subTens.map((tenItem, idx) => (
                                                    <TenBundle
                                                        key={tenItem.id}
                                                        emoji={problem.theme.emoji}
                                                        isMoney={isMoney}
                                                        isCrossed={tenItem.isCrossed}
                                                        onUnbundle={() => handleUnbundleSpecificTen(idx)}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Horizontal Divider */}
                                        {subTens.length > 0 && subOnes.length > 0 && (
                                            <div className="w-3/4 max-w-md h-[1.5px] bg-slate-700/80 shrink-0 my-0.5 rounded-full"></div>
                                        )}

                                        {/* Bottom: Loose Items (Tap cuts down / crosses out) */}
                                        {subOnes.length > 0 && (
                                            <div className="w-full flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 shrink-0">
                                                {subOnes.map((oneItem, idx) => (
                                                    <OneItem
                                                        key={oneItem.id}
                                                        emoji={problem.theme.emoji}
                                                        isMoney={isMoney}
                                                        isCrossed={oneItem.isCrossed}
                                                        onClick={() => handleToggleOneCross(idx)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 3. MULTIPLICATION */}
                                {selectedOp === '×' && (
                                    <div className="w-full h-full flex items-center justify-center gap-2 sm:gap-3 overflow-hidden">
                                        {!multGrouped ? (
                                            <div className="w-full h-full flex items-center justify-center gap-2 sm:gap-3 overflow-hidden">
                                                {Array.from({ length: multRepeatedCount }).map((_, groupIdx) => (
                                                    <div
                                                        key={groupIdx}
                                                        className="flex-1 h-full min-h-0 bg-slate-900/90 rounded-2xl border-2 border-amber-400/50 p-2 sm:p-2.5 flex flex-col items-center justify-center shadow-md overflow-hidden"
                                                    >
                                                        <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-1 p-1 overflow-y-auto">
                                                            {Math.floor(problem.b / 10) > 0 && (
                                                                <div className="w-full flex flex-wrap items-center justify-center gap-1 shrink-0">
                                                                    {Array.from({ length: Math.floor(problem.b / 10) }).map((_, tenIdx) => (
                                                                        <TenBundle key={tenIdx} emoji={problem.theme.emoji} isMoney={isMoney} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {Math.floor(problem.b / 10) > 0 && (problem.b % 10) > 0 && (
                                                                <div className="w-3/4 h-[1px] bg-slate-700/60 my-0.5 rounded-full shrink-0"></div>
                                                            )}
                                                            {problem.b % 10 > 0 && (
                                                                <div className="w-full flex flex-wrap items-center justify-center gap-1 shrink-0">
                                                                    {Array.from({ length: problem.b % 10 }).map((_, itemIdx) => (
                                                                        <OneItem key={itemIdx} emoji={problem.theme.emoji} isMoney={isMoney} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center max-w-md">
                                                <TensAndOnesGroup count={problem.ans} emoji={problem.theme.emoji} isMoney={isMoney} badgeColor="amber" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 4. DIVISION: Step-by-Step Equal Distribution (Side-by-Side Responsive) */}
                                {selectedOp === '÷' && (() => {
                                    const remaining = problem.a - (divEachCount * problem.b);
                                    const cannotDivideMore = remaining < problem.b;

                                    return (
                                        <div className="w-full h-full flex flex-col sm:flex-row items-stretch justify-between gap-2 overflow-hidden">
                                            {/* LEFT: Total Pool to Share (Shows remaining items, turns RED when cannot divide equally anymore) */}
                                            <div className="w-full sm:w-60 md:w-72 lg:w-80 shrink-0 h-[44%] sm:h-full flex flex-col min-h-0">
                                                <TensAndOnesGroup
                                                    count={remaining}
                                                    emoji={problem.theme.emoji}
                                                    isMoney={isMoney}
                                                    badgeColor={cannotDivideMore ? 'rose' : 'sky'}
                                                    header={
                                                        cannotDivideMore ? (
                                                            <div className="w-full flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl bg-rose-500/25 border-2 border-rose-500 text-rose-200 text-center animate-pulse shadow-md">
                                                                <div className="w-full flex items-center justify-between text-xs sm:text-sm font-black text-rose-100">
                                                                    <span>Remaining</span>
                                                                    <span className="font-mono text-sm sm:text-base font-black text-rose-300">{remaining}</span>
                                                                </div>
                                                                <span className="text-[10px] sm:text-xs font-bold text-rose-200 leading-tight">
                                                                    Less than {problem.b} quantity remaining, cannot divide equally anymore
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full flex items-center justify-between px-3 py-1 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-200 text-xs sm:text-sm font-bold shadow-xs">
                                                                <span>Remaining</span>
                                                                <span className="font-mono text-sm sm:text-base font-black text-sky-300">{remaining}</span>
                                                            </div>
                                                        )
                                                    }
                                                />
                                            </div>

                                            {/* RIGHT: Sharing Trays */}
                                            <div className="w-full flex-1 min-w-0 h-[56%] sm:h-full flex items-stretch justify-center gap-1.5 sm:gap-2.5 overflow-x-auto p-0.5">
                                                {Array.from({ length: problem.b }).map((_, trayIdx) => (
                                                    <div
                                                        key={trayIdx}
                                                        className={`flex-1 min-w-[64px] sm:min-w-[80px] max-w-[150px] h-full rounded-2xl border-2 p-1.5 sm:p-2 flex flex-col items-center justify-between shadow-md overflow-hidden transition-all
                                                            ${divEachCount === 0 
                                                                ? 'bg-slate-900/60 border-dashed border-sky-400/40' 
                                                                : 'bg-slate-900/90 border-sky-400/60 shadow-sky-950/40'}`}
                                                    >
                                                        {/* Header: X each */}
                                                        {divEachCount > 0 ? (
                                                            <span className="text-xs sm:text-sm font-black text-sky-300 bg-sky-950/90 px-2.5 py-0.5 rounded-full border border-sky-400/50 shrink-0 whitespace-nowrap shadow-xs">
                                                                {divEachCount} each
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 shrink-0">
                                                                Part {trayIdx + 1}
                                                            </span>
                                                        )}

                                                        {/* Content of tray: visual representation */}
                                                        <div className="w-full flex-1 min-h-0 flex flex-wrap items-center justify-center content-center gap-1 p-1 overflow-y-auto">
                                                            {divEachCount === 0 ? (
                                                                <div className="flex flex-col items-center justify-center gap-1 opacity-40">
                                                                    <span className="text-2xl sm:text-3xl">🍽️</span>
                                                                    <span className="text-[10px] font-medium text-slate-400">Empty</span>
                                                                </div>
                                                            ) : (
                                                                Array.from({ length: divEachCount }).map((_, itemIdx) => (
                                                                    <div
                                                                        key={itemIdx}
                                                                        className="flex items-center justify-center p-1 sm:p-1.5 rounded-lg bg-slate-800/90 border border-slate-700 shadow-xs hover:border-amber-400 transition-all select-none"
                                                                        title="1"
                                                                    >
                                                                        <span className="text-base sm:text-lg leading-none">
                                                                            {isMoney ? '🪙' : problem.theme.emoji}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* 4. EQUATION BUILDER ROW (Interactive Number Sentence Tiles & Manipulative Action Buttons) */}
                    <div className="w-full shrink-0 bg-slate-950/90 rounded-2xl border-2 border-slate-800 px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 overflow-x-auto">
                        
                        {/* Number Sentence Tiles */}
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 shrink-0">
                            {/* Tile A */}
                            <div
                                onClick={() => { playSound('click'); setActiveSlot('numA'); }}
                                className={`min-w-[48px] sm:min-w-[58px] h-10 sm:h-11 rounded-xl border-2 flex items-center justify-center font-mono font-black text-lg sm:text-xl cursor-pointer transition-all shadow-md select-none
                                    ${activeSlot === 'numA' ? 'border-amber-400 bg-amber-400/20 text-amber-300 ring-2 ring-amber-300/40 scale-105' : 'border-slate-700 bg-slate-900 text-white hover:border-slate-500'}
                                    ${feedback === 'wrong' && inputA !== problem.a.toString() ? 'border-rose-500 bg-rose-500/20 text-rose-300' : ''}
                                    ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : ''}`}
                            >
                                {inputA !== "" ? inputA : <span className="text-slate-600 font-normal">?</span>}
                            </div>

                            {/* Operator Tile */}
                            <div
                                onClick={() => { playSound('click'); setActiveSlot('op'); }}
                                className={`w-9 sm:w-10 h-10 sm:h-11 rounded-xl border-2 flex items-center justify-center font-mono font-black text-lg sm:text-xl cursor-pointer transition-all shadow-md select-none
                                    ${activeSlot === 'op' ? 'border-amber-400 bg-amber-400/20 text-amber-300 ring-2 ring-amber-300/40 scale-105' : 'border-slate-700 bg-slate-900 text-amber-400 hover:border-slate-500'}
                                    ${feedback === 'wrong' && inputOp !== problem.op ? 'border-rose-500 bg-rose-500/20 text-rose-300' : ''}
                                    ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : ''}`}
                            >
                                {inputOp !== "" ? inputOp : <span className="text-slate-600 font-normal">±</span>}
                            </div>

                            {/* Tile B */}
                            <div
                                onClick={() => { playSound('click'); setActiveSlot('numB'); }}
                                className={`min-w-[48px] sm:min-w-[58px] h-10 sm:h-11 rounded-xl border-2 flex items-center justify-center font-mono font-black text-lg sm:text-xl cursor-pointer transition-all shadow-md select-none
                                    ${activeSlot === 'numB' ? 'border-amber-400 bg-amber-400/20 text-amber-300 ring-2 ring-amber-300/40 scale-105' : 'border-slate-700 bg-slate-900 text-white hover:border-slate-500'}
                                    ${feedback === 'wrong' && inputB !== problem.b.toString() ? 'border-rose-500 bg-rose-500/20 text-rose-300' : ''}
                                    ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : ''}`}
                            >
                                {inputB !== "" ? inputB : <span className="text-slate-600 font-normal">?</span>}
                            </div>

                            <span className="text-slate-500 font-black text-xl sm:text-2xl select-none">=</span>

                            {/* Answer Tile */}
                            <div
                                onClick={() => { playSound('click'); setActiveSlot('ans'); }}
                                className={`min-w-[56px] sm:min-w-[68px] h-10 sm:h-11 rounded-xl border-2 flex items-center justify-center font-mono font-black text-xl sm:text-2xl cursor-pointer transition-all shadow-md select-none
                                    ${activeSlot === 'ans' ? 'border-amber-400 bg-amber-400/20 text-amber-300 ring-2 ring-amber-300/40 scale-105' : 'border-slate-700 bg-slate-900 text-sky-400 hover:border-slate-500'}
                                    ${feedback === 'wrong' && inputAns !== problem.ans.toString() ? 'border-rose-500 bg-rose-500/20 text-rose-300' : ''}
                                    ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : ''}`}
                            >
                                {inputAns !== "" ? inputAns : <span className="text-slate-600 font-normal">?</span>}
                            </div>
                        </div>

                        {/* Right: Model Action Controls shifted into Equation Section */}
                        {selectedOp && (
                            <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-800">
                                {/* 1. Addition Controls */}
                                {selectedOp === '+' && (
                                    !additionGrouped ? (
                                        <button
                                            type="button"
                                            onClick={() => { playSound('kaching'); setAdditionGrouped(true); }}
                                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl border-b-2 border-emerald-700 shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                                        >
                                            <span>Group Together</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => { playSound('pop'); setAdditionGrouped(false); }}
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                                        >
                                            <RotateCcw size={12} />
                                            <span>Separate</span>
                                        </button>
                                    )
                                )}

                                {/* 2. Subtraction Controls */}
                                {selectedOp === '-' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleAutoCut}
                                            className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl border-b-2 border-rose-700 shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                                        >
                                            <Scissors size={13} />
                                            <span>Cut Down</span>
                                        </button>
                                        {totalCut > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleResetCuts}
                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 cursor-pointer active:scale-95"
                                                title="Reset cuts"
                                            >
                                                <Undo2 size={13} />
                                            </button>
                                        )}
                                        {subOnes.filter(o => !o.isCrossed).length >= 10 && (
                                            <button
                                                type="button"
                                                onClick={handleRebundleOnes}
                                                className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer active:scale-95"
                                            >
                                                <Package size={13} />
                                                <span>Bundle 10</span>
                                            </button>
                                        )}
                                    </>
                                )}

                                {/* 3. Multiplication Controls */}
                                {selectedOp === '×' && (
                                    !multGrouped ? (
                                        multRepeatedCount < problem.a ? (
                                            <button
                                                type="button"
                                                onClick={() => { playSound('pop'); setMultRepeatedCount(prev => Math.min(problem.a, prev + 1)); }}
                                                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl border-b-2 border-amber-700 shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                                            >
                                                <Sparkles size={13} />
                                                <span>Repeat</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => { playSound('kaching'); setMultGrouped(true); }}
                                                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl border-b-2 border-emerald-700 shadow-md flex items-center gap-1.5 cursor-pointer transition-all animate-bounce"
                                            >
                                                <span>Group Together</span>
                                            </button>
                                        )
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => { playSound('pop'); setMultGrouped(false); }}
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                                        >
                                            <RotateCcw size={12} />
                                            <span>Repeat & Group</span>
                                        </button>
                                    )
                                )}

                                {/* 4. Division Controls */}
                                {selectedOp === '÷' && (() => {
                                    const remaining = problem.a - (divEachCount * problem.b);
                                    const cannotDivideMore = remaining < problem.b;

                                    return (
                                        <div className="flex items-center gap-1.5">
                                            {!cannotDivideMore ? (
                                                <button
                                                    type="button"
                                                    onClick={handleDistributeStep}
                                                    className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl border-b-2 border-sky-700 shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                                                >
                                                    <span>{divEachCount === 0 ? 'Start Distributing Equally' : 'Distribute 1 Each'}</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleResetDiv}
                                                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
                                                >
                                                    <RotateCcw size={13} />
                                                    <span>Distribute Again</span>
                                                </button>
                                            )}

                                            {divEachCount > 0 && !cannotDivideMore && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetDiv}
                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 cursor-pointer active:scale-95 transition-all"
                                                    title="Start over"
                                                >
                                                    <RotateCcw size={13} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 5. BOTTOM TOUCH KEYPAD & ACTION BAR (Zero-Scroll Compact Dock) */}
            <div className="shrink-0 bg-slate-950/95 border-t border-slate-800 p-2 sm:p-2.5 z-30 flex flex-col items-center">
                <div className="w-full max-w-xl flex items-center justify-between gap-1.5 sm:gap-2">
                    
                    {/* Digits and Operators Dock */}
                    <div className="flex-1 grid grid-cols-7 gap-1 sm:gap-1.5">
                        {/* Numbers 1-5 */}
                        {['1', '2', '3', '4', '5'].map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handleKeypadInput(num)}
                                className="h-9 sm:h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-sm sm:text-base border border-slate-700 flex items-center justify-center cursor-pointer transition-all"
                            >
                                {num}
                            </button>
                        ))}

                        {/* Operation + & - */}
                        <button
                            type="button"
                            onClick={() => handleKeypadInput('+')}
                            className="h-9 sm:h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-base border border-emerald-500 flex items-center justify-center cursor-pointer transition-all"
                            title="Add"
                        >
                            +
                        </button>
                        <button
                            type="button"
                            onClick={() => handleKeypadInput('-')}
                            className="h-9 sm:h-10 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-base border border-rose-500 flex items-center justify-center cursor-pointer transition-all"
                            title="Subtract"
                        >
                            −
                        </button>

                        {/* Numbers 6-0 */}
                        {['6', '7', '8', '9', '0'].map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handleKeypadInput(num)}
                                className="h-9 sm:h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-sm sm:text-base border border-slate-700 flex items-center justify-center cursor-pointer transition-all"
                            >
                                {num}
                            </button>
                        ))}

                        {/* Operation × & ÷ */}
                        <button
                            type="button"
                            onClick={() => handleKeypadInput('×')}
                            className="h-9 sm:h-10 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-base border border-amber-500 flex items-center justify-center cursor-pointer transition-all"
                            title="Multiply"
                        >
                            ×
                        </button>
                        <button
                            type="button"
                            onClick={() => handleKeypadInput('÷')}
                            className="h-9 sm:h-10 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-black text-base border border-sky-500 flex items-center justify-center cursor-pointer transition-all"
                            title="Divide"
                        >
                            ÷
                        </button>
                    </div>

                    {/* Backspace & Check/Next Controls */}
                    <div className="flex flex-col gap-1 sm:gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleKeypadInput('backspace')}
                            className="h-9 sm:h-10 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-300 font-bold text-xs border border-slate-700 flex items-center justify-center cursor-pointer transition-all"
                            title="Clear / Backspace"
                        >
                            ⌫
                        </button>

                        {feedback === 'correct' ? (
                            <button
                                type="button"
                                onClick={handleNextQuestion}
                                className="h-9 sm:h-10 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer animate-pulse whitespace-nowrap"
                            >
                                <span>{questionIndex + 1 < TOTAL_QUESTIONS ? 'Next' : 'Finish'}</span>
                                <ArrowRight size={14} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleCheckAnswer}
                                className="h-9 sm:h-10 px-4 rounded-lg bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                                <span>Check</span>
                                <Check size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}