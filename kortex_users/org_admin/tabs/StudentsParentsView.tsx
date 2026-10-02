"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, or, and } from 'firebase/firestore';
import { db, auth } from '../../../backend_configurations/firebase';
import { OrgAdminProfile, StudentProfile } from '../../../types/user';
import { Users, UserPlus, Link, AlertCircle, CheckCircle2, MoreVertical, RefreshCw, Phone, Pencil, Trash2, Import, BookOpen } from 'lucide-react';
import { GRADES, SECTIONS } from '../../../kortex_landing_page/curriculumConfig';
import { generateComboId } from '../utils/comboParsers';
import { provisionStudentPlaceholder, requestStudentImport, updateStudentDetails, revokeStudentAccess } from '../../../app/actions/student';

export default function StudentsParentsView({ profile }: { profile: OrgAdminProfile }) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [addMode, setAddMode] = useState<'new' | 'import'>('new');
  const [studentForm, setStudentForm] = useState({
    nameOrId: '',
    grade: GRADES[4] || 'Grade 1',
    section: SECTIONS[0],
    assignedCombos: [] as string[],
    emergencyContact: ''
  });
  
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [revokingStudent, setRevokingStudent] = useState<StudentProfile | null>(null);
  const [viewingSubjectsStudent, setViewingSubjectsStudent] = useState<StudentProfile | null>(null);

  // Real-time listener for Students
  useEffect(() => {
    if (!profile.uid) return;
    const q = query(
      collection(db, 'users'),
      and(
        where('role', '==', 'student'),
        where('org_ids', 'array-contains', profile.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as StudentProfile));
      data.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
      setStudents(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error (Students):", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile.uid]);

  const handleGenerateOrImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      if (addMode === 'new') {
        const result = await provisionStudentPlaceholder(idToken, {
          fullName: studentForm.nameOrId,
          grade: studentForm.grade,
          section: studentForm.section,
          assignedCombos: studentForm.assignedCombos,
          emergencyContact: studentForm.emergencyContact
        });
        if (!result.success) throw new Error(result.error);
        alert(`Success! Generated Provision ID: ${result.studentId}. Please share this with the parent.`);
      } else {
        const result = await requestStudentImport(idToken, {
          studentId: studentForm.nameOrId,
          grade: studentForm.grade,
          section: studentForm.section,
          assignedCombos: studentForm.assignedCombos
        });
        if (!result.success) throw new Error(result.error);
        alert(`Transfer Request Sent! The parent must approve it from their app.`);
      }
      
      setShowAddModal(false);
      resetForm();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to process request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSubmitting(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const result = await updateStudentDetails(idToken, editingStudent.uid, {
        grade: studentForm.grade,
        section: studentForm.section,
        assignedCombos: studentForm.assignedCombos,
        emergencyContact: studentForm.emergencyContact
      });
      
      if (!result.success) throw new Error(result.error);
      
      alert("Successfully updated student.");
      setShowEditModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokingStudent) return;
    setIsSubmitting(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const result = await revokeStudentAccess(idToken, revokingStudent.uid);
      if (!result.success) throw new Error(result.error);
      
      alert("Successfully unlinked student from organization.");
      setShowRevokeModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to revoke");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStudentForm({
      nameOrId: '',
      grade: GRADES[4] || 'Grade 1',
      section: SECTIONS[0],
      assignedCombos: [],
      emergencyContact: ''
    });
  };

  const openEdit = (student: StudentProfile) => {
    setEditingStudent(student);
    setStudentForm({
      nameOrId: student.full_name,
      grade: student.org_links?.[profile.uid]?.grade || student.grade,
      section: student.org_links?.[profile.uid]?.section || student.section || SECTIONS[0],
      assignedCombos: student.org_links?.[profile.uid]?.assigned_combos || [],
      emergencyContact: student.emergency_contact || ''
    });
    setShowEditModal(true);
  };

  const toggleCombo = (comboString: string) => {
    const comboId = generateComboId(profile.kortex_id || '', comboString);
    setStudentForm(prev => {
      if (prev.assignedCombos.includes(comboId)) {
        return { ...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId) };
      }
      return { ...prev, assignedCombos: [...prev.assignedCombos, comboId] };
    });
  };

  // Helper functions for Subjects
  const getStudentDefaultCombos = (student: StudentProfile) => {
    const grade = student.org_links?.[profile.uid]?.grade || student.grade;
    const section = student.org_links?.[profile.uid]?.section || student.section;
    const defaultPrefix = `${grade} - Section ${section}`;
    return (profile.approved_grade_subject_combos || []).filter(c => c.startsWith(defaultPrefix));
  };

  const decodeCombo = (comboId: string) => {
    const orgCombos = profile.approved_grade_subject_combos || [];
    const found = orgCombos.find(c => generateComboId(profile.kortex_id || '', c) === comboId);
    if (!found) return comboId;
    const parts = found.split('-');
    return parts.length > 2 ? parts[parts.length - 1].trim() : found;
  };

  // Filter approved combos to only show ones that do NOT belong to the student's default grade & section
  const extraCombos = (profile.approved_grade_subject_combos || []).filter(comboString => {
    const defaultPrefix = `${studentForm.grade} - Section ${studentForm.section}`;
    return !comboString.startsWith(defaultPrefix);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b-2 border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Students & Parents</h2>
          <p className="font-semibold text-slate-400 text-sm mt-1 max-w-2xl">
            Manage your student roster. Link new students to your school or transfer existing Kortex students into your classes.
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <UserPlus size={18} /> Add Student
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Student ID</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Student Name</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Subjects</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Parent Details</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Link Status</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">Loading students...</td></tr>
              ) : students.length > 0 ? students.map(student => {
                const defaultCount = getStudentDefaultCombos(student).length;
                const extraCount = student.org_links?.[profile.uid]?.assigned_combos?.length || 0;
                
                return (
                <tr key={student.uid} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-indigo-600 font-mono text-xs bg-indigo-50 px-2 py-1 rounded-md inline-block">
                      {student.kortex_id || 'PENDING'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{student.full_name}</div>
                    <div className="font-semibold text-slate-400 text-xs">
                      {student.org_links?.[profile.uid]?.grade || student.grade} {(student.org_links?.[profile.uid]?.section || student.section) && `- Sec ${student.org_links?.[profile.uid]?.section || student.section}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => { setViewingSubjectsStudent(student); setShowSubjectsModal(true); }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black transition-colors flex items-center gap-1.5"
                    >
                      <BookOpen size={14} /> 
                      {defaultCount} {extraCount > 0 && <span className="text-indigo-400">+ {extraCount}</span>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      {student.parent_name ? (
                        <span className="font-bold text-slate-700">{student.parent_name}</span>
                      ) : (
                        <div className="flex flex-col gap-1"><span className="font-semibold text-amber-500 italic text-xs">Awaiting Link</span>{student.claim_code && <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md inline-block max-w-max">Code: {student.claim_code}</span>}</div>
                      )}
                      
                      {student.emergency_contact ? (
                        <span className="font-semibold text-slate-500 flex items-center gap-1 text-[11px]">
                          <Phone size={12} className="text-slate-400" /> {student.emergency_contact}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic text-[11px] mt-0.5">No Contact Provided</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {student.org_links?.[profile.uid]?.status === 'pending' ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
                        <RefreshCw size={14} /> Transfer Pending
                      </span>
                    ) : student.org_links?.[profile.uid]?.status === 'approved' ? (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
                        <CheckCircle2 size={14} /> Linked
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
                        <AlertCircle size={14} /> Pending Setup
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEdit(student)}
                        className="p-2 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => { setRevokingStudent(student); setShowRevokeModal(true); }}
                        className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">No students registered yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Import Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
             
             <div className="bg-indigo-600 p-6 flex flex-col gap-4 text-white shrink-0">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/20 rounded-xl">
                     {addMode === 'new' ? <UserPlus size={24} /> : <Import size={24} />}
                   </div>
                   <div>
                     <h3 className="text-xl font-black">{addMode === 'new' ? 'Generate Student ID' : 'Import Existing Student'}</h3>
                     <p className="text-indigo-200 text-xs font-bold">
                       {addMode === 'new' ? 'Creates a brand new Kortex account ID' : 'Transfers an existing Kortex account to your school'}
                     </p>
                   </div>
                 </div>
               </div>
               
               {/* Mode Switcher */}
               <div className="flex bg-indigo-700 p-1 rounded-xl w-full mt-2">
                 <button 
                   onClick={() => setAddMode('new')}
                   className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${addMode === 'new' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:text-white'}`}
                 >
                   Create New
                 </button>
                 <button 
                   onClick={() => setAddMode('import')}
                   className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${addMode === 'import' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:text-white'}`}
                 >
                   Import Existing
                 </button>
               </div>
             </div>
             
             <div className="overflow-y-auto p-6">
               <form id="studentForm" onSubmit={handleGenerateOrImport} className="space-y-6">
                 
                 <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                    <Link size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-indigo-800 leading-relaxed">
                      {addMode === 'new' 
                        ? 'This ID will be used by the parent to link their child\'s account to your school. Standard subjects for the selected Grade & Section are automatically mapped.'
                        : 'Enter the student\'s existing Kortex ID. This will send a transfer request to the parent. Once approved, they will be linked to your school.'
                      }
                    </p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="sm:col-span-2">
                     <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">
                       {addMode === 'new' ? 'Student Full Name' : 'Existing Student ID'}
                     </label>
                     <input 
                       required 
                       type="text" 
                       value={studentForm.nameOrId} 
                       onChange={e => setStudentForm({...studentForm, nameOrId: e.target.value})} 
                       className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500 uppercase" 
                       placeholder={addMode === 'new' ? 'e.g. Aarav Sharma' : 'e.g. STU_XYZ_999'} 
                     />
                   </div>
                   
                   <div>
                     <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Grade</label>
                     <select value={studentForm.grade} onChange={e => setStudentForm({...studentForm, grade: e.target.value, assignedCombos: []})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500">
                       {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                     </select>
                   </div>
                   
                   <div>
                     <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Section</label>
                     <select value={studentForm.section} onChange={e => setStudentForm({...studentForm, section: e.target.value, assignedCombos: []})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500">
                       {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                   </div>

                   {addMode === 'new' && (
                     <div className="sm:col-span-2">
                       <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Emergency Contact Number</label>
                       <input type="text" value={studentForm.emergencyContact} onChange={e => setStudentForm({...studentForm, emergencyContact: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500" placeholder="e.g. +91 98765 43210 (Optional)" />
                     </div>
                   )}
                 </div>

                 {extraCombos.length > 0 && (
                   <div className="pt-2">
                     <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Extra Combinations</label>
                     <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
                       {extraCombos.map((comboString) => {
                         const comboId = generateComboId(profile.kortex_id || '', comboString);
                         const isSelected = studentForm.assignedCombos.includes(comboId);
                         return (
                           <div 
                             key={comboId} 
                             onClick={() => toggleCombo(comboString)}
                             className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                               isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-transparent hover:border-slate-300'
                             }`}
                           >
                             <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-colors ${
                               isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                             }`}>
                               {isSelected && <CheckCircle2 size={14} />}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-bold text-slate-700 text-sm truncate">{comboString}</p>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}
               </form>
             </div>

             <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
               <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
               <button disabled={isSubmitting} form="studentForm" type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black rounded-xl shadow-md transition-all">
                 {isSubmitting ? 'Processing...' : (addMode === 'new' ? 'Generate ID' : 'Send Transfer Request')}
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="bg-indigo-600 p-6 flex items-center gap-4 text-white shrink-0">
               <div className="p-3 bg-white/20 rounded-xl"><Pencil size={24} /></div>
               <div>
                 <h3 className="text-xl font-black">Edit Student</h3>
                 <p className="text-indigo-200 text-xs font-bold">{editingStudent.full_name} ({editingStudent.kortex_id})</p>
               </div>
             </div>
             
             <div className="overflow-y-auto p-6">
               <form id="editForm" onSubmit={handleEditSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Grade</label>
                     <select value={studentForm.grade} onChange={e => setStudentForm({...studentForm, grade: e.target.value, assignedCombos: []})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500">
                       {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                     </select>
                   </div>
                   
                   <div>
                     <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Section</label>
                     <select value={studentForm.section} onChange={e => setStudentForm({...studentForm, section: e.target.value, assignedCombos: []})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500">
                       {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                   </div>

                   <div className="sm:col-span-2">
                     <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Emergency Contact</label>
                     <input type="text" value={studentForm.emergencyContact} onChange={e => setStudentForm({...studentForm, emergencyContact: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500" />
                   </div>
                 </div>

                 {extraCombos.length > 0 && (
                   <div className="pt-2">
                     <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Extra Combinations</label>
                     <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
                       {extraCombos.map((comboString) => {
                         const comboId = generateComboId(profile.kortex_id || '', comboString);
                         const isSelected = studentForm.assignedCombos.includes(comboId);
                         return (
                           <div 
                             key={comboId} 
                             onClick={() => toggleCombo(comboString)}
                             className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                               isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-transparent hover:border-slate-300'
                             }`}
                           >
                             <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-colors ${
                               isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                             }`}>
                               {isSelected && <CheckCircle2 size={14} />}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-bold text-slate-700 text-sm">{comboString}</p>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}
               </form>
             </div>

             <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
               <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
               <button disabled={isSubmitting} form="editForm" type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black rounded-xl shadow-md transition-all">
                 {isSubmitting ? 'Saving...' : 'Save Changes'}
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Revoke Modal */}
      {showRevokeModal && revokingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
             <div className="p-6">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Revoke Student Access?</h3>
                <p className="text-slate-500 font-bold text-sm leading-relaxed mb-4">
                  Are you sure you want to unlink <span className="text-slate-800 font-black">{revokingStudent.full_name}</span> from your organization? 
                </p>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
                  <p className="text-rose-700 text-xs font-bold leading-relaxed">
                    This will not delete their Kortex account, but it will instantly remove them from your roster and free up a seat in your license quota.
                  </p>
                </div>
             </div>

             <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
               <button type="button" onClick={() => setShowRevokeModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
               <button disabled={isSubmitting} onClick={handleRevoke} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-black rounded-xl shadow-md transition-all">
                 {isSubmitting ? 'Revoking...' : 'Revoke Access'}
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Subjects View Modal */}
      {showSubjectsModal && viewingSubjectsStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
             <div className="bg-indigo-600 p-6 flex items-center justify-between text-white shrink-0">
               <div>
                 <h3 className="text-xl font-black">Assigned Subjects</h3>
                 <p className="text-indigo-200 text-xs font-bold">{viewingSubjectsStudent.full_name}</p>
               </div>
               <button onClick={() => setShowSubjectsModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                 <AlertCircle size={20} className="opacity-0 hidden" /> {/* spacer */}
                 <span className="font-black text-lg">✕</span>
               </button>
             </div>
             
             <div className="overflow-y-auto p-6 space-y-6">
               <div>
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Default Class Subjects</h4>
                 <div className="space-y-2">
                   {getStudentDefaultCombos(viewingSubjectsStudent).length > 0 ? (
                     getStudentDefaultCombos(viewingSubjectsStudent).map(comboStr => (
                       <div key={comboStr} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                         <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                         <span className="font-bold text-slate-700 text-sm">{comboStr}</span>
                       </div>
                     ))
                   ) : (
                     <p className="text-sm font-semibold text-slate-400 italic">No default subjects mapped for this class.</p>
                   )}
                 </div>
               </div>

               {viewingSubjectsStudent.org_links?.[profile.uid]?.assigned_combos && viewingSubjectsStudent.org_links?.[profile.uid]?.assigned_combos.length > 0 && (
                 <div>
                   <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Extra Assigned Electives</h4>
                   <div className="space-y-2">
                     {viewingSubjectsStudent.org_links?.[profile.uid]?.assigned_combos.map(comboId => (
                       <div key={comboId} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                         <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                         <span className="font-bold text-indigo-900 text-sm">{decodeCombo(comboId)}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>

             <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
               <button onClick={() => setShowSubjectsModal(false)} className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-black rounded-xl transition-colors">
                 Close
               </button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
