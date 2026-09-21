import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const SYSTEM_COLUMNS = [
  { name: "Новое", order: 0, color: "#6b7280", isSystem: true },
  { name: "В работе", order: 1, color: "#2563eb", isSystem: true },
  { name: "Завершено", order: 2, color: "#16a34a", isSystem: true },
  { name: "Отменено", order: 3, color: "#dc2626", isSystem: true },
];

async function main() {
  const existing = await prisma.column.count();
  if (existing > 0) {
    console.log("Columns already seeded, skipping.");
    return;
  }

  for (const column of SYSTEM_COLUMNS) {
    await prisma.column.create({ data: column });
  }

  console.log("Seeded system columns.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
