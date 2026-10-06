const fs = require('fs');
let code = fs.readFileSync('kortex_users/kortex_admin/SystemConfig.tsx', 'utf8');

// Remove the red button div
code = code.replace(
  /\s*\{\/\* 4\. Migrate FLN Content \*\/\}[\s\S]*?<\/button>\n             <\/div>/,
  ""
);

// Also remove the import for migrateLegacyFLNContent and RefreshCw if possible, but it's harmless.
code = code.replace(/import \{ migrateLegacyFLNContent \} from '\.\.\/\.\.\/app\/actions\/migration';\n/, "");

fs.writeFileSync('kortex_users/kortex_admin/SystemConfig.tsx', code);
console.log("Removed migration button.");
