import { SubjectMasteryCurriculum, ChapterDefinition, MilestoneDefinition } from './types';

// Vibrant, accessible palette for distinguishing chapters visually on the Y-Axis
const CHAPTER_PALETTE = [
  { color: '#10b981', badgeBg: 'bg-emerald-100/90', badgeText: 'text-emerald-800', borderColor: 'border-emerald-300', barGradient: 'from-emerald-400 to-teal-500' },
  { color: '#0ea5e9', badgeBg: 'bg-sky-100/90', badgeText: 'text-sky-800', borderColor: 'border-sky-300', barGradient: 'from-sky-400 to-blue-500' },
  { color: '#f59e0b', badgeBg: 'bg-amber-100/90', badgeText: 'text-amber-900', borderColor: 'border-amber-300', barGradient: 'from-amber-400 to-orange-500' },
  { color: '#8b5cf6', badgeBg: 'bg-purple-100/90', badgeText: 'text-purple-800', borderColor: 'border-purple-300', barGradient: 'from-purple-400 to-indigo-500' },
  { color: '#f43f5e', badgeBg: 'bg-rose-100/90', badgeText: 'text-rose-800', borderColor: 'border-rose-300', barGradient: 'from-rose-400 to-pink-500' },
  { color: '#06b6d4', badgeBg: 'bg-cyan-100/90', badgeText: 'text-cyan-800', borderColor: 'border-cyan-300', barGradient: 'from-cyan-400 to-blue-500' },
  { color: '#84cc16', badgeBg: 'bg-lime-100/90', badgeText: 'text-lime-800', borderColor: 'border-lime-300', barGradient: 'from-lime-400 to-emerald-500' },
  { color: '#ec4899', badgeBg: 'bg-pink-100/90', badgeText: 'text-pink-800', borderColor: 'border-pink-300', barGradient: 'from-pink-400 to-rose-500' },
  { color: '#6366f1', badgeBg: 'bg-indigo-100/90', badgeText: 'text-indigo-800', borderColor: 'border-indigo-300', barGradient: 'from-indigo-400 to-purple-500' }
];

/**
 * Identifies if a learning tool is a Chapter Assessment (Major Milestone).
 */
export function isChapterAssessmentTool(tool: any): boolean {
  if (!tool) return false;
  const aType = (tool.assessment_type || '').toLowerCase().trim();
  if (aType === 'chapter') return true;

  const subId = (tool.subtopic_id || tool.subtopicId || '').toLowerCase().trim();
  if (subId.includes('-major-quiz') || subId.includes('_major_quiz') || subId.endsWith('-major-quiz')) return true;

  const title = (tool.title || '').toLowerCase().trim();
  if (title.includes('chapter assessment') || title.includes('महा-मूल्यांकन') || title.includes('major milestone')) return true;

  return false;
}

/**
 * Identifies if a learning tool is a Subtopic Assessment (Checkpoint).
 */
export function isSubtopicAssessmentTool(tool: any): boolean {
  if (!tool) return false;
  if (isChapterAssessmentTool(tool)) return false;

  const aType = (tool.assessment_type || '').toLowerCase().trim();
  if (aType === 'subtopic') return true;

  const subId = (tool.subtopic_id || tool.subtopicId || '').toLowerCase().trim();
  if (/-sub\d+-quiz$/i.test(subId) || /_sub\d+_quiz$/i.test(subId)) return true;
  if (subId === 'flnhindiassessment') return true;

  const title = (tool.title || '').toLowerCase().trim();
  if (title.includes('subtopic assessment') || title.includes('checkpoint')) return true;

  return false;
}

/**
 * Returns a clean, friendly title for Chapter Major Assessment milestones.
 */
function getChapterAssessmentTitle(
  subjectName: string,
  chapterNumber: number,
  chapterName: string
): string {
  const cleanName = chapterName.replace(/^Ch\s*\d+:\s*/i, '').trim();
  const isHindi = subjectName.toLowerCase().includes('hindi');

  if (isHindi) {
    const hindiMap: Record<number, string> = {
      1: '🏆 संपूर्ण स्वर महा-मूल्यांकन',
      2: '🏆 संपूर्ण व्यंजन महा-मूल्यांकन',
      3: '🏆 अमात्रिक शब्द महा-मूल्यांकन',
      4: '🏆 संपूर्ण मात्रा महा-मूल्यांकन',
      5: '🏆 बारहखड़ी महा-मूल्यांकन',
      6: '🏆 संपूर्ण कहानियाँ महा-मूल्यांकन',
    };
    return hindiMap[chapterNumber] || `🏆 ${cleanName} महा-मूल्यांकन`;
  }

  // Maths & other subjects
  const mathsMap: Record<number, string> = {
    2: '🏆 Numbers Upto 20 Assessment',
    3: '🏆 Numbers Upto 99 Assessment',
    4: '🏆 Multiplication & Division Assessment'
  };
  return mathsMap[chapterNumber] || `🏆 ${cleanName} Assessment`;
}

/**
 * Builds a SubjectMasteryCurriculum dynamically from live Firestore learning_tools.
 * 
 * STRICT RULES:
 * 1. Each subtopic checkpoint maps directly to its designated Subtopic Assessment (fln-*-sub*-quiz).
 * 2. Each chapter assessment maps to a distinct Chapter Assessment milestone (fln-*-major-quiz).
 * 3. Chapters not ready for evaluation (e.g. Basic Operations Practice) are omitted.
 * 4. Milestone passing threshold is >= 90%.
 */
export function buildCurriculumFromTools(
  tools: any[],
  subjectName: string
): SubjectMasteryCurriculum | null {
  if (!tools || tools.length === 0) return null;

  // Group tools by chapter
  const chaptersMap: Record<string, {
    chapterNumber: number;
    chapterName: string;
    chapterTools: any[];
    subtopicsMap: Record<string, {
      subtopicName: string;
      subtopicOrder: number;
      tools: any[];
    }>;
  }> = {};

  tools.forEach(tool => {
    // Exact chapter name directly from the database
    const rawChapter = tool.chapter_name || tool.chapter;
    if (!rawChapter || typeof rawChapter !== 'string' || !rawChapter.trim()) return;
    const chapterName = rawChapter.trim();

    // Skip chapters explicitly not evaluated yet
    if (chapterName.toLowerCase().includes('basic operations practice')) return;

    // Exact subtopic name directly from the database
    const rawSubtopic = tool.subtopic || tool.subtopic_name;
    if (!rawSubtopic || typeof rawSubtopic !== 'string' || !rawSubtopic.trim()) return;
    const subtopicName = rawSubtopic.trim();

    // Exact chapter number & subtopic order from the database
    const chapterNumber = Number(tool.chapter_number) || 1;
    const subtopicOrder = Number(tool.subtopic_order) || 1;

    // Composite key ensures chapters with same number but different names stay distinct
    const chapKey = `${chapterNumber}:::${chapterName}`;
    if (!chaptersMap[chapKey]) {
      chaptersMap[chapKey] = {
        chapterNumber,
        chapterName,
        chapterTools: [],
        subtopicsMap: {}
      };
    }

    // Ignore empty placeholders
    const cType = (tool.content_type || tool.type || '').toLowerCase();
    if (cType === 'placeholder') return;

    chaptersMap[chapKey].chapterTools.push(tool);

    if (!chaptersMap[chapKey].subtopicsMap[subtopicName]) {
      chaptersMap[chapKey].subtopicsMap[subtopicName] = {
        subtopicName,
        subtopicOrder,
        tools: []
      };
    }

    chaptersMap[chapKey].subtopicsMap[subtopicName].tools.push(tool);
  });

  // Sort chapters by chapter_number ascending
  const sortedChapterKeys = Object.keys(chaptersMap).sort((a, b) => {
    const numA = chaptersMap[a].chapterNumber;
    const numB = chaptersMap[b].chapterNumber;
    if (numA !== numB) return numA - numB;
    return chaptersMap[a].chapterName.localeCompare(chaptersMap[b].chapterName);
  });

  if (sortedChapterKeys.length === 0) return null;

  let currentLevel = 0;
  const milestones: MilestoneDefinition[] = [];
  const chapters: ChapterDefinition[] = [];

  sortedChapterKeys.forEach((chapKey, chapIdx) => {
    const chapData = chaptersMap[chapKey];
    const palette = CHAPTER_PALETTE[chapIdx % CHAPTER_PALETTE.length];
    const chapterMilestoneLevels: number[] = [];

    // Find if chapter has a designated Chapter Assessment (Major Milestone)
    const chapAssessmentTool = chapData.chapterTools.find(isChapterAssessmentTool);

    // Sort subtopics by subtopic_order ascending
    const sortedSubtopics = Object.values(chapData.subtopicsMap).sort((a, b) => {
      if (a.subtopicOrder !== b.subtopicOrder) return a.subtopicOrder - b.subtopicOrder;
      return a.subtopicName.localeCompare(b.subtopicName);
    });

    // 1. Generate Subtopic Checkpoint Milestones
    sortedSubtopics.forEach((subData) => {
      currentLevel += 1;
      chapterMilestoneLevels.push(currentLevel);

      // Find specific subtopic assessment tool
      const subAssessment = subData.tools.find(isSubtopicAssessmentTool);
      // Fallback to another quiz in this subtopic (excluding chapter assessment)
      const otherQuiz = subData.tools.find(
        t => ((t.content_type || t.type || '').toLowerCase() === 'quiz') && !isChapterAssessmentTool(t)
      );

      const primaryAssessment = subAssessment || otherQuiz;
      const toolIds: string[] = [];

      if (primaryAssessment) {
        const subId = primaryAssessment.subtopic_id || primaryAssessment.subtopicId;
        if (subId && !toolIds.includes(subId)) toolIds.push(subId);
        if (primaryAssessment.id && !toolIds.includes(primaryAssessment.id)) toolIds.push(primaryAssessment.id);
        if (primaryAssessment.title && !toolIds.includes(primaryAssessment.title)) toolIds.push(primaryAssessment.title);
      } else {
        // Fallback for subtopics with games or conceptualiser tools
        subData.tools.forEach(t => {
          if (isChapterAssessmentTool(t)) return;
          if (t.id && !toolIds.includes(t.id)) toolIds.push(t.id);
          const subId = t.subtopic_id || t.subtopicId;
          if (subId && !toolIds.includes(subId)) toolIds.push(subId);
        });
      }

      const milestoneId = `milestone_ch${chapData.chapterNumber}_sub${subData.subtopicOrder}_lvl${currentLevel}`;
      if (!toolIds.includes(milestoneId)) toolIds.push(milestoneId);
      if (subData.subtopicName && !toolIds.includes(subData.subtopicName)) toolIds.push(subData.subtopicName);

      milestones.push({
        level: currentLevel,
        id: milestoneId,
        chapterNumber: chapData.chapterNumber,
        chapterName: chapData.chapterName,
        chapterColor: palette.color,
        subtopicOrder: subData.subtopicOrder,
        subtopicName: subData.subtopicName,
        isMajorMilestone: false,
        toolIds,
        thresholdScore: 90
      });
    });

    // 2. Generate Dedicated Chapter Assessment Milestone (if present)
    if (chapAssessmentTool) {
      currentLevel += 1;
      chapterMilestoneLevels.push(currentLevel);

      const majorToolIds: string[] = [];
      const majorSubId = chapAssessmentTool.subtopic_id || chapAssessmentTool.subtopicId;
      if (majorSubId && !majorToolIds.includes(majorSubId)) majorToolIds.push(majorSubId);
      if (chapAssessmentTool.id && !majorToolIds.includes(chapAssessmentTool.id)) majorToolIds.push(chapAssessmentTool.id);
      if (chapAssessmentTool.title && !majorToolIds.includes(chapAssessmentTool.title)) majorToolIds.push(chapAssessmentTool.title);

      const majorMilestoneId = `milestone_ch${chapData.chapterNumber}_major_lvl${currentLevel}`;
      if (!majorToolIds.includes(majorMilestoneId)) majorToolIds.push(majorMilestoneId);

      const majorTitle = getChapterAssessmentTitle(
        subjectName,
        chapData.chapterNumber,
        chapData.chapterName
      );

      milestones.push({
        level: currentLevel,
        id: majorMilestoneId,
        chapterNumber: chapData.chapterNumber,
        chapterName: chapData.chapterName,
        chapterColor: palette.color,
        subtopicOrder: sortedSubtopics.length + 1,
        subtopicName: majorTitle,
        isMajorMilestone: true,
        toolIds: majorToolIds,
        thresholdScore: 90
      });
    }

    chapters.push({
      chapterNumber: chapData.chapterNumber,
      chapterName: chapData.chapterName,
      color: palette.color,
      badgeBg: palette.badgeBg,
      badgeText: palette.badgeText,
      borderColor: palette.borderColor,
      barGradient: palette.barGradient,
      milestoneLevels: chapterMilestoneLevels
    });
  });

  return {
    subjectId: subjectName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    subjectName,
    totalLevels: currentLevel,
    chapters,
    milestones
  };
}

