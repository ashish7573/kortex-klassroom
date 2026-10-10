"use client";
import QuoteInquiryModal from "../kortex_users/auth/QuoteInquiryModal";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

import { User, Play, LogOut, Search, Star, Menu, X, Type, Target, MessageSquare } from 'lucide-react';
import ContactUsModal from '../kortex_users/shared/ContactUsModal';

import { useAuth } from '../hooks/useAuth';
import { auth, db, googleProvider } from '../backend_configurations/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { consumeHeart, checkAndResetDailyHearts, grantHeart, logStudentActivity } from '../app/actions/student';
import { doc, getDoc, onSnapshot, collection, getDocs, query, where, addDoc } from 'firebase/firestore';

// Re-export initialized Firebase instances for backward compatibility
export { auth, db, googleProvider };

// ============================================================================
// CURRICULUM CONFIG & SHARED UI (Modular libraries)
// ============================================================================
import { 
  GRADES, SUBJECTS, SUBJECT_ICONS, SUBJECT_IMAGES, 
  getSubjectFallbackImage, getYouTubeThumbnail, FIVE_TIERS, 
  TRANSLATIONS, TESTIMONIALS 
} from '../kortex_landing_page/curriculumConfig';

import { 
  Card, Button, ProgressBar, GeneralAlertModal, WorkInProgressView 
} from '../kortex_landing_page/components/SharedUI';
import PlaceholderAd from '../kortex_landing_page/components/PlaceholderAd';

// ============================================================================
// CORE VIEWS (Static for immediate first-paint)
// ============================================================================
import LandingView from '../kortex_landing_page/LandingPage';
import LessonsView from '../kortex_landing_page/all_lessons_page';
import TierLibraryView from '../kortex_landing_page/TierLibraryView';

// ============================================================================
// LAZY-LOADED COMPONENTS (Loaded on-demand for maximum page performance)
// ============================================================================
const LessonPlayer = dynamic(() => import('../kortex_landing_page/LessonPlayer'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white font-extrabold text-sm tracking-wider uppercase">Launching Interactive Lesson...</p>
      </div>
    </div>
  )
});

const UserPortalDispatcher = dynamic(() => import('../kortex_users/UserPortalDispatcher'), {
  ssr: false,
  loading: () => (
    <div className="py-24 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-bold text-sm tracking-wider uppercase">Opening Portal...</p>
    </div>
  )
});

const KrewEditorPanel = dynamic(() => import('../kortex_users/krew/KrewEditorPanel'), {
  ssr: false,
  loading: () => null
});

const UnifiedAuthModal = dynamic(() => import('../kortex_users/auth/UnifiedAuthModal'), {
  ssr: false,
  loading: () => null
});

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

  const { 
    user: authUser, 
    profile: authProfile, 
    role: authRole, 
    isLoggedIn: authIsLoggedIn, 
    isPro: authIsPro, 
    logout: authLogout, 
    sessionAlert,
    loading: authLoading
  } = useAuth();

  const [stage, setStage] = useState<string | null>(null);
  const [lang, setLang] = useState('en');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userEmail, setUserEmail] = useState(''); 
  const [userName, setUserName] = useState(''); 

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showContactUs, setShowContactUs] = useState(false);
  const [showGlobalQuote, setShowGlobalQuote] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authMessage, setAuthMessage] = useState("Join Kortex Klassroom to unlock all features.");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);
  
  // Ad System States
  const [showHeartAd, setShowHeartAd] = useState(false);
  const [pendingLessonResume, setPendingLessonResume] = useState<(() => void) | null>(null);

  const hasAutoRedirected = useRef(false);

  // Synchronize AuthContext reactive profile with local state
  useEffect(() => {
    if (authProfile) {
      _setRole(authProfile.role);
      setIsLoggedIn(true);
      setIsPro(authIsPro);
      setUserName((authProfile as any)?.organization_name || authProfile.full_name || '');
      setUserEmail(authProfile.email || authUser?.email || '');
      
      // Auto-redirect to dashboard if they land on the homepage and are already logged in
      if (!hasAutoRedirected.current) {
         hasAutoRedirected.current = true;
         if (currentView === 'home' && (!urlView || urlView === 'home')) {
            _setCurrentView('portal');
         }
      }
    } else if (!authUser) {
      _setRole(null);
      setIsLoggedIn(false);
      setIsPro(false);
      setUserName('');
      setUserEmail('');
    }
  }, [authProfile, authUser, authIsPro]);

  useEffect(() => {
    if (sessionAlert) {
      setAlertConfig(sessionAlert as any);
    }
  }, [sessionAlert]);

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
                  setUserName(data.organization_name || data.full_name || ''); 
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
    if (authLoading) return; // Wait for auth state to resolve

    if (sharedToolId && !playingLesson) {
      // Limit is now enforced centrally by ensureEnergy inside fetchSharedTool

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
            // Check central energy/guest limits
            const toolSubject = itemData.subject || 'unknown';
            const playableLesson = {
              chapter: itemData.chapter_name || itemData.chapter || itemData.title || 'Interactive Module',
              book: itemData.book || 'Kortex Klassroom',
              flow: [itemData]
            };
            const hasEnergy = await ensureEnergy(toolSubject, () => {
                setPlayingLesson(playableLesson);
                setPlayingStep(0);
            });
            if (!hasEnergy) return;
            
            setPlayingLesson(playableLesson);
            setPlayingStep(0);
          }
        } catch (error) { console.error("Error fetching shared tool:", error); }
      };
      fetchSharedTool();
    }
  }, [sharedToolId, authLoading, authIsLoggedIn, playingLesson]);

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
    
    const handleAuth = (e: any) => {
       setAuthMode(e.detail || 'signin');
       setShowAuthModal(true);
    };
    window.addEventListener('open-auth-modal', handleAuth);
    const handleQuote = () => setShowGlobalQuote(true);
    window.addEventListener('open-quote-modal', handleQuote);
    
    return () => {
      window.removeEventListener('navigate-tab', handleNav);
      window.removeEventListener('open-auth-modal', handleAuth);
      window.removeEventListener('open-quote-modal', handleQuote);
    };
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

  const ensureEnergy = async (toolSubject?: string, resumeCallback?: () => void) => {
    // 🔒 GUEST LIMIT CHECK
    if (!authIsLoggedIn) {
       const today = new Date().toISOString().split('T')[0];
       const guestKey = `kortex_guest_plays_${today}`;
       const plays = parseInt(localStorage.getItem(guestKey) || '0');
       
       if (plays >= 3) {
          setAlertConfig({
             title: "Free Demos Exhausted",
             message: "You've used all your free guest passes for the day! Create a free account to continue playing or check back tomorrow!",
             type: "warning",
             actionLabel: "Sign Up for Free",
             onAction: () => {
                setAlertConfig(null);
                setAuthMode('signup');
                setShowAuthModal(true);
             }
          } as any);
          return false;
       }
       localStorage.setItem(guestKey, (plays + 1).toString());
       return true;
    }

    if ((role === 'student' || role === 'parent') && !isPro && authProfile) {
        // --- B2B / B2C BYPASS CHECK ---
        if (toolSubject) {
            let isOwned = false;
            const matchStr = toolSubject.toLowerCase();
            
            // 1. If they belong to an organization, they get unlimited access to their school subjects
            // For simplicity, we bypass energy if they are in an org, as the org pays a bulk license.
            if ((authProfile as any).org_ids && (authProfile as any).org_ids.length > 0) {
                isOwned = true;
            }
            
            // 2. Check B2C licenses
            if (!isOwned && (authProfile as any).active_b2c_licenses) {
                isOwned = (authProfile as any).active_b2c_licenses.some((c: string) => c.toLowerCase().includes(matchStr));
            }
            
            if (isOwned) return true;
        }

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return false;
            
            const syncResult = await checkAndResetDailyHearts(token, authProfile.uid);
            const currentHearts = syncResult.hearts !== undefined ? syncResult.hearts : ((authProfile as any).hearts_remaining || 0);

            if (currentHearts <= 0 || (await consumeHeart(token, authProfile.uid)).success === false) {
                 setAlertConfig({
                    title: "Out of Energy!",
                    message: "You've used all your hearts for today. You can wait until tomorrow, or watch a short video to get 1 Heart right now!",
                    type: "warning",
                    actionLabel: "💖 Watch Ad for 1 Heart",
                    onAction: () => {
                       setAlertConfig(null);
                       setShowHeartAd(true);
                       // We save the callback so when the ad finishes, we resume.
                       if (resumeCallback) {
                           setPendingLessonResume(() => resumeCallback);
                       }
                    },
                    secondaryActionLabel: "Maybe Later",
                    onSecondaryAction: () => setAlertConfig(null)
                 } as any);
                 return false;
            }
            // Alert handled above
        } catch (e) { return false; }
    }
    return true;
  };

  const handleOpenFeatured = async (item: any) => {
      const playableLesson = {
        chapter: item.chapter_name || item.lessonContext?.chapter || item.title || 'Interactive Module',
        book: item.book || item.lessonContext?.book || 'Kortex Klassroom',
        flow: [item] 
      };
      const hasEnergy = await ensureEnergy(item.subject, () => {
          setPlayingLesson(playableLesson);
          setPlayingStep(0);
      });
      if (!hasEnergy) return;
      setPlayingLesson(playableLesson);
      setPlayingStep(0);
  };

  const handleStartLesson = async (lesson: any, stepIndex: any) => {
       const toolSubject = lesson.subject || (lesson.flow && lesson.flow[stepIndex]?.subject) || 'unknown';
       const hasEnergy = await ensureEnergy(toolSubject, () => {
           setPlayingLesson(lesson); 
           setPlayingStep(stepIndex); 
       });
       if (!hasEnergy) return;
       setPlayingLesson(lesson); 
       setPlayingStep(stepIndex); 
  };

  const renderContent = () => {
    if (currentView?.startsWith('lessons')) {
        let defaultClass = "";
        let defaultSubject = "";
        if (currentView.includes(':')) {
             const combo = currentView.split(':')[1];
             if (combo.includes(' - ')) {
                 const parts = combo.split(' - ');
                 defaultClass = parts[0].trim();
                 defaultSubject = parts[parts.length - 1].trim();
             } else {
                 const match = combo.match(/grade-(\d+)-(.*)/i);
                 if (match) {
                     defaultClass = `Grade ${match[1]}`;
                     defaultSubject = match[2];
                 }
             }
        }
        return <LessonsView isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onStartLesson={handleStartLesson} authProfile={authProfile} role={role} isPro={isPro} defaultClass={defaultClass} defaultSubject={defaultSubject} />;
    }
    
    const activeTierObj = FIVE_TIERS?.find(t => t.id === currentView);
    if (activeTierObj) {
      return <TierLibraryView activeTier={activeTierObj} isLoggedIn={isLoggedIn} requireAuth={(fn: any) => fn()} onOpenTool={handleOpenFeatured} authProfile={authProfile} role={role} isPro={isPro} />;
    }

    if (currentView === 'portal' && authProfile) {
      return (
        <UserPortalDispatcher 
          profile={authProfile} 
          onNavigateHome={() => setCurrentView('home')} 
          onExploreTier={(tierId: any) => {
             if (tierId && tierId.startsWith('play_tool:')) {
                const toolId = tierId.split(':')[1];
                // We just construct a dummy lesson with the ID, LessonPlayer handles the rest
                // Wait! LessonPlayer needs the full tool object?
                // Yes, LessonPlayer expects the flow to have the full objects.
                // We need to fetch it!
                import('firebase/firestore').then(({ doc, getDoc }) => {
                   import('../backend_configurations/firebase').then(async ({ db }) => {
                      const docSnap = await getDoc(doc(db, 'learning_tools', toolId));
                      if (docSnap.exists()) {
                         const toolData = { id: docSnap.id, ...docSnap.data() } as any;
                         const playableLesson = {
                            chapter: toolData.chapter_name || toolData.title || 'Interactive Module',
                            book: toolData.book || 'Kortex Klassroom',
                            flow: [toolData],
                            subject: toolData.subject
                         };
                         // we must call ensureEnergy
                         const toolSubject = toolData.subject || 'unknown';
                         const hasEnergy = await ensureEnergy(toolSubject, () => {
                            setPlayingLesson(playableLesson);
                            setPlayingStep(0);
                         });
                         if (hasEnergy) {
                            setPlayingLesson(playableLesson);
                            setPlayingStep(0);
                         }
                      }
                   });
                });
             } else {
                setCurrentView(tierId);
             }
          }}
          onOpenCMS={() => setCurrentView('home')}
        />
      );
    }

    if (role === 'admin' && authProfile) return <UserPortalDispatcher profile={authProfile} onNavigateHome={() => setCurrentView('home')} onExploreTier={(tierId: any) => setCurrentView(tierId)} onOpenCMS={() => setCurrentView('home')} />;
    
    return <LandingView 
      onTryDemo={handleStartDemo} 
      onNavigateToTier={(tierId: any) => setCurrentView(tierId)} 
      onNavigateToLessons={() => setCurrentView('lessons')} 
      onOpenFeatured={handleOpenFeatured}
    />;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-sky-200 relative">
      {showGlobalQuote && <QuoteInquiryModal onClose={() => setShowGlobalQuote(false)} />}
      {showContactUs && <ContactUsModal onClose={() => setShowContactUs(false)} user={authProfile} />}
      
      {/* Contact Us FAB (Hidden when learning tool is active) */}
      {!playingLesson && (
        <button
          onClick={() => setShowContactUs(true)}
          className="fixed bottom-6 right-6 z-40 bg-sky-500 text-white p-4 rounded-full shadow-lg hover:bg-sky-600 transition-all transform hover:scale-105 flex items-center justify-center group"
          title="Contact Us / Feedback"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out font-semibold">
            Feedback
          </span>
        </button>
      )}

      {showAuthModal && (
        <UnifiedAuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={() => _setCurrentView('portal')}
          initialMode={authMode}
          authMessage={authMessage}
        />
      )}
      {alertConfig && <GeneralAlertModal {...alertConfig} onClose={() => setAlertConfig(null)} />}
      
      {showHeartAd && (
          <PlaceholderAd 
              type="rewarded"
              onSkip={async () => {
                  setShowHeartAd(false);
                  if (auth.currentUser && authProfile) {
                      const token = await auth.currentUser.getIdToken();
                      await grantHeart(token, authProfile.uid);
                      if (pendingLessonResume) {
                          pendingLessonResume();
                          setPendingLessonResume(null);
                      }
                  }
              }}
              onComplete={async () => {
                  setShowHeartAd(false);
                  if (auth.currentUser && authProfile) {
                      const token = await auth.currentUser.getIdToken();
                      await grantHeart(token, authProfile.uid);
                      if (pendingLessonResume) {
                          pendingLessonResume();
                          setPendingLessonResume(null);
                      }
                  }
              }}
          />
      )}
      
      {playingLesson && (
        <LessonPlayer 
          lesson={playingLesson} initialStep={playingStep} isPro={isPro} isLoggedIn={isLoggedIn} 
          onClose={() => setPlayingLesson(null)} 
          onStepComplete={async (data: any = {}) => {
             // Log immediate progress for the specific tool!
             if (authProfile && authProfile.role === 'student') {
                try {
                  const user = auth.currentUser;
                  if (user) {
                    const token = await user.getIdToken();
                    
                    const tool = playingLesson.flow?.[data.step] || playingLesson;
                    const toolId = tool.id || tool.title || 'unknown_tool';
                    const gradeStr = tool.grade ? tool.grade.trim() : 'unknown_grade';
                    const subjStr = tool.subject ? tool.subject.trim() : 'unknown_subject';
                    const subjectId = `${gradeStr}_${subjStr}`;
                    
                    await logStudentActivity(token, {
                      toolId: toolId,
                      chapterName: playingLesson.chapter,
                      subjectId: subjectId,
                      score: data.score
                    });
                  }
                } catch (e) {
                  console.error("Failed to log activity", e);
                }
             }
          }}
          onFinish={async (data: any = {}) => {
             // 🎯 TRACKING: Playlist Completed!
             trackEvent('lesson_completed', { chapter: playingLesson.chapter });
             setPlayingLesson(null);
          }} 
        />
      )}
      
      <nav className="bg-white border-b-4 border-sky-500 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          {/* LEFT: Logo */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => { setCurrentView(isLoggedIn ? 'portal' : 'home'); setStage(null); if (!isLoggedIn) setRole(null); }}>
            <Image src="/logo.svg" alt="Kortex Klassroom Logo" width={200} height={50} priority className="h-10 w-auto rounded-xl -rotate-3" />
            <span className="font-black text-2xl tracking-tight text-slate-800 hidden xl:block">Kortex<span className="text-sky-500"> Klassroom</span></span>
          </div>

          {/* RIGHT SIDE CONTAINER: Nav Links & Profile (Aligned Right) */}
          <div className="flex items-center gap-4 xl:gap-8 ml-auto">
            
            {/* 6 Nav Links (Hidden on mobile) */}
            {role !== 'parent' && (
              <div className="hidden lg:flex items-center gap-4 xl:gap-8 font-extrabold text-slate-500 text-xs text-center leading-tight">
                 <button onClick={() => setCurrentView('lessons')} className={`py-2 px-1 transition-colors hover:text-sky-500 ${currentView === 'lessons' ? 'text-sky-500 border-b-2 border-sky-500' : ''}`}>All<br/>Lessons</button>
                 <button onClick={() => setCurrentView('conceptualiser')} className={`py-2 px-1 transition-colors hover:text-purple-500 ${currentView === 'conceptualiser' ? 'text-purple-500 border-b-2 border-purple-500' : ''}`}>Interactive<br/>Sandbox</button>
                 <button onClick={() => setCurrentView('theatre')} className={`py-2 px-1 transition-colors hover:text-pink-500 ${currentView === 'theatre' ? 'text-pink-500 border-b-2 border-pink-500' : ''}`}>Kortex<br/>Theatre</button>
                 <button onClick={() => setCurrentView('dojo')} className={`py-2 px-1 transition-colors hover:text-orange-500 ${currentView === 'dojo' ? 'text-orange-500 border-b-2 border-orange-500' : ''}`}>The<br/>Dojo</button>
                 <button onClick={() => setCurrentView('Notebook')} className={`py-2 px-1 transition-colors hover:text-sky-500 ${currentView === 'Notebook' ? 'text-sky-500 border-b-2 border-sky-500' : ''}`}>The<br/>Notebook</button>
                 <button onClick={() => setCurrentView('arcade')} className={`py-2 px-1 transition-colors hover:text-lime-600 ${currentView === 'arcade' ? 'text-lime-600 border-b-2 border-lime-500' : ''}`}>Kortex<br/>Arcade</button>
              </div>
            )}

            {/* Profile & Mobile Menu Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              {isLoggedIn ? (
                 <div className="hidden sm:flex items-center gap-3 border-l-2 border-slate-100 pl-4 xl:pl-8">
                   <button 
                     type="button"
                     onClick={() => setCurrentView('portal')}
                     className="text-right hover:opacity-80 transition-opacity cursor-pointer"
                     title="Open Your User Portal"
                   >
                     <div className="text-sm font-bold text-slate-800 leading-none">{userName || (userEmail ? userEmail.split('@')[0] : 'User')}</div>
                     <div className="text-xs font-bold text-sky-500 capitalize">{role?.replace('_', ' ')} {isPro ? '(Pro)' : ''}</div>
                   </button>
                   <div 
                     onClick={() => setCurrentView('portal')}
                     className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 border-2 border-sky-200 cursor-pointer hover:scale-105 transition-transform"
                     title="Open Your User Portal"
                   >
                     <User size={20} />
                   </div>
                   <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-1" title="Log Out"><LogOut size={18} /></button>
                 </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2 border-l-2 border-slate-100 pl-4 xl:pl-8">
                  <button 
                    type="button"
                    onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
                    className="px-4 py-2 text-xs font-black text-white bg-sky-500 hover:bg-sky-600 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}
              <button className="lg:hidden text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}</button>
            </div>

          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
           <div className="lg:hidden bg-white border-t border-slate-100 p-4 space-y-2 absolute w-full shadow-xl font-bold text-slate-700">
              {role !== 'parent' && (
                <>
                  <button onClick={() => { setCurrentView('lessons'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'lessons' ? 'text-sky-500 bg-sky-50' : 'hover:bg-slate-50'}`}>All Lessons</button>
                  <button onClick={() => { setCurrentView('conceptualiser'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'conceptualiser' ? 'text-purple-500 bg-purple-50' : 'hover:bg-slate-50'}`}>Interactive Sandbox</button>
                  <button onClick={() => { setCurrentView('theatre'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'theatre' ? 'text-pink-500 bg-pink-50' : 'hover:bg-slate-50'}`}>Kortex Theatre</button>
                  <button onClick={() => { setCurrentView('dojo'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'dojo' ? 'text-orange-500 bg-orange-50' : 'hover:bg-slate-50'}`}>The Dojo</button>
                  <button onClick={() => { setCurrentView('Notebook'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'Notebook' ? 'text-sky-500 bg-sky-50' : 'hover:bg-slate-50'}`}>The Notebook</button>
                  <button onClick={() => { setCurrentView('arcade'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg ${currentView === 'arcade' ? 'text-lime-600 bg-lime-50' : 'hover:bg-slate-50'}`}>Kortex Arcade</button>
                </>
              )}

              {isLoggedIn ? (
                <>
                  <button onClick={() => { setCurrentView('portal'); setMobileMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg font-black ${currentView === 'portal' ? 'text-sky-500 bg-sky-50' : 'hover:bg-slate-50'}`}>My Portal ({role?.replace('_', ' ')})</button>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left p-3 text-red-500 mt-2 border-t-2 border-slate-100 pt-4">Log Out</button>
                </>
              ) : (
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <button onClick={() => { setAuthMode('signin'); setShowAuthModal(true); setMobileMenuOpen(false); }} className="w-full text-center py-2.5 rounded-xl font-bold bg-sky-500 text-white shadow-md">Sign In</button>
                </div>
              )}
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