const fs = require('fs');
const file = 'kortex_users/parent/ParentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add selectedChildId state initialization to 'profile'
code = code.replace(
  `  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);`,
  `  const [selectedChildId, setSelectedChildId] = useState<string>('profile');`
);

// 2. Add Profile form state
code = code.replace(
  `  const [isProcessing, setIsProcessing] = useState(false);`,
  `  const [isProcessing, setIsProcessing] = useState(false);\n  const [profileForm, setProfileForm] = useState({ fullName: profile.full_name || '', contactNumber: (profile as any).contact_number || '', email: profile.email || '' });\n  const [isSavingProfile, setIsSavingProfile] = useState(false);`
);

// 3. Add handleProfileUpdate
const updateProfileLogic = `
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const res = await fetch('/api/actions', {
         // Alternatively use updateParentProfile directly if imported... wait, this is a client component, I can import it!
      });
      // Actually let's just import updateParentProfile!
    } catch(err) {
      
    }
  };
`;

code = code.replace(
  `import { resolveTransferRequest } from '../../app/actions/student';`,
  `import { resolveTransferRequest, updateParentProfile } from '../../app/actions/student';`
);

const submitProfileLogic = `
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const result = await updateParentProfile(idToken, profileForm);
      if (!result.success) throw new Error(result.error);
      
      alert("Profile updated successfully! All your linked children have been synced with the organizations.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };
`;

code = code.replace(
  `  const handleResolveTransfer = async`,
  submitProfileLogic + `\n  const handleResolveTransfer = async`
);

// 4. Update the horizontal switcher to include "My Profile" at the beginning
const newSwitcher = `        <>
          {/* Multi-Child Horizontal Switcher */}
          <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {/* My Profile Tab */}
            <button
                onClick={() => setSelectedChildId('profile')}
                className={\`flex-shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 transition-all cursor-pointer \${
                  selectedChildId === 'profile' 
                    ? 'bg-slate-900 border-slate-900 shadow-md transform scale-100' 
                    : 'bg-white border-slate-100 hover:border-slate-300 transform scale-95 opacity-80 hover:opacity-100'
                }\`}
              >
                <div className={\`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg \${
                  selectedChildId === 'profile' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-500'
                }\`}>
                  <User size={20} />
                </div>
                <div className="text-left">
                  <h3 className={\`font-black text-sm \${selectedChildId === 'profile' ? 'text-white' : 'text-slate-700'}\`}>My Profile</h3>
                  <p className={\`text-xs font-semibold \${selectedChildId === 'profile' ? 'text-slate-400' : 'text-slate-400'}\`}>Account Settings</p>
                </div>
            </button>
            
            {/* Children Tabs */}
            {children.map(child => (`;

code = code.replace(
  `        <>
          {/* Multi-Child Horizontal Switcher (As requested by User) */}
          <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {children.map(child => (`,
  newSwitcher
);

// 5. Replace the View Render
const renderProfileView = `          {/* Render Profile OR Selected Child */}
          {selectedChildId === 'profile' ? (
             <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6 sm:p-8 animate-fade-in max-w-2xl">
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                   <User size={28} className="stroke-[3px]" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-slate-800">My Profile</h2>
                   <p className="text-sm font-semibold text-slate-500">Manage your contact details. Changes instantly sync to organizations.</p>
                 </div>
               </div>
               
               <form onSubmit={handleProfileSubmit} className="space-y-6">
                 <div>
                   <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                   <input 
                     type="text" required
                     value={profileForm.fullName}
                     onChange={e => setProfileForm({...profileForm, fullName: e.target.value})}
                     className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                   <input 
                     type="email" required
                     value={profileForm.email}
                     onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                     className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Emergency Contact (Phone)</label>
                   <input 
                     type="text" required
                     value={profileForm.contactNumber}
                     onChange={e => setProfileForm({...profileForm, contactNumber: e.target.value})}
                     className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                   />
                   <p className="text-xs font-semibold text-slate-400 mt-2">This number is securely shared with organizations in case of emergencies.</p>
                 </div>
                 <div className="pt-4 border-t-2 border-slate-100">
                   <button 
                     type="submit"
                     disabled={isSavingProfile}
                     className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                   >
                     {isSavingProfile ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />} 
                     {isSavingProfile ? 'Syncing securely...' : 'Save & Sync Details'}
                   </button>
                 </div>
               </form>
             </div>
          ) : selectedChild ? (
            <div className="space-y-6 animate-fade-in">`;

code = code.replace(
  `          {selectedChild && (
            <div className="space-y-6 animate-fade-in">`,
  renderProfileView
);

code = code.replace(
  `              {/* Footer Space */}\n              <div className="h-12" />\n            </div>\n          )}\n        </>\n      )}`,
  `              {/* Footer Space */}\n              <div className="h-12" />\n            </div>\n          ) : null}\n        </>\n      )}`
);

// 6. Ensure 'User' icon is imported
if (!code.includes("User,")) {
  code = code.replace(`Heart, Plus, AlertCircle, Phone, RefreshCw, `, `Heart, Plus, AlertCircle, Phone, RefreshCw, User, `);
  code = code.replace(`Plus, Heart, LogOut, CheckCircle2, ShieldCheck,`, `Plus, Heart, LogOut, CheckCircle2, ShieldCheck, User,`);
}

// 7. Auto select first child if 'profile' logic
// Need to modify the useEffect where it says:
// if (data.length > 0 && !selectedChildId) { setSelectedChildId(data[0].uid); }
// We can just leave it to default to 'profile' !

fs.writeFileSync(file, code);
