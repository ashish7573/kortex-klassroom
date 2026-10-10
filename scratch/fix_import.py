with open('kortex_users/auth/UnifiedAuthModal.tsx', 'r') as f:
    content = f.read()

# The top imports should look like:
# import { 
#   createUserWithEmailAndPassword, 
#   signInWithEmailAndPassword 
# } from 'firebase/auth';

content = content.replace(
    "import { \n  createUserWithEmailAndPassword, \n  signInWithEmailAndPassword \n} from 'firebase/auth';",
    "import { \n  createUserWithEmailAndPassword, \n  signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider \n} from 'firebase/auth';"
)

with open('kortex_users/auth/UnifiedAuthModal.tsx', 'w') as f:
    f.write(content)

