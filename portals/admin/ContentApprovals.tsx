"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { CheckCircle, Plus, Edit3, Trash2, Clock, XCircle } from 'lucide-react';

export default function ContentApprovals() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchRequests() {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'content_requests'), orderBy('created_at', 'desc'));
        const querySnapshot = await getDocs(q);
        const allReqs = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
              } as { 
                id: string; status: string; [key: string]: any; 
              }));
        setPendingRequests(allReqs.filter(req => req.status === 'pending'));
        setRequestHistory(allReqs.filter(req => req.status !== 'pending'));
      } catch (error: any) { console.error("🚨 FIREBASE ADMIN FETCH ERROR:", error); } 
      finally { setIsLoading(false); }
    }
    fetchRequests();
  }, []);

  const handleRequestAction = async (request: any, actionStatus: string) => {
    const isApproved = actionStatus === 'APPROVED';
    if (!window.confirm(`Are you sure you want to ${isApproved ? 'APPROVE' : 'REJECT'} this request?`)) return;
    
    try {
      const adminEmail = auth.currentUser?.email || 'Admin';
      const requestRef = doc(db, 'content_requests', request.id);
      
      const getMatchedDoc = async (g: string, s: string, c: string) => {
         const snap = await getDocs(collection(db, 'learning_tools'));
         return snap.docs.find(d => {
            const data = d.data();
            const dGrade = data.grade?.toLowerCase().trim() || '';
            const dSubj = data.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : (data.subject?.toLowerCase().trim() || '');
            const dChap = data.chapter?.toLowerCase().trim() || '';
            const fGrade = g?.toLowerCase().trim() || '';
            const fSubj = s?.toLowerCase().trim() === 'mathematics' ? 'maths' : (s?.toLowerCase().trim() || '');
            const fChap = c?.toLowerCase().trim() || '';
            return dGrade === fGrade && dSubj === fSubj && dChap === fChap;
         });
      };

      if (isApproved) {
         if (request.action_type === 'FULL_TIER_ADD') {
            const newDocRef = doc(collection(db, 'learning_tools'));
            await setDoc(newDocRef, {
               ...request.payload.tool,
               created_at: new Date().toISOString(),
               updated_at: new Date().toISOString()
            });
         } else if (request.action_type === 'FULL_TIER_EDIT') {
            const matchedDoc = await getMatchedDoc(request.originalData.grade, request.originalData.subject, request.originalData.chapter);
            if (!matchedDoc) throw new Error("Could not find the original document to edit.");
            await setDoc(doc(db, 'learning_tools', matchedDoc.id), {
               ...request.payload.tool,
               updated_at: new Date().toISOString()
            }, { merge: true });
         } else if (request.action_type === 'FULL_TIER_REMOVE') {
            const matchedDoc = await getMatchedDoc(request.originalData.grade, request.originalData.subject, request.originalData.chapter);
            if (!matchedDoc) throw new Error("Could not find the original document to remove.");
            await deleteDoc(doc(db, 'learning_tools', matchedDoc.id));
         }
      }
      
      await setDoc(requestRef, { status: actionStatus, reviewed_by: adminEmail, reviewed_at: new Date().toISOString() }, { merge: true });
      
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      setRequestHistory(prev => [{...request, status: actionStatus}, ...prev]);
      alert(`Request ${actionStatus} successfully!`);
    } catch (error: any) {
      console.error(error);
      alert(`Error processing request: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
         <div>
            <h3 className="text-2xl font-black text-slate-800">Curriculum Approval Queue</h3>
            <p className="text-slate-500 font-medium mt-1">Review changes submitted by your Krew members before they go live.</p>
         </div>
      </div>
      {isLoading ? (
         <div className="py-20 text-center text-indigo-500 font-bold animate-pulse">Loading secure database...</div>
      ) : pendingRequests.length === 0 ? (
         <div className="bg-white border-2 border-slate-100 p-16 rounded-3xl text-center shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle size={40} className="text-emerald-500"/>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">All Caught Up!</h3>
            <p className="text-slate-500 font-medium">There are no pending curriculum requests from the Krew.</p>
         </div>
      ) : (
         <div className="space-y-4">
            {pendingRequests.map((req: any) => {
               const isAdd = req.action_type === 'FULL_TIER_ADD';
               const isEdit = req.action_type === 'FULL_TIER_EDIT' || req.action_type === 'EDIT';
               return (
                  <div key={req.id} className="bg-white border-2 border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:border-indigo-300 transition-colors">
                     <div className="flex gap-6 items-start w-full md:w-auto">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isAdd ? 'bg-emerald-100 text-emerald-600' : isEdit ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                           {isAdd ? <Plus size={28} /> : isEdit ? <Edit3 size={28}/> : <Trash2 size={28} />}
                        </div>
                        <div className="w-full">
                           <div className="flex items-center gap-3 mb-2">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-100 text-slate-600`}>{req.target_type}</span>
                              <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> {new Date(req.created_at).toLocaleDateString()}</span>
                           </div>
                           <h4 className="text-xl font-bold text-slate-800 leading-tight mb-1">
                              <span className={isAdd ? 'text-emerald-600' : isEdit ? 'text-amber-600' : 'text-rose-600'}>{isEdit ? 'Edit:' : isAdd ? 'Add:' : 'Remove:'}</span> {isEdit ? (req.action_type === 'EDIT' ? `'${req.payload?.oldTitle}' → '${req.payload?.newTitle}'` : `'${req.originalData?.toolTitle}' → '${req.payload?.title}'`) : (req.payload?.title || 'Unknown Item')}
                           </h4>
                           <p className="text-sm font-bold text-slate-500">Requested by: <span className="text-indigo-600">{req.krew_member_email}</span></p>
                           
                           {(isAdd || isEdit) && req.payload?.tool?.gameCode && (
                               <div className="mt-4 w-full bg-slate-900 rounded-xl p-4 relative border-l-4 border-amber-500">
                                  <div className="absolute top-0 right-0 bg-slate-700 text-slate-300 text-[10px] uppercase font-bold px-2 py-1 rounded-bl-xl rounded-tr-xl">Raw Code Block</div>
                                  <pre className="text-emerald-400 text-xs font-mono overflow-x-auto max-h-32 mt-2">{req.payload.tool.gameCode}</pre>
                                  <p className="text-amber-400 text-[10px] mt-2 font-bold uppercase tracking-wider">⚠️ Copy this into GameRegistry.tsx before approving.</p>
                               </div>
                           )}
                        </div>
                     </div>
                     <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t-2 border-slate-100 md:border-t-0">
                        <button onClick={() => handleRequestAction(req, 'REJECTED')} className="flex-1 md:flex-none bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"><XCircle size={18}/> Reject</button>
                        <button onClick={() => handleRequestAction(req, 'APPROVED')} className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm border-b-4 border-emerald-700 active:border-b-0 transition-all flex items-center justify-center gap-2"><CheckCircle size={18}/> Approve</button>
                     </div>
                  </div>
               )
            })}
         </div>
      )}
    </div>
  );
}
