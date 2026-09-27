"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Users, Timer, RotateCcw, Truck, Play } from 'lucide-react';

// --- GAME STATE ---
type AnimState = 'idle' | 'success' | 'driving' | 'entering';

type PlayerState = {
    truckFilled: number;
    options: number[];
    score: number;
    animState: AnimState;
    flashColor: 'green' | 'red' | null;
    truckPosition: 'center' | 'left' | 'right';
    truckTransition: boolean;
    droppedCargo: number | null;
    selectedCargo: number | null;
};

type Phase = 'start' | 'playing' | 'result';

export default function TruckLoader({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<Phase>('start');
    const [numPlayers, setNumPlayers] = useState<1 | 2>(1);
    const [timeLeft, setTimeLeft] = useState(90);

    const defaultPlayerState: PlayerState = {
        truckFilled: 0, options: [], score: 0, animState: 'entering',
        flashColor: null, truckPosition: 'center', truckTransition: true,
        droppedCargo: null, selectedCargo: null
    };

    const [p1, setP1] = useState<PlayerState>(defaultPlayerState);
    const [p2, setP2] = useState<PlayerState>(defaultPlayerState);

    // --- AUDIO ENGINE ---
    const playSound = (type: 'honk' | 'snap' | 'error' | 'click' | 'engine') => {
        if (typeof window === 'undefined') return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            
            if (type === 'snap') {
                osc.type = 'square'; osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'engine') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(60, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 4.0); 
                gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4.0);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 4.0);
            } else if (type === 'error') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
                gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'click') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05);
            } else if (type === 'honk') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.setValueAtTime(350, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) { console.log("Audio fallback", e); }
    };

    // --- GAME LOGIC ---
    const generateLevelData = (): Partial<PlayerState> => {
        const truckFilled = Math.floor(Math.random() * 8) + 1; 
        const target = 10 - truckFilled;
        let opts = new Set([target]);
        while(opts.size < 4) {
            let fakeOpt = Math.floor(Math.random() * 9) + 1;
            if (fakeOpt !== target) opts.add(fakeOpt);
        }
        return {
            truckFilled,
            options: Array.from(opts).sort(() => Math.random() - 0.5),
            animState: 'idle',
            flashColor: null,
            droppedCargo: null,
            selectedCargo: null,
            truckPosition: 'center',
            truckTransition: true
        };
    };

    const startGame = (players: 1 | 2) => {
        playSound('engine');
        setNumPlayers(players);
        setTimeLeft(90);
        setP1({ ...defaultPlayerState, ...generateLevelData() });
        setP2({ ...defaultPlayerState, ...generateLevelData() });
        setPhase('playing');
    };

    // Global Timer
    useEffect(() => {
        let timer: any;
        if (phase === 'playing' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (phase === 'playing' && timeLeft === 0) {
            playSound('honk');
            setPhase('result');
        }
        return () => clearInterval(timer);
    }, [phase, timeLeft]);

    const handlePack = (playerId: 1 | 2, cargoValue: number) => {
        const state = playerId === 1 ? p1 : p2;
        const setPlayerState = playerId === 1 ? setP1 : setP2;

        if (state.animState !== 'idle' || phase !== 'playing') return;

        if (state.truckFilled + cargoValue === 10) {
            // SUCCESS
            playSound('snap');
            setPlayerState(prev => ({ ...prev, animState: 'success', flashColor: 'green', droppedCargo: cargoValue, selectedCargo: null }));
            
            setTimeout(() => playSound('honk'), 600);

            setTimeout(() => {
                playSound('engine');
                setPlayerState(prev => ({ ...prev, animState: 'driving', truckPosition: 'right', truckTransition: true }));
            }, 1500);

            setTimeout(() => {
                const nextLvl = generateLevelData();
                setPlayerState(prev => ({ ...prev, ...nextLvl, score: prev.score + 1, truckPosition: 'left', truckTransition: false }));
                
                setTimeout(() => {
                    setPlayerState(prev => ({ ...prev, animState: 'idle', truckPosition: 'center', truckTransition: true }));
                }, 100);
            }, 5500); 

        } else {
            // ERROR
            playSound('error');
            setPlayerState(prev => ({ ...prev, flashColor: 'red', selectedCargo: null }));
            setTimeout(() => {
                setPlayerState(prev => ({ ...prev, flashColor: null }));
            }, 500);
        }
    };

    // --- DRAG AND DROP HANDLERS ---
    const handleDragStart = (e: React.DragEvent, playerId: 1 | 2, value: number) => {
        playSound('click');
        e.dataTransfer.setData('application/json', JSON.stringify({ playerId, value }));
        e.dataTransfer.effectAllowed = 'move';
        
        if (playerId === 1) setP1(prev => ({ ...prev, selectedCargo: value }));
        else setP2(prev => ({ ...prev, selectedCargo: value }));
    };

    const handleDrop = (e: React.DragEvent, targetPlayerId: 1 | 2) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data.playerId === targetPlayerId && !isNaN(data.value)) {
                handlePack(targetPlayerId, data.value);
            }
        } catch (err) { /* Safely ignore bad drops */ }
    };

    // --- VISUAL COMPONENTS ---
    const Crate = () => (
        <div className="w-full h-full border-[3px] rounded-sm shadow-inner flex items-center justify-center relative overflow-hidden bg-amber-500 border-amber-600">
            <div className="absolute w-[150%] h-[3px] rotate-45 bg-amber-700/40"></div>
            <div className="absolute w-[150%] h-[3px] -rotate-45 bg-amber-700/40"></div>
            <div className="absolute inset-0.5 border rounded-sm border-amber-400/50"></div>
        </div>
    );

    const EmptySlot = () => (
        <div className="w-full h-full border-2 border-dashed border-white/60 rounded-sm bg-blue-900/30"></div>
    );

    const TetrisGrid = ({ filled, isOption, isSuccess }: { filled: number, isOption: boolean, isSuccess?: boolean }) => {
        const slots = Array.from({ length: 10 });
        return (
            <div className="relative w-full h-full">
                <div className={`grid grid-cols-5 grid-rows-2 gap-1 p-1 w-full h-full`}>
                    {slots.map((_, i) => {
                        let showCrate = isOption ? i >= (10 - filled) : (i < filled || (isSuccess && i >= filled));
                        return <div key={i} className="w-full h-full">{showCrate ? <Crate /> : (!isOption && <EmptySlot />)}</div>;
                    })}
                </div>
            </div>
        );
    };

    // --- INDIVIDUAL PLAYER RENDERER ---
    const renderPlayerArea = (playerId: 1 | 2, state: PlayerState) => {
        const isSuccess = state.animState === 'success' || state.animState === 'driving';
        const is2P = numPlayers === 2;

        return (
            <div className={`relative flex flex-col h-full overflow-hidden bg-sky-300 ${is2P && playerId === 1 ? 'border-r-[6px] border-slate-800' : ''} ${is2P ? 'w-1/2' : 'w-full'}`}>
                
                {/* Background Scenery */}
                <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-end">
                    <div className="absolute top-10 left-[10%] w-24 md:w-32 h-8 md:h-10 bg-white/60 rounded-full blur-sm"></div>
                    <div className="absolute top-20 right-[20%] w-32 md:w-48 h-10 md:h-12 bg-white/60 rounded-full blur-sm"></div>
                    <div className="absolute bottom-[20%] left-[-5%] w-[60%] h-[35%] bg-green-500 rounded-t-[100%]"></div>
                    <div className="absolute bottom-[20%] right-[-10%] w-[70%] h-[45%] bg-green-400 rounded-t-[100%]"></div>
                    <div className="w-full h-[25%] bg-slate-800 border-t-[8px] border-slate-600 flex flex-col justify-center shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                        <div className="w-full h-3 bg-[repeating-linear-gradient(90deg,#fff,#fff_40px,transparent_40px,transparent_80px)] opacity-90"></div>
                    </div>
                </div>

                {/* Score UI (Top Right) */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 border-4 border-slate-200 shadow-md z-40">
                    <Truck size={18} className={playerId === 1 ? 'text-sky-500' : 'text-purple-500'} />
                    <span className="font-black text-lg md:text-xl text-slate-700 leading-none">{state.score}</span>
                </div>

                {/* Main Truck Area */}
                <div className="flex-1 w-full relative z-20">
                    {/* Equation Popup */}
                    {isSuccess && state.droppedCargo && (
                        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 bg-white/95 px-6 py-2 rounded-full border-4 border-lime-400 shadow-xl z-50 animate-bounce whitespace-nowrap">
                            <span className="text-2xl md:text-4xl font-black text-slate-700">
                                <span className="text-sky-500">{state.truckFilled}</span> + <span className="text-amber-500">{state.droppedCargo}</span> = <span className="text-lime-500">10</span>
                            </span>
                        </div>
                    )}

                    {/* Truck Engine */}
                    <div className="absolute bottom-[10%] w-full h-[180px] md:h-[220px] flex justify-center items-end"
                         onDragOver={(e) => e.preventDefault()}
                         onDrop={(e) => handleDrop(e, playerId)}
                         onClick={() => state.selectedCargo && handlePack(playerId, state.selectedCargo)}>
                        
                        <div className={`relative origin-bottom transform duration-[4000ms] ease-in-out
                            ${state.truckTransition ? 'transition-all' : 'transition-none'}
                            ${state.truckPosition === 'left' ? '-translate-x-[150vw]' : state.truckPosition === 'right' ? 'translate-x-[150vw]' : 'translate-x-0'}`}>
                            
                            {/* Scaler Wrapper: Prevents truck from overflowing in 2P mode or small mobile */}
                            <div className={`origin-bottom flex items-end justify-center ${is2P ? 'scale-[0.5] lg:scale-[0.7]' : 'scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100'} ${state.flashColor === 'red' ? 'animate-shake' : ''}`}>
                                
                                {/* Target Highlight */}
                                {state.selectedCargo !== null && state.animState === 'idle' && (
                                    <div className="absolute -top-12 bg-amber-400 text-amber-950 font-black px-6 py-2 rounded-full animate-pulse shadow-lg border-2 border-white z-50 whitespace-nowrap">Drop Here!</div>
                                )}

                                {/* Container */}
                                <div className={`w-[320px] h-[130px] rounded-t-xl border-8 z-30 shadow-inner flex items-center justify-center transition-colors overflow-hidden shrink-0 mb-[48px]
                                    ${state.flashColor === 'red' ? 'bg-rose-900 border-rose-500' : state.flashColor === 'green' ? 'bg-lime-600 border-lime-400' : 'bg-blue-900 border-blue-950'}`}>
                                    <TetrisGrid filled={state.truckFilled} isOption={false} isSuccess={isSuccess} />
                                </div>

                                {/* Cabin */}
                                <div className="w-[110px] h-[150px] bg-red-600 rounded-tr-[2rem] border-l-4 border-red-800 shadow-2xl z-20 flex flex-col justify-between ml-2 shrink-0 relative mb-[48px]">
                                    <div className="w-16 h-16 bg-sky-200 mt-3 ml-auto mr-3 rounded-tr-xl rounded-bl-sm border-4 border-slate-800 opacity-90 shadow-inner"></div>
                                    <div className="w-full h-8 bg-slate-800 border-t-2 border-slate-600 rounded-br-md relative">
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-6 bg-yellow-300 rounded-l-full shadow-[10px_0_20px_rgba(253,224,71,0.8)]"></div>
                                    </div>
                                    {is2P && <div className="absolute -top-6 right-2 bg-white px-2 py-0.5 rounded-md text-xs font-black text-slate-800 border-2 border-slate-200 shadow-sm">P{playerId}</div>}
                                </div>

                                {/* Chassis */}
                                <div className="absolute bottom-[20px] left-[-10px] w-[450px] h-8 bg-slate-900 rounded-md border-t-4 border-slate-700 z-10 shadow-xl">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-5 bg-red-500 rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                                </div>

                                {/* Wheels */}
                                <div className="absolute -bottom-[20px] left-10 w-20 h-20 bg-slate-900 rounded-full border-[8px] border-slate-300 shadow-2xl flex items-center justify-center z-40">
                                    <div className="w-8 h-8 bg-slate-700 rounded-full border-4 border-slate-950"></div>
                                </div>
                                <div className="absolute -bottom-[20px] right-14 w-20 h-20 bg-slate-900 rounded-full border-[8px] border-slate-300 shadow-2xl flex items-center justify-center z-40">
                                    <div className="w-8 h-8 bg-slate-700 rounded-full border-4 border-slate-950"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Options Tray (Bottom 35%) */}
                <div className="h-[35%] md:h-[30%] w-full bg-slate-50 border-t-8 border-slate-300 z-30 p-2 md:p-4 flex items-center justify-center shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
                    {/* Grid changes based on 1P vs 2P and Screen Size */}
                    <div className={`grid gap-2 md:gap-4 w-full h-full max-w-4xl mx-auto
                        ${is2P ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
                        {state.options.map((opt, i) => (
                            <div 
                                key={i}
                                draggable={state.animState === 'idle'}
                                onDragStart={(e) => handleDragStart(e, playerId, opt)}
                                onClick={() => {
                                    if (state.animState === 'idle') {
                                        playSound('click');
                                        if (playerId === 1) setP1(prev => ({...prev, selectedCargo: opt}));
                                        else setP2(prev => ({...prev, selectedCargo: opt}));
                                    }
                                }}
                                className={`w-full h-full min-h-[60px] cursor-grab active:cursor-grabbing p-1.5 md:p-3 rounded-xl md:rounded-2xl border-4 transition-all bg-white flex items-center justify-between gap-1 md:gap-4 overflow-hidden
                                    ${state.selectedCargo === opt ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] bg-amber-50 scale-105 z-10' : 'border-slate-200 shadow-sm hover:scale-[1.02]'}`}
                            >
                                <span className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-700 pl-1 md:pl-2 pointer-events-none">{opt}</span>
                                <div className="h-full max-h-[50px] md:max-h-[60px] flex-1 pointer-events-none">
                                    <TetrisGrid filled={opt} isOption={true} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================================
    // RENDER: START SCREEN
    // ============================================================================
    if (phase === 'start') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-sky-50 font-sans">
                <div className="max-w-xl w-full bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border-4 border-sky-200 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="bg-sky-100 p-4 rounded-full text-sky-600 shadow-inner"><Truck size={48} /></div>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">Truck Loader</h1>
                        <p className="text-sm md:text-base text-slate-500 font-medium mt-3 px-4">Pack the blocks to make exactly 10! You have 90 seconds.</p>
                    </div>
                    <div className="flex flex-col gap-3 pt-2">
                        <button onClick={() => startGame(1)} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black text-xl py-4 rounded-2xl shadow-[0_6px_0_rgb(2,132,199)] active:translate-y-2 active:shadow-none transition-all flex justify-center items-center gap-2">
                            <Play size={24} fill="currentColor" /> 1 Player
                        </button>
                        <button onClick={() => startGame(2)} className="hidden md:flex w-full bg-purple-500 hover:bg-purple-400 text-white font-black text-xl py-4 rounded-2xl shadow-[0_6px_0_rgb(147,51,234)] active:translate-y-2 active:shadow-none transition-all justify-center items-center gap-2">
                            <Users size={24} /> 2 Players (Split Screen)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: RESULTS SCREEN
    // ============================================================================
    if (phase === 'result') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-50 font-sans">
                <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border-8 border-slate-200 text-center">
                    <Trophy size={80} className="mx-auto text-amber-500 mb-6 animate-bounce" />
                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 uppercase tracking-tight mb-2">Time's Up!</h2>
                    
                    {numPlayers === 1 ? (
                        <>
                            <p className="text-slate-500 font-bold mb-4 text-lg">You successfully packed</p>
                            <div className="text-7xl font-black text-sky-500 mb-8 drop-shadow-md">{p1.score} Trucks!</div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 mb-8 mt-6">
                            <div className="flex justify-between items-center bg-sky-50 p-4 rounded-xl border-2 border-sky-200">
                                <span className="font-black text-sky-700 text-xl">Player 1</span>
                                <span className="font-black text-3xl text-sky-500">{p1.score}</span>
                            </div>
                            <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                                <span className="font-black text-purple-700 text-xl">Player 2</span>
                                <span className="font-black text-3xl text-purple-500">{p2.score}</span>
                            </div>
                            <div className="text-2xl font-black text-slate-700 mt-2">
                                {p1.score > p2.score ? 'Player 1 Wins!' : p2.score > p1.score ? 'Player 2 Wins!' : 'It\'s a Tie!'}
                            </div>
                        </div>
                    )}

                    <button onClick={() => setPhase('start')} className="w-full bg-lime-500 hover:bg-lime-400 text-white font-black text-2xl py-4 rounded-2xl shadow-[0_6px_0_rgb(101,163,13)] active:translate-y-2 active:shadow-none transition-all mb-4">Play Again</button>
                    {onComplete && <button onClick={onComplete} className="text-slate-400 font-bold hover:text-slate-600 underline">Continue Lesson</button>}
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PLAYING SCREEN
    // ============================================================================
    return (
        <div className="w-full h-full flex font-sans select-none relative min-h-[600px] border-4 border-slate-700 rounded-3xl md:rounded-[2rem] shadow-2xl overflow-hidden">
            
            {/* Global Timer (Always Top Center) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 md:px-6 py-1.5 md:py-2 flex items-center gap-2 border-4 border-slate-200 shadow-md z-50">
                <Timer size={20} className={timeLeft <= 10 ? 'text-rose-500' : 'text-slate-600'} />
                <span className={`font-black text-xl md:text-2xl leading-none ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                    00:{timeLeft.toString().padStart(2, '0')}
                </span>
            </div>

            {/* Split Screen logic handled by mapping */}
            {renderPlayerArea(1, p1)}
            {numPlayers === 2 && renderPlayerArea(2, p2)}
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-15px) rotate(-2deg); }
                    75% { transform: translateX(15px) rotate(2deg); }
                }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}} />
        </div>
    );
}