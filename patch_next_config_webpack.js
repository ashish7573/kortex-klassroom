const fs = require('fs');
let configStr = fs.readFileSync('next.config.ts', 'utf8');

if (!configStr.includes('webpack:')) {
    configStr = configStr.replace(
        '  async headers() {',
        `  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('firebase-admin', 'jwks-rsa', 'jose');
    }
    return config;
  },
  async headers() {`
    );
    fs.writeFileSync('next.config.ts', configStr);
    console.log("Webpack externals added.");
}
