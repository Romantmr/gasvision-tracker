"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { TaskModal } from "@/components/task/task-modal";

interface TaskModalContextValue {
  openCreate: (columnId: string) => void;
  openEdit: (taskId: string) => void;
}

const TaskModalContext = createContext<TaskModalContextValue | null>(null);

export function useTaskModal() {
  const ctx = useContext(TaskModalContext);
  if (!ctx) throw new Error("useTaskModal must be used within TaskModalProvider");
  return ctx;
}

export function TaskModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<string | null>(null);

  const openCreate = useCallback((columnId: string) => {
    setTaskId(null);
    setDefaultColumnId(columnId);
    setOpen(true);
  }, []);

  const openEdit = useCallback((id: string) => {
    setTaskId(id);
    setDefaultColumnId(null);
    setOpen(true);
  }, []);

  return (
    <TaskModalContext.Provider value={{ openCreate, openEdit }}>
      {children}
      <TaskModal
        open={open}
        taskId={taskId}
        defaultColumnId={defaultColumnId}
        onOpenChange={setOpen}
      />
    </TaskModalContext.Provider>
  );
}
