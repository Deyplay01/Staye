import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Save, UserRound } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Button from "../../components/common/Button";
import { fetchProfile, updateProfile } from "../../api/auth";
import { getImageUrl, uploadImages } from "../../api";
import { useAuth } from "../../context/AuthContext";

const EMPTY_PROFILE = { bio: "", phone: "", gender: "", dob: "", avatar: "", location: "" };

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then((data) => setProfile({ ...EMPTY_PROFILE, ...data, dob: data.dob ? data.dob.slice(0, 10) : "" }))
      .catch((err) => setError(err?.response?.data?.message || "Couldn't load your profile."))
      .finally(() => setIsLoading(false));
  }, []);

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = await updateProfile(profile);
      setProfile({ ...EMPTY_PROFILE, ...saved, dob: saved.dob ? saved.dob.slice(0, 10) : "" });
      setMessage("Profile saved.");
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't save your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Avatar must be an image file.");
      event.target.value = "";
      return;
    }
    setIsUploadingAvatar(true);
    setError("");
    try {
      const result = await uploadImages([file], localStorage.getItem("staye_token"));
      const avatar = result.images?.[0]?.url;
      if (avatar) setProfile((current) => ({ ...current, avatar }));
    } catch (err) {
      setError(err.message || "Couldn't upload your avatar.");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8f2]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-7 flex items-center justify-between gap-3">
          <div>
            <p className="staye-eyebrow">Your account</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">Profile</h1>
          </div>
          <Link to="/" className="shrink-0"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Home</Button></Link>
        </div>

        {isLoading ? <LoadingSpinner label="Loading your profile..." /> : (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="h-fit rounded-2xl border border-ink-300 bg-white p-6 text-center shadow-card">
              {profile.avatar ? <img src={getImageUrl(profile.avatar)} alt="Profile avatar" className="mx-auto h-24 w-24 rounded-full object-cover" /> : <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#C9F2C7] text-[#243119]"><UserRound className="h-10 w-10" aria-hidden="true" /></div>}
              <h2 className="mt-4 font-bold text-navy-900">{user?.name || profile.username?.name || "Guest"}</h2>
              <p className="mt-1 break-all text-sm text-ink-500">{user?.email || profile.username?.email}</p>
              {profile.location && <p className="mt-3 flex items-center justify-center gap-1 text-sm text-ink-500"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{profile.location}</p>}
            </aside>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card sm:p-6">
              <div className="mb-6"><h2 className="text-xl font-bold text-navy-900">Personal details</h2><p className="mt-1 text-sm text-ink-500">Keep your stay details up to date.</p></div>
              {error && <p className="mb-4 rounded-xl bg-[#C9F2C7] px-3 py-2 text-sm text-[#243119]">{error}</p>}
              {message && <p className="mb-4 rounded-xl bg-[#C9F2C7] px-3 py-2 text-sm text-[#243119]">{message}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink-700">Phone</span><input value={profile.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Your phone number" className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand" /></label>
                <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink-700">Location</span><input value={profile.location} onChange={(event) => update("location", event.target.value)} placeholder="City, country" className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand" /></label>
                <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink-700">Gender</span><select value={profile.gender} onChange={(event) => update("gender", event.target.value)} className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand"><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="non-binary">Non-binary</option></select></label>
                <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink-700">Date of birth</span><input type="date" value={profile.dob} onChange={(event) => update("dob", event.target.value)} className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand" /></label>
              </div>
              <label className="mt-4 block"><span className="mb-1.5 block text-sm font-semibold text-ink-700">Short bio</span><textarea rows={4} value={profile.bio} onChange={(event) => update("bio", event.target.value)} placeholder="Tell hosts a little about yourself" className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand" /></label>
              <div className="mt-4"><span className="mb-1.5 block text-sm font-semibold text-ink-700">Profile photo</span><label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#96BE8C] bg-[#C9F2C7]/40 px-3 py-3 text-sm font-semibold text-[#243119] hover:bg-[#C9F2C7]"><UserRound className="mr-2 h-4 w-4" aria-hidden="true" />{isUploadingAvatar ? "Uploading photo..." : "Choose an image"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarUpload} disabled={isUploadingAvatar} className="sr-only" /></label></div>
              <div className="mt-6 flex justify-end border-t border-ink-300 pt-5"><Button type="submit" disabled={isSaving}><Save className="h-4 w-4" aria-hidden="true" />{isSaving ? "Saving..." : "Save profile"}</Button></div>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
