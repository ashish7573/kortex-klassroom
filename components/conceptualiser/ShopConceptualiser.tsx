'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Book, Eraser, Pencil, Palette, ShoppingBag, Store, Wallet, AlertCircle, CheckCircle2, Scissors, Ruler, Apple, Calculator, Paintbrush, Backpack } from 'lucide-react';

// --- Data Models ---
const SHOP_ITEMS = [
  { id: 'scissors', name: 'Scissors', cost: 1, icon: Scissors, color: 'text-rose-500', bg: 'bg-rose-100' },
  { id: 'eraser', name: 'Eraser', cost: 2, icon: Eraser, color: 'text-pink-500', bg: 'bg-pink-100' },
  { id: 'pencil', name: 'Pencil', cost: 3, icon: Pencil, color: 'text-amber-500', bg: 'bg-amber-100' },
  { id: 'notebook', name: 'Notebook', cost: 4, icon: Book, color: 'text-blue-500', bg: 'bg-blue-100' },
  { id: 'colors', name: 'Colors', cost: 5, icon: Palette, color: 'text-purple-500', bg: 'bg-purple-100' },
  { id: 'ruler', name: 'Ruler', cost: 6, icon: Ruler, color: 'text-cyan-500', bg: 'bg-cyan-100' },
  { id: 'apple', name: 'Apple', cost: 7, icon: Apple, color: 'text-red-500', bg: 'bg-red-100' },
  { id: 'paint', name: 'Paint', cost: 8, icon: Paintbrush, color: 'text-orange-500', bg: 'bg-orange-100' },
  { id: 'calculator', name: 'Calculator', cost: 9, icon: Calculator, color: 'text-slate-500', bg: 'bg-slate-100' },
  { id: 'bag', name: 'Bag', cost: 10, icon: Backpack, color: 'text-emerald-500', bg: 'bg-emerald-100' },
];

interface Coin {
  id: number;
  status: 'wallet' | 'desk' | 'paid';
  slotIndex: number | null; 
}

export default function ShopConceptualiser({ lesson, onComplete }: any) {
  const [uiState, setUiState] = useState<'menu' | 'shopping' | 'gameover'>('menu');
  const [activeItem, setActiveItem] = useState<typeof SHOP_ITEMS[0] | null>(null);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [shopkeeperEarnings, setShopkeeperEarnings] = useState(0);
  
  const [warning, setWarning] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const audioCtx = useRef<AudioContext | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const initAudio = () => {
    if (typeof window === 'undefined') return;
    if (!audioCtx.current) {
      const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (WinAudioContext) audioCtx.current = new WinAudioContext();
    }
    if (audioCtx.current && audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
    if ('speechSynthesis' in window) {
      const unlockSpeech = new SpeechSynthesisUtterance('');
      unlockSpeech.volume = 0; 
      window.speechSynthesis.speak(unlockSpeech);
    }
  };

  const playSound = (type: 'pop' | 'error' | 'kaching' | 'slide') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'kaching') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'slide') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    }
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

  const startGame = () => {
    initAudio();
    setCoins(Array.from({ length: 60 }, (_, i) => ({ id: i, status: 'wallet', slotIndex: null })));
    setPurchasedItems([]);
    setShopkeeperEarnings(0);
    setActiveItem(null);
    setUiState('shopping');
  };

  const selectItem = (item: typeof SHOP_ITEMS[0]) => {
    if (successAnim) return; 
    playSound('slide');
    setCoins(prev => prev.map(c => c.status === 'desk' ? { ...c, status: 'wallet', slotIndex: null } : c));
    setActiveItem(item);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, coin: Coin) => {
    if (coin.status === 'paid' || successAnim) return;
    initAudio();
    playSound('pop');
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - (rect.left + rect.width / 2), y: e.clientY - (rect.top + rect.height / 2) });
    setDragPos({ x: e.clientX, y: e.clientY });
    setActiveDragId(coin.id);
    
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragId === null) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragId === null) return;
    
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch (err) {}

    if (activeItem) {
      let droppedOnSlot: number | null = null;
      
      slotRefs.current.forEach((ref, index) => {
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        const padding = 25; 
        if (e.clientX >= rect.left - padding && e.clientX <= rect.right + padding &&
            e.clientY >= rect.top - padding && e.clientY <= rect.bottom + padding) {
          droppedOnSlot = index;
        }
      });

      if (droppedOnSlot !== null) {
        const slotOccupied = coins.some(c => c.status === 'desk' && c.slotIndex === droppedOnSlot && c.id !== activeDragId);
        
        if (!slotOccupied) {
          setCoins(prev => prev.map(c => c.id === activeDragId ? { ...c, status: 'desk', slotIndex: droppedOnSlot } : c));
          playSound('pop');
          
          const coinsOnDeskCount = coins.filter(c => c.status === 'desk' && c.id !== activeDragId).length + 1;
          speakNumber(coinsOnDeskCount);
        } else {
          playSound('slide'); 
        }
      } else {
        setCoins(prev => prev.map(c => c.id === activeDragId ? { ...c, status: 'wallet', slotIndex: null } : c));
        playSound('slide'); 
      }
    } else {
      playSound('slide'); 
    }
    setActiveDragId(null);
  };

  const handleBuy = () => {
    if (!activeItem) return;

    const coinsOnDesk = coins.filter(c => c.status === 'desk');
    
    if (coinsOnDesk.length === activeItem.cost) {
      playSound('kaching');
      setSuccessAnim(true);
      
      setTimeout(() => {
        setPurchasedItems(prev => [...prev, activeItem.id]);
        setShopkeeperEarnings(prev => prev + activeItem.cost);
        setCoins(prev => prev.map(c => c.status === 'desk' ? { ...c, status: 'paid', slotIndex: null } : c));
        setActiveItem(null);
        setSuccessAnim(false);

        if (purchasedItems.length === SHOP_ITEMS.length) {
           setTimeout(() => setUiState('gameover'), 1000);
        }
      }, 1500);

    } else {
      playSound('error');
      setWarning(true);
      setTimeout(() => setWarning(false), 2000);
    }
  };

  const ShinyCoin = () => (
    <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-md">
      <circle cx="20" cy="20" r="18" fill="#d97706" />
      <circle cx="20" cy="18" r="18" fill="#fbbf24" />
      <circle cx="20" cy="18" r="14" fill="#f59e0b" />
      <ellipse cx="16" cy="12" rx="6" ry="3" fill="#fef08a" opacity="0.6" transform="rotate(-30 16 12)" />
    </svg>
  );

  const GhostCoin = () => (
    <div className="w-full h-full rounded-full border-4 border-dashed border-slate-300 bg-slate-200/50 flex items-center justify-center">
      <div className="w-1/2 h-1/2 rounded-full border-2 border-dashed border-slate-300/50"></div>
    </div>
  );

  return (
    <div 
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full overflow-hidden bg-slate-50 font-sans touch-none select-none flex flex-col min-h-0"
    >
      {/* HEADER */}
      <div className="h-16 bg-white border-b-4 border-slate-200 flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl">
            <Store className="text-white w-5 h-5" />
          </div>
          <h1 className="text-slate-800 font-black text-lg uppercase leading-none">Let's Buy!</h1>
        </div>
        {uiState === 'shopping' && (
          <button onClick={() => setUiState('menu')} className="bg-slate-100 text-slate-500 p-2 rounded-xl font-bold transition-transform active:scale-95">
             <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* RESPONSIVE PLAY AREA */}
      <div className="flex-1 flex flex-col md:flex-row w-full h-full min-h-0">
        
        {/* SECTION 1: SHOPKEEPER */}
        <div className="w-full md:w-[30%] h-[20%] md:h-full bg-indigo-50 border-b-4 md:border-b-0 md:border-r-4 border-slate-200 flex flex-col p-2 md:p-4 shrink-0 min-h-0 overflow-hidden">
           <div className="flex items-center gap-2 mb-2 bg-indigo-100 p-2 rounded-xl shrink-0">
             <Store className="text-indigo-600 w-5 h-5 md:w-6 md:h-6" />
             <span className="font-black text-indigo-900 text-xs md:text-sm uppercase tracking-wider">Shop</span>
             <div className="ml-auto flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg border border-amber-300">
               <span className="text-amber-700 font-black text-xs md:text-sm">{shopkeeperEarnings}</span>
               <div className="w-3 h-3 md:w-4 md:h-4"><ShinyCoin/></div>
             </div>
           </div>

           {/* Mobile: Horizontal scroll | Desktop: 2-column vertical grid */}
           <div className="flex-1 overflow-x-auto md:overflow-y-auto touch-pan-x md:touch-pan-y">
              <div className="flex flex-row md:grid md:grid-cols-2 gap-2 md:gap-3 h-full md:h-auto pb-2 pr-2">
                 {SHOP_ITEMS.map((item) => {
                   const isBought = purchasedItems.includes(item.id);
                   const isSelected = activeItem?.id === item.id;
                   const Icon = item.icon;

                   return (
                     <div 
                       key={item.id}
                       onClick={() => !isBought && selectItem(item)}
                       className={`shrink-0 w-24 md:w-full flex flex-col items-center justify-center p-2 rounded-2xl border-b-4 transition-transform text-center
                         ${isBought ? 'bg-slate-200 border-slate-300 opacity-50 cursor-not-allowed' : 
                           isSelected ? `${item.bg} border-${item.color.split('-')[1]}-400 scale-[1.02] shadow-md` : 
                           'bg-white border-slate-300 cursor-pointer hover:-translate-y-1'}`}
                     >
                        <div className={`p-2 rounded-xl mb-1 ${item.bg}`}>
                           <Icon className={`w-5 h-5 md:w-6 md:h-6 ${item.color}`} />
                        </div>
                        <span className={`font-black text-[10px] md:text-xs leading-tight mb-1 ${isBought ? 'text-slate-500' : 'text-slate-800'}`}>
                           {item.name}
                        </span>
                        <div className="flex items-center gap-1">
                           <span className="font-bold text-slate-500 text-xs">{item.cost}</span>
                           <div className="w-3 h-3"><ShinyCoin/></div>
                        </div>
                        {isBought && <CheckCircle2 className="absolute top-1 right-1 text-emerald-500 w-4 h-4 md:w-5 md:h-5" />}
                     </div>
                   )
                 })}
              </div>
           </div>
        </div>

        {/* SECTION 2: TRANSACTION DESK */}
        <div className="w-full md:w-[40%] h-[50%] md:h-full bg-amber-50 relative flex flex-col items-center justify-center p-2 md:p-4 shrink-0 min-h-0">
           <div className="absolute inset-x-2 bottom-2 top-8 md:inset-8 bg-amber-100 rounded-[2rem] border-4 border-amber-200 shadow-inner"></div>

           {activeItem ? (
             <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
                
                <div className={`p-4 md:p-6 rounded-3xl bg-white shadow-xl border-4 border-slate-100 mb-4 transition-all duration-500
                  ${successAnim ? 'scale-0 opacity-0 translate-x-20' : 'scale-100 opacity-100'}`}>
                   {React.createElement(activeItem.icon, { className: `w-10 h-10 md:w-16 md:h-16 ${activeItem.color}` })}
                </div>

                <div className={`flex flex-wrap justify-center gap-2 md:gap-3 mb-4 transition-all duration-500 ${successAnim ? 'opacity-0' : 'opacity-100'}`}>
                   {Array.from({ length: activeItem.cost }).map((_, i) => {
                     const occupyingCoin = coins.find(c => c.status === 'desk' && c.slotIndex === i);
                     const isDraggingThis = activeDragId === occupyingCoin?.id;

                     return (
                       <div key={i} ref={el => { slotRefs.current[i] = el; }} className="relative w-8 h-8 md:w-12 md:h-12 shrink-0">
                          <GhostCoin />
                          {occupyingCoin && (
                             <div 
                               onPointerDown={(e) => handlePointerDown(e, occupyingCoin)}
                               className={`absolute inset-0 cursor-grab active:cursor-grabbing transition-opacity touch-none select-none ${isDraggingThis ? 'opacity-0' : 'opacity-100'}`}
                             >
                                <ShinyCoin />
                             </div>
                          )}
                       </div>
                     )
                   })}
                </div>

                <div className="relative h-12 md:h-16 w-full flex items-center justify-center">
                   {warning ? (
                     <div className="absolute flex items-center gap-2 bg-rose-100 text-rose-600 px-4 py-2 md:px-6 md:py-3 rounded-full font-black animate-bounce border-2 border-rose-300 text-sm md:text-base">
                        <AlertCircle className="w-4 h-4 md:w-5 md:h-5" /> Need more!
                     </div>
                   ) : successAnim ? (
                     <div className="absolute flex items-center gap-2 bg-emerald-100 text-emerald-600 px-4 py-2 md:px-6 md:py-3 rounded-full font-black animate-bounce border-2 border-emerald-300 text-sm md:text-base">
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> Bought!
                     </div>
                   ) : (
                     <button 
                       onClick={handleBuy}
                       className="absolute bg-emerald-500 text-white px-6 py-2 md:px-8 md:py-3 rounded-full font-black text-sm md:text-xl shadow-lg border-b-4 border-emerald-700 transition-transform active:translate-y-1 hover:bg-emerald-400 flex items-center gap-2"
                     >
                        LET'S BUY
                     </button>
                   )}
                </div>
             </div>
           ) : (
             <div className="relative z-10 text-center text-amber-600/50 font-black text-sm md:text-2xl uppercase tracking-widest max-w-[200px]">
               Tap an item in the shop
             </div>
           )}
        </div>

        {/* SECTION 3: CHILD'S WALLET */}
        <div className="w-full md:w-[30%] h-[30%] md:h-full bg-slate-100 border-t-4 md:border-t-0 md:border-l-4 border-slate-200 flex flex-col p-2 md:p-4 shrink-0 min-h-0 overflow-hidden">
           <div className="flex items-center justify-between mb-2 bg-white p-2 rounded-xl shadow-sm shrink-0">
             <div className="flex items-center gap-2">
               <Wallet className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />
               <span className="font-black text-slate-700 text-[10px] md:text-xs uppercase tracking-wider">Wallet</span>
             </div>
             <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
               <ShoppingBag className="text-slate-400 w-3 h-3 md:w-4 md:h-4" />
               <span className="font-bold text-slate-600 text-[10px] md:text-xs">{purchasedItems.length}/{SHOP_ITEMS.length}</span>
             </div>
           </div>

           {/* Mobile: Horizontal scroll | Desktop: Vertical scroll */}
           <div className="flex-1 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto touch-pan-x md:touch-pan-y pt-2 pb-4 px-2">
             <div className="flex flex-row justify-center gap-3 md:gap-4 md:flex-wrap w-max mx-auto md:w-full">
                {Array.from({ length: 6 }).map((_, colIndex) => {
                  const colCoins = coins.filter(c => c.status === 'wallet').slice(colIndex * 10, (colIndex + 1) * 10);
                  if (colCoins.length === 0) return null;

                  return (
                    <div key={colIndex} className="flex flex-col items-center w-8 md:w-12 shrink-0">
                      {colCoins.map((coin, index) => {
                        const isDragging = activeDragId === coin.id;
                        return (
                          <div 
                            key={coin.id}
                            onPointerDown={(e) => handlePointerDown(e, coin)}
                            className={`w-8 h-8 md:w-12 md:h-12 cursor-grab active:cursor-grabbing transition-opacity touch-none select-none relative
                              ${isDragging ? 'opacity-0' : 'opacity-100 hover:scale-105'}
                              ${index > 0 ? '-mt-[1.2rem] md:-mt-[1.5rem]' : ''}
                            `}
                            style={{ zIndex: 10 - index }} 
                          >
                             <ShinyCoin />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
             </div>
           </div>
        </div>

      </div>

      {/* DRAGGABLE CLONE */}
      {activeDragId !== null && (() => {
         const draggedCoin = coins.find(c => c.id === activeDragId);
         if (!draggedCoin) return null;
         return (
            <div
              className="fixed pointer-events-none z-50 flex items-center justify-center drop-shadow-2xl scale-125 md:scale-150"
              style={{
                left: `${dragPos.x - dragOffset.x}px`,
                top: `${dragPos.y - dragOffset.y}px`,
                width: '48px', height: '48px',
                transform: `translate(-50%, -50%)`
              }}
            >
              <ShinyCoin />
            </div>
         );
      })()}

      {/* MENU OVERLAY */}
      {uiState === 'menu' && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl text-center border-4 border-slate-100">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
               <ShoppingBag className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2 tracking-tight">Let's Buy!</h2>
            <p className="text-slate-500 font-bold mb-8">Match the coins to pay the shopkeeper.</p>
            <button onClick={startGame} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xl rounded-2xl shadow-xl border-b-6 border-emerald-700 transition-transform active:translate-y-1 flex items-center justify-center gap-2">
               <Play fill="currentColor" /> START SHOPPING
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {uiState === 'gameover' && (
        <div className="absolute inset-x-0 top-16 md:top-24 z-50 flex items-start justify-center p-4 pointer-events-none animate-fade-in">
           <div className="bg-slate-900/95 backdrop-blur-md rounded-[2rem] p-4 md:px-8 md:py-4 shadow-2xl border-2 border-emerald-500 flex flex-col md:flex-row items-center gap-4 md:gap-8 pointer-events-auto">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-10 h-10 text-emerald-400" />
                <div className="text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-none mb-1">Shopping Done!</h2>
                  <p className="text-emerald-400 font-black uppercase tracking-widest text-[10px] md:text-xs">You bought everything</p>
                </div>
              </div>
              <div className="flex gap-3 md:border-l-2 border-slate-700 md:pl-8 w-full md:w-auto">
                 <button onClick={startGame} className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 font-black text-xs md:text-sm rounded-xl border-b-4 border-slate-700 transition-transform active:translate-y-1">REPLAY</button>
                 <button onClick={() => onComplete?.()} className="flex-1 px-6 py-3 bg-emerald-500 text-white font-black text-xs md:text-sm rounded-xl border-b-4 border-emerald-700 transition-transform active:translate-y-1">NEXT LESSON</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}