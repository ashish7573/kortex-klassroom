const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/curriculumConfig.ts', 'utf8');

// 1. Add Beaker
code = code.replace(
  /Type, FileText, Calculator, Leaf, Globe, Brain, Activity,\n  Star, Palette, Music, Monitor, Lightbulb, Video, Target, Gamepad2/,
  `Type, FileText, Calculator, Leaf, Globe, Brain, Activity,\n  Star, Palette, Music, Monitor, Lightbulb, Video, Target, Gamepad2, Beaker`
);

// 2. Replace GRADES
code = code.replace(
  /export const GRADES = \[\n  'FLN', 'Balvatika 1', 'Balvatika 2', 'Balvatika 3', \n  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', \n  'Grade 6', 'Grade 7', 'Grade 8'\n\];/,
  `export const GRADES = [\n  'Balvatika 1', 'Balvatika 2', 'Balvatika 3', \n  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', \n  'Grade 6', 'Grade 7', 'Grade 8'\n];`
);

// 3. Add SUBJECT_CATEGORIES and GRADE_CORE_MAP, and replace SUBJECTS
const cats = `export const SUBJECT_CATEGORIES = {
  CORE: ['English', 'Hindi', 'Maths', 'EVS', 'Science', 'SST'],
  FOUNDATIONAL: ['FLN English', 'FLN Hindi', 'FLN Maths'],
  CO_CURRICULAR_AND_SKILLS: ['Computers and AI', 'Mental Training', 'Physical Training and Sports', 'Theatre', 'Art and Craft Forms', 'Music and Dance Forms']
};

export const GRADE_CORE_MAP: Record<string, string[]> = {
  'Balvatika 1': ['English', 'Hindi', 'Maths'],
  'Balvatika 2': ['English', 'Hindi', 'Maths'],
  'Balvatika 3': ['English', 'Hindi', 'Maths'],
  'Grade 1': ['English', 'Hindi', 'Maths', 'EVS'],
  'Grade 2': ['English', 'Hindi', 'Maths', 'EVS'],
  'Grade 3': ['English', 'Hindi', 'Maths', 'EVS'],
  'Grade 4': ['English', 'Hindi', 'Maths', 'EVS'],
  'Grade 5': ['English', 'Hindi', 'Maths', 'EVS'],
  'Grade 6': ['English', 'Hindi', 'Maths', 'Science', 'SST'],
  'Grade 7': ['English', 'Hindi', 'Maths', 'Science', 'SST'],
  'Grade 8': ['English', 'Hindi', 'Maths', 'Science', 'SST'],
};

export const SUBJECTS = [
  ...SUBJECT_CATEGORIES.CORE,
  ...SUBJECT_CATEGORIES.FOUNDATIONAL,
  ...SUBJECT_CATEGORIES.CO_CURRICULAR_AND_SKILLS
];`;

code = code.replace(
  /export const SUBJECTS = \[\n  'English', 'Hindi', 'Maths', 'EVS', 'SST', \n  'Mental Training', 'Physical Training and Sports', \n  'Theatre', 'Art and Craft Forms', 'Music and Dance Forms', \n  'Computers and AI'\n\];/,
  cats
);

// 4. Update SUBJECT_ICONS
const iconString = `export const SUBJECT_ICONS: Record<string, { icon: any; color: string }> = {
  'English': { icon: Type, color: 'text-blue-500' },
  'Hindi': { icon: FileText, color: 'text-orange-500' },
  'Maths': { icon: Calculator, color: 'text-rose-500' },
  'EVS': { icon: Leaf, color: 'text-lime-500' },
  'Science': { icon: Beaker, color: 'text-emerald-400' },
  'SST': { icon: Globe, color: 'text-emerald-500' },
  'FLN English': { icon: Type, color: 'text-indigo-400' },
  'FLN Hindi': { icon: FileText, color: 'text-amber-500' },
  'FLN Maths': { icon: Calculator, color: 'text-rose-400' },
  'Mental Training': { icon: Brain, color: 'text-purple-500' },
  'Physical Training and Sports': { icon: Activity, color: 'text-red-500' },
  'Theatre': { icon: Star, color: 'text-amber-500' },
  'Art and Craft Forms': { icon: Palette, color: 'text-pink-500' },
  'Music and Dance Forms': { icon: Music, color: 'text-indigo-500' },
  'Computers and AI': { icon: Monitor, color: 'text-cyan-500' }
};`;

code = code.replace(
  /export const SUBJECT_ICONS: Record<string, \{ icon: any; color: string \}> = \{[\s\S]*?'Computers and AI': \{ icon: Monitor, color: 'text-cyan-500' \}\n\};/,
  iconString
);

// 5. Update SUBJECT_IMAGES
const imagesString = `export const SUBJECT_IMAGES: Record<string, string> = {
  'English': '/thumbnails/english-cover.webp',
  'Hindi': '/thumbnails/hindi-cover.webp',
  'Maths': '/thumbnails/maths-cover.webp',
  'EVS': '/thumbnails/evs-cover.webp',
  'Science': '/thumbnails/evs-cover.webp',
  'SST': '/thumbnails/sst-cover.webp',
  'FLN English': '/thumbnails/english-cover.webp',
  'FLN Hindi': '/thumbnails/hindi-cover.webp',
  'FLN Maths': '/thumbnails/maths-cover.webp',
  'Mental Training': '/thumbnails/mental-training-cover.webp',
  'Physical Training and Sports': '/thumbnails/sports-cover.webp',
  'Computers and AI': '/thumbnails/computers-cover.webp',
  'DEFAULT': '/thumbnails/default-cover.webp'
};`;

code = code.replace(
  /export const SUBJECT_IMAGES: Record<string, string> = \{[\s\S]*?'DEFAULT': '\/thumbnails\/default-cover.webp'\n\};/,
  imagesString
);

fs.writeFileSync('kortex_landing_page/curriculumConfig.ts', code);
console.log("curriculumConfig.ts patched.");
