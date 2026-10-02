const fs = require('fs');
const file = 'kortex_users/parent/ParentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// Revert the bad sed
code = code.replace(/RefreshCw, User/g, 'RefreshCw');

// Add User to the import
code = code.replace(
  `AlertCircle, UserPlus, RefreshCw`,
  `AlertCircle, UserPlus, RefreshCw, User`
);

fs.writeFileSync(file, code);
