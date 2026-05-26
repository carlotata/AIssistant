"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { z } from "zod";
import { Logo } from "@/components/shared/logo";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name."),
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(user.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [user, authLoading, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    const result = registerSchema.safeParse({ name, email, password, confirmPassword });
    
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message || "Invalid input");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        setValidationError(err.message);
      } else {
        setValidationError("An error occurred during registration. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" className="mb-4" />
          <p className="mt-2 text-sm text-slate-400">
            Create your account to start studying smarter
          </p>
        </div>

        {/* Glassmorphic Register Card */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/15">
          <form onSubmit={handleSubmit} className="space-y-5">
            {validationError && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{validationError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Student"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@example.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 focus:border-blue-500/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-500 py-4 font-bold text-white shadow-lg shadow-blue-500/25 transition duration-300 hover:scale-[1.02] hover:from-blue-500 hover:to-indigo-400 active:scale-[0.98] disabled:scale-100 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <span>Register as Student</span>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-400 hover:text-blue-300 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
