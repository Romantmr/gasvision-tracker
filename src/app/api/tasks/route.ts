import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { taskCreateSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

export const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
  tags: { include: { tag: true } },
} as const;

export async function GET() {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const tasks = await prisma.task.findMany({
    include: taskInclude,
    orderBy: [{ columnId: "asc" }, { order: "asc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const parsed = taskCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Неверные данные" },
      { status: 400 },
    );
  }

  const { tagIds, columnId, ...data } = parsed.data;

  const count = await prisma.task.count({ where: { columnId } });

  const task = await prisma.task.create({
    data: {
      ...data,
      columnId,
      order: count,
      creatorId: userId,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      tags: tagIds.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: taskInclude,
  });

  return NextResponse.json({ task }, { status: 201 });
}
