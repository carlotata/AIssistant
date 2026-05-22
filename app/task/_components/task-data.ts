import type { TaskEntry } from "./task-types";

const DEFAULT_TASKS: TaskEntry[] = [
  { id: "task-1", title: "Write History essay outline", completed: false },
  { id: "task-2", title: "Complete Math problem set", completed: false },
  { id: "task-3", title: "Review Spanish vocabulary", completed: false },
  { id: "task-4", title: "Prepare for Physics lab", completed: false },
  { id: "task-5", title: "Read Chapter 4 of Biology", completed: true },
];

export function createInitialTaskEntries() {
  return DEFAULT_TASKS.map((task) => ({ ...task }));
}
