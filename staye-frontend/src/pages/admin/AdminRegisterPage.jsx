import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    <div
      className="min-h-screen bg-white bg-cover bg-center"
      style={{ backgroundImage: "linear-gradient(rgba(36, 49, 25, 0.38), rgba(36, 49, 25, 0.38)), url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&q=85)" }}
    >
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-3xl border border-[#96BE8C] bg-white p-6 shadow-popover sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#243119] text-lg font-bold text-[#C9F2C7]">S</span>
            <div>
              <p className="text-lg font-bold text-[#243119]">Stayé / host</p>
              <p className="text-xs text-[#629460]">Create a host workspace</p>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#243119]">Join as a host</h1>
          <p className="mt-2 text-sm leading-6 text-[#629460]">Create a host account to manage listings and bookings. New listings are reviewed before going public.</p>

          {error && <p className="mt-5 rounded-xl bg-[#C9F2C7] px-3 py-2 text-sm text-[#243119]">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-[#243119]">Full name</span><input required value={form.name} onChange={(event) => update("name", event.target.value)} className="w-full rounded-xl border border-[#96BE8C] px-3 py-3 text-sm text-[#243119] outline-none focus:border-[#629460]" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-[#243119]">Email</span><input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="w-full rounded-xl border border-[#96BE8C] px-3 py-3 text-sm text-[#243119] outline-none focus:border-[#629460]" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-[#243119]">Password</span><PasswordInput required minLength={8} value={form.password} onChange={(event) => update("password", event.target.value)} className="w-full rounded-xl border border-[#96BE8C] px-3 py-3 text-sm text-[#243119] outline-none focus:border-[#629460]" /></label>
            <Button type="submit" className="w-full bg-[#243119] hover:bg-[#629460]" size="lg" disabled={isSubmitting}>{isSubmitting ? "Creating workspace..." : "Create host account"}</Button>
          </form>

          <div className="my-5 flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs uppercase tracking-wider text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="flex justify-center">
            <GoogleAuthButton onSuccess={handleGoogleSuccess} onError={() => setError("Google sign-up couldn't be completed. Please try again.")} text="signup_with" disabled={isSubmitting} />
          </div>

          <p className="mt-6 text-center text-sm text-[#629460]">Already a host? <Link to="/admin/login" className="font-bold text-[#243119] hover:underline">Log in</Link></p>
          <Link to="/" className="mt-3 block text-center text-xs text-[#629460] hover:underline">Back to homepage</Link>
        </div>
      </div>
    </div>
  );
}
