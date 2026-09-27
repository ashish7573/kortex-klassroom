"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Shuffle, RotateCcw, MoveDown } from 'lucide-react';

// --- INTERNAL COMPONENT: The Traveling Ball ---
// Shoots up the outer pipe, then curves into the funnel
function TravelingBall({ type, onArrive }: { type: 'A' | 'B', onArrive: () => void }) {
    const [pos, setPos] = useState({ bottom: '-30%', left: '50%', opacity: 1 });

    useEffect(() => {
        // Step 1: Shoot straight up the exterior pipe
        const frame = requestAnimationFrame(() => {
            setPos({ bottom: '90%', left: '50%', opacity: 1 });
        });
        
        // Step 2: Curve inward to drop into the hopper
        const curve = setTimeout(() => {
            setPos({ 
                bottom: '75%', 
                left: type === 'A' ? '250%' : '-150%', // Moves inward towards the center funnels
                opacity: 0 
            });
        }, 500); 

        // Step 3: Arrive at destination and update actual funnel count
        const timer = setTimeout(onArrive, 650); 

        return () => { cancelAnimationFrame(frame); clearTimeout(curve); clearTimeout(timer); };
    }, [onArrive, type]);

    return (
        <div 
            className={`absolute w-8 h-8 md:w-10 md:h-10 rounded-full shadow-lg z-20 ${type === 'A' ? 'bg-gradient-to-br from-rose-400 to-rose-600' : 'bg-gradient-to-br from-sky-400 to-sky-600'}`}
            style={{ 
                bottom: pos.bottom, 
                left: pos.left,
                opacity: pos.opacity,
                transform: 'translateX(-50%)',
                transitionProperty: 'bottom, left, opacity',
                transitionDuration: '500ms, 150ms, 150ms', // Faster inward curve
                transitionTimingFunction: 'ease-out, linear, ease-in'
            }}
        />
    );
}

export default function AdditionMachine({ lesson, onComplete }: any) {
    // Core States
    const [funnelA, setFunnelA] = useState(0);
    const [funnelB, setFunnelB] = useState(0);
    const [isDropped, setIsDropped] = useState(false);
    const [showResult, setShowResult] = useState(false);

    // Pipe Transit States
    const [travelingA, setTravelingA] = useState<{id: number}[]>([]);
    const [travelingB, setTravelingB] = useState<{id: number}[]>([]);

    // Lever Physics State
    const [leverY, setLeverY] = useState(0);
    const leverMaxTravel = 60; // Tuned for the new, smaller desktop lever track
    const leverRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const totalInFunnels = funnelA + funnelB;
    const pendingTotal = totalInFunnels + travelingA.length + travelingB.length;
    const maxLimit = 10;

    // --- BUTTON CONTROLS (With Transit Logic) ---
    const handleAdd = (funnel: 'A' | 'B') => {
        if (pendingTotal >= maxLimit || isDropped) return;
        const newBall = { id: Date.now() + Math.random() };
        if (funnel === 'A') setTravelingA(prev => [...prev, newBall]);
        else setTravelingB(prev => [...prev, newBall]);
    };

    const handleArrive = (funnel: 'A' | 'B', id: number) => {
        if (funnel === 'A') {
            setTravelingA(prev => prev.filter(b => b.id !== id));
            setFunnelA(prev => prev + 1);
        } else {
            setTravelingB(prev => prev.filter(b => b.id !== id));
            setFunnelB(prev => prev + 1);
        }
    };

    const handleSub = (funnel: 'A' | 'B') => {
        if (isDropped) return;
        if (funnel === 'A' && funnelA > 0) setFunnelA(prev => prev - 1);
        if (funnel === 'B' && funnelB > 0) setFunnelB(prev => prev - 1);
    };

    // --- LEVER MECHANICS ---
    const startDrag = (e: any) => {
        if (totalInFunnels === 0 || isDropped || travelingA.length > 0 || travelingB.length > 0) return;
        isDragging.current = true;
    };

    const onDrag = (e: any) => {
        if (!isDragging.current) return;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const leverRect = leverRef.current?.getBoundingClientRect();
        
        if (leverRect) {
            let newY = clientY - leverRect.top - 20; 
            if (newY < 0) newY = 0;
            if (newY > leverMaxTravel) newY = leverMaxTravel;
            
            setLeverY(newY);

            // Trigger point
            if (newY >= leverMaxTravel - 5) {
                isDragging.current = false;
                triggerMachineDrop();
            }
        }
    };

    const stopDrag = () => {
        isDragging.current = false;
        if (!isDropped) setLeverY(0); 
    };

    useEffect(() => {
        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchmove', onDrag, { passive: false });
        window.addEventListener('touchend', stopDrag);
        return () => {
            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('mouseup', stopDrag);
            window.removeEventListener('touchmove', onDrag);
            window.removeEventListener('touchend', stopDrag);
        };
    });

    // --- THE PHYSICS DROP ---
    const triggerMachineDrop = () => {
        setIsDropped(true);
        setLeverY(leverMaxTravel); 
        setTimeout(() => setShowResult(true), 800); 
    };

    // --- BOTTOM DASHBOARD ACTIONS ---
    const resetMachine = () => {
        setFunnelA(0);
        setFunnelB(0);
        setTravelingA([]);
        setTravelingB([]);
        setIsDropped(false);
        setShowResult(false);
        setLeverY(0);
    };

    const handleRandomize = () => {
        const randomTotal = Math.floor(Math.random() * 10) + 1; 
        const randomA = Math.floor(Math.random() * (randomTotal + 1));
        const randomB = randomTotal - randomA;
        
        setFunnelA(randomA);
        setFunnelB(randomB);
        setTravelingA([]);
        setTravelingB([]);
        setIsDropped(false);
        setShowResult(false);
        setLeverY(0);
    };

    // --- DOM CONTINUOUS TRACKING BALL GENERATOR ---
    const generateBalls = () => {
        const balls = [];
        for (let i = 0; i < funnelA; i++) balls.push({ id: `A-${i}`, funnel: 'A', idx: i });
        for (let i = 0; i < funnelB; i++) balls.push({ id: `B-${i}`, funnel: 'B', idx: i });
        return balls;
    };

    const currentBalls = generateBalls();

    return (
        <div className="w-full h-full flex flex-col items-center justify-between p-2 md:p-6 bg-sky-50 font-sans select-none overflow-hidden relative">
            
            {/* 1. TOP: EQUATION BANNER */}
            <div className="w-full max-w-4xl shrink-0 z-20 relative">
                <div className={`w-full py-4 md:py-8 rounded-[2rem] flex items-center justify-center gap-4 md:gap-8 font-black text-5xl md:text-7xl transition-all duration-500 border-b-8 ${showResult ? 'bg-lime-400 border-lime-500 text-slate-900 shadow-[0_0_40px_rgba(163,230,53,0.5)]' : 'bg-white border-slate-200 shadow-lg'}`}>
                    <span className="text-rose-500">{funnelA}</span>
                    <span className={showResult ? 'text-slate-800 transition-colors' : 'text-slate-300'}>+</span>
                    <span className="text-sky-500">{funnelB}</span>
                    <span className={showResult ? 'text-slate-800 transition-colors' : 'text-slate-300'}>=</span>
                    <span className={showResult ? 'scale-125 transition-transform text-slate-900' : 'text-slate-300'}>
                        {showResult ? totalInFunnels : '?'}
                    </span>
                </div>
            </div>

            {/* 2. MIDDLE: MAIN MACHINE VISUALIZATION */}
            <div className="relative w-full max-w-4xl flex-1 max-h-[45vh] md:max-h-[50vh] flex flex-col justify-end mt-4 md:mt-8 z-10 box-border">
                
                {/* --- EXTERIOR LOOPED PIPES (Thick Glass Styling & Color Coded) --- */}
                {/* Left Exterior Pipe (Red) */}
                <div className="absolute -left-6 md:-left-12 top-[10%] bottom-[-110px] w-12 md:w-16 bg-white/30 backdrop-blur-md border-4 border-rose-400 rounded-full shadow-[-10px_10px_20px_rgba(244,63,94,0.15)] z-[-1] flex justify-center overflow-visible">
                    {travelingA.map(ball => <TravelingBall key={ball.id} type="A" onArrive={() => handleArrive('A', ball.id)} />)}
                </div>
                {/* Right Exterior Pipe (Blue) */}
                <div className="absolute -right-6 md:-right-12 top-[10%] bottom-[-110px] w-12 md:w-16 bg-white/30 backdrop-blur-md border-4 border-sky-400 rounded-full shadow-[10px_10px_20px_rgba(56,189,248,0.15)] z-[-1] flex justify-center overflow-visible">
                    {travelingB.map(ball => <TravelingBall key={ball.id} type="B" onArrive={() => handleArrive('B', ball.id)} />)}
                </div>

                {/* Gray Machine Block */}
                <div className="relative w-full h-full bg-slate-800 rounded-[2rem] md:rounded-[3rem] shadow-2xl border-8 md:border-[12px] border-slate-900 flex flex-col z-10 overflow-hidden">
                    
                    <div className="absolute top-[45%] left-0 w-full h-2 bg-slate-700/50 z-0"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-[45%] bg-slate-900 z-0 shadow-inner"></div>
                    
                    {/* The Bottom Basket Container (NO TEXT) */}
                    <div className="absolute bottom-0 left-0 w-full h-[55%] bg-slate-950/50 z-0 rounded-b-[1.5rem] md:rounded-b-[2.5rem] shadow-inner flex items-end justify-center pb-4"></div>

                    {/* Trapdoors */}
                    <div className={`absolute top-[45%] left-0 w-[50%] h-4 bg-slate-900 border-t-2 border-slate-700 z-10 transition-transform duration-500 origin-left ${isDropped ? 'scale-x-0' : 'scale-x-100'}`}></div>
                    <div className={`absolute top-[45%] right-0 w-[50%] h-4 bg-slate-900 border-t-2 border-slate-700 z-10 transition-transform duration-500 origin-right ${isDropped ? 'scale-x-0' : 'scale-x-100'}`}></div>

                    {/* Individual Continuous Physics Balls */}
                    {currentBalls.map((ball, i) => {
                        let left, top;
                        if (!isDropped) {
                            const xOff = (ball.idx % 3 - 1) * 30; 
                            const yOff = -Math.floor(ball.idx / 3) * 30;
                            left = `calc(${ball.funnel === 'A' ? '25%' : '75%'} + ${xOff}px)`;
                            top = `calc(40% + ${yOff}px)`;
                        } else {
                            const xOff = ((i % 5) - 2) * 32;
                            const yOff = -Math.floor(i / 5) * 32;
                            left = `calc(50% + ${xOff}px)`;
                            top = `calc(88% + ${yOff}px)`;
                        }

                        return (
                            <div 
                                key={ball.id}
                                className={`absolute w-8 h-8 md:w-10 md:h-10 rounded-full shadow-[inset_-4px_-4px_12px_rgba(0,0,0,0.5),_3px_5px_10px_rgba(0,0,0,0.4)] bg-gradient-to-br ${ball.funnel === 'A' ? 'from-rose-400 to-rose-500' : 'from-sky-400 to-sky-500'} z-20`}
                                style={{
                                    left,
                                    top,
                                    transform: 'translate(-50%, -50%)',
                                    transition: isDropped ? 'top 800ms cubic-bezier(0.5, 0, 1, 1), left 800ms linear' : 'none' 
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* 3. BOTTOM: EASILY REACHABLE CONTROLS DASHBOARD */}
            <div className="relative w-full max-w-4xl flex justify-between items-end pb-2 md:pb-6 z-30 shrink-0 mt-8 gap-2 md:gap-4">
                
                {/* --- RED CONTROLS A --- */}
                <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 bg-rose-600 p-2 md:p-3 rounded-3xl sm:rounded-full shadow-[0_8px_0_rgb(159,18,57)] border-2 border-rose-400">
                    <button onClick={() => handleSub('A')} className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-400 active:scale-90 transition-transform text-white shadow-inner"><Minus strokeWidth={4} size={28}/></button>
                    <button onClick={() => handleAdd('A')} className="w-12 h-12 rounded-full bg-rose-400 flex items-center justify-center hover:bg-rose-300 active:scale-90 transition-transform text-white shadow-md border-2 border-rose-300"><Plus strokeWidth={4} size={28}/></button>
                </div>

                {/* --- RESET BUTTON --- */}
                <div className="hidden md:flex flex-1 justify-end pb-2">
                    <button 
                        onClick={resetMachine}
                        className="bg-slate-500 hover:bg-slate-400 text-white font-black text-lg px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_0_rgb(71,85,105)] active:translate-y-2 active:shadow-none transition-all"
                    >
                        <RotateCcw size={24} /> Reset
                    </button>
                </div>

                {/* --- THE PHYSICS LEVER (Scaled Down for Desktop) --- */}
                <div className="relative w-16 h-28 md:h-32 bg-slate-950 rounded-full border-4 border-slate-700 shadow-inner flex justify-center z-40 mx-2 md:mx-4 -mt-12 md:-mt-16">
                    <div 
                        ref={leverRef}
                        className={`absolute w-16 h-16 md:w-20 md:h-20 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_5px_10px_rgba(255,255,255,0.4)] flex items-center justify-center cursor-grab active:cursor-grabbing z-50 transition-colors ${isDropped || totalInFunnels === 0 || travelingA.length > 0 || travelingB.length > 0 ? 'bg-slate-600 pointer-events-none border-4 border-slate-500' : 'bg-amber-400 border-4 border-amber-200 animate-pulse'}`}
                        style={{ 
                            top: '-8px', 
                            transform: `translateY(${leverY}px)`,
                            transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
                            touchAction: 'none'
                        }}
                        onMouseDown={startDrag}
                        onTouchStart={startDrag}
                    >
                        {!isDropped && totalInFunnels > 0 && travelingA.length === 0 && travelingB.length === 0 && <MoveDown strokeWidth={3} size={32} className="text-amber-700" />}
                    </div>
                </div>

                {/* --- RANDOMISE BUTTON --- */}
                <div className="hidden md:flex flex-1 justify-start pb-2">
                    <button 
                        onClick={handleRandomize}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-black text-lg px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_0_rgb(147,51,234)] active:translate-y-2 active:shadow-none transition-all"
                    >
                        <Shuffle size={24} /> Mix
                    </button>
                </div>

                {/* --- BLUE CONTROLS B --- */}
                <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 bg-sky-600 p-2 md:p-3 rounded-3xl sm:rounded-full shadow-[0_8px_0_rgb(3,105,161)] border-2 border-sky-400">
                    <button onClick={() => handleSub('B')} className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center hover:bg-sky-400 active:scale-90 transition-transform text-white shadow-inner"><Minus strokeWidth={4} size={28}/></button>
                    <button onClick={() => handleAdd('B')} className="w-12 h-12 rounded-full bg-sky-400 flex items-center justify-center hover:bg-sky-300 active:scale-90 transition-transform text-white shadow-md border-2 border-sky-300"><Plus strokeWidth={4} size={28}/></button>
                </div>

            </div>
            
            {/* Mobile Fallback Actions */}
            <div className="w-full flex justify-center gap-4 mt-2 mb-4 md:hidden z-30">
                <button onClick={resetMachine} className="bg-slate-500 text-white font-black px-4 py-3 rounded-2xl flex items-center gap-2 shadow-[0_4px_0_rgb(71,85,105)] active:translate-y-1 active:shadow-none transition-all"><RotateCcw size={20} /> Reset</button>
                <button onClick={handleRandomize} className="bg-purple-600 text-white font-black px-4 py-3 rounded-2xl flex items-center gap-2 shadow-[0_4px_0_rgb(147,51,234)] active:translate-y-1 active:shadow-none transition-all"><Shuffle size={20} /> Mix</button>
            </div>
            
        </div>
    );
}