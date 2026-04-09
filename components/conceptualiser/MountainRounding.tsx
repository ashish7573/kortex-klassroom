"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Play, RotateCcw, Check } from 'lucide-react';

const PlaceValues = [
  { name: 'Lakhs', multiplier: 100000 },
  { name: 'Ten Th.', multiplier: 10000 },
  { name: 'Thousands', multiplier: 1000 },
  { name: 'Hundreds', multiplier: 100 },
  { name: 'Tens', multiplier: 10 },
  { name: 'Ones', multiplier: 1 }
];

export default function MountainRounding({ lesson, onComplete = () => {} }: any) {
  // --- STATE ---
  const [mode, setMode] = useState(10); // 10, 100, 1000
  const [digits, setDigits] = useState([0, 0, 0, 0, 4, 3]); // Initial number: 43
  const [isReleased, setIsReleased] = useState(false);
  const [animFraction, setAnimFraction] = useState(0);
  
  const animationRef = useRef<number | null>(null);
  const swipeRefs = useRef<any>({}); 

  // --- DERIVED VALUES ---
  const number = digits.reduce((acc, digit, idx) => acc + digit * PlaceValues[idx].multiplier, 0);
  
  const lowerBound = Math.floor(number / mode) * mode;
  const upperBound = lowerBound + mode;
  const midPoint = lowerBound + (mode / 2);
  const targetFraction = (number % mode) / mode;

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

  // --- EFFECTS ---
  useEffect(() => {
    setIsReleased(false);
    setAnimFraction(targetFraction);
  }, [digits, mode, targetFraction]);

  useEffect(() => {
    if (isReleased) {
      let current = animFraction;
      const target = targetFraction >= 0.5 ? 1 : 0;
      const speed = 0.02;

      const animate = () => {
        if (target === 1 && current < 1) {
          current = Math.min(1, current + speed);
          setAnimFraction(current);
          animationRef.current = requestAnimationFrame(animate);
        } else if (target === 0 && current > 0) {
          current = Math.max(0, current - speed);
          setAnimFraction(current);
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  }, [isReleased, targetFraction, animFraction]);

  // --- HANDLERS ---
  const handleDigitChange = (index: number, delta: number) => {
    setDigits(prev => {
      const newDigits = [...prev];
      let newVal = newDigits[index] + delta;
      if (newVal > 9) newVal = 0;
      if (newVal < 0) newVal = 9;
      newDigits[index] = newVal;
      return newDigits;
    });
  };

  const handlePointerDown = (e: any, index: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    swipeRefs.current[index] = { startY: e.clientY };
  };

  const handlePointerMove = (e: any, index: number) => {
    if (!swipeRefs.current[index]) return;
    
    const deltaY = e.clientY - swipeRefs.current[index].startY;
    const swipeThreshold = 25; 

    if (Math.abs(deltaY) > swipeThreshold) {
      const direction = deltaY < 0 ? 1 : -1; 
      handleDigitChange(index, direction);
      swipeRefs.current[index].startY = e.clientY; 
    }
  };

  const handlePointerUp = (e: any, index: number) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    swipeRefs.current[index] = null;
  };

  const handleRelease = () => setIsReleased(true);

  // --- SVG MATH ---
  const svgWidth = 800;
  const svgHeight = 250;
  const valleyY = 200;
  const peakY = 40;
  const mountainHeight = valleyY - peakY;
  
  const leftValleyX = 200;
  const rightValleyX = 600;
  const peakX = 400;

  const getBallCoords = (fraction: number) => {
    const x = leftValleyX + (fraction * (rightValleyX - leftValleyX));
    const yOffset = 4 * mountainHeight * fraction * (1 - fraction);
    const y = valleyY - yOffset;
    return { x, y };
  };

  const ballPos = getBallCoords(animFraction);

  return (
    <div className="h-full w-full bg-sky-50 flex flex-col font-sans overflow-hidden selection:bg-blue-200">
      
      {/* HEADER */}
      <header className="shrink-0 bg-white shadow-sm px-4 py-3 md:px-6 md:py-4 flex justify-between items-center z-10">
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-black text-sky-800 tracking-tight leading-none">
            {lesson?.title || "Rounding Off"}
          </h1>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Interactive Sandbox</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-sky-50 px-4 py-2 rounded-full border border-sky-100 shadow-inner">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target:</span>
            <span className="text-2xl font-black text-sky-700">{formatNumber(number)}</span>
          </div>

          <button 
            onClick={() => onComplete()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-2 rounded-xl shadow-md transition-colors flex items-center gap-2 active:scale-95"
          >
            <Check size={20} /> Finish
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 w-full max-w-6xl mx-auto p-4 gap-4">
        
        {/* CONTROLS (Round To) */}
        <div className="flex justify-center items-center gap-2 mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Round to nearest:</span>
          {[10, 100, 1000].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-xl font-black text-base md:text-lg transition-all ${
                mode === m 
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' 
                  : 'bg-white border-2 border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* THE MOUNTAIN */}
        <div className="flex-1 relative bg-gradient-to-b from-sky-100 to-white rounded-3xl shadow-inner border-2 border-slate-200 overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full object-contain p-4">
            <path d={`M -200 ${valleyY} Q 0 ${peakY} ${leftValleyX} ${valleyY} Q ${peakX} ${peakY} ${rightValleyX} ${valleyY} Q ${svgWidth} ${peakY} 1000 ${valleyY}`} fill="none" stroke="#E2E8F0" strokeWidth="8" />
            <path d={`M -200 ${valleyY} Q 0 ${peakY} ${leftValleyX} ${valleyY} Q ${peakX} ${peakY} ${rightValleyX} ${valleyY} Q ${svgWidth} ${peakY} 1000 ${valleyY} L 1000 ${svgHeight} L -200 ${svgHeight} Z`} fill="#F8FAFC" />
            <path d={`M ${leftValleyX} ${valleyY} Q ${peakX} ${peakY} ${rightValleyX} ${valleyY}`} fill="none" stroke="#38BDF8" strokeWidth="12" strokeLinecap="round" />
            
            <line x1={peakX} y1={peakY - 10} x2={peakX} y2={valleyY + 20} stroke="#94A3B8" strokeWidth="3" strokeDasharray="6,6" />
            <text x={peakX} y={peakY - 15} textAnchor="middle" fill="#64748B" fontWeight="bold" fontSize="12" letterSpacing="2">TIPPING POINT</text>
            <text x={peakX} y={valleyY + 45} textAnchor="middle" fill="#94A3B8" fontWeight="bold" fontSize="18">{formatNumber(midPoint)}</text>

            <text x={leftValleyX} y={valleyY + 45} textAnchor="middle" fontWeight="900" fontSize="28" fill={isReleased && animFraction === 0 ? '#22C55E' : '#334155'} className="transition-colors duration-300">{formatNumber(lowerBound)}</text>
            <text x={rightValleyX} y={valleyY + 45} textAnchor="middle" fontWeight="900" fontSize="28" fill={isReleased && animFraction === 1 ? '#22C55E' : '#334155'} className="transition-colors duration-300">{formatNumber(upperBound)}</text>

            <g transform={`translate(${ballPos.x}, ${ballPos.y - 20})`} className="transition-transform duration-75">
              <circle cx="0" cy="0" r="20" fill="#FBBF24" stroke="#D97706" strokeWidth="4" />
              <circle cx="-6" cy="-6" r="6" fill="rgba(255,255,255,0.5)" />
              <text x="0" y="5" textAnchor="middle" fill="#78350F" fontWeight="900" fontSize="14">{number % mode}</text>
            </g>
          </svg>
          
          {isReleased && (animFraction === 0 || animFraction === 1) && (
            <div className="absolute top-4 left-0 w-full flex justify-center z-20 pointer-events-none">
              <div className="bg-emerald-500 text-white px-6 py-2 rounded-full font-black shadow-lg animate-bounce text-lg whitespace-nowrap pointer-events-auto border-4 border-emerald-400">
                {formatNumber(number)} rounds to {formatNumber(animFraction === 0 ? lowerBound : upperBound)}!
              </div>
            </div>
          )}
        </div>

        {/* PLACE VALUE BUILDER */}
        <div className="shrink-0 bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-4">
          <div className="flex justify-center gap-2 md:gap-4 max-w-4xl mx-auto">
            {PlaceValues.map((pv, idx) => {
              const isRelevant = 
                (mode === 10 && pv.name === 'Ones') || 
                (mode === 100 && (pv.name === 'Ones' || pv.name === 'Tens')) ||
                (mode === 1000 && (pv.name === 'Ones' || pv.name === 'Tens' || pv.name === 'Hundreds'));

              return (
                <div key={pv.name} className="flex flex-col items-center flex-1 max-w-[80px]">
                  <button onClick={() => handleDigitChange(idx, 1)} className="p-2 text-slate-300 hover:text-sky-500 active:scale-90 touch-none">
                    <ChevronUp className="w-8 h-8" />
                  </button>
                  <div 
                    className={`w-full aspect-square max-w-[70px] border-4 rounded-2xl flex items-center justify-center shadow-inner cursor-ns-resize touch-none select-none transition-colors ${isRelevant ? 'bg-sky-50 border-sky-300' : 'bg-slate-50 border-slate-200'}`}
                    onPointerDown={(e) => handlePointerDown(e, idx)}
                    onPointerMove={(e) => handlePointerMove(e, idx)}
                    onPointerUp={(e) => handlePointerUp(e, idx)}
                    onPointerCancel={(e) => handlePointerUp(e, idx)}
                  >
                    <span className={`text-3xl md:text-5xl font-black ${isRelevant ? 'text-sky-700' : 'text-slate-800'}`}>{digits[idx]}</span>
                  </div>
                  <button onClick={() => handleDigitChange(idx, -1)} className="p-2 text-slate-300 hover:text-sky-500 active:scale-90 touch-none">
                    <ChevronDown className="w-8 h-8" />
                  </button>
                  <span className={`text-[10px] md:text-xs font-bold mt-1 text-center uppercase tracking-widest w-full truncate ${isRelevant ? 'text-sky-600' : 'text-slate-400'}`}>{pv.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RELEASE BUTTON */}
        <div className="shrink-0 flex justify-center pb-2">
          {isReleased && (animFraction === 0 || animFraction === 1) ? (
             <button 
               onClick={() => setDigits([0,0,0,Math.floor(Math.random()*10),Math.floor(Math.random()*10),Math.floor(Math.random()*10)])}
               className="bg-slate-800 hover:bg-slate-700 text-white text-xl font-black py-4 px-10 rounded-2xl shadow-lg transition-all flex items-center gap-3 active:scale-95 touch-manipulation"
             >
               <RotateCcw className="w-6 h-6" /> Try Another Number
             </button>
          ) : (
            <button 
              onClick={handleRelease}
              disabled={isReleased || targetFraction === 0}
              className="bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white text-xl font-black py-4 px-12 rounded-2xl shadow-lg shadow-sky-200 border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <Play className="w-6 h-6 fill-white" /> 
              {targetFraction === 0 ? "Already Rounded!" : "Release Ball!"}
            </button>
          )}
        </div>

      </main>
    </div>
  );
}