import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, facebookProvider, firebaseConfigured, googleProvider } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Without a real Firebase config the auth listener never fires, so don't wait on it.
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    loginWithEmail: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    signupWithEmail: async (name, email, password) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      // Force a fresh ID token so the backend sees the display name.
      await cred.user.getIdToken(true);
      setUser(auth.currentUser);
    },
    loginWithGoogle: async () => {
      await signInWithPopup(auth, googleProvider);
    },
    loginWithFacebook: async () => {
      await signInWithPopup(auth, facebookProvider);
    },
    logout: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Turn Firebase auth error codes into friendly messages. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/invalid-email": "That email address is not valid.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/account-exists-with-different-credential":
      "An account already exists with this email using a different sign-in method.",
    "auth/invalid-api-key": "Firebase is not configured. Set the VITE_FIREBASE_* variables.",
  };
  return map[code] ?? (err instanceof Error ? err.message : "Something went wrong.");
}
