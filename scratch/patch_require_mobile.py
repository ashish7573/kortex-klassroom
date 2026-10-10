import re

with open('kortex_users/parent/RequireMobileModal.tsx', 'r') as f:
    content = f.read()

# 1. Update COUNTRY_CODES
codes_old = """const COUNTRY_CODES = [
  { code: '+91', country: 'IN', digits: 10 },
  { code: '+1', country: 'US/CA', digits: 10 },
  { code: '+44', country: 'UK', digits: 10 },
  { code: '+61', country: 'AU', digits: 9 },
  { code: '+971', country: 'AE', digits: 9 },
  { code: '+65', country: 'SG', digits: 8 },
];"""

codes_new = """const COUNTRY_CODES = [
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
];"""
content = content.replace(codes_old, codes_new)

# 2. Update state to include `customCountryCode`
state_old = """  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState('');"""
state_new = """  const [countryCode, setCountryCode] = useState('+91');
  const [customCountryCode, setCustomCountryCode] = useState('');
  const [mobile, setMobile] = useState('');"""
content = content.replace(state_old, state_new)

# 3. Update handleSubmit
submit_old = """  const handleSubmit = async (e: React.FormEvent) => {
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

submit_new = """  const handleSubmit = async (e: React.FormEvent) => {
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
      await onSubmit(`${actualCountryCode} ${digitsOnly}`);"""
content = content.replace(submit_old, submit_new)

# 4. Update UI
ui_old = """              <div className="flex gap-2">
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
              </div>"""

ui_new = """              <div className="flex gap-2">
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
              </div>"""
content = content.replace(ui_old, ui_new)

with open('kortex_users/parent/RequireMobileModal.tsx', 'w') as f:
    f.write(content)

