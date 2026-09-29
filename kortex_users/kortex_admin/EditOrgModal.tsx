"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, X, Send, CheckCircle2, Plus, Layers } from 'lucide-react';
import { auth } from '../../backend_configurations/firebase';
import { updateOrganizationAccount } from '../../app/actions/provision';
import { OrgAdminProfile } from '../../types/user';
import { GRADES, SUBJECTS, SECTIONS } from '../../kortex_landing_page/curriculumConfig';

interface EditOrgModalProps {
  org: OrgAdminProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditOrgModal({ org, onClose, onSuccess }: EditOrgModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form State
  const [orgName, setOrgName] = useState(org.organization_name || '');
  
  // Grade-Section-Subject Combinations State
  const initialCombos = org.approved_grade_subject_combos && org.approved_grade_subject_combos.length > 0
    ? org.approved_grade_subject_combos
    : [];
  const [approvedCombos, setApprovedCombos] = useState<string[]>(initialCombos);
  const [selectedGrade, setSelectedGrade] = useState<string>(GRADES[4] || 'Grade 1');
  const [selectedSection, setSelectedSection] = useState<string>(SECTIONS[0] || 'A');
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECTS[0] || 'English');
  
  // Student Seats (Defaults to combos * 40 or previous license_quota)
  const initialStudentSeats = org.license_quota || (initialCombos.length > 0 ? initialCombos.length * 40 : 40);
  const [maxStudentSeats, setMaxStudentSeats] = useState<number>(initialStudentSeats);
  
  const getInitialDate = () => {
    if (!org.subscription_end_date) return '';
    return new Date(org.subscription_end_date).toISOString().split('T')[0];
  };
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(getInitialDate());
  const [agreementUrl, setAgreementUrl] = useState(org.agreement_url || '');
  const [invoiceUrl, setInvoiceUrl] = useState(org.invoice_url || '');

  const [mounted, setMounted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleAddCombo = () => {
    const combo = `${selectedGrade} - Section ${selectedSection} - ${selectedSubject}`;
    if (approvedCombos.includes(combo)) {
      setErrorMsg(`"${combo}" is already added.`);
      return;
    }
    setErrorMsg('');
    const updated = [...approvedCombos, combo];
    setApprovedCombos(updated);
    // Auto-fill student quota to the new ceiling
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
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication failed: No ID Token found. Please relogin.");

      const result = await updateOrganizationAccount(idToken, org.uid!, {
         orgName,
         approvedCombos,
         maxStudentSeats: Number(maxStudentSeats),
         subscriptionEndDate: subscriptionEndDate || null,
         agreementUrl,
         invoiceUrl
      });

      if (!result.success) {
         throw new Error(result.error);
      }

      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during the update.');
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const maxAllowedStudents = approvedCombos.length * 40;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-indigo-600 p-6 sm:p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Edit Organization</h2>
              <p className="text-indigo-200 font-medium text-sm">Update combinations, pricing quotas, and documents</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {showSuccess ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
             <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
             </div>
             <h3 className="text-2xl font-black text-slate-800 mb-2">Update Successful!</h3>
             <p className="text-slate-500 font-medium">The organization details have been saved.</p>
          </div>
        ) : (
          <div className="p-6 sm:p-8 overflow-y-auto">
            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold rounded-xl text-sm">
                {errorMsg}
              </div>
            )}

            <form id="editOrgForm" onSubmit={handleSubmit} className="space-y-6">
              {/* Readonly Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Kortex ID (Locked)</label>
                  <input type="text" value={org.kortex_id} readOnly className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-500 outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Admin Email (Locked)</label>
                  <input type="email" value={org.email} readOnly className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-500 outline-none cursor-not-allowed" />
                </div>
              </div>

              {/* Organization Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Organization Name *</label>
                <input required type="text" value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
              </div>

              {/* Grade-Section-Subject Combinations Selector */}
              <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={16} className="text-indigo-600" /> Grade-Section-Subject Combinations Approved *
                  </label>
                  <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                    {approvedCombos.length} Approved (Max {maxAllowedStudents} Students)
                  </span>
                </div>

                {/* Dropdowns to add new combo: Grade, Section, Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Grade</label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                    >
                      {GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                    >
                      {SECTIONS.map(s => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Subject</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
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
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Plus size={16} /> Add Combination
                  </button>
                </div>

                {/* List of active combinations */}
                <div className="pt-2">
                  <p className="text-[11px] font-black uppercase text-slate-400 mb-2">Selected Combinations:</p>
                  {approvedCombos.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {approvedCombos.map((combo, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-800 rounded-xl text-xs font-black shadow-sm"
                        >
                          {combo}
                          <button
                            type="button"
                            onClick={() => handleRemoveCombo(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                            title="Remove combination"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                      No combinations approved. Please select Grade, Section, and Subject above and click &quot;Add Combination&quot;.
                    </p>
                  )}
                </div>
              </div>

              {/* Student Seats Allocation */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Student Accounts Needed *
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600">
                    Max: {maxAllowedStudents} ({approvedCombos.length} × 40)
                  </span>
                </div>
                <input 
                  required 
                  type="number" 
                  min={1} 
                  max={Math.max(1, maxAllowedStudents)}
                  value={maxStudentSeats} 
                  onChange={e => setMaxStudentSeats(Number(e.target.value))} 
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 outline-none focus:border-indigo-500 transition-colors" 
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Auto-filled to capacity ({maxAllowedStudents}). Editable to any number below this maximum.
                </p>
              </div>

              {/* Subscription End Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Subscription End Date</label>
                <input type="date" value={subscriptionEndDate} onChange={e => setSubscriptionEndDate(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors text-sm" />
                <p className="text-[11px] text-slate-400 font-medium mt-1">Leave blank for lifetime access.</p>
              </div>

              {/* Agreement and Invoice URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Agreement URL (PDF)</label>
                  <input type="url" value={agreementUrl} onChange={e => setAgreementUrl(e.target.value)} placeholder="https://drive.google.com/..." className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 outline-none focus:border-indigo-500 transition-colors text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Purchase Order / Invoice URL</label>
                  <input type="url" value={invoiceUrl} onChange={e => setInvoiceUrl(e.target.value)} placeholder="https://drive.google.com/..." className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 outline-none focus:border-indigo-500 transition-colors text-sm" />
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        {!showSuccess && (
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} type="button" disabled={isSubmitting} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button 
              type="submit" 
              form="editOrgForm" 
              disabled={isSubmitting || !orgName || approvedCombos.length === 0 || maxStudentSeats > maxAllowedStudents || maxStudentSeats < 1} 
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? 'Saving...' : <><Send size={18} /> Save Changes</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
