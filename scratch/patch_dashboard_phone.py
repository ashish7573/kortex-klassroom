import re

with open('kortex_users/parent/ParentDashboard.tsx', 'r') as f:
    content = f.read()

old_logic = """  const initialContact = (profile as any).contact_number || '';
  let initCountryCode = '+91';
  let initMobile = initialContact;
  if (initialContact.startsWith('+')) {
    const spaceIdx = initialContact.indexOf(' ');
    if (spaceIdx > 0) {
      initCountryCode = initialContact.slice(0, spaceIdx);
      initMobile = initialContact.slice(spaceIdx + 1);
    }
  }

  // If the initial country code isn't in our curated list, set it to 'other' and put the value in customCountryCode
  const knownCodes = ['+91', '+1', '+44', '+61', '+971', '+65', '+49', '+33', '+81', '+86', '+55', '+52', '+27', '+64', '+966', '+34', '+39', '+7', '+82', '+62'];"""

new_logic = """  const initialContact = (profile as any).contact_number || '';
  const knownCodes = ['+91', '+1', '+44', '+61', '+971', '+65', '+49', '+33', '+81', '+86', '+55', '+52', '+27', '+64', '+966', '+34', '+39', '+7', '+82', '+62'];
  
  let initCountryCode = '+91';
  let initMobile = initialContact;
  
  if (initialContact.startsWith('+')) {
    const spaceIdx = initialContact.indexOf(' ');
    if (spaceIdx > 0) {
      initCountryCode = initialContact.slice(0, spaceIdx);
      initMobile = initialContact.slice(spaceIdx + 1);
    } else {
      const sortedKnownCodes = [...knownCodes].sort((a, b) => b.length - a.length);
      const matchedCode = sortedKnownCodes.find(code => initialContact.startsWith(code));
      if (matchedCode) {
        initCountryCode = matchedCode;
        initMobile = initialContact.slice(matchedCode.length);
      }
    }
  }

  // If the initial country code isn't in our curated list, set it to 'other' and put the value in customCountryCode"""

content = content.replace(old_logic, new_logic)

with open('kortex_users/parent/ParentDashboard.tsx', 'w') as f:
    f.write(content)

