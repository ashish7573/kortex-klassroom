"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, PackageCheck, RotateCcw, ArrowRight, Play, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';

// --- TYPES & INTERFACES ---
type Phase = 'start' | 'playing' | 'done';

export default function AppleOrderQuiz({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<Phase>('start');
    const [orders, setOrders] = useState<number[]>([]);
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
    
    // Delivery Table State
    const [tableBoxes, setTableBoxes] = useState(0);
    const [tableApples, setTableApples] = useState(0);
    
    // Feedback State
    const [feedback, setFeedback] = useState<{ status: 'success' | 'error' | null, message: string }>({ status: null, message: '' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // --- AUDIO ENGINE ---
    const audioCtx = useRef<AudioContext | null>(null);

    const initAudio = () => {
        if (typeof window === 'undefined') return;
        if (!audioCtx.current) {
            const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (WinAudioContext) audioCtx.current = new WinAudioContext();
        }
        if (audioCtx.current && audioCtx.current.state === 'suspended') audioCtx.current.resume();
    };

    const playSound = (type: 'boing' | 'error' | 'success' | 'pop' | 'click' | 'kaching') => {
        if (!audioCtx.current) return;
        const ctx = audioCtx.current;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        
        if (type === 'boing' || type === 'pop' || type === 'click') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
        } else if (type === 'success' || type === 'kaching') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
        }
    };

    const speak = (text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const msg = new SpeechSynthesisUtterance(text);
            msg.rate = 0.9; msg.pitch = 1.1; window.speechSynthesis.speak(msg);
        }
    };

    // --- GAME LOGIC ---
    const generateOrders = () => {
        initAudio();
        playSound('pop');
        
        // Generate 10 random orders between 11 and 20
        const pool = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        // Shuffle
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        setOrders(pool.slice(0, 10));
        setCurrentOrderIndex(0);
        setTableBoxes(0);
        setTableApples(0);
        setFeedback({ status: null, message: '' });
        setPhase('playing');
        
        speak(`Order number 1. Please pack ${pool[0]} apples.`);
    };

    const handleAddBox = () => {
        if (tableBoxes < 2) {
            playSound('pop');
            setTableBoxes(prev => prev + 1);
            setFeedback({ status: null, message: '' });
        } else { playSound('error'); }
    };

    const handleAddApple = () => {
        if (tableApples < 20) {
            playSound('click');
            setTableApples(prev => prev + 1);
            setFeedback({ status: null, message: '' });
        } else { playSound('error'); }
    };

    const handleRemoveBox = () => {
        if (tableBoxes > 0) {
            playSound('click');
            setTableBoxes(prev => prev - 1);
            setFeedback({ status: null, message: '' });
        }
    };

    const handleRemoveApple = () => {
        if (tableApples > 0) {
            playSound('click');
            setTableApples(prev => prev - 1);
            setFeedback({ status: null, message: '' });
        }
    };

    const handleDeliver = () => {
        const target = orders[currentOrderIndex];
        const packedTens = tableBoxes * 10;
        const totalPacked = packedTens + tableApples;

        if (totalPacked === target) {
            playSound('success');
            const msg = `Great job! You packed ${target} apples correctly.`;
            setFeedback({ status: 'success', message: msg });
            speak(msg);

            setTimeout(() => {
                if (currentOrderIndex < 9) {
                    const nextIndex = currentOrderIndex + 1;
                    setCurrentOrderIndex(nextIndex);
                    setTableBoxes(0);
                    setTableApples(0);
                    setFeedback({ status: null, message: '' });
                    playSound('boing');
                    speak(`Next order. Please pack ${orders[nextIndex]} apples.`);
                } else {
                    setPhase('done');
                    playSound('kaching');
                    speak("Amazing! You packed all the orders perfectly. Krishna Fruits is very happy!");
                }
            }, 2500);

        } else {
            playSound('error');
            const boxWord = packedTens === 0 ? "0" : packedTens.toString();
            const appleWord = tableApples === 0 ? "0" : tableApples.toString();
            const msg = `You packed ${boxWord} and ${appleWord} apples, totaling ${totalPacked}. But you need ${target}. Try again!`;
            
            setFeedback({ status: 'error', message: msg });
            speak(msg);
        }
    };

    if (!mounted) return null;

    // ============================================================================
    // REUSABLE COMPONENTS
    // ============================================================================
    const BoxOf10 = ({ onClick, interactive = false }: { onClick?: () => void, interactive?: boolean }) => (
        <div 
            onClick={onClick}
            className={`relative bg-amber-100 rounded-xl md:rounded-2xl border-2 md:border-4 border-amber-600 p-1.5 md:p-2 shadow-sm w-fit transition-all shrink-0
                ${interactive ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md active:scale-95' : ''}`}
        >
            <div className="absolute -top-2 md:-top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-10">Box of 10</div>
            
            <div className="grid grid-cols-5 gap-0.5 sm:gap-1 bg-amber-200/50 p-1 sm:p-1.5 rounded-lg border-2 border-amber-300 mt-1">
                {Array.from({length: 10}).map((_, i) => (
                    <div key={i} className="w-5 h-5 sm:w-8 sm:h-8 bg-amber-50/80 rounded border border-amber-200/50 flex items-center justify-center shadow-inner">
                        <span className="text-[12px] sm:text-2xl drop-shadow-sm">🍎</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const LooseApple = ({ onClick, interactive = false }: { onClick?: () => void, interactive?: boolean }) => (
        <div 
            onClick={onClick}
            className={`w-7 h-7 sm:w-12 sm:h-12 flex items-center justify-center transition-all shrink-0
                ${interactive ? 'cursor-pointer hover:-translate-y-1 hover:scale-110 active:scale-95' : ''}`}
        >
            <span className="text-2xl sm:text-4xl drop-shadow-md">🍎</span>
        </div>
    );

    // ============================================================================
    // RENDER: START SCREEN
    // ============================================================================
    if (phase === 'start') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-sky-50 font-sans overflow-y-auto">
                <div className="max-w-xl w-full bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border-4 border-sky-200 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="bg-sky-100 p-4 rounded-full text-sky-600 shadow-inner">
                            <ShoppingCart size={48} />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">Pack the Orders!</h1>
                        <p className="text-sm md:text-base text-slate-500 font-medium mt-3 px-4">
                            Help Rohan pack 10 fruit orders at Krishna Fruits. Remember, a full box holds exactly 10 apples!
                        </p>
                    </div>
                    <button 
                        onClick={generateOrders} 
                        className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black text-xl py-4 rounded-2xl shadow-[0_6px_0_rgb(2,132,199)] active:translate-y-2 active:shadow-none transition-all flex justify-center items-center gap-2 mt-4"
                    >
                        <Play size={24} fill="currentColor" /> Start Packing
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: DONE SCREEN
    // ============================================================================
    if (phase === 'done') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-lime-50 font-sans overflow-y-auto">
                <div className="max-w-xl w-full bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border-4 border-lime-300 text-center space-y-6">
                    <div className="flex justify-center animate-bounce">
                        <CheckCircle size={80} className="text-lime-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Shift Complete!</h1>
                        <p className="text-base text-slate-500 font-medium mt-3">
                            You successfully packed all 10 orders. You are a base-10 master!
                        </p>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button onClick={generateOrders} className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-black text-lg py-4 rounded-2xl shadow-[0_6px_0_rgb(2,132,199)] active:translate-y-2 active:shadow-none transition-all">Play Again</button>
                        {onComplete && (
                            <button onClick={onComplete} className="flex-1 bg-lime-500 hover:bg-lime-400 text-white font-black text-lg py-4 rounded-2xl shadow-[0_6px_0_rgb(101,163,13)] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-2">Next <ArrowRight size={20}/></button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PLAYING SCREEN
    // ============================================================================
    const currentTarget = orders[currentOrderIndex];
    const isFeedbackError = feedback.status === 'error';

    return (
        <div className="w-full h-full flex flex-col items-center bg-slate-50 font-sans select-none overflow-hidden relative">
            
            {/* 1. TOP: ORDER BANNER */}
            <div className="w-full shrink-0 z-20 p-2 md:p-4 pb-0">
                <div className="w-full max-w-5xl mx-auto flex items-stretch gap-2 md:gap-4 h-14 md:h-20">
                    
                    {/* Progress Badge */}
                    <div className="bg-white border-2 border-slate-200 rounded-xl md:rounded-2xl px-3 md:px-4 flex flex-col justify-center items-center shadow-sm shrink-0">
                        <span className="text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-widest leading-tight">Order</span>
                        <span className="text-lg md:text-2xl font-black text-sky-500 leading-tight">{currentOrderIndex + 1}<span className="text-slate-300 text-sm md:text-lg">/10</span></span>
                    </div>

                    {/* Main Target Banner */}
                    <div className="flex-1 bg-sky-500 border-b-4 md:border-b-8 border-sky-600 rounded-xl md:rounded-2xl flex items-center justify-between px-3 md:px-8 shadow-sm">
                        <div className="flex items-center gap-2 md:gap-3">
                            <ShoppingCart className="text-white/80 hidden sm:block" size={24} />
                            <div className="flex flex-col">
                                <span className="text-white/80 text-[9px] md:text-sm font-bold uppercase tracking-widest leading-none">Target Order</span>
                                <span className="text-white font-black text-lg md:text-3xl leading-tight">Pack {currentTarget} Apples</span>
                            </div>
                        </div>
                        <button onClick={() => speak(`Please pack ${currentTarget} apples.`)} className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors active:scale-95 shrink-0">
                            <Volume2 size={16} className="md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. MIDDLE: WAREHOUSE & DELIVERY TABLE */}
            <div className="w-full flex-1 flex flex-col items-center justify-start gap-2 md:gap-3 p-2 md:p-4 overflow-y-auto hide-scrollbar pb-24 md:pb-28">
                
                {/* --- A. WAREHOUSE (Storage) --- */}
                <div className="w-full max-w-5xl bg-indigo-50 border-2 border-indigo-100 rounded-2xl md:rounded-[2rem] p-2 md:p-4 flex flex-col sm:flex-row gap-2 md:gap-3 shadow-sm shrink-0">
                    
                    <div className="flex-1 bg-white rounded-xl border-2 border-indigo-50 flex items-center p-2 gap-2 md:gap-4">
                        <div className="shrink-0 pl-1 md:pl-2">
                            <BoxOf10 interactive={true} onClick={handleAddBox} />
                        </div>
                        <div className="flex-1 h-full">
                            <button onClick={handleAddBox} className="w-full h-full min-h-[40px] md:min-h-[50px] bg-amber-100 hover:bg-amber-200 text-amber-800 font-black text-[10px] sm:text-sm md:text-base rounded-lg border-2 border-amber-300 transition-all active:scale-95 flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 px-1 leading-tight">
                                <span>Take Box</span> <ArrowRight size={14} className="hidden sm:block" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-white rounded-xl border-2 border-indigo-50 flex items-center p-2 gap-2 md:gap-4">
                        <div className="shrink-0 pl-2 md:pl-4 pr-1 md:pr-2">
                            <LooseApple interactive={true} onClick={handleAddApple} />
                        </div>
                        <div className="flex-1 h-full">
                            <button onClick={handleAddApple} className="w-full h-full min-h-[40px] md:min-h-[50px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-[10px] sm:text-sm md:text-base rounded-lg border-2 border-rose-200 transition-all active:scale-95 flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 px-1 leading-tight">
                                <span>Take Apple</span> <ArrowRight size={14} className="hidden sm:block" />
                            </button>
                        </div>
                    </div>

                </div>

                {/* --- B. DELIVERY TABLE (Work Area) --- */}
                <div className={`w-full max-w-5xl flex-1 bg-white border-[3px] rounded-2xl md:rounded-[2rem] p-3 md:p-4 flex flex-col relative transition-colors duration-300
                    ${isFeedbackError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 shadow-inner'} min-h-[180px]`}
                >
                    <div className="flex items-center justify-between mb-2 md:mb-4 border-b-2 border-slate-100 pb-2 shrink-0">
                        <h3 className="text-xs md:text-base font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 md:gap-2 leading-none">
                            <span className="w-2 h-2 bg-sky-400 rounded-full"></span> Delivery Table
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] md:text-xs font-bold text-slate-400 italic hidden sm:block">Tap item to return</span>
                            <button onClick={() => { setTableBoxes(0); setTableApples(0); setFeedback({status:null, message:''}); playSound('click'); }} className="text-[10px] md:text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-500 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors active:scale-95">
                                <RotateCcw size={12} /> Clear
                            </button>
                        </div>
                    </div>

                    {/* Table Contents (Strict bounded overflow for mobile safety) */}
                    <div className="flex-1 w-full flex flex-row gap-2 md:gap-6 min-h-0">
                        
                        {/* Area for Boxes (40% width on mobile) */}
                        <div className="w-[40%] md:flex-1 border-2 border-dashed border-slate-200 rounded-xl p-2 md:p-4 flex flex-wrap content-start justify-center gap-2 md:gap-4 bg-slate-50/50 overflow-y-auto">
                            {tableBoxes === 0 ? (
                                <span className="text-slate-300 font-bold italic text-[10px] md:text-sm text-center w-full mt-4">Empty</span>
                            ) : (
                                Array.from({length: tableBoxes}).map((_, i) => (
                                    <div key={`box-${i}`} className="animate-fade-in-up">
                                        <BoxOf10 interactive={true} onClick={handleRemoveBox} />
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Area for Loose Apples (60% width on mobile) */}
                        <div className="w-[60%] md:flex-[1.5] border-2 border-dashed border-slate-200 rounded-xl p-2 md:p-4 flex flex-wrap content-start justify-center gap-1 sm:gap-2 bg-slate-50/50 overflow-y-auto">
                            {tableApples === 0 ? (
                                <span className="text-slate-300 font-bold italic text-[10px] md:text-sm text-center w-full mt-4">Empty</span>
                            ) : (
                                Array.from({length: tableApples}).map((_, i) => (
                                    <div key={`apple-${i}`} className="animate-fade-in-up">
                                        <LooseApple interactive={true} onClick={handleRemoveApple} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Embedded Error Feedback */}
                    {isFeedbackError && (
                        <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-rose-100 border-2 border-rose-300 text-rose-700 p-2 md:p-3 rounded-xl shadow-md flex items-center gap-2 md:gap-3 animate-fade-in-up z-20">
                            <XCircle className="shrink-0" size={18} />
                            <p className="text-[10px] sm:text-xs md:text-sm font-bold leading-tight flex-1">{feedback.message}</p>
                            <button onClick={() => speak(feedback.message)} className="shrink-0 bg-rose-200 hover:bg-rose-300 p-1.5 rounded-full transition-colors"><Volume2 size={14}/></button>
                        </div>
                    )}
                </div>

            </div>

            {/* 3. FLOATING ACTION BUTTON (Anchored securely inside relative container) */}
            <div className="absolute bottom-2 md:bottom-4 left-0 w-full flex justify-center px-4 z-30 pointer-events-none">
                <button 
                    onClick={handleDeliver}
                    disabled={tableBoxes === 0 && tableApples === 0}
                    className={`w-full max-w-2xl py-3 md:py-5 rounded-full border-b-[4px] md:border-b-[6px] flex items-center justify-center gap-2 md:gap-3 font-black text-lg md:text-2xl tracking-wider transition-all shadow-xl pointer-events-auto
                        ${tableBoxes === 0 && tableApples === 0 ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-90' : 'bg-lime-400 border-lime-600 text-lime-950 active:translate-y-[4px] md:active:translate-y-[6px] active:border-b-[0px] hover:bg-lime-300 animate-pulse'}`}
                >
                    <PackageCheck size={24} className="md:w-7 md:h-7" /> DELIVER ORDER
                </button>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
              @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
              .animate-fade-in-up { animation: fadeInUp 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            `}} />
        </div>
    );
}