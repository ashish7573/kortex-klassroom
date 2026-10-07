import re
import sys

with open('kortex_users/kortex_admin/UsersManager.tsx', 'r') as f:
    content = f.read()

# 1. Update Lucide Imports
content = content.replace("ExternalLink \n} from 'lucide-react';", "ExternalLink, Download, ArrowUpDown, ChevronUp, ChevronDown \n} from 'lucide-react';")

# 2. Add New States
new_states = """  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');"""
content = content.replace("const [searchQuery, setSearchQuery] = useState('');", new_states)

# 3. Add handleSort and exportToCSV functions
helpers = """
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortIndicator = (key: string) => {
    if (sortConfig?.key === key) {
       return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
    }
    return <ArrowUpDown size={12} className="inline ml-1 opacity-20 group-hover:opacity-100 transition-opacity" />;
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).filter(key => key !== 'org_links' && key !== 'active_b2c_licenses' && key !== 'children_ids' && key !== 'teacher_ids'); 
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
       const values = headers.map(header => {
          let val = row[header];
          if (typeof val === 'object') val = JSON.stringify(val);
          if (val === null || val === undefined) val = '';
          return `"${str(val).replace('"', '""')}"`;
       });
       csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
""".replace('str(val)', 'String(val)')

content = content.replace("const filteredOrgs = organizations.filter", helpers + "\n  let processedOrgs = [...organizations].filter")

content = content.replace("const filteredIndividuals = individuals.filter", "let processedIndividuals = [...individuals].filter")

# Update processedOrgs logic
orgs_filter_pattern = r"""let processedOrgs = \[\.\.\.organizations\]\.filter\(org => \s*org\.organization_name\?\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\| \s*org\.kortex_id\?\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)\s*\);"""
orgs_filter_new = """let processedOrgs = [...organizations].filter(org => 
    org.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    org.kortex_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (sortConfig && activeTab === 'organizations') {
     processedOrgs.sort((a, b) => {
        const valA = (a as any)[sortConfig.key] || '';
        const valB = (b as any)[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
     });
  }"""
content = re.sub(orgs_filter_pattern, orgs_filter_new, content)


ind_filter_pattern = r"""let processedIndividuals = \[\.\.\.individuals\]\.filter\(ind => \s*ind\.full_name\?\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\| \s*ind\.email\?\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\|\s*ind\.kortex_id\?\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)\s*\);"""
ind_filter_new = """let processedIndividuals = [...individuals].filter(ind => {
    const matchesSearch = ind.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ind.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ind.kortex_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || ind.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  if (sortConfig && activeTab === 'individuals') {
     processedIndividuals.sort((a, b) => {
        const valA = (a as any)[sortConfig.key] || '';
        const valB = (b as any)[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
     });
  }"""
content = re.sub(ind_filter_pattern, ind_filter_new, content)

# 4. Replace occurrences in JSX map
content = content.replace("filteredOrgs.map((org)", "processedOrgs.map((org)")
content = content.replace("filteredIndividuals.map((ind)", "processedIndividuals.map((ind)")


# 5. Update Search UI with Role Filter and CSV Download
search_ui = r"""<div className="relative w-full md:w-64 shrink-0">\s*<Search size=\{16\} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />\s*<input\s*type="text"\s*placeholder="Search by ID or Name\.\.\."\s*value=\{searchQuery\}\s*onChange=\{\(e\) => setSearchQuery\(e\.target\.value\)\}\s*className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none"\s*\/>\s*<\/div>"""

new_search_ui = """<div className="flex items-center gap-3 w-full md:w-auto">
          {activeTab === 'individuals' && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 h-[38px]"
            >
              <option value="all">All Roles</option>
              <option value="parent">Parents</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
            </select>
          )}
          <div className="relative w-full md:w-64 shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none h-[38px]"
            />
          </div>
          <button 
            onClick={() => exportToCSV(activeTab === 'organizations' ? processedOrgs : processedIndividuals, `${activeTab}_export.csv`)}
            className="flex items-center justify-center gap-2 px-4 h-[38px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl transition-colors border border-emerald-100 shrink-0"
            title="Download CSV"
          >
            <Download size={16} /> <span className="hidden md:inline">CSV</span>
          </button>
        </div>"""
content = re.sub(search_ui, new_search_ui, content)


# 6. Make Headers Clickable
# Organizations Headers
org_h1 = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Kortex ID / Org Name</th>'
org_h1_new = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("organization_name")}>Kortex ID / Org Name {sortIndicator("organization_name")}</th>'

org_h2 = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Contact Email</th>'
org_h2_new = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("email")}>Contact Email {sortIndicator("email")}</th>'

content = content.replace(org_h1, org_h1_new)
content = content.replace(org_h2, org_h2_new)


# Individuals Headers
ind_h1 = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Kortex ID / Name</th>'
ind_h1_new = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("full_name")}>Kortex ID / Name {sortIndicator("full_name")}</th>'

ind_h2 = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Role</th>'
ind_h2_new = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("role")}>Role {sortIndicator("role")}</th>'

ind_h4 = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Email</th>'
ind_h4_new = '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("email")}>Email {sortIndicator("email")}</th>'

content = content.replace(ind_h1, ind_h1_new)
content = content.replace(ind_h2, ind_h2_new)
content = content.replace(ind_h4, ind_h4_new)


with open('kortex_users/kortex_admin/UsersManager.tsx', 'w') as f:
    f.write(content)
print("UsersManager patched successfully.")

