const fs = require('fs');
let code = fs.readFileSync('kortex_users/UserPortalDispatcher.tsx', 'utf8');

code = code.replace(
  "import TeacherDashboard from './teacher/TeacherDashboard';",
  "import TeacherPortal from './teacher/TeacherPortal';"
);

code = code.replace(
  "return <TeacherDashboard profile={profile} />;",
  "return <TeacherPortal profile={profile} />;"
);

fs.writeFileSync('kortex_users/UserPortalDispatcher.tsx', code);
