import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Button from "../../components/common/Button";
import PasswordInput from "../../components/common/PasswordInput";
import GoogleAuthButton from "../../components/common/GoogleAuthButton";
import { useAuth } from "../../context/AuthContext";

export default function AdminRegisterPage() {
  const { registerHost, registerHostGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerHost(form.name, form.email, form.password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Host registration failed. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSuccess(response) {
    setError("");
    setIsSubmitting(true);
    try {
      await registerHostGoogle(response.credential);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Host Google registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      host
      eyebrow="Join Staye as a host"
      title="Create your host account"
      description="List your property, manage room options, and keep bookings organized in one workspace."
      footer={<>Already hosting on Staye?{" "}<Link to="/admin/login" className="font-bold text-slate-900 hover:text-brand">Log in</Link></>}
    >
          {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span><input required id="name" name="name" autoComplete="name" value={form.name} onChange={(event) => update("name", event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email</span><input required type="email" id="email" name="email" autoComplete="email" spellCheck="false" value={form.email} onChange={(event) => update("email", event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Password</span><PasswordInput required minLength={8} id="new-password" name="password" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" /><span className="mt-1.5 block text-xs text-slate-500">At least 8 characters.</span></label>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>{isSubmitting ? "Creating workspace..." : "Create host account"}</Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">or continue with</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="flex justify-center">
            <GoogleAuthButton onSuccess={handleGoogleSuccess} onError={() => setError("Google sign-up couldn't be completed. Please try again.")} text="signup_with" disabled={isSubmitting} />
          </div>

    </AuthLayout>
  );
}
