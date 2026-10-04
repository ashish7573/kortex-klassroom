const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/TeacherPortal.tsx', 'utf8');

const oldInterface = `interface TeacherPortalProps {
  profile: TeacherProfile;
}`;

const newInterface = `interface TeacherPortalProps {
  profile: TeacherProfile;
  onExploreTier?: (tierId: string) => void;
}`;

code = code.replace(oldInterface, newInterface);

const oldComponent = `export default function TeacherPortal({ profile }: TeacherPortalProps) {`;
const newComponent = `export default function TeacherPortal({ profile, onExploreTier }: TeacherPortalProps) {`;

code = code.replace(oldComponent, newComponent);

const oldClassView = `return <TeacherClassView profile={profile} combo={activeCombo} onBack={() => setActiveCombo(null)} />;`;
const newClassView = `return <TeacherClassView profile={profile} combo={activeCombo} onBack={() => setActiveCombo(null)} onExploreTier={onExploreTier} />;`;

code = code.replace(oldClassView, newClassView);

fs.writeFileSync('kortex_users/teacher/TeacherPortal.tsx', code);
