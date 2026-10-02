const fs = require('fs');
const file = 'kortex_users/kortex_admin/UsersManager.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Import updateIndividualUser
if (!code.includes("import { updateIndividualUser }")) {
  code = code.replace(
    `import { deleteIndividualUser } from '../../app/actions/student';`,
    `import { deleteIndividualUser, updateIndividualUser } from '../../app/actions/student';`
  );
}

// 2. Add state for editingIndividual
code = code.replace(
  `const [editingOrg, setEditingOrg] = useState<OrgAdminProfile | null>(null);`,
  `const [editingOrg, setEditingOrg] = useState<OrgAdminProfile | null>(null);\n  const [editingIndividual, setEditingIndividual] = useState<any | null>(null);`
);

// 3. Add Edit Button next to Trash
const actionsCellOld = `                    <td className="px-6 py-4 text-right">
                        <button 
                           onClick={() => handleDeleteIndividual(ind.uid, ind.full_name || 'User', ind.role)}
                           className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                           title="Delete User"
                        >
                           <Trash2 size={16} />
                        </button>
                    </td>`;

const actionsCellNew = `                    <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                        <button 
                           onClick={() => setEditingIndividual(ind)}
                           className="p-2 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-colors"
                           title="Edit User"
                        >
                           <Pencil size={16} />
                        </button>
                        <button 
                           onClick={() => handleDeleteIndividual(ind.uid, ind.full_name || 'User', ind.role)}
                           className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                           title="Delete User"
                        >
                           <Trash2 size={16} />
                        </button>
                    </td>`;

code = code.replace(actionsCellOld, actionsCellNew);

// 4. Add EditIndividualModal component to the very end of the file
const editModalComponent = `
function EditIndividualModal({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: (updated: any) => void }) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    kortex_id: user.kortex_id || '',
    is_pro: user.is_pro || false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not authenticated");
      
      const result = await updateIndividualUser(idToken, user.uid, formData);
      if (!result.success) throw new Error(result.error);
      
      onSuccess({ ...user, ...formData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-800">Edit {user.role}</h3>
            <p className="text-sm font-semibold text-slate-400">UID: {user.uid}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl border-2 border-rose-100 flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="font-bold text-sm">{error}</span>
            </div>
          )}
          
          <form id="edit-ind-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input 
                type="text" required
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none font-semibold text-slate-700 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input 
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none font-semibold text-slate-700 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kortex ID</label>
              <input 
                type="text"
                value={formData.kortex_id}
                onChange={e => setFormData({...formData, kortex_id: e.target.value})}
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none font-mono text-slate-700 transition-all uppercase"
              />
            </div>
            
            {(user.role === 'parent' || user.role === 'student') && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer" onClick={() => setFormData({...formData, is_pro: !formData.is_pro})}>
                <div className={\`w-6 h-6 rounded flex items-center justify-center transition-colors \${formData.is_pro ? 'bg-amber-500 text-white' : 'bg-white border-2 border-amber-200'}\`}>
                  {formData.is_pro && <CheckCircle2 size={16} />}
                </div>
                <div>
                  <h4 className="font-bold text-amber-900">Kortex Pro Account</h4>
                  <p className="text-xs font-semibold text-amber-700/70">Grants unlimited hearts and full curriculum access</p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            form="edit-ind-form"
            type="submit" 
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

// 5. Append EditIndividualModal to the file and add it to the render loop
code = code.replace(
  `        />\n      )}\n    </div>\n  );\n}`,
  `        />
      )}
      {editingIndividual && (
        <EditIndividualModal 
          user={editingIndividual}
          onClose={() => setEditingIndividual(null)}
          onSuccess={(updatedUser) => {
             setIndividuals(prev => prev.map(p => p.uid === updatedUser.uid ? updatedUser : p));
             setEditingIndividual(null);
          }}
        />
      )}
    </div>
  );
}

${editModalComponent}
`
);

// 6. Ensure X is imported from lucide-react if not already
if (!code.includes("X,")) {
  code = code.replace(
    `Users, Building2, UserPlus, Search, ShieldCheck, `,
    `Users, Building2, UserPlus, Search, ShieldCheck, X, `
  );
}

fs.writeFileSync(file, code);
