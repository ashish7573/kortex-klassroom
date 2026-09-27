const fs = require('fs');

// Page.tsx
let page = fs.readFileSync('app/page.tsx', 'utf8');
if (!page.includes('Eye,')) {
    page = page.replace(
        "import {",
        "import { Eye, EyeOff,"
    );
}
fs.writeFileSync('app/page.tsx', page);

// UnifiedAuthModal
let modal = fs.readFileSync('components/auth/UnifiedAuthModal.tsx', 'utf8');
if (!modal.includes('Eye,')) {
    modal = modal.replace(
        "import {",
        "import { Eye, EyeOff,"
    );
}
if (!modal.includes('showParentPassword')) {
    modal = modal.replace(
        "const [showPassword, setShowPassword] = useState(false);",
        "const [showPassword, setShowPassword] = useState(false);\n  const [showParentPassword, setShowParentPassword] = useState(false);"
    );
}
fs.writeFileSync('components/auth/UnifiedAuthModal.tsx', modal);

// UsersManager
let users = fs.readFileSync('components/users/admin/UsersManager.tsx', 'utf8');
if (!users.includes('Trash2,')) {
    users = users.replace(
        "import {",
        "import { Trash2,"
    );
}
fs.writeFileSync('components/users/admin/UsersManager.tsx', users);

console.log('Fixed imports forcefully');
