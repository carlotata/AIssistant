import { useState, useRef, useEffect } from "react";
import { ChatIcon, ClockIcon, ListChecksIcon, TrendUpIcon } from "../icons/dashboard-icons";
import { TrashIcon } from "../icons/trash-icon";
import type { Quiz, Conversation } from "@/types/dashboard";
import { Logo } from "@/components/shared/logo";

type ChatSidebarProps = {
    conversations: Conversation[];
    quizzes: Quiz[];
    currentView: string;
    isOpen?: boolean;
    onClose?: () => void;
    onSelectConversation: (conversation: Conversation) => void;
    onNewChat: () => void;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    onRetakeQuiz: (quizId: number) => Promise<void>;
    onTakeQuiz: (quizId: number) => void;
    onDeleteConversation: (id: number) => void;
    onDeleteQuiz: (id: number) => void;
};

function OptionsMenu({ 
    onTake, 
    onRetake, 
    onViewResults,
    onView,
    onDelete 
}: { 
    onTake?: () => void, 
    onRetake?: () => void, 
    onViewResults?: () => void,
    onView?: () => void,
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
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-500 hover:text-white p-1 cursor-pointer">
                •••
            </button>
            {isOpen && (
                <div className="absolute right-0 top-6 w-32 bg-slate-800 rounded-lg shadow-xl border border-white/10 z-50 overflow-hidden">
                    {onTake && (
                        <button onClick={() => { onTake(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-indigo-400 hover:bg-slate-700 font-bold cursor-pointer">Take Now</button>
                    )}
                    {onViewResults && (
                        <button onClick={() => { onViewResults(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-emerald-400 hover:bg-slate-700 font-bold cursor-pointer">View Results</button>
                    )}
                    {onRetake && (
                        <button onClick={() => { onRetake(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-indigo-400 hover:bg-slate-700 font-bold cursor-pointer">Retake</button>
                    )}
                    {onView && (
                        <button onClick={() => { onView(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-slate-700 font-bold cursor-pointer">View Now</button>
                    )}
                    <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-slate-700 font-bold cursor-pointer">Delete</button>
                </div>
            )}
        </div>
    );
}

export function ChatSidebar({ conversations, quizzes, currentView, isOpen, onClose, onSelectConversation, onNewChat, onNavigate, onLogout, onRetakeQuiz, onTakeQuiz, onDeleteConversation, onDeleteQuiz }: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [quizzesExpanded, setQuizzesExpanded] = useState(true);
    const [chatsExpanded, setChatsExpanded] = useState(true);
    
    const navLinkClass = (view: string) => 
        `flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors cursor-pointer ${currentView === view ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`;

    const filteredConversations = conversations.filter(c => 
        (c.title || "Untitled Chat").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredQuizzes = quizzes.filter(q => 
        q.quizTopic.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Auto-expand on search
    useEffect(() => {
        if (searchQuery.trim()) {
            setQuizzesExpanded(true);
            setChatsExpanded(true);
        }
    }, [searchQuery]);

    return (
        <aside className={`fixed inset-y-0 left-0 z-30 w-full lg:w-72 border-r border-white/5 bg-slate-900 p-4 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="mb-8 px-2 flex items-center justify-between">
                <Logo size="md" />
                <button 
                    onClick={onClose}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer lg:hidden"
                    aria-label="Close sidebar"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <button onClick={onNewChat} className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-indigo-500 cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                New Chat +
            </button>

            <nav className="mb-6 space-y-1">
                <button onClick={() => onNavigate("dashboard")} className={navLinkClass("dashboard")}>
                    <ChatIcon className="h-4 w-4" />
                    Dashboard
                </button>
                <button onClick={() => onNavigate("quiz")} className={navLinkClass("quiz")}>
                    <ListChecksIcon className="h-4 w-4" />
                    Quizzes
                </button>
                <button onClick={() => onNavigate("progress")} className={navLinkClass("progress")}>
                    <TrendUpIcon className="h-4 w-4" />
                    Progress
                </button>
            </nav>

            {/* Sidebar Search */}
            <div className="mb-6 px-2">
                <div className="relative group">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your history..."
                        className="w-full rounded-xl bg-slate-950 border border-white/5 px-10 py-3 text-xs text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
                {/* Collapsible Quizzes Section */}
                <section>
                    <button 
                        onClick={() => setQuizzesExpanded(!quizzesExpanded)}
                        className="w-full px-2 flex items-center justify-between py-2 group cursor-pointer hover:bg-white/[0.02] rounded-lg transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <svg className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${quizzesExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-200">Quizzes</h3>
                        </div>
                        {filteredQuizzes.length > 0 && <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{filteredQuizzes.length}</span>}
                    </button>
                    
                    {quizzesExpanded && (
                        <div className="space-y-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            {filteredQuizzes.length === 0 ? (
                                <p className="px-7 text-[10px] text-slate-600 italic">{searchQuery ? "No matches found" : "No quizzes yet"}</p>
                            ) : filteredQuizzes.map((quiz) => (
                                <div key={quiz.id} className="pl-5">
                                    <QuizSidebarItem 
                                        quiz={quiz} 
                                        onTakeQuiz={onTakeQuiz} 
                                        onRetakeQuiz={onRetakeQuiz} 
                                        onDeleteQuiz={onDeleteQuiz} 
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Collapsible Chat History Section */}
                <section>
                    <button 
                        onClick={() => setChatsExpanded(!chatsExpanded)}
                        className="w-full px-2 flex items-center justify-between py-2 group cursor-pointer hover:bg-white/[0.02] rounded-lg transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <svg className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${chatsExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-200">Chat History</h3>
                        </div>
                        {filteredConversations.length > 0 && <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{filteredConversations.length}</span>}
                    </button>

                    {chatsExpanded && (
                        <div className="space-y-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            {filteredConversations.length === 0 ? (
                                <p className="px-7 text-[10px] text-slate-600 italic">{searchQuery ? "No matches found" : "No history yet"}</p>
                            ) : filteredConversations.map((conv) => (
                                <div key={conv.id} className="pl-5 pr-2">
                                    <div className="flex items-center justify-between px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 rounded-lg group transition-colors">
                                        <button onClick={() => onSelectConversation(conv)} className="flex-1 text-left truncate hover:text-white transition-colors cursor-pointer">
                                            {conv.title || "Untitled Chat"}
                                        </button>
                                        <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <OptionsMenu onView={() => onSelectConversation(conv)} onDelete={() => onDeleteConversation(conv.id)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            
            <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
                <a href="mailto:support@aissistant.ai" className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Help Center
                </a>
                <button onClick={onLogout} className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors cursor-pointer">
                    <span>Log Out</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        </aside>
    );
}

function QuizSidebarItem({ quiz, onTakeQuiz, onRetakeQuiz, onDeleteQuiz }: { quiz: Quiz, onTakeQuiz: (id: number) => void, onRetakeQuiz: (quizId: number) => Promise<void>, onDeleteQuiz: (id: number) => void }) {
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleRetake = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            await onRetakeQuiz(quiz.id);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex items-center justify-between px-4 py-2 text-sm text-slate-400 hover:bg-slate-800/50 rounded-lg group transition-colors">
            <button 
                onClick={() => !isGenerating && onTakeQuiz(quiz.id)} 
                className={`truncate flex-1 text-left transition-colors cursor-pointer ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
                disabled={isGenerating}
            >
                {quiz.quizTopic}
            </button>
            <div className="flex items-center">
                {isGenerating ? (
                    <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                    <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <OptionsMenu 
                            onTake={quiz.state !== 'COMPLETED' ? () => onTakeQuiz(quiz.id) : undefined}
                            onViewResults={quiz.state === 'COMPLETED' ? () => onTakeQuiz(quiz.id) : undefined}
                            onRetake={quiz.state === 'COMPLETED' ? handleRetake : undefined} 
                            onDelete={() => onDeleteQuiz(quiz.id)} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
