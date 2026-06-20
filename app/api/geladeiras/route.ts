import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb, ensureTables } from "@/lib/db";
import { geladeiras } from "@/lib/schema";
import { addLog } from "@/lib/logs";

export async function GET() {
  try {
    await ensureTables();
    const db = getDb();
    const result = await db.select().from(geladeiras).orderBy(geladeiras.ordem);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar geladeiras" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb();
    const { codigo, descricao, local } = await req.json();
    const id = crypto.randomUUID();
    const criadoEm = new Date().toISOString();

    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(geladeiras);
    const ordem = Number(countResult[0]?.count ?? 0);

    await db.insert(geladeiras).values({
      id,
      codigo,
      descricao,
      local,
      criadoEm,
      ordem,
    });

    await addLog(
      "Criar Geladeira",
      `Nova geladeira: ${codigo} - ${descricao} (${local})`,
    );

    return NextResponse.json({ id, codigo, descricao, local, criadoEm, ordem });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const db = getDb();
    const { id, ordem } = await req.json();

    await db.update(geladeiras).set({ ordem }).where(eq(geladeiras.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar ordem" },
      { status: 500 },
    );
  }
}
