const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace the local isPro with a more comprehensive one for the UI
code = code.replace(
  `const isPro = profile.is_pro || false;`,
  `const isPro = profile.is_pro || (profile.org_ids && profile.org_ids.length > 0) || false;`
);

// We have multiple const isPro declarations, let's fix all of them
code = code.replace(/const isPro = profile\.is_pro \|\| false;/g, 'const isPro = profile.is_pro || (profile.org_ids && profile.org_ids.length > 0) || false;');

fs.writeFileSync(file, code);
