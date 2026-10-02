const fs = require('fs');
const file = 'types/user.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `  has_completed_onboarding?: boolean; // Used for first-login guards
}`,
  `  has_completed_onboarding?: boolean; // Used for first-login guards
  is_pro?: boolean; // Global Pro status
}`
);
fs.writeFileSync(file, code);
