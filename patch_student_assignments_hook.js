const fs = require('fs');
let code = fs.readFileSync('hooks/useStudentAssignments.ts', 'utf8');

const oldInterface = `export interface MergedAssignment {
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
}`;

const newInterface = `export interface MergedAssignment {
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
}`;

code = code.replace(oldInterface, newInterface);
fs.writeFileSync('hooks/useStudentAssignments.ts', code);
