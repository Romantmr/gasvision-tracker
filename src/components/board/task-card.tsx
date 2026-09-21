"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LEVEL_COLORS, LEVEL_LABELS, type Task } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TaskCard({
  task,
  onClick,
  dragOverlay = false,
}: {
  task: Task;
  onClick?: () => void;
  dragOverlay?: boolean;
}) {
  const sortable = useSortable({
    id: task.id,
    data: { type: "task", task },
    disabled: dragOverlay,
  });

  const style = dragOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        borderLeftColor: LEVEL_COLORS[task.urgency],
      };

  return (
    <div
      ref={dragOverlay ? undefined : sortable.setNodeRef}
      style={dragOverlay ? { borderLeftColor: LEVEL_COLORS[task.urgency] } : style}
      {...(dragOverlay ? {} : sortable.attributes)}
      {...(dragOverlay ? {} : sortable.listeners)}
      onClick={onClick}
      className={cn(
        "cursor-pointer space-y-2 rounded-xl border border-l-[3px] bg-card p-3 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        sortable.isDragging && !dragOverlay && "opacity-40",
        dragOverlay && "rotate-2 shadow-lg",
      )}
    >
      <p className="font-medium leading-snug">{task.title}</p>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map(({ tag }) => (
            <Badge
              key={tag.id}
              style={{ backgroundColor: `${tag.color}1f`, color: tag.color }}
              className="rounded-full border-0 px-2 py-0 text-[11px] font-medium"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            title={`Важность: ${LEVEL_LABELS[task.importance]}`}
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: LEVEL_COLORS[task.importance] }}
          />
          {task.dueDate && (
            <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <CalendarClock className="h-3 w-3 shrink-0" />
              {format(new Date(task.dueDate), "d MMM", { locale: ru })}
            </span>
          )}
        </div>
        {task.assignee && (
          <Avatar className="h-6 w-6 shrink-0 ring-2 ring-card" title={task.assignee.name}>
            <AvatarFallback className="bg-accent text-[10px] text-accent-foreground">
              {initials(task.assignee.name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
