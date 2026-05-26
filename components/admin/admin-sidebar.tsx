import { UsersIcon, SettingsIcon, LogsIcon } from "../icons/admin-icons";
import { Logo } from "@/components/shared/logo";

type AdminSidebarProps = {
    onNavigate: (view: string) => void;
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
    currentView?: string;
};

export function AdminSidebar({ onNavigate, onLogout, isOpen, onClose, currentView }: AdminSidebarProps) {
    const navLinkClass = (view: string) => 
        `flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors cursor-pointer ${currentView === view ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`;

    return (
        <aside className={`fixed inset-y-0 left-0 z-30 w-full lg:w-72 border-r border-white/5 bg-slate-900 p-4 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="mb-8 px-4 flex items-center justify-between">
                <Logo size="md" />
                <button 
                    onClick={onClose}
                    className="p-2 rounded-xl bg-slate-800 lg:hidden text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                    aria-label="Close sidebar"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <nav className="flex-1 space-y-1">
                <button onClick={() => onNavigate("users")} className={navLinkClass("users")}>
                    <UsersIcon className="h-4 w-4" />
                    User Management
                </button>
                <button onClick={() => onNavigate("logs")} className={navLinkClass("logs")}>
                    <LogsIcon className="h-4 w-4" />
                    System Logs
                </button>
            </nav>

            <div className="mt-4 pt-4 border-t border-white/5">
                <button onClick={onLogout} className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors cursor-pointer group">
                    <span>Log Out</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        </aside>
    );
}
