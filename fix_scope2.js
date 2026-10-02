const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// Find the start of assignedCombos logic and end
const startStr = `  const assignedCombos = Array.from(new Set([`;
const endStr = `     return 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:border-purple-300';
  };\n`;

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
    const chunk = code.substring(startIndex, endIndex);
    // Remove it from its current bad location
    code = code.replace(chunk, '');
    
    // Also remove the one I injected before `return (` previously if it exists
    const duplicate = chunk + `\n  return (`;
    if (code.includes(duplicate)) {
        code = code.replace(duplicate, `  return (`);
    }
    
    // Insert it correctly
    code = code.replace(`  return (`, chunk + `\n  return (`);
}

fs.writeFileSync(file, code);
