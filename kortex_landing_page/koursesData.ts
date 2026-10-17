export interface CourseModule {
  number: number;
  title: string;
  description: string;
  topics: string[];
}

export interface KortexCourse {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  category: 'Coding & Robotics' | 'Vedic & Mental Math' | 'Science & Space' | 'Communication & Arts' | 'Olympiad & Logic';
  ageBand: 'Ages 4-7' | 'Ages 8-11' | 'Ages 12-15' | 'All Ages';
  gradeGroup: string;
  color: string;
  badgeColor: string;
  cardBg: string;
  description: string;
  learningOutcomes: string[];
  prerequisites: string;
  format: string;
  estimatedWeeks: number;
  modules: CourseModule[];
  capstoneProject: {
    title: string;
    description: string;
  };
}

export const AGE_GROUPS = [
  { id: 'all', label: 'All Age Groups', range: 'Ages 4 - 15' },
  { id: 'Ages 4-7', label: 'Early Explorers', range: 'Ages 4 - 7 (Grades K-2)' },
  { id: 'Ages 8-11', label: 'Junior Champions', range: 'Ages 8 - 11 (Grades 3-5)' },
  { id: 'Ages 12-15', label: 'Middle & Senior Innovators', range: 'Ages 12 - 15 (Grades 6-8)' }
] as const;

export const COURSE_CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: '🌟' },
  { id: 'Coding & Robotics', label: 'Coding & Robotics', icon: '🤖' },
  { id: 'Vedic & Mental Math', label: 'Vedic & Mental Math', icon: '🧮' },
  { id: 'Science & Space', label: 'Science & Space', icon: '🚀' },
  { id: 'Communication & Arts', label: 'Language & Arts', icon: '🔤' },
  { id: 'Olympiad & Logic', label: 'Olympiad & Logic', icon: '🏆' }
] as const;

export const KORTEX_COURSES: KortexCourse[] = [
  {
    id: 'vedic-maths',
    title: 'Vedic Speed Mathematics',
    tagline: 'Lightning-fast mental calculation tricks & ancient Indian sutras',
    icon: '🧮',
    category: 'Vedic & Mental Math',
    ageBand: 'Ages 8-11',
    gradeGroup: 'Grades 2 - 8',
    color: 'from-amber-500 to-orange-600',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    cardBg: 'bg-orange-50/50 border-orange-200 hover:border-orange-400',
    description: 'Master ancient Vedic sutras and mental math techniques to solve 3-digit multiplication, long division shortcuts, square roots, and algebraic equations in under 5 seconds without scratch paper.',
    learningOutcomes: [
      'Multiply any 2-digit and 3-digit numbers using Vertically and Crosswise sutra in seconds',
      'Calculate squares and square roots mentally with zero scratch paper',
      'Rapid subtraction and division using Nikhilam Navatashcaramam Dashatah',
      'Boost exam calculation speed by over 300% and eliminate silly arithmetic errors'
    ],
    prerequisites: 'Basic knowledge of addition and single-digit multiplication tables (1 to 9).',
    format: 'Interactive Sandboxes • Practice Drills • Speed Timer Sprints',
    estimatedWeeks: 6,
    modules: [
      {
        number: 1,
        title: 'Instant Multiplications & Base Method',
        description: 'Learn Ekadhikena Purvena and base 10, 100, 1000 calculations for multiplying numbers close to bases.',
        topics: ['Base 100 cross-subtraction tricks', 'Above and below base multiplications', 'Complement calculations']
      },
      {
        number: 2,
        title: 'Universal Multiplication (Urdhva Tiryagbhyam)',
        description: 'The master cross-multiplication method for any 2-digit and 3-digit numbers.',
        topics: ['Step-by-step cross-grid pattern', 'Mental carry-forward strategies', 'Instant double-checking with digital roots']
      },
      {
        number: 3,
        title: 'Square Roots & Cube Roots in 5 Seconds',
        description: 'Find exact and approximate roots of large numbers through simple visual observation.',
        topics: ['Ending digit rules for perfect squares', 'Instant cube roots of 6-digit numbers', 'Approximations without paper']
      },
      {
        number: 4,
        title: 'Rapid Division & Vinculum Numbers',
        description: 'Convert complex numbers with large digits into simple vinculum forms for effortless division.',
        topics: ['Introduction to Vinculum bar notation', 'Flag method of single-line division', 'Handling recurring decimals']
      }
    ],
    capstoneProject: {
      title: 'Grand Vedic Speed Sprint Championship',
      description: 'Solve 25 advanced 3-digit multiplication, division, and root problems in under 3 minutes on the interactive speed machine.'
    }
  },
  {
    id: 'junior-coding',
    title: 'Junior Coding & Game Creator',
    tagline: 'Visual block programming, game physics & creative logic',
    icon: '🤖',
    category: 'Coding & Robotics',
    ageBand: 'Ages 8-11',
    gradeGroup: 'Grades 1 - 6',
    color: 'from-blue-500 to-indigo-600',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    cardBg: 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-400',
    description: 'Learn core computer science concepts through fun visual block coding. Children design their own characters, code gravity and jumping physics, build interactive stories, and create playable arcade video games.',
    learningOutcomes: [
      'Master fundamental coding concepts: sequencing, loops, conditional if-else statements, and variables',
      'Create 2D video game mechanics: player controls, score counters, collision detection, and obstacles',
      'Develop algorithmic problem-solving and debugging skills through interactive puzzles',
      'Publish and share playable web games that friends and family can play on any device'
    ],
    prerequisites: 'No prior coding experience required. Basic mouse or touchscreen familiarity.',
    format: 'Hands-on Coding Canvas • Gamified Puzzles • Playable Arcade Exports',
    estimatedWeeks: 8,
    modules: [
      {
        number: 1,
        title: 'Algorithmic Thinking & Sequences',
        description: 'Understand how computers think by giving step-by-step instructions to guide animated sprites.',
        topics: ['Coordinate grids (X and Y coordinates)', 'Sequential execution and debugging', 'Event triggers (When flag clicked, key pressed)']
      },
      {
        number: 2,
        title: 'Loops & Pattern Power',
        description: 'Automate repetitive tasks with repeat loops, forever loops, and nested cycles.',
        topics: ['Repeat until conditions', 'Drawing geometric mandala art with pen blocks', 'Animating multi-frame walking characters']
      },
      {
        number: 3,
        title: 'Conditionals, Collisions & Sensing',
        description: 'Make games respond dynamically when sprites collide with hazards or collect power-ups.',
        topics: ['If-then and If-then-else decision trees', 'Color touch sensing and edge bouncing', 'Sound effects and dynamic music triggers']
      },
      {
        number: 4,
        title: 'Variables, High Scores & Game Physics',
        description: 'Track lives, scores, countdown timers, and simulate realistic jumping with acceleration.',
        topics: ['Creating and updating score variables', 'Simulating platformer jumping & gravity velocity', 'Winning and Game Over screen states']
      }
    ],
    capstoneProject: {
      title: 'Build Your Own Retro Arcade Platformer',
      description: 'Design, code, and test a complete multi-level platformer game featuring player controls, collectible gems, moving obstacles, and boss battles.'
    }
  },
  {
    id: 'robotics-inventions',
    title: 'Robotics Projects & Smart Inventions',
    tagline: 'Virtual circuits, sensor integration & automated robotic mechanisms',
    icon: '🦾',
    category: 'Coding & Robotics',
    ageBand: 'Ages 12-15',
    gradeGroup: 'Grades 4 - 8',
    color: 'from-cyan-500 to-blue-700',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    cardBg: 'bg-cyan-50/50 border-cyan-200 hover:border-cyan-400',
    description: 'Explore the fascinating world of physical computing and robotics engineering! Students simulate micro-controller boards, connect breadboards, program ultrasonic sensors, control servo motors, and automate smart-home devices.',
    learningOutcomes: [
      'Understand electrical principles: voltage, current, resistance, Ohm\'s law, and closed circuits',
      'Interface digital and analog sensors (light, temperature, ultrasonic distance, sound)',
      'Program micro-controller logic (Arduino-style simulation) to control actuators and displays',
      'Design automated robotic solutions for real-world environmental and smart-city problems'
    ],
    prerequisites: 'Curiosity about gadgets and technology. Basic math skills.',
    format: 'Virtual Breadboard Simulator • Interactive Electronic Schematics • Code Sandbox',
    estimatedWeeks: 8,
    modules: [
      {
        number: 1,
        title: 'Circuit Foundations & LED Matrix',
        description: 'Hands-on electronic fundamentals with virtual batteries, resistors, switches, and LEDs.',
        topics: ['Ohm’s law and circuit safety', 'Series vs. Parallel circuits', 'Traffic light automation simulation']
      },
      {
        number: 2,
        title: 'Sensors: The Robot\'s Senses',
        description: 'Connect analog and digital sensors to gather data from the surrounding virtual environment.',
        topics: ['Light-dependent resistors (LDRs) for automatic night lights', 'Ultrasonic distance radar for obstacle detection', 'Temperature alarm systems']
      },
      {
        number: 3,
        title: 'Motors & Actuators: Giving Robots Motion',
        description: 'Control DC motors, servo motors, and stepper motors with precision angles and speeds.',
        topics: ['Pulse-width modulation (PWM) for speed control', 'Servo arm angles and robotic claw grippers', 'Motor drivers and power separation']
      },
      {
        number: 4,
        title: 'Smart City & Automation Hub',
        description: 'Integrate LCD displays, buzzers, and automated feedback loops for real-world inventions.',
        topics: ['Smart waste bin with ultrasonic touchless lid', 'Automatic plant watering system simulation', 'Burglar alarm with motion sensors']
      }
    ],
    capstoneProject: {
      title: 'Autonomous Obstacle-Avoiding Rover Simulation',
      description: 'Wire and program a virtual robotic vehicle that navigates through a maze, detects walls via sonar sensors, and navigates autonomously to the exit.'
    }
  },
  {
    id: 'mental-math-logic',
    title: 'Mental Maths & Logic Brainteasers',
    tagline: 'Rapid mental arithmetic, spatial reasoning & puzzle solving',
    icon: '🧠',
    category: 'Vedic & Mental Math',
    ageBand: 'Ages 4-7',
    gradeGroup: 'Grades K - 6',
    color: 'from-purple-500 to-indigo-700',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    cardBg: 'bg-purple-50/50 border-purple-200 hover:border-purple-400',
    description: 'Transform math into a thrilling brain gym! Students train their numerical reflexes with visual pattern recognition, number grids, rapid addition pyramids, 3D shape manipulations, and competitive logic puzzles.',
    learningOutcomes: [
      'Perform rapid mental addition, subtraction, and estimation without counting on fingers',
      'Master inductive and deductive logic through non-verbal pattern sequences',
      'Solve spatial reasoning challenges, folding nets, and mirror image transformations',
      'Build lifelong mathematical intuition, curiosity, and confidence'
    ],
    prerequisites: 'Comfortable with basic single-digit numbers.',
    format: 'Gamified Puzzle Engine • Daily Brain Gym Challenges • Timed Logic Sprints',
    estimatedWeeks: 6,
    modules: [
      {
        number: 1,
        title: 'Number Bonds & Fast Mental Addition',
        description: 'Techniques to break and combine numbers to friendly tens and hundreds effortlessly.',
        topics: ['Making tens and friendly hundreds', 'Mental left-to-right addition strategy', 'Compensation and balance tricks']
      },
      {
        number: 2,
        title: 'Visual Patterns & Series Reasoning',
        description: 'Uncover missing elements, sequence rules, and rotation patterns in complex symbol grids.',
        topics: ['Arithmetic and geometric visual sequences', 'Matrix logic grids and deduction charts', 'Odd-one-out and relational reasoning']
      },
      {
        number: 3,
        title: 'Spatial Geometry & 3D Visualization',
        description: 'Rotate shapes mentally, inspect cube nets, count hidden blocks, and predict folds.',
        topics: ['Unfolded cube net orientations', 'Counting hidden blocks in 3D isometric stacks', 'Reflections, rotational symmetries, and shadows']
      },
      {
        number: 4,
        title: 'Sudoku, Kakuro & Cryptarithms',
        description: 'Solve famous mathematical logic puzzles using elimination logic and clue chains.',
        topics: ['Mini 4x4 and 6x6 Sudoku tactics', 'Cryptarithm letter-addition puzzles (e.g. SEND + MORE = MONEY)', 'Magic squares and balance scales']
      }
    ],
    capstoneProject: {
      title: 'The Great Mind Gym Triathlon',
      description: 'Race through 3 stages of rapid mental math sprints, visual pattern decryptor puzzles, and a final 3D spatial escape challenge.'
    }
  },
  {
    id: 'space-science',
    title: 'Space Science & Astronomy Quest',
    tagline: 'Solar system exploration, rocket physics & cosmic mysteries',
    icon: '🚀',
    category: 'Science & Space',
    ageBand: 'Ages 8-11',
    gradeGroup: 'Grades 2 - 8',
    color: 'from-violet-600 to-indigo-900',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
    cardBg: 'bg-violet-50/50 border-violet-200 hover:border-violet-400',
    description: 'Embark on an awe-inspiring cosmic expedition! Travel through our solar system, explore planetary atmospheres, calculate gravity on alien worlds, simulate multi-stage rocket launches, and discover the secrets of nebulae and black holes.',
    learningOutcomes: [
      'Understand solar system architecture, planetary geology, orbits, and lunar phases',
      'Learn Newtonian physics of rocket propulsion: thrust, drag, escape velocity, and orbits',
      'Navigate the night sky, recognize constellations, and understand optical telescopes',
      'Explore deep-space astrophysics: life cycle of stars, supernovae, exoplanets, and black holes'
    ],
    prerequisites: 'A passion for space and astronomy. General curiosity about nature.',
    format: '3D Planetarium Simulator • Interactive Rocket Physics Lab • Virtual Telescope',
    estimatedWeeks: 6,
    modules: [
      {
        number: 1,
        title: 'Solar System Odysseys & Alien Worlds',
        description: 'Tour terrestrial planets, gas giants, icy dwarf planets, and mysterious asteroid belts.',
        topics: ['Planetary scale, atmospheres, and extreme temperatures', 'Why Pluto was reclassified and Kuiper belt objects', 'Gravitational weight simulator on different planets']
      },
      {
        number: 2,
        title: 'Rocket Science & Orbital Mechanics',
        description: 'Design and launch virtual rockets into orbit while balancing propellant mass and thrust.',
        topics: ['Newton\'s third law in rocket propulsion', 'Escape velocity and staging mechanisms', 'How satellites stay in stable orbit without falling']
      },
      {
        number: 3,
        title: 'Stargazing & The Constellation Map',
        description: 'Learn how ancient astronomers navigated by the stars and how modern telescopes see deep space.',
        topics: ['Ursa Major, Orion, and finding the North Star', 'Refracting vs. Reflecting telescope optics', 'Spectroscopy: How light reveals what stars are made of']
      },
      {
        number: 4,
        title: 'Stars, Supernovae & Black Holes',
        description: 'Witness the birth of stars inside stellar nurseries and their dramatic final explosions.',
        topics: ['Life cycle of average and massive stars', 'Neutron stars and gravitational pull of black holes', 'The search for habitable exoplanets and alien life']
      }
    ],
    capstoneProject: {
      title: 'Design a Mars Colony & Landing Mission',
      description: 'Simulate a mission trajectory from Earth to Mars, execute a powered parachute descent, and design a life-supporting habitat base.'
    }
  },
  {
    id: 'creative-phonics',
    title: 'Creative Phonics & Story Club',
    tagline: 'Expressive storytelling, blend mastery & vocabulary journeys',
    icon: '🔤',
    category: 'Communication & Arts',
    ageBand: 'Ages 4-7',
    gradeGroup: 'Foundational & Primary',
    color: 'from-rose-500 to-pink-600',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
    cardBg: 'bg-pink-50/50 border-pink-200 hover:border-pink-400',
    description: 'Transform early reading into a joyful theatrical adventure! Young scholars master letter-sound correspondences, digraphs, vowel blends, expressive voice modulation, and vocabulary comprehension through interactive illustrated storybooks.',
    learningOutcomes: [
      'Master 44 English phonemes, consonant blends, and vowel digraphs with confidence',
      'Decode unfamiliar multi-syllable words accurately without hesitation',
      'Read aloud with dramatic expression, rhythm, character voices, and proper pacing',
      'Build rich descriptive vocabulary and develop a lifelong love for literature'
    ],
    prerequisites: 'Familiarity with English alphabet recognition.',
    format: 'Illustrated Story Reader • Audio Phonics Drills • Word-Building Sandbox',
    estimatedWeeks: 6,
    modules: [
      {
        number: 1,
        title: 'Phonemic Awareness & Short Vowel Magic',
        description: 'Master short vowel sounds and build three-letter CVC (consonant-vowel-consonant) words.',
        topics: ['Short vowels (a, e, i, o, u) word families', 'Onset and rime blending with sound buttons', 'Interactive rhyme time games']
      },
      {
        number: 2,
        title: 'Consonant Blends & Secret Digraphs',
        description: 'Unravel tricky blend pairs (bl, st, tr) and digraph teams (sh, ch, th, wh, ph).',
        topics: ['Beginning and ending consonant blends', 'Silent letter challenges (kn, wr, mb)', 'Digraph sound scavenger hunt in picture books']
      },
      {
        number: 3,
        title: 'Magic \'E\' & Long Vowel Teams',
        description: 'Watch silent \'E\' transform short vowel sounds into long musical vowels.',
        topics: ['The split vowel rule (a_e, i_e, o_e, u_e)', 'Vowel teams (ai/ay, ee/ea, oa/ow, oi/oy)', 'R-controlled vowels (ar, er, ir, or, ur)']
      },
      {
        number: 4,
        title: 'Story Theater & Expressive Alouds',
        description: 'Bring storybook characters to life with voice changes, emotion, and dramatic pauses.',
        topics: ['Punctuation cues: exclamations, questions, and dialogues', 'Character voice roleplay exercises', 'Retelling story plots with beginning, middle, and end']
      }
    ],
    capstoneProject: {
      title: 'Record an Interactive Audio Storybook',
      description: 'Choose an illustrated story, narrate it with character voices and sound effects, and publish it into your personal Kortex library.'
    }
  },
  {
    id: 'olympiad-prep',
    title: 'Olympiad Math & Logic Arena',
    tagline: 'Higher-order thinking skills (HOTS) & competitive problem solving',
    icon: '🏆',
    category: 'Olympiad & Logic',
    ageBand: 'Ages 8-11',
    gradeGroup: 'Grades 3 - 8',
    color: 'from-emerald-500 to-teal-700',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cardBg: 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400',
    description: 'Crack competitive mathematics with ease! Designed for students aspiring for IMO, Kangaroo Math, and school Olympiads, this program trains non-routine problem solving, pigeonhole principle, combinatorics, and rigorous analytical reasoning.',
    learningOutcomes: [
      'Master non-routine, multi-step problem solving beyond typical textbook curricula',
      'Apply advanced mathematical strategies: working backwards, invariant principles, and Pigeonhole principle',
      'Solve combinatorics, permutations, probability, and advanced number theory problems',
      'Develop exam composure, time management, and accuracy under competitive sprint conditions'
    ],
    prerequisites: 'Strong grasp of grade-level math operations.',
    format: 'Timed Competition Simulator • Step-by-Step Hint Engine • Leaderboards',
    estimatedWeeks: 8,
    modules: [
      {
        number: 1,
        title: 'Number Theory & Divisibility Mysteries',
        description: 'Explore prime factorizations, modular remainders, and smart divisibility rules.',
        topics: ['Divisibility rules for 7, 11, and 13', 'Finding units digits of huge powers', 'Highest Common Factor and Least Common Multiple word problems']
      },
      {
        number: 2,
        title: 'Combinatorics & The Art of Counting',
        description: 'Systematically count outcomes, arrangements, and pathways without missing any.',
        topics: ['Tree diagrams and fundamental counting principle', 'Arranging objects with constraints', 'Pigeonhole principle and guaranteed outcomes']
      },
      {
        number: 3,
        title: 'Non-Routine Geometry & Shaded Areas',
        description: 'Deconstruct complex overlapping figures, perimeter tricks, and angle deduction.',
        topics: ['Area dissection and subtraction methods', 'Angle chasing in overlapping polygons', 'Symmetry and transformation puzzles']
      },
      {
        number: 4,
        title: 'Olympiad Speed Strategy & Mock Drills',
        description: 'Techniques for smart elimination, back-substitution, and time management.',
        topics: ['Multiple-choice option elimination tactics', 'Avoiding intentional trick traps in questions', 'Full-length timed Olympiad mock exam with review']
      }
    ],
    capstoneProject: {
      title: 'All-India Kortex Mock Olympiad Invitational',
      description: 'Participate in a 30-question national-style timed Olympiad challenge covering arithmetic, combinatorics, geometry, and logic deduction.'
    }
  },
  {
    id: 'digital-art-design',
    title: 'Digital Art & Visual Design Thinking',
    tagline: 'Creative sketching, color psychology & digital storytelling',
    icon: '🎨',
    category: 'Communication & Arts',
    ageBand: 'Ages 8-11',
    gradeGroup: 'Grades 1 - 7',
    color: 'from-pink-500 to-rose-700',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    cardBg: 'bg-rose-50/50 border-rose-200 hover:border-rose-400',
    description: 'Unleash your inner creator! Learn the fundamentals of digital visual composition, color harmony, character sprite sketching, visual hierarchy, and 2D frame-by-frame animation to express ideas with impactful visual design.',
    learningOutcomes: [
      'Understand color harmony: warm vs. cool palettes, complementary contrasts, and mood creation',
      'Design original character figures using basic geometric shapes and dynamic silhouettes',
      'Master typography, layout balance, and poster composition principles',
      'Create 2D looping animated GIFs and digital storyboard sequences'
    ],
    prerequisites: 'No drawing background needed. Imagination is the only requirement!',
    format: 'Virtual Canvas • Layered Drawing Tools • Animation Flipbook',
    estimatedWeeks: 6,
    modules: [
      {
        number: 1,
        title: 'Shapes to Characters & Silhouettes',
        description: 'Turn circles, triangles, and squares into expressive heroes, monsters, and animals.',
        topics: ['Shape language: Round friendly vs. Angular sharp designs', 'Exaggerated expressions and facial proportions', 'Dynamic poses and silhouette clarity']
      },
      {
        number: 2,
        title: 'Color Wheels & Atmospheric Moods',
        description: 'Discover how colors evoke emotions and light creates 3D depth on flat screens.',
        topics: ['Complementary and analogous color harmonies', 'Light source direction, highlights, and drop shadows', 'Painting day vs. night mood variations']
      },
      {
        number: 3,
        title: 'Layout, Balance & Visual Hierarchy',
        description: 'Guide the viewer’s eye with focal points, rule of thirds, and clean typography.',
        topics: ['Rule of thirds and visual weight balance', 'Font pairing: choosing fonts that match the story mood', 'Creating an eye-catching educational poster']
      },
      {
        number: 4,
        title: '2D Animation & The 12 Principles',
        description: 'Animate drawings into motion with squash & stretch, keyframes, and timing.',
        topics: ['Bouncing ball physics with squash and stretch', 'Keyframes and in-between frames', 'Exporting looping sticker animations and GIFs']
      }
    ],
    capstoneProject: {
      title: 'Digital Story Poster & Animated Character Showcase',
      description: 'Create an illustrated poster for an imaginary movie or game, complete with an animated looping character badge.'
    }
  }
];

