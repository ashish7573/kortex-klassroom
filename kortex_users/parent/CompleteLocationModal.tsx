"use client";

import React, { useState } from 'react';
import { MapPin, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { auth } from '../../backend_configurations/firebase';
import { updateParentProfile } from '../../app/actions/student';

interface CompleteLocationModalProps {
  isOpen: boolean;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  initialCity?: string;
  initialState?: string;
  initialCountry?: string;
  onCompleted: (updated: { city: string; state: string; country: string }) => void;
}

export default function CompleteLocationModal({
  isOpen,
  parentName,
  parentEmail,
  parentPhone,
  initialCity = '',
  initialState = '',
  initialCountry = 'India',
  onCompleted,
}: CompleteLocationModalProps) {
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [country, setCountry] = useState(initialCountry || 'India');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCity = city.trim();
    const cleanState = state.trim();
    const cleanCountry = country.trim();

    if (!cleanCity || !cleanState || !cleanCountry) {
      setErrorMsg("Please fill in all 3 fields: City, State / Province, and Country.");
      return;
    }

    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication session expired. Please log in again.");
      const idToken = await user.getIdToken(true);

      const result = await updateParentProfile(idToken, {
        fullName: parentName,
        contactNumber: parentPhone,
        email: parentEmail,
        city: cleanCity,
        state: cleanState,
        country: cleanCountry,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update profile. Please try again.");
      }

      onCompleted({
        city: cleanCity,
        state: cleanState,
        country: cleanCountry,
      });
    } catch (err: any) {
      console.error("Error saving parent location details:", err);
      setErrorMsg(err.message || "An unexpected error occurred while saving details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border-2 border-slate-100 overflow-hidden animate-scale-up">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white text-center relative">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <MapPin size={28} className="text-white stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Complete Your Profile</h2>
          <p className="text-indigo-100 text-xs font-semibold mt-1 max-w-sm mx-auto">
            Please provide your location details to complete your parent registration and access your student dashboard.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Verified Account Ribbon */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Account Verified</span>
              <span className="font-black text-slate-800 text-sm">{parentName || 'Parent User'}</span>
              <span className="text-slate-400 block text-[11px] font-mono">{parentEmail} • {parentPhone}</span>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px] flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-600" /> Phone Verified
            </span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-start gap-2 animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                City / Town <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai, New Delhi, Bengaluru"
                disabled={isSaving}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  State / Province <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra, Delhi"
                  disabled={isSaving}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Country <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. India"
                  disabled={isSaving}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 text-sm"
                />
              </div>
            </div>

            <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 pt-1">
              <ShieldCheck size={14} className="text-indigo-500 shrink-0" />
              Your details are used strictly for emergency contact and official student records.
            </p>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSaving || !city.trim() || !state.trim() || !country.trim()}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Location Details...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Save & Continue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

