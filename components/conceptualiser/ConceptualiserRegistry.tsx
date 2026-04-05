"use client";
import dynamic from 'next/dynamic';
import React from 'react';

const ConceptLoader = () => (
  <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-purple-50 rounded-3xl border-2 border-purple-100">
     <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mb-4"></div>
     <h3 className="text-purple-500 font-bold animate-pulse">Loading Interactive Concept...</h3>
  </div>
);

// Lazy load the new component we just made
const Swar1Concept = dynamic(() => import('./Swar1conceptualiser'), { ssr: false });
const Swar2Concept = dynamic(() => import('./Swar2conceptualiser'), { ssr: false });
const DemoConcept = dynamic(() => import('../demo/PlaceValueDemo').then(mod => mod.DemoConcept), { ssr: false });
const HindiWordBuilder = dynamic(() => import('./HindiWordBuilder'), { ssr: false });

export const CONCEPT_REGISTRY = {
  '/conceptualisers/swar1': Swar1Concept,
  '/conceptualisers/swar-2': Swar2Concept,
  '/demo/concept': DemoConcept, 
  '/conceptualisers/hindi-words': HindiWordBuilder,
};