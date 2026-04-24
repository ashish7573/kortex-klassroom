"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Home, CheckCircle } from 'lucide-react';

// Import dictionaries
import { getWordsForSubtopic, getWordData } from '@/lib/HindiWordDictionary';
import { HINDI_ASSETS } from '@/lib/SwarVyanjanDictionary';

const swars = ["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ए", "ऐ", "ओ", "औ", "अं", "अः"];
const HINDI_MATRAS = ["ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ", "ं", "ः"];

const vargs = [
    { label: "क-वर्ग", chars: ["क", "ख", "ग", "घ", "ङ"] }, { label: "च-वर्ग", chars: ["च", "छ", "ज", "झ", "ञ"] },
    { label: "ट-वर्ग", chars: ["ट", "ठ", "ड", "ढ", "ण"] }, { label: "त-वर्ग", chars: ["त", "थ", "द", "ध", "न"] },
    { label: "प-वर्ग", chars: ["प", "फ", "ब", "भ", "म"] }, { label: "अंतस्थ", chars: ["य", "र", "ल", "व"] },
    { label: "ऊष्म", chars: ["श", "ष", "स", "ह"] }, { label: "संयुक्त", chars: ["क्ष", "त्र", "ज्ञ"] },
    { label: "अतिरिक्त", chars: ["ड़", "ढ़"] } 
];

// --- DYNAMIC TTS (Saves you from needing 400+ barahkhadi audio files) ---
const playTTS = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'hi-IN';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        }, 50);
    }
};

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
    
    const subtopicId = lesson?.subtopicId || lesson?.routePath?.split('/').pop() || 'word-builder-2';
    const titleStr = lesson?.title?.toLowerCase() || '';
    const selectedLength = titleStr.includes('3') ? 3 : titleStr.includes('4') ? 4 : 2;
    
    // --- MODE DETECTOR ---
    const isMatraMode = subtopicId.includes('matra');

    const [feedback, setFeedback] = useState({ text: '', type: '' });
    const [wordList, setWordList] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [gameKey, setGameKey] = useState(0);
    
    const stateRef = useRef({
        items: [] as any[], targetSlots: [] as any[],
        headers: [] as any[],
        imageCache: {} as Record<string, { img: HTMLImageElement, emoji: string }>, 
        scale: 1, draggingItem: null as any | null, dragOffset: { x: 0, y: 0 }, clickStart: { x: 0, y: 0, time: 0 },
        audioBtn: null as any,
        prevBtn: null as any,
        nextBtn: null as any,
        imageBox: null as any,
        isWordComplete: false,
        shuffledBases: [] as string[],
        shuffledMatras: [] as string[]
    });

    const activeAudioRef = useRef<HTMLAudioElement | null>(null);

    const playLocalAudio = (text: string) => {
        if (!text) return;
        try {
            let audioPath = '';
            if (text.length > 1) {
                const wordData = getWordData(text);
                if (wordData) audioPath = wordData.audioUrl;
            } else {
                const letterData = HINDI_ASSETS[text];
                if (letterData) audioPath = letterData.audio;
            }

            if (audioPath) {
                if (activeAudioRef.current) {
                    activeAudioRef.current.pause();
                    activeAudioRef.current.currentTime = 0;
                }
                const audio = new Audio(audioPath);
                activeAudioRef.current = audio;
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
        if (!canvas || wordList.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const state = stateRef.current;
        const isMobile = canvas.width < 768;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.setLineDash([8, 4]); ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
        ctx.beginPath(); 
        if (isMobile) { ctx.moveTo(0, canvas.height * 0.50); ctx.lineTo(canvas.width, canvas.height * 0.50); } 
        else { ctx.moveTo(canvas.width * 0.45, 0); ctx.lineTo(canvas.width * 0.45, canvas.height); }
        ctx.stroke(); ctx.setLineDash([]);

        if (state.imageBox) {
            const currentWord = wordList[currentIndex];
            const cached = state.imageCache[currentWord.word];
            
            ctx.fillStyle = '#f8fafc';
            ctx.shadowColor = 'rgba(56, 189, 248, 0.2)';
            ctx.shadowBlur = 20;
            drawRoundedRect(ctx, state.imageBox.x, state.imageBox.y, state.imageBox.size, state.imageBox.size, 24);
            ctx.fill();
            ctx.shadowBlur = 0; 
            
            if (cached && cached.img.complete && cached.img.naturalWidth > 0) {
                const pad = state.imageBox.size * 0.1;
                ctx.drawImage(cached.img, state.imageBox.x + pad, state.imageBox.y + pad, state.imageBox.size - (pad*2), state.imageBox.size - (pad*2));
            } else {
                ctx.fillStyle = '#64748b';
                ctx.font = `${state.imageBox.size * 0.5}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(currentWord.emoji || '🖼️', state.imageBox.x + state.imageBox.size/2, state.imageBox.y + state.imageBox.size/2 + 5);
            }
        }

        if (state.audioBtn) {
            const btn = state.audioBtn;
            ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3;
            drawRoundedRect(ctx, btn.x, btn.y, btn.size, btn.size, 16);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#3b82f6';
            ctx.font = `${btn.size * 0.6}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText("🔊", btn.x + btn.size/2, btn.y + btn.size/2 + 2);
        }

        // --- NEW: 2-STEP SLOT RENDERING ---
        state.targetSlots.forEach(slot => {
            if (slot.isComplete) { 
                ctx.fillStyle = '#f0fdf4'; ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 4; 
            } else if (slot.isBaseFilled) {
                ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3;
            } else { 
                ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3; 
            }
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

        state.headers.forEach(h => {
            ctx.fillStyle = '#475569'; ctx.font = `bold ${12 * state.scale}px sans-serif`; ctx.textAlign = 'left'; ctx.fillText(h.text, h.x, h.y);
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
    }, [wordList, currentIndex]);

    const resizeAndLayout = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || wordList.length === 0) return;

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        const state = stateRef.current;
        const w = canvas.width;
        const h = canvas.height;
        const isMobile = w < 768; 
        
        state.scale = isMobile ? 0.8 : 1;
        
        const oldSlots = [...state.targetSlots];
        
        state.targetSlots = []; state.items = []; state.headers = []; 
        state.audioBtn = null; state.imageBox = null; state.prevBtn = null; state.nextBtn = null;

        const puzzleW = isMobile ? w : w * 0.45;
        const puzzleH = isMobile ? h * 0.50 : h;
        
        const imageSize = isMobile 
            ? Math.min(puzzleW * 0.6, puzzleH * 0.45, 240)  
            : Math.min(puzzleW * 0.6, puzzleH * 0.55, 320); 

        const imageX = (puzzleW / 2) - (imageSize / 2);
        const imageY = isMobile ? 15 : (puzzleH * 0.10);
        state.imageBox = { x: imageX, y: imageY, size: imageSize };

        // --- NEW: MATRA & GRAPHEME PARSER ---
        const currentWord = wordList[currentIndex];
        const segmenter = new Intl.Segmenter('hi-IN', { granularity: 'grapheme' });
        const charArray = Array.from(segmenter.segment(currentWord.word)).map(s => s.segment);
        const actualLength = charArray.length;

        const slotSize = Math.min(puzzleW / (actualLength + 2), isMobile ? 60 : 75);
        const totalSlotsWidth = actualLength * slotSize + ((actualLength - 1) * 10);
        
        const audioBtnSize = slotSize * 0.8;
        const audioGap = 15;
        const totalBlockWidth = audioBtnSize + audioGap + totalSlotsWidth;
        
        const blockStartX = (puzzleW / 2) - (totalBlockWidth / 2);
        const blockY = imageY + imageSize + (isMobile ? 15 : 30);

        state.audioBtn = { x: blockStartX, y: blockY + (slotSize/2) - (audioBtnSize/2), size: audioBtnSize, word: currentWord.word };

        const slotStartX = blockStartX + audioBtnSize + audioGap;
        
        charArray.forEach((char: string, charIdx: number) => {
            const xSlot = slotStartX + (charIdx * (slotSize + 10));
            const previousProgress = oldSlots.find(s => s.wordIdx === currentIndex && s.charIdx === charIdx);
            
            // Engine logically separates bases and matras
            let tBase = char;
            let tMatra = "";
            for (let m of HINDI_MATRAS) {
                if (char.endsWith(m)) {
                    tBase = char.replace(m, '');
                    tMatra = m;
                    break;
                }
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

        const arrowSize = isMobile ? 35 : 45;
        const arrowY = imageY + (imageSize/2) - (arrowSize/2);
        state.prevBtn = { x: 10, y: arrowY, size: arrowSize };
        state.nextBtn = { x: puzzleW - arrowSize - 10, y: arrowY, size: arrowSize };

        const paletteX = isMobile ? 0 : puzzleW + 20; 
        const paletteY = isMobile ? puzzleH + 15 : 20;
        const paletteW = isMobile ? w : w - paletteX - 20;
        let curY = paletteY;

        // =====================================
        // THE RESPONSIVE MATRA PALETTE RENDERER
        // =====================================
        if (isMobile) {
            const cols = 5;
            const mobileBoxSize = Math.min(paletteW / 6, 52); 
            const rowWidth = (cols * mobileBoxSize) + ((cols - 1) * 8);
            const startX = (w - rowWidth) / 2; 

            // Shuffle required characters to fit mobile screens
            if (state.shuffledBases.length === 0) {
                const reqBases = new Set<string>();
                const reqMatras = new Set<string>();
                wordList.forEach(wData => {
                    Array.from(segmenter.segment(wData.word)).forEach((s: any) => {
                        let b = s.segment, m = "";
                        for (let mat of HINDI_MATRAS) {
                            if (s.segment.endsWith(mat)) { b = s.segment.replace(mat, ''); m = mat; break; }
                        }
                        reqBases.add(b);
                        if (m) reqMatras.add(m);
                    });
                });

                const allBases = [...swars, ...vargs.flatMap(v => v.chars)];
                while(reqBases.size < (isMatraMode ? 10 : 15)) reqBases.add(allBases[Math.floor(Math.random() * allBases.length)]);
                state.shuffledBases = Array.from(reqBases).slice(0, isMatraMode ? 10 : 15).sort(() => 0.5 - Math.random());

                if (isMatraMode) {
                    while(reqMatras.size < 5) {
                        const rMatra = HINDI_MATRAS[Math.floor(Math.random() * HINDI_MATRAS.length)];
                        if(rMatra !== "") reqMatras.add(rMatra);
                    }
                    state.shuffledMatras = Array.from(reqMatras).slice(0, 5).sort(() => 0.5 - Math.random());
                }
            }

            state.headers.push({ text: "अक्षर (Letters)", x: startX, y: curY });
            curY += 25;
            let bCol = 0;
            state.shuffledBases.forEach((base: string) => {
                if(bCol >= cols) { bCol = 0; curY += mobileBoxSize + 8; }
                const x = startX + (bCol * (mobileBoxSize + 8));
                state.items.push({ char: base, value: base, x, y: curY, size: mobileBoxSize, color: '#10b981', isMatra: false });
                bCol++;
            });

            if (isMatraMode) {
                curY += mobileBoxSize + 15;
                state.headers.push({ text: "मात्रा (Signs)", x: startX, y: curY });
                curY += 25;
                bCol = 0;
                state.shuffledMatras.forEach((matra: string) => {
                    if(bCol >= cols) { bCol = 0; curY += mobileBoxSize + 8; }
                    const x = startX + (bCol * (mobileBoxSize + 8));
                    state.items.push({ char: "◌" + matra, value: matra, x, y: curY, size: mobileBoxSize, color: '#f59e0b', isMatra: true });
                    bCol++;
                });
            }

        } else {
            // DESKTOP: Full fixed grids
            const boxSize = Math.min(paletteW / (swars.length + 1), 40);
            
            state.headers.push({ text: "स्वर (Vowels)", x: paletteX, y: curY });
            curY += 20;
            swars.forEach((swar, i) => {
                const x = paletteX + (i * (boxSize + 4));
                state.items.push({ char: swar, value: swar, x, y: curY, size: boxSize, color: '#3b82f6', isMatra: false });
            });
            curY += boxSize + 20;

            // Conditional Matra Row (Chapter 4+)
            if (isMatraMode) {
                state.headers.push({ text: "मात्रा (Signs)", x: paletteX, y: curY });
                curY += 20;
                HINDI_MATRAS.filter(m => m !== "").forEach((matra, i) => {
                    const x = paletteX + (i * (boxSize + 4));
                    state.items.push({ char: "◌" + matra, value: matra, x, y: curY, size: boxSize, color: '#f59e0b', isMatra: true });
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
    }, [draw, wordList, currentIndex, selectedLength, isMatraMode]);

    useEffect(() => {
        let availableWords = getWordsForSubtopic(subtopicId);
        if (availableWords.length === 0) return;

        const shuffled = [...availableWords].sort(() => 0.5 - Math.random());
        setWordList(shuffled);
        setCurrentIndex(0);
        
        stateRef.current.shuffledBases = []; 
        stateRef.current.shuffledMatras = [];
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
    }, [currentIndex, wordList, resizeAndLayout]);

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

    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const isHit = (pos: any, box: any) => {
        if (!box) return false;
        return pos.x >= box.x && pos.x <= box.x + box.size && pos.y >= box.y && pos.y <= box.y + box.size;
    };

    const handlePointerDown = (e: any) => {
        const pos = getPos(e);
        const state = stateRef.current;
        state.clickStart = { x: pos.x, y: pos.y, time: Date.now() };

        if (isHit(pos, state.audioBtn)) { playLocalAudio(state.audioBtn.word); return; }
        
        if (isHit(pos, state.prevBtn) && currentIndex > 0) {
            state.isWordComplete = false;
            setCurrentIndex(prev => prev - 1); return;
        }
        if (isHit(pos, state.nextBtn) && currentIndex < wordList.length - 1) {
            state.isWordComplete = false;
            setCurrentIndex(prev => prev + 1); return;
        }
        
        if (isHit(pos, state.imageBox)) { playLocalAudio(wordList[currentIndex].word); return; }

        for (let item of state.items) {
            if (isHit(pos, item)) {
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

    // --- NEW: TWO-STEP DROP & TTS LOGIC ---
    const handlePointerUp = (e: any) => {
        const state = stateRef.current;
        if (!state.draggingItem) return;

        const pos = getPos(e);
        const dist = Math.hypot(pos.x - state.clickStart.x, pos.y - state.clickStart.y);
        const di = state.draggingItem;

        // Quick Click Audio
        if (Date.now() - state.clickStart.time < 250 && dist < 10) {
            if (di.isMatra) {
                const mIdx = HINDI_MATRAS.indexOf(di.value);
                if (mIdx > -1) playTTS(swars[mIdx] + " की मात्रा");
            } else {
                playLocalAudio(di.char);
            }
        } else {
            // Drag and Drop Snapping
            for (let slot of state.targetSlots) {
                if (slot.isComplete) continue;
                const d = Math.hypot((di.x + di.size/2) - (slot.x + slot.size/2), (di.y + di.size/2) - (slot.y + slot.size/2));
                
                if (d < slot.size * 1.2) {
                    
                    // STEP 1: Dropping the Base Letter
                    if (!slot.isBaseFilled && !di.isMatra && di.value === slot.targetBase) {
                        slot.isBaseFilled = true;
                        slot.currentBase = di.value;
                        
                        if (slot.targetMatra === "") {
                            slot.isComplete = true; // Auto-complete if no matra needed
                        }
                        
                        playLocalAudio(di.value);
                        checkWinCondition(state);
                        break;
                    } 
                    // STEP 2: Dropping the Matra on a filled base
                    else if (slot.isBaseFilled && !slot.isComplete && di.isMatra && di.value === slot.targetMatra) {
                        slot.currentMatra = di.value;
                        slot.isComplete = true;
                        
                        playTTS(slot.currentBase + slot.currentMatra); // Dynamic Barahkhadi voice!
                        checkWinCondition(state);
                        break;
                    }
                }
            }
        }

        state.draggingItem = null;
        draw();
    };

    const checkWinCondition = (state: any) => {
        if (state.targetSlots.every((s: any) => s.isComplete)) {
            state.isWordComplete = true; 
            playSuccessChime(); 
            showTempFeedback("बहुत बढ़िया! (Excellent!)");
            setTimeout(() => { playLocalAudio(wordList[currentIndex].word); }, 500);
        }
    };

    return (
        <div className="flex flex-col w-full h-full bg-slate-50 rounded-xl md:rounded-3xl overflow-hidden font-sans relative">
            <div className="flex items-center justify-between bg-white px-4 md:px-6 py-3 border-b-2 border-blue-100 shadow-sm shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white px-3 md:px-4 py-1.5 rounded-full font-black tracking-wider text-xs md:text-sm shadow-sm">
                        {selectedLength}-Letter Words
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
        </div>
    );
}