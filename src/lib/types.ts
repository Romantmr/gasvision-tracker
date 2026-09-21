export type Level = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Column {
  id: string;
  name: string;
  order: number;
  color: string;
  isSystem: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  order: number;
  importance: Level;
  urgency: Level;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  columnId: string;
  assigneeId: string | null;
  creatorId: string;
  assignee: UserSummary | null;
  creator: UserSummary;
  tags: { tag: Tag }[];
}

export const LEVEL_LABELS: Record<Level, string> = {
  LOW: "Низкая",
  MEDIUM: "Средняя",
  HIGH: "Высокая",
  CRITICAL: "Критическая",
};

export const LEVEL_COLORS: Record<Level, string> = {
  LOW: "#6b7280",
  MEDIUM: "#2563eb",
  HIGH: "#d97706",
  CRITICAL: "#dc2626",
};
