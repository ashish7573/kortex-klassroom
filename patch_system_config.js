const fs = require('fs');
let code = fs.readFileSync('kortex_users/kortex_admin/SystemConfig.tsx', 'utf8');

// 1. Add import for migration action
code = code.replace(
  /import \{ Database, DownloadCloud, UploadCloud, CheckCircle2, AlertCircle \} from 'lucide-react';/,
  `import { Database, DownloadCloud, UploadCloud, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';\nimport { migrateLegacyFLNContent } from '../../app/actions/migration';`
);

// 2. Reorder buttons and add the migration button
// I will just replace the whole `grid grid-cols-1 md:grid-cols-2 gap-6` block
const replacementBlock = `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

             {/* 4. Migrate FLN Content */}
             <div className="bg-white border-4 border-slate-100 p-8 rounded-3xl text-center shadow-sm relative flex flex-col items-center justify-center text-slate-800">
                <RefreshCw size={48} className="text-rose-500 mb-4" />
                <h3 className="text-2xl font-black text-slate-800 mb-2">Migrate FLN Content</h3>
                <p className="text-slate-500 font-medium mb-6 text-sm">Convert legacy FLN grade content to the new Foundational taxonomy globally.</p>
                <button 
                   onClick={async () => {
                     if(window.confirm("Are you sure you want to run the FLN migration? This will update all existing tools with grade 'FLN'.")) {
                       alert("Starting migration...");
                       const res = await migrateLegacyFLNContent();
                       if(res.success) alert(res.message);
                       else alert("Error: " + res.error);
                     }
                   }} 
                   disabled={isLoading || isUploadingCSV} 
                   className="w-full py-4 rounded-xl font-bold border-b-4 bg-rose-500 hover:bg-rose-600 border-rose-700 text-white active:scale-95 transition-all disabled:opacity-50 mt-auto"
                >
                   Run Migration
                </button>
             </div>
          </div>`;

code = code.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 gap-6">[\s\S]*?<\/div>\n          <\/div>/,
  replacementBlock + "\n       )"
);

fs.writeFileSync('kortex_users/kortex_admin/SystemConfig.tsx', code);
console.log("SystemConfig.tsx patched.");
