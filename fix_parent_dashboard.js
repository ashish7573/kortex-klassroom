const fs = require('fs');
const file = 'kortex_users/parent/ParentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `              <ChildAcademicView child={selectedChild} />\n\n            </div>\n          )}\n        </>\n      )}`,
  `              <ChildAcademicView child={selectedChild} />\n\n            </div>\n          ) : null}\n        </>\n      )}`
);

fs.writeFileSync(file, code);
