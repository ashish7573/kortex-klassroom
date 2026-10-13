'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Brain, GraduationCap, CheckCircle2, Settings, ArrowRight, Star } from 'lucide-react';

// --- Types ---
type Difficulty = 'easy' | 'hard';
type CardRepresentation = 'number' | 'name' | 'dots' | 'sticks';

interface CardData {
  id: number;
  value: number;
  repType: CardRepresentation;
  isFlipped: boolean;
  isCorrect: boolean;
  rot: number;
  xOffset: number;
  yOffset: number;
}

interface Player {
  id: number;
  name: string;
  color: string;
  cards: CardData[];
  currentTarget: number;
  isFinished: boolean;
  finishTime?: number;
}

interface MemorySeriationProps {
  lesson?: any;
  onComplete?: (results?: { score: number; total: number; time?: number }) => void;
}

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
const NUMBER_NAMES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

// --- Subitization Renderers ---
const renderDots = (num: number, playerCount: number) => {
  const dotSize = playerCount >= 3 ? 'w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5' : 'w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3.5 md:h-3.5';
  return (
    <div className="absolute inset-0 p-[10%] grid grid-cols-2 place-items-center gap-0.5 md:gap-1">
      {Array.from({ length: num }).map((_, i) => (
        <div key={i} className={`${dotSize} rounded-full bg-slate-800 shadow-sm`} />
      ))}
    </div>
  );
};

const renderSticks = (num: number, playerCount: number) => {
  const fullFives = Math.floor(num / 5);
  const remainder = num % 5;
  const svgClass = playerCount >= 3 ? 'w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6' : 'w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8';
  const remHeight = playerCount >= 3 ? 'h-3.5 sm:h-5 md:h-6' : 'h-5 sm:h-7 md:h-8';

  return (
    <div className="absolute inset-0 p-[10%] flex flex-wrap gap-1 md:gap-1.5 justify-center items-center content-center">
      {Array.from({ length: fullFives }).map((_, i) => (
        <svg key={`five-${i}`} viewBox="0 0 40 40" className={`${svgClass} overflow-visible`}>
          <line x1="5" y1="5" x2="5" y2="35" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          <line x1="15" y1="5" x2="15" y2="35" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          <line x1="25" y1="5" x2="25" y2="35" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          <line x1="35" y1="5" x2="35" y2="35" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          <line x1="0" y1="35" x2="40" y2="5" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ))}
      {remainder > 0 && (
        <svg viewBox={`0 0 ${remainder * 10} 40`} className={`${remHeight} overflow-visible`} style={{ width: `${(remainder * 10 / 40) * 1.5}rem` }}>
          {Array.from({ length: remainder }).map((_, i) => (
            <line key={`rem-${i}`} x1={5 + (i * 10)} y1="5" x2={5 + (i * 10)} y2="35" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          ))}
        </svg>
      )}
    </div>
  );
};

const CardVisual = ({ card, playerCount }: { card: CardData; playerCount: number }) => {
  let numSize = "text-xl sm:text-2xl md:text-4xl";
  let nameSize = "text-[9px] sm:text-xs md:text-sm";
  if (playerCount >= 3) {
    numSize = "text-lg sm:text-xl md:text-2xl";
    nameSize = "text-[8px] sm:text-[10px] md:text-xs";
  }

  if (card.repType === 'number') {
    return <span className={`absolute inset-0 flex items-center justify-center font-black ${numSize}`}>{card.value}</span>;
  }
  if (card.repType === 'name') {
    return <span className={`absolute inset-0 flex items-center justify-center font-bold uppercase text-center px-1 leading-tight ${nameSize}`}>{NUMBER_NAMES[card.value]}</span>;
  }
  if (card.repType === 'dots') return renderDots(card.value, playerCount);
  if (card.repType === 'sticks') return renderSticks(card.value, playerCount);
  return null;
};

export default function MemorySeriation({ lesson, onComplete }: MemorySeriationProps) {
  const [uiState, setUiState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [startTime, setStartTime] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const audioCtx = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const playSound = (type: 'correct' | 'error' | 'flip' | 'win') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    if (ctx.state !== 'running') return;

    try {
      if (type === 'correct') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
        });
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
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

  const generateCards = (diff: Difficulty): CardData[] => {
    const cards: CardData[] = [];
    const repTypes: CardRepresentation[] = ['number', 'name', 'dots', 'sticks'];

    // Safe zone boundaries inside player board
    const safeXMin = 15;
    const safeXMax = 85;
    const safeYMin = 28;
    const safeYMax = 86;

    const gridCols = 4;
    const gridRows = 3;
    const xStep = (safeXMax - safeXMin) / (gridCols - 1);
    const yStep = (safeYMax - safeYMin) / (gridRows - 1);

    const availableSlots = Array.from({ length: 12 }, (_, i) => i).sort(() => Math.random() - 0.5);

    for (let i = 1; i <= 10; i++) {
      const slotIndex = availableSlots[i - 1];
      const col = slotIndex % gridCols;
      const row = Math.floor(slotIndex / gridCols);

      const baseLeft = safeXMin + (col * xStep);
      const baseTop = safeYMin + (row * yStep);

      const jitterX = (Math.random() * 6) - 3;
      const jitterY = (Math.random() * 6) - 3;

      cards.push({
        id: i,
        value: i,
        repType: diff === 'easy' ? 'number' : repTypes[Math.floor(Math.random() * repTypes.length)],
        isFlipped: false,
        isCorrect: false,
        rot: Math.floor(Math.random() * 20) - 10,
        xOffset: baseLeft + jitterX,
        yOffset: baseTop + jitterY
      });
    }

    return cards.sort(() => Math.random() - 0.5);
  };

  const startGame = () => {
    initAudio();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const actualPlayerCount = isMobile ? Math.min(playerCount, 2) : playerCount;

    const newPlayers: Player[] = Array.from({ length: actualPlayerCount }).map((_, i) => ({
      id: i,
      name: `Hero ${i + 1}`,
      color: PLAYER_COLORS[i],
      cards: generateCards(difficulty),
      currentTarget: 1,
      isFinished: false
    }));
    setPlayers(newPlayers);
    const now = Date.now();
    setStartTime(now);
    setSecondsElapsed(0);
    setUiState('playing');
  };

  const handleCardClick = (playerIdx: number, cardIdx: number) => {
    if (uiState !== 'playing' || players[playerIdx].isFinished) return;

    const player = players[playerIdx];
    const card = player.cards[cardIdx];

    if (card.isFlipped || card.isCorrect) return;

    const newPlayers = [...players];
    const newCards = [...player.cards];

    newCards[cardIdx].isFlipped = true;
    playSound('flip');

    if (card.value === player.currentTarget) {
      newCards[cardIdx].isCorrect = true;
      newPlayers[playerIdx].currentTarget += 1;
      playSound('correct');

      if (newPlayers[playerIdx].currentTarget > 10) {
        newPlayers[playerIdx].isFinished = true;
        newPlayers[playerIdx].finishTime = (Date.now() - startTime) / 1000;

        if (newPlayers.every(p => p.isFinished)) {
          playSound('win');
          setTimeout(() => {
            setUiState('gameover');
          }, 400);
        }
      }
      setPlayers(newPlayers);
    } else {
      playSound('error');
      setPlayers(newPlayers);
      setTimeout(() => {
        setPlayers(prevPlayers => {
          const updated = [...prevPlayers];
          updated[playerIdx].cards = updated[playerIdx].cards.map(c => ({
            ...c, isFlipped: false, isCorrect: false
          }));
          updated[playerIdx].currentTarget = 1;
          return updated;
        });
      }, 750);
    }
  };

  const bestFinishTime = Math.min(
    ...players.filter(p => p.finishTime !== undefined).map(p => p.finishTime!),
    secondsElapsed
  );

  return (
    <div className="relative w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-100 font-sans touch-none select-none">
      {/* HEADER */}
      <div className="h-14 sm:h-16 md:h-18 bg-white border-b-2 sm:border-b-4 border-slate-200 flex items-center justify-between px-3 sm:px-6 z-30 relative shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-amber-500 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-sm">
            <Brain className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-xs sm:text-base md:text-xl uppercase leading-none">
              Memory Seriation
            </h1>
            <p className="text-amber-600 text-[9px] sm:text-[11px] md:text-xs font-bold uppercase tracking-wider">
              Sequence 1 to 10
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
                player.isFinished ? 'bg-emerald-50 border-emerald-500 opacity-60' : 'bg-amber-50/50 border-slate-200 shadow-md'
              } ${isHeadToHeadTop ? 'rotate-180' : ''}`}
            >
              {/* Player Header */}
              <div className="absolute top-2 inset-x-2 flex justify-between items-center px-3 py-1.5 bg-white/90 backdrop-blur rounded-xl sm:rounded-2xl z-20 shadow-sm border border-slate-100">
                <span className="font-black text-xs sm:text-sm md:text-base uppercase tracking-wider truncate mr-2" style={{ color: player.color }}>
                  {player.name}
                </span>
                <div className="flex gap-1 items-center bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                  <GraduationCap className="w-3 h-3 text-slate-500" />
                  <span className="font-black text-[11px] sm:text-xs text-slate-700">Target: {player.currentTarget <= 10 ? player.currentTarget : '10'}</span>
                </div>
              </div>

              {/* Messy Table Canvas */}
              <div className="flex-grow relative w-full h-full mt-9 sm:mt-11">
                {player.cards.map((card, cIdx) => (
                  <div
                    key={cIdx}
                    onClick={() => handleCardClick(pIdx, cIdx)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer [perspective:1000px] hover:z-30 transition-transform active:scale-95 ${
                      playerCount >= 3
                        ? 'w-10 h-14 sm:w-14 sm:h-20 md:w-16 md:h-22'
                        : playerCount === 2
                        ? 'w-11 h-15 sm:w-16 sm:h-22 md:w-20 md:h-28'
                        : 'w-13 h-18 sm:w-18 sm:h-24 md:w-20 md:h-28'
                    }`}
                    style={{
                      left: `${card.xOffset}%`,
                      top: `${card.yOffset}%`,
                      transform: `translate(-50%, -50%) rotate(${card.rot}deg)`
                    }}
                  >
                    <div
                      className="relative w-full h-full transition-transform duration-500 shadow-md rounded-xl sm:rounded-2xl"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: card.isFlipped || card.isCorrect ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}
                    >
                      {/* Front (Card Back Design) */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border-2 sm:border-[3px] border-white bg-sky-500 overflow-hidden"
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
                      >
                        <div
                          className="absolute inset-0 opacity-20 pointer-events-none"
                          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 20px)' }}
                        />
                        <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 z-10" />
                      </div>

                      {/* Back (The Value) */}
                      <div
                        className={`absolute inset-0 flex items-center justify-center rounded-xl sm:rounded-2xl border-2 sm:border-4 ${
                          card.isCorrect ? 'bg-emerald-400 border-emerald-300 text-slate-950 font-black' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <CardVisual card={card} playerCount={playerCount} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Finished Overlay with Time */}
              {player.isFinished && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-[2rem] z-40 animate-in fade-in duration-200">
                  <div className="bg-white p-3 rounded-full shadow-xl mb-2">
                    <CheckCircle2 className="w-10 h-10 sm:w-14 sm:h-14 text-emerald-500" />
                  </div>
                  <div className="bg-slate-800 text-white px-3 py-1.5 rounded-full font-mono font-bold text-xs sm:text-sm shadow-md border border-slate-600">
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
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 max-w-xl w-full shadow-2xl text-center border-4 border-white/30 my-auto animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 sm:w-18 sm:h-18 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 mb-1 tracking-tight">Memory Seriation</h2>
            <p className="text-slate-500 font-bold text-xs sm:text-sm mb-6">
              Turn cards over and find numbers 1 to 10 in sequential order. A wrong card resets the board!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 text-left">
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Card Mode</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDifficulty('easy')}
                    className={`flex-1 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm border-b-4 transition-all ${
                      difficulty === 'easy' ? 'bg-sky-500 border-sky-700 text-white shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Easy (Digits)
                  </button>
                  <button
                    onClick={() => setDifficulty('hard')}
                    className={`flex-1 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm border-b-4 transition-all ${
                      difficulty === 'hard' ? 'bg-rose-500 border-rose-700 text-white shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Hard (Mixed)
                  </button>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Players</p>
                  <span className="text-[10px] text-amber-600 font-bold sm:hidden">1P or 2P Face-to-Face</span>
                </div>
                <div className="flex gap-1.5 sm:grid sm:grid-cols-4">
                  {/* 1 Player (Always available) */}
                  <button
                    onClick={() => setPlayerCount(1)}
                    className={`flex-1 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm border-b-4 transition-all ${
                      playerCount === 1 ? 'bg-amber-500 border-amber-700 text-white shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    1P
                  </button>

                  {/* 2 Players (Available on mobile for Face-to-Face and on large screens) */}
                  <button
                    onClick={() => setPlayerCount(2)}
                    className={`flex-1 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm border-b-4 transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 ${
                      playerCount === 2 ? 'bg-amber-500 border-amber-700 text-white shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>2P</span>
                    <span className="text-[9px] font-bold text-amber-200 sm:hidden">🔄 Invert</span>
                  </button>

                  {/* 3P, 4P - Hidden on small mobile screens */}
                  {[3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => setPlayerCount(n)}
                      className={`hidden sm:flex flex-1 items-center justify-center py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm border-b-4 transition-all ${
                        playerCount === n ? 'bg-amber-500 border-amber-700 text-white shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
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
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 mb-1 tracking-tight">Race Finished!</h2>
            <p className="text-emerald-600 font-bold uppercase tracking-wider text-xs sm:text-sm mb-4">
              All 10 Cards Sequenced!
            </p>

            <div className="flex justify-center items-center gap-1.5 mb-4 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>

            <div className="space-y-2 mb-6 max-h-[30vh] overflow-y-auto">
              {[...players].sort((a, b) => (a.finishTime || 0) - (b.finishTime || 0)).map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-50 p-2.5 sm:p-3 rounded-xl border-l-4 shadow-sm" style={{ borderLeftColor: p.color }}>
                  <span className="font-black text-xs sm:text-sm text-slate-700">#{i + 1} {p.name} {i === 0 && '👑'}</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-slate-500">{p.finishTime ? `${p.finishTime.toFixed(1)}s` : `${secondsElapsed}s`}</span>
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
                  onClick={() => onComplete({ score: 10, total: 10, time: Number(bestFinishTime.toFixed(1)) })}
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