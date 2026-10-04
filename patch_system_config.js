const fs = require('fs');
let code = fs.readFileSync('kortex_users/kortex_admin/SystemConfig.tsx', 'utf8');

// 1. Add Import
const importStr = `import { syncCurriculumTotals } from '../../app/actions/admin';\nimport { auth } from '../../backend_configurations/firebase';`;
if (!code.includes('syncCurriculumTotals')) {
    code = code.replace("import { db } from '../../backend_configurations/firebase';", "import { db } from '../../backend_configurations/firebase';\n" + importStr);
}

// 2. Add button function
const fnInjection = `
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
`;
const fnTarget = "  const handleConfirmSync = async () => {";
if (!code.includes('handleSyncTotals')) {
    code = code.replace(fnTarget, fnInjection + "\n" + fnTarget);
}

// 3. Call sync after successful CSV upload
const confirmSuccessTarget = `        alert("Successfully synced \${syncPreview.toAdd.length + syncPreview.toUpdate.length} database operations!");
        setSyncPreview(null);
     } catch (e) {`;
const confirmSuccessReplacement = `        alert("Successfully synced \${syncPreview.toAdd.length + syncPreview.toUpdate.length} database operations!");
        setSyncPreview(null);
        // Silently recount everything for the dashboards
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            await syncCurriculumTotals(token);
        }
     } catch (e) {`;
if (!code.includes('await syncCurriculumTotals(token);')) {
    code = code.replace(confirmSuccessTarget, confirmSuccessReplacement);
}

// 4. Add UI button
const renderTarget = `             <div className="bg-white border-4 border-slate-100 p-8 rounded-3xl text-center shadow-sm relative flex flex-col items-center justify-center text-slate-800">
                <UploadCloud size={64} className="text-sky-500 mb-6" />`;
const renderUI = `
             <div className="bg-white border-4 border-slate-100 p-8 rounded-3xl text-center shadow-sm relative flex flex-col items-center justify-center text-slate-800 md:col-span-2">
                <h3 className="text-2xl font-black text-slate-800 mb-2">Sync Dashboard Totals</h3>
                <p className="text-slate-500 font-medium mb-6 text-sm">Force recalculate all progress percentages for Student & Parent Dashboards.</p>
                <button 
                   onClick={handleSyncTotals} 
                   disabled={isLoading || isUploadingCSV} 
                   className="w-full max-w-sm mx-auto py-3 rounded-xl font-bold border-b-4 bg-indigo-500 hover:bg-indigo-600 border-indigo-700 text-white active:scale-95 transition-all disabled:opacity-50"
                >
                   {isLoading ? 'Syncing...' : 'Sync Totals'}
                </button>
             </div>
`;
if (!code.includes('Sync Dashboard Totals')) {
    code = code.replace(renderTarget, renderUI + "\n" + renderTarget);
}

fs.writeFileSync('kortex_users/kortex_admin/SystemConfig.tsx', code);
