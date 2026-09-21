"use client";

import { addDays } from "date-fns";
import { useMemo, useState } from "react";
import { Gantt, ViewMode, type Task as GanttTask } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GanttTaskListHeader, GanttTaskListTable } from "@/components/roadmap/gantt-task-list";
import { useTaskModal } from "@/components/task/task-modal-context";
import { useColumns, useTasks } from "@/hooks/use-board-data";
import { apiPatch } from "@/lib/api-client";
import { LEVEL_COLORS } from "@/lib/types";

const VIEW_MODES: { mode: ViewMode; label: string }[] = [
  { mode: ViewMode.Day, label: "День" },
  { mode: ViewMode.Week, label: "Неделя" },
  { mode: ViewMode.Month, label: "Месяц" },
];

const TODAY_TINT = "rgba(124, 58, 237, 0.08)";

export function TaskGantt() {
  const { tasks, mutate: mutateTasks } = useTasks();
  const { columns } = useColumns();
  const { openEdit } = useTaskModal();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);

  const doneColumnIds = useMemo(
    () => new Set(columns.filter((c) => c.name === "Завершено").map((c) => c.id)),
    [columns],
  );

  const ganttTasks = useMemo<GanttTask[]>(() => {
    return tasks
      .filter((t) => t.startDate || t.dueDate)
      .map((t) => {
        const start = new Date(t.startDate ?? t.dueDate!);
        let end = new Date(t.dueDate ?? t.startDate!);
        if (end <= start) end = addDays(start, 1);
        const color = LEVEL_COLORS[t.importance];

        return {
          id: t.id,
          type: "task",
          name: t.title,
          start,
          end,
          progress: doneColumnIds.has(t.columnId) ? 100 : 0,
          styles: {
            backgroundColor: color,
            backgroundSelectedColor: color,
            progressColor: "rgba(255,255,255,0.35)",
            progressSelectedColor: "rgba(255,255,255,0.35)",
          },
        } satisfies GanttTask;
      });
  }, [tasks, doneColumnIds]);

  const handleDateChange = async (task: GanttTask) => {
    try {
      await apiPatch(`/api/tasks/${task.id}`, {
        startDate: task.start.toISOString(),
        dueDate: task.end.toISOString(),
      });
      await mutateTasks();
    } catch {
      toast.error("Не удалось изменить даты задачи");
      await mutateTasks();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <h1 className="text-lg font-semibold">Роадмап</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm text-muted-foreground">
              {ganttTasks.length > 0
                ? `${ganttTasks.length} задач${ganttTasks.length === 1 ? "а" : ""} с датами`
                : "Нет задач с датами"}
            </span>
            <div className="flex items-center gap-0.5 rounded-lg border bg-muted/50 p-0.5">
              {VIEW_MODES.map((v) => (
                <button
                  key={v.mode}
                  type="button"
                  onClick={() => setViewMode(v.mode)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    viewMode === v.mode
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {ganttTasks.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
                У задач пока нет дат начала или срока — добавьте их в карточке
                задачи, чтобы увидеть роадмап.
              </div>
            ) : (
              <Gantt
                tasks={ganttTasks}
                viewMode={viewMode}
                locale="ru"
                fontFamily="inherit"
                fontSize="13px"
                rowHeight={44}
                headerHeight={44}
                barCornerRadius={6}
                barFill={65}
                todayColor={TODAY_TINT}
                listCellWidth="380px"
                columnWidth={viewMode === ViewMode.Month ? 300 : viewMode === ViewMode.Week ? 250 : 65}
                TaskListHeader={GanttTaskListHeader}
                TaskListTable={GanttTaskListTable}
                onClick={(task) => openEdit(task.id)}
                onDateChange={handleDateChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
