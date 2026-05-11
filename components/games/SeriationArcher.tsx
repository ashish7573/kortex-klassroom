"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Target, Heart, MousePointer2, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';

// ==========================================
// 🛠️ ARCHITECTURAL CONSTANTS
// ==========================================
const SMARTBOARD_BOW_OFFSET = 280; 
const MOBILE_BOW_OFFSET = 160;     
const TARGET_COUNT = 10;

const PLAYER_COLORS = [
  { main: '#ef4444', light: '#fca5a5', name: 'Red' },    
  { main: '#3b82f6', light: '#93c5fd', name: 'Blue' },   
  { main: '#10b981', light: '#6ee7b7', name: 'Green' },  
  { main: '#f59e0b', light: '#fcd34d', name: 'Yellow' }  
];

export default function SeriationArcher({ lesson, onComplete }: any) {
  // --- DOM UI STATE ---
  const [uiState, setUiState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [currentTarget, setCurrentTarget] = useState(1);
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [settings, setSettings] = useState({ playerCount: 1 });
  const [errorFlash, setErrorFlash] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // --- CORE GAME ENGINE ---
  const gameRef = useRef({
    state: 'menu',
    width: 0,
    height: 0,
    balloons: [] as any[],
    particles: [] as any[],
    clouds: [] as any[],
    players: [] as any[],
    activeTouches: {} as Record<number, number>,
    targetNum: 1,
    time: 0
  });

  // --- AUDIO & SPEECH ---
  const speakNumber = (num: number) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(num.toString());
      utterance.lang = 'en-IN';
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- MATH ENGINE: BALLOON GENERATOR ---
  const spawnBalloons = () => {
    const isMobile = window.innerWidth < 768;
    const radius = isMobile ? 35 : 50;
    const width = gameRef.current.width;
    const height = gameRef.current.height;
    const bowOffset = isMobile ? MOBILE_BOW_OFFSET : SMARTBOARD_BOW_OFFSET;

    const balloons = [];
    for (let i = 1; i <= TARGET_COUNT; i++) {
      balloons.push({
        id: i,
        number: i,
        x: Math.random() * (width - radius * 2) + radius,
        y: 0, 
        baseY: height * 0.15 + (Math.random() * (height * 0.4)),
        radius: radius,
        vx: (Math.random() - 0.5) * (isMobile ? 1.5 : 2.5),
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        floatOffset: Math.random() * Math.PI * 2,
        isPopped: false
      });
    }
    gameRef.current.balloons = balloons;
  };

  // --- GAME LIFECYCLE ---
  const startGame = () => {
    const isMobile = window.innerWidth < 768;
    const sectionWidth = window.innerWidth / settings.playerCount;
    
    gameRef.current.targetNum = 1;
    gameRef.current.players = Array.from({ length: settings.playerCount }).map((_, i) => ({
      id: i,
      color: PLAYER_COLORS[i],
      score: 0,
      bowX: (sectionWidth * i) + (sectionWidth / 2),
      bowY: window.innerHeight - (isMobile ? MOBILE_BOW_OFFSET : SMARTBOARD_BOW_OFFSET),
      interaction: { isDown: false, startX: 0, startY: 0, currentX: 0, currentY: 0 },
      arrow: { state: 'idle', x: 0, y: 0, vx: 0, vy: 0, angle: 0 }
    }));

    setCurrentTarget(1);
    spawnBalloons();
    setPlayerStats([...gameRef.current.players]);
    setUiState('playing');
    gameRef.current.state = 'playing';
  };

  const createPopParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      gameRef.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color: color
      });
    }
  };

  // --- RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameRef.current.width = canvas.width;
      gameRef.current.height = canvas.height;
    };
    window.addEventListener('resize', resize);
    resize();

    const drawArrow = (pCtx: any, tipX: number, tipY: number, angle: number, color: string) => {
      pCtx.save();
      pCtx.translate(tipX, tipY);
      pCtx.rotate(angle);
      // Shaft
      pCtx.beginPath();
      pCtx.moveTo(0, 0); pCtx.lineTo(-60, 0);
      pCtx.strokeStyle = '#94a3b8'; pCtx.lineWidth = 4; pCtx.lineCap = 'round';
      pCtx.stroke();
      // Rounded back (Nock)
      pCtx.beginPath();
      pCtx.arc(-60, 0, 4, 0, Math.PI * 2);
      pCtx.fillStyle = color; pCtx.fill();
      // Tip
      pCtx.fillStyle = '#475569';
      pCtx.beginPath();
      pCtx.moveTo(0, 0); pCtx.lineTo(-12, -6); pCtx.lineTo(-12, 6);
      pCtx.fill();
      pCtx.restore();
    };

    const update = () => {
      if (gameRef.current.state !== 'playing') return;
      const { width, height, balloons, players, particles } = gameRef.current;
      gameRef.current.time += 0.05;

      ctx.fillStyle = '#f0f9ff'; // sky-50
      ctx.fillRect(0, 0, width, height);

      // Balloons
      balloons.forEach(b => {
        if (b.isPopped) return;
        b.x += b.vx;
        b.y = b.baseY + Math.sin(gameRef.current.time * 0.8 + b.floatOffset) * 20;
        if (b.x > width + b.radius) b.x = -b.radius;
        if (b.x < -b.radius) b.x = width + b.radius;

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color; ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${b.radius * 0.8}px Nunito`;
        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'middle';
        ctx.fillText(b.number.toString(), b.x, b.y + (b.radius * 0.1));
      });

      // Players & Arrows
      players.forEach(p => {
        const { interaction, arrow } = p;
        if (interaction.isDown && arrow.state !== 'flying') {
          const dx = interaction.startX - interaction.currentX;
          const dy = interaction.startY - interaction.currentY;
          const dist = Math.hypot(dx, dy);
          if (dist > 5) {
            arrow.state = 'nocked';
            arrow.angle = Math.atan2(dy, dx);
            const charge = Math.min(dist * 0.4, 50);
            const pullX = p.bowX - Math.cos(arrow.angle) * charge;
            const pullY = p.bowY - Math.sin(arrow.angle) * charge;
            drawArrow(ctx, pullX + Math.cos(arrow.angle) * 60, pullY + Math.sin(arrow.angle) * 60, arrow.angle, p.color.main);
          }
        }

        if (arrow.state === 'flying') {
          arrow.x += arrow.vx; arrow.vy += 0.2; arrow.y += arrow.vy;
          arrow.angle = Math.atan2(arrow.vy, arrow.vx);
          drawArrow(ctx, arrow.x, arrow.y, arrow.angle, p.color.main);

          // Collision
          balloons.forEach(b => {
            if (b.isPopped) return;
            const dist = Math.hypot(arrow.x - b.x, arrow.y - b.y);
            if (dist < b.radius + 10) {
              if (b.number === gameRef.current.targetNum) {
                b.isPopped = true;
                createPopParticles(b.x, b.y, b.color);
                speakNumber(b.number);
                p.score += 10;
                gameRef.current.targetNum++;
                setCurrentTarget(gameRef.current.targetNum);
                arrow.state = 'idle';
                setPlayerStats([...gameRef.current.players]);
                if (gameRef.current.targetNum > TARGET_COUNT) {
                  setUiState('gameover');
                  gameRef.current.state = 'gameover';
                }
              } else {
                setErrorFlash(true); setTimeout(() => setErrorFlash(false), 200);
                arrow.vx *= -0.3; arrow.vy = 5;
              }
            }
          });

          if (arrow.y > height || arrow.x < 0 || arrow.x > width) arrow.state = 'idle';
        }

        // Static Bow
        ctx.beginPath();
        ctx.arc(p.bowX, p.bowY, 40, 0, Math.PI * 2);
        ctx.strokeStyle = p.color.main; ctx.lineWidth = 2; ctx.setLineDash([5,5]);
        ctx.stroke(); ctx.setLineDash([]);
      });

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
        else {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationRef.current);
  }, [settings.playerCount]);

  // --- INPUT HANDLERS ---
  const handlePointerDown = (e: any) => {
    if (uiState !== 'playing') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const sectionWidth = window.innerWidth / settings.playerCount;
    const pIdx = Math.min(Math.floor(x / sectionWidth), settings.playerCount - 1);
    const player = gameRef.current.players[pIdx];

    if (player && player.arrow.state !== 'flying') {
      gameRef.current.activeTouches[e.pointerId] = pIdx;
      player.interaction = { isDown: true, startX: x, startY: y, currentX: x, currentY: y };
    }
  };

  const handlePointerMove = (e: any) => {
    const pIdx = gameRef.current.activeTouches[e.pointerId];
    const player = gameRef.current.players[pIdx];
    if (player && player.interaction.isDown) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      player.interaction.currentX = e.clientX - rect.left;
      player.interaction.currentY = e.clientY - rect.top;
    }
  };

  const handlePointerUp = (e: any) => {
    const pIdx = gameRef.current.activeTouches[e.pointerId];
    const player = gameRef.current.players[pIdx];
    if (player && player.interaction.isDown) {
      const dx = player.interaction.startX - player.interaction.currentX;
      const dy = player.interaction.startY - player.interaction.currentY;
      const dist = Math.hypot(dx, dy);
      
      if (dist > 15) {
        const angle = Math.atan2(dy, dx);
        const speed = Math.min(dist * 0.6, 28);
        player.arrow = {
          state: 'flying',
          x: player.bowX,
          y: player.bowY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          angle: angle
        };
      }
      player.interaction.isDown = false;
      delete gameRef.current.activeTouches[e.pointerId];
    }
  };

  return (
    <div className={`relative w-full h-[100dvh] overflow-hidden select-none font-sans touch-none bg-sky-50 ${errorFlash ? 'bg-red-200' : ''}`}>
      
      {/* KORTEX HEADER */}
      <div className="absolute top-0 inset-x-0 h-20 bg-white/80 backdrop-blur-md border-b-4 border-sky-100 flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-4">
          <div className="bg-sky-500 p-2 rounded-2xl shadow-lg shadow-sky-200">
            <Target className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sky-900 font-black text-lg leading-tight uppercase tracking-tight">Number Archery</h1>
            <p className="text-sky-500 text-xs font-bold uppercase tracking-widest">Collaborative Mission</p>
          </div>
        </div>

        {/* PROGRESS HUD */}
        <div className="hidden md:flex gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all border-b-4 ${
                i + 1 < currentTarget ? 'bg-emerald-500 border-emerald-700 text-white' : 
                i + 1 === currentTarget ? 'bg-amber-400 border-amber-600 text-amber-900 animate-bounce' : 
                'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <button onClick={() => setUiState('menu')} className="bg-slate-100 hover:bg-slate-200 p-3 rounded-2xl border-b-4 border-slate-300 transition-all active:translate-y-1">
          <RotateCcw className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      <canvas 
        ref={canvasRef} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="block w-full h-full cursor-crosshair"
      />

      {/* COLLAB SCOREBAR (Bottom) */}
      {uiState === 'playing' && (
        <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4 px-4 z-20 pointer-events-none">
          {playerStats.map((p, i) => (
            <div key={i} className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl border-b-4 shadow-xl flex items-center gap-3" style={{ borderColor: p.color.main }}>
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: p.color.main }} />
              <span className="font-black text-slate-700">{p.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* START MENU */}
      {uiState === 'menu' && (
        <div className="absolute inset-0 bg-sky-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-8 max-w-lg w-full border-8 border-white/50 shadow-2xl text-center">
             <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-sky-500" />
             </div>
             <h2 className="text-4xl font-black text-slate-800 mb-2">Team Up!</h2>
             <p className="text-slate-500 font-bold mb-8 italic text-sm">Collaborate with your classmates to shoot balloons 1 to 10 in order!</p>
             
             <div className="grid grid-cols-2 gap-4 mb-8">
                {[1, 2, 3, 4].map(n => (
                  <button 
                    key={n}
                    onClick={() => setSettings({ playerCount: n })}
                    className={`p-4 rounded-3xl border-b-8 font-black text-2xl transition-all ${
                      settings.playerCount === n ? 'bg-sky-500 border-sky-700 text-white scale-105 shadow-xl' : 'bg-slate-100 border-slate-300 text-slate-500'
                    }`}
                  >
                    {n} {n === 1 ? 'Hero' : 'Heroes'}
                  </button>
                ))}
             </div>

             <button onClick={startGame} className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-2xl rounded-3xl shadow-xl shadow-emerald-200 border-b-8 border-emerald-700 transition-all active:translate-y-2">
                LAUNCH MISSION
             </button>
          </div>
        </div>
      )}

      {/* GAME OVER MISSION SUCCESS */}
      {uiState === 'gameover' && (
        <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] p-10 max-w-xl w-full border-8 border-white/50 shadow-2xl text-center">
              <div className="relative mb-6">
                <Trophy className="w-24 h-24 text-amber-500 mx-auto" />
                <CheckCircle2 className="w-10 h-10 text-emerald-500 absolute bottom-0 right-1/3 bg-white rounded-full" />
              </div>
              <h2 className="text-5xl font-black text-slate-800 mb-2 tracking-tight">Mission Success!</h2>
              <p className="text-emerald-600 font-black uppercase tracking-widest text-sm mb-8">Numbers 1-10 Mastered</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                 {playerStats.map((p, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-3xl border-l-8" style={{ borderLeftColor: p.color.main }}>
                       <p className="text-[10px] font-black uppercase text-slate-400">{p.color.name}</p>
                       <p className="text-2xl font-black text-slate-700">{p.score} pts</p>
                    </div>
                 ))}
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setUiState('menu')} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl border-b-4 border-slate-300 hover:bg-slate-200 transition-all">
                    RESTART
                 </button>
                 <button onClick={() => onComplete?.(playerStats)} className="flex-1 py-4 bg-sky-500 text-white font-black rounded-2xl border-b-4 border-sky-700 hover:bg-sky-600 transition-all shadow-lg shadow-sky-200">
                    NEXT LESSON
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}