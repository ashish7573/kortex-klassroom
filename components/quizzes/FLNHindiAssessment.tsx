"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Play, FileEdit, Volume2, CheckCircle, XCircle, ArrowRight, Trophy, AlertCircle, BookOpen, RotateCcw } from 'lucide-react';

// --- HELPER: Smart Image Fallback ---
const SmartImage = ({ src, alt, className, fallbackText }: { src: string, alt: string, className: string, fallbackText: string }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError || !src) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-2xl border-4 border-slate-200 shadow-sm ${className}`}>
        <span className="text-4xl md:text-5xl font-black text-slate-400 opacity-50">{fallbackText || '🖼️'}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setHasError(true)} className={className} />;
};

// Import your existing data dictionaries
import { HINDI_ASSETS, SUBTOPIC_MAP, getBarahkhadiAudio } from '@/lib/SwarVyanjanDictionary';
import { getWordsForSubtopic, getWordData, WORD_SUBTOPIC_MAP } from '@/lib/HindiWordDictionary';
import { STORIES_DATA } from '@/lib/FLNStories';

// Define the 5 Proficiency Levels
const LEVELS = {
  LEVEL_0: 'प्रारंभिक (Beginner - Cannot read letters)',
  LEVEL_1: 'अक्षर ज्ञान (Knows Swar & Vyanjan)',
  LEVEL_2: 'शब्द पठन (Can read 2/3/4 letter words)',
  LEVEL_3: 'मात्रा और बारहखड़ी (Knows Matras & Barahkhadi)',
  LEVEL_4: 'वाक्य पठन (Reads sentences, lacks fluency)',
  LEVEL_5: 'धाराप्रवाह पठन (Fluent reading with comprehension)'
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
    // 1. Image to Letter
    qs.push({ type: 'mcq', mode: 'image_to_letter', target: letters[0], options: [letters[0], letters[1], letters[2], letters[3]].sort(() => 0.5 - Math.random()) });
    // 2. Audio to Letter
    qs.push({ type: 'mcq', mode: 'audio_to_letter', target: letters[4], options: [letters[4], letters[5], letters[6], letters[7]].sort(() => 0.5 - Math.random()) });
    // 3. Letter to Image
    qs.push({ type: 'mcq', mode: 'letter_to_image', target: letters[8], options: [letters[8], letters[9], letters[10], letters[11]].sort(() => 0.5 - Math.random()) });
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
    // Build Word (Image to Word)
    qs.push({ type: 'mcq', mode: 'image_to_word', target: w2[0], options: [w2[0], w2[1], w2[2], w2[3]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'image_to_word', target: w3[0], options: [w3[0], w3[1], w3[2], w3[3]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'image_to_word', target: w4[0], options: [w4[0], w4[1], w4[2], w4[3]].sort(() => 0.5 - Math.random()) });
    // Identify Word (Word to Image)
    qs.push({ type: 'mcq', mode: 'word_to_image', target: w2[4], options: [w2[4], w2[5], w2[6], w2[7]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'word_to_image', target: w3[4], options: [w3[4], w3[5], w3[6], w3[7]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'word_to_image', target: w4[4], options: [w4[4], w4[5], w4[6], w4[7]].sort(() => 0.5 - Math.random()) });
    // Dictation (Teacher Verified)
    qs.push({ type: 'dictation', mode: 'word', target: w2[8].word });
    qs.push({ type: 'dictation', mode: 'word', target: w3[8].word });
    qs.push({ type: 'dictation', mode: 'word', target: w4[8].word });

    setQuestions(qs);
    setCurrentQIndex(0);
    setMistakes(0);
    setTestPhase('LEVEL_2');
  };

  // Level 3: Matra (4 Questions - Max 0 mistakes allowed / 100% required)
  const generateLevel3 = () => {
    const matraWords = getWordsForSubtopic('wb-matra-aa').concat(getWordsForSubtopic('wb-matra-ee')).sort(() => 0.5 - Math.random());
    const qs = [];
    qs.push({ type: 'mcq', mode: 'image_to_word', target: matraWords[0], options: [matraWords[0], matraWords[1], matraWords[2], matraWords[3]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'mcq', mode: 'audio_to_word', target: matraWords[4], options: [matraWords[4], matraWords[5], matraWords[6], matraWords[7]].sort(() => 0.5 - Math.random()) });
    qs.push({ type: 'dictation', mode: 'word', target: matraWords[8].word });
    
    // NEW: Randomize Vyanjan for Barahkhadi
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
       // Failed Level 2 -> Drop down to Level 1
       generateLevel1();
       return;
    }
    if (testPhase === 'LEVEL_1' && currentMistakes > 1) {
       // Failed Level 1 -> Assessment Over (Level 0)
       finishAssessment(LEVELS.LEVEL_0);
       return;
    }
    if (testPhase === 'LEVEL_3' && currentMistakes > 0) {
       // Failed Level 3 -> Assessment Over (Level 2 achieved)
       finishAssessment(LEVELS.LEVEL_2);
       return;
    }
    if (testPhase === 'STORY' && currentQIndex > 0 && currentMistakes > 0) {
       // Failed Story MCQs -> Assessment Over (Level 3 achieved)
       finishAssessment(LEVELS.LEVEL_3);
       return;
    }

    // MOVE TO NEXT QUESTION OR NEXT LEVEL
    if (currentQIndex < questions.length - 1) {
       setCurrentQIndex(prev => prev + 1);
    } else {
       // Level Complete! Move UP!
       if (testPhase === 'LEVEL_1') finishAssessment(LEVELS.LEVEL_1); // Rebounded from L2 fail, passed L1
       else if (testPhase === 'LEVEL_2') generateLevel3();
       else if (testPhase === 'LEVEL_3') generateStoryLevel();
       else if (testPhase === 'STORY') {
           // Passed MCQs. Final result depends on Teacher Fluency Check!
           if (storyFluency) finishAssessment(LEVELS.LEVEL_5);
           else finishAssessment(LEVELS.LEVEL_4);
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
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
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
      <div className="w-full h-full min-h-[500px] max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8 md:p-16 flex flex-col items-center justify-center text-center font-sans">
        <div className="bg-sky-100 w-32 h-32 rounded-full flex items-center justify-center mb-8 border-4 border-sky-50 shadow-inner">
          <FileEdit className="w-16 h-16 text-sky-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">हिंदी पठन मूल्यांकन</h1>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8 max-w-lg text-left">
           <h3 className="font-black text-amber-600 mb-2 flex items-center gap-2"><AlertCircle size={20}/> महत्वपूर्ण निर्देश:</h3>
           <ul className="text-slate-600 font-bold text-sm space-y-2 list-disc pl-5">
             <li>यह मूल्यांकन शिक्षक या अभिभावक की उपस्थिति में ही किया जाना चाहिए।</li>
             <li>कुछ प्रश्नों में बच्चे को सुनकर कॉपी (कागज़) पर लिखना होगा।</li>
             <li>कृपया छात्र को उत्तर न बताएं।</li>
           </ul>
        </div>
        <button onClick={generateLevel2} className="w-full md:w-auto bg-sky-500 hover:bg-sky-600 text-white font-black text-2xl py-4 px-12 rounded-2xl shadow-lg border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all">
          असेसमेंट शुरू करें (Start)
        </button>
      </div>
    );
  }

  if (testPhase === 'RESULT') {
    return (
      <div className="w-full h-full min-h-[500px] max-w-4xl mx-auto bg-slate-50 rounded-3xl shadow-sm border-2 border-slate-100 p-8 md:p-16 flex flex-col items-center justify-center text-center font-sans">
        <Trophy className="w-24 h-24 text-emerald-500 mb-6 drop-shadow-md" />
        <h2 className="text-3xl font-black text-slate-800 mb-2">मूल्यांकन पूर्ण हुआ</h2>
        <p className="text-lg font-bold text-slate-500 mb-8">Assessment Complete</p>
        
        <div className="bg-white border-4 border-sky-100 rounded-3xl p-8 w-full max-w-lg shadow-sm">
           <p className="text-sm font-black text-sky-500 uppercase tracking-widest mb-2">छात्र का स्तर (Student Level)</p>
           <h3 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">{finalResult}</h3>
        </div>

        <button onClick={handleReset} className="mt-12 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-lg py-3 px-8 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
          <RotateCcw size={20} /> नया असेसमेंट शुरू करें
        </button>
      </div>
    );
  }

  // --- PLAYING UI ---
  const q = questions[currentQIndex];
  
  return (
    <div className="w-full h-full min-h-[500px] max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden font-sans relative">
      <audio ref={audioRef} />
      
      {/* Progress Header */}
      <div className="bg-slate-50 border-b-2 border-slate-100 p-4 flex justify-between items-center shrink-0">
         <span className="font-black text-slate-500 uppercase tracking-wider text-xs">Phase: {testPhase.replace('_', ' ')}</span>
         <span className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-600">प्रश्न {currentQIndex + 1} / {questions.length}</span>
      </div>

      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center relative">
        
        {/* --- TYPE 1: DICTATION (Teacher Verified) --- */}
        {q.type === 'dictation' && (
          <div className="text-center w-full max-w-md">
             {q.mode === 'barahkhadi' ? (
                 <div className="mb-6 flex flex-col items-center justify-center">
                     <div className="w-24 h-24 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-5xl font-black border-4 border-purple-200 shadow-inner mb-4">
                         {q.target}
                     </div>
                     <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 w-full text-center shadow-sm">
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Hint (मात्राएँ)</p>
                         <p className="text-lg md:text-xl font-black text-slate-700 tracking-widest">आ इ ई उ ऊ ए ऐ ओ औ अं अः</p>
                     </div>
                 </div>
             ) : (
                 <Volume2 size={64} className="mx-auto text-sky-500 mb-6 opacity-50" />
             )}
             
             <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">
                 {q.mode === 'barahkhadi' ? `अपनी कॉपी में '${q.target}' की बारहखड़ी लिखें` : 'आवाज़ सुनें और कॉपी में लिखें'}
             </h2>
             
             {q.mode !== 'barahkhadi' && (
               <button onClick={() => playAudio(q.target, q.mode)} className="bg-sky-100 hover:bg-sky-200 text-sky-600 font-bold py-3 px-8 rounded-full mb-8 flex items-center justify-center gap-2 mx-auto transition-colors shadow-sm">
                  <Play size={20} className="fill-current"/> आवाज़ सुनें (Play)
               </button>
             )}

             <button onClick={() => setShowTeacherVerify(true)} className={`w-full ${q.mode === 'barahkhadi' ? 'mt-4 ' : ''}bg-purple-500 hover:bg-purple-600 text-white font-black py-4 rounded-2xl shadow-sm border-b-4 border-purple-700 active:border-b-0 active:translate-y-1 transition-all`}>
                शिक्षक जाँच करें (Teacher Verify)
             </button>

             {/* TEACHER OVERRIDE MODAL */}
             {showTeacherVerify && (
               <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in text-center">
                  <AlertCircle size={48} className="text-amber-500 mb-4" />
                  <h3 className="text-2xl font-black text-slate-800 mb-2">शिक्षक सत्यापन (Teacher Check)</h3>
                  <p className="text-lg font-bold text-slate-600 mb-8">
                    क्या छात्र ने अपनी कॉपी में 
                    <span className="text-sky-600 text-2xl font-black mx-2">
                        {q.mode === 'barahkhadi' ? `'${q.target}' की बारहखड़ी` : `"${q.target}"`}
                    </span> 
                    सही {q.mode === 'barahkhadi' ? 'लिखी' : 'लिखा'} है?
                  </p>
                  
                  <div className="flex gap-4 w-full max-w-sm">
                     <button onClick={() => handleAnswer(false)} className="flex-1 bg-white border-2 border-rose-200 hover:bg-rose-50 text-rose-600 font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                       <XCircle size={20}/> गलत
                     </button>
                     <button onClick={() => handleAnswer(true)} className="flex-1 bg-emerald-500 border-b-4 border-emerald-700 hover:bg-emerald-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                       <CheckCircle size={20}/> सही
                     </button>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* --- TYPE 2: STORY FLUENCY (Teacher Verified) --- */}
        {q.type === 'fluency' && (
          <div className="text-center w-full max-w-2xl">
             <BookOpen size={48} className="mx-auto text-sky-500 mb-6" />
             <div className="bg-sky-50 border-2 border-sky-100 rounded-2xl p-6 md:p-8 mb-8">
               <p className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed text-justify">{q.text}</p>
             </div>
             
             <button onClick={() => setShowTeacherVerify(true)} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-black py-4 rounded-2xl shadow-sm border-b-4 border-purple-700 active:border-b-0 active:translate-y-1 transition-all">
                शिक्षक मूल्यांकन करें (Teacher Evaluate)
             </button>

             {/* TEACHER OVERRIDE MODAL */}
             {showTeacherVerify && (
               <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in text-center">
                  <h3 className="text-2xl font-black text-slate-800 mb-2">पठन मूल्यांकन (Fluency Check)</h3>
                  <p className="text-lg font-bold text-slate-600 mb-8">छात्र ने कहानी कैसे पढ़ी?</p>
                  
                  <div className="flex flex-col gap-4 w-full max-w-md">
                     <button onClick={() => { setStoryFluency(true); handleAnswer(true); }} className="w-full bg-emerald-500 border-b-4 border-emerald-700 hover:bg-emerald-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                       धाराप्रवाह पढ़ी (Read Fluently)
                     </button>
                     <button onClick={() => { setStoryFluency(false); handleAnswer(true); }} className="w-full bg-amber-500 border-b-4 border-amber-700 hover:bg-amber-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                       अटक-अटक कर पढ़ी (Read with Hesitation)
                     </button>
                     <button onClick={() => handleAnswer(false)} className="w-full bg-white border-2 border-rose-200 text-rose-600 font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors mt-4">
                       नहीं पढ़ सका (Could not read)
                     </button>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* --- TYPE 3: MCQ (Auto Graded) --- */}
        {(q.type === 'mcq' || q.type === 'mcq_story') && (
           <div className="w-full flex flex-col md:flex-row gap-8 items-center justify-center h-full">
              
              {/* Question Context Area */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border-2 border-slate-100 py-8 px-4 min-h-[250px]">
                 {q.type === 'mcq_story' && <h3 className="text-3xl font-black text-slate-800 text-center">{q.question}</h3>}
                 {q.mode === 'image_to_letter' && <SmartImage src={HINDI_ASSETS[q.target]?.examples?.[0]?.image} fallbackText={q.target} className="w-48 h-48 object-contain" alt="Question" />}
                 {q.mode === 'image_to_word' && <SmartImage src={q.target.imageUrl} fallbackText={q.target.word} className="w-48 h-48 object-contain" alt="Question" />}
                 {q.mode === 'letter_to_image' && <span className="text-[8rem] font-black text-slate-800">{q.target}</span>}
                 {q.mode === 'word_to_image' && <span className="text-6xl font-black text-slate-800">{q.target.word}</span>}
                 {(q.mode === 'audio_to_letter' || q.mode === 'audio_to_word') && (
                    <button onClick={() => playAudio(q.target?.word || q.target, q.mode.includes('word') ? 'word' : 'letter')} className="w-40 h-40 bg-white rounded-full shadow-xl border-8 border-sky-100 flex items-center justify-center active:scale-95 transition-transform">
                       <Volume2 className="w-20 h-20 text-sky-500" />
                    </button>
                 )}
              </div>

              {/* Options Area */}
              <div className="w-full md:w-1/2 grid grid-cols-2 gap-3">
                 {q.options.map((opt: any, idx: number) => {
                    const isCorrect = q.type === 'mcq_story' ? opt === q.target : (opt.word || opt) === (q.target.word || q.target);
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(isCorrect)}
                        className="relative py-6 rounded-2xl border-4 border-slate-100 bg-white hover:border-sky-300 hover:shadow-md transition-all flex items-center justify-center min-h-[120px]"
                      >
                         {q.type === 'mcq_story' || q.mode === 'image_to_letter' || q.mode === 'audio_to_letter' ? (
                            <span className="text-4xl font-black text-slate-800 text-center px-2">{opt}</span>
                         ) : q.mode === 'image_to_word' || q.mode === 'audio_to_word' ? (
                            <span className="text-4xl font-black text-slate-800">{opt.word}</span>
                         ) : q.mode === 'letter_to_image' ? (
                            <SmartImage src={HINDI_ASSETS[opt]?.examples?.[0]?.image} fallbackText={opt} className="w-20 h-20 object-contain" alt="option" />
                         ) : (
                            <SmartImage src={opt.imageUrl} fallbackText={opt.word} className="w-20 h-20 object-contain" alt="option" />
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