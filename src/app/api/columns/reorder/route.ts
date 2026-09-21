import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { columnReorderSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const parsed = columnReorderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Неверные данные" },
      { status: 400 },
    );
  }

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, order) =>
      prisma.column.update({ where: { id }, data: { order } }),
    ),
  );

  return NextResponse.json({ ok: true });
}
