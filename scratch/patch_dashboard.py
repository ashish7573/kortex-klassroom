import re
import sys

with open('scratch/ParentDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Add Email inline verification states
email_states = """
  // Inline Email Verification
  const [inlineVerifiedEmail, setInlineVerifiedEmail] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);

  const isEmailChanged = () => {
    return profileForm.email.trim() !== (profile.email || '').trim();
  };

  const isEmailVerifiedInlineBool = () => {
    return inlineVerifiedEmail === profileForm.email.trim();
  };

  const handleVerifyEmail = async () => {
    if (!auth.currentUser) return;
    setEmailVerifying(true);
    try {
      const { verifyBeforeUpdateEmail } = await import('firebase/auth');
      await verifyBeforeUpdateEmail(auth.currentUser, profileForm.email.trim());
      setEmailVerificationSent(true);
      alert("Verification link sent! Please check your email and click the link, then come back here to verify.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to send verification email.");
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    if (!auth.currentUser) return;
    setEmailVerifying(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.email === profileForm.email.trim()) {
        setInlineVerifiedEmail(profileForm.email.trim());
        setEmailVerificationSent(false);
        alert("Email successfully verified! You can now save your profile.");
      } else {
        alert("Email not yet verified. Please click the link in your email and try again.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to check email verification.");
    } finally {
      setEmailVerifying(false);
    }
  };
"""
content = content.replace("  // Inline Phone Verification", email_states + "\n  // Inline Phone Verification")

# 2. Modify the email field in the form
old_email_input = """                   <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                     <input 
                       type="email" required
                       value={profileForm.email}
                       onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                       className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                     />
                   </div>"""

new_email_input = """                   <div>
                     <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                     <div className="flex gap-2">
                       <input 
                         type="email" required
                         value={profileForm.email}
                         onChange={e => {
                           setProfileForm({...profileForm, email: e.target.value});
                           setEmailVerificationSent(false);
                         }}
                         className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                       />
                       {isEmailChanged() && !isEmailVerifiedInlineBool() && (
                         <button
                           type="button"
                           onClick={emailVerificationSent ? handleCheckEmailVerification : handleVerifyEmail}
                           disabled={emailVerifying}
                           className={`px-4 py-3 text-white font-bold rounded-xl shadow-md text-xs shrink-0 disabled:opacity-50 ${emailVerificationSent ? 'bg-sky-500 hover:bg-sky-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                         >
                           {emailVerifying ? '...' : emailVerificationSent ? 'Check Link Clicked' : 'Verify'}
                         </button>
                       )}
                       {(!isEmailChanged() || isEmailVerifiedInlineBool()) && (
                         <span className="px-4 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs flex items-center shrink-0">
                           ✓ Verified
                         </span>
                       )}
                     </div>
                     {emailVerificationSent && (
                       <p className="text-xs font-semibold text-sky-600 mt-2">
                         Verification link sent! Please click the link in your email, then click "Check Link Clicked".
                       </p>
                     )}
                   </div>"""

content = content.replace(old_email_input, new_email_input)

# 3. Update main save button disable condition
old_submit_btn = "disabled={isSavingProfile || (isPhoneChanged() && !isPhoneVerifiedInlineBool())}"
new_submit_btn = "disabled={isSavingProfile || (isPhoneChanged() && !isPhoneVerifiedInlineBool()) || (isEmailChanged() && !isEmailVerifiedInlineBool())}"
content = content.replace(old_submit_btn, new_submit_btn)


# 4. Mandatory fields logic for "Add Child"
# "Also all the fields in parent profile are mendatory to complete and only then they can setup the child account."
is_profile_complete_func = """
  const isProfileComplete = () => {
    return !!(profile.full_name && profile.email && profile.contact_number && (profile as any).city && (profile as any).state && (profile as any).country);
  };
"""

content = content.replace("  const [showMobileModal, setShowMobileModal] = useState(false);", is_profile_complete_func + "\n  const [showMobileModal, setShowMobileModal] = useState(false);")

# Update Add Child button click handler to block if profile not complete
old_add_child_btn = """        <button 
          onClick={() => setInternalShowModal(true)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={18} /> Add / Claim Child
        </button>"""

new_add_child_btn = """        <button 
          onClick={() => {
            if (isProfileComplete()) {
              setInternalShowModal(true);
            } else {
              alert("Please complete all mandatory fields in your profile (Full Name, Email, City, State, Country, Phone) and Save before adding a child.");
              setSelectedChildId('profile');
            }
          }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={18} /> Add / Claim Child
        </button>"""

content = content.replace(old_add_child_btn, new_add_child_btn)

# Same for the empty state Add Child button
old_empty_add_btn = """          <button 
            onClick={() => setInternalShowModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus size={18} /> Add Your First Child
          </button>"""

new_empty_add_btn = """          <button 
            onClick={() => {
              if (isProfileComplete()) {
                setInternalShowModal(true);
              } else {
                alert("Please complete all mandatory fields in your profile (Full Name, Email, City, State, Country, Phone) and Save before adding a child.");
                setSelectedChildId('profile');
              }
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus size={18} /> Add Your First Child
          </button>"""

content = content.replace(old_empty_add_btn, new_empty_add_btn)

# Also make inputs required in form
content = content.replace('placeholder="e.g. Mumbai"', 'placeholder="e.g. Mumbai"\n                         required')
content = content.replace('placeholder="e.g. Maharashtra"', 'placeholder="e.g. Maharashtra"\n                         required')
content = content.replace('placeholder="e.g. India"', 'placeholder="e.g. India"\n                         required')


with open('scratch/ParentDashboard.tsx', 'w') as f:
    f.write(content)


