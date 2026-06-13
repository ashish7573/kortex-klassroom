"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, ArrowRight, Check } from 'lucide-react';

// --- Block Color Sequence (Matches typical math manipulatives) ---
const BLOCK_COLORS = [
    'bg-rose-500', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-indigo-400',
    'bg-rose-500', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-indigo-400'
];

export default function AdditionBlocksQuiz({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<'playing' | 'result'>('playing');
    const [score, setScore] = useState(0);
    const [questionIndex, setQuestionIndex] = useState(1);
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [mounted, setMounted] = useState(false);

    // Question Data
    const [qData, setQData] = useState<{ a1t: number, a1o: number, a2t: number, a2o: number } | null>(null);

    // Inputs: Raw Tens, Raw Ones, Regrouped Tens, Regrouped Ones, Eq Part 1, Eq Part 2, Final Answer
    const [inputs, setInputs] = useState({ rawT: '', rawO: '', regT: '', regO: '', eq1: '', eq2: '', eqAns: '' });

    useEffect(() => { setMounted(true); generateQuestion(); }, []);

    // --- Audio Engine ---
    const audioCtx = useRef<AudioContext | null>(null);
    const playSound = (type: 'pop' | 'kaching' | 'error' | 'click') => {
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
                osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
            } else if (type === 'kaching') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
            } else if (type === 'error') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
            }
            
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + (type === 'kaching' ? 0.4 : 0.2));
        } catch(e) {}
    };

    const generateQuestion = () => {
        // Ensure there is ALWAYS a carry-over (Ones sum > 9)
        const a1o = Math.floor(Math.random() * 5) + 5; // 5-9
        const a2o = Math.floor(Math.random() * (10 - a1o)) + (10 - a1o + 1) + Math.floor(Math.random() * 3); 
        // Force ones to be > 9, but valid single digits
        const safeA2o = Math.min(9, Math.max(10 - a1o + 1, Math.floor(Math.random() * 9) + 1));
        
        const a1t = Math.floor(Math.random() * 4) + 1; // 1-4
        const a2t = Math.floor(Math.random() * 4) + 1; // 1-4

        setQData({ a1t, a1o, a2t, a2o: safeA2o });
        setInputs({ rawT: '', rawO: '', regT: '', regO: '', eq1: '', eq2: '', eqAns: '' });
        setFeedback('idle');
    };

    const handleInputChange = (field: keyof typeof inputs, val: string) => {
        playSound('pop');
        const numVal = val.replace(/[^0-9]/g, '').substring(0, 2);
        setInputs(prev => ({ ...prev, [field]: numVal }));
    };

    const handleCheckAnswer = () => {
        if (!qData) return;

        const expectedRawT = qData.a1t + qData.a2t;
        const expectedRawO = qData.a1o + qData.a2o;
        
        const expectedRegT = expectedRawT + 1;
        const expectedRegO = expectedRawO - 10;
        
        const expectedEq1 = expectedRegT * 10;
        const expectedEqAns = expectedEq1 + expectedRegO;

        const isCorrect = 
            Number(inputs.rawT) === expectedRawT &&
            Number(inputs.rawO) === expectedRawO &&
            Number(inputs.regT) === expectedRegT &&
            Number(inputs.regO) === expectedRegO &&
            Number(inputs.eq1) === expectedEq1 &&
            Number(inputs.eq2) === expectedRegO &&
            Number(inputs.eqAns) === expectedEqAns;

        if (isCorrect) {
            playSound('kaching');
            setFeedback('correct');
            setScore(s => s + 1);
            setTimeout(() => {
                setQuestionIndex(prev => prev + 1);
                generateQuestion();
            }, 2000);
        } else {
            playSound('error');
            setFeedback('wrong');
            setTimeout(() => setFeedback('idle'), 1500);
        }
    };

    if (!mounted || !qData) return null;

    const totalRawOnes = qData.a1o + qData.a2o;
    const leftOverOnes = totalRawOnes - 10;
    const finalTens = qData.a1t + qData.a2t + 1;

    // ============================================================================
    // REUSABLE VISUAL COMPONENTS
    // ============================================================================
    const TenStick = () => (
        <div className="flex flex-col gap-[1px] bg-slate-300 p-[1px] rounded-sm shadow-sm hover:scale-105 transition-transform">
            {[...BLOCK_COLORS].reverse().map((color, i) => (
                <div key={i} className={`w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 ${color} rounded-[1px] border border-black/10 shadow-inner`}></div>
            ))}
        </div>
    );

    const SingleBlock = ({ colorIndex }: { colorIndex: number }) => (
        <div className={`w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 ${BLOCK_COLORS[colorIndex % 10]} rounded-[1px] border border-black/10 shadow-sm`}></div>
    );

    const LabelText = ({ t, o }: { t: number, o: number }) => (
        <div className="text-center mt-2 font-bold text-slate-600 text-xs md:text-sm">
            <div>{t} tens</div>
            <div>{o} ones</div>
        </div>
    );

    const InputBox = ({ field, width = "w-10 md:w-12" }: { field: keyof typeof inputs, width?: string }) => (
        <input 
            type="text" 
            inputMode="numeric"
            value={inputs[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`${width} h-8 md:h-10 text-center font-black text-lg md:text-2xl rounded-lg border-2 bg-white transition-all outline-none
                ${inputs[field] === '' ? 'border-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.4)] focus:border-sky-500' : 'border-slate-300 text-slate-800'}`}
        />
    );


    return (
        <div className="w-full h-full flex flex-col bg-stone-100 font-sans md:rounded-3xl overflow-hidden relative selection:bg-sky-200">
            
            {/* Header */}
            <div className="shrink-0 p-3 md:p-4 bg-white border-b-2 border-stone-200 shadow-sm flex items-center justify-between z-20">
                <button className="bg-stone-100 p-2 rounded-lg hover:bg-stone-200 transition-colors text-stone-600"><ChevronLeft size={20}/></button>
                <h1 className="font-black text-lg md:text-2xl text-stone-800 tracking-tight">Playing with Blocks</h1>
                <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 font-black rounded-full text-sm">Score: {score}</div>
            </div>

            {/* Feedback Overlay */}
            {feedback !== 'idle' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm animate-fade-in">
                    <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center shadow-2xl animate-bounce ${feedback === 'correct' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {feedback === 'correct' ? <Check size={64}/> : <RotateCcw size={64}/>}
                    </div>
                </div>
            )}

            {/* MAIN WORKSPACE (Scrollable for mobile, row for desktop) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex items-start justify-center">
                <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 lg:gap-6">
                    
                    {/* COLUMN 1: The Problem Setup */}
                    <div className="flex-1 bg-white rounded-[1.5rem] border-2 border-stone-200 shadow-md p-4 flex flex-col items-center">
                        <div className="w-full text-center pb-2 border-b-2 border-stone-100 mb-4">
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-stone-400">Step 1: The Blocks</span>
                        </div>
                        
                        <div className="flex-1 flex flex-row items-center justify-around w-full gap-2">
                            {/* Addend 1 */}
                            <div className="flex flex-col items-center">
                                <div className="flex gap-2 items-start justify-center min-h-[140px]">
                                    {/* Tens */}
                                    <div className="flex gap-1">
                                        {Array.from({length: qData.a1t}).map((_, i) => <TenStick key={`c1-t1-${i}`} />)}
                                    </div>
                                    {/* Ones */}
                                    <div className="grid grid-cols-2 gap-1 content-start">
                                        {Array.from({length: qData.a1o}).map((_, i) => <SingleBlock key={`c1-o1-${i}`} colorIndex={i} />)}
                                    </div>
                                </div>
                                <div className="bg-rose-100/50 px-3 py-1 rounded-lg border border-rose-200 mt-2">
                                    <LabelText t={qData.a1t} o={qData.a1o} />
                                </div>
                            </div>

                            <div className="text-2xl font-black text-stone-400">+</div>

                            {/* Addend 2 */}
                            <div className="flex flex-col items-center">
                                <div className="flex gap-2 items-start justify-center min-h-[140px]">
                                    {/* Tens */}
                                    <div className="flex gap-1">
                                        {Array.from({length: qData.a2t}).map((_, i) => <TenStick key={`c1-t2-${i}`} />)}
                                    </div>
                                    {/* Ones */}
                                    <div className="grid grid-cols-2 gap-1 content-start">
                                        {Array.from({length: qData.a2o}).map((_, i) => <SingleBlock key={`c1-o2-${i}`} colorIndex={i} />)}
                                    </div>
                                </div>
                                <div className="bg-emerald-100/50 px-3 py-1 rounded-lg border border-emerald-200 mt-2">
                                    <LabelText t={qData.a2t} o={qData.a2o} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 2: The Regrouping */}
                    <div className="flex-[1.2] bg-white rounded-[1.5rem] border-2 border-stone-200 shadow-md p-4 flex flex-col items-center">
                        <div className="w-full text-center pb-2 border-b-2 border-stone-100 mb-4">
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-stone-400">Step 2: Regrouping</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
                            
                            {/* Visual Pool */}
                            <div className="flex gap-4 items-start justify-center">
                                {/* All Tens Combined */}
                                <div className="flex gap-1">
                                    {Array.from({length: qData.a1t + qData.a2t}).map((_, i) => <TenStick key={`c2-t-${i}`} />)}
                                </div>

                                {/* All Ones Combined (With Red Box!) */}
                                <div className="flex flex-col gap-2">
                                    {/* The Red Boxed 10 */}
                                    <div className="border-[3px] border-red-500 rounded-lg p-1.5 bg-red-50 shadow-sm relative">
                                        <div className="absolute -top-3 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full rotate-12">New 10!</div>
                                        <div className="grid grid-cols-5 gap-1">
                                            {Array.from({length: 10}).map((_, i) => <SingleBlock key={`c2-box-${i}`} colorIndex={i} />)}
                                        </div>
                                    </div>
                                    {/* Leftover Ones */}
                                    <div className="grid grid-cols-5 gap-1 pl-1">
                                        {Array.from({length: leftOverOnes}).map((_, i) => <SingleBlock key={`c2-loose-${i}`} colorIndex={i+10} />)}
                                    </div>
                                </div>
                            </div>

                            {/* Regrouping Inputs */}
                            <div className="w-full flex flex-col gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-sm md:text-base font-bold text-stone-600">
                                <div className="flex items-center justify-center gap-2">
                                    <InputBox field="rawT" /> tens 
                                    <span className="ml-2"></span>
                                    <InputBox field="rawO" width="w-12 md:w-16" /> ones
                                </div>
                                <div className="w-[80%] mx-auto border-b border-stone-300"></div>
                                <div className="flex items-center justify-center gap-2">
                                    <InputBox field="regT" /> tens <span className="text-stone-400 font-black">and</span> <InputBox field="regO" /> ones
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* COLUMN 3: The Abstract Final Equation */}
                    <div className="flex-1 bg-white rounded-[1.5rem] border-2 border-stone-200 shadow-md p-4 flex flex-col items-center">
                        <div className="w-full text-center pb-2 border-b-2 border-stone-100 mb-4">
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-stone-400">Step 3: Equation</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
                            
                            {/* Visual Final Layout */}
                            <div className="flex gap-4 items-start justify-center min-h-[140px]">
                                {/* Final Tens */}
                                <div className="flex gap-1">
                                    {Array.from({length: finalTens}).map((_, i) => <TenStick key={`c3-t-${i}`} />)}
                                </div>
                                {/* Final Ones */}
                                <div className="grid grid-cols-2 gap-1 content-start">
                                    {Array.from({length: leftOverOnes}).map((_, i) => <SingleBlock key={`c3-o-${i}`} colorIndex={i} />)}
                                </div>
                            </div>

                            {/* Final Abstract Input Box */}
                            <div className="bg-sky-50 p-4 rounded-xl border-2 border-sky-200 flex items-center justify-center gap-2 md:gap-3 w-full">
                                <InputBox field="eq1" width="w-14 md:w-16" />
                                <span className="text-xl md:text-2xl font-black text-sky-600">+</span>
                                <InputBox field="eq2" />
                                <span className="text-xl md:text-2xl font-black text-sky-600">=</span>
                                <InputBox field="eqAns" width="w-16 md:w-20" />
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {/* Footer Control Panel */}
            <div className="shrink-0 p-4 bg-white border-t-2 border-stone-200 shadow-sm flex items-center justify-between z-20">
                <div className="font-bold text-stone-400 text-sm hidden md:block">Question {questionIndex}</div>
                <button 
                    onClick={handleCheckAnswer}
                    className="w-full md:w-auto bg-emerald-500 text-white px-10 py-3 md:py-4 rounded-xl font-black text-lg tracking-wide hover:bg-emerald-400 transition-all shadow-[0_4px_0_rgb(16,185,129)] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2 mx-auto"
                >
                    Check Answer <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}