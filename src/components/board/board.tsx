"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AddColumnButton } from "@/components/board/add-column-button";
import { BoardColumn } from "@/components/board/board-column";
import { TaskCard } from "@/components/board/task-card";
import { useTaskModal } from "@/components/task/task-modal-context";
import { useColumns, useTasks } from "@/hooks/use-board-data";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import type { Column, Task } from "@/lib/types";

function groupByColumn(columns: Column[], tasks: Task[]) {
  const map: Record<string, Task[]> = {};
  for (const column of columns) map[column.id] = [];
  for (const task of tasks) {
    if (!map[task.columnId]) map[task.columnId] = [];
    map[task.columnId].push(task);
  }
  for (const columnId of Object.keys(map)) {
    map[columnId].sort((a, b) => a.order - b.order);
  }
  return map;
}

function findColumnOfTask(taskId: string, tasksByColumn: Record<string, Task[]>) {
  return Object.keys(tasksByColumn).find((columnId) =>
    tasksByColumn[columnId].some((t) => t.id === taskId),
  );
}

export function Board() {
  const { tasks, mutate: mutateTasks } = useTasks();
  const { columns: serverColumns, mutate: mutateColumns } = useColumns();
  const { openEdit } = useTaskModal();

  const sortedColumns = useMemo(
    () => [...serverColumns].sort((a, b) => a.order - b.order),
    [serverColumns],
  );

  const [columns, setColumns] = useState<Column[]>([]);
  const [tasksByColumn, setTasksByColumn] = useState<Record<string, Task[]>>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  // Kept in sync *synchronously* alongside the state setters below so drag
  // handlers can read the true latest value without waiting on an effect
  // (effects run after commit, which is too late for onDragEnd) and without
  // putting API side effects inside a setState updater (React/StrictMode may
  // invoke updater functions more than once, which would double-fire them).
  const columnsRef = useRef<Column[]>([]);
  const tasksByColumnRef = useRef<Record<string, Task[]>>({});

  function applyColumns(next: Column[]) {
    columnsRef.current = next;
    setColumns(next);
  }

  function applyTasksByColumn(next: Record<string, Task[]>) {
    tasksByColumnRef.current = next;
    setTasksByColumn(next);
  }

  useEffect(() => {
    applyColumns(sortedColumns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedColumns]);

  useEffect(() => {
    applyTasksByColumn(groupByColumn(sortedColumns, tasks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedColumns, tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type;
    if (type === "task") setActiveTask(event.active.data.current?.task ?? null);
    if (type === "column") setActiveColumn(event.active.data.current?.column ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type !== "task") return;

    const activeId = String(active.id);
    const overData = over.data.current;
    if (!overData) return;

    const prev = tasksByColumnRef.current;
    const activeColumnId = findColumnOfTask(activeId, prev);
    if (!activeColumnId) return;

    const overColumnId =
      overData.type === "column-body"
        ? (overData.columnId as string)
        : findColumnOfTask(String(over.id), prev);
    if (!overColumnId) return;

    if (activeColumnId === overColumnId && overData.type === "task") {
      const items = prev[activeColumnId];
      const oldIndex = items.findIndex((t) => t.id === activeId);
      const newIndex = items.findIndex((t) => t.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      applyTasksByColumn({ ...prev, [activeColumnId]: arrayMove(items, oldIndex, newIndex) });
      return;
    }

    if (activeColumnId === overColumnId) return;

    const sourceItems = [...prev[activeColumnId]];
    const destItems = [...(prev[overColumnId] ?? [])];
    const activeIndex = sourceItems.findIndex((t) => t.id === activeId);
    if (activeIndex === -1) return;
    const [moved] = sourceItems.splice(activeIndex, 1);

    let destIndex =
      overData.type === "column-body"
        ? destItems.length
        : destItems.findIndex((t) => t.id === String(over.id));
    if (destIndex === -1) destIndex = destItems.length;

    destItems.splice(destIndex, 0, { ...moved, columnId: overColumnId });

    applyTasksByColumn({ ...prev, [activeColumnId]: sourceItems, [overColumnId]: destItems });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const type = active.data.current?.type;
    setActiveTask(null);
    setActiveColumn(null);
    if (!over) return;

    if (type === "column") {
      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId) return;

      const prev = columnsRef.current;
      const oldIndex = prev.findIndex((c) => c.id === activeId);
      const newIndex = prev.findIndex((c) => c.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(prev, oldIndex, newIndex);
      applyColumns(reordered);

      apiPost("/api/columns/reorder", { orderedIds: reordered.map((c) => c.id) })
        .then(() => mutateColumns())
        .catch(() => {
          toast.error("Не удалось изменить порядок колонок");
          mutateColumns();
        });
      return;
    }

    if (type === "task") {
      const activeId = String(active.id);
      const latest = tasksByColumnRef.current;
      const finalColumnId = findColumnOfTask(activeId, latest);
      if (!finalColumnId) return;
      const finalIndex = latest[finalColumnId].findIndex((t) => t.id === activeId);

      apiPost(`/api/tasks/${activeId}/move`, {
        toColumnId: finalColumnId,
        toIndex: finalIndex,
      })
        .then(() => mutateTasks())
        .catch(() => {
          toast.error("Не удалось переместить задачу");
          mutateTasks();
        });
    }
  };

  const handleQuickAdd = async (columnId: string, title: string) => {
    try {
      await apiPost("/api/tasks", { title, columnId });
      await mutateTasks();
    } catch {
      toast.error("Не удалось создать задачу");
    }
  };

  const handleAddColumn = async (name: string) => {
    try {
      await apiPost("/api/columns", { name });
      await mutateColumns();
    } catch {
      toast.error("Не удалось создать колонку");
    }
  };

  const handleRenameColumn = async (columnId: string, name: string) => {
    try {
      await apiPatch(`/api/columns/${columnId}`, { name });
      await mutateColumns();
    } catch {
      toast.error("Не удалось переименовать колонку");
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Удалить колонку? Задачи будут перенесены в первую системную колонку.")) {
      return;
    }
    try {
      await apiDelete(`/api/columns/${columnId}`);
      await Promise.all([mutateColumns(), mutateTasks()]);
    } catch {
      toast.error("Не удалось удалить колонку");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <h1 className="text-lg font-semibold">Доска задач</h1>
      </div>
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex h-full items-start gap-3">
              {columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  tasks={tasksByColumn[column.id] ?? []}
                  onOpenTask={openEdit}
                  onQuickAdd={handleQuickAdd}
                  onRename={handleRenameColumn}
                  onDelete={handleDeleteColumn}
                />
              ))}
              <AddColumnButton onAdd={handleAddColumn} />
            </div>
          </SortableContext>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} dragOverlay />}
            {activeColumn && (
              <div className="w-72 rounded-xl border bg-card p-2 shadow-lg">
                <span className="text-sm font-semibold">{activeColumn.name}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
