import re

with open('kortex_users/org_admin/tabs/StudentsParentsView.tsx', 'r') as f:
    content = f.read()

def replace_checklist(content, array_name, color):
    # We find blocks of the form:
    # {array_name}.map(subj => {
    #   ...
    #   const isChecked = studentForm.assignedCombos.includes(comboId);
    #   return (
    #     <label key={comboId} className="flex items-center gap-2 cursor-pointer">
    #       <input type="checkbox" checked={isChecked} onChange={(e) => { ... }} className="w-4 h-4 text-COLOR-600 rounded border-slate-300 focus:ring-COLOR-500" />
    #       ...
    #     </label>
    #   );
    # })}
    
    # We will split by `{array_name}.map(subj => {`
    parts = content.split(array_name + ".map(subj => {")
    if len(parts) == 1:
        return content # no match
        
    for i in range(1, len(parts)):
        # we know parts[i] starts with the body of the map function
        end_idx = parts[i].find("})}")
        if end_idx == -1: continue
        
        block = parts[i][:end_idx]
        
        if "const isChecked = studentForm.assignedCombos.includes(comboId);" in block:
            # We want to replace the `return (` and everything inside the label
            return_idx = block.find("return (")
            if return_idx == -1: continue
            
            # The part before return
            prefix = block[:return_idx]
            
            # Add isApproved
            prefix += "const isApproved = profile.approved_grade_subject_combos?.includes(comboStr) || false;\n                               "
            
            # The new return block
            new_return = f"""return (
                                 <label key={{comboId}} className={{`flex items-center gap-2 ${{isApproved ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}}`}}>
                                   <input type="checkbox" checked={{isChecked}} disabled={{!isApproved}} onChange={{(e) => {{
                                     if (e.target.checked) setStudentForm(prev => ({{...prev, assignedCombos: [...prev.assignedCombos, comboId]}}));
                                     else setStudentForm(prev => ({{...prev, assignedCombos: prev.assignedCombos.filter(id => id !== comboId)}}));
                                   }}}} className={{`w-4 h-4 rounded border-slate-300 ${{isApproved ? 'text-{color}-600 focus:ring-{color}-500' : 'text-slate-400 bg-slate-200'}}`}} />
                                   <span className="text-sm font-bold text-slate-700">{{subj}}</span>
                                 </label>
                               );
                             """
            parts[i] = prefix + new_return + parts[i][end_idx:]
            
    return (array_name + ".map(subj => {").join(parts)


content = replace_checklist(content, "(GRADE_CORE_MAP[studentForm.grade] || [])", "indigo")
content = replace_checklist(content, "SUBJECT_CATEGORIES.FOUNDATIONAL", "amber")
content = replace_checklist(content, "SUBJECT_CATEGORIES.CO_CURRICULAR_AND_SKILLS", "emerald")

with open('kortex_users/org_admin/tabs/StudentsParentsView.tsx', 'w') as f:
    f.write(content)
print("Updated successfully")

