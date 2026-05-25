import { useEffect, useRef } from "react";
import { SendIcon, SparklesIcon } from "../icons/dashboard-icons";
import type { ChatMessage, QuickAction, Quiz } from "@/types/dashboard";
import { apiFetch, ensureCsrfToken } from "@/lib/api";

// Helper to strip markdown
function stripMarkdown(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1')     // Remove italics
        .replace(/### (.*)/g, '$1')      // Remove headers
        .replace(/## (.*)/g, '$1')
        .replace(/# (.*)/g, '$1')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1'); // Convert links to text
}

type AssistantChatPanelProps = {
   messages: ChatMessage[];
   inputValue: string;
   submitting?: boolean;
   className?: string;
   quickActions: QuickAction[];
   onInputChange: (value: string) => void;
   onSubmitMessage: () => void;
   onQuickAction: (action: QuickAction) => void;
   onNavigate: (view: string) => void;
   recentQuizzes: Quiz[];
};

export function AssistantChatPanel({
   messages,
   inputValue,
   submitting = false,
   className = "",
   quickActions,
   onInputChange,
   onSubmitMessage,
   onQuickAction,
   onNavigate,
   recentQuizzes,
}: AssistantChatPanelProps) {
   const messagesEndRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);

   // Helper to find the latest assistant message with a topic
   const getLatestQuizContext = () => {
       const allMessages = [...messages].reverse();
       
       let topic = "General Study Topic";
       let count = 5;

       for (const msg of allMessages) {
           const topicMatch = msg.content.match(/(?:topic|about|on) ([\w\s]+)/i);
           const countMatch = msg.content.match(/(\d+)\s*questions?/i);
           
           if (topicMatch && topic === "General Study Topic") {
               topic = topicMatch[1].trim();
           }
           if (countMatch && count === 5) {
               count = parseInt(countMatch[1]);
           }
           
           if (topic !== "General Study Topic" && count !== 5) break;
       }
       return { topic, count };
   };

   const context = getLatestQuizContext();
   const isQuizCreated = recentQuizzes.some(q => q.quizTopic.toLowerCase().includes(context.topic.toLowerCase()));

   return (
      <section className={`flex flex-col overflow-hidden bg-slate-900 ${className}`}>
         <header className="border-b border-white/5 px-6 py-4 flex items-center gap-3">
             <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/20 text-indigo-400">
                 <SparklesIcon className="h-6 w-6" />
             </div>
             <h2 className="text-lg font-bold text-white">Study Assistant</h2>
         </header>

         <div className="flex-1 space-y-8 overflow-y-auto px-6 py-10">
            {messages.map((message) => {
                const isAssistant = message.role === "assistant";
                return (
                    <div key={message.id} className={isAssistant ? "flex items-start gap-4" : "flex justify-end"}>
                        {isAssistant && (
                            <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner">
                                <SparklesIcon className="h-5 w-5" />
                            </div>
                        )}
                        <div className={[
                            "max-w-[85%] rounded-2xl px-6 py-4 text-[15px] leading-relaxed shadow-sm",
                            isAssistant 
                                ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700" 
                                : "bg-indigo-600 text-white rounded-br-none shadow-indigo-900/20"
                        ].join(" ")}>
                            <div className="whitespace-pre-wrap">
                                {stripMarkdown(message.content)}
                            </div>
                            {isAssistant && message.content.toLowerCase().includes("take quiz now") && (
                                <button 
                                    onClick={async (e) => {
                                        const btn = e.currentTarget;
                                        btn.innerText = "Generating Quiz...";
                                        btn.disabled = true;
                                        
                                        const context = getLatestQuizContext();
                                        await ensureCsrfToken();
                                        const response = await apiFetch<{ quiz: { id: number } }>("/quizzes", {
                                            method: "POST",
                                            body: JSON.stringify({ quizTopic: context.topic, questionCount: context.count })
                                        });
                                        // Force refresh sidebar
                                        window.dispatchEvent(new Event('refreshSidebar'));
                                        // Navigate directly to the newly created quiz
                                        onNavigate(`quiz&quizId=${response.quiz.id}`);
                                    }}
                                    disabled={isQuizCreated}
                                    className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                                >
                                    {isQuizCreated ? "Quiz Already Created" : "Take Quiz Now"}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
            {submitting && (
                <div className="flex items-start gap-4">
                    <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-800 text-indigo-400 border border-slate-700 shadow-inner">
                        <SparklesIcon className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none border border-slate-700 bg-slate-800 px-5 py-4 shadow-sm">
                        <div className="flex gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" /><span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" /><span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" /></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         <footer className="border-t border-white/5 p-6 bg-slate-900">
            <div className="relative flex items-center rounded-xl border border-slate-700 bg-slate-800 p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
               <input
                  value={inputValue}
                  onChange={(event) => onInputChange(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onSubmitMessage(); } }}
                  disabled={submitting}
                  placeholder="Send a message..."
                  className="flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
               />
               <button
                  type="button"
                  onClick={onSubmitMessage}
                  disabled={submitting || !inputValue.trim()}
                  className="p-1.5 text-indigo-400 hover:text-white disabled:opacity-40"
                  aria-label="Send message">
                  <SendIcon className="h-5 w-5" />
               </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
               {quickActions.map((action) => (
                  <button
                     key={action.id}
                     type="button"
                     onClick={() => onQuickAction(action)}
                     className="rounded-xl border border-white/5 bg-slate-800 px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all hover:bg-indigo-500 hover:text-white">
                     {action.label}
                  </button>
               ))}
            </div>
         </footer>
      </section>
   );
}
