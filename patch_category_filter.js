const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/all_lessons_page.tsx', 'utf8');

// 1. Add state for selectedCategory
code = code.replace(
  /const \[selectedSubject, setSelectedSubject\] = useState\(defaultSubject \|\| ""\);\n\s*const \[searchQuery, setSearchQuery\] = useState\(""\);/,
  `const [selectedSubject, setSelectedSubject] = useState(defaultSubject || "");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");`
);

// 2. Add filtering logic
code = code.replace(
  /const matchQuery = searchQuery \? lesson\.chapter\?\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\| lesson\.book\?\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) : true;\n\s*return matchClass && matchSubject && matchQuery;/,
  `const matchQuery = searchQuery ? lesson.chapter?.toLowerCase().includes(searchQuery.toLowerCase()) || lesson.book?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const cat = getCategoryName(lesson.subject);
    const matchCategory = selectedCategory ? cat.toLowerCase() === selectedCategory.toLowerCase() : true;
    return matchClass && matchSubject && matchQuery && matchCategory;`
);

// 3. Add the select box
code = code.replace(
  /<select className="flex-1 md:w-40 bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" value=\{selectedClass\}/,
  `<select className="flex-1 md:w-40 bg-slate-50 border-2 rounded-xl px-3 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" value={selectedCategory} onChange={(e: any) => setSelectedCategory(e.target.value)}>
                  <option value="">All Types</option>
                  <option value="Core">Core</option>
                  <option value="Foundational">Foundational</option>
                  <option value="Co-Curricular & Skills">Co-Curricular</option>
                </select>
                <select className="flex-1 md:w-40 bg-slate-50 border-2 rounded-xl px-3 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" value={selectedClass}`
);

// 4. Update the Clear button logic
code = code.replace(
  /\{\(selectedClass \|\| selectedSubject \|\| searchQuery\) && <button onClick=\{\(\) => \{setSelectedClass\(""\); setSelectedSubject\(""\); setSearchQuery\(""\);\}\}/,
  `{(selectedCategory || selectedClass || selectedSubject || searchQuery) && <button onClick={() => {setSelectedCategory(""); setSelectedClass(""); setSelectedSubject(""); setSearchQuery("");}}`
);

fs.writeFileSync('kortex_landing_page/all_lessons_page.tsx', code);
console.log("Patched all_lessons_page.tsx to add category filter.");
