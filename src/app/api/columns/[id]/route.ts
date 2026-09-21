import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { columnUpdateSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = columnUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Неверные данные" },
      { status: 400 },
    );
  }

  const column = await prisma.column.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ column });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const column = await prisma.column.findUnique({ where: { id } });
  if (!column) {
    return NextResponse.json({ error: "Колонка не найдена" }, { status: 404 });
  }
  if (column.isSystem) {
    return NextResponse.json(
      { error: "Системную колонку нельзя удалить" },
      { status: 400 },
    );
  }

  const fallbackColumn = await prisma.column.findFirst({
    where: { isSystem: true, id: { not: id } },
    orderBy: { order: "asc" },
  });

  await prisma.$transaction(async (tx) => {
    if (fallbackColumn) {
      const fallbackCount = await tx.task.count({
        where: { columnId: fallbackColumn.id },
      });
      const orphanTasks = await tx.task.findMany({
        where: { columnId: id },
        orderBy: { order: "asc" },
      });
      await Promise.all(
        orphanTasks.map((task, index) =>
          tx.task.update({
            where: { id: task.id },
            data: { columnId: fallbackColumn.id, order: fallbackCount + index },
          }),
        ),
      );
    }
    await tx.column.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
