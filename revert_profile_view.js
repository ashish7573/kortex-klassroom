const fs = require('fs');
let code = fs.readFileSync('kortex_users/org_admin/tabs/ProfileView.tsx', 'utf8');

code = code.replace(
  /import \{ migrateLegacyFLNContent \} from '\.\.\/\.\.\/\.\.\/app\/actions\/migration';\n/,
  ""
);

code = code.replace(
  /      \{\/\* MIGRATION BUTTON \*\/\}[\s\S]*?<\/div>\n      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">/,
  `      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">`
);

fs.writeFileSync('kortex_users/org_admin/tabs/ProfileView.tsx', code);
console.log("Reverted ProfileView.");
