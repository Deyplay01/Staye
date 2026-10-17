import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

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
    setError("Google Sign-In popup closed or cancelled.");
  }

  return (
    <div
      className="min-h-screen bg-white bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(rgba(36, 49, 25, 0.38), rgba(36, 49, 25, 0.38)), url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&q=85)",
      }}
    >
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-20">
        <div className="rounded-3xl border border-[#96BE8C] bg-white p-6 shadow-popover sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#243119] text-lg font-bold text-[#C9F2C7]">
              S
            </span>
            <div>
              <p className="text-lg font-bold text-[#243119]">Stayé</p>
              <p className="text-xs text-[#629460]">Welcome back</p>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#243119]">
            Log in
          </h1>
          <p className="mb-6 text-sm text-ink-500">
            Log in to book a stay or view your bookings.
          </p>

          {error && (
            <p className="mb-4 rounded-xl bg-[#C9F2C7] px-3 py-2 text-sm text-[#243119]">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700">
                Email
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700">
                Password
              </span>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand"
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

          <div className="my-5 flex items-center justify-center gap-2">
            <div className="h-[1px] w-full bg-slate-200"></div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">or</span>
            <div className="h-[1px] w-full bg-slate-200"></div>
          </div>

          <div className="google-button-wrapper" style={{ width: "100%" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              shape="rounded"
              width="100%" 
            />
          </div>


          <p className="mt-4 text-center text-sm text-ink-500">
            Don't have an account?{" "}
            <Link
              to={`/register${returnTo !== "/" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
              className="font-semibold text-[#629460] hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
