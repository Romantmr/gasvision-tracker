"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckCircle2,
  Circle,
  Clock,
  GripVertical,
  MoreHorizontal,
  PlayCircle,
  Plus,
  XCircle,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Column, Task } from "@/lib/types";
import { TaskCard } from "./task-card";

function columnIcon(name: string) {
  switch (name) {
    case "Новое":
      return Clock;
    case "В работе":
      return PlayCircle;
    case "Завершено":
      return CheckCircle2;
    case "Отменено":
      return XCircle;
    default:
      return Circle;
  }
}

export function BoardColumn({
  column,
  tasks,
  onOpenTask,
  onQuickAdd,
  onRename,
  onDelete,
}: {
  column: Column;
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  onQuickAdd: (columnId: string, title: string) => void;
  onRename: (columnId: string, name: string) => void;
  onDelete: (columnId: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(column.name);

  const sortable = useSortable({
    id: column.id,
    data: { type: "column", column },
  });

  const droppable = useDroppable({
    id: `col-body:${column.id}`,
    data: { type: "column-body", columnId: column.id },
  });

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  const submitQuickAdd = () => {
    const trimmed = title.trim();
    if (trimmed) onQuickAdd(column.id, trimmed);
    setTitle("");
    setAdding(false);
  };

  const submitRename = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== column.name) onRename(column.id, trimmed);
    setRenaming(false);
  };

  const Icon = columnIcon(column.name);

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={cn(
        "flex h-full w-72 shrink-0 flex-col rounded-xl border bg-card shadow-sm",
        sortable.isDragging && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button
          type="button"
          {...sortable.attributes}
          {...sortable.listeners}
          className="cursor-grab touch-none text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${column.color}1f`, color: column.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        {renaming ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            className="h-7 flex-1"
          />
        ) : (
          <span
            className="flex-1 truncate text-sm font-semibold"
            onDoubleClick={() => !column.isSystem && setRenaming(true)}
          >
            {column.name}
          </span>
        )}
        <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[11px] font-semibold text-background tabular-nums">
          {tasks.length}
        </span>
        {!column.isSystem && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="h-6 w-6 p-0" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenaming(true)}>
                Переименовать
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(column.id)}
              >
                Удалить колонку
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        ref={droppable.setNodeRef}
        className={cn(
          "flex min-h-48 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 transition-colors",
          droppable.isOver && "bg-accent/50",
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onOpenTask(task.id)} />
          ))}
        </SortableContext>
      </div>

      <div className="px-2 pb-2">
        {adding ? (
          <div className="space-y-1">
            <Input
              autoFocus
              placeholder="Название задачи"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitQuickAdd();
                if (e.key === "Escape") {
                  setAdding(false);
                  setTitle("");
                }
              }}
              className="h-8 bg-background"
            />
            <div className="flex gap-1">
              <Button size="sm" className="h-7" onClick={submitQuickAdd}>
                Добавить
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
                onClick={() => {
                  setAdding(false);
                  setTitle("");
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-4 w-4" /> Добавить задачу
          </Button>
        )}
      </div>
    </div>
  );
}
