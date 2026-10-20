"use client";
import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../../types/user';
import { auth, db } from '../../backend_configurations/firebase';
import { collection, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { useStudentAssignments } from '../../hooks/useStudentAssignments';
import { getStudentAcademicDetails, getChildProgressAndTotals, getStudentDailyActivity } from '../../app/actions/student';
import { getSubjectProgressSummary } from '../../kortex_landing_page/curriculumConfig';
import { Building, AlertCircle, Sparkles, TrendingUp, Clock, CheckCircle2, FileText, BarChart2, Lock, X, ClipboardList, CircleDashed, Award } from 'lucide-react';
import ModalPortal from '../../components/ModalPortal';

interface ChildAcademicViewProps {
  child: StudentProfile;
}

interface SubjectDetail {
  subjectName: string;
  isExtra: boolean;
  teacherName: string;
  comboString: string;
}

interface TaskItem {
  id: string;
  title: string;
  subject: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  score?: number;
}

interface SubjectPerformance {
  subjectName: string;
  childScore: number;
  classAvg: number;
  baseline: number;
  isLocked?: boolean;
}

interface OrgAcademicData {
  orgId: string;
  orgName: string;
  grade: string;
  section?: string;
  subjects: SubjectDetail[];
}

export default function ChildAcademicView({ child }: ChildAcademicViewProps) {
  const [orgAcademics, setOrgAcademics] = useState<OrgAcademicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  type AssignmentStatus = 'pending' | 'submitted' | 'graded';
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatus>('pending');
  const { assignments, loading: loadingAssignments } = useStudentAssignments(child.uid);
  const filteredAssignments = assignments.filter((a: any) => a.status === assignmentFilter);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [subjectTotals, setSubjectTotals] = useState<Record<string, number>>({});
  const [dailyHistory, setDailyHistory] = useState<any[]>([]);
  const [dailyTotals, setDailyTotals] = useState<{ totalMinutes: number; totalLessons: number; totalStars: number } | null>(null);

  useEffect(() => {
    async function loadProgressAndTotals() {
      if (!child.uid) return;
      try {
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();
        const [progResult, actResult] = await Promise.all([
          getChildProgressAndTotals(idToken, child.uid),
          getStudentDailyActivity(idToken, child.uid, 7)
        ]);

        if (progResult.success) {
           setProgressData(progResult.progressData || []);
           setSubjectTotals(progResult.subjectTotals || {});
        }
        if (actResult.success && actResult.history) {
           setDailyHistory(actResult.history);
           setDailyTotals(actResult.totals || null);
        }
      } catch (e) {
        console.error("Error loading child progress and activity:", e);
      }
    }
    loadProgressAndTotals();
  }, [child.uid]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        const user = auth.currentUser;
        if (!user) throw new Error("Authentication required");
        const idToken = await user.getIdToken();
        
        const result = await getStudentAcademicDetails(idToken, child.uid);
        
        if (!result.success) throw new Error(result.error);
        
        setOrgAcademics(result.orgAcademics || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load academic details.");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [child.uid]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-bold animate-pulse">
        Loading academic profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 text-rose-600 rounded-3xl border-2 border-rose-100 flex items-center gap-3">
        <AlertCircle size={24} />
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  const b2cLicenses = child.active_b2c_licenses || [];
  const isPro = child.is_pro || false;

  // Extract recent activities from progressData
  const recentActivities: any[] = [];
  progressData.forEach((subjProgress) => {
    const tools = subjProgress.completed_tools || {};
    Object.keys(tools).forEach((toolKey) => {
      const tool = tools[toolKey];
      if (tool.last_played_at) {
        let toolType = 'Learning Activity';
        if (toolKey.includes('conceptualiser') || toolKey.includes('sandbox')) toolType = 'Interactive Sandbox';
        else if (toolKey.includes('dojo') || toolKey.includes('quiz')) toolType = 'Dojo Quiz';
        else if (toolKey.includes('arcade') || toolKey.includes('game')) toolType = 'Arcade Game';
        else if (toolKey.includes('lesson')) toolType = 'Lesson Flow';

        const rawSubj = subjProgress.id || 'General';
        const parts = rawSubj.split('_');
        const displaySubject = parts.length > 1 ? parts.slice(1).join(' ') : rawSubj;

        recentActivities.push({
          toolKey,
          chapterName: tool.chapter_name || 'Chapter',
          subject: displaySubject,
          toolType,
          lastPlayedAt: new Date(tool.last_played_at),
          timesCompleted: tool.times_completed
        });
      }
    });
  });

  // Sort by most recent
  recentActivities.sort((a, b) => b.lastPlayedAt.getTime() - a.lastPlayedAt.getTime());

  // Filter for 'today' (in local time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayActivities = recentActivities.filter(a => a.lastPlayedAt >= today).slice(0, 5);

  // Dynamically resolve real independent learning subjects
  const realB2cSubjects = React.useMemo(() => {
    const list: { name: string; comboId: string; subject: string }[] = [];
    
    // Add purchased courses
    b2cLicenses.forEach((comboStr: string) => {
      const parts = comboStr.split('-');
      const subj = parts.length > 1 ? parts[parts.length - 1].trim() : comboStr;
      list.push({
        name: comboStr,
        comboId: comboStr,
        subject: subj
      });
    });

    // Add foundational & core tracks if not already present
    const defaultTracks = [
      { name: `${child.grade || 'All Grades'} - Hindi`, comboId: 'hindi', subject: 'Hindi' },
      { name: `${child.grade || 'All Grades'} - Maths`, comboId: 'maths', subject: 'Maths' },
      { name: `${child.grade || 'All Grades'} - English`, comboId: 'english', subject: 'English' },
    ];

    defaultTracks.forEach(track => {
      if (!list.some(item => item.subject.toLowerCase() === track.subject.toLowerCase())) {
        list.push(track);
      }
    });

    return list;
  }, [b2cLicenses, child.grade]);

  const independentPerformance: SubjectPerformance[] = realB2cSubjects.map((sub) => {
    const isLocked = !isPro && b2cLicenses.length > 0 && !b2cLicenses.includes(sub.comboId);
    const { progressPct } = getSubjectProgressSummary(
      progressData,
      subjectTotals,
      child.grade || 'All Grades',
      sub.subject
    );

    return {
      subjectName: sub.subject,
      comboLabel: sub.name,
      childScore: progressPct,
      classAvg: 0,
      baseline: 60,
      isLocked
    };
  });

  return (
    <div className="space-y-12 animate-fade-in relative">
      

      {/* -------------------------------------------------------------------------- */}
      {/* UNIFIED ASSIGNMENTS SECTION                                                */}
      {/* -------------------------------------------------------------------------- */}
      {child.org_ids && child.org_ids.length > 0 && (
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
             <ClipboardList className="text-indigo-500" size={24} /> Child's Assignments
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

        {loadingAssignments ? (
           <div className="flex justify-center items-center py-10">
             <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : filteredAssignments.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredAssignments.map((task: any) => (
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
                {assignmentFilter === 'pending' ? "The student is all caught up! There are no pending tasks right now." : 
                 assignmentFilter === 'submitted' ? "No submitted assignments available." : 
                 "No graded assignments to display."}
              </p>
           </div>
        )}
      </div>
      )}




      {/* Organizations Map */}
      {orgAcademics.map((orgData, index) => {
        const subjects = orgData.subjects;
        
        

        const realPerformance: SubjectPerformance[] = subjects.map((sub) => {
          const { progressPct } = getSubjectProgressSummary(
            progressData,
            subjectTotals,
            orgData.grade,
            sub.subjectName
          );

          return {
            subjectName: sub.subjectName,
            comboLabel: sub.comboString,
            childScore: progressPct,
            classAvg: 0,
            baseline: 60,
            isLocked: false
          };
        });

        return (
          <div key={orgData.orgId} className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Building size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">{orgData.orgName}</h2>
                <div className="text-sm font-bold text-slate-500">
                  {orgData.grade} {orgData.section && `• Sec ${orgData.section}`}
                </div>
              </div>
            </div>

            {/* Performance Benchmarking */}
            <PerformanceBlock 
              title="Academic Performance" 
              icon={<BarChart2 size={24} className="text-emerald-600" />} 
              performanceData={realPerformance}
              onUnlockClick={() => setShowUpsellModal(true)}
            />

          </div>
        );
      })}

      {/* Independent Learning & Free Tier Block */}
      <div className="space-y-6 mt-12 pt-12 border-t-4 border-slate-100 border-dashed">
         <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Independent Learning</h2>
              <div className="text-sm font-bold text-slate-500">Free Tier & Kortex Pro</div>
            </div>
          </div>

              {/* Screen Time Section */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6 sm:p-8 relative overflow-hidden">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                   <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <Clock className="text-sky-500" size={24} /> Screen Time (Past 7 Days • IST)
                   </h3>
                   {dailyTotals && isPro && (
                     <div className="flex items-center gap-3 text-xs font-black">
                       <span className="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-xl border border-sky-100">
                         ⏱️ {dailyTotals.totalMinutes} mins total
                       </span>
                       <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                         📚 {dailyTotals.totalLessons} lessons
                       </span>
                     </div>
                   )}
                 </div>

                 <div className={!isPro ? "blur-sm opacity-50 select-none grayscale" : ""}>
                    <div className="flex items-end gap-3 sm:gap-6 h-36 mb-4 px-2">
                       {dailyHistory.length > 0 ? (
                         dailyHistory.map((day, idx) => {
                           const maxMins = Math.max(...dailyHistory.map(d => d.active_minutes), 30);
                           const heightPct = Math.min(100, Math.round((day.active_minutes / maxMins) * 100));
                           const isToday = idx === dailyHistory.length - 1;

                           return (
                             <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                               <div className="text-[10px] font-bold text-slate-400 group-hover:text-sky-600 transition-colors">
                                 {day.active_minutes}m
                               </div>
                               <div className="w-full bg-slate-100 rounded-t-xl h-24 flex items-end justify-center overflow-hidden p-0.5">
                                 <div 
                                   className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-sky-500 shadow-sm' : 'bg-sky-300 group-hover:bg-sky-400'}`}
                                   style={{ height: `${Math.max(heightPct, 6)}%` }}
                                 />
                               </div>
                               <span className={`text-xs ${isToday ? 'font-black text-sky-600' : 'font-bold text-slate-500'}`}>
                                 {day.dayName}
                               </span>
                             </div>
                           );
                         })
                       ) : (
                         ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => (
                           <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                             <div className="text-[10px] font-bold text-slate-300">0m</div>
                             <div className="w-full bg-slate-100 rounded-t-xl h-24 flex items-end justify-center p-0.5">
                               <div className="w-full bg-sky-200 rounded-t-lg h-[8%]" />
                             </div>
                             <span className="text-xs font-bold text-slate-400">{dayName}</span>
                           </div>
                         ))
                       )}
                    </div>
                    <div className="text-center text-xs font-semibold text-slate-400 pt-2 border-t border-slate-100">
                      Calculated automatically in Indian Standard Time (Asia/Kolkata)
                    </div>
                 </div>

                 {!isPro && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px]">
                       <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-5 rounded-2xl flex flex-col items-center shadow-xl text-center max-w-sm mx-4">
                          <Lock size={28} className="text-amber-400 mb-2" />
                          <h4 className="font-black text-lg mb-1">Screen Time Analytics</h4>
                          <p className="text-xs font-medium text-slate-300 mb-4 leading-relaxed">
                            Upgrade to Kortex Pro to unlock minute-by-minute screen time, activity histories, and weekly academic reporting.
                          </p>
                          <button 
                            onClick={() => setShowUpsellModal(true)}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            Unlock Kortex Pro
                          </button>
                       </div>
                    </div>
                 )}
              </div>

              {/* Today's Learning Activity */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6 sm:p-8">
                 <h3 className="text-xl font-black text-slate-800 mb-4">Today your child learnt...</h3>
                 {todayActivities.length > 0 ? (
                   <ul className="space-y-3 mb-6">
                      {todayActivities.map((act, i) => (
                        <li key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center"><Sparkles size={16}/></div>
                           <div>
                              <p className="font-bold text-slate-800">{act.toolType}: {act.chapterName}</p>
                              <p className="text-xs text-slate-500 font-semibold uppercase">{act.subject}</p>
                           </div>
                        </li>
                      ))}
                   </ul>
                 ) : (
                   <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                      <p className="text-slate-500 font-bold">No learning activities recorded yet today.</p>
                   </div>
                 )}
                 
                 {!isPro && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 text-center flex flex-col items-center">
                       <h4 className="text-lg font-black text-indigo-900 mb-2">Track your child&apos;s progress</h4>
                       <p className="text-sm font-semibold text-indigo-700 mb-4 max-w-md">Unlock Kortex Pro to get detailed analytics and track daily learning progress.</p>
                       <button 
                         onClick={() => setShowUpsellModal(true)}
                         className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                       >
                         Unlock Kortex Pro
                       </button>
                    </div>
                 )}
              </div>

          <PerformanceBlock 
            title="Independent Progress" 
            icon={<TrendingUp size={24} className="text-purple-600" />} 
            performanceData={independentPerformance}
            onUnlockClick={() => setShowUpsellModal(true)}
          />
      </div>

      {/* The Upsell Modal */}
      {showUpsellModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in-up">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4">
                   <button onClick={() => setShowUpsellModal(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 shadow-sm transition-colors"><X size={18} /></button>
                 </div>
                 <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30 shadow-sm backdrop-blur-md">
                   <Sparkles size={36} className="text-white" />
                 </div>
                 <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Unlock Kortex Pro</h2>
                 <p className="text-indigo-100 font-bold text-lg">Give {child.full_name} the ultimate learning advantage.</p>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                       <p className="font-bold text-slate-700">Unlimited Daily Energy (Hearts)</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                       <p className="font-bold text-slate-700">Access the entire curriculum library</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                       <p className="font-bold text-slate-700">Unlock detailed performance analytics</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => {
                     alert("Coming soon!");
                     setShowUpsellModal(false);
                   }}
                   className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-lg"
                 >
                   Upgrade Now for ₹199/mo
                 </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

// Reusable Performance Block Component to handle the Paywall Blur
function PerformanceBlock({ title, icon, performanceData, onUnlockClick }: any) {
  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            {icon} {title}
          </h3>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-4 py-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Your Child</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-sky-400 rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Class Average</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {performanceData.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <TrendingUp size={48} className="text-slate-200 mb-4" />
            <h3 className="text-lg font-black text-slate-400">No Data Available</h3>
            <p className="text-slate-400 font-semibold text-sm max-w-sm mt-2">There is not enough graded data to generate performance benchmarks yet.</p>
          </div>
        ) : (
          performanceData.map((perf: any, idx: number) => (
            <div key={idx} className="flex flex-col sm:flex-row items-center gap-6 relative">
              
              {/* Subject Info */}
              <div className="w-full sm:w-48 shrink-0 flex items-center justify-between sm:block">
                <div>
                   <h4 className="font-black text-slate-800">{perf.subjectName}</h4>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{perf.comboLabel}</p>
                </div>
                <div className="font-bold text-emerald-600 text-lg sm:mt-1">
                   {perf.isLocked ? "--" : `${perf.childScore}%`}
                </div>
              </div>

              {/* Bullet Graph (Locked or Unlocked) */}
              <div 
                className={`flex-1 w-full relative transition-all ${perf.isLocked ? 'blur-sm cursor-pointer grayscale opacity-50 select-none' : ''}`}
                onClick={() => perf.isLocked && onUnlockClick()}
              >
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 px-1">
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>

                <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${perf.isLocked ? 0 : perf.childScore}%` }}
                  />
                  <div 
                    className="absolute top-0 h-full w-1.5 bg-sky-400 z-10 rounded-full shadow-sm"
                    style={{ left: `calc(${perf.isLocked ? 0 : perf.classAvg}% - 3px)` }}
                  />
                </div>
                
                <div className="mt-3 text-xs font-semibold text-slate-500">
                  {perf.isLocked ? (
                     <span className="text-slate-400 font-bold">Unlock to view detailed benchmarks.</span>
                  ) : perf.childScore >= perf.classAvg ? (
                    <span><span className="text-emerald-600 font-bold">Ahead of class</span> by {perf.childScore - perf.classAvg}%. </span>
                  ) : (
                    <span><span className="text-amber-600 font-bold">Behind class</span> by {perf.classAvg - perf.childScore}%. </span>
                  )}
                </div>
              </div>

              {/* Paywall Overlay */}
              {perf.isLocked && (
                <div 
                  className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                  onClick={onUnlockClick}
                >
                  <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl hover:scale-105 transition-transform">
                     <Lock size={16} className="text-amber-400" />
                     <span className="font-bold text-sm">Unlock Insights</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
