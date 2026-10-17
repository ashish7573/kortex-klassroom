
"use client";
import React, { useEffect, useState } from 'react';
import { TeacherProfile, TeacherComboData, ClassStudentData } from '../../types/user';
import { getClassroomRoster } from '../../app/actions/teacher';
import { ArrowLeft, BarChart3, Users, BookOpen, AlertCircle, PlusCircle, PlayCircle } from 'lucide-react';
import { auth } from '../../backend_configurations/firebase';
import { fetchTeacherAssignments } from '../../app/actions/teacher_assignments';
import AssignmentBuilderModal from './AssignmentBuilderModal';
import GradeSubmissionsModal from './GradeSubmissionsModal';
import ClassMasteryChart from './ClassMasteryChart';

interface TeacherClassViewProps {
  profile: TeacherProfile;
  combo: TeacherComboData;
  onBack: () => void;
  onExploreTier?: (tierId: string) => void;
}

export default function TeacherClassView({ profile, combo, onBack, onExploreTier }: TeacherClassViewProps) {
  const [roster, setRoster] = useState<ClassStudentData[]>([]);
  const [curriculumTools, setCurriculumTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'roster' | 'assignments'>('roster');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [gradingAssignment, setGradingAssignment] = useState<any>(null);


  useEffect(() => {
    async function loadAssignments() {
      try {
        setLoadingAssignments(true);
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetchTeacherAssignments(token, combo.comboId);
        if (res.success) setAssignments(res.assignments || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAssignments(false);
      }
    }
    if (activeTab === 'assignments') {
       loadAssignments();
    }
  }, [activeTab, combo]);
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) throw new Error("Not authenticated");
        
        const token = await user.getIdToken();
        const res = await getClassroomRoster(token, combo.orgId, combo.comboId, combo.gradeStr, combo.subjectStr, combo.comboLabel);
        
        if (!res.success) throw new Error(res.error);
        setRoster(res.roster || []);
        setCurriculumTools((res as any).curriculumTools || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [combo]);

  const classAverage = roster.length > 0 
    ? Math.round(roster.reduce((acc, curr) => acc + curr.progressPercentage, 0) / roster.length) 
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{combo.subjectStr} Classroom</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{combo.comboLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onExploreTier && onExploreTier('lessons:' + combo.comboLabel)}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 border-2 border-sky-100 font-bold rounded-xl transition-all active:scale-95"
          >
            <PlayCircle size={18} /> Start Learning
          </button>
          <button 
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <PlusCircle size={18} /> Assign Homework
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold animate-pulse">Loading classroom data...</div>
      ) : error ? (
        <div className="py-10 text-center text-rose-500 font-bold bg-rose-50 rounded-2xl border border-rose-200">{error}</div>
      ) : roster.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
           <Users className="mx-auto text-slate-300 mb-4" size={48} />
           <h2 className="text-xl font-black text-slate-700">No Students Enrolled</h2>
           <p className="text-slate-500 mt-2 font-semibold">Your organization administrator has not assigned any students to this classroom yet.</p>
        </div>
      ) : (
        <>

          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-6 print:hidden">
             <button 
                onClick={() => setActiveTab('roster')}
                className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === 'roster' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >Roster & Mastery</button>
             <button 
                onClick={() => setActiveTab('assignments')}
                className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === 'assignments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >Assignments</button>
          </div>

          {activeTab === 'roster' && (
             <div className="space-y-6 animate-fade-in">
               {/* Redesigned Interactive Class Mastery Overview */}
               <ClassMasteryChart 
                 roster={roster} 
                 combo={combo} 
                 initialTools={curriculumTools} 
                 onUpdateRoster={(updatedRoster) => setRoster(updatedRoster)}
               />

          {/* Student Roster Table */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden print:hidden">
             <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                   <Users className="text-sky-500" size={20} /> 
                   Student Roster
                </h2>
                <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500">
                   {roster.length} Students
                </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-100">
                     <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Roll No</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Name</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Curriculum Completed</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {roster.map(student => (
                        <tr key={student.uid} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                              <span className="font-bold text-slate-700 font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-md inline-block">
                                 {student.rollNo ? `#${student.rollNo}` : '-'}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-200">
                                   {student.avatar ? <img src={student.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" /> : (student.fullName || 'S').charAt(0)}
                                 </div>
                                 <span className="font-bold text-slate-800">{student.fullName}</span>
                                 {student.progressPercentage < classAverage - 20 && (
                                    <span title="Falling significantly behind class average" className="text-rose-500"><AlertCircle size={14} /></span>
                                 )}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{student.kortexId || 'N/A'}</span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-600">{student.completedToolsCount} / {student.totalTools} tools</span>
                                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">{student.progressPercentage}%</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="text-xs font-bold text-sky-500 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors">
                                 View Report
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>
             </div>
          )}

          {activeTab === 'assignments' && (
             <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6">
                   <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                      <BookOpen className="text-sky-500" size={20} /> 
                      Dispatched Assignments
                   </h2>
                   {loadingAssignments ? (
                      <div className="py-10 text-center text-slate-400 font-bold animate-pulse">Loading assignments...</div>
                   ) : assignments.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 font-bold">No assignments dispatched yet.</div>
                   ) : (
                      <div className="space-y-4">
                         {assignments.map(a => (
                            <div key={a.id} className="border-2 border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-colors">
                               <div className="flex justify-between items-start mb-2">
                                  <div>
                                     <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md mb-2 inline-block">{a.tool_type === 'unknown' ? 'Task' : a.tool_type}</span>
                                     <h3 className="font-bold text-slate-800 text-lg">{a.title}</h3>
                                  </div>
                                  <div className="text-right">
                                     <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Due: {a.due_date}</div>
                                  </div>
                               </div>
                               <div className="text-xs font-bold text-slate-500 mt-4 flex items-center justify-between">
                                  <span>Assigned to {a.assigned_to?.length || 0} students</span>
                                  <button onClick={() => setGradingAssignment(a)} className="text-sky-500 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors">Grade Submissions</button>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          )}
        </>
      )}
      
      {gradingAssignment && (
        <GradeSubmissionsModal 
          assignment={gradingAssignment} 
          onClose={() => setGradingAssignment(null)} 
          onGraded={() => {}} 
        />
      )}
      
      {showAssignModal && (
        <AssignmentBuilderModal 
          combo={combo} 
          roster={roster} 
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
             setShowAssignModal(false);
             // Could refresh assignments list here
          }}
        />
      )}
    </div>
  );
}
