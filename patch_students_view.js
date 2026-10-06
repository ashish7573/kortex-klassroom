const fs = require('fs');
let code = fs.readFileSync('kortex_users/org_admin/tabs/StudentsParentsView.tsx', 'utf8');

// We need to import SUBJECT_CATEGORIES and GRADE_CORE_MAP
code = code.replace(
  /GRADES, SECTIONS/,
  `GRADES, SECTIONS, SUBJECT_CATEGORIES, GRADE_CORE_MAP`
);

// Add the useEffect for Bulk Import pre-checking
const useEffectCode = `
  // Pre-check Core Subjects for Bulk Import when Grade changes
  useEffect(() => {
    if (addMode === 'bulk') {
      const coreSubjects = GRADE_CORE_MAP[studentForm.grade] || [];
      const coreComboIds = coreSubjects.map(subj => 
        generateComboId(profile.kortex_id || '', \`\${studentForm.grade} - Section \${studentForm.section} - \${subj}\`)
      );
      setStudentForm(prev => ({ ...prev, assignedCombos: coreComboIds }));
    }
  }, [studentForm.grade, studentForm.section, addMode, profile.kortex_id]);
`;

code = code.replace(
  /const \[viewingSubjectsStudent, setViewingSubjectsStudent\] = useState<StudentProfile \| null>\(null\);/,
  `const [viewingSubjectsStudent, setViewingSubjectsStudent] = useState<StudentProfile | null>(null);\n` + useEffectCode
);

// Now, update the UI for Bulk Mode
const bulkUI = `
                   {addMode === 'bulk' && (
                     <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                       <label className="block text-xs font-bold text-slate-600 mb-4 uppercase">Select Subjects for this Batch</label>
                       
                       <div className="space-y-4 mb-6">
                         {/* Category 1: Core */}
                         <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                           <h4 className="text-xs font-bold text-indigo-700 uppercase mb-3 border-b border-indigo-100 pb-2">Core Academics</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {(GRADE_CORE_MAP[studentForm.grade] || []).map(subj => {
                               const comboStr = \`\${studentForm.grade} - Section \${studentForm.section} - \${subj}\`;
                               const comboId = generateComboId(profile.kortex_id || '', comboStr);
                               const isChecked = studentForm.assignedCombos.includes(comboId);
                               return (
                                 <label key={comboId} className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" checked={isChecked} onChange={(e) => {
                                     if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                     else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                                   }} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                   <span className="text-sm font-bold text-slate-700">{subj}</span>
                                 </label>
                               );
                             })}
                           </div>
                         </div>

                         {/* Category 2: Foundational */}
                         <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                           <h4 className="text-xs font-bold text-amber-700 uppercase mb-3 border-b border-amber-200 pb-2">Foundational (FLN)</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {SUBJECT_CATEGORIES.FOUNDATIONAL.map(subj => {
                               const comboStr = \`\${studentForm.grade} - Section \${studentForm.section} - \${subj}\`;
                               const comboId = generateComboId(profile.kortex_id || '', comboStr);
                               const isChecked = studentForm.assignedCombos.includes(comboId);
                               return (
                                 <label key={comboId} className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" checked={isChecked} onChange={(e) => {
                                     if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                     else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                                   }} className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500" />
                                   <span className="text-sm font-bold text-slate-700">{subj}</span>
                                 </label>
                               );
                             })}
                           </div>
                         </div>

                         {/* Category 3: Co-Curricular */}
                         <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                           <h4 className="text-xs font-bold text-emerald-700 uppercase mb-3 border-b border-emerald-200 pb-2">Co-Curricular & Skills</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {SUBJECT_CATEGORIES.CO_CURRICULAR_AND_SKILLS.map(subj => {
                               const comboStr = \`\${studentForm.grade} - Section \${studentForm.section} - \${subj}\`;
                               const comboId = generateComboId(profile.kortex_id || '', comboStr);
                               const isChecked = studentForm.assignedCombos.includes(comboId);
                               return (
                                 <label key={comboId} className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" checked={isChecked} onChange={(e) => {
                                     if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                     else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                                   }} className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500" />
                                   <span className="text-sm font-bold text-slate-700">{subj}</span>
                                 </label>
                               );
                             })}
                           </div>
                         </div>
                       </div>

                       <div className="flex items-center justify-between mb-2">
                         <label className="block text-xs font-bold text-slate-600 uppercase">Upload CSV File</label>
                         <button type="button" onClick={downloadSampleCsv} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                           <Download size={12} /> Download Sample CSV
                         </button>
                       </div>
                       <input 
                         required
                         type="file" 
                         accept=".csv"
                         onChange={e => setCsvFile(e.target.files?.[0] || null)} 
                         className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl px-4 py-6 font-bold text-slate-600 outline-none focus:border-indigo-500 cursor-pointer text-center" 
                       />
                     </div>
                   )}
`;

code = code.replace(
  /\{addMode === 'bulk' && \(\n                     <div className="sm:col-span-2 pt-2 border-t border-slate-100">\n                       <div className="flex items-center justify-between mb-2">[\s\S]*?<\/div>\n                   \)\}/,
  bulkUI
);

fs.writeFileSync('kortex_users/org_admin/tabs/StudentsParentsView.tsx', code);
console.log("StudentsParentsView patched for 3-tier UI");
