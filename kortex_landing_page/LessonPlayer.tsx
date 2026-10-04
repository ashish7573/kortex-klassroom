"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Pen, Eraser, Share2, CheckCircle, 
  ChevronLeft, ChevronRight, Timer, Star, Activity, FileText, Instagram,
  Globe, Lightbulb, PlayCircle, Target, BookOpen, Gamepad2, X
} from 'lucide-react';
import ConceptualiserRegistry from '../kortex_learning_tools/conceptualiser/00_ConceptualiserRegistry';
import GameRegistry from '../kortex_learning_tools/games/00_GameRegistry';
import QuizRegistry from '../kortex_learning_tools/quizzes/00_QuizRegistry';
import { Button } from './components/SharedUI';

const getYouTubeEmbedUrl = (url: any) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : url;
};

const LessonPlayer = ({ lesson, initialStep, isLoggedIn, onClose, onFinish, onStepComplete }: any) => {
  const playlist = lesson.flow || (lesson.subTopics ? lesson.subTopics.flatMap((sub: any) => sub.tools || []) : []);
  const [currentStep, setCurrentStep] = useState(initialStep || 0);
  const [copied, setCopied] = useState(false); 
  
  // NEW: State to track if we should show the finale screen
  const [showFinale, setShowFinale] = useState(false);
  // NEW: Drawing Overlay State & Refs
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#ef4444'); // Default Red
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // --- NEW: TIMER & STOPWATCH LOGIC ---
  const [showTimeTool, setShowTimeTool] = useState(false);
  const [timeMode, setTimeMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [timeRemaining, setTimeRemaining] = useState(0); 
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerInput, setTimerInput] = useState('5'); 
  const timerRef = useRef<any>(null);
  const timeAudioCtxRef = useRef<AudioContext | null>(null);

  const playTimeSound = (type: 'start' | 'pause' | 'alarm' | 'reset') => {
      try {
          if (!timeAudioCtxRef.current) {
              const WinAudioContext = window.AudioContext || (window as any).webkitAudioContext;
              timeAudioCtxRef.current = new WinAudioContext();
          }
          const ctx = timeAudioCtxRef.current;
          if (ctx.state === 'suspended') ctx.resume();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          
          if (type === 'start') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.1); }
          else if (type === 'pause') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.1); }
          else if (type === 'reset') { osc.type = 'triangle'; osc.frequency.setValueAtTime(200, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.2); }
          else if (type === 'alarm') { 
              osc.type = 'square'; osc.frequency.setValueAtTime(800, ctx.currentTime); osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.2); osc.frequency.setValueAtTime(800, ctx.currentTime + 0.4);
              gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.6); 
          }
      } catch(e) {}
  };

  useEffect(() => {
      if (isTimerActive) {
          timerRef.current = setInterval(() => {
              setTimeRemaining(prev => {
                  if (timeMode === 'timer') {
                      if (prev <= 1) { playTimeSound('alarm'); setIsTimerActive(false); return 0; }
                      return prev - 1;
                  } else { return prev + 1; }
              });
          }, 1000);
      } else { clearInterval(timerRef.current); }
      return () => clearInterval(timerRef.current);
  }, [isTimerActive, timeMode]);

  const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60); const s = secs % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTimeAction = (action: 'start' | 'pause' | 'reset') => {
      playTimeSound(action);
      if (action === 'start') {
          if (timeMode === 'timer' && timeRemaining === 0) setTimeRemaining(parseInt(timerInput) * 60 || 300);
          setIsTimerActive(true);
      }
      else if (action === 'pause') setIsTimerActive(false);
      else if (action === 'reset') { setIsTimerActive(false); setTimeRemaining(0); }
  };
  
  const currentItem = playlist[currentStep];
  
  // NEW: Check if this is the Master Demo
  const isMasterDemo = lesson.id === 'master-demo-1';

  const handleShare = () => {
    if (!currentItem) return;
    const toolId = currentItem.subtopicId || currentItem.id;
    const shareLink = `${window.location.origin}/?tool=${toolId}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!currentItem && !showFinale) {
     return (
       <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center animate-fade-in font-sans text-white px-4 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-xl border-2 border-slate-700"><Activity size={32} className="text-slate-500" /></div>
          <h2 className="text-2xl font-black mb-2">No Content Found</h2>
          <p className="text-slate-400 mb-6 font-medium">This lesson does not contain any interactive tools yet.</p>
          <Button onClick={onClose} className="border-0 bg-slate-800 text-white hover:bg-slate-700 shadow-none">Return to Dashboard</Button>
       </div>
     );
  }

  const progressPercentage = ((currentStep + 1) / playlist.length) * 100;
  const isLastStep = currentStep === playlist.length - 1;

  // UPDATED: Logic to trap the demo at the end and show the finale
  const [finalScore, setFinalScore] = useState<number | undefined>(undefined);

  const handleNext = (data?: any) => {
      if (data && data.score !== undefined) setFinalScore(data.score);
      
      // LOG IMMEDIATE PROGRESS!
      if (onStepComplete) {
         onStepComplete({ step: currentStep, score: data?.score !== undefined ? data.score : finalScore });
      }

      if (!isLoggedIn) {
          setShowFinale(true);
          return;
      }
      if (isLastStep) {
          if (isMasterDemo) {
              setShowFinale(true);
          } else {
              onFinish({ score: data?.score !== undefined ? data.score : finalScore });
          }
      } else {
          setCurrentStep((prev: any) => prev + 1); 
      }
  };
  
  const handlePrev = () => { if (currentStep > 0) setCurrentStep((prev: any) => prev - 1); };

  // --- NEW: THE GRAND FINALE SCREEN ---
  if (showFinale) {
    if (!isLoggedIn) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center animate-fade-in font-sans px-4">
                <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
    
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sky-500/30">
                            <Star className="text-white w-10 h-10 fill-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Loved it?</h1>
                        <p className="text-base md:text-lg text-slate-400 font-medium mb-8 max-w-2xl mx-auto">
                            Try considering Signing up for more such Smart Learning Tools for your Child.
                        </p>
    
                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={() => {
                                    onClose(); 
                                    const event = new CustomEvent('open-auth-modal', { detail: 'signup' });
                                    window.dispatchEvent(event);
                                }}
                                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black py-4 rounded-xl text-lg shadow-lg hover:-translate-y-1 transition-all"
                            >
                                Sign Up
                            </button>
                            
                            <div className="relative py-4">
                               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                               <div className="relative flex justify-center"><span className="bg-slate-900 px-4 text-sm text-slate-500 font-bold uppercase tracking-wider">Are you an Educator or Institution ?</span></div>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    onClose(); 
                                    const event = new CustomEvent('open-quote-modal');
                                    window.dispatchEvent(event);
                                }}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-xl text-lg shadow-lg hover:-translate-y-1 transition-all"
                            >
                                Get Quote
                            </button>

                            <button 
                                onClick={onClose}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-md transition-colors mt-2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const exploreOptions = [
      { id: 'lessons', label: 'All Lessons', icon: Globe, color: 'text-sky-500' },
      { id: 'conceptualiser', label: 'Conceptualisers', icon: Lightbulb, color: 'text-purple-500' },
      { id: 'theatre', label: 'Video Lessons', icon: PlayCircle, color: 'text-rose-500' },
      { id: 'dojo', label: 'Quick Checks', icon: Target, color: 'text-amber-500' },
      { id: 'Notebook', label: 'Visual Guides', icon: BookOpen, color: 'text-emerald-500' },
      { id: 'arcade', label: 'Kortex Arcade', icon: Gamepad2, color: 'text-lime-500' },
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center animate-fade-in font-sans px-4">
            <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sky-500/30">
                        <Star className="text-white w-10 h-10 fill-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">Demo Complete!</h1>
                    <p className="text-lg md:text-xl text-slate-400 font-medium mb-10 max-w-2xl mx-auto">
                        You've seen the future of interactive learning. <br className="hidden md:block" />
                        <span className="text-sky-400 font-bold">What would you like to explore next?</span>
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {exploreOptions.map(opt => (
                            <button 
                                key={opt.id}
                                onClick={() => {
                                    onClose(); 
                                    const event = new CustomEvent('navigate-tab', { detail: opt.id });
                                    window.dispatchEvent(event);
                                }}
                                className="group bg-slate-800 border-2 border-slate-700 hover:border-slate-500 rounded-2xl p-4 md:p-5 flex flex-col items-center gap-3 transition-all hover:-translate-y-1 hover:shadow-xl hover:bg-slate-700/50"
                            >
                                <div className={`w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 group-hover:scale-110 transition-transform ${opt.color}`}>
                                    <opt.icon size={24} />
                                </div>
                                <span className="text-white font-bold text-sm">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                    
                    <button onClick={onClose} className="mt-8 text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest text-xs transition-colors">
                        Return to Homepage
                    </button>
                </div>
            </div>
        </div>
    );
  }

// --- NEW: ANNOTATION DRAWING LOGIC ---
  useEffect(() => {
      if (isDrawingMode && canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
      }
  }, [isDrawingMode]);

  const startDrawing = (e: any) => {
      isDrawing.current = true;
      draw(e);
  };

  const stopDrawing = () => {
      isDrawing.current = false;
      if (canvasRef.current) {
          canvasRef.current.getContext('2d')?.beginPath();
      }
  };

  const draw = (e: any) => {
      if (!isDrawing.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.lineWidth = drawColor === 'eraser' ? 30 : 6;
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = drawColor === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = drawColor === 'eraser' ? 'rgba(0,0,0,1)' : drawColor;

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
  };


  const renderContent = () => {
    switch (currentItem.content_type?.toLowerCase() || currentItem.type?.toLowerCase()) {
      case 'video':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black">
            {currentItem.content_url ? (
              <iframe 
                className="w-full h-full max-w-5xl max-h-[75vh] rounded-xl shadow-2xl border-2 border-slate-800" 
                src={getYouTubeEmbedUrl(currentItem.content_url)} 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="text-center"><div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border-2 border-slate-700 animate-pulse"><Play size={32} className="text-pink-500 ml-1" /></div><h3 className="text-2xl font-bold text-slate-300">Video Ready</h3></div>
            )}
          </div>
        );

      case 'game':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 md:rounded-3xl overflow-hidden border-0 md:border-2 border-slate-800 shadow-2xl animate-fade-in">
            <GameRegistry lesson={currentItem} onComplete={handleNext} />
          </div>
        );

      case 'quiz':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 md:rounded-3xl overflow-y-auto border-0 md:border-2 border-slate-200 shadow-2xl animate-fade-in">
            <QuizRegistry lesson={currentItem} onComplete={handleNext} />
          </div>
        );

      case 'conceptualiser':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-sky-50 md:rounded-3xl overflow-hidden border-0 md:border-2 border-sky-100 shadow-2xl animate-fade-in">
            <ConceptualiserRegistry lesson={currentItem} onComplete={handleNext} />
          </div>
        );
   
      case 'pdf':
        let docUrl = currentItem.content_url || '';
        if (docUrl.includes('canva.com') && !docUrl.includes('embed')) {
            docUrl = docUrl.split('?')[0].replace(/\/view.*$/, '') + '/view?embed';
        }
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 md:rounded-2xl overflow-hidden text-slate-800 relative shadow-2xl">
             {docUrl && (
               <div className="absolute top-0 left-0 right-0 bg-white p-3 border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
                 <div className="flex items-center gap-2 font-extrabold text-sm text-slate-700 truncate pr-4"><FileText className="text-rose-500 shrink-0" size={16} />{currentItem.title}</div>
                 <Button variant="secondary" className="py-1.5 px-3 text-xs border border-slate-200 shadow-sm hover:border-sky-500 hover:text-sky-600 shrink-0" onClick={() => window.open(docUrl, '_blank')}>Open</Button>
               </div>
             )}
             {docUrl ? <iframe className="w-full h-full bg-white pt-[56px]" src={docUrl} allowFullScreen></iframe> : <div className="flex flex-col items-center p-8 text-center bg-white w-full h-full justify-center">Document Ready</div>}
          </div>
        );

      default: 
        return <div className="flex items-center justify-center h-full text-slate-400 font-medium"><Activity className="animate-spin mr-3" size={24} /> Loading...</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in font-sans">
      
      {/* DIET HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 md:px-4 md:py-2.5 flex items-center justify-between shrink-0 shadow-sm relative z-10">
        
        {/* Left: Close & Title Stack */}
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button onClick={onClose} className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"><X size={18} className="md:w-5 md:h-5" /></button>
          <div className="hidden sm:flex flex-col md:flex-row md:items-center gap-0 md:gap-2 min-w-0">
             <h1 className="text-white font-extrabold text-sm md:text-base truncate max-w-[150px] lg:max-w-[300px]">{currentItem.title}</h1>
             <span className="hidden md:block w-1 h-1 bg-slate-600 rounded-full shrink-0"></span>
             <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider truncate max-w-[150px] lg:max-w-[200px]">{lesson.chapter}{lesson.subtopic ? ` • ${lesson.subtopic}` : ''}</p>
          </div>
        </div>

        {/* Center: Desktop Progress Bar */}
        <div className="flex-1 max-w-[200px] lg:max-w-xs mx-4 hidden md:flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Progress</span><span className="text-[10px] font-black text-sky-400">{currentStep + 1} / {playlist.length}</span></div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div></div>
        </div>

        {/* Right: Tools, Share & Type Pill */}
        <div className="flex items-center gap-2 shrink-0">
            
            {/* NEW: Timer / Stopwatch Toggle Button */}
            <button 
                onClick={() => setShowTimeTool(!showTimeTool)} 
                className={`relative w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all shadow-md border ${showTimeTool || isTimerActive ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'}`}
                title="Timer / Stopwatch"
            >
                <Timer size={14} className="md:w-4 md:h-4" />
                {isTimerActive && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse border border-slate-900"></span>}
            </button>

            {/* NEW: Annotation Toggle Button */}
            <button 
                onClick={() => setIsDrawingMode(!isDrawingMode)} 
                className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all shadow-md border ${isDrawingMode ? 'bg-sky-500 text-white border-sky-400' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'}`}
                title="Annotate Screen"
            >
                <Pen size={14} className="md:w-4 md:h-4" />
            </button>

            <button onClick={handleShare} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-[10px] md:text-xs transition-all border border-slate-700">
               {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Share2 size={14} />}
               <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
            </button>
            <div className="bg-slate-800 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-[10px] md:text-xs flex items-center gap-1.5 border border-slate-700">{currentItem.type?.toUpperCase()}</div>
        </div>
      </div>

      {/* NEW: FLOATING TIME TOOL PANEL */}
      {showTimeTool && (
          <div className="absolute top-[68px] right-4 md:right-8 z-[60] bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-5 w-64 animate-fade-in-up text-white">
              <div className="flex bg-slate-900 rounded-lg p-1 mb-4 border border-slate-700 shadow-inner">
                  <button onClick={() => { setTimeMode('stopwatch'); setIsTimerActive(false); setTimeRemaining(0); }} className={`flex-1 text-[11px] uppercase tracking-wider font-black py-1.5 rounded-md transition-colors ${timeMode === 'stopwatch' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Stopwatch</button>
                  <button onClick={() => { setTimeMode('timer'); setIsTimerActive(false); setTimeRemaining(parseInt(timerInput)*60 || 300); }} className={`flex-1 text-[11px] uppercase tracking-wider font-black py-1.5 rounded-md transition-colors ${timeMode === 'timer' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Timer</button>
              </div>
              
              {timeMode === 'timer' && !isTimerActive && timeRemaining === 0 && (
                  <div className="mb-4 flex items-center justify-center gap-2">
                      <input type="number" min="1" max="60" value={timerInput} onChange={(e) => setTimerInput(e.target.value)} className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-white outline-none focus:border-indigo-500" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Minutes</span>
                  </div>
              )}

              <div className="text-5xl font-mono font-black text-center mb-6 tracking-wider text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]">
                  {formatTime(timeRemaining)}
              </div>

              <div className="flex justify-center items-center gap-4">
                  <button onClick={() => handleTimeAction('reset')} className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors shadow-md"><RotateCcw size={16} /></button>
                  {isTimerActive ? (
                      <button onClick={() => handleTimeAction('pause')} className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-slate-900 transition-colors shadow-lg"><Pause size={24} className="fill-current" /></button>
                  ) : (
                      <button onClick={() => handleTimeAction('start')} className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-slate-900 transition-colors shadow-lg"><Play size={24} className="fill-current ml-1" /></button>
                  )}
              </div>
          </div>
      )}

      {/* DIET CONTENT CONTAINER */}
      <div className="flex-1 min-h-0 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black p-0 md:p-2 lg:p-4 flex items-center justify-center">
         
         {/* The underlying content - pointer events disabled to freeze interactions if drawing mode is active */}
         <div className={`w-full h-full flex items-center justify-center transition-all ${isDrawingMode ? 'pointer-events-none' : ''}`}>
             {renderContent()}
         </div>

         {/* NEW: Drawing Overlay & Toolbar */}
         {isDrawingMode && (
             <>
                 {/* Invisible canvas covering the whole content area */}
                 <canvas
                     ref={canvasRef}
                     onMouseDown={startDrawing}
                     onMouseMove={draw}
                     onMouseUp={stopDrawing}
                     onMouseOut={stopDrawing}
                     onTouchStart={startDrawing}
                     onTouchMove={draw}
                     onTouchEnd={stopDrawing}
                     onTouchCancel={stopDrawing}
                     className="absolute inset-0 z-40 w-full h-full touch-none cursor-crosshair"
                 />
                 
                 {/* Floating Toolbar for Colors/Eraser */}
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-full p-2 flex items-center gap-2 shadow-2xl animate-fade-in-up">
                     {['#ef4444', '#3b82f6', '#10b981'].map(color => (
                         <button 
                             key={color}
                             onClick={() => setDrawColor(color)}
                             className={`w-8 h-8 rounded-full border-2 transition-transform ${drawColor === color ? 'scale-110 border-white' : 'border-transparent hover:scale-105'}`}
                             style={{ backgroundColor: color }}
                         />
                     ))}
                     <div className="w-px h-6 bg-slate-600 mx-1"></div>
                     <button 
                         onClick={() => setDrawColor('eraser')}
                         className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${drawColor === 'eraser' ? 'bg-slate-200 text-slate-800 border-white' : 'bg-slate-700 text-slate-300 border-transparent hover:bg-slate-600'}`}
                         title="Eraser"
                     >
                         <Eraser size={16} />
                     </button>
                 </div>
             </>
         )}
      </div>

      {/* NEW: 3-Second Floating Share Popup */}
      {copied && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm animate-fade-in-up z-50 border border-slate-600">
              <CheckCircle size={18} className="text-emerald-400" />
              Link copied to clipboard!
          </div>
      )}

      {/* DIET FOOTER */}
      <div className="bg-slate-900 border-t border-slate-800 px-3 py-2 md:px-4 md:py-3 flex items-center justify-between shrink-0 relative z-10">
        
        {/* Left: Previous Button */}
        <button onClick={handlePrev} disabled={currentStep === 0} className={`px-4 py-2 md:px-5 md:py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all ${currentStep === 0 ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800'}`}>
            <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
        </button>
        
        {/* Center Content: Mobile Progress & Instagram Link */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-1 md:gap-0">
          
          {/* Mobile Progress Bar */}
          <div className="md:hidden w-full max-w-[120px] mb-1">
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          {/* Instagram Link Integration */}
          <a 
            href="https://instagram.com/kortexklassroom" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 text-slate-500 hover:text-pink-500 transition-colors group"
          >
            <Instagram size={16} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[10px] md:text-xs tracking-wider">@kortexklassroom</span>
          </a>
        </div>

        {/* Right: Next/Complete Button */}
        <button onClick={handleNext} className={`px-5 py-2 md:px-6 md:py-2 rounded-lg md:rounded-xl font-black text-xs md:text-sm flex items-center gap-1.5 transition-all border shadow-sm ${isLastStep ? 'bg-lime-500 text-slate-900 border-lime-600 hover:bg-lime-400' : 'bg-sky-500 text-white border-sky-600 hover:bg-sky-400'}`}>
          {isLastStep ? (<>Complete <CheckCircle size={16} className="hidden sm:inline" /></>) : (<>Next <ChevronRight size={16} /></>)}
        </button>

      </div>

    </div>
  );
};











export default LessonPlayer;
