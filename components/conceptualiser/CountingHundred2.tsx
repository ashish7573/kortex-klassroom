"use client";

import React, { useState, useEffect } from 'react';
import { Volume2, ChevronLeft, LayoutGrid, List, Sparkles, X } from 'lucide-react';

// --- Vocabulary Helper ---
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const numberToWords = (num: number) => {
    if (num === 100) return "One Hundred";
    if (num === 0) return "Zero";
    if (num < 20) return ONES[num];
    const tenDigit = Math.floor(num / 10);
    const oneDigit = num % 10;
    return `${TENS[tenDigit]}${oneDigit > 0 ? '-' + ONES[oneDigit] : ''}`;
};

// --- Data Structures ---
const CATEGORIES = [
    { id: 'tens', label: 'Counting in Tens', range: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], emoji: '📦', color: 'bg-purple-500' },
    { id: '1-10', label: '1 to 10', range: Array.from({length: 10}, (_, i) => i + 1), emoji: '🍎', color: 'bg-red-500' },
    { id: '11-20', label: '11 to 20', range: Array.from({length: 10}, (_, i) => i + 11), emoji: '🍊', color: 'bg-orange-500' },
    { id: '21-30', label: '21 to 30', range: Array.from({length: 10}, (_, i) => i + 21), emoji: '🚗', color: 'bg-sky-500' },
    { id: '31-40', label: '31 to 40', range: Array.from({length: 10}, (_, i) => i + 31), emoji: '⭐', color: 'bg-amber-400' },
    { id: '41-50', label: '41 to 50', range: Array.from({length: 10}, (_, i) => i + 41), emoji: '🍃', color: 'bg-emerald-500' },
    { id: '51-60', label: '51 to 60', range: Array.from({length: 10}, (_, i) => i + 51), emoji: '⚽', color: 'bg-blue-500' },
    { id: '61-70', label: '61 to 70', range: Array.from({length: 10}, (_, i) => i + 61), emoji: '🌸', color: 'bg-pink-500' },
    { id: '71-80', label: '71 to 80', range: Array.from({length: 10}, (_, i) => i + 71), emoji: '🦋', color: 'bg-indigo-400' },
    { id: '81-90', label: '81 to 90', range: Array.from({length: 10}, (_, i) => i + 81), emoji: '💎', color: 'bg-cyan-400' },
    { id: '91-100', label: '91 to 100', range: Array.from({length: 10}, (_, i) => i + 91), emoji: '👑', color: 'bg-amber-500' },
];

type AppPhase = 'menu' | 'category' | 'grid';
type HighlightState = 'tens' | 'ones' | 'all' | null;

// ============================================================================
// REUSABLE COMPONENTS (Moved OUTSIDE main component to prevent scroll-jumps!)
// ============================================================================
const VisualGroup = ({ num, emoji, isPlaying, highlight }: { num: number, emoji: string, isPlaying: boolean, highlight: HighlightState }) => {
    const tens = Math.floor(num / 10);
    const ones = num % 10;

    const isTensActive = isPlaying && (highlight === 'tens' || highlight === 'all');
    const isOnesActive = isPlaying && (highlight === 'ones' || highlight === 'all');
    const isDimmed = isPlaying && highlight !== null;

    return (
        <div className="flex flex-wrap gap-3 w-full">
            {/* Tens Groups */}
            {Array.from({length: tens}).map((_, i) => (
                <div key={`ten-${i}`} className={`relative bg-white rounded-lg border-2 border-slate-200 p-1 shadow-sm w-fit transition-all duration-300 ${isDimmed && !isTensActive ? 'opacity-30 scale-95 grayscale' : ''} ${isTensActive ? 'ring-4 ring-amber-400 scale-105' : ''}`}>
                    <div className="grid grid-cols-5 gap-0.5 bg-slate-50 p-1 rounded w-full">
                        {Array.from({length: 10}).map((_, j) => (
                            <div key={`item-${j}`} className="w-4 h-4 md:w-5 md:h-5 bg-white rounded-[2px] border border-slate-200 flex items-center justify-center shadow-inner">
                                <span className="text-[10px] md:text-xs">{emoji}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            
            {/* Loose Items */}
            {ones > 0 && (
                <div className={`flex flex-wrap gap-1 items-center bg-white/50 rounded-lg p-2 transition-all duration-300 ${isDimmed && !isOnesActive ? 'opacity-30 scale-95 grayscale' : ''} ${isOnesActive ? 'ring-4 ring-sky-400 bg-white scale-105' : ''}`}>
                    {Array.from({length: ones}).map((_, i) => (
                        <div key={`loose-${i}`} className="w-5 h-5 md:w-6 md:h-6 bg-white rounded-[4px] border-2 border-slate-200 flex items-center justify-center shadow-sm">
                            <span className="text-[12px] md:text-sm drop-shadow-sm">{emoji}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const NumberCard = ({ num, emoji, playingId, highlightState, onPlay }: { num: number, emoji: string, playingId: number | null, highlightState: HighlightState, onPlay: (num: number) => void }) => {
    const isThisPlaying = playingId === num;
    return (
        <div className={`bg-white rounded-2xl md:rounded-[2rem] border-4 border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${isThisPlaying ? 'border-sky-300 shadow-xl scale-[1.02]' : 'hover:border-slate-300'}`}>
            {/* Visual Area */}
            <div className="p-4 md:p-6 bg-slate-50 flex-1 min-h-[140px] flex items-center border-b-2 border-slate-100">
                <VisualGroup num={num} emoji={emoji} isPlaying={isThisPlaying} highlight={highlightState} />
            </div>
            
            {/* Text & Control Area */}
            <div className="p-4 md:p-5 flex items-center justify-between gap-4 bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-4xl md:text-5xl font-black text-sky-500 w-16">{num}</span>
                    <div className="flex flex-col">
                        <span className="text-sm md:text-lg font-black text-slate-700 uppercase tracking-wide leading-tight">{numberToWords(num)}</span>
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 mt-1">
                            {Math.floor(num/10)} Tens, {num%10} Ones
                        </span>
                    </div>
                </div>
                <button 
                    onClick={() => onPlay(num)}
                    disabled={playingId !== null && playingId !== num}
                    className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full flex items-center justify-center transition-all shadow-md ${isThisPlaying ? 'bg-amber-400 text-amber-900 animate-pulse' : 'bg-sky-500 text-white hover:bg-sky-400 active:scale-95 disabled:opacity-50 disabled:bg-slate-300'}`}
                >
                    <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            </div>
        </div>
    );
};


// ============================================================================
// MAIN APPLICATION
// ============================================================================
export default function CountingHundred2({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<AppPhase>('menu');
    const [activeCategory, setActiveCategory] = useState<any>(null);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [highlightState, setHighlightState] = useState<HighlightState>(null);
    const [selectedGridNumber, setSelectedGridNumber] = useState<number | null>(null);

    // --- Audio Promisification ---
    const speakPromise = (text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
                resolve(); return;
            }
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-IN';
            utterance.rate = 0.9;
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    };

    // Refactored to handle edge cases intelligently!
    const playExplanationSequence = async (num: number) => {
        if (playingId !== null) return; 
        setPlayingId(num);
        
        const tens = Math.floor(num / 10);
        const ones = num % 10;

        if (tens === 0) {
            // Case 1: Numbers under 10 (e.g. 5)
            setHighlightState('ones');
            await speakPromise(`${ones} loose item${ones > 1 ? 's' : ''}, makes a total of ${numberToWords(num)}!`);
        } 
        else if (ones === 0) {
            // Case 2: Exact Tens (e.g. 40)
            setHighlightState('tens');
            await speakPromise(`${tens} group${tens > 1 ? 's' : ''} of ten, makes a total of ${numberToWords(num)}!`);
        } 
        else {
            // Case 3: Mixed numbers (e.g. 45)
            setHighlightState('tens');
            await speakPromise(`${tens} group${tens > 1 ? 's' : ''} of ten makes ${tens * 10}.`);
            
            setHighlightState('ones');
            await speakPromise(`and ${ones} loose item${ones > 1 ? 's' : ''}.`);

            setHighlightState('all');
            await speakPromise(`makes a total of ${numberToWords(num)}!`);
        }
        
        setHighlightState(null);
        setPlayingId(null);
    };

    // Clean up audio on unmount or phase change
    useEffect(() => {
        return () => { if (typeof window !== 'undefined') window.speechSynthesis.cancel(); };
    }, [phase]);


    // ============================================================================
    // RENDER: PHASE 1 - MENU
    // ============================================================================
    if (phase === 'menu') {
        return (
            <div className="w-full h-full flex flex-col bg-sky-50 font-sans md:rounded-3xl overflow-hidden p-4 md:p-8">
                <div className="max-w-5xl mx-auto w-full flex flex-col h-full gap-6">
                    
                    <div className="text-center space-y-2 shrink-0">
                        <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-600 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-2 border border-sky-200 shadow-sm">
                            <List size={16} /> Number Visualizer
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">Explore Numbers 1 to 100</h1>
                        <p className="text-slate-500 font-medium md:text-lg">Select a category to see how big numbers are built using groups of ten.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto hide-scrollbar pb-10">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                            {CATEGORIES.map((cat) => (
                                <button 
                                    key={cat.id}
                                    onClick={() => { setActiveCategory(cat); setPhase('category'); }}
                                    className={`relative overflow-hidden bg-white rounded-[1.5rem] border-4 border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all active:scale-95 group flex flex-col items-center justify-center p-6 gap-3 min-h-[140px]`}
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 ${cat.color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-150`}></div>
                                    <span className="text-4xl md:text-5xl drop-shadow-md group-hover:scale-110 transition-transform">{cat.emoji}</span>
                                    <span className="font-black text-slate-700 text-sm md:text-base uppercase tracking-wider">{cat.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 border-t-4 border-slate-200 pt-8">
                            <button 
                                onClick={() => setPhase('grid')}
                                className="w-full bg-slate-800 text-white rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl hover:bg-slate-700 transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                        <LayoutGrid size={32} className="text-sky-400" />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">The 1-100 Master Grid</h3>
                                        <p className="text-slate-400 font-bold mt-1 text-sm md:text-base">View the entire number system at once.</p>
                                    </div>
                                </div>
                                <div className="bg-sky-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm md:text-base shadow-lg shrink-0">
                                    Open Grid
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PHASE 2 - CATEGORY VIEW (List of 10)
    // ============================================================================
    if (phase === 'category' && activeCategory) {
        return (
            <div className="w-full h-full flex flex-col bg-slate-100 font-sans md:rounded-3xl overflow-hidden relative">
                
                {/* Header */}
                <div className="bg-white shrink-0 p-4 md:p-6 border-b-4 border-slate-200 flex items-center justify-between shadow-sm z-10">
                    <button 
                        onClick={() => { window.speechSynthesis.cancel(); setPhase('menu'); }}
                        className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm md:text-base"
                    >
                        <ChevronLeft size={18} /> Back to Menu
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{activeCategory.emoji}</span>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">{activeCategory.label}</h2>
                    </div>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pb-20">
                        {activeCategory.range.map((num: number) => (
                            <NumberCard 
                                key={num} 
                                num={num} 
                                emoji={activeCategory.emoji} 
                                playingId={playingId}
                                highlightState={highlightState}
                                onPlay={playExplanationSequence}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PHASE 3 - THE 1-100 MASTER GRID
    // ============================================================================
    if (phase === 'grid') {
        return (
            <div className="w-full h-full flex flex-col bg-sky-50 font-sans md:rounded-3xl overflow-hidden relative">
                
                {/* Header */}
                <div className="bg-white shrink-0 p-4 md:p-6 border-b-4 border-slate-200 flex items-center justify-between shadow-sm z-10">
                    <button 
                        onClick={() => { window.speechSynthesis.cancel(); setSelectedGridNumber(null); setPhase('menu'); }}
                        className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors text-sm md:text-base"
                    >
                        <ChevronLeft size={18} /> Back
                    </button>
                    <div className="flex items-center gap-2">
                        <LayoutGrid size={24} className="text-sky-500" />
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Master Grid</h2>
                    </div>
                </div>

                {/* 10x10 Master Grid - NOW IN COLUMNS */}
                <div className="flex-1 overflow-y-auto p-2 md:p-6 flex items-center justify-center">
                    <div 
                        className="w-full max-w-4xl aspect-square max-h-full grid grid-cols-10 gap-1 md:gap-2 p-2 md:p-4 bg-white rounded-2xl md:rounded-[2rem] border-4 border-slate-200 shadow-xl"
                        style={{ gridTemplateRows: 'repeat(10, minmax(0, 1fr))', gridAutoFlow: 'column' }}
                    >
                        {Array.from({length: 100}, (_, i) => i + 1).map((num) => {
                            // Alternate colors based on the column index!
                            const colIndex = Math.floor((num - 1) / 10);
                            const isEvenCol = colIndex % 2 === 0;
                            
                            const bgClass = isEvenCol 
                                ? 'bg-sky-50 border-sky-100 text-sky-700 hover:bg-sky-200 hover:border-sky-300 hover:text-sky-800' 
                                : 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-200 hover:border-amber-300 hover:text-amber-800';

                            return (
                                <button
                                    key={num}
                                    onClick={() => setSelectedGridNumber(num)}
                                    className={`w-full h-full flex items-center justify-center rounded md:rounded-lg border-2 font-black transition-all text-[10px] sm:text-xs md:text-lg lg:text-xl active:scale-95 ${bgClass}`}
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Grid Overlay Modal */}
                {selectedGridNumber !== null && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="w-full max-w-2xl relative">
                            <button 
                                onClick={() => { window.speechSynthesis.cancel(); setSelectedGridNumber(null); setPlayingId(null); }}
                                className="absolute -top-12 right-0 md:-right-12 w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-200 transition-colors z-50 shadow-lg"
                            >
                                <X size={24} />
                            </button>
                            <NumberCard 
                                num={selectedGridNumber} 
                                emoji="🌟" 
                                playingId={playingId}
                                highlightState={highlightState}
                                onPlay={playExplanationSequence}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}