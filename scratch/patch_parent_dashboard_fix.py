import re

with open('kortex_users/parent/ParentDashboard.tsx', 'r') as f:
    content = f.read()

# Fix handleProfileSubmit
old_submit = """    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const result = await updateParentProfile(idToken, profileForm);"""

new_submit = """    try {
      const expectedDigits = COUNTRY_CODES.find(c => c.code === profileForm.countryCode)?.digits || 10;
      const digitsOnly = profileForm.mobileNumber.replace(/\D/g, '');
      if (digitsOnly.length !== expectedDigits) {
        alert(`Mobile number for ${profileForm.countryCode} must be exactly ${expectedDigits} digits.`);
        setIsSavingProfile(false);
        return;
      }

      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken(true);
      
      const payload = {
         fullName: profileForm.fullName,
         email: profileForm.email,
         contactNumber: `${profileForm.countryCode} ${digitsOnly}`,
         city: profileForm.city,
         country: profileForm.country
      };
      
      const result = await updateParentProfile(idToken, payload);"""

content = content.replace(old_submit, new_submit)

# Fix profileForm.contactNumber usages
# In handleResolveTransfer
old_resolve = "if (accept && (!profileForm.contactNumber || profileForm.contactNumber.trim() === '')) {"
new_resolve = "if (accept && (!profileForm.mobileNumber || profileForm.mobileNumber.trim() === '')) {"
content = content.replace(old_resolve, new_resolve)

# In line 712: parentContactNumber={profileForm.contactNumber} -> parentContactNumber={`${profileForm.countryCode} ${profileForm.mobileNumber}`}
content = content.replace("parentContactNumber={profileForm.contactNumber}", "parentContactNumber={`${profileForm.countryCode} ${profileForm.mobileNumber}`}")

with open('kortex_users/parent/ParentDashboard.tsx', 'w') as f:
    f.write(content)
