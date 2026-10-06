const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/all_lessons_page.tsx', 'utf8');

// Add import
code = code.replace(
  /SUBJECTS,/,
  `SUBJECTS,\n  SUBJECT_CATEGORIES,`
);

// Add helper inside LessonsView
code = code.replace(
  /const LessonsView = \(\{ isLoggedIn, requireAuth, onStartLesson, defaultClass, defaultSubject, authProfile \}: any\) => \{/,
  `const LessonsView = ({ isLoggedIn, requireAuth, onStartLesson, defaultClass, defaultSubject, authProfile }: any) => {
  const getCategoryName = (subj: string) => {
    if (SUBJECT_CATEGORIES.CORE.includes(subj)) return 'Core';
    if (SUBJECT_CATEGORIES.FOUNDATIONAL.includes(subj)) return 'Foundational';
    if (SUBJECT_CATEGORIES.CO_CURRICULAR_AND_SKILLS.includes(subj)) return 'Co-Curricular & Skills';
    return '';
  };`
);

// Update render
code = code.replace(
  /<div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">\{lesson\.grade\}<\/span><span>•<\/span><span>\{lesson\.subject\}<\/span><\/div>/,
  `<div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 mb-4">
    <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{lesson.grade}</span>
    {getCategoryName(lesson.subject) && <><span>•</span><span className="text-slate-400">{getCategoryName(lesson.subject)}</span></>}
    <span>•</span><span>{lesson.subject}</span>
  </div>`
);

fs.writeFileSync('kortex_landing_page/all_lessons_page.tsx', code);
console.log("Patched all_lessons_page.tsx.");
