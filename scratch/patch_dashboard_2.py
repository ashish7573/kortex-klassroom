import re

with open('kortex_users/parent/ParentDashboard.tsx', 'r') as f:
    content = f.read()

# Don't clear recaptcha instance on cancel, just let it be reused.
old_cancel_dashboard = """                               if ((window as any).recaptchaVerifier) {
                                 (window as any).recaptchaVerifier.clear();
                                 (window as any).recaptchaVerifier = undefined;
                               }"""
new_cancel_dashboard = """                               // Do not clear recaptchaVerifier here, let it be reused"""
content = content.replace(old_cancel_dashboard, new_cancel_dashboard)

old_error_dashboard = """      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = undefined;
      }"""
new_error_dashboard = """      // Do not clear recaptchaVerifier here, let it be reused"""
content = content.replace(old_error_dashboard, new_error_dashboard)

with open('kortex_users/parent/ParentDashboard.tsx', 'w') as f:
    f.write(content)

