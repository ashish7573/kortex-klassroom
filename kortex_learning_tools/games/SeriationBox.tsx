'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, LayoutGrid, CheckCircle2, ArrowUpCircle } from 'lucide-react';

// --- Types ---
interface TileData {
  id: number;
  value: number; // 1 to 10
  currentIdx: number; // 0 to 11
}

interface Player {
  id: number;
  name: string;
  color: string;
  tiles: TileData[];
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

  const playSound = (type: 'slide' | 'win' | 'error') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'slide') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
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

  const checkWin = (tiles: TileData[]) => {
    for (let i = 1; i <= 10; i++) {
      const tile = tiles.find(t => t.value === i);
      if (!tile || tile.currentIdx !== i - 1) return false;
    }
    return true;
  };

  // --- Game Math: Generation ---
  const generateSolvableGrid = (): TileData[] => {
    let grid: (number | null)[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null, null];
    let emptyIndices = [10, 11];

    for (let i = 0; i < 200; i++) {
      const emptyIdx = emptyIndices[Math.floor(Math.random() * 2)];
      const validMoves = [];
      if (emptyIdx >= 3) validMoves.push(emptyIdx - 3); // Up
      if (emptyIdx <= 8) validMoves.push(emptyIdx + 3); // Down
      if (emptyIdx % 3 !== 0) validMoves.push(emptyIdx - 1); // Left
      if (emptyIdx % 3 !== 2) validMoves.push(emptyIdx + 1); // Right

      const move = validMoves[Math.floor(Math.random() * validMoves.length)];
      if (grid[move] !== null) {
         grid[emptyIdx] = grid[move];
         grid[move] = null;
         emptyIndices = grid.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1);
      }
    }

    return grid.map((val, idx) => {
      if (val === null) return null;
      return { id: val, value: val, currentIdx: idx };
    }).filter(Boolean) as TileData[];
  };

  const startGame = () => {
    initAudio();
    const newPlayers: Player[] = Array.from({ length: playerCount }).map((_, i) => ({
      id: i,
      name: `Hero ${i + 1}`,
      color: PLAYER_COLORS[i],
      tiles: generateSolvableGrid(),
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

    if (isRotated) {
      dx = -dx;
      dy = -dy;
    }

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
      const occupied = tiles.map(t => t.currentIdx);

      let newIdx = cIdx;

      if (dir === 'up') {
        if (cIdx >= 3) newIdx = cIdx - 3;
      } else if (dir === 'down') {
        if (cIdx <= 8) newIdx = cIdx + 3;
      } else if (dir === 'left') {
        if (cIdx % 3 !== 0) newIdx = cIdx - 1;
      } else if (dir === 'right') {
        if (cIdx % 3 !== 2) newIdx = cIdx + 1;
      }

      if (newIdx !== cIdx && !occupied.includes(newIdx)) {
        tile.currentIdx = newIdx;
        playSound('slide');
      } else {
        return prev;
      }

      tiles[tIdx] = tile;
      player.tiles = tiles;
      player.moves += 1;

      if (checkWin(tiles)) {
        player.isFinished = true;
        player.finishTime = (Date.now() - startTime) / 1000;
        playSound('win');
      }

      newPlayers[pIdx] = player;

      if (newPlayers.every(p => p.isFinished)) {
          setTimeout(() => {
              setUiState('gameover');
              if (onComplete) onComplete();
          }, 600);
      }

      return newPlayers;
    });
  };

  const attemptTap = (pIdx: number, tileId: number) => {
    setPlayers(prev => {
      const newPlayers = [...prev];
      const player = { ...newPlayers[pIdx] };
      const tiles = [...player.tiles];
      const tIdx = tiles.findIndex(t => t.id === tileId);
      const tile = { ...tiles[tIdx] };
      
      const cIdx = tile.currentIdx;
      const occupied = tiles.map(t => t.currentIdx);

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

        if (checkWin(tiles)) {
          player.isFinished = true;
          player.finishTime = (Date.now() - startTime) / 1000;
          playSound('win');
        }

        newPlayers[pIdx] = player;

        if (newPlayers.every(p => p.isFinished)) {
          setTimeout(() => {
              setUiState('gameover');
              if (onComplete) onComplete();
          }, 600);
        }

        return newPlayers;
      }

      playSound('error');
      return prev;
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-100 font-sans touch-none select-none">
      
      {/* HEADER */}
      <div className="h-16 md:h-20 bg-white border-b-4 border-slate-200 flex items-center justify-between px-4 md:px-8 z-30 relative shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500 p-2 rounded-2xl">
            <LayoutGrid className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-sm md:text-xl uppercase leading-none">Slide Sort</h1>
            <p className="text-sky-600 text-[10px] md:text-xs font-bold uppercase tracking-widest">Order 1 to 10</p>
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
      <div className={`w-full flex-1 min-h-0 p-2 md:p-4 grid gap-2 md:gap-4 ${
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
              
              {/* PUZZLE GRID AREA */}
              <div className="flex-grow flex items-center justify-center relative min-h-0 w-full p-2">
                 
                 {/* SIZING FIX: Uses 'h-full aspect-[3/4] max-h-full mx-auto' */}
                 <div className="relative h-full max-h-[80vh] aspect-[3/4] bg-slate-800 rounded-2xl md:rounded-[2rem] border-[6px] md:border-8 border-slate-700 overflow-hidden shadow-2xl mx-auto">
                    
                    {/* The Target Indicators Background */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 p-1 gap-1">
                      {Array.from({length: 12}).map((_, i) => (
                        <div key={`bg-${i}`} className="w-full h-full rounded-xl border-2 border-slate-700 flex items-center justify-center opacity-30">
                           {i < 10 && <span className="text-3xl font-black text-slate-600">{i + 1}</span>}
                        </div>
                      ))}
                    </div>

                    {/* The Tiles */}
                    {player.tiles.map((tile) => {
                       const col = tile.currentIdx % 3;
                       const row = Math.floor(tile.currentIdx / 3);
                       const isCorrect = tile.value === tile.currentIdx + 1;

                       return (
                         <div 
                           key={tile.id}
                           onPointerDown={(e) => handlePointerDown(e, pIdx, tile.id)}
                           onPointerUp={(e) => handlePointerUp(e, isHeadToHeadTop)}
                           onPointerCancel={(e) => handlePointerUp(e, isHeadToHeadTop)}
                           className={`absolute w-[33.33%] h-[25%] p-1 transition-all duration-300 ease-out select-none touch-none cursor-grab active:cursor-grabbing z-10 hover:z-20`}
                           style={{ 
                             left: `${col * 33.33}%`, 
                             top: `${row * 25}%` 
                           }}
                         >
                            <div className={`w-full h-full flex items-center justify-center rounded-xl md:rounded-2xl border-b-4 md:border-b-[6px] shadow-sm transition-colors
                               ${isCorrect ? 'bg-emerald-400 border-emerald-600 text-emerald-950' : 'bg-white border-slate-300 text-slate-700'}`}>
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
               <LayoutGrid className="w-10 h-10 md:w-12 md:h-12 text-sky-500" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">Slide Sort</h2>
            <p className="text-slate-500 font-bold mb-8 italic">Swipe or tap tiles to move them into the empty spaces. Arrange them in order from 1 to 10!</p>
            
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
              <h2 className="text-5xl font-black text-slate-800 mb-2 tracking-tight">Sort Complete!</h2>
              <p className="text-sky-600 font-black uppercase tracking-widest text-sm mb-8">All numbers in order.</p>
              
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
              </div>
           </div>
        </div>
      )}
    </div>
  );
}