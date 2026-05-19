"use client";

import { useState } from "react";

import {
   createInitialMessages,
   createInitialTasks,
   DASHBOARD_TABS,
   getAssistantReply,
   QUICK_ACTIONS,
   UPCOMING_DEADLINES,
} from "./hard-data/dashboard-data";
import { AssistantChatPanel } from "./assistant-chat-panel";
import { DashboardHeader } from "./dashboard-header";
import { TodaysTasksCard } from "./todays-tasks-card";
import { UpcomingDeadlinesCard } from "./upcoming-deadlines-card";
import type { QuickAction } from "./hard-data/dashboard-types";

function createMessageId() {
   return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function StudyDashboard() {
   const [activeTabId, setActiveTabId] = useState("dashboard");
   const [tasks, setTasks] = useState(createInitialTasks);
   const [messages, setMessages] = useState(createInitialMessages);
   const [inputValue, setInputValue] = useState("");

   function handleToggleTask(taskId: string) {
      setTasks((prev) =>
         prev.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task,
         ),
      );
   }

   function pushChatPrompt(prompt: string) {
      const cleanedPrompt = prompt.trim();
      if (!cleanedPrompt) {
         return;
      }

      const userMessage = {
         id: createMessageId(),
         role: "user" as const,
         content: cleanedPrompt,
      };

      const assistantMessage = {
         id: createMessageId(),
         role: "assistant" as const,
         content: getAssistantReply(cleanedPrompt),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
   }

   function handleSubmitMessage() {
      const prompt = inputValue;
      setInputValue("");
      pushChatPrompt(prompt);
   }

   function handleQuickAction(action: QuickAction) {
      setInputValue("");
      pushChatPrompt(action.prompt);
   }

   return (
      <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
         <DashboardHeader
            tabs={DASHBOARD_TABS}
            activeTabId={activeTabId}
            onTabChange={setActiveTabId}
         />

         <main className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-6 sm:px-8 xl:grid-cols-[330px_1fr]">
            <section className="space-y-6">
               <UpcomingDeadlinesCard deadlines={UPCOMING_DEADLINES} />
               <TodaysTasksCard tasks={tasks} onToggleTask={handleToggleTask} />
            </section>

            <AssistantChatPanel
               messages={messages}
               inputValue={inputValue}
               quickActions={QUICK_ACTIONS}
               onInputChange={setInputValue}
               onSubmitMessage={handleSubmitMessage}
               onQuickAction={handleQuickAction}
            />
         </main>
      </div>
   );
}
