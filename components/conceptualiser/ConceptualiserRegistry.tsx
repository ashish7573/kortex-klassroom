"use client";
import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

const ConceptLoader = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-slate-50 rounded-[3xl] border-4 border-dashed border-slate-200">
     <div className="w-16 h-16 border-8 border-slate-100 border-t-purple-500 rounded-full animate-spin mb-6"></div>
     <h3 className="text-slate-400 font-black text-xl animate-pulse uppercase tracking-widest">Loading Lesson...</h3>
  </div>
);

// Core Modules
const SwarVyanjanConceptualiser = dynamic(() => import('./SwarVyanjanConceptualiser'), { ssr: false, loading: () => <ConceptLoader /> });
const HindiWordBuilder = dynamic(() => import('./HindiWordBuilder'), { ssr: false, loading: () => <ConceptLoader /> });

// Unique Tools 

const MountainRounding = dynamic(() => import('./MountainRounding'), { ssr: false, loading: () => <ConceptLoader /> });

// THE ROUTER: Map the Subtopic IDs from your CSV to the actual React Components
const SPECIFIC_TOOLS: any = {
  'rounding-mountain': MountainRounding,
  
  // Route all three word builder lessons to the same "Smart" component
  'word-builder-2': HindiWordBuilder,
  'word-builder-3': HindiWordBuilder,
  'word-builder-4': HindiWordBuilder,
};

export default function ConceptualiserRegistry({ lesson, onComplete }: any) {
  // Grab the unique ID you assigned in the CSV
  const slug = lesson.subtopicId || lesson.routePath?.split('/').pop();

  if (!slug) return <div className="p-10 text-center text-rose-500 font-bold">Error: Missing Subtopic ID</div>;

  // 1. Check if it is a Custom Tool
  const SpecificTool = SPECIFIC_TOOLS[slug];
  if (SpecificTool) {
    // IMPORTANT: We pass the 'lesson' prop here so the tool can read the title!
    return <Suspense fallback={<ConceptLoader />}><SpecificTool lesson={lesson} onComplete={onComplete} /></Suspense>;
  }

  // 2. Default Fallback: If it's a standard letter lesson, use the SwarVyanjan Shell
  return (
    <Suspense fallback={<ConceptLoader />}>
      <SwarVyanjanConceptualiser subtopicId={slug} onComplete={onComplete} />
    </Suspense>
  );
}