"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { auth } from '../../backend_configurations/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { lookupStudentByClaimCode, activateStudentWithConsent, verifyStudentPinAndLogin } from '../actions/student';
import { CheckCircle2, School, GraduationCap, ArrowRight, ShieldCheck, Sparkles, AlertCircle, KeyRound, HelpCircle, X } from 'lucide-react';

function StartPageContent() {
  const searchParams = useSearchParams();
  const urlCode = searchParams ? searchParams.get('code') : null;

  const [claimCode, setClaimCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [studentData, setStudentData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Consent Form fields (First-Time)
  const [parentName, setParentName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [pin, setPin] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);

  // Returning PIN verification
  const [loginPin, setLoginPin] = useState('');
  const [showForgotHelp, setShowForgotHelp] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [loginStep, setLoginStep] = useState<string | null>(null);

  // Persistent Device Session Check
  useEffect(() => {
    if (studentData && auth.currentUser && auth.currentUser.uid === studentData.uid) {
      // User is already logged in as this student on this device -> 0-friction direct launch!
      window.location.href = '/?view=portal';
    }
  }, [studentData]);

  // Auto-verify if code exists in URL
  useEffect(() => {
    if (urlCode) {
      const clean = urlCode.trim().toUpperCase();
      setClaimCode(clean);
      handleLookup(clean);
    }
  }, [urlCode]);

  const handleLookup = async (codeToLookup?: string) => {
    const targetCode = (codeToLookup || claimCode).trim().toUpperCase();
    if (!targetCode) {
      setErrorMsg("Please enter a 6-character Student Claim Code.");
      return;
    }
    setErrorMsg('');
    setLookupLoading(true);

    try {
      const res = await lookupStudentByClaimCode(targetCode);
      if (res.success && res.student) {
        setStudentData(res.student);
        if (res.student.parentName) setParentName(res.student.parentName);
        if (res.student.emergencyContact) setEmergencyContact(res.student.emergencyContact);
        if (res.student.parentConsentVerified) setConsentChecked(true);
      } else {
        setStudentData(null);
        setErrorMsg(res.error || "Student not found with this code.");
      }
    } catch (err: any) {
      setStudentData(null);
      setErrorMsg(err.message || "Failed to lookup student code.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!studentData) return;
    setErrorMsg('');

    if (!studentData.parentConsentVerified) {
      if (!parentName.trim()) {
        setErrorMsg("Parent or Guardian name is required. (माता/पिता का नाम आवश्यक है)");
        return;
      }
      const cleanPhone = emergencyContact.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setErrorMsg("Please enter a valid 10-digit mobile number. (कृपया 10-अंकों का वैध मोबाइल नंबर दर्ज करें)");
        return;
      }
      const cleanPin = pin.trim().replace(/\D/g, '');
      if (cleanPin.length !== 6) {
        setErrorMsg("Please enter a 6-digit PIN for child login. (कृपया बच्चे के लॉगिन के लिए 6-अंकों का पिन दर्ज करें)");
        return;
      }
      if (!consentChecked) {
        setErrorMsg("Please tick the consent checkbox to continue. (कृपया सहमति बॉक्स पर सही का निशान लगाएं)");
        return;
      }
    }

    setSubmitting(true);
    setLoginStep("Verifying consent... (सहमति सत्यापित की जा रही है)");

    try {
      const result = await activateStudentWithConsent({
        claimCode: studentData.claimCode,
        parentName: parentName.trim(),
        emergencyContact: emergencyContact.trim(),
        pin: pin.trim() || undefined,
      });

      if (!result.success || !result.customToken || !result.sessionToken) {
        throw new Error(result.error || "Failed to activate student account.");
      }

      setLoginStep("Starting learning session... (सत्र शुरू किया जा रहा है)");

      // ⚠️ CRITICAL ORDER OF OPERATIONS:
      // Store session token in localStorage BEFORE signInWithCustomToken so AuthContext's
      // onSnapshot concurrency listener matches the profile and does NOT cause a false logout.
      localStorage.setItem(`session_token_${result.studentUid}`, result.sessionToken);
      localStorage.setItem('kortex_session_token', result.sessionToken);

      // Sign into Firebase Auth
      await signInWithCustomToken(auth, result.customToken);

      setLoginStep("Redirecting to your student dashboard... (डैशबोर्ड पर ले जा रहे हैं)");

      // Clean redirect into the single-page application portal
      window.location.href = '/?view=portal';
    } catch (err: any) {
      console.error("Activation error:", err);
      setErrorMsg(err.message || "Something went wrong while starting learning. Please try again.");
      setSubmitting(false);
      setLoginStep(null);
    }
  };

  const handlePinLogin = async () => {
    if (!studentData) return;
    const clean = loginPin.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      setErrorMsg("Please enter your 6-digit PIN. (कृपया अपना 6-अंकों का पिन दर्ज करें)");
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    setLoginStep("Verifying PIN... (पिन सत्यापित किया जा रहा है)");

    try {
      const result = await verifyStudentPinAndLogin({
        claimCode: studentData.claimCode,
        pin: clean,
      });

      if (!result.success || !result.customToken || !result.sessionToken) {
        throw new Error(result.error || "Incorrect PIN. (गलत पिन)");
      }

      setLoginStep("Starting learning session... (सत्र शुरू किया जा रहा है)");

      localStorage.setItem(`session_token_${result.studentUid}`, result.sessionToken);
      localStorage.setItem('kortex_session_token', result.sessionToken);

      await signInWithCustomToken(auth, result.customToken);

      setLoginStep("Redirecting to your student dashboard... (डैशबोर्ड पर ले जा रहे हैं)");
      window.location.href = '/?view=portal';
    } catch (err: any) {
      console.error("PIN login error:", err);
      setErrorMsg(err.message || "Failed to log in with PIN. Please try again or ask your teacher.");
      setSubmitting(false);
      setLoginStep(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50/40 to-amber-50/40 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800">
      
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-6">
        <Image 
          src="/logo.svg" 
          alt="Kortex Klassroom" 
          width={48} 
          height={48} 
          priority 
          className="rounded-2xl shadow-sm -rotate-3"
        />
        <div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Kortex<span className="text-sky-500"> Klassroom</span>
          </span>
          <p className="text-xs font-bold text-slate-500">
            Student Quick Access • छात्र त्वरित प्रवेश
          </p>
        </div>
      </div>

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border-2 border-slate-100 overflow-hidden">
        
        {/* Step Banner */}
        <div className="bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black leading-tight">
                {studentData ? "Confirm Student Identity" : "Enter Student Claim Code"}
              </h1>
              <p className="text-xs text-sky-100 font-semibold">
                {studentData ? "छात्र पहचान एवं सहमति" : "स्कूल द्वारा प्राप्त 6-अक्षरों का कोड दर्ज करें"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">

          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-sm font-semibold animate-shake">
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-bold">{errorMsg}</p>
                <p className="text-xs text-rose-500 mt-1">
                  Need help? Please check with your class teacher or school administrator.
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: Code Input (Shown if no student looked up yet) */}
          {!studentData && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Student Claim Code • छात्र कोड
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    value={claimCode}
                    onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 7K9X2B"
                    className="w-full text-center text-3xl font-black tracking-widest uppercase py-4 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-sky-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-slate-400 font-semibold mt-2 text-center">
                  Enter the 6-character code provided in your school WhatsApp message or slip.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleLookup()}
                disabled={lookupLoading || !claimCode.trim()}
                className="w-full py-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-black text-lg rounded-2xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {lookupLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue • आगे बढ़ें</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: Identity Card & Consent (Shown once student is resolved) */}
          {studentData && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Student Identity Card */}
              <div className="bg-gradient-to-br from-indigo-50/80 to-sky-50/80 border-2 border-indigo-100 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md">
                      Student Profile
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 mt-2">
                      {studentData.fullName}
                    </h2>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-2xl border-2 border-indigo-100 flex items-center justify-center text-2xl shadow-sm">
                    🎒
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-100/80 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block">Class & Section:</span>
                    <span className="text-slate-800 font-black text-sm">
                      {studentData.grade} {studentData.section && `• Sec ${studentData.section}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">School / Organization:</span>
                    <span className="text-slate-800 font-black text-sm flex items-center gap-1">
                      <School size={14} className="text-indigo-500 shrink-0" />
                      <span className="truncate">{studentData.orgName}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* RETURNING USER VIEW: 6-Digit PIN Login */}
              {studentData.parentConsentVerified && studentData.hasPin ? (
                <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sky-900 font-black text-sm">
                    <KeyRound size={20} className="text-sky-600" />
                    <span>Enter 6-Digit PIN • पिन दर्ज करें</span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    Welcome back, <strong className="font-black text-slate-800">{studentData.fullName}</strong>! 
                    Enter your 6-digit PIN to continue learning.
                  </p>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Student 6-Digit PIN <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full py-3.5 px-4 bg-white border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none font-black text-2xl tracking-widest text-center transition-all text-slate-800"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handlePinLogin}
                    disabled={submitting || loginPin.length !== 6}
                    className="w-full py-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg rounded-2xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{loginStep || "Verifying..."}</span>
                      </>
                    ) : (
                      <>
                        <span>Continue Learning (पढ़ाई जारी रखें) 🚀</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setShowForgotHelp(prev => !prev)}
                      className="text-xs font-bold text-slate-400 hover:text-sky-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle size={14} />
                      <span>Forgot your PIN? (पिन भूल गए?)</span>
                    </button>
                  </div>

                  {showForgotHelp && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left animate-fade-in space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                          <GraduationCap size={16} className="text-amber-600" />
                          How to reset your Student PIN
                        </span>
                        <button 
                          type="button"
                          onClick={() => setShowForgotHelp(false)}
                          className="text-amber-500 hover:text-amber-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                        Student PINs cannot be reset online. If you forgot your 6-digit PIN, please <strong>ask your class teacher or school administrator directly at school</strong>. They can look up your PIN or reset it for you on the school roster.
                      </p>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        (यदि आप अपना पिन भूल गए हैं, तो कृपया स्कूल में अपने कक्षा अध्यापक या स्कूल कार्यालय से संपर्क करें। वे आपके पिन को देख या रीसेट कर सकते हैं।)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* FIRST-TIME USER VIEW: Consent & Parent Info */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
                    <ShieldCheck size={18} className="text-sky-500" />
                    <span>Parent / Guardian Consent • अभिभावक सहमति</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Parent / Guardian Full Name <span className="text-rose-500 font-black">*</span>
                        <span className="text-slate-400 block font-normal text-[11px]">माता/पिता या अभिभावक का नाम</span>
                      </label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:bg-white focus:outline-none font-bold text-sm transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Parent Mobile Number (10 Digits) <span className="text-rose-500 font-black">*</span>
                        <span className="text-slate-400 block font-normal text-[11px]">माता/पिता का 10-अंकों का मोबाइल नंबर (अनिवार्य)</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 9876543210"
                        className="w-full py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:bg-white focus:outline-none font-bold text-sm transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Set Child's 6-Digit Login PIN <span className="text-rose-500 font-black">*</span>
                        <span className="text-slate-400 block font-normal text-[11px]">बच्चे के लिए 6-अंकों का लॉगिन पिन सेट करें (अनिवार्य)</span>
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 123456"
                        className="w-full py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:bg-white focus:outline-none font-bold text-sm tracking-widest transition-all text-center"
                      />
                      <p className="text-[11px] text-slate-500 font-medium mt-1">
                        Remember this 6-digit PIN. Your child will use their Student ID and this PIN to log in. (इस 6-अंकों के पिन को याद रखें। बच्चा छात्र आईडी और इस पिन से लॉगिन कर सकेगा।)
                      </p>
                    </div>

                    {/* DPDP Consent Statement */}
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={(e) => setConsentChecked(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded text-sky-500 border-slate-300 focus:ring-sky-400 shrink-0"
                        />
                        <span className="text-xs text-slate-700 font-semibold leading-relaxed">
                          I confirm that I am the parent/guardian of <strong>{studentData.fullName}</strong> and I consent to my child using Kortex Klassroom for educational learning. 
                          <span className="block text-slate-500 mt-1 text-[11px]">
                            (मैं पुष्टि करता/करती हूँ कि मैं <strong>{studentData.fullName}</strong> का माता-पिता/अभिभावक हूँ और अपने बच्चे की शिक्षा के लिए Kortex Klassroom के उपयोग की सहमति देता/देती हूँ।)
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={
                      submitting || 
                      !parentName.trim() || 
                      emergencyContact.trim().replace(/\D/g, '').length !== 10 || 
                      pin.trim().replace(/\D/g, '').length !== 6 || 
                      !consentChecked
                    }
                    className="w-full py-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg rounded-2xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{loginStep || "Starting Learning..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Give Consent & Start Learning 🚀</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-slate-400 font-semibold">
                    सहमति दें और पढ़ाई शुरू करें • Compliant with DPDP Act
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-400 font-semibold">
        <p>Kortex Klassroom • Safe, Fun & Interactive School Learning</p>
      </div>

    </div>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-800 rounded-full" />
      </div>
    }>
      <StartPageContent />
    </Suspense>
  );
}

