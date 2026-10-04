const fs = require('fs');
let code = fs.readFileSync('app/actions/student.ts', 'utf8');

const oldReturn = `          id: a.id,
          title: a.title || 'Untitled',
          subject: a.chapter_name === 'Unknown' ? (a.tool_type !== 'unknown' ? a.tool_type : 'Task') : (a.chapter_name || a.combo_id),
          status: status,
          dueDate: a.due_date,
          link: a.tool_id,
          toolType: a.tool_type,
          submittedDate: sub?.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : undefined,
          isOnTime: isOnTime,
          score: sub?.score,
          totalPoints: 100,
          grade: sub?.score === 'N/A' ? 'Completed' : (sub?.score ? sub.score + '/100' : '')
       };`;

const newReturn = `          id: a.id,
          title: a.title || 'Untitled',
          subject: a.chapter_name === 'Unknown' ? (a.tool_type !== 'unknown' ? a.tool_type : 'Task') : (a.chapter_name || a.combo_id),
          status: status,
          dueDate: a.due_date,
          link: a.tool_id,
          toolType: a.tool_type,
          submittedDate: sub?.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : undefined,
          isOnTime: isOnTime,
          score: sub?.score,
          totalPoints: 100,
          grade: sub?.score === 'N/A' ? 'Completed' : (sub?.score ? sub.score + '/100' : ''),
          instructions: a.instructions,
          externalLink: a.external_link
       };`;

code = code.replace(oldReturn, newReturn);
fs.writeFileSync('app/actions/student.ts', code);
