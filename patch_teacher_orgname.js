const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher.ts', 'utf8');

const oldRet = `    return {
       success: true,
       combos
    };`;

const newRet = `    return {
       success: true,
       combos,
       orgName: orgsToFetch.length > 0 ? orgDataMap[orgsToFetch[0]]?.organization_name || 'Your Organization' : 'Your Organization'
    };`;

code = code.replace(oldRet, newRet);
fs.writeFileSync('app/actions/teacher.ts', code);
