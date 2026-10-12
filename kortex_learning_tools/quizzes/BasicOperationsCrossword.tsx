"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Settings2, CheckCircle2, ArrowRight, Volume2, RotateCcw, Award, Sparkles, Delete, CornerDownLeft, RefreshCw, ArrowLeft } from 'lucide-react';

type OpType = 'add' | 'add_carry' | 'sub' | 'sub_borrow' | 'mult' | 'div';
type RangeType = '10' | '20' | '100';

interface PlacedEquation {
    id: string;
    dir: 'across' | 'down';
    startX: number;
    startY: number;
    tokens: (number | string)[];
    a: number;
    op: string;
    b: number;
    c: number;
    hiddenIdx: number; // 0 (a), 2 (b), or 4 (c)
}

interface GridCell {
    val: number | string;
    isOp: boolean;
    isInput: boolean;
    expected: string | null;
    eqIds: string[];
}

export default function MathCrosswordQuiz({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<'config' | 'playing' | 'completed'>('config');
    
    // Config State
    const [selectedOps, setSelectedOps] = useState<OpType[]>(['add', 'sub']);
    const [selectedRange, setSelectedRange] = useState<RangeType>('20');
    
    // Quiz & Session State
    const [puzzleIndex, setPuzzleIndex] = useState(0);
    const TOTAL_PUZZLES = 5;
    const [score, setScore] = useState(0);
    
    // Puzzle Game State
    const [gridData, setGridData] = useState<{
        matrix: (GridCell | null)[][];
        width: number;
        height: number;
        equations: PlacedEquation[];
        inputsMap: Record<string, string>;
    } | null>(null);

    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
    const [activeDir, setActiveDir] = useState<'across' | 'down'>('across');
    const [feedback, setFeedback] = useState<'idle' | 'solved'>('idle');
    
    // Timer State
    const [startTime, setStartTime] = useState<number>(0);
    const [timeTaken, setTimeTaken] = useState<number>(0);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const hasMultDiv = selectedOps.includes('mult') || selectedOps.includes('div');

    // Automatically force range to 100 if Mult/Div is selected
    useEffect(() => {
        if (hasMultDiv && selectedRange !== '100') {
            setSelectedRange('100');
        }
    }, [selectedOps, hasMultDiv, selectedRange]);

    // --- Audio Engine ---
    const audioCtx = useRef<AudioContext | null>(null);
    const playSound = (type: 'pop' | 'kaching' | 'error' | 'click' | 'whoosh' | 'magic') => {
        if (!soundEnabled || typeof window === 'undefined') return;
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
                gain.gain.setValueAtTime(0.06, ctx.currentTime);
            } else if (type === 'kaching') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(900, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.35);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
            } else if (type === 'error') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(160, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
            } else if (type === 'whoosh') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(320, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
            } else if (type === 'click') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(500, ctx.currentTime);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
            } else if (type === 'magic') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(700, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.25);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
            }
            
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + (type === 'kaching' ? 0.4 : 0.25));
        } catch(e) {}
    };

    const speak = (text: string) => {
        if (!soundEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(text);
            msg.rate = 0.9;
            window.speechSynthesis.speak(msg);
        } catch(e) {}
    };

    // --- Procedural Generation Engine ---
    const generatePool = (ops: OpType[], range: RangeType) => {
        const pool: {a: number, op: string, b: number, c: number}[] = [];
        const max = parseInt(range);
        
        for (let a = 1; a <= max; a++) {
            for (let b = 1; b <= max; b++) {
                // Strict Addition: a, b, c all <= max
                const cAdd = a + b;
                if (cAdd <= max) {
                    const isCarry = (a % 10 + b % 10 >= 10);
                    if (ops.includes('add') && !isCarry) pool.push({a, op:'+', b, c: cAdd});
                    if (ops.includes('add_carry') && isCarry) pool.push({a, op:'+', b, c: cAdd});
                }

                // Strict Subtraction: a, b, c all <= max (a - b = c)
                const cSub = a - b;
                if (cSub >= 0 && a <= max) {
                    const isBorrow = (a % 10 < b % 10);
                    if (ops.includes('sub') && !isBorrow) pool.push({a, op:'−', b, c: cSub});
                    if (ops.includes('sub_borrow') && isBorrow) pool.push({a, op:'−', b, c: cSub});
                }

                // Strict Multiplication: a, b, c all <= max
                if (a >= 2 && b >= 2) {
                    const cMult = a * b;
                    if (cMult <= max) {
                        if (ops.includes('mult')) pool.push({a, op:'×', b, c: cMult});
                    }
                }

                // Strict Division: a, b, c all <= max
                if (b >= 2 && a % b === 0) {
                    const cDiv = a / b;
                    if (cDiv >= 2 && a <= max) {
                        if (ops.includes('div')) pool.push({a, op:'÷', b, c: cDiv});
                    }
                }
            }
        }
        return pool;
    };

    // Build Interlocking Puzzle Grid Strictly Bounded within 7x7 (Zero Scroll)
    const buildPuzzle = () => {
        const pool = generatePool(selectedOps, selectedRange);
        if (pool.length === 0) {
            // Safe fallback equations if pool is empty
            pool.push({ a: 4, op: '+', b: 5, c: 9 });
            pool.push({ a: 9, op: '−', b: 3, c: 6 });
            pool.push({ a: 6, op: '+', b: 2, c: 8 });
        }

        const MAX_SPAN = 7; // Guarantee compact 7x7 maximum bounding box for zero scrolling
        let bestGrid = new Map<string, { val: number | string; isOp: boolean; eqIds: string[] }>();
        let minX = 0, maxX = 4, minY = 0, maxY = 0;
        let placedList: { eq: { a: number, op: string, b: number, c: number }, x: number, y: number, isHoriz: boolean, id: string }[] = [];

        // Attempt procedural branch placement
        for (let attempt = 0; attempt < 40; attempt++) {
            const grid = new Map<string, { val: number | string; isOp: boolean; eqIds: string[] }>();
            const placed: { eq: { a: number, op: string, b: number, c: number }, x: number, y: number, isHoriz: boolean, id: string }[] = [];
            let currMinX = 0, currMaxX = 4, currMinY = 0, currMaxY = 0;

            const addEq = (eq: any, startX: number, startY: number, isHoriz: boolean) => {
                const eqId = `eq-${placed.length + 1}`;
                const tokens = [eq.a, eq.op, eq.b, '=', eq.c];
                for (let i = 0; i < 5; i++) {
                    const x = startX + (isHoriz ? i : 0);
                    const y = startY + (isHoriz ? 0 : i);
                    const key = `${x},${y}`;
                    const existing = grid.get(key);
                    grid.set(key, { 
                        val: tokens[i], 
                        isOp: i % 2 !== 0,
                        eqIds: existing ? [...existing.eqIds, eqId] : [eqId]
                    });
                    currMinX = Math.min(currMinX, x); currMaxX = Math.max(currMaxX, x);
                    currMinY = Math.min(currMinY, y); currMaxY = Math.max(currMaxY, y);
                }
                placed.push({ eq, x: startX, y: startY, isHoriz, id: eqId });
            };

            // Seed root equation
            const seed = pool[Math.floor(Math.random() * pool.length)];
            addEq(seed, 0, 0, true);

            let failed = 0;
            while (placed.length < 4 && failed < 60) {
                const parent = placed[Math.floor(Math.random() * placed.length)];
                const numIdx = [0, 2, 4][Math.floor(Math.random() * 3)];
                const intersectX = parent.x + (parent.isHoriz ? numIdx : 0);
                const intersectY = parent.y + (parent.isHoriz ? 0 : numIdx);
                const targetVal = [parent.eq.a, parent.eq.b, parent.eq.c][numIdx / 2];

                // Filter candidates containing targetVal at any position
                const candidates = pool.filter(e => e.a === targetVal || e.b === targetVal || e.c === targetVal);
                if (candidates.length === 0) { failed++; continue; }
                const cand = candidates[Math.floor(Math.random() * candidates.length)];
                
                const candPos = cand.a === targetVal ? 0 : cand.b === targetVal ? 2 : 4;
                const newIsHoriz = !parent.isHoriz;
                const startX = intersectX - (newIsHoriz ? candPos : 0);
                const startY = intersectY - (newIsHoriz ? 0 : candPos);

                // Strict Bounding Box check: Width and height must never exceed MAX_SPAN
                const testMinX = Math.min(currMinX, startX);
                const testMaxX = Math.max(currMaxX, startX + (newIsHoriz ? 4 : 0));
                const testMinY = Math.min(currMinY, startY);
                const testMaxY = Math.max(currMaxY, startY + (newIsHoriz ? 0 : 4));

                if (testMaxX - testMinX + 1 > MAX_SPAN || testMaxY - testMinY + 1 > MAX_SPAN) {
                    failed++;
                    continue;
                }

                // Collision and adjacency check
                let collision = false;
                const tokens = [cand.a, cand.op, cand.b, '=', cand.c];
                for (let i = 0; i < 5; i++) {
                    const x = startX + (newIsHoriz ? i : 0);
                    const y = startY + (newIsHoriz ? 0 : i);
                    const key = `${x},${y}`;

                    if (grid.has(key)) {
                        if (grid.get(key)!.val !== tokens[i]) { collision = true; break; }
                    } else {
                        // Prevent accidental touching of non-intersecting parallel equations
                        const neighbors = newIsHoriz ? [[x, y - 1], [x, y + 1]] : [[x - 1, y], [x + 1, y]];
                        for (const [nx, ny] of neighbors) {
                            if (grid.has(`${nx},${ny}`)) { collision = true; break; }
                        }
                    }
                    if (collision) break;
                }

                if (!collision) {
                    addEq(cand, startX, startY, newIsHoriz);
                } else {
                    failed++;
                }
            }

            if (placed.length >= 3) {
                bestGrid = grid;
                placedList = placed;
                minX = currMinX; maxX = currMaxX; minY = currMinY; maxY = currMaxY;
                break;
            }
        }

        // Guaranteed Fallback Template if random branching was unlucky
        if (placedList.length < 3) {
            bestGrid = new Map();
            placedList = [];
            minX = 0; maxX = 4; minY = 0; maxY = 4;

            // Template: Cross with 2-3 equations
            const e1 = pool[Math.floor(Math.random() * pool.length)];
            const e2Candidates = pool.filter(e => e.a === e1.c || e.c === e1.c);
            const e2 = e2Candidates.length > 0 ? e2Candidates[0] : { a: e1.c, op: '−', b: Math.max(1, Math.floor(e1.c / 2)), c: e1.c - Math.max(1, Math.floor(e1.c / 2)) };

            const tokens1 = [e1.a, e1.op, e1.b, '=', e1.c];
            for (let i = 0; i < 5; i++) {
                bestGrid.set(`${i},0`, { val: tokens1[i], isOp: i % 2 !== 0, eqIds: ['eq-1'] });
            }
            placedList.push({ eq: e1, x: 0, y: 0, isHoriz: true, id: 'eq-1' });

            const tokens2 = [e2.a, e2.op, e2.b, '=', e2.c];
            const startY = e2.a === e1.c ? 0 : -4;
            minY = Math.min(minY, startY); maxY = Math.max(maxY, startY + 4);
            for (let i = 0; i < 5; i++) {
                const key = `4,${startY + i}`;
                const existing = bestGrid.get(key);
                bestGrid.set(key, { 
                    val: tokens2[i], 
                    isOp: i % 2 !== 0, 
                    eqIds: existing ? [...existing.eqIds, 'eq-2'] : ['eq-2'] 
                });
            }
            placedList.push({ eq: e2, x: 4, y: startY, isHoriz: false, id: 'eq-2' });
        }

        // Determine input blanks: strictly ensure NO equation has more than 1 hidden blank initially!
        // This guarantees that in every equation, at least 2 numbers are available and only 1 is missing.
        const inputsObj: Record<string, string> = {};
        const placedEquations: PlacedEquation[] = [];
        const hiddenKeys = new Set<string>();

        placedList.forEach((p) => {
            const numPositions = [
                { idx: 0, x: p.x, y: p.y, val: p.eq.a },
                { idx: 2, x: p.x + (p.isHoriz ? 2 : 0), y: p.y + (p.isHoriz ? 0 : 2), val: p.eq.b },
                { idx: 4, x: p.x + (p.isHoriz ? 4 : 0), y: p.y + (p.isHoriz ? 0 : 4), val: p.eq.c },
            ];

            // Check if any number in this equation is already hidden from an intersection
            const existingHidden = numPositions.find(pos => {
                const normKey = `${pos.x - minX},${pos.y - minY}`;
                return hiddenKeys.has(normKey);
            });

            let chosenIdx: number;

            if (existingHidden) {
                // This equation already shares a hidden variable at its intersection.
                // Do not hide any more numbers in this equation!
                chosenIdx = existingHidden.idx;
            } else {
                // None of its numbers are hidden yet. Pick one number to hide.
                // CRITICAL: We only pick a candidate if NO other equation passing through it already has a hidden key!
                const safeCandidates = numPositions.filter(pos => {
                    const rawKey = `${pos.x},${pos.y}`;
                    const cell = bestGrid.get(rawKey);
                    if (!cell) return true;
                    for (const eqId of cell.eqIds) {
                        if (eqId === p.id) continue;
                        const otherPlaced = placedList.find(pl => pl.id === eqId);
                        if (!otherPlaced) continue;
                        const otherPositions = [
                            `${otherPlaced.x - minX},${otherPlaced.y - minY}`,
                            `${otherPlaced.x + (otherPlaced.isHoriz ? 2 : 0) - minX},${otherPlaced.y + (otherPlaced.isHoriz ? 0 : 2) - minY}`,
                            `${otherPlaced.x + (otherPlaced.isHoriz ? 4 : 0) - minX},${otherPlaced.y + (otherPlaced.isHoriz ? 0 : 4) - minY}`,
                        ];
                        if (otherPositions.some(k => hiddenKeys.has(k))) {
                            return false;
                        }
                    }
                    return true;
                });

                const poolToPick = safeCandidates.length > 0 ? safeCandidates : numPositions;
                const candidate = poolToPick[Math.floor(Math.random() * poolToPick.length)];
                const normKey = `${candidate.x - minX},${candidate.y - minY}`;
                hiddenKeys.add(normKey);
                inputsObj[normKey] = candidate.val.toString();
                chosenIdx = candidate.idx;
            }

            placedEquations.push({
                id: p.id,
                dir: p.isHoriz ? 'across' : 'down',
                startX: p.x - minX,
                startY: p.y - minY,
                tokens: [p.eq.a, p.eq.op, p.eq.b, '=', p.eq.c],
                a: p.eq.a,
                op: p.eq.op,
                b: p.eq.b,
                c: p.eq.c,
                hiddenIdx: chosenIdx
            });
        });

        const normW = maxX - minX + 1;
        const normH = maxY - minY + 1;
        const normalizedMatrix: (GridCell | null)[][] = [];

        for (let y = minY; y <= maxY; y++) {
            const row: (GridCell | null)[] = [];
            for (let x = minX; x <= maxX; x++) {
                const cell = bestGrid.get(`${x},${y}`);
                const normKey = `${x - minX},${y - minY}`;
                const isInput = !!inputsObj[normKey];

                if (cell) {
                    row.push({
                        val: cell.val,
                        isOp: cell.isOp,
                        isInput,
                        expected: isInput ? cell.val.toString() : null,
                        eqIds: cell.eqIds
                    });
                } else {
                    row.push(null);
                }
            }
            normalizedMatrix.push(row);
        }

        setGridData({
            matrix: normalizedMatrix,
            width: normW,
            height: normH,
            equations: placedEquations,
            inputsMap: inputsObj
        });

        setUserAnswers({});
        setFeedback('idle');
        setStartTime(Date.now());

        // DO NOT highlight or ring any equation on our own initially!
        // Wait until the child taps a cell or number.
        setSelectedCellKey(null);
        return true;
    };

    const handleStart = () => {
        playSound('whoosh');
        setPuzzleIndex(0);
        setScore(0);
        if (buildPuzzle()) {
            setPhase('playing');
        }
    };

    const handleNextPuzzle = () => {
        playSound('whoosh');
        if (puzzleIndex + 1 < TOTAL_QUESTIONS_COUNT) {
            setPuzzleIndex(prev => prev + 1);
            buildPuzzle();
        } else {
            setPhase('completed');
            playSound('kaching');
            speak("Incredible! You completed all math crosswords!");
            onComplete?.({ score: score + 1, maxScore: TOTAL_PUZZLES });
        }
    };

    const TOTAL_QUESTIONS_COUNT = TOTAL_PUZZLES;

    const toggleOp = (op: OpType) => {
        playSound('click');
        if (selectedOps.includes(op)) {
            if (selectedOps.length > 1) setSelectedOps(selectedOps.filter(o => o !== op));
        } else {
            setSelectedOps([...selectedOps, op]);
        }
    };

    // Helper to evaluate solvability of an equation:
    // Available = Given constant OR already solved input.
    // Missing = Unsolved input blank.
    // An equation is solvable when 2 numbers are available and 1 is missing!
    const getEquationSolvability = useCallback((eq: PlacedEquation) => {
        const numKeys = [
            `${eq.startX},${eq.startY}`,
            `${eq.startX + (eq.dir === 'across' ? 2 : 0)},${eq.startY + (eq.dir === 'across' ? 0 : 2)}`,
            `${eq.startX + (eq.dir === 'across' ? 4 : 0)},${eq.startY + (eq.dir === 'across' ? 0 : 4)}`
        ];

        let availableCount = 0;
        let missingCount = 0;

        numKeys.forEach(k => {
            const isInput = !!gridData?.inputsMap[k];
            const isSolved = isInput && userAnswers[k] === gridData?.inputsMap[k];
            if (!isInput || isSolved) {
                availableCount++;
            } else {
                missingCount++;
            }
        });

        return { 
            availableCount, 
            missingCount, 
            isSolvable: availableCount === 2 && missingCount === 1 
        };
    }, [gridData, userAnswers]);

    // Find active equation based on selected cell:
    // Strictly highlights the equation where two variables are available and one is missing!
    const getActiveEquation = useCallback((): PlacedEquation | null => {
        if (!gridData || !selectedCellKey) return null;
        const [x, y] = selectedCellKey.split(',').map(Number);

        // Find all equations passing through this cell
        const equationsThroughCell = gridData.equations.filter(e => {
            if (e.dir === 'across') return e.startY === y && x >= e.startX && x < e.startX + 5;
            return e.startX === x && y >= e.startY && y < e.startY + 5;
        });

        if (equationsThroughCell.length === 0) return null;

        // Check for solvable equations (2 available, 1 missing)
        const solvableEquations = equationsThroughCell.filter(e => getEquationSolvability(e).isSolvable);

        if (solvableEquations.length > 0) {
            const matchingSolvable = solvableEquations.find(e => e.dir === activeDir);
            return matchingSolvable || solvableEquations[0];
        }

        const matchingEq = equationsThroughCell.find(e => e.dir === activeDir);
        return matchingEq || equationsThroughCell[0];
    }, [gridData, selectedCellKey, activeDir, getEquationSolvability]);

    const activeEquation = getActiveEquation();

    // Check if cell is an intersection of 2 equations
    const isIntersection = (key: string): boolean => {
        if (!gridData) return false;
        const [x, y] = key.split(',').map(Number);
        const cell = gridData.matrix[y]?.[x];
        return (cell?.eqIds.length || 0) > 1;
    };

    // Toggle Across / Down direction
    const toggleDirection = () => {
        playSound('click');
        if (!selectedCellKey || !gridData) {
            setActiveDir(prev => prev === 'across' ? 'down' : 'across');
            return;
        }
        const [x, y] = selectedCellKey.split(',').map(Number);
        const cell = gridData.matrix[y]?.[x];
        if (cell && cell.eqIds.length > 1) {
            setActiveDir(prev => prev === 'across' ? 'down' : 'across');
        } else {
            const otherDir = activeDir === 'across' ? 'down' : 'across';
            const otherEqs = gridData.equations.filter(e => e.dir === otherDir);
            const solvableOther = otherEqs.find(e => getEquationSolvability(e).isSolvable) || otherEqs[0];
            if (solvableOther) {
                setActiveDir(otherDir);
                const numKeys = [
                    `${solvableOther.startX},${solvableOther.startY}`,
                    `${solvableOther.startX + (solvableOther.dir === 'across' ? 2 : 0)},${solvableOther.startY + (solvableOther.dir === 'across' ? 0 : 2)}`,
                    `${solvableOther.startX + (solvableOther.dir === 'across' ? 4 : 0)},${solvableOther.startY + (solvableOther.dir === 'across' ? 0 : 4)}`
                ];
                const missingKey = numKeys.find(k => !!gridData.inputsMap[k] && userAnswers[k] !== gridData.inputsMap[k]);
                setSelectedCellKey(missingKey || numKeys[0]);
            }
        }
    };

    // Unified cell click handler:
    // When the child taps any cell, highlights the equation where 2 variables are available and 1 is missing!
    const handleCellClick = (key: string) => {
        playSound('click');
        if (!gridData) return;
        const [x, y] = key.split(',').map(Number);

        // Find all equations passing through this cell
        const equationsThroughCell = gridData.equations.filter(e => {
            if (e.dir === 'across') return e.startY === y && x >= e.startX && x < e.startX + 5;
            return e.startX === x && y >= e.startY && y < e.startY + 5;
        });

        if (equationsThroughCell.length === 0) return;

        // If this cell belongs to current active equation and has multiple crossing equations, toggle direction!
        const inCurrentEq = activeEquation && (
            activeEquation.dir === 'across'
                ? (activeEquation.startY === y && x >= activeEquation.startX && x < activeEquation.startX + 5)
                : (activeEquation.startX === x && y >= activeEquation.startY && y < activeEquation.startY + 5)
        );

        if (inCurrentEq && equationsThroughCell.length > 1 && selectedCellKey) {
            const otherDir = activeDir === 'across' ? 'down' : 'across';
            const otherEq = equationsThroughCell.find(e => e.dir === otherDir);
            if (otherEq) {
                setActiveDir(otherDir);
                const numKeys = [
                    `${otherEq.startX},${otherEq.startY}`,
                    `${otherEq.startX + (otherEq.dir === 'across' ? 2 : 0)},${otherEq.startY + (otherEq.dir === 'across' ? 0 : 2)}`,
                    `${otherEq.startX + (otherEq.dir === 'across' ? 4 : 0)},${otherEq.startY + (otherEq.dir === 'across' ? 0 : 4)}`
                ];
                const missingKey = numKeys.find(k => !!gridData.inputsMap[k] && userAnswers[k] !== gridData.inputsMap[k]);
                setSelectedCellKey(missingKey || key);
                return;
            }
        }

        // Prioritize the equation where two variables are available and one is not available!
        const solvableEqs = equationsThroughCell.filter(e => getEquationSolvability(e).isSolvable);

        let chosenEq: PlacedEquation;
        if (solvableEqs.length > 0) {
            chosenEq = solvableEqs.find(e => e.dir === activeDir) || solvableEqs[0];
        } else {
            chosenEq = equationsThroughCell.find(e => e.dir === activeDir) || equationsThroughCell[0];
        }

        setActiveDir(chosenEq.dir);

        // Focus the input blank of that equation
        if (gridData.inputsMap[key]) {
            setSelectedCellKey(key);
        } else {
            const numKeys = [
                `${chosenEq.startX},${chosenEq.startY}`,
                `${chosenEq.startX + (chosenEq.dir === 'across' ? 2 : 0)},${chosenEq.startY + (chosenEq.dir === 'across' ? 0 : 2)}`,
                `${chosenEq.startX + (chosenEq.dir === 'across' ? 4 : 0)},${chosenEq.startY + (chosenEq.dir === 'across' ? 0 : 4)}`
            ];
            const missingKey = numKeys.find(k => !!gridData.inputsMap[k] && userAnswers[k] !== gridData.inputsMap[k]);
            setSelectedCellKey(missingKey || key);
        }
    };

    // Advance to next unsolved cell
    const advanceToNextEmpty = (currentKey?: string) => {
        if (!gridData) return;
        const keys = Object.keys(gridData.inputsMap);
        const currentIndex = currentKey ? keys.indexOf(currentKey) : -1;
        
        // Find next empty key starting from current
        for (let i = 1; i <= keys.length; i++) {
            const nextKey = keys[(currentIndex + i) % keys.length];
            if (!userAnswers[nextKey] || userAnswers[nextKey] !== gridData.inputsMap[nextKey]) {
                handleCellClick(nextKey);
                return;
            }
        }
    };

    // Handle user entering a character into active cell
    const handleCellInput = (val: string, keyOverride?: string) => {
        const key = keyOverride || selectedCellKey;
        if (!key || !gridData || feedback === 'solved') return;

        const cleanVal = val.replace(/[^0-9]/g, '').slice(0, 3);
        const expected = gridData.inputsMap[key];

        setUserAnswers(prev => ({ ...prev, [key]: cleanVal }));

        if (cleanVal === expected) {
            playSound('pop');
            // Auto advance
            advanceToNextEmpty(key);
        } else if (cleanVal.length >= (expected?.length || 1) && cleanVal !== expected) {
            playSound('error');
        } else {
            playSound('click');
        }
    };

    // Backspace / Clear current cell
    const handleBackspace = () => {
        if (!selectedCellKey || feedback === 'solved') return;
        playSound('click');
        setUserAnswers(prev => {
            const cur = prev[selectedCellKey] || '';
            if (cur.length > 0) {
                return { ...prev, [selectedCellKey]: cur.slice(0, -1) };
            }
            return prev;
        });
    };

    // Handle physical keyboard arrow navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!selectedCellKey || !gridData || feedback === 'solved') return;
        const [x, y] = selectedCellKey.split(',').map(Number);

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            for (let nextX = x + 1; nextX < gridData.width; nextX++) {
                if (gridData.matrix[y]?.[nextX]?.isInput) {
                    setSelectedCellKey(`${nextX},${y}`);
                    setActiveDir('across');
                    break;
                }
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            for (let prevX = x - 1; prevX >= 0; prevX--) {
                if (gridData.matrix[y]?.[prevX]?.isInput) {
                    setSelectedCellKey(`${prevX},${y}`);
                    setActiveDir('across');
                    break;
                }
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            for (let nextY = y + 1; nextY < gridData.height; nextY++) {
                if (gridData.matrix[nextY]?.[x]?.isInput) {
                    setSelectedCellKey(`${x},${nextY}`);
                    setActiveDir('down');
                    break;
                }
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            for (let prevY = y - 1; prevY >= 0; prevY--) {
                if (gridData.matrix[prevY]?.[x]?.isInput) {
                    setSelectedCellKey(`${x},${prevY}`);
                    setActiveDir('down');
                    break;
                }
            }
        } else if (e.key === 'Backspace') {
            handleBackspace();
        } else if (e.key === 'Tab' || e.key === 'Enter') {
            e.preventDefault();
            advanceToNextEmpty(selectedCellKey);
        } else if (/^[0-9]$/.test(e.key)) {
            const curVal = userAnswers[selectedCellKey] || '';
            handleCellInput(curVal + e.key);
        }
    };

    // Auto-check completion
    useEffect(() => {
        if (phase === 'playing' && gridData && feedback !== 'solved') {
            const keys = Object.keys(gridData.inputsMap);
            if (keys.length > 0) {
                const allCorrect = keys.every(key => userAnswers[key] === gridData.inputsMap[key]);
                if (allCorrect) {
                    playSound('kaching');
                    setFeedback('solved');
                    setScore(s => s + 1);
                    setTimeTaken(Math.max(1, Math.floor((Date.now() - startTime) / 1000)));
                    speak("Puzzle Solved! Great job!");
                }
            }
        }
    }, [userAnswers, gridData, phase, feedback, startTime]);

    // Format seconds into clean readable string
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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
            <div className="w-full h-full flex flex-col bg-slate-900 font-sans text-white select-none overflow-hidden relative p-3 sm:p-5">
                {/* Header */}
                <div className="text-center shrink-0 mb-3 sm:mb-5">
                    <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                        <Sparkles className="text-amber-400" size={24} />
                        Math Operations Crossword
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">Solve interlocking math puzzles (5 Puzzles)</p>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full gap-4 sm:gap-6 min-h-0 overflow-y-auto">
                    {/* Operations */}
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 text-center">1. Select Operations</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {opConfig.map(op => {
                                const isActive = selectedOps.includes(op.id as OpType);
                                return (
                                    <button 
                                        key={op.id} 
                                        onClick={() => toggleOp(op.id as OpType)}
                                        className={`p-2.5 rounded-xl border-2 transition-all flex items-center gap-2 cursor-pointer active:scale-95
                                            ${isActive ? `${op.color} border-white shadow-md text-white` : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-sm ${isActive ? 'bg-white/20 text-white' : 'bg-slate-700'}`}>{op.icon}</div>
                                        <span className="font-bold text-xs truncate leading-none">{op.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Range */}
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 text-center">2. Number Range</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {(['10', '20', '100'] as RangeType[]).map(r => {
                                const isDisabled = hasMultDiv && r !== '100';
                                return (
                                    <button 
                                        key={r} 
                                        disabled={isDisabled}
                                        onClick={() => { playSound('click'); setSelectedRange(r); }}
                                        className={`py-2.5 px-3 rounded-xl border-2 transition-all font-black text-xs sm:text-sm cursor-pointer active:scale-95
                                            ${selectedRange === r ? 'bg-sky-500 border-white text-white shadow-md' : 
                                              isDisabled ? 'bg-slate-800/40 border-slate-700/50 text-slate-600 cursor-not-allowed' : 
                                              'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        Up to {r}
                                    </button>
                                );
                            })}
                        </div>
                        {hasMultDiv && (
                            <p className="text-amber-400 font-bold text-[11px] text-center mt-2">
                                * Multiplication & Division require Up to 100 range.
                            </p>
                        )}
                    </div>

                    {/* Start Button */}
                    <button 
                        onClick={handleStart} 
                        className="w-full bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-sm sm:text-base py-3 sm:py-3.5 rounded-xl shadow-md border-b-4 border-lime-700 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                        <Play fill="currentColor" size={18}/> START CROSSWORD
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: VICTORY SCREEN
    // ============================================================================
    if (phase === 'completed') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 font-sans text-white p-3 sm:p-5 select-none overflow-hidden">
                <div className="max-w-md w-full bg-slate-800/95 p-5 sm:p-7 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-slate-700 shadow-xl text-center space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-400/20 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-inner border-2 border-amber-400">
                        <Award className="w-9 h-9 sm:w-11 sm:h-11" />
                    </div>

                    <div>
                        <h2 className="text-xl sm:text-3xl font-black text-white">Crossword Master!</h2>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">You solved interlocking math equations!</p>
                    </div>

                    <div className="bg-slate-900/80 py-3 px-4 rounded-xl border border-slate-700 flex items-center justify-around">
                        <div className="text-center">
                            <span className="text-xs text-slate-400 font-bold uppercase block">Puzzles Solved</span>
                            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{score} / {TOTAL_PUZZLES}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-700"></div>
                        <div className="text-center">
                            <span className="text-xs text-slate-400 font-bold uppercase block">Accuracy</span>
                            <span className="text-2xl sm:text-3xl font-black text-sky-400">100% ⭐</span>
                        </div>
                    </div>

                    <div className="flex gap-2.5 pt-1">
                        <button 
                            onClick={handleStart}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl border-2 border-slate-600 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <RotateCcw size={15} /> Play Again
                        </button>
                        {onComplete && (
                            <button 
                                onClick={() => onComplete({ score: TOTAL_PUZZLES, maxScore: TOTAL_PUZZLES })}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl border-b-3 border-emerald-700 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                                <CheckCircle2 size={16} /> Finish Lesson
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: PLAYING PHASE (100% Zero-Scroll Viewport Responsive)
    // ============================================================================
    if (!gridData) return null;

    return (
        <div 
            className="w-full h-full flex flex-col bg-slate-900 font-sans text-white select-none overflow-hidden relative"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* 1. TOP HEADER (h-11 sm:h-12 shrink-0) */}
            <div className="h-11 sm:h-12 w-full bg-slate-800/90 border-b border-slate-700 px-2 sm:px-4 flex items-center justify-between shrink-0 z-30">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button 
                        onClick={() => setPhase('config')} 
                        className="bg-slate-700/80 hover:bg-slate-600 text-slate-300 p-1.5 rounded-lg border border-slate-600 active:scale-95 transition-all cursor-pointer"
                        title="Back to Configuration"
                    >
                        <Settings2 size={15} />
                    </button>
                    <span className="text-[10px] sm:text-xs font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                        Puzzle {puzzleIndex + 1}/{TOTAL_PUZZLES}
                    </span>
                    <div className="hidden sm:flex gap-1">
                        {Array.from({ length: TOTAL_PUZZLES }).map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-2 h-2 rounded-full transition-colors ${i < puzzleIndex ? 'bg-emerald-500' : i === puzzleIndex ? 'bg-sky-400 ring-2 ring-sky-200' : 'bg-slate-700'}`} 
                            />
                        ))}
                    </div>
                </div>

                {/* Score & Audio */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button 
                        onClick={() => {
                            if (activeEquation) {
                                const aText = activeEquation.hiddenIdx === 0 ? "what" : activeEquation.a;
                                const bText = activeEquation.hiddenIdx === 2 ? "what" : activeEquation.b;
                                const cText = activeEquation.hiddenIdx === 4 ? "what" : activeEquation.c;
                                speak(`${activeEquation.dir}: ${aText} ${activeEquation.op} ${bText} equals ${cText}`);
                            }
                        }}
                        className="bg-slate-700/80 hover:bg-slate-600 text-slate-300 p-1.5 rounded-lg border border-slate-600 active:scale-95 transition-all cursor-pointer"
                        title="Read Active Equation Clue"
                    >
                        <Volume2 size={15} />
                    </button>
                    <div className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-black rounded-lg text-[10px] sm:text-xs">
                        Score: {score}
                    </div>
                </div>
            </div>

            {/* 2. ACTIVE CLUE BANNER (h-10 sm:h-11 shrink-0) */}
            <div className="h-10 sm:h-11 bg-slate-950/80 border-b border-slate-800 px-3 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-2 overflow-hidden">
                    {/* Direction Toggle Pill - visible only when an equation is highlighted */}
                    {activeEquation && (
                        <button 
                            onClick={toggleDirection}
                            className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-black text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                            title="Click to toggle direction"
                        >
                            <span>{activeEquation.dir === 'across' ? '➔' : '⬇'}</span>
                        </button>
                    )}

                    {/* Active Equation Clue (Never reveals the answer!) */}
                    {activeEquation ? (
                        <div className="flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm text-slate-300">
                            <span className="text-amber-300 font-black hidden sm:inline">
                                {activeEquation.dir === 'across' ? 'Across:' : 'Down:'}
                            </span>
                            <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-700">
                                {/* Token 0: A */}
                                {activeEquation.hiddenIdx === 0 ? (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-black border border-amber-400/60 shadow-xs">
                                        {userAnswers[`${activeEquation.startX},${activeEquation.startY}`] || '?'}
                                    </span>
                                ) : (
                                    <span className="text-white font-black">{activeEquation.a}</span>
                                )}
                                
                                <span className="text-amber-400 font-black">{activeEquation.op}</span>

                                {/* Token 2: B */}
                                {activeEquation.hiddenIdx === 2 ? (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-black border border-amber-400/60 shadow-xs">
                                        {userAnswers[`${activeEquation.startX + (activeEquation.dir === 'across' ? 2 : 0)},${activeEquation.startY + (activeEquation.dir === 'across' ? 0 : 2)}`] || '?'}
                                    </span>
                                ) : (
                                    <span className="text-white font-black">{activeEquation.b}</span>
                                )}

                                <span className="text-slate-400 font-black">=</span>

                                {/* Token 4: C */}
                                {activeEquation.hiddenIdx === 4 ? (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-black border border-amber-400/60 shadow-xs">
                                        {userAnswers[`${activeEquation.startX + (activeEquation.dir === 'across' ? 4 : 0)},${activeEquation.startY + (activeEquation.dir === 'across' ? 0 : 4)}`] || '?'}
                                    </span>
                                ) : (
                                    <span className="text-white font-black">{activeEquation.c}</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-amber-300/80 font-medium">👉 Tap any number to start solving</span>
                    )}
                </div>

                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden md:block">
                    {activeEquation ? "Solve the highlighted ringed equation" : "Tap any number to highlight equation"}
                </div>
            </div>

            {/* 3. MAIN WORKSPACE: ZERO-SCROLL CENTERED PUZZLE & TOUCH PAD */}
            <div className="flex-1 min-h-0 w-full flex flex-col md:flex-row items-center justify-center p-2 sm:p-3 gap-2 sm:gap-4 overflow-hidden relative">
                
                {/* Crossword Grid Container */}
                <div className="flex-1 min-h-0 w-full h-full flex items-center justify-center overflow-hidden">
                    <div 
                        className="grid gap-1 sm:gap-1.5 p-2 sm:p-2.5 bg-slate-950/70 rounded-2xl border-2 border-slate-800 shadow-2xl relative select-none"
                        style={{ 
                            gridTemplateColumns: `repeat(${gridData.width}, minmax(0, 1fr))`,
                            gridTemplateRows: `repeat(${gridData.height}, minmax(0, 1fr))`,
                            width: `min(${gridData.width * 52}px, 92vw, calc((100vh - 210px) * ${gridData.width / gridData.height}))`,
                            aspectRatio: `${gridData.width} / ${gridData.height}`,
                            maxWidth: '100%',
                            maxHeight: '100%'
                        }}
                    >
                        {/* Active Equation Ring: Continuous glowing pill border encircling the entire 5 cells */}
                        {activeEquation && (
                            <div 
                                className="pointer-events-none rounded-xl sm:rounded-2xl border-3 sm:border-4 border-amber-400 ring-4 ring-amber-400/30 bg-amber-400/10 shadow-[0_0_30px_rgba(251,191,36,0.6)] z-20 transition-all duration-300 relative"
                                style={{
                                    gridColumnStart: activeEquation.startX + 1,
                                    gridColumnEnd: activeEquation.startX + (activeEquation.dir === 'across' ? 6 : 2),
                                    gridRowStart: activeEquation.startY + 1,
                                    gridRowEnd: activeEquation.startY + (activeEquation.dir === 'across' ? 2 : 6),
                                }}
                            >
                                <span className="absolute -top-3 left-2 px-1.5 py-0.5 bg-amber-400 text-slate-950 text-xs font-black rounded-full shadow-md flex items-center justify-center leading-none">
                                    {activeEquation.dir === 'across' ? '➔' : '⬇'}
                                </span>
                            </div>
                        )}

                        {gridData.matrix.map((row, y) => (
                            row.map((cell, x) => {
                                const key = `${x},${y}`;
                                
                                if (!cell) {
                                    return (
                                        <div 
                                            key={key} 
                                            style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                                            className="w-full h-full aspect-square"
                                        />
                                    );
                                }

                                const isSelected = selectedCellKey === key;
                                const inActiveEq = activeEquation && (
                                    activeEquation.dir === 'across' 
                                        ? (activeEquation.startY === y && x >= activeEquation.startX && x < activeEquation.startX + 5)
                                        : (activeEquation.startX === x && y >= activeEquation.startY && y < activeEquation.startY + 5)
                                );

                                if (cell.isInput) {
                                    const val = userAnswers[key] || '';
                                    const isCorrect = val !== '' && val === cell.expected;
                                    const isWrong = val !== '' && !isCorrect;

                                    let cellStyle = 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500';
                                    if (inActiveEq) {
                                        cellStyle = 'bg-slate-800 text-amber-300 border-amber-400/70 shadow-sm';
                                    }
                                    if (isSelected) {
                                        cellStyle = 'bg-amber-400/25 text-amber-300 border-amber-400 ring-2 ring-white shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse';
                                    }
                                    if (isCorrect) {
                                        cellStyle = 'bg-emerald-500/25 text-emerald-400 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
                                    } else if (isWrong) {
                                        cellStyle = 'bg-rose-500/25 text-rose-400 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
                                    }

                                    return (
                                        <div 
                                            key={key}
                                            style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                                            onClick={() => handleCellClick(key)}
                                            className={`w-full h-full aspect-square flex items-center justify-center font-black text-sm sm:text-base md:text-xl rounded-lg md:rounded-xl border-2 cursor-pointer transition-all select-none relative z-10 ${cellStyle}`}
                                        >
                                            <span>{val !== '' ? val : '?'}</span>
                                            {isIntersection(key) && (
                                                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400/70"></span>
                                            )}
                                        </div>
                                    );
                                }

                                if (cell.isOp) {
                                    return (
                                        <div 
                                            key={key} 
                                            style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                                            onClick={() => handleCellClick(key)}
                                            className={`w-full h-full aspect-square flex items-center justify-center font-black text-sm sm:text-base md:text-xl rounded-lg md:rounded-xl border z-10 cursor-pointer transition-all ${inActiveEq ? 'border-amber-400/50 bg-slate-800 text-amber-300 shadow-xs' : 'border-slate-800 bg-slate-950/60 text-slate-500 hover:border-slate-700'}`}
                                        >
                                            {cell.val}
                                        </div>
                                    );
                                }

                                // Non-input given number cell
                                return (
                                    <div 
                                        key={key}
                                        style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                                        onClick={() => handleCellClick(key)}
                                        className={`w-full h-full aspect-square flex items-center justify-center font-black text-sm sm:text-base md:text-xl rounded-lg md:rounded-xl border-2 transition-all cursor-pointer z-10
                                            ${inActiveEq 
                                                ? 'bg-slate-100 text-slate-900 border-amber-400/80 shadow-md ring-1 ring-amber-300' 
                                                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500 shadow-xs'}`}
                                    >
                                        {cell.val}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                </div>

                {/* Adaptive Child-Friendly Touch Keypad (Compact Dock) */}
                <div className="w-full md:w-52 shrink-0 flex flex-col items-center justify-center bg-slate-950/70 p-2 sm:p-2.5 rounded-2xl border border-slate-800">
                    <div className="grid grid-cols-5 md:grid-cols-3 gap-1.5 w-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => {
                                    const cur = selectedCellKey ? (userAnswers[selectedCellKey] || '') : '';
                                    handleCellInput(cur + num.toString());
                                }}
                                className="h-8 sm:h-9 md:h-11 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-xs sm:text-sm md:text-base border border-slate-700 shadow-xs flex items-center justify-center cursor-pointer transition-all"
                            >
                                {num}
                            </button>
                        ))}
                        
                        {/* Backspace Button */}
                        <button
                            type="button"
                            onClick={handleBackspace}
                            className="h-8 sm:h-9 md:h-11 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-300 font-bold text-xs border border-slate-700 shadow-xs flex items-center justify-center cursor-pointer transition-all"
                            title="Delete digit"
                        >
                            <Delete size={14} />
                        </button>

                        {/* Next Unsolved Cell Button */}
                        <button
                            type="button"
                            onClick={() => advanceToNextEmpty(selectedCellKey || undefined)}
                            className="h-8 sm:h-9 md:h-11 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs border border-sky-500 shadow-xs flex items-center justify-center cursor-pointer transition-all"
                            title="Next blank cell"
                        >
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. FOOTER ACTION BAR (h-10 sm:h-11 shrink-0) */}
            <div className="h-10 sm:h-11 bg-slate-800/95 border-t border-slate-700 px-3 flex items-center justify-between shrink-0 z-30">
                <div className="text-xs text-slate-300 font-medium flex items-center gap-2">
                    {feedback === 'solved' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle2 size={15} />
                            🎉 Puzzle Solved in {formatTime(timeTaken)}!
                        </span>
                    ) : (
                        <span>Deduce the missing numbers to balance every equation</span>
                    )}
                </div>

                {feedback === 'solved' ? (
                    <button
                        onClick={handleNextPuzzle}
                        className="px-4 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                    >
                        <span>{puzzleIndex + 1 < TOTAL_QUESTIONS_COUNT ? 'Next Puzzle' : 'Finish Lesson'}</span>
                        <ArrowRight size={14} />
                    </button>
                ) : (
                    <button
                        onClick={() => advanceToNextEmpty()}
                        className="text-[11px] text-slate-400 hover:text-white bg-slate-700/60 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-600 transition-all cursor-pointer"
                    >
                        Next Blank ➔
                    </button>
                )}
            </div>
        </div>
    );
}