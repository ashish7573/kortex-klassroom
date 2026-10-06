import re
import sys

with open('kortex_users/org_admin/tabs/StudentsParentsView.tsx', 'r') as f:
    content = f.read()

# Pattern for Core
core_pattern = r"""(\(GRADE_CORE_MAP\[studentForm\.grade\] \|\| \[\]\)\.map\(subj => \{\s*const comboStr = `\$\{studentForm\.grade\} - Section \$\{studentForm\.section\} - \$\{subj\}`;.*?)(\s*return \(\s*<label key=\{comboId\} className="flex items-center gap-2 cursor-pointer">\s*<input type="checkbox" checked=\{isChecked\} onChange=\{\(e\) => \{.*?\)\} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" \/>\s*<span className="text-sm font-bold text-slate-700">\{subj\}<\/span>\s*<\/label>\s*\);\s*\n\s*\}\)\})"""

def core_repl(m):
    prefix = m.group(1)
    # Add isApproved declaration before return
    prefix = prefix.replace("return (", "const isApproved = profile.approved_grade_subject_combos?.includes(comboStr) || false;\n                               return (")
    
    replacement = """
                                 <label key={comboId} className={`flex items-center gap-2 ${isApproved ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                   <input type="checkbox" checked={isChecked} disabled={!isApproved} onChange={(e) => {
                                     if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                     else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                                   }} className={`w-4 h-4 rounded border-slate-300 ${isApproved ? 'text-indigo-600 focus:ring-indigo-500' : 'text-slate-400 bg-slate-200'}`} />
                                   <span className="text-sm font-bold text-slate-700">{subj}</span>
                                 </label>
                               );
                             })}"""
    return prefix + replacement.strip()

# Similar patterns for Foundational and Co-Curricular
foundational_pattern = r"""(SUBJECT_CATEGORIES\.FOUNDATIONAL\.map\(subj => \{\s*const comboStr = `\$\{studentForm\.grade\} - Section \$\{studentForm\.section\} - \$\{subj\}`;.*?)(\s*return \(\s*<label key=\{comboId\} className="flex items-center gap-2 cursor-pointer">\s*<input type="checkbox" checked=\{isChecked\} onChange=\{\(e\) => \{.*?\)\} className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500" \/>\s*<span className="text-sm font-bold text-slate-700">\{subj\}<\/span>\s*<\/label>\s*\);\s*\n\s*\}\)\})"""

def foundational_repl(m):
    prefix = m.group(1)
    prefix = prefix.replace("return (", "const isApproved = profile.approved_grade_subject_combos?.includes(comboStr) || false;\n                               return (")
    
    replacement = """
                                 <label key={comboId} className={`flex items-center gap-2 ${isApproved ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                   <input type="checkbox" checked={isChecked} disabled={!isApproved} onChange={(e) => {
                                     if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                     else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                                   }} className={`w-4 h-4 rounded border-slate-300 ${isApproved ? 'text-amber-600 focus:ring-amber-500' : 'text-slate-400 bg-slate-200'}`} />
                                   <span className="text-sm font-bold text-slate-700">{subj}</span>
                                 </label>
                               );
                             })}"""
    return prefix + replacement.strip()


cocurricular_pattern = r"""(SUBJECT_CATEGORIES\.CO_CURRICULAR_AND_SKILLS\.map\(subj => \{\s*const comboStr = `\$\{studentForm\.grade\} - Section \$\{studentForm\.section\} - \$\{subj\}`;.*?)(\s*return \(\s*<label key=\{comboId\} className="flex items-center gap-2 cursor-pointer">\s*<input type="checkbox" checked=\{isChecked\} onChange=\{\(e\) => \{.*?\)\} className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500" \/>\s*<span className="text-sm font-bold text-slate-700">\{subj\}<\/span>\s*<\/label>\s*\);\s*\n\s*\}\)\})"""

def cocurricular_repl(m):
    prefix = m.group(1)
    prefix = prefix.replace("return (", "const isApproved = profile.approved_grade_subject_combos?.includes(comboStr) || false;\n                               return (")
    
    replacement = """
                                 <label key={comboId} className={`flex items-center gap-2 ${isApproved ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                   <input type="checkbox" checked={isChecked} disabled={!isApproved} onChange={(e) => {
                                     if (e.target.checked) setStudentForm(prev => ({...prev, assignedCombos: [...prev.assignedCombos, comboId]}));
                                     else setStudentForm(prev => ({...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}));
                                   }} className={`w-4 h-4 rounded border-slate-300 ${isApproved ? 'text-emerald-600 focus:ring-emerald-500' : 'text-slate-400 bg-slate-200'}`} />
                                   <span className="text-sm font-bold text-slate-700">{subj}</span>
                                 </label>
                               );
                             })}"""
    return prefix + replacement.strip()

content = re.sub(core_pattern, core_repl, content, flags=re.DOTALL)
content = re.sub(foundational_pattern, foundational_repl, content, flags=re.DOTALL)
content = re.sub(cocurricular_pattern, cocurricular_repl, content, flags=re.DOTALL)

with open('kortex_users/org_admin/tabs/StudentsParentsView.tsx', 'w') as f:
    f.write(content)
print("Updated successfully")

