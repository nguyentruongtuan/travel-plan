import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { AuthProvider, useAuth } from "@/context/auth";
import { firebaseConfigured } from "@/lib/firebase";
import LoginPage from "@/pages/login";
import MapPage from "@/pages/map";
import PlanDetailPage from "@/pages/plan-detail";
import PlansPage from "@/pages/plans";
import SignupPage from "@/pages/signup";

function FullScreenSpinner() {
  return (
    <div className="grid h-full place-items-center">
      <Loader2 className="text-primary size-8 animate-spin" />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (user) return <Navigate to="/plans" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {!firebaseConfigured && (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
            Firebase is not configured — set the <code>VITE_FIREBASE_*</code> variables in <code>.env</code>.
          </div>
        )}
        <Routes>
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/signup" element={<GuestOnly><SignupPage /></GuestOnly>} />
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/plans/:planId" element={<PlanDetailPage />} />
            <Route path="/map" element={<MapPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/plans" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}
