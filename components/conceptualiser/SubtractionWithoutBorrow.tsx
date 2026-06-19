"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronRight, ChevronLeft, Truck, PackageCheck, CheckCircle2, ArrowRight } from 'lucide-react';

// --- Types & Data ---
type AppPhase = 'story' | 'interactive' | 'finish';
type AuditStep = 'pack' | 'delivered';

const STORY_SLIDES = [
  {
    image: '/assets/maths/FLN/SubtractionWithoutBorrow1.webp',
    text: "Rohan is staring at a half-empty crate. 'Papa, look! As we sell our fruits, our stock keeps getting smaller and smaller!'"
  },
  {
    image: '/assets/maths/FLN/SubtractionWithoutBorrow2.webp',
    text: "Papa smiles. 'Yes, Rohan! Do you remember what we call the action of taking things away? It is called Subtraction!'"
  },
  {
    image: '/assets/maths/FLN/SubtractionWithoutBorrow3.webp',
    text: "Rohan looks worried. 'But I only know how to subtract up to 20!' Papa laughs. 'It is exactly the same trick! We just pack the customer's order, and count what is left!'"
  }
];

const FRUIT_ROUNDS = [
    { id: 'apples', name: 'Apples', emoji: '🍎', initialTens: 6, initialOnes: 8, orderTens: 3, orderOnes: 4, color: 'text-red-500', bg: 'bg-red-100', border: 'border-red-400' },
    { id: 'oranges', name: 'Oranges', emoji: '🍊', initialTens: 5, initialOnes: 7, orderTens: 2, orderOnes: 5, color: 'text-orange-500', bg: 'bg-orange-100', border: 'border-orange-400' },
    { id: 'mangoes', name: 'Mangoes', emoji: '🥭', initialTens: 8, initialOnes: 9, orderTens: 4, orderOnes: 3, color: 'text-amber-500', bg: 'bg-amber-100', border: 'border-amber-400' },
    { id: 'bananas', name: 'Bananas', emoji: '🍌', initialTens: 7, initialOnes: 6, orderTens: 3, orderOnes: 1, color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-400' }
];

export default function SubtractionWithoutBorrow({ lesson, onComplete }: any) {
  const [phase, setPhase] = useState<AppPhase>('story');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Interactive State
  const [roundIndex, setRoundIndex] = useState(0);
  const [auditStep, setAuditStep] = useState<AuditStep>('pack');
  
  // Packing State
  const [truckTens, setTruckTens] = useState(0);
  const [truckOnes, setTruckOnes] = useState(0);
  
  // Math State
  const [answerInput, setAnswerInput] = useState('');
  const [isTruckAnimating, setIsTruckAnimating] = useState(false);

  const currentRound = FRUIT_ROUNDS[roundIndex];
  
  // Derived Inventory State
  const inventoryTens = currentRound.initialTens - truckTens;
  const inventoryOnes = currentRound.initialOnes - truckOnes;

  useEffect(() => { setMounted(true); }, []);

  // Reset round state
  useEffect(() => {
      setTruckTens(0);
      setTruckOnes(0);
      setAnswerInput('');
      setIsTruckAnimating(false);
  }, [roundIndex]);

  // --- Audio Engine ---
  const audioCtx = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (typeof window === 'undefined') return;
    if (!audioCtx.current) {
      const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (WinAudioContext) audioCtx.current = new WinAudioContext();
    }
    if (audioCtx.current && audioCtx.current.state === 'suspended') audioCtx.current.resume();
  };

  const playSound = (type: 'pop' | 'kaching' | 'error' | 'whoosh' | 'truck') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'pop') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    } else if (type === 'kaching') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
    } else if (type === 'whoosh') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    } else if (type === 'error') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
    } else if (type === 'truck') {
      osc.type = 'square'; osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
    }
    
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + (type === 'truck' ? 0.5 : 0.2));
  };

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            resolve(); return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN'; 
        utterance.rate = 0.9; 
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => { setIsSpeaking(false); resolve(); };
        utterance.onerror = () => { setIsSpeaking(false); resolve(); };
        window.speechSynthesis.speak(utterance);
    });
  };

  // --- Actions ---
  const handleNextSlide = () => {
    initAudio(); playSound('pop'); window.speechSynthesis.cancel();
    if (currentSlide < STORY_SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      setPhase('interactive');
      playSound('kaching');
    }
  };

  const handlePrevSlide = () => {
    initAudio(); playSound('pop'); window.speechSynthesis.cancel();
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  const handleMoveToTruck = (type: 'ten' | 'one') => {
      playSound('pop');
      if (type === 'ten' && inventoryTens > 0) setTruckTens(prev => prev + 1);
      if (type === 'one' && inventoryOnes > 0) setTruckOnes(prev => prev + 1);
  };

  const handleMoveToInventory = (type: 'ten' | 'one') => {
      playSound('pop');
      if (type === 'ten' && truckTens > 0) setTruckTens(prev => prev - 1);
      if (type === 'one' && truckOnes > 0) setTruckOnes(prev => prev - 1);
  };

  const handleDeliver = async () => {
      
      setIsTruckAnimating(true);
      await speakText(`Order sent!`);
      
      setTimeout(() => {
          setAuditStep('delivered');
          playSound('whoosh');
      }, 600); // Wait for CSS animation
  };

  const handleCheckAnswer = () => {
      const expectedTens = currentRound.initialTens - currentRound.orderTens;
      const expectedOnes = currentRound.initialOnes - currentRound.orderOnes;
      const expectedTotal = (expectedTens * 10) + expectedOnes;

      if (Number(answerInput) === expectedTotal) {
          playSound('kaching');
          if (roundIndex < FRUIT_ROUNDS.length - 1) {
              setRoundIndex(prev => prev + 1);
              setAuditStep('pack');
          } else {
              setPhase('finish');
          }
      } else {
          playSound('error');
      }
  };

  if (!mounted) return null;

  // ============================================================================
  // REUSABLE COMPONENTS
  // ============================================================================
  const BoxOf10 = ({ emoji, colorStyle, onClick, clickable }: { emoji: string, colorStyle: string, onClick?: () => void, clickable?: boolean }) => (
      <div 
        onClick={onClick}
        className={`relative ${colorStyle} rounded border-2 border-black/20 p-1 shadow-sm w-[40px] md:w-[60px] shrink-0 flex flex-col items-center transition-transform animate-fade-in ${clickable ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
      >
          <div className="absolute -top-2 bg-black/60 text-white text-[6px] md:text-[8px] font-black uppercase px-1 rounded z-10">10</div>
          <div className="grid grid-cols-5 gap-0.5 bg-white/50 p-0.5 rounded border border-black/10 w-full mt-1">
              {Array.from({length: 10}).map((_, i) => (
                  <div key={i} className="aspect-square bg-white/80 rounded-[2px] flex items-center justify-center shadow-inner">
                      <span className="text-[6px] md:text-[8px]">{emoji}</span>
                  </div>
              ))}
          </div>
      </div>
  );

  const LooseItem = ({ emoji, onClick, clickable }: { emoji: string, onClick?: () => void, clickable?: boolean }) => (
      <div 
        onClick={onClick}
        className={`w-4 h-4 md:w-6 md:h-6 bg-white rounded border border-slate-200 flex items-center justify-center shadow-sm shrink-0 transition-transform animate-fade-in ${clickable ? 'cursor-pointer hover:scale-125 active:scale-95 hover:bg-slate-50 border-slate-300' : ''}`}
      >
          <span className="text-[8px] md:text-sm">{emoji}</span>
      </div>
  );

  const isOrderExact = truckTens === currentRound.orderTens && truckOnes === currentRound.orderOnes;

  // ============================================================================
  // RENDER: STORY PHASE
  // ============================================================================
  if (phase === 'story') {
      const slide = STORY_SLIDES[currentSlide];
      return (
        <div className="w-full h-full flex flex-col bg-slate-50 font-sans md:rounded-3xl overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col p-3 md:p-6">
             <div className="max-w-4xl w-full mx-auto flex flex-col h-full gap-3 md:gap-4">
                <div className="flex-1 min-h-0 w-full bg-slate-200 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-4 border-white shadow-md relative">
                   <img src={slide.image} alt="Story scene" className="absolute inset-0 w-full h-full object-contain bg-sky-50 z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                   <button 
                     onClick={() => { initAudio(); speakText(slide.text); }}
                     className={`absolute top-3 right-3 md:top-4 md:right-4 z-20 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border-b-4 transition-all shadow-lg ${isSpeaking ? 'bg-amber-100 text-amber-500 border-amber-200 animate-pulse' : 'bg-sky-500 text-white border-sky-700 hover:bg-sky-400'}`}
                   >
                     <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                   </button>
                </div>
                <div className="shrink-0 bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border-4 border-slate-100 shadow-sm flex items-center justify-center text-center">
                   <p className="text-sm md:text-lg lg:text-xl font-bold text-slate-700 leading-snug md:leading-relaxed max-w-2xl">{slide.text}</p>
                </div>
             </div>
          </div>
          <div className="shrink-0 p-2 md:p-4 flex justify-between items-center max-w-4xl mx-auto w-full">
             <button onClick={handlePrevSlide} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${currentSlide === 0 ? 'invisible' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
               <ChevronLeft size={16} /> Back
             </button>
             <button onClick={handleNextSlide} className="px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 bg-sky-500 hover:bg-sky-400 text-white border-b-4 border-sky-700 active:border-b-0">
               {currentSlide === STORY_SLIDES.length - 1 ? 'Start Packing' : 'Next'} <ChevronRight size={16} />
             </button>
          </div>
        </div>
      );
  }

  // ============================================================================
  // RENDER: FINISH PHASE
  // ============================================================================
  if (phase === 'finish') {
      return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 font-sans md:rounded-3xl p-6 text-center animate-fade-in-up">
              <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl bg-emerald-100 border-4 border-emerald-300">
                  <CheckCircle2 size={64} className="text-emerald-500"/>
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-2">Master Cashier!</h2>
              <p className="text-slate-500 font-bold text-lg mb-8">You successfully packed all orders and calculated the stock!</p>
              <button 
                  onClick={onComplete}
                  className="bg-emerald-500 text-slate-950 px-8 py-4 rounded-2xl font-black tracking-wide shadow-[0_6px_0_rgb(16,185,129)] active:translate-y-[6px] active:shadow-none transition-all flex items-center gap-2"
              >
                  Complete Lesson <ChevronRight />
              </button>
          </div>
      );
  }

  // ============================================================================
  // RENDER: INTERACTIVE PHASE
  // ============================================================================
  return (
    <div className="w-full h-full flex flex-col bg-slate-900 font-sans md:rounded-3xl overflow-hidden relative">
      
      {/* HEADER */}
      <div className="w-full shrink-0 p-3 md:p-4 z-20 bg-slate-800 border-b-2 border-slate-700 shadow-sm flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
              <div className={`w-8 h-8 md:w-10 md:h-10 ${currentRound.bg} rounded-full flex items-center justify-center text-lg md:text-xl`}>{currentRound.emoji}</div>
              <h2 className="text-base md:text-xl font-black tracking-widest uppercase">Subtraction (Take Away)</h2>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-700 px-3 py-1 rounded-full">Order {roundIndex + 1} / {FRUIT_ROUNDS.length}</span>
      </div>

      {/* DUAL WORKSPACE */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-2 md:p-4 gap-2 md:gap-4 overflow-hidden relative">
          
          {/* LEFT: INVENTORY (Shop Stock) */}
          <div className={`flex-[1.5] flex flex-col bg-white rounded-2xl md:rounded-[2rem] border-4 border-slate-200 overflow-hidden shadow-sm relative transition-all duration-700 ${auditStep === 'delivered' ? 'flex-[2]' : ''}`}>
              <div className="text-center py-2 bg-slate-100 border-b-2 border-slate-200 font-black text-slate-500 uppercase tracking-widest text-[10px] md:text-xs">
                  Inventory Stock {auditStep === 'pack' ? `(Started with ${(currentRound.initialTens * 10) + currentRound.initialOnes})` : ''}
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row p-2 md:p-4">
                  {/* Inventory Tens */}
                  <div className="flex-1 border-b-2 md:border-b-0 md:border-r-2 border-slate-100 p-2 md:p-4 flex flex-col items-center">
                      <span className="text-slate-400 font-black text-xs uppercase tracking-widest mb-4">Boxes (Tens)</span>
                      <div className="flex flex-wrap gap-2 justify-center content-start w-full">
                          {Array.from({length: inventoryTens}).map((_, i) => (
                              <BoxOf10 
                                  key={`inv-t-${i}`} 
                                  emoji={currentRound.emoji} 
                                  colorStyle={currentRound.bg} 
                                  clickable={auditStep === 'pack'}
                                  onClick={() => auditStep === 'pack' && handleMoveToTruck('ten')} 
                              />
                          ))}
                      </div>
                  </div>

                  {/* Inventory Ones */}
                  <div className="flex-1 p-2 md:p-4 flex flex-col items-center">
                      <span className="text-slate-400 font-black text-xs uppercase tracking-widest mb-4">Loose (Ones)</span>
                      <div className="flex flex-wrap gap-1 md:gap-2 justify-center content-start w-full max-w-[200px]">
                          {Array.from({length: inventoryOnes}).map((_, i) => (
                              <LooseItem 
                                  key={`inv-o-${i}`} 
                                  emoji={currentRound.emoji} 
                                  clickable={auditStep === 'pack'}
                                  onClick={() => auditStep === 'pack' && handleMoveToTruck('one')}
                              />
                          ))}
                      </div>
                  </div>
              </div>
              
              {/* Hint Overlay during Pack step */}
              {auditStep === 'pack' && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-slate-400 font-bold text-xs bg-white/90 px-4 py-1 rounded-full shadow-sm pointer-events-none">
                      Tap items to pack them
                  </div>
              )}
          </div>

          {/* RIGHT: TRUCK OR MATH */}
          {auditStep === 'pack' ? (
              // DELIVERY TRUCK PANEL
              <div className={`flex-1 flex flex-col bg-slate-800 rounded-2xl md:rounded-[2rem] border-4 border-slate-700 overflow-hidden shadow-xl relative transition-transform duration-700 ${isTruckAnimating ? 'translate-x-[150%]' : 'translate-x-0'}`}>
                  <div className="text-center py-2 bg-slate-900 border-b-2 border-slate-700 font-black text-emerald-400 uppercase tracking-widest text-[10px] md:text-xs">
                      Order: {(currentRound.orderTens * 10) + currentRound.orderOnes} {currentRound.name}
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
                      {/* Faded background icon */}
                      <Truck className="absolute text-slate-700/50 w-32 h-32 md:w-48 md:h-48 z-0 pointer-events-none" />
                      
                      {/* Truck Contents */}
                      <div className="z-10 w-full flex flex-col gap-4">
                          {/* Truck Tens */}
                          <div className="w-full flex flex-col items-center">
                              <span className="text-slate-500 font-black text-[10px] uppercase mb-1">Packed Boxes ({truckTens}/{currentRound.orderTens})</span>
                              <div className="flex flex-wrap gap-2 justify-center min-h-[50px]">
                                  {Array.from({length: truckTens}).map((_, i) => (
                                      <BoxOf10 
                                          key={`trk-t-${i}`} 
                                          emoji={currentRound.emoji} 
                                          colorStyle={currentRound.bg} 
                                          clickable={true}
                                          onClick={() => handleMoveToInventory('ten')} 
                                      />
                                  ))}
                              </div>
                          </div>
                          
                          {/* Truck Ones */}
                          <div className="w-full flex flex-col items-center">
                              <span className="text-slate-500 font-black text-[10px] uppercase mb-1">Packed Loose ({truckOnes}/{currentRound.orderOnes})</span>
                              <div className="flex flex-wrap gap-1 md:gap-2 justify-center min-h-[40px] max-w-[150px]">
                                  {Array.from({length: truckOnes}).map((_, i) => (
                                      <LooseItem 
                                          key={`trk-o-${i}`} 
                                          emoji={currentRound.emoji} 
                                          clickable={true}
                                          onClick={() => handleMoveToInventory('one')}
                                      />
                                  ))}
                              </div>
                          </div>
                      </div>

                      {/* Deliver Button (Only shows when exactly packed) */}
                      <div className="absolute bottom-4 left-0 w-full flex justify-center z-20 h-16">
                          {isOrderExact ? (
                              <button 
                                  onClick={handleDeliver}
                                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-black tracking-widest uppercase flex items-center gap-2 shadow-[0_4px_0_rgb(16,185,129)] active:translate-y-[4px] active:shadow-none animate-bounce"
                              >
                                  Deliver Order <ArrowRight size={20} />
                              </button>
                          ) : (
                              <div className="text-rose-400/80 font-bold text-xs bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20">
                                  Pack exact order to deliver
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          ) : (
              // ABSTRACT MATH PANEL
              <div className="flex-1 flex flex-col bg-slate-800 rounded-2xl md:rounded-[2rem] border-4 border-slate-700 overflow-hidden shadow-xl relative animate-fade-in">
                  <div className="text-center py-2 bg-slate-900 border-b-2 border-slate-700 font-black text-sky-400 uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-2">
                      <PackageCheck size={16} /> Order Delivered!
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center p-4">
                      {/* Vertical Subtraction */}
                      <div className="grid grid-cols-[auto_1fr_1fr] gap-x-4 md:gap-x-8 gap-y-2 text-center font-black text-4xl md:text-6xl text-slate-300 items-center">
                          
                          {/* Headers */}
                          <div></div>
                          <div className="text-sm md:text-lg text-slate-500 uppercase tracking-widest">Tens</div>
                          <div className="text-sm md:text-lg text-slate-500 uppercase tracking-widest">Ones</div>

                          {/* Initial Stock */}
                          <div className="text-right pr-2">
                              <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wider block leading-tight">Start</span>
                          </div>
                          <div>{currentRound.initialTens}</div>
                          <div>{currentRound.initialOnes}</div>

                          {/* Order Subtracted */}
                          <div className="text-right pr-2 relative">
                              <span className="absolute -left-6 md:-left-8 top-1/2 -translate-y-1/2 text-rose-400 text-3xl md:text-5xl font-black">−</span>
                              <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wider block leading-tight">Order</span>
                          </div>
                          <div className="text-rose-300">{currentRound.orderTens}</div>
                          <div className="text-rose-300">{currentRound.orderOnes}</div>

                          {/* Divider */}
                          <div className="col-span-3 border-t-4 border-slate-600 my-2"></div>

                          {/* Final Answer Input */}
                          <div className="text-right pr-2">
                              <span className="text-[10px] md:text-xs text-sky-400 uppercase tracking-wider block leading-tight">Left</span>
                          </div>
                          <div className="col-span-2 flex justify-center w-full">
                              <input 
                                  type="text" 
                                  inputMode="numeric"
                                  maxLength={2}
                                  value={answerInput}
                                  onChange={e => {
                                      playSound('pop');
                                      setAnswerInput(e.target.value.replace(/[^0-9]/g, ''));
                                  }}
                                  placeholder="?"
                                  className={`w-24 h-16 md:w-32 md:h-20 text-center rounded-2xl outline-none transition-all tracking-[0.5em] bg-slate-700 border-2 text-sky-400 ${
                                      answerInput === '' ? 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.5)] animate-pulse placeholder:text-slate-500' : 'border-slate-500 focus:border-sky-400 focus:shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                                  }`}
                              />
                          </div>
                      </div>
                  </div>

                  <div className="p-4 bg-slate-900 shrink-0">
                      <button 
                          onClick={handleCheckAnswer}
                          disabled={answerInput === ''}
                          className={`w-full py-4 rounded-xl font-black text-lg tracking-wide transition-all shadow-[0_4px_0_rgb(14,165,233)] active:translate-y-[4px] active:shadow-none
                              ${answerInput !== '' ? 'bg-sky-500 text-white hover:bg-sky-400 cursor-pointer' : 'bg-slate-700 text-slate-500 border-slate-600 shadow-none cursor-not-allowed'}`}
                      >
                          Check Math
                      </button>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
}