import { SubjectMasteryCurriculum } from './types';

export const FLN_MATHS_CURRICULUM: SubjectMasteryCurriculum = {
  subjectId: 'fln_maths',
  subjectName: 'FLN Maths',
  totalLevels: 11,
  chapters: [
    {
      chapterNumber: 2,
      chapterName: 'Ch 2: Beginning with Numbers',
      color: '#0ea5e9',
      badgeBg: 'bg-sky-100/90',
      badgeText: 'text-sky-800',
      borderColor: 'border-sky-300',
      barGradient: 'from-sky-400 to-blue-500',
      milestoneLevels: [1, 2, 3, 4, 5, 6]
    },
    {
      chapterNumber: 3,
      chapterName: 'Ch 3: Numbers Upto 99',
      color: '#10b981',
      badgeBg: 'bg-emerald-100/90',
      badgeText: 'text-emerald-800',
      borderColor: 'border-emerald-300',
      barGradient: 'from-emerald-400 to-teal-500',
      milestoneLevels: [7, 8, 9, 10]
    },
    {
      chapterNumber: 4,
      chapterName: 'Ch 4: Multiplication and Division',
      color: '#f59e0b',
      badgeBg: 'bg-amber-100/90',
      badgeText: 'text-amber-900',
      borderColor: 'border-amber-300',
      barGradient: 'from-amber-400 to-orange-500',
      milestoneLevels: [11]
    }
  ],
  milestones: [
    // ==========================================
    // CHAPTER 2: Beginning with Numbers
    // ==========================================
    {
      level: 1,
      id: 'milestone_ch2_sub1_lvl1',
      chapterNumber: 2,
      chapterName: 'Ch 2: Beginning with Numbers',
      chapterColor: '#0ea5e9',
      subtopicOrder: 1,
      subtopicName: 'Numbers 1 to 10',
      isMajorMilestone: false,
      toolIds: [
        'fln-math-ch2-sub1-quiz',
        '9RztETrVn9HFxtkGaGLu',
        'Numbers 1 to 10',
        'master-quiz-upto-ten'
      ],
      thresholdScore: 90
    },
    {
      level: 2,
      id: 'milestone_ch2_sub2_lvl2',
      chapterNumber: 2,
      chapterName: 'Ch 2: Beginning with Numbers',
      chapterColor: '#0ea5e9',
      subtopicOrder: 2,
      subtopicName: 'Addition Upto 10',
      isMajorMilestone: false,
      toolIds: [
        'fln-math-ch2-sub2-quiz',
        'leYTqq9O0fPC5jrKxMqP',
        'Addition Upto 10',
        'finger-count-quiz',
        'frog-jump-quiz'
      ],
      thresholdScore: 90
    },
    {
      level: 3,
      id: 'milestone_ch2_sub3_lvl3',
      chapterNumber: 2,
      chapterName: 'Ch 2: Beginning with Numbers',
      chapterColor: '#0ea5e9',
      subtopicOrder: 3,
      subtopicName: 'Subtraction Upto 10',
      isMajorMilestone: false,
      toolIds: [
        'fln-math-ch2-sub3-quiz',
        'jvAdSzj03z8cyvh9opTe',
        'Subtraction Upto 10',
        'word-problem-quiz'
      ],
      thresholdScore: 90
    },
    {
      level: 4,
      id: 'milestone_ch2_sub4_lvl4',
      chapterNumber: 2,
      chapterName: 'Ch 2: Beginning with Numbers',
      chapterColor: '#0ea5e9',
      subtopicOrder: 4,
      subtopicName: 'Counting Upto 20',
      isMajorMilestone: false,
      toolIds: [
        'fln-math-ch2-sub4-quiz',
        'P9nLvyvo6i49Z2PdQdlG',
        'Counting Upto 20',
        'apple-delivery-quiz'
      ],
      thresholdScore: 90
    },
    {
      level: 5,
      id: 'milestone_ch2_sub5_lvl5',
      chapterNumber: 2,
      chapterName: 'Ch 2: Beginning with Numbers',
      chapterColor: '#0ea5e9',
      subtopicOrder: 5,
      subtopicName: 'Addition Subtraction Upto 20',
      isMajorMilestone: false,
      toolIds: [
        'fln-math-ch2-sub5-quiz',
        '5qzIcUso6kj7nvPoOGby',
        'Addition Subtraction Upto 20'
      ],
      thresholdScore: 90
    },
    {
      level: 6,
      id: 'milestone_ch2_major_lvl6',
      chapterNumber: 2,
      chapterName: 'Ch 2: Beginning with Numbers',
      chapterColor: '#0ea5e9',
      subtopicOrder: 6,
      subtopicName: '🏆 Numbers Upto 20 Assessment',
      isMajorMilestone: true,
      toolIds: [
        'fln-math-ch2-major-quiz',
        '6j5yWmtVlDyPqiAjQyFG',
        'Chapter Assessment (Milestone)'
      ],
      thresholdScore: 90
    },

    // ==========================================
    // CHAPTER 3: Numbers Upto 99
    // ==========================================
    {
      level: 7,
      id: 'milestone_ch3_sub1_lvl7',
      chapterNumber: 3,
      chapterName: 'Ch 3: Numbers Upto 99',
      chapterColor: '#10b981',
      subtopicOrder: 1,
      subtopicName: '1-100',
      isMajorMilestone: false,
      toolIds: [
        'fln-math-ch3-sub1-quiz',
        'FM5i8pF2jRYL1mC1EfA3',
        '1-100',
        'master-quiz-upto-hundred'
      ],
      thresholdScore: 90
    },
    {
      level: 8,
      id: 'milestone_ch3_sub2_lvl8',
      chapterNumber: 3,
      chapterName: 'Ch 3: Numbers Upto 99',
      chapterColor: '#10b981',
      subtopicOrder: 2,
      subtopicName: 'Addition Upto 100',
      isMajorMilestone: false,
      toolIds: [
        'fln-math-ch3-sub2-quiz',
        'hDCzJ1hG9hC0xIpU8LVk',
        'Addition Upto 100',
        'CPA-Addition-Quiz',
        'fln-blocks-quiz'
      ],
      thresholdScore: 90
    },
    {
      level: 9,
      id: 'milestone_ch3_sub3_lvl9',
      chapterNumber: 3,
      chapterName: 'Ch 3: Numbers Upto 99',
      chapterColor: '#10b981',
      subtopicOrder: 3,
      subtopicName: 'Subtraction Upto 100',
      isMajorMilestone: false,
      toolIds: [
        'fln-math-ch3-sub3-quiz',
        'ZHWk2bFUAPWWDx719V1p',
        'Subtraction Upto 100',
        'basic-operations-crossword'
      ],
      thresholdScore: 90
    },
    {
      level: 10,
      id: 'milestone_ch3_major_lvl10',
      chapterNumber: 3,
      chapterName: 'Ch 3: Numbers Upto 99',
      chapterColor: '#10b981',
      subtopicOrder: 4,
      subtopicName: '🏆 Numbers Upto 99 Assessment',
      isMajorMilestone: true,
      toolIds: [
        'fln-math-ch3-major-quiz',
        'TVhDgpyRXGJtxDPU5cwk',
        'Chapter Assessment (Milestone)'
      ],
      thresholdScore: 90
    },

    // ==========================================
    // CHAPTER 4: Multiplication and Division
    // ==========================================
    {
      level: 11,
      id: 'milestone_ch4_sub1_lvl11',
      chapterNumber: 4,
      chapterName: 'Ch 4: Multiplication and Division',
      chapterColor: '#f59e0b',
      subtopicOrder: 1,
      subtopicName: 'Multiplication',
      isMajorMilestone: false,
      toolIds: [
        'fln-math-ch4-sub1-quiz',
        'vpF3VCMFkbFLr4a62xqy',
        'Multiplication',
        'multiply-practice',
        'rapid-fire'
      ],
      thresholdScore: 90
    }
  ]
};
