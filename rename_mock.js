const fs = require('fs');
const file = 'kortex_users/parent/ChildAcademicView.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/mockPerformance/g, 'realPerformance');
code = code.replace(/independentSubjectsMock/g, 'b2cSubjects');

fs.writeFileSync(file, code);
