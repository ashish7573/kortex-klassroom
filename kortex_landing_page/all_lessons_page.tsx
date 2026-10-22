"use client";

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Layers, Gamepad2, Video, ChevronLeft, ChevronUp, ChevronDown, CheckCircle2, 
  Lightbulb, Target, FileText, Star, Lock, Search, X, Trophy, Sparkles 
} from 'lucide-react';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../backend_configurations/firebase';
import { Card, Button } from './components/SharedUI';
import { 
  GRADES, 
  SUBJECTS,
  SUBJECT_CATEGORIES, 
  getYouTubeThumbnail, 
  getSubjectFallbackImage,
  getTierForTool
} from './curriculumConfig';

// Module-level cache to keep parsed curriculum in memory across view transitions
const lessonsMemoryCache = new Map<string, any[]>();

const LessonsView = ({ isLoggedIn, requireAuth, onStartLesson, defaultClass, defaultSubject, authProfile, role, isPro, onBackToCourses }: any) => {
  // 🎯 PROGRESS PERMISSIONS: Teachers, Pro users, and all logged-in students can track progress
  const showProgress = role === 'teacher' || role === 'student' || Boolean(isPro);
  const getCategoryName = (subj: string) => {
    if (SUBJECT_CATEGORIES.CORE.includes(subj)) return 'Core';
    if (SUBJECT_CATEGORIES.FOUNDATIONAL.includes(subj)) return 'Foundational';
    if (SUBJECT_CATEGORIES.CO_CURRICULAR_AND_SKILLS.includes(subj)) return 'Co-Curricular & Skills';
    return '';
  };
  const [selectedClass, setSelectedClass] = useState(defaultClass || "");
  const [selectedSubject, setSelectedSubject] = useState(defaultSubject || "");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Keep selected class & subject in sync when props change
  useEffect(() => {
    if (defaultClass !== undefined) setSelectedClass(defaultClass || "");
    if (defaultSubject !== undefined) setSelectedSubject(defaultSubject || "");
  }, [defaultClass, defaultSubject]);
  const [allLessons, setAllLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20); // ⚡ Performance: 20 items initial load
  
  const [activeLesson, setActiveLesson] = useState(null);
  const [expandedSubTopics, setExpandedSubTopics] = useState({});
  const [studentProgress, setStudentProgress] = useState<any[]>([]);

  // Scope student views to enrolled combinations
  const studentEnrollments = React.useMemo(() => {
    if (role !== 'student' || !authProfile) return null;
    const orgLinks = authProfile.org_links || {};
    const orgIds = authProfile.org_ids || Object.keys(orgLinks);
    const hasSchool = (orgIds && orgIds.length > 0) || (authProfile.active_b2c_licenses && authProfile.active_b2c_licenses.length > 0);
    if (!hasSchool) return null;

    const gradesSet = new Set<string>();
    const subjectsSet = new Set<string>();

    for (const orgId of orgIds) {
      const link = orgLinks[orgId];
      if (!link) continue;
      const g = link.grade || authProfile.grade;
      if (g && g !== 'Unassigned') {
        const cleanG = g.toString().replace(/^Grade\s*/i, 'Grade ');
        gradesSet.add(cleanG);
      }
      
      const assigned: string[] = link.assigned_combos || [];
      assigned.forEach((comboStr: string) => {
        const parts = comboStr.split('-');
        if (parts.length > 0) {
          const rawGrade = parts[0].trim().replace(/^org_[^_]+_/, '');
          if (rawGrade) gradesSet.add(rawGrade);
        }
        if (parts.length > 1) {
          const rawSubj = parts[parts.length - 1].trim();
          if (rawSubj) subjectsSet.add(rawSubj);
        }
      });
    }

    (authProfile.active_b2c_licenses || []).forEach((comboStr: string) => {
      const parts = comboStr.split('-');
      if (parts.length > 0) {
        const rawGrade = parts[0].trim();
        if (rawGrade) gradesSet.add(rawGrade);
      }
      if (parts.length > 1) {
        const rawSubj = parts[parts.length - 1].trim();
        if (rawSubj) subjectsSet.add(rawSubj);
      }
    });

    return {
      grades: Array.from(gradesSet),
      subjects: Array.from(subjectsSet)
    };
  }, [role, authProfile]);

  // Auto-default to student's enrolled grade
  useEffect(() => {
    if (studentEnrollments && studentEnrollments.grades.length > 0 && !selectedClass) {
      setSelectedClass(studentEnrollments.grades[0]);
    }
  }, [studentEnrollments]);

  const availableGrades = React.useMemo(() => {
    if (studentEnrollments && studentEnrollments.grades.length > 0) {
      return GRADES.filter(g => {
        const gNum = g.replace(/\D/g, '');
        return studentEnrollments.grades.some(sg => {
          const sgNum = sg.replace(/\D/g, '');
          return sg.toLowerCase() === g.toLowerCase() || (gNum && sgNum && gNum === sgNum);
        });
      });
    }
    return GRADES;
  }, [studentEnrollments]);

  const availableSubjects = React.useMemo(() => {
    if (studentEnrollments && studentEnrollments.subjects.length > 0) {
      return SUBJECTS.filter(s => {
        const sLower = s.toLowerCase();
        return studentEnrollments.subjects.some(ss => {
          const ssLower = ss.toLowerCase();
          return ssLower === sLower || (ssLower.includes('math') && sLower.includes('math')) || (ssLower.includes('eng') && sLower.includes('eng')) || (ssLower.includes('hindi') && sLower.includes('hindi'));
        });
      });
    }
    return SUBJECTS;
  }, [studentEnrollments]);

  const displayedSubjects = React.useMemo(() => {
    if (!selectedCategory) return availableSubjects;
    return availableSubjects.filter(s => getCategoryName(s).toLowerCase() === selectedCategory.toLowerCase());
  }, [selectedCategory, availableSubjects]);

  // Reset pagination window when filters or search change
  useEffect(() => {
    setVisibleCount(20);
  }, [selectedClass, selectedSubject, selectedCategory, searchQuery]);

  const toggleSubTopic = (id: any) => setExpandedSubTopics(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (!authProfile?.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'users', authProfile.uid, 'progress'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudentProgress(data);
    });
    return () => unsubscribe();
  }, [authProfile]);

  // Robust Tool Completion Resolver: Matches subject docs first, then searches globally (backward compatible)
  const findToolRecord = React.useCallback((toolId: string, grade?: string, subject?: string) => {
    if (!studentProgress || studentProgress.length === 0 || !toolId) return null;
    const cleanId = toolId.replace(/\./g, '_');

    // 1. Check matching grade/subject documents first
    if (grade && subject) {
      const cKey = `${grade}_${subject}`.toLowerCase();
      const sLower = subject.toLowerCase();
      const matchedDoc = studentProgress.find(p => {
        const pId = p.id?.toLowerCase() || '';
        return pId === cKey || pId === sLower ||
          (sLower.includes('hindi') && pId.includes('hindi')) ||
          (sLower.includes('math') && pId.includes('math')) ||
          (sLower.includes('eng') && pId.includes('eng'));
      });
      if (matchedDoc?.completed_tools?.[cleanId] || matchedDoc?.completed_tools?.[toolId]) {
        return matchedDoc.completed_tools[cleanId] || matchedDoc.completed_tools[toolId];
      }
    }

    // 2. Global fallback across any progress doc (tool IDs are unique)
    for (const p of studentProgress) {
      if (p.completed_tools) {
        if (p.completed_tools[cleanId]) return p.completed_tools[cleanId];
        if (p.completed_tools[toolId]) return p.completed_tools[toolId];
      }
    }

    return null;
  }, [studentProgress]);


  useEffect(() => {
    async function fetchLessons() {
      const cacheKey = `${selectedClass || 'ALL'}_${selectedSubject || 'ALL'}`;
      if (lessonsMemoryCache.has(cacheKey)) {
        setAllLessons(lessonsMemoryCache.get(cacheKey)!);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Fetch the new flat collection (Optimized)
        let toolsQuery = collection(db, 'learning_tools') as any;
        if (selectedClass && selectedClass !== '') {
            toolsQuery = query(collection(db, 'learning_tools'), where('grade', 'in', [
                selectedClass, 
                selectedClass.toUpperCase(), 
                selectedClass.toLowerCase(), 
                'All Grades', 
                'all grades', 
                'ALL GRADES'
            ]));
        }
        
        const snapshot = await getDocs(toolsQuery).catch(() => ({ docs: [] }));
        let flatTools = snapshot.docs.map((d: any) => ({id: d.id, ...d.data()}));
        
        // If subject is selected, filter in memory
        if (selectedSubject && selectedSubject !== '') {
           flatTools = flatTools.filter((t: any) => {
               const s = (t.subject || '').trim().toLowerCase();
               const queryS = selectedSubject.toLowerCase();
               const isMathMatch = (queryS === 'maths' && (s === 'mathematics' || s === 'fln maths')) ||
                                   (queryS === 'mathematics' && (s === 'maths' || s === 'fln maths'));
               const isHindiMatch = queryS === 'hindi' && (s === 'hindi' || s === 'fln hindi');
               const isEnglishMatch = queryS === 'english' && (s === 'english' || s === 'fln english');
               return s === queryS || isMathMatch || isHindiMatch || isEnglishMatch;
           });
        }
        
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
              const subKey = `${tool.subtopic_order || 1}_${tool.subtopic.trim()}`;
              if (!chaptersMap[key].subTopicsMap[subKey]) {
                 chaptersMap[key].subTopicsMap[subKey] = {
                    title: tool.subtopic,
                    subtopic_order: tool.subtopic_order || 1,
                    tools: []
                 };
              }
              // Don't push empty placeholders into the actual tool list
              if (tool.title && tool.content_type !== 'Placeholder') {
                 // Ensure subtopicId and subtopic_id are normalized
                 tool.subtopicId = tool.subtopicId || tool.subtopic_id;
                 tool.subtopic_id = tool.subtopic_id || tool.subtopicId;
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

           // Fallback Image handling: Run lookup if empty OR if it contains a generic Unsplash fallback string
           if (!chapter.image || chapter.image.trim() === "" || chapter.image.includes("images.unsplash.com")) {
               // If the first item in the chapter is a video, use its thumbnail!
               const firstSub = subTopicsArray[0] as any; 
               const firstTool = firstSub?.tools?.[0];
               if (firstTool && (firstTool.content_type?.toLowerCase() === 'video' || firstTool.type?.toLowerCase() === 'video') && firstTool.content_url) {
                   chapter.image = getYouTubeThumbnail(firstTool.content_url);
               }
               // Otherwise, use subject fallback if no video thumbnail was successfully pulled
               if (!chapter.image || chapter.image.trim() === "" || chapter.image.includes("images.unsplash.com")) {
                   chapter.image = getSubjectFallbackImage(chapter.subject);
               }
           }

           return chapter;
        });

        // C. Sort the final Chapters array by chapter_number
        processedModules.sort((a: any, b: any) => a.chapter_number - b.chapter_number);

        lessonsMemoryCache.set(cacheKey, processedModules);
        setAllLessons(processedModules);
      } catch (error: any) { 
        console.error("Error fetching lessons:", error); 
      } finally { 
        setIsLoading(false); 
      }
    }
    
    fetchLessons();
  }, [selectedClass, selectedSubject]);

  const filteredLessons = allLessons.filter((lesson: any) => {
    let matchClass = true;
    if (selectedClass) {
      matchClass = lesson.grade?.toLowerCase().trim() === selectedClass.toLowerCase().trim() || 
                   lesson.grade?.toLowerCase().trim() === 'all grades';
    } else if (studentEnrollments && studentEnrollments.grades.length > 0) {
      const lessonGradeNum = (lesson.grade || '').replace(/\D/g, '');
      matchClass = lesson.grade?.toLowerCase().trim() === 'all grades' || 
                   studentEnrollments.grades.some(sg => {
                     const sgNum = sg.replace(/\D/g, '');
                     return sg.toLowerCase().trim() === lesson.grade?.toLowerCase().trim() || (lessonGradeNum && sgNum && lessonGradeNum === sgNum);
                   });
    }

    let matchSubject = true;
    const dbSubj = lesson.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : lesson.subject?.toLowerCase().trim();
    if (selectedSubject) {
      const queryS = selectedSubject.toLowerCase().trim();
      matchSubject = dbSubj === queryS ||
                     (queryS === 'hindi' && (dbSubj === 'hindi' || dbSubj === 'fln hindi')) ||
                     (queryS === 'english' && (dbSubj === 'english' || dbSubj === 'fln english')) ||
                     (queryS === 'maths' && (dbSubj === 'maths' || dbSubj === 'mathematics' || dbSubj === 'fln maths')) ||
                     (queryS === 'mathematics' && (dbSubj === 'maths' || dbSubj === 'mathematics' || dbSubj === 'fln maths'));
    } else if (studentEnrollments && studentEnrollments.subjects.length > 0) {
      matchSubject = studentEnrollments.subjects.some(ss => {
        const ssLower = ss.toLowerCase().trim();
        return ssLower === dbSubj || ssLower === lesson.subject?.toLowerCase().trim() || 
               (ssLower.includes('math') && dbSubj?.includes('math')) || 
               (ssLower.includes('eng') && dbSubj?.includes('eng')) || 
               (ssLower.includes('hindi') && dbSubj?.includes('hindi'));
      });
    }

    const matchQuery = searchQuery ? lesson.chapter?.toLowerCase().includes(searchQuery.toLowerCase()) || lesson.book?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const cat = getCategoryName(lesson.subject);
    const matchCategory = selectedCategory ? cat.toLowerCase() === selectedCategory.toLowerCase() : true;
    return matchClass && matchSubject && matchQuery && matchCategory;
  });

  return (
    <div className="space-y-12 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6">
      {!activeLesson ? (
        <>
          {/* Breadcrumb Navigation: Back to Kortex Kourses */}
          {onBackToCourses && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onBackToCourses}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 hover:border-indigo-400 text-indigo-600 hover:bg-indigo-50 font-black text-xs rounded-2xl shadow-xs transition-all cursor-pointer group"
              >
                <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Kortex Kourses</span>
              </button>
            </div>
          )}

          {/* Active Course Title & Chapter Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                {selectedSubject ? `${selectedClass ? `${selectedClass} • ` : ''}${selectedSubject}` : 'Course Lessons'}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">
                {filteredLessons.length} {filteredLessons.length === 1 ? 'Chapter' : 'Chapters'} available
              </p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="Search chapters or books..." 
                value={searchQuery} 
                onChange={(e: any) => setSearchQuery(e.target.value)} 
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-sky-500 rounded-2xl py-2.5 pl-4 pr-10 font-bold text-xs text-slate-700 outline-none transition-colors"
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              ) : (
                <Search className="absolute right-3.5 top-3 text-slate-400" size={16} />
              )}
            </div>
          </div>

          {studentEnrollments && (
             <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border-2 border-indigo-100 text-indigo-700 text-xs font-bold rounded-2xl">
               <Sparkles size={16} className="text-indigo-500 shrink-0" />
               <span>Showing courses scoped to your school enrollment ({studentEnrollments.grades.join(', ')})</span>
             </div>
          )}

          <div className="pb-12">
            {isLoading ? (<div className="py-20 text-center font-bold text-sky-500 animate-pulse">Loading Lessons...</div>) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredLessons.length > 0 ? (
                  <>
                    {filteredLessons.slice(0, visibleCount).map((lesson: any, idx: any) => (
                      <Card key={idx} className={`border-b-8 ${lesson.color} cursor-pointer group transition-all p-0 flex flex-col hover:border-sky-300 rounded-3xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1`} onClick={() => setActiveLesson(lesson)}>
                        <div className="relative h-36 sm:h-40 w-full bg-slate-200 overflow-hidden">
                           <img 
                             src={lesson.image || getSubjectFallbackImage(lesson.subject)} 
                             alt={lesson.chapter} 
                             loading="lazy" 
                             decoding="async" 
                             onError={(e) => { e.currentTarget.src = getSubjectFallbackImage(lesson.subject); }}
                             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                           />
                           <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/20 to-transparent pointer-events-none"></div>
                           <div className="absolute top-3 left-3 pointer-events-none">
                              <span className="bg-white/95 text-slate-800 text-[10px] sm:text-xs font-bold uppercase px-2.5 py-1 rounded-full shadow-sm max-w-[85%] truncate">{lesson.book}</span>
                           </div>
                        </div>
                        <div className="p-3.5 sm:p-4 bg-white flex-1 flex flex-col group-hover:bg-slate-50 transition-colors">
                           
                           <h3 className="text-sm sm:text-base font-black text-slate-800 mb-1.5 group-hover:text-sky-600 leading-snug line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem]">{lesson.chapter}</h3>
                           <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500 mb-3">
                             <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{lesson.grade}</span>
                             {getCategoryName(lesson.subject) && <><span>•</span><span className="text-slate-400">{getCategoryName(lesson.subject)}</span></>}
                             <span>•</span><span>{lesson.subject}</span>
                           </div>
                           {(() => {
                               let totalTools = 0;
                               let completedTools = 0;
                               if (lesson.subTopics) {
                                   lesson.subTopics.forEach((st: any) => {
                                      if (st.tools) {
                                          totalTools += st.tools.length;
                                          st.tools.forEach((t: any) => { 
                                            if (findToolRecord(t.id, lesson.grade, lesson.subject)) completedTools++; 
                                          });
                                      }
                                   });
                               } else if (lesson.flow) {
                                   totalTools += lesson.flow.length;
                                   lesson.flow.forEach((t: any) => { 
                                     if (findToolRecord(t.id, lesson.grade, lesson.subject)) completedTools++; 
                                   });
                               }
                               const pct = totalTools > 0 ? Math.round((completedTools / totalTools) * 100) : 0;
                               
                               return (totalTools > 0 && showProgress) ? (
                                   <div className="mb-4">
                                       <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider mb-1 text-slate-500">
                                           <span>Progress</span>
                                           <span className={pct === 100 ? 'text-emerald-500' : 'text-sky-500'}>{pct}%</span>
                                       </div>
                                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                           <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${pct}%` }}></div>
                                       </div>
                                   </div>
                               ) : null;
                           })()}

                           <div className="mt-auto pt-2.5 border-t border-slate-100 space-y-1.5">
                              {/* Row 1: First 3 Tiers */}
                              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-slate-500">
                                 <span className="inline-flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs hover:border-purple-300 transition-colors">
                                   <Lightbulb size={11} className="text-purple-500 shrink-0"/> <span>Concepts</span>
                                 </span>
                                 <span className="inline-flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs hover:border-pink-300 transition-colors">
                                   <Video size={11} className="text-pink-500 shrink-0"/> <span>Videos</span>
                                 </span>
                                 <span className="inline-flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs hover:border-lime-300 transition-colors">
                                   <Gamepad2 size={11} className="text-lime-500 shrink-0"/> <span>Games</span>
                                 </span>
                              </div>

                              {/* Row 2: Remaining 2 Tiers + Items Count on Extreme Right */}
                              <div className="flex items-center justify-between gap-1 text-[9px] sm:text-[10px] font-bold text-slate-500">
                                 <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs hover:border-orange-300 transition-colors">
                                      <Target size={11} className="text-orange-500 shrink-0"/> <span>Quizzes</span>
                                    </span>
                                    <span className="inline-flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs hover:border-sky-300 transition-colors">
                                      <FileText size={11} className="text-sky-500 shrink-0"/> <span>Docs</span>
                                    </span>
                                 </div>

                                 <div className="shrink-0 flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100/90 px-1.5 py-0.5 rounded-md shadow-2xs">
                                    <Layers size={11} className="text-indigo-600 shrink-0" />
                                    <span>{lesson.items} Tools</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </Card>
                    ))}

                    {filteredLessons.length > visibleCount && (
                      <div className="col-span-full pt-8 pb-4 flex flex-col items-center justify-center gap-3">
                        <p className="text-sm font-bold text-slate-400">
                          Showing {visibleCount} of {filteredLessons.length} chapters
                        </p>
                        <button
                          onClick={() => setVisibleCount(prev => prev + 20)}
                          className="px-8 py-3.5 bg-white border-2 border-sky-400 text-sky-600 hover:bg-sky-500 hover:text-white rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                          <span>Load More Chapters ({filteredLessons.length - visibleCount} remaining)</span>
                          <ChevronDown size={18} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (<div className="col-span-full py-16 text-center bg-white rounded-3xl border-2"><h3 className="text-xl font-bold">No lessons found</h3></div>)}
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
                                 
                                 {(() => {
                                     const tot = subTopic.tools?.length || 0;
                                     const comp = subTopic.tools?.filter((t: any) => findToolRecord(t.id, activeLesson.grade, activeLesson.subject))?.length || 0;
                                     if (tot === 0) return <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm hidden sm:block">0 Tools</span>;
                                     if (!showProgress) return <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm hidden sm:block">{tot} Tools</span>;
                                     if (comp === tot) return <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm flex items-center gap-1"><CheckCircle2 size={12}/> Completed</span>;
                                     return <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 shadow-sm hidden sm:block">{comp}/{tot} Completed</span>;
                                 })()}

                                 <button onClick={() => toggleSubTopic(subTopic.id || sIdx)} className="bg-white p-1 rounded-full shadow-sm border border-slate-200">{isExpanded ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}</button>
                              </div>
                           </div>

                           {isExpanded && (
                              <div className="p-4 border-t-2 border-slate-100 bg-white space-y-3">
                                 {subTopic.tools && subTopic.tools.length > 0 ? [...subTopic.tools].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((item: any, index: any) => (
                                    <div key={index} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl border-2 border-slate-100 transition-colors group relative hover:border-sky-300">
                                       <div className="flex items-center gap-4">
                                          {(() => {
                                             const tier = getTierForTool(item.content_type || item.type);
                                             const Icon = tier?.icon || Gamepad2;
                                             return (
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${tier?.mainColor || 'bg-slate-800'} group-hover:scale-110 transition-transform`}>
                                                   <Icon size={24} />
                                                </div>
                                             );
                                          })()}
                                          <div>
                                             <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">#{index + 1} • {item.content_type || item.type || 'Tool'}</span>
                                                {item.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1"><Star size={8} className="fill-amber-700"/> Pro</span>}
                                                {(() => {
                                                   const title = item.title || '';
                                                   const slug = (item.subtopicId || item.subtopic_id || '') as string;
                                                   const isChap = Boolean(
                                                      item.is_major_milestone ||
                                                      item.assessment_type === 'chapter' ||
                                                      title.includes('Chapter Assessment') ||
                                                      title.includes('महा-मूल्यांकन') ||
                                                      slug.endsWith('-major-quiz')
                                                   );
                                                   const isSub = !isChap && Boolean(
                                                      item.is_assessment ||
                                                      item.assessment_type === 'subtopic' ||
                                                      title.includes('Subtopic Assessment') ||
                                                      title.includes('उपविषय मूल्यांकन') ||
                                                      /-sub\d+-quiz$/i.test(slug)
                                                   );
                                                   if (isChap) {
                                                      return (
                                                         <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                                            <Trophy size={11} className="text-amber-200 fill-amber-200" /> Chapter Assessment 🏆
                                                         </span>
                                                      );
                                                   }
                                                   if (isSub) {
                                                      return (
                                                         <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <Target size={11} className="text-indigo-600" /> Subtopic Assessment 🎯
                                                         </span>
                                                      );
                                                   }
                                                   return null;
                                                })()}
                                             </div>
                                             
                                             <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-extrabold text-slate-800">{item.title}</h4>
                                                {(() => {
                                                    const toolRecord = findToolRecord(item.id, activeLesson.grade, activeLesson.subject);
                                                    if (toolRecord && showProgress) {
                                                        return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> {toolRecord.best_score !== undefined ? `Score: ${toolRecord.best_score}` : 'Done'}</span>;
                                                    }
                                                    return null;
                                                })()}
                                             </div>

                                          </div>
                                       </div>
                                       <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                          <Button variant="secondary" className="flex-1 md:flex-none py-2 px-6 text-sm font-bold border-2 shadow-none hover:border-sky-500 hover:text-sky-600" onClick={() => {
                                             const isolatedPlaylist = [...subTopic.tools].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
                                             onStartLesson({ 
                                               chapter: activeLesson.chapter, 
                                               book: activeLesson.book, 
                                               grade: activeLesson.grade,
                                               subject: activeLesson.subject,
                                               subtopic: subTopic.title, 
                                               flow: isolatedPlaylist 
                                             }, index);
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
                              {(() => {
                                 const tier = getTierForTool(item.content_type || item.type);
                                 const Icon = tier?.icon || Gamepad2;
                                 return (
                                    <div className={`absolute -left-[54px] top-2 w-10 h-10 rounded-full border-4 border-white ${tier?.mainColor || 'bg-slate-800'} flex items-center justify-center text-white shadow-md z-10`}>
                                       <Icon size={16} />
                                    </div>
                                 );
                              })()}
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

export default LessonsView;
