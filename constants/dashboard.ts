import type { ChatMessage, DashboardTab, QuickAction } from "@/types/dashboard";

export const DASHBOARD_TABS: DashboardTab[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "quizzes", label: "Quizzes", icon: "quiz" },
  { id: "progress", label: "Progress", icon: "progress" },
];

export const DYNAMIC_TOPICS = ["Quantum Physics", "World History", "Calculus", "JavaScript Closures", "Photosynthesis", "Macroeconomics", "Renaissance Art", "Climate Change"];

export function createInitialMessages(userName?: string): ChatMessage[] {
  return [
    {
      id: "init",
      role: "assistant",
      content: `Hello${userName ? `, ${userName}` : ""}! I'm AIsisstant. How can I help you study today?`,
    },
  ];
}
