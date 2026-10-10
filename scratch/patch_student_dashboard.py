import os

path = 'kortex_users/student/StudentDashboard.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add proStatusText definition
content = content.replace(
    'const isPro = profile.is_pro || (profile.org_ids && profile.org_ids.length > 0) || false;',
    '''const isPro = profile.is_pro || (profile.org_ids && profile.org_ids.length > 0) || false;
  const proStatusText = profile.is_pro ? 'Parent Pro' : (profile.org_ids && profile.org_ids.length > 0 ? 'Organisation Pro' : null);'''
)

# Badge replace
old_badge = """              {(isPro || (profile.org_ids && profile.org_ids.length > 0)) ? (
                <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 rounded-lg text-[10px] font-black uppercase">Unlimited</span>"""
new_badge = """              {proStatusText ? (
                <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 rounded-lg text-[10px] font-black uppercase">{proStatusText}</span>"""
content = content.replace(old_badge, new_badge)

# Text replace
old_text = """              {(isPro || (profile.org_ids && profile.org_ids.length > 0)) ? (
                 <div className="w-full flex items-center justify-center gap-2 py-1 text-yellow-400">
                    <Sparkles size={24} className="animate-pulse" />
                    <span className="font-black tracking-widest">SCHOOL PRO</span>
                 </div>"""
new_text = """              {proStatusText ? (
                 <div className="w-full flex items-center justify-center gap-2 py-1 text-yellow-400">
                    <Sparkles size={24} className="animate-pulse" />
                    <span className="font-black tracking-widest uppercase">{proStatusText}</span>
                 </div>"""
content = content.replace(old_text, new_text)

# Bottom text logic replace
old_bottom = """            {!(isPro || (profile.org_ids && profile.org_ids.length > 0)) && ("""
new_bottom = """            {!proStatusText && ("""
content = content.replace(old_bottom, new_bottom)

with open(path, 'w') as f:
    f.write(content)

