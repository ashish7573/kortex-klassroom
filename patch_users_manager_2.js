const fs = require('fs');
const file = 'kortex_users/kortex_admin/UsersManager.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldFunc = `  const getOrganizationName = (ind: any) => {
    if (ind.role === 'parent') {
       return ind.is_pro 
         ? <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg uppercase border border-amber-200">Pro Account</span>
         : <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase">Free Account</span>;
    }

    const orgIds = ind.org_ids || (ind.org_id ? [ind.org_id] : []);
    
    if (orgIds.length === 0) {
       return <span className="text-slate-300 italic text-xs font-bold">Independent</span>;
    }
    
    return (
      <div className="flex flex-col gap-2">
        {orgIds.map((id: string) => {
           const org = organizations.find(o => o.uid === id);
           return org ? (
             <div key={id} className="flex flex-col">
               <span className="font-bold text-slate-700 text-xs">{org.organization_name}</span>
               <span className="text-[9px] font-mono font-bold text-slate-400">{org.kortex_id}</span>
             </div>
           ) : (
             <span key={id} className="text-slate-400 italic text-[10px] font-bold">Unknown Org</span>
           );
        })}
      </div>
    );
  };`;

const newFunc = `  const getOrganizationName = (ind: any) => {
    let orgSection = <span className="text-slate-300 italic text-xs font-bold">Independent</span>;
    const orgIds = ind.org_ids || (ind.org_id ? [ind.org_id] : []);
    
    if (orgIds.length > 0) {
       orgSection = (
          <div className="flex flex-col gap-2">
            {orgIds.map((id: string) => {
               const org = organizations.find(o => o.uid === id);
               return org ? (
                 <div key={id} className="flex flex-col">
                   <span className="font-bold text-slate-700 text-xs">{org.organization_name}</span>
                   <span className="text-[9px] font-mono font-bold text-slate-400">{org.kortex_id}</span>
                 </div>
               ) : (
                 <span key={id} className="text-slate-400 italic text-[10px] font-bold">Unknown Org</span>
               );
            })}
          </div>
       );
    }
    
    if (ind.role === 'parent') {
       return (
         <div className="flex flex-col items-start gap-1">
           {orgSection}
           {ind.is_pro 
             ? <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md uppercase border border-amber-200">Pro Account</span>
             : <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md uppercase border border-slate-200">Free Account</span>}
         </div>
       );
    }

    return orgSection;
  };`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync(file, code);
