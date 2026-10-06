"use client";
import React, { useState, useEffect } from 'react';
import { OrgAdminProfile, TeacherProfile } from '../../../types/user';
import { GraduationCap, UserPlus, Copy, CheckCircle2, X, Pencil, Trash2, AlertTriangle, KeyRound } from 'lucide-react';
import { generateComboId, getOrgAbbreviation } from '../utils/comboParsers';
import { provisionTeacherAccount, updateTeacherAccount, deleteTeacherAccount, generateTeacherPasswordLink } from '../../../app/actions/teacher';
import { auth, db } from '../../../backend_configurations/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function TeachersView({ profile }: { profile: OrgAdminProfile }) {
  // State: Listing & Fetching
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State: Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    customSuffix: '',
    assignedCombos: [] as string[]
  });
  const [successData, setSuccessData] = useState<{ teacherId: string, email: string, passwordLink: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // State: Edit Modal
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [editData, setEditData] = useState({ name: '', assignedCombos: [] as string[] });

  // State: Delete Modal
  const [deletingTeacher, setDeletingTeacher] = useState<TeacherProfile | null>(null);
  
  const orgAbbrev = getOrgAbbreviation(profile.kortex_id);
  const orgCombos = profile.approved_grade_subject_combos || [];

  // Helper: Map of comboId -> { name, kortexId } to grey out already assigned combos
  const assignedComboMap = new Map<string, { name: string, kortexId: string }>();
  teachers.forEach(t => {
    if (t.assigned_combos) {
      t.assigned_combos.forEach(cid => {
        assignedComboMap.set(cid, { name: t.full_name, kortexId: t.kortex_id });
      });
    }
  });

  // Helper: map a Combo ID back to its friendly name based on org's approved combos
  const getComboLabel = (comboId: string) => {
    const match = orgCombos.find(c => generateComboId(profile.kortex_id, c) === comboId);
    return match || comboId;
  };

  // Live Sync with Firestore
  useEffect(() => {
    if (!profile.uid) return;
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'teacher'),
      where('org_id', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: TeacherProfile[] = [];
      snapshot.forEach((doc) => {
        fetched.push(doc.data() as TeacherProfile);
      });
      // Sort alphabetically by ID or Name
      fetched.sort((a, b) => a.kortex_id.localeCompare(b.kortex_id));
      setTeachers(fetched);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile.uid]);

  const handleGenerateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newTeacher.assignedCombos.length === 0) {
      setErrorMsg("Please assign at least one Subject Combination.");
      return;
    }

    if (!newTeacher.customSuffix.trim() || newTeacher.customSuffix.includes(" ")) {
      setErrorMsg("Custom ID suffix cannot be empty or contain spaces.");
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication failed. Please relogin.");

      const fullTeacherId = `${orgAbbrev}_${newTeacher.customSuffix.trim().toUpperCase()}`;

      const result = await provisionTeacherAccount(idToken, {
        teacherId: fullTeacherId,
        fullName: newTeacher.name,
        email: newTeacher.email,
        assignedCombos: newTeacher.assignedCombos
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccessData({
        teacherId: result.kortexId!,
        email: result.email!,
        passwordLink: result.passwordLink!
      });
      
      setNewTeacher({ name: '', email: '', customSuffix: '', assignedCombos: [] });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to provision teacher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setErrorMsg('');

    if (editData.assignedCombos.length === 0) {
      setErrorMsg("Teacher must have at least one Subject Combination.");
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication failed. Please relogin.");

      const result = await updateTeacherAccount(idToken, editingTeacher.uid, {
        fullName: editData.name,
        assignedCombos: editData.assignedCombos
      });

      if (!result.success) throw new Error(result.error);

      setEditingTeacher(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update teacher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingTeacher) return;
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication failed. Please relogin.");

      const result = await deleteTeacherAccount(idToken, deletingTeacher.uid);
      if (!result.success) throw new Error(result.error);
      
      setDeletingTeacher(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete teacher.");
      setIsSubmitting(false); // Only toggle false on error so they can read it, or unmount auto handles it
    }
  };

  
  const handleResendWelcome = async (teacher: TeacherProfile) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await generateTeacherPasswordLink(token, teacher.email);
      if (res.success) {
        const emailTemplate = `Subject: Welcome to Kortex Klassroom - Your Teacher Account\n\nHi ${teacher.full_name},\n\nWelcome to Kortex Klassroom! Your teacher account for ${profile.organization_name} is ready.\n\nHere are your official login details:\nTeacher ID: ${teacher.kortex_id}\nLogin Email: ${teacher.email}\n\nPlease click the secure link below to set your permanent password and access your dashboard:\n${res.link}\n\nBest regards,\n${profile.full_name}\n${profile.organization_name}`;
        await navigator.clipboard.writeText(emailTemplate);
        alert('Welcome message and password link copied to clipboard!');
      } else {
        alert('Error generating link: ' + res.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleCopyCredentials = () => {
    if (!successData) return;
    const emailTemplate = `Subject: Welcome to Kortex Klassroom - Your Teacher Account\n\nHi there,\n\nWelcome to Kortex Klassroom! Your teacher account for ${profile.organization_name} has been successfully provisioned.\n\nHere are your official login details:\nTeacher ID: ${successData.teacherId}\nLogin Email: ${successData.email}\n\nPlease click the secure link below to set your permanent password and access your dashboard:\n${successData.passwordLink}\n\nIf you have any questions, simply reply to this email.\n\nBest regards,\n${profile.full_name}\n${profile.organization_name}`;
    navigator.clipboard.writeText(emailTemplate);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setSuccessData(null);
    setEditingTeacher(null);
    setDeletingTeacher(null);
    setErrorMsg('');
  };

  const openEditModal = (t: TeacherProfile) => {
    setEditingTeacher(t);
    setEditData({ name: t.full_name, assignedCombos: t.assigned_combos || [] });
    setErrorMsg('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b-2 border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Faculty Directory</h2>
          <p className="font-semibold text-slate-400 text-sm mt-1">
            Manage your school&apos;s educators, generate login credentials, and assign subjects.
          </p>
        </div>
        <button 
          onClick={() => { setShowAddModal(true); setErrorMsg(''); }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <UserPlus size={18} /> Add New Teacher
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Teacher Name & ID</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Email</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Assigned Subjects</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold">
                    <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin inline-block mb-2" />
                    <p>Loading Faculty Directory...</p>
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold">
                    No faculty members have been added to this organization yet.
                  </td>
                </tr>
              ) : (
                teachers.map(t => (
                  <tr key={t.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{t.full_name}</div>
                      <div className="font-bold text-xs text-indigo-500 font-mono mt-0.5">{t.kortex_id}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-500">{t.email}</td>
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="flex flex-wrap gap-2">
                        {t.assigned_combos && t.assigned_combos.length > 0 ? (
                          t.assigned_combos.map(cid => (
                            <span key={cid} className="px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold">
                              {getComboLabel(cid)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded-lg">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleResendWelcome(t)} className="p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors" title="Copy Welcome & Password Link">
                          <KeyRound size={16} />
                        </button>
                        <button onClick={() => openEditModal(t)} className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors" title="Edit Teacher">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeletingTeacher(t)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors" title="Delete Teacher">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================
          ADD TEACHER MODAL 
      ============================================= */}
      {showAddModal && !successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <div className="bg-indigo-600 p-6 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4 text-white">
                 <div className="p-3 bg-white/20 rounded-xl"><GraduationCap size={24} /></div>
                 <div>
                   <h3 className="text-xl font-black">Add Teacher</h3>
                   <p className="text-indigo-200 text-xs font-bold">Generate ID & assign combos</p>
                 </div>
               </div>
               <button onClick={closeModals} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
             </div>
             
             <form onSubmit={handleGenerateTeacher} className="p-6 space-y-5 overflow-y-auto">
               {errorMsg && (
                 <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold text-sm rounded-xl">
                   {errorMsg}
                 </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Full Name</label>
                   <input required type="text" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500" placeholder="e.g. Ravi Kumar" />
                 </div>
                 
                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Email Address</label>
                   <input required type="email" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500" placeholder="teacher@school.edu" />
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Custom Teacher ID</label>
                 <div className="flex">
                    <span className="bg-slate-200 px-4 py-2.5 rounded-l-xl font-mono font-black text-slate-600 border-2 border-r-0 border-slate-200 flex items-center justify-center shrink-0">
                      {orgAbbrev}_
                    </span>
                    <input 
                      required 
                      type="text" 
                      value={newTeacher.customSuffix} 
                      onChange={e => setNewTeacher({...newTeacher, customSuffix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')})} 
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-r-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500 font-mono tracking-widest" 
                      placeholder="E.G. RAVI" 
                    />
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-2 uppercase flex justify-between items-center">
                   <span>Assign Subject Combinations</span>
                   <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-[10px]">{newTeacher.assignedCombos.length} selected</span>
                 </label>
                 <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                   {orgCombos.length > 0 ? orgCombos.map(combo => {
                      const comboId = generateComboId(profile.kortex_id, combo);
                      const isChecked = newTeacher.assignedCombos.includes(comboId);
                      const assignedTeacher = assignedComboMap.get(comboId);
                      const isAssignedToOther = !!assignedTeacher;

                      return (
                        <label key={comboId} className={`flex items-center gap-3 p-3 border-2 rounded-xl transition-colors ${
                          isAssignedToOther ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' :
                          isChecked ? 'bg-indigo-50 border-indigo-500 cursor-pointer' : 'bg-white border-slate-100 hover:border-slate-300 cursor-pointer'
                        }`}>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 disabled:opacity-50"
                            checked={isChecked} 
                            disabled={isAssignedToOther}
                            onChange={(e) => {
                              if (e.target.checked) setNewTeacher(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                              else setNewTeacher(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                            }} 
                          />
                          <div className="flex-1">
                             <span className="font-bold text-slate-800 block leading-tight">{combo}</span>
                             <span className="text-xs text-slate-400 font-mono font-bold">ID: {comboId}</span>
                          </div>
                          {isAssignedToOther && (
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded">
                              Assigned: {assignedTeacher.name}
                            </span>
                          )}
                        </label>
                      );
                   }) : (
                     <div className="p-4 bg-rose-50 text-rose-700 text-sm font-bold rounded-xl border border-rose-100">
                       You do not have any approved combinations.
                     </div>
                   )}
                 </div>
               </div>

               <div className="pt-2 flex gap-3 shrink-0">
                 <button type="button" onClick={closeModals} disabled={isSubmitting} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                   {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Provision Teacher'}
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* =========================================
          EDIT TEACHER MODAL 
      ============================================= */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <div className="bg-indigo-600 p-6 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4 text-white">
                 <div className="p-3 bg-white/20 rounded-xl"><Pencil size={24} /></div>
                 <div>
                   <h3 className="text-xl font-black">Edit Teacher</h3>
                   <p className="text-indigo-200 text-xs font-bold font-mono">{editingTeacher.kortex_id}</p>
                 </div>
               </div>
               <button onClick={closeModals} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
             </div>
             
             <form onSubmit={handleEditSubmit} className="p-6 space-y-5 overflow-y-auto">
               {errorMsg && (
                 <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold text-sm rounded-xl">
                   {errorMsg}
                 </div>
               )}

               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Full Name</label>
                 <input required type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500" />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-2 uppercase flex justify-between items-center">
                   <span>Update Subject Combinations</span>
                   <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-[10px]">{editData.assignedCombos.length} selected</span>
                 </label>
                 <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                   {orgCombos.length > 0 ? orgCombos.map(combo => {
                      const comboId = generateComboId(profile.kortex_id, combo);
                      const isChecked = editData.assignedCombos.includes(comboId);
                      const assignedTeacher = assignedComboMap.get(comboId);
                      // In Edit mode, it's ok if it is assigned to the CURRENT teacher
                      const isAssignedToOther = !!assignedTeacher && assignedTeacher.kortexId !== editingTeacher?.kortex_id;

                      return (
                        <label key={comboId} className={`flex items-center gap-3 p-3 border-2 rounded-xl transition-colors ${
                          isAssignedToOther ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' :
                          isChecked ? 'bg-indigo-50 border-indigo-500 cursor-pointer' : 'bg-white border-slate-100 hover:border-slate-300 cursor-pointer'
                        }`}>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 disabled:opacity-50"
                            checked={isChecked} 
                            disabled={isAssignedToOther}
                            onChange={(e) => {
                              if (e.target.checked) setEditData(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                              else setEditData(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                            }} 
                          />
                          <div className="flex-1">
                             <span className="font-bold text-slate-800 block leading-tight">{combo}</span>
                             <span className="text-xs text-slate-400 font-mono font-bold">ID: {comboId}</span>
                          </div>
                          {isAssignedToOther && (
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded">
                              Assigned: {assignedTeacher.name}
                            </span>
                          )}
                        </label>
                      );
                   }) : (
                     <div className="p-4 bg-rose-50 text-rose-700 text-sm font-bold rounded-xl border border-rose-100">
                       No approved combinations available.
                     </div>
                   )}
                 </div>
               </div>

               <div className="pt-2 flex gap-3 shrink-0">
                 <button type="button" onClick={closeModals} disabled={isSubmitting} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                   {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Save Changes'}
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* =========================================
          DELETE CONFIRMATION MODAL 
      ============================================= */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center">
             <div className="p-6 pb-2 pt-8 flex justify-center text-rose-500">
                <AlertTriangle size={48} strokeWidth={1.5} />
             </div>
             <div className="px-6 pb-6 space-y-4">
               <div>
                 <h3 className="text-xl font-black text-slate-800 mb-2">Delete Teacher?</h3>
                 <p className="text-slate-500 font-bold text-sm leading-relaxed">
                   Are you absolutely sure you want to remove <span className="text-slate-800">&quot;{deletingTeacher.full_name}&quot;</span> (<span className="font-mono">{deletingTeacher.kortex_id}</span>)? 
                 </p>
                 <p className="text-rose-500 font-bold text-xs mt-2 bg-rose-50 p-2 rounded-lg">
                   This action is irreversible and will delete their login credentials.
                 </p>
               </div>
               {errorMsg && <div className="text-rose-600 text-xs font-bold p-2 bg-rose-50 rounded-lg">{errorMsg}</div>}
               <div className="flex gap-3 pt-2">
                 <button type="button" onClick={closeModals} disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50">Cancel</button>
                 <button type="button" onClick={handleDeleteSubmit} disabled={isSubmitting} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                   {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Delete'}
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* =========================================
          SUCCESS MODAL (Credentials Output)
      ============================================= */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-center">
             <div className="bg-emerald-500 p-8 flex flex-col items-center justify-center relative">
               <button onClick={closeModals} className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                 <CheckCircle2 size={32} className="text-emerald-500" />
               </div>
               <h3 className="text-white font-black text-2xl mb-1">Teacher Provisioned!</h3>
               <p className="text-emerald-100 font-bold text-sm">Account generated securely</p>
             </div>
             
             <div className="p-8 space-y-6">
                <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-left space-y-3">
                   <div>
                     <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Assigned Teacher ID</span>
                     <span className="font-mono font-black text-indigo-600 text-lg">{successData.teacherId}</span>
                   </div>
                   <div>
                     <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Email Address</span>
                     <span className="font-bold text-slate-700">{successData.email}</span>
                   </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-left">
                  <p className="text-xs font-bold text-amber-800 leading-relaxed">
                    A secure password setup link has been generated. Please copy this email template and send it to the teacher directly.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleCopyCredentials} 
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {isCopied ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Copy size={18} />}
                    {isCopied ? 'Copied' : 'Copy Credentials'}
                  </button>
                  <button 
                    onClick={closeModals} 
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition-colors"
                  >
                    Done
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
