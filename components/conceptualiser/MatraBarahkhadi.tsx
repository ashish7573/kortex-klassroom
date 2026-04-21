"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowUpCircle, Volume2, Monitor, Smartphone } from 'lucide-react';

// --- DATA MAPPING & COLOR COORDINATION ---
const SWARS = [
  { id: 'a', char: 'अ', matra: '', bg: 'bg-slate-400', border: 'border-slate-500', text: 'text-white' },
  { id: 'aa', char: 'आ', matra: 'ा', bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-slate-800' },
  { id: 'i', char: 'इ', matra: 'ि', bg: 'bg-lime-400', border: 'border-lime-500', text: 'text-slate-800' },
  { id: 'ee', char: 'ई', matra: 'ी', bg: 'bg-emerald-400', border: 'border-emerald-500', text: 'text-white' },
  { id: 'u', char: 'उ', matra: 'ु', bg: 'bg-rose-400', border: 'border-rose-500', text: 'text-white' },
  { id: 'oo', char: 'ऊ', matra: 'ू', bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white' },
  { id: 'e', char: 'ए', matra: 'े', bg: 'bg-fuchsia-400', border: 'border-fuchsia-500', text: 'text-white' },
  { id: 'ai', char: 'ऐ', matra: 'ै', bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  { id: 'o', char: 'ओ', matra: 'ो', bg: 'bg-indigo-400', border: 'border-indigo-500', text: 'text-white' },
  { id: 'au', char: 'औ', matra: 'ौ', bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-white' },
  { id: 'ang', char: 'अं', matra: 'ं', bg: 'bg-cyan-400', border: 'border-cyan-500', text: 'text-slate-800' },
  { id: 'ah', char: 'अः', matra: 'ः', bg: 'bg-teal-400', border: 'border-teal-500', text: 'text-white' },
];

const VYANJAN_GROUPS = [
  { group: 'क-वर्ग', letters: ['क', 'ख', 'ग', 'घ', 'ङ'] },
  { group: 'च-वर्ग', letters: ['च', 'छ', 'ज', 'झ', 'ञ'] },
  { group: 'ट-वर्ग', letters: ['ट', 'ठ', 'ड', 'ढ', 'ण'] },
  { group: 'त-वर्ग', letters: ['त', 'थ', 'द', 'ध', 'न'] },
  { group: 'प-वर्ग', letters: ['प', 'फ', 'ब', 'भ', 'म'] },
  { group: 'अंतस्थ', letters: ['य', 'र', 'ल', 'व'] },
  { group: 'ऊष्म', letters: ['श', 'ष', 'स', 'ह'] },
  { group: 'संयुक्त', letters: ['क्ष', 'त्र', 'ज्ञ'] }
];

const DISABLED_VYANJANS = ['ङ', 'ञ']; 

// --- TEMPORARY PROCEDURAL AUDIO ---
const playTTS = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    }
};

const playJingle = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.2); 
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
};

export default function MatraBarahkhadi({ lesson }: any) {
  
  // --- MOBILE DETECTION ---
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile(); 
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentSwarIndex = useMemo(() => {
    const id = lesson?.subtopicId || '';
    const swarMap: Record<string, number> = {
      'matra-aa': 1, 'matra-i': 2, 'matra-ee': 3, 'matra-u': 4,
      'matra-oo': 5, 'matra-e': 6, 'matra-ai': 7, 'matra-o': 8,
      'matra-au': 9, 'matra-ang': 10, 'matra-ah': 11,
    };
    return swarMap[id] ?? 1; 
  }, [lesson?.subtopicId]);

  const [gridData, setGridData] = useState<Record<string, string[]>>({}); 
  const [dropVyanjan, setDropVyanjan] = useState<string | null>(null);
  const [dropSwar, setDropSwar] = useState<any | null>(null);
  
  // FIX: Added 'replaying' to the allowed TypeScript types
  const [combineState, setCombineState] = useState<'idle' | 'v_audio' | 's_audio' | 'combined' | 'ready' | 'flying' | 'replaying'>('idle');
  const [flyingBead, setFlyingBead] = useState<{char: string, startX: number, startY: number, targetX: number, targetY: number, bg: string, border: string, text: string} | null>(null);

  const vDropRef = useRef<HTMLDivElement>(null);
  const sDropRef = useRef<HTMLDivElement>(null);
  const resultBoxRef = useRef<HTMLButtonElement>(null);
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const [dragItem, setDragItem] = useState<{type: 'vyanjan'|'swar', value: any, x: number, y: number} | null>(null);

  const VYANJANS = useMemo(() => VYANJAN_GROUPS.flatMap(g => g.letters), []);
  const ACTIVE_VYANJANS = useMemo(() => VYANJANS.filter(v => !DISABLED_VYANJANS.includes(v)), [VYANJANS]);

  useEffect(() => {
    const initialGrid: Record<string, string[]> = {};
    ACTIVE_VYANJANS.forEach(v => {
        const completed = [];
        for (let i = 0; i < currentSwarIndex; i++) {
            completed.push(v + SWARS[i].matra);
        }
        initialGrid[v] = completed;
    });
    setGridData(initialGrid);
  }, [currentSwarIndex, ACTIVE_VYANJANS]);

  // --- HIGHER PERFORMANCE DRAG ENGINE ---
  const dragStateRef = useRef({ dragItem, dropVyanjan, dropSwar });
  useEffect(() => {
      dragStateRef.current = { dragItem, dropVyanjan, dropSwar };
  }, [dragItem, dropVyanjan, dropSwar]);

  const handlePointerDown = (e: React.PointerEvent, type: 'vyanjan'|'swar', value: any) => {
    if (combineState !== 'idle' && combineState !== 'ready') return;
    if (type === 'vyanjan' && DISABLED_VYANJANS.includes(value)) return;
    
    if (type === 'vyanjan') playTTS(value);
    if (type === 'swar') playTTS(value.char);

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragItem({ type, value, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
        if (dragStateRef.current.dragItem) {
            setDragItem(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
        }
    };

    const handlePointerUp = (e: PointerEvent) => {
        const { dragItem: currentDrag, dropVyanjan: currentV, dropSwar: currentS } = dragStateRef.current;
        if (!currentDrag) return;

        const vRect = vDropRef.current?.getBoundingClientRect();
        const sRect = sDropRef.current?.getBoundingClientRect();

        if (currentDrag.type === 'vyanjan' && vRect) {
            if (e.clientX >= vRect.left && e.clientX <= vRect.right && e.clientY >= vRect.top && e.clientY <= vRect.bottom) {
                setDropVyanjan(currentDrag.value);
                if (currentS) setCombineState('idle'); 
            }
        } else if (currentDrag.type === 'swar' && sRect) {
            if (e.clientX >= sRect.left && e.clientX <= sRect.right && e.clientY >= sRect.top && e.clientY <= sRect.bottom) {
                setDropSwar(currentDrag.value);
                if (currentV) setCombineState('idle'); 
            }
        }

        setDragItem(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    
    return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []); 

  // --- AUDIO-VISUAL SEQUENCER ---
  useEffect(() => {
    if (dropVyanjan && dropSwar && combineState === 'idle') {
        const sequence = async () => {
            setCombineState('v_audio');
            playTTS(dropVyanjan);
            await new Promise(r => setTimeout(r, 800));
            
            setCombineState('s_audio');
            playTTS(dropSwar.char);
            await new Promise(r => setTimeout(r, 800));
            
            setCombineState('combined');
            playJingle();
            await new Promise(r => setTimeout(r, 300));
            
            const combinedChar = dropVyanjan + dropSwar.matra;
            playTTS(combinedChar);
            await new Promise(r => setTimeout(r, 800));
            
            setCombineState('ready');
        };
        sequence();
    }
  }, [dropVyanjan, dropSwar, combineState]);

  // --- REPLAY / EXPLAIN AGAIN FUNCTIONS ---
  const handleBeadClick = (vyanjan: string, swarObj: any) => {
    if (combineState !== 'idle' && combineState !== 'ready') return;
    
    setCombineState('replaying');
    playTTS(vyanjan + swarObj.matra);
    
    setTimeout(() => {
        setDropVyanjan(vyanjan);
        setDropSwar(swarObj);
        setCombineState('idle'); 
    }, 1200);
  };

  const handleResultClick = () => {
    if (combineState === 'ready') {
        setCombineState('idle');
    }
  };

  // --- FLIP ANIMATION ---
  const sendToBarahkhadi = () => {
    if (!dropVyanjan || !dropSwar) return;
    
    const combinedChar = dropVyanjan + dropSwar.matra;
    const targetCellId = `${dropVyanjan}-${dropSwar.id}`;
    const targetCell = cellRefs.current[targetCellId];
    const startBox = resultBoxRef.current;

    if (targetCell && startBox) {
        const targetRect = targetCell.getBoundingClientRect();
        const startRect = startBox.getBoundingClientRect();

        setCombineState('flying');
        setFlyingBead({
            char: combinedChar,
            startX: startRect.left + startRect.width / 2,
            startY: startRect.top + startRect.height / 2,
            targetX: targetRect.left + targetRect.width / 2,
            targetY: targetRect.top + targetRect.height / 2,
            bg: dropSwar.bg,
            border: dropSwar.border,
            text: dropSwar.text
        });

        setTimeout(() => {
            setGridData(prev => {
                const existing = prev[dropVyanjan] || [];
                if (!existing.includes(combinedChar)) {
                    return { ...prev, [dropVyanjan]: [...existing, combinedChar] };
                }
                return prev;
            });
            setFlyingBead(null);
            setDropVyanjan(null);
            setDropSwar(null);
            setCombineState('idle');
        }, 800); 
    }
  };

  const combinedDisplay = (dropVyanjan && dropSwar) ? (dropVyanjan + dropSwar.matra) : '';

  // --- HARDWARE BLOCKER FOR PHONES ---
  if (isMobile) {
      return (
          <div className="w-full h-[90vh] min-h-[500px] flex flex-col items-center justify-center p-6 bg-slate-50 text-center rounded-3xl border-4 border-slate-200">
              <div className="relative mb-6">
                  <Monitor size={80} className="text-slate-300" />
                  <Smartphone size={32} className="text-rose-400 absolute -bottom-2 -right-2 bg-white rounded-md p-1 shadow-sm" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-3">Screen Too Small</h2>
              <p className="text-slate-500 font-bold text-base max-w-sm leading-snug">
                  The Conceptualiser requires a larger workspace. Please open this lesson on a <span className="text-sky-500">Tablet</span>, <span className="text-sky-500">Laptop</span>, or <span className="text-sky-500">Smartboard</span>.
              </p>
          </div>
      );
  }

  // --- MAIN RENDER (Tablets / Laptops / Smartboards) ---
  return (
    <div className="w-full h-[90vh] min-h-[650px] flex flex-col gap-3 p-3 bg-slate-50 font-sans select-none touch-none overflow-hidden">
        
        {/* DRAG LAYER */}
        {dragItem && (
            <div 
                className={`fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 w-14 h-16 rounded-xl shadow-2xl flex flex-col items-center justify-center font-black text-3xl opacity-90 leading-none border-4
                    ${dragItem.type === 'swar' ? `${dragItem.value.bg} ${dragItem.value.border} ${dragItem.value.text}` : 'bg-white border-sky-400 text-slate-800'}
                `}
                style={{ left: dragItem.x, top: dragItem.y }}
            >
                {dragItem.type === 'swar' ? (dragItem.value.id === 'a' ? dragItem.value.char : dragItem.value.matra) : dragItem.value}
            </div>
        )}

        {/* FLYING BEAD LAYER */}
        {flyingBead && (
            <div 
                className={`fixed z-50 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 shadow-xl flex items-center justify-center font-black text-xl transition-all duration-700 ease-in-out leading-none ${flyingBead.bg} ${flyingBead.border} ${flyingBead.text}`}
                style={{ 
                    left: flyingBead.targetX, 
                    top: flyingBead.targetY,
                    transform: `translate(calc(${flyingBead.startX - flyingBead.targetX}px - 50%), calc(${flyingBead.startY - flyingBead.targetY}px - 50%))` 
                }}
                ref={el => { if(el) setTimeout(() => el.style.transform = 'translate(-50%, -50%)', 50) }}
            >
                {flyingBead.char}
            </div>
        )}

        {/* UPPER: BARAHKHADI VISUALISER */}
        <div className="h-[45%] bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-3 overflow-auto hide-scrollbar relative">
            <div className="min-w-max">
                
                {/* Top Header Row (Vyanjans) */}
                <div className="flex gap-2 mb-2 sticky top-0 bg-white z-20 py-2 border-b-2 border-slate-100">
                    <div className="w-14 h-10 shrink-0 sticky left-0 bg-white z-30"></div> 
                    {ACTIVE_VYANJANS.map(v => (
                        <button 
                            key={v} 
                            onClick={() => playTTS(v)}
                            className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-black text-xl shadow-inner shrink-0 leading-none hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                        >
                            {v}
                        </button>
                    ))}
                </div>

                {/* Swar Rows (Y-Axis) */}
                <div className="flex flex-col gap-2">
                    {SWARS.map(s => (
                        <div key={s.id} className="flex gap-2 relative">
                            {/* Row Header (Swar/Matra) */}
                            <button 
                                onClick={() => playTTS(s.char)}
                                className={`w-14 h-10 ${s.bg} ${s.text} rounded-lg flex flex-col items-center justify-center font-black shadow-sm shrink-0 sticky left-0 z-10 hover:brightness-110 active:scale-95 transition-all cursor-pointer`}
                            >
                                <span className="text-base leading-none">{s.char}</span>
                                <span className="text-[10px] opacity-75 leading-none">{s.matra || '-'}</span>
                            </button>
                            
                            {/* Bead Columns (Vyanjans) */}
                            {ACTIVE_VYANJANS.map(v => {
                                const cellId = `${v}-${s.id}`;
                                const isFilled = gridData[v]?.includes(v + s.matra);
                                return (
                                    <div key={v} className="relative w-10 h-10 flex items-center justify-center shrink-0">
                                        <div className="absolute top-[-100vh] bottom-0 left-1/2 w-0.5 bg-slate-100 -z-10 -translate-x-1/2"></div>
                                        <div ref={el => { cellRefs.current[cellId] = el; }} className="absolute inset-0"></div>

                                        {/* Dynamic Interactive Bead */}
                                        {isFilled && (
                                            <button 
                                                onClick={() => handleBeadClick(v, s)}
                                                disabled={combineState === 'replaying' || combineState === 'flying'}
                                                className={`w-8 h-8 ${s.bg} rounded-full flex items-center justify-center font-black text-sm ${s.text} shadow-md border-2 ${s.border} animate-in zoom-in duration-300 leading-none hover:brightness-110 active:scale-90 transition-transform cursor-pointer`}
                                            >
                                                {v + s.matra}
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* LOWER: WORKSPACE */}
        <div className="h-[55%] flex gap-2 md:gap-4 w-full min-h-0">
            
            {/* Left: Vyanjans */}
            <div className="flex-[1.8] bg-slate-100/50 rounded-3xl border-2 border-sky-200 p-2 md:p-4 flex flex-col hide-scrollbar overflow-hidden min-h-0">
                <div className="grid grid-cols-2 gap-x-2 gap-y-2 md:gap-x-4 md:gap-y-3 w-full content-start overflow-y-auto pb-4 pr-1 md:pr-2 h-full">
                    {VYANJAN_GROUPS.map((group, gIdx) => (
                        <div key={gIdx} className="flex flex-col gap-1 md:gap-1.5 col-span-2 xl:col-span-1">
                            <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase border-b border-slate-200 pb-0.5">{group.group}</span>
                            <div className="flex flex-wrap gap-1 md:gap-1.5">
                                {group.letters.map(letter => {
                                    const isDisabled = DISABLED_VYANJANS.includes(letter);
                                    return (
                                        <button 
                                            key={letter}
                                            onPointerDown={(e) => handlePointerDown(e, 'vyanjan', letter)}
                                            className={`w-9 h-9 md:w-11 md:h-11 rounded-md border-2 flex items-center justify-center font-black text-lg md:text-xl transition-all leading-none shrink-0
                                                ${isDisabled 
                                                    ? 'bg-slate-200 border-slate-300 text-slate-400 opacity-50 cursor-not-allowed' 
                                                    : 'bg-white border-sky-200 text-slate-700 hover:border-sky-400 hover:text-sky-600 shadow-sm active:scale-95 touch-none'}
                                            `}
                                        >
                                            {letter}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Center: The Combiner */}
            <div className="flex-1 min-w-[200px] max-w-[320px] bg-white rounded-3xl border-2 border-slate-300 p-3 md:p-4 flex flex-col items-center justify-between shadow-md relative z-10 shrink-0 min-h-0">
                <div className="w-full flex items-center justify-center gap-2 md:gap-3 mt-2 md:mt-4">
                    
                    {/* Vyanjan Drop Zone */}
                    <div 
                        ref={vDropRef}
                        className={`w-14 h-14 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-inner shrink-0
                            ${combineState === 'v_audio' ? 'border-sky-400 bg-sky-50 scale-110 shadow-[0_0_15px_rgba(56,189,248,0.5)]' : 'border-slate-200 bg-slate-50'}
                        `}
                    >
                        {dropVyanjan ? <span className="text-2xl md:text-4xl font-black text-slate-800 leading-none">{dropVyanjan}</span> : <span className="text-slate-300 font-bold text-[9px] md:text-xs text-center leading-tight">Drop<br/>Vyanjan</span>}
                    </div>

                    <span className="text-2xl md:text-3xl font-black text-slate-300">+</span>

                    {/* Swar Drop Zone */}
                    <div 
                        ref={sDropRef}
                        className={`w-14 h-14 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-inner shrink-0
                            ${!dropSwar ? 'border-slate-200 bg-slate-50' : `${dropSwar.border} ${dropSwar.bg}`}
                            ${combineState === 's_audio' ? 'scale-110 shadow-[0_0_15px_rgba(0,0,0,0.2)]' : ''}
                        `}
                    >
                        {dropSwar ? <span className={`text-3xl md:text-5xl font-black leading-none ${dropSwar.text}`}>{dropSwar.id === 'a' ? dropSwar.char : dropSwar.matra}</span> : <span className="text-slate-300 font-bold text-[9px] md:text-xs text-center leading-tight">Drop<br/>Matra</span>}
                    </div>
                </div>

                {/* Combined Result Box (Clickable for Replay) */}
                <button 
                    ref={resultBoxRef}
                    onClick={handleResultClick}
                    disabled={combineState !== 'ready'}
                    className={`w-full h-20 md:h-28 rounded-2xl border-4 flex items-center justify-center transition-all duration-500 my-2
                        ${(combineState === 'combined' || combineState === 'ready') ? `${dropSwar.bg} ${dropSwar.border} shadow-[0_0_20px_rgba(0,0,0,0.2)] cursor-pointer hover:brightness-110 active:scale-95` : 'border-slate-200 bg-slate-50 opacity-50 cursor-default'}
                        ${combineState === 'flying' ? 'opacity-0 scale-50' : ''}
                    `}
                >
                    <span className={`text-5xl md:text-7xl font-black leading-none ${(combineState === 'combined' || combineState === 'ready') ? dropSwar.text : 'text-slate-800'} ${combineState === 'combined' ? 'animate-pulse' : ''}`}>
                        {(combineState === 'combined' || combineState === 'ready') ? combinedDisplay : ''}
                    </span>
                </button>

                {/* Action Button */}
                <button 
                    disabled={combineState !== 'ready'}
                    onClick={sendToBarahkhadi}
                    className={`w-full py-2.5 md:py-4 rounded-xl font-black text-xs md:text-lg flex items-center justify-center gap-1.5 md:gap-2 transition-all duration-300 border-b-4 shrink-0
                        ${combineState === 'ready' 
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-700 active:border-b-0 active:translate-y-1 shadow-md' 
                            : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'}
                    `}
                >
                    <ArrowUpCircle size={18} className="md:w-6 md:h-6" /> बारहखड़ी में भेजें
                </button>
            </div>

            {/* Right: Swars & Matras */}
            <div className="shrink-0 w-auto bg-slate-100/50 rounded-3xl border-2 border-slate-200 p-2 md:p-3 flex flex-col items-center justify-center hide-scrollbar min-h-0">
                <div className="grid grid-cols-3 gap-1.5 md:gap-2 p-2 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-inner w-fit">
                    {SWARS.map(swar => (
                        <button
                            key={swar.id}
                            onPointerDown={(e) => handlePointerDown(e, 'swar', swar)}
                            className={`w-11 md:w-14 h-14 md:h-16 rounded-lg border-2 ${swar.bg} ${swar.border} ${swar.text} shadow-sm flex flex-col items-center justify-between py-1.5 md:py-2 font-black active:scale-95 touch-none hover:brightness-110`}
                        >
                            <span className="text-[10px] md:text-xs leading-none opacity-80 pointer-events-none">{swar.char}</span>
                            <span className="text-lg md:text-2xl font-black leading-none pointer-events-none">{swar.matra || '-'}</span>
                        </button>
                    ))}
                </div>
            </div>

        </div>
    </div>
  );
}