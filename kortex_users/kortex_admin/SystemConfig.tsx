"use client";
import React, { useState } from 'react';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../backend_configurations/firebase';
import { syncCurriculumTotals } from '../../app/actions/admin';
import { auth } from '../../backend_configurations/firebase';
import { DownloadCloud, UploadCloud, CheckCircle2, RefreshCw } from 'lucide-react';

export default function SystemConfig() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [syncPreview, setSyncPreview] = useState<{ toAdd: any[], toUpdate: any[] } | null>(null);

  const handleExportCSV = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'learning_tools'));
      let csvContent = "firebase_id,grade,subject,chapter_name,title,content_type,video_url,gameCode,quizCode\n";
      snap.docs.forEach(docSnap => {
        const d = docSnap.data();
        const row = [
          docSnap.id,
          d.grade || '',
          d.subject || '',
          d.chapter || d.chapter_name || '',
          d.title || d.toolTitle || '',
          d.content_type || d.type || '',
          d.video_url || '',
          d.gameCode || '',
          d.quizCode || ''
        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        csvContent += row + "\n";
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `kortex_database_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export database.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCSV(true);

    try {
      const liveSnap = await getDocs(collection(db, 'learning_tools'));
      const liveData = liveSnap.docs.reduce((acc: any, docSnap) => {
        acc[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        return acc;
      }, {});

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          // Simple CSV parse
          const rows = text.split('\n').filter(row => row.trim() !== '');
          const headers = rows[0].split(',').map(h => h.replace(/"/g, '').trim());
          
          const toUpdate = [];
          const toAdd = [];

          for (let i = 1; i < rows.length; i++) {
             // Basic regex for handling quotes
             const row = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));
             if (row.length < 2) continue;

             const item: any = {};
             headers.forEach((h, idx) => {
               if (row[idx] !== undefined) item[h] = row[idx];
             });

             if (item.firebase_id && liveData[item.firebase_id]) {
                const live = liveData[item.firebase_id];
                const needsUpdate = 
                  live.grade !== item.grade ||
                  live.subject !== item.subject ||
                  live.title !== item.title ||
                  live.content_type !== item.content_type ||
                  (live.chapter_name || live.chapter || '') !== item.chapter_name ||
                  (live.content_url || live.video_url || '') !== item.video_url ||
                  (live.gameCode || '') !== item.gameCode ||
                  (live.quizCode || '') !== item.quizCode;

                
                // Ensure correct database field names are written
                const mappedItem = {
                  ...item,
                  content_url: item.video_url,
                  chapter_name: item.chapter_name
                };
                delete mappedItem.video_url; // Use content_url universally

                if (needsUpdate) toUpdate.push(mappedItem);
             } else {
                const mappedItem = {
                  ...item,
                  content_url: item.video_url,
                  chapter_name: item.chapter_name
                };
                delete mappedItem.video_url;
                toAdd.push(mappedItem);
             }
  
          }
          
          if (toAdd.length === 0 && toUpdate.length === 0) {
             alert("No changes detected! The CSV perfectly matches the live database.");
             setSyncPreview(null);
          } else {
             setSyncPreview({ toAdd, toUpdate });
          }
        } catch (err: any) { 
          console.error(err); 
          alert("Error parsing CSV data layout."); 
        } finally { 
          setIsUploadingCSV(false);
          e.target.value = ''; 
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error("Failed to fetch baseline database:", err);
      setIsUploadingCSV(false);
      e.target.value = '';
    }
  };


  const handleSyncTotals = async () => {
     setIsLoading(true);
     try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await syncCurriculumTotals(token);
        if (res.success) {
           alert("Successfully synced curriculum totals for all Dashboards!");
        } else {
           alert(res.error);
        }
     } catch (e: any) {
        alert(e.message);
     } finally {
        setIsLoading(false);
     }
  };

  const handleConfirmSync = async () => {
     if (!syncPreview) return;
     setIsUploadingCSV(true);
     try {
        const batches = [];
        let currentBatch = writeBatch(db);
        let operationCount = 0;

        for (const item of syncPreview.toUpdate) {
           const { firebase_id, ...toolData } = item;
           const docRef = doc(db, 'learning_tools', firebase_id);
           currentBatch.set(docRef, { ...toolData, updated_at: new Date().toISOString() }, { merge: true });
           
           operationCount++;
           if (operationCount === 490) {
               batches.push(currentBatch);
               currentBatch = writeBatch(db);
               operationCount = 0;
           }
        }

        for (const item of syncPreview.toAdd) {
           const { firebase_id, ...toolData } = item;
           const docRef = doc(collection(db, 'learning_tools'));
           currentBatch.set(docRef, { ...toolData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
           
           operationCount++;
           if (operationCount === 490) {
               batches.push(currentBatch);
               currentBatch = writeBatch(db);
               operationCount = 0;
           }
        }

        if (operationCount > 0) batches.push(currentBatch);
        
        for (const batch of batches) {
           await batch.commit();
        }
        
        alert(`SYNC SUCCESSFUL! ✅\nSuccessfully added ${syncPreview.toAdd.length} resources and updated ${syncPreview.toUpdate.length} records.`);
        setSyncPreview(null);
     } catch (err) {
        console.error(err);
        alert("Firestore database sync error.");
     } finally {
        setIsUploadingCSV(false);
     }
  };

  return (
    <div className="w-full animate-fade-in">
       {syncPreview ? (
          <div className="space-y-6 w-full bg-white p-6 md:p-8 border-2 border-slate-200 rounded-3xl shadow-sm text-slate-800">
             <div>
                <h3 className="text-2xl font-black text-slate-900">Review Data Sync Request</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Carefully examine changes below before confirming deployment to Firestore production tables.</p>
             </div>

             <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                   <div className="w-2 h-2 bg-amber-500 rounded-full"></div> 1. Existing Items To Update ({syncPreview.toUpdate.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-slate-50">
                   <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100 font-sans font-bold text-slate-500 border-b border-slate-200 sticky top-0">
                         <tr>
                            <th className="p-3">Doc ID</th>
                            <th className="p-3">Grade/Subject</th>
                            <th className="p-3">Module Title</th>
                            <th className="p-3">Type</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                         {syncPreview.toUpdate.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-slate-400 font-sans font-medium">No updates found.</td></tr>
                         ) : (
                            syncPreview.toUpdate.map((item, idx) => (
                               <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                                  <td className="p-3 font-bold text-amber-600 truncate max-w-[100px]">{item.firebase_id}</td>
                                  <td className="p-3 font-sans text-slate-600 font-medium">{item.grade} • {item.subject}</td>
                                  <td className="p-3 font-sans font-bold text-slate-800">{item.title}</td>
                                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-200 font-sans font-bold text-[10px] uppercase text-slate-600">{item.content_type}</span></td>
                               </tr>
                            ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>

             <div className="space-y-2 pt-2">
                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> 2. New Items to Create ({syncPreview.toAdd.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-slate-50">
                   <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100 font-sans font-bold text-slate-500 border-b border-slate-200 sticky top-0">
                         <tr>
                            <th className="p-3">Grade/Subject</th>
                            <th className="p-3">Module Title</th>
                            <th className="p-3">Chapter</th>
                            <th className="p-3">Type</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                         {syncPreview.toAdd.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-slate-400 font-sans font-medium">No new additions detected.</td></tr>
                         ) : (
                            syncPreview.toAdd.map((item, idx) => (
                               <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                                  <td className="p-3 font-sans text-slate-600 font-medium">{item.grade} • {item.subject}</td>
                                  <td className="p-3 font-sans font-bold text-slate-800">{item.title}</td>
                                  <td className="p-3 font-sans text-slate-500">{item.chapter_name}</td>
                                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-200 font-sans font-bold text-[10px] uppercase text-slate-600">{item.content_type}</span></td>
                               </tr>
                            ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>

             <div className="flex gap-4 pt-4 border-t-2 border-slate-100">
                <button 
                   onClick={() => setSyncPreview(null)}
                   disabled={isUploadingCSV}
                   className="flex-1 py-3.5 border-2 border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                   Deny / Cancel
                </button>
                <button 
                   onClick={handleConfirmSync}
                   disabled={isUploadingCSV}
                   className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl border-b-4 border-indigo-900 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {isUploadingCSV ? 'Processing Commits...' : 'Confirm & Publish Changes'}
                </button>
             </div>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* 1. Export CSV */}
             <div className="bg-white border-4 border-slate-100 p-8 rounded-3xl text-center shadow-sm relative flex flex-col items-center justify-center text-slate-800">
                <DownloadCloud size={64} className="text-emerald-500 mb-6" />
                <h3 className="text-3xl font-black text-slate-800 mb-4">Export Master CSV</h3>
                <p className="text-slate-500 font-medium mb-6 text-sm">Download the entire database into a structured spreadsheet. Safely edit items locally, then sync them back to the app.</p>
                <button 
                   onClick={handleExportCSV} 
                   disabled={isLoading || isUploadingCSV} 
                   className="w-full py-4 rounded-xl font-bold text-lg border-b-4 bg-emerald-500 hover:bg-emerald-600 border-emerald-700 text-white active:scale-95 transition-all disabled:opacity-50 mt-auto"
                >
                    {isLoading ? 'Exporting Database...' : 'Download Database'}
                </button>
             </div>

             {/* 2. Sync CSV */}
             <div className="bg-white border-4 border-slate-100 p-8 rounded-3xl text-center shadow-sm relative flex flex-col items-center justify-center text-slate-800">
                <UploadCloud size={64} className="text-sky-500 mb-6" />
                <h3 className="text-3xl font-black text-slate-800 mb-4">Sync / Import CSV</h3>
                <p className="text-slate-500 font-medium mb-6 text-sm">Upload your edited CSV. Rows with a Firebase ID will update securely. Rows without an ID will be added as new tools.</p>
                <div className="relative w-full mt-auto">
                   <input type="file" accept=".csv" onChange={handleSyncDatabase} disabled={isUploadingCSV || isLoading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                   <button 
                      disabled={isUploadingCSV || isLoading} 
                      className="w-full py-4 rounded-xl font-bold text-lg border-b-4 bg-sky-500 hover:bg-sky-600 border-sky-700 text-white active:scale-95 transition-all disabled:opacity-50"
                   >
                       Select CSV to Sync
                   </button>
                </div>
             </div>

             {/* 3. Sync Dashboard Totals */}
             <div className="bg-white border-4 border-slate-100 p-8 rounded-3xl text-center shadow-sm relative flex flex-col items-center justify-center text-slate-800">
                <CheckCircle2 size={48} className="text-indigo-500 mb-4" />
                <h3 className="text-2xl font-black text-slate-800 mb-2">Sync Dashboard Totals</h3>
                <p className="text-slate-500 font-medium mb-6 text-sm">Force recalculate all progress percentages for Student & Parent Dashboards.</p>
                <button 
                   onClick={handleSyncTotals} 
                   disabled={isLoading || isUploadingCSV} 
                   className="w-full py-4 rounded-xl font-bold border-b-4 bg-indigo-500 hover:bg-indigo-600 border-indigo-700 text-white active:scale-95 transition-all disabled:opacity-50 mt-auto"
                >
                   {isLoading ? 'Syncing...' : 'Sync Totals'}
                </button>
             </div>
          </div>
       )}
    </div>
  );
}
