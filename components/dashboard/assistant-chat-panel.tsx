import { useEffect, useRef, useState } from "react";
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

// Scoped topic parsing
const getQuizTopicForMessage = (messages: ChatMessage[], messageIndex: number) => {
    const precedingMessages = messages.slice(0, messageIndex + 1).reverse();
    for (const msg of precedingMessages) {
        const topicMatch = msg.content.match(/(?:topic|about|on)\s+([a-zA-Z0-9\s]+?)(?=\.|\?|!|$)/i);
        if (topicMatch) return topicMatch[1].trim();
    }
    return "General Study Topic";
};

// Scoped count parsing
const getQuizCountForMessage = (messages: ChatMessage[], messageIndex: number) => {
    const precedingMessages = messages.slice(0, messageIndex + 1).reverse();
    for (const msg of precedingMessages) {
        const countMatch = msg.content.match(/(\d+)\s*questions?/i);
        if (countMatch) return parseInt(countMatch[1]);
    }
    return 5;
};

function QuizGeneratorButton({ topic, count, conversationId, onNavigate, recentQuizzes }: { topic: string, count: number, conversationId: number, onNavigate: (v: string) => void, recentQuizzes: Quiz[] }) {
    const [quizQuestionCount, setQuizQuestionCount] = useState(count);
    const [isLocalCreated, setIsLocalCreated] = useState(false);
    
    // Find if a quiz already exists for this topic and conversation
    const existingQuiz = recentQuizzes.find(q => 
        q.quizTopic.toLowerCase().includes(topic.toLowerCase()) && 
        Number((q as any).conversationId) === Number(conversationId)
    );

    const isCreated = isLocalCreated || !!existingQuiz;

    return (
        <div className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-white/5 space-y-3">
            <label className="block text-slate-400 font-bold text-xs uppercase tracking-widest">
                Questions: {quizQuestionCount}
            </label>
            <input 
                type="range" 
                min="1" 
                max="10" 
                value={quizQuestionCount} 
                onChange={e => setQuizQuestionCount(parseInt(e.target.value))} 
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
            />
            
            {isCreated ? (
                existingQuiz && existingQuiz.state === 'COMPLETED' ? (
                    <button 
                        onClick={() => onNavigate(`quiz&quizId=${existingQuiz.id}`)}
                        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 transition-colors"
                    >
                        View Results
                    </button>
                ) : (
                    <button 
                        disabled
                        className="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold text-slate-400 cursor-not-allowed"
                    >
                        Quiz Already Created
                    </button>
                )
            ) : (
                <button 
                    onClick={async (e) => {
                        const btn = e.currentTarget;
                        btn.innerText = "Generating Quiz...";
                        btn.disabled = true;
                        setIsLocalCreated(true);
                        
                        await ensureCsrfToken();
                        const response = await apiFetch<{ quiz: { id: number } }>("/quizzes", {
                            method: "POST",
                            body: JSON.stringify({ quizTopic: topic, questionCount: quizQuestionCount, conversationId })
                        });
                        // Force refresh sidebar
                        window.dispatchEvent(new Event('refreshSidebar'));
                        // Navigate directly to the newly created quiz
                        onNavigate(`quiz&quizId=${response.quiz.id}`);
                    }}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 transition-colors"
                >
                    Take Quiz Now
                </button>
            )}
        </div>
    );
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

   return (
      <section className={`flex flex-col overflow-hidden bg-slate-900 ${className}`}>
         <header className="border-b border-white/5 px-6 py-4 flex items-center gap-3">
             <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/20 text-indigo-400">
                 <SparklesIcon className="h-6 w-6" />
             </div>
             <h2 className="text-lg font-bold text-white">Study Assistant</h2>
         </header>

         <div className="flex-1 space-y-8 overflow-y-auto px-6 py-10">
            {messages.map((message, index) => {
                const isAssistant = message.role === "assistant";
                const topic = getQuizTopicForMessage(messages, index);
                const count = getQuizCountForMessage(messages, index);
                
                // Retrieve conversationId from message object
                const conversationId = (message as any).conversationId; 
                
                const cleanContent = message.content.replace(/\[\[GENERATE_QUIZ\]\]/g, "").trim();
                
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
                            {cleanContent && (
                                <div className="whitespace-pre-wrap">
                                    {stripMarkdown(cleanContent)}
                                </div>
                            )}
                            
                            {/* Render UI if trigger found in content */}
                            {isAssistant && message.content.includes("[[GENERATE_QUIZ]]") && (
                                <QuizGeneratorButton topic={topic} count={count} conversationId={conversationId} onNavigate={onNavigate} recentQuizzes={recentQuizzes} />
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
