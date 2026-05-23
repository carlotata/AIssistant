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

   if (icon === "tasks") {
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
      <header className="relative z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
         <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-10">
               <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
                     <SparklesIcon className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-semibold tracking-tight text-slate-900">
                     AIssistant
                  </span>
               </div>

               <nav
                  className="hidden items-center gap-2 md:flex"
                  aria-label="Dashboard sections">
                  {tabs.map((tab) => {
                     const isActive = tab.id === activeTabId;

                     return (
                        <button
                           key={tab.id}
                           type="button"
                           onClick={() => onTabChange(tab.id)}
                           className={[
                              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-base font-medium transition",
                              isActive
                                 ? "bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_#dbeafe]"
                                 : "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
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
                  className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-base font-semibold text-white shadow-md shadow-blue-500/10 transition hover:scale-105 active:scale-95"
                  aria-label="Open profile">
                  {initials}
               </button>

               {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-100 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                     <div className="mb-3 px-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                           {student?.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                           {student?.email}
                        </p>
                     </div>
                     <div className="my-2 border-t border-slate-100" />
                     <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700">
                        <svg
                           className="h-4 w-4"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24">
                           <path
                             strokeLinecap="round"
                             strokeLinejoin="round"
                             strokeWidth="2"
                             d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                           />
                        </svg>
                        Log Out
                     </button>
                  </div>
               )}
            </div>
         </div>
      </header>
   );
}

