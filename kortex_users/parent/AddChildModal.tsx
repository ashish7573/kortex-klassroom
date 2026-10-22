"use client";
import React, { useState, useEffect } from 'react';
import { auth } from '../../backend_configurations/firebase';
import { 
  X, Sparkles, UserPlus, CheckCircle2, Copy, Check, KeyRound, 
  Link, ArrowRight, ArrowLeft, BookOpen, Clock, AlertCircle,
  Search, ShoppingCart, ChevronDown, ChevronUp
} from 'lucide-react';
import { provisionChildAccount, claimProvisionedChild } from '../../app/actions/student';
import { GRADES, GRADE_CORE_MAP } from '../../kortex_landing_page/curriculumConfig';
import { 
  KORTEX_CATALOG_COURSES, 
  CatalogCourse,
  isPaidCourse 
} from '../../kortex_landing_page/courseCatalogConfig';
import { getPublicCourseCatalogOverrides } from '../../app/actions/admin';
import RequireMobileModal from './RequireMobileModal';
import ModalPortal from '../../components/ModalPortal';

interface AddChildModalProps {
  onClose: () => void;
  onChildCreated: (childId: string) => void;
  parentContactNumber?: string;
  onContactUpdate?: (mobile: string) => Promise<void>;
  isPro?: boolean;
  childrenCount?: number;
  onUpgradePro?: () => void;
}

export default function AddChildModal({ 
  onClose, 
  onChildCreated, 
  parentContactNumber, 
  onContactUpdate,
  childrenCount = 0
}: AddChildModalProps) {
  const [mode, setMode] = useState<'new' | 'claim'>('new');
  
  // Step for 'new' mode: Step 1 (Child Info) -> Step 2 (Mandatory Course Selection)
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields - New Child
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('Grade 1');
  const [selectedCourses, setSelectedCourses] = useState<string[]>(['FLN Hindi', 'FLN Maths']);
  
  // Form Fields - Claim Org Child
  const [claimId, setClaimId] = useState('');
  const [claimCode, setClaimCode] = useState('');

  // Shared PIN
  const [pin, setPin] = useState('');
  
  // Submission & UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ studentId: string; pin: string } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);

  // Step 2 Category Tabs, Search & Cart State
  const [courseCategoryTab, setCourseCategoryTab] = useState<'Foundational' | 'Core' | 'Co-Curricular & Skills'>('Foundational');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [catalogOverrides, setCatalogOverrides] = useState<Record<string, any>>({});

  // Sync real-time catalog overrides from Firestore
  useEffect(() => {
    let isMounted = true;
    async function loadOverrides() {
      try {
        const res = await getPublicCourseCatalogOverrides();
        if (isMounted && res && res.overrides) {
          setCatalogOverrides(res.overrides);
        }
      } catch (e) {
        console.warn("Could not load catalog overrides in AddChildModal:", e);
      }
    }
    loadOverrides();
    return () => { isMounted = false; };
  }, []);

  // Hydrate catalog courses with real-time overrides
  const hydratedCourses = React.useMemo(() => {
    return KORTEX_CATALOG_COURSES.map(course => {
      const override = catalogOverrides[course.id];
      if (!override) return course;
      return {
        ...course,
        status: override.status || course.status,
        isFree: override.isFree !== undefined ? override.isFree : course.isFree,
        price: override.price !== undefined ? override.price : course.price,
        title: override.title || course.title,
        tagline: override.tagline || course.tagline,
        description: override.description || course.description
      };
    });
  }, [catalogOverrides]);

  // Categorized Courses
  const foundationalCourses = React.useMemo(() => {
    return hydratedCourses.filter(c => c.masterCategory === 'Foundational');
  }, [hydratedCourses]);

  const coreCourses = React.useMemo(() => {
    return hydratedCourses.filter(c => c.masterCategory === 'Core' && c.grade === childGrade);
  }, [hydratedCourses, childGrade]);

  const coCurricularCourses = React.useMemo(() => {
    return hydratedCourses.filter(c => c.masterCategory === 'Co-Curricular & Skills');
  }, [hydratedCourses]);

  // Active list based on selected category tab
  const activeTabCourses = React.useMemo(() => {
    if (courseCategoryTab === 'Foundational') return foundationalCourses;
    if (courseCategoryTab === 'Core') return coreCourses;
    return coCurricularCourses;
  }, [courseCategoryTab, foundationalCourses, coreCourses, coCurricularCourses]);

  // Filtered by search query
  const displayedCourses = React.useMemo(() => {
    if (!searchQuery.trim()) return activeTabCourses;
    const q = searchQuery.toLowerCase().trim();
    return activeTabCourses.filter(c => 
      c.title.toLowerCase().includes(q) ||
      (c.subject && c.subject.toLowerCase().includes(q)) ||
      (c.tagline && c.tagline.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [activeTabCourses, searchQuery]);

  // Tab Badge Counters (How many selected in each tab)
  const foundationalSelectedCount = React.useMemo(() => {
    return foundationalCourses.filter(c => selectedCourses.includes(c.title)).length;
  }, [foundationalCourses, selectedCourses]);

  const coreSelectedCount = React.useMemo(() => {
    return coreCourses.filter(c => selectedCourses.includes(c.title)).length;
  }, [coreCourses, selectedCourses]);

  const coCurricularSelectedCount = React.useMemo(() => {
    return coCurricularCourses.filter(c => selectedCourses.includes(c.title)).length;
  }, [coCurricularCourses, selectedCourses]);

  // Exact counts: Available (Live) vs Coming Soon per category
  const foundationalLiveCount = React.useMemo(() => {
    return foundationalCourses.filter(c => c.status === 'active').length;
  }, [foundationalCourses]);

  const foundationalSoonCount = React.useMemo(() => {
    return foundationalCourses.filter(c => c.status === 'coming_soon').length;
  }, [foundationalCourses]);

  const coreLiveCount = React.useMemo(() => {
    return coreCourses.filter(c => c.status === 'active').length;
  }, [coreCourses]);

  const coreSoonCount = React.useMemo(() => {
    return coreCourses.filter(c => c.status === 'coming_soon').length;
  }, [coreCourses]);

  const coCurricularLiveCount = React.useMemo(() => {
    return coCurricularCourses.filter(c => c.status === 'active').length;
  }, [coCurricularCourses]);

  const coCurricularSoonCount = React.useMemo(() => {
    return coCurricularCourses.filter(c => c.status === 'coming_soon').length;
  }, [coCurricularCourses]);

  // Detect if any selected course is a paid course & calculate total
  const hasPaidCourse = React.useMemo(() => {
    return selectedCourses.some(courseTitle => isPaidCourse(courseTitle, catalogOverrides));
  }, [selectedCourses, catalogOverrides]);

  const paidCoursesTotal = React.useMemo(() => {
    return selectedCourses.reduce((sum, courseTitle) => {
      const match = hydratedCourses.find(c => c.title.toLowerCase() === courseTitle.toLowerCase());
      if (match && isPaidCourse(match.title, catalogOverrides)) {
        return sum + (match.price || 0);
      }
      return sum;
    }, 0);
  }, [selectedCourses, hydratedCourses, catalogOverrides]);

  // Quota: Max 3 children standard per parent account
  const isQuotaExceeded = childrenCount >= 3;

  // Toggle selected courses
  const toggleCourse = (courseTitle: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseTitle)
        ? prev.filter(c => c !== courseTitle)
        : [...prev, courseTitle]
    );
  };

  // Step 1 Validation -> Proceed to Step 2
  const handleProceedToStep2 = () => {
    setErrorMsg('');
    if (childName.trim().length < 2) {
      setErrorMsg("Please enter your child's full name (at least 2 characters).");
      return;
    }
    if (pin.length !== 6) {
      setErrorMsg("Please choose a 6-digit Secret PIN.");
      return;
    }
    setStep(2);
  };

  // Execute Creation or Claim
  const executeAction = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication error. Please log in again.");
      
      const idToken = await user.getIdToken(true);
      let result;
      
      if (mode === 'new') {
        if (selectedCourses.length === 0) {
          throw new Error("Please select at least one course to begin learning.");
        }

        result = await provisionChildAccount(idToken, {
          fullName: childName.trim(),
          grade: childGrade,
          pin: pin,
          selectedCourses: selectedCourses
        });
      } else {
        result = await claimProvisionedChild(idToken, {
          kortexId: claimId.trim(),
          claimCode: claimCode.trim(),
          pin: pin
        });
      }
      
      if (!result.success || !result.studentId || !result.uid) {
        throw new Error(result.error || "Failed to process request.");
      }

      setCreatedCredentials({ studentId: result.studentId, pin });
      onChildCreated(result.uid);
    } catch (err: unknown) {
      console.error("Error processing child account:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to process request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'new') {
      if (step === 1) {
        handleProceedToStep2();
        return;
      }
      // Step 2 submission
      await executeAction();
      return;
    }

    // Mode: 'claim'
    setErrorMsg('');
    if (claimId.trim().length < 5) {
      setErrorMsg("Please enter a valid Kortex ID.");
      return;
    }
    if (claimCode.trim().length !== 6) {
      setErrorMsg("Please enter the 6-digit Claim Code provided by the organization.");
      return;
    }
    if (pin.length !== 6) {
      setErrorMsg("Please choose a 6-digit PIN.");
      return;
    }

    if (!parentContactNumber || parentContactNumber.trim() === '') {
      setShowMobileModal(true);
      return;
    }

    await executeAction();
  };

  const copyCredentials = () => {
    if (createdCredentials) {
      navigator.clipboard.writeText(`Kortex ID: ${createdCredentials.studentId}\nPIN: ${createdCredentials.pin}`);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div className={`bg-white rounded-3xl shadow-2xl w-full ${step === 2 && mode === 'new' ? 'max-w-xl' : 'max-w-md'} overflow-hidden relative flex flex-col max-h-[90vh] transition-all duration-200`}>
          
          {/* Header */}
          <div className="bg-indigo-600 p-6 flex flex-col text-white shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  {isQuotaExceeded ? (
                    <AlertCircle size={24} className="text-amber-300" />
                  ) : mode === 'new' ? (
                    <UserPlus size={24} className="text-white" />
                  ) : (
                    <Link size={24} className="text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black">
                    {isQuotaExceeded 
                      ? 'Child Limit Reached' 
                      : createdCredentials 
                      ? 'Account Ready!'
                      : mode === 'new' 
                      ? (step === 1 ? 'Add Child Profile' : 'Select Starting Courses') 
                      : 'Claim Organization ID'}
                  </h3>
                  <p className="text-indigo-200 font-bold text-xs mt-0.5 leading-relaxed">
                    {isQuotaExceeded
                      ? 'Maximum 3 children accounts reached.'
                      : createdCredentials
                      ? 'Credentials generated successfully.'
                      : mode === 'new'
                      ? (step === 1 ? 'Step 1 of 2: Child details & PIN' : 'Step 2 of 2: Choose courses')
                      : 'Link an existing student ID provided by your school.'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-2 hover:bg-white/20 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Mode Switcher Tabs */}
            {!createdCredentials && !isQuotaExceeded && (
              <div className="flex bg-indigo-700/80 p-1 rounded-xl w-full">
                <button 
                  type="button"
                  onClick={() => { setMode('new'); setStep(1); setErrorMsg(''); }}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    mode === 'new' ? 'bg-white text-indigo-700 shadow-xs' : 'text-indigo-200 hover:text-white'
                  }`}
                >
                  Create New Child
                </button>
                <button 
                  type="button"
                  onClick={() => { setMode('claim'); setErrorMsg(''); }}
                  className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    mode === 'claim' ? 'bg-white text-indigo-700 shadow-xs' : 'text-indigo-200 hover:text-white'
                  }`}
                >
                  Claim Organization ID
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto">
            
            {/* Limit Reached */}
            {isQuotaExceeded ? (
              <div className="space-y-4 text-center py-4 animate-fade-in">
                <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-3xl flex items-center justify-center mx-auto">
                  <UserPlus size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800">
                    Maximum Limit Reached (3 Children)
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                    You have reached the maximum allowed limit of 3 child accounts under your parent profile. If you need assistance managing your children, please contact our support team.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-colors text-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : createdCredentials ? (
              /* Success & Credentials Display */
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-xl font-black text-slate-800">Account Linked Successfully!</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Your child can now log in using this Kortex ID and the 6-digit PIN you set.
                  </p>
                </div>

                <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Child&apos;s Kortex ID
                    </label>
                    <div className="text-xl font-black text-indigo-600 font-mono mt-0.5 tracking-wider">
                      {createdCredentials.studentId}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Secret PIN
                    </label>
                    <div className="text-xl font-black text-slate-800 font-mono mt-0.5 tracking-widest">
                      {createdCredentials.pin}
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={copyCredentials}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {hasCopied ? <><Check size={18} className="text-emerald-400" /> Copied to Clipboard!</> : <><Copy size={18} /> Copy Credentials</>}
                </button>
                
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-black rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Done &amp; Close
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 flex items-start gap-2 animate-fade-in">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* MODE: NEW CHILD */}
                {mode === 'new' && (
                  <>
                    {/* STEP 1: Name & PIN */}
                    {step === 1 && (
                      <div className="space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                            Child&apos;s Full Name
                          </label>
                          <input 
                            required
                            type="text" 
                            value={childName}
                            onChange={e => setChildName(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors placeholder:font-normal placeholder:text-slate-400"
                            placeholder="e.g. Aarav Sharma"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <BookOpen size={14} className="text-indigo-600" /> Grade / Class
                          </label>
                          <select
                            value={childGrade}
                            onChange={e => setChildGrade(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors cursor-pointer"
                          >
                            {GRADES.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <KeyRound size={14} className="text-indigo-600" /> Choose 6-Digit Secret PIN
                          </label>
                          <input 
                            required
                            type="text" 
                            maxLength={6}
                            value={pin}
                            onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors font-mono tracking-widest text-lg placeholder:tracking-normal placeholder:text-sm placeholder:font-sans"
                            placeholder="6-digit PIN"
                          />
                          <p className="text-[11px] font-semibold text-slate-400 mt-1.5 ml-1">
                            Your child will enter this PIN along with their Kortex ID to log in.
                          </p>
                        </div>

                        <div className="pt-2">
                          <button 
                            type="button" 
                            onClick={handleProceedToStep2}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                          >
                            <span>Next: Choose Courses</span>
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: Mandatory Course Selection */}
                    {step === 2 && (
                      <div className="space-y-3.5 animate-fade-in">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Mandatory Step
                            </span>
                          </div>
                          <h4 className="text-base font-black text-slate-800">
                            Select Starting Courses
                          </h4>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            Please select at least one course for {childName || 'your child'} to begin learning. All FLN courses are 100% Free.
                          </p>
                        </div>

                        {/* Search Bar + Cart Counter Toolbar */}
                        <div className="flex items-center gap-2 pt-0.5">
                          {/* Search Input */}
                          <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text"
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              placeholder="Search courses by name or subject..."
                              className="w-full pl-9 pr-8 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400 placeholder:font-normal transition-colors"
                            />
                            {searchQuery && (
                              <button 
                                type="button" 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>

                          {/* Cart Counter Button */}
                          <button 
                            type="button"
                            onClick={() => setShowCartPreview(!showCartPreview)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer shrink-0 ${
                              selectedCourses.length > 0 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-xs' 
                                : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}
                            title="Toggle selected courses list"
                          >
                            <ShoppingCart size={14} className={selectedCourses.length > 0 ? "text-indigo-600" : "text-slate-400"} />
                            <span>{selectedCourses.length} Selected</span>
                            {selectedCourses.length > 0 && (
                              showCartPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            )}
                          </button>
                        </div>

                        {/* Cart Quick Chips Preview */}
                        {showCartPreview && selectedCourses.length > 0 && (
                          <div className="p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-xl flex flex-wrap gap-1.5 items-center animate-fade-in">
                            <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider mr-1">
                              Selected ({selectedCourses.length}):
                            </span>
                            {selectedCourses.map(title => (
                              <span 
                                key={title} 
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-900 rounded-lg text-xs font-bold shadow-2xs"
                              >
                                <span>{title}</span>
                                <button 
                                  type="button" 
                                  onClick={() => toggleCourse(title)}
                                  className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                                  title={`Remove ${title}`}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Category Tabs (3 Tabs) */}
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1.5">
                          {/* Tab 1: Foundational */}
                          <button
                            type="button"
                            onClick={() => { setCourseCategoryTab('Foundational'); }}
                            className={`flex-1 py-2 px-1 text-center rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                              courseCategoryTab === 'Foundational'
                                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/80'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 justify-center">
                              <span className="font-black text-xs">Foundational</span>
                              {foundationalSelectedCount > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black leading-none">
                                  {foundationalSelectedCount}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-extrabold mt-0.5">
                              <span className="text-emerald-600">{foundationalLiveCount} Available</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400">{foundationalSoonCount} Soon</span>
                            </div>
                          </button>

                          {/* Tab 2: Core */}
                          <button
                            type="button"
                            onClick={() => { setCourseCategoryTab('Core'); }}
                            className={`flex-1 py-2 px-1 text-center rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                              courseCategoryTab === 'Core'
                                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/80'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 justify-center">
                              <span className="font-black text-xs truncate max-w-[120px]">Core ({childGrade})</span>
                              {coreSelectedCount > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black leading-none">
                                  {coreSelectedCount}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-extrabold mt-0.5">
                              <span className={coreLiveCount > 0 ? "text-emerald-600" : "text-slate-400"}>
                                {coreLiveCount} Available
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400">{coreSoonCount} Soon</span>
                            </div>
                          </button>

                          {/* Tab 3: Co-Curricular & Skills */}
                          <button
                            type="button"
                            onClick={() => { setCourseCategoryTab('Co-Curricular & Skills'); }}
                            className={`flex-1 py-2 px-1 text-center rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                              courseCategoryTab === 'Co-Curricular & Skills'
                                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/80'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 justify-center">
                              <span className="font-black text-xs truncate max-w-[120px]">Skills &amp; Co-Curr</span>
                              {coCurricularSelectedCount > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black leading-none">
                                  {coCurricularSelectedCount}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-extrabold mt-0.5">
                              <span className={coCurricularLiveCount > 0 ? "text-emerald-600" : "text-slate-400"}>
                                {coCurricularLiveCount} Available
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400">{coCurricularSoonCount} Soon</span>
                            </div>
                          </button>
                        </div>

                        {/* Scrollable Course List */}
                        <div className="space-y-2.5 max-h-[44vh] overflow-y-auto pr-1">
                          {displayedCourses.length > 0 ? (
                            displayedCourses.map(course => {
                              const isLive = course.status === 'active';
                              const isSelected = selectedCourses.includes(course.title);

                              if (!isLive) {
                                return (
                                  <div 
                                    key={course.id}
                                    className="p-3 rounded-2xl border-2 border-slate-100 bg-slate-50/70 opacity-60 flex items-center justify-between cursor-not-allowed select-none"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center text-xl shrink-0">
                                        {course.icon || '📚'}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-black text-sm text-slate-700 truncate">{course.title}</span>
                                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 flex items-center gap-1">
                                            <Clock size={10} /> Coming Soon
                                          </span>
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-400 line-clamp-1 mt-0.5">
                                          {course.tagline || course.description || 'Curriculum module in production'}
                                        </p>
                                      </div>
                                    </div>
                                    <Clock size={16} className="text-slate-400 shrink-0 ml-2" />
                                  </div>
                                );
                              }

                              // Active Selectable Course Card
                              return (
                                <div 
                                  key={course.id}
                                  onClick={() => toggleCourse(course.title)}
                                  className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-indigo-50/70 border-indigo-500 shadow-xs'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                                      course.title.includes('Hindi') 
                                        ? 'bg-amber-100 text-amber-700' 
                                        : course.title.includes('Math')
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-indigo-100 text-indigo-700'
                                    }`}>
                                      {course.icon || '📖'}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-sm text-slate-800 truncate">{course.title}</span>
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                          Free
                                        </span>
                                      </div>
                                      <p className="text-[11px] font-semibold text-slate-500 line-clamp-1 mt-0.5">
                                        {course.tagline || course.description}
                                      </p>
                                    </div>
                                  </div>
                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ml-2 transition-colors ${
                                    isSelected
                                      ? 'bg-indigo-600 border-indigo-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}>
                                    {isSelected && <Check size={14} className="stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4">
                              <p className="text-xs font-bold text-slate-500">
                                {searchQuery ? `No courses found matching "${searchQuery}"` : 'No courses available in this category yet.'}
                              </p>
                              {searchQuery && (
                                <button 
                                  type="button" 
                                  onClick={() => setSearchQuery('')}
                                  className="mt-2 text-xs font-black text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                >
                                  Clear Search
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions for Step 2 */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => { setStep(1); setErrorMsg(''); }}
                            className="px-4 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            <ArrowLeft size={14} /> Back
                          </button>
                          
                          <button
                            type="submit"
                            disabled={isSubmitting || selectedCourses.length === 0}
                            className={`flex-1 py-3.5 ${
                              hasPaidCourse 
                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700' 
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            } disabled:from-indigo-300 disabled:to-indigo-300 disabled:bg-indigo-300 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98`}
                          >
                            {isSubmitting ? (
                              <span>Processing...</span>
                            ) : hasPaidCourse ? (
                              <>
                                <Sparkles size={16} />
                                <span>
                                  Pay {paidCoursesTotal > 0 ? `₹${paidCoursesTotal} ` : ''}&amp; Create Child Account ({selectedCourses.length})
                                </span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={16} />
                                <span>Create Child Account ({selectedCourses.length})</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* MODE: CLAIM ORGANIZATION ID (Bypasses course selection) */}
                {mode === 'claim' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                        Organization Student ID (Kortex ID)
                      </label>
                      <input 
                        required
                        type="text" 
                        value={claimId}
                        onChange={e => setClaimId(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors uppercase font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans"
                        placeholder="e.g. STU_ABC_123"
                      />
                      <p className="text-[11px] font-semibold text-slate-400 mt-1 ml-1">
                        Enter the Kortex ID provided by your child&apos;s school.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                        6-Digit Claim Code
                      </label>
                      <input 
                        required
                        type="text" 
                        maxLength={6}
                        value={claimCode}
                        onChange={e => setClaimCode(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors uppercase font-mono tracking-widest"
                        placeholder="e.g. A9F2B1"
                      />
                      <p className="text-[11px] font-semibold text-slate-400 mt-1 ml-1">
                        Security code given along with the ID to verify parent ownership.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <KeyRound size={14} className="text-indigo-600" /> Choose 6-Digit Secret PIN
                      </label>
                      <input 
                        required
                        type="text" 
                        maxLength={6}
                        value={pin}
                        onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors font-mono tracking-widest text-lg placeholder:tracking-normal placeholder:text-sm placeholder:font-sans"
                        placeholder="6-digit PIN"
                      />
                      <p className="text-[11px] font-semibold text-slate-400 mt-1 ml-1">
                        Set a secret PIN for your child to log into this claimed profile.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        {isSubmitting ? (
                          <span>Linking Account...</span>
                        ) : (
                          <>
                            <Link size={16} />
                            <span>Claim &amp; Link Account</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

              </form>
            )}

          </div>
        </div>

        {/* Emergency Mobile Modal */}
        <RequireMobileModal 
          isOpen={showMobileModal}
          onClose={() => setShowMobileModal(false)}
          onSubmit={async (mobile) => {
            if (onContactUpdate) {
              await onContactUpdate(mobile);
            }
            setShowMobileModal(false);
            setIsSubmitting(true);
            await executeAction();
          }}
        />
      </div>
    </ModalPortal>
  );
}
