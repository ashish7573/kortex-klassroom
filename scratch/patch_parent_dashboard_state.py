import re

with open('kortex_users/parent/ParentDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update COUNTRY_CODES
codes_old = """  const COUNTRY_CODES = [
    { code: '+91', country: 'IN', digits: 10 },
    { code: '+1', country: 'US/CA', digits: 10 },
    { code: '+44', country: 'UK', digits: 10 },
    { code: '+61', country: 'AU', digits: 9 },
    { code: '+971', country: 'AE', digits: 9 },
    { code: '+65', country: 'SG', digits: 8 },
  ];"""

codes_new = """  const COUNTRY_CODES = [
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


# 2. Update state to include `state` and `customCountryCode`
state_old = """  const [profileForm, setProfileForm] = useState({ 
    fullName: profile.full_name || '', 
    email: profile.email || '',
    countryCode: initCountryCode,
    mobileNumber: initMobile,
    city: (profile as any).city || '',
    country: (profile as any).country || ''
  });"""

state_new = """  // If the initial country code isn't in our curated list, set it to 'other' and put the value in customCountryCode
  const knownCodes = ['+91', '+1', '+44', '+61', '+971', '+65', '+49', '+33', '+81', '+86', '+55', '+52', '+27', '+64', '+966', '+34', '+39', '+7', '+82', '+62'];
  let defaultCountryCode = initCountryCode;
  let defaultCustomCode = '';
  if (!knownCodes.includes(initCountryCode)) {
    defaultCountryCode = 'other';
    defaultCustomCode = initCountryCode;
  }

  const [profileForm, setProfileForm] = useState({ 
    fullName: profile.full_name || '', 
    email: profile.email || '',
    countryCode: defaultCountryCode,
    customCountryCode: defaultCustomCode,
    mobileNumber: initMobile,
    city: (profile as any).city || '',
    state: (profile as any).state || '',
    country: (profile as any).country || ''
  });"""
content = content.replace(state_old, state_new)


# 3. Update handleProfileSubmit validation and payload
submit_old = """    try {
      const expectedDigits = COUNTRY_CODES.find(c => c.code === profileForm.countryCode)?.digits || 10;
      const digitsOnly = profileForm.mobileNumber.replace(/\D/g, '');
      if (digitsOnly.length !== expectedDigits) {
        alert(`Mobile number for ${profileForm.countryCode} must be exactly ${expectedDigits} digits.`);
        setIsSavingProfile(false);
        return;
      }

      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const payload = {
         fullName: profileForm.fullName,
         email: profileForm.email,
         contactNumber: `${profileForm.countryCode} ${digitsOnly}`,
         city: profileForm.city,
         country: profileForm.country
      };"""

submit_new = """    try {
      const isOther = profileForm.countryCode === 'other';
      const actualCountryCode = isOther ? profileForm.customCountryCode.trim() : profileForm.countryCode;
      
      if (isOther && !actualCountryCode.startsWith('+')) {
         alert("Custom country code must start with a '+' sign.");
         setIsSavingProfile(false);
         return;
      }

      const expectedDigits = COUNTRY_CODES.find(c => c.code === profileForm.countryCode)?.digits || 0;
      const digitsOnly = profileForm.mobileNumber.replace(/\D/g, '');
      
      if (!isOther && digitsOnly.length !== expectedDigits) {
        alert(`Mobile number for ${profileForm.countryCode} must be exactly ${expectedDigits} digits.`);
        setIsSavingProfile(false);
        return;
      }
      
      if (isOther && digitsOnly.length < 5) {
        alert(`Please enter a valid mobile number.`);
        setIsSavingProfile(false);
        return;
      }

      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const payload = {
         fullName: profileForm.fullName,
         email: profileForm.email,
         contactNumber: `${actualCountryCode} ${digitsOnly}`,
         city: profileForm.city,
         state: profileForm.state,
         country: profileForm.country
      };"""
content = content.replace(submit_old, submit_new)


# 4. Update UI grid to include State
grid_old = """                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">City</label>
                       <input 
                         type="text"
                         value={profileForm.city}
                         onChange={e => setProfileForm({...profileForm, city: e.target.value})}
                         placeholder="e.g. Mumbai"
                         className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Country</label>
                       <input 
                         type="text"
                         value={profileForm.country}
                         onChange={e => setProfileForm({...profileForm, country: e.target.value})}
                         placeholder="e.g. India"
                         className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                     </div>
                   </div>"""

grid_new = """                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     <div>
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">City</label>
                       <input 
                         type="text"
                         value={profileForm.city}
                         onChange={e => setProfileForm({...profileForm, city: e.target.value})}
                         placeholder="e.g. Mumbai"
                         className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">State / Province</label>
                       <input 
                         type="text"
                         value={profileForm.state}
                         onChange={e => setProfileForm({...profileForm, state: e.target.value})}
                         placeholder="e.g. Maharashtra"
                         className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Country</label>
                       <input 
                         type="text"
                         value={profileForm.country}
                         onChange={e => setProfileForm({...profileForm, country: e.target.value})}
                         placeholder="e.g. India"
                         className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                     </div>
                   </div>"""
content = content.replace(grid_old, grid_new)


# 5. Update UI for 'Other' country code input
phone_old = """                     <div className="flex gap-2">
                       <select 
                         value={profileForm.countryCode}
                         onChange={e => setProfileForm({...profileForm, countryCode: e.target.value})}
                         className="bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-3 font-bold text-slate-800 outline-none transition-colors cursor-pointer"
                       >
                         {COUNTRY_CODES.map(c => (
                           <option key={c.code} value={c.code}>{c.country} ({c.code})</option>
                         ))}
                       </select>
                       <input 
                         type="tel" required
                         value={profileForm.mobileNumber}
                         onChange={e => setProfileForm({...profileForm, mobileNumber: e.target.value.replace(/\D/g, '')})}
                         placeholder="Mobile Number"
                         className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                     </div>"""

phone_new = """                     <div className="flex gap-2">
                       <select 
                         value={profileForm.countryCode}
                         onChange={e => setProfileForm({...profileForm, countryCode: e.target.value})}
                         className="bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-3 font-bold text-slate-800 outline-none transition-colors cursor-pointer"
                       >
                         {COUNTRY_CODES.map(c => (
                           <option key={c.code} value={c.code}>{c.country} {c.code !== 'other' ? `(${c.code})` : ''}</option>
                         ))}
                       </select>
                       {profileForm.countryCode === 'other' && (
                         <input 
                           type="text" required
                           value={profileForm.customCountryCode}
                           onChange={e => setProfileForm({...profileForm, customCountryCode: e.target.value})}
                           placeholder="+XXX"
                           className="w-20 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-3 font-bold text-slate-800 outline-none transition-colors"
                         />
                       )}
                       <input 
                         type="tel" required
                         value={profileForm.mobileNumber}
                         onChange={e => setProfileForm({...profileForm, mobileNumber: e.target.value.replace(/\D/g, '')})}
                         placeholder="Mobile Number"
                         className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                     </div>"""
content = content.replace(phone_old, phone_new)

# 6. handleResolveTransfer logic needs updating for the custom country code logic:
# parentContactNumber={`${profileForm.countryCode} ${profileForm.mobileNumber}`} -> parentContactNumber={`${profileForm.countryCode === 'other' ? profileForm.customCountryCode : profileForm.countryCode} ${profileForm.mobileNumber}`}
resolve_old = "parentContactNumber={`${profileForm.countryCode} ${profileForm.mobileNumber}`}"
resolve_new = "parentContactNumber={`${profileForm.countryCode === 'other' ? profileForm.customCountryCode.trim() : profileForm.countryCode} ${profileForm.mobileNumber}`}"
content = content.replace(resolve_old, resolve_new)

with open('kortex_users/parent/ParentDashboard.tsx', 'w') as f:
    f.write(content)

