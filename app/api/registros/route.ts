import { NextResponse } from "next/server";
import { turso } from "@/lib/turso-server";

export async function GET() {
  try {
    const result = await turso.execute(
      "SELECT * FROM registros_temperatura ORDER BY dataHora DESC",
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar registros" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { geladeiraId, temperatura } = await req.json();
    const id = crypto.randomUUID();
    const dataHora = new Date().toISOString();

    await turso.execute({
      sql: "INSERT INTO registros_temperatura (id, geladeiraId, temperatura, dataHora) VALUES (?, ?, ?, ?)",
      args: [id, geladeiraId, temperatura, dataHora],
    });

    return NextResponse.json({ id, geladeiraId, temperatura, dataHora });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao registrar" }, { status: 500 });
  }
}
