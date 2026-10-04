const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(
    "setUserName(authProfile.full_name || '');",
    "setUserName((authProfile as any)?.organization_name || authProfile.full_name || '');"
);

code = code.replace(
    "setUserName(data.full_name || '');",
    "setUserName(data.organization_name || data.full_name || '');"
);

fs.writeFileSync('app/page.tsx', code);
