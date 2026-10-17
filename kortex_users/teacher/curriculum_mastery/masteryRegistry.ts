import { SubjectMasteryCurriculum } from './types';
import { FLN_HINDI_CURRICULUM } from './flnHindiCurriculum';
import { FLN_MATHS_CURRICULUM } from './flnMathsCurriculum';
import { FLN_ENGLISH_CURRICULUM } from './flnEnglishCurriculum';

/**
 * Returns the exact curriculum mastery map for the provided subject and grade combination.
 * If a subject has not yet been mapped, returns null so that the UI can show a dedicated
 * subject-specific placeholder rather than showing content from a different subject.
 */
export function getCurriculumForSubject(
  subjectStr?: string, 
  gradeStr?: string
): SubjectMasteryCurriculum | null {
  const s = (subjectStr || '').toLowerCase().trim();

  // 1. FLN Hindi & Core Hindi
  if (s.includes('hindi')) {
    return FLN_HINDI_CURRICULUM;
  }

  // 2. FLN Maths & Core Maths / Mathematics
  if (s.includes('math') || s.includes('mathematics')) {
    return FLN_MATHS_CURRICULUM;
  }

  // 3. FLN English & Core English
  if (s.includes('eng')) {
    return FLN_ENGLISH_CURRICULUM;
  }

  // Not mapped yet: return null to prevent cross-subject contamination
  return null;
}
