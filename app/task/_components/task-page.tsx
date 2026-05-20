"use client";

import { useMemo, useState } from "react";

import { DASHBOARD_TABS } from "@/app/dashboard/_components/dashboard-data";
import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header";

import { createInitialTaskEntries } from "./task-data";
import { TaskComposer } from "./task-composer";
import { TaskListSection } from "./task-list-section";

function createTaskId() {
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function TaskPage() {
  const [activeTabId, setActiveTabId] = useState("tasks");
  const [taskEntries, setTaskEntries] = useState(createInitialTaskEntries);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const toDoTasks = useMemo(
    () => taskEntries.filter((task) => !task.completed),
    [taskEntries],
  );
  const completedTasks = useMemo(
    () => taskEntries.filter((task) => task.completed),
    [taskEntries],
  );

  function handleAddTask() {
    const cleanedTitle = newTaskTitle.trim();
    if (!cleanedTitle) {
      return;
    }

    setTaskEntries((prev) => [
      ...prev,
      { id: createTaskId(), title: cleanedTitle, completed: false },
    ]);
    setNewTaskTitle("");
  }

  function handleToggleTask(taskId: string) {
    setTaskEntries((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function handleDeleteTask(taskId: string) {
    setTaskEntries((prev) => prev.filter((task) => task.id !== taskId));
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      <DashboardHeader
        tabs={DASHBOARD_TABS}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
      />

      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8">
        <section className="mx-auto w-full max-w-[900px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="mb-6 text-4xl font-semibold tracking-tight text-slate-900">
            All Tasks
          </h1>

          <TaskComposer
            value={newTaskTitle}
            onValueChange={setNewTaskTitle}
            onAddTask={handleAddTask}
          />

          <TaskListSection
            title="To Do"
            tasks={toDoTasks}
            showDelete
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />

          <TaskListSection
            title="Completed"
            tasks={completedTasks}
            showDelete={false}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        </section>
      </main>
    </div>
  );
}
