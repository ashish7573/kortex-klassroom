const fs = require('fs');
const file = 'kortex_users/parent/ParentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add states
code = code.replace(
  `  const [isSavingProfile, setIsSavingProfile] = useState(false);`,
  `  const [isSavingProfile, setIsSavingProfile] = useState(false);\n  const [showCredsFor, setShowCredsFor] = useState<string | null>(null);\n  const [newPin, setNewPin] = useState('');\n  const [isUpdatingPin, setIsUpdatingPin] = useState(false);`
);

// 2. Add handleUpdatePin
const updatePinLogic = `
  const handleUpdatePin = async (e: React.FormEvent, childUid: string) => {
    e.preventDefault();
    if (newPin.length < 4) return alert("PIN must be at least 4 characters.");
    setIsUpdatingPin(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const { updateChildPin } = await import('../../app/actions/student');
      const result = await updateChildPin(idToken, childUid, newPin);
      if (!result.success) throw new Error(result.error);
      
      alert("PIN updated successfully!");
      setShowCredsFor(null);
      setNewPin('');
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingPin(false);
    }
  };
`;

code = code.replace(
  `  const handleProfileUpdate = async`,
  updatePinLogic + `\n  const handleProfileUpdate = async`
);

// 3. Replace the "Enter Child Mode" button with "Manage Login" and credentials inline UI
const credsUI = `
                <button 
                  onClick={() => setShowCredsFor(showCredsFor === selectedChild.uid ? null : selectedChild.uid)}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <ShieldCheck size={18} /> Login Details
                </button>
              </div>

              {/* Login Details Expanded */}
              {showCredsFor === selectedChild.uid && (
                <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 sm:p-8 animate-in slide-in-from-top-4">
                  <div className="flex flex-col sm:flex-row gap-8">
                    
                    {/* Read-only Current Details */}
                    <div className="flex-1 space-y-4">
                      <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><User size={20}/> Current Credentials</h3>
                      <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Student Kortex ID (Username)</p>
                        <div className="font-mono text-lg font-bold text-slate-700 bg-white border-2 border-slate-200 p-3 rounded-xl inline-block">
                          {selectedChild.kortex_id}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Current PIN / Password</p>
                        <div className="font-mono text-lg font-bold text-slate-700 bg-white border-2 border-slate-200 p-3 rounded-xl inline-block">
                          {selectedChild.plain_pin || '••••••'}
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 max-w-sm">
                        The student must use this exact Kortex ID and PIN to log into their dashboard.
                      </p>
                    </div>

                    {/* Change PIN Form */}
                    <div className="flex-1 border-t-2 sm:border-t-0 sm:border-l-2 border-slate-200 pt-6 sm:pt-0 sm:pl-8">
                      <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4"><RefreshCw size={20}/> Change PIN</h3>
                      <form onSubmit={(e) => handleUpdatePin(e, selectedChild.uid)} className="space-y-4">
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">New PIN / Password</label>
                          <input 
                            type="text" 
                            required 
                            minLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            placeholder="e.g. 1234 or apple123"
                            className="w-full bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={isUpdatingPin || newPin.length < 4}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
                        >
                          {isUpdatingPin ? 'Updating...' : 'Update PIN securely'}
                        </button>
                      </form>
                    </div>

                  </div>
                </div>
              )}
`;

code = code.replace(
  `                {/* Future: Switch to Child Mode Button */}
                <button className="w-full sm:w-auto px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0">
                  <UserPlus size={18} /> Enter Child Mode
                </button>
              </div>`,
  credsUI
);

fs.writeFileSync(file, code);
