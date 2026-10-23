"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, or, and } from 'firebase/firestore';
import { db, auth } from '../../../backend_configurations/firebase';
import { OrgAdminProfile, StudentProfile } from '../../../types/user';
import { Users, UserPlus, Link, AlertCircle, CheckCircle2, MoreVertical, RefreshCw, Phone, Pencil, Trash2, Import, BookOpen, Download, Search, Filter, ChevronUp, ChevronDown, ArrowUpDown, Eye, EyeOff, Share2, KeyRound, Sparkles, Check, X } from 'lucide-react';
import { GRADES, SECTIONS, SUBJECT_CATEGORIES, GRADE_CORE_MAP } from '../../../kortex_landing_page/curriculumConfig';
import { generateComboId } from '../utils/comboParsers';
import { computeOrgSeatMetrics } from '../utils/seatLedger';
import { provisionStudentPlaceholder, requestStudentImport, updateStudentDetails, revokeStudentAccess, bulkProvisionStudents, syncOrgStudents, resetStudentPinByOrgAdmin } from '../../../app/actions/student';
import ModalPortal from '../../../components/ModalPortal';

interface StudentsParentsViewProps {
  profile: OrgAdminProfile;
  initialStudents?: StudentProfile[];
  initialLoading?: boolean;
}

export default function StudentsParentsView({ profile, initialStudents, initialLoading }: StudentsParentsViewProps) {
  const [students, setStudents] = useState<StudentProfile[]>(initialStudents || []);
  const [loading, setLoading] = useState(initialLoading !== undefined ? initialLoading : true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  
  // Org Admin PIN Management
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [resettingStudent, setResettingStudent] = useState<StudentProfile | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinResetSubmitting, setPinResetSubmitting] = useState(false);
  const [pinResetSuccess, setPinResetSuccess] = useState('');

  const togglePinReveal = (uid: string) => {
    setRevealedPins(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingStudent) return;
    const clean = newPin.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      alert("PIN must be exactly 6 digits.");
      return;
    }
    setPinResetSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      const res = await resetStudentPinByOrgAdmin(token, resettingStudent.uid, clean);
      if (!res.success) throw new Error(res.error || "Failed to reset PIN");

      setStudents(prev => prev.map(s => s.uid === resettingStudent.uid ? { ...s, plain_pin: clean } : s));
      setPinResetSuccess(`PIN successfully updated to ${clean}!`);
      setTimeout(() => {
        setResettingStudent(null);
        setPinResetSuccess('');
        setNewPin('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to reset PIN");
    } finally {
      setPinResetSubmitting(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & On-Demand Filters
  const [showList, setShowList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

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

  const approvedComboIdSet = useMemo(() => {
    return new Set(
      (profile.approved_grade_subject_combos || []).map(c => generateComboId(profile.kortex_id || '', c))
    );
  }, [profile.approved_grade_subject_combos, profile.kortex_id]);

  // Extract distinct subjects from org combos
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    (profile.approved_grade_subject_combos || []).forEach(combo => {
      const parts = combo.split('-');
      if (parts.length > 2) {
        set.add(parts[parts.length - 1].trim());
      }
    });
    return Array.from(set).sort();
  }, [profile.approved_grade_subject_combos]);

  // Real-time Seat Ledger Metrics
  const seatMetrics = useMemo(() => {
    return computeOrgSeatMetrics(
      profile.kortex_id || '',
      profile.uid,
      profile.approved_grade_subject_combos || [],
      students,
      profile.license_quota
    );
  }, [profile.kortex_id, profile.uid, profile.approved_grade_subject_combos, profile.license_quota, students]);

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

  const exportStudentsToCSV = () => {
    if (processedStudents.length === 0) return;
    const headers = ['Roll No', 'Student ID', 'Student Name', 'Grade', 'Section', 'Parent Name', 'Parent Email', 'Parent Phone', 'Status'];
    const rows = [headers.join(',')];
    for (const s of processedStudents) {
      const roll = s.roll_no || s.org_links?.[profile.uid]?.roll_no || '';
      const grade = s.org_links?.[profile.uid]?.grade || s.grade || '';
      const section = s.org_links?.[profile.uid]?.section || s.section || '';
      const status = s.org_links?.[profile.uid]?.status || 'pending';
      const values = [
        `"${roll}"`,
        `"${s.kortex_id || ''}"`,
        `"${s.full_name || ''}"`,
        `"${grade}"`,
        `"${section}"`,
        `"${s.parent_name || ''}"`,
        `"${s.parent_email || ''}"`,
        `"${s.emergency_contact || ''}"`,
        `"${status}"`
      ];
      rows.push(values.join(','));
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.organization_name}_Students.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  let processedStudents = [...students].filter(student => {
    const rollNo = student.roll_no || student.org_links?.[profile.uid]?.roll_no || '';
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (student.full_name || '').toLowerCase().includes(searchLower) || 
      (student.kortex_id || '').toLowerCase().includes(searchLower) ||
      rollNo.toLowerCase().includes(searchLower) ||
      (student.parent_name || '').toLowerCase().includes(searchLower) ||
      (student.parent_email || '').toLowerCase().includes(searchLower) ||
      (student.emergency_contact || '').includes(searchLower);
    
    const grade = student.org_links?.[profile.uid]?.grade || student.grade;
    const matchesGrade = gradeFilter === 'all' || grade === gradeFilter;

    const section = student.org_links?.[profile.uid]?.section || student.section;
    const matchesSection = sectionFilter === 'all' || section === sectionFilter;

    const linkStatus = student.org_links?.[profile.uid]?.status || 'pending_setup';
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : (statusFilter === 'approved' ? linkStatus === 'approved' : linkStatus !== 'approved');

    let matchesSubject = true;
    if (subjectFilter !== 'all') {
      const defaultCombos = getStudentDefaultCombos(student);
      const assignedCombos = (student.org_links?.[profile.uid]?.assigned_combos || []).filter(cid => approvedComboIdSet.has(cid));
      const allComboStrings = [
        ...defaultCombos,
        ...assignedCombos.map(decodeCombo)
      ];
      matchesSubject = allComboStrings.some(c => c.toLowerCase().includes(subjectFilter.toLowerCase()));
    }

    return matchesSearch && matchesGrade && matchesSection && matchesStatus && matchesSubject;
  });

  if (sortConfig) {
     processedStudents.sort((a, b) => {
        if (sortConfig.key === 'roll_no') {
           const rollA = a.roll_no || a.org_links?.[profile.uid]?.roll_no || '';
           const rollB = b.roll_no || b.org_links?.[profile.uid]?.roll_no || '';
           const numA = parseInt(rollA, 10);
           const numB = parseInt(rollB, 10);
           if (!isNaN(numA) && !isNaN(numB)) {
              return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
           }
           return sortConfig.direction === 'asc' ? rollA.localeCompare(rollB) : rollB.localeCompare(rollA);
        }

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
    const csvContent = "Roll No,Student Name,Parent Email,Parent Phone\n1,John Doe,john@example.com,+1234567890\n2,Jane Smith,jane@example.com,";
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
    rollNo: '',
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
      const approvedCombos = profile.approved_grade_subject_combos || [];
      const coreSubjects = GRADE_CORE_MAP[studentForm.grade] || [];
      const validCoreComboIds = coreSubjects
        .map(subj => `${studentForm.grade} - Section ${studentForm.section} - ${subj}`)
        .filter(comboStr => approvedCombos.includes(comboStr))
        .map(comboStr => generateComboId(profile.kortex_id || '', comboStr));
      setStudentForm(prev => ({ ...prev, assignedCombos: validCoreComboIds }));
    }
  }, [studentForm.grade, studentForm.section, addMode, profile.kortex_id, profile.approved_grade_subject_combos]);


  // Sync initialStudents if provided from parent
  useEffect(() => {
    if (initialStudents !== undefined) {
      const sorted = [...initialStudents].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
      setStudents(sorted);
      setLoading(false);
    }
  }, [initialStudents]);

  // Real-time listener for Students (when not provided by parent)
  useEffect(() => {
    if (!profile.uid) return;

    // Background self-healing sync: ensures any approved or pending transfer students have orgId in org_ids
    const runSync = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          await syncOrgStudents(token);
        }
      } catch (e) {
        console.warn("Background syncOrgStudents error:", e);
      }
    };
    runSync();

    if (initialStudents !== undefined) return;

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
  }, [profile.uid, initialStudents]);

  
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
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rollIndex = headers.findIndex(h => h.includes('roll'));
      const nameIndex = headers.findIndex(h => h.includes('name'));
      const emailIndex = headers.findIndex(h => h.includes('email'));
      const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('contact'));

      const students = lines.slice(1).map(line => {
        const parts = line.split(',');
        const rollNo = rollIndex !== -1 ? (parts[rollIndex] || '').trim() : '';
        const fullName = nameIndex !== -1 
          ? (parts[nameIndex] || '').trim() 
          : (rollIndex === -1 ? (parts[0] || '').trim() : (parts[1] || '').trim());
        const parentEmail = emailIndex !== -1 
          ? (parts[emailIndex] || '').trim() 
          : (rollIndex === -1 ? (parts[1] || '').trim() : (parts[2] || '').trim());
        const parentPhone = phoneIndex !== -1 
          ? (parts[phoneIndex] || '').trim() 
          : (rollIndex === -1 ? (parts[2] || '').trim() : (parts[3] || '').trim());

        return {
          rollNo,
          fullName,
          parentEmail,
          parentPhone,
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
          rollNo: studentForm.rollNo,
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
          rollNo: studentForm.rollNo,
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
        emergencyContact: studentForm.emergencyContact,
        rollNo: studentForm.rollNo
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
      rollNo: '',
      grade: GRADES[4] || 'Grade 1',
      section: SECTIONS[0],
      assignedCombos: [],
      emergencyContact: ''
    });
  };

  const openEdit = (student: StudentProfile) => {
    setEditingStudent(student);
    const rawAssigned = student.org_links?.[profile.uid]?.assigned_combos || [];
    const validAssigned = rawAssigned.filter(cid => approvedComboIdSet.has(cid));

    setStudentForm({
      nameOrId: student.full_name,
      rollNo: student.roll_no || student.org_links?.[profile.uid]?.roll_no || '',
      grade: student.org_links?.[profile.uid]?.grade || student.grade,
      section: student.org_links?.[profile.uid]?.section || student.section || SECTIONS[0],
      assignedCombos: validAssigned,
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

  const renderSubjectCheckboxes = (subjects: string[], badgeColor: 'indigo' | 'amber' | 'emerald') => {
    return subjects.map(subj => {
      const comboStr = `${studentForm.grade} - Section ${studentForm.section} - ${subj}`;
      const comboId = generateComboId(profile.kortex_id || '', comboStr);
      const isChecked = studentForm.assignedCombos.includes(comboId);
      const isApproved = profile.approved_grade_subject_combos?.includes(comboStr) || false;
      const comboEntry = seatMetrics.combos.find(c => c.comboId === comboId);
      const isFull = comboEntry?.isFull ?? false;
      const canCheck = isApproved && (!isFull || isChecked);

      const ringColor = badgeColor === 'indigo' ? 'text-indigo-600 focus:ring-indigo-500' : badgeColor === 'amber' ? 'text-amber-600 focus:ring-amber-500' : 'text-emerald-600 focus:ring-emerald-500';

      return (
        <label 
          key={comboId} 
          className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
            !isApproved 
              ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' 
              : isFull && !isChecked
              ? 'opacity-60 cursor-not-allowed bg-rose-50/50 border-rose-200'
              : 'cursor-pointer hover:bg-white border-slate-200 bg-white/70 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <input 
              type="checkbox" 
              checked={isApproved && isChecked} 
              disabled={!canCheck} 
              onChange={(e) => {
                if (e.target.checked) setStudentForm(prev => ({ ...prev, assignedCombos: [...prev.assignedCombos, comboId] }));
                else setStudentForm(prev => ({ ...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId) }));
              }} 
              className={`w-4 h-4 rounded border-slate-300 ${ringColor}`} 
            />
            <span className="text-xs font-bold text-slate-700 truncate">{subj}</span>
          </div>

          {isApproved ? (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
              isFull 
                ? 'bg-rose-100 text-rose-700' 
                : (comboEntry?.enrolledCount || 0) > 0 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              {isFull ? 'Full (40/40)' : `${comboEntry?.enrolledCount || 0}/40`}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-300 uppercase shrink-0">Unapproved</span>
          )}
        </label>
      );
    });
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
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <UserPlus size={18} /> Add Student
        </button>
      </div>

      {/* Search & Filter Console */}
      <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <Filter size={14} className="text-indigo-600" />
            <span>Student Search & Filter Console</span>
          </div>
          {(gradeFilter !== 'all' || sectionFilter !== 'all' || subjectFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setGradeFilter('all');
                setSectionFilter('all');
                setSubjectFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end">
          {/* 1. Class / Grade */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Class / Grade
            </label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm transition-all cursor-pointer h-[42px]"
            >
              <option value="all">All Grades</option>
              {GRADES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* 2. Section */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Section
            </label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm transition-all cursor-pointer h-[42px]"
            >
              <option value="all">All Sections</option>
              {SECTIONS.map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>

          {/* 3. Subject */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Subject
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm transition-all cursor-pointer h-[42px]"
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          {/* 4. Link Status */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm transition-all cursor-pointer h-[42px]"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Linked (Active)</option>
              <option value="pending">Pending Link</option>
            </select>
          </div>

          {/* 5. Search */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Name, Roll No, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setShowList(true);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none shadow-sm transition-all h-[42px]"
              />
            </div>
          </div>

          {/* 6. Action Button */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-transparent mb-1.5 select-none">Action</label>
            <button
              type="button"
              onClick={() => setShowList(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer h-[42px]"
            >
              <Eye size={16} />
              <span>{showList ? 'Refresh List' : 'Show List'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!showList ? (
        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center bg-slate-50/50">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Users size={30} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-1.5">No Student Roster Generated</h3>
          <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto mb-6">
            Configure your filters above (Class, Section, Subject, or Status) and click <span className="font-bold text-indigo-600">"Show List"</span> to view student records on demand.
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-500 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <span>👥 {students.length} Enrolled</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600">✅ {students.filter(s => s.org_links?.[profile.uid]?.status === 'approved').length} Linked</span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-600">⏳ {students.filter(s => s.org_links?.[profile.uid]?.status === 'pending').length} Pending Link</span>
            <span className="text-slate-300">•</span>
            <span className="text-indigo-700 font-black">🪑 {seatMetrics.totalConsumed} / {seatMetrics.totalCapacity} Subject Seats ({seatMetrics.overallUsagePercentage}%)</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* Results Summary Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-700">
                Showing <span className="font-black text-indigo-900">{processedStudents.length}</span> Students
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                🪑 {seatMetrics.totalConsumed} / {seatMetrics.totalCapacity} Seats ({seatMetrics.overallUsagePercentage}%)
              </span>
              {gradeFilter !== 'all' && (
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                  {gradeFilter}
                </span>
              )}
              {sectionFilter !== 'all' && (
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                  Sec {sectionFilter}
                </span>
              )}
              {subjectFilter !== 'all' && (
                <span className="px-2.5 py-0.5 bg-violet-50 text-violet-700 text-xs font-bold rounded-lg border border-violet-100">
                  {subjectFilter}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100 capitalize">
                  {statusFilter}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button 
                onClick={exportStudentsToCSV}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl text-xs transition-colors border border-emerald-100 shrink-0 cursor-pointer"
                title="Download CSV"
              >
                <Download size={14} /> <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setShowList(false)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                title="Collapse list"
              >
                <EyeOff size={14} /> <span>Hide List</span>
              </button>
            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 transition-colors select-none group" onClick={() => handleSort("roll_no")}>Roll No {sortIndicator("roll_no")}</th>
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
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">Loading students...</td></tr>
                  ) : processedStudents.length > 0 ? processedStudents.map(student => {
                    const rawAssigned = student.org_links?.[profile.uid]?.assigned_combos || [];
                    const validAssignedCombos = rawAssigned.filter(cid => approvedComboIdSet.has(cid));
                    const assignedCount = validAssignedCombos.length;
                    const legacyCount = getStudentDefaultCombos(student).length;
                    const totalCount = assignedCount > 0 ? assignedCount : (rawAssigned.length === 0 ? legacyCount : 0);
                    
                    return (
                    <tr key={student.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700 font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-md inline-block">
                          {student.roll_no || student.org_links?.[profile.uid]?.roll_no ? `#${student.roll_no || student.org_links?.[profile.uid]?.roll_no}` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-indigo-600 font-mono text-xs bg-indigo-50 px-2 py-1 rounded-md inline-block">
                          {student.kortex_id || 'PENDING'}
                        </div>
                        {student.plain_pin ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-600 mt-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 w-fit">
                            <span className="text-[9px] text-slate-400 font-black uppercase">PIN:</span>
                            <span>{revealedPins[student.uid] ? student.plain_pin : '••••••'}</span>
                            <button
                              type="button"
                              onClick={() => togglePinReveal(student.uid)}
                              className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title={revealedPins[student.uid] ? "Hide PIN" : "Reveal PIN"}
                            >
                              {revealedPins[student.uid] ? <EyeOff size={11} /> : <Eye size={11} />}
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-500 font-bold mt-1">Pending PIN</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {student.full_name}
                          {student.accountStatus === 'DELETED' && (
                             <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[10px] font-black uppercase tracking-wider">Deleted</span>
                          )}
                        </div>
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
                        <div className="flex flex-col gap-1">
                          {student.parent_name ? (
                            <span className="font-bold text-slate-700">{student.parent_name}</span>
                          ) : (
                            <span className="font-semibold text-amber-500 italic text-xs">Awaiting Link</span>
                          )}

                          {student.claim_code && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md inline-block max-w-max">
                                Code: {student.claim_code}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const origin = typeof window !== 'undefined' ? window.location.origin : '';
                                  const url = `${origin}/start?code=${student.claim_code}`;
                                  const text = `Namaste! Access Kortex Klassroom for ${student.full_name}: ${url}`;
                                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                title="Share WhatsApp Magic Link"
                                className="px-2 py-0.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-black"
                              >
                                <Share2 size={11} /> WhatsApp
                              </button>
                            </div>
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
                            type="button"
                            onClick={() => { setResettingStudent(student); setNewPin(''); setPinResetSuccess(''); }}
                            title="Reset Student PIN"
                            className="p-2 text-sky-500 hover:bg-sky-50 hover:text-sky-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <KeyRound size={16} />
                          </button>
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
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">No students registered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Import Modal */}
      {showAddModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
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

                   {(addMode === 'new' || addMode === 'import') && (
                     <div>
                       <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Roll Number (Optional)</label>
                       <input 
                         type="text" 
                         value={studentForm.rollNo} 
                         onChange={e => setStudentForm({...studentForm, rollNo: e.target.value})} 
                         className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500" 
                         placeholder="e.g. 15" 
                       />
                     </div>
                   )}

                   {addMode === 'new' && (
                     <div>
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
                          {renderSubjectCheckboxes(GRADE_CORE_MAP[studentForm.grade] || [], 'indigo')}
                        </div>
                      </div>

                      {/* Category 2: Foundational */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-amber-700 uppercase mb-3 border-b border-amber-200 pb-2">Foundational (FLN)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {renderSubjectCheckboxes(SUBJECT_CATEGORIES.FOUNDATIONAL, 'amber')}
                        </div>
                      </div>

                      {/* Category 3: Co-Curricular */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-emerald-700 uppercase mb-3 border-b border-emerald-200 pb-2">Co-Curricular & Skills</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {renderSubjectCheckboxes(SUBJECT_CATEGORIES.CO_CURRICULAR_AND_SKILLS, 'emerald')}
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
      </ModalPortal>
      )}

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
      <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
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

                   <div>
                     <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Roll Number</label>
                     <input type="text" value={studentForm.rollNo} onChange={e => setStudentForm({...studentForm, rollNo: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500" placeholder="e.g. 15 (Optional)" />
                   </div>

                   <div>
                     <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Emergency Contact</label>
                     <input type="text" value={studentForm.emergencyContact} onChange={e => setStudentForm({...studentForm, emergencyContact: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500" placeholder="e.g. +91 98765 43210 (Optional)" />
                   </div>
                 </div>

                 <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                       <label className="block text-xs font-bold text-slate-600 mb-4 uppercase">Select Subjects for this Student</label>
                       
                       <div className="space-y-4 mb-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {/* Category 1: Core */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-indigo-700 uppercase mb-3 border-b border-indigo-100 pb-2">Core Academics</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {renderSubjectCheckboxes(GRADE_CORE_MAP[studentForm.grade] || [], 'indigo')}
                            </div>
                          </div>

                          {/* Category 2: Foundational */}
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-amber-700 uppercase mb-3 border-b border-amber-200 pb-2">Foundational (FLN)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {renderSubjectCheckboxes(SUBJECT_CATEGORIES.FOUNDATIONAL, 'amber')}
                            </div>
                          </div>

                          {/* Category 3: Co-Curricular */}
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-emerald-700 uppercase mb-3 border-b border-emerald-200 pb-2">Co-Curricular & Skills</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {renderSubjectCheckboxes(SUBJECT_CATEGORIES.CO_CURRICULAR_AND_SKILLS, 'emerald')}
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
      </ModalPortal>
      )}

      {/* Revoke Modal */}
      {showRevokeModal && revokingStudent && (
      <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
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
      </ModalPortal>
      )}

      {/* Subjects View Modal */}
      {showSubjectsModal && viewingSubjectsStudent && (
      <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
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
               {(() => {
                 const validAssigned = (viewingSubjectsStudent.org_links?.[profile.uid]?.assigned_combos || []).filter(comboId => approvedComboIdSet.has(comboId));
                 return validAssigned.length > 0 ? (
                   <div>
                     <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Assigned Subjects</h4>
                     <div className="space-y-2">
                       {validAssigned.map(comboId => (
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
               );
             })()}
             </div>

             <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
               <button onClick={() => setShowSubjectsModal(false)} className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-black rounded-xl transition-colors">
                 Close
               </button>
             </div>
           </div>
        </div>
      </ModalPortal>
      )}

      {/* Org Admin Reset Student PIN Modal */}
      {resettingStudent && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border-2 border-slate-100 shadow-2xl overflow-hidden animate-scale-up">
              <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <KeyRound size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-tight">Reset Student PIN</h3>
                    <p className="text-xs text-sky-100 font-semibold">{resettingStudent.full_name}</p>
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

              <form onSubmit={handleResetPinSubmit} className="p-6 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Student ID:</span>
                    <span className="font-mono font-black text-slate-800">{resettingStudent.kortex_id || 'PENDING'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Class & Section:</span>
                    <span className="font-bold text-slate-800">{resettingStudent.grade} {resettingStudent.section ? `• Sec ${resettingStudent.section}` : ''}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 font-bold">Current PIN:</span>
                    <span className="font-mono font-black text-indigo-600 text-sm">
                      {resettingStudent.plain_pin || 'Not set yet'}
                    </span>
                  </div>
                </div>

                {pinResetSuccess ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-sm">
                      <Check size={18} className="text-emerald-600" />
                      <span>{pinResetSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : '';
                        const text = `Namaste! Login PIN for ${resettingStudent.full_name} has been updated by the school administration.\nStudent ID: ${resettingStudent.kortex_id}\nNew PIN: ${newPin || resettingStudent.plain_pin}\nLogin at: ${origin}`;
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
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 123456"
                          className="w-full py-3.5 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-sky-500 focus:bg-white focus:outline-none font-black text-2xl tracking-widest text-center transition-all text-slate-800"
                        />
                      </div>
                      <div className="flex justify-end mt-1.5">
                        <button
                          type="button"
                          onClick={() => setNewPin('123456')}
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-800 transition-colors flex items-center gap-1 cursor-pointer"
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
                        disabled={pinResetSubmitting || newPin.length !== 6}
                        className="w-1/2 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {pinResetSubmitting ? "Saving..." : "Update PIN"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
