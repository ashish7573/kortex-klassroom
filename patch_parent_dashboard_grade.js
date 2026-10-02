const fs = require('fs');
const file = 'kortex_users/parent/ParentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const displayGradeLogic = `
  const getDisplayGrade = (child: StudentProfile) => {
    if (child.org_ids && child.org_ids.length > 0 && child.org_links) {
      // Pick the first approved org link to show grade
      const activeOrgs = Object.values(child.org_links).filter(l => l.status === 'approved');
      if (activeOrgs.length > 0) {
        const link = activeOrgs[0];
        return \`\${link.grade} \${link.section ? '- ' + link.section : ''}\`;
      }
    }
    return child.grade === 'Unassigned' ? 'Independent' : \`\${child.grade} \${child.section ? '- ' + child.section : ''}\`;
  };
`;

code = code.replace(`  const selectedChild = children.find(c => c.uid === selectedChildId) || null;`, `  const selectedChild = children.find(c => c.uid === selectedChildId) || null;\n${displayGradeLogic}`);

code = code.replace(
  `{selectedChild.grade} {selectedChild.section && \`- \${selectedChild.section}\`}`,
  `{getDisplayGrade(selectedChild)}`
);

fs.writeFileSync(file, code);
