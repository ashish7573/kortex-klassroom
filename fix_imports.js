const fs = require('fs');
let code = fs.readFileSync('kortex_users/kortex_admin/SystemConfig.tsx', 'utf8');

code = code.replace(
  /import \{ DownloadCloud, UploadCloud \} from 'lucide-react';/,
  `import { DownloadCloud, UploadCloud, CheckCircle2, RefreshCw } from 'lucide-react';\nimport { migrateLegacyFLNContent } from '../../app/actions/migration';`
);

fs.writeFileSync('kortex_users/kortex_admin/SystemConfig.tsx', code);
console.log("Imports fixed.");
