const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.overrides = pkg.overrides || {};
pkg.overrides["jwks-rsa"] = "3.1.0";

pkg.resolutions = pkg.resolutions || {};
pkg.resolutions["jwks-rsa"] = "3.1.0";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log("package.json patched with jwks-rsa override and resolutions.");
