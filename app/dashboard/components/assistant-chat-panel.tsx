import { useEffect, useRef } from "react";

import { SendIcon, SparklesIcon } from "./dashboard-icons";
import type { ChatMessage, QuickAction } from "./hard-data/dashboard-types";

type AssistantChatPanelProps = {
   messages: ChatMessage[];
   inputValue: string;
   submitting?: boolean;
   className?: string;
   quickActions: QuickAction[];
   onInputChange: (value: string) => void;
   onSubmitMessage: () => void;
   onQuickAction: (action: QuickAction) => void;
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
}: AssistantChatPanelProps) {
   const messagesEndRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);

   return (
      <section className={`flex min-h-[600px] flex-col overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white shadow-premium transition-all duration-300 ${className}`}>
         <header className="flex items-center gap-4 border-b border-slate-100/80 px-8 py-5">
            <div className="relative">
               <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-600 shadow-inner">
                  <SparklesIcon className="h-6 w-6 animate-float" />
               </div>
               <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
            </div>

            <div>
               <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  AI Study Assistant
               </h2>
               <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                     Always Online
                  </p>
               </div>
            </div>
         </header>

         <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/30 px-6 py-8">
            {messages.map((message) => {
               const isAssistant = message.role === "assistant";

               return (
                  <div
                     key={message.id}
                     className={
                        isAssistant
                           ? "flex items-start gap-4 animate-fade-in-up"
                           : "flex justify-end animate-fade-in-up"
                     }>
                     {isAssistant && (
                        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
                           <SparklesIcon className="h-5 w-5" />
                        </div>
                     )}

                     <div
                        className={[
                           "max-w-[85%] rounded-[1.5rem] px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                           isAssistant
                              ? "rounded-tl-none border border-slate-200 bg-white text-slate-700"
                              : "rounded-br-none bg-gradient-to-r from-blue-600 to-indigo-500 font-medium text-white shadow-blue-500/20",
                        ].join(" ")}>
                        {message.content}
                     </div>
                  </div>
               );
            })}
            
            {submitting && (
               <div className="flex items-start gap-4 animate-fade-in-up">
                  <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
                     <SparklesIcon className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="rounded-[1.5rem] rounded-tl-none border border-slate-200 bg-white px-5 py-4 shadow-sm">
                     <div className="flex gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" />
                     </div>
                  </div>
               </div>
            )}
            
            <div ref={messagesEndRef} />
         </div>

         <footer className="border-t border-slate-100 bg-white px-6 py-6">
            <div className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
               <input
                  value={inputValue}
                  onChange={(event) => onInputChange(event.target.value)}
                  onKeyDown={(event) => {
                     if (event.key === "Enter") {
                        event.preventDefault();
                        onSubmitMessage();
                     }
                  }}
                  disabled={submitting}
                  placeholder="Ask your AI study assistant..."
                  className="h-11 flex-1 px-4 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Message your AI assistant"
               />

               <button
                  type="button"
                  onClick={onSubmitMessage}
                  disabled={submitting || !inputValue.trim()}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:grayscale"
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
                     className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-wide transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm active:scale-95">
                     {action.label}
                  </button>
               ))}
            </div>
         </footer>
      </section>
   );
}
