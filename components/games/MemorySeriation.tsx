'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Users, Brain, GraduationCap, CheckCircle2 } from 'lucide-react';

// --- Types ---
type Difficulty = 'easy' | 'hard';
type CardRepresentation = 'number' | 'name' | 'dots' | 'sticks';

interface CardData {
  id: number;
  value: number;
  repType: CardRepresentation;
  isFlipped: boolean;
  isCorrect: boolean;
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

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
const NUMBER_NAMES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

// --- Helper Renderers (Moved outside to prevent re-declaration) ---
const renderDots = (num: number) => (
  <div className="grid grid-cols-3 gap-1 p-1">
    {Array.from({ length: num }).map((_, i) => (
      <div key={i} className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-slate-800" />
    ))}
  </div>
);

const renderSticks = (num: number) => (
  <div className="flex flex-wrap gap-1 justify-center items-center h-full">
    {Array.from({ length: num }).map((_, i) => (
      <div key={i} className={`w-1 h-6 md:h-10 bg-slate-800 rounded-full ${i % 5 === 4 ? 'rotate-[30deg] -ml-4' : ''}`} />
    ))}
  </div>
);

const CardVisual = ({ card }: { card: CardData }) => {
  if (card.repType === 'number') return <span className="text-2xl md:text-4xl font-black">{card.value}</span>;
  if (card.repType === 'name') return <span className="text-xs md:text-sm font-bold uppercase text-center px-1">{NUMBER_NAMES[card.value]}</span>;
  if (card.repType === 'dots') return renderDots(card.value);
  if (card.repType === 'sticks') return renderSticks(card.value);
  return null;
};

export default function MemorySeriation({ lesson, onComplete }: any) {
  const [uiState, setUiState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [startTime, setStartTime] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const audioCtx = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Timer Logic (Fixes Vercel Hydration Mismatch) ---
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

  const initAudio = () => {
    if (typeof window !== 'undefined' && !audioCtx.current) {
      const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (WinAudioContext) audioCtx.current = new WinAudioContext();
    }
  };

  const playSound = (type: 'correct' | 'error' | 'flip') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  };

  const generateCards = (diff: Difficulty): CardData[] => {
    const cards: CardData[] = [];
    const repTypes: CardRepresentation[] = ['number', 'name', 'dots', 'sticks'];
    for (let i = 1; i <= 10; i++) {
      cards.push({
        id: i,
        value: i,
        repType: diff === 'easy' ? 'number' : repTypes[Math.floor(Math.random() * repTypes.length)],
        isFlipped: false,
        isCorrect: false
      });
    }
    return cards.sort(() => Math.random() - 0.5);
  };

  const startGame = () => {
    initAudio();
    const newPlayers: Player[] = Array.from({ length: playerCount }).map((_, i) => ({
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
        if (newPlayers.every(p => p.isFinished)) setUiState('gameover');
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
      }, 800);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-100 font-sans touch-none select-none">
      
      {/* HEADER */}
      <div className="h-16 md:h-20 bg-white border-b-4 border-slate-200 flex items-center justify-between px-4 md:px-8 z-30 relative">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-2xl">
            <Brain className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-sm md:text-xl uppercase leading-none">Memory Seriation</h1>
            <p className="text-amber-600 text-[10px] md:text-xs font-bold uppercase tracking-widest">Order 1 to 10 Race</p>
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
      <div className={`w-full h-[calc(100vh-80px)] p-2 md:p-4 grid gap-2 md:gap-4 ${
        playerCount === 1 ? 'grid-cols-1' : playerCount === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'
      }`}>
        {players.map((player, pIdx) => (
          <div 
            key={player.id} 
            className={`relative flex flex-col rounded-[2rem] border-4 p-2 md:p-4 transition-all ${
              player.isFinished ? 'bg-emerald-50 border-emerald-500 opacity-60' : 'bg-white border-slate-200 shadow-xl'
            }`}
          >
            <div className="flex justify-between items-center mb-2 px-2">
              <span className="font-black text-sm md:text-lg uppercase" style={{ color: player.color }}>{player.name}</span>
              <div className="flex gap-1 items-center">
                 <GraduationCap className="w-4 h-4 text-slate-400" />
                 <span className="font-black text-slate-400">{player.currentTarget - 1}/10</span>
              </div>
            </div>

            <div className="flex-grow grid grid-cols-5 grid-rows-2 gap-1 md:gap-3">
              {player.cards.map((card, cIdx) => (
                <div 
                  key={cIdx}
                  onClick={() => handleCardClick(pIdx, cIdx)}
                  className="relative cursor-pointer h-full [perspective:1000px]"
                >
                  <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${card.isFlipped || card.isCorrect ? '[transform:rotateY(180deg)]' : ''}`}>
                    {/* Front */}
                    <div className="absolute inset-0 [backface-visibility:hidden] flex items-center justify-center rounded-xl md:rounded-3xl border-b-4 md:border-b-8 border-slate-300 bg-slate-200 text-slate-400 text-xl md:text-4xl font-black">
                      ?
                    </div>
                    {/* Back */}
                    <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center rounded-xl md:rounded-3xl border-b-4 md:border-b-8 ${
                      card.isCorrect ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}>
                      <CardVisual card={card} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {player.isFinished && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-[2rem] z-10">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MENU OVERLAY */}
      {uiState === 'menu' && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-6 md:p-10 max-w-2xl w-full shadow-2xl text-center border-8 border-white/20">
            <div className="w-20 h-20 md:w-24 md:h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <Brain className="w-10 h-10 md:w-12 md:h-12 text-amber-500" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">Memory Seriation</h2>
            <p className="text-slate-500 font-bold mb-8 italic">Find numbers 1 to 10 in order. Make a mistake, and all cards reset!</p>
            
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Mode</p>
                <div className="flex gap-2">
                  <button onClick={() => setDifficulty('easy')} className={`flex-1 py-3 rounded-2xl font-black border-b-4 transition-all ${difficulty === 'easy' ? 'bg-sky-500 border-sky-700 text-white shadow-lg' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>Easy</button>
                  <button onClick={() => setDifficulty('hard')} className={`flex-1 py-3 rounded-2xl font-black border-b-4 transition-all ${difficulty === 'hard' ? 'bg-rose-500 border-rose-700 text-white shadow-lg' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>Hard</button>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Players</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <button key={n} onClick={() => setPlayerCount(n)} className={`py-3 rounded-2xl font-black border-b-4 transition-all ${playerCount === n ? 'bg-amber-500 border-amber-700 text-white shadow-lg' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>{n}</button>
                  ))}
                </div>
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
        <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-2xl text-center border-8 border-white/20">
              <Trophy className="w-24 h-24 text-amber-500 mx-auto mb-6" />
              <h2 className="text-5xl font-black text-slate-800 mb-2 tracking-tight">Race Finished!</h2>
              <p className="text-emerald-600 font-black uppercase tracking-widest text-sm mb-8">Fastest Brain Wins</p>
              
              <div className="space-y-3 mb-8">
                 {[...players].sort((a,b) => (a.finishTime || 0) - (b.finishTime || 0)).map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-l-8 shadow-sm" style={{ borderLeftColor: p.color }}>
                       <span className="font-black text-slate-700">#{i+1} {p.name}</span>
                       <span className="font-mono font-bold text-slate-400">{p.finishTime?.toFixed(1)}s</span>
                    </div>
                 ))}
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setUiState('menu')} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl border-b-4 border-slate-300 transition-transform active:translate-y-1">RESTART</button>
                 <button onClick={() => onComplete?.()} className="flex-1 py-4 bg-sky-500 text-white font-black rounded-2xl border-b-4 border-sky-700 transition-transform active:translate-y-1 shadow-lg">FINISH</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}