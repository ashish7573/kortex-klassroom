'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Book, Eraser, Pencil, Palette, ShoppingBag, Store, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';

// --- Data Models ---
const SHOP_ITEMS = [
  { id: 'notebook', name: 'Notebook', cost: 4, icon: Book, color: 'text-blue-500', bg: 'bg-blue-100' },
  { id: 'pencil', name: 'Pencil', cost: 3, icon: Pencil, color: 'text-amber-500', bg: 'bg-amber-100' },
  { id: 'eraser', name: 'Eraser', cost: 2, icon: Eraser, color: 'text-pink-500', bg: 'bg-pink-100' },
  { id: 'colors', name: 'Colors', cost: 5, icon: Palette, color: 'text-purple-500', bg: 'bg-purple-100' },
];

interface Coin {
  id: number;
  status: 'wallet' | 'desk' | 'paid';
  slotIndex: number | null; // If on desk, which slot is it filling?
}

export default function ShopConceptualiser({ lesson, onComplete }: any) {
  const [uiState, setUiState] = useState<'menu' | 'shopping' | 'gameover'>('menu');
  const [activeItem, setActiveItem] = useState<typeof SHOP_ITEMS[0] | null>(null);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [shopkeeperEarnings, setShopkeeperEarnings] = useState(0);
  
  // Feedback States
  const [warning, setWarning] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  // Drag State
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const audioCtx = useRef<AudioContext | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- Audio Synthesis (iOS Safe) ---
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
      // Simple register bell
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

  // --- Game Math ---
  const startGame = () => {
    initAudio();
    // Generate exactly 20 shiny coins in the wallet
    setCoins(Array.from({ length: 20 }, (_, i) => ({ id: i, status: 'wallet', slotIndex: null })));
    setPurchasedItems([]);
    setShopkeeperEarnings(0);
    setActiveItem(null);
    setUiState('shopping');
  };

  const selectItem = (item: typeof SHOP_ITEMS[0]) => {
    if (successAnim) return; // Prevent clicking during animation
    playSound('slide');
    // Return any coins currently on the desk back to the wallet
    setCoins(prev => prev.map(c => c.status === 'desk' ? { ...c, status: 'wallet', slotIndex: null } : c));
    setActiveItem(item);
  };

  // --- Drag & Drop Physics ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, coin: Coin) => {
    if (coin.status === 'paid' || successAnim) return;
    initAudio();
    playSound('pop');
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - (rect.left + rect.width / 2), y: e.clientY - (rect.top + rect.height / 2) });
    setDragPos({ x: e.clientX, y: e.clientY });
    setActiveDragId(coin.id);
    
    if (stageRef.current) stageRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragId === null) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragId === null) return;
    if (stageRef.current) stageRef.current.releasePointerCapture(e.pointerId);

    if (activeItem) {
      let droppedOnSlot: number | null = null;
      
      // Check collision with ghost slots
      slotRefs.current.forEach((ref, index) => {
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        const padding = 20; 
        if (e.clientX >= rect.left - padding && e.clientX <= rect.right + padding &&
            e.clientY >= rect.top - padding && e.clientY <= rect.bottom + padding) {
          droppedOnSlot = index;
        }
      });

      if (droppedOnSlot !== null) {
        // Check if slot is empty
        const slotOccupied = coins.some(c => c.status === 'desk' && c.slotIndex === droppedOnSlot && c.id !== activeDragId);
        
        if (!slotOccupied) {
          // Snap to slot
          setCoins(prev => prev.map(c => c.id === activeDragId ? { ...c, status: 'desk', slotIndex: droppedOnSlot } : c));
          playSound('pop');
          
          // Calculate how many coins are now on the desk to speak the number
          const coinsOnDeskCount = coins.filter(c => c.status === 'desk' && c.id !== activeDragId).length + 1;
          speakNumber(coinsOnDeskCount);
        } else {
          // Snap back to wallet (or previous position)
          playSound('slide');
        }
      } else {
        // Dropped outside slots, return to wallet
        setCoins(prev => prev.map(c => c.id === activeDragId ? { ...c, status: 'wallet', slotIndex: null } : c));
        playSound('slide');
      }
    } else {
      playSound('slide'); // No item selected, return to wallet
    }
    setActiveDragId(null);
  };

  // --- Transaction Logic ---
  const handleBuy = () => {
    if (!activeItem) return;

    const coinsOnDesk = coins.filter(c => c.status === 'desk');
    
    if (coinsOnDesk.length === activeItem.cost) {
      // SUCCESS!
      playSound('kaching');
      setSuccessAnim(true);
      
      setTimeout(() => {
        setPurchasedItems(prev => [...prev, activeItem.id]);
        setShopkeeperEarnings(prev => prev + activeItem.cost);
        setCoins(prev => prev.map(c => c.status === 'desk' ? { ...c, status: 'paid', slotIndex: null } : c));
        setActiveItem(null);
        setSuccessAnim(false);

        // Win Condition: Bought all 4 items
        if (purchasedItems.length === SHOP_ITEMS.length - 1) {
           setTimeout(() => setUiState('gameover'), 1000);
        }
      }, 1500);

    } else {
      // ERROR: Not enough coins
      playSound('error');
      setWarning(true);
      setTimeout(() => setWarning(false), 2000);
    }
  };

  // --- SVG Renderers ---
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
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full overflow-hidden bg-slate-50 font-sans touch-none select-none flex flex-col"
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

      {/* RESPONSIVE PLAY AREA (3 Sections) */}
      <div className="flex-1 flex flex-col md:flex-row w-full h-full">
        
        {/* SECTION 1: SHOPKEEPER (Top Mobile, Left Desktop) */}
        <div className="w-full md:w-1/4 h-[25%] md:h-full bg-indigo-50 border-b-4 md:border-b-0 md:border-r-4 border-slate-200 flex flex-col p-2 md:p-4 shrink-0 overflow-y-auto">
           <div className="flex items-center gap-2 mb-2 md:mb-4 bg-indigo-100 p-2 rounded-xl">
             <Store className="text-indigo-600 w-5 h-5 md:w-6 md:h-6" />
             <span className="font-black text-indigo-900 text-xs md:text-sm uppercase tracking-wider">Shop</span>
             {/* Shopkeeper Earnings */}
             <div className="ml-auto flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg border border-amber-300">
               <span className="text-amber-700 font-black text-xs md:text-sm">{shopkeeperEarnings}</span>
               <div className="w-3 h-3 md:w-4 md:h-4"><ShinyCoin/></div>
             </div>
           </div>

           {/* Items List (Scrolls horizontally on mobile, vertically on desktop) */}
           <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-hidden pb-2 md:pb-0">
              {SHOP_ITEMS.map((item) => {
                const isBought = purchasedItems.includes(item.id);
                const isSelected = activeItem?.id === item.id;
                const Icon = item.icon;

                return (
                  <div 
                    key={item.id}
                    onClick={() => !isBought && selectItem(item)}
                    className={`shrink-0 w-28 md:w-full flex md:flex-row flex-col items-center gap-2 p-2 rounded-2xl border-b-4 transition-transform
                      ${isBought ? 'bg-slate-200 border-slate-300 opacity-50 cursor-not-allowed' : 
                        isSelected ? `${item.bg} border-${item.color.split('-')[1]}-400 scale-105 shadow-md` : 
                        'bg-white border-slate-300 cursor-pointer hover:-translate-y-1'}`}
                  >
                     <div className={`p-2 rounded-xl ${item.bg}`}>
                        <Icon className={`w-6 h-6 md:w-8 md:h-8 ${item.color}`} />
                     </div>
                     <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <span className={`font-black text-[10px] md:text-sm ${isBought ? 'text-slate-500' : 'text-slate-800'}`}>{item.name}</span>
                        <div className="flex items-center gap-1">
                           <span className="font-bold text-slate-500 text-xs">{item.cost}</span>
                           <div className="w-3 h-3"><ShinyCoin/></div>
                        </div>
                     </div>
                     {isBought && <CheckCircle2 className="absolute top-1 right-1 text-emerald-500 w-4 h-4 md:w-6 md:h-6" />}
                  </div>
                )
              })}
           </div>
        </div>

        {/* SECTION 2: TRANSACTION DESK (Middle Mobile, Center Desktop) */}
        <div className="w-full md:w-2/4 h-[45%] md:h-full bg-amber-50 relative flex flex-col items-center justify-center p-4">
           {/* Desk Graphic */}
           <div className="absolute inset-x-4 bottom-4 top-16 md:inset-10 bg-amber-100 rounded-[2rem] border-4 border-amber-200 shadow-inner"></div>

           {activeItem ? (
             <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
                
                {/* Product Focus Area */}
                <div className={`p-4 md:p-8 rounded-3xl bg-white shadow-xl border-4 border-slate-100 mb-6 transition-all duration-500
                  ${successAnim ? 'scale-0 opacity-0 translate-x-20' : 'scale-100 opacity-100'}`}>
                   {React.createElement(activeItem.icon, { className: `w-16 h-16 md:w-24 md:h-24 ${activeItem.color}` })}
                </div>

                {/* Ghost Coin Slots */}
                <div className={`flex flex-wrap justify-center gap-2 md:gap-4 mb-6 transition-all duration-500 ${successAnim ? 'opacity-0' : 'opacity-100'}`}>
                   {Array.from({ length: activeItem.cost }).map((_, i) => {
                     // Check if a shiny coin from the wallet is currently occupying this exact slot index
                     const occupyingCoin = coins.find(c => c.status === 'desk' && c.slotIndex === i);
                     const isDraggingThis = activeDragId === occupyingCoin?.id;

                     return (
                       <div key={i} ref={el => { slotRefs.current[i] = el; }} className="relative w-12 h-12 md:w-16 md:h-16">
                          {/* Always render Ghost underneath */}
                          <GhostCoin />
                          
                          {/* If a real coin is here, render it ON TOP */}
                          {occupyingCoin && (
                             <div 
                               onPointerDown={(e) => handlePointerDown(e, occupyingCoin)}
                               className={`absolute inset-0 cursor-grab active:cursor-grabbing transition-opacity ${isDraggingThis ? 'opacity-0' : 'opacity-100'}`}
                             >
                                <ShinyCoin />
                             </div>
                          )}
                       </div>
                     )
                   })}
                </div>

                {/* Action Button & Warnings */}
                <div className="relative h-16 w-full flex items-center justify-center">
                   {warning ? (
                     <div className="absolute flex items-center gap-2 bg-rose-100 text-rose-600 px-6 py-3 rounded-full font-black animate-bounce border-2 border-rose-300">
                        <AlertCircle className="w-5 h-5" /> Need more coins!
                     </div>
                   ) : successAnim ? (
                     <div className="absolute flex items-center gap-2 bg-emerald-100 text-emerald-600 px-6 py-3 rounded-full font-black animate-bounce border-2 border-emerald-300">
                        <CheckCircle2 className="w-5 h-5" /> Bought!
                     </div>
                   ) : (
                     <button 
                       onClick={handleBuy}
                       className="absolute bg-emerald-500 text-white px-8 py-3 rounded-full font-black text-xl shadow-lg border-b-4 border-emerald-700 transition-transform active:translate-y-1 hover:bg-emerald-400 flex items-center gap-2"
                     >
                        LET'S BUY
                     </button>
                   )}
                </div>
             </div>
           ) : (
             <div className="relative z-10 text-center text-amber-600/50 font-black text-xl md:text-3xl uppercase tracking-widest max-w-[200px]">
               Tap an item in the shop to begin
             </div>
           )}
        </div>

        {/* SECTION 3: CHILD'S WALLET (Bottom Mobile, Right Desktop) */}
        <div className="w-full md:w-1/4 h-[30%] md:h-full bg-slate-100 border-t-4 md:border-t-0 md:border-l-4 border-slate-200 flex flex-col p-2 md:p-4 shrink-0 overflow-y-auto">
           <div className="flex items-center justify-between mb-2 md:mb-4 bg-white p-2 rounded-xl shadow-sm">
             <div className="flex items-center gap-2">
               <Wallet className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />
               <span className="font-black text-slate-700 text-xs md:text-sm uppercase tracking-wider">My Wallet</span>
             </div>
             <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
               <ShoppingBag className="text-slate-400 w-4 h-4" />
               <span className="font-bold text-slate-600 text-xs">{purchasedItems.length}</span>
             </div>
           </div>

           {/* Wallet Grid */}
           <div className="flex flex-wrap content-start gap-1 md:gap-2 h-full">
              {coins.map((coin) => {
                if (coin.status !== 'wallet') return null; // Don't render here if it's on desk or paid
                const isDragging = activeDragId === coin.id;

                return (
                  <div 
                    key={coin.id}
                    onPointerDown={(e) => handlePointerDown(e, coin)}
                    className={`w-8 h-8 md:w-12 md:h-12 cursor-grab active:cursor-grabbing transition-opacity
                      ${isDragging ? 'opacity-0' : 'opacity-100 hover:scale-105'}`}
                  >
                     <ShinyCoin />
                  </div>
                )
              })}
           </div>
        </div>

      </div>

      {/* DRAGGABLE CLONE (Follows Finger Everywhere) */}
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

      {/* GAME OVER OVERLAY (Floating Banner) */}
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