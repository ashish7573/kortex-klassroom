const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `import { consumeHeart } from '../app/actions/student';`,
  `import { consumeHeart, logStudentActivity } from '../app/actions/student';`
);

fs.writeFileSync(file, code);
