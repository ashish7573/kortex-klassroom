import re

with open('kortex_users/parent/RequireMobileModal.tsx', 'r') as f:
    content = f.read()

# Add COUNTRY_CODES
imports_old = "import React, { useState } from 'react';\nimport { ShieldCheck, Phone, X } from 'lucide-react';"
imports_new = """import React, { useState } from 'react';
import { ShieldCheck, Phone, X } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', digits: 10 },
  { code: '+1', country: 'US/CA', digits: 10 },
  { code: '+44', country: 'UK', digits: 10 },
  { code: '+61', country: 'AU', digits: 9 },
  { code: '+971', country: 'AE', digits: 9 },
  { code: '+65', country: 'SG', digits: 8 },
];
"""
content = content.replace(imports_old, imports_new)

# State changes
state_old = "  const [mobile, setMobile] = useState('');"
state_new = """  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState('');"""
content = content.replace(state_old, state_new)

# Handle submit logic
submit_old = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.trim().length < 10) {
      setErrorMsg("Please provide a valid mobile number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit(mobile.trim());"""
submit_new = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expectedDigits = COUNTRY_CODES.find(c => c.code === countryCode)?.digits || 10;
    const digitsOnly = mobile.replace(/\D/g, '');
    if (digitsOnly.length !== expectedDigits) {
      setErrorMsg(`Mobile number for ${countryCode} must be exactly ${expectedDigits} digits.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit(`${countryCode} ${digitsOnly}`);"""
content = content.replace(submit_old, submit_new)

# UI changes
form_old = """            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Phone size={14} /> Mobile Number
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 transition-colors"
                autoFocus
              />
            </div>"""

form_new = """            <div>
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
                    <option key={c.code} value={c.code}>{c.country} ({c.code})</option>
                  ))}
                </select>
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
            </div>"""
content = content.replace(form_old, form_new)

with open('kortex_users/parent/RequireMobileModal.tsx', 'w') as f:
    f.write(content)

