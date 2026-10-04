const fs = require('fs');
let code = fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8');

if (!code.includes('where,')) {
    code = code.replace(
        `import { collection, getDocs, query, orderBy } from 'firebase/firestore';`,
        `import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';`
    );
    // If it didn't match the exact string, just add it
    if (code === fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8')) {
        code = code.replace(
            `import { collection, getDocs, query } from 'firebase/firestore';`,
            `import { collection, getDocs, query, where } from 'firebase/firestore';`
        );
    }
}
fs.writeFileSync('kortex_users/student/StudentDashboard.tsx', code);
