"use client";

import { format, getDay, parse, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-overrides.css";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { useTaskModal } from "@/components/task/task-modal-context";
import { useTasks } from "@/hooks/use-board-data";
import { LEVEL_COLORS, type Task } from "@/lib/types";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { ru },
});

interface TaskEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  task: Task;
}

const MESSAGES = {
  month: "Месяц",
  week: "Неделя",
  day: "День",
  agenda: "Список",
  today: "Сегодня",
  previous: "Назад",
  next: "Вперёд",
  noEventsInRange: "Нет задач в этом диапазоне",
  date: "Дата",
  time: "Время",
  event: "Задача",
  allDay: "Весь день",
  showMore: (count: number) => `+ ещё ${count}`,
};

export function TaskCalendar() {
  const { tasks } = useTasks();
  const { openEdit } = useTaskModal();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  const events = useMemo<TaskEvent[]>(() => {
    return tasks
      .filter((t) => t.startDate || t.dueDate)
      .map((t) => {
        const start = new Date(t.startDate ?? t.dueDate!);
        const end = new Date(t.dueDate ?? t.startDate!);
        return {
          id: t.id,
          title: t.title,
          start,
          end: end < start ? start : end,
          allDay: true,
          task: t,
        };
      });
  }, [tasks]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <h1 className="text-lg font-semibold">Календарь</h1>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm [&>.rbc-calendar]:min-h-0 [&>.rbc-calendar]:flex-1">
          <Calendar
            className="gv-calendar"
            localizer={localizer}
            culture="ru"
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            views={["month", "week", "agenda"]}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            messages={MESSAGES}
            formats={{
              // date-fns' "MMMM" renders the genitive form ("сентября"); the
              // capitalized "LLLL" token gives the standalone nominative form
              // ("сентябрь") that reads correctly as a title.
              monthHeaderFormat: (date, culture, loc) =>
                loc?.format(date, "LLLL yyyy", culture) ?? "",
            }}
            components={{
              toolbar: CalendarToolbar as React.ComponentType<
                import("react-big-calendar").ToolbarProps<TaskEvent>
              >,
            }}
            onSelectEvent={(event) => openEdit((event as TaskEvent).id)}
            eventPropGetter={(event) => {
              const color = LEVEL_COLORS[(event as TaskEvent).task.importance];
              return {
                style: {
                  "--gv-event-bg": `${color}1f`,
                  "--gv-event-fg": color,
                } as React.CSSProperties,
              };
            }}
          />
        </div>
      </div>
    </div>
  );
}
