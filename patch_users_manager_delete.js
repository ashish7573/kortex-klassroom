const fs = require('fs');
const file = 'kortex_users/kortex_admin/UsersManager.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Import deleteIndividualUser
if (!code.includes("import { deleteIndividualUser }")) {
  code = code.replace(
    `import { adminDb } from '../../backend_configurations/firebase';`,
    `import { adminDb } from '../../backend_configurations/firebase';\nimport { deleteIndividualUser } from '../../app/actions/student';`
  );
}

// 2. Add handleDeleteIndividual function inside UsersManager
const deleteHandler = `
  const handleDeleteIndividual = async (uid: string, name: string, role: string) => {
    if (!confirm(\`Are you sure you want to completely delete \${name}? \${role === 'parent' ? '\\n\\nWARNING: Deleting a Parent will ALSO delete all their child accounts!' : ''}\`)) return;
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      const result = await deleteIndividualUser(idToken, uid, role);
      if (!result.success) throw new Error(result.error);
      
      // Update local state
      setIndividuals(prev => {
        if (role === 'parent') {
           // Remove the parent and their children
           return prev.filter(p => p.uid !== uid && (p as any).parent_id !== uid);
        }
        return prev.filter(p => p.uid !== uid);
      });
      alert(\`Successfully deleted \${name}.\`);
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };
`;

code = code.replace(`  const handleDeleteOrg = async`, deleteHandler + `\n  const handleDeleteOrg = async`);

// 3. Add Actions column header for Individuals
code = code.replace(
  `<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Join Date</th>`,
  `<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Join Date</th>\n                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider text-right">Actions</th>`
);

// 4. Add Actions cell for Individuals
const actionsCell = `
                    <td className="px-6 py-4 font-semibold text-slate-400">
                      {ind.created_at ? new Date(ind.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                           onClick={() => handleDeleteIndividual(ind.uid, ind.full_name || 'User', ind.role)}
                           className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                           title="Delete User"
                        >
                           <Trash2 size={16} />
                        </button>
                    </td>
`;

code = code.replace(
  `                    <td className="px-6 py-4 font-semibold text-slate-400">
                      {ind.created_at ? new Date(ind.created_at).toLocaleDateString() : 'N/A'}
                    </td>`,
  actionsCell
);

fs.writeFileSync(file, code);
