const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

if (!code.includes('import QuoteInquiryModal')) {
    code = `import QuoteInquiryModal from '../kortex_users/auth/QuoteInquiryModal';\n` + code;
}

fs.writeFileSync('app/page.tsx', code);
