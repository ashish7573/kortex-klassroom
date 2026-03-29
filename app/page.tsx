"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

import { 
  BookOpen, Brain, Activity, User, Users, FileText, BarChart, 
  Settings, Globe, Play, LogOut, CheckCircle, Clock, Search,
  Heart, Zap, BookMarked, Star, Video, Gamepad2, Menu, X, ArrowRight, 
  ChevronLeft, ChevronRight, Layers, Lock, Unlock, Shield, Timer, Info, 
  Calendar, Pause, RotateCcw, Rocket, Trophy, Medal, Flame, Book,  
  Calculator, Leaf, Palette, Music, Monitor, Type, Check, Bell, Plus, 
  Database, Edit3, Trash2, UploadCloud, Save, ChevronDown, ChevronUp, 
  Sparkles, ArrowUpRight, Target, PlayCircle, UserPlus, LineChart, 
  CreditCard, DollarSign, XCircle, AlertTriangle, Briefcase
} from 'lucide-react';

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

const AuthModal = ({ onClose, authMessage, onStartDemo, onStudentLogin }: any) => {
  const [loginMode, setLoginMode] = useState('adult'); // 'adult' or 'student'
  
  // Adult State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); 
  const [selectedRole, setSelectedRole] = useState('student'); 
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Student State
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPin, setStudentPin] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdultAuth = async (e: any) => {
    e.preventDefault();
    setIsLoading(true); 
    setErrorMsg('');

    // NEW: Tell the global listener to pause security checks while we log in
    sessionStorage.setItem('kortex_is_authenticating', 'true');

    try {
      const sessionToken = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('kortex_session_token', sessionToken);

      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, "users", user.uid), {
          email: user.email, role: selectedRole, full_name: fullName,
          is_pro: false, created_at: new Date().toISOString(), session_token: sessionToken
        });
        
        alert("Success! Account created.");
        onClose();
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Write the new token to the database safely
        await updateDoc(doc(db, "users", user.uid), { session_token: sessionToken });
        onClose();
      }
    } catch (error: any) { 
      console.error("🚨 FIREBASE AUTH ERROR:", error);
      setErrorMsg(error.message.replace('Firebase: ', '')); 
    } finally { 
      setIsLoading(false); 
      // NEW: Tell the listener it is safe to resume security checks
      sessionStorage.removeItem('kortex_is_authenticating');
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg('');
    
    // NEW: Pause security checks for Google Auth too
    sessionStorage.setItem('kortex_is_authenticating', 'true');
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const sessionToken = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('kortex_session_token', sessionToken);
      
      const userDocRef = doc(db, "users", user.uid);
      const userProfile = await getDoc(userDocRef);
      
      if (!userProfile.exists()) {
        await setDoc(userDocRef, {
          email: user.email, role: isSignUp ? selectedRole : 'parent', 
          full_name: user.displayName || 'Google User',
          is_pro: false, created_at: new Date().toISOString(), session_token: sessionToken
        });
      } else {
        await updateDoc(userDocRef, { session_token: sessionToken });
      }
      onClose();
    } catch (error: any) {
      console.error("🚨 GOOGLE AUTH ERROR:", error);
      setErrorMsg(error.message.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
      // NEW: Resume security checks
      sessionStorage.removeItem('kortex_is_authenticating');
    }
  };


  const handleStudentAuth = async (e: any) => {
    e.preventDefault();
    setIsLoading(true); 
    setErrorMsg('');

    try {
      const cleanUsername = studentUsername.toLowerCase().trim();
      const studentsRef = collection(db, "managed_students");
      const q = query(studentsRef, where("username", "==", cleanUsername), where("pin", "==", studentPin));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        
        const sessionToken = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('kortex_student_session_token', sessionToken);
        
        // Update the student's document with the new active token
        await updateDoc(doc(db, "managed_students", studentDoc.id), {
           session_token: sessionToken
        });

        const studentData = { id: studentDoc.id, session_token: sessionToken, ...studentDoc.data() };
        if (onStudentLogin) onStudentLogin(studentData); 
        onClose();
      } else {
        setErrorMsg("Incorrect Username or PIN.");
      }
    } catch (error: any) {
      console.error("🚨 STUDENT LOGIN ERROR:", error);
      setErrorMsg("Error connecting to database. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full max-h-[95vh] shadow-2xl relative border-4 border-slate-100 flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2 z-10"><X size={20} /></button>
        
        <div className="flex bg-slate-50 border-b-2 border-slate-100">
           <button 
             onClick={() => { setLoginMode('adult'); setErrorMsg(''); }}
             className={`flex-1 py-4 font-black text-sm uppercase tracking-wider transition-colors ${loginMode === 'adult' ? 'bg-white text-sky-600 border-t-4 border-sky-500' : 'text-slate-400 hover:bg-slate-100 border-t-4 border-transparent'}`}
           >
             Parents & Teachers
           </button>
           <button 
             onClick={() => { setLoginMode('student'); setErrorMsg(''); }}
             className={`flex-1 py-4 font-black text-sm uppercase tracking-wider transition-colors ${loginMode === 'student' ? 'bg-white text-purple-600 border-t-4 border-purple-500' : 'text-slate-400 hover:bg-slate-100 border-t-4 border-transparent'}`}
           >
             Student Login
           </button>
        </div>

        <div className="p-8 overflow-y-auto">
           {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm font-bold rounded-xl text-center animate-shake">{errorMsg}</div>}

           {loginMode === 'student' && (
              <form onSubmit={handleStudentAuth} className="space-y-4 animate-fade-in">
                 <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-purple-50"><Users size={32} className="text-purple-500" /></div>
                    <h2 className="text-2xl font-black text-slate-800">Welcome Back!</h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Enter your secret details to play.</p>
                 </div>
                 <input 
                   type="text" placeholder="Your Username" required value={studentUsername} onChange={(e: any) => setStudentUsername(e.target.value)}
                   className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-purple-600 focus:border-purple-500 outline-none lowercase"
                 />
                 <input 
                   type="password" placeholder="6-Digit Secret PIN" required maxLength={6} value={studentPin} onChange={(e: any) => setStudentPin(e.target.value.replace(/\D/g, ''))}
                   className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-mono text-2xl tracking-widest text-center font-black text-slate-800 focus:border-purple-500 outline-none"
                 />
                 <Button type="submit" disabled={isLoading || studentPin.length !== 6 || !studentUsername} className="w-full py-4 text-lg bg-purple-500 hover:bg-purple-600 border-b-4 border-purple-700 active:border-b-0 text-white mt-2">
                    {isLoading ? 'Checking...' : 'Start Playing!'}
                 </Button>
              </form>
           )}

           {loginMode === 'adult' && (
              <div className="animate-fade-in">
                 <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transform -rotate-3 shadow-md"><Brain size={32} className="text-white" /></div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                    <p className="text-slate-500 font-medium text-sm">{authMessage}</p>
                 </div>

                 <form onSubmit={handleAdultAuth} className="space-y-4">
                    {isSignUp && (
                      <>
                        <input type="text" placeholder="Full Name" required value={fullName} onChange={(e: any) => setFullName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-sky-500 outline-none" />
                        <select value={selectedRole} onChange={(e: any) => setSelectedRole(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-sky-500 outline-none">
                          <option value="parent">I am a Parent</option>
                          <option value="teacher">I am a Teacher</option>
                          <option value="student">I am an Independent Student</option>
                        </select>
                      </>
                    )}
                    <input type="email" placeholder="Email Address" required value={email} onChange={(e: any) => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-sky-500 outline-none" />
                    <input type="password" placeholder="Password" required value={password} onChange={(e: any) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-sky-500 outline-none" />
                    <button type="submit" disabled={isLoading} className="w-full bg-sky-500 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-sky-600 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                      {isLoading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Log In')}
                    </button>
                    <div className="mt-4">
                      <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-bold">OR</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isLoading}
                        className="w-full mt-2 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-3"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                      </button>
                    </div>
                 </form>

                 <div className="mt-6 text-center">
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-sky-500 font-bold hover:underline text-sm">
                      {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
                    </button>
                 </div>
                 {!isSignUp && (
                    <div className="mt-8 text-center border-t-2 border-slate-100 pt-6">
                      <p className="text-sm font-bold text-slate-500 mb-3">Just looking around?</p>
                      <Button variant="secondary" onClick={onStartDemo} className="w-full">Try a Demo Lesson</Button>
                    </div>
                 )}
              </div>
           )}
        </div>
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


const LessonPlayer = ({ lesson, initialStep, isPro, isLoggedIn, onClose, onFinish, onTimeUp }) => {
  // If a subtopic flow was specifically passed (from our isolation logic), use it. Otherwise, fallback.
  const playlist = lesson.flow || (lesson.subTopics ? lesson.subTopics.flatMap(sub => sub.tools || []) : []);
  const [currentStep, setCurrentStep] = useState(initialStep || 0);
  const currentItem = playlist[currentStep];

  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(() => { if (onTimeUp) onTimeUp(); }, 120000); 
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, onTimeUp]);

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

  const handleNext = () => { if (isLastStep) onFinish(); else setCurrentStep(prev => prev + 1); };
  const handlePrev = () => { if (currentStep > 0) setCurrentStep(prev => prev - 1); };

  const renderContent = () => {
    // 1. Premium Content Lock (Keep this, it's great!)
    if (currentItem.isPremium && !isPro) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 w-full max-w-2xl mx-auto">
          <div className="bg-slate-900 rounded-[3rem] p-12 border border-slate-800 shadow-2xl relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 opacity-5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500 opacity-5 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg transform rotate-3 border-4 border-slate-800"><Lock size={40} className="text-white" /></div>
              <h2 className="text-4xl font-black text-white mb-4">Pro Content Locked</h2>
              <p className="text-slate-400 mb-8 text-lg font-medium">This is an advanced interactive module. Upgrade your account to unlock.</p>
              <Button className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white px-8 py-4 text-lg border-none shadow-xl" onClick={() => alert("Upgrade coming soon")}><Star className="fill-white mr-2" size={20}/> Upgrade to Pro</Button>
              <button onClick={onClose} className="mt-6 text-slate-500 font-bold hover:text-white transition-colors">Return to Dashboard</button>
            </div>
          </div>
        </div>
      );
    }

    // 2. The Smart Content Router
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
        // NEW: Look up the game using the exact content_url from Firebase (e.g. '/games/swar1')
        const CustomGameComponent = GAME_REGISTRY[currentItem.content_url];
        
        if (CustomGameComponent) {
           return <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-3xl overflow-y-auto border-4 border-slate-800 shadow-2xl animate-fade-in"><CustomGameComponent onComplete={handleNext} /></div>;
        }
        return <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border-4 border-dashed border-slate-800 rounded-3xl p-8 text-center max-w-3xl mx-auto"><h2 className="text-4xl font-black text-white mb-4">{currentItem.title}</h2><p className="text-slate-500">Game module under construction.</p></div>;

      case 'quiz':
        // NEW: Look up the quiz using the exact content_url from Firebase (e.g. '/quizzes/swar1')
        const CustomQuizComponent = QUIZ_REGISTRY[currentItem.content_url];
        
        if (CustomQuizComponent) {
           return <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded-3xl overflow-y-auto border-4 border-slate-200 shadow-2xl animate-fade-in"><CustomQuizComponent onComplete={handleNext} /></div>;
        }
        return <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-3xl p-8 border-4 border-dashed border-purple-200 text-center"><h2 className="text-4xl font-black text-slate-800 mb-4">{currentItem.title}</h2><p className="text-slate-500">Quiz module under construction.</p></div>;

      case 'presentation':
      case 'ppt':
      case 'pdf':
        let docUrl = currentItem.content_url || '';
        
        // Auto-format Canva links for secure embedding
        if (docUrl.includes('canva.com') && !docUrl.includes('embed')) {
            docUrl = docUrl.split('?')[0].replace(/\/view.*$/, '') + '/view?embed';
        }

        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-2xl overflow-hidden text-slate-800 relative shadow-2xl">
             {docUrl && (
               <div className="absolute top-0 left-0 right-0 bg-white p-4 border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
                 <div className="flex items-center gap-3 font-extrabold text-slate-700"><FileText className="text-rose-500" size={20} />{currentItem.title}</div>
                 <Button variant="secondary" className="py-2 px-4 text-sm border-2 border-slate-200 shadow-sm hover:border-sky-500 hover:text-sky-600" onClick={() => { if (isPro) window.open(docUrl, '_blank'); else alert("Pro feature"); }}>Open Document</Button>
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
        <div className="bg-slate-800 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 border border-slate-700">{currentItem.type?.toUpperCase()} {currentItem.isPremium && <Star size={14} className="text-amber-400 fill-amber-400" />}</div>
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
// SECTION 5: GAMES VIEW (PUBLIC)
// ============================================================================

const GamesView = ({ isLoggedIn, requireAuth, onStartGame }) => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allGames, setAllGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      try {
        const snapshot = await getDocs(collection(db, 'learning_tools'));
        let extractedGames = [];
        snapshot.docs.forEach(doc => {
          const item: any = { id: doc.id, ...doc.data() };
          if (item.content_type?.toLowerCase() === 'game') {
             extractedGames.push({
               ...item, 
               image: item.image || getSubjectFallbackImage(item.subject),
               lessonContext: { chapter: item.chapter_name, book: item.book }, 
               stepIndex: 0 // Flat structure doesn't need step indexes in the same way
             });
          }
        });
        setAllGames(extractedGames);
      } catch (error: any) { console.error(error); } finally { setIsLoading(false); }
    }
    fetchGames();
  }, []);

  const filteredGames = allGames.filter(game => {
    const matchClass = selectedClass ? game.grade?.toLowerCase().trim() === selectedClass.toLowerCase().trim() : true;
    const dbSubj = game.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : game.subject?.toLowerCase().trim();
    const matchSubject = selectedSubject ? dbSubj === selectedSubject.toLowerCase().trim() : true;
    const matchQuery = searchQuery ? game.title?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchClass && matchSubject && matchQuery;
  });

  const clearFilters = () => { setSelectedClass(""); setSelectedSubject(""); setSearchQuery(""); };
  const hasActiveFilters = selectedClass || selectedSubject || searchQuery;

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-[3rem] p-10 md:p-16 text-white flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-white opacity-10 rounded-full translate-y-1/2"></div>
        <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-4 backdrop-blur-sm"><Gamepad2 size={16} /> Kortex Arcade</div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">Learn through <br/>the power of play.</h1>
          <p className="text-lg text-orange-50 font-medium max-w-lg">Explore hundreds of interactive, curriculum-aligned games designed to make mastering new concepts incredibly fun.</p>
        </div>
        <div className="relative z-10 w-48 h-48 bg-white/20 rounded-[2.5rem] backdrop-blur-md border-8 border-white/30 flex items-center justify-center shadow-2xl transform rotate-3"><Gamepad2 size={80} className="text-white drop-shadow-md" /></div>
      </div>

      <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="font-bold text-slate-500 text-sm uppercase px-2 hidden sm:block">Filter:</span>
            <select className="flex-1 md:w-40 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-pink-500 outline-none" value={selectedClass} onChange={(e: any) => setSelectedClass(e.target.value)}>
              <option value="">All Grades</option>{GRADES.map(grade => <option key={grade} value={grade}>{grade}</option>)}
            </select>
            <select className="flex-1 md:w-48 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-pink-500 outline-none" value={selectedSubject} onChange={(e: any) => setSelectedSubject(e.target.value)}>
              <option value="">All Subjects</option>{SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
            </select>
         </div>
         <div className="relative w-full md:flex-1 flex gap-2">
            <div className="relative flex-1">
              <input type="text" placeholder="Search all games..." value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-4 pr-10 font-bold text-slate-700 focus:border-pink-500 outline-none" />
              <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
            </div>
            {hasActiveFilters && (<button onClick={clearFilters} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl transition-colors shrink-0 flex items-center gap-2"><X size={16} /> Clear</button>)}
         </div>
      </div>

      <div className="pb-12">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Arcade Collection</h2>
        {isLoading ? (
           <div className="py-20 text-center text-pink-500 font-bold animate-pulse">Loading Arcade Modules...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.length > 0 ? filteredGames.map((game, idx) => (
               <Card key={idx} className="hover:border-pink-400 cursor-pointer group relative p-0 flex flex-col" onClick={() => {
                   if (game.isPremium) requireAuth(() => onStartGame(game.lessonContext, game.stepIndex), "This is a Premium Game. Sign up for free to access it!");
                   else onStartGame(game.lessonContext, game.stepIndex);
                 }}>
                 <div className="relative h-36 w-full bg-slate-200 overflow-hidden">
                    <img src={game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>
                    {game.isPremium && <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1"><Star size={10} className="fill-white" /> PRO</div>}
                 </div>
                 <div className="p-5 bg-white flex-1 flex flex-col">
                   <div className="mb-2">
                      <p className="text-[16px] font-black text-pink-600 uppercase tracking-wider line-clamp-1">{game.lessonContext?.chapter || 'Arcade Mode'}</p>
                      {game.lessonContext?.subtopic && <p className="text-[16px] font-bold text-pink-400 mt-0.5 truncate">↳ {game.lessonContext.subtopic}</p>}
                   </div>
                   <h3 className="text-lg font-extrabold text-slate-800 mb-2 group-hover:text-pink-600 transition-colors leading-tight line-clamp-2">{game.title} {game.isPremium && !isLoggedIn && <Lock size={14} className="text-slate-300 inline mb-0.5 shrink-0"/>}</h3>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-auto pt-3 border-t border-slate-100"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{game.grade}</span><span>•</span><span className="truncate">{game.subject}</span></div>
                 </div>
               </Card>
            )) : <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-slate-100"><h3 className="text-xl font-bold text-slate-700">No games found</h3></div>}
          </div>
        )}
      </div>
    </div>
  );
};










// ============================================================================
// SECTION 6: TOOLS VIEW (PUBLIC)
// ============================================================================

const ToolsView = ({ isLoggedIn, requireAuth, onOpenTool }) => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allTools, setAllTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getIcon = (typeStr) => {
    if (typeStr === 'Video') return Video;
    if (typeStr === 'Game' || typeStr === 'Gamepad2') return Gamepad2;
    if (typeStr === 'PDF' || typeStr === 'FileText' || typeStr === 'Presentation' || typeStr === 'ppt') return FileText;
    return Layers;
  };

  useEffect(() => {
    async function fetchTools() {
      try {
        const snapshot = await getDocs(collection(db, 'learning_tools'));
        let extractedTools = [];
        snapshot.docs.forEach(doc => {
          const item: any = { id: doc.id, ...doc.data() };
          if (item.content_type && item.content_type?.toLowerCase() !== 'game' && item.content_type?.toLowerCase() !== 'placeholder') {
             extractedTools.push({
               ...item, 
               icon: getIcon(item.content_type), 
               image: item.image || getSubjectFallbackImage(item.subject),
               lessonContext: { chapter: item.chapter_name, book: item.book }, 
               stepIndex: 0
             });
          }
        });
        setAllTools(extractedTools);
      } catch (error: any) { console.error(error); } finally { setIsLoading(false); }
    }
    fetchTools();
  }, []);

  const filteredTools = allTools.filter(tool => {
    const matchClass = selectedClass ? tool.grade?.toLowerCase().trim() === selectedClass.toLowerCase().trim() : true;
    const dbSubj = tool.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : tool.subject?.toLowerCase().trim();
    const matchSubject = selectedSubject ? dbSubj === selectedSubject.toLowerCase().trim() : true;
    const matchQuery = searchQuery ? tool.title?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchClass && matchSubject && matchQuery;
  });

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-teal-400 to-emerald-500 rounded-[3rem] p-10 md:p-16 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        
        {/* Dynamic Ambient Background Blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-700 opacity-20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        
        {/* Left Side: Typography & Copy */}
        <div className="relative z-10 text-center md:text-left mb-10 md:mb-0">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-6 border border-white/30 shadow-sm">
            <Layers size={16} /> Quick Tools
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight drop-shadow-sm">
            Interactive <br/>Resources.
          </h1>
          <p className="text-lg text-emerald-50 font-medium max-w-lg drop-shadow-sm">
            Bite-sized videos, worksheets, and 3D models to supplement your learning.
          </p>
        </div>

        {/* Right Side: Floating Glassmorphic Composition */}
        <div className="relative z-10 hidden md:block mr-8">
           <div className="relative w-48 h-48">
              {/* Main Center Glass Box */}
              <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] backdrop-blur-md border-8 border-white/30 flex items-center justify-center shadow-2xl transform rotate-6 hover:rotate-12 transition-transform duration-500 z-10">
                 <Layers size={80} className="text-white drop-shadow-md" />
              </div>
              
              {/* Floating Video Icon */}
              <div className="absolute -top-6 -left-6 bg-teal-400 rounded-2xl p-4 shadow-xl border-2 border-white/50 transform -rotate-12 animate-bounce z-20" style={{animationDuration: '3s'}}>
                 <Video size={28} className="text-white" />
              </div>
              
              {/* Floating Document Icon */}
              <div className="absolute -bottom-4 -right-6 bg-emerald-400 rounded-2xl p-4 shadow-xl border-2 border-white/50 transform rotate-12 animate-bounce z-20" style={{animationDuration: '4s'}}>
                 <FileText size={28} className="text-white" />
              </div>
           </div>
        </div>
        
      </div>

      <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="font-bold text-slate-500 text-sm uppercase px-2 hidden sm:block">Filter:</span>
            <select className="flex-1 md:w-40 bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500" value={selectedClass} onChange={(e: any) => setSelectedClass(e.target.value)}>
              <option value="">All Grades</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className="flex-1 md:w-48 bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500" value={selectedSubject} onChange={(e: any) => setSelectedSubject(e.target.value)}>
              <option value="">All Subjects</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>
         <div className="relative w-full md:flex-1 flex gap-2">
            <div className="relative flex-1">
              <input type="text" placeholder="Search videos, docs..." value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border-2 rounded-xl py-3 pl-4 pr-10 font-bold outline-none focus:border-emerald-500" />
              <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
            </div>
            {(selectedClass || selectedSubject || searchQuery) && <button onClick={() => {setSelectedClass(""); setSelectedSubject(""); setSearchQuery("");}} className="px-4 bg-slate-100 font-bold rounded-xl flex items-center gap-2"><X size={16} /> Clear</button>}
         </div>
      </div>

      <div className="pb-12">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Resource Library</h2>
        {isLoading ? (<div className="py-20 text-center font-bold text-emerald-500 animate-pulse">Loading Tools...</div>) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTools.length > 0 ? filteredTools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <Card key={idx} className="cursor-pointer group relative p-0 flex flex-col hover:border-emerald-300" onClick={() => onOpenTool(tool)}>
                  <div className="relative h-40 w-full bg-slate-200 overflow-hidden">
                     <img src={tool.image} alt={tool.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                     <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-transparent"></div>
                     <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                       <span className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-white/90 px-3 py-1 rounded-full">{tool.type}</span>
                       {tool.isPremium && (<div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md"><Star size={10} className="fill-white inline" /> PRO</div>)}
                     </div>
                     <div className={`absolute -bottom-0 left-3 w-12 h-12 rounded-2xl ${tool.color || 'bg-sky-500'} text-white flex items-center justify-center shadow-lg border-4 border-white group-hover:-translate-y-1 transition-transform`}><Icon size={20} /></div>
                  </div>
                  <div className="pt-10 pb-6 px-6 bg-white flex-1 flex flex-col">
                    <div className="mb-2">
                       <p className="text-[16px] font-black text-emerald-600 uppercase tracking-wider line-clamp-1">{tool.lessonContext?.chapter || 'General Resource'}</p>
                       {tool.lessonContext?.subtopic && <p className="text-[16px] font-bold text-emerald-400 mt-0.5 truncate">↳ {tool.lessonContext.subtopic}</p>}
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-3 group-hover:text-emerald-600 flex items-center gap-2 leading-tight line-clamp-2">{tool.title} {tool.isPremium && !isLoggedIn && <Lock size={16} className="text-slate-300 shrink-0"/>}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-auto pt-4 border-t border-slate-100"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{tool.grade}</span><span>•</span><span className="truncate">{tool.subject}</span></div>
                  </div>
                </Card>
              )
            }) : (<div className="col-span-full py-16 text-center bg-white rounded-3xl border-2"><h3 className="text-xl font-bold">No tools found</h3></div>)}
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
          <div className="bg-gradient-to-r from-sky-400 to-indigo-500 rounded-[3rem] p-10 md:p-16 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
            
            {/* Dynamic Ambient Background Blobs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-700 opacity-20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
            
            {/* Left Side: Typography & Copy */}
            <div className="relative z-10 text-center md:text-left mb-10 md:mb-0">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-6 border border-white/30 shadow-sm">
                <BookOpen size={16} /> Kortex Curriculum
              </div>
              <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight drop-shadow-sm">
                Master every <br/>concept.
              </h1>
              <p className="text-lg text-sky-50 font-medium max-w-lg drop-shadow-sm">
                Complete learning pathways mapped to the NCF, featuring Interactive Videos, PDFs, Quizzes and Games.
              </p>
            </div>

            {/* Right Side: Floating Glassmorphic Composition */}
            <div className="relative z-10 hidden md:block mr-8">
               <div className="relative w-48 h-48">
                  {/* Main Center Glass Box */}
                  <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] backdrop-blur-md border-8 border-white/30 flex items-center justify-center shadow-2xl transform -rotate-3 hover:rotate-3 transition-transform duration-500 z-10">
                     <BookOpen size={80} className="text-white drop-shadow-md" />
                  </div>
                  
                  {/* Floating Quiz/Game Icon */}
                  <div className="absolute -top-6 -right-6 bg-sky-400 rounded-2xl p-4 shadow-xl border-2 border-white/50 transform rotate-12 animate-bounce z-20" style={{animationDuration: '3.5s'}}>
                     <Gamepad2 size={28} className="text-white" />
                  </div>
                  
                  {/* Floating Video Icon */}
                  <div className="absolute -bottom-4 -left-6 bg-indigo-400 rounded-2xl p-4 shadow-xl border-2 border-white/50 transform -rotate-6 animate-bounce z-20" style={{animationDuration: '4.2s'}}>
                     <Video size={28} className="text-white" />
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


const LandingView = ({ setRole, setStage, requireAuth, onTryDemo, isLoggedIn, onOpenFeatured, onShowAlert, onNavigateToGames, onNavigateToLessons, onNavigateToTools }: any) => {
  const [activeUsp, setActiveUsp] = useState(0);
  const [dbFeaturedLessons, setDbFeaturedLessons] = useState([]);
  const [dbFeaturedGames, setDbFeaturedGames] = useState([]);
  const [dbFeaturedTools, setDbFeaturedTools] = useState([]);
  const [isLoadingLanding, setIsLoadingLanding] = useState(true); // NEW: Loading state for the homepage

  const USPS = [
    { icon: Brain, title: "NEP & NCF Aligned", desc: "Engineered to target the specific competencies written in NEP and NCF.", color: "text-sky-500", bg: "bg-sky-100", shadow: "shadow-sky-200/50" },
    { icon: Layers, title: "Systematic Progression", desc: "Pedagogically correct and beautifully sequenced learning pathways.", color: "text-orange-500", bg: "bg-orange-100", shadow: "shadow-orange-200/50" },
    { icon: User, title: "Individualised Learning", desc: "Adapts perfectly to every student's unique pace and style.", color: "text-lime-600", bg: "bg-lime-100", shadow: "shadow-lime-200/50" },
    { icon: Star, title: "Quality Guaranteed", desc: "Quality education and foundational excellence for all guaranteed.", color: "text-pink-500", bg: "bg-pink-100", shadow: "shadow-pink-200/50" },
    { icon: BarChart, title: "AI Powered Analytics", desc: "Actionable AI analytics and personalized suggested feedbacks.", color: "text-purple-500", bg: "bg-purple-100", shadow: "shadow-purple-200/50" }
  ];

  const getIcon = (typeStr: any) => {
    if (typeStr === 'Video') return Video;
    if (typeStr === 'Game' || typeStr === 'Gamepad2') return Gamepad2;
    if (typeStr === 'PDF' || typeStr === 'FileText') return FileText;
    return Layers;
  };

  useEffect(() => {
    const interval = setInterval(() => { setActiveUsp((prev) => (prev + 1) % USPS.length); }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchLandingData() {
      setIsLoadingLanding(true);
      try {
        // Fetch ONLY the items you explicitly marked as 'TRUE' in the is_featured column
        const q = query(collection(db, 'learning_tools'), where('is_featured', '==', true), limit(30)); 
        const snapshot = await getDocs(q);
        const featuredItems = snapshot.docs.map((d: any) => ({id: d.id, ...d.data()}));

        let games = [];
        let tools = [];
        let uniqueChaptersMap = {};

        featuredItems.forEach((item: any) => {
          // 1. Route the content into Games vs General Tools
          if (item.content_type?.toLowerCase() === 'game') {
             games.push(item);
          } else if (item.content_type && item.content_type?.toLowerCase() !== 'placeholder') {
             tools.push(item);
          }

          // 2. Build the "Featured Chapters" display cards automatically
          const chapterKey = `${item.grade}_${item.subject}_${item.chapter_number}`;
          if (!uniqueChaptersMap[chapterKey]) {
             uniqueChaptersMap[chapterKey] = {
                id: chapterKey,
                grade: item.grade,
                subject: item.subject,
                chapter: item.chapter_name, // Maps to your UI's expected variable
                book: item.book || 'Kortex Klassroom',
                image: item.image || getSubjectFallbackImage(item.subject),
                color: item.color || 'border-sky-500',
                items: 1 
             };
          } else {
             // Increment the item count for the little UI badge
             uniqueChaptersMap[chapterKey].items += 1;
          }
        });

        const featuredLessonsArray = Object.values(uniqueChaptersMap);

        // Update the states (slice to 4 so the UI grid looks perfect)
        setDbFeaturedLessons(featuredLessonsArray.slice(0, 4));
        setDbFeaturedGames(games.slice(0, 4));
        setDbFeaturedTools(tools.slice(0, 4));

      } catch (error: any) { 
          console.error("Error fetching featured content:", error); 
      } finally {
          setIsLoadingLanding(false);
      }
    }
    
    fetchLandingData();
  }, []);

  return (
  <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in relative">
    <div className="bg-sky-50 pt-16 pb-32 px-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-20 h-20 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-20 w-32 h-32 bg-lime-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">Smarter tools <br/><span className="text-sky-500">Stronger Minds.</span></h1>
          <p className="text-xl text-slate-600 font-medium max-w-lg mx-auto md:mx-0">India's first NEP 2020 aligned platform. Thousands of interactive games and lesson plans from Balvatika to Grade 8.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
            <Button variant="primary" className="text-lg px-8 py-4 w-full sm:w-auto" onClick={() => requireAuth(() => {setRole('student'); setStage('foundational');}, "Create a free account to track your progress and unlock all games!")}>Sign Up for Free</Button>
            <Button variant="secondary" className="text-lg px-8 py-4 w-full sm:w-auto border-2 border-slate-300" onClick={onTryDemo}>Try Demo Lesson</Button>
          </div>
        </div>
        <div className="hidden md:flex justify-center items-center relative h-[450px] w-full z-10">
           {USPS.map((usp: any, idx: any) => {
              let diff = idx - activeUsp;
              if (diff < -2) diff += 5; if (diff > 2) diff -= 5;
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

    <div className="w-full bg-white border-y-4 border-slate-100 py-4 overflow-hidden relative flex items-center z-30 shadow-sm">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
      <div className="flex animate-marquee w-max hover:[animation-play-state:paused]">
        {[...SUBJECTS, ...SUBJECTS, ...SUBJECTS].map((subject: any, idx: any) => {
          const subjectData = SUBJECT_ICONS[subject] || { icon: Star, color: 'text-slate-400' };
          const Icon = subjectData.icon;
          return (<div key={idx} className="mx-3 px-5 py-2 bg-slate-50 border-2 border-slate-200 rounded-full font-black text-slate-500 text-xs uppercase tracking-wider flex-shrink-0 flex items-center gap-2 hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50 transition-colors cursor-default shadow-sm group"><Icon size={16} className={`${subjectData.color} transition-transform group-hover:scale-125`} />{subject}</div>);
        })}
      </div>
    </div>

    <div id="demo-portals" className="max-w-6xl mx-auto px-4 py-20 w-full relative z-20">
      <h2 className="text-3xl font-extrabold text-slate-800 text-center mb-2">Select Your Role</h2>
      <p className="text-center text-slate-500 font-bold mb-10">Choose your portal below to dive into personalized learning experiences.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card onClick={() => setRole('teacher')} className="p-8 text-center group border-b-8 border-sky-500 hover:border-sky-400">
          <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-sky-500 transition-colors"><BookOpen size={36} className="text-sky-500 group-hover:text-white transition-colors" /></div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Teacher Hub</h3>
          <p className="text-slate-500 font-medium mb-6">Preview lesson plans, manage curriculum, and track competencies.</p>
          <Button variant="outline" className="w-full border-2 border-sky-500 text-sky-500 hover:bg-sky-50">Enter Teacher Portal</Button>
        </Card>
        <Card onClick={() => setRole('parent')} className="p-8 text-center group border-b-8 border-orange-500 hover:border-orange-400">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-500 transition-colors"><Users size={36} className="text-orange-500 group-hover:text-white transition-colors" /></div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Parent Portal</h3>
          <p className="text-slate-500 font-medium mb-6">View 360° holistic reports and track Panchakosha wellness progress.</p>
          <Button variant="outline" className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-50">Enter Parent Portal</Button>
        </Card>
        <Card onClick={() => {setRole('student'); setStage('foundational');}} className="p-8 text-center group border-b-8 border-lime-500 hover:border-lime-400">
          <div className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-lime-500 transition-colors"><Gamepad2 size={36} className="text-lime-600 group-hover:text-white transition-colors" /></div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Student Hub</h3>
          <p className="text-slate-500 font-medium mb-6">Interactive, gamified learning pathways designed for holistic growth.</p>
          <Button variant="outline" className="w-full border-2 border-lime-600 text-lime-600 hover:bg-lime-50">Enter Student Portal</Button>
        </Card>
      </div>
    </div>

    {/* Featured Learning Tools Slider */}
    <div className="max-w-6xl mx-auto px-4 pb-20 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
        <div><h2 className="text-3xl font-extrabold text-slate-800">Featured Learning Tools</h2><p className="text-slate-500 font-medium mt-2">Bite-sized interactive videos and presentations.</p></div>
        <Button variant="secondary" onClick={onNavigateToTools} className="hidden sm:flex shrink-0 border-2">View All Tools</Button>
      </div>
      <div className="flex overflow-x-auto gap-6 pb-4 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {isLoadingLanding ? (
            <div className="p-8 text-slate-400 font-bold w-full text-center">Loading tools from database...</div>
        ) : dbFeaturedTools.length > 0 ? (
            dbFeaturedTools.map((tool: any, idx: any) => {
              const Icon = getIcon(tool.content_type);
              return (
                <Card key={idx} className="min-w-[280px] sm:min-w-[320px] snap-start hover:border-sky-300 flex-shrink-0 cursor-pointer group relative p-0 flex flex-col" onClick={() => onOpenFeatured(tool)}>
                  <div className="relative h-40 w-full bg-slate-200 overflow-hidden">
                     <img src={tool.image || '/kortex_default_cover.png'} alt={tool.title || 'Kortex Klassroom'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                     <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
                     <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                       <span className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">{tool.type}</span>
                       {tool.isPremium && (<div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1"><Star size={10} className="fill-white" /> PRO</div>)}
                     </div>
                     <div className={`absolute -bottom-6 left-6 w-14 h-14 rounded-2xl ${tool.color || 'bg-sky-500'} text-white flex items-center justify-center shadow-lg border-4 border-white transform group-hover:-translate-y-1 transition-transform`}><Icon size={24} /></div>
                  </div>
                  <div className="pt-10 pb-6 px-6 bg-white flex-1 flex flex-col">
                    <div className="mb-2">
                       <p className="text-xs font-black text-sky-600 uppercase tracking-wider line-clamp-1">{tool.lessonContext?.chapter || 'General Resource'}</p>
                       {tool.lessonContext?.subtopic && <p className="text-[10px] font-bold text-sky-400 mt-0.5 truncate">↳ {tool.lessonContext.subtopic}</p>}
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-3 group-hover:text-sky-600 transition-colors flex items-center gap-2 leading-tight line-clamp-2">{tool.title} {tool.isPremium && !isLoggedIn && <Lock size={16} className="text-slate-300 shrink-0"/>}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-auto pt-4 border-t border-slate-100"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{tool.grade}</span><span>•</span><span className="truncate">{tool.subject}</span></div>
                  </div>
                </Card>
              );
            })
        ) : (
            <div className="p-8 text-slate-400 font-bold w-full text-center border-2 border-dashed border-slate-200 rounded-2xl">No featured tools available yet.</div>
        )}
      </div>
      <Button variant="secondary" onClick={onNavigateToTools} className="w-full mt-4 sm:hidden border-2">View All Tools</Button>
    </div>

    {/* Featured Games Slider */}
    <div className="max-w-6xl mx-auto px-4 pb-20 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
        <div><h2 className="text-3xl font-extrabold text-slate-800">Featured Games</h2><p className="text-slate-500 font-medium mt-2">Playful, interactive modules to test your skills.</p></div>
        <Button variant="secondary" onClick={onNavigateToGames} className="hidden sm:flex shrink-0 border-2">View All Games</Button>
      </div>
      <div className="flex overflow-x-auto gap-6 pb-4 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {isLoadingLanding ? (
            <div className="p-8 text-slate-400 font-bold w-full text-center">Loading games from database...</div>
        ) : dbFeaturedGames.length > 0 ? (
            dbFeaturedGames.map((game: any, idx: any) => {
              const Icon = getIcon(game.content_type);
              return (
                <Card key={idx} className="min-w-[280px] sm:min-w-[320px] snap-start hover:border-pink-400 flex-shrink-0 cursor-pointer group relative p-0 flex flex-col border-b-4 border-b-pink-500" onClick={() => onOpenFeatured(game)}>
                  <div className="relative h-40 w-full bg-slate-200 overflow-hidden">
   <img src={game.image || '/kortex_default_cover.png'} alt={game.title || 'Kortex Klassroom'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
   <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
                     <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                       <span className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">{game.type}</span>
                       {game.isPremium && (<div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1"><Star size={10} className="fill-white" /> PRO</div>)}
                     </div>
                     <div className={`absolute -bottom-6 left-6 w-14 h-14 rounded-2xl ${game.color || 'bg-pink-500'} text-white flex items-center justify-center shadow-lg border-4 border-white transform group-hover:-translate-y-1 transition-transform`}><Icon size={24} /></div>
                  </div>
                  <div className="pt-10 pb-6 px-6 bg-white flex-1 flex flex-col">
                    <div className="mb-2">
                       <p className="text-xs font-black text-pink-600 uppercase tracking-wider line-clamp-1">{game.lessonContext?.chapter || 'Arcade Mode'}</p>
                       {game.lessonContext?.subtopic && <p className="text-[10px] font-bold text-pink-400 mt-0.5 truncate">↳ {game.lessonContext.subtopic}</p>}
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-3 group-hover:text-pink-600 transition-colors flex items-center gap-2 leading-tight line-clamp-2">{game.title} {game.isPremium && !isLoggedIn && <Lock size={16} className="text-slate-300 shrink-0"/>}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-auto pt-4 border-t border-slate-100"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{game.grade}</span><span>•</span><span className="truncate">{game.subject}</span></div>
                  </div>
                </Card>
              );
            })
        ) : (
            <div className="p-8 text-slate-400 font-bold w-full text-center border-2 border-dashed border-slate-200 rounded-2xl">No featured games available yet.</div>
        )}
      </div>
      <Button variant="secondary" onClick={onNavigateToGames} className="w-full mt-4 sm:hidden border-2">View All Games</Button>
    </div>

    {/* Featured Lessons Slider */}
    <div className="max-w-6xl mx-auto px-4 pb-24 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
        <div><h2 className="text-3xl font-extrabold text-slate-800">Featured Lessons</h2><p className="text-slate-500 font-medium mt-2">Complete learning pathways mapped to the curriculum.</p></div>
        <Button variant="secondary" onClick={onNavigateToLessons} className="hidden sm:flex shrink-0 border-2">View All Lessons</Button>
      </div>
      <div className="flex overflow-x-auto gap-6 pb-4 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {isLoadingLanding ? (
             <div className="p-8 text-slate-400 font-bold w-full text-center">Loading lessons from database...</div>
        ) : dbFeaturedLessons.length > 0 ? (
            dbFeaturedLessons.map((lesson: any, idx: any) => (
              <Card key={idx} className={`min-w-[300px] sm:min-w-[360px] snap-start border-b-8 ${lesson.color || 'border-sky-500'} flex-shrink-0 cursor-pointer group transition-all duration-300 hover:shadow-lg p-0 flex flex-col`} onClick={() => onOpenFeatured(lesson)}>
                <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                   <img src={lesson.image || '/kortex_default_cover.png'} alt={lesson.chapter || 'Kortex Klassroom'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                   <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/20 to-transparent pointer-events-none"></div>
                   <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
                      <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm max-w-[65%] truncate">{lesson.book}</span>
                      <div className="bg-slate-900/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm shrink-0"><Layers size={14} /> {lesson.items} Items</div>
                   </div>
                </div>
                <div className="p-6 bg-white flex-1 flex flex-col group-hover:bg-slate-50 transition-colors">
                   <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-sky-600 transition-colors leading-tight line-clamp-2">{lesson.chapter}</h3>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{lesson.grade}</span><span>•</span><span>{lesson.subject}</span></div>
                   <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 mt-auto pt-4 border-t border-slate-100">
                      <span className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md shadow-sm"><Video size={14} className="text-pink-500"/> Video</span>
                      <span className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md shadow-sm"><Layers size={14} className="text-sky-500"/> PPT</span>
                      <span className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md shadow-sm"><Gamepad2 size={14} className="text-orange-500"/> Quiz</span>
                   </div>
                </div>
              </Card>
            ))
        ) : (
            <div className="p-8 text-slate-400 font-bold w-full text-center border-2 border-dashed border-slate-200 rounded-2xl">No featured lessons available yet.</div>
        )}
      </div>
      <Button variant="secondary" onClick={onNavigateToLessons} className="w-full mt-4 sm:hidden border-2">View All Lessons</Button>
    </div>

    {/* Testimonials */}
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
     show: false, isEdit: false, originalData: null,
     grade: '', subject: '', book: 'Kortex Klassroom', chapterSelect: '', newChapter: '', subtopicSelect: '', newSubtopic: '', 
     toolType: 'Video', toolTitle: '', url: '', gameCode: '', isPremium: false, orderIndex: 1 
  };
  const [krewWizard, setKrewWizard] = useState(initialWizardState);
  
  const [krewEdit, setKrewEdit] = useState({ show: false, type: '', chapterId: '', oldTitle: '', newTitle: '', parentSubtopic: '' });
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const toggleSubTopic = (id) => setExpandedSubTopics(prev => ({ ...prev, [id]: !prev[id] }));

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

        // 3. GROUPING LOGIC (The exact code you found!)
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

        // 4. SORTING LOGIC: Make sure Chapters and Videos are in exact order
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



  useEffect(() => {
    async function fetchWizardData() {
      if(krewWizard.show && krewWizard.grade && krewWizard.subject) {
        const filterGrade = krewWizard.grade.toLowerCase().trim();
        const filterSubject = krewWizard.subject.toLowerCase().trim();
        try {
          const snapshot = await getDocs(collection(db, 'learning_tools'));
          const allMods = snapshot.docs.map(d => ({
  id: d.id, 
  ...d.data()
} as { 
  id: string; subject?: string; grade?: string; chapter?: string; subTopics?: any[]; 
}));
          const filtered = allMods.filter(m => {
             const dbSubj = m.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : m.subject?.toLowerCase().trim();
             return m.grade?.toLowerCase().trim() === filterGrade && dbSubj === filterSubject;
          });
          setWizardData(filtered);
        } catch (e: any) { console.error(e); }
      } else { setWizardData([]); }
    }
    fetchWizardData();
  }, [krewWizard.grade, krewWizard.subject, krewWizard.show]);

  const selectedChapData = wizardData.find(c => c.chapter === krewWizard.chapterSelect);
  const availableSubtopics = selectedChapData?.subTopics || [];

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

  const handleSubmitWizard = async () => {
     const finalChapter = krewWizard.chapterSelect === 'NEW' ? krewWizard.newChapter : krewWizard.chapterSelect;
     const finalSubtopic = krewWizard.subtopicSelect === 'NEW' ? krewWizard.newSubtopic : krewWizard.subtopicSelect;
     if (!krewWizard.grade || !krewWizard.subject || !finalChapter || !finalSubtopic || !krewWizard.toolTitle) { alert("Please fill out all required tiers!"); return; }
     setIsSendingRequest(true);
     
     const payload = {
        title: krewWizard.toolTitle, grade: krewWizard.grade, subject: krewWizard.subject, book: krewWizard.book || 'Kortex Klassroom', chapter: finalChapter, subtopic: finalSubtopic,
        tool: { type: krewWizard.toolType, title: krewWizard.toolTitle, content_url: krewWizard.url, gameCode: krewWizard.gameCode, orderIndex: Number(krewWizard.orderIndex), isPremium: krewWizard.isPremium, color: (krewWizard.toolType === 'Game' || krewWizard.toolType === 'Quiz') ? 'bg-orange-500' : 'bg-sky-500' }
     };

     const actionType = krewWizard.isEdit ? 'FULL_TIER_EDIT' : 'FULL_TIER_ADD';

     try {
       await addDoc(collection(db, 'content_requests'), {
          krew_member_id: auth.currentUser.uid, krew_member_email: auth.currentUser.email,
          action_type: actionType, target_type: 'TOOL', target_grade: krewWizard.grade, target_subject: krewWizard.subject, 
          payload: payload, originalData: krewWizard.originalData || null, status: 'pending', created_at: new Date().toISOString()
       });
       alert(`Success! ${krewWizard.isEdit ? 'Edit' : 'Add'} Request sent to Admin for approval.`);
       setKrewWizard(initialWizardState);
     } catch (error: any) { console.error(error); alert("Error sending request."); } finally { setIsSendingRequest(false); }
  };

  const handleKrewDelete = async (targetType, targetId, title) => {
     // 1. The Failsafe: If title is undefined, we give it a default string so Firebase doesn't crash
     const safeTitle = title || 'Untitled Item';
     
     if (!window.confirm(`Send request to Admin to DELETE "${safeTitle}"?`)) return;
     
     try {
       // Add a fallback here too, just in case the filter is empty
       const filterString = selectedAnalyticsFilter || '';
       const [grade, subject] = filterString.split(' • ');
       
       await addDoc(collection(db, 'content_requests'), { 
         krew_member_id: auth.currentUser.uid, 
         krew_member_email: auth.currentUser.email,
         action_type: 'DELETE', 
         target_type: targetType, 
         target_id: targetId, 
         target_grade: grade?.trim() || '', 
         target_subject: subject?.trim() || '', 
         // 2. Pass the safeTitle to the payload
         payload: { title: safeTitle }, 
         status: 'pending', 
         created_at: new Date().toISOString()
       });
       alert("Delete request sent to Admin!");
     } catch (error: any) { 
       console.error(error); 
       alert("Error sending delete request.");
     }
  };

  const handleEditClick = (type, chapterId, oldTitle, parentSubtopic = null) => {
    setKrewEdit({ show: true, type, chapterId, oldTitle, newTitle: oldTitle, parentSubtopic });
  };

  const handleSendQuickEdit = async () => {
    if (!krewEdit.newTitle) return;
    setIsSendingRequest(true);
    try {
      const [grade, subject] = selectedAnalyticsFilter.split(' • ');
      await addDoc(collection(db, 'content_requests'), { 
         krew_member_id: auth.currentUser.uid, krew_member_email: auth.currentUser.email,
         action_type: 'EDIT', target_type: krewEdit.type, target_id: krewEdit.chapterId, target_grade: grade.trim(), target_subject: subject.trim(), 
         payload: { oldTitle: krewEdit.oldTitle, newTitle: krewEdit.newTitle, parentSubtopic: krewEdit.parentSubtopic }, 
         status: 'pending', created_at: new Date().toISOString()
       });
       alert("Quick Edit request sent to Admin for approval.");
       setKrewEdit({ show: false, type: '', chapterId: '', oldTitle: '', newTitle: '', parentSubtopic: '' });
    } catch (error: any) { console.error(error); } finally { setIsSendingRequest(false); }
  };

  const handleFullEditClick = (tool, subtopicTitle, lesson) => {
    let normalizedType = 'Video';
    if (tool.type) {
       const t = tool.type.toLowerCase();
       if (t === 'game' || t === 'gamepad2') normalizedType = 'Game';
       else if (t === 'pdf') normalizedType = 'PDF';
       else if (t === 'presentation' || t === 'ppt') normalizedType = 'Presentation';
       else if (t === 'quiz') normalizedType = 'Quiz';
    }

    let normalizedSubject = lesson.subject?.trim() || '';
    if (normalizedSubject.toLowerCase() === 'mathematics') normalizedSubject = 'Maths';
    else if (normalizedSubject) normalizedSubject = normalizedSubject.charAt(0).toUpperCase() + normalizedSubject.slice(1).toLowerCase();
    
    let normalizedGrade = lesson.grade?.trim() || '';

    const currentSubtopic = lesson.subTopics?.find(s => s.title === subtopicTitle);
    const actualIndex = currentSubtopic ? currentSubtopic.tools.findIndex(t => t.title === tool.title) : 0;
    const finalOrderIndex = tool.orderIndex || (actualIndex + 1);

    setKrewWizard({
      show: true, isEdit: true,
      originalData: { chapter: lesson.chapter, subtopic: subtopicTitle, toolTitle: tool.title },
      grade: normalizedGrade, subject: normalizedSubject, book: lesson.book || 'Kortex Klassroom',
      chapterSelect: lesson.chapter, newChapter: '', subtopicSelect: subtopicTitle, newSubtopic: '',
      toolType: normalizedType, toolTitle: tool.title, url: tool.content_url || '',
      gameCode: tool.gameCode || (normalizedType === 'Game' || normalizedType === 'Quiz' ? tool.title : ''), 
      isPremium: tool.isPremium || false, orderIndex: finalOrderIndex
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
               <input type="text" autoFocus value={krewEdit.newTitle} onChange={(e: any) => setKrewEdit({...krewEdit, newTitle: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500 mb-6" />
               <Button onClick={handleSendQuickEdit} disabled={!krewEdit.newTitle || isSendingRequest || krewEdit.newTitle === krewEdit.oldTitle} className="w-full bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 py-3 text-lg">{isSendingRequest ? 'Sending...' : 'Submit Edit Request'}</Button>
            </div>
         </div>
      )}

      {krewWizard.show && (
         <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in px-4 py-12 sm:py-24 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl relative border-4 border-emerald-100 my-auto">
               <button onClick={() => setKrewWizard(initialWizardState)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"><X size={20} /></button>
               <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 ${krewWizard.isEdit ? 'bg-amber-100' : 'bg-emerald-100'} rounded-2xl flex items-center justify-center transform -rotate-3`}>
                     {krewWizard.isEdit ? <Edit3 size={28} className="text-amber-500"/> : <Shield size={28} className="text-emerald-500"/>}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{krewWizard.isEdit ? 'Edit Learning Tool' : '5-Tier Content Wizard'}</h2>
                    <p className={`${krewWizard.isEdit ? 'text-amber-600' : 'text-emerald-600'} font-bold text-sm`}>{krewWizard.isEdit ? `Modifying '${krewWizard.originalData?.toolTitle}'` : 'Design curriculum payloads securely.'}</p>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 grid grid-cols-2 gap-4">
                     <div><label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Tier 1: Grade *</label><select value={krewWizard.grade} onChange={(e: any) => setKrewWizard({...krewWizard, grade: e.target.value, chapterSelect: '', subtopicSelect: ''})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500"><option value="">Select...</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                     <div><label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Tier 2: Subject *</label><select value={krewWizard.subject} onChange={(e: any) => setKrewWizard({...krewWizard, subject: e.target.value, chapterSelect: '', subtopicSelect: ''})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500"><option value="">Select...</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 space-y-4">
                     <div><label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Tier 3: Chapter *</label><select value={krewWizard.chapterSelect} onChange={(e: any) => setKrewWizard({...krewWizard, chapterSelect: e.target.value, subtopicSelect: ''})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500"><option value="" disabled>Select Existing Chapter...</option>{wizardData.map(c => <option key={c.id} value={c.chapter}>{c.chapter}</option>)}<option value="NEW" className="font-bold text-emerald-600">+ Create New Chapter</option></select>{krewWizard.chapterSelect === 'NEW' && (<input type="text" value={krewWizard.newChapter} onChange={(e: any) => setKrewWizard({...krewWizard, newChapter: e.target.value})} className="mt-2 w-full bg-white border-2 border-emerald-200 rounded-xl px-4 py-3 font-bold text-emerald-700 outline-none" placeholder="Type new chapter name..." />)}</div>
                     <div><label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Tier 4: Subtopic *</label><select value={krewWizard.subtopicSelect} onChange={(e: any) => setKrewWizard({...krewWizard, subtopicSelect: e.target.value})} disabled={!krewWizard.chapterSelect || krewWizard.chapterSelect === 'NEW'} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-50"><option value="" disabled>Select Existing Subtopic...</option>{availableSubtopics.map((s, idx) => <option key={idx} value={s.title}>{s.title}</option>)}<option value="NEW" className="font-bold text-emerald-600">+ Create New Subtopic</option></select>{krewWizard.subtopicSelect === 'NEW' && (<input type="text" value={krewWizard.newSubtopic} onChange={(e: any) => setKrewWizard({...krewWizard, newSubtopic: e.target.value})} className="mt-2 w-full bg-white border-2 border-emerald-200 rounded-xl px-4 py-3 font-bold text-emerald-700 outline-none" placeholder="Type new subtopic name..." />)}</div>
                  </div>
                  <div className={`${krewWizard.isEdit ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'} p-5 rounded-2xl border-2 space-y-4`}>
                     <div className="flex justify-between items-center mb-2"><label className={`block text-xs font-black ${krewWizard.isEdit ? 'text-amber-600' : 'text-emerald-600'} uppercase tracking-wider`}>Tier 5: Learning Tool Output</label><div className="flex items-center gap-2"><input type="checkbox" id="prem" checked={krewWizard.isPremium} onChange={(e: any) => setKrewWizard({...krewWizard, isPremium: e.target.checked})} className="w-4 h-4 accent-amber-500 cursor-pointer" /><label htmlFor="prem" className="text-xs font-bold text-slate-600 cursor-pointer flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500"/> Pro Only</label></div></div>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1"><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Order Index</label><input type="number" min="1" value={krewWizard.orderIndex} onChange={(e: any) => setKrewWizard({...krewWizard, orderIndex: e.target.value})} className="w-full bg-white border-2 border-emerald-200 rounded-xl px-3 py-3 font-black text-center text-slate-700 outline-none focus:border-emerald-500" /></div>
                        <div className="md:col-span-1"><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Type</label><select value={krewWizard.toolType} onChange={(e: any) => setKrewWizard({...krewWizard, toolType: e.target.value})} className="w-full bg-white border-2 border-emerald-200 rounded-xl px-3 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500"><option value="Video">Video</option><option value="Game">Game</option><option value="PDF">PDF</option><option value="Presentation">PPT</option><option value="Quiz">Quiz</option></select></div>
                        <div className="md:col-span-2"><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Tool Title</label><input type="text" value={krewWizard.toolTitle} onChange={(e: any) => setKrewWizard({...krewWizard, toolTitle: e.target.value})} className="w-full bg-white border-2 border-emerald-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500" placeholder="e.g. Photosynthesis 3D" /></div>
                     </div>
                     <div>{['Game', 'Quiz'].includes(krewWizard.toolType) ? (<><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Raw Code Snippet</label><textarea value={krewWizard.gameCode} onChange={(e: any) => setKrewWizard({...krewWizard, gameCode: e.target.value})} className="w-full h-32 bg-slate-900 text-emerald-400 font-mono text-xs border-2 border-slate-700 rounded-xl p-4 outline-none focus:border-emerald-500" placeholder="// Code" /></>) : (<><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Secure Embed URL Link</label><input type="text" value={krewWizard.url} onChange={(e: any) => setKrewWizard({...krewWizard, url: e.target.value})} className="w-full bg-white border-2 border-emerald-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-700 outline-none focus:border-emerald-500 text-sm" placeholder="https://..." /></>)}</div>
                  </div>
               </div>
               <Button onClick={handleSubmitWizard} disabled={isSendingRequest || !krewWizard.toolTitle} className={`w-full mt-8 ${krewWizard.isEdit ? 'bg-amber-500 hover:bg-amber-600 border-amber-700' : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700'} border-b-4 active:border-b-0 py-4 text-lg`}>{isSendingRequest ? 'Packaging...' : 'Send Payload to Admin Queue'}</Button>
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
    setPlayingLesson({
      chapter: 'Preview: The Magic of Kortex', book: 'Demo Mode',
      flow: [
        { type: 'Video', title: 'Welcome to Kortex', content_url: 'https://www.youtube.com/watch?v=M6XvN0V-vLw', color: 'bg-sky-500', isPremium: false },
        { type: 'Game', title: 'Interactive Challenge', color: 'bg-orange-500', isPremium: false }
      ]
    });
    setPlayingStep(0);
  };

  const handleOpenFeatured = (item) => {
    if (item.lessonContext && typeof item.stepIndex !== 'undefined') {
      const action = () => { setPlayingLesson(item.lessonContext); setPlayingStep(item.stepIndex); };
      if (item.isPremium) requireAuth(action, "This is a Premium Game. Sign up for free to access it!"); else action();
      return;
    }
    const action = () => {
      setRole('teacher'); setCurrentView('home');
      setTargetContext({ grade: item.grade, subject: item.subject, lesson: item });
    };
    if (item.isPremium) requireAuth(action, "This is a Premium Resource. Sign up for free to access it!"); else action();
  };

  const handleStartLesson = (lesson, stepIndex) => {
    const playlist = lesson.flow || (lesson.subTopics ? lesson.subTopics.flatMap(sub => sub.tools || []) : []);
    const item = playlist[stepIndex];
    
    if (item?.isPremium && !isLoggedIn) { 
       setAuthMessage("Create a free account to unlock Premium interactive content!"); 
       setShowAuthModal(true); 
    } else { 
       setPlayingLesson(lesson); 
       setPlayingStep(stepIndex); 
    }
  };

  const renderContent = () => {
    if (currentView === 'games') return <GamesView isLoggedIn={isLoggedIn} requireAuth={requireAuth} onStartGame={handleStartLesson} />;
    if (currentView === 'lessons') return <LessonsView isLoggedIn={isLoggedIn} requireAuth={requireAuth} onStartLesson={handleStartLesson} />;
    if (currentView === 'tools') return <ToolsView isLoggedIn={isLoggedIn} requireAuth={requireAuth} onOpenTool={(tool) => { setPlayingLesson(tool.lessonContext); setPlayingStep(tool.stepIndex); }} />;
    if (role === 'student') return <StudentView t={t} onStartLesson={handleStartLesson} currentStudent={currentStudent} isLoggedIn={isLoggedIn} requireAuth={requireAuth} />;
    if (role === 'parent') return <ParentView t={t} isLoggedIn={isLoggedIn} requireAuth={requireAuth} onStartDemo={handleStartDemo} isPro={isPro} />;
    if (role === 'teacher' || role === 'krew') {return <TeacherView userName={userName} t={t} isLoggedIn={isLoggedIn} requireAuth={requireAuth} onStartLesson={handleStartLesson} targetContext={targetContext} isPro={isPro} role={role} />;}
    if (role === 'admin') return <AdminView />;
    return <LandingView setRole={setRole} setStage={setStage} requireAuth={requireAuth} onTryDemo={handleStartDemo} isLoggedIn={isLoggedIn} onOpenFeatured={handleOpenFeatured} onShowAlert={setAlertConfig} onNavigateToGames={() => setCurrentView('games')} onNavigateToLessons={() => setCurrentView('lessons')} onNavigateToTools={() => setCurrentView('tools')} />;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-sky-200 relative">
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} authMessage={authMessage} 
          onStartDemo={() => { setShowAuthModal(false); handleStartDemo(); }}
          onStudentLogin={(studentData) => { setRole('student'); setIsLoggedIn(true); setCurrentStudent(studentData); }}
        />
      )}
      {alertConfig && <GeneralAlertModal {...alertConfig} onClose={() => setAlertConfig(null)} />}
      
      {playingLesson && (
        <LessonPlayer 
          lesson={playingLesson} initialStep={playingStep} isPro={isPro} isLoggedIn={isLoggedIn}
          onClose={() => setPlayingLesson(null)} 
          onFinish={() => { 
            setPlayingLesson(null); 
            if (!isLoggedIn) { setAuthMessage("Create a free account to track your progress!"); setShowAuthModal(true); }
          }} 
          onTimeUp={() => {
             setPlayingLesson(null); setAuthMessage("Your free preview time has expired! Create a free account to keep learning."); setShowAuthModal(true);
          }}
        />
      )}
      
      <nav className="bg-white border-b-4 border-sky-500 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => { setCurrentView('home'); setStage(null); if (!isLoggedIn) setRole(null); }}>
            <Image 
              src="/logo.svg" 
              alt="Kortex Klassroom Logo" 
              width={200} 
              height={50} 
              priority 
              className="h-10 w-auto rounded-xl -rotate-3" 
            />
            <span className="font-black text-2xl tracking-tight text-slate-800 hidden sm:block">Kortex<span className="text-sky-500"> Klassroom</span></span>
          </div>

          <div className="flex-1 max-w-xl mx-4 hidden lg:block relative">
            <input type="text" placeholder="Search any game, tool, grade, subject topic etc." className="w-full bg-slate-100 border-2 border-slate-200 rounded-full py-2.5 pl-5 pr-10 font-bold text-slate-700 outline-none focus:border-sky-500 focus:bg-white transition-colors" onClick={() => alert("Global smart search coming soon! For now, click 'Games' or 'Lessons' to filter specifically.")} />
            <Search className="absolute right-4 top-3 text-slate-400" size={18} />
          </div>

          <div className="flex items-center gap-4 shrink-0 ml-auto">
            {isLoggedIn ? (
               <div className="hidden sm:flex items-center gap-3">
                 <div className="text-right">
                   <div className="text-sm font-bold text-slate-800 leading-none">{userName || userEmail.split('@')[0]}</div>
                   <div className="text-xs font-bold text-sky-500 capitalize">{role} {isPro ? '(Pro)' : '(Free)'}</div>
                 </div>
                 <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 border-2 border-sky-200"><User size={20} /></div>
                 <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-2" title="Log Out"><LogOut size={18} /></button>
               </div>
            ) : (
               <div className="hidden lg:flex items-center gap-4 font-bold text-slate-600">
                 <button onClick={() => setCurrentView('lessons')} className={`transition-colors ${currentView === 'lessons' ? 'text-sky-500 border-b-2 border-sky-500' : 'hover:text-sky-500'}`}>Lessons</button>
                 <button onClick={() => setCurrentView('tools')} className={`transition-colors ${currentView === 'tools' ? 'text-sky-500 border-b-2 border-sky-500' : 'hover:text-sky-500'}`}>Learning Tools</button>
                 <button onClick={() => setCurrentView('games')} className={`transition-colors ${currentView === 'games' ? 'text-sky-500 border-b-2 border-sky-500' : 'hover:text-sky-500'}`}>Games</button>
                 <Button variant="outline" onClick={() => setShowAuthModal(true)} className="py-2 px-6 ml-2 text-sm border-2 shadow-none hover:-translate-y-0">Log In</Button>
               </div>
            )}
            <button className="md:hidden text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}</button>
          </div>
        </div>

        {mobileMenuOpen && (
           <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 absolute w-full shadow-xl">
              <div className="flex flex-col gap-3 font-bold text-slate-700 pb-2">
                 <div className="relative mb-2">
                    <input type="text" placeholder="Search..." className="w-full bg-slate-100 border-2 border-slate-200 rounded-full py-2.5 pl-5 pr-10 font-bold text-slate-700 outline-none" onClick={() => alert("Global search coming soon!")} />
                    <Search className="absolute right-4 top-3 text-slate-400" size={18} />
                 </div>
                 <button onClick={() => { setCurrentView('lessons'); setMobileMenuOpen(false); }} className={`text-left p-2 rounded-lg ${currentView === 'lessons' ? 'text-sky-500 bg-sky-50' : 'hover:bg-slate-50'}`}>Lessons</button>
                 <button onClick={() => { setCurrentView('tools'); setMobileMenuOpen(false); }} className={`text-left p-2 rounded-lg ${currentView === 'tools' ? 'text-sky-500 bg-sky-50' : 'hover:bg-slate-50'}`}>Learning Tools</button>
                 <button onClick={() => { setCurrentView('games'); setMobileMenuOpen(false); }} className={`text-left p-2 rounded-lg ${currentView === 'games' ? 'text-sky-500 bg-sky-50' : 'hover:bg-slate-50'}`}>Games</button>
                 {!isLoggedIn && <button onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }} className="text-left p-2 text-sky-500 mt-2 border-t-2 border-slate-100 pt-4">Log In / Sign Up</button>}
                 {isLoggedIn && <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-left p-2 text-red-500 mt-2 border-t-2 border-slate-100 pt-4">Log Out</button>}
              </div>
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

