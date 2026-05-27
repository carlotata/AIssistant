import type { ChatMessage, DashboardTab, QuickAction } from "@/types/dashboard";

export const DASHBOARD_TABS: DashboardTab[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "quizzes", label: "Quizzes", icon: "quiz" },
  { id: "progress", label: "Progress", icon: "progress" },
];

const TOPICS = ["Quantum Physics", "World History", "Calculus", "JavaScript Closures", "Photosynthesis", "Macroeconomics"];

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "action-summary",
    label: "Explain a Topic",
    prompt: `Explain ${TOPICS[Math.floor(Math.random() * TOPICS.length)]} in simple terms.`,
  },
  {
    id: "action-quiz",
    label: "Create Quiz",
    prompt: `Create a quiz about ${TOPICS[Math.floor(Math.random() * TOPICS.length)]}.`,
  },
  {
    id: "action-plan",
    label: "Study Plan",
    prompt: `Create a 30-minute study plan for ${TOPICS[Math.floor(Math.random() * TOPICS.length)]}.`,
  },
];

export function createInitialMessages(userName?: string): ChatMessage[] {
  return [
    {
      id: "init",
      role: "assistant",
      content: `Hello${userName ? `, ${userName}` : ""}! I'm AIsisstant. How can I help you study today?`,
    },
  ];
}
