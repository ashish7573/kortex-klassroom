"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, RotateCcw, Pencil, Eraser, Paintbrush, Ruler, Play } from 'lucide-react';

type AppPhase = 'story' | 'interactive' | 'finish';
type InteractiveStep = 'distribute' | 'solve';

const STORY_SLIDES = [
    {
        image: '/assets/maths/FLN/MultStory1.webp',
        text: "The School Principal has a surprise! Every student in the school is going to get a special stationery kit."
    },
    {
        image: '/assets/maths/FLN/MultStory2.webp',
        text: "Ms. Anita says, 'Each student will get exactly 5 notebooks. We have 35 students in our class. How do we find out how many notebooks we need in total?'"
    },
    {
        image: '/assets/maths/FLN/MultStory3.webp',
        text: "Shiva raises his hand excitedly. 'I know! We can use addition! We just keep adding 5 for every student!'"
    },
    {
        image: '/assets/maths/FLN/MultStory4.webp',
        text: "Suddenly, Shiva stops. 'Wait... writing +5 thirty-five times will take forever! And the Principal has over 1000 kids! Addition is way too slow!'"
    },
    {
        image: '/assets/maths/FLN/MultStory5.webp',
        text: "Ms. Anita laughs gently and takes the chalk. In just two seconds, she writes the exact final answer on the board!"
    },
    {
        image: '/assets/maths/FLN/MultStory6.webp',
        text: "Shiva is completely amazed. 'Ma'am, how did you solve the whole class's problem in two seconds without adding them all up?!'"
    },
    {
        image: '/assets/maths/FLN/MultStory7.webp',
        text: "Ms. Anita smiles. 'Shiva, do you remember how we count very quickly by making groups of 10? 10, 20, 30, 40, 50...'"
    },
    {
        image: '/assets/maths/FLN/MultStory8.webp',
        text: "'Well, we don't only have to make groups of 10! We can make groups of ANY number! Groups of 2, groups of 3, or groups of 5 like 5, 10, 15, 20!'"
    },
    {
        image: '/assets/maths/FLN/MultStory9.webp',
        text: "'If we know our groups, we can do super-fast repeated addition. This magic trick is called Multiplication! and these groups are called Tables. Now Lets distribute and count!'"
    }
];

const EXAMPLES = [
    { id: 'pencils', name: 'Pencils', icon: Pencil, perDesk: 4, desks: 6, color: 'text-amber-500', bg: 'bg-amber-500' },
    { id: 'erasers', name: 'Erasers', icon: Eraser, perDesk: 5, desks: 5, color: 'text-pink-500', bg: 'bg-pink-500' },
    { id: 'sharpeners', name: 'Paint Brushes', icon: Paintbrush, perDesk: 3, desks: 8, color: 'text-sky-500', bg: 'bg-sky-500' },
    { id: 'rulers', name: 'Rulers', icon: Ruler, perDesk: 2, desks: 7, color: 'text-emerald-500', bg: 'bg-emerald-500' }
];

const NUM_WORDS: Record<number, string> = {
    1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 
    6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten'
};

// ============================================================================
// REUSABLE VISUAL COMPONENTS (Extracted to prevent re-render focus loss)
// ============================================================================

const InputBox = ({ value, onChange, disabled }: any) => (
    <input 
        type="text" 
        inputMode="numeric" 
        maxLength={3}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder="?"
        className="w-20 md:w-28 h-16 md:h-20 text-center font-black text-3xl md:text-5xl rounded-xl border-4 border-sky-400 bg-slate-900 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)] focus:outline-none transition-all placeholder:text-slate-700 animate-pulse"
    />
);

// Extracted BlankInput to fix the typing focus bug
const BlankInput = ({ id, value, onChange, disabled, width = "w-12 md:w-16" }: any) => (
    <input 
        type="text" inputMode="numeric"
        value={value || ''}
        onChange={(e) => onChange(id, e.target.value)}
        disabled={disabled}
        className={`${width} h-8 md:h-10 text-center font-black text-lg md:text-xl rounded-lg border-2 border-slate-500 bg-slate-900 text-sky-400 focus:border-sky-400 focus:shadow-[0_0_10px_rgba(56,189,248,0.5)] outline-none transition-all disabled:opacity-50`}
    />
);

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function MultiplicationConceptualiser({ lesson, onComplete }: any) {
    const [phase, setPhase] = useState<AppPhase>('story');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Interactive State
    const [roundIndex, setRoundIndex] = useState(0);
    const [step, setStep] = useState<InteractiveStep>('distribute');
    const [distributedDesks, setDistributedDesks] = useState(0);
    const [blanks, setBlanks] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

    const currentEx = EXAMPLES[roundIndex];

    useEffect(() => { setMounted(true); }, []);

    // --- Audio Engine ---
    const audioCtx = useRef<AudioContext | null>(null);
    const initAudio = () => {
        if (typeof window === 'undefined') return;
        if (!audioCtx.current) {
            const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (WinAudioContext) audioCtx.current = new WinAudioContext();
        }
        if (audioCtx.current && audioCtx.current.state === 'suspended') audioCtx.current.resume();
    };

    const playSound = (type: 'pop' | 'kaching' | 'error' | 'whoosh' | 'magic' | 'click') => {
        if (!audioCtx.current) return;
        const ctx = audioCtx.current;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        if (type === 'pop') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.1, ctx.currentTime); } 
        else if (type === 'kaching') { osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3); gain.gain.setValueAtTime(0.2, ctx.currentTime); } 
        else if (type === 'whoosh') { osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.1, ctx.currentTime); } 
        else if (type === 'error') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.2, ctx.currentTime); } 
        else if (type === 'magic') { osc.type = 'sine'; osc.frequency.setValueAtTime(700, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.4); gain.gain.setValueAtTime(0.15, ctx.currentTime); }
        else if (type === 'click') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime); gain.gain.setValueAtTime(0.05, ctx.currentTime); }
        
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + (type === 'magic' ? 0.4 : 0.2));
    };

    const speakText = (text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (typeof window === 'undefined' || !('speechSynthesis' in window)) { resolve(); return; }
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-IN'; utterance.rate = 0.9; 
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => { setIsSpeaking(false); resolve(); };
            utterance.onerror = () => { setIsSpeaking(false); resolve(); };
            window.speechSynthesis.speak(utterance);
        });
    };

    // --- Actions ---
    const handleNextSlide = () => {
        initAudio(); playSound('pop'); window.speechSynthesis.cancel();
        if (currentSlide < STORY_SLIDES.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            setPhase('interactive');
            playSound('kaching');
        }
    };

    const handlePrevSlide = () => {
        initAudio(); playSound('pop'); window.speechSynthesis.cancel();
        if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
    };

    const handleDistribute = () => {
        if (distributedDesks < currentEx.desks) {
            playSound('pop');
            const next = distributedDesks + 1;
            setDistributedDesks(next);
            if (next === currentEx.desks) {
                setTimeout(() => {
                    playSound('whoosh');
                    setStep('solve');
                }, 800);
            }
        }
    };

    const handleBlankChange = (id: string, val: string) => {
        playSound('click');
        setBlanks(p => ({ ...p, [id]: val.replace(/[^0-9]/g, '').substring(0, 3) }));
    };

    const handleCheckAnswer = () => {
        const totalAns = currentEx.perDesk * currentEx.desks;
        let isCorrect = true;

        if (Number(blanks['q_desks']) !== currentEx.desks) isCorrect = false;
        if (Number(blanks['q_perDesk']) !== currentEx.perDesk) isCorrect = false;
        
        for (let i = 0; i < currentEx.desks; i++) {
            if (Number(blanks[`q_add_${i}`]) !== currentEx.perDesk) isCorrect = false;
        }
        
        if (Number(blanks['q_addTotal']) !== totalAns) isCorrect = false;
        if (Number(blanks['q_groupSize']) !== currentEx.perDesk) isCorrect = false;
        if (Number(blanks['q_groupTotal']) !== totalAns) isCorrect = false;
        if (Number(blanks['q_timesSize']) !== currentEx.perDesk) isCorrect = false;
        if (Number(blanks['q_wordTotal']) !== totalAns) isCorrect = false;

        const mA = Number(blanks['q_multA']);
        const mB = Number(blanks['q_multB']);
        const mValid = (mA === currentEx.desks && mB === currentEx.perDesk) || (mA === currentEx.perDesk && mB === currentEx.desks);
        if (!mValid) isCorrect = false;
        
        if (Number(blanks['q_multTotal']) !== totalAns) isCorrect = false;

        if (isCorrect) {
            playSound('kaching');
            setFeedback('correct');
            setTimeout(() => {
                if (roundIndex < EXAMPLES.length - 1) {
                    setRoundIndex(prev => prev + 1);
                    setDistributedDesks(0);
                    setStep('distribute');
                    setBlanks({});
                    setFeedback('idle');
                } else {
                    setPhase('finish');
                }
            }, 2500);
        } else {
            playSound('error');
            setFeedback('wrong');
            setTimeout(() => setFeedback('idle'), 1500);
        }
    };

    if (!mounted) return null;

    // ============================================================================
    // RENDER: STORY PHASE
    // ============================================================================
    if (phase === 'story') {
        const slide = STORY_SLIDES[currentSlide];
        return (
            <div className="w-full h-full flex flex-col bg-slate-50 font-sans md:rounded-3xl overflow-hidden">
                <div className="flex-1 min-h-0 flex flex-col p-3 md:p-6">
                    <div className="max-w-4xl w-full mx-auto flex flex-col h-full gap-3 md:gap-4">
                        <div className="flex-1 min-h-0 w-full bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-4 border-slate-800 shadow-md relative">
                            {/* Uncropped 16:9 Image */}
                            <img src={slide.image} alt="Story scene" className="absolute inset-0 w-full h-full object-contain bg-slate-900 z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                            <button 
                                onClick={() => { initAudio(); speakText(slide.text); }}
                                className={`absolute top-3 right-3 md:top-4 md:right-4 z-20 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border-b-4 transition-all shadow-lg ${isSpeaking ? 'bg-amber-100 text-amber-500 border-amber-200 animate-pulse' : 'bg-sky-500 text-white border-sky-700 hover:bg-sky-400'}`}
                            >
                                <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>
                        <div className="shrink-0 bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border-4 border-slate-100 shadow-sm flex items-center justify-center text-center min-h-[120px]">
                            <p className="text-sm md:text-lg lg:text-xl font-bold text-slate-700 leading-snug md:leading-relaxed max-w-2xl">{slide.text}</p>
                        </div>
                    </div>
                </div>
                <div className="shrink-0 p-2 md:p-4 flex justify-between items-center max-w-4xl mx-auto w-full">
                    <button onClick={handlePrevSlide} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${currentSlide === 0 ? 'invisible' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                        <ChevronLeft size={16} /> Back
                    </button>
                    <button onClick={handleNextSlide} className="px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 bg-sky-500 hover:bg-sky-400 text-white border-b-4 border-sky-700 active:border-b-0">
                        {currentSlide === STORY_SLIDES.length - 1 ? 'Start Activity' : 'Next'} <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: FINISH PHASE
    // ============================================================================
    if (phase === 'finish') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 font-sans md:rounded-3xl p-6 text-center animate-fade-in-up">
                <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl bg-emerald-100 border-4 border-emerald-300">
                    <CheckCircle2 size={64} className="text-emerald-500"/>
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-2">Math Master!</h2>
                <p className="text-slate-500 font-bold text-lg mb-8">You successfully discovered how multiplication builds equal groups!</p>
                <button onClick={onComplete} className="bg-emerald-500 text-slate-950 px-8 py-4 rounded-2xl font-black tracking-wide shadow-[0_6px_0_rgb(16,185,129)] active:translate-y-[6px] active:shadow-none transition-all flex items-center gap-2">
                    Complete Lesson <ChevronRight />
                </button>
            </div>
        );
    }

    // ============================================================================
    // RENDER: INTERACTIVE PHASE (SPLIT SCREEN)
    // ============================================================================
    const Icon = currentEx.icon;
    const totalAns = currentEx.desks * currentEx.perDesk;

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 font-sans md:rounded-3xl overflow-hidden relative">
            
            {/* Feedback Overlay */}
            {feedback !== 'idle' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                    <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center shadow-2xl animate-bounce ${feedback === 'correct' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {feedback === 'correct' ? <CheckCircle2 size={64}/> : <RotateCcw size={64}/>}
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="w-full shrink-0 p-3 md:p-4 z-20 bg-slate-800 border-b-2 border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between text-white gap-2">
                <div className="flex items-center gap-3">
                    <div className="bg-sky-500 p-2 rounded-lg text-white"><Sparkles size={20}/></div>
                    <h2 className="text-base md:text-xl font-black tracking-widest uppercase">The Multiplication Trick</h2>
                </div>
            </div>

            {/* DUAL COLUMN WORKSPACE */}
            <div className="flex-1 p-2 md:p-4 overflow-hidden flex flex-col lg:flex-row gap-4 items-stretch">
                
                {/* LEFT COLUMN: VISUAL DESKS */}
                <div className="flex-[1.2] bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 flex flex-col h-full overflow-y-auto shadow-inner relative">
                    <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900 px-3 py-1 rounded-full">Step 1: Visual Groups</span>
                    
                    <div className="text-center mt-6 mb-4">
                        <h2 className="text-lg md:text-2xl font-black text-white">
                            Pack <span className={currentEx.color}>{currentEx.perDesk} {currentEx.name}</span> for <span className="text-sky-400">{currentEx.desks} Students</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 w-full max-w-3xl mx-auto pb-4">
                        {Array.from({ length: currentEx.desks }).map((_, idx) => {
                            const isFilled = idx < distributedDesks;
                            return (
                                <div key={idx} className={`aspect-[4/3] rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300
                                    ${isFilled ? 'bg-slate-700 border-slate-500 shadow-lg scale-100' : 'bg-slate-900 border-slate-800 opacity-50 scale-95'}`}
                                >
                                    {isFilled ? (
                                        <div className="flex flex-wrap gap-1 md:gap-2 justify-center p-2">
                                            {Array.from({ length: currentEx.perDesk }).map((_, i) => (
                                                <Icon key={i} className={`${currentEx.color} animate-fade-in-up drop-shadow-md`} size={20} />
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-slate-600 font-bold text-xs uppercase tracking-widest">Desk {idx + 1}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT COLUMN: INTERACTIVE WORKSHEET */}
                <div className="flex-1 bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 md:p-6 flex flex-col h-full overflow-y-auto shadow-lg relative">
                    <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900 px-3 py-1 rounded-full">Step 2: Questions</span>
                    
                    <div className="flex-1 flex flex-col justify-center w-full mt-6">
                        {step === 'distribute' ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-center animate-fade-in">
                                <div className="text-slate-400 font-bold mb-4 max-w-xs">First, we need to build our equal groups! Tap the button below to distribute the items.</div>
                                <button 
                                    onClick={handleDistribute} 
                                    className={`${currentEx.bg} text-white px-8 py-4 rounded-xl font-black text-lg md:text-xl shadow-[0_6px_0_rgba(0,0,0,0.2)] active:translate-y-[6px] active:shadow-none transition-all flex items-center gap-3`}
                                >
                                    Give {currentEx.perDesk} {currentEx.name} ({distributedDesks}/{currentEx.desks})
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5 text-sm md:text-base font-bold text-slate-300 w-full animate-fade-in">
                                {/* Line 1 */}
                                <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 pb-3">
                                    <span>Number of Students =</span> 
                                    <BlankInput id="q_desks" value={blanks['q_desks']} onChange={handleBlankChange} disabled={feedback === 'correct'} />
                                </div>
                                
                                {/* Line 2 */}
                                <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 pb-3">
                                    <span>Number of {currentEx.name} for each student =</span> 
                                    <BlankInput id="q_perDesk" value={blanks['q_perDesk']} onChange={handleBlankChange} disabled={feedback === 'correct'} />
                                </div>

                                {/* Line 3: Repeated Addition */}
                                <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 pb-3">
                                    <span className="w-full mb-1">Total number of {currentEx.name} =</span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {Array.from({ length: currentEx.desks }).map((_, i) => (
                                            <React.Fragment key={i}>
                                                <BlankInput id={`q_add_${i}`} value={blanks[`q_add_${i}`]} onChange={handleBlankChange} disabled={feedback === 'correct'} width="w-10 md:w-14" />
                                                {i < currentEx.desks - 1 && <span className="text-slate-500 font-black">+</span>}
                                            </React.Fragment>
                                        ))}
                                        <span className="text-slate-500 font-black mx-1">=</span>
                                        <BlankInput id="q_addTotal" value={blanks['q_addTotal']} onChange={handleBlankChange} disabled={feedback === 'correct'} />
                                    </div>
                                </div>

                                {/* Line 4 */}
                                <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 pb-3 text-sky-200">
                                    <span className="bg-sky-900/50 px-2 py-1 rounded">{currentEx.desks} groups of</span> 
                                    <BlankInput id="q_groupSize" value={blanks['q_groupSize']} onChange={handleBlankChange} disabled={feedback === 'correct'} /> 
                                    <span>is</span> 
                                    <BlankInput id="q_groupTotal" value={blanks['q_groupTotal']} onChange={handleBlankChange} disabled={feedback === 'correct'} />
                                </div>

                                {/* Line 5 */}
                                <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 pb-3 text-emerald-200">
                                    <span className="bg-emerald-900/50 px-2 py-1 rounded">{currentEx.desks} times</span> 
                                    <BlankInput id="q_timesSize" value={blanks['q_timesSize']} onChange={handleBlankChange} disabled={feedback === 'correct'} /> 
                                    <span>is {totalAns}.</span>
                                </div>

                                {/* Line 6 */}
                                <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 pb-3 text-amber-200">
                                    <span className="bg-amber-900/50 px-2 py-1 rounded">{currentEx.desks} {NUM_WORDS[currentEx.perDesk]}s are</span> 
                                    <BlankInput id="q_wordTotal" value={blanks['q_wordTotal']} onChange={handleBlankChange} disabled={feedback === 'correct'} />
                                </div>

                                {/* Line 7: Final Multiplication */}
                                <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-900 p-4 rounded-xl border-2 border-sky-500/30 mt-2">
                                    <BlankInput id="q_multA" value={blanks['q_multA']} onChange={handleBlankChange} disabled={feedback === 'correct'} width="w-16 md:w-20" /> 
                                    <span className="text-2xl font-black text-sky-400">×</span> 
                                    <BlankInput id="q_multB" value={blanks['q_multB']} onChange={handleBlankChange} disabled={feedback === 'correct'} width="w-16 md:w-20" /> 
                                    <span className="text-2xl font-black text-slate-500">=</span> 
                                    <BlankInput id="q_multTotal" value={blanks['q_multTotal']} onChange={handleBlankChange} disabled={feedback === 'correct'} width="w-16 md:w-24" />
                                </div>

                                {/* Verify Button properly placed in normal scroll flow */}
                                <div className="mt-4 w-full flex justify-center pb-2">
                                    <button 
                                        onClick={handleCheckAnswer}
                                        className="w-full bg-emerald-500 text-white px-6 py-4 rounded-xl font-black text-lg tracking-wide shadow-[0_4px_0_rgb(16,185,129)] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 hover:bg-emerald-400"
                                    >
                                        Verify Answers <CheckCircle2 size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}