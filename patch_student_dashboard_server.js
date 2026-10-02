const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Import the Server Action
code = code.replace(
  `import { collection, onSnapshot, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';`,
  `import { collection, onSnapshot, getDocs, query, orderBy, limit } from 'firebase/firestore';\nimport { getStudentOrgProfiles } from '../../app/actions/student';`
);

// 2. Replace the client-side fetch loop with the Server Action
const oldFetch = `      const orgData: Record<string, any> = {};
      const displayCombos: Array<{ id: string, label: string, subject: string, orgName: string }> = [];

      for (const orgId of profile.org_ids) {
        try {
          const snap = await getDoc(doc(db, 'users', orgId));
          if (snap.exists()) {
             const data = snap.data();
             orgData[orgId] = data;
             
             const link = profile.org_links?.[orgId];`;

const newFetch = `      let orgData: Record<string, any> = {};
      const displayCombos: Array<{ id: string, label: string, subject: string, orgName: string }> = [];

      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const result = await getStudentOrgProfiles(token, profile.org_ids);
        if (result.success && result.orgProfiles) {
           orgData = result.orgProfiles;
        }
      } catch (e) {
        console.error("Failed to fetch org profiles", e);
      }

      for (const orgId of profile.org_ids) {
        try {
          const data = orgData[orgId];
          if (data) {
             const link = profile.org_links?.[orgId];`;

code = code.replace(oldFetch, newFetch);

fs.writeFileSync(file, code);
