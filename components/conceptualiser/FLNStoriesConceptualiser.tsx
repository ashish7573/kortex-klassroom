"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight, Volume2, Image as ImageIcon } from 'lucide-react';
import { STORIES_DATA } from '@/lib/FLNStories';

export default function StoryConceptualiser({ lesson, onComplete = () => {} }: any) {
  const [currentStory, setCurrentStory] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [words, setWords] = useState<string[]>([]);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. INITIALIZE STORY BASED ON ROUTE
  useEffect(() => {
    const subtopicId = lesson?.subtopicId || '';
    // Extracts 'story-1' from an ID like 'story-1-read'
    const baseId = subtopicId.replace('-read', '').replace('-quiz', '');
    
    const foundStory = STORIES_DATA.find(s => s.id === baseId);
    if (foundStory) {
      setCurrentStory(foundStory);
      setCurrentPage(0);
    }
  }, [lesson]);

  // 2. SPLIT WORDS WHEN PAGE CHANGES
  useEffect(() => {
    if (!currentStory) return;
    const currentText = currentStory.pages[currentPage]?.text || '';
    setWords(currentText.split(' '));
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setActiveWordIndex(null);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
  }, [currentPage, currentStory]);

  // 3. CLEANUP TTS ON UNMOUNT
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  const speakText = (text: string, isFullLine: boolean = false) => {
    window.speechSynthesis.cancel();
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN'; 
    utterance.rate = 0.85; // Slightly slower for foundational literacy
    
    if (isFullLine) {
      setIsPlaying(true);
      
      // Calculate boundaries for highlighting
      let charCount = 0;
      const wordBoundaries = words.map(w => {
        const start = charCount;
        charCount += w.length + 1; // +1 for the space
        return start;
      });

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const wIndex = wordBoundaries.findIndex((startPos, idx) => {
            const nextPos = wordBoundaries[idx + 1] || 9999;
            return event.charIndex >= startPos && event.charIndex < nextPos;
          });
          if (wIndex !== -1) setActiveWordIndex(wIndex);
        }
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setActiveWordIndex(null);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setActiveWordIndex(null);
      };

      // SAFETY FALLBACK: In case Chrome Android drops the onEnd event
      // Guarantees the button unlocks after text length calculation
      const estimatedDuration = (text.length / 10) * 1000 + 2000; 
      fallbackTimerRef.current = setTimeout(() => {
          setIsPlaying(false);
          setActiveWordIndex(null);
      }, estimatedDuration);
    }

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleWordClick = (word: string, index: number) => {
    if (isPlaying) return; 
    const cleanWord = word.replace(/[।.,!?]/g, '');
    setActiveWordIndex(index);
    speakText(cleanWord, false);
    
    // Reset highlight for single word
    setTimeout(() => setActiveWordIndex(null), 800);
  };

  const handleNext = () => {
    if (currentPage < currentStory.pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      // Trigger main router to move to the Quiz phase
      onComplete({ status: 'story_read_complete' });
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (!currentStory) return <div className="p-10 text-center text-slate-500 font-bold">Loading Story...</div>;

  const currentStoryPage = currentStory.pages[currentPage];

  return (
    <div className="w-full h-[90vh] min-h-[600px] flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-sky-100 font-sans relative">
      
      {/* HEADER & PROGRESS BAR */}
      <div className="bg-sky-50 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
        <div>
           <h2 className="text-2xl md:text-3xl font-black text-sky-900">{currentStory.title}</h2>
           <span className="text-sky-600 font-bold text-sm tracking-wider">{currentStory.description}</span>
        </div>
        
        <div className="flex space-x-1.5 items-center">
          {currentStory.pages.map((_: any, idx: number) => (
            <div 
              key={idx} 
              className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentPage ? 'w-8 bg-sky-500' : idx < currentPage ? 'w-4 bg-sky-400' : 'w-2.5 bg-sky-200'}`}
            />
          ))}
        </div>
      </div>

      {/* TOP HALF: IMAGE AREA */}
      <div className="flex-1 bg-slate-100 relative flex flex-col items-center justify-center border-b-4 border-dashed border-slate-200 min-h-0 overflow-hidden">
        {/* Placeholder - Replace this block with an actual <img src={`/assets/.../${currentStoryPage.image}`} /> when you have real images */}
        <ImageIcon size={64} className="text-slate-300 mb-2" />
        <p className="text-slate-400 font-medium">Image: {currentStoryPage.image}</p>
        <span className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-slate-500 font-bold shadow-sm text-sm">
            पृष्ठ {currentPage + 1} / {currentStory.pages.length}
        </span>
      </div>

      {/* BOTTOM HALF: INTERACTIVE TEXT AREA */}
      <div className="flex-1 p-6 md:p-10 flex items-center justify-center bg-white min-h-[250px]">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-6 max-w-4xl">
          {words.map((word, index) => (
            <button
              key={index}
              onClick={() => handleWordClick(word, index)}
              disabled={isPlaying}
              className={`text-4xl md:text-5xl lg:text-6xl font-black transition-all duration-200 px-3 py-2 rounded-2xl cursor-pointer select-none touch-manipulation
                ${activeWordIndex === index 
                  ? 'bg-amber-300 text-sky-900 scale-110 shadow-lg -translate-y-1' 
                  : 'text-slate-800 hover:text-sky-600 hover:bg-sky-50 active:scale-95'
                }
              `}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* CONTROLS FOOTER */}
      <div className="p-6 bg-slate-50 flex items-center justify-between border-t-2 border-slate-200 shrink-0">
        <button 
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="flex items-center px-4 py-3 md:px-6 md:py-4 rounded-2xl font-black text-slate-500 bg-white shadow-sm border-2 border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all text-lg"
        >
          <ChevronLeft size={24} className="mr-1" /> पीछे
        </button>

        <button 
          onClick={() => speakText(currentStoryPage.text, true)}
          disabled={isPlaying}
          className="flex items-center px-10 py-4 md:px-16 md:py-5 rounded-full font-black text-white bg-emerald-500 shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all disabled:opacity-60 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 text-xl md:text-2xl"
        >
          {isPlaying ? (
             <Volume2 size={32} className="animate-pulse" />
          ) : (
             <>
               <Play size={28} className="mr-3 fill-white" /> सुनो
             </>
          )}
        </button>

        <button 
          onClick={handleNext}
          className="flex items-center px-4 py-3 md:px-6 md:py-4 rounded-2xl font-black text-white bg-sky-500 shadow-md shadow-sky-200 hover:bg-sky-600 transition-all border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 text-lg"
        >
          {currentPage === currentStory.pages.length - 1 ? 'क्विज़' : 'आगे'} <ChevronRight size={24} className="ml-1" />
        </button>
      </div>

    </div>
  );
}