const fs = require('fs');
let content = fs.readFileSync('components/users/admin/ProvisionOrgModal.tsx', 'utf8');

// Add createPortal import
if (!content.includes("createPortal")) {
  content = content.replace(
    "import React, { useState } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { createPortal } from 'react-dom';"
  );
}

// Check if we need to wrap with portal
if (!content.includes("if (!mounted) return null;")) {
  content = content.replace(
    "const [isCopied, setIsCopied] = useState(false);",
    "const [isCopied, setIsCopied] = useState(false);\n  const [mounted, setMounted] = useState(false);\n\n  useEffect(() => setMounted(true), []);"
  );
  
  // Wrap the returns in createPortal
  content = content.replace(
    /return \(\s*<div className="fixed inset-0/g,
    "if (!mounted) return null;\n\n    return createPortal(\n      <div className=\"fixed inset-0"
  );
  
  // Close the createPortal
  content = content.replace(
    /  \);\n}\n$/g,
    "    ),\n    document.body\n  );\n}\n"
  );
}

fs.writeFileSync('components/users/admin/ProvisionOrgModal.tsx', content);
console.log('Fixed ProvisionOrgModal Portal');
