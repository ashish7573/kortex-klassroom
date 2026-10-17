import { ClassStudentData } from '@/types/user';
import { 
  SubjectMasteryCurriculum, 
  StudentMasterySummary, 
  MilestoneDefinition, 
  MasterySortOption,
  MilestoneAttemptInfo 
} from './types';

/**
 * Normalizes tool key strings for flexible matching (dashes, underscores, lowercased)
 */
function normalizeKey(str: string): string {
  return (str || '').toLowerCase().replace(/[-_]/g, '').trim();
}

/**
 * Normalizes score to 0-100 percentage.
 * Milestone assessments compute finalScore as Math.round((correct / total) * 100).
 * Clamps valid values strictly between 0 and 100.
 */
function normalizeScore(score?: number): number {
  if (score === undefined || score === null || isNaN(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Evaluates student progress against curriculum milestones
 * Rule: Highest level milestone covered with score >= 90 is their current level.
 */
export function calculateStudentMastery(
  student: ClassStudentData,
  curriculum: SubjectMasteryCurriculum
): StudentMasterySummary {
  const completedTools = student.completedTools || {};
  const toolKeys = Object.keys(completedTools);
  const normalizedToolMap = new Map<string, { best_score?: number; times_completed?: number; last_played_at?: string; chapter_name?: string }>();

  for (const k of toolKeys) {
    normalizedToolMap.set(normalizeKey(k), completedTools[k]);
  }

  const milestoneAttempts: Record<number, MilestoneAttemptInfo> = {};
  let highestPassedLevel = 0;
  let highestPassedMilestone: MilestoneDefinition | null = null;
  let highestPassedScore = 0;

  for (const milestone of curriculum.milestones) {
    let matchedToolData: { best_score?: number; times_completed?: number; last_played_at?: string; chapter_name?: string } | null = null;
    let matchedId = '';

    for (const tId of milestone.toolIds) {
      const normTid = normalizeKey(tId);
      if (normalizedToolMap.has(normTid)) {
        matchedToolData = normalizedToolMap.get(normTid)!;
        matchedId = tId;
        break;
      }
    }

    if (matchedToolData) {
      const score = normalizeScore(matchedToolData.best_score);
      const passed = score >= milestone.thresholdScore;

      milestoneAttempts[milestone.level] = {
        level: milestone.level,
        score,
        passed,
        timesCompleted: matchedToolData.times_completed || 1,
        lastPlayedAt: matchedToolData.last_played_at,
        toolId: matchedId
      };

      if (passed && milestone.level > highestPassedLevel) {
        highestPassedLevel = milestone.level;
        highestPassedMilestone = milestone;
        highestPassedScore = score;
      }
    }
  }

  // Determine current chapter details based on achieved level
  let currentChapterNumber = 1;
  let currentChapterName = curriculum.chapters[0]?.chapterName || 'Chapter 1';
  let currentChapterColor = curriculum.chapters[0]?.color || '#10b981';
  let currentSubtopicName = 'Not Started';

  if (highestPassedMilestone) {
    currentChapterNumber = highestPassedMilestone.chapterNumber;
    currentChapterName = highestPassedMilestone.chapterName;
    currentChapterColor = highestPassedMilestone.chapterColor;
    currentSubtopicName = highestPassedMilestone.subtopicName;
  }

  // Check if student is struggling (attempted a milestone with score < 90 and not yet passed)
  const nextLevel = highestPassedLevel + 1;
  const nextAttempt = milestoneAttempts[nextLevel];

  // Detect any attempted milestone in the curriculum that remains unpassed (< 90%)
  const strugglingAttempts = Object.values(milestoneAttempts).filter(
    a => !a.passed && a.timesCompleted > 0
  );
  const hasStrugglingAttempt = strugglingAttempts.length > 0;

  // Determine which milestone to focus intervention on:
  // Priority: next sequential milestone if attempted and failed, else lowest struggling milestone level
  let targetMilestoneLevel = nextLevel;
  if (nextAttempt && !nextAttempt.passed && nextAttempt.timesCompleted > 0) {
    targetMilestoneLevel = nextLevel;
  } else if (strugglingAttempts.length > 0) {
    targetMilestoneLevel = Math.min(...strugglingAttempts.map(a => a.level));
  }

  const nextMilestone = curriculum.milestones.find(m => m.level === targetMilestoneLevel)
    || curriculum.milestones.find(m => m.level === nextLevel);
  const nextMilestoneName = nextMilestone ? nextMilestone.subtopicName : 'All Milestones Cleared';

  const percentageProgress = curriculum.totalLevels > 0 
    ? Math.round((highestPassedLevel / curriculum.totalLevels) * 100) 
    : 0;

  // Full mastery requires reaching the curriculum's total levels and having no unresolved struggling attempts
  const isMastered = curriculum.totalLevels > 0 
    && highestPassedLevel >= curriculum.totalLevels 
    && !hasStrugglingAttempt;

  return {
    uid: student.uid,
    fullName: student.fullName || student.name || 'Unknown Student',
    rollNo: student.rollNo ? String(student.rollNo) : '',
    kortexId: student.kortexId || '',
    avatar: student.avatar,
    currentLevel: highestPassedLevel,
    maxLevel: curriculum.totalLevels,
    percentageProgress,
    currentChapterNumber,
    currentChapterName,
    currentSubtopicName,
    currentChapterColor,
    lastPassedMilestoneTitle: highestPassedMilestone ? highestPassedMilestone.subtopicName : 'Not Started',
    lastMilestoneScore: highestPassedScore,
    isMastered,
    hasStrugglingAttempt,
    nextMilestoneName,
    milestoneAttempts
  };
}

/**
 * Sorts student mastery summaries based on chosen criteria
 */
export function sortStudentsByMastery(
  students: StudentMasterySummary[],
  sortBy: MasterySortOption
): StudentMasterySummary[] {
  const copy = [...students];

  switch (sortBy) {
    case 'level-asc':
      return copy.sort((a, b) => {
        if (a.currentLevel !== b.currentLevel) return a.currentLevel - b.currentLevel;
        return (a.fullName || '').localeCompare(b.fullName || '');
      });

    case 'level-desc':
      return copy.sort((a, b) => {
        if (a.currentLevel !== b.currentLevel) return b.currentLevel - a.currentLevel;
        return (a.fullName || '').localeCompare(b.fullName || '');
      });

    case 'roll':
      return copy.sort((a, b) => {
        const numA = parseInt(a.rollNo?.replace(/\D/g, '') || '', 10);
        const numB = parseInt(b.rollNo?.replace(/\D/g, '') || '', 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA !== numB) return numA - numB;
          return (a.fullName || '').localeCompare(b.fullName || '');
        }
        if (!isNaN(numA)) return -1;
        if (!isNaN(numB)) return 1;
        if (a.rollNo && b.rollNo) {
          const comp = (a.rollNo || '').localeCompare(b.rollNo || '');
          if (comp !== 0) return comp;
        }
        return (a.fullName || '').localeCompare(b.fullName || '');
      });

    case 'alpha':
    default:
      return copy.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  }
}

/**
 * Exports the Bar Graph Class Mastery Report to CSV format.
 * Exactly mirrors the bar graph: Student Name, Roll No, Current Level, Chapter, Current Topic, Next Milestone, Status, and Needs Support Alert.
 */
export function exportMasteryToCSV(
  students: StudentMasterySummary[],
  comboLabel: string,
  subjectName: string,
  metrics?: {
    avgLevel: string;
    masteryRate: string;
    masteredCount: number;
    strugglingCount: number;
    totalLevels: number;
  }
) {
  const escapeCSV = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const dateStr = new Date().toISOString().split('T')[0];

  const metaRows: string[] = [
    [
      escapeCSV('Class Mastery Overview Report'),
      escapeCSV(`Classroom: ${comboLabel || 'Classroom'}`),
      escapeCSV(`Subject: ${subjectName || 'Subject'}`),
      escapeCSV(`Date: ${dateStr}`)
    ].join(',')
  ];

  if (metrics) {
    metaRows.push(
      [
        escapeCSV(`Class Average Level: L${metrics.avgLevel} / ${metrics.totalLevels}`),
        escapeCSV(`Full Mastery Rate: ${metrics.masteryRate} (${metrics.masteredCount} of ${students.length})`),
        escapeCSV(`Needs Support: ${metrics.strugglingCount} (< 90% score)`),
        escapeCSV(`Total Students: ${students.length}`)
      ].join(',')
    );
  }
  metaRows.push(''); // Blank row separator

  const headers = [
    'Roll No',
    'Student Name',
    'Current Level',
    'Current Chapter',
    'Current Topic Reached',
    'Next Target Milestone',
    'Status',
    'Needs Support Alert'
  ];

  const rows = students.map(s => {
    let status = 'In Progress';
    if (s.isMastered) status = 'Mastered';
    else if (s.hasStrugglingAttempt) status = 'Needs Support';
    else if (s.currentLevel === 0) status = 'Not Started';

    const levelDisplay = s.currentLevel > 0 
      ? (s.isMastered ? `Level ${s.currentLevel} (🏆 Mastered)` : `Level ${s.currentLevel}`) 
      : 'Level 0 (Not Started)';

    return [
      escapeCSV(s.rollNo || '-'),
      escapeCSV(s.fullName),
      escapeCSV(levelDisplay),
      escapeCSV(s.currentChapterName),
      escapeCSV(s.lastPassedMilestoneTitle),
      escapeCSV(s.nextMilestoneName),
      escapeCSV(status),
      escapeCSV(s.hasStrugglingAttempt ? 'YES (<90% score)' : 'NO')
    ].join(',');
  });

  const csvContent = '\uFEFF' + [...metaRows, headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const cleanLabel = (comboLabel || 'Classroom').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanSubj = (subjectName || 'Subject').replace(/[^a-zA-Z0-9_-]/g, '_');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${cleanSubj}_Mastery_Report_${cleanLabel}_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

