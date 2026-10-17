import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, registerHost as registerHostRequest, clearSession, loginwithGoogle, loginHostWithGoogle, registerHostWithGoogle } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("staye_token");
    const userRaw = localStorage.getItem("staye_user");
    let expiryTimer;

    function expireSession() {
      clearSession();
      setUser(null);
    }

    if (token && userRaw) {
      try {
        const cachedUser = JSON.parse(userRaw);
        setUser({
          ...cachedUser,
          role: cachedUser.role || (cachedUser.isAdmin ? "host" : "guest"),
        });
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (payload.exp) {
          const millisecondsUntilExpiry = payload.exp * 1000 - Date.now();
          if (millisecondsUntilExpiry <= 0) {
            expireSession();
          } else {
            expiryTimer = window.setTimeout(expireSession, millisecondsUntilExpiry);
          }
        }
      } catch {
        // Corrupt cache — require re-login.
        expireSession();
      }
    }
    setIsLoading(false);

    window.addEventListener("staye:session-expired", expireSession);
    return () => {
      window.removeEventListener("staye:session-expired", expireSession);
      if (expiryTimer) window.clearTimeout(expiryTimer);
    };
  }, []);

  function persistSession(token, profile) {
    localStorage.setItem("staye_token", token);
    localStorage.setItem("staye_user", JSON.stringify(profile));
    setUser(profile);
  }

  async function login(email, password) {
    const { token, user: profile } = await loginUser({ email, password });
    persistSession(token, profile);
    return profile;
  }

   // 2. ADD THIS NEW GOOGLE LOGIN HANDLER HERE
  async function loginGoogle(googleToken) {
    const { token, user: profile } = await loginwithGoogle(googleToken);
    persistSession(token, profile);
    return profile;
  }

  async function loginHostGoogle(googleToken) {
    const { token, user: profile } = await loginHostWithGoogle(googleToken);
    persistSession(token, profile);
    return profile;
  }

  async function registerHostGoogle(googleToken) {
    const { token, user: profile } = await registerHostWithGoogle(googleToken);
    persistSession(token, profile);
    return profile;
  }

  async function registerHost(name, email, password) {
    const { token, user: profile } = await registerHostRequest({ name, email, password });
    persistSession(token, profile);
    return profile;
  }

  async function register(name, email, password) {
    const { token, user: profile } = await registerUser({ name, email, password });
    persistSession(token, { ...profile, role: profile.role || "guest" });
    return profile;
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || "guest",
        isHost: user?.role === "host" || user?.role === "admin" || (!user?.role && !!user?.isAdmin),
        isSuperAdmin: user?.role === "admin",
        isLoading,
        login,
        register,
        logout,
        loginGoogle,
        loginHostGoogle,
        registerHostGoogle,
        registerHost,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
