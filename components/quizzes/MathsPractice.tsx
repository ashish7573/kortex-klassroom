"use client";

import React, { useState } from 'react';
import { Settings, RefreshCcw, Eye, EyeOff, Calculator, FileText, CheckCircle2, Globe } from 'lucide-react';

// --- TYPES ---
type Format = 'numerical' | 'word';
type Operation = 'add_no_carry' | 'add_carry' | 'sub_no_borrow' | 'sub_borrow' | 'multiply' | 'divide';
type Digits = 1 | 2 | 3 | 4;
type Language = 'en' | 'hi' | 'fr' | 'es';

type Config = {
    format: Format;
    operations: Operation[];
    digitsA: number; 
    digitsB: number; 
    questionCount: number; 
};

type WordProblemData = {
    name1: string;
    name2: string;
    itemIndex: number;
};

type Problem = {
    id: string;
    a: number;
    b: number;
    opSymbol: string;
    operation: Operation;
    answer: number;
    remainder?: number; 
    wordData?: WordProblemData;
};

// --- MULTI-LINGUAL NARRATIVE ENGINE ---
const NAMES = ["Rahul", "Priya", "Amit", "Sara", "Kabir", "Aisha", "Rohan", "Meera"];

const DICTIONARY = {
    en: ["apples", "marbles", "books", "toys", "candies", "pencils", "stickers", "balloons"],
    hi: ["सेब", "कंचे", "किताबें", "खिलौने", "टॉफियां", "पेंसिलें", "स्टिकर", "गुब्बारे"],
    fr: ["pommes", "billes", "livres", "jouets", "bonbons", "crayons", "autocollants", "ballons"],
    es: ["manzanas", "canicas", "libros", "juguetes", "dulces", "lápices", "pegatinas", "globos"]
};

const getWordProblemText = (a: number, b: number, op: Operation, data: WordProblemData, lang: Language): string => {
    const item = DICTIONARY[lang][data.itemIndex];
    const n1 = data.name1;
    const n2 = data.name2;

    if (op.includes('add')) {
        if (lang === 'hi') return `${n1} के पास ${a} ${item} हैं। ${n2} ने उसे ${b} और दे दिए। अब ${n1} के पास कुल कितने ${item} हैं?`;
        return `${n1} has ${a} ${item}. ${n2} gives them ${b} more. How many ${item} does ${n1} have in total?`;
    } 
    else if (op.includes('sub')) {
        if (lang === 'hi') return `${n1} के पास ${a} ${item} थे। उसने ${b} ${item} ${n2} को दे दिए। अब ${n1} के पास कितने ${item} बचे हैं?`;
        return `${n1} had ${a} ${item}. They gave ${b} ${item} to ${n2}. How many ${item} are left with ${n1}?`;
    } 
    else if (op === 'multiply') {
        if (lang === 'hi') return `यहाँ ${a} डिब्बे हैं। हर डिब्बे में ${b} ${item} हैं। कुल मिलाकर कितने ${item} हैं?`;
        return `There are ${a} boxes. Each box contains ${b} ${item}. How many ${item} are there altogether?`;
    } 
    else if (op === 'divide') {
        if (lang === 'hi') return `${n1} के पास ${a} ${item} हैं और वह उन्हें ${b} दोस्तों में बराबर बांटना चाहता है। हर दोस्त को कितने ${item} मिलेंगे?`;
        return `${n1} has ${a} ${item} and wants to share them equally among ${b} friends. How many ${item} will each friend get?`;
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

// --- PROCEDURAL RENDERING COMPONENTS ---

// Generic Grid Row for Perfect Alignment (Fixed blank space collapsing & red zeros)
const GridRow = ({ value, padTo, className = "", textColor = "text-slate-800", isCarry = false }: any) => {
    const str = value.toString();
    const padded = str.padStart(padTo, ' ');
    return (
        <div className={`flex ${className}`}>
            {padded.split('').map((char: string, i: number) => {
                const isRedZero = char === 'x';
                const displayChar = isRedZero ? '0' : (char === ' ' ? '\u00A0' : char);
                const finalTextColor = isRedZero ? 'text-rose-500' : (isCarry && char !== ' ' ? 'text-[10px] md:text-sm text-rose-500' : textColor);
                
                return (
                    <div key={i} className={`w-5 h-7 md:w-8 md:h-10 flex items-center justify-center font-mono font-bold text-lg md:text-2xl ${finalTextColor} ${isCarry && char !== ' ' ? 'bg-rose-50 rounded-full h-4 w-4 md:h-6 md:w-6 m-auto border border-rose-200' : ''}`}>
                        {displayChar}
                    </div>
                );
            })}
        </div>
    );
};

const StepByStepAddition = ({ a, b, answer }: { a: number, b: number, answer: number }) => {
    let strA = a.toString().split('').reverse();
    let strB = b.toString().split('').reverse();
    
    // The number of columns is dictated by the length of the final answer
    const maxLen = answer.toString().length;
    let carryArray = Array(maxLen).fill(' '); 
    let carry = 0;
    
    // Calculate from right to left
    for (let i = 0; i < maxLen; i++) {
        let digitA = parseInt(strA[i] || '0');
        let digitB = parseInt(strB[i] || '0');
        let sum = digitA + digitB + carry;
        carry = Math.floor(sum / 10);
        
        // If this column generates a carry, place it exactly above the NEXT column
        if (i + 1 < maxLen && carry > 0) {
            carryArray[i + 1] = carry.toString();
        }
    }
    
    // Reverse the array to display it correctly from left-to-right
    carryArray.reverse();
    const carryStr = carryArray.join('');

    return (
        <div className="flex flex-col items-end w-full">
            {carryStr.trim().length > 0 && (
                <GridRow value={carryStr} padTo={maxLen} isCarry={true} />
            )}
            <GridRow value={a} padTo={maxLen} />
            <div className="flex items-center">
                <span className="text-sky-500 font-black mr-1 md:mr-2 text-xl">+</span>
                <GridRow value={b} padTo={maxLen} />
            </div>
            <div className="w-full border-b-[3px] border-slate-800 my-1"></div>
            <GridRow value={answer} padTo={maxLen} textColor="text-emerald-600" />
        </div>
    );
};

const BorrowRow = ({ rowIdx, stacks, maxLen }: any) => {
    return (
        <div className="flex">
            {Array.from({ length: maxLen }).map((_, c) => {
                const stack = stacks[c];
                const val = stack[rowIdx];
                const isVisible = val !== undefined;
                // Strike through if there is another borrow stacked above this one!
                const isStriked = isVisible && rowIdx < stack.length - 1;
                
                return (
                    <div key={c} className="w-5 h-7 md:w-8 md:h-10 flex items-center justify-center font-mono font-bold text-lg md:text-2xl text-slate-800">
                        {isVisible && (
                            <div className={`flex items-center justify-center m-auto rounded-full border border-rose-200 bg-rose-50 text-rose-500 text-[10px] md:text-sm px-0.5 min-w-[18px] md:min-w-[24px] h-4 md:h-6 ${isStriked ? 'line-through decoration-rose-500 decoration-2 opacity-60' : ''}`}>
                                {val}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const StepByStepSubtraction = ({ a, b, answer }: { a: number, b: number, answer: number }) => {
    const maxLen = Math.max(a.toString().length, b.toString().length);
    const strA = a.toString().padStart(maxLen, ' ').split('');
    const numA = a.toString().padStart(maxLen, '0').split('').map(Number);
    const numB = b.toString().padStart(maxLen, '0').split('').map(Number);
    
    // We create a vertical stack of borrows for every single column
    let stacks: number[][] = Array.from({ length: maxLen }, () => []);
    let aModified = [...numA];

    for (let i = maxLen - 1; i >= 0; i--) {
        if (aModified[i] < numB[i]) {
            let j = i - 1;
            while(j >= 0 && aModified[j] === 0) j--;
            if (j >= 0) {
                // The number being borrowed FROM
                aModified[j] -= 1;
                stacks[j].push(aModified[j]); 
                
                // Any zeros in between become 9s
                for(let k = j + 1; k < i; k++) {
                    aModified[k] = 9;
                    stacks[k].push(9);
                }
                
                // The number borrowing TO
                aModified[i] += 10;
                stacks[i].push(aModified[i]);
            }
        }
    }
    
    // Find the tallest stack of cascading borrows to know how many rows to draw
    const maxStackDepth = Math.max(0, ...stacks.map(s => s.length));

    return (
        <div className="flex flex-col items-end w-full">
            
            {/* 1. Render all Borrow Rows from top to bottom */}
            {Array.from({ length: maxStackDepth }).map((_, idx) => {
                const rowIdx = maxStackDepth - 1 - idx; 
                return <BorrowRow key={rowIdx} rowIdx={rowIdx} stacks={stacks} maxLen={maxLen} />
            })}
            
            {/* 2. Render Main 'A' Row */}
            <div className="flex">
                {strA.map((char: string, c: number) => {
                    const isStriked = char !== ' ' && stacks[c].length > 0;
                    return (
                    <div key={c} className={`w-5 h-7 md:w-8 md:h-10 flex items-center justify-center font-mono font-bold text-lg md:text-2xl text-slate-800 ${isStriked ? 'line-through decoration-rose-500 decoration-2 text-slate-400' : ''}`}>
                        {char === ' ' ? '\u00A0' : char}
                    </div>
                )})}
            </div>
            
            {/* 3. Render Operator and 'B' Row */}
            <div className="flex items-center">
                <span className="text-sky-500 font-black mr-1 md:mr-2 text-xl">-</span>
                <GridRow value={b} padTo={maxLen} />
            </div>
            
            {/* 4. Divider & Answer */}
            <div className="w-full border-b-[3px] border-slate-800 my-1"></div>
            <GridRow value={answer} padTo={maxLen} textColor="text-emerald-600" />
        </div>
    );
};

const MultCarryRow = ({ carryArray, colorTheme }: { carryArray: string[], colorTheme: string }) => {
    // Defines distinct colors for each row of carries!
    const colorMap: any = {
        rose: 'text-rose-500 bg-rose-50 border-rose-200',
        sky: 'text-sky-500 bg-sky-50 border-sky-200',
        purple: 'text-purple-500 bg-purple-50 border-purple-200',
        amber: 'text-amber-500 bg-amber-50 border-amber-200'
    };
    const themeClass = colorMap[colorTheme] || colorMap.rose;

    return (
        <div className="flex w-full justify-end">
            {carryArray.map((char, i) => (
                <div key={i} className={`w-5 h-7 md:w-8 md:h-10 flex items-center justify-center font-mono font-bold text-lg md:text-2xl`}>
                    {char !== ' ' ? (
                        <div className={`flex items-center justify-center rounded-full text-[10px] md:text-sm h-4 w-4 md:h-6 md:w-6 border ${themeClass}`}>
                            {char}
                        </div>
                    ) : (
                        '\u00A0'
                    )}
                </div>
            ))}
        </div>
    );
};

const StepByStepMultiplication = ({ a, b, answer }: { a: number, b: number, answer: number }) => {
    const bStr = b.toString().split('').reverse();
    const aStr = a.toString();
    const maxLen = answer.toString().length;
    
    // 1. Generate Partial Products with Smart Zero Handling
    const partials = bStr.map((digit, idx) => {
        const bDigit = parseInt(digit);
        if (bDigit === 0) {
            // If multiplying by 0, output a zero for every digit in 'a', padded by placeholders ('x')
            return '0'.repeat(aStr.length) + 'x'.repeat(idx);
        }
        const val = a * bDigit;
        return val.toString() + 'x'.repeat(idx); 
    });

    // 2. Generate Cascading Carry Stacks
    const THEMES = ['rose', 'sky', 'purple', 'amber'];
    let carryStacks: { array: string[], color: string }[] = [];
    
    bStr.forEach((digit, idx) => {
        const bDigit = parseInt(digit);
        if (bDigit === 0) return; // No carries generated when multiplying by zero
        
        let carryArray = Array(maxLen).fill(' ');
        let carry = 0;
        let hasCarry = false;
        let aRev = aStr.split('').reverse();
        
        // Calculate carries from right to left
        for (let j = 0; j < aRev.length; j++) {
            let prod = parseInt(aRev[j]) * bDigit + carry;
            carry = Math.floor(prod / 10);
            if (carry > 0) {
                // Place the carry in the NEXT column to the left!
                carryArray[maxLen - 2 - j] = carry.toString();
                hasCarry = true;
            }
        }
        
        if (hasCarry) {
            carryStacks.push({
                array: carryArray,
                color: THEMES[idx % THEMES.length]
            });
        }
    });
    
    // Reverse the stacks so the carries for the LAST multiplier digit sit at the very top!
    carryStacks.reverse();

    return (
        <div className="flex flex-col items-end w-full">
            
            {/* 3. Render Colored Carry Stacks */}
            {carryStacks.map((stack, i) => (
                <MultCarryRow key={i} carryArray={stack.array} colorTheme={stack.color} />
            ))}
            
            {/* 4. Render Main Multiplication Block */}
            <GridRow value={a} padTo={maxLen} />
            <div className="flex items-center">
                <span className="text-sky-500 font-black mr-1 md:mr-2 text-xl">×</span>
                <GridRow value={b} padTo={maxLen} />
            </div>
            <div className="w-full border-b-[3px] border-slate-800 my-1"></div>
            
            {/* 5. Render Partial Products */}
            {partials.length > 1 && partials.map((p, i) => (
                <GridRow key={i} value={p} padTo={maxLen} textColor="text-slate-600" />
            ))}
            
            {/* 6. Render Final Answer */}
            {partials.length > 1 && <div className="w-full border-b-[3px] border-slate-800 my-1"></div>}
            <GridRow value={answer} padTo={maxLen} textColor="text-emerald-600" />
        </div>
    );
};

const StepByStepDivision = ({ a, b, answer, remainder }: { a: number, b: number, answer: number, remainder: number }) => {
    const dividendStr = a.toString();
    const maxLen = dividendStr.length;
    let current = 0;
    let steps: any[] = [];
    let quotientStr = '';
    let prevEndIdx = -1;

    // 1. Core Long Division Simulator
    for (let i = 0; i < dividendStr.length; i++) {
        current = current * 10 + parseInt(dividendStr[i]);
        
        if (current >= b || quotientStr.length > 0 || i === dividendStr.length - 1) {
            let qDigit = Math.floor(current / b);
            quotientStr += qDigit.toString();
            let subVal = qDigit * b;
            
            if (qDigit > 0 || i === dividendStr.length - 1) {
                let broughtDown = [];
                for (let j = prevEndIdx + 1; j <= i; j++) {
                    if (prevEndIdx !== -1) broughtDown.push(j);
                }

                steps.push({
                    stepDividend: current,
                    subVal: subVal,
                    endIdx: i,
                    broughtDown: broughtDown,
                    isFirst: steps.length === 0
                });
                
                current = current - subVal;
                prevEndIdx = i;
            }
        }
    }

    // 2. Alignment Formatters
    const makeExactStr = (val: number, endIdx: number) => {
        const str = val.toString();
        const rightSpaces = Math.max(0, maxLen - 1 - endIdx);
        const leftSpaces = Math.max(0, maxLen - str.length - rightSpaces);
        return ' '.repeat(leftSpaces) + str + ' '.repeat(rightSpaces);
    };

    const getPassingLines = (stepIdx: number) => {
        let lines: number[] = [];
        for (let i = stepIdx + 1; i < steps.length; i++) {
            lines.push(...steps[i].broughtDown);
        }
        return lines;
    };

    // 3. Dynamic Grid Row for Division (Handles Bright Drop Lines & Dynamic Minus Signs)
    const DivRow = ({ str, textColor = "text-slate-800", passingLines = [], minusPos = -1, isArrowRow = false, broughtDown = [] }: any) => {
        return (
            <div className="flex relative">
                {str.split('').map((char: string, c: number) => {
                    const hasMinus = c === minusPos;
                    const isPassing = passingLines.includes(c);
                    const isBrought = broughtDown.includes(c);
                    
                    let display = char === ' ' ? '\u00A0' : char;
                    let color = textColor;
                    
                    if (isArrowRow) {
                        if (isBrought) {
                            display = '↓';
                            color = 'text-sky-500 font-black'; // Bright Arrow
                        } else if (isPassing) {
                            display = '|';
                            color = 'text-sky-400 font-black'; // Bright Line
                        } else {
                            display = '\u00A0';
                        }
                    } else {
                        if (char === ' ' && isPassing) {
                            display = '|';
                            color = 'text-sky-400 font-black'; // Bright Line
                        }
                    }

                    return (
                        <div key={c} className={`relative w-5 h-7 md:w-8 md:h-10 flex items-center justify-center font-mono font-bold text-lg md:text-2xl ${color}`}>
                            {hasMinus && <span className="absolute right-[80%] md:right-[90%] text-sky-500 font-black text-sm md:text-lg">-</span>}
                            {display}
                        </div>
                    )
                })}
            </div>
        );
    };

    // 4. Dynamic Segmented Underline (Hugs the numbers tightly)
    const DivLine = ({ startIdx, endIdx }: any) => {
        return (
            <div className="flex w-full">
                {Array.from({ length: maxLen }).map((_, c) => {
                    const isActive = c >= startIdx && c <= endIdx;
                    return (
                        <div key={c} className={`w-5 md:w-8 h-[2px] md:h-[3px] ${isActive ? 'bg-slate-800' : 'bg-transparent'}`}></div>
                    );
                })}
            </div>
        );
    };

    // Invisible Spacer to mathematically guarantee perfect alignment across rows
    const LeftSpacer = () => (
        <>
            <div className="flex flex-col items-end mr-1 md:mr-2 opacity-0 pointer-events-none select-none">
                <GridRow value={b} padTo={b.toString().length} />
            </div>
            <div className="mr-1 md:mr-2 opacity-0 pointer-events-none select-none flex items-center h-7 md:h-10">
                <span className="font-light text-[26px] md:text-[34px] leading-none">)</span>
            </div>
        </>
    );

    return (
        <div className="flex flex-col items-start justify-start font-mono text-lg md:text-2xl font-bold w-fit mx-auto pt-2">
            
            {/* ROW 1: Quotient */}
            <div className="flex w-full">
                <LeftSpacer />
                <div className="mb-1 flex-1">
                    <DivRow str={makeExactStr(answer, maxLen - 1)} textColor="text-emerald-600" />
                </div>
            </div>

            {/* ROW 2: Divisor, Bracket, Dividend */}
            <div className="flex w-full">
                <div className="flex flex-col items-end mr-1 md:mr-2 border-t-[3px] border-transparent pt-1">
                    <GridRow value={b} padTo={b.toString().length} textColor="text-sky-600" />
                </div>
                <div className="mr-1 md:mr-2 flex items-center border-t-[3px] border-transparent pt-1 h-7 md:h-10">
                    <span className="font-light text-[26px] md:text-[34px] text-slate-800 leading-none">)</span>
                </div>
                <div className="border-t-[3px] border-slate-800 pt-1 flex-1">
                    <DivRow str={makeExactStr(a, maxLen - 1)} passingLines={getPassingLines(-1)} />
                </div>
            </div>

            {/* ROW 3+: Steps & Remainder */}
            <div className="flex w-full">
                <LeftSpacer />
                <div className="flex flex-col w-full flex-1">
                    {steps.map((step, idx) => {
                        const stepDivStr = makeExactStr(step.stepDividend, step.endIdx);
                        const subValStr = makeExactStr(step.subVal, step.endIdx);
                        const passingLines = getPassingLines(idx);
                        
                        // Minus position is exactly to the left of the first digit of the subVal
                        const subValLen = step.subVal.toString().length;
                        const rightSpaces = Math.max(0, maxLen - 1 - step.endIdx);
                        const minusPos = maxLen - rightSpaces - subValLen;
                        
                        // Dynamic horizontal line boundaries based strictly on number width
                        const startIdx = maxLen - rightSpaces - step.stepDividend.toString().length; 
                        const endIdx = maxLen - rightSpaces - 1;

                        return (
                            <div key={idx} className="flex flex-col w-full">
                                {/* Arrow Row with vertical tracing lines */}
                                {!step.isFirst && step.broughtDown.length > 0 && (
                                    <DivRow str={' '.repeat(maxLen)} isArrowRow={true} broughtDown={step.broughtDown} passingLines={getPassingLines(idx - 1)} />
                                )}

                                {/* New Sub-Dividend */}
                                {!step.isFirst && (
                                    <DivRow str={stepDivStr} textColor="text-slate-700" passingLines={passingLines} />
                                )}
                                
                                {/* Minus Operation */}
                                <DivRow str={subValStr} textColor="text-rose-600" passingLines={passingLines} minusPos={minusPos} />
                                
                                {/* Dynamic Segmented Line */}
                                <DivLine startIdx={startIdx} endIdx={endIdx} />
                            </div>
                        );
                    })}
                    
                    {/* Final Remainder */}
                    <DivRow str={makeExactStr(remainder, maxLen - 1)} textColor="text-emerald-600" />
                </div>
            </div>
            
        </div>
    );
};


// --- MAIN COMPONENT ---
export default function MathsPractice() {
    const [phase, setPhase] = useState<'config' | 'quiz'>('config');
    const [config, setConfig] = useState<Config>({
        format: 'numerical',
        operations: ['add_no_carry'], 
        digitsA: 2,
        digitsB: 2,
        questionCount: 10
    });
    const [language, setLanguage] = useState<Language>('en');
    const [problems, setProblems] = useState<Problem[]>([]);
    const [showAnswers, setShowAnswers] = useState(false);

    const toggleOperation = (op: Operation) => {
        setConfig(prev => {
            const has = prev.operations.includes(op);
            if (has && prev.operations.length === 1) return prev; 
            return {
                ...prev,
                operations: has ? prev.operations.filter(o => o !== op) : [...prev.operations, op]
            };
        });
    };

    // --- GENERATION ENGINE ---
    const generateProblems = (currentConfig: Config = config) => {
        const newProblems: Problem[] = [];
        const count = currentConfig.questionCount;
        const generatedSignatures = new Set<string>();

        while (newProblems.length < count) {
            let a = 0, b = 0, answer = 0, remainder = 0;
            let opSymbol = '';
            
            const op = currentConfig.operations[Math.floor(Math.random() * currentConfig.operations.length)];
            
            let attempts = 0;
            let isUnique = false;

            while (!isUnique && attempts < 50) {
                attempts++;
                const boundsA = getMinMax(currentConfig.digitsA);
                const boundsB = getMinMax(currentConfig.digitsB);

                if (op === 'add_no_carry') {
                    opSymbol = '+';
                    let aStr = '', bStr = '';
                    const maxD = Math.max(currentConfig.digitsA, currentConfig.digitsB);
                    for (let d = 0; d < maxD; d++) {
                        let aDigit = d < currentConfig.digitsA ? randomRange(d === 0 ? 1 : 0, 9) : 0;
                        let bDigit = d < currentConfig.digitsB ? randomRange(d === 0 ? 1 : 0, 9 - aDigit) : 0; 
                        aStr += aDigit;
                        bStr += bDigit;
                    }
                    a = parseInt(aStr);
                    b = parseInt(bStr);
                    answer = a + b;
                } 
                else if (op === 'add_carry') {
                    opSymbol = '+';
                    do {
                        a = randomRange(boundsA.min, boundsA.max);
                        b = randomRange(boundsB.min, boundsB.max);
                    } while (!hasCarry(a, b) && Math.max(currentConfig.digitsA, currentConfig.digitsB) > 1); 
                    answer = a + b;
                } 
                else if (op === 'sub_no_borrow') {
                    opSymbol = '-';
                    a = randomRange(boundsA.min, boundsA.max);
                    let aStr = a.toString();
                    let bStr = '';
                    for (let i = 0; i < aStr.length; i++) {
                        if (i >= aStr.length - currentConfig.digitsB) {
                           bStr += randomRange(0, parseInt(aStr[i]));
                        }
                    }
                    b = parseInt(bStr || '1');
                    answer = a - b;
                } 
                else if (op === 'sub_borrow') {
                    opSymbol = '-';
                    do {
                        a = randomRange(boundsA.min, boundsA.max);
                        b = randomRange(boundsB.min, Math.min(boundsB.max, a - 1));
                    } while (!hasBorrow(a, b) && Math.max(currentConfig.digitsA, currentConfig.digitsB) > 1);
                    answer = a - b;
                } 
                else if (op === 'multiply') {
                    opSymbol = '×';
                    a = randomRange(boundsA.min === 1 ? 2 : boundsA.min, boundsA.max); 
                    b = randomRange(boundsB.min === 1 ? 2 : boundsB.min, boundsB.max); 
                    answer = a * b;
                } 
                else if (op === 'divide') {
                    opSymbol = '÷';
                    a = randomRange(boundsA.min === 1 ? 2 : boundsA.min, boundsA.max);
                    b = randomRange(boundsB.min === 1 ? 2 : boundsB.min, Math.min(boundsB.max, a));
                    answer = Math.floor(a / b);
                    remainder = a % b;
                }

                const signature = `${a}_${opSymbol}_${b}`;
                if (!generatedSignatures.has(signature) || attempts >= 49) {
                    generatedSignatures.add(signature);
                    isUnique = true;
                }
            }

            let wordData: WordProblemData | undefined;
            if (currentConfig.format === 'word') {
                const name1 = NAMES[Math.floor(Math.random() * NAMES.length)];
                let name2 = NAMES[Math.floor(Math.random() * NAMES.length)];
                while (name2 === name1) name2 = NAMES[Math.floor(Math.random() * NAMES.length)];

                wordData = { name1, name2, itemIndex: Math.floor(Math.random() * DICTIONARY.en.length) };
            }

            newProblems.push({
                id: `prob-${Date.now()}-${newProblems.length}`,
                a, b, opSymbol, operation: op, answer,
                ...(opSymbol === '÷' && { remainder }), 
                wordData
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

    const getOpLabel = (op: Operation) => {
        switch(op) {
            case 'add_no_carry': return 'Add (No Carry)';
            case 'add_carry': return 'Add (With Carry)';
            case 'sub_no_borrow': return 'Sub (No Borrow)';
            case 'sub_borrow': return 'Sub (With Borrow)';
            case 'multiply': return 'Multiplication';
            case 'divide': return 'Division';
        }
    };

    return (
        <div className="w-full h-full font-sans select-none flex flex-col items-center overflow-y-auto relative bg-slate-50">

            {/* --- CONFIGURATION PHASE --- */}
            {phase === 'config' && (
                <div className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center p-4 md:p-6 space-y-4 animate-in fade-in zoom-in duration-300 my-auto overflow-y-auto">

                    <div className="text-center space-y-1 mb-2 mt-4 md:mt-0">
                        <div className="flex justify-center mb-2">
                            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                <Calculator size={36} />
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Practice Generator</h1>
                        <p className="text-sm md:text-base text-slate-500 font-medium">Select multiple parameters to instantly build a custom worksheet.</p>
                    </div>

                    <div className="w-full bg-white p-6 rounded-[2rem] shadow-sm border-2 border-slate-200 space-y-6">

                        {/* 1. Format */}
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">1. Select Format</h3>
                            <div className="flex gap-4">
                                <button onClick={() => setConfig({...config, format: 'numerical'})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-4 font-bold text-sm transition-all ${config.format === 'numerical' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                                    <Calculator size={18}/> Numerical Grid
                                </button>
                                <button onClick={() => setConfig({...config, format: 'word'})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-4 font-bold text-sm transition-all ${config.format === 'word' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                                    <FileText size={18}/> Word Problems
                                </button>
                            </div>
                        </div>

                        {/* 2. Multiple Operations */}
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">2. Arithmetic Operations (Select Multiple)</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(['add_no_carry', 'add_carry', 'sub_no_borrow', 'sub_borrow', 'multiply', 'divide'] as Operation[]).map(op => {
                                    const isSelected = config.operations.includes(op);
                                    return (
                                    <button key={op} onClick={() => toggleOperation(op)} className={`py-3 px-4 rounded-xl border-4 font-bold text-sm text-left transition-all flex items-center justify-between ${isSelected ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-sky-300'}`}>
                                        {getOpLabel(op)}
                                        {isSelected && <CheckCircle2 size={18} className="text-sky-500"/>}
                                    </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Independent Digits */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">3. Top Number Digits</h3>
                                <div className="flex gap-2">
                                    {([1, 2, 3, 4] as Digits[]).map(d => (
                                        <button key={d} onClick={() => setConfig({...config, digitsA: d})} className={`flex-1 py-2.5 rounded-lg border-4 font-black text-lg transition-all ${config.digitsA === d ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-200 text-slate-400 hover:border-rose-300'}`}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-2">Multiplicand / Dividend</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">4. Bottom Number Digits</h3>
                                <div className="flex gap-2">
                                    {([1, 2, 3, 4] as Digits[]).map(d => (
                                        <button key={d} onClick={() => setConfig({...config, digitsB: d})} className={`flex-1 py-2.5 rounded-lg border-4 font-black text-lg transition-all ${config.digitsB === d ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-300'}`}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-2">Multiplier / Divisor</p>
                            </div>
                        </div>

                        {/* 5. Question Count */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">5. Total Questions: <span className="text-indigo-500">{config.questionCount}</span></h3>
                            </div>
                            <input 
                                type="range" min="1" max="15" 
                                value={config.questionCount} 
                                onChange={(e) => setConfig({...config, questionCount: parseInt(e.target.value)})}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between text-xs font-bold text-slate-400 mt-2">
                                <span>1</span><span>15</span>
                            </div>
                        </div>

                    </div>

                    <button onClick={handleStart} className="w-full max-w-md bg-slate-800 hover:bg-slate-700 text-white font-black text-xl py-4 rounded-2xl shadow-[0_4px_0_rgb(15,23,42)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 mb-8">
                        <Settings size={20} /> GENERATE WORKSHEET
                    </button>
                </div>
            )}

            {/* --- QUIZ PHASE (WITH MATH GRID BACKGROUND) --- */}
            {phase === 'quiz' && (
                <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 animate-in slide-in-from-bottom-4 duration-500 relative bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] md:bg-[size:32px_32px]">

                    {/* Header */}
                    <div className="w-full flex items-center justify-between p-3 md:p-4 bg-white/95 backdrop-blur-md border-b-4 border-slate-200 sticky top-0 z-40 shadow-sm shrink-0">
                        <button onClick={() => setPhase('config')} className="text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-slate-200 hover:bg-indigo-50 transition-colors text-sm">
                            <Settings size={16} /> <span className="hidden sm:inline">Settings</span>
                        </button>

                        <div className="text-center">
                            <h2 className="text-base md:text-xl font-black text-slate-800 leading-tight">
                                Mixed Practice Worksheet
                            </h2>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{config.questionCount} Questions</p>
                        </div>

                        {/* Dynamic Language Selector */}
                        <div className="relative group">
                            <select 
                                value={language} 
                                onChange={(e) => setLanguage(e.target.value as Language)}
                                className="appearance-none bg-slate-100 border-2 border-slate-200 text-slate-700 font-bold text-xs md:text-sm py-2 pl-8 pr-8 rounded-lg outline-none focus:border-indigo-400 cursor-pointer"
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="fr">French</option>
                                <option value="es">Spanish</option>
                            </select>
                            <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>
                    </div>

                    {/* Problem Board (Scrollable Area) */}
                    <div className="w-full p-4 md:p-8 flex-1 overflow-y-auto">
                        {config.format === 'numerical' ? (
                            // NUMERICAL GRID WITH STEP-BY-STEP PROCEDURAL ANSWERS
                            <div className="flex flex-wrap justify-center gap-4 md:gap-8 w-full mx-auto pb-28">
                                {problems.map((p, i) => (
                                    <div key={p.id} className="flex flex-col items-center bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-[2rem] border-4 border-slate-200 shadow-md hover:border-indigo-300 transition-colors relative group min-h-[160px] md:min-h-[220px] w-auto min-w-[220px]">
                                        <div className="absolute top-[-10px] left-4 bg-indigo-500 text-white font-black px-3 py-1 rounded-full text-xs shadow-sm border-2 border-white">Q{i + 1}</div>

                                        <div className="w-full pt-4 h-full flex flex-col justify-end overflow-x-auto hide-scrollbar">
                                            {!showAnswers ? (
                                                <div className="flex flex-col items-end w-full">
                                                    {p.operation === 'divide' ? (
                                                        <div className="flex items-center text-xl md:text-2xl font-mono text-slate-800 font-bold">
                                                            <span className="text-sky-600 mr-2">{p.b}</span>
                                                            <div className="border-l-2 border-t-2 border-slate-800 pl-2 pt-1 tracking-widest">{p.a}</div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <GridRow value={p.a} padTo={Math.max(p.a.toString().length, p.b.toString().length)} />
                                                            <div className="flex items-center">
                                                                <span className="text-sky-500 font-black mr-2 text-xl">{p.opSymbol}</span>
                                                                <GridRow value={p.b} padTo={Math.max(p.a.toString().length, p.b.toString().length)} />
                                                            </div>
                                                            <div className="w-full border-b-[3px] border-slate-800 my-1"></div>
                                                            <div className="h-8 md:h-10 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded mt-1"></div>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-full animate-in fade-in zoom-in duration-300">
                                                    {p.operation.includes('add') && <StepByStepAddition a={p.a} b={p.b} answer={p.answer} />}
                                                    {p.operation.includes('sub') && <StepByStepSubtraction a={p.a} b={p.b} answer={p.answer} />}
                                                    {p.operation === 'multiply' && <StepByStepMultiplication a={p.a} b={p.b} answer={p.answer} />}
                                                    {p.operation === 'divide' && <StepByStepDivision a={p.a} b={p.b} answer={p.answer} remainder={p.remainder || 0} />}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // WORD PROBLEM LIST
                            <div className="flex flex-col gap-4 md:gap-6 w-full max-w-4xl mx-auto pb-28">
                                {problems.map((p, i) => (
                                    <div key={p.id} className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border-4 border-slate-200 shadow-md relative">
                                        <div className="absolute top-0 left-0 bg-indigo-500 text-white font-black px-4 py-1 rounded-br-xl rounded-tl-[1.8rem] text-sm shadow-sm">Q{i + 1}</div>

                                        <p className="text-lg md:text-2xl font-bold text-slate-700 leading-relaxed mt-4">
                                            {p.wordData && getWordProblemText(p.a, p.b, p.operation, p.wordData, language)}
                                        </p>

                                        <div className={`mt-4 transition-all duration-500 ${showAnswers ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-emerald-50 p-4 md:p-6 rounded-2xl border-4 border-emerald-100">
                                                <div className="bg-white px-4 py-2 rounded-xl border-2 border-slate-200 shadow-sm">
                                                    <span className="font-mono text-xl md:text-2xl font-black tracking-widest text-slate-600">{p.a} {p.opSymbol} {p.b}</span>
                                                </div>
                                                <div className="hidden md:block w-8 border-t-4 border-dashed border-emerald-200"></div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Answer:</span>
                                                    <span className="text-3xl md:text-4xl font-black text-emerald-600">
                                                        {p.operation === 'divide' ? `Q: ${p.answer}  Rem: ${p.remainder}` : p.answer}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sticky Bottom Controls */}
                    <div className="sticky bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t-4 border-slate-200 p-3 md:p-4 z-50 flex justify-center shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] mt-auto">
                        <div className="w-full max-w-4xl flex justify-between items-center gap-4">
                            <button 
                                onClick={handleNewQuestions}
                                className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 border-4 border-purple-200 font-black text-sm md:text-xl px-4 py-3 md:py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <RefreshCcw size={24} className="shrink-0" /> <span className="hidden sm:inline">Generate</span> New
                            </button>

                            <button 
                                onClick={() => setShowAnswers(!showAnswers)}
                                className={`flex-[2] font-black text-base md:text-2xl px-6 py-3 md:py-4 rounded-2xl border-[4px] flex items-center justify-center gap-3 transition-all active:scale-95
                                    ${showAnswers ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-lime-400 text-lime-950 border-lime-500 shadow-[0_6px_0_#84cc16] hover:translate-y-1 hover:shadow-none'}`}
                            >
                                {showAnswers ? <><EyeOff size={28} className="shrink-0"/> Hide Answers</> : <><Eye size={28} className="shrink-0"/> Show Procedure & Answers</>}
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}