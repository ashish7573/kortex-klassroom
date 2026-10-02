const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// Strip out the wrongly placed code
const badLogic = `
  const assignedCombos = Array.from(new Set([
    ...(profile.active_b2c_licenses || []),
    ...Object.values(profile.org_links || {}).flatMap(link => link.status === 'approved' ? link.assigned_combos : [])
  ]));

  // Mock Assignments
  const mockAssignments = assignedCombos.length > 0 ? [
    { id: 1, title: 'Fractions & Decimals Quiz', status: 'pending', subject: assignedCombos[0]?.split('-').pop()?.toUpperCase() || 'MATH' },
    { id: 2, title: 'Read: The Magic Tree', status: 'graded', score: 95, subject: 'ENGLISH' },
    { id: 3, title: 'Science Experiment Video', status: 'completed', subject: 'SCIENCE' }
  ] : [];

  const getSubjectColor = (combo: string) => {
     if (combo.includes('math')) return 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100 hover:border-sky-300';
     if (combo.includes('eng')) return 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:border-rose-300';
     if (combo.includes('sci')) return 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300';
     return 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:border-purple-300';
  };
`;

code = code.replace(badLogic, '');

// Put it before `return (`
code = code.replace(
  `  return (`,
  badLogic + `\n  return (`
);

fs.writeFileSync(file, code);
