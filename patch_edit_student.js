const fs = require('fs');
let code = fs.readFileSync('kortex_users/org_admin/tabs/StudentsParentsView.tsx', 'utf8');

const target = `{extraCombos.length > 0 && (
                   <div className="pt-2">
                     <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Extra Combinations</label>
                     <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
                       {extraCombos.map((comboString) => {
                         const comboId = generateComboId(profile.kortex_id || '', comboString);
                         const isSelected = studentForm.assignedCombos.includes(comboId);
                         return (
                           <div 
                             key={comboId} 
                             onClick={() => toggleCombo(comboString)}
                             className={\`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all \${
                               isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-transparent hover:border-slate-300'
                             }\`}
                           >
                             <div className={\`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-colors \${
                               isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                             }\`}>
                               {isSelected && <CheckCircle2 size={14} />}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-bold text-slate-700 text-sm">{comboString}</p>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}`;

const replacement = `<div className="sm:col-span-2 pt-2 border-t border-slate-100">
                       <label className="block text-xs font-bold text-slate-600 mb-4 uppercase">Select Subjects for this Student</label>
                       
                       <div className="space-y-4 mb-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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
                     </div>`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('kortex_users/org_admin/tabs/StudentsParentsView.tsx', code);
    console.log("Patched StudentsParentsView.tsx successfully.");
} else {
    console.log("Could not find the target block in StudentsParentsView.tsx.");
}
