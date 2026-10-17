import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../context/NotificationsContext";
import { formatRelativeTime } from "../../utils/date";

export default function NotificationBell({ adminMode = false, align = "right" }) {
  const {
    notifications,
    unreadCount,
    refresh,
    markAllRead,
    openNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  function toggleOpen() {
    setIsOpen((current) => {
      if (!current) refresh();
      return !current;
    });
  }

  async function handleNotificationClick(notification) {
    setIsOpen(false);
    await openNotification(notification);
  }

  async function handleMarkAllRead() {
    await markAllRead();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink-300 text-ink-700 hover:border-brand hover:text-brand"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className={`absolute ${align === "left" ? "left-0" : "right-0"} top-full z-50 mt-3 w-[calc(100vw-2rem)] max-w-80 rounded-2xl border border-ink-300 bg-white p-2 text-ink-900 shadow-popover`}>
          <div className="flex items-center justify-between px-3 py-2">
            <p className="font-bold text-ink-900">Notifications</p>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={!unreadCount}
              className="flex items-center gap-1 text-xs font-semibold text-brand disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> Mark all read
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-500">You are all caught up.</p>
          ) : (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {notifications.slice(0, 8).map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full rounded-xl px-3 py-3 text-left text-ink-900 hover:bg-brand-light ${notification.readAt ? "" : "bg-brand-light/50"}`}
                >
                  <p className="text-sm font-semibold text-ink-900">{notification.title}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-600">{notification.message}</p>
                  <p className="mt-1 text-[11px] text-ink-500">{formatRelativeTime(notification.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
          <Link
            to={adminMode ? "/admin/notifications" : "/notifications"}
            onClick={() => setIsOpen(false)}
            className="mt-1 block border-t border-ink-300 px-3 py-2.5 text-center text-sm font-semibold text-brand hover:text-brand-hover"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
