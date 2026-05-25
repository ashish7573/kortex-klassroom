"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Hand } from 'lucide-react';

// --- GAME STATE ---
type AnimState = 'idle' | 'success' | 'driving' | 'entering';

type GameState = {
    truckFilled: number;
    options: number[];
    score: number;
    animState: AnimState;
    flashColor: 'green' | 'red' | null;
    truckPosition: 'center' | 'left' | 'right';
    truckTransition: boolean;
    droppedCargo: number | null; // Tracks the correct answer for the equation
};

export default function TruckLoader({ lesson, onComplete }: any) {
    const [state, setState] = useState<GameState>({
        truckFilled: 0,
        options: [],
        score: 0,
        animState: 'entering',
        flashColor: null,
        truckPosition: 'center',
        truckTransition: true,
        droppedCargo: null
    });

    const [selectedCargo, setSelectedCargo] = useState<number | null>(null);

    // --- AUDIO ENGINE ---
    const playSound = (type: 'honk' | 'snap' | 'error' | 'click' | 'engine') => {
        if (typeof window === 'undefined') return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (type === 'snap') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'engine') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(60, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 4.0); // Slower engine ramp
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4.0);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 4.0);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.05);
            } else if (type === 'honk') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.setValueAtTime(350, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) {
            console.log("Audio fallback", e);
        }
    };

    // --- GAME LOGIC ---
    const generateLevel = () => {
        const truckFilled = Math.floor(Math.random() * 8) + 1; // 1 to 8 pre-loaded
        const target = 10 - truckFilled;
        
        let opts = new Set([target]);
        // Generate exactly 4 options, ensuring target is always included
        while(opts.size < 4) {
            let fakeOpt = Math.floor(Math.random() * 9) + 1;
            if (fakeOpt !== target) {
                opts.add(fakeOpt);
            }
        }
        
        setState(prev => ({
            ...prev,
            truckFilled,
            options: Array.from(opts).sort(() => Math.random() - 0.5),
            animState: 'idle',
            flashColor: null,
            droppedCargo: null
        }));
        setSelectedCargo(null);
    };

    // Initial load
    useEffect(() => {
        generateLevel();
    }, []);

    const handlePack = (cargoValue: number) => {
        if (state.animState !== 'idle') return;

        if (state.truckFilled + cargoValue === 10) {
            // SUCCESS SEQUENCE
            playSound('snap');
            setState(prev => ({ ...prev, animState: 'success', flashColor: 'green', droppedCargo: cargoValue }));
            setSelectedCargo(null);
            
            // 1. Honk after snap
            setTimeout(() => {
                playSound('honk');
            }, 600);

            // 2. Drive Away (SLOWLY - 4 seconds transition)
            setTimeout(() => {
                playSound('engine');
                setState(prev => ({ ...prev, animState: 'driving', truckPosition: 'right', truckTransition: true }));
            }, 1500);

            // 3. Reset position instantly off-screen left, generate new level
            setTimeout(() => {
                setState(prev => ({ ...prev, score: prev.score + 1, truckPosition: 'left', truckTransition: false }));
                generateLevel(); 
                
                // Drive new truck in
                setTimeout(() => {
                    setState(prev => ({ ...prev, animState: 'idle', truckPosition: 'center', truckTransition: true }));
                }, 100);
            }, 5500); // 1.5s wait + 4.0s drive time

        } else {
            // ERROR
            playSound('error');
            setState(prev => ({ ...prev, flashColor: 'red' }));
            setTimeout(() => {
                setState(prev => ({ ...prev, flashColor: null }));
            }, 500);
            setSelectedCargo(null);
        }
    };

    // --- DRAG AND DROP HANDLERS ---
    const handleDragStart = (e: React.DragEvent, value: number) => {
        playSound('click');
        e.dataTransfer.setData('text/plain', value.toString());
        e.dataTransfer.effectAllowed = 'move';
        
        // Clean transparent drag image
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        setSelectedCargo(value);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedValue = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(droppedValue)) {
            handlePack(droppedValue);
        }
    };

    const handleTruckTap = () => {
        if (selectedCargo !== null) {
            handlePack(selectedCargo);
        }
    };

    // --- VISUAL COMPONENTS ---

    // The Detailed "X" Crate
    const Crate = ({ color }: { color: 'sky' | 'amber' }) => (
        <div className={`w-full h-full border-[3px] rounded-sm shadow-inner flex items-center justify-center relative overflow-hidden ${color === 'amber' ? 'bg-amber-500 border-amber-600' : 'bg-sky-500 border-sky-600'}`}>
            <div className={`absolute w-[150%] h-[3px] rotate-45 ${color === 'amber' ? 'bg-amber-700/40' : 'bg-sky-700/40'}`}></div>
            <div className={`absolute w-[150%] h-[3px] -rotate-45 ${color === 'amber' ? 'bg-amber-700/40' : 'bg-sky-700/40'}`}></div>
            <div className={`absolute inset-0.5 border rounded-sm ${color === 'amber' ? 'border-amber-400/50' : 'border-sky-400/50'}`}></div>
        </div>
    );

    // The empty dashed box
    const EmptySlot = () => (
        <div className="w-full h-full border-2 border-dashed border-white/60 rounded-sm bg-blue-900/30"></div>
    );

    // Dynamic 2x5 Grid
    const TetrisGrid = ({ filled, isOption }: { filled: number, isOption: boolean }) => {
        const slots = Array.from({ length: 10 });
        const isSuccess = state.animState === 'success' || state.animState === 'driving';

        return (
            <div className="relative w-full h-full">
                <div className={`grid grid-cols-5 grid-rows-2 gap-1 md:gap-1.5 p-1.5 w-full h-full`}>
                    {slots.map((_, i) => {
                        let showAmberCrate = false;
                        let showSkyCrate = false;
                        
                        if (isOption) {
                            // Render options justified to the right to look like the missing piece
                            showAmberCrate = i >= (10 - filled);
                        } else {
                            // Truck bed renders left-to-right.
                            showSkyCrate = i < filled;
                            showAmberCrate = isSuccess && i >= filled; // Fill the rest with the dropped amber crates on success
                        }

                        return (
                            <div key={i} className="w-full h-full">
                                {showAmberCrate ? <Crate color="amber" /> : showSkyCrate ? <Crate color="sky" /> : (!isOption && <EmptySlot />)}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Calculate dynamic truck position class (Slower Transition)
    const getTruckTranslateClass = () => {
        if (state.truckPosition === 'left') return '-translate-x-[150vw]';
        if (state.truckPosition === 'right') return 'translate-x-[150vw]';
        return 'translate-x-0';
    };

    return (
        <div className="w-full h-full flex flex-col md:flex-row items-center bg-sky-300 font-sans select-none overflow-hidden relative min-h-[600px] border-4 border-slate-700 rounded-3xl shadow-2xl">
            
            {/* --- SCENERY BACKGROUND --- */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex flex-col justify-end">
                {/* Sky Elements */}
                <div className="absolute top-10 left-[10%] w-32 h-10 bg-white/60 rounded-full blur-sm"></div>
                <div className="absolute top-20 right-[20%] w-48 h-12 bg-white/60 rounded-full blur-sm"></div>
                
                {/* Rolling Green Hills & Trees */}
                <div className="absolute bottom-[25%] left-[-5%] w-[50%] h-[40%] bg-green-500 rounded-t-[100%] shadow-[inset_0_20px_20px_rgba(0,0,0,0.05)]"></div>
                <div className="absolute bottom-[25%] right-[-10%] w-[65%] h-[50%] bg-green-400 rounded-t-[100%] shadow-[inset_0_20px_20px_rgba(0,0,0,0.05)]"></div>
                
                {/* Simple Tree 1 */}
                <div className="absolute bottom-[40%] left-[15%] flex flex-col items-center">
                    <div className="w-24 h-24 bg-green-700 rounded-full shadow-inner mb-[-20px] z-10"></div>
                    <div className="w-6 h-12 bg-amber-800 rounded-sm"></div>
                </div>

                {/* Simple Tree 2 */}
                <div className="absolute bottom-[45%] right-[25%] flex flex-col items-center">
                    <div className="w-32 h-32 bg-green-600 rounded-full shadow-inner mb-[-30px] z-10"></div>
                    <div className="w-8 h-16 bg-amber-900 rounded-sm"></div>
                </div>

                {/* The Asphalt Road (Fixed to Bottom) */}
                <div className="w-full h-[30%] bg-slate-800 border-t-[12px] border-slate-600 flex flex-col justify-center relative shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                    <div className="w-full h-4 bg-[repeating-linear-gradient(90deg,#fff,#fff_60px,transparent_60px,transparent_120px)] opacity-90"></div>
                </div>
            </div>

            {/* --- LEFT PANEL: CARGO DOCK --- */}
            <div className="w-full md:w-1/3 lg:w-1/4 h-auto md:h-full bg-slate-50 border-b-4 md:border-b-0 md:border-r-8 border-slate-300 flex flex-col p-4 z-20 shadow-[10px_0_20px_rgba(0,0,0,0.1)]">
                
                <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-2xl border-4 border-slate-200 shadow-sm">
                    <Trophy size={28} className="text-amber-500" />
                    <div className="flex flex-col leading-none">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trucks Packed</span>
                        <span className="text-3xl font-black text-slate-700">{state.score}</span>
                    </div>
                </div>

                <div className="text-center font-black text-sky-600 text-sm md:text-lg uppercase tracking-widest mb-6 flex flex-col items-center gap-1 bg-sky-100 py-2 px-4 rounded-full border-2 border-sky-200">
                    Cargo Dock
                    <span className="text-xs text-slate-500 capitalize flex items-center gap-1"><Hand size={14}/> Drag blocks to truck</span>
                </div>

                {/* Draggable Options (Exactly 4) - Redesigned Layout */}
                <div className="flex flex-col gap-4 overflow-y-auto justify-start flex-1 px-2 pb-4">
                    {state.options.map((opt, i) => (
                        <div 
                            key={i}
                            draggable={state.animState === 'idle'}
                            onDragStart={(e) => handleDragStart(e, opt)}
                            onClick={() => {
                                if (state.animState !== 'idle') return;
                                playSound('click');
                                setSelectedCargo(opt);
                            }}
                            className={`w-full max-w-[280px] mx-auto cursor-grab active:cursor-grabbing p-3 rounded-2xl border-4 transition-all hover:scale-105 active:scale-95 bg-white flex items-center justify-between gap-4
                                ${selectedCargo === opt ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'border-slate-200 shadow-md'}`}
                        >
                            {/* Number on the extreme left */}
                            <span className="text-4xl md:text-5xl font-black text-slate-700 pl-2 pointer-events-none">{opt}</span>
                            
                            {/* The Visual Tetris Grid on the right */}
                            <div className="h-[50px] md:h-[60px] flex-1 pointer-events-none">
                                <TetrisGrid filled={opt} isOption={true} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- CENTER STAGE: THE TRUCK --- */}
            <div className="flex-1 w-full h-full flex flex-col items-center justify-end relative overflow-hidden z-10">
                
                {/* --- THE EQUATION BANNER (Shows on Success) --- */}
                {(state.animState === 'success' || state.animState === 'driving') && state.droppedCargo && (
                    <div className="absolute top-16 md:top-24 bg-white/95 backdrop-blur-sm px-8 md:px-16 py-4 md:py-6 rounded-full border-8 border-lime-400 shadow-[0_10px_30px_rgba(0,0,0,0.2)] z-50 animate-bounce">
                        <span className="text-4xl md:text-6xl font-black text-slate-700 tracking-wider">
                            <span className="text-sky-500">{state.truckFilled}</span> + <span className="text-amber-500">{state.droppedCargo}</span> = <span className="text-lime-500">10</span>
                        </span>
                    </div>
                )}

                {/* Interactive Drop Zone & Truck Container */}
                <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={handleTruckTap}
                    // The truck wrapper is placed exactly so wheels touch the road (bottom 30% of screen)
                    className={`absolute bottom-[30%] w-full max-w-[650px] h-64 md:h-80 flex flex-col items-center justify-end z-20 translate-y-4 md:translate-y-6
                        ${state.truckTransition ? 'transition-transform duration-[4000ms] ease-in-out' : 'transition-none'}
                        ${getTruckTranslateClass()}
                        ${state.flashColor === 'red' ? 'animate-shake' : ''}`}
                >
                    
                    {/* Visual Target Area Highlight */}
                    {selectedCargo !== null && state.animState === 'idle' && (
                        <div className="absolute top-0 bg-amber-400 text-amber-950 font-black px-6 py-2 rounded-full animate-pulse shadow-lg border-2 border-white z-50">
                            Drop Here!
                        </div>
                    )}

                    {/* --- THE TRUCK ASSEMBLY --- */}
                    <div className="relative w-[380px] md:w-[560px] flex items-end justify-start">
                        
                        {/* 1. The Cargo Container (Blue Box with white dashed grid) */}
                        <div className={`absolute bottom-[28px] md:bottom-[36px] left-2 md:left-4 w-[260px] md:w-[380px] h-[110px] md:h-[150px] rounded-t-xl border-8 z-20 shadow-inner flex items-center justify-center transition-colors overflow-hidden
                            ${state.flashColor === 'red' ? 'bg-rose-900 border-rose-500' : state.flashColor === 'green' ? 'bg-lime-600 border-lime-400' : 'bg-blue-900 border-blue-950'}`}
                        >
                            <TetrisGrid filled={state.truckFilled} isOption={false} />
                        </div>

                        {/* 2. The Flatbed Chassis */}
                        <div className="absolute bottom-[20px] md:bottom-[28px] w-[300px] md:w-[440px] h-8 md:h-10 bg-slate-900 rounded-l-md border-t-4 border-slate-700 z-10 shadow-xl">
                            {/* Back lights */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-5 bg-red-500 rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                        </div>

                        {/* 3. The Front Cabin (Red) */}
                        <div className="absolute bottom-[20px] md:bottom-[28px] right-[40px] md:right-[60px] w-24 md:w-32 h-32 md:h-44 bg-red-600 rounded-tr-[2rem] border-l-4 border-red-800 shadow-2xl z-30 flex flex-col justify-between">
                            {/* Window */}
                            <div className="w-14 md:w-20 h-14 md:h-20 bg-sky-200 mt-3 md:mt-4 ml-auto mr-3 rounded-tr-xl rounded-bl-sm border-4 border-slate-800 opacity-90 shadow-inner"></div>
                            {/* Grill/Bumper */}
                            <div className="w-full h-8 md:h-10 bg-slate-800 border-t-2 border-slate-600 rounded-br-md relative">
                                {/* Headlight */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-6 bg-yellow-300 rounded-l-full shadow-[10px_0_20px_rgba(253,224,71,0.8)]"></div>
                            </div>
                        </div>

                        {/* 4. The Wheels (Align exactly to the bottom of this wrapper to sit on the road) */}
                        <div className="absolute bottom-0 left-10 md:left-14 w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-full border-[8px] border-slate-300 shadow-2xl flex items-center justify-center z-40">
                            <div className="w-8 h-8 bg-slate-700 rounded-full border-4 border-slate-950"></div>
                        </div>
                        <div className="absolute bottom-0 right-[70px] md:right-[100px] w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-full border-[8px] border-slate-300 shadow-2xl flex items-center justify-center z-40">
                            <div className="w-8 h-8 bg-slate-700 rounded-full border-4 border-slate-950"></div>
                        </div>

                    </div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-15px) rotate(-2deg); }
                    75% { transform: translateX(15px) rotate(2deg); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}} />
        </div>
    );
}