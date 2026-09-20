import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

/**
 * Deliberately separate from the customer /login page. Calls the same
 * POST /auth/login endpoint (there's only one in the backend), but rejects
 * the session on the client if the account isn't isAdmin — a customer
 * account can log in here but will just be told this isn't an admin login.
 */
export default function AdminLoginPage() {
  const { login, logout, loginAdminGoogle } = useAuth();
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
      if (!profile.isAdmin) {
        logout();
        setError("This account doesn't have admin access.");
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
      await loginAdminGoogle(response.credential);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "This Google account does not have admin access.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-white bg-cover bg-center px-4 py-10"
      style={{ backgroundImage: "linear-gradient(rgba(36, 49, 25, 0.38), rgba(36, 49, 25, 0.38)), url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&q=85)" }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#96BE8C] bg-white p-6 shadow-popover sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold">S</span>
          <div><p className="text-lg font-bold text-[#243119]">Stayé / host</p><p className="text-xs text-[#629460]">Host workspace login</p></div>
        </div>

        {error && <p className="mb-4 rounded-xl bg-[#c9f2c7] px-3 py-2 text-sm text-navy-900">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Password</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand"
            />
          </label>
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-2">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wider text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google sign-in was cancelled.")} theme="outline" size="large" shape="rounded" width="320" />
        </div>

        <p className="mt-4 text-center text-sm text-ink-500">
          Need a host account? <Link to="/admin/register" className="font-bold text-brand hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
