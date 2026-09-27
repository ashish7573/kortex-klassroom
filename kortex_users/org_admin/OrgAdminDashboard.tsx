"use client";
import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../backend_configurations/firebase';
import { OrgAdminProfile, ParentProfile } from '../../types/user';
import { Building2, Users, GraduationCap, UserPlus, FileSpreadsheet, Send, Search, CheckCircle2, AlertCircle } from 'lucide-react';

interface OrgAdminDashboardProps {
  profile: OrgAdminProfile;
  onAddTeacher?: () => void;
  onEnrollStudents?: () => void;
}

export default function OrgAdminDashboard({ profile, onAddTeacher, onEnrollStudents }: OrgAdminDashboardProps) {
  const [targetEmail, setTargetEmail] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestStatus, setRequestStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const usagePercentage = profile.license_quota > 0 
    ? Math.round((profile.active_students_count / profile.license_quota) * 100) 
    : 0;

  const handleSendLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingRequest(true);
    setRequestStatus(null);

    try {
      // 1. Find the parent by email
      const q = query(
        collection(db, 'users'), 
        where('role', '==', 'parent'), 
        where('email', '==', targetEmail.toLowerCase().trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setRequestStatus({ type: 'error', message: 'No parent found with this registered email address.' });
        setIsSendingRequest(false);
        return;
      }

      const parentDoc = querySnapshot.docs[0];
      const parentData = parentDoc.data() as ParentProfile;
      const parentId = parentDoc.id;

      // 2. Find the child by username (if provided) to get the student_id
      let targetStudentId = '';
      if (studentUsername) {
        const studentQ = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('username', '==', studentUsername.trim())
        );
        const studentSnap = await getDocs(studentQ);
        if (!studentSnap.empty) {
           targetStudentId = studentSnap.docs[0].id;
        } else {
           setRequestStatus({ type: 'error', message: 'Student username not found.' });
           setIsSendingRequest(false);
           return;
        }
      } else {
         // If no username provided, we just send a generic link request for "a child"
         // and the parent can select which child to link when they approve.
         // For now, let's just make targetStudentId 'pending_selection'
         targetStudentId = 'pending_selection';
      }

      // 3. Append to parent's pending_org_approvals
      const newApprovalRequest = {
        org_id: profile.uid,
        student_id: targetStudentId,
        org_name: profile.organization_name,
        requested_at: new Date().toISOString(),
        status: 'pending'
      };

      await updateDoc(doc(db, 'users', parentId), {
        pending_org_approvals: arrayUnion(newApprovalRequest)
      });

      setRequestStatus({ type: 'success', message: 'Link request sent securely to the parent!' });
      setTargetEmail('');
      setStudentUsername('');

    } catch (error: any) {
      console.error("Error sending link request:", error);
      setRequestStatus({ type: 'error', message: error.message || 'Failed to send request.' });
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Organization Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Building2 size={14} className="text-sky-300" /> Organization Administrator Console
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">{profile.organization_name}</h1>
          <p className="text-indigo-100 text-base max-w-xl font-medium">
            Manage your faculty, student roster licenses, and educational analytics across all classrooms.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* License Utilization & Quota Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-800">Student Seat Licenses</h3>
            <p className="text-sm font-semibold text-slate-400">
              {profile.active_students_count} of {profile.license_quota} seats currently allocated
            </p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${usagePercentage >= 90 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {usagePercentage}% Capacity
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mb-6">
          <div 
            className={`h-full transition-all duration-700 rounded-full ${usagePercentage >= 90 ? 'bg-rose-500' : 'bg-indigo-600'}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={onEnrollStudents}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95"
          >
            <UserPlus size={18} /> Enroll New Students (B2B)
          </button>
          <button
            type="button"
            onClick={onAddTeacher}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-2xl shadow-sm transition-all"
          >
            <GraduationCap size={18} className="text-indigo-600" /> Add Faculty Member
          </button>
        </div>
      </div>

      {/* Faculty & Cohort Management Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={20} /> Faculty Roster
            </h4>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {profile.teacher_ids?.length || 0} Teachers
            </span>
          </div>
          <p className="text-xs text-slate-400 font-semibold mb-4">
            Verified educators with access to student cohorts and custom lesson flow assignments.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
            Faculty member details and assignment controls will appear here.
          </div>
        </div>

        {/* Link Student via Parent Email */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <Users className="text-indigo-600" size={20} /> Parent Link Requests
            </h4>
            <FileSpreadsheet size={20} className="text-slate-400" />
          </div>
          <p className="text-xs text-slate-400 font-semibold mb-4">
            Send an organization linking request directly to a parent's registered email address. This will grant your school access to the student's analytics once approved.
          </p>
          
          <form onSubmit={handleSendLinkRequest} className="mt-auto space-y-3">
            {requestStatus && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                requestStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {requestStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {requestStatus.message}
              </div>
            )}
            
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Parent's Registered Email *</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 font-semibold text-slate-700 text-sm focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Student Username (Optional)</label>
              <input
                type="text"
                value={studentUsername}
                onChange={(e) => setStudentUsername(e.target.value)}
                placeholder="e.g. aarav2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-semibold text-slate-700 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingRequest || !targetEmail}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
            >
              {isSendingRequest ? 'Sending Request...' : <><Send size={16} /> Send Link Request</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
