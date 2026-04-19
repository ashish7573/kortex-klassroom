"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Trophy, Users, User, Clock, CheckCircle, RotateCcw, ArrowRight, Star, Volume2, Eye } from 'lucide-react';
import { getWordsForSubtopic, getWordData } from '@/lib/HindiWordDictionary';
import { HINDI_ASSETS } from '@/lib/SwarVyanjanDictionary';

const HINDI_CONSONANTS = [
    "क", "ख", "ग", "घ", "च", "छ", "ज", "झ", "ट", "ठ", "ड", "ढ", "ण", 
    "त", "थ", "द", "ध", "न", "प", "फ", "ब", "भ", "म", "य", "र", "ल", "व", "श", "ष", "स", "ह"
];

// --- HELPER: Smart Image ---
const SmartImage = ({ wordData, className }: { wordData: any, className: string }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError || !wordData.imageUrl) {
    return <div className={`flex items-center justify-center bg-slate-100 rounded-xl shadow-sm ${className}`}><span className="text-6xl md:text-7xl">{wordData.emoji || '🖼️'}</span></div>;
  }
  return <img src={wordData.imageUrl} alt={wordData.english} onError={() => setHasError(true)} className={`object-contain bg-white rounded-xl shadow-sm ${className}`} />;
};

// --- AUDIO SYNTHESIZERS ---
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
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
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
// INDEPENDENT PLAYER BOARD (Bubble Scatter Engine)
// ============================================================================
const PlayerBoard = ({ playerId, wordLength, wordPool, onScoreUpdate, isMultiplayer }: any) => {
    const [targetWord, setTargetWord] = useState<any>(null);
    const [foundCount, setFoundCount] = useState(0);
    const [bubbles, setBubbles] = useState<{char: string, isUsed: boolean}[]>([]);
    
    // Hint System States
    const [audioProgress, setAudioProgress] = useState(0);
    const [visualProgress, setVisualProgress] = useState(0);
    const [audioUsed, setAudioUsed] = useState(false);
    const [visualUsed, setVisualUsed] = useState(false);
    const [maxWordScore, setMaxWordScore] = useState(3);
    
    // Visual Feedback
    const [wrongBubbleIdx, setWrongBubbleIdx] = useState<number | null>(null);
    const [scoreFloat, setScoreFloat] = useState<{val: number, id: number} | null>(null);

    const activeAudioRef = useRef<HTMLAudioElement | null>(null);

    // --- AUDIO ROUTER ---
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

    // --- INVISIBLE INJECTION REFILL ---
    const loadNewWord = useCallback((currentBubbles: {char: string, isUsed: boolean}[]) => {
        const nextWord = wordPool[Math.floor(Math.random() * wordPool.length)];
        
        let nextBubbles = [...currentBubbles];
        
        // 1. Initial Load: Fill board with 20 random letters
        if (nextBubbles.length === 0) {
            for (let i = 0; i < 20; i++) {
                nextBubbles.push({ char: HINDI_CONSONANTS[Math.floor(Math.random() * HINDI_CONSONANTS.length)], isUsed: false });
            }
        }

        // 2. Find empty slots (where isUsed is true). If none (like start of game), pick random spots.
        let emptyIndices = nextBubbles.map((b, i) => b.isUsed ? i : -1).filter(i => i !== -1);
        if (emptyIndices.length < nextWord.word.length) {
            emptyIndices = [];
            while (emptyIndices.length < nextWord.word.length) {
                let r = Math.floor(Math.random() * 20);
                if (!emptyIndices.includes(r)) emptyIndices.push(r);
            }
        }

        // 3. Inject the needed letters into the empty spots!
        const neededChars = nextWord.word.split('');
        for (let i = 0; i < neededChars.length; i++) {
            const spot = emptyIndices.pop()!;
            nextBubbles[spot] = { char: neededChars[i], isUsed: false };
        }

        // 4. Fill any remaining empty spots with random distractors
        emptyIndices.forEach(spot => {
            nextBubbles[spot] = { char: HINDI_CONSONANTS[Math.floor(Math.random() * HINDI_CONSONANTS.length)], isUsed: false };
        });

        setTargetWord(nextWord);
        setBubbles(nextBubbles);
        setFoundCount(0);
        
        // Reset Hints
        setAudioProgress(0);
        setVisualProgress(0);
        setAudioUsed(false);
        setVisualUsed(false);
        setMaxWordScore(3);
    }, [wordPool]);

    // Initial Load
    useEffect(() => {
        if (wordPool.length > 0 && !targetWord) {
            loadNewWord([]);
        }
    }, [wordPool, targetWord, loadNewWord]);

    // --- LIQUID HINT TIMERS ---
    useEffect(() => {
        if (!targetWord || foundCount >= targetWord.word.length) return;
        
        const interval = setInterval(() => {
            // Audio fills first
            setAudioProgress(p => {
                if (p < 100) return Math.min(p + (100 / 70), 100); // 70 ticks of 100ms = 7 seconds
                return 100;
            });

            // Visual only starts filling AFTER audio has been tapped
            if (audioUsed) {
                setVisualProgress(p => {
                    if (p < 100) return Math.min(p + (100 / 70), 100); // Another 7 seconds
                    return 100;
                });
            }
        }, 100);

        return () => clearInterval(interval);
    }, [targetWord, foundCount, audioUsed]);


    // --- GAMEPLAY INTERACTIONS ---
    const handleBubbleClick = (idx: number) => {
        if (!targetWord || foundCount >= targetWord.word.length || bubbles[idx].isUsed) return;

        const clickedChar = bubbles[idx].char;
        const expectedChar = targetWord.word[foundCount];

        if (clickedChar === expectedChar) {
            // CORRECT!
            playSuccessPop();
            playDictionaryAudio(clickedChar);
            
            const nextBubbles = [...bubbles];
            nextBubbles[idx].isUsed = true;
            setBubbles(nextBubbles);
            
            const newFoundCount = foundCount + 1;
            setFoundCount(newFoundCount);

            if (newFoundCount === targetWord.word.length) {
                // WORD COMPLETE!
                playDictionaryAudio(targetWord.word);
                onScoreUpdate(playerId, maxWordScore);
                setScoreFloat({ val: maxWordScore, id: Date.now() });
                setTimeout(() => setScoreFloat(null), 1000);
                
                setTimeout(() => loadNewWord(nextBubbles), 1500);
            }
        } else {
            // WRONG! (Mashing Penalty)
            playErrorBuzzer();
            setWrongBubbleIdx(idx);
            setTimeout(() => setWrongBubbleIdx(null), 500);
            
            onScoreUpdate(playerId, -1);
            setScoreFloat({ val: -1, id: Date.now() });
            setTimeout(() => setScoreFloat(null), 1000);
        }
    };

    const triggerAudioHint = () => {
        if (audioProgress < 100) return;
        playDictionaryAudio(targetWord.word);
        if (!audioUsed) {
            setAudioUsed(true);
            setMaxWordScore(prev => Math.min(prev, 2));
        }
    };

    const triggerVisualHint = () => {
        if (visualProgress < 100 || visualUsed) return;
        setVisualUsed(true);
        setMaxWordScore(prev => Math.min(prev, 1));
    };

    if (!targetWord) return null;

    const playerColor = playerId === 'p1' ? 'blue' : 'rose';
    const isWordComplete = foundCount === targetWord.word.length;

    return (
        <div className={`flex flex-col h-full w-full bg-${playerColor}-50 rounded-3xl border-4 border-${playerColor}-100 p-3 md:p-5 relative`}>
            
            {/* FLOATING SCORE ANIMATION */}
            {scoreFloat && (
                <div key={scoreFloat.id} className={`absolute top-1/3 left-1/2 -translate-x-1/2 text-5xl font-black z-50 animate-fade-in-up ${scoreFloat.val > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {scoreFloat.val > 0 ? `+${scoreFloat.val}` : scoreFloat.val}
                </div>
            )}

            {/* FOCUS ZONE (Image & Slots) */}
            <div className="shrink-0 flex flex-col items-center mb-6">
                <div className={`w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2rem] border-4 p-2 shadow-sm mb-4 transition-colors duration-300 ${isWordComplete ? 'border-green-400 bg-green-50 scale-105' : `border-${playerColor}-200`}`}>
                    <SmartImage wordData={targetWord} className="w-full h-full object-contain border-none shadow-none" />
                </div>

                {/* Empty Box Slots */}
                <div className="flex gap-2">
                    {targetWord.word.split('').map((char: string, idx: number) => {
                        const isFilled = idx < foundCount;
                        return (
                            <div key={idx} className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-black text-2xl md:text-4xl shadow-sm transition-all duration-300
                                ${isFilled ? 'bg-green-500 text-white border-4 border-green-600 scale-110 z-10' : 'bg-white text-slate-300 border-4 border-slate-200'}
                            `}>
                                {isFilled ? char : (visualUsed ? <span className="opacity-30">{char}</span> : '')}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SCATTER BOARD (5x4 Grid) */}
            <div className="flex-1 w-full flex items-center justify-center max-w-lg mx-auto mb-6">
                <div className="grid grid-cols-5 grid-rows-4 gap-2 w-full h-full">
                    {bubbles.map((bubble, idx) => (
                        <button
                            key={idx}
                            disabled={bubble.isUsed || isWordComplete}
                            onClick={() => handleBubbleClick(idx)}
                            className={`w-full h-full rounded-full flex items-center justify-center font-black text-2xl md:text-3xl shadow-sm transition-all duration-200 
                                ${bubble.isUsed ? 'opacity-0 scale-50 pointer-events-none' : 
                                  wrongBubbleIdx === idx ? 'bg-red-500 text-white border-b-4 border-red-700 animate-[shake_0.4s_ease-in-out]' : 
                                  `bg-white text-slate-700 border-b-4 border-slate-200 hover:bg-sky-50 hover:scale-105 active:scale-95 active:border-b-0`}
                            `}
                        >
                            {bubble.char}
                        </button>
                    ))}
                </div>
            </div>

            {/* HINT DASHBOARD (Liquid Fill Timers) */}
            <div className="shrink-0 flex gap-4 w-full max-w-sm mx-auto mt-auto">
                {/* AUDIO HINT */}
                <button 
                    onClick={triggerAudioHint}
                    disabled={audioProgress < 100}
                    className={`flex-1 relative overflow-hidden rounded-2xl h-14 border-4 transition-all flex items-center justify-center gap-2 font-bold z-10
                        ${audioProgress < 100 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 
                          audioUsed ? 'bg-blue-100 border-blue-300 text-blue-600 shadow-inner' : 'bg-blue-500 border-blue-600 text-white shadow-md animate-pulse'}
                    `}
                >
                    {/* Liquid Fill Background */}
                    <div className="absolute left-0 bottom-0 top-0 bg-blue-200/40 z-0 transition-all duration-100" style={{ width: `${audioProgress}%` }}></div>
                    <Volume2 size={20} className="relative z-10" />
                    <span className="relative z-10 hidden sm:block">सुनें</span>
                </button>

                {/* VISUAL HINT */}
                <button 
                    onClick={triggerVisualHint}
                    disabled={visualProgress < 100 || visualUsed}
                    className={`flex-1 relative overflow-hidden rounded-2xl h-14 border-4 transition-all flex items-center justify-center gap-2 font-bold z-10
                        ${visualProgress < 100 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 
                          visualUsed ? 'bg-purple-100 border-purple-300 text-purple-600 shadow-inner' : 'bg-purple-500 border-purple-600 text-white shadow-md animate-pulse'}
                    `}
                >
                    {/* Liquid Fill Background */}
                    <div className="absolute left-0 bottom-0 top-0 bg-purple-200/40 z-0 transition-all duration-100" style={{ width: `${visualProgress}%` }}></div>
                    <Eye size={20} className="relative z-10" />
                    <span className="relative z-10 hidden sm:block">देखें</span>
                </button>
            </div>
        </div>
    );
};


// ============================================================================
// MAIN GAME WRAPPER (Handles Menu, Timer, and Master State)
// ============================================================================
export default function HindiWordCrush({ lesson, onComplete = () => {} }: any) {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
    const [settings, setSettings] = useState({ length: 2, players: 1 });
    const [timeLeft, setTimeLeft] = useState(180); // 180 seconds!
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [wordPool, setWordPool] = useState<any[]>([]);

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
        setSettings({ length, players });
        setScores({ p1: 0, p2: 0 });
        setTimeLeft(180);
        setGameState('playing');
    };

    const handleScoreUpdate = useCallback((playerId: 'p1' | 'p2', points: number) => {
        setScores(prev => ({ ...prev, [playerId]: prev[playerId] + points }));
    }, []);

    // --- MENU RENDER ---
    if (gameState === 'menu') {
        return (
            <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-100 rounded-3xl mb-6 border-4 border-indigo-50 shadow-inner transform rotate-3">
                        <span className="text-5xl font-black text-indigo-500">कख</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-slate-800 mb-4 tracking-tight">Bubble <span className="text-indigo-500">Spell</span></h1>
                    <p className="text-xl font-bold text-slate-500">Select your mode to begin the 3-minute challenge!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                    <div className="bg-white p-8 rounded-[2.5rem] border-4 border-blue-100 shadow-sm flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4"><User size={32}/></div>
                        <h2 className="text-2xl font-black text-slate-800 mb-6">Solo Play</h2>
                        <div className="flex flex-col gap-3 w-full">
                            <button onClick={() => startGame(2, 1)} className="py-4 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-400 font-bold text-slate-700 rounded-2xl transition-colors">2-Letter Words</button>
                            <button onClick={() => startGame(3, 1)} className="py-4 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-400 font-bold text-slate-700 rounded-2xl transition-colors">3-Letter Words</button>
                            <button onClick={() => startGame(4, 1)} className="py-4 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-400 font-bold text-slate-700 rounded-2xl transition-colors">4-Letter Words</button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border-4 border-rose-100 shadow-sm flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4"><Users size={32}/></div>
                        <h2 className="text-2xl font-black text-slate-800 mb-6">Versus Mode</h2>
                        <div className="flex flex-col gap-3 w-full">
                            <button onClick={() => startGame(2, 2)} className="py-4 bg-slate-50 hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-400 font-bold text-slate-700 rounded-2xl transition-colors">2-Letter Words</button>
                            <button onClick={() => startGame(3, 2)} className="py-4 bg-slate-50 hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-400 font-bold text-slate-700 rounded-2xl transition-colors">3-Letter Words</button>
                            <button onClick={() => startGame(4, 2)} className="py-4 bg-slate-50 hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-400 font-bold text-slate-700 rounded-2xl transition-colors">4-Letter Words</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- GAME OVER RENDER ---
    if (gameState === 'gameover') {
        const winner = scores.p1 > scores.p2 ? 'Player 1' : scores.p2 > scores.p1 ? 'Player 2' : 'Tie';
        return (
            <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-3xl">
                <div className="bg-amber-100 p-8 rounded-full mb-6 border-8 border-amber-50 shadow-inner">
                    <Trophy className="w-20 h-20 text-amber-500" />
                </div>
                <h2 className="text-5xl font-black text-slate-800 mb-2">Time's Up!</h2>
                {settings.players === 2 && <p className="text-2xl font-bold text-indigo-500 mb-8">{winner === 'Tie' ? "It's a Tie!" : `${winner} Wins!`}</p>}
                
                <div className="flex gap-8 mb-12">
                    <div className="bg-blue-100 px-8 py-6 rounded-3xl border-4 border-blue-200 text-center shadow-sm">
                        <p className="text-blue-500 font-bold mb-1">Player 1</p>
                        <p className="text-6xl font-black text-blue-700">{scores.p1}</p>
                    </div>
                    {settings.players === 2 && (
                        <div className="bg-rose-100 px-8 py-6 rounded-3xl border-4 border-rose-200 text-center shadow-sm">
                            <p className="text-rose-500 font-bold mb-1">Player 2</p>
                            <p className="text-6xl font-black text-rose-700">{scores.p2}</p>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <button onClick={() => setGameState('menu')} className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><RotateCcw size={20} /> Play Again</button>
                    <button onClick={() => onComplete()} className="flex-1 py-4 bg-indigo-500 text-white font-black rounded-2xl shadow-md border-b-4 border-indigo-700 active:border-b-0 transition-all flex items-center justify-center gap-2">Next Lesson <ArrowRight size={20} /></button>
                </div>
            </div>
        );
    }

    // --- PLAYING RENDER ---
    return (
        <div className="w-full h-full min-h-[600px] max-h-screen flex flex-col bg-white font-sans overflow-hidden rounded-3xl border-2 border-slate-100">
            {/* MASTER HEADER */}
            <div className="shrink-0 p-3 md:p-4 bg-slate-900 flex justify-between items-center z-10 shadow-md">
                <div className="flex items-center gap-3 w-1/3">
                    <div className="bg-blue-500/20 border border-blue-500/50 text-blue-400 font-black px-4 py-2 rounded-xl flex items-center gap-2">
                        <User size={18}/> P1: <span className="text-white text-lg">{scores.p1}</span>
                    </div>
                </div>
                
                <div className="flex flex-col items-center w-1/3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Remaining</span>
                    <div className={`text-2xl md:text-3xl font-black flex items-center gap-2 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        <Clock size={24}/> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 w-1/3">
                    {settings.players === 2 && (
                        <div className="bg-rose-500/20 border border-rose-500/50 text-rose-400 font-black px-4 py-2 rounded-xl flex items-center gap-2">
                            P2: <span className="text-white text-lg">{scores.p2}</span> <Users size={18}/>
                        </div>
                    )}
                </div>
            </div>

            {/* SPLIT SCREEN BOARDS */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-4 bg-slate-100">
                <PlayerBoard 
                    playerId="p1" 
                    wordLength={settings.length} 
                    wordPool={wordPool} 
                    onScoreUpdate={handleScoreUpdate} 
                    isMultiplayer={settings.players === 2}
                />
                
                {settings.players === 2 && (
                    <PlayerBoard 
                        playerId="p2" 
                        wordLength={settings.length} 
                        wordPool={wordPool} 
                        onScoreUpdate={handleScoreUpdate} 
                        isMultiplayer={true}
                    />
                )}
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shake {
                  0%, 100% { transform: translateX(0); }
                  25% { transform: translateX(-5px) rotate(-2deg); }
                  75% { transform: translateX(5px) rotate(2deg); }
                }
            `}} />
        </div>
    );
}