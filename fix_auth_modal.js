const fs = require('fs');

let content = fs.readFileSync('components/auth/UnifiedAuthModal.tsx', 'utf8');

// Add Eye, EyeOff imports
content = content.replace(
  "CheckCircle2,",
  "CheckCircle2,\n  Eye,\n  EyeOff,"
);

// Add state for showPassword
content = content.replace(
  "const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(defaultMode);",
  "const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(defaultMode);\n  const [showPassword, setShowPassword] = useState(false);\n  const [showParentPassword, setShowParentPassword] = useState(false);"
);

// Modify sign-in password field
const oldSignInPassword = `<input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your secure password"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-11 pr-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
                  />`;

const newSignInPassword = `<div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your secure password"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-11 pr-10 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>`;

content = content.replace(oldSignInPassword, newSignInPassword);


// Modify sign-up password fields
const oldParentPassword = `<input
                      type="password"
                      required
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    />`;

const newParentPassword = `<div className="relative">
                    <input
                      type={showParentPassword ? "text" : "password"}
                      required
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 pr-10 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowParentPassword(!showParentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showParentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>`;

content = content.replace(oldParentPassword, newParentPassword);

const oldParentConfirmPassword = `<input
                      type="password"
                      required
                      value={parentConfirmPassword}
                      onChange={(e) => setParentConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    />`;

const newParentConfirmPassword = `<div className="relative">
                    <input
                      type={showParentPassword ? "text" : "password"}
                      required
                      value={parentConfirmPassword}
                      onChange={(e) => setParentConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 pr-10 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    />
                  </div>`;

content = content.replace(oldParentConfirmPassword, newParentConfirmPassword);


fs.writeFileSync('components/auth/UnifiedAuthModal.tsx', content);
console.log('Fixed auth modal');
