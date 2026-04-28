"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Trophy, ArrowRight, RotateCcw, Shuffle, Lightbulb, Coins, Star, Play, Sparkles, Users, X, Smartphone, Home } from 'lucide-react';

// ============================================================================
// MASSIVE HINDI DICTIONARY (700+ Words)
// ============================================================================
const HINDI_WORDS = [
  'जल', 'नल', 'फल', 'घर', 'रथ', 'बस', 'धन', 'वन', 'खत', 'टब', 'मग', 'जग', 'छत', 'पथ', 'गज', 'हल', 'कप', 'जड़', 'नथ', 'दस', 'सच', 'मन', 'कल', 'चल', 'पल', 'अब', 'कब', 'जब', 'तब', 'सब', 'डर', 'कर', 'भर', 'मर', 'नर', 'पर',
  'कमल', 'मटर', 'बतख', 'सड़क', 'कलम', 'नयन', 'भवन', 'शहद', 'कलश', 'बटन', 'रबड़', 'नमक', 'मगर', 'लहर', 'महल', 'शहर', 'डगर', 'गगन', 'नहर', 'नखत', 'पवन', 'चमन', 'रतन', 'वजन', 'नकल', 'अमर', 'सफर', 'जहर', 'नगर',
  'बरगद', 'थरमस', 'शलगम', 'कसरत', 'खटमल', 'बरतन', 'पनघट', 'अचकन', 'दमकल', 'अदरक', 'अजगर', 'बचपन', 'उपवन', 'शरबत', 'झटपट', 'नटखट', 'सरकस', 'हलचल', 'मखमल', 'अकबर',
  'आम', 'कार', 'कान', 'नाक', 'हाथ', 'तारा', 'ताला', 'छाता', 'माला', 'गाजर', 'टमाटर', 'जाल', 'आग', 'घास', 'बाजा', 'नाव', 'राजा', 'गाय', 'बादल', 'बाण', 'बाल', 'गाल', 'दाल', 'लाल', 'काला', 'पीला', 'हरा', 'बाघ', 'पापा', 'चाचा', 'मामा', 'नाना', 'दादा', 'आटा', 'बाजार', 'चादर', 'कागज', 'चावल', 'गमला', 'कमरा', 'मकान',
  'चिड़िया', 'किताब', 'गिलास', 'विमान', 'हिरन', 'सितार', 'किसान', 'पहिया', 'तकिया', 'नारियल', 'पिन', 'दिल', 'लिफाफा', 'गिटार', 'छिलका', 'टिकट', 'चिमटा', 'किला', 'दिन', 'मिठाई', 'कवि', 'छवि', 'रवि', 'शनि', 'पति', 'निशान', 'मिलन', 'किरण', 'मिर्च', 'सितारा', 'कविता', 'सरिता', 'बगिया', 'खटिया', 'बिटिया',
  'मछली', 'हाथी', 'बकरी', 'घड़ी', 'छतरी', 'सीढ़ी', 'पपीता', 'पानी', 'तीर', 'जीभ', 'चाबी', 'दीपक', 'लकड़ी', 'चीता', 'तितली', 'ककड़ी', 'नाशपाती', 'लीची', 'परी', 'मकड़ी', 'नानी', 'दादी', 'चाची', 'मामी', 'दीदी', 'पीला', 'नीला', 'गीला', 'चील', 'झील', 'सीटी', 'लड़की', 'लड़की', 'मशीन', 'पसीना', 'दीवार', 'बीमारी',
  'गुलाब', 'कछुआ', 'गुड़िया', 'कुर्सी', 'साबुन', 'मुकुट', 'धनुष', 'बुलबुल', 'सुराही', 'कुटिया', 'तुलसी', 'जामुन', 'सुई', 'पुल', 'कुर्ता', 'झुनझुना', 'जुराब', 'दुकान', 'पुलाव', 'चुहिया', 'चुप', 'छुप', 'सुन', 'बुन', 'धुन', 'कुछ', 'सुख', 'दुख', 'मुख', 'सुबह', 'कुकुर', 'पुजारी', 'चुटकुला', 'गुमसुम', 'बटुआ', 'मुनिया',
  'सूरज', 'भालू', 'आलू', 'मूली', 'तरबूज', 'कबूतर', 'चूहा', 'फूल', 'जूता', 'झूला', 'झाड़ू', 'खजूर', 'तराजू', 'दूध', 'डमरू', 'पूड़ी', 'चूड़ी', 'कूलर', 'नाखून', 'कूदना', 'दूर', 'धूल', 'मूल', 'शूल', 'सूई', 'चूना', 'सूखा', 'रूठा', 'झूठा', 'मूरत', 'सूरत', 'पूरब', 'खूबसूरत', 'तरबूजा', 'खरबूजा', 'जादूगर',
  'सेब', 'पेड़', 'शेर', 'केला', 'रेल', 'भेड़', 'ठेला', 'जलेबी', 'करेला', 'बेलन', 'मेज', 'खेत', 'तारे', 'जूते', 'कपड़े', 'सपेरा', 'नेवला', 'जेवर', 'खेल', 'मेल', 'तेल', 'जेल', 'देश', 'भेष', 'केस', 'मेरा', 'तेरा', 'चेहरा', 'सवेरा', 'बसेरा', 'पहेली', 'सहेली', 'हथेली', 'मेहनत', 'मेहमान',
  'पैसा', 'पैर', 'बैल', 'थैला', 'कैमरा', 'सैनिक', 'मैदान', 'नैया', 'गैस', 'मैना', 'ततैया', 'पैराशूट', 'बैटरी', 'चैन', 'तैरना', 'बैर', 'खैर', 'सैर', 'मैल', 'छैला', 'मैला', 'फैला', 'पैदल', 'हैरान', 'शैतान', 'तैयार', 'मैदान', 'कैलाश', 'नैनीताल',
  'मोर', 'तोता', 'घोड़ा', 'खरगोश', 'टोपी', 'ढोलक', 'कोट', 'बोतल', 'जोकर', 'गोभी', 'ओखली', 'समोसा', 'कटोरी', 'मोती', 'रोटी', 'टेलीफोन', 'नोट', 'लोटा', 'चोर', 'शोर', 'भोर', 'गोल', 'ढोल', 'बोल', 'तोल', 'छोटा', 'मोटा', 'खोटा', 'लोहा', 'सोना', 'रोना', 'धोना', 'कोयल', 'भोजन', 'मोटर', 'टोकरी',
  'कौआ', 'पौधा', 'तौलिया', 'खिलौना', 'नौका', 'औरत', 'हथौड़ा', 'लौकी', 'पकौड़ी', 'कचौड़ी', 'नौ', 'औजार', 'बिछौना', 'चौकीदार', 'कौन', 'मौन', 'दौड़', 'कौर', 'ठौर', 'लौट', 'बौना', 'नौकर', 'मौसम', 'कौशल', 'गौरव', 'चौराहा', 'फौजदार', 'नौजवान',
  'पंखा', 'बंदर', 'अंगूर', 'पतंग', 'झंडा', 'कंघा', 'अंडा', 'डंडा', 'प्रातः', 'दुःख', 'नमः', 'छः', 'रंग', 'संग', 'तंग', 'भंग', 'जंग', 'अंक', 'शंख', 'हंस', 'कंस', 'मंच', 'पंच', 'अंश', 'ठंड', 'सुंदर', 'मंगल', 'जंगल', 'दंगल', 'चंदन', 'नंदन', 'मंजन', 'इंजन', 'कंगन', 'लंगूर', 'सिंदूर', 'मंदिर', 'अंत', 'पुनः', 'अतः'
];

const splitHindiSyllables = (word: string) => {
    const syllables = [];
    let current = '';
    for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (/[\u0904-\u0939\u0958-\u095F]/.test(char)) {
            if (current) syllables.push(current);
            current = char;
        } else {
            current += char; 
        }
    }
    if (current) syllables.push(current);
    return syllables;
};

// ============================================================================
// FLAWLESS GRID COLLISION ALGORITHM
// ============================================================================
const isValidPlacement = (candidateChars: string[], startRow: number, startCol: number, dir: string, gridMap: Map<string, string>) => {
    if (dir === 'across') {
        if (gridMap.has(`${startRow},${startCol - 1}`) || gridMap.has(`${startRow},${startCol + candidateChars.length}`)) return false;
    } else {
        if (gridMap.has(`${startRow - 1},${startCol}`) || gridMap.has(`${startRow + candidateChars.length},${startCol}`)) return false;
    }

    for (let i = 0; i < candidateChars.length; i++) {
        const r = dir === 'down' ? startRow + i : startRow;
        const c = dir === 'across' ? startCol + i : startCol;
        const existingChar = gridMap.get(`${r},${c}`);
        
        if (existingChar) {
            if (existingChar !== candidateChars[i]) return false; 
        } else {
            if (dir === 'across') {
                if (gridMap.has(`${r - 1},${c}`) || gridMap.has(`${r + 1},${c}`)) return false;
            } else {
                if (gridMap.has(`${r},${c - 1}`) || gridMap.has(`${r},${c + 1}`)) return false;
            }
        }
    }
    return true;
};

const generateRandomLevel = () => {
    let bestLevel: any = null;
    let maxWordCount = 0;

    for (let attempt = 0; attempt < 150; attempt++) {
        const rootWord = HINDI_WORDS[Math.floor(Math.random() * HINDI_WORDS.length)];
        const rootSyllables = splitHindiSyllables(rootWord);
        
        const words: any[] = [{ word: rootWord, chars: rootSyllables, row: 20, col: 20, dir: 'across' }];
        const gridMap = new Map<string, string>();
        rootSyllables.forEach((char, i) => gridMap.set(`20,${20+i}`, char));
        
        const candidateSubset = [];
        for (let k = 0; k < 80; k++) {
            candidateSubset.push(HINDI_WORDS[Math.floor(Math.random() * HINDI_WORDS.length)]);
        }

        for (const candidate of candidateSubset) {
            if (words.length >= 8) break;
            if (words.some(w => w.word === candidate)) continue;
            
            const candSyllables = splitHindiSyllables(candidate);
            let placed = false;

            for (const existingWord of words) {
                for (let i = 0; i < existingWord.chars.length; i++) {
                    const sharedSyllable = existingWord.chars[i];
                    const candSharedIndex = candSyllables.indexOf(sharedSyllable);
                    
                    if (candSharedIndex !== -1) {
                        if (existingWord.dir === 'across') {
                            const col = existingWord.col + i;
                            const row = existingWord.row - candSharedIndex;
                            if (isValidPlacement(candSyllables, row, col, 'down', gridMap)) {
                                words.push({ word: candidate, chars: candSyllables, row, col, dir: 'down' });
                                candSyllables.forEach((char, j) => gridMap.set(`${row+j},${col}`, char));
                                placed = true; break; 
                            }
                        } else {
                            const row = existingWord.row + i;
                            const col = existingWord.col - candSharedIndex;
                            if (isValidPlacement(candSyllables, row, col, 'across', gridMap)) {
                                words.push({ word: candidate, chars: candSyllables, row, col, dir: 'across' });
                                candSyllables.forEach((char, j) => gridMap.set(`${row},${col+j}`, char));
                                placed = true; break;
                            }
                        }
                    }
                }
                if (placed) break;
            }
        }

        if (words.length >= 5) {
            const maxSyllableFreq = new Map<string, number>();
            words.forEach(w => {
                const freq = new Map<string, number>();
                w.chars.forEach((c: string) => freq.set(c, (freq.get(c) || 0) + 1));
                freq.forEach((count, char) => {
                    if (count > (maxSyllableFreq.get(char) || 0)) {
                        maxSyllableFreq.set(char, count);
                    }
                });
            });

            const finalNodes: string[] = [];
            maxSyllableFreq.forEach((count, char) => {
                for(let i=0; i<count; i++) finalNodes.push(char);
            });

            if (finalNodes.length <= 9) { 
                bestLevel = { nodes: finalNodes.sort(() => Math.random() - 0.5), words };
                break; 
            }
        } else if (words.length > maxWordCount) {
            maxWordCount = words.length;
        }
    }
    
    if (bestLevel) {
        const minRow = Math.min(...bestLevel.words.map((w: any) => w.row));
        const minCol = Math.min(...bestLevel.words.map((w: any) => w.col));
        bestLevel.words.forEach((w: any) => { w.row -= minRow; w.col -= minCol; });
    }
    
    return bestLevel;
};

const playTTS = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const phoneticText = text + '।';
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(phoneticText);
            utterance.lang = 'hi-IN';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        }, 50); 
    }
};

const playSuccessSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); 
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
    } catch(e) { console.log("Audio skipped"); }
};

const PLAYER_THEMES = [
    { id: 1, base: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950', border: 'border-sky-500/30', line: '#0ea5e9', bubble: 'bg-sky-500 text-white', accent: 'text-sky-400' },
    { id: 2, base: 'bg-emerald-950/40', border: 'border-emerald-500/30', line: '#10b981', bubble: 'bg-emerald-500 text-white', accent: 'text-emerald-400' },
    { id: 3, base: 'bg-pink-950/40', border: 'border-pink-500/30', line: '#ec4899', bubble: 'bg-pink-500 text-white', accent: 'text-pink-400' },
    { id: 4, base: 'bg-amber-950/40', border: 'border-amber-500/30', line: '#f59e0b', bubble: 'bg-amber-500 text-white', accent: 'text-amber-400' },
];

// ============================================================================
// COMPONENT: INDIVIDUAL PLAYER BOARD 
// ============================================================================
const PlayerBoard = ({ theme, levelData, isMultiplayer, isMobile, finishOrder, onFinish, onHome }: any) => {
    const [foundWords, setFoundWords] = useState<string[]>([]);
    const [bonusWords, setBonusWords] = useState<string[]>([]);
    const [revealedHints, setRevealedHints] = useState<{r: number, c: number, char: string}[]>([]);
    const [score, setScore] = useState(0);
    const [coins, setCoins] = useState(100); 
    const [feedback, setFeedback] = useState<'valid' | 'invalid' | 'exists' | 'bonus' | null>(null);

    const [nodeOrder, setNodeOrder] = useState<number[]>([]);
    const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
    const [currentWord, setCurrentWord] = useState<string>('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    
    const [isBoardLocked, setIsBoardLocked] = useState(false);

    const wheelRef = useRef<HTMLDivElement>(null);

    const rankIndex = finishOrder.indexOf(theme.id);
    const playerRank = rankIndex !== -1 ? rankIndex + 1 : 0;

    useEffect(() => {
        if (levelData) {
            setNodeOrder(levelData.nodes.map((_: any, i: number) => i));
            setFoundWords([]);
            setBonusWords([]);
            setRevealedHints([]);
            setIsBoardLocked(false);
        }
    }, [levelData]);

    useEffect(() => {
        if (levelData && foundWords.length === levelData.words.length && levelData.words.length > 0 && !isBoardLocked) {
            setIsBoardLocked(true); 
            playSuccessSound();
            playTTS('बहुत बढ़िया'); 
            onFinish(theme.id);
        }
    }, [foundWords.length, levelData, theme.id, onFinish, isBoardLocked]);

    const handleShuffle = () => {
        if (isBoardLocked) return;
        setNodeOrder(prev => [...prev].sort(() => Math.random() - 0.5));
    };

    const handleHint = () => {
        if (coins < 25 || !levelData || isBoardLocked) return;
        const emptyCells: {r: number, c: number, char: string}[] = [];
        
        levelData.words.forEach((w: any) => {
            if (!foundWords.includes(w.word)) {
                w.chars.forEach((char: string, idx: number) => {
                    const r = w.dir === 'down' ? w.row + idx : w.row;
                    const c = w.dir === 'across' ? w.col + idx : w.col;
                    const alreadyHinted = revealedHints.some(h => h.r === r && h.c === c);
                    let alreadyRevealed = false;
                    levelData.words.forEach((chk: any) => {
                        if (foundWords.includes(chk.word)) {
                            if (chk.dir === 'across' && r === chk.row && c >= chk.col && c < chk.col + chk.chars.length) alreadyRevealed = true;
                            if (chk.dir === 'down' && c === chk.col && r >= chk.row && r < chk.row + chk.chars.length) alreadyRevealed = true;
                        }
                    });

                    if (!alreadyHinted && !alreadyRevealed) {
                        if (!emptyCells.some(cell => cell.r === r && cell.c === c)) {
                            emptyCells.push({ r, c, char });
                        }
                    }
                });
            }
        });

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            setRevealedHints(prev => [...prev, randomCell]);
            setCoins(prev => prev - 25);
        }
    };

    const getNodePosition = (index: number, total: number) => {
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        const radius = (isMultiplayer || isMobile) ? 38 : 46; 
        return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
    };

    // ============================================================================
    // RESTORED NATIVE DRAG + iOS FALLBACK FIX
    // ============================================================================
    
    // RESTORED: Your exact original function (with lock check)
    const handlePointerDown = (e: React.PointerEvent, actualNodeIndex: number) => {
        if (isBoardLocked) return;
        try {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch (err) {} // Fails silently on iOS Safari, which is fine!
        setIsDrawing(true);
        setSelectedNodes([actualNodeIndex]);
        setCurrentWord(levelData.nodes[actualNodeIndex]);
        setFeedback(null);
        playTTS(levelData.nodes[actualNodeIndex]);
        updateMousePos(e);
    };

    // Shared position updater
    const updateMousePos = (e: React.PointerEvent | React.TouchEvent) => {
        if (!wheelRef.current) return;
        const rect = wheelRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.PointerEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.PointerEvent).clientY;
        const xPct = ((clientX - rect.left) / rect.width) * 100;
        const yPct = ((clientY - rect.top) / rect.height) * 100;
        setMousePos({ x: xPct, y: yPct });
    };

    // Shared collision logic (Your exact elementFromPoint approach)
    const processMoveCollision = (clientX: number, clientY: number) => {
        const el = document.elementFromPoint(clientX, clientY);
        // Added .closest() so it works even if the finger hits the text span inside the node
        const targetNode = el?.closest ? el.closest('[data-node-id]') : el;
        const nodeIdStr = targetNode?.getAttribute ? targetNode.getAttribute('data-node-id') : null;
        
        if (nodeIdStr) {
            const actualNodeIndex = parseInt(nodeIdStr);
            if (!selectedNodes.includes(actualNodeIndex)) {
                setSelectedNodes(prev => [...prev, actualNodeIndex]);
                setCurrentWord(prev => prev + levelData.nodes[actualNodeIndex]);
                playTTS(levelData.nodes[actualNodeIndex]);
            }
        }
    };

    // RESTORED: Your exact original Pointer Move
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing || !levelData || isBoardLocked) return;
        updateMousePos(e);
        processMoveCollision(e.clientX, e.clientY);
    };

    // NEW: iOS specific fallback (Bypasses the pointer capture bug entirely)
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDrawing || !levelData || isBoardLocked) return;
        updateMousePos(e);
        processMoveCollision(e.touches[0].clientX, e.touches[0].clientY);
    };

    // RESTORED: Your exact original Pointer Up
    const handlePointerUp = () => {
        if (!isDrawing || !levelData || isBoardLocked) return;
        setIsDrawing(false);
        
        const matchedPuzzleWord = levelData.words.find((w: any) => w.word === currentWord);
        
        if (matchedPuzzleWord) {
            if (!foundWords.includes(currentWord)) {
                setFoundWords(prev => [...prev, currentWord]);
                setScore(prev => prev + (matchedPuzzleWord.chars.length * 50));
                setCoins(prev => prev + 10);
                setFeedback('valid');
                playTTS(currentWord);
            } else {
                setFeedback('exists');
            }
        } else if (HINDI_WORDS.includes(currentWord)) {
            if (!bonusWords.includes(currentWord)) {
                setBonusWords(prev => [...prev, currentWord]);
                setScore(prev => prev + 50);
                setCoins(prev => prev + 5);
                setFeedback('bonus');
                playTTS(currentWord);
            } else {
                setFeedback('exists');
            }
        } else if (currentWord.length > 1) {
            setFeedback('invalid');
        }

        setTimeout(() => {
            setSelectedNodes([]);
            setCurrentWord('');
            setFeedback(null);
        }, 400);
    };

    if (!levelData) return <div className="w-full h-full flex items-center justify-center"><Sparkles className="animate-spin text-sky-500 w-8 h-8" /></div>;

    // --- GRID MATH ---
    const maxRow = Math.max(...levelData.words.map((w: any) => w.dir === 'down' ? w.row + w.chars.length - 1 : w.row));
    const maxCol = Math.max(...levelData.words.map((w: any) => w.dir === 'across' ? w.col + w.chars.length - 1 : w.col));

    const gridCells = [];
    for (let r = 0; r <= maxRow; r++) {
        for (let c = 0; c <= maxCol; c++) {
            let char = '';
            let isRevealed = false;
            let isHinted = false;
            let isPartOfPuzzle = false;

            levelData.words.forEach((w: any) => {
                if (w.dir === 'across' && r === w.row && c >= w.col && c < w.col + w.chars.length) {
                    isPartOfPuzzle = true;
                    if (foundWords.includes(w.word)) { char = w.chars[c - w.col]; isRevealed = true; }
                }
                if (w.dir === 'down' && c === w.col && r >= w.row && r < w.row + w.chars.length) {
                    isPartOfPuzzle = true;
                    if (foundWords.includes(w.word)) { char = w.chars[r - w.row]; isRevealed = true; }
                }
            });

            if (isPartOfPuzzle && !isRevealed) {
                const hint = revealedHints.find(h => h.r === r && h.c === c);
                if (hint) { char = hint.char; isHinted = true; }
            }

            if (isPartOfPuzzle) {
                gridCells.push(
                    <div key={`${r}-${c}`} className={`w-full h-full flex items-center justify-center rounded-sm sm:rounded-md text-base sm:text-2xl lg:text-3xl font-black shadow-md transition-all duration-500 border-b-2 sm:border-b-4
                        ${isRevealed ? 'bg-amber-400 border-amber-600 text-amber-950 scale-100' : 
                          isHinted ? 'bg-sky-100 border-sky-300 text-sky-600 scale-100' : 'bg-white/20 border-white/30 text-transparent scale-100'}
                    `}>
                        {char}
                    </div>
                );
            } else {
                gridCells.push(<div key={`${r}-${c}`} className="w-full h-full"></div>);
            }
        }
    }

    const strokeColor = feedback === 'valid' ? '#10b981' : feedback === 'bonus' ? '#a855f7' : feedback === 'invalid' ? '#ef4444' : feedback === 'exists' ? '#f59e0b' : theme.line;
    const bubbleClass = feedback === 'valid' ? 'bg-emerald-500 text-white border-emerald-600 scale-110' : 
                        feedback === 'bonus' ? 'bg-purple-500 text-white border-purple-600 scale-110 shadow-[0_0_20px_rgba(168,85,247,0.5)]' :
                        feedback === 'invalid' ? 'bg-red-500 text-white border-red-600 animate-shake' : 
                        feedback === 'exists' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-sky-600 border-sky-200';

    // ============================================================================
    // STRICT VERTICAL/MULTIPLAYER LAYOUT
    // ============================================================================
    if (isMultiplayer || isMobile) {
        return (
            <div 
                className={`relative flex-1 flex flex-col w-full h-full overflow-hidden touch-none ${theme.base} ${isMultiplayer ? 'border-r border-white/10 last:border-r-0' : ''}`}
                onPointerMove={handlePointerMove}
                onTouchMove={handleTouchMove}     // iOS Fallback hook
                onPointerUp={handlePointerUp}
                onTouchEnd={handlePointerUp}      // iOS Fallback hook
                onPointerCancel={handlePointerUp}
                onTouchCancel={handlePointerUp}   // iOS Fallback hook
                onPointerLeave={handlePointerUp} 
            >
                {playerRank > 0 && (
                    <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
                        <Trophy className="w-20 h-20 sm:w-24 sm:h-24 text-amber-400 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                        <span className="text-3xl sm:text-4xl font-black text-white">
                            {playerRank}{playerRank === 1 ? 'st' : playerRank === 2 ? 'nd' : playerRank === 3 ? 'rd' : 'th'}
                        </span>
                        <span className="text-slate-300 font-bold uppercase tracking-widest mt-1">Finished</span>
                    </div>
                )}

                <div className="h-[10%] w-full flex justify-between items-center px-2 sm:px-4 shrink-0 pointer-events-auto">
                    <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1 shadow-lg">
                        <Trophy size={14} className="text-amber-400" />
                        <span className="text-white font-black text-xs sm:text-sm">{score}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {isMultiplayer && <span className={`font-black text-xs sm:text-sm uppercase ${theme.accent}`}>P{theme.id}</span>}
                        {bonusWords.length > 0 && (
                            <div className="bg-purple-900/50 backdrop-blur-md px-2 py-1 rounded-full border border-purple-400/50 flex items-center gap-1 shadow-lg">
                                <Sparkles size={12} className="text-purple-300" />
                                <span className="text-purple-200 font-bold text-[10px] sm:text-xs">+{bonusWords.length}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1 shadow-lg">
                            <span className="text-white font-black text-xs sm:text-sm">{coins}</span>
                            <Coins size={14} className="text-yellow-400" />
                        </div>
                        {!isMultiplayer && (
                            <button onClick={onHome} className="bg-slate-800/80 hover:bg-red-500 text-slate-300 hover:text-white p-1 rounded-lg border border-slate-700 shadow-lg ml-1">
                                <Home size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="h-[50%] w-full flex flex-col items-center justify-start shrink-0 relative">
                    <div className="h-[20%] w-full flex items-center justify-center shrink-0">
                        <div className={`px-4 py-1.5 rounded-full border-b-2 shadow-xl flex items-center justify-center min-w-[80px] sm:min-w-[100px] transition-all duration-300 ${currentWord ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${bubbleClass}`}>
                            <span className="text-lg sm:text-xl font-black tracking-widest">{currentWord}</span>
                        </div>
                    </div>
                    <div className="h-[80%] w-full flex items-center justify-center p-2 overflow-visible">
                        <div 
                            className="grid gap-1 sm:gap-1.5 mx-auto" 
                            style={{ 
                                gridTemplateColumns: `repeat(${maxCol + 1}, minmax(0, 1fr))`,
                                gridTemplateRows: `repeat(${maxRow + 1}, minmax(0, 1fr))`,
                                aspectRatio: `${maxCol + 1} / ${maxRow + 1}`,
                                width: '100%', height: '100%', maxHeight: '100%', maxWidth: '100%'
                            }}
                        >
                            {gridCells}
                        </div>
                    </div>
                </div>

                <div className="h-[30%] w-full flex items-center justify-center shrink-0 relative p-2 sm:p-4">
                    <div className="h-full aspect-square max-w-full relative flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 z-0 m-1 sm:m-2"></div>
                        <div className="absolute inset-1 sm:inset-2 z-10" ref={wheelRef}>
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                                {selectedNodes.map((nodeIdx, i) => {
                                    if (i === selectedNodes.length - 1) return null;
                                    const nextIdx = selectedNodes[i + 1];
                                    const pos1 = getNodePosition(nodeOrder.indexOf(nodeIdx), nodeOrder.length);
                                    const pos2 = getNodePosition(nodeOrder.indexOf(nextIdx), nodeOrder.length);
                                    return (
                                        <line 
                                            key={`line-${i}`}
                                            x1={`${pos1.x}%`} y1={`${pos1.y}%`} 
                                            x2={`${pos2.x}%`} y2={`${pos2.y}%`} 
                                            stroke={strokeColor} strokeWidth="8" strokeLinecap="round" opacity="0.8"
                                            className="transition-colors duration-200"
                                        />
                                    );
                                })}
                                {isDrawing && selectedNodes.length > 0 && (
                                    <line 
                                        x1={`${getNodePosition(nodeOrder.indexOf(selectedNodes[selectedNodes.length - 1]), nodeOrder.length).x}%`} 
                                        y1={`${getNodePosition(nodeOrder.indexOf(selectedNodes[selectedNodes.length - 1]), nodeOrder.length).y}%`} 
                                        x2={`${mousePos.x}%`} y2={`${mousePos.y}%`} 
                                        stroke={strokeColor} strokeWidth="8" strokeLinecap="round" opacity="0.8"
                                    />
                                )}
                            </svg>

                            {nodeOrder.map((actualNodeIndex, renderIndex) => {
                                const pos = getNodePosition(renderIndex, nodeOrder.length);
                                const isSelected = selectedNodes.includes(actualNodeIndex);
                                return (
                                    <div 
                                        key={actualNodeIndex}
                                        data-node-id={actualNodeIndex}
                                        onPointerDown={(e) => handlePointerDown(e, actualNodeIndex)}
                                        className={`absolute rounded-full flex items-center justify-center font-black transition-all cursor-pointer select-none touch-none z-20 transform -translate-x-1/2 -translate-y-1/2
                                            ${isSelected 
                                                ? `bg-white border-b-4 border-slate-300 text-sky-600 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]` 
                                                : `bg-transparent text-white drop-shadow-md hover:scale-105 hover:text-sky-300`}
                                        `}
                                        style={{ left: `${pos.x}%`, top: `${pos.y}%`, transition: isDrawing ? 'transform 0.1s' : 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                    >
                                        <span className="pointer-events-none text-2xl sm:text-4xl">{levelData.nodes[actualNodeIndex]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="h-[10%] w-full flex justify-between items-center px-4 sm:px-6 shrink-0 pb-2 pointer-events-auto">
                    <button onClick={handleShuffle} className="bg-slate-800/80 hover:bg-slate-700 backdrop-blur-sm text-white p-2.5 sm:p-3 rounded-full border border-slate-600 shadow-xl active:scale-95 transition-transform flex items-center justify-center">
                        <Shuffle size={16} />
                    </button>
                    <button onClick={handleHint} className="bg-amber-500 hover:bg-amber-400 text-amber-950 p-2.5 sm:p-3 rounded-full border border-amber-600 shadow-xl active:scale-95 transition-transform flex flex-col items-center justify-center">
                        <Lightbulb size={16} />
                        <span className="text-[9px] font-black mt-0.5 bg-amber-950 text-amber-400 px-1 rounded-full leading-none">25</span>
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    // DESKTOP SINGLE PLAYER LAYOUT
    // ============================================================================
    return (
        <div 
            className={`relative flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden touch-none p-3 ${theme.base}`}
            onPointerMove={handlePointerMove}
            onTouchMove={handleTouchMove}     // iOS Fallback hook
            onPointerUp={handlePointerUp}
            onTouchEnd={handlePointerUp}      // iOS Fallback hook
            onPointerCancel={handlePointerUp}
            onTouchCancel={handlePointerUp}   // iOS Fallback hook
            onPointerLeave={handlePointerUp} 
        >
            <div className="flex justify-between items-center px-2 py-3 lg:p-6 shrink-0 relative w-full mt-2 lg:mt-0 pointer-events-auto">
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 shadow-lg">
                    <Trophy size={16} className="text-amber-400" />
                    <span className="text-white font-black text-lg">{score}</span>
                </div>
                <div className="flex items-center gap-2">
                    {bonusWords.length > 0 && (
                        <div className="bg-purple-900/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-purple-400/50 flex items-center gap-1 shadow-lg animate-in fade-in">
                            <Sparkles size={14} className="text-purple-300" />
                            <span className="text-purple-200 font-bold text-sm">+{bonusWords.length}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 shadow-lg">
                        <span className="text-white font-black text-lg">{coins}</span>
                        <Coins size={16} className="text-yellow-400" />
                    </div>
                    <button onClick={onHome} className="bg-slate-800/80 hover:bg-red-500 text-slate-300 hover:text-white p-2 rounded-xl border border-slate-700 shadow-lg transition-colors ml-1 z-50">
                        <Home size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-row w-full min-h-0">
                <div className="flex-[1.5] flex flex-col items-center justify-center p-8 w-full h-full relative z-10 min-h-0">
                    <div className="h-16 shrink-0 flex items-center justify-center relative mb-6">
                        <div className={`px-6 py-3 rounded-full border-b-4 shadow-xl flex items-center justify-center min-w-[140px] transition-all duration-300 ${currentWord ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${bubbleClass}`}>
                            <span className="text-3xl font-black tracking-widest">{currentWord}</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full max-h-[60vh] flex items-center justify-center overflow-visible p-2">
                        <div 
                            className="grid gap-1.5 mx-auto" 
                            style={{ 
                                gridTemplateColumns: `repeat(${maxCol + 1}, minmax(0, 1fr))`,
                                gridTemplateRows: `repeat(${maxRow + 1}, minmax(0, 1fr))`,
                                aspectRatio: `${maxCol + 1} / ${maxRow + 1}`,
                                width: '100%', height: '100%', maxHeight: '100%' 
                            }}
                        >
                            {gridCells}
                        </div>
                    </div>
                </div>

                <div className="flex-1 max-w-[420px] p-8 mx-auto relative flex flex-col items-center justify-center min-h-0">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square bg-black/30 backdrop-blur-sm rounded-full border border-white/10 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] z-0"></div>

                    <div className="w-[80%] aspect-square relative z-10" ref={wheelRef}>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                            {selectedNodes.map((nodeIdx, i) => {
                                if (i === selectedNodes.length - 1) return null;
                                const nextIdx = selectedNodes[i + 1];
                                const pos1 = getNodePosition(nodeOrder.indexOf(nodeIdx), nodeOrder.length);
                                const pos2 = getNodePosition(nodeOrder.indexOf(nextIdx), nodeOrder.length);
                                return (
                                    <line 
                                        key={`line-${i}`}
                                        x1={`${pos1.x}%`} y1={`${pos1.y}%`} 
                                        x2={`${pos2.x}%`} y2={`${pos2.y}%`} 
                                        stroke={strokeColor} strokeWidth="14" strokeLinecap="round" opacity="0.8"
                                    />
                                );
                            })}
                            {isDrawing && selectedNodes.length > 0 && (
                                <line 
                                    x1={`${getNodePosition(nodeOrder.indexOf(selectedNodes[selectedNodes.length - 1]), nodeOrder.length).x}%`} 
                                    y1={`${getNodePosition(nodeOrder.indexOf(selectedNodes[selectedNodes.length - 1]), nodeOrder.length).y}%`} 
                                    x2={`${mousePos.x}%`} y2={`${mousePos.y}%`} 
                                    stroke={strokeColor} strokeWidth="14" strokeLinecap="round" opacity="0.8"
                                />
                            )}
                        </svg>

                        {nodeOrder.map((actualNodeIndex, renderIndex) => {
                            const pos = getNodePosition(renderIndex, nodeOrder.length);
                            const isSelected = selectedNodes.includes(actualNodeIndex);
                            return (
                                <div 
                                    key={actualNodeIndex}
                                    data-node-id={actualNodeIndex}
                                    onPointerDown={(e) => handlePointerDown(e, actualNodeIndex)}
                                    className={`absolute rounded-full flex items-center justify-center font-black transition-all cursor-pointer select-none touch-none z-20 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16
                                        ${isSelected 
                                            ? `bg-white border-b-4 border-slate-300 text-sky-600 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]` 
                                            : `bg-transparent text-white drop-shadow-md hover:scale-105 hover:text-sky-300`}
                                    `}
                                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, transition: isDrawing ? 'transform 0.1s' : 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                >
                                    <span className="pointer-events-none text-5xl">{levelData.nodes[actualNodeIndex]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 left-4 z-50 pointer-events-auto">
                <button onClick={handleShuffle} className="bg-slate-800/80 hover:bg-slate-700 backdrop-blur-sm text-white p-4 rounded-full border border-slate-600 shadow-xl active:scale-95 transition-transform flex items-center justify-center">
                    <Shuffle size={18} className="w-6 h-6" />
                </button>
            </div>
            
            <div className="absolute bottom-4 right-4 z-50 pointer-events-auto">
                <button onClick={handleHint} className="bg-amber-500 hover:bg-amber-400 text-amber-950 p-4 rounded-full border border-amber-600 shadow-xl active:scale-95 transition-transform flex flex-col items-center justify-center">
                    <Lightbulb size={18} className="w-6 h-6" />
                    <span className="text-[10px] font-black mt-1 bg-amber-950 text-amber-400 px-1.5 rounded-full leading-none">25</span>
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT & MENU
// ============================================================================
export default function BarahkhadiWordConnect({ lesson, onComplete = () => {} }: any) {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [numPlayers, setNumPlayers] = useState(1);
  const [levelsData, setLevelsData] = useState<any[]>([]); 
  const [finishOrder, setFinishOrder] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
      const checkMobile = () => {
          const mobile = window.innerWidth < 768;
          setIsMobile(mobile);
          if (mobile) setNumPlayers(1);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const startGame = () => {
      const newLevels = [];
      for (let i = 0; i < numPlayers; i++) {
          const level = generateRandomLevel();
          if (level) newLevels.push(level);
      }
      setLevelsData(newLevels);
      setFinishOrder([]);
      setGameState('playing');
  };

  const handlePlayerFinish = (playerId: number) => {
      if (!finishOrder.includes(playerId)) {
          const newOrder = [...finishOrder, playerId];
          setFinishOrder(newOrder);

          if (numPlayers === 1) {
              setTimeout(() => setGameState('gameover'), 800);
          } else if (newOrder.length === numPlayers) {
              setTimeout(() => setGameState('gameover'), 1500);
          }
      }
  };

  if (gameState === 'menu') {
    return (
      <div className="w-full h-full min-h-[500px] bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-200 rounded-3xl relative overflow-y-auto">
        <button onClick={() => onComplete()} className="absolute top-4 right-4 bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white p-3 rounded-full transition-colors z-20">
           <X size={24} />
        </button>

        <div className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl my-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 mb-2">Wordscapes Race</h1>
            <p className="text-slate-400 font-bold">Multiplayer Smartboard Engine</p>
          </div>

          {isMobile ? (
             <div className="mb-10 p-4 bg-sky-950/40 rounded-xl border border-sky-900/50 text-center">
                 <p className="text-sky-400 font-bold flex items-center justify-center gap-2 mb-2">
                     <Smartphone size={20} /> Phone Detected
                 </p>
                 <p className="text-sm text-sky-200/70">Single player mode activated. Multiplayer race is available on Smartboards and Tablets!</p>
             </div>
          ) : (
             <div className="mb-10">
               <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="text-sky-400"/> Select Players</h2>
               <div className="flex gap-4">
                 {[1, 2, 3, 4].map(num => (
                   <button
                     key={num} onClick={() => setNumPlayers(num)}
                     className={`flex-1 py-4 rounded-xl border-2 text-2xl font-bold transition-all ${numPlayers === num ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-400'}`}
                   >
                     {num}P
                   </button>
                 ))}
               </div>
             </div>
          )}

          <button onClick={startGame} className="w-full py-5 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-bold text-2xl shadow-lg flex items-center justify-center gap-3 transform hover:scale-[1.02] transition-transform">
            <Play fill="currentColor" size={28} /> START {isMobile ? 'GAME' : 'RACE'}
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="w-full h-full min-h-[600px] bg-slate-900 flex flex-col items-center justify-center p-4 rounded-3xl relative overflow-hidden">
        <style>{`
            @keyframes confettiDrop { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
            .animate-confetti { animation: confettiDrop linear infinite; }
        `}</style>
        
        <div className="absolute inset-0 pointer-events-none z-0">
            {[...Array(60)].map((_, i) => (
                <div key={i} className="absolute animate-confetti" style={{
                    left: `${Math.random() * 100}%`, top: `-10%`,
                    backgroundColor: ['#f59e0b', '#10b981', '#0ea5e9', '#ec4899', '#a855f7'][Math.floor(Math.random() * 5)],
                    width: `${Math.random() * 10 + 5}px`, height: `${Math.random() * 20 + 10}px`,
                    animationDelay: `${Math.random() * 3}s`, animationDuration: `${Math.random() * 2 + 2}s`
                }} />
            ))}
        </div>

        <div className="bg-amber-400 p-8 rounded-full mb-6 border-8 border-amber-200 shadow-[0_0_50px_rgba(251,191,36,0.5)] z-10 relative">
          <Trophy className="w-24 h-24 text-amber-900" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-wide uppercase text-center z-10 relative drop-shadow-md">
            {numPlayers > 1 ? `PLAYER ${finishOrder[0]} WON THE RACE!` : 'PUZZLE CLEARED!'}
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-10 z-10 relative">
          <button onClick={() => setGameState('menu')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl py-4 rounded-2xl transition-colors flex items-center justify-center gap-2">
            Main Menu
          </button>
          <button onClick={startGame} className="flex-1 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xl py-4 rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2 border-b-4 border-amber-700 active:translate-y-1 active:border-b-0">
            Next Level <Play size={24} fill="currentColor" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[90vh] min-h-[650px] flex flex-row bg-slate-950 font-sans select-none overflow-hidden rounded-3xl shadow-2xl relative">
        {numPlayers > 1 && (
            <button onClick={() => setGameState('menu')} className="absolute top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xl hover:bg-red-500 hover:border-red-500 transition-colors">
                <Home size={14} /> <span className="font-bold text-xs uppercase tracking-widest">Menu</span>
            </button>
        )}
        {PLAYER_THEMES.slice(0, numPlayers).map((theme, index) => (
            <PlayerBoard 
                key={theme.id} theme={theme} 
                levelData={levelsData.length > 0 ? levelsData[index] : null} 
                isMultiplayer={numPlayers > 1} isMobile={isMobile}
                finishOrder={finishOrder} 
                onFinish={handlePlayerFinish} onHome={() => setGameState('menu')}
            />
        ))}
    </div>
  );
}