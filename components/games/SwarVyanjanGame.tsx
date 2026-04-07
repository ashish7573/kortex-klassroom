import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Star, Heart, Trophy, Play, RotateCcw, Volume2, VolumeX, Clock, ArrowRight } from 'lucide-react';
import { HINDI_ASSETS, SUBTOPIC_MAP } from '@/lib/SwarVyanjanDictionary';

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

// --- AUDIO SYNTHESIZER ---
const playSound = (type: string, isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); 
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'incorrect') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) { console.error("Audio playback failed", e); }
};

// --- MAIN COMPONENT ---
export default function SwarVyanjanGame({ lesson, onComplete = () => {} }: any) {
  // --- DATA LOGIC ---
  const [activeLetters, setActiveLetters] = useState<string[]>([]);
  
  const mode = useMemo(() => {
    const t = lesson.title?.toLowerCase() || '';
    if (t.includes('आवाज़ से')) return 'AUDIO_TO_LETTER';
    if (t.includes('व्यंजन से चित्र') || (t.includes('चित्र पहचानो') && !t.includes('अक्षर'))) return 'LETTER_TO_IMAGE';
    return 'IMAGE_TO_LETTER'; 
  }, [lesson.title]);

  useEffect(() => {
    const slug = lesson.subtopicId?.trim() || '';
    const currentIndex = SUBTOPIC_ORDER.indexOf(slug);
    let lettersPool: string[] = [];

    if (currentIndex !== -1) {
      const subtopicsToInclude = SUBTOPIC_ORDER.slice(0, currentIndex + 1);
      subtopicsToInclude.forEach(sub => {
        lettersPool = [...lettersPool, ...(SUBTOPIC_MAP[sub] || [])];
      });
    } else {
      lettersPool = SUBTOPIC_MAP[slug] || SUBTOPIC_MAP['swar-a-oo'];
    }

    if (mode === 'LETTER_TO_IMAGE' || mode === 'IMAGE_TO_LETTER') {
      lettersPool = lettersPool.filter(char => HINDI_ASSETS[char]?.examples?.some((ex: any) => ex.image));
    }
    setActiveLetters(lettersPool);
  }, [lesson.subtopicId, mode]);

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

  // --- TARGET GENERATION ---
  useEffect(() => {
    if (activeLetters.length > 0 && !targetLetter) {
      const initialTarget = activeLetters[Math.floor(Math.random() * activeLetters.length)];
      setTargetLetter(initialTarget);

      const imageExamples = HINDI_ASSETS[initialTarget]?.examples?.filter((ex: any) => ex.image) || [];
      if (imageExamples.length > 0) {
        setTargetImageUrl(imageExamples[Math.floor(Math.random() * imageExamples.length)].image);
      }
    }
  }, [activeLetters, targetLetter]);

  const startGame = (selectedDiff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(selectedDiff);
    setScore(0);
    setLives(3);
    setTimeLeft(30);
    setGameState('playing');
    setFloatingTexts([]);
    setBubbles([]);
    physicsBubblesRef.current = [];
    spawnInitialBubbles(targetLetter, selectedDiff);

    setTimeout(() => {
      if (!isMuted && HINDI_ASSETS[targetLetter]?.audio && targetAudioRef.current) {
        targetAudioRef.current.src = HINDI_ASSETS[targetLetter].audio;
        targetAudioRef.current.play().catch(() => {});
      }
    }, 500);
  };

  const endGame = useCallback(() => {
    setGameState('gameover');
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const earnedStars = score > 150 ? 3 : score > 80 ? 2 : score > 20 ? 1 : 0;

  // --- SPAWN LOGIC ---
  const spawnBubble = useCallback((currentTarget: string, forceTarget = false, currentDiff = difficulty) => {
    if (!containerRef.current || !currentTarget) return null;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = 35; 

    const isTarget = forceTarget || Math.random() > 0.6;
    let bubbleLetter = currentTarget;

    if (!isTarget && activeLetters.length > 1) {
      do {
        bubbleLetter = activeLetters[Math.floor(Math.random() * activeLetters.length)];
      } while (bubbleLetter === currentTarget);
    }

    const color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
    
    let speedMult = 0.2; 
    if (currentDiff === 'easy') speedMult = 0.1 + (Math.random() * 0.1);
    if (currentDiff === 'medium') speedMult = 0.2 + (Math.random() * 0.15);
    if (currentDiff === 'hard') speedMult = 0.35 + (Math.random() * 0.2);

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
      x: 10 + Math.random() * 70, 
      y: 10 + Math.random() * 70, 
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
    const initialCount = currentDiff === 'hard' ? 12 : 8;
    const newBubbles = [];
    for (let i = 0; i < initialCount; i++) {
      const b = spawnBubble(initialTarget, i < 3, currentDiff as any); 
      if (b) newBubbles.push(b);
    }
    physicsBubblesRef.current = newBubbles;
    setBubbles([...physicsBubblesRef.current]);
  }, [spawnBubble]);

  // --- PHYSICS ENGINE ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnInterval = setInterval(() => {
      setBubbles(prev => {
        if (physicsBubblesRef.current.length >= (difficulty === 'hard' ? 12 : 8)) return prev;
        
        const newB = spawnBubble(targetLetter, false);
        if (newB) {
          physicsBubblesRef.current.push(newB);
          return [...physicsBubblesRef.current];
        }
        return prev;
      });
    }, difficulty === 'hard' ? 800 : 1500);

    let lastTime = performance.now();
    const tick = (time: number) => {
      const dt = (time - lastTime) / 16;
      lastTime = time;

      physicsBubblesRef.current.forEach(b => {
        if (b.scale < 1) b.scale += 0.05 * dt;

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x <= 2) { b.x = 2; b.vx *= -1; }
        if (b.x >= 85) { b.x = 85; b.vx *= -1; }
        if (b.y <= 2) { b.y = 2; b.vy *= -1; }
        if (b.y >= 80) { b.y = 80; b.vy *= -1; }

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
        if (newLives <= 0) setTimeout(endGame, 500);
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

  const playTargetAudioBtn = () => {
    if (HINDI_ASSETS[targetLetter]?.audio && targetAudioRef.current) {
      targetAudioRef.current.src = HINDI_ASSETS[targetLetter].audio;
      targetAudioRef.current.play().catch(() => {});
    }
  };

  if (!activeLetters.length) return <div className="p-10 text-center text-white bg-slate-900 w-full h-full flex items-center justify-center font-black text-2xl">Loading Data...</div>;

  return (
    <div className={`w-full h-full bg-slate-900 rounded-3xl overflow-hidden relative flex flex-col font-sans transition-transform duration-75 ${screenShake ? 'translate-x-2 -translate-y-1' : ''}`}>
      <audio ref={targetAudioRef} />
      
      {/* START SCREEN */}
      {gameState === 'start' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
          <div className="w-full max-w-2xl bg-slate-800 p-8 md:p-12 rounded-[2.5rem] border-4 border-slate-700 shadow-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{lesson.title}</h1>
            <p className="text-slate-400 font-bold text-lg md:text-xl mb-8">
              Pop the balloons that match the Target!<br/>
              <span className="text-lime-400">+10 for correct</span> | <span className="text-rose-400">-5 for wrong</span><br/>
              You have 30 seconds and 3 lives.
            </p>

            <div className="mb-10 bg-slate-900 p-6 rounded-3xl inline-block border-2 border-slate-700 shadow-inner">
               <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-2">Target to Find:</p>
               <div className="flex items-center justify-center gap-6">
                  {mode === 'IMAGE_TO_LETTER' && targetImageUrl ? (
                     <img src={targetImageUrl} className="w-20 h-20 object-contain drop-shadow-md bg-white/10 rounded-full p-2" alt="Target" />
                  ) : mode === 'AUDIO_TO_LETTER' ? (
                     <div className="w-20 h-20 bg-sky-500 rounded-full flex items-center justify-center"><Volume2 className="text-white w-10 h-10 animate-pulse"/></div>
                  ) : (
                     <span className="text-7xl font-black text-sky-400">{targetLetter}</span>
                  )}
                  <button onClick={playTargetAudioBtn} className="w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md">
                     <Volume2 className="text-white w-8 h-8"/>
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => startGame('easy')} className="py-4 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black rounded-2xl border-b-4 border-emerald-700 active:translate-y-1 transition-all">EASY</button>
              <button onClick={() => startGame('medium')} className="py-4 px-6 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-2xl border-b-4 border-amber-700 active:translate-y-1 transition-all">MEDIUM</button>
              <button onClick={() => startGame('hard')} className="py-4 px-6 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-2xl border-b-4 border-rose-700 active:translate-y-1 transition-all">HARD</button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md p-6 text-center">
          <div className="bg-slate-800 p-8 md:p-12 rounded-[3rem] shadow-2xl border-4 border-sky-900 w-full max-w-lg">
            <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-black text-white mb-2">{lives <= 0 ? 'Out of Lives!' : 'Time\'s Up!'}</h2>
            <div className="flex justify-center gap-2 mb-6">
              {[...Array(3)].map((_, i) => (
                <Star key={i} className={`w-12 h-12 transition-all ${i < earnedStars ? 'text-amber-400 fill-amber-400' : 'text-slate-600 fill-slate-700'}`} />
              ))}
            </div>
            <div className="bg-slate-900 rounded-3xl p-6 mb-8 border-2 border-slate-700">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-1">Final Score</p>
              <p className="text-6xl font-black text-lime-400">{score}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => {setTargetLetter(''); setTargetImageUrl(''); setGameState('start');}} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all">
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
              <button onClick={() => onComplete({ score, stars: earnedStars })} className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-900 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border-b-4 border-sky-700 active:translate-y-1 active:border-b-0">
                Next Step <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYING HUD */}
      <div className="relative z-10 bg-slate-800/90 backdrop-blur-md p-3 md:p-5 border-b border-slate-700 flex justify-between items-center shrink-0">
        <div className="flex gap-2 md:gap-4">
           <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700">
             <Star className="w-5 h-5 text-sky-500 fill-sky-500" /> <span className="font-black text-white text-xl">{score}</span>
           </div>
           <div className="flex items-center gap-1 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700">
             {[...Array(3)].map((_, i) => (
                <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700 fill-slate-800'}`} />
             ))}
           </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 top-3 bg-indigo-600 px-6 py-2 rounded-full border-4 border-indigo-400 flex items-center gap-4">
          <span className="text-indigo-200 font-bold uppercase hidden sm:block">Find:</span>
          {mode === 'AUDIO_TO_LETTER' ? (
             <button onClick={playTargetAudioBtn} className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><Volume2 className="text-indigo-600"/></button>
          ) : mode === 'IMAGE_TO_LETTER' && targetImageUrl ? (
             <img src={targetImageUrl} className="w-10 h-10 object-contain drop-shadow-md bg-white/20 rounded-full p-1" alt="Target" />
          ) : (
             <span className="text-3xl font-black text-white">{targetLetter}</span>
          )}
        </div>

        <div className={`flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border ${timeLeft <= 5 ? 'border-rose-500 animate-pulse text-rose-500' : 'border-slate-700 text-white'}`}>
           <Clock className="w-5 h-5" /> <span className="font-black text-xl">0:{timeLeft.toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* PHYSICS PLAY AREA */}
      <div ref={containerRef} className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900 overflow-hidden touch-none">
        {gameState === 'playing' && bubbles.map((bubble) => (
          <button
            key={bubble.id}
            ref={(el) => { bubbleDOMRefs.current[bubble.id] = el; }}
            onPointerDown={() => handleBubbleClick(bubble.id)}
            className={`absolute w-[70px] h-[70px] md:w-[90px] md:h-[90px] ${bubble.color} rounded-full shadow-lg flex items-center justify-center cursor-pointer select-none border-4 border-white/40 active:brightness-90 hover:scale-105 origin-center pointer-events-auto`}
            style={{ willChange: 'transform' }} // No left/top here to prevent React fights!
          >
            <div className="absolute top-1 left-2 w-4 h-4 bg-white/40 rounded-full blur-[1px]"></div>
            
            {bubble.displayType === 'image' && bubble.imageUrl ? (
               <img src={bubble.imageUrl} className="w-10 h-10 md:w-14 md:h-14 object-contain pointer-events-none drop-shadow-md bg-white/30 rounded-full p-2" alt="bubble" />
            ) : (
               <span className="text-4xl font-black text-white drop-shadow-sm pointer-events-none">{bubble.letter}</span>
            )}
          </button>
        ))}

        {floatingTexts.map(ft => (
          <div
            key={ft.id}
            className={`absolute pointer-events-none font-black text-3xl animate-out fade-out slide-out-to-top-8 duration-1000 ${
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