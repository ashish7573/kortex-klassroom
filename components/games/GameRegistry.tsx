"use client";
import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';
import BarahkhadiWordConnect from './BarahkhadiWordConnect';

// Loading Shell
const GameLoader = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-slate-900 rounded-[3xl] border-4 border-slate-800">
     <div className="w-16 h-16 border-8 border-slate-800 border-t-lime-500 rounded-full animate-spin mb-6"></div>
     <h3 className="text-slate-400 font-black text-xl animate-pulse uppercase tracking-widest">Loading Game...</h3>
  </div>
);

// --- IMPORT YOUR GAMES HERE ---

// 1. The FLN Hindi Balloon Pop Game
const SwarVyanjanGame = dynamic(() => import('./SwarVyanjanGame'), { 
  ssr: false,
  loading: () => <GameLoader /> 
});


// 2. NEW: The Math Defenders Space Shooter!
const MathDefenders = dynamic(() => import('../games/MathDefenders'), { 
  ssr: false, 
  loading: () => <GameLoader /> 
});

// 3. Hindi Words Crush Game!
const HindiWordCrush = dynamic(() => import('./HindiWordCrush'), { 
  ssr: false, loading: () => <GameLoader /> 
});

// --- THE ROUTER SWITCHBOARD ---
const SPECIFIC_GAMES: any = {
  'barahkhadi-word-connect': BarahkhadiWordConnect,
  'math-defenders': MathDefenders, // Catches your new arcade game from the CSV
  'hindi-word-crush': HindiWordCrush,
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

export default function GameRegistry({ lesson, onComplete }: any) {
  // Grab the ID from the database
  const slug = lesson.subtopicId || lesson.content_url?.split('/').pop();

  if (!slug) return <div className="p-10 text-center text-rose-500 font-bold">Error: Missing Subtopic ID</div>;

  // 1. Check for unique games first (Like Math Defenders)
  const SpecificGame = SPECIFIC_GAMES[slug];
  if (SpecificGame) {
    return <Suspense fallback={<GameLoader />}><SpecificGame lesson={lesson} onComplete={onComplete} /></Suspense>;
  }

  // 2. Route by Subject (Fallback logic)
  return (
    <Suspense fallback={<GameLoader />}>
      {lesson.subject === 'Hindi' ? (
        <SwarVyanjanGame lesson={lesson} onComplete={onComplete} />
      ) : (
        <div className="p-12 text-center bg-slate-800 rounded-3xl border-2 border-slate-700">
          <h2 className="text-lime-500 font-black text-2xl">Game Coming Soon!</h2>
          <p className="text-slate-400 font-bold">The {lesson.subject} game is currently under construction.</p>
        </div>
      )}
    </Suspense>
  );
}