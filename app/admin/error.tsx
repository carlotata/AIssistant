"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center p-8 text-center bg-[#f8fafc] dark:bg-slate-950">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Something went wrong!</h2>
      <p className="mt-2 text-slate-600 dark:text-slate-400">{error.message || "An unexpected error occurred."}</p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
