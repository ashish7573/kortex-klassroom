const fs = require('fs');
let code = fs.readFileSync('kortex_users/kortex_admin/SystemConfig.tsx', 'utf8');

code = code.replace(
  /alert\("Starting migration\.\.\."\);/,
  "setIsLoading(true);"
);

code = code.replace(
  /const res = await migrateLegacyFLNContent\(\);\n\s*if\(res\.success\) alert\(res\.message\);\n\s*else alert\("Error: " \+ res\.error\);/,
  `const res = await migrateLegacyFLNContent();\n                       setIsLoading(false);\n                       if(res.success) alert(res.message);\n                       else alert("Error: " + res.error);`
);

fs.writeFileSync('kortex_users/kortex_admin/SystemConfig.tsx', code);
console.log("Fixed SystemConfig alert.");
