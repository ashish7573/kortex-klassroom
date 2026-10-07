"use client";
import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../../types/user';
import { auth } from '../../backend_configurations/firebase';
import { checkAndResetDailyHearts, consumeHeart } from '../../app/actions/student';
import { Sparkles, Trophy, Flame, Play, BookOpen, Lightbulb, Gamepad2, Target, Heart, BatteryCharging, X, Star, History, Award, Book, ClipboardList, CheckCircle2, CircleDashed } from 'lucide-react';
import { collection, onSnapshot, getDocs, query, orderBy, limit, where, doc, getDoc } from 'firebase/firestore';
import { getStudentOrgProfiles, markAssignmentAsDone } from '../../app/actions/student';
import { db } from '../../backend_configurations/firebase';
import { useStudentAssignments, AssignmentStatus } from '../../hooks/useStudentAssignments';

interface StudentDashboardProps {
  profile: StudentProfile;
  onExploreTier?: (tierId: string) => void;
}

export default function StudentDashboard({ profile, onExploreTier }: StudentDashboardProps) {
  const [hearts, setHearts] = useState(profile.hearts_remaining ?? 5);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [isResetting, setIsResetting] = useState(true);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [leaderboardTool, setLeaderboardTool] = useState<{ id: string, name: string } | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [orgProfiles, setOrgProfiles] = useState<Record<string, any>>({});
  const [allDisplayCombos, setAllDisplayCombos] = useState<Array<{ id: string, label: string, subject: string, orgName: string }>>([]);
  const [subjectTotals, setSubjectTotals] = useState<Record<string, number>>({});

  // --------------------------------------------------------------------------
  // ASSIGNMENTS STATE (Ready for Backend Integration)
  // --------------------------------------------------------------------------
  const { assignments, loading: loadingAssignments, refreshAssignments } = useStudentAssignments(profile.uid);
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');
  const filteredAssignments = assignments.filter(a => a.status === assignmentFilter);

  const handleMarkAsDone = async (assignmentId: string) => {
     try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await markAssignmentAsDone(token, assignmentId);
        if (res.success) {
           refreshAssignments();
           setAssignmentFilter('submitted'); // Auto switch to submitted tab to show them their success
        } else {
           alert("Failed to mark as done: " + res.error);
        }
     } catch (e: any) {
        alert(e.message);
     }
  };




  useEffect(() => {
    async function loadOrgs() {
      if (!profile.org_ids || profile.org_ids.length === 0) {
        // Just B2C licenses
        const b2c = (profile.active_b2c_licenses || []).map(comboStr => ({
           id: comboStr,
           label: comboStr,
           subject: comboStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT',
           orgName: 'Independent'
        }));
        setAllDisplayCombos(b2c);
        return;
      }

      let orgData: Record<string, any> = {};
      const displayCombos: Array<{ id: string, label: string, subject: string, orgName: string }> = [];

      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const result = await getStudentOrgProfiles(token, profile.org_ids);
        if (result.success && result.orgProfiles) {
           orgData = result.orgProfiles;
        }
      } catch (e) {
        console.error("Failed to fetch org profiles", e);
      }

      for (const orgId of profile.org_ids) {
        try {
          const data = orgData[orgId];
          if (data) {
             const link = profile.org_links?.[orgId];
             if (link && link.status === 'approved') {
                const orgName = data.full_name || 'School';
                const allOrgCombos: string[] = data.approved_grade_subject_combos || [];
                
                // 1. Get Default Core Combos for this student's grade & section
                const grade = link.grade || profile.grade;
                const section = link.section || profile.section;
                const defaultPrefix = `${grade} - Section ${section}`;
                
                const defaultCombos = allOrgCombos.filter(c => c.startsWith(defaultPrefix));
                
                // We need to parse generateComboId locally to map the extra assigned_combos
                const orgAbbrev = (data.kortex_id || '').startsWith("ORG_") ? (data.kortex_id || '').replace("ORG_", "") : (data.kortex_id || '');
                
                const generateId = (comboString: string) => {
                  const parts = comboString.split('-');
                  const rawGrade = parts.length > 0 ? parts[0].trim() : "";
                  const rawSection = parts.length > 1 ? parts[1].trim() : "";
                  const rawSubject = parts.length > 2 ? parts[parts.length - 1].trim() : "SUBJ";
                  
                  let gradePart = "X";
                  const upperGrade = rawGrade.toUpperCase();
                  if (upperGrade.includes('FLN')) gradePart = "FLN";
                  else if (upperGrade.includes('BALVATIKA')) {
                    const match = rawGrade.match(/\d+/);
                    gradePart = match ? `BV${match[0]}` : "BV";
                  } else {
                    const match = rawGrade.match(/([0-9]+|K|PK|PRE-K)/i);
                    if (match) gradePart = match[1].toUpperCase() === "PRE-K" ? "PK" : match[1].toUpperCase();
                  }

                  const sectionMatch = rawSection.match(/Section\s+([A-Z0-9]+)/i);
                  const sectionPart = sectionMatch ? sectionMatch[1].toUpperCase() : "X";
                  const subjectPart = rawSubject.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();

                  return `${orgAbbrev}_${gradePart}${sectionPart}${subjectPart}`;
                };

                // Add Defaults
                defaultCombos.forEach(comboStr => {
                   const comboId = generateId(comboStr);
                   displayCombos.push({
                     id: comboId,
                     label: comboStr,
                     subject: comboStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT',
                     orgName: orgName
                   });
                });

                // 2. Add Extras (Assigned Combos)
                const extraIds = link.assigned_combos || [];
                extraIds.forEach((extId: string) => {
                   // Only add if not already in defaults
                   if (!displayCombos.find(c => c.id === extId)) {
                      // Find human readable string
                      const foundStr = allOrgCombos.find(c => generateId(c) === extId);
                      displayCombos.push({
                         id: extId,
                         label: foundStr || extId,
                         subject: foundStr ? foundStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT' : 'EXTRA SUBJECT',
                         orgName: orgName
                      });
                   }
                });
             }
          }
        } catch (e) {
          console.error("Error fetching org profile:", e);
        }
      }

      // Add B2C licenses
      (profile.active_b2c_licenses || []).forEach(comboStr => {
          if (!displayCombos.find(c => c.id === comboStr)) {
             displayCombos.push({
               id: comboStr,
               label: comboStr,
               subject: comboStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT',
               orgName: 'Independent'
             });
          }
      });

      setOrgProfiles(orgData);
      setAllDisplayCombos(displayCombos);
    }
    
    loadOrgs();
  }, [profile]);


  useEffect(() => {
    async function loadTotals() {
      if (allDisplayCombos.length === 0) return;
      try {
        // QUOTA OPTIMIZATION: Read from single aggregation document!
        const docRef = doc(db, 'metadata', 'curriculum_totals');
        const docSnap = await getDoc(docRef);
        const totals = docSnap.exists() ? docSnap.data() as Record<string, number> : {};
        
        setSubjectTotals(totals);
      } catch (e) {
        console.error("Error loading tools:", e);
      }
    }
    loadTotals();
  }, [allDisplayCombos]);

  useEffect(() => {
    if (!profile.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'users', profile.uid, 'progress'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProgressData(data);
    });
  

  return () => unsubscribe();
  }, [profile.uid]);





  const getSubjectColor = (combo: string) => {
     if (combo.includes('math')) return 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100 hover:border-sky-300';
     if (combo.includes('eng')) return 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:border-rose-300';
     if (combo.includes('sci')) return 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300';
     return 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:border-purple-300';
  };


  // Phase 1: On Mount, check if 24 hours have passed and reset hearts via backend
  useEffect(() => {
    async function initHearts() {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken(true);
        const result = await checkAndResetDailyHearts(token, profile.uid);
        if (result.success && result.hearts !== undefined) {
          setHearts(result.hearts);
        }
      } catch (e) {
        console.error("Failed to sync hearts:", e);
      } finally {
        setIsResetting(false);
      }
    }
    initHearts();
  }, [profile.uid]);


  const handleViewLeaderboard = async (toolKey: string, chapterName: string) => {
    setLeaderboardTool({ id: toolKey, name: chapterName });
    setLeaderboardData([]);
    setLoadingLeaderboard(true);
    
    try {
      const q = query(
        collection(db, 'leaderboards', toolKey, 'scores'),
        orderBy('score', 'desc'),
        limit(10)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboardData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleActionClick = (tierId: string) => {
    // If they have a school organization or premium b2c license, they likely don't use hearts for those specific tasks, 
    // but for exploring the global catalog (the 5 tiers), we apply the stamina system unless they are "Pro" (unlimited).
    const isPro = profile.is_pro || (profile.org_ids && profile.org_ids.length > 0) || false;

    
    if (!isPro && hearts <= 0) {
      setShowEnergyModal(true);
      return;
    }
    
    onExploreTier?.(tierId);
  };

  const isPro = profile.is_pro || (profile.org_ids && profile.org_ids.length > 0) || false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in relative">
      
      {/* Student Welcome & Gamified Header */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={14} className="text-yellow-300" /> Student Realm · {profile.grade || 'Foundational'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2">Hello, {profile.full_name}! 👋</h1>
            <p className="text-purple-100 text-base max-w-lg font-medium">
              Ready to explore exciting games, interactive math sandboxes, and language stories today?
            </p>

            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
                <Flame size={20} className="text-amber-400" />
                <div>
                  <div className="text-xs text-purple-200 font-bold uppercase">Learning Streak</div>
                  <div className="font-black text-lg leading-tight">{profile.current_streak_days || 0} Days</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
                <Trophy size={20} className="text-yellow-400" />
                <div>
                  <div className="text-xs text-purple-200 font-bold uppercase">Achievements</div>
                  <div className="font-black text-lg leading-tight">{profile.achievements?.length || 0} Badges</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
                <Star size={20} className="text-sky-400 fill-sky-400" />
                <div>
                  <div className="text-xs text-purple-200 font-bold uppercase">Total XP</div>
                  <div className="font-black text-lg leading-tight">{profile.total_xp || 0} XP</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 3: The Energy System UI */}
          <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-3xl p-5 md:w-64 shrink-0 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Daily Energy</h3>
              {(isPro || (profile.org_ids && profile.org_ids.length > 0)) ? (
                <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 rounded-lg text-[10px] font-black uppercase">Unlimited</span>
              ) : (
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/50 rounded-lg text-[10px] font-black uppercase">{hearts}/5 Remaining</span>
              )}
            </div>
            
            <div className="flex justify-between items-center bg-black/20 rounded-2xl p-3">
              {(isPro || (profile.org_ids && profile.org_ids.length > 0)) ? (
                 <div className="w-full flex items-center justify-center gap-2 py-1 text-yellow-400">
                    <Sparkles size={24} className="animate-pulse" />
                    <span className="font-black tracking-widest">SCHOOL PRO</span>
                 </div>
              ) : (
                [1, 2, 3, 4, 5].map((num) => (
                  <Heart 
                    key={num}
                    size={28}
                    className={`transition-all duration-300 ${num <= hearts ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse' : 'text-white/20 fill-black/20'}`}
                  />
                ))
              )}
            </div>
            
            {!(isPro || (profile.org_ids && profile.org_ids.length > 0)) && (
              <p className="text-[10px] text-center text-white/60 font-bold mt-3">
                Energy resets automatically tomorrow!
              </p>
            )}
          </div>

        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>


      {/* ---------------------------------------------------- */}
      {/* ORG / PARENT ASSIGNED COMBOS & ASSIGNMENTS           */}
      {/* ---------------------------------------------------- */}
      {allDisplayCombos.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 mt-8">
          

          {/* ASSIGNMENTS SECTION */}
          {profile.org_ids && profile.org_ids.length > 0 && (
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
               <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                 <ClipboardList className="text-indigo-500" size={24} /> My Assignments
               </h2>
               
               <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                 {(['pending', 'submitted', 'graded'] as AssignmentStatus[]).map(status => (
                    <button 
                      key={status}
                      onClick={() => setAssignmentFilter(status)}
                      className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${assignmentFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {status}
                    </button>
                 ))}
               </div>
            </div>

            {filteredAssignments.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {filteredAssignments.map((task) => (
                   <div key={task.id} className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                     <div>
                       <div className="flex justify-between items-start mb-3">
                         <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-wider">
                           {task.subject}
                         </span>
                         {task.status === 'graded' && <span className="text-emerald-500 font-black text-lg">{task.score}/{task.totalPoints}</span>}
                       </div>
                       <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{task.title}</h3>
                       {task.instructions && <p className="text-sm text-slate-500 mb-4 font-semibold">{task.instructions}</p>}
                     </div>
                     
                     <div className="mt-auto border-t border-slate-100 pt-4">
                       {task.status === 'pending' && (
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-1.5 text-sm font-bold text-amber-600">
                               <CircleDashed size={16} /> Due: {task.dueDate}
                             </div>
                             {task.externalLink ? (
                               <div className="flex gap-2">
                                 <button 
                                   onClick={() => window.open(task.externalLink, '_blank')}
                                   className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors"
                                 >
                                   Open Link
                                 </button>
                                 <button 
                                   onClick={() => handleMarkAsDone(task.id)}
                                   className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-sm font-bold transition-colors"
                                 >
                                   Mark Done
                                 </button>
                               </div>
                             ) : (
                               <button 
                                 onClick={() => onExploreTier && onExploreTier(`play_tool:${task.link}`)}
                                 className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors"
                               >
                                 Open
                               </button>
                             )}
                          </div>
                       )}

                       {task.status === 'submitted' && (
                          <div className="flex items-center gap-1.5 text-sm font-bold">
                             <CheckCircle2 size={16} className={task.isOnTime ? 'text-emerald-500' : 'text-rose-500'} /> 
                             <span className={task.isOnTime ? 'text-emerald-600' : 'text-rose-600'}>
                               Submitted {task.submittedDate} {task.isOnTime ? '' : '(Late)'}
                             </span>
                          </div>
                       )}

                       {task.status === 'graded' && (
                          <div className="flex items-center gap-1.5 text-sm font-bold">
                             <Award size={16} className="text-emerald-500" /> 
                             <span className="text-emerald-600">Graded • {task.grade || 'Completed'}</span>
                          </div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
               <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                     <ClipboardList size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-1">No {assignmentFilter} assignments</h3>
                  <p className="text-sm font-semibold text-slate-500 max-w-sm">
                    {assignmentFilter === 'pending' ? "You're all caught up! There are no pending tasks right now." : 
                     assignmentFilter === 'submitted' ? "You haven't submitted any assignments yet." : 
                     "No graded assignments to display."}
                  </p>
               </div>
            )}
          </div>
          )}

          {/* COMBOS SECTION */}
          <div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <Book className="text-sky-500" size={24} /> My Subjects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allDisplayCombos.map((comboObj) => {
                 const subjectName = comboObj.subject;
                 const colorClasses = getSubjectColor(comboObj.label.toLowerCase());

                 // Extract grade and subject from combo label
                 const parts = comboObj.label.split('-');
                 const cGrade = parts.length > 0 ? parts[0].trim().toLowerCase() : 'unknown_grade';
                 const cSubj = comboObj.subject.toLowerCase();
                 const cKey = `${cGrade}_${cSubj}`;

                 // Find real progress
                 const subjProgress = progressData.find(p => {
                    if (!p.id) return false;
                    const pId = p.id.toLowerCase();
                    return pId === cKey || pId === cSubj || pId === `all grades_${cSubj}`; // Fallback to All Grades
                 });
                 const completedCount = subjProgress && subjProgress.completed_tools ? Object.keys(subjProgress.completed_tools).length : 0;
                 const xpEarned = subjProgress ? subjProgress.xp : 0;
                 
                 // Calculate real percentage
                 const totalTools = subjectTotals[cKey] || subjectTotals[`all grades_${cSubj}`] || 0;
                 const progressPct = totalTools > 0 ? Math.min(100, Math.round((completedCount / totalTools) * 100)) : 0;

                 return (
                   <div 
                     key={comboObj.id}
                     onClick={() => handleActionClick(`lessons:${comboObj.label}`)}
                     className={`border-2 rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between ${colorClasses}`}
                   >
                     <div className="flex items-center justify-between mb-4">
                       <div><h3 className="text-2xl font-black tracking-tight">{subjectName}</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{comboObj.label}</p></div>
                       <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                         <BookOpen size={24} />
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider opacity-75">
                          <span>{completedCount} / {totalTools} Tools</span>
                          <span>{progressPct}% Completed</span>
                        </div>
                        <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden">
                           <div className="h-full bg-current rounded-full transition-all duration-1000" style={{ width: `${progressPct}%` }}></div>
                        </div>
                     </div>
                   </div>
                 );
              })}
            </div>
          </div>

        </div>
      )}



      {/* 5-Tier Fast Jump Grid */}
      <div className={isResetting ? "opacity-50 pointer-events-none" : ""}>
        <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
          <Play className="text-rose-500" size={24} /> Jump Into Learning
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => handleActionClick('lessons')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer group ${!isPro && hearts <= 0 ? 'bg-slate-50 border-slate-200 opacity-70 grayscale' : 'bg-sky-50 hover:bg-sky-100 border-sky-200 hover:-translate-y-1 hover:shadow-lg text-sky-900'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform ${!isPro && hearts <= 0 ? 'bg-slate-300 text-slate-500' : 'bg-sky-500 text-white group-hover:scale-110'}`}>
              <BookOpen size={24} />
            </div>
            <h3 className="font-black text-lg mb-1">All Lessons</h3>
            <p className="text-xs font-semibold opacity-80">Browse full curriculum flows</p>
          </div>

          <div 
            onClick={() => handleActionClick('conceptualiser')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer group ${!isPro && hearts <= 0 ? 'bg-slate-50 border-slate-200 opacity-70 grayscale' : 'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:-translate-y-1 hover:shadow-lg text-purple-900'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform ${!isPro && hearts <= 0 ? 'bg-slate-300 text-slate-500' : 'bg-purple-500 text-white group-hover:scale-110'}`}>
              <Lightbulb size={24} />
            </div>
            <h3 className="font-black text-lg mb-1">Sandbox</h3>
            <p className="text-xs font-semibold opacity-80">Interactive models & math machines</p>
          </div>

          <div 
            onClick={() => handleActionClick('dojo')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer group ${!isPro && hearts <= 0 ? 'bg-slate-50 border-slate-200 opacity-70 grayscale' : 'bg-orange-50 hover:bg-orange-100 border-orange-200 hover:-translate-y-1 hover:shadow-lg text-orange-900'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform ${!isPro && hearts <= 0 ? 'bg-slate-300 text-slate-500' : 'bg-orange-500 text-white group-hover:scale-110'}`}>
              <Target size={24} />
            </div>
            <h3 className="font-black text-lg mb-1">The Dojo</h3>
            <p className="text-xs font-semibold opacity-80">Test your skills in interactive quizzes</p>
          </div>

          <div 
            onClick={() => handleActionClick('arcade')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer group ${!isPro && hearts <= 0 ? 'bg-slate-50 border-slate-200 opacity-70 grayscale' : 'bg-lime-50 hover:bg-lime-100 border-lime-200 hover:-translate-y-1 hover:shadow-lg text-lime-900'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform ${!isPro && hearts <= 0 ? 'bg-slate-300 text-slate-500' : 'bg-lime-500 text-white group-hover:scale-110'}`}>
              <Gamepad2 size={24} />
            </div>
            <h3 className="font-black text-lg mb-1">Arcade</h3>
            <p className="text-xs font-semibold opacity-80">Learn through gamified challenges</p>
          </div>
        </div>
      </div>

      {/* Out of Energy Modal */}

      



      {leaderboardTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-sky-500 p-6 flex items-center justify-between text-white shrink-0">
               <div>
                 <h3 className="text-xl font-black flex items-center gap-2"><Trophy size={20}/> Leaderboard</h3>
                 <p className="text-sky-100 text-xs font-bold mt-1">{leaderboardTool.name}</p>
               </div>
               <button onClick={() => setLeaderboardTool(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50">
               {loadingLeaderboard ? (
                 <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Loading scores...</div>
               ) : leaderboardData.length === 0 ? (
                 <div className="text-center py-10 text-slate-400 font-bold">No scores yet! Be the first!</div>
               ) : (
                 <div className="space-y-3">
                   {leaderboardData.map((entry, index) => (
                     <div key={entry.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 ${entry.id === profile.uid ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-100'}`}>
                       <div className="flex items-center gap-4">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                           {index + 1}
                         </div>
                         <p className={`font-bold ${entry.id === profile.uid ? 'text-sky-700' : 'text-slate-700'}`}>
                           {entry.id === profile.uid ? 'You' : entry.student_name}
                         </p>
                       </div>
                       <div className="font-black text-lg text-emerald-600">{entry.score}</div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {showEnergyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-slate-50 border-b border-slate-100 p-8 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                 <button onClick={() => setShowEnergyModal(false)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm"><X size={18} /></button>
               </div>
               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                 <BatteryCharging size={36} className="text-slate-400" />
               </div>
               <h2 className="text-2xl font-black text-slate-800 mb-2">Out of Energy!</h2>
               <p className="text-slate-500 font-bold">You've practiced a lot today! You need time to recharge your brain.</p>
            </div>
            <div className="p-8 text-center space-y-4">
               <p className="text-sm font-semibold text-slate-600">
                 Come back tomorrow for more Free Energy, or ask your parents to unlock <span className="font-black text-sky-600">Unlimited Play</span>!
               </p>
               <button 
                 onClick={() => setShowEnergyModal(false)}
                 className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
               >
                 Okay, I'll take a break!
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
