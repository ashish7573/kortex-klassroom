"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Trophy, Users, User, Clock, CheckCircle, RotateCcw, ArrowRight, Volume2, Eye, Lock, Zap, Monitor, Home } from 'lucide-react';
import { getWordsForSubtopic, getWordData } from '@/kortex_library/HindiWordDictionary';
import { HINDI_ASSETS, getBarahkhadiAudio } from '@/kortex_library/SwarVyanjanDictionary';

// --- HELPER: Grapheme Segmenter ---
const segmentWord = (word: string) => {
    if (!word) return [];
    try {
        const segmenter = new Intl.Segmenter('hi-IN', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(word)).map(s => s.segment);
    } catch (e) {
        return word.split('');
    }
};

const HINDI_CONSONANTS = [
    "क", "ख", "ग", "घ", "च", "छ", "ज", "झ", "ट", "ठ", "ड", "ढ", "ण", 
    "त", "थ", "द", "ध", "न", "प", "फ", "ब", "भ", "म", "य", "र", "ल", "व", "श", "ष", "स", "ह", "ड़", "ढ़"
];

// Strictly loads Dictionary Image (No Emojis)
const SmartImage = ({ wordData, className }: { wordData: any, className: string }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError || !wordData.imageUrl) {
    return <div className={`flex items-center justify-center bg-slate-100 rounded-xl shadow-sm ${className}`}><span className="text-xs text-slate-400 font-bold uppercase tracking-widest">No Image</span></div>;
  }
  return <img src={wordData.imageUrl} alt={wordData.english} onError={() => setHasError(true)} className={`object-contain bg-white rounded-xl shadow-sm ${className}`} />;
};

// Fallback Speech Synthesis for Hindi
const playTTS = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text + '।');
            utterance.lang = 'hi-IN';
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
        } catch (e) {}
    }
};

let sharedAudioCtx: AudioContext | null = null;
const getAudioContext = () => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return null;
        if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
            sharedAudioCtx = new AudioContextClass();
        }
        if (sharedAudioCtx.state === 'suspended') {
            sharedAudioCtx.resume();
        }
        return sharedAudioCtx;
    } catch (e) {
        return null;
    }
};

const playSuccessPop = () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
        osc.onended = () => {
            try {
                osc.disconnect();
                gainNode.disconnect();
            } catch (e) {}
        };
    } catch (e) {}
};

const playErrorBuzzer = () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
        osc.onended = () => {
            try {
                osc.disconnect();
                gainNode.disconnect();
            } catch (e) {}
        };
    } catch (e) {}
};


// ============================================================================
// ISOLATED PLAYER ENGINE 
// ============================================================================
const PlayerEngine = ({ playerId, wordPool, score, onScoreChange, isFlipped, isHD, timeLeft, onMenu }: any) => {
    const [targetWord, setTargetWord] = useState<any>(null);
    const [foundCount, setFoundCount] = useState(0);
    const [audioProgress, setAudioProgress] = useState(0);
    const [visualProgress, setVisualProgress] = useState(0);
    const [audioUsed, setAudioUsed] = useState(false);
    const [visualUsed, setVisualUsed] = useState(false);
    const [maxWordScore, setMaxWordScore] = useState(3);
    const [scoreFloat, setScoreFloat] = useState<{val: number, id: number} | null>(null);

    const [bubbleList, setBubbleList] = useState<any[]>([]);
    const physicsBubbles = useRef<any[]>([]);
    const animationRef = useRef<number | null>(null);
    const activeAudioRef = useRef<HTMLAudioElement | null>(null);
    const wordAudioTimerRef = useRef<NodeJS.Timeout | null>(null);
    const nextWordTimerRef = useRef<NodeJS.Timeout | null>(null);
    const arenaRef = useRef<HTMLDivElement>(null);

    const isP1 = playerId === 'p1';
    const targetChars = targetWord ? segmentWord(targetWord.word) : [];

    // Cleanup audio and timers on unmount
    useEffect(() => {
        return () => {
            if (wordAudioTimerRef.current) clearTimeout(wordAudioTimerRef.current);
            if (nextWordTimerRef.current) clearTimeout(nextWordTimerRef.current);
            if (activeAudioRef.current) {
                activeAudioRef.current.pause();
                activeAudioRef.current = null;
            }
        };
    }, []);

    // --- UNIVERSAL AUDIO ENGINE WITH TTS FALLBACK ---
    const playDictionaryAudio = (text: string) => {
        if (!text) return;
        try {
            let audioPath = '';

            // 1. Base Swar/Vyanjan
            if (HINDI_ASSETS[text]) {
                audioPath = HINDI_ASSETS[text].audio;
            } 
            // 2. Barahkhadi Syllable
            else {
                const bPath = getBarahkhadiAudio(text);
                if (bPath) {
                    audioPath = bPath;
                } else {
                    // 3. Full Word
                    const wordData = getWordData(text);
                    if (wordData && wordData.audioUrl) {
                        audioPath = wordData.audioUrl;
                    }
                }
            }

            if (audioPath) {
                if (activeAudioRef.current) {
                    activeAudioRef.current.pause();
                    activeAudioRef.current.currentTime = 0;
                }
                const audio = new Audio(audioPath);
                activeAudioRef.current = audio;
                
                // Bulletproof Fallback
                audio.onerror = () => {
                    const fallbackPath = audioPath.endsWith('.m4a') 
                        ? audioPath.replace('.m4a', '.mp3') 
                        : audioPath.replace('.mp3', '.m4a');
                        
                    const fallbackAudio = new Audio(fallbackPath);
                    activeAudioRef.current = fallbackAudio;
                    fallbackAudio.onerror = () => {
                        playTTS(text);
                    };
                    fallbackAudio.play().catch(() => playTTS(text));
                };

                audio.play().catch(() => playTTS(text));
            } else {
                playTTS(text);
            }
        } catch (error) {
            playTTS(text);
        }
    };

    const loadNewWord = useCallback(() => {
        if (wordAudioTimerRef.current) clearTimeout(wordAudioTimerRef.current);
        if (nextWordTimerRef.current) clearTimeout(nextWordTimerRef.current);
        if (wordPool.length === 0) return;
        const nextWord = wordPool[Math.floor(Math.random() * wordPool.length)];
        const neededChars = segmentWord(nextWord.word);
        
        let newBubbles: any[] = [];
        const speedMult = 0.25; 
        
        neededChars.forEach((char, index) => {
            newBubbles.push({
                id: Math.random().toString(36).substr(2, 9),
                char: char,
                x: 10 + (index * 15), y: 10 + (index * 15), 
                vx: (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5) * speedMult,
                vy: (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5) * speedMult,
            });
        });

        const isNarrow = (arenaRef.current?.clientWidth || window.innerWidth) < 450;
        const distractorCount = isNarrow ? (isHD ? 9 : 6) : (isHD ? 14 : 9);
        for (let i = 0; i < distractorCount; i++) {
            newBubbles.push({
                id: Math.random().toString(36).substr(2, 9),
                char: HINDI_CONSONANTS[Math.floor(Math.random() * HINDI_CONSONANTS.length)],
                x: Math.random() * 60 + 10, y: Math.random() * 60 + 10,
                vx: (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5) * speedMult,
                vy: (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5) * speedMult,
            });
        }

        physicsBubbles.current = newBubbles;
        setBubbleList([...physicsBubbles.current]);
        setTargetWord(nextWord);
        setFoundCount(0);
        setMaxWordScore(3);
        setAudioProgress(0);
        setVisualProgress(0);
        setAudioUsed(false);
        setVisualUsed(false);
    }, [wordPool, isHD]);

    useEffect(() => {
        if (wordPool.length > 0 && !targetWord) loadNewWord();
    }, [wordPool, targetWord, loadNewWord]);

    useEffect(() => {
        if (!targetWord || foundCount >= targetChars.length) return;
        const interval = setInterval(() => {
            setAudioProgress(p => Math.min(p + (100 / 70), 100)); 
            if (audioUsed) setVisualProgress(p => Math.min(p + (100 / 70), 100)); 
        }, 100);
        return () => clearInterval(interval);
    }, [targetWord, foundCount, audioUsed, targetChars.length]);

    // --- ELASTIC COLLISION PHYSICS ENGINE ---
    useEffect(() => {
        if (!targetWord) return;
        
        const targetFPS = isHD ? 60 : 24; 
        const frameInterval = 1000 / targetFPS;
        let lastTime = performance.now();

        const animate = (time: number) => {
            animationRef.current = requestAnimationFrame(animate);
            const deltaTime = time - lastTime;
            
            if (deltaTime < frameInterval) return;
            
            const dt = deltaTime / 16.66; 
            lastTime = time - (deltaTime % frameInterval);

            const bubbles = physicsBubbles.current;
            
            const arenaWidth = arenaRef.current?.clientWidth || 500;
            const arenaHeight = arenaRef.current?.clientHeight || 500;
            const bubbleSizePx = arenaWidth < 420 ? (isHD ? 46 : 42) : (isHD ? 60 : 50); 
            
            const radiusX = (bubbleSizePx / arenaWidth) * 100;
            const radiusY = (bubbleSizePx / arenaHeight) * 100;

            for (let i = 0; i < bubbles.length; i++) {
                const b1 = bubbles[i];

                b1.x += b1.vx * dt;
                b1.y += b1.vy * dt;

                // Wall Bounds
                if (b1.x <= 0) { b1.x = 0; b1.vx = Math.abs(b1.vx); }
                if (b1.x >= 100 - radiusX) { b1.x = 100 - radiusX; b1.vx = -Math.abs(b1.vx); }
                if (b1.y <= 0) { b1.y = 0; b1.vy = Math.abs(b1.vy); }
                if (b1.y >= 100 - radiusY) { b1.y = 100 - radiusY; b1.vy = -Math.abs(b1.vy); }

                // Bubble-to-Bubble AABB Collision
                for (let j = i + 1; j < bubbles.length; j++) {
                    const b2 = bubbles[j];
                    
                    if (Math.abs(b1.x - b2.x) < radiusX && Math.abs(b1.y - b2.y) < radiusY) {
                        const dx = b2.x - b1.x;
                        const dy = b2.y - b1.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < Math.max(radiusX, radiusY)) {
                            // Separation Push
                            const overlap = Math.max(radiusX, radiusY) - dist;
                            const nx = dx / (dist || 1);
                            const ny = dy / (dist || 1);
                            
                            b1.x -= (nx * overlap) / 2;
                            b1.y -= (ny * overlap) / 2;
                            b2.x += (nx * overlap) / 2;
                            b2.y += (ny * overlap) / 2;

                            // Velocity Swap
                            const tempVx = b1.vx;
                            const tempVy = b1.vy;
                            b1.vx = b2.vx;
                            b1.vy = b2.vy;
                            b2.vx = tempVx;
                            b2.vy = tempVy;
                        }
                    }
                }
                
                const el = document.getElementById(`bubble-${playerId}-${b1.id}`);
                if (el) { 
                    el.style.left = `${b1.x}%`; 
                    el.style.top = `${b1.y}%`; 
                }
            }
        };
        animationRef.current = requestAnimationFrame(animate);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [targetWord, playerId, isHD]);

    const handleBubbleTap = (bubbleId: string, char: string) => {
        if (!targetWord || foundCount >= targetChars.length) return;
        const expectedChar = targetChars[foundCount];

        if (char === expectedChar) {
            playSuccessPop();
            
            physicsBubbles.current = physicsBubbles.current.filter(b => b.id !== bubbleId);
            setBubbleList([...physicsBubbles.current]);

            const newFoundCount = foundCount + 1;
            setFoundCount(newFoundCount);

            // Step 1: ALWAYS pronounce the tapped syllable/letter first
            playDictionaryAudio(char);

            if (newFoundCount === targetChars.length) {
                // Word is completely spelled!
                // Step 2: Wait 1000ms (~1 second) after the last letter has been spoken before pronouncing the entire word
                if (wordAudioTimerRef.current) clearTimeout(wordAudioTimerRef.current);
                wordAudioTimerRef.current = setTimeout(() => {
                    playDictionaryAudio(targetWord.word);
                }, 1000);

                onScoreChange(maxWordScore);
                setScoreFloat({ val: maxWordScore, id: Date.now() });
                setTimeout(() => setScoreFloat(null), 1000);

                // Step 3: Wait after the full word is spoken before loading the next word
                if (nextWordTimerRef.current) clearTimeout(nextWordTimerRef.current);
                nextWordTimerRef.current = setTimeout(() => {
                    loadNewWord();
                }, 2500); 
            }
        } else {
            playErrorBuzzer();
            const el = document.getElementById(`bubble-${playerId}-${bubbleId}`);
            if (el) {
                el.classList.add('bg-red-500', 'text-white', 'border-red-700');
                el.classList.remove(isHD ? 'bg-white' : 'bg-slate-100');
                setTimeout(() => {
                    el.classList.remove('bg-red-500', 'text-white', 'border-red-700');
                    el.classList.add(isHD ? 'bg-white' : 'bg-slate-100');
                }, 400);
            }
            onScoreChange(-1);
            setScoreFloat({ val: -1, id: Date.now() });
            setTimeout(() => setScoreFloat(null), 1000);
        }
    };

    if (!targetWord) return null;

    return (
        <div className={`flex-1 flex flex-col w-full h-full relative rounded-2xl md:rounded-3xl overflow-hidden shadow-inner touch-none ${isHD ? 'border-2 border-slate-200 bg-white' : 'border-2 sm:border-4 border-slate-300 bg-slate-100'} ${isFlipped ? 'rotate-180 lg:rotate-0' : ''}`}>
            
            {/* TOP HUD */}
            <div className={`w-full bg-white border-b-2 sm:border-b-4 ${isP1 ? 'border-blue-200' : 'border-rose-200'} p-1.5 sm:p-2 md:p-3 flex items-center justify-between gap-1.5 sm:gap-2 z-20 relative shrink-0 ${isHD ? 'shadow-md' : 'shadow-none border-b-4 sm:border-b-8'}`}>
                
                {/* Left: Score Badge */}
                <div className={`shrink-0 flex flex-col items-center justify-center ${isP1 ? 'bg-blue-50 border-blue-200' : 'bg-rose-50 border-rose-200'} border-2 rounded-xl px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-2`}>
                    <span className={`text-[9px] sm:text-[10px] md:text-xs font-black ${isP1 ? 'text-blue-400' : 'text-rose-400'} uppercase`}>P{isP1 ? '1' : '2'}</span>
                    <span className={`text-xl sm:text-2xl md:text-3xl font-black ${isP1 ? 'text-blue-600' : 'text-rose-600'} leading-none`}>{score}</span>
                </div>
                
                {/* Center: Image & Slots */}
                <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-3 md:gap-4 py-0.5">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-slate-50 rounded-xl border-2 border-slate-200 p-1 shadow-sm shrink-0">
                        <SmartImage wordData={targetWord} className="w-full h-full object-contain border-none shadow-none bg-transparent" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 md:gap-2">
                        {targetChars.map((char: string, idx: number) => {
                            const isFilled = idx < foundCount;
                            return (
                                <div key={idx} className={`w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center font-black text-sm sm:text-lg md:text-2xl shadow-inner transition-all duration-300 shrink-0
                                    ${isFilled ? 'bg-gradient-to-b from-green-400 to-green-500 text-white border-b-2 sm:border-b-4 border-green-600 shadow-md' : 'bg-slate-100 text-slate-300 border-b-2 border-slate-200'}
                                `}>
                                    {isFilled ? char : (visualUsed ? <span className="opacity-40 text-slate-500">{char}</span> : '')}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Timer & In-Game Menu Button */}
                <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                    <div className={`flex items-center justify-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-xl border-2 transition-colors shadow-sm ${timeLeft <= 10 ? 'border-red-500 text-red-600 bg-red-50 animate-pulse' : (isHD ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white border-slate-300 text-slate-800')}`}>
                        <Clock size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        <span className="text-xs sm:text-base md:text-xl font-black leading-none">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                    </div>
                    {onMenu && (
                        <button
                            onClick={onMenu}
                            className="bg-slate-100 hover:bg-red-500 hover:text-white text-slate-700 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:border-red-600 shadow-sm font-bold text-xs flex items-center gap-1 transition-colors"
                            title="Return to Menu"
                        >
                            <Home size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Menu</span>
                        </button>
                    )}
                </div>
            </div>

            {/* SEPARATE PHYSICS ARENA */}
            <div ref={arenaRef} className={`flex-1 relative w-full overflow-hidden min-h-0 ${isHD ? (isP1 ? 'bg-gradient-to-b from-blue-50 to-white' : 'bg-gradient-to-b from-rose-50 to-white') : 'bg-slate-200 border-y-2 border-slate-300'}`}>
                {scoreFloat && (
                    <div key={scoreFloat.id} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-5xl md:text-6xl font-black z-50 animate-fade-in-up pointer-events-none ${isHD ? 'drop-shadow-lg' : ''} ${scoreFloat.val > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {scoreFloat.val > 0 ? `+${scoreFloat.val}` : scoreFloat.val}
                    </div>
                )}
                {bubbleList.map(bubble => (
                    <button
                        key={bubble.id}
                        id={`bubble-${playerId}-${bubble.id}`}
                        onPointerDown={() => handleBubbleTap(bubble.id, bubble.char)}
                        style={{ willChange: 'top, left' }} 
                        className={`absolute w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-lg sm:text-2xl md:text-3xl transition-colors duration-150 z-10 active:scale-95 touch-none 
                            ${isHD ? 'bg-white text-slate-800 shadow-[0_6px_12px_rgba(0,0,0,0.1)] border-b-2 sm:border-b-4 border-slate-200' : 'bg-slate-100 text-slate-900 border-2 border-slate-300 shadow-none'}
                        `}
                    >
                        {bubble.char}
                    </button>
                ))}
            </div>

            {/* BOTTOM HUD: Hint Dashboard */}
            <div className={`w-full bg-white border-t-2 sm:border-t-4 ${isP1 ? 'border-blue-200' : 'border-rose-200'} p-1.5 sm:p-2 md:p-3 flex items-center justify-center gap-2 sm:gap-3 z-20 shrink-0 ${isHD ? 'shadow-md' : 'shadow-none border-t-4 sm:border-t-8'}`}>
                <button 
                    onClick={() => { if(audioProgress >= 100) { playDictionaryAudio(targetWord.word); if(!audioUsed) { setAudioUsed(true); setMaxWordScore(m => Math.min(m, 2)); } } }}
                    disabled={audioProgress < 100}
                    className={`flex-1 relative overflow-hidden rounded-xl md:rounded-2xl h-8 sm:h-10 md:h-12 border-2 transition-all flex items-center justify-center gap-1.5 sm:gap-2 font-bold text-xs md:text-sm touch-none ${audioProgress < 100 ? 'bg-slate-100 border-slate-200 text-slate-400' : audioUsed ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-500 border-blue-600 text-white shadow-md'}`}
                >
                    <div className="absolute left-0 bottom-0 top-0 bg-blue-200/40 z-0 transition-all" style={{ width: `${audioProgress}%` }}></div>
                    <Volume2 size={16} className="relative z-10" />
                    <span className="relative z-10 hidden sm:inline">सुनें (Hear)</span>
                </button>

                <button 
                    onClick={() => { if(visualProgress >= 100 && !visualUsed) { setVisualUsed(true); setMaxWordScore(m => Math.min(m, 1)); } }}
                    disabled={visualProgress < 100 || visualUsed}
                    className={`flex-1 relative overflow-hidden rounded-xl md:rounded-2xl h-8 sm:h-10 md:h-12 border-2 transition-all flex items-center justify-center gap-1.5 sm:gap-2 font-bold text-xs md:text-sm touch-none ${visualProgress < 100 ? 'bg-slate-100 border-slate-200 text-slate-400' : visualUsed ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-purple-500 border-purple-600 text-white shadow-md'}`}
                >
                    <div className="absolute left-0 bottom-0 top-0 bg-purple-200/40 z-0 transition-all" style={{ width: `${visualProgress}%` }}></div>
                    <Eye size={16} className="relative z-10" />
                    <span className="relative z-10 hidden sm:inline">देखें (See)</span>
                </button>
            </div>
        </div>
    );
};


// ============================================================================
// MAIN WRAPPER 
// ============================================================================
export default function HindiWordCrush({ lesson, onComplete = () => {} }: any) {
    const subtopicId = lesson?.subtopicId || lesson?.routePath?.split('/').pop() || 'word-builder-2';
    
    // --- MODE DETECTOR ---
    const isMatraMode = subtopicId.includes('matra');
    const fetchId = subtopicId.replace('game-', 'wb-');

    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
    const [config, setConfig] = useState({ length: 2, players: 1, isHD: false }); 
    const [timeLeft, setTimeLeft] = useState(180); 
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [wordPool, setWordPool] = useState<any[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile && config.players > 1) {
                setConfig(c => ({ ...c, players: 1 }));
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [config.players]);

    // Unmount audio cleanup
    useEffect(() => {
        return () => {
            if (sharedAudioCtx && sharedAudioCtx.state !== 'closed') {
                try {
                    sharedAudioCtx.close();
                } catch (e) {}
                sharedAudioCtx = null;
            }
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && gameState === 'playing') {
            setGameState("gameover");
        }
    }, [timeLeft, gameState]);

    const startGame = (targetId: string, players: number) => {
        const pool = getWordsForSubtopic(targetId);
        if (pool.length < 5) {
            alert("Not enough words in the dictionary to play this level!");
            return;
        }
        setWordPool(pool);
        setConfig(c => ({ ...c, players }));
        setScores({ p1: 0, p2: 0 });
        setTimeLeft(180);
        setGameState('playing');
    };

    const handleScoreUpdate = useCallback((playerId: 'p1' | 'p2', points: number) => {
        setScores(prev => ({ ...prev, [playerId]: prev[playerId] + points }));
    }, []);

    // ZERO-SCROLL COMPACT MENU RENDER
    if (gameState === 'menu') {
        return (
            <div className="w-full h-full flex-1 min-h-0 flex flex-col items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-50 rounded-3xl overflow-hidden relative select-none">
                
                <div className="mb-2 sm:mb-4 w-full flex justify-center relative z-50">
                   <div className="bg-slate-900 p-1 sm:p-1.5 rounded-2xl inline-flex border-2 border-slate-700 shadow-lg">
                      <button 
                        onClick={() => setConfig(c => ({...c, isHD: true}))} 
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 md:py-2.5 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-black transition-all ${config.isHD ? 'bg-blue-500 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        <Zap size={14} className="sm:w-4 sm:h-4" /> HD Mode
                      </button>
                      <button 
                        onClick={() => setConfig(c => ({...c, isHD: false}))} 
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 md:py-2.5 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-black transition-all ${!config.isHD ? 'bg-orange-500 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        <Monitor size={14} className="sm:w-4 sm:h-4" /> Performance
                      </button>
                   </div>
                </div>

                <div className="text-center mb-2 sm:mb-4 relative z-10">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl mb-1 sm:mb-2 shadow-sm transform rotate-3">
                        <span className="text-xl sm:text-2xl font-black text-white">कख</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-0.5 tracking-tight">Bubble <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Spell</span></h1>
                    <p className="text-xs sm:text-sm font-bold text-slate-400">Hindi Word Crush</p>
                </div>

                <div className={`grid gap-2.5 sm:gap-4 md:gap-6 w-full relative z-10 ${isMobile ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 sm:grid-cols-2 max-w-2xl'}`}>
                    {/* Solo Play */}
                    <div className="bg-white p-3 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col items-center text-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-1.5 sm:mb-2"><User size={18} /></div>
                        <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-800 mb-2">Solo Play</h2>
                        
                        {isMatraMode ? (
                            <button onClick={() => startGame(fetchId, 1)} className="w-full py-2.5 sm:py-3 bg-blue-500 text-white border-b-4 border-blue-700 hover:bg-blue-400 font-black rounded-xl transition-all text-xs sm:text-sm md:text-base uppercase tracking-widest shadow-md active:translate-y-0.5">
                                Start Mission
                            </button>
                        ) : (
                            <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
                                <button onClick={() => startGame('word-builder-2', 1)} className="py-2 sm:py-2.5 bg-white hover:bg-blue-50 border-b-2 sm:border-b-4 border-slate-200 hover:border-blue-400 font-black text-slate-700 rounded-xl transition-all text-xs sm:text-sm md:text-base">2-Letter Words</button>
                                <button onClick={() => startGame('word-builder-3', 1)} className="py-2 sm:py-2.5 bg-white hover:bg-blue-50 border-b-2 sm:border-b-4 border-slate-200 hover:border-blue-400 font-black text-slate-700 rounded-xl transition-all text-xs sm:text-sm md:text-base">3-Letter Words</button>
                                <button onClick={() => startGame('word-builder-4', 1)} className="py-2 sm:py-2.5 bg-white hover:bg-blue-50 border-b-2 sm:border-b-4 border-slate-200 hover:border-blue-400 font-black text-slate-700 rounded-xl transition-all text-xs sm:text-sm md:text-base">4-Letter Words</button>
                            </div>
                        )}
                    </div>

                    {/* Versus Mode (Tablets & Desktops Only) */}
                    {!isMobile && (
                        <div className="bg-white p-3 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col items-center text-center">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-1.5 sm:mb-2"><Users size={18}/></div>
                            <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-800 mb-2">Versus Mode</h2>
                            
                            {isMatraMode ? (
                                <button onClick={() => startGame(fetchId, 2)} className="w-full py-2.5 sm:py-3 bg-rose-500 text-white border-b-4 border-rose-700 hover:bg-rose-400 font-black rounded-xl transition-all text-xs sm:text-sm md:text-base uppercase tracking-widest shadow-md active:translate-y-0.5">
                                    Start Versus
                                </button>
                            ) : (
                                <div className="flex flex-col gap-1.5 sm:gap-2 w-full mt-1">
                                    <button onClick={() => startGame('word-builder-2', 2)} className="py-2 sm:py-2.5 bg-white hover:bg-rose-50 border-b-2 sm:border-b-4 border-slate-200 hover:border-rose-400 font-black text-slate-700 rounded-xl transition-all text-xs sm:text-sm md:text-base">2-Letter Words</button>
                                    <button onClick={() => startGame('word-builder-3', 2)} className="py-2 sm:py-2.5 bg-white hover:bg-rose-50 border-b-2 sm:border-b-4 border-slate-200 hover:border-rose-400 font-black text-slate-700 rounded-xl transition-all text-xs sm:text-sm md:text-base">3-Letter Words</button>
                                    <button onClick={() => startGame('word-builder-4', 2)} className="py-2 sm:py-2.5 bg-white hover:bg-rose-50 border-b-2 sm:border-b-4 border-slate-200 hover:border-rose-400 font-black text-slate-700 rounded-xl transition-all text-xs sm:text-sm md:text-base">4-Letter Words</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ZERO-SCROLL GAME OVER SCREEN WITH DUAL CTAS
    if (gameState === 'gameover') {
        const winner = scores.p1 > scores.p2 ? 'Player 1' : scores.p2 > scores.p1 ? 'Player 2' : 'Tie';
        const topScore = Math.max(scores.p1, scores.p2);

        return (
            <div className="w-full h-full flex-1 min-h-0 flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-slate-50 rounded-3xl select-none relative overflow-hidden">
                <div className="bg-amber-100 p-4 sm:p-6 rounded-full mb-3 border-4 border-amber-50 shadow-inner">
                    <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-amber-500 animate-bounce" />
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-800 mb-1">Time's Up!</h2>
                {config.players === 2 && <p className="text-base sm:text-xl font-bold text-indigo-500 mb-3">{winner === 'Tie' ? "It's a Tie!" : `${winner} Wins!`}</p>}
                
                <div className="flex gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div className="bg-white px-5 py-3 sm:px-8 sm:py-4 rounded-2xl border-2 border-blue-100 text-center shadow-sm">
                        <p className="text-blue-500 font-black uppercase tracking-widest mb-0.5 text-[10px] sm:text-xs">Player 1</p>
                        <p className="text-3xl sm:text-4xl font-black text-blue-700">{scores.p1}</p>
                    </div>
                    {config.players === 2 && (
                        <div className="bg-white px-5 py-3 sm:px-8 sm:py-4 rounded-2xl border-2 border-rose-100 text-center shadow-sm">
                            <p className="text-rose-500 font-black uppercase tracking-widest mb-0.5 text-[10px] sm:text-xs">Player 2</p>
                            <p className="text-3xl sm:text-4xl font-black text-rose-700">{scores.p2}</p>
                        </div>
                    )}
                </div>
                
                {/* Dual CTAs for LessonPlayer */}
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full max-w-sm">
                    <button 
                        onClick={() => {
                            setScores({ p1: 0, p2: 0 });
                            setTimeLeft(180);
                            setGameState('playing');
                        }} 
                        className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-amber-950 border-b-4 border-amber-700 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base shadow-md active:translate-y-0.5"
                    >
                        <RotateCcw size={18} /> Play Again
                    </button>
                    <button 
                        onClick={() => {
                            if (onComplete) {
                                onComplete({ score: topScore, total: topScore });
                            }
                        }} 
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-b-4 border-emerald-800 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base shadow-md active:translate-y-0.5"
                    >
                        Next Step <ArrowRight size={18} />
                    </button>
                </div>

                <button 
                    onClick={() => setGameState('menu')} 
                    className="mt-3.5 text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
                >
                    <Home size={14} /> Back to Menu
                </button>
            </div>
        );
    }

    // ZERO-SCROLL ACTIVE ARENA
    return (
        <div className="w-full h-full flex-1 min-h-0 flex flex-col bg-slate-200 font-sans select-none overflow-hidden rounded-3xl border-2 sm:border-4 border-slate-300 shadow-inner relative">
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2 md:gap-4 p-2 md:p-3 z-10 relative bg-slate-300">
                <PlayerEngine 
                    playerId="p1" 
                    wordPool={wordPool} 
                    score={scores.p1}
                    onScoreChange={(pts: number) => handleScoreUpdate('p1', pts)}
                    isFlipped={config.players === 2} 
                    isHD={config.isHD}
                    timeLeft={timeLeft}
                    onMenu={() => setGameState('menu')}
                />
                
                {config.players === 2 && !isMobile && (
                    <PlayerEngine 
                        playerId="p2" 
                        wordPool={wordPool} 
                        score={scores.p2}
                        onScoreChange={(pts: number) => handleScoreUpdate('p2', pts)}
                        isFlipped={false}
                        isHD={config.isHD}
                        timeLeft={timeLeft}
                        onMenu={() => setGameState('menu')}
                    />
                )}
            </div>
        </div>
    );
}