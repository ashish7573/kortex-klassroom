"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Settings2, Volume2, RotateCcw, CheckCircle2, ArrowRight, 
    Award, Sparkles, Scissors, Calculator, Layers, Check
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

const TOTAL_QUESTIONS = 5;

interface Props {
    subtopicId?: string;
    lesson?: unknown;
    onComplete?: (result: { score: number; maxScore: number }) => void;
}

export default function BasicOperationWordProblems({ onComplete }: Props) {
    // Config State
    const [phase, setPhase] = useState<'config' | 'playing' | 'completed'>('config');
    const [configOp, setConfigOp] = useState<Operation | 'mixed'>('+');
    const [configRange, setConfigRange] = useState<RangeSelect>(10);

    // Quiz Session State
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [problem, setProblem] = useState<ProblemData | null>(null);

    // Interactive Visual Model State
    const [crossedItems, setCrossedItems] = useState<Set<number>>(new Set());

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
                osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
                osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6
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
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
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
        // 1. Determine Operation
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
                a = Math.floor(Math.random() * (ans - 1)) + 1; // 1..ans-1
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
                // Products <= 10: 2x2, 2x3, 2x4, 2x5, 3x2, 3x3
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
                // Up to 100: tables up to 10
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

    // Start New Session
    const handleStartPractice = () => {
        playSound('whoosh');
        setQuestionIndex(0);
        setScore(0);
        const firstProb = generateNewProblem();
        setProblem(firstProb);
        resetQuestionState();
        setPhase('playing');
        speak(firstProb.fullText);
    };

    // Reset State for Next Question
    const resetQuestionState = () => {
        setCrossedItems(new Set());

        // Clear equation input slots
        setInputA("");
        setInputOp("");
        setInputB("");
        setInputAns("");
        setActiveSlot('numA');
        setFeedback('idle');
    };

    // Load Next Question
    const handleNextQuestion = () => {
        playSound('whoosh');
        if (questionIndex + 1 < TOTAL_QUESTIONS) {
            const nextIdx = questionIndex + 1;
            setQuestionIndex(nextIdx);
            const nextProb = generateNewProblem();
            setProblem(nextProb);
            resetQuestionState();
            speak(nextProb.fullText);
        } else {
            playSound('success');
            setPhase('completed');
            onComplete?.({ score: score, maxScore: TOTAL_QUESTIONS });
        }
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
                // If reaches problem's length, advance to op
                if (nextVal.length >= problem.a.toString().length) {
                    setActiveSlot('op');
                }
            } else if (activeSlot === 'op') {
                // If user enters number while on op slot, auto advance to numB
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

    // Toggle cut / cross on subtraction items
    const handleToggleCross = (index: number) => {
        playSound('snip');
        setCrossedItems(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    // Check Answer
    const handleCheckAnswer = () => {
        if (!problem || feedback === 'correct') return;

        const valA = parseInt(inputA);
        const valB = parseInt(inputB);
        const valAns = parseInt(inputAns);

        // Verification logic
        const isOpCorrect = inputOp === problem.op;
        const isAnsCorrect = valAns === problem.ans;
        
        let isNumbersCorrect = false;
        if (problem.op === '+' || problem.op === '×') {
            // Commutative: A + B or B + A
            isNumbersCorrect = (valA === problem.a && valB === problem.b) || (valA === problem.b && valB === problem.a);
        } else {
            // Non-commutative: A - B or A ÷ B
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
                            Read real-world stories, explore visual models & build equations
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
    // RENDER: PHASE 3 - VICTORY / COMPLETION SCREEN
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
                        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">You solved math stories with visual models!</p>
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

            {/* 2. STORY BANNER CARD (Compact, High-Contrast Story Reader) */}
            <div className="shrink-0 bg-slate-950/80 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 z-20">
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

                <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium shrink-0 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                    <Layers size={13} className="text-sky-400" />
                    <span>CPA Model & Equation</span>
                </div>
            </div>

            {/* 3. MAIN WORKSPACE: VISUAL CONCRETE-PICTORIAL MODEL (Flex-1, Zero-Scroll) */}
            <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center p-2 sm:p-3 overflow-hidden">
                <div className="w-full max-w-4xl h-full flex flex-col justify-center items-center gap-2">
                    
                    {/* Visual Model Container */}
                    <div className="w-full flex-1 min-h-0 bg-slate-950/60 rounded-2xl border-2 border-slate-800 p-2 sm:p-3 flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                        
                        {/* A) ADDITION MODEL (Group A + Group B = Total) */}
                        {problem.op === '+' && (
                            <div className="w-full h-full flex items-center justify-center gap-2 sm:gap-4 overflow-y-auto hide-scrollbar">
                                {/* Group A */}
                                <div className="flex-1 max-w-[220px] bg-slate-900/90 rounded-xl border-2 border-emerald-500/40 p-2 flex flex-col items-center justify-between shadow-md">
                                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                                        Group 1 ({problem.a})
                                    </span>
                                    <div className="flex flex-wrap items-center justify-center gap-1 p-1 max-h-32 overflow-y-auto hide-scrollbar">
                                        {Array.from({ length: Math.min(problem.a, 30) }).map((_, i) => (
                                            <span key={i} className="text-xl sm:text-2xl hover:scale-110 transition-transform">
                                                {problem.theme.emoji}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-xs font-black text-white bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                                        {problem.a} {problem.units}
                                    </span>
                                </div>

                                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-amber-400 text-lg shrink-0 shadow-sm">
                                    +
                                </div>

                                {/* Group B */}
                                <div className="flex-1 max-w-[220px] bg-slate-900/90 rounded-xl border-2 border-sky-500/40 p-2 flex flex-col items-center justify-between shadow-md">
                                    <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">
                                        Group 2 ({problem.b})
                                    </span>
                                    <div className="flex flex-wrap items-center justify-center gap-1 p-1 max-h-32 overflow-y-auto hide-scrollbar">
                                        {Array.from({ length: Math.min(problem.b, 30) }).map((_, i) => (
                                            <span key={i} className="text-xl sm:text-2xl hover:scale-110 transition-transform">
                                                {problem.theme.emoji}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-xs font-black text-white bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/40">
                                        {problem.b} {problem.units}
                                    </span>
                                </div>

                                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-slate-400 text-lg shrink-0 shadow-sm hidden sm:flex">
                                    =
                                </div>

                                {/* Total Combined Preview */}
                                <div className="flex-1 max-w-[220px] bg-slate-900/90 rounded-xl border-2 border-amber-500/40 p-2 flex-col items-center justify-between shadow-md hidden sm:flex">
                                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                                        Total Combined
                                    </span>
                                    <div className="flex flex-wrap items-center justify-center gap-1 p-1 max-h-32 overflow-y-auto hide-scrollbar">
                                        {Array.from({ length: Math.min(problem.ans, 30) }).map((_, i) => (
                                            <span key={i} className="text-xl sm:text-2xl opacity-80">
                                                {problem.theme.emoji}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                                        ? {problem.units}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* B) SUBTRACTION MODEL (Start with A, Tap to Snip/Cross Out B) */}
                        {problem.op === '-' && (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                    <span className="flex items-center gap-1 text-rose-400">
                                        <Scissors size={14} /> Tap items to take away / cross out:
                                    </span>
                                    <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-full font-black text-[11px]">
                                        Crossed: {crossedItems.size} / {problem.b}
                                    </span>
                                </div>

                                <div className="w-full flex-1 max-w-xl bg-slate-900/90 rounded-xl border-2 border-slate-700 p-2 flex flex-wrap items-center justify-center gap-1.5 overflow-y-auto hide-scrollbar shadow-inner">
                                    {Array.from({ length: Math.min(problem.a, 40) }).map((_, idx) => {
                                        const isCrossed = crossedItems.has(idx);
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => handleToggleCross(idx)}
                                                className={`relative p-1 rounded-lg cursor-pointer transition-all active:scale-90 flex items-center justify-center select-none
                                                    ${isCrossed ? 'bg-rose-950/60 border border-rose-500/60 opacity-60' : 'bg-slate-800 border border-slate-700 hover:border-amber-400'}`}
                                                title={isCrossed ? "Crossed out item" : "Tap to cross out"}
                                            >
                                                <span className={`text-2xl sm:text-3xl transition-transform ${isCrossed ? 'grayscale' : ''}`}>
                                                    {problem.theme.emoji}
                                                </span>
                                                {isCrossed && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="w-full h-0.5 bg-rose-500 -rotate-45 shadow-sm"></div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="text-[11px] text-slate-400 font-medium">
                                    Remaining uncrossed items = <span className="text-emerald-400 font-black">{problem.a - crossedItems.size}</span>
                                </div>
                            </div>
                        )}

                        {/* C) MULTIPLICATION MODEL (A groups/baskets of B items each) */}
                        {problem.op === '×' && (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-1">
                                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-amber-400" />
                                    <span>{problem.a} equal groups with {problem.b} {problem.units} each</span>
                                </div>

                                <div className="w-full flex-1 max-w-2xl flex flex-wrap items-center justify-center gap-2 overflow-y-auto hide-scrollbar p-1">
                                    {Array.from({ length: problem.a }).map((_, groupIdx) => (
                                        <div
                                            key={groupIdx}
                                            className="bg-slate-900/90 rounded-xl border-2 border-amber-400/50 p-2 flex flex-col items-center shadow-md min-w-[90px] sm:min-w-[110px]"
                                        >
                                            <span className="text-[10px] font-black text-amber-300 uppercase mb-1">
                                                Box {groupIdx + 1}
                                            </span>
                                            <div className="flex flex-wrap items-center justify-center gap-1 p-1 max-h-24">
                                                {Array.from({ length: problem.b }).map((_, itemIdx) => (
                                                    <span key={itemIdx} className="text-xl sm:text-2xl hover:scale-110 transition-transform">
                                                        {problem.theme.emoji}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full mt-1">
                                                {problem.b} items
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* D) DIVISION MODEL (A items shared equally into B plates/groups) */}
                        {problem.op === '÷' && (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-1">
                                <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-sky-400" />
                                    <span>Sharing {problem.a} items equally among {problem.b} friends</span>
                                </div>

                                <div className="w-full flex-1 max-w-2xl flex flex-wrap items-center justify-center gap-2 overflow-y-auto hide-scrollbar p-1">
                                    {Array.from({ length: problem.b }).map((_, trayIdx) => (
                                        <div
                                            key={trayIdx}
                                            className="bg-slate-900/90 rounded-xl border-2 border-sky-400/50 p-2 flex flex-col items-center shadow-md min-w-[90px] sm:min-w-[110px]"
                                        >
                                            <span className="text-[10px] font-black text-sky-300 uppercase mb-1">
                                                Friend {trayIdx + 1}
                                            </span>
                                            <div className="flex flex-wrap items-center justify-center gap-1 p-1 max-h-24">
                                                {Array.from({ length: problem.ans }).map((_, itemIdx) => (
                                                    <span key={itemIdx} className="text-xl sm:text-2xl hover:scale-110 transition-transform">
                                                        {problem.theme.emoji}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full mt-1 border border-emerald-500/40">
                                                {problem.ans} each
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. EQUATION BUILDER ROW (Interactive Number Sentence Tiles) */}
                    <div className="w-full shrink-0 bg-slate-950/80 rounded-2xl border-2 border-slate-800 p-2 sm:p-2.5 flex items-center justify-center gap-1.5 sm:gap-3">
                        
                        {/* Tile A */}
                        <div
                            onClick={() => { playSound('click'); setActiveSlot('numA'); }}
                            className={`min-w-[56px] sm:min-w-[70px] h-12 sm:h-14 rounded-xl border-3 flex items-center justify-center font-mono font-black text-xl sm:text-2xl cursor-pointer transition-all shadow-md select-none
                                ${activeSlot === 'numA' ? 'border-amber-400 bg-amber-400/20 text-amber-300 ring-2 ring-amber-300/40 scale-105' : 'border-slate-700 bg-slate-900 text-white hover:border-slate-500'}
                                ${feedback === 'wrong' && inputA !== problem.a.toString() ? 'border-rose-500 bg-rose-500/20 text-rose-300' : ''}
                                ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : ''}`}
                        >
                            {inputA !== "" ? inputA : <span className="text-slate-600 font-normal">?</span>}
                        </div>

                        {/* Operator Tile */}
                        <div
                            onClick={() => { playSound('click'); setActiveSlot('op'); }}
                            className={`w-11 sm:w-13 h-12 sm:h-14 rounded-xl border-3 flex items-center justify-center font-mono font-black text-xl sm:text-2xl cursor-pointer transition-all shadow-md select-none
                                ${activeSlot === 'op' ? 'border-amber-400 bg-amber-400/20 text-amber-300 ring-2 ring-amber-300/40 scale-105' : 'border-slate-700 bg-slate-900 text-amber-400 hover:border-slate-500'}
                                ${feedback === 'wrong' && inputOp !== problem.op ? 'border-rose-500 bg-rose-500/20 text-rose-300' : ''}
                                ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : ''}`}
                        >
                            {inputOp !== "" ? inputOp : <span className="text-slate-600 font-normal">±</span>}
                        </div>

                        {/* Tile B */}
                        <div
                            onClick={() => { playSound('click'); setActiveSlot('numB'); }}
                            className={`min-w-[56px] sm:min-w-[70px] h-12 sm:h-14 rounded-xl border-3 flex items-center justify-center font-mono font-black text-xl sm:text-2xl cursor-pointer transition-all shadow-md select-none
                                ${activeSlot === 'numB' ? 'border-amber-400 bg-amber-400/20 text-amber-300 ring-2 ring-amber-300/40 scale-105' : 'border-slate-700 bg-slate-900 text-white hover:border-slate-500'}
                                ${feedback === 'wrong' && inputB !== problem.b.toString() ? 'border-rose-500 bg-rose-500/20 text-rose-300' : ''}
                                ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : ''}`}
                        >
                            {inputB !== "" ? inputB : <span className="text-slate-600 font-normal">?</span>}
                        </div>

                        <span className="text-slate-500 font-black text-2xl sm:text-3xl select-none">=</span>

                        {/* Answer Tile */}
                        <div
                            onClick={() => { playSound('click'); setActiveSlot('ans'); }}
                            className={`min-w-[64px] sm:min-w-[80px] h-12 sm:h-14 rounded-xl border-3 flex items-center justify-center font-mono font-black text-2xl sm:text-3xl cursor-pointer transition-all shadow-md select-none
                                ${activeSlot === 'ans' ? 'border-amber-400 bg-amber-400/20 text-amber-300 ring-2 ring-amber-300/40 scale-105' : 'border-slate-700 bg-slate-900 text-sky-400 hover:border-slate-500'}
                                ${feedback === 'wrong' && inputAns !== problem.ans.toString() ? 'border-rose-500 bg-rose-500/20 text-rose-300' : ''}
                                ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : ''}`}
                        >
                            {inputAns !== "" ? inputAns : <span className="text-slate-600 font-normal">?</span>}
                        </div>
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