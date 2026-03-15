"use client";
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Brain, Activity, User, Users, FileText, BarChart, 
  Settings, Globe, Play, LogOut, CheckCircle, Clock, Search, 
  Heart, Zap, BookMarked, Star, Video, Gamepad2, Menu, X, ArrowRight, ChevronLeft, Layers,
  Lock, Unlock, Shield, Timer, Calendar, Pause, RotateCcw,
  Calculator, Leaf, Palette, Music, Monitor, Type, Check, Bell
} from 'lucide-react';

// --- CURRICULUM CONSTANTS ---
const GRADES = [
  'Balvatika 1', 'Balvatika 2', 'Balvatika 3', 
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 
  'Grade 10', 'Grade 11', 'Grade 12'
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

// --- MOCK DATA & TRANSLATIONS ---
const TRANSLATIONS = {
  en: {
    app_name: "Kortex Klassroom",
    select_role: "Select Your Role",
    student: "Student",
    teacher: "Teacher",
    parent: "Parent",
    wellness_break: "Mindfulness Break",
    breathe_in: "Breathe In...",
    breathe_out: "Breathe Out...",
    competencies: "Competency Tracker"
  },
  hi: {
    app_name: "कॉर्टेक्स क्लासरूम",
    select_role: "अपनी भूमिका चुनें",
    student: "छात्र",
    teacher: "शिक्षक",
    parent: "अभिभावक",
    wellness_break: "माइंडफुलनेस ब्रेक",
    breathe_in: "सांस अंदर लें...",
    breathe_out: "सांस छोड़ें...",
    competencies: "क्षमता ट्रैकर"
  }
};

const COMPETENCIES = [
  { name: "Number Sense & Operations", score: 85, color: "bg-sky-500" },
  { name: "Critical Thinking", score: 60, color: "bg-purple-500" },
  { name: "Scientific Temper", score: 75, color: "bg-lime-500" },
  { name: "Language & Communication", score: 90, color: "bg-orange-500" },
];

// --- DEMO LESSONS CONSTANTS ---
const DEMO_LESSONS = [
  {
    id: 'demo-maths',
    title: 'The Magic of Fractions',
    subject: 'Maths',
    icon: Calculator,
    color: 'bg-rose-500',
    lightColor: 'bg-rose-100',
    flow: [
      { type: 'Video', title: 'Intro to Fractions', desc: 'Understanding equal parts.', duration: '2:15' },
      { type: 'Game', title: 'Pizza Slicer', desc: 'Slice the pizza into perfect thirds!', interactive: true },
      { type: 'Video', title: 'Adding Fractions', desc: 'Combining slices together.', duration: '3:00' },
      { type: 'Game', title: 'Fraction Ninja', desc: 'Match the fractions quickly to win!', interactive: true }
    ]
  },
  {
    id: 'demo-language',
    title: 'Noun Types & Adventures',
    subject: 'English',
    icon: Type,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100',
    flow: [
      { type: 'Video', title: 'What is a Noun?', desc: 'Person, place, or thing.', duration: '2:45' },
      { type: 'Game', title: 'Noun Catcher', desc: 'Catch the falling nouns in the basket!', interactive: true },
      { type: 'Video', title: 'Proper vs Common', desc: 'Capitalizing special names.', duration: '1:50' },
      { type: 'Game', title: 'Grammar Detective', desc: 'Find the hidden proper nouns.', interactive: true }
    ]
  },
  {
    id: 'demo-evs',
    title: 'The Water Cycle 3D',
    subject: 'EVS',
    icon: Leaf,
    color: 'bg-lime-500',
    lightColor: 'bg-lime-100',
    flow: [
      { type: 'Video', title: 'Evaporation', desc: 'How water travels to the sky.', duration: '3:10' },
      { type: 'Game', title: 'Cloud Maker', desc: 'Gather vapor to form rain clouds.', interactive: true },
      { type: 'Video', title: 'Precipitation', desc: 'When the rain falls back down.', duration: '2:20' },
      { type: 'Game', title: 'Ecosystem Balance', desc: 'Direct water to the thirsty plants!', interactive: true }
    ]
  }
];

// --- MOCK LESSON DATA ---
const generateMockLessonData = () => {
  const data = {};
  GRADES.forEach(grade => {
    data[grade] = {};
    SUBJECTS.forEach(subject => {
      data[grade][subject] = [
        {
          id: `${grade.replace(/\s+/g, '-').toLowerCase()}-${subject.replace(/\s+/g, '-').toLowerCase()}-1`,
          chapter: `Chapter 1: Basics of ${subject}`,
          book: `${grade} ${subject}`,
          flow: [
            { type: 'Video', title: `Introduction to ${subject}`, duration: '10 min', icon: Video, color: 'bg-pink-500' },
            { type: 'Presentation', title: 'Key Concepts & Fundamentals', pages: '12 Slides', icon: Layers, color: 'bg-sky-500' },
            { type: 'Game', title: 'Interactive Knowledge Check', interactive: true, icon: Gamepad2, color: 'bg-orange-500', isPremium: false }
          ]
        },
        {
          id: `${grade.replace(/\s+/g, '-').toLowerCase()}-${subject.replace(/\s+/g, '-').toLowerCase()}-2`,
          chapter: `Chapter 2: Exploring ${subject} Further`,
          book: `${grade} ${subject}`,
          flow: [
            { type: 'Video', title: `Deep Dive into ${subject}`, duration: '15 min', icon: Video, color: 'bg-pink-500' },
            { type: 'Game', title: 'Concept Explorer', interactive: true, icon: Gamepad2, color: 'bg-orange-500', isPremium: true }
          ]
        },
        {
          id: `${grade.replace(/\s+/g, '-').toLowerCase()}-${subject.replace(/\s+/g, '-').toLowerCase()}-3`,
          chapter: `Chapter 3: Applying ${subject} Skills`,
          book: `${grade} ${subject}`,
          flow: [
            { type: 'Presentation', title: 'Real-world Applications', pages: '18 Slides', icon: Layers, color: 'bg-sky-500' },
            { type: 'Video', title: 'Summary & Review', duration: '8 min', icon: Video, color: 'bg-pink-500' },
            { type: 'Game', title: 'Final Assessment Challenge', interactive: true, icon: Gamepad2, color: 'bg-orange-500', isPremium: true }
          ]
        }
      ];
    });
  });
  return data;
};

const LESSON_DATA = generateMockLessonData();

// Extract all games dynamically from the generated curriculum for the Games Portal
const ALL_GAMES = [];
Object.keys(LESSON_DATA).forEach(grade => {
  Object.keys(LESSON_DATA[grade]).forEach(subject => {
    LESSON_DATA[grade][subject].forEach(lesson => {
      lesson.flow.forEach((item, idx) => {
        if (item.type === 'Game') {
          const images = [
            'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=400&h=300',
            'https://images.unsplash.com/photo-1512820200502-0e319914ea6c?auto=format&fit=crop&q=80&w=400&h=300',
            'https://images.unsplash.com/photo-1526379095098-d400fd0bfce8?auto=format&fit=crop&q=80&w=400&h=300',
            'https://images.unsplash.com/photo-1453733190371-0a9bedd82893?auto=format&fit=crop&q=80&w=400&h=300'
          ];
          ALL_GAMES.push({
            ...item,
            id: `${lesson.id}-g${idx}`,
            grade: grade,
            subject: subject,
            image: images[(grade.length + subject.length + idx) % images.length],
            lessonContext: lesson,
            stepIndex: idx
          });
        }
      });
    });
  });
});

// --- FEATURED MOCK DATA FOR LANDING PAGE ---
const FEATURED_TOOLS = [
  { id: 't1', type: 'Video', title: 'Water Cycle 3D', subject: 'EVS', grade: 'Grade 4', icon: Video, color: 'bg-pink-500', isPremium: true, image: 'https://images.unsplash.com/photo-1527482813136-1264b38340d8?auto=format&fit=crop&q=80&w=400&h=300' },
  { id: 't2', type: 'Presentation', title: 'Noun Types', subject: 'English', grade: 'Grade 3', icon: Layers, color: 'bg-sky-500', isPremium: false, image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400&h=300' },
  { id: 't3', type: 'Video', title: 'Solar System Tour', subject: 'SST', grade: 'Grade 8', icon: Video, color: 'bg-purple-500', isPremium: false, image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400&h=300' },
];

const FEATURED_GAMES = ALL_GAMES.slice(0, 4); // Dynamically grab 4 games to feature

const FEATURED_LESSONS = [
  { id: 'l1', chapter: 'Basics of Artificial Intelligence', grade: 'Grade 10', subject: 'Computers and AI', book: 'Grade 10 Computers and AI', items: 5, color: 'border-sky-500', bg: 'bg-sky-50', hover: 'hover:border-sky-400', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=500&h=300', isPremium: false },
  { id: 'l2', chapter: 'Fractions & Decimals', grade: 'Grade 5', subject: 'Maths', book: 'Grade 5 Maths', items: 4, color: 'border-orange-500', bg: 'bg-orange-50', hover: 'hover:border-orange-400', image: 'https://images.unsplash.com/photo-1611078693895-816d7a4cb2aa?auto=format&fit=crop&q=80&w=500&h=300', isPremium: false },
  { id: 'l3', chapter: 'The Delhi Sultanate', grade: 'Grade 7', subject: 'SST', book: 'Grade 7 SST', items: 6, color: 'border-lime-500', bg: 'bg-lime-50', hover: 'hover:border-lime-400', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=500&h=300', isPremium: false },
  { id: 'l4', chapter: 'Grammar: Tenses', grade: 'Grade 6', subject: 'English', book: 'Grade 6 English', items: 3, color: 'border-pink-500', bg: 'bg-pink-50', hover: 'hover:border-pink-400', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=500&h=300', isPremium: false },
];

const TESTIMONIALS = [
  { 
    name: "Priya Sharma", 
    role: "Parent of Grade 4 Student", 
    text: "Kortex Klassroom has completely transformed how my son learns. The gamified approach keeps him engaged, and I love tracking his holistic growth!", 
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffdfbf" 
  },
  { 
    name: "Rahul Verma", 
    role: "High School Teacher", 
    text: "The lesson plans and auto-generated analytics are a lifesaver. It aligns perfectly with the NCF and saves me hours of planning every single week.", 
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&backgroundColor=b6e3f4" 
  },
  { 
    name: "Anita Desai", 
    role: "School Principal", 
    text: "A truly complete platform. The focus on both academic competencies and mental wellbeing makes this the gold standard for NEP 2020 implementation.", 
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anita&backgroundColor=c0aede" 
  }
];

// --- COMPONENTS ---

const Card = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-3xl shadow-sm border-2 border-slate-100 overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-sky-200' : ''} ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled }) => {
  const variants = {
    primary: "bg-sky-500 text-white hover:bg-sky-600 shadow-md hover:shadow-lg border-b-4 border-sky-700 active:border-b-0 active:translate-y-1",
    secondary: "bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    fun: "bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg border-b-4 border-orange-700 active:border-b-0 active:translate-y-1",
    green: "bg-lime-500 text-white hover:bg-lime-600 shadow-md hover:shadow-lg border-b-4 border-lime-700 active:border-b-0 active:translate-y-1",
    outline: "border-2 border-sky-500 text-sky-500 hover:bg-sky-50"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`px-6 py-3 rounded-full flex items-center justify-center gap-2 font-bold transition-all ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed active:border-b-4 active:translate-y-0' : ''}`}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};

const ProgressBar = ({ label, percentage, colorClass }) => (
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

// --- EXTRACTED COMPONENTS (To prevent re-renders and flickering) ---

const LiveDateTime = ({ lang }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-center gap-4 shrink-0">
      <span className="flex items-center gap-1.5 text-slate-300">
        <Calendar size={12} /> {currentTime.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
      <span className="flex items-center gap-1.5 text-slate-300">
        <Clock size={12} /> {currentTime.toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

const QuickToolsModal = ({ onClose }) => {
  const [timerMode, setTimerMode] = useState('stopwatch'); // 'stopwatch' | 'timer'
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  useEffect(() => {
    let interval;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (timerMode === 'timer' && prev <= 1) {
            setIsTimerActive(false);
            return 0; // stop at 0
          }
          return timerMode === 'stopwatch' ? prev + 1 : prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerMode]);

  const formatTimerDisplay = (totalSecs) => {
    const m = Math.floor(Math.abs(totalSecs) / 60).toString().padStart(2, '0');
    const s = (Math.abs(totalSecs) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border-4 border-slate-100 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2">
          <X size={20} />
        </button>
        
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600 shadow-sm">
            <Timer size={24} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Quick Tools</h2>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button onClick={() => {setTimerMode('stopwatch'); setIsTimerActive(false); setTimerSeconds(0);}} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors ${timerMode === 'stopwatch' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Stopwatch</button>
          <button onClick={() => {setTimerMode('timer'); setIsTimerActive(false); setTimerSeconds(300);}} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors ${timerMode === 'timer' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Timer</button>
        </div>

        <div className="text-7xl font-black text-slate-800 mb-8 tabular-nums tracking-tighter">
          {formatTimerDisplay(timerSeconds)}
        </div>

        {timerMode === 'timer' && !isTimerActive && timerSeconds === 0 && (
           <div className="flex gap-2 justify-center mb-6">
              <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => setTimerSeconds(60)}>+1 Min</Button>
              <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => setTimerSeconds(300)}>+5 Min</Button>
              <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => setTimerSeconds(600)}>+10 Min</Button>
           </div>
        )}

        <div className="flex justify-center gap-4">
          <Button 
            onClick={() => setIsTimerActive(!isTimerActive)} 
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg p-0 border-b-4 active:border-b-0 active:translate-y-1 transition-all ${isTimerActive ? 'bg-amber-500 hover:bg-amber-600 border-amber-700' : 'bg-lime-500 hover:bg-lime-600 border-lime-700'}`}
          >
            {isTimerActive ? <Pause size={28} className="fill-white" /> : <Play size={28} className="fill-white ml-1" />}
          </Button>
          <Button 
            variant="secondary"
            onClick={() => { setIsTimerActive(false); setTimerSeconds(timerMode === 'timer' ? 300 : 0); }} 
            className="w-16 h-16 rounded-full flex items-center justify-center p-0 border-2 shadow-sm"
          >
            <RotateCcw size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const WellnessModal = ({ t, onClose }) => {
  const [wellnessTimeLeft, setWellnessTimeLeft] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setWellnessTimeLeft(p => {
        if (p <= 1) {
          onClose();
          return 30;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative border-8 border-teal-100">
        <div className="relative z-10">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <Heart size={40} className="text-teal-500 fill-teal-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">{t.wellness_break}</h2>
          <p className="text-teal-600 font-bold text-sm mb-8 bg-teal-50 inline-block px-4 py-1 rounded-full border border-teal-100">Panchakosha Vikas: Pranamaya Kosha</p>

          <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
            <div className={`absolute inset-0 bg-teal-200 rounded-full transition-all duration-[4000ms] ease-in-out ${wellnessTimeLeft % 8 > 4 ? 'scale-150 opacity-0' : 'scale-100 opacity-50'}`}></div>
            <div className={`absolute inset-4 bg-teal-300 rounded-full transition-all duration-[4000ms] ease-in-out ${wellnessTimeLeft % 8 > 4 ? 'scale-125 opacity-20' : 'scale-100 opacity-80'}`}></div>
            
            <div className="relative z-10 w-28 h-28 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-teal-300">
              <span className="text-5xl font-black">{wellnessTimeLeft}</span>
            </div>
          </div>

          <p className="text-2xl font-black text-teal-600 h-8 transition-opacity">
            {wellnessTimeLeft % 8 > 4 ? t.breathe_in : t.breathe_out}
          </p>
          
          <button 
            onClick={onClose}
            className="mt-8 text-sm font-bold text-slate-400 hover:text-slate-600 underline"
          >
            Skip Break (Not Recommended)
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthModal = ({ onClose, authMessage, onLogin, onStartDemo }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-4 border-slate-100">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"
      >
        <X size={20} />
      </button>
      
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transform -rotate-3 shadow-md">
          <Brain size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Unlock Kortex</h2>
        <p className="text-slate-500 font-medium text-sm px-4">{authMessage}</p>
      </div>

      <div className="space-y-4">
        <button 
          onClick={onLogin}
          className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        
        <button 
          onClick={onLogin}
          className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors shadow-sm"
        >
          <User size={18} /> Continue with Email
        </button>
      </div>

      <div className="mt-8 text-center border-t-2 border-slate-100 pt-6">
        <p className="text-sm font-bold text-slate-500 mb-3">Just looking around?</p>
        <div className="flex flex-col gap-3">
          <Button variant="secondary" onClick={onStartDemo} className="w-full">
            Try a Demo Lesson
          </Button>
          <button 
            onClick={onClose}
            className="text-sky-500 font-bold hover:underline text-sm"
          >
            Continue Browsing as Guest
          </button>
        </div>
      </div>
    </div>
  </div>
);

const GeneralAlertModal = ({ title, message, icon: Icon, colorClass, bgClass, onClose }) => (
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

const WorkInProgressView = ({ title, onReturn }) => (
  <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center px-4">
    <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 border-8 border-slate-50 relative">
      <Settings size={48} className="text-slate-400 animate-[spin_4s_linear_infinite]" />
      <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-full border-4 border-white">
        <Settings size={16} className="animate-[spin_3s_linear_infinite_reverse]" />
      </div>
    </div>
    <h2 className="text-4xl font-black text-slate-800 mb-4">{title} Portal</h2>
    <p className="text-xl text-slate-500 font-medium max-w-md mx-auto mb-8">
      We are crafting something amazing for this section.
    </p>
    <div className="bg-orange-50 text-orange-600 px-8 py-4 rounded-full border-2 border-orange-200 font-bold inline-flex items-center gap-3 shadow-sm">
      <span className="text-2xl">🚧</span> Currently In Progress
    </div>
    <Button variant="secondary" className="mt-8 border-2" onClick={onReturn}>Return to Home</Button>
  </div>
);

// --- DEDICATED GAMES VIEW ---
const GamesView = ({ isLoggedIn, requireAuth, onStartGame }) => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = ALL_GAMES.filter(game => {
    const matchClass = selectedClass ? game.grade === selectedClass : true;
    const matchSubject = selectedSubject ? game.subject === selectedSubject : true;
    const matchQuery = searchQuery ? game.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchClass && matchSubject && matchQuery;
  });

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto">
      
      {/* Games Hero */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-[3rem] p-10 md:p-16 text-white flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-white opacity-10 rounded-full translate-y-1/2"></div>
        
        <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-4 backdrop-blur-sm">
            <Gamepad2 size={16} /> Kortex Arcade
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">Learn through <br/>the power of play.</h1>
          <p className="text-lg text-orange-50 font-medium max-w-lg">
            Explore hundreds of interactive, curriculum-aligned games designed to make mastering new concepts incredibly fun.
          </p>
        </div>

        <div className="relative z-10 w-48 h-48 bg-white/20 rounded-[2.5rem] backdrop-blur-md border-8 border-white/30 flex items-center justify-center shadow-2xl transform rotate-3">
           <Gamepad2 size={80} className="text-white drop-shadow-md" />
        </div>
      </div>

      {/* Featured Games Strip */}
      <div className="pt-4">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
           <Star className="text-amber-400 fill-amber-400"/> Editor's Picks
        </h2>
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x hide-scrollbar">
          {FEATURED_GAMES.map((game, idx) => (
             <Card 
               key={idx} 
               className="min-w-[280px] sm:min-w-[320px] snap-start hover:border-pink-400 flex-shrink-0 cursor-pointer group relative p-0 flex flex-col border-b-4 border-b-pink-500" 
               onClick={() => {
                 if (game.isPremium) {
                   requireAuth(() => onStartGame(game.lessonContext, game.stepIndex), "This is a Premium Game. Sign up for free to access it!");
                 } else {
                   onStartGame(game.lessonContext, game.stepIndex);
                 }
               }}
             >
               <div className="relative h-40 w-full bg-slate-200 overflow-hidden">
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
                  
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                       Featured
                    </span>
                    {game.isPremium && (
                      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                        <Star size={10} className="fill-white" /> PRO
                      </div>
                    )}
                  </div>
               </div>

               <div className="p-6 bg-white flex-1 flex flex-col">
                 <h3 className="text-xl font-extrabold text-slate-800 mb-2 group-hover:text-pink-600 transition-colors flex items-center gap-2">
                   {game.title} {game.isPremium && !isLoggedIn && <Lock size={16} className="text-slate-300"/>}
                 </h3>
                 <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                   <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{game.grade}</span>
                   <span>•</span>
                   <span>{game.subject}</span>
                 </div>
               </div>
             </Card>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="font-bold text-slate-500 text-sm uppercase px-2 hidden sm:block">Filter:</span>
            <select 
              className="flex-1 md:w-40 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-pink-500 outline-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">All Grades</option>
              {GRADES.map(grade => <option key={grade} value={grade}>{grade}</option>)}
            </select>
            <select 
              className="flex-1 md:w-48 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-pink-500 outline-none"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
            </select>
         </div>
         
         <div className="relative w-full md:flex-1">
            <input 
              type="text" 
              placeholder="Search all games..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-4 pr-10 font-bold text-slate-700 focus:border-pink-500 outline-none"
            />
            <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
         </div>
      </div>

      {/* All Games Grid */}
      <div className="pb-12">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6">All Games</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.length > 0 ? filteredGames.map((game, idx) => (
             <Card 
               key={idx} 
               className="hover:border-pink-400 cursor-pointer group relative p-0 flex flex-col" 
               onClick={() => {
                 if (game.isPremium) {
                   requireAuth(() => onStartGame(game.lessonContext, game.stepIndex), "This is a Premium Game. Sign up for free to access it!");
                 } else {
                   onStartGame(game.lessonContext, game.stepIndex);
                 }
               }}
             >
               <div className="relative h-36 w-full bg-slate-200 overflow-hidden">
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>
                  {game.isPremium && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                      <Star size={10} className="fill-white" /> PRO
                    </div>
                  )}
               </div>
               <div className="p-5 bg-white flex-1 flex flex-col">
                 <h3 className="text-lg font-extrabold text-slate-800 mb-2 group-hover:text-pink-600 transition-colors leading-tight line-clamp-2">
                   {game.title} {game.isPremium && !isLoggedIn && <Lock size={14} className="text-slate-300 inline mb-0.5"/>}
                 </h3>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-auto pt-2 border-t border-slate-100">
                   <span className="text-slate-600">{game.grade}</span>
                   <span>•</span>
                   <span className="truncate">{game.subject}</span>
                 </div>
               </div>
             </Card>
          )) : (
             <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-slate-100">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Search size={24} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">No games found</h3>
                <p className="text-slate-500 font-medium">Try adjusting your filters or search query.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};


const TeacherView = ({ t, isLoggedIn, requireAuth, onStartLesson, targetContext, isPro }) => {
  const [selectedClass, setSelectedClass] = useState(targetContext?.grade || "");
  const [selectedSubject, setSelectedSubject] = useState(targetContext?.subject || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLesson, setActiveLesson] = useState(targetContext?.lesson || null);
  const [activeTab, setActiveTab] = useState('lessons');

  useEffect(() => {
    if (targetContext) {
      setSelectedClass(targetContext.grade);
      setSelectedSubject(targetContext.subject);
      setActiveLesson(targetContext.lesson);
      setActiveTab('lessons');
    }
  }, [targetContext]);

  const MY_CLASSES = [
    { grade: 'Grade 3', subject: 'EVS' },
    { grade: 'Grade 5', subject: 'English' },
    { grade: 'Grade 2', subject: 'Hindi' }
  ];

  let displayLessons = [];
  let isShowingFeatured = false;

  if (selectedClass && selectedSubject) {
    displayLessons = LESSON_DATA[selectedClass]?.[selectedSubject]?.filter(lesson => 
      lesson.chapter.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lesson.book.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  } else {
    isShowingFeatured = true;
    const f1 = LESSON_DATA['Grade 10']?.['Computers and AI']?.[0];
    const f2 = LESSON_DATA['Grade 5']?.['Maths']?.[0];
    const f3 = LESSON_DATA['Grade 4']?.['EVS']?.[0];
    const f4 = LESSON_DATA['Grade 6']?.['English']?.[0];
    displayLessons = [f1, f2, f3, f4].filter(Boolean);

    if (searchQuery) {
      displayLessons = displayLessons.filter(lesson => lesson.chapter.toLowerCase().includes(searchQuery.toLowerCase()));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-sky-50 p-6 rounded-3xl border-2 border-sky-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-sky-200 shadow-sm relative">
            <User size={32} className="text-sky-600" />
            {!isLoggedIn && (
              <div className="absolute -bottom-2 -right-2 bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border-2 border-white shadow-sm">
                Guest
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Teacher Workspace</h2>
            <p className="text-slate-600 font-medium">Manage and explore learning resources</p>
          </div>
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-full border-2 border-slate-100 shadow-sm w-fit mx-auto md:mx-0">
        <button onClick={() => {setActiveTab('lessons'); setActiveLesson(null);}} className={`px-6 py-3 rounded-full font-bold text-sm transition-colors ${activeTab === 'lessons' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>Lesson Resources</button>
        <button onClick={() => setActiveTab('analytics')} className={`px-6 py-3 rounded-full font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
          Class Analytics {!isLoggedIn && <Lock size={14} className={activeTab === 'analytics' ? 'text-sky-200' : 'text-slate-400'} />}
        </button>
        <button onClick={() => setActiveTab('students')} className={`px-6 py-3 rounded-full font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'students' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
          My Students {!isPro && <Lock size={14} className={activeTab === 'students' ? 'text-sky-200' : 'text-slate-400'} />}
        </button>
      </div>

      {activeTab === 'lessons' && !activeLesson && (
        <div className="space-y-8 animate-fade-in">
           {isLoggedIn && (
             <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookMarked size={20} className="text-sky-500" /> Your Assigned Classes</h3>
                  <Button variant="secondary" className="px-3 py-1.5 text-xs shadow-none border-2">Manage Classes</Button>
               </div>
               <div className="flex flex-wrap gap-3">
                 {MY_CLASSES.map((cls, idx) => (
                   <button
                     key={idx}
                     onClick={() => { setSelectedClass(cls.grade); setSelectedSubject(cls.subject); }}
                     className={`px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${selectedClass === cls.grade && selectedSubject === cls.subject ? 'bg-sky-500 border-sky-500 text-white shadow-md transform -translate-y-1' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-sky-50'}`}
                   >
                     {cls.grade} • {cls.subject}
                   </button>
                 ))}
               </div>
             </div>
           )}

           {/* Filters Bar */}
           <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                 <span className="font-bold text-slate-500 text-sm uppercase px-2 hidden sm:block">Filter:</span>
                 <select 
                   className="flex-1 md:w-40 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-sky-500 outline-none"
                   value={selectedClass}
                   onChange={(e) => setSelectedClass(e.target.value)}
                 >
                   <option value="">Select Grade</option>
                   {GRADES.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                 </select>
                 <select 
                   className="flex-1 md:w-48 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-sky-500 outline-none"
                   value={selectedSubject}
                   onChange={(e) => setSelectedSubject(e.target.value)}
                 >
                   <option value="">Select Subject</option>
                   {SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                 </select>
              </div>
              
              <div className="relative w-full md:flex-1">
                 <input 
                   type="text" 
                   placeholder="Search chapter name..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-4 pr-10 font-bold text-slate-700 focus:border-sky-500 outline-none"
                 />
                 <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
              </div>
           </div>

           {isShowingFeatured && !searchQuery && (
             <div className="mb-4 mt-8">
               <h3 className="text-xl font-extrabold text-slate-800">Featured Lessons</h3>
               <p className="text-slate-500 font-medium text-sm">Select a grade and subject to view specific curriculum.</p>
             </div>
           )}

           {/* Lessons Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {displayLessons.length > 0 ? displayLessons.map((lesson) => (
                 <Card key={lesson.id} className="p-6 hover:border-sky-500 flex flex-col justify-between group cursor-pointer" onClick={() => setActiveLesson(lesson)}>
                    <div>
                       <div className="flex justify-between items-start mb-4">
                          <span className="bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                             {lesson.book}
                          </span>
                          <div className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                             <Layers size={14} /> {lesson.flow.length} Items
                          </div>
                       </div>
                       <h3 className="text-xl font-extrabold text-slate-800 mb-2 group-hover:text-sky-600 transition-colors">
                          {lesson.chapter}
                       </h3>
                       <p className="text-slate-500 font-medium mb-6">Complete learning pathway including videos, presentations, and interactive modules.</p>
                    </div>
                    
                    <div className="flex items-center justify-between border-t-2 border-slate-50 pt-4">
                       <div className="flex -space-x-2">
                          {lesson.flow.slice(0, 4).map((item, idx) => {
                             const Icon = item.icon;
                             return (
                                <div key={idx} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white ${item.color} text-white shadow-sm`} title={item.type}>
                                   <Icon size={16} />
                                </div>
                             )
                          })}
                          {lesson.flow.length > 4 && (
                             <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white text-slate-600 text-xs font-bold shadow-sm">
                                +{lesson.flow.length - 4}
                             </div>
                          )}
                       </div>
                       <Button variant="secondary" className="px-4 py-2 text-sm border-2">View Flow <ArrowRight size={16} /></Button>
                    </div>
                 </Card>
              )) : (
                 <div className="col-span-full py-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Search size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No chapters found</h3>
                    <p className="text-slate-500 font-medium">Try adjusting your filters or search query. More content for {selectedClass} - {selectedSubject} is coming soon.</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Lesson Flow Detail View */}
      {activeTab === 'lessons' && activeLesson && (
        <div className="space-y-6 animate-fade-in">
           <button 
             onClick={() => setActiveLesson(null)}
             className="flex items-center gap-2 text-slate-500 font-bold hover:text-sky-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border-2 border-slate-100 w-fit"
           >
              <ChevronLeft size={20} /> Back to Chapters
           </button>

           <div className="bg-white rounded-3xl p-8 border-b-8 border-sky-500 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full -translate-y-1/2 translate-x-1/3 z-0"></div>
              <div className="relative z-10">
                 <span className="bg-sky-100 text-sky-700 text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full inline-block mb-4">
                    {activeLesson.book}
                 </span>
                 <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">{activeLesson.chapter}</h2>
                 <div className="flex gap-6 text-sm font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><Layers size={18} className="text-slate-400"/> {activeLesson.flow.length} Learning Items</span>
                    <span className="flex items-center gap-1.5"><Clock size={18} className="text-slate-400"/> Est. 2 Hours</span>
                 </div>
              </div>
           </div>

           {/* The Flow Timeline */}
           <div className="px-4 md:px-12 py-8">
              <div className="relative border-l-4 border-slate-200 space-y-8 pb-8">
                 {activeLesson.flow.map((item, index) => {
                    const Icon = item.icon;
                    return (
                       <div key={index} className="relative pl-8 md:pl-12 group animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                          <div className={`absolute -left-[26px] top-1 md:top-2 w-12 h-12 rounded-full border-4 border-white ${item.color} flex items-center justify-center text-white shadow-md z-10 group-hover:scale-110 transition-transform`}>
                             <Icon size={20} />
                          </div>
                          
                          <Card className="p-5 md:p-6 border-2 hover:border-sky-300">
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Step {index + 1} • {item.type}
                                     </span>
                                     {item.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1"><Star size={8} className="fill-amber-700"/> Pro</span>}
                                   </div>
                                   <h4 className="text-xl font-extrabold text-slate-800">{item.title}</h4>
                                   <p className="text-slate-500 font-medium mt-1">
                                      {item.duration || item.pages || item.questions || (item.interactive && "Interactive Module")}
                                   </p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                   <Button 
                                     variant="secondary" 
                                     className="flex-1 md:flex-none py-2 px-4 text-sm font-bold border-2"
                                     onClick={() => onStartLesson(activeLesson, index)}
                                   >
                                     {item.isPremium && !isLoggedIn ? <Lock size={14}/> : 'Start'}
                                   </Button>
                                   <Button 
                                     variant="primary" 
                                     className="flex-1 md:flex-none py-2 px-4 text-sm font-bold shadow-none"
                                     onClick={() => requireAuth(() => alert("Assigned to Class!"), "Please log in to assign homework and track student progress.")}
                                   >
                                     Assign
                                   </Button>
                                </div>
                             </div>
                          </Card>
                       </div>
                    );
                 })}
                 <div className="absolute -left-[14px] bottom-0 w-6 h-6 rounded-full border-4 border-white bg-slate-300"></div>
              </div>
           </div>
        </div>
      )}

      {/* LOCKED ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="relative space-y-6">
           {!isLoggedIn && (
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-3xl border-2 border-slate-100">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm border-2 border-slate-100">
                   <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock size={32} className="text-sky-500" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-800 mb-2">Unlock Analytics</h3>
                   <p className="text-slate-500 font-medium mb-6">Create a free teacher account to track student progress and view AI-powered competency insights.</p>
                   <Button className="w-full py-3" onClick={() => requireAuth(() => {}, "Sign up to view your class competency tracker.")}>
                      Sign Up Now
                   </Button>
                </div>
             </div>
           )}

           {isLoggedIn && (
             <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm max-w-3xl mx-auto">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookMarked size={20} className="text-sky-500" /> Your Assigned Classes</h3>
                  <Button variant="secondary" className="px-3 py-1.5 text-xs shadow-none border-2">Manage Classes</Button>
               </div>
               <div className="flex flex-wrap gap-3">
                 {MY_CLASSES.map((cls, idx) => (
                   <button
                     key={idx}
                     onClick={() => { setSelectedClass(cls.grade); setSelectedSubject(cls.subject); }}
                     className={`px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${selectedClass === cls.grade && selectedSubject === cls.subject ? 'bg-sky-500 border-sky-500 text-white shadow-md transform -translate-y-1' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-sky-50'}`}
                   >
                     {cls.grade} • {cls.subject}
                   </button>
                 ))}
               </div>
             </div>
           )}

           <Card className={`p-8 max-w-3xl mx-auto ${!isLoggedIn ? 'opacity-40 select-none' : ''}`}>
             <h3 className="font-extrabold text-2xl mb-8 text-slate-800 flex items-center gap-3">
                <BarChart className="text-sky-500"/> {selectedClass} - {t.competencies}
             </h3>
             <div className="space-y-6">
               {COMPETENCIES.map((comp, i) => (
                 <ProgressBar key={i} label={comp.name} percentage={comp.score} colorClass={comp.color} />
               ))}
             </div>
             <div className="mt-8 p-6 bg-orange-50 rounded-2xl border-2 border-orange-100 flex gap-4 items-start">
               <div className="bg-orange-500 p-2 rounded-full text-white shrink-0 mt-1"><Activity size={20} /></div>
               <div>
                  <h4 className="font-bold text-orange-900 mb-1 text-lg">AI Insight</h4>
                  <p className="font-medium text-orange-800 leading-relaxed">
                    12 students need intervention in "Critical Thinking". Recommended action: Assign "Logic Puzzles Level 2" to the class.
                  </p>
               </div>
             </div>
           </Card>
        </div>
      )}

      {/* LOCKED MY STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="relative space-y-6 animate-fade-in">
           {!isPro && (
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-3xl border-2 border-slate-100">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm border-2 border-slate-100">
                   <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock size={32} className="text-amber-500" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-800 mb-2">Premium Feature</h3>
                   <p className="text-slate-500 font-medium mb-6">Upgrade to Kortex Pro to manage students, view individual profiles, and automatically assign AI-recommended interventions.</p>
                   <Button className="w-full py-3 bg-amber-500 hover:bg-amber-600 border-amber-700 shadow-lg text-white" onClick={() => requireAuth(() => alert("Upgrade to Pro flow initiated!"), "Sign up or Log in to upgrade to Pro.")}>
                      Upgrade to Pro
                   </Button>
                </div>
             </div>
           )}

           <div className={`space-y-6 ${!isPro ? 'opacity-40 select-none pointer-events-none' : ''}`}>
             
             {/* Class Selector */}
             <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm max-w-4xl mx-auto">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={20} className="text-sky-500" /> Select Class to Manage</h3>
               </div>
               <div className="flex flex-wrap gap-3">
                 {MY_CLASSES.map((cls, idx) => (
                   <button
                     key={idx}
                     onClick={() => { setSelectedClass(cls.grade); setSelectedSubject(cls.subject); }}
                     className={`px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${selectedClass === cls.grade && selectedSubject === cls.subject ? 'bg-sky-500 border-sky-500 text-white shadow-md transform -translate-y-1' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-sky-50'}`}
                   >
                     {cls.grade} • {cls.subject}
                   </button>
                 ))}
               </div>
             </div>

             {/* AI Actionable Insights Panel */}
             <Card className="p-6 max-w-4xl mx-auto border-orange-200 bg-orange-50 overflow-visible">
               <div className="flex flex-col sm:flex-row gap-6 items-start">
                 <div className="bg-orange-500 p-4 rounded-2xl text-white shrink-0 shadow-lg transform -rotate-3">
                   <Zap size={32} />
                 </div>
                 <div className="flex-1 w-full">
                    <h4 className="font-black text-orange-900 mb-2 text-xl flex items-center gap-2">AI Recommended Actions</h4>
                    <p className="font-medium text-orange-800 leading-relaxed mb-5">
                      Based on recent assessments, 3 students in <strong>{selectedClass || "this class"}</strong> need immediate intervention in <em>Critical Thinking</em>.
                    </p>
                    <div className="bg-white p-5 rounded-2xl border-2 border-orange-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="flex -space-x-3">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav&backgroundColor=b6e3f4" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Student" />
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffdfbf" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Student" />
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&backgroundColor=c0aede" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Student" />
                         </div>
                         <div className="text-sm">
                           <div className="font-extrabold text-slate-800">Aarav, Priya, Rahul</div>
                           <div className="font-bold text-slate-400">Score drop detected</div>
                         </div>
                      </div>
                      <Button variant="fun" className="w-full sm:w-auto px-6 py-2 text-sm shadow-md border-2 border-orange-600" icon={Gamepad2} onClick={() => alert("Assigned 'Logic Puzzles Level 2' to 3 students!")}>
                         Assign Logic Puzzles
                      </Button>
                    </div>
                 </div>
               </div>
             </Card>

             {/* Student Roster */}
             <Card className="p-0 max-w-4xl mx-auto overflow-hidden">
               <div className="bg-slate-50 p-5 border-b-2 border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <h3 className="font-extrabold text-slate-800 text-lg px-2">Student Roster</h3>
                  <div className="relative w-full sm:w-auto">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input type="text" placeholder="Find student..." className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-slate-200 rounded-full focus:outline-none focus:border-sky-500 font-bold text-slate-700 bg-white" />
                  </div>
               </div>
               <div className="divide-y-2 divide-slate-100 bg-white">
                  {[
                    { name: "Aarav Patel", id: "STU-001", status: "Needs Help", statusColor: "text-orange-700 bg-orange-100 border-orange-200", score: "68%" },
                    { name: "Priya Sharma", id: "STU-002", status: "Needs Help", statusColor: "text-orange-700 bg-orange-100 border-orange-200", score: "72%" },
                    { name: "Rahul Verma", id: "STU-003", status: "Needs Help", statusColor: "text-orange-700 bg-orange-100 border-orange-200", score: "65%" },
                    { name: "Ananya Gupta", id: "STU-004", status: "On Track", statusColor: "text-lime-700 bg-lime-100 border-lime-200", score: "88%" },
                    { name: "Vikram Singh", id: "STU-005", status: "Excelling", statusColor: "text-sky-700 bg-sky-100 border-sky-200", score: "95%" },
                  ].map((student, i) => (
                    <div key={i} className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                       <div className="flex items-center gap-4">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name.split(' ')[0]}&backgroundColor=${['b6e3f4', 'ffdfbf', 'c0aede', 'd1d4f9', 'ffd5dc'][i]}`} className="w-12 h-12 rounded-full border-2 border-slate-200 shadow-sm" alt={student.name} />
                         <div>
                           <h4 className="font-extrabold text-slate-800 text-base">{student.name}</h4>
                           <span className="text-xs font-bold text-slate-400">{student.id}</span>
                         </div>
                       </div>
                       <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                         <div className="text-left sm:text-right flex items-center sm:block gap-2">
                           <div className="text-xs font-bold text-slate-400 uppercase sm:mb-1">Avg Score</div>
                           <div className="text-base font-black text-slate-700">{student.score}</div>
                         </div>
                         <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border-2 ${student.statusColor}`}>
                           {student.status}
                         </span>
                         <Button variant="secondary" className="px-4 py-2 text-sm shadow-none border-2 hidden sm:flex">View Profile</Button>
                       </div>
                    </div>
                  ))}
               </div>
             </Card>
           </div>
        </div>
      )}
    </div>
  );
};

const LandingView = ({ setRole, setStage, requireAuth, onTryDemo, isLoggedIn, onOpenFeatured, onShowAlert, onNavigateToGames }) => {
  const [activeUsp, setActiveUsp] = useState(0);

  const USPS = [
    { icon: Brain, title: "NEP & NCF Aligned", desc: "Engineered to target the specific competencies written in NEP and NCF.", color: "text-sky-500", bg: "bg-sky-100", shadow: "shadow-sky-200/50" },
    { icon: Layers, title: "Systematic Progression", desc: "Pedagogically correct and beautifully sequenced learning pathways.", color: "text-orange-500", bg: "bg-orange-100", shadow: "shadow-orange-200/50" },
    { icon: User, title: "Individualised Learning", desc: "Adapts perfectly to every student's unique pace and style.", color: "text-lime-600", bg: "bg-lime-100", shadow: "shadow-lime-200/50" },
    { icon: Star, title: "Quality Guaranteed", desc: "Quality education and foundational excellence for all guaranteed.", color: "text-pink-500", bg: "bg-pink-100", shadow: "shadow-pink-200/50" },
    { icon: BarChart, title: "AI Powered Analytics", desc: "Actionable AI analytics and personalized suggested feedbacks.", color: "text-purple-500", bg: "bg-purple-100", shadow: "shadow-purple-200/50" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsp((prev) => (prev + 1) % USPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
  <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in relative">
    
    {/* Hero Section */}
    <div className="bg-sky-50 pt-16 pb-32 px-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-20 h-20 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-20 w-32 h-32 bg-lime-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Smarter tools <br/><span className="text-sky-500">Stronger Minds.</span>
          </h1>
          <p className="text-xl text-slate-600 font-medium max-w-lg mx-auto md:mx-0">
            India's first NEP 2020 aligned platform. Thousands of interactive games and lesson plans from Balvatika to Grade 12.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
            <Button 
              variant="primary" 
              className="text-lg px-8 py-4 w-full sm:w-auto" 
              onClick={() => requireAuth(() => {setRole('student'); setStage('foundational');}, "Create a free account to track your progress and unlock all games!")}
            >
              Sign Up for Free
            </Button>
            <Button 
              variant="secondary" 
              className="text-lg px-8 py-4 w-full sm:w-auto border-2 border-slate-300" 
              onClick={onTryDemo}
            >
              Try Demo Lesson
            </Button>
          </div>
          <p className="text-sm font-bold text-slate-400 flex items-center justify-center md:justify-start gap-2 pt-2">
            <Shield size={16}/> No credit card required.
          </p>
        </div>
        
        <div className="hidden md:flex justify-center items-center relative h-[450px] w-full z-10">
           {USPS.map((usp, idx) => {
              let diff = idx - activeUsp;
              if (diff < -2) diff += 5;
              if (diff > 2) diff -= 5;

              const isCenter = diff === 0;
              const isNext = diff === 1;
              const isPrev = diff === -1;
              const isFarNext = diff === 2;
              const isFarPrev = diff === -2;

              let transform = 'translateX(0) scale(0.4)';
              let opacity = '0';
              let zIndex = 10;
              let blur = 'blur(8px)';

              if (isCenter) {
                 transform = 'translateX(0) scale(1.05)';
                 opacity = '1';
                 zIndex = 30;
                 blur = 'blur(0px)';
              } else if (isNext) {
                 transform = 'translateX(180px) scale(0.85)';
                 opacity = '0.6';
                 zIndex = 20;
                 blur = 'blur(2px)';
              } else if (isPrev) {
                 transform = 'translateX(-180px) scale(0.85)';
                 opacity = '0.6';
                 zIndex = 20;
                 blur = 'blur(2px)';
              } else if (isFarNext) {
                 transform = 'translateX(300px) scale(0.5)';
                 opacity = '0';
                 zIndex = 10;
              } else if (isFarPrev) {
                 transform = 'translateX(-300px) scale(0.5)';
                 opacity = '0';
                 zIndex = 10;
              }

              return (
                 <div
                   key={idx}
                   className={`absolute w-72 bg-white/95 backdrop-blur-md rounded-[2.5rem] pt-16 pb-8 px-6 transition-all duration-[800ms] ease-out flex flex-col items-center text-center
                     ${isCenter ? 'shadow-2xl ring-8 ring-white/60 ' + usp.shadow : 'shadow-lg'}`}
                   style={{ transform, opacity, zIndex, filter: blur }}
                 >
                    <div className={`absolute -top-12 w-24 h-24 ${usp.bg} rounded-[2rem] flex items-center justify-center shadow-lg transition-all duration-[800ms] border-[6px] border-white
                       ${isCenter ? 'rotate-6 scale-110 shadow-xl' : '-rotate-3'} `}
                    >
                       <usp.icon size={44} className={usp.color} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3">{usp.title}</h3>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed">{usp.desc}</p>
                 </div>
              );
           })}
        </div>
      </div>
    </div>

    {/* Subject Marquee */}
    <div className="w-full bg-white border-y-4 border-slate-100 py-4 overflow-hidden relative flex items-center z-30 shadow-sm">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

      <div className="flex animate-marquee w-max hover:[animation-play-state:paused]">
        {[...SUBJECTS, ...SUBJECTS, ...SUBJECTS].map((subject, idx) => {
          const subjectData = SUBJECT_ICONS[subject] || { icon: Star, color: 'text-slate-400' };
          const Icon = subjectData.icon;
          return (
            <div
              key={idx}
              className="mx-3 px-5 py-2 bg-slate-50 border-2 border-slate-200 rounded-full font-black text-slate-500 text-xs uppercase tracking-wider flex-shrink-0 flex items-center gap-2 hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50 transition-colors cursor-default shadow-sm group"
            >
              <Icon size={16} className={`${subjectData.color} transition-transform group-hover:scale-125`} />
              {subject}
            </div>
          );
        })}
      </div>
    </div>

    {/* Primary Dashboards (Role Entry Points) */}
    <div id="demo-portals" className="max-w-6xl mx-auto px-4 py-20 w-full relative z-20">
      <h2 className="text-3xl font-extrabold text-slate-800 text-center mb-2">Select Your Role</h2>
      <p className="text-center text-slate-500 font-bold mb-10">Choose your portal below to dive into personalized learning experiences.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card onClick={() => setRole('teacher')} className="p-8 text-center group">
          <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-sky-500 transition-colors">
            <BookOpen size={36} className="text-sky-500 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Teacher Hub</h3>
          <p className="text-slate-500 font-medium mb-6">Preview lesson plans, manage curriculum, and track competencies.</p>
          <Button variant="outline" className="w-full">Enter Teacher Portal</Button>
        </Card>
        
        <Card onClick={() => setRole('parent')} className="p-8 text-center group border-b-8 border-orange-500">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-500 transition-colors">
            <Users size={36} className="text-orange-500 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Parent Portal</h3>
          <p className="text-slate-500 font-medium mb-6">View 360° holistic reports and track Panchakosha wellness progress.</p>
          <Button variant="outline" className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-50">Enter Parent Portal</Button>
        </Card>

        <Card onClick={() => {setRole('student'); setStage('foundational');}} className="p-8 text-center group border-b-8 border-lime-500">
          <div className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-lime-500 transition-colors">
            <Gamepad2 size={36} className="text-lime-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Student Hub</h3>
          <p className="text-slate-500 font-medium mb-6">Interactive, gamified learning pathways designed for holistic growth.</p>
          <Button variant="outline" className="w-full border-2 border-lime-600 text-lime-600 hover:bg-lime-50">Enter Student Portal</Button>
        </Card>
      </div>
    </div>

    {/* Featured Learning Tools Slider */}
    <div className="max-w-6xl mx-auto px-4 pb-20 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">Featured Learning Tools</h2>
          <p className="text-slate-500 font-medium mt-2">Bite-sized interactive videos and presentations.</p>
        </div>
        <Button variant="secondary" onClick={() => setRole('teacher')} className="hidden sm:flex shrink-0 border-2">View All Resources</Button>
      </div>
      
      <div className="flex overflow-x-auto gap-6 pb-4 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {FEATURED_TOOLS.map((tool, idx) => {
          const Icon = tool.icon;
          return (
            <Card 
              key={idx} 
              className="min-w-[280px] sm:min-w-[320px] snap-start hover:border-sky-300 flex-shrink-0 cursor-pointer group relative p-0 flex flex-col" 
              onClick={() => onOpenFeatured(tool)}
            >
              <div className="relative h-40 w-full bg-slate-200 overflow-hidden">
                 <img src={tool.image} alt={tool.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
                 
                 <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                   <span className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                      {tool.type}
                   </span>
                   {tool.isPremium && (
                     <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                       <Star size={10} className="fill-white" /> PRO
                     </div>
                   )}
                 </div>

                 <div className={`absolute -bottom-6 left-6 w-14 h-14 rounded-2xl ${tool.color} text-white flex items-center justify-center shadow-lg border-4 border-white transform group-hover:-translate-y-1 transition-transform`}>
                    <Icon size={24} />
                 </div>
              </div>

              <div className="pt-10 pb-6 px-6 bg-white flex-1 flex flex-col">
                <h3 className="text-xl font-extrabold text-slate-800 mb-3 group-hover:text-sky-600 transition-colors flex items-center gap-2">
                  {tool.title} {tool.isPremium && !isLoggedIn && <Lock size={16} className="text-slate-300"/>}
                </h3>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mt-auto">
                  <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{tool.grade}</span>
                  <span>•</span>
                  <span>{tool.subject}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Button variant="secondary" onClick={() => setRole('teacher')} className="w-full mt-4 sm:hidden border-2">View All Resources</Button>
    </div>

    {/* Featured Games Slider */}
    <div className="max-w-6xl mx-auto px-4 pb-20 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">Featured Games</h2>
          <p className="text-slate-500 font-medium mt-2">Playful, interactive modules to test your skills.</p>
        </div>
        <Button variant="secondary" onClick={onNavigateToGames} className="hidden sm:flex shrink-0 border-2">View All Games</Button>
      </div>
      
      <div className="flex overflow-x-auto gap-6 pb-4 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {FEATURED_GAMES.map((game, idx) => {
          const Icon = game.icon;
          return (
            <Card 
              key={idx} 
              className="min-w-[280px] sm:min-w-[320px] snap-start hover:border-pink-400 flex-shrink-0 cursor-pointer group relative p-0 flex flex-col border-b-4 border-b-pink-500" 
              onClick={() => onOpenFeatured(game)}
            >
              <div className="relative h-40 w-full bg-slate-200 overflow-hidden">
                 <img src={game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
                 
                 <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                   <span className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                      {game.type}
                   </span>
                   {game.isPremium && (
                     <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                       <Star size={10} className="fill-white" /> PRO
                     </div>
                   )}
                 </div>

                 <div className={`absolute -bottom-6 left-6 w-14 h-14 rounded-2xl ${game.color} text-white flex items-center justify-center shadow-lg border-4 border-white transform group-hover:-translate-y-1 transition-transform`}>
                    <Icon size={24} />
                 </div>
              </div>

              <div className="pt-10 pb-6 px-6 bg-white flex-1 flex flex-col">
                <h3 className="text-xl font-extrabold text-slate-800 mb-3 group-hover:text-pink-600 transition-colors flex items-center gap-2">
                  {game.title} {game.isPremium && !isLoggedIn && <Lock size={16} className="text-slate-300"/>}
                </h3>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mt-auto">
                  <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{game.grade}</span>
                  <span>•</span>
                  <span>{game.subject}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Button variant="secondary" onClick={onNavigateToGames} className="w-full mt-4 sm:hidden border-2">View All Games</Button>
    </div>

    {/* Featured Lessons Slider */}
    <div className="max-w-6xl mx-auto px-4 pb-24 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">Featured Lessons</h2>
          <p className="text-slate-500 font-medium mt-2">Complete learning pathways mapped to the curriculum.</p>
        </div>
        <Button variant="secondary" onClick={() => setRole('teacher')} className="hidden sm:flex shrink-0 border-2">View All Lessons</Button>
      </div>
      
      <div className="flex overflow-x-auto gap-6 pb-4 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {FEATURED_LESSONS.map((lesson, idx) => (
          <Card 
            key={idx} 
            className={`min-w-[300px] sm:min-w-[360px] snap-start border-b-8 ${lesson.color} flex-shrink-0 cursor-pointer group transition-all duration-300 hover:shadow-lg p-0 flex flex-col`} 
            onClick={() => onOpenFeatured(lesson)}
          >
            <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
               <img src={lesson.image} alt={lesson.chapter} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/20 to-transparent pointer-events-none"></div>

               <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
                  <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm max-w-[65%] truncate">
                     {lesson.book}
                  </span>
                  <div className="bg-slate-900/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm shrink-0">
                     <Layers size={14} /> {lesson.items} Items
                  </div>
               </div>
            </div>

            <div className="p-6 bg-white flex-1 flex flex-col group-hover:bg-slate-50 transition-colors">
               <h3 className="text-2xl font-black text-slate-800 mb-5 group-hover:text-sky-600 transition-colors leading-tight line-clamp-2">
                  {lesson.chapter}
               </h3>
               <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 mt-auto">
                  <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-md"><Video size={14} className="text-pink-500"/> Video</span>
                  <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-md"><Layers size={14} className="text-sky-500"/> PPT</span>
                  <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-md"><Gamepad2 size={14} className="text-orange-500"/> Quiz</span>
               </div>
            </div>
          </Card>
        ))}
      </div>
      <Button variant="secondary" onClick={() => setRole('teacher')} className="w-full mt-4 sm:hidden border-2">View All Lessons</Button>
    </div>

    {/* Testimonials Section */}
    <div className="bg-sky-50 py-24 w-full border-t-4 border-sky-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-200 rounded-full opacity-40 translate-y-1/4 -translate-x-1/4"></div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-slate-800">Loved by our Community</h2>
          <p className="text-lg text-slate-500 font-medium mt-3 max-w-2xl mx-auto">See how teachers, parents, and principals are transforming their classrooms with our NEP-aligned tools.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, idx) => (
            <Card key={idx} className="p-8 relative border-none shadow-xl hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full">
              <div className="absolute top-4 right-6 text-8xl text-sky-50 font-serif leading-none select-none">"</div>
              
              <div className="flex gap-1 mb-6 relative z-10">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              <p className="text-slate-700 font-bold text-lg leading-relaxed mb-8 relative z-10 italic flex-1">
                "{testimonial.text}"
              </p>
              
              <div className="flex items-center gap-4 mt-auto relative z-10">
                <div className="w-14 h-14 rounded-full border-4 border-sky-50 overflow-hidden shadow-sm shrink-0">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">{testimonial.name}</h4>
                  <p className="text-sm font-bold text-sky-500">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>

    {/* Kortex Krew Section */}
    <div className="bg-white py-24 w-full relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider mb-6">
            <Users size={16} /> The Community
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">
            Powered by the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Kortex Krew</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium mb-8 leading-relaxed max-w-2xl mx-auto md:mx-0">
            A dedicated collective of teachers, educators, educational psychologists, and parents working together. We design top-tier resources to ensure quality education is accessible for all.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 border-b-4 border-indigo-800 text-lg px-8 py-4"
              onClick={() => onShowAlert({
                title: "Registrations Full",
                message: "Thank you for your interest! The Kortex Krew is currently at full capacity. We will inform you when spots open up.",
                icon: Users,
                colorClass: "text-orange-500",
                bgClass: "bg-orange-100"
              })}
            >
              Join the Krew
            </Button>
            <Button
              variant="secondary"
              className="text-lg px-8 py-4 border-2 border-slate-200 shadow-sm"
              onClick={() => onShowAlert({
                title: "Subscribed!",
                message: "You are now subscribed to the Kortex Klassroom newsletter. Look out for the latest updates from the Krew!",
                icon: Check,
                colorClass: "text-lime-600",
                bgClass: "bg-lime-100"
              })}
              icon={Bell}
            >
              Subscribe to Newsletter
            </Button>
          </div>
        </div>
        <div className="flex-1 w-full max-w-md relative">
           <div className="aspect-square bg-slate-50 rounded-[3rem] border-8 border-indigo-50 relative p-8 shadow-inner">
             <div className="grid grid-cols-2 gap-4 h-full w-full">
                <div className="bg-sky-100 rounded-3xl flex items-center justify-center shadow-sm transform hover:scale-105 transition-transform"><User size={40} className="text-sky-500" /></div>
                <div className="bg-pink-100 rounded-3xl flex items-center justify-center shadow-sm transform hover:scale-105 transition-transform translate-y-4"><Brain size={40} className="text-pink-500" /></div>
                <div className="bg-lime-100 rounded-3xl flex items-center justify-center shadow-sm transform hover:scale-105 transition-transform -translate-y-4"><Activity size={40} className="text-lime-500" /></div>
                <div className="bg-amber-100 rounded-3xl flex items-center justify-center shadow-sm transform hover:scale-105 transition-transform"><Heart size={40} className="text-amber-500" /></div>
             </div>
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-xl border-4 border-indigo-100">
               <Users size={32} className="text-indigo-600" />
             </div>
           </div>
        </div>
      </div>
    </div>

  </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'games'
  const [role, setRole] = useState(null); 
  const [stage, setStage] = useState(null); 
  const [lang, setLang] = useState('en');
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPro, setIsPro] = useState(false); // Hook for premium progression later

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState("Join Kortex Klassroom to unlock all features.");
  
  const [showWellness, setShowWellness] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  // Lesson Player State
  const [showDemoSelection, setShowDemoSelection] = useState(false);
  const [playingLesson, setPlayingLesson] = useState(null);
  const [playingStep, setPlayingStep] = useState(0);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);

  // Deep Link State
  const [targetContext, setTargetContext] = useState(null);
  
  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (role === 'student' && currentView !== 'games') setShowWellness(true);
    }, 120000); 
    return () => clearTimeout(timer);
  }, [role, currentView]);

  const logout = () => {
    setRole(null);
    setStage(null);
    setIsLoggedIn(false);
    setCurrentView('home');
  };

  const requireAuth = (actionCallback, message = "Please sign in to access this feature.") => {
    if (isLoggedIn) {
      actionCallback();
    } else {
      setAuthMessage(message);
      setShowAuthModal(true);
    }
  };

  const handleOpenFeatured = (item) => {
    if (item.type === 'Game' && item.lessonContext) {
      const action = () => {
        setPlayingLesson(item.lessonContext);
        setPlayingStep(item.stepIndex);
      };
      if (item.isPremium) {
        requireAuth(action, "This is a Premium Game. Sign up for free to access it!");
      } else {
        action();
      }
      return;
    }

    const action = () => {
      setRole('teacher');
      setCurrentView('home');
      const subjectLessons = LESSON_DATA[item.grade]?.[item.subject];
      const lessonToOpen = subjectLessons ? subjectLessons[0] : null;
      setTargetContext({
        grade: item.grade,
        subject: item.subject,
        lesson: lessonToOpen
      });
    };

    if (item.isPremium) {
      requireAuth(action, "This is a Premium Resource. Sign up for free to access it!");
    } else {
      action();
    }
  };

  const handleStartLesson = (lesson, stepIndex) => {
    if (!isLoggedIn) {
      setAuthMessage("Create a free account to track your progress, or try a demo lesson!");
      setShowAuthModal(true);
    } else {
      setPlayingLesson(lesson);
      setPlayingStep(stepIndex);
    }
  };

  const renderContent = () => {
    if (currentView === 'games') {
      return <GamesView isLoggedIn={isLoggedIn} requireAuth={requireAuth} onStartGame={handleStartLesson} />;
    }
    if (role === 'student') return <WorkInProgressView title="Student" onReturn={() => setRole(null)} />;
    if (role === 'parent') return <WorkInProgressView title="Parent" onReturn={() => setRole(null)} />;
    if (role === 'teacher') return <TeacherView t={t} isLoggedIn={isLoggedIn} requireAuth={requireAuth} onStartLesson={handleStartLesson} targetContext={targetContext} isPro={isPro} />;
    return <LandingView setRole={setRole} setStage={setStage} requireAuth={requireAuth} onTryDemo={() => setShowDemoSelection(true)} isLoggedIn={isLoggedIn} onOpenFeatured={handleOpenFeatured} onShowAlert={setAlertConfig} onNavigateToGames={() => setCurrentView('games')} />;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-sky-200 relative">
      
      {/* Global Modals */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          authMessage={authMessage} 
          onLogin={() => { setIsLoggedIn(true); setShowAuthModal(false); }} 
          onStartDemo={() => { setShowAuthModal(false); setShowDemoSelection(true); }}
        />
      )}
      {showTimerModal && <QuickToolsModal onClose={() => setShowTimerModal(false)} />}
      {showWellness && <WellnessModal t={t} onClose={() => setShowWellness(false)} />}
      {alertConfig && <GeneralAlertModal {...alertConfig} onClose={() => setAlertConfig(null)} />}
      
      {/* Global Demo / Playlist Flows */}
      {showDemoSelection && <DemoSelectionModal onClose={() => setShowDemoSelection(false)} onSelect={(lesson) => { setPlayingLesson(lesson); setPlayingStep(0); setShowDemoSelection(false); }} />}
      {showSignUpPrompt && <SignUpPromptModal onClose={() => setShowSignUpPrompt(false)} onSignUp={() => { setShowSignUpPrompt(false); requireAuth(() => {}, "Create your free account to continue learning!"); }} />}
      
      {playingLesson && (
        <LessonPlayer 
          lesson={playingLesson} 
          initialStep={playingStep} 
          isPro={isPro}
          onClose={() => setPlayingLesson(null)} 
          onFinish={() => { 
            setPlayingLesson(null); 
            if (!isLoggedIn) setShowSignUpPrompt(true); 
          }} 
        />
      )}

      <nav className="bg-white border-b-4 border-sky-500 sticky top-0 z-40 shadow-sm">
        <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center text-xs font-bold gap-4 overflow-x-auto hide-scrollbar">
           
           <LiveDateTime lang={lang} />

           <div className="flex items-center gap-4 shrink-0">
             {role && currentView !== 'games' && (
               <span className="text-sky-300 mr-2 pr-4 border-r border-slate-700 flex items-center gap-2 hidden sm:flex">
                  {role === 'student' ? 'Student Mode' : role === 'teacher' ? 'Teacher Mode' : 'Parent Mode'} • {stage ? stage : 'Active'}
                  {!isLoggedIn && <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Guest View</span>}
               </span>
             )}
             <button onClick={() => setShowTimerModal(true)} className="flex items-center gap-1.5 hover:text-sky-400 transition-colors bg-white/10 px-2.5 py-1 rounded-md">
               <Timer size={12} /> Tools
             </button>
             <button onClick={() => setShowWellness(true)} className="flex items-center gap-1.5 hover:text-pink-400 transition-colors bg-white/10 px-2.5 py-1 rounded-md">
               <Heart size={12} className="fill-current" /> {t.wellness_break}
             </button>
             <div className="flex items-center bg-slate-800 rounded px-2 py-1">
                <Globe size={12} className="mr-1" />
                <select className="bg-transparent outline-none cursor-pointer" value={lang} onChange={(e) => setLang(e.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </select>
             </div>
           </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => {setCurrentView('home'); setRole(null); setStage(null);}}>
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center transform -rotate-3">
              <Brain size={24} className="text-white" />
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-800 hidden sm:block">
              kortex<span className="text-sky-500">.klassroom</span>
            </span>
          </div>

          <div className="flex-1 max-w-2xl hidden md:flex items-center relative">
             <input 
               type="text" 
               placeholder="Search learning materials..." 
               className="w-full bg-slate-100 border-2 border-slate-200 text-slate-700 font-medium rounded-full py-3 pl-5 pr-12 focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner"
             />
             <button className="absolute right-2 w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white hover:bg-sky-600 transition-colors">
                <Search size={18} />
             </button>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {role && !isLoggedIn && (
               <Button variant="outline" onClick={() => requireAuth(() => {}, "Sign up to save your progress and access premium features!")} className="py-2 px-4 text-sm hidden sm:flex border-2">
                  Sign In
               </Button>
            )}

            {isLoggedIn && (
               <div className="hidden sm:flex items-center gap-3">
                 <div className="text-right">
                   <div className="text-sm font-bold text-slate-800 leading-none">John Doe</div>
                   <div className="text-xs font-bold text-sky-500">{role === 'teacher' ? 'Educator' : 'Free Plan'}</div>
                 </div>
                 <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 border-2 border-sky-200">
                   <User size={20} />
                 </div>
                 <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-2" title="Log Out">
                    <LogOut size={18} />
                 </button>
               </div>
            )}

            {(!role || currentView === 'games') && !isLoggedIn && (
               <div className="hidden lg:flex items-center gap-4 font-bold text-slate-600">
                 <button onClick={() => setCurrentView('games')} className={`transition-colors ${currentView === 'games' ? 'text-sky-500 border-b-2 border-sky-500' : 'hover:text-sky-500'}`}>Games</button>
                 <button onClick={() => {setCurrentView('home'); setRole('teacher');}} className="hover:text-sky-500 transition-colors">Resources</button>
                 <Button variant="outline" onClick={() => setShowAuthModal(true)} className="py-2 px-6 ml-2 text-sm border-2 shadow-none hover:-translate-y-0">
                   Log In
                 </Button>
               </div>
            )}
            
            <button className="md:hidden text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
               {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
           <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 absolute w-full shadow-xl">
              <div className="relative">
                 <input type="text" placeholder="Search..." className="w-full bg-slate-100 border-2 rounded-full py-3 pl-4 pr-10 font-medium" />
                 <Search className="absolute right-4 top-3 text-slate-400" />
              </div>
              <div className="flex flex-col gap-3 font-bold text-slate-700 pb-2">
                 <button onClick={() => { setCurrentView('games'); setMobileMenuOpen(false); }} className="text-left p-2 hover:bg-slate-50 rounded-lg text-sky-500">Games</button>
                 <button onClick={() => { setCurrentView('home'); setRole('teacher'); setMobileMenuOpen(false); }} className="text-left p-2 hover:bg-slate-50 rounded-lg">Resources</button>
                 <button onClick={() => { setCurrentView('home'); setRole('teacher'); setMobileMenuOpen(false); }} className="text-left p-2 hover:bg-slate-50 rounded-lg">Lesson Plans</button>
                 {!isLoggedIn && <button onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }} className="text-left p-2 text-sky-500">Log In / Sign Up</button>}
                 {isLoggedIn && <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-left p-2 text-red-500">Log Out</button>}
              </div>
           </div>
        )}
      </nav>

      <main className={`${currentView === 'home' && !role ? '' : 'py-8 px-4'} w-full overflow-hidden`}>
        {renderContent()}
      </main>

      {currentView === 'home' && !role && (
         <footer className="bg-slate-900 text-slate-400 py-12 text-center text-sm font-medium">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-left">
               <div>
                  <h4 className="text-white font-bold mb-4 uppercase">Content</h4>
                  <ul className="space-y-2">
                     <li>Resources</li>
                     <li>Games</li>
                     <li>Lesson Plans</li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-white font-bold mb-4 uppercase">NEP 2020</h4>
                  <ul className="space-y-2">
                     <li>Foundational Stage</li>
                     <li>Preparatory Stage</li>
                     <li>Middle Stage</li>
                     <li>Secondary Stage</li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-white font-bold mb-4 uppercase">Features</h4>
                  <ul className="space-y-2">
                     <li>Competency Tracker</li>
                     <li>Lesson Management</li>
                     <li>Panchakosha Wellness</li>
                  </ul>
               </div>
            </div>
            <p>© {new Date().getFullYear()} Kortex Klassroom. An Education Prototype.</p>
         </footer>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}} />
    </div>
  );
}