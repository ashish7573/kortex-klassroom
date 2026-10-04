const fs = require('fs');
let code = fs.readFileSync('kortex_users/UserPortalDispatcher.tsx', 'utf8');

code = code.replace(
  `return <TeacherPortal profile={profile} />;`,
  `return <TeacherPortal profile={profile} onExploreTier={onExploreTier} />;`
);

fs.writeFileSync('kortex_users/UserPortalDispatcher.tsx', code);
