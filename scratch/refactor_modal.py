import re

with open('kortex_users/auth/UnifiedAuthModal.tsx', 'r') as f:
    content = f.read()

# 1. Padding fix for close button overlap
content = content.replace(
    'className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative border-4 border-slate-100 p-8 max-h-[92vh] overflow-y-auto"',
    'className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative border-4 border-slate-100 p-8 pt-12 max-h-[92vh] overflow-y-auto"'
)
content = content.replace(
    'className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"',
    'className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors z-10"'
)

# 2. Add eye icon to Confirm Password and fix mobile grid
grid_old = '<div className="grid grid-cols-2 gap-3 mt-3">'
grid_new = '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">'
content = content.replace(grid_old, grid_new)

confirm_old = """                    <input
                      type={showParentPassword ? "text" : "password"}
                      required
                      value={parentConfirmPassword}
                      onChange={(e) => setParentConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 pr-10 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    />"""
confirm_new = """                    <input
                      type={showParentPassword ? "text" : "password"}
                      required
                      value={parentConfirmPassword}
                      onChange={(e) => setParentConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 pr-10 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowParentPassword(!showParentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showParentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>"""
content = content.replace(confirm_old, confirm_new)

# 3. Unify Institution Callout
# Remove it from TAB 1
tab1_callout = """              {/* Institution Callout */}
              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-semibold mb-2">School, Coaching Center, or Educator?</p>
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  <Building2 size={14} /> Request Institutional Proposal & Account <ArrowRight size={12} />
                </button>
              </div>"""
content = content.replace(tab1_callout, "")

# Remove it from TAB 2
tab2_callout = """              <div className="mt-4 text-center">
                <p className="text-xs text-slate-400 font-semibold">
                  Teacher or School?{' '}
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(true)}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Request Institutional Access
                  </button>
                </p>
              </div>"""
content = content.replace(tab2_callout, "")

# Add Unified Callout at the bottom of the modal content (after mode tabs)
unified_callout = """
          {/* Unified Institution Callout */}
          {mode !== 'forgot' && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-semibold mb-2">School, Coaching Center, or Educator?</p>
              <button
                type="button"
                onClick={() => setShowQuoteModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
              >
                <Building2 size={14} /> Request Institutional Access <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>"""

content = content.replace("        </div>\n      </div>", unified_callout)

with open('kortex_users/auth/UnifiedAuthModal.tsx', 'w') as f:
    f.write(content)
