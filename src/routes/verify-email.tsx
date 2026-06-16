import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";

const verifySchema = z.object({
  email: z.string().email(),
  redirect: fallback(z.string(), "/").default("/"),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: zodValidator(verifySchema),
  head: () => ({
    meta: [
      { title: "Verify Your Email — CarpenterBullet" },
      { name: "description", content: "Verify your email address using the 6-digit OTP code." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (error) throw error;

      toast.success("Email verified successfully! Welcome to CarpenterBullet.");
      navigate({ to: redirect as any });
    } catch (e: any) {
      toast.error(e.message ?? "Verification failed. Please check the code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast.success("A new verification code has been sent to your email.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
          <Mail className="h-6 w-6" />
        </div>

        <h1 className="font-display text-3xl font-medium tracking-tight">Verify email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a 6-digit confirmation code to:
          <span className="block font-medium text-foreground mt-1 select-all">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="mt-8 space-y-6 flex flex-col items-center">
          <div className="w-full flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={(val) => setCode(val)} className="gap-2">
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
            Verify Account
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={handleResend}
            disabled={resending || loading}
            className="text-xs text-primary hover:underline flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
            Resend verification code
          </button>

          <div className="h-px w-full bg-border my-2" />

          <Link
            to="/auth"
            search={{ redirect }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
