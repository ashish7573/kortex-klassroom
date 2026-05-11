'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCcw, Play } from 'lucide-react';

// --- Types & Interfaces ---
interface Balloon {
  id: number;
  number: number;
  x: number;
  y: number;
  baseY: number;
  radius: number;
  vx: number;
  color: string;
  floatOffset: number;
  isPopped: boolean;
}

interface Arrow {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  opacity: number;
}

const COLORS = [
  '#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93',
  '#FF9F1C', '#2EC4B6', '#E71D36', '#F15BB5', '#00BBF9'
];

export default function SeriationArcher({ lesson, onComplete }: any) {
  // --- React State ---
  const [isStarted, setIsStarted] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [collectedNumbers, setCollectedNumbers] = useState<number[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);

  // --- Refs for Canvas & Game State Engine ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const gameState = useRef({
    balloons: [] as Balloon[],
    arrows: [] as Arrow[],
    particles: [] as Particle[],
    clouds: [] as Cloud[],
    targetNumber: 1, 
    audioCtx: null as AudioContext | null,
    width: 0,
    height: 0,
    time: 0,
    isAiming: false,
    pullStartX: 0,
    pullStartY: 0,
    pointerX: 0,
    pointerY: 0,
  });

  // --- Audio Synthesis Engine (Fixed for SSR) ---
  const initAudio = () => {
    if (typeof window === 'undefined') return;
    if (!gameState.current.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) gameState.current.audioCtx = new AudioCtx();
    }
    if (gameState.current.audioCtx && gameState.current.audioCtx.state === 'suspended') {
      gameState.current.audioCtx.resume();
    }
  };

  const playShootSound = () => {
    const ctx = gameState.current.audioCtx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  };

  const playDing = () => {
    const ctx = gameState.current.audioCtx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const playBuzzer = () => {
    const ctx = gameState.current.audioCtx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime); 
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
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

  // --- Game Logic ---
  const initializeGame = useCallback(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    gameState.current.width = width;
    gameState.current.height = height;
    gameState.current.targetNumber = 1;
    gameState.current.isAiming = false;
    
    setCurrentTarget(1);
    setCollectedNumbers([]);
    setIsGameOver(false);

    const newBalloons: Balloon[] = [];
    const radius = Math.min(width, height) * 0.08; 

    for (let i = 1; i <= 10; i++) {
      const isMovingRight = Math.random() > 0.5;
      newBalloons.push({
        id: i,
        number: i,
        radius: Math.max(30, radius), 
        x: Math.random() * width,
        y: 0, 
        baseY: height * 0.15 + (Math.random() * height * 0.3), 
        vx: (isMovingRight ? 1 : -1) * (0.225 + Math.random() * 0.45), 
        color: COLORS[(i - 1) % COLORS.length],
        floatOffset: Math.random() * Math.PI * 2,
        isPopped: false
      });
    }

    const newClouds: Cloud[] = [];
    for (let i = 0; i < 6; i++) {
      newClouds.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.4),
        scale: 0.5 + Math.random() * 1.5,
        speed: 0.2 + Math.random() * 0.6,
        opacity: 0.2 + Math.random() * 0.3
      });
    }

    gameState.current.balloons = newBalloons;
    gameState.current.arrows = [];
    gameState.current.particles = [];
    gameState.current.clouds = newClouds;
  }, []);

  const createPopParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      gameState.current.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color
      });
    }
  };

  const triggerError = () => {
    playBuzzer();
    setErrorFlash(true);
    setTimeout(() => setErrorFlash(false), 300);
  };

  const handleCorrectHit = useCallback((num: number, x: number, y: number, color: string) => {
    playDing();
    speakNumber(num);
    createPopParticles(x, y, color);
    
    setCollectedNumbers(prev => {
      const next = [...prev, num];
      if (next.length === 10) {
        setIsGameOver(true);
      }
      return next;
    });
    
    setCurrentTarget(prev => {
      const nextNum = prev + 1;
      gameState.current.targetNumber = nextNum; 
      return nextNum;
    });
  }, []);

  const drawArrow = (ctx: CanvasRenderingContext2D, tipX: number, tipY: number, angle: number) => {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0); 
    ctx.lineTo(-80, 0); 
    ctx.strokeStyle = '#D4A373';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, 0); 
    ctx.lineTo(-12, -7);
    ctx.lineTo(-12, 7);
    ctx.fillStyle = '#4A4E69';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-75, 0); ctx.lineTo(-82, -6);
    ctx.moveTo(-68, 0); ctx.lineTo(-75, -6);
    ctx.moveTo(-75, 0); ctx.lineTo(-82, 6);
    ctx.moveTo(-68, 0); ctx.lineTo(-75, 6);
    ctx.strokeStyle = '#F2E9E4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameState.current;
    state.time += 0.05;

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      state.width = displayWidth;
      state.height = displayHeight;
    }

    ctx.clearRect(0, 0, state.width, state.height);

    const drawMountain = (peakX: number, peakY: number, baseWidth: number, color: string) => {
       ctx.fillStyle = color;
       ctx.beginPath();
       ctx.moveTo(peakX - baseWidth/2, state.height);
       ctx.lineTo(peakX, peakY);
       ctx.lineTo(peakX + baseWidth/2, state.height);
       ctx.fill();
    };
    drawMountain(state.width * 0.2, state.height - 350, 800, '#4A4E69');
    drawMountain(state.width * 0.8, state.height - 280, 700, '#3A3E59');
    drawMountain(state.width * 0.5, state.height - 450, 1000, '#22223B');

    state.clouds.forEach(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x > state.width + 100) {
         cloud.x = -100;
         cloud.y = Math.random() * (state.height * 0.4);
      }
      ctx.save();
      ctx.translate(cloud.x, cloud.y);
      ctx.scale(cloud.scale, cloud.scale);
      ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.arc(25, -15, 35, 0, Math.PI * 2);
      ctx.arc(50, 0, 30, 0, Math.PI * 2);
      ctx.arc(25, 10, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    state.balloons.forEach(balloon => {
      if (balloon.isPopped) return;
      balloon.x += balloon.vx;
      balloon.y = balloon.baseY + Math.sin(state.time * 0.6 + balloon.floatOffset) * 15;
      if (balloon.vx > 0 && balloon.x > state.width + balloon.radius) balloon.x = -balloon.radius;
      if (balloon.vx < 0 && balloon.x < -balloon.radius) balloon.x = state.width + balloon.radius;

      ctx.beginPath();
      ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
      ctx.fillStyle = balloon.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(balloon.x - balloon.radius * 0.3, balloon.y - balloon.radius * 0.3, balloon.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(balloon.x, balloon.y + balloon.radius);
      ctx.lineTo(balloon.x - 6, balloon.y + balloon.radius + 8);
      ctx.lineTo(balloon.x + 6, balloon.y + balloon.radius + 8);
      ctx.fillStyle = balloon.color;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(balloon.x, balloon.y + balloon.radius + 8);
      ctx.lineTo(balloon.x, balloon.y + balloon.radius + 25);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'white';
      ctx.font = `bold ${balloon.radius * 0.8}px 'Nunito', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(balloon.number.toString(), balloon.x, balloon.y);
    });

    for (let i = state.arrows.length - 1; i >= 0; i--) {
      const arrow = state.arrows[i];
      if (!arrow.active) continue;
      arrow.x += arrow.vx;
      arrow.vy += 0.15; 
      arrow.y += arrow.vy;
      arrow.angle = Math.atan2(arrow.vy, arrow.vx);
      if (arrow.x < -100 || arrow.x > state.width + 100 || arrow.y > state.height + 100) {
        arrow.active = false;
        continue;
      }
      drawArrow(ctx, arrow.x, arrow.y, arrow.angle);
      state.balloons.forEach(balloon => {
        if (balloon.isPopped || !arrow.active) return;
        const dx = arrow.x - balloon.x;
        const dy = arrow.y - balloon.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < balloon.radius + 5) {
          arrow.active = false; 
          if (balloon.number === state.targetNumber) {
            balloon.isPopped = true;
            handleCorrectHit(balloon.number, balloon.x, balloon.y, balloon.color);
          } else {
            triggerError();
            arrow.active = true;
            arrow.vx = -arrow.vx * 0.3;
            arrow.vy = Math.abs(arrow.vy) * 0.5 + 2; 
          }
        }
      });
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.02;
      if (p.life <= 0) { state.particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    const bowX = state.width / 2;
    const bowY = state.height - 120; 

    ctx.beginPath();
    ctx.moveTo(bowX - 80, bowY + 20);
    ctx.quadraticCurveTo(bowX, bowY - 60, bowX + 80, bowY + 20);
    ctx.strokeStyle = '#7F4F24';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    const bowLeftX = bowX - 80;
    const bowLeftY = bowY + 20;
    const bowRightX = bowX + 80;
    const bowRightY = bowY + 20;

    if (state.isAiming) {
      const dx = state.pullStartX - state.pointerX;
      const dy = state.pullStartY - state.pointerY;
      const pullDist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const speed = Math.min(pullDist * 0.15, 22);
      const visualPullDist = Math.min(pullDist, 70); 
      const pullX = bowX - Math.cos(angle) * visualPullDist;
      const pullY = bowY - Math.sin(angle) * visualPullDist;
      ctx.beginPath();
      ctx.moveTo(bowLeftX, bowLeftY);
      ctx.lineTo(pullX, pullY);
      ctx.lineTo(bowRightX, bowRightY);
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 3;
      ctx.stroke();
      const tipX = pullX + Math.cos(angle) * 80;
      const tipY = pullY + Math.sin(angle) * 80;
      ctx.beginPath();
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      let simX = tipX; let simY = tipY;
      let simVx = Math.cos(angle) * speed; let simVy = Math.sin(angle) * speed;
      ctx.moveTo(simX, simY);
      for (let i = 0; i < 45; i++) { 
          simVy += 0.15; simX += simVx; simY += simVy;
          if (i % 3 === 0) ctx.lineTo(simX, simY); 
      }
      ctx.stroke();
      ctx.setLineDash([]); 
      drawArrow(ctx, tipX, tipY, angle);
    } else {
      ctx.beginPath();
      ctx.moveTo(bowLeftX, bowLeftY);
      ctx.lineTo(bowRightX, bowRightY);
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 3;
      ctx.stroke();
      drawArrow(ctx, bowX, bowY - 60, -Math.PI / 2);
    }
    requestRef.current = requestAnimationFrame(render);
  }, [handleCorrectHit]); 

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    initAudio(); 
    if (!isStarted || isGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvas.setPointerCapture(e.pointerId);
    const state = gameState.current;
    state.isAiming = true;
    state.pullStartX = x; state.pullStartY = y;
    state.pointerX = x; state.pointerY = y;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const state = gameState.current;
    if (!state.isAiming) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    state.pointerX = e.clientX - rect.left;
    state.pointerY = e.clientY - rect.top;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const state = gameState.current;
    if (!state.isAiming) return;
    state.isAiming = false;
    const canvas = canvasRef.current;
    if (canvas) canvas.releasePointerCapture(e.pointerId);
    const dx = state.pullStartX - state.pointerX;
    const dy = state.pullStartY - state.pointerY;
    const pullDist = Math.hypot(dx, dy);
    if (pullDist > 15) {
      const angle = Math.atan2(dy, dx);
      const speed = Math.min(pullDist * 0.15, 22); 
      const bowX = state.width / 2;
      const bowY = state.height - 120; 
      const visualPullDist = Math.min(pullDist, 70); 
      const pullX = bowX - Math.cos(angle) * visualPullDist;
      const pullY = bowY - Math.sin(angle) * visualPullDist;
      const tipX = pullX + Math.cos(angle) * 80;
      const tipY = pullY + Math.sin(angle) * 80;
      playShootSound();
      state.arrows.push({
        id: Date.now(), x: tipX, y: tipY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        angle: angle, active: true
      });
    }
  };

  useEffect(() => {
    if (isStarted) {
      initializeGame();
      requestRef.current = requestAnimationFrame(render);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isStarted, initializeGame, render]);

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-gradient-to-b from-blue-400 to-indigo-900 transition-colors duration-200 ${errorFlash ? 'bg-red-900' : ''}`}>
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex flex-col items-center justify-start pointer-events-none">
        <h1 className="text-white text-xl md:text-3xl font-black tracking-wider mb-2 drop-shadow-md">
          PULL BACK & SHOOT IN ORDER!
        </h1>
        <div className="flex flex-wrap gap-2 md:gap-4 justify-center max-w-4xl">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isCollected = collectedNumbers.includes(num);
            const isCurrentTarget = num === currentTarget;
            return (
              <div 
                key={num}
                className={`
                  w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-3xl font-bold shadow-lg transition-all duration-300
                  ${isCollected ? 'bg-green-400 text-green-900 scale-100 opacity-100' : 
                    isCurrentTarget ? 'bg-yellow-400 text-yellow-900 scale-110 animate-pulse border-4 border-white' : 
                    'bg-white/20 text-white/50 scale-90 border-2 border-white/20'}
                `}
              >
                {num}
              </div>
            );
          })}
        </div>
      </div>

      <canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className="block w-full h-full touch-none cursor-crosshair" style={{ touchAction: 'none' }} />

      {!isStarted && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-[90%] border-8 border-yellow-400">
            <h2 className="text-3xl font-black text-indigo-900 mb-4">Number Archery</h2>
            <p className="text-gray-600 mb-8 font-medium">Tap anywhere, <span className="font-bold text-indigo-600">drag backwards</span> to aim, and release to shoot! Pop the balloons in order from 1 to 10.</p>
            <button onClick={() => setIsStarted(true)} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-xl transition-transform active:scale-95 flex items-center justify-center gap-2">
              <Play fill="white" /> Start Playing
            </button>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-[90%] border-8 border-green-400 animate-in zoom-in duration-500 delay-150">
            <h2 className="text-4xl font-black text-green-600 mb-2">You Did It!</h2>
            <p className="text-gray-600 mb-8 font-bold">You counted all the way to 10!</p>
            <button onClick={() => { initializeGame(); setIsStarted(false); }} className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl text-xl transition-transform active:scale-95 flex items-center justify-center gap-2">
              <RefreshCcw /> Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}