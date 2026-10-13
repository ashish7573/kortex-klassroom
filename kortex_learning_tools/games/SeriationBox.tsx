'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, LayoutGrid, CheckCircle2, Settings, ArrowRight, Star } from 'lucide-react';

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

interface SeriationBoxProps {
  lesson?: any;
  onComplete?: (results?: { score: number; total: number; moves?: number; time?: number }) => void;
}

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

export default function SeriationBox({ lesson, onComplete }: SeriationBoxProps) {
  const [uiState, setUiState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(1);
  const [startTime, setStartTime] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const audioCtx = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Multi-touch Registry
  const activeTouches = useRef<Record<number, { startX: number; startY: number; tileId: number; pIdx: number }>>({});

  // Auto-clamp mobile screens (< 640px) to max 2 Players (1P Solo or 2P Face-to-Face)
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        setPlayerCount(c => (c > 2 ? 1 : c));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer Lifecycle
  useEffect(() => {
    if (uiState === 'playing') {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [uiState, startTime]);

  // Audio Synthesis & Lifecycle
  const initAudio = useCallback(() => {
    if (typeof window !== 'undefined' && !audioCtx.current) {
      const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (WinAudioContext) audioCtx.current = new WinAudioContext();
    }
    if (audioCtx.current && audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  }, []);

  const playSound = (type: 'slide' | 'win' | 'error') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    if (ctx.state !== 'running') return;

    try {
      if (type === 'slide') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.09);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
        });
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {}
  };

  // Safe audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtx.current && audioCtx.current.state !== 'closed') {
        try {
          audioCtx.current.close();
        } catch {}
      }
    };
  }, []);

  const checkWin = (tiles: TileData[]) => {
    for (let i = 1; i <= 10; i++) {
      const tile = tiles.find(t => t.value === i);
      if (!tile || tile.currentIdx !== i - 1) return false;
    }
    return true;
  };

  // Generate Solvable 12-Slot Board (10 numbered tiles, 2 empty slots)
  const generateSolvableGrid = (): TileData[] => {
    const grid: (number | null)[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null, null];
    let emptyIndices = [10, 11];

    for (let i = 0; i < 180; i++) {
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
        emptyIndices = grid.map((val, idx) => (val === null ? idx : -1)).filter(idx => idx !== -1);
      }
    }

    return grid
      .map((val, idx) => {
        if (val === null) return null;
        return { id: val, value: val, currentIdx: idx };
      })
      .filter(Boolean) as TileData[];
  };

  const startGame = () => {
    initAudio();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const actualPlayerCount = isMobile ? Math.min(playerCount, 2) : playerCount;

    const newPlayers: Player[] = Array.from({ length: actualPlayerCount }).map((_, i) => ({
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

  // --- Multi-Touch & Swipe Handlers ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, pIdx: number, tileId: number) => {
    if (uiState !== 'playing' || players[pIdx].isFinished) return;
    initAudio();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

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

    if (Math.abs(dx) > 18 || Math.abs(dy) > 18) {
      let dir: 'up' | 'down' | 'left' | 'right';
      if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? 'right' : 'left';
      else dir = dy > 0 ? 'down' : 'up';

      attemptMove(touch.pIdx, touch.tileId, dir);
    } else {
      attemptTap(touch.pIdx, touch.tileId);
    }

    delete activeTouches.current[e.pointerId];
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Physics: Directional Swipe Move
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
      if (dir === 'up' && cIdx >= 3) newIdx = cIdx - 3;
      else if (dir === 'down' && cIdx <= 8) newIdx = cIdx + 3;
      else if (dir === 'left' && cIdx % 3 !== 0) newIdx = cIdx - 1;
      else if (dir === 'right' && cIdx % 3 !== 2) newIdx = cIdx + 1;

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
        }, 500);
      }

      return newPlayers;
    });
  };

  // Physics: Direct Tap-to-Slide Fallback (Snappy & friction-free)
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
          }, 500);
        }

        return newPlayers;
      }

      playSound('error');
      return prev;
    });
  };

  const bestPlayer = [...players].sort((a, b) => (a.finishTime || 9999) - (b.finishTime || 9999))[0];
  const bestMoves = bestPlayer ? bestPlayer.moves : 0;
  const bestTime = bestPlayer && bestPlayer.finishTime ? Number(bestPlayer.finishTime.toFixed(1)) : secondsElapsed;

  return (
    <div className="relative w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-100 font-sans touch-none select-none">
      {/* HEADER */}
      <div className="h-14 sm:h-16 md:h-18 bg-white border-b-2 sm:border-b-4 border-slate-200 flex items-center justify-between px-3 sm:px-6 z-30 relative shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-sky-500 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-sm">
            <LayoutGrid className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-xs sm:text-base md:text-xl uppercase leading-none">
              Slide Sort
            </h1>
            <p className="text-sky-600 text-[9px] sm:text-[11px] md:text-xs font-bold uppercase tracking-wider">
              Order 1 to 10
            </p>
          </div>
        </div>

        {uiState === 'playing' && (
          <div className="flex gap-2 sm:gap-3 items-center">
            <div className="bg-slate-100 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border border-slate-200 font-mono font-black text-xs sm:text-sm text-slate-700">
              ⏱️ {secondsElapsed}s
            </div>
            <button
              onClick={() => {
                initAudio();
                setUiState('menu');
              }}
              className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs sm:text-sm transition-all shadow-sm"
              title="Return to Menu"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Menu</span>
            </button>
          </div>
        )}
      </div>

      {/* STAGE */}
      <div className={`w-full flex-1 min-h-0 p-2 sm:p-3 md:p-4 grid gap-2 md:gap-4 ${
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
              className={`relative flex flex-col overflow-hidden rounded-2xl sm:rounded-[2rem] border-2 sm:border-4 p-2 transition-all ${
                player.isFinished ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-200/50 border-slate-300 shadow-inner'
              } ${isHeadToHeadTop ? 'rotate-180' : ''}`}
            >
              {/* PUZZLE GRID AREA */}
              <div className="flex-grow flex items-center justify-center relative min-h-0 w-full p-1.5 sm:p-2">
                <div className="relative h-full max-h-[78vh] aspect-[3/4] bg-slate-800 rounded-2xl sm:rounded-[2rem] border-4 sm:border-8 border-slate-700 overflow-hidden shadow-2xl mx-auto">
                  {/* Target Indicators Background */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 p-1 gap-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={`bg-${i}`} className="w-full h-full rounded-xl border-2 border-slate-700 flex items-center justify-center opacity-30">
                        {i < 10 && <span className="text-xl sm:text-3xl font-black text-slate-600">{i + 1}</span>}
                      </div>
                    ))}
                  </div>

                  {/* Puzzle Tiles */}
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
                        className="absolute w-[33.33%] h-[25%] p-1 transition-all duration-200 ease-out select-none touch-none cursor-grab active:cursor-grabbing z-10 hover:z-20"
                        style={{
                          left: `${col * 33.33}%`,
                          top: `${row * 25}%`
                        }}
                      >
                        <div
                          className={`w-full h-full flex items-center justify-center rounded-xl sm:rounded-2xl border-b-4 sm:border-b-[6px] shadow-sm transition-colors ${
                            isCorrect
                              ? 'bg-emerald-400 border-emerald-600 text-emerald-950'
                              : 'bg-white border-slate-300 text-slate-700 active:bg-slate-100'
                          }`}
                        >
                          <span className="text-2xl sm:text-4xl md:text-5xl font-black">{tile.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Finished Overlay */}
              {player.isFinished && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-[2rem] z-40 animate-in fade-in duration-200">
                  <div className="bg-white p-3 sm:p-4 rounded-full shadow-2xl mb-2">
                    <CheckCircle2 className="w-10 h-10 sm:w-16 sm:h-16 text-emerald-500" />
                  </div>
                  <div className="bg-slate-800 text-white px-3 sm:px-4 py-1.5 rounded-full font-mono font-bold text-xs sm:text-sm shadow-lg border-2 border-slate-600">
                    {player.finishTime?.toFixed(1)}s • {player.moves} moves
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MENU OVERLAY */}
      {uiState === 'menu' && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 max-w-lg w-full shadow-2xl text-center border-4 border-white/30 my-auto animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 sm:w-18 sm:h-18 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-8 h-8 sm:w-10 sm:h-10 text-sky-500" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 mb-1 tracking-tight">Slide Sort</h2>
            <p className="text-slate-500 font-bold text-xs sm:text-sm mb-6">
              Swipe or tap tiles to slide them into empty spaces. Arrange all numbers from 1 to 10 in sequential order!
            </p>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-left">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Select Players</p>
                <span className="text-[10px] text-sky-600 font-bold sm:hidden">1P or 2P Face-to-Face</span>
              </div>
              <div className="flex gap-1.5 sm:grid sm:grid-cols-4">
                {/* 1 Player (Always available) */}
                <button
                  onClick={() => setPlayerCount(1)}
                  className={`flex-1 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm border-b-4 transition-all ${
                    playerCount === 1 ? 'bg-sky-500 border-sky-700 text-white shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  1P
                </button>

                {/* 2 Players (Available on mobile for Face-to-Face and on large screens) */}
                <button
                  onClick={() => setPlayerCount(2)}
                  className={`flex-1 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm border-b-4 transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 ${
                    playerCount === 2 ? 'bg-sky-500 border-sky-700 text-white shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>2P</span>
                  <span className="text-[9px] font-bold text-sky-200 sm:hidden">🔄 Invert</span>
                </button>

                {/* 3P, 4P - Hidden on small mobile screens */}
                {[3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className={`hidden sm:flex flex-1 items-center justify-center py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm border-b-4 transition-all ${
                      playerCount === n ? 'bg-sky-500 border-sky-700 text-white shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {n}P
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 font-medium sm:hidden mt-1">
                💡 In 2P on mobile, Player 1 is inverted (180°) so you can sit face-to-face across the table!
              </p>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg sm:text-xl rounded-2xl shadow-lg border-b-4 border-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" /> START RACE
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER RESULTS OVERLAY (Dual CTAs) */}
      {uiState === 'gameover' && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 max-w-md w-full shadow-2xl text-center border-4 border-slate-200 my-auto animate-in zoom-in-95 duration-200">
            <Trophy className="w-14 h-14 sm:w-18 sm:h-18 text-amber-500 mx-auto mb-2 animate-bounce" />
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 mb-1 tracking-tight">Sort Complete!</h2>
            <p className="text-sky-600 font-bold uppercase tracking-wider text-xs sm:text-sm mb-4">
              All Numbers Sequenced 1 to 10!
            </p>

            <div className="flex justify-center items-center gap-1.5 mb-4 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>

            <div className="space-y-2 mb-6 max-h-[30vh] overflow-y-auto">
              {[...players].sort((a, b) => (a.finishTime || 9999) - (b.finishTime || 9999)).map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-50 p-2.5 sm:p-3 rounded-xl border-l-4 shadow-sm" style={{ borderLeftColor: p.color }}>
                  <span className="font-black text-xs sm:text-sm text-slate-700">#{i + 1} {p.name} {i === 0 && '👑'}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-400">{p.moves} moves</span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-lg">{p.finishTime?.toFixed(1)}s</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={startGame}
                className="flex-1 py-3 sm:py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-700 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              {onComplete && (
                <button
                  onClick={() => onComplete({ score: 10, total: 10, moves: bestMoves, time: bestTime })}
                  className="flex-1 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setUiState('menu')}
                className="py-3 sm:py-3.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm border border-slate-300 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Settings className="w-4 h-4" /> Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}