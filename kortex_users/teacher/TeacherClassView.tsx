
"use client";
import React, { useEffect, useState } from 'react';
import { TeacherProfile, TeacherComboData, ClassStudentData } from '../../types/user';
import { getClassroomRoster, resetStudentPinByTeacher } from '../../app/actions/teacher';
import { ArrowLeft, BarChart3, Users, BookOpen, AlertCircle, PlusCircle, PlayCircle, Eye, EyeOff, KeyRound, Check, X, Share2, Sparkles } from 'lucide-react';
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

  // In-School PIN Lookup & Reset states
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [resettingStudent, setResettingStudent] = useState<ClassStudentData | null>(null);
  const [newStudentPin, setNewStudentPin] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const togglePinReveal = (uid: string) => {
    setRevealedPins(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleTeacherResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingStudent) return;
    const clean = newStudentPin.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      alert("PIN must be exactly 6 digits.");
      return;
    }
    setResetSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      const res = await resetStudentPinByTeacher(token, resettingStudent.uid, clean);
      if (!res.success) throw new Error(res.error || "Failed to reset PIN");

      // Update in local state
      setRoster(prev => prev.map(s => s.uid === resettingStudent.uid ? { ...s, pin: clean, plainPin: clean } : s));
      setResetMsg(`PIN successfully updated to ${clean}!`);
      setTimeout(() => {
        setResettingStudent(null);
        setResetMsg('');
        setNewStudentPin('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to reset PIN");
    } finally {
      setResetSubmitting(false);
    }
  };


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
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">PIN</th>
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
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md font-mono">{student.kortexId || 'N/A'}</span>
                           </td>
                           <td className="px-6 py-4">
                              {(student.pin || (student as any).plainPin) ? (
                                 <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md w-fit">
                                   <span>{revealedPins[student.uid] ? (student.pin || (student as any).plainPin) : '••••••'}</span>
                                   <button
                                     type="button"
                                     onClick={() => togglePinReveal(student.uid)}
                                     className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                     title={revealedPins[student.uid] ? "Hide PIN" : "Reveal PIN to student"}
                                   >
                                     {revealedPins[student.uid] ? <EyeOff size={13} /> : <Eye size={13} />}
                                   </button>
                                 </div>
                              ) : (
                                 <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                                   Not Activated
                                 </span>
                              )}
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-600">{student.completedToolsCount} / {student.totalTools} tools</span>
                                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">{student.progressPercentage}%</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setResettingStudent(student); setNewStudentPin(''); setResetMsg(''); }}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Reset Student PIN"
                                >
                                  <KeyRound size={12} /> Reset PIN
                                </button>
                                <button className="text-xs font-bold text-sky-500 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors">
                                   View Report
                                </button>
                              </div>
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

      {/* Teacher Student PIN Reset Modal */}
      {resettingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border-2 border-slate-100 shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-indigo-600 to-sky-600 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <KeyRound size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">Reset Student PIN</h3>
                  <p className="text-xs text-sky-100 font-semibold">{resettingStudent.fullName}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setResettingStudent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleTeacherResetPin} className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Student ID:</span>
                  <span className="font-mono font-black text-slate-800">{resettingStudent.kortexId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Roll No:</span>
                  <span className="font-bold text-slate-800">{resettingStudent.rollNo || '-'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 font-bold">Current PIN:</span>
                  <span className="font-mono font-black text-indigo-600 text-sm">
                    {resettingStudent.pin || (resettingStudent as any).plainPin || 'Not set yet'}
                  </span>
                </div>
              </div>

              {resetMsg ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-sm">
                    <Check size={18} className="text-emerald-600" />
                    <span>{resetMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Namaste! Login details for ${resettingStudent.fullName} have been updated.\nStudent ID: ${resettingStudent.kortexId}\nNew PIN: ${newStudentPin || (resettingStudent.pin || (resettingStudent as any).plainPin)}\nLogin at: https://kortexklassroom.com`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 size={14} /> Send New PIN to Parent via WhatsApp
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      New 6-Digit PIN <span className="text-rose-500 font-black">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={6}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        required
                        value={newStudentPin}
                        onChange={(e) => setNewStudentPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 123456"
                        className="w-full py-3.5 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:bg-white focus:outline-none font-black text-2xl tracking-widest text-center transition-all text-slate-800"
                      />
                    </div>
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => setNewStudentPin('123456')}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={12} /> Set Default (123456)
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setResettingStudent(null)}
                      className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetSubmitting || newStudentPin.length !== 6}
                      className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {resetSubmitting ? "Saving..." : "Update PIN"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
