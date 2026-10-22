import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Button from "../../components/common/Button";
import PasswordInput from "../../components/common/PasswordInput";
import GoogleAuthButton from "../../components/common/GoogleAuthButton";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate(returnTo);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError("");
    setIsSubmitting(true);
    try {
      await loginGoogle(credentialResponse.credential);
      navigate(returnTo);
    } catch (err) {
      setError(err?.response?.data?.message || "Google sign-up failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleError() {
    setError("Google sign-up couldn't be completed. Please try again.");
  }

  return (
    <AuthLayout
      eyebrow="Your next stay starts here"
      title="Create an account"
      description="Save your details, book a stay, and keep your trip information in one place."
      footer={<>Already have an account?{" "}<Link to={`/login${returnTo !== "/" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`} className="font-bold text-slate-900 hover:text-brand">Log in</Link></>}
    >
          {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
              <input
                required
                id="name"
                name="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                autoComplete="name"
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <input
                required
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
                spellCheck="false"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
              <PasswordInput
                required
                minLength={6}
                id="new-password"
                name="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
              <span className="mt-1 block text-xs text-ink-500">At least 6 characters.</span>
            </label>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">or continue with</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <GoogleAuthButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} text="signup_with" disabled={isSubmitting} />
    </AuthLayout>
  );
}
