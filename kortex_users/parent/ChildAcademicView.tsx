"use client";
import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../../types/user';
import { auth, db } from '../../backend_configurations/firebase';
import { collection, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { useStudentAssignments } from '../../hooks/useStudentAssignments';
import { getStudentAcademicDetails, getChildProgressAndTotals } from '../../app/actions/student';
import { Building, AlertCircle, Sparkles, TrendingUp, Clock, CheckCircle2, FileText, BarChart2, Lock, X, ClipboardList, CircleDashed, Award } from 'lucide-react';

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

  useEffect(() => {
    async function loadProgressAndTotals() {
      if (!child.uid) return;
      try {
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();
        const result = await getChildProgressAndTotals(idToken, child.uid);
        if (result.success) {
           setProgressData(result.progressData || []);
           setSubjectTotals(result.subjectTotals || {});
        }
      } catch (e) {
        console.error("Error loading child progress:", e);
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
  
  // Mocked subjects that the child played in the free tier
  const b2cSubjects = [
    { name: "Coding Fundamentals", comboId: "grade3_coding" },
    { name: "Mathematics", comboId: "grade3_math" },
    { name: "Language Arts", comboId: "grade3_english" }
  ];

  const independentPerformance: SubjectPerformance[] = b2cSubjects.map((sub) => {
    const isLocked = !isPro && !b2cLicenses.includes(sub.comboId);
    
    // Find real progress
    const parts = sub.name.split('-');
    const cGrade = parts.length > 0 ? parts[0].trim().toLowerCase() : 'unknown_grade';
    const cSubj = parts[parts.length - 1].trim().toLowerCase();
    const cKey = `${cGrade}_${cSubj}`;
    
    const subjProgress = progressData.find(p => {
        if (!p.id) return false;
        return p.id.toLowerCase() === cKey || p.id.toLowerCase() === cSubj;
    });
    
    let childScore = 0;
    const completedCount = subjProgress && subjProgress.completed_tools ? Object.keys(subjProgress.completed_tools).length : 0;
    const totalTools = subjectTotals[cKey] || 0;
    if (totalTools > 0) {
       childScore = Math.min(100, Math.round((completedCount / totalTools) * 100));
    }

    return {
      subjectName: parts[parts.length - 1].trim(),
      comboLabel: sub.name,
      childScore: childScore,
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


      {/* Organizations Map */}
      {orgAcademics.map((orgData, index) => {
        const subjects = orgData.subjects;
        
        

        const realPerformance: SubjectPerformance[] = subjects.map((sub) => {
          // Find real progress
          const cKey = `${orgData.grade}_${sub.subjectName}`.toLowerCase();
          const subjProgress = progressData.find(p => {
             if (!p.id) return false;
             return p.id.toLowerCase() === cKey || p.id.toLowerCase() === sub.subjectName.toLowerCase();
          });
          
          let childScore = 0;
          const completedCount = subjProgress && subjProgress.completed_tools ? Object.keys(subjProgress.completed_tools).length : 0;
          const totalTools = subjectTotals[cKey] || 0;
          if (totalTools > 0) {
             childScore = Math.min(100, Math.round((completedCount / totalTools) * 100));
          }

          return {
            subjectName: sub.subjectName,
            comboLabel: sub.comboString,
            childScore: childScore,
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

          <PerformanceBlock 
            title="Independent Progress" 
            icon={<TrendingUp size={24} className="text-purple-600" />} 
            performanceData={independentPerformance}
            onUnlockClick={() => setShowUpsellModal(true)}
          />
      </div>

      {/* The Upsell Modal */}
      {showUpsellModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
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
                   alert("Redirecting to Stripe checkout...");
                   setShowUpsellModal(false);
                 }}
                 className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-lg"
               >
                 Upgrade Now for ₹199/mo
               </button>
            </div>
          </div>
        </div>
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
