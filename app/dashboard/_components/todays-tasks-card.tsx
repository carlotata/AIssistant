import { CheckCircleIcon, CheckSquareIcon, CircleIcon } from "./dashboard-icons";
import type { TaskItem } from "./dashboard-types";

type TodaysTasksCardProps = {
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
};

export function TodaysTasksCard({ tasks, onToggleTask }: TodaysTasksCardProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckSquareIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">Today&apos;s Tasks</h2>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          {completedTasks} of {totalTasks}
        </span>
      </div>

      <div className="mb-5 h-2.5 w-full rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>

      <ul className="space-y-3">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => onToggleTask(task.id)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50"
            >
              {task.completed ? (
                <CheckCircleIcon className="h-5 w-5 shrink-0 text-blue-500" />
              ) : (
                <CircleIcon className="h-5 w-5 shrink-0 text-slate-300" />
              )}

              <span className={task.completed ? "text-slate-400 line-through" : "text-slate-700"}>{task.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
