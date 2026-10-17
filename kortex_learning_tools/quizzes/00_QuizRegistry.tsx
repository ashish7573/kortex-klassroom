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

// Milestone Assessments (FLN Hindi - 30 Subtopics & 6 Chapters)
const HiCh1Sub1Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh1Sub1Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh1Sub2Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh1Sub2Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh2Sub1Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh2Sub1Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh2Sub2Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh2Sub2Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh2Sub3Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh2Sub3Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh2Sub4Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh2Sub4Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh2Sub5Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh2Sub5Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh2Sub6Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh2Sub6Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh2Sub7Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh2Sub7Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh2Sub8Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh2Sub8Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh3Sub1Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh3Sub1Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh3Sub2Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh3Sub2Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh3Sub3Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh3Sub3Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4Sub1Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh4Sub1Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4Sub2Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh4Sub2Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4Sub3Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh4Sub3Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4Sub4Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh4Sub4Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4Sub5Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh4Sub5Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4Sub6Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh4Sub6Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4Sub7Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh4Sub7Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4Sub8Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh4Sub8Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4Sub9Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh4Sub9Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4Sub10Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh4Sub10Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4Sub11Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh4Sub11Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh6Sub1Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh6Sub1Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh6Sub2Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/subtopics/HiCh6Sub2Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh1ChapterAssessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/chapters/HiCh1ChapterAssessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh2ChapterAssessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/chapters/HiCh2ChapterAssessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh3ChapterAssessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/chapters/HiCh3ChapterAssessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh4ChapterAssessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/chapters/HiCh4ChapterAssessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh5ChapterAssessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/chapters/HiCh5ChapterAssessment'), { ssr: false, loading: () => <QuizLoader /> });
const HiCh6ChapterAssessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Hindi/chapters/HiCh6ChapterAssessment'), { ssr: false, loading: () => <QuizLoader /> });

// Milestone Assessments (FLN Maths)
const MathCh1Sub1Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/subtopics/MathCh1Sub1Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh2Sub1Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/subtopics/MathCh2Sub1Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh2Sub2Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/subtopics/MathCh2Sub2Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh2Sub3Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/subtopics/MathCh2Sub3Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh2Sub4Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/subtopics/MathCh2Sub4Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh2Sub5Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/subtopics/MathCh2Sub5Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh3Sub1Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/subtopics/MathCh3Sub1Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh3Sub2Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/subtopics/MathCh3Sub2Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh3Sub3Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/subtopics/MathCh3Sub3Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh4Sub1Assessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/subtopics/MathCh4Sub1Assessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh1ChapterAssessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/chapters/MathCh1ChapterAssessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh2ChapterAssessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/chapters/MathCh2ChapterAssessment'), { ssr: false, loading: () => <QuizLoader /> });
const MathCh3ChapterAssessment = dynamic(() => import('./MilestoneAssessment/Foundational/FLN Maths/chapters/MathCh3ChapterAssessment'), { ssr: false, loading: () => <QuizLoader /> });

// ==========================================
// 3. THE ROUTER DICTIONARY
// ==========================================
const SPECIFIC_QUIZZES: Record<string, React.ComponentType<any>> = {
  // --- Milestone Assessments (FLN Hindi) ---
  'fln-hi-ch1-sub1-quiz': HiCh1Sub1Assessment,
  'fln-hi-ch1-sub2-quiz': HiCh1Sub2Assessment,
  'fln-hi-ch2-sub1-quiz': HiCh2Sub1Assessment,
  'fln-hi-ch2-sub2-quiz': HiCh2Sub2Assessment,
  'fln-hi-ch2-sub3-quiz': HiCh2Sub3Assessment,
  'fln-hi-ch2-sub4-quiz': HiCh2Sub4Assessment,
  'fln-hi-ch2-sub5-quiz': HiCh2Sub5Assessment,
  'fln-hi-ch2-sub6-quiz': HiCh2Sub6Assessment,
  'fln-hi-ch2-sub7-quiz': HiCh2Sub7Assessment,
  'fln-hi-ch2-sub8-quiz': HiCh2Sub8Assessment,
  'fln-hi-ch3-sub1-quiz': HiCh3Sub1Assessment,
  'fln-hi-ch3-sub2-quiz': HiCh3Sub2Assessment,
  'fln-hi-ch3-sub3-quiz': HiCh3Sub3Assessment,
  'fln-hi-ch4-sub1-quiz': HiCh4Sub1Assessment,
  'fln-hi-ch4-sub2-quiz': HiCh4Sub2Assessment,
  'fln-hi-ch4-sub3-quiz': HiCh4Sub3Assessment,
  'fln-hi-ch4-sub4-quiz': HiCh4Sub4Assessment,
  'fln-hi-ch4-sub5-quiz': HiCh4Sub5Assessment,
  'fln-hi-ch4-sub6-quiz': HiCh4Sub6Assessment,
  'fln-hi-ch4-sub7-quiz': HiCh4Sub7Assessment,
  'fln-hi-ch4-sub8-quiz': HiCh4Sub8Assessment,
  'fln-hi-ch4-sub9-quiz': HiCh4Sub9Assessment,
  'fln-hi-ch4-sub10-quiz': HiCh4Sub10Assessment,
  'fln-hi-ch4-sub11-quiz': HiCh4Sub11Assessment,
  'fln-hi-ch6-sub1-quiz': HiCh6Sub1Assessment,
  'fln-hi-ch6-sub2-quiz': HiCh6Sub2Assessment,
  'fln-hi-ch1-major-quiz': HiCh1ChapterAssessment,
  'fln-hi-ch2-major-quiz': HiCh2ChapterAssessment,
  'fln-hi-ch3-major-quiz': HiCh3ChapterAssessment,
  'fln-hi-ch4-major-quiz': HiCh4ChapterAssessment,
  'fln-hi-ch5-major-quiz': HiCh5ChapterAssessment,
  'fln-hi-ch6-major-quiz': HiCh6ChapterAssessment,

  // --- Milestone Assessments (FLN Maths) ---
  'fln-math-ch1-sub1-quiz': MathCh1Sub1Assessment,
  'fln-math-ch2-sub1-quiz': MathCh2Sub1Assessment,
  'fln-math-ch2-sub2-quiz': MathCh2Sub2Assessment,
  'fln-math-ch2-sub3-quiz': MathCh2Sub3Assessment,
  'fln-math-ch2-sub4-quiz': MathCh2Sub4Assessment,
  'fln-math-ch2-sub5-quiz': MathCh2Sub5Assessment,
  'fln-math-ch3-sub1-quiz': MathCh3Sub1Assessment,
  'fln-math-ch3-sub2-quiz': MathCh3Sub2Assessment,
  'fln-math-ch3-sub3-quiz': MathCh3Sub3Assessment,
  'fln-math-ch4-sub1-quiz': MathCh4Sub1Assessment,
  'fln-math-ch1-major-quiz': MathCh1ChapterAssessment,
  'fln-math-ch2-major-quiz': MathCh2ChapterAssessment,
  'fln-math-ch3-major-quiz': MathCh3ChapterAssessment,

  // --- Core Hindi Assessments ---
  'swar-vyanjan-quiz': SwarVyanjanQuiz, // Catch for the old fallback
  'FLNHindiAssessment': FLNHindiAssessment,
  'hindi-word-match': HindiWordQuiz, 
  'hindi-word-dictation': HindiWordDictation,
  'barahkhadi-dictation': HindiWordDictation,

  // --- Hindi Tools (Chapters 1 & 2: Swar & Vyanjan) ---
  'swar-a-oo': SwarVyanjanQuiz,
  'swar-ri-aha': SwarVyanjanQuiz,
  'vyanjan-ka': SwarVyanjanQuiz,
  'vyanjan-cha': SwarVyanjanQuiz,
  'vyanjan-tta': SwarVyanjanQuiz,
  'vyanjan-ta': SwarVyanjanQuiz,
  'vyanjan-pa': SwarVyanjanQuiz,
  'vyanjan-ya': SwarVyanjanQuiz,
  'vyanjan-sha': SwarVyanjanQuiz,
  'vyanjan-ksha': SwarVyanjanQuiz,

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
  // Level 1: 2-Letter Amatrik
  'story-a1-quiz': FLNStoryQuiz,
  'story-a2-quiz': FLNStoryQuiz,
  'story-a3-quiz': FLNStoryQuiz,
  'story-a4-quiz': FLNStoryQuiz,
  'story-a5-quiz': FLNStoryQuiz,

  // Level 2: 2 & 3-Letter Amatrik
  'story-b1-quiz': FLNStoryQuiz,
  'story-b2-quiz': FLNStoryQuiz,
  'story-b3-quiz': FLNStoryQuiz,
  'story-b4-quiz': FLNStoryQuiz,
  'story-b5-quiz': FLNStoryQuiz,

  // Level 3: 2, 3 & 4-Letter Amatrik
  'story-c1-quiz': FLNStoryQuiz,
  'story-c2-quiz': FLNStoryQuiz,
  'story-c3-quiz': FLNStoryQuiz,
  'story-c4-quiz': FLNStoryQuiz,
  'story-c5-quiz': FLNStoryQuiz,

  // Level 4: Original Matra Stories
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
  // Extract the slug - check subtopicId, subtopic_id, subtopicID, or fallback to URL slug
  const slug = lesson.subtopicId || lesson.subtopic_id || lesson.subtopicID || lesson.content_url?.split('/').pop();

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
    // Explicitly pass subtopicId down just like we did in ConceptualiserRegistry
    return <SpecificQuiz subtopicId={slug} lesson={lesson} onComplete={onComplete} />;
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