"use client";
import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';
import BarahkhadiVisualiser from './Barahkhadi';
import StoryConceptualiser from './FLNStoriesConceptualiser';

const ConceptLoader = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-slate-50 rounded-[3xl] border-4 border-dashed border-slate-200">
     <div className="w-16 h-16 border-8 border-slate-100 border-t-purple-500 rounded-full animate-spin mb-6"></div>
     <h3 className="text-slate-400 font-black text-xl animate-pulse uppercase tracking-widest">Loading Lesson...</h3>
  </div>
);

// Core Modules
const SwarVyanjanConceptualiser = dynamic(() => import('./SwarVyanjanConceptualiser'), { ssr: false, loading: () => <ConceptLoader /> });
const HindiWordBuilder = dynamic(() => import('./HindiWordBuilder'), { ssr: false, loading: () => <ConceptLoader /> });
const MatraBarahkhadi = dynamic(() => import('./MatraBarahkhadi'), { ssr: false, loading: () => <ConceptLoader /> });

// Unique Tools 
const MountainRounding = dynamic(() => import('./MountainRounding'), { ssr: false, loading: () => <ConceptLoader /> });
const CoinTowers = dynamic(() => import('./CoinTowers'), { ssr: false, loading: () => <ConceptLoader /> });
const NumberStory = dynamic(() => import('./NumberStory'), { ssr: false, loading: () => <ConceptLoader /> });
const ShopConceptualiser = dynamic(() => import('./ShopConceptualiser'), { ssr: false, loading: () => <ConceptLoader /> });

// THE ROUTER: Map the Subtopic IDs from your CSV to the actual React Components
const SPECIFIC_TOOLS: any = {
  'rounding-mountain': MountainRounding,
  'full-barahkhadi': BarahkhadiVisualiser,
  'concept-seriation': CoinTowers,
  'number-story': NumberStory,
  'concept-shop': ShopConceptualiser,
  
  // ==========================================
  // HINDI WORD BUILDER ROUTING
  // ==========================================
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

  // ==========================================
  // MATRA BARAHKHADI ROUTING
  // ==========================================
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
  // ==========================================
  // CHAPTER 7: STORIES (READING PHASE)
  // ==========================================
  'story-1-read': StoryConceptualiser,
  'story-2-read': StoryConceptualiser,
  'story-3-read': StoryConceptualiser,
  'story-4-read': StoryConceptualiser,
  'story-5-read': StoryConceptualiser,
  'story-6-read': StoryConceptualiser,
  'story-7-read': StoryConceptualiser,
};

export default function ConceptualiserRegistry({ lesson, onComplete }: any) {
  // 1. Grab the raw ID from your Database
  const rawSlug = lesson.subtopicId || lesson.routePath?.split('/').pop() || '';
  
  // 2. THE FIX: Strip out all invisible carriage returns (\r), newlines, spaces, and force lowercase.
  const slug = String(rawSlug).toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!slug) return <div className="p-10 text-center text-rose-500 font-bold">Error: Missing Subtopic ID</div>;

  // 3. Check the Dictionary
  const SpecificTool = SPECIFIC_TOOLS[slug];
  
  if (SpecificTool) {
    return <Suspense fallback={<ConceptLoader />}><SpecificTool lesson={lesson} onComplete={onComplete} /></Suspense>;
  }

  // 4. Default Fallback
  return (
    <Suspense fallback={<ConceptLoader />}>
      <SwarVyanjanConceptualiser subtopicId={slug} onComplete={onComplete} />
    </Suspense>
  );
}