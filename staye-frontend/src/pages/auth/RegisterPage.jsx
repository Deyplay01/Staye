import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
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

  return (
    <div
      className="min-h-screen bg-white bg-cover bg-center"
      style={{ backgroundImage: "linear-gradient(rgba(36, 49, 25, 0.38), rgba(36, 49, 25, 0.38)), url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&q=85)" }}
    >
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-20">
        <div className="rounded-3xl border border-[#96BE8C] bg-white p-6 shadow-popover sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#629460] text-lg font-bold text-[#C9F2C7]">S</span>
            <div><p className="text-lg font-bold text-[#243119]">Stayé</p><p className="text-xs text-[#629460]">Start your next stay</p></div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#243119]">Create an account</h1>
          <p className="mb-6 text-sm text-ink-500">You'll need this to complete a booking.</p>

          {error && <p className="mb-4 rounded-xl bg-[#C9F2C7] px-3 py-2 text-sm text-[#243119]">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700">Full name</span>
              <input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700">Password</span>
              <input
                required
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand"
              />
              <span className="mt-1 block text-xs text-ink-500">At least 6 characters.</span>
            </label>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-ink-500">
            Already have an account?{" "}
            <Link
              to={`/login${returnTo !== "/" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
              className="font-semibold text-[#629460] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
