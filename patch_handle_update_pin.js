const fs = require('fs');
const file = 'kortex_users/parent/ParentDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const updatePinLogic = `
  const handleUpdatePin = async (e: React.FormEvent, childUid: string) => {
    e.preventDefault();
    if (newPin.length < 4) return alert("PIN must be at least 4 characters.");
    setIsUpdatingPin(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const { updateChildPin } = await import('../../app/actions/student');
      const result = await updateChildPin(idToken, childUid, newPin);
      if (!result.success) throw new Error(result.error);
      
      alert("PIN updated successfully!");
      setShowCredsFor(null);
      setNewPin('');
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingPin(false);
    }
  };
`;

code = code.replace(
  `  const handleProfileSubmit = async`,
  updatePinLogic + `\n  const handleProfileSubmit = async`
);

fs.writeFileSync(file, code);
