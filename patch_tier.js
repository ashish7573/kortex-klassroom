const fs = require('fs');
const file = 'kortex_landing_page/TierLibraryView.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `const TierLibraryView = ({ activeTier, isLoggedIn, requireAuth, onOpenTool }: any) => {`,
  `const TierLibraryView = ({ activeTier, isLoggedIn, requireAuth, onOpenTool, authProfile, role, isPro }: any) => {`
);

code = code.replace(
  `{filteredItems.length > 0 ? filteredItems.map((item, idx) => (`,
  `{filteredItems.length > 0 ? filteredItems.map((item, idx) => {
    // FREEMIUM ENGINE: Depth Restriction
    // Only unlock first 3 items unless they are Pro or the item is covered by their Org/B2C license
    let isLockedByDepth = false;
    if (role === 'student' && !isPro && idx >= 3) {
       // Check if they have an active org license or b2c license for this subject/grade combo
       const requiredCombo = \`\${item.grade}_\${item.subject}\`;
       const b2cLicenses = authProfile?.active_b2c_licenses || [];
       let hasOrgLicense = false;
       if (authProfile?.org_links) {
          Object.values(authProfile.org_links).forEach((link: any) => {
             if (link.assigned_combos?.includes(requiredCombo)) hasOrgLicense = true;
          });
       }
       if (!b2cLicenses.includes(requiredCombo) && !hasOrgLicense) {
          isLockedByDepth = true;
       }
    }

    return (`
);

code = code.replace(
  `               <Card key={idx} className={\`hover:\${activeTier.borderColor} cursor-pointer group relative p-0 flex flex-col border-b-4 \${activeTier.borderColor}\`} onClick={() => {
                 if (item.isPremium) requireAuth(() => onOpenTool(item), \`This is a Premium \${activeTier.label}. Sign up for free to access it!\`);
                 else onOpenTool(item);
               }}>`,
  `               <Card key={idx} className={\`\${isLockedByDepth ? 'opacity-50 grayscale' : 'hover:'+activeTier.borderColor} cursor-pointer group relative p-0 flex flex-col border-b-4 \${activeTier.borderColor}\`} onClick={() => {
                 if (isLockedByDepth) {
                    alert("This level is locked! Ask your parents to unlock Kortex Pro or assign this course to continue learning past Level 3.");
                    return;
                 }
                 if (item.isPremium) requireAuth(() => onOpenTool(item), \`This is a Premium \${activeTier.label}. Sign up for free to access it!\`);
                 else onOpenTool(item);
               }}>`
);

code = code.replace(
  `{item.isPremium && <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1"><Star size={10} className="fill-white" /> PRO</div>}`,
  `{item.isPremium && !isLockedByDepth && <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1"><Star size={10} className="fill-white" /> PRO</div>}
   {isLockedByDepth && <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[2px] z-10"><div className="bg-slate-900 text-white p-3 rounded-full shadow-xl"><Lock size={24} /></div></div>}`
);

// We must close the return statement
code = code.replace(
  `               </Card>
            )) :`,
  `               </Card>
            );
         }) :`
);

fs.writeFileSync(file, code);
