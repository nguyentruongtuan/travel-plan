import { Plane } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { OrDivider, SocialButtons } from "@/components/social-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage, useAuth } from "@/context/auth";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-background px-4 py-10 dark:from-teal-950/40">
      <div className="mb-6 flex items-center gap-2 text-xl font-semibold">
        <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-lg">
          <Plane className="size-5" />
        </span>
        Travel Plan
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

export default function LoginPage() {
  const { loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/plans";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const done = () => navigate(from, { replace: true });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await loginWithEmail(email, password);
      done();
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Log in to see your travel plans.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SocialButtons onSuccess={done} />
          <OrDivider />
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? "Logging in…" : "Log in"}
            </Button>
          </form>
          <p className="text-muted-foreground text-center text-sm">
            New here?{" "}
            <Link to="/signup" className="text-primary font-medium underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
