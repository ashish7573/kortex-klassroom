const fs = require('fs');
let code = fs.readFileSync('kortex_users/auth/UnifiedAuthModal.tsx', 'utf8');

code = code.replace(
  /<input\n\s*type="password"\n\s*required\n\s*value=\{loginPassword\}\n\s*onChange=\{\(e\) => setLoginPassword\(e\.target\.value\)\}\n\s*placeholder="Enter password or child PIN"\n\s*className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"\n\s*\/>/,
  `<div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password or child PIN"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 pr-12 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  </div>`
);

fs.writeFileSync('kortex_users/auth/UnifiedAuthModal.tsx', code);
console.log("Patched login password field.");
