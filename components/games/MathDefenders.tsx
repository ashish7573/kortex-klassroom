"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Rocket, Bug, Heart, ChevronLeft, ChevronRight, Play, Users, Trophy, X } from 'lucide-react';

// --- MATH GENERATOR ---
const generateQuestion = (type: string) => {
  let a, b, answer, text;
  switch (type) {
    case 'add_no_carry':
      a = Math.floor(Math.random() * 80) + 10;
      const a1 = a % 10;
      const a10 = Math.floor(a / 10);
      const b1 = Math.floor(Math.random() * (9 - a1));
      const b10 = Math.floor(Math.random() * (9 - a10));
      b = b10 * 10 + b1;
      answer = a + b;
      text = `${a} + ${b}`;
      break;
    case 'add_carry':
      const ac1 = Math.floor(Math.random() * 8) + 2; 
      const bc1 = Math.floor(Math.random() * (9 - (10 - ac1))) + (10 - ac1); 
      const ac10 = Math.floor(Math.random() * 8) + 1;
      const bc10 = Math.floor(Math.random() * (8 - ac10)) + 1;
      a = ac10 * 10 + ac1;
      b = bc10 * 10 + bc1;
      answer = a + b;
      text = `${a} + ${b}`;
      break;
    case 'sub_no_carry':
      const s1 = Math.floor(Math.random() * 9) + 1;
      const s10 = Math.floor(Math.random() * 8) + 2;
      const sb1 = Math.floor(Math.random() * (s1 + 1));
      const sb10 = Math.floor(Math.random() * s10) + 1;
      a = s10 * 10 + s1;
      b = sb10 * 10 + sb1;
      answer = a - b;
      text = `${a} - ${b}`;
      break;
    case 'sub_carry':
      const sc1 = Math.floor(Math.random() * 8); 
      const sbc1 = Math.floor(Math.random() * (9 - sc1)) + sc1 + 1; 
      const sc10 = Math.floor(Math.random() * 8) + 2; 
      const sbc10 = Math.floor(Math.random() * (sc10 - 1)) + 1; 
      a = sc10 * 10 + sc1;
      b = sbc10 * 10 + sbc1;
      answer = a - b;
      text = `${a} - ${b}`;
      break;
    case 'mul':
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      text = `${a} × ${b}`;
      break;
    case 'div':
      b = Math.floor(Math.random() * 10) + 1;
      answer = Math.floor(Math.random() * 10) + 1;
      a = b * answer;
      text = `${a} ÷ ${b}`;
      break;
    default:
      a = 1; b = 1; answer = 1; text = "1x1";
  }
  return { text, answer: answer.toString() };
};

// --- CONSTANTS & CONFIG ---
const COLORS = [
  { ship: 'text-blue-400', glow: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]', bg: 'bg-blue-900/30', border: 'border-blue-500/50' },
  { ship: 'text-emerald-400', glow: 'drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]', bg: 'bg-emerald-900/30', border: 'border-emerald-500/50' },
  { ship: 'text-pink-400', glow: 'drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]', bg: 'bg-pink-900/30', border: 'border-pink-500/50' },
  { ship: 'text-orange-400', glow: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]', bg: 'bg-orange-900/30', border: 'border-orange-500/50' },
];

const OPERATIONS = [
  { id: 'add_no_carry', label: 'Addition (No Carry)' },
  { id: 'add_carry', label: 'Addition (With Carry)' },
  { id: 'sub_no_carry', label: 'Subtraction (No Carry)' },
  { id: 'sub_carry', label: 'Subtraction (With Carry)' },
  { id: 'mul', label: 'Multiplication' },
  { id: 'div', label: 'Division' },
];

export default function MathDefenders({ lesson, onComplete = () => {} }: any) {
  const [gameState, setGameState] = useState('menu'); 
  const [config, setConfig] = useState({ ops: 'mul', players: 4 });
  const [players, setPlayers] = useState<any[]>([]);
  
  const stateRef = useRef<any[]>([]);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

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

        let newMissiles = p.missiles.map((m: any) => ({ ...m, y: m.y - 2 })).filter((m: any) => m.y > 0);
        let newEnemies = p.enemies.map((e: any) => ({ ...e, y: e.y + 0.0375 }));
        
        let newLives = p.lives;
        let newScore = p.score;

        const survivingEnemies: any[] = [];
        newEnemies.forEach((e: any) => {
          if (e.y >= 90) newLives -= 1;
          else survivingEnemies.push(e);
        });
        newEnemies = survivingEnemies;

        const hitEnemyIds = new Set();
        const hitMissileIds = new Set();

        newMissiles.forEach((m: any) => {
          newEnemies.forEach((e: any) => {
            if (!hitEnemyIds.has(e.id) && !hitMissileIds.has(m.id)) {
              if (Math.abs(m.x - e.x) < 8 && Math.abs(m.y - e.y) < 8) {
                hitEnemyIds.add(e.id);
                hitMissileIds.add(m.id);
                newScore += 10;
              }
            }
          });
        });

        newMissiles = newMissiles.filter((m: any) => !hitMissileIds.has(m.id));
        newEnemies = newEnemies.filter((e: any) => !hitEnemyIds.has(e.id));

        if (Math.random() < 0.015 && newEnemies.length < 4) {
          newEnemies.push({ id: Math.random().toString(), x: Math.floor(Math.random() * 80) + 10, y: 0 });
        }

        return { ...p, shipX: newShipX, missiles: newMissiles, enemies: newEnemies, lives: newLives, score: newScore, isDead: newLives <= 0 };
      });

      stateRef.current = updatedPlayers;
      setPlayers(updatedPlayers);
      lastTimeRef.current = time;

      if (!anyAlive && updatedPlayers.length > 0) {
        setGameState('gameover');
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

  // --- ACTIONS ---
  const startGame = () => {
    const initPlayers = Array.from({ length: config.players }, (_, i) => ({
      id: i, lives: 3, score: 0, question: generateQuestion(config.ops), input: "",
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
    setPlayers([...stateRef.current]);
  };

  const handleNumpad = (pId: number, key: string) => {
    updatePlayerAction(pId, (p: any) => {
      let newInput = p.input;
      if (key === 'del') newInput = newInput.slice(0, -1);
      else if (key === 'clear') newInput = "";
      else if (newInput.length < 4) newInput += key;
      return { ...p, input: newInput };
    });
  };

  const handleMovement = (pId: number, direction: number) => {
    updatePlayerAction(pId, (p: any) => ({ ...p, moving: direction }));
  };

  const handleLaunch = (pId: number) => {
    updatePlayerAction(pId, (p: any) => {
      if (p.input === p.question.answer) {
        return { ...p, input: "", question: generateQuestion(config.ops), missiles: [...p.missiles, { id: Math.random().toString(), x: p.shipX, y: 85 }] };
      }
      return p;
    });
  };

  // --- RENDERERS ---
  if (gameState === 'menu') {
    return (
      // FIXED: Added overflow-y-auto and adjusted padding for mobile scrolling
      <div className="w-full h-full min-h-[500px] bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-200 rounded-3xl relative overflow-y-auto">
        
        {/* FIXED: Made the exit button smaller on mobile so it doesn't overlap text */}
        <button onClick={() => onComplete()} className="absolute top-2 right-2 md:top-4 md:right-4 bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white p-2 md:p-3 rounded-full transition-colors z-20">
           <X size={20} className="md:w-6 md:h-6" />
        </button>

        {/* FIXED: Scaled down margins and paddings for mobile (sm: prefix) */}
        <div className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-8 shadow-2xl my-auto">
          <div className="text-center mb-6 sm:mb-10 mt-4 sm:mt-0">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">Math Defenders</h1>
            <p className="text-slate-400 font-bold text-sm sm:text-base">SmartBoard & Mobile Edition</p>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2"><Rocket className="text-blue-400 w-5 h-5 sm:w-6 sm:h-6"/> Select Mission</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {OPERATIONS.map(op => (
                <button
                  key={op.id} onClick={() => setConfig(c => ({...c, ops: op.id}))}
                  className={`p-2 sm:p-3 rounded-xl border-2 text-left font-semibold text-sm sm:text-base transition-all ${config.ops === op.id ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300'}`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 sm:mb-10">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2"><Users className="text-green-400 w-5 h-5 sm:w-6 sm:h-6"/> Select Players</h2>
            <div className="flex gap-2 sm:gap-4">
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num} onClick={() => setConfig(c => ({...c, players: num}))}
                  className={`flex-1 py-2 sm:py-4 rounded-xl border-2 text-lg sm:text-2xl font-bold transition-all ${config.players === num ? 'bg-green-600/20 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-400'}`}
                >
                  {num}P
                </button>
              ))}
            </div>
          </div>

          <button onClick={startGame} className="w-full py-3 sm:py-5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xl sm:text-2xl shadow-lg flex items-center justify-center gap-2 sm:gap-3 transform hover:scale-[1.02] transition-transform">
            <Play fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6" /> INITIATE LAUNCH
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="w-full h-full min-h-[500px] bg-slate-950 flex flex-col items-center justify-center p-4 rounded-3xl overflow-y-auto relative">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl text-center my-auto">
          <Trophy className="w-16 h-16 sm:w-24 sm:h-24 text-yellow-400 mx-auto mb-4 sm:mb-6" />
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-6 sm:mb-8">Mission Over</h1>
          
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            {players.sort((a,b) => b.score - a.score).map((p, idx) => (
              <div key={p.id} className={`flex justify-between items-center p-3 sm:p-4 rounded-xl border ${p.theme.bg} ${p.theme.border}`}>
                <span className={`text-lg sm:text-xl font-bold ${p.theme.ship}`}>Player {p.id + 1} {idx === 0 && '👑'}</span>
                <span className="text-xl sm:text-2xl font-mono text-white">{p.score} pts</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
             <button onClick={() => setGameState('menu')} className="flex-1 py-3 sm:py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg sm:text-xl transition-colors">Return to Base</button>
             <button onClick={() => onComplete()} className="flex-1 py-3 sm:py-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-lg sm:text-xl transition-colors">Exit Lesson</button>
          </div>
        </div>
      </div>
    );
  }

  // --- PLAYING STATE ---
  return (
    // FIXED: min-h reduced to 500px so numpad fits on shorter phone screens
    <div className="h-[80vh] min-h-[500px] w-full bg-slate-950 overflow-x-auto overflow-y-hidden flex select-none touch-none font-sans text-slate-200 rounded-3xl hide-scrollbar">
      {players.map((p, index) => (
        <div 
          key={p.id} 
          className={`relative h-full flex flex-col border-r-4 border-slate-900 last:border-r-0 ${
            config.players === 1 ? 'w-full min-w-full' : 
            config.players === 2 ? 'w-1/2 min-w-[300px]' : 
            config.players === 3 ? 'w-1/3 min-w-[300px]' : 
            'w-1/4 min-w-[280px]' 
          }`}
        >
          {/* Top HUD */}
          <div className="absolute top-0 left-0 w-full p-3 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <div className="font-mono text-xl font-bold text-white bg-black/50 px-3 py-1 rounded-lg border border-slate-700 backdrop-blur-sm">{p.score.toString().padStart(4, '0')}</div>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart key={i} className={`w-5 h-5 sm:w-6 sm:h-6 ${i < p.lives ? 'text-red-500 drop-shadow-[0_0_5px_red]' : 'text-slate-800'}`} fill={i < p.lives ? 'currentColor' : 'none'} />
              ))}
            </div>
          </div>

          {/* SPACE CANVAS */}
          <div className="flex-[5.5] relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black overflow-hidden border-b-4 border-slate-700 shadow-inner">
            <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] pointer-events-none"></div>
            
            {p.missiles.map((m: any) => (
              <div key={m.id} className="absolute w-2 h-8 bg-yellow-300 rounded-full shadow-[0_0_12px_#fde047] transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${m.x}%`, top: `${m.y}%` }} />
            ))}

            {p.enemies.map((e: any) => (
              <div key={e.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" style={{ left: `${e.x}%`, top: `${e.y}%` }}>
                <Bug size={32} className="animate-bounce sm:w-10 sm:h-10" />
              </div>
            ))}

            <div className={`absolute bottom-[5%] transform -translate-x-1/2 transition-transform duration-75 ${p.theme.ship} ${p.theme.glow}`} style={{ left: `${p.shipX}%` }}>
              <Rocket size={40} fill="currentColor" className={`-rotate-45 sm:w-12 sm:h-12 ${p.moving !== 0 ? 'scale-110' : ''}`} />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-6 bg-orange-500 blur-[4px] rounded-full animate-pulse opacity-80" />
            </div>

            {p.isDead && (
              <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex items-center justify-center z-20">
                <span className="text-3xl sm:text-4xl font-black text-red-500 tracking-widest uppercase drop-shadow-lg rotate-[-10deg]">Destroyed</span>
              </div>
            )}
          </div>

          {/* DASHBOARD / CONTROLS */}
          <div className="flex-[4.5] bg-slate-900 p-2 sm:p-4 flex flex-col gap-2 sm:gap-3">
            <div className={`flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 bg-slate-950 shadow-inner ${p.input === p.question.answer ? 'border-green-500 bg-green-950/20' : 'border-slate-700'}`}>
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-200 tracking-wide">{p.question.text} = </span>
              <span className={`text-3xl sm:text-4xl font-mono font-bold px-3 sm:px-4 py-1 rounded-lg min-w-[70px] text-right ${p.input === p.question.answer ? 'text-green-400 bg-green-900/30' : 'text-amber-400 bg-amber-900/20'}`}>{p.input || '?'}</span>
            </div>

            <div className="flex-1 flex gap-2 sm:gap-3">
              {/* Directional Pad */}
              <div className="flex flex-col gap-2 w-1/4 min-w-[60px]">
                <button 
                  onPointerDown={() => handleMovement(p.id, -1)}
                  onPointerUp={() => handleMovement(p.id, 0)}
                  onPointerLeave={() => handleMovement(p.id, 0)}
                  onPointerCancel={() => handleMovement(p.id, 0)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-xl flex items-center justify-center shadow-lg transition-colors touch-none"
                >
                  <ChevronLeft size={32} className="text-slate-300 sm:w-10 sm:h-10" />
                </button>
                <button 
                  onPointerDown={() => handleMovement(p.id, 1)}
                  onPointerUp={() => handleMovement(p.id, 0)}
                  onPointerLeave={() => handleMovement(p.id, 0)}
                  onPointerCancel={() => handleMovement(p.id, 0)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-xl flex items-center justify-center shadow-lg transition-colors touch-none"
                >
                  <ChevronRight size={32} className="text-slate-300 sm:w-10 sm:h-10" />
                </button>
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2 flex-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} onClick={() => handleNumpad(p.id, num.toString())} className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 border border-slate-700 rounded-xl text-xl sm:text-2xl font-bold shadow-md transition-all flex items-center justify-center">
                    {num}
                  </button>
                ))}
                <button onClick={() => handleNumpad(p.id, 'clear')} className="bg-red-900/40 hover:bg-red-800/60 active:scale-95 border border-red-900/50 text-red-300 rounded-xl text-sm sm:text-lg font-bold shadow-md transition-all flex items-center justify-center">CLR</button>
                <button onClick={() => handleNumpad(p.id, '0')} className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 border border-slate-700 rounded-xl text-xl sm:text-2xl font-bold shadow-md transition-all flex items-center justify-center">0</button>
                <button onClick={() => handleNumpad(p.id, 'del')} className="bg-orange-900/40 hover:bg-orange-800/60 active:scale-95 border border-orange-900/50 text-orange-300 rounded-xl text-sm sm:text-lg font-bold shadow-md transition-all flex items-center justify-center">DEL</button>
              </div>

              {/* Fire Button */}
              <div className="w-1/4 min-w-[60px] sm:min-w-[70px] flex">
                <button onClick={() => handleLaunch(p.id)} disabled={p.input !== p.question.answer || p.isDead} className={`w-full rounded-xl flex flex-col items-center justify-center font-black text-sm sm:text-xl tracking-wider transition-all duration-300 shadow-xl border-b-4 ${p.input === p.question.answer && !p.isDead ? 'bg-green-500 hover:bg-green-400 border-green-700 text-white animate-pulse scale-105' : 'bg-slate-800 border-slate-900 text-slate-600 opacity-60'}`}>
                  <Rocket size={24} className={`mb-1 sm:mb-2 sm:w-8 sm:h-8 ${p.input === p.question.answer ? 'animate-bounce' : ''}`} />
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