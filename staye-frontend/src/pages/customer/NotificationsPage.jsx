import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/notifications";
import { formatRelativeTime } from "../../utils/date";

function notificationPath(notification) {
  if (notification.bookingId) return `/confirmation/${notification.bookingId}`;
  if (notification.listingId) return `/listings/${notification.listingId}`;
  return "/notifications";
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setIsLoading(true);
    try {
      const data = await fetchNotifications(50);
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't load notifications.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function openNotification(notification) {
    if (!notification.readAt) {
      await markNotificationRead(notification._id).catch(() => {});
      setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item));
    }
    navigate(notificationPath(notification));
  }

  async function markAllRead() {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || new Date().toISOString() })));
  }

  return (
    <div className="min-h-screen bg-[#f5f8f2]"><Navbar /><main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10"><div className="mb-7 flex flex-wrap items-center justify-between gap-3"><div><p className="staye-eyebrow">Your account</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">Notifications</h1></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4" aria-hidden="true" /> Mark all read</Button><Link to="/dashboard"><Button type="button" variant="outline" size="sm"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Dashboard</Button></Link></div></div>{error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{error}</p>}{isLoading ? <LoadingSpinner label="Loading notifications..." /> : notifications.length === 0 ? <EmptyState title="You are all caught up" description="Booking and payment updates will appear here." action={<Link to="/listings" className="text-sm font-semibold text-brand hover:underline">Browse listings</Link>} /> : <div className="space-y-3">{notifications.map((notification) => <button key={notification._id} type="button" onClick={() => openNotification(notification)} className={`flex w-full items-start gap-4 rounded-2xl border border-ink-300 bg-white p-5 text-left shadow-card hover:border-brand ${notification.readAt ? "" : "border-l-4 border-l-brand"}`}><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand"><Bell className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold text-ink-900">{notification.title}</span><span className="text-xs text-ink-500">{formatRelativeTime(notification.createdAt)}</span></span><span className="mt-1 block text-sm leading-6 text-ink-600">{notification.message}</span>{!notification.readAt && <span className="mt-2 block text-xs font-semibold text-brand">Unread</span>}</span></button>)}</div>}</main><Footer /></div>
  );
}
