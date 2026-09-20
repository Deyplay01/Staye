import React, { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/notifications";
import { formatRelativeTime } from "../../utils/date";

function notificationPath(notification, adminMode) {
  if (adminMode) return notification.bookingId ? "/admin/bookings" : "/admin/listings";
  if (notification.bookingId) return `/confirmation/${notification.bookingId}`;
  if (notification.listingId) return `/listings/${notification.listingId}`;
  return "/notifications";
}

export default function NotificationBell({ adminMode = false, align = "right" }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const knownNotificationIds = useRef(new Set());
  const hasLoadedNotifications = useRef(false);

  async function loadNotifications(showToast = false) {
    try {
      const data = await fetchNotifications(8);
      const nextNotifications = data.notifications || [];
      if (showToast && hasLoadedNotifications.current) {
        const newNotification = nextNotifications.find((notification) => !knownNotificationIds.current.has(notification._id));
        if (newNotification) setToast(newNotification);
      }
      nextNotifications.forEach((notification) => knownNotificationIds.current.add(notification._id));
      hasLoadedNotifications.current = true;
      setNotifications(nextNotifications);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setNotifications([]);
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(() => loadNotifications(true), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleNotificationClick(notification) {
    if (!notification.readAt) {
      await markNotificationRead(notification._id).catch(() => {});
      setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnreadCount((current) => Math.max(0, current - 1));
    }
    setIsOpen(false);
    navigate(notificationPath(notification, adminMode));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || new Date().toISOString() })));
    setUnreadCount(0);
  }

  return (
    <>
    {toast && (
      <div className="fixed right-4 top-20 z-[70] w-[calc(100vw-2rem)] max-w-[380px] rounded-2xl border border-brand bg-white p-4 shadow-popover" role="status">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand"><Bell className="h-4 w-4" aria-hidden="true" /></span>
          <button type="button" onClick={() => { setToast(null); handleNotificationClick(toast); }} className="min-w-0 flex-1 text-left"><p className="text-sm font-bold text-ink-900">{toast.title}</p><p className="mt-1 text-xs leading-5 text-ink-600">{toast.message}</p><p className="mt-2 text-xs font-semibold text-brand">View update</p></button>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification" className="text-ink-500 hover:text-ink-900"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </div>
    )}
    <div className="relative">
      <button type="button" onClick={() => { setIsOpen((current) => !current); if (!isOpen) loadNotifications(); }} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={isOpen} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink-300 text-ink-700 hover:border-brand hover:text-brand">
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {isOpen && (
        <div className={`absolute ${align === "left" ? "left-0" : "right-0"} top-full z-50 mt-3 w-[calc(100vw-2rem)] max-w-80 rounded-2xl border border-ink-300 bg-white p-2 text-ink-900 shadow-popover`}>
          <div className="flex items-center justify-between px-3 py-2"><p className="font-bold text-ink-900">Notifications</p><button type="button" onClick={handleMarkAllRead} disabled={!unreadCount} className="flex items-center gap-1 text-xs font-semibold text-brand disabled:opacity-40"><CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> Mark all read</button></div>
          {notifications.length === 0 ? <p className="px-3 py-6 text-center text-sm text-ink-500">You are all caught up.</p> : <div className="max-h-80 space-y-1 overflow-y-auto">{notifications.map((notification) => <button key={notification._id} type="button" onClick={() => handleNotificationClick(notification)} className={`w-full rounded-xl px-3 py-3 text-left text-ink-900 hover:bg-brand-light ${notification.readAt ? "" : "bg-brand-light/50"}`}><p className="text-sm font-semibold text-ink-900">{notification.title}</p><p className="mt-1 text-xs leading-5 text-ink-600">{notification.message}</p><p className="mt-1 text-[11px] text-ink-500">{formatRelativeTime(notification.createdAt)}</p></button>)}</div>}
          <Link to={adminMode ? "/admin/notifications" : "/notifications"} onClick={() => setIsOpen(false)} className="mt-1 block border-t border-ink-300 px-3 py-2.5 text-center text-sm font-semibold text-brand hover:text-brand-hover">View all notifications</Link>
        </div>
      )}
    </div>
    </>
  );
}
