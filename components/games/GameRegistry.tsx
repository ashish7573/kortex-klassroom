"use client";
import dynamic from 'next/dynamic';
import React from 'react';

// A beautiful, arcade-style loading state for your games
const GameLoader = () => (
  <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-slate-900 rounded-3xl border-4 border-slate-800">
     <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mb-6"></div>
     <h3 className="text-slate-300 font-bold animate-pulse tracking-widest uppercase text-sm">Booting Game Engine...</h3>
  </div>
);

// 1. Dynamically import the game to prevent Server-Side Rendering crashes
const Swar1Game = dynamic(() => import('./Swar1Game'), { ssr: false, loading: () => <GameLoader /> });
const DemoGame = dynamic(() => import('../demo/PlaceValueDemo').then(mod => mod.DemoGame), { ssr: false });

// 2. Map the database URL string (content_url) to the Game Component
export const GAME_REGISTRY = {
  '/games/swar1': Swar1Game,
  '/demo/game': DemoGame,
};