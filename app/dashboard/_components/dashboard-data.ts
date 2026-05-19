import type {
  ChatMessage,
  DashboardTab,
  DeadlineItem,
  QuickAction,
  TaskItem,
} from "./dashboard-types";

export const DASHBOARD_TABS: DashboardTab[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "tasks", label: "Tasks", icon: "tasks" },
  { id: "progress", label: "Progress", icon: "progress" },
];

export const UPCOMING_DEADLINES: DeadlineItem[] = [
  {
    id: "deadline-1",
    course: "History",
    title: "Essay Draft",
    due: "Tomorrow, 11:59 PM",
    color: "red",
  },
  {
    id: "deadline-2",
    course: "Math",
    title: "Problem Set 3",
    due: "Friday, 5:00 PM",
    color: "amber",
  },
  {
    id: "deadline-3",
    course: "Biology",
    title: "Lab Report",
    due: "Next Monday",
    color: "blue",
  },
];

const DEFAULT_TASKS: TaskItem[] = [
  { id: "task-1", title: "Read Chapter 4 of Biology", completed: true },
  { id: "task-2", title: "Write History essay outline", completed: false },
  { id: "task-3", title: "Solve 10 algebra practice items", completed: false },
  { id: "task-4", title: "Review chemistry flashcards", completed: false },
  { id: "task-5", title: "Organize notes for tomorrow", completed: false },
];

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "action-study-plan",
    label: "Generate Study Plan",
    prompt: "Create a focused study plan for my upcoming deadlines.",
  },
  {
    id: "action-quiz",
    label: "Create Quiz",
    prompt: "Create a short practice quiz from my current subjects.",
  },
  {
    id: "action-explain",
    label: "Explain Lesson",
    prompt: "Explain today's lesson in simple terms with quick examples.",
  },
];

export function createInitialTasks(): TaskItem[] {
  return DEFAULT_TASKS.map((task) => ({ ...task }));
}

export function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: "message-1",
      role: "assistant",
      content: "Hi there! I am your AI Study Assistant. How can I help you focus today?",
    },
  ];
}

export function getAssistantReply(prompt: string): string {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("study plan")) {
    return "Great choice. Start with your closest deadline first, then block 25-minute sessions per subject with 5-minute breaks between each block.";
  }

  if (normalized.includes("quiz")) {
    return "Absolutely. I can build a 5-question mixed quiz and include the answer key so you can self-check right away.";
  }

  if (normalized.includes("explain")) {
    return "Sure. Share the topic and I will break it down into simple steps, then give a quick example and memory trick.";
  }

  return "I can help with planning, summaries, practice questions, and explanations. Tell me what you want to work on next.";
}
