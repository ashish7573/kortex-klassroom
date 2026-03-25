import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Heart, Trophy, Play, RotateCcw, Volume2, VolumeX, AlertCircle } from 'lucide-react';

// --- GAME DATA ---
const SWAR_DATA = [
  { swar: 'अ', images: ['🍎', '🍐'], words: ['अनार', 'अमरूद'] },
  { swar: 'आ', images: ['🥭', '🔥'], words: ['आम', 'आग'] },
  { swar: 'इ', images: ['🫘', '🏢'], words: ['इमली', 'इमारत'] },
  { swar: 'ई', images: ['🎋', '🧱'], words: ['ईख', 'ईंट'] },
  { swar: 'उ', images: ['🦉', '🎁'], words: ['उल्लू', 'उपहार'] },
  { swar: 'ऊ', images: ['🧶', '🐫'], words: ['ऊन', 'ऊंट'] }
];

const PASTEL_COLORS = [
  'bg-rose-400', 'bg-pink-400', 'bg-fuchsia-400', 'bg-violet-400', 
  'bg-indigo-400', 'bg-blue-400', 'bg-sky-400', 'bg-cyan-400', 
  'bg-teal-400', 'bg-emerald-400', 'bg-green-400', 'bg-amber-400', 'bg-orange-400'
];

// --- AUDIO SYNTHESIZER ---
// Generates sounds without needing external audio files
const playSound = (type, isMuted) => {
  if (isMuted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'incorrect') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'pop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

// --- MAIN COMPONENT ---
export default function SwarPopGame({ onComplete = (result: { score: number; stars: number }) => {} }) {
  // Game State
  const [gameState, setGameState] = useState('start'); // start, playing, gameover
  const [targetData, setTargetData] = useState(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]);
  
  // React state for bubble management (mounting/unmounting nodes)
  const [bubbles, setBubbles] = useState([]);
  
  // Refs for high-performance physics engine
  const containerRef = useRef(null);
  const physicsBubblesRef = useRef([]); // Holds mutable physics state
  const bubbleDOMRefs = useRef({});     // Holds references to DOM nodes
  const animationFrameRef = useRef(null);

  // --- GAME LOGIC ---
  const startGame = () => {
    const randomTarget = SWAR_DATA[Math.floor(Math.random() * SWAR_DATA.length)];
    setTargetData(randomTarget);
    setScore(0);
    setLives(3);
    setTimeLeft(30);
    setGameState('playing');
    setFloatingTexts([]);
    setBubbles([]);
    physicsBubblesRef.current = [];
    spawnInitialBubbles(randomTarget);
  };

  const endGame = useCallback(() => {
    setGameState('gameover');
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const calculateStars = () => {
    if (score >= 200) return 3;
    if (score >= 100) return 2;
    if (score > 0) return 1;
    return 0;
  };

  const handleFinish = () => {
    onComplete({ score, stars: calculateStars() });
  };

  // --- SPAWN LOGIC ---
  const spawnBubble = useCallback((targetInfo, forceTarget = false) => {
    if (!containerRef.current) return null;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = 35; // Bubble size

    // Decide if this bubble should be a target or distractor
    const isTarget = forceTarget || Math.random() > 0.6; // 40% chance to be correct
    
    let content = '';
    let isImage = Math.random() > 0.5;

    if (isTarget) {
      content = isImage 
        ? targetInfo.images[Math.floor(Math.random() * targetInfo.images.length)]
        : targetInfo.swar;
    } else {
      // Pick a random distractor
      let distractorData;
      do {
        distractorData = SWAR_DATA[Math.floor(Math.random() * SWAR_DATA.length)];
      } while (distractorData.swar === targetInfo.swar);

      content = isImage
        ? distractorData.images[Math.floor(Math.random() * distractorData.images.length)]
        : distractorData.swar;
    }

    const color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
    const speedMultiplier = 1 + (Math.random() * 1.5);

    const newBubble = {
      id: Math.random().toString(36).substr(2, 9),
      x: radius + Math.random() * (width - radius * 2),
      y: radius + Math.random() * (height - radius * 2),
      vx: (Math.random() > 0.5 ? 1 : -1) * speedMultiplier,
      vy: (Math.random() > 0.5 ? 1 : -1) * speedMultiplier,
      radius,
      content,
      isTarget,
      color,
      scale: 0 // For pop-in animation
    };

    return newBubble;
  }, []);

  const spawnInitialBubbles = useCallback((targetInfo) => {
    const initialCount = 12;
    const newBubbles = [];
    for (let i = 0; i < initialCount; i++) {
      // Guarantee at least 4 targets initially
      const b = spawnBubble(targetInfo, i < 4);
      if (b) newBubbles.push(b);
    }
    
    physicsBubblesRef.current = newBubbles;
    setBubbles(newBubbles.map(b => ({ id: b.id, content: b.content, color: b.color })));
  }, [spawnBubble]);

  // --- PHYSICS ENGINE ---
  const updatePhysics = useCallback(() => {
    if (gameState !== 'playing' || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    physicsBubblesRef.current.forEach(b => {
      // Apply pop-in scale
      if (b.scale < 1) b.scale += 0.05;

      // Move
      b.x += b.vx;
      b.y += b.vy;

      // Bounce off walls
      if (b.x <= b.radius) { b.x = b.radius; b.vx *= -1; }
      if (b.x >= width - b.radius) { b.x = width - b.radius; b.vx *= -1; }
      if (b.y <= b.radius) { b.y = b.radius; b.vy *= -1; }
      if (b.y >= height - b.radius) { b.y = height - b.radius; b.vy *= -1; }

      // Update DOM directly for 60fps performance without React re-renders
      const domNode = bubbleDOMRefs.current[b.id];
      if (domNode) {
        domNode.style.transform = `translate(${b.x - b.radius}px, ${b.y - b.radius}px) scale(${Math.min(b.scale, 1)})`;
      }
    });

    animationFrameRef.current = requestAnimationFrame(updatePhysics);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, updatePhysics]);

  // --- TIMER ---
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, endGame]);

  // --- INTERACTIONS ---
  const handleBubbleClick = (id) => {
    if (gameState !== 'playing') return;

    const bubbleIndex = physicsBubblesRef.current.findIndex(b => b.id === id);
    if (bubbleIndex === -1) return;

    const bubble = physicsBubblesRef.current[bubbleIndex];
    
    // Add floating text
    const textId = Math.random().toString(36).substr(2, 9);
    
    if (bubble.isTarget) {
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

    // Remove old text after animation
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== textId));
    }, 1000);

    // Remove the clicked bubble from physics engine
    physicsBubblesRef.current.splice(bubbleIndex, 1);
    
    // Determine if we should force a target bubble to spawn to maintain balance
    const currentTargetsCount = physicsBubblesRef.current.filter(b => b.isTarget).length;
    const forceTarget = currentTargetsCount < 3;
    
    // Spawn 1 or 2 new bubbles to replace it
    const newB1 = spawnBubble(targetData, forceTarget);
    if (newB1) physicsBubblesRef.current.push(newB1);
    
    if (Math.random() > 0.5) {
      const newB2 = spawnBubble(targetData, false);
      if (newB2) physicsBubblesRef.current.push(newB2);
    }

    // Sync React state to mount/unmount DOM nodes
    setBubbles(physicsBubblesRef.current.map(b => ({ id: b.id, content: b.content, color: b.color })));
  };

  // --- RENDERERS ---
  return (
    <div className={`w-full max-w-4xl mx-auto min-h-[600px] h-[600px] bg-white rounded-3xl border-2 border-slate-100 shadow-sm relative overflow-hidden flex flex-col font-sans transition-transform duration-75 ${screenShake ? 'translate-x-2 -translate-y-1' : ''}`}>
      
      {/* HEADER / HUD */}
      <div className="flex justify-between items-center p-4 bg-white/80 backdrop-blur-md border-b-2 border-slate-50 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-sky-100 text-sky-700 px-4 py-2 rounded-2xl font-black text-xl flex items-center gap-2 shadow-sm border border-sky-200">
            <Star className="w-6 h-6 fill-sky-500 text-sky-500" />
            {score}
          </div>
          {gameState === 'playing' && (
            <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-2xl font-black text-xl flex items-center gap-2 shadow-sm border border-amber-200">
              00:{timeLeft.toString().padStart(2, '0')}
            </div>
          )}
        </div>

        {gameState === 'playing' && targetData && (
          <div className="absolute left-1/2 -translate-x-1/2 top-4 bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-2xl shadow-md border-4 border-indigo-200 animate-pulse">
            Find: {targetData.swar}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i} 
                className={`w-8 h-8 transition-all duration-300 ${i < lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-200 fill-slate-200 scale-75 opacity-50'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* GAME AREA */}
      <div 
        ref={containerRef} 
        className="flex-1 relative bg-gradient-to-b from-sky-50 to-indigo-50/50 touch-none overflow-hidden"
      >
        {/* START SCREEN */}
        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-30">
            <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-sky-100 text-center max-w-md w-full animate-in fade-in zoom-in duration-300">
              <div className="bg-sky-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl font-black text-sky-600">अ</span>
              </div>
              <h1 className="text-4xl font-black text-slate-800 mb-2">Swar Pop!</h1>
              <p className="text-slate-500 font-medium mb-8">Pop the bubbles that match the Swar shown at the top of the screen. Watch out for the wrong ones!</p>
              <button 
                onClick={startGame}
                className="w-full bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-2xl py-4 px-8 rounded-2xl shadow-lg shadow-sky-200 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Play className="fill-white w-6 h-6" /> Play Now
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md z-30">
            <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-indigo-100 text-center max-w-md w-full animate-in slide-in-from-bottom-8 duration-500">
              <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-4 drop-shadow-md" />
              <h2 className="text-4xl font-black text-slate-800 mb-2">
                {lives === 0 ? 'Out of Lives!' : 'Time\'s Up!'}
              </h2>
              
              <div className="flex justify-center gap-2 mb-6">
                {[...Array(3)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-12 h-12 transition-all delay-${i * 100} duration-500 ${i < calculateStars() ? 'text-amber-400 fill-amber-400 scale-110' : 'text-slate-200 fill-slate-200 scale-90'}`} 
                  />
                ))}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-1">Final Score</p>
                <p className="text-5xl font-black text-indigo-600">{score}</p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={startGame}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" /> Play Again
                </button>
                <button 
                  onClick={handleFinish}
                  className="flex-1 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-lg py-4 px-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                >
                  Finish & Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BUBBLES RENDER LAYER */}
        {gameState === 'playing' && bubbles.map((bubble) => (
          <div
            key={bubble.id}
            ref={el => bubbleDOMRefs.current[bubble.id] = el}
            onPointerDown={() => handleBubbleClick(bubble.id)}
            className={`absolute top-0 left-0 w-[70px] h-[70px] ${bubble.color} rounded-full shadow-md flex items-center justify-center cursor-pointer select-none border-4 border-white/40 active:brightness-90 hover:scale-105 transition-transform origin-center`}
            style={{ 
              transform: `translate(-1000px, -1000px)`, // Initial offscreen, moved immediately by physics
              willChange: 'transform'
            }}
          >
            {/* Glossy overlay effect */}
            <div className="absolute top-1 left-2 w-4 h-4 bg-white/40 rounded-full blur-[1px]"></div>
            <span className="text-4xl font-black text-white drop-shadow-sm pointer-events-none">
              {bubble.content}
            </span>
          </div>
        ))}

        {/* FLOATING TEXTS LAYER */}
        {floatingTexts.map(ft => (
          <div
            key={ft.id}
            className={`absolute pointer-events-none font-black text-3xl animate-out fade-out slide-out-to-top-8 duration-1000 ${
              ft.type === 'good' ? 'text-emerald-500 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]' : 'text-rose-500 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]'
            }`}
            style={{
              left: ft.x,
              top: ft.y - 20,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {ft.text}
          </div>
        ))}
        
      </div>
    </div>
  );
}