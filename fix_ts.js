const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `            if (authProfile.org_ids && authProfile.org_ids.length > 0) {`,
  `            if ((authProfile as any).org_ids && (authProfile as any).org_ids.length > 0) {`
);

code = code.replace(
  `            if (!isOwned && authProfile.active_b2c_licenses) {`,
  `            if (!isOwned && (authProfile as any).active_b2c_licenses) {`
);

code = code.replace(
  `                isOwned = authProfile.active_b2c_licenses.some((c: string) => c.toLowerCase().includes(matchStr));`,
  `                isOwned = (authProfile as any).active_b2c_licenses.some((c: string) => c.toLowerCase().includes(matchStr));`
);

fs.writeFileSync(file, code);
