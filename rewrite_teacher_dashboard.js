const fs = require('fs');

const code = `
"use client";
import React, { useEffect, useState } from 'react';
import { TeacherProfile } from '../../types/user';
import { BookOpen, Users, BarChart3, PlusCircle, CheckCircle2, Award, ChevronRight } from 'lucide-react';
import { getTeacherDashboardData, TeacherComboData } from '../../app/actions/teacher';
import { auth } from '../../backend_configurations/firebase';

interface TeacherDashboardProps {
  profile: TeacherProfile;
  onAssignLesson?: () => void;
  onComboSelect?: (combo: TeacherComboData) => void;
}

export default function TeacherDashboard({ profile, onAssignLesson, onComboSelect }: TeacherDashboardProps) {
  const [combos, setCombos] = useState<TeacherComboData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) throw new Error("Not authenticated");
        
        const token = await user.getIdToken();
        const res = await getTeacherDashboardData(token);
        
        if (!res.success) throw new Error(res.error);
        setCombos(res.combos || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getSubjectColor = (subjectName: string) => {
    const s = subjectName.toLowerCase();
    if (s.includes('math')) return 'bg-rose-50 text-rose-900 border-rose-200';
    if (s.includes('eng')) return 'bg-sky-50 text-sky-900 border-sky-200';
    if (s.includes('hindi')) return 'bg-amber-50 text-amber-900 border-amber-200';
    if (s.includes('sci')) return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    return 'bg-indigo-50 text-indigo-900 border-indigo-200';
  };

  const getProgressColor = (subjectName: string) => {
    const s = subjectName.toLowerCase();
    if (s.includes('math')) return 'bg-rose-500';
    if (s.includes('eng')) return 'bg-sky-500';
    if (s.includes('hindi')) return 'bg-amber-500';
    if (s.includes('sci')) return 'bg-emerald-500';
    return 'bg-indigo-500';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Award size={14} className="text-emerald-200" /> Educator Console
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Welcome, {profile.full_name}!</h1>
          <p className="text-emerald-100 text-base max-w-xl font-medium">
            Organization: {profile.org_id}
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      <div>
        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <BookOpen className="text-sky-500" size={24} /> My Classrooms
        </h2>
        
        {loading ? (
           <div className="py-20 text-center text-slate-400 font-bold animate-pulse">Loading your classrooms...</div>
        ) : error ? (
           <div className="py-10 text-center text-rose-500 font-bold bg-rose-50 rounded-2xl border border-rose-200">{error}</div>
        ) : combos.length === 0 ? (
           <div className="py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
              <Users className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-xl font-black text-slate-700 mb-2">No Classes Assigned</h3>
              <p className="text-slate-500 font-semibold max-w-sm mx-auto">Your Organization Administrator needs to assign you subject combinations before you can manage classrooms.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {combos.map((combo) => {
                const colorClasses = getSubjectColor(combo.subjectStr);
                const progressColor = getProgressColor(combo.subjectStr);
                const progressPct = combo.totalCurriculumTools > 0 
                    ? Math.min(100, Math.round((combo.totalToolsAssigned / combo.totalCurriculumTools) * 100)) 
                    : 0;

                return (
                  <div 
                    key={combo.comboId}
                    onClick={() => onComboSelect && onComboSelect(combo)}
                    className={\`border-2 rounded-3xl p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between \${colorClasses}\`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">{combo.subjectStr}</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white/50 px-2 py-0.5 rounded-md inline-block mt-1">
                          {combo.gradeStr}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-sm shrink-0">
                        <Users size={24} className="opacity-80" />
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-white/40 p-4 rounded-xl backdrop-blur-sm">
                       <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider opacity-75 mb-2">
                         <span>Syllabus Progress</span>
                         <span>{progressPct}% Completed</span>
                       </div>
                       <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden">
                          <div className={\`h-full rounded-full transition-all duration-1000 \${progressColor}\`} style={{ width: \`\${progressPct}%\` }}></div>
                       </div>
                       <div className="mt-2 text-[10px] font-bold opacity-60 text-right">
                          {combo.totalToolsAssigned} / {combo.totalCurriculumTools} Tools Taught
                       </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                       <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider opacity-80 hover:opacity-100 transition-opacity">
                         Enter Classroom <ChevronRight size={14} />
                       </span>
                    </div>
                  </div>
                );
             })}
           </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('kortex_users/teacher/TeacherDashboard.tsx', code);
