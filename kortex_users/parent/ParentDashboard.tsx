"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../backend_configurations/firebase';
import { ParentProfile, StudentProfile } from '../../types/user';
import { 
  Users, Plus, ShieldCheck, Heart, Building, CheckCircle2, 
  AlertCircle, UserPlus, RefreshCw, User
} from 'lucide-react';
import ChildAcademicView from './ChildAcademicView';
import AddChildModal from './AddChildModal';
import { resolveTransferRequest, updateParentProfile } from '../../app/actions/student';

interface ParentDashboardProps {
  profile: ParentProfile;
}

export default function ParentDashboard({ profile }: ParentDashboardProps) {
  const [internalShowModal, setInternalShowModal] = useState(false);
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string>('profile');
  const [isProcessing, setIsProcessing] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: profile.full_name || '', contactNumber: (profile as any).contact_number || '', email: profile.email || '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showCredsFor, setShowCredsFor] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  useEffect(() => {
    if (!profile.uid) return;
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('parent_id', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as StudentProfile));
      data.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
      setChildren(data);
      
      // Auto-select first child if none selected
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].uid);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile.uid, selectedChildId]);

  const selectedChild = children.find(c => c.uid === selectedChildId) || null;

  const getDisplayGrade = (child: StudentProfile) => {
    if (child.org_ids && child.org_ids.length > 0 && child.org_links) {
      // Pick the first approved org link to show grade
      const activeOrgs = Object.values(child.org_links).filter(l => l.status === 'approved');
      if (activeOrgs.length > 0) {
        const link = activeOrgs[0];
        return `${link.grade} ${link.section ? '- ' + link.section : ''}`;
      }
    }
    return child.grade === 'Unassigned' ? 'Independent' : `${child.grade} ${child.section ? '- ' + child.section : ''}`;
  };




  const handleUpdatePin = async (e: React.FormEvent, childUid: string) => {
    e.preventDefault();
    if (newPin.length < 4) return alert("PIN must be at least 4 characters.");
    setIsUpdatingPin(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const { updateChildPin } = await import('../../app/actions/student');
      const result = await updateChildPin(idToken, childUid, newPin);
      if (!result.success) throw new Error(result.error);
      
      alert("PIN updated successfully!");
      setShowCredsFor(null);
      setNewPin('');
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const result = await updateParentProfile(idToken, profileForm);
      if (!result.success) throw new Error(result.error);
      
      alert("Profile updated successfully! All your linked children have been synced with the organizations.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResolveTransfer = async (studentUid: string, orgId: string, accept: boolean) => {
    setIsProcessing(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const result = await resolveTransferRequest(idToken, studentUid, orgId, accept);
      if (!result.success) throw new Error(result.error);
      
      alert(accept ? "Transfer Approved!" : "Transfer Declined.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to resolve transfer");
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingRequests: { child: StudentProfile, orgId: string, orgName: string, grade: string }[] = [];
  children.forEach(child => {
    if (child.org_links) {
      Object.entries(child.org_links).forEach(([orgId, link]) => {
        if (link.status === 'pending') {
          pendingRequests.push({
            child,
            orgId,
            orgName: link.org_name,
            grade: link.grade
          });
        }
      });
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b-2 border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Heart size={14} /> Parent Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800">Welcome, {profile.full_name}!</h1>
          <p className="text-slate-500 font-bold text-sm mt-1 max-w-2xl">
            Manage your children&apos;s learning, track performance, and connect with their organizations.
          </p>
        </div>
        <button 
          onClick={() => setInternalShowModal(true)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={18} /> Add / Claim Child
        </button>
      </div>

      {/* Transfer Requests Alert */}
      {pendingRequests.map(req => (
        <div key={`${req.child.uid}-${req.orgId}`} className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex gap-4 items-center w-full">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <RefreshCw size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-900">Organization Transfer Request</h3>
              <p className="text-amber-700 font-semibold text-sm">
                <span className="font-black">{req.orgName}</span> has requested to link <span className="font-black">{req.child.full_name}</span> to their organization for <span className="font-black">{req.grade}</span>.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
             <button 
               disabled={isProcessing}
               onClick={() => handleResolveTransfer(req.child.uid, req.orgId, false)}
               className="flex-1 sm:flex-none px-4 py-2 bg-white border-2 border-amber-200 text-amber-700 hover:bg-amber-100 font-bold rounded-xl transition-colors"
             >
               Decline
             </button>
             <button 
               disabled={isProcessing}
               onClick={() => handleResolveTransfer(req.child.uid, req.orgId, true)}
               className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-sm transition-colors"
             >
               Approve Link
             </button>
          </div>
        </div>
      ))}

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold">Loading your children...</div>
      ) : children.length === 0 ? (
        <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 border-dashed p-12 text-center">
          <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-700 mb-2">No Children Added Yet</h3>
          <p className="text-slate-500 font-semibold mb-6 max-w-sm mx-auto">
            You haven&apos;t added any children to your account yet. Set up a child account to give them access to our interactive learning tools and curriculum!
          </p>
          <button 
            onClick={() => setInternalShowModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus size={18} /> Add Your First Child
          </button>
        </div>
      ) : (
        <>
          {/* Multi-Child Horizontal Switcher */}
          <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {/* My Profile Tab */}
            <button
                onClick={() => setSelectedChildId('profile')}
                className={`flex-shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedChildId === 'profile' 
                    ? 'bg-slate-900 border-slate-900 shadow-md transform scale-100' 
                    : 'bg-white border-slate-100 hover:border-slate-300 transform scale-95 opacity-80 hover:opacity-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                  selectedChildId === 'profile' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-500'
                }`}>
                  <User size={20} />
                </div>
                <div className="text-left">
                  <h3 className={`font-black text-sm ${selectedChildId === 'profile' ? 'text-white' : 'text-slate-700'}`}>My Profile</h3>
                  <p className={`text-xs font-semibold ${selectedChildId === 'profile' ? 'text-slate-400' : 'text-slate-400'}`}>Account Settings</p>
                </div>
            </button>
            
            {/* Children Tabs */}
            {children.map(child => (
              <button
                key={child.uid}
                onClick={() => setSelectedChildId(child.uid)}
                className={`flex-shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedChildId === child.uid 
                    ? 'bg-slate-900 border-slate-900 shadow-md transform scale-100' 
                    : 'bg-white border-slate-100 hover:border-slate-300 transform scale-95 opacity-80 hover:opacity-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                  selectedChildId === child.uid ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {child.full_name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className={`font-black text-sm ${selectedChildId === child.uid ? 'text-white' : 'text-slate-800'}`}>
                    {child.full_name}
                  </div>
                  <div className={`font-bold text-[10px] uppercase tracking-wider ${selectedChildId === child.uid ? 'text-slate-400' : 'text-slate-400'}`}>
                    {child.kortex_id}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Child Dashboard */}
          {/* Render Profile OR Selected Child */}
          {selectedChildId === 'profile' ? (
             <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6 sm:p-8 animate-fade-in max-w-2xl">
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                   <User size={28} className="stroke-[3px]" />
                 </div>
                 <div>
                   <div className="flex items-center gap-3 mb-1">
                     <h2 className="text-2xl font-black text-slate-800">My Profile</h2>
                     {profile.kortex_id && (
                       <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-black font-mono">
                         {profile.kortex_id}
                       </span>
                     )}
                   </div>
                   <p className="text-sm font-semibold text-slate-500">Manage your contact details. Changes instantly sync to organizations.</p>
                 </div>
               </div>
               
               <form onSubmit={handleProfileSubmit} className="space-y-6">
                 <div>
                   <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                   <input 
                     type="text" required
                     value={profileForm.fullName}
                     onChange={e => setProfileForm({...profileForm, fullName: e.target.value})}
                     className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                   <input 
                     type="email" required
                     value={profileForm.email}
                     onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                     className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Emergency Contact (Phone)</label>
                   <input 
                     type="text" required
                     value={profileForm.contactNumber}
                     onChange={e => setProfileForm({...profileForm, contactNumber: e.target.value})}
                     className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                   />
                   <p className="text-xs font-semibold text-slate-400 mt-2">This number is securely shared with organizations in case of emergencies.</p>
                 </div>
                 <div className="pt-4 border-t-2 border-slate-100">
                   <button 
                     type="submit"
                     disabled={isSavingProfile}
                     className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                   >
                     {isSavingProfile ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />} 
                     {isSavingProfile ? 'Syncing securely...' : 'Save & Sync Details'}
                   </button>
                 </div>
               </form>
             </div>
          ) : selectedChild ? (
            <div className="space-y-6 animate-fade-in">
              
              {/* Profile Card */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 w-full">
                   <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-black shrink-0">
                     {selectedChild.full_name.charAt(0)}
                   </div>
                   <div>
                     <h2 className="text-2xl font-black text-slate-800">{selectedChild.full_name}</h2>
                     <div className="flex flex-wrap items-center gap-3 mt-2">
                       <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black uppercase">
                         {getDisplayGrade(selectedChild)}
                       </span>
                       {(selectedChild.org_ids && selectedChild.org_ids.length > 0) ? (
                         <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1.5">
                           <Building size={14} /> Linked to {selectedChild.org_ids.length} Organization{selectedChild.org_ids.length > 1 ? 's' : ''}
                         </span>
                       ) : (
                         <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold flex items-center gap-1.5">
                           <ShieldCheck size={14} /> Independent Learner
                         </span>
                       )}
                     </div>
                   </div>
                </div>


                <button 
                  onClick={() => setShowCredsFor(showCredsFor === selectedChild.uid ? null : selectedChild.uid)}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <ShieldCheck size={18} /> Login Details
                </button>
              </div>

              {/* Login Details Expanded */}
              {showCredsFor === selectedChild.uid && (
                <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 sm:p-8 animate-in slide-in-from-top-4">
                  <div className="flex flex-col sm:flex-row gap-8">
                    
                    {/* Read-only Current Details */}
                    <div className="flex-1 space-y-4">
                      <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><User size={20}/> Current Credentials</h3>
                      <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Student Kortex ID (Username)</p>
                        <div className="font-mono text-lg font-bold text-slate-700 bg-white border-2 border-slate-200 p-3 rounded-xl inline-block">
                          {selectedChild.kortex_id}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Current PIN / Password</p>
                        <div className="font-mono text-lg font-bold text-slate-700 bg-white border-2 border-slate-200 p-3 rounded-xl inline-block">
                          {selectedChild.plain_pin || '••••••'}
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 max-w-sm">
                        The student must use this exact Kortex ID and PIN to log into their dashboard.
                      </p>
                    </div>

                    {/* Change PIN Form */}
                    <div className="flex-1 border-t-2 sm:border-t-0 sm:border-l-2 border-slate-200 pt-6 sm:pt-0 sm:pl-8">
                      <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4"><RefreshCw size={20}/> Change PIN</h3>
                      <form onSubmit={(e) => handleUpdatePin(e, selectedChild.uid)} className="space-y-4">
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">New PIN / Password</label>
                          <input 
                            type="text" 
                            required 
                            minLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            placeholder="e.g. 1234 or apple123"
                            className="w-full bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={isUpdatingPin || newPin.length < 4}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
                        >
                          {isUpdatingPin ? 'Updating...' : 'Update PIN securely'}
                        </button>
                      </form>
                    </div>

                  </div>
                </div>
              )}


              <ChildAcademicView child={selectedChild} />

            </div>
          ) : null}
        </>
      )}

      {internalShowModal && (
        <AddChildModal 
          onClose={() => setInternalShowModal(false)} 
          onChildCreated={() => setInternalShowModal(false)}
        />
      )}
    </div>
  );
}

