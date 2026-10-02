const fs = require('fs');
const file = 'kortex_users/parent/ParentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `                   <h2 className="text-2xl font-black text-slate-800">My Profile</h2>
                   <p className="text-sm font-semibold text-slate-500">Manage your contact details. Changes instantly sync to organizations.</p>`,
  `                   <div className="flex items-center gap-3 mb-1">
                     <h2 className="text-2xl font-black text-slate-800">My Profile</h2>
                     {profile.kortex_id && (
                       <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-black font-mono">
                         {profile.kortex_id}
                       </span>
                     )}
                   </div>
                   <p className="text-sm font-semibold text-slate-500">Manage your contact details. Changes instantly sync to organizations.</p>`
);

fs.writeFileSync(file, code);
