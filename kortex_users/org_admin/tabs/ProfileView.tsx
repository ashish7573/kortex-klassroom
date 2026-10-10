import React, { useState } from 'react';
import { Building2, Mail, Save, Fingerprint } from 'lucide-react';
import { OrgAdminProfile } from '../../../types/user';
import { doc, updateDoc } from 'firebase/firestore';
import { RecaptchaVerifier, signInWithPhoneNumber, linkWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../../backend_configurations/firebase';
import { db } from '../../../backend_configurations/firebase';

export default function ProfileView({ profile }: { profile: OrgAdminProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: profile.organization_name,
    orgType: profile.org_type || 'school',
    address: profile.address || '',
    phone: profile.phone || ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  // OTP Verification State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [confResult, setConfResult] = useState<any>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleVerifyPhone = async () => {
    if (!profile.phone || !auth.currentUser) return;
    setOtpLoading(true);
    try {
      if (!(window as any).recaptchaVerifierOrg) {
        (window as any).recaptchaVerifierOrg = new RecaptchaVerifier(auth, 'org-recaptcha', { size: 'invisible' });
      }
      const appVerifier = (window as any).recaptchaVerifierOrg;
      const res = await linkWithPhoneNumber(auth.currentUser, profile.phone, appVerifier);
      setConfResult(res);
      setShowOtpModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to send OTP. Ensure the phone number includes a country code (e.g. +91...).");
      if ((window as any).recaptchaVerifierOrg) {
        (window as any).recaptchaVerifierOrg.clear();
        (window as any).recaptchaVerifierOrg = undefined;
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confResult) return;
    setOtpLoading(true);
    try {
      await confResult.confirm(otp);
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, { phoneVerified: true });
      alert("Phone Verified Successfully!");
      setShowOtpModal(false);
      // Let parent state update or mutate locally (in a real app, we'd trigger a reload or context update)
    } catch (err) {
      console.error(err);
      alert("Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      const updateData: any = {
        organization_name: formData.organizationName.trim(),
        full_name: formData.organizationName.trim(), // Keep full name in sync
        org_type: formData.orgType,
        address: formData.address.trim(),
        phone: formData.phone.trim()
      };

      // Check if phone changed
      if (profile.phone !== formData.phone.trim()) {
        updateData.phoneVerified = false;
        updateData.onboardingStatus = 'PENDING_PHONE';
      }

      await updateDoc(userRef, updateData);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="mb-6 border-b-2 border-slate-100 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Organization Profile</h2>
          <p className="font-semibold text-slate-400 text-sm mt-1">Manage your institution's public details and contact information.</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Fingerprint size={24}/></div>
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kortex ID</p>
             <p className="font-bold text-slate-800">{profile.kortex_id || 'Not Assigned'}</p>
           </div>
        </div>
        <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Mail size={24}/></div>
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Registered Email</p>
             <p className="font-bold text-slate-800">{profile.email}</p>
           </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Organization Name</label>
          <div className="relative">
            <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              required
              disabled={!isEditing}
              value={formData.organizationName}
              onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
              className="w-full bg-white border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Organization Type</label>
            <select 
              disabled={!isEditing}
              value={formData.orgType}
              onChange={(e) => setFormData({...formData, orgType: e.target.value as any})}
              className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="school">School (K-12)</option>
              <option value="coaching">Coaching / Tutoring</option>
              <option value="ngo">NGO / Non-Profit</option>
              <option value="other">Other Educational Entity</option>
            </select>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Contact Phone</label>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 disabled={!isEditing}
                 value={formData.phone}
                 onChange={(e) => setFormData({...formData, phone: e.target.value})}
                 className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500" 
               />
               {!isEditing && profile.phone && !profile.phoneVerified && (
                 <button
                   type="button"
                   onClick={handleVerifyPhone}
                   disabled={otpLoading}
                   className="px-4 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-md text-xs hover:bg-emerald-600 disabled:opacity-50"
                 >
                   {otpLoading ? '...' : 'Verify'}
                 </button>
               )}
               {!isEditing && profile.phoneVerified && (
                 <span className="px-4 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs flex items-center">
                   ✓ Verified
                 </span>
               )}
             </div>
             <div id="org-recaptcha" className="mt-2"></div>
          </div>
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Full Address</label>
           <textarea 
             disabled={!isEditing}
             value={formData.address}
             onChange={(e) => setFormData({...formData, address: e.target.value})}
             rows={3}
             className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500 resize-none" 
           />
        </div>

        <div className="pt-4 flex justify-end">
          {isEditing ? (
             <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
             </div>
          ) : (
            <button 
              type="button" 
              onClick={() => setIsEditing(true)}
              className="px-8 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl shadow-md transition-all"
            >
              Edit Profile
            </button>
          )}
        </div>
      </form>

      {/* Inline OTP Modal for Org */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <h3 className="text-xl font-black text-slate-800 mb-2">Enter OTP</h3>
            <p className="text-xs text-slate-400 mb-6">Sent to {profile.phone}</p>
            <form onSubmit={handleConfirmOtp} className="space-y-4">
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500 text-center tracking-widest text-lg"
              />
              <button
                type="submit"
                disabled={otpLoading || otp.length < 6}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-md disabled:opacity-50"
              >
                {otpLoading ? 'Verifying...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => { setShowOtpModal(false); setOtp(''); }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 py-2"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
