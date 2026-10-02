const fs = require('fs');
const file = 'kortex_users/parent/AddChildModal.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace state
code = code.replace(
  `  const [childName, setChildName] = useState('');\n  const [grade, setGrade] = useState('Grade 1');`,
  `  const [childName, setChildName] = useState('');\n  // Removed grade state per request`
);

// Replace provisionChildAccount call
code = code.replace(
  `        result = await provisionChildAccount(idToken, {
          fullName: childName.trim(),
          grade: grade,
          pin: pin
        });`,
  `        result = await provisionChildAccount(idToken, {
          fullName: childName.trim(),
          grade: 'Unassigned',
          pin: pin
        });`
);

// Remove Grade UI
const gradeUI = `                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Grade</label>
                    <select 
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                    >
                      {GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>`;
                  
code = code.replace(gradeUI, ``);

fs.writeFileSync(file, code);
