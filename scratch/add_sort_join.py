with open('kortex_users/kortex_admin/UsersManager.tsx', 'r') as f:
    content = f.read()

old_th = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Join Date</th>'
new_th = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("created_at")}>Join Date {sortIndicator("created_at")}</th>'

content = content.replace(old_th, new_th)

with open('kortex_users/kortex_admin/UsersManager.tsx', 'w') as f:
    f.write(content)
