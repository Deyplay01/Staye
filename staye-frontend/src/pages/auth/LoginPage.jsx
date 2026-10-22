import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Button from "../../components/common/Button";
import PasswordInput from "../../components/common/PasswordInput";
import GoogleAuthButton from "../../components/common/GoogleAuthButton";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(returnTo);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Login failed. Check your email and password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError("");
    setIsSubmitting(true);
    try {
      // Send the secure credential token straight through your AuthContext pipeline
      await loginGoogle(credentialResponse.credential);
      // Redirect back to home or their active room booking checkout funnel
      navigate(returnTo);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Google authentication failed on server.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleError() {
    setError("Google sign-in couldn't be completed. Please try again.");
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in"
      description="Access your account to book a stay and keep your travel plans together."
      footer={<>New to Stayé?{" "}<Link to={`/register${returnTo !== "/" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`} className="font-bold text-slate-900 hover:text-brand">Create an account</Link></>}
    >
          {error && (
            <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </span>
              <input
                required
                type="email"
                id="username"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                spellCheck="false"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </span>
              <PasswordInput
                required
                id="current-password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </label>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">or continue with</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <GoogleAuthButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} disabled={isSubmitting} />
    </AuthLayout>
  );
}
