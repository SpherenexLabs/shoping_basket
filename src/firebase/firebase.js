import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// New Firebase Configuration - v2v-communication-d46c6
const firebaseConfig = {
  apiKey: "AIzaSyAXHnvNZkb00PXbG5JidbD4PbRgf7l6Lgg",
  authDomain: "v2v-communication-d46c6.firebaseapp.com",
  databaseURL: "https://v2v-communication-d46c6-default-rtdb.firebaseio.com",
  projectId: "v2v-communication-d46c6",
  storageBucket: "v2v-communication-d46c6.firebasestorage.app",
  messagingSenderId: "536888356116",
  appId: "1:536888356116:web:983424cdcaf8efdd4e2601",
  measurementId: "G-H0YN6PE3S1"
};

// Initialize Firebase with unique name to avoid conflicts
const app = initializeApp(firebaseConfig, 'shopping-basket-new');

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Log current database URL for verification
console.log('🔥 Firebase Database URL:', firebaseConfig.databaseURL);

export default app;
