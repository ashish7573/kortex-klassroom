const fs = require('fs');
const file = 'kortex_users/parent/ChildAcademicView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Update SubjectPerformance interface
code = code.replace(
  `interface SubjectPerformance {
  subjectName: string;
  childScore: number;
  classAvg: number;
  baseline: number;
  isLocked: boolean;
}`,
  `interface SubjectPerformance {
  subjectName: string;
  comboLabel: string;
  childScore: number;
  classAvg: number;
  baseline: number;
  isLocked: boolean;
}`
);

// 2. Update realPerformance mapping
const oldOrgMap = `        const realPerformance: SubjectPerformance[] = subjects.map((sub) => {
          const cKey = \`\${orgData.grade}_\${sub.subjectName}\`.toLowerCase();`;

const newOrgMap = `        const realPerformance: SubjectPerformance[] = subjects.map((sub) => {
          // Extract exact grade from the combo string itself!
          const parts = sub.comboString.split('-');
          const cGrade = parts.length > 0 ? parts[0].trim().toLowerCase() : 'unknown_grade';
          const cSubj = sub.subjectName.toLowerCase();
          const cKey = \`\${cGrade}_\${cSubj}\`;`;

code = code.replace(oldOrgMap, newOrgMap);

const oldOrgReturn = `          return {
            subjectName: sub.subjectName,
            childScore: childScore, // Actual average score from completed quizzes/games
            classAvg: 0, // Need backend aggregation for this
            baseline: 60,
            isLocked: false
          };`;

const newOrgReturn = `          return {
            subjectName: sub.subjectName,
            comboLabel: sub.comboString,
            childScore: childScore,
            classAvg: 0,
            baseline: 60,
            isLocked: false
          };`;

code = code.replace(oldOrgReturn, newOrgReturn);

// 3. Update independentPerformance mapping
const oldIndepReturn = `    return {
      subjectName: sub.name,
      childScore: childScore,
      classAvg: 0,
      baseline: 60,
      isLocked
    };`;

const newIndepReturn = `    return {
      subjectName: parts[parts.length - 1].trim(),
      comboLabel: sub.name,
      childScore: childScore,
      classAvg: 0,
      baseline: 60,
      isLocked
    };`;
code = code.replace(oldIndepReturn, newIndepReturn);

// 4. Update PerformanceBlock rendering
const oldPerfRender = `              <div className="w-full sm:w-48 shrink-0 flex items-center justify-between sm:block">
                <h4 className="font-black text-slate-800">{perf.subjectName}</h4>
                <div className="font-bold text-emerald-600 text-lg sm:mt-1">
                   {perf.isLocked ? "--" : \`\${perf.childScore}%\`}
                </div>
              </div>`;

const newPerfRender = `              <div className="w-full sm:w-48 shrink-0 flex items-center justify-between sm:block">
                <div>
                   <h4 className="font-black text-slate-800">{perf.subjectName}</h4>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{perf.comboLabel}</p>
                </div>
                <div className="font-bold text-emerald-600 text-lg sm:mt-1">
                   {perf.isLocked ? "--" : \`\${perf.childScore}%\`}
                </div>
              </div>`;
code = code.replace(oldPerfRender, newPerfRender);

fs.writeFileSync(file, code);
