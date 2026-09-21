"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ToolbarProps } from "react-big-calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS: { key: "month" | "week" | "agenda"; label: string }[] = [
  { key: "month", label: "Месяц" },
  { key: "week", label: "Неделя" },
  { key: "agenda", label: "Список" },
];

export function CalendarToolbar({ label, view, onNavigate, onView }: ToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border">
          <button
            type="button"
            onClick={() => onNavigate("PREV")}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Назад"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("NEXT")}
            className="flex h-8 w-8 items-center justify-center border-l text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Вперёд"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate("TODAY")}>
          Сегодня
        </Button>
      </div>

      <h2 className="text-base font-semibold">{label}</h2>

      <div className="flex items-center gap-0.5 rounded-lg border bg-muted/50 p-0.5">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onView(option.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === option.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
