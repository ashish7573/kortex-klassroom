"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';

import { 
  BookOpen, Brain, Activity, User, Users, FileText, BarChart, Lightbulb, 
  Settings, Globe, Play, LogOut, CheckCircle, Clock, Search,
  Heart, Zap, BookMarked, Star, Video, Gamepad2, Menu, X, ArrowRight, 
  ChevronLeft, ChevronRight, Layers, Lock, Unlock, Shield, Timer, Info, 
  Calendar, Pause, RotateCcw, Rocket, Trophy, Medal, Flame, Book,  
  Calculator, Leaf, Palette, Music, Monitor, Type, Check, Bell, Plus, 
  Database, Edit3, Trash2, UploadCloud, Save, ChevronDown, ChevronUp, 
  Sparkles, ArrowUpRight, Target, PlayCircle, UserPlus, LineChart, 
  CreditCard, DollarSign, XCircle, AlertTriangle, Briefcase, Filter, Share2
} from 'lucide-react';

import ConceptualiserRegistry from '../components/conceptualiser/ConceptualiserRegistry';
import GameRegistry from '../components/games/GameRegistry';
import QuizRegistry from '../components/quizzes/QuizRegistry';


import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, getDocs, query, where, orderBy, deleteDoc, addDoc, limit } from "firebase/firestore";
import { AnyOfSchema } from 'firebase/ai';
import { useSearchParams } from 'next/navigation';










// ============================================================================
// SECTION 2: CORE CONSTANTS, THEMES & FIREBASE INITIALIZATION
// ============================================================================

const GRADES = [
  'FLN', 'Balvatika 1', 'Balvatika 2', 'Balvatika 3', 
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
  'Grade 6', 'Grade 7', 'Grade 8'
];

const SUBJECTS = [
  'English', 'Hindi', 'Maths', 'EVS', 'SST', 
  'Mental Training', 'Physical Training and Sports', 
  'Theatre', 'Art and Craft Forms', 'Music and Dance Forms', 
  'Computers and AI'
];

const SUBJECT_ICONS = {
  'English': { icon: Type, color: 'text-blue-500' },
  'Hindi': { icon: FileText, color: 'text-orange-500' },
  'Maths': { icon: Calculator, color: 'text-rose-500' },
  'EVS': { icon: Leaf, color: 'text-lime-500' },
  'SST': { icon: Globe, color: 'text-emerald-500' },
  'Mental Training': { icon: Brain, color: 'text-purple-500' },
  'Physical Training and Sports': { icon: Activity, color: 'text-red-500' },
  'Theatre': { icon: Star, color: 'text-amber-500' },
  'Art and Craft Forms': { icon: Palette, color: 'text-pink-500' },
  'Music and Dance Forms': { icon: Music, color: 'text-indigo-500' },
  'Computers and AI': { icon: Monitor, color: 'text-cyan-500' }
};

// NEW: Beautiful, subject-specific fallbacks if CSV doesn't provide an image!
const SUBJECT_IMAGES = {
  'English': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=500',
  'Hindi': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=500',
  'Maths': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=500',
  'EVS': 'https://images.unsplash.com/photo-1536699137060-6dd82d617c16?auto=format&fit=crop&q=80&w=500',
  'SST': 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=500',
  'Mental Training': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=500',
  'Physical Training and Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=500',
  'Computers and AI': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=500',
  'DEFAULT': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=500'
};

const getSubjectFallbackImage = (subjectStr: any) => {
  const cleanSubj = subjectStr?.toLowerCase().trim() === 'mathematics' ? 'Maths' : subjectStr?.trim();
  // We added "(SUBJECT_IMAGES as any)" here to force TypeScript to stand down
  return (SUBJECT_IMAGES as any)[cleanSubj] || SUBJECT_IMAGES['DEFAULT'];
};

// NEW: Global 5-Tier Configuration
export const FIVE_TIERS = [
  { 
    id: 'conceptualiser', label: 'Conceptualiser', desc: 'Interactive Sandbox', 
    mainColor: 'bg-purple-500', lightColor: 'bg-purple-50', borderColor: 'border-purple-500', textColor: 'text-purple-500', 
    icon: Lightbulb, actionText: 'View All Conceptualisers'
  },
  { 
    id: 'theatre', label: 'Kortex Theatre', desc: 'Video Lessons', 
    mainColor: 'bg-pink-500', lightColor: 'bg-pink-50', borderColor: 'border-pink-500', textColor: 'text-pink-500', 
    icon: Video, actionText: 'View All Videos'
  },
  { 
    id: 'dojo', label: 'The Dojo', desc: 'Digital Quizzes', 
    mainColor: 'bg-orange-500', lightColor: 'bg-orange-50', borderColor: 'border-orange-500', textColor: 'text-orange-500', 
    icon: Target, actionText: 'View All Quizzes'
  },
  { 
    id: 'workbook', label: 'The Workbook', desc: 'PDFs & Guides', 
    mainColor: 'bg-sky-500', lightColor: 'bg-sky-50', borderColor: 'border-sky-500', textColor: 'text-sky-500', 
    icon: FileText, actionText: 'View All Worksheets'
  },
  { 
    id: 'arcade', label: 'Kortex Arcade', desc: 'Conceptual Games', 
    mainColor: 'bg-lime-500', lightColor: 'bg-lime-50', borderColor: 'border-lime-500', textColor: 'text-lime-600', 
    icon: Gamepad2, actionText: 'View All Games'
  }
];


const TRANSLATIONS = {
  en: { app_name: "Kortex Klassroom", select_role: "Select Your Role", student: "Student", teacher: "Teacher", parent: "Parent" },
  hi: { app_name: "कॉर्टेक्स क्लासरूम", select_role: "अपनी भूमिका चुनें", student: "छात्र", teacher: "शिक्षक", parent: "अभिभावक" }
};

const TESTIMONIALS = [
  { name: "Priya Sharma", role: "Parent of Grade 4 Student", text: "Kortex Klassroom has completely transformed how my son learns. The gamified approach keeps him engaged, and I love tracking his holistic growth!", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffdfbf" },
  { name: "Rahul Verma", role: "Middle School Teacher", text: "The lesson plans and auto-generated analytics are a lifesaver. It aligns perfectly with the NCF and saves me hours of planning every single week.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&backgroundColor=b6e3f4" },
  { name: "Anita Desai", role: "School Principal", text: "A truly complete platform. The focus on both academic competencies and mental wellbeing makes this the gold standard for NEP 2020 implementation.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anita&backgroundColor=c0aede" }
];

console.log("🚨 CHECKING KEYS:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "KEY FOUND!" : "STILL UNDEFINED :(");


// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();










// ============================================================================
// SECTION 3: SHARED UI COMPONENTS (CARDS, BUTTONS, MODALS)
// ============================================================================

const Card = ({ children, className = "", onClick }: any) => (
  <div onClick={onClick} className={`bg-white rounded-3xl shadow-sm border-2 border-slate-100 overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-sky-200' : ''} ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled, type = "button" }: any) => {
  const variants = {
    primary: "bg-sky-500 text-white hover:bg-sky-600 shadow-md hover:shadow-lg border-b-4 border-sky-700 active:border-b-0 active:translate-y-1",
    secondary: "bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    fun: "bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg border-b-4 border-orange-700 active:border-b-0 active:translate-y-1",
    green: "bg-lime-500 text-white hover:bg-lime-600 shadow-md hover:shadow-lg border-b-4 border-lime-700 active:border-b-0 active:translate-y-1",
    outline: "border-2 border-sky-500 text-sky-500 hover:bg-sky-50"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`px-6 py-3 rounded-full flex items-center justify-center gap-2 font-bold transition-all ${(variants as any)[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed active:border-b-4 active:translate-y-0' : ''}`}>
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};

const ProgressBar = ({ label, percentage, colorClass }: any) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <span className="text-sm font-extrabold text-slate-900">{percentage}%</span>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-4 shadow-inner">
      <div className={`h-4 rounded-full ${colorClass} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);

const AuthModal = ({ onClose, authMessage }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setIsLoading(true); 
    setErrorMsg('');
    sessionStorage.setItem('kortex_is_authenticating', 'true');

    try {
      const sessionToken = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('kortex_session_token', sessionToken);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await updateDoc(doc(db, "users", userCredential.user.uid), { session_token: sessionToken });
      onClose();
    } catch (error: any) { 
      setErrorMsg("Invalid credentials. This portal is for authorized Krew members only."); 
    } finally { 
      setIsLoading(false); 
      sessionStorage.removeItem('kortex_is_authenticating');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl relative border-4 border-slate-100 flex flex-col p-8 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"><X size={20} /></button>
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transform -rotate-3 shadow-sm"><Lock size={32} className="text-slate-400" /></div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Krew Login</h2>
        <p className="text-slate-500 font-medium text-sm mb-6">Authorized content creators and administrators only.</p>
        
        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm font-bold rounded-xl animate-shake">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email Address" required value={email} onChange={(e: any) => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-slate-400" />
          <input type="password" placeholder="Password" required value={password} onChange={(e: any) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-slate-400" />
          <button type="submit" disabled={isLoading} className="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-slate-900 transition-all">
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

const GeneralAlertModal = ({ title, message, type = 'info', onClose }: any) => {
  // 1. Set default fallback styling (Info)
  let Icon = Info; 
  let colorClass = 'text-sky-500';
  let bgClass = 'bg-sky-100';

  // 2. Map the 'type' prop to the correct icon and colors
  if (type === 'warning') {
    Icon = AlertTriangle;
    colorClass = 'text-amber-500';
    bgClass = 'bg-amber-100';
  } else if (type === 'error') {
    Icon = AlertTriangle;
    colorClass = 'text-rose-500';
    bgClass = 'bg-rose-100';
  } else if (type === 'success') {
    Icon = CheckCircle;
    colorClass = 'text-emerald-500';
    bgClass = 'bg-emerald-100';
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative border-4 border-slate-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2">
          <X size={20} />
        </button>
        <div className={`w-16 h-16 ${bgClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon size={32} className={colorClass} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 font-medium mb-6">{message}</p>
        <Button className="w-full" onClick={onClose}>Got it</Button>
      </div>
    </div>
  );
};

const WorkInProgressView = ({ title, onReturn }) => (
  <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center px-4">
    <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 border-8 border-slate-50 relative">
      <Settings size={48} className="text-slate-400 animate-[spin_4s_linear_infinite]" />
      <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-full border-4 border-white"><Settings size={16} className="animate-[spin_3s_linear_infinite_reverse]" /></div>
    </div>
    <h2 className="text-4xl font-black text-slate-800 mb-4">{title} Portal</h2>
    <p className="text-xl text-slate-500 font-medium max-w-md mx-auto mb-8">We are crafting something amazing for this section.</p>
    <div className="bg-orange-50 text-orange-600 px-8 py-4 rounded-full border-2 border-orange-200 font-bold inline-flex items-center gap-3 shadow-sm"><span className="text-2xl">🚧</span> Currently In Progress</div>
    <Button variant="secondary" className="mt-8 border-2" onClick={onReturn}>Return to Home</Button>
  </div>
);










// ============================================================================
// SECTION 4: THE IMMERSIVE LESSON PLAYER (REGISTRIES & CANVA EMBEDS)
// ============================================================================

const getYouTubeEmbedUrl = (url: any) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : url;
};

const LessonPlayer = ({ lesson, initialStep, onClose, onFinish }: any) => {
  const playlist = lesson.flow || (lesson.subTopics ? lesson.subTopics.flatMap((sub: any) => sub.tools || []) : []);
  const [currentStep, setCurrentStep] = useState(initialStep || 0);
  const [copied, setCopied] = useState(false); 
  
  // NEW: State to track if we should show the finale screen
  const [showFinale, setShowFinale] = useState(false);
  
  const currentItem = playlist[currentStep];
  
  // NEW: Check if this is the Master Demo
  const isMasterDemo = lesson.id === 'master-demo-1';

  const handleShare = () => {
    if (!currentItem) return;
    const toolId = currentItem.subtopicId || currentItem.id;
    const shareLink = `${window.location.origin}/?tool=${toolId}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
  const handleNext = () => { 
      if (isLastStep) {
          if (isMasterDemo) {
              setShowFinale(true);
          } else {
              onFinish();
          }
      } else {
          setCurrentStep((prev: any) => prev + 1); 
      }
  };
  
  const handlePrev = () => { if (currentStep > 0) setCurrentStep((prev: any) => prev - 1); };

  // --- NEW: THE GRAND FINALE SCREEN ---
  if (showFinale) {
    const exploreOptions = [
      { id: 'lessons', label: 'All Lessons', icon: Globe, color: 'text-sky-500' },
      { id: 'conceptualiser', label: 'Conceptualisers', icon: Lightbulb, color: 'text-purple-500' },
      { id: 'theatre', label: 'Video Lessons', icon: PlayCircle, color: 'text-rose-500' },
      { id: 'dojo', label: 'Quick Checks', icon: Target, color: 'text-amber-500' },
      { id: 'workbook', label: 'Visual Guides', icon: BookOpen, color: 'text-emerald-500' },
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

        {/* Right: Share & Type Pill */}
        <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleShare} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-[10px] md:text-xs transition-all border border-slate-700">
               {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Share2 size={14} />}
               <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
            </button>
            <div className="bg-slate-800 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-[10px] md:text-xs flex items-center gap-1.5 border border-slate-700">{currentItem.type?.toUpperCase()}</div>
        </div>
      </div>

      {/* DIET CONTENT CONTAINER */}
      <div className="flex-1 min-h-0 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black p-0 md:p-2 lg:p-4 flex items-center justify-center">
         {renderContent()}
      </div>

      {/* DIET FOOTER */}
      <div className="bg-slate-900 border-t border-slate-800 px-3 py-2 md:px-4 md:py-3 flex items-center justify-between shrink-0 relative z-10">
        <button onClick={handlePrev} disabled={currentStep === 0} className={`px-4 py-2 md:px-5 md:py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all ${currentStep === 0 ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800'}`}><ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span></button>
        
        {/* Mobile Progress Bar (Moved here because header is too small) */}
        <div className="md:hidden flex-1 px-4">
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div></div>
        </div>

        <button onClick={handleNext} className={`px-5 py-2 md:px-6 md:py-2 rounded-lg md:rounded-xl font-black text-xs md:text-sm flex items-center gap-1.5 transition-all border shadow-sm ${isLastStep ? 'bg-lime-500 text-slate-900 border-lime-600 hover:bg-lime-400' : 'bg-sky-500 text-white border-sky-600 hover:bg-sky-400'}`}>
          {isLastStep ? (<>Complete <CheckCircle size={16} className="hidden sm:inline" /></>) : (<>Next <ChevronRight size={16} /></>)}
        </button>
      </div>

    </div>
  );
};










// ============================================================================
// SECTION 5 & 6: TIER LIBRARY VIEW (Replaces old Games & Tools views)
// ============================================================================

const TierLibraryView = ({ activeTier, isLoggedIn, requireAuth, onOpenTool }: any) => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tierItems, setTierItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTierData() {
      setIsLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'learning_tools'));
        let extractedItems: any[] = [];
        
        snapshot.docs.forEach(doc => {
          const item: any = { id: doc.id, ...doc.data() };
          const type = item.content_type?.toLowerCase() || '';
          
          let belongsToTier = false;
          if (activeTier.id === 'conceptualiser' && type === 'conceptualiser') belongsToTier = true;
          else if (activeTier.id === 'theatre' && type === 'video') belongsToTier = true;
          else if (activeTier.id === 'dojo' && type === 'quiz') belongsToTier = true;
          else if (activeTier.id === 'workbook' && ['pdf', 'worksheet', 'document', 'presentation', 'ppt'].includes(type)) belongsToTier = true;
          else if (activeTier.id === 'arcade' && type === 'game') belongsToTier = true;

          if (belongsToTier) {
             extractedItems.push({
               ...item, 
               image: item.image || getSubjectFallbackImage(item.subject),
               lessonContext: { chapter: item.chapter_name, book: item.book }, 
               stepIndex: 0
             });
          }
        });
        setTierItems(extractedItems);
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    }
    fetchTierData();
  }, [activeTier.id]);

  const filteredItems = tierItems.filter((item: any) => {
    const matchClass = selectedClass ? item.grade?.toLowerCase().trim() === selectedClass.toLowerCase().trim() : true;
    const dbSubj = item.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : item.subject?.toLowerCase().trim();
    const matchSubject = selectedSubject ? dbSubj === selectedSubject.toLowerCase().trim() : true;
    const matchQuery = searchQuery ? item.title?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchClass && matchSubject && matchQuery;
  });

  const Icon = activeTier.icon;

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto">
      {/* Dynamic Header Card */}
      <div className={`bg-gradient-to-r from-slate-800 to-slate-900 rounded-[3rem] p-10 md:p-16 text-white flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-64 h-64 ${activeTier.mainColor} opacity-20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl`}></div>
        <div className={`absolute bottom-0 left-10 w-32 h-32 ${activeTier.mainColor} opacity-20 rounded-full translate-y-1/2 blur-2xl`}></div>
        
        <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-4 backdrop-blur-sm border border-white/20">
             <Icon size={16} className={activeTier.textColor} /> {activeTier.label}
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">{activeTier.label}</h1>
          <p className="text-lg text-slate-300 font-medium max-w-lg">{activeTier.desc}</p>
        </div>
        <div className={`relative z-10 w-48 h-48 bg-white/5 rounded-[2.5rem] backdrop-blur-md border-4 border-white/10 flex items-center justify-center shadow-2xl transform rotate-3`}>
          <Icon size={80} className={`${activeTier.textColor} drop-shadow-lg`} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="font-bold text-slate-500 text-sm uppercase px-2 hidden sm:block">Filter:</span>
            <select className={`flex-1 md:w-40 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:${activeTier.borderColor}`} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">All Grades</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className={`flex-1 md:w-48 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:${activeTier.borderColor}`} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">All Subjects</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>
         <div className="relative w-full md:flex-1 flex gap-2">
            <div className="relative flex-1">
              <input type="text" placeholder={`Search ${activeTier.label}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-4 pr-10 font-bold text-slate-700 outline-none focus:${activeTier.borderColor}`} />
              <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
            </div>
            {(selectedClass || selectedSubject || searchQuery) && (<button onClick={() => {setSelectedClass(""); setSelectedSubject(""); setSearchQuery("");}} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl transition-colors shrink-0 flex items-center gap-2"><X size={16} /> Clear</button>)}
         </div>
      </div>

      {/* Grid */}
      <div className="pb-12">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6">{activeTier.label} Collection</h2>
        {isLoading ? (
           <div className={`py-20 text-center ${activeTier.textColor} font-bold animate-pulse`}>Loading modules...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
               <Card key={idx} className={`hover:${activeTier.borderColor} cursor-pointer group relative p-0 flex flex-col border-b-4 ${activeTier.borderColor}`} onClick={() => {
                 if (item.isPremium) requireAuth(() => onOpenTool(item), `This is a Premium ${activeTier.label}. Sign up for free to access it!`);
                 else onOpenTool(item);
               }}>
                 <div className="relative h-36 w-full bg-slate-200 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>
                    {item.isPremium && <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1"><Star size={10} className="fill-white" /> PRO</div>}
                 </div>
                 <div className="p-5 bg-white flex-1 flex flex-col">
                   <div className="mb-2">
                      <p className={`text-[12px] font-black ${activeTier.textColor} uppercase tracking-wider line-clamp-1`}>{item.lessonContext?.chapter || activeTier.label}</p>
                   </div>
                   <h3 className={`text-lg font-extrabold text-slate-800 mb-2 group-hover:${activeTier.textColor} transition-colors leading-tight line-clamp-2`}>{item.title} {item.isPremium && !isLoggedIn && <Lock size={14} className="text-slate-300 inline mb-0.5 shrink-0"/>}</h3>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-auto pt-3 border-t border-slate-100"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{item.grade}</span><span>•</span><span className="truncate">{item.subject}</span></div>
                 </div>
               </Card>
            )) : <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-slate-100"><h3 className="text-xl font-bold text-slate-700">No content found</h3></div>}
          </div>
        )}
      </div>
    </div>
  );
};










// ============================================================================
// SECTION 7: LESSONS VIEW (PUBLIC CURRICULUM)
// ============================================================================

const LessonsView = ({ isLoggedIn, requireAuth, onStartLesson }: any) => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allLessons, setAllLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeLesson, setActiveLesson] = useState(null);
  const [expandedSubTopics, setExpandedSubTopics] = useState({});

  const toggleSubTopic = (id: any) => setExpandedSubTopics(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    async function fetchLessons() {
      try {
        // Fetch the new flat collection
        const snapshot = await getDocs(collection(db, 'learning_tools'));
        const flatTools = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
        
        const chaptersMap = {};

        // 1. Group the flat tools into Chapters and Subtopics
        flatTools.forEach((tool: any) => {
           // Create a unique key for the chapter
           const key = `${tool.grade}_${tool.subject}_${tool.chapter_number}`;
           
           if (!chaptersMap[key]) {
              chaptersMap[key] = {
                 id: key, // Use this unique string as the React key
                 grade: tool.grade,
                 subject: tool.subject,
                 chapter_number: tool.chapter_number,
                 chapter: tool.chapter_name, // Map to UI's expected variable
                 book: tool.book || 'Kortex Klassroom',
                 image: tool.image || null,
                 items: 0,
                 color: 'border-sky-500',
                 subTopicsMap: {} // Temporary holding area for subtopics
              };
           }

           // Only count real content towards the "Items" badge, ignore empty chapter placeholders
           if (tool.content_type && tool.content_type !== 'Placeholder') {
              chaptersMap[key].items += 1;
           }

           // Group the tools into their specific subtopics
           if (tool.subtopic) {
              const subKey = tool.subtopic;
              if (!chaptersMap[key].subTopicsMap[subKey]) {
                 chaptersMap[key].subTopicsMap[subKey] = {
                    title: tool.subtopic,
                    subtopic_order: tool.subtopic_order || 1,
                    tools: []
                 };
              }
              // Don't push empty placeholders into the actual tool list
              if (tool.title && tool.content_type !== 'Placeholder') {
                 chaptersMap[key].subTopicsMap[subKey].tools.push(tool);
              }
           }
        });

        // 2. Sort Everything (Tools -> Subtopics -> Chapters)
        const processedModules = Object.values(chaptersMap).map((chapter: any) => {
           let subTopicsArray = Object.values(chapter.subTopicsMap);

           // A. Sort the tools inside each subtopic by content_order (1, 2, 3...)
           subTopicsArray.forEach((sub: any) => {
              sub.tools.sort((a: any, b: any) => (a.content_order || 1) - (b.content_order || 1));
           });

           // B. Sort the subtopics themselves by subtopic_order (1, 2, 3...)
           subTopicsArray.sort((a: any, b: any) => (a.subtopic_order || 1) - (b.subtopic_order || 1));

           chapter.subTopics = subTopicsArray;
           delete chapter.subTopicsMap; // Cleanup

           // Fallback Image handling
           if (!chapter.image) chapter.image = getSubjectFallbackImage(chapter.subject);

           return chapter;
        });

        // C. Sort the final Chapters array by chapter_number
        processedModules.sort((a: any, b: any) => a.chapter_number - b.chapter_number);

        setAllLessons(processedModules);
      } catch (error: any) { 
        console.error("Error fetching lessons:", error); 
      } finally { 
        setIsLoading(false); 
      }
    }
    
    fetchLessons();
  }, []);

  const filteredLessons = allLessons.filter((lesson: any) => {
    const matchClass = selectedClass ? lesson.grade?.toLowerCase().trim() === selectedClass.toLowerCase().trim() : true;
    const dbSubj = lesson.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : lesson.subject?.toLowerCase().trim();
    const matchSubject = selectedSubject ? dbSubj === selectedSubject.toLowerCase().trim() : true;
    const matchQuery = searchQuery ? lesson.chapter?.toLowerCase().includes(searchQuery.toLowerCase()) || lesson.book?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchClass && matchSubject && matchQuery;
  });

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto">
      {!activeLesson ? (
        <>
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[3rem] p-10 md:p-16 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-t-8 border-sky-500">
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
            
            <div className="relative z-10 text-center md:text-left mb-10 md:mb-0">
              <div className="inline-flex items-center gap-2 bg-sky-500/20 backdrop-blur-md px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-6 border border-sky-500/30 shadow-sm text-sky-400">
                <BookOpen size={16} /> Kortex Master Curriculum
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight drop-shadow-sm">
                Systematic.<br/>Structured.<br/><span className="text-sky-400">Simple.</span>
              </h1>
              <p className="text-lg text-slate-300 font-medium max-w-xl drop-shadow-sm leading-relaxed">
                We believe true mastery doesn't happen by playing random games. It happens through carefully sequenced, NCF-aligned learning pathways. Select your grade and subject below to explore our structured curriculum.
              </p>
            </div>

            <div className="relative z-10 hidden md:block mr-8">
               <div className="relative w-56 h-56">
                  <div className="absolute inset-0 bg-white/5 rounded-[2.5rem] backdrop-blur-md border-4 border-white/10 flex items-center justify-center shadow-2xl transform -rotate-3 hover:rotate-3 transition-transform duration-500 z-10">
                     <Layers size={90} className="text-sky-400 drop-shadow-md" />
                  </div>
                  <div className="absolute -top-6 -right-6 bg-slate-800 rounded-2xl p-4 shadow-xl border-2 border-slate-700 transform rotate-12 animate-bounce z-20" style={{animationDuration: '3.5s'}}>
                     <Gamepad2 size={28} className="text-lime-400" />
                  </div>
                  <div className="absolute -bottom-4 -left-6 bg-slate-800 rounded-2xl p-4 shadow-xl border-2 border-slate-700 transform -rotate-6 animate-bounce z-20" style={{animationDuration: '4.2s'}}>
                     <Video size={28} className="text-pink-400" />
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
             <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <span className="font-bold text-slate-500 text-sm uppercase px-2 hidden sm:block">Filter:</span>
                <select className="flex-1 md:w-40 bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" value={selectedClass} onChange={(e: any) => setSelectedClass(e.target.value)}>
                  <option value="">All Grades</option>{GRADES.map((g: any) => <option key={g} value={g}>{g}</option>)}
                </select>
                <select className="flex-1 md:w-48 bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" value={selectedSubject} onChange={(e: any) => setSelectedSubject(e.target.value)}>
                  <option value="">All Subjects</option>{SUBJECTS.map((s: any) => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div className="relative w-full md:flex-1 flex gap-2">
                <div className="relative flex-1">
                  <input type="text" placeholder="Search chapters or books..." value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border-2 rounded-xl py-3 pl-4 pr-10 font-bold outline-none focus:border-sky-500" />
                  <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
                </div>
                {(selectedClass || selectedSubject || searchQuery) && <button onClick={() => {setSelectedClass(""); setSelectedSubject(""); setSearchQuery("");}} className="px-4 bg-slate-100 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-200"><X size={16} /> Clear</button>}
             </div>
          </div>

          <div className="pb-12">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6">All Lessons</h2>
            {isLoading ? (<div className="py-20 text-center font-bold text-sky-500 animate-pulse">Loading Lessons...</div>) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.length > 0 ? filteredLessons.map((lesson: any, idx: any) => (
                  <Card key={idx} className={`border-b-8 ${lesson.color} cursor-pointer group transition-all p-0 flex flex-col hover:border-sky-300`} onClick={() => setActiveLesson(lesson)}>
                    <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                       <img src={lesson.image} alt={lesson.chapter} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                       <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/20 to-transparent"></div>
                       <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
                          <span className="bg-white/90 text-slate-800 text-xs font-bold uppercase px-3 py-1.5 rounded-full shadow-sm max-w-[65%] truncate">{lesson.book}</span>
                          <div className="bg-slate-900/60 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm shrink-0"><Layers size={14} /> {lesson.items} Items</div>
                       </div>
                    </div>
                    <div className="p-6 bg-white flex-1 flex flex-col group-hover:bg-slate-50 transition-colors">
                       <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-sky-600 leading-tight">{lesson.chapter}</h3>
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{lesson.grade}</span><span>•</span><span>{lesson.subject}</span></div>
                       <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 mt-auto pt-4 border-t border-slate-100">
                          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md shadow-sm"><Video size={14} className="text-pink-500"/> Video</span>
                          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md shadow-sm"><Layers size={14} className="text-sky-500"/> Docs</span>
                       </div>
                    </div>
                  </Card>
                )) : (<div className="col-span-full py-16 text-center bg-white rounded-3xl border-2"><h3 className="text-xl font-bold">No lessons found</h3></div>)}
              </div>
            )}
          </div>
        </>
      ) : (
         <div className="space-y-6 animate-fade-in pb-12">
            <button onClick={() => setActiveLesson(null)} className="flex items-center gap-2 font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border-2 border-slate-100 w-fit"><ChevronLeft size={18} /> Back to Chapters</button>
            <div className="bg-white rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all border-2 border-b-8 border-sky-500">
               <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/3 z-0 bg-sky-50"></div>
               <div className="relative z-10"><span className="text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full inline-block mb-4 bg-sky-100 text-sky-700">{activeLesson.book}</span><h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">{activeLesson.chapter}</h2></div>
            </div>

            <div className="px-0 md:px-8 py-4 space-y-4">
               {activeLesson.subTopics ? (
                  activeLesson.subTopics.map((subTopic: any, sIdx: any) => {
                     const isExpanded = expandedSubTopics[subTopic.id || sIdx];
                     return (
                        <div key={subTopic.id || sIdx} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                           <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between p-5 transition-colors bg-slate-50 hover:bg-slate-100">
                              <button onClick={() => toggleSubTopic(subTopic.id || sIdx)} className="flex items-center gap-4 flex-1 text-left w-full">
                                 <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors bg-sky-200 text-sky-700">{sIdx + 1}</div>
                                 <h3 className="text-lg md:text-xl font-extrabold text-slate-800 leading-tight">{subTopic.title}</h3>
                              </button>
                              <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0 md:pl-4 self-end md:self-auto">
                                 <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm hidden sm:block">{subTopic.tools?.length || 0} Tools</span>
                                 <button onClick={() => toggleSubTopic(subTopic.id || sIdx)} className="bg-white p-1 rounded-full shadow-sm border border-slate-200">{isExpanded ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}</button>
                              </div>
                           </div>

                           {isExpanded && (
                              <div className="p-4 border-t-2 border-slate-100 bg-white space-y-3">
                                 {subTopic.tools && subTopic.tools.length > 0 ? [...subTopic.tools].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((item: any, index: any) => (
                                    <div key={index} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl border-2 border-slate-100 transition-colors group relative hover:border-sky-300">
                                       <div className="flex items-center gap-4">
                                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${item.color || 'bg-slate-800'} group-hover:scale-110 transition-transform`}>
                                             {(() => {
                                                const toolType = (item.content_type || item.type || '').toLowerCase();
                                                if (toolType === 'video') return <Video size={24}/>;
                                                if (toolType === 'pdf' || toolType === 'presentation' || toolType === 'ppt') return <FileText size={24}/>;
                                                return <Gamepad2 size={24}/>;
                                             })()}
                                          </div>
                                          <div>
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">#{index + 1} • {item.content_type || item.type || 'Tool'}</span>
                                                {item.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1"><Star size={8} className="fill-amber-700"/> Pro</span>}
                                             </div>
                                             <h4 className="text-lg font-extrabold text-slate-800">{item.title}</h4>
                                          </div>
                                       </div>
                                       <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                          <Button variant="secondary" className="flex-1 md:flex-none py-2 px-6 text-sm font-bold border-2 shadow-none hover:border-sky-500 hover:text-sky-600" onClick={() => {
                                             const isolatedPlaylist = [...subTopic.tools].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
                                             onStartLesson({ chapter: activeLesson.chapter, book: activeLesson.book, subtopic: subTopic.title, flow: isolatedPlaylist }, index);
                                          }}>{item.isPremium && !isLoggedIn ? <Lock size={14}/> : 'Start Tool'}</Button>
                                       </div>
                                    </div>
                                 )) : ( <div className="text-center py-6 text-slate-400 font-medium text-sm border-2 border-dashed border-slate-100 rounded-xl">No tools in this subtopic yet.</div> )}
                              </div>
                           )}
                        </div>
                     );
                  })
               ) : (
                  <div className="relative border-l-4 border-slate-200 space-y-8 pb-8 pl-8">
                     {activeLesson.flow && activeLesson.flow.map((item: any, index: any) => {
                        const toolType = (item.content_type || item.type || '').toLowerCase();
                        return (
                           <div key={index} className="relative group">
                              <div className={`absolute -left-[54px] top-2 w-10 h-10 rounded-full border-4 border-white ${item.color || 'bg-slate-800'} flex items-center justify-center text-white shadow-md z-10`}>
                                 {toolType === 'video' ? <Video size={16}/> : (toolType === 'pdf' || toolType === 'presentation' || toolType === 'ppt') ? <FileText size={16}/> : <Gamepad2 size={16}/>}
                              </div>
                              <Card className="p-5 md:p-6 border-2 hover:border-sky-300">
                                 <div className="flex justify-between items-center">
                                    <h4 className="text-xl font-extrabold text-slate-800">{item.title}</h4>
                                    <Button variant="secondary" className="py-2 px-4 text-xs shadow-none border-2 hover:border-sky-500 hover:text-sky-600" onClick={() => onStartLesson(activeLesson, index)}>Play</Button>
                                 </div>
                              </Card>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};







// ============================================================================
// SECTION 8: LANDING VIEW (HOME PAGE)
// ============================================================================

const LandingView = ({ onTryDemo, onNavigateToTier, onNavigateToLessons, onOpenFeatured, onLoginClick }: any) => {
  const [activeUsp, setActiveUsp] = useState(0);
  const [activeTierId, setActiveTierId] = useState('conceptualiser');
  const [tierData, setTierData] = useState({ conceptualiser: [], theatre: [], dojo: [], workbook: [], arcade: [] });
  const [isLoadingTiers, setIsLoadingTiers] = useState(true);

  // UPDATED: Highlighting the 5-Tier, Curriculum, and Frictionless approach!
  const USPS = [
    { icon: Layers, title: "The 5-Tier Loop", desc: "Master concepts through a proven cycle: Sandbox ➔ Video ➔ Quiz ➔ PDF ➔ Game.", color: "text-purple-500", bg: "bg-purple-100", shadow: "shadow-purple-200/50" },
    { icon: BookOpen, title: "Structured Curriculum", desc: "Not just a random arcade. Every tool is perfectly mapped to chapter-wise progressions.", color: "text-sky-500", bg: "bg-sky-100", shadow: "shadow-sky-200/50" },
    { icon: Zap, title: "Frictionless Access", desc: "Zero paywalls. Zero sign-ups. Click, play, and learn instantly across all devices.", color: "text-orange-500", bg: "bg-orange-100", shadow: "shadow-orange-200/50" },
    { icon: Brain, title: "NEP 2020 Aligned", desc: "Meticulously engineered by experts to target foundational and preparatory competencies.", color: "text-emerald-500", bg: "bg-emerald-100", shadow: "shadow-emerald-200/50" }
  ];

  useEffect(() => {
    const interval = setInterval(() => { setActiveUsp((prev) => (prev + 1) % USPS.length); }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchTierData() {
      setIsLoadingTiers(true);
      try {
        const q = query(collection(db, 'learning_tools'), where('is_featured', '==', true), limit(50));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((d: any) => ({id: d.id, ...d.data()}));
        const categorized: any = { conceptualiser: [], theatre: [], dojo: [], workbook: [], arcade: [] };

        items.forEach((item: any) => {
          const type = item.content_type?.toLowerCase();
          if (type === 'video') categorized.theatre.push(item);
          else if (type === 'quiz') categorized.dojo.push(item);
          else if (type === 'pdf' || type === 'worksheet' || type === 'document') categorized.workbook.push(item);
          else if (type === 'game') categorized.arcade.push(item);
          else if (type === 'conceptualiser') categorized.conceptualiser.push(item);
        });
        setTierData(categorized);
      } catch (error) { console.error(error); } finally { setIsLoadingTiers(false); }
    }
    fetchTierData();
  }, []);useEffect(() => {
    async function fetchTierData() {
      setIsLoadingTiers(true);
      try {
        // Grab featured items (Removed the limit here so we don't accidentally cut off games!)
        const q = query(collection(db, 'learning_tools'), where('is_featured', '==', true));
        const snapshot = await getDocs(q);
        let items = snapshot.docs.map((d: any) => ({id: d.id, ...d.data()}));

        // 1. Sort all items by 'created_at' so the NEWEST are at the top of the list
        items.sort((a: any, b: any) => {
           const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
           const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
           return dateB - dateA;
        });

        const categorized: any = { conceptualiser: [], theatre: [], dojo: [], workbook: [], arcade: [] };

        items.forEach((item: any) => {
          // 2. Add .trim() to bulletproof against accidental spaces in your CSV
          const type = item.content_type?.toLowerCase().trim(); 
          
          // 3. Distribute them, but strictly stop when a category hits 10 items
          if (type === 'video' && categorized.theatre.length < 10) categorized.theatre.push(item);
          else if (type === 'quiz' && categorized.dojo.length < 10) categorized.dojo.push(item);
          else if ((type === 'pdf' || type === 'worksheet' || type === 'document') && categorized.workbook.length < 10) categorized.workbook.push(item);
          else if ((type === 'game' || type === 'arcade') && categorized.arcade.length < 10) categorized.arcade.push(item);
          else if (type === 'conceptualiser' && categorized.conceptualiser.length < 10) categorized.conceptualiser.push(item);
        });
        
        setTierData(categorized);
      } catch (error) { console.error(error); } finally { setIsLoadingTiers(false); }
    }
    fetchTierData();
  }, []);

  const activeTier = FIVE_TIERS.find(t => t.id === activeTierId) || FIVE_TIERS[0];
  const activeItems = tierData[activeTierId as keyof typeof tierData] || [];

  return (
  <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in relative overflow-x-hidden">
    
    {/* HERO SECTION */}
    <div className="bg-sky-50 pt-16 pb-32 px-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-20 h-20 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-20 w-32 h-32 bg-lime-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider mb-2 border border-sky-200">
             <Globe size={16} /> 100% Free & Open Access
          </div>
          {/* UPDATED: Headline & Subheadline */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">Smarter Tools,<br/><span className="text-sky-500">Stronger Minds.</span></h1>
          <p className="text-xl text-slate-600 font-medium max-w-lg mx-auto md:mx-0">Go beyond random videos. Explore a perfectly sequenced curriculum of Interactive Sandboxes, Quizzes, and Games mapped to your exact syllabus.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
            <Button variant="primary" className="text-lg px-8 py-4 w-full sm:w-auto shadow-sky-500/30" onClick={() => document.getElementById('five-tiers')?.scrollIntoView({behavior: 'smooth'})}>Explore 5-Tier System</Button>
            <Button variant="secondary" className="text-lg px-8 py-4 w-full sm:w-auto border-2 border-slate-300" onClick={onTryDemo}>Play Master Demo</Button>
          </div>
        </div>
        <div className="hidden md:flex justify-center items-center relative h-[450px] w-full z-10">
           {USPS.map((usp: any, idx: any) => {
              let diff = idx - activeUsp;
              if (diff < -2) diff += 4; if (diff > 2) diff -= 4;
              const isCenter = diff === 0; const isNext = diff === 1; const isPrev = diff === -1;
              let transform = 'translateX(0) scale(0.4)'; let opacity = '0'; let zIndex = 10; let blur = 'blur(8px)';
              if (isCenter) { transform = 'translateX(0) scale(1.05)'; opacity = '1'; zIndex = 30; blur = 'blur(0px)'; } 
              else if (isNext) { transform = 'translateX(180px) scale(0.85)'; opacity = '0.6'; zIndex = 20; blur = 'blur(2px)'; } 
              else if (isPrev) { transform = 'translateX(-180px) scale(0.85)'; opacity = '0.6'; zIndex = 20; blur = 'blur(2px)'; } 
              return (
                 <div key={idx} className={`absolute w-72 bg-white/95 backdrop-blur-md rounded-[2.5rem] pt-16 pb-8 px-6 transition-all duration-[800ms] ease-out flex flex-col items-center text-center ${isCenter ? 'shadow-2xl ring-8 ring-white/60 ' + usp.shadow : 'shadow-lg'}`} style={{ transform, opacity, zIndex, filter: blur }}>
                    <div className={`absolute -top-12 w-24 h-24 ${usp.bg} rounded-[2rem] flex items-center justify-center shadow-lg transition-all duration-[800ms] border-[6px] border-white ${isCenter ? 'rotate-6 scale-110 shadow-xl' : '-rotate-3'} `}><usp.icon size={44} className={usp.color} /></div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3">{usp.title}</h3>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed">{usp.desc}</p>
                 </div>
              );
           })}
        </div>
      </div>
    </div>

    {/* Marquee */}
    <div className="w-full bg-white border-y-4 border-slate-100 py-4 overflow-hidden relative flex items-center z-30 shadow-sm">
      <div className="flex animate-marquee w-max hover:[animation-play-state:paused]">
        {[...SUBJECTS, ...SUBJECTS, ...SUBJECTS].map((subject: any, idx: any) => {
          const subjectData = SUBJECT_ICONS[subject] || { icon: Star, color: 'text-slate-400' };
          const Icon = subjectData.icon;
          return (<div key={idx} className="mx-3 px-5 py-2 bg-slate-50 border-2 border-slate-200 rounded-full font-black text-slate-500 text-xs uppercase tracking-wider flex-shrink-0 flex items-center gap-2 cursor-default shadow-sm"><Icon size={16} className={subjectData.color} />{subject}</div>);
        })}
      </div>
    </div>

    {/* THE 5-TIER LEARNING LOOP */}
    <div id="five-tiers" className="max-w-[90rem] mx-auto px-4 pt-24 pb-12 w-full relative z-20 scroll-mt-20">
      
      {/* Upgraded Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-4 border border-sky-200 shadow-sm">
          <Layers size={16} /> Pedagogical Framework
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">The <span className="text-sky-500">5-Tier</span> Learning Loop</h2>
        <p className="text-center text-slate-500 font-medium max-w-2xl mx-auto text-lg">From using latest AI based conceptualisers and quizzes to tradionally proved Paper-Pencil practice sheet, Our 5 types of tools enable deepest understanding of any concept in a perfect ecosystem bridging digital interactivity with physical classroom practice.</p>
      </div>

      {/* Upgraded Tabs: Floating Pill Navigation */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3 lg:gap-4 mb-10 max-w-7xl mx-auto px-2">
        {FIVE_TIERS.map(tier => {
          const isActive = activeTierId === tier.id;
          const Icon = tier.icon;
          return (
            <button 
              key={tier.id} 
              onClick={() => setActiveTierId(tier.id)} 
              className={`relative px-4 py-2.5 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-2xl md:rounded-[2rem] transition-all duration-300 flex items-center gap-2 md:gap-3 font-bold text-sm lg:text-base border-2 shadow-sm whitespace-nowrap
                ${isActive 
                  ? `${tier.mainColor} border-transparent text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] scale-105 z-10` 
                  : `bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:scale-105`
                }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : tier.textColor} />
              <span className="hidden sm:block">{tier.label}</span>
            </button>
          );
        })}
      </div>

      {/* Upgraded Content Area: Soft Glassmorphic Container */}
      <div className={`w-full max-w-7xl mx-auto rounded-[3rem] p-6 md:p-10 lg:p-12 transition-colors duration-700 relative z-30 ${activeTier.lightColor} border-4 border-white shadow-xl`}>
        
        {/* Dynamic Header & View All Button */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-sm">
          <div>
            <h3 className={`text-2xl md:text-3xl font-black ${activeTier.textColor} flex items-center gap-3`}>
               <activeTier.icon size={28} /> {activeTier.label}
            </h3>
            <p className="text-slate-600 font-medium mt-2 leading-relaxed">{activeTier.desc}. Swipe to explore featured modules.</p>
          </div>
          
          <button 
            onClick={() => onNavigateToTier && onNavigateToTier(activeTier.id)}
            className={`shrink-0 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-sm border-2 ${activeTier.borderColor} ${activeTier.textColor} hover:${activeTier.mainColor} hover:text-white transition-all bg-white shadow-sm`}
          >
            {activeTier.actionText} <ArrowRight size={18} />
          </button>
        </div>

        {/* Database Driven Cards */}
        <div className="flex overflow-x-auto gap-6 pb-8 pt-4 snap-x hide-scrollbar px-2 -mx-2">
          {isLoadingTiers ? (
            <div className="w-full text-center py-16 text-slate-500 font-bold animate-pulse">Loading {activeTier.label} tools...</div>
          ) : activeItems.length > 0 ? (
            activeItems.map((item: any) => (
              <Card 
                key={item.id} 
                className={`min-w-[280px] sm:min-w-[320px] snap-start flex-shrink-0 cursor-pointer p-0 flex flex-col bg-white overflow-hidden hover:-translate-y-3 transition-all duration-300 shadow-lg hover:shadow-2xl group border-none ring-4 ring-transparent hover:ring-${activeTier.mainColor.replace('bg-', '')}/30`} 
                onClick={() => onOpenFeatured(item)}
              >
                {/* Image Area */}
                <div className={`h-40 sm:h-48 w-full ${activeTier.lightColor} relative flex items-center justify-center overflow-hidden`}>
                  {item.image ? (
                     <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                     <activeTier.icon size={80} className={`${activeTier.textColor} opacity-20 transform group-hover:scale-110 transition-transform duration-500`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-transparent to-transparent pointer-events-none"></div>
                  
                  {/* Dynamic Badge */}
                  <div className={`absolute top-4 left-4 ${activeTier.mainColor} text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5`}>
                    <activeTier.icon size={14} /> {activeTier.label}
                  </div>

                  {item.isPremium && <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1"><Star size={10} className="fill-white" /> PRO</div>}
                </div>
                
                {/* Details Area */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-3">
                     <div className="mb-3">
                        <p className={`text-14 font-black ${activeTier.textColor} uppercase tracking-wider line-clamp-1`}>{item.chapter_name || item.subject || 'Resource'}</p>
                      </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mb-4 leading-tight line-clamp-2 group-hover:text-slate-900">{item.title}</h3>
                  
                  <div className="mt-auto pt-5 flex justify-between items-center border-t-2 border-slate-50">
                    
                    {/* Grade and Subject Badge */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">
                        {item.grade} • {item.subject}
                      </span>
                    </div>
                    
                    {/* Dynamic Action Button */}
                    <div className={`px-4 py-2.5 rounded-xl ${activeTier.lightColor} flex items-center justify-center group-hover:${activeTier.mainColor} transition-colors duration-300 shadow-sm`}>
                      <span className={`text-[11px] font-black uppercase tracking-wider ${activeTier.textColor} group-hover:text-white flex items-center gap-1.5`}>
                        {{
                          'Conceptualiser': 'Learn Concept',
                          'Video': 'Play Video',
                          'Game': 'Play Game',
                          'Quiz': 'Take Quiz',
                          'PDF': 'Read PDF',
                        }[item.content_type] || 'Start Lesson'}
                        <Play size={12} className="fill-current" />
                      </span>
                    </div>

                  </div>
                </div>
              </Card>
            ))
          ) : (
            /* "COMING SOON" FALLBACK CARD */
            <Card className="min-w-[300px] sm:min-w-[340px] snap-start flex-shrink-0 p-0 flex flex-col bg-white overflow-hidden shadow-lg border-none">
              <div className={`h-40 sm:h-48 w-full ${activeTier.lightColor} relative flex items-center justify-center`}>
                <activeTier.icon size={80} className={`${activeTier.textColor} opacity-20`} />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-white shadow-lg font-black text-slate-700 tracking-wider uppercase text-sm transform -rotate-3 flex items-center gap-2">
                     <Settings size={18} className="animate-spin text-slate-400" /> In Development
                   </div>
                </div>
              </div>
              <div className="p-6 text-center flex-1 flex flex-col justify-center">
                <h3 className={`text-xl font-extrabold ${activeTier.textColor} mb-3 leading-tight`}>Interactive {activeTier.label}s</h3>
                <p className="text-sm font-bold text-slate-500">Our pedagogical engineers are currently building revolutionary new tools for this tier. Check back soon!</p>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>

    {/* NEW: THE CURRICULUM STRATEGY MAP */}
    <div className="w-full bg-slate-900 text-white py-24 relative overflow-hidden border-t-8 border-sky-500">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-400 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-4 border border-sky-500/30">
            <BookOpen size={16} /> 100% NCF Mapped Content
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Find exactly what you need,<br/>when you need it.</h2>
          <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">Kortex Klassroom isn't just a random arcade. Every single game, video, and quiz is meticulously organized into a structured curriculum.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
           <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 z-0"></div>
           
           <div className="bg-slate-800 border-2 border-slate-700 p-8 rounded-3xl relative z-10 text-center transform md:-translate-y-4 hover:-translate-y-6 transition-transform shadow-xl">
             <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-slate-300 border-4 border-slate-900 shadow-inner">1</div>
             <h3 className="text-2xl font-black text-white mb-2">Select Grade</h3>
             <p className="text-slate-400 font-bold text-sm">From Balvatika to Grade 8.</p>
           </div>

           <div className="bg-sky-900 border-2 border-sky-700 p-8 rounded-3xl relative z-10 text-center transform md:translate-y-4 hover:translate-y-2 transition-transform shadow-xl">
             <div className="w-16 h-16 bg-sky-800 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-sky-300 border-4 border-slate-900 shadow-inner">2</div>
             <h3 className="text-2xl font-black text-white mb-2">Pick Subject</h3>
             <p className="text-sky-200/70 font-bold text-sm">Maths, Languages, EVS & More.</p>
           </div>

           <div className="bg-indigo-900 border-2 border-indigo-700 p-8 rounded-3xl relative z-10 text-center transform md:-translate-y-4 hover:-translate-y-6 transition-transform shadow-xl">
             <div className="w-16 h-16 bg-indigo-800 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-indigo-300 border-4 border-slate-900 shadow-inner">3</div>
             <h3 className="text-2xl font-black text-white mb-2">Open Chapter</h3>
             <p className="text-indigo-200/70 font-bold text-sm">Mapped directly to school books.</p>
           </div>

           <div className="bg-emerald-900 border-2 border-emerald-700 p-8 rounded-3xl relative z-10 text-center transform md:translate-y-4 hover:translate-y-2 transition-transform shadow-xl">
             <div className="w-16 h-16 bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-emerald-300 border-4 border-slate-900 shadow-inner">4</div>
             <h3 className="text-2xl font-black text-white mb-2">Start Playing</h3>
             <p className="text-emerald-200/70 font-bold text-sm">Access the 5-Tier tools instantly.</p>
           </div>
        </div>

        <div className="mt-16 text-center relative z-10 flex justify-center">
           <Button variant="primary" onClick={onNavigateToLessons} className="text-lg px-10 py-5 w-full sm:w-auto shadow-[0_0_40px_rgba(14,165,233,0.3)] hover:shadow-[0_0_60px_rgba(14,165,233,0.5)]">
              Explore All Lessons <ArrowRight size={20} className="ml-2 inline" />
           </Button>
        </div>
        
      </div>
    </div>

    {/* NEW: THE KORTEX KREW SECTION */}
    <div className="bg-amber-50 py-24 w-full border-t-8 border-amber-400 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
       <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="order-2 md:order-1 relative h-[400px] w-full hidden md:block">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-200 rounded-full blur-2xl opacity-60"></div>
             <div className="absolute top-10 left-10 w-48 h-48 bg-white rounded-[2rem] border-4 border-amber-100 shadow-xl flex items-center justify-center transform -rotate-6 overflow-hidden"><img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=400&q=80" className="object-cover w-full h-full opacity-90"/></div>
             <div className="absolute bottom-10 right-10 w-56 h-56 bg-white rounded-[2.5rem] border-4 border-amber-100 shadow-2xl flex items-center justify-center transform rotate-3 overflow-hidden"><img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80" className="object-cover w-full h-full opacity-90"/></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500 rounded-full border-8 border-white shadow-2xl flex items-center justify-center z-20"><Users size={48} className="text-white" /></div>
          </div>
          <div className="order-1 md:order-2 space-y-6 text-center md:text-left">
             <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider mb-2 border border-amber-200">
               <Shield size={16} /> Built by Real Experts
             </div>
             <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">Meet the <br/><span className="text-amber-500">Kortex Krew.</span></h2>
             <p className="text-lg text-slate-600 font-medium">This platform isn't built by a faceless corporation. Every game, lesson, and concept is painstakingly engineered by a collective of real teachers, child psychologists, and passionate parents across India.</p>
             <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button variant="fun" className="text-lg px-8 py-4 w-full sm:w-auto shadow-xl shadow-amber-500/20" onClick={() => window.open('https://forms.gle/g1AY5rG5F6zCoSiw5', '_blank')}>
                   Apply to Join the Krew <ArrowRight size={20} className="ml-2 inline"/>
                </Button>
                <Button variant="secondary" className="text-lg px-8 py-4 w-full sm:w-auto border-2 border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-white" onClick={onLoginClick}>
                   Krew Login <Lock size={20} className="ml-2 inline"/>
                </Button>
             </div>
          </div>
       </div>
    </div>

    {/* RESTORED: Testimonials Section */}
    <div className="bg-sky-50 py-24 w-full border-t-4 border-sky-100 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16"><h2 className="text-4xl font-extrabold text-slate-800">Loved by our Community</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial: any, idx: any) => (
            <Card key={idx} className="p-8 relative border-none shadow-xl hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full">
              <div className="flex gap-1 mb-6 relative z-10">{[...Array(5)].map((_: any, i: any) => (<Star key={i} size={20} className="fill-amber-400 text-amber-400" />))}</div>
              <p className="text-slate-700 font-bold text-lg leading-relaxed mb-8 relative z-10 italic flex-1">"{testimonial.text}"</p>
              <div className="flex items-center gap-4 mt-auto relative z-10">
                <div className="w-14 h-14 rounded-full border-4 border-sky-50 overflow-hidden shadow-sm shrink-0"><img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" /></div>
                <div><h4 className="font-extrabold text-slate-800">{testimonial.name}</h4><p className="text-sm font-bold text-sky-500">{testimonial.role}</p></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>

  </div>
  );
};
















// ============================================================================
// SECTION 11: KREW GLOBAL EDITOR PANEL (HEADLESS CMS)
// ============================================================================
const KrewEditorPanel = () => {
  const [wizardMode, setWizardMode] = useState<any>(null);
  const [wizardData, setWizardData] = useState<any>([]); 
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [targetLevel, setTargetLevel] = useState('TOOL'); // Handles both DELETE and EDIT scoping

  const initialWizardState = { 
     grade: '', subject: '', book: 'Kortex Klassroom', 
     chapterSelect: '', newChapter: '', chapterNumber: '', 
     subtopicSelect: '', newSubtopic: '', subtopicOrder: '', 
     toolSelect: '', toolOrder: '', toolType: 'Conceptualiser', 
     toolTitle: '', imageUrl: '', url: '', isFeatured: false, originalToolTitle: '' 
  };
  const [krewWizard, setKrewWizard] = useState(initialWizardState);

  useEffect(() => {
    async function fetchWizardData() {
      if (wizardMode && krewWizard.grade && krewWizard.subject) {
        const fg = krewWizard.grade.toLowerCase().trim();
        const fs = krewWizard.subject.toLowerCase().trim();
        try {
          const snapshot = await getDocs(collection(db, 'learning_tools'));
          const filtered = snapshot.docs.map(d => d.data()).filter((m: any) => {
             const dbSubj = m.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : m.subject?.toLowerCase().trim();
             return m.grade?.toLowerCase().trim() === fg && dbSubj === fs;
          });

          const chapterMap: any = {};
          filtered.forEach((tool: any) => {
              const chapName = tool.chapter_name || tool.chapter;
              if (!chapName) return;
              if (!chapterMap[chapName]) chapterMap[chapName] = { chapter: chapName, chapter_number: tool.chapter_number, subTopicsMap: {} };
              if (tool.subtopic) {
                  if (!chapterMap[chapName].subTopicsMap[tool.subtopic]) chapterMap[chapName].subTopicsMap[tool.subtopic] = { title: tool.subtopic, order: tool.subtopic_order || 1, tools: [] };
                  if (tool.title && tool.content_type && tool.content_type !== 'placeholder') chapterMap[chapName].subTopicsMap[tool.subtopic].tools.push(tool);
              }
          });

          const formattedData = Object.values(chapterMap).map((c: any) => ({ chapter: c.chapter, chapter_number: c.chapter_number, subTopics: Object.values(c.subTopicsMap) }));
          setWizardData(formattedData as any);
        } catch (e: any) { console.error(e); }
      } else { setWizardData([]); }
    }
    fetchWizardData();
  }, [krewWizard.grade, krewWizard.subject, wizardMode]);

  const selectedChapData: any = wizardData.find((c: any) => c.chapter === krewWizard.chapterSelect);
  const availableSubtopics = selectedChapData?.subTopics || [];
  const selectedSubtopicData: any = availableSubtopics.find((s: any) => s.title === krewWizard.subtopicSelect);
  const availableTools = selectedSubtopicData?.tools || [];

  const getExactToolDoc = async (g: any, s: any, c: any, sub: any, title: any) => {
     const snap = await getDocs(collection(db, 'learning_tools'));
     return snap.docs.find((d: any) => {
        const data = d.data();
        const dGrade = data.grade?.toLowerCase().trim() || '';
        const dSubj = data.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : (data.subject?.toLowerCase().trim() || '');
        const dChap = (data.chapter_name || data.chapter || '')?.toLowerCase().trim();
        const dSub = data.subtopic?.toLowerCase().trim() || '';
        const dTitle = data.title?.toLowerCase().trim() || '';
        return dGrade === (g||'').toLowerCase().trim() && dSubj === (s||'').toLowerCase().trim() && dChap === (c||'').toLowerCase().trim() && dSub === (sub||'').toLowerCase().trim() && dTitle === (title||'').toLowerCase().trim();
     });
  };

  const handleSubmitWizard = async () => {
     const isEdit = wizardMode === 'EDIT';
     const finalChapter = krewWizard.chapterSelect === 'NEW' ? krewWizard.newChapter : krewWizard.chapterSelect;
     const finalSubtopic = krewWizard.subtopicSelect === 'NEW' ? krewWizard.newSubtopic : krewWizard.subtopicSelect;
     
     // 1. BULK EDIT CHAPTER (Renames Chapter across all flat docs)
     if (isEdit && targetLevel === 'CHAPTER') {
         if (!krewWizard.newChapter || !krewWizard.chapterNumber) { alert("Please provide the new Chapter Name and Number!"); return; }
         setIsSendingRequest(true);
         try {
             const snapshot = await getDocs(collection(db, 'learning_tools'));
             const docsToUpdate = snapshot.docs.filter((d: any) => d.data().grade === krewWizard.grade && d.data().subject === krewWizard.subject && (d.data().chapter_name || d.data().chapter) === krewWizard.chapterSelect);
             for (const docSnap of docsToUpdate) {
                 await setDoc(doc(db, 'learning_tools', docSnap.id), { chapter: krewWizard.newChapter, chapter_name: krewWizard.newChapter, chapter_number: Number(krewWizard.chapterNumber) }, { merge: true });
             }
             await addDoc(collection(db, 'content_requests'), { krew_member_id: auth.currentUser?.uid || 'unknown', action_type: 'BULK_EDIT_CHAPTER', payload: { old: krewWizard.chapterSelect, new: krewWizard.newChapter }, status: 'APPROVED', resolved_by: 'Krew Auto-Publish', resolved_at: new Date().toISOString() });
             alert(`Successfully updated Chapter name for ${docsToUpdate.length} items!`);
             setWizardMode(null); window.location.reload();
         } catch(e: any) { console.error(e); alert("Error updating chapter."); } finally { setIsSendingRequest(false); }
         return;
     }

     // 2. BULK EDIT SUBTOPIC (Renames Subtopic across all flat docs in that chapter)
     if (isEdit && targetLevel === 'SUBTOPIC') {
         if (!krewWizard.newSubtopic || !krewWizard.subtopicOrder) { alert("Please provide the new Subtopic Name and Order!"); return; }
         setIsSendingRequest(true);
         try {
             const snapshot = await getDocs(collection(db, 'learning_tools'));
             const docsToUpdate = snapshot.docs.filter((d: any) => d.data().grade === krewWizard.grade && d.data().subject === krewWizard.subject && (d.data().chapter_name || d.data().chapter) === krewWizard.chapterSelect && d.data().subtopic === krewWizard.subtopicSelect);
             for (const docSnap of docsToUpdate) {
                 await setDoc(doc(db, 'learning_tools', docSnap.id), { subtopic: krewWizard.newSubtopic, subtopic_order: Number(krewWizard.subtopicOrder) }, { merge: true });
             }
             await addDoc(collection(db, 'content_requests'), { krew_member_id: auth.currentUser?.uid || 'unknown', action_type: 'BULK_EDIT_SUBTOPIC', payload: { old: krewWizard.subtopicSelect, new: krewWizard.newSubtopic }, status: 'APPROVED', resolved_by: 'Krew Auto-Publish', resolved_at: new Date().toISOString() });
             alert(`Successfully updated Subtopic name for ${docsToUpdate.length} items!`);
             setWizardMode(null); window.location.reload();
         } catch(e: any) { console.error(e); alert("Error updating subtopic."); } finally { setIsSendingRequest(false); }
         return;
     }

     // 3. STANDARD TOOL ADD/EDIT
     if (!krewWizard.grade || !krewWizard.subject || !finalChapter || !krewWizard.chapterNumber || !finalSubtopic || !krewWizard.toolTitle || !krewWizard.url) { 
         alert("Please fill out all required fields!"); return; 
     }

     if (!isEdit && krewWizard.chapterSelect === 'NEW') {
         const numTaken = wizardData.some((c: any) => Number(c.chapter_number) === Number(krewWizard.chapterNumber));
         if (numTaken) { alert(`Chapter Number ${krewWizard.chapterNumber} is already used. Please choose another.`); return; }
     }

     setIsSendingRequest(true);
     let toolColor = 'bg-sky-500';
     const tType = krewWizard.toolType.toLowerCase();
     if (tType === 'conceptualiser') toolColor = 'bg-purple-500';
     else if (tType === 'video') toolColor = 'bg-pink-500';
     else if (tType === 'quiz') toolColor = 'bg-orange-500';
     else if (tType === 'pdf' || tType === 'presentation') toolColor = 'bg-sky-500';
     else if (tType === 'game') toolColor = 'bg-lime-500';

     const flatPayload = {
        grade: krewWizard.grade, subject: krewWizard.subject, chapter_number: Number(krewWizard.chapterNumber),
        chapter_name: finalChapter, chapter: finalChapter, book: krewWizard.book || 'Kortex Klassroom', 
        subtopic_order: Number(krewWizard.subtopicOrder), subtopic: finalSubtopic, title: krewWizard.toolTitle, 
        content_type: krewWizard.toolType.toLowerCase(), type: krewWizard.toolType, image: krewWizard.imageUrl || '', 
        content_url: krewWizard.url, content_order: Number(krewWizard.toolOrder), orderIndex: Number(krewWizard.toolOrder), 
        isPremium: false, is_featured: krewWizard.isFeatured, color: toolColor, created_at: new Date().toISOString()
     };

     try {
       if (isEdit) {
          const oldDoc = await getExactToolDoc(flatPayload.grade, flatPayload.subject, krewWizard.chapterSelect, krewWizard.subtopicSelect, krewWizard.originalToolTitle);
          if (oldDoc) await setDoc(doc(db, 'learning_tools', oldDoc.id), flatPayload, { merge: true });
          else await addDoc(collection(db, 'learning_tools'), flatPayload);
       } else {
          await addDoc(collection(db, 'learning_tools'), flatPayload);
       }
       await addDoc(collection(db, 'content_requests'), { krew_member_id: auth.currentUser?.uid || 'unknown', action_type: isEdit ? 'EDIT' : 'ADD', target_type: 'TOOL', payload: flatPayload, status: 'APPROVED', resolved_by: 'Krew Auto-Publish', resolved_at: new Date().toISOString() });
       
       alert(`Success! Content ${isEdit ? 'updated' : 'added'} instantly.`);
       setWizardMode(null); window.location.reload(); 
     } catch (error: any) { console.error(error); alert("Error saving content."); } finally { setIsSendingRequest(false); }
  };

  const handleExecuteDelete = async () => {
     if (!krewWizard.grade || !krewWizard.subject || !krewWizard.chapterSelect) { alert("Please select targets to delete."); return; }
     if (!window.confirm(`WARNING: Are you sure you want to permanently DELETE this ${targetLevel}? This affects the live database instantly.`)) return;

     setIsSendingRequest(true);
     try {
       const snapshot = await getDocs(collection(db, 'learning_tools'));
       const docsToDelete = snapshot.docs.filter((docSnap: any) => {
           const data = docSnap.data();
           if (data.grade?.toLowerCase().trim() !== krewWizard.grade.toLowerCase().trim() || 
              (data.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : data.subject?.toLowerCase().trim()) !== krewWizard.subject.toLowerCase().trim()) return false;

           if (targetLevel === 'CHAPTER') return (data.chapter_name || data.chapter)?.toLowerCase().trim() === krewWizard.chapterSelect.toLowerCase().trim();
           if (targetLevel === 'SUBTOPIC') return (data.chapter_name || data.chapter)?.toLowerCase().trim() === krewWizard.chapterSelect.toLowerCase().trim() && data.subtopic?.toLowerCase().trim() === krewWizard.subtopicSelect.toLowerCase().trim();
           if (targetLevel === 'TOOL') return (data.chapter_name || data.chapter)?.toLowerCase().trim() === krewWizard.chapterSelect.toLowerCase().trim() && data.subtopic?.toLowerCase().trim() === krewWizard.subtopicSelect.toLowerCase().trim() && data.title?.toLowerCase().trim() === krewWizard.toolSelect.toLowerCase().trim();
           return false;
       });

       for (const docSnap of docsToDelete) await deleteDoc(doc(db, 'learning_tools', docSnap.id));
       await addDoc(collection(db, 'content_requests'), { krew_member_id: auth.currentUser?.uid || 'unknown', action_type: 'DELETE', target_type: targetLevel, payload: { chapter: krewWizard.chapterSelect, subtopic: krewWizard.subtopicSelect, tool: krewWizard.toolSelect }, status: 'APPROVED', resolved_by: 'Krew Auto-Publish', resolved_at: new Date().toISOString() });

       alert(`Successfully deleted ${docsToDelete.length} records!`);
       setWizardMode(null); window.location.reload(); 
     } catch (error: any) { console.error(error); alert("Error deleting content."); } finally { setIsSendingRequest(false); }
  };

  const openWizard = (mode: any) => { setWizardMode(mode); setKrewWizard(initialWizardState); setTargetLevel('TOOL'); };

  return (
    <>
      <div className="w-full bg-slate-800 text-white px-4 py-3 flex justify-between items-center shadow-md border-b-4 border-slate-900">
         <div className="font-black flex items-center gap-2 tracking-wide"><Database size={18} className="text-emerald-400"/> KREW STUDIO</div>
         <div className="flex gap-2">
            <Button onClick={()=>openWizard('ADD')} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm py-1.5 px-3 h-auto"><Plus size={16} className="mr-1"/> Add</Button>
            <Button onClick={()=>openWizard('EDIT')} className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm py-1.5 px-3 h-auto"><Edit3 size={16} className="mr-1"/> Edit</Button>
            <Button onClick={()=>openWizard('DELETE')} className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm py-1.5 px-3 h-auto"><Trash2 size={16} className="mr-1"/> Delete</Button>
         </div>
      </div>

      {wizardMode && (
         <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4 py-12 sm:py-24 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full shadow-2xl relative border-4 border-slate-100 my-auto">
               <button onClick={() => setWizardMode(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"><X size={20} /></button>
               
               <div className="flex items-center gap-4 mb-8 border-b-2 border-slate-100 pb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transform -rotate-3 ${wizardMode === 'ADD' ? 'bg-emerald-100 text-emerald-500' : wizardMode === 'EDIT' ? 'bg-amber-100 text-amber-500' : 'bg-rose-100 text-rose-500'}`}>
                     {wizardMode === 'ADD' ? <Plus size={28}/> : wizardMode === 'EDIT' ? <Edit3 size={28}/> : <Trash2 size={28}/>}
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-800">{wizardMode === 'ADD' ? 'Add New Content' : wizardMode === 'EDIT' ? 'Edit Database Record' : 'Delete Content Protocol'}</h2>
                     <p className="text-slate-500 font-bold text-sm">Secure live database modification.</p>
                  </div>
               </div>

               <div className="space-y-6">
                  {/* --- TARGET LEVEL SELECTOR (For EDIT and DELETE) --- */}
                  {(wizardMode === 'DELETE' || wizardMode === 'EDIT') && (
                     <div className={`p-5 rounded-2xl border mb-6 ${wizardMode === 'DELETE' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                        <label className={`block text-[10px] font-black mb-3 uppercase tracking-wider ${wizardMode === 'DELETE' ? 'text-rose-500' : 'text-amber-600'}`}>0. Target Level To {wizardMode}</label>
                        <div className="flex flex-wrap gap-4">
                           {['CHAPTER', 'SUBTOPIC', 'TOOL'].map(t => (
                              <label key={t} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer font-bold transition-all ${targetLevel === t ? (wizardMode === 'DELETE' ? 'bg-white text-rose-600 border-rose-500 shadow-sm' : 'bg-white text-amber-600 border-amber-500 shadow-sm') : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                 <input type="radio" name="tLevel" checked={targetLevel === t} onChange={() => { setTargetLevel(t); setKrewWizard({...initialWizardState, grade: krewWizard.grade, subject: krewWizard.subject}); }} className="hidden"/> {t}
                              </label>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* STEPS 1-2: Core */}
                  <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">1. Grade *</label><select value={krewWizard.grade} onChange={(e: any) => setKrewWizard({...initialWizardState, grade: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500"><option value="">Select Grade...</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                     <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">2. Subject *</label><select value={krewWizard.subject} onChange={(e: any) => setKrewWizard({...krewWizard, subject: e.target.value, chapterSelect: '', subtopicSelect: '', toolSelect: ''})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500"><option value="">Select Subject...</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  </div>

                  {/* STEPS 3-4: Chapter */}
                  <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="md:col-span-3">
                         <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">3. Chapter Name *</label>
                         <div className="flex gap-2">
                             <select value={krewWizard.chapterSelect} onChange={(e: any) => {
                                 const val = e.target.value;
                                 if (val === 'NEW') setKrewWizard({...krewWizard, chapterSelect: 'NEW', chapterNumber: '', subtopicSelect: wizardMode === 'ADD' ? 'NEW' : '', newSubtopic: '', subtopicOrder: '', toolSelect: wizardMode === 'ADD' ? 'NEW' : '', toolOrder: '', toolType: 'Conceptualiser', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                 else {
                                     const chap = wizardData.find((c: any) => c.chapter === val);
                                     setKrewWizard({...krewWizard, chapterSelect: val, newChapter: (wizardMode === 'EDIT' && targetLevel === 'CHAPTER') ? val : '', chapterNumber: chap?.chapter_number || '', subtopicSelect: '', newSubtopic: '', subtopicOrder: '', toolSelect: '', toolOrder: '', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                 }
                             }} disabled={!krewWizard.subject} className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 disabled:opacity-50">
                                 <option value="" disabled>Select Existing...</option>
                                 {wizardData.map((c: any) => <option key={c.chapter} value={c.chapter}>{c.chapter}</option>)}
                                 {wizardMode === 'ADD' && <option value="NEW" className="font-bold text-emerald-600">+ Create New Chapter</option>}
                             </select>
                             
                             {/* Show input if creating new, OR if editing this specific chapter level */}
                             {(krewWizard.chapterSelect === 'NEW' || (wizardMode === 'EDIT' && targetLevel === 'CHAPTER' && krewWizard.chapterSelect)) && (
                                <input type="text" value={krewWizard.newChapter} onChange={(e: any) => setKrewWizard({...krewWizard, newChapter: e.target.value})} className="flex-1 bg-white border-2 border-emerald-400 rounded-xl px-4 py-3 font-bold text-emerald-700 outline-none" placeholder={wizardMode === 'EDIT' ? "Update chapter name..." : "New chapter name..."} />
                             )}
                         </div>
                     </div>
                     <div className="md:col-span-1"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">4. Chapter No.</label><input type="number" min="1" value={krewWizard.chapterNumber} onChange={(e: any) => setKrewWizard({...krewWizard, chapterNumber: e.target.value})} disabled={krewWizard.chapterSelect !== 'NEW' && !(wizardMode === 'EDIT' && targetLevel === 'CHAPTER')} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-black text-center text-slate-700 outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400" /></div>
                  </div>

                  {/* STEPS 5-6: Subtopic (Hidden if Target Level is Chapter) */}
                  {!(targetLevel === 'CHAPTER') && (
                     <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                            <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">5. Subtopic Name *</label>
                            <div className="flex gap-2">
                                <select value={krewWizard.subtopicSelect} onChange={(e: any) => {
                                    const val = e.target.value;
                                    if (val === 'NEW') setKrewWizard({...krewWizard, subtopicSelect: 'NEW', newSubtopic: '', subtopicOrder: '', toolSelect: wizardMode === 'ADD' ? 'NEW' : '', toolOrder: '', toolType: 'Conceptualiser', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                    else {
                                        const sub = availableSubtopics.find((s: any) => s.title === val);
                                        setKrewWizard({...krewWizard, subtopicSelect: val, newSubtopic: (wizardMode === 'EDIT' && targetLevel === 'SUBTOPIC') ? val : '', subtopicOrder: sub?.order || sub?.subtopic_order || '', toolSelect: '', toolOrder: '', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                    }
                                }} disabled={!krewWizard.chapterSelect || krewWizard.chapterSelect === 'NEW'} className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 disabled:opacity-50">
                                   {krewWizard.chapterSelect === 'NEW' ? <option value="NEW" className="font-bold text-emerald-600">+ Create New Subtopic</option> : <><option value="" disabled>Select Existing...</option>{availableSubtopics.map((s: any, idx: number) => <option key={idx} value={s.title}>{s.title}</option>)} {wizardMode === 'ADD' && <option value="NEW" className="font-bold text-emerald-600">+ Create New Subtopic</option>}</>}
                                </select>
                                
                                {(krewWizard.subtopicSelect === 'NEW' || (wizardMode === 'EDIT' && targetLevel === 'SUBTOPIC' && krewWizard.subtopicSelect)) && (
                                   <input type="text" value={krewWizard.newSubtopic} onChange={(e: any) => setKrewWizard({...krewWizard, newSubtopic: e.target.value})} className="flex-1 bg-white border-2 border-emerald-400 rounded-xl px-4 py-3 font-bold text-emerald-700 outline-none" placeholder={wizardMode === 'EDIT' ? "Update subtopic name..." : "New subtopic name..."} />
                                )}
                            </div>
                        </div>
                        <div className="md:col-span-1"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">6. Subtopic Order</label><input type="number" min="1" value={krewWizard.subtopicOrder} onChange={(e: any) => setKrewWizard({...krewWizard, subtopicOrder: e.target.value})} disabled={krewWizard.subtopicSelect !== 'NEW' && !(wizardMode === 'EDIT' && targetLevel === 'SUBTOPIC')} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-black text-center text-slate-700 outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400" /></div>
                     </div>
                  )}

                  {/* STEPS 7-12: Tool Data (Hidden if Target Level is Chapter or Subtopic) */}
                  {!(targetLevel === 'CHAPTER' || targetLevel === 'SUBTOPIC') && (
                     <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 space-y-4">
                        
                        {/* RESTORED: isFeatured Checkbox */}
                        <div className="flex justify-between items-center mb-4 border-b-2 border-slate-100 pb-4">
                           <label className={`block text-sm font-black ${wizardMode === 'EDIT' ? 'text-amber-500' : 'text-emerald-500'} uppercase tracking-wider`}>Tool Configuration</label>
                           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border-2 border-slate-200">
                              <input type="checkbox" id="feat" checked={krewWizard.isFeatured} onChange={(e: any) => setKrewWizard({...krewWizard, isFeatured: e.target.checked})} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                              <label htmlFor="feat" className="text-xs font-bold text-slate-500 cursor-pointer flex items-center gap-1"><Sparkles size={14} className="text-emerald-400"/> Is Featured?</label>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="md:col-span-3">
                                <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">7. Target Tool *</label>
                                <select value={krewWizard.toolSelect} onChange={(e: any) => {
                                    const val = e.target.value;
                                    if (val === 'NEW') setKrewWizard({...krewWizard, toolSelect: 'NEW', toolOrder: '', toolType: 'Conceptualiser', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                    else {
                                        const tool = availableTools.find((t: any) => t.title === val);
                                        if(tool) {
                                            let tType = 'Video';
                                            if(tool.type) {
                                               const t = tool.type.toLowerCase();
                                               if (t==='game'||t==='gamepad2') tType='Game'; else if (t==='pdf') tType='PDF'; else if (t==='presentation'||t==='ppt') tType='Presentation'; else if (t==='quiz') tType='Quiz'; else if (t==='conceptualiser') tType='Conceptualiser';
                                            }
                                            setKrewWizard({...krewWizard, toolSelect: val, toolOrder: tool.orderIndex || tool.content_order || 1, toolType: tType, toolTitle: tool.title, imageUrl: tool.image || tool.image_url || '', url: tool.content_url || '', originalToolTitle: tool.title, isFeatured: tool.is_featured || false});
                                        }
                                    }
                                }} disabled={!krewWizard.subtopicSelect || krewWizard.subtopicSelect === 'NEW'} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 disabled:opacity-50">
                                   {krewWizard.subtopicSelect === 'NEW' ? <option value="NEW" className="font-bold text-emerald-600">+ Upload New Content</option> : <><option value="" disabled>Select Existing Content...</option>{availableTools.map((t: any, idx: number) => <option key={idx} value={t.title}>{t.title} ({t.type || t.content_type})</option>)} {wizardMode === 'ADD' && <option value="NEW" className="font-bold text-emerald-600">+ Upload New Content</option>}</>}
                                </select>
                            </div>
                            <div className="md:col-span-1"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">8. Tool Order</label><input type="number" min="1" value={krewWizard.toolOrder} onChange={(e: any) => setKrewWizard({...krewWizard, toolOrder: e.target.value})} disabled={krewWizard.toolSelect !== 'NEW' && wizardMode !== 'ADD'} className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-3 font-black text-center text-slate-700 outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400" /></div>
                        </div>

                        {wizardMode !== 'DELETE' && krewWizard.toolSelect && (
                            <>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <div className="md:col-span-1">
                                      <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">9. Content Type</label>
                                      <select value={krewWizard.toolType} onChange={(e: any) => setKrewWizard({...krewWizard, toolType: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500">
                                         <option value="Conceptualiser">Conceptualiser</option><option value="Video">Video</option><option value="Quiz">Quiz</option><option value="PDF">PDF</option><option value="Game">Game</option>
                                      </select>
                                   </div>
                                   <div className="md:col-span-2"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">10. Title of Content *</label><input type="text" value={krewWizard.toolTitle} onChange={(e: any) => setKrewWizard({...krewWizard, toolTitle: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" placeholder="e.g. Place Value 3D" /></div>
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">11. Image URL</label><input type="text" value={krewWizard.imageUrl} onChange={(e: any) => setKrewWizard({...krewWizard, imageUrl: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-700 outline-none focus:border-sky-500" placeholder="/thumbnails/math.jpg" /></div>
                                  <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">12. Route Path *</label><input type="text" value={krewWizard.url} onChange={(e: any) => setKrewWizard({...krewWizard, url: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-700 outline-none focus:border-sky-500 text-sm" placeholder="/conceptualisers/tool" /></div>
                               </div>
                            </>
                        )}
                     </div>
                  )}
               </div>
               
               {wizardMode === 'DELETE' ? (
                  <Button onClick={handleExecuteDelete} disabled={isSendingRequest || !krewWizard.chapterSelect} className="w-full mt-8 bg-rose-500 hover:bg-rose-600 border-b-4 border-rose-700 text-white font-black py-6 text-lg shadow-xl">
                     {isSendingRequest ? 'Executing Deletion...' : `PERMANENTLY DELETE ${targetLevel}`} <Trash2 size={20} className="ml-2 inline" />
                  </Button>
               ) : (
                  <Button onClick={handleSubmitWizard} disabled={isSendingRequest || (targetLevel === 'TOOL' && (!krewWizard.toolTitle || !krewWizard.url))} className={`w-full mt-8 ${wizardMode === 'EDIT' ? 'bg-amber-500 hover:bg-amber-600 border-amber-700' : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700'} border-b-4 text-white font-black py-6 text-lg shadow-xl`}>
                     {isSendingRequest ? 'Saving...' : (wizardMode === 'EDIT' ? `UPDATE ${targetLevel} RECORD` : 'SAVE NEW CONTENT')} <Database size={20} className="ml-2 inline" />
                  </Button>
               )}
            </div>
         </div>
      )}
    </>
  );
};







// ============================================================================
// SECTION 12: DIRECTOR COMMAND CENTER (WITH UPGRADED BULK UPLOAD & ANALYTICS)
// ============================================================================

const AdminView = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // Default to Analytics now!
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  
  // NEW: Analytics State
  const [analytics, setAnalytics] = useState<any>(null);

  // Fetch Approvals
  useEffect(() => {
    async function fetchRequests() {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'content_requests'), orderBy('created_at', 'desc'));
        const querySnapshot = await getDocs(q);
        const allReqs = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
              } as { 
                id: string; status: string; [key: string]: any; 
              }));
        setPendingRequests(allReqs.filter(req => req.status === 'pending'));
        setRequestHistory(allReqs.filter(req => req.status !== 'pending'));
      } catch (error: any) { console.error("🚨 FIREBASE ADMIN FETCH ERROR:", error); } 
      finally { setIsLoading(false); }
    }
    if (activeTab === 'approvals') fetchRequests();
  }, [activeTab]);

  // NEW: Fetch Analytics
  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      try {
        // Grab the last 2000 events to keep the dashboard extremely fast
        const q = query(collection(db, 'analytics_events'), orderBy('timestamp', 'desc'), limit(2000));
        const snap = await getDocs(q);
        const events = snap.docs.map(d => d.data());

        // 1. Calculate Unique Devices (Silent Visitors)
        const uniqueDevices = new Set(events.map(e => e.device_id)).size;
        
        // 2. Categorize Events
        const lessonStarts = events.filter(e => e.event_type === 'lesson_started');
        const lessonCompletions = events.filter(e => e.event_type === 'lesson_completed');
        const pageViews = events.filter(e => e.event_type === 'page_view');
        const demoStarts = events.filter(e => e.event_type === 'demo_started');
        
        // 3. Find Most Popular Chapters
        const chapterCounts: any = {};
        lessonStarts.forEach(e => {
            const chap = e.payload?.chapter || 'Unknown Module';
            chapterCounts[chap] = (chapterCounts[chap] || 0) + 1;
        });
        const topChapters = Object.entries(chapterCounts)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 5); // Top 5

        setAnalytics({
            totalVisitors: uniqueDevices,
            totalStarts: lessonStarts.length,
            totalCompletions: lessonCompletions.length,
            completionRate: lessonStarts.length ? Math.round((lessonCompletions.length / lessonStarts.length) * 100) : 0,
            pageViews: pageViews.length,
            demoStarts: demoStarts.length,
            topChapters
        });
      } catch (error: any) { 
        console.error("🚨 ANALYTICS FETCH ERROR:", error); 
      } finally { 
        setIsLoading(false); 
      }
    }
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

  const handleRequestAction = async (request: any, actionStatus: string) => {
    const isApproved = actionStatus === 'APPROVED';
    if (!window.confirm(`Are you sure you want to ${isApproved ? 'APPROVE' : 'REJECT'} this request?`)) return;
    
    try {
      const adminEmail = auth.currentUser?.email || 'Admin';
      const requestRef = doc(db, 'content_requests', request.id);
      
      const getMatchedDoc = async (g: string, s: string, c: string) => {
         const snap = await getDocs(collection(db, 'learning_tools'));
         return snap.docs.find(d => {
            const data = d.data();
            const dGrade = data.grade?.toLowerCase().trim() || '';
            const dSubj = data.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : (data.subject?.toLowerCase().trim() || '');
            const dChap = data.chapter?.toLowerCase().trim() || '';
            const fGrade = g?.toLowerCase().trim() || '';
            const fSubj = s?.toLowerCase().trim() === 'mathematics' ? 'maths' : (s?.toLowerCase().trim() || '');
            const fChap = c?.toLowerCase().trim() || '';
            return dGrade === fGrade && dSubj === fSubj && dChap === fChap;
         });
      };

      // QUICK EDIT LOGIC (Chapters & Subtopics)
      if (isApproved && request.action_type === 'EDIT') {
         const curRef = doc(db, 'learning_tools', request.target_id);
         const curSnap = await getDoc(curRef);
         if (curSnap.exists()) {
            let data = curSnap.data();
            const p = request.payload;
            if (request.target_type === 'CHAPTER') {
               data.chapter = p.newTitle;
            } else if (request.target_type === 'SUBTOPIC') {
               const sIdx = (data.subTopics || []).findIndex((s: any) => s.title === p.oldTitle);
               if (sIdx > -1) data.subTopics[sIdx].title = p.newTitle;
            }
            await setDoc(curRef, data, { merge: true });
         }
      }

      // FULL TIER EDIT LOGIC (Tools)
      if (isApproved && request.action_type === 'FULL_TIER_EDIT') {
         const p = request.payload;
         const orig = request.originalData;

         const oldDoc = await getMatchedDoc(p.grade, p.subject, orig.chapter);
         if (oldDoc) {
            let oldData = oldDoc.data();
            let oldSubTopics = oldData.subTopics || [];
            const sIdx = oldSubTopics.findIndex((s: any) => s.title?.toLowerCase().trim() === orig.subtopic.toLowerCase().trim());
            if (sIdx > -1) {
               oldSubTopics[sIdx].tools = (oldSubTopics[sIdx].tools || []).filter((t: any) => t.title !== orig.toolTitle);
               await setDoc(doc(db, 'learning_tools', oldDoc.id), { subTopics: oldSubTopics }, { merge: true });
            }
         }

         const newDoc = await getMatchedDoc(p.grade, p.subject, p.chapter);
         if (!newDoc) {
             await addDoc(collection(db, 'learning_tools'), { grade: p.grade, subject: p.subject, chapter: p.chapter, book: p.book, subTopics: [{ title: p.subtopic, tools: [p.tool] }] });
         } else {
             const existingData = newDoc.data();
             let newSubTopics = existingData.subTopics || [];
             const subIndex = newSubTopics.findIndex((s: any) => s.title?.toLowerCase().trim() === p.subtopic.toLowerCase().trim());

             if (subIndex > -1) {
                newSubTopics[subIndex].tools = (newSubTopics[subIndex].tools || []).filter((t: any) => t.title !== p.tool.title);
                const insertAt = Math.max(0, Math.min(newSubTopics[subIndex].tools.length, p.tool.orderIndex - 1));
                newSubTopics[subIndex].tools.splice(insertAt, 0, p.tool);
             } else {
                newSubTopics.push({ title: p.subtopic, tools: [p.tool] });
             }
             await setDoc(doc(db, 'learning_tools', newDoc.id), { subTopics: newSubTopics }, { merge: true });
         }
      }

      // FULL TIER ADD LOGIC
      if (isApproved && request.action_type === 'FULL_TIER_ADD') {
         const p = request.payload;
         const existingDoc = await getMatchedDoc(p.grade, p.subject, p.chapter);

         if (!existingDoc) {
            await addDoc(collection(db, 'learning_tools'), { grade: p.grade, subject: p.subject, chapter: p.chapter, book: p.book, subTopics: [{ title: p.subtopic, tools: [p.tool] }] });
         } else {
            const existingData = existingDoc.data();
            let newSubTopics = existingData.subTopics || [];
            const subIndex = newSubTopics.findIndex((s: any) => s.title?.toLowerCase().trim() === p.subtopic.toLowerCase().trim());
            
            if (subIndex > -1) {
               newSubTopics[subIndex].tools = (newSubTopics[subIndex].tools || []).filter((t: any) => t.title !== p.tool.title);
               const insertAt = Math.max(0, Math.min(newSubTopics[subIndex].tools.length, p.tool.orderIndex - 1));
               newSubTopics[subIndex].tools.splice(insertAt, 0, p.tool); 
            } else { newSubTopics.push({ title: p.subtopic, tools: [p.tool] }); }
            await setDoc(doc(db, 'learning_tools', existingDoc.id), { subTopics: newSubTopics }, { merge: true });
         }
      }

      // DELETE LOGIC
      if (isApproved && request.action_type === 'DELETE') {
         if (request.target_type === 'CHAPTER') {
            await deleteDoc(doc(db, 'learning_tools', request.target_id));
         } else {
            const targetDocSnap = await getDoc(doc(db, 'learning_tools', request.target_id));
            if (targetDocSnap.exists()) {
               let data = targetDocSnap.data();
               if (request.target_type === 'SUBTOPIC') {
                  data.subTopics = (data.subTopics || []).filter((s: any) => s.title !== request.payload.title);
               } else if (request.target_type === 'TOOL') {
                  data.subTopics = (data.subTopics || []).map((sub: any) => {
                     sub.tools = (sub.tools || []).filter((t: any) => t.title !== request.payload.title);
                     return sub;
                  });
               }
               await setDoc(doc(db, 'learning_tools', targetDocSnap.id), { subTopics: data.subTopics }, { merge: true });
            }
         }
      }

      // Record History
      const timestamp = new Date().toISOString();
      const updatedRequest = { ...request, status: actionStatus, resolved_by: adminEmail, resolved_at: timestamp };
      await setDoc(requestRef, { status: actionStatus, resolved_by: adminEmail, resolved_at: timestamp }, { merge: true });
      
      setPendingRequests((prev: any) => prev.filter((req: any) => req.id !== request.id));
      setRequestHistory((prev: any) => [updatedRequest, ...prev]);
      alert(isApproved ? `APPROVED! Database updated automatically.` : "REJECTED. Archived in History.");
    } catch (error: any) { console.error("🚨 ERROR UPDATING REQUEST:", error); }
  };

  const handleBulkCurriculumUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      setIsUploadingCSV(true);
      try {
        const text = event.target.result as string;
        
        // Split rows, handling potential empty lines at the end of the file
        const rows = text.split('\n');
        
        // We will push everything to a flat 'learning_tools' collection for maximum query power
        const toolsRef = collection(db, 'learning_tools');
        let count = 0;

        for (let i = 1; i < rows.length; i++) {
           const rowText = rows[i].trim();
           if (!rowText) continue;

           // Smart Split: Splits by comma, but IGNORES commas that are inside "quotes"
           const row = rowText.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
           
           if (row.length < 4) continue; // Skip incomplete rows
           
           // EXPECTED FORMAT: grade, subject, chapter_number, chapter_name, subtopic_order, subtopic, content_order, content_type, title, image_url, content_url, is_premium, book, is_featured
           const grade = row[0];
           const subject = row[1];
           
           // parseInt() forces Firebase to treat these as math numbers, guaranteeing 1, 2... 10 sorting!
           const chapter_number = parseInt(row[2], 10) || 1; 
           const chapter_name = row[3] || "Untitled Chapter";
           const subtopic_order = parseInt(row[4], 10) || 1;
           const subtopic = row[5] || "";
           const content_order = parseInt(row[6], 10) || 1;
           const content_type = row[7] || "Placeholder";
           const title = row[8] || chapter_name;
           const image_url = row[9] || "";
           const content_url = row[10] || "";
           const is_premium = row[11]?.toUpperCase() === 'TRUE';
           const book = row[12] || "";
           const is_featured = row[13]?.toUpperCase() === 'TRUE';
           const subtopicId = row[14] || "";
           
           if (!grade || !subject) continue; // Failsafe
           
           // Automatically assign beautiful UI colors based on the content type
           let color = 'bg-sky-500';
           if (content_type.toLowerCase() === 'game') color = 'bg-orange-500';
           else if (content_type.toLowerCase() === 'video') color = 'bg-purple-500';
           else if (content_type.toLowerCase() === 'pdf') color = 'bg-emerald-500';
           else if (content_type.toLowerCase() === 'quiz') color = 'bg-amber-500';

           const toolData = {
              grade,
              subject,
              chapter_number,
              chapter_name,
              subtopic_order,
              subtopic,
              subtopicId,
              content_order,
              content_type,
              title,
              image: image_url,
              content_url,
              isPremium: is_premium,
              book,
              is_featured,
              color,
              created_at: new Date().toISOString()
           };

           await addDoc(toolsRef, toolData);
           count++;
        }
        
        alert(`SUCCESS! Flawlessly uploaded ${count} structured lessons to the Database.`);
      } catch (err: any) { 
        console.error(err); 
        alert("Error parsing CSV. Please make sure it matches the exact 14-column format."); 
      } finally { 
        setIsUploadingCSV(false); 
        e.target.value = ''; 
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-8 pb-20">
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-b-8 border-indigo-500 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
         <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-indigo-300 transform -rotate-3">
                <Briefcase size={32} className="text-white" />
            </div>
            <div>
                <h2 className="text-3xl font-black tracking-tight">Director Dashboard</h2>
                <div className="text-indigo-300 font-bold uppercase tracking-widest text-sm mt-1 flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> Firebase Connected</div>
            </div>
         </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border-2 border-slate-100 shadow-sm w-fit">
        <button onClick={() => setActiveTab('analytics')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}><BarChart size={16} /> Traffic & Analytics</button>
        <button onClick={() => setActiveTab('approvals')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>Content Approvals {pendingRequests.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">{pendingRequests.length}</span>}</button>
        <button onClick={() => setActiveTab('database')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'database' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}><Database size={16} /> System Config</button>
      </div>

      {/* NEW: ANALYTICS TAB */}
      {activeTab === 'analytics' && (
         <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
               <div>
                  <h3 className="text-2xl font-black text-slate-800">Platform Analytics</h3>
                  <p className="text-slate-500 font-medium mt-1">Live anonymous tracking of user engagement and content popularity.</p>
               </div>
            </div>
            
            {isLoading ? (
               <div className="py-20 text-center text-indigo-500 font-bold animate-pulse">Compiling Data Engine...</div>
            ) : !analytics ? (
               <div className="py-20 text-center text-slate-500 font-bold">No data available yet. Start clicking around the site!</div>
            ) : (
               <>
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-sky-300 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><Users size={60} className="text-sky-500"/></div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Unique Devices</p>
                        <h4 className="text-4xl font-black text-slate-800">{analytics.totalVisitors}</h4>
                     </div>
                     <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><Activity size={60} className="text-purple-500"/></div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Total Page Views</p>
                        <h4 className="text-4xl font-black text-slate-800">{analytics.pageViews}</h4>
                     </div>
                     <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-lime-300 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><Play size={60} className="text-lime-500"/></div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Lessons Started</p>
                        <h4 className="text-4xl font-black text-slate-800">{analytics.totalStarts}</h4>
                     </div>
                     <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><Target size={60} className="text-amber-500"/></div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Completion Rate</p>
                        <h4 className="text-4xl font-black text-slate-800">{analytics.completionRate}%</h4>
                     </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                     
                     {/* Top Modules List */}
                     <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6 md:p-8">
                        <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Flame size={20} className="text-orange-500"/> Top Performing Modules</h4>
                        {analytics.topChapters.length === 0 ? (
                           <p className="text-slate-400 font-medium italic">No lessons have been started yet.</p>
                        ) : (
                           <div className="space-y-4">
                              {analytics.topChapters.map(([chapter, count]: any, idx: number) => (
                                 <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 font-black flex items-center justify-center shrink-0">#{idx + 1}</div>
                                       <span className="font-extrabold text-slate-700">{chapter}</span>
                                    </div>
                                    <div className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm">{count} Starts</div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>

                     {/* Conversion Snippet */}
                     <div className="bg-slate-900 text-white rounded-3xl border-4 border-indigo-900 shadow-sm p-6 md:p-8 flex flex-col justify-center">
                        <h4 className="text-xl font-black text-white mb-2 text-center">Demo Conversion</h4>
                        <p className="text-slate-400 text-sm font-medium text-center mb-8">How many users test drove the platform vs explored the real curriculum?</p>
                        
                        <div className="bg-slate-800 rounded-2xl p-6 text-center border-2 border-slate-700">
                           <div className="text-5xl font-black text-sky-400 mb-2">{analytics.demoStarts}</div>
                           <p className="text-slate-300 font-bold text-sm uppercase tracking-wider">Demo Plays</p>
                        </div>
                        <p className="text-center text-xs text-slate-500 mt-6 mt-auto">Note: High demo plays and low unique visitors means users are returning to replay the demo repeatedly.</p>
                     </div>

                  </div>
               </>
            )}
         </div>
      )}

      {/* APPROVALS TAB */}
      {activeTab === 'approvals' && (
         <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6"><div><h3 className="text-2xl font-black text-slate-800">Curriculum Approval Queue</h3><p className="text-slate-500 font-medium mt-1">Review changes submitted by your Krew members before they go live.</p></div></div>
            {isLoading ? (
               <div className="py-20 text-center text-indigo-500 font-bold animate-pulse">Loading secure database...</div>
            ) : pendingRequests.length === 0 ? (
               <div className="bg-white border-2 border-slate-100 p-16 rounded-3xl text-center shadow-sm"><div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-green-500"/></div><h3 className="text-2xl font-black text-slate-800 mb-2">All Caught Up!</h3><p className="text-slate-500 font-medium">There are no pending curriculum requests from the Krew.</p></div>
            ) : (
               <div className="space-y-4">
                  {pendingRequests.map((req: any) => {
                     const isAdd = req.action_type === 'FULL_TIER_ADD';
                     const isEdit = req.action_type === 'FULL_TIER_EDIT' || req.action_type === 'EDIT';
                     return (
                        <div key={req.id} className="bg-white border-2 border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:border-indigo-300 transition-colors">
                           <div className="flex gap-6 items-start w-full md:w-auto">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isAdd ? 'bg-green-100 text-green-600' : isEdit ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>{isAdd ? <Plus size={28} /> : isEdit ? <Edit3 size={28}/> : <Trash2 size={28} />}</div>
                              <div className="w-full">
                                 <div className="flex items-center gap-3 mb-2"><span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-100 text-slate-600`}>{req.target_type}</span><span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> {new Date(req.created_at).toLocaleDateString()}</span></div>
                                 <h4 className="text-xl font-bold text-slate-800 leading-tight mb-1">
                                    <span className={isAdd ? 'text-green-600' : isEdit ? 'text-amber-600' : 'text-red-600'}>{isEdit ? 'Edit:' : isAdd ? 'Add:' : 'Remove:'}</span> {isEdit ? (req.action_type === 'EDIT' ? `'${req.payload?.oldTitle}' → '${req.payload?.newTitle}'` : `'${req.originalData?.toolTitle}' → '${req.payload?.title}'`) : (req.payload?.title || 'Unknown Item')}
                                 </h4>
                                 <p className="text-sm font-bold text-slate-500">Requested by: <span className="text-indigo-600">{req.krew_member_email}</span></p>
                                 
                                 {(isAdd || isEdit) && req.payload?.tool?.gameCode && (
                                     <div className="mt-4 w-full bg-slate-900 rounded-xl p-4 relative border-l-4 border-amber-500">
                                        <div className="absolute top-0 right-0 bg-slate-700 text-slate-300 text-[10px] uppercase font-bold px-2 py-1 rounded-bl-xl rounded-tr-xl">Raw Code Block</div>
                                        <pre className="text-emerald-400 text-xs font-mono overflow-x-auto max-h-32 mt-2">{req.payload.tool.gameCode}</pre>
                                        <p className="text-amber-400 text-[10px] mt-2 font-bold uppercase tracking-wider">⚠️ Copy this into GameRegistry.js before approving.</p>
                                     </div>
                                 )}
                              </div>
                           </div>
                           <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t-2 border-slate-100 md:border-t-0">
                              <button onClick={() => handleRequestAction(req, 'REJECTED')} className="flex-1 md:flex-none bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"><XCircle size={18}/> Reject</button>
                              <button onClick={() => handleRequestAction(req, 'APPROVED')} className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm border-b-4 border-green-700 active:border-b-0 transition-all flex items-center justify-center gap-2"><CheckCircle size={18}/> Approve</button>
                           </div>
                        </div>
                     )
                  })}
               </div>
            )}

            {/* AUDIT LOG / HISTORY TABLE */}
            <div className="mt-12 pt-8 border-t-4 border-slate-100">
               <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><Clock size={24} className="text-slate-400"/> Audit Log & Request History</h3>
               <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b-2 border-slate-100">
                           <tr>
                              <th className="p-4 font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                              <th className="p-4 font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Requested By</th>
                              <th className="p-4 font-black text-slate-400 uppercase tracking-wider min-w-[200px]">Action</th>
                              <th className="p-4 font-black text-slate-400 uppercase tracking-wider">Status</th>
                              <th className="p-4 font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Resolved By</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {requestHistory.length === 0 ? (
                              <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No history recorded yet.</td></tr>
                           ) : (
                              requestHistory.map((req: any) => (
                                 <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-bold text-slate-500 whitespace-nowrap">{new Date(req.resolved_at || req.created_at).toLocaleString()}</td>
                                    <td className="p-4 font-medium text-slate-700">{req.krew_member_email || 'Krew'}</td>
                                    <td className="p-4">
                                       <span className="font-bold text-slate-800">{req.action_type} {req.target_type}</span>
                                       <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                                          {req.action_type === 'EDIT' ? `Renamed to: ${req.payload?.newTitle}` : req.action_type === 'FULL_TIER_EDIT' ? `Modified: ${req.payload?.title}` : (req.payload?.title || 'Data Payload')}
                                       </div>
                                    </td>
                                    <td className="p-4">
                                       <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{req.status}</span>
                                    </td>
                                    <td className="p-4 font-medium text-slate-700">{req.resolved_by || 'Admin'}</td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* DATABASE TAB */}
      {activeTab === 'database' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-white border-4 border-slate-100 p-10 rounded-3xl text-center shadow-sm relative">
               <UploadCloud size={64} className="mx-auto text-sky-500 mb-6" />
               <h3 className="text-3xl font-black text-slate-800 mb-4">Bulk Import</h3>
               <p className="text-slate-500 font-medium mb-6 text-sm">Upload a CSV to instantly publish hundreds of structured chapters and tools.<br/><span className="font-mono text-[10px] bg-slate-50 p-1 mt-2 block">Grade,Subject,Chapter,Book,Subtopic,Type,Title,URL,Premium,Order,Image</span></p>
               <div className="relative">
                 <input type="file" accept=".csv" onChange={handleBulkCurriculumUpload} disabled={isUploadingCSV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                 <Button disabled={isUploadingCSV} className="w-full py-4 text-lg border-b-4">{isUploadingCSV ? 'Processing CSV...' : 'Select CSV File'}</Button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};










// ============================================================================
// SECTION 13: THE TRAFFIC CONTROLLER (MAIN APP)
// ============================================================================

function MainApp() {
  // NEW: Global URL Reader
  const searchParams = useSearchParams();
  const sharedToolId = searchParams ? searchParams.get('tool') : null;
  const urlView = searchParams ? searchParams.get('view') : null; 

  const [currentView, _setCurrentView] = useState<string>(urlView || 'home');
  
  const setCurrentView = (view: string) => {
     if (typeof window !== 'undefined') {
         const newUrl = view === 'home' ? '/' : `/?view=${view}`;
         window.history.pushState({ type: 'view', view }, '', newUrl);
     }
     _setCurrentView(view);
  };

  const [role, _setRole] = useState<string | null>(null);
  const setRole = (newRole: string | null) => {
     if (typeof window !== 'undefined') {
         window.history.pushState({ type: 'role', role: newRole, view: currentView }, '', '');
     }
     _setRole(newRole);
  };

  const [stage, setStage] = useState<string | null>(null);
  const [lang, setLang] = useState('en');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userEmail, setUserEmail] = useState(''); 
  const [userName, setUserName] = useState(''); 

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState("Join Kortex Klassroom to unlock all features.");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  const [playingLesson, _setPlayingLesson] = useState<any>(null);
  const setPlayingLesson = (lesson: any) => {
     if (typeof window !== 'undefined' && lesson) {
         window.history.pushState({ type: 'lesson', view: currentView }, '', '');
     }
     _setPlayingLesson(lesson);
  };
  
  const [playingStep, setPlayingStep] = useState<number>(0);
  const [targetContext, setTargetContext] = useState<any>(null);


  // ==========================================================================
  // NEW: SILENT ANALYTICS ENGINE
  // ==========================================================================
  const trackEvent = async (eventType: string, eventData: any = {}) => {
    try {
      // 1. Get or Create a Silent Device ID
      let deviceId = localStorage.getItem('kortex_device_id');
      let isFirstVisit = false;

      if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('kortex_device_id', deviceId);
        isFirstVisit = true;
      }
      
      // 2. Basic non-identifying device info
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // 3. If brand new, log the acquisition event first
      if (isFirstVisit) {
        await addDoc(collection(db, 'analytics_events'), {
          device_id: deviceId, event_type: 'new_visitor', timestamp: new Date().toISOString(), is_mobile: isMobile
        });
      }

      // 4. Log the actual requested event
      await addDoc(collection(db, 'analytics_events'), {
        device_id: deviceId,
        event_type: eventType,
        payload: eventData,
        timestamp: new Date().toISOString(),
        is_mobile: isMobile
      });
    } catch (error) {
      console.warn("Analytics ping failed silently.", error); // Won't crash the app
    }
  };

  // 🎯 TRACKING: Page Views
  useEffect(() => {
    if (currentView) {
      trackEvent('page_view', { view: currentView });
    }
  }, [currentView]);

  // 🎯 TRACKING: Lesson Starts
  useEffect(() => {
    if (playingLesson) {
      trackEvent('lesson_started', { 
         chapter: playingLesson.chapter,
         book: playingLesson.book,
         total_steps: playingLesson.flow?.length || 0
      });
    }
  }, [playingLesson]);


  // FIXED: Real-time listener with STRICT token enforcement & Race Condition Fix
  useEffect(() => {
    let unsubscribeSnapshot = () => {}; 

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email); 
        
        try {
          const userDocRef = doc(db, "users", user.uid);
          
          unsubscribeSnapshot = onSnapshot(
             userDocRef, 
             (docSnap) => {
               if (docSnap.exists()) {
                  const data = docSnap.data();
                  const localToken = localStorage.getItem('kortex_session_token');
                  const isAuthenticating = sessionStorage.getItem('kortex_is_authenticating');
                  
                  if (!isAuthenticating && data.session_token && data.session_token !== localToken) {
                     unsubscribeSnapshot(); 
                     logout();              
                     setAlertConfig({ 
                        title: "Session Expired", 
                        message: "You have been securely logged out because your account was accessed from another device.",
                        type: "warning" 
                     });
                     return; 
                  }

                  setRole(data.role);
                  setIsPro(data.is_pro || data.isPro || false); 
                  setUserName(data.full_name || ''); 
               } else {
                  setUserName(user.displayName || '');
               }
             },
             (error) => { console.warn("Secure disconnect triggered."); }
          );
        } catch (error: any) { console.error("🚨 ERROR FETCHING FIRESTORE PROFILE:", error); }
      } else {
        setIsLoggedIn(false); 
        setUserEmail(''); 
        setUserName(''); 
        unsubscribeSnapshot(); 
      }
    });
    
    return () => {
       unsubscribeAuth();
       unsubscribeSnapshot();
    };
  }, []);

  // Automatically open shared links
  useEffect(() => {
    if (sharedToolId && !playingLesson) {
      const fetchSharedTool = async () => {
        try {
          const docRef = doc(db, 'learning_tools', sharedToolId);
          const docSnap = await getDoc(docRef);
          let itemData = null;

          if (docSnap.exists()) {
            itemData = { id: docSnap.id, ...docSnap.data() };
          } else {
            const q = query(collection(db, 'learning_tools'), where('subtopicId', '==', sharedToolId));
            const snap = await getDocs(q);
            if (!snap.empty) {
              itemData = { id: snap.docs[0].id, ...snap.docs[0].data() };
            }
          }

          if (itemData) {
            setPlayingLesson({
              chapter: itemData.chapter_name || itemData.chapter || itemData.title || 'Interactive Module',
              book: itemData.book || 'Kortex Klassroom',
              flow: [itemData]
            });
            setPlayingStep(0);
          }
        } catch (error) { console.error("Error fetching shared tool:", error); }
      };
      fetchSharedTool();
    }
  }, [sharedToolId]);

  // Vercel-Safe Back Button Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const startingView = urlView || 'home';
    window.history.replaceState({ type: 'init', view: startingView }, '', window.location.search || '/');

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      _setPlayingLesson(null);
      setShowAuthModal(false);

      if (state) {
        if (state.view) _setCurrentView(state.view);
        if (state.role !== undefined) _setRole(state.role);
      } else {
        _setCurrentView('home');
        _setRole(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

useEffect(() => {
    const handleNav = (e: any) => setCurrentView(e.detail);
    window.addEventListener('navigate-tab', handleNav);
    return () => window.removeEventListener('navigate-tab', handleNav);
  }, []);


  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

   const logout = async () => {
     try { 
        if (auth.currentUser) await signOut(auth); 
        localStorage.removeItem('kortex_session_token');
        setRole(null); 
        setIsPro(false); 
        setIsLoggedIn(false); 
        setStage(null); 
        setCurrentView('home'); 
     } catch (error: any) { console.error(error); }
   };

  const requireAuth = (actionCallback, message = "Please sign in to access this feature.") => {
    if (isLoggedIn) actionCallback(); else { setAuthMessage(message); setShowAuthModal(true); }
  };

 const handleStartDemo = () => {
    // 🎯 TRACKING: Demo Starts
    trackEvent('demo_started', {});

    const demoLesson = {
      id: 'master-demo-1',
      title: "Kortex Master Demo",
      chapter: "Interactive Trailer",
      subtopic: "Platform Showcase",
      book: "The 5-Tier Experience",
      flow: [
        {
          id: 'demo-step-1',
          type: 'conceptualiser',
          content_type: 'conceptualiser',
          subtopicId: 'word-builder-2',
          title: 'Visualizer: 2-Letter Words',
          subject: 'Hindi'
        },
        {
          id: 'demo-step-2',
          type: 'quiz',
          content_type: 'quiz',
          subtopicId: 'vyanjan-pa',
          title: 'Assessment: प वर्ग',
          subject: 'Hindi'
        },
        {
          id: 'demo-step-3',
          type: 'game',
          content_type: 'game',
          subtopicId: 'math-defenders',
          title: 'Arcade: Math Defenders',
          subject: 'Maths'
        },
        {
          id: 'demo-step-4',
          type: 'game',
          content_type: 'game',
          subtopicId: 'swar-a-oo',
          title: 'Gamification: Swar Pop',
          subject: 'Hindi'
        }
      ]
    };
    
    setPlayingLesson(demoLesson);
    setPlayingStep(0);
  };

  const handleOpenFeatured = (item: any) => {
      const playableLesson = {
        chapter: item.chapter_name || item.lessonContext?.chapter || item.title || 'Interactive Module',
        book: item.book || item.lessonContext?.book || 'Kortex Klassroom',
        flow: [item] 
      };
      setPlayingLesson(playableLesson);
      setPlayingStep(0);
  };

  const handleStartLesson = (lesson: any, stepIndex: any) => {
       setPlayingLesson(lesson); 
       setPlayingStep(stepIndex); 
  };

  const renderContent = () => {
    if (currentView === 'lessons') return <LessonsView isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onStartLesson={handleStartLesson} />;
    
    const activeTierObj = FIVE_TIERS?.find(t => t.id === currentView);
    if (activeTierObj) {
      return <TierLibraryView activeTier={activeTierObj} isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onOpenTool={handleOpenFeatured} />;
    }

      if (role === 'admin') return <AdminView />;
    
    return <LandingView 
      onTryDemo={handleStartDemo} 
      onNavigateToTier={(tierId: any) => setCurrentView(tierId)} 
      onNavigateToLessons={() => setCurrentView('lessons')} 
      onOpenFeatured={handleOpenFeatured}
      onLoginClick={() => setShowAuthModal(true)}
    />;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-sky-200 relative">
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {alertConfig && <GeneralAlertModal {...alertConfig} onClose={() => setAlertConfig(null)} />}
      
      {playingLesson && (
        <LessonPlayer 
          lesson={playingLesson} initialStep={playingStep} isPro={true} isLoggedIn={true} 
          onClose={() => setPlayingLesson(null)} 
          onFinish={() => {
             // 🎯 TRACKING: Lesson Completed!
             trackEvent('lesson_completed', { chapter: playingLesson.chapter });
             setPlayingLesson(null);
          }} 
        />
      )}
      
      <nav className="bg-white border-b-4 border-sky-500 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          
          {/* LEFT: Logo */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => { setCurrentView('home'); setStage(null); if (!isLoggedIn) setRole(null); }}>
            <Image src="/logo.svg" alt="Kortex Klassroom Logo" width={200} height={50} priority className="h-10 w-auto rounded-xl -rotate-3" />
            <span className="font-black text-2xl tracking-tight text-slate-800 hidden xl:block">Kortex<span className="text-sky-500"> Klassroom</span></span>
          </div>

          {/* RIGHT SIDE CONTAINER: Nav Links & Profile (Aligned Right) */}
          <div className="flex items-center gap-4 xl:gap-8 ml-auto">
            
            {/* 6 Nav Links (Hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-8 font-extrabold text-slate-500 text-xs text-center leading-tight">
               <button onClick={() => setCurrentView('lessons')} className={`py-2 px-1 transition-colors hover:text-sky-500 ${currentView === 'lessons' ? 'text-sky-500 border-b-2 border-sky-500' : ''}`}>All<br/>Lessons</button>
               <button onClick={() => setCurrentView('conceptualiser')} className={`py-2 px-1 transition-colors hover:text-purple-500 ${currentView === 'conceptualiser' ? 'text-purple-500 border-b-2 border-purple-500' : ''}`}>Interactive<br/>Sandbox</button>
               <button onClick={() => setCurrentView('theatre')} className={`py-2 px-1 transition-colors hover:text-pink-500 ${currentView === 'theatre' ? 'text-pink-500 border-b-2 border-pink-500' : ''}`}>Kortex<br/>Theatre</button>
               <button onClick={() => setCurrentView('dojo')} className={`py-2 px-1 transition-colors hover:text-orange-500 ${currentView === 'dojo' ? 'text-orange-500 border-b-2 border-orange-500' : ''}`}>The<br/>Dojo</button>
               <button onClick={() => setCurrentView('workbook')} className={`py-2 px-1 transition-colors hover:text-sky-500 ${currentView === 'workbook' ? 'text-sky-500 border-b-2 border-sky-500' : ''}`}>The<br/>Workbook</button>
               <button onClick={() => setCurrentView('arcade')} className={`py-2 px-1 transition-colors hover:text-lime-600 ${currentView === 'arcade' ? 'text-lime-600 border-b-2 border-lime-500' : ''}`}>Kortex<br/>Arcade</button>
            </div>

            {/* Profile & Mobile Menu Toggle */}
            <div className="flex items-center gap-4 shrink-0">
              {isLoggedIn && (
                 <div className="hidden sm:flex items-center gap-3 border-l-2 border-slate-100 pl-4 xl:pl-8">
                   <div className="text-right">
                     <div className="text-sm font-bold text-slate-800 leading-none">{userName || userEmail.split('@')[0]}</div>
                     <div className="text-xs font-bold text-sky-500 capitalize">{role} {isPro ? '(Pro)' : '(Free)'}</div>
                   </div>
                   <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 border-2 border-sky-200"><User size={20} /></div>
                   <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-2" title="Log Out"><LogOut size={18} /></button>
                 </div>
              )}
              <button className="lg:hidden text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}</button>
            </div>

          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
           <div className="lg:hidden bg-white border-t border-slate-100 p-4 space-y-2 absolute w-full shadow-xl font-bold text-slate-700">
              <button onClick={() => { setCurrentView('lessons'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'lessons' ? 'text-sky-500 bg-sky-50' : 'hover:bg-slate-50'}`}>All Lessons</button>
              <button onClick={() => { setCurrentView('conceptualiser'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'conceptualiser' ? 'text-purple-500 bg-purple-50' : 'hover:bg-slate-50'}`}>Interactive Sandbox</button>
              <button onClick={() => { setCurrentView('theatre'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'theatre' ? 'text-pink-500 bg-pink-50' : 'hover:bg-slate-50'}`}>Kortex Theatre</button>
              <button onClick={() => { setCurrentView('dojo'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'dojo' ? 'text-orange-500 bg-orange-50' : 'hover:bg-slate-50'}`}>The Dojo</button>
              <button onClick={() => { setCurrentView('workbook'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'workbook' ? 'text-sky-500 bg-sky-50' : 'hover:bg-slate-50'}`}>The Workbook</button>
              <button onClick={() => { setCurrentView('arcade'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'arcade' ? 'text-lime-600 bg-lime-50' : 'hover:bg-slate-50'}`}>Kortex Arcade</button>

              {isLoggedIn && <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left p-3 text-red-500 mt-2 border-t-2 border-slate-100 pt-4">Log Out</button>}
           </div>
        )}
      </nav>

        {/* THE HEADLESS CMS EDITOR PANEL */}
       {role === 'krew' && currentView !== 'home' && <KrewEditorPanel />}


      <main className={`${currentView === 'home' && !role ? '' : 'py-8 px-4'} w-full overflow-hidden`}>
        {renderContent()}
      </main>

      {currentView === 'home' && !role && (
         <footer className="bg-slate-900 text-slate-400 py-12 text-center text-sm font-medium mt-auto">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-left">
               <div><h4 className="text-white font-bold mb-4 uppercase">Content</h4><ul className="space-y-2"><li>Resources</li><li>Games</li><li>Lesson Plans</li></ul></div>
               <div><h4 className="text-white font-bold mb-4 uppercase">NEP 2020</h4><ul className="space-y-2"><li>Foundational Stage</li><li>Preparatory Stage</li><li>Middle Stage</li></ul></div>
               <div><h4 className="text-white font-bold mb-4 uppercase">Features</h4><ul className="space-y-2"><li>Competency Tracker</li><li>Lesson Management</li><li>Panchakosha Wellness</li></ul></div>
            </div>
            <p>© {new Date().getFullYear()} Kortex Klassroom. An Education Platform.</p>
         </footer>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; } .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-blob { animation: blob 7s infinite; } .animation-delay-2000 { animation-delay: 2s; } .animation-delay-4000 { animation-delay: 4s; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-33.333%); } } .animate-marquee { animation: marquee 35s linear infinite; }
        .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}




// ============================================================================
// SECTION 14: SUSPENSE WRAPPER (REQUIRED FOR URL SEARCH PARAMS)
// ============================================================================
export default function App() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900">
         <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
         <h2 className="text-white font-black text-xl tracking-widest uppercase">Loading Kortex...</h2>
      </div>
    }>
      <MainApp />
    </Suspense>
  );
}