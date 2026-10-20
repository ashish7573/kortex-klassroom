import { StudentProfile } from '../../../types/user';
import { generateComboId } from './comboParsers';

export interface ComboSeatStatus {
  comboId: string;
  comboString: string;
  grade: string;
  section: string;
  subject: string;
  capacity: number;
  enrolledCount: number;
  remainingSeats: number;
  isFull: boolean;
  usagePercentage: number;
}

export interface OrgSeatMetrics {
  totalCapacity: number;
  totalConsumed: number;
  remainingCapacity: number;
  studentHeadcount: number;
  overallUsagePercentage: number;
  isAtCapacity: boolean;
  combos: ComboSeatStatus[];
}

/**
 * Computes live seat consumption metrics and per-combo seat allocations for an organization.
 */
export function computeOrgSeatMetrics(
  orgKortexId: string,
  orgUid: string,
  approvedComboStrings: string[],
  students: StudentProfile[],
  customQuota?: number
): OrgSeatMetrics {
  const combos: ComboSeatStatus[] = [];
  const comboMap = new Map<string, ComboSeatStatus>();

  // 1. Initialize all approved combos with standard 40-seat capacity
  (approvedComboStrings || []).forEach(str => {
    const comboId = generateComboId(orgKortexId, str);
    const parts = str.split('-');
    const grade = parts[0]?.trim() || '';
    const section = parts[1]?.trim() || '';
    const subject = parts.length > 2 ? parts[parts.length - 1].trim() : '';

    const item: ComboSeatStatus = {
      comboId,
      comboString: str,
      grade,
      section,
      subject,
      capacity: 40,
      enrolledCount: 0,
      remainingSeats: 40,
      isFull: false,
      usagePercentage: 0
    };
    combos.push(item);
    comboMap.set(comboId, item);
  });

  // 2. Count enrollments from all active/pending students in this org
  let totalConsumed = 0;
  (students || []).forEach(student => {
    const orgLink = student.org_links?.[orgUid];
    if (!orgLink) return;

    // Use explicit assigned combos, or fallback to default grade-section combos if legacy
    let assignedIds = orgLink.assigned_combos || [];
    if (assignedIds.length === 0) {
      const defaultPrefix = `${orgLink.grade || student.grade} - Section ${orgLink.section || student.section || 'A'}`;
      const defaultCombos = (approvedComboStrings || []).filter(c => c.startsWith(defaultPrefix));
      assignedIds = defaultCombos.map(c => generateComboId(orgKortexId, c));
    }

    assignedIds.forEach(cid => {
      const entry = comboMap.get(cid);
      if (entry) {
        entry.enrolledCount++;
        totalConsumed++;
      }
    });
  });

  // 3. Compute remaining seats and usage percentage per combo
  combos.forEach(c => {
    c.remainingSeats = Math.max(0, c.capacity - c.enrolledCount);
    c.isFull = c.enrolledCount >= c.capacity;
    c.usagePercentage = c.capacity > 0 ? Math.min(100, Math.round((c.enrolledCount / c.capacity) * 100)) : 0;
  });

  const totalCapacity = customQuota && customQuota > 0 ? customQuota : combos.length * 40;
  const remainingCapacity = Math.max(0, totalCapacity - totalConsumed);
  const overallUsagePercentage = totalCapacity > 0 ? Math.min(100, Math.round((totalConsumed / totalCapacity) * 100)) : 0;

  return {
    totalCapacity,
    totalConsumed,
    remainingCapacity,
    studentHeadcount: (students || []).length,
    overallUsagePercentage,
    isAtCapacity: overallUsagePercentage >= 95,
    combos
  };
}

