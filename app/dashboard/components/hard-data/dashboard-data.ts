import type { ChatMessage, DashboardTab, QuickAction } from "./dashboard-types";

export const DASHBOARD_TABS: DashboardTab[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "quizzes", label: "Quizzes", icon: "quiz" },
  { id: "progress", label: "Progress", icon: "progress" },
];

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "action-summary",
    label: "Explain a Topic",
    prompt: "Explain photosynthesis in simple terms with a quick example.",
  },
  {
    id: "action-quiz",
    label: "Create Quiz",
    prompt: "Algebra basics",
  },
  {
    id: "action-plan",
    label: "Study Plan",
    prompt: "Create a focused 30-minute study plan for algebra basics.",
  },
];

export function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: "message-1",
      role: "assistant",
      content: "Hi there! I am your AI Study Assistant. How can I help you focus today?",
    },
  ];
}
