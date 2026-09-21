"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagPicker } from "@/components/task/tag-picker";
import { useColumns, useTags, useTasks, useUsers } from "@/hooks/use-board-data";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import { LEVEL_LABELS, type Level, type Task } from "@/lib/types";

const NO_ASSIGNEE = "none";

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00`).toISOString();
}

export function TaskModal({
  open,
  taskId,
  defaultColumnId,
  onOpenChange,
}: {
  open: boolean;
  taskId: string | null;
  defaultColumnId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { tasks, mutate: mutateTasks } = useTasks();
  const { columns } = useColumns();
  const { tags, mutate: mutateTags } = useTags();
  const { users } = useUsers();

  const existing = taskId ? tasks.find((t) => t.id === taskId) : null;
  const isEditing = !!existing;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>(NO_ASSIGNEE);
  const [importance, setImportance] = useState<Level>("MEDIUM");
  const [urgency, setUrgency] = useState<Level>("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setColumnId(existing.columnId);
      setAssigneeId(existing.assigneeId ?? NO_ASSIGNEE);
      setImportance(existing.importance);
      setUrgency(existing.urgency);
      setStartDate(toDateInputValue(existing.startDate));
      setDueDate(toDateInputValue(existing.dueDate));
      setTagIds(existing.tags.map((t) => t.tag.id));
    } else {
      setTitle("");
      setDescription("");
      setColumnId(defaultColumnId ?? columns[0]?.id ?? "");
      setAssigneeId(NO_ASSIGNEE);
      setImportance("MEDIUM");
      setUrgency("MEDIUM");
      setStartDate("");
      setDueDate("");
      setTagIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

  const handleCreateTag = async (name: string, color: string) => {
    try {
      const { tag } = await apiPost<{ tag: { id: string } }>("/api/tags", {
        name,
        color,
      });
      await mutateTags();
      setTagIds((prev) => [...prev, tag.id]);
    } catch {
      toast.error("Не удалось создать тег");
    }
  };

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Укажите название задачи");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description,
        assigneeId: assigneeId === NO_ASSIGNEE ? null : assigneeId,
        importance,
        urgency,
        startDate: fromDateInputValue(startDate),
        dueDate: fromDateInputValue(dueDate),
        tagIds,
      };

      if (existing) {
        await apiPatch(`/api/tasks/${existing.id}`, payload);
        if (columnId !== existing.columnId) {
          const destCount = tasks.filter((t) => t.columnId === columnId).length;
          await apiPost(`/api/tasks/${existing.id}/move`, {
            toColumnId: columnId,
            toIndex: destCount,
          });
        }
      } else {
        await apiPost("/api/tasks", { ...payload, columnId });
      }

      await mutateTasks();
      toast.success(existing ? "Задача обновлена" : "Задача создана");
      onOpenChange(false);
    } catch {
      toast.error("Не удалось сохранить задачу");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setSaving(true);
    try {
      await apiDelete(`/api/tasks/${existing.id}`);
      await mutateTasks();
      toast.success("Задача удалена");
      onOpenChange(false);
    } catch {
      toast.error("Не удалось удалить задачу");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Задача" : "Новая задача"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Название</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-description">Описание</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Колонка</Label>
              <Select
                value={columnId}
                onValueChange={(v) => setColumnId(v as string)}
                itemToStringLabel={(v) => columns.find((c) => c.id === v)?.name ?? ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Колонка" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Исполнитель</Label>
              <Select
                value={assigneeId}
                onValueChange={(v) => setAssigneeId(v as string)}
                itemToStringLabel={(v) =>
                  v === NO_ASSIGNEE
                    ? "Не назначен"
                    : (users.find((u) => u.id === v)?.name ?? "")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Не назначен" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ASSIGNEE}>Не назначен</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Важность</Label>
              <Select
                value={importance}
                onValueChange={(v) => setImportance(v as Level)}
                itemToStringLabel={(v) => LEVEL_LABELS[v as Level] ?? ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Критичность</Label>
              <Select
                value={urgency}
                onValueChange={(v) => setUrgency(v as Level)}
                itemToStringLabel={(v) => LEVEL_LABELS[v as Level] ?? ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-start">Начало</Label>
              <Input
                id="task-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-due">Срок</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Тэги</Label>
            <TagPicker
              tags={tags}
              selectedIds={tagIds}
              onToggle={toggleTag}
              onCreate={handleCreateTag}
            />
          </div>
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          {isEditing ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              Удалить
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={handleSave} disabled={saving}>
            {isEditing ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
