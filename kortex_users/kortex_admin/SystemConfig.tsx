"use client";
import React, { useState } from 'react';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../backend_configurations/firebase';
import { syncCurriculumTotals } from '../../app/actions/admin';
import { auth } from '../../backend_configurations/firebase';
import { DownloadCloud, UploadCloud, CheckCircle2, RefreshCw } from 'lucide-react';

const EXPECTED_HEADERS = [
  "Grade", "Subject", "Chapter Number", "Chapter Name", "Subtopic Order", "Subtopic", 
  "Content Order", "Content Type", "Title", "Image URL", "Content URL", "Premium", 
  "Book", "Featured", "Subtopic ID", "Firebase ID"
];

export default function SystemConfig() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [syncPreview, setSyncPreview] = useState<any[] | null>(null);

  const handleExportCSV = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'learning_tools'));
      let csvContent = EXPECTED_HEADERS.join(',') + "\n";
      
      snap.docs.forEach(docSnap => {
        const d = docSnap.data();
        const row = [
          d.grade || '',
          d.subject || '',
          d.chapter_number !== undefined ? d.chapter_number : '',
          d.chapter_name || d.chapter || '',
          d.subtopic_order !== undefined ? d.subtopic_order : '',
          d.subtopic || '',
          d.content_order !== undefined ? d.content_order : (d.orderIndex !== undefined ? d.orderIndex : ''),
          d.content_type || d.type || '',
          d.title || d.toolTitle || '',
          d.image_url || d.image || d.imageUrl || '',
          d.content_url || d.video_url || d.pdfUrl || d.url || d.fileUrl || d.file_url || d.link || '',
          d.isPremium === true ? 'TRUE' : 'FALSE',
          d.book || 'Kortex Klassroom',
          d.is_featured === true ? 'TRUE' : 'FALSE',
          d.subtopic_id || '',
          docSnap.id
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
          const rows = text.split('\n').filter(row => row.trim() !== '');
          const rawHeaders = rows[0].split(',').map(h => h.replace(/"/g, '').trim());
          
          const headerIndices: Record<string, number> = {};
          rawHeaders.forEach((h, idx) => {
              if (EXPECTED_HEADERS.includes(h)) {
                  headerIndices[h] = idx;
              }
          });

          const missingHeaders = EXPECTED_HEADERS.filter(h => headerIndices[h] === undefined);
          if (missingHeaders.length > 0) {
              alert("CSV is missing required columns: " + missingHeaders.join(", "));
              return;
          }
          
          const previewRows: any[] = [];

          for (let i = 1; i < rows.length; i++) {
             const row = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));
             if (row.length < 2) continue; // Skip empty trailing rows

             const csvData: any = {};
             EXPECTED_HEADERS.forEach(h => {
                 csvData[h] = row[headerIndices[h]] !== undefined ? row[headerIndices[h]].trim() : '';
             });

             const firebaseId = csvData['Firebase ID'];

             if (firebaseId && liveData[firebaseId]) {
                const live = liveData[firebaseId];
                
                const liveExportedValue = (col: string) => {
                    if (col === 'Grade') return live.grade || '';
                    if (col === 'Subject') return live.subject || '';
                    if (col === 'Chapter Number') return live.chapter_number !== undefined ? String(live.chapter_number) : '';
                    if (col === 'Chapter Name') return live.chapter_name || live.chapter || '';
                    if (col === 'Subtopic Order') return live.subtopic_order !== undefined ? String(live.subtopic_order) : '';
                    if (col === 'Subtopic') return live.subtopic || '';
                    if (col === 'Content Order') return live.content_order !== undefined ? String(live.content_order) : (live.orderIndex !== undefined ? String(live.orderIndex) : '');
                    if (col === 'Content Type') return live.content_type || live.type || '';
                    if (col === 'Title') return live.title || live.toolTitle || '';
                    if (col === 'Image URL') return live.image_url || live.image || live.imageUrl || '';
                    if (col === 'Content URL') return live.content_url || live.video_url || live.pdfUrl || live.url || live.fileUrl || live.file_url || live.link || '';
                    if (col === 'Premium') return live.isPremium === true ? 'TRUE' : 'FALSE';
                    if (col === 'Book') return live.book || 'Kortex Klassroom';
                    if (col === 'Featured') return live.is_featured === true ? 'TRUE' : 'FALSE';
                    if (col === 'Subtopic ID') return live.subtopic_id || '';
                    return '';
                };

                const changedFields: string[] = [];
                EXPECTED_HEADERS.forEach(h => {
                   if (h === 'Firebase ID') return;
                   if (String(liveExportedValue(h)).trim() !== String(csvData[h]).trim()) {
                       changedFields.push(h);
                   }
                });

                if (changedFields.length > 0) {
                    previewRows.push({ data: csvData, originalCsvData: csvData, status: 'UPDATED', changedFields });
                } else {
                    previewRows.push({ data: csvData, originalCsvData: csvData, status: 'UNCHANGED', changedFields: [] });
                }
             } else {
                // NEW
                previewRows.push({ data: csvData, originalCsvData: csvData, status: 'NEW', changedFields: EXPECTED_HEADERS.filter(h => h !== 'Firebase ID') });
             }
          }
          
          if (previewRows.filter(r => r.status !== 'UNCHANGED').length === 0) {
             alert("No changes detected! The CSV perfectly matches the live database.");
             setSyncPreview(null);
          } else {
             setSyncPreview(previewRows);
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
        
        let addedCount = 0;
        let updatedCount = 0;

        for (const row of syncPreview) {
           if (row.status === 'UNCHANGED') continue;
           
           const item = row.originalCsvData;
           
           const toolData = {
               grade: item['Grade'],
               subject: item['Subject'],
               chapter_number: item['Chapter Number'] ? Number(item['Chapter Number']) : 0,
               chapter_name: item['Chapter Name'],
               subtopic_order: item['Subtopic Order'] ? Number(item['Subtopic Order']) : 0,
               subtopic: item['Subtopic'],
               content_order: item['Content Order'] ? Number(item['Content Order']) : 0,
               content_type: item['Content Type'],
               title: item['Title'],
               image_url: item['Image URL'],
               content_url: item['Content URL'],
               isPremium: item['Premium']?.toUpperCase() === 'TRUE',
               book: item['Book'] || 'Kortex Klassroom',
               is_featured: item['Featured']?.toUpperCase() === 'TRUE',
               subtopic_id: item['Subtopic ID']
           };

           if (row.status === 'UPDATED') {
               const docRef = doc(db, 'learning_tools', item['Firebase ID']);
               currentBatch.set(docRef, { ...toolData, updated_at: new Date().toISOString() }, { merge: true });
               operationCount++;
               updatedCount++;
           } else if (row.status === 'NEW') {
               const docRef = doc(collection(db, 'learning_tools'));
               currentBatch.set(docRef, { ...toolData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
               operationCount++;
               addedCount++;
           }

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
        
        alert(`SYNC SUCCESSFUL! ✅\nSuccessfully added ${addedCount} resources and updated ${updatedCount} records.`);
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
                <p className="text-sm text-slate-500 font-medium mt-1">Carefully examine the diff below before confirming deployment. New rows are highlighted <span className="font-bold text-emerald-600">Green</span>, and updated cells are highlighted <span className="font-bold text-blue-600">Blue</span>.</p>
             </div>

             <div className="space-y-4 max-h-[60vh] overflow-y-auto border-2 border-slate-200 rounded-xl bg-slate-50 relative">
                <table className="w-full text-left text-xs font-mono">
                   <thead className="bg-slate-100 font-sans font-bold text-slate-500 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                      <tr>
                         {EXPECTED_HEADERS.map(h => (
                             <th key={h} className="p-3 whitespace-nowrap">{h}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200">
                      {syncPreview.map((row, idx) => {
                         const isNew = row.status === 'NEW';
                         const isUpdated = row.status === 'UPDATED';
                         const rowClass = isNew ? "bg-emerald-100/50" : (isUpdated ? "hover:bg-amber-50/40" : "opacity-40 hover:opacity-100 transition-opacity");
                         
                         return (
                            <tr key={idx} className={rowClass}>
                               {EXPECTED_HEADERS.map(h => {
                                  const isChanged = row.changedFields.includes(h);
                                  let cellClass = "text-slate-600";
                                  
                                  if (isNew) {
                                     cellClass = "text-emerald-900 font-bold";
                                  } else if (isChanged && isUpdated) {
                                     cellClass = "bg-blue-100 text-blue-900 font-bold px-2 py-1 rounded shadow-sm inline-block";
                                  }
                                  
                                  return (
                                     <td key={h} className="p-3 truncate max-w-[150px]" title={row.originalCsvData[h]}>
                                        <span className={cellClass}>{String(row.originalCsvData[h])}</span>
                                     </td>
                                  )
                               })}
                            </tr>
                         )
                      })}
                   </tbody>
                </table>
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
