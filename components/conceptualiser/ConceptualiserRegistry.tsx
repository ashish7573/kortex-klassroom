"use client";
import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

const ConceptLoader = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-slate-50 rounded-[3xl] border-4 border-dashed border-slate-200">
     <div className="w-16 h-16 border-8 border-slate-100 border-t-purple-500 rounded-full animate-spin mb-6"></div>
     <h3 className="text-slate-400 font-black text-xl animate-pulse uppercase tracking-widest">Loading Lesson...</h3>
  </div>
);

// RENAME: Now specifically imported as the SwarVyanjan Engine
const SwarVyanjanConceptualiser = dynamic(() => import('./SwarVyanjanConceptualiser'), { ssr: false,loading: () => <ConceptLoader /> });

// Unique Tools (Keeping these here just in case they are needed for Ch 1 or 2)
const PlaceValueDemo = dynamic(() => import('../demo/PlaceValueDemo').then(mod => mod.DemoConcept), { ssr: false });
const HindiWordBuilder = dynamic(() => import('./HindiWordBuilder'), { ssr: false });
const MountainRounding = dynamic(() => import('./MountainRounding'), { ssr: false,loading: () => <ConceptLoader /> });

const SPECIFIC_TOOLS: any = {
  'place-value-intro': PlaceValueDemo,
  'hindi-word-builder-game': HindiWordBuilder,
  'rounding-mountain': MountainRounding,
};

export default function ConceptualiserRegistry({ lesson, onComplete }: any) {
  const slug = lesson.subtopicId || lesson.routePath?.split('/').pop();

  if (!slug) return <div className="p-10 text-center text-rose-500 font-bold">Error: Missing Subtopic ID</div>;

  const SpecificTool = SPECIFIC_TOOLS[slug];
  if (SpecificTool) {
    return <Suspense fallback={<ConceptLoader />}><SpecificTool onComplete={onComplete} /></Suspense>;
  }

  // Focus: If it's a standard letter lesson, use the SwarVyanjan Shell
  return (
    <Suspense fallback={<ConceptLoader />}>
      <SwarVyanjanConceptualiser subtopicId={slug} onComplete={onComplete} />
    </Suspense>
  );
}