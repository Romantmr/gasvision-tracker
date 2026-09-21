"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/types";

const PALETTE = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

export function TagPicker({
  tags,
  selectedIds,
  onToggle,
  onCreate,
}: {
  tags: Tag[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
  onCreate: (name: string, color: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed) {
      const color = PALETTE[tags.length % PALETTE.length];
      onCreate(trimmed, color);
    }
    setName("");
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => {
        const selected = selectedIds.includes(tag.id);
        return (
          <button
            type="button"
            key={tag.id}
            onClick={() => onToggle(tag.id)}
            className="focus:outline-none"
          >
            <Badge
              variant={selected ? "default" : "outline"}
              style={
                selected
                  ? { backgroundColor: tag.color, borderColor: tag.color }
                  : { borderColor: tag.color, color: tag.color }
              }
              className={cn("cursor-pointer", !selected && "bg-transparent")}
            >
              {tag.name}
            </Badge>
          </button>
        );
      })}

      {adding ? (
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setAdding(false);
          }}
          placeholder="Новый тег"
          className="h-6 w-28 px-2 text-xs"
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 gap-1 px-2 text-xs"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3" /> Тег
        </Button>
      )}
    </div>
  );
}
