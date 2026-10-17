import { SubjectMasteryCurriculum } from './types';

export const FLN_ENGLISH_CURRICULUM: SubjectMasteryCurriculum = {
  subjectId: 'fln_english',
  subjectName: 'FLN English',
  totalLevels: 15,
  chapters: [
    {
      chapterNumber: 1,
      chapterName: 'Phonics & Alphabet (A-Z)',
      color: '#3b82f6',
      badgeBg: 'bg-blue-100/90',
      badgeText: 'text-blue-800',
      borderColor: 'border-blue-300',
      barGradient: 'from-blue-400 to-indigo-500',
      milestoneLevels: [1, 2, 3]
    },
    {
      chapterNumber: 2,
      chapterName: 'Sight Words & CVC Words',
      color: '#10b981',
      badgeBg: 'bg-emerald-100/90',
      badgeText: 'text-emerald-800',
      borderColor: 'border-emerald-300',
      barGradient: 'from-emerald-400 to-teal-500',
      milestoneLevels: [4, 5, 6, 7]
    },
    {
      chapterNumber: 3,
      chapterName: 'Blends & Digraphs',
      color: '#f59e0b',
      badgeBg: 'bg-amber-100/90',
      badgeText: 'text-amber-900',
      borderColor: 'border-amber-300',
      barGradient: 'from-amber-400 to-orange-500',
      milestoneLevels: [8, 9, 10]
    },
    {
      chapterNumber: 4,
      chapterName: 'Sentences & Grammar Basics',
      color: '#8b5cf6',
      badgeBg: 'bg-purple-100/90',
      badgeText: 'text-purple-800',
      borderColor: 'border-purple-300',
      barGradient: 'from-purple-400 to-indigo-500',
      milestoneLevels: [11, 12, 13]
    },
    {
      chapterNumber: 5,
      chapterName: 'Stories & Reading Fluency',
      color: '#f43f5e',
      badgeBg: 'bg-rose-100/90',
      badgeText: 'text-rose-800',
      borderColor: 'border-rose-300',
      barGradient: 'from-rose-400 to-pink-600',
      milestoneLevels: [14, 15]
    }
  ],
  milestones: [
    {
      level: 1,
      id: 'fln_eng_m1',
      chapterNumber: 1,
      chapterName: 'Phonics & Alphabet (A-Z)',
      chapterColor: '#3b82f6',
      subtopicOrder: 1,
      subtopicName: 'Letter Sounds A to M',
      isMajorMilestone: false,
      toolIds: ['phonics-a-m', 'alphabet-a-m'],
      thresholdScore: 90
    },
    {
      level: 2,
      id: 'fln_eng_m2',
      chapterNumber: 1,
      chapterName: 'Phonics & Alphabet (A-Z)',
      chapterColor: '#3b82f6',
      subtopicOrder: 2,
      subtopicName: 'Letter Sounds N to Z',
      isMajorMilestone: false,
      toolIds: ['phonics-n-z', 'alphabet-n-z'],
      thresholdScore: 90
    },
    {
      level: 3,
      id: 'fln_eng_m3',
      chapterNumber: 1,
      chapterName: 'Phonics & Alphabet (A-Z)',
      chapterColor: '#3b82f6',
      subtopicOrder: 3,
      subtopicName: '🏆 Phonics Master Assessment',
      isMajorMilestone: true,
      toolIds: ['phonics-master-quiz', 'alphabet-assessment'],
      thresholdScore: 90
    },
    {
      level: 4,
      id: 'fln_eng_m4',
      chapterNumber: 2,
      chapterName: 'Sight Words & CVC Words',
      chapterColor: '#10b981',
      subtopicOrder: 1,
      subtopicName: 'Short Vowels "a" & "e" CVC Words',
      isMajorMilestone: false,
      toolIds: ['cvc-words-ae', 'cvc-words-a'],
      thresholdScore: 90
    },
    {
      level: 5,
      id: 'fln_eng_m5',
      chapterNumber: 2,
      chapterName: 'Sight Words & CVC Words',
      chapterColor: '#10b981',
      subtopicOrder: 2,
      subtopicName: 'Short Vowels "i", "o", "u" CVC Words',
      isMajorMilestone: false,
      toolIds: ['cvc-words-iou'],
      thresholdScore: 90
    },
    {
      level: 6,
      id: 'fln_eng_m6',
      chapterNumber: 2,
      chapterName: 'Sight Words & CVC Words',
      chapterColor: '#10b981',
      subtopicOrder: 3,
      subtopicName: 'High Frequency Sight Words',
      isMajorMilestone: false,
      toolIds: ['sight-words-starter', 'sight-words-1'],
      thresholdScore: 90
    },
    {
      level: 7,
      id: 'fln_eng_m7',
      chapterNumber: 2,
      chapterName: 'Sight Words & CVC Words',
      chapterColor: '#10b981',
      subtopicOrder: 4,
      subtopicName: '🏆 CVC & Sight Words Assessment',
      isMajorMilestone: true,
      toolIds: ['cvc-sight-words-assessment'],
      thresholdScore: 90
    },
    {
      level: 8,
      id: 'fln_eng_m8',
      chapterNumber: 3,
      chapterName: 'Blends & Digraphs',
      chapterColor: '#f59e0b',
      subtopicOrder: 1,
      subtopicName: 'Initial Consonant Blends (bl, cl, fl, gr, tr)',
      isMajorMilestone: false,
      toolIds: ['consonant-blends-intro'],
      thresholdScore: 90
    },
    {
      level: 9,
      id: 'fln_eng_m9',
      chapterNumber: 3,
      chapterName: 'Blends & Digraphs',
      chapterColor: '#f59e0b',
      subtopicOrder: 2,
      subtopicName: 'Consonant Digraphs (sh, ch, th, wh)',
      isMajorMilestone: false,
      toolIds: ['consonant-digraphs-intro'],
      thresholdScore: 90
    },
    {
      level: 10,
      id: 'fln_eng_m10',
      chapterNumber: 3,
      chapterName: 'Blends & Digraphs',
      chapterColor: '#f59e0b',
      subtopicOrder: 3,
      subtopicName: '🏆 Blends & Digraphs Assessment',
      isMajorMilestone: true,
      toolIds: ['blends-digraphs-assessment'],
      thresholdScore: 90
    },
    {
      level: 11,
      id: 'fln_eng_m11',
      chapterNumber: 4,
      chapterName: 'Sentences & Grammar Basics',
      chapterColor: '#8b5cf6',
      subtopicOrder: 1,
      subtopicName: 'Nouns & Pronouns Basics',
      isMajorMilestone: false,
      toolIds: ['nouns-pronouns-intro'],
      thresholdScore: 90
    },
    {
      level: 12,
      id: 'fln_eng_m12',
      chapterNumber: 4,
      chapterName: 'Sentences & Grammar Basics',
      chapterColor: '#8b5cf6',
      subtopicOrder: 2,
      subtopicName: 'Action Verbs & Simple Sentences',
      isMajorMilestone: false,
      toolIds: ['verbs-simple-sentences'],
      thresholdScore: 90
    },
    {
      level: 13,
      id: 'fln_eng_m13',
      chapterNumber: 4,
      chapterName: 'Sentences & Grammar Basics',
      chapterColor: '#8b5cf6',
      subtopicOrder: 3,
      subtopicName: '🏆 Sentence Construction Assessment',
      isMajorMilestone: true,
      toolIds: ['sentence-construction-assessment'],
      thresholdScore: 90
    },
    {
      level: 14,
      id: 'fln_eng_m14',
      chapterNumber: 5,
      chapterName: 'Stories & Reading Fluency',
      chapterColor: '#f43f5e',
      subtopicOrder: 1,
      subtopicName: 'Short Decodable Fluency Stories',
      isMajorMilestone: false,
      toolIds: ['decodable-fluency-stories'],
      thresholdScore: 90
    },
    {
      level: 15,
      id: 'fln_eng_m15',
      chapterNumber: 5,
      chapterName: 'Stories & Reading Fluency',
      chapterColor: '#f43f5e',
      subtopicOrder: 2,
      subtopicName: '🌟 FLN English Grand Mastery Assessment',
      isMajorMilestone: true,
      toolIds: ['fln-english-grand-assessment'],
      thresholdScore: 90
    }
  ]
};

