import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-2 font-black tracking-tight ${className}`}>
      <div className={`flex items-center justify-center rounded-xl bg-linear-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30 ${iconSizes[size]}`}>
        <svg
          className="h-[60%] w-[60%] text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      <span className={`text-white ${textSizes[size]}`}>
        AI<span className="bg-linear-to-tr from-blue-600 to-indigo-500 bg-clip-text text-transparent">ssistant</span>
      </span>
    </div>
  );
}
