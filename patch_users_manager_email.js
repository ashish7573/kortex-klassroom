const fs = require('fs');
const file = 'kortex_users/kortex_admin/UsersManager.tsx';
let code = fs.readFileSync(file, 'utf8');

const getEmailContentFunc = `
  const getEmailContent = (ind: any) => {
    if (ind.role === 'student') {
      if (ind.parent_id && ind.parent_id !== 'PENDING') {
         const parent = individuals.find(p => p.uid === ind.parent_id);
         if (parent) {
           return (
             <div className="flex flex-col">
               <span className="font-bold text-slate-700 text-sm">{parent.email || 'N/A'}</span>
               <span className="text-[11px] font-bold text-slate-500">{parent.full_name} <span className="font-normal">(Parent)</span></span>
               <span className="text-[9px] font-mono font-bold text-slate-400">{parent.kortex_id || parent.uid}</span>
             </div>
           );
         }
      }
      return <span className="text-slate-400 italic text-[11px] font-bold">No Parent Linked</span>;
    }
    
    return <span className="font-semibold text-slate-600">{ind.email || 'N/A'}</span>;
  };
`;

// Insert the function before the return statement of UsersManager
code = code.replace(`  return (\n    <div className="bg-white`, getEmailContentFunc + `\n  return (\n    <div className="bg-white`);

// Replace the email cell in the render loop
code = code.replace(
  `<td className="px-6 py-4 font-semibold text-slate-600">{ind.email || 'N/A'}</td>`,
  `<td className="px-6 py-4">{getEmailContent(ind)}</td>`
);

fs.writeFileSync(file, code);
