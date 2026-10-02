const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// I will just replace `  return () => unsubscribe();\n  }, [profile.uid]);` with that string but at the beginning of the block.

const toFind = `  const assignedCombos = Array.from(new Set([`;
const toReplace = `  return () => unsubscribe();\n  }, [profile.uid]);\n\n  const assignedCombos = Array.from(new Set([`;

code = code.replace(toFind, toReplace);

const toRemove = `\n  return () => unsubscribe();\n  }, [profile.uid]);`;

// Since it now exists twice (once where I inserted it, once at the original end), I'll replace the LAST occurrence with empty string.
const lastIndex = code.lastIndexOf(toRemove);
if (lastIndex !== -1) {
    code = code.substring(0, lastIndex) + code.substring(lastIndex + toRemove.length);
}

fs.writeFileSync(file, code);
