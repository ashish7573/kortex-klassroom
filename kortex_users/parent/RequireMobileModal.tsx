"use client";

import React, { useState } from 'react';
import { ShieldCheck, Phone, X } from 'lucide-react';

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


interface RequireMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mobile: string) => Promise<void>;
}

export default function RequireMobileModal({ isOpen, onClose, onSubmit }: RequireMobileModalProps) {
  const [countryCode, setCountryCode] = useState('+91');
  const [customCountryCode, setCustomCountryCode] = useState('');
  const [mobile, setMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isOther = countryCode === 'other';
    const actualCountryCode = isOther ? customCountryCode.trim() : countryCode;

    if (isOther && !actualCountryCode.startsWith('+')) {
      setErrorMsg("Custom country code must start with a '+' sign.");
      return;
    }

    const expectedDigits = COUNTRY_CODES.find(c => c.code === countryCode)?.digits || 0;
    const digitsOnly = mobile.replace(/\D/g, '');
    
    if (!isOther && digitsOnly.length !== expectedDigits) {
      setErrorMsg(`Mobile number for ${countryCode} must be exactly ${expectedDigits} digits.`);
      return;
    }

    if (isOther && digitsOnly.length < 5) {
      setErrorMsg(`Please enter a valid mobile number.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit(`${actualCountryCode} ${digitsOnly}`);
      onClose(); // In case the parent component doesn't unmount it
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save mobile number.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-sky-500 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
            <ShieldCheck size={32} className="text-white" />
          </div>
          
          <h2 className="text-2xl font-black mb-1">Organization Linking Required</h2>
          <p className="text-sky-100 text-sm font-semibold">
            Emergency contact information needed
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-600 text-sm font-medium mb-6">
            To connect your child to a school or organization, we require a parent mobile number. 
            This serves as an essential emergency contact for the organization.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Phone size={14} /> Mobile Number
              </label>
              <div className="flex gap-2">
                <select 
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="bg-slate-50 border-2 border-slate-200 focus:border-sky-500 rounded-xl px-3 py-3 font-bold text-slate-700 outline-none transition-colors cursor-pointer"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.country} {c.code !== 'other' ? `(${c.code})` : ''}</option>
                  ))}
                </select>
                {countryCode === 'other' && (
                  <input
                    type="text"
                    required
                    value={customCountryCode}
                    onChange={(e) => setCustomCountryCode(e.target.value)}
                    placeholder="+XXX"
                    className="w-20 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 transition-colors"
                  />
                )}
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="Mobile Number"
                  className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-rose-500 text-sm font-bold text-center bg-rose-50 p-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Save & Continue"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

