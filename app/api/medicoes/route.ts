import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { geladeiras, registrosTemperatura } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const hoje = new Date().toISOString().split("T")[0];
    const todasIds = (
      await db.select({ id: geladeiras.id }).from(geladeiras)
    ).map((row) => row.id);

    const registros = await db
      .select()
      .from(registrosTemperatura)
      .where(eq(registrosTemperatura.dataHora, hoje));

    const medidasIds = new Set(registros.map((r) => r.geladeiraId));
    const concluida =
      todasIds.length > 0 && todasIds.every((id) => medidasIds.has(id));
    return NextResponse.json({ data: hoje, concluida, registros });
  } catch (error) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
