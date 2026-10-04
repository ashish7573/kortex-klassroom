
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
  instructions?: string;
  externalLink?: string;
}

export function useStudentAssignments(studentUid: string) {
  const [assignments, setAssignments] = useState<MergedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [trigger, setTrigger] = useState(0);

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
        const res = await getStudentAssignments(token, studentUid);
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
  }, [studentUid, trigger]);

  const refreshAssignments = () => setTrigger(t => t + 1);

  return { assignments, loading, refreshAssignments };
}
