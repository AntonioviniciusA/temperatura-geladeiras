import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logs } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const result = await db
      .select()
      .from(logs)
      .orderBy(sql`${logs.dataHora} DESC`)
      .limit(100);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb();
    const { acao, detalhes } = await req.json();
    const id = crypto.randomUUID();
    const dataHora = new Date().toISOString();

    await db.insert(logs).values({ id, acao, detalhes, dataHora });

    return NextResponse.json({ id, acao, detalhes, dataHora });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao registrar log" },
      { status: 500 },
    );
  }
}
