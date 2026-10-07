const fs = require('fs');
const target = 'kortex_users/org_admin/tabs/StudentsParentsView.tsx';
let content = fs.readFileSync(target, 'utf8');

// 1. Add Icons to lucide-react import
content = content.replace(
  "import { Users, UserPlus, Link, AlertCircle, CheckCircle2, MoreVertical, RefreshCw, Phone, Pencil, Trash2, Import, BookOpen, Download } from 'lucide-react';",
  "import { Users, UserPlus, Link, AlertCircle, CheckCircle2, MoreVertical, RefreshCw, Phone, Pencil, Trash2, Import, BookOpen, Download, Search, Filter, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';"
);

// 2. Add state and logic for filtering/sorting
const stateLogic = `
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
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

  let processedStudents = [...students].filter(student => {
    const matchesSearch = 
      (student.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (student.kortex_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const grade = student.org_links?.[profile.uid]?.grade || student.grade;
    const matchesGrade = gradeFilter === 'all' || grade === gradeFilter;

    return matchesSearch && matchesGrade;
  });

  if (sortConfig) {
     processedStudents.sort((a, b) => {
        let valA = '';
        let valB = '';
        
        if (sortConfig.key === 'student_id') {
           valA = (a.kortex_id || '').toLowerCase();
           valB = (b.kortex_id || '').toLowerCase();
        } else if (sortConfig.key === 'full_name') {
           valA = (a.full_name || '').toLowerCase();
           valB = (b.full_name || '').toLowerCase();
        } else if (sortConfig.key === 'link_status') {
           valA = (a.org_links?.[profile.uid]?.status || '').toLowerCase();
           valB = (b.org_links?.[profile.uid]?.status || '').toLowerCase();
        }
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
     });
  }
`;
content = content.replace(
  "const [isSubmitting, setIsSubmitting] = useState(false);",
  "const [isSubmitting, setIsSubmitting] = useState(false);\n" + stateLogic
);

// 3. Add Filter UI
const filterUI = `
      {/* Controls: Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end mb-6">
        <div className="flex-1 w-full max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by student name or Kortex ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={gradeFilter} 
            onChange={e => setGradeFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Grades</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>
      
      {/* Directory Table */}
`;
content = content.replace("{/* Directory Table */}", filterUI);

// 4. Update Table Headers
content = content.replace(
  '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Student ID</th>',
  '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 transition-colors select-none group" onClick={() => handleSort("student_id")}>Student ID {sortIndicator("student_id")}</th>'
);
content = content.replace(
  '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Student Name</th>',
  '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 transition-colors select-none group" onClick={() => handleSort("full_name")}>Student Name {sortIndicator("full_name")}</th>'
);
content = content.replace(
  '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Link Status</th>',
  '<th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 transition-colors select-none group" onClick={() => handleSort("link_status")}>Link Status {sortIndicator("link_status")}</th>'
);

// 5. Render processedStudents instead of students
content = content.replace(
  "students.length > 0 ? students.map(student => {",
  "processedStudents.length > 0 ? processedStudents.map(student => {"
);
content = content.replace(
  "students.length > 0 ? students.map",
  "processedStudents.length > 0 ? processedStudents.map"
);

fs.writeFileSync(target, content, 'utf8');
console.log("Patched StudentsParentsView.tsx");
