"use client";
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, CheckCircle2, Calendar, Users, BookOpen } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../backend_configurations/firebase';
import { createAssignment } from '../../app/actions/teacher_assignments';
import { ClassStudentData, TeacherComboData } from '../../app/actions/teacher';

interface AssignmentBuilderModalProps {
  combo: TeacherComboData;
  roster: ClassStudentData[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignmentBuilderModal({ combo, roster, onClose, onSuccess }: AssignmentBuilderModalProps) {
  const [step, setStep] = useState(1);
  const [tools, setTools] = useState<any[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  
  // Selections
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(roster.map(r => r.uid)); // Default all
  const [dueDate, setDueDate] = useState<string>('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurriculum() {
      try {
        const snap = await getDocs(collection(db, 'learning_tools'));
        const matched = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((t: any) => 
          (t.grade || '').trim().toLowerCase() === combo.gradeStr.toLowerCase() &&
          (t.subject || '').trim().toLowerCase() === combo.subjectStr.toLowerCase()
        );
        
        // Group by Chapter for UI
        const grouped = matched.reduce((acc: any, tool: any) => {
          const ch = tool.chapter_name || 'General';
          if (!acc[ch]) acc[ch] = [];
          acc[ch].push(tool);
          return acc;
        }, {});
        
        setTools(grouped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTools(false);
      }
    }
    fetchCurriculum();
  }, [combo]);

  const handleToggleStudent = (uid: string) => {
    if (selectedStudents.includes(uid)) {
      setSelectedStudents(selectedStudents.filter(id => id !== uid));
    } else {
      setSelectedStudents([...selectedStudents, uid]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTool || selectedStudents.length === 0 || !dueDate) return;
    try {
      setSubmitting(true);
      setError(null);
      
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      
      const res = await createAssignment(token, {
        orgId: combo.orgId,
        comboId: combo.comboId,
        toolId: selectedTool.id,
        toolType: selectedTool.type || selectedTool.content_type || 'Task',
        chapterName: selectedTool.chapter_name || 'Unknown',
        toolTitle: selectedTool.title || selectedTool.subtopic_name || 'Untitled',
        dueDate: dueDate,
        assignedStudentIds: selectedStudents
      });
      
      if (!res.success) throw new Error(res.error);
      onSuccess();
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 flex items-center justify-between text-white shrink-0">
           <div>
             <h3 className="text-xl font-black">Create Assignment</h3>
             <p className="text-emerald-100 text-xs font-bold mt-1">{combo.comboLabel}</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
             <X size={20} />
           </button>
        </div>
        
        {/* Progress Tracker */}
        <div className="flex bg-slate-50 border-b border-slate-100 shrink-0">
           <div className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider ${step >= 1 ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400'}`}>1. Select Tool</div>
           <div className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider ${step >= 2 ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400'}`}>2. Audience</div>
           <div className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider ${step >= 3 ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400'}`}>3. Deadline</div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
           {error && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl font-bold border border-rose-200">{error}</div>}

           {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                 {loadingTools ? (
                    <div className="py-20 text-center font-bold text-slate-400 animate-pulse">Loading curriculum...</div>
                 ) : Object.keys(tools).length === 0 ? (
                    <div className="py-20 text-center font-bold text-slate-400">No tools found for this curriculum.</div>
                 ) : (
                    Object.keys(tools).map(chapter => (
                       <div key={chapter} className="border-2 border-slate-100 rounded-2xl overflow-hidden">
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-black text-slate-700">{chapter}</div>
                          <div className="divide-y divide-slate-100">
                             {tools[chapter].map((tool: any) => (
                                <div 
                                  key={tool.id} 
                                  onClick={() => setSelectedTool(tool)}
                                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${selectedTool?.id === tool.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                                >
                                   <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTool?.id === tool.id ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                         <BookOpen size={20} />
                                      </div>
                                      <div>
                                         <p className={`font-bold ${selectedTool?.id === tool.id ? 'text-emerald-800' : 'text-slate-700'}`}>{tool.title || tool.subtopic_name}</p>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase">{tool.type || 'Activity'}</p>
                                      </div>
                                   </div>
                                   {selectedTool?.id === tool.id && <CheckCircle2 className="text-emerald-500" />}
                                </div>
                             ))}
                          </div>
                       </div>
                    ))
                 )}
              </div>
           )}

           {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-slate-800">Assign to Students</h4>
                    <button 
                       onClick={() => setSelectedStudents(selectedStudents.length === roster.length ? [] : roster.map(r => r.uid))}
                       className="text-xs font-bold text-sky-500 bg-sky-50 px-3 py-1.5 rounded-lg"
                    >
                       {selectedStudents.length === roster.length ? 'Deselect All' : 'Select All'}
                    </button>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {roster.map(student => (
                       <label key={student.uid} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${selectedStudents.includes(student.uid) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={selectedStudents.includes(student.uid)} 
                            onChange={() => handleToggleStudent(student.uid)} 
                          />
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center ${selectedStudents.includes(student.uid) ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                             {selectedStudents.includes(student.uid) && <CheckCircle2 size={14} />}
                          </div>
                          <span className="font-bold text-slate-700">{student.fullName}</span>
                       </label>
                    ))}
                 </div>
              </div>
           )}

           {step === 3 && (
              <div className="space-y-6 animate-fade-in max-w-md mx-auto py-10">
                 <div className="text-center mb-8">
                    <Calendar className="mx-auto text-emerald-500 mb-4" size={48} />
                    <h4 className="font-black text-slate-800 text-xl">Set a Deadline</h4>
                    <p className="text-sm font-semibold text-slate-500 mt-2">When should the students complete this task?</p>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Due Date</label>
                    <input 
                      type="date" 
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                 </div>
              </div>
           )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between shrink-0">
           {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-200 bg-slate-200/50 rounded-xl transition-colors">
                Back
              </button>
           ) : <div />}
           
           {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1)} 
                disabled={step === 1 && !selectedTool}
                className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
              >
                Next <ChevronRight size={18} />
              </button>
           ) : (
              <button 
                onClick={handleSubmit} 
                disabled={submitting || !dueDate || selectedStudents.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all active:scale-95"
              >
                {submitting ? 'Assigning...' : 'Dispatch Assignment'} <CheckCircle2 size={18} />
              </button>
           )}
        </div>
      </div>
    </div>
  );
}
