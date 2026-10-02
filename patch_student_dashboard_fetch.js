const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add getDoc import
code = code.replace(
  `import { collection, onSnapshot, getDocs, query, orderBy, limit } from 'firebase/firestore';`,
  `import { collection, onSnapshot, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';`
);

// 2. Add state for Org Profiles and Human Readable Combos
code = code.replace(
  `  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);`,
  `  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);\n  const [orgProfiles, setOrgProfiles] = useState<Record<string, any>>({});\n  const [allDisplayCombos, setAllDisplayCombos] = useState<Array<{ id: string, label: string, subject: string, orgName: string }>>([]);`
);

// 3. Add effect to fetch org profiles and build the combo list
const fetchOrgsLogic = `
  useEffect(() => {
    async function loadOrgs() {
      if (!profile.org_ids || profile.org_ids.length === 0) {
        // Just B2C licenses
        const b2c = (profile.active_b2c_licenses || []).map(comboStr => ({
           id: comboStr,
           label: comboStr,
           subject: comboStr.split('-').pop()?.toUpperCase() || 'SUBJECT',
           orgName: 'Independent'
        }));
        setAllDisplayCombos(b2c);
        return;
      }

      const orgData: Record<string, any> = {};
      const displayCombos: Array<{ id: string, label: string, subject: string, orgName: string }> = [];

      for (const orgId of profile.org_ids) {
        try {
          const snap = await getDoc(doc(db, 'users', orgId));
          if (snap.exists()) {
             const data = snap.data();
             orgData[orgId] = data;
             
             const link = profile.org_links?.[orgId];
             if (link && link.status === 'approved') {
                const orgName = data.full_name || 'School';
                const allOrgCombos: string[] = data.approved_grade_subject_combos || [];
                
                // 1. Get Default Core Combos for this student's grade & section
                const grade = link.grade || profile.grade;
                const section = link.section || profile.section;
                const defaultPrefix = \`\${grade} - Section \${section}\`;
                
                const defaultCombos = allOrgCombos.filter(c => c.startsWith(defaultPrefix));
                
                // We need to parse generateComboId locally to map the extra assigned_combos
                const orgAbbrev = (data.kortex_id || '').startsWith("ORG_") ? (data.kortex_id || '').replace("ORG_", "") : (data.kortex_id || '');
                
                const generateId = (comboString: string) => {
                  const parts = comboString.split('-');
                  const rawGrade = parts.length > 0 ? parts[0].trim() : "";
                  const rawSection = parts.length > 1 ? parts[1].trim() : "";
                  const rawSubject = parts.length > 2 ? parts[parts.length - 1].trim() : "SUBJ";
                  
                  let gradePart = "X";
                  const upperGrade = rawGrade.toUpperCase();
                  if (upperGrade.includes('FLN')) gradePart = "FLN";
                  else if (upperGrade.includes('BALVATIKA')) {
                    const match = rawGrade.match(/\\d+/);
                    gradePart = match ? \`BV\${match[0]}\` : "BV";
                  } else {
                    const match = rawGrade.match(/([0-9]+|K|PK|PRE-K)/i);
                    if (match) gradePart = match[1].toUpperCase() === "PRE-K" ? "PK" : match[1].toUpperCase();
                  }

                  const sectionMatch = rawSection.match(/Section\\s+([A-Z0-9]+)/i);
                  const sectionPart = sectionMatch ? sectionMatch[1].toUpperCase() : "X";
                  const subjectPart = rawSubject.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();

                  return \`\${orgAbbrev}_\${gradePart}\${sectionPart}\${subjectPart}\`;
                };

                // Add Defaults
                defaultCombos.forEach(comboStr => {
                   const comboId = generateId(comboStr);
                   displayCombos.push({
                     id: comboId,
                     label: comboStr,
                     subject: comboStr.split('-').pop()?.toUpperCase() || 'SUBJECT',
                     orgName: orgName
                   });
                });

                // 2. Add Extras (Assigned Combos)
                const extraIds = link.assigned_combos || [];
                extraIds.forEach((extId: string) => {
                   // Only add if not already in defaults
                   if (!displayCombos.find(c => c.id === extId)) {
                      // Find human readable string
                      const foundStr = allOrgCombos.find(c => generateId(c) === extId);
                      displayCombos.push({
                         id: extId,
                         label: foundStr || extId,
                         subject: foundStr ? foundStr.split('-').pop()?.toUpperCase() || 'SUBJECT' : 'EXTRA SUBJECT',
                         orgName: orgName
                      });
                   }
                });
             }
          }
        } catch (e) {
          console.error("Error fetching org profile:", e);
        }
      }

      // Add B2C licenses
      (profile.active_b2c_licenses || []).forEach(comboStr => {
          if (!displayCombos.find(c => c.id === comboStr)) {
             displayCombos.push({
               id: comboStr,
               label: comboStr,
               subject: comboStr.split('-').pop()?.toUpperCase() || 'SUBJECT',
               orgName: 'Independent'
             });
          }
      });

      setOrgProfiles(orgData);
      setAllDisplayCombos(displayCombos);
    }
    
    loadOrgs();
  }, [profile]);
`;

code = code.replace(
  `  useEffect(() => {
    if (!profile.uid) return;`,
  fetchOrgsLogic + `\n  useEffect(() => {\n    if (!profile.uid) return;`
);

// 4. Update UI to use allDisplayCombos instead of assignedCombos
code = code.replace(
  `  const assignedCombos = Array.from(new Set([
    ...(profile.active_b2c_licenses || []),
    ...Object.values(profile.org_links || {}).flatMap(link => link.status === 'approved' ? link.assigned_combos : [])
  ]));`,
  ``
);

code = code.replace(
  `  const mockAssignments = assignedCombos.length > 0 ? [`,
  `  const mockAssignments = allDisplayCombos.length > 0 ? [`
);
code = code.replace(
  `assignedCombos[0]?.split('-').pop()?.toUpperCase() || 'MATH'`,
  `allDisplayCombos[0]?.subject || 'MATH'`
);

code = code.replace(
  `      {assignedCombos.length > 0 && (`,
  `      {allDisplayCombos.length > 0 && (`
);

code = code.replace(
  `              {assignedCombos.map((combo) => {
                 const subjectName = combo.split('-').pop()?.toUpperCase() || 'SUBJECT';
                 const colorClasses = getSubjectColor(combo);
                 // Mock progress: pseudo-random based on string length
                 const progressPct = (combo.length * 7) % 100;

                 return (
                   <div 
                     key={combo}
                     onClick={() => handleActionClick(\`lessons:\${combo}\`)} // Route to specific lessons combo`,
  `              {allDisplayCombos.map((comboObj) => {
                 const subjectName = comboObj.subject;
                 const colorClasses = getSubjectColor(comboObj.label.toLowerCase());
                 const progressPct = (comboObj.id.length * 7) % 100;

                 return (
                   <div 
                     key={comboObj.id}
                     onClick={() => handleActionClick(\`lessons:\${comboObj.label}\`)}
`
);

code = code.replace(
  `<h3 className="text-2xl font-black tracking-tight">{subjectName}</h3>`,
  `<div><h3 className="text-2xl font-black tracking-tight">{subjectName}</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{comboObj.label}</p></div>`
);


fs.writeFileSync(file, code);
