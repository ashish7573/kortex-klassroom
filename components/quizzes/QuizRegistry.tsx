"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// ==========================================
// 1. LOADING STATE (The Shell)
// ==========================================
const QuizLoader = () => (
  <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-[3xl] border-4 border-dashed border-slate-200">
     <div className="w-12 h-12 border-8 border-sky-100 border-t-sky-500 rounded-full animate-spin mb-4"></div>
     <h3 className="text-slate-500 font-black text-xl animate-pulse uppercase tracking-widest">Loading Quiz...</h3>
  </div>
);

// ==========================================
// 2. UNIFIED DYNAMIC IMPORTS (100% Lazy Loaded)
// Bypasses the initial bundle bloat completely
// ==========================================
const FLNStoryQuiz = dynamic(() => import('./FLNStoryQuiz'), { ssr: false, loading: () => <QuizLoader /> });
const FrogJumpQuiz = dynamic(() => import('./FrogJumpQuiz'), { ssr: false, loading: () => <QuizLoader /> });
const FingerCountQuiz = dynamic(() => import('./FingerCountQuiz'), { ssr: false, loading: () => <QuizLoader /> });
const BasicOperationWordProblems = dynamic(() => import('./BasicOperationWordProblems'), { ssr: false, loading: () => <QuizLoader /> });
const TallyAddition = dynamic(() => import('./TallyAddition'), { ssr: false, loading: () => <QuizLoader /> });
const MathsPractice = dynamic(() => import('./MathsPractice'), { ssr: false, loading: () => <QuizLoader /> });
const AppleOrderQuiz = dynamic(() => import('./AppleOrderQuiz'), { ssr: false, loading: () => <QuizLoader /> });
const MasterQuizUptoHundred = dynamic(() => import('./MasterQuizUptoHundred'), { ssr: false, loading: () => <QuizLoader /> });
const CPAAdditionQuiz = dynamic(() => import('./CPAAdditionQuiz'), { ssr: false, loading: () => <QuizLoader /> });
const FLNBlocksQuiz = dynamic(() => import('./FLNBlocksQuiz'), { ssr: false, loading: () => <QuizLoader /> });
const BasicOperationsCrossword = dynamic(() => import('./BasicOperationsCrossword'), { ssr: false, loading: () => <QuizLoader /> });
const MultiplicationTranslator = dynamic(() => import('./MultiplicationTranslator'), { ssr: false, loading: () => <QuizLoader /> });
const RapidFireMathArena = dynamic(() => import('./RapidFireMathArena'), { ssr: false, loading: () => <QuizLoader /> });
const FLNHindiAssessment = dynamic(() => import('./FLNHindiAssessment'), { ssr: false, loading: () => <QuizLoader /> });
const SwarVyanjanQuiz = dynamic(() => import('./SwarVyanjanQuiz'), { ssr: false, loading: () => <QuizLoader /> });
const HindiWordQuiz = dynamic(() => import('./HindiWordQuiz'), { ssr: false, loading: () => <QuizLoader /> });
const HindiWordDictation = dynamic(() => import('./HindiWordDictation'), { ssr: false, loading: () => <QuizLoader /> });
const MasterQuizUptoTen = dynamic(() => import('./MasterQuizUptoTen'), { ssr: false, loading: () => <QuizLoader /> });

// ==========================================
// 3. THE ROUTER DICTIONARY
// ==========================================
const SPECIFIC_QUIZZES: Record<string, React.ComponentType<any>> = {
  // --- Core Hindi Assessments ---
  'swar-vyanjan-quiz': SwarVyanjanQuiz, // Catch for the old fallback
  'FLNHindiAssessment': FLNHindiAssessment,
  'hindi-word-match': HindiWordQuiz, 
  'hindi-word-dictation': HindiWordDictation,
  'barahkhadi-dictation': HindiWordDictation,

  // --- Matra Quizzes ---
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

  // --- Matra Dictations ---
  'dictation-matra-aa': HindiWordDictation,
  'dictation-matra-i': HindiWordDictation,
  'dictation-matra-ee': HindiWordDictation,
  'dictation-matra-u': HindiWordDictation,
  'dictation-matra-oo': HindiWordDictation,
  'dictation-matra-e': HindiWordDictation,
  'dictation-matra-ai': HindiWordDictation,
  'dictation-matra-o': HindiWordDictation,
  'dictation-matra-au': HindiWordDictation,
  'dictation-matra-ang': HindiWordDictation,
  'dictation-matra-ah': HindiWordDictation,

  // --- FLN Story Quizzes ---
  'story-1-quiz': FLNStoryQuiz,
  'story-2-quiz': FLNStoryQuiz,
  'story-3-quiz': FLNStoryQuiz,
  'story-4-quiz': FLNStoryQuiz,
  'story-5-quiz': FLNStoryQuiz,
  'story-6-quiz': FLNStoryQuiz,
  'story-7-quiz': FLNStoryQuiz,

  // --- Math Quizzes ---
  'master-quiz-upto-ten': MasterQuizUptoTen,
  'numbers-1-to-10-quiz': MasterQuizUptoTen,
  'frog-jump-quiz': FrogJumpQuiz,
  'finger-count-quiz': FingerCountQuiz,
  'word-problem-quiz': BasicOperationWordProblems,
  'tally-addition-quiz': TallyAddition,
  'maths-practice-generator': MathsPractice,
  'apple-delivery-quiz': AppleOrderQuiz,
  'master-quiz-upto-hundred': MasterQuizUptoHundred,
  'CPA-Addition-Quiz': CPAAdditionQuiz,
  'fln-blocks-quiz': FLNBlocksQuiz,
  'basic-operations-crossword': BasicOperationsCrossword,
  'multiply-practice': MultiplicationTranslator,
  'rapid-fire': RapidFireMathArena
};

// ==========================================
// 4. MAIN COMPONENT EXPORT
// ==========================================
export default function QuizRegistry({ lesson, onComplete }: any) {
  // Extract the slug
  const slug = lesson.subtopicId || lesson.content_url?.split('/').pop();

  if (!slug) {
    return (
      <div className="w-full p-10 text-center text-rose-500 font-bold bg-rose-50 rounded-3xl border-2 border-rose-200">
        Error: Missing Subtopic ID
      </div>
    );
  }

  // Look up the specific quiz in our dictionary
  const SpecificQuiz = SPECIFIC_QUIZZES[slug];

  // Render if found (next/dynamic automatically handles the Suspense!)
  if (SpecificQuiz) {
    return <SpecificQuiz lesson={lesson} onComplete={onComplete} />;
  }

  // Graceful Fallback if the database asks for a quiz that doesn't exist yet
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center p-12 text-center bg-amber-50 rounded-[3xl] border-4 border-amber-200">
      <h2 className="text-amber-500 font-black text-3xl mb-4">Quiz Coming Soon!</h2>
      <p className="text-amber-600 font-bold text-lg max-w-md">
        The interactive quiz for <span className="text-sky-500">"{lesson.title || slug}"</span> is currently being constructed. Check back later!
      </p>
    </div>
  );
}