"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../backend_configurations/firebase';
import { RecaptchaVerifier, linkWithPhoneNumber, unlink } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const COUNTRY_CODES = [
  { code: '+91', label: 'IN (+91)' },
  { code: '+1', label: 'US/CA (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+61', label: 'AU (+61)' },
  { code: '+65', label: 'SG (+65)' },
  { code: 'other', label: 'Other (+)' }
];

export default function VerifyPhonePage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [countryCode, setCountryCode] = useState('+91');
  const [customCountryCode, setCustomCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.replace('/');
        return;
      }
      
      const docRef = doc(db, 'users', u.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.phoneVerified && data.onboardingStatus === 'ACTIVE') {
          router.replace('/dashboard');
        } else {
          setUser(u);
          setLoading(false);
        }
      } else {
        router.replace('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth.currentUser) return;
    
    setIsLoading(true);
    setErrorMsg('');

    try {
      let activeCountryCode = countryCode;
      if (countryCode === 'other') {
        if (!customCountryCode.startsWith('+')) activeCountryCode = '+' + customCountryCode;
        else activeCountryCode = customCountryCode;
      }
      const fullPhoneNumber = `${activeCountryCode}${phoneNumber.trim()}`;

      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }

      const appVerifier = (window as any).recaptchaVerifier;
      try {
        await unlink(auth.currentUser, 'phone');
      } catch(e) {} // Ignore if no phone is currently linked
      const confResult = await linkWithPhoneNumber(auth.currentUser, fullPhoneNumber, appVerifier);
      setConfirmationResult(confResult);
      setCountdown(60);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to send OTP.");
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = undefined;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !user) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      await confirmationResult.confirm(otp);
      
      let activeCountryCode = countryCode;
      if (countryCode === 'other') {
        if (!customCountryCode.startsWith('+')) activeCountryCode = '+' + customCountryCode;
        else activeCountryCode = customCountryCode;
      }
      const fullPhoneNumber = `${activeCountryCode}${phoneNumber.trim()}`;

      // Update Firestore
      await setDoc(doc(db, 'users', user.uid), {
        phone: fullPhoneNumber,
        phoneVerified: true,
        onboardingStatus: 'ACTIVE'
      }, { merge: true });

      // Redirect back to dispatcher
      router.replace('/');
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-800 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white max-w-md w-full rounded-3xl p-8 border-4 border-slate-100 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📱</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800">Verify Your Phone</h1>
          <p className="text-sm text-slate-500 font-semibold mt-2">
            For security and emergency contacts, we require all parents to verify their mobile number.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 text-xs font-bold rounded-xl animate-shake text-center">
            {errorMsg}
          </div>
        )}

        <div id="recaptcha-container" className="my-2 flex justify-center"></div>
        {!confirmationResult ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm font-bold text-slate-700">
                OTP sent to: <span className="text-sky-600 tracking-wide">{countryCode === 'other' ? customCountryCode : countryCode} {phoneNumber}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Enter 6-Digit OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 text-center tracking-widest text-lg"
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
                  handleSendOTP();
                }}
                className="w-full text-xs font-bold text-slate-500 hover:text-sky-600 py-2 disabled:opacity-50"
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Didn\'t receive code? Resend'}
              </button>

              <button
                type="button"
                onClick={(e) => { 
                  e.preventDefault();
                  setConfirmationResult(null); 
                  setOtp(''); 
                  // Do not clear recaptchaVerifier here, let it be reused
                }}
                className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 py-2"
              >
                ← Wrong number? Go back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
