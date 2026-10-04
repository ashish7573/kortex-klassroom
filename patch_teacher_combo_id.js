const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher.ts', 'utf8');

// 1. Import generateComboId
code = code.replace(
  `import { adminAuth, adminDb } from '../backend_configurations/firebase-admin';`,
  `import { adminAuth, adminDb } from '../backend_configurations/firebase-admin';\nimport { generateComboId } from '../kortex_users/org_admin/utils/comboParsers';`
);

// 2. Replace the old mapping logic
const oldLogic = `       for (const comboStr of allOrgCombos) {
           const cleanCombo = comboStr.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
           const generatedId = \`\${kortexId}_\${cleanCombo}\`;
           
           if (assignedIds.includes(generatedId)) {`;

const newLogic = `       for (const comboStr of allOrgCombos) {
           const generatedId = generateComboId(kortexId, comboStr);
           
           if (assignedIds.includes(generatedId)) {`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('app/actions/teacher.ts', code);
