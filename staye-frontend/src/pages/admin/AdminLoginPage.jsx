import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Button from "../../components/common/Button";
import PasswordInput from "../../components/common/PasswordInput";
import GoogleAuthButton from "../../components/common/GoogleAuthButton";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

/**
 * Deliberately separate from the customer /login page. Calls the same
 * POST /auth/login endpoint, but rejects the session unless the account
 * has a host or super-admin role.
 */
export default function AdminLoginPage() {
  const { login, logout, loginHostGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const profile = await login(email, password);
      if (!["host", "admin"].includes(profile.role)) {
        logout();
        setError("This account doesn't have host access.");
        return;
      }
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Check your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSuccess(response) {
    setError("");
    setIsSubmitting(true);
    try {
      await loginHostGoogle(response.credential);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "This Google account does not have host access.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      host
      eyebrow="Host workspace"
      title="Welcome back"
      description="Sign in to manage your property, rooms, and guest bookings."
      footer={<>New to hosting on Staye?{" "}<Link to="/admin/register" className="font-bold text-slate-900 hover:text-brand">Create a host account</Link></>}
    >
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
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
              className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <PasswordInput
              required
              id="current-password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">or continue with</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="flex justify-center">
          <GoogleAuthButton onSuccess={handleGoogleSuccess} onError={() => setError("Google sign-in couldn't be completed. Please try again.")} disabled={isSubmitting} />
        </div>

    </AuthLayout>
  );
}
