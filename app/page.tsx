"use client";
import React, { useState, useEffect } from 'react';
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
  CreditCard, DollarSign, XCircle, AlertTriangle, Briefcase
} from 'lucide-react';

import { CONCEPT_REGISTRY } from '../components/conceptualiser/ConceptualiserRegistry';
import { GAME_REGISTRY } from '../components/games/GameRegistry';
import { QUIZ_REGISTRY } from '../components/quizzes/QuizRegistry';

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, getDocs, query, where, orderBy, deleteDoc, addDoc, limit } from "firebase/firestore";
import { AnyOfSchema } from 'firebase/ai';










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


const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : url;
};


const LessonPlayer = ({ lesson, initialStep, onClose, onFinish }: any) => {
  const playlist = lesson.flow || (lesson.subTopics ? lesson.subTopics.flatMap((sub: any) => sub.tools || []) : []);
  const [currentStep, setCurrentStep] = useState(initialStep || 0);
  const currentItem = playlist[currentStep];

  if (!currentItem) {
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

  const handleNext = () => { if (isLastStep) onFinish(); else setCurrentStep((prev: any) => prev + 1); };
  const handlePrev = () => { if (currentStep > 0) setCurrentStep((prev: any) => prev - 1); };

  const renderContent = () => {
    // 100% Frictionless: Premium checks removed. Everything plays!
    switch (currentItem.content_type?.toLowerCase() || currentItem.type?.toLowerCase()) {
      case 'video':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black">
            {currentItem.content_url ? (
              <iframe 
                className="w-full h-full max-w-5xl max-h-[70vh] rounded-2xl shadow-2xl border-4 border-slate-800" 
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
        const CustomGameComponent = GAME_REGISTRY[currentItem.content_url as keyof typeof GAME_REGISTRY];
        if (CustomGameComponent) {
           return <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-3xl overflow-y-auto border-4 border-slate-800 shadow-2xl animate-fade-in"><CustomGameComponent onComplete={handleNext} /></div>;
        }
        return <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border-4 border-dashed border-slate-800 rounded-3xl p-8 text-center max-w-3xl mx-auto"><h2 className="text-4xl font-black text-white mb-4">{currentItem.title}</h2><p className="text-slate-500">Game module under construction.</p></div>;

      case 'quiz':
        const CustomQuizComponent = QUIZ_REGISTRY[currentItem.content_url as keyof typeof QUIZ_REGISTRY];
        if (CustomQuizComponent) {
           return <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded-3xl overflow-y-auto border-4 border-slate-200 shadow-2xl animate-fade-in"><CustomQuizComponent onComplete={handleNext} /></div>;
        }
        return <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-3xl p-8 border-4 border-dashed border-purple-200 text-center"><h2 className="text-4xl font-black text-slate-800 mb-4">{currentItem.title}</h2><p className="text-slate-500">Quiz module under construction.</p></div>;

      case 'conceptualiser':
        const CustomConceptComponent = CONCEPT_REGISTRY[currentItem.content_url as keyof typeof CONCEPT_REGISTRY];
        if (CustomConceptComponent) {
           return <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50 rounded-3xl overflow-hidden border-4 border-purple-200 shadow-2xl animate-fade-in"><CustomConceptComponent onComplete={handleNext} /></div>;
        }
        return <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-3xl p-8 border-4 border-dashed border-purple-200 text-center"><h2 className="text-4xl font-black text-slate-800 mb-4">{currentItem.title}</h2><p className="text-slate-500 font-bold">Interactive concept module coming soon.</p></div>;

      case 'presentation':
      case 'ppt':
      case 'pdf':
        let docUrl = currentItem.content_url || '';
        if (docUrl.includes('canva.com') && !docUrl.includes('embed')) {
            docUrl = docUrl.split('?')[0].replace(/\/view.*$/, '') + '/view?embed';
        }
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-2xl overflow-hidden text-slate-800 relative shadow-2xl">
             {docUrl && (
               <div className="absolute top-0 left-0 right-0 bg-white p-4 border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
                 <div className="flex items-center gap-3 font-extrabold text-slate-700"><FileText className="text-rose-500" size={20} />{currentItem.title}</div>
                 <Button variant="secondary" className="py-2 px-4 text-sm border-2 border-slate-200 shadow-sm hover:border-sky-500 hover:text-sky-600" onClick={() => window.open(docUrl, '_blank')}>Open Document</Button>
               </div>
             )}
             {docUrl ? <iframe className="w-full h-full bg-white pt-[72px]" src={docUrl} allowFullScreen></iframe> : <div className="flex flex-col items-center p-8 text-center bg-white w-full h-full justify-center">Document Ready</div>}
          </div>
        );

      default: 
        return <div className="flex items-center justify-center h-full text-slate-400 font-medium"><Activity className="animate-spin mr-3" size={24} /> Loading...</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in font-sans">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"><X size={20} /></button>
          <div className="hidden sm:block">
             <h1 className="text-white font-extrabold text-lg">{currentItem.title}</h1>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{lesson.chapter}{lesson.subtopic ? ` • ${lesson.subtopic}` : ''}</p>
          </div>
        </div>
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="flex justify-between items-end mb-1.5"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Module Progress</span><span className="text-xs font-black text-sky-400">{currentStep + 1} / {playlist.length}</span></div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div></div>
        </div>
        <div className="bg-slate-800 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 border border-slate-700">{currentItem.type?.toUpperCase()}</div>
      </div>
      <div className="flex-1 min-h-0 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black p-2 md:p-8 flex items-center justify-center">
         {renderContent()}
      </div>
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 relative z-10">
        <button onClick={handlePrev} disabled={currentStep === 0} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${currentStep === 0 ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-slate-300 hover:text-white border-2 border-slate-700'}`}><ChevronLeft size={20} /> Previous</button>
        <button onClick={handleNext} className={`px-8 py-3 rounded-xl font-black flex items-center gap-2 transition-all border-b-4 active:border-b-0 active:translate-y-1 ${isLastStep ? 'bg-lime-500 text-slate-900 border-lime-700' : 'bg-sky-500 text-white border-sky-700'}`}>
          {isLastStep ? (<>Complete Lesson <CheckCircle size={20} /></>) : (<>Next Step <ChevronRight size={20} /></>)}
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
                     <p className={`text-xs font-black ${activeTier.textColor} uppercase tracking-wider line-clamp-1`}>{item.lessonContext?.chapter || item.subject || 'Resource'}</p>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mb-4 leading-tight line-clamp-2 group-hover:text-slate-900">{item.title}</h3>
                  
                  <div className="mt-auto pt-5 flex justify-between items-center border-t-2 border-slate-50">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">{item.grade}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-full ${activeTier.lightColor} flex items-center justify-center group-hover:${activeTier.mainColor} transition-colors duration-300 shadow-sm`}>
                      <Play size={18} className={`${activeTier.textColor} group-hover:text-white ml-1`} />
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
// SECTION 9: STUDENT VIEW (DATA DRIVEN SPACE DASHBOARD)
// ============================================================================

const StudentView = ({ t, onStartLesson, currentStudent, isLoggedIn, requireAuth }: any) => {
  const [myWorlds, setMyWorlds] = useState([]);
  const [stars, setStars] = useState(0);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [firstAvailableModule, setFirstAvailableModule] = useState(null);

  useEffect(() => {
    async function loadStudentData() {
       if (!isLoggedIn || !currentStudent) {
          setMyWorlds([{ id: 1, grade: 'Grade 2', subject: 'English', progress: 0, color: 'bg-rose-500', lightColor: 'bg-rose-100', icon: Book }, { id: 2, grade: 'Grade 2', subject: 'Maths', progress: 0, color: 'bg-sky-500', lightColor: 'bg-sky-100', icon: Brain }]);
          setIsLoadingDb(false); return;
       }
       try {
         const studentDocRef = doc(db, 'managed_students', currentStudent.id);
         const studentSnapshot = await getDoc(studentDocRef);
         let studentGrade = currentStudent.grade;
         if (studentSnapshot.exists()) {
            const data = studentSnapshot.data();
            setStars(data.stars_earned || 0); studentGrade = data.grade || studentGrade;
         }
         if (studentGrade) {
            const q = query(collection(db, 'learning_tools'), where('grade', '==', studentGrade));
            const snap = await getDocs(q);
            const modules = snap.docs.map((d: any) => d.data());
            if (modules.length > 0) {
               setFirstAvailableModule(modules[0]);
               const uniqueSubjects = [...new Set(modules.map((m: any) => m.subject))];
               const formattedWorlds = uniqueSubjects.map((sub: any, idx: any) => {
                  const isMath = sub.toLowerCase().includes('math');
                  return { id: idx, grade: studentGrade, subject: sub, progress: 0, color: isMath ? 'bg-sky-500' : 'bg-rose-500', lightColor: isMath ? 'bg-sky-100' : 'bg-rose-100', icon: isMath ? Brain : Book };
               });
               setMyWorlds(formattedWorlds);
            } else setMyWorlds([]); 
         }
       } catch (error: any) { console.error(error); setMyWorlds([]); } finally { setIsLoadingDb(false); }
    }
    loadStudentData();
  }, [isLoggedIn, currentStudent]);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20 relative">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border-2 border-slate-100 mb-8">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full border-4 border-white shadow-md flex items-center justify-center text-2xl relative">
               {isLoggedIn ? '👦' : '🦁'}
               {!isLoggedIn && <div className="absolute -bottom-2 -right-2 bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border-2 border-white shadow-sm">Guest</div>}
            </div>
            <div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hi, {isLoggedIn && currentStudent ? currentStudent.name.split(' ')[0] : 'Explorer'}!</h2>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isLoggedIn && currentStudent ? `${currentStudent.grade} Student` : 'New Player'}</p>
            </div>
         </div>
         <div className="flex items-center gap-2 bg-amber-100 px-5 py-2.5 rounded-2xl border-2 border-amber-200 shadow-inner">
            <Star size={24} className="fill-amber-500 text-amber-500 animate-pulse" />
            <span className="text-2xl font-black text-amber-600">{stars}</span>
         </div>
      </div>

      <div className="bg-gradient-to-r from-sky-400 to-blue-600 rounded-[2rem] p-8 text-white shadow-[0_10px_40px_-10px_rgba(56,189,248,0.5)] mb-10 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform" 
        onClick={() => {
           if (!isLoggedIn) requireAuth(() => {}, "Log in with your Secret PIN to play games!");
           else if (firstAvailableModule) onStartLesson(firstAvailableModule, 0);
           else alert("Your teacher hasn't assigned any lessons yet!");
        }}
      >
         <div className="absolute -right-10 -top-10 opacity-20 group-hover:rotate-12 transition-transform duration-500"><Rocket size={250} /></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <span className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest mb-4 inline-block shadow-sm">{isLoggedIn ? 'Next Quest' : 'Try a Demo'}</span>
               <h3 className="text-4xl md:text-5xl font-black mb-2 leading-tight">{firstAvailableModule ? firstAvailableModule.chapter : "Awaiting Missions!"}</h3>
               <p className="font-bold text-blue-100 text-lg">{firstAvailableModule ? `${firstAvailableModule.grade} • ${firstAvailableModule.subject}` : "Check back soon"}</p>
            </div>
            <button className="bg-white text-blue-600 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform shrink-0"><Play size={40} className="ml-2 fill-blue-600" /></button>
         </div>
      </div>

      <div className="mb-12 relative">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Gamepad2 className="text-sky-500"/> My Learning Worlds</h3>
         </div>
         {!isLoggedIn && (
            <div className="absolute inset-0 top-12 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-3xl border-2 border-slate-100">
               <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm border-2 border-slate-100">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32} className="text-purple-500" /></div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Worlds Locked!</h3>
                  <p className="text-slate-500 font-medium mb-6">Ask your parents to set up your profile, then log in with your secret PIN to unlock your worlds.</p>
                  <Button className="w-full py-3 bg-purple-500" onClick={() => requireAuth(() => {}, "Enter your PIN to play!")}>Log In to Play</Button>
               </div>
            </div>
         )}
         {isLoadingDb ? (
            <div className="py-12 text-center text-sky-500 animate-pulse font-bold">Loading your worlds...</div>
         ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${!isLoggedIn ? 'opacity-40 select-none pointer-events-none' : ''}`}>
               {myWorlds.length > 0 ? myWorlds.map((world: any) => {
                  const Icon = world.icon || Rocket;
                  return (
                    <div key={world.id} className="bg-white rounded-3xl p-6 border-4 border-slate-100 shadow-sm hover:border-sky-300 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden mt-4">
                       <div className={`absolute top-0 left-0 w-full h-2 ${world.color}`}></div>
                       <div className="flex items-start justify-between mb-8 mt-2">
                          <div className={`w-16 h-16 rounded-2xl ${world.lightColor} text-white flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}><Icon size={32} className={`text-slate-800 ${world.color.replace('bg-', 'text-')}`} /></div>
                          <span className="bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">{world.grade}</span>
                       </div>
                       <h4 className="text-2xl font-black text-slate-800 mb-4">{world.subject}</h4>
                       <div className="space-y-2">
                          <div className="flex justify-between text-sm font-bold text-slate-500"><span>Progress</span><span className={world.color.replace('bg-', 'text-')}>{world.progress}%</span></div>
                          <div className="w-full bg-slate-100 rounded-full h-4 shadow-inner overflow-hidden border border-slate-200"><div className={`${world.color} h-full rounded-full relative`} style={{width: `${world.progress}%`}}><div className="absolute inset-0 bg-white/20 w-full h-1/2 rounded-t-full"></div></div></div>
                       </div>
                    </div>
                  )
               }) : (
                  <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Rocket size={24} className="text-slate-400" /></div>
                     <h3 className="text-xl font-bold text-slate-700 mb-2">No Worlds Found</h3>
                     <p className="text-slate-500 font-medium">There are no subjects available for {currentStudent?.grade} yet!</p>
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};










// ============================================================================
// SECTION 10: PARENT VIEW (FAMILY HUB & ANALYTICS)
// ============================================================================

const ParentView = ({ t, isLoggedIn, requireAuth, onStartDemo, isPro }: any) => {
  const [myChildren, setMyChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('DEMO');
  const [activeTab, setActiveTab] = useState('progress');
  const [parentId, setParentId] = useState(null);
  
  // --- APAAR STUDENT MANAGEMENT STATES ---
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [parentModalTab, setParentModalTab] = useState('create'); // 'create' or 'import'
  const [step, setStep] = useState(1); 
  const [isSaving, setIsSaving] = useState(false);
  const [foundStudent, setFoundStudent] = useState(null);

  const [childForm, setChildForm] = useState({ 
     apaarId: '', fullName: '', grade: '', dob: '', fathersName: '', mothersName: '', 
     contact1: '', isWhatsapp1: true, contact2: '', creatorRelation: 'Father', creatorName: '', username: '', pin: '' 
  });
  const [importForm, setImportForm] = useState({ apaarId: '', dob: '', username: '', pin: '' });

  useEffect(() => {
    async function fetchChildren() {
      if (!isLoggedIn) return;
      try {
        const user = auth.currentUser;
        if (user) {
          setParentId(user.uid);
          const q = query(collection(db, 'managed_students'), where('parent_id', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const childrenData = querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          setMyChildren(childrenData);
          if (childrenData.length > 0 && selectedChildId === 'DEMO') {
             setSelectedChildId(childrenData[0].id);
          }
        }
      } catch (e: any) { console.error("🚨 FIREBASE PARENT FETCH ERROR:", e); }
    }
    fetchChildren();
  }, [isLoggedIn, selectedChildId]);

  const calculateAge = (dobString: any) => {
     if (!dobString) return '--';
     const birthDate = new Date(dobString);
     const today = new Date();
     let years = today.getFullYear() - birthDate.getFullYear();
     let months = today.getMonth() - birthDate.getMonth();
     let days = today.getDate() - birthDate.getDate();
     if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
     if (months < 0) { years--; months += 12; }
     return `${years} Y, ${months} M, ${days} D`;
  };

  // --- FLOW 1: CREATE NEW PROFILE ---
  const handleCreateChild = async () => {
    const f = childForm;
    if (!f.fullName || !f.username || !f.pin || !f.apaarId || !f.dob || !f.contact1 || !f.grade) return alert("Please fill in all mandatory fields!");
    if (!/^\d{6}$/.test(f.pin)) return alert("The login PIN must be exactly 6 numerical digits.");
    if (!/^\d{12}$/.test(f.apaarId)) return alert("APAAR ID must be exactly 12 numerical digits.");

    setIsSaving(true);
    try {
      const cleanUsername = f.username.toLowerCase().trim();
      const studentsRef = collection(db, 'managed_students');
      
      // Check Username uniqueness
      const usernameCheckQuery = query(studentsRef, where("username", "==", cleanUsername));
      const usernameCheckSnapshot = await getDocs(usernameCheckQuery);
      if (!usernameCheckSnapshot.empty) { alert("That Username is already taken! Please choose another one."); setIsSaving(false); return; }

      // Check APAAR uniqueness
      const apaarCheckQuery = query(studentsRef, where("apaar_id", "==", f.apaarId));
      const apaarCheckSnapshot = await getDocs(apaarCheckQuery);
      if (!apaarCheckSnapshot.empty) { alert("This APAAR ID is already in the system! Please use the 'Import & Claim' tab."); setIsSaving(false); return; }

      const newChildData = {
        parent_id: parentId, manager_id: parentId, name: f.fullName, grade: f.grade, apaar_id: f.apaarId, dob: f.dob, 
        fathers_name: f.fathersName, mothers_name: f.mothersName, contact1: f.contact1, is_whatsapp1: f.isWhatsapp1, contact2: f.contact2,
        creator_relation: f.creatorRelation, creator_name: f.creatorRelation === 'Guardian' ? f.creatorName : '', 
        username: cleanUsername, pin: f.pin, stars_earned: 0, status: 'On Track', created_at: new Date().toISOString()
      };
      
      const docRef = await addDoc(studentsRef, newChildData);
      setMyChildren([...myChildren, { id: docRef.id, ...newChildData }]);
      setSelectedChildId(docRef.id);
      
      setShowAddChildModal(false); setStep(1);
      setChildForm({ apaarId: '', fullName: '', grade: '', dob: '', fathersName: '', mothersName: '', contact1: '', isWhatsapp1: true, contact2: '', creatorRelation: 'Father', creatorName: '', username: '', pin: '' });
      alert("Child Profile Created! They can now log in directly using their Username and PIN.");
    } catch (error: any) { console.error(error); alert("An error occurred. Please try again."); } finally { setIsSaving(false); }
  };

  // --- FLOW 2: IMPORT & CLAIM ---
  const handleVerifyImport = async () => {
     if (!/^\d{12}$/.test(importForm.apaarId)) return alert("APAAR ID must be exactly 12 numeric digits.");
     if (!importForm.dob) return alert("Please enter the Date of Birth to verify.");
     
     setIsSaving(true);
     try {
        const q = query(collection(db, 'managed_students'), where('apaar_id', '==', importForm.apaarId), where('dob', '==', importForm.dob));
        const snap = await getDocs(q);
        
        if (snap.empty) { setIsSaving(false); return alert("No matching student found. Please check the APAAR ID and DOB, or create a new profile."); }
        
        const studentDoc = snap.docs[0];
        const studentData = studentDoc.data();
        
        if (studentData.parent_id) { setIsSaving(false); return alert("This student profile has already been claimed by a parent account."); }
        
        setFoundStudent({ id: studentDoc.id, ...studentData });
        setStep(2);
     } catch (error: any) { console.error(error); alert("Error verifying student."); } finally { setIsSaving(false); }
  };

  const handleClaimChild = async () => {
     const f = importForm;
     if (!f.username || !f.pin) return alert("Please create a Username and PIN.");
     if (!/^\d{6}$/.test(f.pin)) return alert("The login PIN must be exactly 6 numerical digits.");
     
     setIsSaving(true);
     try {
        const cleanUsername = f.username.toLowerCase().trim();
        const usernameCheckQuery = query(collection(db, 'managed_students'), where("username", "==", cleanUsername));
        const usernameCheckSnapshot = await getDocs(usernameCheckQuery);
        if (!usernameCheckSnapshot.empty) { alert("That Username is already taken! Please choose another one."); setIsSaving(false); return; }

        await setDoc(doc(db, 'managed_students', foundStudent.id), { parent_id: parentId, manager_id: parentId, username: cleanUsername, pin: f.pin }, { merge: true });
        
        const completeStudent = { ...foundStudent, parent_id: parentId, username: cleanUsername, pin: f.pin };
        setMyChildren([...myChildren, completeStudent]);
        setSelectedChildId(foundStudent.id);
        
        setShowAddChildModal(false); setStep(1); setFoundStudent(null);
        setImportForm({ apaarId: '', dob: '', username: '', pin: '' });
        alert(`Successfully claimed ${foundStudent.name}'s profile! They can now log in.`);
     } catch (error: any) { console.error(error); alert("Error claiming student."); } finally { setIsSaving(false); }
  };

  const activeChild = myChildren.find((c: any) => c.id === selectedChildId)

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-purple-50 p-6 rounded-3xl border-2 border-purple-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-purple-200 shadow-sm relative"><Users size={32} className="text-purple-600" />{!isLoggedIn && <div className="absolute -bottom-2 -right-2 bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border-2 border-white shadow-sm">Guest</div>}</div>
          <div><h2 className="text-3xl font-extrabold text-slate-900">Family Hub</h2><p className="text-slate-600 font-medium">Track progress and manage child profiles</p></div>
        </div>
        <div className="flex gap-3"><Button variant="secondary" onClick={onStartDemo} className="border-2 shadow-sm font-bold px-6"><PlayCircle size={18} className="mr-2 inline" /> Try Demo Lesson</Button></div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-full border-2 border-slate-100 shadow-sm w-fit mx-auto md:mx-0">
        <button onClick={() => setActiveTab('progress')} className={`px-6 py-3 rounded-full font-bold text-sm transition-colors ${activeTab === 'progress' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>Child Progress</button>
        <button onClick={() => setActiveTab('manage')} className={`px-6 py-3 rounded-full font-bold text-sm transition-colors ${activeTab === 'manage' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>Manage Profiles & Billing</button>
      </div>

      {activeTab === 'progress' && (
        <div className="space-y-6 animate-fade-in">
           <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border-2 border-slate-100 shadow-sm w-fit">
              <span className="font-bold text-slate-500 text-sm uppercase px-3 tracking-wider">Viewing:</span>
              {myChildren.length === 0 ? (
                 <button className="px-5 py-2 rounded-xl font-bold text-sm bg-purple-500 text-white border-2 border-purple-500 shadow-md flex items-center gap-2"><Star size={16} className="fill-white"/> Demo Profile</button>
              ) : (
                 myChildren.map((child: any) => (<button key={child.id} onClick={() => setSelectedChildId(child.id)} className={`px-5 py-2 rounded-xl font-bold text-sm transition-all border-2 ${selectedChildId === child.id ? 'bg-purple-500 text-white border-purple-500 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}>{child.name}</button>))
              )}
           </div>

           {myChildren.length === 0 ? (
              <div className="space-y-8">
                 <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="absolute -right-10 -top-10 opacity-20"><Sparkles size={200} /></div>
                    <div className="relative z-10"><span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3 inline-block shadow-sm">Free Trial</span><h3 className="text-3xl font-black mb-2">Start your 15-Day Free Trial!</h3><p className="font-medium text-amber-50 max-w-lg">Create your first child profile for free. They get instant access to the gamified Student Dashboard, and you get real-time analytics below.</p></div>
                    {/* RESTORED: Custom Orange CTA Button */}
                    <Button variant="secondary" onClick={() => requireAuth(() => setShowAddChildModal(true), "Create a free parent account to add your child and start your trial!")} className="bg-white !text-orange-600 border-none hover:bg-orange-50 shadow-lg px-8 py-4 text-lg w-full md:w-auto relative z-10">Add Free Child Profile</Button>
                 </div>
                 <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 bg-slate-800 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-bl-xl z-10 shadow-md flex items-center gap-2"><Shield size={12}/> Example Report</div>
                    <div className="p-8 border-b-2 border-slate-50 bg-slate-50 flex items-center gap-4">
                       <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center shadow-inner"><span className="text-2xl font-black text-lime-600">A</span></div>
                       <div><h3 className="text-2xl font-black text-slate-800">Aarav Sharma</h3><p className="text-sm font-bold text-slate-400">Grade 2 • Last Active: 2 hours ago</p></div>
                    </div>
                    <div className="p-8 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-5 rounded-2xl border-2 border-slate-100 bg-white shadow-sm flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><Star size={24} className="fill-purple-600"/></div><div><div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stars Earned</div><div className="text-2xl font-black text-slate-800">142</div></div></div>
                          <div className="p-5 rounded-2xl border-2 border-slate-100 bg-white shadow-sm flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600"><CheckCircle size={24} /></div><div><div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Accuracy</div><div className="text-2xl font-black text-slate-800">88%</div></div></div>
                          <div className="p-5 rounded-2xl border-2 border-slate-100 bg-white shadow-sm flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><Clock size={24} /></div><div><div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Screen Time (Week)</div><div className="text-2xl font-black text-slate-800">2h 15m</div></div></div>
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><LineChart size={20}/> Subject Mastery</h4>
                          <div className="space-y-4">
                             <div><div className="flex justify-between text-sm font-bold mb-1"><span className="text-slate-700">Hindi (Vyanjan)</span><span className="text-lime-600">92%</span></div><div className="w-full bg-slate-100 rounded-full h-3"><div className="bg-lime-500 h-3 rounded-full" style={{width: '92%'}}></div></div></div>
                             <div>
                                <div className="flex justify-between text-sm font-bold mb-1"><span className="text-slate-700">Maths (Place Value)</span><span className="text-amber-500">65%</span></div>
                                <div className="w-full bg-slate-100 rounded-full h-3"><div className="bg-amber-400 h-3 rounded-full" style={{width: '65%'}}></div></div>
                                <p className="text-xs text-slate-500 font-medium mt-1">AI Suggestion: Aarav is struggling with Hundreds. We recommend playing the 'Place Value Ninja' game.</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden text-center py-20 relative">
                 {!isPro && (<div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1"><Lock size={12}/> Free Tier</div>)}
                 <LineChart size={48} className="mx-auto mb-4 text-slate-300" />
                 <h3 className="text-2xl font-black text-slate-800 mb-2">Awaiting Learning Data</h3>
                 <p className="text-slate-500 font-medium max-w-md mx-auto mb-6">Once {activeChild?.name} logs into their Student Dashboard and completes a lesson, their real-time progress will appear here.</p>
                 <div className="bg-slate-50 border-2 border-slate-200 inline-block px-6 py-4 rounded-2xl text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Direct Login Details</p>
                    <p className="font-bold text-slate-700 mb-1">Username: <span className="font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{activeChild?.username || 'Not set'}</span></p>
                    <p className="font-bold text-slate-700">PIN Code: <span className="font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{activeChild?.pin || 'Not set'}</span></p>
                 </div>
              </div>
           )}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-8 animate-fade-in">
           <div className="bg-slate-800 rounded-3xl p-8 text-white shadow-xl">
              <h3 className="text-2xl font-black mb-2 flex items-center gap-2"><CreditCard className="text-sky-400"/> Subscription Plans</h3>
              <p className="text-slate-400 font-medium mb-6">Unlock Pro tools and premium analytics for your family.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* RESTORED: Custom Subscription Card Styling */}
                 <div className="bg-slate-700 border-2 border-slate-600 rounded-2xl p-6 text-center">
                    <div className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">1 Child</div>
                    <div className="text-4xl font-black text-white mb-4">₹100<span className="text-lg text-slate-400 font-medium">/mo</span></div>
                    <Button variant="secondary" onClick={() => requireAuth(() => alert("Billing portal opening soon!"), "Log in to subscribe.")} className="w-full !bg-slate-600 !text-white !border-0 hover:!bg-slate-500 shadow-none">Select Plan</Button>
                 </div>
                 
                 <div className="bg-gradient-to-b from-purple-500 to-purple-700 border-2 border-purple-400 rounded-2xl p-6 text-center relative transform md:-translate-y-4 shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-900 text-[10px] font-black uppercase px-3 py-1 rounded-full">Most Popular</div>
                    <div className="text-sm font-bold text-purple-200 uppercase tracking-wider mb-2">2 Children</div>
                    <div className="text-4xl font-black text-white mb-4">₹150<span className="text-lg text-purple-200 font-medium">/mo</span></div>
                    <Button variant="secondary" onClick={() => requireAuth(() => alert("Billing portal opening soon!"), "Log in to subscribe.")} className="w-full !bg-white !text-purple-600 !border-0 hover:!bg-slate-50 shadow-md">Select Plan</Button>
                 </div>
                 
                 <div className="bg-slate-700 border-2 border-slate-600 rounded-2xl p-6 text-center">
                    <div className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">3 Children (Max)</div>
                    <div className="text-4xl font-black text-white mb-4">₹200<span className="text-lg text-slate-400 font-medium">/mo</span></div>
                    <Button variant="secondary" onClick={() => requireAuth(() => alert("Billing portal opening soon!"), "Log in to subscribe.")} className="w-full !bg-slate-600 !text-white !border-0 hover:!bg-slate-500 shadow-none">Select Plan</Button>
                 </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-slate-800 text-xl">Registered Profiles ({myChildren.length}/3)</h3>
                 <Button onClick={() => requireAuth(() => setShowAddChildModal(true), "Sign up to add child profiles to your account!")} disabled={myChildren.length >= 3} className={`px-4 py-2 text-sm shadow-sm ${myChildren.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}><UserPlus size={16} className="mr-2 inline"/> Add Child</Button>
              </div>
              {myChildren.length === 0 ? (
                 <div className="text-center py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl"><p className="text-slate-500 font-medium mb-3">No children registered yet.</p></div>
              ) : (
                 <div className="space-y-3">
                    {myChildren.map((child: any) => (
                       <div key={child.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl gap-4">
                          <div><span className="font-black text-slate-800 text-lg block">{child.name}</span><span className="text-xs font-bold text-slate-500">{child.grade} • APAAR: {child.apaar_id || child.aadhar_number}</span></div>
                          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                             {/* RESTORED: Username and PIN Display side-by-side */}
                             <div className="text-xs"><span className="font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">Username</span><span className="font-mono font-bold text-purple-600">{child.username}</span></div>
                             <div className="text-xs border-l border-slate-100 pl-4"><span className="font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">PIN</span><span className="font-mono font-bold text-purple-600">{child.pin}</span></div>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>
      )}

      {/* DUAL-TAB ADD CHILD MODAL */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative border-4 border-slate-100 my-auto">
            <button onClick={() => {setShowAddChildModal(false); setStep(1); setFoundStudent(null);}} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"><X size={20} /></button>
            <div className="flex items-center gap-4 mb-6">
               <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center"><Users size={28} className="text-purple-600"/></div>
               <div><h2 className="text-2xl font-black text-slate-800">Add Child Profile</h2><p className="text-slate-500 text-sm font-bold">Connect their academic record or create a new one.</p></div>
            </div>

            {/* TAB TOGGLE */}
            {step === 1 && (
               <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-full mb-6">
                  <button onClick={() => {setParentModalTab('create'); setStep(1);}} className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase transition-all ${parentModalTab === 'create' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>Create New Profile</button>
                  <button onClick={() => {setParentModalTab('import'); setStep(1);}} className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase transition-all ${parentModalTab === 'import' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>Import & Claim</button>
               </div>
            )}

            {/* TAB 1: CREATE NEW */}
            {parentModalTab === 'create' && step === 1 && (
               <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="md:col-span-2"><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">12-Digit APAAR ID *</label><input type="text" maxLength={12} placeholder="e.g. 123456789012" value={childForm.apaarId} onChange={(e: any) => setChildForm({...childForm, apaarId: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-700 outline-none focus:border-purple-500 tracking-[0.2em]" /></div>
                     <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Child's Full Name *</label><input type="text" value={childForm.fullName} onChange={(e: any) => setChildForm({...childForm, fullName: e.target.value})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-purple-500" /></div>
                     <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Grade *</label><select value={childForm.grade} onChange={(e: any) => setChildForm({...childForm, grade: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-purple-500"><option value="" disabled>Select Grade...</option>{GRADES.map((g: any) => <option key={g} value={g}>{g}</option>)}</select></div>
                     <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Date of Birth *</label><input type="date" value={childForm.dob} onChange={(e: any) => setChildForm({...childForm, dob: e.target.value})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-purple-500" /><div className="text-[10px] font-black text-purple-600 text-right mt-1">Calculated Age: {calculateAge(childForm.dob)}</div></div>
                     <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Father's Name *</label><input type="text" value={childForm.fathersName} onChange={(e: any) => setChildForm({...childForm, fathersName: e.target.value})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-purple-500" /></div>
                     <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Mother's Name *</label><input type="text" value={childForm.mothersName} onChange={(e: any) => setChildForm({...childForm, mothersName: e.target.value})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-purple-500" /></div>
                     <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Contact 1 (Compulsory) *</label><input type="text" maxLength={10} value={childForm.contact1} onChange={(e: any) => setChildForm({...childForm, contact1: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-purple-500" /><div className="flex items-center gap-2 mt-2"><input type="checkbox" checked={childForm.isWhatsapp1} onChange={(e: any) => setChildForm({...childForm, isWhatsapp1: e.target.checked})} className="accent-green-500 cursor-pointer" /><label className="text-[10px] font-bold text-slate-500 cursor-pointer">✅ WhatsApp Number</label></div></div>
                     <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Contact 2 (Optional)</label><input type="text" maxLength={10} value={childForm.contact2} onChange={(e: any) => setChildForm({...childForm, contact2: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-purple-500" /></div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
                     <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">My Relationship to Child</label>
                     <select value={childForm.creatorRelation} onChange={(e: any) => setChildForm({...childForm, creatorRelation: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-purple-500 mb-3"><option value="Father">I am the Father</option><option value="Mother">I am the Mother</option><option value="Guardian">I am a Guardian/Other</option></select>
                     {childForm.creatorRelation === 'Guardian' && (<input type="text" placeholder="Your Full Name" value={childForm.creatorName} onChange={(e: any) => setChildForm({...childForm, creatorName: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-purple-500" />)}
                  </div>
                  <Button onClick={() => setStep(2)} disabled={!childForm.fullName || !childForm.grade || !childForm.apaarId || !childForm.contact1 || childForm.apaarId.length !== 12} className="w-full py-4 mt-4 bg-purple-600 hover:bg-purple-700 border-purple-800 border-b-4 text-lg">Next Step: Setup Login <ArrowRight size={18} className="ml-2 inline"/></Button>
               </div>
            )}

            {/* TAB 1 CREATE: STEP 2 (LOGIN SETUP) */}
            {parentModalTab === 'create' && step === 2 && (
               <div className="space-y-6">
                  <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-100 flex gap-3"><Shield className="text-amber-500 shrink-0" size={24}/><p className="text-sm font-medium text-amber-800">Create a fun Username and a simple 6-digit PIN. Your child will use these to log into Kortex Klassroom directly on their own device!</p></div>
                  <div><label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Create Unique Username *</label><input type="text" placeholder="e.g. aaravninja24" value={childForm.username} onChange={(e: any) => setChildForm({...childForm, username: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-purple-600 outline-none focus:border-purple-500 lowercase" /></div>
                  <div><label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Create 6-Digit Secret PIN *</label><input type="text" placeholder="1 2 3 4 5 6" maxLength={6} value={childForm.pin} onChange={(e: any) => setChildForm({...childForm, pin: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-mono text-2xl tracking-[1em] text-center font-black text-slate-800 outline-none focus:border-purple-500" /></div>
                  <div className="flex gap-3 pt-4 border-t-2 border-slate-100"><Button variant="secondary" onClick={() => setStep(1)} className="flex-1 py-4 border-2 shadow-none text-lg">Back</Button><Button onClick={handleCreateChild} disabled={isSaving || childForm.pin.length !== 6 || !childForm.username} className="flex-[2] py-4 bg-lime-500 hover:bg-lime-600 border-lime-700 text-white border-b-4 text-lg">{isSaving ? 'Saving...' : 'Complete Registration'}</Button></div>
               </div>
            )}

            {/* TAB 2: IMPORT & CLAIM */}
            {parentModalTab === 'import' && step === 1 && (
               <div className="space-y-6">
                  <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 text-sm font-medium text-sky-800">If your child's teacher already created their profile, you can securely claim it here using their APAAR ID and Date of Birth.</div>
                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">12-Digit APAAR ID *</label><input type="text" maxLength={12} placeholder="e.g. 123456789012" value={importForm.apaarId} onChange={(e: any) => setImportForm({...importForm, apaarId: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-4 font-mono font-bold text-slate-700 outline-none focus:border-purple-500 tracking-[0.2em] text-center text-xl" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Verify Date of Birth *</label><input type="date" value={importForm.dob} onChange={(e: any) => setImportForm({...importForm, dob: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-purple-500" /></div>
                  <Button onClick={handleVerifyImport} disabled={isSaving || !importForm.apaarId || !importForm.dob || importForm.apaarId.length !== 12} className="w-full py-4 text-lg bg-purple-600 hover:bg-purple-700 border-b-4 border-purple-800">{isSaving ? 'Searching...' : 'Find Child Profile'}</Button>
               </div>
            )}

            {/* TAB 2 IMPORT: STEP 2 (CLAIM LOGIN) */}
            {parentModalTab === 'import' && step === 2 && foundStudent && (
               <div className="space-y-6">
                  <div className="bg-lime-50 border-2 border-lime-200 p-5 rounded-2xl flex items-center gap-4">
                     <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-lime-300"><CheckCircle className="text-lime-500" size={24}/></div>
                     <div><p className="text-xs font-black uppercase text-lime-700 tracking-wider">Profile Found</p><h3 className="text-xl font-extrabold text-slate-800">{foundStudent.name}</h3><p className="text-sm font-bold text-slate-500">Grade: {foundStudent.grade || 'Assigned to Classes'}</p></div>
                  </div>
                  <div className="pt-2"><label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Create Unique Username *</label><input type="text" placeholder="e.g. aaravninja24" value={importForm.username} onChange={(e: any) => setImportForm({...importForm, username: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-purple-600 outline-none focus:border-purple-500 lowercase" /></div>
                  <div><label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Create 6-Digit Secret PIN *</label><input type="text" placeholder="1 2 3 4 5 6" maxLength={6} value={importForm.pin} onChange={(e: any) => setImportForm({...importForm, pin: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-mono text-2xl tracking-[1em] text-center font-black text-slate-800 outline-none focus:border-purple-500" /></div>
                  <div className="flex gap-3 pt-4 border-t-2 border-slate-100"><Button variant="secondary" onClick={() => {setStep(1); setFoundStudent(null);}} className="flex-1 py-4 border-2 shadow-none text-lg">Cancel</Button><Button onClick={handleClaimChild} disabled={isSaving || importForm.pin.length !== 6 || !importForm.username} className="flex-[2] py-4 bg-purple-600 hover:bg-purple-700 border-purple-800 text-white border-b-4 text-lg">{isSaving ? 'Saving...' : 'Claim Profile & Generate Login'}</Button></div>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// ============================================================================
// SECTION 11: TEACHER & KREW VIEW (UPGRADED CMS & RESTORED ANALYTICS)
// ============================================================================

const TeacherView = ({ userName, t, isLoggedIn, requireAuth, onStartLesson, targetContext, isPro, role }) => {
  const [activeTab, setActiveTab] = useState('lessons');
  const [isEditMode, setIsEditMode] = useState(false);

  const [myClasses, setMyClasses] = useState([]);
  const [myStudents, setMyStudents] = useState([]);
  const [dbCurriculum, setDbCurriculum] = useState([]);
  
  const [selectedAnalyticsFilter, setSelectedAnalyticsFilter] = useState('');
  
  const [guestSelectedGrade, setGuestSelectedGrade] = useState('');
  const [guestSelectedSubject, setGuestSelectedSubject] = useState('');

  const [classStats, setClassStats] = useState({ avg: 0, struggling: [], top: [], total: 0 });
  
  // --- NEW STATES FOR STUDENT TAB & AI REPORTS ---
  const [studentFilter, setStudentFilter] = useState('ALL'); 
  const [reportStudent, setReportStudent] = useState(null); // Holds student data for the AI report modal
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);

  const [showClassModal, setShowClassModal] = useState(false);
  const [newGrade, setNewGrade] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [isSavingClass, setIsSavingClass] = useState(false);

  // --- STUDENT MANAGER STATES (APAAR ARCHITECTURE) ---
  const [showManageStudentModal, setShowManageStudentModal] = useState(false);
  const [studentModalTab, setStudentModalTab] = useState('create'); // 'create' or 'import'
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  const [newStudentForm, setNewStudentForm] = useState({
     apaarId: '', fullName: '', fathersName: '', mothersName: '',
     contact1: '', isWhatsapp1: true, contact2: '', dob: '', selectedClasses: []
  });

  const [importForm, setImportForm] = useState({ apaarId: '', dob: '', selectedClasses: [] });

  // --- KREW CMS STATES ---
  const [expandedSubTopics, setExpandedSubTopics] = useState({});
  const [wizardData, setWizardData] = useState([]); 
  
  const initialWizardState = { 
     show: false, isEdit: false, originalToolTitle: '',
     grade: '', subject: '', book: 'Kortex Klassroom', 
     chapterSelect: '', newChapter: '', chapterNumber: '', 
     subtopicSelect: '', newSubtopic: '', subtopicOrder: '', 
     toolSelect: '', toolOrder: '', toolType: 'Conceptualiser', 
     toolTitle: '', imageUrl: '', url: '', isFeatured: false 
  };
  const [krewWizard, setKrewWizard] = useState(initialWizardState);
  
  const [krewEdit, setKrewEdit] = useState({ show: false, type: '', chapterId: '', oldTitle: '', newTitle: '', parentSubtopic: '' });
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const toggleSubTopic = (id: any) => setExpandedSubTopics(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (targetContext && targetContext.lesson) {
      setActiveTab('lessons');
      const cleanSubj = targetContext.subject?.toLowerCase().trim() === 'mathematics' ? 'Maths' : targetContext.subject?.trim();
      const cleanGrade = targetContext.grade?.trim();
      
      // Auto-set the correct filter type depending on whether they are logged in or a guest
      if (isLoggedIn && myClasses.length > 0) {
         setSelectedAnalyticsFilter(`${cleanGrade} • ${cleanSubj}`);
      } else {
         setGuestSelectedGrade(cleanGrade || '');
         setGuestSelectedSubject(cleanSubj || '');
      }
      setActiveLesson(targetContext.lesson);
    }
  }, [targetContext, isLoggedIn, myClasses.length]);

  useEffect(() => {
    async function loadTeacherClasses() {
      const user = auth.currentUser;
      if (!user) { setIsLoading(false); return; }
      try {
        const q = query(collection(db, 'teacher_classes'), where('teacher_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const classes = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as { id: string, grade: string, subject: string }));
        setMyClasses(classes);
        if (classes.length > 0 && !targetContext) {
           setSelectedAnalyticsFilter(`${classes[0].grade} • ${classes[0].subject}`);
        }
      } catch (e: any) { console.error("Database Error:", e); } finally { setIsLoading(false); }
    }
    loadTeacherClasses();
  }, [isLoggedIn, targetContext]);

  useEffect(() => {
    async function fetchClassData() {
      const user = auth.currentUser;
      if (!user) return;
      try {
        // Fetch ALL students assigned to this teacher using the new APAAR teacher_ids array
        const sQuery = query(collection(db, 'managed_students'), where('teacher_ids', 'array-contains', user.uid));
        const sSnapshot = await getDocs(sQuery);
        const allStudents = sSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as { 
          id: string; name: string; enrolled_classes?: string[]; status?: string; 
          stars_earned?: number; contact1?: string; is_whatsapp1?: boolean; username?: string | null; 
        }));
        setMyStudents(allStudents);

        // Calculate Analytics stats ONLY for the currently selected analytics filter
        if (selectedAnalyticsFilter) {
          const classStudents = allStudents.filter(s => (s.enrolled_classes || []).includes(selectedAnalyticsFilter));
          if (classStudents.length > 0) {
            const studentIds = classStudents.map(s => s.id);
            const pQuery = query(collection(db, 'progress_logs'), where('student_id', 'in', studentIds.slice(0, 30)));
            const pSnapshot = await getDocs(pQuery);
            const logs = pSnapshot.docs.map(doc => doc.data() as { score_percentage?: number });
            const totalScore = logs.reduce((acc, curr) => acc + curr.score_percentage, 0);
            const avg = logs.length > 0 ? Math.round(totalScore / logs.length) : 0;
            setClassStats({ 
               avg, 
               struggling: classStudents.filter(s => s.status === 'Struggling').map(s => s.name), 
               top: classStudents.filter(s => s.status === 'Excelling').map(s => s.name), 
               total: classStudents.length 
            });
          } else {
            setClassStats({ avg: 0, struggling: [], top: [], total: 0 });
          }
        }
      } catch (e: any) { console.error(e); }
    }
    fetchClassData();
  }, [selectedAnalyticsFilter, isLoggedIn, showManageStudentModal]);

  // FIXED: Curriculum fetch now properly uses learning_tools and groups them dynamically!
  useEffect(() => {
    async function fetchCurriculumFromDB() {
      try {
        // 1. Fetch the flat tools from the NEW database
        const snapshot = await getDocs(collection(db, 'learning_tools'));
        let allFlatTools = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as { 
          id: string; grade?: string; subject?: string; chapter_number?: number; 
          chapter_name?: string; book?: string; image?: string; content_type?: string; 
          subtopic?: string; title?: string; subtopic_order?: number; content_order?: number; 
        }));

        let filteredFlatTools = allFlatTools;

        // 2. FILTER LOGIC: Only keep the tools for the currently selected class
        if (isLoggedIn && myClasses.length > 0) {
           if (selectedAnalyticsFilter) {
              const [filterGrade, filterSubject] = selectedAnalyticsFilter.split(' • ').map(s => s?.toLowerCase().trim());
              filteredFlatTools = allFlatTools.filter(m => {
                 const dbSubj = m.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : m.subject?.toLowerCase().trim();
                 return m.grade?.toLowerCase().trim() === filterGrade && dbSubj === filterSubject;
              });
           }
        } else {
           // Apply Guest Dropdown Filters
           filteredFlatTools = allFlatTools.filter(m => {
              const matchGrade = guestSelectedGrade ? m.grade?.toLowerCase().trim() === guestSelectedGrade.toLowerCase().trim() : true;
              const dbSubj = m.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : m.subject?.toLowerCase().trim();
              const matchSubj = guestSelectedSubject ? dbSubj === guestSelectedSubject.toLowerCase().trim() : true;
              return matchGrade && matchSubj;
           });
        }

        // 3. GROUPING LOGIC
        const chaptersMap = {};

        filteredFlatTools.forEach(tool => {
           const key = `${tool.grade}_${tool.subject}_${tool.chapter_number}`;
           
           if (!chaptersMap[key]) {
              chaptersMap[key] = {
                 id: key,
                 grade: tool.grade,
                 subject: tool.subject,
                 chapter_number: tool.chapter_number,
                 chapter: tool.chapter_name,
                 book: tool.book || 'Kortex Klassroom',
                 image: tool.image || null,
                 items: 0,
                 color: 'border-sky-500',
                 subTopicsMap: {} 
              };
           }

           if (tool.content_type && tool.content_type?.toLowerCase() !== 'placeholder') {
              chaptersMap[key].items += 1;
           }

           if (tool.subtopic) {
              const subKey = tool.subtopic;
              if (!chaptersMap[key].subTopicsMap[subKey]) {
                 chaptersMap[key].subTopicsMap[subKey] = {
                    title: tool.subtopic,
                    subtopic_order: tool.subtopic_order || 1,
                    tools: []
                 };
              }
              if (tool.title && tool.content_type?.toLowerCase() !== 'placeholder') {
                 chaptersMap[key].subTopicsMap[subKey].tools.push(tool);
              }
           }
        });

        // 4. SORTING LOGIC
        const processedModules = Object.values(chaptersMap).map((chapter: any) => {
           let subTopicsArray = Object.values(chapter.subTopicsMap) as any[];

                subTopicsArray.forEach((sub: any) => {
                  sub.tools.sort((a: any, b: any) => (a.content_order || 1) - (b.content_order || 1));
                });

                subTopicsArray.sort((a: any, b: any) => (a.subtopic_order || 1) - (b.subtopic_order || 1));

           chapter.subTopics = subTopicsArray;
           delete chapter.subTopicsMap;

           if (!chapter.image) chapter.image = getSubjectFallbackImage(chapter.subject);

           return chapter;
        });

        processedModules.sort((a, b) => a.chapter_number - b.chapter_number);

        // 5. Hand it to the Teacher UI!
        setDbCurriculum(processedModules); 
      } catch (e: any) { 
        console.error("Error fetching Teacher Curriculum:", e); 
      }
    }
    
    fetchCurriculumFromDB();
  }, [selectedAnalyticsFilter, isLoggedIn, myClasses.length, guestSelectedGrade, guestSelectedSubject, targetContext]);

  // 1. UPDATED DATA FETCHER: Grabs full hierarchy for cascading dropdowns
  useEffect(() => {
    async function fetchWizardData() {
      if(krewWizard.show && krewWizard.grade && krewWizard.subject) {
        const filterGrade = krewWizard.grade.toLowerCase().trim();
        const filterSubject = krewWizard.subject.toLowerCase().trim();
        try {
          const snapshot = await getDocs(collection(db, 'learning_tools'));
          const allTools = snapshot.docs.map(d => d.data());

          const filtered = allTools.filter((m: any) => {
             const dbSubj = m.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : m.subject?.toLowerCase().trim();
             return m.grade?.toLowerCase().trim() === filterGrade && dbSubj === filterSubject;
          });

          const chapterMap: any = {};
          filtered.forEach((tool: any) => {
              const chapName = tool.chapter_name || tool.chapter;
              if (!chapName) return;
              if (!chapterMap[chapName]) {
                  chapterMap[chapName] = { chapter: chapName, chapter_number: tool.chapter_number, subTopicsMap: {} };
              }
              if (tool.subtopic) {
                  if (!chapterMap[chapName].subTopicsMap[tool.subtopic]) {
                      chapterMap[chapName].subTopicsMap[tool.subtopic] = { title: tool.subtopic, order: tool.subtopic_order || 1, tools: [] };
                  }
                  if (tool.title && tool.content_type && tool.content_type !== 'placeholder') {
                      chapterMap[chapName].subTopicsMap[tool.subtopic].tools.push(tool);
                  }
              }
          });

          const formattedData = Object.values(chapterMap).map((c: any) => ({
              chapter: c.chapter,
              chapter_number: c.chapter_number,
              subTopics: Object.values(c.subTopicsMap)
          }));

          setWizardData(formattedData as any);
        } catch (e: any) { console.error(e); }
      } else { setWizardData([]); }
    }
    fetchWizardData();
  }, [krewWizard.grade, krewWizard.subject, krewWizard.show]);

  const selectedChapData: any = wizardData.find((c: any) => c.chapter === krewWizard.chapterSelect);
  const availableSubtopics = selectedChapData?.subTopics || [];
  const selectedSubtopicData: any = availableSubtopics.find((s: any) => s.title === krewWizard.subtopicSelect);
  const availableTools = selectedSubtopicData?.tools || [];

  const handleAddClass = async () => {
    if (!newGrade || !newSubject) return;
    setIsSavingClass(true); 
    try {
      const user = auth.currentUser;
      const docRef = await addDoc(collection(db, 'teacher_classes'), { teacher_id: user.uid, grade: newGrade, subject: newSubject, created_at: new Date().toISOString() });
      setMyClasses([...myClasses, { id: docRef.id, grade: newGrade, subject: newSubject }]); 
      setSelectedAnalyticsFilter(`${newGrade} • ${newSubject}`);
      setNewGrade(''); setNewSubject(''); setShowClassModal(false); 
    } catch (error: any) { console.error(error); alert("Failed to add class."); } finally { setIsSavingClass(false); }
  };

  const handleRemoveClass = async (classId) => {
    if(!window.confirm("Are you sure you want to remove this class?")) return;
    try {
      await deleteDoc(doc(db, 'teacher_classes', classId));
      const updatedClasses = myClasses.filter(c => c.id !== classId);
      setMyClasses(updatedClasses); 
      if (updatedClasses.length > 0) setSelectedAnalyticsFilter(`${updatedClasses[0].grade} • ${updatedClasses[0].subject}`);
      else setSelectedAnalyticsFilter('');
    } catch (error: any) { console.error(error); }
  };

 // Helper: Precise Age Calculator
  const calculateAge = (dobString) => {
     if (!dobString) return '--';
     const birthDate = new Date(dobString);
     const today = new Date();
     let years = today.getFullYear() - birthDate.getFullYear();
     let months = today.getMonth() - birthDate.getMonth();
     let days = today.getDate() - birthDate.getDate();
     if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
     if (months < 0) { years--; months += 12; }
     return `${years} Y, ${months} M, ${days} D`;
  };

  // Helper: Toggle Class Selection in Forms
  const toggleClassSelection = (formType, classStr) => {
   if (formType === 'create') {
      const current = newStudentForm.selectedClasses;
      if (current.includes(classStr)) {
         setNewStudentForm({ ...newStudentForm, selectedClasses: current.filter(c => c !== classStr) });
      } else {
         setNewStudentForm({ ...newStudentForm, selectedClasses: [...current, classStr] });
      }
   } else {
      const current = importForm.selectedClasses;
      if (current.includes(classStr)) {
         setImportForm({ ...importForm, selectedClasses: current.filter(c => c !== classStr) });
      } else {
         setImportForm({ ...importForm, selectedClasses: [...current, classStr] });
      }
   }
};

  const handleCreateStudent = async () => {
     const f = newStudentForm;
     if (!/^\d{12}$/.test(f.apaarId)) return alert("APAAR ID must be exactly 12 numeric digits.");
     if (!f.fullName || !f.fathersName || !f.mothersName || !f.contact1 || !f.dob) return alert("Please fill all mandatory fields.");
     if (f.selectedClasses.length === 0) return alert("Please select at least one class to assign this student to.");
     
     setIsSavingStudent(true);
     try {
        // 1. Check for duplicates
        const q = query(collection(db, 'managed_students'), where('apaar_id', '==', f.apaarId));
        const snap = await getDocs(q);
        if (!snap.empty) { setIsSavingStudent(false); return alert("A student with this APAAR ID already exists! Please use the 'Import' tab."); }

        // 2. Create the master record (Login credentials remain null for parents to fill later)
        const newStudentData = {
           apaar_id: f.apaarId, name: f.fullName, dob: f.dob, fathers_name: f.fathersName, mothers_name: f.mothersName,
           contact1: f.contact1, is_whatsapp1: f.isWhatsapp1, contact2: f.contact2,
           enrolled_classes: f.selectedClasses, teacher_ids: [auth.currentUser.uid],
           username: null, pin: null, parent_id: null, stars_earned: 0, status: 'On Track', created_at: new Date().toISOString()
        };
        await addDoc(collection(db, 'managed_students'), newStudentData);
        alert("Student Profile Created! It is now securely awaiting Parent claim & login setup.");
        setShowManageStudentModal(false);
        setNewStudentForm({apaarId: '', fullName: '', fathersName: '', mothersName: '', contact1: '', isWhatsapp1: true, contact2: '', dob: '', selectedClasses: []});
     } catch (error: any) { console.error(error); alert("Error creating student."); } finally { setIsSavingStudent(false); }
  };

  const handleImportStudent = async () => {
     const f = importForm;
     if (!/^\d{12}$/.test(f.apaarId)) return alert("APAAR ID must be exactly 12 numeric digits.");
     if (!f.dob || f.selectedClasses.length === 0) return alert("Please enter DOB and select at least one class.");
     
     setIsSavingStudent(true);
     try {
        // 2-Factor Auth style search: Must match BOTH APAAR and DOB
        const q = query(collection(db, 'managed_students'), where('apaar_id', '==', f.apaarId), where('dob', '==', f.dob));
        const snap = await getDocs(q);
        if (snap.empty) { setIsSavingStudent(false); return alert("No matching student found. Please check the APAAR ID and DOB, or create a new profile."); }
        
        const studentDoc = snap.docs[0];
const studentData = studentDoc.data() as { 
  name: string; enrolled_classes?: string[]; teacher_ids?: string[]; 
};
        
        // Merge the new classes and teacher access without overwriting existing data
        const updatedClasses = [...new Set([...(studentData.enrolled_classes || []), ...f.selectedClasses])];
        const updatedTeachers = [...new Set([...(studentData.teacher_ids || []), auth.currentUser.uid])];
        
        await setDoc(doc(db, 'managed_students', studentDoc.id), { enrolled_classes: updatedClasses, teacher_ids: updatedTeachers }, { merge: true });
        alert(`Successfully imported ${studentData.name} into your roster!`);
        setShowManageStudentModal(false);
        setImportForm({ apaarId: '', dob: '', selectedClasses: [] });
     } catch (error: any) { console.error(error); alert("Error importing student."); } finally { setIsSavingStudent(false); }
  };


  // 2. HELPER: Find exact tool document for Flat DB Edits
  const getExactToolDoc = async (g: any, s: any, c: any, sub: any, title: any) => {
     const snap = await getDocs(collection(db, 'learning_tools'));
     return snap.docs.find((d: any) => {
        const data = d.data();
        const dGrade = data.grade?.toLowerCase().trim() || '';
        const dSubj = data.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : (data.subject?.toLowerCase().trim() || '');
        const dChap = (data.chapter_name || data.chapter || '')?.toLowerCase().trim();
        const dSub = data.subtopic?.toLowerCase().trim() || '';
        const dTitle = data.title?.toLowerCase().trim() || '';
        
        const fGrade = g?.toLowerCase().trim() || '';
        const fSubj = s?.toLowerCase().trim() === 'mathematics' ? 'maths' : (s?.toLowerCase().trim() || '');
        const fChap = c?.toLowerCase().trim() || '';
        const fSub = sub?.toLowerCase().trim() || '';
        const fTitle = title?.toLowerCase().trim() || '';
        
        return dGrade === fGrade && dSubj === fSubj && dChap === fChap && dSub === fSub && dTitle === fTitle;
     });
  };

  // 3. SUBMIT LOGIC: Flat Database Direct Publisher
  const handleSubmitWizard = async () => {
     const finalChapter = krewWizard.chapterSelect === 'NEW' ? krewWizard.newChapter : krewWizard.chapterSelect;
     const finalSubtopic = krewWizard.subtopicSelect === 'NEW' ? krewWizard.newSubtopic : krewWizard.subtopicSelect;
     if (!krewWizard.grade || !krewWizard.subject || !finalChapter || !krewWizard.chapterNumber || !finalSubtopic || !krewWizard.toolTitle || !krewWizard.url) { 
         alert("Please fill out all required fields!"); return; 
     }

     if (krewWizard.chapterSelect === 'NEW') {
         const numTaken = wizardData.some((c: any) => Number(c.chapter_number) === Number(krewWizard.chapterNumber));
         if (numTaken) { alert(`Chapter Number ${krewWizard.chapterNumber} is already used by an existing chapter. Please choose another.`); return; }
     }

     setIsSendingRequest(true);
     
     let toolColor = 'bg-sky-500';
     const tType = krewWizard.toolType.toLowerCase();
     if (tType === 'conceptualiser') toolColor = 'bg-purple-500';
     else if (tType === 'video') toolColor = 'bg-pink-500';
     else if (tType === 'quiz') toolColor = 'bg-orange-500';
     else if (tType === 'pdf' || tType === 'presentation') toolColor = 'bg-sky-500';
     else if (tType === 'game') toolColor = 'bg-lime-500';

     // FORMATTED PERFECTLY FOR THE LESSON PLAYER (Flat Structure)
     const flatPayload = {
        grade: krewWizard.grade, 
        subject: krewWizard.subject, 
        chapter_number: Number(krewWizard.chapterNumber),
        chapter_name: finalChapter, 
        chapter: finalChapter, // Fallback support
        book: krewWizard.book || 'Kortex Klassroom', 
        subtopic_order: Number(krewWizard.subtopicOrder),
        subtopic: finalSubtopic,
        title: krewWizard.toolTitle, 
        content_type: krewWizard.toolType.toLowerCase(), 
        type: krewWizard.toolType, // Fallback support
        image: krewWizard.imageUrl || '', 
        content_url: krewWizard.url, 
        content_order: Number(krewWizard.toolOrder), 
        orderIndex: Number(krewWizard.toolOrder), // Fallback support
        isPremium: false, 
        is_featured: krewWizard.isFeatured, 
        color: toolColor,
        created_at: new Date().toISOString()
     };

     const isEditAction = krewWizard.toolSelect !== 'NEW' && krewWizard.toolSelect !== '';

     try {
       // DIRECT DATABASE UPDATE (Flat Document)
       if (isEditAction) {
          const oldDoc = await getExactToolDoc(flatPayload.grade, flatPayload.subject, krewWizard.chapterSelect, krewWizard.subtopicSelect, krewWizard.originalToolTitle);
          if (oldDoc) {
             await setDoc(doc(db, 'learning_tools', oldDoc.id), flatPayload, { merge: true });
          } else {
             // Failsafe if it couldn't find the exact old doc to overwrite
             await addDoc(collection(db, 'learning_tools'), flatPayload);
          }
       } else {
          await addDoc(collection(db, 'learning_tools'), flatPayload);
       }

       // LOG TO ADMIN AUDIT
       await addDoc(collection(db, 'content_requests'), {
          krew_member_id: auth.currentUser?.uid || 'unknown', krew_member_email: auth.currentUser?.email || 'Direct Update',
          action_type: isEditAction ? 'CASCADING_EDIT' : 'CASCADING_ADD', target_type: 'TOOL', target_grade: krewWizard.grade, target_subject: krewWizard.subject, 
          payload: flatPayload, originalTitle: krewWizard.originalToolTitle || null, 
          status: 'APPROVED', resolved_by: 'Auto-Publish System', resolved_at: new Date().toISOString()
       });
       
       alert(`Success! Content ${isEditAction ? 'updated' : 'added'} instantly.`);
       setKrewWizard(initialWizardState);
       setActiveLesson(null); // Forces UI to refresh the curriculum
     } catch (error: any) { console.error(error); alert("Error saving content directly."); } finally { setIsSendingRequest(false); }
  };

  const handleKrewDelete = async (targetType: any, targetId: any, title: any) => {
     const safeTitle = title || 'Untitled Item';
     if (!window.confirm(`Are you sure you want to permanently DELETE "${safeTitle}"? This will be live instantly.`)) return;
     
     try {
       const filterString = selectedAnalyticsFilter || '';
       const [grade, subject] = filterString.split(' • ');

       // 1. DIRECT DELETE LOGIC
       if (targetType === 'CHAPTER') {
          await deleteDoc(doc(db, 'learning_tools', targetId));
       } else {
          const targetDocSnap = await getDoc(doc(db, 'learning_tools', targetId));
          if (targetDocSnap.exists()) {
             let data = targetDocSnap.data();
             if (targetType === 'SUBTOPIC') {
                data.subTopics = (data.subTopics || []).filter((s: any) => s.title !== safeTitle);
             } else if (targetType === 'TOOL') {
                data.subTopics = (data.subTopics || []).map((sub: any) => {
                   sub.tools = (sub.tools || []).filter((t: any) => t.title !== safeTitle);
                   return sub;
                });
             }
             await setDoc(doc(db, 'learning_tools', targetDocSnap.id), { subTopics: data.subTopics }, { merge: true });
          }
       }
       
       // 2. LOG TO ADMIN AUDIT
       await addDoc(collection(db, 'content_requests'), { 
         krew_member_id: auth.currentUser?.uid || 'unknown', krew_member_email: auth.currentUser?.email || 'Direct Update',
         action_type: 'DELETE', target_type: targetType, target_id: targetId, target_grade: grade?.trim() || '', target_subject: subject?.trim() || '', 
         payload: { title: safeTitle }, status: 'APPROVED', resolved_by: 'Auto-Publish System', resolved_at: new Date().toISOString(), created_at: new Date().toISOString()
       });

       alert("Successfully deleted!");
       setActiveLesson(null); 
     } catch (error: any) { console.error(error); alert("Error deleting content."); }
  };

  const handleEditClick = (type: any, chapterId: any, oldTitle: any, parentSubtopic = null) => {
     setKrewEdit({ show: true, type, chapterId, oldTitle, newTitle: oldTitle || '', parentSubtopic });
  };

  const handleSendQuickEdit = async () => {
     if (!krewEdit.newTitle) return;
     setIsSendingRequest(true);
     try {
       const filterString = selectedAnalyticsFilter || '';
       const [grade, subject] = filterString.split(' • ');

       // 1. DIRECT RENAME LOGIC
       const curRef = doc(db, 'learning_tools', krewEdit.chapterId);
       const curSnap = await getDoc(curRef);
       if (curSnap.exists()) {
          let data = curSnap.data();
          if (krewEdit.type === 'CHAPTER') {
             data.chapter = krewEdit.newTitle;
             data.chapter_name = krewEdit.newTitle; 
          } else if (krewEdit.type === 'SUBTOPIC') {
             const sIdx = (data.subTopics || []).findIndex((s: any) => s.title === krewEdit.oldTitle);
             if (sIdx > -1) data.subTopics[sIdx].title = krewEdit.newTitle;
          }
          await setDoc(curRef, data, { merge: true });
       }

       // 2. LOG TO ADMIN AUDIT (Now with strict undefined fallbacks!)
       await addDoc(collection(db, 'content_requests'), { 
          krew_member_id: auth.currentUser?.uid || 'unknown', krew_member_email: auth.currentUser?.email || 'Direct Update',
          action_type: 'EDIT', target_type: krewEdit.type, target_id: krewEdit.chapterId, 
          target_grade: grade?.trim() || '', target_subject: subject?.trim() || '', 
          payload: { oldTitle: krewEdit.oldTitle, newTitle: krewEdit.newTitle, parentSubtopic: krewEdit.parentSubtopic }, 
          status: 'APPROVED', resolved_by: 'Auto-Publish System', resolved_at: new Date().toISOString(), created_at: new Date().toISOString()
        });

        alert("Successfully renamed! Changes are live.");
        setKrewEdit({ show: false, type: '', chapterId: '', oldTitle: '', newTitle: '', parentSubtopic: '' });
        setActiveLesson(null); 
     } catch (error: any) { console.error(error); alert("Error renaming."); } finally { setIsSendingRequest(false); }
  };

  const handleFullEditClick = (tool: any, subtopicTitle: any, lesson: any) => {
    let normalizedType = 'Video';
    if (tool.type) {
       const t = tool.type.toLowerCase();
       if (t === 'game' || t === 'gamepad2') normalizedType = 'Game';
       else if (t === 'pdf') normalizedType = 'PDF';
       else if (t === 'presentation' || t === 'ppt') normalizedType = 'Presentation';
       else if (t === 'quiz') normalizedType = 'Quiz';
       else if (t === 'conceptualiser') normalizedType = 'Conceptualiser';
    }

    let normalizedSubject = lesson.subject?.trim() || '';
    if (normalizedSubject.toLowerCase() === 'mathematics') normalizedSubject = 'Maths';
    else if (normalizedSubject) normalizedSubject = normalizedSubject.charAt(0).toUpperCase() + normalizedSubject.slice(1).toLowerCase();
    
    let normalizedGrade = lesson.grade?.trim() || '';

    const currentSubtopic = lesson.subTopics?.find((s: any) => s.title === subtopicTitle);
    const actualIndex = currentSubtopic ? currentSubtopic.tools.findIndex((t: any) => t.title === tool.title) : 0;
    const finalOrderIndex = tool.orderIndex || tool.content_order || (actualIndex + 1);

    // FIXED: Maps exactly to the new 12-Step Cascading State variables
    setKrewWizard({
      show: true, isEdit: true,
      originalToolTitle: tool.title,
      grade: normalizedGrade, subject: normalizedSubject, book: lesson.book || 'Kortex Klassroom',
      chapterSelect: lesson.chapter, newChapter: '', chapterNumber: lesson.chapter_number || 1,
      subtopicSelect: subtopicTitle, newSubtopic: '', subtopicOrder: currentSubtopic?.subtopic_order || 1,
      toolSelect: tool.title, toolOrder: finalOrderIndex, toolType: normalizedType, 
      toolTitle: tool.title, imageUrl: tool.image || tool.image_url || '', url: tool.content_url || '', 
      isFeatured: tool.is_featured || false
    });
  };

  if (isLoading) return <div className="py-20 text-center animate-pulse font-bold text-slate-400">Connecting to Kortex Database...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-20">
      <div className={`p-8 rounded-[2.5rem] border-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isEditMode ? 'bg-emerald-50 border-emerald-100' : 'bg-sky-50 border-sky-100'}`}>
        <div className="flex items-center gap-5">
           <div className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border-2 shrink-0 ${isEditMode ? 'border-emerald-200' : 'border-sky-200'}`}>
              <User size={32} className={isEditMode ? 'text-emerald-600' : 'text-sky-600'} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-800">{userName ? `${userName}'s Workspace` : 'Teacher Dashboard'}</h2>
              <p className="text-slate-500 font-bold">{isLoggedIn ? `${myClasses.length} Real-time Classrooms` : 'Unlock your digital classroom today'}</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           {/* GUEST VIEW: Show both Sign Up and Pro buttons */}
           {!isLoggedIn && (
              <>
                 <Button variant="secondary" onClick={() => requireAuth(() => {}, "Create your free teacher account to assign lessons and track students!")} className="flex-1 md:flex-none bg-white !text-sky-600 hover:bg-sky-50 shadow-sm py-2 px-5 text-sm border-2 border-sky-200">
                    Create Free Account
                 </Button>
                 <Button onClick={() => requireAuth(() => {}, "Sign up to unlock Pro analytics and advanced learning tools!")} className="flex-1 md:flex-none !bg-gradient-to-r from-amber-400 to-orange-500 !text-white border-none shadow-md hover:shadow-lg py-2 px-5 text-sm">
                    <Star size={16} className="fill-white inline mr-1" /> Upgrade to Pro
                 </Button>
              </>
           )}

           {/* FREE TEACHER VIEW: Show only Pro button */}
           {isLoggedIn && !isPro && role !== 'admin' && (
              <Button onClick={() => alert("Billing portal opening soon!")} className="flex-1 md:flex-none !bg-gradient-to-r from-amber-400 to-orange-500 !text-white border-none shadow-md hover:shadow-lg py-2 px-5 text-sm">
                 <Star size={16} className="fill-white inline mr-1" /> Upgrade to Pro
              </Button>
           )}

           {/* KREW MODE TOGGLE */}
           {role === 'krew' && (
              <div className="flex items-center gap-3 bg-white p-2 rounded-full border-2 border-slate-200 shadow-sm ml-auto">
                 <span className={`text-xs font-black uppercase tracking-wider px-3 transition-colors ${!isEditMode ? 'text-sky-600' : 'text-slate-400'}`}>Preview</span>
                 <button onClick={() => setIsEditMode(!isEditMode)} className={`w-14 h-7 rounded-full relative transition-colors shadow-inner ${isEditMode ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isEditMode ? 'translate-x-7' : 'translate-x-0'}`}></div></button>
                 <span className={`text-xs font-black uppercase tracking-wider px-3 transition-colors ${isEditMode ? 'text-emerald-600' : 'text-slate-400'}`}>Build Mode</span>
              </div>
           )}
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button onClick={() => {setActiveTab('lessons'); setActiveLesson(null);}} className={`px-8 py-3 rounded-xl font-black text-sm uppercase transition-all ${activeTab === 'lessons' ? (isEditMode ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-sky-600 shadow-sm') : 'text-slate-500'}`}>My Grades</button>
        <button onClick={() => setActiveTab('analytics')} className={`px-8 py-3 rounded-xl font-black text-sm uppercase transition-all ${activeTab === 'analytics' ? (isEditMode ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-sky-600 shadow-sm') : 'text-slate-500'}`}>Analytics</button>
        <button onClick={() => setActiveTab('students')} className={`px-8 py-3 rounded-xl font-black text-sm uppercase transition-all ${activeTab === 'students' ? (isEditMode ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-sky-600 shadow-sm') : 'text-slate-500'}`}>Students</button>
      </div>

      {activeTab !== 'lessons' && !isLoggedIn && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 md:p-24 text-center shadow-sm mt-6">
           <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={40} className="text-sky-500" /></div>
           <h3 className="text-3xl font-black text-slate-800 mb-4">Teacher Portal Locked</h3>
           <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">Create a free teacher account to access analytics and manage students.</p>
           <Button onClick={() => requireAuth(() => {}, "Please log in to access this feature.")} className="px-8 py-4 text-lg border-b-4">Sign Up / Log In</Button>
        </div>
      )}

      {activeTab !== 'lessons' && isLoggedIn && myClasses.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center mt-6"><Database size={48} className="mx-auto text-slate-300 mb-4" /><h3 className="text-xl font-bold text-slate-700">No Classrooms Found</h3><p className="text-slate-500 max-w-sm mx-auto mt-2">Go to 'My Grades' and click "Manage Classes" to add your first class combination.</p></div>
      )}

      {/* RESTORED CONTENT FOR ANALYTICS (WITH PRO LOCK) */}
      {activeTab === 'analytics' && isLoggedIn && myClasses.length > 0 && (() => {
         // Check if the user is locked out of Pro features
         const isLocked = !isPro && role !== 'admin' && role !== 'krew';
         
         // Feed in dummy data if locked, otherwise use real class stats!
         const displayAvg = isLocked ? 84 : classStats.avg;
         const displayStruggling = isLocked ? ['Aarav', 'Diya'] : classStats.struggling;
         const displayTop = isLocked ? ['Kabir', 'Ananya', 'Rohan'] : classStats.top;
         const displayCurriculum = isLocked && dbCurriculum.length === 0 
            ? [{chapter: 'Number Systems & Place Value'}, {chapter: 'Addition and Subtraction'}, {chapter: 'Introduction to Fractions'}] 
            : dbCurriculum;

         return (
            <div className="relative animate-fade-in">
               
               {/* 🔒 THE PRO LOCK OVERLAY */}
               {isLocked && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-32 bg-white/30 backdrop-blur-[6px] rounded-[2.5rem]">
                     <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center max-w-lg border-2 border-amber-100 flex flex-col items-center animate-fade-in-up">
                        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white transform -rotate-3">
                           <Lock size={40} className="text-white" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 mb-3">Unlock AI Analytics</h3>
                        <p className="text-slate-600 font-medium mb-8 text-lg">Get real-time insights, identify struggling students instantly, and track chapter-by-chapter mastery with Kortex Klassroom Pro.</p>
                        <Button onClick={() => alert("Billing portal opening soon!")} className="w-full !bg-gradient-to-r from-amber-400 to-orange-500 !text-white border-none shadow-xl hover:shadow-2xl py-4 text-xl">
                           <Star size={24} className="fill-white inline mr-2" /> Upgrade to Pro
                        </Button>
                     </div>
                  </div>
               )}

               {/* THE DASHBOARD (Blurred if Locked) */}
               <div className={`space-y-8 ${isLocked ? 'opacity-60 select-none pointer-events-none transition-all duration-500' : ''}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <Card className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="text-7xl font-black text-slate-800">{displayAvg}%</div>
                        <div className="text-slate-400 font-bold uppercase text-xs mt-2 mb-4 tracking-wider">Overall Class Mastery</div>
                        <div className="w-full bg-slate-100 rounded-full h-4 shadow-inner overflow-hidden"><div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{width: `${displayAvg}%`}}></div></div>
                     </Card>
                     <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm">
                        <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><Sparkles className="text-amber-500"/> AI Insights & Actions</h3>
                        <p className="text-slate-600 mb-6 font-medium">The class average is currently <span className="font-bold text-sky-600">{displayAvg}%</span>. {displayStruggling.length > 0 ? `We recommend focused review for ${displayStruggling.length} students to keep them on track.` : 'Everyone is currently on track!'}</p>
                        <div className="flex flex-wrap gap-4">
                           {displayStruggling.length > 0 && (
                             <div className="flex-1 bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm"><span className="text-xs font-black text-rose-600 uppercase flex items-center gap-1 mb-3"><AlertTriangle size={14}/> Attention Needed</span><div className="flex flex-wrap gap-2">{displayStruggling.map(s => <span key={s} className="bg-white px-3 py-1 rounded-lg text-xs font-bold text-rose-500 shadow-sm border border-rose-100">{s}</span>)}</div></div>
                           )}
                           {displayTop.length > 0 && (
                             <div className="flex-1 bg-lime-50 p-5 rounded-2xl border border-lime-100 shadow-sm"><span className="text-xs font-black text-lime-600 uppercase flex items-center gap-1 mb-3"><Trophy size={14}/> Excelling</span><div className="flex flex-wrap gap-2">{displayTop.map(s => <span key={s} className="bg-white px-3 py-1 rounded-lg text-xs font-bold text-lime-600 shadow-sm border border-lime-100">{s}</span>)}</div></div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm">
                     <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><BookOpen className="text-sky-500"/> Chapter Completion Breakdown</h3>
                     {displayCurriculum.length === 0 ? (
                        <p className="text-slate-400 font-medium text-center py-6">No curriculum data available to map.</p>
                     ) : (
                        <div className="space-y-5">
                           {displayCurriculum.map((mod, idx) => {
                              const fakeProgress = isLocked ? Math.max(20, 95 - (idx * 25)) : Math.max(15, 95 - (idx * 12)); 
                              const colorClass = fakeProgress > 75 ? 'bg-lime-500' : fakeProgress > 40 ? 'bg-amber-400' : 'bg-rose-500';
                              return (
                                <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                   <div className="w-8 font-black text-slate-300 text-lg">{(idx + 1).toString().padStart(2, '0')}</div>
                                   <div className="flex-1">
                                      <div className="flex justify-between mb-2">
                                         <span className="text-sm font-bold text-slate-700">{mod.chapter}</span>
                                         <span className={`text-sm font-black ${colorClass.replace('bg-', 'text-')}`}>{fakeProgress}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden"><div className={`${colorClass} h-2.5 rounded-full transition-all duration-1000`} style={{width: `${fakeProgress}%`}}></div></div>
                                   </div>
                                </div>
                              )
                           })}
                        </div>
                     )}
                  </div>
               </div>
            </div>
         );
      })()}

      {/* RESTORED CONTENT FOR STUDENTS (WITH PRO LOCK) */}
      {activeTab === 'students' && isLoggedIn && myClasses.length > 0 && (() => {
         // Check if the user is locked out of Pro features
         const isLocked = !isPro && role !== 'admin' && role !== 'krew';
         
         // Feed in dummy data if locked, otherwise use real students!
         const displayStudents = isLocked ? [
            { id: 'dummy1', name: 'Aarav Sharma', username: 'aarav123', pin: '847291', status: 'On Track', stars_earned: 142 },
            { id: 'dummy2', name: 'Diya Patel', username: 'diya456', pin: '392018', status: 'Struggling', stars_earned: 45 },
            { id: 'dummy3', name: 'Kabir Singh', username: 'kabir789', pin: '571920', status: 'Excelling', stars_earned: 280 }
         ] : myStudents;

         return (
            <div className="relative animate-fade-in">
               
               {/* 🔒 THE PRO LOCK OVERLAY */}
               {isLocked && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-24 bg-white/30 backdrop-blur-[6px] rounded-[2.5rem]">
                     <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center max-w-lg border-2 border-amber-100 flex flex-col items-center animate-fade-in-up">
                        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white transform -rotate-3">
                           <Lock size={40} className="text-white" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 mb-3">Unlock Student Management</h3>
                        <p className="text-slate-600 font-medium mb-8 text-lg">Generate direct login credentials, track individual progress, and manage your entire classroom roster with Kortex Klassroom Pro.</p>
                        <Button onClick={() => alert("Billing portal opening soon!")} className="w-full !bg-gradient-to-r from-amber-400 to-orange-500 !text-white border-none shadow-xl hover:shadow-2xl py-4 text-xl">
                           <Star size={24} className="fill-white inline mr-2" /> Upgrade to Pro
                        </Button>
                     </div>
                  </div>
               )}

               {/* THE DASHBOARD (Blurred if Locked) */}
               <div className={`space-y-6 ${isLocked ? 'opacity-60 select-none pointer-events-none transition-all duration-500' : ''}`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                    <div>
                       <h3 className="text-xl font-black text-slate-800">Class Roster</h3>
                       <p className="text-slate-500 text-sm font-bold mt-1">Manage student accounts, contacts, and generate AI reports.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                       {/* THE NEW CLASS FILTER */}
                       <select value={studentFilter} onChange={(e: any) => setStudentFilter(e.target.value)} className="bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm flex-1 md:flex-none">
                          <option value="ALL">View All Students</option>
                          {myClasses.map(cls => <option key={cls.id} value={`${cls.grade} • ${cls.subject}`}>{cls.grade} • {cls.subject}</option>)}
                       </select>
                       
                       <Button onClick={() => {
                          if (!isPro && role !== 'admin' && role !== 'krew') return alert("Student Management is a Pro feature. Please upgrade to add students.");
                          setShowManageStudentModal(true);
                       }} className="py-3 px-6 shadow-none border-2 text-sm flex-1 md:flex-none">
                          <Users size={18} className="mr-2"/> Manage Students
                       </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 overflow-x-auto shadow-sm">
                     <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-slate-50"><tr>
                           <th className="p-6 font-black text-slate-400 text-xs uppercase tracking-wider">Student Name</th>
                           <th className="p-6 font-black text-slate-400 text-xs uppercase tracking-wider">Enrolled Classes</th>
                           <th className="p-6 font-black text-slate-400 text-xs uppercase tracking-wider">Parent Contact</th>
                           <th className="p-6 font-black text-slate-400 text-xs uppercase tracking-wider">Login Details</th>
                           <th className="p-6 font-black text-slate-400 text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-50">
                           {(() => {
                              // Filter the displayStudents array based on the dropdown selection!
                              const filteredStudents = studentFilter === 'ALL' 
                                 ? displayStudents 
                                 : displayStudents.filter(s => (s.enrolled_classes || []).includes(studentFilter));

                              if (filteredStudents.length === 0) {
                                 return <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold">No students found for this selection.</td></tr>;
                              }

                              return filteredStudents.map(s => (
                                 <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-6">
                                       <div className="font-extrabold text-slate-800 text-base">{s.name}</div>
                                       <div className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${s.status === 'Excelling' ? 'bg-lime-100 text-lime-700' : s.status === 'Struggling' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
                                          {s.status} • {s.stars_earned || 0} ⭐
                                       </div>
                                    </td>
                                    <td className="p-6">
                                       <div className="flex flex-wrap gap-1 max-w-[200px]">
                                          {(s.enrolled_classes || []).map((cls, idx) => (
                                             <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200 whitespace-nowrap">{cls}</span>
                                          ))}
                                          {(!s.enrolled_classes || s.enrolled_classes.length === 0) && <span className="text-xs text-slate-400 italic">No classes</span>}
                                       </div>
                                    </td>
                                    <td className="p-6">
                                       <div className="text-sm font-bold text-slate-700">{s.contact1 || 'Not Provided'}</div>
                                       {s.is_whatsapp1 && <div className="text-[10px] font-black text-emerald-600 mt-0.5 uppercase tracking-wider">✅ WhatsApp</div>}
                                    </td>
                                    <td className="p-6">
                                       {s.username ? (
                                          <div className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded inline-block shadow-sm border border-sky-100">User: {s.username}</div>
                                       ) : (
                                          <div className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block uppercase tracking-wider border border-amber-200"><Clock size={10} className="inline mr-1 mb-0.5"/> Awaiting Parent Setup</div>
                                       )}
                                    </td>
                                    <td className="p-6 text-right">
                                       <button onClick={() => setReportStudent(s)} className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                          <Sparkles size={14} className="text-purple-200" /> AI Report
                                       </button>
                                    </td>
                                 </tr>
                              ));
                           })()}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         );
      })()}



      {activeTab === 'lessons' && (
         <div className="space-y-6 animate-fade-in">
            {/* FIXED: The Filter Bar uses Dropdowns for Guests and Buttons for Teachers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm">
               
               {isLoggedIn && myClasses.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                     {myClasses.map(f => (<button key={f.id} onClick={() => {setSelectedAnalyticsFilter(`${f.grade} • ${f.subject}`); setActiveLesson(null);}} className={`px-6 py-2 rounded-full border-2 font-bold whitespace-nowrap transition-all ${selectedAnalyticsFilter === `${f.grade} • ${f.subject}` ? (isEditMode ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-sky-500 border-sky-500 text-white shadow-lg') : 'bg-white text-slate-500'}`}>{f.grade} • {f.subject}</button>))}
                  </div>
               ) : (
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                     <span className="font-bold text-slate-500 text-sm uppercase px-2 hidden sm:block">Filter:</span>
                     <select className="flex-1 md:w-40 bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" value={guestSelectedGrade} onChange={(e: any) => setGuestSelectedGrade(e.target.value)}>
                       <option value="">All Grades</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                     </select>
                     <select className="flex-1 md:w-48 bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" value={guestSelectedSubject} onChange={(e: any) => setGuestSelectedSubject(e.target.value)}>
                       <option value="">All Subjects</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                     {(guestSelectedGrade || guestSelectedSubject) && <button onClick={() => {setGuestSelectedGrade(""); setGuestSelectedSubject("");}} className="px-4 py-2 bg-slate-100 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-200 text-slate-600"><X size={16} /> Clear</button>}
                  </div>
               )}

               {isLoggedIn && <Button variant="secondary" onClick={() => setShowClassModal(true)} className="shrink-0 border-2 shadow-none py-2 text-sm"><Settings size={16} className="mr-2 inline" /> Manage Classes</Button>}
            </div>

            {!activeLesson ? (
               <>
                  {isEditMode && role === 'krew' && (
                     <Button onClick={() => setKrewWizard({...initialWizardState, show: true, grade: selectedAnalyticsFilter.split(' • ')[0] || guestSelectedGrade, subject: selectedAnalyticsFilter.split(' • ')[1] || guestSelectedSubject})} className="w-full bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 py-4 text-lg border-2 border-dashed border-emerald-400 shadow-xl shadow-emerald-500/20"><Plus size={20} className="inline mr-2" /> Global Content Wizard: Build Curriculum</Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {dbCurriculum.length > 0 ? dbCurriculum.map(lesson => (
                        <Card key={lesson.id} className={`p-6 cursor-pointer relative group transition-colors ${isEditMode ? 'hover:border-emerald-400' : 'hover:border-sky-400'}`} onClick={() => !isEditMode && setActiveLesson(lesson)}>
                           {isEditMode && (
                             <div className="absolute top-4 right-4 flex gap-2 z-10">
                               <button onClick={(e: any) => { e.stopPropagation(); handleEditClick('CHAPTER', lesson.id, lesson.chapter); }} className="bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white p-2 rounded-xl transition-colors shadow-sm"><Edit3 size={16} /></button>
                               <button onClick={(e: any) => { e.stopPropagation(); handleKrewDelete('CHAPTER', lesson.id, lesson.chapter); }} className="bg-red-50 text-red-400 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-colors shadow-sm"><Trash2 size={16} /></button>
                             </div>
                           )}
                           <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-3 inline-block ${isEditMode ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>{lesson.book}</span>
                           <h3 className={`text-xl font-black text-slate-800 leading-tight pr-20 mb-2 ${isEditMode ? 'group-hover:text-emerald-600' : 'group-hover:text-sky-600'}`}>{lesson.chapter}</h3>
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4"><span className="bg-slate-100 px-2 py-1 rounded-md">{lesson.grade}</span><span>•</span><span>{lesson.subject}</span></div>
                           <div className="text-slate-400 text-sm font-bold mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                              <span className="flex items-center gap-1"><Layers size={14}/> {(lesson.subTopics || lesson.flow)?.length || 0} Modules</span>
                              {isEditMode && <Button variant="secondary" onClick={() => setActiveLesson(lesson)} className="px-3 py-1 text-xs border-2 shadow-none">Open Builder</Button>}
                           </div>
                        </Card>
                     )) : (<div className="col-span-full py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">No curriculum mapped to this filter yet.</div>)}
                  </div>
               </>
            ) : (
               <>
                  <button onClick={() => setActiveLesson(null)} className={`flex items-center gap-2 font-bold bg-white px-4 py-2 rounded-full shadow-sm border-2 border-slate-100 w-fit transition-colors ${isEditMode ? 'text-emerald-600 hover:border-emerald-200' : 'text-sky-600 hover:border-sky-200'}`}><ChevronLeft size={18} /> Back to Chapters</button>
                  <div className={`bg-white rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all border-2 border-b-8 ${isEditMode ? 'border-emerald-500' : 'border-sky-500'}`}>
                     <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/3 z-0 ${isEditMode ? 'bg-emerald-50' : 'bg-sky-50'}`}></div>
                     <div className="relative z-10"><span className={`text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full inline-block mb-4 ${isEditMode ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>{activeLesson.book}</span><h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">{activeLesson.chapter}</h2></div>
                  </div>

                  <div className="px-0 md:px-8 py-4 space-y-4">
                     {activeLesson.subTopics && activeLesson.subTopics.map((subTopic, sIdx) => {
                        const isExpanded = expandedSubTopics[subTopic.id || sIdx];
                        return (
                           <div key={subTopic.id || sIdx} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                              <div className={`w-full flex flex-col md:flex-row items-start md:items-center justify-between p-5 transition-colors ${isEditMode ? 'bg-emerald-50/50' : 'bg-slate-50 hover:bg-slate-100'}`}>
                                 <button onClick={() => toggleSubTopic(subTopic.id || sIdx)} className="flex items-center gap-4 flex-1 text-left w-full">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors ${isEditMode ? 'bg-emerald-200 text-emerald-800' : 'bg-sky-200 text-sky-700'}`}>{sIdx + 1}</div>
                                    <h3 className="text-lg md:text-xl font-extrabold text-slate-800 leading-tight">{subTopic.title}</h3>
                                 </button>
                                 <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0 md:pl-4 self-end md:self-auto">
                                    {isEditMode && (<>
                                       <button onClick={() => handleEditClick('SUBTOPIC', activeLesson.id, subTopic.title)} className="bg-white text-emerald-500 hover:text-white hover:bg-emerald-500 p-2 rounded-full border border-slate-200 shadow-sm transition-colors"><Edit3 size={16}/></button>
                                       <button onClick={() => handleKrewDelete('SUBTOPIC', activeLesson.id, subTopic.title)} className="bg-white text-red-400 hover:text-white hover:bg-red-500 p-2 rounded-full border border-slate-200 shadow-sm transition-colors"><Trash2 size={16}/></button>
                                    </>)}
                                    <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm hidden sm:block">{subTopic.tools?.length || 0} Tools</span>
                                    <button onClick={() => toggleSubTopic(subTopic.id || sIdx)} className="bg-white p-1 rounded-full shadow-sm border border-slate-200">{isExpanded ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}</button>
                                 </div>
                              </div>

                              {isExpanded && (
                                 <div className="p-4 border-t-2 border-slate-100 bg-white space-y-3">
                                    {subTopic.tools && subTopic.tools.length > 0 ? [...subTopic.tools].sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((item, index) => (
                                       <div key={index} className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl border-2 border-slate-100 transition-colors group relative ${isEditMode ? 'hover:border-emerald-300' : 'hover:border-sky-300'}`}>
                                          <div className="flex items-center gap-4">
                                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${item.color || 'bg-slate-800'} group-hover:scale-110 transition-transform`}>
                                             {(() => {
                                                const toolType = (item.content_type || item.type || '').toLowerCase();
                                                if (toolType === 'video') return <Video size={24}/>;
                                                if (toolType === 'pdf' || toolType === 'presentation' || toolType === 'ppt') return <FileText size={24}/>;
                                                if (toolType === 'quiz') return <Brain size={24}/>; // Or whichever quiz icon you imported!
                                                return <Gamepad2 size={24}/>;
                                              })()}
                                          </div>
                                          <div>
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">#{item.orderIndex || index + 1} • {item.content_type || item.type || 'Tool'}</span>
                                                {item.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1"><Star size={8} className="fill-amber-700"/> Pro</span>}
                                             </div>
                                             <h4 className="text-lg font-extrabold text-slate-800">{item.title}</h4>
                                          </div>
                                       </div>
                                          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                             {isEditMode ? (<>
                                                <button onClick={() => handleFullEditClick(item, subTopic.title, activeLesson)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border-2 border-emerald-100 flex items-center gap-2"><Edit3 size={16}/> Edit</button>
                                                <button onClick={() => handleKrewDelete('TOOL', activeLesson.id, item.title)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border-2 border-red-100 flex items-center gap-2"><Trash2 size={16}/> Remove</button>
                                             </>) : (
                                                <Button variant="secondary" className="flex-1 md:flex-none py-2 px-6 text-sm font-bold border-2 shadow-none hover:border-sky-500 hover:text-sky-600" onClick={() => {
                                                   const isolatedPlaylist = [...subTopic.tools].sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                                                   onStartLesson({ chapter: activeLesson.chapter, book: activeLesson.book, subtopic: subTopic.title, flow: isolatedPlaylist }, index);
                                                }}>{item.isPremium && !isLoggedIn ? <Lock size={14}/> : 'Start Tool'}</Button>
                                             )}
                                          </div>
                                       </div>
                                    )) : ( <div className="text-center py-6 text-slate-400 font-medium text-sm border-2 border-dashed border-slate-100 rounded-xl">No tools here yet.</div> )}
                                    {isEditMode && (<button onClick={() => setKrewWizard({...initialWizardState, show: true, grade: activeLesson.grade, subject: activeLesson.subject, book: activeLesson.book, chapterSelect: activeLesson.chapter, subtopicSelect: subTopic.title})} className="w-full mt-4 bg-white border-2 border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"><Plus size={18}/> Add New Tool to {subTopic.title}</button>)}
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </>
            )}
         </div>
      )}

      {showClassModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-4 border-slate-100">
            <button onClick={() => setShowClassModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"><X size={20} /></button>
            <h2 className="text-2xl font-black text-slate-800 mb-6">Manage Your Classes</h2>
            <div className="space-y-4 mb-8">
               <h3 className="font-bold text-slate-500 text-sm uppercase tracking-wider">Add a New Class</h3>
               <div className="flex gap-2">
                 <select value={newGrade} onChange={(e: any) => setNewGrade(e.target.value)} className="flex-1 bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none focus:border-sky-500"><option value="">Grade</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select>
                 <select value={newSubject} onChange={(e: any) => setNewSubject(e.target.value)} className="flex-1 bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none focus:border-sky-500"><option value="">Subject</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
               </div>
               <Button onClick={handleAddClass} disabled={!newGrade || !newSubject || isSavingClass} className="w-full py-2">{isSavingClass ? 'Adding...' : 'Add Class to Dashboard'}</Button>
            </div>
            <div className="space-y-3">
               <h3 className="font-bold text-slate-500 text-sm uppercase tracking-wider">Current Classes</h3>
               {myClasses.length === 0 && <p className="text-sm text-slate-400 font-medium">No classes added yet.</p>}
               <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                 {myClasses.map(cls => (
                   <div key={cls.id} className="flex items-center justify-between bg-slate-50 border-2 border-slate-100 p-3 rounded-xl">
                      <span className="font-bold text-slate-700 text-sm">{cls.grade} • {cls.subject}</span>
                      <button onClick={() => handleRemoveClass(cls.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      
         {/* MANAGE STUDENT MODAL (DUAL TAB APAAR ARCHITECTURE) */}
      {showManageStudentModal && (
         <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4 py-8 overflow-y-auto">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative border-4 border-slate-100 my-auto">
               <button onClick={() => setShowManageStudentModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"><X size={20} /></button>
               
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center"><Users size={28} className="text-sky-500"/></div>
                  <div><h2 className="text-2xl font-black text-slate-800">Student Management</h2><p className="text-slate-500 text-sm font-bold">Securely add students using their unique APAAR ID.</p></div>
               </div>

               {/* TAB TOGGLE */}
               <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-full mb-6">
                  <button onClick={() => setStudentModalTab('create')} className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase transition-all ${studentModalTab === 'create' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'}`}>Create New Profile</button>
                  <button onClick={() => setStudentModalTab('import')} className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase transition-all ${studentModalTab === 'import' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'}`}>Import Existing</button>
               </div>

               {studentModalTab === 'create' ? (
                  <div className="space-y-4">
                     <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 text-xs font-bold text-sky-700 mb-2">Create the academic record. Parents will claim it later to generate secure logins.</div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">12-Digit APAAR ID *</label><input type="text" maxLength={12} placeholder="e.g. 123456789012" value={newStudentForm.apaarId} onChange={(e: any) => setNewStudentForm({...newStudentForm, apaarId: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-700 outline-none focus:border-sky-500 tracking-[0.2em]" /></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Student Full Name *</label><input type="text" value={newStudentForm.fullName} onChange={(e: any) => setNewStudentForm({...newStudentForm, fullName: e.target.value})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" /></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Date of Birth *</label><input type="date" value={newStudentForm.dob} onChange={(e: any) => setNewStudentForm({...newStudentForm, dob: e.target.value})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" /><div className="text-[10px] font-black text-sky-600 text-right mt-1">Calculated Age: {calculateAge(newStudentForm.dob)}</div></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Father's Name *</label><input type="text" value={newStudentForm.fathersName} onChange={(e: any) => setNewStudentForm({...newStudentForm, fathersName: e.target.value})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" /></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Mother's Name *</label><input type="text" value={newStudentForm.mothersName} onChange={(e: any) => setNewStudentForm({...newStudentForm, mothersName: e.target.value})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" /></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Contact 1 (Compulsory) *</label><input type="text" maxLength={10} value={newStudentForm.contact1} onChange={(e: any) => setNewStudentForm({...newStudentForm, contact1: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" /><div className="flex items-center gap-2 mt-2"><input type="checkbox" checked={newStudentForm.isWhatsapp1} onChange={(e: any) => setNewStudentForm({...newStudentForm, isWhatsapp1: e.target.checked})} className="accent-green-500 cursor-pointer" /><label className="text-[10px] font-bold text-slate-500 cursor-pointer"> This is a WhatsApp Number</label></div></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Contact 2 (Optional)</label><input type="text" maxLength={10} value={newStudentForm.contact2} onChange={(e: any) => setNewStudentForm({...newStudentForm, contact2: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" /></div>
                     </div>
                     
                     <div className="pt-4 border-t-2 border-slate-100">
                        <label className="block text-xs font-black text-slate-700 mb-3 uppercase tracking-wider">Assign to Your Classes *</label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                           {myClasses.map(cls => {
                              const classStr = `${cls.grade} • ${cls.subject}`;
                              const isSelected = newStudentForm.selectedClasses.includes(classStr);
                              return (
                                 <button key={cls.id} onClick={() => toggleClassSelection('create', classStr)} className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${isSelected ? 'bg-sky-50 border-sky-500 text-sky-700' : 'bg-white border-slate-200 text-slate-500 hover:border-sky-300'}`}>{classStr}</button>
                              );
                           })}
                           {myClasses.length === 0 && <span className="text-xs text-rose-500 font-bold">You need to add Classes to your Dashboard first!</span>}
                        </div>
                     </div>
                     <Button onClick={handleCreateStudent} disabled={isSavingStudent} className="w-full py-4 text-lg mt-4">{isSavingStudent ? 'Saving Profile...' : 'Create Student Profile'}</Button>
                  </div>
               ) : (
                  <div className="space-y-6">
                     <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs font-bold text-amber-700 mb-2">Security Check: To import a student, you must verify both their APAAR ID and their exact Date of Birth.</div>
                     <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">12-Digit APAAR ID *</label><input type="text" maxLength={12} placeholder="e.g. 123456789012" value={importForm.apaarId} onChange={(e: any) => setImportForm({...importForm, apaarId: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-4 font-mono font-bold text-slate-700 outline-none focus:border-sky-500 tracking-[0.2em] text-center text-xl" /></div>
                     <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Verify Date of Birth *</label><input type="date" value={importForm.dob} onChange={(e: any) => setImportForm({...importForm, dob: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" /></div>
                     <div className="pt-4 border-t-2 border-slate-100">
                        <label className="block text-xs font-black text-slate-700 mb-3 uppercase tracking-wider">Assign to Your Classes *</label>
                        <div className="flex flex-wrap gap-2">
                           {myClasses.map(cls => {
                              const classStr = `${cls.grade} • ${cls.subject}`;
                              const isSelected = importForm.selectedClasses.includes(classStr);
                              return (
                                 <button key={cls.id} onClick={() => toggleClassSelection('import', classStr)} className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${isSelected ? 'bg-sky-50 border-sky-500 text-sky-700' : 'bg-white border-slate-200 text-slate-500 hover:border-sky-300'}`}>{classStr}</button>
                              );
                           })}
                        </div>
                     </div>
                     <Button onClick={handleImportStudent} disabled={isSavingStudent} className="w-full py-4 text-lg bg-sky-600 hover:bg-sky-700">{isSavingStudent ? 'Searching...' : 'Verify & Import Student'}</Button>
                  </div>
               )}
            </div>
         </div>
      )}

      {krewEdit.show && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-4 border-emerald-100">
               <button onClick={() => setKrewEdit({...krewEdit, show: false})} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"><X size={20} /></button>
               <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4"><Edit3 size={28} className="text-emerald-500"/></div>
               <h2 className="text-2xl font-black text-slate-800 mb-2">Edit {krewEdit.type}</h2>
               <p className="text-slate-500 text-sm font-bold mb-6">Rename '{krewEdit.oldTitle}'</p>
               <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">New Title *</label>
               <input type="text" autoFocus value={krewEdit.newTitle || ''} onChange={(e: any) => setKrewEdit({...krewEdit, newTitle: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500 mb-6" />
               <Button onClick={handleSendQuickEdit} disabled={!krewEdit.newTitle || isSendingRequest || krewEdit.newTitle === krewEdit.oldTitle} className="w-full bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 py-3 text-lg">{isSendingRequest ? 'Sending...' : 'Submit Edit Request'}</Button>
            </div>
         </div>
      )}

      {krewWizard.show && (
         <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in px-4 py-12 sm:py-24 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full shadow-2xl relative border-4 border-emerald-100 my-auto">
               <button onClick={() => setKrewWizard(initialWizardState)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"><X size={20} /></button>
               
               <div className="flex items-center gap-4 mb-8 border-b-2 border-slate-100 pb-6">
                  <div className={`w-14 h-14 ${krewWizard.toolSelect && krewWizard.toolSelect !== 'NEW' ? 'bg-amber-100' : 'bg-emerald-100'} rounded-2xl flex items-center justify-center transform -rotate-3`}>
                     <Database size={28} className={krewWizard.toolSelect && krewWizard.toolSelect !== 'NEW' ? 'text-amber-500' : 'text-emerald-500'}/>
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-800">{krewWizard.toolSelect && krewWizard.toolSelect !== 'NEW' ? 'Edit Database Record' : 'Content Upload Wizard'}</h2>
                     <p className="text-slate-500 font-bold text-sm">Follow the 12 steps below to map content correctly.</p>
                  </div>
               </div>

               <div className="space-y-6">
                  {/* STEPS 1-2: Core */}
                  <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">1. Grade *</label><select value={krewWizard.grade} onChange={(e: any) => setKrewWizard({...initialWizardState, show: true, grade: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500"><option value="">Select Grade...</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                     <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">2. Subject *</label><select value={krewWizard.subject} onChange={(e: any) => setKrewWizard({...krewWizard, subject: e.target.value, chapterSelect: '', subtopicSelect: '', toolSelect: ''})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500"><option value="">Select Subject...</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  </div>

                  {/* STEPS 3-4: Chapter */}
                  <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="md:col-span-3">
                         <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">3. Chapter Name *</label>
                         <div className="flex gap-2">
                             <select value={krewWizard.chapterSelect} onChange={(e: any) => {
                                 const val = e.target.value;
                                 if (val === 'NEW') {
                                     // Cascade NEW downwards
                                     setKrewWizard({...krewWizard, chapterSelect: 'NEW', chapterNumber: '', subtopicSelect: 'NEW', newSubtopic: '', subtopicOrder: '', toolSelect: 'NEW', toolOrder: '', toolType: 'Conceptualiser', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                 } else {
                                     const chap = wizardData.find((c: any) => c.chapter === val);
                                     setKrewWizard({...krewWizard, chapterSelect: val, chapterNumber: chap?.chapter_number || '', subtopicSelect: '', newSubtopic: '', subtopicOrder: '', toolSelect: '', toolOrder: '', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                 }
                             }} disabled={!krewWizard.subject} className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-50">
                                 <option value="" disabled>Select Existing...</option>
                                 {wizardData.map((c: any) => <option key={c.chapter} value={c.chapter}>{c.chapter}</option>)}
                                 <option value="NEW" className="font-bold text-emerald-600">+ Create New Chapter</option>
                             </select>
                             
                             {krewWizard.chapterSelect === 'NEW' && (<input type="text" value={krewWizard.newChapter} onChange={(e: any) => setKrewWizard({...krewWizard, newChapter: e.target.value})} className="flex-1 bg-white border-2 border-emerald-400 rounded-xl px-4 py-3 font-bold text-emerald-700 outline-none" placeholder="Enter new chapter name..." />)}
                         </div>
                     </div>
                     <div className="md:col-span-1"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">4. Chapter No.</label><input type="number" min="1" value={krewWizard.chapterNumber} onChange={(e: any) => setKrewWizard({...krewWizard, chapterNumber: e.target.value})} disabled={krewWizard.chapterSelect !== 'NEW'} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-black text-center text-slate-700 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400" /></div>
                  </div>

                  {/* STEPS 5-6: Subtopic */}
                  <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="md:col-span-3">
                         <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">5. Subtopic Name *</label>
                         <div className="flex gap-2">
                             <select value={krewWizard.subtopicSelect} onChange={(e: any) => {
                                 const val = e.target.value;
                                 if (val === 'NEW') {
                                     setKrewWizard({...krewWizard, subtopicSelect: 'NEW', newSubtopic: '', subtopicOrder: '', toolSelect: 'NEW', toolOrder: '', toolType: 'Conceptualiser', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                 } else {
                                     const sub = availableSubtopics.find((s: any) => s.title === val);
                                     setKrewWizard({...krewWizard, subtopicSelect: val, subtopicOrder: sub?.order || '', toolSelect: '', toolOrder: '', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                 }
                             }} disabled={!krewWizard.chapterSelect || krewWizard.chapterSelect === 'NEW'} className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-50">
                                {krewWizard.chapterSelect === 'NEW' ? <option value="NEW" className="font-bold text-emerald-600">+ Create New Subtopic</option> : <><option value="" disabled>Select Existing...</option>{availableSubtopics.map((s: any, idx: number) => <option key={idx} value={s.title}>{s.title}</option>)}<option value="NEW" className="font-bold text-emerald-600">+ Create New Subtopic</option></>}
                             </select>
                             
                             {krewWizard.subtopicSelect === 'NEW' && (<input type="text" value={krewWizard.newSubtopic} onChange={(e: any) => setKrewWizard({...krewWizard, newSubtopic: e.target.value})} className="flex-1 bg-white border-2 border-emerald-400 rounded-xl px-4 py-3 font-bold text-emerald-700 outline-none" placeholder="Enter new subtopic name..." />)}
                         </div>
                     </div>
                     <div className="md:col-span-1"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">6. Subtopic Order</label><input type="number" min="1" value={krewWizard.subtopicOrder} onChange={(e: any) => setKrewWizard({...krewWizard, subtopicOrder: e.target.value})} disabled={krewWizard.subtopicSelect !== 'NEW'} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-black text-center text-slate-700 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400" /></div>
                  </div>

                  {/* STEPS 7-12: The Tool (Content) */}
                  <div className={`${krewWizard.toolSelect && krewWizard.toolSelect !== 'NEW' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'} p-5 rounded-2xl border-2 space-y-4`}>
                     <div className="flex justify-between items-center mb-2">
                        <label className={`block text-sm font-black ${krewWizard.toolSelect && krewWizard.toolSelect !== 'NEW' ? 'text-amber-700' : 'text-emerald-700'} uppercase tracking-wider`}>Tool Configuration</label>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border-2 border-slate-200">
                           <input type="checkbox" id="feat" checked={krewWizard.isFeatured} onChange={(e: any) => setKrewWizard({...krewWizard, isFeatured: e.target.checked})} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                           <label htmlFor="feat" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1"><Sparkles size={14} className="text-emerald-500"/> Is Featured?</label>
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
                             }} disabled={!krewWizard.subtopicSelect || krewWizard.subtopicSelect === 'NEW'} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-50">
                                {krewWizard.subtopicSelect === 'NEW' ? <option value="NEW" className="font-bold text-emerald-600">+ Upload New Content</option> : <><option value="" disabled>Select Existing Content to Edit...</option>{availableTools.map((t: any, idx: number) => <option key={idx} value={t.title}>{t.title} ({t.type || t.content_type})</option>)}<option value="NEW" className="font-bold text-emerald-600">+ Upload New Content</option></>}
                             </select>
                         </div>
                         <div className="md:col-span-1"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">8. Tool Order</label><input type="number" min="1" value={krewWizard.toolOrder} onChange={(e: any) => setKrewWizard({...krewWizard, toolOrder: e.target.value})} disabled={krewWizard.toolSelect !== 'NEW'} className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-3 font-black text-center text-slate-700 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400" /></div>
                     </div>

                     {krewWizard.toolSelect && (
                         <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                   <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">9. Content Type</label>
                                   <select value={krewWizard.toolType} onChange={(e: any) => setKrewWizard({...krewWizard, toolType: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500">
                                      <option value="Conceptualiser">Conceptualiser</option><option value="Video">Video</option><option value="Quiz">Quiz</option><option value="PDF">PDF</option><option value="Game">Game</option>
                                   </select>
                                </div>
                                <div className="md:col-span-2"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">10. Title of Content *</label><input type="text" value={krewWizard.toolTitle} onChange={(e: any) => setKrewWizard({...krewWizard, toolTitle: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500" placeholder="e.g. Place Value 3D" /></div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">11. Image URL (Thumbnail)</label><input type="text" value={krewWizard.imageUrl} onChange={(e: any) => setKrewWizard({...krewWizard, imageUrl: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-700 outline-none focus:border-emerald-500" placeholder="/thumbnails/math.jpg" /></div>
                               <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">12. Content Route Path *</label><input type="text" value={krewWizard.url} onChange={(e: any) => setKrewWizard({...krewWizard, url: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-700 outline-none focus:border-emerald-500 text-sm" placeholder={['Game', 'Quiz', 'Conceptualiser'].includes(krewWizard.toolType) ? "/conceptualisers/my-tool" : "https://youtube.com/..."} /></div>
                            </div>
                         </>
                     )}
                  </div>
               </div>
               
               <Button onClick={handleSubmitWizard} disabled={isSendingRequest || !krewWizard.toolTitle || !krewWizard.url} className={`w-full mt-8 ${krewWizard.toolSelect && krewWizard.toolSelect !== 'NEW' ? 'bg-amber-500 hover:bg-amber-600 border-amber-700' : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700'} border-b-4 active:border-b-0 py-5 text-lg shadow-xl`}>
                  {isSendingRequest ? 'Saving...' : (krewWizard.toolSelect && krewWizard.toolSelect !== 'NEW' ? 'Update Existing Content' : 'Save New Content')} <Database size={20} className="ml-2 inline" />
               </Button>
            </div>
         </div>
      )}
    </div>
  );
};







// ============================================================================
// SECTION 12: DIRECTOR COMMAND CENTER (WITH UPGRADED BULK UPLOAD)
// ============================================================================

const AdminView = () => {
  const [activeTab, setActiveTab] = useState('approvals');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);

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

  const handleRequestAction = async (request, actionStatus) => {
    const isApproved = actionStatus === 'APPROVED';
    if (!window.confirm(`Are you sure you want to ${isApproved ? 'APPROVE' : 'REJECT'} this request?`)) return;
    
    try {
      const adminEmail = auth.currentUser?.email || 'Admin';
      const requestRef = doc(db, 'content_requests', request.id);
      
      const getMatchedDoc = async (g, s, c) => {
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
               const sIdx = (data.subTopics || []).findIndex(s => s.title === p.oldTitle);
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
            const sIdx = oldSubTopics.findIndex(s => s.title?.toLowerCase().trim() === orig.subtopic.toLowerCase().trim());
            if (sIdx > -1) {
               oldSubTopics[sIdx].tools = (oldSubTopics[sIdx].tools || []).filter(t => t.title !== orig.toolTitle);
               await setDoc(doc(db, 'learning_tools', oldDoc.id), { subTopics: oldSubTopics }, { merge: true });
            }
         }

         const newDoc = await getMatchedDoc(p.grade, p.subject, p.chapter);
         if (!newDoc) {
             await addDoc(collection(db, 'learning_tools'), { grade: p.grade, subject: p.subject, chapter: p.chapter, book: p.book, subTopics: [{ title: p.subtopic, tools: [p.tool] }] });
         } else {
             const existingData = newDoc.data();
             let newSubTopics = existingData.subTopics || [];
             const subIndex = newSubTopics.findIndex(s => s.title?.toLowerCase().trim() === p.subtopic.toLowerCase().trim());

             if (subIndex > -1) {
                newSubTopics[subIndex].tools = (newSubTopics[subIndex].tools || []).filter(t => t.title !== p.tool.title);
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
            const subIndex = newSubTopics.findIndex(s => s.title?.toLowerCase().trim() === p.subtopic.toLowerCase().trim());
            
            if (subIndex > -1) {
               newSubTopics[subIndex].tools = (newSubTopics[subIndex].tools || []).filter(t => t.title !== p.tool.title);
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
                  data.subTopics = (data.subTopics || []).filter(s => s.title !== request.payload.title);
               } else if (request.target_type === 'TOOL') {
                  data.subTopics = (data.subTopics || []).map(sub => {
                     sub.tools = (sub.tools || []).filter(t => t.title !== request.payload.title);
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
      
      setPendingRequests(prev => prev.filter(req => req.id !== request.id));
      setRequestHistory(prev => [updatedRequest, ...prev]);
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
         <div className="flex items-center gap-6 relative z-10"><div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-indigo-300 transform -rotate-3"><Briefcase size={32} className="text-white" /></div><div><h2 className="text-3xl font-black tracking-tight">Director Dashboard</h2><div className="text-indigo-300 font-bold uppercase tracking-widest text-sm mt-1 flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> Firebase Connected</div></div></div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border-2 border-slate-100 shadow-sm w-fit">
        <button onClick={() => setActiveTab('approvals')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>Content Approvals {pendingRequests.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">{pendingRequests.length}</span>}</button>
        <button onClick={() => setActiveTab('database')} className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'database' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}><Database size={16} /> System Config</button>
      </div>

      {activeTab === 'approvals' && (
         <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6"><div><h3 className="text-2xl font-black text-slate-800">Curriculum Approval Queue</h3><p className="text-slate-500 font-medium mt-1">Review changes submitted by your Krew members before they go live.</p></div></div>
            {isLoading ? (
               <div className="py-20 text-center text-indigo-500 font-bold animate-pulse">Loading secure database...</div>
            ) : pendingRequests.length === 0 ? (
               <div className="bg-white border-2 border-slate-100 p-16 rounded-3xl text-center shadow-sm"><div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-green-500"/></div><h3 className="text-2xl font-black text-slate-800 mb-2">All Caught Up!</h3><p className="text-slate-500 font-medium">There are no pending curriculum requests from the Krew.</p></div>
            ) : (
               <div className="space-y-4">
                  {pendingRequests.map(req => {
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
                              requestHistory.map(req => (
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

export default function App() {
  // NEW: Deployment-Safe Back Button History API Wrappers
  const [currentView, _setCurrentView] = useState<string>('home'); 
  const setCurrentView = (view: string) => {
     if (typeof window !== 'undefined') {
         window.history.pushState({ type: 'view', view }, '', '');
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
  const [currentStudent, setCurrentStudent] = useState(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userEmail, setUserEmail] = useState(''); 
  const [userName, setUserName] = useState(''); 

  // FIXED: Real-time listener with STRICT token enforcement & Race Condition Fix
  useEffect(() => {
    let unsubscribeSnapshot = () => {}; // Failsafe for cleanup

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
                  
                  // NEW: Check if a login process is actively happening right now
                  const isAuthenticating = sessionStorage.getItem('kortex_is_authenticating');
                  
                  // --- STRICT SECURITY CHECK ---
                  // Only kick the user out if they are NOT currently logging in!
                  if (!isAuthenticating && data.session_token && data.session_token !== localToken) {
                     unsubscribeSnapshot(); // 1. Kill the listener FIRST
                     logout();              // 2. Then log out safely
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
             (error) => {
               console.warn("Secure disconnect triggered. Listener closed.");
             }
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
  
  

  // NEW: Real-time session listener for Custom Student Accounts (Crash-Proof)
  useEffect(() => {
    let unsubscribeStudent = () => {};
    
    if (role === 'student' && currentStudent?.id) {
       unsubscribeStudent = onSnapshot(
          doc(db, "managed_students", currentStudent.id), 
          (docSnap) => {
             if (docSnap.exists()) {
                const data = docSnap.data();
                const localToken = localStorage.getItem('kortex_student_session_token');
                
                // --- STRICT SECURITY CHECK FOR STUDENTS ---
                if (data.session_token && data.session_token !== localToken) {
                   unsubscribeStudent(); // Kill listener FIRST
                   logout();
                   setAlertConfig({ 
                      title: "Playtime Paused", 
                      message: "You were logged out because someone else started playing on this account from another device!",
                      type: "warning" 
                   });
                }
             }
          },
          (error) => {
             console.warn("Student secure disconnect triggered.");
          }
       );
    }
    
    return () => unsubscribeStudent();
  }, [role, currentStudent]);



  
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

  // NEW: Vercel-Safe Back Button Listener
  useEffect(() => {
    // SSR Failsafe
    if (typeof window === 'undefined') return;

    // 1. Log the starting page so we have a baseline to go back to
    window.history.replaceState({ type: 'init', view: 'home' }, '', '');

    // 2. Intercept the physical back button
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      
      // Safety measure: Always close open modals/lessons when Back is pressed
      _setPlayingLesson(null);
      setShowAuthModal(false);

      if (state) {
        // Restore the previous view or role
        if (state.view) _setCurrentView(state.view);
        if (state.role !== undefined) _setRole(state.role);
      } else {
        // Failsafe: If no history exists, go Home
        _setCurrentView('home');
        _setRole(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

  // FIXED: Manual logout completely wipes the state, solving the student PIN issue safely.
  const logout = async () => {
    try { 
       if (auth.currentUser) {
          await signOut(auth); 
       }
       
       // NEW: Clear the security tokens from this device!
       localStorage.removeItem('kortex_session_token');
       localStorage.removeItem('kortex_student_session_token');

       // Manually wipe all UI state upon logging out
       setRole(null); 
       setIsPro(false); 
       setIsLoggedIn(false); 
       setCurrentStudent(null); 
       setStage(null); 
       setCurrentView('home'); 
    } catch (error: any) { console.error(error); }
  };

  const requireAuth = (actionCallback, message = "Please sign in to access this feature.") => {
    if (isLoggedIn) actionCallback(); else { setAuthMessage(message); setShowAuthModal(true); }
  };

  const handleStartDemo = () => {
    // 100% Frictionless PLG Demo: Showcases all 5 tiers instantly.
    setPlayingLesson({
      chapter: 'Master Demo: Place Value', book: 'The 5-Tier Experience',
      flow: [
        { type: 'Conceptualiser', content_type: 'conceptualiser', title: '1. Sandbox: Block Builder', content_url: '/demo/concept', color: 'bg-purple-500', isPremium: false },
        { type: 'Video', content_type: 'video', title: '2. Theatre: Tens & Ones', content_url: 'https://www.youtube.com/watch?v=1F3AycED1i4', color: 'bg-pink-500', isPremium: false },
        { type: 'Quiz', content_type: 'quiz', title: '3. Dojo: Quick Check', content_url: '/demo/quiz', color: 'bg-orange-500', isPremium: false },
        { type: 'PDF', content_type: 'pdf', title: '4. Workbook: Visual Guide', content_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', color: 'bg-sky-500', isPremium: false },
        { type: 'Game', content_type: 'game', title: '5. Arcade: Value Pop', content_url: '/demo/game', color: 'bg-lime-500', isPremium: false }
      ]
    });
    setPlayingStep(0);
  };

  const handleOpenFeatured = (item: any) => {
      // Stripped out auth checks. Plays instantly.
      const playableLesson = {
        chapter: item.chapter_name || item.lessonContext?.chapter || item.title || 'Interactive Module',
        book: item.book || item.lessonContext?.book || 'Kortex Klassroom',
        flow: [item] 
      };
      setPlayingLesson(playableLesson);
      setPlayingStep(0);
  };

  const handleStartLesson = (lesson: any, stepIndex: any) => {
      // Stripped out auth checks. Plays instantly.
       setPlayingLesson(lesson); 
       setPlayingStep(stepIndex); 
  };

  const renderContent = () => {
    // 1. Standalone Curriculum Page
    if (currentView === 'lessons') return <LessonsView isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onStartLesson={handleStartLesson} />;
    
    // 2. The 5 Dynamic Tier Pages
    const activeTierObj = FIVE_TIERS?.find(t => t.id === currentView);
    if (activeTierObj) {
      return <TierLibraryView activeTier={activeTierObj} isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onOpenTool={handleOpenFeatured} />;
    }

    // 3. User Dashboards
    if (role === 'student') return <StudentView t={t} onStartLesson={handleStartLesson} currentStudent={currentStudent} isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} />;
    if (role === 'parent') return <ParentView t={t} isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onStartDemo={handleStartDemo} isPro={isPro} />;
    if (role === 'teacher' || role === 'krew') return <TeacherView userName={userName} t={t} isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onStartLesson={handleStartLesson} targetContext={targetContext} isPro={isPro} role={role} />;
    if (role === 'admin') return <AdminView />;
    
    // 4. Landing Page
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
          lesson={playingLesson} initialStep={playingStep} isPro={true} isLoggedIn={true} // Hardcoded to prevent guest lockouts
          onClose={() => setPlayingLesson(null)} 
          onFinish={() => setPlayingLesson(null)} // Silent exit on finish
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