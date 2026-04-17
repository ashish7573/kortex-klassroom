"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, RotateCcw, Trophy, Volume2, Home, CheckCircle } from 'lucide-react';

// 1. Import your brand new dictionaries!
import { getWordsForSubtopic, getWordData } from '@/lib/HindiWordDictionary';
import { HINDI_ASSETS } from '@/lib/SwarVyanjanDictionary';

// Keep these to draw the beautiful alphabet grid palette at the bottom
const swars = ["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ए", "ऐ", "ओ", "औ", "अं", "अः"];
const vargs = [
    { label: "क-वर्ग", chars: ["क", "ख", "ग", "घ", "ङ"] }, { label: "च-वर्ग", chars: ["च", "छ", "ज", "झ", "ञ"] },
    { label: "ट-वर्ग", chars: ["ट", "ठ", "ड", "ढ", "ण"] }, { label: "त-वर्ग", chars: ["त", "थ", "द", "ध", "न"] },
    { label: "प-वर्ग", chars: ["प", "फ", "ब", "भ", "म"] }, { label: "अंतस्थ", chars: ["य", "र", "ल", "व"] },
    { label: "ऊष्म", chars: ["श", "ष", "स", "ह"] }, { label: "संयुक्त", chars: ["क्ष", "त्र", "ज्ञ"] }
];

export default function HindiWordBuilder({ lesson, onComplete = () => {} }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Safely figure out what lesson we are in
    const subtopicId = lesson?.subtopicId || lesson?.routePath?.split('/').pop() || 'word-builder-2';
    const titleStr = lesson?.title?.toLowerCase() || '';
    const selectedLength = titleStr.includes('3') ? 3 : titleStr.includes('4') ? 4 : 2;
    
    const [feedback, setFeedback] = useState({ text: '', type: '' });
    const [showWinModal, setShowWinModal] = useState(false);
    const [gameKey, setGameKey] = useState(0); 
    
    const stateRef = useRef({
        words: [] as any[], items: [] as any[], targetSlots: [] as any[],
        headers: [] as any[], imageButtons: [] as any[], audioButtons: [] as any[],
        imageCache: {} as Record<string, { img: HTMLImageElement, emoji: string }>, 
        scale: 1, draggingItem: null as any | null, dragOffset: { x: 0, y: 0 }, clickStart: { x: 0, y: 0, time: 0 }
    });

const activeAudioRef = useRef<HTMLAudioElement | null>(null);

    // --- SMART AUDIO ROUTER ---
    const playLocalAudio = (text: string) => {
        if (!text) return;
        try {
            let audioPath = '';
            
            // If it's a multi-letter word, ask the Word Dictionary
            if (text.length > 1) {
                const wordData = getWordData(text);
                if (wordData) audioPath = wordData.audioUrl;
            } else {
                // If it's a single letter, ask the SwarVyanjan Dictionary
                const letterData = HINDI_ASSETS[text];
                if (letterData) audioPath = letterData.audio;
            }

            if (audioPath) {
                const audio = new Audio(audioPath);
                audio.play().catch(e => {
                    console.warn(`Missing audio file at: ${audioPath}`, e);
                });
            }
        } catch (error) {
            console.error("Audio playback error:", error);
        }
    };

    const showTempFeedback = (text: string, type: 'success' | 'info' = 'success') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback({ text: '', type: '' }), 1500);
    };

    const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
        ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h);
        ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const state = stateRef.current;
        const isMobile = canvas.width < 768;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.setLineDash([8, 4]); ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
        ctx.beginPath(); 
        if (isMobile) { ctx.moveTo(0, canvas.height * 0.60); ctx.lineTo(canvas.width, canvas.height * 0.60); } 
        else { ctx.moveTo(canvas.width * 0.5, 0); ctx.lineTo(canvas.width * 0.5, canvas.height); }
        ctx.stroke(); ctx.setLineDash([]);

        state.headers.forEach(h => {
            ctx.fillStyle = '#475569'; ctx.font = `bold ${12 * state.scale}px sans-serif`; ctx.textAlign = 'left'; ctx.fillText(h.text, h.x, h.y);
        });

        // Smart Image Drawer (Uses PNG if loaded, falls back to emoji instantly)
        state.imageButtons.forEach(btn => {
            const cached = state.imageCache[btn.word];
            if (cached && cached.img.complete && cached.img.naturalWidth > 0) {
                // Draw custom PNG
                ctx.drawImage(cached.img, btn.x, btn.y, btn.size, btn.size);
            } else {
                // Fallback Box with Emoji
                ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
                drawRoundedRect(ctx, btn.x, btn.y, btn.size, btn.size, 8);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#64748b';
                ctx.font = `${btn.size * 0.5}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(btn.emoji || '🖼️', btn.x + btn.size/2, btn.y + btn.size/2 + 2);
            }
        });

        state.audioButtons.forEach(btn => {
            ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
            drawRoundedRect(ctx, btn.x, btn.y, btn.size, btn.size, 8);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#3b82f6';
            ctx.font = `${btn.size * 0.6}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText("🔊", btn.x + btn.size/2, btn.y + btn.size/2 + 2);
        });

        state.targetSlots.forEach(slot => {
            if (slot.isComplete) { ctx.fillStyle = '#f0fdf4'; ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 3; } 
            else { ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; }
            drawRoundedRect(ctx, slot.x, slot.y, slot.size, slot.size, 12);
            ctx.fill(); ctx.stroke();
            if (slot.isComplete) {
                ctx.fillStyle = '#166534';
                ctx.font = `bold ${slot.size * 0.6}px 'Noto Sans Devanagari', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(slot.currentChar, slot.x + slot.size / 2, slot.y + slot.size / 2 + 5);
            }
        });

        state.items.forEach(item => {
            ctx.fillStyle = '#ffffff'; ctx.strokeStyle = item.color; ctx.lineWidth = 2;
            drawRoundedRect(ctx, item.x, item.y, item.size, item.size, 8); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#1e293b'; ctx.font = `bold ${item.size * 0.55}px 'Noto Sans Devanagari', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(item.char, item.x + item.size / 2, item.y + item.size / 2 + 3);
        });

        if (state.draggingItem) {
            const di = state.draggingItem;
            ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3;
            drawRoundedRect(ctx, di.x, di.y, di.size, di.size, 12); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#1e3a8a'; ctx.font = `bold ${di.size * 0.65}px 'Noto Sans Devanagari', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(di.char, di.x + di.size / 2, di.y + di.size / 2 + 5);
            ctx.restore();
        }
    }, []);

    const resizeAndLayout = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        const state = stateRef.current;
        const w = canvas.width;
        const h = canvas.height;
        const isMobile = w < 768; 
        
        state.scale = isMobile ? 0.8 : 1;
        state.targetSlots = []; state.items = []; state.headers = []; state.imageButtons = []; state.audioButtons = [];

        const puzzleW = isMobile ? w : w * 0.5;
        const puzzleH = isMobile ? h * 0.60 : h;
        const rowHeight = puzzleH / state.words.length;
        
        const maxSlotSize = selectedLength === 4 && isMobile ? 38 : 50;
        const slotSize = Math.min(rowHeight * 0.55, maxSlotSize);

        // state.words is now an array of full WordData objects!
        state.words.forEach((wordData, wordIdx) => {
            const y = rowHeight * (wordIdx + 0.5);
            const startX = isMobile ? 5 : 20;
            
            state.imageButtons.push({ x: startX, y: y - slotSize/2, size: slotSize, word: wordData.word, emoji: wordData.emoji });
            
            const audioSize = slotSize * 0.7;
            const audioX = startX + slotSize + 5;
            state.audioButtons.push({ x: audioX, y: y - audioSize/2, size: audioSize, word: wordData.word });

            const slotStartX = audioX + audioSize + (isMobile ? 12 : 20);
            
            wordData.word.split('').forEach((char: string, charIdx: number) => {
                const xSlot = slotStartX + (charIdx * (slotSize + (isMobile ? 4 : 8)));
                state.targetSlots.push({
                    wordIdx, charIdx, targetChar: char,
                    currentChar: "", isComplete: false,
                    x: xSlot, y: y - slotSize/2, size: slotSize
                });
            });
        });

        const paletteX = isMobile ? 15 : puzzleW + 20;
        const paletteY = isMobile ? puzzleH + 15 : 20;
        const paletteW = isMobile ? w - 30 : w - paletteX - 20;
        let curY = paletteY;

        if (isMobile) {
            const requiredBases = new Set<string>();
            state.words.forEach(wData => wData.word.split('').forEach((c: string) => requiredBases.add(c)));
            const allBases = [...swars, ...vargs.flatMap(v => v.chars)];
            while(requiredBases.size < (state.words.length * selectedLength) + 4) {
                requiredBases.add(allBases[Math.floor(Math.random() * allBases.length)]);
            }

            const mobileBoxSize = Math.min(paletteW / 5.5, 46); 
            state.headers.push({ text: "अक्षर चुनें (Choose Letters)", x: paletteX, y: curY });
            curY += 15;
            
            let bCol = 0;
            const shuffledPalette = Array.from(requiredBases).sort(() => 0.5 - Math.random());
            shuffledPalette.forEach((base: string) => {
                if(bCol >= 5) { bCol = 0; curY += mobileBoxSize + 8; }
                const x = paletteX + (bCol * (mobileBoxSize + 8));
                state.items.push({ char: base, value: base, x, y: curY, size: mobileBoxSize, color: '#10b981' });
                bCol++;
            });
        } else {
            const boxSize = Math.min(paletteW / (swars.length + 1), 38);
            state.headers.push({ text: "स्वर (Vowels)", x: paletteX, y: curY });
            curY += 20;
            swars.forEach((swar, i) => {
                const x = paletteX + (i * (boxSize + 4));
                state.items.push({ char: swar, value: swar, x, y: curY, size: boxSize, color: '#3b82f6' });
            });
            curY += boxSize + 25;

            const vyanjanColWidth = paletteW / 2;
            vargs.forEach((varg, vIdx) => {
                const col = vIdx < 4 ? 0 : 1;
                const xOffset = paletteX + (col * vyanjanColWidth);
                let groupY = curY;
                const startIdx = col === 0 ? 0 : 4;
                for(let i = startIdx; i < vIdx; i++) {
                    const rows = Math.ceil(vargs[i].chars.length / 5);
                    groupY += 20 + (rows * (boxSize + 4)) + 10;
                }
                state.headers.push({ text: varg.label, x: xOffset, y: groupY });
                groupY += 18;
                varg.chars.forEach((char, i) => {
                    const c = i % 5;
                    const r = Math.floor(i / 5);
                    state.items.push({ char, value: char, x: xOffset + (c * (boxSize + 4)), y: groupY + (r * (boxSize + 4)), size: boxSize, color: '#10b981' });
                });
            });
        }
        draw();
    }, [draw, selectedLength]);

    // --- Initialization & Dictionary Loading ---
    useEffect(() => {
        // Fetch from Dictionary based on Subtopic!
        let availableWords = getWordsForSubtopic(subtopicId);
        
        // Failsafe: If subtopic isn't found, just grab all words of that length
        if (availableWords.length === 0) {
            console.warn(`No words found for subtopic: ${subtopicId}. Using length fallback.`);
            // You can import HINDI_WORDS object to do a manual fallback filter here if needed,
            // but the dictionary map is highly reliable.
        }

        const shuffled = [...availableWords].sort(() => 0.5 - Math.random());
        const selectedWords = shuffled.slice(0, 4);
        stateRef.current.words = selectedWords; 

        // Preload Images
        selectedWords.forEach(wordData => {
            if (!stateRef.current.imageCache[wordData.word]) {
                const img = new Image();
                img.src = wordData.imageUrl;
                img.onload = () => draw(); 
                stateRef.current.imageCache[wordData.word] = { img, emoji: wordData.emoji };
            }
        });

        setShowWinModal(false);
        setTimeout(resizeAndLayout, 50);
    }, [subtopicId, gameKey, resizeAndLayout, draw]);

    // Anti-Scroll Effect for Mobile Dragging
    useEffect(() => {
        const canvas = canvasRef.current;
        const preventScroll = (e: TouchEvent) => {
            if (stateRef.current.draggingItem) e.preventDefault();
        };
        canvas?.addEventListener('touchmove', preventScroll, { passive: false });
        window.addEventListener('resize', resizeAndLayout);
        return () => {
            canvas?.removeEventListener('touchmove', preventScroll);
            window.removeEventListener('resize', resizeAndLayout);
        };
    }, [resizeAndLayout]);

    // --- Bulletproof Pointer Coordinates ---
    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        // Pointer events natively support touch, mouse, and smartboard pens seamlessly!
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handlePointerDown = (e: any) => {
        const pos = getPos(e);
        const state = stateRef.current;
        state.clickStart = { x: pos.x, y: pos.y, time: Date.now() };

        for (let btn of state.audioButtons) {
            if (pos.x >= btn.x && pos.x <= btn.x+btn.size && pos.y >= btn.y && pos.y <= btn.y+btn.size) { playLocalAudio(btn.word); return; }
        }
        for (let btn of state.imageButtons) {
            if (pos.x >= btn.x && pos.x <= btn.x+btn.size && pos.y >= btn.y && pos.y <= btn.y+btn.size) { playLocalAudio(btn.word); return; }
        }
        for (let item of state.items) {
            if (pos.x >= item.x && pos.x <= item.x+item.size && pos.y >= item.y && pos.y <= item.y+item.size) {
                state.draggingItem = { ...item, x: pos.x - item.size/2, y: pos.y - item.size/2 };
                state.dragOffset = { x: item.size/2, y: item.size/2 };
                draw(); break;
            }
        }
    };

    const handlePointerMove = (e: any) => {
        const state = stateRef.current;
        if (!state.draggingItem) return;
        const pos = getPos(e);
        state.draggingItem.x = pos.x - state.dragOffset.x;
        state.draggingItem.y = pos.y - state.dragOffset.y;
        draw();
    };

    const handlePointerUp = (e: any) => {
        const state = stateRef.current;
        if (!state.draggingItem) return;

        const pos = getPos(e);
        const dist = Math.hypot(pos.x - state.clickStart.x, pos.y - state.clickStart.y);
        const di = state.draggingItem;

        if (Date.now() - state.clickStart.time < 250 && dist < 10) {
            // Clicked a letter! Play the letter audio!
            playLocalAudio(di.char);
        } else {
            for (let slot of state.targetSlots) {
                if (slot.isComplete) continue;
                const d = Math.hypot((di.x + di.size/2) - (slot.x + slot.size/2), (di.y + di.size/2) - (slot.y + slot.size/2));
                if (d < slot.size * 1.2) {
                    if (di.value === slot.targetChar) {
                        slot.currentChar = di.value; slot.isComplete = true; 
                        
                        // Play the letter sound automatically when successfully dropped!
                        playLocalAudio(di.char);
                        showTempFeedback("बहुत अच्छे!");
                        break;
                    }
                }
            }
        }

        state.draggingItem = null;
        draw();

        if (state.targetSlots.length > 0 && state.targetSlots.every(s => s.isComplete)) {
            setTimeout(() => setShowWinModal(true), 800);
        }
    };

    return (
        <div className="flex flex-col w-full h-full bg-slate-50 rounded-xl md:rounded-3xl overflow-hidden font-sans relative">
            <div className="flex items-center justify-between bg-white px-4 md:px-6 py-3 border-b-2 border-blue-100 shadow-sm shrink-0 z-10">
                <div className="bg-blue-600 text-white px-3 md:px-4 py-1.5 rounded-full font-black tracking-wider text-xs md:text-sm shadow-sm">
                    {selectedLength}-Letter Words
                </div>
                
                {feedback.text && <div className={`px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md animate-in slide-in-from-top-2 ${feedback.type === 'info' ? 'bg-blue-500' : 'bg-emerald-500'}`}>{feedback.text}</div>}

                <button onClick={() => setGameKey(prev => prev + 1)} className="flex items-center gap-1 md:gap-2 text-slate-500 hover:text-blue-600 font-bold text-xs md:text-sm bg-slate-100 hover:bg-blue-50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-colors">
                    <RotateCcw size={16} /> नए शब्द
                </button>
            </div>

            <div className="flex-1 relative w-full h-full cursor-pointer" ref={containerRef}>
                <canvas 
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerOut={handlePointerUp}
                    className="absolute inset-0 w-full h-full touch-none select-none"
                />
            </div>

            {showWinModal && (
                <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300 p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 text-center shadow-2xl max-w-sm w-full mx-4 border-4 border-blue-500">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Trophy size={40} className="text-amber-500" /></div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">शाबाश!</h2>
                        <p className="text-slate-500 font-bold mb-8 text-sm md:text-base">आपने सभी शब्द सही बनाए।</p>
                        
                        <div className="flex flex-col gap-3">
                            <button onClick={() => onComplete()} className="w-full py-3 md:py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-base md:text-lg shadow-md border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                                <CheckCircle size={20}/> Complete Lesson
                            </button>
                            <button onClick={() => setGameKey(prev => prev + 1)} className="w-full py-3 md:py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-base md:text-lg border-2 border-slate-200 hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                                <RotateCcw size={18}/> Play Same Level
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}