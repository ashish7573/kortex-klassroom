import React, { useState } from 'react';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ParentProfile, OrgApprovalRequest } from '../../types/user';
import { Users, Plus, ShieldCheck, Heart, BookOpen, Clock, X, CheckCircle2 } from 'lucide-react';
import AddChildModal from './AddChildModal';

interface ParentDashboardProps {
  profile: ParentProfile;
  onAddChild?: () => void;
  onSwitchStudent?: (studentId: string) => void;
}

export default function ParentDashboard({ profile, onAddChild, onSwitchStudent }: ParentDashboardProps) {
  const [internalShowModal, setInternalShowModal] = useState(false);
  const [resolvingRequest, setResolvingRequest] = useState<OrgApprovalRequest | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenAddChild = () => {
    if (onAddChild) {
      onAddChild();
    } else {
      setInternalShowModal(true);
    }
  };

  const handleDecline = async (req: OrgApprovalRequest) => {
    if (!confirm("Are you sure you want to decline this request?")) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        pending_org_approvals: arrayRemove(req)
      });
    } catch (err) {
      console.error("Error declining request:", err);
    }
  };

  const handleApproveConfirm = async () => {
    if (!resolvingRequest || !selectedChildId) return;
    setIsProcessing(true);
    try {
      // 1. Update Student Profile
      await updateDoc(doc(db, 'users', selectedChildId), {
        org_id: resolvingRequest.org_id,
        org_approval_status: 'approved'
      });

      // 2. Remove from Parent's pending list
      await updateDoc(doc(db, 'users', profile.uid), {
        pending_org_approvals: arrayRemove(resolvingRequest)
      });
      
      setResolvingRequest(null);
      setSelectedChildId('');
    } catch (err) {
      console.error("Error approving request:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in relative">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Heart size={14} className="text-rose-300" /> Parent Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Welcome back, {profile.full_name}!</h1>
          <p className="text-sky-100 text-base max-w-xl font-medium">
            Monitor your children's learning journey, review progress reports, and manage organization links.
          </p>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Children Overview Section */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Users className="text-sky-500" size={26} /> My Children
            </h2>
            <p className="text-sm font-semibold text-slate-400">
              Manage accounts and access personalized dashboards
            </p>
          </div>
          <button 
            type="button"
            onClick={handleOpenAddChild}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95"
          >
            <Plus size={18} /> Add Child Account
          </button>
        </div>

        {profile.children_ids.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-700 mb-1">No child accounts added yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Create an account for your child to unlock personalized conceptual games, quizzes, and progress analytics.
            </p>
            <button
              type="button"
              onClick={handleOpenAddChild}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-md transition-all"
            >
              <Plus size={18} /> Setup First Child Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.children_ids.map((childId) => (
              <div 
                key={childId}
                className="p-5 rounded-2xl border-2 border-slate-100 hover:border-sky-200 hover:shadow-md transition-all bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-sky-500 bg-sky-50 px-2.5 py-1 rounded-lg">Student</span>
                    <ShieldCheck size={18} className="text-emerald-500" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-lg mb-1">Student ID: {childId}</h4>
                  <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                    <Clock size={14} /> Active Account
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSwitchStudent?.(childId)}
                  className="w-full py-2 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen size={16} /> View Activity
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* School / Institution Link Approval Requests */}
      {profile.pending_org_approvals && profile.pending_org_approvals.length > 0 && (
        <div className="bg-amber-50/60 border-2 border-amber-200 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🏫</span>
            <h3 className="text-lg font-black text-amber-900">Institution Link Requests</h3>
          </div>
          <p className="text-sm font-semibold text-amber-700 mb-4">
            The following institutions have requested permission to link with your child's learning profile.
          </p>
          <div className="space-y-3">
            {profile.pending_org_approvals.map((req) => (
              <div key={req.org_id} className="bg-white p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <h4 className="font-extrabold text-slate-800">{req.org_name}</h4>
                  <p className="text-xs font-semibold text-slate-400">Requested on: {new Date(req.requested_at).toLocaleDateString()}</p>
                  {req.student_id !== 'pending_selection' && (
                    <p className="text-xs font-bold text-sky-600 mt-1">For Student ID: {req.student_id}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setResolvingRequest(req);
                      setSelectedChildId(req.student_id !== 'pending_selection' ? req.student_id : (profile.children_ids[0] || ''));
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Review & Approve
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleDecline(req)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Child Modal */}
      {internalShowModal && (
        <AddChildModal 
          parentUid={profile.uid} 
          onClose={() => setInternalShowModal(false)} 
          onChildCreated={() => setInternalShowModal(false)} 
        />
      )}

      {/* Resolve Link Request Modal */}
      {resolvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border-4 border-slate-100">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Approve Link</h3>
            <p className="text-sm font-semibold text-slate-500 mb-6">
              You are allowing <strong className="text-slate-800">{resolvingRequest.org_name}</strong> to view analytics and assign coursework. Which child should be linked?
            </p>
            
            <div className="space-y-4 mb-8">
              <label className="block text-xs font-bold text-slate-500 uppercase">Select Child Account</label>
              {profile.children_ids.length > 0 ? (
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500"
                >
                  <option value="" disabled>Select a student...</option>
                  {profile.children_ids.map(id => (
                    <option key={id} value={id}>Student ID: {id}</option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-rose-50 text-rose-600 text-sm font-bold rounded-xl border border-rose-200">
                  You need to create a child account first before you can approve this link.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setResolvingRequest(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleApproveConfirm}
                disabled={isProcessing || !selectedChildId}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isProcessing ? 'Saving...' : <><CheckCircle2 size={18} /> Confirm Link</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
