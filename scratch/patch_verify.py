import re

with open('app/onboarding/verify-phone/page.tsx', 'r') as f:
    content = f.read()

# 1. Move recaptcha-container outside
old_container = """            <div id="recaptcha-container" className="my-2 flex justify-center"></div>

            <button"""
new_container = """            <button"""
content = content.replace(old_container, new_container)

old_form_start = """        {!confirmationResult ? ("""
new_form_start = """        <div id="recaptcha-container" className="my-2 flex justify-center"></div>
        {!confirmationResult ? ("""
content = content.replace(old_form_start, new_form_start)

# 2. Don't clear recaptcha instance on cancel, just let it be reused.
old_cancel = """                  if ((window as any).recaptchaVerifier) {
                    (window as any).recaptchaVerifier.clear();
                    (window as any).recaptchaVerifier = undefined;
                  }"""
new_cancel = """                  // Do not clear recaptchaVerifier here, let it be reused"""
content = content.replace(old_cancel, new_cancel)

with open('app/onboarding/verify-phone/page.tsx', 'w') as f:
    f.write(content)

