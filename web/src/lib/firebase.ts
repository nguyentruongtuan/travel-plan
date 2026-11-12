import { initializeApp } from "firebase/app";
import { FacebookAuthProvider, GoogleAuthProvider, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = initializeApp(firebaseConfigured ? firebaseConfig : { apiKey: "missing", projectId: "missing" });

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope("email");
