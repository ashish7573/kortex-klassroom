"use client";
import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

const QuizLoader = () => (
  <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-slate-100">
     <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mb-4"></div>
     <h3 className="text-slate-500 font-bold animate-pulse">Loading Interactive Quiz...</h3>
  </div>
);

// 1. The Swar & Vyanjan Engine
const SwarVyanjanQuiz = dynamic(() => import('./SwarVyanjanQuiz'), { 
  ssr: false,
  loading: () => <QuizLoader /> 
});

// 2. NEW: The Hindi Word & Picture Match Engine
const HindiWordQuiz = dynamic(() => import('./HindiWordQuiz'), { 
  ssr: false,
  loading: () => <QuizLoader /> 
});

// 3. NEW: The Hindi Word Dictation
const HindiWordDictation = dynamic(() => import('./HindiWordDictation'), { 
  ssr: false, loading: () => <QuizLoader /> 
});

// --- THE ROUTER SWITCHBOARD (subtopic id are matched here from csv)---
const SPECIFIC_QUIZZES: any = {
  'hindi-word-match': HindiWordQuiz, 
  'hindi-word-dictation': HindiWordDictation,
  'quiz-matra-aa': HindiWordQuiz,
  'quiz-matra-i': HindiWordQuiz,
  'quiz-matra-ee': HindiWordQuiz,
  'quiz-matra-u': HindiWordQuiz,
  'quiz-matra-oo': HindiWordQuiz,
  'quiz-matra-e': HindiWordQuiz,
  'quiz-matra-ai': HindiWordQuiz,
  'quiz-matra-o': HindiWordQuiz,
  'quiz-matra-au': HindiWordQuiz,
  'quiz-matra-ang': HindiWordQuiz,
  'quiz-matra-ah': HindiWordQuiz,
};

export default function QuizRegistry({ lesson, onComplete }: any) {
  // Extract the slug
  const slug = lesson.subtopicId || lesson.content_url?.split('/').pop();

  if (!slug) return <div className="p-10 text-center text-rose-500 font-bold">Error: Missing Subtopic ID</div>;

  // 1. Check for unique quizzes first (like the Word Match)
  const SpecificQuiz = SPECIFIC_QUIZZES[slug];
  if (SpecificQuiz) {
    return (
      <Suspense fallback={<QuizLoader />}>
        <SpecificQuiz lesson={lesson} onComplete={onComplete} />
      </Suspense>
    );
  }

  // 2. Route by Subject (Fallback logic)
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