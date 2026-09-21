import { z } from "zod";

export const levelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Укажите название").max(200),
  description: z.string().max(5000).optional().default(""),
  columnId: z.string().min(1),
  assigneeId: z.string().min(1).nullable().optional(),
  importance: levelSchema.optional().default("MEDIUM"),
  urgency: levelSchema.optional().default("MEDIUM"),
  startDate: z.iso.datetime({ offset: true }).nullable().optional(),
  dueDate: z.iso.datetime({ offset: true }).nullable().optional(),
  tagIds: z.array(z.string().min(1)).optional().default([]),
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  importance: levelSchema.optional(),
  urgency: levelSchema.optional(),
  startDate: z.iso.datetime({ offset: true }).nullable().optional(),
  dueDate: z.iso.datetime({ offset: true }).nullable().optional(),
  tagIds: z.array(z.string().min(1)).optional(),
});

export const taskMoveSchema = z.object({
  toColumnId: z.string().min(1),
  toIndex: z.number().int().min(0),
});

export const columnCreateSchema = z.object({
  name: z.string().trim().min(1, "Укажите название").max(50),
  color: z.string().trim().min(1).max(20).optional().default("#6b7280"),
});

export const columnUpdateSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  color: z.string().trim().min(1).max(20).optional(),
});

export const columnReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const tagCreateSchema = z.object({
  name: z.string().trim().min(1, "Укажите название").max(30),
  color: z.string().trim().min(1).max(20).optional().default("#6b7280"),
});
