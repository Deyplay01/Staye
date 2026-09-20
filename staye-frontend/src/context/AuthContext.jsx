import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, clearSession, loginwithGoogle, loginAdminWithGoogle, registerAdminWithGoogle } from "../api/auth";

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
        setUser(JSON.parse(userRaw));
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

  async function loginAdminGoogle(googleToken) {
    const { token, user: profile } = await loginAdminWithGoogle(googleToken);
    persistSession(token, profile);
    return profile;
  }

  async function registerAdminGoogle(googleToken, registrationKey) {
    const { token, user: profile } = await registerAdminWithGoogle(googleToken, registrationKey);
    persistSession(token, profile);
    return profile;
  }

  async function register(name, email, password) {
    const { token, user: profile } = await registerUser({ name, email, password });
    // The register endpoint doesn't return isAdmin — new accounts are never admins anyway.
    persistSession(token, { ...profile, isAdmin: false });
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
        isAdmin: !!user?.isAdmin,
        isLoading,
        login,
        register,
        logout,
        loginGoogle,
        loginAdminGoogle,
        registerAdminGoogle,
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
