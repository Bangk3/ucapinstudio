import { getServerSession } from "@/lib/session";
import { type NextRequest, NextResponse } from "next/server";

const CSV_CONTENT = [
  "name,phone,category,plusOne,dietaryNotes",
  "Budi Santoso,+628123456789,keluarga,false,",
  "Ani Rahayu,+628987654321,rekan,true,vegetarian",
].join("\r\n");

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, _ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return new NextResponse(CSV_CONTENT, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tamu-template.csv"',
      "Content-Encoding": "identity",
    },
  });
}
