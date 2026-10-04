const fs = require('fs');

// 1. Update User Types
let typesCode = fs.readFileSync('types/user.ts', 'utf8');
if (!typesCode.includes('address?: string;')) {
    typesCode = typesCode.replace(
        "organization_name: string;",
        "organization_name: string;\n  address?: string;\n  phone?: string;"
    );
    fs.writeFileSync('types/user.ts', typesCode);
}

// 2. Update ProfileView.tsx
let code = fs.readFileSync('kortex_users/org_admin/tabs/ProfileView.tsx', 'utf8');

if (!code.includes("import { doc, updateDoc } from 'firebase/firestore';")) {
    code = code.replace(
        "import { OrgAdminProfile } from '../../../types/user';",
        "import { OrgAdminProfile } from '../../../types/user';\nimport { doc, updateDoc } from 'firebase/firestore';\nimport { db } from '../../../backend_configurations/firebase';"
    );
}

const oldState = `  const [formData, setFormData] = useState({
    organizationName: profile.organization_name,
    orgType: profile.org_type || 'school',
    address: '123 Education Lane, Learning City', // Mocked as it's not yet in the DB
    phone: '+1 234 567 8900' // Mocked
  });`;

const newState = `  const [formData, setFormData] = useState({
    organizationName: profile.organization_name,
    orgType: profile.org_type || 'school',
    address: profile.address || '',
    phone: profile.phone || ''
  });
  
  const [isSaving, setIsSaving] = useState(false);`;

code = code.replace(oldState, newState);

const oldSave = `  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: In the future, this would call a server action to update the profile in Firestore
    setIsEditing(false);
    alert('Profile updated successfully! (Mocked)');
  };`;

const newSave = `  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        organization_name: formData.organizationName.trim(),
        full_name: formData.organizationName.trim(), // Keep full name in sync
        org_type: formData.orgType,
        address: formData.address.trim(),
        phone: formData.phone.trim()
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };`;

code = code.replace(oldSave, newSave);

const oldBtn = `<button 
                  type="submit"
                  className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>`;

const newBtn = `<button 
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>`;

code = code.replace(oldBtn, newBtn);

fs.writeFileSync('kortex_users/org_admin/tabs/ProfileView.tsx', code);
