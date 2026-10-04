const fs = require('fs');

const code = `import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Guard against multiple initializations during Next.js Fast Refresh
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize App Check only in the browser
if (typeof window !== 'undefined') {
  if (process.env.NODE_ENV !== 'production') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } else {
    console.warn("Firebase App Check is missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY");
  }
}
`;

fs.writeFileSync('backend_configurations/firebase.ts', code);
