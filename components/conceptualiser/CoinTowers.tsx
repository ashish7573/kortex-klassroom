'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Cuboid, CheckCircle2, Volume2 } from 'lucide-react';

interface Tower {
  id: number;
  value: number; // 1 to 10
}

export default function CoinTowers({ lesson, onComplete }: any) {
  const [uiState, setUiState] = useState<'menu' | 'playing' | 'finale' | 'gameover'>('menu');
  // towers array represents the actual left-to-right order on the screen
  const [towers, setTowers] = useState<Tower[]>([]);
  const [finaleStep, setFinaleStep] = useState(0);

  // Drag State
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const audioCtx = useRef<AudioContext | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  
  // Track the last index to prevent spamming audio during live-shifting
  const lastDropIndex = useRef<number>(-1);

  // --- Audio Synthesis ---
  const initAudio = () => {
    if (typeof window === 'undefined') return;

    // 1. Create the AudioContext if it doesn't exist yet
    if (!audioCtx.current) {
      const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (WinAudioContext) audioCtx.current = new WinAudioContext();
    }

    // 2. iOS FIX: Explicitly resume the AudioContext. 
    // Safari starts this in a 'suspended' state until a user interacts.
    if (audioCtx.current && audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }

    // 3. iOS FIX: "Prime" the Speech Synthesis engine.
    // iOS blocks speech unless the very first utterance happens directly on a click event.
    // We send a completely silent, empty string right when they click "Start" to unlock the engine.
    if ('speechSynthesis' in window) {
      const unlockSpeech = new SpeechSynthesisUtterance('');
      unlockSpeech.volume = 0; 
      window.speechSynthesis.speak(unlockSpeech);
    }
  };

  const playSound = (type: 'grab' | 'slide' | 'lock' | 'success') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'grab') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
    } else if (type === 'slide') {
      // Shorter, snappier tick for live shifting
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
    } else if (type === 'lock') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    } else if (type === 'success') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (type === 'success' ? 0.5 : (type === 'slide' ? 0.05 : 0.2)));
  };

  const speakNumber = (num: number) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(num.toString());
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Game Math ---
  const startGame = () => {
    initAudio();
    const initialTowers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      value: i + 1,
    })).sort(() => Math.random() - 0.5);
    
    setTowers(initialTowers);
    setFinaleStep(0);
    setUiState('playing');
  };

  // --- Real-time Shifting Physics ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, tower: Tower, currentIndex: number) => {
    if (uiState !== 'playing') return; 
    if (tower.value === currentIndex + 1) return; // Locked
    
    initAudio();
    playSound('grab');
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setDragOffset({ x: e.clientX - centerX, y: e.clientY - centerY });
    setDragPos({ x: e.clientX, y: e.clientY });
    setActiveDragId(tower.id);
    lastDropIndex.current = currentIndex;
    
    if (stageRef.current) stageRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragId === null) return;
    setDragPos({ x: e.clientX, y: e.clientY });

    // REAL-TIME SHIFTING LOGIC
    if (stageRef.current) {
      const stageRect = stageRef.current.getBoundingClientRect();
      let relativeX = (e.clientX - stageRect.left) / stageRect.width;
      relativeX = Math.max(0, Math.min(0.99, relativeX)); 
      
      const newDropIndex = Math.floor(relativeX * 10);

      if (newDropIndex !== lastDropIndex.current) {
        const currentIdx = towers.findIndex(t => t.id === activeDragId);
        
        if (currentIdx !== newDropIndex) {
          const draggedTower = towers[currentIdx];
          const newTowers = [...towers];
          newTowers.splice(currentIdx, 1);
          newTowers.splice(newDropIndex, 0, draggedTower);
          
          setTowers(newTowers);
          playSound('slide');
        }
        lastDropIndex.current = newDropIndex;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragId === null) return;
    if (stageRef.current) stageRef.current.releasePointerCapture(e.pointerId);

    const draggedTower = towers.find(t => t.id === activeDragId);
    if (draggedTower) {
        const finalIdx = towers.findIndex(t => t.id === activeDragId);
        
        // Final Lock Check
        if (draggedTower.value === finalIdx + 1) {
           playSound('lock');
           speakNumber(draggedTower.value);
        } else {
           playSound('grab'); // Drop sound
        }

        // Win Condition
        if (towers.every((t, i) => t.value === i + 1)) {
          setTimeout(() => startFinale(), 1000);
        }
    }

    setActiveDragId(null);
  };

  // --- The Staircase Finale ---
  const startFinale = () => {
    setUiState('finale');
    playSound('success');
    
    let currentCount = 1;
    setFinaleStep(currentCount);
    speakNumber(currentCount);

    const interval = setInterval(() => {
      currentCount++;
      if (currentCount <= 10) {
        setFinaleStep(currentCount);
        speakNumber(currentCount);
      } else {
        clearInterval(interval);
        setTimeout(() => setUiState('gameover'), 1500);
      }
    }, 1200);
  };

  // --- Isometric Face-Up SVG Coin Renderer ---
  const CoinStack = ({ count }: { count: number }) => (
    <div className="flex flex-col-reverse items-center justify-start w-full h-full pointer-events-none gap-[2px] md:gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative w-[90%] md:w-[80%] aspect-[5/2]">
           <svg viewBox="0 0 100 40" className="w-full h-full drop-shadow-sm overflow-visible">
              {/* Outer Cylinder (Thickness of the coin) */}
              <path d="M 0,20 C 0,31 22.4,40 50,40 C 77.6,40 100,31 100,20 L 100,25 C 100,36 77.6,45 50,45 C 22.4,45 0,36 0,25 Z" fill="#b45309" />
              {/* Inner Face (Top of the coin) */}
              <ellipse cx="50" cy="20" rx="50" ry="20" fill="#fbbf24" />
              {/* Embossed Inner Ring */}
              <ellipse cx="50" cy="20" rx="40" ry="15" fill="#f59e0b" />
              {/* Highlight Sweep */}
              <ellipse cx="40" cy="15" rx="20" ry="6" fill="#fef08a" opacity="0.6" transform="rotate(-15 40 15)" />
           </svg>
        </div>
      ))}
    </div>
  );

  return (
    <div 
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full overflow-hidden bg-slate-900 font-sans touch-none select-none flex flex-col"
    >
      
      {/* HEADER */}
      <div className="h-16 md:h-20 bg-slate-800 border-b-4 border-slate-700 flex items-center justify-between px-4 md:px-8 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-2xl shadow-inner">
            <Cuboid className="text-amber-900 w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-white font-black text-sm md:text-xl uppercase leading-none">Sort The Coins</h1>
            <p className="text-amber-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Order 1 to 10</p>
          </div>
        </div>

        {uiState !== 'menu' && (
          <button onClick={() => setUiState('menu')} className="bg-slate-700 text-slate-300 p-2 md:px-4 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95 border-b-4 border-slate-600 hover:text-white">
             <RotateCcw className="w-4 h-4" /> <span className="hidden md:inline">Restart</span>
          </button>
        )}
      </div>

      {/* PLAY AREA */}
      <div className="flex-1 relative flex flex-col items-center justify-end px-2 md:px-8 pb-8 md:pb-16 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black">
        
        {/* THE WOODEN TABLE ENVIRONMENT */}
        <div className="w-full max-w-6xl relative">
           
           {/* Table Top Surface */}
           <div className="absolute -bottom-10 left-0 right-0 h-40 bg-amber-900/40 rounded-[100%] shadow-[inset_0_20px_40px_rgba(0,0,0,0.5)] transform -skew-x-12 -z-10"></div>
           
           {/* The Shifting Grid Container */}
           <div className="w-full h-[60vh] md:h-[65vh] flex items-end justify-between relative z-10 px-2 md:px-8">
             
             {/* Table Edge Line */}
             <div className="absolute bottom-16 left-0 right-0 h-2 bg-amber-900/50 rounded-full blur-[1px]"></div>

             {towers.map((tower, idx) => {
               
               const isDragging = activeDragId === tower.id;
               const expectedValue = idx + 1;
               const isCorrect = tower.value === expectedValue;
               const isHighlighted = finaleStep === expectedValue;

               return (
                 <div 
                   key={tower.id} 
                   className="relative w-[8%] md:w-[7%] flex flex-col items-center justify-end h-full"
                 >
                   {/* Background Guide Silhouette */}
                   <div 
                     className="absolute bottom-16 w-full border-2 border-dashed border-slate-600 rounded-t-xl bg-slate-800/50 -z-10"
                     style={{ height: `${(expectedValue / 10) * 80}%` }}
                   />

                   {/* The Tower */}
                   <div
                      onPointerDown={(e) => handlePointerDown(e, tower, idx)}
                      className={`absolute bottom-16 w-full flex items-end justify-center
                        ${isCorrect ? 'cursor-default pointer-events-none' : 'cursor-grab active:cursor-grabbing hover:brightness-110'}
                        ${isDragging ? 'opacity-30 blur-sm' : 'opacity-100 transition-all duration-300 ease-out'}
                        ${isHighlighted ? 'scale-110 drop-shadow-[0_0_25px_rgba(251,191,36,0.8)] z-30' : 'z-10'}
                      `}
                      style={{ height: `${(tower.value / 10) * 80}%` }}
                   >
                     <CoinStack count={tower.value} />
                   </div>

                   {/* Feedback Display */}
                   <div className={`absolute bottom-0 flex flex-col items-center font-black transition-all duration-500
                     ${isCorrect || isHighlighted || (uiState === 'gameover') ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 -translate-y-4 pointer-events-none'}`}>
                     
                     {/* Green Tick */}
                     {isCorrect && <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 mb-1 drop-shadow-md" />}
                     
                     {/* Number */}
                     <span className={`text-lg md:text-3xl ${isHighlighted ? 'text-amber-400' : 'text-slate-300'}`}>
                       {tower.value}
                     </span>
                   </div>

                 </div>
               )
             })}
           </div>

           {/* Draggable Clone (Follows Finger) */}
           {activeDragId !== null && (() => {
             const draggedTower = towers.find(t => t.id === activeDragId);
             if (!draggedTower) return null;
             return (
                <div
                  className="fixed pointer-events-none z-50 flex items-end justify-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] opacity-100 scale-110"
                  style={{
                    left: `${dragPos.x - dragOffset.x}px`,
                    top: `${dragPos.y - dragOffset.y}px`,
                    width: '8%',
                    height: `${(draggedTower.value / 10) * 60}vh`, 
                    transform: `translate(-50%, -50%)`
                  }}
                >
                  <CoinStack count={draggedTower.value} />
                </div>
             );
           })()}

        </div>
      </div>

      {/* MENU OVERLAY */}
      {uiState === 'menu' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[3rem] p-6 md:p-10 max-w-xl w-full shadow-2xl text-center border-4 border-slate-800">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner shadow-amber-300">
               <Cuboid className="w-10 h-10 md:w-12 md:h-12 text-amber-900" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">Sort the Coins</h2>
            <p className="text-slate-400 font-bold mb-10 italic">Shift the coin stacks left and right to arrange them from 1 to 10!</p>

            <button onClick={startGame} className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-2xl rounded-3xl shadow-xl border-b-8 border-amber-700 transition-transform active:translate-y-2 flex items-center justify-center gap-3">
               <Play className="fill-amber-950" /> START SORTING
            </button>
          </div>
        </div>
      )}

      {/* FINALE OVERLAY */}
      {uiState === 'finale' && (
        <div className="absolute inset-0 z-40 flex items-start justify-center pt-24 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md px-8 py-4 rounded-full border-2 border-emerald-500 shadow-2xl animate-fade-in flex items-center gap-3">
             <Volume2 className="text-emerald-400 w-8 h-8 animate-pulse" />
             <span className="text-2xl font-black text-white">Listen and Watch...</span>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {uiState === 'gameover' && (
        <div className="absolute inset-0 bg-emerald-900/95 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-fade-in">
           <div className="bg-slate-900 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl text-center border-4 border-emerald-800">
              <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
              <h2 className="text-5xl font-black text-white mb-2 tracking-tight">Perfect Sort!</h2>
              <p className="text-emerald-400 font-black uppercase tracking-widest text-sm mb-10">You counted to 10</p>

              <div className="flex gap-4">
                 <button onClick={startGame} className="flex-1 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl border-b-4 border-slate-700 transition-transform active:translate-y-1 hover:text-white">PLAY AGAIN</button>
                 <button onClick={() => onComplete?.()} className="flex-1 py-4 bg-amber-500 text-amber-950 font-black rounded-2xl border-b-4 border-amber-700 transition-transform active:translate-y-1 shadow-lg hover:bg-amber-400">NEXT LESSON</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}