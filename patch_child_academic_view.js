const fs = require('fs');
let code = fs.readFileSync('kortex_users/parent/ChildAcademicView.tsx', 'utf8');

const oldCode = `        const snap = await getDocs(collection(db, 'learning_tools'));
        const totals: Record<string, number> = {};
        snap.docs.forEach(doc => {
          const data = doc.data();
          const grade = (data.grade || 'unknown').trim().toLowerCase();
          const subj = (data.subject || 'unknown').trim().toLowerCase();
          const key = \`\${grade}_\${subj}\`;
          totals[key] = (totals[key] || 0) + 1;
        });`;

const newCode = `        // QUOTA OPTIMIZATION: Read from single aggregation document!
        const docRef = doc(db, 'metadata', 'curriculum_totals');
        const docSnap = await getDoc(docRef);
        const totals = docSnap.exists() ? docSnap.data() : {};`;

if (!code.includes('curriculum_totals')) {
    code = code.replace(oldCode, newCode);
    code = code.replace("import { collection, onSnapshot, getDocs } from 'firebase/firestore';", "import { collection, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';");
    fs.writeFileSync('kortex_users/parent/ChildAcademicView.tsx', code);
}
