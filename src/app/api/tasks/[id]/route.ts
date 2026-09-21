import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { taskUpdateSchema } from "@/lib/schemas";
import { taskInclude } from "@/app/api/tasks/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = taskUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Неверные данные" },
      { status: 400 },
    );
  }

  const { tagIds, startDate, dueDate, ...rest } = parsed.data;

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate !== undefined && {
        startDate: startDate ? new Date(startDate) : null,
      }),
      ...(dueDate !== undefined && {
        dueDate: dueDate ? new Date(dueDate) : null,
      }),
      ...(tagIds !== undefined && {
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        },
      }),
    },
    include: taskInclude,
  });

  return NextResponse.json({ task });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
