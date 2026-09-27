const fs = require('fs');
let content = fs.readFileSync('app/actions/provision.ts', 'utf8');
content = content.replace(
  "): Promise<{ success: boolean; error?: string; kortexId?: string; email?: string; passwordLink?: string }> {",
  ") {"
);
fs.writeFileSync('app/actions/provision.ts', content);
