const fs = require('fs');
let code = fs.readFileSync('hooks/useStudentAssignments.ts', 'utf8');

const oldStatus = `const status: AssignmentStatus = sub?.status || 'pending';`;
const newStatus = `let status: AssignmentStatus = sub?.status || 'pending';
              const dueDateObj = new Date(a.due_date);
              
              // Virtual Grading: If submitted and deadline passed, it becomes graded automatically
              // unless it's a manual grading tool (PDF) that needs teacher input? 
              // Wait, auto-grading tools (quiz, game, video, conceptualiser) auto-transition.
              // Let's assume all auto-transition for now, or if score is present/'N/A'.
              if (status === 'submitted' && new Date() > dueDateObj) {
                  if (sub?.score !== undefined && sub?.score !== null) {
                      status = 'graded';
                  }
              }`;

code = code.replace(oldStatus, newStatus);
fs.writeFileSync('hooks/useStudentAssignments.ts', code);
