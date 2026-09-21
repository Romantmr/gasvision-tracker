"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import type { Column, Tag, Task, UserSummary } from "@/lib/types";

// Stable empty-array fallbacks: `data?.x ?? []` would allocate a *new* array
// literal on every render while `data` is still undefined, which changes
// referential identity each time and can loop any effect keyed on it.
const EMPTY_TASKS: Task[] = [];
const EMPTY_COLUMNS: Column[] = [];
const EMPTY_TAGS: Tag[] = [];
const EMPTY_USERS: UserSummary[] = [];

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<{ tasks: Task[] }>(
    "/api/tasks",
    fetcher,
  );
  return { tasks: data?.tasks ?? EMPTY_TASKS, error, isLoading, mutate };
}

export function useColumns() {
  const { data, error, isLoading, mutate } = useSWR<{ columns: Column[] }>(
    "/api/columns",
    fetcher,
  );
  return { columns: data?.columns ?? EMPTY_COLUMNS, error, isLoading, mutate };
}

export function useTags() {
  const { data, error, isLoading, mutate } = useSWR<{ tags: Tag[] }>(
    "/api/tags",
    fetcher,
  );
  return { tags: data?.tags ?? EMPTY_TAGS, error, isLoading, mutate };
}

export function useUsers() {
  const { data, error, isLoading } = useSWR<{ users: UserSummary[] }>(
    "/api/users",
    fetcher,
  );
  return { users: data?.users ?? EMPTY_USERS, error, isLoading };
}
