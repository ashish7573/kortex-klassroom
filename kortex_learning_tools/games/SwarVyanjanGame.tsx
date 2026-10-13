import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Star, Heart, Trophy, RotateCcw, Volume2, VolumeX, Clock, ArrowRight, Home } from 'lucide-react';
import { HINDI_ASSETS, SUBTOPIC_MAP } from '@/kortex_library/SwarVyanjanDictionary';

// Cumulative Review Order
const SUBTOPIC_ORDER = [
  'swar-a-oo', 'swar-ri-aha', 'vyanjan-ka', 'vyanjan-cha',
  'vyanjan-tta', 'vyanjan-ta', 'vyanjan-pa', 'vyanjan-ya',
  'vyanjan-sha', 'vyanjan-ksha', 'vyanjan-extra'
];

const PASTEL_COLORS = [
  'bg-rose-400', 'bg-pink-400', 'bg-fuchsia-400', 'bg-violet-400', 
  'bg-indigo-400', 'bg-blue-400', 'bg-sky-400', 'bg-cyan-400', 
  'bg-teal-400', 'bg-emerald-400', 'bg-green-400', 'bg-amber-400', 'bg-orange-400'
];

// --- HINDI SPEECH SYNTHESIS FALLBACK ---
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

// --- SINGLETON AUDIO SYNTHESIZER ---
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

const playSound = (type: string, isMuted: boolean) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); 
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'incorrect') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

// --- MAIN COMPONENT ---
export default function SwarVyanjanGame({ lesson, onComplete = () => {} }: any) {
  // --- DATA LOGIC ---
  const [activeLetters, setActiveLetters] = useState<string[]>([]);
  
  const mode = useMemo(() => {
    const t = lesson?.title?.toLowerCase() || '';
    if (t.includes('आवाज़ से')) return 'AUDIO_TO_LETTER';
    if (t.includes('व्यंजन से चित्र') || (t.includes('चित्र पहचानो') && !t.includes('अक्षर'))) return 'LETTER_TO_IMAGE';
    return 'IMAGE_TO_LETTER'; 
  }, [lesson?.title]);

  useEffect(() => {
    const slug = lesson?.subtopicId?.trim() || '';
    const currentIndex = SUBTOPIC_ORDER.indexOf(slug);
    let lettersPool: string[] = [];

    if (currentIndex !== -1) {
      const subtopicsToInclude = SUBTOPIC_ORDER.slice(0, currentIndex + 1);
      subtopicsToInclude.forEach(sub => {
        lettersPool = [...lettersPool, ...(SUBTOPIC_MAP[sub] || [])];
      });
    } else {
      lettersPool = SUBTOPIC_MAP[slug] || SUBTOPIC_MAP['swar-a-oo'] || [];
    }

    if (mode === 'LETTER_TO_IMAGE' || mode === 'IMAGE_TO_LETTER') {
      const filtered = lettersPool.filter(char => HINDI_ASSETS[char]?.examples?.some((ex: any) => ex.image));
      if (filtered.length > 0) lettersPool = filtered;
    }
    setActiveLetters(lettersPool);
  }, [lesson?.subtopicId, mode]);

  // --- GAME STATE ---
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [targetLetter, setTargetLetter] = useState<string>('');
  const [targetImageUrl, setTargetImageUrl] = useState<string>(''); 
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<any[]>([]);
  
  const [bubbles, setBubbles] = useState<any[]>([]);
  
  // Physics Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const physicsBubblesRef = useRef<any[]>([]);
  const bubbleDOMRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const animationFrameRef = useRef<number | null>(null);
  const targetAudioRef = useRef<HTMLAudioElement | null>(null);

  // Target picker helper
  const pickTarget = useCallback((pool: string[]) => {
    if (!pool || pool.length === 0) return { letter: '', imageUrl: '' };
    const randLetter = pool[Math.floor(Math.random() * pool.length)];
    const imageExamples = HINDI_ASSETS[randLetter]?.examples?.filter((ex: any) => ex.image) || [];
    const randImage = imageExamples.length > 0
      ? imageExamples[Math.floor(Math.random() * imageExamples.length)].image
      : '';
    return { letter: randLetter, imageUrl: randImage };
  }, []);

  // --- TARGET GENERATION ---
  useEffect(() => {
    if (activeLetters.length > 0 && !targetLetter) {
      const { letter, imageUrl } = pickTarget(activeLetters);
      setTargetLetter(letter);
      setTargetImageUrl(imageUrl);
    }
  }, [activeLetters, targetLetter, pickTarget]);

  // Audio Playback with TTS Fallback
  const playLetterAudio = useCallback((letter: string) => {
    if (isMuted || !letter) return;
    const assetAudio = HINDI_ASSETS[letter]?.audio;
    if (assetAudio && targetAudioRef.current) {
      targetAudioRef.current.src = assetAudio;
      targetAudioRef.current.play().catch(() => {
        playTTS(letter);
      });
    } else {
      playTTS(letter);
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startGame = (selectedDiff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(selectedDiff);
    setScore(0);
    setLives(3);
    setTimeLeft(30);
    setGameState('playing');
    setFloatingTexts([]);
    setBubbles([]);
    physicsBubblesRef.current = [];

    let currentTarget = targetLetter;
    if (!currentTarget && activeLetters.length > 0) {
      const picked = pickTarget(activeLetters);
      currentTarget = picked.letter;
      setTargetLetter(picked.letter);
      setTargetImageUrl(picked.imageUrl);
    }

    spawnInitialBubbles(currentTarget, selectedDiff);

    setTimeout(() => {
      playLetterAudio(currentTarget);
    }, 400);
  };

  const endGame = useCallback(() => {
    setGameState('gameover');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const earnedStars = score >= 120 ? 3 : score >= 60 ? 2 : score >= 20 ? 1 : 0;

  // --- SPAWN LOGIC ---
  const spawnBubble = useCallback((currentTarget: string, forceTarget = false, currentDiff = difficulty) => {
    if (!currentTarget) return null;

    const isTarget = forceTarget || Math.random() > 0.6;
    let bubbleLetter = currentTarget;

    if (!isTarget && activeLetters.length > 1) {
      do {
        bubbleLetter = activeLetters[Math.floor(Math.random() * activeLetters.length)];
      } while (bubbleLetter === currentTarget);
    }

    const color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
    
    let speedMult = 0.2; 
    if (currentDiff === 'easy') speedMult = 0.12 + (Math.random() * 0.08);
    if (currentDiff === 'medium') speedMult = 0.2 + (Math.random() * 0.12);
    if (currentDiff === 'hard') speedMult = 0.32 + (Math.random() * 0.16);

    const imageExamples = HINDI_ASSETS[bubbleLetter]?.examples?.filter((ex: any) => ex.image) || [];
    const hasImage = imageExamples.length > 0;
    const displayType = (Math.random() > 0.5 && hasImage) ? 'image' : 'text'; 

    let randomImageUrl = null;
    if (displayType === 'image') {
      const randomIdx = Math.floor(Math.random() * imageExamples.length);
      randomImageUrl = imageExamples[randomIdx].image;
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      x: 5 + Math.random() * 75, 
      y: 5 + Math.random() * 70, 
      vx: (Math.random() > 0.5 ? 1 : -1) * speedMult,
      vy: (Math.random() > 0.5 ? 1 : -1) * speedMult,
      letter: bubbleLetter,
      displayType,
      imageUrl: randomImageUrl,
      color,
      scale: 0
    };
  }, [activeLetters, difficulty]);

  const spawnInitialBubbles = useCallback((initialTarget: string, currentDiff: string) => {
    const initialCount = currentDiff === 'hard' ? 10 : currentDiff === 'medium' ? 8 : 6;
    const newBubbles = [];
    for (let i = 0; i < initialCount; i++) {
      const b = spawnBubble(initialTarget, i < 2, currentDiff as any); 
      if (b) newBubbles.push(b);
    }
    physicsBubblesRef.current = newBubbles;
    setBubbles([...physicsBubblesRef.current]);
  }, [spawnBubble]);

  // --- PHYSICS ENGINE ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    const maxCount = difficulty === 'hard' ? 10 : difficulty === 'medium' ? 8 : 6;
    const spawnInterval = setInterval(() => {
      setBubbles(prev => {
        if (physicsBubblesRef.current.length >= maxCount) return prev;
        
        const newB = spawnBubble(targetLetter, false);
        if (newB) {
          physicsBubblesRef.current.push(newB);
          return [...physicsBubblesRef.current];
        }
        return prev;
      });
    }, difficulty === 'hard' ? 900 : 1400);

    let lastTime = performance.now();
    const tick = (time: number) => {
      const dt = Math.min((time - lastTime) / 16, 2.5); // Guard against delta-time jumps
      lastTime = time;

      physicsBubblesRef.current.forEach(b => {
        if (b.scale < 1) b.scale += 0.05 * dt;

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x <= 2) { b.x = 2; b.vx = Math.abs(b.vx); }
        if (b.x >= 82) { b.x = 82; b.vx = -Math.abs(b.vx); }
        if (b.y <= 2) { b.y = 2; b.vy = Math.abs(b.vy); }
        if (b.y >= 80) { b.y = 80; b.vy = -Math.abs(b.vy); }

        const domNode = bubbleDOMRefs.current[b.id];
        if (domNode) {
          domNode.style.left = `${b.x}%`;
          domNode.style.top = `${b.y}%`;
          domNode.style.transform = `scale(${Math.min(b.scale, 1)})`;
        }
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      clearInterval(spawnInterval);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, difficulty, targetLetter, spawnBubble]);

  // --- TIMER ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft <= 0 && gameState === 'playing') {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, endGame]);

  // --- INTERACTIONS ---
  const handleBubbleClick = (id: string) => {
    if (gameState !== 'playing') return;

    const bubbleIndex = physicsBubblesRef.current.findIndex(b => b.id === id);
    if (bubbleIndex === -1) return;

    const bubble = physicsBubblesRef.current[bubbleIndex];
    const textId = Math.random().toString(36).substr(2, 9);

    if (bubble.letter === targetLetter) {
      playSound('correct', isMuted);
      setScore(s => s + 10);
      setFloatingTexts(prev => [...prev, { id: textId, x: bubble.x, y: bubble.y, text: '+10', type: 'good' }]);
    } else {
      playSound('incorrect', isMuted);
      setScore(s => Math.max(0, s - 5));
      setLives(l => {
        const newLives = l - 1;
        if (newLives <= 0) {
          setTimeout(endGame, 400);
        }
        return newLives;
      });
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 300);
      setFloatingTexts(prev => [...prev, { id: textId, x: bubble.x, y: bubble.y, text: '-5', type: 'bad' }]);
    }

    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== textId));
    }, 1000);

    physicsBubblesRef.current.splice(bubbleIndex, 1);
    
    const currentTargetsCount = physicsBubblesRef.current.filter(b => b.letter === targetLetter).length;
    const forceTarget = currentTargetsCount < 2; 
    
    const newB1 = spawnBubble(targetLetter, forceTarget);
    if (newB1) physicsBubblesRef.current.push(newB1);
    
    if (Math.random() > 0.5 || difficulty === 'hard') {
      const newB2 = spawnBubble(targetLetter, false);
      if (newB2) physicsBubblesRef.current.push(newB2);
    }

    setBubbles([...physicsBubblesRef.current]);
  };

  if (!activeLetters.length) {
    return (
      <div className="p-10 text-center text-white bg-slate-900 w-full h-full flex items-center justify-center font-black text-2xl">
        लोड हो रहा है... (Loading Data...)
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex-1 min-h-0 bg-slate-900 rounded-2xl md:rounded-3xl overflow-hidden relative flex flex-col font-sans select-none transition-transform duration-75 ${screenShake ? 'translate-x-2 -translate-y-1' : ''}`}>
      <audio ref={targetAudioRef} />
      
      {/* START SCREEN */}
      {gameState === 'start' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm p-3 sm:p-4 md:p-6 text-center overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-800 p-5 sm:p-7 md:p-10 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-slate-700 shadow-2xl my-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2">{lesson?.title || 'स्वर व्यंजन खेल'}</h1>
            <p className="text-slate-400 font-bold text-xs sm:text-sm md:text-base mb-4 sm:mb-6 leading-relaxed">
              लक्ष्य अक्षर वाले गुब्बारे फोड़ें!<br/>
              <span className="text-lime-400 font-extrabold">+10 सही उत्तर</span> | <span className="text-rose-400 font-extrabold">-5 गलत उत्तर</span><br/>
              आपके पास 30 सेकंड और 3 जीवन हैं।
            </p>

            <div className="mb-4 sm:mb-6 bg-slate-900/90 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl inline-block border border-slate-700 shadow-inner">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1.5">पहचानने वाला अक्षर (Target):</p>
              <div className="flex items-center justify-center gap-3 sm:gap-5">
                {mode === 'IMAGE_TO_LETTER' && targetImageUrl ? (
                  <img src={targetImageUrl} className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md bg-white/10 rounded-full p-2" alt="Target" />
                ) : mode === 'AUDIO_TO_LETTER' ? (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-sky-500 rounded-full flex items-center justify-center shadow-md">
                    <Volume2 className="text-white w-7 h-7 sm:w-9 sm:h-9 animate-pulse"/>
                  </div>
                ) : (
                  <span className="text-4xl sm:text-6xl font-black text-sky-400 leading-none">{targetLetter}</span>
                )}
                <button
                  onClick={() => playLetterAudio(targetLetter)}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-500 hover:bg-sky-400 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-md"
                  title="ध्वनि सुनें"
                >
                  <Volume2 className="text-white w-5 h-5 sm:w-6 sm:h-6"/>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => startGame('easy')}
                className="py-2.5 sm:py-3.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-base rounded-xl border-b-4 border-emerald-700 active:translate-y-1 transition-all"
              >
                सरल (EASY)
              </button>
              <button
                onClick={() => startGame('medium')}
                className="py-2.5 sm:py-3.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-base rounded-xl border-b-4 border-amber-700 active:translate-y-1 transition-all"
              >
                मध्यम (MED)
              </button>
              <button
                onClick={() => startGame('hard')}
                className="py-2.5 sm:py-3.5 px-3 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs sm:text-base rounded-xl border-b-4 border-rose-700 active:translate-y-1 transition-all"
              >
                कठिन (HARD)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md p-3 sm:p-4 md:p-6 text-center overflow-y-auto">
          <div className="bg-slate-800 p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-sky-900/80 w-full max-w-md my-auto">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400 mx-auto mb-2 sm:mb-3 drop-shadow" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2">
              {lives <= 0 ? 'कोई जीवन नहीं बचा!' : 'समय समाप्त! (Time\'s Up)'}
            </h2>
            <div className="flex justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              {[...Array(3)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-9 h-9 sm:w-11 sm:h-11 transition-all ${
                    i < earnedStars ? 'text-amber-400 fill-amber-400' : 'text-slate-600 fill-slate-700'
                  }`}
                />
              ))}
            </div>
            <div className="bg-slate-900/90 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-5 sm:mb-6 border border-slate-700">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] sm:text-xs mb-1">अंतिम अंक (Final Score)</p>
              <p className="text-4xl sm:text-5xl md:text-6xl font-black text-lime-400 leading-none">{score}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <button
                onClick={() => {
                  if (activeLetters.length > 0) {
                    const picked = pickTarget(activeLetters);
                    setTargetLetter(picked.letter);
                    setTargetImageUrl(picked.imageUrl);
                  }
                  startGame(difficulty);
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" /> फिर से खेलें
              </button>
              
              <button
                onClick={() => onComplete({ score, stars: earnedStars, total: 150 })}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-white font-black py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all text-sm sm:text-base"
              >
                आगे बढ़ें <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                if (activeLetters.length > 0) {
                  const picked = pickTarget(activeLetters);
                  setTargetLetter(picked.letter);
                  setTargetImageUrl(picked.imageUrl);
                }
                setGameState('start');
              }}
              className="mt-3 text-slate-400 hover:text-white text-xs sm:text-sm font-semibold underline underline-offset-4"
            >
              सेटिंग्स बदलें (Menu)
            </button>
          </div>
        </div>
      )}

      {/* PLAYING HUD - Slim Single Row */}
      <div className="relative z-10 bg-slate-800/95 backdrop-blur-md px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-slate-700/80 flex items-center justify-between shrink-0 shadow-md h-12 sm:h-14 md:h-16">
        
        {/* Left: Score & Lives */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl border border-slate-700 shadow-inner">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />
            <span className="font-black text-white text-xs sm:text-base leading-none">{score}</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/90 px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl border border-slate-700 shadow-inner">
            {[...Array(3)].map((_, i) => (
              <Heart key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700 fill-slate-800'}`} />
            ))}
          </div>
        </div>

        {/* Center: Target Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-indigo-600/90 px-2.5 sm:px-4 py-1 rounded-full border border-indigo-400/80 shadow-md">
          <span className="text-indigo-200 font-bold uppercase hidden sm:inline text-xs tracking-wider">खोजो:</span>
          {mode === 'AUDIO_TO_LETTER' ? (
            <button
              onClick={() => playLetterAudio(targetLetter)}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm"
              title="Play Target Sound"
            >
              <Volume2 className="text-indigo-600 w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </button>
          ) : mode === 'LETTER_TO_IMAGE' && targetImageUrl ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <img src={targetImageUrl} className="w-6 h-6 sm:w-8 sm:h-8 object-contain drop-shadow bg-white/20 rounded-full p-0.5" alt="Target" />
              <button
                onClick={() => playLetterAudio(targetLetter)}
                className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center active:scale-95 transition-all"
                title="Hear Word Sound"
              >
                <Volume2 className="text-white w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-2xl font-black text-white leading-none drop-shadow-sm">{targetLetter}</span>
              <button
                onClick={() => playLetterAudio(targetLetter)}
                className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center active:scale-95 transition-all"
                title="Hear Sound"
              >
                <Volume2 className="text-white w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Timer, Mute & In-Game Menu Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={`flex items-center gap-1 bg-slate-900/90 px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl border ${timeLeft <= 5 ? 'border-rose-500 text-rose-500 animate-pulse' : 'border-slate-700 text-white'}`}>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-black text-xs sm:text-sm leading-none">0:{timeLeft.toString().padStart(2, '0')}</span>
          </div>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 sm:p-1.5 bg-slate-900/90 hover:bg-slate-700/80 rounded-lg sm:rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          <button
            onClick={() => {
              if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
              setGameState('start');
            }}
            className="p-1 sm:p-1.5 bg-slate-900/90 hover:bg-slate-700/80 rounded-lg sm:rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Menu / Settings"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* PHYSICS PLAY AREA */}
      <div ref={containerRef} className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900 overflow-hidden touch-none">
        {gameState === 'playing' && bubbles.map((bubble) => (
          <button
            key={bubble.id}
            ref={(el) => { bubbleDOMRefs.current[bubble.id] = el; }}
            onPointerDown={() => handleBubbleClick(bubble.id)}
            className={`absolute w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 ${bubble.color} rounded-full shadow-lg flex items-center justify-center cursor-pointer select-none border-2 sm:border-4 border-white/40 active:scale-90 hover:scale-105 origin-center pointer-events-auto transition-transform`}
            style={{ willChange: 'transform' }}
          >
            <div className="absolute top-1 left-1.5 w-3 h-3 sm:w-4 sm:h-4 bg-white/40 rounded-full blur-[0.5px]"></div>
            
            {bubble.displayType === 'image' && bubble.imageUrl ? (
              <img src={bubble.imageUrl} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain pointer-events-none drop-shadow-md bg-white/30 rounded-full p-1" alt="bubble" />
            ) : (
              <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-sm pointer-events-none">{bubble.letter}</span>
            )}
          </button>
        ))}

        {floatingTexts.map(ft => (
          <div
            key={ft.id}
            className={`absolute pointer-events-none font-black text-xl sm:text-3xl animate-out fade-out slide-out-to-top-8 duration-1000 ${
              ft.type === 'good' ? 'text-lime-400 drop-shadow-lg' : 'text-rose-500 drop-shadow-lg'
            }`}
            style={{ left: `${ft.x}%`, top: `calc(${ft.y}% - 20px)`, transform: 'translate(-50%, -50%)' }}
          >
            {ft.text}
          </div>
        ))}
      </div>
    </div>
  );
}