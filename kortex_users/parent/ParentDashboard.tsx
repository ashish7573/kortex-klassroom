"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../backend_configurations/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { ParentProfile, StudentProfile } from '../../types/user';
import { 
  Users, Plus, ShieldCheck, Heart, Building, CheckCircle2, 
  AlertCircle, UserPlus, RefreshCw, User, Rocket, ArrowRight, ArrowUpRight, X, Check, Bell,
  Mail, Phone, Info, Lock, Sparkles
} from 'lucide-react';
import ChildAcademicView from './ChildAcademicView';
import AddChildModal from './AddChildModal';
import RequireMobileModal from './RequireMobileModal';
import { resolveTransferRequest, updateParentProfile, parentUnlinkChildFromOrg, parentDeleteChildAccount, registerCourseInterest } from '../../app/actions/student';
import { KORTEX_COURSES, KortexCourse } from '../../kortex_landing_page/koursesData';
import { KortexCourseCard } from '../../kortex_landing_page/components/KortexCourseCard';
import ModalPortal from '../../components/ModalPortal';

interface ParentDashboardProps {
  profile: ParentProfile;
  onExploreTier?: (tierId: string) => void;
}

export default function ParentDashboard({ profile: initialProfile, onExploreTier }: ParentDashboardProps) {
  const [profile, setProfile] = useState<ParentProfile>(initialProfile);
  const [internalShowModal, setInternalShowModal] = useState(false);
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string>('profile');
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Kortex Kourses modal state
  const [selectedCourseModal, setSelectedCourseModal] = useState<KortexCourse | null>(null);
  const [modalTargetChildUid, setModalTargetChildUid] = useState<string>('');
  const [isRegisteringCourse, setIsRegisteringCourse] = useState(false);
  const [courseRegisteredMsg, setCourseRegisteredMsg] = useState<string | null>(null);

  const handleOpenCourseModal = (course: KortexCourse) => {
    setSelectedCourseModal(course);
    setCourseRegisteredMsg(null);
    if (selectedChildId && selectedChildId !== 'profile') {
      setModalTargetChildUid(selectedChildId);
    } else if (children.length > 0) {
      setModalTargetChildUid(children[0].uid);
    }
  };

  const handleConfirmCourseInterest = async () => {
    if (!selectedCourseModal) return;
    setIsRegisteringCourse(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please log in first");
      const idToken = await user.getIdToken();
      const targetChild = children.find(c => c.uid === modalTargetChildUid);

      const res = await registerCourseInterest(idToken, {
        programId: selectedCourseModal.id,
        programTitle: selectedCourseModal.title,
        targetChildUid: modalTargetChildUid,
        targetChildName: targetChild?.full_name || 'Child'
      });

      if (res.success) {
        setCourseRegisteredMsg(`🎉 Seat Reserved! Interest registered for ${targetChild?.full_name || 'your child'}. We will notify you when enrollment opens.`);
      } else {
        alert("Failed to register interest: " + res.error);
      }
    } catch (e: any) {
      alert(e.message || "Something went wrong");
    } finally {
      setIsRegisteringCourse(false);
    }
  };

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);
  
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
    country: (profile as any).country || 'India'
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


  const checkProfileComplete = (p: ParentProfile) => {
    return !!(
      p.full_name?.trim() &&
      p.email?.trim() &&
      (p as any).city?.trim() &&
      (p as any).state?.trim() &&
      (p as any).country?.trim()
    );
  };

  const isProfileComplete = () => checkProfileComplete(profile);

  // Email verification enforcement (Parent can only add/claim children when email is verified)
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(() => auth.currentUser?.emailVerified ?? false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [showWhyPhoneModal, setShowWhyPhoneModal] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      setIsEmailVerified(auth.currentUser.emailVerified);
    }
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setIsEmailVerified(user.emailVerified);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCheckEmailStatus = async () => {
    if (!auth.currentUser) return;
    setIsCheckingEmail(true);
    try {
      await auth.currentUser.reload();
      const verified = auth.currentUser.emailVerified;
      setIsEmailVerified(verified);
      if (verified) {
        setShowEmailVerifyModal(false);
        alert("Email verified successfully! You can now create or claim your child's account.");
      } else {
        alert("Your email is not verified yet. Please check your inbox (and spam folder) for the verification link.");
      }
    } catch (err: any) {
      console.error("Error checking verification:", err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    setIsCheckingEmail(true);
    try {
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(auth.currentUser);
      alert(`Verification link re-sent to ${auth.currentUser.email}. Please check your inbox.`);
    } catch (err: any) {
      console.error("Error resending email:", err);
      alert(err.message || "Failed to resend verification email.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const isReadyForChildren = isProfileComplete() && isEmailVerified;

  const handleOpenAddChild = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload().catch(() => {});
      const verified = auth.currentUser.emailVerified;
      setIsEmailVerified(verified);
      if (!verified) {
        setShowEmailVerifyModal(true);
        return;
      }
    }

    if (!isProfileComplete()) {
      setSelectedChildId('profile');
      alert("Please fill in your City, State, and Country in your profile below before adding a child.");
      const locElement = document.getElementById('parent-location-section');
      if (locElement) {
        locElement.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setInternalShowModal(true);
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
      
      // Auto-select child on initial load only if profile is complete and children exist; otherwise default to profile
      if (!hasInitializedSelection) {
        if (data.length > 0 && checkProfileComplete(profile)) {
          setSelectedChildId(data[0].uid);
        } else {
          setSelectedChildId('profile');
        }
        setHasInitializedSelection(true);
      } else if (data.length === 0) {
        setSelectedChildId('profile');
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
    if (newPin.length !== 6) return alert("PIN must be exactly 6 digits.");
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
    if (!digitsOnly) return '';
    return `${actualCountryCode}${digitsOnly}`.replace(/\s/g, '');
  };

  const isPhoneChanged = () => {
    const originalPhone = (profile.phone || (profile as any).contact_number || '').replace(/\s/g, '');
    return getDerivedCurrentPhone() !== originalPhone;
  };

  const isPhoneVerifiedInlineBool = () => {
    const currentDerived = getDerivedCurrentPhone();
    if (!currentDerived) return true;
    return inlineVerifiedPhone === currentDerived;
  };

  const handleVerifyPhone = async () => {
    if (!auth.currentUser) return;
    const fullNumber = getDerivedCurrentPhone();
    if (!fullNumber) {
      alert("Please enter a valid mobile number first.");
      return;
    }
    setOtpLoading(true);
    try {
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
      const verified = getDerivedCurrentPhone();
      setInlineVerifiedPhone(verified);
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
      const digitsOnly = profileForm.mobileNumber.replace(/\D/g, '');
      let finalContact = '';

      if (digitsOnly.length > 0) {
        if (isOther && !actualCountryCode.startsWith('+')) {
           alert("Custom country code must start with a '+' sign.");
           setIsSavingProfile(false);
           return;
        }

        const expectedDigits = COUNTRY_CODES.find(c => c.code === profileForm.countryCode)?.digits || 0;
        
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

        finalContact = `${actualCountryCode}${digitsOnly}`;
      }

      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const payload = {
         fullName: profileForm.fullName,
         email: profileForm.email,
         contactNumber: finalContact,
         city: profileForm.city,
         state: profileForm.state,
         country: profileForm.country
      };
      
      const result = await updateParentProfile(idToken, payload);
      if (!result.success) throw new Error(result.error);
      
      setProfile(prev => ({
        ...prev,
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.contactNumber,
        city: payload.city,
        state: payload.state,
        country: payload.country,
      }));

      alert("Profile updated successfully!");
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
          onClick={handleOpenAddChild}
          className={`px-6 py-2.5 font-black rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            isReadyForChildren 
              ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-300'
          }`}
          title={!isReadyForChildren ? "Complete your profile & verify email to add child" : "Add or Claim a Child"}
        >
          <Plus size={18} />
          <span>Add / Claim Child</span>
          {!isReadyForChildren && (
            <span className="ml-1 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md uppercase font-black tracking-wider">
              Locked
            </span>
          )}
        </button>
      </div>

      {/* ONBOARDING CHECKLIST / CELEBRATORY BANNER */}
      {!isReadyForChildren ? (
        <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/90 border-2 border-amber-200 rounded-3xl p-5 sm:p-6 shadow-xs animate-fade-in space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  Action Required • Profile Setup
                </span>
                <h3 className="text-base sm:text-lg font-black text-amber-950">
                  Complete Setup to Add Your Children
                </h3>
              </div>
              <p className="text-xs font-semibold text-amber-800/90 mt-1 max-w-2xl">
                To protect student privacy and configure their academic portal, please verify your email and complete your location details below.
              </p>
            </div>
          </div>

          {/* Checklist Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Step 1: Email Verification */}
            <div className={`p-4 rounded-2xl border-2 flex flex-col justify-between gap-3 transition-all ${
              isEmailVerified 
                ? 'bg-emerald-50/70 border-emerald-200' 
                : 'bg-white border-amber-200 shadow-2xs'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isEmailVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isEmailVerified ? <CheckCircle2 size={18} /> : <Mail size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800">1. Email Verification</span>
                    {isEmailVerified ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Verified</span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Required</span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    {isEmailVerified 
                      ? `${auth.currentUser?.email || profile.email} is verified.` 
                      : `Verification email sent to ${auth.currentUser?.email || profile.email}`}
                  </p>
                </div>
              </div>
              {!isEmailVerified && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isCheckingEmail}
                    onClick={handleResendVerificationEmail}
                    className="flex-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Resend Link
                  </button>
                  <button
                    type="button"
                    disabled={isCheckingEmail}
                    onClick={handleCheckEmailStatus}
                    className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingEmail ? 'Checking...' : "I've Verified"}
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Location Profile */}
            <div className={`p-4 rounded-2xl border-2 flex flex-col justify-between gap-3 transition-all ${
              isProfileComplete() 
                ? 'bg-emerald-50/70 border-emerald-200' 
                : 'bg-white border-amber-200 shadow-2xs'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isProfileComplete() ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isProfileComplete() ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800">2. Profile Location</span>
                    {isProfileComplete() ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Complete</span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Required</span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    {isProfileComplete() 
                      ? `${profile.city}, ${profile.state}, ${profile.country}`
                      : "City, State, and Country needed for local curriculum and safety."}
                  </p>
                </div>
              </div>
              {!isProfileComplete() && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChildId('profile');
                    const el = document.getElementById('parent-location-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Complete Location Below ↓
                </button>
              )}
            </div>
          </div>
        </div>
      ) : children.length === 0 ? (
        /* Profile ready, no children added yet: celebratory CTA */
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-100 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles size={28} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-1">
                ✓ Profile Verified & Ready
              </div>
              <h3 className="text-xl font-black text-slate-900">Add Your First Child to Get Started</h3>
              <p className="text-xs font-semibold text-slate-600 mt-0.5 max-w-xl">
                Your parent profile is fully set up! Create a student profile with a unique Kortex ID and PIN so your child can access interactive learning tools and courses.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenAddChild}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-sm rounded-xl shadow-md transition-all shrink-0 flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
          >
            <Plus size={18} /> Add Child Account
          </button>
        </div>
      ) : null}

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

            {/* Quick Add Child Tab in Switcher */}
            <button
              onClick={handleOpenAddChild}
              className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                isReadyForChildren
                  ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
              title={!isReadyForChildren ? "Complete profile & verify email first" : "Add or Claim Child"}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isReadyForChildren ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                <Plus size={16} />
              </div>
              <span className="font-black text-xs">
                {children.length === 0 ? 'Add First Child' : 'Add Child'}
              </span>
            </button>
          </div>

          {/* Render Profile OR Selected Child */}
          {selectedChildId === 'profile' || !selectedChild ? (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in items-start">
               <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6 sm:p-8">
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
                       {isProfileComplete() ? (
                         <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-black flex items-center gap-1.5">
                           <CheckCircle2 size={13} className="text-emerald-600" />
                           Profile Complete
                         </span>
                       ) : (
                         <button
                           type="button"
                           onClick={() => {
                             const el = document.getElementById('parent-location-section');
                             if (el) el.scrollIntoView({ behavior: 'smooth' });
                           }}
                           className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                         >
                           <AlertCircle size={13} className="text-amber-600" />
                           Location Required • Fill below
                         </button>
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
                     <div className="flex items-center justify-between mb-2">
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                         Email Address *
                       </label>
                       {isEmailVerified ? (
                         <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                           <CheckCircle2 size={12} className="text-emerald-600" /> Verified
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                           <AlertCircle size={12} className="text-amber-600" /> Pending Verification
                         </span>
                       )}
                     </div>
                     <div className="flex flex-col sm:flex-row gap-2">
                       <input 
                         type="email" required
                         value={profileForm.email}
                         onChange={e => {
                           setProfileForm({...profileForm, email: e.target.value});
                           setEmailVerificationSent(false);
                         }}
                         className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                       {!isEmailChanged() && !isEmailVerified && (
                         <div className="flex gap-2 shrink-0">
                           <button
                             type="button"
                             disabled={isCheckingEmail}
                             onClick={handleResendVerificationEmail}
                             className="px-3 py-2 sm:px-4 sm:py-3 bg-white hover:bg-amber-50 active:scale-95 text-amber-900 font-bold rounded-xl border border-amber-300 shadow-2xs text-xs shrink-0 cursor-pointer transition-all disabled:opacity-50"
                           >
                             Resend Link
                           </button>
                           <button
                             type="button"
                             disabled={isCheckingEmail}
                             onClick={handleCheckEmailStatus}
                             className="px-3 py-2 sm:px-4 sm:py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl shadow-md text-xs shrink-0 cursor-pointer transition-all disabled:opacity-50"
                           >
                             {isCheckingEmail ? 'Checking...' : "I've Verified"}
                           </button>
                         </div>
                       )}
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
                     </div>
                     <p className="text-xs font-semibold text-slate-500 mt-2">
                       {isEmailVerified 
                         ? "Verification link will be sent to this email if updated. Email verification is required to create child accounts."
                         : "Verification link sent to this email. You can only create child accounts once your email is verified."}
                     </p>
                     {emailVerificationSent && isEmailChanged() && (
                       <p className="text-xs font-semibold text-sky-600 mt-1">
                         Verification link sent to your updated address! Please click the link in your email, then click "Check Link Clicked".
                       </p>
                     )}
                   </div>
                   <div id="parent-location-section" className="scroll-mt-6 pt-2">
                     <div className="flex items-center justify-between mb-2">
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                         Location Details (Required to add children)
                       </label>
                       {profileForm.city && profileForm.state && profileForm.country ? (
                         <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                           <CheckCircle2 size={12} className="text-emerald-600" /> Complete
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                           <AlertCircle size={12} className="text-amber-600" /> Incomplete
                         </span>
                       )}
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div>
                         <label className="block text-[11px] font-bold text-slate-500 mb-1">City *</label>
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
                         <label className="block text-[11px] font-bold text-slate-500 mb-1">State / Province *</label>
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
                         <label className="block text-[11px] font-bold text-slate-500 mb-1">Country *</label>
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
                   </div>
                   
                   <div>
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                         <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                           Emergency Contact (Phone)
                         </label>
                         {profile.phone ? (
                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                             <Check size={12} /> Verified
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                             Pending
                           </span>
                         )}
                       </div>
                       <button
                         type="button"
                         onClick={() => setShowWhyPhoneModal(true)}
                         className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 underline-offset-2 cursor-pointer transition-colors"
                       >
                         Why Phone?
                       </button>
                     </div>
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
                           type="text"
                           value={profileForm.customCountryCode}
                           onChange={e => setProfileForm({...profileForm, customCountryCode: e.target.value})}
                           placeholder="+XXX"
                           className="w-20 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-3 font-bold text-slate-800 outline-none transition-colors"
                         />
                       )}
                       <input 
                         type="tel"
                         value={profileForm.mobileNumber}
                         onChange={e => setProfileForm({...profileForm, mobileNumber: e.target.value.replace(/\D/g, '')})}
                         placeholder="Mobile Number (Optional)"
                         className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                       {profileForm.mobileNumber.trim().length > 0 && isPhoneChanged() && !isPhoneVerifiedInlineBool() && (
                         <button
                           type="button"
                           onClick={handleVerifyPhone}
                           disabled={otpLoading}
                           className="px-4 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-md text-xs hover:bg-emerald-600 active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer transition-all"
                         >
                           {otpLoading ? '...' : 'Verify'}
                         </button>
                       )}
                       {profileForm.mobileNumber.trim().length > 0 && (!isPhoneChanged() || isPhoneVerifiedInlineBool()) && (
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
                     
                     <p className="text-xs font-semibold text-slate-400 mt-2">
                       Emergency Contact is shared strictly with the school/institute where your child is enrolled. Once verified, you can also use this mobile number to log in.
                     </p>
                   </div>
                   <div className="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                     <button 
                       type="submit"
                       disabled={isSavingProfile || (isPhoneChanged() && !isPhoneVerifiedInlineBool()) || (isEmailChanged() && !isEmailVerifiedInlineBool())}
                       className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                     >
                       {isSavingProfile ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />} 
                       {isSavingProfile ? 'Saving profile...' : 'Save & Complete Profile'}
                     </button>
                     <span className="text-xs text-slate-400 font-medium">
                       * Required fields must be completed to add child accounts
                     </span>
                   </div>
                 </form>
               </div>

               <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6 sm:p-8">
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
                       className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                     >
                       {isChangingPassword ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />} 
                       {isChangingPassword ? 'Updating...' : 'Change Password'}
                     </button>
                   </div>
                 </form>
               </div>
             </div>
          ) : (
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
                            maxLength={6}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="e.g. 123456"
                            className="w-full bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={isUpdatingPin || newPin.length !== 6}
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

              {/* SPECIALIZED PROGRAMS & KORTEX KOURSES CAROUSEL */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 sm:p-7 shadow-xs space-y-4 mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <Rocket className="text-amber-500" size={22} />
                      Specialized Programs & Kourses for {selectedChild.full_name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Cross-grade extracurriculars in Coding, Vedic Math, Space, and Logic. Select one to boost {selectedChild.full_name}&apos;s learning.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onExploreTier?.('kourses')}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors shrink-0 w-fit cursor-pointer"
                  >
                    <span>Explore All Kourses</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0">
                  {KORTEX_COURSES.map(course => (
                    <KortexCourseCard
                      key={course.id}
                      course={course}
                      size="compact"
                      price="₹499"
                      ctaText="Pre-Enroll"
                      onClick={() => handleOpenCourseModal(course)}
                      onEnroll={() => handleOpenCourseModal(course)}
                      className="snap-start shrink-0 w-[245px] sm:w-[265px]"
                    />
                  ))}
                </div>
              </div>
              
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
          )}
        </>
      )}

      {internalShowModal && (
        <AddChildModal 
          onClose={() => setInternalShowModal(false)} 
          onChildCreated={() => setInternalShowModal(false)}
          parentContactNumber={`${profileForm.countryCode === 'other' ? profileForm.customCountryCode.trim() : profileForm.countryCode} ${profileForm.mobileNumber}`}
          onContactUpdate={handleMobileSubmit}
          isPro={Boolean(profile.is_pro)}
          childrenCount={children.length}
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

      {/* KORTEX KOURSE PREVIEW & CHILD SELECTION MODAL */}
      {selectedCourseModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-[2rem] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto flex flex-col">
              
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setSelectedCourseModal(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4 pr-6">
                <span className="text-4xl">{selectedCourseModal.icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${selectedCourseModal.badgeColor}`}>
                      {selectedCourseModal.gradeGroup}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {selectedCourseModal.ageBand}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 leading-snug">
                    {selectedCourseModal.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-4">
                {selectedCourseModal.description}
              </p>

              {/* Key Curriculum Highlights */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  Program Highlights & Outcomes
                </h4>
                <ul className="space-y-1.5">
                  {selectedCourseModal.learningOutcomes.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                      <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Child Selector & Actions */}
              {courseRegisteredMsg ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-black text-sm">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span>{courseRegisteredMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCourseModal(null)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {children.length > 0 ? (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                        Select Child to Enroll:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {children.map(c => {
                          const isSelected = modalTargetChildUid === c.uid;
                          return (
                            <div
                              key={c.uid}
                              onClick={() => setModalTargetChildUid(c.uid)}
                              className={`p-2.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div>
                                <div className="font-extrabold text-xs">{c.full_name}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                  {c.grade || 'Foundational'}
                                </div>
                              </div>
                              {isSelected && <CheckCircle2 size={16} className="text-indigo-600" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
                      Add a child account to your parent portal to enroll in this course.
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isRegisteringCourse || children.length === 0}
                      onClick={handleConfirmCourseInterest}
                      className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isRegisteringCourse ? (
                        <span>Reserving Seat...</span>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Reserve Seat for {children.find(c => c.uid === modalTargetChildUid)?.full_name || 'Child'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCourseModal(null)}
                      className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-slate-400 font-semibold">
                    Pre-enrolling reserves priority seat allocation and early-bird notifications.
                  </p>
                </div>
              )}

            </div>
          </div>
        </ModalPortal>
      )}

      {/* WHY PHONE MODAL */}
      {showWhyPhoneModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
              <button 
                type="button"
                onClick={() => setShowWhyPhoneModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">Why We Ask For Your Phone</h3>
                  <p className="text-xs text-slate-400 font-semibold">Strictly protected & optional</p>
                </div>
              </div>

              <div className="space-y-3.5 mb-6">
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <h4 className="text-xs font-black text-slate-800">1. Emergency Contact for Your Child</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    In case of health alerts, safety updates, or urgent school notices, this number is shared strictly with the school or educational institution your child is enrolled with.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket size={16} className="text-indigo-600 shrink-0" />
                    <h4 className="text-xs font-black text-slate-800">2. Convenient 1-Tap Login</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Once verified, you can sign in anytime using your <strong>Mobile Number + 6-Digit PIN</strong> without having to type your email address every time.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={16} className="text-slate-700 shrink-0" />
                    <h4 className="text-xs font-black text-slate-800">3. Strict Privacy Guarantee (Zero Spam)</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    We comply fully with COPPA and the DPDP Act. We never share or sell your phone number for marketing or promotional campaigns.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowWhyPhoneModal(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* EMAIL VERIFICATION REQUIRED MODAL */}
      {showEmailVerifyModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative text-center">
              <button 
                type="button"
                onClick={() => setShowEmailVerifyModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border-2 border-amber-100">
                <Mail size={32} />
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-2">Verify Email to Add Children</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                To safeguard student data privacy and comply with COPPA / DPDP regulations, only parents with a verified email address can create or claim child profiles.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-6">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Verification link sent to</span>
                <span className="text-xs font-black text-slate-800">{auth.currentUser?.email || profile.email}</span>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={isCheckingEmail}
                  onClick={handleCheckEmailStatus}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>{isCheckingEmail ? 'Checking Verification...' : "I've Verified (Check Status)"}</span>
                </button>

                <button
                  type="button"
                  disabled={isCheckingEmail}
                  onClick={handleResendVerificationEmail}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Resend Verification Email
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

