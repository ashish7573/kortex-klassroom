export interface MilestoneDefinition {
  level: number;
  id: string;
  chapterNumber: number;
  chapterName: string;
  chapterColor: string;
  subtopicOrder: number;
  subtopicName: string;
  isMajorMilestone: boolean;
  toolIds: string[]; // Primary tool IDs / slugs that satisfy this milestone
  thresholdScore: number; // e.g. 90
}

export interface ChapterDefinition {
  chapterNumber: number;
  chapterName: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  barGradient: string;
  milestoneLevels: number[];
}

export interface SubjectMasteryCurriculum {
  subjectId: string;
  subjectName: string;
  totalLevels: number;
  chapters: ChapterDefinition[];
  milestones: MilestoneDefinition[];
}

export interface MilestoneAttemptInfo {
  level: number;
  score: number;
  passed: boolean;
  timesCompleted: number;
  lastPlayedAt?: string;
  toolId?: string;
}

export interface StudentMasterySummary {
  uid: string;
  fullName: string;
  rollNo: string;
  kortexId: string;
  avatar?: string;
  currentLevel: number;
  maxLevel: number;
  percentageProgress: number;
  currentChapterNumber: number;
  currentChapterName: string;
  currentSubtopicName: string;
  currentChapterColor: string;
  lastPassedMilestoneTitle: string;
  lastMilestoneScore: number;
  isMastered: boolean;
  hasStrugglingAttempt: boolean; // Attempted next milestone with score < 90%
  nextMilestoneName: string;
  milestoneAttempts: Record<number, MilestoneAttemptInfo>;
}

export type MasterySortOption = 'roll' | 'alpha' | 'level-asc' | 'level-desc';

