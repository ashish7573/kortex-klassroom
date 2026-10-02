const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldLogic = `        if (currentView.includes(':')) {
             const combo = currentView.split(':')[1];
             const match = combo.match(/grade-(\\d+)-(.*)/i);
             if (match) {
                 defaultClass = \`Grade \${match[1]}\`;
                 defaultSubject = match[2];
             }
        }`;

const newLogic = `        if (currentView.includes(':')) {
             const combo = currentView.split(':')[1];
             if (combo.includes(' - ')) {
                 const parts = combo.split(' - ');
                 defaultClass = parts[0].trim();
                 defaultSubject = parts[parts.length - 1].trim();
             } else {
                 const match = combo.match(/grade-(\\d+)-(.*)/i);
                 if (match) {
                     defaultClass = \`Grade \${match[1]}\`;
                     defaultSubject = match[2];
                 }
             }
        }`;

code = code.replace(oldLogic, newLogic);

fs.writeFileSync(file, code);
