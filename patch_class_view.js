const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/TeacherClassView.tsx', 'utf8');

const importsOld = `import { ArrowLeft, BarChart3, Users, BookOpen, AlertCircle } from 'lucide-react';
import { auth } from '../../backend_configurations/firebase';`;

const importsNew = `import { ArrowLeft, BarChart3, Users, BookOpen, AlertCircle, PlusCircle } from 'lucide-react';
import { auth } from '../../backend_configurations/firebase';
import AssignmentBuilderModal from './AssignmentBuilderModal';`;

code = code.replace(importsOld, importsNew);

const stateOld = `  const [error, setError] = useState<string | null>(null);`;
const stateNew = `  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);`;

code = code.replace(stateOld, stateNew);

const headerOld = `          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{combo.subjectStr} Classroom</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{combo.comboLabel}</p>
          </div>
        </div>
      </div>`;

const headerNew = `          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{combo.subjectStr} Classroom</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{combo.comboLabel}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          <PlusCircle size={18} /> Assign Homework
        </button>
      </div>`;

code = code.replace(headerOld, headerNew);

const endOld = `      )}
    </div>
  );
}`;

const endNew = `      )}
      
      {showAssignModal && (
        <AssignmentBuilderModal 
          combo={combo} 
          roster={roster} 
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
             setShowAssignModal(false);
             // Could refresh assignments list here
          }}
        />
      )}
    </div>
  );
}`;

code = code.replace(endOld, endNew);

fs.writeFileSync('kortex_users/teacher/TeacherClassView.tsx', code);
