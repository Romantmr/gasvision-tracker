"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddColumnButton({
  onAdd,
}: {
  onAdd: (name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed) onAdd(trimmed);
    setName("");
    setAdding(false);
  };

  if (!adding) {
    return (
      <Button
        variant="ghost"
        className="h-10 w-64 shrink-0 justify-start rounded-xl border border-dashed text-muted-foreground hover:border-solid hover:text-foreground"
        onClick={() => setAdding(true)}
      >
        <Plus className="h-4 w-4" /> Добавить колонку
      </Button>
    );
  }

  return (
    <div className="h-fit w-64 shrink-0 space-y-1 rounded-xl border bg-card p-2 shadow-sm">
      <Input
        autoFocus
        placeholder="Название колонки"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setAdding(false);
        }}
        className="h-8 bg-background"
      />
      <div className="flex gap-1">
        <Button size="sm" className="h-7" onClick={submit}>
          Добавить
        </Button>
        <Button size="sm" variant="ghost" className="h-7" onClick={() => setAdding(false)}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
