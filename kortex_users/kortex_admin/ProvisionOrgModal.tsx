"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, X, Send, ShieldAlert, CheckCircle2, Copy, Plus, Layers } from 'lucide-react';
import { auth } from '../../backend_configurations/firebase';
import { provisionSchoolAccount } from '../../app/actions/provision';
import { GRADES, SUBJECTS, SECTIONS } from '../../kortex_landing_page/curriculumConfig';

interface ProvisionOrgModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProvisionOrgModal({ onClose, onSuccess }: ProvisionOrgModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form State
  const [kortexId, setKortexId] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  
  // Grade-Section-Subject Combinations State
  const [approvedCombos, setApprovedCombos] = useState<string[]>(['Grade 1 - Section A - English']);
  const [selectedGrade, setSelectedGrade] = useState<string>(GRADES[4] || 'Grade 1');
  const [selectedSection, setSelectedSection] = useState<string>(SECTIONS[0] || 'A');
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECTS[0] || 'English');
  
  const [maxStudentSeats, setMaxStudentSeats] = useState<number>(40);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('');

  // Success State
  const [successData, setSuccessData] = useState<{kortexId: string, email: string, passwordLink: string, orgName: string} | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleAddCombo = () => {
    const combo = `${selectedGrade} - Section ${selectedSection} - ${selectedSubject}`;
    if (approvedCombos.includes(combo)) {
      setErrorMsg(`"${combo}" is already added.`);
      return;
    }
    setErrorMsg('');
    const updated = [...approvedCombos, combo];
    setApprovedCombos(updated);
    setMaxStudentSeats(updated.length * 40);
  };

  const handleRemoveCombo = (indexToRemove: number) => {
    const updated = approvedCombos.filter((_, idx) => idx !== indexToRemove);
    setApprovedCombos(updated);
    const newMax = updated.length * 40;
    if (maxStudentSeats > newMax) {
      setMaxStudentSeats(Math.max(1, newMax));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (approvedCombos.length === 0) {
      setErrorMsg("Please approve at least one Grade-Section-Subject combination.");
      return;
    }

    const maxAllowed = approvedCombos.length * 40;
    if (maxStudentSeats > maxAllowed) {
      setErrorMsg(`Student seats cannot exceed ${maxAllowed} (Max 40 students per combination for ${approvedCombos.length} combinations).`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Get current Super Admin ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication failed: No ID Token found. Please relogin.");

      // 2. Call the Next.js Server Action securely
      const result = await provisionSchoolAccount(idToken, {
         kortexId,
         orgName,
         email,
         approvedCombos,
         maxStudentSeats: Number(maxStudentSeats),
         subscriptionEndDate
      });

      if (!result.success) {
         throw new Error(result.error);
      }

      // 3. Show Success & Copy Screen
      setSuccessData({
         kortexId: result.kortexId!,
         email: result.email!,
         passwordLink: result.passwordLink!,
         orgName
      });

    } catch (err: any) {
      console.error("Provisioning Error:", err);
      setErrorMsg(err.message || "An error occurred while provisioning the organization.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTemplate = () => {
    if (!successData) return;
    const template = `Subject: Welcome to Kortex Klassroom - Your Organization Account\n\nHi ${successData.orgName},\n\nWelcome to Kortex Klassroom! Your administrator account has been successfully provisioned.\n\nHere are your official login details:\nKortex ID: ${successData.kortexId}\nLogin Email: ${successData.email}\n\nPlease click the secure link below to set your permanent password and complete your organization's onboarding profile:\n${successData.passwordLink}\n\nIf you have any questions, simply reply to this email.\n\nBest,\nAshish & The Kortex Team`;
    
    navigator.clipboard.writeText(template);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  if (successData) {
    if (!mounted) return null;

    return createPortal(
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative border-4 border-emerald-100 p-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 size={36} />
          </div>
          <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Organization Provisioned!</h3>
          <p className="text-sm font-medium text-slate-500 text-center mb-6">
            The account has been created securely. Click below to copy the welcome email and send it to the institution administrator.
          </p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-[10px] font-black uppercase px-2 py-1 rounded-bl-xl">Email Template</div>
             <div className="text-xs text-slate-600 font-medium whitespace-pre-wrap mt-2">
Subject: Welcome to Kortex Klassroom - Your Organization Account

Hi {successData.orgName},

Welcome to Kortex Klassroom! Your administrator account has been successfully provisioned.

Here are your official login details:
<span className="font-bold text-indigo-600">Kortex ID:</span> {successData.kortexId}
<span className="font-bold text-indigo-600">Login Email:</span> {successData.email}

Please click the secure link below to set your permanent password and complete your organization's onboarding profile:
<span className="text-sky-500 underline break-all">{successData.passwordLink}</span>

If you have any questions, simply reply to this email.

Best,
Ashish & The Kortex Team
             </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCopyTemplate}
              className={`flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
            >
              {isCopied ? <CheckCircle2 size={18}/> : <Copy size={18} />}
              {isCopied ? 'Copied to Clipboard!' : 'Copy Email Template'}
            </button>
            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    , document.body);
  }

  if (!mounted) return null;

  const maxAllowedStudents = approvedCombos.length * 40;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 overflow-y-auto py-8">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative border-4 border-slate-100 p-8 my-auto">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 leading-tight">Add Organization</h2>
            <p className="text-xs font-semibold text-slate-400">B2B SaaS Provisioning</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex gap-2 items-start animate-shake">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-2">
            <label className="block text-xs font-black text-indigo-900 mb-1 uppercase tracking-wider">
              Custom User ID (Global Linking Key) *
            </label>
            <input
              type="text"
              required
              value={kortexId}
              onChange={(e) => setKortexId(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              placeholder="e.g. ORG_DPS_DELHI_01"
              className="w-full bg-white border-2 border-indigo-200 rounded-xl px-4 py-2.5 font-black text-indigo-900 outline-none focus:border-indigo-500 text-sm placeholder:text-indigo-200 uppercase"
            />
            <p className="text-[10px] text-indigo-500 font-bold mt-1">This must be globally unique. It will be used to link teachers and students.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Organization Name *</label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Delhi Public School"
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Admin Contact Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="principal@dps.edu"
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Grade-Section-Subject Combinations Selector */}
          <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600" /> Grade-Section-Subject Combinations *
              </label>
              <span className="text-[11px] font-black bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                {approvedCombos.length} Approved (Max {maxAllowedStudents} Students)
              </span>
            </div>

            {/* Dropdowns to add combo: Grade, Section, Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Grade</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                >
                  {GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                >
                  {SECTIONS.map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                >
                  {SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddCombo}
                className="w-full sm:w-auto px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
              >
                <Plus size={14} /> Add Combination
              </button>
            </div>

            {/* List of active combinations */}
            <div>
              {approvedCombos.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                  {approvedCombos.map((combo, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-800 rounded-lg text-[11px] font-black shadow-xs"
                    >
                      {combo}
                      <button
                        type="button"
                        onClick={() => handleRemoveCombo(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove combination"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] font-semibold text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-100">
                  No combinations approved. Please add at least one combination.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Student Seats Quota *</label>
              <span className="text-[11px] font-bold text-indigo-600">
                Max Allowed: {maxAllowedStudents} ({approvedCombos.length} × 40)
              </span>
            </div>
            <input
              type="number"
              required
              min={1}
              max={Math.max(1, maxAllowedStudents)}
              value={maxStudentSeats}
              onChange={(e) => setMaxStudentSeats(Number(e.target.value))}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
            />
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Auto-filled to {maxAllowedStudents} students (40 students/combo). Any number below this is allowed.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Subscription End Date</label>
            <input
              type="date"
              required
              value={subscriptionEndDate}
              onChange={(e) => setSubscriptionEndDate(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || approvedCombos.length === 0 || maxStudentSeats > maxAllowedStudents || maxStudentSeats < 1}
            className="w-full py-3.5 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Provisioning Account...' : (
              <><Send size={16} /> Create Organization Account</>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

