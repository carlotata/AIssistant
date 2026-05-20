import { CheckCircleIcon, CircleIcon } from "@/app/dashboard/_components/dashboard-icons";

import { TrashIcon } from "./task-icons";
import type { TaskEntry } from "./task-types";

type TaskListItemProps = {
  task: TaskEntry;
  showDelete: boolean;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
};

export function TaskListItem({
  task,
  showDelete,
  onToggleTask,
  onDeleteTask,
}: TaskListItemProps) {
  return (
    <li>
      <div className="group flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-100/80">
        <button
          type="button"
          onClick={() => onToggleTask(task.id)}
          className="grid h-8 w-8 shrink-0 place-items-center text-slate-300 transition hover:text-blue-500"
          aria-label={`Mark ${task.title} as ${task.completed ? "not completed" : "completed"}`}
        >
          {task.completed ? (
            <CheckCircleIcon className="h-5 w-5 text-blue-500" />
          ) : (
            <CircleIcon className="h-5 w-5" />
          )}
        </button>

        <p
          className={[
            "flex-1 text-[1.35rem] leading-snug sm:text-2xl",
            task.completed ? "text-slate-400 line-through" : "text-slate-700",
          ].join(" ")}
        >
          {task.title}
        </p>

        {showDelete && (
          <button
            type="button"
            onClick={() => onDeleteTask(task.id)}
            className="grid h-8 w-8 place-items-center text-slate-300 opacity-0 transition hover:text-slate-500 group-hover:opacity-100"
            aria-label={`Delete ${task.title}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}
