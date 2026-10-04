"use client";
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, CircleDashed, Award } from 'lucide-react';
import { getAssignmentSubmissions, gradeSubmission } from '../../app/actions/teacher_assignments';
import { auth } from '../../backend_configurations/firebase';

interface GradeSubmissionsModalProps {
  assignment: any;
  onClose: () => void;
  onGraded: () => void;
}

export default function GradeSubmissionsModal({ assignment, onClose, onGraded }: GradeSubmissionsModalProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingState, setGradingState] = useState<Record<string, number | string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
       try {
          const user = auth.currentUser;
          if (!user) return;
          const token = await user.getIdToken();
          const res = await getAssignmentSubmissions(token, assignment.id);
          if (res.success) {
             setSubmissions(res.submissions);
          } else {
             alert(res.error);
          }
       } catch (e) {
          console.error(e);
       } finally {
          setLoading(false);
       }
    }
    loadData();
  }, [assignment.id]);

  const handleGrade = async (studentUid: string) => {
     const scoreStr = gradingState[studentUid];
     if (scoreStr === undefined || scoreStr === '') return alert("Enter a score");
     const score = Number(scoreStr);
     if (isNaN(score) || score < 0 || score > 100) return alert("Score must be between 0 and 100");

     try {
        setSavingId(studentUid);
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await gradeSubmission(token, studentUid, assignment.id, score);
        if (res.success) {
           setSubmissions(prev => prev.map(s => s.studentUid === studentUid ? { ...s, status: 'graded', score } : s));
           onGraded(); // Refresh parent if needed
        } else {
           alert(res.error);
        }
     } catch (e: any) {
        alert(e.message);
     } finally {
        setSavingId(null);
     }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-start">
           <div>
              <span className="bg-indigo-500/50 text-indigo-100 text-xs font-black px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">Grading</span>
              <h2 className="text-2xl font-black">{assignment.title}</h2>
              <p className="text-indigo-200 font-medium mt-1">Due: {assignment.due_date}</p>
           </div>
           <button onClick={onClose} className="p-2 bg-indigo-500/50 hover:bg-indigo-500 rounded-full transition-colors text-white">
              <X size={20} />
           </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
           {loading ? (
              <div className="flex justify-center items-center py-20">
                 <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
           ) : submissions.length === 0 ? (
              <div className="text-center py-20 text-slate-500 font-bold">No students assigned to this task.</div>
           ) : (
              <div className="space-y-4">
                 {submissions.map((sub) => (
                    <div key={sub.studentUid} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                       
                       <div>
                          <p className="font-bold text-slate-800 text-lg">{sub.studentName}</p>
                          <div className="flex items-center gap-2 mt-1">
                             {sub.status === 'pending' && <span className="flex items-center gap-1 text-sm font-bold text-amber-500"><CircleDashed size={14}/> Pending</span>}
                             {sub.status === 'submitted' && <span className="flex items-center gap-1 text-sm font-bold text-sky-500"><CheckCircle2 size={14}/> Submitted</span>}
                             {sub.status === 'graded' && <span className="flex items-center gap-1 text-sm font-bold text-emerald-500"><Award size={14}/> Graded: {sub.score}/100</span>}
                             
                             {sub.submittedAt && <span className="text-xs text-slate-400 font-semibold border-l border-slate-200 pl-2 ml-1">On: {new Date(sub.submittedAt).toLocaleDateString()}</span>}
                          </div>
                       </div>

                       <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <input 
                             type="number" 
                             min="0" max="100"
                             disabled={savingId === sub.studentUid}
                             placeholder={sub.score !== null ? String(sub.score) : "Score"}
                             value={gradingState[sub.studentUid] !== undefined ? gradingState[sub.studentUid] : ''}
                             onChange={(e) => setGradingState(prev => ({ ...prev, [sub.studentUid]: e.target.value }))}
                             className="w-20 text-center font-bold text-slate-800 border-2 border-slate-200 rounded-lg py-2 outline-none focus:border-indigo-500 disabled:opacity-50"
                          />
                          <span className="text-slate-400 font-bold">/ 100</span>
                          
                          <button 
                             onClick={() => handleGrade(sub.studentUid)}
                             disabled={savingId === sub.studentUid || (gradingState[sub.studentUid] === undefined && sub.status === 'pending')}
                             className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors ml-2 flex items-center justify-center min-w-[80px]"
                          >
                             {savingId === sub.studentUid ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                             ) : sub.status === 'graded' ? 'Update' : 'Grade'}
                          </button>
                       </div>

                    </div>
                 ))}
              </div>
           )}
        </div>

      </div>
    </div>
  );
}
