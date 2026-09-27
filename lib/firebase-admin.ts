import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function cleanEnvStr(val?: string) {
  if (!val) return undefined;
  return val.replace(/^["']|["']$/g, '').replace(/,$/, '').trim();
}

const projectId = cleanEnvStr(process.env.FIREBASE_PROJECT_ID);
const clientEmail = cleanEnvStr(process.env.FIREBASE_CLIENT_EMAIL);

let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  // Remove surrounding quotes and trailing commas
  privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/,$/, '');
  // Replace literal backslash-n with actual newline
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!projectId || !clientEmail || !privateKey) {
  console.error("🚨 FIREBASE ADMIN ERROR: Missing environment variables! Please check your .env.local file.");
}

let app;
if (getApps().length === 0) {
  try {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error("🚨 FIREBASE ADMIN INIT ERROR:", error);
    // Initialize a dummy app so the server doesn't crash completely, but API calls will fail gracefully
    app = initializeApp({ projectId: "error-project" }, "dummy");
  }
} else {
  app = getApp();
}

const adminDb = getFirestore(app);
const adminAuth = getAuth(app);

export { adminDb, adminAuth };
