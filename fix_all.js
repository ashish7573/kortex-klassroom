const fs = require('fs');

// Fix UsersManager.tsx
let users = fs.readFileSync('components/users/admin/UsersManager.tsx', 'utf8');
users = users.replace("import { Trash2, ", "import { ");
users = users.replace("import { Search,", "import { Trash2, Search,");
fs.writeFileSync('components/users/admin/UsersManager.tsx', users);

// Fix UnifiedAuthModal.tsx
let modal = fs.readFileSync('components/auth/UnifiedAuthModal.tsx', 'utf8');
if (!modal.includes('const [showParentPassword')) {
    modal = modal.replace(
        "const [showPassword, setShowPassword] = useState(false);",
        "const [showPassword, setShowPassword] = useState(false);\n  const [showParentPassword, setShowParentPassword] = useState(false);"
    );
}
fs.writeFileSync('components/auth/UnifiedAuthModal.tsx', modal);

console.log('Fixed everything');
