import React, { useEffect, useState } from "react";
import { MapPin, Save, UserRound } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import SkeletonBlock from "../../components/common/SkeletonBlock";
import Button from "../../components/common/Button";
import HomeIconLink from "../../components/common/HomeIconLink";
import { fetchProfile, updateProfile } from "../../api/auth";
import { getImageUrl, uploadImages } from "../../api";
import { useAuth } from "../../context/AuthContext";

const EMPTY_PROFILE = {
  bio: "",
  phone: "",
  gender: "",
  dob: "",
  avatar: "",
  location: "",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const initials = (user?.name || profile.username?.name || "G")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    fetchProfile()
      .then((data) =>
        setProfile({
          ...EMPTY_PROFILE,
          ...data,
          dob: data.dob ? data.dob.slice(0, 10) : "",
        }),
      )
      .catch((err) =>
        setError(err?.response?.data?.message || "Couldn't load your profile."),
      )
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
      setProfile({
        ...EMPTY_PROFILE,
        ...saved,
        dob: saved.dob ? saved.dob.slice(0, 10) : "",
      });
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
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setError("Use a JPEG, PNG, WebP, or AVIF image for your avatar.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Your avatar image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setIsUploadingAvatar(true);
    setError("");
    try {
      const result = await uploadImages(
        [file],
        localStorage.getItem("staye_token"),
        "profile",
      );
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-7 flex items-center justify-between gap-3">
          <div>
            <p className="staye-eyebrow">Your account</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">
              Profile
            </h1>
          </div>
          <HomeIconLink />
        </div>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]" aria-label="Loading profile" aria-busy="true">
            <div className="rounded-2xl border border-ink-300 bg-white p-6 shadow-card">
              <SkeletonBlock className="mx-auto h-24 w-24 rounded-full" />
              <SkeletonBlock className="mx-auto mt-4 h-5 w-2/3" />
              <SkeletonBlock className="mx-auto mt-2 h-4 w-5/6" />
              <SkeletonBlock className="mx-auto mt-4 h-4 w-1/2" />
            </div>
            <div className="space-y-5 rounded-2xl border border-ink-300 bg-white p-5 shadow-card sm:p-6">
              <div className="space-y-2 border-b border-ink-300 pb-5">
                <SkeletonBlock className="h-6 w-1/3" />
                <SkeletonBlock className="h-4 w-2/3" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 5 }, (_, index) => <SkeletonBlock key={index} className="h-12 w-full rounded-xl" />)}
              </div>
              <SkeletonBlock className="h-11 w-32 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="h-fit rounded-2xl border border-ink-300 bg-white p-6 text-center shadow-card">
              {profile.avatar && !avatarFailed ? (
                <img
                  src={getImageUrl(profile.avatar, 256)}
                  alt="Profile avatar"
                  onError={() => setAvatarFailed(true)}
                  className="mx-auto h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-[#0F172A]">
                  {initials}
                </div>
              )}
              <h2 className="mt-4 font-bold text-navy-900">
                {user?.name || profile.username?.name || "Guest"}
              </h2>
              <p className="mt-1 break-all text-sm text-ink-500">
                {user?.email || profile.username?.email}
              </p>
              {profile.location && (
                <p className="mt-3 flex items-center justify-center gap-1 text-sm text-ink-500">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {profile.location}
                </p>
              )}
            </aside>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card sm:p-6"
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-navy-900">
                  Personal details
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Keep your stay details up to date.
                </p>
              </div>
              {error && (
                <p className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-[#0F172A]">
                  {error}
                </p>
              )}
              {message && (
                <p className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-[#0F172A]">
                  {message}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink-700">
                    Phone
                  </span>
                  <input
                    value={profile.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    placeholder="Your phone number"
                    className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink-700">
                    Location
                  </span>
                  <input
                    value={profile.location}
                    onChange={(event) => update("location", event.target.value)}
                    placeholder="City, country"
                    className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink-700">
                    Gender
                  </span>
                  <select
                    value={profile.gender}
                    onChange={(event) => update("gender", event.target.value)}
                    className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink-700">
                    Date of birth
                  </span>
                  <input
                    type="date"
                    value={profile.dob}
                    onChange={(event) => update("dob", event.target.value)}
                    className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand"
                  />
                </label>
              </div>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-ink-700">
                  Short bio
                </span>
                <textarea
                  rows={4}
                  value={profile.bio}
                  onChange={(event) => update("bio", event.target.value)}
                  placeholder="Tell hosts a little about yourself"
                  className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand"
                />
              </label>
              <div className="mt-4">
                <span className="mb-1.5 block text-sm font-semibold text-ink-700">
                  Profile photo
                </span>
                <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-slate-50 px-3 py-3 text-sm font-semibold text-[#0F172A] hover:bg-slate-100">
                  <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
                  {isUploadingAvatar ? "Uploading photo..." : "Choose an image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                    className="sr-only"
                  />
                </label>
                <p className="mt-1.5 text-xs text-ink-500">JPEG, PNG, WebP, or AVIF; 5 MB maximum. Animated images are not supported.</p>
              </div>
              <div className="mt-6 flex justify-end border-t border-ink-300 pt-5">
                <Button type="submit" disabled={isSaving}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {isSaving ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
