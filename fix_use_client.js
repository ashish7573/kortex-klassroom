const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

if (code.includes("import QuoteInquiryModal")) {
    // Remove all instances of the import at the top
    code = code.replace("import QuoteInquiryModal from '../kortex_users/auth/QuoteInquiryModal';\n", "");
    code = code.replace("import QuoteInquiryModal from '../kortex_users/auth/QuoteInquiryModal';", "");
    
    // Inject it immediately after "use client";
    code = code.replace('"use client";', '"use client";\nimport QuoteInquiryModal from "../kortex_users/auth/QuoteInquiryModal";');
    
    fs.writeFileSync('app/page.tsx', code);
}
