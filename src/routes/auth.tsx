import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(z.object({ redirect: fallback(z.string(), "/").default("/") })),
  head: () => ({ meta: [{ title: "Sign in — Woodverse" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Field validation errors
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect as any });
    });
  }, [navigate, redirect]);

  // Clean errors when switching modes
  useEffect(() => {
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setTermsError("");
  }, [mode]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setTermsError("");

    let hasErrors = false;

    if (mode === "signup") {
      if (!name.trim()) {
        setNameError("Full name is required.");
        hasErrors = true;
      }
      if (!agreeTerms) {
        setTermsError("You must agree to the Terms and Privacy Policy.");
        hasErrors = true;
      }
    }

    if (!email.trim() || !email.includes("@")) {
      setEmailError("Please enter a valid email address.");
      hasErrors = true;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      hasErrors = true;
    }

    if (hasErrors) return;

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        
        toast.success("Account created! Verify your email to complete registration.");
        
        // Redirect to OTP verification page
        navigate({ 
          to: "/verify-email", 
          search: { email, redirect } 
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: redirect as any });
      }
    } catch (e: any) {
      const msg = e.message ?? "Authentication failed";
      
      // Inline auth error categorization
      if (msg.toLowerCase().includes("email")) {
        setEmailError(msg);
      } else if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("invalid login credentials")) {
        setPasswordError("Invalid email or password.");
      } else {
        toast.error(msg);
      }
    } finally { setLoading(false); }
  }

  async function google() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://carpenterbullet.com",
        },
      });
      if (error) throw error;
    } catch (e: any) {
      toast.error(e.message ?? "Google sign-in failed");
      setLoading(false);
    }
  }

  const fieldCls = "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h1 className="font-display text-3xl font-medium tracking-tight">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Sign in to your Woodverse account." : "Join the workshop."}</p>

        <button onClick={google} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60 cursor-pointer transition-colors">
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.09a6.61 6.61 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1">
              <input 
                name="name" 
                placeholder="Full name" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                className={fieldCls} 
                required 
                maxLength={120} 
              />
              {nameError && <p className="text-xs text-destructive pl-1">{nameError}</p>}
            </div>
          )}
          
          <div className="space-y-1">
            <input 
              name="email" 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              className={fieldCls} 
              required 
              maxLength={255} 
            />
            {emailError && <p className="text-xs text-destructive pl-1">{emailError}</p>}
          </div>
          
          <div className="space-y-1">
            <div className="relative">
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                className={`${fieldCls} pr-10`}
                required 
                minLength={6} 
                maxLength={72} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && <p className="text-xs text-destructive pl-1">{passwordError}</p>}
          </div>

          {mode === "signin" && (
            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                search={{ redirect }}
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-1 pt-1">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (termsError) setTermsError("");
                  }}
                  className="mt-1 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                  required
                />
                <label htmlFor="agree-terms" className="text-xs text-muted-foreground leading-normal">
                  I agree to the{" "}
                  <Link to="/terms-of-service" className="text-primary hover:underline">Terms & Conditions</Link>
                  {" "}and{" "}
                  <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
                </label>
              </div>
              {termsError && <p className="text-xs text-destructive pl-1">{termsError}</p>}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 shadow-sm"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here?" : "Have an account?"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary hover:underline cursor-pointer">
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
      <Link to="/" className="mt-6 text-center text-xs text-muted-foreground hover:text-foreground">← Back home</Link>
    </div>
  );
}
