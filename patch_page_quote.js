const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

if (!code.includes('import QuoteInquiryModal')) {
    code = code.replace(
        `import UnifiedAuthModal from '../kortex_users/auth/UnifiedAuthModal';`,
        `import UnifiedAuthModal from '../kortex_users/auth/UnifiedAuthModal';\nimport QuoteInquiryModal from '../kortex_users/auth/QuoteInquiryModal';`
    );
}

if (!code.includes('const [showGlobalQuote, setShowGlobalQuote]')) {
    code = code.replace(
        `  const [showAuthModal, setShowAuthModal] = useState(false);`,
        `  const [showAuthModal, setShowAuthModal] = useState(false);\n  const [showGlobalQuote, setShowGlobalQuote] = useState(false);`
    );
}

if (!code.includes("'open-quote-modal'")) {
    code = code.replace(
        `window.addEventListener('open-auth-modal', handleAuth);`,
        `window.addEventListener('open-auth-modal', handleAuth);\n    const handleQuote = () => setShowGlobalQuote(true);\n    window.addEventListener('open-quote-modal', handleQuote);`
    );
    code = code.replace(
        `window.removeEventListener('open-auth-modal', handleAuth);`,
        `window.removeEventListener('open-auth-modal', handleAuth);\n      window.removeEventListener('open-quote-modal', handleQuote);`
    );
}

if (!code.includes('<QuoteInquiryModal')) {
    code = code.replace(
        `{showAuthModal && (`,
        `{showGlobalQuote && <QuoteInquiryModal onClose={() => setShowGlobalQuote(false)} />}\n      {showAuthModal && (`
    );
}

fs.writeFileSync('app/page.tsx', code);
