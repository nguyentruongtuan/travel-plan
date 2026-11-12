import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { OrDivider, SocialButtons } from "@/components/social-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage, useAuth } from "@/context/auth";
import { AuthShell } from "./login";

export default function SignupPage() {
  const { signupWithEmail } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const done = () => navigate("/plans", { replace: true });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await signupWithEmail(name.trim(), email, password);
      toast.success("Account created");
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
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Start planning your next trip.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SocialButtons onSuccess={done} />
          <OrDivider />
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
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
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? "Creating account…" : "Sign up"}
            </Button>
          </form>
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
