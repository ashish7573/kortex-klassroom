const fs = require('fs');
const target = 'kortex_users/org_admin/tabs/TeachersView.tsx';
let content = fs.readFileSync(target, 'utf8');

// 1. Add Icons to lucide-react import
content = content.replace(
  "import { GraduationCap, UserPlus, Copy, CheckCircle2, X, Pencil, Trash2, AlertTriangle, KeyRound } from 'lucide-react';",
  "import { GraduationCap, UserPlus, Copy, CheckCircle2, X, Pencil, Trash2, AlertTriangle, KeyRound, Search, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';"
);

// 2. Add state and logic for filtering/sorting
const stateLogic = `
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

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

  let processedTeachers = [...teachers].filter(t => {
    return (t.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
           (t.kortex_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (t.email || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (sortConfig) {
     processedTeachers.sort((a, b) => {
        let valA = String((a as any)[sortConfig.key] || '').toLowerCase();
        let valB = String((b as any)[sortConfig.key] || '').toLowerCase();
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
     });
  }
`;
content = content.replace(
  "const [deletingTeacher, setDeletingTeacher] = useState<TeacherProfile | null>(null);",
  "const [deletingTeacher, setDeletingTeacher] = useState<TeacherProfile | null>(null);\n" + stateLogic
);

// 3. Add Search UI
const searchUI = `
      {/* Controls: Search */}
      <div className="flex justify-between items-end mb-6">
        <div className="w-full max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, ID, or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Directory Table */}
`;
content = content.replace("{/* Directory Table */}", searchUI);

// 4. Update Table Headers
content = content.replace(
  '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Teacher Name & ID</th>',
  '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 transition-colors select-none group" onClick={() => handleSort("full_name")}>Teacher Name & ID {sortIndicator("full_name")}</th>'
);
content = content.replace(
  '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Email</th>',
  '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 transition-colors select-none group" onClick={() => handleSort("email")}>Email {sortIndicator("email")}</th>'
);

// 5. Render processedTeachers instead of teachers
content = content.replace(
  "teachers.map(t => (",
  "processedTeachers.map(t => ("
);
content = content.replace(
  "teachers.length === 0",
  "processedTeachers.length === 0"
);

fs.writeFileSync(target, content, 'utf8');
console.log("Patched TeachersView.tsx");
