"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { apiFetch, ensureCsrfToken } from "@/lib/api";
import { createInitialMessages, QUICK_ACTIONS } from "@/constants/dashboard";
import { AssistantChatPanel } from "./assistant-chat-panel";
import { ChatSidebar } from "./chat-sidebar";
import { ChatIcon, ListChecksIcon, TrendUpIcon } from "../icons/dashboard-icons";
import { QuizView } from "./quiz-view";
import { ProgressView } from "./progress-view";
import { AIDashboardPanel } from "./ai-dashboard-panel";
import type { ChatMessage, DashboardSummary, Quiz, StudyProgress, Conversation, Message, DeleteTarget } from "@/types/dashboard";
import { useAuth } from "@/lib/auth-context";
import { getGreeting } from "@/constants/greetings";

import { useFileUpload, type UploadedFile } from "@/lib/use-file-upload";

function createMessageId() {
   return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function averageScoreLabel(score: number) {
   return `${Math.round(score)}%`;
}

function Metric({ label, value, icon, onClick }: { label: string; value: string; icon?: React.ReactNode; onClick?: () => void }) {
   return (
      <button 
        onClick={onClick}
        className="group flex min-h-24 min-w-0 flex-col items-center justify-between gap-4 rounded-xl border border-white/5 bg-slate-900 p-6 shadow-sm transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-800 sm:flex-row sm:items-center w-full text-center sm:text-left cursor-pointer"
      >
         <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-400 transition-colors group-hover:bg-indigo-500 group-hover:text-white shadow-inner">
            {icon ?? <TrendUpIcon className="h-7 w-7" />}
         </div>
         <div className="min-w-0 sm:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 group-hover:text-indigo-300">{label}</p>
            <p className="mt-1 text-3xl font-black tabular-nums text-white">{value}</p>
         </div>
      </button>
   );
}

function ProgressCards({ progress, onNavigate }: { progress: StudyProgress, onNavigate: (view: string) => void }) {
   return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 w-full">
         <Metric label="Topics Mastered" value={progress.completedTopics.toString()} icon={<ChatIcon className="h-7 w-7" />} onClick={() => onNavigate("progress")} />
         <Metric label="Quizzes Taken" value={progress.totalQuizzes.toString()} icon={<ListChecksIcon className="h-7 w-7" />} onClick={() => onNavigate("quiz")} />
         <Metric label="Avg Accuracy" value={averageScoreLabel(progress.averageScore)} onClick={() => onNavigate("progress")} />
      </div>
   );
}

export function StudyDashboard() {
   const { logout, user } = useAuth();
   const searchParams = useSearchParams();
   const router = useRouter();
   const pathname = usePathname();
   
   const [activeView, setActiveView] = useState(() => searchParams.get("view") || "chat");
   const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
   const [summary, setSummary] = useState<DashboardSummary | null>(null);
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   const [inputValue, setInputValue] = useState("");
   const [submitting, setSubmitting] = useState(false);
   const [isProcessing, setIsProcessing] = useState(false);
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

   // Session Tracking
   useEffect(() => {
        let sessionId: number | null = null;
        let heartbeatInterval: NodeJS.Timeout | null = null;
        
        async function startSession() {
            try {
                const response = await apiFetch<{sessionId: number}>("/sessions/start", { method: "POST" });
                sessionId = response.sessionId;
                
                // Set up heartbeat
                heartbeatInterval = setInterval(async () => {
                    if (sessionId) {
                        await apiFetch("/sessions/heartbeat", { method: "POST", body: JSON.stringify({ sessionId }) });
                    }
                }, 60000); // 60 seconds
            } catch (err) { console.error("Failed to start session", err); }
        }
        
        async function endSession() {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            if (sessionId) {
                await apiFetch("/sessions/end", { method: "POST", body: JSON.stringify({ sessionId }) });
            }
        }
        
        startSession();
        return () => { endSession(); };
   }, []);

   useEffect(() => {
       const view = searchParams.get("view") || "chat";
       setActiveView(view);
       
       const conversationId = searchParams.get("conversationId");
       if (conversationId && activeConversationId !== parseInt(conversationId)) {
           loadConversation({ id: parseInt(conversationId) } as Conversation);
       }
       setSidebarOpen(false);
   }, [searchParams]);

   async function loadSummary() {
      const data = await apiFetch<DashboardSummary>("/dashboard/summary");
      setSummary(data);
   }

   useEffect(() => {
      void ensureCsrfToken().then(loadSummary);
      
      window.addEventListener('refreshSidebar', loadSummary);
      return () => window.removeEventListener('refreshSidebar', loadSummary);
   }, []);

   const loadConversation = async (conversation: Conversation) => {
       const messages = await apiFetch<Message[]>(`/conversations/${conversation.id}/messages`);
       setMessages(messages.map(m => ({ 
           id: m.id.toString(), 
           role: m.role as "user" | "assistant", 
           content: m.content, 
           conversationId: m.conversationId,
           attachments: m.attachments 
       })));
       setActiveConversationId(conversation.id);
       router.push(`${pathname}?view=chat&conversationId=${conversation.id}`);
       setSidebarOpen(false);
   };

   const pushChatPrompt = async (prompt: string, searchMode: boolean = false, attachments: UploadedFile[] = []) => {
      if (!prompt.trim() && attachments.length === 0) return;
      
      setSubmitting(true);
      const conversationId = activeConversationId ?? 0;
      
      const userMessage: ChatMessage = { 
          id: createMessageId(), 
          role: "user", 
          content: prompt, 
          conversationId,
          attachments: attachments.map(a => ({ name: a.originalName, type: a.mimeType, url: a.url }))
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      try {
         let convId = activeConversationId;
         if (!convId) {
             const conv = await apiFetch<{ conversation: Conversation }>("/conversations", {
                 method: "POST",
                 body: JSON.stringify({ title: prompt.slice(0, 30) || (attachments[0]?.originalName.slice(0, 30)) || "New Chat" }),
             });
             convId = conv.conversation.id;
             setActiveConversationId(convId);
             await loadSummary();
             router.push(`${pathname}?view=chat&conversationId=${convId}`);
         }

         const data = await apiFetch<{ messages: Message[] }> (`/conversations/${convId}/messages`, {
            method: "POST",
            body: JSON.stringify({ 
                content: prompt, 
                searchMode,
                attachments: attachments.map(a => ({
                    name: a.originalName,
                    type: a.mimeType,
                    url: a.url,
                    extractedText: a.extractedText
                }))
            }),
         });
         
         if (data?.messages) {
             const newMessages = data.messages.filter(m => !messages.find(prev => prev.id === m.id.toString()));
             setMessages(prev => [...prev, ...newMessages.map(m => ({ 
                 id: m.id.toString(), 
                 role: m.role as "user" | "assistant", 
                 content: m.content, 
                 conversationId: m.conversationId,
                 attachments: m.attachments 
             }))]);
         }
      } catch (err) {
          setMessages(prev => [...prev, { 
              id: createMessageId(), 
              role: "assistant", 
              content: "I'm sorry, I encountered an error while processing your request. Please try again.", 
              conversationId,
          }]);
      } finally {
         setSubmitting(false);
      }
   };

   function startNewChat() {
       setMessages([]);
       setActiveConversationId(null);
       router.push(`${pathname}?view=chat`);
       setSidebarOpen(false);
   }

   async function handleConfirmDelete() {
       if (!deleteTarget) return;
       const token = await ensureCsrfToken();
       
       if (deleteTarget.type === 'conversation') {
           await apiFetch(`/conversations/${deleteTarget.id}`, { 
               method: "DELETE",
               headers: { 'X-CSRF-Token': token }
           });
           await loadSummary();
           if (activeConversationId === deleteTarget.id) {
               startNewChat();
           }
       } else {
           await apiFetch(`/quizzes/${deleteTarget.id}`, { 
               method: "DELETE",
               headers: { 'X-CSRF-Token': token }
           });
           await loadSummary();
           if (searchParams.get("view") === "quiz" && searchParams.get("quizId") === deleteTarget.id.toString()) {
               router.replace(`${pathname}?view=quiz`);
               window.dispatchEvent(new Event('quizDeleted'));
           }
       }
       window.dispatchEvent(new Event('refreshSidebar'));
       setDeleteTarget(null);
   }

   async function deleteConversation(id: number) {
       setDeleteTarget({ id, type: 'conversation' });
   }

   async function deleteQuiz(id: number) {
       setDeleteTarget({ id, type: 'quiz' });
   }

   return (
      <div className="flex h-screen bg-slate-950 text-white overflow-hidden w-full max-w-[100vw]">
         {deleteTarget && (
             <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                 <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                     <h3 className="text-lg font-bold text-white mb-2">Delete {deleteTarget.type === 'conversation' ? 'Chat' : 'Quiz'}</h3>
                     <p className="text-slate-400 text-sm mb-6">Are you sure? This action cannot be undone.</p>
                     <div className="flex gap-3">
                         <button onClick={() => setDeleteTarget(null)} className="flex-1 p-3 rounded-xl font-bold text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                         <button onClick={handleConfirmDelete} className="flex-1 p-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-500 cursor-pointer">Delete</button>
                     </div>
                 </div>
             </div>
         )}
         <ChatSidebar 
            conversations={summary?.recentConversations ?? []} 
            quizzes={summary?.recentQuizzes ?? []}
            currentView={activeView}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onSelectConversation={loadConversation}
            onNewChat={startNewChat}
            onNavigate={(view) => {
                router.push(`${pathname}?view=${view}`);
                setSidebarOpen(false);
            }}
            onLogout={async () => await logout()}
            onRetakeQuiz={async (quizId) => {
                await ensureCsrfToken();
                const response = await apiFetch<{ quiz: { id: number } }>(`/quizzes/${quizId}/reset`, {
                    method: "POST"
                });
                await loadSummary();
                router.push(`${pathname}?view=quiz&quizId=${response.quiz.id}`);
                setSidebarOpen(false);
            }}
            onTakeQuiz={(id) => {
                router.push(`${pathname}?view=quiz&quizId=${id}`);
                setSidebarOpen(false);
            }}
            onDeleteConversation={deleteConversation}
            onDeleteQuiz={deleteQuiz}
         />
         
         <main className="flex-1 overflow-hidden flex flex-col relative min-w-0">
            <header className="sticky top-0 z-10 border-b border-white/5 p-4 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 rounded-lg hover:bg-white/5 lg:hidden text-slate-400 hover:text-white transition-colors"
                        aria-label="Open sidebar"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h2 className="text-xl font-bold capitalize truncate">{activeView}</h2>
                </div>
            </header>
            
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeView === "dashboard" ? (
                   <div className="p-4 sm:p-8 h-full overflow-y-auto">
                       <div className="flex flex-col gap-8 max-w-7xl mx-auto lg:grid lg:grid-cols-3">
                          <div className="lg:col-span-2 flex flex-col items-center sm:items-stretch space-y-6 sm:space-y-10">
                              <div className="w-full rounded-2xl border border-white/5 bg-linear-to-b from-indigo-600/20 to-transparent p-8 sm:p-10 text-center sm:text-left">
                                  <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">{getGreeting(user?.name)}</h1>
                                  <p className="text-slate-400 mt-3 text-base sm:text-lg max-w-lg mx-auto sm:mx-0">You&apos;ve completed 2 lessons this week. Ready to jump into something new?</p>
                                  <button onClick={() => router.push(`${pathname}?view=chat`)} className="mt-8 px-8 py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer">
                                      Start Study Session
                                  </button>
                              </div>
                              <div className="w-full space-y-4">
                                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center sm:text-left">Your Study Progress</h3>
                                  <ProgressCards 
                                    progress={summary?.studyProgress ?? { id: 0, studentId: 0, completedTopics: 0, totalQuizzes: 0, averageScore: 0, updatedAt: new Date().toISOString() }} 
                                    onNavigate={(view) => router.push(`${pathname}?view=${view}`)}
                                  />
                              </div>
                          </div>
                          <div className="w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
                            <AIDashboardPanel 
                                recommendations={summary?.recommendations ?? []}
                                onTakeQuiz={(topic) => router.push(`${pathname}?view=quiz&topic=${encodeURIComponent(topic)}`)} 
                                onReviewWeakTopics={() => {
                                    const weakTopic = summary?.recommendations?.[0]?.topic;
                                    if (weakTopic) pushChatPrompt(`I want to review and discuss about ${weakTopic} to improve my understanding.`);
                                }}
                            />
                          </div>
                       </div>
                   </div>
                ) : activeView === "chat" ? (
                   <div className="h-full">
                       <AssistantChatPanel
                          messages={messages}
                          inputValue={inputValue}
                          submitting={submitting}
                          className="h-full w-full"
                          quickActions={QUICK_ACTIONS}
                          onInputChange={setInputValue}
                          onSubmitMessage={(content, searchMode, attachments) => { 
                          pushChatPrompt(content, searchMode, attachments); 
                       }}
                          onQuickAction={(a) => pushChatPrompt(a.prompt)}
                          onNavigate={(view) => router.push(`${pathname}?view=${view}`)}
                          recentQuizzes={summary?.recentQuizzes ?? []}
                          user={user}
                       />
                   </div>
                ) : activeView === "quiz" ? (
                    <div className="p-4 sm:p-8 h-full overflow-y-auto">
                        <QuizView 
                            quizzes={summary?.recentQuizzes ?? []}
                            setDeleteTarget={setDeleteTarget} 
                        />
                    </div>
                ) : activeView === "progress" ? (
                    <div className="p-4 sm:p-8 h-full overflow-y-auto">
                        <ProgressView 
                            onNavigate={(view) => router.push(`${pathname}?view=${view}`)} 
                            onResume={() => {
                                const lastConv = summary?.recentConversations[0];
                                if (lastConv) loadConversation(lastConv);
                                else router.push(`${pathname}?view=chat`);
                            }}
                            onStudyTopic={(topic) => {
                                router.push(`${pathname}?view=chat`);
                                pushChatPrompt(`I want to review and discuss about ${topic} to improve my understanding.`);
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">View Not Found</div>
                )}
            </div>
         </main>
      </div>
   );
}
