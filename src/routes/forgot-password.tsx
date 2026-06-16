import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { KeyRound, ArrowLeft, Mail, ShieldAlert } from "lucide-react";

const forgotSchema = z.object({
  redirect: fallback(z.string(), "/").default("/"),
});

export const Route = createFileRoute("/forgot-password")({
  validateSearch: zodValidator(forgotSchema),
  head: () => ({
    meta: [
      { title: "Forgot Password — CarpenterBullet" },
      { name: "description", content: "Reset your CarpenterBullet account password securely." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  // Stages: "email" | "otp" | "reset"
  const [stage, setStage] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // Field validation helper
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handleSendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // In Supabase, resetPasswordForEmail sends a password recovery email.
      // This email contains a magic link as well as a 6-digit OTP code (type: recovery)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;

      toast.success("Recovery code sent to your email!");
      setStage("otp");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      // Verify the recovery OTP. This authenticates the user's current session.
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery",
      });
      if (error) throw error;

      toast.success("Verification successful! Set your new password.");
      setStage("reset");
    } catch (err: any) {
      toast.error(err.message ?? "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Since the user is authenticated in the current session after verifyOtp,
      // we can simply update the user details.
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success("Password reset successfully! You are now logged in.");
      navigate({ to: redirect as any });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  const fieldCls =
    "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary transition-all duration-200";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        {stage === "email" && (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
              <KeyRound className="h-6 w-6" />
            </div>

            <h1 className="font-display text-3xl font-medium tracking-tight text-center">
              Forgot password?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              No problem. Enter your email address and we'll send you a 6-digit recovery code.
            </p>

            <form onSubmit={handleSendResetEmail} className="mt-8 space-y-4">
              <div className="space-y-1">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  className={fieldCls}
                  required
                />
                {emailError && <p className="text-xs text-destructive pl-1">{emailError}</p>}
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Send Recovery Code
              </Button>
            </form>
          </div>
        )}

        {stage === "otp" && (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
              <Mail className="h-6 w-6" />
            </div>

            <h1 className="font-display text-3xl font-medium tracking-tight">
              Enter recovery code
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
              . Enter it to confirm your identity.
            </p>

            <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6 flex flex-col items-center">
              <div className="w-full flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(val) => setCode(val)}
                  className="gap-2"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={code.length !== 6}
                className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 shadow-sm"
              >
                Verify Code
              </Button>
            </form>
          </div>
        )}

        {stage === "reset" && (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <h1 className="font-display text-3xl font-medium tracking-tight text-center">
              Reset password
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Please enter your new password below.
            </p>

            <form onSubmit={handleSaveNewPassword} className="mt-8 space-y-4">
              <div className="space-y-1">
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
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
                Reset Password
              </Button>
            </form>
          </div>
        )}

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
