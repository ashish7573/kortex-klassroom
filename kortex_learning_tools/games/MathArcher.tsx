"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Settings, Users, Target, Heart, ArrowRight } from 'lucide-react';

const PLAYER_COLORS = [
  { main: '#ef4444', light: '#fca5a5', name: 'Red' },    // Player 1
  { main: '#3b82f6', light: '#93c5fd', name: 'Blue' },   // Player 2
  { main: '#10b981', light: '#6ee7b7', name: 'Green' },  // Player 3
  { main: '#f59e0b', light: '#fcd34d', name: 'Yellow' }  // Player 4
];

const OPERATIONS = [
  { id: 'add', label: 'Addition' },
  { id: 'add_carry', label: 'Add (Carry)' },
  { id: 'sub', label: 'Subtraction' },
  { id: 'sub_borrow', label: 'Sub (Borrow)' },
  { id: 'mul', label: 'Multiply' },
  { id: 'div', label: 'Divide' }
];

interface MathArcherProps {
  lesson?: any;
  onComplete?: (results?: { score: number; total: number }) => void;
}

export default function MathArcher({ lesson, onComplete }: MathArcherProps) {
  const [uiState, setUiState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [equation, setEquation] = useState('');
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [winnerMessage, setWinnerMessage] = useState('');
  const [topScore, setTopScore] = useState(0);
  const [settings, setSettings] = useState({ operation: 'add', digits: 1, playerCount: 1 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastSyncRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const gameRef = useRef({
    state: 'menu',
    width: 800,
    height: 600,
    scale: 1,
    problem: { text: '', answer: 0 },
    players: [] as any[],
    balloons: [] as any[],
    particles: [] as any[],
    clouds: [] as any[],
    activePointers: new Map<number, number>()
  });

  // --- AUDIO SYNTHESIS ENGINE ---
  const initAudio = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch {}
  }, []);

  const playShootSound = () => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  };

  const playDing = () => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const playBuzzer = () => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  };

  const playVictoryFanfare = () => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
      });
    } catch {}
  };

  // Safe audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  // Screen resize clamping for small mobile screens (limit to 1 Player)
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        setSettings(s => (s.playerCount > 1 ? { ...s, playerCount: 1 } : s));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- DYNAMIC MATH PROBLEM GENERATOR ---
  const generateProblem = useCallback(() => {
    let a = 0, b = 0, answer = 0, text = '';
    const { operation, digits } = settings;

    const getNum = (d: number) => {
      const min = Math.pow(10, d - 1);
      const max = Math.pow(10, d) - 1;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    if (operation === 'add') {
      let aStr = '', bStr = '';
      for (let i = 0; i < digits; i++) {
        const isMSB = i === digits - 1;
        const minA = isMSB ? 1 : 0;
        const maxA = isMSB ? 4 : 9;
        const aDig = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
        const minB = isMSB ? 1 : 0;
        const maxB = 9 - aDig;
        const bDig = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
        aStr = aDig + aStr;
        bStr = bDig + bStr;
      }
      a = parseInt(aStr);
      b = parseInt(bStr);
      answer = a + b;
      text = `${a} + ${b} = ?`;
    } else if (operation === 'add_carry') {
      if (digits === 1) {
        a = Math.floor(Math.random() * 5) + 5;
        b = Math.floor(Math.random() * 5) + 5;
      } else {
        a = getNum(digits);
        b = getNum(digits);
      }
      answer = a + b;
      text = `${a} + ${b} = ?`;
    } else if (operation === 'sub') {
      let aStr = '', bStr = '';
      for (let i = 0; i < digits; i++) {
        const isMSB = i === digits - 1;
        const minA = isMSB ? 2 : 0;
        const maxA = 9;
        const aDig = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
        const minB = isMSB ? 1 : 0;
        const maxB = aDig;
        const bDig = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
        aStr = aDig + aStr;
        bStr = bDig + bStr;
      }
      a = parseInt(aStr);
      b = parseInt(bStr);
      answer = a - b;
      text = `${a} - ${b} = ?`;
    } else if (operation === 'sub_borrow') {
      if (digits === 1) {
        b = Math.floor(Math.random() * 8) + 2;
        const ans = Math.floor(Math.random() * 8) + 1;
        a = b + ans;
      } else {
        a = getNum(digits);
        b = getNum(digits);
        if (a < b) { const temp = a; a = b; b = temp; }
        if (a % 10 >= b % 10) a -= (a % 10) + 1;
      }
      answer = a - b;
      text = `${a} - ${b} = ?`;
    } else if (operation === 'mul') {
      a = getNum(digits);
      b = getNum(Math.min(digits, 2));
      if (digits === 1 && b === 1) b = Math.floor(Math.random() * 8) + 2;
      answer = a * b;
      text = `${a} × ${b} = ?`;
    } else if (operation === 'div') {
      answer = getNum(digits);
      b = getNum(Math.min(digits, 2));
      if (b === 1) b = Math.floor(Math.random() * 8) + 2;
      a = answer * b;
      text = `${a} ÷ ${b} = ?`;
    }

    gameRef.current.problem = { text, answer };
    setEquation(text);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetBalloons = isMobile ? 5 : 8;

    const answers = [answer];
    while (answers.length < targetBalloons) {
      let offset = Math.floor(Math.random() * 20) - 10;
      if (offset === 0) offset = 1;
      let distractor = answer + offset;
      if (operation === 'mul' || operation === 'div') {
        const modifiers = [
          answer + (Math.floor(Math.random() * 5) + 1) * 10,
          answer - (Math.floor(Math.random() * 5) + 1) * 10,
          answer + (Math.floor(Math.random() * 3) + 1) * b,
          answer - (Math.floor(Math.random() * 3) + 1) * b
        ];
        distractor = modifiers[Math.floor(Math.random() * modifiers.length)];
      }
      if (distractor < 0) distractor = Math.abs(distractor);
      if (!answers.includes(distractor)) answers.push(distractor);
    }
    answers.sort(() => Math.random() - 0.5);

    const scale = gameRef.current.scale || 1;
    const balloonRadius = 42 * scale;
    const minY = 75 * scale;
    const maxY = gameRef.current.height * 0.44;

    gameRef.current.balloons = answers.map((num, i) => {
      const isRightToLeft = Math.random() > 0.5;
      return {
        id: Math.random(),
        number: num,
        x: Math.random() * gameRef.current.width,
        y: Math.random() * (maxY - minY) + minY,
        baseY: Math.random() * (maxY - minY) + minY,
        radius: balloonRadius,
        color: PLAYER_COLORS[i % 4].main,
        speed: (Math.random() * 0.9 + 0.4) * (isRightToLeft ? -1 : 1) * scale,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.05 + 0.02
      };
    });
  }, [settings]);

  // Throttled UI state sync
  const syncUI = useCallback((force = false) => {
    const now = performance.now();
    if (force || now - lastSyncRef.current > 100) {
      setPlayerStats([...gameRef.current.players]);
      lastSyncRef.current = now;
    }
  }, []);

  const startGame = useCallback(() => {
    initAudio();
    gameRef.current.state = 'playing';
    gameRef.current.activePointers.clear();

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const w = container ? container.clientWidth : (canvas ? canvas.clientWidth : window.innerWidth);
    const h = container ? container.clientHeight : (canvas ? canvas.clientHeight : window.innerHeight);
    const isMobileScale = w < 768;
    const scale = Math.max(0.4, Math.min(w, h) / (isMobileScale ? 500 : 800));
    gameRef.current.width = w;
    gameRef.current.height = h;
    gameRef.current.scale = scale;

    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    const activePlayerCount = isSmallScreen ? 1 : settings.playerCount;

    const sectionWidth = w / activePlayerCount;
    gameRef.current.players = Array.from({ length: activePlayerCount }).map((_, i) => ({
      id: i,
      color: PLAYER_COLORS[i],
      score: 0,
      lives: 5,
      bowX: (sectionWidth * i) + (sectionWidth / 2),
      bowY: h - Math.min(125 * scale, h * 0.22),
      bowAngle: -Math.PI / 2,
      charge: 0,
      maxCharge: 50,
      arrow: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, state: 'idle' },
      interaction: { isDown: false, startX: 0, startY: 0, currentX: 0, currentY: 0 }
    }));

    syncUI(true);
    generateProblem();
    setUiState('playing');
  }, [settings, generateProblem, syncUI, initAudio]);

  const handleGameOver = useCallback(() => {
    playVictoryFanfare();
    gameRef.current.state = 'gameover';
    gameRef.current.activePointers.clear();

    let maxScore = -1;
    let winners: string[] = [];
    gameRef.current.players.forEach(p => {
      if (p.score > maxScore) { maxScore = p.score; winners = [p.color.name]; }
      else if (p.score === maxScore) { winners.push(p.color.name); }
    });

    setTopScore(Math.max(0, maxScore));

    if (settings.playerCount === 1) {
      setWinnerMessage(`Final Score: ${Math.max(0, maxScore)}`);
    } else {
      setWinnerMessage(winners.length > 1 ? "It's a Tie!" : `${winners[0]} Wins!`);
    }

    syncUI(true);
    setUiState('gameover');
  }, [settings.playerCount, syncUI]);

  const spawnParticles = (x: number, y: number, color: string) => {
    const scale = gameRef.current.scale || 1;
    for (let i = 0; i < 24; i++) {
      gameRef.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 12 * scale,
        vy: (Math.random() - 0.5) * 12 * scale,
        life: 1,
        color: color
      });
    }
  };

  // --- RESIZE OBSERVER LIFECYCLE ---
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
        gameRef.current.width = w;
        gameRef.current.height = h;
        const isMobileScale = w < 768;
        const scale = Math.max(0.4, Math.min(w, h) / (isMobileScale ? 500 : 800));
        gameRef.current.scale = scale;

        if (gameRef.current.players.length > 0) {
          const sectionWidth = w / gameRef.current.players.length;
          gameRef.current.players.forEach((p, i) => {
            p.bowX = (sectionWidth * i) + (sectionWidth / 2);
            p.bowY = h - Math.min(125 * scale, h * 0.22);
          });
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // --- MAIN CANVAS DRAW LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (gameRef.current.clouds.length === 0) {
      for (let i = 0; i < 6; i++) {
        gameRef.current.clouds.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * (window.innerHeight / 3),
          size: Math.random() * 50 + 40,
          speed: Math.random() * 0.3 + 0.1
        });
      }
    }

    const draw = () => {
      if (!ctx) return;
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;

      const displayWidth = canvasEl.clientWidth || window.innerWidth;
      const displayHeight = canvasEl.clientHeight || window.innerHeight;

      if (canvasEl.width !== displayWidth || canvasEl.height !== displayHeight) {
        canvasEl.width = displayWidth;
        canvasEl.height = displayHeight;
        gameRef.current.width = displayWidth;
        gameRef.current.height = displayHeight;
        const isMobileScale = displayWidth < 768;
        gameRef.current.scale = Math.max(0.4, Math.min(displayWidth, displayHeight) / (isMobileScale ? 500 : 800));

        if (gameRef.current.players.length > 0) {
          const sectionWidth = displayWidth / gameRef.current.players.length;
          gameRef.current.players.forEach((p, i) => {
            p.bowX = (sectionWidth * i) + (sectionWidth / 2);
            p.bowY = displayHeight - Math.min(125 * gameRef.current.scale, displayHeight * 0.22);
          });
        }
      }

      const { state, width, height, players, balloons, particles, clouds, problem, scale } = gameRef.current;
      const s = scale || 1;

      // Background Sky
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(0, 0, width, height);

      // Background Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      clouds.forEach(c => {
        c.x += c.speed * s;
        if (c.x > width + c.size * 2) c.x = -c.size * 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size * s, 0, Math.PI * 2);
        ctx.arc(c.x + c.size * 0.7 * s, c.y - c.size * 0.4 * s, c.size * 0.8 * s, 0, Math.PI * 2);
        ctx.arc(c.x + c.size * 1.4 * s, c.y, c.size * 0.9 * s, 0, Math.PI * 2);
        ctx.fill();
      });

      if (state === 'playing') {
        let activePlayers = 0;
        let needsUIRefresh = false;

        players.forEach(p => {
          if (p.lives <= 0) return;
          activePlayers++;

          const { interaction, arrow } = p;

          if (interaction.isDown && arrow.state !== 'flying') {
            const dx = interaction.startX - interaction.currentX;
            const dy = interaction.startY - interaction.currentY;
            const dist = Math.hypot(dx, dy);

            const normalizedDist = dist / s;
            if (normalizedDist > 10) {
              arrow.state = 'nocked';
              let targetAngle = Math.atan2(dy, dx);
              if (targetAngle > 0) targetAngle = targetAngle > Math.PI / 2 ? -Math.PI : 0;
              p.bowAngle = targetAngle;
              p.charge = Math.min(normalizedDist * 0.4, p.maxCharge);
            }
          } else if (!interaction.isDown && arrow.state === 'nocked') {
            if (p.charge > 5) {
              arrow.state = 'flying';
              arrow.x = p.bowX - Math.cos(p.bowAngle) * (p.charge * s);
              arrow.y = p.bowY - Math.sin(p.bowAngle) * (p.charge * s);
              arrow.vx = Math.cos(p.bowAngle) * (p.charge * 0.8 + 25) * s;
              arrow.vy = Math.sin(p.bowAngle) * (p.charge * 0.8 + 25) * s;
              playShootSound();
            } else {
              arrow.state = 'idle';
            }
            p.charge = 0;
          }

          if (arrow.state === 'idle') {
            arrow.x = p.bowX;
            arrow.y = p.bowY;
            arrow.angle = p.bowAngle;
          } else if (arrow.state === 'nocked') {
            arrow.x = p.bowX - Math.cos(p.bowAngle) * (p.charge * s);
            arrow.y = p.bowY - Math.sin(p.bowAngle) * (p.charge * s);
            arrow.angle = p.bowAngle;
          } else if (arrow.state === 'flying') {
            arrow.vy += 0.2 * s;
            arrow.x += arrow.vx;
            arrow.y += arrow.vy;
            arrow.angle = Math.atan2(arrow.vy, arrow.vx);

            // INSTANT RELOAD: As soon as arrow is not visible in play area, consider it used and provide new arrow!
            if (arrow.y < -30 || arrow.y > height + 25 || arrow.x < -30 || arrow.x > width + 30) {
              p.lives--;
              arrow.state = 'idle';
              needsUIRefresh = true;
              playBuzzer();
            }
          }

          // TRAJECTORY PATH PREDICTION (Like Seriation Archer)
          if (interaction.isDown && arrow.state === 'nocked' && p.charge > 5) {
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([6 * s, 6 * s]);
            ctx.strokeStyle = p.color.main;
            ctx.lineWidth = 2.5 * s;

            let simX = p.bowX + Math.cos(p.bowAngle) * (35 * s);
            let simY = p.bowY + Math.sin(p.bowAngle) * (35 * s);
            let simVx = Math.cos(p.bowAngle) * (p.charge * 0.8 + 25) * s;
            let simVy = Math.sin(p.bowAngle) * (p.charge * 0.8 + 25) * s;
            ctx.moveTo(simX, simY);

            for (let step = 0; step < 40; step++) {
              simVy += 0.2 * s;
              simX += simVx;
              simY += simVy;
              if (simY < -20 || simX < -20 || simX > width + 20) break;
              if (step % 2 === 0) ctx.lineTo(simX, simY);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Touch Drag Affordance
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(interaction.startX, interaction.startY);
            ctx.lineTo(interaction.currentX, interaction.currentY);
            ctx.strokeStyle = p.color.main + '80';
            ctx.lineWidth = 3 * s;
            ctx.setLineDash([4 * s, 4 * s]);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(interaction.startX, interaction.startY, 22 * s, 0, Math.PI * 2);
            ctx.fillStyle = p.color.main + '26';
            ctx.fill();
            ctx.restore();
          }

          // Draw Bow
          ctx.save();
          ctx.translate(p.bowX, p.bowY);
          ctx.rotate(p.bowAngle);
          ctx.scale(s, s);

          // Bowstring
          ctx.beginPath();
          ctx.moveTo(0, -60);
          ctx.lineTo(-p.charge, 0);
          ctx.lineTo(0, 60);
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Bow Limbs
          ctx.beginPath();
          ctx.moveTo(0, -65);
          ctx.quadraticCurveTo(35, 0, 0, 65);
          ctx.strokeStyle = p.color.main;
          ctx.lineWidth = 14;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.strokeStyle = p.color.light;
          ctx.lineWidth = 8;
          ctx.stroke();
          ctx.restore();

          // Draw Arrow
          ctx.save();
          if (arrow.state === 'idle' || arrow.state === 'nocked') {
            ctx.translate(p.bowX, p.bowY);
            ctx.rotate(p.bowAngle);
            ctx.scale(s, s);
            if (arrow.state === 'nocked') ctx.translate(-p.charge, 0);
          } else if (arrow.state === 'flying') {
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.angle);
            ctx.scale(s, s);
          }

          // Arrow Shaft
          ctx.beginPath();
          ctx.moveTo(-30, 0);
          ctx.lineTo(35, 0);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Fletching
          ctx.fillStyle = p.color.main;
          ctx.beginPath(); ctx.moveTo(-30, -6); ctx.lineTo(-15, 0); ctx.lineTo(-30, 0); ctx.fill();
          ctx.beginPath(); ctx.moveTo(-30, 6); ctx.lineTo(-15, 0); ctx.lineTo(-30, 0); ctx.fill();

          ctx.beginPath(); ctx.arc(-30, 0, 4, 0, Math.PI * 2);
          ctx.fillStyle = p.color.main; ctx.fill();

          // Arrowhead
          ctx.fillStyle = '#475569';
          ctx.beginPath(); ctx.moveTo(35, -6); ctx.lineTo(48, 0); ctx.lineTo(35, 6); ctx.fill();
          ctx.restore();
        });

        if (activePlayers === 0) {
          handleGameOver();
        }

        // Balloons Collision and Movement
        let collisionDetected = false;
        for (let i = balloons.length - 1; i >= 0; i--) {
          const b = balloons[i];
          b.x += b.speed;
          b.wobblePhase += b.wobbleSpeed;
          b.y = b.baseY + Math.sin(b.wobblePhase) * (15 * s);

          if (b.speed > 0 && b.x > width + b.radius) b.x = -b.radius;
          if (b.speed < 0 && b.x < -b.radius) b.x = width + b.radius;

          players.forEach(p => {
            if (p.arrow.state === 'flying' && !collisionDetected) {
              const tipX = p.arrow.x + Math.cos(p.arrow.angle) * (40 * s);
              const tipY = p.arrow.y + Math.sin(p.arrow.angle) * (40 * s);
              const dist = Math.hypot(tipX - b.x, tipY - b.y);

              if (dist < b.radius + (8 * s)) {
                collisionDetected = true;
                if (b.number === problem.answer) {
                  playDing();
                  spawnParticles(b.x, b.y, b.color);
                  p.score += 10;
                  p.arrow.state = 'idle';
                  needsUIRefresh = true;
                  generateProblem();
                } else {
                  playBuzzer();
                  spawnParticles(b.x, b.y, '#64748b');
                  balloons.splice(i, 1);
                  p.lives--;
                  p.arrow.state = 'idle';
                  needsUIRefresh = true;
                }
              }
            }
          });

          // Draw Balloon
          if (balloons[i]) {
            ctx.save();
            ctx.translate(b.x, b.y);

            // String
            ctx.beginPath(); ctx.moveTo(0, b.radius);
            ctx.quadraticCurveTo(15 * s, b.radius + (25 * s), -10 * s, b.radius + (50 * s));
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * s; ctx.stroke();

            // Body
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.ellipse(0, 0, b.radius, b.radius * 1.25, 0, 0, Math.PI * 2); ctx.fill();

            // Knot
            ctx.beginPath(); ctx.moveTo(-6 * s, b.radius * 1.2); ctx.lineTo(6 * s, b.radius * 1.2); ctx.lineTo(0, b.radius * 1.4); ctx.fill();

            // Highlight Sheen
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.beginPath(); ctx.ellipse(-b.radius * 0.35, -b.radius * 0.6, b.radius * 0.25, b.radius * 0.45, Math.PI / 5, 0, Math.PI * 2); ctx.fill();

            // Number Label
            let fontSize = b.radius * 0.85;
            const numStr = String(b.number);
            if (numStr.length > 3) fontSize = b.radius * 0.65;

            ctx.fillStyle = '#fff';
            ctx.font = `900 ${fontSize}px "Nunito", system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 4 * s;
            ctx.fillText(numStr, 0, 0);
            ctx.restore();
          }
        }

        // Draw Particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy; p.vy += 0.4 * s; p.life -= 0.02;
          if (p.life <= 0) { particles.splice(i, 1); continue; }
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, 6 * s, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }

        if (needsUIRefresh) syncUI();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [generateProblem, syncUI, handleGameOver]);

  // --- MULTI-TOUCH POINTER HANDLERS ---
  const getPlayerZone = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.clientWidth : window.innerWidth;
    const pCount = gameRef.current.players.length || 1;
    const sectionWidth = w / pCount;
    return Math.min(Math.floor(clientX / sectionWidth), pCount - 1);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameRef.current.state !== 'playing') return;
    initAudio();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pIndex = getPlayerZone(x);
    const player = gameRef.current.players[pIndex];
    if (player && player.lives > 0) {
      gameRef.current.activePointers.set(e.pointerId, pIndex);
      player.interaction = { isDown: true, startX: x, startY: y, currentX: x, currentY: y };
    }
  }, [getPlayerZone, initAudio]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameRef.current.state !== 'playing') return;

    const pIndex = gameRef.current.activePointers.get(e.pointerId);
    if (pIndex !== undefined) {
      const player = gameRef.current.players[pIndex];
      if (player && player.interaction.isDown) {
        const canvas = canvasRef.current;
        const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        player.interaction.currentX = e.clientX - rect.left;
        player.interaction.currentY = e.clientY - rect.top;
      }
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameRef.current.state !== 'playing') return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const pIndex = gameRef.current.activePointers.get(e.pointerId);
    if (pIndex !== undefined) {
      const player = gameRef.current.players[pIndex];
      if (player) player.interaction.isDown = false;
      gameRef.current.activePointers.delete(e.pointerId);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-full flex-1 min-h-0 overflow-hidden select-none bg-sky-200 font-sans touch-none flex flex-col"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 cursor-crosshair block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }}
      />

      {/* --- IN-GAME DOM HUD --- */}
      {uiState === 'playing' && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* PLAYER CARDS (Top Left & Top Right) */}
          <div className="absolute top-2 sm:top-4 inset-x-2 sm:inset-x-6 flex justify-between items-start z-20">
            {/* Player 1 & 3 */}
            <div className="flex flex-col gap-1.5 sm:gap-2.5 items-start">
              {playerStats.filter((_, i) => i === 0 || i === 2).map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-2 sm:gap-3 bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 shadow-md border-l-4 sm:border-l-6 transition-all ${
                    p.lives === 0 ? 'opacity-40 grayscale scale-95' : 'scale-100'
                  }`}
                  style={{ borderColor: p.color.main }}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider" style={{ color: p.color.main }}>
                      {p.color.name}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${p.lives > 0 ? 'fill-red-500 text-red-500' : 'fill-slate-200 text-slate-200'}`} />
                      <span className="text-xs sm:text-sm font-bold text-slate-600">× {p.lives}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg sm:rounded-xl px-2 py-1 border border-slate-100">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                    <span className="text-xs sm:text-base font-black text-slate-700 min-w-[20px] text-center">{p.score}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Player 2 & 4 */}
            <div className="flex flex-col gap-1.5 sm:gap-2.5 items-end">
              {playerStats.filter((_, i) => i === 1 || i === 3).map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between flex-row-reverse gap-2 sm:gap-3 bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 shadow-md border-r-4 sm:border-r-6 transition-all ${
                    p.lives === 0 ? 'opacity-40 grayscale scale-95' : 'scale-100'
                  }`}
                  style={{ borderColor: p.color.main }}
                >
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider" style={{ color: p.color.main }}>
                      {p.color.name}
                    </span>
                    <div className="flex items-center flex-row-reverse gap-1 mt-0.5">
                      <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${p.lives > 0 ? 'fill-red-500 text-red-500' : 'fill-slate-200 text-slate-200'}`} />
                      <span className="text-xs sm:text-sm font-bold text-slate-600">× {p.lives}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg sm:rounded-xl px-2 py-1 border border-slate-100 flex-row-reverse">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                    <span className="text-xs sm:text-base font-black text-slate-700 min-w-[20px] text-center">{p.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER TARGET CARD & IN-GAME SETTINGS BUTTON */}
          <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 w-auto max-w-[220px] sm:max-w-xs px-2 z-10 flex flex-col items-center gap-1 sm:gap-1.5">
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-2xl sm:rounded-3xl shadow-xl border-b-4 border-sky-300 text-center w-full">
              <h2 className="text-sky-500 text-[9px] sm:text-xs font-black uppercase tracking-widest mb-0.5">Target</h2>
              <div className="text-base sm:text-2xl md:text-3xl font-black text-slate-800 tracking-wider">
                {equation}
              </div>
            </div>

            {/* In-Game Settings Return Button */}
            <button
              onClick={() => {
                initAudio();
                setUiState('menu');
              }}
              className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:py-1 bg-white/90 hover:bg-white active:scale-95 text-slate-700 rounded-full border border-sky-200 shadow-md backdrop-blur-sm text-[11px] sm:text-xs font-bold transition-all hover:border-sky-400 group cursor-pointer"
              title="Return to Menu & Settings"
            >
              <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-500 group-hover:rotate-45 transition-transform" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* --- MENU OVERLAY --- */}
      {uiState === 'menu' && (
        <div className="absolute inset-0 z-20 bg-sky-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto">
          <div className="bg-white rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-2xl w-full max-w-2xl border-4 border-white/60 my-auto animate-in zoom-in-95 duration-200">
            <div className="text-center mb-5 sm:mb-6">
              <h1 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">Math Archer</h1>
              <p className="text-slate-500 font-bold text-xs sm:text-sm mt-1">Arcade Balloon Math Challenge</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Operations & Difficulty */}
              <div className="space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <div>
                  <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2.5 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-sky-500" /> Select Operation
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {OPERATIONS.map(op => (
                      <button
                        key={op.id}
                        onClick={() => setSettings(s => ({ ...s, operation: op.id }))}
                        className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all border-2 ${
                          settings.operation === op.id
                            ? 'bg-sky-500 border-sky-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-emerald-500" /> Difficulty (Digits)
                  </h3>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        onClick={() => setSettings(s => ({ ...s, digits: num }))}
                        className={`flex-1 py-1.5 sm:py-2 rounded-xl text-base sm:text-lg font-black transition-all border-2 ${
                          settings.digits === num
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Player Count Selection */}
              <div className="bg-sky-50 p-4 sm:p-5 rounded-2xl border border-sky-100 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sky-700 font-black uppercase tracking-wider text-xs sm:text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" /> Select Players
                  </h3>
                  <span className="text-[11px] text-sky-600 font-semibold sm:hidden">
                    1 Player on mobile
                  </span>
                </div>
                <p className="text-xs text-sky-600 mb-3 font-medium hidden sm:block">
                  For Smartboards and tablets, choose 2–4 players to stand side-by-side!
                </p>

                <div className="flex gap-2 sm:grid sm:grid-cols-2 sm:gap-2.5">
                  {/* 1 Player (Always Available) */}
                  <button
                    onClick={() => setSettings(s => ({ ...s, playerCount: 1 }))}
                    className={`flex-1 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all border-b-4 ${
                      settings.playerCount === 1
                        ? 'bg-sky-500 border-sky-700 text-white shadow-md'
                        : 'bg-white border-sky-200 text-sky-600 hover:bg-sky-100'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl font-black">1</span>
                    <span className="text-[10px] font-bold uppercase">Solo</span>
                  </button>

                  {/* 2P, 3P, 4P - Hidden on small mobile screens */}
                  {[2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => setSettings(s => ({ ...s, playerCount: num }))}
                      className={`hidden sm:flex flex-1 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl flex-col items-center justify-center gap-0.5 transition-all border-b-4 ${
                        settings.playerCount === num
                          ? 'bg-sky-500 border-sky-700 text-white shadow-md'
                          : 'bg-white border-sky-200 text-sky-600 hover:bg-sky-100'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl font-black">{num}</span>
                      <span className="text-[10px] font-bold uppercase">{num} Players</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 sm:py-4 font-black text-white transition-all bg-emerald-500 hover:bg-emerald-600 rounded-xl sm:rounded-2xl text-lg sm:text-xl shadow-lg shadow-emerald-500/30 active:scale-95"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 fill-white" />
              START GAME
            </button>
          </div>
        </div>
      )}

      {/* --- GAME OVER RESULTS OVERLAY --- */}
      {uiState === 'gameover' && (
        <div className="absolute inset-0 z-30 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pointer-events-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-2xl text-center max-w-md w-full border-4 border-slate-200 max-h-[95vh] flex flex-col my-auto animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 mb-2 shrink-0">Round Finished!</h2>

            <div className="bg-amber-100 rounded-2xl sm:rounded-3xl p-3 sm:p-4 my-2 sm:my-3 border-2 border-amber-200 shadow-inner shrink-0">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto mb-1 animate-bounce" />
              <p className="text-xl sm:text-3xl font-black text-amber-600 drop-shadow-sm">{winnerMessage}</p>
            </div>

            <div className="mb-4 text-left bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-inner overflow-y-auto max-h-[30vh]">
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mb-2 text-center">Scoreboard</h3>
              <div className="space-y-1.5">
                {[...playerStats].sort((a, b) => b.score - a.score).map((p, index) => (
                  <div key={p.id} className="flex justify-between items-center bg-white p-2 sm:p-2.5 rounded-xl shadow-sm border-l-4" style={{ borderColor: p.color.main }}>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 font-black text-xs sm:text-sm w-4">#{index + 1}</span>
                      <span className="font-black uppercase tracking-wider text-xs sm:text-sm" style={{ color: p.color.main }}>{p.color.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-black text-slate-700 text-base sm:text-lg">{p.score}</span>
                      <span className="text-slate-400 text-[10px] font-bold uppercase">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
              <button
                onClick={startGame}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 sm:py-3.5 font-black text-white bg-sky-500 hover:bg-sky-600 rounded-xl shadow-md transition-all active:scale-95 text-sm sm:text-base gap-1.5"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" /> Play Again
              </button>
              {onComplete && (
                <button
                  onClick={() => onComplete({ score: topScore, total: topScore })}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 sm:py-3.5 font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl shadow-md transition-all active:scale-95 text-sm sm:text-base gap-1.5"
                >
                  Next Step <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              <button
                onClick={() => setUiState('menu')}
                className="inline-flex items-center justify-center px-4 py-3 sm:py-3.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 rounded-xl transition-all active:scale-95 text-sm sm:text-base gap-1.5"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" /> Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}