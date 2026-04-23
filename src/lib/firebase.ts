import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore instead of getFirestore to enable forced long polling
// this helps in restrictive network environments where WebSockets might be blocked
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test-connection', 'status'));
    console.log("Firestore connection successful.");
  } catch (error: any) {
    if (error?.message?.includes('offline') || error?.code === 'unavailable') {
      console.warn("Firestore is currently unavailable. Using offline mode.");
    } else {
      console.error("Firestore connectivity error:", error);
    }
  }
}

testConnection();
