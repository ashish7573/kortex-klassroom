"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Rocket, Bug, Heart, ChevronLeft, ChevronRight, Play, Users, Trophy, X, Zap, Monitor, Hash, RotateCcw, Settings } from 'lucide-react';

// --- DYNAMIC MATH GENERATOR ---
const generateQuestion = (type: string, digits: number) => {
  let a = 0, b = 0, answer = 0, text = "";
  
  // Helper to get min/max based on digit count
  const getMinMax = (d: number) => ({
    min: d === 1 ? 1 : Math.pow(10, d - 1),
    max: Math.pow(10, d) - 1
  });
  
  const { min, max } = getMinMax(digits);
  const rand = (mn: number, mx: number) => Math.floor(Math.random() * (mx - mn + 1)) + mn;

  switch (type) {
    case 'add_no_carry': {
      // Builds numbers digit-by-digit to mathematically guarantee NO carries
      let aStr = "", bStr = "";
      for (let i = 0; i < digits; i++) {
        aStr += rand(1, 4);
        bStr += rand(1, 4);
      }
      a = parseInt(aStr); b = parseInt(bStr);
      answer = a + b;
      text = `${a} + ${b}`;
      break;
    }
    case 'add_carry': {
      a = rand(min, max);
      b = rand(min, max);
      answer = a + b;
      text = `${a} + ${b}`;
      break;
    }
    case 'sub_no_carry': {
       // Builds numbers digit-by-digit to mathematically guarantee NO borrowing
      let aStr = "", bStr = "";
      for (let i = 0; i < digits; i++) {
        aStr += rand(5, 9);
        bStr += rand(1, 4);
      }
      a = parseInt(aStr); b = parseInt(bStr);
      answer = a - b;
      text = `${a} - ${b}`;
      break;
    }
    case 'sub_carry': {
      a = rand(min, max);
      b = rand(min, max);
      // Ensure 'a' is always bigger so we don't get negative numbers
      if (a < b) { const temp = a; a = b; b = temp; }
      answer = a - b;
      text = `${a} - ${b}`;
      break;
    }
    case 'mul': {
      a = rand(min, max);
      // Keep the multiplier to 1 digit if they select 1, otherwise match digits
      b = digits === 1 ? rand(2, 9) : rand(min, max);
      answer = a * b;
      text = `${a} × ${b}`;
      break;
    }
    case 'div': {
      b = rand(min, max);
      // Keep division mental-math friendly by making the answer 1-digit
      answer = rand(2, 9); 
      a = b * answer;
      text = `${a} ÷ ${b}`;
      break;
    }
    default:
      a = 1; b = 1; answer = 1; text = "1x1";
  }
  return { text, answer: answer.toString() };
};

// --- CONSTANTS & CONFIG ---
const COLORS = [
  { ship: 'text-blue-400', glow: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]', bg: 'bg-blue-900/30', border: 'border-blue-500/50', noShadow: 'text-blue-400' },
  { ship: 'text-emerald-400', glow: 'drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]', bg: 'bg-emerald-900/30', border: 'border-emerald-500/50', noShadow: 'text-emerald-400' },
  { ship: 'text-pink-400', glow: 'drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]', bg: 'bg-pink-900/30', border: 'border-pink-500/50', noShadow: 'text-pink-400' },
  { ship: 'text-orange-400', glow: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]', bg: 'bg-orange-900/30', border: 'border-orange-500/50', noShadow: 'text-orange-400' },
];

const OPERATIONS = [
  { id: 'add_no_carry', label: 'Addition (No Carry)' },
  { id: 'add_carry', label: 'Addition (With Carry)' },
  { id: 'sub_no_carry', label: 'Subtraction (No Borrow)' },
  { id: 'sub_carry', label: 'Subtraction (With Borrow)' },
  { id: 'mul', label: 'Multiplication' },
  { id: 'div', label: 'Division' },
];

export default function MathDefenders({ lesson, onComplete }: any) {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu'); 
  const [config, setConfig] = useState({ ops: 'mul', digits: 1, players: 1, isHD: true });
  const [players, setPlayers] = useState<any[]>([]);
  
  const stateRef = useRef<any[]>([]);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // --- AUDIO SYNTHESIS ENGINE ---
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playSound = (type: 'laser' | 'explosion' | 'charge' | 'damage' | 'click' | 'gameover') => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'explosion') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'charge') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'damage') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'gameover') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  // --- GAME ENGINE LOOP ---
  const gameLoop = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;

    if (deltaTime >= 16) {
      let anyAlive = false;
      const currentPlayers = stateRef.current;

      const updatedPlayers = currentPlayers.map(p => {
        if (p.isDead) return p;
        anyAlive = true;

        let newShipX = p.shipX;
        if (p.moving !== 0) {
          newShipX = Math.max(5, Math.min(95, p.shipX + p.moving * 1.5));
        }

        // Fast responsive lasers
        let newMissiles = p.missiles.map((m: any) => ({ ...m, y: m.y - 3.2 })).filter((m: any) => m.y > 0);
        // Descent speed adjusted to ~15s descent
        let newEnemies = p.enemies.map((e: any) => ({ ...e, y: e.y + 0.08 }));
        
        let newLives = p.lives;
        let newScore = p.score;

        const survivingEnemies: any[] = [];
        newEnemies.forEach((e: any) => {
          if (e.y >= 90) {
            newLives -= 1;
            playSound('damage');
          } else {
            survivingEnemies.push(e);
          }
        });
        newEnemies = survivingEnemies;

        const hitEnemyIds = new Set();
        const hitMissileIds = new Set();

        newMissiles.forEach((m: any) => {
          newEnemies.forEach((e: any) => {
            if (!hitEnemyIds.has(e.id) && !hitMissileIds.has(m.id)) {
              if (Math.abs(m.x - e.x) < 9 && Math.abs(m.y - e.y) < 9) {
                hitEnemyIds.add(e.id);
                hitMissileIds.add(m.id);
                newScore += 10;
                playSound('explosion');
              }
            }
          });
        });

        newMissiles = newMissiles.filter((m: any) => !hitMissileIds.has(m.id));
        newEnemies = newEnemies.filter((e: any) => !hitEnemyIds.has(e.id));

        if (Math.random() < 0.022 && newEnemies.length < 5) {
          newEnemies.push({ id: Math.random().toString(), x: Math.floor(Math.random() * 80) + 10, y: 0 });
        }

        return { ...p, shipX: newShipX, missiles: newMissiles, enemies: newEnemies, lives: newLives, score: newScore, isDead: newLives <= 0 };
      });

      stateRef.current = updatedPlayers;
      setPlayers(updatedPlayers);
      lastTimeRef.current = time;

      if (!anyAlive && updatedPlayers.length > 0) {
        playSound('gameover');
        setGameState("gameover");
        return;
      }
    }
    
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
       if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [gameState, gameLoop]);

  // Ensure mobile view defaults to 1 player and clamps if screen is small
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        setConfig(c => (c.players > 1 ? { ...c, players: 1 } : c));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- ACTIONS ---
  const startGame = () => {
    playSound('laser');
    const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    const activePlayerCount = isMobileScreen ? 1 : config.players;
    const initPlayers = Array.from({ length: activePlayerCount }, (_, i) => ({
      id: i, lives: 3, score: 0, question: generateQuestion(config.ops, config.digits), input: "",
      shipX: 50, moving: 0, missiles: [], enemies: [], isDead: false, theme: COLORS[i]
    }));
    stateRef.current = initPlayers;
    setPlayers(initPlayers);
    setGameState('playing');
  };

  const updatePlayerAction = (pId: number, updater: any) => {
    if (gameState !== 'playing') return;
    
    stateRef.current = stateRef.current.map(p => {
      if (p.id === pId && !p.isDead) return updater(p);
      return p;
    });
  };

  const handleNumpad = (pId: number, key: string) => {
    playSound('click');
    updatePlayerAction(pId, (p: any) => {
      let newInput = p.input;
      if (key === 'del') newInput = newInput.slice(0, -1);
      else if (key === 'clear') newInput = "";
      else if (newInput.length < 5) newInput += key;

      if (newInput === p.question.answer) {
        playSound('charge');
      }
      return { ...p, input: newInput };
    });
  };

  // --- MULTI-TOUCH DRAG SLIDER HANDLERS (Isolated per pointerId for 4 concurrent players) ---
  const updateShipPositionFromPointer = (e: React.PointerEvent<HTMLDivElement>, pId: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const clickX = e.clientX - rect.left;
    const clampedPercent = Math.max(5, Math.min(95, (clickX / rect.width) * 100));
    
    updatePlayerAction(pId, (p: any) => ({
      ...p,
      shipX: clampedPercent,
      moving: 0
    }));
  };

  const handleSliderPointerDown = (e: React.PointerEvent<HTMLDivElement>, pId: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateShipPositionFromPointer(e, pId);
  };

  const handleSliderPointerMove = (e: React.PointerEvent<HTMLDivElement>, pId: number) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateShipPositionFromPointer(e, pId);
  };

  const handleSliderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleLaunch = (pId: number) => {
    updatePlayerAction(pId, (p: any) => {
      if (p.input === p.question.answer) {
        playSound('laser');
        return { 
          ...p, 
          input: "", 
          question: generateQuestion(config.ops, config.digits), 
          missiles: [...p.missiles, { id: Math.random().toString(), x: p.shipX, y: 85 }] 
        };
      }
      return p;
    });
  };

  // --- RENDERERS ---
  if (gameState === 'menu') {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 font-sans text-slate-200 select-none overflow-y-auto">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-4 sm:p-6 shadow-2xl my-auto animate-in zoom-in-95 duration-200">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-1">Math Defenders</h1>
            <p className="text-slate-400 font-bold text-xs sm:text-sm">Arcade Space Arithmetic Defense</p>
          </div>

          <div className="mb-4 flex justify-center">
             <div className="bg-slate-800 p-1 rounded-xl inline-flex border border-slate-700 shadow-inner">
                <button 
                  onClick={() => { playSound('click'); setConfig(c => ({ ...c, isHD: true })); }} 
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${config.isHD ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Zap size={14} /> HD Graphics
                </button>
                <button 
                  onClick={() => { playSound('click'); setConfig(c => ({ ...c, isHD: false })); }} 
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${!config.isHD ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Monitor size={14} /> Performance
                </button>
             </div>
          </div>

          <div className="mb-4 sm:mb-5">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Rocket className="text-blue-400 w-4 h-4"/> Select Mission
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {OPERATIONS.map(op => (
                <button
                  key={op.id} 
                  onClick={() => { playSound('click'); setConfig(c => ({ ...c, ops: op.id })); }}
                  className={`p-2 rounded-xl border text-left font-semibold text-xs sm:text-sm transition-all ${config.ops === op.id ? 'bg-blue-600/30 border-blue-400 text-blue-300 shadow-sm' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 text-slate-300'}`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 sm:mb-5">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Hash className="text-yellow-400 w-4 h-4"/> Difficulty (Digits)
            </h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num} 
                  onClick={() => { playSound('click'); setConfig(c => ({ ...c, digits: num })); }}
                  className={`flex-1 py-1.5 sm:py-2 rounded-xl border text-sm sm:text-base font-black transition-all ${config.digits === num ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-sm' : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-400'}`}
                >
                  {num} {num === 1 ? 'Digit' : 'Digits'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 sm:mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="text-green-400 w-4 h-4"/> Select Players
              </h2>
              <span className="text-[11px] text-slate-500 font-semibold sm:hidden">
                1 Player (Solo) on mobile
              </span>
            </div>
            <div className="flex gap-2">
              {/* 1 Player (Always available) */}
              <button
                onClick={() => { playSound('click'); setConfig(c => ({ ...c, players: 1 })); }}
                className={`flex-1 py-1.5 sm:py-2 rounded-xl border text-sm sm:text-base font-black transition-all flex items-center justify-center gap-1.5 ${config.players === 1 ? 'bg-green-500/20 border-green-400 text-green-300 shadow-sm' : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-400'}`}
              >
                <span>1P</span>
                <span className="sm:hidden text-xs font-bold text-slate-400">(Single Player)</span>
              </button>

              {/* 2P, 3P, 4P - Hidden on small screen / mobile */}
              {[2, 3, 4].map(num => (
                <button
                  key={num} 
                  onClick={() => { playSound('click'); setConfig(c => ({ ...c, players: num })); }}
                  className={`hidden sm:flex flex-1 py-1.5 sm:py-2 rounded-xl border text-sm sm:text-base font-black transition-all items-center justify-center ${config.players === num ? 'bg-green-500/20 border-green-400 text-green-300 shadow-sm' : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-400'}`}
                >
                  {num}P
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-1.5 hidden sm:block">
              Multi-player (2–4 players) supports simultaneous multi-touch on smartboards & tablets.
            </p>
          </div>

          <button 
            onClick={startGame} 
            className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-lg sm:text-xl shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
          >
            <Play fill="currentColor" className="w-5 h-5" /> INITIATE LAUNCH
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const topScore = sorted.length > 0 ? sorted[0].score : 0;

    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 font-sans select-none overflow-y-auto">
        <div className="max-w-md w-full bg-slate-900 border-2 sm:border-4 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center my-auto animate-in zoom-in-95 duration-200">
          <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-400 mx-auto mb-3 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-1 uppercase tracking-tight">Mission Over</h1>
          <p className="text-slate-400 text-xs sm:text-sm font-semibold mb-6">Space defense report filed.</p>
          
          <div className="space-y-2.5 mb-6 max-h-[40vh] overflow-y-auto pr-1">
            {sorted.map((p, idx) => (
              <div key={p.id} className={`flex justify-between items-center p-3 sm:p-3.5 rounded-2xl border ${p.theme.bg} ${p.theme.border} shadow-sm`}>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono font-bold text-sm">#{idx + 1}</span>
                  <span className={`text-base sm:text-lg font-black ${p.theme.ship}`}>Player {p.id + 1} {idx === 0 && '👑'}</span>
                </div>
                <span className="text-xl sm:text-2xl font-mono font-black text-white">{p.score} <span className="text-xs font-normal text-slate-400">pts</span></span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button 
              onClick={() => { playSound('click'); setGameState('menu'); }} 
              className="flex-1 py-3 sm:py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-base transition-all flex items-center justify-center gap-2 border border-slate-700 active:scale-95"
            >
              <RotateCcw size={18} /> Play Again
            </button>
            {onComplete && (
              <button 
                onClick={() => onComplete({ score: topScore, total: topScore })} 
                className="flex-1 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Next Step ➔
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- PLAYING STATE ---
  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      className="h-full w-full flex-1 min-h-0 bg-slate-950 overflow-x-auto overflow-y-hidden flex select-none touch-none font-sans text-slate-200 rounded-3xl hide-scrollbar"
    >
      {players.map((p) => (
        <div 
          key={p.id} 
          className={`relative h-full flex-1 min-h-0 flex flex-col border-r-2 sm:border-r-4 border-slate-900 last:border-r-0 ${
            config.players === 1 ? 'w-full min-w-full' : 
            config.players === 2 ? 'w-1/2 min-w-[280px]' : 
            config.players === 3 ? 'w-1/3 min-w-[280px]' : 
            'w-1/4 min-w-[260px]' 
          }`}
        >
          {/* Top HUD */}
          <div className="absolute top-0 left-0 w-full p-2 sm:p-3 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div className="font-mono text-base sm:text-xl font-bold text-white bg-black/50 px-2.5 py-0.5 sm:py-1 rounded-lg border border-slate-700 backdrop-blur-sm">
              {p.score.toString().padStart(4, '0')}
            </div>

            {/* Return to Start / Settings Button */}
            <button
              onClick={() => {
                playSound('click');
                setGameState('menu');
              }}
              className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-white rounded-lg sm:rounded-xl border border-slate-700 hover:border-blue-400 shadow-md backdrop-blur-md text-[11px] sm:text-xs font-black transition-all group cursor-pointer"
              title="Return to Start Screen & Settings"
            >
              <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 group-hover:rotate-45 transition-transform" />
              <span>Settings</span>
            </button>

            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i < p.lives ? (config.isHD ? 'text-red-500 drop-shadow-[0_0_5px_red]' : 'text-red-500') : 'text-slate-800'}`} fill={i < p.lives ? 'currentColor' : 'none'} />
              ))}
            </div>
          </div>

          {/* SPACE CANVAS (Flex-1 min-h-0) */}
          <div className={`flex-[5.5] sm:flex-[6] min-h-0 relative overflow-hidden border-b-2 sm:border-b-4 border-slate-800 pointer-events-none ${config.isHD ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black shadow-inner" : "bg-black"}`}>
            
            {config.isHD && (
              <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] pointer-events-none"></div>
            )}
            
            {p.missiles.map((m: any) => (
              <div 
                 key={m.id} 
                 className={`absolute w-1.5 sm:w-2 h-6 sm:h-8 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${config.isHD ? 'bg-yellow-300 shadow-[0_0_12px_#fde047]' : 'bg-yellow-400 border border-yellow-200'}`} 
                 style={{ left: `${m.x}%`, top: `${m.y}%`, willChange: 'top, left' }} 
              />
            ))}

            {p.enemies.map((e: any) => (
              <div 
                 key={e.id} 
                 className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${config.isHD ? 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'text-green-500'}`} 
                 style={{ left: `${e.x}%`, top: `${e.y}%`, willChange: 'top, left' }}
              >
                <Bug size={28} className="animate-bounce sm:w-8 sm:h-8" />
              </div>
            ))}

            <div 
               className={`absolute bottom-[5%] transform -translate-x-1/2 transition-transform duration-75 ${config.isHD ? `${p.theme.ship} ${p.theme.glow}` : p.theme.noShadow}`} 
               style={{ left: `${p.shipX}%`, willChange: 'left' }}
            >
              <Rocket size={34} fill="currentColor" className={`-rotate-45 sm:w-10 sm:h-10 ${p.moving !== 0 ? 'scale-110' : ''}`} />
              {config.isHD && <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-5 bg-orange-500 blur-[3px] rounded-full animate-pulse opacity-80" />}
            </div>

            {p.isDead && (
              <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex items-center justify-center z-20">
                <span className="text-2xl sm:text-4xl font-black text-red-500 tracking-widest uppercase drop-shadow-lg rotate-[-10deg]">Destroyed</span>
              </div>
            )}
          </div>

          {/* DASHBOARD / CONTROLS (Flex-[4.5] sm:flex-[4] min-h-0) */}
          <div className="flex-[4.5] sm:flex-[4] min-h-0 bg-slate-900 p-2 sm:p-2.5 flex flex-col justify-between gap-1 sm:gap-2">
            {/* Equation Bar */}
            <div className={`flex justify-between items-center px-3 py-1 sm:py-1.5 rounded-xl border-2 bg-slate-950 ${p.input === p.question.answer ? 'border-green-500 bg-green-950/20 shadow-[0_0_12px_rgba(34,197,94,0.3)] animate-pulse' : 'border-slate-700'}`}>
              <span className="text-lg sm:text-2xl font-black text-blue-200 tracking-wide">{p.question.text} = </span>
              <span className={`text-xl sm:text-3xl font-mono font-bold px-2.5 py-0.5 rounded-lg min-w-[55px] text-right ${p.input === p.question.answer ? 'text-green-400 bg-green-900/30' : 'text-amber-400 bg-amber-900/20'}`}>{p.input || '?'}</span>
            </div>

            {/* DRAGGING POSITION SLIDER (Directly below equation/number input) */}
            <div 
              onPointerDown={(e) => handleSliderPointerDown(e, p.id)}
              onPointerMove={(e) => handleSliderPointerMove(e, p.id)}
              onPointerUp={(e) => handleSliderPointerUp(e)}
              onPointerCancel={(e) => handleSliderPointerUp(e)}
              className="relative w-full h-7 sm:h-8 bg-slate-950/90 rounded-xl border border-slate-700/80 shadow-inner flex items-center px-2 select-none touch-none cursor-ew-resize group shrink-0"
              title="Drag slider to aim spaceship"
            >
              {/* Slider Track Rail */}
              <div className="absolute inset-x-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${p.theme.bg} opacity-60 transition-[width] duration-75`} 
                  style={{ width: `${p.shipX}%` }} 
                />
              </div>

              {/* Reticle Guide Indicators */}
              <div className="absolute inset-x-4 flex justify-between pointer-events-none opacity-30 text-[9px] font-mono text-slate-400 select-none">
                <span>◀ L</span>
                <span>•</span>
                <span>TARGET RAIL</span>
                <span>•</span>
                <span>R ▶</span>
              </div>

              {/* Draggable Ship Reticle Thumb */}
              <div 
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border-2 flex items-center justify-center shadow-lg transition-transform active:scale-125 pointer-events-none ${p.theme.bg} ${p.theme.border} ${p.theme.ship}`}
                style={{ left: `${p.shipX}%` }}
              >
                <Rocket size={14} fill="currentColor" className={`-rotate-45 ${config.isHD ? p.theme.glow : ''}`} />
              </div>
            </div>

            {/* Controls Row: Full Width Number Pad + Fire Button */}
            <div className="flex-1 min-h-0 flex gap-1.5 sm:gap-2">
              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5 flex-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} onPointerDown={() => handleNumpad(p.id, num.toString())} className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 border border-slate-700 rounded-lg sm:rounded-xl text-base sm:text-xl font-black shadow-sm transition-all flex items-center justify-center touch-none">
                    {num}
                  </button>
                ))}
                <button onPointerDown={() => handleNumpad(p.id, 'clear')} className="bg-red-900/40 hover:bg-red-800/60 active:scale-95 border border-red-900/50 text-red-300 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black shadow-sm transition-all flex items-center justify-center touch-none">CLR</button>
                <button onPointerDown={() => handleNumpad(p.id, '0')} className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 border border-slate-700 rounded-lg sm:rounded-xl text-base sm:text-xl font-black shadow-sm transition-all flex items-center justify-center touch-none">0</button>
                <button onPointerDown={() => handleNumpad(p.id, 'del')} className="bg-orange-900/40 hover:bg-orange-800/60 active:scale-95 border border-orange-900/50 text-orange-300 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black shadow-sm transition-all flex items-center justify-center touch-none">DEL</button>
              </div>

              {/* Fire Button */}
              <div className="w-1/4 min-w-[65px] sm:min-w-[80px] flex">
                <button 
                  onPointerDown={() => handleLaunch(p.id)} 
                  disabled={p.input !== p.question.answer || p.isDead} 
                  className={`w-full rounded-xl flex flex-col items-center justify-center font-black text-xs sm:text-base tracking-wider transition-all duration-200 shadow-lg border-b-4 touch-none ${p.input === p.question.answer && !p.isDead ? 'bg-green-500 hover:bg-green-400 border-green-700 text-slate-950 scale-102 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-slate-800 border-slate-900 text-slate-600 opacity-60'}`}
                >
                  <Rocket size={20} className={`mb-0.5 sm:mb-1 pointer-events-none ${p.input === p.question.answer ? 'animate-bounce text-slate-950' : ''}`} />
                  FIRE
                </button>
              </div>

            </div>
          </div>
        </div>
      ))}
    </div>
  );
}