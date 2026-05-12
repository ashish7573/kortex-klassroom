'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, LayoutGrid, CheckCircle2, ArrowRight } from 'lucide-react';

// --- Types ---
interface Tile {
  id: number;
  currentPos: number; // 0 to 11
  targetPos: number;  // 0 to 11
  value: number | null; // null represents the empty space
}

interface Player {
  id: number;
  name: string;
  color: string;
  tiles: Tile[];
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

  const playSound = (type: 'slide' | 'lock' | 'win') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'slide') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    } else if (type === 'lock') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
    } else if (type === 'win') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  // --- Game Math: 15-Puzzle Logic ---
  // A standard sliding puzzle must be "solvable". 
  // We guarantee this by starting sorted and randomly sliding it backward N times.
  const generateSolvableGrid = (): Tile[] => {
    // Goal State: 0-10, then empty (null) at index 11
    let grid: (number | null)[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null];
    let emptyIdx = 11;

    // Shuffle by making 100 valid random moves
    for (let i = 0; i < 100; i++) {
      const validMoves = [];
      const col = emptyIdx % 3;
      const row = Math.floor(emptyIdx / 3);

      if (col > 0) validMoves.push(emptyIdx - 1); // Left
      if (col < 2) validMoves.push(emptyIdx + 1); // Right
      if (row > 0) validMoves.push(emptyIdx - 3); // Up
      if (row < 3) validMoves.push(emptyIdx + 3); // Down

      const move = validMoves[Math.floor(Math.random() * validMoves.length)];
      
      // Swap
      grid[emptyIdx] = grid[move];
      grid[move] = null;
      emptyIdx = move;
    }

    return grid.map((val, idx) => ({
      id: val === null ? 99 : val, // unique id for React keys
      currentPos: idx,
      targetPos: val === null ? 11 : val,
      value: val
    }));
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

  const handleTileClick = (pIdx: number, clickedTileIdx: number) => {
    if (uiState !== 'playing' || players[pIdx].isFinished) return;

    const player = players[pIdx];
    const tiles = [...player.tiles];
    
    // Find empty tile
    const emptyIdx = tiles.findIndex(t => t.value === null);
    
    // Check adjacency (up, down, left, right)
    const clickedCol = clickedTileIdx % 3;
    const clickedRow = Math.floor(clickedTileIdx / 3);
    const emptyCol = emptyIdx % 3;
    const emptyRow = Math.floor(emptyIdx / 3);

    const isAdjacent = 
      (Math.abs(clickedCol - emptyCol) === 1 && clickedRow === emptyRow) ||
      (Math.abs(clickedRow - emptyRow) === 1 && clickedCol === emptyCol);

    if (isAdjacent) {
      // Swap
      const temp = tiles[clickedTileIdx];
      tiles[clickedTileIdx] = tiles[emptyIdx];
      tiles[emptyIdx] = temp;

      // Update positions
      tiles[clickedTileIdx].currentPos = clickedTileIdx;
      tiles[emptyIdx].currentPos = emptyIdx;

      // Check if the moved tile landed in its target
      const didLock = tiles[emptyIdx].currentPos === tiles[emptyIdx].targetPos;
      playSound(didLock ? 'lock' : 'slide');

      // Check Win Condition
      const isWin = tiles.every(t => t.currentPos === t.targetPos);

      const newPlayers = [...players];
      newPlayers[pIdx].tiles = tiles;
      newPlayers[pIdx].moves += 1;

      if (isWin) {
        playSound('win');
        newPlayers[pIdx].isFinished = true;
        newPlayers[pIdx].finishTime = (Date.now() - startTime) / 1000;
        if (newPlayers.every(p => p.isFinished)) {
          setUiState('gameover');
        }
      }

      setPlayers(newPlayers);
    }
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
            <h1 className="text-slate-900 font-black text-sm md:text-xl uppercase leading-none">Slide Seriation</h1>
            <p className="text-sky-600 text-[10px] md:text-xs font-bold uppercase tracking-widest">Order 0 to 10</p>
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
              className={`relative flex flex-col overflow-hidden rounded-[2rem] border-4 p-2 md:p-4 transition-all ${
                player.isFinished ? 'bg-emerald-50 border-emerald-500' : 'bg-sky-50/50 border-slate-200 shadow-xl'
              } ${isHeadToHeadTop ? 'rotate-180' : ''}`}
            >
              {/* Player Header */}
              <div className="flex justify-between items-center px-4 py-2 bg-white/90 backdrop-blur rounded-2xl z-20 shadow-sm border border-slate-100 mb-2 md:mb-4">
                <span className="font-black text-xs md:text-base uppercase tracking-wider truncate mr-2" style={{ color: player.color }}>{player.name}</span>
                <div className="flex gap-1 md:gap-2 items-center bg-slate-100 px-2 md:px-3 py-1 rounded-full shrink-0">
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
                  <span className="font-black text-xs md:text-sm text-slate-600">{player.moves}</span>
                </div>
              </div>

              {/* Grid Canvas */}
              <div className="flex-grow flex items-center justify-center p-2">
                 <div className="grid grid-cols-3 grid-rows-4 gap-1.5 md:gap-3 w-full h-full max-w-sm">
                    {player.tiles.map((tile, tIdx) => {
                       const isCorrect = tile.currentPos === tile.targetPos && tile.value !== null;
                       const isEmpty = tile.value === null;

                       return (
                         <div 
                           key={tIdx}
                           onClick={() => handleTileClick(pIdx, tIdx)}
                           className={`relative flex items-center justify-center rounded-xl md:rounded-2xl transition-all duration-300 select-none
                             ${isEmpty ? 'bg-transparent border-2 border-dashed border-slate-300' : 
                               isCorrect ? 'bg-emerald-500 border-b-4 border-emerald-700 shadow-sm' : 
                               'bg-white border-b-4 border-slate-300 shadow-md hover:bg-sky-50 cursor-pointer active:translate-y-1 active:border-b-0'
                             }
                           `}
                         >
                            {!isEmpty && (
                              <span className={`text-2xl md:text-4xl font-black ${isCorrect ? 'text-white' : 'text-slate-700'}`}>
                                {tile.value}
                              </span>
                            )}
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
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">Slide Seriation</h2>
            <p className="text-slate-500 font-bold mb-8 italic">Slide the tiles to put the numbers in order from 0 to 10!</p>
            
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
              <h2 className="text-5xl font-black text-slate-800 mb-2 tracking-tight">Puzzle Solved!</h2>
              <p className="text-sky-600 font-black uppercase tracking-widest text-sm mb-8">Numbers 0-10 Sorted</p>
              
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