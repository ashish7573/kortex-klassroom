"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Settings2, CheckCircle2, ArrowRight } from 'lucide-react';

type OpType = 'add' | 'add_carry' | 'sub' | 'sub_borrow' | 'mult' | 'div';
type RangeType = '10' | '20' | '100';

export default function MathCrosswordQuiz({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<'config' | 'playing'>('config');
    
    // Config State
    const [selectedOps, setSelectedOps] = useState<OpType[]>(['add', 'sub']);
    const [selectedRange, setSelectedRange] = useState<RangeType>('20');
    
    // Game State
    const [gridData, setGridData] = useState<any>(null);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<'idle' | 'correct'>('idle');
    
    // Timer State
    const [startTime, setStartTime] = useState<number>(0);
    const [timeTaken, setTimeTaken] = useState<number>(0);

    const hasMultDiv = selectedOps.includes('mult') || selectedOps.includes('div');

    // Automatically force range to 100 if Mult/Div is selected
    useEffect(() => {
        if (hasMultDiv && selectedRange !== '100') {
            setSelectedRange('100');
        }
    }, [selectedOps, hasMultDiv, selectedRange]);

    // --- Audio Engine ---
    const audioCtx = useRef<AudioContext | null>(null);
    const playSound = (type: 'pop' | 'kaching' | 'error' | 'click' | 'whoosh') => {
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
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
            } else if (type === 'kaching') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
            } else if (type === 'error') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
            } else if (type === 'whoosh') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
            }
            
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + (type === 'kaching' ? 0.4 : 0.2));
        } catch(e) {}
    };

    // --- Procedural Generation Engine (Strict Boundaries) ---
    const generatePool = (ops: OpType[], range: RangeType) => {
        const pool: {a: number, op: string, b: number, c: number}[] = [];
        const max = parseInt(range);
        
        for (let a = 1; a <= max; a++) {
            for (let b = 1; b <= max; b++) {
                // Strict Addition: a, b, c all <= max
                let cAdd = a + b;
                if (cAdd <= max) {
                    const isCarry = (a % 10 + b % 10 >= 10);
                    if (ops.includes('add') && !isCarry) pool.push({a, op:'+', b, c: cAdd});
                    if (ops.includes('add_carry') && isCarry) pool.push({a, op:'+', b, c: cAdd});
                }

                // Strict Subtraction: a, b, c all <= max (we do a - b = c)
                let cSub = a - b;
                if (cSub >= 0 && a <= max) {
                    const isBorrow = (a % 10 < b % 10);
                    if (ops.includes('sub') && !isBorrow) pool.push({a, op:'-', b, c: cSub});
                    if (ops.includes('sub_borrow') && isBorrow) pool.push({a, op:'-', b, c: cSub});
                }

                // Strict Multiplication: a, b, c all <= max
                if (a >= 2 && b >= 2) { // Prevent trivial 1x tables from taking over the puzzle
                    let cMult = a * b;
                    if (cMult <= max) {
                        if (ops.includes('mult')) pool.push({a, op:'×', b, c: cMult});
                    }
                }

                // Strict Division: a, b, c all <= max
                if (b >= 2 && a % b === 0) {
                    let cDiv = a / b;
                    if (cDiv >= 2 && a <= max) { // Prevent trivial /1 or =1 answers
                        if (ops.includes('div')) pool.push({a, op:'÷', b, c: cDiv});
                    }
                }
            }
        }
        return pool;
    };

    const buildPuzzle = () => {
        const pool = generatePool(selectedOps, selectedRange);
        if (pool.length === 0) {
            alert("No equations possible with these settings! Try selecting more operations.");
            return false;
        }

        let bestGrid = new Map();
        let minX=0, maxX=0, minY=0, maxY=0;
        let placedEqs: any[] = [];

        // Try up to 50 times to build a nice interlocking grid
        for (let attempt = 0; attempt < 50; attempt++) {
            const grid = new Map();
            const placed = [];
            let currMinX=0, currMaxX=4, currMinY=0, currMaxY=0;

            const addEq = (eq: any, startX: number, startY: number, isHoriz: boolean) => {
                const tokens = [eq.a, eq.op, eq.b, '=', eq.c];
                for (let i = 0; i < 5; i++) {
                    const x = startX + (isHoriz ? i : 0);
                    const y = startY + (isHoriz ? 0 : i);
                    grid.set(`${x},${y}`, { val: tokens[i], isOp: i%2 !== 0 });
                    currMinX = Math.min(currMinX, x); currMaxX = Math.max(currMaxX, x);
                    currMinY = Math.min(currMinY, y); currMaxY = Math.max(currMaxY, y);
                }
                placed.push({ eq, x: startX, y: startY, isHoriz });
            };

            // 1. Seed the grid
            addEq(pool[Math.floor(Math.random() * pool.length)], 0, 0, true);

            let failedAttempts = 0;
            // 2. Grow branches
            while (placed.length < 6 && failedAttempts < 100) {
                const p = placed[Math.floor(Math.random() * placed.length)];
                const numIdx = [0, 2, 4][Math.floor(Math.random() * 3)]; 
                
                const intersectX = p.x + (p.isHoriz ? numIdx : 0);
                const intersectY = p.y + (p.isHoriz ? 0 : numIdx);
                const targetVal = [p.eq.a, p.eq.b, p.eq.c][numIdx/2];

                const candidates = pool.filter(e => e.a === targetVal || e.b === targetVal || e.c === targetVal);
                if (candidates.length === 0) { failedAttempts++; continue; }
                const cand = candidates[Math.floor(Math.random() * candidates.length)];
                
                const candPos = cand.a === targetVal ? 0 : cand.b === targetVal ? 2 : 4;
                const newIsHoriz = !p.isHoriz;
                const startX = intersectX - (newIsHoriz ? candPos : 0);
                const startY = intersectY - (newIsHoriz ? 0 : candPos);

                // Bound check (keep it compact)
                if (startX < -8 || startX+5 > 8 || startY < -8 || startY+5 > 8) { failedAttempts++; continue; }

                let collision = false;
                const tokens = [cand.a, cand.op, cand.b, '=', cand.c];
                for (let i = 0; i < 5; i++) {
                    const x = startX + (newIsHoriz ? i : 0);
                    const y = startY + (newIsHoriz ? 0 : i);
                    const key = `${x},${y}`;
                    
                    if (grid.has(key)) {
                        if (grid.get(key).val !== tokens[i]) { collision = true; break; }
                    } else {
                        // Prevent side-by-side touching to keep crossword legible
                        const neighbors = newIsHoriz ? [[x, y-1], [x, y+1]] : [[x-1, y], [x+1, y]];
                        for (const [nx, ny] of neighbors) {
                            if (grid.has(`${nx},${ny}`)) { collision = true; break; }
                        }
                    }
                    if(collision) break;
                }

                if (!collision) addEq(cand, startX, startY, newIsHoriz);
                else failedAttempts++;
            }

            if (placed.length >= 4) {
                bestGrid = grid;
                placedEqs = placed;
                minX = currMinX; maxX = currMaxX; minY = currMinY; maxY = currMaxY;
                break;
            }
        }

        if (placedEqs.length < 3) {
            alert("Could not generate a good puzzle with current settings. Try selecting more operations.");
            return false;
        }

        // 3. Hide Numbers to create the puzzle inputs
        const inputsObj: Record<string, any> = {};
        placedEqs.forEach(p => {
            const numIdx = [0, 2, 4][Math.floor(Math.random() * 3)];
            const x = p.x + (p.isHoriz ? numIdx : 0);
            const y = p.y + (p.isHoriz ? 0 : numIdx);
            const normKey = `${x - minX},${y - minY}`;
            const targetVal = [p.eq.a, p.eq.b, p.eq.c][numIdx/2];
            inputsObj[normKey] = targetVal.toString();
        });

        const normalizedGrid: any[][] = [];
        for (let y = minY; y <= maxY; y++) {
            const row = [];
            for (let x = minX; x <= maxX; x++) {
                const cell = bestGrid.get(`${x},${y}`);
                const isInput = !!inputsObj[`${x - minX},${y - minY}`];
                row.push(cell ? { ...cell, isInput, expected: isInput ? cell.val.toString() : null } : null);
            }
            normalizedGrid.push(row);
        }

        setGridData({
            matrix: normalizedGrid,
            inputsMap: inputsObj,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        });
        
        setUserAnswers({});
        setFeedback('idle');
        setStartTime(Date.now());
        return true;
    };

    const handleStart = () => {
        playSound('whoosh');
        if(buildPuzzle()) setPhase('playing');
    };

    const toggleOp = (op: OpType) => {
        playSound('click');
        if (selectedOps.includes(op)) {
            if (selectedOps.length > 1) setSelectedOps(selectedOps.filter(o => o !== op));
        } else {
            setSelectedOps([...selectedOps, op]);
        }
    };

    // --- Auto-Check Engine ---
    useEffect(() => {
        if (phase === 'playing' && gridData && feedback !== 'correct') {
            const keys = Object.keys(gridData.inputsMap);
            if (keys.length > 0) {
                const allCorrect = keys.every(key => userAnswers[key] === gridData.inputsMap[key]);
                if (allCorrect) {
                    playSound('kaching');
                    setFeedback('correct');
                    setTimeTaken(Math.floor((Date.now() - startTime) / 1000));
                }
            }
        }
    }, [userAnswers, gridData, phase, feedback, startTime]);

    // ============================================================================
    // RENDER: CONFIGURATION
    // ============================================================================
    if (phase === 'config') {
        const opConfig = [
            { id: 'add', label: 'Addition', icon: '+', color: 'bg-emerald-500' },
            { id: 'add_carry', label: 'Addition (Carry)', icon: '++', color: 'bg-teal-500' },
            { id: 'sub', label: 'Subtraction', icon: '−', color: 'bg-rose-500' },
            { id: 'sub_borrow', label: 'Sub (Borrow)', icon: '−−', color: 'bg-pink-500' },
            { id: 'mult', label: 'Multiplication', icon: '×', color: 'bg-amber-500' },
            { id: 'div', label: 'Division', icon: '÷', color: 'bg-sky-500' }
        ];

        return (
            <div className="w-full h-full min-h-[500px] flex flex-col bg-slate-900 font-sans md:rounded-3xl p-6 relative overflow-hidden">
                <div className="text-center mb-8 shrink-0 relative z-10">
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">Math Puzzle Maker</h1>
                    <p className="text-slate-400 font-bold">Select the operations you want to practice!</p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-8 z-10">
                    
                    <div className="w-full">
                        <h3 className="text-slate-300 font-black uppercase tracking-widest text-sm mb-4 text-center">1. Select Operations</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {opConfig.map(op => {
                                const isActive = selectedOps.includes(op.id as OpType);
                                return (
                                    <button 
                                        key={op.id} onClick={() => toggleOp(op.id as OpType)}
                                        className={`p-3 rounded-2xl border-4 transition-all flex items-center gap-3
                                            ${isActive ? `${op.color} border-white shadow-lg scale-105` : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-700'}`}>{op.icon}</div>
                                        <span className={`font-bold text-sm text-left leading-tight ${isActive ? 'text-white' : ''}`}>{op.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-full">
                        <h3 className="text-slate-300 font-black uppercase tracking-widest text-sm mb-4 text-center">2. Select Difficulty Range</h3>
                        <div className="flex gap-3 justify-center">
                            {['10', '20', '100'].map(r => {
                                const isDisabled = hasMultDiv && r !== '100';
                                return (
                                    <button 
                                        key={r} 
                                        disabled={isDisabled}
                                        onClick={() => { playSound('click'); setSelectedRange(r as RangeType); }}
                                        className={`px-6 py-4 rounded-2xl border-4 transition-all font-black text-lg md:text-xl
                                            ${selectedRange === r ? 'bg-sky-500 border-white text-white shadow-lg scale-110' : 
                                              isDisabled ? 'bg-slate-800/50 border-slate-700/50 text-slate-600/50 cursor-not-allowed' : 
                                              'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                    >
                                        Up to {r}
                                    </button>
                                )
                            })}
                        </div>
                        {hasMultDiv && (
                            <p className="text-amber-400 font-bold text-xs text-center mt-4 animate-fade-in">
                                * Multiplication & Division require the "Up to 100" range to build a valid puzzle grid.
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-center z-10 shrink-0">
                    <button onClick={handleStart} className="bg-lime-500 text-slate-950 px-10 py-5 rounded-2xl font-black text-xl md:text-2xl shadow-[0_6px_0_rgb(101,163,13)] hover:bg-lime-400 active:translate-y-[6px] active:shadow-none transition-all flex items-center gap-3">
                        <Play fill="currentColor" /> Generate Puzzle
                    </button>
                </div>

                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PLAYING
    // ============================================================================
    if (phase === 'playing' && gridData) {
        
        const formatTime = (seconds: number) => {
            if (seconds < 60) return `${seconds} seconds`;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}m ${secs}s`;
        };

        return (
            <div className="w-full h-full flex flex-col bg-slate-900 font-sans md:rounded-3xl overflow-hidden relative">
                
                {/* Floating Settings Button */}
                <div className="absolute top-4 left-4 z-40">
                    <button 
                        onClick={() => { setPhase('config'); setFeedback('idle'); }} 
                        className="bg-slate-800 text-slate-300 p-3 rounded-xl hover:bg-slate-700 hover:text-white border-2 border-slate-600 shadow-lg transition-colors flex items-center justify-center"
                        title="Settings"
                    >
                        <Settings2 size={24}/>
                    </button>
                </div>

                {/* Main Crossword Grid (Completely unconstrained center-scrolling) */}
                <div className="flex-1 w-full h-full overflow-auto bg-slate-900 hide-scrollbar p-4 pt-20 md:p-8 flex flex-col relative">
                    <div 
                        className="m-auto grid gap-[2px] md:gap-1 p-2 md:p-3 bg-slate-700/50 rounded-2xl md:rounded-[2rem] border-4 border-slate-700 shadow-2xl relative z-10"
                        style={{ 
                            gridTemplateColumns: `repeat(${gridData.width}, minmax(40px, 64px))`
                        }}
                    >
                        {gridData.matrix.map((row: any[], y: number) => (
                            row.map((cell: any, x: number) => {
                                const key = `${x},${y}`;
                                
                                if (!cell) return <div key={key} className="aspect-square"></div>;

                                if (cell.isInput) {
                                    const val = userAnswers[key] || '';
                                    const expected = cell.expected;
                                    
                                    // Real-Time Highlighting Logic
                                    let borderStyle = 'border-slate-500 bg-slate-800 text-sky-400 focus:border-sky-400 focus:shadow-[0_0_15px_rgba(56,189,248,0.3)]';
                                    
                                    if (val !== '') {
                                        if (val === expected) {
                                            borderStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                                        } else {
                                            borderStyle = 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
                                        }
                                    }

                                    return (
                                        <input 
                                            key={key}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={3}
                                            value={val}
                                            disabled={feedback === 'correct'}
                                            onChange={(e) => {
                                                playSound('pop');
                                                const numericVal = e.target.value.replace(/[^0-9]/g, '');
                                                setUserAnswers(prev => ({ ...prev, [key]: numericVal }));
                                            }}
                                            className={`w-full aspect-square text-center font-black text-xl md:text-3xl border-2 md:border-4 rounded-lg md:rounded-xl outline-none transition-all ${borderStyle}`}
                                        />
                                    );
                                }

                                return (
                                    <div key={key} className={`w-full aspect-square flex items-center justify-center font-black text-xl md:text-3xl rounded-lg md:rounded-xl shadow-sm border-2 md:border-4 border-slate-600 bg-slate-100 ${cell.isOp ? 'text-slate-400' : 'text-slate-700'}`}>
                                        {cell.val}
                                    </div>
                                );
                            })
                        ))}
                    </div>

                    {/* Success Overlay */}
                    {feedback === 'correct' && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-fade-in p-6 text-center">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.6)] animate-bounce bg-emerald-500 text-white mb-6">
                                <CheckCircle2 size={64}/>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">Puzzle Solved!</h2>
                            <p className="text-lg md:text-2xl font-bold text-slate-300 mb-8">Clear Time: <span className="text-emerald-400">{formatTime(timeTaken)}</span></p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
                                <button 
                                    onClick={() => { setPhase('config'); setFeedback('idle'); }}
                                    className="flex-1 bg-slate-700 text-white px-6 py-4 rounded-xl font-black text-sm md:text-lg tracking-wide hover:bg-slate-600 transition-all active:scale-95 border-2 border-slate-600"
                                >
                                    Back to Menu
                                </button>
                                <button 
                                    onClick={handleStart}
                                    className="flex-1 bg-sky-500 text-white px-6 py-4 rounded-xl font-black text-sm md:text-lg tracking-wide hover:bg-sky-400 shadow-[0_4px_0_rgb(14,165,233)] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    Next Puzzle <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}