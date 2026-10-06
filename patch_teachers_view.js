const fs = require('fs');
let code = fs.readFileSync('kortex_users/org_admin/tabs/TeachersView.tsx', 'utf8');

// Add import for generateTeacherPasswordLink
code = code.replace(
  /provisionTeacherAccount, updateTeacherAccount, deleteTeacherAccount/,
  `provisionTeacherAccount, updateTeacherAccount, deleteTeacherAccount, generateTeacherPasswordLink`
);

// Add import for KeyRound or Mail icon
code = code.replace(
  /import \{ GraduationCap, UserPlus, Copy, CheckCircle2, X, Pencil, Trash2, AlertTriangle \} from 'lucide-react';/,
  `import { GraduationCap, UserPlus, Copy, CheckCircle2, X, Pencil, Trash2, AlertTriangle, KeyRound } from 'lucide-react';`
);

// Add handleResendWelcome function
const resendCode = `
  const handleResendWelcome = async (teacher: TeacherProfile) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await generateTeacherPasswordLink(token, teacher.email);
      if (res.success) {
        const emailTemplate = \`Subject: Welcome to Kortex Klassroom - Your Teacher Account\\n\\nHi \${teacher.full_name},\\n\\nWelcome to Kortex Klassroom! Your teacher account for \${profile.organization_name} is ready.\\n\\nHere are your official login details:\\nTeacher ID: \${teacher.kortex_id}\\nLogin Email: \${teacher.email}\\n\\nPlease click the secure link below to set your permanent password and access your dashboard:\\n\${res.link}\\n\\nBest regards,\\n\${profile.full_name}\\n\${profile.organization_name}\`;
        await navigator.clipboard.writeText(emailTemplate);
        alert('Welcome message and password link copied to clipboard!');
      } else {
        alert('Error generating link: ' + res.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };
`;

code = code.replace(
  /const handleCopyCredentials = \(\) => \{/,
  resendCode + '\n  const handleCopyCredentials = () => {'
);

// Add button to the teacher row
code = code.replace(
  /<button onClick=\{\(\) => openEditModal\(t\)\} className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors" title="Edit Teacher">/,
  `<button onClick={() => handleResendWelcome(t)} className="p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors" title="Copy Welcome & Password Link">
                          <KeyRound size={16} />
                        </button>
                        <button onClick={() => openEditModal(t)} className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors" title="Edit Teacher">`
);

fs.writeFileSync('kortex_users/org_admin/tabs/TeachersView.tsx', code);
console.log("Patched TeachersView.tsx");
