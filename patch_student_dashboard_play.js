const fs = require('fs');
let code = fs.readFileSync('kortex_users/student/StudentDashboard.tsx', 'utf8');

const oldOpen = `                             <button className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors">
                               Open
                             </button>`;

const newOpen = `                             <button 
                               onClick={() => onExploreTier && onExploreTier(\`play_tool:\${task.link}\`)}
                               className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors"
                             >
                               Open
                             </button>`;

code = code.replace(oldOpen, newOpen);
fs.writeFileSync('kortex_users/student/StudentDashboard.tsx', code);
