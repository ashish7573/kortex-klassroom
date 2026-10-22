import { GRADE_CORE_MAP, GRADES, SUBJECT_IMAGES } from './curriculumConfig';
import { KORTEX_COURSES } from './koursesData';

export type MasterCategory = 'Foundational' | 'Core' | 'Co-Curricular & Skills';
export type CourseStatus = 'active' | 'coming_soon';

export interface CatalogCourse {
  id: string;
  title: string;
  tagline?: string;
  masterCategory: MasterCategory;
  grade?: string;
  subject?: string;
  ageBand?: 'Ages 4-7' | 'Ages 8-11' | 'Ages 12-15' | 'All Ages';
  status: CourseStatus;
  isFree: boolean;
  price?: number;
  icon: string;
  coverImage?: string;
  color?: string;
  description: string;
  learningOutcomes?: string[];
  registeredCount?: number;
  wishlistCount?: number;
}

// -------------------------------------------------------------
// 1. FOUNDATIONAL COURSES (3 Courses)
// -------------------------------------------------------------
export const FOUNDATIONAL_COURSES: CatalogCourse[] = [
  {
    id: 'fln-hindi',
    title: 'FLN Hindi',
    tagline: 'Foundational Hindi Literacy, Varnamala, Matras & Reading',
    masterCategory: 'Foundational',
    grade: 'Foundational',
    subject: 'FLN Hindi',
    ageBand: 'Ages 4-7',
    status: 'active',
    isFree: true,
    icon: '📖',
    coverImage: '/thumbnails/hindi-cover.webp',
    color: 'from-amber-500 to-orange-600',
    description: 'Foundational literacy program based on NIPUN Bharat guidelines covering Akshar Gyan, Matra recognition, storytelling, and early sentence building.',
    learningOutcomes: [
      'Master complete Hindi Varnamala and sound associations',
      'Identify and read primary Matras with high accuracy',
      'Read short moral stories and sentences independently',
      'Develop expressive vocabulary and listening comprehension'
    ]
  },
  {
    id: 'fln-maths',
    title: 'FLN Maths',
    tagline: 'Foundational Numeracy, Counting & Early Problem Solving',
    masterCategory: 'Foundational',
    grade: 'Foundational',
    subject: 'FLN Maths',
    ageBand: 'Ages 4-7',
    status: 'active',
    isFree: true,
    icon: '🔢',
    coverImage: '/thumbnails/maths-cover.webp',
    color: 'from-rose-500 to-pink-600',
    description: 'Comprehensive early numeracy curriculum focusing on number sense, counting forward/backward, basic single-digit operations, patterns, and geometric shapes.',
    learningOutcomes: [
      'Understand number sense and quantity comparisons up to 100',
      'Single-digit addition and subtraction using visual manipulatives',
      'Pattern identification, shapes, and spatial awareness',
      'Real-world problem solving through interactive math games'
    ]
  },
  {
    id: 'fln-english',
    title: 'FLN English',
    tagline: 'Foundational English Phonics, Sight Words & Early Reading',
    masterCategory: 'Foundational',
    grade: 'Foundational',
    subject: 'FLN English',
    ageBand: 'Ages 4-7',
    status: 'coming_soon',
    isFree: true,
    icon: '🔤',
    coverImage: '/thumbnails/english-cover.webp',
    color: 'from-sky-500 to-blue-600',
    description: 'Interactive English literacy framework building phonetic decoding, CVC words, high-frequency sight words, and guided early reader passages.',
    learningOutcomes: [
      'Letter-sound correspondences and phonetic blend blending',
      'Fluency with top 100 essential English sight words',
      'Early sentence comprehension and guided passage reading',
      'Foundational speaking and descriptive vocabulary'
    ]
  }
];

// -------------------------------------------------------------
// 2. CORE ACADEMIC COURSES (Balvatika 1..3, Grade 1..8)
// -------------------------------------------------------------
export const CORE_COURSES: CatalogCourse[] = [];

Object.entries(GRADE_CORE_MAP).forEach(([grade, subjects]) => {
  subjects.forEach(subject => {
    const slugId = `core-${grade.toLowerCase().replace(/\s+/g, '-')}-${subject.toLowerCase().replace(/\s+/g, '-')}`;
    CORE_COURSES.push({
      id: slugId,
      title: `${grade} ${subject}`,
      tagline: `Complete ${grade} academic curriculum for ${subject}`,
      masterCategory: 'Core',
      grade: grade,
      subject: subject,
      ageBand: grade.includes('Balvatika') || grade === 'Grade 1' || grade === 'Grade 2'
        ? 'Ages 4-7'
        : grade === 'Grade 3' || grade === 'Grade 4' || grade === 'Grade 5'
        ? 'Ages 8-11'
        : 'Ages 12-15',
      status: 'coming_soon', // All core currently coming soon per user requirement
      isFree: false,
      icon: subject === 'Maths' ? '📐' : subject === 'Science' ? '🔬' : subject === 'EVS' ? '🌱' : subject === 'Hindi' ? '📜' : subject === 'SST' ? '🌍' : '📚',
      coverImage: (SUBJECT_IMAGES as any)[subject] || '/thumbnails/default-cover.webp',
      color: 'from-indigo-500 to-slate-700',
      description: `Comprehensive, board-aligned academic curriculum for ${grade} ${subject}. Features interactive conceptual sandboxes, practice quizzes, and guided lesson videos.`,
      learningOutcomes: [
        `Complete syllabus coverage for ${grade} ${subject}`,
        'Deep conceptual clarity through interactive digital simulations',
        'Chapter-wise milestone assessments and instant feedback',
        'Targeted revision and exam-ready problem solving'
      ]
    });
  });
});

// -------------------------------------------------------------
// 3. CO-CURRICULAR & SKILLS COURSES
// -------------------------------------------------------------
export const CO_CURRICULAR_COURSES: CatalogCourse[] = [
  // A. Broad curriculum tracks
  {
    id: 'skill-computers-ai',
    title: 'Computers & Artificial Intelligence',
    tagline: 'Computational Thinking, Digital Literacy & Prompt Engineering',
    masterCategory: 'Co-Curricular & Skills',
    grade: 'All Grades',
    subject: 'Computers and AI',
    ageBand: 'Ages 8-11',
    status: 'coming_soon',
    isFree: false,
    icon: '💻',
    coverImage: '/thumbnails/computers-cover.webp',
    color: 'from-cyan-500 to-blue-600',
    description: 'Practical digital literacy, algorithm design, creative coding, and safe AI usage tailored for young creators.',
    learningOutcomes: [
      'Fundamentals of computer architecture and operating systems',
      'Algorithmic logic and block-based programming concepts',
      'Introduction to AI, prompts, and machine learning models',
      'Digital safety, ethics, and cyber hygiene'
    ]
  },
  {
    id: 'skill-mental-training',
    title: 'Mental Training & Mindfulness',
    tagline: 'Attention Span, Memory Palace & Emotional Resilience',
    masterCategory: 'Co-Curricular & Skills',
    grade: 'All Grades',
    subject: 'Mental Training',
    ageBand: 'Ages 8-11',
    status: 'coming_soon',
    isFree: false,
    icon: '🧠',
    coverImage: '/thumbnails/mental-training-cover.webp',
    color: 'from-purple-500 to-indigo-600',
    description: 'Cognitive training modules designed to enhance focus, spatial memory, mental endurance, and stress management for students.',
    learningOutcomes: [
      'Active memory enhancement through mnemonic techniques',
      'Sustained attention and focus building exercises',
      'Growth mindset and handling academic pressure',
      'Mindful breathing and emotional self-regulation'
    ]
  },
  {
    id: 'skill-physical-sports',
    title: 'Physical Training & Sports Science',
    tagline: 'Fitness Drills, Posture, Nutrition & Athletic Habits',
    masterCategory: 'Co-Curricular & Skills',
    grade: 'All Grades',
    subject: 'Physical Training and Sports',
    ageBand: 'Ages 8-11',
    status: 'coming_soon',
    isFree: false,
    icon: '⚽',
    coverImage: '/thumbnails/sports-cover.webp',
    color: 'from-emerald-500 to-teal-600',
    description: 'Daily bodyweight fitness routines, movement agility, postural awareness, and foundational sports science.',
    learningOutcomes: [
      'Cardiovascular endurance and core stability exercises',
      'Correct ergonomic posture for study and screen time',
      'Nutrition guidelines and healthy recovery habits',
      'Sportsmanship, teamwork, and fair play fundamentals'
    ]
  },
  {
    id: 'skill-theatre-arts',
    title: 'Theatre, Drama & Public Speaking',
    tagline: 'Stage Confidence, Voice Modulation & Creative Expression',
    masterCategory: 'Co-Curricular & Skills',
    grade: 'All Grades',
    subject: 'Theatre',
    ageBand: 'Ages 8-11',
    status: 'coming_soon',
    isFree: false,
    icon: '🎭',
    coverImage: '/thumbnails/default-cover.webp',
    color: 'from-amber-500 to-red-500',
    description: 'Overcome stage fright, master vocal projection, body language, and dramatic storytelling in an interactive format.',
    learningOutcomes: [
      'Confident impromptu speaking and presentation skills',
      'Vocal modulation, resonance, and breath control',
      'Character improvisation and role-playing drills',
      'Creative script interpretation and emotional expression'
    ]
  },
  {
    id: 'skill-art-craft',
    title: 'Art, Craft & Design Forms',
    tagline: 'Visual Composition, Traditional Indian Art & DIY Crafts',
    masterCategory: 'Co-Curricular & Skills',
    grade: 'All Grades',
    subject: 'Art and Craft Forms',
    ageBand: 'Ages 4-7',
    status: 'coming_soon',
    isFree: false,
    icon: '🎨',
    coverImage: '/thumbnails/default-cover.webp',
    color: 'from-pink-500 to-rose-600',
    description: 'Explore color harmony, sketching, folk art traditions, and hands-on tactile craft projects.',
    learningOutcomes: [
      'Color theory and visual perspective fundamentals',
      'Traditional folk art forms (Madhubani, Warli, Gond)',
      'Fine motor skills through papercraft and sculpture',
      'Creative portfolio building and artistic self-expression'
    ]
  },
  {
    id: 'skill-music-dance',
    title: 'Music & Dance Forms',
    tagline: 'Rhythm, Classical Taals, Melody & Movement',
    masterCategory: 'Co-Curricular & Skills',
    grade: 'All Grades',
    subject: 'Music and Dance Forms',
    ageBand: 'Ages 4-7',
    status: 'coming_soon',
    isFree: false,
    icon: '🎵',
    coverImage: '/thumbnails/default-cover.webp',
    color: 'from-violet-500 to-fuchsia-600',
    description: 'Appreciation of world rhythm, Indian classical swaras, beat synchronisation, and joyful movement expressions.',
    learningOutcomes: [
      'Basic swara recognition and ear-training exercises',
      'Rhythmic timing, claps, and beat synchronization',
      'Graceful movement and expressive choreography drills',
      'Appreciation of diverse cultural music styles'
    ]
  },

  // B. Specialized micro-courses from koursesData
  ...KORTEX_COURSES.map(kc => ({
    id: `micro-${kc.id}`,
    title: kc.title,
    tagline: kc.tagline,
    masterCategory: 'Co-Curricular & Skills' as MasterCategory,
    grade: kc.gradeGroup,
    subject: kc.category,
    ageBand: kc.ageBand as any,
    status: 'coming_soon' as CourseStatus,
    isFree: false,
    icon: kc.icon,
    coverImage: '/thumbnails/default-cover.webp',
    color: kc.color,
    description: kc.description,
    learningOutcomes: kc.learningOutcomes
  }))
];

// -------------------------------------------------------------
// 4. MASTER CATALOG (Combined)
// -------------------------------------------------------------
export const ALL_CATALOG_COURSES: CatalogCourse[] = [
  ...FOUNDATIONAL_COURSES,
  ...CORE_COURSES,
  ...CO_CURRICULAR_COURSES
];
export const KORTEX_CATALOG_COURSES = ALL_CATALOG_COURSES;
export { GRADE_CORE_MAP };

/**
 * Helper to determine whether a given course is a PAID course (entitled to unlimited stamina).
 * Free courses (such as foundational FLN Hindi & FLN Maths) utilize the daily hearts stamina system.
 */
export function isPaidCourse(courseTitleOrId?: string | null, overrides?: Record<string, any>): boolean {
  if (!courseTitleOrId) return false;
  const lower = courseTitleOrId.toLowerCase().trim();
  const course = ALL_CATALOG_COURSES.find(c => 
    c.title.toLowerCase().trim() === lower || 
    c.id.toLowerCase().trim() === lower
  );
  if (!course) return false;

  const override = overrides ? overrides[course.id] : undefined;
  const isFree = override?.isFree !== undefined ? override.isFree : course.isFree;
  const price = override?.price !== undefined ? override.price : course.price;
  return !isFree && (price === undefined || price > 0);
}

export const ALL_GRADE_TABS = [
  { id: 'Balvatika 1', label: 'Balvatika 1 (Nursery)' },
  { id: 'Balvatika 2', label: 'Balvatika 2 (LKG)' },
  { id: 'Balvatika 3', label: 'Balvatika 3 (UKG)' },
  { id: 'Grade 1', label: 'Grade 1' },
  { id: 'Grade 2', label: 'Grade 2' },
  { id: 'Grade 3', label: 'Grade 3' },
  { id: 'Grade 4', label: 'Grade 4' },
  { id: 'Grade 5', label: 'Grade 5' },
  { id: 'Grade 6', label: 'Grade 6' },
  { id: 'Grade 7', label: 'Grade 7' },
  { id: 'Grade 8', label: 'Grade 8' }
];

export const ALL_AGE_BANDS = [
  { id: 'all', label: 'All Ages' },
  { id: 'Ages 4-7', label: 'Ages 4 - 7 (Early)' },
  { id: 'Ages 8-11', label: 'Ages 8 - 11 (Junior)' },
  { id: 'Ages 12-15', label: 'Ages 12 - 15 (Middle)' }
];

