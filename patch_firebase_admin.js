const fs = require('fs');
let code = fs.readFileSync('backend_configurations/firebase-admin.ts', 'utf8');

const newCode = `import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function cleanEnvStr(val?: string) {
  if (!val) return undefined;
  return val.replace(/^[\\"']|[\\"']$/g, '').replace(/,$/, '').trim();
}

const projectId = cleanEnvStr(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || cleanEnvStr(process.env.FIREBASE_PROJECT_ID);
const clientEmail = cleanEnvStr(process.env.FIREBASE_CLIENT_EMAIL);

let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  // Remove surrounding quotes and trailing commas
  privateKey = privateKey.replace(/^[\\"']|[\\"']$/g, '').replace(/,$/, '');
  // Replace literal backslash-n with actual newline
  privateKey = privateKey.replace(/\\\\n/g, '\\n');
}

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("FATAL: Firebase Admin environment variables are missing! Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.");
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
  } catch (error: any) {
    console.error("🚨 FIREBASE ADMIN INIT ERROR:", error);
    throw new Error(\`FATAL: Failed to initialize Firebase Admin SDK. Reason: \${error.message}\`);
  }
} else {
  app = getApp();
}

const adminDb = getFirestore(app);
const adminAuth = getAuth(app);

export { adminDb, adminAuth };
`;

fs.writeFileSync('backend_configurations/firebase-admin.ts', newCode);
console.log("firebase-admin.ts patched.");
