import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authErrorMessage, useAuth } from "@/context/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.7-4.9h-4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z"
      />
    </svg>
  );
}

export function SocialButtons({ onSuccess }: { onSuccess: () => void }) {
  const { loginWithGoogle, loginWithFacebook } = useAuth();
  const [busy, setBusy] = useState<"google" | "facebook" | null>(null);

  const run = async (which: "google" | "facebook") => {
    setBusy(which);
    try {
      await (which === "google" ? loginWithGoogle() : loginWithFacebook());
      onSuccess();
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-3">
      <Button type="button" variant="outline" size="lg" disabled={busy !== null} onClick={() => run("google")}>
        <GoogleIcon />
        {busy === "google" ? "Connecting…" : "Continue with Google"}
      </Button>
      <Button type="button" variant="outline" size="lg" disabled={busy !== null} onClick={() => run("facebook")}>
        <FacebookIcon />
        {busy === "facebook" ? "Connecting…" : "Continue with Facebook"}
      </Button>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="relative my-1 text-center text-xs uppercase">
      <span className="bg-card text-muted-foreground relative z-10 px-2">or</span>
      <div className="absolute inset-x-0 top-1/2 border-t" />
    </div>
  );
}
