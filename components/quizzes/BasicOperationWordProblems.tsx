"use client";

import React, { useState, useEffect } from 'react';
import { Shuffle, CheckCircle, Volume2, XCircle, MousePointer2 } from 'lucide-react';

const OBJECTS = [
    { id: 'apple', name: 'apples', singular: 'apple', emoji: '🍎' },
    { id: 'car', name: 'cars', singular: 'car', emoji: '🚗' },
    { id: 'pencil', name: 'pencils', singular: 'pencil', emoji: '✏️' },
    { id: 'scissors', name: 'scissors', singular: 'scissor', emoji: '✂️' },
    { id: 'notebook', name: 'notebooks', singular: 'notebook', emoji: '📓' },
    { id: 'toy', name: 'toys', singular: 'toy', emoji: '🧸' },
    { id: 'balloon', name: 'balloons', singular: 'balloon', emoji: '🎈' },
    { id: 'candy', name: 'candies', singular: 'candy', emoji: '🍬' },
    { id: 'butterfly', name: 'butterflies', singular: 'butterfly', emoji: '🦋' },
    { id: 'ball', name: 'balls', singular: 'ball', emoji: '⚽' }
];

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const OPERATORS = [
    { symbol: '+', enabled: true },
    { symbol: '-', enabled: false },
    { symbol: '×', enabled: false },
    { symbol: '÷', enabled: false },
    { symbol: '=', enabled: true }
];

// Word Problem Narrative Engine
const NAMES = ["Rahul", "Priya", "Amit", "Sara", "Kabir", "Aisha", "Rohan", "Meera"];
const TEMPLATES = [
    (name: string, a: number, b: number, sing: string, plur: string) => `${name} has ${a} ${a === 1 ? sing : plur}. Their friend gives them ${b} more. How many ${plur} do they have now?`,
    (name: string, a: number, b: number, sing: string, plur: string) => `${name} found ${a} ${a === 1 ? sing : plur} in the park. Later, they found ${b} more. What is the total number of ${plur}?`,
    (name: string, a: number, b: number, sing: string, plur: string) => `${name} bought ${a} ${a === 1 ? sing : plur} from the shop. Then, their mother bought ${b} more. How many ${plur} are there in total?`,
    (name: string, a: number, b: number, sing: string, plur: string) => `There are ${a} ${a === 1 ? sing : plur} on the table. ${name} puts ${b} more on the table. How many ${plur} are there altogether?`
];

type ActiveTool = { type: 'digit' | 'operator' | 'object', value: string | number } | null;

export default function BasicOperationWordProblems({ lesson, onComplete }: any) {
    // Problem State
    const [problemText, setProblemText] = useState<string>("");
    const [baseNumber, setBaseNumber] = useState<number | null>(null); 
    const [hopNumber, setHopNumber] = useState<number | null>(null);
    const [targetObject, setTargetObject] = useState<typeof OBJECTS[0] | null>(null);
    const [phase, setPhase] = useState<'start' | 'playing' | 'done'>('start');

    const targetTotal = (baseNumber || 0) + (hopNumber || 0);

    // Sandbox Equation State
    const [numA, setNumA] = useState<number | null>(null);
    const [numB, setNumB] = useState<number | null>(null);
    const [totalNum, setTotalNum] = useState<number | null>(null);
    
    const [op1, setOp1] = useState<string | null>(null);
    const [op2, setOp2] = useState<string | null>(null);
    
    const [objA, setObjA] = useState<{ type: string | null, count: number }>({ type: null, count: 0 });
    const [objB, setObjB] = useState<{ type: string | null, count: number }>({ type: null, count: 0 });
    const [totalObj, setTotalObj] = useState<{ type: string | null, count: number }>({ type: null, count: 0 });

    // Interaction State
    const [activeTool, setActiveTool] = useState<ActiveTool>(null);

    // --- AUDIO ENGINE ---
    const playSound = (type: 'boing' | 'error' | 'success' | 'pop' | 'click') => {
        if (typeof window === 'undefined') return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (type === 'boing') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'click') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.05);
            } else if (type === 'pop') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
                osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) {
            console.log("Audio failed to play", e);
        }
    };

    const speak = (text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const msg = new SpeechSynthesisUtterance(text);
            msg.rate = 0.85; 
            msg.pitch = 1.2; 
            window.speechSynthesis.speak(msg);
        }
    };

    // --- LOGIC: PROBLEM GENERATION ---
    const generateProblem = () => {
        const randomTotal = Math.floor(Math.random() * 9) + 2; 
        const randomA = Math.floor(Math.random() * (randomTotal - 1)) + 1;
        const randomB = randomTotal - randomA; 
        const randomObj = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
        
        const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
        const randomTemplate = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
        const generatedText = randomTemplate(randomName, randomA, randomB, randomObj.singular, randomObj.name);

        setBaseNumber(randomA);
        setHopNumber(randomB);
        setTargetObject(randomObj);
        setProblemText(generatedText);
        
        // Reset Board
        setNumA(null); setNumB(null); setTotalNum(null);
        setOp1(null); setOp2(null);
        setObjA({ type: null, count: 0 });
        setObjB({ type: null, count: 0 });
        setTotalObj({ type: null, count: 0 });
        setActiveTool(null);
        setPhase('playing');
        
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        playSound('pop');
    };

    const speakProblem = () => {
        if (!problemText) return;
        speak(problemText);
    };

    // --- LOGIC: TAP TO PLACE INTERACTION ---
    const selectTool = (type: 'digit' | 'operator' | 'object', value: string | number) => {
        if (phase !== 'playing') return;
        setActiveTool({ type, value });
        playSound('click');
    };

    const handleSlotTap = (slotId: string) => {
        if (phase !== 'playing' || !activeTool) return;

        if (activeTool.type === 'digit') {
            if (slotId === 'numA') setNumA(activeTool.value as number);
            else if (slotId === 'numB') setNumB(activeTool.value as number);
            else if (slotId === 'totalNum') setTotalNum(activeTool.value as number);
            else { playSound('error'); return; }
            playSound('boing');
        } 
        else if (activeTool.type === 'operator') {
            if (slotId === 'op1') setOp1(activeTool.value as string);
            else if (slotId === 'op2') setOp2(activeTool.value as string);
            else { playSound('error'); return; }
            playSound('boing');
        } 
        else if (activeTool.type === 'object') {
            const objSymbol = activeTool.value as string;
            
            const handleObjAccumulate = (current: { type: string | null, count: number }, setter: Function) => {
                if (current.type !== objSymbol) {
                    setter({ type: objSymbol, count: 1 }); 
                } else if (current.count < 10) {
                    setter({ type: objSymbol, count: current.count + 1 }); 
                }
                playSound('pop');
            };

            if (slotId === 'objA') handleObjAccumulate(objA, setObjA);
            else if (slotId === 'objB') handleObjAccumulate(objB, setObjB);
            else if (slotId === 'totalObj') handleObjAccumulate(totalObj, setTotalObj);
            else { playSound('error'); return; }
        }

        setActiveTool(null);
    };

    const clearObjectSlot = (e: React.MouseEvent, setter: Function) => {
        e.stopPropagation(); 
        setter({ type: null, count: 0 });
        playSound('click');
    };

    // --- VALIDATION ENGINES ---
    const isNumACorrect = numA === baseNumber;
    const isNumBCorrect = numB === hopNumber;
    const isTotalNumCorrect = totalNum === targetTotal;
    
    const isOp1Correct = op1 === '+';
    const isOp2Correct = op2 === '=';
    
    const isObjACorrect = objA.type === targetObject?.emoji && objA.count === baseNumber;
    const isObjBCorrect = objB.type === targetObject?.emoji && objB.count === hopNumber;
    const isTotalObjCorrect = totalObj.type === targetObject?.emoji && totalObj.count === targetTotal;

    const handleCheck = () => {
        if (phase === 'start') return;
        if (phase === 'done') {
            onComplete && onComplete();
            return;
        }

        const isFullyCorrect = 
            isNumACorrect && isNumBCorrect && isTotalNumCorrect &&
            isOp1Correct && isOp2Correct &&
            isObjACorrect && isObjBCorrect && isTotalObjCorrect;

        if (isFullyCorrect) {
            playSound('success');
            speak(`Excellent! ${baseNumber} plus ${hopNumber} equals ${targetTotal}.`);
            setPhase('done');
            setActiveTool(null);
        } else {
            playSound('error');
            speak("Some parts are missing or incorrect. Look for the green checkmarks to see what is right!");
        }
    };

    // --- RENDER HELPERS ---
    const renderSlot = (id: string, label: string, content: React.ReactNode, isCorrect: boolean, isObj = false, clearFn?: Function, extraClasses: string = "") => {
        const hasContent = isObj ? (content as any)?.props?.children?.length > 0 : content !== null;

        return (
            <div 
                onClick={() => handleSlotTap(id)}
                className={`relative flex flex-col items-center justify-center p-1 border-4 transition-all cursor-pointer overflow-visible
                    ${isCorrect ? 'bg-lime-50 border-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.3)]' : hasContent ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'} ${extraClasses}`}
            >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 rounded-full border-2 border-slate-200 text-[10px] md:text-xs font-bold text-slate-500 whitespace-nowrap z-10">
                    {label}
                </div>
                
                <div className="text-3xl md:text-4xl font-black text-slate-700 flex flex-wrap justify-center items-center text-center leading-none mt-1">
                    {content}
                </div>

                {isObj && clearFn && (content as any)?.props?.children?.length > 0 && !isCorrect && phase !== 'done' && (
                    <button 
                        onClick={(e) => clearFn(e)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-400 hover:scale-110 active:scale-95 z-20"
                    >
                        <XCircle size={14} />
                    </button>
                )}

                {isCorrect && (
                    <div className="absolute -bottom-3 right-[-8px] animate-bounce z-20">
                        <CheckCircle size={24} className="text-lime-500 fill-white drop-shadow-md" />
                    </div>
                )}
            </div>
        );
    };

    const renderObjectEmojis = (objState: {type: string | null, count: number}) => {
        if (!objState.type || objState.count === 0) return null;
        return (
            <div className="grid grid-cols-5 gap-y-1 gap-x-0 w-full justify-items-center mt-1">
                {Array.from({ length: objState.count }).map((_, i) => (
                    <span key={i} className="text-lg md:text-2xl animate-fade-in leading-none">{objState.type}</span>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col items-center p-2 bg-sky-50 font-sans select-none overflow-x-hidden overflow-y-auto relative">
            
            {/* 1. TOP: WORD PROBLEM BANNER (Compact) */}
            <div className="w-full max-w-5xl shrink-0 z-20 mb-2 mt-2">
                <div className={`w-full p-3 md:p-4 rounded-[1.5rem] flex flex-col md:flex-row items-center gap-3 transition-all duration-500 border-2 md:border-b-4 ${phase === 'done' ? 'bg-lime-100 border-lime-400' : 'bg-white border-slate-200 shadow-sm'}`}>
                    
                    <button 
                        onClick={speakProblem}
                        disabled={phase === 'start'}
                        className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${phase === 'start' ? 'bg-slate-200 text-slate-400' : 'bg-sky-500 text-white hover:bg-sky-400 hover:scale-105 active:scale-95 shadow-[0_3px_0_rgb(2,132,199)]'}`}
                    >
                        <Volume2 size={24} />
                    </button>
                    
                    <div className="flex-1 text-center md:text-left">
                        {phase === 'start' ? (
                            <h2 className="text-lg md:text-2xl font-black text-slate-400 italic">Press "New Problem" to begin!</h2>
                        ) : (
                            <h2 className="text-lg md:text-2xl font-black text-slate-700 leading-tight" dangerouslySetInnerHTML={{
                                __html: problemText.replace(/\b\d+\b/g, match => `<span class="text-rose-500">${match}</span>`)
                            }} />
                        )}
                    </div>
                </div>
            </div>

            {/* 2. MIDDLE: THE EQUATION SANDBOX (Maximized Space) */}
            <div className="w-full max-w-6xl flex-1 flex flex-col items-center justify-start bg-white/60 rounded-[1.5rem] shadow-inner border-4 border-slate-200 mb-2 py-4 pt-6 md:pt-8 px-2 overflow-x-auto overflow-y-visible min-h-[250px]">
                
                {/* Active Tool HUD (Ultra-Compact) */}
                <div className="flex items-center justify-center px-4 bg-indigo-100 border border-indigo-200 rounded-full mb-4 shadow-sm h-8 md:h-10">
                    <span className="font-bold text-xs md:text-sm text-indigo-800 mr-2 flex items-center gap-1">
                        <MousePointer2 size={14} /> Active Tool:
                    </span>
                    {activeTool ? (
                        <div className="text-lg md:text-xl animate-bounce font-black text-slate-800 leading-none">
                            {activeTool.value}
                        </div>
                    ) : (
                        <span className="text-indigo-400 font-bold italic text-xs md:text-sm">Select an item below</span>
                    )}
                </div>

                {/* The Stacked Sandbox Slots (Scaled Down slightly to fit) */}
                <div className="flex items-start justify-center gap-2 md:gap-4 pb-2">
                    
                    {/* Column 1 */}
                    <div className="flex flex-col gap-3 items-center mt-2">
                        {renderSlot('numA', 'Num', numA, isNumACorrect, false, undefined, 'w-16 h-16 md:w-20 md:h-20 rounded-[1rem]')}
                        {renderSlot('objA', 'Items', renderObjectEmojis(objA), isObjACorrect, true, (e: any) => clearObjectSlot(e, setObjA), 'w-24 md:w-32 min-h-[90px] md:min-h-[110px] rounded-[1rem]')}
                    </div>

                    {/* Operator 1 */}
                    <div className="mt-4 md:mt-6">
                        {renderSlot('op1', 'Math', op1, isOp1Correct, false, undefined, 'w-12 h-12 md:w-16 md:h-16 rounded-full')}
                    </div>

                    {/* Column 2 */}
                    <div className="flex flex-col gap-3 items-center mt-2">
                        {renderSlot('numB', 'Num', numB, isNumBCorrect, false, undefined, 'w-16 h-16 md:w-20 md:h-20 rounded-[1rem]')}
                        {renderSlot('objB', 'Items', renderObjectEmojis(objB), isObjBCorrect, true, (e: any) => clearObjectSlot(e, setObjB), 'w-24 md:w-32 min-h-[90px] md:min-h-[110px] rounded-[1rem]')}
                    </div>

                    {/* Operator 2 */}
                    <div className="mt-4 md:mt-6">
                        {renderSlot('op2', 'Math', op2, isOp2Correct, false, undefined, 'w-12 h-12 md:w-16 md:h-16 rounded-full')}
                    </div>

                    {/* Column 3 */}
                    <div className="flex flex-col gap-3 items-center mt-2">
                        {renderSlot('totalNum', 'Total Num', totalNum, isTotalNumCorrect, false, undefined, 'w-16 h-16 md:w-20 md:h-20 rounded-[1rem]')}
                        {renderSlot('totalObj', 'Total Items', renderObjectEmojis(totalObj), isTotalObjCorrect, true, (e: any) => clearObjectSlot(e, setTotalObj), 'w-24 md:w-32 min-h-[90px] md:min-h-[110px] rounded-[1rem]')}
                    </div>

                </div>
            </div>

            {/* 3. BOTTOM: PALETTES & CONTROLS (Compact) */}
            <div className="w-full max-w-6xl shrink-0 flex flex-col gap-2">
                
                {/* Tools Grid Container (Forced into 2 Rows primarily) */}
                <div className="w-full bg-white rounded-2xl p-2 md:p-4 shadow-sm border-2 border-slate-200 flex flex-col gap-2">
                    
                    {/* Row 1: Digits + Operators */}
                    <div className="flex justify-center flex-wrap gap-1 md:gap-2 items-center">
                        {DIGITS.map(digit => (
                            <button 
                                key={`digit-${digit}`} 
                                onClick={() => selectTool('digit', digit)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg md:rounded-xl font-black text-lg md:text-xl border-b-[3px] transition-all ${activeTool?.type === 'digit' && activeTool.value === digit ? 'bg-amber-400 border-amber-600 text-amber-950 scale-110 shadow-md' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:-translate-y-1'}`}
                            >
                                {digit}
                            </button>
                        ))}
                        
                        {/* Divider */}
                        <div className="w-[2px] h-6 bg-slate-200 hidden md:block mx-1 rounded-full"></div>
                        
                        {OPERATORS.map(op => (
                            <button 
                                key={`op-${op.symbol}`} 
                                onClick={() => op.enabled && selectTool('operator', op.symbol)}
                                disabled={!op.enabled}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg md:rounded-xl font-black text-lg md:text-xl border-b-[3px] transition-all ${!op.enabled ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' : activeTool?.type === 'operator' && activeTool.value === op.symbol ? 'bg-sky-400 border-sky-600 text-sky-950 scale-110 shadow-md' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:-translate-y-1'}`}
                            >
                                {op.symbol}
                            </button>
                        ))}
                    </div>

                    {/* Row 2: Objects */}
                    <div className="flex justify-center flex-wrap gap-1 md:gap-2">
                        {OBJECTS.map(obj => (
                            <button 
                                key={`obj-${obj.id}`} 
                                onClick={() => selectTool('object', obj.emoji)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg md:rounded-xl font-black text-lg md:text-xl border-b-[3px] transition-all flex items-center justify-center ${activeTool?.type === 'object' && activeTool.value === obj.emoji ? 'bg-rose-400 border-rose-600 scale-110 shadow-md' : 'bg-slate-100 border-slate-300 hover:bg-slate-200 hover:-translate-y-1'}`}
                            >
                                {obj.emoji}
                            </button>
                        ))}
                    </div>

                </div>

                {/* Final Action Buttons (Slimmed Down) */}
                <div className="flex justify-between items-center gap-2">
                    <button 
                        onClick={generateProblem}
                        className="bg-purple-500 hover:bg-purple-400 text-white font-black text-sm md:text-lg px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl flex items-center justify-center gap-1 shadow-[0_4px_0_rgb(147,51,234)] active:translate-y-1 active:shadow-none transition-all whitespace-nowrap"
                    >
                        <Shuffle size={18} /> New <span className="hidden sm:inline">Problem</span>
                    </button>

                    <button 
                        onClick={handleCheck}
                        disabled={phase === 'start'}
                        className={`px-8 md:px-12 py-2 md:py-3 rounded-[1.5rem] border-4 flex items-center justify-center font-black text-xl md:text-2xl tracking-wider transition-all ${phase === 'start' ? 'bg-slate-200 border-slate-300 text-slate-400 shadow-none cursor-not-allowed' : phase === 'done' ? 'bg-sky-500 border-sky-400 text-white shadow-[0_4px_0_rgb(2,132,199)] active:translate-y-1 active:shadow-none hover:scale-105' : 'bg-lime-400 border-lime-300 text-lime-950 shadow-[0_4px_0_rgb(101,163,13)] active:translate-y-1 active:shadow-none hover:scale-105 cursor-pointer'}`}
                    >
                        {phase === 'done' ? 'Next Activity' : 'CHECK'}
                    </button>
                </div>

            </div>
            
        </div>
    );
}