"use client";
import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../backend_configurations/firebase';
import { useAuth } from '../../hooks/useAuth';
import { ParentProfile } from '../../types/user';
import { generateParentId, updateUserSessionToken } from '../../app/actions/student';
import { completeRegistration } from '../../app/actions/auth';
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
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'otp'>(initialMode as any);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {}
        (window as any).recaptchaVerifier = undefined;
      }
    };
  }, []);
  
  // Sign In State
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Student Username
  const [loginPassword, setLoginPassword] = useState('');
  
  // Parent Sign Up State (Deferred Password)
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [customCountryCode, setCustomCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // OTP State
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);
  const [registrationSuccessMsg, setRegistrationSuccessMsg] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const COUNTRY_CODES = [
    { code: '+91', label: 'IN (+91)' },
    { code: '+1', label: 'US/CA (+1)' },
    { code: '+44', label: 'UK (+44)' },
    { code: '+971', label: 'UAE (+971)' },
    { code: '+61', label: 'AU (+61)' },
    { code: '+65', label: 'SG (+65)' },
    { code: 'other', label: 'Other (+)' }
  ];

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
  const handleParentSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (!parentName.trim() || !parentEmail.trim() || !phoneNumber.trim()) {
        throw new Error("Please fill in all fields.");
      }

      let activeCountryCode = countryCode;
      if (countryCode === 'other') {
        if (!customCountryCode.startsWith('+')) activeCountryCode = '+' + customCountryCode;
        else activeCountryCode = customCountryCode;
      }

      const fullPhoneNumber = `${activeCountryCode}${phoneNumber.trim()}`;

      // Initialize RecaptchaVerifier
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }

      const appVerifier = (window as any).recaptchaVerifier;
      const confResult = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      
      setConfirmationResult(confResult);
      setCountdown(60);
      setMode('otp'); // Switch to inline OTP modal
    } catch (err: any) {
      console.error("Parent OTP initiation error:", err);
      setErrorMsg(err.message || "Failed to send OTP. Please check the phone number.");
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = undefined;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const cred = await confirmationResult.confirm(otp);
      
      let activeCountryCode = countryCode;
      if (countryCode === 'other') {
        if (!customCountryCode.startsWith('+')) activeCountryCode = '+' + customCountryCode;
        else activeCountryCode = customCountryCode;
      }
      const fullPhoneNumber = `${activeCountryCode}${phoneNumber.trim()}`;

      // Backend Handoff
      const res = await completeRegistration({
        uid: cred.user.uid,
        email: parentEmail.trim().toLowerCase(),
        full_name: parentName.trim(),
        phoneNumber: fullPhoneNumber
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to complete registration on server.");
      }

      setRegistrationSuccessMsg("Phone verified! Check your email to set your password.");
    } catch (err: any) {
      console.error("OTP Confirmation error:", err);
      setErrorMsg("Invalid or expired OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLER: Password Reset
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // HANDLER: Google Auth (Sign In / Sign Up)
  // --------------------------------------------------------------------------
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      
      const sessionToken = Math.random().toString(36).substring(2, 15);
      if (typeof window !== 'undefined') {
        localStorage.setItem('kortex_session_token', sessionToken);
        sessionStorage.setItem('kortex_is_authenticating', 'true');
      }

      const cred = await signInWithPopup(auth, provider);
      
      // Check if user already has a profile
      const userRef = doc(db, 'users', cred.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // First time sign-up via Google, create a Parent profile
        const idToken = await cred.user.getIdToken();
        const parentKortexId = await generateParentId(idToken);
        
        const parentProfile: ParentProfile = {
          uid: cred.user.uid,
          kortex_id: parentKortexId,
          email: cred.user.email || '',
          full_name: cred.user.displayName || 'Parent User',
          role: 'parent',
          phone: null,
          phoneVerified: false,
          onboardingStatus: 'PENDING_PHONE',
          children_ids: [],
          status: 'active',
          session_token: sessionToken,
          created_at: new Date().toISOString()
        };
        
        await setDoc(userRef, parentProfile);
      } else {
        const idToken = await cred.user.getIdToken();
        try {
          await updateUserSessionToken(idToken, sessionToken);
        } catch (e) {
          console.warn("Session update warning:", e);
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error("Google auth error:", err);
      setErrorMsg(err.message || "Failed to authenticate with Google.");
    } finally {
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('kortex_is_authenticating');
      }
    }
  };

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
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative border-4 border-slate-100 p-8 pt-12 max-h-[92vh] overflow-y-auto">
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors z-10"
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

                <div className="relative my-6">
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
                  className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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

              </form>


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
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Mobile Number</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-1/3 bg-slate-50 border-2 border-slate-200 rounded-xl px-2 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    {countryCode === 'other' && (
                      <input
                        type="text"
                        placeholder="+00"
                        value={customCountryCode}
                        onChange={(e) => setCustomCountryCode(e.target.value)}
                        className="w-20 bg-slate-50 border-2 border-slate-200 rounded-xl px-2 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                      />
                    )}
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="9876543210"
                      className="w-2/3 flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    />
                  </div>
                </div>

                <div id="recaptcha-container" className="my-2 flex justify-center"></div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
                >
                  {isLoading ? 'Sending OTP...' : 'Continue'}
                </button>

                <div className="relative my-6">
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
                  className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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

              </form>


            </div>
          )}

          {/* ----------------- TAB 4: INLINE OTP ----------------- */}
          {mode === 'otp' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={26} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Verify Mobile</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  We've sent a 6-digit OTP to your phone.
                </p>
              </div>

              {registrationSuccessMsg ? (
                <div className="text-center py-4">
                  <p className="text-sm font-bold text-slate-700 mb-4">{registrationSuccessMsg}</p>
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setRegistrationSuccessMsg(''); }}
                    className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOTPConfirm} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm font-bold text-slate-700">
                      OTP sent to: <span className="text-sky-600 tracking-wide">{countryCode === 'other' ? customCountryCode : countryCode} {phoneNumber}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Enter OTP</label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-500 text-center tracking-widest text-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length < 6}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Phone'}
                  </button>
                  
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      disabled={countdown > 0 || isLoading}
                      onClick={(e) => {
                        e.preventDefault();
                        handleParentSignUp();
                      }}
                      className="w-full text-xs font-bold text-slate-500 hover:text-sky-600 py-2 disabled:opacity-50"
                    >
                      {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Didn\'t receive code? Resend'}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { 
                        e.preventDefault();
                        setMode('signup'); 
                        setConfirmationResult(null); 
                        if ((window as any).recaptchaVerifier) {
                          (window as any).recaptchaVerifier.clear();
                          (window as any).recaptchaVerifier = undefined;
                        }
                      }}
                      className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 py-2"
                    >
                      ← Wrong number? Go back
                    </button>
                  </div>
                </form>
              )}
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

          {/* Unified Institution Callout */}
          {mode !== 'forgot' && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-semibold mb-2">School, Coaching Center, or Educator?</p>
              <button
                type="button"
                onClick={() => setShowQuoteModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
              >
                <Building2 size={14} /> Request Institutional Access <ArrowRight size={12} />
              </button>
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
