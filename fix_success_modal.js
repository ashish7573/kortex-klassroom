const fs = require('fs');
let content = fs.readFileSync('components/users/admin/ProvisionOrgModal.tsx', 'utf8');

// Replace the success modal return to wrap it in createPortal if mounted
const badReturn = `    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">`;
const goodReturn = `    if (!mounted) return null;
    return createPortal(
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">`;

content = content.replace(badReturn, goodReturn);

const badEnd = `        </div>
      </div>
    );
  }`;
const goodEnd = `        </div>
      </div>
    ), document.body);
  }`;

content = content.replace(badEnd, goodEnd);

fs.writeFileSync('components/users/admin/ProvisionOrgModal.tsx', content);
console.log('Fixed success modal portal');
