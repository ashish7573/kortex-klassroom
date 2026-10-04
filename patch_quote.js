const fs = require('fs');
let code = fs.readFileSync('kortex_users/auth/QuoteInquiryModal.tsx', 'utf8');

const oldError = `      setErrorMsg("Failed to submit inquiry. Please try again or reach out directly.");`;
const newError = `      setErrorMsg("Failed to submit. Please contact us directly at kortexkrew@gmail.com");`;

code = code.replace(oldError, newError);
fs.writeFileSync('kortex_users/auth/QuoteInquiryModal.tsx', code);
