import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { AegisLogo } from "@/components/aegis/logo";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Aegisflow" },
      { name: "description", content: "Sign in to the Aegisflow AI Security Gateway console." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("alex@aegisflow.io");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [remember, setRemember] = useState(true);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const setApiKeyStore = useAuthStore((s) => s.setApiKey);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:flex">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, oklch(0.68 0.18 255 / 0.35), transparent 55%), radial-gradient(circle at 80% 70%, oklch(0.62 0.20 290 / 0.30), transparent 60%)",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <AegisLogo size={28} />
          <div className="max-w-md space-y-4">
            <h2 className="text-4xl font-semibold leading-tight tracking-tight">
              The <span className="text-gradient">LLM firewall</span> for enterprise AI.
            </h2>
            <p className="text-sm text-muted-foreground">
              Realtime prompt injection defense, multi-provider monitoring, and forensic
              session analysis — built for SOC teams operating AI at scale.
            </p>
            <ul className="space-y-2 pt-4 text-sm">
              {["SOC2 Type II", "ISO 27001", "GDPR & HIPAA ready"].map((b) => (
                <li key={b} className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-[oklch(0.78_0.17_165)]" /> {b}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">© Aegisflow Security, Inc.</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center p-6 lg:p-12">
        <div className="absolute inset-0 grid-bg opacity-30 lg:hidden" />
        <Card className="glass relative z-10 w-full max-w-md p-8 animate-in-up">
          <div className="mb-6 lg:hidden">
            <AegisLogo size={24} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to the security operations console.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setIsSubmitting(true);
              if (apiKey.trim()) {
                setApiKeyStore(apiKey.trim());
              }
              void login({ email, password, remember })
                .then(() => navigate({ to: "/overview" }))
                .catch(() => toast.error("Sign-in failed. Check credentials/API key."))
                .finally(() => setIsSubmitting(false));
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/login" className="text-xs text-primary hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-key">Dashboard API key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="x-guardaiian-api-key value"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} /> Remember this device for 30 days
            </label>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              {isSubmitting ? "Signing in..." : "Sign in securely"}
            </Button>
            <Button type="button" variant="outline" className="w-full">
              Continue with SSO
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Request access
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}