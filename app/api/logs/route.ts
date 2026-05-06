import { NextResponse } from "next/server";
import { turso, ensureTables } from "@/lib/turso-server";

export async function GET() {
  console.log("Acessando API de Logs");
  try {
    const result = await turso.execute(
      "SELECT * FROM logs ORDER BY dataHora DESC LIMIT 100",
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { acao, detalhes } = await req.json();
    const id = crypto.randomUUID();
    const dataHora = new Date().toISOString();

    await turso.execute({
      sql: "INSERT INTO logs (id, acao, detalhes, dataHora) VALUES (?, ?, ?, ?)",
      args: [id, acao, detalhes, dataHora],
    });

    return NextResponse.json({ id, acao, detalhes, dataHora });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao registrar log" },
      { status: 500 },
    );
  }
}
