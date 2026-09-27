const fs = require('fs');

let content = fs.readFileSync('app/actions/provision.ts', 'utf8');

const targetReturn = `    return { 
      success: true, 
      kortexId: cleanKortexId, 
      email: cleanEmail 
    };`;

const newReturn = `    return { 
      success: true, 
      kortexId: cleanKortexId, 
      email: cleanEmail,
      passwordLink: link
    };`;

content = content.replace(targetReturn, newReturn);
fs.writeFileSync('app/actions/provision.ts', content);
console.log('Fixed return statement');
