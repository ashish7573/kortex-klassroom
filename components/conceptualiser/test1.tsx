// --- Custom Interactive Hand Components ---
const LeftHand = ({ count, onClick }: { count: number, onClick: () => void }) => {
  const open = [count >= 1, count >= 2, count >= 3, count >= 4, count >= 5]; // Index, Middle, Ring, Pinky, Thumb
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full max-h-48 drop-shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-transform" onClick={onClick}>
      {/* Fingers behind palm */}
      <rect x="22" y="25" width="12" height="40" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[3] ? 'translateY(0)' : 'translateY(30px)' }} />
      <rect x="36" y="15" width="12" height="50" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[2] ? 'translateY(0)' : 'translateY(35px)' }} />
      <rect x="50" y="10" width="12" height="55" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[1] ? 'translateY(0)' : 'translateY(40px)' }} />
      <rect x="64" y="20" width="12" height="45" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[0] ? 'translateY(0)' : 'translateY(35px)' }} />
      
      {/* Thumb (Right side) */}
      <rect x="65" y="65" width="22" height="14" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300 origin-[65px_72px]" style={{ transform: open[4] ? 'rotate(-40deg)' : 'rotate(0deg) translateX(-15px) scaleX(0.5)' }} />
      
      {/* Palm */}
      <rect x="20" y="55" width="58" height="55" rx="15" fill="#fcd34d" stroke="#d97706" strokeWidth="2" />
      {/* Palm crease line */}
      <path d="M 30,85 Q 50,75 70,80" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
};

const RightHand = ({ count, onClick }: { count: number, onClick: () => void }) => {
  const open = [count >= 1, count >= 2, count >= 3, count >= 4, count >= 5]; // Index, Middle, Ring, Pinky, Thumb
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full max-h-48 drop-shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-transform" onClick={onClick}>
      {/* Thumb (Left side) */}
      <rect x="13" y="65" width="22" height="14" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300 origin-[35px_72px]" style={{ transform: open[4] ? 'rotate(40deg)' : 'rotate(0deg) translateX(15px) scaleX(0.5)' }} />
      
      {/* Fingers behind palm */}
      <rect x="24" y="20" width="12" height="45" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[0] ? 'translateY(0)' : 'translateY(35px)' }} />
      <rect x="38" y="10" width="12" height="55" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[1] ? 'translateY(0)' : 'translateY(40px)' }} />
      <rect x="52" y="15" width="12" height="50" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[2] ? 'translateY(0)' : 'translateY(35px)' }} />
      <rect x="66" y="25" width="12" height="40" rx="6" fill="#fcd34d" stroke="#d97706" strokeWidth="2" className="transition-all duration-300" style={{ transform: open[3] ? 'translateY(0)' : 'translateY(30px)' }} />
      
      {/* Palm */}
      <rect x="22" y="55" width="58" height="55" rx="15" fill="#fcd34d" stroke="#d97706" strokeWidth="2" />
      {/* Palm crease line */}
      <path d="M 30,80 Q 50,75 70,85" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
};