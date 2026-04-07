"use client";
import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

const QuizLoader = () => (
  <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-slate-100">
     <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mb-4"></div>
     <h3 className="text-slate-500 font-bold animate-pulse">Loading Interactive Quiz...</h3>
  </div>
);

// The Swar & Vyanjan Engine we built
const SwarVyanjanQuiz = dynamic(() => import('./SwarVyanjanQuiz'), { 
  ssr: false,
  loading: () => <QuizLoader /> 
});

// Retaining your Place Value Master Demo Quiz!
const DemoQuiz = dynamic(() => import('../demo/PlaceValueDemo').then(mod => mod.DemoQuiz), { ssr: false });

const SPECIFIC_QUIZZES: any = {
  'quiz': DemoQuiz, // This catches the '/demo/quiz' from your old setup
};

export default function QuizRegistry({ lesson, onComplete }: any) {
  // Extract the slug (fallback to content_url to support your demo lesson)
  const slug = lesson.subtopicId || lesson.content_url?.split('/').pop();

  if (!slug) return <div className="p-10 text-center text-rose-500 font-bold">Error: Missing Subtopic ID</div>;

  // 1. Check for unique quizzes first (like the Master Demo)
  const SpecificQuiz = SPECIFIC_QUIZZES[slug];
  if (SpecificQuiz) {
    return <Suspense fallback={<QuizLoader />}><SpecificQuiz onComplete={onComplete} /></Suspense>;
  }

  // 2. Route by Subject
  return (
    <Suspense fallback={<QuizLoader />}>
      {lesson.subject === 'Hindi' ? (
        <SwarVyanjanQuiz lesson={lesson} onComplete={onComplete} />
      ) : (
        <div className="p-12 text-center bg-amber-50 rounded-3xl border-2 border-amber-100">
          <h2 className="text-amber-600 font-black text-2xl">Quiz Coming Soon!</h2>
          <p className="text-amber-500 font-bold">The {lesson.subject} quiz is currently under construction.</p>
        </div>
      )}
    </Suspense>
  );
}