import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notifications";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const NotificationsContext = createContext(null);
const POLL_INTERVAL_MS = 45000;

function getNotificationPath(notification, isAdminMode) {
  if (isAdminMode) return notification.bookingId ? "/admin/bookings" : "/admin/listings";
  if (notification.bookingId) return `/confirmation/${notification.bookingId}`;
  if (notification.listingId) return `/listings/${notification.listingId}`;
  return "/notifications";
}

export function NotificationsProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const activeRequest = useRef(null);
  const knownNotificationIds = useRef(new Set());
  const hasLoadedNotifications = useRef(false);
  const isAdminMode = user?.role === "host" || user?.role === "admin";

  const markRead = useCallback(async (notificationId) => {
    try {
      const notification = await markNotificationRead(notificationId);
      setNotifications((current) => current.map((item) => (
        item._id === notificationId ? { ...item, readAt: notification.readAt || new Date().toISOString() } : item
      )));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
      showToast({ title: "Update failed", message: "Couldn't mark this notification as read.", type: "error" });
    }
  }, [showToast]);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || readAt })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Unable to mark notifications as read:", error);
      showToast({ title: "Update failed", message: "Couldn't mark notifications as read.", type: "error" });
    }
  }, [showToast]);

  const openNotification = useCallback(async (notification) => {
    if (!notification.readAt) await markRead(notification._id);
    navigate(getNotificationPath(notification, isAdminMode));
  }, [isAdminMode, markRead, navigate]);

  const refresh = useCallback(async ({ notifyNew = false } = {}) => {
    if (!isAuthenticated || activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    try {
      const data = await fetchNotifications(50, { signal: controller.signal });
      if (controller.signal.aborted) return;

      const nextNotifications = data.notifications || [];
      if (notifyNew && hasLoadedNotifications.current) {
        const newestUnread = nextNotifications.find(
          (notification) => !notification.readAt && !knownNotificationIds.current.has(notification._id),
        );
        if (newestUnread) {
          showToast({
            title: newestUnread.title,
            message: newestUnread.message,
            type: "info",
            actionLabel: "View update",
            onAction: () => openNotification(newestUnread),
          });
        }
      }

      nextNotifications.forEach((notification) => knownNotificationIds.current.add(notification._id));
      hasLoadedNotifications.current = true;
      setNotifications(nextNotifications);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("Unable to load notifications:", error);
      }
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }, [isAuthenticated, openNotification, showToast]);

  useEffect(() => {
    if (!isAuthenticated) {
      activeRequest.current?.abort();
      activeRequest.current = null;
      knownNotificationIds.current.clear();
      hasLoadedNotifications.current = false;
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh({ notifyNew: true });
    }, POLL_INTERVAL_MS);
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") refresh({ notifyNew: true });
    };
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshOnFocus);
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [isAuthenticated, user?.id, refresh]);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead, openNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider.");
  }
  return context;
}
