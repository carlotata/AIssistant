import { useEffect, useRef } from "react";

import { SendIcon, SparklesIcon } from "./dashboard-icons";
import type { ChatMessage, QuickAction } from "./hard-data/dashboard-types";

type AssistantChatPanelProps = {
   messages: ChatMessage[];
   inputValue: string;
   quickActions: QuickAction[];
   onInputChange: (value: string) => void;
   onSubmitMessage: () => void;
   onQuickAction: (action: QuickAction) => void;
};

export function AssistantChatPanel({
   messages,
   inputValue,
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
      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
         <header className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
            <div className="relative">
               <div className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 text-blue-600">
                  <SparklesIcon className="h-5 w-5" />
               </div>
               <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            </div>

            <div>
               <h2 className="text-xl font-semibold text-slate-900">
                  AI Study Assistant
               </h2>
               <p className="text-sm text-slate-500">
                  Always online to help you learn
               </p>
            </div>
         </header>

         <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/45 px-6 py-6">
            {messages.map((message) => {
               const isAssistant = message.role === "assistant";

               return (
                  <div
                     key={message.id}
                     className={
                        isAssistant
                           ? "flex items-start gap-3"
                           : "flex justify-end"
                     }>
                     {isAssistant && (
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
                           <SparklesIcon className="h-4 w-4" />
                        </div>
                     )}

                     <p
                        className={[
                           "max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                           isAssistant
                              ? "border border-slate-200 bg-white text-slate-700"
                              : "bg-blue-600 text-white",
                        ].join(" ")}>
                        {message.content}
                     </p>
                  </div>
               );
            })}
            <div ref={messagesEndRef} />
         </div>

         <footer className="border-t border-slate-200 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
               <input
                  value={inputValue}
                  onChange={(event) => onInputChange(event.target.value)}
                  onKeyDown={(event) => {
                     if (event.key === "Enter") {
                        event.preventDefault();
                        onSubmitMessage();
                     }
                  }}
                  placeholder="Ask your AI study assistant..."
                  className="h-11 flex-1 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                  aria-label="Message your AI assistant"
               />

               <button
                  type="button"
                  onClick={onSubmitMessage}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500 text-white transition hover:bg-blue-600"
                  aria-label="Send message">
                  <SendIcon className="h-4 w-4" />
               </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
               {quickActions.map((action) => (
                  <button
                     key={action.id}
                     type="button"
                     onClick={() => onQuickAction(action)}
                     className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700">
                     {action.label}
                  </button>
               ))}
            </div>
         </footer>
      </section>
   );
}
