const fs = require('fs');
const file = 'kortex_users/student/StudentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldHandleAction = `  const handleActionClick = (tierId: string) => {
    // If they have a school organization or premium b2c license, they likely don't use hearts for those specific tasks, 
    // but for exploring the global catalog (the 5 tiers), we apply the stamina system unless they are "Pro" (unlimited).
    const isPro = profile.is_pro || false;
    
    if (!isPro && hearts <= 0) {
      setShowEnergyModal(true);
      return;
    }
    
    onExploreTier?.(tierId);
  };`;

const newHandleAction = `  const handleActionClick = (tierId: string) => {
    const isPro = profile.is_pro || false;
    
    let isOwned = false;
    // Bypass energy if they belong to an Org, or if they are clicking a B2C combo they own
    if (profile.org_ids && profile.org_ids.length > 0) {
        isOwned = true;
    } else if (tierId.startsWith('lessons:')) {
        const subjectStr = tierId.split(':')[1].toLowerCase();
        if (profile.active_b2c_licenses && profile.active_b2c_licenses.some((c: string) => c.toLowerCase().includes(subjectStr) || subjectStr.includes(c.toLowerCase().split('-').pop() || ''))) {
            isOwned = true;
        }
    }
    
    if (!isPro && !isOwned && hearts <= 0) {
      setShowEnergyModal(true);
      return;
    }
    
    onExploreTier?.(tierId);
  };`;

code = code.replace(oldHandleAction, newHandleAction);

// Fix the UI display of the Energy widget
const oldEnergyUI = `            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Daily Energy</h3>
              {isPro ? (
                <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 rounded-lg text-[10px] font-black uppercase">Unlimited</span>
              ) : (`;

const newEnergyUI = `            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Daily Energy</h3>
              {(isPro || (profile.org_ids && profile.org_ids.length > 0)) ? (
                <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 rounded-lg text-[10px] font-black uppercase">Unlimited</span>
              ) : (`;

code = code.replace(oldEnergyUI, newEnergyUI);


const oldEnergyBar = `            <div className="flex justify-between items-center bg-black/20 rounded-2xl p-3">
              {isPro ? (
                 <div className="w-full flex items-center justify-center gap-2 py-1 text-yellow-400">
                    <Sparkles size={24} className="animate-pulse" />
                    <span className="font-black tracking-widest">PRO ACTIVE</span>
                 </div>
              ) : (`;

const newEnergyBar = `            <div className="flex justify-between items-center bg-black/20 rounded-2xl p-3">
              {(isPro || (profile.org_ids && profile.org_ids.length > 0)) ? (
                 <div className="w-full flex items-center justify-center gap-2 py-1 text-yellow-400">
                    <Sparkles size={24} className="animate-pulse" />
                    <span className="font-black tracking-widest">SCHOOL PRO</span>
                 </div>
              ) : (`;

code = code.replace(oldEnergyBar, newEnergyBar);

const oldResetText = `            {!isPro && (
              <p className="text-[10px] text-center text-white/60 font-bold mt-3">
                Energy resets automatically tomorrow!
              </p>
            )}`;

const newResetText = `            {!(isPro || (profile.org_ids && profile.org_ids.length > 0)) && (
              <p className="text-[10px] text-center text-white/60 font-bold mt-3">
                Energy resets automatically tomorrow!
              </p>
            )}`;

code = code.replace(oldResetText, newResetText);

fs.writeFileSync(file, code);
