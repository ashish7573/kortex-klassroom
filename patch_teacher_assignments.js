const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher_assignments.ts', 'utf8');

// Update Payload
const oldPayload = `export interface CreateAssignmentPayload {
  orgId: string;
  comboId: string;
  toolId: string;
  toolType: string;
  chapterName: string;
  toolTitle: string;
  dueDate: string;
  assignedStudentIds: string[];
}`;

const newPayload = `export interface CreateAssignmentPayload {
  orgId: string;
  comboId: string;
  toolId: string;
  toolType: string;
  chapterName: string;
  toolTitle: string;
  dueDate: string;
  assignedStudentIds: string[];
  instructions?: string;
  externalLink?: string;
}`;
code = code.replace(oldPayload, newPayload);

// Update Database Write
const oldWrite = `       chapter_name: payload.chapterName || 'Unknown Chapter',
       title: payload.toolTitle || 'Untitled Task',
       due_date: payload.dueDate,
       assigned_to: payload.assignedStudentIds,
       created_at: new Date().toISOString(),
       status: 'active'
    };`;

const newWrite = `       chapter_name: payload.chapterName || 'Unknown Chapter',
       title: payload.toolTitle || 'Untitled Task',
       due_date: payload.dueDate,
       assigned_to: payload.assignedStudentIds,
       instructions: payload.instructions || '',
       external_link: payload.externalLink || '',
       created_at: new Date().toISOString(),
       status: 'active'
    };`;
code = code.replace(oldWrite, newWrite);

fs.writeFileSync('app/actions/teacher_assignments.ts', code);
