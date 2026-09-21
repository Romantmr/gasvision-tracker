import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      userId: null as never,
      unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId, unauthorized: null as null };
}
