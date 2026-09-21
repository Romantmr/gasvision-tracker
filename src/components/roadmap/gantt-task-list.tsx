"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Task as GanttTask } from "gantt-task-react";
import { cn } from "@/lib/utils";

const NAME_WIDTH = "45%";
const DATE_WIDTH = "27.5%";

export function GanttTaskListHeader({
  headerHeight,
}: {
  headerHeight: number;
}) {
  return (
    <div
      className="flex items-center border-b bg-muted/40 text-xs font-semibold text-muted-foreground"
      style={{ height: headerHeight }}
    >
      <div className="truncate px-3" style={{ width: NAME_WIDTH }}>
        Задача
      </div>
      <div className="truncate px-3" style={{ width: DATE_WIDTH }}>
        Начало
      </div>
      <div className="truncate px-3" style={{ width: DATE_WIDTH }}>
        Срок
      </div>
    </div>
  );
}

export function GanttTaskListTable({
  rowHeight,
  tasks,
  selectedTaskId,
  setSelectedTask,
}: {
  rowHeight: number;
  tasks: GanttTask[];
  selectedTaskId: string;
  setSelectedTask: (taskId: string) => void;
}) {
  return (
    <div>
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => setSelectedTask(task.id)}
          className={cn(
            "flex cursor-pointer items-center border-b text-sm transition-colors hover:bg-accent/40",
            selectedTaskId === task.id && "bg-accent/60",
          )}
          style={{ height: rowHeight }}
        >
          <div className="truncate px-3 font-medium" style={{ width: NAME_WIDTH }}>
            {task.name}
          </div>
          <div className="truncate px-3 text-muted-foreground" style={{ width: DATE_WIDTH }}>
            {format(task.start, "d MMM", { locale: ru })}
          </div>
          <div className="truncate px-3 text-muted-foreground" style={{ width: DATE_WIDTH }}>
            {format(task.end, "d MMM", { locale: ru })}
          </div>
        </div>
      ))}
    </div>
  );
}
