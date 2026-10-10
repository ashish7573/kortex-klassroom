import re

with open('kortex_users/parent/ParentDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update State
old_state = "const [profileForm, setProfileForm] = useState({ fullName: profile.full_name || '', contactNumber: (profile as any).contact_number || '', email: profile.email || '' });"

new_state = """
  const initialContact = (profile as any).contact_number || '';
  let initCountryCode = '+91';
  let initMobile = initialContact;
  if (initialContact.startsWith('+')) {
    const spaceIdx = initialContact.indexOf(' ');
    if (spaceIdx > 0) {
      initCountryCode = initialContact.slice(0, spaceIdx);
      initMobile = initialContact.slice(spaceIdx + 1);
    }
  }

  const [profileForm, setProfileForm] = useState({ 
    fullName: profile.full_name || '', 
    email: profile.email || '',
    countryCode: initCountryCode,
    mobileNumber: initMobile,
    city: (profile as any).city || '',
    country: (profile as any).country || ''
  });
  
  const COUNTRY_CODES = [
    { code: '+91', country: 'IN', digits: 10 },
    { code: '+1', country: 'US/CA', digits: 10 },
    { code: '+44', country: 'UK', digits: 10 },
    { code: '+61', country: 'AU', digits: 9 },
    { code: '+971', country: 'AE', digits: 9 },
    { code: '+65', country: 'SG', digits: 8 },
  ];
"""
content = content.replace(old_state, new_state)

# 2. Update Submission
old_submit = """    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No ID Token found. Please relogin.");
      
      const result = await updateParentProfile(idToken, profileForm);"""

new_submit = """    try {
      const expectedDigits = COUNTRY_CODES.find(c => c.code === profileForm.countryCode)?.digits || 10;
      const digitsOnly = profileForm.mobileNumber.replace(/\D/g, '');
      if (digitsOnly.length !== expectedDigits) {
        alert(`Mobile number for ${profileForm.countryCode} must be exactly ${expectedDigits} digits.`);
        setIsSavingProfile(false);
        return;
      }

      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No ID Token found. Please relogin.");
      
      const payload = {
         fullName: profileForm.fullName,
         email: profileForm.email,
         contactNumber: `${profileForm.countryCode} ${digitsOnly}`,
         city: profileForm.city,
         country: profileForm.country
      };
      
      const result = await updateParentProfile(idToken, payload);"""
content = content.replace(old_submit, new_submit)


# 3. Update Form UI
old_form_fields = """                   <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Emergency Contact (Phone)</label>
                     <input 
                       type="text" required
                       value={profileForm.contactNumber}
                       onChange={e => setProfileForm({...profileForm, contactNumber: e.target.value})}
                       className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                     />
                     <p className="text-xs font-semibold text-slate-400 mt-2">This number is securely shared with organizations in case of emergencies.</p>
                   </div>"""

new_form_fields = """                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                   </div>
                   
                   <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Emergency Contact (Phone)</label>
                     <div className="flex gap-2">
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
                     </div>
                     <p className="text-xs font-semibold text-slate-400 mt-2">This number is securely shared with organizations in case of emergencies.</p>
                   </div>"""

content = content.replace(old_form_fields, new_form_fields)

with open('kortex_users/parent/ParentDashboard.tsx', 'w') as f:
    f.write(content)
