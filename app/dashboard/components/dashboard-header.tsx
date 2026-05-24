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
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
         <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-10">
               <div className="flex items-center gap-3 transition-transform hover:scale-105">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
                     <SparklesIcon className="h-5 w-5 animate-pulse" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-slate-900">
                     AI<span className="brand-text-gradient">ssistant</span>
                  </span>
               </div>

               <nav
                  className="hidden items-center gap-1 rounded-2xl bg-slate-100/50 p-1.5 md:flex"
                  aria-label="Dashboard sections">
                  {tabs.map((tab) => {
                     const isActive = tab.id === activeTabId;

                     return (
                        <button
                           key={tab.id}
                           type="button"
                           onClick={() => onTabChange(tab.id)}
                           className={[
                              "relative inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200",
                              isActive
                                 ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50"
                                 : "text-slate-500 hover:bg-white/50 hover:text-slate-900",
                           ].join(" ")}>
                           <TabIcon icon={tab.icon} />
                           <span>{tab.label}</span>
                        </button>
                     );
                  })}
               </nav>
            </div>

            <div className="relative" ref={menuRef}>
               <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1 pr-3 transition-all hover:border-blue-200 hover:shadow-md active:scale-95"
                  aria-label="Open profile">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 text-sm font-bold text-blue-600 shadow-inner">
                     {initials}
                  </div>
                  <span className="hidden text-sm font-medium text-slate-700 lg:block">
                     {student?.name.split(" ")[0]}
                  </span>
                  <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
               </button>

               {menuOpen && (
                  <div className="absolute right-0 mt-3 w-72 origin-top-right overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-300">
                     <div className="bg-slate-50/50 p-6">
                        <div className="flex items-center gap-4">
                           <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-lg font-bold text-white shadow-lg shadow-blue-500/20">
                              {initials}
                           </div>
                           <div className="min-w-0">
                              <p className="text-base font-bold text-slate-900 truncate">
                                 {student?.name}
                              </p>
                              <p className="text-xs font-medium text-slate-500 truncate">
                                 {student?.email}
                              </p>
                           </div>
                        </div>
                     </div>
                     <div className="p-2">
                        <div className="my-1 border-t border-slate-100" />
                        <button
                           type="button"
                           onClick={handleLogout}
                           className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600">
                           <div className="grid h-8 w-8 place-items-center rounded-xl bg-red-100/50 text-red-500">
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

