"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// ==========================================
// 1. STANDARD IMPORTS (The Fix)
// Bypasses the Next.js Turbopack dynamic Promise bug
// ==========================================
import BarahkhadiVisualiser from './Barahkhadi';
import StoryConceptualiser from './FLNStoriesConceptualiser';
import MountainRounding from './MountainRounding';
import CoinTowers from './CoinTowers';
import NumberStory from './NumberStory';
import ShopConceptualiser from './ShopConceptualiser';
import MoreLess from './MoreLess';
import CountingCombinations from './CountingCombinations';
import * as AdditionStoryModule from './AdditionStory';

// ==========================================
// 2. LOADING STATE
// ==========================================
const ConceptLoader = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-slate-50 rounded-[3xl] border-4 border-dashed border-slate-200">
     <div className="w-16 h-16 border-8 border-slate-100 border-t-purple-500 rounded-full animate-spin mb-6"></div>
     <h3 className="text-slate-400 font-black text-xl animate-pulse uppercase tracking-widest">Loading Lesson...</h3>
  </div>
);

// ==========================================
// 3. CORE MODULES (Heavy shells kept dynamic)
// ==========================================
const SwarVyanjanConceptualiser = dynamic(() => import('./SwarVyanjanConceptualiser'), { ssr: false, loading: () => <ConceptLoader /> });
const HindiWordBuilder = dynamic(() => import('./HindiWordBuilder'), { ssr: false, loading: () => <ConceptLoader /> });
const MatraBarahkhadi = dynamic(() => import('./MatraBarahkhadi'), { ssr: false, loading: () => <ConceptLoader /> });

// ==========================================
// 4. THE ROUTER DICTIONARY
// Maps the Subtopic IDs from your CSV to the actual React Components
// ==========================================
const SPECIFIC_TOOLS: any = {
  // --- FLN Maths Tools ---
  'rounding-mountain': MountainRounding,
  'concept-seriation': CoinTowers,
  'number-story': NumberStory,
  'concept-shop': ShopConceptualiser,
  'concept-more-less': MoreLess,
  'counting-combinations': CountingCombinations,
  'addition-story-rohan': AdditionStoryModule,

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
// 5. MAIN COMPONENT EXPORT
// ==========================================
export default function ConceptualiserRegistry({ lesson, onComplete }: any) {
  // Grab the raw ID from your Database
  const rawSlug = lesson.subtopicId || lesson.routePath?.split('/').pop() || '';
  
  // THE SANITIZER: Strip out all invisible carriage returns (\r), newlines, spaces, and force lowercase.
  const slug = String(rawSlug).toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Failsafe if ID is completely missing
  if (!slug) return <div className="p-10 text-center text-rose-500 font-bold">Error: Missing Subtopic ID</div>;

  // Check the Dictionary
  const SpecificTool = SPECIFIC_TOOLS[slug];
  
  if (SpecificTool) {
    
    // THE AGGRESSIVE UNWRAPPER (Turbopack Fix)
    let ComponentToRender = SpecificTool;

    // Keep digging into the object until we find a Function or a valid React Component ($$typeof)
    while (ComponentToRender && typeof ComponentToRender === 'object' && !ComponentToRender.$$typeof) {
      if (ComponentToRender.default) {
        ComponentToRender = ComponentToRender.default;
      } else {
        // Fallback: Hunt for any function hidden inside the object
        const fn = Object.values(ComponentToRender).find(val => typeof val === 'function');
        if (fn) {
          ComponentToRender = fn;
        } else {
          break; // Stop digging if we hit a dead end
        }
      }
    }
    
    return (
      <Suspense fallback={<ConceptLoader />}>
        <ComponentToRender lesson={lesson} onComplete={onComplete} />
      </Suspense>
    );
  }

  // Default Fallback to Swar Vyanjan
  return (
    <Suspense fallback={<ConceptLoader />}>
      <SwarVyanjanConceptualiser subtopicId={slug} onComplete={onComplete} />
    </Suspense>
  );
}