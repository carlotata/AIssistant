import { TaskListItem } from "./task-list-item";
import type { TaskEntry } from "./task-types";

type TaskListSectionProps = {
  title: string;
  tasks: TaskEntry[];
  showDelete: boolean;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
};

export function TaskListSection({
  title,
  tasks,
  showDelete,
  onToggleTask,
  onDeleteTask,
}: TaskListSectionProps) {
  return (
    <section className="mb-8 last:mb-0">
      <h2 className="mb-4 text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
        {title} ({tasks.length})
      </h2>

      {tasks.length > 0 ? (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              showDelete={showDelete}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          No tasks in this section yet.
        </p>
      )}
    </section>
  );
}
