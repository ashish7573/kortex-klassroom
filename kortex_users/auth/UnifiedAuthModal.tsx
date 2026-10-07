"use client";
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../backend_configurations/firebase';
import { useAuth } from '../../hooks/useAuth';
import { ParentProfile } from '../../types/user';
import { generateParentId, updateUserSessionToken } from '../../app/actions/student';
import QuoteInquiryModal from './QuoteInquiryModal';
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
  Sparkles
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
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showParentPassword, setShowParentPassword] = useState(false);
  
  // Sign In State
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Student Username
  const [loginPassword, setLoginPassword] = useState('');
  
  // Parent Sign Up State
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentConfirmPassword, setParentConfirmPassword] = useState('');

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Status & Modals
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  // --------------------------------------------------------------------------
  // HANDLER: Sign In (Handles Parents, Educators, Admins, and Student Usernames)
  // --------------------------------------------------------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      let emailToAuth = loginIdentifier.trim().toLowerCase();

      // If identifier is not an email, treat as student Kortex ID
      if (!emailToAuth.includes('@')) {
        const cleanId = loginIdentifier.trim().toLowerCase(); // e.g. stu_abc_123
        emailToAuth = `${cleanId}@student.kortex.app`;
      }

      // Single-Device session token setup
      const sessionToken = Math.random().toString(36).substring(2, 15);
      if (typeof window !== 'undefined') {
        localStorage.setItem('kortex_session_token', sessionToken);
        sessionStorage.setItem('kortex_is_authenticating', 'true');
      }

      const cred = await signInWithEmailAndPassword(auth, emailToAuth, loginPassword);

      // Update session token in Firestore (via Server Action to bypass strict security rules)
      try {
        const idToken = await cred.user.getIdToken();
        const res = await updateUserSessionToken(idToken, sessionToken);
        if (!res.success) {
           console.warn("Server action session update failed:", res.error);
        }
      } catch (err) {
        console.warn("Profile update warning during sign-in:", err);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error("Sign in failed:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg("Incorrect credentials. Please verify your email/username and password.");
      } else {
        setErrorMsg(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('kortex_is_authenticating');
      }
    }
  };

  // --------------------------------------------------------------------------
  // HANDLER: Parent Sign Up Only
  // --------------------------------------------------------------------------
  const handleParentSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    if (parentContact.trim().length < 10) {
      setErrorMsg("Please provide a valid contact number.");
      setIsLoading(false);
      return;
    }

    if (parentPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    if (parentPassword !== parentConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const cleanEmail = parentEmail.trim().toLowerCase();
      const sessionToken = Math.random().toString(36).substring(2, 15);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('kortex_session_token', sessionToken);
        sessionStorage.setItem('kortex_is_authenticating', 'true');
      }

      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, parentPassword);
      const idToken = await cred.user.getIdToken();
      const parentKortexId = await generateParentId(idToken);

      // Initialize Parent Firestore profile
      const parentProfile: ParentProfile = {
        uid: cred.user.uid,
        kortex_id: parentKortexId,
        email: cleanEmail,
        full_name: parentName.trim(),
        role: 'parent',
        contact_number: parentContact.trim(),
        children_ids: [],
        status: 'active',
        session_token: sessionToken,
        created_at: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', cred.user.uid), parentProfile);
      } catch (err) {
        await cred.user.delete();
        throw err;
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error("Parent registration error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg("An account with this email already exists. Please sign in instead.");
      } else {
        setErrorMsg(err.message || "Failed to create parent account.");
      }
    } finally {
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('kortex_is_authenticating');
      }
    }
  };

  // --------------------------------------------------------------------------
  // HANDLER: Password Reset
  // --------------------------------------------------------------------------
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await resetPassword(resetEmail.trim().toLowerCase());
      setResetSent(true);
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setErrorMsg(err.message || "Failed to send password reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative border-4 border-slate-100 p-8 max-h-[92vh] overflow-y-auto">
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Mode Switcher Tabs */}
          {mode !== 'forgot' && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all uppercase tracking-wider ${
                  mode === 'signin' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                  mode === 'signup' 
                    ? 'bg-sky-500 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Heart size={14} className={mode === 'signup' ? 'text-white' : 'text-rose-400'} />
                Parent Sign Up
              </button>
            </div>
          )}

          {/* Header Description */}
          {authMessage && (
            <div className="mb-4 p-3 bg-sky-50 text-sky-700 text-xs font-bold rounded-xl border border-sky-100">
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
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-700">
                  <Lock size={26} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Welcome to Kortex</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Sign in with Email or Student Username
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Email or Student Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. parent@email.com or STU_ABC_123"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Password / PIN</label>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMsg(''); }}
                      className="text-xs font-bold text-sky-500 hover:text-sky-600"
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
                    placeholder="Enter password or child PIN"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 pr-12 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              {/* Institution Callout */}
              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-semibold mb-2">School, Coaching Center, or Educator?</p>
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  <Building2 size={14} /> Request Institutional Proposal & Account <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* ----------------- TAB 2: PARENT SIGN UP ----------------- */}
          {mode === 'signup' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-sky-600">
                  <Heart size={26} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Parent Registration</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Create your account to setup and monitor your child
                </p>
              </div>

              <form onSubmit={handleParentSignUp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Parent Full Name</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={parentContact}
                    onChange={(e) => setParentContact(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Password</label>
                    <div className="relative">
                    <input
                      type={showParentPassword ? "text" : "password"}
                      required
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 pr-10 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowParentPassword(!showParentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showParentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Confirm</label>
                    <div className="relative">
                    <input
                      type={showParentPassword ? "text" : "password"}
                      required
                      value={parentConfirmPassword}
                      onChange={(e) => setParentConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 pr-10 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    />
                  </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
                >
                  {isLoading ? 'Creating Parent Profile...' : 'Complete Registration'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-xs text-slate-400 font-semibold">
                  Teacher or School?{' '}
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(true)}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Request Institutional Access
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ----------------- TAB 3: FORGOT PASSWORD ----------------- */}
          {mode === 'forgot' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={26} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Reset Password</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Enter your registered email to receive recovery instructions
                </p>
              </div>

              {resetSent ? (
                <div className="text-center py-4">
                  <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 mb-4">Reset link dispatched!</p>
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setResetSent(false); }}
                    className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Account Email</label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. parent@email.com"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setErrorMsg(''); }}
                    className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 py-2"
                  >
                    ← Back to Sign In
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quote / Institutional Proposal Modal */}
      {showQuoteModal && (
        <QuoteInquiryModal onClose={() => setShowQuoteModal(false)} />
      )}
    </>
  );
}
