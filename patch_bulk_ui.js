const fs = require('fs');
let code = fs.readFileSync('kortex_users/org_admin/tabs/StudentsParentsView.tsx', 'utf8');

const bulkStateCode = `
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const downloadSampleCsv = () => {
    const csvContent = "Student Name,Parent Email,Parent Phone\\nJohn Doe,john@example.com,+1234567890\\nJane Smith,jane@example.com,";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Student_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;

if (!code.includes('const [csvFile')) {
  code = code.replace(
    /const \[isSubmitting, setIsSubmitting\] = useState\(false\);/,
    "const [isSubmitting, setIsSubmitting] = useState(false);\n" + bulkStateCode
  );
}

const handleBulkSubmit = `
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      alert("Please select a CSV file.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const text = await csvFile.text();
      const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
      
      if (lines.length < 2) {
        throw new Error("CSV file must contain a header row and at least one student row.");
      }
      
      const students = lines.slice(1).map(line => {
        const parts = line.split(',');
        return {
          fullName: (parts[0] || '').trim(),
          parentEmail: (parts[1] || '').trim(),
          parentPhone: (parts[2] || '').trim(),
        };
      }).filter(s => s.fullName.length > 0);
      
      if (students.length === 0) {
         throw new Error("No valid student records found in CSV.");
      }

      if (students.length > 40) {
         throw new Error(\`CSV contains \${students.length} students. A single upload cannot exceed 40 students.\`);
      }

      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);

      const result = await bulkProvisionStudents(
        idToken,
        studentForm.grade,
        studentForm.section,
        studentForm.assignedCombos,
        students
      );
      
      if (!result.success) throw new Error(result.error);
      
      alert(result.message);
      setShowAddModal(false);
      setCsvFile(null);
      resetForm();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
`;

if (!code.includes('const handleBulkSubmit')) {
  code = code.replace(
    /const handleGenerateOrImport = async \(e: React\.FormEvent\) => \{/,
    handleBulkSubmit + "\n  const handleGenerateOrImport = async (e: React.FormEvent) => {"
  );
}

const renderFormStart = `
               <form id="studentForm" onSubmit={addMode === 'bulk' ? handleBulkSubmit : handleGenerateOrImport} className="space-y-6">
                 
                 <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                    <Link size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-indigo-800 leading-relaxed">
                      {addMode === 'new' 
                        ? 'This ID will be used by the parent to link their child\\'s account to your school. Standard subjects for the selected Grade & Section are automatically mapped.'
                        : addMode === 'import' 
                        ? 'Enter the student\\'s existing Kortex ID. This will send a transfer request to the parent. Once approved, they will be linked to your school.'
                        : 'Select the exact Grade, Section, and extra combinations for this batch. Then upload a CSV with Student Name, Parent Email, and Parent Phone. Limit 40 students.'
                      }
                    </p>
                 </div>
`;

code = code.replace(
  /<form id="studentForm" onSubmit=\{handleGenerateOrImport\} className="space-y-6">[\s\S]*?<\/p>\n                 <\/div>/,
  renderFormStart
);

const bulkFileInput = `
                   {addMode === 'bulk' && (
                     <div className="sm:col-span-2 pt-2 border-t border-slate-100">
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
  /\{addMode === 'new' && \(\n                     <div className="sm:col-span-2">\n                       <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Emergency Contact Number<\/label>[\s\S]*?<\/div>\n                   \)\}/,
  `{addMode === 'new' && (
                     <div className="sm:col-span-2">
                       <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Emergency Contact Number</label>
                       <input type="text" value={studentForm.emergencyContact} onChange={e => setStudentForm({...studentForm, emergencyContact: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500" placeholder="e.g. +91 98765 43210 (Optional)" />
                     </div>
                   )}
` + bulkFileInput
);

const renderSubmitBtn = `
                 {isSubmitting ? 'Processing...' : (addMode === 'new' ? 'Generate ID' : addMode === 'import' ? 'Send Transfer Request' : 'Upload & Provision')}
`;

code = code.replace(
  /\{isSubmitting \? 'Processing\.\.\.' : \(addMode === 'new' \? 'Generate ID' : 'Send Transfer Request'\)\}/,
  renderSubmitBtn
);

const renderNameInput = `
                   {addMode !== 'bulk' && (
                     <div className="sm:col-span-2">
                       <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">
                         {addMode === 'new' ? 'Student Full Name' : 'Existing Student ID'}
                       </label>
                       <input 
                         required 
                         type="text" 
                         value={studentForm.nameOrId} 
                         onChange={e => setStudentForm({...studentForm, nameOrId: e.target.value})} 
                         className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500 uppercase" 
                         placeholder={addMode === 'new' ? 'e.g. Aarav Sharma' : 'e.g. STU_XYZ_999'} 
                       />
                     </div>
                   )}
`;

code = code.replace(
  /<div className="sm:col-span-2">\n                     <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">\n                       \{addMode === 'new' \? 'Student Full Name' : 'Existing Student ID'\}\n                     <\/label>\n                     <input \n                       required \n                       type="text" \n                       value=\{studentForm.nameOrId\} [\s\S]*? \/>\n                   <\/div>/,
  renderNameInput
);

fs.writeFileSync('kortex_users/org_admin/tabs/StudentsParentsView.tsx', code);
console.log("UI Patched.");
