import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Settings, Users, Target, Heart } from 'lucide-react';

// Kortex Klassroom Player Palette
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

export default function MathDefendersMultiplayer() {
  // --- DOM UI STATE ---
  const [uiState, setUiState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [equation, setEquation] = useState('');
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [winnerMessage, setWinnerMessage] = useState('');

  // --- SETTINGS STATE ---
  const [settings, setSettings] = useState({ operation: 'add', digits: 1, playerCount: 1 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // --- CORE GAME ENGINE (MUTABLE) ---
  const gameRef = useRef({
    state: 'menu',
    width: 800,
    height: 600,
    problem: { text: '', answer: 0 },
    players: [] as any[],
    balloons: [] as any[],
    particles: [] as any[],
    clouds: [] as any[],
    activeTouches: {} as Record<number, number> // touch.identifier -> player.id
  });

  // --- MATH ENGINE ---
  const generateProblem = () => {
    let a=0, b=0, answer=0, text='';
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
        let minA = isMSB ? 1 : 0;
        let maxA = isMSB ? 4 : 9; 
        let aDig = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
        let minB = isMSB ? 1 : 0;
        let maxB = 9 - aDig;
        let bDig = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
        aStr = aDig + aStr;
        bStr = bDig + bStr;
      }
      a = parseInt(aStr); b = parseInt(bStr); answer = a + b; text = `${a} + ${b} = ?`;
    } else if (operation === 'add_carry') {
      if (digits === 1) {
        a = Math.floor(Math.random() * 5) + 5; b = Math.floor(Math.random() * 5) + 5;
      } else {
        a = getNum(digits); b = getNum(digits);
      }
      answer = a + b; text = `${a} + ${b} = ?`;
    } else if (operation === 'sub') {
      let aStr = '', bStr = '';
      for (let i = 0; i < digits; i++) {
        const isMSB = i === digits - 1;
        let minA = isMSB ? 2 : 0; 
        let maxA = 9;
        let aDig = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
        let minB = isMSB ? 1 : 0;
        let maxB = aDig;
        let bDig = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
        aStr = aDig + aStr; bStr = bDig + bStr;
      }
      a = parseInt(aStr); b = parseInt(bStr); answer = a - b; text = `${a} - ${b} = ?`;
    } else if (operation === 'sub_borrow') {
      if (digits === 1) {
         b = Math.floor(Math.random() * 8) + 2; 
         const ans = Math.floor(Math.random() * 8) + 1; 
         a = b + ans; 
      } else {
         a = getNum(digits); b = getNum(digits);
         if (a < b) { let temp = a; a = b; b = temp; }
         if (a % 10 >= b % 10) a -= (a % 10) + 1; 
      }
      answer = a - b; text = `${a} - ${b} = ?`;
    } else if (operation === 'mul') {
      a = getNum(digits); b = getNum(Math.min(digits, 2)); 
      if (digits === 1 && b === 1) b = Math.floor(Math.random() * 8) + 2;
      answer = a * b; text = `${a} × ${b} = ?`;
    } else if (operation === 'div') {
      answer = getNum(digits); 
      b = getNum(Math.min(digits, 2)); 
      if (b === 1) b = Math.floor(Math.random() * 8) + 2; 
      a = answer * b; text = `${a} ÷ ${b} = ?`;
    }

    gameRef.current.problem = { text, answer };
    setEquation(text);

    // Generate Balloons (1 correct, 4 distractors)
    const answers = [answer];
    while (answers.length < 5) {
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

    const isMobile = window.innerWidth < 768;
    const balloonRadius = isMobile ? 35 : 45;
    const minY = 120;
    const maxY = gameRef.current.height - (isMobile ? 380 : 450);

    gameRef.current.balloons = answers.map((num, i) => {
      const isRightToLeft = Math.random() > 0.5;
      return {
        id: Math.random(),
        number: num,
        x: isRightToLeft ? gameRef.current.width + Math.random() * 200 : -Math.random() * 200,
        y: Math.random() * (maxY - minY) + minY,
        baseY: Math.random() * (maxY - minY) + minY,
        radius: balloonRadius,
        color: PLAYER_COLORS[i % 4].main, // Reuse palette for balloons
        speed: (Math.random() * 1.5 + 0.8) * (isRightToLeft ? -1 : 1),
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.05 + 0.02
      };
    });
  };

  // --- GAME LIFECYCLE ---
  const startGame = () => {
    gameRef.current.state = 'playing';
    
    // Initialize Players
    const sectionWidth = window.innerWidth / settings.playerCount;
    gameRef.current.players = Array.from({ length: settings.playerCount }).map((_, i) => ({
      id: i,
      color: PLAYER_COLORS[i],
      score: 0,
      lives: 3,
      bowX: (sectionWidth * i) + (sectionWidth / 2),
      bowY: window.innerHeight - (window.innerWidth < 768 ? 180 : 250),
      bowAngle: -Math.PI / 2,
      charge: 0,
      maxCharge: 50,
      arrow: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, state: 'idle' },
      interaction: { isDown: false, startX: 0, startY: 0, currentX: 0, currentY: 0 }
    }));

    syncUI();
    generateProblem();
    setUiState('playing');
  };

  const syncUI = () => {
    // Clone array to trigger React re-render
    setPlayerStats([...gameRef.current.players]);
  };

  const handleGameOver = () => {
    gameRef.current.state = 'gameover';
    
    // Determine winner
    let maxScore = -1;
    let winners: string[] = [];
    gameRef.current.players.forEach(p => {
      if (p.score > maxScore) { maxScore = p.score; winners = [p.color.name]; }
      else if (p.score === maxScore) { winners.push(p.color.name); }
    });

    if (settings.playerCount === 1) {
      setWinnerMessage(`Final Score: ${maxScore}`);
    } else {
      setWinnerMessage(winners.length > 1 ? "It's a Tie!" : `${winners[0]} Wins!`);
    }
    
    setUiState('gameover');
  };

  const spawnParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 25; i++) {
      gameRef.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1,
        color: color
      });
    }
  };

  // --- CANVAS RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Init clouds
    if (gameRef.current.clouds.length === 0) {
      for(let i=0; i<6; i++){
        gameRef.current.clouds.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * (window.innerHeight / 3),
          size: Math.random() * 50 + 40,
          speed: Math.random() * 0.3 + 0.1
        });
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameRef.current.width = canvas.width;
      gameRef.current.height = canvas.height;
      
      // Re-adjust bow positions on resize
      if (gameRef.current.players.length > 0) {
        const sectionWidth = canvas.width / gameRef.current.players.length;
        gameRef.current.players.forEach((p, i) => {
          p.bowX = (sectionWidth * i) + (sectionWidth / 2);
          p.bowY = canvas.height - (window.innerWidth < 768 ? 180 : 250);
        });
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      if (!ctx) return;
      const { state, width, height, players, balloons, particles, clouds, problem } = gameRef.current;

      // 1. Background
      ctx.fillStyle = '#bae6fd'; // sky-200
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      clouds.forEach(c => {
        c.x += c.speed;
        if (c.x > width + c.size * 2) c.x = -c.size * 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.arc(c.x + c.size * 0.7, c.y - c.size * 0.4, c.size * 0.8, 0, Math.PI * 2);
        ctx.arc(c.x + c.size * 1.4, c.y, c.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
      });

      if (state === 'playing') {
        let activePlayers = 0;

        // 3. Process Players (Input, Physics, Drawing)
        players.forEach(p => {
          if (p.lives <= 0) return; // Player is out
          activePlayers++;

          const { interaction, arrow } = p;

          // Mechanics: Pull-back
          if (interaction.isDown && arrow.state !== 'flying') {
            let dx = interaction.startX - interaction.currentX;
            let dy = interaction.startY - interaction.currentY;
            let dist = Math.hypot(dx, dy);

            if (dist > 10) { 
              arrow.state = 'nocked';
              let targetAngle = Math.atan2(dy, dx);
              if (targetAngle > 0) targetAngle = targetAngle > Math.PI / 2 ? -Math.PI : 0;
              p.bowAngle = targetAngle;
              p.charge = Math.min(dist * 0.4, p.maxCharge);
            }
          } else if (!interaction.isDown && arrow.state === 'nocked') {
            if (p.charge > 10) { // Reduced threshold for snappier release
              arrow.state = 'flying';
              // Lock in starting coordinates instantly to eliminate perceived frame lag
              arrow.x = p.bowX - Math.cos(p.bowAngle) * p.charge;
              arrow.y = p.bowY - Math.sin(p.bowAngle) * p.charge;
              // Increased initial exit velocity (* 0.6 + 18) for a punchier shot
              arrow.vx = Math.cos(p.bowAngle) * (p.charge * 0.6 + 18);
              arrow.vy = Math.sin(p.bowAngle) * (p.charge * 0.6 + 18);
            } else {
              arrow.state = 'idle'; 
            }
            p.charge = 0;
          }

          // Mechanics: Arrow Physics
          if (arrow.state === 'idle') {
            arrow.x = p.bowX; arrow.y = p.bowY; arrow.angle = p.bowAngle;
          } else if (arrow.state === 'nocked') {
            arrow.x = p.bowX - Math.cos(p.bowAngle) * p.charge;
            arrow.y = p.bowY - Math.sin(p.bowAngle) * p.charge;
            arrow.angle = p.bowAngle;
          } else if (arrow.state === 'flying') {
            arrow.vy += 0.2; // Gravity
            arrow.x += arrow.vx;
            arrow.y += arrow.vy;
            arrow.angle = Math.atan2(arrow.vy, arrow.vx);

            if (arrow.y > height || arrow.x < 0 || arrow.x > width) {
              p.lives--;
              arrow.state = 'idle';
              syncUI();
            }
          }

          // Draw Drag Guide
          if (interaction.isDown && arrow.state === 'nocked') {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(interaction.startX, interaction.startY);
            ctx.lineTo(interaction.currentX, interaction.currentY);
            ctx.strokeStyle = p.color.main;
            ctx.lineWidth = 4;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(interaction.startX, interaction.startY, 25, 0, Math.PI * 2);
            ctx.fillStyle = p.color.main + '40'; // 25% opacity
            ctx.fill();
            ctx.restore();
          }

          // Draw Bow
          ctx.save();
          ctx.translate(p.bowX, p.bowY);
          ctx.rotate(p.bowAngle);

          // Bow String
          ctx.beginPath();
          ctx.moveTo(0, -60);
          ctx.lineTo(-p.charge, 0); 
          ctx.lineTo(0, 60);
          ctx.strokeStyle = '#f8fafc'; // slate-50
          ctx.lineWidth = 3;
          ctx.stroke();

          // Bow Wood
          ctx.beginPath();
          ctx.moveTo(0, -65);
          ctx.quadraticCurveTo(35, 0, 0, 65);
          ctx.strokeStyle = p.color.main; // Personalized Bow Color
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
            if (arrow.state === 'nocked') ctx.translate(-p.charge, 0); 
          } else if (arrow.state === 'flying') {
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.angle);
          }
          
          // Shaft
          ctx.beginPath(); ctx.moveTo(-35, 0); ctx.lineTo(35, 0);
          ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4; ctx.stroke();
          
          // Fletching
          ctx.fillStyle = p.color.main;
          ctx.beginPath(); ctx.moveTo(-35, 0); ctx.lineTo(-25, -8); ctx.lineTo(-15, 0); ctx.fill();
          ctx.beginPath(); ctx.moveTo(-35, 0); ctx.lineTo(-25, 8); ctx.lineTo(-15, 0); ctx.fill();

          // Arrowhead
          ctx.fillStyle = '#475569'; 
          ctx.beginPath(); ctx.moveTo(35, -6); ctx.lineTo(48, 0); ctx.lineTo(35, 6); ctx.fill();
          ctx.restore();
        });

        // Check End Condition
        if (activePlayers === 0) {
          handleGameOver();
        }

        // 4. Process Balloons
        let collisionDetected = false;
        for (let i = balloons.length - 1; i >= 0; i--) {
          let b = balloons[i];
          b.x += b.speed;
          b.wobblePhase += b.wobbleSpeed;
          b.y = b.baseY + Math.sin(b.wobblePhase) * 15;

          if (b.speed > 0 && b.x > width + b.radius) b.x = -b.radius;
          if (b.speed < 0 && b.x < -b.radius) b.x = width + b.radius;

          // Collision Check against ALL flying arrows
          players.forEach(p => {
            if (p.arrow.state === 'flying' && !collisionDetected) {
              const tipX = p.arrow.x + Math.cos(p.arrow.angle) * 40;
              const tipY = p.arrow.y + Math.sin(p.arrow.angle) * 40;
              const dist = Math.hypot(tipX - b.x, tipY - b.y);

              if (dist < b.radius + 8) {
                collisionDetected = true; // Prevent multiple arrows hitting simultaneously
                if (b.number === problem.answer) {
                  spawnParticles(b.x, b.y, b.color);
                  p.score += 10;
                  p.arrow.state = 'idle';
                  syncUI();
                  generateProblem(); // New problem
                } else {
                  spawnParticles(b.x, b.y, '#64748b');
                  balloons.splice(i, 1); 
                  p.lives--;
                  p.arrow.state = 'idle';
                  syncUI();
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
            ctx.quadraticCurveTo(15, b.radius + 25, -10, b.radius + 50);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

            // Body
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.ellipse(0, 0, b.radius, b.radius * 1.25, 0, 0, Math.PI * 2); ctx.fill();
            
            // Tie
            ctx.beginPath(); ctx.moveTo(-6, b.radius * 1.2); ctx.lineTo(6, b.radius * 1.2); ctx.lineTo(0, b.radius * 1.4); ctx.fill();

            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.ellipse(-b.radius * 0.35, -b.radius * 0.6, b.radius * 0.25, b.radius * 0.45, Math.PI/5, 0, Math.PI * 2); ctx.fill();

            // Text
            let fontSize = b.radius * 0.85;
            let numStr = String(b.number);
            if (numStr.length > 3) fontSize = b.radius * 0.65;
            
            ctx.fillStyle = '#fff';
            ctx.font = `900 ${fontSize}px "Nunito", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 4;
            ctx.fillText(numStr, 0, 0);
            ctx.restore();
          }
        }

        // 5. Particles
        for (let i = particles.length - 1; i >= 0; i--) {
          let p = particles[i];
          p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.life -= 0.02;
          if (p.life <= 0) { particles.splice(i, 1); continue; }
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // --- MULTI-TOUCH / MOUSE INPUT HANDLERS ---
  const getPlayerZone = (clientX: number) => {
    const sectionWidth = window.innerWidth / settings.playerCount;
    const index = Math.floor(clientX / sectionWidth);
    return Math.min(index, settings.playerCount - 1);
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameRef.current.state !== 'playing') return;
    
    // Prevent default scrolling on touch
    if ('touches' in e && e.cancelable) e.preventDefault();

    if ('changedTouches' in e) {
      // Touch Devices (Smartboard / Mobile)
      Array.from(e.changedTouches).forEach(touch => {
        const pIndex = getPlayerZone(touch.clientX);
        const player = gameRef.current.players[pIndex];
        if (player && player.lives > 0) {
          gameRef.current.activeTouches[touch.identifier] = pIndex;
          player.interaction = { isDown: true, startX: touch.clientX, startY: touch.clientY, currentX: touch.clientX, currentY: touch.clientY };
        }
      });
    } else {
      // Mouse (Desktop fallback)
      const mouseEvent = e as React.MouseEvent;
      const pIndex = getPlayerZone(mouseEvent.clientX);
      const player = gameRef.current.players[pIndex];
      if (player && player.lives > 0) {
        player.interaction = { isDown: true, startX: mouseEvent.clientX, startY: mouseEvent.clientY, currentX: mouseEvent.clientX, currentY: mouseEvent.clientY };
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameRef.current.state !== 'playing') return;

    if ('changedTouches' in e) {
      Array.from(e.changedTouches).forEach(touch => {
        const pIndex = gameRef.current.activeTouches[touch.identifier];
        if (pIndex !== undefined) {
          const player = gameRef.current.players[pIndex];
          if (player) {
            player.interaction.currentX = touch.clientX;
            player.interaction.currentY = touch.clientY;
          }
        }
      });
    } else {
      const mouseEvent = e as React.MouseEvent;
      gameRef.current.players.forEach(player => {
        if (player.interaction.isDown) {
          player.interaction.currentX = mouseEvent.clientX;
          player.interaction.currentY = mouseEvent.clientY;
        }
      });
    }
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameRef.current.state !== 'playing') return;

    if ('changedTouches' in e) {
      Array.from(e.changedTouches).forEach(touch => {
        const pIndex = gameRef.current.activeTouches[touch.identifier];
        if (pIndex !== undefined) {
          const player = gameRef.current.players[pIndex];
          if (player) player.interaction.isDown = false;
          delete gameRef.current.activeTouches[touch.identifier];
        }
      });
    } else {
      gameRef.current.players.forEach(p => p.interaction.isDown = false);
    }
  };

  // --- COMPONENT RENDER ---
  return (
    <div 
      className="relative w-full h-[100dvh] overflow-hidden select-none bg-sky-200 font-sans touch-none flex flex-col"
      onMouseMove={handlePointerMove}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchMove={handlePointerMove}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerUp}
    >
      {/* Visual Stage Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 cursor-crosshair block" />

      {/* --- IN-GAME DOM HUD (Kortex Standards) --- */}
      {uiState === 'playing' && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          
          {/* Top Corners Container for Scores */}
          <div className="absolute top-4 inset-x-2 md:inset-x-6 flex justify-between items-start z-20">
            
            {/* LEFT SIDE: Player 1 (Red) & Player 3 (Green) */}
            <div className="flex flex-col gap-2 md:gap-3 items-start">
              {playerStats.filter((_, i) => i === 0 || i === 2).map((p) => (
                <div 
                  key={p.id} 
                  className={`flex items-center justify-between gap-2 md:gap-4 bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl p-2 md:p-3 shadow-lg border-l-4 md:border-l-8 transition-all ${p.lives === 0 ? 'opacity-40 grayscale scale-95' : 'scale-100'}`}
                  style={{ borderColor: p.color.main }}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] md:text-sm font-black uppercase tracking-wider" style={{ color: p.color.main }}>{p.color.name}</span>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(3)].map((_, i) => (
                        <Heart key={i} className={`w-3 h-3 md:w-4 md:h-4 transition-all ${i < p.lives ? 'fill-red-500 text-red-500' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg md:rounded-xl p-1.5 md:p-2 border border-slate-100">
                    <Trophy className="w-3 h-3 md:w-5 md:h-5 text-yellow-500" />
                    <span className="text-sm md:text-xl font-black text-slate-700 w-5 md:w-8 text-center">{p.score}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT SIDE: Player 2 (Blue) & Player 4 (Yellow) */}
            <div className="flex flex-col gap-2 md:gap-3 items-end">
              {playerStats.filter((_, i) => i === 1 || i === 3).map((p) => (
                <div 
                  key={p.id} 
                  className={`flex items-center justify-between flex-row-reverse gap-2 md:gap-4 bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl p-2 md:p-3 shadow-lg border-r-4 md:border-r-8 transition-all ${p.lives === 0 ? 'opacity-40 grayscale scale-95' : 'scale-100'}`}
                  style={{ borderColor: p.color.main }}
                >
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] md:text-sm font-black uppercase tracking-wider" style={{ color: p.color.main }}>{p.color.name}</span>
                    <div className="flex gap-0.5 mt-0.5 flex-row-reverse">
                      {[...Array(3)].map((_, i) => (
                        <Heart key={i} className={`w-3 h-3 md:w-4 md:h-4 transition-all ${i < p.lives ? 'fill-red-500 text-red-500' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg md:rounded-xl p-1.5 md:p-2 border border-slate-100 flex-row-reverse">
                    <Trophy className="w-3 h-3 md:w-5 md:h-5 text-yellow-500" />
                    <span className="text-sm md:text-xl font-black text-slate-700 w-5 md:w-8 text-center">{p.score}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Top-Center: Compact Equation Display */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-[150px] sm:max-w-[200px] md:max-w-xs px-2 z-10">
            <div className="bg-white/95 backdrop-blur-md px-3 py-2 md:px-6 md:py-4 rounded-2xl md:rounded-3xl shadow-xl border-b-4 md:border-b-6 border-sky-300 text-center">
              <h2 className="text-sky-500 text-[8px] md:text-xs font-black uppercase tracking-widest mb-0.5 md:mb-1">Target</h2>
              <div className="text-xl sm:text-2xl md:text-4xl font-black text-slate-800 tracking-wider">
                {equation}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- MENU OVERLAY --- */}
      {uiState === 'menu' && (
        <div className="absolute inset-0 z-20 bg-sky-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl w-full max-w-3xl border-4 border-white/50 my-auto">
            
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">Math Defenders</h1>
              <p className="text-slate-500 font-bold mt-2">Kortex Klassroom Multiplayer Edition</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Math Settings */}
              <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div>
                  <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2"><Target className="w-4 h-4"/> Select Operation</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {OPERATIONS.map(op => (
                      <button
                        key={op.id}
                        onClick={() => setSettings({ ...settings, operation: op.id })}
                        className={`py-2 px-2 rounded-xl text-xs md:text-sm font-bold transition-all border-2 ${
                          settings.operation === op.id 
                            ? 'bg-sky-500 border-sky-600 text-white shadow-md' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2"><Settings className="w-4 h-4"/> Difficulty (Digits)</h3>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        onClick={() => setSettings({ ...settings, digits: num })}
                        className={`flex-1 py-2 rounded-xl text-lg font-black transition-all border-2 ${
                          settings.digits === num 
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-md' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Player Setup */}
              <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100 flex flex-col justify-center">
                <h3 className="text-sky-700 font-black uppercase tracking-wider text-sm mb-4 flex items-center gap-2 justify-center">
                  <Users className="w-5 h-5"/> How many players?
                </h3>
                <p className="text-center text-xs text-sky-600 mb-4 font-medium">
                  {window.innerWidth < 768 ? 'Mobile devices support up to 2 players.' : 'For Smartboards, select 2-4 and stand side-by-side!'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Dynamically filter options based on screen size */}
                  {(window.innerWidth < 768 ? [1, 2] : [1, 2, 3, 4]).map(num => (
                    <button
                      key={num}
                      onClick={() => setSettings({ ...settings, playerCount: num })}
                      className={`py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-b-4 ${
                        settings.playerCount === num 
                          ? 'bg-sky-500 border-sky-700 text-white shadow-lg scale-105' 
                          : 'bg-white border-sky-200 text-sky-600 hover:bg-sky-100'
                      }`}
                    >
                      <span className="text-2xl font-black">{num}</span>
                      <span className="text-[10px] font-bold uppercase">{num === 1 ? 'Player' : 'Players'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={startGame}
              className="w-full inline-flex items-center justify-center px-6 py-5 font-black text-white transition-all duration-200 bg-emerald-500 rounded-2xl hover:bg-emerald-600 text-2xl shadow-xl shadow-emerald-500/30 hover:-translate-y-1 active:translate-y-0"
            >
              <Play className="w-8 h-8 mr-3 fill-white" />
              START LESSON
            </button>
          </div>
        </div>
      )}

     {/* --- GAME OVER OVERLAY --- */}
      {uiState === 'gameover' && (
        <div className="absolute inset-0 z-30 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-2xl text-center max-w-lg w-full border-4 border-slate-200">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-2">Round Over!</h2>
            
            <div className="bg-amber-100 rounded-3xl p-4 md:p-6 my-6 border-2 border-amber-200 shadow-inner">
              <Trophy className="w-12 h-12 md:w-16 md:h-16 text-amber-500 mx-auto mb-2 md:mb-4" />
              <p className="text-2xl md:text-4xl font-black text-amber-600 drop-shadow-sm">{winnerMessage}</p>
            </div>

            {/* NEW: Multi-Player Leaderboard */}
            <div className="mb-6 space-y-2 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3 text-center">Final Scores</h3>
              {[...playerStats].sort((a, b) => b.score - a.score).map((p, index) => (
                <div key={p.id} className="flex justify-between items-center bg-white p-2 md:p-3 rounded-xl shadow-sm border-l-4" style={{ borderColor: p.color.main }}>
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-slate-300 font-black text-sm md:text-base w-4">#{index + 1}</span>
                    <span className="font-black uppercase tracking-wider text-xs md:text-sm" style={{ color: p.color.main }}>{p.color.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-700 text-lg md:text-xl">{p.score}</span>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">pts</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={startGame}
                className="flex-1 inline-flex items-center justify-center px-4 py-4 font-black text-white bg-sky-500 rounded-xl hover:bg-sky-600 shadow-lg shadow-sky-500/30 transition-transform active:scale-95"
              >
                <RotateCcw className="w-6 h-6 mr-2" /> Play Again
              </button>
              <button 
                onClick={() => setUiState('menu')}
                className="flex-1 inline-flex items-center justify-center px-4 py-4 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 border-2 border-slate-200 transition-transform active:scale-95"
              >
                <Settings className="w-6 h-6 mr-2" /> Menu
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}