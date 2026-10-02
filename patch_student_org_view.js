const fs = require('fs');
const file = 'kortex_users/org_admin/tabs/StudentsParentsView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix getStudentDefaultCombos
const oldFunc = `  const getStudentDefaultCombos = (student: StudentProfile) => {
    const defaultPrefix = \`\${student.grade} - Section \${student.section}\`;
    return (profile.approved_grade_subject_combos || []).filter(c => c.startsWith(defaultPrefix));
  };`;

const newFunc = `  const getStudentDefaultCombos = (student: StudentProfile) => {
    const grade = student.org_links?.[profile.uid]?.grade || student.grade;
    const section = student.org_links?.[profile.uid]?.section || student.section;
    const defaultPrefix = \`\${grade} - Section \${section}\`;
    return (profile.approved_grade_subject_combos || []).filter(c => c.startsWith(defaultPrefix));
  };`;

code = code.replace(oldFunc, newFunc);

// 2. Fix Display Grade in the Table cell
const oldCell = `                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{student.full_name}</div>
                    <div className="font-semibold text-slate-400 text-xs">
                      {student.grade} {student.section && \`- Sec \${student.section}\`}
                    </div>
                  </td>`;

const newCell = `                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{student.full_name}</div>
                    <div className="font-semibold text-slate-400 text-xs">
                      {student.org_links?.[profile.uid]?.grade || student.grade} {(student.org_links?.[profile.uid]?.section || student.section) && \`- Sec \${student.org_links?.[profile.uid]?.section || student.section}\`}
                    </div>
                  </td>`;

code = code.replace(oldCell, newCell);

fs.writeFileSync(file, code);
