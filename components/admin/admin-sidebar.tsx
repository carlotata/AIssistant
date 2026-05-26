import { UsersIcon, SettingsIcon, LogsIcon } from "../icons/admin-icons";

type AdminSidebarProps = {
    onNavigate: (view: string) => void;
    onLogout: () => void;
};

export function AdminSidebar({ onNavigate, onLogout }: AdminSidebarProps) {
    return (
        <aside className="w-80 border-r border-white/5 bg-slate-900 p-4 flex flex-col h-screen">
            <div className="mb-8 px-4 font-bold text-xl flex items-center gap-2 text-white">
                AIssistant Admin
            </div>

            <nav className="flex-1 space-y-1">
                <button onClick={() => onNavigate("users")} className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer">
                    <UsersIcon className="h-4 w-4" />
                    User Management
                </button>
                <button onClick={() => onNavigate("logs")} className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer">
                    <LogsIcon className="h-4 w-4" />
                    System Logs
                </button>
            </nav>

            <div className="mt-4 pt-4 border-t border-white/5">
                <button onClick={onLogout} className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors cursor-pointer">
                    <span>Log Out</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        </aside>
    );
}
