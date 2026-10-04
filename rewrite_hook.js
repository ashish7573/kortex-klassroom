const fs = require('fs');

const code = `
import { useState, useEffect } from 'react';
import { getStudentAssignments } from '../app/actions/student';
import { auth } from '../backend_configurations/firebase';

export type AssignmentStatus = 'pending' | 'submitted' | 'graded';

export interface MergedAssignment {
  id: string;
  title: string;
  subject: string;
  status: AssignmentStatus;
  dueDate: string;
  link?: string; // tool_id
  toolType: string;
  submittedDate?: string;
  isOnTime?: boolean;
  score?: number | 'N/A';
  totalPoints?: number;
  grade?: string;
}

export function useStudentAssignments(studentUid: string) {
  const [assignments, setAssignments] = useState<MergedAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentUid) {
      setLoading(false);
      return;
    }

    async function loadAssignments() {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await getStudentAssignments(token);
        if (res.success && res.assignments) {
           setAssignments(res.assignments);
        }
      } catch (e) {
        console.error("Error loading assignments:", e);
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, [studentUid]);

  return { assignments, loading };
}
`;

fs.writeFileSync('hooks/useStudentAssignments.ts', code);
