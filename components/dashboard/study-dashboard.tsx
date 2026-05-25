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
import type { ChatMessage, DashboardSummary, Quiz, StudyProgress, Conversation, Message } from "@/types/dashboard";
import { useAuth } from "@/lib/auth-context";

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
        className="group flex min-h-24 min-w-0 flex-col items-start justify-between gap-4 rounded-3xl border border-white/5 bg-slate-900 p-6 shadow-2xl transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-800 sm:flex-row sm:items-center w-full text-left"
      >
         <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-400 transition-colors group-hover:bg-indigo-500 group-hover:text-white shadow-inner">
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
         <Metric label="Topics Mastered" value={progress.completedTopics.toString()} icon={<ChatIcon className="h-7 w-7" />} onClick={() => onNavigate("progress")} />
         <Metric label="Quizzes Taken" value={progress.totalQuizzes.toString()} icon={<ListChecksIcon className="h-7 w-7" />} onClick={() => onNavigate("quiz")} />
         <Metric label="Avg Accuracy" value={averageScoreLabel(progress.averageScore)} onClick={() => onNavigate("progress")} />
      </div>
   );
}

export function StudyDashboard() {
   const { logout } = useAuth();
   const searchParams = useSearchParams();
   const router = useRouter();
   const pathname = usePathname();
   
   const [activeView, setActiveView] = useState(() => searchParams.get("view") || "chat");
   const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
   const [summary, setSummary] = useState<DashboardSummary | null>(null);
   const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
   const [inputValue, setInputValue] = useState("");
   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
       const view = searchParams.get("view") || "chat";
       setActiveView(view);
       
       const conversationId = searchParams.get("conversationId");
       if (conversationId && activeConversationId !== parseInt(conversationId)) {
           loadConversation({ id: parseInt(conversationId) } as Conversation);
       }
   }, [searchParams]);

   async function loadSummary() {
      const data = await apiFetch<DashboardSummary>("/dashboard/summary");
      setSummary(data);
   }

   useEffect(() => {
      void ensureCsrfToken().then(loadSummary);
      
      // Listen for global data refresh requests
      window.addEventListener('refreshSidebar', loadSummary);
      return () => window.removeEventListener('refreshSidebar', loadSummary);
   }, []);

   async function loadConversation(conversation: Conversation) {
       const messages = await apiFetch<Message[]>(`/conversations/${conversation.id}/messages`);
       setMessages(messages.map(m => ({ id: m.id.toString(), role: m.role as "user" | "assistant", content: m.content })));
       setActiveConversationId(conversation.id);
       router.push(`${pathname}?view=chat&conversationId=${conversation.id}`);
   }

   async function pushChatPrompt(prompt: string) {
      if (!prompt.trim() || submitting) return;
      setSubmitting(true);
      setMessages(prev => [...prev, { id: createMessageId(), role: "user", content: prompt }]);
      try {
         let conversationId = activeConversationId;
         if (!conversationId) {
             const conv = await apiFetch<{ conversation: Conversation }>("/conversations", {
                 method: "POST",
                 body: JSON.stringify({ title: prompt.slice(0, 30) }),
             });
             conversationId = conv.conversation.id;
             setActiveConversationId(conversationId);
             await loadSummary();
             router.push(`${pathname}?view=chat&conversationId=${conversationId}`);
         }

         const data = await apiFetch<{ messages: Message[] }> (`/conversations/${conversationId}/messages`, {
            method: "POST",
            body: JSON.stringify({ content: prompt }),
         });
         
         if (data?.messages) {
             const assistantMessage = data.messages.find(m => m.role === 'assistant');
             if (assistantMessage) {
                setMessages(prev => [...prev, { id: assistantMessage.id.toString(), role: "assistant", content: assistantMessage.content }]);
             }
         }
      } finally {
         setSubmitting(false);
      }
   }

   function startNewChat() {
       setMessages(createInitialMessages());
       setActiveConversationId(null);
       router.push(`${pathname}?view=chat`);
   }

   async function deleteConversation(id: number) {
       await apiFetch(`/conversations/${id}`, { method: "DELETE" });
       await loadSummary();
       if (activeConversationId === id) {
           startNewChat();
       }
   }

   async function deleteQuiz(id: number) {
       await apiFetch(`/quizzes/${id}`, { method: "DELETE" });
       await loadSummary();
   }

   return (
      <div className="flex h-screen bg-slate-950 text-white">
         <ChatSidebar 
            conversations={summary?.recentConversations ?? []} 
            quizzes={summary?.recentQuizzes ?? []}
            onSelectConversation={loadConversation}
            onNewChat={startNewChat}
            onNavigate={(view) => router.push(`${pathname}?view=${view}`)}
            onLogout={async () => await logout()}
            onRetakeQuiz={async (topic) => {
                await ensureCsrfToken();
                await apiFetch("/quizzes", {
                    method: "POST",
                    body: JSON.stringify({ quizTopic: topic, questionCount: 5 })
                });
                await loadSummary();
                router.push(`${pathname}?view=quiz`);
            }}
            onTakeQuiz={(id) => router.push(`${pathname}?view=quiz&quizId=${id}`)}
            onDeleteConversation={deleteConversation}
            onDeleteQuiz={deleteQuiz}
         />
         <main className="flex-1 overflow-y-auto flex flex-col">
            <header className="sticky top-0 z-10 border-b border-white/5 p-4 bg-slate-950/80 backdrop-blur-sm">
                <h2 className="text-xl font-bold capitalize">{activeView}</h2>
            </header>
            <div className="p-8 flex-1">
                {activeView === "dashboard" ? (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-8">
                          <div className="rounded-3xl border border-white/5 bg-indigo-600/10 p-8">
                              <h1 className="text-3xl font-black text-white">Welcome Back!</h1>
                              <p className="text-indigo-200 mt-2">Ready to master a new topic? Check your latest progress below or jump into a new quiz.</p>
                          </div>
                          <ProgressCards 
                            progress={summary?.studyProgress ?? { id: 0, studentId: 0, completedTopics: 0, totalQuizzes: 0, averageScore: 0, updatedAt: new Date().toISOString() }} 
                            onNavigate={(view) => router.push(`${pathname}?view=${view}`)}
                          />
                      </div>
                      <AIDashboardPanel 
                        recommendations={summary?.recommendations ?? []}
                        onTakeQuiz={(topic) => router.push(`${pathname}?view=quiz&topic=${encodeURIComponent(topic)}`)} 
                      />
                   </div>
                ) : activeView === "chat" ? (
                   <AssistantChatPanel
                      messages={messages}
                      inputValue={inputValue}
                      submitting={submitting}
                      className="h-full w-full"
                      quickActions={QUICK_ACTIONS}
                      onInputChange={setInputValue}
                      onSubmitMessage={() => { const p = inputValue; setInputValue(""); pushChatPrompt(p); }}
                      onQuickAction={(a) => pushChatPrompt(a.prompt)}
                      onNavigate={(view) => router.push(`${pathname}?view=${view}`)}
                      recentQuizzes={summary?.recentQuizzes ?? []}
                   />
                ) : activeView === "quiz" ? (
                    <QuizView />
                ) : activeView === "progress" ? (
                    <ProgressView 
                        onNavigate={(view) => router.push(`${pathname}?view=${view}`)} 
                        onResume={() => {
                            const lastConv = summary?.recentConversations[0];
                            if (lastConv) loadConversation(lastConv);
                            else router.push(`${pathname}?view=chat`);
                        }}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">View Not Found</div>
                )}
            </div>
         </main>
      </div>
   );
}
