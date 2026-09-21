import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { tagCreateSchema } from "@/lib/schemas";

export async function GET() {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const parsed = tagCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Неверные данные" },
      { status: 400 },
    );
  }

  const existing = await prisma.tag.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) return NextResponse.json({ tag: existing }, { status: 200 });

  const tag = await prisma.tag.create({ data: parsed.data });
  return NextResponse.json({ tag }, { status: 201 });
}
