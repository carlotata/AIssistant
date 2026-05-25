import { useState, useRef, useEffect } from "react";
import { ChatIcon, ClockIcon, ListChecksIcon, TrendUpIcon } from "../icons/dashboard-icons";
import { TrashIcon } from "../icons/trash-icon";
import type { Quiz, Conversation } from "@/types/dashboard";

type ChatSidebarProps = {
    conversations: Conversation[];
    quizzes: Quiz[];
    onSelectConversation: (conversation: Conversation) => void;
    onNewChat: () => void;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    onRetakeQuiz: (topic: string) => void;
    onTakeQuiz: (quizId: number) => void;
    onDeleteConversation: (id: number) => void;
    onDeleteQuiz: (id: number) => void;
};

function OptionsMenu({ 
    onTake, 
    onRetake, 
    onViewResults,
    onDelete 
}: { 
    onTake?: () => void, 
    onRetake?: () => void, 
    onViewResults?: () => void,
    onDelete: () => void 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-500 hover:text-white p-1">
                •••
            </button>
            {isOpen && (
                <div className="absolute right-0 top-6 w-32 bg-slate-800 rounded-lg shadow-xl border border-white/10 z-50 overflow-hidden">
                    {onTake && (
                        <button onClick={() => { onTake(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-indigo-400 hover:bg-slate-700 font-bold">Take Now</button>
                    )}
                    {onViewResults && (
                        <button onClick={() => { onViewResults(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-emerald-400 hover:bg-slate-700 font-bold">View Results</button>
                    )}
                    {onRetake && (
                        <button onClick={() => { onRetake(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-indigo-400 hover:bg-slate-700 font-bold">Retake</button>
                    )}
                    <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-slate-700 font-bold">Delete</button>
                </div>
            )}
        </div>
    );
}

export function ChatSidebar({ conversations, quizzes, onSelectConversation, onNewChat, onNavigate, onLogout, onRetakeQuiz, onTakeQuiz, onDeleteConversation, onDeleteQuiz }: ChatSidebarProps) {
    return (
        <aside className="w-80 border-r border-white/5 bg-slate-900 p-4 flex flex-col">
            <div className="mb-8 px-4 font-bold text-xl flex items-center gap-2">
                <ChatIcon className="h-6 w-6" />
                AIssistant
            </div>

            <button onClick={onNewChat} className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500">
                New Chat +
            </button>

            <nav className="mb-8 space-y-1">
                <button onClick={() => onNavigate("dashboard")} className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
                    <ChatIcon className="h-4 w-4" />
                    Dashboard
                </button>
                <button onClick={() => onNavigate("quiz")} className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
                    <ListChecksIcon className="h-4 w-4" />
                    Quizzes
                </button>
                <button onClick={() => onNavigate("progress")} className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
                    <TrendUpIcon className="h-4 w-4" />
                    Progress
                </button>
            </nav>

            <div className="flex-1 overflow-y-auto space-y-6">
                <section>
                    <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Recent Quizzes</h3>
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="flex items-center justify-between px-4 py-2 text-sm text-slate-400 hover:bg-slate-800/50 rounded-lg group transition-colors">
                            <span className="truncate flex-1">{quiz.quizTopic}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <OptionsMenu 
                                    onTake={quiz.state !== 'COMPLETED' ? () => onTakeQuiz(quiz.id) : undefined}
                                    onViewResults={quiz.state === 'COMPLETED' ? () => onTakeQuiz(quiz.id) : undefined}
                                    onRetake={quiz.state === 'COMPLETED' ? () => onRetakeQuiz(quiz.quizTopic) : undefined} 
                                    onDelete={() => onDeleteQuiz(quiz.id)} 
                                />
                            </div>
                        </div>
                    ))}
                </section>
                <section>
                    <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Chat History</h3>
                    {conversations.map((conv) => (
                        <div key={conv.id} className="flex items-center justify-between px-4 py-2 text-sm text-slate-400 hover:bg-slate-800/50 rounded-lg group transition-colors">
                            <button onClick={() => onSelectConversation(conv)} className="flex-1 text-left truncate hover:text-white transition-colors">
                                {conv.title}
                            </button>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <OptionsMenu onDelete={() => onDeleteConversation(conv.id)} />
                            </div>
                        </div>
                    ))}
                </section>
            </div>

            
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                <a href="mailto:carlaviso040@gmail.com" className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Help Center
                </a>
                <button onClick={onLogout} className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors">
                    <span>Log Out</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        </aside>
    );
}
