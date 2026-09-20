import React, { useLayoutEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import ProtectedRoute from "./components/common/ProtectedRoute";

import HomePage from "./pages/customer/HomePage";
import ListingsPage from "./pages/customer/ListingsPage";
import ListingDetailsPage from "./pages/customer/ListingDetailsPage";
import BookingPage from "./pages/customer/BookingPage";
import ConfirmationPage from "./pages/customer/ConfirmationPage";
import MyBookingsPage from "./pages/customer/MyBookingsPage";
import UserDashboardPage from "./pages/customer/UserDashboardPage";
import ReceiptPage from "./pages/customer/ReceiptPage";
import NotificationsPage from "./pages/customer/NotificationsPage";
import ProfilePage from "./pages/customer/ProfilePage";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminRegisterPage from "./pages/admin/AdminRegisterPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminListingsPage from "./pages/admin/AdminListingsPage";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage";
import AdminBookingVerificationPage from "./pages/admin/AdminBookingVerificationPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Customer side */}
      <Route path="/" element={<HomePage />} />
      <Route path="/listings" element={<ListingsPage />} />
      <Route path="/listings/:id" element={<ListingDetailsPage />} />
      <Route
        path="/booking/:listingId"
        element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/confirmation/:bookingId"
        element={
          <ProtectedRoute>
            <ConfirmationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/confirmation"
        element={
          <ProtectedRoute>
            <ConfirmationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/callback"
        element={
          <ProtectedRoute>
            <ConfirmationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receipt/:bookingId"
        element={
          <ProtectedRoute>
            <ReceiptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Customer auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin side — separate login, everything else protected */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/register" element={<AdminRegisterPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/listings"
        element={
          <ProtectedRoute requireAdmin>
            <AdminListingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute requireAdmin>
            <AdminBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verify-booking"
        element={
          <ProtectedRoute requireAdmin>
            <AdminBookingVerificationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute requireAdmin>
            <AdminNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
