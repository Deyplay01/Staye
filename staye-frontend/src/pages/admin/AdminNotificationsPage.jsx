import React, { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Button from "../../components/common/Button";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/notifications";
import { useNavigate } from "react-router-dom";
import { formatRelativeTime } from "../../utils/date";

export default function AdminNotificationsPage() {
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
      setError(
        err?.response?.data?.message || "Couldn't load admin notifications.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function openNotification(notification) {
    if (!notification.readAt) {
      await markNotificationRead(notification._id).catch(() => {});
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
    }
    navigate(notification.bookingId ? "/admin/bookings" : "/admin/listings");
  }

  async function markAllRead() {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        readAt: notification.readAt || new Date().toISOString(),
      })),
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="staye-eyebrow">Host workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Booking, payment, cancellation, and refund updates for your
              listings.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={markAllRead}
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" /> Mark all read
          </Button>
        </div>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        {isLoading ? (
          <LoadingSpinner label="Loading admin notifications..." />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="You are all caught up"
            description="New client bookings and listing activity will appear here."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => openNotification(notification)}
                className={`flex w-full items-start gap-4 rounded-2xl border border-ink-300 bg-white p-5 text-left shadow-card hover:border-brand ${notification.readAt ? "" : "border-l-4 border-l-brand"}`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-ink-900">
                      {notification.title}
                    </span>
                    <span className="text-xs text-ink-500">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-ink-600">
                    {notification.message}
                  </span>
                  {!notification.readAt && (
                    <span className="mt-2 block text-xs font-semibold text-brand">
                      Unread
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
