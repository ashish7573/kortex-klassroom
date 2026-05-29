"use client";

import React, { useState } from 'react';
import { Shuffle, Volume2, XCircle, MousePointer2, Scissors, Calculator, Settings } from 'lucide-react';

// --- DATA ---
const OBJECTS = [
    { id: 'apple', name: 'apples', singular: 'apple', emoji: '🍎' },
    { id: 'car', name: 'cars', singular: 'car', emoji: '🚗' },
    { id: 'pencil', name: 'pencils', singular: 'pencil', emoji: '✏️' },
    { id: 'notebook', name: 'notebooks', singular: 'notebook', emoji: '📓' },
    { id: 'toy', name: 'toys', singular: 'toy', emoji: '🧸' },
    { id: 'balloon', name: 'balloons', singular: 'balloon', emoji: '🎈' },
    { id: 'candy', name: 'candies', singular: 'candy', emoji: '🍬' },
    { id: 'butterfly', name: 'butterflies', singular: 'butterfly', emoji: '🦋' },
    { id: 'ball', name: 'balls', singular: 'ball', emoji: '⚽' }
];

const MONEY_OBJECTS = [
    { id: 'coin1', val: 1, symbol: '🪙' },
    { id: 'note10', val: 10, symbol: '💵' },
    { id: 'note100', val: 100, symbol: '💴' }
];

const NAMES = ["Rahul", "Priya", "Amit", "Sara", "Kabir", "Aisha", "Rohan", "Meera"];

const TEMPLATES = {
    '+': [
        (n: string, a: number, b: number, s: string, p: string) => `${n} has ${a} ${a === 1 ? s : p}. Their friend gives them ${b} more. How many ${p} do they have now?`,
        (n: string, a: number, b: number, s: string, p: string) => `${n} found ${a} ${a === 1 ? s : p} in the park. Later, they found ${b} more. What is the total number of ${p}?`
    ],
    '-': [
        (n: string, a: number, b: number, s: string, p: string) => `${n} had ${a} ${a === 1 ? s : p}. They gave ${b} ${p} to a friend. How many ${p} are left?`,
        (n: string, a: number, b: number, s: string, p: string) => `There were ${a} ${a === 1 ? s : p}. ${n} lost ${b} of them. How many ${p} remain?`
    ],
    '×': [
        (n: string, a: number, b: number, s: string, p: string) => `${n} has ${a} boxes. Each box contains ${b} ${p}. How many ${p} are there altogether?`
    ],
    '÷': [
        (n: string, a: number, b: number, s: string, p: string) => `${n} has ${a} ${p} and wants to share them equally among ${b} friends. How many ${p} does each friend get?`
    ]
};

const MONEY_TEMPLATES = {
    '+': [
        (n: string, a: number, b: number) => `${n} has ₹${a} in their piggy bank. Their friend gives them ₹${b} more. How much money do they have now?`,
        (n: string, a: number, b: number) => `${n} saved ₹${a} last week and ₹${b} this week. What is the total amount of money saved?`
    ],
    '-': [
        (n: string, a: number, b: number) => `${n} had ₹${a}. They bought a toy for ₹${b}. How much money is left?`,
        (n: string, a: number, b: number) => `${n} took ₹${a} to the market and spent ₹${b}. How much money do they bring back?`
    ],
    '×': [
        (n: string, a: number, b: number) => `A book costs ₹${b}. ${n} buys ${a} books. How much money do they spend in total?`
    ],
    '÷': [
        (n: string, a: number, b: number) => `${n} has ₹${a} and wants to share it equally among ${b} friends. How much money does each friend get?`
    ]
};

type Operation = '+' | '-' | '×' | '÷';
type RangeSelect = 10 | 20 | 99;

type ActiveTool = 
    | { type: 'object', value: string }
    | { type: 'money', value: string, val: number }
    | { type: 'action', value: 'cut' } 
    | null;

// Unified state handling both normal object counts AND explicit money items
type VisualState = {
    type: string | null;
    count: number;
    crossed: number;
    moneyItems: { id: number, val: number, symbol: string, crossed: boolean }[];
};

const defaultVisualState: VisualState = { type: null, count: 0, crossed: 0, moneyItems: [] };

export default function BasicOperationWordProblems() {
    // Config State
    const [phase, setPhase] = useState<'config' | 'playing'>('config');
    const [config, setConfig] = useState<{ op: Operation, range: RangeSelect }>({ op: '+', range: 10 });

    // Problem State
    const [problemText, setProblemText] = useState<string>("");
    const [baseNumber, setBaseNumber] = useState<number>(0); 
    const [hopNumber, setHopNumber] = useState<number>(0);
    const [targetAnswer, setTargetAnswer] = useState<number>(0);
    const [targetSymbol, setTargetSymbol] = useState<string>("");

    // Sandbox State (Direct Inputs)
    const [numA, setNumA] = useState<string>("");
    const [numB, setNumB] = useState<string>("");
    const [totalNum, setTotalNum] = useState<string>("");
    const [op1, setOp1] = useState<string>(""); 
    
    // Visual Sandbox State
    const [objA, setObjA] = useState<VisualState>(defaultVisualState);
    const [objB, setObjB] = useState<VisualState>(defaultVisualState);
    const [totalObj, setTotalObj] = useState<VisualState>(defaultVisualState);
    const [subObj, setSubObj] = useState<VisualState>(defaultVisualState);

    // Interaction State
    const [activeTool, setActiveTool] = useState<ActiveTool>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // --- AUDIO ENGINE ---
    const playSound = (type: 'boing' | 'error' | 'success' | 'pop' | 'click' | 'snip') => {
        if (typeof window === 'undefined') return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            
            if (type === 'boing' || type === 'pop' || type === 'click') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'snip') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'error') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'success') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
                osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) { console.log(e); }
    };

    const speak = (text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const msg = new SpeechSynthesisUtterance(text);
            msg.rate = 0.85; msg.pitch = 1.2; window.speechSynthesis.speak(msg);
        }
    };

    // --- LOGIC: PROBLEM GENERATION ---
    const generateProblem = () => {
        let a = 0, b = 0, ans = 0;
        const max = config.range;

        if (config.op === '+') {
            ans = Math.floor(Math.random() * (max - 2)) + 2; // e.g. 2 to 10
            a = Math.floor(Math.random() * (ans - 1)) + 1; // e.g. 1 to ans-1
            b = ans - a;
        } 
        else if (config.op === '-') {
            a = Math.floor(Math.random() * (max - 2)) + 2; // e.g. 2 to 10
            b = Math.floor(Math.random() * (a - 1)) + 1; // strictly less than a
            ans = a - b;
        } 
        else if (config.op === '×') {
            const maxFactor = Math.floor(Math.sqrt(max));
            a = Math.floor(Math.random() * (maxFactor - 1)) + 2;
            b = Math.floor(Math.random() * (Math.floor(max / a) - 1)) + 2;
            ans = a * b;
        } 
        else if (config.op === '÷') {
            b = Math.floor(Math.random() * 8) + 2;
            const maxQ = Math.floor(max / b);
            ans = Math.floor(Math.random() * (maxQ - 1)) + 1;
            a = b * ans; 
        }

        let generatedText = "";
        let tSym = "";

        if (config.range === 99) {
            const template = MONEY_TEMPLATES[config.op][Math.floor(Math.random() * MONEY_TEMPLATES[config.op].length)];
            generatedText = template(NAMES[Math.floor(Math.random() * NAMES.length)], a, b);
            tSym = "₹";
        } else {
            const randomObj = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
            const template = TEMPLATES[config.op][Math.floor(Math.random() * TEMPLATES[config.op].length)];
            generatedText = template(NAMES[Math.floor(Math.random() * NAMES.length)], a, b, randomObj.singular, randomObj.name);
            tSym = randomObj.emoji;
        }

        setBaseNumber(a); setHopNumber(b); setTargetAnswer(ans);
        setTargetSymbol(tSym); setProblemText(generatedText);
        
        // Reset Board
        setNumA(""); setNumB(""); setTotalNum(""); setOp1("");
        setObjA(defaultVisualState); setObjB(defaultVisualState); 
        setTotalObj(defaultVisualState); setSubObj(defaultVisualState); 
        setActiveTool(null); setPhase('playing'); setIsSuccess(false);
        
        playSound('pop');
    };

    const speakProblem = () => { if (problemText) speak(problemText); };

    // --- LOGIC: VISUAL INTERACTION ---
    const handleSelectTool = (tool: ActiveTool) => {
        if (phase !== 'playing') return;
        setActiveTool(tool);
        playSound('click');
    };

    const handleVisualSlotTap = (slotId: string) => {
        if (phase !== 'playing' || !activeTool) return;
        
        if (config.op === '-') {
            if (slotId === 'subObj') {
                if (activeTool.type === 'object') {
                    setSubObj(prev => {
                        const newType = prev.type !== activeTool.value ? activeTool.value : prev.type;
                        if (prev.type !== activeTool.value || prev.count < 99) {
                            return { ...prev, type: newType, count: prev.count + 1 };
                        }
                        return prev;
                    });
                    playSound('pop');
                } 
                else if (activeTool.type === 'money') {
                    setSubObj(prev => {
                        const sum = prev.moneyItems.reduce((acc, curr) => acc + curr.val, 0);
                        if (sum + activeTool.val <= 999) {
                            return { ...prev, moneyItems: [...prev.moneyItems, { id: Date.now() + Math.random(), val: activeTool.val, symbol: activeTool.value, crossed: false }] };
                        }
                        return prev;
                    });
                    playSound('pop');
                }
                else if (activeTool.type === 'action' && activeTool.value === 'cut') {
                    if (config.range === 99) {
                        playSound('error'); // Money is cut by tapping the specific note
                    } else {
                        // Regular object auto-cut
                        setSubObj(prev => {
                            if (prev.crossed < prev.count) {
                                playSound('snip');
                                return { ...prev, crossed: prev.crossed + 1 };
                            }
                            playSound('error'); return prev;
                        });
                    }
                }
            } else { playSound('error'); }
        } 
        else if (config.op === '+') {
            const handleAccumulate = (setter: React.Dispatch<React.SetStateAction<VisualState>>) => {
                setter(prev => {
                    if (activeTool.type === 'object') {
                        const newType = prev.type !== activeTool.value ? activeTool.value : prev.type;
                        if (prev.type !== activeTool.value) return { ...prev, type: newType, count: 1 };
                        if (prev.count < 99) return { ...prev, count: prev.count + 1 };
                    } 
                    else if (activeTool.type === 'money') {
                        return { ...prev, moneyItems: [...prev.moneyItems, { id: Date.now() + Math.random(), val: activeTool.val, symbol: activeTool.value, crossed: false }] };
                    }
                    return prev;
                });
                playSound('pop');
            };

            if (slotId === 'objA') handleAccumulate(setObjA);
            else if (slotId === 'objB') handleAccumulate(setObjB);
            else if (slotId === 'totalObj') handleAccumulate(setTotalObj);
            else playSound('error');
        }
    };

    const handleMoneyCross = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeTool?.type !== 'action' || activeTool.value !== 'cut') {
            playSound('error'); return;
        }
        setSubObj(prev => {
            const newItems = [...prev.moneyItems];
            newItems[idx].crossed = !newItems[idx].crossed;
            return { ...prev, moneyItems: newItems };
        });
        playSound('snip');
    };

    const clearVisualSlot = (e: React.MouseEvent, setter: Function) => {
        e.stopPropagation(); 
        setter(defaultVisualState);
        playSound('click');
    };

    // --- VALIDATION ENGINES ---
    const isNumACorrect = numA !== "" && parseInt(numA) === baseNumber;
    const isNumBCorrect = numB !== "" && parseInt(numB) === hopNumber;
    const isTotalNumCorrect = totalNum !== "" && parseInt(totalNum) === targetAnswer;
    const isOp1Correct = op1 === config.op;
    
    let isVisualCorrect = true;
    if (config.range === 99) {
        const sumMoney = (items: any[]) => items.reduce((s, i) => s + i.val, 0);
        const crossedMoney = (items: any[]) => items.filter(i => i.crossed).reduce((s, i) => s + i.val, 0);

        if (config.op === '+') {
            isVisualCorrect = (sumMoney(objA.moneyItems) === baseNumber) && 
                              (sumMoney(objB.moneyItems) === hopNumber) && 
                              (sumMoney(totalObj.moneyItems) === targetAnswer);
        } else if (config.op === '-') {
            isVisualCorrect = (sumMoney(subObj.moneyItems) === baseNumber) && 
                              (crossedMoney(subObj.moneyItems) === hopNumber);
        }
    } else {
        if (config.op === '+') {
            isVisualCorrect = (objA.type === targetSymbol && objA.count === baseNumber) && 
                              (objB.type === targetSymbol && objB.count === hopNumber) && 
                              (totalObj.type === targetSymbol && totalObj.count === targetAnswer);
        } else if (config.op === '-') {
            isVisualCorrect = (subObj.type === targetSymbol) && 
                              (subObj.count === baseNumber) && 
                              (subObj.crossed === hopNumber);
        }
    }

    const handleCheck = () => {
        if (phase === 'config') return;

        const isFullyCorrect = isNumACorrect && isNumBCorrect && isTotalNumCorrect && isOp1Correct && isVisualCorrect;

        if (isFullyCorrect) {
            playSound('success');
            speak(`Excellent! ${baseNumber} ${config.op} ${hopNumber} equals ${targetAnswer}.`);
            setIsSuccess(true);
            setActiveTool(null);
        } else {
            playSound('error');
            speak("Keep trying! Fix the boxes that are not green.");
            setIsSuccess(false);
        }
    };

    // --- RENDER HELPERS ---
    const renderVisualSlot = (id: string, state: VisualState, isCorrect: boolean, clearFn: Function, extraClasses: string = "") => {
        const hasContent = state.count > 0 || state.moneyItems.length > 0;
        return (
            <div 
                onClick={() => handleVisualSlotTap(id)}
                className={`relative flex flex-col items-center justify-center p-2 border-[3px] transition-all cursor-pointer overflow-visible min-h-[100px] rounded-[1.5rem]
                    ${isCorrect ? 'bg-lime-50 border-lime-500 shadow-sm' : hasContent ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'} ${extraClasses}`}
            >
                <div className="flex flex-wrap justify-center items-center gap-1.5 w-full h-full p-2">
                    {config.range === 99 
                        ? state.moneyItems.map((item, idx) => (
                            <div key={item.id} onClick={(e) => handleMoneyCross(idx, e)} className={`relative flex items-center justify-center m-0.5 transition-all ${item.crossed ? 'opacity-50 grayscale scale-95' : 'hover:scale-105'} ${item.val >= 10 ? 'w-12 h-8 md:w-16 md:h-10 bg-emerald-100 border-2 border-emerald-400 rounded-md shadow-sm' : 'w-8 h-8 md:w-10 md:h-10 bg-amber-200 border-2 border-amber-500 rounded-full shadow-sm'}`}>
                                <span className={item.val >= 10 ? "text-lg md:text-2xl" : "text-base md:text-xl"}>{item.symbol}</span>
                                {item.crossed && <div className="absolute top-1/2 left-[-10%] w-[120%] h-[3px] bg-red-500 -rotate-45 drop-shadow-md z-10 rounded-full pointer-events-none"></div>}
                            </div>
                        ))
                        : renderBundledEmojis(state.type, state.count, state.crossed)
                    }
                </div>
                {hasContent && !isCorrect && !isSuccess && (
                    <button onClick={(e) => clearVisualSlot(e, clearFn)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-400 active:scale-95 z-20">
                        <XCircle size={14} />
                    </button>
                )}
            </div>
        );
    };

    const renderBundledEmojis = (type: string | null, count: number, crossedCount: number = 0) => {
        if (!type || count === 0) return null;
        
        const uncrossed = count - crossedCount;
        const uncrossedTens = Math.floor(uncrossed / 10);
        const uncrossedOnes = uncrossed % 10;
        
        const crossedTens = Math.floor(crossedCount / 10);
        const crossedOnes = crossedCount % 10;

        const renderBox = (isCrossed: boolean, key: string) => (
            <div key={key} className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-amber-100 border-[3px] border-amber-400 rounded-xl shadow-sm m-1 transition-all ${isCrossed ? 'opacity-50 grayscale' : ''}`}>
                <span className="text-2xl md:text-3xl absolute opacity-40 mix-blend-multiply">{type}</span>
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded border-2 border-white shadow-sm z-10">10</div>
                {isCrossed && <div className="absolute top-1/2 left-[-10%] w-[120%] h-[4px] bg-red-500 -rotate-45 drop-shadow-md z-20 rounded-full"></div>}
            </div>
        );

        const renderLoose = (isCrossed: boolean, key: string) => (
            <div key={key} className={`relative flex items-center justify-center w-8 h-8 m-0.5 transition-all ${isCrossed ? 'opacity-50 grayscale' : ''}`}>
                <span className="text-2xl md:text-3xl">{type}</span>
                {isCrossed && <div className="absolute top-1/2 left-[-20%] w-[140%] h-[3px] bg-red-500 -rotate-45 drop-shadow-md z-10 rounded-full"></div>}
            </div>
        );

        const elements = [];
        for(let i=0; i<uncrossedTens; i++) elements.push(renderBox(false, `ut-${i}`));
        for(let i=0; i<uncrossedOnes; i++) elements.push(renderLoose(false, `uo-${i}`));
        for(let i=0; i<crossedTens; i++) elements.push(renderBox(true, `ct-${i}`));
        for(let i=0; i<crossedOnes; i++) elements.push(renderLoose(true, `co-${i}`));

        return elements;
    };

    // ============================================================================
    // RENDER: PHASE 1 - CONFIGURATION SCREEN
    // ============================================================================
    if (phase === 'config') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-50 font-sans overflow-y-auto">
                <div className="max-w-xl w-full bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border-4 border-slate-200 text-center space-y-6 my-auto">
                    <div className="flex justify-center"><div className="bg-sky-100 p-3 rounded-full text-sky-600 shadow-inner"><Settings size={36} /></div></div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Word Problem Setup</h1>
                    </div>
                    
                    <div className="space-y-6 text-left">
                        {/* 1. Range Select */}
                        <div>
                            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                <span>1. Select Number Size</span>
                            </label>
                            <div className="flex gap-2">
                                {([10, 20, 99] as RangeSelect[]).map(r => (
                                    <button 
                                        key={r} 
                                        onClick={() => {
                                            let newOp = config.op;
                                            if (r < 99 && (newOp === '×' || newOp === '÷')) newOp = '+';
                                            setConfig({ op: newOp, range: r });
                                        }} 
                                        className={`flex-1 py-3 text-sm md:text-base font-black rounded-xl border-4 transition-all shadow-sm ${config.range === r ? 'bg-rose-100 border-rose-500 text-rose-700 scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-rose-300'}`}
                                    >
                                        Up to {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Operation Select */}
                        <div>
                            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">2. Select Operation</label>
                            <div className="flex gap-2">
                                {(['+', '-', '×', '÷'] as Operation[]).map(op => {
                                    const isDisabled = (op === '×' || op === '÷') && config.range !== 99;
                                    return (
                                        <button 
                                            key={op} 
                                            disabled={isDisabled}
                                            onClick={() => setConfig({...config, op: op})} 
                                            className={`flex-1 py-3 text-xl font-black rounded-xl border-4 transition-all shadow-sm 
                                                ${isDisabled ? 'opacity-30 bg-slate-100 border-slate-200 cursor-not-allowed' : config.op === op ? 'bg-indigo-100 border-indigo-500 text-indigo-700 scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-300'}`}
                                        >
                                            {op}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <button onClick={generateProblem} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black text-lg py-4 rounded-xl shadow-[0_4px_0_rgb(15,23,42)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 mt-4"><Calculator size={20} /> Start Practice</button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PHASE 2 - THE PLAYING SANDBOX
    // ============================================================================
    return (
        <div className="w-full h-full flex flex-col items-center bg-sky-50 font-sans select-none overflow-hidden relative">
            
            {/* 1. TOP BANNER */}
            <div className="w-full shrink-0 z-20 p-2 md:p-3 pb-0">
                <div className={`w-full p-2 md:p-3 rounded-2xl flex flex-col sm:flex-row items-center gap-2 transition-all duration-500 border-2 ${isSuccess ? 'bg-lime-100 border-lime-400' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <button onClick={speakProblem} className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-sky-500 text-white hover:bg-sky-400 hover:scale-105 active:scale-95 shadow-sm transition-all"><Volume2 size={18} /></button>
                    <div className="flex-1 text-center sm:text-left overflow-y-auto max-h-[80px] sm:max-h-full hide-scrollbar">
                        <h2 className="text-sm md:text-lg font-black text-slate-700 leading-snug" dangerouslySetInnerHTML={{ __html: problemText.replace(/\b\d+\b/g, match => `<span class="text-rose-500">${match}</span>`) }} />
                    </div>
                    <button onClick={() => setPhase('config')} className="shrink-0 px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-200 flex items-center gap-1"><Settings size={12} /> Setup</button>
                </div>
            </div>

            {/* 2. MIDDLE SCROLLING AREA */}
            <div className="w-full flex-1 flex flex-col items-center justify-start gap-3 md:gap-4 p-2 overflow-y-auto hide-scrollbar pt-4">
                
                {/* --- NUMBER EQUATION (No Labels) --- */}
                <div className="w-full max-w-4xl bg-white/80 rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-wrap items-center justify-center gap-3 md:gap-6 shrink-0">
                    <input type="number" value={numA} onChange={(e) => { setNumA(e.target.value.slice(0, 4)); playSound('boing'); }}
                        className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl border-[3px] text-center text-3xl md:text-5xl font-black outline-none transition-all shadow-sm ${isNumACorrect ? 'bg-lime-50 border-lime-500 text-lime-700' : 'bg-white border-slate-300 hover:border-indigo-400 focus:border-indigo-500 text-slate-700'}`} />

                    <select value={op1} onChange={(e) => { setOp1(e.target.value); playSound('boing'); }} style={{ textAlignLast: 'center' }}
                        className={`w-14 h-14 md:w-20 md:h-20 rounded-full border-[3px] text-center text-3xl md:text-4xl font-black outline-none transition-all shadow-sm appearance-none cursor-pointer ${isOp1Correct ? 'bg-lime-50 border-lime-500 text-lime-700' : 'bg-white border-slate-300 hover:border-indigo-400 focus:border-indigo-500 text-slate-700'}`}>
                        <option value="" disabled>?</option>
                        <option value="+">+</option><option value="-">-</option><option value="×">×</option><option value="÷">÷</option>
                    </select>

                    <input type="number" value={numB} onChange={(e) => { setNumB(e.target.value.slice(0, 4)); playSound('boing'); }}
                        className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl border-[3px] text-center text-3xl md:text-5xl font-black outline-none transition-all shadow-sm ${isNumBCorrect ? 'bg-lime-50 border-lime-500 text-lime-700' : 'bg-white border-slate-300 hover:border-indigo-400 focus:border-indigo-500 text-slate-700'}`} />

                    <span className="text-4xl md:text-6xl font-black text-slate-300">=</span>

                    <input type="number" value={totalNum} onChange={(e) => { setTotalNum(e.target.value.slice(0, 4)); playSound('boing'); }}
                        className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl border-[3px] text-center text-4xl md:text-6xl font-black outline-none transition-all shadow-sm ${isTotalNumCorrect ? 'bg-lime-50 border-lime-500 text-lime-700' : 'bg-white border-slate-300 hover:border-indigo-400 focus:border-indigo-500 text-slate-700'}`} />
                </div>

                {/* --- VISUAL MODEL (No Labels) --- */}
                {(config.op === '+' || config.op === '-') && (
                    <div className="w-full max-w-4xl bg-white/80 rounded-3xl p-4 md:p-6 border-2 border-slate-200 shadow-sm flex flex-col items-center shrink-0 mb-4">
                        
                        {/* Active Tool HUD */}
                        <div className="flex items-center justify-center px-4 bg-indigo-100 border border-indigo-200 rounded-full shadow-sm py-1 shrink-0 mb-4">
                            <span className="font-bold text-[10px] md:text-xs text-indigo-800 mr-2 flex items-center gap-1"><MousePointer2 size={12} /> Tool:</span>
                            {activeTool ? <div className="text-sm md:text-base animate-bounce font-black text-slate-800 leading-none">{activeTool.value === 'cut' ? '✂️' : activeTool.value}</div> : <span className="text-indigo-400 font-bold italic text-[10px] md:text-xs">Select object below</span>}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                            {config.op === '-' ? (
                                // SUBTRACTION 
                                renderVisualSlot('subObj', subObj, isVisualCorrect, setSubObj, 'w-full max-w-2xl')
                            ) : config.op === '+' ? (
                                // ADDITION 
                                <>
                                    {renderVisualSlot('objA', objA, isVisualCorrect, setObjA, 'w-32 md:w-48')}
                                    <span className="text-slate-300 font-black text-2xl md:text-4xl">+</span>
                                    {renderVisualSlot('objB', objB, isVisualCorrect, setObjB, 'w-32 md:w-48')}
                                    <span className="text-slate-300 font-black text-2xl md:text-4xl">=</span>
                                    {renderVisualSlot('totalObj', totalObj, isVisualCorrect, setTotalObj, 'w-32 md:w-48')}
                                </>
                            ) : null }
                        </div>
                    </div>
                )}
            </div>

            {/* 3. BOTTOM TOOLS PALETTE */}
            <div className="w-full shrink-0 flex flex-col gap-2 p-3 pb-24 md:pb-6 border-t-2 border-slate-200 bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                
                {/* Dynamic Object Palette */}
                {(config.op === '+' || config.op === '-') && (
                    <div className="w-full max-w-4xl mx-auto flex justify-center flex-wrap gap-2">
                        {config.range === 99 ? (
                            // MONEY PALETTE
                            MONEY_OBJECTS.map(obj => (
                                <button key={`obj-${obj.id}`} onClick={() => handleSelectTool({ type: 'money', value: obj.symbol, val: obj.val })}
                                    className={`px-4 h-12 md:h-14 rounded-xl font-black text-lg md:text-2xl border-b-[3px] transition-all flex items-center justify-center shrink-0 gap-2
                                        ${activeTool?.type === 'money' && activeTool.val === obj.val ? 'bg-rose-400 border-rose-600 text-white scale-110 shadow-sm' : 'bg-slate-100 border-slate-300 hover:-translate-y-1'}`}>
                                    {obj.symbol} <span className="text-sm opacity-70">₹{obj.val}</span>
                                </button>
                            ))
                        ) : (
                            // REGULAR OBJECT PALETTE
                            <button onClick={() => handleSelectTool({ type: 'object', value: targetSymbol })}
                                className={`w-12 h-12 md:w-14 md:h-14 rounded-xl font-black text-2xl border-b-[3px] transition-all flex items-center justify-center shrink-0
                                    ${activeTool?.type === 'object' && activeTool.value === targetSymbol ? 'bg-rose-400 border-rose-600 scale-110 shadow-sm' : 'bg-slate-100 border-slate-300 hover:-translate-y-1'}`}>
                                {targetSymbol}
                            </button>
                        )}
                        
                        {config.op === '-' && (
                            <>
                                <div className="w-[2px] h-8 bg-slate-200 mx-2 rounded-full shrink-0 self-center"></div>
                                <button onClick={() => handleSelectTool({ type: 'action', value: 'cut' })}
                                    className={`px-4 h-12 md:h-14 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider border-b-[3px] flex items-center gap-1.5 transition-all shrink-0
                                        ${activeTool?.value === 'cut' ? 'bg-red-500 border-red-700 text-white scale-110 shadow-sm' : 'bg-slate-800 border-slate-900 text-slate-300 hover:bg-slate-700 hover:-translate-y-1'}`}>
                                    <Scissors size={16} /> Cut
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Final Action Buttons */}
                <div className="w-full max-w-4xl mx-auto flex justify-between items-center gap-3 mt-2">
                    <button onClick={generateProblem} className="bg-purple-500 text-white font-black text-sm md:text-base px-6 py-3 rounded-xl flex items-center justify-center gap-2 border-b-[4px] border-purple-700 active:border-b-0 active:translate-y-[4px] transition-all whitespace-nowrap">
                        <Shuffle size={18} /> New <span className="hidden sm:inline">Problem</span>
                    </button>
                    <button onClick={handleCheck} className={`flex-1 py-3 rounded-xl border-[4px] flex items-center justify-center font-black text-lg md:text-xl tracking-wider transition-all 
                        ${isSuccess ? 'bg-lime-500 border-lime-600 text-white active:translate-y-[4px] active:border-b-[0px]' : 'bg-lime-400 border-lime-500 text-lime-950 active:translate-y-[4px] active:border-b-[0px]'}`}>
                        CHECK
                    </button>
                </div>
            </div>
            
        </div>
    );
}