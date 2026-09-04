"use client";
import dynamic from 'next/dynamic';
import React from 'react';

// 1. Loading Shell (Shows instantly while the game code downloads in the background)
const GameLoader = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-slate-900 rounded-[3xl] border-4 border-slate-800">
     <div className="w-16 h-16 border-8 border-slate-800 border-t-lime-500 rounded-full animate-spin mb-6"></div>
     <h3 className="text-slate-400 font-black text-xl animate-pulse uppercase tracking-widest">Loading Game...</h3>
  </div>
);

// 2. UNIFIED DYNAMIC IMPORTS (The "Lazy Loading" Engine)
const BarahkhadiWordConnect = dynamic(() => import('./BarahkhadiWordConnect'), { ssr: false, loading: () => <GameLoader /> });
const TruckLoader = dynamic(() => import('./TruckLoader'), { ssr: false, loading: () => <GameLoader /> });
const SwarVyanjanGame = dynamic(() => import('./SwarVyanjanGame'), { ssr: false, loading: () => <GameLoader /> });
const MathDefenders = dynamic(() => import('./MathDefenders'), { ssr: false, loading: () => <GameLoader /> });
const HindiWordCrush = dynamic(() => import('./HindiWordCrush'), { ssr: false, loading: () => <GameLoader /> });
const MathArcher = dynamic(() => import('./MathArcher'), { ssr: false, loading: () => <GameLoader /> });
const SeriationArcher = dynamic(() => import('./SeriationArcher'), { ssr: false, loading: () => <GameLoader /> });
const MemorySeriation = dynamic(() => import('./MemorySeriation'), { ssr: false, loading: () => <GameLoader /> });
const SeriationBox = dynamic(() => import('./SeriationBox'), { ssr: false, loading: () => <GameLoader /> });

// 3. THE ROUTER SWITCHBOARD (Strict mapping from Database Slug -> Component)
const SPECIFIC_GAMES: Record<string, React.ComponentType<any>> = {
  'barahkhadi-word-connect': BarahkhadiWordConnect,
  'truck-loader-game': TruckLoader,
  'swar-vyanjan': SwarVyanjanGame,
  'math-defenders': MathDefenders,
  'hindi-word-crush': HindiWordCrush,
  'math-archer': MathArcher,
  'seriation-archer': SeriationArcher,
  'memory-seriation': MemorySeriation,
  'seriation-box': SeriationBox,
  
  // Matra variations all pointing to the HindiWordCrush engine
  'game-matra-aa': HindiWordCrush,
  'game-matra-i': HindiWordCrush,
  'game-matra-ee': HindiWordCrush,
  'game-matra-u': HindiWordCrush,
  'game-matra-oo': HindiWordCrush,
  'game-matra-e': HindiWordCrush,
  'game-matra-ai': HindiWordCrush,
  'game-matra-o': HindiWordCrush,
  'game-matra-au': HindiWordCrush,
  'game-matra-ang': HindiWordCrush,
  'game-matra-ah': HindiWordCrush,
};

// 4. THE MAIN REGISTRY COMPONENT
export default function GameRegistry({ lesson, onComplete }: any) {
  // Grab the ID from the database
  const slug = lesson.subtopicId || lesson.content_url?.split('/').pop();

  // Safety Catch 1: Corrupted Database Entry
  if (!slug) {
    return (
      <div className="w-full p-10 text-center text-rose-500 font-bold bg-rose-50 rounded-3xl border-2 border-rose-200">
        Error: Missing Subtopic ID
      </div>
    );
  }

  // Look up the specific game in our dictionary
  const SpecificGame = SPECIFIC_GAMES[slug];

  // If found, render the dynamically loaded game!
  if (SpecificGame) {
    return <SpecificGame lesson={lesson} onComplete={onComplete} />;
  }

  // Safety Catch 2: Graceful Fallback for missing/unbuilt games
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center p-12 text-center bg-slate-800 rounded-[3xl] border-4 border-slate-700">
      <h2 className="text-lime-500 font-black text-3xl mb-4">Game Coming Soon!</h2>
      <p className="text-slate-400 font-bold text-lg max-w-md">
        The <span className="text-sky-400 uppercase">{lesson.subject || "Subject"}</span> game for <span className="text-amber-400">"{lesson.title || slug}"</span> is currently under construction in the lab. Check back later!
      </p>
    </div>
  );
}