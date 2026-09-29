import React, { useState } from 'react';
import { OrgAdminProfile } from '../../../types/user';
import { Users, UserPlus, Link, AlertCircle, CheckCircle2, MoreVertical, RefreshCw } from 'lucide-react';

export default function StudentsParentsView({ profile }: { profile: OrgAdminProfile }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    grade: 'Grade 5',
    rollNumber: ''
  });

  const handleGenerateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Phase 4/5 backend integration to create student ID in firestore
    alert(`Mock: Generated Student ID for ${newStudent.name}`);
    setShowAddModal(false);
  };

  /**
   * ============================================================================
   * IMPORTANT RELATIONAL LOGIC: ORGANIZATION -> PARENT -> STUDENT
   * ============================================================================
   * 
   * 1. Organizations do NOT directly create Parent accounts or full Student accounts.
   * 2. The Organization creates a "Student ID" (a placeholder record mapped to this org).
   * 3. The Organization shares this Student ID with the Parent (e.g., via email or printout).
   * 4. The Parent downloads the app, creates their OWN independent Parent Account.
   * 5. The Parent goes to "Add Child" in their portal. They have two choices:
   *    a) Create a new independent child profile (Not linked to any school).
   *    b) Enter the Student ID provided by the school.
   * 6. If they enter the Student ID, the child profile is linked to BOTH the Parent and the Organization.
   * 
   * WHY THIS MATTERS:
   * A student ID belongs to the Student/Parent, NOT the Organization. If a student leaves 
   * the school, their account and progress data travels with them. The organization simply
   * revokes the link, rather than deleting the student.
   * ============================================================================
   */

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b-2 border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Students & Parents</h2>
          <p className="font-semibold text-slate-400 text-sm mt-1 max-w-2xl">
            Generate Student IDs to hand out to parents. Parents will use these IDs to link their child's account to your school.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <UserPlus size={18} /> Generate Student ID
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Student ID</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Student Name</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Parent Account</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Link Status</th>
                <th className="px-6 py-4 font-black uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              
              {/* Mock Row 1: Linked & Active */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-indigo-600 font-mono text-xs bg-indigo-50 px-2 py-1 rounded-md inline-block">STU-8829-X</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">Aarav Sharma</div>
                  <div className="font-semibold text-slate-400 text-xs">Grade 5</div>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-600">Vikram Sharma</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
                     <CheckCircle2 size={14} /> Linked & Active
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>

              {/* Mock Row 2: Pending Parent Link */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-indigo-600 font-mono text-xs bg-indigo-50 px-2 py-1 rounded-md inline-block">STU-1092-M</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">Priya Patel</div>
                  <div className="font-semibold text-slate-400 text-xs">Grade 6</div>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-400 italic">Awaiting Setup...</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
                     <AlertCircle size={14} /> Pending Parent Link
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>

              {/* Mock Row 3: Transferred */}
              <tr className="hover:bg-slate-50 transition-colors bg-slate-50/50">
                <td className="px-6 py-4 opacity-60">
                  <div className="font-bold text-slate-500 font-mono text-xs bg-slate-100 px-2 py-1 rounded-md inline-block">STU-5541-L</div>
                </td>
                <td className="px-6 py-4 opacity-60">
                  <div className="font-bold text-slate-800">Rohan Gupta</div>
                  <div className="font-semibold text-slate-400 text-xs">Grade 8</div>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-500 opacity-60">Meera Gupta</td>
                <td className="px-6 py-4 opacity-60">
                  <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
                     <RefreshCw size={14} /> Transferred Out
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Student ID Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
             <div className="bg-indigo-600 p-6 flex items-center gap-4 text-white">
               <div className="p-3 bg-white/20 rounded-xl"><UserPlus size={24} /></div>
               <div>
                 <h3 className="text-xl font-black">Generate Student ID</h3>
                 <p className="text-indigo-200 text-xs font-bold">To share with parents for linking</p>
               </div>
             </div>
             
             <form onSubmit={handleGenerateStudent} className="p-6 space-y-5">
               
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                  <Link size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-indigo-800 leading-relaxed">
                    You are generating a secure Student ID. This does not create an account. You must share this ID with the parent, who will use it to link their independent app account to your school.
                  </p>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Student Name</label>
                 <input required type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500" placeholder="e.g. Aarav Sharma" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Grade Level</label>
                   <select value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500">
                     <option value="Grade 4">Grade 4</option>
                     <option value="Grade 5">Grade 5</option>
                     <option value="Grade 6">Grade 6</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Roll Number</label>
                   <input type="text" value={newStudent.rollNumber} onChange={e => setNewStudent({...newStudent, rollNumber: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500" placeholder="Optional" />
                 </div>
               </div>

               <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                 <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all">Create ID</button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
