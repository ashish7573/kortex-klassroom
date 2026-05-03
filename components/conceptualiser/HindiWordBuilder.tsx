"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RotateCcw, Home, CheckCircle } from 'lucide-react';

// Import dictionaries
import { getWordsForSubtopic, getWordData } from '@/lib/HindiWordDictionary';
import { HINDI_ASSETS, getBarahkhadiAudio } from '@/lib/SwarVyanjanDictionary';

const swars = ["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ए", "ऐ", "ओ", "औ", "अं", "अः"];
const HINDI_MATRAS = ["", "ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ", "ं", "ः"];

const vargs = [
    { label: "क-वर्ग", chars: ["क", "ख", "ग", "घ", "ङ"] }, { label: "च-वर्ग", chars: ["च", "छ", "ज", "झ", "ञ"] },
    { label: "ट-वर्ग", chars: ["ट", "ठ", "ड", "ढ", "ण"] }, { label: "त-वर्ग", chars: ["त", "थ", "द", "ध", "न"] },
    { label: "प-वर्ग", chars: ["प", "फ", "ब", "भ", "म"] }, { label: "अंतस्थ", chars: ["य", "र", "ल", "व"] },
    { label: "ऊष्म", chars: ["श", "ष", "स", "ह"] }, { label: "संयुक्त", chars: ["क्ष", "त्र", "ज्ञ"] },
    { label: "अतिरिक्त", chars: ["ड़", "ढ़"] } 
];

const playSuccessChime = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
        console.warn('Audio Context blocked');
    }
};

export default function HindiWordBuilder({ lesson, onComplete = () => {} }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // --- MODE & CONFIG ---
    const subtopicId = lesson?.subtopicId || lesson?.routePath?.split('/').pop() || 'word-builder-2';
    const isMatraMode = subtopicId.includes('matra');
    const titleStr = lesson?.title?.toLowerCase() || '';
    const selectedLength = titleStr.includes('3') ? 3 : titleStr.includes('4') ? 4 : 2;
    
    let headerLabel = `${selectedLength}-Letter Words`;
    if (isMatraMode) headerLabel = `Matra Words`;

    // --- STATE ---
    const [isMobile, setIsMobile] = useState(false);
    const [feedback, setFeedback] = useState({ text: '', type: '' });
    const [wordList, setWordList] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [gameKey, setGameKey] = useState(0);
    
    // Core Engine State
    const stateRef = useRef({
        items: [] as any[],          // Desktop static palette items
        targetSlots: [] as any[],    // The word drop zones
        headers: [] as any[],        // Desktop headers
        imageCache: {} as Record<string, { img: HTMLImageElement, emoji: string }>, 
        scale: 1, 
        draggingItem: null as any | null, 
        dragOffset: { x: 0, y: 0 }, 
        clickStart: { x: 0, y: 0, time: 0 },
        audioBtn: null as any,
        prevBtn: null as any,
        nextBtn: null as any,
        imageBox: null as any,
        isWordComplete: false,
    });

    const activeAudioRef = useRef<HTMLAudioElement | null>(null);

    // --- MOBILE DETECTION ---
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // --- AUDIO SYSTEM ---
    const playLocalAudio = (text: string) => {
        if (!text) return;
        try {
            let audioPath = '';
            const wordData = getWordData(text);
            
            if (wordData && wordData.audioUrl) audioPath = wordData.audioUrl;
            else if (HINDI_ASSETS[text]) audioPath = HINDI_ASSETS[text].audio;

            if (audioPath) {
                if (activeAudioRef.current) {
                    activeAudioRef.current.pause();
                    activeAudioRef.current.currentTime = 0;
                }
                const audio = new Audio(audioPath);
                activeAudioRef.current = audio;
                
                audio.onerror = () => {
                    const fallbackPath = audioPath.endsWith('.m4a') ? audioPath.replace('.m4a', '.mp3') : audioPath.replace('.mp3', '.m4a');
                    const fallbackAudio = new Audio(fallbackPath);
                    activeAudioRef.current = fallbackAudio;
                    fallbackAudio.play().catch(e => console.warn("Fallback audio missing:", text));
                };

                audio.play().catch(e => console.warn("Audio blocked:", e));
            }
        } catch (error) { console.error("Audio error:", error); }
    };

    const showTempFeedback = (text: string, type: 'success' | 'info' = 'success') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback({ text: '', type: '' }), 1500);
    };

    // --- CANVAS DRAWING (Handles Stage & Desktop Palette) ---
    const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
        ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h);
        ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || wordList.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const state = stateRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Desktop Divider Line
        if (!isMobile) {
            ctx.setLineDash([8, 4]); ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(canvas.width * 0.45, 0); ctx.lineTo(canvas.width * 0.45, canvas.height);
            ctx.stroke(); ctx.setLineDash([]);
        }

        // Draw Image Box
        if (state.imageBox) {
            const currentWord = wordList[currentIndex];
            const cached = state.imageCache[currentWord.word];
            
            ctx.fillStyle = '#f8fafc';
            ctx.shadowColor = 'rgba(56, 189, 248, 0.2)'; ctx.shadowBlur = 20;
            drawRoundedRect(ctx, state.imageBox.x, state.imageBox.y, state.imageBox.size, state.imageBox.size, 24);
            ctx.fill(); ctx.shadowBlur = 0; 
            
            if (cached && cached.img.complete && cached.img.naturalWidth > 0) {
                const pad = state.imageBox.size * 0.1;
                ctx.drawImage(cached.img, state.imageBox.x + pad, state.imageBox.y + pad, state.imageBox.size - (pad*2), state.imageBox.size - (pad*2));
            } else {
                ctx.fillStyle = '#64748b';
                ctx.font = `${state.imageBox.size * 0.5}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(currentWord.emoji || '🖼️', state.imageBox.x + state.imageBox.size/2, state.imageBox.y + state.imageBox.size/2 + 5);
            }
        }

        // Draw Audio Button
        if (state.audioBtn) {
            const btn = state.audioBtn;
            ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3;
            drawRoundedRect(ctx, btn.x, btn.y, btn.size, btn.size, 16);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#3b82f6';
            ctx.font = `${btn.size * 0.6}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText("🔊", btn.x + btn.size/2, btn.y + btn.size/2 + 2);
        }

        // Draw Target Slots
        state.targetSlots.forEach(slot => {
            if (slot.isComplete) { ctx.fillStyle = '#f0fdf4'; ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 4; } 
            else if (slot.isBaseFilled) { ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; } 
            else { ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3; }
            
            drawRoundedRect(ctx, slot.x, slot.y, slot.size, slot.size, 16);
            ctx.fill(); ctx.stroke();
            
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            
            if (slot.isBaseFilled || slot.isComplete) {
                ctx.fillStyle = slot.isComplete ? '#166534' : '#1e3a8a';
                ctx.font = `bold ${slot.size * 0.7}px 'Noto Sans Devanagari', sans-serif`; 
                ctx.fillText(slot.currentBase + slot.currentMatra, slot.x + slot.size / 2, slot.y + slot.size / 2 + 5);
            } else {
                ctx.fillStyle = 'rgba(148, 163, 184, 0.25)'; 
                ctx.font = `bold ${slot.size * 0.7}px 'Noto Sans Devanagari', sans-serif`; 
                ctx.fillText(slot.targetBase + slot.targetMatra, slot.x + slot.size / 2, slot.y + slot.size / 2 + 5);
            }
        });

        // Draw Navigation Buttons
        if (state.prevBtn && currentIndex > 0) {
            ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
            drawRoundedRect(ctx, state.prevBtn.x, state.prevBtn.y, state.prevBtn.size, state.prevBtn.size, 12);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#64748b'; ctx.font = `bold ${state.prevBtn.size * 0.6}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText("◀", state.prevBtn.x + state.prevBtn.size/2, state.prevBtn.y + state.prevBtn.size/2 + 2);
        }
        if (state.nextBtn && currentIndex < wordList.length - 1) {
            if (state.isWordComplete) { ctx.fillStyle = '#dcfce3'; ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3; } 
            else { ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; }
            drawRoundedRect(ctx, state.nextBtn.x, state.nextBtn.y, state.nextBtn.size, state.nextBtn.size, 12);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = state.isWordComplete ? '#16a34a' : '#64748b'; ctx.font = `bold ${state.nextBtn.size * 0.6}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText("▶", state.nextBtn.x + state.nextBtn.size/2, state.nextBtn.y + state.nextBtn.size/2 + 2);
        }

        // Draw Desktop Static Palette (Only if not mobile)
        if (!isMobile) {
            state.headers.forEach(h => {
                ctx.fillStyle = '#475569'; ctx.font = `bold ${12 * state.scale}px sans-serif`; ctx.textAlign = 'left'; ctx.fillText(h.text, h.x, h.y);
            });
            state.items.forEach(item => {
                ctx.fillStyle = '#ffffff'; ctx.strokeStyle = item.color; ctx.lineWidth = 2;
                drawRoundedRect(ctx, item.x, item.y, item.size, item.size, 8); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#1e293b'; ctx.font = `bold ${item.size * 0.55}px 'Noto Sans Devanagari', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(item.char, item.x + item.size / 2, item.y + item.size / 2 + 3);
            });
        }

        // Draw the Actively Dragged Item (Works for Mobile AND Desktop)
        if (state.draggingItem) {
            const di = state.draggingItem;
            ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3;
            drawRoundedRect(ctx, di.x, di.y, di.size, di.size, 12); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#1e3a8a'; ctx.font = `bold ${di.size * 0.65}px 'Noto Sans Devanagari', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(di.char, di.x + di.size / 2, di.y + di.size / 2 + 5);
            ctx.restore();
        }
    }, [wordList, currentIndex, isMobile]);

    // --- LAYOUT ENGINE ---
    const resizeAndLayout = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || wordList.length === 0) return;

        // The container height is already managed by Tailwind (h-1/2 on mobile)
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        const state = stateRef.current;
        const w = canvas.width;
        const h = canvas.height;
        
        state.scale = isMobile ? 0.8 : 1;
        const oldSlots = [...state.targetSlots];
        
        state.targetSlots = []; state.items = []; state.headers = []; 
        state.audioBtn = null; state.imageBox = null; state.prevBtn = null; state.nextBtn = null;

        // The "Stage" sizing is consistent now. On mobile it uses the full canvas width.
        const puzzleW = isMobile ? w : w * 0.45;
        const puzzleH = h;
        
        const imageSize = isMobile 
            ? Math.min(puzzleW * 0.5, puzzleH * 0.4, 200)  
            : Math.min(puzzleW * 0.6, puzzleH * 0.55, 320); 

        const imageX = (puzzleW / 2) - (imageSize / 2);
        const imageY = isMobile ? 10 : (puzzleH * 0.10);
        state.imageBox = { x: imageX, y: imageY, size: imageSize };

        // Parse Target Word
        const currentWord = wordList[currentIndex];
        let charArray: string[] = [];
        try {
            const segmenter = new Intl.Segmenter('hi-IN', { granularity: 'grapheme' });
            charArray = Array.from(segmenter.segment(currentWord.word)).map(s => s.segment);
        } catch (e) {
            charArray = currentWord.word.match(/[\u0900-\u097F][\u093E-\u094D\u0951-\u0954\u0962\u0963]*/g) || currentWord.word.split('');
        }
        const actualLength = charArray.length;

        // Layout Slots
        const slotSize = Math.min(puzzleW / (actualLength + 2), isMobile ? 55 : 75);
        const totalSlotsWidth = actualLength * slotSize + ((actualLength - 1) * 10);
        const audioBtnSize = slotSize * 0.8;
        const audioGap = 15;
        const totalBlockWidth = audioBtnSize + audioGap + totalSlotsWidth;
        
        const blockStartX = (puzzleW / 2) - (totalBlockWidth / 2);
        const blockY = imageY + imageSize + (isMobile ? 15 : 30);

        state.audioBtn = { x: blockStartX, y: blockY + (slotSize/2) - (audioBtnSize/2), size: audioBtnSize };
        const slotStartX = blockStartX + audioBtnSize + audioGap;
        
        charArray.forEach((charStr: string, charIdx: number) => {
            const xSlot = slotStartX + (charIdx * (slotSize + 10));
            const previousProgress = oldSlots.find(s => s.wordIdx === currentIndex && s.charIdx === charIdx);
            
            let tBase = charStr, tMatra = "";
            for (let m of HINDI_MATRAS) {
                if (m !== "" && charStr.endsWith(m)) { tBase = charStr.replace(m, ''); tMatra = m; break; }
            }

            state.targetSlots.push({
                wordIdx: currentIndex, charIdx, 
                targetBase: tBase, targetMatra: tMatra,
                currentBase: previousProgress ? previousProgress.currentBase : "", 
                currentMatra: previousProgress ? previousProgress.currentMatra : "", 
                isBaseFilled: previousProgress ? previousProgress.isBaseFilled : false,
                isComplete: previousProgress ? previousProgress.isComplete : false,
                x: xSlot, y: blockY, size: slotSize
            });
        });

        // Navigation Arrows
        const arrowSize = isMobile ? 35 : 45;
        const arrowY = imageY + (imageSize/2) - (arrowSize/2);
        state.prevBtn = { x: 10, y: arrowY, size: arrowSize };
        state.nextBtn = { x: puzzleW - arrowSize - 10, y: arrowY, size: arrowSize };

        // --- DESKTOP PALETTE ONLY ---
        // (Mobile palette is handled via standard HTML below)
        if (!isMobile) {
            const paletteX = puzzleW + 20; 
            const paletteY = 20;
            const paletteW = w - paletteX - 20;
            let curY = paletteY;
            const boxSize = Math.min(paletteW / (swars.length + 1), 40);
            
            state.headers.push({ text: "स्वर (Vowels)", x: paletteX, y: curY });
            curY += 20;
            swars.forEach((swar, i) => {
                state.items.push({ char: swar, value: swar, x: paletteX + (i * (boxSize + 4)), y: curY, size: boxSize, color: '#3b82f6', isMatra: false });
            });
            curY += boxSize + 20;

            if (isMatraMode) {
                state.headers.push({ text: "मात्रा (Signs)", x: paletteX, y: curY });
                curY += 20;
                HINDI_MATRAS.forEach((matra, i) => {
                    if (matra === "") return; 
                    state.items.push({ char: "◌" + matra, value: matra, x: paletteX + (i * (boxSize + 4)), y: curY, size: boxSize, color: '#f59e0b', isMatra: true });
                });
                curY += boxSize + 20;
            }

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
                    state.items.push({ char, value: char, x: xOffset + (c * (boxSize + 4)), y: groupY + (r * (boxSize + 4)), size: boxSize, color: '#10b981', isMatra: false });
                });
            });
        }
        
        draw();
    }, [draw, wordList, currentIndex, selectedLength, isMatraMode, isMobile]);

    // --- GAME DATA LOAD ---
    useEffect(() => {
        let availableWords = getWordsForSubtopic(subtopicId);
        if (availableWords.length === 0) return;
        const shuffled = [...availableWords].sort(() => 0.5 - Math.random());
        setWordList(shuffled);
        setCurrentIndex(0);
        stateRef.current.isWordComplete = false;

        shuffled.forEach(wordData => {
            if (!stateRef.current.imageCache[wordData.word]) {
                const img = new Image();
                img.src = wordData.imageUrl;
                img.onload = () => draw(); 
                stateRef.current.imageCache[wordData.word] = { img, emoji: wordData.emoji };
            }
        });
    }, [subtopicId, gameKey]); 

    useEffect(() => {
        if (wordList.length > 0) {
            setTimeout(resizeAndLayout, 50);
        }
    }, [currentIndex, wordList, resizeAndLayout, isMobile]);

    // Prevent default scroll on Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const preventScroll = (e: TouchEvent) => { if (stateRef.current.draggingItem) e.preventDefault(); };
        canvas?.addEventListener('touchmove', preventScroll, { passive: false });
        return () => canvas?.removeEventListener('touchmove', preventScroll);
    }, []);

    // --- INTERACTION HANDLERS ---
    const getPos = (e: any) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        
        // Use true touch coordinates if available to prevent scroll drift
        const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
        
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const isHit = (pos: any, box: any) => {
        if (!box) return false;
        return pos.x >= box.x && pos.x <= box.x + box.size && pos.y >= box.y && pos.y <= box.y + box.size;
    };

    // This handles Desktop drag start inside the Canvas
    const handlePointerDown = (e: any) => {
        const pos = getPos(e);
        const state = stateRef.current;
        state.clickStart = { x: pos.x, y: pos.y, time: Date.now() };

        if (!isMobile) {
            for (let item of state.items) {
                if (isHit(pos, item)) {
                    state.draggingItem = { ...item, x: pos.x - item.size/2, y: pos.y - item.size/2 };
                    state.dragOffset = { x: item.size/2, y: item.size/2 };
                    draw(); break;
                }
            }
        }
    };

    const startMobileDrag = (e: React.PointerEvent<HTMLButtonElement>, char: string, value: string, isMatra: boolean, color: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        
        // Accurate finger position tracking
        const posX = e.clientX - rect.left;
        const posY = e.clientY - rect.top;
        
        const state = stateRef.current;
        state.clickStart = { x: posX, y: posY, time: Date.now() };
        
        // The size of the dragged item
        const size = 52; 
        
        // Position the dragging item exactly centered on the finger's initial touch point
        state.draggingItem = { 
            char, 
            value, 
            x: posX - size / 2, 
            y: posY - size / 2, 
            size, 
            color, 
            isMatra 
        };
        // The offset ensures it stays snapped to the finger during the move
        state.dragOffset = { x: size / 2, y: size / 2 };
        draw();

        // Pass pointer events directly to the canvas window
        canvas.setPointerCapture(e.pointerId);
    };

    // Capture both pointer and touch moves for maximum fidelity
    const handlePointerMove = (e: any) => {
        const state = stateRef.current;
        if (!state.draggingItem) return;
        
        // Prevent browser scroll if we are actively dragging
        if (e.cancelable) e.preventDefault();
        
        const pos = getPos(e);
        state.draggingItem.x = pos.x - state.dragOffset.x;
        state.draggingItem.y = pos.y - state.dragOffset.y;
        draw();
    };

    const handlePointerUp = (e: any) => {
        const state = stateRef.current;
        const pos = getPos(e);
        const dist = Math.hypot(pos.x - state.clickStart.x, pos.y - state.clickStart.y);

        // Click Logic (Audio & Nav)
        if (!state.draggingItem && Date.now() - state.clickStart.time < 300 && dist < 10) {
            if (isHit(pos, state.audioBtn)) { playLocalAudio(wordList[currentIndex].word); return; }
            if (isHit(pos, state.imageBox)) { playLocalAudio(wordList[currentIndex].word); return; }
            if (isHit(pos, state.prevBtn) && currentIndex > 0) {
                state.isWordComplete = false; setCurrentIndex(prev => prev - 1); return;
            }
            if (isHit(pos, state.nextBtn) && currentIndex < wordList.length - 1) {
                state.isWordComplete = false; setCurrentIndex(prev => prev + 1); return;
            }
            return;
        }

        if (!state.draggingItem) return;

        const di = state.draggingItem;

        // Quick Tap Audio for Palette Item
        if (Date.now() - state.clickStart.time < 250 && dist < 10) {
            if (di.isMatra) {
                const mIdx = HINDI_MATRAS.indexOf(di.value);
                if (mIdx > -1) playLocalAudio(swars[mIdx]); 
            } else {
                playLocalAudio(di.char);
            }
        } else {
            // Drop Snapping Logic
            for (let slot of state.targetSlots) {
                if (slot.isComplete) continue;
                const d = Math.hypot((di.x + di.size/2) - (slot.x + slot.size/2), (di.y + di.size/2) - (slot.y + slot.size/2));
                
                if (d < slot.size * 1.2) {
                    // Base Drop
                    if (!slot.isBaseFilled && !di.isMatra && di.value === slot.targetBase) {
                        slot.isBaseFilled = true;
                        slot.currentBase = di.value;
                        
                        let audioToPlay = HINDI_ASSETS[di.value]?.audio; 
                        if (slot.targetMatra === "") slot.isComplete = true; 
                        
                        if (state.targetSlots.every((s: any) => s.isComplete)) checkWinCondition(state, audioToPlay);
                        else { playLocalAudio(di.value); checkWinCondition(state); }
                        break;
                    } 
                    // Matra Drop
                    else if (slot.isBaseFilled && !slot.isComplete && di.isMatra && di.value === slot.targetMatra) {
                        slot.currentMatra = di.value;
                        slot.isComplete = true;
                        
                        const completedSyllable = slot.currentBase + slot.currentMatra;
                        const barahkhadiPath = getBarahkhadiAudio(completedSyllable);
                        
                        if (state.targetSlots.every((s: any) => s.isComplete)) checkWinCondition(state, barahkhadiPath || undefined);
                        else {
                            if (barahkhadiPath) {
                                if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current.currentTime = 0; }
                                const bAudio = new Audio(barahkhadiPath);
                                activeAudioRef.current = bAudio;
                                bAudio.onerror = () => {
                                    const fallback = new Audio(barahkhadiPath.replace('.mp3', '.m4a'));
                                    activeAudioRef.current = fallback;
                                    fallback.play().catch(e => console.warn("Barahkhadi missing"));
                                };
                                bAudio.play().catch(e => console.warn("Audio blocked"));
                            }
                            checkWinCondition(state);
                        }
                        break;
                    }
                }
            }
        }

        state.draggingItem = null;
        draw();
    };

    const checkWinCondition = (state: any, finalAudioPath?: string) => {
        if (state.targetSlots.every((s: any) => s.isComplete)) {
            state.isWordComplete = true; 
            
            let delay = 0;
            if (finalAudioPath) {
                if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current.currentTime = 0; }
                const bAudio = new Audio(finalAudioPath);
                activeAudioRef.current = bAudio;
                bAudio.onerror = () => {
                    const fallback = new Audio(finalAudioPath.replace('.mp3', '.m4a'));
                    activeAudioRef.current = fallback;
                    fallback.play().catch(e => console.warn("Fallback missing"));
                };
                bAudio.play().catch(e => console.warn("Audio blocked"));
                delay = 800;
            }

            setTimeout(() => {
                playSuccessChime();
                showTempFeedback("बहुत बढ़िया! (Excellent!)");
                setTimeout(() => playLocalAudio(wordList[currentIndex].word), 1200); 
            }, delay);
        }
    };

    // ==========================================
    // RENDER 
    // ==========================================
    return (
        <div className="flex flex-col w-full h-full bg-slate-50 rounded-xl md:rounded-3xl overflow-hidden font-sans relative">
            
            {/* GLOBAL HEADER */}
            <div className="flex items-center justify-between bg-white px-4 md:px-6 py-3 border-b-2 border-blue-100 shadow-sm shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white px-3 md:px-4 py-1.5 rounded-full font-black tracking-wider text-xs md:text-sm shadow-sm">
                        {headerLabel}
                    </div>
                    <div className="text-xs font-bold text-slate-400">
                        {wordList.length > 0 ? `${currentIndex + 1} of ${wordList.length}` : ''}
                    </div>
                </div>
                
                {feedback.text && <div className={`px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md animate-in slide-in-from-top-2 ${feedback.type === 'info' ? 'bg-blue-500' : 'bg-emerald-500'}`}>{feedback.text}</div>}

                <div className="flex items-center gap-2">
                    <button onClick={() => setGameKey(prev => prev + 1)} className="flex items-center gap-1 md:gap-2 text-slate-500 hover:text-blue-600 font-bold text-xs md:text-sm bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors">
                        <RotateCcw size={16} /> <span className="hidden sm:block">Restart</span>
                    </button>
                    <button onClick={() => onComplete()} className="flex items-center gap-1 md:gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs md:text-sm px-3 py-1.5 rounded-xl transition-colors shadow-sm">
                        <CheckCircle size={16} /> <span className="hidden sm:block">Finish</span>
                    </button>
                </div>
            </div>

            {/* RESPONSIVE LAYOUT CONTAINER */}
            <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'} w-full h-full`}>
                
                {/* CANVAS STAGE (Full on Desktop, Top Half on Mobile) */}
                <div className={`relative w-full ${isMobile ? 'h-[30%] border-b-2 border-slate-200 shrink-0' : 'h-full flex-1'}`} ref={containerRef}>
                    <canvas 
                        ref={canvasRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onPointerOut={handlePointerUp}
                        className="absolute inset-0 w-full h-full touch-none select-none z-10"
                    />
                </div>

                {/* MOBILE ONLY: HTML DOM NATIVE SCROLL PALETTE */}
                {isMobile && (
                    <div className="flex-1 flex flex-col bg-slate-100/50 w-full overflow-hidden py-2 px-1 relative z-0 shadow-[inset_0_5px_15px_rgba(0,0,0,0.05)]">
                        
                        {/* Section 1: Swars (Horizontal Swipe) */}
                        <div className="shrink-0 mb-2 w-full">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-1">स्वर (Vowels)</h3>
                            <div className="flex overflow-x-auto gap-2 px-2 pb-2 hide-scrollbar w-full">
                                {swars.map(swar => (
                                    <button 
                                        key={`m-s-${swar}`}
                                        onPointerDown={(e) => startMobileDrag(e, swar, swar, false, '#3b82f6')}
                                        style={{ touchAction: 'none' }} // Stops browser scroll fighting
                                        className="w-12 h-12 shrink-0 bg-white border-2 border-blue-400 rounded-xl shadow-sm text-slate-800 font-black text-xl flex items-center justify-center active:scale-90 active:bg-blue-50 touch-none select-none"
                                    >
                                        {swar}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Matras (Horizontal Swipe - Only if Matra Mode) */}
                        {isMatraMode && (
                            <div className="shrink-0 mb-2 w-full">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-1">मात्रा (Signs)</h3>
                                <div className="flex overflow-x-auto gap-2 px-2 pb-2 hide-scrollbar w-full">
                                    {HINDI_MATRAS.map((matra, i) => {
                                        if (matra === "") return null;
                                        return (
                                            <button 
                                                key={`m-m-${i}`}
                                                onPointerDown={(e) => startMobileDrag(e, "◌" + matra, matra, true, '#f59e0b')}
                                                style={{ touchAction: 'none' }} // Stops browser scroll fighting
                                                className="w-12 h-12 shrink-0 bg-white border-2 border-amber-400 rounded-xl shadow-sm text-amber-600 font-black text-2xl flex items-center justify-center active:scale-90 active:bg-amber-50 touch-none select-none"
                                            >
                                                {"◌" + matra}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Section 3: Vyanjans (Vertical Scroll - Grouped by Varg) */}
                        <div className="flex-1 overflow-y-auto w-full px-2 hide-scrollbar pb-6 relative z-0">
                            {vargs.map((vargGrp, vIdx) => (
                                <div key={`m-vgrp-${vIdx}`} className="mb-3 w-full">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-200 pb-0.5">{vargGrp.label}</h3>
                                    <div className="flex flex-wrap gap-2 w-full">
                                        {vargGrp.chars.map(char => (
                                            <button 
                                                key={`m-v-${char}`}
                                                onPointerDown={(e) => startMobileDrag(e, char, char, false, '#10b981')}
                                                style={{ touchAction: 'none' }} // Stops browser scroll fighting
                                                className="w-12 h-12 bg-white border-2 border-emerald-400 rounded-xl shadow-sm text-slate-800 font-black text-xl flex items-center justify-center active:scale-90 active:bg-emerald-50 touch-none select-none"
                                            >
                                                {char}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                )}
            </div>

        </div>
    );
}