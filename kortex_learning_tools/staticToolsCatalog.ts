/**
 * KORTEX KLASSROOM - STATIC TOOLS CATALOG & INSTANT RESOLVER
 * 
 * Provides instantaneous (0ms) local resolution for all interactive tools
 * (Games, Quizzes, Conceptualisers) bypassing Firebase Auth and Cloud Firestore
 * queries completely for direct links (e.g., from Instagram, WhatsApp, webviews).
 */

export interface StaticToolItem {
  id: string;
  subtopicId: string;
  type: 'game' | 'quiz' | 'conceptualiser' | 'video' | 'pdf';
  content_type: 'game' | 'quiz' | 'conceptualiser' | 'video' | 'pdf';
  title: string;
  chapter: string;
  chapter_name: string;
  book: string;
  subject: string;
  grade: string;
  color?: string;
}

export interface PlayableLessonWrapper {
  chapter: string;
  book: string;
  subject?: string;
  grade?: string;
  flow: StaticToolItem[];
}

/**
 * Curated registry of high-frequency interactive tools with human-friendly titles
 */
const KNOWN_STATIC_TOOLS: Record<string, Partial<StaticToolItem>> = {
  // =========================================================================
  // 1. MATHS GAMES (Arcade)
  // =========================================================================
  'rapid-fire': {
    type: 'quiz',
    title: 'Rapid Fire Math Arena',
    chapter: 'Basic Maths Operations',
    book: 'Speed Arithmetic',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'math-archer': {
    type: 'game',
    title: 'Math Archer',
    chapter: 'Basic Maths Operations',
    book: 'Kortex Arcade',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'math-defenders': {
    type: 'game',
    title: 'Math Defenders',
    chapter: 'Basic Maths Operations',
    book: 'Kortex Arcade',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'truck-loader-game': {
    type: 'game',
    title: 'Truck Loader Math',
    chapter: 'Counting & Numbers',
    book: 'Kortex Arcade',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'seriation-archer': {
    type: 'game',
    title: 'Seriation Archer',
    chapter: 'Patterns & Ordering',
    book: 'Kortex Arcade',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'memory-seriation': {
    type: 'game',
    title: 'Memory Seriation',
    chapter: 'Patterns & Ordering',
    book: 'Kortex Arcade',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'seriation-box': {
    type: 'game',
    title: 'Seriation Box',
    chapter: 'Patterns & Ordering',
    book: 'Kortex Arcade',
    subject: 'Maths',
    grade: 'Foundational'
  },

  // =========================================================================
  // 2. MATHS QUIZZES (Dojo)
  // =========================================================================
  'frog-jump-quiz': {
    type: 'quiz',
    title: 'Frog Jump Addition Quiz',
    chapter: 'Addition & Subtraction',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'finger-count-quiz': {
    type: 'quiz',
    title: 'Finger Counting Quiz',
    chapter: 'Numbers & Counting',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'word-problem-quiz': {
    type: 'quiz',
    title: 'Word Problem Operations',
    chapter: 'Basic Maths Operations',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'word-problems': {
    type: 'quiz',
    title: 'Word Problem Operations',
    chapter: 'Basic Maths Operations',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'tally-addition-quiz': {
    type: 'quiz',
    title: 'Tally Addition Quiz',
    chapter: 'Addition',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'tally-addition': {
    type: 'quiz',
    title: 'Tally Addition Quiz',
    chapter: 'Addition',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'maths-practice-generator': {
    type: 'quiz',
    title: 'Maths Practice Arena',
    chapter: 'Arithmetic Practice',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'maths-practice': {
    type: 'quiz',
    title: 'Maths Practice Arena',
    chapter: 'Arithmetic Practice',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'apple-delivery-quiz': {
    type: 'quiz',
    title: 'Apple Order Quiz',
    chapter: 'Patterns & Ordering',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'apple-order-quiz': {
    type: 'quiz',
    title: 'Apple Order Quiz',
    chapter: 'Patterns & Ordering',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'master-quiz-upto-hundred': {
    type: 'quiz',
    title: 'Master Quiz (Up to 100)',
    chapter: 'Numbers & Counting',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'cpa-addition-quiz': {
    type: 'quiz',
    title: 'CPA Addition Quiz',
    chapter: 'Addition & Regrouping',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'CPA-Addition-Quiz': {
    type: 'quiz',
    title: 'CPA Addition Quiz',
    chapter: 'Addition & Regrouping',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'fln-blocks-quiz': {
    type: 'quiz',
    title: 'FLN Blocks Quiz',
    chapter: 'Base-10 Blocks & Counting',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'basic-operations-crossword': {
    type: 'quiz',
    title: 'Basic Operations Crossword',
    chapter: 'Maths Operations',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'multiply-practice': {
    type: 'quiz',
    title: 'Multiplication Practice',
    chapter: 'Multiplication',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'multiplication-translator': {
    type: 'quiz',
    title: 'Multiplication Practice',
    chapter: 'Multiplication',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'master-quiz-upto-ten': {
    type: 'quiz',
    title: 'Numbers 1 to 10 Master Quiz',
    chapter: 'Numbers 1-10',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'numbers-1-to-10-quiz': {
    type: 'quiz',
    title: 'Numbers 1 to 10 Master Quiz',
    chapter: 'Numbers 1-10',
    book: 'Maths Dojo',
    subject: 'Maths',
    grade: 'Foundational'
  },

  // =========================================================================
  // 3. MATHS CONCEPTUALISERS (Sandbox)
  // =========================================================================
  'rounding-mountain': {
    type: 'conceptualiser',
    title: 'Rounding Mountain',
    chapter: 'Estimation & Rounding',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'concept-seriation': {
    type: 'conceptualiser',
    title: 'Coin Towers Seriation',
    chapter: 'Patterns & Ordering',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'number-story': {
    type: 'conceptualiser',
    title: 'Number Story Visualizer',
    chapter: 'Numbers & Counting',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'concept-shop': {
    type: 'conceptualiser',
    title: 'Shop Conceptualiser',
    chapter: 'Money & Shopping',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'concept-more-less': {
    type: 'conceptualiser',
    title: 'More or Less Visualizer',
    chapter: 'Quantity Comparison',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'counting-combinations': {
    type: 'conceptualiser',
    title: 'Counting Combinations',
    chapter: 'Number Bonds',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'addition-story-rohan': {
    type: 'conceptualiser',
    title: 'Addition Story Visualizer',
    chapter: 'Addition',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'addition-story': {
    type: 'conceptualiser',
    title: 'Addition Story Visualizer',
    chapter: 'Addition',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'addition-machine': {
    type: 'conceptualiser',
    title: 'Addition Machine',
    chapter: 'Addition',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'addition-frog': {
    type: 'conceptualiser',
    title: 'Addition Frog Visualizer',
    chapter: 'Addition',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'subtraction-bus-story': {
    type: 'conceptualiser',
    title: 'Subtraction Story Visualizer',
    chapter: 'Subtraction',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'subtraction-story': {
    type: 'conceptualiser',
    title: 'Subtraction Story Visualizer',
    chapter: 'Subtraction',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'counting-upto-20': {
    type: 'conceptualiser',
    title: 'Counting Up To 20',
    chapter: 'Counting & Numbers',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'counting-twenty': {
    type: 'conceptualiser',
    title: 'Counting Up To 20',
    chapter: 'Counting & Numbers',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'counting-hundred': {
    type: 'conceptualiser',
    title: 'Counting Up To 100',
    chapter: 'Counting & Numbers',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'counting-hundred-2': {
    type: 'conceptualiser',
    title: 'Counting Up To 100 (Part 2)',
    chapter: 'Counting & Numbers',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'addition-upto-hundred': {
    type: 'conceptualiser',
    title: 'Addition Up To 100',
    chapter: 'Addition',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'addition-hundred': {
    type: 'conceptualiser',
    title: 'Addition Up To 100',
    chapter: 'Addition',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'addition-with-carry': {
    type: 'conceptualiser',
    title: 'Addition With Carry',
    chapter: 'Addition With Regrouping',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'addition-carry': {
    type: 'conceptualiser',
    title: 'Addition With Carry',
    chapter: 'Addition With Regrouping',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'subtraction-without-borrow': {
    type: 'conceptualiser',
    title: 'Subtraction Without Borrow',
    chapter: 'Subtraction',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'subtraction-with-borrow': {
    type: 'conceptualiser',
    title: 'Subtraction With Borrow',
    chapter: 'Subtraction With Regrouping',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'multiplication-conceptualiser': {
    type: 'conceptualiser',
    title: 'Multiplication Conceptualiser',
    chapter: 'Multiplication',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'times-table': {
    type: 'conceptualiser',
    title: 'Interactive Times Table',
    chapter: 'Multiplication',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },
  'long-multiplication': {
    type: 'conceptualiser',
    title: 'Long Multiplication Intro',
    chapter: 'Multiplication',
    book: 'Interactive Sandbox',
    subject: 'Maths',
    grade: 'Foundational'
  },

  // =========================================================================
  // 4. HINDI TOOLS & GAMES
  // =========================================================================
  'barahkhadi-word-connect': {
    type: 'game',
    title: 'Barahkhadi Word Connect',
    chapter: 'Barahkhadi',
    book: 'Hindi Arcade',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'hindi-word-crush': {
    type: 'game',
    title: 'Hindi Word Crush',
    chapter: 'Matra Reading',
    book: 'Hindi Arcade',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'swar-vyanjan': {
    type: 'game',
    title: 'Swar & Vyanjan Game',
    chapter: 'Varnamala',
    book: 'Hindi Arcade',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'fln-story-quiz': {
    type: 'quiz',
    title: 'Hindi Story Quiz',
    chapter: 'Story Comprehension',
    book: 'Hindi Dojo',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'fln-hindi-assessment': {
    type: 'quiz',
    title: 'FLN Hindi Assessment',
    chapter: 'Literacy Assessment',
    book: 'Hindi Dojo',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'swar-vyanjan-quiz': {
    type: 'quiz',
    title: 'Swar & Vyanjan Quiz',
    chapter: 'Varnamala',
    book: 'Hindi Dojo',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'hindi-word-quiz': {
    type: 'quiz',
    title: 'Hindi Word Quiz',
    chapter: 'Word Recognition',
    book: 'Hindi Dojo',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'hindi-word-dictation': {
    type: 'quiz',
    title: 'Hindi Word Dictation',
    chapter: 'Dictation & Spelling',
    book: 'Hindi Dojo',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'full-barahkhadi': {
    type: 'conceptualiser',
    title: 'Barahkhadi Visualizer',
    chapter: 'Barahkhadi',
    book: 'Interactive Sandbox',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'barahkhadi-visualiser': {
    type: 'conceptualiser',
    title: 'Barahkhadi Visualizer',
    chapter: 'Barahkhadi',
    book: 'Interactive Sandbox',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'word-builder-2': {
    type: 'conceptualiser',
    title: '2-Letter Word Builder',
    chapter: 'Amatrik Words',
    book: 'Interactive Sandbox',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'word-builder-3': {
    type: 'conceptualiser',
    title: '3-Letter Word Builder',
    chapter: 'Amatrik Words',
    book: 'Interactive Sandbox',
    subject: 'Hindi',
    grade: 'Foundational'
  },
  'word-builder-4': {
    type: 'conceptualiser',
    title: '4-Letter Word Builder',
    chapter: 'Amatrik Words',
    book: 'Interactive Sandbox',
    subject: 'Hindi',
    grade: 'Foundational'
  }
};

/**
 * Format any slug into a human-friendly title
 * e.g., 'rapid-fire' -> 'Rapid Fire', 'math-archer' -> 'Math Archer'
 */
function formatTitleFromSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
}

/**
 * Infer tool metadata for known slug prefixes or patterns
 */
function inferToolMetadata(slug: string): Partial<StaticToolItem> {
  const lower = slug.toLowerCase();

  // Matra Games & Conceptualisers
  if (lower.startsWith('game-matra-')) {
    const matra = lower.replace('game-matra-', '').toUpperCase();
    return {
      type: 'game',
      title: `Matra ${matra} Word Crush`,
      chapter: 'Matra Reading',
      book: 'Hindi Arcade',
      subject: 'Hindi',
      grade: 'Foundational'
    };
  }

  if (lower.startsWith('wb-matra-')) {
    const matra = lower.replace('wb-matra-', '').toUpperCase();
    return {
      type: 'conceptualiser',
      title: `Matra ${matra} Word Builder`,
      chapter: 'Matra Words',
      book: 'Interactive Sandbox',
      subject: 'Hindi',
      grade: 'Foundational'
    };
  }

  if (lower.startsWith('matra-')) {
    const matra = lower.replace('matra-', '').toUpperCase();
    return {
      type: 'conceptualiser',
      title: `Matra ${matra} Conceptualiser`,
      chapter: 'Matra Formation',
      book: 'Interactive Sandbox',
      subject: 'Hindi',
      grade: 'Foundational'
    };
  }

  // Hindi Swar & Vyanjan chapters
  if (lower.startsWith('swar-') || lower.startsWith('vyanjan-')) {
    return {
      type: 'conceptualiser',
      title: formatTitleFromSlug(slug),
      chapter: 'Varnamala',
      book: 'Interactive Sandbox',
      subject: 'Hindi',
      grade: 'Foundational'
    };
  }

  // Story Quizzes
  if (lower.startsWith('story-') && lower.endsWith('-quiz')) {
    return {
      type: 'quiz',
      title: formatTitleFromSlug(slug),
      chapter: 'Story Comprehension',
      book: 'Hindi Dojo',
      subject: 'Hindi',
      grade: 'Foundational'
    };
  }

  // General inference by keywords
  const isMath = lower.includes('math') || lower.includes('add') || lower.includes('sub') || lower.includes('count') || lower.includes('multiply') || lower.includes('seriation') || lower.includes('number');
  const isHindi = lower.includes('hindi') || lower.includes('swar') || lower.includes('vyanjan') || lower.includes('matra') || lower.includes('barahkhadi') || lower.includes('varnamala');

  let type: 'game' | 'quiz' | 'conceptualiser' = 'game';
  if (lower.includes('quiz') || lower.includes('assessment') || lower.includes('practice') || lower.includes('crossword')) {
    type = 'quiz';
  } else if (lower.includes('concept') || lower.includes('story') || lower.includes('visual') || lower.includes('builder') || lower.includes('table')) {
    type = 'conceptualiser';
  }

  return {
    type,
    title: formatTitleFromSlug(slug),
    chapter: isMath ? 'Basic Maths Operations' : isHindi ? 'Foundational Hindi' : 'Interactive Module',
    book: type === 'game' ? 'Kortex Arcade' : type === 'quiz' ? 'Kortex Dojo' : 'Interactive Sandbox',
    subject: isMath ? 'Maths' : isHindi ? 'Hindi' : 'Curriculum',
    grade: 'Foundational'
  };
}

/**
 * Synchronous, zero-latency tool resolver.
 * Immediately constructs a full PlayableLessonWrapper in 0 milliseconds.
 */
export function resolveToolLocally(toolId: string | null | undefined): PlayableLessonWrapper | null {
  if (!toolId) return null;
  const cleanId = toolId.trim();
  if (!cleanId) return null;

  // 1. Direct dictionary lookup
  const known = KNOWN_STATIC_TOOLS[cleanId] || inferToolMetadata(cleanId);

  const toolItem: StaticToolItem = {
    id: cleanId,
    subtopicId: cleanId,
    type: known.type || 'game',
    content_type: known.type || 'game',
    title: known.title || formatTitleFromSlug(cleanId),
    chapter: known.chapter || 'Interactive Module',
    chapter_name: known.chapter || 'Interactive Module',
    book: known.book || 'Kortex Klassroom',
    subject: known.subject || 'Maths',
    grade: known.grade || 'Foundational',
    color: known.color || 'from-indigo-500 to-purple-600'
  };

  return {
    chapter: toolItem.chapter,
    book: toolItem.book,
    subject: toolItem.subject,
    grade: toolItem.grade,
    flow: [toolItem]
  };
}

