import re

with open('kortex_users/kortex_admin/UsersManager.tsx', 'r') as f:
    content = f.read()

# Headers
org_headers_old = """                {activeTab === 'organizations' ? (
                  <>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("organization_name")}>Kortex ID / Org Name {sortIndicator("organization_name")}</th>"""
org_headers_new = """                {activeTab === 'organizations' ? (
                  <>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider w-16 text-center">S.No.</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("organization_name")}>Kortex ID / Org Name {sortIndicator("organization_name")}</th>"""
content = content.replace(org_headers_old, org_headers_new)

ind_headers_old = """                ) : (
                  <>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("full_name")}>Kortex ID / Name {sortIndicator("full_name")}</th>"""
ind_headers_new = """                ) : (
                  <>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider w-16 text-center">S.No.</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("full_name")}>Kortex ID / Name {sortIndicator("full_name")}</th>"""
content = content.replace(ind_headers_old, ind_headers_new)

# Table body (empty state)
content = content.replace('colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">Loading records...', 'colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold">Loading records...')
content = content.replace('colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">No organizations found.', 'colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold">No organizations found.')
# Individuals empty state
# Wait, let me check the colSpan for individuals empty state
content = content.replace('colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">No individuals found.', 'colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">No individuals found.')
content = content.replace('colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">No individuals found.', 'colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">No individuals found.') # Just in case it was 5

# Org mapping
org_map_old = "processedOrgs.length > 0 ? processedOrgs.map(org => {"
org_map_new = "processedOrgs.length > 0 ? processedOrgs.map((org, index) => {"
content = content.replace(org_map_old, org_map_new)

org_row_old = """                  return (
                    <tr key={org.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">"""
org_row_new = """                  return (
                    <tr key={org.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">{index + 1}</td>
                      <td className="px-6 py-4">"""
content = content.replace(org_row_old, org_row_new)


# Ind mapping
ind_map_old = "processedIndividuals.length > 0 ? processedIndividuals.map(ind => ("
ind_map_new = "processedIndividuals.length > 0 ? processedIndividuals.map((ind, index) => ("
content = content.replace(ind_map_old, ind_map_new)

ind_row_old = """                  <tr key={ind.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">"""
ind_row_new = """                  <tr key={ind.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">{index + 1}</td>
                    <td className="px-6 py-4">"""
content = content.replace(ind_row_old, ind_row_new)

with open('kortex_users/kortex_admin/UsersManager.tsx', 'w') as f:
    f.write(content)
