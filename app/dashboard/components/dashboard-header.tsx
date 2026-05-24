import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
   ChatIcon,
   GridIcon,
   ListChecksIcon,
   SparklesIcon,
   TrendUpIcon,
} from "./dashboard-icons";
import { ThemeToggle } from "./theme-toggle";
import type { DashboardTab } from "./hard-data/dashboard-types";

type DashboardHeaderProps = {
   tabs: DashboardTab[];
   activeTabId: string;
   onTabChange: (tabId: string) => void;
};

function TabIcon({ icon }: Pick<DashboardTab, "icon">) {
   const className = "h-4 w-4";

   if (icon === "dashboard") {
      return <GridIcon className={className} />;
   }

   if (icon === "chat") {
      return <ChatIcon className={className} />;
   }

   if (icon === "quiz") {
      return <ListChecksIcon className={className} />;
   }

   return <TrendUpIcon className={className} />;
}

export function DashboardHeader({
   tabs,
   activeTabId,
   onTabChange,
}: DashboardHeaderProps) {
   const { student, logout } = useAuth();
   const router = useRouter();
   const [menuOpen, setMenuOpen] = useState(false);
   const menuRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
         if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpen(false);
         }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
      };
   }, []);

   const initials = student
      ? student.name
           .split(" ")
           .map((n) => n[0])
           .join("")
           .toUpperCase()
           .slice(0, 2)
      : "ST";

   async function handleLogout() {
      await logout();
      router.push("/login");
   }

   return (
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/70">
         <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-10">
               <div className="flex items-center gap-3 transition-transform hover:scale-105">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
                     <SparklesIcon className="h-6 w-6 animate-pulse" />
                  </div>
                  <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                     AI<span className="brand-text-gradient">ssistant</span>
                  </span>
               </div>

               <nav
                  className="hidden items-center gap-1.5 rounded-[1.25rem] bg-slate-100/50 p-1.5 md:flex dark:bg-slate-900/50"
                  aria-label="Dashboard sections">
                  {tabs.map((tab) => {
                     const isActive = tab.id === activeTabId;

                     return (
                        <button
                           key={tab.id}
                           type="button"
                           onClick={() => onTabChange(tab.id)}
                           className={[
                              "relative inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300",
                              isActive
                                 ? "bg-white text-blue-600 shadow-premium ring-1 ring-slate-200/50 dark:bg-slate-800 dark:text-blue-400 dark:ring-slate-700"
                                 : "text-slate-500 hover:bg-white/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200",
                           ].join(" ")}>
                           <TabIcon icon={tab.icon} />
                           <span>{tab.label}</span>
                        </button>
                     );
                  })}
               </nav>
            </div>

            <div className="relative" ref={menuRef}>
               <div className="flex items-center gap-4">
                  <ThemeToggle />
                  <button
                     type="button"
                     onClick={() => setMenuOpen(!menuOpen)}
                     className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 p-1 pr-4 transition-all hover:border-blue-200 hover:shadow-premium active:scale-95 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-blue-800"
                     aria-label="Open profile">
                     <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-sm font-black text-white shadow-lg dark:from-blue-600 dark:to-indigo-500">
                        {initials}
                     </div>
                     <span className="hidden text-sm font-bold text-slate-700 lg:block dark:text-slate-300">
                        {student?.name.split(" ")[0]}
                     </span>
                     <svg className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                     </svg>
                  </button>
               </div>

               {menuOpen && (
                  <div className="absolute right-0 mt-3 w-72 origin-top-right overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-300 dark:border-slate-800 dark:bg-slate-900">
                     <div className="bg-slate-50/50 p-6 dark:bg-slate-800/50">
                        <div className="flex items-center gap-4">
                           <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-lg font-bold text-white shadow-lg shadow-blue-500/20">
                              {initials}
                           </div>
                           <div className="min-w-0">
                              <p className="text-base font-bold text-slate-900 truncate dark:text-white">
                                 {student?.name}
                              </p>
                              <p className="text-xs font-medium text-slate-500 truncate dark:text-slate-400">
                                 {student?.email}
                              </p>
                           </div>
                        </div>
                     </div>
                     <div className="p-2">
                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                        <button
                           type="button"
                           onClick={handleLogout}
                           className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                           <div className="grid h-8 w-8 place-items-center rounded-xl bg-red-100/50 text-red-500 dark:bg-red-900/30">
                              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                           </div>
                           Log Out
                        </button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </header>
   );
}

