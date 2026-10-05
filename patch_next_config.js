const fs = require('fs');
let configStr = fs.readFileSync('next.config.ts', 'utf8');

configStr = configStr.replace(
  "serverExternalPackages: ['firebase-admin', 'jwks-rsa', 'jose'],",
  "serverExternalPackages: ['firebase-admin', 'jwks-rsa', 'jose'],\n  experimental: {\n    serverComponentsExternalPackages: ['firebase-admin', 'jwks-rsa', 'jose'],\n  },"
);
fs.writeFileSync('next.config.ts', configStr);
