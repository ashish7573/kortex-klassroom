"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, or, and } from 'firebase/firestore';
import { db, auth } from '../../../backend_configurations/firebase';
import { OrgAdminProfile, StudentProfile } from '../../../types/user';
import { Users, UserPlus, Link, AlertCircle, CheckCircle2, MoreVertical, RefreshCw, Phone, Pencil, Trash2, Import, BookOpen, Download, Search, Filter, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { GRADES, SECTIONS, SUBJECT_CATEGORIES, GRADE_CORE_MAP } from '../../../kortex_landing_page/curriculumConfig';
import { generateComboId } from '../utils/comboParsers';
import { provisionStudentPlaceholder, requestStudentImport, updateStudentDetails, revokeStudentAccess, bulkProvisionStudents } from '../../../app/actions/student';

export default function StudentsParentsView({ profile }: { profile: OrgAdminProfile }) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortIndicator = (key: string) => {
    if (sortConfig?.key === key) {
       return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
    }
    return <ArrowUpDown size={12} className="inline ml-1 opacity-20 group-hover:opacity-100 transition-opacity" />;
  };

  let processedStudents = [...students].filter(student => {
    const matchesSearch = 
      (student.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (student.kortex_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const grade = student.org_links?.[profile.uid]?.grade || student.grade;
    const matchesGrade = gradeFilter === 'all' || grade === gradeFilter;

    return matchesSearch && matchesGrade;
  });

  if (sortConfig) {
     processedStudents.sort((a, b) => {
        let valA = '';
        let valB = '';
        
        if (sortConfig.key === 'student_id') {
           valA = (a.kortex_id || '').toLowerCase();
           valB = (b.kortex_id || '').toLowerCase();
        } else if (sortConfig.key === 'full_name') {
           valA = (a.full_name || '').toLowerCase();
           valB = (b.full_name || '').toLowerCase();
        } else if (sortConfig.key === 'link_status') {
           valA = (a.org_links?.[profile.uid]?.status || '').toLowerCase();
           valB = (b.org_links?.[profile.uid]?.status || '').toLowerCase();
        }
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
     });
  }


  const [csvFile, setCsvFile] = useState<File | null>(null);

  const downloadSampleCsv = () => {
    const csvContent = "Student Name,Parent Email,Parent Phone\nJohn Doe,john@example.com,+1234567890\nJane Smith,jane@example.com,";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Student_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Forms
  const [addMode, setAddMode] = useState<'new' | 'import' | 'bulk'>('new');
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

  // Pre-check Core Subjects for Bulk Import when Grade changes
  useEffect(() => {
    if (addMode === 'bulk') {
      const coreSubjects = GRADE_CORE_MAP[studentForm.grade] || [];
      const coreComboIds = coreSubjects.map(subj => 
        generateComboId(profile.kortex_id || '', `${studentForm.grade} - Section ${studentForm.section} - ${subj}`)
      );
      setStudentForm(prev => ({ ...prev, assignedCombos: coreComboIds }));
    }
  }, [studentForm.grade, studentForm.section, addMode, profile.kortex_id]);


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

  
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      alert("Please select a CSV file.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      if (lines.length < 2) {
        throw new Error("CSV file must contain a header row and at least one student row.");
      }
      
      const students = lines.slice(1).map(line => {
        const parts = line.split(',');
        return {
          fullName: (parts[0] || '').trim(),
          parentEmail: (parts[1] || '').trim(),
          parentPhone: (parts[2] || '').trim(),
        };
      }).filter(s => s.fullName.length > 0);
      
      if (students.length === 0) {
         throw new Error("No valid student records found in CSV.");
      }

      if (students.length > 40) {
         throw new Error(`CSV contains ${students.length} students. A single upload cannot exceed 40 students.`);
      }

      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);

      const result = await bulkProvisionStudents(
        idToken,
        studentForm.grade,
        studentForm.section,
        studentForm.assignedCombos,
        students
      );
      
      if (!result.success) throw new Error(result.error);
      
      alert(result.message);
      setShowAddModal(false);
      setCsvFile(null);
      resetForm();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

      
      {/* Controls: Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end mb-6">
        <div className="flex-1 w-full max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by student name or Kortex ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={gradeFilter} 
            onChange={e => setGradeFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Grades</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>
      
      {/* Directory Table */}

      <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 transition-colors select-none group" onClick={() => handleSort("student_id")}>Student ID {sortIndicator("student_id")}</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 transition-colors select-none group" onClick={() => handleSort("full_name")}>Student Name {sortIndicator("full_name")}</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Subjects</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Parent Details</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 transition-colors select-none group" onClick={() => handleSort("link_status")}>Link Status {sortIndicator("link_status")}</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">Loading students...</td></tr>
              ) : processedStudents.length > 0 ? processedStudents.map(student => {
                const legacyCount = getStudentDefaultCombos(student).length;
                const assignedCount = student.org_links?.[profile.uid]?.assigned_combos?.length || 0;
                const totalCount = assignedCount > 0 ? assignedCount : legacyCount;
                
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
                      {totalCount} {assignedCount === 0 && legacyCount > 0 && <span className="text-amber-500 text-[10px] ml-1">(Legacy)</span>}
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
                   Transfer In
                 </button>
                 <button 
                   onClick={() => setAddMode('bulk')}
                   className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${addMode === 'bulk' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:text-white'}`}
                 >
                   Bulk Upload
                 </button>
               </div>
             </div>
             
             <div className="overflow-y-auto p-6">
               
               <form id="studentForm" onSubmit={addMode === 'bulk' ? handleBulkSubmit : handleGenerateOrImport} className="space-y-6">
                 
                 <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                    <Link size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-indigo-800 leading-relaxed">
                      {addMode === 'new' 
                        ? 'This ID will be used by the parent to link their child\'s account to your school. Standard subjects for the selected Grade & Section are automatically mapped.'
                        : addMode === 'import' 
                        ? 'Enter the student\'s existing Kortex ID. This will send a transfer request to the parent. Once approved, they will be linked to your school.'
                        : 'Select the exact Grade, Section, and extra combinations for this batch. Then upload a CSV with Student Name, Parent Email, and Parent Phone. Limit 40 students.'
                      }
                    </p>
                 </div>


                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   
                   {addMode !== 'bulk' && (
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
                   )}

                   
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

                 <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                   <label className="block text-xs font-bold text-slate-600 mb-4 uppercase">
                     {addMode === 'bulk' ? 'Select Subjects for this Batch' : 'Select Subjects for this Student'}
                   </label>
                   
                   <div className={`space-y-4 ${addMode === 'bulk' ? 'mb-6' : 'mb-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar'}`}>
                     {/* Category 1: Core */}
                     <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                       <h4 className="text-xs font-bold text-indigo-700 uppercase mb-3 border-b border-indigo-100 pb-2">Core Academics</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {(GRADE_CORE_MAP[studentForm.grade] || []).map(subj => {
                           const comboStr = `${studentForm.grade} - Section ${studentForm.section} - ${subj}`;
                           const comboId = generateComboId(profile.kortex_id || '', comboStr);
                           const isChecked = studentForm.assignedCombos.includes(comboId);
                           const isApproved = profile.approved_grade_subject_combos?.includes(comboStr) || false;
                           return (
                             <label key={comboId} className={`flex items-center gap-2 ${isApproved ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                               <input type="checkbox" checked={isChecked} disabled={!isApproved} onChange={(e) => {
                                 if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                 else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                               }} className={`w-4 h-4 rounded border-slate-300 ${isApproved ? 'text-indigo-600 focus:ring-indigo-500' : 'text-slate-400 bg-slate-200'}`} />
                               <span className="text-sm font-bold text-slate-700">{subj}</span>
                             </label>
                           );
                         })}
                       </div>
                     </div>

                     {/* Category 2: Foundational */}
                     <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                       <h4 className="text-xs font-bold text-amber-700 uppercase mb-3 border-b border-amber-200 pb-2">Foundational (FLN)</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {SUBJECT_CATEGORIES.FOUNDATIONAL.map(subj => {
                           const comboStr = `${studentForm.grade} - Section ${studentForm.section} - ${subj}`;
                           const comboId = generateComboId(profile.kortex_id || '', comboStr);
                           const isChecked = studentForm.assignedCombos.includes(comboId);
                           const isApproved = profile.approved_grade_subject_combos?.includes(comboStr) || false;
                           return (
                             <label key={comboId} className={`flex items-center gap-2 ${isApproved ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                               <input type="checkbox" checked={isChecked} disabled={!isApproved} onChange={(e) => {
                                 if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                 else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                               }} className={`w-4 h-4 rounded border-slate-300 ${isApproved ? 'text-amber-600 focus:ring-amber-500' : 'text-slate-400 bg-slate-200'}`} />
                               <span className="text-sm font-bold text-slate-700">{subj}</span>
                             </label>
                           );
                         })}
                       </div>
                     </div>

                     {/* Category 3: Co-Curricular */}
                     <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                       <h4 className="text-xs font-bold text-emerald-700 uppercase mb-3 border-b border-emerald-200 pb-2">Co-Curricular & Skills</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {SUBJECT_CATEGORIES.CO_CURRICULAR_AND_SKILLS.map(subj => {
                           const comboStr = `${studentForm.grade} - Section ${studentForm.section} - ${subj}`;
                           const comboId = generateComboId(profile.kortex_id || '', comboStr);
                           const isChecked = studentForm.assignedCombos.includes(comboId);
                           const isApproved = profile.approved_grade_subject_combos?.includes(comboStr) || false;
                           return (
                             <label key={comboId} className={`flex items-center gap-2 ${isApproved ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                               <input type="checkbox" checked={isChecked} disabled={!isApproved} onChange={(e) => {
                                 if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                 else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                               }} className={`w-4 h-4 rounded border-slate-300 ${isApproved ? 'text-emerald-600 focus:ring-emerald-500' : 'text-slate-400 bg-slate-200'}`} />
                               <span className="text-sm font-bold text-slate-700">{subj}</span>
                             </label>
                           );
                         })}
                       </div>
                     </div>
                   </div>
                   
                   {addMode === 'bulk' && (
                     <div className="mt-4">
                       <div className="flex items-center justify-between mb-2">
                         <label className="block text-xs font-bold text-slate-600 uppercase">Upload CSV File</label>
                         <button type="button" onClick={downloadSampleCsv} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                           <Download size={12} /> Download Sample CSV
                         </button>
                       </div>
                       <input 
                         required
                         type="file" 
                         accept=".csv"
                         onChange={e => setCsvFile(e.target.files?.[0] || null)} 
                         className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl px-4 py-6 font-bold text-slate-600 outline-none focus:border-indigo-500 cursor-pointer text-center" 
                       />
                     </div>
                   )}
                 </div>
               </form>
             </div>

             <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
               <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
               <button disabled={isSubmitting} form="studentForm" type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black rounded-xl shadow-md transition-all">
                 
                 {isSubmitting ? 'Processing...' : (addMode === 'new' ? 'Generate ID' : addMode === 'import' ? 'Send Transfer Request' : 'Upload & Provision')}

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

                 <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                       <label className="block text-xs font-bold text-slate-600 mb-4 uppercase">Select Subjects for this Student</label>
                       
                       <div className="space-y-4 mb-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                         {/* Category 1: Core */}
                         <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                           <h4 className="text-xs font-bold text-indigo-700 uppercase mb-3 border-b border-indigo-100 pb-2">Core Academics</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {(GRADE_CORE_MAP[studentForm.grade] || []).map(subj => {
                               const comboStr = `${studentForm.grade} - Section ${studentForm.section} - ${subj}`;
                               const comboId = generateComboId(profile.kortex_id || '', comboStr);
                               const isChecked = studentForm.assignedCombos.includes(comboId);
                               const isApproved = profile.approved_grade_subject_combos?.includes(comboStr) || false;
                               return (
                                 <label key={comboId} className={`flex items-center gap-2 ${isApproved ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                   <input type="checkbox" checked={isChecked} disabled={!isApproved} onChange={(e) => {
                                     if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                     else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                                   }} className={`w-4 h-4 rounded border-slate-300 ${isApproved ? 'text-indigo-600 focus:ring-indigo-500' : 'text-slate-400 bg-slate-200'}`} />
                                   <span className="text-sm font-bold text-slate-700">{subj}</span>
                                 </label>
                               );
                             })}
                           </div>
                         </div>

                         {/* Category 2: Foundational */}
                         <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                           <h4 className="text-xs font-bold text-amber-700 uppercase mb-3 border-b border-amber-200 pb-2">Foundational (FLN)</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {SUBJECT_CATEGORIES.FOUNDATIONAL.map(subj => {
                               const comboStr = `${studentForm.grade} - Section ${studentForm.section} - ${subj}`;
                               const comboId = generateComboId(profile.kortex_id || '', comboStr);
                               const isChecked = studentForm.assignedCombos.includes(comboId);
                               const isApproved = profile.approved_grade_subject_combos?.includes(comboStr) || false;
                               return (
                                 <label key={comboId} className={`flex items-center gap-2 ${isApproved ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                   <input type="checkbox" checked={isChecked} disabled={!isApproved} onChange={(e) => {
                                     if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                     else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                                   }} className={`w-4 h-4 rounded border-slate-300 ${isApproved ? 'text-amber-600 focus:ring-amber-500' : 'text-slate-400 bg-slate-200'}`} />
                                   <span className="text-sm font-bold text-slate-700">{subj}</span>
                                 </label>
                               );
                             })}
                           </div>
                         </div>

                         {/* Category 3: Co-Curricular */}
                         <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                           <h4 className="text-xs font-bold text-emerald-700 uppercase mb-3 border-b border-emerald-200 pb-2">Co-Curricular & Skills</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {SUBJECT_CATEGORIES.CO_CURRICULAR_AND_SKILLS.map(subj => {
                               const comboStr = `${studentForm.grade} - Section ${studentForm.section} - ${subj}`;
                               const comboId = generateComboId(profile.kortex_id || '', comboStr);
                               const isChecked = studentForm.assignedCombos.includes(comboId);
                               const isApproved = profile.approved_grade_subject_combos?.includes(comboStr) || false;
                               return (
                                 <label key={comboId} className={`flex items-center gap-2 ${isApproved ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                   <input type="checkbox" checked={isChecked} disabled={!isApproved} onChange={(e) => {
                                     if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                     else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                                   }} className={`w-4 h-4 rounded border-slate-300 ${isApproved ? 'text-emerald-600 focus:ring-emerald-500' : 'text-slate-400 bg-slate-200'}`} />
                                   <span className="text-sm font-bold text-slate-700">{subj}</span>
                                 </label>
                               );
                             })}
                           </div>
                         </div>
                       </div>
                     </div>
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
               {viewingSubjectsStudent.org_links?.[profile.uid]?.assigned_combos && viewingSubjectsStudent.org_links?.[profile.uid]?.assigned_combos.length > 0 ? (
                 <div>
                   <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Assigned Subjects</h4>
                   <div className="space-y-2">
                     {viewingSubjectsStudent.org_links?.[profile.uid]?.assigned_combos.map(comboId => (
                       <div key={comboId} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                         <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                         <span className="font-bold text-indigo-900 text-sm">{decodeCombo(comboId)}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div>
                   <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Legacy Default Subjects</h4>
                   <div className="space-y-2">
                     {getStudentDefaultCombos(viewingSubjectsStudent).length > 0 ? (
                       getStudentDefaultCombos(viewingSubjectsStudent).map(comboStr => (
                         <div key={comboStr} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                           <span className="font-bold text-slate-700 text-sm">{comboStr}</span>
                         </div>
                       ))
                     ) : (
                       <p className="text-sm font-semibold text-slate-400 italic">No subjects mapped. Please edit student to assign.</p>
                     )}
                   </div>
                   <p className="mt-4 text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 font-bold">
                     Note: This student is using legacy auto-assignment. Please click Edit and explicitly save their subjects.
                   </p>
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
