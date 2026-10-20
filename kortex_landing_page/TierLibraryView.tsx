"use client";

import React, { useState, useEffect } from 'react';
import { Search, Lock, Star, X, Sparkles } from 'lucide-react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../backend_configurations/firebase';
import { Card } from './components/SharedUI';
import { 
  GRADES, 
  SUBJECTS, 
  SUBJECT_CATEGORIES,
  getYouTubeThumbnail, 
  getSubjectFallbackImage,
  getTierForTool
} from './curriculumConfig';

// Module-level in-memory cache to prevent re-querying Firestore on every tier tab switch
let tierLibraryAllToolsCache: any[] | null = null;

const TierLibraryView = ({ activeTier, isLoggedIn, requireAuth, onOpenTool, authProfile, role, isPro }: any) => {
  const getCategoryName = (subj: string) => {
    if (SUBJECT_CATEGORIES.CORE.includes(subj)) return 'Core';
    if (SUBJECT_CATEGORIES.FOUNDATIONAL.includes(subj)) return 'Foundational';
    if (SUBJECT_CATEGORIES.CO_CURRICULAR_AND_SKILLS.includes(subj)) return 'Co-Curricular & Skills';
    return '';
  };

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tierItems, setTierItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(24);

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
    setVisibleCount(24);
  }, [selectedClass, selectedSubject, selectedCategory, searchQuery]);

  useEffect(() => {
    async function fetchTierData() {
      setIsLoading(true);
      try {
        let rawDocs: any[] = [];
        if (tierLibraryAllToolsCache) {
          rawDocs = tierLibraryAllToolsCache;
        } else {
          const toolsQuery = query(collection(db, 'learning_tools'));
          const snapshot = await getDocs(toolsQuery).catch(() => ({ docs: [] }));
          rawDocs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
          tierLibraryAllToolsCache = rawDocs;
        }
        
        let extractedItems: any[] = [];
        
        rawDocs.forEach((item: any) => {
          const type = (item.content_type || item.type)?.toLowerCase() || '';
          
          const tier = getTierForTool(type);
          const belongsToTier = tier.id.toLowerCase() === activeTier.id.toLowerCase();

          if (belongsToTier) {
             let autoImage = item.image;

             // Force YouTube thumbnail priority first for all videos
             if (type === 'video' && item.content_url) {
                 const ytThumb = getYouTubeThumbnail(item.content_url);
                 if (ytThumb) autoImage = ytThumb;
             }

             // Apply general subject fallback if empty or if it contains an old Unsplash placeholder string
             if (!autoImage || autoImage.trim() === "" || autoImage.includes("images.unsplash.com")) {
                 autoImage = getSubjectFallbackImage(item.subject);
             }

             extractedItems.push({
               ...item, 
               image: autoImage,
               lessonContext: { chapter: item.chapter_name, book: item.book }, 
               stepIndex: 0
             });
          }
        });

        // Sort by created_at date (Newest first)
        extractedItems.sort((a: any, b: any) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA; 
        });

        // Deduplicate items based on title so tools added to multiple chapters only appear once
        const seenTitles = new Set();
        const deduplicatedItems = extractedItems.filter(item => {
            const titleStr = (item.title || "").toLowerCase().trim();
            if (seenTitles.has(titleStr)) return false;
            seenTitles.add(titleStr);
            return true;
        });

        setTierItems(deduplicatedItems);
      } catch (error) { 
        console.error(error); 
      } finally { 
        setIsLoading(false); 
      }
    }
    fetchTierData();
  }, [activeTier.id]);

  const filteredItems = tierItems.filter((item: any) => {
    // 1. Grade Matching: Match specific grade OR 'all grades' / foundational
    let matchClass = true;
    const itemGrade = (item.grade || '').toLowerCase().trim();
    const isAllGradeContent = itemGrade === 'all grades' || itemGrade === 'all grade' || itemGrade === 'all' || !itemGrade;
    
    if (selectedClass) {
      matchClass = itemGrade === selectedClass.toLowerCase().trim() || isAllGradeContent;
    } else if (studentEnrollments && studentEnrollments.grades.length > 0) {
      const itemGradeNum = itemGrade.replace(/\D/g, '');
      matchClass = isAllGradeContent || studentEnrollments.grades.some(sg => {
        const sgNum = sg.replace(/\D/g, '');
        return sg.toLowerCase().trim() === itemGrade || (itemGradeNum && sgNum && itemGradeNum === sgNum);
      });
    }

    // 2. Subject Matching
    let matchSubject = true;
    const dbSubj = (item.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : item.subject?.toLowerCase().trim()) || '';
    if (selectedSubject) {
      const selSubj = selectedSubject.toLowerCase().trim();
      matchSubject = dbSubj === selSubj ||
                     (selSubj === 'hindi' && (dbSubj === 'hindi' || dbSubj === 'fln hindi')) ||
                     (selSubj === 'english' && (dbSubj === 'english' || dbSubj === 'fln english')) ||
                     (selSubj === 'maths' && (dbSubj === 'maths' || dbSubj === 'mathematics' || dbSubj === 'fln maths')) ||
                     (selSubj === 'mathematics' && (dbSubj === 'maths' || dbSubj === 'mathematics' || dbSubj === 'fln maths'));
    } else if (studentEnrollments && studentEnrollments.subjects.length > 0) {
      const isFoundational = SUBJECT_CATEGORIES.FOUNDATIONAL.some(fs => fs.toLowerCase() === dbSubj);
      matchSubject = isFoundational || studentEnrollments.subjects.some(ss => {
        const ssLower = ss.toLowerCase().trim();
        return ssLower === dbSubj || 
               (ssLower.includes('math') && dbSubj.includes('math')) || 
               (ssLower.includes('eng') && dbSubj.includes('eng')) || 
               (ssLower.includes('hindi') && dbSubj.includes('hindi'));
      });
    }

    // 3. Category Matching
    const cat = getCategoryName(item.subject);
    const matchCategory = selectedCategory ? cat.toLowerCase() === selectedCategory.toLowerCase() : true;

    // 4. Search Query Matching
    const matchQuery = searchQuery ? 
      ((item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
       (item.chapter_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
       (item.subject || '').toLowerCase().includes(searchQuery.toLowerCase())) : true;

    return matchClass && matchSubject && matchCategory && matchQuery;
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

      {/* School Enrollment Scope Banner */}
      {studentEnrollments && (
         <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border-2 border-indigo-100 text-indigo-700 text-xs font-bold rounded-2xl">
           <Sparkles size={16} className="text-indigo-500 shrink-0" />
           <span>Showing content scoped to your school enrollment ({studentEnrollments.grades.join(', ')})</span>
         </div>
      )}

      {/* Modern Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="font-bold text-slate-500 text-sm uppercase px-2 hidden sm:block">Filter:</span>
            
            {/* Category Dropdown */}
            <select 
              className={`flex-1 md:w-40 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-3 font-bold text-slate-700 outline-none focus:${activeTier.borderColor}`} 
              value={selectedCategory} 
              onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubject(""); }}
            >
              <option value="">All Types</option>
              <option value="Core">Core</option>
              <option value="Foundational">Foundational</option>
              <option value="Co-Curricular & Skills">Co-Curricular</option>
            </select>

            {/* Grade Dropdown */}
            <select 
              className={`flex-1 md:w-40 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:${activeTier.borderColor}`} 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">{studentEnrollments ? 'My Enrolled Grades' : 'All Grades'}</option>
              {availableGrades.map((g: string) => <option key={g} value={g}>{g}</option>)}
            </select>

            {/* Subject Dropdown */}
            <select 
              className={`flex-1 md:w-48 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:${activeTier.borderColor}`} 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">{studentEnrollments ? 'My Enrolled Subjects' : 'All Subjects'}</option>
              {displayedSubjects.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>

         {/* Search & Clear Button */}
         <div className="relative w-full md:flex-1 flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder={`Search ${activeTier.label}...`} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className={`w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-4 pr-10 font-bold text-slate-700 outline-none focus:${activeTier.borderColor}`} 
              />
              <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
            </div>
            {(selectedCategory || selectedClass || selectedSubject || searchQuery) && (
              <button 
                onClick={() => { setSelectedCategory(""); setSelectedClass(""); setSelectedSubject(""); setSearchQuery(""); }} 
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl transition-colors shrink-0 flex items-center gap-2"
              >
                <X size={16} /> Clear
              </button>
            )}
         </div>
      </div>

      {/* Grid */}
      <div className="pb-12">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6">{activeTier.label} Collection</h2>
        {isLoading ? (
           <div className={`py-20 text-center ${activeTier.textColor} font-bold animate-pulse`}>Loading modules...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.length > 0 ? filteredItems.slice(0, visibleCount).map((item, idx) => {
                let isLockedByDepth = false;

                return (
                  <Card 
                    key={item.id || idx} 
                    className={`${isLockedByDepth ? 'opacity-50 grayscale' : 'hover:'+activeTier.borderColor} cursor-pointer group relative p-0 flex flex-col border-b-4 ${activeTier.borderColor}`} 
                    onClick={() => {
                      if (isLockedByDepth) {
                         alert("This level is locked! Ask your parents to unlock Kortex Pro or assign this course to continue learning past Level 3.");
                         return;
                      }
                      if (item.isPremium) requireAuth(() => onOpenTool(item), `This is a Premium ${activeTier.label}. Sign up for free to access it!`);
                      else onOpenTool(item);
                    }}
                  >
                    <div className="relative h-36 w-full bg-slate-200 overflow-hidden">
                      <img 
                        src={item.image || getSubjectFallbackImage(item.subject)} 
                        alt={item.title} 
                        loading="lazy" 
                        decoding="async" 
                        onError={(e) => { e.currentTarget.src = getSubjectFallbackImage(item.subject); }}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>
                      {item.isPremium && !isLockedByDepth && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                          <Star size={10} className="fill-white" /> PRO
                        </div>
                      )}
                      {isLockedByDepth && (
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[2px] z-10">
                          <div className="bg-slate-900 text-white p-3 rounded-full shadow-xl"><Lock size={24} /></div>
                        </div>
                      )}
                    </div>
                    <div className="p-5 bg-white flex-1 flex flex-col">
                      <div className="mb-2">
                        <p className={`text-[12px] font-black ${activeTier.textColor} uppercase tracking-wider line-clamp-1`}>
                          {item.lessonContext?.chapter || activeTier.label}
                        </p>
                      </div>
                      <h3 className={`text-lg font-extrabold text-slate-800 mb-2 group-hover:${activeTier.textColor} transition-colors leading-tight line-clamp-2`}>
                        {item.title} {item.isPremium && !isLoggedIn && <Lock size={14} className="text-slate-300 inline mb-0.5 shrink-0"/>}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 mt-auto pt-3 border-t border-slate-100">
                        <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{item.grade}</span>
                        {getCategoryName(item.subject) && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">{getCategoryName(item.subject)}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="truncate">{item.subject}</span>
                      </div>
                    </div>
                  </Card>
                );
              }) : (
                <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-slate-100">
                  <h3 className="text-xl font-bold text-slate-700">No content found</h3>
                </div>
              )}
            </div>

            {filteredItems.length > visibleCount && (
              <div className="text-center pt-8">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 24)} 
                  className="px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-95"
                >
                  Load More ({filteredItems.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TierLibraryView;
