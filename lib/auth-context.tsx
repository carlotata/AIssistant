"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, ApiError, ensureCsrfToken, logoutRequest } from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and check if user has an active session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        await ensureCsrfToken();
        
        // Then retrieve current user session
        const data = await apiFetch<{ student?: User; user?: User }>("/auth/me");
        setUser(data.user || data.student || null);
      } catch {
        // Safe to ignore on mount (means user is guest)
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  async function login(email: string, password: string) {
    setError(null);
    try {
      await ensureCsrfToken();
      
      const data = await apiFetch<{ student?: User; user?: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user || data.student || null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "INVALID_CREDENTIALS") {
          throw new Error("Invalid email or password");
        }
        throw new Error(err.message);
      }
      throw new Error("An unexpected error occurred during login");
    }
  }

  async function register(name: string, email: string, password: string) {
    setError(null);
    try {
      await ensureCsrfToken();
      
      const data = await apiFetch<{ student?: User; user?: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setUser(data.user || data.student || null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "EMAIL_ALREADY_REGISTERED") {
          throw new Error("A user with this email already exists");
        }
        throw new Error(err.message);
      }
      throw new Error("An unexpected error occurred during registration");
    }
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch (err) {
      console.error("Logout request failed, clearing local state", err);
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        error,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
