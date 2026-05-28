"use client";

import { useEffect } from "react";

interface ToastProps {
    message: string;
    onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 right-4 z-[9999] bg-slate-900 border border-slate-700 text-white px-4 py-3 sm:px-8 sm:py-4 rounded-xl shadow-2xl transition-all duration-300 ease-out translate-x-0 opacity-100 text-sm sm:text-base font-bold flex items-center gap-3 pointer-events-none max-w-[calc(100vw-2rem)]">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
            {message}
        </div>
    );
}
