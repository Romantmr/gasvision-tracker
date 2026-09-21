import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { columnCreateSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const columns = await prisma.column.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ columns });
}

export async function POST(request: Request) {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const parsed = columnCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Неверные данные" },
      { status: 400 },
    );
  }

  const count = await prisma.column.count();
  const column = await prisma.column.create({
    data: { ...parsed.data, order: count, isSystem: false },
  });

  return NextResponse.json({ column }, { status: 201 });
}
