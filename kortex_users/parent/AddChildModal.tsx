"use client";
import React, { useState } from 'react';
import { auth } from '../../backend_configurations/firebase';
import { X, Sparkles, UserPlus, CheckCircle2, Copy, Check, KeyRound, Link } from 'lucide-react';
import { provisionChildAccount, claimProvisionedChild } from '../../app/actions/student';
import RequireMobileModal from './RequireMobileModal';

interface AddChildModalProps {
  onClose: () => void;
  onChildCreated: (childId: string) => void;
  parentContactNumber?: string;
  onContactUpdate?: (mobile: string) => Promise<void>;
}

const GRADES = [
  'FLN', 'Balvatika 1', 'Balvatika 2', 'Balvatika 3', 
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
  'Grade 6', 'Grade 7', 'Grade 8'
];

export default function AddChildModal({ onClose, onChildCreated, parentContactNumber, onContactUpdate }: AddChildModalProps) {
  const [mode, setMode] = useState<'new' | 'claim'>('new');
  
  // New
  const [childName, setChildName] = useState('');
  // Removed grade state per request
  
  // Claim
  const [claimId, setClaimId] = useState('');
  const [claimCode, setClaimCode] = useState('');

  // Shared
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ studentId: string; pin: string } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const [showMobileModal, setShowMobileModal] = useState(false);

  const executeAction = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication error. Please log in again.");
      
      const idToken = await user.getIdToken(true);
      let result;
      
      if (mode === 'new') {
        result = await provisionChildAccount(idToken, {
          fullName: childName.trim(),
          grade: 'Unassigned',
          pin: pin
        });
      } else {
        result = await claimProvisionedChild(idToken, {
          kortexId: claimId.trim(),
          claimCode: claimCode.trim(),
          pin: pin
        });
      }
      
      if (!result.success || !result.studentId || !result.uid) {
        throw new Error(result.error || "Failed to process request.");
      }

      setCreatedCredentials({ studentId: result.studentId, pin });
      onChildCreated(result.uid);
    } catch (err: unknown) {
      console.error("Error processing child account:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to process request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    if (pin.length < 4) {
      setErrorMsg("Please choose a PIN with at least 4 digits.");
      setIsSubmitting(false);
      return;
    }
    
    if (mode === 'new' && childName.trim().length < 2) {
      setErrorMsg("Please enter a valid name.");
      setIsSubmitting(false);
      return;
    }

    if (mode === 'claim' && claimCode.trim().length !== 6) {
      setErrorMsg("Please enter the 6-digit Claim Code provided by the organization.");
      setIsSubmitting(false);
      return;
    }

    if (mode === 'claim' && claimId.trim().length < 5) {
      setErrorMsg("Please enter a valid Kortex ID.");
      setIsSubmitting(false);
      return;
    }

    if (mode === 'claim' && (!parentContactNumber || parentContactNumber.trim() === '')) {
      setShowMobileModal(true);
      setIsSubmitting(false);
      return;
    }

    await executeAction();
  };

  const copyCredentials = () => {
    if (createdCredentials) {
      navigator.clipboard.writeText(`Kortex ID: ${createdCredentials.studentId}\nPIN: ${createdCredentials.pin}`);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex flex-col text-white shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                {mode === 'new' ? <UserPlus size={24} className="text-white" /> : <Link size={24} className="text-white" />}
              </div>
              <div>
                <h3 className="text-xl font-black">{mode === 'new' ? 'Add a Child' : 'Claim Organization ID'}</h3>
                <p className="text-indigo-200 font-bold text-xs mt-1 leading-relaxed">
                  {mode === 'new' ? 'Create a Kortex ID for your child to start learning.' : 'Link an existing ID provided by your organization.'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors shrink-0">
              <X size={20} />
            </button>
          </div>
          
          {!createdCredentials && (
            <div className="flex bg-indigo-700 p-1 rounded-xl w-full">
              <button 
                type="button"
                onClick={() => { setMode('new'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${mode === 'new' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:text-white'}`}
              >
                Create New
              </button>
              <button 
                type="button"
                onClick={() => { setMode('claim'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${mode === 'claim' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:text-white'}`}
              >
                Claim Organization ID
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {createdCredentials ? (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-black text-slate-800">Account Linked!</h4>
                <p className="text-sm font-semibold text-slate-500 mt-2">
                  Your child can now log in using this Kortex ID and the PIN you set.
                </p>
              </div>

              <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Kortex ID</label>
                  <div className="text-lg font-black text-indigo-600 font-mono mt-1">
                    {createdCredentials.studentId}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">PIN Code</label>
                  <div className="text-lg font-black text-slate-700 font-mono mt-1">
                    {createdCredentials.pin}
                  </div>
                </div>
              </div>

              <button 
                onClick={copyCredentials}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {hasCopied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Credentials</>}
              </button>
              
              <button 
                onClick={onClose}
                className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-black rounded-xl transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 flex items-start gap-2 animate-fade-in">
                  <span className="shrink-0 mt-0.5">⚠️</span> {errorMsg}
                </div>
              )}

              {mode === 'new' ? (
                <>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Child&apos;s Name</label>
                    <input 
                      required={mode === 'new'}
                      type="text" 
                      value={childName}
                      onChange={e => setChildName(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                      placeholder="e.g. Aarav Sharma"
                    />
                  </div>


                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Organization Provisioned ID</label>
                    <input 
                      required={mode === 'claim'}
                      type="text" 
                      value={claimId}
                      onChange={e => setClaimId(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors uppercase font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans"
                      placeholder="e.g. STU_ABC_123"
                    />
                    <p className="text-[11px] font-semibold text-slate-400 mt-2 ml-1">
                      Enter the Kortex ID given to you by your child&apos;s organization.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">6-Digit Claim Code</label>
                    <input 
                      required={mode === 'claim'}
                      type="text" 
                      maxLength={6}
                      value={claimCode}
                      onChange={e => setClaimCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors uppercase font-mono tracking-widest"
                      placeholder="e.g. A9F2B1"
                    />
                    <p className="text-[11px] font-semibold text-slate-400 mt-2 ml-1">
                      Required to securely verify your identity.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <KeyRound size={14} /> Secret PIN
                </label>
                <input 
                  required
                  type="text" 
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors font-mono tracking-widest text-lg placeholder:tracking-normal placeholder:text-sm placeholder:font-sans"
                  placeholder="4-6 digit PIN"
                />
                <p className="text-[11px] font-semibold text-slate-400 mt-2 ml-1">
                  You must set a PIN so your child can log in. Keep it secret!
                </p>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Processing...' : (
                    mode === 'new' ? <><Sparkles size={18} /> Create Account</> : <><Link size={18} /> Claim Account</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <RequireMobileModal 
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        onSubmit={async (mobile) => {
          if (onContactUpdate) {
            await onContactUpdate(mobile);
          }
          setShowMobileModal(false);
          setIsSubmitting(true);
          await executeAction();
        }}
      />
    </div>
  );
}
