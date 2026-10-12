"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Play, FileEdit, Volume2, CheckCircle, XCircle, ArrowRight, Trophy, AlertCircle, BookOpen, RotateCcw } from 'lucide-react';

// --- HELPER: Smart Image Fallback ---
const SmartImage = ({ src, alt, className, fallbackText }: { src: string, alt: string, className: string, fallbackText: string }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError || !src) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-2xl border-2 border-slate-200 shadow-sm ${className}`}>
        <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-400 opacity-50">{fallbackText || '🖼️'}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setHasError(true)} className={className} />;
};

// Import existing data dictionaries
import { HINDI_ASSETS, SUBTOPIC_MAP, getBarahkhadiAudio } from '@/kortex_library/SwarVyanjanDictionary';
import { getWordsForSubtopic, getWordData, WORD_SUBTOPIC_MAP } from '@/kortex_library/HindiWordDictionary';
import { STORIES_DATA } from '@/kortex_library/FLNStories';

// Define the Actionable Feedback Levels
const LEVELS = {
  LEVEL_1: 'Student needs to attend "Swar and Vyanjan" class.',
  LEVEL_2: 'Student needs to attend "2/3/4 letter words" class.',
  LEVEL_3: 'Student needs to attend "Matraa and Barahkhadi" class.',
  LEVEL_4: 'Student needs to "Start Reading" simple books.',
  LEVEL_5: 'Student has achieved mastery, they can continue their "Grade Level" activities.'
};

export default function FLNHindiAssessment({ onComplete }: any) {
  // Assessment State Machine
  const [testPhase, setTestPhase] = useState<'START' | 'LEVEL_2' | 'LEVEL_1' | 'LEVEL_3' | 'STORY' | 'RESULT'>('START');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finalResult, setFinalResult] = useState<string | null>(null);

  // Interaction & UI States
  const [showTeacherVerify, setShowTeacherVerify] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [storyFluency, setStoryFluency] = useState<boolean | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ==========================================
  // QUESTION GENERATORS
  // ==========================================

  // Level 1: Letters (5 Questions - Max 1 mistake allowed)
  const generateLevel1 = () => {
    const letters = [...SUBTOPIC_MAP['vyanjan-ka'], ...SUBTOPIC_MAP['vyanjan-pa'], ...SUBTOPIC_MAP['swar-a-oo']].sort(() => 0.5 - Math.random());
    const qs = [];
    
    // 1, 2, 3: Pure Audio to Letter (Removes image ambiguity entirely)
    qs.push({ type: 'mcq', mode: 'audio_to_letter', target: letters[0], options: [letters[0], letters[1], letters[2], letters[3]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'audio_to_letter', target: letters[4], options: [letters[4], letters[5], letters[6], letters[7]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'audio_to_letter', target: letters[8], options: [letters[8], letters[9], letters[10], letters[11]].sort(() => 0.5 - Math.random()) });
    
    // 4 & 5. Dictation (Teacher Verified)
    qs.push({ type: 'dictation', mode: 'letter', target: letters[12] });
    qs.push({ type: 'dictation', mode: 'letter', target: letters[13] });
    
    setQuestions(qs);
    setCurrentQIndex(0);
    setMistakes(0);
    setTestPhase('LEVEL_1');
  };

  // Level 2: Words (9 Questions - Max 2 mistakes allowed)
  const generateLevel2 = () => {
    const w2 = getWordsForSubtopic('word-builder-2').sort(() => 0.5 - Math.random());
    const w3 = getWordsForSubtopic('word-builder-3').sort(() => 0.5 - Math.random());
    const w4 = getWordsForSubtopic('word-builder-4').sort(() => 0.5 - Math.random());
    
    const qs = [];
    
    // Pure Audio to Word (Tests raw reading ability, no image guessing)
    qs.push({ type: 'mcq', mode: 'audio_to_word', target: w2[0], options: [w2[0], w2[1], w2[2], w2[3]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'audio_to_word', target: w3[0], options: [w3[0], w3[1], w3[2], w3[3]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'audio_to_word', target: w4[0], options: [w4[0], w4[1], w4[2], w4[3]].sort(() => 0.5 - Math.random()) });
    
    qs.push({ type: 'mcq', mode: 'audio_to_word', target: w2[4], options: [w2[4], w2[5], w2[6], w2[7]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'audio_to_word', target: w3[4], options: [w3[4], w3[5], w3[6], w3[7]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'audio_to_word', target: w4[4], options: [w4[4], w4[5], w4[6], w4[7]].sort(() => 0.5 - Math.random()) });
    
    // Dictation (Teacher Verified)
    qs.push({ type: 'dictation', mode: 'word', target: w2[8].word });
    qs.push({ type: 'dictation', mode: 'word', target: w3[8].word });
    qs.push({ type: 'dictation', mode: 'word', target: w4[8].word });

    setQuestions(qs);
    setCurrentQIndex(0);
    setMistakes(0);
    setTestPhase('LEVEL_2');
  };

  // Level 3: Matra (5 Questions - Max 1 mistake allowed)
  const generateLevel3 = () => {
    const matraWords = getWordsForSubtopic('wb-matra-aa').concat(getWordsForSubtopic('wb-matra-ee')).sort(() => 0.5 - Math.random());
    const qs = [];
    
    // 1 & 2. Pure Audio to Word MCQs
    qs.push({ type: 'mcq', mode: 'audio_to_word', target: matraWords[0], options: [matraWords[0], matraWords[1], matraWords[2], matraWords[3]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'audio_to_word', target: matraWords[4], options: [matraWords[4], matraWords[5], matraWords[6], matraWords[7]].sort(() => 0.5 - Math.random()) });
    
    // 3 & 4. Word Dictations (Writing Questions)
    qs.push({ type: 'dictation', mode: 'word', target: matraWords[8].word });
    qs.push({ type: 'dictation', mode: 'word', target: matraWords[9].word });
    
    // 5. Randomize Vyanjan for Barahkhadi (Writing Question)
    const vyanjans = ['क', 'ख', 'ग', 'घ', 'च', 'छ', 'ज', 'ट', 'ठ', 'ड', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'स', 'ह'];
    const randomVyanjan = vyanjans[Math.floor(Math.random() * vyanjans.length)];
    qs.push({ type: 'dictation', mode: 'barahkhadi', target: randomVyanjan }); 

    setQuestions(qs);
    setCurrentQIndex(0);
    setMistakes(0);
    setTestPhase('LEVEL_3');
  };

  // Level 4/5: Story Reading
  const generateStoryLevel = () => {
    const randomStory = STORIES_DATA[Math.floor(Math.random() * STORIES_DATA.length)];
    const fullText = randomStory.pages.map(p => p.text).join(' ');
    
    const qs = [];
    // 1. Teacher Fluency Check
    qs.push({ type: 'fluency', text: fullText });
    // 2. Comprehension MCQs
    qs.push({ type: 'mcq_story', question: randomStory.quiz[0].question, target: randomStory.quiz[0].correctAnswer, options: randomStory.quiz[0].options });
    qs.push({ type: 'mcq_story', question: randomStory.quiz[1].question, target: randomStory.quiz[1].correctAnswer, options: randomStory.quiz[1].options });

    setQuestions(qs);
    setCurrentQIndex(0);
    setMistakes(0);
    setStoryFluency(null);
    setTestPhase('STORY');
  };

  // ==========================================
  // PROGRESSION LOGIC (The Middle-Out Brain)
  // ==========================================
  const handleAnswer = (isCorrect: boolean) => {
    setSelectedOption(null);
    setShowTeacherVerify(false);
    
    let currentMistakes = mistakes;
    if (!isCorrect) {
      currentMistakes += 1;
      setMistakes(currentMistakes);
    }

    // CHECK FAIL CONDITIONS IMMEDIATELY
    if (testPhase === 'LEVEL_2' && currentMistakes > 2) {
       // Failed Level 2 -> Drop down to Level 1 to test basic letters
       generateLevel1();
       return;
    }
    if (testPhase === 'LEVEL_1' && currentMistakes > 1) {
       // Failed Level 1 -> Needs Swar/Vyanjan Class
       finishAssessment(LEVELS.LEVEL_1);
       return;
    }
    if (testPhase === 'LEVEL_3' && currentMistakes > 1) {
       // Failed Level 3 -> Needs Matraa & Barahkhadi Class
       finishAssessment(LEVELS.LEVEL_3);
       return;
    }
    if (testPhase === 'STORY' && currentQIndex > 0 && currentMistakes > 0) {
       // Failed Story MCQs -> Needs Reading Practice (Level 4)
       finishAssessment(LEVELS.LEVEL_4);
       return;
    }

    // MOVE TO NEXT QUESTION OR NEXT LEVEL
    if (currentQIndex < questions.length - 1) {
       setCurrentQIndex(prev => prev + 1);
    } else {
       // Level Complete! Move UP!
       // If they pass L1, it means they failed L2 earlier. So they DO know letters, but they need the 2/3/4 word class!
       if (testPhase === 'LEVEL_1') finishAssessment(LEVELS.LEVEL_2); 
       else if (testPhase === 'LEVEL_2') generateLevel3();
       else if (testPhase === 'LEVEL_3') generateStoryLevel();
       else if (testPhase === 'STORY') {
           // Passed MCQs. Final result depends on Teacher Fluency Check!
           if (storyFluency) finishAssessment(LEVELS.LEVEL_5); // Mastery!
           else finishAssessment(LEVELS.LEVEL_4); // Lacks fluency -> Needs reading practice
       }
    }
  };

  const finishAssessment = (resultLevel: string) => {
     setFinalResult(resultLevel);
     setTestPhase('RESULT');
  };

  // ==========================================
  // AUDIO & RESET HANDLERS
  // ==========================================
  const playAudio = (itemStr: string, mode: string) => {
    try {
      let path = '';
      if (mode === 'letter' && HINDI_ASSETS[itemStr]) path = HINDI_ASSETS[itemStr].audio;
      else if ((mode === 'word' || mode === 'audio_to_word') && getWordData(itemStr)) path = getWordData(itemStr)?.audioUrl;
      
      if (path && audioRef.current) {
        audioRef.current.src = path;
        audioRef.current.play().catch(e => {
            // Bulletproof Fallback
            const fallbackPath = path.endsWith('.m4a') ? path.replace('.m4a', '.mp3') : path.replace('.mp3', '.m4a');
            if (audioRef.current) {
                audioRef.current.src = fallbackPath;
                audioRef.current.play().catch(err => console.warn("Audio missing in both formats for:", itemStr));
            }
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleReset = () => {
     try {
        const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (WinAudioContext) {
            const ctx = new WinAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        }
     } catch(e) {}
     
     setTestPhase('START');
     setFinalResult(null);
     setQuestions([]);
     setCurrentQIndex(0);
     setMistakes(0);
     setSelectedOption(null);
     setShowTeacherVerify(false);
     setStoryFluency(null);
  };

  // ==========================================
  // RENDER SECTIONS
  // ==========================================
  
  if (testPhase === 'START') {
    return (
      <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-100 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center font-sans overflow-y-auto">
        <div className="bg-sky-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 border-2 sm:border-4 border-sky-50 shadow-inner shrink-0">
          <FileEdit className="w-8 h-8 sm:w-10 sm:h-10 text-sky-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-2 sm:mb-3">हिंदी पठन मूल्यांकन</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 max-w-md text-left w-full shadow-sm">
           <h3 className="font-black text-amber-700 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5"><AlertCircle size={16}/> महत्वपूर्ण निर्देश:</h3>
           <ul className="text-slate-600 font-bold text-xs sm:text-sm space-y-1 list-disc pl-4">
             <li>यह मूल्यांकन शिक्षक या अभिभावक की उपस्थिति में ही किया जाना चाहिए।</li>
             <li>कुछ प्रश्नों में बच्चे को सुनकर कॉपी (कागज़) पर लिखना होगा।</li>
             <li>कृपया छात्र को उत्तर न बताएं।</li>
           </ul>
        </div>
        <button 
          onClick={generateLevel2} 
          className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white font-black text-lg sm:text-xl py-3 px-8 sm:px-12 rounded-xl shadow-md border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all"
        >
          असेसमेंट शुरू करें (Start)
        </button>
      </div>
    );
  }

  if (testPhase === 'RESULT') {
    return (
      <div className="w-full h-full max-w-4xl mx-auto bg-slate-50 rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-100 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center font-sans overflow-y-auto">
        <Trophy className="w-14 h-14 sm:w-18 sm:h-18 text-emerald-500 mb-2 sm:mb-3 drop-shadow-md shrink-0 animate-bounce" />
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-0.5">मूल्यांकन पूर्ण हुआ</h2>
        <p className="text-xs sm:text-sm font-bold text-slate-500 mb-3 sm:mb-5">Assessment Complete</p>
        
        <div className="bg-white border-2 border-sky-100 rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-sm mb-4 sm:mb-6">
           <p className="text-xs font-black text-sky-500 uppercase tracking-widest mb-3 border-b border-sky-50 pb-2">छात्र का स्तर (Student Level)</p>
           
           {finalResult && finalResult.includes('"') ? (
               <div className="flex flex-col items-center justify-center text-center">
                  <span className="block text-sm sm:text-base font-bold text-slate-600 mb-2">
                     {finalResult.split('"')[0]}
                  </span>
                  
                  <span className="block text-lg sm:text-xl md:text-2xl font-black text-sky-600 mb-2 px-4 py-2 bg-sky-50 rounded-xl border border-sky-200 shadow-inner w-full">
                     {finalResult.split('"')[1]}
                  </span>
                  
                  <span className="block text-sm sm:text-base font-bold text-slate-600">
                     {finalResult.split('"')[2]}
                  </span>
               </div>
           ) : (
               <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 leading-tight">{finalResult}</h3>
           )}
        </div>

        <div className="flex gap-3 flex-wrap justify-center w-full max-w-md">
          <button 
            onClick={handleReset} 
            className="flex-1 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-sm sm:text-base py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> नया असेसमेंट
          </button>
          {onComplete && (
            <button 
              onClick={() => onComplete({ result: finalResult })} 
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 text-white font-black text-sm sm:text-base py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              पूर्ण करें <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- PLAYING UI ---
  const q = questions[currentQIndex];
  
  return (
    <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden font-sans relative">
      <audio ref={audioRef} />
      
      {/* Progress Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-3 sm:px-4 py-2 sm:py-2.5 flex justify-between items-center shrink-0">
         <span className="font-black text-slate-500 uppercase tracking-wider text-xs">स्तर: {testPhase.replace('_', ' ')}</span>
         <span className="bg-white border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-600">प्रश्न {currentQIndex + 1} / {questions.length}</span>
      </div>

      <div className="flex-1 p-3 sm:p-4 md:p-6 flex flex-col items-center justify-center relative overflow-y-auto min-h-0">
        
        {/* --- TYPE 1: DICTATION (Teacher Verified) --- */}
        {q.type === 'dictation' && (
          <div className="text-center w-full max-w-md flex flex-col items-center justify-center my-auto">
             {q.mode === 'barahkhadi' ? (
                 <div className="mb-3 sm:mb-4 flex flex-col items-center justify-center w-full">
                     <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-black border-2 sm:border-4 border-purple-200 shadow-inner mb-2 sm:mb-3">
                         {q.target}
                     </div>
                     <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-3 w-full text-center shadow-sm">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">संकेत (मात्राएँ)</p>
                         <p className="text-sm sm:text-base md:text-lg font-black text-slate-700 tracking-wider">आ इ ई उ ऊ ए ऐ ओ औ अं अः</p>
                     </div>
                 </div>
             ) : (
                 <Volume2 size={48} className="mx-auto text-sky-500 mb-2 sm:mb-3 opacity-50 shrink-0" />
             )}
             
             <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mb-3 sm:mb-4">
                 {q.mode === 'barahkhadi' ? `अपनी कॉपी में '${q.target}' की बारहखड़ी लिखें` : 'आवाज़ सुनें और कॉपी में लिखें'}
             </h2>
             
             {q.mode !== 'barahkhadi' && (
               <button 
                 onClick={() => playAudio(q.target, q.mode)} 
                 className="bg-sky-100 hover:bg-sky-200 text-sky-600 font-bold py-2 sm:py-2.5 px-6 rounded-full mb-4 sm:mb-6 flex items-center justify-center gap-2 mx-auto transition-colors shadow-sm text-xs sm:text-sm active:scale-95"
               >
                  <Play size={16} className="fill-current"/> आवाज़ सुनें (Play)
               </button>
             )}

             <button 
               onClick={() => setShowTeacherVerify(true)} 
               className={`w-full ${q.mode === 'barahkhadi' ? 'mt-2 ' : ''}bg-purple-500 hover:bg-purple-600 text-white font-black py-3 sm:py-3.5 rounded-xl shadow-sm border-b-4 border-purple-700 active:border-b-0 active:translate-y-1 transition-all text-sm sm:text-base`}
             >
                शिक्षक जाँच करें (Teacher Verify)
             </button>

             {/* TEACHER OVERRIDE MODAL */}
             {showTeacherVerify && (
               <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in text-center overflow-y-auto">
                  <AlertCircle size={36} className="text-amber-500 mb-2 shrink-0" />
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-1">शिक्षक सत्यापन (Teacher Check)</h3>
                  
                  <p className={`text-sm sm:text-base font-bold text-slate-600 ${q.mode === 'barahkhadi' ? 'mb-2' : 'mb-4 sm:mb-6'}`}>
                    क्या छात्र ने अपनी कॉपी में 
                    <span className="text-sky-600 text-xl sm:text-2xl font-black mx-1 sm:mx-2">
                        {q.mode === 'barahkhadi' ? `'${q.target}' की बारहखड़ी` : `"${q.target}"`}
                    </span> 
                    सही {q.mode === 'barahkhadi' ? 'लिखी' : 'लिखा'} है?
                  </p>

                  {/* Specific Instruction for Barahkhadi Verification */}
                  {q.mode === 'barahkhadi' && (
                     <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5 sm:p-3 mb-4 w-full max-w-sm text-left shadow-inner">
                        <p className="text-xs font-bold text-sky-800 leading-relaxed">
                          <AlertCircle size={14} className="inline mb-0.5 mr-1" />
                          <b>शिक्षक ध्यान दें:</b> बारहखड़ी में अधिकतम 1 गलती माफ़ है। यदि छात्र ने 1 से अधिक गलती की है, तभी 'गलत' चुनें।
                        </p>
                     </div>
                  )}
                  
                  <div className="flex gap-3 w-full max-w-sm">
                     <button 
                       onClick={() => handleAnswer(false)} 
                       className="flex-1 bg-white border-2 border-rose-200 hover:bg-rose-50 text-rose-600 font-black py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-sm sm:text-base"
                     >
                       <XCircle size={18}/> गलत
                     </button>
                     <button 
                       onClick={() => handleAnswer(true)} 
                       className="flex-1 bg-emerald-500 border-b-4 border-emerald-700 hover:bg-emerald-600 text-white font-black py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-sm sm:text-base active:translate-y-1 active:border-b-0"
                     >
                       <CheckCircle size={18}/> सही
                     </button>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* --- TYPE 2: STORY FLUENCY (Teacher Verified) --- */}
        {q.type === 'fluency' && (
          <div className="text-center w-full max-w-2xl flex flex-col h-full pb-1">
             <BookOpen size={32} className="mx-auto text-sky-500 mb-1.5 shrink-0 hidden sm:block" />
             
             {/* Scrollable Story Box */}
             <div className="bg-sky-50 border border-sky-100 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 mb-2 sm:mb-4 flex-1 overflow-y-auto min-h-0 shadow-inner">
               <p className="text-base sm:text-xl md:text-2xl font-bold text-slate-800 leading-relaxed text-justify">{q.text}</p>
             </div>
             
             {/* Pinned Button */}
             <button 
               onClick={() => setShowTeacherVerify(true)} 
               className="w-full shrink-0 bg-purple-500 hover:bg-purple-600 text-white font-black py-2.5 sm:py-3.5 rounded-xl shadow-sm border-b-4 border-purple-700 active:border-b-0 active:translate-y-1 transition-all text-sm sm:text-base"
             >
                शिक्षक मूल्यांकन करें (Teacher Evaluate)
             </button>

             {/* TEACHER OVERRIDE MODAL (Scroll-safe for small phones) */}
             {showTeacherVerify && (
               <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in text-center overflow-y-auto">
                  <div className="my-auto w-full max-w-md flex flex-col items-center">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-1">पठन मूल्यांकन (Fluency Check)</h3>
                    <p className="text-sm sm:text-base font-bold text-slate-600 mb-4 sm:mb-5">छात्र ने कहानी कैसे पढ़ी?</p>
                    
                    <div className="flex flex-col gap-2.5 w-full">
                       <button 
                         onClick={() => { setStoryFluency(true); handleAnswer(true); }} 
                         className="w-full bg-emerald-500 border-b-4 border-emerald-700 hover:bg-emerald-600 text-white font-black py-2.5 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm sm:text-base active:translate-y-1 active:border-b-0"
                       >
                         धाराप्रवाह पढ़ी (Read Fluently)
                       </button>
                       <button 
                         onClick={() => { setStoryFluency(false); handleAnswer(true); }} 
                         className="w-full bg-amber-500 border-b-4 border-amber-700 hover:bg-amber-600 text-white font-black py-2.5 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm sm:text-base active:translate-y-1 active:border-b-0"
                       >
                         अटक-अटक कर पढ़ी (Read with Hesitation)
                       </button>
                       <button 
                         onClick={() => handleAnswer(false)} 
                         className="w-full bg-white border-2 border-rose-200 text-rose-600 font-black py-2 sm:py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors mt-1 shadow-sm text-sm sm:text-base"
                       >
                         नहीं पढ़ सका (Could not read)
                       </button>
                    </div>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* --- TYPE 3: MCQ (Auto Graded) --- */}
        {(q.type === 'mcq' || q.type === 'mcq_story') && (
           <div className="w-full h-full flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6 items-stretch justify-center max-w-3xl">
              
              {/* Question Context Area */}
              <div className="flex-1 md:flex-initial md:w-1/2 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 p-3 sm:p-5 min-h-0 shadow-inner">
                 {q.type === 'mcq_story' && <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 text-center leading-snug">{q.question}</h3>}
                 {q.mode === 'image_to_letter' && <SmartImage src={HINDI_ASSETS[q.target]?.examples?.[0]?.image} fallbackText={q.target} className="max-h-28 sm:max-h-36 md:max-h-44 w-auto object-contain" alt="Question" />}
                 {q.mode === 'image_to_word' && <SmartImage src={q.target.imageUrl} fallbackText={q.target.word} className="max-h-28 sm:max-h-36 md:max-h-44 w-auto object-contain" alt="Question" />}
                 {q.mode === 'letter_to_image' && <span className="text-5xl sm:text-6xl md:text-8xl font-black text-slate-800">{q.target}</span>}
                 {q.mode === 'word_to_image' && <span className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-800">{q.target.word}</span>}
                 {(q.mode === 'audio_to_letter' || q.mode === 'audio_to_word') && (
                    <button 
                      onClick={() => playAudio(q.target?.word || q.target, q.mode.includes('word') ? 'word' : 'letter')} 
                      className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 bg-white rounded-full shadow-lg border-4 sm:border-6 border-sky-100 flex items-center justify-center active:scale-95 transition-transform"
                      title="Click to hear sound"
                    >
                       <Volume2 className="w-12 h-12 sm:w-14 sm:h-14 md:w-18 md:h-18 text-sky-500" />
                    </button>
                 )}
              </div>

              {/* Options Area */}
              <div className="w-full md:w-1/2 grid grid-cols-2 gap-2 sm:gap-3 shrink-0 md:shrink md:flex-1">
                 {q.options.map((opt: any, idx: number) => {
                    const isCorrect = q.type === 'mcq_story' ? opt === q.target : (opt.word || opt) === (q.target.word || q.target);
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(isCorrect)}
                        className="py-2.5 sm:py-4 px-2 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-slate-100 bg-white hover:border-sky-300 hover:shadow-md transition-all flex items-center justify-center min-h-[56px] sm:min-h-[70px] md:min-h-[85px] active:scale-95"
                      >
                         {q.type === 'mcq_story' || q.mode === 'image_to_letter' || q.mode === 'audio_to_letter' ? (
                            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 text-center px-1">{opt}</span>
                         ) : q.mode === 'image_to_word' || q.mode === 'audio_to_word' ? (
                            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800">{opt.word}</span>
                         ) : q.mode === 'letter_to_image' ? (
                            <SmartImage src={HINDI_ASSETS[opt]?.examples?.[0]?.image} fallbackText={opt} className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain" alt="option" />
                         ) : (
                            <SmartImage src={opt.imageUrl} fallbackText={opt.word} className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain" alt="option" />
                         )}
                      </button>
                    )
                 })}
              </div>

           </div>
        )}

      </div>
    </div>
  );
}