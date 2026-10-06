const fs = require('fs');
let code = fs.readFileSync('kortex_users/org_admin/utils/comboParsers.ts', 'utf8');

const regexToReplace = /const subjectPart = rawSubject\.replace\(\/\[\^A-Za-z\]\/g, ''\)\.substring\(0, 3\)\.toUpperCase\(\);/;

const replacement = `let subjectPart = rawSubject.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();

  // Smart overrides to prevent collisions for FLN and multi-word subjects
  const upperRaw = rawSubject.toUpperCase().trim();
  if (upperRaw.startsWith('FLN ')) {
     const parts = upperRaw.split(' ');
     if (parts.length >= 2) {
       // "FLN MATHS" -> "FLN" + "M" -> "FLNM"
       subjectPart = "FLN" + parts[1].replace(/[^A-Z]/g, '').substring(0, 1);
     }
  } else if (upperRaw.startsWith('CO CURRICULAR') || upperRaw.startsWith('CO-CURRICULAR')) {
     subjectPart = 'COC';
  }`;

code = code.replace(regexToReplace, replacement);

fs.writeFileSync('kortex_users/org_admin/utils/comboParsers.ts', code);
console.log("Patched comboParsers.ts");
