"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../backend_configurations/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { ParentProfile, StudentProfile } from '../../types/user';
import { 
  Users, Plus, ShieldCheck, Heart, Building, CheckCircle2, 
  AlertCircle, UserPlus, RefreshCw, User
} from 'lucide-react';
import ChildAcademicView from './ChildAcademicView';
import AddChildModal from './AddChildModal';
import RequireMobileModal from './RequireMobileModal';
import { resolveTransferRequest, updateParentProfile, parentUnlinkChildFromOrg, parentDeleteChildAccount } from '../../app/actions/student';

interface ParentDashboardProps {
  profile: ParentProfile;
}

export default function ParentDashboard({ profile }: ParentDashboardProps) {
  const [internalShowModal, setInternalShowModal] = useState(false);
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string>('profile');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const initialContact = profile.phone || (profile as any).contact_number || '';
  const knownCodes = ['+91', '+1', '+44', '+61', '+971', '+65', '+49', '+33', '+81', '+86', '+55', '+52', '+27', '+64', '+966', '+34', '+39', '+7', '+82', '+62'];
  
  let initCountryCode = '+91';
  let initMobile = initialContact;
  
  if (initialContact.startsWith('+')) {
    const spaceIdx = initialContact.indexOf(' ');
    if (spaceIdx > 0) {
      initCountryCode = initialContact.slice(0, spaceIdx);
      initMobile = initialContact.slice(spaceIdx + 1);
    } else {
      const sortedKnownCodes = [...knownCodes].sort((a, b) => b.length - a.length);
      const matchedCode = sortedKnownCodes.find(code => initialContact.startsWith(code));
      if (matchedCode) {
        initCountryCode = matchedCode;
        initMobile = initialContact.slice(matchedCode.length);
      }
    }
  }

  // If the initial country code isn't in our curated list, set it to 'other' and put the value in customCountryCode
  let defaultCountryCode = initCountryCode;
  let defaultCustomCode = '';
  if (!knownCodes.includes(initCountryCode)) {
    defaultCountryCode = 'other';
    defaultCustomCode = initCountryCode;
  }

  const [profileForm, setProfileForm] = useState({ 
    fullName: profile.full_name || '', 
    email: profile.email || '',
    countryCode: defaultCountryCode,
    customCountryCode: defaultCustomCode,
    mobileNumber: initMobile,
    city: (profile as any).city || '',
    state: (profile as any).state || '',
    country: (profile as any).country || ''
  });
  
  const COUNTRY_CODES = [
    { code: '+91', country: 'IN', digits: 10 },
    { code: '+1', country: 'US/CA', digits: 10 },
    { code: '+44', country: 'UK', digits: 10 },
    { code: '+61', country: 'AU', digits: 9 },
    { code: '+971', country: 'AE', digits: 9 },
    { code: '+65', country: 'SG', digits: 8 },
    { code: '+49', country: 'DE', digits: 10 },
    { code: '+33', country: 'FR', digits: 9 },
    { code: '+81', country: 'JP', digits: 10 },
    { code: '+86', country: 'CN', digits: 11 },
    { code: '+55', country: 'BR', digits: 11 },
    { code: '+52', country: 'MX', digits: 10 },
    { code: '+27', country: 'ZA', digits: 9 },
    { code: '+64', country: 'NZ', digits: 9 },
    { code: '+966', country: 'SA', digits: 9 },
    { code: '+34', country: 'ES', digits: 9 },
    { code: '+39', country: 'IT', digits: 10 },
    { code: '+7', country: 'RU', digits: 10 },
    { code: '+82', country: 'KR', digits: 10 },
    { code: '+62', country: 'ID', digits: 10 },
    { code: 'other', country: 'Other', digits: 0 },
  ];

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showCredsFor, setShowCredsFor] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  const isProfileComplete = () => {
    return !!(profile.full_name && profile.email && (profile.phone || (profile as any).contact_number) && (profile as any).city && (profile as any).state && (profile as any).country);
  };

  const [showMobileModal, setShowMobileModal] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<{studentUid: string, orgId: string, accept: boolean} | null>(null);


  // Inline Email Verification
  const [inlineVerifiedEmail, setInlineVerifiedEmail] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);

  const isEmailChanged = () => {
    return profileForm.email.trim() !== (profile.email || '').trim();
  };

  const isEmailVerifiedInlineBool = () => {
    return inlineVerifiedEmail === profileForm.email.trim();
  };

  const handleVerifyEmail = async () => {
    if (!auth.currentUser) return;
    setEmailVerifying(true);
    try {
      const { verifyBeforeUpdateEmail } = await import('firebase/auth');
      await verifyBeforeUpdateEmail(auth.currentUser, profileForm.email.trim());
      setEmailVerificationSent(true);
      alert("Verification link sent! Please check your email and click the link, then come back here to verify.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to send verification email.");
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    if (!auth.currentUser) return;
    setEmailVerifying(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.email === profileForm.email.trim()) {
        setInlineVerifiedEmail(profileForm.email.trim());
        setEmailVerificationSent(false);
        alert("Email successfully verified! You can now save your profile.");
      } else {
        alert("Email not yet verified. Please click the link in your email and try again.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to check email verification.");
    } finally {
      setEmailVerifying(false);
    }
  };

  // Inline Phone Verification
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [inlineVerifiedPhone, setInlineVerifiedPhone] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return alert("New passwords do not match.");
    }
    if (passwordForm.newPassword.length < 6) {
      return alert("New password must be at least 6 characters.");
    }
    
    setIsChangingPassword(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Not authenticated");
      
      const credential = EmailAuthProvider.credential(user.email, passwordForm.oldPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, passwordForm.newPassword);
      
      alert("Password updated successfully!");
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      alert("Error changing password: " + err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

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
  const getDerivedCurrentPhone = () => {
    const isOther = profileForm.countryCode === 'other';
    const actualCountryCode = isOther ? profileForm.customCountryCode.trim() : profileForm.countryCode;
    const digitsOnly = profileForm.mobileNumber.replace(/\D/g, '');
    return `${actualCountryCode}${digitsOnly}`.replace(/\s/g, '');
  };

  const isPhoneChanged = () => {
    const originalPhone = (profile.phone || (profile as any).contact_number || '').replace(/\s/g, '');
    return getDerivedCurrentPhone() !== originalPhone;
  };

  const isPhoneVerifiedInlineBool = () => {
    return inlineVerifiedPhone === getDerivedCurrentPhone();
  };

  const handleVerifyPhone = async () => {
    if (!auth.currentUser) return;
    setOtpLoading(true);
    try {
      const fullNumber = getDerivedCurrentPhone();
      if (!(window as any).recaptchaVerifier) {
        const { RecaptchaVerifier } = await import('firebase/auth');
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'parent-recaptcha', { size: 'invisible' });
      }
      const appVerifier = (window as any).recaptchaVerifier;
      const { linkWithPhoneNumber, unlink } = await import('firebase/auth');
      try {
        await unlink(auth.currentUser, 'phone');
      } catch (e) {} // ignore if not linked or fails
      const confResult = await linkWithPhoneNumber(auth.currentUser, fullNumber, appVerifier);
      setConfirmationResult(confResult);
      setOtpMode(true);
      setCountdown(60);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to send OTP.");
      // Do not clear recaptchaVerifier here, let it be reused
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOTPConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setOtpLoading(true);
    try {
      await confirmationResult.confirm(otp);
      setInlineVerifiedPhone(getDerivedCurrentPhone());
      setOtpMode(false);
      setOtp('');
      setConfirmationResult(null);
      alert("Phone number successfully verified! You can now save your profile.");
    } catch (err: any) {
      console.error(err);
      alert("Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const isOther = profileForm.countryCode === 'other';
      const actualCountryCode = isOther ? profileForm.customCountryCode.trim() : profileForm.countryCode;
      
      if (isOther && !actualCountryCode.startsWith('+')) {
         alert("Custom country code must start with a '+' sign.");
         setIsSavingProfile(false);
         return;
      }

      const expectedDigits = COUNTRY_CODES.find(c => c.code === profileForm.countryCode)?.digits || 0;
      const digitsOnly = profileForm.mobileNumber.replace(/\D/g, '');
      
      if (!isOther && digitsOnly.length !== expectedDigits) {
        alert(`Mobile number for ${profileForm.countryCode} must be exactly ${expectedDigits} digits.`);
        setIsSavingProfile(false);
        return;
      }
      
      if (isOther && digitsOnly.length < 5) {
        alert(`Please enter a valid mobile number.`);
        setIsSavingProfile(false);
        return;
      }

      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const payload = {
         fullName: profileForm.fullName,
         email: profileForm.email,
         contactNumber: `${actualCountryCode}${digitsOnly}`,
         city: profileForm.city,
         state: profileForm.state,
         country: profileForm.country
      };
      
      const result = await updateParentProfile(idToken, payload);
      if (!result.success) throw new Error(result.error);
      
      alert("Profile updated successfully! All your linked children have been synced with the organizations.");
      
      // If the phone number changed but was NOT inline verified, they must be trapped.
      const currentPhone = (profile.phone || (profile as any).contact_number || '').replace(/\s/g, '');
      const newPhone = payload.contactNumber.replace(/\s/g, '');
      if (currentPhone !== newPhone && inlineVerifiedPhone !== newPhone) {
        window.location.href = '/';
      } else if (currentPhone !== newPhone && inlineVerifiedPhone === newPhone) {
        // Just refresh the page normally or update local state so the new verified phone is set in context
        window.location.reload();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResolveTransfer = async (studentUid: string, orgId: string, accept: boolean) => {
    if (accept && (!profileForm.mobileNumber || profileForm.mobileNumber.trim() === '')) {
      setPendingTransfer({ studentUid, orgId, accept });
      setShowMobileModal(true);
      return;
    }

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

  const handleMobileSubmit = async (mobile: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    const idToken = await user.getIdToken(true);
    
    await updateParentProfile(idToken, {
      fullName: profileForm.fullName,
      email: profileForm.email,
      contactNumber: mobile
    });
    setProfileForm(prev => ({ ...prev, contactNumber: mobile }));
    
    if (pendingTransfer) {
      setIsProcessing(true);
      try {
        const result = await resolveTransferRequest(idToken, pendingTransfer.studentUid, pendingTransfer.orgId, pendingTransfer.accept);
        if (!result.success) throw new Error(result.error);
        alert("Transfer Approved!");
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to resolve transfer");
      } finally {
        setIsProcessing(false);
        setPendingTransfer(null);
        window.location.href = '/';
      }
    } else {
      window.location.href = '/';
    }
  };

  const handleUnlinkOrg = async (childUid: string, orgId: string, orgName: string) => {
    if (!window.confirm(`Are you sure you want to unlink from ${orgName}? All pending and completed tasks for this organization will be cleared.`)) {
      return;
    }
    setIsProcessing(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const result = await parentUnlinkChildFromOrg(idToken, childUid, orgId);
      if (!result.success) throw new Error(result.error);
      
      alert("Successfully unlinked from organization.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async (childUid: string, childName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${childName}'s account? This action cannot be undone.`)) {
      return;
    }
    setIsProcessing(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const result = await parentDeleteChildAccount(idToken, childUid);
      if (!result.success) throw new Error(result.error);
      
      alert("Account deleted successfully.");
      setSelectedChildId('profile');
    } catch (err: any) {
      alert("Error: " + err.message);
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
          onClick={() => {
            if (isProfileComplete()) {
              setInternalShowModal(true);
            } else {
              alert("Please complete all mandatory fields in your profile (Full Name, Email, City, State, Country, Phone) and Save before adding a child.");
              setSelectedChildId('profile');
            }
          }}
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
            onClick={() => {
              if (isProfileComplete()) {
                setInternalShowModal(true);
              } else {
                alert("Please complete all mandatory fields in your profile (Full Name, Email, City, State, Country, Phone) and Save before adding a child.");
                setSelectedChildId('profile');
              }
            }}
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
             <div className="space-y-6 animate-fade-in max-w-2xl">
               <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6 sm:p-8">
                 <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                     <User size={28} className="stroke-[3px]" />
                   </div>
                   <div>
                     <div className="flex flex-wrap items-center gap-3 mb-1">
                       <h2 className="text-2xl font-black text-slate-800">My Profile</h2>
                       {profile.kortex_id && (
                         <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-black font-mono">
                           {profile.kortex_id}
                         </span>
                       )}
                       {profile.is_pro && (
                         <span className="px-3 py-1 bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs font-black uppercase flex items-center gap-1.5">
                           PRO ACCOUNT
                           {profile.subscription_end_date && (
                             <span className="opacity-75 font-bold normal-case text-[10px]">
                               (Renews: {new Date(profile.subscription_end_date).toLocaleDateString()})
                             </span>
                           )}
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
                     <div className="flex gap-2">
                       <input 
                         type="email" required
                         value={profileForm.email}
                         onChange={e => {
                           setProfileForm({...profileForm, email: e.target.value});
                           setEmailVerificationSent(false);
                         }}
                         className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                       {isEmailChanged() && !isEmailVerifiedInlineBool() && (
                         <button
                           type="button"
                           onClick={emailVerificationSent ? handleCheckEmailVerification : handleVerifyEmail}
                           disabled={emailVerifying}
                           className={`px-4 py-3 text-white font-bold rounded-xl shadow-md text-xs shrink-0 disabled:opacity-50 ${emailVerificationSent ? 'bg-sky-500 hover:bg-sky-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                         >
                           {emailVerifying ? '...' : emailVerificationSent ? 'Check Link Clicked' : 'Verify'}
                         </button>
                       )}
                       {(!isEmailChanged() || isEmailVerifiedInlineBool()) && (
                         <span className="px-4 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs flex items-center shrink-0">
                           ✓ Verified
                         </span>
                       )}
                     </div>
                     {emailVerificationSent && (
                       <p className="text-xs font-semibold text-sky-600 mt-2">
                         Verification link sent! Please click the link in your email, then click "Check Link Clicked".
                       </p>
                     )}
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     <div>
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">City</label>
                       <input 
                         type="text"
                         value={profileForm.city}
                         onChange={e => setProfileForm({...profileForm, city: e.target.value})}
                         placeholder="e.g. Mumbai"
                         required
                         className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">State / Province</label>
                       <input 
                         type="text"
                         value={profileForm.state}
                         onChange={e => setProfileForm({...profileForm, state: e.target.value})}
                         placeholder="e.g. Maharashtra"
                         required
                         className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Country</label>
                       <input 
                         type="text"
                         value={profileForm.country}
                         onChange={e => setProfileForm({...profileForm, country: e.target.value})}
                         placeholder="e.g. India"
                         required
                         className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Emergency Contact (Phone)</label>
                     <div className="flex gap-2">
                       <select 
                         value={profileForm.countryCode}
                         onChange={e => setProfileForm({...profileForm, countryCode: e.target.value})}
                         className="bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-3 font-bold text-slate-800 outline-none transition-colors cursor-pointer"
                       >
                         {COUNTRY_CODES.map(c => (
                           <option key={c.code} value={c.code}>{c.country} {c.code !== 'other' ? `(${c.code})` : ''}</option>
                         ))}
                       </select>
                       {profileForm.countryCode === 'other' && (
                         <input 
                           type="text" required
                           value={profileForm.customCountryCode}
                           onChange={e => setProfileForm({...profileForm, customCountryCode: e.target.value})}
                           placeholder="+XXX"
                           className="w-20 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-3 font-bold text-slate-800 outline-none transition-colors"
                         />
                       )}
                       <input 
                         type="tel" required
                         value={profileForm.mobileNumber}
                         onChange={e => setProfileForm({...profileForm, mobileNumber: e.target.value.replace(/\D/g, '')})}
                         placeholder="Mobile Number"
                         className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                       {isPhoneChanged() && !isPhoneVerifiedInlineBool() && (
                         <button
                           type="button"
                           onClick={handleVerifyPhone}
                           disabled={otpLoading}
                           className="px-4 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-md text-xs hover:bg-emerald-600 disabled:opacity-50 shrink-0"
                         >
                           {otpLoading ? '...' : 'Verify'}
                         </button>
                       )}
                       {(!isPhoneChanged() || isPhoneVerifiedInlineBool()) && (
                         <span className="px-4 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs flex items-center shrink-0">
                           ✓ Verified
                         </span>
                       )}
                     </div>
                     <div id="parent-recaptcha" className="mt-2"></div>
                     
                     {otpMode && (
                       <div className="mt-3 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-3">
                         <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Enter 6-Digit OTP</label>
                         <div className="flex gap-2">
                           <input
                             type="text" required maxLength={6}
                             value={otp}
                             onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                             placeholder="123456"
                             className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-emerald-500 text-center tracking-widest"
                           />
                           <button
                             type="button"
                             onClick={handleOTPConfirm}
                             disabled={otpLoading || otp.length < 6}
                             className="px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50 text-sm"
                           >
                             Confirm
                           </button>
                         </div>
                         <div className="flex justify-between items-center px-1">
                           <button
                             type="button"
                             disabled={countdown > 0 || otpLoading}
                             onClick={handleVerifyPhone}
                             className="text-xs font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-50"
                           >
                             {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                           </button>
                           <button
                             type="button"
                             onClick={() => {
                               setOtpMode(false);
                               setConfirmationResult(null);
                               // Do not clear recaptchaVerifier here, let it be reused
                             }}
                             className="text-xs font-bold text-slate-400 hover:text-slate-600"
                           >
                             Cancel
                           </button>
                         </div>
                       </div>
                     )}
                     
                     <p className="text-xs font-semibold text-slate-400 mt-2">This number is securely shared with organizations (eg. school) in case of emergencies.</p>
                   </div>
                   <div className="pt-4 border-t-2 border-slate-100">
                     <button 
                       type="submit"
                       disabled={isSavingProfile || (isPhoneChanged() && !isPhoneVerifiedInlineBool()) || (isEmailChanged() && !isEmailVerifiedInlineBool())}
                       className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                     >
                       {isSavingProfile ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />} 
                       {isSavingProfile ? 'Syncing securely...' : 'Save & Sync Details'}
                     </button>
                   </div>
                 </form>
               </div>

               <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6 sm:p-8">
                 <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                     <ShieldCheck size={28} className="stroke-[3px]" />
                   </div>
                   <div>
                     <h2 className="text-2xl font-black text-slate-800">Change Password</h2>
                     <p className="text-sm font-semibold text-slate-500">Update your parent account password.</p>
                   </div>
                 </div>
                 
                 <form onSubmit={handleChangePassword} className="space-y-6">
                   <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Old Password</label>
                     <input 
                       type="password" required
                       value={passwordForm.oldPassword}
                       onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                       className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                     <input 
                       type="password" required minLength={6}
                       value={passwordForm.newPassword}
                       onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                       className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Re-enter New Password</label>
                     <input 
                       type="password" required minLength={6}
                       value={passwordForm.confirmPassword}
                       onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                       className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                     />
                   </div>
                   <div className="pt-4 border-t-2 border-slate-100">
                     <button 
                       type="submit"
                       disabled={isChangingPassword}
                       className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                     >
                       {isChangingPassword ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />} 
                       {isChangingPassword ? 'Updating...' : 'Change Password'}
                     </button>
                   </div>
                 </form>
               </div>
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
                       {selectedChild.is_pro && (
                         <span className="px-3 py-1 bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs font-black uppercase flex items-center gap-1.5">
                           PRO ACCOUNT
                           {selectedChild.subscription_end_date && (
                             <span className="opacity-75 font-bold normal-case text-[10px]">
                               (Renews: {new Date(selectedChild.subscription_end_date).toLocaleDateString()})
                             </span>
                           )}
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
              
              {/* DANGER ZONE: Unlink and Delete Account */}
              <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-6 sm:p-8 animate-fade-in mt-6">
                <h3 className="text-xl font-black text-red-800 mb-4 flex items-center gap-2"><AlertCircle size={24} /> Danger Zone</h3>
                
                {selectedChild.org_ids && selectedChild.org_ids.length > 0 && (
                  <div className="mb-6 border-b-2 border-red-200 pb-6">
                    <h4 className="font-bold text-red-900 mb-2">Linked Organizations</h4>
                    <div className="space-y-3">
                      {Object.entries(selectedChild.org_links || {}).map(([orgId, link]) => (
                        <div key={orgId} className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100">
                          <div>
                            <p className="font-black text-slate-800">{link.org_name}</p>
                            <p className="text-xs font-bold text-slate-500">{link.grade} {link.section ? `- ${link.section}` : ''}</p>
                          </div>
                          <button 
                            disabled={isProcessing}
                            onClick={() => handleUnlinkOrg(selectedChild.uid, orgId, link.org_name)}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-black rounded-lg transition-colors"
                          >
                            Unlink
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-red-700 mt-3 font-semibold">
                      Unlinking will remove the child from the organization and clear all pending/completed tasks for that organization. Lesson progress will remain intact.
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-bold text-red-900 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-700 font-semibold mb-4">
                    Permanently delete {selectedChild.full_name}&apos;s account. This action cannot be undone and all lesson progress will be lost.
                  </p>
                  <button 
                    disabled={isProcessing}
                    onClick={() => handleDeleteAccount(selectedChild.uid, selectedChild.full_name)}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-md transition-colors"
                  >
                    Delete Child Account
                  </button>
                </div>
              </div>

            </div>
          ) : null}
        </>
      )}

      {internalShowModal && (
        <AddChildModal 
          onClose={() => setInternalShowModal(false)} 
          onChildCreated={() => setInternalShowModal(false)}
          parentContactNumber={`${profileForm.countryCode === 'other' ? profileForm.customCountryCode.trim() : profileForm.countryCode} ${profileForm.mobileNumber}`}
          onContactUpdate={handleMobileSubmit}
        />
      )}

      <RequireMobileModal 
        isOpen={showMobileModal}
        onClose={() => {
          setShowMobileModal(false);
          setPendingTransfer(null);
        }}
        onSubmit={async (mobile) => {
          await handleMobileSubmit(mobile);
          setShowMobileModal(false);
        }}
      />
    </div>
  );
}

