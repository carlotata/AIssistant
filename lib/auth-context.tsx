"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, ApiError } from "./api";

export interface Student {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  student: Student | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and check if user has an active session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        // Fetch CSRF first (sets the aissistant_csrf cookie)
        await apiFetch<{ csrfToken: string }>("/auth/csrf");
        
        // Then retrieve current student session
        const data = await apiFetch<{ student: Student }>("/auth/me");
        setStudent(data.student);
      } catch (err) {
        // Safe to ignore on mount (means student is guest)
        setStudent(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  async function login(email: string, password: string) {
    setError(null);
    try {
      // First ensure we have a fresh CSRF cookie
      await apiFetch<{ csrfToken: string }>("/auth/csrf");
      
      const data = await apiFetch<{ student: Student }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setStudent(data.student);
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
      // First ensure we have a fresh CSRF cookie
      await apiFetch<{ csrfToken: string }>("/auth/csrf");
      
      const data = await apiFetch<{ student: Student }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setStudent(data.student);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "EMAIL_ALREADY_REGISTERED") {
          throw new Error("A student with this email already exists");
        }
        throw new Error(err.message);
      }
      throw new Error("An unexpected error occurred during registration");
    }
  }

  async function logout() {
    try {
      await apiFetch<void>("/auth/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Logout request failed, clearing local state", err);
    } finally {
      setStudent(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        student,
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
