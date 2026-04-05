"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, RotateCcw, Volume2, Trophy, Loader2 } from 'lucide-react';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""; 

const wordPool = [
    { text: "बस", img: "🚌", parts: [{b:"ब", m:""}, {b:"स", m:""}] },
    { text: "केला", img: "🍌", parts: [{b:"क", m:"े"}, {b:"ल", m:"ा"}] },
    { text: "हाथी", img: "🐘", parts: [{b:"ह", m:"ा"}, {b:"थ", m:"ी"}] },
    { text: "माला", img: "📿", parts: [{b:"म", m:"ा"}, {b:"ल", m:"ा"}] },
    { text: "सेब", img: "🍎", parts: [{b:"स", m:"े"}, {b:"ब", m:""}] },
    { text: "तारा", img: "⭐", parts: [{b:"त", m:"ा"}, {b:"र", m:"ा"}] },
    { text: "तोता", img: "🦜", parts: [{b:"त", m:"ो"}, {b:"त", m:"ा"}] },
    { text: "शेर", img: "🦁", parts: [{b:"श", m:"े"}, {b:"र", m:""}] },
    { text: "नल", img: "🚰", parts: [{b:"न", m:""}, {b:"ल", m:""}] }
];

const swars = ["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ए", "ऐ", "ओ", "औ", "अं", "अः"];
const matras = ["", "ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ", "ं", "ः"];

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
    
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [feedback, setFeedback] = useState({ text: '', type: '' });
    const [showWinModal, setShowWinModal] = useState(false);
    
    const stateRef = useRef({
        words: [] as any[],
        items: [] as any[],
        targetSlots: [] as any[],
        headers: [] as any[],
        imageButtons: [] as any[],
        scale: 1,
        draggingItem: null as any | null,
        dragOffset: { x: 0, y: 0 },
        clickStart: { x: 0, y: 0, time: 0 }
    });

    const speak = async (text: string) => {
        if (!text || text === "—" || isSpeaking) return;
        
        let ttsText = text;
        if (text.startsWith("◌")) {
            const m = text.replace("◌", "");
            const idx = matras.indexOf(m);
            if (idx !== -1) ttsText = swars[idx] + " की मात्रा";
        }

        setIsSpeaking(true);
        try {
            const payload = {
                contents: [{ parts: [{ text: `Say clearly in Hindi: ${ttsText}` }] }],
                generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } }
            };
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, { method: 'POST', body: JSON.stringify(payload) });
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
                const pcmBase64 = result.candidates[0].content.parts[0].inlineData.data;
                const audio = new Audio(`data:audio/wav;base64,${pcmBase64}`);
                await audio.play();
            }
        } catch (e) { console.error("TTS Error:", e); } 
        finally { setTimeout(() => setIsSpeaking(false), 500); }
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.setLineDash([8, 4]); ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(canvas.width * (canvas.width < 768 ? 0.5 : 0.35), 0); 
        ctx.lineTo(canvas.width * (canvas.width < 768 ? 0.5 : 0.35), canvas.height); ctx.stroke(); ctx.setLineDash([]);

        state.headers.forEach(h => {
            ctx.fillStyle = '#475569'; ctx.font = `bold ${12 * state.scale}px sans-serif`; ctx.textAlign = 'left'; ctx.fillText(h.text, h.x, h.y);
        });

        state.imageButtons.forEach(btn => {
            ctx.font = `${45 * state.scale}px Arial`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(btn.emoji, btn.x, btn.y + btn.size / 2);
        });

        state.targetSlots.forEach(slot => {
            if (slot.isComplete) { ctx.fillStyle = '#f0fdf4'; ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 3; } 
            else if (slot.isBaseFilled) { ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3; } 
            else { ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; }

            drawRoundedRect(ctx, slot.x, slot.y, slot.size, slot.size, 12);
            ctx.fill(); ctx.stroke();

            if (slot.isBaseFilled) {
                ctx.fillStyle = slot.isComplete ? '#166534' : '#1d4ed8';
                ctx.font = `bold ${slot.size * 0.6}px 'Noto Sans Devanagari', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(slot.currentBase + slot.currentMatra, slot.x + slot.size / 2, slot.y + slot.size / 2 + 5);
            }
        });

        state.items.forEach(item => {
            if (item === state.draggingItem) return;
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
        const isMobile = canvas.width < 768; // MOBILE DETECTION
        
        state.scale = isMobile ? 0.7 : 1;
        const w = canvas.width;
        const h = canvas.height;
        
        state.targetSlots = []; state.items = []; state.headers = []; state.imageButtons = [];

        // On mobile, give the puzzle side 50% of the screen so words fit.
        const leftWidth = isMobile ? w * 0.5 : w * 0.35; 
        const rowHeight = h / (state.words.length + 0.3);
        const slotSize = Math.min(rowHeight * 0.45, isMobile ? 45 : 75); // Slightly smaller slots on mobile

        state.words.forEach((word, wordIdx) => {
            const y = rowHeight * (wordIdx + 0.7);
            state.imageButtons.push({ x: 5, y: y - slotSize/2, size: slotSize, word: word.text, emoji: word.img });

            word.parts.forEach((part: any, charIdx: number) => {
                const xSlot = (isMobile ? 55 : leftWidth * 0.45) + (charIdx * (slotSize + (isMobile ? 4 : 10)));
                state.targetSlots.push({
                    wordIdx, charIdx, targetBase: part.b, targetMatra: part.m,
                    currentBase: "", currentMatra: "", isComplete: false, isBaseFilled: false,
                    x: xSlot, y: y - slotSize/2, size: slotSize
                });
            });
        });

        const paletteX = leftWidth + 15;
        const paletteW = w - paletteX - 15;
        let curY = 15;

        if (isMobile) {
            // ==========================================
            // SMART MOBILE COMPACT PALETTE
            // ==========================================
            const requiredBases = new Set<string>();
            const requiredMatras = new Set<string>();
            
            state.words.forEach(w => w.parts.forEach((p: any) => { 
                requiredBases.add(p.b); 
                if(p.m) requiredMatras.add(p.m); 
            }));

            // Add 3 random distractor bases to make it a puzzle
            const allBases = vargs.flatMap(v => v.chars);
            while(requiredBases.size < (state.words.length * 2) + 3) {
                requiredBases.add(allBases[Math.floor(Math.random() * allBases.length)]);
            }

            const mobileBoxSize = Math.min(paletteW / 3.5, 45);

            state.headers.push({ text: "मात्रा", x: paletteX, y: curY });
            curY += 15;
            let mCol = 0;
            Array.from(requiredMatras).forEach((matra: string) => {
                if(mCol >= 3) { mCol = 0; curY += mobileBoxSize + 6; }
                const x = paletteX + (mCol * (mobileBoxSize + 6));
                const display = matra === "" ? "—" : "◌" + matra;
                state.items.push({ char: display, value: matra, x, y: curY, origX: x, origY: curY, size: mobileBoxSize, color: '#f59e0b', isMatra: true });
                mCol++;
            });
            curY += mobileBoxSize + 25;

            state.headers.push({ text: "अक्षर", x: paletteX, y: curY });
            curY += 15;
            let bCol = 0;
            Array.from(requiredBases).forEach((base: string) => {
                if(bCol >= 3) { bCol = 0; curY += mobileBoxSize + 6; }
                const x = paletteX + (bCol * (mobileBoxSize + 6));
                state.items.push({ char: base, value: base, x, y: curY, origX: x, origY: curY, size: mobileBoxSize, color: '#10b981' });
                bCol++;
            });

        } else {
            // ==========================================
            // DESKTOP FULL VARNAMALA PALETTE
            // ==========================================
            const swarBoxSize = Math.min(paletteW / (swars.length + 1), 45);
            state.headers.push({ text: "स्वर (Vowels)", x: paletteX, y: curY });
            curY += 20;
            swars.forEach((swar, i) => {
                const x = paletteX + (i * (swarBoxSize + 4));
                state.items.push({ char: swar, value: swar, x, y: curY, origX: x, origY: curY, size: swarBoxSize, color: '#3b82f6' });
            });
            curY += swarBoxSize + 10;

            state.headers.push({ text: "मात्रा (Signs)", x: paletteX, y: curY });
            curY += 20;
            matras.forEach((matra, i) => {
                const x = paletteX + (i * (swarBoxSize + 4));
                const display = matra === "" ? "—" : "◌" + matra;
                state.items.push({ char: display, value: matra, x, y: curY, origX: x, origY: curY, size: swarBoxSize, color: '#f59e0b', isMatra: true });
            });
            curY += swarBoxSize + 20;

            const vyanjanStartY = curY;
            const vyanjanColWidth = paletteW / 2;
            const vyanjanBoxSize = Math.min(vyanjanColWidth / 6, 40);

            vargs.forEach((varg, vIdx) => {
                const col = vIdx < 4 ? 0 : 1;
                const xOffset = paletteX + (col * vyanjanColWidth);
                let groupY = vyanjanStartY;
                const startIdx = col === 0 ? 0 : 4;
                for(let i = startIdx; i < vIdx; i++) {
                    const rows = Math.ceil(vargs[i].chars.length / 5);
                    groupY += 20 + (rows * (vyanjanBoxSize + 4)) + 10;
                }
                state.headers.push({ text: varg.label, x: xOffset, y: groupY });
                groupY += 18;
                varg.chars.forEach((char, i) => {
                    const c = i % 5;
                    const r = Math.floor(i / 5);
                    state.items.push({ char, value: char, x: xOffset + (c * (vyanjanBoxSize + 4)), y: groupY + (r * (vyanjanBoxSize + 4)), size: vyanjanBoxSize, color: '#10b981' });
                });
            });
        }
        draw();
    }, [draw]);

    const initGame = useCallback(() => {
        const state = stateRef.current;
        const shuffled = [...wordPool].sort(() => 0.5 - Math.random());
        state.words = shuffled.slice(0, 4);
        setShowWinModal(false);
        resizeAndLayout();
    }, [resizeAndLayout]);

    // --- Interaction ---
    const getPos = (e: any) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - rect.left, y: cy - rect.top };
    };

    const handlePointerDown = (e: any) => {
        const pos = getPos(e);
        const state = stateRef.current;
        state.clickStart = { x: pos.x, y: pos.y, time: Date.now() };

        for (let btn of state.imageButtons) {
            if (pos.x >= btn.x && pos.x <= btn.x+60 && pos.y >= btn.y && pos.y <= btn.y+btn.size) { speak(btn.word); return; }
        }

        for (let item of state.items) {
            if (pos.x >= item.x && pos.x <= item.x+item.size && pos.y >= item.y && pos.y <= item.y+item.size) {
                state.draggingItem = item;
                state.dragOffset = { x: pos.x - item.x, y: pos.y - item.y };
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
                    if (!slot.isBaseFilled && di.value === slot.targetBase) {
                        slot.isBaseFilled = true; slot.currentBase = di.value;
                        if (slot.targetMatra === "") { slot.isComplete = true; showTempFeedback("बहुत अच्छे!"); }
                        else { showTempFeedback("सही! अब मात्रा लगाओ", "info"); }
                        matched = true; break;
                    } else if (slot.isBaseFilled && !slot.isComplete && di.value === slot.targetMatra) {
                        slot.currentMatra = di.value; slot.isComplete = true; showTempFeedback("शाबाश!");
                        matched = true; break;
                    }
                }
            }
            if (!matched) { di.x = di.origX; di.y = di.origY; }
        }

        state.draggingItem = null;
        draw();

        if (state.targetSlots.length > 0 && state.targetSlots.every(s => s.isComplete)) {
            setTimeout(() => setShowWinModal(true), 800);
        }
    };

    useEffect(() => {
        initGame();
        window.addEventListener('resize', resizeAndLayout);
        return () => window.removeEventListener('resize', resizeAndLayout);
    }, [initGame, resizeAndLayout]);

    return (
        <div className="flex flex-col w-full h-full bg-slate-50 rounded-3xl overflow-hidden font-sans relative">
            <div className="flex items-center justify-between bg-white px-4 md:px-6 py-3 border-b-2 border-blue-100 shadow-sm shrink-0 z-10">
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="bg-blue-600 text-white px-3 md:px-4 py-1.5 rounded-full font-black tracking-wider text-xs md:text-sm shadow-sm">
                        शब्द और मात्रा
                    </div>
                    {isSpeaking && <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-blue-500 animate-pulse"><Loader2 size={14} className="animate-spin"/> सुनिए...</div>}
                </div>
                
                {feedback.text && <div className={`hidden sm:block px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md animate-in slide-in-from-top-2 ${feedback.type === 'info' ? 'bg-blue-500' : 'bg-emerald-500'}`}>{feedback.text}</div>}

                <button onClick={initGame} className="flex items-center gap-1 md:gap-2 text-slate-500 hover:text-blue-600 font-bold text-xs md:text-sm bg-slate-100 hover:bg-blue-50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-colors">
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
                            <button onClick={initGame} className="w-full py-3 md:py-4 rounded-2xl bg-blue-500 text-white font-black text-base md:text-lg shadow-md border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all">और खेलें (Play More)</button>
                            {onComplete && <button onClick={onComplete} className="w-full py-3 md:py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-base md:text-lg border-2 border-slate-200 hover:bg-slate-200 transition-all flex items-center justify-center gap-2">Next Lesson <ArrowRight size={18}/></button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}