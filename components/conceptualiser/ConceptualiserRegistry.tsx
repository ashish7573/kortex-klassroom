"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// ==========================================
// 1. LOADING STATE (The Shell)
// ==========================================
const ConceptLoader = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-slate-50 rounded-[3xl] border-4 border-dashed border-slate-200">
     <div className="w-16 h-16 border-8 border-slate-100 border-t-purple-500 rounded-full animate-spin mb-6"></div>
     <h3 className="text-slate-400 font-black text-xl animate-pulse uppercase tracking-widest">Loading Lesson...</h3>
  </div>
);

// ==========================================
// 2. UNIFIED DYNAMIC IMPORTS (100% Lazy Loaded)
// Bypasses the initial bundle bloat completely
// ==========================================

// --- Hindi Tools ---
const SwarVyanjanConceptualiser = dynamic(() => import('./SwarVyanjanConceptualiser'), { ssr: false, loading: () => <ConceptLoader /> });
const HindiWordBuilder = dynamic(() => import('./HindiWordBuilder'), { ssr: false, loading: () => <ConceptLoader /> });
const MatraBarahkhadi = dynamic(() => import('./MatraBarahkhadi'), { ssr: false, loading: () => <ConceptLoader /> });
const BarahkhadiVisualiser = dynamic(() => import('./Barahkhadi'), { ssr: false, loading: () => <ConceptLoader /> });
const StoryConceptualiser = dynamic(() => import('./FLNStoriesConceptualiser'), { ssr: false, loading: () => <ConceptLoader /> });

// --- Math Tools ---
const MountainRounding = dynamic(() => import('./MountainRounding'), { ssr: false, loading: () => <ConceptLoader /> });
const CoinTowers = dynamic(() => import('./CoinTowers'), { ssr: false, loading: () => <ConceptLoader /> });
const NumberStory = dynamic(() => import('./NumberStory'), { ssr: false, loading: () => <ConceptLoader /> });
const ShopConceptualiser = dynamic(() => import('./ShopConceptualiser'), { ssr: false, loading: () => <ConceptLoader /> });
const MoreLess = dynamic(() => import('./MoreLess'), { ssr: false, loading: () => <ConceptLoader /> });
const CountingCombinations = dynamic(() => import('./CountingCombinations'), { ssr: false, loading: () => <ConceptLoader /> });
const AdditionStory = dynamic(() => import('./AdditionStory'), { ssr: false, loading: () => <ConceptLoader /> });
const AdditionMachine = dynamic(() => import('./AdditionMachine'), { ssr: false, loading: () => <ConceptLoader /> });
const AdditionFrog = dynamic(() => import('./AdditionFrog'), { ssr: false, loading: () => <ConceptLoader /> });
const SubtractionStory = dynamic(() => import('./SubtractionStory'), { ssr: false, loading: () => <ConceptLoader /> });
const CountingTwenty = dynamic(() => import('./CountingTwenty'), { ssr: false, loading: () => <ConceptLoader /> });
const CountingHundred = dynamic(() => import('./CountingHundred'), { ssr: false, loading: () => <ConceptLoader /> });
const CountingHundred2 = dynamic(() => import('./CountingHundred2'), { ssr: false, loading: () => <ConceptLoader /> });
const AdditionUptoHundred = dynamic(() => import('./AdditionUptoHundred'), { ssr: false, loading: () => <ConceptLoader /> });
const AdditionWithCarry = dynamic(() => import('./AdditionWithCarry'), { ssr: false, loading: () => <ConceptLoader /> });
const SubtractionWithoutBorrow = dynamic(() => import('./SubtractionWithoutBorrow'), { ssr: false, loading: () => <ConceptLoader /> });
const SubtractionWithBorrow = dynamic(() => import('./SubtractionWithBorrow'), { ssr: false, loading: () => <ConceptLoader /> });
const MultiplicationConceptualiser = dynamic(() => import('./MultiplicationConceptualiser'), { ssr: false, loading: () => <ConceptLoader /> });
const TimesTable = dynamic(() => import('./TimesTable'), { ssr: false, loading: () => <ConceptLoader /> });
const LongMultiplicationIntro = dynamic(() => import('./LongMultiplicationIntro'), { ssr: false, loading: () => <ConceptLoader /> });


// ==========================================
// 3. THE ROUTER DICTIONARY
// Maps the Subtopic IDs from your CSV to the actual React Components
// ==========================================
const SPECIFIC_TOOLS: Record<string, React.ComponentType<any>> = {
  // --- FLN Maths Tools ---
  'rounding-mountain': MountainRounding,
  'concept-seriation': CoinTowers,
  'number-story': NumberStory,
  'concept-shop': ShopConceptualiser,
  'concept-more-less': MoreLess,
  'counting-combinations': CountingCombinations,
  'addition-story-rohan': AdditionStory,
  'addition-machine': AdditionMachine,
  'addition-frog': AdditionFrog,
  'subtraction-bus-story': SubtractionStory,
  'counting-upto-20': CountingTwenty,
  'counting-hundred': CountingHundred,
  'counting-hundred-2': CountingHundred2,
  'addition-upto-hundred': AdditionUptoHundred,
  'addition-with-carry': AdditionWithCarry,
  'subtraction-without-borrow': SubtractionWithoutBorrow,
  'subtraction-with-borrow': SubtractionWithBorrow, 
  'multiplication-conceptualiser': MultiplicationConceptualiser,
  'times-table': TimesTable,
  'long-multiplication': LongMultiplicationIntro,

  // --- Hindi Tools ---
  'full-barahkhadi': BarahkhadiVisualiser,
  
  // Chapter 3: Amatrik Word Builders
  'word-builder-2': HindiWordBuilder,
  'word-builder-3': HindiWordBuilder,
  'word-builder-4': HindiWordBuilder,

  // Chapter 4: Matra Word Builders (Listens for the 'wb-' prefix!)
  'wb-matra-aa': HindiWordBuilder,
  'wb-matra-i': HindiWordBuilder,
  'wb-matra-ee': HindiWordBuilder,
  'wb-matra-u': HindiWordBuilder,
  'wb-matra-oo': HindiWordBuilder,
  'wb-matra-e': HindiWordBuilder,
  'wb-matra-ai': HindiWordBuilder,
  'wb-matra-o': HindiWordBuilder,
  'wb-matra-au': HindiWordBuilder,
  'wb-matra-ang': HindiWordBuilder,
  'wb-matra-ah': HindiWordBuilder,

  // Chapter 4: Matra Conceptualisers (The Combiner tool)
  'matra-aa': MatraBarahkhadi,
  'matra-i': MatraBarahkhadi,
  'matra-ee': MatraBarahkhadi,
  'matra-u': MatraBarahkhadi,
  'matra-oo': MatraBarahkhadi,
  'matra-e': MatraBarahkhadi,
  'matra-ai': MatraBarahkhadi,
  'matra-o': MatraBarahkhadi,
  'matra-au': MatraBarahkhadi,
  'matra-ang': MatraBarahkhadi,
  'matra-ah': MatraBarahkhadi,
  
  // CHAPTER 7: STORIES (READING PHASE)
  'story-1-read': StoryConceptualiser,
  'story-2-read': StoryConceptualiser,
  'story-3-read': StoryConceptualiser,
  'story-4-read': StoryConceptualiser,
  'story-5-read': StoryConceptualiser,
  'story-6-read': StoryConceptualiser,
  'story-7-read': StoryConceptualiser,
};

// ==========================================
// 4. MAIN COMPONENT EXPORT
// ==========================================
export default function ConceptualiserRegistry({ lesson, onComplete }: any) {
  // Grab the raw ID from your Database
  const rawSlug = lesson.subtopicId || lesson.routePath?.split('/').pop() || '';
  
  // THE SANITIZER: Strip out all invisible carriage returns (\r), newlines, spaces, and force lowercase.
  const slug = String(rawSlug).toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Failsafe if ID is completely missing
  if (!slug) {
    return (
      <div className="w-full p-10 text-center text-rose-500 font-bold bg-rose-50 rounded-3xl border-2 border-rose-200">
        Error: Missing Subtopic ID
      </div>
    );
  }

  // Look up the specific tool in our dictionary
  const SpecificTool = SPECIFIC_TOOLS[slug];
  
  if (SpecificTool) {
    return <SpecificTool lesson={lesson} onComplete={onComplete} />;
  }

  // Safety Catch: Graceful Fallback if the tool isn't in the dictionary
  // Note: We leave SwarVyanjan here only if the system explicitly requests a general Hindi fallback.
  // Otherwise, it provides a clean "Under Construction" message like the games registry.
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-[3xl] border-4 border-dashed border-slate-200">
      <h2 className="text-purple-500 font-black text-3xl mb-4">Lesson Coming Soon!</h2>
      <p className="text-slate-500 font-bold text-lg max-w-md">
        The interactive lesson for <span className="text-sky-500">"{lesson.title || slug}"</span> is currently being built in the lab.
      </p>
    </div>
  );
}