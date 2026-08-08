import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { registrosTemperatura, geladeiras } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const [geladeirasResult, registrosResult] = await Promise.all([
      db
        .select()
        .from(geladeiras)
        .orderBy(sql`${geladeiras.ordem} ASC`),
      db
        .select({
          id: registrosTemperatura.id,
          geladeiraId: registrosTemperatura.geladeiraId,
          temperatura: registrosTemperatura.temperatura,
          dataHora: registrosTemperatura.dataHora,
          geladeiraCodigo: geladeiras.codigo,
          geladeiraDescricao: geladeiras.descricao,
          geladeiraLocal: geladeiras.local,
        })
        .from(registrosTemperatura)
        .leftJoin(
          geladeiras,
          eq(registrosTemperatura.geladeiraId, geladeiras.id),
        )
        .orderBy(sql`${registrosTemperatura.dataHora} DESC`),
    ]);

    return NextResponse.json({
      geladeiras: geladeirasResult,
      registros: registrosResult,
      geradoEm: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar dados" },
      { status: 500 },
    );
  }
}
