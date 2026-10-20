"use client";

import React, { useState, useEffect } from 'react';
import { 
  Rocket, Search, Sparkles, CheckCircle2, X, ArrowRight,
  BookOpen, Star, Calendar, Users, Award, ShieldCheck,
  Check, ChevronRight, Layers, Bell, ExternalLink, Clock
} from 'lucide-react';
import { KORTEX_COURSES, AGE_GROUPS, COURSE_CATEGORIES, KortexCourse } from './koursesData';
import { auth, db } from '../backend_configurations/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { registerCourseInterest } from '../app/actions/student';
import { StudentProfile } from '../types/user';
import { Card } from './components/SharedUI';
import { KortexCourseCard } from './components/KortexCourseCard';
import ModalPortal from '../components/ModalPortal';

interface KortexKoursesPageProps {
  authProfile?: any;
  isLoggedIn?: boolean;
  onNavigateHome?: () => void;
  onNavigateToPortal?: () => void;
  onRequireAuth?: () => void;
}

export default function KortexKoursesPage({
  authProfile,
  isLoggedIn,
  onNavigateHome,
  onNavigateToPortal,
  onRequireAuth
}: KortexKoursesPageProps) {
  const [selectedAgeBand, setSelectedAgeBand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<KortexCourse | null>(null);

  // Parent child selector state
  const [parentChildren, setParentChildren] = useState<StudentProfile[]>([]);
  const [selectedChildUid, setSelectedChildUid] = useState<string>('');
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);
  const [interestSubmittedSuccess, setInterestSubmittedSuccess] = useState<string | null>(null);

  const isParent = authProfile?.role === 'parent';
  const isStudent = authProfile?.role === 'student';

  // Load parent's children if user is a parent
  useEffect(() => {
    async function fetchChildren() {
      if (!isParent || !authProfile?.uid) return;
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('parent_id', '==', authProfile.uid)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as StudentProfile));
        setParentChildren(list);
        if (list.length > 0) {
          setSelectedChildUid(list[0].uid);
        }
      } catch (err) {
        console.error("Error fetching children for course selector:", err);
      }
    }
    fetchChildren();
  }, [isParent, authProfile?.uid]);

  // Filtered courses logic
  const filteredCourses = KORTEX_COURSES.filter(course => {
    const matchesAge = selectedAgeBand === 'all' || course.ageBand === selectedAgeBand || course.ageBand === 'All Ages';
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.learningOutcomes.some(o => o.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesAge && matchesCategory && matchesSearch;
  });

  const handleOptForCourse = (course: KortexCourse) => {
    setSelectedCourseForModal(course);
    setInterestSubmittedSuccess(null);
  };

  const handleConfirmInterest = async () => {
    if (!isLoggedIn) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (!selectedCourseForModal) return;

    setIsSubmittingInterest(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in first");
      const idToken = await user.getIdToken();

      const targetChild = parentChildren.find(c => c.uid === selectedChildUid);

      const res = await registerCourseInterest(idToken, {
        programId: selectedCourseForModal.id,
        programTitle: selectedCourseForModal.title,
        targetChildUid: isParent ? selectedChildUid : authProfile?.uid,
        targetChildName: isParent ? targetChild?.full_name : authProfile?.full_name
      });

      if (res.success) {
        const beneficiaryName = isParent 
          ? (targetChild?.full_name || 'your child') 
          : (authProfile?.full_name || 'you');
        setInterestSubmittedSuccess(
          `🎉 Seat Reserved! Interest registered for ${beneficiaryName}. We'll notify you as soon as enrollment opens!`
        );
      } else {
        alert("Failed to submit interest: " + res.error);
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto">
      
      {/* ---------------------------------------------------- */}
      {/* 1. HERO HEADER CARD (Matches All Lessons style)       */}
      {/* ---------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[3rem] p-10 md:p-16 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-t-8 border-indigo-500">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 opacity-15 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 opacity-15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 text-center md:text-left mb-10 md:mb-0">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 backdrop-blur-md px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-6 border border-indigo-500/30 shadow-sm text-indigo-400">
            <Sparkles size={16} /> Specialized Enrichment Programs
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight drop-shadow-sm">
            Specialized.<br />Future-Ready.<br /><span className="text-indigo-400">Kourses.</span>
          </h1>
          <p className="text-lg text-slate-300 font-medium max-w-xl drop-shadow-sm leading-relaxed mb-6">
            Beyond traditional grade-level textbooks. Explore project-based enrichment pathways from Vedic mental math to robotics, coding, astronomy, and Olympiad problem-solving.
          </p>

          {/* Quick Stats Badges inside Hero */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 text-center">
              <span className="text-xl font-black text-amber-300 mr-2">8+</span>
              <span className="text-xs font-extrabold text-slate-300 uppercase">Programs</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 text-center">
              <span className="text-xl font-black text-emerald-300 mr-2">100%</span>
              <span className="text-xs font-extrabold text-slate-300 uppercase">Project-Based</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 text-center">
              <span className="text-xl font-black text-sky-300 mr-2">K - 8</span>
              <span className="text-xs font-extrabold text-slate-300 uppercase">All Age Bands</span>
            </div>
          </div>
        </div>

        {/* Floating 3D-effect icon badge box */}
        <div className="relative z-10 hidden md:block mr-8">
          <div className="relative w-56 h-56">
            <div className="absolute inset-0 bg-white/5 rounded-[2.5rem] backdrop-blur-md border-4 border-white/10 flex items-center justify-center shadow-2xl transform -rotate-3 hover:rotate-3 transition-transform duration-500 z-10">
              <Rocket size={90} className="text-indigo-400 drop-shadow-md" />
            </div>
            <div className="absolute -top-6 -right-6 bg-slate-800 rounded-2xl p-4 shadow-xl border-2 border-slate-700 transform rotate-12 animate-bounce z-20" style={{ animationDuration: '3.5s' }}>
              <Sparkles size={28} className="text-amber-400" />
            </div>
            <div className="absolute -bottom-4 -left-6 bg-slate-800 rounded-2xl p-4 shadow-xl border-2 border-slate-700 transform -rotate-6 animate-bounce z-20" style={{ animationDuration: '4.2s' }}>
              <Award size={28} className="text-emerald-400" />
            </div>
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. UNIFIED FILTER TOOLBAR (Matches All Lessons)       */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="font-bold text-slate-500 text-sm uppercase px-2 hidden sm:block">Filter:</span>
          
          {/* Age Group Filter Dropdown */}
          <select 
            className="flex-1 md:w-48 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
            value={selectedAgeBand}
            onChange={(e) => setSelectedAgeBand(e.target.value)}
          >
            <option value="all">All Age Groups</option>
            {AGE_GROUPS.filter(a => a.id !== 'all').map(ag => (
              <option key={ag.id} value={ag.id}>
                {ag.label} ({ag.range.split('(')[1]?.replace(')', '') || ag.range})
              </option>
            ))}
          </select>

          {/* Category Filter Dropdown */}
          <select 
            className="flex-1 md:w-56 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {COURSE_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input & Clear */}
        <div className="relative w-full md:flex-1 flex gap-2">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search by topic, e.g. 'coding', 'vedic math', 'robotics'..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-4 pr-10 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
            />
            <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
          </div>
          {(selectedAgeBand !== 'all' || selectedCategory !== 'all' || searchQuery) && (
            <button 
              onClick={() => {
                setSelectedAgeBand('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }} 
              className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl transition-colors shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. COURSES GRID SECTION                               */}
      {/* ---------------------------------------------------- */}
      <div className="pb-12">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <span>All Kourses</span>
            <span className="text-sm font-bold text-slate-400 font-mono">({filteredCourses.length} Programs)</span>
          </h2>
          {(selectedAgeBand !== 'all' || selectedCategory !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedAgeBand('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <KortexCourseCard
                key={course.id}
                course={course}
                price="₹499"
                rating={4.8}
                ctaText={isParent ? 'Enroll Child' : isStudent ? 'Request Course' : 'Enroll Now'}
                onClick={handleOptForCourse}
                onEnroll={handleOptForCourse}
              />
            ))}
          </div>
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">No Kourses Found</h3>
            <p className="text-sm text-slate-400 font-semibold mb-4">
              We couldn&apos;t find any programs matching your selected age group or keywords.
            </p>
            <button
              onClick={() => {
                setSelectedAgeBand('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}

      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. COURSE SYLLABUS & ENROLLMENT MODAL                */}
      {/* ---------------------------------------------------- */}
      {selectedCourseForModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedCourseForModal(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>

            {/* Course Header */}
            <div className="flex items-start gap-4 mb-4 pr-8">
              <span className="text-5xl">{selectedCourseForModal.icon}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${selectedCourseForModal.badgeColor}`}>
                    {selectedCourseForModal.gradeGroup}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {selectedCourseForModal.ageBand}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                    {selectedCourseForModal.category}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  {selectedCourseForModal.title}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {selectedCourseForModal.tagline}
                </p>
              </div>
            </div>

            {/* Overview */}
            <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
              {selectedCourseForModal.description}
            </p>

            {/* Quick Meta Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-6 text-xs font-bold text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">Estimated Duration</span>
                <span>{selectedCourseForModal.estimatedWeeks} Weeks</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">Learning Format</span>
                <span className="truncate block">{selectedCourseForModal.format.split('•')[0]}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase font-black block">Prerequisites</span>
                <span className="truncate block">{selectedCourseForModal.prerequisites}</span>
              </div>
            </div>

            {/* Detailed Module Syllabus */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen size={16} className="text-indigo-600" /> Complete Module Syllabus
              </h4>

              <div className="space-y-2.5">
                {selectedCourseForModal.modules.map(mod => (
                  <div key={mod.number} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {mod.number}
                      </span>
                      <h5 className="font-extrabold text-sm text-slate-800">{mod.title}</h5>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mb-2 ml-8">
                      {mod.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 ml-8">
                      {mod.topics.map((t, ti) => (
                        <span key={ti} className="text-[11px] font-bold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                          • {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Capstone Project Showcase */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-1 text-amber-900 font-black text-xs uppercase tracking-wider">
                <Award size={16} className="text-amber-600" /> Final Capstone Project
              </div>
              <h5 className="font-extrabold text-sm text-amber-950 mb-1">
                {selectedCourseForModal.capstoneProject.title}
              </h5>
              <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                {selectedCourseForModal.capstoneProject.description}
              </p>
            </div>

            {/* -------------------------------------------------- */}
            {/* ROLE-AWARE ACTION SECTION                          */}
            {/* -------------------------------------------------- */}
            <div className="mt-auto pt-4 border-t border-slate-100">
              
              {interestSubmittedSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-sm">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                    <span>{interestSubmittedSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseForModal(null);
                      setInterestSubmittedSuccess(null);
                    }}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* If user is parent and has children */}
                  {isParent && (
                    <div>
                      {parentChildren.length > 0 ? (
                        <div className="space-y-2">
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                            Select Child to Enroll:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {parentChildren.map(c => {
                              const isSelected = selectedChildUid === c.uid;
                              return (
                                <div
                                  key={c.uid}
                                  onClick={() => setSelectedChildUid(c.uid)}
                                  className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                                    isSelected 
                                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs' 
                                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  <div>
                                    <div className="font-extrabold text-sm">{c.full_name}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                                      {c.grade || 'Foundational'}
                                    </div>
                                  </div>
                                  {isSelected && <CheckCircle2 size={18} className="text-indigo-600" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
                          Please add a child account to your parent portal to enroll in this course.
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      disabled={isSubmittingInterest}
                      onClick={handleConfirmInterest}
                      className="flex-1 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmittingInterest ? (
                        <span>Submitting...</span>
                      ) : isParent ? (
                        <>
                          <CheckCircle2 size={18} />
                          <span>Reserve Seat for {parentChildren.find(c => c.uid === selectedChildUid)?.full_name || 'Child'}</span>
                        </>
                      ) : isStudent ? (
                        <>
                          <Bell size={18} />
                          <span>Notify My Parent / Request Access</span>
                        </>
                      ) : (
                        <>
                          <Rocket size={18} />
                          <span>Register Interest / Join Waitlist</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCourseForModal(null)}
                      className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm rounded-xl transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-slate-400 font-semibold">
                    Enrollment opens soon. Registering now guarantees early-access invitations and priority batches.
                  </p>

                </div>
              )}

            </div>

          </div>
        </div>
        </ModalPortal>
      )}

    </div>
  );
}
