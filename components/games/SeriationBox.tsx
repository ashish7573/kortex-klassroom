'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, LayoutGrid, CheckCircle2, ArrowUpCircle } from 'lucide-react';

// --- Types ---
interface TileData {
  id: number;
  value: number; // 0 to 10
  currentIdx: number; // 0 to 11
  isEscaped: boolean;
}

interface Player {
  id: number;
  name: string;
  color: string;
  tiles: TileData[];
  currentTarget: number; // Tracks which number needs to escape next
  isFinished: boolean;
  finishTime?: number;
  moves: number;
}

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

export default function SeriationBox({ lesson, onComplete }: any) {
  const [uiState, setUiState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(1);
  const [startTime, setStartTime] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const audioCtx = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // --- Multi-touch Registry ---
  // Tracks every active finger on the screen independently
  const activeTouches = useRef<Record<number, { startX: number, startY: number, tileId: number, pIdx: number }>>({});

  // --- Timer Logic (SSR Safe) ---
  useEffect(() => {
    if (uiState === 'playing') {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [uiState, startTime]);

  // --- Audio ---
  const initAudio = () => {
    if (typeof window !== 'undefined' && !audioCtx.current) {
      const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (WinAudioContext) audioCtx.current = new WinAudioContext();
    }
  };

  const playSound = (type: 'slide' | 'escape' | 'win' | 'error') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'slide') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    } else if (type === 'escape') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
    } else if (type === 'win') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  // --- Game Math: Generation ---
  const generateSolvableGrid = (): TileData[] => {
    let grid: (number | null)[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null];
    let emptyIdx = 11;

    // Shuffle by making valid reverse moves
    for (let i = 0; i < 150; i++) {
      const validMoves = [];
      if (emptyIdx >= 3) validMoves.push(emptyIdx - 3); // Up
      if (emptyIdx <= 8) validMoves.push(emptyIdx + 3); // Down
      if (emptyIdx % 3 !== 0) validMoves.push(emptyIdx - 1); // Left
      if (emptyIdx % 3 !== 2) validMoves.push(emptyIdx + 1); // Right

      const move = validMoves[Math.floor(Math.random() * validMoves.length)];
      grid[emptyIdx] = grid[move];
      grid[move] = null;
      emptyIdx = move;
    }

    return grid.map((val, idx) => {
      if (val === null) return null;
      return { id: val, value: val, currentIdx: idx, isEscaped: false };
    }).filter(Boolean) as TileData[];
  };

  const startGame = () => {
    initAudio();
    const newPlayers: Player[] = Array.from({ length: playerCount }).map((_, i) => ({
      id: i,
      name: `Hero ${i + 1}`,
      color: PLAYER_COLORS[i],
      tiles: generateSolvableGrid(),
      currentTarget: 0, // Must push out 0 first, then 1, etc.
      moves: 0,
      isFinished: false
    }));
    setPlayers(newPlayers);
    setStartTime(Date.now());
    setSecondsElapsed(0);
    setUiState('playing');
  };

  // --- Multi-Touch Handlers ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, pIdx: number, tileId: number) => {
    if (uiState !== 'playing' || players[pIdx].isFinished) return;
    
    // Capture the pointer so tracking doesn't drop if finger moves outside tile
    e.currentTarget.setPointerCapture(e.pointerId);
    activeTouches.current[e.pointerId] = {
      startX: e.clientX,
      startY: e.clientY,
      tileId,
      pIdx
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>, isRotated: boolean) => {
    const touch = activeTouches.current[e.pointerId];
    if (!touch) return;

    let dx = e.clientX - touch.startX;
    let dy = e.clientY - touch.startY;

    // If player is rotated 180 degrees (Head-to-head mobile), 
    // we must invert the swipe vectors to match their physical perspective!
    if (isRotated) {
      dx = -dx;
      dy = -dy;
    }

    // Determine if it was a Swipe or a Tap
    if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
      let dir: 'up' | 'down' | 'left' | 'right';
      if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? 'right' : 'left';
      else dir = dy > 0 ? 'down' : 'up';
      
      attemptMove(touch.pIdx, touch.tileId, dir);
    } else {
      attemptTap(touch.pIdx, touch.tileId);
    }

    delete activeTouches.current[e.pointerId];
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // --- Core Game Physics ---
  const attemptMove = (pIdx: number, tileId: number, dir: 'up' | 'down' | 'left' | 'right') => {
    setPlayers(prev => {
      const newPlayers = [...prev];
      const player = { ...newPlayers[pIdx] };
      const tiles = [...player.tiles];
      const tIdx = tiles.findIndex(t => t.id === tileId);
      const tile = { ...tiles[tIdx] };

      const cIdx = tile.currentIdx;
      // Get array of all currently occupied indices (ignoring escaped tiles)
      const occupied = tiles.filter(t => !t.isEscaped).map(t => t.currentIdx);

      let newIdx = cIdx;
      let escapes = false;

      if (dir === 'up') {
        // ESCAPE HATCH CHECK: Index 1 is the Top-Center slot
        if (cIdx === 1 && tile.value === player.currentTarget) escapes = true;
        else if (cIdx === 1 && tile.value !== player.currentTarget) playSound('error'); // Tried to push wrong number
        else if (cIdx >= 3) newIdx = cIdx - 3;
      } else if (dir === 'down') {
        if (cIdx <= 8) newIdx = cIdx + 3;
      } else if (dir === 'left') {
        if (cIdx % 3 !== 0) newIdx = cIdx - 1;
      } else if (dir === 'right') {
        if (cIdx % 3 !== 2) newIdx = cIdx + 1;
      }

      if (escapes) {
        tile.isEscaped = true;
        player.currentTarget += 1;
        playSound('escape');
        if (player.currentTarget > 10) {
          player.isFinished = true;
          player.finishTime = (Date.now() - startTime) / 1000;
          playSound('win');
        }
      } else if (newIdx !== cIdx && !occupied.includes(newIdx)) {
        tile.currentIdx = newIdx;
        playSound('slide');
      } else {
        return prev; // Invalid move, no state change
      }

      tiles[tIdx] = tile;
      player.tiles = tiles;
      player.moves += 1;
      newPlayers[pIdx] = player;

      if (newPlayers.every(p => p.isFinished)) {
        setTimeout(() => setUiState('gameover'), 600);
      }

      return newPlayers;
    });
  };

  const attemptTap = (pIdx: number, tileId: number) => {
    // Tap auto-finds an empty space to slide into. Highly kid-friendly.
    setPlayers(prev => {
      const newPlayers = [...prev];
      const player = { ...newPlayers[pIdx] };
      const tiles = [...player.tiles];
      const tIdx = tiles.findIndex(t => t.id === tileId);
      const tile = { ...tiles[tIdx] };
      
      const cIdx = tile.currentIdx;
      const occupied = tiles.filter(t => !t.isEscaped).map(t => t.currentIdx);

      // Check Escape First
      if (cIdx === 1 && tile.value === player.currentTarget) {
        tile.isEscaped = true;
        player.currentTarget += 1;
        playSound('escape');
        if (player.currentTarget > 10) {
          player.isFinished = true;
          player.finishTime = (Date.now() - startTime) / 1000;
          playSound('win');
        }
        tiles[tIdx] = tile;
        player.tiles = tiles;
        player.moves += 1;
        newPlayers[pIdx] = player;
        if (newPlayers.every(p => p.isFinished)) setTimeout(() => setUiState('gameover'), 600);
        return newPlayers;
      }

      // Check Neighbors for emptiness
      const candidates = [];
      if (cIdx >= 3) candidates.push(cIdx - 3); // up
      if (cIdx <= 8) candidates.push(cIdx + 3); // down
      if (cIdx % 3 !== 0) candidates.push(cIdx - 1); // left
      if (cIdx % 3 !== 2) candidates.push(cIdx + 1); // right

      const emptyNeighbor = candidates.find(idx => !occupied.includes(idx));
      if (emptyNeighbor !== undefined) {
        tile.currentIdx = emptyNeighbor;
        playSound('slide');
        tiles[tIdx] = tile;
        player.tiles = tiles;
        player.moves += 1;
        newPlayers[pIdx] = player;
        return newPlayers;
      }

      // If tapped but can't move anywhere, play error
      if (cIdx === 1 && tile.value !== player.currentTarget) playSound('error');

      return prev;
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 font-sans touch-none select-none">
      
      {/* HEADER */}
      <div className="h-16 md:h-20 bg-white border-b-4 border-slate-200 flex items-center justify-between px-4 md:px-8 z-30 relative shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500 p-2 rounded-2xl">
            <LayoutGrid className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-sm md:text-xl uppercase leading-none">Slide Escape</h1>
            <p className="text-sky-600 text-[10px] md:text-xs font-bold uppercase tracking-widest">Push out 0 to 10</p>
          </div>
        </div>

        {uiState === 'playing' && (
          <div className="flex gap-4 items-center">
             <div className="hidden md:flex bg-slate-100 px-4 py-2 rounded-xl border-2 border-slate-200 font-mono font-bold text-slate-600">
               {secondsElapsed}s
             </div>
             <button onClick={() => setUiState('menu')} className="bg-slate-800 text-white p-2 md:px-4 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95">
                <RotateCcw className="w-4 h-4" /> <span className="hidden md:inline">Quit</span>
             </button>
          </div>
        )}
      </div>

      {/* STAGE */}
      <div className={`w-full h-[calc(100vh-140px)] p-2 md:p-4 grid gap-2 md:gap-4 ${
        playerCount === 1 ? 'grid-cols-1' : 
        playerCount === 2 ? 'grid-rows-2 md:grid-cols-2 md:grid-rows-1' :
        playerCount === 3 ? 'grid-cols-3 grid-rows-1' :
        'grid-cols-4 grid-rows-1' 
      }`}>
        {players.map((player, pIdx) => {
          
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          const isHeadToHeadTop = isMobile && playerCount === 2 && pIdx === 0;

          return (
            <div 
              key={player.id} 
              className={`relative flex flex-col overflow-hidden rounded-[2rem] border-4 p-2 transition-all ${
                player.isFinished ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-200/50 border-slate-300 shadow-inner'
              } ${isHeadToHeadTop ? 'rotate-180' : ''}`}
            >
              
              {/* TOP TRAY (Collected Numbers) */}
              <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2 p-2 bg-white rounded-2xl shadow-sm border border-slate-200 mb-2 z-10 shrink-0 min-h-[4rem]">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                  const isCollected = num < player.currentTarget;
                  const isNext = num === player.currentTarget;
                  return (
                    <div 
                      key={num} 
                      className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-lg md:rounded-xl font-black text-xs md:text-sm transition-all duration-300
                        ${isCollected ? 'bg-emerald-500 text-white shadow-sm scale-100' : 
                          isNext ? 'bg-amber-100 border-2 border-amber-400 text-amber-700 animate-pulse' : 
                          'border border-dashed border-slate-300 text-slate-300 scale-90'}`}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>

              {/* PUZZLE GRID AREA */}
              <div className="flex-grow flex items-center justify-center relative">
                 
                 {/* The Physical 3x4 Box constraint */}
                 <div className="relative w-full max-w-[200px] md:max-w-[280px] aspect-[3/4] bg-slate-800 rounded-2xl border-[6px] md:border-8 border-slate-700 overflow-hidden shadow-2xl">
                    
                    {/* The Visual Escape Hole (Top Middle) */}
                    <div className="absolute top-0 left-1/3 w-1/3 h-2 bg-sky-300/20 z-0 border-b-2 border-dashed border-sky-400/50"></div>
                    <div className="absolute top-2 left-1/3 w-1/3 flex justify-center opacity-40 animate-pulse pointer-events-none">
                      <ArrowUpCircle className="w-6 h-6 text-sky-400" />
                    </div>

                    {/* The Tiles */}
                    {player.tiles.map((tile) => {
                       const col = tile.currentIdx % 3;
                       const row = Math.floor(tile.currentIdx / 3);
                       const isNextTarget = tile.value === player.currentTarget && !tile.isEscaped;

                       return (
                         <div 
                           key={tile.id}
                           onPointerDown={(e) => handlePointerDown(e, pIdx, tile.id)}
                           onPointerUp={(e) => handlePointerUp(e, isHeadToHeadTop)}
                           onPointerCancel={(e) => handlePointerUp(e, isHeadToHeadTop)}
                           // CSS TRANSITION MAGIC:
                           // If Escaped: Slide up and out of bounds (top: -30%), shrink, and fade out.
                           // If Active: Map strictly to col (33.3%) and row (25%).
                           className={`absolute w-[33.33%] h-[25%] p-1 transition-all duration-300 ease-out select-none touch-none
                             ${tile.isEscaped ? 'opacity-0 scale-50 pointer-events-none z-0' : 'opacity-100 scale-100 cursor-grab active:cursor-grabbing z-10 hover:z-20'}`}
                           style={{ 
                             left: tile.isEscaped ? '33.33%' : `${col * 33.33}%`, 
                             top: tile.isEscaped ? '-30%' : `${row * 25}%` 
                           }}
                         >
                            <div className={`w-full h-full flex items-center justify-center rounded-xl md:rounded-2xl border-b-4 md:border-b-[6px] shadow-sm transition-colors
                               ${isNextTarget ? 'bg-amber-300 border-amber-500 text-amber-900' : 'bg-white border-slate-300 text-slate-700'}`}>
                               <span className="text-3xl md:text-5xl font-black">{tile.value}</span>
                            </div>
                         </div>
                       )
                    })}
                 </div>
              </div>

              {/* Finished Overlay */}
              {player.isFinished && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-[2rem] z-40 animate-fade-in">
                  <div className="bg-white p-4 rounded-full shadow-2xl mb-2">
                    <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-emerald-500" />
                  </div>
                  <div className="bg-slate-800 text-white px-4 py-2 rounded-full font-mono font-bold shadow-lg border-2 border-slate-600">
                    {player.finishTime?.toFixed(1)}s
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MENU OVERLAY */}
      {uiState === 'menu' && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-6 md:p-10 max-w-xl w-full shadow-2xl text-center border-8 border-white/20">
            <div className="w-20 h-20 md:w-24 md:h-20 bg-sky-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <ArrowUpCircle className="w-10 h-10 md:w-12 md:h-12 text-sky-500" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">Slide Escape!</h2>
            <p className="text-slate-500 font-bold mb-8 italic">Swipe tiles to the empty spaces. Push the numbers out the top hole in order from 0 to 10!</p>
            
            <div className="space-y-4 mb-10">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Players</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-sm mx-auto">
                {(typeof window !== 'undefined' && window.innerWidth < 768 ? [1, 2] : [1, 2, 3, 4]).map(n => (
                  <button key={n} onClick={() => setPlayerCount(n)} className={`py-3 rounded-2xl font-black border-b-4 transition-all ${playerCount === n ? 'bg-sky-500 border-sky-700 text-white shadow-lg' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>{n}</button>
                ))}
              </div>
            </div>

            <button onClick={startGame} className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-2xl rounded-3xl shadow-xl border-b-8 border-emerald-700 transition-transform active:translate-y-2 flex items-center justify-center gap-3">
               <Play className="fill-white" /> START RACE
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {uiState === 'gameover' && (
        <div className="absolute inset-0 bg-sky-600/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-2xl text-center border-8 border-white/20">
              <Trophy className="w-24 h-24 text-amber-500 mx-auto mb-6" />
              <h2 className="text-5xl font-black text-slate-800 mb-2 tracking-tight">Escape Complete!</h2>
              <p className="text-sky-600 font-black uppercase tracking-widest text-sm mb-8">All numbers saved.</p>
              
              <div className="space-y-3 mb-8">
                 {[...players].sort((a,b) => (a.finishTime || 0) - (b.finishTime || 0)).map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-l-8 shadow-sm" style={{ borderLeftColor: p.color }}>
                       <span className="font-black text-slate-700">#{i+1} {p.name}</span>
                       <div className="flex gap-4 items-center">
                          <span className="text-xs font-black text-slate-400">{p.moves} moves</span>
                          <span className="font-mono font-bold text-slate-800 bg-slate-200 px-2 py-1 rounded-lg">{p.finishTime?.toFixed(1)}s</span>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setUiState('menu')} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl border-b-4 border-slate-300 transition-transform active:translate-y-1">RESTART</button>
                 <button onClick={() => onComplete?.()} className="flex-1 py-4 bg-emerald-500 text-white font-black rounded-2xl border-b-4 border-emerald-700 transition-transform active:translate-y-1 shadow-lg">FINISH</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}