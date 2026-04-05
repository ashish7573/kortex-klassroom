"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, RotateCcw, Trophy, Volume2, Home, PlayCircle } from 'lucide-react';

// Master Library: 52 Amatrik Words (No Matras)
const wordPool = [
    // 2-Letter Words
    { text: "जल", img: "💧" }, { text: "नल", img: "🚰" }, { text: "फल", img: "🍎" }, { text: "घर", img: "🏠" }, { text: "रथ", img: "🦼" },
    { text: "बस", img: "🚌" }, { text: "धन", img: "💰" }, { text: "वन", img: "🌳" }, { text: "खत", img: "✉️" }, { text: "टब", img: "🛁" },
    { text: "मग", img: "☕" }, { text: "जग", img: "🫙" }, { text: "छत", img: "🛖" }, { text: "पथ", img: "🛣️" }, { text: "गज", img: "🐘" },
    { text: "हल", img: "🚜" }, { text: "कप", img: "🍵" }, { text: "जड़", img: "🪴" }, { text: "नथ", img: "🪝" }, { text: "दस", img: "🔟" },
    // 3-Letter Words
    { text: "कमल", img: "🪷" }, { text: "मटर", img: "🟢" }, { text: "बतख", img: "🦆" }, { text: "सड़क", img: "🛣️" }, { text: "कलम", img: "🖊️" },
    { text: "नयन", img: "👁️" }, { text: "भवन", img: "🏢" }, { text: "शहद", img: "🍯" }, { text: "कलश", img: "🏺" }, { text: "बटन", img: "🔘" },
    { text: "रबड़", img: "✏️" }, { text: "नमक", img: "🧂" }, { text: "मगर", img: "🐊" }, { text: "लहर", img: "🌊" }, { text: "महल", img: "🕌" },
    { text: "शहर", img: "🏙️" }, { text: "डगर", img: "🛤️" }, { text: "गगन", img: "☁️" }, { text: "नहर", img: "🏞️" }, { text: "नखत", img: "💅" },
    // 4-Letter Words
    { text: "बरगद", img: "🌳" }, { text: "थरमस", img: "🍶" }, { text: "शलजम", img: "🧅" }, { text: "कसरत", img: "🏋️" }, { text: "खटमल", img: "🐛" },
    { text: "बरतन", img: "🥣" }, { text: "पनघट", img: "🚰" }, { text: "अचकन", img: "🧥" }, { text: "दमकल", img: "🚒" }, { text: "अदरक", img: "🫚" },
    { text: "अजगर", img: "🐍" }, { text: "बचपन", img: "🧒" }
];

const swars = ["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ए", "ऐ", "ओ", "औ", "अं", "अः"];
const vargs = [
    { label: "क-वर्ग", chars: ["क", "ख", "ग", "घ", "ङ"] },
    { label: "च-वर्ग", chars: ["च", "छ", "ज", "झ", "ञ"] },
    { label: "ट-वर्ग", chars: ["ट", "ठ", "ड", "ढ", "ण"] },
    { label: "त-वर्ग", chars: ["त", "थ", "द", "ध", "न"] },
    { label: "प-वर्ग", chars: ["प", "फ", "ब", "भ", "म"] },
    { label: "अंतस्थ", chars: ["य", "र", "ल", "व"] },
    { label: "ऊष्म", chars: ["श", "ष", "स", "ह"] },
    { label: "संयुक्त", chars: ["क्ष", "त्र", "ज्ञ"] }
];

export default function HindiWordBuilder({ onComplete }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [gameStage, setGameStage] = useState<'menu' | 'playing'>('menu');
    const [selectedLength, setSelectedLength] = useState<number>(2);
    
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [feedback, setFeedback] = useState({ text: '', type: '' });
    const [showWinModal, setShowWinModal] = useState(false);
    
    const stateRef = useRef({
        words: [] as any[],
        items: [] as any[],
        targetSlots: [] as any[],
        headers: [] as any[],
        imageButtons: [] as any[],
        audioButtons: [] as any[],
        scale: 1,
        draggingItem: null as any | null,
        dragOffset: { x: 0, y: 0 },
        clickStart: { x: 0, y: 0, time: 0 }
    });

    // --- NATIVE BROWSER AUDIO (No API Key Required) ---
    const speak = (text: string) => {
        if (!text || isSpeaking || typeof window === 'undefined') return;
        setIsSpeaking(true);
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN'; // Force Hindi pronunciation
        utterance.rate = 0.85; // Slightly slower for kids
        
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
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
        if (gameStage !== 'playing') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const state = stateRef.current;
        const isMobile = canvas.width < 768;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw dividing line
        ctx.setLineDash([8, 4]); ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
        ctx.beginPath(); 
        if (isMobile) {
            ctx.moveTo(0, canvas.height * 0.55); ctx.lineTo(canvas.width, canvas.height * 0.55);
        } else {
            ctx.moveTo(canvas.width * 0.5, 0); ctx.lineTo(canvas.width * 0.5, canvas.height); 
        }
        ctx.stroke(); ctx.setLineDash([]);

        state.headers.forEach(h => {
            ctx.fillStyle = '#475569'; ctx.font = `bold ${12 * state.scale}px sans-serif`; ctx.textAlign = 'left'; ctx.fillText(h.text, h.x, h.y);
        });

        state.imageButtons.forEach(btn => {
            ctx.font = `${40 * state.scale}px Arial`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(btn.emoji, btn.x, btn.y + btn.size / 2);
        });

        // Draw Audio Buttons
        state.audioButtons.forEach(btn => {
            ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
            drawRoundedRect(ctx, btn.x, btn.y, btn.size, btn.size, 8);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#3b82f6';
            ctx.font = `${btn.size * 0.6}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText("🔊", btn.x + btn.size/2, btn.y + btn.size/2 + 2);
        });

        // Draw Slots
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

        // Draw Palette Items
        state.items.forEach(item => {
            ctx.fillStyle = '#ffffff'; ctx.strokeStyle = item.color; ctx.lineWidth = 2;
            drawRoundedRect(ctx, item.x, item.y, item.size, item.size, 8); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#1e293b'; ctx.font = `bold ${item.size * 0.55}px 'Noto Sans Devanagari', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(item.char, item.x + item.size / 2, item.y + item.size / 2 + 3);
        });

        // Draw Dragging Clone on Top
        if (state.draggingItem) {
            const di = state.draggingItem;
            ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3;
            drawRoundedRect(ctx, di.x, di.y, di.size, di.size, 12); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#1e3a8a'; ctx.font = `bold ${di.size * 0.65}px 'Noto Sans Devanagari', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(di.char, di.x + di.size / 2, di.y + di.size / 2 + 5);
            ctx.restore();
        }
    }, [gameStage]);

    const resizeAndLayout = useCallback(() => {
        if (gameStage !== 'playing') return;
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

        // Dynamic Puzzle Zone based on screen size
        const puzzleW = isMobile ? w : w * 0.5;
        const puzzleH = isMobile ? h * 0.55 : h;
        const rowHeight = puzzleH / (state.words.length + 0.3);
        
        // Slightly shrink slots if it's a 4-letter word on mobile to ensure it fits
        const maxSlotSize = selectedLength === 4 && isMobile ? 32 : 45;
        const slotSize = Math.min(rowHeight * 0.45, maxSlotSize);

        // Layout Puzzle Rows
        state.words.forEach((word, wordIdx) => {
            const y = rowHeight * (wordIdx + 0.7);
            const startX = isMobile ? 5 : 20;
            
            state.imageButtons.push({ x: startX, y: y - slotSize/2, size: slotSize, word: word.text, emoji: word.img });
            
            const audioSize = slotSize * 0.7;
            const audioX = startX + slotSize + 5;
            state.audioButtons.push({ x: audioX, y: y - audioSize/2, size: audioSize, word: word.text });

            const slotStartX = audioX + audioSize + (isMobile ? 10 : 20);
            
            // Dynamically split pure string into required slots
            word.text.split('').forEach((char: string, charIdx: number) => {
                const xSlot = slotStartX + (charIdx * (slotSize + (isMobile ? 4 : 8)));
                state.targetSlots.push({
                    wordIdx, charIdx, targetChar: char,
                    currentChar: "", isComplete: false,
                    x: xSlot, y: y - slotSize/2, size: slotSize
                });
            });
        });

        // Layout Palette Zone
        const paletteX = isMobile ? 15 : puzzleW + 20;
        const paletteY = isMobile ? puzzleH + 15 : 20;
        const paletteW = isMobile ? w - 30 : w - paletteX - 20;
        let curY = paletteY;

        if (isMobile) {
            // Mobile: Smart Extracted Base Letters + Distractors
            const requiredBases = new Set<string>();
            state.words.forEach(w => w.text.split('').forEach((c: string) => requiredBases.add(c)));
            const allBases = [...swars, ...vargs.flatMap(v => v.chars)];
            while(requiredBases.size < (state.words.length * selectedLength) + 4) {
                requiredBases.add(allBases[Math.floor(Math.random() * allBases.length)]);
            }

            const mobileBoxSize = Math.min(paletteW / 5.5, 42); // 5 items per row
            state.headers.push({ text: "अक्षर चुनें (Choose Letters)", x: paletteX, y: curY });
            curY += 15;
            
            let bCol = 0;
            // Shuffle the palette so answers aren't in order
            const shuffledPalette = Array.from(requiredBases).sort(() => 0.5 - Math.random());
            shuffledPalette.forEach((base: string) => {
                if(bCol >= 5) { bCol = 0; curY += mobileBoxSize + 8; }
                const x = paletteX + (bCol * (mobileBoxSize + 8));
                state.items.push({ char: base, value: base, x, y: curY, size: mobileBoxSize, color: '#10b981' });
                bCol++;
            });
        } else {
            // Desktop: Full Clean Alphabet Grid
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
    }, [draw, gameStage, selectedLength]);

    const startGame = (length: number) => {
        setSelectedLength(length);
        const state = stateRef.current;
        // Filter pool by chosen length
        const filteredWords = wordPool.filter(w => w.text.length === length);
        const shuffled = [...filteredWords].sort(() => 0.5 - Math.random());
        state.words = shuffled.slice(0, 4); // Picks 4 random words of that length
        
        setShowWinModal(false);
        setGameStage('playing');
    };

    // Re-layout when stage changes to 'playing'
    useEffect(() => {
        if (gameStage === 'playing') {
            setTimeout(resizeAndLayout, 50); // Small delay allows canvas to mount in DOM
        }
    }, [gameStage, resizeAndLayout]);

    // --- Interaction Engine ---
    const getPos = (e: any) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - rect.left, y: cy - rect.top };
    };

    const handlePointerDown = (e: any) => {
        if (gameStage !== 'playing') return;
        const pos = getPos(e);
        const state = stateRef.current;
        state.clickStart = { x: pos.x, y: pos.y, time: Date.now() };

        // Check Audio Buttons
        for (let btn of state.audioButtons) {
            if (pos.x >= btn.x && pos.x <= btn.x+btn.size && pos.y >= btn.y && pos.y <= btn.y+btn.size) { speak(btn.word); return; }
        }
        // Check Image Buttons
        for (let btn of state.imageButtons) {
            if (pos.x >= btn.x && pos.x <= btn.x+btn.size && pos.y >= btn.y && pos.y <= btn.y+btn.size) { speak(btn.word); return; }
        }

        // Clone Drag Engine
        for (let item of state.items) {
            if (pos.x >= item.x && pos.x <= item.x+item.size && pos.y >= item.y && pos.y <= item.y+item.size) {
                // Create a dynamic clone, leaving the original in place!
                state.draggingItem = { ...item, x: pos.x - item.size/2, y: pos.y - item.size/2 };
                state.dragOffset = { x: item.size/2, y: item.size/2 };
                draw(); break;
            }
        }
    };

    const handlePointerMove = (e: any) => {
        const state = stateRef.current;
        if (!state.draggingItem) return;
        if (e.cancelable) e.preventDefault(); 
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
            speak(di.char);
        } else {
            let matched = false;
            for (let slot of state.targetSlots) {
                if (slot.isComplete) continue;
                const d = Math.hypot((di.x + di.size/2) - (slot.x + slot.size/2), (di.y + di.size/2) - (slot.y + slot.size/2));
                if (d < slot.size * 1.2) {
                    if (di.value === slot.targetChar) {
                        slot.currentChar = di.value; slot.isComplete = true; 
                        showTempFeedback("बहुत अच्छे!");
                        matched = true; break;
                    }
                }
            }
        }

        // The clone gracefully vanishes whether it hits or misses
        state.draggingItem = null;
        draw();

        if (state.targetSlots.length > 0 && state.targetSlots.every(s => s.isComplete)) {
            setTimeout(() => setShowWinModal(true), 800);
        }
    };

    useEffect(() => {
        window.addEventListener('resize', resizeAndLayout);
        return () => {
            window.removeEventListener('resize', resizeAndLayout);
            window.speechSynthesis.cancel(); // Stop audio if component unmounts
        };
    }, [resizeAndLayout]);

    // ==========================================
    // RENDER MENU
    // ==========================================
    if (gameStage === 'menu') {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full bg-blue-50 rounded-3xl p-6 font-sans border-4 border-blue-100">
                <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center text-5xl mb-6 border-4 border-blue-200">
                    🧩
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-blue-900 mb-2 text-center">अमात्रिक शब्द</h2>
                <p className="text-blue-600 font-bold mb-10 text-center max-w-sm">
                    Select a level to practice building words without Matras!
                </p>

                <div className="grid gap-4 w-full max-w-sm">
                    <button onClick={() => startGame(2)} className="flex items-center justify-between p-5 bg-white border-2 border-emerald-200 rounded-2xl shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group">
                        <div className="text-left">
                            <div className="font-black text-lg text-emerald-700">Level 1</div>
                            <div className="text-emerald-600/80 font-bold text-sm">2-Letter Words (दो अक्षर)</div>
                        </div>
                        <PlayCircle className="text-emerald-400 group-hover:text-emerald-600 transition-colors" size={32} />
                    </button>

                    <button onClick={() => startGame(3)} className="flex items-center justify-between p-5 bg-white border-2 border-amber-200 rounded-2xl shadow-sm hover:border-amber-500 hover:shadow-md transition-all group">
                        <div className="text-left">
                            <div className="font-black text-lg text-amber-700">Level 2</div>
                            <div className="text-amber-600/80 font-bold text-sm">3-Letter Words (तीन अक्षर)</div>
                        </div>
                        <PlayCircle className="text-amber-400 group-hover:text-amber-600 transition-colors" size={32} />
                    </button>

                    <button onClick={() => startGame(4)} className="flex items-center justify-between p-5 bg-white border-2 border-purple-200 rounded-2xl shadow-sm hover:border-purple-500 hover:shadow-md transition-all group">
                        <div className="text-left">
                            <div className="font-black text-lg text-purple-700">Level 3</div>
                            <div className="text-purple-600/80 font-bold text-sm">4-Letter Words (चार अक्षर)</div>
                        </div>
                        <PlayCircle className="text-purple-400 group-hover:text-purple-600 transition-colors" size={32} />
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // RENDER PLAYING AREA
    // ==========================================
    return (
        <div className="flex flex-col w-full h-full bg-slate-50 rounded-3xl overflow-hidden font-sans relative">
            <div className="flex items-center justify-between bg-white px-4 md:px-6 py-3 border-b-2 border-blue-100 shadow-sm shrink-0 z-10">
                <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={() => setGameStage('menu')} className="bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 p-2 rounded-full transition-colors">
                        <Home size={20} />
                    </button>
                    <div className="bg-blue-600 text-white px-3 md:px-4 py-1.5 rounded-full font-black tracking-wider text-xs md:text-sm shadow-sm hidden sm:block">
                        {selectedLength}-Letter Words
                    </div>
                </div>
                
                {feedback.text && <div className={`hidden sm:block px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md animate-in slide-in-from-top-2 ${feedback.type === 'info' ? 'bg-blue-500' : 'bg-emerald-500'}`}>{feedback.text}</div>}

                <button onClick={() => startGame(selectedLength)} className="flex items-center gap-1 md:gap-2 text-slate-500 hover:text-blue-600 font-bold text-xs md:text-sm bg-slate-100 hover:bg-blue-50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-colors">
                    <RotateCcw size={16} /> नए शब्द
                </button>
            </div>

            <div className="flex-1 relative w-full h-full cursor-pointer" ref={containerRef}>
                <canvas 
                    ref={canvasRef}
                    onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
                    className="absolute inset-0 w-full h-full touch-none select-none"
                />
            </div>

            {showWinModal && (
                <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 text-center shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-500 border-4 border-blue-500">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Trophy size={40} className="text-amber-500" /></div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">शाबाश!</h2>
                        <p className="text-slate-500 font-bold mb-8 text-sm md:text-base">आपने सभी शब्द सही बनाए।</p>
                        
                        <div className="flex flex-col gap-3">
                            <button onClick={() => startGame(selectedLength)} className="w-full py-3 md:py-4 rounded-2xl bg-blue-500 text-white font-black text-base md:text-lg shadow-md border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all">और खेलें (Play Same Level)</button>
                            <button onClick={() => setGameStage('menu')} className="w-full py-3 md:py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-base md:text-lg border-2 border-slate-200 hover:bg-slate-200 transition-all flex items-center justify-center gap-2">Change Level <ArrowRight size={18}/></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}