import { PlusIcon } from "./task-icons";

type TaskComposerProps = {
  value: string;
  onValueChange: (value: string) => void;
  onAddTask: () => void;
};

export function TaskComposer({ value, onValueChange, onAddTask }: TaskComposerProps) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onAddTask();
          }
        }}
        placeholder="Add a new task..."
        className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
        aria-label="Add new task"
      />

      <button
        type="button"
        onClick={onAddTask}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-500 px-5 text-base font-semibold text-white transition hover:bg-blue-600"
      >
        <PlusIcon className="h-4 w-4" />
        Add
      </button>
    </div>
  );
}
