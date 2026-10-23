"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../../backend_configurations/firebase';
import { useAuth } from '../../hooks/useAuth';
import { resolveLoginEmail, requestPinResetForIdentifier, syncUserSessionAndProfile } from '../../app/actions/auth';
import QuoteInquiryModal from './QuoteInquiryModal';
import ModalPortal from '../../components/ModalPortal';
import { 
  X, 
  Lock, 
  Mail, 
  KeyRound, 
  User, 
  Heart, 
  Building2, 
  CheckCircle2,
  Eye,
  EyeOff, 
  ArrowRight,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  Send,
  Check
} from 'lucide-react';

interface UnifiedAuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'signin' | 'signup';
  authMessage?: string;
}

export default function UnifiedAuthModal({ 
  onClose,
  onSuccess,
  initialMode = 'signin',
  authMessage
}: UnifiedAuthModalProps) {
  const { resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode as any);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In State (Accepts Email or Mobile Number or Student Username)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Parent Sign Up State (Pure Email + 6-Digit PIN)
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPin, setParentPin] = useState('');
  const [showParentPin, setShowParentPin] = useState(false);

  // Forgot Password / PIN State
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // Status & Modals
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quickClaimCode, setQuickClaimCode] = useState('');

  // Sign Up Category: Parent vs Educator/Institutes
  const [signUpRole, setSignUpRole] = useState<'parent' | 'educator'>('parent');

  // Educator / Institutional Inquiry State
  const [eduOrgName, setEduOrgName] = useState('');
  const [eduContactName, setEduContactName] = useState('');
  const [eduEmail, setEduEmail] = useState('');
  const [eduPhone, setEduPhone] = useState('');
  const [eduOrgType, setEduOrgType] = useState<'school' | 'coaching' | 'ngo' | 'other'>('school');
  const [eduStudentCount, setEduStudentCount] = useState<string>('');
  const [selectedInnovations, setSelectedInnovations] = useState<string[]>([]);
  const [eduSubmitted, setEduSubmitted] = useState(false);
  const [isSubmittingEdu, setIsSubmittingEdu] = useState(false);

  const KORTEX_INNOVATIONS = [
    {
      id: 'individualized_learning',
      title: 'Guaranteed Individualized Learning',
      description: 'Empowers teachers to automatically track progress, assign custom homework, and provide tailored feedback to every single child.'
    },
    {
      id: 'multimodal_pedagogy',
      title: '360° Multi-Modal Pedagogy',
      description: 'Goes beyond digital screens by blending interactive conceptualizers with physical games, arts, crafts, and performing arts for all-round development ensuring Quality Education.'
    },
    {
      id: 'tier_architecture',
      title: 'The 5-Tier Lesson Architecture',
      description: 'A rigorously researched lesson structure and custom designed Learning tools, equips teachers with the exactly what they need to guide students from concept introduction to true mastery.'
    },
    {
      id: 'unified_ecosystem',
      title: 'The Unified Educational Ecosystem',
      description: 'A single, frictionless platform that seamlessly connects school management, teachers, students, and parents in real-time.'
    }
  ];

  const toggleInnovation = (title: string) => {
    setSelectedInnovations(prev => {
      if (prev.includes(title)) {
        return prev.filter(t => t !== title);
      }
      if (prev.length >= 2) {
        return [prev[1], title];
      }
      return [...prev, title];
    });
  };

  const handleEduSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEdu(true);
    setErrorMsg('');

    try {
      if (!eduOrgName.trim() || !eduContactName.trim() || !eduEmail.trim() || !eduPhone.trim() || !eduStudentCount.trim()) {
        throw new Error("Please fill in all required fields.");
      }

      await addDoc(collection(db, 'quote_inquiries'), {
        organization_name: eduOrgName.trim(),
        contact_person: eduContactName.trim(),
        email: eduEmail.trim().toLowerCase(),
        phone: eduPhone.trim(),
        org_type: eduOrgType,
        estimated_students: Number(eduStudentCount) || 0,
        selected_innovations: selectedInnovations,
        message: selectedInnovations.length > 0 ? `Selected Innovations: ${selectedInnovations.join('; ')}` : '',
        status: 'new',
        created_at: new Date().toISOString()
      });

      setEduSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting institutional request:", err);
      setErrorMsg(err.message || "Failed to submit request. Please try again.");
    } finally {
      setIsSubmittingEdu(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLER: Sign In (Email or Verified Mobile Number or Student Username)
  // --------------------------------------------------------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (!loginIdentifier.trim() || !loginPassword.trim()) {
        throw new Error("Please enter your identifier and PIN / password.");
      }

      // Resolve identifier (mobile number, email, or student username)
      const resolveRes = await resolveLoginEmail(loginIdentifier);
      if (!resolveRes.success || !resolveRes.email) {
        throw new Error(resolveRes.error || "Could not find an account with this identifier.");
      }

      const emailToAuth = resolveRes.email;
      const sessionToken = Math.random().toString(36).substring(2, 15);

      const cred = await signInWithEmailAndPassword(auth, emailToAuth, loginPassword.trim());

      // Sync and self-heal user session and profile on server
      try {
        const idToken = await cred.user.getIdToken();
        await syncUserSessionAndProfile(idToken, sessionToken);
      } catch (err) {
        console.warn("Profile sync warning during sign-in:", err);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('kortex_session_token', sessionToken);
        localStorage.setItem(`session_token_${cred.user.uid}`, sessionToken);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error("Sign in failed:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg("Incorrect credentials. Please verify your email/mobile and PIN.");
      } else {
        setErrorMsg(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLER: Parent Sign Up (Pure Email + 6-Digit PIN, Instant Access)
  // --------------------------------------------------------------------------
  const handleParentSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (!parentName.trim() || !parentEmail.trim() || !parentPin.trim()) {
        throw new Error("Please fill in all required fields.");
      }

      if (parentPin.trim().length < 6) {
        throw new Error("PIN must be at least 6 digits or characters.");
      }

      const cleanEmail = parentEmail.trim().toLowerCase();
      const sessionToken = Math.random().toString(36).substring(2, 15);

      // Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, parentPin.trim());

      // Dispatch email verification link so parent can verify at convenience
      try {
        await sendEmailVerification(cred.user);
      } catch (err) {
        console.warn("Could not dispatch email verification:", err);
      }

      // Create Parent Profile in Firestore via elevated server action
      const idToken = await cred.user.getIdToken();
      const syncRes = await syncUserSessionAndProfile(idToken, sessionToken, {
        full_name: parentName.trim()
      });

      if (!syncRes.success) {
        throw new Error(syncRes.error || "Failed to finalize account setup on server.");
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('kortex_session_token', sessionToken);
        localStorage.setItem(`session_token_${cred.user.uid}`, sessionToken);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Sign up error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg("An account with this email already exists. Please sign in instead.");
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg("Please choose a stronger 6-digit PIN.");
      } else {
        setErrorMsg(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLER: Google Auth (1-Click Instant Sign In / Sign Up)
  // --------------------------------------------------------------------------
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      const sessionToken = Math.random().toString(36).substring(2, 15);

      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();

      const syncRes = await syncUserSessionAndProfile(idToken, sessionToken, {
        full_name: cred.user.displayName || 'Parent User'
      });

      if (!syncRes.success) {
        throw new Error(syncRes.error || "Failed to sync profile with server.");
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('kortex_session_token', sessionToken);
        localStorage.setItem(`session_token_${cred.user.uid}`, sessionToken);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error("Google auth error:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || "Failed to authenticate with Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLER: Password Reset (Email-Only)
  // --------------------------------------------------------------------------
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const cleanInput = resetIdentifier.trim().toLowerCase();
      if (!cleanInput) {
        throw new Error("Please enter your registered email address.");
      }

      if (!cleanInput.includes('@') || cleanInput.endsWith('@student.kortex.app') || cleanInput.startsWith('stu_') || cleanInput.startsWith('stu-')) {
        throw new Error("Student PINs cannot be reset by email. Please ask your class teacher or school administrator directly at school to view or reset your PIN.");
      }

      const res = await requestPinResetForIdentifier(cleanInput);
      if (!res.success) {
        throw new Error(res.error || "Failed to send reset link.");
      }

      setResetSuccessMsg(`A password reset link has been dispatched to ${res.targetEmail}. Please check your inbox.`);
      setResetSent(true);
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setErrorMsg(err.message || "Failed to send password reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ModalPortal>
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-3.5 sm:p-6">
        <div className="bg-white rounded-[24px] sm:rounded-3xl max-w-md w-full shadow-2xl relative border-2 border-slate-100/90 flex flex-col max-h-[92vh] overflow-hidden">
          
          {/* Close Button: Fixed in the modal frame, stays consistent on all screen sizes */}
          <button 
            type="button"
            onClick={onClose} 
            aria-label="Close dialog"
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-100/90 hover:bg-slate-200 active:scale-95 rounded-full transition-all cursor-pointer shadow-xs"
          >
            <X size={18} />
          </button>

          <div className="p-5 sm:p-7 pt-6 sm:pt-7 overflow-y-auto flex-1">
            
            {/* Top Brand Header: Kortex Klassroom with curved soft logo border */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-5 pr-8">
              <div className="p-1 rounded-2xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Kortex Klassroom Logo"
                  width={36}
                  height={36}
                  priority
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain -rotate-1"
                />
              </div>
              <div className="flex items-baseline">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Kortex<span className="text-indigo-600"> Klassroom</span>
                </span>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            {mode !== 'forgot' && (
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMsg(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all uppercase tracking-wider cursor-pointer ${
                    mode === 'signin' 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMsg(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all uppercase tracking-wider cursor-pointer ${
                    mode === 'signup' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Header Description (Only displayed if a specific contextual prompt was provided) */}
            {authMessage && authMessage !== "Join Kortex Klassroom to unlock all features." && (
              <div className="mb-4 p-3 bg-indigo-50 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-100">
                {authMessage}
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-100 text-red-600 text-xs font-bold rounded-xl animate-shake">
                {errorMsg}
              </div>
            )}

            {/* ----------------- TAB 1: SIGN IN ----------------- */}
            {mode === 'signin' && (
              <div>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Email or Mobile Number <span className="text-rose-500 font-black">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. parent@email.com or 9876543210"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white text-sm transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        6-Digit PIN or Password <span className="text-rose-500 font-black">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setErrorMsg(''); setResetIdentifier(loginIdentifier); }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter 6-digit PIN or password"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 pr-12 py-3 font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white text-sm transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? 'Authenticating...' : 'Sign In'}
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-slate-400 font-bold uppercase tracking-wider">Or continue with</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </button>

                  {/* Student Code Login Card */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-3.5 transition-all">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <GraduationCap size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div>
                            <span className="text-xs font-black text-slate-900 tracking-tight">Student Code Login</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                            Have a 6-character code from your school?
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            maxLength={6}
                            value={quickClaimCode}
                            onChange={(e) => setQuickClaimCode(e.target.value.toUpperCase())}
                            placeholder="e.g. KRTX42"
                            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 text-xs font-mono font-black tracking-widest text-slate-800 uppercase placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 placeholder:tracking-normal outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200"
                          />
                        </div>
                        <a
                          href={quickClaimCode.trim() ? `/start?code=${encodeURIComponent(quickClaimCode.trim())}` : '/start'}
                          className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <span>Continue</span>
                          <ArrowRight size={13} />
                        </a>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------- TAB 2: SIGN UP (PARENT & EDUCATOR SUB-TABS) ----------------- */}
            {mode === 'signup' && (
              <div>
                {/* Category Sub-Tabs */}
                <div className="flex bg-slate-100/90 p-1 rounded-xl mb-4 border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => { setSignUpRole('parent'); setErrorMsg(''); }}
                    className={`flex-1 py-2 rounded-lg font-extrabold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      signUpRole === 'parent'
                        ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Heart size={13} className={signUpRole === 'parent' ? 'fill-indigo-600 text-indigo-600' : 'text-slate-400'} />
                    <span>Parent</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSignUpRole('educator'); setErrorMsg(''); }}
                    className={`flex-1 py-2 rounded-lg font-extrabold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      signUpRole === 'educator'
                        ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Building2 size={13} className={signUpRole === 'educator' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="truncate">Institutes / Educators</span>
                  </button>
                </div>

                {/* Sub-tab A: PARENT SIGN UP (PURE EMAIL + 6-DIGIT PIN) */}
                {signUpRole === 'parent' && (
                  <div>
                    {/* Notice: Only a parent can create a child account */}
                    <div className="mb-4 px-3.5 py-2.5 bg-indigo-50/80 border border-indigo-100/90 rounded-xl flex items-center gap-2 text-indigo-900 text-xs font-semibold">
                      <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
                      <span>Only a parent or legal guardian can create a child account.</span>
                    </div>

                    <form onSubmit={handleParentSignUp} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          Parent Full Name <span className="text-rose-500 font-black">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white text-sm transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                          Email Address <span className="text-rose-500 font-black">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          placeholder="parent@example.com"
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white text-sm transition-colors"
                        />
                        <p className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                          <Mail size={12} className="shrink-0" /> Verification link will be sent to this email
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Create 6-Digit PIN <span className="text-rose-500 font-black">*</span>
                          </label>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            6 Digits / Chars
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type={showParentPin ? "text" : "password"}
                            required
                            maxLength={12}
                            value={parentPin}
                            onChange={(e) => setParentPin(e.target.value)}
                            placeholder="e.g. 123456"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 pr-12 py-2.5 font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white text-sm transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowParentPin(!showParentPin)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            {showParentPin ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2 cursor-pointer"
                      >
                        {isLoading ? 'Creating Account...' : 'Create Parent Account'}
                      </button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="px-2 bg-white text-slate-400 font-bold uppercase tracking-wider">Or continue with</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isLoading}
                        className="w-full py-2.5 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Google
                      </button>

                      {/* Terms of Use and Privacy Policy */}
                      <p className="mt-4 text-[11px] text-slate-400 font-medium text-center leading-relaxed">
                        By continuing, you agree to our{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-indigo-600 underline font-semibold">
                          Terms of Use
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-indigo-600 underline font-semibold">
                          Privacy Policy
                        </a>.
                      </p>

                      {/* Child Safety & Data Privacy Compliance Badges */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-2.5">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
                          <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                          <span>COPPA Compliant</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
                          <ShieldCheck size={13} className="text-indigo-600 shrink-0" />
                          <span>DPDP Act Compliant</span>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* Sub-tab B: EDUCATIONAL INSTITUTES / EDUCATORS */}
                {signUpRole === 'educator' && (
                  <div>
                    {eduSubmitted ? (
                      <div className="text-center py-6">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-1">Proposal Request Received!</h3>
                        <p className="text-xs font-medium text-slate-500 mb-5 max-w-xs mx-auto leading-relaxed">
                          Thank you for partnering with Kortex Klassroom. Our education team will review your institution's profile and send custom proposal details to <strong className="text-slate-700">{eduEmail}</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setEduSubmitted(false); setMode('signin'); }}
                          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          Back to Sign In
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-4 px-3.5 py-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-2 text-indigo-900 text-xs font-semibold">
                          <Building2 size={16} className="text-indigo-600 shrink-0" />
                          <span>Schools & academies receive custom institutional access.</span>
                        </div>

                        <form onSubmit={handleEduSubmit} className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                              Institution / School Name <span className="text-rose-500 font-black">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={eduOrgName}
                              onChange={(e) => setEduOrgName(e.target.value)}
                              placeholder="e.g. St. Xavier's International School"
                              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white text-xs sm:text-sm transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                Contact Person <span className="text-rose-500 font-black">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={eduContactName}
                                onChange={(e) => setEduContactName(e.target.value)}
                                placeholder="Principal / Head"
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white text-xs sm:text-sm transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                Official Email <span className="text-rose-500 font-black">*</span>
                              </label>
                              <input
                                type="email"
                                required
                                value={eduEmail}
                                onChange={(e) => setEduEmail(e.target.value)}
                                placeholder="contact@school.edu"
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white text-xs sm:text-sm transition-colors"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                Phone / WhatsApp <span className="text-rose-500 font-black">*</span>
                              </label>
                              <input
                                type="tel"
                                required
                                value={eduPhone}
                                onChange={(e) => setEduPhone(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white text-xs sm:text-sm transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                Institution Type <span className="text-rose-500 font-black">*</span>
                              </label>
                              <select
                                value={eduOrgType}
                                onChange={(e) => setEduOrgType(e.target.value as any)}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none focus:border-indigo-600 text-xs sm:text-sm"
                              >
                                <option value="school">K-12 School</option>
                                <option value="coaching">Coaching / Academy</option>
                                <option value="ngo">NGO / Foundation</option>
                                <option value="other">Other Educational Hub</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                              Estimated Number of Students <span className="text-rose-500 font-black">*</span>
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={eduStudentCount}
                              onChange={(e) => setEduStudentCount(e.target.value)}
                              placeholder="e.g. 250"
                              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white text-xs sm:text-sm transition-colors"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Which of these Kortex innovations will help your organisation the most?
                              </label>
                              <span className="text-[10px] font-bold text-indigo-600 shrink-0 ml-2">
                                (Select up to 2)
                              </span>
                            </div>
                            <div className="space-y-2">
                              {KORTEX_INNOVATIONS.map((item) => {
                                const isSelected = selectedInnovations.includes(item.title);
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => toggleInnovation(item.title)}
                                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-2.5 sm:gap-3 select-none ${
                                      isSelected
                                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected ? 'bg-indigo-600 text-white' : 'border-2 border-slate-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && <Check size={11} strokeWidth={3.5} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-slate-900 leading-snug">
                                        {item.title}
                                      </p>
                                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                                        {item.description}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmittingEdu}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer mt-1"
                          >
                            {isSubmittingEdu ? 'Submitting Request...' : (
                              <>
                                <Send size={15} /> Request Institutional Proposal & Account
                              </>
                            )}
                          </button>

                          {/* Child Safety & Data Privacy Compliance Badges */}
                          <div className="pt-2 flex items-center justify-center gap-2.5 text-center">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
                              <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                              <span>COPPA Compliant</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
                              <ShieldCheck size={13} className="text-indigo-600 shrink-0" />
                              <span>DPDP Act Compliant</span>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ----------------- TAB 3: FORGOT PASSWORD ----------------- */}
            {mode === 'forgot' && (
              <div>
                <div className="text-center mb-5">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <KeyRound size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Enter your registered email address to receive a reset link
                  </p>
                </div>

                {resetSent ? (
                  <div className="text-center py-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 mb-4">
                    <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                    <h3 className="text-sm font-black text-slate-900 mb-1.5">Reset Link Dispatched</h3>
                    <p className="text-xs font-semibold text-slate-600 mb-4 leading-relaxed">
                      {resetSuccessMsg || "A password reset link has been dispatched. Please check your inbox."}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setResetSent(false); setResetSuccessMsg(''); }}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Registered Email Address <span className="text-rose-500 font-black">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        placeholder="e.g. parent@email.com or teacher@school.edu"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white text-sm transition-colors"
                      />
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        We will send a secure password reset link to this email address.
                      </p>
                    </div>

                    {/* School Student In-School Advisory */}
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left flex items-start gap-2.5">
                      <GraduationCap className="text-amber-600 shrink-0 mt-0.5" size={18} />
                      <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                        <strong>School Students:</strong> If you forgot your 6-digit PIN, please ask your class teacher or school administrator directly at school to view or reset your PIN.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setErrorMsg(''); }}
                      className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 py-2 cursor-pointer transition-colors"
                    >
                      ← Back to Sign In
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </ModalPortal>

      {/* Quote / Institutional Proposal Modal */}
      {showQuoteModal && (
        <QuoteInquiryModal onClose={() => setShowQuoteModal(false)} />
      )}
    </>
  );
}
