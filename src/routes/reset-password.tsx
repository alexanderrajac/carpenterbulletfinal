import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { KeyRound, ShieldAlert, ArrowLeft } from "lucide-react";

const resetSchema = z.object({
  redirect: fallback(z.string(), "/").default("/"),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: zodValidator(resetSchema),
  head: () => ({
    meta: [
      { title: "Set New Password — Woodverse" },
      { name: "description", content: "Create a new password for your Woodverse account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    // Check if the user is authenticated (which they should be if they clicked the recovery link)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setHasSession(true);
      } else {
        toast.error("Recovery link expired or invalid. Please request a new code.");
        navigate({ to: "/forgot-password", search: { redirect } });
      }
      setChecking(false);
    });
  }, [navigate, redirect]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success("Password updated successfully! Welcome back.");
      navigate({ to: redirect as any });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  const fieldCls = "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary transition-all duration-200";

  if (checking) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying recovery token...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) return null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <h1 className="font-display text-3xl font-medium tracking-tight text-center">Set new password</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Create a secure, new password for your Woodverse account.
        </p>

        <form onSubmit={handleReset} className="mt-8 space-y-4">
          <div className="space-y-1">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              className={fieldCls}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-1">
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              className={fieldCls}
              required
              minLength={6}
            />
            {passwordError && <p className="text-xs text-destructive pl-1">{passwordError}</p>}
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Update Password
          </Button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link
            to="/auth"
            search={{ redirect }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
