'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, ArrowRight, Trophy, Star, Target, Check, Sparkles } from 'lucide-react';

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

const BALLOON_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1'
];

interface SeriationArcherProps {
  lesson?: any;
  onComplete?: (results?: { score: number; total: number }) => void;
}

export default function SeriationArcher({ lesson, onComplete }: SeriationArcherProps) {
  // --- React State ---
  const [isStarted, setIsStarted] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [collectedNumbers, setCollectedNumbers] = useState<number[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // --- Refs ---
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);

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
    scale: 1,
  });

  // --- Audio Synthesis Engine ---
  const initAudio = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      if (!gameState.current.audioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) gameState.current.audioCtx = new AudioCtx();
      }
      if (gameState.current.audioCtx && gameState.current.audioCtx.state === 'suspended') {
        gameState.current.audioCtx.resume();
      }
    } catch {
      // AudioContext policy fallback
    }
  }, []);

  const playShootSound = () => {
    const ctx = gameState.current.audioCtx;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.16);
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {}
  };

  const playDing = () => {
    const ctx = gameState.current.audioCtx;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  const playBuzzer = () => {
    const ctx = gameState.current.audioCtx;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.25);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  const playVictoryFanfare = () => {
    const ctx = gameState.current.audioCtx;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
      });
    } catch {}
  };

  const speakNumber = (num: number) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(num.toString());
        utterance.rate = 0.95;
        utterance.pitch = 1.15;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  // --- Clean AudioContext on Unmount ---
  useEffect(() => {
    return () => {
      if (gameState.current.audioCtx && gameState.current.audioCtx.state !== 'closed') {
        try {
          gameState.current.audioCtx.close();
        } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, []);

  // --- Game Logic ---
  const initializeGame = useCallback(() => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const width = container ? container.clientWidth : (canvas ? canvas.clientWidth : window.innerWidth);
    const height = container ? container.clientHeight : (canvas ? canvas.clientHeight : window.innerHeight);

    gameState.current.width = width;
    gameState.current.height = height;

    const scaleFactor = Math.max(0.5, Math.min(width, height) / 600);
    gameState.current.scale = scaleFactor;

    gameState.current.targetNumber = 1;
    gameState.current.isAiming = false;

    setCurrentTarget(1);
    setCollectedNumbers([]);
    setIsGameOver(false);
    setHintMessage(null);

    const newBalloons: Balloon[] = [];
    const radius = Math.min(width, height) * 0.075;

    for (let i = 1; i <= 10; i++) {
      const isMovingRight = Math.random() > 0.5;
      newBalloons.push({
        id: i,
        number: i,
        radius: Math.max(26 * scaleFactor, Math.min(radius, 44 * scaleFactor)),
        x: Math.random() * (width - 100) + 50,
        y: 0,
        baseY: height * 0.18 + (Math.random() * height * 0.28),
        vx: (isMovingRight ? 1 : -1) * (0.4 + Math.random() * 0.7) * scaleFactor,
        color: BALLOON_COLORS[(i - 1) % BALLOON_COLORS.length],
        floatOffset: Math.random() * Math.PI * 2,
        isPopped: false
      });
    }

    const newClouds: Cloud[] = [];
    for (let i = 0; i < 6; i++) {
      newClouds.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.35),
        scale: (0.5 + Math.random() * 1.4) * scaleFactor,
        speed: (0.15 + Math.random() * 0.5) * scaleFactor,
        opacity: 0.2 + Math.random() * 0.35
      });
    }

    gameState.current.balloons = newBalloons;
    gameState.current.arrows = [];
    gameState.current.particles = [];
    gameState.current.clouds = newClouds;
  }, []);

  const createPopParticles = (x: number, y: number, color: string, scale: number) => {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 6 + 2) * scale;
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

  const triggerError = (shotNumber: number) => {
    playBuzzer();
    setErrorFlash(true);
    setHintMessage(`Shoot ${gameState.current.targetNumber} next!`);
    setTimeout(() => setErrorFlash(false), 300);
    setTimeout(() => setHintMessage(null), 1800);
  };

  const handleCorrectHit = useCallback((num: number, x: number, y: number, color: string, scale: number) => {
    playDing();
    speakNumber(num);
    createPopParticles(x, y, color, scale);

    setCollectedNumbers(prev => [...prev, num]);

    if (num === 10) {
      playVictoryFanfare();
      setIsGameOver(true);
    } else {
      setCurrentTarget(prev => {
        const nextNum = prev + 1;
        gameState.current.targetNumber = nextNum;
        return nextNum;
      });
    }
  }, []);

  const drawArrow = (ctx: CanvasRenderingContext2D, tipX: number, tipY: number, angle: number, scale: number = 1) => {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Arrow Shaft
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-75, 0);
    ctx.strokeStyle = '#D4A373';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Arrow Head
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(-12, -7);
    ctx.lineTo(-12, 7);
    ctx.fillStyle = '#4A4E69';
    ctx.fill();

    // Arrow Fletching
    ctx.beginPath();
    ctx.moveTo(-70, 0); ctx.lineTo(-78, -6);
    ctx.moveTo(-64, 0); ctx.lineTo(-72, -6);
    ctx.moveTo(-70, 0); ctx.lineTo(-78, 6);
    ctx.moveTo(-64, 0); ctx.lineTo(-72, 6);
    ctx.strokeStyle = '#F2E9E4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  };

  // --- Canvas Render Loop ---
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
      state.scale = Math.max(0.5, Math.min(displayWidth, displayHeight) / 600);
    }

    ctx.clearRect(0, 0, state.width, state.height);
    const scale = state.scale || 1;

    // Draw Background Mountains
    const drawMountain = (peakX: number, peakY: number, baseWidth: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(peakX - (baseWidth / 2 * scale), state.height);
      ctx.lineTo(peakX, peakY);
      ctx.lineTo(peakX + (baseWidth / 2 * scale), state.height);
      ctx.fill();
    };
    drawMountain(state.width * 0.2, state.height - (320 * scale), 800, 'rgba(74, 78, 105, 0.45)');
    drawMountain(state.width * 0.8, state.height - (260 * scale), 700, 'rgba(58, 62, 89, 0.45)');
    drawMountain(state.width * 0.5, state.height - (400 * scale), 1000, 'rgba(34, 34, 59, 0.6)');

    // Draw Clouds
    state.clouds.forEach(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x > state.width + 100) {
        cloud.x = -100;
        cloud.y = Math.random() * (state.height * 0.35);
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

    // Draw Balloons
    state.balloons.forEach(balloon => {
      if (balloon.isPopped) return;
      balloon.x += balloon.vx;
      balloon.y = balloon.baseY + Math.sin(state.time * 0.6 + balloon.floatOffset) * (14 * scale);

      if (balloon.vx > 0 && balloon.x > state.width + balloon.radius) balloon.x = -balloon.radius;
      if (balloon.vx < 0 && balloon.x < -balloon.radius) balloon.x = state.width + balloon.radius;

      const isCurrentTargetBalloon = balloon.number === state.targetNumber;

      // Glow outline for current target
      if (isCurrentTargetBalloon) {
        ctx.beginPath();
        ctx.arc(balloon.x, balloon.y, balloon.radius + (6 * scale), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.fill();
      }

      // Balloon Body
      ctx.beginPath();
      ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
      ctx.fillStyle = balloon.color;
      ctx.fill();

      // Highlight sheen
      ctx.beginPath();
      ctx.arc(balloon.x - balloon.radius * 0.3, balloon.y - balloon.radius * 0.3, balloon.radius * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fill();

      // Knot
      ctx.beginPath();
      ctx.moveTo(balloon.x, balloon.y + balloon.radius);
      ctx.lineTo(balloon.x - (6 * scale), balloon.y + balloon.radius + (8 * scale));
      ctx.lineTo(balloon.x + (6 * scale), balloon.y + balloon.radius + (8 * scale));
      ctx.fillStyle = balloon.color;
      ctx.fill();

      // String
      ctx.beginPath();
      ctx.moveTo(balloon.x, balloon.y + balloon.radius + (8 * scale));
      ctx.lineTo(balloon.x, balloon.y + balloon.radius + (24 * scale));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.8 * scale;
      ctx.stroke();

      // Number Label
      ctx.fillStyle = 'white';
      ctx.font = `900 ${balloon.radius * 0.82}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(balloon.number.toString(), balloon.x, balloon.y);
    });

    // Draw & Update Arrows
    for (let i = state.arrows.length - 1; i >= 0; i--) {
      const arrow = state.arrows[i];
      if (!arrow.active) continue;
      arrow.x += arrow.vx;
      arrow.vy += 0.15 * scale;
      arrow.y += arrow.vy;
      arrow.angle = Math.atan2(arrow.vy, arrow.vx);

      if (arrow.x < -100 || arrow.x > state.width + 100 || arrow.y > state.height + 100) {
        arrow.active = false;
        continue;
      }

      drawArrow(ctx, arrow.x, arrow.y, arrow.angle, scale);

      state.balloons.forEach(balloon => {
        if (balloon.isPopped || !arrow.active) return;
        const dx = arrow.x - balloon.x;
        const dy = arrow.y - balloon.y;
        const dist = Math.hypot(dx, dy);

        if (dist < balloon.radius + (6 * scale)) {
          arrow.active = false;
          if (balloon.number === state.targetNumber) {
            balloon.isPopped = true;
            handleCorrectHit(balloon.number, balloon.x, balloon.y, balloon.color, scale);
          } else {
            triggerError(balloon.number);
            arrow.active = true;
            arrow.vx = -arrow.vx * 0.3;
            arrow.vy = Math.abs(arrow.vy) * 0.5 + (2 * scale);
          }
        }
      });
    }

    // Draw Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2 * scale;
      p.life -= 0.02;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Bow Placement: clamped to remain clearly visible at the bottom
    const bowX = state.width / 2;
    const bowY = Math.max(state.height * 0.65, state.height - Math.min(120 * scale, state.height * 0.22));

    // Bow Limbs
    const bowSpan = 75 * scale;
    ctx.beginPath();
    ctx.moveTo(bowX - bowSpan, bowY + (18 * scale));
    ctx.quadraticCurveTo(bowX, bowY - (55 * scale), bowX + bowSpan, bowY + (18 * scale));
    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 9 * scale;
    ctx.lineCap = 'round';
    ctx.stroke();

    const bowLeftX = bowX - bowSpan;
    const bowLeftY = bowY + (18 * scale);
    const bowRightX = bowX + bowSpan;
    const bowRightY = bowY + (18 * scale);

    if (state.isAiming) {
      const dx = state.pullStartX - state.pointerX;
      const dy = state.pullStartY - state.pointerY;
      const pullDist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const normalizedPull = pullDist / scale;
      const speed = Math.min(normalizedPull * 0.16, 22) * scale;
      const visualPullDist = Math.min(pullDist, 65 * scale);
      const pullX = bowX - Math.cos(angle) * visualPullDist;
      const pullY = bowY - Math.sin(angle) * visualPullDist;

      // Bowstring stretched
      ctx.beginPath();
      ctx.moveTo(bowLeftX, bowLeftY);
      ctx.lineTo(pullX, pullY);
      ctx.lineTo(bowRightX, bowRightY);
      ctx.strokeStyle = '#F3F4F6';
      ctx.lineWidth = 3 * scale;
      ctx.stroke();

      const tipX = pullX + Math.cos(angle) * (75 * scale);
      const tipY = pullY + Math.sin(angle) * (75 * scale);

      // Trajectory Prediction Line
      ctx.beginPath();
      ctx.setLineDash([7 * scale, 7 * scale]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2.5 * scale;
      let simX = tipX;
      let simY = tipY;
      let simVx = Math.cos(angle) * speed;
      let simVy = Math.sin(angle) * speed;
      ctx.moveTo(simX, simY);
      for (let i = 0; i < 42; i++) {
        simVy += 0.15 * scale;
        simX += simVx;
        simY += simVy;
        if (i % 3 === 0) ctx.lineTo(simX, simY);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      drawArrow(ctx, tipX, tipY, angle, scale);
    } else {
      // Idle Bowstring
      ctx.beginPath();
      ctx.moveTo(bowLeftX, bowLeftY);
      ctx.lineTo(bowRightX, bowRightY);
      ctx.strokeStyle = '#F3F4F6';
      ctx.lineWidth = 3 * scale;
      ctx.stroke();

      // Ready Arrow pointing up
      drawArrow(ctx, bowX, bowY - (55 * scale), -Math.PI / 2, scale);
    }

    requestRef.current = requestAnimationFrame(render);
  }, [handleCorrectHit]);

  // --- Pointer Handlers ---
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    initAudio();
    if (!isStarted || isGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}

    const state = gameState.current;
    state.isAiming = true;
    state.pullStartX = x;
    state.pullStartY = y;
    state.pointerX = x;
    state.pointerY = y;
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
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }

    const scale = state.scale || 1;
    const dx = state.pullStartX - state.pointerX;
    const dy = state.pullStartY - state.pointerY;
    const pullDist = Math.hypot(dx, dy);

    if (pullDist > 14 * scale) {
      const angle = Math.atan2(dy, dx);
      const normalizedPull = pullDist / scale;
      const speed = Math.min(normalizedPull * 0.16, 22) * scale;

      const bowX = state.width / 2;
      const bowY = Math.max(state.height * 0.65, state.height - Math.min(120 * scale, state.height * 0.22));
      const visualPullDist = Math.min(pullDist, 65 * scale);
      const pullX = bowX - Math.cos(angle) * visualPullDist;
      const pullY = bowY - Math.sin(angle) * visualPullDist;
      const tipX = pullX + Math.cos(angle) * (75 * scale);
      const tipY = pullY + Math.sin(angle) * (75 * scale);

      playShootSound();
      state.arrows.push({
        id: Date.now(),
        x: tipX,
        y: tipY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: angle,
        active: true
      });
    }
  };

  // --- ResizeObserver Lifecycle ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        gameState.current.width = w;
        gameState.current.height = h;
        gameState.current.scale = Math.max(0.5, Math.min(w, h) / 600);
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // --- Game Loop Lifecycle ---
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
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden select-none bg-gradient-to-b from-sky-400 via-indigo-700 to-slate-900 transition-colors duration-300 font-sans ${
        errorFlash ? 'brightness-125 saturate-200' : ''
      }`}
    >
      {/* COMPACT TOP HUD (Zero-scroll, always leaves >85% vertical space) */}
      <div className="absolute top-0 left-0 w-full px-2 py-1.5 sm:px-4 sm:py-2.5 z-10 flex flex-col items-center justify-start pointer-events-none gap-1 sm:gap-1.5">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-lg">
          <span className="text-white text-[11px] sm:text-xs md:text-sm font-black tracking-wider uppercase flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            Shoot in Order
          </span>
          <span className="text-amber-300 font-mono text-xs sm:text-sm font-black bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
            Next: {currentTarget <= 10 ? currentTarget : '10'}
          </span>
        </div>

        {/* SEQUENCE BADGES ROW */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 max-w-full px-2 py-1 bg-black/25 backdrop-blur-sm rounded-2xl border border-white/10 shadow-md">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isCollected = collectedNumbers.includes(num);
            const isCurrent = num === currentTarget;
            return (
              <div
                key={num}
                className={`
                  w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black transition-all duration-300
                  ${isCollected
                    ? 'bg-emerald-500 text-white scale-100 shadow-sm border border-emerald-300'
                    : isCurrent
                    ? 'bg-amber-400 text-slate-950 scale-110 sm:scale-115 ring-2 sm:ring-4 ring-yellow-200/80 shadow-[0_0_12px_rgba(250,204,21,0.8)] animate-pulse'
                    : 'bg-white/15 text-white/50 scale-95 border border-white/15'}
                  text-xs sm:text-sm md:text-base
                `}
              >
                {isCollected ? <Check className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" /> : num}
              </div>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC ERROR HINT TOAST */}
      {hintMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-red-600/90 backdrop-blur-md text-white font-black text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-xl border border-red-400 flex items-center gap-1.5">
            <span>⚠️</span>
            <span>{hintMessage}</span>
          </div>
        </div>
      )}

      {/* CANVAS ELEMENT */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="block w-full h-full touch-none cursor-crosshair flex-1 min-h-0"
        style={{ touchAction: 'none' }}
      />

      {/* START SCREEN MODAL */}
      {!isStarted && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-30 p-3 sm:p-4">
          <div className="bg-slate-900 border-2 sm:border-4 border-amber-400/90 p-5 sm:p-8 rounded-3xl shadow-2xl text-center max-w-sm sm:max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-400/20 text-amber-400 border border-amber-400/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Target className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">Number Archery</h2>
            <p className="text-slate-300 text-xs sm:text-sm mb-5 font-medium leading-relaxed">
              Drag backward anywhere to aim, then release to shoot arrows! Pop each balloon in sequential order from <span className="text-amber-400 font-bold">1</span> to <span className="text-emerald-400 font-bold">10</span>.
            </p>
            <button
              onClick={() => {
                initAudio();
                setIsStarted(true);
              }}
              className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl sm:rounded-2xl text-base sm:text-lg shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> Start Archery
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER RESULTS MODAL (Dual CTAs for LessonPlayer & Standalone) */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-30 p-3 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 sm:border-4 border-emerald-400 p-6 sm:p-8 rounded-3xl shadow-2xl text-center max-w-sm sm:max-w-md w-full animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight">Bullseye! Master Archer!</h2>
            <p className="text-slate-300 text-xs sm:text-sm font-semibold mb-4">
              You sequenced every balloon correctly from 1 to 10!
            </p>

            <div className="flex justify-center items-center gap-1.5 mb-6 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-current animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  initializeGame();
                  setIsStarted(true);
                }}
                className="flex-1 py-3 sm:py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-black rounded-xl text-sm sm:text-base transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-700 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              {onComplete && (
                <button
                  onClick={() => onComplete({ score: 10, total: 10 })}
                  className="flex-1 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black rounded-xl text-sm sm:text-base shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}