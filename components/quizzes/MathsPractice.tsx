"use client";

import React, { useState } from 'react';
import { Settings, RefreshCcw, Eye, EyeOff, Calculator, FileText, CheckCircle2 } from 'lucide-react';

// --- TYPES ---
type Format = 'numerical' | 'word';
type Operation = 'add_no_carry' | 'add_carry' | 'sub_no_borrow' | 'sub_borrow' | 'multiply' | 'divide';
type Digits = 1 | 2 | 3 | 4;

type Config = {
    format: Format;
    operation: Operation;
    digits: Digits;
};

type Problem = {
    id: string;
    a: number;
    b: number;
    opSymbol: string;
    answer: number;
    remainder?: number; // Added for Division
    text?: string;
};

// --- NARRATIVE ENGINE ---
const NAMES = ["Rahul", "Priya", "Amit", "Sara", "Kabir", "Aisha", "Rohan", "Meera"];
const ITEMS = ["apples", "marbles", "books", "toys", "candies", "pencils", "stickers", "balloons"];

const generateWordProblemText = (a: number, b: number, op: Operation): string => {
    const name1 = NAMES[Math.floor(Math.random() * NAMES.length)];
    let name2 = NAMES[Math.floor(Math.random() * NAMES.length)];
    while (name2 === name1) name2 = NAMES[Math.floor(Math.random() * NAMES.length)];
    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];

    if (op.includes('add')) {
        return `${name1} has ${a} ${item}. ${name2} gives them ${b} more. How many ${item} does ${name1} have in total?`;
    } else if (op.includes('sub')) {
        return `${name1} had ${a} ${item}. They gave ${b} ${item} to ${name2}. How many ${item} are left with ${name1}?`;
    } else if (op === 'multiply') {
        return `There are ${a} boxes. Each box contains ${b} ${item}. How many ${item} are there altogether?`;
    } else if (op === 'divide') {
        return `${name1} has ${a} ${item} and wants to share them equally among ${b} friends. How many ${item} will each friend get?`;
    }
    return "";
};

// --- MATH LOGIC HELPERS ---
const randomRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const getMinMax = (digits: number) => {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return { min: digits === 1 ? 1 : min, max }; 
};

const hasCarry = (a: number, b: number): boolean => {
    let strA = a.toString().split('').reverse();
    let strB = b.toString().split('').reverse();
    let carry = 0;
    for (let i = 0; i < Math.max(strA.length, strB.length); i++) {
        let sum = (parseInt(strA[i] || '0') + parseInt(strB[i] || '0') + carry);
        if (sum > 9) return true;
        carry = Math.floor(sum / 10);
    }
    return false;
};

const hasBorrow = (a: number, b: number): boolean => {
    let strA = a.toString().split('').reverse();
    let strB = b.toString().split('').reverse();
    for (let i = 0; i < strB.length; i++) {
        if (parseInt(strA[i] || '0') < parseInt(strB[i] || '0')) return true;
    }
    return false;
};

// --- MAIN COMPONENT ---
export default function MathsPractice() {
    const [phase, setPhase] = useState<'config' | 'quiz'>('config');
    const [config, setConfig] = useState<Config>({
        format: 'numerical',
        operation: 'add_no_carry',
        digits: 1
    });
    const [problems, setProblems] = useState<Problem[]>([]);
    const [showAnswers, setShowAnswers] = useState(false);

    // --- GENERATION ENGINE ---
    const generateProblems = (currentConfig: Config = config) => {
        const newProblems: Problem[] = [];
        const count = currentConfig.format === 'numerical' ? 10 : 5;
        const generatedSignatures = new Set<string>();

        while (newProblems.length < count) {
            let a = 0, b = 0, answer = 0, remainder = 0;
            let opSymbol = '';
            let attempts = 0;
            let isUnique = false;

            while (!isUnique && attempts < 50) {
                attempts++;
                const { min, max } = getMinMax(currentConfig.digits);

                if (currentConfig.operation === 'add_no_carry') {
                    opSymbol = '+';
                    let aStr = '', bStr = '';
                    for (let d = 0; d < currentConfig.digits; d++) {
                        let aDigit = randomRange(d === 0 ? 1 : 0, 9);
                        let bDigit = randomRange(d === 0 ? 1 : 0, 9 - aDigit); 
                        aStr += aDigit;
                        bStr += bDigit;
                    }
                    a = parseInt(aStr);
                    b = parseInt(bStr);
                    answer = a + b;
                } 
                else if (currentConfig.operation === 'add_carry') {
                    opSymbol = '+';
                    do {
                        a = randomRange(min, max);
                        b = randomRange(min, max);
                    } while (!hasCarry(a, b) && currentConfig.digits > 1); 
                    
                    if (currentConfig.digits === 1 && !hasCarry(a, b)) {
                        a = randomRange(5, 9);
                        b = randomRange(5, 9);
                    }
                    answer = a + b;
                } 
                else if (currentConfig.operation === 'sub_no_borrow') {
                    opSymbol = '-';
                    let aStr = '', bStr = '';
                    for (let d = 0; d < currentConfig.digits; d++) {
                        let aDigit = randomRange(d === 0 ? 1 : 0, 9);
                        let bDigit = randomRange(d === 0 ? 1 : 0, aDigit); 
                        aStr += aDigit;
                        bStr += bDigit;
                    }
                    a = parseInt(aStr);
                    b = parseInt(bStr);
                    answer = a - b;
                } 
                else if (currentConfig.operation === 'sub_borrow') {
                    opSymbol = '-';
                    do {
                        a = randomRange(min, max);
                        b = randomRange(min, a - 1);
                    } while (!hasBorrow(a, b) && currentConfig.digits > 1);
                    answer = a - b;
                } 
                else if (currentConfig.operation === 'multiply') {
                    opSymbol = '×';
                    a = randomRange(min === 1 && currentConfig.digits > 1 ? min : 2, max); 
                    
                    let multDigits = Math.min(currentConfig.digits, 3);
                    let multBounds = getMinMax(multDigits);
                    b = randomRange(multBounds.min === 1 ? 2 : multBounds.min, multBounds.max); 
                    answer = a * b;
                } 
                else if (currentConfig.operation === 'divide') {
                    opSymbol = '÷';
                    
                    // Dividend bounds based precisely on selected digits
                    let aBounds = getMinMax(currentConfig.digits);
                    a = randomRange(aBounds.min === 1 ? 2 : aBounds.min, aBounds.max);

                    // Divisor must be at least 1 digit less than dividend, capped at 2 digits total
                    let maxDivDigits = currentConfig.digits === 1 ? 1 : Math.min(2, currentConfig.digits - 1);
                    let divDigits = randomRange(1, maxDivDigits);
                    let divBounds = getMinMax(divDigits);
                    
                    // Ensure divisor avoids 1, and is never greater than the dividend
                    b = randomRange(divBounds.min === 1 ? 2 : divBounds.min, Math.min(divBounds.max, a));

                    answer = Math.floor(a / b);
                    remainder = a % b;
                }

                // Check Uniqueness
                const signature = `${a}_${opSymbol}_${b}`;
                if (!generatedSignatures.has(signature) || attempts >= 49) {
                    generatedSignatures.add(signature);
                    isUnique = true;
                }
            }

            newProblems.push({
                id: `prob-${Date.now()}-${newProblems.length}`,
                a, b, opSymbol, answer,
                ...(opSymbol === '÷' && { remainder }), // Only inject remainder if division
                text: currentConfig.format === 'word' ? generateWordProblemText(a, b, currentConfig.operation) : undefined
            });
        }

        setProblems(newProblems);
        setShowAnswers(false);
    };

    const handleStart = () => {
        generateProblems();
        setPhase('quiz');
    };

    const handleNewQuestions = () => {
        generateProblems();
    };

    // --- RENDER HELPERS ---
    const getOpLabel = (op: Operation) => {
        switch(op) {
            case 'add_no_carry': return 'Addition (No Carry)';
            case 'add_carry': return 'Addition (With Carry)';
            case 'sub_no_borrow': return 'Subtraction (No Borrow)';
            case 'sub_borrow': return 'Subtraction (With Borrow)';
            case 'multiply': return 'Multiplication';
            case 'divide': return 'Division';
        }
    };

    return (
        <div className="w-full h-full bg-slate-50 font-sans select-none flex flex-col items-center overflow-y-auto relative">
            
            {/* --- CONFIGURATION PHASE --- */}
            {phase === 'config' && (
                <div className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center p-4 md:p-6 space-y-4 md:space-y-6 animate-in fade-in zoom-in duration-300 my-auto">
                    
                    <div className="text-center space-y-1">
                        <div className="flex justify-center mb-2">
                            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                <Calculator size={36} />
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Practice Generator</h1>
                        <p className="text-sm md:text-base text-slate-500 font-medium">Select your parameters to instantly build a worksheet.</p>
                    </div>

                    <div className="w-full bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border-2 border-slate-200 space-y-6">
                        
                        {/* 1. Format */}
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">1. Select Format</h3>
                            <div className="flex gap-2 md:gap-4">
                                <button onClick={() => setConfig({...config, format: 'numerical'})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-4 font-bold text-sm md:text-base transition-all ${config.format === 'numerical' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                                    <Calculator size={18}/> Numerical Grid
                                </button>
                                <button onClick={() => setConfig({...config, format: 'word'})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-4 font-bold text-sm md:text-base transition-all ${config.format === 'word' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                                    <FileText size={18}/> Word Problems
                                </button>
                            </div>
                        </div>

                        {/* 2. Operation */}
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">2. Arithmetic Operation</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(['add_no_carry', 'add_carry', 'sub_no_borrow', 'sub_borrow', 'multiply', 'divide'] as Operation[]).map(op => (
                                    <button key={op} onClick={() => setConfig({...config, operation: op})} className={`py-2 px-3 rounded-lg border-2 font-bold text-sm md:text-base text-left transition-all flex items-center justify-between ${config.operation === op ? 'bg-sky-50 border-sky-500 text-sky-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                        {getOpLabel(op)}
                                        {config.operation === op && <CheckCircle2 size={16} className="text-sky-500"/>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Digits */}
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center">
                                <span>3. Number Length</span>
                            </h3>
                            <div className="flex gap-2">
                                {([1, 2, 3, 4] as Digits[]).map(d => (
                                    <button key={d} onClick={() => setConfig({...config, digits: d})} className={`flex-1 py-3 rounded-lg border-[3px] font-black text-base md:text-lg transition-all ${config.digits === d ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-200 text-slate-500 hover:border-rose-300'}`}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    <button onClick={handleStart} className="w-full max-w-md bg-slate-800 hover:bg-slate-700 text-white font-black text-xl py-4 rounded-xl shadow-[0_4px_0_rgb(15,23,42)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
                        <Settings size={20} /> GENERATE WORKSHEET
                    </button>
                </div>
            )}

            {/* --- QUIZ PHASE --- */}
            {phase === 'quiz' && (
                <div className="w-full max-w-5xl flex flex-col flex-1 animate-in slide-in-from-bottom-4 duration-500 relative">
                    
                    {/* Header */}
                    <div className="w-full flex items-center justify-between p-2 md:p-4 bg-white border-b-2 border-slate-200 sticky top-0 z-40 shadow-sm shrink-0">
                        <button onClick={() => setPhase('config')} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors text-sm md:text-base">
                            <Settings size={16} /> <span className="hidden md:inline">Back to Settings</span>
                        </button>
                        <div className="text-center">
                            <h2 className="text-lg md:text-xl font-black text-slate-800 leading-tight">
                                {config.digits}-Digit {getOpLabel(config.operation)}
                            </h2>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{config.format} practice</p>
                        </div>
                        <div className="w-20 md:w-24"></div> {/* Spacer for center alignment */}
                    </div>

                    {/* Problem Board (Scrollable Area) */}
                    <div className="w-full p-2 md:p-6 flex-1">
                        
                        {config.format === 'numerical' ? (
                            // NUMERICAL GRID 
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 w-full max-w-5xl mx-auto pb-4">
                                {problems.map((p, i) => (
                                    <div key={p.id} className="flex flex-col items-end justify-end bg-white p-3 md:p-4 rounded-[1.5rem] border-2 border-slate-200 shadow-sm hover:border-indigo-300 transition-colors relative group min-h-[140px]">
                                        <div className="absolute top-2 left-3 text-slate-300 font-bold text-xs md:text-sm">Q{i + 1}</div>
                                        
                                        {/* Notebook Style Math layout */}
                                        <div className="font-mono text-2xl md:text-3xl font-medium text-slate-800 tracking-widest flex flex-col items-end relative w-full pt-3">
                                            <span>{p.a}</span>
                                            <div className="flex items-center w-full justify-between mt-1">
                                                <span className="text-sky-500 font-black">{p.opSymbol}</span>
                                                <span>{p.b}</span>
                                            </div>
                                            <div className="w-full border-b-[3px] border-slate-800 my-1.5"></div>
                                            <div className={`h-8 md:h-10 flex items-center justify-end w-full transition-all duration-300 ${showAnswers ? 'opacity-100' : 'opacity-0'}`}>
                                                <span className="text-rose-600 font-black whitespace-nowrap text-lg md:text-2xl tracking-tighter md:tracking-widest">
                                                    {p.opSymbol === '÷' ? `Q:${p.answer} R:${p.remainder}` : p.answer}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // WORD PROBLEM LIST
                            <div className="flex flex-col gap-3 md:gap-4 w-full max-w-3xl mx-auto pb-4">
                                {problems.map((p, i) => (
                                    <div key={p.id} className="bg-white p-4 md:p-6 rounded-2xl border-2 border-slate-200 shadow-sm relative">
                                        <div className="absolute top-0 left-0 bg-indigo-500 text-white font-black px-3 py-1 rounded-br-lg rounded-tl-2xl text-xs md:text-sm">Q{i + 1}</div>
                                        
                                        <p className="text-base md:text-lg font-medium text-slate-700 leading-snug mt-3">
                                            {p.text}
                                        </p>
                                        
                                        <div className={`mt-3 pt-3 border-t-2 border-dashed border-slate-200 transition-all duration-300 ${showAnswers ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden pt-0 mt-0 border-transparent'}`}>
                                            <div className="flex items-center gap-3 bg-lime-50 p-3 rounded-lg border-2 border-lime-200 flex-wrap">
                                                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs md:text-sm">Answer:</span>
                                                <span className="text-xl md:text-2xl font-black text-lime-700 whitespace-nowrap">
                                                    {p.opSymbol === '÷' ? `Q: ${p.answer} R: ${p.remainder}` : p.answer}
                                                </span>
                                                <span className="text-slate-400 font-mono text-xs md:text-sm ml-auto">({p.a} {p.opSymbol} {p.b})</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>

                    {/* Sticky Bottom Controls */}
                    <div className="sticky bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-700 p-2 md:p-3 z-50 flex justify-center mt-auto shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        <div className="w-full max-w-4xl flex justify-between items-center gap-2 md:gap-4">
                            
                            <button 
                                onClick={handleNewQuestions}
                                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black text-sm md:text-lg px-2 md:px-6 py-2.5 md:py-3.5 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 transition-all active:scale-95 whitespace-nowrap"
                            >
                                <RefreshCcw size={18} className="shrink-0" /> <span className="hidden sm:inline">Generate</span> New
                            </button>

                            <button 
                                onClick={() => setShowAnswers(!showAnswers)}
                                className={`flex-[2] font-black text-base md:text-xl px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl border-[3px] flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap
                                    ${showAnswers ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-lime-400 text-lime-950 border-lime-500 hover:bg-lime-300'}`}
                            >
                                {showAnswers ? <><EyeOff size={20} className="shrink-0"/> Hide Answers</> : <><Eye size={20} className="shrink-0"/> Show Answers</>}
                            </button>

                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}