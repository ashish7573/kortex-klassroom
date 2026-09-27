"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Sparkles, CheckCircle2, ArrowRight, RotateCcw, Shuffle, X } from 'lucide-react';

type Phase = 'setup' | 'build_blocks' | 'multiply_blocks' | 'combine_blocks' | 'partial_products' | 'standard_algo' | 'done';

interface Block { id: string; val: number; x: number; y: number; }

export default function LongMultiplicationIntro({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<Phase>('setup');
    const [mounted, setMounted] = useState(false);
    
    // Math State
    const [numTop, setNumTop] = useState(0); 
    const [numBot, setNumBot] = useState(0); 
    
    // Visual State
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [multiplierCount, setMultiplierCount] = useState(1);
    
    // Input State
    const [inputPartialO, setInputPartialO] = useState('');
    const [inputPartialT, setInputPartialT] = useState('');
    const [inputPartialSum, setInputPartialSum] = useState('');
    const [inputCarry, setInputCarry] = useState('');
    const [inputFinalO, setInputFinalO] = useState('');
    const [inputFinalT, setInputFinalT] = useState('');
    const [inputFinalH, setInputFinalH] = useState('');

    useEffect(() => { setMounted(true); initProblem(); }, []);

    // Auto-advance out of combination phase if no 10s exist
    useEffect(() => {
        if (phase === 'combine_blocks') {
            const onesCount = blocks.filter(b => b.val === 1).length;
            const tensCount = blocks.filter(b => b.val === 10).length;
            if (onesCount < 10 && tensCount < 10) {
                setTimeout(() => setPhase('partial_products'), 800);
            }
        }
    }, [blocks, phase]);

    // --- Audio Engine ---
    const audioCtxRef = useRef<AudioContext | null>(null);
    const playSound = (type: 'pop' | 'kaching' | 'error' | 'click' | 'whoosh' | 'magic' | 'combine') => {
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
            else if (type === 'magic') { osc.type = 'sine'; osc.frequency.setValueAtTime(700, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.4); gain.gain.setValueAtTime(0.15, ctx.currentTime); }
            else if (type === 'combine') { osc.type = 'square'; osc.frequency.setValueAtTime(300, ctx.currentTime); osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3); gain.gain.setValueAtTime(0.1, ctx.currentTime); }
            
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + (type === 'kaching' || type === 'combine' ? 0.4 : 0.2));
        } catch(e) {}
    };

    const initProblem = () => {
        playSound('whoosh');
        let t = Math.floor(Math.random() * 8) + 2; 
        let o = Math.floor(Math.random() * 6) + 4; 
        let b = Math.floor(Math.random() * 6) + 4; 
        
        setNumTop((t * 10) + o);
        setNumBot(b);
        setBlocks([]);
        setMultiplierCount(1);
        setInputPartialO(''); setInputPartialT(''); setInputPartialSum('');
        setInputCarry(''); setInputFinalO(''); setInputFinalT(''); setInputFinalH('');
        setPhase('build_blocks');
    };

    const handleAddBlock = (val: number) => {
        playSound('pop');
        setBlocks(prev => [...prev, { id: Math.random().toString(), val, x: 0, y: 0 }]);
        
        const currentSum = blocks.reduce((acc, b) => acc + b.val, 0) + val;
        if (currentSum === numTop) {
            playSound('kaching');
            setTimeout(() => setPhase('multiply_blocks'), 500);
        }
    };

    const handleMultiplyBlocks = () => {
        if (multiplierCount < numBot) {
            playSound('magic');
            let tensNeeded = Math.floor(numTop/10);
            let onesNeeded = numTop%10;
            
            let newBlocks: Block[] = [];
            for(let i=0; i<tensNeeded; i++) newBlocks.push({ id: Math.random().toString(), val: 10, x:0, y:0 });
            for(let i=0; i<onesNeeded; i++) newBlocks.push({ id: Math.random().toString(), val: 1, x:0, y:0 });

            setBlocks(prev => [...prev, ...newBlocks]);
            setMultiplierCount(prev => prev + 1);
        }
    };

    const triggerCombinePhase = () => {
        playSound('click');
        setPhase('combine_blocks');
    };

    const handleTapCombine = (type: 1 | 10) => {
        playSound('combine');
        let toRemove = 10;
        const remainingBlocks = blocks.filter(b => {
            if (b.val === type && toRemove > 0) {
                toRemove--;
                return false;
            }
            return true;
        });
        remainingBlocks.push({ id: Math.random().toString(), val: type === 1 ? 10 : 100, x: 0, y: 0 });
        setBlocks(remainingBlocks);
    };

    const checkPartialProducts = () => {
        const topO = numTop % 10;
        const topT = Math.floor(numTop / 10) * 10;
        
        const isOCorrect = parseInt(inputPartialO) === topO * numBot;
        const isTCorrect = parseInt(inputPartialT) === topT * numBot;
        const isSumCorrect = parseInt(inputPartialSum) === (numTop * numBot);

        if (isOCorrect && isTCorrect && isSumCorrect) {
            playSound('kaching');
            setPhase('standard_algo');
        } else {
            playSound('error');
        }
    };

    const checkStandardAlgo = () => {
        const topO = numTop % 10;
        const carryVal = Math.floor((topO * numBot) / 10);
        const finalAns = numTop * numBot;

        const isCarryCorrect = inputCarry === '' ? carryVal === 0 : parseInt(inputCarry) === carryVal;
        const finalStr = finalAns.toString().padStart(3, '0');
        
        const isFinalOCorrect = inputFinalO === finalStr[2];
        const isFinalTCorrect = inputFinalT === finalStr[1];
        const isFinalHCorrect = inputFinalH === '' ? finalStr[0] === '0' : inputFinalH === finalStr[0];

        if (isCarryCorrect && isFinalOCorrect && isFinalTCorrect && isFinalHCorrect) {
            playSound('kaching');
            setPhase('done');
        } else {
            playSound('error');
        }
    };

    if (!mounted) return null;

    // Separate blocks for rendering
    const hunds = blocks.filter(b => b.val === 100);
    const tens = blocks.filter(b => b.val === 10);
    const ones = blocks.filter(b => b.val === 1);

    return (
        <div className="w-full h-full min-h-[600px] flex flex-col bg-slate-950 font-sans md:rounded-3xl p-2 md:p-4 relative overflow-y-auto overflow-x-hidden text-white">
            
            {/* TOP BAR: Problem & Dispensers */}
            <div className="shrink-0 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 shadow-md z-10 relative">
                
                {/* Center: The Problem (Moved to top order on mobile) */}
                <div className="flex-[1.5] flex justify-center items-center gap-4 w-full order-1 md:order-2">
                    <div className="bg-sky-500/20 border-2 border-sky-500 px-6 py-2 rounded-xl flex items-center gap-4">
                        <span className="text-4xl md:text-5xl font-black tracking-widest text-sky-400">{numTop} × {numBot}</span>
                    </div>
                    <button 
                        onClick={initProblem} 
                        className="bg-slate-800 p-3 rounded-full hover:bg-sky-500 hover:text-white text-slate-400 transition-colors shadow-md shrink-0"
                        title="New Question"
                    >
                        <Shuffle size={24} />
                    </button>
                </div>

                {/* Left: Dispensers (Moved to bottom order on mobile, bigger touch targets) */}
                <div className="flex-1 flex justify-center md:justify-start w-full order-2 md:order-1">
                    <div className="flex gap-4 md:gap-2 items-center bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <button 
                            onClick={() => handleAddBlock(100)} disabled={phase !== 'build_blocks'}
                            className="w-16 h-16 md:w-12 md:h-12 bg-pink-500 rounded-lg md:rounded-sm shadow-md flex items-center justify-center font-black text-white text-sm md:text-xs disabled:opacity-30 transition-transform active:scale-95"
                        >100</button>
                        <button 
                            onClick={() => handleAddBlock(10)} disabled={phase !== 'build_blocks'}
                            className="w-8 h-16 md:w-5 md:h-12 bg-emerald-500 rounded-md md:rounded-sm shadow-md flex items-center justify-center font-black text-white text-[10px] md:text-[8px] disabled:opacity-30 transition-transform active:scale-95"
                        >10</button>
                        <button 
                            onClick={() => handleAddBlock(1)} disabled={phase !== 'build_blocks'}
                            className="w-10 h-10 md:w-5 md:h-5 bg-sky-500 rounded-md md:rounded-sm shadow-md flex items-center justify-center font-black text-white text-[10px] md:text-[8px] disabled:opacity-30 transition-transform active:scale-95"
                        >1</button>
                    </div>
                </div>

                {/* Right: Spacer for balance */}
                <div className="flex-1 hidden md:block order-3"></div>
            </div>

            {/* MAIN WORKSPACE (3 Columns) */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 mt-4 min-h-0 md:overflow-hidden">
                
                {/* COL 1: Visual Sandbox */}
                <div className={`flex-[1.2] flex flex-col min-h-[350px] md:min-h-0 bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 relative overflow-hidden transition-all ${phase === 'build_blocks' || phase === 'multiply_blocks' || phase === 'combine_blocks' ? 'ring-2 ring-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.3)] z-10' : 'opacity-80'}`}>
                    <span className="absolute top-2 left-3 text-[10px] font-black uppercase tracking-widest text-slate-500 z-10">Visual Blocks</span>
                    
                    {phase === 'build_blocks' && blocks.length > 0 && (
                        <button 
                            onClick={() => { playSound('pop'); setBlocks([]); }} 
                            className="absolute top-2 right-2 text-rose-500 hover:text-rose-400 p-1 z-10 bg-slate-800 rounded-full"
                        >
                            <X size={20} />
                        </button>
                    )}
                    
                    {/* Blocks Canvas */}
                    <div className="flex-1 flex flex-col gap-4 mt-4 overflow-y-auto pt-2">
                        {/* Hundreds */}
                        <div className="flex flex-wrap gap-1">
                            {hunds.map((b, i) => (
                                <div key={i} className="w-10 h-10 md:w-12 md:h-12 bg-pink-500 flex items-center justify-center font-black text-white text-[10px] shadow-sm animate-fade-in-up">100</div>
                            ))}
                        </div>
                        {/* Tens */}
                        <div className="flex flex-wrap gap-1">
                            {phase === 'combine_blocks' && tens.length >= 10 ? (
                                <>
                                    {/* The glowing grouped tens */}
                                    <div onClick={() => handleTapCombine(10)} className="p-1 border-2 border-dashed border-emerald-400 bg-emerald-400/20 animate-pulse cursor-pointer rounded-lg flex flex-wrap gap-1 hover:bg-emerald-400/40 transition-colors">
                                        {tens.slice(0, 10).map((b, i) => <div key={i} className="w-3 h-10 md:w-4 md:h-12 bg-emerald-500 flex items-center justify-center font-black text-white text-[8px] shadow-sm">10</div>)}
                                    </div>
                                    {/* The rest of the tens */}
                                    {tens.slice(10).map((b, i) => <div key={i} className="w-3 h-10 md:w-4 md:h-12 bg-emerald-500 flex items-center justify-center font-black text-white text-[8px] shadow-sm animate-fade-in-up">10</div>)}
                                </>
                            ) : (
                                tens.map((b, i) => <div key={i} className="w-3 h-10 md:w-4 md:h-12 bg-emerald-500 flex items-center justify-center font-black text-white text-[8px] shadow-sm animate-fade-in-up">10</div>)
                            )}
                        </div>
                        {/* Ones */}
                        <div className="flex flex-wrap gap-1">
                            {phase === 'combine_blocks' && ones.length >= 10 ? (
                                <>
                                    {/* The glowing grouped ones */}
                                    <div onClick={() => handleTapCombine(1)} className="p-1 border-2 border-dashed border-sky-400 bg-sky-400/20 animate-pulse cursor-pointer rounded-lg flex flex-wrap gap-1 hover:bg-sky-400/40 transition-colors">
                                        {ones.slice(0, 10).map((b, i) => <div key={i} className="w-3 h-3 md:w-4 md:h-4 bg-sky-500 flex items-center justify-center font-black text-white text-[6px] shadow-sm">1</div>)}
                                    </div>
                                    {/* The rest of the ones */}
                                    {ones.slice(10).map((b, i) => <div key={i} className="w-3 h-3 md:w-4 md:h-4 bg-sky-500 flex items-center justify-center font-black text-white text-[6px] shadow-sm animate-fade-in-up">1</div>)}
                                </>
                            ) : (
                                ones.map((b, i) => <div key={i} className="w-3 h-3 md:w-4 md:h-4 bg-sky-500 flex items-center justify-center font-black text-white text-[6px] shadow-sm animate-fade-in-up">1</div>)
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex gap-2 mt-2">
                        {multiplierCount < numBot ? (
                            <button 
                                onClick={handleMultiplyBlocks} 
                                disabled={phase !== 'multiply_blocks'}
                                className="w-full bg-amber-500 text-slate-950 font-black py-3 rounded-xl disabled:opacity-30 disabled:bg-slate-700 disabled:text-slate-500 transition-all active:scale-95 shadow-md"
                            >
                                × {multiplierCount} (Tap to {numBot})
                            </button>
                        ) : (
                            <button 
                                onClick={triggerCombinePhase} 
                                disabled={phase !== 'multiply_blocks'}
                                className="w-full bg-fuchsia-500 text-white font-black py-3 rounded-xl disabled:opacity-30 disabled:bg-slate-700 disabled:text-slate-500 transition-all active:scale-95 shadow-md"
                            >
                                Combine Ones and Tens
                            </button>
                        )}
                    </div>
                </div>

                {/* COL 2: Partial Products (Vertical Stack) */}
                <div className={`flex-1 flex flex-col min-h-[420px] md:min-h-0 h-auto bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 items-center relative transition-all ${phase === 'partial_products' ? 'ring-2 ring-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.3)] z-10' : 'opacity-60 pointer-events-none'}`}>
                    <span className="absolute top-2 left-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Break it Apart</span>
                    
                    <div className="flex-1 flex flex-col justify-center items-center w-full mt-6">
                        <div className="font-mono text-3xl md:text-4xl text-slate-300 flex flex-col items-end w-[200px]">
                            
                            <div className="tracking-widest pr-2">{numTop}</div>
                            <div className="tracking-widest pr-2 pb-2 w-full flex justify-between border-b-4 border-slate-600 mb-4">
                                <span className="text-slate-500">×</span>
                                <span>{numBot}</span>
                            </div>
                            
                            {/* Ones Product */}
                            <div className="flex items-center gap-4 mb-2 w-full">
                                <span className="text-sm font-sans font-bold text-slate-500 shrink-0">({numTop % 10}×{numBot})</span>
                                <input 
                                    type="text" inputMode="numeric" maxLength={4}
                                    value={inputPartialO} onChange={e => { playSound('click'); setInputPartialO(e.target.value.replace(/[^0-9]/g, '')); }}
                                    className="w-full h-12 text-right px-2 font-black text-2xl rounded-lg border-2 border-slate-500 bg-slate-800 text-sky-400 focus:border-sky-400 outline-none"
                                />
                            </div>

                            {/* Tens Product */}
                            <div className="flex items-center gap-4 mb-4 w-full">
                                <span className="text-sm font-sans font-bold text-slate-500 shrink-0">({Math.floor(numTop/10)*10}×{numBot})</span>
                                <input 
                                    type="text" inputMode="numeric" maxLength={4}
                                    value={inputPartialT} onChange={e => { playSound('click'); setInputPartialT(e.target.value.replace(/[^0-9]/g, '')); }}
                                    className="w-full h-12 text-right px-2 font-black text-2xl rounded-lg border-2 border-slate-500 bg-slate-800 text-sky-400 focus:border-sky-400 outline-none"
                                />
                            </div>

                            {/* Total Line */}
                            <div className="flex items-center gap-4 w-full pt-4 border-t-4 border-slate-600">
                                <span className="text-xl font-black text-slate-500 shrink-0">+</span>
                                <input 
                                    type="text" inputMode="numeric" maxLength={4}
                                    value={inputPartialSum} onChange={e => { playSound('click'); setInputPartialSum(e.target.value.replace(/[^0-9]/g, '')); }}
                                    className="w-full h-12 text-right px-2 font-black text-3xl rounded-lg border-2 border-slate-500 bg-slate-800 text-amber-400 focus:border-amber-400 outline-none"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={checkPartialProducts}
                            className="w-full max-w-[200px] mt-6 bg-sky-500 text-white font-black py-3 rounded-xl shadow-[0_4px_0_rgb(14,165,233)] active:translate-y-[4px] transition-all"
                        >
                            Check
                        </button>
                    </div>
                </div>

                {/* COL 3: Standard Algorithm */}
                <div className={`flex-[1.2] flex flex-col min-h-[400px] md:min-h-0 h-auto bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 items-center relative transition-all ${phase === 'standard_algo' || phase === 'done' ? 'ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] z-10' : 'opacity-60 pointer-events-none'}`}>
                    <span className="absolute top-2 left-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Standard Way</span>
                    
                    <div className="flex-1 flex flex-col justify-center items-center w-full mt-6">
                        <div className="font-mono text-4xl font-black text-slate-300 w-[180px]">
                            
                            {/* Carry Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                <div></div>
                                <div className="flex justify-center items-center">
                                    <input 
                                        type="text" maxLength={1} value={inputCarry} onChange={e => setInputCarry(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 text-center font-black text-xl outline-none"
                                        placeholder="+"
                                    />
                                </div>
                                <div></div>
                            </div>

                            {/* Problem Grid */}
                            <div className="grid grid-cols-3 gap-2 text-center pb-2 mb-4 border-b-4 border-slate-600">
                                <div></div>
                                <div>{Math.floor(numTop/10)}</div>
                                <div className={inputPartialO !== '' ? 'text-sky-400' : ''}>{numTop % 10}</div>
                                
                                <div className="text-slate-600 text-left pl-2">×</div>
                                <div></div>
                                <div className={inputPartialO !== '' ? 'text-sky-400' : ''}>{numBot}</div>
                            </div>

                            {/* Answer Grid */}
                            <div className="grid grid-cols-3 gap-2">
                                <input 
                                    type="text" maxLength={1} value={inputFinalH} onChange={e => { playSound('click'); setInputFinalH(e.target.value.replace(/[^0-9]/g, '')); }}
                                    className="w-full h-14 text-center rounded-lg border-2 border-slate-500 bg-slate-800 text-emerald-400 focus:border-emerald-400 outline-none"
                                />
                                <input 
                                    type="text" maxLength={1} value={inputFinalT} onChange={e => { playSound('click'); setInputFinalT(e.target.value.replace(/[^0-9]/g, '')); }}
                                    className="w-full h-14 text-center rounded-lg border-2 border-slate-500 bg-slate-800 text-emerald-400 focus:border-emerald-400 outline-none"
                                />
                                <input 
                                    type="text" maxLength={1} value={inputFinalO} onChange={e => { playSound('click'); setInputFinalO(e.target.value.replace(/[^0-9]/g, '')); }}
                                    className="w-full h-14 text-center rounded-lg border-2 border-slate-500 bg-slate-800 text-emerald-400 focus:border-emerald-400 outline-none"
                                />
                            </div>
                        </div>

                        {phase === 'standard_algo' && (
                            <button 
                                onClick={checkStandardAlgo}
                                className="w-full max-w-[180px] mt-8 bg-emerald-500 text-white font-black py-3 rounded-xl shadow-[0_4px_0_rgb(16,185,129)] active:translate-y-[4px] active:shadow-none transition-all"
                            >
                                Verify Final
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* DONE OVERLAY (Non-Intrusive) */}
            {phase === 'done' && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
                    <button 
                        onClick={initProblem}
                        className="bg-sky-500 text-white px-8 py-4 rounded-full font-black text-xl tracking-wide shadow-[0_6px_0_rgb(14,165,233)] active:translate-y-[6px] active:shadow-none transition-all flex items-center justify-center gap-3 border-4 border-slate-900"
                    >
                        <Shuffle /> Next Problem
                    </button>
                </div>
            )}
        </div>
    );
}