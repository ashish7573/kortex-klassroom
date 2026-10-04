const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/TeacherClassView.tsx', 'utf8');

// Update Interface
const oldInterface = `interface TeacherClassViewProps {
  profile: TeacherProfile;
  combo: TeacherComboData;
  onBack: () => void;
}`;

const newInterface = `interface TeacherClassViewProps {
  profile: TeacherProfile;
  combo: TeacherComboData;
  onBack: () => void;
  onExploreTier?: (tierId: string) => void;
}`;
code = code.replace(oldInterface, newInterface);

// Update Component signature
code = code.replace(
  `export default function TeacherClassView({ profile, combo, onBack }: TeacherClassViewProps) {`,
  `export default function TeacherClassView({ profile, combo, onBack, onExploreTier }: TeacherClassViewProps) {`
);

// Add PlayCircle icon import
code = code.replace(
  `import { ArrowLeft, BarChart3, Users, BookOpen, AlertCircle, PlusCircle } from 'lucide-react';`,
  `import { ArrowLeft, BarChart3, Users, BookOpen, AlertCircle, PlusCircle, PlayCircle } from 'lucide-react';`
);

// Update Header to add the button
const oldHeaderRight = `        <button 
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          <PlusCircle size={18} /> Assign Homework
        </button>
      </div>`;

const newHeaderRight = `        <div className="flex items-center gap-3">
          <button 
            onClick={() => onExploreTier && onExploreTier('lessons:' + combo.comboLabel)}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 border-2 border-sky-100 font-bold rounded-xl transition-all active:scale-95"
          >
            <PlayCircle size={18} /> Start Learning
          </button>
          <button 
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <PlusCircle size={18} /> Assign Homework
          </button>
        </div>
      </div>`;
code = code.replace(oldHeaderRight, newHeaderRight);

fs.writeFileSync('kortex_users/teacher/TeacherClassView.tsx', code);
