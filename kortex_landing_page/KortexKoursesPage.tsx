"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Rocket, Search, Sparkles, CheckCircle2, X, ArrowRight,
  BookOpen, Star, Calendar, Users, Award, ShieldCheck,
  Check, ChevronRight, Layers, Bell, ExternalLink, Clock,
  GraduationCap, Palette, Lightbulb, Compass, Filter
} from 'lucide-react';
import { 
  ALL_CATALOG_COURSES, 
  FOUNDATIONAL_COURSES, 
  CORE_COURSES, 
  CO_CURRICULAR_COURSES,
  ALL_GRADE_TABS,
  ALL_AGE_BANDS,
  CatalogCourse,
  MasterCategory 
} from './courseCatalogConfig';
import { KortexCourseCard } from './components/KortexCourseCard';
import { getPublicCourseCatalogOverrides } from '../app/actions/admin';
import ModalPortal from '../components/ModalPortal';

interface KortexKoursesPageProps {
  authProfile?: any;
  isLoggedIn?: boolean;
  onNavigateHome?: () => void;
  onNavigateToPortal?: () => void;
  onRequireAuth?: () => void;
  onSelectCourse?: (course: CatalogCourse) => void;
}

export default function KortexKoursesPage({
  authProfile,
  isLoggedIn,
  onNavigateHome,
  onNavigateToPortal,
  onRequireAuth,
  onSelectCourse
}: KortexKoursesPageProps) {
  // Master Category Filter ('all' | 'Foundational' | 'Core' | 'Co-Curricular & Skills')
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Core Academic Grade Tab (Balvatika 1..Grade 8)
  const [selectedCoreGrade, setSelectedCoreGrade] = useState<string>('Grade 3');

  // Co-Curricular Age Range Tab
  const [selectedSkillAge, setSelectedSkillAge] = useState<string>('all');

  // Search Query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Course Overview Modal
  const [modalCourse, setModalCourse] = useState<CatalogCourse | null>(null);

  // Dynamic overrides from Firestore (synced from Admin changes)
  const [catalogOverrides, setCatalogOverrides] = useState<Record<string, any>>({});

  // Fetch live overrides from Firestore on mount
  useEffect(() => {
    async function fetchOverrides() {
      try {
        const res = await getPublicCourseCatalogOverrides();
        if (res.success && res.overrides) {
          setCatalogOverrides(res.overrides);
        }
      } catch (e) {
        console.warn("Could not fetch course catalog overrides:", e);
      }
    }
    fetchOverrides();
  }, []);

  // Hydrate catalog with real-time Firestore overrides
  const hydratedCourses = useMemo(() => {
    return ALL_CATALOG_COURSES.map(course => {
      const override = catalogOverrides[course.id];
      if (!override) return course;
      return {
        ...course,
        status: override.status || course.status,
        isFree: override.isFree !== undefined ? override.isFree : course.isFree,
        price: override.price !== undefined ? override.price : (course.price || 0),
        title: override.title || course.title,
        tagline: override.tagline || course.tagline,
        description: override.description || course.description
      };
    });
  }, [catalogOverrides]);

  // Handle course click
  const handleCourseClick = (course: CatalogCourse) => {
    if (course.status === 'active') {
      if (onSelectCourse) {
        onSelectCourse(course);
      }
    } else {
      // Coming Soon course -> Open clean info modal
      setModalCourse(course);
    }
  };

  // Section 1: Foundational Courses
  const foundationalCourses = useMemo(() => {
    const list = hydratedCourses.filter(c => c.masterCategory === 'Foundational');
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(c => 
      c.title.toLowerCase().includes(q) || 
      (c.tagline && c.tagline.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [hydratedCourses, searchQuery]);

  // Section 2: Core Academic Courses (Filtered by Grade)
  const coreCoursesForSelectedGrade = useMemo(() => {
    const list = hydratedCourses.filter(c => c.masterCategory === 'Core' && c.grade === selectedCoreGrade);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(c => 
      c.title.toLowerCase().includes(q) || 
      (c.subject && c.subject.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [hydratedCourses, selectedCoreGrade, searchQuery]);

  // Section 3: Co-Curricular & Skills Courses (Filtered by Age)
  const coCurricularCoursesForSelectedAge = useMemo(() => {
    let list = hydratedCourses.filter(c => c.masterCategory === 'Co-Curricular & Skills');
    if (selectedSkillAge !== 'all') {
      list = list.filter(c => c.ageBand === selectedSkillAge || c.ageBand === 'All Ages');
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(c => 
      c.title.toLowerCase().includes(q) || 
      (c.subject && c.subject.toLowerCase().includes(q)) ||
      (c.tagline && c.tagline.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [hydratedCourses, selectedSkillAge, searchQuery]);

  return (
    <div className="space-y-12 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      
      {/* ---------------------------------------------------- */}
      {/* 1. HERO HEADER                                       */}
      {/* ---------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[3rem] p-8 md:p-14 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-t-8 border-indigo-500">
        {/* Glow Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center md:text-left mb-8 md:mb-0 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 backdrop-blur-md px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider mb-4 border border-indigo-500/30 text-indigo-300">
            <Sparkles size={14} className="text-amber-400" /> Complete Curriculum Catalog
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight tracking-tight">
            Kortex <span className="text-indigo-400">Kourses</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed mb-6">
            From foundational Hindi and Math literacy to grade-aligned academic mastery and 21st-century enrichment. Explore interactive courses built for curiosity and retention.
          </p>

          {/* Category Quick Badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeCategory === 'all'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
              }`}
            >
              All Programs
            </button>
            <button
              onClick={() => setActiveCategory('Foundational')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeCategory === 'Foundational'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
              }`}
            >
              📖 Foundational (FLN)
            </button>
            <button
              onClick={() => setActiveCategory('Core')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeCategory === 'Core'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
              }`}
            >
              🎓 Core Academic (Grades 1-8)
            </button>
            <button
              onClick={() => setActiveCategory('Co-Curricular & Skills')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeCategory === 'Co-Curricular & Skills'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
              }`}
            >
              🚀 Co-Curricular &amp; Skills
            </button>
          </div>
        </div>

        {/* Floating 3D Badge Box */}
        <div className="relative z-10 hidden lg:block mr-4">
          <div className="w-48 h-48 rounded-[2.5rem] bg-white/5 backdrop-blur-md border-4 border-white/10 flex items-center justify-center shadow-2xl transform -rotate-3 hover:rotate-3 transition-transform duration-500">
            <Rocket size={80} className="text-indigo-400 drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. SEARCH BAR                                        */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-100 shadow-xs flex items-center gap-3">
        <Search className="text-slate-400 ml-2" size={20} />
        <input 
          type="text" 
          placeholder="Search courses by topic, subject, or grade (e.g. 'Hindi', 'Maths', 'Grade 3', 'Robotics')..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="flex-1 bg-transparent font-bold text-sm text-slate-800 placeholder-slate-400 outline-none"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. CATEGORY 1: FOUNDATIONAL COURSES                  */}
      {/* ---------------------------------------------------- */}
      {(activeCategory === 'all' || activeCategory === 'Foundational') && (
        <section className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-black text-sm flex items-center justify-center">
                  📖
                </span>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  1. Foundational Courses (FLN)
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                Universal early literacy and numeracy based on NIPUN Bharat guidelines. 100% Free for all students.
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 self-start sm:self-auto">
              3 Courses • 2 Active
            </span>
          </div>

          {foundationalCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {foundationalCourses.map(course => (
                <KortexCourseCard
                  key={course.id}
                  course={course}
                  price={course.isFree ? 'Free' : `₹${course.price || 0}`}
                  ctaText={course.status === 'active' ? 'Start Learning' : 'Coming Soon'}
                  onClick={() => handleCourseClick(course)}
                  onEnroll={() => handleCourseClick(course)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-bold">
              No foundational courses match &quot;{searchQuery}&quot;
            </div>
          )}
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. CATEGORY 2: CORE ACADEMIC COURSES                 */}
      {/* ---------------------------------------------------- */}
      {(activeCategory === 'all' || activeCategory === 'Core') && (
        <section className="space-y-6 animate-fade-in pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center">
                  🎓
                </span>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  2. Core Academic Curriculum
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                Standard board-aligned subjects organized by class. Select your child&apos;s grade to view subjects.
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full border border-indigo-200 self-start sm:self-auto">
              Balvatika 1 to Grade 8
            </span>
          </div>

          {/* Grade Selector Tabs Bar */}
          <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {ALL_GRADE_TABS.map(tab => {
              const isSelected = selectedCoreGrade === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCoreGrade(tab.id)}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md scale-102'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Grade Subjects Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
              <span>Subjects for {selectedCoreGrade}</span>
              <span>{coreCoursesForSelectedGrade.length} Subjects Available</span>
            </div>

            {coreCoursesForSelectedGrade.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {coreCoursesForSelectedGrade.map(course => (
                  <KortexCourseCard
                    key={course.id}
                    course={course}
                    price={course.status === 'active' ? (course.isFree ? 'Free' : `₹${course.price}`) : 'Coming Soon'}
                    ctaText={course.status === 'active' ? 'Explore Course' : 'Coming Soon'}
                    onClick={() => handleCourseClick(course)}
                    onEnroll={() => handleCourseClick(course)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-bold">
                No subjects found for {selectedCoreGrade} matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. CATEGORY 3: CO-CURRICULAR & SKILLS COURSES        */}
      {/* ---------------------------------------------------- */}
      {(activeCategory === 'all' || activeCategory === 'Co-Curricular & Skills') && (
        <section className="space-y-6 animate-fade-in pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center">
                  🚀
                </span>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  3. Co-Curricular &amp; Skill Programs
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                Computers &amp; AI, mental training, sports, arts, Vedic math, robotics, and Olympiad logic.
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-200 self-start sm:self-auto">
              Future-Ready Enrichment
            </span>
          </div>

          {/* Age Group Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
              <Filter size={13} /> Filter Age:
            </span>
            {ALL_AGE_BANDS.map(band => {
              const isSelected = selectedSkillAge === band.id;
              return (
                <button
                  key={band.id}
                  type="button"
                  onClick={() => setSelectedSkillAge(band.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {band.label}
                </button>
              );
            })}
          </div>

          {/* Skills Grid */}
          {coCurricularCoursesForSelectedAge.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {coCurricularCoursesForSelectedAge.map(course => (
                <KortexCourseCard
                  key={course.id}
                  course={course}
                  price={course.status === 'active' ? (course.isFree ? 'Free' : `₹${course.price}`) : 'Coming Soon'}
                  ctaText={course.status === 'active' ? 'Explore Course' : 'Coming Soon'}
                  onClick={() => handleCourseClick(course)}
                  onEnroll={() => handleCourseClick(course)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-bold">
              No skill programs found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. COURSE OVERVIEW MODAL (COMING SOON / OVERVIEW)    */}
      {/* ---------------------------------------------------- */}
      {modalCourse && (
        <ModalPortal>
          <div className="fixed inset-0 z-100 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto space-y-6">
              
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setModalCourse(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>

              {/* Modal Header */}
              <div className="flex items-start gap-4 pr-6">
                <span className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shrink-0">
                  {modalCourse.icon || '📚'}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {modalCourse.masterCategory}
                    </span>
                    {modalCourse.grade && (
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {modalCourse.grade}
                      </span>
                    )}
                    {modalCourse.ageBand && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        • {modalCourse.ageBand}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    {modalCourse.title}
                  </h3>
                  {modalCourse.tagline && (
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {modalCourse.tagline}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Course Overview
                </h4>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  {modalCourse.description}
                </p>
              </div>

              {/* Learning Outcomes */}
              {modalCourse.learningOutcomes && modalCourse.learningOutcomes.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Award size={14} className="text-amber-500" /> Key Learning Objectives
                  </h4>
                  <ul className="space-y-2">
                    {modalCourse.learningOutcomes.map((outcome, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                        <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coming Soon Notice */}
              {modalCourse.status === 'coming_soon' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                  <Clock className="text-amber-600 shrink-0" size={24} />
                  <div>
                    <h5 className="font-black text-amber-900 text-sm">Curriculum In Active Development</h5>
                    <p className="text-xs font-semibold text-amber-700 mt-0.5">
                      This curriculum is currently being built with interactive digital sandboxes and milestone quizzes. It will be released soon!
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCourse(null)}
                  className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm rounded-xl transition-all cursor-pointer text-center"
                >
                  Close Overview
                </button>
              </div>

            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
