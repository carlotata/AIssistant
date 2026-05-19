export type DashboardTab = {
  id: string;
  label: string;
  icon: "dashboard" | "chat" | "tasks" | "progress";
};

export type DeadlineItem = {
  id: string;
  course: string;
  title: string;
  due: string;
  color: "red" | "amber" | "blue";
};

export type TaskItem = {
  id: string;
  title: string;
  completed: boolean;
};

export type QuickAction = {
  id: string;
  label: string;
  prompt: string;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};
