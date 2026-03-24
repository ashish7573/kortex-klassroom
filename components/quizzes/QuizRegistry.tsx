"use client";
import dynamic from 'next/dynamic';
import React from 'react';

// Create a beautiful, reusable loading state so the screen isn't blank while the quiz boots up
const QuizLoader = () => (
  <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-slate-100">
     <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mb-4"></div>
     <h3 className="text-slate-500 font-bold animate-pulse">Loading Interactive Quiz...</h3>
  </div>
);

// 1. Dynamically import each quiz component to prevent Next.js SSR crashes
const Swar1Quiz = dynamic(() => import('./Swar1Quiz'), { ssr: false, loading: () => <QuizLoader /> });
const Swar2Quiz = dynamic(() => import('./Swar2Quiz'), { ssr: false, loading: () => <QuizLoader /> });
const Swar3Quiz = dynamic(() => import('./Swar3Quiz'), { ssr: false, loading: () => <QuizLoader /> });
const Swar4Quiz = dynamic(() => import('./Swar4Quiz'), { ssr: false, loading: () => <QuizLoader /> });

// 2. Map the database URL string to the dynamically imported component
export const QUIZ_REGISTRY = {
  '/quizzes/swar1': Swar1Quiz,
  '/quizzes/swar2': Swar2Quiz,
  '/quizzes/swar3': Swar3Quiz,
  '/quizzes/swar4': Swar4Quiz,
};