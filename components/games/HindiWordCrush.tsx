"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Trophy, Users, User, Clock, CheckCircle, RotateCcw, ArrowRight, Volume2, Eye, Lock, Zap, Monitor } from 'lucide-react';
import { getWordsForSubtopic, getWordData } from '@/lib/HindiWordDictionary';
import { HINDI_ASSETS } from '@/lib/SwarVyanjanDictionary';

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

const playSuccessPop = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
};

const playErrorBuzzer = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
};


// ============================================================================
// ISOLATED PLAYER ENGINE
// ============================================================================
const PlayerEngine = ({ playerId, wordPool, score, onScoreChange, isFlipped, isHD, timeLeft }: any) => {
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
    const arenaRef = useRef<HTMLDivElement>(null);

    const playerColor = playerId === 'p1' ? 'blue' : 'rose';
    const targetChars = targetWord ? segmentWord(targetWord.word) : [];

    const playDictionaryAudio = (text: string) => {
        if (!text) return;
        try {
            let audioPath = '';
            if (text.length > 1) {
                const wordData = getWordData(text);
                if (wordData) audioPath = wordData.audioUrl;
            } else {
                const letterData = HINDI_ASSETS[text];
                if (letterData) audioPath = letterData.audio;
            }
            if (audioPath) {
                if (activeAudioRef.current) {
                    activeAudioRef.current.pause();
                    activeAudioRef.current.currentTime = 0;
                }
                const audio = new Audio(audioPath);
                activeAudioRef.current = audio;
                audio.play().catch(e => console.warn(e));
            }
        } catch (e) { console.error(e); }
    };

    const loadNewWord = useCallback(() => {
        const nextWord = wordPool[Math.floor(Math.random() * wordPool.length)];
        const neededChars = segmentWord(nextWord.word);
        
        let newBubbles = [];
        // SPEED FIX: Dialed down significantly from 1.5/2.5 to 0.7/1.1
        const speedMult = isHD ? 0.7 : 1.1; 
        
        neededChars.forEach((char, index) => {
            newBubbles.push({
                id: Math.random().toString(36).substr(2, 9),
                char: char,
                x: 10 + (index * 15), y: 10 + (index * 15), 
                vx: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.8) * speedMult,
                vy: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.8) * speedMult,
            });
        });

        const distractorCount = isHD ? 15 : 10;
        for (let i = 0; i < distractorCount; i++) {
            newBubbles.push({
                id: Math.random().toString(36).substr(2, 9),
                char: HINDI_CONSONANTS[Math.floor(Math.random() * HINDI_CONSONANTS.length)],
                x: Math.random() * 60 + 10, y: Math.random() * 60 + 10,
                vx: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1.0) * speedMult,
                vy: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1.0) * speedMult,
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

    // --- COLLISION PHYSICS ENGINE ---
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
            const bubbleSizePx = isHD ? 64 : 50; 
            
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
                        const dvx = b2.vx - b1.vx;
                        const dvy = b2.vy - b1.vy;
                        
                        if (dx * dvx + dy * dvy < 0) {
                            const tVx = b1.vx; const tVy = b1.vy;
                            b1.vx = b2.vx; b1.vy = b2.vy;
                            b2.vx = tVx; b2.vy = tVy;
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
            playDictionaryAudio(char);
            
            physicsBubbles.current = physicsBubbles.current.filter(b => b.id !== bubbleId);
            setBubbleList([...physicsBubbles.current]);

            const newFoundCount = foundCount + 1;
            setFoundCount(newFoundCount);

            if (newFoundCount === targetChars.length) {
                playDictionaryAudio(targetWord.word);
                onScoreChange(maxWordScore);
                setScoreFloat({ val: maxWordScore, id: Date.now() });
                setTimeout(() => setScoreFloat(null), 1000);
                setTimeout(() => loadNewWord(), 1500); 
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
        <div className={`flex-1 flex flex-col w-full h-full relative rounded-3xl overflow-hidden shadow-inner touch-none ${isHD ? 'border-2 border-slate-200 bg-white' : 'border-4 border-slate-300 bg-slate-100'}`}>
            
            {/* ROTATED TOP HUD */}
            <div className={`w-full bg-white border-b-4 border-${playerColor}-200 p-2 md:p-3 flex items-center justify-start gap-2 z-20 transition-transform duration-300 relative ${isHD ? 'shadow-md' : 'shadow-none border-b-8'} ${isFlipped ? 'rotate-180 lg:rotate-0' : ''}`}>
                
                <div className={`shrink-0 flex flex-col items-center justify-center bg-${playerColor}-50 border-2 border-${playerColor}-200 rounded-xl px-3 py-1 md:px-4 md:py-2`}>
                    <span className={`text-[10px] md:text-xs font-black text-${playerColor}-400 uppercase`}>P{playerId === 'p1' ? '1' : '2'}</span>
                    <span className={`text-2xl md:text-3xl font-black text-${playerColor}-600 leading-none`}>{score}</span>
                </div>
                
                <div className="flex-1 flex items-center justify-start gap-2 md:gap-4 pr-16 md:pr-32">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-xl border-2 border-slate-200 p-1 shadow-sm shrink-0">
                        <SmartImage wordData={targetWord} className="w-full h-full object-contain border-none shadow-none bg-transparent" />
                    </div>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                        {targetChars.map((char: string, idx: number) => {
                            const isFilled = idx < foundCount;
                            return (
                                <div key={idx} className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center font-black text-lg sm:text-xl md:text-2xl shadow-inner transition-all duration-300 shrink-0
                                    ${isFilled ? 'bg-gradient-to-b from-green-400 to-green-500 text-white border-b-4 border-green-600 shadow-md' : 'bg-slate-100 text-slate-300 border-b-2 border-slate-200'}
                                `}>
                                    {isFilled ? char : (visualUsed ? <span className="opacity-40 text-slate-500">{char}</span> : '')}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={`absolute right-2 top-1/2 -translate-y-1/2 shrink-0 flex flex-col md:flex-row items-center justify-center gap-1 px-2 py-1 md:px-4 md:py-2 rounded-xl border-2 transition-colors z-50 shadow-sm ${timeLeft <= 10 ? 'border-red-500 text-red-600 bg-red-50 animate-pulse' : (isHD ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white border-slate-300 text-slate-800')}`}>
                    <Clock size={16} className="md:w-5 md:h-5" />
                    <span className="text-sm md:text-xl font-black leading-none">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
            </div>

            {/* SEPARATE PHYSICS ARENA */}
            <div ref={arenaRef} className={`flex-1 relative w-full overflow-hidden ${isHD ? `bg-gradient-to-b from-${playerColor}-50 to-white shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]` : `bg-slate-200 border-y-2 border-slate-300`}`}>
                {scoreFloat && (
                    <div key={scoreFloat.id} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl md:text-6xl font-black z-50 animate-fade-in-up pointer-events-none ${isHD ? 'drop-shadow-lg' : ''} ${scoreFloat.val > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {scoreFloat.val > 0 ? `+${scoreFloat.val}` : scoreFloat.val}
                    </div>
                )}
                {bubbleList.map(bubble => (
                    <button
                        key={bubble.id}
                        id={`bubble-${playerId}-${bubble.id}`}
                        onPointerDown={() => handleBubbleTap(bubble.id, bubble.char)}
                        style={{ willChange: 'top, left' }} 
                        className={`absolute w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-2xl md:text-3xl transition-colors duration-150 z-10 active:scale-95 touch-none 
                            ${isHD ? 'bg-white text-slate-800 shadow-[0_8px_15px_rgba(0,0,0,0.1)] border-b-4 border-slate-200' : 'bg-slate-100 text-slate-900 border-2 border-slate-300 shadow-none'}
                        `}
                    >
                        {bubble.char}
                    </button>
                ))}
            </div>

            {/* BOTTOM HUD */}
            <div className={`w-full bg-white border-t-4 border-${playerColor}-200 p-2 md:p-3 flex items-center justify-center gap-3 z-20 transition-transform duration-300 ${isHD ? 'shadow-md' : 'shadow-none border-t-8'} ${isFlipped ? 'rotate-180 lg:rotate-0' : ''}`}>
                <button 
                    onClick={() => { if(audioProgress >= 100) { playDictionaryAudio(targetWord.word); if(!audioUsed) { setAudioUsed(true); setMaxWordScore(m => Math.min(m, 2)); } } }}
                    disabled={audioProgress < 100}
                    className={`flex-1 relative overflow-hidden rounded-xl md:rounded-2xl h-10 border-2 transition-all flex items-center justify-center gap-2 font-bold text-xs md:text-sm touch-none ${audioProgress < 100 ? 'bg-slate-100 border-slate-200 text-slate-400' : audioUsed ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-500 border-blue-600 text-white shadow-md'}`}
                >
                    <div className="absolute left-0 bottom-0 top-0 bg-blue-200/40 z-0 transition-all" style={{ width: `${audioProgress}%` }}></div>
                    <Volume2 size={16} className="relative z-10" />
                    <span className="relative z-10 hidden sm:block">सुनें (Hear)</span>
                </button>

                <button 
                    onClick={() => { if(visualProgress >= 100 && !visualUsed) { setVisualUsed(true); setMaxWordScore(m => Math.min(m, 1)); } }}
                    disabled={visualProgress < 100 || visualUsed}
                    className={`flex-1 relative overflow-hidden rounded-xl md:rounded-2xl h-10 border-2 transition-all flex items-center justify-center gap-2 font-bold text-xs md:text-sm touch-none ${visualProgress < 100 ? 'bg-slate-100 border-slate-200 text-slate-400' : visualUsed ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-purple-500 border-purple-600 text-white shadow-md'}`}
                >
                    <div className="absolute left-0 bottom-0 top-0 bg-purple-200/40 z-0 transition-all" style={{ width: `${visualProgress}%` }}></div>
                    <Eye size={16} className="relative z-10" />
                    <span className="relative z-10 hidden sm:block">देखें (See)</span>
                </button>
            </div>
        </div>
    );
};


// ============================================================================
// MAIN WRAPPER 
// ============================================================================
export default function HindiWordCrush({ lesson, onComplete = () => {} }: any) {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
    const [config, setConfig] = useState({ length: 2, players: 1, isHD: false }); 
    const [timeLeft, setTimeLeft] = useState(180); 
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [wordPool, setWordPool] = useState<any[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && gameState === 'playing') {
            setGameState('gameover');
        }
    }, [timeLeft, gameState]);

    const startGame = (length: number, players: number) => {
        const pool = getWordsForSubtopic(`word-builder-${length}`);
        if (pool.length < 5) {
            alert("Not enough words in the dictionary to play this level!");
            return;
        }
        setWordPool(pool);
        setConfig(c => ({ ...c, length, players }));
        setScores({ p1: 0, p2: 0 });
        setTimeLeft(180);
        setGameState('playing');
    };

    const handleScoreUpdate = useCallback((playerId: 'p1' | 'p2', points: number) => {
        setScores(prev => ({ ...prev, [playerId]: prev[playerId] + points }));
    }, []);

    // COMPACT MENU RENDER (Reduced Height constraints)
    if (gameState === 'menu') {
        return (
            <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-3 md:p-6 bg-slate-50 rounded-3xl overflow-y-auto relative">
                
                <div className="mb-3 md:mb-4 w-full flex justify-center relative z-50">
                   <div className="bg-slate-900 p-1.5 rounded-2xl inline-flex border-2 border-slate-700 shadow-lg">
                      <button 
                        onClick={() => setConfig(c => ({...c, isHD: true}))} 
                        className={`px-3 py-2 md:px-4 md:py-2.5 rounded-xl flex items-center gap-1.5 text-xs md:text-sm font-black transition-all ${config.isHD ? 'bg-blue-500 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        <Zap size={16} /> HD Mode
                      </button>
                      <button 
                        onClick={() => setConfig(c => ({...c, isHD: false}))} 
                        className={`px-3 py-2 md:px-4 md:py-2.5 rounded-xl flex items-center gap-1.5 text-xs md:text-sm font-black transition-all ${!config.isHD ? 'bg-orange-500 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        <Monitor size={16} /> Performance
                      </button>
                   </div>
                </div>

                <div className="text-center mb-4 md:mb-6 relative z-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl md:rounded-2xl mb-2 md:mb-3 shadow-sm transform rotate-3">
                        <span className="text-2xl md:text-3xl font-black text-white">कख</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-1 md:mb-2 tracking-tight">Bubble <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Spell</span></h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 w-full max-w-3xl relative z-10 pb-2">
                    <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col items-center text-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2 md:mb-3"><User size={20} /></div>
                        <h2 className="text-lg md:text-xl font-black text-slate-800 mb-3">Solo Play</h2>
                        <div className="flex flex-col gap-2 w-full">
                            <button onClick={() => startGame(2, 1)} className="py-2.5 bg-white hover:bg-blue-50 border-b-4 border-slate-200 hover:border-blue-400 font-black text-slate-700 rounded-xl transition-all text-sm md:text-base">2-Letter Words</button>
                            <button onClick={() => startGame(3, 1)} className="py-2.5 bg-white hover:bg-blue-50 border-b-4 border-slate-200 hover:border-blue-400 font-black text-slate-700 rounded-xl transition-all text-sm md:text-base">3-Letter Words</button>
                            <button onClick={() => startGame(4, 1)} className="py-2.5 bg-white hover:bg-blue-50 border-b-4 border-slate-200 hover:border-blue-400 font-black text-slate-700 rounded-xl transition-all text-sm md:text-base">4-Letter Words</button>
                        </div>
                    </div>

                    {isMobile ? (
                        <div className="bg-slate-200/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-200 flex flex-col items-center text-center justify-center opacity-80">
                            <Lock size={36} className="text-slate-400 mb-3" />
                            <h2 className="text-lg md:text-xl font-black text-slate-500 mb-1">Versus Mode</h2>
                            <p className="text-xs md:text-sm font-bold text-slate-400">Available on Tablets & Laptops</p>
                        </div>
                    ) : (
                        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col items-center text-center">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-2 md:mb-3"><Users size={20}/></div>
                            <h2 className="text-lg md:text-xl font-black text-slate-800 mb-3">Versus Mode</h2>
                            <div className="flex flex-col gap-2 w-full">
                                <button onClick={() => startGame(2, 2)} className="py-2.5 bg-white hover:bg-rose-50 border-b-4 border-slate-200 hover:border-rose-400 font-black text-slate-700 rounded-xl transition-all text-sm md:text-base">2-Letter Words</button>
                                <button onClick={() => startGame(3, 2)} className="py-2.5 bg-white hover:bg-rose-50 border-b-4 border-slate-200 hover:border-rose-400 font-black text-slate-700 rounded-xl transition-all text-sm md:text-base">3-Letter Words</button>
                                <button onClick={() => startGame(4, 2)} className="py-2.5 bg-white hover:bg-rose-50 border-b-4 border-slate-200 hover:border-rose-400 font-black text-slate-700 rounded-xl transition-all text-sm md:text-base">4-Letter Words</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (gameState === 'gameover') {
        const winner = scores.p1 > scores.p2 ? 'Player 1' : scores.p2 > scores.p1 ? 'Player 2' : 'Tie';
        return (
            <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-3xl">
                <div className="bg-amber-100 p-6 rounded-full mb-4 border-4 border-amber-50 shadow-inner">
                    <Trophy className="w-12 h-12 md:w-16 md:h-16 text-amber-500 animate-bounce" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">Time's Up!</h2>
                {config.players === 2 && <p className="text-lg md:text-xl font-bold text-indigo-500 mb-6">{winner === 'Tie' ? "It's a Tie!" : `${winner} Wins!`}</p>}
                
                <div className="flex gap-4 mb-8">
                    <div className="bg-white px-6 py-4 md:px-8 md:py-6 rounded-2xl border-2 border-blue-100 text-center shadow-sm">
                        <p className="text-blue-500 font-black uppercase tracking-widest mb-1 text-xs">Player 1</p>
                        <p className="text-4xl md:text-5xl font-black text-blue-700">{scores.p1}</p>
                    </div>
                    {config.players === 2 && (
                        <div className="bg-white px-6 py-4 md:px-8 md:py-6 rounded-2xl border-2 border-rose-100 text-center shadow-sm">
                            <p className="text-rose-500 font-black uppercase tracking-widest mb-1 text-xs">Player 2</p>
                            <p className="text-4xl md:text-5xl font-black text-rose-700">{scores.p2}</p>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <button onClick={() => setGameState('menu')} className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><RotateCcw size={16} /> Play Again</button>
                    <button onClick={() => onComplete()} className="flex-1 py-3 bg-indigo-500 text-white font-black rounded-xl shadow-md border-b-4 border-indigo-700 active:translate-y-1 transition-all flex items-center justify-center gap-2">Next Lesson <ArrowRight size={16} /></button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[600px] max-h-[90vh] flex flex-col bg-slate-200 font-sans overflow-hidden rounded-3xl border-4 border-slate-300 shadow-inner relative">
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2 md:gap-4 p-2 md:p-4 z-10 relative bg-slate-300">
                <PlayerEngine 
                    playerId="p1" 
                    wordPool={wordPool} 
                    score={scores.p1}
                    onScoreChange={(pts: number) => handleScoreUpdate('p1', pts)}
                    isFlipped={config.players === 2} 
                    isHD={config.isHD}
                    timeLeft={timeLeft}
                />
                
                {config.players === 2 && (
                    <PlayerEngine 
                        playerId="p2" 
                        wordPool={wordPool} 
                        score={scores.p2}
                        onScoreChange={(pts: number) => handleScoreUpdate('p2', pts)}
                        isFlipped={false}
                        isHD={config.isHD}
                        timeLeft={timeLeft}
                    />
                )}
            </div>
        </div>
    );
}