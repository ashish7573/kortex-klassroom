'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Cuboid, CheckCircle2, Volume2 } from 'lucide-react';

// --- Types ---
interface Tower {
  id: number;
  value: number; // 1 to 10
  isPlaced: boolean;
  xOffset: number; // Messy tray position
  yOffset: number;
  rot: number;
}

export default function CoinTowers({ lesson, onComplete }: any) {
  const [uiState, setUiState] = useState<'menu' | 'playing' | 'finale' | 'gameover'>('menu');
  const [towers, setTowers] = useState<Tower[]>([]);
  const [finaleStep, setFinaleStep] = useState(0);

  // Drag State
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Refs for audio and collision detection
  const audioCtx = useRef<AudioContext | null>(null);
  const pedestalRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // --- Audio Synthesis ---
  const initAudio = () => {
    if (typeof window !== 'undefined' && !audioCtx.current) {
      const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (WinAudioContext) audioCtx.current = new WinAudioContext();
    }
  };

  const playSound = (type: 'grab' | 'lock' | 'error' | 'success') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'grab') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
    } else if (type === 'lock') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
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
    osc.stop(ctx.currentTime + (type === 'success' ? 0.5 : 0.2));
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
  const generateTowers = (): Tower[] => {
    const newTowers: Tower[] = [];
    // We scatter them in the bottom 40% of the screen (the "Tray")
    for (let i = 1; i <= 10; i++) {
      newTowers.push({
        id: i,
        value: i,
        isPlaced: false,
        xOffset: Math.floor(Math.random() * 80) + 10, // 10% to 90% wide
        yOffset: Math.floor(Math.random() * 30) + 60, // 60% to 90% down
        rot: Math.floor(Math.random() * 30) - 15,
      });
    }
    return newTowers.sort(() => Math.random() - 0.5);
  };

  const startGame = () => {
    initAudio();
    setTowers(generateTowers());
    setFinaleStep(0);
    setUiState('playing');
  };

  // --- Drag & Drop Physics Engine ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, tower: Tower) => {
    if (uiState !== 'playing' || tower.isPlaced) return;
    
    initAudio();
    playSound('grab');
    
    // Calculate the offset between the finger and the center of the tower
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setDragOffset({ x: e.clientX - centerX, y: e.clientY - centerY });
    setDragPos({ x: e.clientX, y: e.clientY });
    setActiveDragId(tower.id);
    
    // Capture pointer to the main container so fast swipes don't break tracking
    if (containerRef.current) containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragId === null) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragId === null) return;
    if (containerRef.current) containerRef.current.releasePointerCapture(e.pointerId);

    const draggedTower = towers.find(t => t.id === activeDragId);
    if (!draggedTower) return;

    // Collision Detection: Check if finger is inside any pedestal's bounding box
    let droppedOnValue: number | null = null;
    
    pedestalRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const expectedValue = index + 1; // Pedestals are 1 to 10
      
      // Expand hitbox slightly to make it kid-friendly
      const padding = 20; 
      if (
        e.clientX >= rect.left - padding &&
        e.clientX <= rect.right + padding &&
        e.clientY >= rect.top - padding &&
        e.clientY <= rect.bottom + padding
      ) {
        droppedOnValue = expectedValue;
      }
    });

    if (droppedOnValue === draggedTower.value) {
      // SUCCESS: Snap and Lock
      playSound('lock');
      speakNumber(draggedTower.value);
      
      const newTowers = towers.map(t => 
        t.id === activeDragId ? { ...t, isPlaced: true } : t
      );
      setTowers(newTowers);

      // Check for Game Completion
      if (newTowers.every(t => t.isPlaced)) {
        setTimeout(() => startFinale(), 1000);
      }
    } else if (droppedOnValue !== null) {
      // ERROR: Wrong pedestal
      playSound('error');
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
    }, 1200); // 1.2 seconds between each number
  };

  // --- Dynamic Coin Render ---
  // Renders a stack of chunky 3D coins
  const CoinStack = ({ count }: { count: number }) => (
    <div className="flex flex-col-reverse items-center justify-end w-full h-full pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="w-full aspect-[3/1] bg-amber-400 border-2 md:border-[3px] border-amber-600 rounded-full shadow-sm -mt-[10%] md:-mt-[15%]"
          style={{ 
            zIndex: count - i,
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.1) 100%)' 
          }} 
        />
      ))}
    </div>
  );

  return (
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full overflow-hidden bg-slate-50 font-sans touch-none select-none flex flex-col"
    >
      
      {/* HEADER */}
      <div className="h-16 md:h-20 bg-white border-b-4 border-slate-200 flex items-center justify-between px-4 md:px-8 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-2xl">
            <Cuboid className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-sm md:text-xl uppercase leading-none">Coin Staircase</h1>
            <p className="text-emerald-600 text-[10px] md:text-xs font-bold uppercase tracking-widest">Build 1 to 10</p>
          </div>
        </div>

        {uiState !== 'menu' && (
          <button onClick={() => setUiState('menu')} className="bg-slate-100 text-slate-600 p-2 md:px-4 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95 border-b-4 border-slate-300">
             <RotateCcw className="w-4 h-4" /> <span className="hidden md:inline">Restart</span>
          </button>
        )}
      </div>

      {/* PLAY AREA */}
      <div className="flex-1 relative flex flex-col">
        
        {/* TARGET ZONE (Top Half) */}
        <div className="h-[45%] w-full bg-white border-b-4 border-slate-200 flex items-end justify-center px-2 pb-4 shadow-sm z-10 relative">
           {/* Ground Line */}
           <div className="absolute bottom-4 left-4 right-4 h-2 bg-slate-200 rounded-full"></div>
           
           {/* 10 Pedestals */}
           <div className="flex justify-between items-end w-full max-w-5xl h-full relative z-10 px-4 md:px-8">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num, idx) => {
               const placedTower = towers.find(t => t.value === num && t.isPlaced);
               const isHighlighted = finaleStep === num;

               return (
                 <div 
                   key={num} 
                   ref={el => { pedestalRefs.current[idx] = el; }} // Capture bounds for D&D
                   className="relative w-[8%] md:w-[7%] flex flex-col items-center justify-end"
                   // Max height matches the tallest possible tower (10 coins)
                   style={{ height: '85%' }} 
                 >
                   {/* Pedestal Base Marker */}
                   <div className="absolute -bottom-2 w-1/2 h-2 bg-slate-300 rounded-full"></div>
                   
                   {/* Placed Tower Rendering */}
                   {placedTower ? (
                     <div className={`w-full transition-all duration-300 origin-bottom 
                       ${isHighlighted ? 'scale-110 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] z-20' : 'scale-100 z-10'}`}
                       style={{ height: `${(num / 10) * 100}%` }}
                     >
                       <CoinStack count={num} />
                     </div>
                   ) : (
                     /* Silhouette/Hint */
                     <div 
                       className="w-[80%] border-2 border-dashed border-slate-300 rounded-t-xl bg-slate-50/50"
                       style={{ height: `${(num / 10) * 100}%` }}
                     />
                   )}

                   {/* Number Label (Appears during finale) */}
                   <div className={`absolute -bottom-10 font-black transition-all duration-500
                     ${isHighlighted || (uiState === 'gameover') ? 'opacity-100 text-emerald-500 scale-125 md:text-2xl' : 'opacity-0 text-slate-400'}`}>
                     {num}
                   </div>
                 </div>
               )
             })}
           </div>
        </div>

        {/* MESSY TRAY (Bottom Half) */}
        <div className="flex-1 w-full bg-slate-50 relative overflow-hidden">
          {/* Subtle instruction background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
             <Cuboid className="w-64 h-64" />
          </div>

          {towers.map(tower => {
             // Hide if placed or being dragged
             if (tower.isPlaced) return null;
             
             const isDragging = activeDragId === tower.id;

             return (
               <div
                 key={tower.id}
                 onPointerDown={(e) => handlePointerDown(e, tower)}
                 // Base style for sitting in the tray
                 className={`absolute cursor-grab active:cursor-grabbing w-[10%] md:w-[6%] max-w-[60px] min-w-[30px] flex items-end justify-center pb-2
                   ${isDragging ? 'z-50' : 'z-10 hover:z-20 transition-transform duration-300'}`}
                 style={
                   isDragging ? {
                     // During drag, map directly to the finger coordinates (fixed to viewport minus offset)
                     position: 'fixed',
                     left: `${dragPos.x - dragOffset.x}px`,
                     top: `${dragPos.y - dragOffset.y}px`,
                     transform: `translate(-50%, -50%) scale(1.1)`,
                     height: `${(tower.value / 10) * 30}vh` // Scale height appropriately for dragging
                   } : {
                     // Sitting in tray
                     left: `${tower.xOffset}%`,
                     top: `${tower.yOffset}%`,
                     transform: `translate(-50%, -50%) rotate(${tower.rot}deg)`,
                     height: `${(tower.value / 10) * 30}vh`
                   }
                 }
               >
                 <CoinStack count={tower.value} />
               </div>
             )
          })}
        </div>

      </div>

      {/* MENU OVERLAY */}
      {uiState === 'menu' && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-6 md:p-10 max-w-xl w-full shadow-2xl text-center border-8 border-white/20">
            <div className="w-20 h-20 md:w-24 md:h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <Cuboid className="w-10 h-10 md:w-12 md:h-12 text-emerald-500" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">Build the Stairs</h2>
            <p className="text-slate-500 font-bold mb-10 italic">Drag the coin towers to the empty slots. Arrange them from shortest to tallest!</p>

            <button onClick={startGame} className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-2xl rounded-3xl shadow-xl border-b-8 border-emerald-700 transition-transform active:translate-y-2 flex items-center justify-center gap-3">
               <Play className="fill-white" /> START BUILDING
            </button>
          </div>
        </div>
      )}

      {/* FINALE OVERLAY (Transparent to let them see the animation) */}
      {uiState === 'finale' && (
        <div className="absolute inset-0 z-40 flex items-start justify-center pt-20 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-full border-4 border-emerald-400 shadow-2xl animate-fade-in flex items-center gap-3">
             <Volume2 className="text-emerald-500 w-8 h-8 animate-pulse" />
             <span className="text-2xl font-black text-slate-800">Listen and Watch...</span>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {uiState === 'gameover' && (
        <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-fade-in">
           <div className="bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-2xl text-center border-8 border-white/20">
              <Trophy className="w-24 h-24 text-amber-500 mx-auto mb-6" />
              <h2 className="text-5xl font-black text-slate-800 mb-2 tracking-tight">Perfect Stairs!</h2>
              <p className="text-emerald-600 font-black uppercase tracking-widest text-sm mb-10">You counted to 10</p>

              <div className="flex gap-4">
                 <button onClick={startGame} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl border-b-4 border-slate-300 transition-transform active:translate-y-1">REBUILD</button>
                 <button onClick={() => onComplete?.()} className="flex-1 py-4 bg-emerald-500 text-white font-black rounded-2xl border-b-4 border-emerald-700 transition-transform active:translate-y-1 shadow-lg">NEXT LESSON</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}