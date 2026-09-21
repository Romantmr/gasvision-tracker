import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { taskMoveSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = taskMoveSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Неверные данные" },
      { status: 400 },
    );
  }
  const { toColumnId, toIndex } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({ where: { id } });
    const fromColumnId = task.columnId;

    const destSiblings = await tx.task.findMany({
      where: { columnId: toColumnId, id: { not: id } },
      orderBy: { order: "asc" },
    });
    destSiblings.splice(Math.min(toIndex, destSiblings.length), 0, task);

    await Promise.all(
      destSiblings.map((sibling, index) =>
        tx.task.update({
          where: { id: sibling.id },
          data: { columnId: toColumnId, order: index },
        }),
      ),
    );

    if (fromColumnId !== toColumnId) {
      const sourceSiblings = await tx.task.findMany({
        where: { columnId: fromColumnId, id: { not: id } },
        orderBy: { order: "asc" },
      });
      await Promise.all(
        sourceSiblings.map((sibling, index) =>
          tx.task.update({ where: { id: sibling.id }, data: { order: index } }),
        ),
      );
    }
  });

  return NextResponse.json({ ok: true });
}
