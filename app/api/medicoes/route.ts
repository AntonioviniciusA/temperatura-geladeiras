import { NextResponse } from "next/server";
import { turso } from "@/lib/turso-server";

export async function GET() {
  try {
    const hoje = new Date().toISOString().split("T")[0];
    const geladeirasRes = await turso.execute("SELECT id FROM geladeiras");
    const todasIds = geladeirasRes.rows.map((row) => row.id as string);
    const registrosRes = await turso.execute({
      sql: "SELECT * FROM registros_temperatura WHERE DATE(dataHora) = ?",
      args: [hoje],
    });
    const registros = registrosRes.rows.map((row) => ({
      id: row.id,
      geladeiraId: row.geladeiraId,
      temperatura: row.temperatura,
      dataHora: row.dataHora,
    }));
    const medidasIds = new Set(registros.map((r) => r.geladeiraId));
    const concluida =
      todasIds.length > 0 && todasIds.every((id) => medidasIds.has(id));
    return NextResponse.json({ data: hoje, concluida, registros });
  } catch (error) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
