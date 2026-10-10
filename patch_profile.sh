sed -i '' -e 's/import { doc, updateDoc } from '\''firebase\/firestore'\'';/import { doc, updateDoc } from '\''firebase\/firestore'\'';\
import { RecaptchaVerifier, signInWithPhoneNumber } from '\''firebase\/auth'\'';\
import { auth } from '\''..\/..\/..\/backend_configurations\/firebase'\'';/g' kortex_users/org_admin/tabs/ProfileView.tsx
